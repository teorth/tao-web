// ---------------------------------------------------------------------------
// Random-variable visualiser — Python export (standalone, DOM-free).
//
// Turns a COMPILED program (RVEngine.compile(src).exportModel()) into a single,
// self-contained Python script that re-samples the same random variables and
// prints the same empirical `statistic`s (and renders any `plot` as a static
// matplotlib figure). It is a bespoke transpile of THIS program's finalised
// ASTs — not a general interpreter, and it carries no parser.
//
// Scope (prototype): the scalar language + Sample()/vectors + single-level
// conditioning (global `condition on` and one level of `(X | E)`). Deeper
// universe nesting is refused with a clear message rather than mis-sampled.
//
// Fidelity: a re-sampling, not a replay — distributions match, exact numbers do
// not; statistics use the app's population (÷n) convention so they line up.
// ---------------------------------------------------------------------------

// The fixed helper library, inlined at the top of every export so the output is
// one runnable file. Pure standard library; matplotlib is imported lazily and
// only when a plot is actually drawn.
const PYLIB = String.raw`# --- taorv: helper library for exported Random Variable Visualizer programs ---
# (Auto-generated header. The interesting, editable part is below the divider.)
import math, random
from collections import Counter

# ---- distribution samplers (one draw each; the shared-omega model is realised
#      by computing each named variable once per trial in draw()) --------------
def _unif(a, b):      return a + (b - a) * random.random()
def _unif_set(vals):  return random.choice(vals)
def _exp(rate):       return -math.log(random.random()) / rate
def _normal(mu, sd):  return random.gauss(mu, sd)
def _bernoulli(p):    return 1 if random.random() < p else 0
def _binomial(n, p):  return sum(1 for _ in range(int(round(n))) if random.random() < p)
def _geometric(p):    return math.ceil(math.log(1 - random.random()) / math.log(1 - p))
def _poisson(lam):
    if lam > 500: return max(0, round(random.gauss(lam, math.sqrt(lam))))
    L, k, p = math.exp(-lam), 0, 1.0
    while True:
        k += 1; p *= random.random()
        if p <= L: return k - 1

# ---- elementwise / vector helpers (for Sample() and the Excel funcs) --------
def _flat(xs):
    out = []
    for x in xs:
        out.extend(x) if isinstance(x, (list, tuple)) else out.append(x)
    return out
def _sign(x):  return (x > 0) - (x < 0)
def _prod(v):
    r = 1.0
    for x in v: r *= x
    return r
def _mean(v):  return sum(v) / len(v)
def _var_s(v): n = len(v); m = sum(v)/n; return sum((x-m)**2 for x in v)/(n-1)
def _and(*a):  f = _flat(a); return 1 if all(x != 0 for x in f) else 0
def _or(*a):   f = _flat(a); return 1 if any(x != 0 for x in f) else 0
def _xor(*a):  f = _flat(a); return 1 if (sum(1 for x in f if x != 0) % 2 == 1) else 0
def _not(x):   return 1 if x == 0 else 0
def _iff(c, a, b): return a if c != 0 else b

# ---- empirical statistics over an accepted sample stream --------------------
#      (population convention, ÷ n, to match the visualizer's readouts) --------
def stat_mean(x): return sum(x) / len(x)
def stat_var(x):
    n = len(x); m = sum(x)/n; return sum((xi-m)**2 for xi in x) / n
def stat_sd(x):   return math.sqrt(stat_var(x))
def stat_cov(x, y):
    n = len(x); mx = sum(x)/n; my = sum(y)/n
    return sum((x[i]-mx)*(y[i]-my) for i in range(n)) / n
def stat_corr(x, y):
    c = stat_cov(x, y); d = math.sqrt(stat_var(x) * stat_var(y))
    return c/d if d > 0 else float('nan')
def stat_p(x):    return sum(x) / len(x)
def stat_quantile(x, pct):
    s = sorted(x); m = len(s)
    if m == 1: return s[0]
    r = (pct/100) * (m-1); lo = math.floor(r); f = r - lo
    return s[lo] + f*(s[lo+1]-s[lo]) if lo+1 < m else s[lo]
def stat_mode(x):     return Counter(x).most_common(1)[0][0]
def stat_entropy(x):
    n = len(x); return -sum((c/n)*math.log2(c/n) for c in Counter(x).values())
def stat_max(x):  return max(x)
def stat_min(x):  return min(x)

# ---- rejection sampling: collect n trials whose condition keys are all true --
def collect(draw, cond_keys, n, max_factor=2000):
    import sys
    out, attempts, cap = [], 0, n * max_factor
    while len(out) < n and attempts < cap:
        s = draw(); attempts += 1
        if all(s[k] for k in cond_keys): out.append(s)
    if len(out) < n:
        print("warning: only %d of %d samples met the conditions" % (len(out), n), file=sys.stderr)
    return out

# ---- static plots -----------------------------------------------------------
def plot_hist(vals, title=""):
    import matplotlib.pyplot as plt
    plt.figure(); plt.hist(vals, bins=40, color="#3b6ea5", edgecolor="white")
    plt.title(title); plt.xlabel(title); plt.ylabel("count"); plt.tight_layout(); plt.show()
def plot_scatter(xs, ys, xlabel="", ylabel="", fuzz=0.2, alpha=0.2):
    # fuzz  = jitter (in data units) added to each point, so a discrete grid of
    #         repeated values spreads into density clouds. ~0.2 suits integer
    #         grids like dice; set 0 for a clean lattice, or continuous data.
    # alpha = point opacity; lower means overlapping points read as density.
    import matplotlib.pyplot as plt
    if fuzz:
        xs = [x + random.uniform(-fuzz, fuzz) for x in xs]
        ys = [y + random.uniform(-fuzz, fuzz) for y in ys]
    plt.figure()
    plt.scatter(xs, ys, s=8, alpha=alpha, color="#3b6ea5", edgecolors="none")
    # --- or, for a density view, replace the scatter line above with a heatmap: ---
    # plt.hexbin(xs, ys, gridsize=30, cmap="Blues")
    plt.title(xlabel + " vs " + ylabel); plt.xlabel(xlabel); plt.ylabel(ylabel)
    plt.tight_layout(); plt.show()
# --- end taorv helper library ------------------------------------------------
`;

