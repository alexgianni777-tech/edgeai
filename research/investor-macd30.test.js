'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { normalize30m, exitPriceForBar, backtest, summarize, indicators } = require('./investor-macd30');
const bar = (t, open, high, low, close) => ({ date: new Date(t), open, high, low, close });

test('normalization removes in-progress bars, duplicate timestamps and bad OHLC', () => {
  const data = normalize30m([
    bar('2026-11-23T09:00:00Z', 100, 102, 99, 101),
    bar('2026-11-23T09:00:00Z', 101, 103, 100, 102),
    bar('2026-11-23T09:30:00Z', 100, 99, 100, 101),
    bar('2026-11-23T10:00:00Z', 100, 101, 99, 100),
  ], Date.parse('2026-11-23T10:10:00Z'));
  assert.equal(data.length, 1);
  assert.equal(data[0].close, 102);
});
test('gap and both-hit use conservative stop-first fills', () => {
  assert.deepEqual(exitPriceForBar({open:94, high:110, low:90},95,105), {price:94,reason:'STOP_GAP'});
  assert.deepEqual(exitPriceForBar({open:100, high:110, low:90},95,105), {price:95,reason:'STOP'});
  assert.deepEqual(exitPriceForBar({open:100, high:106, low:99},95,105), {price:105,reason:'TARGET'});
});
test('no synthetic trades are invented in a flat price series', () => {
  const bars=[]; let time = Date.parse('2026-10-26T08:00:00Z');
  for(let i=0; i<420; i++){
    const d=new Date(time); d.setUTCMinutes(d.getUTCMinutes()+30); time=d.getTime();
    const hour=d.getUTCHours(); if(d.getUTCDay()===0||d.getUTCDay()===6||hour<8||hour>16) continue;
    bars.push({t:d.toISOString(),open:100,high:100.2,low:99.8,close:100});
  }
  assert.equal(backtest(bars).trades.length,0);
  assert.equal(summarize([]).winRatePct,null);
});
test('indicators depend only on prior and present bars', () => {
  const bars=Array.from({length:260},(_,i)=>({t:new Date(Date.parse('2026-09-01T08:00:00Z')+i*1800000).toISOString(),open:100+i/10,high:101+i/10,low:99+i/10,close:100+i/10}));
  const before=indicators(bars);
  const after=indicators([...bars,{...bars.at(-1),t:'2026-11-25T08:00:00Z',close:10000}]);
  assert.equal(before.macd.at(-1),after.macd.at(-2));
  assert.equal(before.trend.at(-1),after.trend.at(-2));
});
