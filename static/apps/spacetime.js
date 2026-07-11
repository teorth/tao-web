/* spacetime.js — core for the 1+1D special-relativity spacetime-diagram applet.
   Natural units c = 1, so light rays lie at 45 degrees. Metric signature (+,-):
   interval s^2 = dt^2 - dx^2  ( >0 timelike, 0 null, <0 spacelike ).

   A Frame is an affine map  display = B(phi) * lab + b  from the canonical "lab"
   coordinates (in which every object is stored once) to a panel's own (t,x),
   where B(phi) is a Lorentz boost of rapidity phi. Each panel owns one Frame, so
   the two panels can be boosted / re-centred independently. Depends on nothing. */
(function (root) {
  "use strict";
  var ST = {};
  var MAXB = 0.999999;

  ST.clampBeta = function (b) { return Math.max(-MAXB, Math.min(MAXB, b)); };
  ST.rapidity  = function (b) { return Math.atanh(ST.clampBeta(b)); };
  ST.addBeta   = function (b1, b2) { return (b1 + b2) / (1 + b1 * b2); };  // velocity addition
  // A velocity b0 measured in lab, as measured in a frame moving at betaF (and back).
  ST.labVelToFrame = function (b0, betaF) { return ST.addBeta(b0, -betaF); };
  ST.frameVelToLab = function (bp, betaF) { return ST.addBeta(bp, betaF); };

  function boost(phi, t, x) {                 // apply B(phi) to a (t,x) pair
    var ch = Math.cosh(phi), sh = Math.sinh(phi);
    return [ch * t - sh * x, ch * x - sh * t];
  }
  ST.boost = boost;

  // ---- Frame: display = B(phi)*lab + b ----
  function Frame() { this.phi = 0; this.b = [0, 0]; }
  ST.Frame = Frame;
  var F = Frame.prototype;
  F.beta = function () { return Math.tanh(this.phi); };
  F.isLab = function () { return this.phi === 0 && this.b[0] === 0 && this.b[1] === 0; };
  F.labToDisplay = function (t, x) { var r = boost(this.phi, t, x); return [r[0] + this.b[0], r[1] + this.b[1]]; };
  F.displayToLab = function (dt, dx) { return boost(-this.phi, dt - this.b[0], dx - this.b[1]); };
  // Change rapidity by dphi while keeping the event now at the display origin fixed there.
  F.nudgeRapidity = function (dphi) { this.b = boost(dphi, this.b[0], this.b[1]); this.phi += dphi; };
  F.setPhi  = function (phi)  { this.nudgeRapidity(phi - this.phi); };
  F.setBeta = function (beta) { this.setPhi(ST.rapidity(beta)); };
  F.translate = function (dt, dx) { this.b[0] += dt; this.b[1] += dx; };   // in display coords
  F.reset = function () { this.phi = 0; this.b = [0, 0]; };
  // Make an object of lab velocity betaObj vertical, and place anchorLab at the display origin.
  F.restFrameOf = function (betaObj, anchorLab) {
    this.phi = ST.rapidity(betaObj);
    var r = boost(this.phi, anchorLab[0], anchorLab[1]);
    this.b = [-r[0], -r[1]];
  };

  // ---- geometry (lab coords; a point is [t, x]) ----
  ST.velocity = function (p, q) { var dt = q[0] - p[0]; return dt !== 0 ? (q[1] - p[1]) / dt : Infinity; };
  ST.interval = function (p, q) { var dt = q[0] - p[0], dx = q[1] - p[1]; return dt * dt - dx * dx; };
  ST.character = function (s2) { var e = 1e-9; return s2 > e ? "timelike" : (s2 < -e ? "spacelike" : "null"); };
  ST.futureTimelike = function (p, q) { return ST.interval(p, q) > 1e-9 && q[0] > p[0]; };
  ST.properTime = function (pts) {
    var tau = 0;
    for (var i = 0; i < pts.length - 1; i++) tau += Math.sqrt(Math.max(0, ST.interval(pts[i], pts[i + 1])));
    return tau;
  };
  // Intersection of lines a0 + s*u and b0 + t*v (lab coords); null if (near-)parallel.
  ST.intersect = function (a0, u, b0, v) {
    var det = u[0] * (-v[1]) - u[1] * (-v[0]);
    if (Math.abs(det) < 1e-12) return null;
    var wx = b0[0] - a0[0], wy = b0[1] - a0[1];
    var s = (wx * (-v[1]) - wy * (-v[0])) / det;
    return [a0[0] + s * u[0], a0[1] + s * u[1]];
  };

  // ---- colour / Doppler (c = 1). Observer sits at the frame's x = 0 line. ----
  ST.C = 299792.458;                                   // c in nm·THz, so f[THz] = C / λ[nm]
  ST.nmToTHz = function (nm) { return ST.C / nm; };
  ST.thzToNm = function (thz) { return ST.C / thz; };
  ST.gamma = function (b) { b = ST.clampBeta(b); return 1 / Math.sqrt(1 - b * b); };
  // Observed wavelength of a massive source of rest wavelength restNm moving at betaFrame in the
  // observed frame, on side sideSign = sign(x) of the x=0 observer. v_r = sideSign*betaFrame is the
  // recession velocity (positive = receding = redshift). Relativistic longitudinal Doppler.
  ST.dopplerNm = function (restNm, betaFrame, sideSign) {
    var vr = ST.clampBeta(sideSign * betaFrame);
    return restNm * Math.sqrt((1 + vr) / (1 - vr));
  };
  // Light ray: factor multiplying LAB frequency when observed in a frame moving at betaF (rel. lab);
  // dir = +1 (right) / -1 (left). f_obs = f_lab * factor,  λ_obs = λ_lab / factor.
  ST.lightFreqFactor = function (betaF, dir) { betaF = ST.clampBeta(betaF); return ST.gamma(betaF) * (1 - betaF * dir); };
  // Visible-spectrum wavelength (nm) -> [r,g,b] 0..255. UV/IR clamp to the nearest visible hue.
  ST.wavelengthToRgb = function (w) {
    w = Math.max(380, Math.min(780, w));
    var r = 0, g = 0, b = 0;
    if (w < 440) { r = -(w - 440) / (440 - 380); b = 1; }
    else if (w < 490) { g = (w - 440) / (490 - 440); b = 1; }
    else if (w < 510) { g = 1; b = -(w - 510) / (510 - 490); }
    else if (w < 580) { r = (w - 510) / (580 - 510); g = 1; }
    else if (w < 645) { r = 1; g = -(w - 645) / (645 - 580); }
    else { r = 1; }
    var f = 1;
    if (w < 420) f = 0.3 + 0.7 * (w - 380) / (420 - 380);
    else if (w > 700) f = 0.3 + 0.7 * (780 - w) / (780 - 700);
    function ch(c) { return Math.round(255 * Math.pow(Math.max(0, c * f), 0.8)); }
    return [ch(r), ch(g), ch(b)];
  };

  root.ST = ST;
})(window);
