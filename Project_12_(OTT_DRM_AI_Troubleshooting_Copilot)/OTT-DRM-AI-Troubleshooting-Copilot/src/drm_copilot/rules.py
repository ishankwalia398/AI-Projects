from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from typing import Any

from .models import EvidenceItem, IncidentInput, RootCause


@dataclass
class RuleResult:
    root_causes: list[RootCause]
    evidence: list[EvidenceItem]
    suggested_tests: list[str]
    expected_behavior: str
    confidence: str


BASE_WEIGHTS = {
    "DRM security-level policy mismatch": 5.0,
    "HDCP/output-protection restriction": 4.0,
    "Codec or decoder incompatibility": 4.0,
    "License authorization/acquisition failure": 4.0,
    "Manifest, PSSH, or KID configuration error": 3.0,
    "CDN or media-segment delivery failure": 3.0,
    "Player/device integration issue": 3.0,
}


def _add_evidence(evidence: list[EvidenceItem], source: str, observation: str, implication: str) -> None:
    evidence.append(EvidenceItem(source=source, observation=observation, implication=implication))


def _normalize(weights: dict[str, float], top_n: int = 4) -> list[RootCause]:
    ranked = sorted(weights.items(), key=lambda item: item[1], reverse=True)[:top_n]
    total = sum(value for _, value in ranked) or 1.0
    raw = [(name, value * 100 / total) for name, value in ranked]
    rounded = [(name, round(value, 1)) for name, value in raw]
    correction = round(100 - sum(value for _, value in rounded), 1)
    if rounded:
        rounded[0] = (rounded[0][0], rounded[0][1] + correction)
    return [RootCause(cause=name, probability=value, rationale="Matched diagnostic rules and supplied evidence") for name, value in rounded]


