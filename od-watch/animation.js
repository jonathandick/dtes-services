// ── Animation system ──────────────────────────────────────────────────────
// Depends on: data.js (events, COLS), map.js (map, markers, popup, render)
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

// Substance colours — shared by chart.js via global scope
const SUB_COLS = {
  "Fentanyl":                "#D94040",
  "Benzo-adulterated":       "#E8930A",
  "Meth / Stimulant":        "#7B61FF",
  "Medetomidine / Xylazine": "#F2C94C",
  "Carfentanil":             "#EB5757",
  "Unknown":                 "#7EC8C0",
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
  if (!ANIM.active || ANIM.simTime >= ANIM.winEnd) {
    // Fresh play or replay — reset all state
    animSetBounds();
    ANIM.simTime = ANIM.winStart;
    animClearCells();
    markers.clearLayers(); // hide live-view dots while animating
    animCounts = { total:0, nal:0, rev:0, ems:0, fat:0, subs:{} };
    animRenderedUpTo = ANIM.winStart;
    animUpdateCounts();
  }
  ANIM.active   = true;
  ANIM.paused   = false;
  ANIM.realRef  = performance.now();
  ANIM.simRef   = ANIM.simTime;
  animFirstFrame = true;
  document.getElementById('btn-play').textContent = '⏸ Pause';
  document.getElementById('btn-play').classList.add('active');
  document.getElementById('anim-map-overlay').classList.add('show');
  updateMapOverlay();
  initAnimChart();
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
  animClearCells();
  animSetBounds();
  updateMapOverlay();
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

// ── Cell-based aggregation ────────────────────────────────────────────────
// One L.circleMarker per ~55 m grid cell, coloured by dominant substance.
// Radius = 4 + sqrt(count) * 3  →  area ∝ event count.
// Additive rendering: cells grow in place each frame; clearLayers only on reset/scrub.

let CELL_SIZE = 0.0005; // degrees — updated by UI selector; 0 = individual event mode

let animColourBy     = 'substance'; // 'substance' | 'outcome'
let animCells        = new Map(); // cellKey → { count, subCounts, outcomeCounts, lat, lng, circle }
let animIndividuals  = [];        // L.circleMarkers used in individual event mode
let animRenderedUpTo = 0;
let animCounts       = { total:0, nal:0, rev:0, ems:0, fat:0 };

function animCellKey(lat, lng) {
  return `${Math.round(lat / CELL_SIZE)},${Math.round(lng / CELL_SIZE)}`;
}

function animCellCenter(lat, lng) {
  return [Math.round(lat / CELL_SIZE) * CELL_SIZE, Math.round(lng / CELL_SIZE) * CELL_SIZE];
}

function animDominantSub(subCounts) {
  let top = "Unknown", max = 0;
  for (const [k, v] of Object.entries(subCounts)) {
    if (v > max) { max = v; top = k; }
  }
  return top;
}

function animDominantOut(outcomeCounts) {
  let top = "Naloxone administered", max = 0;
  for (const [k, v] of Object.entries(outcomeCounts)) {
    if (v > max) { max = v; top = k; }
  }
  return top;
}

function animCellRadius(count) {
  return 4 + Math.sqrt(count) * 3;
}

function animCellPopupHtml(cell) {
  const rows = Object.entries(cell.subCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `<div style="display:flex;gap:6px;align-items:center;">
      <span style="width:8px;height:8px;border-radius:50%;background:${SUB_COLS[k]||'#aaa'};flex-shrink:0;"></span>
      <span style="flex:1">${k}</span><strong>${v}</strong></div>`)
    .join('');
  return `<div style="font-size:12px;line-height:1.6;">
    <strong style="font-size:13px;">${cell.count} event${cell.count !== 1 ? 's' : ''}</strong>
    <div style="margin-top:4px;">${rows}</div>
  </div>`;
}

function animUpsertCell(e, isNew) {
  // Individual event mode — one dot per event
  if (CELL_SIZE === 0) {
    const fillColor = animColourBy === 'outcome'
      ? (COLS[e.outcome] || COLS["Naloxone administered"]).fill
      : (SUB_COLS[e.substance] || '#7EC8C0');
    const r = e.outcome === "Fatal" ? 7 : 5;
    const m = L.circleMarker([e.lat, e.lng], {
      radius: r, color: 'rgba(255,255,255,0.7)', weight: 1.5,
      fillColor, fillOpacity: isNew ? 0.85 : 0.55,
    }).addTo(map);
    m.bindPopup(popup(e), { maxWidth: 220 });
    animIndividuals.push(m);
    return;
  }

  const key = animCellKey(e.lat, e.lng);
  let cell  = animCells.get(key);
  if (!cell) {
    const [clat, clng] = animCellCenter(e.lat, e.lng);
    cell = { count: 0, subCounts: {}, outcomeCounts: {}, lat: clat, lng: clng, circle: null };
    animCells.set(key, cell);
  }
  cell.count++;
  cell.subCounts[e.substance]  = (cell.subCounts[e.substance]  || 0) + 1;
  cell.outcomeCounts[e.outcome] = (cell.outcomeCounts[e.outcome] || 0) + 1;

  const col = animColourBy === 'outcome'
    ? (COLS[animDominantOut(cell.outcomeCounts)] || COLS["Naloxone administered"]).fill
    : (SUB_COLS[animDominantSub(cell.subCounts)] || '#7EC8C0');
  const r   = animCellRadius(cell.count);

  if (!cell.circle) {
    cell.circle = L.circleMarker([cell.lat, cell.lng], {
      radius:      r,
      color:       'rgba(255,255,255,0.6)',
      weight:      1.5,
      fillColor:   col,
      fillOpacity: isNew ? 0.85 : 0.55,
    }).addTo(map);
  } else {
    cell.circle.setRadius(r);
    cell.circle.setStyle({ fillColor: col });
  }
  cell.circle.bindPopup(animCellPopupHtml(cell), { maxWidth: 220 });
}

function animClearCells() {
  animCells.forEach(cell => { if (cell.circle) map.removeLayer(cell.circle); });
  animCells.clear();
  animIndividuals.forEach(m => map.removeLayer(m));
  animIndividuals = [];
}

const SUB_LABELS = {
  "Fentanyl":                "Fentanyl",
  "Benzo-adulterated":       "Benzo",
  "Meth / Stimulant":        "Meth",
  "Medetomidine / Xylazine": "Medetomidine",
  "Carfentanil":             "Carfentanil",
  "Unknown":                 "Unknown",
};

function updateMapOverlay() {
  const el = document.getElementById('map-overlay');
  if (!el) return;
  if (ANIM.active && animColourBy === 'substance') {
    const rows = Object.entries(SUB_COLS).map(([sub, col]) =>
      `<div class="mo-row">
        <span class="mo-dot" style="background:${col}"></span>
        ${SUB_LABELS[sub] || sub}
        <span class="mo-n" data-sub="${sub}">0</span>
      </div>`
    ).join('');
    el.innerHTML = `<div class="mo-title">⚠ Mock data — prototype</div>${rows}`;
  } else {
    el.innerHTML = `<div class="mo-title">⚠ Mock data — prototype</div>
      <div class="mo-row"><span class="mo-dot" style="background:#2EA86B"></span>Naloxone<span class="mo-n" id="mo-nal">—</span></div>
      <div class="mo-row"><span class="mo-dot" style="background:#7EC8C0"></span>Revived<span class="mo-n" id="mo-rev">—</span></div>
      <div class="mo-row"><span class="mo-dot" style="background:#E8930A"></span>EMS<span class="mo-n" id="mo-ems">—</span></div>
      <div class="mo-row"><span class="mo-dot" style="background:#D94040"></span>Fatal<span class="mo-n" id="mo-fat">—</span></div>`;
    if (ANIM.active) {
      document.getElementById('mo-nal').textContent = animCounts.nal.toLocaleString();
      document.getElementById('mo-rev').textContent = animCounts.rev.toLocaleString();
      document.getElementById('mo-ems').textContent = animCounts.ems.toLocaleString();
      document.getElementById('mo-fat').textContent = animCounts.fat.toLocaleString();
    }
  }
}

function animUpdateCounts() {
  document.getElementById('s-total').textContent = animCounts.total.toLocaleString();
  document.getElementById('s-nal').textContent   = animCounts.nal.toLocaleString();
  document.getElementById('s-ems').textContent   = animCounts.ems.toLocaleString();
  document.getElementById('s-fatal').textContent = animCounts.fat.toLocaleString();
  if (animColourBy === 'substance') {
    document.querySelectorAll('#map-overlay [data-sub]').forEach(el => {
      el.textContent = (animCounts.subs[el.dataset.sub] || 0).toLocaleString();
    });
  } else {
    document.getElementById('mo-nal').textContent = animCounts.nal.toLocaleString();
    document.getElementById('mo-rev').textContent = animCounts.rev.toLocaleString();
    document.getElementById('mo-ems').textContent = animCounts.ems.toLocaleString();
    document.getElementById('mo-fat').textContent = animCounts.fat.toLocaleString();
  }
}

// Additive: only process events that just entered the window this frame.
function renderAnimAdditive(upToTs) {
  const newEvents = events.filter(e =>
    e.ts > animRenderedUpTo &&
    e.ts <= upToTs &&
    e.ts >= ANIM.winStart &&
    ANIM.filterOuts.has(e.outcome) &&
    ANIM.filterSubs.has(e.substance)
  );
  newEvents.forEach(e => {
    animUpsertCell(e, true);
    animCounts.total++;
    if (e.outcome === "Naloxone administered") animCounts.nal++;
    if (e.outcome === "Revived - no EMS")      animCounts.rev++;
    if (e.outcome === "EMS called")            animCounts.ems++;
    if (e.outcome === "Fatal")                 animCounts.fat++;
    animCounts.subs[e.substance] = (animCounts.subs[e.substance] || 0) + 1;
  });
  if (newEvents.length) animUpdateCounts();
  animRenderedUpTo = upToTs;
}

// Full rebuild — used only for scrub.
function renderAnimFull(upToTs) {
  animClearCells();
  animCounts = { total:0, nal:0, rev:0, ems:0, fat:0, subs:{} };
  animRenderedUpTo = ANIM.winStart;
  if (upToTs <= ANIM.winStart) { animUpdateCounts(); return; }

  const f = events.filter(e =>
    e.ts >= ANIM.winStart && e.ts <= upToTs &&
    ANIM.filterOuts.has(e.outcome) &&
    ANIM.filterSubs.has(e.substance)
  );
  f.forEach(e => {
    animUpsertCell(e, false);
    animCounts.total++;
    if (e.outcome === "Naloxone administered") animCounts.nal++;
    if (e.outcome === "Revived - no EMS")      animCounts.rev++;
    if (e.outcome === "EMS called")            animCounts.ems++;
    if (e.outcome === "Fatal")                 animCounts.fat++;
    animCounts.subs[e.substance] = (animCounts.subs[e.substance] || 0) + 1;
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

// Colour-by buttons
document.querySelectorAll('#colour-by-btns .speed-btn').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('#colour-by-btns .speed-btn').forEach(x => x.classList.remove('active'));
  b.classList.add('active');
  animColourBy = b.dataset.colourby;
  if (CELL_SIZE === 0) {
    // Individual mode: markers carry no event reference, must rebuild to recolour
    renderAnimFull(ANIM.simTime);
  } else {
    // Cell mode: recolour existing circles in place — no animation reset needed
    animCells.forEach(cell => {
      if (!cell.circle) return;
      const col = animColourBy === 'outcome'
        ? (COLS[animDominantOut(cell.outcomeCounts)] || COLS["Naloxone administered"]).fill
        : (SUB_COLS[animDominantSub(cell.subCounts)] || '#7EC8C0');
      cell.circle.setStyle({ fillColor: col });
    });
  }
  updateMapOverlay();
}));

// Cell size buttons
document.querySelectorAll('#cell-size-btns .speed-btn').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('#cell-size-btns .speed-btn').forEach(x => x.classList.remove('active'));
  b.classList.add('active');
  CELL_SIZE = b.dataset.cell === 'individual' ? 0 : +b.dataset.cell;
  if (ANIM.active) animReset();
}));

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
