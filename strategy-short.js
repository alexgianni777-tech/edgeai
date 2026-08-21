// strategy-short.js — Burry-filtret: short i enskilda, tydligt svaga aktier.
//
// Setup (short-only): i nedåttrend (close < EMA50) rallyr priset upp och
// nuddar EMA20 medan RSI reser sig över tröskeln — säljarens motsvarighet
// till pullbacken. Entry short på nästa open, stop ÖVER entry (ATR-baserad),
// target under. build-data begränsar den vidare till den svagaste tredjedelen
// av relativ styrka, men den blockeras inte av att hela indexet är risk-on.
//
// Samma strategi-interface + { dir: "short" }.

const { ema, rsi, atr } = require("./indicators");

const DEFAULT_PARAMS = {
  emaSlow: 50, emaFast: 20, rsiPeriod: 14, rsiUp: 45,
  atrPeriod: 14, atrMult: 2.0, rrTarget: 2.0, maxBars: 10,
  courtage: 0.0025, slippage: 0.0005,
};

const GRID = [];
for (const rrTarget of [1.5, 2.0, 2.5])
  for (const atrMult of [1.0, 1.5, 2.0])
    for (const rsiUp of [35, 40, 45, 50])
      GRID.push({ rrTarget, atrMult, rsiUp });

function computeContext(bars, p) {
  const closes = bars.map(b => b.close);
  return { emaS: ema(closes, p.emaSlow), emaF: ema(closes, p.emaFast), rsiV: rsi(closes, p.rsiPeriod), atrV: atr(bars, p.atrPeriod) };
}

function signalAt(bars, ctx, i, p) {
  if (i < Math.max(p.emaSlow, p.rsiPeriod, p.atrPeriod) + 1) return false;
  const { emaS, emaF, rsiV } = ctx;
  if (emaS[i] == null || emaF[i] == null || rsiV[i] == null) return false;
  if (!(bars[i].close < emaS[i])) return false;      // nedåttrend
  if (!(bars[i].high >= emaF[i])) return false;      // rally upp till EMA20
  return rsiV[i] > p.rsiUp;                          // överköpt i nedtrend
}

function simulateTrade(bars, ctx, entryIdx, p) {
  const a = ctx.atrV[entryIdx - 1];
  if (a == null) return null;
  const entry = bars[entryIdx].open;
  const risk = a * p.atrMult;
  if (risk <= 0) return null;
  const stop = entry + risk, target = entry - risk * p.rrTarget;
  let exit = null, exitK = null;
  for (let k = entryIdx; k < Math.min(bars.length, entryIdx + p.maxBars + 1); k++) {
    if (bars[k].high >= stop) { exit = stop; exitK = k; break; }     // stop först (konservativt)
    if (bars[k].low <= target) { exit = target; exitK = k; break; }
  }
  if (exit == null) { exitK = Math.min(bars.length - 1, entryIdx + p.maxBars); exit = bars[exitK].close; }
  let r = (entry - exit) / risk;                                     // short: vinst när priset faller
  r -= ((p.courtage + p.slippage) * 2 * entry) / risk;
  return { r, held: exitK - entryIdx + 1 };
}

function runStrategy(bars, params = {}) {
  const p = { ...DEFAULT_PARAMS, ...params };
  const ctx = computeContext(bars, p);
  const trades = [];
  let block = -1;
  for (let i = Math.max(p.emaSlow, p.rsiPeriod, p.atrPeriod) + 1; i < bars.length - 1; i++) {
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
      stop: +(ref + risk).toFixed(2),            // stop OVANFÖR för short
      target: +(ref - risk * p.rrTarget).toFixed(2),
      rr: p.rrTarget,
    };
  }
  return null;
}

module.exports = { name: "Burry filter — weak-stock rally short", dir: "short", shortRsMax: 35, runStrategy, latestSignal, DEFAULT_PARAMS, GRID };
