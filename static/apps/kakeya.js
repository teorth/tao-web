// ---------------------------------------------------------------------------
// The Kakeya needle — geometry + motion core (standalone, DOM-free).
//
// Classic solutions to Kakeya's needle problem: continuously turn a unit segment
// ("the needle") inside a region. Each construction exposes at(t), t in [0,1],
// returning the needle {a,b,theta} (|a-b| = 1) as its direction theta sweeps a full
// 2*pi turn; at(0.5) is the reversed state (the 180-degree "return reversed" convention).
//
// Two motion engines:
//   * convex-chord (Pal 1921): turn the needle inside a convex region — the disk and
//     the equilateral triangle (Fujiwara, the minimal convex Kakeya set).
//   * tangent-envelope: the needle is a chord of the tangent line to a curve — the
//     deltoid (3-cusped hypocycloid), and the star/arc constructions.
// Sources: Besicovitch, Amer. Math. Monthly 70 (1963); Pal, Math. Ann. 83 (1921);
//          Cunningham–Schoenberg, Canad. J. Math. 17 (1965).
// ---------------------------------------------------------------------------

// --- vector helpers ---
function V(x, y) { return { x: x, y: y }; }
function add(p, q) { return { x: p.x + q.x, y: p.y + q.y }; }
function sub(p, q) { return { x: p.x - q.x, y: p.y - q.y }; }
function mul(p, s) { return { x: p.x * s, y: p.y * s }; }
function len(p) { return Math.hypot(p.x, p.y); }
function dist(p, q) { return len(sub(p, q)); }
function dot(p, q) { return p.x * q.x + p.y * q.y; }
// nearest intersection of the ray from P along unit u with circle (c,r), on the +/- side (sign)
function lineCircle(P, u, c, r, sign) {
  var pc = sub(P, c), b = dot(u, pc), disc = b * b - (dot(pc, pc) - r * r);
  if (disc < 0) return null;
  var sd = Math.sqrt(disc), roots = [-b + sd, -b - sd].filter(function (s) { return sign > 0 ? s > 1e-9 : s < -1e-9; });
  if (!roots.length) return null;
  roots.sort(function (x, y) { return Math.abs(x) - Math.abs(y); });
  return add(P, mul(u, roots[0]));
}
function udir(p, q) { var d = sub(q, p), L = len(d); return L ? mul(d, 1 / L) : V(0, 0); }
function ang(p) { return Math.atan2(p.y, p.x); }
function rotAbout(p, c, a) { var d = sub(p, c), co = Math.cos(a), si = Math.sin(a); return V(c.x + d.x * co - d.y * si, c.y + d.x * si + d.y * co); }
function normAngle(a) { while (a > Math.PI) a -= 2 * Math.PI; while (a <= -Math.PI) a += 2 * Math.PI; return a; }
function lerp(p, q, u) { return V(p.x + (q.x - p.x) * u, p.y + (q.y - p.y) * u); }

// intersection of line (p + s*u) with line (q + r*v); returns the point
function intersectLines(p, u, q, v) {
  var det = u.x * (-v.y) - u.y * (-v.x);
  var s = ((q.x - p.x) * (-v.y) - (q.y - p.y) * (-v.x)) / det;
  return add(p, mul(u, s));
}
// even-odd ray cast; boundary points count as inside within eps
function pointInPolygon(pt, poly, eps) {
  eps = eps || 0; var n = poly.length, inside = false, j = n - 1;
  for (var i = 0; i < n; i++) {
    var pi = poly[i], pj = poly[j];
    if (((pi.y > pt.y) !== (pj.y > pt.y)) && (pt.x < (pj.x - pi.x) * (pt.y - pi.y) / (pj.y - pi.y) + pi.x)) inside = !inside;
    j = i;
  }
  if (inside) return true;
  for (i = 0, j = n - 1; i < n; j = i++) if (distPointSeg(pt, poly[j], poly[i]) <= eps) return true;   // near the boundary
  return false;
}
function distPointSeg(p, a, b) {
  var ab = sub(b, a), t = ab.x || ab.y ? ((p.x - a.x) * ab.x + (p.y - a.y) * ab.y) / (ab.x * ab.x + ab.y * ab.y) : 0;
  t = Math.max(0, Math.min(1, t)); return dist(p, add(a, mul(ab, t)));
}
function pointInTriangle(p, a, b, c, eps) {
  eps = eps || 0;
  function s(u, v, w) { return (u.x - w.x) * (v.y - w.y) - (v.x - w.x) * (u.y - w.y); }
  var d1 = s(p, a, b), d2 = s(p, b, c), d3 = s(p, c, a);
  var neg = (d1 < -eps) || (d2 < -eps) || (d3 < -eps), pos = (d1 > eps) || (d2 > eps) || (d3 > eps);
  return !(neg && pos);
}
function circlePoly(c, r, n) { var out = []; for (var i = 0; i < n; i++) { var a = i / n * 2 * Math.PI; out.push(V(c.x + r * Math.cos(a), c.y + r * Math.sin(a))); } return out; }

