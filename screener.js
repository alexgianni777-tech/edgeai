// screener.js — EdgeAI:s dagliga produktoutput.
// Kör den VALIDERADE strategin över ett universum aktier, plocka ut dagens
// färska setups, och bifoga edgens OOS-statistik. Detta är payloaden som går
// till Telegram OCH till dashboardens "Dagens setup" + bevis-panel.

const pullback = require("./strategy");

// universe: { TICKER: bars[] }
// edgeStats: walk-forward OOS-statistik för DENNA strategi
// params: de walk-forward-valda parametrarna
// strat: strategiobjekt { name, latestSignal, ... } (default = pullback)
function screen(universe, edgeStats, params = {}, freshness = 3, strat = pullback) {
  const setups = [];
  for (const [ticker, bars] of Object.entries(universe)) {
    const sig = strat.latestSignal(bars, params, freshness);
    if (sig) {
      setups.push({
        ticker,
        setup: strat.name,
        grade: "A",
        barsAgo: sig.barsAgo ?? 0,
        entryRef: sig.entryRef,
        stop: sig.stop,
        target: sig.target,
        rr: sig.rr,
        edge: {
          expectancyR: +(edgeStats.expectancy ?? 0).toFixed(2),
          winRate: +((edgeStats.winRate ?? 0) * 100).toFixed(0),
          sample: edgeStats.n ?? 0,
        },
        ts: new Date().toISOString(),
      });
    }
  }
  return setups;
}

// positionsstorlek för given risk
function sizePosition(setup, capital, riskPct = 0.01) {
  const riskPerShare = setup.entryRef - setup.stop;
  if (riskPerShare <= 0) return 0;
  return Math.floor((capital * riskPct) / riskPerShare);
}

// formatera för Telegram (du har redan boten)
function toTelegram(setups, capital = 100000) {
  if (!setups.length) return "Inga A-setups idag. Tålamod slår tvång.";
  return setups.map(s => {
    const size = sizePosition(s, capital);
    return `📈 ${s.ticker} — ${s.setup}\n` +
      `Entry ~${s.entryRef}  Stop ${s.stop}  Target ${s.target}  (R:R ${s.rr})\n` +
      `Storlek: ${size} st (1% risk)\n` +
      `Edge: ${s.edge.expectancyR >= 0 ? "+" : ""}${s.edge.expectancyR}R/trade · ${s.edge.winRate}% · n=${s.edge.sample}`;
  }).join("\n\n");
}

module.exports = { screen, sizePosition, toTelegram };
