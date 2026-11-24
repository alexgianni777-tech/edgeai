'use strict';
/**
 * AG Invest | Investor B 30m MACD research only.
 * Isolated from EdgeAI production and Telegram. No order execution.
 * Usage: node research/investor-macd30.js [--archive=research/archive/inve-b-30m.json]
 */
const fs = require('node:fs');
const path = require('node:path');
const SYMBOL = 'INVE-B.ST';
const ZONE = 'Europe/Stockholm';
const SETTINGS = Object.freeze({
  capital: 12000, riskPct: 0.01, commissionSek: 19,
  entryAndExitFrictionBps: 5, minNotionalSek: 1000,
  fast: 12, slow: 26, signal: 9, trend: 200,
  slope: 5, atrPeriod: 14, stopAtr: 1.5, targetR: 4,
  minTradingDaysApart: 2, maxHoldingBars: 50,
  minOosTrades: 30,
});
const dateFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
});
const timeFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});
function localDate(iso) { return dateFormat.format(new Date(iso)); }
function localMinutes(iso) {
  const parts = timeFormat.format(new Date(iso)).split(':').map(Number);
  return parts[0] * 60 + parts[1];
}
function isSessionBar(t) {
  const d = new Date(t);
  const day = new Intl.DateTimeFormat('en-US', { timeZone: ZONE, weekday: 'short' }).format(d);
  const min = localMinutes(t);
  return !['Sat', 'Sun'].includes(day) && min >= 9 * 60 && min < 17 * 60 + 30;
}
function normalize30m(quotes, now = Date.now()) {
  const map = new Map();
  for (const q of quotes || []) {
    const ms = new Date(q.date || q.t).getTime();
    if (!Number.isFinite(ms) || ms + 30 * 60000 > now || !isSessionBar(ms)) continue;
    const [open, high, low, close] = ['open', 'high', 'low', 'close'].map(k => Number(q[k]));
    if (![open, high, low, close].every(x => Number.isFinite(x) && x > 0)) continue;
    if (high < Math.max(open, close) || low > Math.min(open, close)) continue;
    map.set(new Date(ms).toISOString(), { t: new Date(ms).toISOString(), open, high, low, close });
  }
  return [...map.values()].sort((a, b) => a.t.localeCompare(b.t));
}
function ema(values, n) {
  const output = new Array(values.length).fill(null);
  const k = 2 / (n + 1); let v = null;
  for (let i = 0; i < values.length; i++) {
    if (!Number.isFinite(values[i])) continue;
    v = v === null ? values[i] : k * values[i] + (1 - k) * v;
    if (i >= n - 1) output[i] = v;
  }
  return output;
}
function indicators(bars, p = SETTINGS) {
  const close = bars.map(b => b.close);
  const trend = ema(close, p.trend);
  const fast = ema(close, p.fast), slow = ema(close, p.slow);
  const macd = close.map((_, i) => fast[i] != null && slow[i] != null ? fast[i] - slow[i] : null);
  const signal = ema(macd, p.signal);
  const tr = bars.map((b, i) => i === 0 ? b.high - b.low : Math.max(
    b.high - b.low, Math.abs(b.high - bars[i - 1].close), Math.abs(b.low - bars[i - 1].close)));
  const atr = new Array(bars.length).fill(null);
  let smoothed = 0;
  tr.forEach((x, i) => {
    if (i < p.atrPeriod) { smoothed += x; if (i === p.atrPeriod - 1) { smoothed /= p.atrPeriod; atr[i] = smoothed; } }
    else { smoothed = (smoothed * (p.atrPeriod - 1) + x) / p.atrPeriod; atr[i] = smoothed; }
  });
  return { trend, macd, signal, atr };
}
function exitPriceForBar(bar, stop, target) {
  // Opening gap fills before intrabar extremes. When both levels hit, assume stop first.
  if (bar.open <= stop) return { price: bar.open, reason: 'STOP_GAP' };
  if (bar.open >= target) return { price: bar.open, reason: 'TARGET_GAP' };
  if (bar.low <= stop) return { price: stop, reason: 'STOP' };
  if (bar.high >= target) return { price: target, reason: 'TARGET' };
  return null;
}
function backtest(bars, p = SETTINGS) {
  const ind = indicators(bars, p), sessions = [...new Set(bars.map(b => localDate(b.t)))];
  const dayIndex = new Map(sessions.map((day, i) => [day, i]));
  const trades = [];
  let equity = p.capital, lastEntrySession = -p.minTradingDaysApart - 1;
  let open = null;
  const friction = p.entryAndExitFrictionBps / 10000;
  for (let i = 1; i < bars.length; i++) {
    const b = bars[i], prior = bars[i - 1];
    if (open) {
      let hit = exitPriceForBar(b, open.stop, open.target);
      if (!hit && i - open.entryBar >= p.maxHoldingBars) hit = { price: b.open, reason: 'TIME_NEXT_OPEN' };
      if (hit) {
        const exitFill = hit.price * (1 - friction);
        const netSek = open.qty * (exitFill - open.entryFill) - 2 * p.commissionSek;
        const riskSek = open.qty * (open.entryFill - open.stop) + 2 * p.commissionSek;
        const result = { signalTime: open.signalTime, entryTime: open.entryTime,
          exitTime: b.t, entryFill: open.entryFill, exitFill, stop: open.stop,
          target: open.target, qty: open.qty, reason: hit.reason, netSek,
          r: riskSek > 0 ? netSek / riskSek : null };
        equity += netSek;
        trades.push(result); open = null;
        // Never reopen on same bar used to close the prior position.
        continue;
      }
    }
    if (open || i < Math.max(p.trend + p.slope, p.slow + p.signal + 5) + 1) continue;
    const s = i - 1;
    if ([ind.macd[s - 1], ind.signal[s - 1], ind.macd[s], ind.signal[s], ind.atr[s], ind.trend[s], ind.trend[s - p.slope]].some(x => x == null)) continue;
    const crossover = ind.macd[s - 1] <= ind.signal[s - 1] && ind.macd[s] > ind.signal[s];
    const uptrend = prior.close > ind.trend[s] && ind.trend[s] > ind.trend[s - p.slope];
    const sessionN = dayIndex.get(localDate(b.t));
    if (!crossover || !uptrend || sessionN - lastEntrySession < p.minTradingDaysApart) continue;
    const stopDist = ind.atr[s] * p.stopAtr;
    if (!(stopDist > 0)) continue;
    const entryFill = b.open * (1 + friction);
    const stop = entryFill - stopDist, target = entryFill + stopDist * p.targetR;
    const maxByCash = Math.floor((equity - p.commissionSek) / entryFill);
    const maxByRisk = Math.floor((equity * p.riskPct - 2 * p.commissionSek) / (entryFill - stop));
    const qty = Math.min(maxByCash, maxByRisk);
    if (!(qty > 0) || qty * entryFill < p.minNotionalSek) continue;
    open = { signalTime: prior.t, entryTime: b.t, entryBar: i, qty,
      entryFill, stop, target };
    lastEntrySession = sessionN;
    // Entry-bar stop/target must be checked after filling the next bar's open.
    const hit = exitPriceForBar(b, stop, target);
    if (hit) {
      const exitFill = hit.price * (1 - friction);
      const netSek = qty * (exitFill - entryFill) - 2 * p.commissionSek;
      const riskSek = qty * stopDist + 2 * p.commissionSek;
      trades.push({signalTime: prior.t, entryTime: b.t, exitTime: b.t,
        entryFill, exitFill, stop, target, qty, reason: hit.reason,
        netSek, r: netSek / riskSek});
      equity += netSek; open = null;
    }
  }
  return { trades, openPosition: open, equity, parameters: p };
}
function summarize(trades) {
  const win = trades.filter(t => t.netSek > 0), loss = trades.filter(t => t.netSek < 0);
  const total = trades.reduce((s, t) => s + t.netSek, 0);
  const gains = win.reduce((s, t) => s + t.netSek, 0);
  const losses = -loss.reduce((s, t) => s + t.netSek, 0);
  let balance = 0, peak = 0, dd = 0;
  for (const trade of trades) { balance += trade.netSek; peak = Math.max(peak, balance); dd = Math.max(dd, peak - balance); }
  return { trades: trades.length, winRatePct: trades.length ? 100 * win.length / trades.length : null,
    profitFactor: losses ? gains / losses : null,
    expectancyR: trades.length ? trades.reduce((s, t) => s + t.r, 0) / trades.length : null,
    netSek: total, maxRealizedDrawdownSek: dd };
}
function report(bars, p = SETTINGS) {
  const result = backtest(bars, p);
  const cut = Math.floor(bars.length * 0.7);
  const cutTime = bars[cut]?.t;
  const train = result.trades.filter(t => t.entryTime < cutTime);
  const oos = result.trades.filter(t => t.entryTime >= cutTime);
  return { ticker: SYMBOL, interval: '30m', dataStart: bars[0]?.t || null,
    dataEnd: bars.at(-1)?.t || null, bars: bars.length, costModel: 'SEK 19/order + 5bps per side (including spread and slippage assumption)',
    noLiveSignals: true, note: 'Research only: not a real execution record; Yahoo intraday depth is limited. Past data does not prove future profitability.',
    inSample: summarize(train), outOfSample: summarize(oos), total: summarize(result.trades),
    oosStatus: oos.length >= p.minOosTrades ? 'ENOUGH_COUNT_ONLY_NOT_PROOF' : 'INSUFFICIENT_OOS_TRADES',
    lastOpenSimulatedPosition: result.openPosition ? {entryTime: result.openPosition.entryTime, stop: result.openPosition.stop, target: result.openPosition.target} : null };
}
async function fetch30m() {
  const YF = require('yahoo-finance2');
  const Type = YF.default || YF.YahooFinance || YF;
  const client = typeof Type === 'function' ? new Type() : Type;
  const res = await client.chart(SYMBOL, {period1: new Date(Date.now() - 59 * 86400000), interval: '30m', includePrePost: false});
  if (!res?.quotes?.length) throw new Error('Yahoo returned no 30m quotes; do not infer signals');
  return normalize30m(res.quotes);
}
async function main() {
  const arg = process.argv.find(s => s.startsWith('--archive='));
  const archivePath = arg ? path.resolve(arg.split('=').slice(1).join('=')) : null;
  let old = [];
  if (archivePath && fs.existsSync(archivePath)) old = JSON.parse(fs.readFileSync(archivePath, 'utf8'));
  const fresh = await fetch30m();
  const bars = normalize30m([...old, ...fresh]);
  if (archivePath) {
    fs.mkdirSync(path.dirname(archivePath), {recursive: true});
    fs.writeFileSync(archivePath, JSON.stringify(bars, null, 2) + '\n');
  }
  const results = report(bars);
  process.stdout.write(JSON.stringify(results, null, 2) + '\n');
  if (results.oosStatus !== 'ENOUGH_COUNT_ONLY_NOT_PROOF') process.exitCode = 2;
}
if (require.main === module) main().catch(e => { console.error('NO_SIGNAL_DATA_ERROR:', e.message); process.exitCode = 1; });
module.exports = {SETTINGS, normalize30m, indicators, exitPriceForBar, backtest, summarize, report, localDate};
