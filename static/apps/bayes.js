/* bayes.js — DOM-free core for the Bayesian probability worksheet.
 *
 * The engine is odds-based: posterior odds = prior odds × likelihood ratio, and
 * posterior probability = odds / (1 + odds). Every quantity is carried as an
 * INTERVAL {lo, hi} (a plain number is the point interval lo === hi), so a user
 * can enter a range for any input and see how far the conclusion moves.
 *
 * Why the interval bounds are EXACT (not conservative): the posterior probability
 * is monotone in each INDEPENDENT input — increasing in P(H1), increasing in
 * P(E|H1), decreasing in P(E|H0) — and each input appears exactly once in the
 * composed expression below, so evaluating the monotone ops at the right endpoints
 * gives the true tight range. (The trap avoided: never do interval ops on p/(1-p)
 * treating the two p's as independent; evaluate the monotone function at endpoints.)
 *
 * Exposed as window.Bayes (browser) and module.exports (node) for headless tests.
 */
(function (root) {
  'use strict';

  // ---------- interval type ----------
  function iv(lo, hi) { return { lo: lo, hi: (hi === undefined ? lo : hi) }; }
  function isPoint(x) { return x.lo === x.hi; }
  function mid(x) { return (x.lo === Infinity || x.hi === Infinity) ? x.hi : (x.lo + x.hi) / 2; }
  function clampIv(x, lo, hi) { return iv(Math.max(lo, x.lo), Math.min(hi, x.hi)); }

  // ---------- scalar helpers ----------
  function oddsOf(p) { return p >= 1 ? Infinity : p / (1 - p); }   // p/(1-p), increasing on [0,1]
  function probOf(o) { return o === Infinity ? 1 : o / (1 + o); }  // o/(1+o), increasing on [0,∞]
  function db(o) { return 10 * Math.log10(o); }                    // odds/ratio → decibans (Good/Turing)

  // ---------- monotone interval ops ----------
  function complement(p) { return iv(1 - p.hi, 1 - p.lo); }          // 1 - p            (decreasing)
  function oddsFromProb(p) { return iv(oddsOf(p.lo), oddsOf(p.hi)); } // p/(1-p)          (increasing)
  function probFromOdds(o) { return iv(probOf(o.lo), probOf(o.hi)); } // o/(1+o)          (increasing)
  function ratio(a, b) { return iv(safeDiv(a.lo, b.hi), safeDiv(a.hi, b.lo)); }   // a/b: a↑, b↓
  function product(x, y) { return iv(safeMul(x.lo, y.lo), safeMul(x.hi, y.hi)); } // x·y, both ≥0, ↑↑
  function dbIv(o) { return iv(db(o.lo), db(o.hi)); }
  function safeDiv(a, b) { return b === 0 ? (a === 0 ? NaN : Infinity) : a / b; }
  function safeMul(a, b) { return (a === 0 || b === 0) ? 0 : a * b; }              // 0·∞ ↦ 0 (a sure hypothesis stays sure)

  // ---------- input parsing ----------
  // Accepts: "0.02", "2%", "2e-2", "16:1" (odds), a range "0.03-0.07" / "0.03..0.07" /
  //   "0.03 to 0.07" / "[0.03, 0.07]", or "0.05 ± 0.02" / "0.05 +/- 0.02".
  // kind: 'prob' (validated to [0,1]) | 'odds' | 'ratio' (validated to [0,∞)).
  // Returns { ok:true, value:{lo,hi} } or { ok:false, error:"…" }.
  function parse(str, kind) {
    kind = kind || 'prob';
    var s = String(str == null ? '' : str).trim();
    if (s === '') return err('enter a value');

    // a single scalar (covers scientific notation, so a later '-' must be a range separator)
    var one = num(s, kind);
    if (one.ok) return finish(one.v, one.v, kind);

    // plus/minus form
    var pm = s.match(/^(.+?)\s*(?:±|\+\/-|\+-)\s*(.+)$/);
    if (pm) {
      var c = num(pm[1], kind), d = num(pm[2], kind);
      if (!c.ok) return c; if (!d.ok) return d;
      return finish(c.v - Math.abs(d.v), c.v + Math.abs(d.v), kind);
    }
    // range form (strip optional brackets first)
    var body = s.replace(/^\[\s*/, '').replace(/\s*\]$/, '');
    var rng = body.match(/^(.+?)\s*(?:\.\.|–|—|-|,|\bto\b)\s*(.+)$/i);
    if (rng) {
      var a = num(rng[1], kind), b = num(rng[2], kind);
      if (!a.ok) return a; if (!b.ok) return b;
      return finish(a.v, b.v, kind);
    }
    return err('could not read "' + s + '"');
  }

  function num(t, kind) {
    t = String(t).trim();
    // odds/ratio may be written "a:b"
    if ((kind === 'odds' || kind === 'ratio')) {
      var col = t.match(/^([0-9.eE+]+)\s*:\s*([0-9.eE+]+)$/);
      if (col) {
        var na = parseFloat(col[1]), nb = parseFloat(col[2]);
        if (isFinite(na) && isFinite(nb) && nb !== 0) return { ok: true, v: na / nb };
      }
    }
    var pct = false;
    if (/%$/.test(t)) { pct = true; t = t.slice(0, -1).trim(); }
    if (!/^[+]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(t)) return err('"' + t + '" is not a number');
    var v = parseFloat(t);
    if (pct) v /= 100;
    return { ok: true, v: v };
  }

  function finish(lo, hi, kind) {
    if (!(isFinite(lo) || lo === Infinity) || isNaN(lo) || isNaN(hi)) return err('not a number');
    if (lo > hi) { var t = lo; lo = hi; hi = t; }   // tolerate reversed ranges
    if (kind === 'prob') {
      if (lo < 0 || hi > 1) return err('a probability must be between 0 and 1 (or 0%–100%)');
    } else {
      if (lo < 0) return err('an odds/ratio must be ≥ 0');
    }
    return { ok: true, value: iv(lo, hi) };
  }
  function err(m) { return { ok: false, error: m }; }

  // ---------- prior views (linked: edit any one, the others follow) ----------
  // prior = { mode:'pH1'|'pH0'|'odds', value:{lo,hi} } (mode = the field the user last edited)
  function priorPH1(prior) {
    if (prior.mode === 'pH0') return complement(prior.value);
    if (prior.mode === 'odds') return probFromOdds(prior.value);
    return prior.value;                       // 'pH1'
  }
  function priorViews(prior) {
    var pH1 = priorPH1(prior);
    return { pH1: pH1, pH0: complement(pH1), odds: oddsFromProb(pH1) };
  }

  // ---------- the worksheet ----------
  // input = { prior, pE0:{lo,hi}, pE1:{lo,hi} }  (pE0 = P(E|H0), pE1 = P(E|H1))
  function compute(input) {
    var v = priorViews(input.prior);
    var LR = ratio(input.pE1, input.pE0);           // Box 9  — likelihood ratio
    var postOdds = product(v.odds, LR);             // Box 10 — posterior odds
    var postH1 = probFromOdds(postOdds);            // Box 12
    return {
      pH0: v.pH0, pH1: v.pH1,                        // Boxes 3, 4
      priorOdds: v.odds,                            // Box 5
      pE0: input.pE0, pE1: input.pE1,               // Boxes 7, 8
      LR: LR,                                       // Box 9
      postOdds: postOdds,                           // Box 10
      postH0: complement(postH1),                   // Box 11
      postH1: postH1,                               // Box 12
      // additive log-odds view (prior + evidence = posterior, in decibans)
      priorDB: dbIv(v.odds), weightDB: dbIv(LR), postDB: dbIv(postOdds)
    };
  }

  // ---------- natural-frequencies restatement (point values; base-rate-fallacy cure) ----------
  function chooseN(pH1) {                              // smallest 10^k giving ≳10 in the rarer class
    var p = Math.min(pH1, 1 - pH1); if (!(p > 0)) return 10000;
    var n = 100; while (n * p < 10 && n < 1e9) n *= 10; return n;
  }
  function naturalFreq(pH1, pE0, pE1, N) {
    N = N || chooseN(pH1);
    var nH1 = pH1 * N, nH0 = (1 - pH1) * N;
    var tp = nH1 * pE1, fn = nH1 * (1 - pE1), fp = nH0 * pE0, tn = nH0 * (1 - pE0);
    var pos = tp + fp, neg = fn + tn;
    return {
      N: N, nH1: nH1, nH0: nH0, tp: tp, fn: fn, fp: fp, tn: tn, pos: pos, neg: neg,
      ppv: pos ? tp / pos : NaN,      // P(H1|E)  — matches the odds computation
      npv: neg ? tn / neg : NaN       // P(H0|¬E)
    };
  }

  // ---------- sequential evidence (posterior odds of one update seeds the next) ----------
  // priorOdds:{lo,hi}; updates:[{pE0,pE1}, …] (conditional independence assumed)
  function chain(priorOdds, updates) {
    var odds = priorOdds, stages = [];
    for (var i = 0; i < updates.length; i++) {
      var LR = ratio(updates[i].pE1, updates[i].pE0);
      odds = product(odds, LR);
      stages.push({ LR: LR, odds: odds, prob: probFromOdds(odds), weightDB: dbIv(LR) });
    }
    return { start: priorOdds, stages: stages, finalOdds: odds, finalProb: probFromOdds(odds) };
  }

  // ---------- sensitivity: each input's own contribution to the posterior range ----------
  // holds the other inputs at their midpoints and sweeps one across its interval
  function sensitivity(input) {
    var pt = { prior: { mode: input.prior.mode, value: iv(mid(input.prior.value)) }, pE0: iv(mid(input.pE0)), pE1: iv(mid(input.pE1)) };
    function withRange(key) {
      var probe = { prior: { mode: pt.prior.mode, value: pt.prior.value }, pE0: pt.pE0, pE1: pt.pE1 };
      if (key === 'prior') probe.prior = input.prior; else probe[key] = input[key];
      return compute(probe).postH1;
    }
    var items = ['prior', 'pE0', 'pE1'].map(function (k) { var r = withRange(k); return { key: k, range: r, width: r.hi - r.lo }; });
    return { full: compute(input).postH1, nominal: compute(pt).postH1, items: items };
  }

  // ---------- formatting (pure) ----------
  function fmtNumber(x, digits) {
    if (x === Infinity) return '∞'; if (x === -Infinity) return '−∞'; if (isNaN(x)) return '—';
    digits = digits == null ? 3 : digits;
    var a = Math.abs(x), d = a === 0 ? digits : Math.max(0, Math.min(6, digits - Math.floor(Math.log10(a)) - 1));
    if (a >= 1) d = digits;                                   // keep sig-figs sensible across scales
    return (Math.round(x * Math.pow(10, d)) / Math.pow(10, d)).toString();
  }
  function fmtInterval(x, fn) { return isPoint(x) ? fn(x.lo) : fn(x.lo) + '–' + fn(x.hi); }
  function fmtProb(x, digits) { return fmtInterval(x, function (p) { return fmtNumber(p * 100, digits == null ? 3 : digits) + '%'; }); }
  function fmtOdds(x, digits) { return fmtInterval(x, function (o) { return fmtNumber(o, digits == null ? 3 : digits); }); }
  function fmtDB(x) { return fmtInterval(x, function (v) { return (v > 0 ? '+' : '') + fmtNumber(v, 3) + ' dB'; }); }

  var API = {
    iv: iv, isPoint: isPoint, mid: mid, clampIv: clampIv,
    oddsOf: oddsOf, probOf: probOf,
    complement: complement, oddsFromProb: oddsFromProb, probFromOdds: probFromOdds, ratio: ratio, product: product,
    parse: parse, priorPH1: priorPH1, priorViews: priorViews,
    compute: compute, naturalFreq: naturalFreq, chooseN: chooseN, chain: chain, sensitivity: sensitivity,
    fmtNumber: fmtNumber, fmtInterval: fmtInterval, fmtProb: fmtProb, fmtOdds: fmtOdds, fmtDB: fmtDB
  };
  root.Bayes = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
