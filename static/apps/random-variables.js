// ---------------------------------------------------------------------------
// Random-variable visualiser — language engine (standalone, DOM-free).
//
// Model: a program defines constants (deterministic numbers), random
// variables (nodes in a shared-randomness DAG), and `condition on` clauses.
// Each frame draws ONE global state omega: every primitive draw resamples,
// derived variables are functions of those draws, so coupling/independence
// fall out for free. Conditioning = rejection sampling on that global omega.
// ---------------------------------------------------------------------------

// ---- naming conventions ----------------------------------------------------
// Distributions: Capitalised   (Unif, Exp, Normal, Bernoulli, ...)
// Excel funcs:    UPPERCASE     (SUM, AVERAGE, SQRT, EXP, MAX, ...)
// This keeps Exp(3) (exponential distribution) distinct from EXP(1) (e^1).

const DISTS = new Set([
  'Unif', 'Exp', 'Normal', 'Gaussian', 'Bernoulli',
  'Binomial', 'Poisson', 'Geometric',
  'Boolean'   // event constructor: True/False with probability p (a coin)
]);

// Distribution / event-constructor aliases (looked up case-insensitively).
// NOTE: bare 'exp' is deliberately ABSENT so it keeps hitting the EXP function /
// the "distributions are Capitalised" hint, rather than silently meaning Exp(·).
const DIST_ALIAS = {
  unif: 'Unif', uniform: 'Unif',
  exponential: 'Exp',
  normal: 'Normal', gaussian: 'Normal', gauss: 'Normal', norm: 'Normal',
  bernoulli: 'Bernoulli', bern: 'Bernoulli',
  binomial: 'Binomial', bin: 'Binomial',
  poisson: 'Poisson', pois: 'Poisson',
  geometric: 'Geometric', geom: 'Geometric',
  boolean: 'Boolean', bool: 'Boolean', coin: 'Boolean', flip: 'Boolean', toss: 'Boolean', chance: 'Boolean',
};
// Event constructors: sampled like Bernoulli(p) but TYPED as an event (True/False).
const EVENT_CTORS = new Set(['Boolean']);
// Excel-style boolean functions that RETURN an event (the word operators
// and/or/not/xor are the other spelling of the same connectives).
const EVENT_FUNCS = new Set(['AND', 'OR', 'NOT', 'XOR']);
// Default parameters, filled in when trailing arguments are omitted, so e.g.
// Normal() means Normal(0, 1), Boolean() a fair coin, Binomial(10) a fair-coin
// count. (Unif's single-scalar form is ambiguous, so it is never partial-filled.)
const DIST_DEFAULTS = {
  Unif: [0, 1], Exp: [1], Normal: [0, 1], Gaussian: [0, 1],
  Bernoulli: [0.5], Binomial: [1, 0.5], Poisson: [1], Geometric: [0.5], Boolean: [0.5],
};
// Operators that produce an event (a 0/1 indicator, displayed as True/False).
const CMP_OPS = new Set(['<', '>', '<=', '>=', '==', '!=']);
const BOOL_OPS = new Set(['and', 'or', 'xor']);

const FUNCS = new Set([
  // reductions (vector -> scalar)
  'SUM', 'PROD', 'AVERAGE', 'MEAN', 'COUNT', 'STDEV', 'VAR',
  // variadic / vector
  'MAX', 'MIN',
  // elementwise scalar maths
  'ABS', 'SQRT', 'EXP', 'LOG', 'LN', 'SIN', 'COS', 'TAN',
  'FLOOR', 'CEIL', 'ROUND', 'SIGN',
  // logic (IF is also writable as the word form `if C then A else B`;
  // AND/OR/XOR are variadic and NOT is unary — each normalises any nonzero
  // argument to True, any zero to False, and returns an event)
  'IF', 'AND', 'OR', 'NOT', 'XOR'
]);

