// strategy-big-short.js — The Big Short: bredare short-filter för svaga aktier.
    //
    // Mindre snävt än Burry-filtret: aktien kan ligga nära EMA50, rallysignalen
    // kan ligga nära EMA20 och RSI-tröskeln är lägre. Den måste fortfarande ha
    // bearish EMA-alignment och en meningsfull ATR-baserad short-risk.
    //
    // Strategin är fortfarande walk-forward-validerad innan den får visas live.

    const { ema, rsi, atr } = require("./indicators");

    const DEFAULT_PARAMS = {
    emaSlow: 50, emaFast: 20, rsiPeriod: 14, rsiUp: 40,
    rallyTolerance: 0.015, nearSlowPct: 0.02,
    atrPeriod: 14, atrMult: 2.0, rrTarget: 1.5, maxBars: 10,
    courtage: 0.0025, slippage: 0.0005,
    };

    const GRID = [];
    for (const rrTarget of [1.25, 1.5, 2.0])
    for (const atrMult of [1.0, 1.5, 2.0])
      for (const rsiUp of [30, 35, 40, 45])
        for (const rallyTolerance of [0, 0.01, 0.02])
          for (const nearSlowPct of [0, 0.01, 0.02])
            GRID.push({ rrTarget, atrMult, rsiUp, rallyTolerance, nearSlowPct });

    function computeContext(bars, p) {
    const closes = bars.map(b => b.close);
    return {
      emaS: ema(closes, p.emaSlow),
      emaF: ema(closes, p.emaFast),
      rsiV: rsi(closes, p.rsiPeriod),
      atrV: atr(bars, p.atrPeriod),
    };
    }

    function signalAt(bars, ctx, i, p) {
    if (i < Math.max(p.emaSlow, p.rsiPeriod, p.atrPeriod) + 1) return false;
    const { emaS, emaF, rsiV } = ctx;
    if (emaS[i] == null || emaF[i] == null || rsiV[i] == null) return false;

    // Bredare nedtrend: EMA20 ska fortfarande ligga under EMA50.
    if (!(emaF[i] < emaS[i])) return false;
    // Aktien får ligga nära EMA50, men inte vara långt över den.
    if (!(bars[i].close <= emaS[i] * (1 + p.nearSlowPct))) return false;
    // Rally mot EMA20 med tolerans, inte bara en exakt touch.
    if (!(bars[i].high >= emaF[i] * (1 - p.rallyTolerance))) return false;
    // Lägre tröskel än Burry för att fånga tidigare svaghetsrallyn.
    return rsiV[i] > p.rsiUp;
    }

    function simulateTrade(bars, ctx, entryIdx, p) {
    const a = ctx.atrV[entryIdx - 1];
    if (a == null) return null;
    const entry = bars[entryIdx].open;
    const risk = a * p.atrMult;
    if (risk <= 0) return null;
    const stop = entry + risk;
    const target = entry - risk * p.rrTarget;
    let exit = null, exitK = null;
    for (let k = entryIdx; k < Math.min(bars.length, entryIdx + p.maxBars + 1); k++) {
      if (bars[k].high >= stop) { exit = stop; exitK = k; break; }
      if (bars[k].low <= target) { exit = target; exitK = k; break; }
    }
    if (exit == null) {
      exitK = Math.min(bars.length - 1, entryIdx + p.maxBars);
      exit = bars[exitK].close;
    }
    let r = (entry - exit) / risk;
    r -= ((p.courtage + p.slippage) * 2 * entry) / risk;
    return { r, held: exitK - entryIdx + 1 };
    }

    function runStrategy(bars, params = {}) {
    const p = { ...DEFAULT_PARAMS, ...params };
    const ctx = computeContext(bars, p);
    const trades = [];
    let block = -1;
    for (let i = Math.max(p.emaSlow, p.rsiPeriod, p.atrPeriod) + 1; i < bars.length - 1; i++) {
      if (i <= block || !signalAt(bars, ctx, i, p)) continue;
      const res = simulateTrade(bars, ctx, i + 1, p);
      if (res != null) {
        trades.push({ entryIdx: i + 1, t: bars[i + 1].t, r: res.r, held: res.held });
        block = i + 1 + p.maxBars;
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
        stop: +(ref + risk).toFixed(2),
        target: +(ref - risk * p.rrTarget).toFixed(2),
        rr: p.rrTarget,
      };
    }
    return null;
    }

    module.exports = {
    name: "The Big Short — broader weak-stock rally short",
    dir: "short",
    shortRsMax: 60,
    runStrategy,
    latestSignal,
    DEFAULT_PARAMS,
    GRID,
    };
    