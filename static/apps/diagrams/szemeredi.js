// Library diagram for the paper-diagram viewer — lazy-loaded on demand.
// E. Szemerédi, "On sets of integers containing no k elements in arithmetic
// progression", Acta Arith. 27(1):199–245 (1975) — the proof of Szemerédi's theorem.
// An LLM-generated editorial reading of the logical skeleton: the paper's Facts,
// Lemmas, Theorem and Corollary, with an edge from a prerequisite to the result
// whose proof uses it. Colours group the nodes by the paper's sections. The paper
// itself famously prints an (intentionally NON-acyclic) flow chart on p.202; this
// DAG necessarily linearises the simultaneous induction, but keeps its landmarks.
;(function (g) {
  var BLUE = "#dce8fb", YELLOW = "#fbf0c4", GREEN = "#d3ecd3", ORANGE = "#f7dcc0";
  var D = {
    format: "paper-diagram",
    schemaVersion: 1,
    meta: {
      title: "On sets of integers containing no k elements in arithmetic progression",
      paper: {
        authors: ["E. Szemerédi"],
        year: 1975,
        journal: "Acta Arith. 27(1): 199–245 (1975)",
        note: "The proof of Szemerédi's theorem. Colours mark the paper's sections: blue = the bipartite regularity lemma (§2), yellow = configurations & their densities (§3), green = K-tuples and the scale tₘ (§4–5), orange = well-saturation and the main theorem (§6–7). The paper prints its own approximate flow chart (p.202) which is deliberately cyclic (simultaneous induction); this reading is an acyclic approximation."
      }
    },
    layout: { engine: "layered", direction: "up" },
    nodes: [
      // cited / external inputs
      { id: "ext:vdw", kind: "theorem", label: "vdW", name: "van der Waerden's theorem", section: "1", weight: 3, external: true, ref: "van der Waerden (1927)", statement: "For all r, k there is W(r,k) so that every r-colouring of {1,…,W} contains a monochromatic k-term arithmetic progression.", plain: "Any finite colouring of a long enough interval has a monochromatic AP of the wanted length." },
      { id: "ext:subadd", kind: "remark", label: "F₀", name: "Subadditivity limit", section: "3", weight: 2, external: true, statement: "If f: ℝ⁺→ℝ⁺ is subadditive then limₙ f(n)/n exists (Fekete).", plain: "A subadditive function has a well-defined asymptotic density — this is why the density parameters below exist." },

      // §2 — a lemma on bipartite graphs (blue)
      { id: "fact:1", kind: "remark", label: "Fact 1", name: "Regularity of one bipartite graph", section: "2", weight: 2, color: BLUE, statement: "For a bipartite graph on A∪B and ε₁,ε₂,δ there exist large X⊆A, Y⊆B and r ≤ 1/δ that form a δ-regular pair: every big S⊆X, T⊆Y has β(S,T) > β(X,Y) − δ.", plain: "Inside any bipartite graph one can find a large, nearly-uniform (regular) pair of vertex sets." },
      { id: "fact:2", kind: "remark", label: "Fact 2", name: "Size-uniform regular pair", section: "2", weight: 2, color: BLUE, statement: "For ε₁<½, ε₂, δ there are M,N so that every bipartite graph with |A|=m>M, |B|=n>N has a δ-regular pair X⊆A, Y⊆B with controlled sizes and density.", plain: "A quantitative, size-uniform version of Fact 1.", },
      { id: "fact:3", kind: "remark", label: "Fact 3", name: "Recursive regular extraction", section: "2", weight: 2, color: BLUE, statement: "There exist M,N so that for m>M, n>N and A'⊆A with |A'| ≥ ϱm one can peel off C⊆A' and C̄ⱼ⊆B (j<n₀) meeting the requirements of Lemma 1.", plain: "Iterate Fact 2 to start stripping the graph into regular pieces." },
      { id: "lem:1", kind: "lemma", label: "Lem 1", name: "Bipartite regularity lemma", section: "2", weight: 5, color: BLUE, statement: "For ε₁,ε₂,δ,ϱ,σ there are m₀,n₀,M,N so that any bipartite graph (|A|=m>M, |B|=n>N) admits disjoint Cᵢ⊆A, C_{i,j}⊆B covering all but ϱm of A and σn of B, with every pair (Cᵢ,C_{i,j}) δ-regular.", plain: "A precursor of the Szemerédi regularity lemma: partition almost all of a bipartite graph into regular pairs." },
      { id: "lem:1p", kind: "lemma", label: "Lem 1'", name: "Complementary regularity lemma", section: "2", weight: 3, color: BLUE, statement: "Applying Lemma 1 to the complementary graph Ī = [A,B] − I gives the same regular decomposition with the density inequalities reversed (≤ in place of >).", plain: "The 'non-edge' version of Lemma 1, used for the sparse side." },

      // §3 — configurations and their densities (yellow)
      { id: "def:config", kind: "definition", label: "Defs §3", name: "Configurations; densities αₘ, βₘ", section: "3", weight: 4, color: YELLOW, statement: "Configurations B(l₁,…,lₘ) (nested arithmetic progressions of progressions); saturated (S) and perfect (P) sub-configurations; densities with αₘ = lim fₘ(l)/l, βₘ = lim gₘ(l)/l and error terms εₘ, μₘ.", plain: "The combinatorial vocabulary of the proof: higher-order progressions and the density parameters that measure them." },
      { id: "fact:4", kind: "remark", label: "Fact 4", name: "βₘ₊₁ ≤ gₘ₊₁(l)/l", section: "3", weight: 2, color: YELLOW, statement: "For all l and m, βₘ₊₁ ≤ gₘ₊₁(l)/l.", plain: "The saturated-configuration density is bounded by every finite-level count." },
      { id: "fact:5", kind: "remark", label: "Fact 5", name: "βₘ₊₁ = lim gₘ₊₁(l)/l", section: "3", weight: 2, color: YELLOW, statement: "βₘ₊₁ = limₗ gₘ₊₁(l)/l (an immediate corollary of Fact 4); this also defines the error term μₘ₊₁.", plain: "That bound is attained in the limit, pinning down βₘ₊₁ and μₘ₊₁." },
      { id: "fact:6", kind: "remark", label: "Fact 6", name: "May assume βₘ < 1", section: "3", weight: 2, color: YELLOW, statement: "We may assume βₘ < 1 for m ≥ 2 — otherwise gₘ(l) = l forces R to contain arbitrarily long APs directly and we are done.", plain: "The interesting case has densities strictly below 1." },
      { id: "fact:7", kind: "remark", label: "Fact 7", name: "αₘ₊₁ = lim fₘ₊₁(l)/l", section: "3", weight: 2, color: YELLOW, statement: "αₘ₊₁ = limₗ fₘ₊₁(l)/l.", plain: "The perfect-configuration density is also a genuine limit." },
      { id: "fact:8", kind: "remark", label: "Fact 8", name: "Density ⇒ nonempty configurations", section: "3", weight: 2, color: YELLOW, statement: "If βₘ₊₁ > 1 − 1/l then C(t₁,…,tₘ,l) ≠ ∅.", plain: "High density guarantees full saturated configurations exist — the base case of the main induction." },
      { id: "lem:2", kind: "lemma", label: "Lem 2", name: "Densities barely drop", section: "3", weight: 4, color: YELLOW, statement: "For all m ≥ 1, βₘ₊₁ ≥ 1 − 2(√μₘ(tₘ) + √(√εₘ(tₘ) + √μₘ(tₘ))).", plain: "The density loses almost nothing from one level to the next — the engine that keeps saturated configurations plentiful." },
      { id: "lem:3", kind: "lemma", label: "Lem 3", name: "Perfect density stable on large sets", section: "3", weight: 3, color: YELLOW, statement: "For all δ,τ there is l so that if X = ∪Xᵢ ∈ C(t₁,…,tₘ,l) and C ⊆ [0,tₘ) with |C| ≥ τtₘ, some Xᵢ has pᵐ(Xᵢ,C) > (αₘ − δ)|C| and some has < (αₘ + δ)|C|.", plain: "Perfect sub-configurations occur with almost their expected density on any large index set." },

      // §4–5 — K-tuples and the choice of tₘ (green)
      { id: "def:ktuples", kind: "definition", label: "Defs §4", name: "K-tuples Dⁱ, homogeneous Gⁱ, E(t,K)", section: "4", weight: 3, color: GREEN, statement: "Dⁱ(t₁,…,tₘ,K) and D*ⁱ (K-tuples whose first i coordinates are perfect); homogeneous K-tuples Gⁱ; the AP-index set E(t,K) = {(j₀,…,j_{K−1}) forming an AP in [0,t)}.", plain: "Package configurations into K-tuples aligned along an arithmetic progression of indices." },
      { id: "fact:9", kind: "remark", label: "Fact 9", name: "AP of indices ⇔ configuration", section: "4", weight: 2, color: GREEN, statement: "(j₀,…,j_{K−1}) ∈ E(tₘ,K) iff ∪ X_{i,jᵢ} ∈ B(t₁,…,t_{m−1},K).", plain: "An arithmetic progression of indices is exactly what glues sub-configurations into a K-tuple." },
      { id: "fact:10", kind: "remark", label: "Fact 10", name: "Counting AP-index sets", section: "4", weight: 2, color: GREEN, statement: "e(t,K;j,i) ≤ t, and for t/4 < j < 3t/4, K ≥ 2, t ≥ 4 one has e(t,K,j,i) ≥ t/K².", plain: "Neither too few nor too many APs pass through a middle index — the counting that drives well-saturation." },
      { id: "fact:11", kind: "remark", label: "Fact 11", name: "Dense subset of an interval has an AP", section: "4", weight: 2, color: GREEN, statement: "If t > l³ and L ⊆ [0,t) with |L| > (1 − 1/l)t, then L contains an arithmetic progression of length l.", plain: "A very dense subset of an interval automatically contains a long AP (an elementary counting fact)." },
      { id: "def:tm", kind: "definition", label: "tₘ", name: "Choice of the scale tₘ (conditions A–G)", section: "5", weight: 4, color: GREEN, statement: "tₘ is taken large enough to satisfy conditions (A)–(G): Lemma 1 applies (A), Lemma 3 applies (5.3), van der Waerden's bound holds (5.4), and √μₘ(tₘ) < min{βₘ, 1−βₘ} (F).", plain: "One carefully calibrated scale parameter that makes every lemma applicable at once." },

      // §6–7 — well-saturation and the main theorem (orange)
      { id: "lem:4", kind: "lemma", label: "Lem 4", name: "Well-saturated ⇒ next level homogeneous", section: "6", weight: 3, color: ORANGE, statement: "If X ∈ Gⁱ(t₁,…,tₘ,K) is well-saturated and i+1 < K, then X ∈ Gⁱ⁺¹(t₁,…,tₘ,K).", plain: "Regularity (Lemmas 1 & 1') upgrades a K-tuple's homogeneity by one level." },
      { id: "lem:5", kind: "lemma", label: "Lem 5", name: "R-equivalent tuples are well-saturated", section: "6", weight: 3, color: ORANGE, statement: "If the Xⱼ^(ξ) are R-equivalent for j<i (ξ<l, l ≥ lₘ^{2^{−K}}), then some X^(π) ∈ Gⁱ⁺¹(t₁,…,tₘ,K).", plain: "Van der Waerden forces a colour-uniform (R-equivalent) family, which is then well-saturated." },
      { id: "lem:6", kind: "lemma", label: "Lem 6", name: "APs of homogeneous configurations", section: "6", weight: 4, color: ORANGE, statement: "Given R-equivalent X^(ξ) ∈ Gⁱ(t₁,…,t_{m+1},K), there is an AP of lₘ sub-configurations j^(0),…,j^(lₘ−1) with ∪ X^(ξ) ∈ Dⁱ(t₁,…,tₘ,K).", plain: "The structural heart: aligned, colour-uniform K-tuples contain a long AP of perfect sub-configurations." },
      { id: "fact:12", kind: "remark", label: "Fact 12", name: "Position-matching homogeneous tuples", section: "6", weight: 3, color: ORANGE, statement: "For m>0 and 0≤i<K there is h(m,i) so that K-tuples in Dⁱ can be matched, position for position, by homogeneous ones in Gⁱ.", plain: "One can always pass to homogeneous K-tuples occupying the same positions — the inductive glue for the theorem." },
      { id: "thm:main", kind: "theorem", label: "Theorem", name: "Dⁱ(t₁,…,tₘ,K) ≠ ∅", section: "7", weight: 5, color: ORANGE, statement: "For m>0 and 0≤i<K, Dⁱ(t₁,…,tₘ,K) ≠ ∅, proved by induction on i from Fact 8 (base), Lemma 6 and Fact 12.", plain: "The technical main theorem: perfect K-tuples of every type exist." },
      { id: "cor:main", kind: "corollary", label: "Corollary", name: "Szemerédi's theorem", section: "7", weight: 5, color: ORANGE, statement: "For all ε>0, k there is N(k,ε) so that any R ⊆ [0,n) with |R| > εn (n>N) contains a k-term AP; equivalently rₖ(n) = o(n) and cₖ = 0 for all k.", plain: "Every set of integers of positive upper density contains arbitrarily long arithmetic progressions." }
    ],
    edges: [
      { from: "ext:subadd", to: "def:config" },
      { from: "ext:vdw", to: "def:tm" },
      { from: "ext:vdw", to: "lem:5" },

      { from: "fact:1", to: "fact:2" },
      { from: "fact:2", to: "fact:3" },
      { from: "fact:3", to: "lem:1" },
      { from: "lem:1", to: "lem:1p" },
      { from: "lem:1", to: "lem:4" },
      { from: "lem:1p", to: "lem:4" },

      { from: "def:config", to: "fact:4" },
      { from: "def:config", to: "def:ktuples" },
      { from: "fact:4", to: "fact:5" },
      { from: "fact:4", to: "fact:6" },
      { from: "fact:4", to: "fact:8" },
      { from: "fact:6", to: "fact:7" },
      { from: "fact:5", to: "lem:2" },
      { from: "fact:6", to: "lem:2" },
      { from: "fact:7", to: "lem:2" },
      { from: "fact:6", to: "lem:3" },
      { from: "lem:2", to: "lem:3" },
      { from: "lem:2", to: "def:tm" },
      { from: "lem:3", to: "def:tm" },

      { from: "def:ktuples", to: "fact:9" },
      { from: "def:ktuples", to: "fact:10" },
      { from: "def:ktuples", to: "lem:4" },
      { from: "fact:9", to: "lem:4" },
      { from: "fact:10", to: "lem:4" },
      { from: "def:tm", to: "lem:4" },
      { from: "def:tm", to: "lem:5" },
      { from: "lem:3", to: "lem:5" },
      { from: "lem:4", to: "lem:5" },
      { from: "lem:5", to: "lem:6" },
      { from: "fact:10", to: "lem:6" },
      { from: "fact:11", to: "lem:6" },
      { from: "lem:5", to: "fact:12" },
      { from: "lem:6", to: "fact:12" },

      { from: "fact:8", to: "thm:main" },
      { from: "def:tm", to: "thm:main" },
      { from: "lem:6", to: "thm:main" },
      { from: "fact:12", to: "thm:main" },
      { from: "thm:main", to: "cor:main" }
    ]
  };
  if (typeof g.PaperDiagramData === "object" && g.PaperDiagramData) g.PaperDiagramData["szemeredi"] = D;
  else g.PaperDiagramData = { "szemeredi": D };
  if (typeof module !== "undefined" && module.exports) module.exports = D;
})(typeof window !== "undefined" ? window : globalThis);
