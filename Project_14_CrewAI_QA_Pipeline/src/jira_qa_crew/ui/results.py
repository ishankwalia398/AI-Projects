import pandas as pd
import streamlit as st

from ..services.artifacts import ticket_files, zip_run


def render_results(run, run_dir):
    complete = sum(t.status.startswith("COMPLETED") for t in run.tickets)
    failed = sum(t.status == "FAILED" for t in run.tickets)
    cols = st.columns(4); cols[0].metric("Run", run.run_id); cols[1].metric("Tickets", len(run.tickets)); cols[2].metric("Completed", complete); cols[3].metric("Failed", failed)
    outer = st.tabs([t.ticket_key for t in run.tickets])
    for tab, result in zip(outer, run.tickets, strict=False):
        with tab:
            st.markdown(f'<span class="qa-badge">{result.status}</span>', unsafe_allow_html=True)
            if result.errors:
                for err in result.errors: st.error(err)
                continue
            a, p, s, b = result.requirement_analysis, result.test_plan, result.test_cases, result.playwright
            inner = st.tabs(["Requirements Analysis", "Test Plan", "Test Cases", "Playwright", "Traceability", "Run Details"])
            with inner[0]:
                st.subheader(a.summary); st.caption(f"Source: {a.source_provider}")
                st.dataframe(pd.DataFrame([x.model_dump() for x in a.requirements + a.acceptance_criteria]), use_container_width=True)
                for warning in a.missing_information: st.warning(warning)
            with inner[1]:
                for section in p.sections: st.markdown(f"## {section.number}. {section.title}\n" + "\n".join(f"- {x}" for x in section.content))
            with inner[2]:
                rows = [{"ID": x.id, "Title": x.title, "Priority": x.priority, "Type": x.test_type, "Automation": x.automation_candidate, "Requirements": ", ".join(x.requirement_ids + x.acceptance_criteria_ids), "Tags": ", ".join(x.tags)} for x in s.test_cases]
                df = pd.DataFrame(rows); search = st.text_input("Search test cases", key=f"search-{result.ticket_key}")
                filter_row = st.columns(3)
                priorities = filter_row[0].multiselect(
                    "Priority",
                    sorted(df["Priority"].dropna().unique()),
                    key=f"priority-{result.ticket_key}",
                )
                test_types = filter_row[1].multiselect(
                    "Test type",
                    sorted(df["Type"].dropna().unique()),
                    key=f"type-{result.ticket_key}",
                )
                automation = filter_row[2].multiselect(
                    "Automation candidate",
                    sorted(df["Automation"].dropna().unique()),
                    key=f"automation-{result.ticket_key}",
                )
                trace_row = st.columns(2)
                requirement_options = sorted(
                    {value for case in s.test_cases for value in case.requirement_ids + case.acceptance_criteria_ids}
                )
                tag_options = sorted({tag for case in s.test_cases for tag in case.tags})
                requirements = trace_row[0].multiselect(
                    "Requirement",
                    requirement_options,
                    key=f"requirement-{result.ticket_key}",
                )
                tags = trace_row[1].multiselect(
                    "Tag", tag_options, key=f"tag-{result.ticket_key}"
                )
                if search:
                    lowered = search.lower()
                    df = df[df.astype(str).apply(lambda row, needle=lowered: row.str.lower().str.contains(needle, regex=False).any(), axis=1)]
                if priorities:
                    df = df[df["Priority"].isin(priorities)]
                if test_types:
                    df = df[df["Type"].isin(test_types)]
                if automation:
                    df = df[df["Automation"].isin(automation)]
                if requirements:
                    df = df[df["Requirements"].apply(lambda value, selected=requirements: any(item in value.split(", ") for item in selected))]
                if tags:
                    df = df[df["Tags"].apply(lambda value, selected=tags: any(item in value.split(", ") for item in selected))]
                st.dataframe(df, use_container_width=True)
            with inner[3]:
                st.metric("Automation readiness", b.readiness)
                for missing in b.missing_configuration: st.warning(missing)
                for file in b.files: st.markdown(f"#### {file.path}"); st.code(file.content, language="typescript")
            with inner[4]:
                total_requirements = len(result.traceability)
                covered_requirements = sum(
                    row["coverage_status"] != "UNCOVERED" for row in result.traceability
                )
                automated_requirements = sum(
                    bool(row["automated_tests"]) for row in result.traceability
                )
                coverage_percent = (
                    round(covered_requirements * 100 / total_requirements)
                    if total_requirements
                    else 0
                )
                metrics = st.columns(4)
                metrics[0].metric("Requirements", total_requirements)
                metrics[1].metric("Covered", covered_requirements)
                metrics[2].metric("Coverage", f"{coverage_percent}%")
                metrics[3].metric("With automation", automated_requirements)
                st.dataframe(pd.DataFrame(result.traceability), use_container_width=True)
            with inner[5]: st.json({"started_at": result.started_at.isoformat(), "completed_at": result.completed_at.isoformat(), "status": result.status, "jira_provider": a.source_provider, "llm_model": result.llm_model_used, "llm_fallback_used": result.llm_fallback_used, "warnings": result.warnings})
            files = ticket_files(result); st.markdown("### Downloads")
            columns = st.columns(4)
            for idx, name in enumerate(["test_plan.md", "test_cases.md", "test_cases.csv", "playwright_tests.md", "traceability_matrix.csv", "manifest.json"]):
                columns[idx % 4].download_button(name, files[name], file_name=f"{result.ticket_key}_{name}", key=f"dl-{result.ticket_key}-{name}")
            for f in b.files:
                key = f"playwright/{f.path}"
                if key in files: st.download_button(f"Download {f.path}", files[key], file_name=f.path.split("/")[-1], key=f"raw-{result.ticket_key}-{f.path}")
    st.download_button("Download complete QA pack (ZIP)", data=lambda: zip_run(run_dir), file_name=f"{run.run_id}.zip", mime="application/zip", type="primary")