// Empirical statistics accumulated over the time series of samples. These are
// NOT functions (they don't turn random variables into random variables); they
// turn a stream of samples into a number, so they live in their own namespace,
// usable only in the `statistic` / `track` command (case-insensitive; aliases).
// kind: 'moment' (exact online moments), 'quantile' (from a bounded sample
// buffer; `pct` is the percentile, or pctArg means a percentage argument),
// 'mode' (most frequent value in the buffer).
const STAT_DEF = {
  Mean: { kind: 'moment', argc: 1 }, Var: { kind: 'moment', argc: 1 },
  SD: { kind: 'moment', argc: 1 }, Cov: { kind: 'moment', argc: 2 },
  Corr: { kind: 'moment', argc: 2 },
  Median: { kind: 'quantile', argc: 1, pct: 50 },
  Q1: { kind: 'quantile', argc: 1, pct: 25 }, Q3: { kind: 'quantile', argc: 1, pct: 75 },
  Percentile: { kind: 'quantile', argc: 2, pctArg: true }, // Percentile(expr, p in [0,100])
  Mode: { kind: 'mode', argc: 1 },
  Entropy: { kind: 'entropy', argc: 1 }, // Shannon entropy in bits (discrete only)
  // running extremes over the sample stream (NOT the MAX/MIN vector functions)
  Max: { kind: 'extreme', argc: 1 }, Min: { kind: 'extreme', argc: 1 },
};
const STAT_ALIAS = {
  mean: 'Mean', average: 'Mean', var: 'Var', variance: 'Var', sd: 'SD', std: 'SD',
  stdev: 'SD', cov: 'Cov', covariance: 'Cov', corr: 'Corr', correlation: 'Corr',
  median: 'Median', med: 'Median', q1: 'Q1', q3: 'Q3',
  percentile: 'Percentile', pctile: 'Percentile', mode: 'Mode',
  entropy: 'Entropy', shannon: 'Entropy', max: 'Max', maximum: 'Max', min: 'Min', minimum: 'Min',
};
const STAT_NAMES = 'Mean, SD, Var, Cov, Corr, Median, Q1, Q3, Percentile, Mode, Entropy, Max, Min';
const SAMPLE_CAP = 2048; // ring-buffer size for quantile/mode statistics

// Reserved identifiers a user may NOT reuse as a variable/constant/event name.
// Checked case-insensitively: even where the parser could disambiguate (e.g. a
// variable Boolean vs the constructor Boolean), shadowing is bad practice, so we
// forbid it and teach a clearer name. Built from every keyword, operator word,
// function, distribution, constructor alias, and statistic (canonical + alias).
const RESERVED = new Set();
for (const w of ['let', 'plot', 'statistic', 'track', 'condition', 'on', 'and', 'or', 'not', 'xor', 'if', 'then', 'else']) RESERVED.add(w);
for (const s of FUNCS) RESERVED.add(s.toLowerCase());
for (const s of DISTS) RESERVED.add(s.toLowerCase());
for (const s of Object.keys(DIST_ALIAS)) RESERVED.add(s);
for (const s of Object.keys(STAT_DEF)) RESERVED.add(s.toLowerCase());
for (const s of Object.keys(STAT_ALIAS)) RESERVED.add(s);

// Canonical, whitespace-independent string for an AST. `X > 3` and `X>3` render
// identically, while `X > 3` and `X > 2+1` stay distinct — exactly the identity
// rule events (and, later, universes) use to decide when two events are "equal".
function astToStr(node) {
  switch (node.t) {
    case 'num': return String(node.v);
    case 'const': case 'var': return node.name;
    case 'set': return '{' + node.values.join(',') + '}';
    case 'vec': return '[' + node.items.map(astToStr).join(',') + ']';
    case 'dist': case 'call': return node.name + '(' + node.args.map(astToStr).join(',') + ')';
    case 'unop': return node.op === 'not' ? '(not ' + astToStr(node.a) + ')' : '(' + node.op + astToStr(node.a) + ')';
    case 'binop': {
      const word = BOOL_OPS.has(node.op);
      return '(' + astToStr(node.a) + (word ? ' ' + node.op + ' ' : node.op) + astToStr(node.b) + ')';
    }
    default: return '?';
  }
}
// Is this finalised node an event (0/1 indicator, shown as True/False)?
function nodeIsEvent(node, variables) {
  if (!node) return false;
  switch (node.t) {
    case 'binop': return CMP_OPS.has(node.op) || BOOL_OPS.has(node.op);
    case 'unop': return node.op === 'not';
    case 'dist': return !!node.isEvent;
    case 'var': { const e = variables.get(node.name); return !!(e && e.isEvent); }
    case 'call':
      if (EVENT_FUNCS.has(node.name)) return true;
      // if/IF is an event exactly when both of its branches are events
      if (node.name === 'IF') return nodeIsEvent(node.args[1], variables) && nodeIsEvent(node.args[2], variables);
      return false;
    default: return false;
  }
}
// split "a, b" on top-level commas only (so nested calls like IF(x,1,0) survive)
function splitArgs(s) {
  const out = []; let depth = 0, cur = '';
  for (const ch of s) {
    if (ch === '(' || ch === '{') depth++;
    else if (ch === ')' || ch === '}') depth--;
    if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; }
    else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

// ===========================================================================
// Tokeniser
// ===========================================================================
function tokenize(src) {
  const toks = [];
  let i = 0;
  const two = { ':=': 1, '<=': 1, '>=': 1, '==': 1, '!=': 1, '..': 1, '&&': 1, '||': 1 };
  while (i < src.length) {
    const c = src[i];
    if (c === ' ' || c === '\t' || c === '\r' || c === '\n') { i++; continue; }
    if (c === '#') break; // line comment
    // number (at most one '.', and never consume the '..' range operator)
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] || ''))) {
      let j = i, seenDot = false;
      while (j < src.length) {
        if (/[0-9]/.test(src[j])) { j++; continue; }
        if (src[j] === '.' && !seenDot && src[j + 1] !== '.') { seenDot = true; j++; continue; }
        break;
      }
      toks.push({ t: 'num', v: parseFloat(src.slice(i, j)) });
      i = j; continue;
    }
    // identifier
    if (/[A-Za-z_]/.test(c)) {
      let j = i;
      while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j++;
      toks.push({ t: 'id', v: src.slice(i, j) });
      i = j; continue;
    }
    // two-char ops
    const pair = src.slice(i, i + 2);
    if (two[pair]) { toks.push({ t: 'op', v: pair }); i += 2; continue; }
    // single-char ops ('!' is boolean NOT; '!=' already handled above)
    if ('+-*/^(),{}<>=!'.includes(c)) { toks.push({ t: 'op', v: c }); i++; continue; }
    throw new Error(`Unexpected character '${c}'`);
  }
  return toks;
}

