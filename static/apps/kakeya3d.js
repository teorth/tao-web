/*
 * kakeya3d.js — DOM-free core for the 3D Kakeya-set applet.
 *
 * Illustrates a three-dimensional Kakeya (Besicovitch) set built from 1 x delta x delta
 * tubes (cylinders), as the 3D analogue of the planar Perron tree.  Directions form a
 * two-parameter patch d(s,u) = (s, u, -1) with s = (i+.5)/N, u = (j+.5)/N and N = 2^p,
 * giving N^2 unit-height tubes.  Two arrangements of the same tubes:
 *
 *   - "bush"       : every tube shares a base, so they fan out into a solid-angle cone
 *                    of volume ~ 1/3.
 *   - "compressed" : tube (i,j) is translated transversely by the 2D Perron offsets
 *                    (X_i, X_j) — the same bisection-tree pattern the planar Kakeya
 *                    applet uses — so the tubes overlap into a much smaller-volume
 *                    tangle, while every one of the N^2 directions is still realized by
 *                    a full tube.
 *
 * A "compress" parameter in [0,1] slides continuously between the two (the morph is the
 * point of the picture).  Because every (i,j) pair is present, the cross-section of the
 * union at height z is exactly the product (X-set) x (Y-set) of two one-dimensional sets,
 * so the volume is computed exactly (no Monte-Carlo) by integrating the product of two
 * 1-D union-lengths over z.
 *
 * Rendering is done by the page (a software 3D renderer on a 2D canvas); this file holds
 * only the pure geometry + arithmetic, so it can be unit-tested under node.  No network,
 * no dependencies.
 */
