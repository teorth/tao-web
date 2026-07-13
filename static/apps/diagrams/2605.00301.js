// Library diagram for the paper-diagram viewer — lazy-loaded on demand.
// Primitive sets and von Mangoldt chains (Erdős #1196 and beyond),
// Alexeev–Barreto–Li–Lichtman–Price–Shah–Tang–Tao, arXiv:2605.00301.
// Hand-encoded logical skeleton: nodes are the paper's main theorems, its
// Markov-chain method (definitions / chains / weights) and the key lemmas;
// an edge points from a prerequisite to the result whose proof uses it.
;(function (g) {
  var D = {
    format: "paper-diagram",
    schemaVersion: 1,
    meta: {
      title: "Primitive sets and von Mangoldt chains: Erdős problem #1196 and beyond",
      paper: {
        arxiv: "2605.00301",
        authors: ["Boris Alexeev", "Kevin Barreto", "Yanyang Li", "Jared Duker Lichtman", "Liam Price", "Jibran Iqbal Shah", "Quanyu Tang", "Terence Tao"],
        year: 2026
      },
      generatedBy: "hand",
      date: "2026-07-13",
      note: "Hand-encoded skeleton of the von Mangoldt / Markov-chain method for primitive sets. The engine is chain–antichain duality (a primitive set meets a divisibility chain at most once); (sub-)invariant weights turn downward chains into upward ones via an adjoint. Weights (1–5) are editorial."
    },
    layout: { engine: "layered", direction: "up" },
    nodes: [
      { id: "wt:nu0", color: "#dce8fb", kind: "definition", label: "ν₀", name: "Doubly-harmonic weight ν₀", section: "1", weight: 3, statement: "The weight ν₀(a) = 1/(a log a); the size of a primitive set A is f(A) = Σ_{a∈A} ν₀(a).", plain: "The way the size of a primitive set is measured: a doubly-logarithmic weight ν₀(a) = 1/(a log a), summed over the set." },
      { id: "def:downchain", color: "#dce8fb", kind: "definition", label: "Def 2.1", name: "Downward Markov chain", section: "2.1", weight: 3, statement: "A downward Markov chain on a set of naturals: n moves only to divisors n/q (q>1) or stays at an absorbing state, transition probabilities summing to 1." },
      { id: "def:upchain", color: "#dce8fb", kind: "definition", label: "Def 2.9", name: "Upward Markov chain", section: "2.2", weight: 3, statement: "An upward Markov chain on N ∪ {∞}: n moves only to multiples nq or to the absorbing state ∞." },
      { id: "def:subinv", color: "#dce8fb", kind: "definition", label: "Def 2.7", name: "(Sub-)invariant weight", section: "2.1", weight: 3, statement: "A weight ν is invariant (resp. sub-invariant) for a downward chain if Σ_{q>1} ν(nq)P(nq↘n) = ν(n) (resp. ≤ ν(n))." },
      { id: "ex:vonmangoldt", color: "#dce8fb", kind: "definition", label: "Ex 2.4", name: "von Mangoldt downward chain", section: "2.1", weight: 4, statement: "The downward chain with P(n ↘ n/q) = Λ(q)/log n (Λ the von Mangoldt function); a Markov chain by the identity Σ_{q|n} Λ(q) = log n.", plain: "The central construction: from n, divide out a prime power q with probability proportional to Λ(q). Nearly all the paper's chains are small variants of this one." },
      { id: "ex:adjoint", color: "#dce8fb", kind: "definition", label: "Ex 2.11", name: "Adjoint (upward) chain", section: "2.2", weight: 3, statement: "Given a sub-invariant weight ν, the adjoint P(n↗m) = (ν(m)/ν(n)) P(m↘n) turns a downward chain into an upward one." },
      { id: "ex:mertenschain", color: "#dce8fb", kind: "definition", label: "Ex 2.3", name: "Mertens downward chain", section: "2.1", weight: 1, statement: "The deterministic downward chain that divides out the largest prime factor." },
      { id: "ex:randprime", color: "#dce8fb", kind: "definition", label: "Ex 2.2", name: "Random-prime downward chain", section: "2.1", weight: 1, statement: "The downward chain that divides out a uniformly random prime factor of n." },
      { id: "wt:nuLambda", color: "#dce8fb", kind: "definition", label: "ν_Λ", name: "von Mangoldt weight ν_Λ", section: "2.1", weight: 2, statement: "An invariant weight for the von Mangoldt chain, asymptotic to ν₀: ν_Λ(n) = 1 − 2γ/log n + O(1/log²n) times ν₀(n)." },
      { id: "wt:mertens", color: "#dce8fb", kind: "definition", label: "ν_Mert", name: "Mertens weight", section: "2.1", weight: 1, statement: "An invariant weight for the Mertens downward chain (Erdős' original weight up to e^γ)." },
      { id: "dual:hitting", color: "#dce8fb", kind: "proposition", label: "Duality", name: "Chain–antichain duality (hitting-mass inequality)", section: "2", weight: 4, statement: "A primitive set meets any downward/upward divisibility chain at most once, giving Σ_{n∈A} h_b(n) ≤ Σ_{n₀} b(n₀) for the hitting mass h_b.", plain: "The engine of every proof: a primitive set can hit a random divisibility chain at most once, so the mass it collects is at most the mass fed in." },
      { id: "lem:lym", color: "#dce8fb", kind: "corollary", label: "LYM (2.6)", name: "LYM / Sperner inequality", section: "2.1", weight: 1, statement: "The random-prime chain recovers the LYM inequality Σ_{n|n₀} 1/C(N, ω(n)) ≤ 1, hence Sperner's theorem." },
      { id: "thm:mertens", kind: "theorem", label: "Thm 3.1", name: "Mertens' theorems", section: "3", weight: 2, external: true, ref: "classical (Montgomery–Vaughan)", statement: "The classical estimates for Σ_{p≤x} log p/p, Σ_{p≤x} 1/p and Π_{p≤x}(1−1/p)." },
      { id: "lem:3.2", color: "#fbf0c4", kind: "lemma", label: "Lem 3.2", name: "Bound on the von Mangoldt Dirichlet series", section: "3.1", weight: 2, statement: "−ζ'/ζ(1+u) = Σ Λ(q)/q^{1+u} ≤ (log 2)/(2^u − 1) ≤ 1/u, via monotonicity of the Dirichlet eta function." },
      { id: "lem:3.3", color: "#fbf0c4", kind: "lemma", label: "Lem 3.3", name: "von Mangoldt sum estimates", section: "3.1", weight: 3, statement: "Three bounds for Σ Λ(q)/(q log²(mq)): an asymptotic form, a non-asymptotic bound ≤ 1 (m a power of 2), and a shifted bound." },
      { id: "lem:3.4", color: "#fbf0c4", kind: "lemma", label: "Lem 3.4", name: "A prime sum bound", section: "3.2", weight: 2, statement: "For every u>0, u Σ_{p≥3} log p/((p−2)p^u) ≤ 1." },
      { id: "lem:5.1", color: "#d3ecd3", kind: "lemma", label: "Lem 5.1", name: "Sub-invariance (primes as absorbing states)", section: "5", weight: 3, statement: "ν₀ is sub-invariant for the modified von Mangoldt chain whose absorbing states are the primes." },
      { id: "lem:6.1", color: "#d3ecd3", kind: "lemma", label: "Lem 6.1", name: "Sub-invariance (odd Q-smooth chain)", section: "6", weight: 3, statement: "ν₀ is sub-invariant for the prime-only von Mangoldt chain on the odd Q-smooth numbers above layer k." },
      { id: "thm:1.1", color: "#d3ecd3", kind: "theorem", label: "Thm 1.1", name: "Primitive sets of large numbers (#1196)", section: "4", weight: 5, statement: "If A is primitive and A ⊂ [x,∞), then f(A) ≤ 1 + O(1/log x) — the Erdős–Sárközy–Szemerédi conjecture #1196, with a quantitative rate.", plain: "The headline result: a primitive set of large numbers has doubly-logarithmic size at most 1 + o(1), resolving Erdős problem #1196." },
      { id: "thm:1.2", color: "#d3ecd3", kind: "theorem", label: "Thm 1.2", name: "Erdős primitive set conjecture (#164)", section: "5", weight: 5, statement: "For any primitive set A, f(A) ≤ f(N₁) = 1.6366… — the Erdős primitive set conjecture #164 (a short new proof)." },
      { id: "thm:1.3", color: "#d3ecd3", kind: "theorem", label: "Thm 1.3", name: "Odd Banks–Martin", section: "6", weight: 4, statement: "For k ≥ 1, a primitive A ⊂ N_{≥k} and a set Q of odd primes, f(A(Q)) ≤ f(N_k(Q)) — the odd Banks–Martin conjecture." },
      { id: "thm:1.4", color: "#d3ecd3", kind: "theorem", label: "Thm 1.4", name: "2 is Erdős-strong", section: "7", weight: 3, statement: "2 is Erdős-strong: any primitive set A of even numbers has f(A) ≤ ν₀(2)." },
      { id: "thm:1.5", color: "#d3ecd3", kind: "theorem", label: "Thm 1.5", name: "Ahlswede–Khachatrian–Sárközy bound", section: "8", weight: 3, statement: "For a primitive set A and 3 ≤ x ≤ y, Σ_{n∈A∩[y/x,y]} 1/n ≪ log x / √(log log x)." },
      { id: "thm:1.6", color: "#d3ecd3", kind: "theorem", label: "Thm 1.6", name: "Divisibility chains (#1217)", section: "9", weight: 4, statement: "If A has positive upper doubly-logarithmic density Δ, it contains an infinite strictly increasing divisibility chain hitting A with density ≥ Δ — Erdős–Sárközy–Szemerédi #1217." },
      { id: "disc:flow", color: "#f7dcc0", kind: "remark", label: "§10.1", name: "Flow-network reformulation", section: "10", weight: 2, statement: "The chains become flows with small divergence, yielding a cut-capacity inequality and an alternate proof of #1196." },
      { id: "disc:zeta", color: "#f7dcc0", kind: "remark", label: "§10.2", name: "Zeta process", section: "10", weight: 1, statement: "A coupled family of ζ(s)-distributed integers whose jump structure realizes the von Mangoldt weight ν_Λ." }
    ],
    edges: [
      { from: "def:downchain", to: "def:subinv", type: "uses" },
      { from: "def:downchain", to: "ex:vonmangoldt", type: "uses" },
      { from: "def:downchain", to: "ex:mertenschain", type: "uses" },
      { from: "def:downchain", to: "ex:randprime", type: "uses" },
      { from: "def:downchain", to: "dual:hitting", type: "uses" },
      { from: "def:upchain", to: "ex:adjoint", type: "uses" },
      { from: "def:upchain", to: "dual:hitting", type: "uses" },
      { from: "def:subinv", to: "ex:adjoint", type: "uses" },
      { from: "ex:vonmangoldt", to: "wt:nuLambda", type: "uses" },
      { from: "def:subinv", to: "wt:nuLambda", type: "uses" },
      { from: "ex:mertenschain", to: "wt:mertens", type: "uses" },
      { from: "ex:randprime", to: "lem:lym", type: "uses" },
      { from: "dual:hitting", to: "lem:lym", type: "uses" },
      { from: "thm:mertens", to: "lem:3.3", type: "uses" },
      { from: "lem:3.2", to: "lem:3.3", type: "uses" },
      { from: "lem:3.2", to: "lem:3.4", type: "uses" },
      { from: "wt:nu0", to: "lem:5.1", type: "uses" },
      { from: "lem:3.3", to: "lem:5.1", type: "uses" },
      { from: "ex:vonmangoldt", to: "lem:5.1", type: "uses" },
      { from: "wt:nu0", to: "lem:6.1", type: "uses" },
      { from: "lem:3.4", to: "lem:6.1", type: "uses" },
      { from: "ex:vonmangoldt", to: "lem:6.1", type: "uses" },
      { from: "ex:vonmangoldt", to: "thm:1.1", type: "uses" },
      { from: "dual:hitting", to: "thm:1.1", type: "uses" },
      { from: "lem:3.3", to: "thm:1.1", type: "uses" },
      { from: "wt:nu0", to: "thm:1.1", type: "uses" },
      { from: "lem:5.1", to: "thm:1.2", type: "uses" },
      { from: "ex:adjoint", to: "thm:1.2", type: "uses" },
      { from: "dual:hitting", to: "thm:1.2", type: "uses" },
      { from: "wt:nu0", to: "thm:1.2", type: "uses" },
      { from: "lem:6.1", to: "thm:1.3", type: "uses" },
      { from: "ex:adjoint", to: "thm:1.3", type: "uses" },
      { from: "dual:hitting", to: "thm:1.3", type: "uses" },
      { from: "thm:1.3", to: "thm:1.1", type: "uses" },
      { from: "ex:vonmangoldt", to: "thm:1.4", type: "uses" },
      { from: "lem:3.3", to: "thm:1.4", type: "uses" },
      { from: "ex:adjoint", to: "thm:1.4", type: "uses" },
      { from: "dual:hitting", to: "thm:1.4", type: "uses" },
      { from: "wt:nu0", to: "thm:1.4", type: "uses" },
      { from: "def:upchain", to: "thm:1.5", type: "uses" },
      { from: "dual:hitting", to: "thm:1.5", type: "uses" },
      { from: "thm:mertens", to: "thm:1.5", type: "uses" },
      { from: "wt:nuLambda", to: "thm:1.6", type: "uses" },
      { from: "ex:adjoint", to: "thm:1.6", type: "uses" },
      { from: "dual:hitting", to: "thm:1.6", type: "uses" },
      { from: "thm:mertens", to: "thm:1.6", type: "uses" },
      { from: "dual:hitting", to: "disc:flow", type: "generalizes" },
      { from: "ex:vonmangoldt", to: "disc:flow", type: "uses" },
      { from: "wt:nuLambda", to: "disc:zeta", type: "uses" }
    ]
  };
  if (typeof g.PaperDiagramData === "object" && g.PaperDiagramData) g.PaperDiagramData["2605.00301"] = D;
  else g.PaperDiagramData = { "2605.00301": D };
  if (typeof module !== "undefined" && module.exports) module.exports = D;
})(typeof window !== "undefined" ? window : globalThis);
