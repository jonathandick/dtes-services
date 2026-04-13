// ── Mock data ──────────────────────────────────────────────────────────────
const LOCS = [
  {name:"Hastings & Main St",        lat:49.28015, lng:-123.09945, w:0.20},
  {name:"Hastings & Carrall St",     lat:49.28100, lng:-123.10270, w:0.15},
  {name:"Columbia & Hastings",       lat:49.28060, lng:-123.10110, w:0.12},
  {name:"Oppenheimer Park",          lat:49.28170, lng:-123.09600, w:0.10},
  {name:"Hastings & Gore Ave",       lat:49.28000, lng:-123.09510, w:0.09},
  {name:"Powell & Main St",          lat:49.28220, lng:-123.10010, w:0.07},
  {name:"Abbott & Hastings",         lat:49.28080, lng:-123.10430, w:0.07},
  {name:"Pigeon Park",               lat:49.28090, lng:-123.10300, w:0.06},
  {name:"Princess & Hastings",       lat:49.28050, lng:-123.09680, w:0.05},
  {name:"Hawks Ave & Hastings",      lat:49.28010, lng:-123.09280, w:0.04},
  {name:"Dunlevy & Hastings",        lat:49.27990, lng:-123.09050, w:0.03},
  {name:"Campbell & Hastings",       lat:49.27970, lng:-123.08790, w:0.02},
];

const SUBS = [
  "Fentanyl","Fentanyl","Fentanyl","Fentanyl","Fentanyl","Fentanyl",
  "Benzo-adulterated","Benzo-adulterated","Benzo-adulterated",
  "Meth / Stimulant","Meth / Stimulant",
  "Medetomidine / Xylazine",
  "Carfentanil",
  "Unknown",
];

const OUTS = [
  "Naloxone administered","Naloxone administered","Naloxone administered","Naloxone administered",
  "EMS called","EMS called",
  "Revived - no EMS","Revived - no EMS",
  "Fatal",
];

const COLS = {
  "Naloxone administered": { fill:"#2EA86B", label:"Naloxone given" },
  "Revived - no EMS":      { fill:"#7EC8C0", label:"Revived (no EMS)" },
  "EMS called":            { fill:"#E8930A", label:"EMS called" },
  "Fatal":                 { fill:"#D94040", label:"Fatal" },
};

// Seeded RNG
function lcg(s) {
  s = s >>> 0;
  return () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 0x100000000; };
}

// Generate mock events
let events = [];
function gen() {
  const r = lcg(9001), now = Date.now(), d60 = 60 * 24 * 36e5;
  for (let i = 0; i < 4000; i++) {
    let cw = 0, li = 0;
    const r1 = r();
    for (let j = 0; j < LOCS.length; j++) { cw += LOCS[j].w; if (r1 <= cw) { li = j; break; } }
    const l = LOCS[li];
    events.push({
      loc: l.name,
      lat: l.lat + (r() - 0.5) * 0.0012,
      lng: l.lng + (r() - 0.5) * 0.0020,
      ts:  Date.now() - Math.pow(r(), 1.4) * d60,
      substance: SUBS[Math.floor(r() * SUBS.length)],
      outcome:   OUTS[Math.floor(r() * OUTS.length)],
    });
  }
  events.sort((a, b) => b.ts - a.ts);
}

function timeAgo(ts) {
  const d = Date.now() - ts, m = Math.floor(d / 6e4);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// Average events per 30-min slot for the current hour-of-day across the full dataset
function getBaselineRate() {
  const hour = new Date().getHours();
  const sameHour = events.filter(e => new Date(e.ts).getHours() === hour);
  // 60 days × 2 half-hour slots per hour = 120 historical slots
  return sameHour.length / 120;
}
