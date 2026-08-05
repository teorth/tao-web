/* Bézout's-theorem visualizer — exact-arithmetic core (DOM-free).
 *
 * Two integer-coefficient plane curves f(x,y)=0, g(x,y)=0 of degree <= 3. Over the projective
 * plane P^2(C), Bézout: sum of intersection multiplicities = (deg f)(deg g), counting points at
 * infinity and complex points. This module computes, using EXACT rational (BigInt) arithmetic:
 *   - each curve's actual total degree (leading coeffs may be zero);
 *   - whether the two curves share a common component (infinitely many intersections);
 *   - all RATIONAL affine intersections and all RATIONAL points at infinity, each with its exact
 *     local intersection multiplicity (Fulton's algorithm);
 *   - a Bézout tally: total = (accounted rational mult) + (remaining), the remainder being the
 *     irrational-real / complex intersections that cannot be placed on the real grid.
 * Floating point is used ONLY for drawing (contouring, marker placement) — never for multiplicity.
 *
 * Exposed as window.Bezout and module.exports. Multiplicity is a discrete invariant that floating
 * point destroys (a genuine tangency vs. two near-misses), which is why the arithmetic is exact.
 * The field is isolated in the rational layer so an F_p mode could later replace it.
 */
(function (root) {
  'use strict';

  // ---------- exact rationals over BigInt: {n, d}, d>0, gcd(n,d)=1 ----------
  function bgcd(a, b) { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) { var t = a % b; a = b; b = t; } return a; }
  function R(n, d) {
    n = BigInt(n); d = d === undefined ? 1n : BigInt(d);
    if (d === 0n) throw new Error('zero denominator');
    if (d < 0n) { n = -n; d = -d; }
    var g = bgcd(n, d); if (g === 0n) g = 1n;
    return { n: n / g, d: d / g };
  }
  var R0 = R(0n), R1 = R(1n);
  function rIsZero(a) { return a.n === 0n; }
  function rAdd(a, b) { return R(a.n * b.d + b.n * a.d, a.d * b.d); }
  function rSub(a, b) { return R(a.n * b.d - b.n * a.d, a.d * b.d); }
  function rMul(a, b) { return R(a.n * b.n, a.d * b.d); }
  function rDiv(a, b) { if (b.n === 0n) throw new Error('rational div by 0'); return R(a.n * b.d, a.d * b.n); }
  function rNeg(a) { return { n: -a.n, d: a.d }; }
  function rEq(a, b) { return a.n === b.n && a.d === b.d; }
  function rSign(a) { return a.n > 0n ? 1 : (a.n < 0n ? -1 : 0); }
  function rToNumber(a) { return Number(a.n) / Number(a.d); }
  function rToString(a) { return a.d === 1n ? a.n.toString() : a.n.toString() + '/' + a.d.toString(); }

  // ---------- univariate polynomials over Q: array of R, index = degree (trailing zeros trimmed) ----------
  function upTrim(p) { var k = p.length; while (k > 0 && rIsZero(p[k - 1])) k--; return p.slice(0, k); }
  function upIsZero(p) { return p.length === 0; }
  function upDeg(p) { return p.length - 1; }               // -1 for the zero polynomial
  function upLead(p) { return p[p.length - 1]; }
  function upConst(r) { return rIsZero(r) ? [] : [r]; }
  function upAdd(a, b) { var n = Math.max(a.length, b.length), r = []; for (var i = 0; i < n; i++) r.push(rAdd(a[i] || R0, b[i] || R0)); return upTrim(r); }
  function upSub(a, b) { var n = Math.max(a.length, b.length), r = []; for (var i = 0; i < n; i++) r.push(rSub(a[i] || R0, b[i] || R0)); return upTrim(r); }
  function upScale(a, s) { if (rIsZero(s)) return []; return a.map(function (c) { return rMul(c, s); }); }
  function upMul(a, b) { if (!a.length || !b.length) return []; var r = new Array(a.length + b.length - 1).fill(R0); for (var i = 0; i < a.length; i++) for (var j = 0; j < b.length; j++) r[i + j] = rAdd(r[i + j], rMul(a[i], b[j])); return upTrim(r); }
  function upShift(a, k) { if (!a.length) return []; var r = new Array(k).fill(R0); return r.concat(a); }   // multiply by x^k
  function upEval(a, x) { var s = R0; for (var i = a.length - 1; i >= 0; i--) s = rAdd(rMul(s, x), a[i]); return s; }
  function upEvalNum(a, x) { var s = 0; for (var i = a.length - 1; i >= 0; i--) s = s * x + rToNumber(a[i]); return s; }
  function upOrd0(a) { for (var i = 0; i < a.length; i++) if (!rIsZero(a[i])) return i; return Infinity; }   // x-adic valuation
  // exact division a = q*b + r; returns {q, r}
  function upDivMod(a, b) {
    if (upIsZero(b)) throw new Error('divide by zero polynomial');
    var q = [], r = a.slice();
    while (r.length >= b.length && r.length > 0) {
      var c = rDiv(upLead(r), upLead(b)), k = r.length - b.length;
      q[k] = c;
      r = upSub(r, upShift(upScale(b, c), k));
    }
    for (var i = 0; i < q.length; i++) if (q[i] === undefined) q[i] = R0;
    return { q: upTrim(q), r: upTrim(r) };
  }
  function upGCD(a, b) {   // monic gcd over Q (or [] if both zero)
    a = a.slice(); b = b.slice();
    while (!upIsZero(b)) { var r = upDivMod(a, b).r; a = b; b = r; }
    if (upIsZero(a)) return [];
    return upScale(a, rDiv(R1, upLead(a)));   // make monic
  }
  // rational roots of a univariate poly over Q (distinct), via the rational root theorem
  function upRationalRoots(p) {
    p = upTrim(p); if (p.length <= 1) return [];       // constant (or zero): nothing to enumerate
    var roots = [], v = upOrd0(p);
    if (v > 0) { roots.push(R0); p = upTrim(p.slice(v)); }   // factor out x^v so x=0 is handled and a0 != 0
    if (p.length <= 1) return roots;
    // clear denominators -> integer coeffs, drop content
    var den = 1n; for (var i = 0; i < p.length; i++) den = den / bgcd(den, p[i].d) * p[i].d;
    var ic = p.map(function (c) { return c.n * (den / c.d); });
    var g = 0n; for (var i = 0; i < ic.length; i++) g = bgcd(g, ic[i]); if (g === 0n) g = 1n;
    ic = ic.map(function (val) { return val / g; });
    var a0 = ic[0], an = ic[ic.length - 1];            // a0 != 0 now
    var P = divisors(a0 < 0n ? -a0 : a0), Q = divisors(an < 0n ? -an : an);
    for (var pi = 0; pi < P.length; pi++) for (var qi = 0; qi < Q.length; qi++) {
      for (var s = -1; s <= 1; s += 2) {
        var cand = R(BigInt(s) * P[pi], Q[qi]);
        if (rIsZero(upEval(p, cand))) pushUniqueR(roots, cand);
      }
    }
    return roots;
  }
  function divisors(n) { if (n === 0n) return []; var d = []; for (var i = 1n; i * i <= n; i++) if (n % i === 0n) { d.push(i); if (i * i !== n) d.push(n / i); } return d; }
  function pushUniqueR(arr, r) { for (var i = 0; i < arr.length; i++) if (rEq(arr[i], r)) return; arr.push(r); }

  // ---------- bivariate polynomials over Q: { 'i,j': R } with i = x-degree, j = y-degree ----------
  function bpNew() { return {}; }
  function bpKey(i, j) { return i + ',' + j; }
  function bpFromTerms(terms) {   // terms: [[i,j, R-or-int], ...]
    var p = {};
    for (var k = 0; k < terms.length; k++) {
      var i = terms[k][0], j = terms[k][1], c = terms[k][2];
      if (typeof c === 'bigint' || typeof c === 'number') c = R(c);
      bpAddTerm(p, i, j, c);
    }
    return p;
  }
  function bpAddTerm(p, i, j, c) { var K = bpKey(i, j), cur = p[K] ? rAdd(p[K], c) : c; if (rIsZero(cur)) delete p[K]; else p[K] = cur; }
  function bpClone(p) { var q = {}; for (var K in p) q[K] = p[K]; return q; }
  function bpIsZero(p) { for (var K in p) return false; return true; }
  function bpEach(p, fn) { for (var K in p) { var ij = K.split(','); fn(+ij[0], +ij[1], p[K]); } }
  function bpTotalDeg(p) { var d = -1; bpEach(p, function (i, j) { if (i + j > d) d = i + j; }); return d; }
  function bpDegY(p) { var d = -1; bpEach(p, function (i, j) { if (j > d) d = j; }); return d; }
  function bpDegX(p) { var d = -1; bpEach(p, function (i, j) { if (i > d) d = i; }); return d; }
  function bpAdd(a, b) { var p = bpClone(a); bpEach(b, function (i, j, c) { bpAddTerm(p, i, j, c); }); return p; }
  function bpSub(a, b) { var p = bpClone(a); bpEach(b, function (i, j, c) { bpAddTerm(p, i, j, rNeg(c)); }); return p; }
  function bpScale(a, s) { var p = {}; bpEach(a, function (i, j, c) { var v = rMul(c, s); if (!rIsZero(v)) p[bpKey(i, j)] = v; }); return p; }
  function bpMulMono(a, di, dj, s) { var p = {}; bpEach(a, function (i, j, c) { var v = rMul(c, s); if (!rIsZero(v)) p[bpKey(i + di, j + dj)] = v; }); return p; }
  function bpMul(a, b) { var p = {}; bpEach(a, function (i1, j1, c1) { bpEach(b, function (i2, j2, c2) { bpAddTerm(p, i1 + i2, j1 + j2, rMul(c1, c2)); }); }); return p; }
  function bpRestrictY0(p) { var u = []; bpEach(p, function (i, j, c) { if (j === 0) u[i] = c; }); for (var i = 0; i < u.length; i++) if (u[i] === undefined) u[i] = R0; return upTrim(u); }   // f(x,0) as UPoly(x)
  function bpDivY(p) { var q = {}; bpEach(p, function (i, j, c) { q[bpKey(i, j - 1)] = c; }); return q; }   // assumes y | p
  function bpMinYdeg(p) { var m = Infinity; bpEach(p, function (i, j) { if (j < m) m = j; }); return m; }
  function bpEvalNum(p, x, y) { var s = 0; bpEach(p, function (i, j, c) { s += rToNumber(c) * Math.pow(x, i) * Math.pow(y, j); }); return s; }
  function bpLeadingForm(p) { var d = bpTotalDeg(p), q = {}; bpEach(p, function (i, j, c) { if (i + j === d) q[bpKey(i, j)] = c; }); return q; }
  // substitute x -> x+a, y -> y+b (a,b rational): translate the point (a,b) to the origin
  function bpTranslate(p, a, b) {
    var out = {};
    bpEach(p, function (i, j, c) {
      var xi = binomExpand(a, i), yj = binomExpand(b, j);   // (x+a)^i and (y+b)^j as UPoly
      for (var s = 0; s < xi.length; s++) if (!rIsZero(xi[s])) for (var t = 0; t < yj.length; t++) if (!rIsZero(yj[t])) bpAddTerm(out, s, t, rMul(c, rMul(xi[s], yj[t])));
    });
    return out;
  }
  function binomExpand(a, n) {   // (var + a)^n as UPoly in var
    var r = [R1];
    for (var k = 0; k < n; k++) r = upAdd(upShift(r, 1), upScale(r, a));   // multiply by (var + a)
    return r;
  }

  // ---------- resultant Res_y(f,g) in Q[x] (Sylvester determinant over Q[x]) ----------
  function coeffsInY(p) {   // -> array indexed by j, each a UPoly(x)
    var dy = bpDegY(p), a = []; for (var j = 0; j <= dy; j++) a[j] = [];
    bpEach(p, function (i, j, c) { var u = a[j]; while (u.length <= i) u.push(R0); u[i] = c; });
    for (var j = 0; j <= dy; j++) a[j] = upTrim(a[j]);
    return a;   // a[j] = coefficient of y^j
  }
  function resultantY(f, g) {
    var m = bpDegY(f), n = bpDegY(g);
    if (m < 0 || n < 0) return [];
    var F = coeffsInY(f), G = coeffsInY(g), N = m + n, M = [];
    for (var r = 0; r < N; r++) { M[r] = []; for (var c = 0; c < N; c++) M[r][c] = []; }
    for (var r = 0; r < n; r++) for (var j = 0; j <= m; j++) M[r][r + (m - j)] = F[j] || [];   // shifted rows of f
    for (var r = 0; r < m; r++) for (var j = 0; j <= n; j++) M[n + r][r + (n - j)] = G[j] || [];  // shifted rows of g
    return detUP(M);
  }
  function detUP(M) { return M.length === 0 ? [R1] : goSigned(M, M.length); }
  function goSigned(M, n) {   // straightforward Laplace along row 0 recursively (n<=6)
    if (n === 1) return M[0][0];
    var acc = [], sgn = 1;
    for (var c = 0; c < n; c++) {
      var e = M[0][c];
      if (!upIsZero(e)) {
        var minor = [];
        for (var r = 1; r < n; r++) { var row = []; for (var cc = 0; cc < n; cc++) if (cc !== c) row.push(M[r][cc]); minor.push(row); }
        var term = upMul(e, goSigned(minor, n - 1));
        acc = sgn > 0 ? upAdd(acc, term) : upSub(acc, term);
      }
      sgn = -sgn;
    }
    return acc;
  }

  function swapXY(p) { var q = {}; bpEach(p, function (i, j, c) { q[bpKey(j, i)] = c; }); return q; }
  function resultantX(f, g) { return resultantY(swapXY(f), swapXY(g)); }
  // f,g share a common component  <=>  Res_y = 0 (common factor of positive y-degree) or Res_x = 0 (positive x-degree)
  function haveCommonComponent(f, g) { return upIsZero(resultantY(f, g)) || upIsZero(resultantX(f, g)); }

  // ---------- bivariate gcd over Q (for DRAWING the shared component); Euclid in Q(x)[y] + content ----------
  function fromCoeffsInY(F) { var p = {}; for (var j = 0; j < F.length; j++) for (var i = 0; i < F[j].length; i++) if (F[j][i] && !rIsZero(F[j][i])) p[bpKey(i, j)] = F[j][i]; return p; }
  // rational functions over Q(x): {num, den} reduced, den monic
  function rf(num, den) { den = den || [R1]; if (upIsZero(num)) return { num: [], den: [R1] }; var g = upGCD(num, den); num = upDivMod(num, g).q; den = upDivMod(den, g).q; var lc = upLead(den); return { num: upScale(num, rDiv(R1, lc)), den: upScale(den, rDiv(R1, lc)) }; }
  function rfZero() { return { num: [], den: [R1] }; }
  function rfIsZero(a) { return upIsZero(a.num); }
  function rfSub(a, b) { return rf(upSub(upMul(a.num, b.den), upMul(b.num, a.den)), upMul(a.den, b.den)); }
  function rfMul(a, b) { return rf(upMul(a.num, b.num), upMul(a.den, b.den)); }
  function rfDiv(a, b) { return rf(upMul(a.num, b.den), upMul(a.den, b.num)); }
  function prfTrim(p) { while (p.length && rfIsZero(p[p.length - 1])) p.pop(); return p; }
  function prfRem(A, B) { A = A.slice(); var b = B.length - 1, lb = B[b]; while (A.length - 1 >= b && A.length > 0) { var a = A.length - 1, c = rfDiv(A[a], lb), k = a - b; for (var j = 0; j < B.length; j++) A[k + j] = rfSub(A[k + j] || rfZero(), rfMul(B[j], c)); prfTrim(A); } return A; }
  function contentUP(C) { var g = []; for (var j = 0; j < C.length; j++) g = upGCD(g, C[j]); return g; }
  function clearPrimitive(A) {   // rf array -> primitive UPoly array (index = y-degree)
    var den = [R1]; for (var j = 0; j < A.length; j++) den = upMul(den, A[j].den);
    var C = A.map(function (rr) { return upDivMod(upMul(rr.num, den), rr.den).q; });
    var cont = contentUP(C); if (!upIsZero(cont)) C = C.map(function (u) { return upIsZero(u) ? [] : upDivMod(u, cont).q; });
    return C;
  }
  function bivariateGCD(f, g) {
    var Cf = coeffsInY(f), Cg = coeffsInY(g);
    var contF = contentUP(Cf), contG = contentUP(Cg), contGCD = upGCD(contF, contG);
    var ppF = Cf.map(function (u) { return upIsZero(u) ? rfZero() : rf(upDivMod(u, contF).q, [R1]); });
    var ppG = Cg.map(function (u) { return upIsZero(u) ? rfZero() : rf(upDivMod(u, contG).q, [R1]); });
    var A = prfTrim(ppF), Bp = prfTrim(ppG);
    if (Bp.length > A.length) { var t = A; A = Bp; Bp = t; }
    while (Bp.length > 0) { var Rr = prfRem(A, Bp); A = Bp; Bp = prfTrim(Rr); }
    var ppGCD = A.length ? clearPrimitive(A) : [[R1]];
    var C = ppGCD.map(function (u) { return upMul(u, contGCD); });
    return fromCoeffsInY(C);
  }

  // ---------- Fulton's algorithm: local intersection multiplicity at the ORIGIN ----------
  function fultonOrigin(F, G, depth) {
    depth = depth || 0;
    if (depth > 200) throw new Error('Fulton recursion runaway');
    var f0 = bpRestrictY0(F), g0 = bpRestrictY0(G);
    // if either does not vanish at origin, the point is not on that curve
    if (!bpVanishesAtOrigin(F) || !bpVanishesAtOrigin(G)) return 0;
    var fz = upIsZero(f0), gz = upIsZero(g0);
    if (fz && gz) return Infinity;                 // y divides both -> common component through origin
    if (fz) { return upOrd0(g0) + fultonOrigin(bpDivY(F), G, depth + 1); }   // F = y*H
    if (gz) { return upOrd0(f0) + fultonOrigin(F, bpDivY(G), depth + 1); }
    var r = upDeg(f0), s = upDeg(g0);
    if (r <= s) {
      var c = rDiv(upLead(g0), upLead(f0));
      var G2 = bpSub(G, bpMulMono(F, s - r, 0, c));   // G <- G - c x^{s-r} F  (kills lead of g0)
      return fultonOrigin(F, G2, depth + 1);
    } else {
      var c2 = rDiv(upLead(f0), upLead(g0));
      var F2 = bpSub(F, bpMulMono(G, r - s, 0, c2));
      return fultonOrigin(F2, G, depth + 1);
    }
  }
  function bpVanishesAtOrigin(p) { return !p[bpKey(0, 0)]; }   // no constant term

  // multiplicity of the intersection of f,g at the rational affine point (x0,y0)
  function affineMult(f, g, x0, y0) { return fultonOrigin(bpTranslate(f, x0, y0), bpTranslate(g, x0, y0), 0); }

  // ---------- assemble: rational affine intersections + rational points at infinity ----------
  function affineRationalIntersections(f, g) {
    var res = resultantY(f, g);
    var out = [];
    if (upIsZero(res)) return out;   // common component (handled separately)
    var xs = upRationalRoots(res);
    // also x-values where the y-leading coefficients of BOTH drop (roots shared by content) are covered by resultant; keep simple
    for (var k = 0; k < xs.length; k++) {
      var x0 = xs[k];
      var fy = restrictX(f, x0), gy = restrictX(g, x0);   // UPoly in y
      var gg = upGCD(fy, gy);
      var ys = upRationalRoots(gg);
      for (var m = 0; m < ys.length; m++) {
        var y0 = ys[m];
        var mult = affineMult(f, g, x0, y0);
        out.push({ x: x0, y: y0, mult: mult });
      }
    }
    return out;
  }
  function restrictX(p, x0) {   // substitute x = x0 (rational) -> UPoly in y
    var u = []; bpEach(p, function (i, j, c) { var v = rMul(c, rPow(x0, i)); while (u.length <= j) u.push(R0); u[j] = rAdd(u[j], v); });
    return upTrim(u);
  }
  function rPow(a, n) { var r = R1; for (var k = 0; k < n; k++) r = rMul(r, a); return r; }

  // rational points at infinity: common roots of the two leading binary forms on Z=0
  function infinityRationalIntersections(f, g) {
    var out = [];
    var Ff = leadingBinary(f), Gg = leadingBinary(g);   // homogeneous forms in X,Y (as {deg->pairs}); use dehomogenized slope polys
    // direction [1:t:0] (finite slope t): roots of f_d(1,t) and g_e(1,t)
    var ft = binaryAtX1(f), gt = binaryAtX1(g);         // UPoly in t
    var common = upGCD(ft, gt);
    var ts = upRationalRoots(common);
    for (var k = 0; k < ts.length; k++) {
      var t = ts[k];
      var mult = infinityMult(f, g, R1, t);             // chart X=1
      out.push({ dir: [R1, t], mult: mult });
    }
    // direction [0:1:0] (vertical): does Y^d divide-check, i.e. f_d(0,1)=0 and g_e(0,1)=0
    if (rIsZero(binaryAtY1const(f)) && rIsZero(binaryAtY1const(g))) {
      var mult2 = infinityMult(f, g, R0, R1);           // chart Y=1
      out.push({ dir: [R0, R1], mult: mult2 });
    }
    return out;
  }
  function leadingBinary() { return null; }   // (kept for clarity; the slope polys below are what we use)
  function binaryAtX1(p) {   // f_d(1,t): substitute X=1,Y=t into the top-degree form -> UPoly in t
    var d = bpTotalDeg(p), u = [];
    bpEach(p, function (i, j, c) { if (i + j === d) { while (u.length <= j) u.push(R0); u[j] = rAdd(u[j], c); } });
    return upTrim(u);
  }
  function binaryAtY1const(p) {   // coefficient of the pure-Y^d term of the leading form (i.e. f_d(0,1))
    var d = bpTotalDeg(p), c = R0; bpEach(p, function (i, j, cc) { if (j === d && i === 0) c = cc; }); return c;
  }
  // multiplicity at infinity in the direction [X0:Y0:0]; work in the chart where that coord is 1
  function infinityMult(f, g, X0, Y0) {
    // homogenize to F(X,Y,Z), G, then dehomogenize in a chart and translate the point to origin.
    var df = bpTotalDeg(f), dg = bpTotalDeg(g);
    if (!rIsZero(X0)) {   // chart X=1: coords (u,v) = (Y, Z); point is (Y0, 0)
      var Fc = dehomogChartX(f, df), Gc = dehomogChartX(g, dg);
      return fultonOrigin(bpTranslate(Fc, Y0, R0), bpTranslate(Gc, Y0, R0), 0);
    } else {              // chart Y=1: coords (u,v) = (X, Z); point is (X0=0, 0) = origin already
      var Fc2 = dehomogChartY(f, df), Gc2 = dehomogChartY(g, dg);
      return fultonOrigin(Fc2, Gc2, 0);
    }
  }
  // F(1, u, v) where F is the degree-d homogenization of f: term c x^i y^j -> c u^j v^{d-i-j}
  function dehomogChartX(f, d) { var p = {}; bpEach(f, function (i, j, c) { bpAddTerm(p, j, d - i - j, c); }); return p; }
  // F(u, 1, v): term c x^i y^j -> c u^i v^{d-i-j}
  function dehomogChartY(f, d) { var p = {}; bpEach(f, function (i, j, c) { bpAddTerm(p, i, d - i - j, c); }); return p; }

  // ---------- top-level analysis ----------
  function toBP(x) { return Array.isArray(x) ? bpFromTerms(x) : x; }   // accept a terms-array or a BP object
  function analyze(fIn, gIn) {
    var f = toBP(fIn), g = toBP(gIn);
    var degF = bpTotalDeg(f), degG = bpTotalDeg(g);
    var res = { degF: degF, degG: degG, zeroF: degF < 0, zeroG: degG < 0, total: null,
                commonComponent: false, gcd: null, affine: [], infinity: [], accounted: 0, remaining: null };
    if (degF < 0 || degG < 0) return res;                 // a zero "curve" is not a curve
    if (haveCommonComponent(f, g)) { res.commonComponent = true; res.gcd = bivariateGCD(f, g); return res; }
    res.total = degF * degG;
    res.affine = affineRationalIntersections(f, g);
    res.infinity = infinityRationalIntersections(f, g);
    var acc = 0;
    res.affine.forEach(function (p) { acc += p.mult; });
    res.infinity.forEach(function (p) { acc += p.mult; });
    res.accounted = acc;
    res.remaining = res.total - acc;                      // irrational-real + complex, listed but not drawn
    return res;
  }

  var API = {
    R: R, rToNumber: rToNumber, rToString: rToString, rEq: rEq, rIsZero: rIsZero,
    bpFromTerms: bpFromTerms, bpTotalDeg: bpTotalDeg, bpEvalNum: bpEvalNum, bpEach: bpEach, bpIsZero: bpIsZero,
    resultantY: resultantY, bivariateGCD: bivariateGCD, upRationalRoots: upRationalRoots, upGCD: upGCD,
    affineMult: affineMult, fultonOrigin: fultonOrigin, bpTranslate: bpTranslate,
    affineRationalIntersections: affineRationalIntersections, infinityRationalIntersections: infinityRationalIntersections,
    analyze: analyze
  };
  root.Bezout = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof self !== 'undefined' ? self : this);
