// Library diagram for the paper-diagram viewer — lazy-loaded on demand.
// Sphere packing in dimension 8 — the Sphere-Packing-Lean formalization (after
// Viazovska, Ann. of Math. 2017). AUTO-CONVERTED from the project blueprint's
// dependency graph by leanblueprint_to_paperdiagram.py (deterministic; labels
// only). Fill colour = Lean formalization status (softened for legibility).
;(function (g) {
  var D = {
    "format": "paper-diagram",
    "schemaVersion": 1,
    "meta": {
      "title": "Sphere packing in dimension 8 — a Lean formalization",
      "paper": {
        "authors": [
          "Sphere-Packing-Lean project"
        ],
        "year": 2025,
        "journal": "Lean 4 blueprint — after Viazovska, Ann. of Math. 185 (2017)",
        "note": "Auto-converted (deterministically, no LLM) from the Sphere-Packing-Lean blueprint dependency graph (github.com/thefundamentaltheor3m/Sphere-Packing-Lean) — a formalization of Viazovska’s theorem that the E₈ lattice is the optimal sphere packing in ℝ⁸. The BORDER encodes the statement kind as usual; the FILL encodes Lean formalization status (softened from the blueprint’s own palette for legibility): green = fully formalized, lighter green = statement done / in progress, blue = not yet ready, white = not started. Node labels are the blueprint’s; full statements are not carried across in this version."
      }
    },
    "layout": {
      "engine": "layered",
      "direction": "up"
    },
    "nodes": [
      {
        "id": "def:Schwartz-Space",
        "kind": "definition",
        "label": "Schwartz-Space",
        "name": "Schwartz Space",
        "color": "#e0f3d7"
      },
      {
        "id": "lemma:Schwartz-summable",
        "kind": "lemma",
        "label": "Schwartz-summable",
        "name": "Schwartz summable",
        "color": "#d3e3fb"
      },
      {
        "id": "lemma:Fourier-transform-is-automorphism",
        "kind": "lemma",
        "label": "Fourier-transform-is-automorphism",
        "name": "Fourier transform is automorphism",
        "color": "#a9dcb8"
      },
      {
        "id": "thm:Poisson-summation-formula",
        "kind": "theorem",
        "label": "Poisson-summation-formula",
        "name": "Poisson summation formula"
      },
      {
        "id": "thm:Cohn-Elkies-periodic",
        "kind": "theorem",
        "label": "Cohn-Elkies-periodic",
        "name": "Cohn Elkies periodic",
        "color": "#c9ecca"
      },
      {
        "id": "thm:Cohn-Elkies-general",
        "kind": "theorem",
        "label": "Cohn-Elkies-general",
        "name": "Cohn Elkies general",
        "color": "#c9ecca"
      },
      {
        "id": "def:Ek",
        "kind": "definition",
        "label": "Ek",
        "name": "Ek",
        "color": "#d3e3fb"
      },
      {
        "id": "lemma:Ek-Fourier",
        "kind": "lemma",
        "label": "Ek-Fourier",
        "name": "Ek Fourier",
        "color": "#a9dcb8"
      },
      {
        "id": "def:phi4-phi2-phi0",
        "kind": "definition",
        "label": "phi4-phi2-phi0",
        "name": "phi4 phi2 phi0"
      },
      {
        "id": "def:FG-definition",
        "kind": "definition",
        "label": "FG-definition",
        "name": "FG definition",
        "color": "#e0f3d7"
      },
      {
        "id": "lemma:Ek-is-modular-form",
        "kind": "lemma",
        "label": "Ek-is-modular-form",
        "name": "Ek is modular form",
        "color": "#a9dcb8"
      },
      {
        "id": "cor:phi4-bound",
        "kind": "corollary",
        "label": "phi4-bound",
        "name": "phi4 bound"
      },
      {
        "id": "cor:phi0-bound",
        "kind": "corollary",
        "label": "phi0-bound",
        "name": "phi0 bound",
        "color": "#d3e3fb"
      },
      {
        "id": "cor:phi2-bound",
        "kind": "corollary",
        "label": "phi2-bound",
        "name": "phi2 bound"
      },
      {
        "id": "def:a-definition",
        "kind": "definition",
        "label": "a-definition",
        "name": "a definition",
        "color": "#e0f3d7"
      },
      {
        "id": "lemma:phi0-transform",
        "kind": "lemma",
        "label": "phi0-transform",
        "name": "phi0 transform"
      },
      {
        "id": "lemma:F-G-phi-psi-identities",
        "kind": "lemma",
        "label": "F-G-phi-psi-identities",
        "name": "F G phi psi identities"
      },
      {
        "id": "lemma:Qlim",
        "kind": "lemma",
        "label": "Qlim",
        "name": "Qlim"
      },
      {
        "id": "cor:phi0-near-0-infty",
        "kind": "corollary",
        "label": "phi0-near-0-infty",
        "name": "phi0 near 0 infty"
      },
      {
        "id": "prop:a-schwartz",
        "kind": "proposition",
        "label": "a-schwartz",
        "name": "a schwartz"
      },
      {
        "id": "prop:a-double-zeros",
        "kind": "proposition",
        "label": "a-double-zeros",
        "name": "a double zeros"
      },
      {
        "id": "lemma:ineqABnew-equiv",
        "kind": "lemma",
        "label": "ineqABnew-equiv",
        "name": "ineqABnew equiv"
      },
      {
        "id": "cor:ineqBnew",
        "kind": "corollary",
        "label": "ineqBnew",
        "name": "ineqBnew",
        "color": "#d3e3fb"
      },
      {
        "id": "def:psiI-psiT-psiS",
        "kind": "definition",
        "label": "psiI-psiT-psiS",
        "name": "psiI psiT psiS"
      },
      {
        "id": "cor:psiI-near-0-infty",
        "kind": "corollary",
        "label": "psiI-near-0-infty",
        "name": "psiI near 0 infty"
      },
      {
        "id": "def:b-definition",
        "kind": "definition",
        "label": "b-definition",
        "name": "b definition"
      },
      {
        "id": "prop:b-double-zeros",
        "kind": "proposition",
        "label": "b-double-zeros",
        "name": "b double zeros"
      },
      {
        "id": "prop:b-fourier",
        "kind": "proposition",
        "label": "b-fourier",
        "name": "b fourier"
      },
      {
        "id": "prop:b-another-integral",
        "kind": "proposition",
        "label": "b-another-integral",
        "name": "b another integral"
      },
      {
        "id": "prop:ineqB",
        "kind": "proposition",
        "label": "ineqB",
        "name": "ineqB"
      },
      {
        "id": "prop:ineqA",
        "kind": "proposition",
        "label": "ineqA",
        "name": "ineqA"
      },
      {
        "id": "thm:g1",
        "kind": "theorem",
        "label": "g1",
        "name": "g1"
      },
      {
        "id": "prop:b0",
        "kind": "proposition",
        "label": "b0",
        "name": "b0"
      },
      {
        "id": "thm:g",
        "kind": "theorem",
        "label": "g",
        "name": "g"
      },
      {
        "id": "lemma:Gaussian-Fourier",
        "kind": "lemma",
        "label": "Gaussian-Fourier",
        "name": "Gaussian Fourier",
        "color": "#d3e3fb"
      },
      {
        "id": "prop:a-fourier",
        "kind": "proposition",
        "label": "a-fourier",
        "name": "a fourier"
      },
      {
        "id": "prop:Qdec",
        "kind": "proposition",
        "label": "Qdec",
        "name": "Qdec"
      },
      {
        "id": "corollary:upper-bound-E8",
        "kind": "corollary",
        "label": "upper-bound-E8",
        "name": "upper bound E8"
      },
      {
        "id": "def:Periodic-sphere-packing-constant",
        "kind": "definition",
        "label": "Periodic-sphere-packing-constant",
        "name": "Periodic sphere packing constant",
        "color": "#e0f3d7"
      },
      {
        "id": "thm:periodic-packing-optimal",
        "kind": "theorem",
        "label": "periodic-packing-optimal",
        "name": "periodic packing optimal",
        "color": "#d3e3fb"
      },
      {
        "id": "theorem:CE_Main",
        "kind": "theorem",
        "label": "CE_Main",
        "name": "CE Main"
      },
      {
        "id": "def:serre-der",
        "kind": "definition",
        "label": "serre-der",
        "name": "serre der",
        "color": "#e0f3d7"
      },
      {
        "id": "thm:serre-der-prod-rule",
        "kind": "theorem",
        "label": "serre-der-prod-rule",
        "name": "serre der prod rule",
        "color": "#a9dcb8"
      },
      {
        "id": "thm:serre-der-equiv-action",
        "kind": "theorem",
        "label": "serre-der-equiv-action",
        "name": "serre der equiv action",
        "color": "#d3e3fb"
      },
      {
        "id": "prop:theta-der",
        "kind": "proposition",
        "label": "theta-der",
        "name": "theta der",
        "color": "#d3e3fb"
      },
      {
        "id": "lemma:FG-de",
        "kind": "lemma",
        "label": "FG-de",
        "name": "FG de"
      },
      {
        "id": "thm:serre-der-modularity",
        "kind": "theorem",
        "label": "serre-der-modularity",
        "name": "serre der modularity",
        "color": "#c9ecca"
      },
      {
        "id": "cor:MLDE-pos",
        "kind": "corollary",
        "label": "MLDE-pos",
        "name": "MLDE pos"
      },
      {
        "id": "thm:ramanujan-formula",
        "kind": "theorem",
        "label": "ramanujan-formula",
        "name": "ramanujan formula",
        "color": "#d3e3fb"
      },
      {
        "id": "lemma:F-G-pos",
        "kind": "lemma",
        "label": "F-G-pos",
        "name": "F G pos",
        "color": "#c9ecca"
      },
      {
        "id": "cor:logder-disc-E2",
        "kind": "corollary",
        "label": "logder-disc-E2",
        "name": "logder disc E2",
        "color": "#d3e3fb"
      },
      {
        "id": "cor:ineqAnew",
        "kind": "corollary",
        "label": "ineqAnew",
        "name": "ineqAnew",
        "color": "#d3e3fb"
      },
      {
        "id": "thm:anti-serre-der-pos",
        "kind": "theorem",
        "label": "anti-serre-der-pos",
        "name": "anti serre der pos"
      },
      {
        "id": "SpherePacking.scale_finiteDensity",
        "kind": "remark",
        "label": "SpherePacking.scale_finiteDensity",
        "name": "SpherePacking.scale finiteDensity",
        "color": "#c9ecca"
      },
      {
        "id": "SpherePacking.scale_density",
        "kind": "remark",
        "label": "SpherePacking.scale_density",
        "name": "SpherePacking.scale density",
        "color": "#c9ecca"
      },
      {
        "id": "SpherePacking.constant_eq_constant_normalized",
        "kind": "remark",
        "label": "SpherePacking.constant_eq_constant_normalized",
        "name": "SpherePacking.constant eq constant normalized",
        "color": "#c9ecca"
      },
      {
        "id": "lemma:E2-transform-general",
        "kind": "lemma",
        "label": "E2-transform-general",
        "name": "E2 transform general",
        "color": "#a9dcb8"
      },
      {
        "id": "E8Packing-covol",
        "kind": "remark",
        "label": "E8Packing-covol",
        "name": "E8Packing covol",
        "color": "#a9dcb8"
      },
      {
        "id": "E8Packing-density",
        "kind": "remark",
        "label": "E8Packing-density",
        "name": "E8Packing density",
        "color": "#c9ecca"
      },
      {
        "id": "def:th00-th01-th10",
        "kind": "definition",
        "label": "th00-th01-th10",
        "name": "th00 th01 th10",
        "color": "#e0f3d7"
      },
      {
        "id": "def:H2-H3-H4",
        "kind": "definition",
        "label": "H2-H3-H4",
        "name": "H2 H3 H4",
        "color": "#e0f3d7"
      },
      {
        "id": "lemma:theta-transform-S-T",
        "kind": "lemma",
        "label": "theta-transform-S-T",
        "name": "theta transform S T",
        "color": "#a9dcb8"
      },
      {
        "id": "prop:H2-fourier",
        "kind": "proposition",
        "label": "H2-fourier",
        "name": "H2 fourier",
        "color": "#d3e3fb"
      },
      {
        "id": "prop:H4-fourier",
        "kind": "proposition",
        "label": "H4-fourier",
        "name": "H4 fourier"
      },
      {
        "id": "def: h",
        "kind": "definition",
        "label": " h",
        "name": " h",
        "color": "#d3e3fb"
      },
      {
        "id": "prop:H3-fourier",
        "kind": "proposition",
        "label": "H3-fourier",
        "name": "H3 fourier",
        "color": "#d3e3fb"
      },
      {
        "id": "lemma:theta-slash-invariant",
        "kind": "lemma",
        "label": "theta-slash-invariant",
        "name": "theta slash invariant",
        "color": "#a9dcb8"
      },
      {
        "id": "cor:theta-pos",
        "kind": "corollary",
        "label": "theta-pos",
        "name": "theta pos",
        "color": "#a9dcb8"
      },
      {
        "id": "lemma:theta-bounded-im-infty",
        "kind": "lemma",
        "label": "theta-bounded-im-infty",
        "name": "theta bounded im infty",
        "color": "#a9dcb8"
      },
      {
        "id": "def:congruence-subgroup",
        "kind": "definition",
        "label": "congruence-subgroup",
        "name": "congruence subgroup",
        "color": "#e0f3d7"
      },
      {
        "id": "def:Mk",
        "kind": "definition",
        "label": "Mk",
        "name": "Mk",
        "color": "#e0f3d7"
      },
      {
        "id": "thm:nonpos_wt",
        "kind": "theorem",
        "label": "nonpos_wt",
        "name": "nonpos wt",
        "color": "#a9dcb8"
      },
      {
        "id": "thm:lvl1_dims",
        "kind": "theorem",
        "label": "lvl1_dims",
        "name": "lvl1 dims",
        "color": "#a9dcb8"
      },
      {
        "id": "thm:dim-mf-general-level",
        "kind": "theorem",
        "label": "dim-mf-general-level",
        "name": "dim mf general level",
        "color": "#d3e3fb"
      },
      {
        "id": "cor:dim-mf",
        "kind": "corollary",
        "label": "dim-mf",
        "name": "dim mf",
        "color": "#a9dcb8"
      },
      {
        "id": "prop:a-another-integral",
        "kind": "proposition",
        "label": "a-another-integral",
        "name": "a another integral"
      },
      {
        "id": "prop:a0",
        "kind": "proposition",
        "label": "a0",
        "name": "a0"
      },
      {
        "id": "E8-vector-norms",
        "kind": "remark",
        "label": "E8-vector-norms",
        "name": "E8 vector norms",
        "color": "#a9dcb8"
      },
      {
        "id": "lemma:inv-power-summable",
        "kind": "lemma",
        "label": "inv-power-summable",
        "name": "inv power summable",
        "color": "#d3e3fb"
      },
      {
        "id": "def:Fourier-Transform",
        "kind": "definition",
        "label": "Fourier-Transform",
        "name": "Fourier Transform",
        "color": "#e0f3d7"
      },
      {
        "id": "lemma:volume-ball-ratio-limit",
        "kind": "lemma",
        "label": "volume-ball-ratio-limit",
        "name": "volume ball ratio limit",
        "color": "#a9dcb8"
      },
      {
        "id": "theorem:psp-density",
        "kind": "theorem",
        "label": "psp-density",
        "name": "psp density",
        "color": "#c9ecca"
      },
      {
        "id": "lemma:mod_form_poly_growth",
        "kind": "lemma",
        "label": "mod_form_poly_growth",
        "name": "mod form poly growth",
        "color": "#a9dcb8"
      },
      {
        "id": "SpherePacking.balls",
        "kind": "remark",
        "label": "SpherePacking.balls",
        "name": "SpherePacking.balls",
        "color": "#e0f3d7"
      },
      {
        "id": "SpherePacking.finiteDensity",
        "kind": "remark",
        "label": "SpherePacking.finiteDensity",
        "name": "SpherePacking.finiteDensity",
        "color": "#e0f3d7"
      },
      {
        "id": "SpherePacking.density",
        "kind": "remark",
        "label": "SpherePacking.density",
        "name": "SpherePacking.density",
        "color": "#e0f3d7"
      },
      {
        "id": "lemma:sp-finite-density-bound",
        "kind": "lemma",
        "label": "sp-finite-density-bound",
        "name": "sp finite density bound",
        "color": "#c9ecca"
      },
      {
        "id": "cor:disc-pos",
        "kind": "corollary",
        "label": "disc-pos",
        "name": "disc pos",
        "color": "#a9dcb8"
      },
      {
        "id": "def:Gamma-1-Action",
        "kind": "definition",
        "label": "Gamma-1-Action",
        "name": "Gamma 1 Action",
        "color": "#a9dcb8"
      },
      {
        "id": "def:slash-operator",
        "kind": "definition",
        "label": "slash-operator",
        "name": "slash operator",
        "color": "#e0f3d7"
      },
      {
        "id": "lemma:slash-negI-even-weight",
        "kind": "lemma",
        "label": "slash-negI-even-weight",
        "name": "slash negI even weight",
        "color": "#a9dcb8"
      },
      {
        "id": "lemma:Gamma-1-generators",
        "kind": "lemma",
        "label": "Gamma-1-generators",
        "name": "Gamma 1 generators",
        "color": "#a9dcb8"
      },
      {
        "id": "lemma:theta-modular",
        "kind": "lemma",
        "label": "theta-modular",
        "name": "theta modular",
        "color": "#a9dcb8"
      },
      {
        "id": "lemma:jacobi-identity",
        "kind": "lemma",
        "label": "jacobi-identity",
        "name": "jacobi identity",
        "color": "#a9dcb8"
      },
      {
        "id": "lemma:lv1-lv2-identities",
        "kind": "lemma",
        "label": "lv1-lv2-identities",
        "name": "lv1 lv2 identities",
        "color": "#d3e3fb"
      },
      {
        "id": "lemma:psiI-psiT-psiS-fourier",
        "kind": "lemma",
        "label": "psiI-psiT-psiS-fourier",
        "name": "psiI psiT psiS fourier"
      },
      {
        "id": "SpherePacking.scale",
        "kind": "remark",
        "label": "SpherePacking.scale",
        "name": "SpherePacking.scale",
        "color": "#e0f3d7"
      },
      {
        "id": "def:Gamma-generators",
        "kind": "definition",
        "label": "Gamma-generators",
        "name": "Gamma generators",
        "color": "#e0f3d7"
      },
      {
        "id": "lemma:Gamma-2-generators",
        "kind": "lemma",
        "label": "Gamma-2-generators",
        "name": "Gamma 2 generators",
        "color": "#a9dcb8"
      },
      {
        "id": "E8-Lattice",
        "kind": "remark",
        "label": "E8-Lattice",
        "name": "E8 Lattice",
        "color": "#a9dcb8"
      },
      {
        "id": "lemma:der-q-series",
        "kind": "lemma",
        "label": "der-q-series",
        "name": "der q series",
        "color": "#a9dcb8"
      },
      {
        "id": "lemma:log-der-inf",
        "kind": "lemma",
        "label": "log-der-inf",
        "name": "log der inf",
        "color": "#d3e3fb"
      },
      {
        "id": "thm:smooth-fast-decay-schwartz",
        "kind": "theorem",
        "label": "smooth-fast-decay-schwartz",
        "name": "smooth fast decay schwartz"
      },
      {
        "id": "prop:b-schwartz",
        "kind": "proposition",
        "label": "b-schwartz",
        "name": "b schwartz"
      },
      {
        "id": "E8-Matrix",
        "kind": "remark",
        "label": "E8-Matrix",
        "name": "E8 Matrix",
        "color": "#e0f3d7"
      },
      {
        "id": "E8-defs-equivalent",
        "kind": "remark",
        "label": "E8-defs-equivalent",
        "name": "E8 defs equivalent",
        "color": "#a9dcb8"
      },
      {
        "id": "E8-is-basis",
        "kind": "remark",
        "label": "E8-is-basis",
        "name": "E8 is basis",
        "color": "#a9dcb8"
      },
      {
        "id": "def:derivative",
        "kind": "definition",
        "label": "derivative",
        "name": "derivative",
        "color": "#e0f3d7"
      },
      {
        "id": "lemma:dedekind_eta_transformation",
        "kind": "lemma",
        "label": "dedekind_eta_transformation",
        "name": "dedekind eta transformation",
        "color": "#a9dcb8"
      },
      {
        "id": "lemma:disc-cuspform",
        "kind": "lemma",
        "label": "disc-cuspform",
        "name": "disc cuspform",
        "color": "#a9dcb8"
      },
      {
        "id": "lemma:psi-bound",
        "kind": "lemma",
        "label": "psi-bound",
        "name": "psi bound",
        "color": "#d3e3fb"
      },
      {
        "id": "cor:disc-nonvanishing",
        "kind": "corollary",
        "label": "disc-nonvanishing",
        "name": "disc nonvanishing",
        "color": "#a9dcb8"
      },
      {
        "id": "lemma:lattice-points-bound",
        "kind": "lemma",
        "label": "lattice-points-bound",
        "name": "lattice points bound",
        "color": "#a9dcb8"
      },
      {
        "id": "def:E2",
        "kind": "definition",
        "label": "E2",
        "name": "E2",
        "color": "#e0f3d7"
      },
      {
        "id": "lemma:E2-transform-S",
        "kind": "lemma",
        "label": "E2-transform-S",
        "name": "E2 transform S",
        "color": "#a9dcb8"
      },
      {
        "id": "lem:bound-I1-I3-I5",
        "kind": "lemma",
        "label": "bound-I1-I3-I5",
        "name": "bound I1 I3 I5",
        "color": "#d3e3fb"
      },
      {
        "id": "lemma:bound-J2-J4-J6",
        "kind": "lemma",
        "label": "bound-J2-J4-J6",
        "name": "bound J2 J4 J6"
      },
      {
        "id": "lem:bound-I2-I4-I6",
        "kind": "lemma",
        "label": "bound-I2-I4-I6",
        "name": "bound I2 I4 I6",
        "color": "#d3e3fb"
      },
      {
        "id": "def:dedekind_eta",
        "kind": "definition",
        "label": "dedekind_eta",
        "name": "dedekind eta",
        "color": "#e0f3d7"
      },
      {
        "id": "def:disc-definition",
        "kind": "definition",
        "label": "disc-definition",
        "name": "disc definition",
        "color": "#e0f3d7"
      },
      {
        "id": "lemma:disc-E4E6",
        "kind": "lemma",
        "label": "disc-E4E6",
        "name": "disc E4E6",
        "color": "#a9dcb8"
      },
      {
        "id": "lemma:mod-div-disc-bound",
        "kind": "lemma",
        "label": "mod-div-disc-bound",
        "name": "mod div disc bound",
        "color": "#a9dcb8"
      },
      {
        "id": "lemma:periodic-points-bounds",
        "kind": "lemma",
        "label": "periodic-points-bounds",
        "name": "periodic points bounds",
        "color": "#a9dcb8"
      },
      {
        "id": "lemma:slash-operator-chain-rule",
        "kind": "lemma",
        "label": "slash-operator-chain-rule",
        "name": "slash operator chain rule",
        "color": "#a9dcb8"
      },
      {
        "id": "lemma:bound-J1-J3-J5",
        "kind": "lemma",
        "label": "bound-J1-J3-J5",
        "name": "bound J1 J3 J5"
      },
      {
        "id": "def:automorphy-factor",
        "kind": "definition",
        "label": "automorphy-factor",
        "name": "automorphy factor",
        "color": "#e0f3d7"
      },
      {
        "id": "lemma:automorphy-factor-chain-rule",
        "kind": "lemma",
        "label": "automorphy-factor-chain-rule",
        "name": "automorphy factor chain rule",
        "color": "#a9dcb8"
      },
      {
        "id": "lemma:psi-new",
        "kind": "lemma",
        "label": "psi-new",
        "name": "psi new",
        "color": "#d3e3fb"
      },
      {
        "id": "def:dual-lattice",
        "kind": "definition",
        "label": "dual-lattice",
        "name": "dual lattice",
        "color": "#e0f3d7"
      },
      {
        "id": "lem:integral-bound",
        "kind": "lemma",
        "label": "integral-bound",
        "name": "integral bound",
        "color": "#d3e3fb"
      },
      {
        "id": "E8-Set",
        "kind": "remark",
        "label": "E8-Set",
        "name": "E8 Set",
        "color": "#e0f3d7"
      },
      {
        "id": "def:level-N-princ-cong-subgp",
        "kind": "definition",
        "label": "level-N-princ-cong-subgp",
        "name": "level N princ cong subgp",
        "color": "#e0f3d7"
      }
    ],
    "edges": [
      {
        "from": "def:Schwartz-Space",
        "to": "lemma:Schwartz-summable",
        "type": "uses"
      },
      {
        "from": "def:Schwartz-Space",
        "to": "lemma:Fourier-transform-is-automorphism",
        "type": "uses"
      },
      {
        "from": "lemma:Schwartz-summable",
        "to": "thm:Poisson-summation-formula",
        "type": "uses"
      },
      {
        "from": "thm:Poisson-summation-formula",
        "to": "thm:Cohn-Elkies-periodic",
        "type": "uses"
      },
      {
        "from": "thm:Cohn-Elkies-periodic",
        "to": "thm:Cohn-Elkies-general",
        "type": "uses"
      },
      {
        "from": "def:Ek",
        "to": "lemma:Ek-Fourier",
        "type": "uses"
      },
      {
        "from": "def:Ek",
        "to": "def:phi4-phi2-phi0",
        "type": "uses"
      },
      {
        "from": "def:Ek",
        "to": "def:FG-definition",
        "type": "uses"
      },
      {
        "from": "def:Ek",
        "to": "lemma:Ek-is-modular-form",
        "type": "uses"
      },
      {
        "from": "lemma:Ek-Fourier",
        "to": "cor:phi4-bound",
        "type": "uses"
      },
      {
        "from": "lemma:Ek-Fourier",
        "to": "cor:phi0-bound",
        "type": "uses"
      },
      {
        "from": "lemma:Ek-Fourier",
        "to": "cor:phi2-bound",
        "type": "uses"
      },
      {
        "from": "def:phi4-phi2-phi0",
        "to": "cor:phi4-bound",
        "type": "uses"
      },
      {
        "from": "def:phi4-phi2-phi0",
        "to": "cor:phi2-bound",
        "type": "uses"
      },
      {
        "from": "def:phi4-phi2-phi0",
        "to": "def:a-definition",
        "type": "uses"
      },
      {
        "from": "def:phi4-phi2-phi0",
        "to": "lemma:phi0-transform",
        "type": "uses"
      },
      {
        "from": "def:FG-definition",
        "to": "lemma:F-G-phi-psi-identities",
        "type": "uses"
      },
      {
        "from": "lemma:Ek-is-modular-form",
        "to": "lemma:phi0-transform",
        "type": "uses"
      },
      {
        "from": "lemma:Ek-is-modular-form",
        "to": "lemma:Qlim",
        "type": "uses"
      },
      {
        "from": "cor:phi4-bound",
        "to": "cor:phi0-near-0-infty",
        "type": "uses"
      },
      {
        "from": "cor:phi0-bound",
        "to": "cor:phi0-near-0-infty",
        "type": "uses"
      },
      {
        "from": "cor:phi0-bound",
        "to": "prop:a-schwartz",
        "type": "uses"
      },
      {
        "from": "cor:phi2-bound",
        "to": "cor:phi0-near-0-infty",
        "type": "uses"
      },
      {
        "from": "def:a-definition",
        "to": "prop:a-schwartz",
        "type": "uses"
      },
      {
        "from": "def:a-definition",
        "to": "prop:a-double-zeros",
        "type": "uses"
      },
      {
        "from": "lemma:phi0-transform",
        "to": "cor:phi0-near-0-infty",
        "type": "uses"
      },
      {
        "from": "lemma:F-G-phi-psi-identities",
        "to": "lemma:ineqABnew-equiv",
        "type": "uses"
      },
      {
        "from": "lemma:Qlim",
        "to": "cor:ineqBnew",
        "type": "uses"
      },
      {
        "from": "def:psiI-psiT-psiS",
        "to": "cor:psiI-near-0-infty",
        "type": "uses"
      },
      {
        "from": "def:psiI-psiT-psiS",
        "to": "def:b-definition",
        "type": "uses"
      },
      {
        "from": "def:psiI-psiT-psiS",
        "to": "lemma:ineqABnew-equiv",
        "type": "uses"
      },
      {
        "from": "cor:psiI-near-0-infty",
        "to": "prop:b-double-zeros",
        "type": "uses"
      },
      {
        "from": "def:b-definition",
        "to": "prop:b-fourier",
        "type": "uses"
      },
      {
        "from": "def:b-definition",
        "to": "prop:b-another-integral",
        "type": "uses"
      },
      {
        "from": "lemma:ineqABnew-equiv",
        "to": "prop:ineqB",
        "type": "uses"
      },
      {
        "from": "lemma:ineqABnew-equiv",
        "to": "prop:ineqA",
        "type": "uses"
      },
      {
        "from": "prop:b-double-zeros",
        "to": "prop:b-another-integral",
        "type": "uses"
      },
      {
        "from": "prop:b-fourier",
        "to": "thm:g1",
        "type": "uses"
      },
      {
        "from": "prop:b-another-integral",
        "to": "prop:b0",
        "type": "uses"
      },
      {
        "from": "thm:g1",
        "to": "thm:g",
        "type": "uses"
      },
      {
        "from": "prop:ineqB",
        "to": "thm:g1",
        "type": "uses"
      },
      {
        "from": "prop:ineqA",
        "to": "thm:g1",
        "type": "uses"
      },
      {
        "from": "lemma:Gaussian-Fourier",
        "to": "prop:b-fourier",
        "type": "uses"
      },
      {
        "from": "lemma:Gaussian-Fourier",
        "to": "prop:a-fourier",
        "type": "uses"
      },
      {
        "from": "prop:a-fourier",
        "to": "thm:g1",
        "type": "uses"
      },
      {
        "from": "prop:Qdec",
        "to": "cor:ineqBnew",
        "type": "uses"
      },
      {
        "from": "cor:ineqBnew",
        "to": "prop:ineqB",
        "type": "uses"
      },
      {
        "from": "def:Periodic-sphere-packing-constant",
        "to": "thm:periodic-packing-optimal",
        "type": "uses"
      },
      {
        "from": "thm:periodic-packing-optimal",
        "to": "thm:Cohn-Elkies-general",
        "type": "uses"
      },
      {
        "from": "thm:Cohn-Elkies-general",
        "to": "theorem:CE_Main",
        "type": "uses"
      },
      {
        "from": "cor:phi0-near-0-infty",
        "to": "prop:a-double-zeros",
        "type": "uses"
      },
      {
        "from": "prop:a-schwartz",
        "to": "prop:a-fourier",
        "type": "uses"
      },
      {
        "from": "thm:g",
        "to": "theorem:CE_Main",
        "type": "uses"
      },
      {
        "from": "def:serre-der",
        "to": "thm:serre-der-prod-rule",
        "type": "uses"
      },
      {
        "from": "def:serre-der",
        "to": "thm:serre-der-equiv-action",
        "type": "uses"
      },
      {
        "from": "def:serre-der",
        "to": "prop:theta-der",
        "type": "uses"
      },
      {
        "from": "thm:serre-der-prod-rule",
        "to": "lemma:FG-de",
        "type": "uses"
      },
      {
        "from": "thm:serre-der-equiv-action",
        "to": "thm:serre-der-modularity",
        "type": "uses"
      },
      {
        "from": "prop:theta-der",
        "to": "lemma:FG-de",
        "type": "uses"
      },
      {
        "from": "lemma:FG-de",
        "to": "cor:MLDE-pos",
        "type": "uses"
      },
      {
        "from": "thm:serre-der-modularity",
        "to": "thm:ramanujan-formula",
        "type": "uses"
      },
      {
        "from": "thm:ramanujan-formula",
        "to": "cor:phi0-bound",
        "type": "uses"
      },
      {
        "from": "thm:ramanujan-formula",
        "to": "lemma:FG-de",
        "type": "uses"
      },
      {
        "from": "thm:ramanujan-formula",
        "to": "lemma:F-G-pos",
        "type": "uses"
      },
      {
        "from": "thm:ramanujan-formula",
        "to": "cor:logder-disc-E2",
        "type": "uses"
      },
      {
        "from": "lemma:F-G-pos",
        "to": "cor:ineqBnew",
        "type": "uses"
      },
      {
        "from": "lemma:F-G-pos",
        "to": "cor:ineqAnew",
        "type": "uses"
      },
      {
        "from": "cor:logder-disc-E2",
        "to": "thm:anti-serre-der-pos",
        "type": "uses"
      },
      {
        "from": "thm:anti-serre-der-pos",
        "to": "prop:Qdec",
        "type": "uses"
      },
      {
        "from": "SpherePacking.scale_finiteDensity",
        "to": "SpherePacking.scale_density",
        "type": "uses"
      },
      {
        "from": "SpherePacking.scale_density",
        "to": "SpherePacking.constant_eq_constant_normalized",
        "type": "uses"
      },
      {
        "from": "lemma:E2-transform-general",
        "to": "thm:serre-der-equiv-action",
        "type": "uses"
      },
      {
        "from": "cor:MLDE-pos",
        "to": "prop:Qdec",
        "type": "uses"
      },
      {
        "from": "theorem:CE_Main",
        "to": "corollary:upper-bound-E8",
        "type": "uses"
      },
      {
        "from": "E8Packing-covol",
        "to": "E8Packing-density",
        "type": "uses"
      },
      {
        "from": "E8Packing-density",
        "to": "theorem:CE_Main",
        "type": "uses"
      },
      {
        "from": "def:th00-th01-th10",
        "to": "def:H2-H3-H4",
        "type": "uses"
      },
      {
        "from": "def:H2-H3-H4",
        "to": "def:FG-definition",
        "type": "uses"
      },
      {
        "from": "def:H2-H3-H4",
        "to": "lemma:theta-transform-S-T",
        "type": "uses"
      },
      {
        "from": "def:H2-H3-H4",
        "to": "prop:H2-fourier",
        "type": "uses"
      },
      {
        "from": "def:H2-H3-H4",
        "to": "prop:H4-fourier",
        "type": "uses"
      },
      {
        "from": "def:H2-H3-H4",
        "to": "def: h",
        "type": "uses"
      },
      {
        "from": "def:H2-H3-H4",
        "to": "prop:H3-fourier",
        "type": "uses"
      },
      {
        "from": "lemma:theta-transform-S-T",
        "to": "lemma:Qlim",
        "type": "uses"
      },
      {
        "from": "lemma:theta-transform-S-T",
        "to": "lemma:theta-slash-invariant",
        "type": "uses"
      },
      {
        "from": "lemma:theta-transform-S-T",
        "to": "cor:theta-pos",
        "type": "uses"
      },
      {
        "from": "def: h",
        "to": "def:psiI-psiT-psiS",
        "type": "uses"
      },
      {
        "from": "lemma:theta-slash-invariant",
        "to": "lemma:theta-bounded-im-infty",
        "type": "uses"
      },
      {
        "from": "cor:theta-pos",
        "to": "lemma:F-G-pos",
        "type": "uses"
      },
      {
        "from": "cor:theta-pos",
        "to": "cor:MLDE-pos",
        "type": "uses"
      },
      {
        "from": "def:congruence-subgroup",
        "to": "def:Mk",
        "type": "uses"
      },
      {
        "from": "def:Mk",
        "to": "lemma:Ek-is-modular-form",
        "type": "uses"
      },
      {
        "from": "def:Mk",
        "to": "thm:serre-der-modularity",
        "type": "uses"
      },
      {
        "from": "def:Mk",
        "to": "thm:nonpos_wt",
        "type": "uses"
      },
      {
        "from": "def:Mk",
        "to": "thm:lvl1_dims",
        "type": "uses"
      },
      {
        "from": "thm:lvl1_dims",
        "to": "thm:dim-mf-general-level",
        "type": "uses"
      },
      {
        "from": "thm:lvl1_dims",
        "to": "cor:dim-mf",
        "type": "uses"
      },
      {
        "from": "prop:a-another-integral",
        "to": "prop:a0",
        "type": "uses"
      },
      {
        "from": "prop:a0",
        "to": "thm:g1",
        "type": "uses"
      },
      {
        "from": "prop:a-double-zeros",
        "to": "prop:a-another-integral",
        "type": "uses"
      },
      {
        "from": "lemma:inv-power-summable",
        "to": "thm:Poisson-summation-formula",
        "type": "uses"
      },
      {
        "from": "def:Fourier-Transform",
        "to": "lemma:Fourier-transform-is-automorphism",
        "type": "uses"
      },
      {
        "from": "def:Fourier-Transform",
        "to": "thm:Poisson-summation-formula",
        "type": "uses"
      },
      {
        "from": "def:Fourier-Transform",
        "to": "lemma:Gaussian-Fourier",
        "type": "uses"
      },
      {
        "from": "lemma:volume-ball-ratio-limit",
        "to": "theorem:psp-density",
        "type": "uses"
      },
      {
        "from": "theorem:psp-density",
        "to": "E8Packing-density",
        "type": "uses"
      },
      {
        "from": "lemma:mod_form_poly_growth",
        "to": "cor:phi0-bound",
        "type": "uses"
      },
      {
        "from": "cor:ineqAnew",
        "to": "prop:ineqA",
        "type": "uses"
      },
      {
        "from": "SpherePacking.balls",
        "to": "SpherePacking.finiteDensity",
        "type": "uses"
      },
      {
        "from": "SpherePacking.finiteDensity",
        "to": "SpherePacking.scale_finiteDensity",
        "type": "uses"
      },
      {
        "from": "SpherePacking.finiteDensity",
        "to": "SpherePacking.density",
        "type": "uses"
      },
      {
        "from": "SpherePacking.finiteDensity",
        "to": "lemma:sp-finite-density-bound",
        "type": "uses"
      },
      {
        "from": "SpherePacking.density",
        "to": "thm:Cohn-Elkies-periodic",
        "type": "uses"
      },
      {
        "from": "SpherePacking.density",
        "to": "def:Periodic-sphere-packing-constant",
        "type": "uses"
      },
      {
        "from": "SpherePacking.density",
        "to": "theorem:psp-density",
        "type": "uses"
      },
      {
        "from": "lemma:sp-finite-density-bound",
        "to": "theorem:psp-density",
        "type": "uses"
      },
      {
        "from": "prop:b0",
        "to": "thm:g1",
        "type": "uses"
      },
      {
        "from": "cor:disc-pos",
        "to": "lemma:ineqABnew-equiv",
        "type": "uses"
      },
      {
        "from": "cor:disc-pos",
        "to": "cor:MLDE-pos",
        "type": "uses"
      },
      {
        "from": "def:Gamma-1-Action",
        "to": "def:slash-operator",
        "type": "uses"
      },
      {
        "from": "def:slash-operator",
        "to": "lemma:slash-negI-even-weight",
        "type": "uses"
      },
      {
        "from": "lemma:slash-negI-even-weight",
        "to": "lemma:theta-slash-invariant",
        "type": "uses"
      },
      {
        "from": "lemma:Gamma-1-generators",
        "to": "lemma:theta-bounded-im-infty",
        "type": "uses"
      },
      {
        "from": "lemma:theta-bounded-im-infty",
        "to": "lemma:theta-modular",
        "type": "uses"
      },
      {
        "from": "lemma:theta-modular",
        "to": "lemma:jacobi-identity",
        "type": "uses"
      },
      {
        "from": "lemma:theta-modular",
        "to": "lemma:lv1-lv2-identities",
        "type": "uses"
      },
      {
        "from": "lemma:psiI-psiT-psiS-fourier",
        "to": "prop:b-double-zeros",
        "type": "uses"
      },
      {
        "from": "SpherePacking.scale",
        "to": "SpherePacking.scale_finiteDensity",
        "type": "uses"
      },
      {
        "from": "def:Gamma-generators",
        "to": "lemma:Gamma-1-generators",
        "type": "uses"
      },
      {
        "from": "def:Gamma-generators",
        "to": "lemma:Gamma-2-generators",
        "type": "uses"
      },
      {
        "from": "lemma:Gamma-2-generators",
        "to": "lemma:theta-slash-invariant",
        "type": "uses"
      },
      {
        "from": "lemma:jacobi-identity",
        "to": "prop:theta-der",
        "type": "uses"
      },
      {
        "from": "lemma:lv1-lv2-identities",
        "to": "lemma:FG-de",
        "type": "uses"
      },
      {
        "from": "lemma:der-q-series",
        "to": "lemma:log-der-inf",
        "type": "uses"
      },
      {
        "from": "lemma:log-der-inf",
        "to": "prop:Qdec",
        "type": "uses"
      },
      {
        "from": "thm:smooth-fast-decay-schwartz",
        "to": "prop:a-schwartz",
        "type": "uses"
      },
      {
        "from": "thm:smooth-fast-decay-schwartz",
        "to": "prop:b-schwartz",
        "type": "uses"
      },
      {
        "from": "prop:b-schwartz",
        "to": "prop:b-fourier",
        "type": "uses"
      },
      {
        "from": "E8-Matrix",
        "to": "E8-defs-equivalent",
        "type": "uses"
      },
      {
        "from": "E8-Matrix",
        "to": "E8-is-basis",
        "type": "uses"
      },
      {
        "from": "E8-defs-equivalent",
        "to": "E8-vector-norms",
        "type": "uses"
      },
      {
        "from": "E8-defs-equivalent",
        "to": "E8-Lattice",
        "type": "uses"
      },
      {
        "from": "def:derivative",
        "to": "def:serre-der",
        "type": "uses"
      },
      {
        "from": "def:derivative",
        "to": "lemma:der-q-series",
        "type": "uses"
      },
      {
        "from": "lemma:dedekind_eta_transformation",
        "to": "lemma:disc-cuspform",
        "type": "uses"
      },
      {
        "from": "lemma:disc-cuspform",
        "to": "lemma:phi0-transform",
        "type": "uses"
      },
      {
        "from": "lemma:disc-cuspform",
        "to": "lemma:lv1-lv2-identities",
        "type": "uses"
      },
      {
        "from": "lemma:psi-bound",
        "to": "cor:psiI-near-0-infty",
        "type": "uses"
      },
      {
        "from": "lemma:psi-bound",
        "to": "prop:b-schwartz",
        "type": "uses"
      },
      {
        "from": "cor:dim-mf",
        "to": "thm:ramanujan-formula",
        "type": "uses"
      },
      {
        "from": "cor:dim-mf",
        "to": "lemma:jacobi-identity",
        "type": "uses"
      },
      {
        "from": "cor:disc-nonvanishing",
        "to": "prop:b-double-zeros",
        "type": "uses"
      },
      {
        "from": "cor:disc-nonvanishing",
        "to": "prop:a-double-zeros",
        "type": "uses"
      },
      {
        "from": "lemma:lattice-points-bound",
        "to": "theorem:psp-density",
        "type": "uses"
      },
      {
        "from": "def:E2",
        "to": "def:phi4-phi2-phi0",
        "type": "uses"
      },
      {
        "from": "def:E2",
        "to": "def:FG-definition",
        "type": "uses"
      },
      {
        "from": "def:E2",
        "to": "def:serre-der",
        "type": "uses"
      },
      {
        "from": "def:E2",
        "to": "lemma:E2-transform-S",
        "type": "uses"
      },
      {
        "from": "lemma:E2-transform-S",
        "to": "lemma:phi0-transform",
        "type": "uses"
      },
      {
        "from": "lemma:E2-transform-S",
        "to": "lemma:Qlim",
        "type": "uses"
      },
      {
        "from": "lemma:E2-transform-S",
        "to": "lemma:E2-transform-general",
        "type": "uses"
      },
      {
        "from": "lem:bound-I1-I3-I5",
        "to": "prop:a-schwartz",
        "type": "uses"
      },
      {
        "from": "lemma:bound-J2-J4-J6",
        "to": "prop:b-schwartz",
        "type": "uses"
      },
      {
        "from": "lem:bound-I2-I4-I6",
        "to": "prop:a-schwartz",
        "type": "uses"
      },
      {
        "from": "def:dedekind_eta",
        "to": "lemma:dedekind_eta_transformation",
        "type": "uses"
      },
      {
        "from": "def:dedekind_eta",
        "to": "def:disc-definition",
        "type": "uses"
      },
      {
        "from": "def:disc-definition",
        "to": "cor:disc-pos",
        "type": "uses"
      },
      {
        "from": "def:disc-definition",
        "to": "lemma:disc-cuspform",
        "type": "uses"
      },
      {
        "from": "def:disc-definition",
        "to": "cor:disc-nonvanishing",
        "type": "uses"
      },
      {
        "from": "def:disc-definition",
        "to": "lemma:disc-E4E6",
        "type": "uses"
      },
      {
        "from": "def:disc-definition",
        "to": "lemma:mod-div-disc-bound",
        "type": "uses"
      },
      {
        "from": "lemma:disc-E4E6",
        "to": "thm:lvl1_dims",
        "type": "uses"
      },
      {
        "from": "lemma:mod-div-disc-bound",
        "to": "cor:phi4-bound",
        "type": "uses"
      },
      {
        "from": "lemma:mod-div-disc-bound",
        "to": "cor:phi0-bound",
        "type": "uses"
      },
      {
        "from": "lemma:mod-div-disc-bound",
        "to": "cor:phi2-bound",
        "type": "uses"
      },
      {
        "from": "lemma:periodic-points-bounds",
        "to": "theorem:psp-density",
        "type": "uses"
      },
      {
        "from": "lemma:slash-operator-chain-rule",
        "to": "lemma:theta-slash-invariant",
        "type": "uses"
      },
      {
        "from": "lemma:bound-J1-J3-J5",
        "to": "prop:b-schwartz",
        "type": "uses"
      },
      {
        "from": "def:automorphy-factor",
        "to": "def:slash-operator",
        "type": "uses"
      },
      {
        "from": "def:automorphy-factor",
        "to": "lemma:automorphy-factor-chain-rule",
        "type": "uses"
      },
      {
        "from": "lemma:automorphy-factor-chain-rule",
        "to": "lemma:slash-operator-chain-rule",
        "type": "uses"
      },
      {
        "from": "lemma:psi-new",
        "to": "lemma:F-G-phi-psi-identities",
        "type": "uses"
      },
      {
        "from": "lemma:psi-new",
        "to": "lemma:psiI-psiT-psiS-fourier",
        "type": "uses"
      },
      {
        "from": "def:dual-lattice",
        "to": "thm:Poisson-summation-formula",
        "type": "uses"
      },
      {
        "from": "lem:integral-bound",
        "to": "prop:a-schwartz",
        "type": "uses"
      },
      {
        "from": "E8-Set",
        "to": "E8-defs-equivalent",
        "type": "uses"
      },
      {
        "from": "def:level-N-princ-cong-subgp",
        "to": "def:congruence-subgroup",
        "type": "uses"
      },
      {
        "from": "def:level-N-princ-cong-subgp",
        "to": "def:Gamma-generators",
        "type": "uses"
      }
    ]
  };
  if (typeof g.PaperDiagramData === "object" && g.PaperDiagramData) g.PaperDiagramData["sphere-packing-lean"] = D;
  else g.PaperDiagramData = { "sphere-packing-lean": D };
  if (typeof module !== "undefined" && module.exports) module.exports = D;
})(typeof window !== "undefined" ? window : globalThis);