// ===========================================================================
// Expression parser (recursive descent / precedence climbing)
// Produces a RAW ast (distributions not yet assigned leaf ids).
// ===========================================================================
function makeParser(toks) {
  let p = 0;
  const peek = () => toks[p];
  const next = () => toks[p++];
  const isOp = (v) => peek() && peek().t === 'op' && peek().v === v;
  function expect(v) {
    if (!isOp(v)) throw new Error(`Expected '${v}'`);
    return next();
  }

  function parseExpr() { return parseOr(); }

  // boolean layer (lowest precedence): not > and > or/xor, all below comparisons.
  // Words (and/or/not/xor) arrive as identifiers; &&, ||, ! are symbol aliases.
  const kw = (w) => peek() && peek().t === 'id' && peek().v.toLowerCase() === w;
  function parseOr() {
    let a = parseAnd();
    while (kw('or') || kw('xor') || isOp('||')) {
      const raw = next(); const op = raw.t === 'op' ? 'or' : raw.v.toLowerCase();
      a = { t: 'binop', op, a, b: parseAnd() };
    }
    return a;
  }
  function parseAnd() {
    let a = parseNot();
    while (kw('and') || isOp('&&')) { next(); a = { t: 'binop', op: 'and', a, b: parseNot() }; }
    return a;
  }
  function parseNot() {
    if (kw('not') || isOp('!')) { next(); return { t: 'unop', op: 'not', a: parseNot() }; }
    return parseCompare();
  }

  function parseCompare() {
    let a = parseAdd();
    while (peek() && peek().t === 'op' && ['<', '>', '<=', '>=', '==', '!='].includes(peek().v)) {
      const op = next().v; const b = parseAdd();
      a = { t: 'binop', op, a, b };
    }
    return a;
  }
  function parseAdd() {
    let a = parseMul();
    while (isOp('+') || isOp('-')) { const op = next().v; const b = parseMul(); a = { t: 'binop', op, a, b }; }
    return a;
  }
  function parseMul() {
    let a = parseUnary();
    while (isOp('*') || isOp('/')) { const op = next().v; const b = parseUnary(); a = { t: 'binop', op, a, b }; }
    return a;
  }
  function parseUnary() {
    if (isOp('-')) { next(); return { t: 'unop', op: '-', a: parseUnary() }; }
    if (isOp('+')) { next(); return parseUnary(); }
    return parsePow();
  }
  function parsePow() {
    let a = parsePrimary();
    while (isOp('^')) { next(); const b = parseUnary(); a = { t: 'binop', op: '^', a, b }; }
    return a;
  }
  function parsePrimary() {
    const t = peek();
    if (!t) throw new Error('Unexpected end of expression');
    if (t.t === 'num') { next(); return { t: 'num', v: t.v }; }
    if (isOp('(')) { next(); const e = parseExpr(); expect(')'); return e; }
    if (isOp('{')) return parseSet();
    if (t.t === 'id') {
      // word-form conditional `if C then A else B` (the IF(...) call is handled below).
      // Only the bare word triggers it — `if` immediately followed by `(` is a call.
      if (t.v.toLowerCase() === 'if' && !(toks[p + 1] && toks[p + 1].t === 'op' && toks[p + 1].v === '(')) {
        next(); // 'if'
        const cond = parseExpr();
        if (!kw('then')) throw new Error("expected 'then' in 'if … then … else …'");
        next();
        const a = parseExpr();
        if (!kw('else')) throw new Error("expected 'else' in 'if … then … else …'");
        next();
        const b = parseExpr();
        return { t: 'call', name: 'IF', args: [cond, a, b] };
      }
      next();
      if (isOp('(')) { // call
        next();
        const args = [];
        if (!isOp(')')) {
          args.push(parseExpr());
          while (isOp(',')) { next(); args.push(parseExpr()); }
        }
        expect(')');
        return { t: 'call', name: t.v, args };
      }
      return { t: 'ref', name: t.v };
    }
    throw new Error(`Unexpected token '${t.v}'`);
  }
  function parseSignedNum() {
    let sign = 1;
    if (isOp('-')) { next(); sign = -1; }
    else if (isOp('+')) next();
    const t = peek();
    if (!t || t.t !== 'num') throw new Error('Expected a number inside { }');
    next();
    return sign * t.v;
  }
  function parseSet() {
    expect('{');
    const first = parseSignedNum();
    let values;
    if (isOp('..')) {
      next();
      const last = parseSignedNum();
      values = [];
      const step = last >= first ? 1 : -1;
      for (let v = first; step > 0 ? v <= last : v >= last; v += step) values.push(v);
    } else {
      values = [first];
      while (isOp(',')) { next(); values.push(parseSignedNum()); }
    }
    expect('}');
    return { t: 'set', values };
  }

  const ast = parseExpr();
  if (p < toks.length) throw new Error(`Unexpected trailing token '${toks[p].v}'`);
  return ast;
}

