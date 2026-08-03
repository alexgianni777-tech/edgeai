// strategy-breakout.js — andra setup-typen: momentum-breakout.
//
// Setup (long-only): i uppåtregim (close>EMA50) bryter close UPP över det
// högsta högsta de senaste `lookback` barerna (ett fräscht N-dagarshögsta).
// Genuint annorlunda än pullbacken (momentum, inte mean-reversion).
//
// Samma strategi-interface: { name, runStrategy, latestSignal, DEFAULT_PARAMS, GRID }.

const { ema, atr } = require("./indicators");

const DEFAULT_PARAMS = {
  emaSlow: 50, atrPeriod: 14, lookback: 20,
  atrMult: 2.0, rrTarget: 2.0, maxBars: 20,
  courtage: 0.0025, slippage: 0.0005,
};

const GRID = [];
for (const rrTarget of [1.5, 2.0, 2.5, 3.0])
  for (const atrMult of [1.5, 2.0, 2.5])
    for (const lookback of [20, 40, 55])
      GRID.push({ rrTarget, atrMult, lookback });

function computeContext(bars, p) {
  const closes = bars.map(b => b.close);
  return { emaS: ema(closes, p.emaSlow), atrV: atr(bars, p.atrPeriod) };
}

function priorHigh(bars, i, lookback) {
  let h = -Infinity;
  for (let j = Math.max(0, i - lookback); j <= i - 1; j++) if (bars[j].high > h) h = bars[j].high;
  return h;
}

function signalAt(bars, ctx, i, p) {
  if (i < p.lookback + 1) return false;
  const { emaS } = ctx;
  if (emaS[i] == null) return false;
  if (!(bars[i].close > emaS[i])) return false;       // uppåttrend
  const ph = priorHigh(bars, i, p.lookback);
  // fräscht brott: föregående close under nivån, dagens close över
  return bars[i - 1].close < ph && bars[i].close > ph;
}

function simulateTrade(bars, ctx, entryIdx, p) {
  const a = ctx.atrV[entryIdx - 1];
  if (a == null) return null;
  const entry = bars[entryIdx].open;
  const risk = a * p.atrMult;
  if (risk <= 0) return null;
  const stop = entry - risk, target = entry + risk * p.rrTarget;
  let exit = null, exitK = null;
  for (let k = entryIdx; k < Math.min(bars.length, entryIdx + p.maxBars + 1); k++) {
    if (bars[k].low <= stop) { exit = stop; exitK = k; break; }
    if (bars[k].high >= target) { exit = target; exitK = k; break; }
  }
  if (exit == null) { exitK = Math.min(bars.length - 1, entryIdx + p.maxBars); exit = bars[exitK].close; }
  let r = (exit - entry) / risk;
  r -= ((p.courtage + p.slippage) * 2 * entry) / risk;
  return { r, held: exitK - entryIdx + 1 };
}

function runStrategy(bars, params = {}) {
  const p = { ...DEFAULT_PARAMS, ...params };
  const ctx = computeContext(bars, p);
  const trades = [];
  let block = -1;
  for (let i = Math.max(p.emaSlow, p.atrPeriod, p.lookback) + 1; i < bars.length - 1; i++) {
    if (i <= block) continue;
    if (signalAt(bars, ctx, i, p)) {
      const res = simulateTrade(bars, ctx, i + 1, p);
      if (res != null) { trades.push({ entryIdx: i + 1, t: bars[i + 1].t, r: res.r, held: res.held }); block = i + 1 + p.maxBars; }
    }
  }
  return trades;
}

function latestSignal(bars, params = {}, freshness = 1) {
  const p = { ...DEFAULT_PARAMS, ...params };
  const ctx = computeContext(bars, p);
  for (let i = bars.length - 1; i >= bars.length - freshness && i >= 1; i--) {
    if (!signalAt(bars, ctx, i, p)) continue;
    const a = ctx.atrV[i];
    if (a == null) continue;
    const ref = bars[i].close, risk = a * p.atrMult;
    return {
      barsAgo: bars.length - 1 - i,
      entryRef: +ref.toFixed(2),
      stop: +(ref - risk).toFixed(2),
      target: +(ref + risk * p.rrTarget).toFixed(2),
      rr: p.rrTarget,
    };
  }
  return null;
}

module.exports = { name: "Breakout — fresh N-day high", runStrategy, latestSignal, DEFAULT_PARAMS, GRID };
