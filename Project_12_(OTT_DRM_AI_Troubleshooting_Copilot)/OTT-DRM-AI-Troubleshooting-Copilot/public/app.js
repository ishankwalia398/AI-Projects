const form = document.querySelector('#incident-form');
const results = document.querySelector('#results');
const button = document.querySelector('#analyze-button');
const aiToggle = document.querySelector('#use_ai');
const toast = document.querySelector('#toast');

const exampleData = {
  summary: '4K playback works on Chrome but shows a black screen on Android TV.', platform: 'Android TV',
  device_model: 'Lab Android TV device', player: 'Media3 / ExoPlayer', drm_system: 'Widevine', security_level: 'L3',
  required_security_level: 'L1', hdcp_version: '2.2', required_hdcp: '2.2', requested_resolution: '4K/UHD',
  codec: 'HEVC/H.265', license_status_code: '', manifest_text: '', license_response: '',
  player_logs: 'Widevine: L3\nvideo error: black screen after license acquisition', notes: ''
};

const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[char]));
const field = id => document.querySelector(`#${id}`).value.trim();
const setField = (id, value) => { document.querySelector(`#${id}`).value = value; };

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2400);
}

function updateClock() {
  const now = new Date();
  const clock = document.querySelector('#utc-clock');
  clock.dateTime = now.toISOString();
  clock.textContent = `${now.toUTCString().slice(17, 25)} UTC`;
}

function setSignal(id, present) {
  const item = document.querySelector(id);
  item.textContent = present ? 'PRESENT' : 'MISSING';
  item.className = present ? 'good' : '';
}

function updateSignals() {
  const device = Boolean(field('platform') || field('device_model'));
  const manifest = Boolean(field('manifest_text'));
  const license = Boolean(field('license_response') || field('license_status_code'));
  const logs = Boolean(field('player_logs'));
  const mismatch = field('security_level') !== 'Unknown' && field('required_security_level') !== 'Unknown' && field('security_level') !== field('required_security_level');
  setSignal('#signal-device', device); setSignal('#signal-manifest', manifest); setSignal('#signal-license', license); setSignal('#signal-logs', logs);
  const policy = document.querySelector('#signal-policy');
  policy.textContent = mismatch ? 'MISMATCH' : 'ALIGNED'; policy.className = mismatch ? 'warning' : 'good';
  const readiness = Math.round(([device, true, manifest, license, logs].filter(Boolean).length / 5) * 100);
  document.querySelector('#readiness-value').textContent = `${readiness}%`;
  document.querySelector('#readiness-bar').style.width = `${readiness}%`;
  document.querySelector('#readiness-copy').textContent = readiness >= 60 ? 'Enough signal for a preliminary diagnosis' : 'Add technical evidence to improve confidence';
}

