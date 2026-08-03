// strategy-bollinger.js — tredje setup-typen: Bollinger-reversion i uppåttrend.
//
// Setup (long-only): i uppåtregim (close>EMA50) stretchar priset ner UNDER det
// undre Bollinger-bandet (period 20, mult ~2) och stänger sedan tillbaka över
// bandet — en översåld studs i en trend. Volatilitets-mean-reversion, distinkt
// från både pullbacken (grund RSI-reset) och breakouten (momentum).
//
// Samma strategi-interface: { name, runStrategy, latestSignal, DEFAULT_PARAMS, GRID }.

const { ema, atr } = require("./indicators");

const DEFAULT_PARAMS = {
  emaSlow: 50, bbPeriod: 20, bbMult: 2.0, atrPeriod: 14,
  atrMult: 2.0, rrTarget: 2.0, maxBars: 20,
  courtage: 0.0025, slippage: 0.0005,
};

const GRID = [];
for (const rrTarget of [1.5, 2.0, 2.5, 3.0])
  for (const bbMult of [1.5, 1.8, 2.0, 2.2])
    for (const atrMult of [1.5, 2.0, 2.5])
      GRID.push({ rrTarget, bbMult, atrMult });

function bollingerLower(closes, period, mult) {
  const lower = new Array(closes.length).fill(null);
  for (let i = period - 1; i < closes.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += closes[j];
    const mean = sum / period;
    let v = 0;
    for (let j = i - period + 1; j <= i; j++) { const d = closes[j] - mean; v += d * d; }
    lower[i] = mean - mult * Math.sqrt(v / period);
  }
  return lower;
}

function computeContext(bars, p) {
  const closes = bars.map(b => b.close);
  return { emaS: ema(closes, p.emaSlow), atrV: atr(bars, p.atrPeriod), lower: bollingerLower(closes, p.bbPeriod, p.bbMult) };
}

function signalAt(bars, ctx, i, p) {
  if (i < p.bbPeriod + 1 || i < 11) return false;
  const { emaS, lower } = ctx;
  if (emaS[i] == null || emaS[i - 10] == null || lower[i] == null || lower[i - 1] == null) return false;
  if (!(emaS[i] > emaS[i - 10])) return false;                  // EMA50 lutar uppåt = uppåttrend
  // fräsch tangering av undre bandet (klassisk band-touch i trend)
  return bars[i].low <= lower[i] && bars[i - 1].low > lower[i - 1];
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
  for (let i = Math.max(p.emaSlow, p.atrPeriod, p.bbPeriod) + 1; i < bars.length - 1; i++) {
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

module.exports = { name: "Bollinger reversion in uptrend", runStrategy, latestSignal, DEFAULT_PARAMS, GRID };
