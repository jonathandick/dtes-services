// ── Event log ─────────────────────────────────────────────────────────────
// Depends on: data.js (events, COLS)

function timeAgo(ts) {
  const d = Date.now() - ts, m = Math.floor(d / 6e4);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function renderLog() {
  document.getElementById('log-pane').innerHTML = events.slice(0, 100).map(e => {
    const c = COLS[e.outcome] || COLS["Naloxone administered"];
    return `<div class="log-item">
      <div class="log-dot" style="background:${c.fill}"></div>
      <div class="log-info">
        <div class="log-loc">${e.loc}</div>
        <div class="log-meta">${e.substance} · ${c.label}</div>
      </div>
      <div class="log-time">${timeAgo(e.ts)}</div>
    </div>`;
  }).join('');
}
