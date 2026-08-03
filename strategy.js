// strategy.js — setup-logik + trade-simulering i R (risk-normaliserat).
//
// Setup (long-only för tydlighet):
//   Trendfilter: close > EMA50  (uppåtregim)
//   Pullback:    RSI(14) har "resettat" under rsiReset de senaste lookback
//                barerna, och close korsar tillbaka UPP över EMA20.
//   Entry:       nästa bars open (inget look-ahead).
//   Stop:        entry - ATR*atrMult   =>  risk per aktie = entry - stop = R.
//   Target:      entry + R * rrTarget.
//   Exit:        target eller stop (stop kollas först om båda nås samma bar),
//                annars time-stop efter maxBars.
//
// Kostnader (courtage + slippage) dras av och uttrycks i R.

const { ema, rsi, atr } = require("./indicators");

const DEFAULT_PARAMS = {
  emaFast: 20, emaSlow: 50, rsiPeriod: 14, atrPeriod: 14,
  rsiReset: 50, pullbackLookback: 5,
  atrMult: 2.0, rrTarget: 2.0, maxBars: 15,
  courtage: 0.0025, slippage: 0.0005, // per sida
};

function computeContext(bars, p) {
  const closes = bars.map(b => b.close);
  return {
    emaF: ema(closes, p.emaFast),
    emaS: ema(closes, p.emaSlow),
    rsiV: rsi(closes, p.rsiPeriod),
    atrV: atr(bars, p.atrPeriod),
  };
}

// Returnerar true om en entry-signal ges på bar i (entry sker på i+1 open).
// Setup: i uppåtregim (close>EMA50), RSI(14) "resettar" lågt och VÄNDER UPP
// genom rsiReset — en pullback som börjar återhämta sig — med priset kvar
// nära/över EMA20 (kvalitetsfilter).
function signalAt(bars, ctx, i, p) {
  if (i < 1) return false;
  const { emaF, emaS, rsiV } = ctx;
  if (emaS[i] == null || rsiV[i] == null || rsiV[i - 1] == null) return false;

  const trend = bars[i].close > emaS[i];
  if (!trend) return false;

  // RSI korsar upp genom rsiReset (reset-and-recover)
  const crossUp = rsiV[i - 1] <= p.rsiReset && rsiV[i] > p.rsiReset;
  if (!crossUp) return false;

  // kvalitetsfilter: priset inte långt under EMA20
  if (emaF[i] != null && bars[i].close < emaF[i] * 0.985) return false;

  return true;
}

// Simulera en trade som startar med entry på bar `entryIdx` (open).
// Returnerar R-utfall (netto efter kostnader) eller null om den inte kan tas.
function simulateTrade(bars, ctx, entryIdx, p) {
  const { atrV } = ctx;
  const a = atrV[entryIdx - 1];
  if (a == null) return null;
  const entry = bars[entryIdx].open;
  const risk = a * p.atrMult;          // pris-risk = R
  if (risk <= 0) return null;
  const stop = entry - risk;
  const target = entry + risk * p.rrTarget;

  let exitPrice = null, exitK = null;
  for (let k = entryIdx; k < Math.min(bars.length, entryIdx + p.maxBars + 1); k++) {
    const b = bars[k];
    if (b.low <= stop) { exitPrice = stop; exitK = k; break; }      // stop först (konservativt)
    if (b.high >= target) { exitPrice = target; exitK = k; break; }
  }
  if (exitPrice == null) {
    exitK = Math.min(bars.length - 1, entryIdx + p.maxBars);
    exitPrice = bars[exitK].close;                           // time-stop
  }

  // bruttoutfall i R
  let rMult = (exitPrice - entry) / risk;
  // kostnad i R: (courtage+slip)*2 av priset, omräknat till andel av risken
  const costFrac = (p.courtage + p.slippage) * 2;
  const costInR = (costFrac * entry) / risk;
  rMult -= costInR;
  return { r: rMult, held: exitK - entryIdx + 1 };
}

// Kör hela serien och returnera en lista trades (icke-överlappande).
function runStrategy(bars, params = {}) {
  const p = { ...DEFAULT_PARAMS, ...params };
  const ctx = computeContext(bars, p);
  const trades = [];
  let i = Math.max(p.emaSlow, p.atrPeriod, p.rsiPeriod) + 1;
  let blockUntil = -1;
  for (; i < bars.length - 1; i++) {
    if (i <= blockUntil) continue;
    if (signalAt(bars, ctx, i, p)) {
      const entryIdx = i + 1;
      const res = simulateTrade(bars, ctx, entryIdx, p);
      if (res != null) {
        trades.push({ entryIdx, t: bars[entryIdx].t, r: res.r, held: res.held });
        blockUntil = entryIdx + p.maxBars; // ingen överlappning
      }
    }
  }
  return trades;
}

// Live-screening: signalerade någon av de senaste `freshness` stängda
// barerna ett nytt setup? Entry på nästa open; nivåer ges från signalbaren.
function latestSignal(bars, params = {}, freshness = 1) {
  const p = { ...DEFAULT_PARAMS, ...params };
  const ctx = computeContext(bars, p);
  for (let i = bars.length - 1; i >= bars.length - freshness && i >= 1; i--) {
    if (!signalAt(bars, ctx, i, p)) continue;
    const a = ctx.atrV[i];
    if (a == null) continue;
    const ref = bars[i].close;
    const risk = a * p.atrMult;
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

// Parametergrid för walk-forward + strateginamn (strategi-interface).
const GRID = [];
for (const rrTarget of [1.5, 2.0, 2.5, 3.0])
  for (const atrMult of [1.5, 2.0, 2.5])
    for (const rsiReset of [45, 50, 55, 60])
      GRID.push({ rrTarget, atrMult, rsiReset });

module.exports = { name: "Trend pullback to 20EMA · RSI reset", runStrategy, latestSignal, DEFAULT_PARAMS, GRID };