// --- 1. Disk (diameter 1): spin the needle about its midpoint at the centre ---
function disk() {
  var R = 0.5, C = V(0, 0);
  return {
    name: 'disk', area: Math.PI * R * R, R: R, center: C, region: circlePoly(C, R, 240), turn: 2 * Math.PI,
    at: function (t) { var phi = t * 2 * Math.PI, d = V(Math.cos(phi), Math.sin(phi)); return { a: sub(C, mul(d, R)), b: add(C, mul(d, R)), theta: phi }; },
  };
}

// --- 2. Equilateral triangle of height 1 (Fujiwara/Pal minimal convex): pivot + slide ---
function triangle() {
  var Rc = 2 / 3;   // circumradius: height 1 => vertices at distance 2/3 from centroid
  var Vs = [V(0, Rc), V(Rc * Math.cos(7 * Math.PI / 6), Rc * Math.sin(7 * Math.PI / 6)), V(Rc * Math.cos(11 * Math.PI / 6), Rc * Math.sin(11 * Math.PI / 6))];
  var side = dist(Vs[0], Vs[1]);
  var phases = [], order = [1, 2, 0, 1, 2, 0];
  var pivot = Vs[order[0]], prevV = Vs[0];
  var free = add(pivot, mul(udir(pivot, prevV), 1));   // needle {a:pivot, b:free}, lying along an edge
  var theta = ang(sub(free, pivot));
  for (var m = 0; m < 6; m++) {
    var C = Vs[order[m]], nextV = Vs[(order[m] + 1) % 3];
    var freeEnd = add(C, mul(udir(C, nextV), 1));
    var dA = normAngle(ang(sub(freeEnd, C)) - ang(sub(free, C)));   // ~ -pi/3
    (function (C, f0, dA, th0) { phases.push({ dur: Math.abs(dA), at: function (u) { return { a: C, b: rotAbout(f0, C, dA * u) }; }, th: function (u) { return th0 + dA * u; } }); })(C, free, dA, theta);
    theta += dA; free = freeEnd;
    var trans = sub(nextV, free);
    (function (C, f0, tr, th0) { phases.push({ dur: len(tr) || 1e-9, at: function (u) { var d = mul(tr, u); return { a: add(C, d), b: add(f0, d) }; }, th: function () { return th0; } }); })(C, free, trans, theta);
    pivot = nextV; free = add(C, trans);
  }
  var total = phases.reduce(function (s, p) { return s + p.dur; }, 0);
  return {
    name: 'triangle', area: 1 / Math.sqrt(3), region: Vs.slice(), vertices: Vs.slice(), height: 1, side: side, turn: 2 * Math.PI,
    at: function (t) {
      var x = t * total, i = 0;
      while (i < phases.length - 1 && x > phases[i].dur) { x -= phases[i].dur; i++; }
      var u = Math.max(0, Math.min(1, phases[i].dur ? x / phases[i].dur : 0)), nd = phases[i].at(u);
      nd.theta = phases[i].th(u); return nd;
    },
  };
}

// --- 3. Deltoid / 3-cusped hypocycloid: the needle is the tangent chord (Cunningham–Schoenberg) ---
function deltoidPt(u) { return V(0.5 * Math.cos(u) + 0.25 * Math.cos(2 * u), 0.5 * Math.sin(u) - 0.25 * Math.sin(2 * u)); }
function deltoid() {
  var poly = []; for (var i = 0; i < 300; i++) poly.push(deltoidPt(i / 300 * 2 * Math.PI));
  return {
    name: 'deltoid', area: Math.PI / 8, region: poly, turn: 2 * Math.PI,
    // tangent at f(t0) meets the curve again at t1=-t0/2, t2=t1+pi with |f(t1)-f(t2)| = 1 exactly.
    at: function (t) { var t0 = t * 4 * Math.PI, t1 = -t0 / 2; return { a: deltoidPt(t1), b: deltoidPt(t1 + Math.PI), theta: t1 }; },
  };
}

