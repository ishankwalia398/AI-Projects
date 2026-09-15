(() => {
  const root = document.documentElement;
  let mode = 'light';
  try { mode = localStorage.getItem('qa-sherlock-theme') || 'light'; } catch {}
  if (!['light', 'dark'].includes(mode)) mode = 'light';
  root.dataset.theme = mode;
  function bind() {
    const button = document.getElementById('theme-toggle');
    if (!button) return;
    const update = () => {
      const dark = root.dataset.theme === 'dark';
      button.querySelector('.mode-label').textContent = dark ? 'Dark mode' : 'Light mode';
      button.setAttribute('aria-label', `${dark ? 'Dark' : 'Light'} mode selected. Switch to ${dark ? 'light' : 'dark'} mode`);
      button.setAttribute('aria-pressed', String(dark));
    };
    update();
    button.addEventListener('click', () => {
      root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('qa-sherlock-theme', root.dataset.theme); } catch {}
      update();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
