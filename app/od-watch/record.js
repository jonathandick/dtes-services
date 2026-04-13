// ── Record (log a new event) ───────────────────────────────────────────────
// Depends on: map.js (map, markers, render), data.js (LOCS, lcg, events, COLS)

const MLOCS = LOCS.map(l => l.name);
let curLoc  = Math.floor(Math.random() * MLOCS.length);
let selSub  = null, selOut = null;

// Pick-mode state
let pickMode   = false;
let pickedLat  = null, pickedLng = null, pickedLabel = null;
let pickMarker = null;

const pickIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:18px;height:18px;border-radius:50% 50% 50% 0;
    background:var(--teal);border:2px solid #fff;
    box-shadow:0 2px 10px rgba(0,0,0,0.4);
    transform:rotate(-45deg);
  "></div>`,
  iconSize: [18, 18], iconAnchor: [9, 18],
});

function nearestLocName(lat, lng) {
  return LOCS.reduce((best, l) => {
    const d = Math.hypot(l.lat - lat, l.lng - lng);
    return d < best.d ? { name: l.name, d } : best;
  }, { name: LOCS[0].name, d: Infinity }).name;
}

function setPickedLocation(lat, lng) {
  pickedLat   = lat;
  pickedLng   = lng;
  pickedLabel = 'Near ' + nearestLocName(lat, lng);
  document.getElementById('loc-text').textContent = pickedLabel;
  document.getElementById('pick-btn').textContent = 'Clear';
  document.getElementById('pick-btn').className   = 'has-pick';
}

function togglePickMode() {
  // If we have a picked location, "Clear" clears it
  if (pickedLat !== null) {
    pickedLat = null; pickedLng = null; pickedLabel = null;
    if (pickMarker) { map.removeLayer(pickMarker); pickMarker = null; }
    document.getElementById('loc-text').textContent = MLOCS[curLoc] + ' (GPS)';
    document.getElementById('pick-btn').textContent = 'Pick on map';
    document.getElementById('pick-btn').className   = '';
    return;
  }
  // Otherwise toggle pick mode
  pickMode = !pickMode;
  const wrap = document.getElementById('map-wrap');
  const btn  = document.getElementById('pick-btn');
  if (pickMode) {
    wrap.classList.add('map-picking');
    btn.textContent = 'Cancel';
    btn.classList.add('picking');
    document.getElementById('loc-text').textContent = 'Click the map to set location…';
  } else {
    wrap.classList.remove('map-picking');
    btn.textContent = 'Pick on map';
    btn.classList.remove('picking');
    document.getElementById('loc-text').textContent = MLOCS[curLoc] + ' (GPS)';
  }
}

// Map click → place/move marker
map.on('click', function(e) {
  if (!pickMode) return;
  const { lat, lng } = e.latlng;

  if (pickMarker) map.removeLayer(pickMarker);
  pickMarker = L.marker([lat, lng], { icon: pickIcon, draggable: true }).addTo(map);

  pickMarker.on('dragend', function(ev) {
    const p = ev.target.getLatLng();
    setPickedLocation(p.lat, p.lng);
  });

  document.getElementById('map-wrap').classList.remove('map-picking');
  document.getElementById('pick-btn').classList.remove('picking');
  pickMode = false;
  setPickedLocation(lat, lng);
});

// Set initial location text after map renders
setTimeout(() => {
  document.getElementById('loc-text').textContent = MLOCS[curLoc] + ' (GPS)';
}, 600);

function chkReady() {
  document.getElementById('submit-btn').disabled = !(selSub && selOut);
}

document.querySelectorAll('#substance-btns .choice-btn').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('#substance-btns .choice-btn').forEach(x => x.classList.remove('sel'));
  b.classList.add('sel'); selSub = b.dataset.val; chkReady();
}));

document.querySelectorAll('#outcome-btns .choice-btn').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('#outcome-btns .choice-btn').forEach(x => x.classList.remove('sel'));
  b.classList.add('sel'); selOut = b.dataset.val; chkReady();
}));

function submitEvent() {
  let evtLat, evtLng, evtLoc;
  if (pickedLat !== null) {
    evtLat = pickedLat; evtLng = pickedLng; evtLoc = pickedLabel;
  } else {
    const l = LOCS[curLoc] || LOCS[0];
    const r = lcg(Date.now() & 0xfffff);
    evtLat = l.lat + (r() - 0.5) * 0.001;
    evtLng = l.lng + (r() - 0.5) * 0.0016;
    evtLoc = l.name;
  }

  events.unshift({ loc: evtLoc, lat: evtLat, lng: evtLng, ts: Date.now(), substance: selSub, outcome: selOut });

  document.querySelectorAll('.choice-btn').forEach(b => b.classList.remove('sel'));
  selSub = null; selOut = null; chkReady();

  if (pickMarker) { map.removeLayer(pickMarker); pickMarker = null; }
  pickedLat = null; pickedLng = null; pickedLabel = null;
  document.getElementById('pick-btn').textContent = 'Pick on map';
  document.getElementById('pick-btn').className   = '';
  curLoc = Math.floor(Math.random() * MLOCS.length);
  document.getElementById('loc-text').textContent = MLOCS[curLoc] + ' (GPS)';

  const t = document.getElementById('toast');
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);

  render();
}
