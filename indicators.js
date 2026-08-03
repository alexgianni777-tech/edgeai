// indicators.js — rena indikatorfunktioner, inga look-ahead-fel.
// Alla returnerar en array lika lång som indata; värden som inte går att
// beräkna än är null.

function ema(values, period) {
  const out = new Array(values.length).fill(null);
  const k = 2 / (period + 1);
  let prev = null;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (prev === null) {
      // seed med enkelt medel av första `period` värden
      if (i >= period - 1) {
        let s = 0;
        for (let j = i - period + 1; j <= i; j++) s += values[j];
        prev = s / period;
        out[i] = prev;
      }
    } else {
      prev = v * k + prev * (1 - k);
      out[i] = prev;
    }
  }
  return out;
}

// Wilders RSI
function rsi(closes, period = 14) {
  const out = new Array(closes.length).fill(null);
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i < closes.length; i++) {
    const ch = closes[i] - closes[i - 1];
    const gain = Math.max(ch, 0);
    const loss = Math.max(-ch, 0);
    if (i <= period) {
      avgGain += gain; avgLoss += loss;
      if (i === period) {
        avgGain /= period; avgLoss /= period;
        out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
      }
    } else {
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
      out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
    }
  }
  return out;
}

// Wilders ATR
function atr(bars, period = 14) {
  const out = new Array(bars.length).fill(null);
  let prevClose = null, prevATR = null;
  const trs = [];
  for (let i = 0; i < bars.length; i++) {
    const b = bars[i];
    const tr = prevClose === null
      ? b.high - b.low
      : Math.max(b.high - b.low, Math.abs(b.high - prevClose), Math.abs(b.low - prevClose));
    trs.push(tr);
    if (i === period - 1) {
      let s = 0; for (let j = 0; j < period; j++) s += trs[j];
      prevATR = s / period; out[i] = prevATR;
    } else if (i >= period) {
      prevATR = (prevATR * (period - 1) + tr) / period; out[i] = prevATR;
    }
    prevClose = b.close;
  }
  return out;
}

// MACD (fast/slow/signal). Returnerar {macd, signal, hist}.
function macd(closes, fast = 12, slow = 26, signal = 9) {
  const ef = ema(closes, fast);
  const es = ema(closes, slow);
  const macdLine = closes.map((_, i) => (ef[i] != null && es[i] != null) ? ef[i] - es[i] : null);
  const sig = new Array(closes.length).fill(null);
  let prev = null; const k = 2 / (signal + 1); let seedSum = 0, seedCount = 0;
  for (let i = 0; i < macdLine.length; i++) {
    if (macdLine[i] == null) continue;
    if (prev === null) {
      seedSum += macdLine[i]; seedCount++;
      if (seedCount === signal) { prev = seedSum / signal; sig[i] = prev; }
    } else {
      prev = macdLine[i] * k + prev * (1 - k); sig[i] = prev;
    }
  }
  const hist = macdLine.map((v, i) => (v != null && sig[i] != null) ? v - sig[i] : null);
  return { macd: macdLine, signal: sig, hist };
}

module.exports = { ema, rsi, atr, macd };
