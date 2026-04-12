// ── Animated chart (live, alongside the map) ──────────────────────────────
// Depends on: Chart.js (global), data.js (events, COLS), animation.js (ANIM, SUB_COLS, SUB_LABELS, animColourBy)

// Active chart series — set in initAnimChart, read by plugin + updateAnimChart
let animChartSeries = [];

// Independent from the map's animColourBy — chart can show a different dimension
let chartColourBy = 'substance';

function getChartSeries() {
  if (chartColourBy === 'outcome') {
    return Object.entries(COLS).map(([key, col]) => ({ key, color: col.fill, label: col.label }));
  }
  return Object.entries(SUB_COLS).map(([key, color]) => ({ key, color, label: SUB_LABELS[key] || key }));
}

// Reinitialise the chart without touching map animation state (cells, simTime, etc.)
function reinitChartOnly() {
  initAnimChart();
  if (ANIM.active) updateAnimChart(ANIM.simTime);
}

// ── Vertical cursor + hover tooltip plugin ────────────────────────────────────
// Draws a dashed cursor line at the hovered index, then a compact floating box
// with one row per series showing "period count · running total".
function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

const verticalCursorPlugin = {
  id: 'verticalCursor',
  afterDraw(chart) {
    if (!chart.tooltip._active || !chart.tooltip._active.length) return;
    const active = chart.tooltip._active[0];
    const x      = active.element.x;
    const idx    = active.index;
    const { top, bottom, right } = chart.chartArea;
    const ctx = chart.ctx;

    // Dashed vertical line
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.restore();

    // Build one row per series + total header
    const datasets = chart.data.datasets;
    const N = 1 + animChartSeries.length; // total + per-series per-bin datasets
    const rows = [];

    const totalPerBin = datasets[0].data[idx];
    const totalCumul  = datasets[N].data[idx];
    if (totalPerBin !== null && totalCumul !== null) {
      rows.push({ color: '#FFFFFF', label: 'Total', perBin: totalPerBin, cumul: totalCumul });
    }
    animChartSeries.forEach((s, i) => {
      const perBin = datasets[i + 1].data[idx];
      const cumul  = datasets[N + i + 1].data[idx];
      if (perBin !== null && cumul !== null) {
        rows.push({ color: s.color, label: s.label, perBin, cumul });
      }
    });
    if (!rows.length) return;

    const dateLabel = chart.data.labels[idx] || '';
    const lineH = 14, padX = 8, padY = 5;
    const dateH = 16; // extra height for date header
    const boxW  = 175;
    const boxH  = dateH + rows.length * lineH + padY * 2;
    const toRight = x + boxW + 12 < right;
    const bx = toRight ? x + 8 : x - boxW - 8;
    const by = top + 4;

    ctx.save();

    // Background box
    ctx.fillStyle = 'rgba(7,31,27,0.93)';
    rrect(ctx, bx, by, boxW, boxH, 5);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.09)';
    ctx.lineWidth = 1;
    rrect(ctx, bx, by, boxW, boxH, 5);
    ctx.stroke();

    // Date header
    ctx.font = "500 10px 'DM Sans', sans-serif";
    ctx.fillStyle = 'rgba(126,200,192,0.85)';
    ctx.textAlign = 'left';
    ctx.fillText(dateLabel, bx + padX, by + padY + 9);

    // Divider
    ctx.beginPath();
    ctx.moveTo(bx + padX, by + dateH);
    ctx.lineTo(bx + boxW - padX, by + dateH);
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.stroke();

    // Rows
    ctx.font = "10px 'DM Sans', sans-serif";
    rows.forEach((row, i) => {
      const cy = by + dateH + padY + i * lineH + 9;
      // Colour dot
      ctx.fillStyle = row.color;
      ctx.beginPath();
      ctx.arc(bx + padX + 3, cy - 3, 3, 0, Math.PI * 2);
      ctx.fill();
      // Label + combined counts: "N · N total"
      ctx.fillStyle = i === 0 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.72)';
      ctx.textAlign = 'left';
      ctx.fillText(`${row.label}: ${row.perBin} · ${row.cumul} total`, bx + padX + 11, cy);
    });

    ctx.restore();
  },
};

let animChart             = null;
let animChartBinMs        = 3600000;
let animChartLastBin      = -1;
let animChartBins         = [];
let animChartChequeIdxs   = []; // bin indices of cheque Wednesdays in current window

// ── Income assistance cheque dates ───────────────────────────────────────────
// Official BC income assistance payment dates (source: gov.bc.ca/income-assistance).
// Payments are issued on government-scheduled Wednesdays and cover the following month.
// Format: [year, month (0-indexed), day]
const IA_PAYMENT_DATES = [
  // 2025 (estimates — official dates not published for past years)
  [2025, 0, 22], [2025, 1, 19], [2025, 2, 19], [2025, 3, 23],
  [2025, 4, 21], [2025, 5, 25], [2025, 6, 23], [2025, 7, 27],
  [2025, 8, 24], [2025, 9, 22], [2025, 10, 19], [2025, 11, 17],
  // 2026 (official dates from gov.bc.ca/income-assistance)
  [2026, 0, 21], [2026, 1, 25], [2026, 2, 25], [2026, 3, 22],
  [2026, 4, 27], [2026, 5, 24], [2026, 6, 29], [2026, 7, 26],
  [2026, 8, 23], [2026, 9, 21], [2026, 10, 18], [2026, 11, 16],
];

