// universe-validation.js
// Market-level walk-forward validation.
// One common parameter set is selected from the preceding in-sample window
// across the whole universe, then applied unchanged to the next unseen period.
// This mirrors how live screening uses one parameter set per strategy/market.

const { metrics } = require("./metrics");

const dateKey = t => {
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};

function chronological(trades) {
  return trades.slice().sort((a, b) => {
    const ta = new Date(a.t).getTime();
    const tb = new Date(b.t).getTime();
    if (ta !== tb) return ta - tb;
    return String(a.ticker || "").localeCompare(String(b.ticker || ""));
  });
}

function runWindow(universeEntries, strat, params, {
  minLen, from, to, warmup = 220,
} = {}) {
  const pooled = [];
  for (const [ticker, bars] of universeEntries) {
    const offset = bars.length - minLen;
    const start = offset + from;
    const end = offset + to;
    if (start < 0 || end > bars.length || start >= end) continue;

    const firstCounted = bars[start];
    if (!firstCounted) continue;

    const slice = bars.slice(Math.max(0, start - warmup), end);
    const firstT = new Date(firstCounted.t).getTime();
    const lastT = new Date(bars[end - 1].t).getTime();

    for (const trade of strat.runStrategy(slice, params)) {
      const t = new Date(trade.t).getTime();
      if (!Number.isFinite(t) || t < firstT || t > lastT) continue;
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
    const trades = runWindow(universeEntries, strat, params, opts);
    const m = metrics(trades);
    const minTrades = opts.minTrades ?? 20;
    if ((m.n ?? 0) < minTrades) continue;

    // SQN is used only for parameter selection inside the IS window.
    // Small complexity tie-break keeps selection deterministic.
    const score = Number.isFinite(m.sqn) ? m.sqn : -Infinity;
    const complexityPenalty = JSON.stringify(params).length * 1e-9;
    const adjusted = score - complexityPenalty;
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

function validateUniverse(universe, strat, {
  isLen = 378,
  oosLen = 126,
  step = oosLen,
  warmup = 220,
  minTrades = 20,
} = {}) {
  const entries = Object.entries(universe)
    .filter(([, bars]) => Array.isArray(bars) && bars.length >= isLen + oosLen + 10);

  if (!entries.length) {
    return {
      oosTrades: [],
      m: metrics([]),
      params: strat.DEFAULT_PARAMS,
      windows: [],
      procedure: "market-level walk-forward",
    };
  }

  const minLen = Math.min(...entries.map(([, bars]) => bars.length));
  const oosTrades = [];
  const windows = [];
  let start = 0;

  while (start + isLen + oosLen <= minLen) {
    const isFrom = start;
    const isTo = start + isLen;
    const oosFrom = isTo;
    const oosTo = isTo + oosLen;

    const chosen = selectParams(entries, strat, {
      minLen, from: isFrom, to: isTo, warmup, minTrades,
    });

    const unseen = runWindow(entries, strat, chosen.params, {
      minLen, from: oosFrom, to: oosTo, warmup,
    });
    const oosM = metrics(unseen);
    oosTrades.push(...unseen);

    const anchorBars = entries[0][1];
    const anchorOffset = anchorBars.length - minLen;
    windows.push({
      from: dateKey(anchorBars[anchorOffset + oosFrom]?.t),
      to: dateKey(anchorBars[anchorOffset + oosTo - 1]?.t),
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
    procedure: "market-level walk-forward",
  };
}

module.exports = { validateUniverse, runWindow, selectParams, chronological };
