// Library diagram for the paper-diagram viewer — lazy-loaded on demand.
// Continuous Petrov–Galerkin methods for nonlinear problems — a READER-CONTRIBUTED
// diagram by Tim Ktitarev, from his 2025 TU Darmstadt bachelor thesis (LLM-generated
// from the text via Gemini, then hand-refined). Added to the library catalogue.
;(function (g) {
  var D = {
    "format": "paper-diagram",
    "schemaVersion": 1,
    "meta": {
      "title": "Continuous Petrov–Galerkin methods for nonlinear problems",
      "paper": {
        "authors": [
          "Tim Ktitarev"
        ],
        "year": 2025,
        "journal": "Bachelor thesis, TU Darmstadt",
        "note": "A reader-contributed diagram. Tim Ktitarev built this from his 2025 TU Darmstadt bachelor thesis “Continuous Petrov–Galerkin methods for nonlinear problems” (doi.org/10.26083/tuprints-00031371), generating the JSON with an LLM (Google Gemini) and refining it to surface the dependencies implicit in the text. Contributed via the paper-diagram-visualizer discussion."
      }
    },
    "nodes": [
      {
        "id": "def:1.1",
        "kind": "definition",
        "label": "Def 1.1",
        "name": "Initial Value Problem",
        "weight": 4,
        "statement": "For a function $\\mathbf{f}\\colon I \\times \\mathbb{R}^d \\to \\mathbb{R}^d$ and an initial value $\\mathbf{u}_0 \\in \\mathbb{R}^d$, find $\\mathbf{u}\\in C^1(I)$ such that $\\mathbf{u}'(t) = \\mathbf{f}(t,\\mathbf{u}(t))$ and $\\mathbf{u}(t_0) = \\mathbf{u}_0$.",
        "plain": "Finding a function given its starting state and a continuous rule for its evolution.",
        "section": "1.1"
      },
      {
        "id": "def:1.2",
        "kind": "definition",
        "label": "Def 1.2",
        "name": "Lipschitz Continuity",
        "weight": 2,
        "statement": "A function $\\mathbf{f}$ is Lipschitz continuous in the second argument if there exists $L > 0$ such that $\\|\\mathbf{f}(t,\\mathbf{v}) - \\mathbf{f}(t,\\mathbf{w})\\| \\leq L \\|\\mathbf{v} - \\mathbf{w}\\|$.",
        "plain": "A bound on how fast a function can change with respect to its spatial variables.",
        "section": "1.1"
      },
      {
        "id": "thm:1.3",
        "kind": "theorem",
        "label": "Thm 1.3",
        "name": "Picard-Lindelöf",
        "weight": 3,
        "statement": "If $\\mathbf{f} \\in \\mathrm{Lip}$, then there exists a unique $\\mathbf{u} \\in C^1(I)$ such that the initial value problem holds.",
        "plain": "A unique solution to the IVP exists if the governing function is Lipschitz continuous.",
        "section": "1.1",
        "external": true,
        "ref": "Amann1990"
      },
      {
        "id": "def:1.4",
        "kind": "definition",
        "label": "Def 1.4",
        "name": "Decomposition",
        "weight": 1,
        "statement": "A decomposition of $I = [a,b]$ consists of finite time points $a = t_0 < t_1 < \\cdots < t_N = b$.",
        "plain": "A discrete grid of time points slicing an interval.",
        "section": "1.1"
      },
      {
        "id": "def:1.5",
        "kind": "definition",
        "label": "Def 1.5",
        "name": "Numerical Scheme",
        "weight": 2,
        "statement": "A scheme that maps data $\\mathbf{u}_0$ and $\\mathbf{f}$ to a discrete approximation $\\mathbf{y}_\\tau \\subset \\mathbb{R}^d$ on a decomposition $I_\\tau$.",
        "plain": "An algorithm generating a discrete sequence of approximate values.",
        "section": "1.1"
      },
      {
        "id": "def:1.6",
        "kind": "definition",
        "label": "Def 1.6",
        "name": "Discrete Convergence",
        "weight": 3,
        "statement": "A numerical scheme converges if $\\lim_{m\\to\\infty} \\max_{n} \\|\\mathbf{u}(t_n) - \\mathbf{y}_{\\tau^{(m)},n}\\| = 0$ as maximum mesh size $\\tau \\to 0$.",
        "plain": "The discrete approximation approaches the exact solution at grid points as the grid gets infinitely fine.",
        "section": "1.1"
      },
      {
        "id": "def:1.7",
        "kind": "definition",
        "label": "Def 1.7",
        "name": "Forward Difference Quotient",
        "weight": 1,
        "statement": "$\\partial_\\tau^+ \\mathbf{y}_n \\coloneqq \\frac{\\mathbf{y}_{n+1} - \\mathbf{y}_{n}}{\\tau_{n+1}}$.",
        "plain": "A basic discrete approximation of a derivative looking forward in time.",
        "section": "1.2"
      },
      {
        "id": "def:1.8",
        "kind": "definition",
        "label": "Def 1.8",
        "name": "Explicit Euler Scheme",
        "weight": 2,
        "statement": "Compute $(\\mathbf{y}_n)$ such that $\\partial_\\tau^+ \\mathbf{y}_n = \\mathbf{f}(t_{n}, \\mathbf{y}_{n})$.",
        "plain": "The simplest numerical ODE solver using the forward difference quotient.",
        "section": "1.2"
      },
      {
        "id": "def:1.9",
        "kind": "definition",
        "label": "Def 1.9",
        "name": "Hamiltonian System",
        "weight": 4,
        "statement": "The initial value problem $\\mathbf{u}'(t) = J \\nabla \\mathcal{H}(\\mathbf{u}(t))$ for a skew-symmetric matrix $J$ and differentiable functional $\\mathcal{H}$.",
        "plain": "A physical system governed by an energy functional and a skew-symmetric matrix.",
        "section": "1.3"
      },
      {
        "id": "prop:1.10",
        "kind": "proposition",
        "label": "Prop 1.10",
        "name": "Energy Conservation",
        "weight": 4,
        "statement": "A solution $\\mathbf{u}$ to a Hamiltonian system satisfies $\\frac{\\mathrm{d}}{\\mathrm{d}t} \\mathcal{H}(\\mathbf{u}(t)) = 0$.",
        "plain": "Energy remains perfectly constant over time in a Hamiltonian system.",
        "section": "1.3"
      },
      {
        "id": "lem:1.11",
        "kind": "lemma",
        "label": "Lem 1.11",
        "name": "Skew-Symmetry Kernel",
        "weight": 2,
        "statement": "Let $J \\in \\mathbb{R}^{d\\times d}$ be skew-symmetric. Then $\\langle Jx,x \\rangle = 0$.",
        "plain": "A vector is always orthogonal to its transformation by a skew-symmetric matrix.",
        "section": "1.3"
      },
      {
        "id": "prop:2.1",
        "kind": "proposition",
        "label": "Prop 2.1",
        "name": "Variational Formulation",
        "weight": 3,
        "statement": "$\\int_I \\langle \\mathbf{u}'(t), \\mathbf{v}(t) \\rangle \\mathrm{d}t = \\int_I \\langle \\mathbf{f}(t,\\mathbf{u}(t)),\\mathbf{v}(t) \\rangle \\mathrm{d}t$ for all $\\mathbf{v} \\in C_c^\\infty(I)$ implies $\\mathbf{u}' = \\mathbf{f}$.",
        "plain": "Testing the equation against all smooth compact functions is equivalent to the classical differential equation.",
        "section": "2.1"
      },
      {
        "id": "def:2.2",
        "kind": "definition",
        "label": "Def 2.2",
        "name": "Piecewise Polynomial Spaces",
        "weight": 1,
        "statement": "$\\mathcal{L}_k^0(I_\\tau)$ represents discontinuous piecewise polynomials of degree $k$; $\\mathcal{L}_k^1(I_\\tau)$ is the continuous subset.",
        "plain": "Spaces of polynomials attached to the time grid, with or without enforced continuity.",
        "section": "2.2"
      },
      {
        "id": "def:2.3",
        "kind": "definition",
        "label": "Def 2.3",
        "name": "Exact cPG(k) Method",
        "weight": 5,
        "statement": "Find $\\mathbf{u}_\\tau \\in \\mathcal{L}_k^1(I_\\tau)$ satisfying $\\int_{t_0}^{T} \\langle\\mathbf{u}'_\\tau(t), \\mathbf{v}_\\tau(t)\\rangle \\mathrm{d}t = \\int_{t_0}^{T} \\langle\\mathbf{f}(t,\\mathbf{u}_\\tau(t)), \\mathbf{v}_\\tau(t)\\rangle \\mathrm{d}t$ for all $\\mathbf{v}_\\tau \\in \\mathcal{L}_{k-1}^0(I_\\tau)$.",
        "plain": "A Petrov-Galerkin scheme using continuous polynomials for the trial space and discontinuous polynomials for the test space.",
        "section": "2.2"
      },
      {
        "id": "def:2.4",
        "kind": "definition",
        "label": "Def 2.4",
        "name": "Continuous Numerical Scheme",
        "weight": 2,
        "statement": "A numerical scheme producing a globally continuous approximation $\\mathbf{y}_\\tau \\in C(I)$.",
        "plain": "A solver whose output is a continuous function over the entire interval, not just discrete points.",
        "section": "2.2"
      },
      {
        "id": "def:2.5",
        "kind": "definition",
        "label": "Def 2.5",
        "name": "Continuous Convergence",
        "weight": 3,
        "statement": "Convergence measured uniformly over the entire interval using $\\lim_{m\\to\\infty} \\|\\mathbf{u} - \\mathbf{y}_{\\tau^{(m)}}\\|_{C(I)} = 0$.",
        "plain": "The continuous approximation tends towards the exact solution uniformly everywhere as the grid shrinks.",
        "section": "2.2"
      },
      {
        "id": "def:2.6",
        "kind": "definition",
        "label": "Def 2.6",
        "name": "Localized cPG(k) Method",
        "weight": 2,
        "statement": "Evaluate the variational formulation step-by-step strictly on each subinterval $I_n$ using local test polynomials $\\mathbb{P}_{k-1}(I_n)$.",
        "plain": "A time-stepping version of the global cPG method that solves interval by interval.",
        "section": "2.3"
      },
      {
        "id": "lem:2.7",
        "kind": "lemma",
        "label": "Lem 2.7",
        "name": "Localization Equivalence",
        "weight": 3,
        "statement": "A function is a solution to the global cPG(k) method if and only if it solves the localized cPG(k) method.",
        "plain": "The global continuous formulation mathematically decomposes perfectly into a sequential time-stepping process.",
        "section": "2.3"
      },
      {
        "id": "prop:2.8",
        "kind": "proposition",
        "label": "Prop 2.8",
        "name": "Existence and Uniqueness",
        "weight": 4,
        "statement": "For sufficiently small mesh size $\\tau$, there exists a unique solution $\\mathbf{u}_\\tau \\in \\mathcal{L}_k^1(I_\\tau)$ to the exact cPG(k) method.",
        "plain": "The cPG(k) method is well-posed on adequately fine grids.",
        "section": "2.5"
      },
      {
        "id": "thm:2.9",
        "kind": "theorem",
        "label": "Thm 2.9",
        "name": "Banach Fixed-Point Theorem",
        "weight": 3,
        "statement": "A strict contraction $\\Phi$ on a closed subset $D$ of a Banach space has a unique fixed point.",
        "plain": "Iterative strict contractions inevitably converge to a unique point.",
        "section": "2.5",
        "external": true,
        "ref": "Ciesielski2007"
      },
      {
        "id": "prop:2.10",
        "kind": "proposition",
        "label": "Prop 2.10",
        "name": "Convergence Order",
        "weight": 5,
        "statement": "There exists a $C > 0$ such that $\\|\\mathbf{u} - \\mathbf{u}_\\tau\\|_{C(I)} \\leq C \\tau^{k+1} \\|\\mathbf{u}^{(k+1)}\\|_{C(I)}$.",
        "plain": "The cPG(k) method universally attains order k+1 convergence in the continuous supremum norm.",
        "section": "2.6"
      },
      {
        "id": "prop:2.12",
        "kind": "proposition",
        "label": "Prop 2.12",
        "name": "Special Interpolation Existence",
        "weight": 2,
        "statement": "For every $\\mathbf{u} \\in C^1(I)$ there exists a unique $\\mathbf{w}_\\tau \\in \\mathcal{L}_k^1(I_\\tau)$ fulfilling $\\int_I \\langle \\mathbf{w}_\\tau', \\mathbf{v}_\\tau \\rangle = \\int_I \\langle \\mathbf{u}', \\mathbf{v}_\\tau \\rangle$.",
        "plain": "An exact solution can always be weakly interpolated into the trial space by preserving its derivative.",
        "section": "2.6"
      },
      {
        "id": "def:2.13",
        "kind": "definition",
        "label": "Def 2.13",
        "name": "Operator R_k",
        "weight": 2,
        "statement": "The operator $R_k\\colon C^1(I) \\to \\mathcal{L}_k^1(I_\\tau)$ mapping $\\mathbf{u}$ to its unique weak derivative interpolant $\\mathbf{w}_\\tau$.",
        "plain": "A formal projection operator mapping continuous functions into the discrete trial space.",
        "section": "2.6"
      },
      {
        "id": "prop:2.14",
        "kind": "proposition",
        "label": "Prop 2.14",
        "name": "R_k Stability & Interpolation",
        "weight": 3,
        "statement": "$\\|R_k \\mathbf{u}\\|_{C(I)} \\leq C \\|\\mathbf{u}\\|_{C(I)}$ and $(R_k \\mathbf{u})(t_n) = \\mathbf{u}(t_n)$.",
        "plain": "The projection operator is bounded and evaluates exactly to the true function precisely on the grid nodes.",
        "section": "2.6"
      },
      {
        "id": "prop:2.15",
        "kind": "proposition",
        "label": "Prop 2.15",
        "name": "Consistency",
        "weight": 4,
        "statement": "$\\|\\mathbf{u} - R_k \\mathbf{u}\\|_{C(I)} \\leq C_R \\tau^{k+1} \\|\\mathbf{u}^{(k+1)}\\|_{C(I)}$.",
        "plain": "The method is consistent, as the projection error scales optimally with the mesh size.",
        "section": "2.6"
      },
      {
        "id": "prop:2.16",
        "kind": "proposition",
        "label": "Prop 2.16",
        "name": "Stability",
        "weight": 4,
        "statement": "$\\|\\mathbf{u}_\\tau - \\tilde{\\mathbf{u}}_\\tau\\|_{C(I)} \\leq C_S (\\|\\mathbf{u}_\\tau(t_0) - \\tilde{\\mathbf{u}}_\\tau(t_0)\\| + \\|\\theta\\|_{C(I)})$.",
        "plain": "Perturbations in initial data or continuous dynamics lead to bounded changes in the numerical solution.",
        "section": "2.6"
      },
      {
        "id": "def:2.17",
        "kind": "definition",
        "label": "Def 2.17",
        "name": "A-stability",
        "weight": 3,
        "statement": "A scheme is A-stable if approximate solutions to $u' = \\lambda u$ with $\\mathrm{Re}(\\lambda) < 0$ do not increase in magnitude over time.",
        "plain": "A property guaranteeing that solutions to dissipative model problems do not artificially blow up.",
        "section": "2.7"
      },
      {
        "id": "prop:2.19",
        "kind": "proposition",
        "label": "Prop 2.19",
        "name": "cPG(k) A-stability",
        "weight": 4,
        "statement": "The exact cPG(k) method is A-stable.",
        "plain": "The exact cPG(k) method successfully guarantees non-increasing outputs for stable continuous systems.",
        "section": "2.7",
        "external": true,
        "ref": "Schieweck2010"
      },
      {
        "id": "def:3.1",
        "kind": "definition",
        "label": "Def 3.1",
        "name": "L2-Projection",
        "weight": 2,
        "statement": "$\\Pi \\colon L^2(I) \\to \\mathcal{L}_{k-1}^0(I_\\tau)$ defined orthogonally via $\\int_I \\langle (\\Pi \\mathbf{v})(t),\\mathbf{w}(t)\\rangle \\mathrm{d}t = \\int_I \\langle \\mathbf{v}(t),\\mathbf{w}(t) \\rangle \\mathrm{d}t$.",
        "plain": "Standard orthogonal projection onto the test space of discontinuous polynomials.",
        "section": "3.1"
      },
      {
        "id": "lem:3.2",
        "kind": "lemma",
        "label": "Lem 3.2",
        "name": "L2-Projection Commutativity",
        "weight": 3,
        "statement": "$\\int_I \\langle A (\\Pi \\mathbf{v})(t),\\mathbf{w}(t)\\rangle \\mathrm{d}t = \\int_I \\langle (\\Pi A\\mathbf{v})(t),\\mathbf{w}(t)\\rangle \\mathrm{d}t$.",
        "plain": "The L2-projection seamlessly commutes with linear matrices inside the weak integral.",
        "section": "3.1"
      },
      {
        "id": "prop:3.3",
        "kind": "proposition",
        "label": "Prop 3.3",
        "name": "Discrete Energy Conservation",
        "weight": 5,
        "statement": "An approximation $\\mathbf{u}_\\tau$ to a Hamiltonian system using exact cPG(k) satisfies $\\mathcal{H}(\\mathbf{u}_\\tau(t_n)) = \\mathcal{H}(\\mathbf{u}_\\tau(t_{n-1}))$.",
        "plain": "The exact continuous method perfectly preserves Hamiltonian energy step-by-step.",
        "section": "3.1"
      },
      {
        "id": "def:3.4",
        "kind": "definition",
        "label": "Def 3.4",
        "name": "Gradient System",
        "weight": 2,
        "statement": "The initial value problem $\\mathbf{u}'(t) = - \\nabla \\mathcal{E} (\\mathbf{u}(t))$.",
        "plain": "A dynamical system driven purely by strictly decreasing a potential energy landscape.",
        "section": "3.2"
      },
      {
        "id": "prop:3.5",
        "kind": "proposition",
        "label": "Prop 3.5",
        "name": "Energy Dissipation",
        "weight": 3,
        "statement": "A solution $\\mathbf{u}$ of a gradient system satisfies $\\frac{\\mathrm{d}}{\\mathrm{d}t} \\mathcal{E}(\\mathbf{u}(t)) \\leq 0$.",
        "plain": "Gradient systems naturally lose energy over time.",
        "section": "3.2"
      },
      {
        "id": "prop:3.6",
        "kind": "proposition",
        "label": "Prop 3.6",
        "name": "Discrete Energy Dissipation",
        "weight": 4,
        "statement": "An approximation $\\mathbf{u}_\\tau$ to a gradient system via exact cPG(k) satisfies $\\mathcal{E}(\\mathbf{u}_\\tau(t_n)) \\leq \\mathcal{E}(\\mathbf{u}_\\tau(t_{n-1}))$.",
        "plain": "The cPG(k) method mathematically guarantees that energy strictly dissipates in discrete time steps.",
        "section": "3.2"
      },
      {
        "id": "def:4.1",
        "kind": "definition",
        "label": "Def 4.1",
        "name": "Non-exact cPG(k) Method",
        "weight": 4,
        "statement": "A discrete variant where integrals are evaluated via numerical quadrature: $\\sum_{r=0}^{s_n} w_{n,r} \\langle \\mathbf{f}(t_{n,r},\\mathbf{u}_\\tau(t_{n,r})),\\mathbf{v}(t_{n,r})\\rangle$.",
        "plain": "A practical computational version of cPG(k) replacing continuous integrals with discrete weighted sums.",
        "section": "4.1"
      },
      {
        "id": "prop:4.2",
        "kind": "proposition",
        "label": "Prop 4.2",
        "name": "Non-exact A-stability",
        "weight": 3,
        "statement": "The non-exact cPG(k) method is A-stable if the quadrature exactness degree is at least $2k-1$.",
        "plain": "Using sufficiently accurate numerical integration protects the structural A-stability.",
        "section": "4.1"
      },
      {
        "id": "prop:4.3",
        "kind": "proposition",
        "label": "Prop 4.3",
        "name": "Non-exact Energy Consistency",
        "weight": 5,
        "statement": "For polynomial Hamiltonians or energy functionals, a high enough quadrature exactness recovers perfect discrete energy consistency.",
        "plain": "Exact energy conservation is recovered even with numerical integration if the physics are governed by polynomials.",
        "section": "4.1"
      },
      {
        "id": "def:4.4",
        "kind": "definition",
        "label": "Def 4.4",
        "name": "Newton Iteration",
        "weight": 2,
        "statement": "$\\mathbf{x}_{k+1} = \\mathbf{x}_k - (D\\Phi(\\mathbf{x}_k))^{-1} \\Phi(\\mathbf{x}_k)$.",
        "plain": "A classic root-finding algorithm using the inverse Jacobian.",
        "section": "4.2"
      },
      {
        "id": "prop:4.5",
        "kind": "proposition",
        "label": "Prop 4.5",
        "name": "Newton Convergence",
        "weight": 3,
        "statement": "The Newton iteration converges quadratically to $\\mathbf{x}$ for initial guesses inside a sufficiently small radius.",
        "plain": "Newton's method doubles its precision at every step if started close enough to the true solution.",
        "section": "4.2",
        "external": true,
        "ref": "SüliMayers2003"
      },
      {
        "id": "rmk:4.6",
        "kind": "remark",
        "label": "Rmk 4.6",
        "name": "Crank-Nicolson",
        "weight": 2,
        "statement": "For $k=1$ and Gauss-Lobatto quadrature, the non-exact cPG(1) system simplifies precisely into the Crank-Nicolson method.",
        "plain": "The simplest version of this advanced Galerkin method is just a famous classical scheme in disguise.",
        "section": "4.2"
      }
    ],
    "edges": [
      {
        "from": "def:1.1",
        "to": "thm:1.3",
        "type": "uses"
      },
      {
        "from": "def:1.2",
        "to": "thm:1.3",
        "type": "uses"
      },
      {
        "from": "def:1.4",
        "to": "def:1.7",
        "type": "uses"
      },
      {
        "from": "def:1.5",
        "to": "def:1.6",
        "type": "uses"
      },
      {
        "from": "def:1.7",
        "to": "def:1.8",
        "type": "uses"
      },
      {
        "from": "def:1.9",
        "to": "prop:1.10",
        "type": "uses"
      },
      {
        "from": "lem:1.11",
        "to": "prop:1.10",
        "type": "uses"
      },
      {
        "from": "def:1.1",
        "to": "prop:2.1",
        "type": "uses"
      },
      {
        "from": "def:1.1",
        "to": "def:2.3",
        "type": "uses"
      },
      {
        "from": "def:1.4",
        "to": "def:2.3",
        "type": "uses"
      },
      {
        "from": "def:2.2",
        "to": "def:2.3",
        "type": "uses"
      },
      {
        "from": "def:2.4",
        "to": "def:2.5",
        "type": "uses"
      },
      {
        "from": "def:2.3",
        "to": "lem:2.7",
        "type": "uses"
      },
      {
        "from": "def:2.6",
        "to": "lem:2.7",
        "type": "uses"
      },
      {
        "from": "def:2.3",
        "to": "prop:2.8",
        "type": "uses"
      },
      {
        "from": "thm:2.9",
        "to": "prop:2.8",
        "type": "uses"
      },
      {
        "from": "def:2.3",
        "to": "prop:2.10",
        "type": "uses"
      },
      {
        "from": "def:2.5",
        "to": "prop:2.10",
        "type": "uses"
      },
      {
        "from": "prop:2.15",
        "to": "prop:2.10",
        "type": "uses"
      },
      {
        "from": "prop:2.16",
        "to": "prop:2.10",
        "type": "uses"
      },
      {
        "from": "prop:2.12",
        "to": "def:2.13",
        "type": "uses"
      },
      {
        "from": "def:2.13",
        "to": "prop:2.14",
        "type": "uses"
      },
      {
        "from": "prop:2.14",
        "to": "prop:2.15",
        "type": "uses"
      },
      {
        "from": "def:2.3",
        "to": "prop:2.19",
        "type": "uses"
      },
      {
        "from": "def:2.17",
        "to": "prop:2.19",
        "type": "uses"
      },
      {
        "from": "def:3.1",
        "to": "lem:3.2",
        "type": "uses"
      },
      {
        "from": "def:1.9",
        "to": "prop:3.3",
        "type": "uses"
      },
      {
        "from": "def:2.3",
        "to": "prop:3.3",
        "type": "uses"
      },
      {
        "from": "lem:1.11",
        "to": "prop:3.3",
        "type": "uses"
      },
      {
        "from": "lem:3.2",
        "to": "prop:3.3",
        "type": "uses"
      },
      {
        "from": "def:3.1",
        "to": "prop:3.3",
        "type": "uses"
      },
      {
        "from": "def:3.4",
        "to": "prop:3.5",
        "type": "uses"
      },
      {
        "from": "def:3.4",
        "to": "prop:3.6",
        "type": "uses"
      },
      {
        "from": "def:2.3",
        "to": "prop:3.6",
        "type": "uses"
      },
      {
        "from": "def:2.3",
        "to": "def:4.1",
        "type": "uses"
      },
      {
        "from": "def:4.1",
        "to": "prop:4.2",
        "type": "uses"
      },
      {
        "from": "prop:2.19",
        "to": "prop:4.2",
        "type": "uses"
      },
      {
        "from": "def:4.1",
        "to": "prop:4.3",
        "type": "uses"
      },
      {
        "from": "prop:3.3",
        "to": "prop:4.3",
        "type": "uses"
      },
      {
        "from": "prop:3.6",
        "to": "prop:4.3",
        "type": "uses"
      },
      {
        "from": "def:4.4",
        "to": "prop:4.5",
        "type": "uses"
      },
      {
        "from": "def:4.1",
        "to": "rmk:4.6",
        "type": "uses"
      }
    ]
  };
  if (typeof g.PaperDiagramData === "object" && g.PaperDiagramData) g.PaperDiagramData["cpg-ktitarev"] = D;
  else g.PaperDiagramData = { "cpg-ktitarev": D };
  if (typeof module !== "undefined" && module.exports) module.exports = D;
})(typeof window !== "undefined" ? window : globalThis);
