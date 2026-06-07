const app = document.getElementById('app');
let latestData = null;
let connectionState = 'connecting';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatTime(value) {
  if (!value) return 'never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

async function postMessageToHost(message) {
  await fetch('/api/message', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(message)
  });
}

function renderError(data) {
  const error = data?.error || {};
  app.innerHTML = `
    <section class="topbar">
      <div class="brand">
        <div class="eyebrow">specsmd dashboard</div>
        <h1>No supported workspace</h1>
        <div class="workspace">${escapeHtml(data?.workspacePath || '')}</div>
      </div>
      <div class="toolbar">
        <button class="button" id="refreshButton">Refresh</button>
        <span class="status-pill error">error</span>
      </div>
    </section>
    <div class="error">
      <strong>${escapeHtml(error.code || 'ERROR')}</strong><br>
      ${escapeHtml(error.message || 'Unable to load dashboard.')}
      ${error.hint ? `<br>${escapeHtml(error.hint)}` : ''}
    </div>
  `;
  document.getElementById('refreshButton')?.addEventListener('click', () => {
    postMessageToHost({ type: 'refresh' }).catch(() => {});
  });
}

function renderSection(section) {
  const items = Array.isArray(section.items) ? section.items : [];
  return `
    <section class="section">
      <h2>${escapeHtml(section.title)}</h2>
      ${items.length === 0
        ? `<div class="empty">${escapeHtml(section.empty || 'Nothing to show.')}</div>`
        : items.map((item) => `
            <div class="item" data-path="${escapeHtml(item.path || '')}">
              <div>
                <div class="item-title">${escapeHtml(item.title)}</div>
                <div class="item-meta">${escapeHtml(item.meta || item.path || '')}</div>
              </div>
              <div class="item-status">${escapeHtml(item.status || '')}</div>
            </div>
          `).join('')}
    </section>
  `;
}

function renderDashboard(data) {
  if (!data?.ok) {
    renderError(data);
    return;
  }

  const summary = data.summary || { cards: [], sections: [] };
  const project = data.snapshot?.project || {};
  const warnings = Array.isArray(data.warnings) ? data.warnings : [];
  const statusClass = connectionState === 'live' ? 'live' : '';

  app.innerHTML = `
    <section class="topbar">
      <div class="brand">
        <div class="eyebrow">specsmd dashboard / ${escapeHtml(data.flow || 'unknown')}</div>
        <h1>${escapeHtml(project.name || 'Unknown project')}</h1>
        <div class="workspace">${escapeHtml(data.workspacePath || '')}</div>
      </div>
      <div class="toolbar">
        <span class="status-pill ${statusClass}">${escapeHtml(connectionState)}</span>
        <span class="status-pill">Updated ${escapeHtml(formatTime(data.generatedAt))}</span>
        <button class="button" id="refreshButton">Refresh</button>
      </div>
    </section>

    <section class="cards">
      ${summary.cards.map((card) => `
        <div class="metric">
          <div class="metric-label">${escapeHtml(card.label)}</div>
          <div class="metric-value">${escapeHtml(card.value)}</div>
          <div class="metric-detail">${escapeHtml(card.detail)}</div>
        </div>
      `).join('')}
    </section>

    ${warnings.length > 0
      ? `<section class="warnings">${warnings.map((warning) => `<div>${escapeHtml(warning)}</div>`).join('')}</section>`
      : ''}

    <section class="grid">
      ${summary.sections.map(renderSection).join('')}
    </section>
  `;

  document.getElementById('refreshButton')?.addEventListener('click', () => {
    postMessageToHost({ type: 'refresh' }).catch(() => {});
  });

  app.querySelectorAll('.item[data-path]').forEach((item) => {
    item.addEventListener('dblclick', () => {
      const path = item.getAttribute('data-path');
      if (path) {
        postMessageToHost({ type: 'openArtifact', kind: 'file', path }).catch(() => {});
      }
    });
  });
}

async function loadInitial() {
  const response = await fetch('/api/snapshot', { cache: 'no-store' });
  latestData = await response.json();
  renderDashboard(latestData);
}

function connectEvents() {
  const events = new EventSource('/events');
  events.addEventListener('open', () => {
    connectionState = 'live';
    if (latestData) renderDashboard(latestData);
  });
  events.addEventListener('error', () => {
    connectionState = 'reconnecting';
    if (latestData) renderDashboard(latestData);
  });
  events.addEventListener('snapshot', (event) => {
    latestData = JSON.parse(event.data);
    connectionState = 'live';
    renderDashboard(latestData);
  });
}

loadInitial()
  .then(connectEvents)
  .catch((error) => {
    renderError({
      ok: false,
      error: {
        code: 'LOAD_FAILED',
        message: error.message || String(error)
      }
    });
  });
