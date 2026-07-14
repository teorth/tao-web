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
const EVENT_FUNCS = new Set(['AND', 'OR', 'NOT', 'XOR', 'DISTINCT']);
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
  'SUM', 'PROD', 'AVERAGE', 'MEAN', 'COUNT', 'STDEV', 'VAR', 'NUNIQUE', 'DISTINCT',
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
  P: { kind: 'moment', argc: 1, event: true }, // probability of an event = Mean of its indicator
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
  p: 'P', prob: 'P', probability: 'P',
  median: 'Median', med: 'Median', q1: 'Q1', q3: 'Q3',
  percentile: 'Percentile', pctile: 'Percentile', mode: 'Mode',
  entropy: 'Entropy', shannon: 'Entropy', max: 'Max', maximum: 'Max', min: 'Min', minimum: 'Min',
};
const STAT_NAMES = 'Mean, SD, Var, Cov, Corr, P, Median, Q1, Q3, Percentile, Mode, Entropy, Max, Min';
const SAMPLE_CAP = 2048; // ring-buffer size for quantile/mode statistics

// Reserved identifiers a user may NOT reuse as a variable/constant/event name.
// Checked case-insensitively: even where the parser could disambiguate (e.g. a
// variable Boolean vs the constructor Boolean), shadowing is bad practice, so we
// forbid it and teach a clearer name. Built from every keyword, operator word,
// function, distribution, and constructor alias — everything that can appear in an
// EXPRESSION. Statistics (Mean, P, Cov, …) are deliberately NOT reserved: they live
// only inside the `statistic` command, so they can't shadow anything in an
// expression, and this keeps natural names like `p`, `sd`, `cov` free for variables.
const RESERVED = new Set();
for (const w of ['let', 'plot', 'statistic', 'track', 'condition', 'on', 'and', 'or', 'not', 'xor', 'if', 'then', 'else', 'true', 'false']) RESERVED.add(w);
for (const s of FUNCS) RESERVED.add(s.toLowerCase());
for (const s of DISTS) RESERVED.add(s.toLowerCase());
for (const s of Object.keys(DIST_ALIAS)) RESERVED.add(s);

// Canonical, whitespace-independent string for an AST. `X > 3` and `X>3` render
// identically, while `X > 3` and `X > 2+1` stay distinct — exactly the identity
// rule events (and, later, universes) use to decide when two events are "equal".
function astToStr(node) {
  switch (node.t) {
    case 'num': return String(node.v);
    case 'bool': return node.v ? 'True' : 'False';
    case 'const': case 'var': return node.name;
    case 'set': return '{' + node.values.join(',') + '}';
    case 'vec': return '[' + node.items.map(astToStr).join(',') + ']';
    case 'dist': case 'call': return node.name + '(' + node.args.map(astToStr).join(',') + ')';
    case 'unop': return node.op === 'not' ? '(not ' + astToStr(node.a) + ')' : '(' + node.op + astToStr(node.a) + ')';
    case 'binop': {
      const word = BOOL_OPS.has(node.op);
      return '(' + astToStr(node.a) + (word ? ' ' + node.op + ' ' : node.op) + astToStr(node.b) + ')';
    }
    case 'given': return '(' + astToStr(node.expr) + ' | ' + astToStr(node.event) + ')';
    default: return '?';
  }
}
// Is this finalised node an event (0/1 indicator, shown as True/False)?
function nodeIsEvent(node, variables) {
  if (!node) return false;
  switch (node.t) {
    case 'bool': return true;
    case 'binop': return CMP_OPS.has(node.op) || BOOL_OPS.has(node.op);
    case 'unop': return node.op === 'not';
    case 'dist': return !!node.isEvent;
    case 'given': return nodeIsEvent(node.expr, variables); // (E | F) is an event iff E is
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
// Index of the first top-level single '|' (a conditioning bar, not '||'), or -1.
// Used to desugar Cov(X, Y | E) into Cov((X|E), (Y|E)) at the statistic level.
function topLevelBar(s) {
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '(' || ch === '{') depth++;
    else if (ch === ')' || ch === '}') depth--;
    else if (ch === '|' && depth === 0) {
      if (s[i + 1] === '|' || s[i - 1] === '|') { i++; continue; } // skip the || (or) operator
      return i;
    }
  }
  return -1;
}
// If `body` is exactly Name( … ) with the closing paren at the very end, return
// {name, args}; otherwise null (so Max(X) - Min(X) is treated as a combination).
function asSingleCall(body) {
  const m = body.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*\(/);
  if (!m) return null;
  let depth = 0, i = m[0].length - 1;
  for (; i < body.length; i++) {
    if (body[i] === '(') depth++;
    else if (body[i] === ')') { depth--; if (depth === 0) break; }
  }
  return i === body.length - 1 ? { name: m[1], args: body.slice(m[0].length, i) } : null;
}

