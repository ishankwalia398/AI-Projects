from ..models import PlaywrightBundle, RequirementAnalysis, TestCaseSuite


def calculate_traceability(analysis: RequirementAnalysis, suite: TestCaseSuite, bundle: PlaywrightBundle):
    automated = {x for f in bundle.files for x in f.test_case_ids}
    rows = []
    for req in analysis.requirements + analysis.acceptance_criteria:
        cases = [c for c in suite.test_cases if req.id in c.requirement_ids + c.acceptance_criteria_ids]
        auto = [c.id for c in cases if c.id in automated]
        status = "UNCOVERED" if not cases else "FULL" if len(auto) == len(cases) else "PARTIAL" if auto else "MANUAL"
        rows.append({"requirement_id": req.id, "requirement": req.text, "classification": req.classification, "test_cases": ", ".join(c.id for c in cases), "automated_tests": ", ".join(auto), "coverage_status": status, "reason": "" if status == "FULL" else "Review manual or missing automation coverage"})
    return rows
