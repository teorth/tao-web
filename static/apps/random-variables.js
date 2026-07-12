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
  'Binomial', 'Poisson', 'Geometric'
]);

const FUNCS = new Set([
  // reductions (vector -> scalar)
  'SUM', 'PROD', 'AVERAGE', 'MEAN', 'COUNT', 'STDEV', 'VAR',
  // variadic / vector
  'MAX', 'MIN',
  // elementwise scalar maths
  'ABS', 'SQRT', 'EXP', 'LOG', 'LN', 'SIN', 'COS', 'TAN',
  'FLOOR', 'CEIL', 'ROUND', 'SIGN',
  // logic
  'IF'
]);

// ===========================================================================
// Tokeniser
// ===========================================================================
function tokenize(src) {
  const toks = [];
  let i = 0;
  const two = { ':=': 1, '<=': 1, '>=': 1, '==': 1, '!=': 1, '..': 1 };
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
    // single-char ops
    if ('+-*/^(),{}<>='.includes(c)) { toks.push({ t: 'op', v: c }); i++; continue; }
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

  function parseExpr() { return parseCompare(); }

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
      const name = node.name;
      if (name === 'Sample') {
        if (node.args.length !== 2) throw new Error('Sample expects (distribution, count)');
        const n = Math.round(evalConst(node.args[1], ctx));
        if (!(n >= 1) || n > 100000) throw new Error(`Sample count must be an integer in 1..100000 (got ${n})`);
        const items = [];
        for (let k = 0; k < n; k++) items.push(finalize(clone(node.args[0]), ctx));
        return { t: 'vec', items };
      }
      if (DISTS.has(name)) {
        // set arguments stay as-is; scalar args get finalised
        const args = node.args.map((a) => (a.t === 'set' ? a : finalize(a, ctx)));
        return { t: 'dist', name, args, id: ctx.nextId() };
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
    case 'unop': { const a = evalConst(node.a, ctx); return node.op === '-' ? -a : a; }
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
  if (Array.isArray(a)) return a.map((x) => (op === '-' ? -x : x));
  return op === '-' ? -a : a;
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
      // let NAME = EXPR   (constant)   [ := accepted as a lenient alias ]
      const mLet = line.match(/^let\s+([A-Za-z_][A-Za-z0-9_]*)\s*(?::=|=(?!=))\s*(.+)$/i);
      if (mLet) {
        const val = evalConst(parseExpression(mLet[2]), ctx);
        ctx.constants.set(mLet[1], val);
        continue;
      }
      // NAME = EXPR   (random variable)   [ := accepted as a lenient alias ]
      const mAssign = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*(?::=|=(?!=))\s*(.+)$/);
      if (mAssign) {
        const name = mAssign[1];
        if (ctx.constants.has(name)) throw new Error(`'${name}' is already a constant`);
        const ast = finalize(parseExpression(mAssign[2]), ctx);
        ctx.variables.set(name, { ast });
        if (!varOrder.includes(name)) varOrder.push(name);
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
    return { accepted, attempts, values };
  }

  // Draw exactly one raw omega (no retry). Lets the UI show rejections.
  function probe() {
    freshOmega();
    const accepted = conditions.length === 0 || conditionsHold();
    const values = {};
    for (const name of varOrder) values[name] = evalNode(variables.get(name).ast);
    return { accepted, values };
  }

  const scalarVars = () => varOrder.filter((n) => {
    freshOmega();
    return !Array.isArray(evalNode(variables.get(n).ast));
  });
  const astOf = (n) => { const e = variables.get(n); return e ? e.ast : null; };

  return {
    varOrder,
    constants,
    conditions,
    plots,
    hasConditions: conditions.length > 0,
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
