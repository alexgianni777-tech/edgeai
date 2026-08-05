// data-live.js — RIKTIG data. Hämtar daglig OHLC från Yahoo Finance.
// OBS: kräver internet mot Yahoo — kör på din egen maskin / Replit / GitHub
// Actions (inte i Claudes sandlåda, som bara når utvecklardomäner).
//
//   npm install yahoo-finance2
//   node run-live.js

// yahoo-finance2 bytte API i v3: default-exporten är numera en KLASS som måste
// instansieras, medan v2 exporterade en färdig instans. Detta hanterar båda.
const _yfMod = require("yahoo-finance2");
const _YF = _yfMod.default || _yfMod.YahooFinance || _yfMod;
const yf = typeof _YF === "function" ? new _YF() : _YF;

// OMXS30-ish (Yahoo använder .ST för Stockholmsbörsen). Sammansättningen
// ändras — verifiera aktuella konstituenter och justera fritt.
const OMXS30 = [
  "ABB.ST", "ALFA.ST", "ASSA-B.ST", "ATCO-A.ST", "ATCO-B.ST", "AZN.ST",
  "BOL.ST", "ELUX-B.ST", "EQT.ST", "ERIC-B.ST", "ESSITY-B.ST", "EVO.ST",
  "GETI-B.ST", "HM-B.ST", "HEXA-B.ST", "INVE-B.ST", "KINV-B.ST", "NDA-SE.ST",
  "NIBE-B.ST", "SAND.ST", "SCA-B.ST", "SEB-A.ST", "SHB-A.ST", "SINCH.ST",
  "SKF-B.ST", "SWED-A.ST", "TEL2-B.ST", "TELIA.ST", "VOLV-B.ST",
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Hämtar daglig OHLC de senaste `years` åren.
async function loadBars(ticker, { years = 3 } = {}) {
  const period1 = new Date(Date.now() - years * 365 * 24 * 3600 * 1000);
  const res = await yf.chart(ticker, { period1, interval: "1d" });
  return (res.quotes || [])
    .filter(q => q.open != null && q.high != null && q.low != null && q.close != null)
    .map(q => ({ t: q.date, open: q.open, high: q.high, low: q.low, close: q.close }));
}

// Hämtar hela universumet. Försöker om vid tillfälliga fel (Yahoo svarar ofta
// 429/401 mot datacenter-IP:n som GitHub Actions kör på). Rapporterar tydligt —
// och KRASCHAR hellre än att leverera tom data, så att en grön körning aldrig
// kan betyda "n=0 överallt".
async function loadUniverse(tickers = OMXS30, opts = {}) {
  const out = {};
  const fails = [];
  for (const tk of tickers) {
    let bars = null, lastErr = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try { bars = await loadBars(tk, opts); break; }
      catch (e) {
        lastErr = e;
        if (attempt < 3) await sleep(1200 * attempt);   // backoff 1.2s, 2.4s
      }
    }
    if (bars == null) fails.push(`${tk}: ${lastErr && lastErr.message}`);
    else if (bars.length > 300) out[tk] = bars;
    else fails.push(`${tk}: bara ${bars.length} barer`);
    await sleep(350);
  }

  const ok = Object.keys(out).length;
  console.log(`  hämtade ${ok}/${tickers.length} tickers`);
  if (fails.length) {
    console.error(`  ${fails.length} misslyckades — första felen:`);
    fails.slice(0, 5).forEach(f => console.error(`    - ${f}`));
  }
  if (ok < Math.max(5, tickers.length * 0.4)) {
    throw new Error(
      `Datahämtning misslyckades: bara ${ok}/${tickers.length} tickers gick igenom. ` +
      `Skriver INTE över data.json med tomt underlag. Vanligaste orsak: Yahoo ` +
      `blockerar eller stryper anrop från GitHubs servrar. Se felen ovan.`
    );
  }
  return out;
}

// USA large caps (Yahoo använder ingen suffix för US-tickers).
const US_LARGE = [
  "AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA", "AVGO", "JPM", "V",
  "UNH", "XOM", "JNJ", "WMT", "MA", "PG", "HD", "COST", "ABBV", "KO",
  "BAC", "CRM", "AMD", "NFLX", "DIS", "ADBE", "PEP", "CSCO", "INTC", "QCOM",
  "ORCL", "MRK", "TMO", "ACN", "LIN", "MCD", "ABT", "DHR", "TXN", "VZ",
  "PM", "IBM", "GE", "CAT", "NOW", "UBER", "AMAT", "GS", "MS", "RTX",
  "HON", "BKNG", "ISRG", "SPGI", "PLTR", "BLK", "NEE", "LOW", "SYK", "PGR",
  "T", "SCHW", "UNP", "AXP", "C", "BSX", "PFE", "TJX", "MU", "LRCX",
  "PANW", "ANET", "DE", "COP", "KLAC", "MDT", "ADI", "SO", "SBUX", "GILD",
];

module.exports = { loadBars, loadUniverse, OMXS30, US_LARGE, US_INDEX: "^GSPC", SE_INDEX: "^OMX" };
