from __future__ import annotations

import re
import xml.etree.ElementTree as ET
from typing import Any

from .models import IncidentInput


def _version_number(value: str) -> float | None:
    match = re.search(r"(\d+(?:\.\d+)?)", value or "")
    return float(match.group(1)) if match else None


def _parse_hls(text: str) -> dict[str, Any]:
    signals: dict[str, Any] = {"manifest_type": "HLS"}
    resolutions: list[str] = []
    codecs: list[str] = []
    keyformats: list[str] = []
    for line in text.splitlines():
        if "RESOLUTION=" in line:
            match = re.search(r"RESOLUTION=([^,]+)", line)
            if match:
                resolutions.append(match.group(1))
        if "CODECS=" in line:
            match = re.search(r'CODECS="([^"]+)"', line)
            if match:
                codecs.extend(part.strip() for part in match.group(1).split(","))
        if line.startswith(("#EXT-X-KEY", "#EXT-X-SESSION-KEY")):
            match = re.search(r'KEYFORMAT="?([^",]+)', line)
            if match:
                keyformats.append(match.group(1))
    signals.update(
        {
            "manifest_resolutions": sorted(set(resolutions)),
            "manifest_codecs": sorted(set(codecs)),
            "manifest_keyformats": sorted(set(keyformats)),
            "manifest_has_drm_key": bool(keyformats or "METHOD=SAMPLE-AES" in text),
        }
    )
    return signals


def _parse_dash(text: str) -> dict[str, Any]:
    signals: dict[str, Any] = {"manifest_type": "MPEG-DASH"}
    try:
        root = ET.fromstring(text)
    except ET.ParseError as exc:
        return {**signals, "manifest_parse_error": str(exc)}

    codecs: set[str] = set()
    heights: set[int] = set()
    schemes: set[str] = set()
    pssh_count = 0
    kids: set[str] = set()
    for element in root.iter():
        local = element.tag.split("}")[-1].lower()
        if element.attrib.get("codecs"):
            codecs.add(element.attrib["codecs"])
        if element.attrib.get("height", "").isdigit():
            heights.add(int(element.attrib["height"]))
        if local == "contentprotection":
            scheme = element.attrib.get("schemeIdUri") or element.attrib.get("schemeiduri")
            if scheme:
                schemes.add(scheme.lower())
            for key, value in element.attrib.items():
                if key.split("}")[-1].lower() == "default_kid":
                    kids.add(value)
        if local == "pssh" and (element.text or "").strip():
            pssh_count += 1
    signals.update(
        {
            "manifest_codecs": sorted(codecs),
            "manifest_heights": sorted(heights),
            "content_protection_schemes": sorted(schemes),
            "pssh_count": pssh_count,
            "default_kids": sorted(kids),
            "manifest_has_content_protection": bool(schemes),
        }
    )
    return signals


def parse_manifest(text: str) -> dict[str, Any]:
    stripped = (text or "").strip()
    if not stripped:
        return {"manifest_type": "not supplied"}
    if stripped.startswith("#EXTM3U"):
        return _parse_hls(stripped)
    if "<MPD" in stripped or "<mpd" in stripped:
        return _parse_dash(stripped)
    return {"manifest_type": "unknown", "manifest_parse_error": "Unrecognized manifest format"}


def parse_logs(text: str) -> dict[str, Any]:
    logs = text or ""
    lower = logs.lower()
    signals: dict[str, Any] = {}
    patterns = {
        "reported_security_level": r"(?:widevine|security(?:_level)?)\s*[:=]\s*(l[123])",
        "reported_hdcp": r"hdcp\s*[:=]\s*(\d(?:\.\d)?)",
        "player_error_code": r"(?:error(?:_code)?|code)\s*[:=]\s*([a-z0-9_.-]+)",
    }
    for name, pattern in patterns.items():
        match = re.search(pattern, lower, re.IGNORECASE)
        if match:
            signals[name] = match.group(1).upper()
    signals.update(
        {
            "output_restricted": any(token in lower for token in ["output-restricted", "output restricted", "hdcp error"]),
            "decoder_failure": any(token in lower for token in ["decoder initialization failed", "decoder_init_failed", "codec not supported", "media.codec"]),
            "license_failure": any(token in lower for token in ["license request failed", "license acquisition failed", "drm_license_request_failed"]),
            "segment_failure": bool(re.search(r"(?:segment|chunk|fragment).*(?:403|404|5\d\d|timeout)", lower)),
            "pssh_error": any(token in lower for token in ["missing pssh", "invalid pssh", "pssh parse"]),
            "key_error": any(token in lower for token in ["key status expired", "no usable key", "keyids mismatch", "kid mismatch"]),
        }
    )
    return signals


def extract_signals(incident: IncidentInput) -> dict[str, Any]:
    signals = {
        "security_level": incident.security_level.upper(),
        "required_security_level": incident.required_security_level.upper(),
        "hdcp_version_number": _version_number(incident.hdcp_version),
        "required_hdcp_number": _version_number(incident.required_hdcp),
        "requested_resolution": incident.requested_resolution,
        "codec": incident.codec.lower(),
        "license_status_code": incident.license_status_code,
    }
    signals.update(parse_manifest(incident.manifest_text))
    log_signals = parse_logs(incident.player_logs)
    signals["log_signals"] = log_signals
    if signals["security_level"] == "UNKNOWN" and log_signals.get("reported_security_level"):
        signals["security_level"] = log_signals["reported_security_level"]
    if signals["hdcp_version_number"] is None and log_signals.get("reported_hdcp"):
        signals["hdcp_version_number"] = _version_number(log_signals["reported_hdcp"])
    return signals

