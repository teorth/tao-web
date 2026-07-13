// Library diagram for the paper-diagram viewer — lazy-loaded on demand.
// A counterexample to the periodic tiling conjecture, Rachel Greenfeld & Terence Tao,
// arXiv:2211.15847; Ann. of Math. (2) 200(1): 301–363 (2024).
// Hand-encoded logical skeleton, following the paper's own Figure 1.1 (and the
// Figure 9.1 Sudoku analysis). Node BACKGROUND COLOURS mirror the paper's scheme:
//   blue  = the aperiodic "Sudoku puzzle" and its 2-adic machinery (Secs 7–9),
//   yellow = the library of (weakly) expressible properties (Secs 4–6),
//   green = the tiling-side constructions and the final counterexamples (Secs 1–4).
// An edge points from a prerequisite to the result whose proof uses it.
;(function (g) {
  var BLUE = "#dce8fb", YELLOW = "#fbf0c4", GREEN = "#d3ecd3";
  var D = {
    format: "paper-diagram",
    schemaVersion: 1,
    meta: {
      title: "A counterexample to the periodic tiling conjecture",
      paper: {
        authors: ["Rachel Greenfeld", "Terence Tao"],
        year: 2022,
        arxiv: "2211.15847",
        note: "Ann. of Math. (2) 200(1): 301–363 (2024)."
      },
      generatedBy: "hand",
      date: "2026-07-13",
      note: "Colours follow the paper's Figure 1.1. A rigid 'Sudoku puzzle' (blue) whose lines must be rescaled 2-adic digit functions is solvable but only non-periodically (Thm 7.8, via a self-similar 'Tetris' infinite descent). Assembled from a library of (weakly) expressible functional-equation properties (yellow), it becomes an aperiodic weakly expressible property, which converts through functional and tiling equations (green) into a single aperiodic tile in Z²×G0, then in Z^d, then a shape in R^d — disproving the discrete and continuous periodic tiling conjectures."
    },
    layout: { engine: "layered", direction: "up" },
    nodes: [
      // ---- blue: the Sudoku puzzle and its 2-adic machinery (Secs 7–9) ----
      { id: "def:fq", kind: "definition", label: "(1.2)", name: "2-adic digit function f_q", section: "7", weight: 3, color: BLUE, statement: "f_q(n) = the final non-zero digit of n in base q = 2^{s₀}: f_q(qⁿm) = m mod q. A limit-periodic, 'approximately affine' function with f_q(qn) = f_q(n)." },
      { id: "def:SN", kind: "definition", label: "Def 7.3", name: "Structured sequences S[N]", section: "7", weight: 3, color: BLUE, statement: "S[N] = { n ↦ c·f_q(an + b) : c odd }: the rescaled copies of f_q along a line of N cells." },
      { id: "def:sudoku", kind: "definition", label: "Def 7.4", name: "The Sudoku puzzle", section: "7", weight: 4, color: BLUE, statement: "Fill the board {1,…,N}×Z with digits in Z/qZ\\{0} so that every non-vertical line lies in S[N]; 'good columns' means each column is a periodized permutation.", plain: "A Sudoku-like puzzle whose every row and diagonal must be a rescaled 2-adic digit function." },
      { id: "lem:8.1", kind: "lemma", label: "Lem 8.1", name: "Statistics of a 2-adic function", section: "8", weight: 3, color: BLUE, statement: "Each g ∈ S[N] carries an order, step, bad coset (a coset of (q/2^{ord})Z) and an associated affine function it agrees with off the bad coset." },
      { id: "prop:8.2", kind: "proposition", label: "Prop 8.2/8.3", name: "Rigidity off the bad coset", section: "8", weight: 3, color: BLUE, statement: "An element of S[N] agreeing with an affine function on 8 consecutive cells (off the bad coset) agrees with it on the whole line; the statistics are well-defined." },
      { id: "lem:9.1", kind: "lemma", label: "Lem 9.1", name: "Good columns ⇒ weak equidistribution", section: "9", weight: 2, color: BLUE, statement: "A Sudoku solution with good columns has each digit appearing with upper density at most 2/q." },
      { id: "lem:9.2", kind: "lemma", label: "Lem 9.2", name: "High-order lines are rare", section: "9", weight: 2, color: BLUE, statement: "Weak digit equidistribution forces the lines of order o to have upper density at most 2^{1−o}." },
      { id: "prop:9.4", kind: "proposition", label: "Prop 9.4", name: "Pseudo-affine structure", section: "9", weight: 3, color: BLUE, statement: "A weakly-equidistributed Sudoku solution agrees, off its zero set, with one pseudo-affine function Ψ(n,m) = An + Bm + C + D(q/4)m(m−n)." },
      { id: "prop:9.5", kind: "proposition", label: "Prop 9.5", name: "Odd vertical coefficient", section: "9", weight: 3, color: BLUE, statement: "If the solution has good columns then the vertical coefficient B of Ψ is odd." },
      { id: "prop:9.6", kind: "proposition", label: "Prop 9.6", name: "Normal form", section: "9", weight: 2, color: BLUE, statement: "After a shear, the solution equals m + D(q/4)m(m−n) off the columns qZ." },
      { id: "prop:9.7", kind: "proposition", label: "Prop 9.7", name: "Tetris move (infinite descent)", section: "9", weight: 4, color: BLUE, statement: "The 'Tetris move' F(n,m) ↦ F(n,qm) sends a normal-form solution to a normal-form solution whose period is q times smaller — an infinite descent.", plain: "A self-similar move shrinks any period by a factor of q, so no periodic solution can exist." },
      { id: "thm:7.8", kind: "theorem", label: "Thm 7.8", name: "Sudoku with good columns is non-periodic", section: "7", weight: 5, color: BLUE, statement: "For q = 2^{s₀} large, every Sudoku solution with good columns is non-periodic.", plain: "The crux: the puzzle can be solved, but only in a self-similar, non-periodic way." },

      // ---- yellow: the library of (weakly) expressible properties (Secs 4–6) ----
      { id: "def:express", kind: "definition", label: "Def 4.4/4.15", name: "(Weakly) expressible properties", section: "4", weight: 3, color: YELLOW, statement: "A property of α: G → H is expressible if it is the solution set of a system of functional equations ⊎_j (α(x+h_j) + E_j) = H; weakly expressible if it is an existential projection of an expressible one." },
      { id: "lem:4.22", kind: "lemma", label: "Lem 4.22", name: "Closure primitives", section: "4", weight: 3, color: YELLOW, statement: "(Weak) expressibility is closed under lifts, pullbacks, conjunction and existential quantification — the routines from which the library is 'programmed'." },
      { id: "cor:5.5", kind: "corollary", label: "Cor 5.4/5.5", name: "Periodicity & linear constraints", section: "5", weight: 2, color: YELLOW, statement: "Constancy modulo a subgroup is expressible; hence G′-periodicity of a function, and any linear relation Σ cᵢ αᵢ = const among the coordinate functions." },
      { id: "prop:6.5", kind: "proposition", label: "Prop 6.5", name: "Compatible boolean functions", section: "6", weight: 3, color: YELLOW, statement: "That several functions are compatibly boolean (share a common two-element value set) is weakly expressible in a 2-group Z/2^M Z; oddness of the odd elements is used to force compatibility." },
      { id: "prop:6.7", kind: "proposition", label: "Prop 6.7", name: "Arbitrary boolean constraints P_Ω", section: "6", weight: 3, color: YELLOW, statement: "For any symmetric Ω ⊆ {0,1}^W, the pointwise constraint (α̃₁,…,α̃_W)(x) ∈ Ω is weakly expressible.", plain: "Encode an arbitrary pointwise truth table on the boolean functions." },
      { id: "prop:6.9", kind: "proposition", label: "Prop 6.9", name: "Boolean periodized permutation", section: "6", weight: 2, color: YELLOW, statement: "That a boolean tuple runs through every value of {0,1}^W along a direction is weakly expressible — a permutation-like non-degeneracy." },
      { id: "enc:sudoku", kind: "proposition", label: "§7", name: "Encoded Sudoku is weakly expressible", section: "7", weight: 4, color: YELLOW, statement: "Via a projective-duality change of variables (lines ↔ points) and the library, 'F is a Sudoku solution with good columns' becomes a weakly expressible property of boolean functions on Z²×G1.", plain: "The whole puzzle is assembled from library pieces as one weakly expressible property." },

      // ---- green: the tiling-side constructions and the counterexamples (Secs 1–4) ----
      { id: "thm:4.16", kind: "theorem", label: "Thm 4.16", name: "Aperiodic weakly expressible property", section: "4", weight: 5, color: GREEN, statement: "There is a weakly expressible (Z²×G1, ·)-property that is satisfiable but only by non-periodic functions." },
      { id: "thm:4.13", kind: "theorem", label: "Thm 4.13", name: "Aperiodic expressible property (tuple)", section: "4", weight: 3, color: GREEN, statement: "An aperiodic weakly expressible property upgrades to an aperiodic EXPRESSIBLE property of a tuple, by absorbing the existential quantifiers into extra coordinate functions." },
      { id: "thm:4.10", kind: "theorem", label: "Thm 4.10", name: "Aperiodic expressible property", section: "4", weight: 4, color: GREEN, statement: "There exist finite abelian groups G1, H and an expressible, aperiodic (Z²×G1, H)-property." },
      { id: "thm:4.1", kind: "theorem", label: "Thm 4.1", name: "Functional ⇒ tiling equations", section: "4", weight: 4, color: GREEN, statement: "An aperiodic system of functional equations becomes an aperiodic system of tiling equations: a 'vertical line test' equation forces the tiling set to be the graph of a function." },
      { id: "thm:3.4", kind: "theorem", label: "Thm 3.4", name: "Aperiodic tiling system in Z²×G1", section: "3", weight: 4, color: GREEN, statement: "There is an aperiodic SYSTEM F₁,…,F_M of tiling equations in Z²×G1 — the 'multiple' periodic tiling conjecture fails." },
      { id: "lem:3.2", kind: "lemma", label: "Lem 3.2", name: "Rigid partition of a 2-group", section: "3", weight: 2, color: GREEN, statement: "A partition Z/NZ = E₁ ⊎ … ⊎ E_M with Eᵢ ∩ (E_j + h) ≠ ∅ for every h ≠ 0 (probabilistic construction; N = O(M² log M))." },
      { id: "thm:3.1", kind: "theorem", label: "Thm 3.1", name: "System ⇒ single tiling equation", section: "3", weight: 4, color: GREEN, statement: "An aperiodic system A⊕F_m = G concatenates into a SINGLE aperiodic tiling equation Ã⊕F̃ = G×Z/NZ that tiles the whole group." },
      { id: "thm:1.4", kind: "theorem", label: "Thm 1.4", name: "Aperiodic monotile in Z²×G0", section: "1", weight: 5, color: GREEN, statement: "There is a finite tile F ⊂ Z²×G0 (G0 a finite abelian 2-group) with A⊕F = Z²×G0 aperiodic — the discrete periodic tiling conjecture is FALSE.", plain: "One tile that tiles Z²×G0 only aperiodically — disproving the periodic tiling conjecture." },
      { id: "ext:mss", kind: "theorem", label: "[MSS22]", name: "Quotient pullback", section: "1", weight: 2, color: GREEN, external: true, ref: "Meyerovitch–Sanadhya–Solomon", statement: "A tiling of a quotient Z^d/Λ pulls back to a tiling of Z^d, so aperiodicity in Z²×G0 (a quotient of Z^d) descends to Z^d." },
      { id: "cor:1.6", kind: "corollary", label: "Cor 1.6", name: "Aperiodic tiling in Z^d", section: "1", weight: 5, color: GREEN, statement: "For sufficiently large d, a finite F ⊂ Z^d with A⊕F = Z^d aperiodic — the discrete conjecture fails in a genuine lattice." },
      { id: "thm:2.1", kind: "theorem", label: "Thm 2.1", name: "Discrete ⇒ continuous (rigid tile)", section: "2", weight: 4, color: GREEN, statement: "A rigid 'jigsaw' tile R_d (with Z^d⊕R_d = R^d and only lattice tilings) lifts a discrete aperiodic tiling to a continuous one Σ = F⊕R_d in R^d." },
      { id: "cor:1.7", kind: "corollary", label: "Cor 1.7", name: "Aperiodic tiling in R^d", section: "1", weight: 5, color: GREEN, statement: "For sufficiently large d, a bounded measurable Σ ⊂ R^d tiles R^d only aperiodically — the CONTINUOUS periodic tiling conjecture is false.", plain: "The end result: a shape that tiles Euclidean space, but never periodically." }
    ],
    edges: [
      // blue: Sudoku / 2-adic machinery → Thm 7.8
      { from: "def:fq", to: "def:SN", type: "uses" },
      { from: "def:SN", to: "def:sudoku", type: "uses" },
      { from: "def:SN", to: "lem:8.1", type: "uses" },
      { from: "lem:8.1", to: "prop:8.2", type: "uses" },
      { from: "def:sudoku", to: "lem:9.1", type: "uses" },
      { from: "lem:9.1", to: "lem:9.2", type: "uses" },
      { from: "lem:9.2", to: "prop:9.4", type: "uses" },
      { from: "prop:8.2", to: "prop:9.4", type: "uses" },
      { from: "prop:9.4", to: "prop:9.5", type: "uses" },
      { from: "prop:9.4", to: "prop:9.6", type: "uses" },
      { from: "prop:9.5", to: "prop:9.6", type: "uses" },
      { from: "prop:9.6", to: "prop:9.7", type: "uses" },
      { from: "prop:9.4", to: "prop:9.7", type: "uses" },
      { from: "prop:9.7", to: "thm:7.8", type: "uses" },

      // yellow: library → encoded Sudoku
      { from: "def:express", to: "lem:4.22", type: "uses" },
      { from: "lem:4.22", to: "cor:5.5", type: "uses" },
      { from: "lem:4.22", to: "prop:6.5", type: "uses" },
      { from: "cor:5.5", to: "prop:6.5", type: "uses" },
      { from: "prop:6.5", to: "prop:6.7", type: "uses" },
      { from: "prop:6.5", to: "prop:6.9", type: "uses" },
      { from: "cor:5.5", to: "prop:6.7", type: "uses" },
      { from: "prop:6.7", to: "enc:sudoku", type: "uses" },
      { from: "prop:6.9", to: "enc:sudoku", type: "uses" },
      { from: "cor:5.5", to: "enc:sudoku", type: "uses" },
      { from: "def:SN", to: "enc:sudoku", type: "uses" },

      // bridge → Thm 4.16 (aperiodic weakly expressible property)
      { from: "enc:sudoku", to: "thm:4.16", type: "uses" },
      { from: "thm:7.8", to: "thm:4.16", type: "uses" },

      // green: the tiling-side spine (Fig 1.1)
      { from: "thm:4.16", to: "thm:4.13", type: "uses" },
      { from: "thm:4.13", to: "thm:4.10", type: "uses" },
      { from: "def:express", to: "thm:4.1", type: "uses" },
      { from: "thm:4.10", to: "thm:3.4", type: "uses" },
      { from: "thm:4.1", to: "thm:3.4", type: "uses" },
      { from: "lem:3.2", to: "thm:3.1", type: "uses" },
      { from: "thm:3.4", to: "thm:1.4", type: "uses" },
      { from: "thm:3.1", to: "thm:1.4", type: "uses" },
      { from: "thm:1.4", to: "cor:1.6", type: "uses" },
      { from: "ext:mss", to: "cor:1.6", type: "uses" },
      { from: "cor:1.6", to: "cor:1.7", type: "uses" },
      { from: "thm:2.1", to: "cor:1.7", type: "uses" }
    ]
  };
  if (typeof g.PaperDiagramData === "object" && g.PaperDiagramData) g.PaperDiagramData["2211.15847"] = D;
  else g.PaperDiagramData = { "2211.15847": D };
  if (typeof module !== "undefined" && module.exports) module.exports = D;
})(typeof window !== "undefined" ? window : globalThis);
