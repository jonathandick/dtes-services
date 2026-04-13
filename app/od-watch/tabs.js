// ── Tabs ──────────────────────────────────────────────────────────────────
// Depends on: animation.js (ANIM, animPause), log.js (renderLog)

document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
  const leaving = document.querySelector('.tab.active')?.dataset.pane;
  if (leaving === 'animate' && ANIM.active && !ANIM.paused) animPause();
  document.querySelectorAll('.tab').forEach(x  => x.classList.remove('active'));
  document.querySelectorAll('.pane').forEach(x => x.classList.remove('active'));
  t.classList.add('active');
  document.getElementById(t.dataset.pane + '-pane').classList.add('active');
  if (t.dataset.pane === 'log') renderLog();
}));

// ── Live map filter controls ───────────────────────────────────────────────

// Time window buttons (filter pane)
document.querySelectorAll('.time-btn').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.time-btn').forEach(x => x.classList.remove('active'));
  b.classList.add('active');
  activeH = +b.dataset.h;
  render();
}));

// Outcome chips (filter pane)
document.querySelectorAll('.outcome-chip').forEach(c => c.addEventListener('click', () => {
  const cb = c.querySelector('input');
  cb.checked = !cb.checked;
  c.classList.toggle('on', cb.checked);
  activeO = new Set([...document.querySelectorAll('.outcome-chip input:checked')].map(i => i.value));
  render();
}));