function parseExpression(src) { return makeParser(tokenize(src)); }

// ===========================================================================
// Finalise: resolve identifiers, expand Sample(...) into vectors of clones,
// and assign a unique leaf id to every distribution node.
// ===========================================================================
function clone(node) { return JSON.parse(JSON.stringify(node)); }

function finalize(node, ctx) {
  switch (node.t) {
    case 'num': return node;
    case 'set': return node;
    case 'ref': {
      if (ctx.variables.has(node.name)) return { t: 'var', name: node.name };
      if (ctx.constants.has(node.name)) return { t: 'const', name: node.name };
      throw new Error(`Unknown identifier '${node.name}'`);
    }
    case 'unop': return { t: 'unop', op: node.op, a: finalize(node.a, ctx) };
    case 'binop': return { t: 'binop', op: node.op, a: finalize(node.a, ctx), b: finalize(node.b, ctx) };
    case 'call': {
      let name = node.name;
      if (name === 'Sample') {
        if (node.args.length !== 2) throw new Error('Sample expects (distribution, count)');
        const n = Math.round(evalConst(node.args[1], ctx));
        if (!(n >= 1) || n > 100000) throw new Error(`Sample count must be an integer in 1..100000 (got ${n})`);
        const items = [];
        for (let k = 0; k < n; k++) items.push(finalize(clone(node.args[0]), ctx));
        return { t: 'vec', items };
      }
      // resolve a distribution / constructor alias (Uniform, Coin, Norm, ...)
      if (!FUNCS.has(name) && !DISTS.has(name) && DIST_ALIAS[name.toLowerCase()]) name = DIST_ALIAS[name.toLowerCase()];
      if (DISTS.has(name)) {
        // set arguments stay as-is; scalar args get finalised
        const args = node.args.map((a) => (a.t === 'set' ? a : finalize(a, ctx)));
        // fill omitted trailing parameters from the defaults (Normal() -> Normal(0,1),
        // Boolean() -> fair coin); Unif's single-scalar form is left alone (ambiguous).
        const defs = DIST_DEFAULTS[name];
        if (defs && !(name === 'Unif' && args.length === 1)) {
          for (let k = args.length; k < defs.length; k++) args.push({ t: 'num', v: defs[k] });
        }
        return { t: 'dist', name, args, id: ctx.nextId(), isEvent: EVENT_CTORS.has(name) };
      }
      if (FUNCS.has(name)) {
        return { t: 'call', name, args: node.args.map((a) => finalize(a, ctx)) };
      }
      if (name === name.toLowerCase() && DISTS.has(name[0].toUpperCase() + name.slice(1))) {
        throw new Error(`Unknown '${name}' — distributions are Capitalised, e.g. '${name[0].toUpperCase() + name.slice(1)}'`);
      }
      throw new Error(`Unknown function or distribution '${name}'`);
    }
    default:
      throw new Error(`Cannot finalise node of type ${node.t}`);
  }
}

