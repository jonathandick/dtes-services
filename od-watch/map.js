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
}
