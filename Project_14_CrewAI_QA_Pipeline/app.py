import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / "src"))

import streamlit as st
from dotenv import load_dotenv

from jira_qa_crew.config import Settings
from jira_qa_crew.crew.factory import QACrewFactory
from jira_qa_crew.jira.gateway import JiraGateway
from jira_qa_crew.jira.mcp_provider import JiraMCPProvider
from jira_qa_crew.jira.rest_provider import JiraRestProvider
from jira_qa_crew.services.pipeline import PipelineService
from jira_qa_crew.services.validation import parse_ticket_keys
from jira_qa_crew.ui.results import render_results
from jira_qa_crew.ui.theme import apply_theme

st.set_page_config(page_title="Jira QA Crew", page_icon="🧪", layout="wide")
load_dotenv(override=True)
settings = Settings()
if "theme" not in st.session_state: st.session_state.theme = "Dark"
if "qa_processing" not in st.session_state: st.session_state.qa_processing = False
if "qa_error" not in st.session_state: st.session_state.qa_error = None
if "qa_notice" not in st.session_state: st.session_state.qa_notice = None


def begin_qa_run():
    st.session_state.qa_processing = True
    st.session_state.qa_error = None
    st.session_state.qa_notice = None


with st.sidebar:
    st.session_state.theme = st.segmented_control("Appearance", ["Light", "Dark"], default=st.session_state.theme)
    st.markdown("### Configuration")
    st.caption("Values are loaded from environment variables or Streamlit secrets; secrets are never displayed.")
apply_theme(st.session_state.theme or "Dark")

st.title("Jira QA Crew")
st.markdown('<p class="qa-subtitle">Generate test plans, test cases, traceability, and Playwright automation directly from Jira.</p>', unsafe_allow_html=True)
if settings.demo_mode: st.warning("DEMO_MODE is enabled. Demo data is never used as fallback for live failures.")

left, right = st.columns([3, 1])
with left: raw = st.text_area("Jira ticket IDs", height=130, max_chars=10_000)
with right:
    label = st.selectbox("Integration mode", ["Auto", "MCP only", "REST only"])
    mode = {"Auto": "auto", "MCP only": "mcp", "REST only": "rest"}[label]
    errors = settings.validate(mode)
    if errors:
        st.error("Configuration needs attention")
        for e in errors: st.caption(f"• {e}")
    else: st.success("Configuration ready")
with st.expander("Advanced settings"):
    st.write({
        "Primary LLM": settings.llm_primary_model,
        "Primary endpoint": settings.llm_primary_base_url,
        "Fallback enabled": settings.llm_fallback_enabled,
        "Fallback LLM": settings.llm_fallback_model if settings.llm_fallback_enabled else "Disabled",
        "Maximum tickets": settings.max_tickets,
        "Ticket timeout": settings.ticket_timeout,
        "LLM temperature": settings.llm_temperature,
        "Maximum output tokens": settings.llm_max_output_tokens,
        "MCP transport": settings.mcp_transport,
    })

st.button(
    "Generating QA Pack..." if st.session_state.qa_processing else "Analyze & Generate QA Pack",
    type="primary",
    use_container_width=True,
    disabled=st.session_state.qa_processing,
    on_click=begin_qa_run,
)

if st.session_state.qa_error:
    st.error(st.session_state.qa_error)
elif st.session_state.qa_notice:
    st.success(st.session_state.qa_notice)

if st.session_state.qa_processing:
    try:
        keys, duplicates, invalid = parse_ticket_keys(raw, settings.max_tickets)
        if not keys:
            raise ValueError("Enter at least one valid Jira ticket ID.")
        if invalid:
            raise ValueError("Invalid ticket IDs: " + ", ".join(invalid))
        if duplicates:
            st.warning("Duplicates removed: " + ", ".join(duplicates))
        settings.require_generation_ready(mode)
        progress = st.progress(0.0); activity = st.empty()
        def update(key, _stage, state, fraction): activity.info(f"{key} · {state}"); progress.progress(fraction)
        gateway = JiraGateway(JiraMCPProvider(settings), JiraRestProvider(settings), mode)
        run, run_dir = PipelineService(settings, QACrewFactory(settings, gateway), update).run(keys)
        st.session_state.qa_run, st.session_state.qa_run_dir = run, run_dir
        st.session_state.qa_notice = "Pipeline finished."
    except Exception as exc:
        st.session_state.qa_error = str(exc)
    finally:
        st.session_state.qa_processing = False
    st.rerun()

if "qa_run" in st.session_state: render_results(st.session_state.qa_run, Path(st.session_state.qa_run_dir))
