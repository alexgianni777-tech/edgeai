"use strict";
// Conservative point-in-time SMA200 regime. Missing/invalid data is UNKNOWN,
// never risk-on. In historical windows, warmup bars must not be pre-approved.
function regimeFrom(indexBars, period = 200) {
  if (!Number.isInteger(period) || period < 2) throw new Error("Invalid SMA period");
  const bars = Array.isArray(indexBars) ? indexBars : [];
  const map = {};
  let sum = 0;
  let validRun = 0;
  const window = [];
  let on = false;
  for (const bar of bars) {
    const date = bar && bar.t != null ? new Date(bar.t) : new Date(NaN);
    const day = Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : null;
    const close = bar?.close;
    if (!Number.isFinite(close) || close <= 0) {
      sum = 0; validRun = 0; window.length = 0;
      if (day) map[day] = false;
      on = false;
      continue;
    }
    window.push(close);
    sum += close;
    validRun++;
    if (window.length > period) sum -= window.shift();
    on = validRun >= period && close > sum / period;
    if (day) map[day] = on;
  }
  return { map, on, sufficientHistory: validRun >= period };
}
module.exports = { regimeFrom };
