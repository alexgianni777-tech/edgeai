// data.js — datakälla.
//
// För demon genererar vi syntetisk OHLC med trendregimer OCH en mild,
// verklig struktur (lite momentum efter pullbacks i uppåtregim). Det gör
// att motorn har NÅGOT äkta att hitta — och walk-forward får avgöra om
// det håller out-of-sample. På riktig marknadsdata måste edgen omvalideras.
//
// Byt ut loadBars() mot din riktiga källa (Yahoo/Avanza/din OMXS30-feed).

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Box-Muller normal
function randn(rng) {
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function genSynthetic(n = 1800, seed = 42, edge = 0) {
  const rng = mulberry32(seed);
  const bars = [];
  let price = 100;
  let drift = 0.0003;
  let regimeLeft = 0;
  let momentum = 0;
  let prevRet = 0;
  for (let i = 0; i < n; i++) {
    if (regimeLeft <= 0) {
      const r = rng();
      drift = r < 0.55 ? 0.0006 : (r < 0.8 ? -0.0005 : 0.0001);
      regimeLeft = 40 + Math.floor(rng() * 120);
    }
    regimeLeft--;

    const vol = 0.011 + 0.004 * rng();
    // INJICERAD STRUKTUR (skalas av `edge`):
    //   edge=0  -> nästan ren slump (ingen edge efter kostnader)
    //   edge>0  -> dippar i uppåttrend tenderar att köpas (pullback-edge)
    const dipBias = (edge > 0 && drift > 0 && prevRet < 0) ? 0.0032 * edge : 0;
    const meanRevPull = drift > 0 ? -0.10 * momentum : 0;
    const ret = drift + momentum * 0.04 + momentum * 0.05 * edge + meanRevPull + dipBias + randn(rng) * vol;
    momentum = 0.85 * momentum + ret;
    prevRet = ret;

    const open = price;
    const close = Math.max(1, open * (1 + ret));
    const hi = Math.max(open, close) * (1 + Math.abs(randn(rng)) * vol * 0.5);
    const lo = Math.min(open, close) * (1 - Math.abs(randn(rng)) * vol * 0.5);
    bars.push({ t: i, open, high: hi, low: lo, close });
    price = close;
  }
  return bars;
}

// Stub för riktig data — implementera mot din befintliga feed.
async function loadBars(/* ticker */) {
  // return fetchFromYahooOrAvanza(ticker);
  throw new Error("loadBars(): koppla in din riktiga datakälla här.");
}

module.exports = { genSynthetic, loadBars };
