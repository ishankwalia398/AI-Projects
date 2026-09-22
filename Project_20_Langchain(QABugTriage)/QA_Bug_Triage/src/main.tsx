import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Activity, ArrowDownToLine, ArrowRight, Check, ChevronRight, CircleDot, FlaskConical, LoaderCircle, Moon, Search, ShieldCheck, Sun, Workflow, X } from 'lucide-react';
import type { Report, Ticket } from './types';
import { demo } from './demo';
import './styles.css';
import './ticket.css';

const stages = [{ id: 'jira', title: 'Collect evidence', subtitle: 'Live Jira issue' }, { id: 'triage', title: 'Classify the defect', subtitle: 'Bug Triage Analyst' }, { id: 'rca', title: 'Investigate the cause', subtitle: 'Root Cause Investigator' }, { id: 'strategy', title: 'Prevent a recurrence', subtitle: 'Test Strategy Advisor' }];
function stored(key: string, fallback: string) { try { return localStorage.getItem(key) || fallback; } catch { return fallback; } }
function TicketView({ ticket }: { ticket: Ticket }) {
  return <section className="panel ticket-preview" aria-label="Jira ticket">
    <div className="ticket-preview-top"><div><span className="section-label">JIRA TICKET</span><h3>{ticket.key} · {ticket.title}</h3></div>{ticket.url && <a href={ticket.url} target="_blank" rel="noopener noreferrer">Open in Jira ↗</a>}</div>
    <div className="ticket-preview-meta"><span>Status: {ticket.status}</span><span>Filed priority: {ticket.priority}</span>{ticket.components.length > 0 && <span>Components: {ticket.components.join(', ')}</span>}</div>
    {ticket.description && <details><summary>Read description</summary><p>{ticket.description}</p></details>}
  </section>;
}
function App() {
  const [mode, setMode] = useState(stored('triage-mode', 'dark'));
  const [dark, setDark] = useState(stored('triage-dark', 'charcoal'));
  const [light, setLight] = useState(stored('triage-light', 'sand'));
  const [key, setKey] = useState(''); const [password, setPassword] = useState('');
  const [report, setReport] = useState<Report | null>(null); const [tab, setTab] = useState('triage');
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [progress, setProgress] = useState<Record<string, string>>({});
  const controller = useRef<AbortController | null>(null);
  const theme = mode === 'dark' ? dark : light;
  const preference = (name: string, value: string, setter: (v: string) => void) => { setter(value); try { localStorage.setItem(`triage-${name}`, value); } catch { /* Theme persistence is optional. */ } };
  async function readTicket() {
    setBusy(true); setError(''); setReport(null); setTicket(null); setProgress({});
    const abort = new AbortController(); controller.current = abort;
    try {
      const response = await fetch('/api/ticket', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` }, body: JSON.stringify({ issueKey: key }), signal: abort.signal });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Could not read the Jira ticket.');
      setTicket(body.ticket);
      setProgress({ jira: 'complete' });
    } catch (err) { setError(err instanceof Error && err.name === 'AbortError' ? 'Jira read cancelled.' : err instanceof Error ? err.message : 'Could not read the Jira ticket.'); }
    finally { setBusy(false); controller.current = null; }
  }
  async function analyze(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(''); setReport(null); setTicket(null); setProgress({});
    const abort = new AbortController(); controller.current = abort;
    try {
      const response = await fetch('/api/triage', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` }, body: JSON.stringify({ issueKey: key }), signal: abort.signal });
      if (!response.ok) { const body = await response.json(); throw new Error(body.error || 'Unable to start analysis.'); }
      if (!response.body) throw new Error('Streaming is unavailable in this browser.');
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = ''; let received = false;
      const handle = (line: string) => {
        if (!line.trim()) return;
        const event = JSON.parse(line);
        if (event.type === 'stage') setProgress(p => ({ ...p, [event.stage]: event.state }));
        if (event.type === 'ticket') setTicket(event.ticket);
        if (event.type === 'error') throw new Error(`${event.error} Reference: ${event.requestId}`);
        if (event.type === 'result') { setReport(event.report); setTab('triage'); received = true; }
      };
      while (true) { const { value, done } = await reader.read(); buffer += decoder.decode(value, { stream: !done }); const lines = buffer.split('\n'); buffer = lines.pop() || ''; for (const line of lines) handle(line); if (done) break; }
      handle(buffer); if (!received) throw new Error('The connection ended before the report was complete. Please retry.');
    } catch (err) { abort.abort(); setError(err instanceof Error && err.name === 'AbortError' ? 'Analysis cancelled.' : err instanceof Error ? err.message : 'Analysis failed.'); }
    finally { setBusy(false); controller.current = null; }
  }
  function download() { if (!report) return; const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = `${report.ticket.key}-triage.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
  const list = (items: string[]) => <ul className="details-list">{items.map((item, i) => <li key={i}>{item}</li>)}</ul>;
  return <div data-theme={theme} className="app-shell">
    <header className="topbar"><a className="brand" href="/" aria-label="Signal home"><span className="brand-icon"><Activity size={22}/></span>signal<span className="brand-divider"/> <span className="brand-label">QA WORKSPACE</span></a><div className="appearance"><span className="appearance-label">Appearance</span><div className="mode-picker"><button type="button" title="Dark mode" aria-label="Dark mode" aria-pressed={mode === 'dark'} onClick={() => preference('mode', 'dark', setMode)}><Moon size={16}/></button><button type="button" title="Light mode" aria-label="Light mode" aria-pressed={mode === 'light'} onClick={() => preference('mode', 'light', setMode)}><Sun size={16}/></button></div><select aria-label="Color palette" value={theme} onChange={e => preference(mode, e.target.value, mode === 'dark' ? setDark : setLight)}>{(mode === 'dark' ? ['charcoal', 'midnight'] : ['sand', 'cloud']).map(t => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>)}</select></div></header>
    <main><div className="eyebrow"><span className="live-dot"/> LANGCHAIN + GEMINI FLASH / GROQ <span className="eyebrow-line"/> THREE SPECIALISTS. ONE CLEAR REPORT.</div>
    <section className="hero"><div><h1>Less triage.<br/><span>More clarity.</span></h1><p>Understand why a bug happens, how much it matters,<br className="desktop-break"/> and what to test so it stays fixed.</p></div><div className="hero-note"><Workflow size={25}/><span>From ticket to test strategy</span><strong>One connected workflow.</strong><small>Evidence first. Human reviewed.</small></div></section>
    <div className="workspace"><aside><form className="panel intake" onSubmit={analyze}><div className="section-label">01 / INPUT</div><h2>Start with a bug.</h2><p className="muted">Connect the dots from your Jira issue.</p><label htmlFor="issue">Jira issue key</label><div className="input-wrap"><CircleDot size={17}/><input id="issue" required maxLength={32} placeholder="e.g. QA-123" value={key} disabled={busy} onChange={e => setKey(e.target.value.toUpperCase())}/></div><label htmlFor="password">Workspace access password</label><input id="password" type="password" autoComplete="current-password" placeholder="Your workspace password" required value={password} disabled={busy} onChange={e => setPassword(e.target.value)}/><button className="read-ticket" disabled={busy || !key || !password} type="button" onClick={readTicket}>Read Jira ticket <Search size={16}/></button><button className="primary" disabled={busy} type="submit">{busy ? <><LoaderCircle className="spin" size={17}/> Analyzing issue</> : <>Run triage <ArrowRight size={17}/></>}</button>{busy && <button className="text-button" type="button" onClick={() => controller.current?.abort()}><X size={14}/> Cancel analysis</button>}<div className="divider"/><button type="button" disabled={busy} className="sample-button" onClick={() => { setReport(demo); setTicket(demo.ticket); setError(''); setTab('triage'); setProgress({}); }}>Explore a sample report <ChevronRight size={16}/></button><p className="sample-note">No credentials needed · illustrative data</p></form>
    <section className="pipeline"><div className="section-label">THE WORKFLOW</div>{stages.map((s, i) => <div className={`stage ${progress[s.id] || ''}`} key={s.id}><div className="stage-number">{progress[s.id] === 'complete' ? <Check size={15}/> : (progress[s.id] === 'running' || progress[s.id] === 'fallback') ? <LoaderCircle size={15} className="spin"/> : `0${i + 1}`}</div><div><strong>{s.title}</strong><small>{progress[s.id] === 'fallback' ? 'Trying Groq' : s.subtitle}</small></div></div>)}</section></aside>
    <section className="results" aria-label="Analysis results"><div className="results-top"><div className="section-label">02 / INTELLIGENCE</div><span className="review-badge"><ShieldCheck size={14}/> Human review required</span></div>
    {error && <div role="alert" className="error">{error}</div>}
    {ticket && <TicketView ticket={ticket}/>}
    {!report ? <div className="empty panel" aria-live="polite"><div className="orbit"><Search size={32}/><span className="orbit-dot"/></div><h2>{busy ? 'Following the evidence.' : ticket ? 'Ticket loaded. Ready for triage.' : 'A clearer picture starts here.'}</h2><p>{busy ? 'Your specialists are working through the issue in sequence. Progress appears in the workflow.' : ticket ? 'Review the Jira details above, then run triage when ready.' : 'Enter a Jira key to bring severity, root-cause hypotheses and regression coverage into one place.'}</p><div className="empty-tags"><span>01 Classify</span><ChevronRight size={13}/><span>02 Investigate</span><ChevronRight size={13}/><span>03 Prevent</span></div></div> : <>
    <div className="report-heading"><div className="ticket-meta"><span className="ticket-key">{report.ticket.key}</span><span>{report.ticket.source === 'demo' ? 'SAMPLE REPORT' : report.ticket.source.toUpperCase()}</span></div><h2>{report.ticket.title}</h2><div className="report-actions"><span>{report.model}{report.durationMs > 0 ? ` · ${(report.durationMs / 1000).toFixed(1)}s` : ''}</span><button onClick={download} className="download"><ArrowDownToLine size={14}/> Export JSON</button></div></div>
    {report.ticket.warnings.map(w => <p className="notice" key={w}>{w}</p>)}
    <div className="tabs" role="tablist" aria-label="Report sections">{[{ id: 'triage', title: 'Triage verdict' }, { id: 'rca', title: 'Root cause' }, { id: 'strategy', title: 'Test strategy' }].map((t, i) => <button id={`tab-${t.id}`} role="tab" aria-selected={tab === t.id} aria-controls="report-panel" key={t.id} onClick={() => setTab(t.id)}><span>0{i + 1}</span>{t.title}</button>)}</div>
    <div id="report-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="report-body">
    {tab === 'triage' && <><div className="verdict-grid"><div><small>SEVERITY</small><strong className="severity">{report.triage.severity}</strong></div><div><small>PRIORITY</small><strong>{report.triage.priority}</strong></div><div><small>CATEGORY</small><strong>{report.triage.category}</strong></div></div><div className="panel content-panel"><h3>The verdict</h3><p>{report.triage.summary}</p>{[['Severity', report.triage.severityReason], ['Priority', report.triage.priorityReason], ['Category', report.triage.categoryReason]].map(([title, body]) => <p key={title}><b>{title}.</b> {body}</p>)}<h3>Evidence from the ticket</h3>{report.triage.evidence.map((v, i) => <blockquote key={i}>{v}</blockquote>)}<h3>Information to confirm</h3>{list(report.triage.missingInformation)}</div></>}
    {tab === 'rca' && <><div className="panel content-panel"><span className="pill">{report.rca.status}</span><h3>Working conclusion</h3><p>{report.rca.conclusion}</p></div>{report.rca.hypotheses.map((h, i) => <div className="panel content-panel" key={i}><div className="hypothesis-heading"><span className="section-label">HYPOTHESIS 0{i + 1}</span><span className="confidence">{h.confidence}% subjective confidence</span></div><h3>{h.cause}</h3><p><b>Evidence.</b> {h.evidence}</p><div className="kill-test"><b>How to disprove it</b><p>{h.killTest}</p></div></div>)}<div className="panel content-panel"><h3>Investigation steps</h3>{list(report.rca.investigationSteps)}<h3>Potential blast radius</h3>{list(report.rca.blastRadius)}<h3>What we cannot determine yet</h3>{list(report.rca.limitations)}</div></>}
    {tab === 'strategy' && <><div className="panel content-panel"><h3><FlaskConical size={18}/> Close the coverage gap</h3><p>{report.strategy.missingTest}</p><h3>Verify the fix</h3><p>{report.strategy.verification}</p></div>{report.strategy.tests.map(t => <details className="panel test-card" key={t.id}><summary><span className="test-id">{t.id}</span><strong>{t.title}</strong><span className="pill">{t.layer}</span></summary><div><p className="muted">{t.type} · {t.rationale}</p><ol>{t.steps.map((s, i) => <li key={i}>{s}</li>)}</ol><p><b>Expected:</b> {t.expected}</p></div></details>)}<div className="panel content-panel"><h3>Keep a human in the loop</h3>{list(report.strategy.manualChecks)}<h3>Ready to close when</h3>{list(report.strategy.exitCriteria)}</div></>}
    </div></>}
    </section></div><footer><span><Activity size={14}/> SIGNAL / QA BUG TRIAGE</span><span>Built with LangChain · Gemini Flash + Groq fallback</span></footer></main>
  </div>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
