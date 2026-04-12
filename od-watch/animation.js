// ── Animation system ──────────────────────────────────────────────────────
// Depends on: data.js (events, COLS), map.js (map, markers, mkIcon, popup, render, activeO)
// chart.js (initAnimChart, updateAnimChart) — called at runtime, loaded after this file

const ANIM = {
  active:   false,
  paused:   false,
  winH:     6,           // hours in animation window (mirrors filter default)
  winStart: 0,
  winEnd:   0,
  simTime:  0,
  realRef:  0,
  simRef:   0,
  speed:    1800000,     // sim-ms per real-ms  (default: 30 min / sec)
  raf:      null,
  filterSubs: new Set(["Fentanyl","Benzo-adulterated","Meth / Stimulant","Medetomidine / Xylazine","Carfentanil","Unknown"]),
  filterOuts: new Set(["Naloxone administered","Revived - no EMS","EMS called","Fatal"]),
};

function fmtSimTime(ts) {
  return new Date(ts).toLocaleString('en-CA', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
}

function animEstLabel() {
  const s = document.getElementById('anim-date-start');
  const e = document.getElementById('anim-date-end');
  let winMs;
  if (s && s.value && e && e.value) {
    winMs = new Date(e.value).getTime() - new Date(s.value).getTime();
  } else {
    winMs = ANIM.winH * 3600000;
  }
  if (winMs <= 0) return '—';
  const durSec = winMs / ANIM.speed;
  const dur    = durSec < 60 ? `${Math.round(durSec)}s` : `${Math.round(durSec/60)}m`;
  const winH   = winMs / 3600000;
  const label  = winH < 24 ? `${Math.round(winH)}h` : `${(winH/24).toFixed(1)}d`;
  return `~<strong>${dur}</strong> to play <strong>${label}</strong> of events`;
}

function animUpdateEst() {
  document.getElementById('anim-est').innerHTML = animEstLabel();
}

function animSetBounds() {
  const startEl = document.getElementById('anim-date-start');
  const endEl   = document.getElementById('anim-date-end');
  if (startEl.value && endEl.value) {
    ANIM.winStart = new Date(startEl.value).getTime();
    ANIM.winEnd   = new Date(endEl.value).getTime();
  } else {
    const now    = Date.now();
    ANIM.winEnd  = now;
    ANIM.winStart = now - ANIM.winH * 3600000;
  }
  const fmt = ts => new Date(ts).toLocaleString('en-CA', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
  document.getElementById('anim-bound-start').textContent = fmt(ANIM.winStart);
  document.getElementById('anim-bound-end').textContent   = fmt(ANIM.winEnd);
}

function animPlay() {
  if (!ANIM.active) {
    animSetBounds();
    ANIM.simTime = ANIM.winStart;
  }
  ANIM.active   = true;
  ANIM.paused   = false;
  ANIM.realRef  = performance.now();
  ANIM.simRef   = ANIM.simTime;
  animFirstFrame = true;
  document.getElementById('btn-play').textContent = '⏸ Pause';
  document.getElementById('btn-play').classList.add('active');
  document.getElementById('anim-map-overlay').classList.add('show');
  initAnimChart();
  renderAnimFull(ANIM.simTime);
  animUpdateProgress();
  ANIM.raf = requestAnimationFrame(animFrame);
}

function animPause() {
  ANIM.paused = true;
  if (ANIM.raf) cancelAnimationFrame(ANIM.raf);
  document.getElementById('btn-play').textContent = '▶ Resume';
  document.getElementById('btn-play').classList.remove('active');
}

function animToggle() {
  if (!ANIM.active || ANIM.paused) animPlay();
  else animPause();
}

function animReset() {
  ANIM.active = false;
  ANIM.paused = false;
  if (ANIM.raf) cancelAnimationFrame(ANIM.raf);
  document.getElementById('btn-play').textContent = '▶ Play';
  document.getElementById('btn-play').classList.remove('active');
  document.getElementById('anim-fill').style.width  = '0%';
  document.getElementById('amo-fill').style.width   = '0%';
  document.getElementById('anim-current-time').innerHTML = '—<span>current time</span>';
  document.getElementById('amo-time').textContent   = '—';
  document.getElementById('anim-map-overlay').classList.remove('show');
  document.getElementById('anim-chart-panel').classList.remove('show');
  if (animChart) { animChart.destroy(); animChart = null; }
  animSetBounds();
  render();
}

let animFirstFrame = false;
function animFrame(realNow) {
  if (animFirstFrame) {
    animFirstFrame = false;
    ANIM.realRef = realNow;
    ANIM.simRef  = ANIM.simTime;
  }
  const realElapsed = realNow - ANIM.realRef;
  ANIM.simTime = ANIM.simRef + realElapsed * ANIM.speed;

  if (ANIM.simTime >= ANIM.winEnd) {
    ANIM.simTime = ANIM.winEnd;
    renderAnimAdditive(ANIM.simTime);
    updateAnimChart(ANIM.simTime);
    animUpdateProgress();
    animPause();
    document.getElementById('btn-play').textContent = '▶ Replay';
    return;
  }

  renderAnimAdditive(ANIM.simTime);
  updateAnimChart(ANIM.simTime);
  animUpdateProgress();
  ANIM.raf = requestAnimationFrame(animFrame);
}

function animUpdateProgress() {
  const pct   = (ANIM.simTime - ANIM.winStart) / (ANIM.winEnd - ANIM.winStart) * 100;
  const label = fmtSimTime(ANIM.simTime);
  document.getElementById('anim-fill').style.width  = Math.min(100, pct) + '%';
  document.getElementById('amo-fill').style.width   = Math.min(100, pct) + '%';
  document.getElementById('anim-current-time').innerHTML = label + '<span>current time</span>';
  document.getElementById('amo-time').textContent   = label;
}

// ── Additive rendering ────────────────────────────────────────────────────
// Only new markers are added each frame; clearLayers() only on reset/scrub.
// CSS @keyframes handles the pop-in — no per-frame SVG rebuilds needed.

let animRenderedUpTo = 0;
let animCounts = { total:0, nal:0, rev:0, ems:0, fat:0 };

function mkIconAnimNew(outcome) {
  const c = COLS[outcome] || COLS["Naloxone administered"];
  const r = outcome === "Fatal" ? 8 : 6;
  const d = r * 2;
  return L.divIcon({
    html: `<div class="mp" style="width:${d}px;height:${d}px;border-radius:50%;background:${c.fill};border:2px solid rgba(255,255,255,0.9);box-shadow:0 1px 6px rgba(0,0,0,0.35);"></div>`,
    className: '', iconSize: [d, d], iconAnchor: [r, r],
  });
}

function mkIconAnimOld(outcome) {
  const c = COLS[outcome] || COLS["Naloxone administered"];
  const r = outcome === "Fatal" ? 7 : 5;
  const d = r * 2;
  return L.divIcon({
    html: `<div style="width:${d}px;height:${d}px;border-radius:50%;background:${c.fill};opacity:0.7;border:1.5px solid rgba(255,255,255,0.8);box-shadow:0 1px 4px rgba(0,0,0,0.25);"></div>`,
    className: '', iconSize: [d, d], iconAnchor: [r, r],
  });
}

function animUpdateCounts() {
  document.getElementById('s-total').textContent = animCounts.total.toLocaleString();
  document.getElementById('s-nal').textContent   = animCounts.nal.toLocaleString();
  document.getElementById('s-ems').textContent   = animCounts.ems.toLocaleString();
  document.getElementById('s-fatal').textContent = animCounts.fat.toLocaleString();
  document.getElementById('mo-nal').textContent  = animCounts.nal.toLocaleString();
  document.getElementById('mo-rev').textContent  = animCounts.rev.toLocaleString();
  document.getElementById('mo-ems').textContent  = animCounts.ems.toLocaleString();
  document.getElementById('mo-fat').textContent  = animCounts.fat.toLocaleString();
}

// Additive: only add markers for events that just entered the window.
// Called every rAF tick — must be very cheap.
function renderAnimAdditive(upToTs) {
  const newEvents = events.filter(e =>
    e.ts > animRenderedUpTo &&
    e.ts <= upToTs &&
    e.ts >= ANIM.winStart &&
    ANIM.filterOuts.has(e.outcome) &&
    ANIM.filterSubs.has(e.substance)
  );
  newEvents.forEach(e => {
    const m = L.marker([e.lat, e.lng], { icon: mkIconAnimNew(e.outcome) });
    m.bindPopup(popup(e), { maxWidth: 220 });
    markers.addLayer(m);
    animCounts.total++;
    if (e.outcome === "Naloxone administered") animCounts.nal++;
    if (e.outcome === "Revived - no EMS")      animCounts.rev++;
    if (e.outcome === "EMS called")            animCounts.ems++;
    if (e.outcome === "Fatal")                 animCounts.fat++;
  });
  if (newEvents.length) animUpdateCounts();
  animRenderedUpTo = upToTs;
}

// Full rebuild — used only for reset and scrub.
function renderAnimFull(upToTs) {
  markers.clearLayers();
  animCounts = { total:0, nal:0, rev:0, ems:0, fat:0 };
  animRenderedUpTo = ANIM.winStart;
  if (upToTs <= ANIM.winStart) { animUpdateCounts(); return; }
  const f = events.filter(e =>
    e.ts >= ANIM.winStart && e.ts <= upToTs &&
    ANIM.filterOuts.has(e.outcome) &&
    ANIM.filterSubs.has(e.substance)
  );
  f.forEach(e => {
    const m = L.marker([e.lat, e.lng], { icon: mkIconAnimOld(e.outcome) });
    m.bindPopup(popup(e), { maxWidth: 220 });
    markers.addLayer(m);
    animCounts.total++;
    if (e.outcome === "Naloxone administered") animCounts.nal++;
    if (e.outcome === "Revived - no EMS")      animCounts.rev++;
    if (e.outcome === "EMS called")            animCounts.ems++;
    if (e.outcome === "Fatal")                 animCounts.fat++;
  });
  animRenderedUpTo = upToTs;
  animUpdateCounts();
}

// ── Controls ──────────────────────────────────────────────────────────────

// Scrub progress track
document.getElementById('anim-track').addEventListener('click', function(e) {
  if (!ANIM.active) return;
  const rect = this.getBoundingClientRect();
  const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  ANIM.simTime  = ANIM.winStart + pct * (ANIM.winEnd - ANIM.winStart);
  ANIM.realRef  = performance.now();
  ANIM.simRef   = ANIM.simTime;
  renderAnimFull(ANIM.simTime);
  animUpdateProgress();
});

// Window preset buttons — populate date inputs from preset
document.querySelectorAll('#anim-window-btns .time-btn').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('#anim-window-btns .time-btn').forEach(x => x.classList.remove('active'));
  b.classList.add('active');
  ANIM.winH = +b.dataset.h;
  const end   = new Date();
  const start = new Date(end.getTime() - ANIM.winH * 3600000);
  const toLocal = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  document.getElementById('anim-date-start').value = toLocal(start);
  document.getElementById('anim-date-end').value   = toLocal(end);
  if (ANIM.active) animReset();
  animSetBounds();
  animUpdateEst();
}));

