/* jacobian.js — DOM-free core for the Jacobian-counterexample visualizer.
 *
 * Visualizes the 3-fold  X = { (a,b,c,d,e) : Res(L,Q) = 1,  ad + bc = 1 }  from Tao's digestion of the
 * Alpoge–Fable counterexample to the (complex) Jacobian conjecture. On X:
 *   L(s,t) = a s + b t        (Sym^1, coefficients a,b)
 *   Q(s,t) = c s^2 + d s t + e t^2   (Sym^2, coefficients c,d,e)
 *   F(L,Q) = L·Q = ac s^3 + (ad+bc) s^2 t + (ae+bd) s t^2 + be t^3   (Sym^3; the s^2 t coeff is 1 on X)
 *   Res(L,Q) = a^2 e - a b d + b^2 c   (= 1 on X)
 * Form variables are (s,t); the COORDINATE z is a different object (hence the (s,t) naming).
 *
 * (a,y,z) is the master chart — a global iso ℝ^3 → X. (a,b,c) is a derived chart, singular at a=0.
 *   b = 1 + a y
 *   c = 1 - (3/2) a y + a^2 z
 *   d = (1/2) y - a z + (3/2) a y^2 - a^2 y z
 *   e = -2 z + 4 y^2 - 4 a y z + 3 a y^3 - 2 a^2 y^2 z
 * Inverse (needs a≠0):  y = (b-1)/a,  z = (c - 1 + (3/2)(b-1)) / a^2.
 * At a=0 the (a,b,c) chart collapses (b=c=1 forced), and (y,z) ↔ (d,e) via y=2d, z=8d^2 - e/2.
 */