function render(data) {
  const causes = data.root_causes.map(item => `
    <div class="cause"><div class="cause-head"><span>${escapeHtml(item.cause)}</span><strong>${Number(item.probability).toFixed(1)}%</strong></div>
    <div class="cause-bar"><span style="width:${Math.min(100, Math.max(0, Number(item.probability)))}%"></span></div></div>`).join('');
  const evidence = data.evidence.length ? `<ul class="evidence-list">${data.evidence.map(item =>
    `<li><strong>${escapeHtml(item.source)}</strong>${escapeHtml(item.observation)} — ${escapeHtml(item.implication)}</li>`).join('')}</ul>`
    : '<div class="expected-box">No strong evidence detected. Add more technical evidence.</div>';
  const tests = `<ol class="test-list">${data.suggested_tests.map(test => `<li>${escapeHtml(test)}</li>`).join('')}</ol>`;
  const sources = data.retrieved_sources.map(source => `<article class="source"><div class="source-head"><strong>${escapeHtml(source.title)}</strong><em>MATCH ${Number(source.score).toFixed(2)}</em></div><p>${escapeHtml(source.content)}${source.source_url ? ` · <a href="${escapeHtml(source.source_url)}" target="_blank" rel="noreferrer">OPEN SOURCE</a>` : ''}</p></article>`).join('');
  const topCause = data.root_causes[0]?.probability ?? 0;

  results.className = 'results-panel'; results.setAttribute('aria-busy', 'false');
  results.innerHTML = `
    <header class="results-top"><div class="results-heading"><span class="diagnosis-mark">⌁</span><div><span class="micro-label">FORENSIC DIAGNOSIS COMPLETE</span><h2>${escapeHtml(data.executive_summary)}</h2></div></div><button class="report-button" type="button" id="export-report">EXPORT PDF ↓</button></header>
    <div class="result-metrics">
      <div class="result-metric"><span>Confidence</span><strong class="accent">${escapeHtml(String(data.confidence).toUpperCase())}</strong></div>
      <div class="result-metric"><span>Leading probability</span><strong>${Number(topCause).toFixed(1)}%</strong></div>
      <div class="result-metric"><span>Analysis mode</span><strong>${escapeHtml(String(data.mode).toUpperCase())}</strong></div>
      <div class="result-metric"><span>Knowledge source</span><strong>${escapeHtml(String(data.retrieval_backend).toUpperCase())}</strong></div>
    </div>
    <div class="result-body"><div class="result-column">
      <section class="result-section"><h3 class="result-section-title"><span>01</span>Root-cause probability</h3>${causes}</section>
      <section class="result-section"><h3 class="result-section-title"><span>02</span>Evidence chain</h3>${evidence}</section>
      <section class="result-section"><h3 class="result-section-title"><span>03</span>Expected behavior</h3><div class="expected-box">${escapeHtml(data.expected_behavior)}</div></section>
    </div><div class="result-column">
      <section class="result-section"><h3 class="result-section-title"><span>04</span>Verification sequence</h3>${tests}</section>
      <section class="result-section"><h3 class="result-section-title"><span>05</span>Retrieved knowledge</h3>${sources || '<div class="expected-box">No matching knowledge sources returned.</div>'}</section>
    </div></div><footer class="caveats">${data.caveats.map(escapeHtml).join(' · ')}</footer>`;
  document.querySelector('#export-report').addEventListener('click', () => exportReportPdf(data));
  results.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function pdfSafeText(value = '') {
  return String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[–—]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^\x20-\x7E]/g, '?');
}

function wrapPdfText(value, width = 88) {
  const words = pdfSafeText(value).trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [''];
  const lines = [];
  let line = '';
  words.forEach(word => {
    if (!line) { line = word; return; }
    if (`${line} ${word}`.length <= width) { line += ` ${word}`; return; }
    lines.push(line);
    line = word;
  });
  if (line) lines.push(line);
  return lines;
}

