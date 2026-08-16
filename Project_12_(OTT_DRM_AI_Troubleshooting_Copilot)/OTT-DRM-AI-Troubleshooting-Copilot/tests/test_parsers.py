from drm_copilot.models import IncidentInput
from drm_copilot.parsers import extract_signals, parse_manifest


def test_parses_hls_master_playlist():
    manifest = '#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=6000000,RESOLUTION=3840x2160,CODECS="hvc1.2.4.L153"\nuhd.m3u8'
    signals = parse_manifest(manifest)
    assert signals["manifest_type"] == "HLS"
    assert "3840x2160" in signals["manifest_resolutions"]
    assert "hvc1.2.4.L153" in signals["manifest_codecs"]


def test_parses_dash_protection_and_pssh():
    manifest = '''<MPD xmlns:cenc="urn:mpeg:cenc:2013">
      <Period><AdaptationSet><ContentProtection schemeIdUri="urn:uuid:edef8ba9-79d6-4ace-a3c8-27dcd51d21ed">
      <cenc:pssh>AAAA</cenc:pssh></ContentProtection><Representation height="2160" codecs="hvc1" />
      </AdaptationSet></Period></MPD>'''
    signals = parse_manifest(manifest)
    assert signals["manifest_type"] == "MPEG-DASH"
    assert signals["pssh_count"] == 1
    assert 2160 in signals["manifest_heights"]


def test_log_level_overrides_unknown_form_value():
    incident = IncidentInput(summary="Playback black screen", player_logs="Widevine: L3")
    signals = extract_signals(incident)
    assert signals["security_level"] == "L3"