// Python keywords/builtins a DSL name might collide with (DSL names are valid
// identifiers but not screened against Python's reserved words).
const PY_RESERVED = new Set(('False None True and as assert async await break class continue def '
  + 'del elif else except finally for from global if import in is lambda nonlocal not or pass raise '
  + 'return try while with yield match case abs min max sum len print list set dict range').split(' '));
const pyName = (n) => (PY_RESERVED.has(n) ? n + '_' : n);

// A number literal: integers without a decimal point, else a round-trippable float.
function pyNum(v) {
  if (Number.isInteger(v)) return String(v);
  return Number.isFinite(v) ? String(v) : (v > 0 ? "float('inf')" : (v < 0 ? "float('-inf')" : "float('nan')"));
}

const DIST_EMIT = {
  Unif: (a) => (a.length === 1 && a[0].t === 'set')
    ? `_unif_set([${a[0].values.map(pyNum).join(', ')}])`
    : `_unif(${emit(a[0])}, ${emit(a[1])})`,
  Exp: (a) => `_exp(${emit(a[0])})`,
  Normal: (a) => `_normal(${emit(a[0])}, ${emit(a[1])})`,
  Gaussian: (a) => `_normal(${emit(a[0])}, ${emit(a[1])})`,
  Bernoulli: (a) => `_bernoulli(${emit(a[0])})`,
  Boolean: (a) => `_bernoulli(${emit(a[0])})`,
  Binomial: (a) => `_binomial(${emit(a[0])}, ${emit(a[1])})`,
  Poisson: (a) => `_poisson(${emit(a[0])})`,
  Geometric: (a) => `_geometric(${emit(a[0])})`,
};
const CMP = { '<': '<', '>': '>', '<=': '<=', '>=': '>=', '==': '==', '!=': '!=' };
const FUNC_EMIT = {
  ABS: (a) => `abs(${a})`, SQRT: (a) => `math.sqrt(${a})`, EXP: (a) => `math.exp(${a})`,
  LOG: (a) => `math.log(${a})`, LN: (a) => `math.log(${a})`, SIN: (a) => `math.sin(${a})`,
  COS: (a) => `math.cos(${a})`, TAN: (a) => `math.tan(${a})`, FLOOR: (a) => `math.floor(${a})`,
  CEIL: (a) => `math.ceil(${a})`, ROUND: (a) => `round(${a})`, SIGN: (a) => `_sign(${a})`,
  SUM: (a) => `sum(${a})`, PROD: (a) => `_prod(${a})`, COUNT: (a) => `len(${a})`,
  NUNIQUE: (a) => `len(set(${a}))`, DISTINCT: (a) => `(1 if len(set(${a})) == len(${a}) else 0)`,
  AVERAGE: (a) => `_mean(${a})`, MEAN: (a) => `_mean(${a})`,
  VAR: (a) => `_var_s(${a})`, STDEV: (a) => `math.sqrt(_var_s(${a}))`,
};

