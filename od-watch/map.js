// ── Map initialisation ─────────────────────────────────────────────────────
// Depends on: Leaflet, data.js (COLS, events)

const map = L.map('map', { center: [49.2807, -123.0990], zoom: 15 });
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
  subdomains: 'abcd', maxZoom: 19,
}).addTo(map);

function mkIcon(outcome, opacity) {
  const c = COLS[outcome] || COLS["Naloxone administered"];
  const r = outcome === "Fatal" ? 7 : 5;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${r*2+4}" height="${r*2+4}">
    <circle cx="${r+2}" cy="${r+2}" r="${r}" fill="${c.fill}" opacity="${opacity}" stroke="white" stroke-width="1.2"/>
  </svg>`;
  return L.divIcon({ html: svg, className: '', iconSize: [r*2+4, r*2+4], iconAnchor: [r+2, r+2] });
}

function popup(e) {
  const c  = COLS[e.outcome] || COLS["Naloxone administered"];
  const dt = new Date(e.ts).toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' });
  return `<div class="popup-loc">${e.loc}</div>
    <div class="popup-row"><b>Substance:</b> ${e.substance}</div>
    <div class="popup-row"><b>Time:</b> ${dt}</div>
    <span class="popup-badge" style="background:${c.fill}22;color:${c.fill};border:1px solid ${c.fill}44">${c.label}</span>`;
}

let markers = L.layerGroup().addTo(map);
let activeH = 6;
let activeO = new Set(["Naloxone administered","Revived - no EMS","EMS called","Fatal"]);

function render() {
  markers.clearLayers();
  const now = Date.now();
  const f = events.filter(e => e.ts >= now - activeH * 36e5 && activeO.has(e.outcome));
  f.forEach(e => {
    const op = Math.max(0.18, 1 - (now - e.ts) / (activeH * 36e5) * 0.72);
    const m  = L.marker([e.lat, e.lng], { icon: mkIcon(e.outcome, op) });
    m.bindPopup(popup(e), { maxWidth: 220 });
    markers.addLayer(m);
  });
  const nal = f.filter(e => e.outcome === "Naloxone administered").length;
  const rev = f.filter(e => e.outcome === "Revived - no EMS").length;
  const ems = f.filter(e => e.outcome === "EMS called").length;
  const fat = f.filter(e => e.outcome === "Fatal").length;
  document.getElementById('s-total').textContent = f.length.toLocaleString();
  document.getElementById('s-nal').textContent   = nal.toLocaleString();
  document.getElementById('s-ems').textContent   = ems.toLocaleString();
  document.getElementById('s-fatal').textContent = fat.toLocaleString();
  document.getElementById('mo-nal').textContent  = nal.toLocaleString();
  document.getElementById('mo-rev').textContent  = rev.toLocaleString();
  document.getElementById('mo-ems').textContent  = ems.toLocaleString();
  document.getElementById('mo-fat').textContent  = fat.toLocaleString();
  updateHotBlocks(f);
  updateGapLayer(f);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function nearestSCS(lat, lng) {
  if (typeof BASE_ORGS === 'undefined') return null;
  let best = null, bestDist = Infinity;
  BASE_ORGS.filter(s => s.cat === 'SCS / OPS' && s.lat && s.lng).forEach(s => {
    const d = L.latLng(lat, lng).distanceTo(L.latLng(s.lat, s.lng));
    if (d < bestDist) { bestDist = d; best = { name: s.name, dist: Math.round(d) }; }
  });
  return best;
}

// ── Hot Blocks Panel ──────────────────────────────────────────────────────────

function updateHotBlocks(filtered) {
  const list = document.getElementById('hot-blocks-list');
  if (!list) return;
  const byLoc = {};
  filtered.forEach(e => {
    if (!byLoc[e.loc]) byLoc[e.loc] = { count: 0, latest: 0 };
    byLoc[e.loc].count++;
    if (e.ts > byLoc[e.loc].latest) byLoc[e.loc].latest = e.ts;
  });
  const sorted = Object.entries(byLoc).sort((a, b) => b[1].count - a[1].count).slice(0, 5);
  if (!sorted.length) {
    list.innerHTML = '<div class="hot-empty">No events in this window</div>';
    return;
  }
  list.innerHTML = sorted.map(([loc, d], i) => {
    const ldata = LOCS.find(l => l.name === loc);
    const ns    = ldata ? nearestSCS(ldata.lat, ldata.lng) : null;
    const svcRaw = ns ? ns.name.replace(/\s*[–—(].*$/, '').trim() : null;
    const svc    = svcRaw && svcRaw.length > 20 ? svcRaw.slice(0, 19) + '…' : svcRaw;
    const fly    = ldata ? `map.flyTo([${ldata.lat},${ldata.lng}],17)` : '';
    return `<div class="hot-row" onclick="${fly}" title="${loc}">
      <div class="hot-rank">${i + 1}</div>
      <div class="hot-info">
        <div class="hot-loc">${loc}</div>
        <div class="hot-meta">${ns ? `${svc} · ${ns.dist}m` : 'No SCS nearby'}</div>
      </div>
      <div class="hot-right">
        <div class="hot-count">${d.count}</div>
        <div class="hot-ago">${timeAgo(d.latest)}</div>
      </div>
    </div>`;
  }).join('');
}

// ── Spike Alert ───────────────────────────────────────────────────────────────

function checkForSpike() {
  if (!events || !events.length) return;
  const now = Date.now();
  const recent = events.filter(e => e.ts >= now - 30 * 60 * 1000);
  const baseline = getBaselineRate();
  const threshold = Math.max(baseline * 2, 3);
  const banner = document.getElementById('spike-banner');
  if (!banner) return;
  if (recent.length >= threshold) {
    const byLoc = {};
    recent.forEach(e => { byLoc[e.loc] = (byLoc[e.loc] || 0) + 1; });
    const topLoc = Object.entries(byLoc).sort((a, b) => b[1] - a[1])[0][0];
    const ratio  = baseline > 0 ? (recent.length / baseline).toFixed(1) : '—';
    document.getElementById('spike-msg').innerHTML =
      `<strong>${recent.length} events in last 30 min</strong> — ${topLoc} &nbsp;·&nbsp; ${ratio}× baseline`;
    banner.classList.add('show');
  } else {
    banner.classList.remove('show');
  }
}

// ── Service Gap Layer ─────────────────────────────────────────────────────────

let gapLayer = null;
let showGaps = false;

function updateGapLayer(filtered) {
  if (gapLayer) { gapLayer.remove(); gapLayer = null; }
  if (!showGaps || typeof BASE_ORGS === 'undefined') return;
  const scsOrgs = BASE_ORGS.filter(s => s.flags && s.flags.scs && s.lat && s.lng);
  gapLayer = L.layerGroup().addTo(map);
  LOCS.forEach(loc => {
    const count = filtered.filter(e => e.loc === loc.name).length;
    if (count < 2) return;
    const covered = scsOrgs.some(s =>
      L.latLng(loc.lat, loc.lng).distanceTo(L.latLng(s.lat, s.lng)) < 200
    );
    const color = covered ? '#2EA86B' : '#D94040';
    L.circle([loc.lat, loc.lng], {
      radius: 150, color, weight: 2,
      opacity: covered ? 0.3 : 0.7,
      fillColor: color, fillOpacity: covered ? 0.07 : 0.18,
    }).bindPopup(
      `<div class="popup-loc">${loc.name}</div>
       <div class="popup-row">${count} events in window</div>
       <div class="popup-row"><b>SCS within 200m:</b> ${covered
         ? '<span style="color:#2EA86B">Yes — covered</span>'
         : '<span style="color:#D94040">No — coverage gap</span>'}
       </div>`,
      { maxWidth: 220 }
    ).addTo(gapLayer);
  });
}

// ── Shift Briefing ────────────────────────────────────────────────────────────

function showBriefing() {
  const now = Date.now();
  const f = events.filter(e => e.ts >= now - activeH * 36e5 && activeO.has(e.outcome));
  const byOutcome = {}, bySub = {}, byLoc = {};
  f.forEach(e => {
    byOutcome[e.outcome] = (byOutcome[e.outcome] || 0) + 1;
    bySub[e.substance]   = (bySub[e.substance]   || 0) + 1;
    byLoc[e.loc]         = (byLoc[e.loc]         || 0) + 1;
  });
  const topLoc  = Object.entries(byLoc).sort((a, b) => b[1] - a[1])[0];
  const topSubs = Object.entries(bySub).sort((a, b) => b[1] - a[1]).slice(0, 4)
    .map(([s, n]) => `${s} ${n}`).join(', ');
  const hrs = activeH < 24 ? `${activeH}h`
    : activeH < 168 ? `${activeH / 24}d`
    : `${activeH / 168}w`;
  let gapLine = '';
  if (topLoc && typeof BASE_ORGS !== 'undefined') {
    const ldata = LOCS.find(l => l.name === topLoc[0]);
    if (ldata) {
      const covered = BASE_ORGS.filter(s => s.flags && s.flags.scs && s.lat).some(s =>
        L.latLng(ldata.lat, ldata.lng).distanceTo(L.latLng(s.lat, s.lng)) < 200
      );
      if (!covered) gapLine = `\nCoverage gap: ${topLoc[0]} — no SCS/OPS within 200m`;
    }
  }
  const dateStr = new Date().toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
  const text =
`OD Watch Summary — Last ${hrs}, ${dateStr}
Total: ${f.length} | EMS: ${byOutcome['EMS called']||0} | Naloxone: ${byOutcome['Naloxone administered']||0} | Fatal: ${byOutcome['Fatal']||0}
Hottest block: ${topLoc ? `${topLoc[0]} (${topLoc[1]} events)` : '—'}
Substances: ${topSubs || '—'}${gapLine}

[DTES OD Watch — mock data only]`;
  document.getElementById('briefing-text').value = text;
  document.getElementById('briefing-modal').classList.add('show');
}

function copyBriefing() {
  const ta = document.getElementById('briefing-text');
  const btn = document.getElementById('copy-btn');
  navigator.clipboard.writeText(ta.value).then(() => {
    btn.textContent = '✓ Copied';
    setTimeout(() => { btn.textContent = 'Copy to clipboard'; }, 2200);
  }).catch(() => { ta.select(); document.execCommand('copy'); });
}

function closeBriefing() {
  document.getElementById('briefing-modal').classList.remove('show');
}
