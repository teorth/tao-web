/*
 * gibbs.js — DOM-free core for the Gibbs-phenomenon applet.
 *
 * A selection of 1-periodic functions is approximated by Fourier partial sums under
 * several summation methods.  With real Fourier coefficients
 *
 *     f(x) = a0/2 + sum_{n>=1} [ a_n cos(2*pi*n*x) + b_n sin(2*pi*n*x) ],
 *
 * a summation method attaches a multiplier m(n/N) to the n-th term:
 *
 *     S_N(x) = a0/2 + sum_{n=1}^{N} m(n/N) [ a_n cos(2*pi*n*x) + b_n sin(2*pi*n*x) ].
 *
 *   Dirichlet       m(t) = 1                 (sharp cutoff; shows the Gibbs overshoot)
 *   Fejer           m(t) = 1 - |t|           (Cesaro; non-negative kernel, no overshoot)
 *   Bochner-Riesz   m(t) = (1 - t^2)_+^delta (delta = 0 recovers Dirichlet)
 *
 * The Dirac comb has c_n = 1 for all n, so its partial sum is exactly the summation
 * kernel K_N(x) = 1 + 2 sum_{n=1}^N m(n/N) cos(2*pi*n*x) — Dirichlet, Fejer, or
 * Bochner-Riesz — which is why the comb is the cleanest way to see each kernel.
 *
 * No network, no dependencies.
 */
