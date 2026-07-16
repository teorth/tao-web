// ---------------------------------------------------------------------------
// The zeta process — logic core (standalone, DOM-free).
//
// Background (Alexeev–Barreto–Li–Lichtman–Price–Shah–Tang–Tao, arXiv:2605.00301,
// §10.2). For each prime p and k >= 1 let E_{p,k} be independent Exp(log p), so
// P(E_{p,k} >= s) = p^{-s}. For a "time" s > 1 set
//     e_{p,s} = max{ k : E_{p,1}, ..., E_{p,k} >= s }        (initial-run length)
// a geometric variable, P(e_{p,s}=k) = p^{-ks}(1 - p^{-s}), mean 1/(p^s - 1).
// Then Z_s = prod_p p^{e_{p,s}} has the zeta distribution P(Z_s=n) = 1/(zeta(s) n^s).
//
// For a FIXED draw of all the E's, e_{p,s} is non-increasing in s (it counts the
// leading running-minima M_{p,k} = min(E_{p,1..k}) that exceed s), so Z_s is a
// monotone divisibility chain: Z_s | Z_t whenever 1 < t < s, equal to 1 for large
// s and growing as s -> 1. Its jumps are by prime POWERS p^j (a plateau in the
// running minimum makes e_{p,s} drop by >1 at one threshold), i.e. exactly the von
// Mangoldt downward chain P(n -> n/q) = Lambda(q)/log n, so the chain "jumps over"
// numbers. Each n>1 lies in the chain with probability nu_Lambda(n) = the invariant
// von Mangoldt weight int_1^oo log n /(zeta(s) n^s) ds.
// ---------------------------------------------------------------------------

