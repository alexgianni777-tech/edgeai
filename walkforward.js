// walkforward.js — kärnan mot överanpassning, nu STRATEGI-GENERISK.
//
// Rulla ett fönster: optimera parametrar på IN-SAMPLE, applicera på nästa
// OUT-OF-SAMPLE-bit (osedd), samla BARA OOS-trades. En `strat` är ett objekt
// med { runStrategy, GRID, name }. Default = trend-pullback (./strategy).

const pullback = require("./strategy");
const { metrics } = require("./metrics");

function pickBestParams(bars, strat, minTrades = 6) {
  let best = null, bestScore = -Infinity;
  for (const params of strat.GRID) {
    const m = metrics(strat.runStrategy(bars, params));
    if (m.n < minTrades) continue;
    const score = m.sqn;                 // SQN: belönar edge + konsekvens
    if (score > bestScore) { bestScore = score; best = params; }
  }
  return best;
}

function walkForward(bars, opts = {}, strat = pullback) {
  const isLen = opts.isLen || 504;
  const oosLen = opts.oosLen || 126;
  const step = opts.step || oosLen;

  const oosTrades = [];
  const windows = [];
  let start = 0;
  while (start + isLen + oosLen <= bars.length) {
    const isBars = bars.slice(start, start + isLen);
    const oosStart = start + isLen;
    const oosEnd = oosStart + oosLen;
    const warmup = Math.min(220, isLen);
    const oosWithWarmup = bars.slice(oosStart - warmup, oosEnd);
    const firstOosT = String(bars[oosStart].t);
    const params = pickBestParams(isBars, strat);
    if (params) {
      const isM = metrics(strat.runStrategy(isBars, params));
      // Indicators are warmed with only already-known history, while only
      // trades whose ENTRY belongs to the unseen OOS segment are counted.
      const oosT = strat.runStrategy(oosWithWarmup, params)
        .filter(t => String(t.t) >= firstOosT);
      const oosM = metrics(oosT);
      oosTrades.push(...oosT);
      windows.push({
        from: start + isLen, to: start + isLen + oosLen, params,
        is: { n: isM.n, exp: isM.expectancy, sqn: isM.sqn },
        oos: { n: oosM.n, exp: oosM.expectancy ?? 0, sqn: oosM.sqn ?? 0 },
      });
    }
    start += step;
  }
  return { oosTrades, oosMetrics: metrics(oosTrades), windows };
}

module.exports = { walkForward };