// ===========================================================================
// Tokeniser
// ===========================================================================
function tokenize(src) {
  const toks = [];
  let i = 0;
  const two = { ':=': 1, '<=': 1, '>=': 1, '==': 1, '!=': 1, '..': 1, '&&': 1, '||': 1, '**': 1 };
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
    // two-char ops ('**' is a Python-style alias for '^' = power)
    const pair = src.slice(i, i + 2);
    if (two[pair]) { toks.push({ t: 'op', v: pair === '**' ? '^' : pair }); i += 2; continue; }
    // single-char ops ('!' is boolean NOT; '!=' handled above; '|' is the
    // conditioning bar in (X | E), distinct from '||' = boolean or)
    if ('+-*/^(),{}<>=!|'.includes(c)) { toks.push({ t: 'op', v: c }); i++; continue; }
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

  function parseExpr() { return parseGiven(); }

  // conditioning bar (lowest precedence of all): (X | E) reads "X given E".
  // `|` is distinct from `||` (boolean or). Left-associative so (X | E) | F nests.
  function parseGiven() {
    let a = parseOr();
    while (isOp('|')) { next(); a = { t: 'given', expr: a, event: parseOr() }; }
    return a;
  }

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
      const lc = node.name.toLowerCase();
      if (lc === 'true' || lc === 'false') return { t: 'bool', v: lc === 'true' ? 1 : 0 }; // boolean literals (events)
      if (ctx.variables.has(node.name)) return { t: 'var', name: node.name };
      if (ctx.constants.has(node.name)) return { t: 'const', name: node.name };
      throw new Error(`Unknown identifier '${node.name}'`);
    }
    case 'unop': return { t: 'unop', op: node.op, a: finalize(node.a, ctx) };
    case 'binop': return { t: 'binop', op: node.op, a: finalize(node.a, ctx), b: finalize(node.b, ctx) };
    case 'given': return { t: 'given', expr: finalize(node.expr, ctx), event: finalize(node.event, ctx) };
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
    case 'bool': return node.v;
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
    case 'NUNIQUE': return new Set(toArr(args[0])).size;                 // number of distinct values
    case 'DISTINCT': { const v = toArr(args[0]); return new Set(v).size === v.length ? 1 : 0; } // event: all distinct?
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

  // ---- universes: a tree of probability spaces (default + conditioning edges) ----
  // A universe is identified by the ORDERED path of canonical events from the
  // default space (conditioning does not freely commute once sampling is
  // interleaved, so we keep the path — not an unordered set). `(X | E)` creates a
  // child universe; expressions may not mix quantities from different universes.
  const universeReg = new Map();          // key -> { path:[canon], parentKey, eventAst }
  universeReg.set('', { path: [], parentKey: null, eventAst: null });
  const uKeyOf = (path) => path.join('␟');
  const uLabel = (path) => path.map((c) => c.replace(/^\((.*)\)$/, '$1')).join(', ');
  function unifyU(a, b) {                  // null = universe-agnostic (constants); throws on a real mix
    if (a === null) return b;
    if (b === null) return a;
    if (uKeyOf(a) === uKeyOf(b)) return a;
    throw new Error(`cannot mix quantities from different universes ('${uLabel(a) || 'default'}' vs '${uLabel(b) || 'default'}')`);
  }
  // Universe (path) of a finalised expression; registers any (·|E) universes en route.
  function universeOf(node) {
    switch (node.t) {
      case 'num': case 'bool': case 'const': case 'set': return null;    // universe-agnostic
      case 'dist': { let u = []; for (const a of node.args) if (a.t !== 'set') u = unifyU(u, universeOf(a)); return u === null ? [] : u; }
      case 'var': { const e = ctx.variables.get(node.name); return e ? (e.universe || null) : null; }
      case 'unop': return universeOf(node.a);
      case 'binop': return unifyU(universeOf(node.a), universeOf(node.b));
      case 'vec': { let u = null; for (const it of node.items) u = unifyU(u, universeOf(it)); return u; }
      case 'call': { let u = null; for (const a of node.args) u = unifyU(u, universeOf(a)); return u; }
      case 'given': {
        const parent = universeOf(node.expr) || [];                      // the thing being conditioned
        const ev = universeOf(node.event);
        // the event is evaluated in the CHILD draw, so it may reference the parent
        // universe or the default one (default variables transport down); it may
        // NOT reference some unrelated (sibling) universe.
        if (ev !== null && ev.length && uKeyOf(ev) !== uKeyOf(parent))
          throw new Error(`the conditioning event is from universe '${uLabel(ev)}', not the one being conditioned ('${uLabel(parent) || 'default'}')`);
        const path = parent.concat([astToStr(node.event)]);
        const key = uKeyOf(path);
        if (!universeReg.has(key)) universeReg.set(key, { path, parentKey: uKeyOf(parent), eventAst: node.event });
        return path;
      }
      default: return null;
    }
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
      if (mCond) {
        const ev = finalize(parseExpression(mCond[1]), ctx);
        const u = universeOf(ev);
        if (u && u.length) throw new Error(`'condition on' takes a default-universe event; '${uLabel(u)}' is already conditioned (use (X | …) for that)`);
        conditions.push(ev); continue;
      }
      // plot A  |  plot A, B   (multiple `plot` lines -> multiple windows)
      const mPlot = line.match(/^plot\s+(.+)$/i);
      if (mPlot) {
        const parts = mPlot[1].split(',').map((s) => s.trim());
        if (parts.length > 2) throw new Error(`plot takes one variable (1-D) or two (2-D), not ${parts.length}`);
        if (parts.some((p) => !p)) throw new Error('plot has an empty variable name (check for a stray comma)');
        plots.push(parts.length === 2 ? { mode: '2d', a: parts[0], b: parts[1] } : { mode: '1d', a: parts[0] });
        continue;
      }
      // statistic <expr>   (alias: track ...) — an empirical observable. <expr> is a
      // statistic call (Mean(X), Cov(X,Y), P(E), …) or an ARITHMETIC combination of
      // statistics and numbers, e.g. Max(X) - Min(X). Because the line opens with the
      // `statistic` keyword the whole expression is parsed in "statistic context":
      // numerals are constant statistics, statistic-calls are leaves, and + - * / ^
      // (with parentheses) combine them. A bare random variable is NOT a statistic.
      const mStat = line.match(/^(?:statistic|track)\s+(.+)$/i);
      if (mStat) {
        const body = mStat[1].trim();
        const subs = [];
        // build a sub-statistic (its own accumulator) from a canonical name + raw args
        const makeSub = (canon, rawArgs) => {
          const def = STAT_DEF[canon];
          if (rawArgs.length !== def.argc) throw new Error(`${canon} expects ${def.argc} argument${def.argc > 1 ? 's' : ''}`);
          const sub = { stat: canon, kind: def.kind };
          if (def.pctArg) { // last argument is a numeric percentage in [0, 100]
            let p; try { p = evalConst(rawArgs[1], ctx); } catch (_) { p = NaN; }
            if (!(p >= 0 && p <= 100)) throw new Error('Percentile expects a percentage between 0 and 100');
            sub.pct = p; sub.exprs = [finalize(rawArgs[0], ctx)];
          } else {
            sub.exprs = rawArgs.map((a) => finalize(a, ctx));
            if (def.pct != null) sub.pct = def.pct;
          }
          if (def.event && !nodeIsEvent(sub.exprs[0], ctx.variables)) throw new Error(`${canon}(…) expects an event (a True/False quantity)`);
          let tu = null; for (const e of sub.exprs) tu = unifyU(tu, universeOf(e)); sub.uKey = uKeyOf(tu || []);
          if (def.kind === 'moment') sub.acc = { n: 0, mx: 0, my: 0, Mx2: 0, My2: 0, Cxy: 0 };
          else if (def.kind === 'extreme') sub.acc = { n: 0, hi: -Infinity, lo: Infinity };
          else sub.buf = { data: [], i: 0, cap: SAMPLE_CAP };
          subs.push(sub); return { t: 'sub', i: subs.length - 1 };
        };
        // turn a parsed combinator AST into a statistic-combinator tree
        const toComb = (node) => {
          if (node.t === 'num') return { t: 'num', v: node.v };
          if (node.t === 'unop' && node.op === '-') return { t: 'unop', op: '-', a: toComb(node.a) };
          if (node.t === 'binop' && '+-*/^'.includes(node.op)) return { t: 'binop', op: node.op, a: toComb(node.a), b: toComb(node.b) };
          if (node.t === 'ref') {
            if (ctx.constants.has(node.name)) return { t: 'num', v: ctx.constants.get(node.name) };  // a constant is a trivial statistic
            if (ctx.variables.has(node.name)) throw new Error(`'${node.name}' is a random variable, not a statistic — wrap it, e.g. Mean(${node.name})`);
            const sc = STAT_ALIAS[node.name.toLowerCase()];
            if (sc) throw new Error(`${node.name} is a statistic — give it arguments, e.g. ${sc}(X)`);
            throw new Error(`unknown name '${node.name}' in a statistic`);
          }
          if (node.t === 'call') {
            const c = STAT_ALIAS[node.name.toLowerCase()];
            if (!c) throw new Error(`'${node.name}' is not a statistic (statistics: ${STAT_NAMES})`);
            return makeSub(c, node.args);
          }
          throw new Error('a statistic may only combine statistics (Mean, Cov, …) and numbers with + - * / ^');
        };
        // a lone statistic call gets the trailing "| E" conditioning sugar:
        // Cov(X, Y | E) == Cov((X|E), (Y|E)); Percentile(X | E, 50) conditions only X.
        const single = asSingleCall(body), sName = single && STAT_ALIAS[single.name.toLowerCase()];
        let combinator;
        if (sName) {
          let argsSrc = single.args, cond = null;
          const bar = topLevelBar(argsSrc);
          if (bar >= 0 && splitArgs(argsSrc.slice(bar + 1)).length <= 1) { cond = argsSrc.slice(bar + 1).trim(); argsSrc = argsSrc.slice(0, bar).trim(); }
          let argStrs = splitArgs(argsSrc);
          if (cond) argStrs = argStrs.map((a, i) => (STAT_DEF[sName].pctArg && i === argStrs.length - 1) ? a : `(${a} | ${cond})`);
          combinator = makeSub(sName, argStrs.map((s) => parseExpression(s)));
        } else {
          combinator = toComb(parseExpression(body));
        }
        const uKey = subs.length && subs.every((s) => s.uKey === subs[0].uKey) ? subs[0].uKey : '';
        trackers.push({ label: body, subs, combinator, uKey });
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
        const universe = universeOf(ast);   // which universe this variable is native to
        ctx.variables.set(name, { ast, isEvent, canon: isEvent ? astToStr(ast) : null, universe });
        varOrder.push(name);
        continue;
      }
      throw new Error('Could not parse statement');
    } catch (e) {
      throw new Error(`Line ${ln + 1}: ${e.message}\n  > ${line}`);
    }
  }

  // ---- per-universe evaluation with caches --------------------------------
  const constants = ctx.constants, variables = ctx.variables;

  // Materialise a runtime object per universe, with its FLATTENED conditions
  // (default's global conditions, plus one event per edge down to it). Each
  // universe owns its own leaf/var caches, so different universes draw
  // independently while variables within one universe stay coupled.
  const uRuntime = new Map();
  function buildU(key) {
    if (uRuntime.has(key)) return uRuntime.get(key);
    const info = universeReg.get(key);
    const conds = info.parentKey === null ? conditions.slice()
      : buildU(info.parentKey).conditions.concat([info.eventAst]);
    const U = { key, path: info.path, conditions: conds, leafCache: {}, varCache: {} };
    uRuntime.set(key, U); return U;
  }
  for (const key of universeReg.keys()) buildU(key);
  const varU = (name) => { const e = variables.get(name); return uRuntime.get(uKeyOf((e && e.universe) || [])); };

  function evalNode(node, U) {
    switch (node.t) {
      case 'num': return node.v;
      case 'bool': return node.v;
      case 'const': return constants.get(node.name);
      case 'var': {
        if (node.name in U.varCache) return U.varCache[node.name];
        const v = evalNode(variables.get(node.name).ast, U);
        U.varCache[node.name] = v; return v;
      }
      case 'dist': {
        if (node.id in U.leafCache) return U.leafCache[node.id];
        const v = sampleDist(node.name, node.args, U);
        U.leafCache[node.id] = v; return v;
      }
      case 'given': return evalNode(node.expr, U);   // conditioning enforced by U's rejection
      case 'vec': return node.items.map((it) => evalNode(it, U));
      case 'unop': return mapUn(node.op, evalNode(node.a, U));
      case 'binop': return mapBin(node.op, evalNode(node.a, U), evalNode(node.b, U));
      case 'call': return callFn(node.name, node.args.map((a) => evalNode(a, U)));
      default: throw new Error(`Cannot evaluate ${node.t}`);
    }
  }
  const num = (node, U) => asScalar(evalNode(node, U));
  function sampleDist(name, args, U) {
    const nm = (i) => num(args[i], U);
    switch (name) {
      case 'Unif':
        if (args.length === 1 && args[0].t === 'set') {
          const s = args[0].values; return s[Math.floor(Math.random() * s.length)];
        }
        if (args.length === 2) { const a = nm(0), b = nm(1); return a + (b - a) * Math.random(); }
        throw new Error('Unif expects (a,b) or a set {..}');
      case 'Exp': return sampleExp(nm(0));
      case 'Normal': case 'Gaussian': return sampleNormal(nm(0), nm(1));
      case 'Bernoulli': return Math.random() < nm(0) ? 1 : 0;
      case 'Boolean': return Math.random() < nm(0) ? 1 : 0; // event-typed coin
      case 'Binomial': return sampleBinomial(Math.round(nm(0)), nm(1));
      case 'Poisson': return samplePoisson(nm(0));
      case 'Geometric': return sampleGeom(nm(0));
      default: throw new Error(`Unknown distribution ${name}`);
    }
  }

  const freshOmega = (U) => { U.leafCache = {}; U.varCache = {}; };
  function holdsIn(U) {
    for (const c of U.conditions) if (asScalar(evalNode(c, U)) === 0) return false;
    return true;
  }

  // ---- empirical statistics: running moments over accepted frames ----------
  function safeNum(e, U) {
    try { const v = num(e, U); return (typeof v === 'number' && isFinite(v)) ? v : null; }
    catch (_) { return null; }
  }
  // Update each sub-statistic from its universe's accepted draw this tick: moment
  // stats keep exact online moments; sample stats push into a bounded ring buffer.
  function updateTrackers(uinfo) {
    for (const t of trackers) for (const sub of t.subs) {
      const info = uinfo[sub.uKey];
      if (!info || !info.accepted) continue;
      const U = uRuntime.get(sub.uKey);
      const x = safeNum(sub.exprs[0], U);
      if (x == null) continue;
      if (sub.kind === 'moment') {
        let y = null;
        if (sub.exprs.length === 2) { y = safeNum(sub.exprs[1], U); if (y == null) continue; }
        const a = sub.acc; a.n++;
        const dx = x - a.mx; a.mx += dx / a.n; a.Mx2 += dx * (x - a.mx);
        if (y != null) { const dy = y - a.my; a.my += dy / a.n; a.My2 += dy * (y - a.my); a.Cxy += dx * (y - a.my); }
      } else if (sub.kind === 'extreme') {
        const a = sub.acc; a.n++; if (x > a.hi) a.hi = x; if (x < a.lo) a.lo = x;
      } else {
        const b = sub.buf; b.data[b.i % b.cap] = x; b.i++;
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
  // Value of one sub-statistic. Population-convention moments (÷ n, matching the
  // per-variable mean±sd). Returns null until it has enough data.
  function subValue(t) {
    if (t.kind === 'moment') {
      const a = t.acc;
      if (t.stat === 'Mean' || t.stat === 'P') return a.n >= 1 ? a.mx : null;
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
  // Combine sub-statistics with arithmetic; null propagates (not enough data yet).
  function evalComb(node, subs) {
    switch (node.t) {
      case 'num': return node.v;
      case 'sub': return subValue(subs[node.i]);
      case 'unop': { const a = evalComb(node.a, subs); return a == null ? null : -a; }
      case 'binop': { const a = evalComb(node.a, subs), b = evalComb(node.b, subs); return (a == null || b == null) ? null : scalarBin(node.op, a, b); }
      default: return null;
    }
  }
  const readTrackers = () => trackers.map((t) => ({
    label: t.label, value: evalComb(t.combinator, t.subs),
    uKey: t.uKey, uLabel: uLabel((universeReg.get(t.uKey) || { path: [] }).path),
  }));

  // Sample EVERY universe this tick (each rejection-samples its own omega), then
  // read each variable in its native universe. Returns {accepted, attempts,
  // values, universes} where `universes` maps a universe key -> {accepted, attempts}.
  function sampleUniverses(maxAttempts) {
    const uinfo = {};
    for (const U of uRuntime.values()) {
      let attempts = 0, accepted = false;
      do {
        freshOmega(U); attempts++;
        if (U.conditions.length === 0 || holdsIn(U)) { accepted = true; break; }
      } while (maxAttempts > 1 && attempts < maxAttempts);
      uinfo[U.key] = { accepted, attempts };
    }
    const values = {};
    for (const name of varOrder) {
      const U = varU(name);
      if (uinfo[U.key].accepted) values[name] = evalNode(variables.get(name).ast, U);
    }
    updateTrackers(uinfo);
    const d = uinfo[''] || { accepted: true, attempts: 1 };
    return { accepted: d.accepted, attempts: d.attempts, values, universes: uinfo };
  }
  const step = (maxAttempts = 10000) => sampleUniverses(maxAttempts);
  const probe = () => sampleUniverses(1);   // one raw draw per universe (no retry)

  const scalarVars = () => varOrder.filter((n) => {
    const U = varU(n); freshOmega(U);
    return !Array.isArray(evalNode(variables.get(n).ast, U));
  });

  // Validate plot targets now that every variable is known, so a bad `plot` line
  // is a reported error rather than a silent skip / fallback to the first variable.
  {
    const scalarSet = new Set(scalarVars());
    const uk = (n) => uKeyOf(variables.get(n).universe || []);
    for (const pl of plots) {
      for (const nm of (pl.mode === '2d' ? [pl.a, pl.b] : [pl.a])) {
        if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(nm)) throw new Error(`plot expects a variable name, not '${nm}' — name it first, e.g. Y = ${nm}`);
        if (constants.has(nm)) throw new Error(`cannot plot '${nm}': it is a constant, not a random variable`);
        if (!variables.has(nm)) throw new Error(`cannot plot '${nm}': unknown variable`);
        if (!scalarSet.has(nm)) throw new Error(`cannot plot '${nm}': it is a vector, not a scalar`);
      }
      if (pl.mode === '2d' && uk(pl.a) !== uk(pl.b))
        throw new Error(`cannot plot '${pl.a}, ${pl.b}' together: they live in different universes`);
    }
  }
  const astOf = (n) => { const e = variables.get(n); return e ? e.ast : null; };
  // A structured, self-contained snapshot for code exporters (e.g. the Python
  // export): the finalised ASTs, universes with their flattened conditions, and
  // the trackers' sub-statistics. Everything here is plain data (JSON-cloneable).
  const exportModel = () => ({
    constants: [...constants.entries()],
    variables: varOrder.map((n) => { const e = variables.get(n); return { name: n, ast: e.ast, isEvent: e.isEvent, universe: uKeyOf(e.universe || []) }; }),
    universes: [...uRuntime.values()].map((U) => ({ key: U.key, path: U.path, label: uLabel(U.path), conditions: U.conditions })),
    trackers: trackers.map((t) => ({ label: t.label, uKey: t.uKey, combinator: t.combinator,
      subs: t.subs.map((s) => ({ stat: s.stat, kind: s.kind, exprs: s.exprs, pct: s.pct, uKey: s.uKey })) })),
    plots: plots.map((p) => ({ ...p })),
    globalConditions: conditions,
  });
  const eventNames = varOrder.filter((n) => variables.get(n).isEvent);
  const isEventVar = (n) => { const e = variables.get(n); return !!(e && e.isEvent); };
  const readEvents = () => eventNames.map((n) => ({ name: n, canon: variables.get(n).canon }));
  // universe helpers for the UI
  const varUniverse = (n) => uKeyOf((variables.get(n) || {}).universe || []);
  const universeList = () => [...uRuntime.values()].map((U) => ({ key: U.key, path: U.path, label: uLabel(U.path) }));

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
    hasUniverses: uRuntime.size > 1,
    varUniverse,
    universeList,
    step,
    probe,
    scalarVars,
    astOf,
    exportModel,
  };
}

// Browser: expose the engine as globals (classic scripts share top-level scope,
// so the app page's inline script can call compile()/scalarBin() directly) and
// on window.RVEngine.  Node: module.exports for the unit tests.
if (typeof window !== 'undefined') window.RVEngine = { compile, parseExpression, scalarBin };
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { compile, parseExpression, scalarBin };
}
