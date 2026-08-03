// metrics.js — ärliga nyckeltal i R från en lista trades.

function metrics(trades) {
  const rs = trades.map(t => t.r);
  const n = rs.length;
  if (n === 0) return { n: 0 };

  const wins = rs.filter(r => r > 0);
  const losses = rs.filter(r => r <= 0);
  const sum = rs.reduce((a, b) => a + b, 0);
  const grossWin = wins.reduce((a, b) => a + b, 0);
  const grossLoss = Math.abs(losses.reduce((a, b) => a + b, 0));

  // equity i R + max drawdown
  let eq = 0, peak = 0, maxDD = 0;
  for (const r of rs) {
    eq += r;
    if (eq > peak) peak = eq;
    const dd = peak - eq;
    if (dd > maxDD) maxDD = dd;
  }

  const mean = sum / n;
  const sd = Math.sqrt(rs.reduce((a, b) => a + (b - mean) ** 2, 0) / n) || 1e-9;

  return {
    n,
    expectancy: mean,                      // förväntat R per trade
    winRate: wins.length / n,
    profitFactor: grossLoss === 0 ? Infinity : grossWin / grossLoss,
    avgWin: wins.length ? grossWin / wins.length : 0,
    avgLoss: losses.length ? -grossLoss / losses.length : 0,
    totalR: sum,
    maxDD_R: maxDD,
    sqn: (mean / sd) * Math.sqrt(n),       // System Quality Number (Van Tharp-stil)
  };
}

module.exports = { metrics };
