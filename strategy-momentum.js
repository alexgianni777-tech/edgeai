// strategy-momentum.js — fjärde setup-typen: momentum-flagga (Qullamaggie-stil).
//
// Setup (long-only): aktien har redan bevisat styrka (gain >= minGain över
// gainBars), konsoliderar sedan tajt (basens range begränsad relativt ATR,
// close håller sig över EMA20) och köps när close bryter över basens högsta.
// Stop vid basens lägsta. Exit: trailing — close under EMA(trailLen) — eller
// hård stop / maxBars. "Köp ledarna när de vilar, kliv av när trenden bryts."
//
// Samma strategi-interface: { name, runStrategy, latestSignal, DEFAULT_PARAMS, GRID }.

const { ema, atr } = require("./indicators");

const DEFAULT_PARAMS = {
  gainBars: 60, minGain: 0.25,      // föregående styrka: +25% på ~3 mån
  baseLen: 10, baseMaxAtr: 3.5,     // basens totala range <= 3.5 x ATR (tajt)
  emaFast: 20, trailLen: 20,        // håll över EMA20; traila på EMA20
  atrPeriod: 14, maxBars: 40,
  courtage: 0.0025, slippage: 0.0005,
};

const GRID = [];
for (const minGain of [0.15, 0.25, 0.35])
  for (const baseLen of [7, 10, 15])
    for (const trailLen of [10, 20])
      GRID.push({ minGain, baseLen, trailLen });

function computeContext(bars, p) {
  const closes = bars.map(b => b.close);
  return { emaF: ema(closes, p.emaFast), emaT: ema(closes, p.trailLen), atrV: atr(bars, p.atrPeriod) };
}

function baseStats(bars, i, len) {
  let hi = -Infinity, lo = Infinity;
  for (let j = i - len + 1; j <= i; j++) { if (bars[j].high > hi) hi = bars[j].high; if (bars[j].low < lo) lo = bars[j].low; }
  return { hi, lo };
}

function signalAt(bars, ctx, i, p) {
  const need = Math.max(p.gainBars + p.baseLen, p.emaFast, p.trailLen, p.atrPeriod) + 1;
  if (i < need) return false;
  const { emaF, atrV } = ctx;
  if (emaF[i] == null || atrV[i] == null) return false;
  // 1) föregående styrka: gain över gainBars, mätt fram till basens start
  const b0 = i - p.baseLen;                       // sista baren innan basen
  const back = bars[b0 - p.gainBars];
  if (!back || back.close <= 0) return false;
  if (bars[b0].close / back.close - 1 < p.minGain) return false;
  // 2) tajt bas: basens totala range begränsad relativt ATR, close över EMA20
  const { hi, lo } = baseStats(bars, i - 1, p.baseLen);   // basen = baren före brottet och bakåt
  if ((hi - lo) > p.baseMaxAtr * atrV[i]) return false;
  if (!(bars[i].close > emaF[i])) return false;
  // 3) brottet: föregående close inne i basen, dagens close över basens högsta
  return bars[i - 1].close <= hi && bars[i].close > hi;
}

// Exit: hård stop (basens lägsta), annars trailing när close < EMA(trailLen),
// annars time-stop. R mäts mot initial risk (entry - stop).
function simulateTrade(bars, ctx, entryIdx, p, stopLevel) {
  const entry = bars[entryIdx].open;
  const risk = entry - stopLevel;
  if (risk <= 0) return null;
  let exit = null, exitK = null;
  for (let k = entryIdx; k < Math.min(bars.length, entryIdx + p.maxBars + 1); k++) {
    if (bars[k].low <= stopLevel) { exit = stopLevel; exitK = k; break; }         // hård stop först
    const e = ctx.emaT[k];
    if (k > entryIdx && e != null && bars[k].close < e) { exit = bars[k].close; exitK = k; break; } // trend bruten
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
  const start = Math.max(p.gainBars + p.baseLen, p.emaFast, p.trailLen, p.atrPeriod) + 1;
  for (let i = start; i < bars.length - 1; i++) {
    if (i <= block) continue;
    if (signalAt(bars, ctx, i, p)) {
      const { lo } = baseStats(bars, i - 1, p.baseLen);
      const res = simulateTrade(bars, ctx, i + 1, p, lo);
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
    const { lo } = baseStats(bars, i - 1, p.baseLen);
    const ref = bars[i].close, risk = ref - lo;
    if (risk <= 0) continue;
    // "target" för visning: 3R (säljs i praktiken via trail); rr rapporteras som 3
    return {
      barsAgo: bars.length - 1 - i,
      entryRef: +ref.toFixed(2),
      stop: +lo.toFixed(2),
      target: +(ref + risk * 3).toFixed(2),
      rr: 3,
    };
  }
  return null;
}

module.exports = { name: "Momentum flag — leader breakout", runStrategy, latestSignal, DEFAULT_PARAMS, GRID };