function computeChequeIndices() {
  const numBins = Math.ceil((ANIM.winEnd - ANIM.winStart) / animChartBinMs);
  const idxs = [];
  IA_PAYMENT_DATES.forEach(([y, m, d]) => {
    const ts = new Date(y, m, d, 0, 0, 0, 0).getTime();
    if (ts >= ANIM.winStart && ts < ANIM.winEnd) {
      const i = Math.floor((ts - ANIM.winStart) / animChartBinMs);
      if (i >= 0 && i < numBins) idxs.push(i);
    }
  });
  return idxs;
}

// ── Cheque date line plugin ───────────────────────────────────────────────────
const chequeDatePlugin = {
  id: 'chequeDates',
  afterDraw(chart) {
    if (!animChartChequeIdxs.length) return;
    const { top, bottom } = chart.chartArea;
    const ctx  = chart.ctx;
    const meta = chart.getDatasetMeta(0); // use dataset 0 for x positions
    if (!meta || !meta.data.length) return;

    ctx.save();
    animChartChequeIdxs.forEach(idx => {
      const pt = meta.data[idx];
      if (!pt) return;
      const x = pt.x;

      // Dashed amber line
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, bottom);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(232,147,10,0.55)';
      ctx.setLineDash([3, 4]);
      ctx.stroke();

      // Label at top
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(232,147,10,0.75)';
      ctx.font = "9px 'DM Sans', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText('cheque', x, top - 2);
    });
    ctx.restore();
  },
};

function initAnimChart() {
  const span = ANIM.winEnd - ANIM.winStart;
  if      (span <= 2  * 86400000) animChartBinMs = 3600000;
  else if (span <= 14 * 86400000) animChartBinMs = 6 * 3600000;
  else                             animChartBinMs = 86400000;

  animChartSeries = getChartSeries();
  const numBins   = Math.ceil(span / animChartBinMs);
  const labels    = [];

  animChartBins = Array.from({ length: numBins }, () => {
    const b = { total: 0 };
    animChartSeries.forEach(s => { b[s.key] = 0; });
    return b;
  });

  // Pre-bucket all events (revealed progressively during playback)
  events.forEach(e => {
    if (e.ts < ANIM.winStart || e.ts >= ANIM.winEnd) return;
    if (!ANIM.filterOuts.has(e.outcome) || !ANIM.filterSubs.has(e.substance)) return;
    const i = Math.floor((e.ts - ANIM.winStart) / animChartBinMs);
    if (i >= 0 && i < numBins) {
      animChartBins[i].total++;
      const key = chartColourBy === 'outcome' ? e.outcome : e.substance;
      if (animChartBins[i][key] !== undefined) animChartBins[i][key]++;
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

  animChartLastBin    = -1;
  animChartChequeIdxs = computeChequeIndices();

  // Dataset layout: [0..N-1] per-bin (left axis y), [N..2N-1] cumulative (right axis y2)
  const nd = () => Array(numBins).fill(null);
  const datasets = [
    { label:'Total', data:nd(), borderColor:'#FFFFFF', borderWidth:2,
      pointRadius:0, tension:0.4, fill:false, yAxisID:'y', order:0 },
    ...animChartSeries.map(s => ({
      label: s.label, data:nd(), borderColor:s.color, borderWidth:1.5,
      pointRadius:0, tension:0.4, fill:false, yAxisID:'y', order:1,
    })),
    { label:'Total (cumul.)', data:nd(), borderColor:'rgba(255,255,255,0.45)', borderWidth:1.5,
      borderDash:[5,3], pointRadius:0, tension:0.4, fill:false, yAxisID:'y2', order:2 },
    ...animChartSeries.map(s => ({
      label: s.label+' (cumul.)', data:nd(), borderColor:s.color+'99', borderWidth:1,
      borderDash:[4,3], pointRadius:0, tension:0.4, fill:false, yAxisID:'y2', order:3,
    })),
  ];

  if (animChart) { animChart.destroy(); animChart = null; }

  const N     = 1 + animChartSeries.length;
  const ctxEl = document.getElementById('anim-od-chart').getContext('2d');
  animChart = new Chart(ctxEl, {
    type: 'line',
    data: { labels, datasets },
    plugins: [verticalCursorPlugin, chequeDatePlugin],
    options: {
      responsive: true, maintainAspectRatio: false, animation: false,
      layout: { padding: { top: 14 } },
      interaction: { mode:'index', intersect:false },
      plugins: {
        legend: {
          labels: {
            filter: (item) => item.datasetIndex < N,
            color:'rgba(255,255,255,0.55)', font:{ family:"'DM Sans',sans-serif", size:10 },
            boxWidth:8, padding:8,
          },
        },
        tooltip: { enabled: false },
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

  const allKeys = ['total', ...animChartSeries.map(s => s.key)];
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

// Chart colour-by toggle — independent of the map's colour-by
document.querySelectorAll('#chart-colour-by-btns .speed-btn').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('#chart-colour-by-btns .speed-btn').forEach(x => x.classList.remove('active'));
  b.classList.add('active');
  chartColourBy = b.dataset.chartcolourby;
  if (animChart) reinitChartOnly();
}));