def diagnose_with_rules(incident: IncidentInput, signals: dict[str, Any]) -> RuleResult:
    weights = defaultdict(float, BASE_WEIGHTS)
    evidence: list[EvidenceItem] = []
    tests: list[str] = []
    strong_matches = 0

    level = signals.get("security_level", "UNKNOWN")
    required_level = signals.get("required_security_level", "UNKNOWN")
    if level == "L3" and required_level == "L1":
        weights["DRM security-level policy mismatch"] += 75
        strong_matches += 1
        _add_evidence(evidence, "Device/DRM", f"Device security level is {level}", f"Content requires {required_level}; premium resolution is expected to be denied")
        tests += ["Play the same asset on a verified Widevine L1 device", "Temporarily allow a 1080p or SD policy tier and verify fallback"]

    current_hdcp = signals.get("hdcp_version_number")
    required_hdcp = signals.get("required_hdcp_number")
    if current_hdcp is not None and required_hdcp is not None and current_hdcp < required_hdcp:
        weights["HDCP/output-protection restriction"] += 65
        strong_matches += 1
        _add_evidence(evidence, "Output protection", f"Reported HDCP is {current_hdcp:g}", f"Policy requires HDCP {required_hdcp:g}; the video path may be output-restricted")
        tests += ["Check the HDCP level reported by the player/CDM with the actual display path", "Remove any receiver/splitter and test a known HDCP-compatible cable and display"]

    logs = signals.get("log_signals", {})
    if logs.get("output_restricted"):
        weights["HDCP/output-protection restriction"] += 55
        strong_matches += 1
        _add_evidence(evidence, "Player log", "Output-restriction/HDCP error detected", "The CDM is refusing or limiting protected video output")
    if logs.get("decoder_failure"):
        weights["Codec or decoder incompatibility"] += 55
        strong_matches += 1
        _add_evidence(evidence, "Player log", "Decoder initialization or codec-support failure detected", "The selected representation may not be decodable on this device")
        tests += ["Force an AVC/H.264 rendition and compare with HEVC/VP9/AV1", "Inspect MediaCapabilities or device decoder capability output"]
    if logs.get("license_failure") or signals.get("license_status_code") in {401, 403}:
        weights["License authorization/acquisition failure"] += 60
        strong_matches += 1
        status = signals.get("license_status_code")
        _add_evidence(evidence, "License exchange", f"License failure detected; HTTP status={status or 'not supplied'}", "Token, entitlement, signing, headers, or license policy may be rejecting the request")
        tests += ["Replay the license request with a fresh token and compare request headers/body", "Correlate the request ID with license-server authorization logs"]
    elif signals.get("license_status_code") and signals["license_status_code"] >= 500:
        weights["License authorization/acquisition failure"] += 50
        strong_matches += 1
        _add_evidence(evidence, "License exchange", f"License server returned HTTP {signals['license_status_code']}", "A license-service or upstream dependency failure is likely")
    if logs.get("segment_failure"):
        weights["CDN or media-segment delivery failure"] += 60
        strong_matches += 1
        _add_evidence(evidence, "Player log", "Segment/chunk delivery errors detected", "Playback may fail after manifest load because media objects are unavailable or timing out")
        tests += ["Fetch failing segment URLs from the affected region and compare headers/status", "Compare CDN request IDs and origin logs for the same playback session"]
    if logs.get("pssh_error") or logs.get("key_error"):
        weights["Manifest, PSSH, or KID configuration error"] += 60
        strong_matches += 1
        _add_evidence(evidence, "Player log", "PSSH/key/KID error detected", "Manifest signaling and packaged encryption metadata may not match the license keys")
        tests += ["Decode PSSH and compare system ID/KIDs with the packaging and license database", "Validate that manifest default_KID and encrypted-track KIDs match"]

    if signals.get("manifest_type") == "MPEG-DASH":
        if signals.get("manifest_has_content_protection") and signals.get("pssh_count", 0) == 0:
            weights["Manifest, PSSH, or KID configuration error"] += 25
            _add_evidence(evidence, "DASH manifest", "ContentProtection exists but no inline PSSH was found", "Verify whether initialization data is intentionally carried elsewhere and supported by the player")
        if signals.get("manifest_parse_error"):
            weights["Manifest, PSSH, or KID configuration error"] += 35
            _add_evidence(evidence, "Manifest parser", signals["manifest_parse_error"], "The supplied MPD may be malformed or incomplete")
    elif signals.get("manifest_type") == "HLS" and not signals.get("manifest_has_drm_key"):
        weights["Manifest, PSSH, or KID configuration error"] += 25
        _add_evidence(evidence, "HLS manifest", "No DRM key signaling was found", "A protected stream should be checked for the expected EXT-X-KEY/SESSION-KEY signaling")

    summary = incident.summary.lower()
    if "works on chrome" in summary and any(term in summary for term in ["android tv", "television", "tv"]):
        weights["Player/device integration issue"] += 12
        weights["DRM security-level policy mismatch"] += 8
        weights["Codec or decoder incompatibility"] += 7
        weights["CDN or media-segment delivery failure"] *= 0.55
        _add_evidence(evidence, "Cross-platform comparison", "Same asset works in Chrome but fails on a TV device", "Asset-wide packaging/CDN failure is less likely; device, CDM, policy, or codec differences deserve priority")

    causes = _normalize(weights)
    top = causes[0].cause if causes else "Unknown"
    expected = f"Based on the supplied evidence, playback is expected to fail or be restricted primarily because of: {top}."
    tests = list(dict.fromkeys(tests))[:6]
    if not tests:
        tests = [
            "Capture a full player/CDM log with timestamps and request IDs",
            "Record device DRM level, HDCP status, codecs, player version, and requested rendition",
            "Compare the same asset, account, and network on one known-good device",
            "Inspect manifest, license, and first failing media request as one correlated session",
        ]
    confidence = "high" if strong_matches >= 2 else "medium" if strong_matches == 1 or len(evidence) >= 2 else "low"
    return RuleResult(causes, evidence, tests, expected, confidence)