// Evaluate a purely deterministic (constant) expression. Used for `let` RHS
// and Sample counts. Distributions/Sample/vectors are not allowed here.
function evalConst(node, ctx) {
  switch (node.t) {
    case 'num': return node.v;
    case 'ref':
      if (ctx.constants.has(node.name)) return ctx.constants.get(node.name);
      throw new Error(`'${node.name}' is not a constant (only constants may appear here)`);
    case 'unop': { const a = evalConst(node.a, ctx); return node.op === '-' ? -a : node.op === 'not' ? (a === 0 ? 1 : 0) : a; }
    case 'binop': return scalarBin(node.op, evalConst(node.a, ctx), evalConst(node.b, ctx));
    case 'call':
      if (FUNCS.has(node.name)) return callFn(node.name, node.args.map((a) => evalConst(a, ctx)));
      throw new Error(`'${node.name}' cannot be used to define a constant`);
    default:
      throw new Error('Constant expression may not contain randomness');
  }
}

// ===========================================================================
// Scalar / vector value operations
// ===========================================================================
function scalarBin(op, x, y) {
  switch (op) {
    case '+': return x + y;
    case '-': return x - y;
    case '*': return x * y;
    case '/': return x / y;
    case '^': return Math.pow(x, y);
    case '<': return x < y ? 1 : 0;
    case '>': return x > y ? 1 : 0;
    case '<=': return x <= y ? 1 : 0;
    case '>=': return x >= y ? 1 : 0;
    case '==': return x === y ? 1 : 0;
    case '!=': return x !== y ? 1 : 0;
    // boolean combinators on events (any nonzero value counts as true)
    case 'and': return (x !== 0 && y !== 0) ? 1 : 0;
    case 'or': return (x !== 0 || y !== 0) ? 1 : 0;
    case 'xor': return ((x !== 0) !== (y !== 0)) ? 1 : 0;
    default: throw new Error(`Unknown operator ${op}`);
  }
}

function mapBin(op, a, b) {
  const A = Array.isArray(a), B = Array.isArray(b);
  if (!A && !B) return scalarBin(op, a, b);
  const len = A && B ? (a.length === b.length ? a.length
    : (() => { throw new Error(`Vector length mismatch (${a.length} vs ${b.length})`); })())
    : (A ? a.length : b.length);
  const out = new Array(len);
  for (let i = 0; i < len; i++) out[i] = scalarBin(op, A ? a[i] : a, B ? b[i] : b);
  return out;
}

function mapUn(op, a) {
  const f = op === '-' ? (x) => -x : op === 'not' ? (x) => (x === 0 ? 1 : 0) : (x) => x;
  return Array.isArray(a) ? a.map(f) : f(a);
}

function toArr(x) { return Array.isArray(x) ? x : [x]; }
function asScalar(x) {
  if (Array.isArray(x)) throw new Error('Expected a single number but got a vector');
  return x;
}

function callFn(name, args) {
  const mapMath = (f) => {
    const a = args[0];
    return Array.isArray(a) ? a.map(f) : f(a);
  };
  switch (name) {
    case 'SUM': return toArr(args[0]).reduce((s, x) => s + x, 0);
    case 'PROD': return toArr(args[0]).reduce((s, x) => s * x, 1);
    case 'COUNT': return toArr(args[0]).length;
    case 'AVERAGE':
    case 'MEAN': { const a = toArr(args[0]); return a.reduce((s, x) => s + x, 0) / a.length; }
    case 'VAR':
    case 'STDEV': {
      const a = toArr(args[0]); const n = a.length;
      const m = a.reduce((s, x) => s + x, 0) / n;
      const v = a.reduce((s, x) => s + (x - m) * (x - m), 0) / (n - 1);
      return name === 'VAR' ? v : Math.sqrt(v);
    }
    case 'MAX': return Math.max(...(args.length === 1 ? toArr(args[0]) : args.map(asScalar)));
    case 'MIN': return Math.min(...(args.length === 1 ? toArr(args[0]) : args.map(asScalar)));
    case 'ABS': return mapMath(Math.abs);
    case 'SQRT': return mapMath(Math.sqrt);
    case 'EXP': return mapMath(Math.exp);
    case 'LOG': case 'LN': return mapMath(Math.log);
    case 'SIN': return mapMath(Math.sin);
    case 'COS': return mapMath(Math.cos);
    case 'TAN': return mapMath(Math.tan);
    case 'FLOOR': return mapMath(Math.floor);
    case 'CEIL': return mapMath(Math.ceil);
    case 'ROUND': return mapMath(Math.round);
    case 'SIGN': return mapMath(Math.sign);
    case 'IF': return asScalar(args[0]) !== 0 ? args[1] : args[2];
    // Excel-style boolean functions: flatten any vector args, normalise nonzero
    // -> True / zero -> False, and return a 0/1 event.
    case 'AND': { const v = args.flatMap((a) => (Array.isArray(a) ? a : [a])); return v.every((x) => x !== 0) ? 1 : 0; }
    case 'OR': { const v = args.flatMap((a) => (Array.isArray(a) ? a : [a])); return v.some((x) => x !== 0) ? 1 : 0; }
    case 'XOR': { const v = args.flatMap((a) => (Array.isArray(a) ? a : [a])); return (v.filter((x) => x !== 0).length % 2 === 1) ? 1 : 0; }
    case 'NOT': return asScalar(args[0]) === 0 ? 1 : 0;
    default: throw new Error(`Unknown function ${name}`);
  }
}

