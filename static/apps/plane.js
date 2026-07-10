/* Reusable complex-plane canvas stage for the ported complex-analysis applets.
   Handles device-pixel-ratio sizing, a 1- or 2-panel square layout, the
   math<->pixel coordinate maps (origin-centred, y-flipped), grid/axes drawing,
   and primitive draws (segments, polylines, sampled curves, dots, circles,
   arrows) in math coordinates. Depends on complex.js only for the `pxz` helper. */
(function (root) {
  "use strict";

  function Stage(canvas, opts) {
    opts = opts || {};
    this.cv = canvas; this.ctx = canvas.getContext("2d");
    this.n = opts.planes || 2;
    this.view = opts.view || 5;                 // half-width in math units
    this.views = opts.views || null;            // optional per-panel half-widths
    this.gap = opts.gap != null ? opts.gap : 18;
    this.pad = opts.pad != null ? opts.pad : 10;
    this.aspect = opts.aspect || 1;             // panel height / width
    this.panels = [];
    this.resize();
  }
  var S = Stage.prototype;

  S.css = function (v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); };

  S.resize = function () {
    var cssW = this.cv.clientWidth || 640, dpr = window.devicePixelRatio || 1, n = this.n;
    var panelW = Math.floor((cssW - this.gap * (n - 1)) / n);
    var panelH = Math.round(panelW * this.aspect);
    this.cssW = cssW; this.cssH = panelH; this.dpr = dpr;
    this.cv.width = Math.round(cssW * dpr); this.cv.height = Math.round(panelH * dpr);
    this.cv.style.height = panelH + "px";
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var half = Math.min(panelW, panelH) / 2 - this.pad;
    this.panels = [];
    for (var i = 0; i < n; i++) {
      var x0 = i * (panelW + this.gap), v = (this.views && this.views[i]) || this.view;
      this.panels.push({ x0: x0, w: panelW, cx: x0 + panelW / 2, cy: panelH / 2, s: half / v, view: v });
    }
    return this;
  };

  // math -> pixel
  S.px = function (p, x, y) { return [p.cx + p.s * x, p.cy - p.s * y]; };
  S.pxz = function (p, z) { return [p.cx + p.s * z.x, p.cy - p.s * z.y]; };
  // pixel -> math
  S.math = function (p, px, py) { return [(px - p.cx) / p.s, (p.cy - py) / p.s]; };

  S.clip = function (p, fn) {
    var c = this.ctx; c.save(); c.beginPath(); c.rect(p.x0, 0, p.w, this.cssH); c.clip(); fn(); c.restore();
  };
  S.clear = function () {
    var c = this.ctx; c.clearRect(0, 0, this.cssW, this.cssH); c.fillStyle = this.css("--panel");
    for (var i = 0; i < this.n; i++) c.fillRect(this.panels[i].x0, 0, this.panels[i].w, this.cssH);
  };
  S.frames = function () {
    var c = this.ctx; c.strokeStyle = this.css("--line"); c.lineWidth = 1;
    for (var i = 0; i < this.n; i++) c.strokeRect(this.panels[i].x0 + 0.5, 0.5, this.panels[i].w - 1, this.cssH - 1);
  };

  // Grid: light unit lines (optional), black axes + ticks + interior lattice dots.
  S.grid = function (p, showGrid) {
    var c = this.ctx, V = p.view || this.view, self = this, i, q;
    this.clip(p, function () {
      if (showGrid) {
        c.strokeStyle = self.css("--grid"); c.lineWidth = 1;
        for (i = -V; i <= V; i++) { self.seg(p, -V, i, V, i); self.seg(p, i, -V, i, V); }
      }
      c.strokeStyle = self.css("--axis") || self.css("--muted"); c.lineWidth = 1.2;
      self.seg(p, -V, 0, V, 0); self.seg(p, 0, -V, 0, V);
      c.lineWidth = 1;
      for (i = -V + 1; i <= V - 1; i++) {
        if (i === 0) continue;
        var a = self.px(p, i, 0), b = self.px(p, 0, i);
        c.beginPath(); c.moveTo(a[0], a[1] - 3); c.lineTo(a[0], a[1] + 3); c.stroke();
        c.beginPath(); c.moveTo(b[0] - 3, b[1]); c.lineTo(b[0] + 3, b[1]); c.stroke();
      }
    });
  };

  S.seg = function (p, x1, y1, x2, y2) {
    var c = this.ctx, a = this.px(p, x1, y1), b = this.px(p, x2, y2);
    c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
  };
  // polyline through math points [[x,y],...] (caller sets stroke style)
  S.poly = function (p, pts) {
    var c = this.ctx; if (!pts.length) return;
    c.beginPath();
    for (var i = 0; i < pts.length; i++) { var q = this.px(p, pts[i][0], pts[i][1]);
      if (i === 0) c.moveTo(q[0], q[1]); else c.lineTo(q[0], q[1]); }
    c.stroke();
  };
  // sampled curve: f(t) -> [x,y] for t in [t0,t1], N samples
  S.curve = function (p, f, t0, t1, N) {
    var pts = []; for (var k = 0; k <= N; k++) pts.push(f(t0 + (t1 - t0) * k / N)); this.poly(p, pts);
  };
  S.dot = function (p, x, y, r, ring) {
    var c = this.ctx, q = this.px(p, x, y);
    c.beginPath(); c.arc(q[0], q[1], r || 4, 0, 7); c.fill();
    if (ring) { c.strokeStyle = this.css("--panel"); c.lineWidth = 1.5; c.stroke(); }
  };
  S.circle = function (p, cx, cy, r) {
    var c = this.ctx, q = this.px(p, cx, cy);
    c.beginPath(); c.arc(q[0], q[1], p.s * r, 0, 7); c.stroke();
  };
  S.arrow = function (p, x0, y0, x1, y1, head) {
    var c = this.ctx, o = this.px(p, x0, y0), h = this.px(p, x1, y1);
    c.beginPath(); c.moveTo(o[0], o[1]); c.lineTo(h[0], h[1]); c.stroke();
    var d = Math.hypot(h[0] - o[0], h[1] - o[1]); if (d < 4) return;
    var ang = Math.atan2(h[1] - o[1], h[0] - o[0]), L = head || 9;
    c.beginPath(); c.moveTo(h[0], h[1]);
    c.lineTo(h[0] - L * Math.cos(ang - 0.4), h[1] - L * Math.sin(ang - 0.4));
    c.lineTo(h[0] - L * Math.cos(ang + 0.4), h[1] - L * Math.sin(ang + 0.4));
    c.closePath(); c.fill();
  };

  // Which panel is a pointer event in? Returns {p, i, px, py} or null.
  S.locate = function (e) {
    var r = this.cv.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
    for (var i = 0; i < this.n; i++) { var p = this.panels[i];
      if (px >= p.x0 && px <= p.x0 + p.w) return { p: p, i: i, px: px, py: py }; }
    return null;
  };

  root.ComplexStage = Stage;
})(window);
