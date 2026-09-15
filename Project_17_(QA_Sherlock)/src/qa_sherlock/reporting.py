import html
import json
from pathlib import Path
from .core import ROLES


def write_report(report, directory):
    out = Path(directory)
    out.mkdir(parents=True, exist_ok=True)
    (out / "report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    (out / "regression.spec.ts").write_text(report["regression_test"], encoding="utf-8")
    esc = lambda value: html.escape(str(value))
    claims = "".join('<article><p>' + esc(c['text']) + '</p><small>' + esc(' · '.join(c['evidence_ids'])) + '</small></article>' for c in report['claims'])
    evidence = "".join('<details><summary>' + esc(d['id'] + ' / ' + d['title']) + '</summary><p>' + esc(d['text']) + '</p><small>' + esc(d['source']) + '</small></details>' for d in report['evidence'])
    steps = "".join('<li>' + esc(s) + '</li>' for s in report['next_steps'])
    alternatives = "".join('<li>' + esc(s) + '</li>' for s in report['alternatives'])
    page = '''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>QA Sherlock | Investigation</title>
<style>:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#0a1020;color:#e5eafa;font:16px/1.65 system-ui,sans-serif}main{max-width:1120px;margin:auto;padding:48px 24px}header{border-bottom:1px solid #2b3855;padding-bottom:30px}h1{font-size:clamp(32px,5vw,58px);letter-spacing:-2px;line-height:1.1}h2{font-size:22px;margin-top:35px}.eyebrow,small{color:#5ce1c0}.badge{display:inline-block;border:1px solid #3d6171;padding:5px 12px;border-radius:24px;color:#90e8d0}.grid{display:grid;grid-template-columns:2fr 1fr;gap:20px}article,.panel,details{background:#131e34;border:1px solid #2a3854;border-radius:14px;padding:20px;margin:12px 0}.agents{display:flex;gap:8px;flex-wrap:wrap;margin:22px 0}.agents span{background:#1a2941;padding:8px 12px;border-radius:8px;font-size:12px}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:13px;background:#070d18;padding:20px;border-radius:10px}summary{cursor:pointer}a{color:#8cdecf}p{color:#c5d0e8}.score{font-size:42px;font-weight:700;color:#5ce1c0}@media(max-width:760px){.grid{grid-template-columns:1fr}}@media print{body{background:white;color:black}p{color:black}}</style><main>
<header><div class="eyebrow">QA SHERLOCK / AUTONOMOUS DEFECT INVESTIGATION</div><h1>Every failure leaves<br>evidence.</h1><span class="badge">MODE</span><p>SUMMARY</p></header>
<div class="agents">AGENTS</div><div class="grid"><section><h2>Probable root cause</h2><div class="panel">CAUSE</div><h2>Evidence correlation</h2>CLAIMS<h2>Alternative hypotheses</h2><ul>ALTERNATIVES</ul></section><aside><h2>Assessment</h2><div class="panel"><div class="score">CONFIDENCE</div><p>Analyst confidence estimate</p><small>Not a calibrated probability</small></div><h2>Next actions</h2><ol>STEPS</ol></aside></div>
<h2>Evaluation</h2><pre>EVALUATION</pre><h2>Evidence library</h2>EVIDENCE<h2>Generated regression test</h2><p>Review required · execution is separate</p><pre>TESTCODE</pre><p><a href="report.json">Report JSON</a> · <a href="regression.spec.ts">Playwright test</a></p></main></html>'''
    replacements = {"MODE": esc(report['mode']), "SUMMARY": esc(report['summary']), "AGENTS": ''.join('<span>'+esc(r)+'</span>' for r in ROLES), "CAUSE": esc(report['root_cause']), "CLAIMS": claims, "CONFIDENCE": str(round(report['confidence']*100))+'%', "STEPS": steps, "ALTERNATIVES": alternatives, "EVALUATION": esc(json.dumps(report['evaluation'], indent=2)), "EVIDENCE": evidence, "TESTCODE": esc(report['regression_test'])}
    for key, value in replacements.items():
        page = page.replace(key, value)
    assets = Path(__file__).parent
    theme_css = (assets / 'theme.css').read_text(encoding='utf-8')
    theme_js = (assets / 'theme.js').read_text(encoding='utf-8')
    toolbar = '''<nav class="topbar" aria-label="Report settings"><span class="brand">✧ QA SHERLOCK</span><button id="theme-toggle" class="theme-toggle" type="button" aria-label="Light mode selected. Switch to dark mode" aria-pressed="false"><svg class="mode-sun" aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg><svg class="mode-moon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"/></svg><span class="mode-label">Light mode</span></button></nav>'''
    page = page.replace('</style><main>', '</style><style>' + theme_css + '</style><script>' + theme_js + '</script><main>' + toolbar)
    page = page.replace('evidence.</h1>', '<em>evidence.</em></h1>')
    (out / "index.html").write_text(page, encoding="utf-8")
    markdown = '# QA Sherlock\n\n' + report['summary'] + '\n\n## Probable cause\n' + report['root_cause'] + '\n\n' + '\n'.join('- ' + c['text'] + ' [' + ', '.join(c['evidence_ids']) + ']' for c in report['claims'])
    (out / "report.md").write_text(markdown, encoding="utf-8")
