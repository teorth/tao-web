// Library diagram for the paper-diagram viewer — lazy-loaded on demand.
// New large value estimates for Dirichlet polynomials, Larry Guth & James Maynard,
// arXiv:2405.20552; Ann. of Math. (2) 203(2): 623–675 (March 2026).
// Hand-encoded logical skeleton: the singular-value / trace method, the S1+S2+S3
// split, the affine-equidistribution input, and the deductions to zero density and
// primes. An edge points from a prerequisite to the result whose proof uses it.
// Weights (1–5) are editorial.
;(function (g) {
  var D = {
    format: "paper-diagram",
    schemaVersion: 1,
    meta: {
      title: "New large value estimates for Dirichlet polynomials",
      paper: {
        authors: ["Larry Guth", "James Maynard"],
        year: 2024,
        arxiv: "2405.20552",
        note: "Ann. of Math. (2) 203(2): 623–675 (March 2026)."
      },
      generatedBy: "hand",
      date: "2026-07-13",
      note: "Large values of a Dirichlet polynomial become the top singular value of a matrix, bounded by a mean-subtracted cubic trace. The trace splits into S1 (negligible), S2 (Heath-Brown), and the hard S3, where a cancellation special to log-n phases plus an equidistribution estimate over affine maps beat the trivial bound — unless the large-value set has large additive energy, which Heath-Brown rules out. This yields the zero-density exponent 30/13 and primes in intervals of length x^(17/30)."
    },
    layout: { engine: "layered", direction: "up" },
    nodes: [
      { id: "def:matrix", kind: "definition", label: "§4", name: "The matrix M_W and singular values", section: "4", weight: 4, statement: "The |W|×N matrix (M_W)_{t,n} = n^{it}: a Dirichlet polynomial taking large values on a set W is governed by the largest singular value s₁(M_W)." },
      { id: "lem:4.1", kind: "lemma", label: "Lem 4.1", name: "Large values ↔ s₁(M_W)", section: "4", weight: 3, statement: "|W| N^{2σ} ≤ s₁(M_W)² · Σ|b_n|², so bounding the frequency of large values reduces to bounding the top singular value." },
      { id: "lem:4.2", kind: "lemma", label: "Lem 4.2", name: "Singular value via mean-subtracted traces", section: "4", weight: 4, statement: "s₁(A) ≲ (tr((AA*)³) − tr(AA*)³/m²)^{1/6} + (tr(AA*)/m)^{1/2}: subtracting the mean sharpens the trivial trace bound when the spectrum is spread out." },
      { id: "prop:4.6", kind: "proposition", label: "Prop 4.6", name: "Trace expansion S₁ + S₂ + S₃", section: "4", weight: 4, statement: "Expanding tr((M_W M_W*)³) by Poisson summation writes |W| in terms of Σ_m I_m = S₁ + S₂ + S₃, split by how many frequency components m_i are nonzero." },
      { id: "prop:5.1", kind: "proposition", label: "Prop 5.1", name: "S₁ is negligible", section: "5", weight: 1, statement: "The terms with exactly one nonzero frequency contribute a negligible amount." },
      { id: "ext:hb", kind: "theorem", label: "Thm 1.6", name: "Heath-Brown's difference-set estimate", section: "1", weight: 4, external: true, ref: "Heath-Brown (1979)", statement: "Σ_{t₁,t₂∈T} |Σ_{n∼N} a_n n^{i(t₁−t₂)}|² ≲ |T|²N + |T|N² + |T|^{5/4} T^{1/2} N, a bound on Dirichlet polynomials over difference sets." },
      { id: "lem:6.2", kind: "lemma", label: "Lem 6.2", name: "Approximate functional equation", section: "6", weight: 2, statement: "A reflection principle expressing a length-N Dirichlet polynomial at height t through one of length ≈ t/N." },
      { id: "prop:6.1", kind: "proposition", label: "Prop 6.1", name: "S₂ bound (Heath-Brown)", section: "6", weight: 4, statement: "The terms with exactly two nonzero frequencies are bounded using Heath-Brown's estimate after an approximate functional equation." },
      { id: "def:R", kind: "definition", label: "(7.2)", name: "The exponential sum R(v)", section: "7", weight: 3, statement: "R(v) = Σ_{t∈W} |v|^{it}, whose moments over v encode the size and additive structure of the large-value set W." },
      { id: "def:energy", kind: "definition", label: "(1.7)", name: "Additive energy E(W)", section: "1", weight: 3, statement: "E(W) = #{w₁,w₂,w₃,w₄ ∈ W : |w₁ + w₂ − w₃ − w₄| ≤ 1}, measuring the additive structure of W." },
      { id: "prop:7.1", kind: "proposition", label: "Prop 7.1", name: "Key cancellation in the I_m integrals", section: "7", weight: 5, statement: "An inner u-integral in I_m oscillates unless m₁v₁ + m₂v₂ + m₃ ≈ 0, gaining a whole factor of T.", plain: "The crucial trick: the log-n phases of a Dirichlet polynomial produce cancellation that generic trigonometric sums do not." },
      { id: "prop:7.2", kind: "proposition", label: "Prop 7.2", name: "Expansion of S₃", section: "7", weight: 3, statement: "S₃ is reduced to averages of R against affine images (m₁v + m₃)/(m₂v) and (m₁v + m₃)/m₂ of its argument." },
      { id: "lem:8.3", kind: "lemma", label: "Lem 8.3", name: "L² and L⁴ moments of R", section: "8", weight: 2, statement: "∫|R|² ≲ |W| and ∫|R|⁴ ≲ E(W): the second and fourth moments of R are the size and the additive energy of W." },
      { id: "prop:8.1", kind: "proposition", label: "Prop 8.1", name: "Low-energy S₃ bound", section: "8", weight: 4, statement: "S₃ ≲ T² |W|^{1/2} E(W)^{1/2}: sharp square-root cancellation in R when the additive energy is minimal." },
      { id: "lem:9.2", kind: "lemma", label: "Lem 9.2", name: "Iterative Fourier bound for J(f)", section: "9", weight: 4, statement: "A Poisson-summation and Plancherel iteration that drives the affine-equidistribution estimate down through repeated smoothings of f." },
      { id: "prop:9.1", kind: "proposition", label: "Prop 9.1", name: "Equidistribution over affine maps", section: "9", weight: 5, statement: "J(f) ≲ M⁶ ‖f‖₁² + M⁴ ‖f‖₂²: a sparse set cannot be nearly invariant under many affine maps u ↦ (m₁u + m₃)/m₂.", plain: "The new combinatorial-Fourier input: rules out the large-value set being closed under many affine transformations." },
      { id: "prop:10.1", kind: "proposition", label: "Prop 10.1", name: "Refined S₃ bound", section: "10", weight: 5, statement: "S₃ ≲ T² |W|^{3/2} + T N |W|^{1/2} E(W)^{1/2}, improving the low-energy bound by a factor N/T when the energy is large.", plain: "The heart of the improvement: a good bound on the hardest term for every energy regime." },
      { id: "lem:1.7", kind: "lemma", label: "Lem 1.7", name: "Energy via Heath-Brown", section: "1", weight: 3, statement: "E(W) ≲ |W|³ N^{1−2σ} + |W|² N^{2−2σ}: a first bound on the additive energy from Heath-Brown's estimate." },
      { id: "prop:11.1", kind: "proposition", label: "Prop 11.1", name: "Refined energy bound (gcd split)", section: "11", weight: 4, statement: "Splitting n₁/n₂ by gcd gives E(W) ≲ |W| N^{4−4σ} + |W|^{21/8} T^{1/4} N^{1−2σ} + |W|³ N^{1−2σ}, covering the large-energy case." },
      { id: "prop:3.1", kind: "proposition", label: "Prop 3.1", name: "Main proposition (balancing scale)", section: "3", weight: 4, statement: "At T = N^{6/5}, |W| ≲ T N^{(12−20σ)/5} for σ ∈ [7/10, 8/10] — the technical core, obtained by combining the bounds for S₁, S₂, S₃ and the energy." },
      { id: "thm:1.1", kind: "theorem", label: "Thm 1.1", name: "New large values estimate", section: "1", weight: 5, statement: "R ≲ T^{o(1)}(N² V^{−2} + N^{18/5} V^{−4} + T N^{12/5} V^{−4}), the first substantive improvement near the critical size V ≈ N^{3/4}.", plain: "The headline bound: how often a Dirichlet polynomial can be large, improved in the critical range." },
      { id: "thm:1.2", kind: "theorem", label: "Thm 1.2", name: "Zero-density estimate (30/13)", section: "1", weight: 5, statement: "N(σ,T) ≲ T^{30(1−σ)/13 + o(1)}, improving Huxley's exponent 12/5 for zeros of the Riemann zeta function." },
      { id: "cor:primes", kind: "corollary", label: "Cor 1.3", name: "Primes in short intervals (17/30)", section: "1", weight: 4, statement: "An asymptotic for primes in [x, x + y] whenever y ≥ x^{17/30 + ε}, improving Huxley's exponent 7/12." }
    ],
    edges: [
      { from: "def:matrix", to: "lem:4.1", type: "uses" },
      { from: "def:matrix", to: "prop:4.6", type: "uses" },
      { from: "lem:4.1", to: "prop:4.6", type: "uses" },
      { from: "lem:4.2", to: "prop:4.6", type: "uses" },
      { from: "prop:4.6", to: "prop:5.1", type: "uses" },
      { from: "prop:5.1", to: "prop:3.1", type: "uses" },
      { from: "lem:6.2", to: "prop:6.1", type: "uses" },
      { from: "ext:hb", to: "prop:6.1", type: "uses" },
      { from: "prop:6.1", to: "prop:3.1", type: "uses" },
      { from: "def:R", to: "prop:7.1", type: "uses" },
      { from: "prop:7.1", to: "prop:7.2", type: "uses" },
      { from: "def:R", to: "prop:7.2", type: "uses" },
      { from: "prop:7.2", to: "prop:8.1", type: "uses" },
      { from: "def:energy", to: "prop:8.1", type: "uses" },
      { from: "lem:8.3", to: "prop:8.1", type: "uses" },
      { from: "def:R", to: "lem:8.3", type: "uses" },
      { from: "def:energy", to: "lem:8.3", type: "uses" },
      { from: "prop:8.1", to: "prop:3.1", type: "uses" },
      { from: "lem:9.2", to: "prop:9.1", type: "uses" },
      { from: "prop:9.1", to: "prop:10.1", type: "uses" },
      { from: "prop:7.2", to: "prop:10.1", type: "uses" },
      { from: "lem:8.3", to: "prop:10.1", type: "uses" },
      { from: "prop:10.1", to: "prop:3.1", type: "uses" },
      { from: "ext:hb", to: "lem:1.7", type: "uses" },
      { from: "def:energy", to: "lem:1.7", type: "uses" },
      { from: "lem:1.7", to: "prop:11.1", type: "uses" },
      { from: "ext:hb", to: "prop:11.1", type: "uses" },
      { from: "prop:11.1", to: "prop:3.1", type: "uses" },
      { from: "prop:4.6", to: "prop:3.1", type: "uses" },
      { from: "prop:3.1", to: "thm:1.1", type: "uses" },
      { from: "thm:1.1", to: "thm:1.2", type: "uses" },
      { from: "thm:1.2", to: "cor:primes", type: "uses" }
    ]
  };
  if (typeof g.PaperDiagramData === "object" && g.PaperDiagramData) g.PaperDiagramData["2405.20552"] = D;
  else g.PaperDiagramData = { "2405.20552": D };
  if (typeof module !== "undefined" && module.exports) module.exports = D;
})(typeof window !== "undefined" ? window : globalThis);