// --- 4. Bloom–Schoenberg star 𝔄_n (Cunningham–Schoenberg, Part II): tangent to n arcs ---
// n odd; points A_i in "star" order (step pi(n-1)/n) on the unit circle; arc Γ_i from A_i to
// A_{i+1} is tangent to the radii OA_i, OA_{i+1} at those points. The needle is the tangent to Γ_i;
// its direction turns pi/n per arc (pi over one pass). Geometry verified here; the exact tangent
// chord clipped to 𝔄_n (and the contraction to a true unit needle) is finalised with the visuals.
function starBS(n) {
  n = n || 5; var step = Math.PI * (n - 1) / n, A = [], i;
  for (i = 0; i < n; i++) { var b = i * step; A.push(V(Math.cos(b), Math.sin(b))); }
  var C = [], rad = [], f0s = [], dphi = [], cum = [0];   // per-arc start angle, signed sweep (= -pi/n), cumulative
  for (i = 0; i < n; i++) {
    var Ai = A[i], Aj = A[(i + 1) % n];
    var ci = intersectLines(Ai, V(-Ai.y, Ai.x), Aj, V(-Aj.y, Aj.x));   // perpendiculars to the radii
    C.push(ci); rad.push(dist(ci, Ai));
    var f0 = ang(sub(Ai, ci)); f0s.push(f0); dphi.push(normAngle(ang(sub(Aj, ci)) - f0)); cum.push(cum[i] + dphi[i]);
  }
  var dir0 = f0s[0] + Math.PI / 2;
  function tangentAt(t) {   // t in [0,1] over the whole pass of n arcs
    var x = Math.min(0.999999, Math.max(0, t)) * n, k = Math.floor(x), v = x - k, c = C[k];
    var phi = f0s[k] + dphi[k] * v, P = add(c, mul(V(Math.cos(phi), Math.sin(phi)), rad[k]));
    return { P: P, dir: dir0 + cum[k] + dphi[k] * v, arc: k };   // dir accumulated => continuous & monotone
  }
  // the needle is the tangent line at P clipped to the two neighbouring arcs (Fig. 4: T0 on Γ_{i-1}, T1 on Γ_{i+1})
  function chordAt(tau) {
    var tg = tangentAt(tau), u = V(Math.cos(tg.dir), Math.sin(tg.dir)), k = tg.arc, km = (k - 1 + n) % n, kp = (k + 1) % n;
    return { P: tg.P, u: u, dir: tg.dir, T0: lineCircle(tg.P, u, C[km], rad[km], -1), T1: lineCircle(tg.P, u, C[kp], rad[kp], 1) };
  }
  // contract so the shortest tangent chord = 1 (turns t into a genuine unit needle)
  var lmin = Infinity;
  for (var q = 0; q <= 400; q++) { var ch = chordAt(q / 400); if (ch.T0 && ch.T1) lmin = Math.min(lmin, dist(ch.T0, ch.T1)); }
  var scale = isFinite(lmin) && lmin > 0 ? 1 / lmin : 1;
  for (i = 0; i < n; i++) { A[i] = mul(A[i], scale); C[i] = mul(C[i], scale); rad[i] *= scale; }
  function needleAt(t) {   // t in [0,1] = full 360 (two passes of the arcs); at(0.5) reversed
    var ch = chordAt((t * 2) % 1 || (t >= 1 ? 1 : 0)), mid = (ch.T0 && ch.T1) ? mul(add(ch.T0, ch.T1), 0.5) : ch.P;
    return { a: sub(mid, mul(ch.u, 0.5)), b: add(mid, mul(ch.u, 0.5)), theta: dir0 - 2 * Math.PI * t, P: ch.P, T0: ch.T0, T1: ch.T1 };
  }
  return {
    name: 'star', n: n, A: A, C: C, rad: rad, f0s: f0s, dphi: dphi, scale: scale,
    area: (5 - 2 * Math.sqrt(2)) * Math.PI / 24, turn: 2 * Math.PI, tangentAt: tangentAt, chordAt: chordAt, at: needleAt,
    arcPoint: function (k, v) { var phi = f0s[k] + dphi[k] * v; return add(C[k], mul(V(Math.cos(phi), Math.sin(phi)), rad[k])); },
  };
}

