(() => {
  const api = (window.QA_SHERLOCK_API_URL || '').replace(/\/$/, '');
  const root = document.documentElement;
  const themeButton = document.getElementById('theme-toggle');
  let theme = 'light';
  try { theme = localStorage.getItem('qa-sherlock-theme') || 'light'; } catch {}
  root.dataset.theme = theme;
  const updateThemeLabel = () => themeButton.setAttribute('aria-label', `Switch to ${root.dataset.theme === 'dark' ? 'light' : 'dark'} mode`);
  updateThemeLabel();
  themeButton.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('qa-sherlock-theme', root.dataset.theme); } catch {}
    updateThemeLabel();
  });

  const escapeHtml = value => String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  const formatSize = size => size < 1024 * 1024 ? `${Math.ceil(size / 1024)} KB` : `${(size / 1024 / 1024).toFixed(1)} MB`;
  function bindFiles(inputId, zoneId, listId) {
    const input = document.getElementById(inputId), zone = document.getElementById(zoneId), list = document.getElementById(listId);
    const render = () => { list.innerHTML = [...input.files].map(file => `<span class="file-chip">${escapeHtml(file.name)} · ${formatSize(file.size)}</span>`).join(''); };
    input.addEventListener('change', render);
    for (const event of ['dragenter', 'dragover']) zone.addEventListener(event, e => { e.preventDefault(); zone.classList.add('drag'); });
    for (const event of ['dragleave', 'drop']) zone.addEventListener(event, e => { e.preventDefault(); zone.classList.remove('drag'); });
    zone.addEventListener('drop', e => { input.files = e.dataTransfer.files; render(); });
  }
  bindFiles('failure', 'failure-zone', 'failure-list');
  bindFiles('evidence', 'evidence-zone', 'evidence-list');
  const fileToBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.onerror = reject;
    reader.onload = () => resolve(String(reader.result).split(',', 2)[1]); reader.readAsDataURL(file);
  });

  fetch(`${api}/api/status`).then(r => r.json()).then(data => {
    const values = data.integrations, core = ['COMMANDCODE_API_KEY','PINECONE_API_KEY','PINECONE_HOST'];
    const ready = core.every(key => values[key]);
    const status = document.getElementById('status'); status.classList.toggle('ready', ready);
    status.lastChild.textContent = ready ? ' Core services configured · ready for uploaded data' : ' Add Command Code and Pinecone values to .env before a live run';
  }).catch(() => { document.getElementById('status').lastChild.textContent = ' Upload service is unavailable'; });

  document.getElementById('investigation-form').addEventListener('submit', async event => {
    event.preventDefault();
    const failure = document.getElementById('failure').files[0], evidence = [...document.getElementById('evidence').files];
    const message = document.getElementById('message'), button = document.getElementById('submit'), result = document.getElementById('result');
    message.className = 'message'; result.hidden = true;
    if (!failure || !evidence.length) { message.classList.add('error'); message.textContent = 'Choose one Playwright report and at least one evidence file.'; return; }
    if (failure.size > 10 * 1024 * 1024 || evidence.some(file => file.size > 5 * 1024 * 1024) || evidence.reduce((sum, file) => sum + file.size, 0) > 15 * 1024 * 1024) {
      message.classList.add('error'); message.textContent = 'One or more files exceed the upload limits shown above.'; return;
    }
    button.disabled = true; button.querySelector('span').textContent = 'Investigating…';
    message.textContent = 'Uploading evidence and running the six-agent investigation. This can take several minutes.';
    try {
      const body = {failure:{name:failure.name,content:await fileToBase64(failure)}, evidence:await Promise.all(evidence.map(async file => ({name:file.name,content:await fileToBase64(file)}))), jira_key:document.getElementById('jira-key').value.trim(), use_pinecone:document.getElementById('use-pinecone').checked, run_evaluation:document.getElementById('run-evaluation').checked};
      const response = await fetch(`${api}/api/investigate`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error_type ? `${data.error} (${data.error_type})` : data.error || 'Investigation failed');
      message.textContent = 'Investigation complete.';
      const reportUrl = data.report_url.startsWith('http') ? data.report_url : `${api}${data.report_url}`;
      result.innerHTML = `<div class="agents">RUN ${escapeHtml(data.run_id)}</div><h2>${escapeHtml(data.summary)}</h2><div class="score">${Math.round(Number(data.confidence) * 100)}%</div><small>Analyst confidence estimate · evaluation ${escapeHtml(data.evaluation)}</small><br><a href="${escapeHtml(reportUrl)}">Open investigation report →</a>`;
      result.hidden = false; result.scrollIntoView({behavior:'smooth', block:'center'});
    } catch (error) {
      message.classList.add('error'); message.textContent = error.message;
    } finally { button.disabled = false; button.querySelector('span').textContent = 'Start investigation'; }
  });
})();
