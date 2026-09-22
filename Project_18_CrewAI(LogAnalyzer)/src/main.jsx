import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Activity, AlertCircle, AlertTriangle, ArrowDownToLine, ArrowRight, Check, ChevronDown, Clock3, CloudUpload, FileCode2, FileText, Filter, Moon, Search, ShieldAlert, Sun, X } from 'lucide-react'
import './styles.css'

const TYPES = [
  { key: 'all', label: 'All findings', icon: Activity },
  { key: 'issue', label: 'Issues', icon: ShieldAlert },
  { key: 'error', label: 'Errors', icon: AlertCircle },
  { key: 'timeout', label: 'Timeouts', icon: Clock3 },
  { key: 'warning', label: 'Warnings', icon: AlertTriangle },
  { key: 'failure', label: 'Failures', icon: X },
]
const DEMO = [
  { timestamp: '2026-09-21T09:42:13Z', session_id: 'sess_8f92a', message: 'ERROR 503 Service Unavailable: upstream connection refused', status: 503, request: { method: 'POST', url: 'https://api.example.com/v1/orders', body: '{"items":2}' }, response: { status: 503, body: 'Service Unavailable' }, request_headers: { 'Content-Type': 'application/json' }, response_headers: { 'Retry-After': '30' } },
  { timestamp: '2026-09-21T09:42:21Z', session_id: 'sess_8f92a', message: 'Request timed out after 30000ms while calling payment gateway', status: 504, request: { method: 'POST', url: 'https://api.example.com/v1/payments' }, response: { status: 504 }, request_headers: { 'Content-Type': 'application/json' } },
  { timestamp: '2026-09-21T09:43:02Z', session_id: 'sess_91b20', message: 'WARNING rate limit approaching for client', status: 429, request: { method: 'GET', url: 'https://api.example.com/v1/orders' }, response: { status: 429 }, response_headers: { 'Retry-After': '60' } },
  { timestamp: '2026-09-21T09:44:10Z', session_id: 'sess_91b20', message: 'FAILURE checkout assertion: expected 200, received 400', status: 400, request: { method: 'POST', url: 'https://api.example.com/v1/checkout' }, response: { status: 400, body: 'Invalid cart' } },
]
const MAX_FILE_BYTES = 4_000_000
const API_BASE = import.meta.env.DEV ? '' : 'https://log-analyzer-ca-api.vercel.app'