(function (root) {
  "use strict";
  const TWO_PI = 2 * Math.PI;
  function frac(x) { return x - Math.floor(x); }

  // ---- the 1-periodic functions (exact Fourier coefficients) ----
  const FUNCS = {
    square: {
      name: "Square wave",
      note: "1 on {x} < 1/2, -1 on {x} >= 1/2",
      value: function (x) { return frac(x) < 0.5 ? 1 : -1; },
      a0: 0, a: function () { return 0; },
      b: function (n) { return (n % 2 === 1) ? 4 / (Math.PI * n) : 0; },
      discont: [0, 0.5], continuous: false
    },
    sawtooth: {
      name: "Sawtooth",
      note: "{x} - 1/2",
      value: function (x) { return frac(x) - 0.5; },
      a0: 0, a: function () { return 0; },
      b: function (n) { return -1 / (Math.PI * n); },
      discont: [0], continuous: false
    },
    triangle: {
      name: "Triangle wave",
      note: "continuous — no Gibbs overshoot",
      value: function (x) { return 2 * Math.abs(2 * frac(x) - 1) - 1; },
      a0: 0, a: function (n) { return (n % 2 === 1) ? 8 / (Math.PI * Math.PI * n * n) : 0; },
      b: function () { return 0; },
      discont: [], continuous: true
    },
    comb: {
      name: "Dirac comb",
      note: "sum of unit masses at the integers — partial sums are the kernels",
      value: null,
      a0: 2, a: function () { return 2; }, b: function () { return 0; },
      discont: [0], continuous: false, comb: true
    }
  };

  // ---- summation multipliers m(t), t = n/N in [0,1] ----
  function multiplier(method, delta) {
    if (method === "dirichlet") return function () { return 1; };
    if (method === "fejer") return function (t) { return 1 - Math.abs(t); };
    // bochner-riesz of order delta.  At t = 1 (the top term) s = 0; with the convention
    // 0^0 = 1, order 0 keeps that term and so reproduces Dirichlet exactly.
    return function (t) { const s = 1 - t * t; if (s <= 0) return delta <= 0 ? 1 : 0; return Math.pow(s, delta); };
  }

  // ---- the summed Fourier series S_N(x) ----
  function partialSum(key, N, method, delta, x) {
    const f = FUNCS[key], m = multiplier(method, delta), w = TWO_PI * x;
    let s = f.a0 / 2;
    for (let n = 1; n <= N; n++) {
      const mm = m(n / N);
      if (mm === 0) continue;
      const an = f.a(n), bn = f.b(n);
      if (an !== 0) s += mm * an * Math.cos(w * n);
      if (bn !== 0) s += mm * bn * Math.sin(w * n);
    }
    return s;
  }

  // ---- the summation kernel K_N(x) (= the Dirac-comb partial sum) ----
  function kernel(N, method, delta, x) {
    const m = multiplier(method, delta), w = TWO_PI * x;
    let s = 1;
    for (let n = 1; n <= N; n++) { const mm = m(n / N); if (mm) s += 2 * mm * Math.cos(w * n); }
    return s;
  }

  // ---- one-sided limits at a jump (for the target drawing and the Gibbs readout) ----
  function sideLimits(key, d) {
    const f = FUNCS[key];
    if (!f.value) return null;
    return { L: f.value(d - 1e-7), R: f.value(d + 1e-7) };
  }

  // ---- Gibbs overshoot near the principal discontinuity (x = 0) ----
  // Returns the extreme values of S_N in a shrinking window around the jump, the
  // one-sided limits, and the theoretical Dirichlet overshoot fraction.
  const GIBBS_G = 1.1789797444721675;   // (2/pi) * Si(pi): Dirichlet peak for a unit half-jump
  function gibbs(key, N, method, delta) {
    const f = FUNCS[key];
    if (f.continuous || !f.discont.length || f.comb) return null;
    const d0 = f.discont[0], span = Math.min(0.5, 8 / Math.max(N, 1)), M = 3000;
    let peak = -Infinity, trough = Infinity, px = 0, tx = 0;
    for (let i = 0; i <= M; i++) {
      const x = d0 - span + (2 * span) * i / M, y = partialSum(key, N, method, delta, x);
      if (y > peak) { peak = y; px = x; }
      if (y < trough) { trough = y; tx = x; }
    }
    const sl = sideLimits(key, d0), hi = Math.max(sl.L, sl.R), lo = Math.min(sl.L, sl.R);
    const jump = Math.abs(sl.R - sl.L);
    const overFrac = jump > 0 ? (peak - hi) / jump : 0;   // -> 0.0895 for Dirichlet as N -> inf
    return {
      peak: peak, trough: trough, px: px, tx: tx,
      hi: hi, lo: lo, jump: jump, overFrac: overFrac,
      theoryFrac: (GIBBS_G - 1) / 2,                        // 0.08949...
      theoryPeak: 0.5 * (sl.L + sl.R) + (sl.R > sl.L ? 1 : -1) * (jump / 2) * GIBBS_G
    };
  }

  // ---- sample the approximation across an interval (handles the comb = kernel) ----
  function sampleApprox(key, N, method, delta, xmin, xmax, count) {
    const pts = [];
    for (let i = 0; i <= count; i++) {
      const x = xmin + (xmax - xmin) * i / count;
      pts.push([x, partialSum(key, N, method, delta, x)]);
    }
    return pts;
  }

  // ---- the target f, as polylines broken at its jumps (for drawing) ----
  function targetPolylines(key, xmin, xmax, count) {
    const f = FUNCS[key];
    if (!f.value) return [];                    // comb: drawn as spikes by the page
    const segs = [], step = (xmax - xmin) / count;
    let cur = [];
    let prev = null;
    for (let i = 0; i <= count; i++) {
      const x = xmin + step * i, y = f.value(x);
      if (prev !== null && Math.abs(y - prev) > 1e-6 && !f.continuous) { segs.push(cur); cur = []; }
      cur.push([x, y]); prev = y;
    }
    if (cur.length) segs.push(cur);
    return segs;
  }

  const api = {
    FUNCS: FUNCS,
    multiplier: multiplier,
    partialSum: partialSum,
    kernel: kernel,
    gibbs: gibbs,
    sideLimits: sideLimits,
    sampleApprox: sampleApprox,
    targetPolylines: targetPolylines,
    GIBBS_G: GIBBS_G
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.Gibbs = api;
})(typeof window !== "undefined" ? window : this);
