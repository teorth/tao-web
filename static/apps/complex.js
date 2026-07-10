/* Shared complex-arithmetic foundation for the ported complex-analysis applets.
   A modern rewrite of the 2002 Complex.java by Terence Tao. Double precision;
   principal branches (arg in (-pi, pi], log cut on the negative real axis);
   the point at infinity is a first-class value (inf flag), as in the original. */
(function (root) {
  "use strict";
  var TAU = 2 * Math.PI;

  function Complex(x, y, inf) {
    this.x = x || 0; this.y = y || 0; this.inf = !!inf;
  }
  var P = Complex.prototype;

  Complex.of = function (x, y) { return new Complex(x, y, false); };
  Complex.INF = function () { return new Complex(0, 0, true); };
  Complex.ZERO = new Complex(0, 0);
  Complex.ONE = new Complex(1, 0);
  Complex.I = new Complex(0, 1);

  P.clone = function () { return new Complex(this.x, this.y, this.inf); };
  P.isZero = function () { return !this.inf && this.x * this.x + this.y * this.y < 1e-12; };

  P.add = function (z) { return this.inf || z.inf ? Complex.INF() : new Complex(this.x + z.x, this.y + z.y); };
  P.sub = function (z) { return this.inf || z.inf ? Complex.INF() : new Complex(this.x - z.x, this.y - z.y); };
  P.neg = function () { return this.inf ? Complex.INF() : new Complex(-this.x, -this.y); };
  P.mul = function (z) {
    if (this.inf || z.inf) return Complex.INF();
    return new Complex(this.x * z.x - this.y * z.y, this.x * z.y + this.y * z.x);
  };
  P.scale = function (k) { return this.inf ? Complex.INF() : new Complex(this.x * k, this.y * k); };
  P.conj = function () { return this.inf ? Complex.INF() : new Complex(this.x, -this.y); };
  P.norm = function () { return this.x * this.x + this.y * this.y; };     // |z|^2
  P.abs = function () { return this.inf ? Infinity : Math.hypot(this.x, this.y); };

  P.inv = function () {                                                   // 1/z
    if (this.inf) return new Complex(0, 0);
    var n = this.norm();
    if (n < 1e-12) return Complex.INF();
    return new Complex(this.x / n, -this.y / n);
  };
  P.div = function (z) {
    if (z.inf) return this.inf ? Complex.INF() : new Complex(0, 0);
    return this.mul(z.inv());
  };

  // principal argument in (-pi, pi]
  P.arg = function () { return this.inf ? 0 : Math.atan2(this.y, this.x); };
  // argument lifted into (a, a + 2pi]  (branch selection along angle a)
  P.argFrom = function (a) {
    if (this.inf) return 0;
    var t = Math.atan2(this.y, this.x);
    while (t <= a) t += TAU;
    while (t > a + TAU) t -= TAU;
    return t;
  };

  P.exp = function () {
    var e = Math.exp(this.x);
    return new Complex(e * Math.cos(this.y), e * Math.sin(this.y));
  };
  P.log = function () { return new Complex(Math.log(this.abs()), this.arg()); };      // principal
  P.logFrom = function (a) { return new Complex(Math.log(this.abs()), this.argFrom(a)); };

  P.powN = function (n) {                                                 // integer power, exact
    if (n === 0) return Complex.ONE.clone();
    var neg = n < 0; n = Math.abs(n);
    var r = Complex.ONE.clone(), base = this.clone();
    while (n > 0) { if (n & 1) r = r.mul(base); base = base.mul(base); n >>= 1; }
    return neg ? r.inv() : r;
  };
  P.pow = function (w) { return this.isZero() ? new Complex(0, 0) : this.log().mul(w).exp(); };
  P.sqrt = function () {
    if (this.inf) return Complex.INF();
    var r = this.abs(), t = this.arg() / 2, s = Math.sqrt(r);
    return new Complex(s * Math.cos(t), s * Math.sin(t));
  };

  P.sin = function () { return new Complex(Math.sin(this.x) * Math.cosh(this.y), Math.cos(this.x) * Math.sinh(this.y)); };
  P.cos = function () { return new Complex(Math.cos(this.x) * Math.cosh(this.y), -Math.sin(this.x) * Math.sinh(this.y)); };
  P.tan = function () { return this.sin().div(this.cos()); };
  P.sinh = function () { return new Complex(Math.sinh(this.x) * Math.cos(this.y), Math.cosh(this.x) * Math.sin(this.y)); };
  P.cosh = function () { return new Complex(Math.cosh(this.x) * Math.cos(this.y), Math.sinh(this.x) * Math.sin(this.y)); };

  // Mobius map (a z + b)/(c z + d), with the same infinity handling as Shape.Mobius
  Complex.mobius = function (z, a, b, c, d) {
    if (z.inf) return c.norm() < 1e-9 ? Complex.INF() : a.div(c);
    var den = c.mul(z).add(d);
    if (den.norm() < 1e-9) return Complex.INF();
    return a.mul(z).add(b).div(den);
  };

  // Format as "a + bi" (tol below which a part is dropped)
  P.toString = function (tol) {
    if (this.inf) return "∞";
    tol = tol || 1e-3;
    var a = Math.abs(this.x) < tol ? 0 : this.x, b = Math.abs(this.y) < tol ? 0 : this.y;
    var f = function (v) { var r = Math.round(v * 1e4) / 1e4; return r; };
    if (b === 0) return "" + f(a);
    if (a === 0) return (b === 1 ? "" : b === -1 ? "-" : f(b)) + "i";
    return f(a) + (b < 0 ? " - " : " + ") + (Math.abs(b) === 1 ? "" : f(Math.abs(b))) + "i";
  };

  root.Complex = Complex;
})(window);
