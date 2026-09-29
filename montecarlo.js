// montecarlo.js — deterministic bootstrap risk model.
// Default mode samples signal cohorts (same-day proposals together) rather than
// pretending every trade is independent. This better preserves correlation
// during broad market moves.

function percentile(sorted, p) {
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx), hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function normalizeClusters(items) {
  if (!items || !items.length) return [];
  if (typeof items[0].r === "number" && typeof items[0].n === "number" && items[0].date) {
    return items.map(x => ({ r: Number(x.r), n: Math.max(1, Number(x.n) || 1) }));
  }
  return items.map(x => ({ r: Number(x.r), n: 1 }));
}

// horizonTrades: approximately how many individual trades each simulation spans.
// drawdownThreshold: probability is measured from peak-to-valley, not merely
// against the initial account value.
function monteCarlo(items, {
  riskPerTrade = 0.01,
  ruinLevel = 0.5,
  drawdownThreshold = 0.25,
  sims = 10000,
  horizonTrades = 100,
  seed = 7,
} = {}) {
  const clusters = normalizeClusters(items).filter(x => Number.isFinite(x.r));
  if (!clusters.length) return null;

  let s = seed >>> 0;
  const rand = () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const finals = [], maxDDs = [];
  let ruined = 0, thresholdHits = 0;

  for (let i = 0; i < sims; i++) {
    let eq = 1, peak = 1, maxDD = 0, dead = false, tradesSeen = 0;
    while (tradesSeen < horizonTrades) {
      const c = clusters[(rand() * clusters.length) | 0];
      const factor = 1 + riskPerTrade * c.r;
      eq *= Math.max(0, factor);
      tradesSeen += c.n;

      if (eq > peak) peak = eq;
      const dd = peak > 0 ? (peak - eq) / peak : 1;
      if (dd > maxDD) maxDD = dd;
      if (eq <= ruinLevel || eq <= 0) {
        dead = true;
        break;
      }
    }
    if (dead) ruined++;
    if (maxDD >= drawdownThreshold) thresholdHits++;
    finals.push(eq);
    maxDDs.push(maxDD);
  }

  finals.sort((a, b) => a - b);
  maxDDs.sort((a, b) => a - b);
  return {
    riskPerTrade,
    ruinLevel,
    drawdownThreshold,
    sims,
    horizonTrades,
    clusterCount: clusters.length,
    ruinProb: ruined / sims,
    drawdownThresholdProb: thresholdHits / sims,
    medianReturn: percentile(finals, 0.5) - 1,
    p5Return: percentile(finals, 0.05) - 1,
    p95Return: percentile(finals, 0.95) - 1,
    medianMaxDD: percentile(maxDDs, 0.5),
    p95MaxDD: percentile(maxDDs, 0.95),
  };
}

module.exports = { monteCarlo, normalizeClusters };
