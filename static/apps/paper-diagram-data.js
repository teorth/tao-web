// Library index for the paper-diagram viewer.
//   _library — the curated dropdown (loaded first is the default paper).
//   _catalog — the full "more…" picker.
// Every diagram itself is a self-contained, lazy-loaded diagrams/<id>.js file;
// this file carries no diagram data, only the two lists.
;(function (g) {
  var DIAGRAMS = {
    "_library": [
      { "id": "kakeya", "title": "Kakeya set conjecture in R³ (Wang–Zahl)" },
      { "id": "wiles-flt", "title": "Fermat's Last Theorem (Wiles)" },
      { "id": "perelman-ricci", "title": "Ricci flow & geometrization (Perelman)" },
      { "id": "2405.20552", "title": "Large values of Dirichlet polynomials (Guth–Maynard)" },
      { "id": "szemeredi", "title": "Szemerédi's theorem on arithmetic progressions (Szemerédi 1975)" },
      { "id": "sphere-packing-lean", "title": "Sphere packing in dimension 8 — Lean formalization (blueprint)" }
    ],
    "_catalog": [
      { "id": "kakeya", "title": "Kakeya set conjecture in R³", "authors": ["Wang", "Zahl"], "year": 2025, "arxiv": "2502.17655" },
      { "id": "wiles-flt", "title": "Modular elliptic curves and Fermat's Last Theorem", "authors": ["Wiles"], "year": 1995 },
      { "id": "perelman-ricci", "title": "The entropy formula for the Ricci flow and its geometric applications", "authors": ["Perelman"], "year": 2002, "arxiv": "math/0211159" },
      { "id": "2405.20552", "title": "New large value estimates for Dirichlet polynomials", "authors": ["Guth", "Maynard"], "year": 2024, "arxiv": "2405.20552" },
      { "id": "2605.00301", "title": "Primitive sets and von Mangoldt chains (Erdős #1196 and beyond)", "authors": ["Alexeev", "Barreto", "Li", "Lichtman", "Price", "Shah", "Tang", "Tao"], "year": 2026, "arxiv": "2605.00301" },
      { "id": "2211.15847", "title": "A counterexample to the periodic tiling conjecture", "authors": ["Greenfeld", "Tao"], "year": 2022, "arxiv": "2211.15847" },
      { "id": "gilbreath", "title": "Gilbreath's conjecture", "authors": ["Chase", "Hunter", "Tao"], "year": 2025 },
      { "id": "szemeredi", "title": "On sets of integers containing no k elements in arithmetic progression", "authors": ["Szemerédi"], "year": 1975 },
      { "id": "sphere-packing-lean", "title": "Sphere packing in dimension 8 — a Lean formalization (after Viazovska)", "authors": ["Sphere-Packing-Lean project"], "year": 2025 },
      { "id": "pfr-lean", "title": "Polynomial Freiman–Ruzsa conjecture — a Lean formalization", "authors": ["PFR formalization project"], "year": 2023 }
    ]
  };
  if (typeof window !== "undefined") window.PaperDiagramData = DIAGRAMS;
  if (typeof module !== "undefined" && module.exports) module.exports = DIAGRAMS;
})(typeof window !== "undefined" ? window : globalThis);
