// ── Event log ─────────────────────────────────────────────────────────────
// Depends on: data.js (events, COLS, timeAgo)

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
