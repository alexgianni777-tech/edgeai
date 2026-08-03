// data-live.js — RIKTIG data. Hämtar daglig OHLC från Yahoo Finance.
// OBS: kräver internet mot Yahoo — kör på din egen maskin / Replit / GitHub
// Actions (inte i Claudes sandlåda, som bara når utvecklardomäner).
//
//   npm install yahoo-finance2
//   node run-live.js

const yf = require("yahoo-finance2").default;

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

// Hämtar hela universumet (med liten paus för att vara snäll mot Yahoo).
async function loadUniverse(tickers = OMXS30, opts = {}) {
  const out = {};
  for (const tk of tickers) {
    try {
      const bars = await loadBars(tk, opts);
      if (bars.length > 300) out[tk] = bars;
      else console.error(`  (för lite data, hoppar) ${tk}: ${bars.length} barer`);
    } catch (e) {
      console.error(`  (fel, hoppar) ${tk}: ${e.message}`);
    }
    await sleep(350);
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