(function (root) {
  "use strict";

  // ---- tiny 3-vector helpers ----
  function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function scale(a, s) { return [a[0] * s, a[1] * s, a[2] * s]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function norm(a) { return Math.sqrt(dot(a, a)); }
  function normalize(a) { const n = norm(a) || 1; return [a[0] / n, a[1] / n, a[2] / n]; }

  // ---- Perron offsets (ported verbatim from the 2D Kakeya applet's perronTree) ----
  // Returns the length-N array X of transverse translations plus the overlap alpha.
  function perronOffsets(p) {
    p = Math.max(2, Math.min(9, p || 5));
    const N = 1 << p, alpha = Math.pow(1 / (2 * p), 1 / (2 * p - 1)), X = [];
    for (let i = 0; i < N; i++) {
      let xx = 0, m = i, j2 = N / 2, aj = 1;
      for (let j = 0; j < p; j++) {
        xx += (aj / j2) * Math.floor((m + 1) / 2);
        aj *= alpha; j2 = Math.floor(j2 / 2); m = Math.floor(m / 2);
      }
      xx *= (alpha - 1);
      xx += 1 - Math.pow(alpha, p);
      X.push(xx);
    }
    return { X: X, alpha: alpha, N: N };
  }

  // ---- the tubes ----
  // Each tube: { i, j, base:[x,y,z], dir:[dx,dy,dz], s, u, hue }.  The axis runs from
  // base (at z=1) to base+dir (at z=0); the tube is the cylinder of radius delta/2 about it.
  function buildTubes(opts) {
    opts = opts || {};
    const p = opts.p || 4, compress = opts.compress === undefined ? 1 : opts.compress;
    const off = perronOffsets(p), N = off.N, X = off.X, tubes = [];
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const s = (i + 0.5) / N, u = (j + 0.5) / N;
        tubes.push({
          i: i, j: j, s: s, u: u,
          base: [compress * X[i], compress * X[j], 1],
          dir: [s, u, -1],
          hue: (i / N) * 300      // colour by direction (only i used, keeps a readable gradient)
        });
      }
    }
    return tubes;
  }

  // Axis midpoint of a tube (handy for centering the camera / depth sorting).
  function tubeMid(t) { return add(t.base, scale(t.dir, 0.5)); }

  // ---- cylinder mesh (side faces only; caps omitted — invisible for thin tubes) ----
  function orthoFrame(d) {
    const dn = normalize(d);
    let up = [0, 0, 1];
    if (Math.abs(dot(dn, up)) > 0.9) up = [1, 0, 0];
    const e1 = normalize(cross(dn, up));
    const e2 = cross(dn, e1);
    return [e1, e2];
  }
  function cylinderMesh(base, dir, radius, nSides) {
    nSides = nSides || 8;
    const fr = orthoFrame(dir), e1 = fr[0], e2 = fr[1];
    const top = base, bot = add(base, dir), verts = [], faces = [];
    for (let k = 0; k < nSides; k++) {
      const a = 2 * Math.PI * k / nSides;
      const offv = add(scale(e1, radius * Math.cos(a)), scale(e2, radius * Math.sin(a)));
      verts.push(add(top, offv));
      verts.push(add(bot, offv));
    }
    for (let k = 0; k < nSides; k++) {
      const k2 = (k + 1) % nSides;
      faces.push([2 * k, 2 * k + 1, 2 * k2 + 1, 2 * k2]);
    }
    return { verts: verts, faces: faces };
  }

  // ---- exact volume of the union (product cross-section => deterministic) ----
  function unionLength(centers, hw) {
    if (!centers.length) return 0;
    const iv = centers.map(c => [c - hw, c + hw]).sort((a, b) => a[0] - b[0]);
    let total = 0, cur0 = iv[0][0], cur1 = iv[0][1];
    for (let k = 1; k < iv.length; k++) {
      if (iv[k][0] <= cur1) cur1 = Math.max(cur1, iv[k][1]);
      else { total += cur1 - cur0; cur0 = iv[k][0]; cur1 = iv[k][1]; }
    }
    return total + (cur1 - cur0);
  }

  // volume({p, delta, compress}, slices?) — integral over z in [0,1] of |Xset(z)|*|Yset(z)|.
  // Xset(z) and Yset(z) are equal here (same offsets + slopes on both axes), so it is |Xset|^2.
  function volume(opts, slices) {
    opts = opts || {}; slices = slices || 400;
    const p = opts.p || 4, delta = opts.delta === undefined ? 0.03 : opts.delta;
    const compress = opts.compress === undefined ? 1 : opts.compress;
    const off = perronOffsets(p), N = off.N, X = off.X, hw = delta / 2;
    let vol = 0;
    for (let k = 0; k < slices; k++) {
      const z = (k + 0.5) / slices, r = 1 - z, cx = [];
      for (let i = 0; i < N; i++) cx.push(compress * X[i] + r * ((i + 0.5) / N));
      const L = unionLength(cx, hw);
      vol += L * L * (1 / slices);
    }
    return vol;
  }

  // ---- 3D transform helpers used by the renderer (pure; testable) ----
  // Rotate by azimuth (about z) then elevation (about x'); right-handed.
  function rotate(pt, az, el) {
    const ca = Math.cos(az), sa = Math.sin(az), ce = Math.cos(el), se = Math.sin(el);
    const x = ca * pt[0] - sa * pt[1];
    const y = sa * pt[0] + ca * pt[1];
    const z = pt[2];
    return [x, ce * y - se * z, se * y + ce * z];
  }

  function boundsOf(tubes) {
    let lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    for (const t of tubes) {
      for (const q of [t.base, add(t.base, t.dir)]) {
        for (let c = 0; c < 3; c++) { if (q[c] < lo[c]) lo[c] = q[c]; if (q[c] > hi[c]) hi[c] = q[c]; }
      }
    }
    return { lo: lo, hi: hi, center: [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2] };
  }

  const api = {
    add: add, sub: sub, scale: scale, dot: dot, cross: cross, norm: norm, normalize: normalize,
    perronOffsets: perronOffsets,
    buildTubes: buildTubes,
    tubeMid: tubeMid,
    orthoFrame: orthoFrame,
    cylinderMesh: cylinderMesh,
    unionLength: unionLength,
    volume: volume,
    rotate: rotate,
    boundsOf: boundsOf
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.Kakeya3D = api;
})(typeof window !== "undefined" ? window : this);
