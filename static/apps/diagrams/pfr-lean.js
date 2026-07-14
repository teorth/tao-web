// Library diagram for the paper-diagram viewer — lazy-loaded on demand.
// Polynomial Freiman–Ruzsa conjecture — the teorth/pfr Lean formalization (2023).
// AUTO-CONVERTED from the project blueprint by leanblueprint_to_paperdiagram.py
// (deterministic): structure+status from the dep graph, statement text/section from
// the source. Fill colour = formalization status. A cross-version test of the tool.
;(function (g) {
  var D = {
    "format": "paper-diagram",
    "schemaVersion": 1,
    "meta": {
      "title": "Polynomial Freiman–Ruzsa conjecture — a Lean formalization",
      "paper": {
        "authors": [
          "PFR formalization project"
        ],
        "year": 2023,
        "journal": "Lean 4 blueprint (the 2023 formalization of the PFR conjecture)",
        "note": "Auto-converted (deterministically, no LLM) from the PFR Lean blueprint (github.com/teorth/pfr) — the 2023 formalization of the polynomial Freiman–Ruzsa conjecture over 𝔽₂ⁿ. Structure, the dependency edges and each statement’s text/section come from the blueprint; the FILL colour is Lean formalization status (softened for legibility): green = fully formalized, lighter green = in progress, blue = not yet ready, white = not started."
      }
    },
    "layout": {
      "engine": "layered",
      "direction": "up"
    },
    "nodes": [
      {
        "id": "vanish-entropy",
        "kind": "remark",
        "label": "vanish-entropy",
        "name": "Vanishing of mutual information",
        "color": "#a9dcb8",
        "statement": "If $X,Y$ are random variables, then $\\bbI[X:Y] = 0$ if and only if $X,Y$ are independent.",
        "section": "Shannon entropy inequalities",
        "lean": "ProbabilityTheory.mutualInfo_eq_zero"
      },
      {
        "id": "converse-log-sum",
        "kind": "remark",
        "label": "converse-log-sum",
        "name": "converse log sum",
        "color": "#a9dcb8",
        "statement": "If equality holds in \\Cref{log-sum}, then $a_s=r\\cdot b_s$ for every $s\\in S$, for some constant $r\\in \\mathbb{R}$.",
        "section": "Applications of Jensen's inequality",
        "lean": "Real.sum_mul_log_div_eq_iff"
      },
      {
        "id": "jensen-bound",
        "kind": "remark",
        "label": "jensen-bound",
        "name": "Jensen bound",
        "color": "#a9dcb8",
        "statement": "If $X$ is an $S$-valued random variable, then $\\bbH[X] \\leq \\log |S|$.",
        "section": "Shannon entropy inequalities",
        "lean": "ProbabilityTheory.entropy_le_log_card, ProbabilityTheory.entropy_le_log_card_of_mem"
      },
      {
        "id": "uniform-entropy",
        "kind": "remark",
        "label": "uniform-entropy",
        "name": "Entropy of uniform random variable",
        "color": "#a9dcb8",
        "statement": "If $X$ is $S$-valued random variable, then $\\bbH[X] = \\log |S|$ if and only if $X$ is uniformly distributed on $S$.",
        "section": "Shannon entropy inequalities",
        "lean": "ProbabilityTheory.IsUniform.entropy_eq"
      },
      {
        "id": "mutual-nonneg",
        "kind": "remark",
        "label": "mutual-nonneg",
        "name": "Nonnegativity of mutual information",
        "color": "#a9dcb8",
        "statement": "We have $\\bbI[X:Y] \\geq 0$.",
        "section": "Shannon entropy inequalities",
        "lean": "ProbabilityTheory.mutualInfo_nonneg"
      },
      {
        "id": "add-entropy",
        "kind": "remark",
        "label": "add-entropy",
        "name": "Additivity of entropy",
        "color": "#a9dcb8",
        "statement": "If $X,Y$ are random variables, then $\\bbH[X,Y] = \\bbH[X] + \\bbH[Y]$ if and only if $X,Y$ are independent.",
        "section": "Shannon entropy inequalities",
        "lean": "ProbabilityTheory.entropy_pair_eq_add"
      },
      {
        "id": "zero-large",
        "kind": "remark",
        "label": "zero-large",
        "name": "Zero Ruzsa distance implies large symmetry group",
        "color": "#a9dcb8",
        "statement": "If $X$ is a $G$-valued random variable such that $d[X ;X]=0$, and $x,y \\in G$ are such that $P[X=x], P[X=y]>0$, then $x-y \\in \\mathrm{Sym}[X]$.",
        "section": "The 100\\% version of PFR",
        "lean": "sub_mem_symmGroup"
      },
      {
        "id": "conditional-vanish",
        "kind": "remark",
        "label": "conditional-vanish",
        "name": "Vanishing conditional mutual information",
        "color": "#a9dcb8",
        "statement": "If $X,Y,Z$ are random variables, then $\\bbI[X:Y|Z] = 0$ iff $X,Y$ are conditionally independent over $Z$.",
        "section": "Shannon entropy inequalities",
        "lean": "ProbabilityTheory.condMutualInfo_eq_zero"
      },
      {
        "id": "sumset-lower",
        "kind": "remark",
        "label": "sumset-lower",
        "name": "Independent lower bound on sumset",
        "color": "#a9dcb8",
        "statement": "If $X,Y$ are independent $G$-valued random variables, then $$\\max(\\bbH[X], \\bbH[Y]) \\leq \\bbH[X\\pm Y]. $$",
        "section": "Entropic Ruzsa calculus",
        "lean": "ProbabilityTheory.max_entropy_le_entropy_add, ProbabilityTheory.max_entropy_le_entropy_sub"
      },
      {
        "id": "Gibbs-converse",
        "kind": "remark",
        "label": "Gibbs-converse",
        "name": "Converse Gibbs inequality",
        "color": "#a9dcb8",
        "statement": "If $D_{KL}(X\\Vert Y) = 0$, then $Y$ is a copy of $X$.",
        "section": "Kullback–Leibler divergence",
        "lean": "KLDiv_eq_zero_iff_identDistrib"
      },
      {
        "id": "pfr_aux-improv",
        "kind": "remark",
        "label": "pfr_aux-improv",
        "name": "pfr aux improv",
        "color": "#a9dcb8",
        "statement": "If $A \\subset {\\bf F}_2^n$ is non-empty and $|A+A| \\leq K|A|$, then $A$ can be covered by at most $K^6 |A|^{1/2}/|H|^{1/2}$ translates of a subspace $H$ of ${\\bf F}_2^n$ with $$ |H|/|A| \\in [K^{-10}, K^{10}]. $$",
        "section": "Improving the exponents",
        "lean": "PFR_conjecture_improv_aux"
      },
      {
        "id": "dist-projection",
        "kind": "remark",
        "label": "dist-projection",
        "name": "Projection entropy and distance",
        "color": "#a9dcb8",
        "statement": "If $G$ is an additive group and $X$ is a $G$-valued random variable and $H\\leq G$ is a finite subgroup then, with $\\pi:G\\to G/H$ the natural homomorphism we have (where $U_H$ is uniform on $H$) \\[\\mathbb{H}(\\pi(X))\\leq 2d[X;U_H].\\]",
        "section": "Entropic Ruzsa calculus",
        "lean": "ent_of_proj_le"
      },
      {
        "id": "cond-reduce",
        "kind": "remark",
        "label": "cond-reduce",
        "name": "Conditioning reduces entropy",
        "color": "#a9dcb8",
        "statement": "With notation as above, we have $\\bbH[X|Y] \\leq \\bbH[X]$.",
        "section": "Shannon entropy inequalities",
        "lean": "ProbabilityTheory.condEntropy_le_entropy"
      },
      {
        "id": "cor-fibre",
        "kind": "remark",
        "label": "cor-fibre",
        "name": "Specific fibring identity",
        "color": "#a9dcb8",
        "statement": "Let $Y_1,Y_2,Y_3$ and $Y_4$ be independent $G$-valued random variables. Then \\begin{align*} & d[Y_1+Y_3; Y_2+Y_4] + d[Y_1|Y_1+Y_3; Y_2|Y_2+Y_4] \\\\ &\\qquad + \\bbI[Y_1+Y_2 : Y_2 + Y_4 | Y_1+Y_2+Y_3+Y_4] = d[Y_1; Y_2] + d[Y_3; Y_4]. \\end{align*}",
        "section": "The Fibring lemma",
        "lean": "sum_of_rdist_eq"
      },
      {
        "id": "entropic-bsg",
        "kind": "remark",
        "label": "entropic-bsg",
        "name": "Balog-Szemer\\'edi-Gowers",
        "color": "#a9dcb8",
        "statement": "Let $A,B$ be $G$-valued random variables on $\\Omega$, and set $Z := A+B$. Then \\begin{equation} \\sum_{z} \\bbP[Z=z] d[(A | Z = z); (B | Z = z)] \\leq 3 \\bbI[A:B] + 2 \\bbH[Z] - \\bbH[A] - \\bbH[B]. \\end{equation}",
        "section": "Entropic Ruzsa calculus",
        "lean": "ent_bsg"
      },
      {
        "id": "sign-flip",
        "kind": "remark",
        "label": "sign-flip",
        "name": "Flipping a sign",
        "color": "#a9dcb8",
        "statement": "If $X,Y$ are $G$-valued, then $$ d[X ; -Y] \\leq 3 d[X;Y].$$",
        "section": "More Ruzsa distance estimates",
        "lean": "rdist_of_neg_le"
      },
      {
        "id": "ruzsa-triangle-improved",
        "kind": "remark",
        "label": "ruzsa-triangle-improved",
        "name": "Improved Ruzsa triangle inequality",
        "color": "#a9dcb8",
        "statement": "If $X,Y,Z$ are $G$-valued random variables on $\\Omega$ with $(X,Y)$ independent of $Z$, then \\begin{equation} \\bbH[X - Y] \\leq \\bbH[X-Z] + \\bbH[Z-Y] - \\bbH[Z]\\end{equation}",
        "section": "Entropic Ruzsa calculus",
        "lean": "ent_of_diff_le"
      },
      {
        "id": "cor-multid",
        "kind": "remark",
        "label": "cor-multid",
        "name": "cor multid",
        "color": "#a9dcb8",
        "statement": "Let $G$ be an abelian group and let $m \\geq 2$. Suppose that $X_{i,j}$, $1 \\leq i, j \\leq m$, are independent $G$-valued random variables. Then \\begin{align*} &\\bbI[ \\bigl(\\sum_{i=1}^m X_{i,j}\\bigr)_{j =1}^{m} : \\bigl(\\sum_{j=1}^m X_{i,j}\\bigr)_{i = 1}^m \\; \\big| \\; \\sum_{i=1}^m \\sum_{j = 1}^m X_{i,j} ] \\\\ &\\quad \\leq \\sum_{j=1}^{m-1} \\Bigl(D[(X_{i, j})_{i = 1}^m] - D[ (X_{i, j})_{i = 1}^m \\; \\big| \\; (X_{i,j} + \\cdots + X_{i,m})_{i =1}^m ]\\Bigr) \\\\ & \\qquad\\qquad\\qquad\\qquad + D[(X_{i,m})_{i=1}^m] - D[ \\bigl(\\sum_{j=1}^m X_{i,j}\\bigr)_{i=1}^m ], \\end{align*} where all the multidistances here involve the indexing set $\\{1,\\dots, m\\}$.",
        "section": "The multidistance chain rule",
        "lean": "cor_multiDist_chainRule"
      },
      {
        "id": "sym-zero",
        "kind": "remark",
        "label": "sym-zero",
        "name": "Translate is uniform on symmetry group",
        "color": "#a9dcb8",
        "statement": "If $X$ is a $G$-valued random variable with $d[X ;X]=0$, and $x_0$ is a point with $P[X=x_0] > 0$, then $X-x_0$ is uniformly distributed on $\\mathrm{Sym}[X]$.",
        "section": "The 100\\% version of PFR",
        "lean": "isUniform_sub_const_of_rdist_eq_zero"
      },
      {
        "id": "cond-trial-ent",
        "kind": "remark",
        "label": "cond-trial-ent",
        "name": "Entropy of conditionally independent variables",
        "color": "#a9dcb8",
        "statement": "If $X, Y$ are conditionally independent over $Z$, then $$ \\bbH[X,Y,Z] =\\bbH[X,Z] + \\bbH[Y,Z] - \\bbH[Z].$$",
        "section": "Shannon entropy inequalities",
        "lean": "ProbabilityTheory.ent_of_cond_indep"
      },
      {
        "id": "multidist-ruzsa-III",
        "kind": "remark",
        "label": "multidist-ruzsa-III",
        "name": "Multidistance and Ruzsa distance, III",
        "color": "#a9dcb8",
        "statement": "Let $m \\ge 2$, and let $X_{[m]}$ be a tuple of $G$-valued random variables. If the $X_i$ all have the same distribution, then $D[X_{[m]}] \\leq m d[X_i;X_i]$ for any $1 \\leq i \\leq m$.",
        "section": "Multidistance",
        "lean": "multidist_ruzsa_III"
      },
      {
        "id": "ruzsa-diff",
        "kind": "remark",
        "label": "ruzsa-diff",
        "name": "Distance controls entropy difference",
        "color": "#a9dcb8",
        "statement": "If $X,Y$ are $G$-valued random variables, then $$|\\bbH[X]-H[Y]| \\leq 2 d[X ;Y].$$",
        "section": "Entropic Ruzsa calculus",
        "lean": "diff_ent_le_rdist"
      },
      {
        "id": "multidist-ruzsa-IV",
        "kind": "remark",
        "label": "multidist-ruzsa-IV",
        "name": "Multidistance and Ruzsa distance, IV",
        "color": "#a9dcb8",
        "statement": "Let $m \\ge 2$, and let $X_{[m]}$ be a tuple of independent $G$-valued random variables. Let $W := \\sum_{i=1}^m X_i$. Then $$ d[W;-W] \\leq 2 D[X_i].$$",
        "section": "Multidistance",
        "lean": "multidist_ruzsa_IV"
      },
      {
        "id": "multidist-nonneg",
        "kind": "remark",
        "label": "multidist-nonneg",
        "name": "Nonnegativity",
        "color": "#a9dcb8",
        "statement": "For any such tuple, we have $D[X_{[m]}] \\geq 0$.",
        "section": "Multidistance",
        "lean": "multiDist_nonneg"
      },
      {
        "id": "multidist-ruzsa-I",
        "kind": "remark",
        "label": "multidist-ruzsa-I",
        "name": "Multidistance and Ruzsa distance, I",
        "color": "#a9dcb8",
        "statement": "Let $m \\ge 2$, and let $X_{[m]}$ be a tuple of $G$-valued random variables. Then $$\\sum_{1 \\leq j,k \\leq m: j \\neq k} d[X_j; -X_k] \\leq m(m-1) D[X_{[m]}].$$",
        "section": "Multidistance",
        "lean": "multidist_ruzsa_I"
      },
      {
        "id": "compare-sums",
        "kind": "remark",
        "label": "compare-sums",
        "name": "Comparing sums",
        "color": "#a9dcb8",
        "statement": "Let $(X_i)_{1 \\leq i \\leq m}$ and $(Y_j)_{1 \\leq j \\leq l}$ be tuples of jointly independent random variables (so the $X$'s and $Y$'s are also independent of each other), and let $f: \\{1,\\dots,l\\} \\to \\{1,\\dots,m\\}$ be a function, then $$ \\bbH[\\sum_{j=1}^l Y_j] \\leq \\bbH[ \\sum_{i=1}^m X_i ] + \\sum_{j=1}^l (\\bbH[ Y_j - X_{f(j)}] - \\bbH[X_{f(j)}]).$$",
        "section": "More Ruzsa distance estimates",
        "lean": "ent_of_sum_le_ent_of_sum"
      },
      {
        "id": "ruzsa-growth",
        "kind": "remark",
        "label": "ruzsa-growth",
        "name": "Distance controls entropy growth",
        "color": "#a9dcb8",
        "statement": "If $X,Y$ are independent $G$-valued random variables, then $$ \\bbH[X-Y] - \\bbH[X], \\bbH[X-Y] - \\bbH[Y] \\leq 2d[X ;Y].$$",
        "section": "Entropic Ruzsa calculus",
        "lean": "diff_ent_le_rdist', diff_ent_le_rdist''"
      },
      {
        "id": "approx-hom-pfr",
        "kind": "remark",
        "label": "approx-hom-pfr",
        "name": "Approximate homomorphism form of PFR",
        "color": "#a9dcb8",
        "statement": "Let $G,G'$ be finite abelian $2$-groups. Let $f: G \\to G'$ be a function, and suppose that there are at least $|G|^2 / K$ pairs $(x,y) \\in G^2$ such that $$ f(x+y) = f(x) + f(y).$$ Then there exists a homomorphism $\\phi: G \\to G'$ and a constant $c \\in G'$ such that $f(x) = \\phi(x)+c$ for at least $|G| / (2 ^ {144} * K ^ {122})$ values of $x \\in G$.",
        "section": "Approximate homomorphism version of PFR",
        "lean": "approx_hom_pfr"
      },
      {
        "id": "hom-pfr",
        "kind": "remark",
        "label": "hom-pfr",
        "name": "Homomorphism form of PFR",
        "color": "#a9dcb8",
        "statement": "Let $f: G \\to G'$ be a function, and let $S$ denote the set $$ S := \\{ f(x+y)-f(x)-f(y): x,y \\in G \\}.$$ Then there exists a homomorphism $\\phi: G \\to G'$ such that $$ |\\{ f(x) - \\phi(x): x \\in G \\}| \\leq |S|^{10}.$$",
        "section": "Homomorphism version of PFR",
        "lean": "homomorphism_pfr"
      },
      {
        "id": "pfr-improv",
        "kind": "remark",
        "label": "pfr-improv",
        "name": "Improved PFR",
        "color": "#a9dcb8",
        "statement": "If $A \\subset {\\bf F}_2^n$ is non-empty and $|A+A| \\leq K|A|$, then $A$ can be covered by most $2K^{11}$ translates of a subspace $H$ of ${\\bf F}_2^n$ with $|H| \\leq |A|$.",
        "section": "Improving the exponents",
        "lean": "PFR_conjecture_improv"
      },
      {
        "id": "pfr-torsion",
        "kind": "remark",
        "label": "pfr-torsion",
        "name": "PFR",
        "color": "#a9dcb8",
        "statement": "Suppose that $G$ is a finite abelian group of torsion $m$. If $A \\subset G$ is non-empty and $|A+A| \\leq K|A|$, then $A$ can be covered by most $mK^{256m^3+1}$ translates of a subspace $H$ of $G$ with $|H| \\leq |A|$.",
        "section": "Wrapping up",
        "lean": "torsion_PFR"
      },
      {
        "id": "app-ent-pfr",
        "kind": "remark",
        "label": "app-ent-pfr",
        "name": "app ent pfr",
        "color": "#a9dcb8",
        "statement": "Let $G=\\mathbb{F}_2^n$ and $\\alpha\\in (0,1)$ and let $X,Y$ be $G$-valued random variables such that \\[\\mathbb{H}(X)+\\mathbb{H}(Y)> \\frac{20}{\\alpha} d[X;Y].\\] There is a non-trivial subgroup $H\\leq G$ such that \\[\\log \\lvert H\\rvert <\\frac{1+\\alpha}{2}(\\mathbb{H}(X)+\\mathbb{H}(Y))\\] and \\[\\mathbb{H}(\\psi(X))+\\mathbb{H}(\\psi(Y))< \\alpha (\\mathbb{H}(X)+\\mathbb{H}(Y))\\] where $\\psi:G\\to G/H$ is the natural projection homomorphism.",
        "section": "Weak PFR over the integers",
        "lean": "app_ent_PFR"
      },
      {
        "id": "cond-dist-fact",
        "kind": "remark",
        "label": "cond-dist-fact",
        "name": "Upper bound on conditioned Ruzsa distance",
        "color": "#a9dcb8",
        "statement": "Suppose that $(X, Z)$ and $(Y, W)$ are random variables, where $X, Y$ take values in an abelian group. Then \\[ d[X | Z;Y | W] \\leq d[X ; Y] + \\tfrac{1}{2} \\bbI[X : Z] + \\tfrac{1}{2} \\bbI[Y : W].\\] In particular, \\[ d[X ;Y | W] \\leq d[X ; Y] + \\tfrac{1}{2} \\bbI[Y : W].\\]",
        "section": "Entropic Ruzsa calculus",
        "lean": "condRuzsaDist_le, condRuzsaDist_le'"
      },
      {
        "id": "sumset-lower-gen",
        "kind": "remark",
        "label": "sumset-lower-gen",
        "name": "Lower bound of sumset",
        "color": "#a9dcb8",
        "statement": "If $X,Y$ are $G$-valued random variables on $\\Omega$, we have $$ \\max(\\bbH[X], \\bbH[Y]) - \\bbI[X:Y] \\leq \\bbH[X \\pm Y].$$",
        "section": "Entropic Ruzsa calculus",
        "lean": "ProbabilityTheory.max_entropy_sub_mutualInfo_le_entropy_add, ProbabilityTheory.max_entropy_sub_mutualInfo_le_entropy_sub"
      },
      {
        "id": "first-upper",
        "kind": "remark",
        "label": "first-upper",
        "name": "Upper bound on distance differences",
        "color": "#a9dcb8",
        "statement": "We have \\begin{align*} d[X^0_1; X_1+\\tilde X_2] - d[X^0_1; X_1] &\\leq \\tfrac{1}{2} k + \\tfrac{1}{4} \\bbH[X_2] - \\tfrac{1}{4} \\bbH[X_1]\\\\ d[X^0_2;X_2+\\tilde X_1] - d[X^0_2; X_2] &\\leq \\tfrac{1}{2} k + \\tfrac{1}{4} \\bbH[X_1] - \\tfrac{1}{4} \\bbH[X_2], \\\\ d[X_1^0;X_1|X_1+\\tilde X_2] - d[X_1^0;X_1] &\\leq \\tfrac{1}{2} k + \\tfrac{1}{4} \\bbH[X_1] - \\tfrac{1}{4} \\bbH[X_2] \\\\ d[X_2^0; X_2|X_2+\\tilde X_1] - d[X_2^0; X_2] &\\leq \\tfrac{1}{2}k + \\tfrac{1}{4} \\bbH[X_2] - \\tfrac{1}{4} \\bbH[X_1]. \\end{align*}",
        "section": "First estimate",
        "lean": "diff_rdist_le_1, diff_rdist_le_2, diff_rdist_le_3, diff_rdist_le_4"
      },
      {
        "id": "first-estimate",
        "kind": "remark",
        "label": "first-estimate",
        "name": "First estimate",
        "color": "#a9dcb8",
        "statement": "We have $I_1 \\leq 2 \\eta k$.",
        "section": "First estimate",
        "lean": "first_estimate"
      },
      {
        "id": "foursum-bound",
        "kind": "remark",
        "label": "foursum-bound",
        "name": "Entropy bound on quadruple sum",
        "color": "#a9dcb8",
        "statement": "With the same notation, we have \\begin{equation} \\bbH[X_1+X_2+\\tilde X_1+\\tilde X_2] \\le \\tfrac{1}{2} \\bbH[X_1]+\\tfrac{1}{2} \\bbH[X_2] + (2 + \\eta) k - I_1. \\end{equation}",
        "section": "First estimate",
        "lean": "ent_ofsum_le"
      },
      {
        "id": "de-prop",
        "kind": "remark",
        "label": "de-prop",
        "name": "$\\tau$-decrement",
        "color": "#a9dcb8",
        "statement": "Let $X_1, X_2$ be tau-minimizers. Then $d[X_1;X_2] = 0$.",
        "section": "Endgame",
        "lean": "tau_strictly_decreases"
      },
      {
        "id": "second-estimate-aux",
        "kind": "remark",
        "label": "second-estimate-aux",
        "name": "second estimate aux",
        "color": "#a9dcb8",
        "statement": "We have \\[d[X_1;X_1] + d[X_2;X_2] \\leq 2 k + \\frac{2(2 \\eta k - I_1)}{1-\\eta}. \\]",
        "section": "Second estimate",
        "lean": "second_estimate_aux"
      },
      {
        "id": "total-dist",
        "kind": "remark",
        "label": "total-dist",
        "name": "Bound on distance increments",
        "color": "#a9dcb8",
        "statement": "We have \\begin{align*} \\sum_{i=1}^2 \\sum_{A\\in\\{U,V,W\\}} \\big(d[X^0_i;A|S] & - d[X^0_i;X_i]\\big) \\\\ &\\leq (6 - 3\\eta) k + 3(2 \\eta k - I_1). \\end{align*}",
        "section": "Endgame",
        "lean": "sum_dist_diff_le"
      },
      {
        "id": "entropy-pfr",
        "kind": "remark",
        "label": "entropy-pfr",
        "name": "Entropy version of PFR",
        "color": "#a9dcb8",
        "statement": "Let $G = \\F_2^n$, and suppose that $X^0_1, X^0_2$ are $G$-valued random variables. Then there is some subgroup $H \\leq G$ such that \\[ d[X^0_1;U_H] + d[X^0_2;U_H] \\le 11 d[X^0_1;X^0_2], \\] where $U_H$ is uniformly distributed on $H$. Furthermore, both $d[X^0_1;U_H]$ and $d[X^0_2;U_H]$ are at most $6 d[X^0_1;X^0_2]$.",
        "section": "Conclusion",
        "lean": "entropic_PFR_conjecture"
      },
      {
        "id": "dist-diff-bound",
        "kind": "remark",
        "label": "dist-diff-bound",
        "name": "Bound on distance differences",
        "color": "#a9dcb8",
        "statement": "We have \\begin{align*} &\\sum_{i=1}^2 \\sum_{A,B \\in \\{U,V,W\\}: A \\neq B} d[X_i^0;A|B, S] - d[X_i^0;X_i]\\\\ &\\qquad \\leq 12 k + \\frac{4(2 \\eta k - I_1)}{1-\\eta}. \\end{align*}",
        "section": "Improving the exponents",
        "lean": "dist_diff_bound_1, dist_diff_bound_2"
      },
      {
        "id": "second-estimate",
        "kind": "remark",
        "label": "second-estimate",
        "name": "Second estimate",
        "color": "#a9dcb8",
        "statement": "We have $$ I_2 \\leq 2 \\eta k + \\frac{2 \\eta (2 \\eta k - I_1)}{1 - \\eta}.$$",
        "section": "Second estimate",
        "lean": "second_estimate"
      },
      {
        "id": "symm-lemma",
        "kind": "remark",
        "label": "symm-lemma",
        "name": "Symmetry identity",
        "color": "#a9dcb8",
        "statement": "We have $$ I(U:W | S) = I(V:W | S).$$",
        "section": "Endgame",
        "lean": "I₃_eq"
      },
      {
        "id": "uvw-s",
        "kind": "remark",
        "label": "uvw-s",
        "name": "Bound on conditional mutual informations",
        "color": "#a9dcb8",
        "statement": "We have $$ I(U : V \\, | \\, S) + I(V : W \\, | \\,S) + I(W : U \\, | \\, S) \\leq 6 \\eta k - \\frac{1 - 5 \\eta}{1-\\eta} (2 \\eta k - I_1). $$",
        "section": "Endgame",
        "lean": "I₃_eq, sum_condMutual_le"
      },
      {
        "id": "de-prop-improv",
        "kind": "remark",
        "label": "de-prop-improv",
        "name": "Improved $\\tau$-decrement",
        "color": "#a9dcb8",
        "statement": "Suppose $0 < \\eta < 1/8$. Let $X_1, X_2$ be tau-minimizers. Then $d[X_1;X_2] = 0$.",
        "section": "Improving the exponents",
        "lean": "tau_strictly_decreases'"
      },
      {
        "id": "de-prop-lim-improv",
        "kind": "remark",
        "label": "de-prop-lim-improv",
        "name": "Limiting improved $\\tau$-decrement",
        "color": "#a9dcb8",
        "statement": "For $\\eta = 1/8$, there exist tau-minimizers $X_1, X_2$ satisfying $d[X_1;X_2] = 0$.",
        "section": "Improving the exponents",
        "lean": "tau_minimizer_exists_rdist_eq_zero"
      },
      {
        "id": "key-ident",
        "kind": "remark",
        "label": "key-ident",
        "name": "Key identity",
        "color": "#a9dcb8",
        "statement": "We have $U+V+W=0$.",
        "section": "Endgame",
        "lean": "sum_uvw_eq_zero"
      },
      {
        "id": "averaged-construct-good",
        "kind": "remark",
        "label": "averaged-construct-good",
        "name": "Constructing good variables, III'",
        "color": "#a9dcb8",
        "statement": "One has \\begin{align*} k & \\leq I(U : V \\, | \\, S) + I(V : W \\, | \\,S) + I(W : U \\, | \\, S) + \\frac{\\eta}{6} \\sum_{i=1}^2 \\sum_{A,B \\in \\{U,V,W\\}: A \\neq B} (d[X^0_i;A|B,S] - d[X^0_i; X_i]). \\end{align*}",
        "section": "Improving the exponents",
        "lean": "averaged_construct_good"
      },
      {
        "id": "entropy-pfr-improv",
        "kind": "remark",
        "label": "entropy-pfr-improv",
        "name": "Improved entropy version of PFR",
        "color": "#a9dcb8",
        "statement": "Let $G = \\F_2^n$, and suppose that $X^0_1, X^0_2$ are $G$-valued random variables. Then there is some subgroup $H \\leq G$ such that \\[ d[X^0_1;U_H] + d[X^0_2;U_H] \\le 10 d[X^0_1;X^0_2], \\] where $U_H$ is uniformly distributed on $H$. Furthermore, both $d[X^0_1;U_H]$ and $d[X^0_2;U_H]$ are at most $6 d[X^0_1;X^0_2]$.",
        "section": "Improving the exponents",
        "lean": "entropic_PFR_conjecture_improv"
      },
      {
        "id": "pfr-projection'",
        "kind": "remark",
        "label": "pfr-projection'",
        "name": "pfr projection'",
        "color": "#a9dcb8",
        "statement": "If $G=\\mathbb{F}_2^d$ and $\\alpha\\in (0,1)$ and $X,Y$ are $G$-valued random variables then there is a subgroup $H\\leq \\mathbb{F}_2^d$ such that \\[\\log \\lvert H\\rvert \\leq \\frac{1+\\alpha}{2(1-\\alpha)} (\\mathbb{H}(X)+\\mathbb{H}(Y))\\] and if $\\psi:G \\to G/H$ is the natural projection then \\[\\mathbb{H}(\\psi(X))+\\mathbb{H}(\\psi(Y))\\leq \\frac{20}{\\alpha} d[\\psi(X);\\psi(Y)].\\]",
        "section": "Weak PFR over the integers",
        "lean": "PFR_projection'"
      },
      {
        "id": "pfr-projection",
        "kind": "remark",
        "label": "pfr-projection",
        "name": "pfr projection",
        "color": "#a9dcb8",
        "statement": "If $G=\\mathbb{F}_2^d$ and $\\alpha\\in (0,1)$ and $X,Y$ are $G$-valued random variables then there is a subgroup $H\\leq \\mathbb{F}_2^d$ such that \\[\\log \\lvert H\\rvert \\leq 2 (\\mathbb{H}(X)+\\mathbb{H}(Y))\\] and if $\\psi:G \\to G/H$ is the natural projection then \\[\\mathbb{H}(\\psi(X))+\\mathbb{H}(\\psi(Y))\\leq 34 d[\\psi(X);\\psi(Y)].\\]",
        "section": "Weak PFR over the integers",
        "lean": "PFR_projection"
      },
      {
        "id": "weak-pfr-asymm",
        "kind": "remark",
        "label": "weak-pfr-asymm",
        "name": "weak pfr asymm",
        "color": "#a9dcb8",
        "statement": "If $A,B\\subseteq \\mathbb{Z}^d$ are finite non-empty sets then there exist non-empty $A'\\subseteq A$ and $B'\\subseteq B$ such that \\[\\log\\frac{\\lvert A\\rvert\\lvert B\\rvert}{\\lvert A'\\rvert\\lvert B'\\rvert}\\leq 34d[U_A;U_B]\\] such that $\\max(\\dim A',\\dim B')\\leq \\frac{40}{\\log 2} d[U_A;U_B]$.",
        "section": "Weak PFR over the integers",
        "lean": "weak_PFR_asymm"
      },
      {
        "id": "Conditional-Gibbs",
        "kind": "remark",
        "label": "Conditional-Gibbs",
        "name": "Conditional Gibbs inequality",
        "color": "#a9dcb8",
        "statement": "$D_{KL}((X|W)\\Vert Y) \\geq 0$.",
        "section": "Kullback–Leibler divergence",
        "lean": "condKLDiv_nonneg"
      },
      {
        "id": "rho-cond-sym",
        "kind": "remark",
        "label": "rho-cond-sym",
        "name": "Rho and conditioning, symmetrized",
        "color": "#a9dcb8",
        "statement": "If $X,Y$ are independent, then $$ \\rho(X | X+Y) \\leq \\frac{1}{2}(\\rho(X)+\\rho(Y) + d[X;Y]).$$",
        "section": "Rho functionals",
        "lean": "condRho_of_sum_le"
      },
      {
        "id": "rho-increase",
        "kind": "remark",
        "label": "rho-increase",
        "name": "rho increase",
        "color": "#a9dcb8",
        "statement": "For independent random variables $Y_1,Y_2,Y_3,Y_4$ over $G$, define $S:=Y_1+Y_2+Y_3+Y_4$, $T_1:=Y_1+Y_2$, $T_2:=Y_1+Y_3$. Then $$\\rho(T_1|T_2,S)+\\rho(T_2|T_1,S) - \\frac{1}{2}\\sum_{i} \\rho(Y_i)\\le \\frac{1}{2}(d[Y_1;Y_2]+d[Y_3;Y_4]+d[Y_1;Y_3]+d[Y_2;Y_4]).$$",
        "section": "Studying a minimizer",
        "lean": "condRho_sum_le"
      },
      {
        "id": "rho-increase-symmetrized",
        "kind": "remark",
        "label": "rho-increase-symmetrized",
        "name": "rho increase symmetrized",
        "color": "#a9dcb8",
        "statement": "For independent random variables $Y_1,Y_2,Y_3,Y_4$ over $G$, define $T_1:=Y_1+Y_2,T_2:=Y_1+Y_3,T_3:=Y_2+Y_3$ and $S:=Y_1+Y_2+Y_3+Y_4$. Then $$\\sum_{1 \\leq i<j \\leq 3} (\\rho(T_i|T_j,S) + \\rho(T_j|T_i,S) - \\frac{1}{2}\\sum_{i} \\rho(Y_i))\\le \\sum_{1\\leq i < j \\leq 4}d[Y_i;Y_j]$$",
        "section": "Studying a minimizer",
        "lean": "condRho_sum_le'"
      },
      {
        "id": "phi-minimizer-zero-distance",
        "kind": "remark",
        "label": "phi-minimizer-zero-distance",
        "name": "phi minimizer zero distance",
        "color": "#a9dcb8",
        "statement": "If $X_1,X_2$ is a $\\phi$-minimizer, then $d[X_1;X_2] = 0$.",
        "section": "Studying a minimizer",
        "lean": "dist_of_min_eq_zero"
      },
      {
        "id": "uniform-entropy-II",
        "kind": "remark",
        "label": "uniform-entropy-II",
        "name": "Entropy of uniform random variable, II",
        "color": "#a9dcb8",
        "statement": "If $X$ is uniformly distributed on $H$, then, then $\\bbH[X] = \\log |H|$.",
        "section": "Shannon entropy inequalities",
        "lean": "ProbabilityTheory.IsUniform.entropy_eq"
      },
      {
        "id": "approx-hom-pfr-no-const",
        "kind": "remark",
        "label": "approx-hom-pfr-no-const",
        "name": "Approximate homomorphism form of PFR, no constant term",
        "color": "#a9dcb8",
        "statement": "Let $G,G'$ be finite abelian $2$-groups. Let $f: G \\to G'$ be a function, and suppose that there are at least $|G|^2 / K$ pairs $(x,y) \\in G^2$ such that $$ f(x+y) = f(x) + f(y).$$ Then there exists a homomorphism $\\phi'': G \\to G'$ such that $f(x) = \\phi''(x)$ for at least $(|G| / (2 ^ {172} * K ^ {146}) - 1)/2$ values of $x \\in G$.",
        "section": "Approximate homomorphism version of PFR",
        "lean": "approx_hom_pfr'"
      },
      {
        "id": "pfr-cor",
        "kind": "remark",
        "label": "pfr-cor",
        "name": "PFR in infinite groups",
        "color": "#a9dcb8",
        "statement": "If $G$ is an abelian $2$-torsion group, $A \\subset G$ is non-empty finite, and $|A+A| \\leq K|A| $, then $A$ can be covered by most $2K^{12}$ translates of a finite group $H$ of $G$ with $|H| \\leq |A|$.",
        "section": "Proof of PFR",
        "lean": "PFR_conjecture'"
      },
      {
        "id": "first-fibre",
        "kind": "remark",
        "label": "first-fibre",
        "name": "Fibring identity for first estimate",
        "color": "#a9dcb8",
        "statement": "We have \\begin{align*} & d[X_1+\\tilde X_2;X_2+\\tilde X_1] + d[X_1|X_1+\\tilde X_2; X_2|X_2+\\tilde X_1] \\\\ &\\quad + \\bbI[X_1+ X_2 : \\tilde X_1 + X_2 \\,|\\, X_1 + X_2 + \\tilde X_1 + \\tilde X_2] = 2k. \\end{align*}",
        "section": "First estimate",
        "lean": "rdist_add_rdist_add_condMutual_eq"
      },
      {
        "id": "gen-ineq",
        "kind": "remark",
        "label": "gen-ineq",
        "name": "General inequality",
        "color": "#a9dcb8",
        "statement": "Let $X_1, X_2, X_3, X_4$ be independent $G$-valued random variables, and let $Y$ be another $G$-valued random variable. Set $S := X_1+X_2+X_3+X_4$. Then \\begin{align*} & d[Y; X_1+X_2|X_1 + X_3, S] - d[Y; X_1] \\\\ &\\quad \\leq \\tfrac{1}{4} (d[X_1;X_2] + 2d[X_1;X_3] + d[X_2;X_4])\\\\ &\\qquad \\qquad + \\tfrac{1}{4} (d[X_1|X_1+X_3;X_2|X_2+X_4] - d[X_3|X_3+X_4; X_1|X_1+X_2])\\\\ &\\qquad \\qquad + \\tfrac{1}{8} (\\bbH[X_1+X_2] - \\bbH[X_3+X_4] + \\bbH[X_2] - \\bbH[X_3]\\\\ &\\qquad \\qquad \\qquad + \\bbH[X_2|X_2+X_4] - \\bbH[X_1|X_1+X_3]). \\end{align*}",
        "section": "Improving the exponents",
        "lean": "gen_ineq_00"
      },
      {
        "id": "construct-good-prelim",
        "kind": "remark",
        "label": "construct-good-prelim",
        "name": "Constructing good variables, I",
        "color": "#a9dcb8",
        "statement": "One has \\begin{align*} k \\leq \\delta + \\eta (& d[X^0_1;T_1]-d[X^0_1;X_1]) + \\eta (d[X^0_2;T_2]-d[X^0_2;X_2]) \\\\ & + \\tfrac12 \\eta \\bbI[T_1:T_3] + \\tfrac12 \\eta \\bbI[T_2:T_3]. \\end{align*}",
        "section": "Endgame",
        "lean": "construct_good_prelim"
      },
      {
        "id": "construct-good-prelim-improv",
        "kind": "remark",
        "label": "construct-good-prelim-improv",
        "name": "Constructing good variables, I'",
        "color": "#a9dcb8",
        "statement": "One has \\begin{align*} k \\leq \\delta + \\eta (& d[X^0_1;T_1|T_3]-d[X^0_1;X_1]) + \\eta (d[X^0_2;T_2|T_3]-d[X^0_2;X_2]). \\end{align*}",
        "section": "Improving the exponents",
        "lean": "construct_good_prelim'"
      },
      {
        "id": "lem:get-better",
        "kind": "lemma",
        "label": "get-better",
        "name": "Application of BSG",
        "color": "#a9dcb8",
        "statement": "Let $G$ be an abelian group, let $(T_1,T_2,T_3)$ be a $G^3$-valued random variable such that $T_1+T_2+T_3=0$ holds identically, and write \\[ \\delta := \\bbI[T_1 : T_2] + \\bbI[T_1 : T_3] + \\bbI[T_2 : T_3]. \\] Let $Y_1,\\dots,Y_n$ be some further $G$-valued random variables and let $\\alpha>0$ be a constant. Then there exists a random variable $U$ such that \\begin{equation} d[U;U] + \\alpha \\sum_{i=1}^n d[Y_i;U] \\leq \\Bigl(2 + \\frac{\\alpha n}{2} \\Bigr) \\delta + \\alpha \\sum_{i=1}^n d[Y_i;T_2]. \\end{equation}",
        "section": "Endgame",
        "lean": "dist_of_U_add_le"
      },
      {
        "id": "rho-BSG-triplet",
        "kind": "remark",
        "label": "rho-BSG-triplet",
        "name": "rho BSG triplet",
        "color": "#a9dcb8",
        "statement": "If $G$-valued random variables $T_1,T_2,T_3$ satisfy $T_1+T_2+T_3=0$, then $$d[X_1;X_2]\\le 3\\bbI[T_1:T_2] + (2\\bbH[T_3]-\\bbH[T_1]-\\bbH[T_2])+ \\eta(\\rho(T_1|T_3)+\\rho(T_2|T_3)-\\rho(X_1)-\\rho(X_2)).$$",
        "section": "Studying a minimizer",
        "lean": "dist_le_of_sum_zero"
      },
      {
        "id": "sum-dilate-II",
        "kind": "remark",
        "label": "sum-dilate-II",
        "name": "Sums of dilates II",
        "color": "#a9dcb8",
        "statement": "Let $X,Y$ be independent $G$-valued random variables, and let $a$ be an integer. Then $$\\bbH[X-aY] - \\bbH[X] \\leq 4 |a| d[X;Y].$$",
        "section": "More Ruzsa distance estimates",
        "lean": "ent_sub_zsmul_sub_ent_le"
      },
      {
        "id": "first-useful",
        "kind": "remark",
        "label": "first-useful",
        "name": "Comparison of Ruzsa distances, I",
        "color": "#a9dcb8",
        "statement": "Let $X, Y, Z$ be random variables taking values in some abelian group of characteristic $2$, and with $Y, Z$ independent. Then we have \\begin{align}\\nonumber d[X ; Y + Z] -d[X ; Y] & \\leq \\tfrac{1}{2} (\\bbH[Y+ Z] - \\bbH[Y]) \\\\ & = \\tfrac{1}{2} d[Y; Z] + \\tfrac{1}{4} \\bbH[Z] - \\tfrac{1}{4} \\bbH[Y]. \\end{align} and \\begin{align}\\nonumber d[X ;Y|Y+ Z] - d[X ;Y] & \\leq \\tfrac{1}{2} \\bigl(\\bbH[Y+ Z] - \\bbH[Z]\\bigr) \\\\ & = \\tfrac{1}{2} d[Y;Z] + \\tfrac{1}{4} \\bbH[Y] - \\tfrac{1}{4} \\bbH[Z]. \\end{align}",
        "section": "Entropic Ruzsa calculus",
        "lean": "condRuzsaDist_diff_le, condRuzsaDist_diff_le', condRuzsaDist_diff_le'', condRuzsaDist_diff_le'''"
      },
      {
        "id": "klm-3",
        "kind": "remark",
        "label": "klm-3",
        "name": "Kaimonovich–Vershik–Madiman inequality, III",
        "color": "#a9dcb8",
        "statement": "If $n \\geq 1$ and $X, Y_1, \\dots, Y_n$ are jointly independent $G$-valued random variables, then $$d\\left[X; \\sum_{i=1}^n Y_i\\right] \\leq d\\left[X; Y_1\\right] + \\frac{1}{2}\\left(\\bbH\\left[ \\sum_{i=1}^n Y_i\\right] - \\bbH[Y_1]\\right).$$",
        "section": "More Ruzsa distance estimates",
        "lean": "kvm_ineq_III"
      },
      {
        "id": "klm-1",
        "kind": "remark",
        "label": "klm-1",
        "name": "Kaimonovich–Vershik–Madiman inequality",
        "color": "#a9dcb8",
        "statement": "If $n \\geq 0$ and $X, Y_1, \\dots, Y_n$ are jointly independent $G$-valued random variables, then $$\\bbH\\left[X + \\sum_{i=1}^n Y_i\\right] - \\bbH[X] \\leq \\sum_{i=1}^n \\left(\\bbH[X+Y_i] - \\bbH[X]\\right).$$",
        "section": "More Ruzsa distance estimates",
        "lean": "kvm_ineq_I"
      },
      {
        "id": "sum-dilate-I",
        "kind": "remark",
        "label": "sum-dilate-I",
        "name": "Sums of dilates I",
        "color": "#a9dcb8",
        "statement": "Let $X,Y,X'$ be independent $G$-valued random variables, with $X'$ a copy of $X$, and let $a$ be an integer. Then $$\\bbH[X-(a+1)Y] \\leq \\bbH[X-aY] + \\bbH[X-Y-X'] - \\bbH[X]$$ and $$\\bbH[X-(a-1)Y] \\leq \\bbH[X-aY] + \\bbH[X-Y-X'] - \\bbH[X].$$",
        "section": "More Ruzsa distance estimates",
        "lean": "ent_sub_nsmul_le, ent_of_sub_smul'"
      },
      {
        "id": "ruzsa-triangle",
        "kind": "remark",
        "label": "ruzsa-triangle",
        "name": "Ruzsa triangle inequality",
        "color": "#a9dcb8",
        "statement": "If $X,Y,Z$ are $G$-valued random variables, then $$ d[X ;Y] \\leq d[X ;Z] + d[Z;Y].$$",
        "section": "Entropic Ruzsa calculus",
        "lean": "rdist_triangle"
      },
      {
        "id": "pfr-rho",
        "kind": "remark",
        "label": "pfr-rho",
        "name": "pfr rho",
        "color": "#a9dcb8",
        "statement": "For any random variables $Y_1,Y_2$, there exist a subgroup $H$ such that $$ 2\\rho(U_H) \\leq \\rho(Y_1) + \\rho(Y_2) + 8 d[Y_1;Y_2].$$",
        "section": "Studying a minimizer",
        "lean": "rho_PFR_conjecture"
      },
      {
        "id": "lem:100pc-self",
        "kind": "lemma",
        "label": "100pc-self",
        "name": "Symmetric 100\\% inverse theorem",
        "color": "#a9dcb8",
        "statement": "Suppose that $X$ is a $G$-valued random variable such that $d[X ;X]=0$. Then there exists a subgroup $H \\leq G$ such that $d[X ;U_H] = 0$.",
        "section": "The 100\\% version of PFR",
        "lean": "exists_isUniform_of_rdist_self_eq_zero"
      },
      {
        "id": "k-vanish",
        "kind": "remark",
        "label": "k-vanish",
        "name": "Vanishing entropy",
        "color": "#a9dcb8",
        "statement": "We have $k = 0$.",
        "section": "Endgame",
        "lean": "k_eq_zero"
      },
      {
        "id": "tau-ref",
        "kind": "remark",
        "label": "tau-ref",
        "name": "Minimizer close to reference variables",
        "color": "#a9dcb8",
        "statement": "If $(X_i)_{1 \\leq i \\leq m}$ is a $\\tau$-minimizer, then $\\sum_{i=1}^m d[X_i; X^0] \\leq \\frac{2m}{\\eta} d[X^0; X^0]$.",
        "section": "The tau functional",
        "lean": "multiTau_min_sum_le"
      },
      {
        "id": "klm-2",
        "kind": "remark",
        "label": "klm-2",
        "name": "Kaimonovich–Vershik–Madiman inequality, II",
        "color": "#a9dcb8",
        "statement": "If $n \\geq 1$ and $X, Y_1, \\dots, Y_n$ are jointly independent $G$-valued random variables, then $$ d[X; \\sum_{i=1}^n Y_i] \\leq 2 \\sum_{i=1}^n d[X; Y_i].$$",
        "section": "More Ruzsa distance estimates",
        "lean": "kvm_ineq_II"
      },
      {
        "id": "torsion-free-doubling",
        "kind": "remark",
        "label": "torsion-free-doubling",
        "name": "torsion free doubling",
        "color": "#a9dcb8",
        "statement": "If $G$ is torsion-free and $X,Y$ are $G$-valued random variables then $d[X;2Y]\\leq 5d[X;Y]$.",
        "section": "Weak PFR over the integers",
        "lean": "torsion_free_doubling"
      },
      {
        "id": "ruzsa-nonneg",
        "kind": "remark",
        "label": "ruzsa-nonneg",
        "name": "Distance nonnegative",
        "color": "#a9dcb8",
        "statement": "If $X,Y$ are $G$-valued random variables, then $$ d[X ;Y] \\geq 0.$$",
        "section": "Entropic Ruzsa calculus",
        "lean": "rdist_nonneg"
      },
      {
        "id": "ent-w",
        "kind": "remark",
        "label": "ent-w",
        "name": "Entropy of $W$",
        "color": "#a9dcb8",
        "statement": "We have $\\bbH[W] \\leq (2m-1)k + \\frac1m \\sum_{i=1}^m \\bbH[X_i]$.",
        "section": "Endgame",
        "lean": "entropy_of_W_le"
      },
      {
        "id": "cond-multidist-nonneg",
        "kind": "remark",
        "label": "cond-multidist-nonneg",
        "name": "Conditional multidistance nonnegative",
        "color": "#a9dcb8",
        "statement": "If $X_{[m]} = (X_i)_{1 \\leq i \\leq m}$ and $Y_{[m]} = (Y_i)_{1 \\leq i \\leq m}$ are tuples of random variables, then $D[ X_{[m]} | Y_{[m]} ] \\geq 0$.",
        "section": "The tau functional",
        "lean": "condMultiDist_nonneg"
      },
      {
        "id": "multidist-ruzsa-II",
        "kind": "remark",
        "label": "multidist-ruzsa-II",
        "name": "Multidistance and Ruzsa distance, II",
        "color": "#a9dcb8",
        "statement": "Let $m \\ge 2$, and let $X_{[m]}$ be a tuple of $G$-valued random variables. Then $$\\sum_{j=1}^m d[X_j;X_j] \\leq 2 m D[X_{[m]}].$$",
        "section": "Multidistance",
        "lean": "multidist_ruzsa_II"
      },
      {
        "id": "multi-zero",
        "kind": "remark",
        "label": "multi-zero",
        "name": "Vanishing",
        "color": "#a9dcb8",
        "statement": "If $D[X_{[m]}]=0$, then for each $1 \\leq i \\leq m$ there is a finite subgroup $H_i \\leq G$ such that $d[X_i; U_{H_i}] = 0$.",
        "section": "Multidistance",
        "lean": "multidist_eq_zero"
      },
      {
        "id": "multidist-perm",
        "kind": "remark",
        "label": "multidist-perm",
        "name": "Relabeling",
        "color": "#a9dcb8",
        "statement": "If $\\phi: \\{1,\\dots,m\\} \\to \\{1,\\dots,m\\}$ is a bijection, then $D[X_{[m]}] = D[(X_{\\phi(j)})_{1 \\leq j \\leq m}]$.",
        "section": "Multidistance",
        "lean": "multiDist_of_perm"
      },
      {
        "id": "cond-multidist-lower-II",
        "kind": "remark",
        "label": "cond-multidist-lower-II",
        "name": "Lower bound on conditional multidistance, II",
        "color": "#a9dcb8",
        "statement": "With the notation of the previous lemma, we have \\begin{equation} k - D[ X'_{[m]} | Y_{[m]} ] \\leq \\eta \\sum_{i=1}^m d[X_{\\sigma(i)};X'_i|Y_i] \\end{equation} for any permutation $\\sigma : \\{1,\\dots,m\\} \\rightarrow \\{1,\\dots,m\\}$.",
        "section": "The tau functional",
        "lean": "sub_condMultiDistance_le'"
      },
      {
        "id": "prop:52",
        "kind": "proposition",
        "label": "52",
        "name": "Mutual information bound",
        "color": "#a9dcb8",
        "statement": "We have \\[ \\bbI[Z_1 : Z_2\\, |\\, W],\\ \\bbI[Z_2 : Z_3\\, |\\, W],\\ \\bbI[Z_1 : Z_3\\, |\\, W] \\leq t \\] where \\begin{equation} t := m(4m+1) \\eta k. \\end{equation}",
        "section": "Endgame",
        "lean": "mutual_information_le_t_12, mutual_information_le_t_13, mutual_information_le_t_23"
      },
      {
        "id": "xi-z2-w-dist",
        "kind": "remark",
        "label": "xi-z2-w-dist",
        "name": "Distance bound",
        "color": "#a9dcb8",
        "statement": "We have $\\sum_{i=1}^m d[X_i;Z_2|W] \\leq 4(m^3-m^2) k$.",
        "section": "Endgame",
        "lean": "sum_of_conditional_distance_le"
      },
      {
        "id": "main-entropy",
        "kind": "remark",
        "label": "main-entropy",
        "name": "Entropy form of PFR",
        "color": "#a9dcb8",
        "statement": "Suppose that $G$ is a finite abelian group of torsion $m$. Suppose that $X$ is a $G$-valued random variable. Then there exists a subgroup $H \\leq G$ such that \\[ d[X;U_H] \\leq 64 m^3 d[X;X].\\]",
        "section": "Wrapping up",
        "lean": "dist_of_X_U_H_le"
      },
      {
        "id": "I1-I2-diff",
        "kind": "remark",
        "label": "I1-I2-diff",
        "name": "I1 I2 diff",
        "color": "#a9dcb8",
        "statement": "$d[X_1;X_1]+d[X_2;X_2]= 2d[X_1;X_2]+(I_2-I_1)$.",
        "section": "Studying a minimizer",
        "lean": "rdist_add_rdist_eq"
      },
      {
        "id": "phi-first-estimate",
        "kind": "remark",
        "label": "phi-first-estimate",
        "name": "phi first estimate",
        "color": "#a9dcb8",
        "statement": "$I_1\\le 2\\eta d[X_1;X_2]$",
        "section": "Studying a minimizer",
        "lean": "I_one_le"
      },
      {
        "id": "phi-second-estimate",
        "kind": "remark",
        "label": "phi-second-estimate",
        "name": "phi second estimate",
        "color": "#a9dcb8",
        "statement": "$I_2\\le 2\\eta d[X_1;X_2] + \\frac{\\eta}{1-\\eta}(2\\eta d[X_1;X_2]-I_1)$.",
        "section": "Studying a minimizer",
        "lean": "I_two_le"
      },
      {
        "id": "eta-def-new",
        "kind": "remark",
        "label": "eta-def-new",
        "name": "New definition of $\\eta$",
        "color": "#e0f3d7",
        "statement": "$\\eta$ is a real parameter with $\\eta > 0$.",
        "section": "Improving the exponents"
      },
      {
        "id": "rhominus-def",
        "kind": "remark",
        "label": "rhominus-def",
        "name": "Rho minus",
        "color": "#e0f3d7",
        "statement": "For any $G$-valued random variable $X$, we define $\\rho^-(X)$ to be the infimum of $D_{KL}(X \\Vert U_A + T)$, where $U_A$ is uniform on $A$ and $T$ ranges over $G$-valued random variables independent of $U_A$.",
        "section": "Rho functionals",
        "lean": "rhoMinus"
      },
      {
        "id": "rhoplus-def",
        "kind": "remark",
        "label": "rhoplus-def",
        "name": "Rho plus",
        "color": "#e0f3d7",
        "statement": "For any $G$-valued random variable $X$, we define $\\rho^+(X) := \\rho^-(X) + \\bbH(X) - \\bbH(U_A)$.",
        "section": "Rho functionals",
        "lean": "rhoPlus"
      },
      {
        "id": "rhominus-subgroup",
        "kind": "remark",
        "label": "rhominus-subgroup",
        "name": "Rho minus of subgroup",
        "color": "#a9dcb8",
        "statement": "If $H$ is a finite subgroup of $G$, then $\\rho^-(U_H) = \\log |A| - \\log \\max_t |A \\cap (H+t)|$.",
        "section": "Rho functionals",
        "lean": "rhoMinus_of_subgroup"
      },
      {
        "id": "rho-def",
        "kind": "remark",
        "label": "rho-def",
        "name": "Rho functional",
        "color": "#e0f3d7",
        "statement": "We define $\\rho(X) := (\\rho^+(X) + \\rho^-(X))/2$.",
        "section": "Rho functionals",
        "lean": "rho"
      },
      {
        "id": "rhoplus-subgroup",
        "kind": "remark",
        "label": "rhoplus-subgroup",
        "name": "Rho plus of subgroup",
        "color": "#a9dcb8",
        "statement": "If $H$ is a finite subgroup of $G$, then $\\rho^+(U_H) = \\log |H| - \\log \\max_t |A \\cap (H+t)|$.",
        "section": "Rho functionals",
        "lean": "rhoPlus_of_subgroup"
      },
      {
        "id": "rho-subgroup",
        "kind": "remark",
        "label": "rho-subgroup",
        "name": "Rho of subgroup",
        "color": "#a9dcb8",
        "statement": "If $H$ is a finite subgroup of $G$, and $\\rho(U_H) \\leq r$, then there exists $t$ such that $|A \\cap (H+t)| \\geq e^{-r} \\sqrt{|A||H|}$, and $|H|/|A|\\in[e^{-2r},e^{2r}]$.",
        "section": "Rho functionals",
        "lean": "rho_of_subgroup"
      },
      {
        "id": "rho-cts",
        "kind": "remark",
        "label": "rho-cts",
        "name": "Rho continuous",
        "color": "#a9dcb8",
        "statement": "$\\rho(X)$ depends continuously on the distribution of $X$.",
        "section": "Rho functionals",
        "lean": "rho_continuous"
      },
      {
        "id": "rho-invariant",
        "kind": "remark",
        "label": "rho-invariant",
        "name": "Rho invariant",
        "color": "#a9dcb8",
        "statement": "For any $s \\in G$, $\\rho(X+s) = \\rho(X)$.",
        "section": "Rho functionals",
        "lean": "rho_of_translate"
      },
      {
        "id": "pfr-9-aux",
        "kind": "remark",
        "label": "pfr-9-aux",
        "name": "pfr 9 aux",
        "color": "#a9dcb8",
        "statement": "If $|A+A| \\leq K|A|$, then there exists a subgroup $H$ and $t\\in G$ such that $|A \\cap (H+t)| \\geq K^{-4} \\sqrt{|A||H|}$, and $|H|/|A|\\in[K^{-8},K^8]$.",
        "section": "Studying a minimizer",
        "lean": "better_PFR_conjecture_aux0"
      },
      {
        "id": "conditional-mutual-alt",
        "kind": "remark",
        "label": "conditional-mutual-alt",
        "name": "Alternate formula for conditional mutual information",
        "color": "#a9dcb8",
        "statement": "We have $$ \\bbI[X:Y|Z] := \\bbH[X|Z] + \\bbH[Y|Z] - \\bbH[X,Y|Z]$$ and $$ \\bbI[X:Y|Z] := \\bbH[X|Z] - \\bbH[X|Y,Z].$$",
        "section": "Shannon entropy inequalities",
        "lean": "ProbabilityTheory.condMutualInfo_eq, ProbabilityTheory.condMutualInfo_eq'"
      },
      {
        "id": "fibring-ident",
        "kind": "remark",
        "label": "fibring-ident",
        "name": "General fibring identity",
        "color": "#a9dcb8",
        "statement": "Let $\\pi : H \\to H'$ be a homomorphism additive groups, and let $Z_1,Z_2$ be $H$-valued random variables. Then we have \\[ d[Z_1; Z_2] \\geq d[\\pi(Z_1);\\pi(Z_2)] + d[Z_1|\\pi(Z_1); Z_2 |\\pi(Z_2)]. \\] Moreover, if $Z_1,Z_2$ are taken to be independent, then the difference between the two sides is $$I( Z_1 - Z_2 : (\\pi(Z_1), \\pi(Z_2)) | \\pi(Z_1 - Z_2) ).$$",
        "section": "The Fibring lemma",
        "lean": "rdist_of_indep_eq_sum_fibre, rdist_le_sum_fibre"
      },
      {
        "id": "multidist-chain-rule",
        "kind": "remark",
        "label": "multidist-chain-rule",
        "name": "Multidistance chain rule",
        "color": "#a9dcb8",
        "statement": "Let $\\pi \\colon G \\to H$ be a homomorphism of abelian groups and let $X_{[m]}$ be a tuple of jointly independent $G$-valued random variables. Then $D[X_{[m]}]$ is equal to \\begin{equation} D[ X_{[m]} | \\pi(X_{[m]}) ] +D[ \\pi(X_{[m]}) ] + \\bbI[ \\sum_{i=1}^m X_i : \\pi(X_{[m]}) \\; \\big| \\; \\pi\\bigl(\\sum_{i=1}^m X_i\\bigr) ] \\end{equation} where $\\pi(X_{[m]}) := (\\pi(X_i))_{1 \\leq i \\leq m}$.",
        "section": "The multidistance chain rule",
        "lean": "multiDist_chainRule"
      },
      {
        "id": "fibring-ineq",
        "kind": "remark",
        "label": "fibring-ineq",
        "name": "fibring ineq",
        "color": "#a9dcb8",
        "statement": "If $\\pi:G\\to H$ is a homomorphism of additive groups and $X,Y$ are $G$-valued random variables then \\[d[X;Y]\\geq d[\\pi(X);\\pi(Y)].\\]",
        "section": "The Fibring lemma",
        "lean": "rdist_of_hom_le"
      },
      {
        "id": "single-fibres",
        "kind": "remark",
        "label": "single-fibres",
        "name": "single fibres",
        "color": "#a9dcb8",
        "statement": "Let $\\phi:G\\to H$ be a homomorphism and $A,B\\subseteq G$ be finite subsets. If $x,y\\in H$ then let $A_x=A\\cap \\phi^{-1}(x)$ and $B_y=B\\cap \\phi^{-1}(y)$. There exist $x,y\\in H$ such that $A_x,B_y$ are both non-empty and \\[d[\\phi(U_A);\\phi(U_B)]\\log \\frac{\\lvert A\\rvert\\lvert B\\rvert}{\\lvert A_x\\rvert\\lvert B_y\\rvert}\\leq (\\mathbb{H}(\\phi(U_A))+\\mathbb{H}(\\phi(U_B)))(d(U_A,U_B)-d(U_{A_x},U_{B_y})).\\]",
        "section": "Weak PFR over the integers",
        "lean": "single_fibres"
      },
      {
        "id": "multidist-chain-rule-cond",
        "kind": "remark",
        "label": "multidist-chain-rule-cond",
        "name": "Conditional multidistance chain rule",
        "color": "#a9dcb8",
        "statement": "Let $\\pi \\colon G \\to H$ be a homomorphism of abelian groups. Let $I$ be a finite index set and let $X_{[m]}$ be a tuple of $G$-valued random variables. Let $Y_{[m]}$ be another tuple of random variables (not necessarily $G$-valued). Suppose that the pairs $(X_i, Y_i)$ are jointly independent of one another (but $X_i$ need not be independent of $Y_i$). Then \\begin{align}\\nonumber D[ X_{[m]} | Y_{[m]} ] &= D[ X_{[m]} \\,|\\, \\pi(X_{[m]}), Y_{[m]}] + D[ \\pi(X_{[m]}) \\,|\\, Y_{[m]}] \\\\ &\\quad\\qquad + \\bbI[ \\sum_{i=1}^m X_i : \\pi(X_{[m]}) \\; \\big| \\; \\pi\\bigl(\\sum_{i=1}^m X_i \\bigr), Y_{[m]} ]. \\end{align}",
        "section": "The multidistance chain rule",
        "lean": "cond_multiDist_chainRule"
      },
      {
        "id": "torsion-dist-shrinking",
        "kind": "remark",
        "label": "torsion-dist-shrinking",
        "name": "torsion dist shrinking",
        "color": "#a9dcb8",
        "statement": "If $G$ is a torsion-free group and $X,Y$ are $G$-valued random variables and $\\phi:G\\to \\mathbb{F}_2^d$ is a homomorphism then \\[\\mathbb{H}(\\phi(X))\\leq 10d[X;Y].\\]",
        "section": "Weak PFR over the integers",
        "lean": "torsion_dist_shrinking"
      },
      {
        "id": "multidist-chain-rule-iter",
        "kind": "remark",
        "label": "multidist-chain-rule-iter",
        "name": "multidist chain rule iter",
        "color": "#a9dcb8",
        "statement": "Let $m$ be a positive integer. Suppose one has a sequence \\begin{equation} G_m \\to G_{m-1} \\to \\dots \\to G_1 \\to G_0 = \\{0\\} \\end{equation} of homomorphisms between abelian groups $G_0,\\dots,G_m$, and for each $d=0,\\dots,m$, let $\\pi_d : G_m \\to G_d$ be the homomorphism from $G_m$ to $G_d$ arising from this sequence by composition (so for instance $\\pi_m$ is the identity homomorphism and $\\pi_0$ is the zero homomorphism). Let $X_{[m]} = (X_i)_{1 \\leq i \\leq m}$ be a jointly independent tuple of $G_m$-valued random variables. Then \\begin{equation} \\begin{split} D[ X_{[m]} ] &= \\sum_{d=1}^m D[ \\pi_d(X_{[m]}) \\,|\\, \\pi_{d-1}(X_{[m]})] \\\\ &\\quad + \\sum_{d=1}^{m-1} \\bbI[ \\sum_i X_i : \\pi_d(X_{[m]}) \\; \\big| \\; \\pi_d\\big(\\sum_i X_i\\big), \\pi_{d-1}(X_{[m]}) ]. \\end{split} \\end{equation} In particular, by \\Cref{conditional-nonneg}, \\begin{align}\\nonumber D[ X_{[m]} ] \\geq & \\sum_{d=1}^m D[ \\pi_d(X_{[m]})|\\pi_{d-1}(X_{[m]}) ] \\\\ & + \\bbI[ \\sum_i X_i : \\pi_1(X_{[m]}) \\; \\big| \\; \\pi_1\\bigl(\\sum_i X_i\\bigr) ]. \\end{align}",
        "section": "The multidistance chain rule",
        "lean": "iter_multiDist_chainRule, iter_multiDist_chainRule'"
      },
      {
        "id": "first-cond",
        "kind": "remark",
        "label": "first-cond",
        "name": "Lower bound on conditional distances",
        "color": "#a9dcb8",
        "statement": "We have \\begin{align*} & d[X_1|X_1+\\tilde X_2; X_2|X_2+\\tilde X_1] \\\\ & \\qquad\\quad \\geq k - \\eta (d[X^0_1; X_1 | X_1 + \\tilde X_2] - d[X^0_1; X_1]) \\\\ & \\qquad\\qquad\\qquad\\qquad - \\eta(d[X^0_2; X_2 | X_2 + \\tilde X_1] - d[X^0_2; X_2]). \\end{align*}",
        "section": "First estimate",
        "lean": "condRuzsaDist_of_sums_ge"
      },
      {
        "id": "rho-cond-relabeled",
        "kind": "remark",
        "label": "rho-cond-relabeled",
        "name": "Conditional rho and relabeling",
        "color": "#a9dcb8",
        "statement": "If $f$ is injective, then $\\rho(X|f(Y))=\\rho(X|Y)$.",
        "section": "Rho functionals",
        "lean": "condRho_of_injective"
      },
      {
        "id": "weak-pfr-symm",
        "kind": "remark",
        "label": "weak-pfr-symm",
        "name": "weak pfr symm",
        "color": "#a9dcb8",
        "statement": "If $A\\subseteq \\mathbb{Z}^d$ is a finite non-empty set with $d[U_A;U_A]\\leq \\log K$ then there exists a non-empty $A'\\subseteq A$ such that \\[\\lvert A'\\rvert\\geq K^{-17}\\lvert A\\rvert\\] and $\\dim A'\\leq \\frac{40}{\\log 2} \\log K$.",
        "section": "Weak PFR over the integers",
        "lean": "weak_PFR"
      },
      {
        "id": "weak-pfr-int",
        "kind": "remark",
        "label": "weak-pfr-int",
        "name": "weak pfr int",
        "color": "#a9dcb8",
        "statement": "Let $A\\subseteq \\mathbb{Z}^d$ and $\\lvert A-A\\rvert\\leq K\\lvert A\\rvert$. There exists $A'\\subseteq A$ such that $\\lvert A'\\rvert \\geq K^{-17}\\lvert A\\rvert$ and $\\dim A' \\leq \\frac{40}{\\log 2}\\log K$.",
        "section": "Weak PFR over the integers",
        "lean": "weak_PFR_int"
      },
      {
        "id": "dimension-def",
        "kind": "remark",
        "label": "dimension-def",
        "name": "dimension def",
        "color": "#e0f3d7",
        "statement": "If $A\\subseteq \\mathbb{Z}^{d}$ then by $\\dim(A)$ we mean the dimension of the span of $A-A$ over the reals -- equivalently, the smallest $d'$ such that $A$ lies in a coset of a subgroup isomorphic to $\\mathbb{Z}^{d'}$.",
        "section": "Weak PFR over the integers",
        "lean": "AffineSpace.finrank"
      },
      {
        "id": "cond-dist-alt",
        "kind": "remark",
        "label": "cond-dist-alt",
        "name": "Alternate form of distance",
        "color": "#a9dcb8",
        "statement": "The expression $d[X | Z;Y | W]$ is unchanged if $(X,Z)$ or $(Y,W)$ is replaced by a copy. Furthermore, if $(X,Z)$ and $(Y,W)$ are independent, then $$ d[X | Z;Y | W] = \\bbH[X-Y|Z,W] - \\bbH[X|Z]/2 - \\bbH[Y|W]/2$$ and similarly $$ d[X ;Y | W] = \\bbH[X-Y|W] - \\bbH[X]/2 - \\bbH[Y|W]/2.$$",
        "section": "Entropic Ruzsa calculus",
        "lean": "condRuzsaDist_of_copy, condRuzsaDist'_of_copy, condRuzsaDist_of_indep, condRuzsaDist'_of_indep"
      },
      {
        "id": "construct-good",
        "kind": "remark",
        "label": "construct-good",
        "name": "Constructing good variables, II",
        "color": "#a9dcb8",
        "statement": "One has \\begin{align*} k & \\leq \\delta + \\frac{\\eta}{3} \\biggl( \\delta + \\sum_{i=1}^2 \\sum_{j = 1}^3 (d[X^0_i;T_j] - d[X^0_i; X_i]) \\biggr). \\end{align*}",
        "section": "Endgame",
        "lean": "construct_good"
      },
      {
        "id": "dist-sums",
        "kind": "remark",
        "label": "dist-sums",
        "name": "Distance between sums",
        "color": "#a9dcb8",
        "statement": "We have $$ d[X_1+\\tilde X_1; X_2+\\tilde X_2] \\geq k - \\frac{\\eta}{2} ( d[X_1; X_1] + d[X_2;X_2] ).$$",
        "section": "Second estimate",
        "lean": "rdist_of_sums_ge'"
      },
      {
        "id": "second-useful",
        "kind": "remark",
        "label": "second-useful",
        "name": "Comparison of Ruzsa distances, II",
        "color": "#a9dcb8",
        "statement": "Let $X, Y, Z, Z'$ be random variables taking values in some abelian group, and with $Y, Z, Z'$ independent. Then we have \\begin{align}\\nonumber & d[X ;Y + Z | Y + Z + Z'] - d[X ;Y] \\\\ & \\qquad \\leq \\tfrac{1}{2} ( \\bbH[Y + Z + Z'] + \\bbH[Y + Z] - \\bbH[Y] - \\bbH[Z']). \\end{align}",
        "section": "Entropic Ruzsa calculus",
        "lean": "condRuzsaDist_diff_ofsum_le"
      },
      {
        "id": "construct-good-improv",
        "kind": "remark",
        "label": "construct-good-improv",
        "name": "Constructing good variables, II'",
        "color": "#a9dcb8",
        "statement": "One has \\begin{align*} k & \\leq \\delta + \\frac{\\eta}{6} \\sum_{i=1}^2 \\sum_{1 \\leq j,l \\leq 3; j \\neq l} (d[X^0_i;T_j|T_l] - d[X^0_i; X_i]) \\end{align*}",
        "section": "Improving the exponents",
        "lean": "construct_good_improved'"
      },
      {
        "id": "rho-BSG-triplet-symmetrized",
        "kind": "remark",
        "label": "rho-BSG-triplet-symmetrized",
        "name": "rho BSG triplet symmetrized",
        "color": "#a9dcb8",
        "statement": "If $G$-valued random variables $T_1,T_2,T_3$ satisfy $T_1+T_2+T_3=0$, then $$d[X_1;X_2] \\leq \\sum_{1 \\leq i<j \\leq 3} \\bbI[T_i:T_j] + \\frac{\\eta}{3} \\sum_{1 \\leq i<j \\leq 3} (\\rho(T_i|T_j) + \\rho(T_j|T_i) -\\rho(X_1)-\\rho(X_2))$$",
        "section": "Studying a minimizer",
        "lean": "dist_le_of_sum_zero'"
      },
      {
        "id": "pfr-9-aux'",
        "kind": "remark",
        "label": "pfr-9-aux'",
        "name": "pfr 9 aux'",
        "color": "#a9dcb8",
        "statement": "If $|A+A| \\leq K|A|$, then there exist a subgroup $H$ and a subset $c$ of $G$ with $A \\subseteq c + H$, such that $|c| \\leq K^{5} |A|^{1/2}/|H|^{1/2}$ and $|H|/|A|\\in[K^{-8},K^8]$.",
        "section": "Studying a minimizer",
        "lean": "better_PFR_conjecture_aux"
      },
      {
        "id": "pfr-9",
        "kind": "remark",
        "label": "pfr-9",
        "name": "PFR with \\texorpdfstring$C=9$C=9",
        "color": "#a9dcb8",
        "statement": "If $A \\subset {\\bf F}_2^n$ is finite non-empty with $|A+A| \\leq K|A|$, then there exists a subgroup $H$ of ${\\bf F}_2^n$ with $|H| \\leq |A|$ such that $A$ can be covered by at most $2K^9$ translates of $H$.",
        "section": "Studying a minimizer",
        "lean": "better_PFR_conjecture"
      },
      {
        "id": "phi-min-exist",
        "kind": "remark",
        "label": "phi-min-exist",
        "name": "$\\phi$-minimizers exist",
        "color": "#a9dcb8",
        "statement": "There exists a $\\phi$-minimizer.",
        "section": "Studying a minimizer",
        "lean": "phi_min_exists"
      },
      {
        "id": "rho-sums-sym",
        "kind": "remark",
        "label": "rho-sums-sym",
        "name": "Rho and sums, symmetrized",
        "color": "#a9dcb8",
        "statement": "If $X,Y$ are independent, then $$ \\rho(X+Y) \\leq \\frac{1}{2}(\\rho(X)+\\rho(Y) + d[X;Y]).$$",
        "section": "Rho functionals",
        "lean": "rho_of_sum_le"
      },
      {
        "id": "ent-z2",
        "kind": "remark",
        "label": "ent-z2",
        "name": "Entropy of $Z_2$",
        "color": "#a9dcb8",
        "statement": "We have $\\bbH[Z_2] \\leq (8m^2-16m+1) k + \\frac{1}{m} \\sum_{i=1}^m \\bbH[X_i]$.",
        "section": "Endgame",
        "lean": "entropy_of_Z_two_le"
      },
      {
        "id": "multidist-lower",
        "kind": "remark",
        "label": "multidist-lower",
        "name": "Lower bound on multidistance",
        "color": "#a9dcb8",
        "statement": "If $(X_i)_{1 \\leq i \\leq m}$ is a $\\tau$-minimizer, and $k := D[(X_i)_{1 \\leq i \\leq m}]$, then for any other tuple $(X'_i)_{1 \\leq i \\leq m}$, one has $$ k - D[(X'_i)_{1 \\leq i \\leq m}] \\leq \\eta \\sum_{i=1}^m d[X_i; X'_i].$$",
        "section": "The tau functional",
        "lean": "sub_multiDistance_le"
      },
      {
        "id": "lem:100pc",
        "kind": "lemma",
        "label": "100pc",
        "name": "General 100\\% inverse theorem",
        "color": "#a9dcb8",
        "statement": "Suppose that $X_1,X_2$ are $G$-valued random variables such that $d[X_1;X_2]=0$. Then there exists a subgroup $H \\leq G$ such that $d[X_1;U_H] = d[X_2;U_H] = 0$.",
        "section": "The 100\\% version of PFR",
        "lean": "exists_isUniform_of_rdist_eq_zero"
      },
      {
        "id": "copy-ent",
        "kind": "remark",
        "label": "copy-ent",
        "name": "Copy preserves entropy",
        "color": "#a9dcb8",
        "statement": "If $X'$ is a copy of $X$ then $\\bbH[X'] = \\bbH[X]$.",
        "section": "Entropic Ruzsa calculus",
        "lean": "ProbabilityTheory.IdentDistrib.entropy_congr"
      },
      {
        "id": "ruz-copy",
        "kind": "remark",
        "label": "ruz-copy",
        "name": "Copy preserves Ruzsa distance",
        "color": "#a9dcb8",
        "statement": "If $X',Y'$ are copies of $X,Y$ respectively then $d[X';Y']=d[X ;Y]$.",
        "section": "Entropic Ruzsa calculus",
        "lean": "ProbabilityTheory.IdentDistrib.rdist_congr"
      },
      {
        "id": "tau-copy",
        "kind": "remark",
        "label": "tau-copy",
        "name": "$\\tau$ depends only on distribution",
        "color": "#a9dcb8",
        "statement": "If $X'_1, X'_2$ are copies of $X_1,X_2$, then $\\tau[X'_1;X'_2] = \\tau[X_1;X_2]$.",
        "section": "Entropy version of PFR",
        "lean": "ProbabilityTheory.IdentDistrib.tau_eq"
      },
      {
        "id": "ruz-indep",
        "kind": "remark",
        "label": "ruz-indep",
        "name": "Ruzsa distance in independent case",
        "color": "#a9dcb8",
        "statement": "If $X,Y$ are independent $G$-random variables then $$ d[X ;Y] := \\bbH[X - Y] - \\bbH[X]/2 - \\bbH[Y]/2.$$",
        "section": "Entropic Ruzsa calculus",
        "lean": "ProbabilityTheory.IndepFun.rdist_eq"
      },
      {
        "id": "tau-min",
        "kind": "remark",
        "label": "tau-min",
        "name": "$\\tau$ has minimum",
        "color": "#a9dcb8",
        "statement": "A pair $X_1, X_2$ of $\\tau$-minimizers exist.",
        "section": "Entropy version of PFR",
        "lean": "tau_minimizer_exists"
      },
      {
        "id": "distance-lower",
        "kind": "remark",
        "label": "distance-lower",
        "name": "Distance lower bound",
        "color": "#a9dcb8",
        "statement": "For any $G$-valued random variables $X'_1,X'_2$, one has $$ d[X'_1;X'_2] \\geq k - \\eta (d[X^0_1;X'_1] - d[X^0_1;X_1] ) - \\eta (d[X^0_2;X'_2] - d[X^0_2;X_2] ).$$",
        "section": "Basic facts about minimizers",
        "lean": "distance_ge_of_min"
      },
      {
        "id": "data-process",
        "kind": "remark",
        "label": "data-process",
        "name": "Data processing inequality",
        "color": "#a9dcb8",
        "statement": "Let $X,Y,Z$. For any functions $f, g$ on the ranges of $X, Y$ respectively, we have $\\bbI[f(X) : g(Y )|Z] \\leq \\bbI[X :Y |Z]$.",
        "section": "Data processing inequality",
        "lean": "ProbabilityTheory.condMutual_comp_comp_le"
      },
      {
        "id": "sumset-lower-gen-cond",
        "kind": "remark",
        "label": "sumset-lower-gen-cond",
        "name": "Conditional lower bound on sumset",
        "color": "#a9dcb8",
        "statement": "If $X,Y$ are $G$-valued random variables on $\\Omega$ and $Z$ is another random variable on $\\Omega$ then \\[ \\max(\\bbH[X|Z], \\bbH[Y|Z]) - \\bbI[X:Y|Z] \\leq \\bbH[X\\pm Y|Z], \\]",
        "section": "Entropic Ruzsa calculus",
        "lean": "ProbabilityTheory.max_condEntropy_sub_condMutualInfo_le_condEntropy_mul, ProbabilityTheory.max_condEntropy_sub_condMutualInfo_le_condEntropy_div"
      },
      {
        "id": "kl-div-copy",
        "kind": "remark",
        "label": "kl-div-copy",
        "name": "Kullback–Leibler divergence of copy",
        "color": "#a9dcb8",
        "statement": "If $X'$ is a copy of $X$, and $Y'$ is a copy of $Y$, then $D_{KL}(X'\\Vert Y') = D_{KL}(X\\Vert Y)$.",
        "section": "Kullback–Leibler divergence",
        "lean": "ProbabilityTheory.IdentDistrib.KLDiv_eq"
      },
      {
        "id": "relabeled-entropy",
        "kind": "remark",
        "label": "relabeled-entropy",
        "name": "Entropy and relabeling",
        "color": "#a9dcb8",
        "statement": "\\begin{itemize} \\item[(i)] If $X: \\Omega \\to S$ and $Y: \\Omega \\to T$ are random variables, and $Y = f(X)$ for some injection $f: S \\to T$, then $\\bbH[X] = \\bbH[Y]$. \\item[(ii)] If $X: \\Omega \\to S$ and $Y: \\Omega \\to T$ are random variables, and $Y = f(X)$ and $X = g(Y)$ for some functions $f: S \\to T$, $g: T \\to S$, then $\\bbH[X] = \\bbH[Y]$. \\end{itemize}",
        "section": "Shannon entropy inequalities",
        "lean": "ProbabilityTheory.entropy_comp_of_injective, ProbabilityTheory.entropy_of_comp_eq_of_comp"
      },
      {
        "id": "neg-ent",
        "kind": "remark",
        "label": "neg-ent",
        "name": "Negation preserves entropy",
        "color": "#a9dcb8",
        "statement": "If $X$ is $G$-valued, then $\\bbH[-X]=\\bbH[X]$.",
        "section": "Entropic Ruzsa calculus",
        "lean": "ProbabilityTheory.entropy_neg"
      },
      {
        "id": "data-process-single",
        "kind": "remark",
        "label": "data-process-single",
        "name": "Data processing for a single variable",
        "color": "#a9dcb8",
        "statement": "Let $X$ be a random variable. Then for any function $f$ on the range of $X$, one has $\\bbH[f(X)] \\leq \\bbH[X]$.",
        "section": "Data processing inequality",
        "lean": "ProbabilityTheory.entropy_comp_le"
      },
      {
        "id": "relabeled-entropy-cond",
        "kind": "remark",
        "label": "relabeled-entropy-cond",
        "name": "Conditional entropy and relabeling",
        "color": "#a9dcb8",
        "statement": "If $X: \\Omega \\to S$, $Y: \\Omega \\to T$, and $Z: \\Omega \\to U$ are random variables, and $Y = f(X,Z)$ almost surely for some map $f: S \\times U \\to T$ that is injective for each fixed $U$, then $\\bbH[X|Z] = \\bbH[Y|Z]$. Similarly, if $g: T \\to U$ is injective, then $\\bbH[X|g(Y)] = \\bbH[X|Y]$.",
        "section": "Shannon entropy inequalities",
        "lean": "ProbabilityTheory.condEntropy_comp_of_injective, ProbabilityTheory.condEntropy_of_injective'"
      },
      {
        "id": "entropy-comm",
        "kind": "remark",
        "label": "entropy-comm",
        "name": "Commutativity and associativity of joint entropy",
        "color": "#a9dcb8",
        "statement": "If $X: \\Omega \\to S$, $Y: \\Omega \\to T$, and $Z: \\Omega \\to U$ are random variables, then $\\bbH[X, Y] = \\bbH[Y, X]$ and $\\bbH[X, (Y,Z)] = \\bbH[(X,Y), Z]$.",
        "section": "Shannon entropy inequalities",
        "lean": "ProbabilityTheory.entropy_comm, ProbabilityTheory.entropy_assoc"
      },
      {
        "id": "ruzsa-symm",
        "kind": "remark",
        "label": "ruzsa-symm",
        "name": "Distance symmetric",
        "color": "#a9dcb8",
        "statement": "If $X,Y$ are $G$-valued random variables, then $$ d[X ;Y] = d[Y;X].$$",
        "section": "Entropic Ruzsa calculus",
        "lean": "rdist_symm"
      },
      {
        "id": "shear-ent",
        "kind": "remark",
        "label": "shear-ent",
        "name": "Shearing preserves entropy",
        "color": "#a9dcb8",
        "statement": "If $X,Y$ are $G$-valued, then $\\bbH[X \\pm Y | Y]=\\bbH[X|Y]$ and $\\bbH[X \\pm Y, Y] = \\bbH[X, Y]$.",
        "section": "Entropic Ruzsa calculus",
        "lean": "ProbabilityTheory.condEntropy_add_right, ProbabilityTheory.condEntropy_add_left, ProbabilityTheory.condEntropy_sub_right, ProbabilityTheory.condEntropy_sub_left"
      },
      {
        "id": "alternative-mutual",
        "kind": "remark",
        "label": "alternative-mutual",
        "name": "Alternative formulae for mutual information",
        "color": "#a9dcb8",
        "statement": "With notation as above, we have $$ \\bbI[X : Y] = \\bbI[Y:X]$$ $$ \\bbI[X : Y] = \\bbH[X] - \\bbH[X|Y]$$ $$ \\bbI[X : Y] = \\bbH[Y] - \\bbH[Y|X]$$",
        "section": "Shannon entropy inequalities",
        "lean": "ProbabilityTheory.mutualInfo_comm, ProbabilityTheory.mutualInfo_eq_entropy_sub_condEntropy"
      },
      {
        "id": "data-process-unc-one",
        "kind": "remark",
        "label": "data-process-unc-one",
        "name": "One-sided unconditional data processing inequality",
        "color": "#a9dcb8",
        "statement": "Let $X,Y$ be random variables. For any function $f, g$ on the range of $X$, we have $\\bbI[f(X) : Y] \\leq \\bbI[X:Y]$.",
        "section": "Data processing inequality",
        "lean": "ProbabilityTheory.mutual_comp_le"
      },
      {
        "id": "data-process-unc",
        "kind": "remark",
        "label": "data-process-unc",
        "name": "Unconditional data processing inequality",
        "color": "#a9dcb8",
        "statement": "Let $X,Y$ be random variables. For any functions $f, g$ on the ranges of $X, Y$ respectively, we have $\\bbI[f(X) : g(Y )] \\leq \\bbI[X : Y]$.",
        "section": "Data processing inequality",
        "lean": "ProbabilityTheory.mutual_comp_comp_le"
      },
      {
        "id": "rho-cond",
        "kind": "remark",
        "label": "rho-cond",
        "name": "Rho and conditioning",
        "color": "#a9dcb8",
        "statement": "If $X,Z$ are defined on the same space, one has $$ \\rho^-(X|Z) \\leq \\rho^-(X) + \\bbH[X] - \\bbH[X|Z]$$ $$ \\rho^+(X|Z) \\leq \\rho^+(X)$$ and $$ \\rho(X|Z) \\leq \\rho(X) + \\frac{1}{2}( \\bbH[X] - \\bbH[X|Z] ).$$",
        "section": "Rho functionals",
        "lean": "condRhoMinus_le, condRhoPlus_le, condRho_le"
      },
      {
        "id": "cs-bound",
        "kind": "remark",
        "label": "cs-bound",
        "name": "Cauchy–Schwarz bound",
        "color": "#a9dcb8",
        "statement": "If $G$ is a group, $A,B$ are finite subsets of $G$, then $$E(A) \\geq \\frac{|\\{ (a,a') \\in A \\times A: a+a' \\in B \\}|^2}{|B|}.$$",
        "section": "Approximate homomorphism version of PFR",
        "lean": "Finset.card_sq_le_card_mul_addEnergy'"
      },
      {
        "id": "tau-def-multi",
        "kind": "remark",
        "label": "tau-def-multi",
        "name": "$\\tau$-functional",
        "color": "#e0f3d7",
        "statement": "If $(X_i)_{1 \\leq i \\leq m}$ is a tuple, we define its $\\tau$-functional $$ \\tau[ (X_i)_{1 \\leq i \\leq m}] := D[(X_i)_{1 \\leq i \\leq m}] + \\eta \\sum_{i=1}^m d[X_i; X^0].$$",
        "section": "The tau functional",
        "lean": "multiTau"
      },
      {
        "id": "tau-min-exist-multi",
        "kind": "remark",
        "label": "tau-min-exist-multi",
        "name": "Existence of $\\tau$-minimizer",
        "color": "#a9dcb8",
        "statement": "If $G$ is finite, then a $\\tau$-minimizer exists.",
        "section": "The tau functional",
        "lean": "multiTau_continuous, multiTau_min_exists"
      },
      {
        "id": "tau-min-multi",
        "kind": "remark",
        "label": "tau-min-multi",
        "name": "$\\tau$-minimizer",
        "color": "#e0f3d7",
        "statement": "A $\\tau$-minimizer is a tuple $(X_i)_{1 \\leq i \\leq m}$ that minimizes the $\\tau$-functional among all tuples of $G$-valued random variables.",
        "section": "The tau functional",
        "lean": "multiTauMinimizes"
      },
      {
        "id": "cond-multidist-lower",
        "kind": "remark",
        "label": "cond-multidist-lower",
        "name": "Lower bound on conditional multidistance",
        "color": "#a9dcb8",
        "statement": "If $(X_i)_{1 \\leq i \\leq m}$ is a $\\tau$-minimizer, and $k := D[(X_i)_{1 \\leq i \\leq m}]$, then for any other tuples $(X'_i)_{1 \\leq i \\leq m}$ and $(Y_i)_{1 \\leq i \\leq m}$ with the $X'_i$ $G$-valued, one has $$ k - D[(X'_i)_{1 \\leq i \\leq m} | (Y_i)_{1 \\leq i \\leq m}] \\leq \\eta \\sum_{i=1}^m d[X_i; X'_i|Y_i].$$",
        "section": "The tau functional",
        "lean": "sub_condMultiDistance_le"
      },
      {
        "id": "conditional-nonneg",
        "kind": "remark",
        "label": "conditional-nonneg",
        "name": "Nonnegativity of conditional mutual information",
        "color": "#a9dcb8",
        "statement": "If $X,Y,Z$ are random variables, then $\\bbI[X:Y|Z] \\ge 0$.",
        "section": "Shannon entropy inequalities",
        "lean": "ProbabilityTheory.condMutualInfo_nonneg"
      },
      {
        "id": "kl-div-convex",
        "kind": "remark",
        "label": "kl-div-convex",
        "name": "Convexity of Kullback–Leibler",
        "color": "#a9dcb8",
        "statement": "If $S$ is a finite set, $\\sum_{s \\in S} w_s = 1$ for some non-negative $w_s$, and ${\\bf P}(X=x) = \\sum_{s\\in S} w_s {\\bf P}(X_s=x)$, ${\\bf P}(Y=x) = \\sum_{s\\in S} w_s {\\bf P}(Y_s=x)$ for all $x$, then $$D_{KL}(X\\Vert Y) \\le \\sum_{s\\in S} w_s D_{KL}(X_s\\Vert Y_s).$$",
        "section": "Kullback–Leibler divergence",
        "lean": "KLDiv_of_convex"
      },
      {
        "id": "kl-sums",
        "kind": "remark",
        "label": "kl-sums",
        "name": "Kullback–Leibler and sums",
        "color": "#a9dcb8",
        "statement": "If $X, Y, Z$ are independent $G$-valued random variables, then $$D_{KL}(X+Z\\Vert Y+Z) \\leq D_{KL}(X\\Vert Y).$$",
        "section": "Kullback–Leibler divergence",
        "lean": "KLDiv_add_le_KLDiv_of_indep"
      },
      {
        "id": "rho-sums",
        "kind": "remark",
        "label": "rho-sums",
        "name": "Rho and sums",
        "color": "#a9dcb8",
        "statement": "If $X,Y$ are independent, one has $$ \\rho^-(X+Y) \\leq \\rho^-(X)$$ $$ \\rho^+(X+Y) \\leq \\rho^+(X) + \\bbH[X+Y] - \\bbH[X]$$ and $$ \\rho(X+Y) \\leq \\rho(X) + \\frac{1}{2}( \\bbH[X+Y] - \\bbH[X] ).$$",
        "section": "Rho functionals",
        "lean": "rhoMinus_of_sum, rhoPlus_of_sum, rho_of_sum"
      },
      {
        "id": "multidist-def",
        "kind": "remark",
        "label": "multidist-def",
        "name": "Multidistance",
        "color": "#e0f3d7",
        "statement": "Let $m$ be a positive integer, and let $X_{[m]} = (X_i)_{1 \\leq i \\leq m}$ be an $m$-tuple of $G$-valued random variables $X_i$. Then we define \\[ D[X_{[m]}] := \\bbH[\\sum_{i=1}^m \\tilde X_i] - \\frac{1}{m} \\sum_{i=1}^m \\bbH[\\tilde X_i], \\] where the $\\tilde X_i$ are independent copies of the $X_i$.",
        "section": "Multidistance",
        "lean": "multiDist"
      },
      {
        "id": "cond-multidist-def",
        "kind": "remark",
        "label": "cond-multidist-def",
        "name": "Conditional multidistance",
        "color": "#e0f3d7",
        "statement": "If $X_{[m]} = (X_i)_{1 \\leq i \\leq m}$ and $Y_{[m]} = (Y_i)_{1 \\leq i \\leq m}$ are tuples of random variables, with the $X_i$ being $G$-valued (but the $Y_i$ need not be), then we define \\begin{equation} D[ X_{[m]} | Y_{[m]} ] = \\sum_{(y_i)_{1 \\leq i \\leq m}} \\biggl(\\prod_{1 \\leq i \\leq m} p_{Y_i}(y_i)\\biggr) D[ (X_i \\,|\\, Y_i \\mathop{=}y_i)_{1 \\leq i \\leq m}] \\end{equation} where each $y_i$ ranges over the support of $p_{Y_i}$ for $1 \\leq i \\leq m$.",
        "section": "The tau functional",
        "lean": "condMultiDist"
      },
      {
        "id": "multidist-copy",
        "kind": "remark",
        "label": "multidist-copy",
        "name": "Multidistance of copy",
        "color": "#a9dcb8",
        "statement": "If $X_{[m]} = (X_i)_{1 \\leq i \\leq m}$ and $Y_{[m]} = (Y_i)_{1 \\leq i \\leq m}$ are such that $X_i$ and $Y_i$ have the same distribution for each $i$, then $D[X_{[m]}] = D[Y_{[m]}]$.",
        "section": "Multidistance",
        "lean": "multiDist_copy"
      },
      {
        "id": "multidist-indep",
        "kind": "remark",
        "label": "multidist-indep",
        "name": "Multidistance of independent variables",
        "color": "#a9dcb8",
        "statement": "If $X_{[m]} = (X_i)_{1 \\leq i \\leq m}$ are jointly independent, then $D[X_{[m]}] = \\bbH[\\sum_{i=1}^m X_i] - \\frac{1}{m} \\sum_{i=1}^m \\bbH[X_i]$.",
        "section": "Multidistance",
        "lean": "multiDist_indep"
      },
      {
        "id": "cond-multidist-alt",
        "kind": "remark",
        "label": "cond-multidist-alt",
        "name": "Alternate form of conditional multidistance",
        "color": "#a9dcb8",
        "statement": "If the $(X_i,Y_i)$ are independent, \\begin{equation} D[ X_{[m]} | Y_{[m]}] := \\bbH[\\sum_{i=1}^m X_i \\big| (Y_j)_{1 \\leq j \\leq m} ] - \\frac{1}{m} \\sum_{i=1}^m \\bbH[ X_i | Y_i]. \\end{equation}",
        "section": "The tau functional",
        "lean": "condMultiDist_eq"
      },
      {
        "id": "mutual-w-z2",
        "kind": "remark",
        "label": "mutual-w-z2",
        "name": "Mutual information bound",
        "color": "#a9dcb8",
        "statement": "We have $\\bbI[W : Z_2] \\leq 2 (m-1) k$.",
        "section": "Endgame",
        "lean": "mutual_of_W_Z_two_le"
      },
      {
        "id": "log-sum",
        "kind": "remark",
        "label": "log-sum",
        "name": "log sum inequality",
        "color": "#a9dcb8",
        "statement": "If $S$ is a finite set, and $a_s,b_s$ are non-negative for $s\\in S$, then $$\\sum_{s\\in S} a_s \\log\\frac{a_s}{b_s}\\ge \\left(\\sum_{s\\in S}a_s\\right)\\log\\frac{\\sum_{s\\in S} a_s}{\\sum_{s\\in S} b_s},$$ with the convention $0\\log\\frac{0}{b}=0$ for any $b\\ge 0$ and $0\\log\\frac{a}{0}=\\infty$ for any $a>0$.",
        "section": "Applications of Jensen's inequality",
        "lean": "Real.sum_mul_log_div_leq"
      },
      {
        "id": "first-dist-sum",
        "kind": "remark",
        "label": "first-dist-sum",
        "name": "Lower bound on distances",
        "color": "#a9dcb8",
        "statement": "We have \\begin{align*} d[X_1+\\tilde X_2; X_2+\\tilde X_1] \\geq k &- \\eta (d[X^0_1; X_1+\\tilde X_2] - d[X^0_1; X_1]) \\\\& \\qquad- \\eta (d[X^0_2; X_2+\\tilde X_1] - d[X^0_2; X_2]) \\end{align*}",
        "section": "First estimate",
        "lean": "rdist_of_sums_ge"
      },
      {
        "id": "cond-distance-lower",
        "kind": "remark",
        "label": "cond-distance-lower",
        "name": "Conditional distance lower bound",
        "color": "#a9dcb8",
        "statement": "For any $G$-valued random variables $X'_1,X'_2$ and random variables $Z,W$, one has $$ d[X'_1|Z;X'_2|W] \\geq k - \\eta (d[X^0_1;X'_1|Z] - d[X^0_1;X_1] ) - \\eta (d[X^0_2;X'_2|W] - d[X^0_2;X_2] ).$$",
        "section": "Basic facts about minimizers",
        "lean": "condRuzsaDistance_ge_of_min"
      },
      {
        "id": "uniform-def",
        "kind": "remark",
        "label": "uniform-def",
        "name": "Uniform distribution",
        "color": "#e0f3d7",
        "statement": "If $H$ is a subset of $S$, an $S$-random variable $X$ is said to be uniformly distributed on $H$ if $\\bbP[X = s] = 1/|H|$ for $s \\in X$ and $\\bbP[X=s] = 0$ otherwise.",
        "section": "Shannon entropy inequalities",
        "lean": "ProbabilityTheory.IsUniform"
      },
      {
        "id": "unif-exist",
        "kind": "remark",
        "label": "unif-exist",
        "name": "Uniform distributions exist",
        "color": "#a9dcb8",
        "statement": "Given a finite non-empty subset $H$ of a set $S$, there exists a random variable $X$ (on some probability space) that is uniformly distributed on $H$.",
        "section": "Shannon entropy inequalities",
        "lean": "ProbabilityTheory.exists_isUniform, ProbabilityTheory.exists_isUniform_measureSpace"
      },
      {
        "id": "alt-submodularity",
        "kind": "remark",
        "label": "alt-submodularity",
        "name": "Alternate form of submodularity",
        "color": "#a9dcb8",
        "statement": "With three random variables $X,Y,Z$, one has $$ \\bbH[X,Y,Z] + \\bbH[Z] \\leq \\bbH[X,Z] + \\bbH[Y,Z].$$",
        "section": "Shannon entropy inequalities",
        "lean": "ProbabilityTheory.entropy_triple_add_entropy_le"
      },
      {
        "id": "independent-def",
        "kind": "remark",
        "label": "independent-def",
        "name": "Independent random variables",
        "color": "#e0f3d7",
        "statement": "Two random variables $X: \\Omega \\to S$ and $Y: \\Omega \\to T$ are independent if the law of $(X,Y)$ is the product of the law of $X$ and the law of $Y$. Similarly for more than two variables.",
        "section": "Shannon entropy inequalities",
        "lean": "ProbabilityTheory.IndepFun"
      },
      {
        "id": "independent-exist",
        "kind": "remark",
        "label": "independent-exist",
        "name": "Existence of independent copies",
        "color": "#a9dcb8",
        "statement": "Let $X_i : \\Omega_i \\to S_i$ be random variables for $i=1,\\dots,k$. Then if one gives $\\prod_{i=1}^k S_i$ the product measure of the laws of $X_i$, the coordinate functions $(x_j)_{j=1}^k \\mapsto x_i$ are jointly independent random variables which are copies of the $X_1,\\dots,X_k$.",
        "section": "Entropic Ruzsa calculus",
        "lean": "ProbabilityTheory.independent_copies, ProbabilityTheory.independent_copies', ProbabilityTheory.independent_copies_two, ProbabilityTheory.independent_copies3_nondep"
      },
      {
        "id": "ruz-dist-def",
        "kind": "remark",
        "label": "ruz-dist-def",
        "name": "Ruzsa distance",
        "color": "#e0f3d7",
        "statement": "Let $X,Y$ be $G$-valued random variables (not necessarily on the same sample space). The \\emph{Ruzsa distance} $d[X ;Y]$ between $X$ and $Y$ is defined to be $$ d[X ;Y] := \\bbH[X' - Y'] - \\bbH[X']/2 - \\bbH[Y']/2$$ where $X',Y'$ are (the canonical) independent copies of $X,Y$ from \\Cref{independent-exist}.",
        "section": "Entropic Ruzsa calculus",
        "lean": "rdist_def"
      },
      {
        "id": "tau-def",
        "kind": "remark",
        "label": "tau-def",
        "name": "$\\tau$ functional",
        "color": "#e0f3d7",
        "statement": "If $X_1,X_2$ are two $G$-valued random variables, then $$ \\tau[X_1; X_2] := d[X_1; X_2] + \\eta d[X^0_1; X_1] + \\eta d[X^0_2; X_2].$$",
        "section": "Entropy version of PFR",
        "lean": "tau"
      },
      {
        "id": "dist-zero",
        "kind": "remark",
        "label": "dist-zero",
        "name": "Distance from zero",
        "color": "#a9dcb8",
        "statement": "If $X$ is a $G$-valued random variable and $0$ is the random variable taking the value $0$ everywhere then \\[d[X;0]=\\mathbb{H}(X)/2.\\]",
        "section": "Entropic Ruzsa calculus",
        "lean": "rdist_zero_eq_half_ent"
      },
      {
        "id": "cond-dist-def",
        "kind": "remark",
        "label": "cond-dist-def",
        "name": "Conditioned Ruzsa distance",
        "color": "#e0f3d7",
        "statement": "If $(X, Z)$ and $(Y, W)$ are random variables (where $X$ and $Y$ are $G$-valued) we define $$ d[X | Z; Y | W] := \\sum_{z,w} \\bbP[Z=z] \\bbP[W=w] d[(X|Z=z); (Y|(W=w))].$$ similarly $$ d[X ; Y | W] := \\sum_{w} \\bbP[W=w] d[X ; (Y|(W=w))].$$",
        "section": "Entropic Ruzsa calculus",
        "lean": "condRuzsaDist"
      },
      {
        "id": "conditional-mutual-def",
        "kind": "remark",
        "label": "conditional-mutual-def",
        "name": "Conditional mutual information",
        "color": "#e0f3d7",
        "statement": "If $X,Y,Z$ are random variables, with $Z$ $U$-valued, then $$ \\bbI[X:Y|Z] := \\sum_{z \\in U} P[Z=z] \\bbI[(X|Z=z): (Y|Z=z)].$$",
        "section": "Shannon entropy inequalities",
        "lean": "ProbabilityTheory.condMutualInfo"
      },
      {
        "id": "cond-indep-exist",
        "kind": "remark",
        "label": "cond-indep-exist",
        "name": "Existence of conditional independent trials",
        "color": "#a9dcb8",
        "statement": "For $X,Y$ random variables, there exist random variables $X_1,X_2,Y'$ on a common probability space with $(X_1, Y'), (X_2, Y')$ both having the distribution of $(X,Y)$, and $X_1, X_2$ conditionally independent over $Y'$ in the sense of \\Cref{conditional-independent-def}.",
        "section": "Entropic Ruzsa calculus",
        "lean": "ProbabilityTheory.condIndep_copies"
      },
      {
        "id": "ckl-div",
        "kind": "remark",
        "label": "ckl-div",
        "name": "Conditional Kullback–Leibler divergence",
        "color": "#e0f3d7",
        "statement": "If $X,Y,Z$ are random variables, with $X,Z$ defined on the same sample space, we define $$ D_{KL}(X|Z \\Vert Y) := \\sum_z \\mathbf{P}(Z=z) D_{KL}( (X|Z=z) \\Vert Y).$$",
        "section": "Kullback–Leibler divergence"
      },
      {
        "id": "kl-cond",
        "kind": "remark",
        "label": "kl-cond",
        "name": "Kullback–Leibler and conditioning",
        "color": "#a9dcb8",
        "statement": "If $X, Y$ are independent $G$-valued random variables, and $Z$ is another random variable defined on the same sample space as $X$, then $$D_{KL}((X|Z)\\Vert Y) = D_{KL}(X\\Vert Y) + \\bbH[X] - \\bbH[X|Z].$$",
        "section": "Kullback–Leibler divergence",
        "lean": "condKLDiv_eq"
      },
      {
        "id": "conditional-chain-rule",
        "kind": "remark",
        "label": "conditional-chain-rule",
        "name": "Conditional chain rule",
        "color": "#a9dcb8",
        "statement": "If $X: \\Omega \\to S$, $Y: \\Omega \\to T$, $Z: \\Omega \\to U$ are random variables, then $$ \\bbH[X, Y | Z] = \\bbH[Y | Z] + \\bbH[X|Y, Z].$$",
        "section": "Shannon entropy inequalities",
        "lean": "ProbabilityTheory.cond_chain_rule, ProbabilityTheory.cond_chain_rule'"
      },
      {
        "id": "chain-rule",
        "kind": "remark",
        "label": "chain-rule",
        "name": "Chain rule",
        "color": "#a9dcb8",
        "statement": "If $X: \\Omega \\to S$ and $Y: \\Omega \\to T$ are random variables, then $$ \\bbH[X, Y] = \\bbH[Y] + \\bbH[X|Y].$$",
        "section": "Shannon entropy inequalities",
        "lean": "ProbabilityTheory.chain_rule, ProbabilityTheory.chain_rule'"
      },
      {
        "id": "rho-cond-def",
        "kind": "remark",
        "label": "rho-cond-def",
        "name": "Conditional Rho functional",
        "color": "#e0f3d7",
        "statement": "We define $\\rho(X|Y) := \\sum_y {\\bf P}(Y=y) \\rho(X|Y=y)$.",
        "section": "Rho functionals",
        "lean": "condRho"
      },
      {
        "id": "rho-cond-invariant",
        "kind": "remark",
        "label": "rho-cond-invariant",
        "name": "Conditional rho and translation",
        "color": "#a9dcb8",
        "statement": "For any $s\\in G$, $\\rho(X+s|Y)=\\rho(X|Y)$.",
        "section": "Rho functionals",
        "lean": "condRho_of_translate"
      },
      {
        "id": "bound-conc",
        "kind": "remark",
        "label": "bound-conc",
        "name": "Bounded entropy implies concentration",
        "color": "#a9dcb8",
        "statement": "If $X$ is an $S$-valued random variable, then there exists $s \\in S$ such that $\\bbP[X=s] \\geq \\exp(-\\bbH[X])$.",
        "section": "Shannon entropy inequalities",
        "lean": "ProbabilityTheory.prob_ge_exp_neg_entropy"
      },
      {
        "id": "condition-event-def",
        "kind": "remark",
        "label": "condition-event-def",
        "name": "Conditioned event",
        "color": "#e0f3d7",
        "statement": "If $X: \\Omega \\to S$ is an $S$-valued random variable and $E$ is an event in $\\Omega$, then the conditioned event $(X|E)$ is defined to be the same random variable as $X$, but now the ambient probability measure has been conditioned to $E$.",
        "section": "Shannon entropy inequalities",
        "lean": "ProbabilityTheory.cond"
      },
      {
        "id": "conditional-entropy-def",
        "kind": "remark",
        "label": "conditional-entropy-def",
        "name": "Conditional entropy",
        "color": "#e0f3d7",
        "statement": "If $X: \\Omega \\to S$ and $Y: \\Omega \\to T$ are random variables, the conditional entropy $\\bbH[X|Y]$ is defined as $$ \\bbH[X|Y] := \\sum_{y \\in Y} \\bbP[Y = y] \\bbH[(X | Y=y)].$$",
        "section": "Shannon entropy inequalities",
        "lean": "ProbabilityTheory.condEntropy"
      },
      {
        "id": "phi-min-def",
        "kind": "remark",
        "label": "phi-min-def",
        "name": "phi min def",
        "color": "#e0f3d7",
        "statement": "Given $G$-valued random variables $X,Y$, define $$ \\phi[X;Y] := d[X;Y] + \\eta(\\rho(X) + \\rho(Y))$$ and define a \\emph{$\\phi$-minimizer} to be a pair of random variables $X,Y$ which minimizes $\\phi[X;Y]$.",
        "section": "Studying a minimizer",
        "lean": "phiMinimizes"
      },
      {
        "id": "sym-group",
        "kind": "remark",
        "label": "sym-group",
        "name": "Symmetry group is a group",
        "color": "#a9dcb8",
        "statement": "If $X$ is a $G$-valued random variable, then $\\mathrm{Sym}[X]$ is a subgroup of $G$.",
        "section": "The 100\\% version of PFR",
        "lean": "symmGroup"
      },
      {
        "id": "conditional-independent-def",
        "kind": "remark",
        "label": "conditional-independent-def",
        "name": "Conditionally independent random variables",
        "color": "#e0f3d7",
        "statement": "Two random variables $X: \\Omega \\to S$ and $Y: \\Omega \\to T$ are conditionally independent relative to another random variable $Z: \\Omega \\to U$ if $P[X = s \\wedge Y = t| Z=u] = P[X=s|Z=u] P[Y=t|Z=u]$ for all $s \\in S, t \\in T, u \\in U$. (We won't need conditional independence for more variables than this.)",
        "section": "Shannon entropy inequalities",
        "lean": "ProbabilityTheory.CondIndepFun"
      },
      {
        "id": "tau-min-def",
        "kind": "remark",
        "label": "tau-min-def",
        "name": "$\\tau$-minimizer",
        "color": "#e0f3d7",
        "statement": "A pair of $G$-valued random variables $X_1, X_2$ are said to be a $\\tau$-minimizer if one has $$\\tau[X_1;X_2] \\leq \\tau[X'_1;X'_2] $$ for all $G$-valued random variables $X'_1, X'_2$.",
        "section": "Entropy version of PFR",
        "lean": "tau_minimizes"
      },
      {
        "id": "energy-def",
        "kind": "remark",
        "label": "energy-def",
        "name": "Additive energy",
        "color": "#e0f3d7",
        "statement": "If $G$ is a group, and $A$ is a finite subset of $G$, the \\emph{additive energy} $E(A)$ of $A$ is the number of quadruples $(a_1,a_2,a_3,a_4) \\in A^4$ such that $a_1+a_2 = a_3+a_4$.",
        "section": "Approximate homomorphism version of PFR",
        "lean": "Finset.addEnergy'"
      },
      {
        "id": "entropy-def",
        "kind": "remark",
        "label": "entropy-def",
        "name": "Entropy",
        "color": "#e0f3d7",
        "statement": "If $X$ is an $S$-valued random variable, the entropy $\\bbH[X]$ of $X$ is defined $$ \\bbH[X] := \\sum_{s \\in S} \\bbP[X=x] \\log \\frac{1}{\\bbP[X=x]}$$ with the convention that $0 \\log \\frac{1}{0} = 0$.",
        "section": "Shannon entropy inequalities",
        "lean": "ProbabilityTheory.entropy"
      },
      {
        "id": "information-def",
        "kind": "remark",
        "label": "information-def",
        "name": "Mutual information",
        "color": "#e0f3d7",
        "statement": "If $X: \\Omega \\to S$, $Y: \\Omega \\to T$ are random variables, then $$\\bbI[X : Y] := \\bbH[X] + \\bbH[Y] - \\bbH[X,Y].$$",
        "section": "Shannon entropy inequalities",
        "lean": "ProbabilityTheory.mutualInfo, ProbabilityTheory.mutualInfo_def"
      },
      {
        "id": "kl-div-inj",
        "kind": "remark",
        "label": "kl-div-inj",
        "name": "Kullback–Leibler and injections",
        "color": "#a9dcb8",
        "statement": "If $f:G \\to H$ is an injection, then $D_{KL}(f(X)\\Vert f(Y)) = D_{KL}(X\\Vert Y)$.",
        "section": "Kullback–Leibler divergence",
        "lean": "KLDiv_of_comp_inj"
      },
      {
        "id": "sym-group-def",
        "kind": "remark",
        "label": "sym-group-def",
        "name": "Symmetry group",
        "color": "#e0f3d7",
        "statement": "If $X$ is a $G$-valued random variable, then the symmetry group $\\mathrm{Sym}[X]$ is the set of all $h \\in G$ such that $X +h$ has the same distribution as $X$.",
        "section": "The 100\\% version of PFR",
        "lean": "symmGroup"
      },
      {
        "id": "eta-def-multi",
        "kind": "remark",
        "label": "eta-def-multi",
        "name": "$\\eta$",
        "color": "#e0f3d7",
        "statement": "We set $\\eta := \\frac{1}{32m^3}$.",
        "section": "The tau functional",
        "lean": "multiRefPackage"
      },
      {
        "id": "more-random",
        "kind": "remark",
        "label": "more-random",
        "name": "Additional random variables",
        "color": "#e0f3d7",
        "statement": "By a slight abuse of notation, we identify $\\Z/m\\Z$ and $\\{1,\\dots,m\\}$ in the obvious way, and let $Y_{i,j}$ be an independent copy of $X_i$ for $i,j \\in \\Z/m\\Z$. Then also define: \\[ W := \\sum_{i,j \\in \\Z/m\\Z} Y_{i,j} \\] and \\[ Z_1 := \\sum_{i,j \\in \\Z/m\\Z} i Y_{i,j},\\ \\ \\ Z_2 := \\sum_{i,j \\in \\Z/m\\Z} j Y_{i,j},\\ \\ \\ Z_3 := \\sum_{i,j \\in \\Z/m\\Z} (-i-j) Y_{i,j}. \\] The addition $(-i-j)$ takes place over $\\Z/m\\Z$. Note that, because we are assuming $G$ is $m$-torsion, it is well-defined to multiply elements of $G$ by elements of $\\Z/m\\Z$. We will also define for $i,j,r \\in \\Z/m\\Z$ the variables \\begin{equation} P_i := \\sum_{j \\in \\Z/m\\Z} Y_{i,j} , \\quad Q_j := \\sum_{i \\in \\Z/m\\Z} Y_{i,j} , \\quad R_r := \\sum_{\\substack{i,j \\in \\Z/m\\Z \\\\ i+j=-r}} Y_{i,j} .\\end{equation}",
        "section": "Endgame"
      },
      {
        "id": "Zero-sum",
        "kind": "remark",
        "label": "Zero-sum",
        "name": "Zero-sum",
        "color": "#a9dcb8",
        "statement": "We have \\begin{equation} Z_1+Z_2+Z_3= 0 \\end{equation}",
        "section": "Endgame",
        "lean": "sum_of_z_eq_zero"
      },
      {
        "id": "eta-def",
        "kind": "remark",
        "label": "eta-def",
        "name": "eta def",
        "color": "#e0f3d7",
        "statement": "$\\eta := 1/9$.",
        "section": "Entropy version of PFR"
      },
      {
        "id": "kl-div",
        "kind": "remark",
        "label": "kl-div",
        "name": "Kullback–Leibler divergence",
        "color": "#e0f3d7",
        "statement": "If $X,Y$ are two $G$-valued random variables, the Kullback--Leibler divergence is defined as $$ D_{KL}(X\\Vert Y) := \\sum_x \\mathbf{P}(X=x) \\log \\frac{\\mathbf{P}(X=x)}{\\mathbf{P}(Y=x)}.$$",
        "section": "Kullback–Leibler divergence",
        "lean": "KLDiv"
      },
      {
        "id": "ruz-cov",
        "kind": "remark",
        "label": "ruz-cov",
        "name": "Ruzsa covering lemma",
        "color": "#a9dcb8",
        "statement": "If $A,B$ are finite non-empty subsets of a group $G$, then $A$ can be covered by at most $|A+B|/|B|$ translates of $B-B$.",
        "section": "Proof of PFR",
        "lean": "Finset.ruzsa_covering_mul"
      },
      {
        "id": "hb-thm",
        "kind": "remark",
        "label": "hb-thm",
        "name": "Hahn-Banach type theorem",
        "color": "#a9dcb8",
        "statement": "Let $H_0$ be a subgroup of $G$. Then every homomorphism $\\phi: H_0 \\to G'$ can be extended to a homomorphism $\\tilde \\phi: G \\to G'$.",
        "section": "Homomorphism version of PFR",
        "lean": "hahn_banach"
      }
    ],
    "edges": [
      {
        "from": "vanish-entropy",
        "to": "add-entropy",
        "type": "uses"
      },
      {
        "from": "vanish-entropy",
        "to": "zero-large",
        "type": "uses"
      },
      {
        "from": "vanish-entropy",
        "to": "conditional-vanish",
        "type": "uses"
      },
      {
        "from": "vanish-entropy",
        "to": "sumset-lower",
        "type": "uses"
      },
      {
        "from": "converse-log-sum",
        "to": "Gibbs-converse",
        "type": "uses"
      },
      {
        "from": "jensen-bound",
        "to": "pfr_aux-improv",
        "type": "uses"
      },
      {
        "from": "jensen-bound",
        "to": "dist-projection",
        "type": "uses"
      },
      {
        "from": "mutual-nonneg",
        "to": "cond-reduce",
        "type": "uses"
      },
      {
        "from": "add-entropy",
        "to": "cor-fibre",
        "type": "uses"
      },
      {
        "from": "add-entropy",
        "to": "entropic-bsg",
        "type": "uses"
      },
      {
        "from": "add-entropy",
        "to": "sign-flip",
        "type": "uses"
      },
      {
        "from": "add-entropy",
        "to": "ruzsa-triangle-improved",
        "type": "uses"
      },
      {
        "from": "add-entropy",
        "to": "cor-multid",
        "type": "uses"
      },
      {
        "from": "zero-large",
        "to": "sym-zero",
        "type": "uses"
      },
      {
        "from": "conditional-vanish",
        "to": "cond-trial-ent",
        "type": "uses"
      },
      {
        "from": "sumset-lower",
        "to": "multidist-ruzsa-III",
        "type": "uses"
      },
      {
        "from": "sumset-lower",
        "to": "ruzsa-diff",
        "type": "uses"
      },
      {
        "from": "sumset-lower",
        "to": "multidist-ruzsa-IV",
        "type": "uses"
      },
      {
        "from": "sumset-lower",
        "to": "multidist-nonneg",
        "type": "uses"
      },
      {
        "from": "sumset-lower",
        "to": "multidist-ruzsa-I",
        "type": "uses"
      },
      {
        "from": "sumset-lower",
        "to": "compare-sums",
        "type": "uses"
      },
      {
        "from": "sumset-lower",
        "to": "ruzsa-growth",
        "type": "uses"
      },
      {
        "from": "pfr_aux-improv",
        "to": "approx-hom-pfr",
        "type": "uses"
      },
      {
        "from": "pfr_aux-improv",
        "to": "hom-pfr",
        "type": "uses"
      },
      {
        "from": "pfr_aux-improv",
        "to": "pfr-improv",
        "type": "uses"
      },
      {
        "from": "dist-projection",
        "to": "app-ent-pfr",
        "type": "uses"
      },
      {
        "from": "cond-reduce",
        "to": "cond-dist-fact",
        "type": "uses"
      },
      {
        "from": "cond-reduce",
        "to": "sumset-lower-gen",
        "type": "uses"
      },
      {
        "from": "first-upper",
        "to": "first-estimate",
        "type": "uses"
      },
      {
        "from": "first-upper",
        "to": "foursum-bound",
        "type": "uses"
      },
      {
        "from": "first-estimate",
        "to": "de-prop",
        "type": "uses"
      },
      {
        "from": "foursum-bound",
        "to": "second-estimate-aux",
        "type": "uses"
      },
      {
        "from": "foursum-bound",
        "to": "total-dist",
        "type": "uses"
      },
      {
        "from": "de-prop",
        "to": "entropy-pfr",
        "type": "uses"
      },
      {
        "from": "second-estimate-aux",
        "to": "dist-diff-bound",
        "type": "uses"
      },
      {
        "from": "second-estimate-aux",
        "to": "second-estimate",
        "type": "uses"
      },
      {
        "from": "total-dist",
        "to": "de-prop",
        "type": "uses"
      },
      {
        "from": "symm-lemma",
        "to": "uvw-s",
        "type": "uses"
      },
      {
        "from": "uvw-s",
        "to": "de-prop",
        "type": "uses"
      },
      {
        "from": "uvw-s",
        "to": "de-prop-improv",
        "type": "uses"
      },
      {
        "from": "de-prop-improv",
        "to": "de-prop-lim-improv",
        "type": "uses"
      },
      {
        "from": "key-ident",
        "to": "de-prop",
        "type": "uses"
      },
      {
        "from": "key-ident",
        "to": "averaged-construct-good",
        "type": "uses"
      },
      {
        "from": "averaged-construct-good",
        "to": "de-prop-improv",
        "type": "uses"
      },
      {
        "from": "dist-diff-bound",
        "to": "de-prop-improv",
        "type": "uses"
      },
      {
        "from": "de-prop-lim-improv",
        "to": "entropy-pfr-improv",
        "type": "uses"
      },
      {
        "from": "app-ent-pfr",
        "to": "pfr-projection'",
        "type": "uses"
      },
      {
        "from": "pfr-projection'",
        "to": "pfr-projection",
        "type": "uses"
      },
      {
        "from": "pfr-projection",
        "to": "weak-pfr-asymm",
        "type": "uses"
      },
      {
        "from": "rho-cond-sym",
        "to": "rho-increase",
        "type": "uses"
      },
      {
        "from": "rho-increase",
        "to": "rho-increase-symmetrized",
        "type": "uses"
      },
      {
        "from": "rho-increase-symmetrized",
        "to": "phi-minimizer-zero-distance",
        "type": "uses"
      },
      {
        "from": "uniform-entropy-II",
        "to": "pfr_aux-improv",
        "type": "uses"
      },
      {
        "from": "approx-hom-pfr",
        "to": "approx-hom-pfr-no-const",
        "type": "uses"
      },
      {
        "from": "cor-fibre",
        "to": "rho-increase",
        "type": "uses"
      },
      {
        "from": "cor-fibre",
        "to": "first-fibre",
        "type": "uses"
      },
      {
        "from": "cor-fibre",
        "to": "gen-ineq",
        "type": "uses"
      },
      {
        "from": "entropic-bsg",
        "to": "construct-good-prelim",
        "type": "uses"
      },
      {
        "from": "entropic-bsg",
        "to": "construct-good-prelim-improv",
        "type": "uses"
      },
      {
        "from": "entropic-bsg",
        "to": "lem:get-better",
        "type": "uses"
      },
      {
        "from": "entropic-bsg",
        "to": "rho-BSG-triplet",
        "type": "uses"
      },
      {
        "from": "sign-flip",
        "to": "sum-dilate-II",
        "type": "uses"
      },
      {
        "from": "ruzsa-triangle-improved",
        "to": "sum-dilate-I",
        "type": "uses"
      },
      {
        "from": "ruzsa-triangle-improved",
        "to": "ruzsa-triangle",
        "type": "uses"
      },
      {
        "from": "sym-zero",
        "to": "pfr-rho",
        "type": "uses"
      },
      {
        "from": "sym-zero",
        "to": "lem:100pc-self",
        "type": "uses"
      },
      {
        "from": "cond-trial-ent",
        "to": "entropic-bsg",
        "type": "uses"
      },
      {
        "from": "multidist-ruzsa-III",
        "to": "k-vanish",
        "type": "uses"
      },
      {
        "from": "multidist-ruzsa-III",
        "to": "tau-ref",
        "type": "uses"
      },
      {
        "from": "ruzsa-diff",
        "to": "dist-projection",
        "type": "uses"
      },
      {
        "from": "ruzsa-diff",
        "to": "klm-2",
        "type": "uses"
      },
      {
        "from": "ruzsa-diff",
        "to": "torsion-free-doubling",
        "type": "uses"
      },
      {
        "from": "ruzsa-diff",
        "to": "ruzsa-nonneg",
        "type": "uses"
      },
      {
        "from": "multidist-ruzsa-IV",
        "to": "ent-w",
        "type": "uses"
      },
      {
        "from": "multidist-nonneg",
        "to": "k-vanish",
        "type": "uses"
      },
      {
        "from": "multidist-nonneg",
        "to": "tau-ref",
        "type": "uses"
      },
      {
        "from": "multidist-nonneg",
        "to": "cond-multidist-nonneg",
        "type": "uses"
      },
      {
        "from": "multidist-ruzsa-I",
        "to": "multidist-ruzsa-II",
        "type": "uses"
      },
      {
        "from": "multidist-ruzsa-I",
        "to": "multi-zero",
        "type": "uses"
      },
      {
        "from": "multidist-perm",
        "to": "cond-multidist-lower-II",
        "type": "uses"
      },
      {
        "from": "prop:52",
        "to": "k-vanish",
        "type": "uses"
      },
      {
        "from": "multidist-ruzsa-II",
        "to": "xi-z2-w-dist",
        "type": "uses"
      },
      {
        "from": "xi-z2-w-dist",
        "to": "k-vanish",
        "type": "uses"
      },
      {
        "from": "k-vanish",
        "to": "main-entropy",
        "type": "uses"
      },
      {
        "from": "first-fibre",
        "to": "first-estimate",
        "type": "uses"
      },
      {
        "from": "first-fibre",
        "to": "foursum-bound",
        "type": "uses"
      },
      {
        "from": "first-fibre",
        "to": "I1-I2-diff",
        "type": "uses"
      },
      {
        "from": "first-fibre",
        "to": "phi-first-estimate",
        "type": "uses"
      },
      {
        "from": "gen-ineq",
        "to": "dist-diff-bound",
        "type": "uses"
      },
      {
        "from": "I1-I2-diff",
        "to": "phi-second-estimate",
        "type": "uses"
      },
      {
        "from": "phi-first-estimate",
        "to": "phi-minimizer-zero-distance",
        "type": "uses"
      },
      {
        "from": "phi-second-estimate",
        "to": "phi-minimizer-zero-distance",
        "type": "uses"
      },
      {
        "from": "second-estimate",
        "to": "uvw-s",
        "type": "uses"
      },
      {
        "from": "phi-minimizer-zero-distance",
        "to": "pfr-rho",
        "type": "uses"
      },
      {
        "from": "rhominus-def",
        "to": "rhoplus-def",
        "type": "uses"
      },
      {
        "from": "rhominus-def",
        "to": "rhominus-subgroup",
        "type": "uses"
      },
      {
        "from": "rhoplus-def",
        "to": "rho-def",
        "type": "uses"
      },
      {
        "from": "rhoplus-def",
        "to": "rhoplus-subgroup",
        "type": "uses"
      },
      {
        "from": "rhominus-subgroup",
        "to": "rhoplus-subgroup",
        "type": "uses"
      },
      {
        "from": "rho-def",
        "to": "rho-subgroup",
        "type": "uses"
      },
      {
        "from": "rho-def",
        "to": "rho-cts",
        "type": "uses"
      },
      {
        "from": "rho-def",
        "to": "rho-invariant",
        "type": "uses"
      },
      {
        "from": "rhoplus-subgroup",
        "to": "rho-subgroup",
        "type": "uses"
      },
      {
        "from": "conditional-mutual-alt",
        "to": "symm-lemma",
        "type": "uses"
      },
      {
        "from": "conditional-mutual-alt",
        "to": "cond-trial-ent",
        "type": "uses"
      },
      {
        "from": "conditional-mutual-alt",
        "to": "fibring-ident",
        "type": "uses"
      },
      {
        "from": "conditional-mutual-alt",
        "to": "multidist-chain-rule",
        "type": "uses"
      },
      {
        "from": "fibring-ident",
        "to": "cor-fibre",
        "type": "uses"
      },
      {
        "from": "fibring-ident",
        "to": "fibring-ineq",
        "type": "uses"
      },
      {
        "from": "fibring-ident",
        "to": "single-fibres",
        "type": "uses"
      },
      {
        "from": "multidist-chain-rule",
        "to": "multidist-chain-rule-cond",
        "type": "uses"
      },
      {
        "from": "fibring-ineq",
        "to": "torsion-dist-shrinking",
        "type": "uses"
      },
      {
        "from": "single-fibres",
        "to": "weak-pfr-asymm",
        "type": "uses"
      },
      {
        "from": "multidist-chain-rule-cond",
        "to": "multidist-chain-rule-iter",
        "type": "uses"
      },
      {
        "from": "first-cond",
        "to": "first-estimate",
        "type": "uses"
      },
      {
        "from": "first-cond",
        "to": "foursum-bound",
        "type": "uses"
      },
      {
        "from": "rho-cond-relabeled",
        "to": "rho-increase",
        "type": "uses"
      },
      {
        "from": "pfr-rho",
        "to": "pfr-9-aux",
        "type": "uses"
      },
      {
        "from": "weak-pfr-asymm",
        "to": "weak-pfr-symm",
        "type": "uses"
      },
      {
        "from": "weak-pfr-symm",
        "to": "weak-pfr-int",
        "type": "uses"
      },
      {
        "from": "dimension-def",
        "to": "weak-pfr-asymm",
        "type": "uses"
      },
      {
        "from": "cond-dist-alt",
        "to": "fibring-ident",
        "type": "uses"
      },
      {
        "from": "cond-dist-alt",
        "to": "cond-dist-fact",
        "type": "uses"
      },
      {
        "from": "cond-dist-fact",
        "to": "xi-z2-w-dist",
        "type": "uses"
      },
      {
        "from": "cond-dist-fact",
        "to": "construct-good-prelim",
        "type": "uses"
      },
      {
        "from": "cond-dist-fact",
        "to": "first-useful",
        "type": "uses"
      },
      {
        "from": "construct-good-prelim",
        "to": "construct-good",
        "type": "uses"
      },
      {
        "from": "first-useful",
        "to": "first-upper",
        "type": "uses"
      },
      {
        "from": "first-useful",
        "to": "gen-ineq",
        "type": "uses"
      },
      {
        "from": "first-useful",
        "to": "lem:get-better",
        "type": "uses"
      },
      {
        "from": "first-useful",
        "to": "dist-sums",
        "type": "uses"
      },
      {
        "from": "first-useful",
        "to": "second-useful",
        "type": "uses"
      },
      {
        "from": "construct-good-prelim-improv",
        "to": "construct-good-improv",
        "type": "uses"
      },
      {
        "from": "lem:get-better",
        "to": "k-vanish",
        "type": "uses"
      },
      {
        "from": "rho-BSG-triplet",
        "to": "rho-BSG-triplet-symmetrized",
        "type": "uses"
      },
      {
        "from": "construct-good",
        "to": "de-prop",
        "type": "uses"
      },
      {
        "from": "construct-good-improv",
        "to": "averaged-construct-good",
        "type": "uses"
      },
      {
        "from": "rho-BSG-triplet-symmetrized",
        "to": "phi-minimizer-zero-distance",
        "type": "uses"
      },
      {
        "from": "klm-3",
        "to": "xi-z2-w-dist",
        "type": "uses"
      },
      {
        "from": "rho-subgroup",
        "to": "pfr-9-aux",
        "type": "uses"
      },
      {
        "from": "pfr-9-aux",
        "to": "pfr-9-aux'",
        "type": "uses"
      },
      {
        "from": "pfr-9-aux",
        "to": "pfr-9",
        "type": "uses"
      },
      {
        "from": "rho-cts",
        "to": "phi-min-exist",
        "type": "uses"
      },
      {
        "from": "phi-min-exist",
        "to": "pfr-rho",
        "type": "uses"
      },
      {
        "from": "rho-sums-sym",
        "to": "rho-increase",
        "type": "uses"
      },
      {
        "from": "sum-dilate-II",
        "to": "ent-z2",
        "type": "uses"
      },
      {
        "from": "klm-1",
        "to": "multidist-ruzsa-III",
        "type": "uses"
      },
      {
        "from": "klm-1",
        "to": "compare-sums",
        "type": "uses"
      },
      {
        "from": "klm-1",
        "to": "klm-2",
        "type": "uses"
      },
      {
        "from": "klm-1",
        "to": "ent-z2",
        "type": "uses"
      },
      {
        "from": "klm-1",
        "to": "ent-w",
        "type": "uses"
      },
      {
        "from": "sum-dilate-I",
        "to": "sum-dilate-II",
        "type": "uses"
      },
      {
        "from": "ruzsa-triangle",
        "to": "multidist-ruzsa-II",
        "type": "uses"
      },
      {
        "from": "ruzsa-triangle",
        "to": "multidist-lower",
        "type": "uses"
      },
      {
        "from": "ruzsa-triangle",
        "to": "torsion-free-doubling",
        "type": "uses"
      },
      {
        "from": "ruzsa-triangle",
        "to": "lem:100pc",
        "type": "uses"
      },
      {
        "from": "copy-ent",
        "to": "symm-lemma",
        "type": "uses"
      },
      {
        "from": "copy-ent",
        "to": "ruz-copy",
        "type": "uses"
      },
      {
        "from": "copy-ent",
        "to": "tau-copy",
        "type": "uses"
      },
      {
        "from": "copy-ent",
        "to": "ruz-indep",
        "type": "uses"
      },
      {
        "from": "ruz-copy",
        "to": "zero-large",
        "type": "uses"
      },
      {
        "from": "ruz-copy",
        "to": "sign-flip",
        "type": "uses"
      },
      {
        "from": "ruz-copy",
        "to": "multidist-ruzsa-III",
        "type": "uses"
      },
      {
        "from": "ruz-copy",
        "to": "multidist-ruzsa-I",
        "type": "uses"
      },
      {
        "from": "ruz-copy",
        "to": "cond-dist-alt",
        "type": "uses"
      },
      {
        "from": "ruz-copy",
        "to": "ruzsa-triangle",
        "type": "uses"
      },
      {
        "from": "tau-copy",
        "to": "tau-min",
        "type": "uses"
      },
      {
        "from": "ruz-indep",
        "to": "zero-large",
        "type": "uses"
      },
      {
        "from": "ruz-indep",
        "to": "entropic-bsg",
        "type": "uses"
      },
      {
        "from": "ruz-indep",
        "to": "sign-flip",
        "type": "uses"
      },
      {
        "from": "ruz-indep",
        "to": "multidist-ruzsa-III",
        "type": "uses"
      },
      {
        "from": "ruz-indep",
        "to": "multidist-ruzsa-IV",
        "type": "uses"
      },
      {
        "from": "ruz-indep",
        "to": "multidist-ruzsa-I",
        "type": "uses"
      },
      {
        "from": "ruz-indep",
        "to": "cond-dist-alt",
        "type": "uses"
      },
      {
        "from": "ruz-indep",
        "to": "klm-3",
        "type": "uses"
      },
      {
        "from": "ruz-indep",
        "to": "ruzsa-triangle",
        "type": "uses"
      },
      {
        "from": "ruz-indep",
        "to": "klm-2",
        "type": "uses"
      },
      {
        "from": "tau-min",
        "to": "distance-lower",
        "type": "uses"
      },
      {
        "from": "dist-sums",
        "to": "second-estimate-aux",
        "type": "uses"
      },
      {
        "from": "second-useful",
        "to": "total-dist",
        "type": "uses"
      },
      {
        "from": "data-process",
        "to": "prop:52",
        "type": "uses"
      },
      {
        "from": "torsion-dist-shrinking",
        "to": "weak-pfr-asymm",
        "type": "uses"
      },
      {
        "from": "relabeled-entropy",
        "to": "multidist-chain-rule",
        "type": "uses"
      },
      {
        "from": "relabeled-entropy",
        "to": "ruz-indep",
        "type": "uses"
      },
      {
        "from": "relabeled-entropy",
        "to": "neg-ent",
        "type": "uses"
      },
      {
        "from": "relabeled-entropy",
        "to": "data-process-single",
        "type": "uses"
      },
      {
        "from": "relabeled-entropy",
        "to": "relabeled-entropy-cond",
        "type": "uses"
      },
      {
        "from": "relabeled-entropy",
        "to": "entropy-comm",
        "type": "uses"
      },
      {
        "from": "neg-ent",
        "to": "sign-flip",
        "type": "uses"
      },
      {
        "from": "neg-ent",
        "to": "sum-dilate-I",
        "type": "uses"
      },
      {
        "from": "neg-ent",
        "to": "sumset-lower-gen",
        "type": "uses"
      },
      {
        "from": "neg-ent",
        "to": "ruzsa-symm",
        "type": "uses"
      },
      {
        "from": "data-process-single",
        "to": "sign-flip",
        "type": "uses"
      },
      {
        "from": "relabeled-entropy-cond",
        "to": "zero-large",
        "type": "uses"
      },
      {
        "from": "relabeled-entropy-cond",
        "to": "cor-fibre",
        "type": "uses"
      },
      {
        "from": "relabeled-entropy-cond",
        "to": "shear-ent",
        "type": "uses"
      },
      {
        "from": "entropy-comm",
        "to": "alternative-mutual",
        "type": "uses"
      },
      {
        "from": "sumset-lower-gen",
        "to": "sumset-lower",
        "type": "uses"
      },
      {
        "from": "sumset-lower-gen",
        "to": "sumset-lower-gen-cond",
        "type": "uses"
      },
      {
        "from": "shear-ent",
        "to": "sumset-lower-gen",
        "type": "uses"
      },
      {
        "from": "alternative-mutual",
        "to": "mutual-nonneg",
        "type": "uses"
      },
      {
        "from": "alternative-mutual",
        "to": "zero-large",
        "type": "uses"
      },
      {
        "from": "data-process-unc-one",
        "to": "data-process-unc",
        "type": "uses"
      },
      {
        "from": "data-process-unc",
        "to": "data-process",
        "type": "uses"
      },
      {
        "from": "tau-ref",
        "to": "main-entropy",
        "type": "uses"
      },
      {
        "from": "rho-cond",
        "to": "rho-cond-sym",
        "type": "uses"
      },
      {
        "from": "cs-bound",
        "to": "approx-hom-pfr",
        "type": "uses"
      },
      {
        "from": "tau-def-multi",
        "to": "tau-min-exist-multi",
        "type": "uses"
      },
      {
        "from": "tau-def-multi",
        "to": "tau-min-multi",
        "type": "uses"
      },
      {
        "from": "tau-min-exist-multi",
        "to": "main-entropy",
        "type": "uses"
      },
      {
        "from": "tau-min-multi",
        "to": "tau-ref",
        "type": "uses"
      },
      {
        "from": "tau-min-multi",
        "to": "multidist-lower",
        "type": "uses"
      },
      {
        "from": "multidist-lower",
        "to": "cond-multidist-lower",
        "type": "uses"
      },
      {
        "from": "conditional-nonneg",
        "to": "multidist-chain-rule-iter",
        "type": "uses"
      },
      {
        "from": "multidist-chain-rule-iter",
        "to": "cor-multid",
        "type": "uses"
      },
      {
        "from": "torsion-free-doubling",
        "to": "torsion-dist-shrinking",
        "type": "uses"
      },
      {
        "from": "ruzsa-nonneg",
        "to": "fibring-ineq",
        "type": "uses"
      },
      {
        "from": "ruzsa-nonneg",
        "to": "lem:100pc",
        "type": "uses"
      },
      {
        "from": "lem:100pc",
        "to": "entropy-pfr",
        "type": "uses"
      },
      {
        "from": "lem:100pc",
        "to": "multi-zero",
        "type": "uses"
      },
      {
        "from": "lem:100pc",
        "to": "entropy-pfr-improv",
        "type": "uses"
      },
      {
        "from": "ent-z2",
        "to": "xi-z2-w-dist",
        "type": "uses"
      },
      {
        "from": "kl-div-convex",
        "to": "kl-sums",
        "type": "uses"
      },
      {
        "from": "kl-sums",
        "to": "rho-sums",
        "type": "uses"
      },
      {
        "from": "rho-sums",
        "to": "rho-sums-sym",
        "type": "uses"
      },
      {
        "from": "multidist-def",
        "to": "multidist-nonneg",
        "type": "uses"
      },
      {
        "from": "multidist-def",
        "to": "multidist-perm",
        "type": "uses"
      },
      {
        "from": "multidist-def",
        "to": "multidist-chain-rule",
        "type": "uses"
      },
      {
        "from": "multidist-def",
        "to": "tau-def-multi",
        "type": "uses"
      },
      {
        "from": "multidist-def",
        "to": "cond-multidist-def",
        "type": "uses"
      },
      {
        "from": "multidist-def",
        "to": "multidist-copy",
        "type": "uses"
      },
      {
        "from": "multidist-def",
        "to": "multidist-indep",
        "type": "uses"
      },
      {
        "from": "cond-multidist-def",
        "to": "cond-multidist-alt",
        "type": "uses"
      },
      {
        "from": "cond-multidist-def",
        "to": "cond-multidist-nonneg",
        "type": "uses"
      },
      {
        "from": "multidist-copy",
        "to": "multidist-ruzsa-III",
        "type": "uses"
      },
      {
        "from": "multidist-copy",
        "to": "multidist-ruzsa-I",
        "type": "uses"
      },
      {
        "from": "multidist-indep",
        "to": "multidist-ruzsa-III",
        "type": "uses"
      },
      {
        "from": "multidist-indep",
        "to": "multidist-ruzsa-IV",
        "type": "uses"
      },
      {
        "from": "multidist-indep",
        "to": "multidist-ruzsa-I",
        "type": "uses"
      },
      {
        "from": "ent-w",
        "to": "mutual-w-z2",
        "type": "uses"
      },
      {
        "from": "cond-multidist-alt",
        "to": "cond-multidist-lower",
        "type": "uses"
      },
      {
        "from": "cond-multidist-lower",
        "to": "cond-multidist-lower-II",
        "type": "uses"
      },
      {
        "from": "multi-zero",
        "to": "main-entropy",
        "type": "uses"
      },
      {
        "from": "mutual-w-z2",
        "to": "xi-z2-w-dist",
        "type": "uses"
      },
      {
        "from": "log-sum",
        "to": "rhominus-subgroup",
        "type": "uses"
      },
      {
        "from": "log-sum",
        "to": "kl-div-convex",
        "type": "uses"
      },
      {
        "from": "distance-lower",
        "to": "construct-good-prelim",
        "type": "uses"
      },
      {
        "from": "distance-lower",
        "to": "construct-good-prelim-improv",
        "type": "uses"
      },
      {
        "from": "distance-lower",
        "to": "dist-sums",
        "type": "uses"
      },
      {
        "from": "distance-lower",
        "to": "first-dist-sum",
        "type": "uses"
      },
      {
        "from": "distance-lower",
        "to": "cond-distance-lower",
        "type": "uses"
      },
      {
        "from": "first-dist-sum",
        "to": "first-estimate",
        "type": "uses"
      },
      {
        "from": "cond-distance-lower",
        "to": "first-cond",
        "type": "uses"
      },
      {
        "from": "uniform-def",
        "to": "uniform-entropy-II",
        "type": "uses"
      },
      {
        "from": "uniform-def",
        "to": "sym-zero",
        "type": "uses"
      },
      {
        "from": "uniform-def",
        "to": "unif-exist",
        "type": "uses"
      },
      {
        "from": "unif-exist",
        "to": "pfr_aux-improv",
        "type": "uses"
      },
      {
        "from": "lem:100pc-self",
        "to": "lem:100pc",
        "type": "uses"
      },
      {
        "from": "entropy-pfr-improv",
        "to": "pfr_aux-improv",
        "type": "uses"
      },
      {
        "from": "entropy-pfr-improv",
        "to": "app-ent-pfr",
        "type": "uses"
      },
      {
        "from": "alt-submodularity",
        "to": "sign-flip",
        "type": "uses"
      },
      {
        "from": "alt-submodularity",
        "to": "ruzsa-triangle-improved",
        "type": "uses"
      },
      {
        "from": "independent-def",
        "to": "vanish-entropy",
        "type": "uses"
      },
      {
        "from": "independent-def",
        "to": "independent-exist",
        "type": "uses"
      },
      {
        "from": "independent-exist",
        "to": "ruz-dist-def",
        "type": "uses"
      },
      {
        "from": "ruz-dist-def",
        "to": "ruzsa-diff",
        "type": "uses"
      },
      {
        "from": "ruz-dist-def",
        "to": "ruzsa-growth",
        "type": "uses"
      },
      {
        "from": "ruz-dist-def",
        "to": "ruz-copy",
        "type": "uses"
      },
      {
        "from": "ruz-dist-def",
        "to": "ruz-indep",
        "type": "uses"
      },
      {
        "from": "ruz-dist-def",
        "to": "ruzsa-symm",
        "type": "uses"
      },
      {
        "from": "ruz-dist-def",
        "to": "tau-def",
        "type": "uses"
      },
      {
        "from": "ruz-dist-def",
        "to": "dist-zero",
        "type": "uses"
      },
      {
        "from": "ruz-dist-def",
        "to": "cond-dist-def",
        "type": "uses"
      },
      {
        "from": "conditional-mutual-def",
        "to": "conditional-mutual-alt",
        "type": "uses"
      },
      {
        "from": "conditional-mutual-def",
        "to": "data-process",
        "type": "uses"
      },
      {
        "from": "conditional-mutual-def",
        "to": "sumset-lower-gen-cond",
        "type": "uses"
      },
      {
        "from": "conditional-mutual-def",
        "to": "conditional-nonneg",
        "type": "uses"
      },
      {
        "from": "cond-indep-exist",
        "to": "entropic-bsg",
        "type": "uses"
      },
      {
        "from": "cond-indep-exist",
        "to": "sign-flip",
        "type": "uses"
      },
      {
        "from": "ckl-div",
        "to": "Conditional-Gibbs",
        "type": "uses"
      },
      {
        "from": "ckl-div",
        "to": "kl-cond",
        "type": "uses"
      },
      {
        "from": "kl-cond",
        "to": "rho-cond",
        "type": "uses"
      },
      {
        "from": "chain-rule",
        "to": "symm-lemma",
        "type": "uses"
      },
      {
        "from": "chain-rule",
        "to": "multidist-chain-rule",
        "type": "uses"
      },
      {
        "from": "chain-rule",
        "to": "data-process-single",
        "type": "uses"
      },
      {
        "from": "chain-rule",
        "to": "shear-ent",
        "type": "uses"
      },
      {
        "from": "chain-rule",
        "to": "alternative-mutual",
        "type": "uses"
      },
      {
        "from": "chain-rule",
        "to": "conditional-chain-rule",
        "type": "uses"
      },
      {
        "from": "rho-cond-def",
        "to": "rho-cond-relabeled",
        "type": "uses"
      },
      {
        "from": "rho-cond-def",
        "to": "rho-cond-invariant",
        "type": "uses"
      },
      {
        "from": "bound-conc",
        "to": "pfr_aux-improv",
        "type": "uses"
      },
      {
        "from": "rho-invariant",
        "to": "rho-cond-sym",
        "type": "uses"
      },
      {
        "from": "rho-invariant",
        "to": "rho-cond-invariant",
        "type": "uses"
      },
      {
        "from": "condition-event-def",
        "to": "conditional-mutual-def",
        "type": "uses"
      },
      {
        "from": "condition-event-def",
        "to": "conditional-entropy-def",
        "type": "uses"
      },
      {
        "from": "conditional-entropy-def",
        "to": "cond-dist-alt",
        "type": "uses"
      },
      {
        "from": "conditional-entropy-def",
        "to": "relabeled-entropy-cond",
        "type": "uses"
      },
      {
        "from": "conditional-entropy-def",
        "to": "cond-multidist-alt",
        "type": "uses"
      },
      {
        "from": "conditional-entropy-def",
        "to": "chain-rule",
        "type": "uses"
      },
      {
        "from": "phi-min-def",
        "to": "phi-first-estimate",
        "type": "uses"
      },
      {
        "from": "phi-min-def",
        "to": "phi-second-estimate",
        "type": "uses"
      },
      {
        "from": "phi-min-def",
        "to": "rho-BSG-triplet",
        "type": "uses"
      },
      {
        "from": "sym-group",
        "to": "lem:100pc-self",
        "type": "uses"
      },
      {
        "from": "conditional-independent-def",
        "to": "conditional-vanish",
        "type": "uses"
      },
      {
        "from": "conditional-independent-def",
        "to": "cond-indep-exist",
        "type": "uses"
      },
      {
        "from": "tau-min-def",
        "to": "tau-min",
        "type": "uses"
      },
      {
        "from": "tau-def",
        "to": "tau-copy",
        "type": "uses"
      },
      {
        "from": "tau-def",
        "to": "main-entropy",
        "type": "uses"
      },
      {
        "from": "tau-def",
        "to": "tau-min-def",
        "type": "uses"
      },
      {
        "from": "energy-def",
        "to": "cs-bound",
        "type": "uses"
      },
      {
        "from": "dist-zero",
        "to": "torsion-dist-shrinking",
        "type": "uses"
      },
      {
        "from": "entropy-def",
        "to": "jensen-bound",
        "type": "uses"
      },
      {
        "from": "entropy-def",
        "to": "uniform-entropy",
        "type": "uses"
      },
      {
        "from": "entropy-def",
        "to": "uniform-entropy-II",
        "type": "uses"
      },
      {
        "from": "entropy-def",
        "to": "copy-ent",
        "type": "uses"
      },
      {
        "from": "entropy-def",
        "to": "relabeled-entropy",
        "type": "uses"
      },
      {
        "from": "entropy-def",
        "to": "ruz-dist-def",
        "type": "uses"
      },
      {
        "from": "entropy-def",
        "to": "bound-conc",
        "type": "uses"
      },
      {
        "from": "entropy-def",
        "to": "conditional-entropy-def",
        "type": "uses"
      },
      {
        "from": "entropy-def",
        "to": "information-def",
        "type": "uses"
      },
      {
        "from": "information-def",
        "to": "vanish-entropy",
        "type": "uses"
      },
      {
        "from": "information-def",
        "to": "alternative-mutual",
        "type": "uses"
      },
      {
        "from": "information-def",
        "to": "conditional-mutual-def",
        "type": "uses"
      },
      {
        "from": "cond-dist-def",
        "to": "cond-dist-alt",
        "type": "uses"
      },
      {
        "from": "cond-dist-def",
        "to": "cond-distance-lower",
        "type": "uses"
      },
      {
        "from": "kl-div-inj",
        "to": "kl-sums",
        "type": "uses"
      },
      {
        "from": "kl-div-inj",
        "to": "rho-invariant",
        "type": "uses"
      },
      {
        "from": "sym-group-def",
        "to": "zero-large",
        "type": "uses"
      },
      {
        "from": "sym-group-def",
        "to": "sym-group",
        "type": "uses"
      },
      {
        "from": "eta-def-multi",
        "to": "k-vanish",
        "type": "uses"
      },
      {
        "from": "more-random",
        "to": "prop:52",
        "type": "uses"
      },
      {
        "from": "more-random",
        "to": "ent-z2",
        "type": "uses"
      },
      {
        "from": "more-random",
        "to": "ent-w",
        "type": "uses"
      },
      {
        "from": "more-random",
        "to": "Zero-sum",
        "type": "uses"
      },
      {
        "from": "Zero-sum",
        "to": "k-vanish",
        "type": "uses"
      },
      {
        "from": "eta-def",
        "to": "tau-def",
        "type": "uses"
      },
      {
        "from": "kl-div",
        "to": "kl-div-copy",
        "type": "uses"
      },
      {
        "from": "kl-div",
        "to": "kl-div-convex",
        "type": "uses"
      },
      {
        "from": "kl-div",
        "to": "ckl-div",
        "type": "uses"
      },
      {
        "from": "kl-div",
        "to": "kl-div-inj",
        "type": "uses"
      },
      {
        "from": "ruz-cov",
        "to": "pfr_aux-improv",
        "type": "uses"
      },
      {
        "from": "ruz-cov",
        "to": "pfr-9-aux'",
        "type": "uses"
      },
      {
        "from": "ruz-cov",
        "to": "pfr-9",
        "type": "uses"
      }
    ]
  };
  if (typeof g.PaperDiagramData === "object" && g.PaperDiagramData) g.PaperDiagramData["pfr-lean"] = D;
  else g.PaperDiagramData = { "pfr-lean": D };
  if (typeof module !== "undefined" && module.exports) module.exports = D;
})(typeof window !== "undefined" ? window : globalThis);
