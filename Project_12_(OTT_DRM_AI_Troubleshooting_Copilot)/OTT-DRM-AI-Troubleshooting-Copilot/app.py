from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import pandas as pd
import streamlit as st
from dotenv import load_dotenv

ROOT = Path(__file__).parent
sys.path.insert(0, str(ROOT / "src"))

from drm_copilot.models import IncidentInput  # noqa: E402
from drm_copilot.service import analyze_incident  # noqa: E402

load_dotenv()
DATA_DIR = ROOT / "data"

st.set_page_config(page_title="OTT DRM AI Troubleshooting Copilot", page_icon="📺", layout="wide")
st.title("OTT DRM AI Troubleshooting Copilot")
st.caption("Evidence-first diagnosis across device capability, DRM policy, manifests, licenses, logs, and known incidents")

with st.sidebar:
    st.header("Analysis mode")
    has_key = bool(os.getenv("OPENAI_API_KEY"))
    use_ai = st.toggle("AI explanation", value=has_key, disabled=not has_key)
    st.caption("Hybrid mode keeps rule-engine probabilities and uses AI only for grounded explanation.")
    if not has_key:
        st.info("No OPENAI_API_KEY found. Rules and configured RAG retrieval remain available.")
    rag_provider = os.getenv("RAG_PROVIDER", "local").lower()
    st.divider()
    st.header("RAG backend")
    st.write(rag_provider.upper())
    if rag_provider == "pinecone" and not os.getenv("PINECONE_API_KEY"):
        st.info("Add PINECONE_API_KEY and run the indexing script. Local retrieval will be used until then.")
    st.warning("Do not paste production tokens, cookies, customer identifiers, or unredacted license payloads.")

with st.form("incident"):
    st.subheader("1. Describe the failure")
    summary = st.text_area(
        "Incident summary",
        value="4K playback works on Chrome but shows a black screen on Android TV.",
        height=90,
    )
    c1, c2, c3, c4 = st.columns(4)
    platform = c1.selectbox("Platform", ["Android TV", "Chrome desktop", "Apple TV", "iOS", "Windows", "Other"])
    device_model = c2.text_input("Device/model", "Lab Android TV device")
    player = c3.text_input("Player/version", "ExoPlayer / Media3")
    drm_system = c4.selectbox("DRM", ["Widevine", "FairPlay", "PlayReady", "ClearKey", "Unknown"])

    st.subheader("2. Add policy and capability facts")
    c1, c2, c3, c4, c5 = st.columns(5)
    security_level = c1.selectbox("Reported security", ["L3", "L1", "L2", "Unknown"])
    required_security = c2.selectbox("Required security", ["L1", "L3", "Unknown"])
    hdcp_version = c3.selectbox("Reported HDCP", ["Unknown", "1.4", "2.2", "2.3"])
    required_hdcp = c4.selectbox("Required HDCP", ["2.2", "1.4", "Unknown"])
    resolution = c5.selectbox("Requested quality", ["4K/UHD", "1080p", "720p", "Unknown"])
    codec = st.text_input("Selected/expected codec", "HEVC/H.265")

    st.subheader("3. Paste technical evidence")
    manifest = st.text_area("Manifest text (MPD or M3U8; optional)", height=130)
    c1, c2 = st.columns([1, 4])
    status_option = c1.selectbox("License HTTP", ["Not supplied", "200", "400", "401", "403", "500", "503"])
    license_response = c2.text_input("Redacted license response/error", "")
    logs = st.text_area(
        "Redacted player/CDM logs",
        value="Widevine: L3\nvideo error: black screen after license acquisition",
        height=130,
    )
    notes = st.text_area("Other comparison results or notes", height=80)
    submitted = st.form_submit_button("Analyze incident", type="primary", use_container_width=True)

if submitted:
    incident = IncidentInput(
        summary=summary,
        platform=platform,
        device_model=device_model,
        player=player,
        drm_system=drm_system,
        security_level=security_level,
        required_security_level=required_security,
        hdcp_version=hdcp_version,
        required_hdcp=required_hdcp,
        requested_resolution=resolution,
        codec=codec,
        manifest_text=manifest,
        license_status_code=None if status_option == "Not supplied" else int(status_option),
        license_response=license_response,
        player_logs=logs,
        notes=notes,
    )
    try:
        with st.spinner("Correlating signals and known cases..."):
            result = analyze_incident(incident, DATA_DIR, use_ai=use_ai)
    except Exception as exc:
        st.error(f"Analysis failed: {exc}")
        st.stop()

    st.divider()
    st.subheader("Diagnosis")
    st.write(result.executive_summary)
    m1, m2, m3 = st.columns(3)
    m1.metric("Confidence", result.confidence.upper())
    m2.metric("Mode", result.mode.upper())
    m3.metric("RAG", result.retrieval_backend.upper())

    chart_data = pd.DataFrame(
        {"Root cause": [item.cause for item in result.root_causes], "Probability": [item.probability for item in result.root_causes]}
    ).set_index("Root cause")
    st.bar_chart(chart_data, horizontal=True)
    for item in result.root_causes:
        st.write(f"**{item.probability:.1f}% — {item.cause}**")

    st.subheader("Evidence")
    if result.evidence:
        for item in result.evidence:
            st.markdown(f"- **{item.source}:** {item.observation}  \n  _Implication:_ {item.implication}")
    else:
        st.info("No strong evidence was detected. Add logs, manifest, policy, and device facts.")

    st.subheader("Expected behavior")
    st.write(result.expected_behavior)
    st.subheader("Suggested tests")
    for number, test in enumerate(result.suggested_tests, 1):
        st.write(f"{number}. {test}")

    with st.expander("Retrieved knowledge and similar incidents"):
        for source in result.retrieved_sources:
            link = f" — [source]({source.source_url})" if source.source_url else ""
            st.markdown(f"**{source.title}** ({source.source_type}, match {source.score:.2f}){link}")
            st.caption(source.content)
    with st.expander("Parsed signals"):
        st.json(result.parsed_signals)

    for caveat in result.caveats:
        if "Pinecone retrieval was unavailable" in caveat:
            st.info(caveat)

    st.warning("Probabilities are heuristic rankings for triage; validate the leading hypothesis with the suggested tests.")
    st.download_button(
        "Download diagnosis JSON",
        data=json.dumps(result.model_dump(), indent=2),
        file_name="drm_diagnosis.json",
        mime="application/json",
    )