function buildReportLines(data) {
  const lines = [];
  const addBlank = () => lines.push({ text: '', size: 6 });
  const addHeading = text => {
    if (lines.length) addBlank();
    lines.push({ text, size: 12, bold: true, color: 'teal' });
  };
  const addText = (text, options = {}) => {
    wrapPdfText(text, options.width || 88).forEach(value => lines.push({ text: value, size: options.size || 9.5, bold: Boolean(options.bold) }));
  };

  lines.push({ text: 'OTT DRM AI TROUBLESHOOTING COPILOT', size: 18, bold: true, color: 'teal' });
  lines.push({ text: 'FORENSIC DIAGNOSIS REPORT', size: 11, bold: true });
  lines.push({ text: `Generated: ${new Date().toLocaleString()} | Knowledge source: ${String(data.retrieval_backend).toUpperCase()}`, size: 8 });

  addHeading('INCIDENT');
  addText(field('summary'));
  addText(`Platform: ${field('platform') || 'Not supplied'} | Device: ${field('device_model') || 'Not supplied'} | Player: ${field('player') || 'Not supplied'}`, { size: 8.5 });
  addText(`DRM: ${field('drm_system')} | Reported security: ${field('security_level')} | Required security: ${field('required_security_level')} | Quality: ${field('requested_resolution')}`, { size: 8.5 });

  addHeading('EXECUTIVE SUMMARY');
  addText(data.executive_summary);
  addText(`Confidence: ${String(data.confidence).toUpperCase()} | Analysis mode: ${String(data.mode).toUpperCase()}`, { size: 8.5, bold: true });

  addHeading('ROOT-CAUSE PROBABILITY');
  data.root_causes.forEach((item, index) => addText(`${index + 1}. ${Number(item.probability).toFixed(1)}% - ${item.cause}`, { bold: index === 0 }));

  addHeading('EVIDENCE CHAIN');
  if (data.evidence.length) {
    data.evidence.forEach((item, index) => addText(`${index + 1}. ${item.source}: ${item.observation} - ${item.implication}`));
  } else {
    addText('No strong evidence was detected. Add more technical evidence to improve confidence.');
  }

  addHeading('EXPECTED BEHAVIOR');
  addText(data.expected_behavior);

  addHeading('SUGGESTED VERIFICATION TESTS');
  data.suggested_tests.forEach((test, index) => addText(`${index + 1}. ${test}`));

  addHeading('RETRIEVED KNOWLEDGE');
  if (data.retrieved_sources.length) {
    data.retrieved_sources.forEach((source, index) => {
      addText(`${index + 1}. ${source.title} (match ${Number(source.score).toFixed(2)})`, { bold: true });
      addText(source.content, { size: 8.5 });
      if (source.source_url) addText(`Source: ${source.source_url}`, { size: 8 });
    });
  } else {
    addText('No matching knowledge sources were returned.');
  }

  addHeading('CAVEATS');
  data.caveats.forEach((caveat, index) => addText(`${index + 1}. ${caveat}`, { size: 8.5 }));
  return lines;
}

function pdfEscape(value) {
  return pdfSafeText(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function createPdfBytes(data) {
  const reportLines = buildReportLines(data);
  const pages = [[]];
  let y = 792;
  reportLines.forEach(line => {
    const height = Math.max(10, Number(line.size) + 4);
    if (y - height < 52) { pages.push([]); y = 792; }
    pages[pages.length - 1].push({ ...line, y });
    y -= height;
  });

  const encoder = new TextEncoder();
  const objects = [];
  const pageIds = pages.map((_, index) => 5 + index * 2);
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`;
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';

  pages.forEach((page, index) => {
    const pageId = pageIds[index];
    const contentId = pageId + 1;
    const commands = ['BT'];
    page.forEach(line => {
      const font = line.bold ? 'F2' : 'F1';
      const color = line.color === 'teal' ? '0.05 0.45 0.34 rg' : '0.08 0.12 0.11 rg';
      commands.push(color, `/${font} ${line.size} Tf`, `1 0 0 1 50 ${line.y} Tm`, `(${pdfEscape(line.text)}) Tj`);
    });
    commands.push('0.35 0.42 0.40 rg', '/F1 7 Tf', `1 0 0 1 50 27 Tm`, `(OTT DRM AI Troubleshooting Copilot - Page ${index + 1} of ${pages.length}) Tj`, 'ET');
    const stream = `${commands.join('\n')}\n`;
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId] = `<< /Length ${encoder.encode(stream).length} >>\nstream\n${stream}endstream`;
  });

  let pdf = '%PDF-1.4\n%----\n';
  const offsets = [0];
  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = encoder.encode(pdf).length;
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const xrefOffset = encoder.encode(pdf).length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id += 1) pdf += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return encoder.encode(pdf);
}

function exportReportPdf(data) {
  try {
    const blob = new Blob([createPdfBytes(data)], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ott-drm-diagnosis-${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('PDF diagnosis report exported');
  } catch (_) {
    showToast('Unable to export the PDF report');
  }
}

form.addEventListener('input', updateSignals); form.addEventListener('change', updateSignals);
form.addEventListener('submit', async event => {
  event.preventDefault(); button.disabled = true; button.innerHTML = '<span>Correlating evidence…</span><i>•••</i>';
  results.className = 'results-panel hidden'; results.setAttribute('aria-busy', 'true');
  const status = field('license_status_code');
  const payload = {
    summary: field('summary'), platform: field('platform'), device_model: field('device_model'), player: field('player'),
    drm_system: field('drm_system'), security_level: field('security_level'), required_security_level: field('required_security_level'),
    hdcp_version: field('hdcp_version'), required_hdcp: field('required_hdcp'), requested_resolution: field('requested_resolution'),
    codec: field('codec'), manifest_text: field('manifest_text'), license_status_code: status ? Number(status) : null,
    license_response: field('license_response'), player_logs: field('player_logs'), notes: field('notes')
  };
  try {
    const response = await fetch(`/api/analyze?use_ai=${aiToggle.checked}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await response.json(); if (!response.ok) throw new Error(data.detail || 'Analysis request failed'); render(data);
  } catch (error) {
    results.className = 'results-panel error-state'; results.setAttribute('aria-busy', 'false');
    results.innerHTML = `<div class="error-content"><span class="micro-label">ANALYSIS INTERRUPTED</span><h2>Unable to complete diagnosis</h2><p>${escapeHtml(error.message)}</p></div>`;
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } finally { button.disabled = false; button.innerHTML = '<span>Run forensic analysis</span><i>→</i>'; }
});

