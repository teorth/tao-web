// Library diagram for the paper-diagram viewer — lazy-loaded on demand.
// Kakeya set conjecture in R³ (Wang–Zahl, 2025, arXiv:2502.17655).
// Hand-encoded logical skeleton; an edge points from a prerequisite to the
// result whose proof uses it.
;(function (g) {
  var D = {
    "format": "paper-diagram",
    "schemaVersion": 1,
    "meta": {
      "title": "Volume estimates for unions of convex sets, and the Kakeya set conjecture in three dimensions",
      "paper": {
        "arxiv": "2502.17655",
        "authors": [
          "Hong Wang",
          "Joshua Zahl"
        ],
        "year": 2025
      },
      "generatedBy": "hand",
      "date": "2026-07-13",
      "note": "Hand-encoded logical skeleton of the Wang–Zahl resolution of the Kakeya set conjecture in R^3. Nodes are the main theorems, key propositions, definitions and lemmas; an edge points from a prerequisite to the result whose proof uses it. Weights (1–5) are an editorial reading of each statement's role. This is a backbone, not every lemma."
    },
    "layout": {
      "engine": "layered",
      "direction": "up"
    },
    "nodes": [
      {
        "id": "thm:1.1",
        "kind": "theorem",
        "label": "Thm 1.1",
        "name": "Kakeya set conjecture in R³",
        "section": "1",
        "weight": 5,
        "statement": "Every Kakeya set in ℝ³ has Minkowski and Hausdorff dimension 3.",
        "plain": "Every Kakeya set in three-dimensional space is as large (dimension 3) as the whole space — the Kakeya set conjecture, in three dimensions."
      },
      {
        "id": "thm:1.2",
        "kind": "theorem",
        "label": "Thm 1.2",
        "name": "Maximal-type volume estimate",
        "section": "1",
        "weight": 5,
        "statement": "For every ε>0 there is K so that whenever a family of δ-tubes obeys the Wolff non-clustering axioms and each tube carries a shading Y(T) of relative size ≥ λ, the union has volume ≥ δ^ε λ^K · Σ|T|.",
        "plain": "A quantitative Kakeya maximal-function-type inequality; Theorem 1.1 is a corollary of it."
      },
      {
        "id": "thm:1.9",
        "kind": "theorem",
        "label": "Thm 1.9",
        "name": "D(0,0) and E(0,0) hold",
        "section": "1.3",
        "weight": 5,
        "statement": "The assertions D(0,0) and E(0,0) are true."
      },
      {
        "id": "cor:1.10",
        "kind": "corollary",
        "label": "Cor 1.10",
        "name": "Volume estimate (1.4)",
        "section": "1.3",
        "weight": 3,
        "statement": "For any λ-dense tube family, |∪ Y(T)| ≥ δ^ε λ^K m⁻¹ (#𝕋)|T|, where m is the Katz–Tao convex Wolff constant."
      },
      {
        "id": "thm:1.12",
        "kind": "theorem",
        "label": "Thm 1.12",
        "name": "Tube Doubling Conjecture in R³",
        "section": "1.6",
        "weight": 3,
        "statement": "The tube-doubling conjecture holds in ℝ³: dilating the tubes by a factor R enlarges the union by at most δ^(−ε) R³."
      },
      {
        "id": "thm:1.14",
        "kind": "theorem",
        "label": "Thm 1.14",
        "name": "Keleti line-segment extension in R³",
        "section": "1.6",
        "weight": 3,
        "statement": "Keleti's line-segment extension conjecture holds in ℝ³: extending segments to full lines does not change the dimension of their union."
      },
      {
        "id": "def:wolff",
        "kind": "definition",
        "label": "Def 1.3",
        "name": "Wolff axioms (Katz–Tao / Frostman)",
        "section": "1.2",
        "weight": 3,
        "statement": "Two non-clustering conditions on a tube family: the Katz–Tao convex Wolff constant (few tubes in any convex set) and the Frostman slab Wolff constant (few tubes in any slab)."
      },
      {
        "id": "def:DE",
        "kind": "definition",
        "label": "Def 1.5",
        "name": "Assertions D(σ,ω), E(σ,ω)",
        "section": "1.2",
        "weight": 4,
        "statement": "Two induction-friendly Kakeya volume estimates for shaded tube families; D assumes the Wolff axioms, E carries the constants m and ℓ explicitly. Smaller ω, σ are stronger.",
        "plain": "The central pair of quantitative estimates the whole induction runs on — proving D(0,0)/E(0,0) is equivalent to the Kakeya conjecture."
      },
      {
        "id": "def:Etilde",
        "kind": "definition",
        "label": "Def 5.3",
        "name": "Assertion Ẽ(σ,ω)",
        "section": "5",
        "weight": 2,
        "statement": "The special case of E(σ,ω) in which the Frostman slab constant is ≈ 1."
      },
      {
        "id": "def:F",
        "kind": "definition",
        "label": "Def 5.4",
        "name": "Assertion F(σ,ω)",
        "section": "5",
        "weight": 2,
        "statement": "A generalization of E(σ,ω) with δ-tubes replaced by congruent a×b×1 convex sets (prisms)."
      },
      {
        "id": "def:fcw-scale",
        "kind": "definition",
        "label": "Def 6.1",
        "name": "Frostman convex Wolff axioms at every scale",
        "section": "6",
        "weight": 2,
        "statement": "Near every scale ρ, a balanced cover by ρ-tubes has each rescaled sub-family obeying the Frostman convex Wolff axioms."
      },
      {
        "id": "def:ktcw-scale",
        "kind": "definition",
        "label": "Def 10.1",
        "name": "Katz–Tao convex Wolff axioms at every scale",
        "section": "10",
        "weight": 2,
        "statement": "Near every scale ρ, a balanced ρ-tube cover has small Katz–Tao convex Wolff constant."
      },
      {
        "id": "prop:1.6",
        "kind": "proposition",
        "label": "Prop 1.6",
        "name": "D ⟺ E",
        "section": "1.3",
        "weight": 4,
        "statement": "For 0 ≤ σ ≤ 2/3, the assertions E(σ,ω) and D(σ,ω) are equivalent."
      },
      {
        "id": "prop:1.7",
        "kind": "proposition",
        "label": "Prop 1.7",
        "name": "Self-improvement E ⟹ D(·, ω−g)",
        "section": "1.3",
        "weight": 5,
        "statement": "If E(σ,ω) holds then D(σ, ω − g(σ,ω)) holds, for some gain g > 0.",
        "plain": "The engine of the proof: each pass lowers ω, and combined with Prop 1.6 this drives ω and σ down to 0."
      },
      {
        "id": "prop:1.8",
        "kind": "proposition",
        "label": "Prop 1.8",
        "name": "Base case D(1/2,0)",
        "section": "1.3",
        "weight": 4,
        "statement": "D(1/2,0) is true — essentially Wolff's hairbrush bound (the induction's base case)."
      },
      {
        "id": "lem:4.7",
        "kind": "lemma",
        "label": "Lem 4.7",
        "name": "Iterated graph pruning",
        "section": "4.2",
        "weight": 1,
        "statement": "A bipartite graph has a large induced subgraph in which every vertex has many neighbours."
      },
      {
        "id": "prop:4.6",
        "kind": "proposition",
        "label": "Prop 4.6",
        "name": "Factoring convex sets",
        "section": "4.2",
        "weight": 4,
        "statement": "Any family of congruent convex sets has a cover 𝒲 that factors a large refinement from above (Katz–Tao) and below (Frostman), balanced and almost-partitioning."
      },
      {
        "id": "lem:4.10",
        "kind": "lemma",
        "label": "Lem 4.10",
        "name": "Slab partition into Frostman pieces",
        "section": "4.3",
        "weight": 2,
        "statement": "A refinement of any convex-set family is partitioned by slabs so that each rescaled piece has Frostman slab constant O(1/s)."
      },
      {
        "id": "prop:4.8",
        "kind": "proposition",
        "label": "Prop 4.8",
        "name": "Factoring w.r.t. Frostman slab axioms",
        "section": "4.3",
        "weight": 3,
        "statement": "A refinement splits into non-interacting pieces each obeying the Frostman slab Wolff axioms with error δ^(−ε)."
      },
      {
        "id": "lem:4.11",
        "kind": "lemma",
        "label": "Lem 4.11",
        "name": "Frostman slab constant sub-multiplicative",
        "section": "4.4",
        "weight": 2,
        "statement": "The Frostman slab Wolff constant is sub-multiplicative across a cover."
      },
      {
        "id": "lem:4.12",
        "kind": "lemma",
        "label": "Lem 4.12",
        "name": "Katz–Tao constant sub-multiplicative",
        "section": "4.4",
        "weight": 2,
        "statement": "The Katz–Tao convex Wolff constant is sub-multiplicative across a cover of tubes."
      },
      {
        "id": "lem:5.7",
        "kind": "lemma",
        "label": "Lem 5.7",
        "name": "Córdoba L² bound for slabs",
        "section": "5.1",
        "weight": 2,
        "statement": "A Córdoba-type L² argument bounding from below the volume of a union of slabs."
      },
      {
        "id": "lem:5.10",
        "kind": "lemma",
        "label": "Lem 5.10",
        "name": "Transverse prisms fill a neighbourhood",
        "section": "5.1",
        "weight": 2,
        "statement": "If prisms meet a fixed prism transversely, their union fills a large fraction of its thickened neighbourhood."
      },
      {
        "id": "cor:5.13",
        "kind": "corollary",
        "label": "Cor 5.13",
        "name": "Each prism → thickened tube",
        "section": "5.1",
        "weight": 2,
        "statement": "Each prism, thickened, is essentially a tube whose neighbourhood is filled by the transverse family."
      },
      {
        "id": "lem:5.15",
        "kind": "lemma",
        "label": "Lem 5.15",
        "name": "Prisms cover to transverse tubes",
        "section": "5.2",
        "weight": 2,
        "statement": "After refinement, a prism family is covered so each rescaled piece intersects transversely (θmin large) and obeys the Frostman slab axioms."
      },
      {
        "id": "prop:5.14",
        "kind": "proposition",
        "label": "Prop 5.14",
        "name": "F ⟺ E ⟺ Ẽ",
        "section": "5.2",
        "weight": 3,
        "statement": "The three estimates F(σ,ω), E(σ,ω) and Ẽ(σ,ω) are all equivalent."
      },
      {
        "id": "prop:5.1",
        "kind": "proposition",
        "label": "Prop 5.1",
        "name": "Tubes factoring through flat prisms",
        "section": "5",
        "weight": 3,
        "statement": "If a tube family factors through flat a×b×1 prisms (a ≪ b), its union beats the E(σ,ω) bound by a factor (b/a)^ω."
      },
      {
        "id": "prop:5.2",
        "kind": "proposition",
        "label": "Prop 5.2",
        "name": "Factoring at two scales",
        "section": "5",
        "weight": 3,
        "statement": "A two-scale version of Proposition 5.1."
      },
      {
        "id": "lem:5.17",
        "kind": "lemma",
        "label": "Lem 5.17",
        "name": "Tubes organized into slabs",
        "section": "5.5",
        "weight": 2,
        "statement": "If each tube sits in a δ×b×1 slab meeting the union richly and the Katz–Tao constant is small, the union beats E(σ,ω)."
      },
      {
        "id": "cor:5.19",
        "kind": "corollary",
        "label": "Cor 5.19",
        "name": "Tubes inside ρ-tubes",
        "section": "5.5",
        "weight": 2,
        "statement": "The ρ-tube variant of Lemma 5.17."
      },
      {
        "id": "thm:6.2",
        "kind": "theorem",
        "label": "Thm 6.2",
        "name": "Sticky Kakeya (Frostman CW every scale)",
        "section": "6",
        "weight": 3,
        "external": true,
        "ref": "Wang–Zahl, arXiv:2401.12337",
        "statement": "A family obeying the Frostman convex Wolff axioms at every scale has union of volume ≥ κ δ^ε."
      },
      {
        "id": "prop:6.3",
        "kind": "proposition",
        "label": "Prop 6.3",
        "name": "Factoring trichotomy",
        "section": "6",
        "weight": 3,
        "statement": "After refinement, a tube family either obeys the Frostman convex Wolff axioms at every scale, or factors well at two scales, or is factored by flat prisms."
      },
      {
        "id": "lem:6.4",
        "kind": "lemma",
        "label": "Lem 6.4",
        "name": "Key iteration lemma",
        "section": "6",
        "weight": 4,
        "statement": "If D(σ,ω) and E(σ,ω′) hold, then Ẽ(σ, ω′−α) holds; iterating this gives Proposition 1.6."
      },
      {
        "id": "lem:7.8",
        "kind": "lemma",
        "label": "Lem 7.8",
        "name": "Broad localization of directions",
        "section": "7.1",
        "weight": 1,
        "statement": "Every δ-separated direction set becomes broad when localized inside ρ-caps, for some scale ρ."
      },
      {
        "id": "cor:7.10",
        "kind": "corollary",
        "label": "Cor 7.10",
        "name": "Finding a broad scale",
        "section": "7.1",
        "weight": 2,
        "statement": "A refinement and a cover 𝕋_ρ so the family is broad relative to it."
      },
      {
        "id": "lem:7.11",
        "kind": "lemma",
        "label": "Lem 7.11",
        "name": "Broad or almost-disjoint",
        "section": "7.1",
        "weight": 2,
        "statement": "Either the union is large, or the family is broad relative to some cover 𝕋_ρ with δ^(1−ω/100) ≤ ρ ≤ δ^(ω/100)."
      },
      {
        "id": "lem:7.14",
        "kind": "lemma",
        "label": "Lem 7.14",
        "name": "Broad ⟹ Frostman slab factoring",
        "section": "7.2",
        "weight": 2,
        "statement": "If broad relative to 𝕋_ρ, then either the union beats E(σ,ω) or 𝕋_ρ factors the family w.r.t. the Frostman slab axioms."
      },
      {
        "id": "prop:7.5",
        "kind": "proposition",
        "label": "Prop 7.5",
        "name": "Two-scale grains decomposition",
        "section": "7",
        "weight": 4,
        "statement": "If E(σ,ω) is tight, the family admits a robust two-scale grains decomposition (grains inside ρ-tubes) obtained by iterating the three Moves of Section 8."
      },
      {
        "id": "prop:7.15",
        "kind": "proposition",
        "label": "Prop 7.15",
        "name": "Guth grains decomposition",
        "section": "7.3",
        "weight": 3,
        "statement": "A broad tube family inside a 1-tube decomposes into δ×c×c grains (a variant of Guth's decomposition, proved via polynomial partitioning in Appendix A)."
      },
      {
        "id": "cor:7.17",
        "kind": "corollary",
        "label": "Cor 7.17",
        "name": "Grains from a broad cover",
        "section": "7.3",
        "weight": 2,
        "statement": "Applying Guth's grains inside each rescaled ρ-tube gives a robust two-scale grains decomposition."
      },
      {
        "id": "lem:7.18",
        "kind": "lemma",
        "label": "Lem 7.18",
        "name": "Guth grains decomposition (iteration base)",
        "section": "7.3",
        "weight": 2,
        "statement": "If E(σ,ω) is tight, the family admits a two-scale (Guth) grains decomposition."
      },
      {
        "id": "lem:8.1",
        "kind": "lemma",
        "label": "Lem 8.1",
        "name": "Move #1 — longer grains",
        "section": "8.1",
        "weight": 2,
        "statement": "Replace grains by longer grains so that c ≥ δ^ζ (ρ/δ)(#𝕋_ρ / #𝕋)."
      },
      {
        "id": "lem:8.2",
        "kind": "lemma",
        "label": "Lem 8.2",
        "name": "Move #2 — square → long grains",
        "section": "8.2",
        "weight": 3,
        "statement": "For square grains, either the union is large or a new decomposition with much longer grains exists."
      },
      {
        "id": "lem:8.3",
        "kind": "lemma",
        "label": "Lem 8.3",
        "name": "Move #3 — wider grains, small local KT-CW",
        "section": "8.3",
        "weight": 3,
        "statement": "Replace grains by wider grains with small local Katz–Tao convex Wolff constant."
      },
      {
        "id": "prop:9.1",
        "kind": "proposition",
        "label": "Prop 9.1",
        "name": "Refined induction on scales",
        "section": "9",
        "weight": 4,
        "statement": "Either the union beats E(σ,ω), or a scale ρ and cover 𝕋_ρ factor the family above and below w.r.t. both Wolff axioms with small error."
      },
      {
        "id": "thm:10.2",
        "kind": "theorem",
        "label": "Thm 10.2",
        "name": "Sticky Kakeya (Katz–Tao CW every scale)",
        "section": "10",
        "weight": 3,
        "statement": "A family obeying the Katz–Tao convex Wolff axioms at every scale has union of volume ≥ κ δ^ε (#𝕋)|T|."
      },
      {
        "id": "prop:10.3",
        "kind": "proposition",
        "label": "Prop 10.3",
        "name": "Nikishin–Stein–Pisier factorization",
        "section": "10.1",
        "weight": 3,
        "statement": "Random rigid motions of a family obeying the Katz–Tao axioms at every scale produce ~ δ^(−2)(#𝕋)^(−1) copies whose union obeys the Frostman axioms at every scale."
      },
      {
        "id": "lem:10.6",
        "kind": "lemma",
        "label": "Lem 10.6",
        "name": "Random rigid motions (single scale)",
        "section": "10.1",
        "weight": 2,
        "statement": "Random rigid motions at one scale keep the Katz–Tao convex Wolff constant of the combined family under control."
      },
      {
        "id": "cor:10.8",
        "kind": "corollary",
        "label": "Cor 10.8",
        "name": "Random rigid motions (cover)",
        "section": "10.1",
        "weight": 2,
        "statement": "The multi-scale (cover) version of Lemma 10.6."
      },
      {
        "id": "lem:11.1",
        "kind": "lemma",
        "label": "Lem 11.1",
        "name": "Multi-scale factoring tower",
        "section": "11",
        "weight": 3,
        "statement": "Either the union beats E(σ,ω), or there is a tower of scales whose covers factor one another above and below w.r.t. both Wolff axioms."
      },
      {
        "id": "lem:11.2",
        "kind": "lemma",
        "label": "Lem 11.2",
        "name": "Reduce to Katz–Tao CW at every scale",
        "section": "11",
        "weight": 3,
        "statement": "Either the union beats E(σ,ω), or a refinement obeys the Katz–Tao convex Wolff axioms at every scale."
      },
      {
        "id": "thm:polypart",
        "kind": "theorem",
        "label": "GK",
        "name": "Guth–Katz polynomial partitioning",
        "section": "A",
        "weight": 2,
        "external": true,
        "ref": "Guth–Katz [13]",
        "statement": "The Guth–Katz polynomial partitioning theorem."
      },
      {
        "id": "prop:A.4",
        "kind": "proposition",
        "label": "Prop A.4",
        "name": "Semialgebraic grains decomposition",
        "section": "A",
        "weight": 2,
        "statement": "An open set is partitioned into thin, bounded-degree semialgebraic grains with controlled tube incidence."
      },
      {
        "id": "lem:A.5",
        "kind": "lemma",
        "label": "Lem A.5",
        "name": "Tube–grain structure",
        "section": "A",
        "weight": 2,
        "statement": "Partition the shaded union into ≤ N sets Eᵢ of small diameter, each met by few tubes."
      },
      {
        "id": "lem:A.6",
        "kind": "lemma",
        "label": "Lem A.6",
        "name": "Planar clustering",
        "section": "A",
        "weight": 2,
        "statement": "A small, broad, dense tube arrangement concentrates in the δ-neighbourhood of a plane."
      },
      {
        "id": "cor:A.7",
        "kind": "corollary",
        "label": "Cor A.7",
        "name": "Prism trapping (rescaled)",
        "section": "A",
        "weight": 2,
        "statement": "A rescaled prism-trapping version of Lemma A.6."
      }
    ],
    "edges": [
      {
        "from": "def:wolff",
        "to": "def:DE",
        "type": "uses"
      },
      {
        "from": "def:DE",
        "to": "cor:1.10",
        "type": "uses"
      },
      {
        "from": "thm:1.9",
        "to": "cor:1.10",
        "type": "uses"
      },
      {
        "from": "cor:1.10",
        "to": "thm:1.2",
        "type": "uses"
      },
      {
        "from": "thm:1.2",
        "to": "thm:1.1",
        "type": "uses"
      },
      {
        "from": "prop:1.6",
        "to": "thm:1.9",
        "type": "uses"
      },
      {
        "from": "prop:1.7",
        "to": "thm:1.9",
        "type": "uses"
      },
      {
        "from": "prop:1.8",
        "to": "thm:1.9",
        "type": "uses"
      },
      {
        "from": "def:DE",
        "to": "prop:1.6",
        "type": "uses"
      },
      {
        "from": "def:DE",
        "to": "prop:1.7",
        "type": "uses"
      },
      {
        "from": "def:DE",
        "to": "prop:1.8",
        "type": "uses"
      },
      {
        "from": "lem:6.4",
        "to": "prop:1.6",
        "type": "uses"
      },
      {
        "from": "prop:5.14",
        "to": "prop:1.6",
        "type": "uses"
      },
      {
        "from": "prop:6.3",
        "to": "lem:6.4",
        "type": "uses"
      },
      {
        "from": "prop:5.1",
        "to": "lem:6.4",
        "type": "uses"
      },
      {
        "from": "thm:6.2",
        "to": "lem:6.4",
        "type": "uses"
      },
      {
        "from": "prop:4.6",
        "to": "lem:6.4",
        "type": "uses"
      },
      {
        "from": "def:DE",
        "to": "lem:6.4",
        "type": "uses"
      },
      {
        "from": "prop:4.6",
        "to": "prop:6.3",
        "type": "uses"
      },
      {
        "from": "def:fcw-scale",
        "to": "prop:6.3",
        "type": "uses"
      },
      {
        "from": "prop:5.14",
        "to": "prop:5.1",
        "type": "uses"
      },
      {
        "from": "prop:5.14",
        "to": "prop:5.2",
        "type": "uses"
      },
      {
        "from": "lem:4.11",
        "to": "prop:5.2",
        "type": "uses"
      },
      {
        "from": "prop:5.1",
        "to": "prop:5.2",
        "type": "generalizes"
      },
      {
        "from": "lem:5.15",
        "to": "prop:5.14",
        "type": "uses"
      },
      {
        "from": "cor:5.13",
        "to": "prop:5.14",
        "type": "uses"
      },
      {
        "from": "def:F",
        "to": "prop:5.14",
        "type": "uses"
      },
      {
        "from": "def:Etilde",
        "to": "prop:5.14",
        "type": "uses"
      },
      {
        "from": "def:DE",
        "to": "prop:5.14",
        "type": "uses"
      },
      {
        "from": "lem:5.10",
        "to": "cor:5.13",
        "type": "uses"
      },
      {
        "from": "lem:5.7",
        "to": "lem:5.10",
        "type": "uses"
      },
      {
        "from": "prop:4.8",
        "to": "lem:5.15",
        "type": "uses"
      },
      {
        "from": "cor:5.13",
        "to": "lem:5.15",
        "type": "uses"
      },
      {
        "from": "lem:4.10",
        "to": "prop:4.8",
        "type": "uses"
      },
      {
        "from": "lem:4.7",
        "to": "prop:4.6",
        "type": "uses"
      },
      {
        "from": "prop:5.14",
        "to": "lem:5.17",
        "type": "uses"
      },
      {
        "from": "lem:5.7",
        "to": "lem:5.17",
        "type": "uses"
      },
      {
        "from": "lem:5.17",
        "to": "cor:5.19",
        "type": "uses"
      },
      {
        "from": "def:fcw-scale",
        "to": "thm:6.2",
        "type": "uses"
      },
      {
        "from": "def:DE",
        "to": "def:F",
        "type": "generalizes"
      },
      {
        "from": "def:Etilde",
        "to": "def:DE",
        "type": "generalizes"
      },
      {
        "from": "lem:11.2",
        "to": "prop:1.7",
        "type": "uses"
      },
      {
        "from": "thm:10.2",
        "to": "prop:1.7",
        "type": "uses"
      },
      {
        "from": "lem:11.1",
        "to": "lem:11.2",
        "type": "uses"
      },
      {
        "from": "lem:4.12",
        "to": "lem:11.2",
        "type": "uses"
      },
      {
        "from": "def:ktcw-scale",
        "to": "lem:11.2",
        "type": "uses"
      },
      {
        "from": "prop:9.1",
        "to": "lem:11.1",
        "type": "uses"
      },
      {
        "from": "prop:7.5",
        "to": "prop:9.1",
        "type": "uses"
      },
      {
        "from": "prop:4.6",
        "to": "prop:9.1",
        "type": "uses"
      },
      {
        "from": "prop:5.2",
        "to": "prop:9.1",
        "type": "uses"
      },
      {
        "from": "prop:5.14",
        "to": "prop:9.1",
        "type": "uses"
      },
      {
        "from": "lem:7.18",
        "to": "prop:7.5",
        "type": "uses"
      },
      {
        "from": "lem:8.1",
        "to": "prop:7.5",
        "type": "uses"
      },
      {
        "from": "lem:8.2",
        "to": "prop:7.5",
        "type": "uses"
      },
      {
        "from": "lem:8.3",
        "to": "prop:7.5",
        "type": "uses"
      },
      {
        "from": "lem:7.14",
        "to": "prop:7.5",
        "type": "uses"
      },
      {
        "from": "cor:7.17",
        "to": "lem:7.18",
        "type": "uses"
      },
      {
        "from": "lem:7.11",
        "to": "lem:7.18",
        "type": "uses"
      },
      {
        "from": "prop:7.15",
        "to": "cor:7.17",
        "type": "uses"
      },
      {
        "from": "cor:7.10",
        "to": "lem:7.11",
        "type": "uses"
      },
      {
        "from": "lem:7.8",
        "to": "cor:7.10",
        "type": "uses"
      },
      {
        "from": "prop:4.8",
        "to": "lem:7.14",
        "type": "uses"
      },
      {
        "from": "lem:5.17",
        "to": "lem:7.14",
        "type": "uses"
      },
      {
        "from": "cor:7.17",
        "to": "lem:8.1",
        "type": "uses"
      },
      {
        "from": "lem:5.10",
        "to": "lem:8.2",
        "type": "uses"
      },
      {
        "from": "cor:5.19",
        "to": "lem:8.2",
        "type": "uses"
      },
      {
        "from": "prop:4.6",
        "to": "lem:8.3",
        "type": "uses"
      },
      {
        "from": "prop:4.8",
        "to": "lem:8.3",
        "type": "uses"
      },
      {
        "from": "cor:7.10",
        "to": "lem:8.3",
        "type": "uses"
      },
      {
        "from": "cor:5.19",
        "to": "lem:8.3",
        "type": "uses"
      },
      {
        "from": "lem:A.5",
        "to": "prop:7.15",
        "type": "uses"
      },
      {
        "from": "cor:A.7",
        "to": "prop:7.15",
        "type": "uses"
      },
      {
        "from": "thm:polypart",
        "to": "prop:A.4",
        "type": "uses"
      },
      {
        "from": "prop:A.4",
        "to": "lem:A.5",
        "type": "uses"
      },
      {
        "from": "lem:A.6",
        "to": "cor:A.7",
        "type": "uses"
      },
      {
        "from": "thm:6.2",
        "to": "thm:10.2",
        "type": "uses"
      },
      {
        "from": "prop:10.3",
        "to": "thm:10.2",
        "type": "uses"
      },
      {
        "from": "def:ktcw-scale",
        "to": "thm:10.2",
        "type": "uses"
      },
      {
        "from": "cor:10.8",
        "to": "prop:10.3",
        "type": "uses"
      },
      {
        "from": "lem:4.12",
        "to": "prop:10.3",
        "type": "uses"
      },
      {
        "from": "lem:10.6",
        "to": "cor:10.8",
        "type": "uses"
      },
      {
        "from": "thm:1.9",
        "to": "thm:1.12",
        "type": "uses"
      },
      {
        "from": "prop:4.6",
        "to": "thm:1.12",
        "type": "uses"
      },
      {
        "from": "prop:5.14",
        "to": "thm:1.12",
        "type": "uses"
      },
      {
        "from": "thm:1.1",
        "to": "thm:1.14",
        "type": "uses"
      }
    ]
  };
  if (typeof g.PaperDiagramData === "object" && g.PaperDiagramData) g.PaperDiagramData["kakeya"] = D;
  else g.PaperDiagramData = { "kakeya": D };
  if (typeof module !== "undefined" && module.exports) module.exports = D;
})(typeof window !== "undefined" ? window : globalThis);
