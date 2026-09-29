// proposal-params.js
// Preserve the historical EdgeAI proposal behaviour.
// The legacy per-ticker walk-forward vote remains a candidate-generation path
// so validation hardening cannot silently remove ideas that the old screener
// would have surfaced. Statistical evidence is calculated separately.

const { walkForward } = require("./walkforward");

function legacyVotedParams(universe, strat, isLen = 378, oosLen = 126) {
  const votes = new Map();
  for (const bars of Object.values(universe || {})) {
    if (!Array.isArray(bars) || bars.length < isLen + oosLen + 10) continue;
    const wf = walkForward(bars, { isLen, oosLen, step: oosLen }, strat);
    if (!wf.windows.length) continue;
    const params = wf.windows[wf.windows.length - 1].params;
    const key = JSON.stringify(params);
    votes.set(key, (votes.get(key) || 0) + 1);
  }

  let best = null, bestVotes = -1;
  for (const [key, n] of votes.entries()) {
    if (n > bestVotes) {
      best = key;
      bestVotes = n;
    }
  }
  return best ? JSON.parse(best) : strat.DEFAULT_PARAMS;
}

function uniqueParamSets(sets) {
  const seen = new Set();
  const out = [];
  for (const item of sets) {
    const key = JSON.stringify(item.params || {});
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

module.exports = { legacyVotedParams, uniqueParamSets };
