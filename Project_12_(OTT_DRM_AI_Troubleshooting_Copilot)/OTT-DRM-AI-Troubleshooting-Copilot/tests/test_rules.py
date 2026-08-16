from drm_copilot.models import IncidentInput
from drm_copilot.parsers import extract_signals
from drm_copilot.rules import diagnose_with_rules


def _top_cause(**kwargs):
    incident = IncidentInput(summary=kwargs.pop("summary", "Playback failure on test device"), **kwargs)
    result = diagnose_with_rules(incident, extract_signals(incident))
    assert round(sum(c.probability for c in result.root_causes), 1) == 100.0
    return result.root_causes[0].cause


def test_widevine_l3_policy_mismatch_is_top_cause():
    assert _top_cause(security_level="L3", required_security_level="L1") == "DRM security-level policy mismatch"


def test_hdcp_mismatch_is_top_cause():
    assert _top_cause(hdcp_version="1.4", required_hdcp="2.2") == "HDCP/output-protection restriction"


def test_license_403_is_top_cause():
    assert _top_cause(license_status_code=403) == "License authorization/acquisition failure"


def test_segment_failure_is_top_cause():
    assert _top_cause(player_logs="video segment request returned 403") == "CDN or media-segment delivery failure"

