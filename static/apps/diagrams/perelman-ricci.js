// Library diagram for the paper-diagram viewer — lazy-loaded on demand.
// The entropy formula for the Ricci flow and its geometric applications,
// Grisha Perelman, arXiv:math/0211159.
// Hand-encoded logical skeleton: the entropy/monotonicity machinery, the reduced
// volume, no-local-collapsing, and the road to geometrization. An edge points from
// a prerequisite to the result whose proof uses it. Weights (1–5) are editorial.
;(function (g) {
  var D = {
    format: "paper-diagram",
    schemaVersion: 1,
    meta: {
      title: "The entropy formula for the Ricci flow and its geometric applications",
      paper: {
        authors: ["Grisha Perelman"],
        year: 2002,
        arxiv: "math/0211159"
      },
      generatedBy: "hand",
      date: "2026-07-13",
      note: "Two monotone quantities drive everything: the W-entropy (rigid on gradient shrinking solitons) and the reduced volume built from L-geometry. They yield no-local-collapsing (controlling injectivity radius), which with Hamilton's Harnack and Ivey pinching classifies the ancient κ-solutions that model high-curvature regions — giving canonical neighbourhoods, the thick–thin decomposition, and (with surgery) geometrization."
    },
    layout: { engine: "layered", direction: "up" },
    nodes: [
      { id: "ext:ricci-flow", kind: "definition", label: "Ricci flow", name: "Ricci flow (Hamilton)", section: "0", weight: 3, external: true, ref: "R. Hamilton", statement: "The evolution ∂_t g_ij = −2R_ij; short-time existence on closed manifolds and the reaction–diffusion evolution ∂_t Rm = ΔRm + Q of the curvature." },
      { id: "def:soliton", color: "#dce8fb", kind: "definition", label: "§2", name: "Solitons and breathers", section: "2", weight: 2, statement: "Ricci solitons and breathers: metrics evolving only by diffeomorphism and scaling — the fixed points and periodic orbits of the flow (e.g. the Gaussian shrinking soliton)." },
      { id: "func:F", color: "#dce8fb", kind: "definition", label: "§1", name: "The F-functional / gradient flow", section: "1", weight: 3, statement: "F(g,f) = ∫(R + |∇f|²) e^{−f} dV. Coupled with a backward heat equation, Ricci flow is the gradient flow of F, so it is gradient-like." },
      { id: "func:W", color: "#fbf0c4", kind: "definition", label: "(3.1)", name: "The W-entropy functional", section: "3", weight: 5, statement: "W(g,f,τ) = ∫[τ(R + |∇f|²) + f − n](4πτ)^{−n/2} e^{−f} dV, with infima μ(g,τ) and ν(g).", plain: "A scale-aware entropy for the Ricci flow — the paper's central new quantity." },
      { id: "thm:monotone", color: "#fbf0c4", kind: "theorem", label: "(3.4)", name: "Monotonicity of W", section: "3", weight: 5, statement: "dW/dt = ∫ 2τ |R_ij + ∇_i∇_j f − g_ij/(2τ)|² (4πτ)^{−n/2} e^{−f} dV ≥ 0, with equality only on gradient shrinking solitons." },
      { id: "thm:no-breathers", color: "#fbf0c4", kind: "theorem", label: "§2–3", name: "No nontrivial breathers", section: "3", weight: 2, statement: "On a closed manifold every steady, expanding or shrinking breather is a gradient Ricci soliton." },
      { id: "def:kappa", color: "#fbf0c4", kind: "definition", label: "§4", name: "κ-noncollapsing", section: "4", weight: 3, statement: "A metric is κ-noncollapsed on scale ρ if every ball of radius r < ρ with |Rm| ≤ r^{−2} has volume ≥ κ rⁿ." },
      { id: "thm:nolc1", color: "#fbf0c4", kind: "theorem", label: "§4", name: "No local collapsing I", section: "4", weight: 4, statement: "A smooth Ricci flow on a closed manifold is κ-noncollapsed on finite time intervals; this controls the injectivity radius at singularities.", plain: "Removes the main obstacle in Hamilton's program: blow-up limits do not collapse." },
      { id: "def:Llength", color: "#d3ecd3", kind: "definition", label: "§7", name: "L-length and reduced distance l", section: "7", weight: 4, statement: "The space-time path functional L(γ) = ∫ √τ (R + |γ̇|²) dτ, its L-geodesics, and the reduced distance l(q,τ) = L(q,τ)/(2√τ)." },
      { id: "def:redvol", color: "#d3ecd3", kind: "definition", label: "§7", name: "Reduced volume Ṽ(τ)", section: "7", weight: 4, statement: "The reduced volume Ṽ(τ) = ∫ τ^{−n/2} e^{−l(q,τ)} dq, a Bishop–Gromov-type quantity." },
      { id: "thm:redvol-mono", color: "#d3ecd3", kind: "theorem", label: "§7", name: "Monotonicity of reduced volume", section: "7", weight: 5, statement: "Ṽ(τ) is nonincreasing in τ along the flow, and constant only on a gradient shrinking soliton — a comparison-geometry monotonicity." },
      { id: "thm:nolc2", color: "#d3ecd3", kind: "theorem", label: "§8", name: "No local collapsing II", section: "8", weight: 4, statement: "κ-noncollapsing under a curvature lower bound on a parabolic ball, proved via the reduced volume." },
      { id: "thm:harnack-conj", color: "#d3ecd3", kind: "theorem", label: "(9.1)", name: "Harnack for the conjugate heat equation", section: "9", weight: 3, statement: "For u a conjugate-heat solution, v = [τ(2Δf − |∇f|² + R) + f − n] u satisfies the conjugate heat inequality □*v ≤ 0, hence v ≤ 0." },
      { id: "ext:log-sobolev", kind: "definition", label: "Gross", name: "Gaussian log-Sobolev inequality", section: "3", weight: 2, external: true, ref: "L. Gross", statement: "The Gaussian logarithmic Sobolev inequality, used to control μ(g,τ) as τ → 0 and in the pseudolocality argument." },
      { id: "thm:pseudoloc", color: "#d3ecd3", kind: "theorem", label: "§10", name: "Pseudolocality theorem", section: "10", weight: 4, statement: "A region that is almost Euclidean at t = 0 (scalar curvature bounded below, near-Euclidean isoperimetric constant) stays curvature-controlled for a definite time, regardless of far-away geometry." },
      { id: "ext:hamilton-harnack", kind: "theorem", label: "Harnack", name: "Hamilton's differential Harnack", section: "11", weight: 2, external: true, ref: "R. Hamilton", statement: "The trace differential Harnack inequality for solutions with nonnegative curvature operator." },
      { id: "ext:hamilton-ivey", kind: "theorem", label: "Ivey", name: "Hamilton–Ivey pinching", section: "12", weight: 2, external: true, ref: "Ivey; Hamilton", statement: "In dimension 3, where scalar curvature is large the negative curvature is small, so blow-up limits have nonnegative sectional curvature." },
      { id: "thm:kappa-sol", color: "#f7dcc0", kind: "theorem", label: "§11", name: "Ancient κ-solutions", section: "11", weight: 4, statement: "Nonnegatively curved, κ-noncollapsed ancient solutions (with bounded entropy) form a compact family modulo scaling; these are the blow-up limits of finite-time singularities." },
      { id: "thm:canon-nbhd", color: "#f7dcc0", kind: "theorem", label: "§12", name: "Canonical neighborhood theorem", section: "12", weight: 5, statement: "In dimension 3 under almost-nonnegative curvature, every point of high scalar curvature lies in a neck or cap modeled on an ancient κ-solution.", plain: "A structure theorem: near a 3-dimensional singularity the geometry looks like a standard cylinder or cap." },
      { id: "thm:thickthin", color: "#f7dcc0", kind: "theorem", label: "§13", name: "Thick–thin decomposition", section: "13", weight: 4, statement: "For large times the manifold splits into a thick part converging to a hyperbolic piece with incompressible cusps and a thin part that collapses to a graph manifold." },
      { id: "goal:geometrization", color: "#f7dcc0", kind: "theorem", label: "§13", name: "Geometrization program", section: "13", weight: 5, statement: "Ricci flow with surgery realises Hamilton's program, yielding Thurston's geometrization (and hence the Poincaré conjecture) for closed 3-manifolds.", plain: "The target: every closed 3-manifold decomposes into geometric pieces — the Poincaré conjecture is a special case." }
    ],
    edges: [
      { from: "ext:ricci-flow", to: "func:F", type: "uses" },
      { from: "func:F", to: "func:W", type: "generalizes" },
      { from: "func:F", to: "thm:no-breathers", type: "uses" },
      { from: "func:W", to: "thm:monotone", type: "uses" },
      { from: "ext:ricci-flow", to: "thm:monotone", type: "uses" },
      { from: "thm:monotone", to: "thm:no-breathers", type: "uses" },
      { from: "def:soliton", to: "thm:no-breathers", type: "uses" },
      { from: "ext:log-sobolev", to: "thm:no-breathers", type: "uses" },
      { from: "func:W", to: "thm:nolc1", type: "uses" },
      { from: "thm:monotone", to: "thm:nolc1", type: "uses" },
      { from: "def:kappa", to: "thm:nolc1", type: "uses" },
      { from: "ext:ricci-flow", to: "def:Llength", type: "uses" },
      { from: "def:Llength", to: "def:redvol", type: "uses" },
      { from: "def:Llength", to: "thm:redvol-mono", type: "uses" },
      { from: "def:redvol", to: "thm:redvol-mono", type: "uses" },
      { from: "def:kappa", to: "thm:nolc2", type: "uses" },
      { from: "thm:redvol-mono", to: "thm:nolc2", type: "uses" },
      { from: "thm:monotone", to: "thm:harnack-conj", type: "uses" },
      { from: "def:Llength", to: "thm:harnack-conj", type: "uses" },
      { from: "thm:harnack-conj", to: "thm:pseudoloc", type: "uses" },
      { from: "ext:log-sobolev", to: "thm:pseudoloc", type: "uses" },
      { from: "ext:hamilton-harnack", to: "thm:kappa-sol", type: "uses" },
      { from: "ext:hamilton-ivey", to: "thm:kappa-sol", type: "uses" },
      { from: "thm:nolc1", to: "thm:kappa-sol", type: "uses" },
      { from: "thm:redvol-mono", to: "thm:kappa-sol", type: "uses" },
      { from: "def:kappa", to: "thm:kappa-sol", type: "uses" },
      { from: "thm:kappa-sol", to: "thm:canon-nbhd", type: "uses" },
      { from: "ext:hamilton-ivey", to: "thm:canon-nbhd", type: "uses" },
      { from: "thm:pseudoloc", to: "thm:canon-nbhd", type: "uses" },
      { from: "thm:canon-nbhd", to: "thm:thickthin", type: "uses" },
      { from: "thm:nolc2", to: "thm:thickthin", type: "uses" },
      { from: "thm:canon-nbhd", to: "goal:geometrization", type: "uses" },
      { from: "thm:thickthin", to: "goal:geometrization", type: "uses" },
      { from: "ext:ricci-flow", to: "goal:geometrization", type: "uses" }
    ]
  };
  if (typeof g.PaperDiagramData === "object" && g.PaperDiagramData) g.PaperDiagramData["perelman-ricci"] = D;
  else g.PaperDiagramData = { "perelman-ricci": D };
  if (typeof module !== "undefined" && module.exports) module.exports = D;
})(typeof window !== "undefined" ? window : globalThis);
