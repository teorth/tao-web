// Library diagram for the paper-diagram viewer — lazy-loaded on demand.
// Sphere packing in dimension 8 — the Sphere-Packing-Lean formalization (after
// Viazovska, Ann. of Math. 2017). AUTO-CONVERTED from the project blueprint by
// leanblueprint_to_paperdiagram.py (deterministic): structure+status from the dep
// graph, statement text/section from the source. Fill colour = formalization status.
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
        "note": "Auto-converted (deterministically, no LLM) from the Sphere-Packing-Lean blueprint (github.com/thefundamentaltheor3m/Sphere-Packing-Lean) — a formalization of Viazovska’s theorem that E₈ is the optimal sphere packing in ℝ⁸. Structure, the dependency edges and each statement’s text/section come from the blueprint; the FILL colour is Lean formalization status (softened for legibility): green = fully formalized, lighter green = in progress, blue = not yet ready, white = not started."
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
        "color": "#e0f3d7",
        "statement": "A $C^\\infty$~function $f:\\R^d\\to\\C$ is called a \\emph{Schwartz function} if it decays to zero as $\\|x\\|\\to\\infty$ faster then any inverse power of $\\|x\\|$, and the same holds for all partial derivatives of $f$, ie, if for all $k, n \\in \\N$, there exists a constant $C \\in \\R$ such that for all $x \\in \\R^d$, $\\norm{x}^k \\cdot \\norm{f^{(n)}(x)} \\leq C$, where $f^{(n)}$ denotes the $n$-th derivative of $f$ considered along with the appropriate operator norm. The set of all Schwartz functions from $\\R^d$ to $\\C$ is called the \\emph{Schwartz space}. It is an $\\R$-vector space.",
        "section": "On Schwartz Functions",
        "lean": "SchwartzMap"
      },
      {
        "id": "lemma:Schwartz-summable",
        "kind": "lemma",
        "label": "Schwartz-summable",
        "name": "Schwartz summable",
        "color": "#d3e3fb",
        "statement": "Let $f : \\R^d \\to \\C$ be a Schwartz function and let $X \\subset \\R^d$ be periodic with respect to some lattice $\\Lambda \\subset \\R^d$. Then, \\[ \\sum_{x \\in X} |f(x)| < \\infty. \\]",
        "section": "On the Summability of Schwartz Functions"
      },
      {
        "id": "lemma:Fourier-transform-is-automorphism",
        "kind": "lemma",
        "label": "Fourier-transform-is-automorphism",
        "name": "Fourier transform is automorphism",
        "color": "#a9dcb8",
        "statement": "The Fourier transform is a continuous, linear automorphism of the space of Schwartz functions.",
        "section": "On Schwartz Functions",
        "lean": "SchwartzMap.fourierTransformCLM"
      },
      {
        "id": "thm:Poisson-summation-formula",
        "kind": "theorem",
        "label": "Poisson-summation-formula",
        "name": "Poisson summation formula",
        "statement": "Let $\\Lambda$ be a lattice in $\\R^d$, and let $f:\\R^d\\to\\R$ be a Schwartz function. Then, for all $v \\in \\R^d$, \\[ \\sum_{\\ell\\in\\Lambda}f(\\ell + v) = \\frac{1}{\\Vol{\\R^d/\\Lambda}} \\sum_{m\\in\\Lambda^*}\\widehat{f}(m) e^{-2\\pi i \\ang{v, m}}. \\]",
        "section": "On the Summability of Schwartz Functions",
        "lean": "SchwartzMap.PoissonSummation_Lattices"
      },
      {
        "id": "thm:Cohn-Elkies-periodic",
        "kind": "theorem",
        "label": "Cohn-Elkies-periodic",
        "name": "Cohn–Elkies",
        "color": "#c9ecca",
        "statement": "Let $X\\subset\\mathbb{R}^d$ be a discrete subset such that $\\|x-y\\|\\geq 1$ for any distinct $x,y\\in X$. Suppose that $X$ is $\\Lambda$-periodic with respect to some lattice $\\Lambda\\subset\\mathbb{R}^d$. Let $f:\\R^d\\to\\R$ be a Schwartz function that is not identically zero and satisfies the following conditions: \\begin{equation}f(x)\\leq 0\\mbox{ for } \\|x\\|\\geq 1\\end{equation} and \\begin{equation}\\widehat{f}(x)\\geq0\\mbox{ for all } x\\in\\R^d.\\end{equation} Then the density of any $\\Lambda$-periodic sphere packing is bounded above by $$\\frac{f(0)}{\\widehat{f}(0)}\\cdot \\mathrm{vol}(B_d(0,1/2)).$$",
        "lean": "LinearProgrammingBound'"
      },
      {
        "id": "thm:Cohn-Elkies-general",
        "kind": "theorem",
        "label": "Cohn-Elkies-general",
        "name": "Cohn–Elkies",
        "color": "#c9ecca",
        "statement": "Let $f:\\R^d\\to\\R$ be a Schwartz function that is not identically zero and satisfies \\eqref{eqn:Cohn-Elkies-condition-1} and \\eqref{eqn:Cohn-Elkies-condition-2}. Then the density of any $\\Lambda$-periodic sphere packing is bounded above by $$\\frac{f(0)}{\\widehat{f}(0)}\\cdot \\mathrm{vol}(B_d(0,1/2)).$$",
        "lean": "LinearProgrammingBound"
      },
      {
        "id": "def:Ek",
        "kind": "definition",
        "label": "Ek",
        "name": "Ek",
        "color": "#d3e3fb",
        "statement": "For an even integer $k\\geq 4$ we define the \\emph{weight $k$ Eisenstein series} as \\begin{equation} E_k(z):=\\frac{1}{2}\\sum_{(c,d)\\in\\Z^2, (c,d)=1}(cz+d)^{-k}.\\end{equation}",
        "section": "Modular forms and examples",
        "lean": "ModularForm.eisensteinSeries_MF"
      },
      {
        "id": "lemma:Ek-Fourier",
        "kind": "lemma",
        "label": "Ek-Fourier",
        "name": "Ek Fourier",
        "color": "#a9dcb8",
        "statement": "The Eisenstein series possesses the Fourier expansion \\begin{equation}E_k(z)=1+\\frac{2}{\\zeta(1-k)}\\sum_{n=1}^\\infty \\sigma_{k-1}(n)\\,e^{2\\pi i z}, \\end{equation} where $\\sigma_{k-1}(n)\\,=\\,\\sum_{d|n} d^{k-1}$. In particular, we have \\begin{align} E_4(z)\\,=\\,& 1+240\\sum_{n=1}^\\infty \\sigma_3(n)\\,e^{2\\pi i n z} \\notag \\\\ E_6(z)\\,=\\,& 1-504\\sum_{n=1}^\\infty \\sigma_5(n)\\,e^{2\\pi i n z}. \\notag \\end{align}",
        "section": "Modular forms and examples",
        "lean": "E_k_q_expansion"
      },
      {
        "id": "def:phi4-phi2-phi0",
        "kind": "definition",
        "label": "phi4-phi2-phi0",
        "name": "phi4 phi2 phi0",
        "statement": "\\begin{align} \\phi_{-4} &:= \\frac{E_4^2}{\\Delta} \\\\ \\phi_{-2} &:= \\frac{E_4(E_2 E_4 - E_6)}{\\Delta} \\\\ \\phi_{0} &:= \\frac{(E_2 E_4 - E_6)^2}{\\Delta} \\end{align}"
      },
      {
        "id": "def:FG-definition",
        "kind": "definition",
        "label": "FG-definition",
        "name": "FG definition",
        "color": "#e0f3d7",
        "statement": "Define two (quasi) modular forms as \\begin{align} F(z) &= (E_2(z) E_4(z) - E_6(z))^2 \\\\ G(z) &= H_2(z)^{3} (2 H_{2}(z)^{2} + 5 H_{2}(z) H_{4}(z) + 5 H_{4}(z)^{2}). \\end{align}",
        "section": "Proof of Theorem",
        "lean": "F, G"
      },
      {
        "id": "lemma:Ek-is-modular-form",
        "kind": "lemma",
        "label": "Ek-is-modular-form",
        "name": "Ek is modular form",
        "color": "#a9dcb8",
        "statement": "For all $k$, $E_k\\in M_k(\\Gamma_1)$. Especially, we have \\begin{equation} E_k \\left(-\\frac{1}{z}\\right) = z^k E_k(z). \\end{equation}",
        "section": "Modular forms and examples",
        "lean": "EisensteinSeries.eisensteinSeries_SIF"
      },
      {
        "id": "cor:phi4-bound",
        "kind": "corollary",
        "label": "phi4-bound",
        "name": "phi4 bound",
        "statement": "There exists a constant $C_{-4} > 0$ such that \\begin{equation} |\\phi_{-4}(z)| \\le C_{-4} e^{2 \\pi \\Im z} \\end{equation} for all $z$ with $\\Im z > 1/2$."
      },
      {
        "id": "cor:phi0-bound",
        "kind": "corollary",
        "label": "phi0-bound",
        "name": "phi0 bound",
        "color": "#d3e3fb",
        "statement": "There exists a constant $C_0 > 0$ such that \\begin{equation} |\\phi_0(z)| \\le C_0 e^{-2 \\pi \\Im z} \\end{equation} for all $z$ with $\\Im z > 1/2$."
      },
      {
        "id": "cor:phi2-bound",
        "kind": "corollary",
        "label": "phi2-bound",
        "name": "phi2 bound",
        "statement": "There exists a constant $C_{-2} > 0$ such that \\begin{equation} |\\phi_{-2}(z)| \\le C_{-2} \\end{equation} for all $z$ with $\\Im z > 1/2$."
      },
      {
        "id": "def:a-definition",
        "kind": "definition",
        "label": "a-definition",
        "name": "a definition",
        "color": "#e0f3d7",
        "statement": "Define $a_{\\rad} : \\R \\to \\C$ by \\begin{align} a_\\rad(r) := I_1(r) + I_2(r) + I_3(r) + I_4(r) + I_5(r) + I_6(r) \\end{align} where \\begin{align} I_1(r) &:= \\int_{-1}^{-1 + i} \\phi_0 \\left(\\frac{-1}{z+1}\\right) (z + 1)^2 e^{\\pi i r z} \\dd z \\\\ I_2(r) &:= \\int_{-1 + i}^{i} \\phi_0 \\left(\\frac{-1}{z+1}\\right) (z + 1)^2 e^{\\pi i r z} \\dd z \\\\ I_3(r) &:= \\int_{1}^{1 + i} \\phi_0 \\left(\\frac{-1}{z-1}\\right) (z - 1)^2 e^{\\pi i r z} \\dd z \\\\ I_4(r) &:= \\int_{1 + i}^{i} \\phi_0 \\left(\\frac{-1}{z-1}\\right) (z - 1)^2 e^{\\pi i r z} \\dd z \\\\ I_5(r) &:= -2 \\int_{0}^{i} \\phi_0 \\left(\\frac{-1}{z}\\right) z^2 e^{\\pi i r z} \\dd z \\\\ I_6(r) &:= 2 \\int_{i}^{i\\infty} \\phi_0(z) e^{\\pi i r z} \\dd z \\end{align} Here all the contours are chosen to be straight line segments. Now, define $a(x) := a_{\\rad}(\\|x\\|^2)$ for $x \\in \\R^8$.",
        "lean": "MagicFunction.a.RealIntegrals.a', MagicFunction.a.RadialFunctions.a"
      },
      {
        "id": "lemma:phi0-transform",
        "kind": "lemma",
        "label": "phi0-transform",
        "name": "phi0 transform",
        "statement": "We have \\begin{align} \\phi_0(z + 1) &= \\phi_0(z) \\\\ \\phi_0\\left(-\\frac{1}{z}\\right) &= \\phi_0(z)-\\frac{12i}{\\pi}\\,\\frac{1}{z}\\,\\phi_{-2}(z)-\\frac{36}{\\pi^2}\\,\\frac{1}{z^2}\\,\\phi_{-4}(z). \\end{align}"
      },
      {
        "id": "lemma:F-G-phi-psi-identities",
        "kind": "lemma",
        "label": "F-G-phi-psi-identities",
        "name": "F G phi psi identities",
        "statement": "We have \\begin{align} \\phi_0 &= \\frac{F}{\\Delta} \\\\ \\psi_S &= -\\frac{1}{2} \\frac{G}{\\Delta} \\end{align}",
        "section": "Proof of Theorem"
      },
      {
        "id": "lemma:Qlim",
        "kind": "lemma",
        "label": "Qlim",
        "name": "Qlim",
        "statement": "We have \\begin{equation} \\lim_{t \\to 0^+} Q(t) = \\frac{18}{\\pi^2}. \\end{equation}",
        "section": "Proof of Theorem",
        "lean": "FmodG_rightLimitAt_zero"
      },
      {
        "id": "cor:phi0-near-0-infty",
        "kind": "corollary",
        "label": "phi0-near-0-infty",
        "name": "phi0 near 0 infty",
        "statement": "We have \\begin{align} \\phi_0\\left(\\frac{i}{t}\\right) &= O(e^{-2 \\pi / t}) \\quad \\text{as } t \\to 0 \\\\ \\phi_0\\left(\\frac{i}{t}\\right) &= O(t^{-2}e^{2 \\pi t}) \\quad \\text{as } t \\to \\infty. \\\\ \\end{align}"
      },
      {
        "id": "prop:a-schwartz",
        "kind": "proposition",
        "label": "a-schwartz",
        "name": "a schwartz",
        "statement": "$a(x)$ is a Schwartz function.",
        "lean": "MagicFunction.FourierEigenfunctions.a"
      },
      {
        "id": "prop:a-double-zeros",
        "kind": "proposition",
        "label": "a-double-zeros",
        "name": "a double zeros",
        "statement": "For $r>\\sqrt{2}$ we can express $a(r)$ in the following form \\begin{equation} a(r)=-4\\sin(\\pi r^2/2)^2\\,\\int\\limits_{0}^{i\\infty}\\phi_0\\Big(\\frac{-1}{z}\\Big)\\,z^2\\,e^{\\pi i r^2 \\,z}\\,dz. \\end{equation}"
      },
      {
        "id": "lemma:ineqABnew-equiv",
        "kind": "lemma",
        "label": "ineqABnew-equiv",
        "name": "ineqABnew equiv",
        "statement": "Inequality \\eqref{eqn:ineqA} and \\eqref{eqn:ineqB} are equivalent to \\begin{align} F(it) + \\frac{18}{\\pi^2} G(it) > 0 \\\\ F(it) - \\frac{18}{\\pi^2} G(it) > 0 \\end{align} respectively.",
        "section": "Proof of Theorem"
      },
      {
        "id": "cor:ineqBnew",
        "kind": "corollary",
        "label": "ineqBnew",
        "name": "ineqBnew",
        "color": "#d3e3fb",
        "statement": "\\eqref{eqn:ineqBnew} holds.",
        "section": "Proof of Theorem",
        "lean": "FG_inequality_2"
      },
      {
        "id": "def:psiI-psiT-psiS",
        "kind": "definition",
        "label": "psiI-psiT-psiS",
        "name": "psiI psiT psiS",
        "statement": "We define the following three functions \\begin{align} \\psi_I\\,:=\\,&h-h|_{-2}ST \\\\ \\psi_T\\,:=\\,&\\psi_I|_{-2}T \\\\ \\psi_S\\,:=\\,&\\psi_I|_{-2}S. \\end{align}"
      },
      {
        "id": "cor:psiI-near-0-infty",
        "kind": "corollary",
        "label": "psiI-near-0-infty",
        "name": "psiI near 0 infty",
        "statement": "We have \\begin{align} \\psi_I(it) &= O(t^2 e^{\\pi/t}) \\quad \\text{as } t \\to 0 \\\\ \\psi_I(it) &= O(e^{2 \\pi t}) \\quad \\text{as } t \\to \\infty. \\end{align}"
      },
      {
        "id": "def:b-definition",
        "kind": "definition",
        "label": "b-definition",
        "name": "b definition",
        "statement": "Define $b_\\rad : \\R \\to \\C$ by \\begin{equation} b_\\rad(r) := J_1(r) + J_2(r) + J_3(r) + J_4(r) + J_5(r) + J_6(r) \\end{equation} where for $r \\in \\R$, \\begin{align} J_1(r) &:= \\int_{-1}^{-1 + i} \\psi_T(z) e^{\\pi i r z} \\, \\dd z, \\\\ J_2(r) &:= \\int_{-1 + i}^{i} \\psi_T(z) e^{\\pi i r z} \\, \\dd z, \\\\ J_3(r) &:= \\int_{1}^{1 + i} \\psi_T(z) e^{\\pi i r z} \\, \\dd z, \\\\ J_4(r) &:= \\int_{1 + i}^{i} \\psi_T(z) e^{\\pi i r z} \\, \\dd z, \\\\ J_5(r) &:= -2 \\int_{0}^{i} \\psi_I(z) e^{\\pi i r z} \\, \\dd z, \\\\ J_6(r) &:= -2 \\int_{i}^{i \\infty} \\psi_S(z) e^{\\pi i r z} \\, \\dd z. \\end{align} Here all the contours are straight line segments. Then we define $b : \\R^8 \\to \\C$ by $b(x) := b_\\rad(\\|x\\|^2)$."
      },
      {
        "id": "prop:b-double-zeros",
        "kind": "proposition",
        "label": "b-double-zeros",
        "name": "b double zeros",
        "statement": "For $r>\\sqrt{2}$ function $b(r)$ can be expressed as \\begin{equation} b(r)=-4\\sin(\\pi r^2/2)^2\\,\\int\\limits_{0}^{i\\infty}\\psi_I(z)\\,e^{\\pi i r^2 \\,z}\\,dz. \\end{equation}"
      },
      {
        "id": "prop:b-fourier",
        "kind": "proposition",
        "label": "b-fourier",
        "name": "b fourier",
        "statement": "$b(x)$ satisfies \\eqref{eqn:b-fourier}.",
        "lean": "MagicFunction.b.Fourier.eig_b"
      },
      {
        "id": "prop:b-another-integral",
        "kind": "proposition",
        "label": "b-another-integral",
        "name": "b another integral",
        "statement": "For $r\\geq0$ we have \\begin{equation}b(r)=4i\\,\\sin(\\pi r^2/2)^2\\,\\left(\\frac{144}{\\pi\\,r^2}+\\frac{1}{\\pi\\,(r^2-2)}+\\int\\limits_0^\\infty\\,\\left(\\psi_I(it)-144-e^{2\\pi t}\\right)\\,e^{-\\pi r^2 t}\\,dt\\right).\\end{equation} The integral converges absolutely for all $r\\in\\R_{\\geq 0}$."
      },
      {
        "id": "prop:ineqB",
        "kind": "proposition",
        "label": "ineqB",
        "name": "ineqB",
        "statement": "Consider the function $B:(0,\\infty)\\to\\C$ defined as \\begin{equation} B(t) := -t^2\\phi_0(i/t)+\\frac{36}{\\pi^2}\\,\\psi_I(it) \\end{equation} Then \\begin{equation} B(t) > 0 \\end{equation} for all $t > 0$.",
        "section": "Proof of Theorem"
      },
      {
        "id": "prop:ineqA",
        "kind": "proposition",
        "label": "ineqA",
        "name": "ineqA",
        "statement": "Consider the function $A:(0,\\infty)\\to\\C$ defined as \\begin{equation} A(t):=-t^2\\phi_0(i/t)-\\frac{36}{\\pi^2}\\,\\psi_I(it). \\end{equation} Then \\begin{equation} A(t) < 0 \\end{equation} for all $t > 0$.",
        "section": "Proof of Theorem"
      },
      {
        "id": "thm:g1",
        "kind": "theorem",
        "label": "g1",
        "name": "g1",
        "statement": "The function $$g(x):=\\frac{\\pi\\,i}{8640}a(x)+\\frac{i}{240\\pi}\\,b(x)$$ satisfies conditions \\eqref{eqn:g1}--\\eqref{eqn:g3}.",
        "section": "Proof of Theorem"
      },
      {
        "id": "prop:b0",
        "kind": "proposition",
        "label": "b0",
        "name": "b0",
        "statement": "We have $b(0) = 0$.",
        "lean": "MagicFunction.b.SpecialValues.b_zero"
      },
      {
        "id": "thm:g",
        "kind": "theorem",
        "label": "g",
        "name": "g",
        "statement": "There exists a radial Schwartz function $g:\\R^8\\to\\R$ which satisfies: \\begin{align} g(x)&\\leq 0\\mbox{ for } \\|x\\|\\geq \\sqrt{2} \\\\ \\widehat{g}(x)&\\geq0\\mbox{ for all } x\\in\\R^8\\\\ g(0)&=\\widehat{g}(0)=1. \\end{align}"
      },
      {
        "id": "lemma:Gaussian-Fourier",
        "kind": "lemma",
        "label": "Gaussian-Fourier",
        "name": "Gaussian Fourier",
        "color": "#d3e3fb",
        "statement": "\\begin{equation} \\mathcal{F}(e^{\\pi i \\|x\\|^2 z})(y) = z^{-4}\\,e^{\\pi i \\|y\\|^2 \\,(\\frac{-1}{z}) }. \\end{equation}"
      },
      {
        "id": "prop:a-fourier",
        "kind": "proposition",
        "label": "a-fourier",
        "name": "a fourier",
        "statement": "$a(x)$ satisfies \\eqref{eqn:a-fourier}.",
        "lean": "MagicFunction.a.Fourier.eig_a"
      },
      {
        "id": "prop:Qdec",
        "kind": "proposition",
        "label": "Qdec",
        "name": "Qdec",
        "statement": "The function $t \\mapsto Q(t)$ is strictly decreasing.",
        "section": "Proof of Theorem",
        "lean": "FmodG_strictAntiOn"
      },
      {
        "id": "corollary:upper-bound-E8",
        "kind": "corollary",
        "label": "upper-bound-E8",
        "name": "upper bound E8",
        "statement": "All packing $\\mathcal{P} \\subseteq \\R^8$ has density satisfying $\\Delta_{\\mathcal{P}} \\leq \\Delta_{E_8}$.",
        "section": "Main Result"
      },
      {
        "id": "def:Periodic-sphere-packing-constant",
        "kind": "definition",
        "label": "Periodic-sphere-packing-constant",
        "name": "Periodic sphere packing constant",
        "color": "#e0f3d7",
        "statement": "The periodic sphere packing constant is defined to be $$ \\Delta_{d}^{\\text{periodic}} := \\sup_{\\substack{P \\subset \\R^d \\\\ \\text{periodic packing}}} \\Delta_P$$",
        "section": "Lattices and Periodic packings",
        "lean": "PeriodicSpherePackingConstant"
      },
      {
        "id": "thm:periodic-packing-optimal",
        "kind": "theorem",
        "label": "periodic-packing-optimal",
        "name": "periodic packing optimal",
        "color": "#d3e3fb",
        "statement": "For all $d$, the periodic sphere packing constant in $\\R^d$ is equal to the sphere packing constant in $\\R^d$.",
        "section": "Lattices and Periodic packings",
        "lean": "periodic_constant_eq_constant"
      },
      {
        "id": "theorem:CE_Main",
        "kind": "theorem",
        "label": "CE_Main",
        "name": "CE Main",
        "statement": "All \\emph{periodic} packing $\\mathcal{P} \\subseteq \\R^8$ has density satisfying $\\Delta_{\\mathcal{P}} \\leq \\Delta_{E_8} = \\frac{\\pi^4}{384}$, the density of the $E_8$ sphere packing (see \\cref{E8Packing}).",
        "section": "Main Result"
      },
      {
        "id": "def:serre-der",
        "kind": "definition",
        "label": "serre-der",
        "name": "serre der",
        "color": "#e0f3d7",
        "statement": "For $k \\in \\mathbb{R}$, define the weight $k$ Serre derivative $\\partial_{k}$ of a modular form $F$ as \\begin{equation} \\partial_{k}F := F' - \\frac{k}{12} E_2 F. \\end{equation}",
        "section": "Quasimodular forms and derivatives",
        "lean": "serre_D"
      },
      {
        "id": "thm:serre-der-prod-rule",
        "kind": "theorem",
        "label": "serre-der-prod-rule",
        "name": "serre der prod rule",
        "color": "#a9dcb8",
        "statement": "The Serre derivative satisfies the following product rule: for any quasimodular forms $F$ and $G$, \\begin{equation} \\partial_{w_1 + w_2} (FG) = (\\partial_{w_1}F)G + F (\\partial_{w_2}G). \\end{equation}",
        "section": "Quasimodular forms and derivatives",
        "lean": "serre_D_mul"
      },
      {
        "id": "thm:serre-der-equiv-action",
        "kind": "theorem",
        "label": "serre-der-equiv-action",
        "name": "serre der equiv action",
        "color": "#d3e3fb",
        "statement": "Serre derivative $\\partial_{k}$ is equivariant with the slash action of $\\mathrm{SL}_{2}(\\mathbb{Z})$ in the following sense: \\begin{equation} \\partial_{k} (F|_{k}\\gamma) = (\\partial_{k} F)|_{k+2}\\gamma, \\quad \\forall \\gamma \\in \\mathrm{SL}_{2}(\\mathbb{Z}). \\end{equation}",
        "section": "Quasimodular forms and derivatives",
        "lean": "serre_D_slash_equivariant"
      },
      {
        "id": "prop:theta-der",
        "kind": "proposition",
        "label": "theta-der",
        "name": "theta der",
        "color": "#d3e3fb",
        "statement": "We have \\begin{align} H_2' &= \\frac{1}{6} (H_{2}^{2} + 2 H_{2} H_{4} + E_2 H_2) \\\\ H_3' &= \\frac{1}{6} (H_{2}^{2} - H_{4}^{2} + E_2 H_3) \\\\ H_4' &= -\\frac{1}{6} (2H_{2} H_{4} + H_{4}^{2} - E_2 H_4) \\end{align} or equivalently, \\begin{align} \\partial_{2} H_{2} &= \\frac{1}{6} (H_{2}^{2} + 2 H_{2} H_{4}) \\\\ \\partial_{2} H_{3} &= \\frac{1}{6} (H_{2}^{2} - H_{4}^{2}) \\\\ \\partial_{2} H_{4} &= -\\frac{1}{6} (2H_{2} H_{4} + H_{4}^{2}) \\end{align}",
        "section": "Quasimodular forms and derivatives"
      },
      {
        "id": "lemma:FG-de",
        "kind": "lemma",
        "label": "FG-de",
        "name": "FG de",
        "statement": "$F$ and $G$ satisfy the following differential equations: \\begin{align} \\partial_{12}\\partial_{10} F - \\frac{5}{6} E_{4} F &= 7200 \\Delta (-E_{2}') \\\\ \\partial_{12}\\partial_{10} G - \\frac{5}{6} E_{4} G &= -640 \\Delta H_{2} \\end{align}",
        "section": "Proof of Theorem",
        "lean": "MLDE_F, MLDE_G"
      },
      {
        "id": "thm:serre-der-modularity",
        "kind": "theorem",
        "label": "serre-der-modularity",
        "name": "serre der modularity",
        "color": "#c9ecca",
        "statement": "Let $F$ be a modular form of weight $k$ and level $\\Gamma$. Then, $\\partial_{k}F$ is a modular form of weight $k + 2$ of the same level.",
        "section": "Quasimodular forms and derivatives",
        "lean": "serre_D_slash_invariant"
      },
      {
        "id": "cor:MLDE-pos",
        "kind": "corollary",
        "label": "MLDE-pos",
        "name": "MLDE pos",
        "statement": "\\eqref{eqn:ddf} (resp. \\eqref{eqn:ddg}) is positive (resp. negative) on the (positive) imaginary axis.",
        "section": "Proof of Theorem"
      },
      {
        "id": "thm:ramanujan-formula",
        "kind": "theorem",
        "label": "ramanujan-formula",
        "name": "ramanujan formula",
        "color": "#d3e3fb",
        "statement": "We have \\begin{align} E_2' &= \\frac{E_2^2 - E_4}{12} \\\\ E_4' &= \\frac{E_2 E_4 - E_6}{3} \\\\ E_6' &= \\frac{E_2 E_6 - E_4^2}{2} \\end{align}",
        "section": "Quasimodular forms and derivatives",
        "lean": "ramanujan_E₂, ramanujan_E₄, ramanujan_E₆, ramanujan_E₂', ramanujan_E₄', ramanujan_E₆'"
      },
      {
        "id": "lemma:F-G-pos",
        "kind": "lemma",
        "label": "F-G-pos",
        "name": "F G pos",
        "color": "#c9ecca",
        "statement": "For all $t > 0$, we have $F(it) > 0$ and $G(it) > 0$.",
        "section": "Proof of Theorem",
        "lean": "F_imag_axis_pos, G_imag_axis_pos"
      },
      {
        "id": "cor:logder-disc-E2",
        "kind": "corollary",
        "label": "logder-disc-E2",
        "name": "logder disc E2",
        "color": "#d3e3fb",
        "statement": "\\begin{equation} \\Delta' = E_2 \\Delta. \\end{equation}",
        "section": "Quasimodular forms and derivatives"
      },
      {
        "id": "cor:ineqAnew",
        "kind": "corollary",
        "label": "ineqAnew",
        "name": "ineqAnew",
        "color": "#d3e3fb",
        "statement": "\\eqref{eqn:ineqAnew} holds.",
        "section": "Proof of Theorem",
        "lean": "FG_inequality_1"
      },
      {
        "id": "thm:anti-serre-der-pos",
        "kind": "theorem",
        "label": "anti-serre-der-pos",
        "name": "anti serre der pos",
        "statement": "Let $F$ be a holomorphic quasimodular cusp form with real Fourier coefficients. Assume that there exists $k$ such that $(\\partial_{k}F)(it) > 0$ for all $t > 0$. If the first Fourier coefficient of $F$ is positive, then $F(it) > 0$ for all $t > 0$.",
        "section": "Quasimodular forms and derivatives"
      },
      {
        "id": "SpherePacking.scale_finiteDensity",
        "kind": "remark",
        "label": "SpherePacking.scale_finiteDensity",
        "name": "SpherePacking.scale finiteDensity",
        "color": "#c9ecca",
        "statement": "Let $\\Pa(X)$ be a sphere packing and $c$ a positive real number. Then, for all $R > 0$, \\[ \\Delta_{\\Pa(cX)}(cR) = \\Delta_{\\Pa(X)}(R). \\]",
        "section": "Scaling Sphere Packings",
        "lean": "SpherePacking.scale_finiteDensity"
      },
      {
        "id": "SpherePacking.scale_density",
        "kind": "remark",
        "label": "SpherePacking.scale_density",
        "name": "SpherePacking.scale density",
        "color": "#c9ecca",
        "statement": "Let $\\Pa(X)$ be a sphere packing and $c$ a positive real number. Then, the density of the scaled packing $\\Pa(cX)$ is equal to the density of the original packing $\\Pa(X)$.",
        "section": "Scaling Sphere Packings",
        "lean": "SpherePacking.scale_density"
      },
      {
        "id": "SpherePacking.constant_eq_constant_normalized",
        "kind": "remark",
        "label": "SpherePacking.constant_eq_constant_normalized",
        "name": "SpherePacking.constant eq constant normalized",
        "color": "#c9ecca",
        "statement": "\\[ \\Delta_d = \\sup\\limits_{\\substack{\\Pa \\subset \\R^d \\\\ \\text{sphere packing} \\\\ \\text{sep.~rad.} = 1}} \\Delta_{\\Pa} \\]",
        "section": "Scaling Sphere Packings",
        "lean": "SpherePacking.constant_eq_constant_normalized"
      },
      {
        "id": "lemma:E2-transform-general",
        "kind": "lemma",
        "label": "E2-transform-general",
        "name": "E2 transform general",
        "color": "#a9dcb8",
        "statement": "\\begin{equation} (cz + d)^{-2} E_2\\left(\\frac{az + b}{cx + d}\\right) = E_2(z) - \\frac{6ic}{\\pi (cz + d)}, \\quad \\begin{pmatrix} a & b \\\\ c & d\\end{pmatrix} \\in \\mathrm{SL}_{2}(\\mathbb{Z}). \\end{equation}",
        "section": "Modular forms and examples",
        "lean": "E₂_slash_transform"
      },
      {
        "id": "E8Packing-covol",
        "kind": "remark",
        "label": "E8Packing-covol",
        "name": "E8Packing covol",
        "color": "#a9dcb8",
        "statement": "$\\Vol{\\Lambda_8} = \\mathrm{Covol}(\\R^8 / \\Lambda_8) = 1$.",
        "section": "The $E_8$ sphere packing",
        "lean": "E8Basis_volume"
      },
      {
        "id": "E8Packing-density",
        "kind": "remark",
        "label": "E8Packing-density",
        "name": "E8Packing density",
        "color": "#c9ecca",
        "statement": "We have $\\Delta_{\\mathcal{P}(E_8)} = \\frac{\\pi^4}{384}$.",
        "section": "The $E_8$ sphere packing",
        "lean": "E8Packing_density"
      },
      {
        "id": "def:th00-th01-th10",
        "kind": "definition",
        "label": "th00-th01-th10",
        "name": "th00 th01 th10",
        "color": "#e0f3d7",
        "statement": "We define three different theta functions (so called ``Thetanullwerte'') as \\begin{align} \\Theta_{2}(z) = \\theta_{10}(z)\\,=\\, & \\sum_{n\\in\\Z}e^{\\pi i (n+\\frac12)^2 z}. \\notag \\\\ \\Theta_{3}(z) = \\theta_{00}(z)\\,=\\, & \\sum_{n\\in\\Z}e^{\\pi i n^2 z} \\notag \\\\ \\Theta_{4}(z) = \\theta_{01}(z)\\,=\\, & \\sum_{n\\in\\Z}(-1)^n\\,e^{\\pi i n^2 z} \\notag \\\\ \\end{align}",
        "section": "Modular forms and examples",
        "lean": "Θ₂, Θ₃, Θ₄"
      },
      {
        "id": "def:H2-H3-H4",
        "kind": "definition",
        "label": "H2-H3-H4",
        "name": "H2 H3 H4",
        "color": "#e0f3d7",
        "statement": "Define \\begin{equation} H_2 = \\Theta_2^4, \\quad H_3 = \\Theta_3^4, \\quad H_4 = \\Theta_4^4. \\end{equation}",
        "section": "Modular forms and examples",
        "lean": "H₂, H₃, H₄"
      },
      {
        "id": "lemma:theta-transform-S-T",
        "kind": "lemma",
        "label": "theta-transform-S-T",
        "name": "theta transform S T",
        "color": "#a9dcb8",
        "statement": "These elements act on the theta functions in the following way \\begin{align} H_2 | S &= -H_4 \\\\ H_3 | S &= -H_3 \\\\ H_4 | S &= -H_2 \\end{align} and \\begin{align} H_2 | T &= -H_2 \\\\ H_3 | T &= H_4 \\\\ H_4 | T &= H_3 \\end{align}",
        "section": "Modular forms and examples",
        "lean": "H₂_T_action, H₃_T_action, H₄_T_action, H₂_S_action, H₃_S_action, H₄_S_action"
      },
      {
        "id": "prop:H2-fourier",
        "kind": "proposition",
        "label": "H2-fourier",
        "name": "H2 fourier",
        "color": "#d3e3fb",
        "statement": "$H_2$ admits a Fourier series of the form \\begin{equation} H_2(z) = \\sum_{n \\ge 1} c_{H_2}(n) e^{\\pi i n z} \\end{equation} for some $c_{H_2}(n) \\in \\R_{\\ge 0}$, with $c_{H_2}(1) = 16$ and $c_{H_2}(n) = O(n^k)$ for some $k \\in \\N$.",
        "section": "Modular forms and examples"
      },
      {
        "id": "prop:H4-fourier",
        "kind": "proposition",
        "label": "H4-fourier",
        "name": "H4 fourier",
        "statement": "$H_4$ admits a Fourier series of the form \\begin{equation} H_4(z) = \\sum_{n \\ge 0} c_{H_4}(n) e^{\\pi i n z} \\end{equation} for some $c_{H_4}(n) \\in \\R$ with $c_{H_4}(0) = 1$ and $c_{H_4}(n) = O(n^k)$ for some $k \\in \\N$. Especially, $H_4$ is not cuspidal.",
        "section": "Modular forms and examples"
      },
      {
        "id": "def: h",
        "kind": "definition",
        "label": " h",
        "name": " h",
        "color": "#d3e3fb",
        "statement": "\\begin{equation} h(z) := 128 \\frac{H_3(z) + H_4(z)}{H_2(z)^2}. \\end{equation}"
      },
      {
        "id": "prop:H3-fourier",
        "kind": "proposition",
        "label": "H3-fourier",
        "name": "H3 fourier",
        "color": "#d3e3fb",
        "statement": "$H_3$ admits a Fourier series of the form \\begin{equation} H_3(z) = \\sum_{n \\ge 0} c_{H_3}(n) e^{\\pi i n z} \\end{equation} for some $c_{H_3}(n) \\in \\R_{\\ge 0}$ with $c_{H_3}(0) = 1$ and $c_{H_3}(n) = O(n^k)$ for some $k \\in \\N$. Especially, $H_3$ is not cuspidal.",
        "section": "Modular forms and examples"
      },
      {
        "id": "lemma:theta-slash-invariant",
        "kind": "lemma",
        "label": "theta-slash-invariant",
        "name": "theta slash invariant",
        "color": "#a9dcb8",
        "statement": "$H_{2}$, $H_{3}$, and $H_{4}$ are slash invariant under $\\Gamma(2)$, i.e. for all $\\gamma \\in \\Gamma(2)$ and $i \\in \\{2, 3, 4\\}$, we have $H_i|\\gamma = H_i|\\gamma^{-1} = H_i$.",
        "section": "Modular forms and examples",
        "lean": "H₂_SIF, H₃_SIF, H₄_SIF"
      },
      {
        "id": "cor:theta-pos",
        "kind": "corollary",
        "label": "theta-pos",
        "name": "theta pos",
        "color": "#a9dcb8",
        "statement": "$H_2(it)$ and $H_4(it)$ are positive for $t > 0$.",
        "section": "Modular forms and examples",
        "lean": "H₂_imag_axis_pos, H₄_imag_axis_pos"
      },
      {
        "id": "lemma:theta-bounded-im-infty",
        "kind": "lemma",
        "label": "theta-bounded-im-infty",
        "name": "theta bounded im infty",
        "color": "#a9dcb8",
        "statement": "For all $\\gamma \\in \\Gamma_1$, $H_{2}|_2 \\gamma$, $H_{3}|_2 \\gamma$, and $H_{4}|_2 \\gamma$ are holomorphic at $i\\infty$.",
        "section": "Modular forms and examples",
        "lean": "isBoundedAtImInfty_H_slash"
      },
      {
        "id": "def:congruence-subgroup",
        "kind": "definition",
        "label": "congruence-subgroup",
        "name": "congruence subgroup",
        "color": "#e0f3d7",
        "statement": "A subgroup $\\Gamma\\subset\\Gamma_1$ is called a \\emph{congruence subgroup} if $\\Gamma(N)\\subset\\Gamma$ for some $N\\in\\N$.",
        "section": "Modular forms and examples"
      },
      {
        "id": "def:Mk",
        "kind": "definition",
        "label": "Mk",
        "name": "Mk",
        "color": "#e0f3d7",
        "statement": "Let $\\Gamma$ denote a subgroup of $\\mathrm{SL}_2(\\mathbb{Z})$, then a modular form of level $\\Gamma$ and weight $k \\in \\mathbb{Z}$ is a function $f : \\mathbb{H} \\to \\mathbb{C}$ such that: \\begin{enumerate} \\item For all $\\gamma \\in \\Gamma$ we have $f\\mid_k \\gamma = f$ (such functions are called slash invariant). \\item $f$ is holomorphic on $\\mathbb{H}$. \\item For all $\\gamma \\in \\mathrm{SL}_2(\\mathbb{Z})$, there exist $A, B \\in \\mathbb{R}$ such that for all $z \\in \\mathbb{H}$, with $ A \\le \\mathrm{Im}(z)$, we have $|(f \\mid_k \\gamma) (z) |\\le B$. Here $| - |$ denotes the standard complex absolute value. \\end{enumerate} This defines a complex vector space which we denote by $M_{k}(\\Gamma)$.",
        "section": "Modular forms and examples",
        "lean": "ModularForm"
      },
      {
        "id": "thm:nonpos_wt",
        "kind": "theorem",
        "label": "nonpos_wt",
        "name": "nonpos wt",
        "color": "#a9dcb8",
        "statement": "Let $k \\in \\Z$ with $k < 0$. Then $M_k(\\Gamma_1) = \\{0\\}$ and moreover $\\dim M_0(\\Gamma(1)) = 1$.",
        "section": "Modular forms and examples",
        "lean": "ModularFormClass.levelOne_neg_weight_eq_zero, ModularForm.levelOne_weight_zero_rank_one"
      },
      {
        "id": "thm:lvl1_dims",
        "kind": "theorem",
        "label": "lvl1_dims",
        "name": "lvl1 dims",
        "color": "#a9dcb8",
        "statement": "Let $k \\in \\Z$ with $k \\ge 0$ and even. Then $\\dim M_k(\\Gamma_1) = \\lfloor k / 12 \\rfloor $ if $k \\equiv 2 \\mod 12$ and $\\dim M_k(\\Gamma_1) = \\lfloor k / 12 \\rfloor + 1$ if $k \\not\\equiv 2 \\mod 12$.",
        "section": "Modular forms and examples",
        "lean": "ModularForm.dimension_level_one"
      },
      {
        "id": "thm:dim-mf-general-level",
        "kind": "theorem",
        "label": "dim-mf-general-level",
        "name": "dim mf general level",
        "color": "#d3e3fb",
        "statement": "Let $\\Gamma$ be a congruence subgroup. Then $M_k(\\Gamma)$ is finite-dimensional.",
        "section": "Modular forms and examples",
        "lean": "dim_gen_cong_levels"
      },
      {
        "id": "cor:dim-mf",
        "kind": "corollary",
        "label": "dim-mf",
        "name": "dim mf",
        "color": "#a9dcb8",
        "statement": "We have \\begin{align} \\dim M_2(\\mathrm{SL}_{2}(\\mathbb{Z})) &= 0, \\\\ \\dim M_4(\\mathrm{SL}_{2}(\\mathbb{Z})) &= 1, \\\\ \\dim M_6(\\mathrm{SL}_{2}(\\mathbb{Z})) &= 1, \\\\ \\dim M_8(\\mathrm{SL}_{2}(\\mathbb{Z})) &= 1, \\\\ \\dim S_4(\\mathrm{SL}_{2}(\\mathbb{Z})) &= 0, \\\\ \\dim S_6(\\mathrm{SL}_{2}(\\mathbb{Z})) &= 0, \\\\ \\dim S_8(\\mathrm{SL}_{2}(\\mathbb{Z})) &= 0. \\end{align}",
        "section": "Modular forms and examples"
      },
      {
        "id": "prop:a-another-integral",
        "kind": "proposition",
        "label": "a-another-integral",
        "name": "a another integral",
        "statement": "For $r\\geq0$ we have \\begin{align}a(r)=&4i\\,\\sin(\\pi r^2/2)^2\\,\\Bigg(\\frac{36}{\\pi^3\\,(r^2-2)}-\\frac{8640}{\\pi^3\\,r^4}+\\frac{18144}{\\pi^3\\,r^2}\\\\ +&\\int\\limits_0^\\infty\\,\\left(t^2\\,\\phi_0\\Big(\\frac{i}{t}\\Big)-\\frac{36}{\\pi^2}\\,e^{2\\pi t}+\\frac{8640}{\\pi}\\,t-\\frac{18144}{\\pi^2}\\right)\\,e^{-\\pi r^2 t}\\,dt \\Bigg) .\\notag\\end{align} The integral converges absolutely for all $r\\in\\R_{\\geq 0}$."
      },
      {
        "id": "prop:a0",
        "kind": "proposition",
        "label": "a0",
        "name": "a0",
        "statement": "We have $a(0) = -\\frac{i}{8640}$.",
        "lean": "MagicFunction.a.SpecialValues.a_zero"
      },
      {
        "id": "E8-vector-norms",
        "kind": "remark",
        "label": "E8-vector-norms",
        "name": "E8 vector norms",
        "color": "#a9dcb8",
        "statement": "All vectors in $\\Lambda_8$ have norm of the form $\\sqrt{2n}$, where $n$ is a nonnegative integer.",
        "section": "Basic Properties of $E_8$ lattice",
        "lean": "E8_norm_eq_sqrt_even"
      },
      {
        "id": "lemma:inv-power-summable",
        "kind": "lemma",
        "label": "inv-power-summable",
        "name": "inv power summable",
        "color": "#d3e3fb",
        "statement": "Let $X \\subset \\R^d$ be a set of sphere packing centres of separation $1$ that is periodic with some lattice $\\Lambda \\subset \\R^d$. Then, there exists $k \\in \\N$ sufficiently large such that \\[ \\sum_{x \\in X} \\frac{1}{\\norm{x}^{k}} < \\infty. \\]",
        "section": "On the Summability of Schwartz Functions"
      },
      {
        "id": "def:Fourier-Transform",
        "kind": "definition",
        "label": "Fourier-Transform",
        "name": "Fourier Transform",
        "color": "#e0f3d7",
        "statement": "The Fourier transform of an $L^1$-function $f:\\R^d\\to\\C$ is defined as \\[ \\mathcal{F}(f)(y) = \\widehat{f}(y) := \\int_{\\R^d} f(x)e^{-2\\pi i \\langle x, y \\rangle} \\,\\mathrm{d}x, \\quad y \\in \\R^d \\] where $\\langle x, y \\rangle = \\frac12\\|x\\|^2 + \\frac12\\|y\\|^2 - \\frac12\\|x - y\\|^2$ is the standard scalar product in $\\R^d$.",
        "lean": "FourierTransform.fourier"
      },
      {
        "id": "lemma:volume-ball-ratio-limit",
        "kind": "lemma",
        "label": "volume-ball-ratio-limit",
        "name": "volume ball ratio limit",
        "color": "#a9dcb8",
        "statement": "For any constant $C > 0$, we have \\[ \\lim_{R \\to \\infty} \\frac{\\mathrm{Vol}(\\mathcal{B}_d(R))}{\\mathrm{Vol}(\\mathcal{B}_d(R + C))} = 1 \\]",
        "lean": "volume_ball_ratio_tendsto_nhds_one''"
      },
      {
        "id": "theorem:psp-density",
        "kind": "theorem",
        "label": "psp-density",
        "name": "psp density",
        "color": "#c9ecca",
        "statement": "For a periodic sphere packing $\\mathcal{P} = \\mathcal{P}(X)$ with centers $X$ periodic to the lattice $\\Lambda$ and separation $r$, \\[ \\Delta_{\\mathcal{P}} = |X / \\Lambda| \\cdot \\frac{\\Vol{\\mathcal{B}_d(r / 2)}}{\\Vol{\\R^d / \\Lambda}} \\]",
        "lean": "PeriodicSpherePacking.density_eq"
      },
      {
        "id": "lemma:mod_form_poly_growth",
        "kind": "lemma",
        "label": "mod_form_poly_growth",
        "name": "mod form poly growth",
        "color": "#a9dcb8",
        "statement": ": Let $\\Gamma$ be a finite index subgroup of $\\mathrm{SL}_2(\\Z)$ and $f \\in \\mathcal{M}_k(\\Gamma)$ be a modular form of weight $k$. Then the Fourier coefficients $a_n(f)$ has a polynomial growth, i.e. $|a_n(f)| = O(n^k)$.",
        "section": "Modular forms and examples"
      },
      {
        "id": "SpherePacking.balls",
        "kind": "remark",
        "label": "SpherePacking.balls",
        "name": "SpherePacking.balls",
        "color": "#e0f3d7",
        "statement": "Given a set $X \\subset \\R^d$ and a real number $r > 0$ (known as the \\emph{separation radius}) such that $\\|x - y\\| \\geq r$ for all distinct $x, y \\in X$, we define the \\emph{sphere packing} $\\Pa(X)$ with centres at $X$ to be the union of all open balls of radius $r$ centred at points in $X$: \\[ \\Pa(X) := \\bigcup_{x \\in X} B_d(x, r) \\]",
        "section": "The Setup",
        "lean": "SpherePacking.balls"
      },
      {
        "id": "SpherePacking.finiteDensity",
        "kind": "remark",
        "label": "SpherePacking.finiteDensity",
        "name": "SpherePacking.finiteDensity",
        "color": "#e0f3d7",
        "statement": "The \\emph{finite density} of a packing $\\mathcal{P}$ is defined as \\[ \\Delta_{\\mathcal{P}}(R):=\\frac{\\mathrm{Vol}(\\mathcal{P}\\cap B_d(0,R))}{\\mathrm{Vol}(B_d(0,R))},\\quad R>0. \\]",
        "section": "The Setup",
        "lean": "SpherePacking.finiteDensity"
      },
      {
        "id": "SpherePacking.density",
        "kind": "remark",
        "label": "SpherePacking.density",
        "name": "SpherePacking.density",
        "color": "#e0f3d7",
        "statement": "We define the \\emph{density} of a packing $\\mathcal{P}$ as the limit superior \\[ \\Delta_{\\mathcal{P}}:=\\limsup\\limits_{R\\to\\infty}\\Delta_{\\mathcal{P}}(R). \\]",
        "section": "The Setup",
        "lean": "SpherePacking.density"
      },
      {
        "id": "lemma:sp-finite-density-bound",
        "kind": "lemma",
        "label": "sp-finite-density-bound",
        "name": "sp finite density bound",
        "color": "#c9ecca",
        "statement": "For any $R > 0$, \\[ \\left|X \\cap \\mathcal{B}_d\\left(R - \\frac{r}{2}\\right)\\right| \\cdot \\frac{\\mathrm{Vol}\\left(\\mathcal{B}_d\\left(\\frac{r}{2}\\right)\\right)}{\\mathrm{Vol}(\\mathcal{B}_d(R))} \\leq \\Delta_{\\mathcal{P}}(R) \\leq \\left|X \\cap \\mathcal{B}_d\\left(R + \\frac{r}{2}\\right)\\right| \\cdot \\frac{\\mathrm{Vol}\\left(\\mathcal{B}_d\\left(\\frac{r}{2}\\right)\\right)}{\\mathrm{Vol}(\\mathcal{B}_d(R))} \\]",
        "lean": "SpherePacking.finiteDensity_le, SpherePacking.finiteDensity_ge"
      },
      {
        "id": "cor:disc-pos",
        "kind": "corollary",
        "label": "disc-pos",
        "name": "disc pos",
        "color": "#a9dcb8",
        "statement": "$\\Delta(it) > 0$ for all $t > 0$.",
        "section": "Modular forms and examples",
        "lean": "Delta_imag_axis_pos"
      },
      {
        "id": "def:Gamma-1-Action",
        "kind": "definition",
        "label": "Gamma-1-Action",
        "name": "Gamma 1 Action",
        "color": "#a9dcb8",
        "statement": "The modular group $\\Gamma_1:=\\mathrm{SL}_2(\\Z)$ acts on $\\h$ by linear fractional transformations $$\\left(\\begin{smallmatrix}a&b\\\\c&d\\end{smallmatrix}\\right)z:=\\frac{az+b}{cz+d}.$$",
        "section": "Modular forms and examples"
      },
      {
        "id": "def:slash-operator",
        "kind": "definition",
        "label": "slash-operator",
        "name": "slash operator",
        "color": "#e0f3d7",
        "statement": "Let $F$ be a function on $\\h$ and $\\gamma\\in\\mathrm{SL}_2(\\Z)$. Then the \\emph{slash operator} acts on $F$ by $$(F|_k\\gamma)(z):=j_k(z,\\gamma)\\,F(\\gamma z). $$",
        "section": "Modular forms and examples"
      },
      {
        "id": "lemma:slash-negI-even-weight",
        "kind": "lemma",
        "label": "slash-negI-even-weight",
        "name": "slash negI even weight",
        "color": "#a9dcb8",
        "statement": "For even $k$, $F|_{k}(-I) = F$.",
        "section": "Modular forms and examples",
        "lean": "modular_slash_negI_of_even"
      },
      {
        "id": "lemma:Gamma-1-generators",
        "kind": "lemma",
        "label": "Gamma-1-generators",
        "name": "Gamma 1 generators",
        "color": "#a9dcb8",
        "statement": "We have $\\Gamma(1) = \\langle S, T, -I \\rangle$.",
        "section": "Modular forms and examples",
        "lean": "SL2Z_generate"
      },
      {
        "id": "lemma:theta-modular",
        "kind": "lemma",
        "label": "theta-modular",
        "name": "theta modular",
        "color": "#a9dcb8",
        "statement": "$H_{2}$, $H_{3}$, and $H_{4}$ belong to $M_2(\\Gamma(2))$.",
        "section": "Modular forms and examples",
        "lean": "H₂_MF, H₃_MF, H₄_MF"
      },
      {
        "id": "lemma:jacobi-identity",
        "kind": "lemma",
        "label": "jacobi-identity",
        "name": "jacobi identity",
        "color": "#a9dcb8",
        "statement": "These three theta functions satisfy the \\emph{Jacobi identity} \\begin{equation} H_{2} + H_{4} = H_{3} \\Leftrightarrow \\Theta_{2}^4 + \\Theta_{4}^4 = \\Theta_{3}^4. \\end{equation}",
        "section": "Modular forms and examples",
        "lean": "jacobi_identity"
      },
      {
        "id": "lemma:lv1-lv2-identities",
        "kind": "lemma",
        "label": "lv1-lv2-identities",
        "name": "lv1 lv2 identities",
        "color": "#d3e3fb",
        "statement": "We have \\begin{align} E_4 &= \\frac{1}{2}(H_{2}^{2} + H_{3}^{2} + H_{4}^{2}) = H_{2}^{2} + H_{2}H_{4} + H_{4}^{2} \\\\ E_6 &= \\frac{1}{2} (H_{2} + H_{3})(H_{3} + H_{4}) (H_{4} - H_{2}) = \\frac{1}{2}(H_2 + 2H_4)(2H_2 + H_4)(H_4 - H_2) \\\\ \\Delta &= \\frac{1}{256} (H_{2}H_{3}H_{4})^2. \\end{align}",
        "section": "Modular forms and examples"
      },
      {
        "id": "lemma:psiI-psiT-psiS-fourier",
        "kind": "lemma",
        "label": "psiI-psiT-psiS-fourier",
        "name": "psiI psiT psiS fourier",
        "statement": "The Fourier expansions of these functions are \\begin{align} \\psi_I(z)\\,=\\,&q^{-1} + 144 + O(q^{1/2}) \\\\ \\psi_T(z)\\,=\\,&q^{-1} + 144 + O(q^{1/2}) \\end{align}"
      },
      {
        "id": "SpherePacking.scale",
        "kind": "remark",
        "label": "SpherePacking.scale",
        "name": "SpherePacking.scale",
        "color": "#e0f3d7",
        "statement": "Given a sphere packing $\\Pa(X)$ with separation radius $r$, we defined the \\emph{scaled packing} with respect to a real number $c > 0$ to be the packing $\\Pa(cX)$, where $cX = \\setof{cx \\in V}{x \\in X}$ has separation radius $cr$.",
        "section": "Scaling Sphere Packings",
        "lean": "SpherePacking.scale"
      },
      {
        "id": "def:Gamma-generators",
        "kind": "definition",
        "label": "Gamma-generators",
        "name": "Gamma generators",
        "color": "#e0f3d7",
        "statement": "Define the matrices \\[ S = \\begin{pmatrix} 0 & -1 \\\\ 1 & 0 \\end{pmatrix} \\in \\Gamma_1, T = \\begin{pmatrix} 1 & 1 \\\\ 0 & 1 \\end{pmatrix} \\in \\Gamma_1, \\alpha = \\begin{pmatrix} 1 & 2 \\\\ 0 & 1 \\end{pmatrix} \\in \\Gamma_2 \\subset \\Gamma_1, \\beta = \\begin{pmatrix} 1 & 0 \\\\ 2 & 1 \\end{pmatrix} \\in \\Gamma_2 \\subset \\Gamma_1. \\] It is easily verifiable that $\\alpha = T^2$ and $\\beta = -S\\alpha^{-1}S = -ST^{-2}S$.",
        "section": "Modular forms and examples",
        "lean": "ModularGroup.S, ModularGroup.T, α, β"
      },
      {
        "id": "lemma:Gamma-2-generators",
        "kind": "lemma",
        "label": "Gamma-2-generators",
        "name": "Gamma 2 generators",
        "color": "#a9dcb8",
        "statement": "We have $\\Gamma(2) = \\langle \\alpha, \\beta, -I \\rangle$.",
        "section": "Modular forms and examples",
        "lean": "Γ2_generate"
      },
      {
        "id": "E8-Lattice",
        "kind": "remark",
        "label": "E8-Lattice",
        "name": "E8 Lattice",
        "color": "#a9dcb8",
        "statement": "$\\Lambda_8$ is an additive subgroup of $\\R^8$.",
        "section": "Basic Properties of $E_8$ lattice",
        "lean": "E8Lattice"
      },
      {
        "id": "lemma:der-q-series",
        "kind": "lemma",
        "label": "der-q-series",
        "name": "der q series",
        "color": "#a9dcb8",
        "statement": "We have an equality of operators $D = q \\frac{\\dd}{\\dd q}$. In particular, the $q$-series of the derivative of a quasimodular form $F(z) = \\sum_{n \\ge n_0} a_n q^n$ is $F'(z) = \\sum_{n \\ge n_0} n a_n q^n$.",
        "section": "Quasimodular forms and derivatives",
        "lean": "D_qexp_tsum_pnat"
      },
      {
        "id": "lemma:log-der-inf",
        "kind": "lemma",
        "label": "log-der-inf",
        "name": "log der inf",
        "color": "#d3e3fb",
        "statement": "Let $F$ be a quasimodular form where the vanishing order of $F$ at infinity is $n_0 > 0$, i.e. $F(z) = \\sum_{n \\geq n_0} a_n q^{n}$ with $a_{n_0} \\ne 0$. Then \\begin{equation} \\lim_{t \\to \\infty} \\frac{F'(it)}{F(it)} = n_0. \\end{equation}",
        "section": "Proof of Theorem"
      },
      {
        "id": "thm:smooth-fast-decay-schwartz",
        "kind": "theorem",
        "label": "smooth-fast-decay-schwartz",
        "name": "smooth fast decay schwartz",
        "statement": "Assume $f : \\R \\to \\C$ is smooth on $[0, \\infty)$ and for all $k, n \\in \\N$, there exists $C \\in \\R$ such that $$ x^{\\frac{k}{2}} \\cdot |f^{(n)}(x)| \\leq C. $$ Then, for all $d \\in \\N$, the function $$ f_d : \\R^d \\to \\C, \\quad f_d(x) := f(\\|x\\|^2) $$ is a Schwartz function.",
        "section": "On the Summability of Schwartz Functions"
      },
      {
        "id": "prop:b-schwartz",
        "kind": "proposition",
        "label": "b-schwartz",
        "name": "b schwartz",
        "statement": "$b(x)$ is a Schwartz function.",
        "lean": "MagicFunction.FourierEigenfunctions.b"
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
        "color": "#a9dcb8",
        "statement": "The two definitions above coincide, i.e. $\\Lambda_8 = \\mathrm{span}_{\\Z}(\\B_8)$.",
        "section": "Definitions of $E_8$ lattice",
        "lean": "span_E8Matrix"
      },
      {
        "id": "E8-is-basis",
        "kind": "remark",
        "label": "E8-is-basis",
        "name": "E8 is basis",
        "color": "#a9dcb8",
        "statement": "$B_8$ is a $\\R$-basis of $\\R^8$.",
        "section": "Basic Properties of $E_8$ lattice",
        "lean": "span_E8Matrix_eq_top"
      },
      {
        "id": "def:derivative",
        "kind": "definition",
        "label": "derivative",
        "name": "derivative",
        "color": "#e0f3d7",
        "statement": "Let $F$ be a quasimodular form. We define the (normalized) derivative of $F$ as \\begin{equation} F' = DF := \\frac{1}{2\\pi i} \\frac{\\dd}{\\dd z} F. \\end{equation}",
        "section": "Quasimodular forms and derivatives",
        "lean": "D"
      },
      {
        "id": "lemma:dedekind_eta_transformation",
        "kind": "lemma",
        "label": "dedekind_eta_transformation",
        "name": "dedekind eta transformation",
        "color": "#a9dcb8",
        "statement": "The Dedekind eta function transforms as $$ \\eta\\left(-\\frac{1}{z}\\right) = \\sqrt{-iz} \\eta(z). $$",
        "section": "Modular forms and examples",
        "lean": "ModularForm.eta_comp_eq_csqrt_I_inv"
      },
      {
        "id": "lemma:disc-cuspform",
        "kind": "lemma",
        "label": "disc-cuspform",
        "name": "disc cuspform",
        "color": "#a9dcb8",
        "statement": "$\\Delta(z) \\in M_{12}(\\Gamma_1)$. Especially, we have \\begin{equation} \\Delta\\left(-\\frac{1}{z}\\right) = z^{12} \\Delta(z). \\end{equation} Also, it vanishes at the unique cusp, i.e. it is a cusp form of level $\\Gamma_1$ and weight $12$.",
        "section": "Modular forms and examples",
        "lean": "Delta"
      },
      {
        "id": "lemma:psi-bound",
        "kind": "lemma",
        "label": "psi-bound",
        "name": "psi bound",
        "color": "#d3e3fb",
        "statement": "There exist constants $C_I, C_S, C_T > 0$ such that \\begin{align} |\\psi_I(z)| &\\le C_I e^{2\\pi \\Im z}, \\\\ |\\psi_T(z)| &\\le C_T e^{2\\pi \\Im z}, \\\\ |\\psi_S(z)| &\\le C_S e^{- \\pi \\Im z} \\end{align}"
      },
      {
        "id": "cor:disc-nonvanishing",
        "kind": "corollary",
        "label": "disc-nonvanishing",
        "name": "disc nonvanishing",
        "color": "#a9dcb8",
        "statement": "$\\Delta(z) \\neq 0$ for all $z \\in \\h$.",
        "section": "Modular forms and examples",
        "lean": "Δ_ne_zero"
      },
      {
        "id": "lemma:lattice-points-bound",
        "kind": "lemma",
        "label": "lattice-points-bound",
        "name": "lattice points bound",
        "color": "#a9dcb8",
        "statement": "For all $R$, we have the following inequality relating the number of lattice points from $\\Lambda$ in a ball with the volume of the ball and the fundamental region $\\mathcal{D}$: \\[ \\frac{\\mathrm{Vol}(\\mathcal{B}_d(R - L))}{\\mathrm{Vol}(\\mathcal{D})} \\leq \\left|\\Lambda \\cap \\mathcal{B}_d(R)\\right| \\leq \\frac{\\mathrm{Vol}(\\mathcal{B}_d(R + L))}{\\mathrm{Vol}(\\mathcal{D})} \\]",
        "lean": "PeriodicSpherePacking.aux2_ge', PeriodicSpherePacking.aux2_le'"
      },
      {
        "id": "def:E2",
        "kind": "definition",
        "label": "E2",
        "name": "E2",
        "color": "#e0f3d7",
        "statement": "We set \\begin{equation} E_2(z):= 1-24\\sum_{n=1}^\\infty \\sigma_1(n)\\,e^{2\\pi i n z}. \\end{equation}",
        "section": "Modular forms and examples",
        "lean": "E₂_eq"
      },
      {
        "id": "lemma:E2-transform-S",
        "kind": "lemma",
        "label": "E2-transform-S",
        "name": "E2 transform S",
        "color": "#a9dcb8",
        "statement": "This function is not modular, however it satisfies \\begin{equation} z^{-2}\\,E_2\\left(-\\frac{1}{z}\\right) = E_2(z) -\\frac{6i}{\\pi}\\, \\frac{1}{z}. \\end{equation}",
        "section": "Modular forms and examples",
        "lean": "E₂_transform"
      },
      {
        "id": "lem:bound-I1-I3-I5",
        "kind": "lemma",
        "label": "bound-I1-I3-I5",
        "name": "bound I1 I3 I5",
        "color": "#d3e3fb",
        "statement": "There exists $C > 0$ such that for all $r \\geq 0$, \\begin{equation} |I_1(r)|, |I_3(r)|, |I_5(r)| \\leq C \\int_1^{\\infty} e^{-2\\pi s} \\, e^{-\\pi r / s} \\, \\dd s. \\end{equation}"
      },
      {
        "id": "lemma:bound-J2-J4-J6",
        "kind": "lemma",
        "label": "bound-J2-J4-J6",
        "name": "bound J2 J4 J6",
        "statement": "There exist $C_1, C_2 > 0$ such that \\begin{align} |J_2(r)|, |J_4(r)| &\\le C_1 e^{-\\pi r} \\\\ |J_6(r)| &\\le C_2 \\frac{e^{\\pi (r + 1)}}{r + 1} \\end{align}"
      },
      {
        "id": "lem:bound-I2-I4-I6",
        "kind": "lemma",
        "label": "bound-I2-I4-I6",
        "name": "bound I2 I4 I6",
        "color": "#d3e3fb",
        "statement": "There exist $C_1, C_2 > 0$ such that for all $r \\geq 0$, \\begin{equation} |I_2(r)|, |I_4(r)| \\leq C_1 e^{-\\pi r} \\end{equation} and \\begin{equation} |I_6(r)| \\leq C_2 \\frac{e^{-\\pi(r + 2)}}{r + 2} \\end{equation}"
      },
      {
        "id": "def:dedekind_eta",
        "kind": "definition",
        "label": "dedekind_eta",
        "name": "dedekind eta",
        "color": "#e0f3d7",
        "statement": "The Dedekind eta function is defined as $$ \\eta(z) = q^{1/24} \\prod_{n \\ge 1} (1 - q^n) $$ where $q = e^{2\\pi i z}$.",
        "section": "Modular forms and examples",
        "lean": "ModularForm.eta"
      },
      {
        "id": "def:disc-definition",
        "kind": "definition",
        "label": "disc-definition",
        "name": "disc definition",
        "color": "#e0f3d7",
        "statement": "The \\emph{discriminant form} $\\Delta(z)$ is given by \\begin{equation} \\Delta(z) = e^{2 \\pi i z} \\prod_{n \\ge 1} (1 - e^{2 \\pi i n z})^{24}. \\end{equation}",
        "section": "Modular forms and examples",
        "lean": "Δ"
      },
      {
        "id": "lemma:disc-E4E6",
        "kind": "lemma",
        "label": "disc-E4E6",
        "name": "disc E4E6",
        "color": "#a9dcb8",
        "statement": "We have \\begin{equation} \\Delta(z) = (E_4^3-E_6^2)/1728. \\end{equation}",
        "section": "Modular forms and examples",
        "lean": "Delta_E4_eqn"
      },
      {
        "id": "lemma:mod-div-disc-bound",
        "kind": "lemma",
        "label": "mod-div-disc-bound",
        "name": "mod div disc bound",
        "color": "#a9dcb8",
        "statement": "Let $f(z)$ be a holomorphic function with a Fourier expansion \\begin{equation} f(z) = \\sum_{n \\ge n_0} c_f(n) e^{\\pi i n z} \\end{equation} with $c_f(n_0) \\ne 0$. Assume that $c_f(n)$ has a polynomial growth, i.e. $|c_f(n)| = O(n^k)$ for some $k \\in \\N$. Then there exists a constant $C_f > 0$ such that \\begin{equation} \\left|\\frac{f(z)}{\\Delta(z)}\\right| \\le C_f e^{-\\pi (n_0 - 2) \\Im z} \\end{equation} for all $z$ with $\\Im z > 1/2$.",
        "lean": "MagicFunction.PolyFourierCoeffBound.DivDiscBoundOfPolyFourierCoeff"
      },
      {
        "id": "lemma:periodic-points-bounds",
        "kind": "lemma",
        "label": "periodic-points-bounds",
        "name": "periodic points bounds",
        "color": "#a9dcb8",
        "statement": "For all $R$, we have the following inequality relating the number of points from $X$ (periodic w.r.t. $\\Lambda$) in a ball with the number of points from $\\Lambda$: \\[ \\left|\\Lambda \\cap \\mathcal{B}_d(R - L)\\right|\\left|X / \\Lambda\\right| \\leq \\left|X \\cap \\mathcal{B}_d(R)\\right| \\leq \\left|\\Lambda \\cap \\mathcal{B}_d(R + L)\\right|\\left|X / \\Lambda\\right| \\]",
        "lean": "PeriodicSpherePacking.aux_ge, PeriodicSpherePacking.aux_le"
      },
      {
        "id": "lemma:slash-operator-chain-rule",
        "kind": "lemma",
        "label": "slash-operator-chain-rule",
        "name": "slash operator chain rule",
        "color": "#a9dcb8",
        "statement": "The chain rule implies $$F|_k\\gamma_1\\gamma_2=(F|_k\\gamma_1)|_k\\gamma_2.$$",
        "section": "Modular forms and examples",
        "lean": "SlashAction.slash_mul"
      },
      {
        "id": "lemma:bound-J1-J3-J5",
        "kind": "lemma",
        "label": "bound-J1-J3-J5",
        "name": "bound J1 J3 J5",
        "statement": "There exist a constant $C > 0$ such that \\begin{align} |J_1(r)|, |J_3(r)|, |J_5(r)| &\\le C \\int_1^{\\infty} e^{-\\pi s} e^{\\pi r / s}\\, \\dd s. \\end{align}"
      },
      {
        "id": "def:automorphy-factor",
        "kind": "definition",
        "label": "automorphy-factor",
        "name": "automorphy factor",
        "color": "#e0f3d7",
        "statement": "The \\emph{automorphy factor} of weight $k$ is defined as $$j_k(z,\\left(\\begin{smallmatrix}a&b\\\\c&d\\end{smallmatrix}\\right)):=(cz+d)^{-k}.$$",
        "section": "Modular forms and examples",
        "lean": "UpperHalfPlane.denom"
      },
      {
        "id": "lemma:automorphy-factor-chain-rule",
        "kind": "lemma",
        "label": "automorphy-factor-chain-rule",
        "name": "automorphy factor chain rule",
        "color": "#a9dcb8",
        "statement": "The automorphy factor satisfies the \\emph{chain rule} $$j_k(z,\\gamma_1\\gamma_2)=j_k(z,\\gamma_1)\\,j_k(\\gamma_2z,\\gamma_1). $$",
        "section": "Modular forms and examples",
        "lean": "UpperHalfPlane.denom_cocycle"
      },
      {
        "id": "lemma:psi-new",
        "kind": "lemma",
        "label": "psi-new",
        "name": "psi new",
        "color": "#d3e3fb",
        "statement": "$\\psi_I(z), \\psi_S(z), \\psi_T(z)$ can be written as \\begin{align} \\psi_I(z) &= \\frac{H_4^3 (5 H_2^2 + 5 H_2 H_4 + 2 H_4^2)}{2\\Delta}, \\\\ \\psi_S(z) &= -\\frac{H_2^3 (2 H_2^2 + 5 H_2 H_4 + 5 H_4^2)}{2 \\Delta}. \\\\ \\psi_T(z) &= \\frac{H_3^3 (5 H_2^2 - 5 H_2 H_3 + 2 H_3^2)}{2 \\Delta} \\end{align}"
      },
      {
        "id": "def:dual-lattice",
        "kind": "definition",
        "label": "dual-lattice",
        "name": "dual lattice",
        "color": "#e0f3d7",
        "statement": "The \\emph{dual lattice} of a lattice $\\Lambda$ is the set \\[ \\Lambda^* := \\setof{v \\in \\R^d}{\\forall l \\in \\Lambda, \\left\\langle v,l \\right\\rangle \\in \\Z} \\]",
        "section": "Lattices and Periodic packings",
        "lean": "LinearMap.BilinForm.dualSubmodule"
      },
      {
        "id": "lem:integral-bound",
        "kind": "lemma",
        "label": "integral-bound",
        "name": "integral bound",
        "color": "#d3e3fb",
        "statement": "For all $n \\in \\N$, there exists a constant $C'$ such that for all $r \\geq 0$, \\begin{align} r^n \\cdot \\int_{1}^{\\infty} e^{-2\\pi s} \\, e^{-\\pi r /s} \\, \\dd s \\leq C' \\end{align}"
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
        "color": "#e0f3d7",
        "statement": "The \\emph{level $N$ principal congruence subgroup} of $\\Gamma_1$ is $$ \\Gamma(N):=\\left\\{\\left.\\left(\\begin{smallmatrix}a&b\\\\c&d\\end{smallmatrix}\\right)\\in\\Gamma_1\\right|\\left(\\begin{smallmatrix}a&b\\\\c&d\\end{smallmatrix}\\right)\\equiv\\left(\\begin{smallmatrix}1&0\\\\0&1\\end{smallmatrix}\\right)\\;\\mathrm{mod}\\;N\\right\\}. $$",
        "section": "Modular forms and examples"
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