(function (root) {
  'use strict';

  // ---------- master chart: (a,y,z) → full state ----------
  function fromAYZ(a, y, z) {
    var b = 1 + a * y;
    var c = 1 - 1.5 * a * y + a * a * z;
    var d = 0.5 * y - a * z + 1.5 * a * y * y - a * a * y * z;
    var e = -2 * z + 4 * y * y - 4 * a * y * z + 3 * a * y * y * y - 2 * a * a * y * y * z;
    return build(a, y, z, b, c, d, e);
  }

  function build(a, y, z, b, c, d, e) {
    return {
      a: a, y: y, z: z, b: b, c: c, d: d, e: e,
      L: { a: a, b: b },
      Q: { c: c, d: d, e: e },
      // F(L,Q) = L·Q, coefficients of s^3, s^2 t, s t^2, t^3 (index 1 is pinned to 1 on X)
      cubic: [a * c, a * d + b * c, a * e + b * d, b * e],
      res: a * a * e - a * b * d + b * b * c,
      rootL: rootOfL(a, b),
      rootsQ: rootsOfQ(c, d, e)
    };
  }

  // ---------- roots (as s/t on the projective line; may be the point at infinity or complex) ----------
  // L = a s + b t  ⟹  s/t = -b/a  (∞ when a = 0)
  function rootOfL(a, b) {
    return a === 0 ? { inf: true } : { inf: false, re: -b / a, im: 0 };
  }

  // Q = c s^2 + d s t + e t^2, roots in s/t. Real inputs, so roots are real or a conjugate pair.
  function rootsOfQ(c, d, e) {
    if (c === 0) {                                   // Q = t (d s + e t): one finite root, one at ∞
      if (d === 0) return [{ inf: true }, { inf: true }];   // Q = e t^2: double root at ∞
      return [{ inf: false, re: -e / d, im: 0 }, { inf: true }];
    }
    var disc = d * d - 4 * c * e;
    if (disc >= 0) {
      var r = Math.sqrt(disc);
      return [{ inf: false, re: (-d + r) / (2 * c), im: 0 },
              { inf: false, re: (-d - r) / (2 * c), im: 0 }];
    }
    var reP = -d / (2 * c), im = Math.sqrt(-disc) / (2 * c);
    return [{ inf: false, re: reP, im: Math.abs(im) },
            { inf: false, re: reP, im: -Math.abs(im) }];
  }

  // ---------- (a,b,c) chart, and the six field edits (each returns a fresh master state) ----------
  // Editing b or c holds a and the other of {b,c}; needs a ≠ 0 (undefined at the singular fibre).
  function editB(st, b) {
    if (st.a === 0) return { ok: false, reason: 'b is forced to 1 when a = 0' };
    var y = (b - 1) / st.a;
    var z = (st.c - 1 + 1.5 * (b - 1)) / (st.a * st.a);
    return { ok: true, state: fromAYZ(st.a, y, z) };
  }
  function editC(st, c) {
    if (st.a === 0) return { ok: false, reason: 'c is forced to 1 when a = 0' };
    var y = (st.b - 1) / st.a;
    var z = (c - 1 + 1.5 * (st.b - 1)) / (st.a * st.a);
    return { ok: true, state: fromAYZ(st.a, y, z) };
  }
  // Editing a in the (a,b,c) group holds b,c — EXCEPT at a=0, where the chart is singular: there we
  // apply Tao's rule (snap b=c=1, keep the current d,e), which pins the master coords uniquely.
  function editAabc(st, a) {
    if (a === 0) {
      var y0 = 2 * st.d, z0 = 8 * st.d * st.d - st.e / 2;
      return { ok: true, state: fromAYZ(0, y0, z0), snapped: true };
    }
    var y = (st.b - 1) / a;
    var z = (st.c - 1 + 1.5 * (st.b - 1)) / (a * a);
    return { ok: true, state: fromAYZ(a, y, z) };
  }
  // Editing a,y,z in the master group just holds the other two.
  function editAyz(st, a) { return { ok: true, state: fromAYZ(a, st.y, st.z) }; }
  function editY(st, y) { return { ok: true, state: fromAYZ(st.a, y, st.z) }; }
  function editZ(st, z) { return { ok: true, state: fromAYZ(st.a, st.y, z) }; }

  // convenience: build directly from an (a,b,c) triple (a ≠ 0), used for tests / deep-links
  function fromABC(a, b, c) {
    var y = (b - 1) / a, z = (c - 1 + 1.5 * (b - 1)) / (a * a);
    return fromAYZ(a, y, z);
  }

  // ---------- plot data: L, Q and L·Q as functions of x = s/t (the affine chart t = 1) ----------
  // L(x) = a x + b (a line), Q(x) = c x^2 + d x + e (a parabola), and their product (a cubic). Their real
  // x-crossings are the real roots: L·Q crosses exactly where L or Q does, which is the factorization story.
  function evalL(st, x) { return st.a * x + st.b; }
  function evalQ(st, x) { return st.c * x * x + st.d * x + st.e; }
  function plotData(st, opts) {
    opts = opts || {};
    var show = opts.show || {}, sL = show.L !== false, sQ = show.Q !== false, sLQ = show.LQ !== false;
    var withCplx = opts.complex !== false, N = opts.samples || 240;
    // x-range contains L's real root and Q's roots — a complex root contributes its real part (its position
    // in the s/t-plane) when the complex layer is shown, so the conjugate pair is horizontally in view
    var reals = [];
    if (!st.rootL.inf) reals.push(st.rootL.re);
    st.rootsQ.forEach(function (r) {
      if (r.inf) return;
      if (Math.abs(r.im) < 1e-9) reals.push(r.re);
      else if (withCplx) reals.push(r.re);
    });
    var lo = -4, hi = 4;
    if (reals.length) {
      var mn = Math.min.apply(null, reals), mx = Math.max.apply(null, reals);
      var pad = Math.max(1.5, (mx - mn) * 0.4);
      lo = mn - pad; hi = mx + pad;
      if (hi - lo < 4) { var mid = (lo + hi) / 2; lo = mid - 2; hi = mid + 2; }
    }
    var L = [], Q = [], LQ = [], mags = [];
    for (var i = 0; i <= N; i++) {
      var x = lo + (hi - lo) * i / N;
      var yl = evalL(st, x), yq = evalQ(st, x), ylq = yl * yq;
      L.push([x, yl]); Q.push([x, yq]); LQ.push([x, ylq]);
      if (sL) mags.push(Math.abs(yl));       // only the shown curves set the vertical scale, so hiding the
      if (sQ) mags.push(Math.abs(yq));       // cubic zooms in on the line and parabola
      if (sLQ) mags.push(Math.abs(ylq));
    }
    mags.sort(function (p, q) { return p - q; });
    var yMax = mags.length ? Math.min(Math.max(mags[Math.floor(mags.length * 0.8)], 2), 50) : 4;
    return {
      xr: [lo, hi], yr: [-yMax, yMax], L: L, Q: Q, LQ: LQ,
      rootL: st.rootL.inf ? null : st.rootL.re,
      rootsQreal: st.rootsQ.filter(function (r) { return !r.inf && Math.abs(r.im) < 1e-9; }).map(function (r) { return r.re; }),
      rootsQcomplex: st.rootsQ.filter(function (r) { return !r.inf && Math.abs(r.im) >= 1e-9; }).map(function (r) { return { re: r.re, im: r.im }; })
    };
  }

  // ---------- real roots of the cubic L·Q, and how many ways it factors over ℝ ----------
  // L always contributes one real (projective) root; Q contributes two when its discriminant is ≥ 0. So the
  // cubic has 3 real roots (⟹ 3 real factorizations L·Q, the non-injective regime) or 1 (Q complex).
  function realRootInfo(st) {
    var roots = [st.rootL.inf ? { inf: true, from: 'L' } : { re: st.rootL.re, from: 'L' }];
    st.rootsQ.forEach(function (r, i) { if (!r.inf && Math.abs(r.im) < 1e-9) roots.push({ re: r.re, from: 'Q', qIdx: i }); });
    var vals = roots.map(function (r) { return r.inf ? Infinity : r.re; });
    var nDistinct = vals.filter(function (v, i) { return vals.findIndex(function (u) { return u === v || Math.abs(u - v) < 1e-6; }) === i; }).length;
    return { roots: roots, nReal: roots.length, nDistinct: nDistinct, qComplex: st.rootsQ.some(function (r) { return Math.abs(r.im) > 1e-9; }) };
  }

  // ---------- Stage 2: re-factor the same cubic, promoting a real root of Q to be L's root ----------
  // The cubic L·Q is fixed; its three real roots are rL (L's) and Q's two. Choosing a different root as the
  // linear factor gives another point of X with the SAME product — the multiplication map's non-injectivity,
  // made a click. The Res=1 normalisation fixes the scaling uniquely: a' = 1 / (C3·(rL−r1)(r2−r1)).
  function swapRootIntoL(st, qIdx) {
    if (st.a === 0) return { ok: false, reason: 'L is at infinity (a = 0); nothing to swap' };
    var rq = st.rootsQ;
    if (rq.length !== 2 || rq.some(function (r) { return r.inf || Math.abs(r.im) > 1e-9; }))
      return { ok: false, reason: 'Q has no two real roots to swap' };
    var rL = -st.b / st.a, r1 = rq[qIdx].re, r2 = rq[1 - qIdx].re, C3 = st.cubic[0];
    var denom = C3 * (rL - r1) * (r2 - r1);
    if (Math.abs(denom) < 1e-9) return { ok: false, reason: 'roots too close together to swap stably' };
    var ap = 1 / denom, bp = -ap * r1, cp = C3 / ap;
    return { ok: true, state: fromABC(ap, bp, cp) };
  }

  var API = {
    fromAYZ: fromAYZ, fromABC: fromABC, rootOfL: rootOfL, rootsQ: rootsOfQ,
    editAyz: editAyz, editY: editY, editZ: editZ,
    editAabc: editAabc, editB: editB, editC: editC,
    evalL: evalL, evalQ: evalQ, plotData: plotData,
    realRootInfo: realRootInfo, swapRootIntoL: swapRootIntoL
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  root.Jacobian = API;
})(typeof globalThis !== 'undefined' ? globalThis : this);
