// ── Animated chart (live, alongside the map) ──────────────────────────────
// Depends on: Chart.js (global), data.js (events), animation.js (ANIM)

// Derive from SUB_COLS defined in animation.js (loaded first)
const CHART_SUBS = Object.entries(SUB_COLS).map(([key, color]) => ({ key, color }));

let animChart        = null;
let animChartBinMs   = 3600000;
let animChartLastBin = -1;
let animChartBins    = [];

function initAnimChart() {
  const span = ANIM.winEnd - ANIM.winStart;
  if      (span <= 2  * 86400000) animChartBinMs = 3600000;
  else if (span <= 14 * 86400000) animChartBinMs = 6 * 3600000;
  else                             animChartBinMs = 86400000;

  const numBins = Math.ceil(span / animChartBinMs);
  const labels  = [];
  animChartBins = Array.from({ length: numBins }, () => {
    const b = { total: 0 };
    CHART_SUBS.forEach(s => { b[s.key] = 0; });
    return b;
  });

  // Pre-bucket all events (revealed progressively during playback)
  events.forEach(e => {
    if (e.ts < ANIM.winStart || e.ts >= ANIM.winEnd) return;
    if (!ANIM.filterOuts.has(e.outcome) || !ANIM.filterSubs.has(e.substance)) return;
    const i = Math.floor((e.ts - ANIM.winStart) / animChartBinMs);
    if (i >= 0 && i < numBins) {
      animChartBins[i].total++;
      if (animChartBins[i][e.substance] !== undefined) animChartBins[i][e.substance]++;
    }
  });

  for (let i = 0; i < numBins; i++) {
    const ts = ANIM.winStart + i * animChartBinMs;
    const d  = new Date(ts);
    labels.push(animChartBinMs < 86400000
      ? d.toLocaleString('en-CA', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
      : d.toLocaleString('en-CA', { month:'short', day:'numeric' })
    );
  }

  animChartLastBin = -1;

  // Dataset layout: [0..N-1] per-bin (left axis y), [N..2N-1] cumulative (right axis y2)
  // where N = 1 (total) + CHART_SUBS.length
  const nd = () => Array(numBins).fill(null);
  const datasets = [
    // Per-bin (solid, left axis)
    { label:'Total', data:nd(), borderColor:'#FFFFFF', borderWidth:2,
      pointRadius:0, tension:0.4, fill:false, yAxisID:'y', order:0 },
    ...CHART_SUBS.map(s => ({
      label:s.key, data:nd(), borderColor:s.color, borderWidth:1.5,
      pointRadius:0, tension:0.4, fill:false, yAxisID:'y', order:1,
    })),
    // Cumulative (dashed, right axis)
    { label:'Total (cumul.)', data:nd(), borderColor:'rgba(255,255,255,0.45)', borderWidth:1.5,
      borderDash:[5,3], pointRadius:0, tension:0.4, fill:false, yAxisID:'y2', order:2 },
    ...CHART_SUBS.map(s => ({
      label:s.key+' (cumul.)', data:nd(), borderColor:s.color+'99', borderWidth:1,
      borderDash:[4,3], pointRadius:0, tension:0.4, fill:false, yAxisID:'y2', order:3,
    })),
  ];

  if (animChart) { animChart.destroy(); animChart = null; }

  const N   = 1 + CHART_SUBS.length;
  const ctx = document.getElementById('anim-od-chart').getContext('2d');
  animChart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: false, animation: false,
      interaction: { mode:'index', intersect:false },
      plugins: {
        legend: {
          labels: {
            filter: (item) => item.datasetIndex < N,
            color:'rgba(255,255,255,0.55)', font:{ family:"'DM Sans',sans-serif", size:10 },
            boxWidth:8, padding:8,
          },
        },
        tooltip: {
          backgroundColor:'rgba(7,31,27,0.95)', borderColor:'rgba(255,255,255,0.1)', borderWidth:1,
          titleColor:'#fff', bodyColor:'rgba(255,255,255,0.7)',
          titleFont:{ family:"'DM Sans',sans-serif", size:11 },
          bodyFont: { family:"'DM Sans',sans-serif", size:11 },
          callbacks: {
            label: ctx => {
              const isCumul = ctx.datasetIndex >= N;
              const v = ctx.raw;
              if (v === null) return null;
              return ` ${ctx.dataset.label}: ${v}${isCumul ? ' (running total)' : ''}`;
            }
          }
        },
      },
      scales: {
        x:  { ticks:{ color:'rgba(255,255,255,0.3)', font:{size:9}, maxRotation:30, maxTicksLimit:8 },
               grid:{ color:'rgba(255,255,255,0.04)' } },
        y:  { position:'left', beginAtZero:true,
               ticks:{ color:'rgba(255,255,255,0.3)', font:{size:9} },
               grid:{ color:'rgba(255,255,255,0.04)' },
               title:{ display:true, text:'per period', color:'rgba(255,255,255,0.2)', font:{size:9} } },
        y2: { position:'right', beginAtZero:true,
               ticks:{ color:'rgba(255,255,255,0.2)', font:{size:9} },
               grid:{ drawOnChartArea:false },
               title:{ display:true, text:'running total', color:'rgba(255,255,255,0.2)', font:{size:9} } },
      },
    },
  });

  document.getElementById('anim-chart-panel').classList.add('show');
}

function updateAnimChart(upToTs) {
  if (!animChart) return;
  const bin = Math.min(
    Math.floor((upToTs - ANIM.winStart) / animChartBinMs),
    animChartBins.length - 1
  );
  if (bin === animChartLastBin || bin < 0) return;
  animChartLastBin = bin;

  const allKeys = ['total', ...CHART_SUBS.map(s => s.key)];
  const N = allKeys.length;

  allKeys.forEach((key, ki) => {
    const perDs = animChart.data.datasets[ki];
    for (let i = 0; i <= bin; i++) perDs.data[i] = animChartBins[i][key];

    const cumDs = animChart.data.datasets[ki + N];
    let sum = 0;
    for (let i = 0; i <= bin; i++) { sum += animChartBins[i][key]; cumDs.data[i] = sum; }
  });

  animChart.update('none');
}
