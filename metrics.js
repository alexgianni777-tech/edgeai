// metrics.js — transparent performance metrics in R.

function metrics(trades) {
  const rs = (trades || []).map(t => Number(t.r)).filter(Number.isFinite);
  const n = rs.length;
  if (n === 0) return { n: 0 };

  const wins = rs.filter(r => r > 0);
  const losses = rs.filter(r => r <= 0);
  const sum = rs.reduce((a, b) => a + b, 0);
  const grossWin = wins.reduce((a, b) => a + b, 0);
  const grossLoss = Math.abs(losses.reduce((a, b) => a + b, 0));

  let eq = 0, peak = 0, maxDD = 0;
  for (const r of rs) {
    eq += r;
    if (eq > peak) peak = eq;
    const dd = peak - eq;
    if (dd > maxDD) maxDD = dd;
  }

  const mean = sum / n;
  const variance = rs.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, n - 1);
  const sd = Math.sqrt(variance) || 1e-9;
  const se = sd / Math.sqrt(n);
  const ci = 1.96 * se;

  return {
    n,
    expectancy: mean,
    expectancySE: se,
    expectancyLow95: mean - ci,
    expectancyHigh95: mean + ci,
    winRate: wins.length / n,
    profitFactor: grossLoss === 0 ? Infinity : grossWin / grossLoss,
    avgWin: wins.length ? grossWin / wins.length : 0,
    avgLoss: losses.length ? -grossLoss / losses.length : 0,
    totalR: sum,
    maxDD_R: maxDD,
    sqn: (mean / sd) * Math.sqrt(n),
  };
}

module.exports = { metrics };