// --- seedable RNG (mulberry32) + exponential sampling ---
function mulberry32(seed) {
  var a = seed >>> 0;
  return function () { a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function expSample(rate, rng) { return -Math.log(1 - rng()) / rate; }   // Exp(rate); survival e^{-rate*s}

// --- primes ---
function primesUpTo(limit) {
  var sieve = new Uint8Array(limit + 1), out = [], i, j;
  for (i = 2; i <= limit; i++) { if (!sieve[i]) { out.push(i); for (j = i * i; j <= limit; j += i) sieve[j] = 1; } }
  return out;
}
function firstNPrimes(n) { var lim = Math.max(15, Math.ceil(n * (Math.log(n) + Math.log(Math.log(n + 2)) + 2))); var ps = primesUpTo(lim); while (ps.length < n) { lim *= 2; ps = primesUpTo(lim); } return ps.slice(0, n); }
// primes worth sampling at floor sMin: those with p^{-sMin} >= eps (individually non-negligible).
function activePrimes(sMin, eps) { var lim = Math.ceil(Math.pow(1 / (eps || 1e-3), 1 / sMin)); return primesUpTo(Math.max(lim, 3)); }

// --- one instantiation (a fresh omega): per prime, the leading run of E's >= sMin ---
// Those values fully determine e_{p,s} and Z_s for every s >= sMin.
function drawSample(primes, sMin, rng) {
  return primes.map(function (p) {
    var rate = Math.log(p), Es = [], e;
    while (true) { e = expSample(rate, rng); if (e < sMin) break; Es.push(e); }
    return { p: p, Es: Es };
  });
}

// e_{p,s}: length of the leading run of Es that is >= s.
function eAt(Es, s) { var k = 0; while (k < Es.length && Es[k] >= s) k++; return k; }
// Z_s as a factorization { p: exponent } (omitting zero exponents).
function zFactorAt(sample, s) { var f = {}; for (var i = 0; i < sample.length; i++) { var e = eAt(sample[i].Es, s); if (e > 0) f[sample[i].p] = e; } return f; }

// --- the divisibility chain s |-> Z_s for a fixed sample, over s in [sMin, sMax] ---
// Threshold events = the running minima M_{p,k} (each tagged with p). Sorted by s
// descending and grouped by equal value (a plateau of one prime) => one chain step
// that multiplies Z by p^(plateau size). Returns nodes bottom-up (Z=1 first).
function buildChain(sample, sMin, sMax) {
  var events = [];
  sample.forEach(function (pe) { var m = Infinity; pe.Es.forEach(function (e) { m = Math.min(m, e); events.push({ t: m, p: pe.p }); }); });
  events.sort(function (a, b) { return b.t - a.t; });
  var nodes = [{ factor: {}, value: 1n, sHigh: sMax, sLow: events.length ? events[0].t : sMin, prime: null, power: 0 }];
  var factor = {}, i = 0;
  while (i < events.length) {
    var t = events[i].t, p = events[i].p, c = 0;
    while (i < events.length && events[i].t === t) { c++; i++; }   // group the plateau (same prime a.s.)
    var nf = {}; for (var q in factor) nf[q] = factor[q]; nf[p] = (nf[p] || 0) + c; factor = nf;
    var nextT = (i < events.length) ? events[i].t : sMin;
    nodes.push({ factor: nf, value: factorToBigInt(nf), sHigh: t, sLow: nextT, prime: p, power: c });
  }
  return nodes;
}
// the chain node whose s-interval (sLow, sHigh] contains s (or the base node).
function nodeAt(nodes, s) { for (var i = nodes.length - 1; i >= 0; i--) if (s > nodes[i].sLow - 1e-15 && s <= nodes[i].sHigh + 1e-15) return nodes[i]; return nodes[0]; }

// --- factorization helpers ---
function factorToBigInt(f) { var v = 1n, p; for (p in f) v *= BigInt(p) ** BigInt(f[p]); return v; }
function factorToNumber(f, cap) { var v = 1, p, k; cap = cap || 1e15; for (p in f) { for (k = 0; k < f[p]; k++) { v *= +p; if (v > cap) return null; } } return v; }
function factorToString(f) {
  var ps = Object.keys(f).map(Number).sort(function (a, b) { return a - b; }); if (!ps.length) return '1';
  return ps.map(function (p) { return f[p] === 1 ? '' + p : p + '^' + f[p]; }).join('·');
}

// --- zeta(s) via Euler–Maclaurin (accurate for s>1, incl. near 1) ---
function zeta(s) {
  if (s <= 1) return Infinity;
  var N = 16, sum = 0, k;
  for (k = 1; k < N; k++) sum += Math.pow(k, -s);
  sum += Math.pow(N, 1 - s) / (s - 1) + 0.5 * Math.pow(N, -s);
  sum += s * Math.pow(N, -s - 1) / 12;                                             // B2 term
  sum -= s * (s + 1) * (s + 2) * Math.pow(N, -s - 3) / 720;                        // B4
  sum += s * (s + 1) * (s + 2) * (s + 3) * (s + 4) * Math.pow(N, -s - 5) / 30240;  // B6
  return sum;
}
function zetaPmf(s, n) { return 1 / (zeta(s) * Math.pow(n, s)); }

// nu_Lambda(n) = int_1^oo log n /(zeta(s) n^s) ds  (Simpson). nu_Lambda(1) := 1.
// Memoized: each n is integrated once on first use (a one-time table, not per-frame work).
var _nuCache = { 1: 1 };
function nuLambda(n) {
  if (_nuCache[n] !== undefined) return _nuCache[n];
  var ln = Math.log(n), a = 1 + 1e-7, b = Math.min(80, 3 + 40 / ln), M = 4000, h = (b - a) / M, sum = 0, i;
  for (i = 0; i <= M; i++) { var s = a + i * h, val = ln * Math.pow(n, -s) / zeta(s); sum += (i === 0 || i === M ? 1 : (i % 2 ? 4 : 2)) * val; }
  return (_nuCache[n] = sum * h / 3);
}

var API = {
  mulberry32: mulberry32, expSample: expSample, primesUpTo: primesUpTo, firstNPrimes: firstNPrimes, activePrimes: activePrimes,
  drawSample: drawSample, eAt: eAt, zFactorAt: zFactorAt, buildChain: buildChain, nodeAt: nodeAt,
  factorToBigInt: factorToBigInt, factorToNumber: factorToNumber, factorToString: factorToString,
  zeta: zeta, zetaPmf: zetaPmf, nuLambda: nuLambda,
};
if (typeof window !== 'undefined') window.Zeta = API;
if (typeof module !== 'undefined' && module.exports) module.exports = API;
