from __future__ import annotations

import csv
import json
from pathlib import Path

ROOT = Path(__file__).parents[1]
DATA = ROOT / "data"
VERIFIED_AT = "2026-08-16"


def read_jsonl(path: Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def write_jsonl(path: Path, rows: list[dict]) -> None:
    path.write_text("\n".join(json.dumps(row, separators=(",", ":")) for row in rows) + "\n", encoding="utf-8")


def build_knowledge() -> list[dict]:
    base = read_jsonl(DATA / "knowledge_base.jsonl")[:10]
    topics = {
        "Widevine": [
            ("robustness negotiation", "Compare requested EME robustness with the CDM response and service policy. A rejected robustness string can prevent session creation before any license request."),
            ("offline licenses", "For offline playback, verify persistent-license support, stored key-set identifiers, expiry, renewal, and device clock. Reproduce with a freshly downloaded title."),
            ("secure surfaces", "On Android, correlate MediaCrypto, secure decoder requirements, and the rendering surface. A license can be usable while frames cannot reach a protected output surface."),
            ("provisioning", "Separate provisioning failures from content-license failures. Capture the CDM provisioning state and retry on a known-good network without storing provisioning payloads."),
        ],
        "FairPlay": [
            ("SPC and CKC correlation", "Trace content identifier, application certificate, SPC generation, CKC HTTP response, and AVContentKeySession processing as one request chain."),
            ("certificate validation", "Confirm the correct FairPlay application certificate is selected for the environment and that certificate bytes are delivered without text encoding changes."),
            ("offline keys", "Validate persistable content-key requests, storage lifecycle, rental expiry, and renewal behavior separately from online streaming playback."),
            ("AirPlay output", "When playback differs during AirPlay or external display use, compare route changes, output-protection state, selected rendition, and CoreMedia errors."),
        ],
        "PlayReady": [
            ("security levels", "Compare the client security level and hardware DRM capability with the license policy and selected UHD representation."),
            ("protection headers", "Decode the PlayReady Object or protection header and compare KIDs, license URL, custom data, and packaging output."),
            ("individualization", "Distinguish client individualization or provisioning errors from license authorization failures by testing the same account on a known-good client."),
            ("output restrictions", "Inspect license output-protection levels and the active display chain; an HTTP 200 license response can still carry rights that restrict playback."),
        ],
        "HLS": [
            ("playlist continuity", "Check media sequence, discontinuity sequence, target duration, segment timeline, and live-window updates when playback stalls or jumps."),
            ("FairPlay key tags", "Validate EXT-X-KEY or EXT-X-SESSION-KEY method, KEYFORMAT, URI, key rotation boundaries, and content identifier mapping."),
            ("low latency", "For LL-HLS, correlate partial segments, preload hints, blocking reloads, rendition reports, cache behavior, and player hold-back settings."),
            ("variant compatibility", "Verify CODECS and RESOLUTION declarations describe the actual media and that the player filters unsupported variants before ABR selection."),
        ],
        "MPEG-DASH": [
            ("timeline validation", "Inspect SegmentTemplate, SegmentTimeline, timescale, presentationTimeOffset, period boundaries, and availability windows for gaps or overlaps."),
            ("content protection", "Compare ContentProtection system IDs, default_KID, PSSH boxes, encrypted-track KIDs, and the license key database."),
            ("dynamic MPD", "For live DASH, verify availabilityStartTime, publishTime, minimumUpdatePeriod, timeShiftBufferDepth, and client clock synchronization."),
            ("representation selection", "Record the selected AdaptationSet and Representation, codec string, profile, level, bandwidth, HDR metadata, and secure-decoder requirement."),
        ],
        "HDCP": [
            ("display chain isolation", "Test direct-to-display before adding receivers, splitters, docks, adapters, or capture hardware. Record the negotiated HDCP version at each topology."),
            ("output-restricted keys", "Treat output-restricted key status as direct evidence that license output policy and the current display path are incompatible."),
            ("hot-plug changes", "Capture HDMI hot-plug and route-change events because HDCP renegotiation can invalidate a previously working protected playback session."),
            ("resolution fallback", "Test whether an allowed HD or SD tier plays on the same path. Successful fallback separates output policy from general license or CDN failure."),
        ],
        "CENC/PSSH": [
            ("system ID mapping", "Identify every PSSH system ID and ensure the intended DRM client receives compatible initialization data."),
            ("key rotation", "At rotation boundaries, compare new KIDs, PSSH updates, license keys, segment encryption metadata, and player session renewal behavior."),
            ("scheme compatibility", "Confirm cenc or cbcs scheme support across packager, manifest, DRM, player, and device; do not infer scheme support from codec support."),
            ("track inspection", "Inspect tenc, schm, saiz, saio, senc, and sample-group signaling when manifest metadata appears correct but decryption still fails."),
        ],
        "License acquisition": [
            ("authorization headers", "Compare redacted working and failing requests for bearer-token freshness, cookies, custom data, origin, device binding, and required headers."),
            ("HTTP status triage", "Use 401 and 403 for authorization investigation, 429 for rate limiting, and 5xx for service dependency investigation, then correlate request IDs."),
            ("usable rights", "After HTTP success, inspect CDM processing, key status, expiry, output restrictions, and KID coverage; transport success is not license usability."),
            ("clock and expiry", "Validate device clock, token not-before and expiry, license duration, playback duration, and renewal timing for intermittent authorization failures."),
        ],
        "CDN": [
            ("signed URL preservation", "Trace redirects and manifest-relative URL resolution to ensure signed query parameters and authorization headers reach every media request."),
            ("range requests", "Compare Range request and Content-Range response behavior at edge and origin when fragmented MP4 initialization or seeking fails."),
            ("regional isolation", "Run identical probes from working and failing regions, preserving DNS, edge POP, cache status, request ID, status, and origin timing."),
            ("cache correctness", "Include DRM and rendition-varying request attributes in cache analysis to prevent stale manifests, wrong keys, or cross-policy response reuse."),
        ],
        "Player errors": [
            ("error normalization", "Map native player, OS, CDM, manifest, decoder, and network errors into a common taxonomy while retaining the original code and timestamp."),
            ("fatal versus retryable", "Record severity, retry count, backoff, recovery action, and final state so transient network events are not mistaken for fatal DRM failures."),
            ("session correlation", "Join manifest, license, segment, decoder, and render events with one session identifier and a monotonic timeline."),
            ("known-good control", "Repeat the same asset and account on a known-good device and repeat a known-good asset on the failing device to isolate asset versus client scope."),
        ],
    }
    generated: list[dict] = []
    number = 1
    for topic, entries in topics.items():
        for label, guidance in entries:
            generated.append(
                {
                    "id": f"kb-runbook-{number:03d}",
                    "title": f"{topic}: {label}",
                    "topic": topic,
                    "tags": [topic.lower(), *label.split()],
                    "source_type": "internal QA runbook starter",
                    "source_url": "",
                    "verified_at": VERIFIED_AT,
                    "content": guidance + " Capture only redacted evidence and document the discriminating test and observed result.",
                }
            )
            number += 1
    return base + generated


def build_incidents() -> list[dict]:
    base = read_jsonl(DATA / "historical_incidents.jsonl")[:6]
    scenarios = [
        ("Widevine policy", "L3 device requested an L1-only UHD tier", "CDM reported L3 and HD fallback worked", "robustness policy mismatch", "verify the title on an L1 reference device"),
        ("HDCP", "protected video became black on an external display path", "output-restricted status appeared after route change", "display chain negotiated below policy", "connect directly to a known HDCP 2.2 display"),
        ("Codec", "audio played while video decoder creation failed", "selected representation required an unsupported secure profile", "codec and secure-decoder incompatibility", "force the AVC compatibility rendition"),
        ("License", "encrypted playback failed while clear playback succeeded", "license endpoint returned 403 with an expired entitlement", "authorization token expiry", "refresh entitlement and correlate the request ID"),
        ("CENC/PSSH", "license returned successfully but no key became usable", "manifest KID and encrypted track KID differed", "stale packaging metadata", "inspect PSSH and tenc KIDs together"),
        ("CDN", "startup failed after manifest and license success", "first video segment returned 403 at one edge", "signed media URL was lost during redirect", "preserve query parameters through redirects"),
        ("HLS", "live playback stalled at a discontinuity", "media sequence advanced without matching discontinuity state", "playlist continuity error", "validate sequence values across origin and edge"),
        ("MPEG-DASH", "live playback repeatedly jumped behind the live edge", "client clock differed from MPD timing by several seconds", "clock synchronization error", "synchronize UTC timing and replay"),
        ("FairPlay", "SPC generation succeeded but CKC processing failed", "wrong environment certificate was selected", "FairPlay certificate mismatch", "repeat with the matching application certificate"),
        ("PlayReady", "UHD license processed but output stayed restricted", "license OPL exceeded the active display path", "PlayReady output protection policy", "test an allowed HD tier on the same client"),
        ("ABR", "player oscillated between renditions and rebuffered", "short throughput samples overestimated available bandwidth", "unstable ABR estimation", "pin a sustainable representation and compare buffer health"),
    ]
    environments = ["Android TV lab", "web reference player", "smart-TV QA rack", "set-top-box staging"]
    generated = []
    for index, (topic, symptom, evidence, cause, confirmation) in enumerate(scenarios * 4, 7):
        environment = environments[(index - 7) % len(environments)]
        generated.append(
            {
                "id": f"inc-synth-{index:03d}",
                "title": f"Synthetic: {topic} investigation on {environment}",
                "topic": topic,
                "tags": ["synthetic", topic.lower(), environment.lower()],
                "source_type": "synthetic incident",
                "source_url": "",
                "verified_at": VERIFIED_AT,
                "content": f"Synthetic QA scenario. Environment: {environment}. Symptom: {symptom}. Evidence: {evidence}. Root cause: {cause}. Confirmation: {confirmation}.",
            }
        )
    return base + generated


def build_devices() -> list[dict[str, str]]:
    families = [
        ("Android TV", "Widevine", "L1", "2160p", "2.2", "AVC|HEVC Main10|VP9 Profile 2", "yes", "HDR10"),
        ("Android TV", "Widevine", "L3", "720p", "1.4", "AVC", "no", "none"),
        ("Desktop Chrome", "Widevine", "Unknown", "1080p", "Unknown", "AVC|VP9|AV1", "unknown", "none"),
        ("iOS/tvOS", "FairPlay", "hardware", "2160p", "2.2", "AVC|HEVC", "yes", "HDR10|Dolby Vision"),
        ("Safari macOS", "FairPlay", "hardware", "2160p", "2.2", "AVC|HEVC", "yes", "HDR10"),
        ("Windows", "PlayReady", "SL3000", "2160p", "2.2", "AVC|HEVC Main10", "yes", "HDR10"),
        ("Windows", "PlayReady", "SL2000", "1080p", "1.4", "AVC|HEVC", "unknown", "none"),
        ("Fire TV", "Widevine", "L1", "2160p", "2.2", "AVC|HEVC|VP9", "yes", "HDR10"),
        ("Smart TV", "PlayReady", "SL3000", "2160p", "2.2", "AVC|HEVC", "yes", "HDR10"),
        ("QA compatibility", "Multi-DRM", "varies", "1080p", "2.2", "AVC", "yes", "none"),
    ]
    rows = []
    for family_index, family in enumerate(families, 1):
        for variant in range(1, 6):
            platform, drm, level, resolution, hdcp, codecs, secure, hdr = family
            rows.append(
                {
                    "profile_id": f"synth-{family_index:02d}-{variant:02d}",
                    "platform": platform,
                    "device_model": f"SYNTHETIC {platform.upper()} PROFILE {variant}",
                    "drm_system": drm,
                    "security_level": level,
                    "max_resolution": resolution,
                    "max_hdcp": hdcp,
                    "video_codecs": codecs,
                    "secure_decoder": secure,
                    "hdr_formats": hdr,
                    "source": "synthetic",
                    "verified_at": VERIFIED_AT,
                    "notes": "Demonstration profile only; replace with measured lab data before production decisions",
                }
            )
    return rows


def build_evaluations() -> list[dict]:
    scenarios = [
        ("UHD blocked on an L3 Widevine device", {"platform": "Android TV", "drm_system": "Widevine", "security_level": "L3", "required_security_level": "L1", "requested_resolution": "4K/UHD", "player_logs": "Widevine: L3"}, "DRM security-level policy mismatch"),
        ("External display reports an HDCP restriction", {"platform": "Android TV", "hdcp_version": "1.4", "required_hdcp": "2.2", "player_logs": "key status output-restricted; HDCP error"}, "HDCP/output-protection restriction"),
        ("Secure video decoder cannot initialize", {"platform": "Smart TV", "codec": "HEVC Main10", "player_logs": "decoder initialization failed: codec not supported"}, "Codec or decoder incompatibility"),
        ("License request is rejected", {"platform": "Android TV", "license_status_code": 403, "player_logs": "DRM_LICENSE_REQUEST_FAILED"}, "License authorization/acquisition failure"),
        ("License succeeds but packaged key is unusable", {"platform": "Windows", "license_status_code": 200, "player_logs": "no usable key; KID mismatch"}, "Manifest, PSSH, or KID configuration error"),
        ("Media delivery fails after license success", {"platform": "Desktop", "license_status_code": 200, "player_logs": "video segment request 403"}, "CDN or media-segment delivery failure"),
    ]
    rows = []
    for index in range(50):
        summary, inputs, expected = scenarios[index % len(scenarios)]
        rows.append({"case_id": f"eval-{index + 1:03d}", "summary": f"{summary} — synthetic variant {index + 1}", "inputs": inputs, "expected_top_cause": expected})
    return rows


def main() -> None:
    knowledge = build_knowledge()
    incidents = build_incidents()
    devices = build_devices()
    evaluations = build_evaluations()
    write_jsonl(DATA / "knowledge_base.jsonl", knowledge)
    write_jsonl(DATA / "historical_incidents.jsonl", incidents)
    write_jsonl(DATA / "evaluation_cases.jsonl", evaluations)
    with (DATA / "device_capabilities.csv").open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(devices[0]))
        writer.writeheader()
        writer.writerows(devices)
    print(f"Built {len(knowledge)} knowledge, {len(incidents)} incidents, {len(devices)} devices, and {len(evaluations)} evaluations")


if __name__ == "__main__":
    main()
