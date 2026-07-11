/*
 * gilbreath.js — pure numeric core for the Gilbreath-array applet.
 *
 * No DOM here: everything is plain functions on numbers/arrays so the core can
 * be exercised by headless Node unit tests (see the Stage 0 tests). The browser
 * UI (gilbreath.html) consumes this via window.Gilbreath.
 *
 * Background: Chase, Hunter & Tao, "Gilbreath's conjecture: a Cramer random
 * model and a deterministic analysis". Conventions here follow that paper:
 *   - normalized prime gaps are (p_{n+1} - p_n)/2 - 1;
 *   - geometric variables use parameter p, with P(a = k) = (1-p)^k * p.
 */
(function (root) {
  "use strict";

  // --- Seedable PRNG (mulberry32): deterministic so tests + "regenerate" are
  // reproducible. Returns a function producing floats in [0, 1). ---
  function mulberry32(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // A uniform sample in (0, 1], safe as an argument to Math.log.
  function openUnit(rng) {
    return 1 - rng();
  }

  // --- Primes: return the first `count` primes via a growing sieve. ---
  function sievePrimes(count) {
    if (count <= 0) return [];
    // Rosser-style overestimate of the nth prime, with a floor for small n.
    var limit =
      count < 6
        ? 15
        : Math.ceil(count * (Math.log(count) + Math.log(Math.log(count)))) + 10;
    for (;;) {
      var sieve = new Uint8Array(limit + 1); // 0 = prime candidate
      sieve[0] = sieve[1] = 1;
      for (var i = 2; i * i <= limit; i++) {
        if (!sieve[i]) {
          for (var j = i * i; j <= limit; j += i) sieve[j] = 1;
        }
      }
      var primes = [];
      for (var k = 2; k <= limit && primes.length < count; k++) {
        if (!sieve[k]) primes.push(k);
      }
      if (primes.length >= count) return primes;
      limit *= 2; // rare: estimate was short, try again
    }
  }

  // --- Top-row generators. Each returns an array of length N. ---

  // (a) first N primes
  function genPrimes(N) {
    return sievePrimes(N);
  }

  // (b) first N prime gaps: p_{k+1} - p_k, k = 1..N
  function genPrimeGaps(N) {
    var P = sievePrimes(N + 1);
    var out = [];
    for (var k = 0; k < N; k++) out.push(P[k + 1] - P[k]);
    return out;
  }

  // (c) first N normalized prime gaps (paper's convention): (p_{k+1}-p_k)/2 - 1,
  //     starting from the gap p_3 - p_2, i.e. (P[j+2]-P[j+1])/2 - 1, j = 0..N-1.
  function genNormalizedGaps(N) {
    var P = sievePrimes(N + 2);
    var out = [];
    for (var j = 0; j < N; j++) out.push((P[j + 2] - P[j + 1]) / 2 - 1);
    return out;
  }

  // A constant all-zeroes top row (a trivial, "already collapsed" example).
  function genZeros(N) {
    var out = [];
    for (var i = 0; i < N; i++) out.push(0);
    return out;
  }

  // A single spike: value d at position pos (1-based, clamped to 1..N), else 0.
  // With d = 1 the array is Pascal's triangle, so parity colouring draws a
  // Sierpinski gasket (cf. the paper's single-non-zero-entry example).
  function genSpike(N, pos, d) {
    var p = Math.max(1, Math.min(N, Math.round(pos))) - 1;
    var out = [];
    for (var i = 0; i < N; i++) out.push(i === p ? d : 0);
    return out;
  }

  // (d) N independent uniforms on {0, ..., m-1}
  function genUniform(N, m, rng) {
    var out = [];
    for (var i = 0; i < N; i++) out.push(Math.floor(rng() * m));
    return out;
  }

  // Uniform on the EVEN numbers in {0, ..., m-1}: {0, 2, 4, ...}. Since every
  // entry is even, so is the whole array -- the diagonal is trapped in the even
  // integers and can never reach 1 (the 2-separated-set parity obstruction).
  function genUniformEven(N, m, rng) {
    var count = Math.max(1, Math.ceil(m / 2)); // # of evens in {0,...,m-1}
    var out = [];
    for (var i = 0; i < N; i++) out.push(2 * Math.floor(rng() * count));
    return out;
  }

  // Uniform on the ODD numbers in {1, 3, ...} within {0, ..., m-1}. Differences
  // of odds are even, so from the second row on the array is even -- again a
  // parity obstruction preventing the diagonal from reaching 1. Requires m >= 2.
  function genUniformOdd(N, m, rng) {
    var count = Math.max(1, Math.floor(m / 2)); // # of odds in {0,...,m-1}
    var out = [];
    for (var i = 0; i < N; i++) out.push(2 * Math.floor(rng() * count) + 1);
    return out;
  }

  // (e) N independent geometrics with parameter p, P(a=k) = (1-p)^k * p.
  //     Sampled by inversion: k = floor( ln(U) / ln(1-p) ).
  function genGeometric(N, p, rng) {
    var denom = Math.log(1 - p);
    var out = [];
    for (var i = 0; i < N; i++) {
      out.push(Math.floor(Math.log(openUnit(rng)) / denom));
    }
    return out;
  }

  // (f) N independent exponentials with mean lambda: P(a >= t) = e^{-t/lambda}.
  function genExponential(N, lambda, rng) {
    var out = [];
    for (var i = 0; i < N; i++) out.push(-lambda * Math.log(openUnit(rng)));
    return out;
  }

  // --- The array itself: row 0 is the input; row i+1 is the absolute
  // difference of row i (length shrinks by one each row). ---
  function computeArray(topRow) {
    var rows = [topRow.slice()];
    var cur = rows[0];
    while (cur.length > 1) {
      var next = [];
      for (var j = 0; j < cur.length - 1; j++) {
        next.push(Math.abs(cur[j] - cur[j + 1]));
      }
      rows.push(next);
      cur = next;
    }
    return rows;
  }

  // --- Per-row statistics. ---
  function rowStats(row) {
    if (!row.length) return { mean: NaN, max: NaN };
    var sum = 0,
      max = -Infinity;
    for (var i = 0; i < row.length; i++) {
      sum += row[i];
      if (row[i] > max) max = row[i];
    }
    return { mean: sum / row.length, max: max };
  }

  // --- Coloring classifiers. ---
  // Parity: "even"/"odd" for integers, "neutral" for non-integers.
  function parityClass(x) {
    if (!Number.isFinite(x) || !Number.isInteger(x)) return "neutral";
    return (((x % 2) + 2) % 2) === 0 ? "even" : "odd";
  }
  // Magnitude: bucket by floor(|x|).
  function magnitudeIndex(x) {
    return Math.floor(Math.abs(x));
  }

  // --- Gilbreath's conjecture read-out on the left diagonal a_(i,1), i >= 1
  // (the leftmost entry of every row below the top). ---
  function leftDiagonal(rows) {
    var diag = [];
    for (var i = 1; i < rows.length; i++) diag.push(rows[i][0]);
    return diag;
  }
  function gilbreathStatus(rows) {
    var diag = leftDiagonal(rows);
    var allOnes = true,
      zeroOne = true,
      firstBad = -1;
    for (var i = 0; i < diag.length; i++) {
      var v = diag[i];
      if (v !== 1) allOnes = false;
      if (v !== 0 && v !== 1) {
        zeroOne = false;
        if (firstBad < 0) firstBad = i + 1; // row index (1-based below top)
      }
    }
    return { diagonal: diag, allOnes: allOnes, zeroOne: zeroOne, firstBadRow: firstBad };
  }

  var Gilbreath = {
    mulberry32: mulberry32,
    sievePrimes: sievePrimes,
    genPrimes: genPrimes,
    genPrimeGaps: genPrimeGaps,
    genNormalizedGaps: genNormalizedGaps,
    genZeros: genZeros,
    genSpike: genSpike,
    genUniform: genUniform,
    genUniformEven: genUniformEven,
    genUniformOdd: genUniformOdd,
    genGeometric: genGeometric,
    genExponential: genExponential,
    computeArray: computeArray,
    rowStats: rowStats,
    parityClass: parityClass,
    magnitudeIndex: magnitudeIndex,
    leftDiagonal: leftDiagonal,
    gilbreathStatus: gilbreathStatus,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = Gilbreath;
  else root.Gilbreath = Gilbreath;
})(typeof window !== "undefined" ? window : this);