// --- Cunningham's modified star polygon (Cunningham–Schoenberg 1965, Part I §2) ---
// A star polygon S_n (n points A_i, step pi(1+n)/n, consecutive ones unit distance). The needle pivots
// about A_{k+1} while one end sweeps the boundary A_k -> B_{k+1} -> A_{k+2} (B = inner notch opposite the
// pivot), the other end tracing a conchoid lobe. 2n such motions turn it 360; area -> pi(11/12 - 2 log 3/2).
function modStarPolygon(n) {
  n = n || 5;
  var step = Math.PI * (1 + n) / n, R = 1 / (2 * Math.cos(Math.PI / (2 * n))), A = [], i;
  for (i = 0; i < n; i++) { var th = i * step; A.push(V(R * Math.cos(th), R * Math.sin(th))); }
  function Bv(i) { var p1 = A[((i - 2) % n + n) % n], p2 = A[((i - 1) % n + n) % n], p3 = A[(i + 1) % n], p4 = A[(i + 2) % n]; return intersectLines(p1, sub(p2, p1), p3, sub(p4, p3)); }   // notch opposite A_i
  var phases = [], thAcc = 0;
  function seg(piv, Ps, Pe, th0) {   // one end sweeps Ps->Pe; needle passes through piv; theta continuous
    var a0 = ang(sub(piv, Ps)), dth = normAngle(ang(sub(piv, Pe)) - a0);
    return {
      dur: Math.abs(dth) || 1e-6, endth: th0 + dth,
      at: function (v) { var Pp = lerp(Ps, Pe, v), d = udir(Pp, piv); return { a: Pp, b: add(Pp, d) }; },
      th: function (v) { return th0 + normAngle(ang(sub(piv, lerp(Ps, Pe, v))) - a0); },
    };
  }
  for (var k = 0; k < 2 * n; k++) {
    var piv = A[(k + 1) % n], Pa = A[k % n], Pb = Bv((k + 1) % n), Pc = A[(k + 2) % n];
    var s1 = seg(piv, Pa, Pb, thAcc); phases.push(s1); thAcc = s1.endth;
    var s2 = seg(piv, Pb, Pc, thAcc); phases.push(s2); thAcc = s2.endth;
  }
  var total = phases.reduce(function (s, p) { return s + p.dur; }, 0);
  var at = function (t) {
    var x = t * total, i = 0; while (i < phases.length - 1 && x > phases[i].dur) { x -= phases[i].dur; i++; }
    var u = Math.max(0, Math.min(1, phases[i].dur ? x / phases[i].dur : 0)), nd = phases[i].at(u); nd.theta = phases[i].th(u);
    if (dot(sub(nd.b, nd.a), V(Math.cos(nd.theta), Math.sin(nd.theta))) < 0) { var tmp = nd.a; nd.a = nd.b; nd.b = tmp; }
    return nd;
  };
  var region = A.slice(), chords = []; for (i = 0; i < 300; i++) { var nd = at(i / 300); region.push(nd.a); region.push(nd.b); }
  for (i = 0; i < n; i++) chords.push([A[i], A[(i + 1) % n]]);
  return { name: 'modstar', n: n, A: A, chords: chords, region: region, area: Math.PI * (11 / 12 - 2 * Math.log(3 / 2)), turn: 2 * Math.PI, at: at };
}

