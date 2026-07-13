// Library diagram for the paper-diagram viewer — lazy-loaded on demand.
// Modular elliptic curves and Fermat's Last Theorem, Andrew Wiles,
// Annals of Mathematics 141 (1995), 443–551.
// Hand-encoded logical skeleton: the modularity-lifting machinery (deformation
// rings ↔ Hecke rings) and the deduction of Fermat's Last Theorem. An edge points
// from a prerequisite to the result whose proof uses it. Weights (1–5) are editorial.
;(function (g) {
  var D = {
    format: "paper-diagram",
    schemaVersion: 1,
    meta: {
      title: "Modular elliptic curves and Fermat's Last Theorem",
      paper: {
        authors: ["Andrew Wiles"],
        year: 1995,
        note: "Annals of Mathematics 141 (1995), 443–551."
      },
      generatedBy: "hand",
      date: "2026-07-13",
      note: "The engine is the identification R_D ≅ T_D of a Galois deformation ring with a Hecke ring, reduced (Thm 2.17) to a numerical criterion, verified at minimal level via a Selmer-group bound plus the Taylor–Wiles patching, and bootstrapped from mod-3 modularity (Langlands–Tunnell) through the 3–5 switch to all semistable curves; Ribet's theorem then gives Fermat."
    },
    layout: { engine: "layered", direction: "up" },
    nodes: [
      { id: "def:deformation", color: "#dce8fb", kind: "definition", label: "Ch. 1", name: "Galois deformation ring R_D", section: "1", weight: 4, statement: "Mazur's deformation theory: the lifts of a residual representation ρ₀: Gal(Q_Σ/Q) → GL₂(k) of a fixed type D are represented by a universal deformation ring R_D.", plain: "A single ring R_D that parametrises all Galois representations reducing to ρ₀ and satisfying the chosen local conditions." },
      { id: "def:selmer", color: "#dce8fb", kind: "definition", label: "(1.6)", name: "Selmer group H¹_D", section: "1", weight: 3, statement: "A Selmer group H¹_D(Q_Σ/Q, V) cutting out deformations of type D by local conditions at p and at the ramified primes." },
      { id: "prop:1.2", color: "#dce8fb", kind: "proposition", label: "Prop 1.2", name: "Cotangent space = Selmer group", section: "1", weight: 3, statement: "The reduced cotangent space of R_D is a Selmer group: Hom(p_D/p_D², K/O) ≅ H¹_D(Q_Σ/Q, V)." },
      { id: "prop:1.6", color: "#dce8fb", kind: "proposition", label: "Prop 1.6", name: "Selmer order formula (Poitou–Tate)", section: "1", weight: 3, statement: "A Greenberg–Wiles formula from Poitou–Tate duality relating the orders of dual Selmer groups as the ramification set varies." },
      { id: "lem:1.10", color: "#dce8fb", kind: "lemma", label: "Lem 1.10", name: "Group theory of im ρ₀ / special primes", section: "1", weight: 2, statement: "Group-theoretic facts about im ρ₀ producing the auxiliary primes q (with q ≡ 1 mod p and ρ₀(Frob q) having distinct eigenvalues) used to bound the Selmer group." },
      { id: "ext:eichler-shimura", kind: "theorem", label: "Thm 0.1", name: "Galois reps from modular forms", section: "0", weight: 3, external: true, ref: "Eichler–Shimura–Deligne", statement: "To each weight-2 eigenform f and prime λ there is a Galois representation ρ_{f,λ}: Gal(Q̄/Q) → GL₂(O_{f,λ}) with trace ρ_{f,λ}(Frob q) = c(q,f)." },
      { id: "thm:2.1", color: "#fbf0c4", kind: "theorem", label: "Thm 2.1", name: "Hecke rings are Gorenstein (multiplicity one)", section: "2", weight: 3, statement: "Mazur's multiplicity-one theorem: the Hecke ring localised at a maximal ideal is Gorenstein, so it carries a perfect self-duality." },
      { id: "def:hecke", color: "#fbf0c4", kind: "definition", label: "Ch. 2", name: "Hecke ring T_D", section: "2", weight: 3, statement: "The Hecke ring T_D acting on modular forms, carrying a Galois representation with trace(Frob q) = T_q." },
      { id: "def:eta", color: "#fbf0c4", kind: "definition", label: "Ch. 2 §2", name: "Congruence invariant η", section: "2", weight: 3, statement: "The invariant η measuring congruences between the eigenform f and other modular forms, defined through the Gorenstein self-duality of T_D." },
      { id: "map:phi", color: "#fbf0c4", kind: "proposition", label: "φ_D", name: "The map R_D → T_D", section: "2", weight: 4, statement: "A canonical surjection φ_D: R_D → T_D taking the universal deformation to the Galois representation carried by the Hecke ring." },
      { id: "app:ci", color: "#e7dcf5", kind: "theorem", label: "Appendix", name: "Complete-intersection criterion", section: "A", weight: 3, statement: "Commutative algebra: a Gorenstein O-algebra is a complete intersection exactly when its η-invariant equals its p/p²-invariant; the two are compared through Fitting ideals." },
      { id: "thm:2.17", color: "#fbf0c4", kind: "theorem", label: "Thm 2.17", name: "Numerical criterion for R = T", section: "2", weight: 4, statement: "If #(O/η) ≥ #(p_R/p_R²) then φ_D is an isomorphism and T_D is a complete intersection." },
      { id: "ext:tw", kind: "theorem", label: "[TW]", name: "Taylor–Wiles patching", section: "3", weight: 4, external: true, ref: "Taylor–Wiles, Ann. of Math. 141 (1995)", statement: "A patching argument gluing Hecke rings at auxiliary levels into a power series ring, proving the minimal Hecke ring is a complete intersection (so t = 1)." },
      { id: "thm:3.1", color: "#f7dcc0", kind: "theorem", label: "Thm 3.1", name: "Selmer bound at minimal level", section: "3", weight: 4, statement: "At minimal level the Selmer group is bounded by #(p_T/p_T²)·c_p; with the complete-intersection input this bound is an equality." },
      { id: "ext:rubin", kind: "theorem", label: "Thm 4.2", name: "Rubin's main conjecture (Kolyvagin)", section: "4", weight: 3, external: true, ref: "Rubin", statement: "The main conjecture of Iwasawa theory for imaginary quadratic fields, proved by Rubin using Kolyvagin's Euler-system method." },
      { id: "thm:4.8", color: "#e7dcf5", kind: "theorem", label: "Thm 4.8", name: "The CM / dihedral case", section: "4", weight: 3, statement: "R_D ≅ T_D when ρ₀ is induced from a character of an imaginary quadratic field, established via elliptic units and Rubin's theorem." },
      { id: "thm:3.3", color: "#f7dcc0", kind: "theorem", label: "Thm 3.3", name: "R_D ≅ T_D for all D", section: "3", weight: 5, statement: "The Mazur–Tilouine identification (Conjecture 2.16): the deformation ring equals the Hecke ring for every admissible type D.", plain: "The technical heart: for a modular residual representation, its universal deformation ring is the Hecke ring — every allowed lift is modular." },
      { id: "thm:0.2", color: "#d3ecd3", kind: "theorem", label: "Thm 0.2", name: "Modularity lifting", section: "0", weight: 5, statement: "If ρ₀ is modular, irreducible and satisfies the local hypotheses, then every lift ρ of the conjectural type comes from a modular form.", plain: "If the mod-p reduction of a Galois representation is modular, so is the representation itself." },
      { id: "ext:langlands-tunnell", kind: "theorem", label: "Thm 5.1", name: "Langlands–Tunnell theorem", section: "5", weight: 4, external: true, ref: "Langlands, Tunnell", statement: "A continuous odd irreducible ρ: Gal(Q̄/Q) → GL₂(C) with solvable image is modular. Since PGL₂(F₃) ≅ S₄ is solvable, the mod-3 representation of any elliptic curve is modular.", plain: "The base case: modularity of the mod-3 representation, because its image is solvable." },
      { id: "thm:0.3", color: "#d3ecd3", kind: "theorem", label: "Thm 0.3", name: "3-adic modularity of E", section: "0", weight: 4, statement: "If E/Q has good or multiplicative reduction at 3 and irreducible mod-3 representation, then E is modular." },
      { id: "thm:35", color: "#e7dcf5", kind: "proposition", label: "Thm 5.2", name: "The 3–5 switch", section: "5", weight: 4, statement: "When the mod-3 representation of E is reducible, exhibit an auxiliary elliptic curve sharing E's mod-5 representation and modular by the mod-3 argument; this forces the mod-5 representation of E to be modular." },
      { id: "ext:ribet", kind: "theorem", label: "Thm 2.14", name: "Ribet's level lowering (ε-conjecture)", section: "0", weight: 4, external: true, ref: "Frey, Serre, Ribet", statement: "Modularity of the Frey curve yⁿ = x(x−aⁿ)(x+bⁿ) would force a nonexistent weight-2 form of level 2, so modularity of semistable elliptic curves implies Fermat's Last Theorem.", plain: "Frey–Serre–Ribet: reduces Fermat's Last Theorem to modularity of semistable elliptic curves." },
      { id: "thm:0.4", color: "#d3ecd3", kind: "theorem", label: "Thm 0.4", name: "Semistable elliptic curves are modular", section: "0", weight: 5, statement: "Every semistable elliptic curve over Q is modular.", plain: "The main theorem of the paper." },
      { id: "thm:0.5", color: "#d3ecd3", kind: "theorem", label: "Thm 0.5", name: "Fermat's Last Theorem", section: "0", weight: 5, statement: "There are no nonzero integers a, b, c with aⁿ + bⁿ = cⁿ for any integer n > 2.", plain: "The 350-year-old conjecture, obtained as a corollary." }
    ],
    edges: [
      { from: "def:deformation", to: "def:selmer", type: "uses" },
      { from: "def:deformation", to: "prop:1.2", type: "uses" },
      { from: "def:selmer", to: "prop:1.2", type: "uses" },
      { from: "def:selmer", to: "prop:1.6", type: "uses" },
      { from: "def:deformation", to: "map:phi", type: "uses" },
      { from: "ext:eichler-shimura", to: "thm:2.1", type: "uses" },
      { from: "ext:eichler-shimura", to: "def:hecke", type: "uses" },
      { from: "thm:2.1", to: "def:hecke", type: "uses" },
      { from: "thm:2.1", to: "def:eta", type: "uses" },
      { from: "thm:2.1", to: "map:phi", type: "uses" },
      { from: "def:hecke", to: "map:phi", type: "uses" },
      { from: "prop:1.2", to: "thm:2.17", type: "uses" },
      { from: "def:eta", to: "thm:2.17", type: "uses" },
      { from: "map:phi", to: "thm:2.17", type: "uses" },
      { from: "app:ci", to: "thm:2.17", type: "uses" },
      { from: "prop:1.6", to: "thm:3.1", type: "uses" },
      { from: "lem:1.10", to: "thm:3.1", type: "uses" },
      { from: "def:selmer", to: "thm:3.1", type: "uses" },
      { from: "ext:tw", to: "thm:3.1", type: "uses" },
      { from: "thm:2.17", to: "thm:3.3", type: "uses" },
      { from: "thm:3.1", to: "thm:3.3", type: "uses" },
      { from: "ext:tw", to: "thm:3.3", type: "uses" },
      { from: "ext:rubin", to: "thm:4.8", type: "uses" },
      { from: "def:eta", to: "thm:4.8", type: "uses" },
      { from: "thm:4.8", to: "thm:3.3", type: "uses" },
      { from: "thm:3.3", to: "thm:0.2", type: "uses" },
      { from: "ext:langlands-tunnell", to: "thm:0.3", type: "uses" },
      { from: "thm:0.2", to: "thm:0.3", type: "uses" },
      { from: "thm:0.3", to: "thm:0.4", type: "uses" },
      { from: "thm:0.2", to: "thm:35", type: "uses" },
      { from: "thm:0.3", to: "thm:35", type: "uses" },
      { from: "thm:35", to: "thm:0.4", type: "uses" },
      { from: "thm:0.4", to: "thm:0.5", type: "uses" },
      { from: "ext:ribet", to: "thm:0.5", type: "uses" }
    ]
  };
  if (typeof g.PaperDiagramData === "object" && g.PaperDiagramData) g.PaperDiagramData["wiles-flt"] = D;
  else g.PaperDiagramData = { "wiles-flt": D };
  if (typeof module !== "undefined" && module.exports) module.exports = D;
})(typeof window !== "undefined" ? window : globalThis);
