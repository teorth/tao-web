// ---------------------------------------------------------------------------
// Gilbreath decay constants — logic core (standalone, DOM-free).
//
// For iid standard-exponential initial data a_(0,1), a_(0,2), … the Gilbreath
// array is the iterated absolute difference a_(i+1,j) = |a_(i,j) − a_(i,j+1)|.
// The decay constants are c_i = E a_(i,j) (translation-invariant in j).
//
//   • Chase–Hunter–Tao (arXiv:2607.08712) introduced this stationary model,
//     proved Σ_{i≤n} c_i ≥ log(n+e) (so no exponential decay) and computed the
//     exact rationals c_0 … c_3 (c_2 = 7/9, c_3 = 227/288). They suggested 1/i as
//     a plausible maximal rate but could not even show (c_i) is bounded.
//   • Michael M. Ross ("Empirical Structure of the Gilbreath Decay Constants",
//     Zenodo 10.5281/zenodo.21326026; code github.com/michaelmross/Gilbreath)
//     computed c_4, c_5, c_6 exactly by a sign-cone decomposition, and — the
//     headline finding this app visualises — the empirical DIGIT-SUM LAW
//     c_i ≈ C·λ^{s_2(i)}/i, where s_2(i) is the binary digit sum and λ drifts
//     through ≈1.14–1.20 (Figure 1 uses the deep-window estimate λ = 1.17).
//
// This module estimates c_i by Monte Carlo (the left diagonal a_(i,0) over many
// independent pyramids, as in the paper's cn.py) and exposes the exact values +
// Ross's law, so the app can animate the estimates converging (its Figure 1).
// ---------------------------------------------------------------------------

// Attribution, for the app to display verbatim.
const CREDITS = {
  cht: {
    authors: 'Chase, Hunter & Tao', ref: 'arXiv:2607.08712',
    url: 'https://arxiv.org/abs/2607.08712',
    contribution: 'the stationary exponential model, the bound Σ c_i ≥ log(n+e), and exact c_0–c_3',
  },
  ross: {
    author: 'Michael M. Ross', ref: 'Zenodo 10.5281/zenodo.21326026',
    url: 'https://zenodo.org/records/21326026',
    contribution: 'exact c_4, c_5, c_6 and the empirical digit-sum law c_i ≈ C·λ^{s_2(i)}/i',
  },
};

// binary digit sum s_2(n) (population count)
function s2(n) { let c = 0; n = n >>> 0; while (n) { c += n & 1; n >>>= 1; } return c; }

// Exact c_i (from Chase–Hunter–Tao for i≤3; sign-cone census for i=4,5,6).
// `dec` is the decimal used for plotting; `num`/`den` the exact rational where
// it is small enough to show. c_6's exact rational has a ~150-digit denominator
// (largest prime factor 331) — carried as a decimal only.
const EXACT = {
  0: { dec: 1, num: '1', den: '1', source: 'trivial' },
  1: { dec: 1, num: '1', den: '1', source: 'CHT' },
  2: { dec: 7 / 9, num: '7', den: '9', source: 'CHT' },
  3: { dec: 227 / 288, num: '227', den: '288', source: 'CHT' },
  4: { dec: 0.538217346302, num: '778959731701', den: '1447295850000', source: 'Ross' },
  5: { dec: 0.553258299594, num: '14008668886481596262550223816901',
    den: '25320304994525128311856832700000', source: 'Ross' },
  6: { dec: 0.448388672133, source: 'Ross' },   // exact rational has a 150-digit denominator
};
const EXACT_MAX = 6;

// Ross's digit-sum law  c_i ≈ C · λ^{s_2(i)} / i  and the pure 1/i envelope.
// λ = 1.17 is the paper's deep-window estimate (Figure 1); C is a fitting scale.
function ciLaw(i, C = 1.9, lambda = 1.17) { return i < 1 ? NaN : (C * Math.pow(lambda, s2(i))) / i; }
function ciEnvelope(i, C = 3.9) { return i < 1 ? NaN : C / i; }

// A small seedable PRNG so runs are reproducible (tests, shareable seeds).
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const sampleExp1 = (rng) => -Math.log(1 - (rng ? rng() : Math.random()));   // rate-1 exponential

// One pyramid from a top row of width N: return the full array of rows (row i has
// N−i entries), and its LEFT DIAGONAL diag[i] = a_(i,0) (first entry of each row).
// c_i is estimated from the diagonal — the quantity the paper's figure uses and
// the "individual instance" the app can display over a Gilbreath array.
function pyramidRows(top) {
  const rows = [top.slice()];
  while (rows[rows.length - 1].length > 1) {
    const r = rows[rows.length - 1], next = new Array(r.length - 1);
    for (let j = 0; j < next.length; j++) next[j] = Math.abs(r[j + 1] - r[j]);
    rows.push(next);
  }
  return rows;
}
function pyramidDiagonal(top) {   // diag[i] = a_(i,0), i = 0 … N−1
  let row = top.slice();
  const diag = [];
  while (row.length) {
    diag.push(row[0]);
    if (row.length === 1) break;
    const next = new Array(row.length - 1);
    for (let j = 0; j < next.length; j++) next[j] = Math.abs(row[j + 1] - row[j]);
    row = next;
  }
  return diag;
}

// Accumulator over independent pyramids of width N. Each pyramid contributes one
// diagonal value a_(i,0) per depth; c_i = mean over pyramids, iid standard error.
function makeEstimator(N, rng) {
  const sum = new Float64Array(N), sumsq = new Float64Array(N), cnt = new Float64Array(N);
  const draw = rng || Math.random;
  return {
    N, pyramids: 0,
    // simulate `k` fresh Exp(1) pyramids of width N and fold in their diagonals
    run(k) {
      for (let p = 0; p < k; p++) {
        const top = new Array(N);
        for (let j = 0; j < N; j++) top[j] = -Math.log(1 - draw());
        const d = pyramidDiagonal(top);
        for (let i = 0; i < d.length; i++) { sum[i] += d[i]; sumsq[i] += d[i] * d[i]; cnt[i]++; }
        this.pyramids++;
      }
      return this;
    },
    ci(i) { return cnt[i] ? sum[i] / cnt[i] : NaN; },
    se(i) {
      const n = cnt[i]; if (n < 2) return NaN;
      const m = sum[i] / n, v = Math.max(0, (sumsq[i] - n * m * m) / (n - 1));
      return Math.sqrt(v / n);
    },
    series() {   // [{ i, ci, se }] for i = 1 … N−1 (skip the trivial c_0)
      const out = [];
      for (let i = 1; i < N; i++) if (cnt[i]) out.push({ i, ci: this.ci(i), se: this.se(i) });
      return out;
    },
  };
}

const API = { s2, CREDITS, EXACT, EXACT_MAX, ciLaw, ciEnvelope, mulberry32, sampleExp1, pyramidRows, pyramidDiagonal, makeEstimator };
if (typeof window !== 'undefined') window.GilbreathCn = API;
if (typeof module !== 'undefined' && module.exports) module.exports = API;