// --- Cunningham's modified hypocycloid (Cunningham–Schoenberg 1965, Part I §1) ---
// A segment of length 1+lambda is rolled tangent to the deltoid, with a short slide at each arc midpoint
// (which keeps the extra area to six small lobes), then the whole figure is contracted to a unit needle.
// Minimising over lambda gives area (2pi-2)/(pi+8) ≈ 0.1224*pi.
function modHypocycloid() {
  var L = (4 - Math.PI) / (4 + 2 * Math.PI), SC = 1 / (1 + L), P6 = Math.PI / 6;
  var phases = [], thAcc = 0;
  function roll(side, ta, tb, th0) {   // tangent point rolls; needle = tangent chord extended by lambda
    return {
      dur: P6, at: function (v) {
        var tau = ta + (tb - ta) * v, t1 = -tau / 2, t2 = t1 + Math.PI, lo = side === 1 ? deltoidPt(t2) : deltoidPt(t1), hi = side === 1 ? deltoidPt(t1) : deltoidPt(t2), u = sub(hi, lo);
        return { a: mul(lo, SC), b: mul(add(hi, mul(u, L)), SC) };
      }, th: function (v) { return th0 - P6 * v; }
    };
  }
  function slide(side, tau, th0) {   // slide by -lambda along the tangent line (connects the two rolls continuously)
    var t1 = -tau / 2, t2 = t1 + Math.PI, lo = side === 1 ? deltoidPt(t2) : deltoidPt(t1), hi = side === 1 ? deltoidPt(t1) : deltoidPt(t2), u = sub(hi, lo);
    return { dur: L, at: function (v) { var sh = mul(u, -L * v); return { a: mul(add(lo, sh), SC), b: mul(add(add(hi, mul(u, L)), sh), SC) }; }, th: function () { return th0; } };
  }
  for (var k = 0; k < 6; k++) {   // six cusp-intervals = two loops of the deltoid = 360; the extended (cusp) side alternates
    var c = k * 2 * Math.PI / 3, sA = k % 2 === 0 ? 1 : 2, sB = 3 - sA;
    phases.push(roll(sA, c, c + Math.PI / 3, thAcc)); thAcc -= P6;
    phases.push(slide(sA, c + Math.PI / 3, thAcc));
    phases.push(roll(sB, c + Math.PI / 3, c + 2 * Math.PI / 3, thAcc)); thAcc -= P6;
  }
  var total = phases.reduce(function (s, p) { return s + p.dur; }, 0);
  var guide = []; for (var i = 0; i < 240; i++) guide.push(mul(deltoidPt(i / 240 * 2 * Math.PI), SC));
  var at = function (t) {
    var x = t * total, i = 0; while (i < phases.length - 1 && x > phases[i].dur) { x -= phases[i].dur; i++; }
    var u = Math.max(0, Math.min(1, phases[i].dur ? x / phases[i].dur : 0)), nd = phases[i].at(u); nd.theta = phases[i].th(u);
    if (dot(sub(nd.b, nd.a), V(Math.cos(nd.theta), Math.sin(nd.theta))) < 0) { var tmp = nd.a; nd.a = nd.b; nd.b = tmp; }   // orient b-a along theta (no end-swaps)
    return nd;
  };
  var region = guide.slice(); for (i = 0; i < 200; i++) { var nd = at(i / 200); region.push(nd.a); region.push(nd.b); }   // extent incl. lobes, for framing
  return { name: 'modhypo', area: (2 * Math.PI - 2) / (Math.PI + 8), guide: guide, region: region, turn: 2 * Math.PI, at: at };
}

// --- Reuleaux triangle (constant width 1): the needle is a radius from a corner to the opposite arc ---
// Any convex region of width >= 1 admits a turning needle (Pal 1921); the Reuleaux triangle is the neat
// constant-width case — every corner-to-opposite-arc chord has length exactly 1.
function reuleaux() {
  var Rc = 1 / Math.sqrt(3);   // circumradius of a side-1 equilateral triangle
  var W = [V(0, Rc), V(Rc * Math.cos(7 * Math.PI / 6), Rc * Math.sin(7 * Math.PI / 6)), V(Rc * Math.cos(11 * Math.PI / 6), Rc * Math.sin(11 * Math.PI / 6))];
  var phases = [], order = [0, 2, 1, 0, 2, 1], acc = null;   // two passes => full 360
  order.forEach(function (k) {
    var a0 = ang(sub(W[(k + 1) % 3], W[k])), dA = normAngle(ang(sub(W[(k + 2) % 3], W[k])) - a0);   // sweep the opposite arc (radius 1 about W[k])
    if (acc === null) acc = a0;
    (function (Wk, a0, dA, th0) { phases.push({ dur: Math.abs(dA), at: function (u) { var aa = a0 + dA * u; return { a: Wk, b: add(Wk, V(Math.cos(aa), Math.sin(aa))) }; }, th: function (u) { return th0 + dA * u; } }); })(W[k], a0, dA, acc);
    acc += dA;   // chain the orientation so it is continuous across the end-swaps
  });
  var region = [];   // boundary: arc from W[k] to W[k+1] centred at W[k+2]
  for (var k = 0; k < 3; k++) {
    var c = W[(k + 2) % 3], a0 = ang(sub(W[k], c)), dA = normAngle(ang(sub(W[(k + 1) % 3], c)) - a0);
    for (var j = 0; j < 24; j++) { var aa = a0 + dA * j / 24; region.push(add(c, V(Math.cos(aa), Math.sin(aa)))); }
  }
  var total = phases.reduce(function (s, p) { return s + p.dur; }, 0);
  return {
    name: 'reuleaux', area: (Math.PI - Math.sqrt(3)) / 2, region: region, width: 1, turn: 2 * Math.PI,
    at: function (t) { var x = t * total, i = 0; while (i < phases.length - 1 && x > phases[i].dur) { x -= phases[i].dur; i++; } var u = Math.max(0, Math.min(1, phases[i].dur ? x / phases[i].dur : 0)), nd = phases[i].at(u); nd.theta = phases[i].th(u); return nd; },
  };
}