// emit(node) -> a Python expression string. Sibling of astToStr in the engine.
function emit(node) {
  switch (node.t) {
    case 'num': return pyNum(node.v);
    case 'bool': return node.v ? '1' : '0';
    case 'const': case 'var': return pyName(node.name);
    case 'set': throw new Error('a set {…} may only appear as a Unif(...) argument');
    case 'given': return emit(node.expr);            // conditioning handled by the universe filter
    case 'dist': {
      const f = DIST_EMIT[node.name];
      if (!f) throw new Error(`distribution ${node.name} is not supported by the Python export yet`);
      return f(node.args);
    }
    case 'vec': {
      const items = node.items;
      const key = JSON.stringify(items[0]);
      if (items.length > 3 && items.every((it) => JSON.stringify(it) === key))   // Sample(dist, n): iid clones
        return `[${emit(items[0])} for _ in range(${items.length})]`;
      return `[${items.map(emit).join(', ')}]`;
    }
    case 'unop':
      return node.op === 'not' ? `(0 if (${emit(node.a)}) != 0 else 1)` : `(-(${emit(node.a)}))`;
    case 'binop': {
      const a = emit(node.a), b = emit(node.b), op = node.op;
      if (op === '^') return `((${a}) ** (${b}))`;
      if ('+-*/'.includes(op)) return `((${a}) ${op} (${b}))`;
      if (CMP[op]) return `(1 if (${a}) ${CMP[op]} (${b}) else 0)`;
      if (op === 'and') return `(1 if ((${a}) != 0) and ((${b}) != 0) else 0)`;
      if (op === 'or') return `(1 if ((${a}) != 0) or ((${b}) != 0) else 0)`;
      if (op === 'xor') return `(1 if ((${a}) != 0) != ((${b}) != 0) else 0)`;
      throw new Error(`operator ${op} is not supported by the Python export`);
    }
    case 'call': {
      const nm = node.name, A = node.args;
      if (nm === 'IF') return `_iff(${emit(A[0])}, ${emit(A[1])}, ${emit(A[2])})`;
      if (nm === 'NOT') return `_not(${emit(A[0])})`;
      if (nm === 'AND' || nm === 'OR' || nm === 'XOR') return `_${nm.toLowerCase()}(${A.map(emit).join(', ')})`;
      if (nm === 'MAX' || nm === 'MIN') {
        const fn = nm === 'MAX' ? 'max' : 'min';
        return A.length === 1 ? `${fn}(${emit(A[0])})` : `${fn}(${A.map(emit).join(', ')})`;
      }
      const f = FUNC_EMIT[nm];
      if (!f) throw new Error(`function ${nm} is not supported by the Python export yet`);
      return f(emit(A[0]));
    }
    default: throw new Error(`cannot export node of type ${node.t}`);
  }
}

// Combinator (statistic arithmetic) -> Python, referencing pre-computed _sub<i>.
function emitComb(node, subVar) {
  switch (node.t) {
    case 'num': return pyNum(node.v);
    case 'sub': return subVar(node.i);
    case 'unop': return `(-(${emitComb(node.a, subVar)}))`;
    case 'binop': {
      const a = emitComb(node.a, subVar), b = emitComb(node.b, subVar), op = node.op;
      return op === '^' ? `((${a}) ** (${b}))` : `((${a}) ${op} (${b}))`;
    }
    default: throw new Error('unsupported statistic combinator');
  }
}

const STAT_FN = {
  Mean: 'stat_mean', P: 'stat_p', Var: 'stat_var', SD: 'stat_sd', Cov: 'stat_cov', Corr: 'stat_corr',
  Mode: 'stat_mode', Entropy: 'stat_entropy', Max: 'stat_max', Min: 'stat_min',
};