document.querySelector('#load-example').addEventListener('click', () => { Object.entries(exampleData).forEach(([id, value]) => setField(id, value)); updateSignals(); showToast('Example incident loaded'); });
document.querySelector('#clear-form').addEventListener('click', () => {
  form.reset(); ['summary','platform','device_model','player','codec','manifest_text','license_response','player_logs','notes'].forEach(id => setField(id, ''));
  results.className = 'results-panel hidden'; updateSignals(); showToast('Incident evidence cleared');
});
document.querySelectorAll('.track-step').forEach(step => step.addEventListener('click', () => {
  document.querySelectorAll('.track-step').forEach(item => item.classList.remove('active')); step.classList.add('active');
  document.querySelector(`#${step.dataset.target}`).scrollIntoView({ behavior: 'smooth', block: 'start' });
}));
const menuButton = document.querySelector('#menu-button'); const sidebar = document.querySelector('#sidebar');
menuButton.addEventListener('click', () => { const open = sidebar.classList.toggle('open'); menuButton.setAttribute('aria-expanded', String(open)); });
sidebar.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { sidebar.classList.remove('open'); menuButton.setAttribute('aria-expanded', 'false'); }));

fetch('/api/config').then(response => response.json()).then(config => {
  const enabled = Boolean(config.ai_enabled); aiToggle.disabled = !enabled;
  document.querySelector('#ai-field-status').textContent = enabled ? 'Evidence-grounded output' : 'Disabled by administrator';
  document.querySelector('#ai-nav-label').textContent = enabled ? 'READY' : 'OFFLINE'; document.querySelector('#ai-dot').className = enabled ? 'status-dot' : 'status-dot muted';
  const ragProvider = String(config.rag_provider || 'pinecone').toUpperCase();
  document.querySelector('#rag-nav-label').textContent = ragProvider; document.querySelector('#hero-rag-label').textContent = ragProvider;
}).catch(() => { aiToggle.disabled = true; document.querySelector('#ai-field-status').textContent = 'Configuration unavailable'; document.querySelector('#ai-nav-label').textContent = 'OFFLINE'; document.querySelector('#rag-nav-label').textContent = 'UNAVAILABLE'; document.querySelector('#hero-rag-label').textContent = 'UNAVAILABLE'; document.querySelector('#rag-dot').className = 'status-dot muted'; });

updateClock(); setInterval(updateClock, 1000); updateSignals();
