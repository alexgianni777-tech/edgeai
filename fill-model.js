"use strict";

// Daily OHLC fill model for strategy validation and the published-level ledger.
// Applies the stop to the *open* if a gap crosses it; don't invent a fill at stop.
// If both barriers are touched intraday, choose the adverse stop first.
// Favorable price gaps are not credited beyond the pre-set target.
// This remains an approximation: thin liquidity, derivatives' spreads and
// knock-out mechanics can produce worse fills than underlying-share OHLC.
function dailyExit(bar, direction, stop, target = null) {
  if (direction !== "short" && direction !== "long") throw new Error("Unknown direction");
  if (![bar?.open, bar?.high, bar?.low, bar?.close, stop].every(Number.isFinite)) {
    throw new Error("Missing or invalid OHLC/stop: cannot safely backtest execution");
  }
  if (target !== null && !Number.isFinite(target)) throw new Error("Invalid target");
  if (!(bar.high >= Math.max(bar.open, bar.close) && bar.low <= Math.min(bar.open, bar.close))) {
    throw new Error("Inconsistent OHLC data");
  }
  if (direction === "short") {
    if (bar.open >= stop) return { price: bar.open, reason: "STOP_GAP" };
    if (target !== null && bar.open <= target) return { price: target, reason: "TARGET_GAP_CAPPED" };
    if (bar.high >= stop) return { price: stop, reason: "STOP" };
    if (target !== null && bar.low <= target) return { price: target, reason: "TARGET" };
  } else {
    if (bar.open <= stop) return { price: bar.open, reason: "STOP_GAP" };
    if (target !== null && bar.open >= target) return { price: target, reason: "TARGET_GAP_CAPPED" };
    if (bar.low <= stop) return { price: stop, reason: "STOP" };
    if (target !== null && bar.high >= target) return { price: target, reason: "TARGET" };
  }
  return null;
}

function roundTripCostR(entry, exit, risk, costRate) {
  if (![entry, exit, risk, costRate].every(Number.isFinite) || !(entry > 0) || !(exit > 0) || !(risk > 0) || costRate < 0) {
    throw new Error("Invalid cost or price inputs");
  }
  // The rate is per side (courtage + modeled execution slippage).
  return costRate * (entry + exit) / risk;
}
module.exports = { dailyExit, roundTripCostR };
