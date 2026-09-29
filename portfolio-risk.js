// portfolio-risk.js
// Portfolio-aware helpers for clustered signals.
// Trades that originate on the same signal date are treated as one cohort so
// correlated "everything fired today" risk is not mistaken for independent bets.

const dateKey = t => {
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};

function buildCohorts(trades) {
  const byDay = new Map();
  for (const t of trades || []) {
    const day = dateKey(t.signalT || t.t);
    if (!day || !Number.isFinite(Number(t.r))) continue;
    const row = byDay.get(day) || { date: day, r: 0, n: 0 };
    row.r += Number(t.r);
    row.n += 1;
    byDay.set(day, row);
  }
  return [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function maxConcurrentTrades(trades) {
  const events = [];
  for (const t of trades || []) {
    const start = new Date(t.t).getTime();
    const end = new Date(t.exitT || t.t).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue;
    events.push([start, +1]);
    events.push([Math.max(start, end) + 1, -1]);
  }
  events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let cur = 0, max = 0;
  for (const [, delta] of events) {
    cur += delta;
    if (cur > max) max = cur;
  }
  return max;
}

function cohortDrawdownR(cohorts) {
  let eq = 0, peak = 0, maxDD = 0;
  for (const c of cohorts || []) {
    eq += Number(c.r) || 0;
    if (eq > peak) peak = eq;
    maxDD = Math.max(maxDD, peak - eq);
  }
  return maxDD;
}

function buildExitCohorts(trades) {
  const byDay = new Map();
  for (const t of trades || []) {
    const day = dateKey(t.exitT || t.t);
    if (!day || !Number.isFinite(Number(t.r))) continue;
    const row = byDay.get(day) || { date: day, r: 0, n: 0 };
    row.r += Number(t.r);
    row.n += 1;
    byDay.set(day, row);
  }
  return [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function realizedDrawdownR(trades) {
  return cohortDrawdownR(buildExitCohorts(trades));
}

module.exports = {
  buildCohorts,
  buildExitCohorts,
  maxConcurrentTrades,
  cohortDrawdownR,
  realizedDrawdownR,
};