// Date inputs — clear active preset and update bounds
['anim-date-start', 'anim-date-end'].forEach(id => {
  document.getElementById(id).addEventListener('change', () => {
    document.querySelectorAll('#anim-window-btns .time-btn').forEach(b => b.classList.remove('active'));
    if (ANIM.active) animReset();
    animUpdateEst();
  });
});

// Substance filter chips
document.querySelectorAll('#anim-subs-grid .anim-chip input').forEach(cb => {
  cb.addEventListener('change', () => {
    cb.closest('.anim-chip').classList.toggle('on', cb.checked);
    if (cb.checked) ANIM.filterSubs.add(cb.value);
    else            ANIM.filterSubs.delete(cb.value);
    if (ANIM.active) animReset();
  });
});
document.getElementById('anim-subs-all').addEventListener('click', () => {
  document.querySelectorAll('#anim-subs-grid .anim-chip input').forEach(cb => {
    cb.checked = true;
    cb.closest('.anim-chip').classList.add('on');
    ANIM.filterSubs.add(cb.value);
  });
  if (ANIM.active) animReset();
});

// Outcome filter chips
document.querySelectorAll('#anim-outs-grid .anim-chip input').forEach(cb => {
  cb.addEventListener('change', () => {
    cb.closest('.anim-chip').classList.toggle('on', cb.checked);
    if (cb.checked) ANIM.filterOuts.add(cb.value);
    else            ANIM.filterOuts.delete(cb.value);
    if (ANIM.active) animReset();
  });
});
document.getElementById('anim-outs-all').addEventListener('click', () => {
  document.querySelectorAll('#anim-outs-grid .anim-chip input').forEach(cb => {
    cb.checked = true;
    cb.closest('.anim-chip').classList.add('on');
    ANIM.filterOuts.add(cb.value);
  });
  if (ANIM.active) animReset();
});

// Speed buttons
document.querySelectorAll('#speed-btns .speed-btn').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('#speed-btns .speed-btn').forEach(x => x.classList.remove('active'));
  b.classList.add('active');
  ANIM.speed = +b.dataset.speed;
  if (ANIM.active && !ANIM.paused) {
    ANIM.realRef = performance.now();
    ANIM.simRef  = ANIM.simTime;
  }
  animUpdateEst();
}));