// ===========================================================================
// Distribution samplers
// ===========================================================================
function sampleNormal(mu, sd) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mu + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
function samplePoisson(lam) {
  if (lam < 0) throw new Error('Poisson rate must be >= 0');
  if (lam > 500) return Math.max(0, Math.round(sampleNormal(lam, Math.sqrt(lam))));
  const L = Math.exp(-lam); let k = 0, p = 1;
  do { k++; p *= Math.random(); } while (p > L);
  return k - 1;
}
function sampleBinomial(n, p) { let c = 0; for (let i = 0; i < n; i++) if (Math.random() < p) c++; return c; }
function sampleGeom(p) { return Math.ceil(Math.log(1 - Math.random()) / Math.log(1 - p)); } // support 1,2,3,...
function sampleExp(rate) { return -Math.log(Math.random()) / rate; }

// ===========================================================================
// Runtime: holds the program and evaluates frames under a shared omega.
// ===========================================================================
function compile(src) {
  const ctx = { constants: new Map(), variables: new Map(), nextId: (() => { let n = 0; return () => n++; })() };
  const varOrder = [];
  const conditions = [];
  const plots = []; // {mode:'1d'|'2d', a, b}
  const trackers = []; // {stat, label, exprs:[ast], acc} — empirical statistics

  // Reject names that collide with a reserved word/function/distribution/statistic.
  function guardName(name) {
    if (RESERVED.has(name.toLowerCase()))
      throw new Error(`'${name}' is a reserved name (a keyword, function, distribution or statistic); pick another — e.g. a lower-case name for a constant`);
  }

  const lines = src.split('\n');
  for (let ln = 0; ln < lines.length; ln++) {
    let line = lines[ln];
    const hash = line.indexOf('#');
    if (hash >= 0) line = line.slice(0, hash);
    line = line.trim();
    if (!line) continue;
    try {
      // condition on EXPR
      const mCond = line.match(/^condition\s+on\s+(.+)$/i);
      if (mCond) { conditions.push(finalize(parseExpression(mCond[1]), ctx)); continue; }
      // plot A  |  plot A, B   (multiple `plot` lines -> multiple windows)
      const mPlot = line.match(/^plot\s+(.+)$/i);
      if (mPlot) {
        const parts = mPlot[1].split(',').map((s) => s.trim());
        plots.push(parts.length >= 2 ? { mode: '2d', a: parts[0], b: parts[1] } : { mode: '1d', a: parts[0] });
        continue;
      }
      // statistic Stat(expr[, expr])   (alias: track ...) — an empirical observable
      const mStat = line.match(/^(?:statistic|track)\s+([A-Za-z_][A-Za-z0-9_]*)\s*\((.*)\)\s*$/i);
      if (mStat) {
        const canon = STAT_ALIAS[mStat[1].toLowerCase()];
        if (!canon) throw new Error(`Unknown statistic '${mStat[1]}' (use ${STAT_NAMES})`);
        const def = STAT_DEF[canon];
        const argStrs = splitArgs(mStat[2]);
        if (argStrs.length !== def.argc) throw new Error(`${canon} expects ${def.argc} argument${def.argc > 1 ? 's' : ''}`);
        const tr = { stat: canon, kind: def.kind, label: `${canon}(${argStrs.join(', ')})` };
        if (def.pctArg) { // last argument is a numeric percentage in [0, 100]
          let p; try { p = evalConst(parseExpression(argStrs[1]), ctx); } catch (_) { p = NaN; }
          if (!(p >= 0 && p <= 100)) throw new Error('Percentile expects a percentage between 0 and 100');
          tr.pct = p;
          tr.exprs = [finalize(parseExpression(argStrs[0]), ctx)];
        } else {
          tr.exprs = argStrs.map((s) => finalize(parseExpression(s), ctx));
          if (def.pct != null) tr.pct = def.pct;
        }
        if (tr.kind === 'moment') tr.acc = { n: 0, mx: 0, my: 0, Mx2: 0, My2: 0, Cxy: 0 };
        else if (tr.kind === 'extreme') tr.acc = { n: 0, hi: -Infinity, lo: Infinity };
        else tr.buf = { data: [], i: 0, cap: SAMPLE_CAP };
        trackers.push(tr);
        continue;
      }
      // let NAME = EXPR   (constant)   [ := accepted as a lenient alias ]
      const mLet = line.match(/^let\s+([A-Za-z_][A-Za-z0-9_]*)\s*(?::=|=(?!=))\s*(.+)$/i);
      if (mLet) {
        const name = mLet[1];
        guardName(name);
        if (ctx.constants.has(name)) throw new Error(`'${name}' is already a constant`);
        if (ctx.variables.has(name)) throw new Error(`'${name}' is already a random variable`);
        ctx.constants.set(name, evalConst(parseExpression(mLet[2]), ctx));
        continue;
      }
      // NAME = EXPR   (random variable)   [ := accepted as a lenient alias ]
      const mAssign = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*(?::=|=(?!=))\s*(.+)$/);
      if (mAssign) {
        const name = mAssign[1];
        guardName(name);
        if (ctx.constants.has(name)) throw new Error(`'${name}' is already a constant`);
        // Random variables are immutable here: no reassignment, and in particular
        // no 'X = X + 1' — that is the mutable-cell mindset this app is meant to
        // dispel; a variable is fixed once by its definition.
        if (ctx.variables.has(name)) throw new Error(`'${name}' is already defined; random variables cannot be reassigned`);
        const ast = finalize(parseExpression(mAssign[2]), ctx);
        // An event (comparison / boolean combo / Boolean(...)) is a 0/1 indicator
        // shown as True/False; record its canonical form for later (universes).
        const isEvent = nodeIsEvent(ast, ctx.variables);
        ctx.variables.set(name, { ast, isEvent, canon: isEvent ? astToStr(ast) : null });
        varOrder.push(name);
        continue;
      }
      throw new Error('Could not parse statement');
    } catch (e) {
      throw new Error(`Line ${ln + 1}: ${e.message}\n  > ${line}`);
    }
  }

  // ---- per-frame evaluation with caches -----------------------------------
  let leafCache = {}, varCache = {};
  const constants = ctx.constants, variables = ctx.variables;

  function evalNode(node) {
    switch (node.t) {
      case 'num': return node.v;
      case 'const': return constants.get(node.name);
      case 'var': {
        if (node.name in varCache) return varCache[node.name];
        const v = evalNode(variables.get(node.name).ast);
        varCache[node.name] = v; return v;
      }
      case 'dist': {
        if (node.id in leafCache) return leafCache[node.id];
        const v = sampleDist(node.name, node.args);
        leafCache[node.id] = v; return v;
      }
      case 'vec': return node.items.map(evalNode);
      case 'unop': return mapUn(node.op, evalNode(node.a));
      case 'binop': return mapBin(node.op, evalNode(node.a), evalNode(node.b));
      case 'call': return callFn(node.name, node.args.map(evalNode));
      default: throw new Error(`Cannot evaluate ${node.t}`);
    }
  }
  function num(node) { return asScalar(evalNode(node)); }
  function sampleDist(name, args) {
    switch (name) {
      case 'Unif':
        if (args.length === 1 && args[0].t === 'set') {
          const s = args[0].values; return s[Math.floor(Math.random() * s.length)];
        }
        if (args.length === 2) { const a = num(args[0]), b = num(args[1]); return a + (b - a) * Math.random(); }
        throw new Error('Unif expects (a,b) or a set {..}');
      case 'Exp': return sampleExp(num(args[0]));
      case 'Normal': case 'Gaussian': return sampleNormal(num(args[0]), num(args[1]));
      case 'Bernoulli': return Math.random() < num(args[0]) ? 1 : 0;
      case 'Boolean': return Math.random() < num(args[0]) ? 1 : 0; // event-typed coin

      case 'Binomial': return sampleBinomial(Math.round(num(args[0])), num(args[1]));
      case 'Poisson': return samplePoisson(num(args[0]));
      case 'Geometric': return sampleGeom(num(args[0]));
      default: throw new Error(`Unknown distribution ${name}`);
    }
  }

  function freshOmega() { leafCache = {}; varCache = {}; }
  function conditionsHold() {
    for (const c of conditions) if (asScalar(evalNode(c)) === 0) return false;
    return true;
  }

  // ---- empirical statistics: running moments over accepted frames ----------
  function safeNum(e) {
    try { const v = num(e); return (typeof v === 'number' && isFinite(v)) ? v : null; }
    catch (_) { return null; }
  }
  // Update each tracker from the current (accepted) omega: moment stats keep
  // exact online moments; sample stats push into a bounded ring buffer.
  function updateTrackers() {
    for (const t of trackers) {
      const x = safeNum(t.exprs[0]);
      if (x == null) continue;
      if (t.kind === 'moment') {
        let y = null;
        if (t.exprs.length === 2) { y = safeNum(t.exprs[1]); if (y == null) continue; }
        const a = t.acc; a.n++;
        const dx = x - a.mx; a.mx += dx / a.n; a.Mx2 += dx * (x - a.mx);
        if (y != null) { const dy = y - a.my; a.my += dy / a.n; a.My2 += dy * (y - a.my); a.Cxy += dx * (y - a.my); }
      } else if (t.kind === 'extreme') {
        const a = t.acc; a.n++; if (x > a.hi) a.hi = x; if (x < a.lo) a.lo = x;
      } else {
        const b = t.buf; b.data[b.i % b.cap] = x; b.i++;
      }
    }
  }
  function quantileOf(arr, pct) { // linear-interpolated percentile
    const s = arr.slice().sort((a, b) => a - b), m = s.length;
    if (m === 1) return s[0];
    const r = (pct / 100) * (m - 1), lo = Math.floor(r), f = r - lo;
    return lo + 1 < m ? s[lo] + f * (s[lo + 1] - s[lo]) : s[lo];
  }
  function freqMap(arr) { const m = new Map(); for (const v of arr) m.set(v, (m.get(v) || 0) + 1); return m; }
  function modeOf(arr) { let best = arr[0], bc = 0; for (const [v, c] of freqMap(arr)) if (c > bc) { bc = c; best = v; } return best; }
  function entropyOf(arr) { // Shannon entropy in bits of the empirical distribution
    const m = arr.length; let h = 0;
    for (const c of freqMap(arr).values()) { const p = c / m; h -= p * Math.log2(p); }
    return h;
  }
  // Population-convention moment stats (÷ n, matching the per-variable mean±sd).
  function trackerValue(t) {
    if (t.kind === 'moment') {
      const a = t.acc;
      if (t.stat === 'Mean') return a.n >= 1 ? a.mx : null;
      if (a.n < 2) return null;
      switch (t.stat) {
        case 'Var': return a.Mx2 / a.n;
        case 'SD': return Math.sqrt(a.Mx2 / a.n);
        case 'Cov': return a.Cxy / a.n;
        case 'Corr': { const d = Math.sqrt(a.Mx2 * a.My2); return d > 0 ? a.Cxy / d : null; }
      }
      return null;
    }
    if (t.kind === 'extreme') { const a = t.acc; if (a.n < 1) return null; return t.stat === 'Max' ? a.hi : a.lo; }
    const arr = t.buf.data;
    if (arr.length < 1) return null;
    if (t.kind === 'mode') return modeOf(arr);
    if (t.kind === 'entropy') return entropyOf(arr);
    return quantileOf(arr, t.pct);
  }
  const readTrackers = () => trackers.map((t) => ({ label: t.label, stat: t.stat, value: trackerValue(t) }));

  // Draw one accepted frame. Returns {accepted, attempts, values}.
  function step(maxAttempts = 10000) {
    let attempts = 0, accepted = false;
    do {
      freshOmega();
      attempts++;
      if (conditions.length === 0 || conditionsHold()) { accepted = true; break; }
    } while (attempts < maxAttempts);
    // Evaluate every variable under the (accepted) omega — same caches => coupled.
    const values = {};
    for (const name of varOrder) values[name] = evalNode(variables.get(name).ast);
    if (accepted) updateTrackers();   // same omega => statistics stay coupled too
    return { accepted, attempts, values };
  }

  // Draw exactly one raw omega (no retry). Lets the UI show rejections.
  function probe() {
    freshOmega();
    const accepted = conditions.length === 0 || conditionsHold();
    const values = {};
    for (const name of varOrder) values[name] = evalNode(variables.get(name).ast);
    if (accepted) updateTrackers();
    return { accepted, values };
  }

  const scalarVars = () => varOrder.filter((n) => {
    freshOmega();
    return !Array.isArray(evalNode(variables.get(n).ast));
  });
  const astOf = (n) => { const e = variables.get(n); return e ? e.ast : null; };
  const eventNames = varOrder.filter((n) => variables.get(n).isEvent);
  const isEventVar = (n) => { const e = variables.get(n); return !!(e && e.isEvent); };
  const readEvents = () => eventNames.map((n) => ({ name: n, canon: variables.get(n).canon }));

  return {
    varOrder,
    constants,
    conditions,
    plots,
    hasConditions: conditions.length > 0,
    hasTrackers: trackers.length > 0,
    readTrackers,
    eventNames,
    hasEvents: eventNames.length > 0,
    isEventVar,
    readEvents,
    step,
    probe,
    scalarVars,
    astOf,
  };
}

// Browser: expose the engine as globals (classic scripts share top-level scope,
// so the app page's inline script can call compile()/scalarBin() directly) and
// on window.RVEngine.  Node: module.exports for the unit tests.
if (typeof window !== 'undefined') window.RVEngine = { compile, parseExpression, scalarBin };
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { compile, parseExpression, scalarBin };
}
