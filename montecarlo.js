// montecarlo.js — bootstrappar trade-sekvensen för att se hur illa det KAN gå.
// Knyter an till din /v1/leverage-tanke: edge säger lite om enskild trade —
// risk per trade + sekvensotur avgör om du blåses ut.

function percentile(sorted, p) {
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx), hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

// riskPerTrade: andel av equity som riskeras (R=-1 => -riskPerTrade)
// ruinLevel: equity-andel som räknas som utblåst (t.ex. 0.5 = -50%)
function monteCarlo(oosTrades, {
  riskPerTrade = 0.01, ruinLevel = 0.5, sims = 10000, horizon = null, seed = 7,
} = {}) {
  const rs = oosTrades.map(t => t.r);
  if (rs.length === 0) return null;
  const N = horizon || rs.length;

  let s = seed >>> 0;
  const rand = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

  const finals = [], maxDDs = [];
  let ruined = 0;
  for (let i = 0; i < sims; i++) {
    let eq = 1, peak = 1, maxDD = 0, dead = false;
    for (let k = 0; k < N; k++) {
      const r = rs[(rand() * rs.length) | 0];
      eq *= (1 + riskPerTrade * r);     // fixed-fractional, kompounderande
      if (eq > peak) peak = eq;
      const dd = (peak - eq) / peak;
      if (dd > maxDD) maxDD = dd;
      if (eq <= ruinLevel) { dead = true; break; }
    }
    if (dead) ruined++;
    finals.push(eq); maxDDs.push(maxDD);
  }
  finals.sort((a, b) => a - b); maxDDs.sort((a, b) => a - b);
  return {
    riskPerTrade, ruinLevel, sims, horizon: N,
    ruinProb: ruined / sims,
    medianReturn: percentile(finals, 0.5) - 1,
    p5Return: percentile(finals, 0.05) - 1,
    p95Return: percentile(finals, 0.95) - 1,
    medianMaxDD: percentile(maxDDs, 0.5),
    p95MaxDD: percentile(maxDDs, 0.95),
  };
}

module.exports = { monteCarlo };
