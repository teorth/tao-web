// Library diagram for the paper-diagram viewer — lazy-loaded on demand.
// Gilbreath's conjecture (Chase–Hunter–Tao, 2025). The first hand-encoded
// prototype, used to pin down the paper-diagram format.
;(function (g) {
  var D = {
    "format": "paper-diagram",
    "schemaVersion": 1,
    "meta": {
      "title": "Gilbreath's conjecture: a Cramér random model and a deterministic analysis",
      "paper": {
        "arxiv": "2607.08712",
        "authors": [
          "Chase",
          "Hunter",
          "Tao"
        ],
        "year": 2026,
        "companion": {
          "href": "gilbreath.html",
          "label": "Gilbreath array explorer"
        }
      },
      "generatedBy": "hand",
      "date": "2026-07-12",
      "note": "First hand-encoded prototype, used to pin down the paper-diagram format. Edge convention: {from} is a prerequisite used in the proof of {to} (arrows flow prerequisites -> results). Layout is auto-computed from this DAG + weights; no positions are authored."
    },
    "layout": {
      "engine": "layered",
      "direction": "up"
    },
    "nodes": [
      {
        "id": "def:array",
        "kind": "definition",
        "label": "(1.1)",
        "name": "Gilbreath array",
        "statement": "The triangular array of iterated absolute differences: $a_{(i+1,j)}=|a_{(i,j)}-a_{(i,j+1)}|$ with $a_{(0,j)}=a_j$.",
        "section": "1.1",
        "weight": 3
      },
      {
        "id": "def:c",
        "kind": "definition",
        "label": "(1.5)",
        "name": "Expected depth-$i$ value $c_i$",
        "statement": "$c_i := \\mathbf{E}\\,a_{(i,j)}$ for the continuous (standard exponential) model; rational, and non-monotone in $i$.",
        "section": "1.3",
        "weight": 2
      },
      {
        "id": "thm:1.1",
        "kind": "theorem",
        "label": "Thm 1.1",
        "name": "Gilbreath for a random model",
        "statement": "For slowly-growing independent uniform $a_n\\in\\{0,\\dots,f(n)-1\\}$, a.s. the left diagonal is $\\{0,1\\}$-valued after finitely many rows.",
        "section": "1.2",
        "weight": 2,
        "external": true,
        "ref": "[1] Chase, Math. Ann. 388 (2024)"
      },
      {
        "id": "thm:1.2",
        "kind": "theorem",
        "label": "Thm 1.2",
        "name": "Gilbreath for the Cramér random model",
        "statement": "For $a_n$ geometric of parameter $2/(2+\\log n)$, a.s. the left diagonal $a_{(1,1)},a_{(2,1)},\\dots$ is $\\{0,1\\}$-valued after finitely many rows.",
        "section": "1.2",
        "weight": 5
      },
      {
        "id": "thm:1.3",
        "kind": "theorem",
        "label": "Thm 1.3",
        "name": "Gilbreath for general random models",
        "statement": "Under sub-linear growth (i) and non-concentration in 2-separated sets (ii), a.s. the left diagonal is $\\{0,1\\}$-valued after finitely many rows. Contains Thm 1.1 and Thm 1.2.",
        "section": "1.2",
        "weight": 5
      },
      {
        "id": "prop:2.1",
        "kind": "proposition",
        "label": "Prop 2.1",
        "name": "Key inequality",
        "statement": "$c_n \\ge \\exp\\!\\big(-\\sum_{i<n} c_i\\big)$ (via the triangle inequality, total expectation, and Jensen).",
        "section": "2",
        "weight": 3
      },
      {
        "id": "thm:1.4",
        "kind": "theorem",
        "label": "Thm 1.4",
        "name": "Lower bound",
        "statement": "$\\sum_{i\\le n} c_i \\ge \\log(n+e)$; hence $c_i$ cannot decay faster than $1/i$.",
        "section": "1.3",
        "weight": 3
      },
      {
        "id": "lem:3.7",
        "kind": "lemma",
        "label": "Lem 3.7",
        "name": "Inheritance",
        "statement": "$\\mathbb{Z}_{\\ge 0}$, $\\{0,\\dots,d\\}$ and $\\{0,d\\}$ are closed under $(x,y)\\mapsto|x-y|$, so value-set membership passes to descendant blocks.",
        "section": "3.2",
        "weight": 3
      },
      {
        "id": "lem:3.8",
        "kind": "lemma",
        "label": "Lem 3.8",
        "name": "Parentage",
        "statement": "The parent of a $\\{0,d\\}$-valued block that attains $d$ is either $\\{0,d\\}$-valued, or $\\{a,a+d\\}$-valued ($0<a<d$), or attains a value $\\ge 2d$.",
        "section": "3.2",
        "weight": 3
      },
      {
        "id": "lem:3.10",
        "kind": "lemma",
        "label": "Lem 3.10",
        "name": "Parity formula",
        "statement": "$a_{(i,j)}=\\sum_{k=0}^{i}\\binom{i}{k}a_{j+k}\\bmod 2$.",
        "section": "3.2",
        "weight": 1,
        "note": "Stated; not used directly — superseded by the variant Lem 3.11 (which handles odd $d$)."
      },
      {
        "id": "lem:3.11",
        "kind": "lemma",
        "label": "Lem 3.11",
        "name": "Separation",
        "statement": "Fixing all but one initial entry, the set of values making a location $D$-valued (for $D$ 2-separated) is itself 2-separated.",
        "section": "3.2",
        "weight": 2
      },
      {
        "id": "def:tower",
        "kind": "definition",
        "label": "Def 3.12",
        "name": "Tower",
        "statement": "An increasing stack $2\\le d_1<\\dots<d_k$ of $\\{0,d_j\\}$-valued triangles seated above a base triangle.",
        "section": "3.3",
        "weight": 2
      },
      {
        "id": "lem:3.13",
        "kind": "lemma",
        "label": "Lem 3.13",
        "name": "Attained tower",
        "statement": "A $\\{0,\\dots,D\\}$-valued triangle whose bottom vertex exceeds 1 contains at least one attained tower of complexity $D$.",
        "section": "3.3",
        "weight": 3
      },
      {
        "id": "lem:3.14",
        "kind": "lemma",
        "label": "Lem 3.14",
        "name": "Towers have a large shadow",
        "statement": "Every top-row location shares its left- or right-position with some location of the tower; so one shadow of the tower is large.",
        "section": "3.3",
        "weight": 2
      },
      {
        "id": "prop:4.1",
        "kind": "proposition",
        "label": "Prop 4.1",
        "name": "Bound on failure probability",
        "statement": "$\\mathbf{P}(a_{(n-1,1)}>1)\\le 2^D\\,(en/D+e)^{2D}\\,(\\prod_i \\rho_i)^{1/2}$, where $\\rho_i=\\sup_A \\mathbf{P}(a_i\\in A)$ over 2-separated $A$.",
        "section": "4",
        "weight": 4
      },
      {
        "id": "lem:4.3",
        "kind": "lemma",
        "label": "Lem 4.3",
        "name": "Unlikely attainment",
        "statement": "Each tower is attained with probability at most $(\\prod_{i=1}^{n}\\rho_i)^{1/2}$.",
        "section": "4",
        "weight": 2
      },
      {
        "id": "lem:4.4",
        "kind": "lemma",
        "label": "Lem 4.4",
        "name": "Number of towers",
        "statement": "The towers of complexity $D$ and length $k$ number at most $\\binom{D-1}{k}\\binom{n-1}{k-1}\\binom{n+k-1}{k-1}$.",
        "section": "4",
        "weight": 2
      },
      {
        "id": "lem:5.1",
        "kind": "lemma",
        "label": "Lem 5.1",
        "name": "Inductive claim",
        "statement": "Technical inductive form of coarse monotonicity: a large value propagates backward with horizontal error $O(2^M L)$.",
        "section": "5.1",
        "weight": 2
      },
      {
        "id": "lem:5.2",
        "kind": "lemma",
        "label": "Lem 5.2",
        "name": "Coarse monotonicity",
        "statement": "A value $d$ at $p$ forces a value $\\ge d$ within $2^M(L+\\tfrac12)$ horizontally at every shallower depth of the backward light cone of $p$.",
        "section": "5.1",
        "weight": 3
      },
      {
        "id": "prop:5.3",
        "kind": "proposition",
        "label": "Prop 5.3",
        "name": "Locating a large triangle",
        "statement": "There is a $\\{0,\\dots,2^{M-m+1}\\}$-valued triangle $\\nabla_{I_*}$ (edges at depths $R_{m-1},R_m$) attaining a value $>2^{M-m}$ at its bottom vertex.",
        "section": "5.2",
        "weight": 3
      },
      {
        "id": "def:good-block",
        "kind": "definition",
        "label": "Def 5.4",
        "name": "Good block",
        "statement": "A maximal $\\{0,d\\}$-valued block ($d\\ge d_*$) that attains $d$; good blocks coarsely partition $\\nabla_{I_*}$.",
        "section": "5.3",
        "weight": 2
      },
      {
        "id": "lem:5.5",
        "kind": "lemma",
        "label": "Lem 5.5",
        "name": "Properties of good blocks",
        "statement": "Coarse disjointness, parentage (each triangle top launches higher-value triangles), inheritance, and coarse covering of good blocks.",
        "section": "5.3",
        "weight": 3
      },
      {
        "id": "lem:5.7",
        "kind": "lemma",
        "label": "Lem 5.7",
        "name": "Strict coarse upward monotonicity",
        "statement": "Moving up along either side of a good block's triangle, attained values strictly increase in a coarse sense.",
        "section": "5.3",
        "weight": 2
      },
      {
        "id": "lem:5.8",
        "kind": "lemma",
        "label": "Lem 5.8",
        "name": "Blocks are small or huge",
        "statement": "A large good block is either short ($\\ell\\le 100L\\cdot 4^M$) or spans all but $O(L\\cdot 2^M)$ of its row.",
        "section": "5.3",
        "weight": 3
      },
      {
        "id": "thm:1.6",
        "kind": "theorem",
        "label": "Thm 1.6",
        "name": "Deterministic criterion (inverse theorem)",
        "statement": "No large initial values, no long 0-block, and no long shallow $\\{0,d\\}$-block $\\Rightarrow a_{(N-1,1)}\\in\\{0,1\\}$. Isolates the two obstructions to Gilbreath.",
        "section": "1.4",
        "weight": 5
      }
    ],
    "edges": [
      {
        "from": "def:array",
        "to": "def:c",
        "type": "uses"
      },
      {
        "from": "def:array",
        "to": "lem:3.7",
        "type": "uses"
      },
      {
        "from": "def:array",
        "to": "lem:3.8",
        "type": "uses"
      },
      {
        "from": "def:array",
        "to": "lem:3.10",
        "type": "uses"
      },
      {
        "from": "def:array",
        "to": "lem:3.11",
        "type": "uses"
      },
      {
        "from": "def:array",
        "to": "prop:2.1",
        "type": "uses"
      },
      {
        "from": "def:c",
        "to": "prop:2.1",
        "type": "uses"
      },
      {
        "from": "prop:2.1",
        "to": "thm:1.4",
        "type": "uses"
      },
      {
        "from": "lem:3.7",
        "to": "lem:3.8",
        "type": "uses"
      },
      {
        "from": "lem:3.8",
        "to": "lem:3.13",
        "type": "uses"
      },
      {
        "from": "def:tower",
        "to": "lem:3.13",
        "type": "uses"
      },
      {
        "from": "def:tower",
        "to": "lem:3.14",
        "type": "uses"
      },
      {
        "from": "lem:3.10",
        "to": "lem:3.11",
        "type": "generalizes"
      },
      {
        "from": "lem:3.14",
        "to": "lem:4.3",
        "type": "uses"
      },
      {
        "from": "lem:3.11",
        "to": "lem:4.3",
        "type": "uses"
      },
      {
        "from": "lem:3.13",
        "to": "prop:4.1",
        "type": "uses"
      },
      {
        "from": "lem:3.7",
        "to": "prop:4.1",
        "type": "uses"
      },
      {
        "from": "def:tower",
        "to": "prop:4.1",
        "type": "uses"
      },
      {
        "from": "def:tower",
        "to": "lem:4.4",
        "type": "uses"
      },
      {
        "from": "lem:4.3",
        "to": "prop:4.1",
        "type": "uses"
      },
      {
        "from": "lem:4.4",
        "to": "prop:4.1",
        "type": "uses"
      },
      {
        "from": "prop:4.1",
        "to": "thm:1.3",
        "type": "uses"
      },
      {
        "from": "thm:1.3",
        "to": "thm:1.2",
        "type": "uses"
      },
      {
        "from": "thm:1.3",
        "to": "thm:1.1",
        "type": "generalizes"
      },
      {
        "from": "lem:3.7",
        "to": "lem:5.1",
        "type": "uses"
      },
      {
        "from": "lem:3.8",
        "to": "lem:5.1",
        "type": "uses"
      },
      {
        "from": "lem:5.1",
        "to": "lem:5.2",
        "type": "uses"
      },
      {
        "from": "lem:3.7",
        "to": "prop:5.3",
        "type": "uses"
      },
      {
        "from": "lem:5.2",
        "to": "prop:5.3",
        "type": "uses"
      },
      {
        "from": "def:good-block",
        "to": "lem:5.5",
        "type": "uses"
      },
      {
        "from": "lem:3.7",
        "to": "lem:5.5",
        "type": "uses"
      },
      {
        "from": "lem:3.8",
        "to": "lem:5.5",
        "type": "uses"
      },
      {
        "from": "lem:5.2",
        "to": "lem:5.5",
        "type": "uses"
      },
      {
        "from": "def:good-block",
        "to": "lem:5.7",
        "type": "uses"
      },
      {
        "from": "lem:5.5",
        "to": "lem:5.7",
        "type": "uses"
      },
      {
        "from": "lem:5.2",
        "to": "lem:5.8",
        "type": "uses"
      },
      {
        "from": "lem:5.5",
        "to": "lem:5.8",
        "type": "uses"
      },
      {
        "from": "lem:5.7",
        "to": "lem:5.8",
        "type": "uses"
      },
      {
        "from": "prop:5.3",
        "to": "thm:1.6",
        "type": "uses"
      },
      {
        "from": "lem:5.8",
        "to": "thm:1.6",
        "type": "uses"
      },
      {
        "from": "lem:3.13",
        "to": "thm:1.6",
        "type": "uses"
      },
      {
        "from": "lem:5.2",
        "to": "thm:1.6",
        "type": "uses"
      }
    ]
  };
  if (typeof g.PaperDiagramData === "object" && g.PaperDiagramData) g.PaperDiagramData["gilbreath"] = D;
  else g.PaperDiagramData = { "gilbreath": D };
  if (typeof module !== "undefined" && module.exports) module.exports = D;
})(typeof window !== "undefined" ? window : globalThis);