function download(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a'); a.href = url; a.download = name; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
function pretty(value) { return value && Object.keys(value).length ? JSON.stringify(value, null, 2) : 'Not available in uploaded log' }
function csvCell(value) { return `"${String(value ?? '').replaceAll('"', '""')}"` }
function formatTime(value) { if (!value) return 'Unknown time'; const d = new Date(value); return Number.isNaN(+d) ? value : d.toLocaleString() }

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('logscope-theme') || 'midnight')
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [active, setActive] = useState('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState([])
  const [detail, setDetail] = useState(null)
  const [menu, setMenu] = useState(false)
  const [includeSuggestions, setIncludeSuggestions] = useState(true)
  const [dragging, setDragging] = useState(false)
  const [configured, setConfigured] = useState(null)
  useEffect(() => {
    fetch(`${API_BASE}/api/health`).then(r => r.json()).then(data => setConfigured(Boolean(data.crewai_configured))).catch(() => setConfigured(null))
  }, [])
  const fileInput = useRef(null)
  const findings = result?.findings || []
  const counts = useMemo(() => Object.fromEntries(TYPES.map(t => [t.key, t.key === 'all' ? findings.length : findings.filter(f => f.kind === t.key).length])), [findings])
  const visible = useMemo(() => findings.filter(f => (active === 'all' || f.kind === active) && (!query || [f.title, f.message, f.session_id, f.source].join(' ').toLowerCase().includes(query.toLowerCase()))), [findings, active, query])
  const light = theme === 'sand' || theme === 'cloud'

  function changeTheme(next) { setTheme(next); localStorage.setItem('logscope-theme', next); setMenu(false) }
  async function upload(file) {
    if (!file) return
    setError(''); setBusy(true); setResult(null); setSelected([]); setDetail(null); setActive('all'); setQuery('')
    if (file.size > MAX_FILE_BYTES) { setError('This deployment accepts files up to 4 MB.'); setBusy(false); return }
    const form = new FormData(); form.append('file', file)
    try {
      const response = await fetch(`${API_BASE}/api/analyze`, { method: 'POST', body: form })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.detail || 'Analysis failed. Please try again.')
      setResult(payload)
    } catch (e) { setError(e.message || 'Analysis failed. Please try again.') }
    finally { setBusy(false); if (fileInput.current) fileInput.current.value = '' }
  }
  function exportItems(items, format) {
    if (!items.length) return
    const stamp = new Date().toISOString().replaceAll(':', '-').slice(0, 19)
    const rows = items.map(f => ({ ...f, ...(includeSuggestions ? {} : { suggestions: undefined }) }))
    if (format === 'json') download(`logscope_findings_${stamp}.json`, JSON.stringify(rows, null, 2), 'application/json')
    else {
      const columns = ['kind', 'title', 'message', 'timestamp', 'session_id', 'status', 'source', 'request', 'request_headers', 'response', 'response_headers', ...(includeSuggestions ? ['suggestions'] : [])]
      const text = [columns.map(csvCell).join(','), ...rows.map(row => columns.map(c => csvCell(typeof row[c] === 'object' ? JSON.stringify(row[c]) : row[c])).join(','))].join('\r\n')
      download(`logscope_findings_${stamp}.csv`, text, 'text/csv;charset=utf-8')
    }
  }
  function toggle(id) { setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]) }
  function loadDemo() { upload(new File([JSON.stringify(DEMO)], 'sample-api-logs.json', { type: 'application/json' })) }
  const selectedItems = findings.filter(f => selected.includes(f.id))

  return <div className="app" data-theme={theme}>
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Activity size={22} strokeWidth={2.5}/></div><div><strong>logscope</strong><span>INTELLIGENT LOG ANALYZER</span></div></div>
      <div className="side-label">WORKSPACE</div>
      <button className="side-link active"><Activity size={17}/> Overview <span className="side-dot"/></button>
      <button className="side-link" onClick={() => fileInput.current?.click()}><CloudUpload size={17}/> New analysis</button>
      <div className="side-label categories-label">FINDINGS</div>
      <nav>{TYPES.map(({ key, label, icon: Icon }) => <button key={key} className={`side-link ${active === key && result ? 'chosen' : ''}`} onClick={() => setActive(key)}><Icon size={17}/>{label}<span className="nav-count">{counts[key]}</span></button>)}</nav>
      <div className="sidebar-bottom"><div className="status-pulse"/><div><strong>{configured === false ? 'AI setup required' : configured ? 'Agents Ready' : 'CrewAI log analysis'}</strong><span>Parser · Analyst · Remediation</span></div></div>
    </aside>

    <main className="main">
      <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <strong>Overview</strong></div><div className="top-actions"><div className="mode-switch"><button title="Night mode" className={!light ? 'on' : ''} onClick={() => changeTheme('midnight')}><Moon size={16}/></button><button title="Light mode" className={light ? 'on' : ''} onClick={() => changeTheme('cloud')}><Sun size={16}/></button></div><div className="theme-wrap"><button className="theme-button" onClick={() => setMenu(!menu)}>{theme[0].toUpperCase() + theme.slice(1)} <ChevronDown size={15}/></button>{menu && <div className="theme-menu"><div className="menu-label">{light ? 'LIGHT' : 'NIGHT'}</div>{(light ? ['sand', 'cloud'] : ['midnight', 'charcoal']).map(t => <button key={t} onClick={() => changeTheme(t)}>{t[0].toUpperCase()+t.slice(1)} {theme===t&&<Check size={15}/>}</button>)}</div>}</div><div className="avatar">LA</div></div></header>
      <div className="content">
        <div className="page-head"><div><div className="eyebrow"><span className="eyebrow-line"/> OPERATIONS INTELLIGENCE</div><h1>Log analysis, <em>clarified.</em></h1><p>Turn raw logs into actionable insights. Upload a file to uncover what matters.</p></div><div className="head-graphic"><span className="orbit orbit-one"/><span className="orbit orbit-two"/><Activity size={44}/></div></div>
        <section className={`upload-card ${dragging ? 'dragging' : ''}`} onDragOver={e => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); upload(e.dataTransfer.files[0]) }}>
          <div className="upload-icon"><CloudUpload size={27}/></div><div className="upload-copy"><strong>{busy ? 'Analyzing your logs…' : 'Drop your log file here'}</strong><span>{busy ? 'Agents are parsing, analyzing, and preparing fixes. This may take a few minutes.' : 'or browse to upload · JSON, CSV, XLS, XLSX, PDF, DOC, DOCX, Charles XML/JSON, HAR · up to 4 MB'}</span><span className="upload-limit">Maximum file size: <b>4 MB</b> per file</span></div><button className="primary-button" disabled={busy} onClick={() => fileInput.current?.click()}>{busy ? <span className="spinner"/> : <>Browse files <ArrowRight size={16}/></>}</button><input ref={fileInput} type="file" hidden accept=".json,.csv,.xls,.xlsx,.pdf,.doc,.docx,.chls,.chlsx,.chlsj,.xml,.har" onChange={e => upload(e.target.files[0])}/>
        </section>
        {configured === false && <p className="analysis-note">The API server needs a Command Code or Groq key before CrewAI can analyze files.</p>}
        {error && <div className="alert"><AlertCircle size={18}/>{error}<button onClick={() => setError('')}><X size={15}/></button></div>}
        {!result && !busy && <div className="demo-line">Just looking around? <button onClick={loadDemo}>Try a sample log <ArrowRight size={14}/></button></div>}

        <div className="section-heading"><div><span className="section-kicker">YOUR ANALYSIS</span><h2>Findings overview</h2></div>{result && <div className="source-pill"><FileCode2 size={15}/>{result.filename}<span>{result.entries_count} entries</span></div>}</div>
        <div className="stats-grid">{TYPES.slice(1).map(({key,label,icon:Icon}) => <button key={key} className={`stat-card ${key} ${active === key ? 'selected-stat' : ''}`} onClick={() => setActive(active === key ? 'all' : key)}><div className="stat-top"><span>{label}</span><Icon size={18}/></div><div className="stat-number">{counts[key]}</div><div className="stat-foot">{result ? `${findings.length ? Math.round(counts[key]/findings.length*100) : 0}% of findings` : 'Awaiting analysis'} <ArrowRight size={14}/></div></button>)}</div>

        <section className="findings-panel"><div className="panel-header"><div><h2>Detected events <span>{visible.length}</span></h2><p>Explore each finding and its suggested resolution.</p></div><div className="panel-actions"><button className="subtle-button" disabled={!result} onClick={() => download(result.markdown_filename, result.markdown, 'text/markdown;charset=utf-8')}><FileText size={16}/> Parsed .md</button><button className="subtle-button" disabled={!selected.length} onClick={() => exportItems(selectedItems, 'json')}><ArrowDownToLine size={16}/> Export selected</button></div></div>
          {result && <div className="filter-bar"><div className="filter-tabs">{TYPES.map(t => <button key={t.key} className={active===t.key?'current':''} onClick={() => setActive(t.key)}>{t.label}{counts[t.key] > 0 && <span>{counts[t.key]}</span>}</button>)}</div><div className="search"><Search size={16}/><input placeholder="Search findings..." value={query} onChange={e => setQuery(e.target.value)}/></div></div>}
          {result && <div className="export-options"><label><input type="checkbox" checked={includeSuggestions} onChange={e => setIncludeSuggestions(e.target.checked)}/> Include suggested fixes in exports</label><div><button onClick={() => setSelected(visible.map(f => f.id))}>Select visible</button><button onClick={() => setSelected([])}>Clear</button><button disabled={!selected.length} onClick={() => exportItems(selectedItems, 'csv')}>Export CSV</button><button disabled={!visible.length} onClick={() => exportItems(visible, 'json')}>Export all JSON</button></div></div>}
          {visible.length ? <div className="findings-list">{visible.map(f => <div className="finding-row" key={f.id}><input aria-label={`Select ${f.title}`} type="checkbox" checked={selected.includes(f.id)} onChange={() => toggle(f.id)}/><button className="finding-body" onClick={() => setDetail(f)}><span className={`finding-icon ${f.kind}`}>{f.kind === 'timeout' ? <Clock3 size={18}/> : f.kind === 'warning' ? <AlertTriangle size={18}/> : <AlertCircle size={18}/>}</span><span className="finding-copy"><strong>{f.title}</strong><small>{formatTime(f.timestamp)} <i/> {f.session_id || 'No session ID'} <i/> {f.source}</small></span><span className={`badge ${f.kind}`}>{f.kind}</span><ArrowRight className="row-arrow" size={17}/></button></div>)}</div> : <div className="empty-state"><div className="empty-icon"><Filter size={25}/></div><strong>{result ? 'No matching findings' : 'Your findings will appear here'}</strong><p>{result ? 'Try a different category or search term.' : 'Upload a log file to see issues, errors, timeouts, warnings, and failures in one place.'}</p></div>}
        </section>
      </div>
    </main>
    {detail && <div className="drawer-backdrop" onClick={() => setDetail(null)}><aside className="drawer" onClick={e => e.stopPropagation()}><div className="drawer-head"><span className={`badge ${detail.kind}`}>{detail.kind}</span><button onClick={() => setDetail(null)} aria-label="Close"><X size={20}/></button></div><h2>{detail.title}</h2><div className="detail-meta"><div><span>Timestamp</span><strong>{formatTime(detail.timestamp)}</strong></div><div><span>Session ID</span><strong>{detail.session_id || 'Not available'}</strong></div><div><span>HTTP status</span><strong>{detail.status ?? 'Not available'}</strong></div><div><span>Source</span><strong>{detail.source}</strong></div></div><div className="drawer-scroll"><section><h3>Message</h3><p className="message-box">{detail.message}</p></section><section><h3>Analysis evidence</h3><p className="message-box">{detail.evidence}</p><p className="analysis-note">{detail.explanation}</p></section><section><h3>API request</h3><pre>{pretty(detail.request)}</pre></section><section><h3>Request headers</h3><pre>{pretty(detail.request_headers)}</pre></section><section><h3>API response</h3><pre>{pretty(detail.response)}</pre></section><section><h3>Response headers</h3><pre>{pretty(detail.response_headers)}</pre></section><section className="suggestions"><h3>Suggested fixes</h3>{detail.suggestions.map((s,i) => <div className="suggestion" key={i}><span>{String(i+1).padStart(2,'0')}</span><p>{s}</p></div>)}</section></div><div className="drawer-footer"><button onClick={() => exportItems([detail], 'json')}><ArrowDownToLine size={16}/> Export finding</button></div></aside></div>}
  </div>
}

createRoot(document.getElementById('root')).render(<App />)