// --- Besicovitch–Perron tree + Pál joins (Besicovitch 1963): area -> 0 (multiply connected) ---
// A demonstration: 2^p elementary triangles of height 1, translated (alpha-overlap) so they overlap. The
// needle pivots a sliver in each (that sweep is the shrinking Kakeya set); between triangles it makes a Pál
// join — a detour that adds negligible area, shown here schematically. Deeper trees => smaller area.
function perronTree(p) {
  p = Math.max(2, Math.min(9, p || 5)); var N = 1 << p, alpha = Math.pow(1 / (2 * p), 1 / (2 * p - 1)), x = [], i;
  for (i = 0; i < N; i++) { var xx = 0, m = i, j2 = N / 2, aj = 1; for (var j = 0; j < p; j++) { xx += (aj / j2) * Math.floor((m + 1) / 2); aj *= alpha; j2 = Math.floor(j2 / 2); m = Math.floor(m / 2); } xx *= (alpha - 1); xx += 1 - Math.pow(alpha, p); x.push(xx); }
  function apex(k) { return V(x[k], 1); }
  function dirTo(s) { var L = Math.hypot(s, 1); return V(s / L, -1 / L); }   // from apex (x,1) toward base point (x+s, 0)
  var phases = [], E = 0.6;
  for (var k = 0; k < N; k++) {
    (function (k) {   // pivot: turn the needle across triangle k (this sweep is part of the set)
      var A = apex(k), s0 = k / N, s1 = (k + 1) / N;
      phases.push({ dur: Math.abs(Math.atan2(-1, s1) - Math.atan2(-1, s0)), at: function (v) { var s = s0 + (s1 - s0) * v, d = dirTo(s); return { a: A, b: add(A, d), theta: Math.atan2(-1, s), join: false }; } });
    })(k);
    if (k < N - 1) (function (k) {   // Pál join: detour to the next triangle (out along the line, across, back) — negligible area
      var A = apex(k), B = apex(k + 1), u = dirTo((k + 1) / N), fb = Math.atan2(-1, (k + 1) / N);
      phases.push({ dur: 0.04, at: function (v) { var Pp; if (v < 0.4) Pp = add(A, mul(u, E * v / 0.4)); else if (v < 0.6) Pp = lerp(add(A, mul(u, E)), add(B, mul(u, E)), (v - 0.4) / 0.2); else Pp = lerp(add(B, mul(u, E)), B, (v - 0.6) / 0.4); return { a: Pp, b: add(Pp, u), theta: fb, join: true }; } });
    })(k);
  }
  var total = phases.reduce(function (s, ph) { return s + ph.dur; }, 0);
  var at = function (t) { var q = t * total, i = 0; while (i < phases.length - 1 && q > phases[i].dur) { q -= phases[i].dur; i++; } var u = Math.max(0, Math.min(1, phases[i].dur ? q / phases[i].dur : 0)); return phases[i].at(u); };
  var tris = [], region = []; for (i = 0; i < N; i++) { tris.push([apex(i), V(x[i] + i / N, 0), V(x[i] + (i + 1) / N, 0)]); region.push(tris[i][0], tris[i][1], tris[i][2]); }
  for (i = 0; i < 120; i++) { var nd = at(i / 120); region.push(nd.a, nd.b); }
  return { name: 'perron', depth: p, alpha: alpha, area: Math.pow(alpha, 2 * p) + (1 - alpha), triangles: tris, region: region, turn: Math.PI / 4, at: at };
}

var API = {
  V: V, add: add, sub: sub, mul: mul, len: len, dist: dist, dot: dot, udir: udir, ang: ang, rotAbout: rotAbout, normAngle: normAngle,
  intersectLines: intersectLines, lineCircle: lineCircle, pointInPolygon: pointInPolygon, pointInTriangle: pointInTriangle, circlePoly: circlePoly, deltoidPt: deltoidPt,
  disk: disk, reuleaux: reuleaux, triangle: triangle, deltoid: deltoid, modHypocycloid: modHypocycloid, modStarPolygon: modStarPolygon, starBS: starBS, perronTree: perronTree,
};
if (typeof window !== 'undefined') window.Kakeya = API;
if (typeof module !== 'undefined' && module.exports) module.exports = API;