// Build the whole Python program from a compiled export model.
function toPython(model, opts) {
  opts = Object.assign({ n: 100000 }, opts);
  const uByKey = new Map(model.universes.map((u) => [u.key, u]));
  // Each universe is filtered by its FLATTENED conditions (the engine already
  // conjoins ancestor events in buildU), so a nested universe is just progressive
  // rejection of the one unconditional stream — correct at any depth. (Previously
  // capped at single-level out of caution; lifted 2026-07-13 after validation.)

  // ---- slot registries: distinct condition/expression ASTs computed in draw() ----
  const condSlot = new Map(), condCode = [];     // json(ast) -> "_c<i>"
  const exprSlot = new Map(), exprCode = [];      // json(ast) -> "_e<i>"
  const slotFor = (ast, map, code, prefix) => {
    const k = JSON.stringify(ast);
    if (!map.has(k)) { const name = prefix + map.size; map.set(k, name); code.push([name, emit(ast)]); }
    return map.get(k);
  };

  // universes that are actually used (by a tracker sub or a plot), each with its
  // ordered condition-slot list (default global conditions + one child event).
  const usedU = new Map();    // uKey -> [condSlot,...]
  const useU = (key) => {
    if (usedU.has(key)) return;
    const u = uByKey.get(key) || { conditions: [] };
    usedU.set(key, u.conditions.map((c) => slotFor(c, condSlot, condCode, '_c')));
  };

  const varUniverse = new Map(model.variables.map((v) => [v.name, v.universe]));
  const plotVars = new Set();
  for (const p of model.plots) { useU(varUniverse.get(p.a)); plotVars.add(p.a); if (p.b) { plotVars.add(p.b); } }
  const trackerPlan = model.trackers.map((t) => ({
    label: t.label, combinator: t.combinator,
    subs: t.subs.map((s) => { useU(s.uKey); return { fn: s.stat, kind: s.kind, uKey: s.uKey, pct: s.pct,
      slots: s.exprs.map((e) => slotFor(e, exprSlot, exprCode, '_e')) }; }),
  }));

  // ---- assemble the script ----
  const L = [];
  L.push('#!/usr/bin/env python3');
  L.push('# Exported from the tao-web Random Variable Visualizer.');
  L.push('# A bespoke re-sampling of this program: same distributions, fresh randomness.');
  L.push('# Run:  python this_file.py     (matplotlib needed only if it draws a plot)');
  L.push('');
  L.push(PYLIB);
  L.push('# ======================= your program =======================');
  L.push(`N = ${opts.n}   # number of samples`);
  L.push('');
  if (model.constants.length) {
    L.push('# constants');
    for (const [name, val] of model.constants) L.push(`${pyName(name)} = ${pyNum(val)}`);
    L.push('');
  }
  // the per-trial draw: each named variable computed once (shared randomness),
  // then the conditioning events and statistic expressions.
  L.push('def draw():');
  for (const v of model.variables) L.push(`    ${pyName(v.name)} = ${emit(v.ast)}`);
  for (const [name, code] of condCode) L.push(`    ${name} = ${code}`);
  for (const [name, code] of exprCode) L.push(`    ${name} = ${code}`);
  const retKeys = [...plotVars].map((n) => `'${n}': ${pyName(n)}`)
    .concat(condCode.map(([n]) => `'${n}': ${n}`))
    .concat(exprCode.map(([n]) => `'${n}': ${n}`));
  L.push(`    return {${retKeys.join(', ')}}`);
  L.push('');
  // collect accepted samples per used universe
  L.push('# accepted samples per universe (rejection sampling on the conditions)');
  const uVar = new Map();
  let ui = 0;
  for (const [key, conds] of usedU) {
    const vname = key === '' ? 'U' : `U_${ui++}`;
    uVar.set(key, vname);
    const lbl = key === '' ? 'default universe' : (uByKey.get(key).label || key);
    L.push(`${vname} = collect(draw, [${conds.map((c) => `'${c}'`).join(', ')}], N)   # ${lbl}`);
  }
  L.push('');
  // statistics (the empirical `statistic` / `track` outputs)
  if (trackerPlan.length) {
    L.push('# statistics');
    trackerPlan.forEach((t, ti) => {
      t.subs.forEach((s, si) => {
        const U = uVar.get(s.uKey);
        const col = (slot) => `[s['${slot}'] for s in ${U}]`;
        let call;
        if (s.kind === 'moment') {
          call = s.slots.length === 2 ? `${STAT_FN[s.fn]}(${col(s.slots[0])}, ${col(s.slots[1])})`
            : `${STAT_FN[s.fn]}(${col(s.slots[0])})`;
        } else if (s.kind === 'quantile') {
          call = `stat_quantile(${col(s.slots[0])}, ${pyNum(s.pct)})`;
        } else {
          call = `${STAT_FN[s.fn]}(${col(s.slots[0])})`;
        }
        L.push(`_t${ti}s${si} = ${call}`);
      });
      const val = emitComb(t.combinator, (i) => `_t${ti}s${i}`);
      L.push(`print(${JSON.stringify(t.label + ' =')}, ${val})`);
    });
    L.push('');
  }
  // plots
  if (model.plots.length) {
    L.push('# plots');
    for (const p of model.plots) {
      const U = uVar.get(varUniverse.get(p.a));
      if (p.mode === '2d') {
        const Ub = uVar.get(varUniverse.get(p.b));
        L.push(`plot_scatter([s['${p.a}'] for s in ${U}], [s['${p.b}'] for s in ${Ub}], '${p.a}', '${p.b}', fuzz=0.2, alpha=0.2)`);
      } else {
        L.push(`plot_hist([s['${p.a}'] for s in ${U}], '${p.a}')`);
      }
    }
  }
  return L.join('\n') + '\n';
}

const API = { toPython, PYLIB };
if (typeof window !== 'undefined') window.RVExport = API;
if (typeof module !== 'undefined' && module.exports) module.exports = API;
