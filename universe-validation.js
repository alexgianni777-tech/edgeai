// universe-validation.js
// Market-level, calendar-aligned walk-forward validation.
// One common parameter set is selected across the whole market from the
// preceding in-sample period, then applied unchanged to the next unseen period.

const { metrics } = require("./metrics");

const dateKey = t => {
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};

function chronological(trades) {
  return (trades || []).slice().sort((a, b) => {
    const ta = new Date(a.t).getTime();
    const tb = new Date(b.t).getTime();
    if (ta !== tb) return ta - tb;
    return String(a.ticker || "").localeCompare(String(b.ticker || ""));
  });
}

function boundsForDates(bars, fromDate, toDate) {
  let start = -1, end = -1;
  for (let i = 0; i < bars.length; i++) {
    const d = dateKey(bars[i].t);
    if (start < 0 && d >= fromDate) start = i;
    if (d <= toDate) end = i;
    if (d > toDate) break;
  }
  return start >= 0 && end >= start ? { start, end: end + 1 } : null;
}

function runDateWindow(universeEntries, strat, params, {
  fromDate,
  toDate,
  warmup = 220,
} = {}) {
  const pooled = [];
  for (const [ticker, bars] of universeEntries) {
    const bounds = boundsForDates(bars, fromDate, toDate);
    if (!bounds) continue;

    const slice = bars.slice(Math.max(0, bounds.start - warmup), bounds.end);
    for (const trade of strat.runStrategy(slice, params)) {
      const d = dateKey(trade.t);
      if (!d || d < fromDate || d > toDate) continue;
      pooled.push({ ...trade, ticker });
    }
  }
  return chronological(pooled);
}

function selectParams(universeEntries, strat, opts) {
  let best = null;
  let bestScore = -Infinity;
  let bestMetrics = null;

  for (const params of strat.GRID || []) {
    const trades = runDateWindow(universeEntries, strat, params, opts);
    const m = metrics(trades);
    const minTrades = opts.minTrades ?? 20;
    if ((m.n ?? 0) < minTrades) continue;

    // SQN is used only inside the preceding IS period.
    const score = Number.isFinite(m.sqn) ? m.sqn : -Infinity;
    const deterministicTieBreak = JSON.stringify(params).length * 1e-9;
    const adjusted = score - deterministicTieBreak;
    if (adjusted > bestScore) {
      bestScore = adjusted;
      best = params;
      bestMetrics = m;
    }
  }

  return {
    params: best || strat.DEFAULT_PARAMS,
    metrics: bestMetrics || metrics([]),
    score: bestScore,
  };
}

function normalizeCalendar(calendarDates, entries) {
  const source = (calendarDates && calendarDates.length)
    ? calendarDates
    : (entries[0]?.[1] || []).map(b => b.t);
  return [...new Set(source.map(dateKey).filter(Boolean))].sort();
}

function validateUniverse(universe, strat, {
  isLen = 378,
  oosLen = 126,
  step = oosLen,
  warmup = 220,
  minTrades = 20,
  calendarDates = null,
} = {}) {
  const entries = Object.entries(universe)
    .filter(([, bars]) => Array.isArray(bars) && bars.length >= 100);

  if (!entries.length) {
    return {
      oosTrades: [],
      m: metrics([]),
      params: strat.DEFAULT_PARAMS,
      windows: [],
      procedure: "market-level calendar-aligned walk-forward",
    };
  }

  const calendar = normalizeCalendar(calendarDates, entries);
  if (calendar.length < isLen + oosLen) {
    return {
      oosTrades: [],
      m: metrics([]),
      params: strat.DEFAULT_PARAMS,
      windows: [],
      procedure: "market-level calendar-aligned walk-forward",
    };
  }

  const oosTrades = [];
  const windows = [];
  let start = 0;

  while (start + isLen + oosLen <= calendar.length) {
    const isFrom = calendar[start];
    const isTo = calendar[start + isLen - 1];
    const oosFrom = calendar[start + isLen];
    const oosTo = calendar[start + isLen + oosLen - 1];

    const chosen = selectParams(entries, strat, {
      fromDate: isFrom,
      toDate: isTo,
      warmup,
      minTrades,
    });

    const unseen = runDateWindow(entries, strat, chosen.params, {
      fromDate: oosFrom,
      toDate: oosTo,
      warmup,
    });
    const oosM = metrics(unseen);
    oosTrades.push(...unseen);

    windows.push({
      isFrom,
      isTo,
      from: oosFrom,
      to: oosTo,
      params: chosen.params,
      is: {
        n: chosen.metrics.n ?? 0,
        exp: chosen.metrics.expectancy ?? 0,
        sqn: chosen.metrics.sqn ?? 0,
      },
      oos: {
        n: oosM.n ?? 0,
        exp: oosM.expectancy ?? 0,
        sqn: oosM.sqn ?? 0,
      },
    });

    start += step;
  }

  const sorted = chronological(oosTrades);
  return {
    oosTrades: sorted,
    m: metrics(sorted),
    params: windows.length ? windows[windows.length - 1].params : strat.DEFAULT_PARAMS,
    windows,
    procedure: "market-level calendar-aligned walk-forward",
  };
}

module.exports = {
  validateUniverse,
  runDateWindow,
  selectParams,
  chronological,
  boundsForDates,
};
