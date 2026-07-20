/* grimoire.js — DOM-free core for the proof-crafting game (a QED successor, Lean-flavored).
 *
 * Working title "Lean Grimoire". You craft proven statements ("potions", hA : A) from the
 * hypotheses by applying recipes (Lean-named laws like And.intro), until you craft the goal; a live
 * pseudo-Lean proof assembles in the "spellbook".
 *
 * Stage 0 (propositional, Chapters 1–2): the unified `Expr`, a symbol registry that drives the parser,
 * the min-parens renderer, and the Lean emitter at once; a Recipe interface whose matcher is a black box
 * (simple now, smarter later); the And.intro / And.left / And.right recipes; craft + live Lean emission.
 *
 * Design notes carried forward: everything in scope is a Binding `name : type` (Lean's local context) —
 * a potion when `type : Prop`, later a gemstone when `type` is a data sort. Sorts and per-type Theories
 * (persistent axioms) are wired (each Expr carries a `sort`) but dormant in Stage 0. Output is pseudo-Lean
 * in the deliberately non-Mathlib-idiomatic QED style (see scratch/qed-lean-notes.lean).
 *
 * Exposed as window.Grimoire and module.exports.
 */
(function (root) {
  'use strict';

  var PROP = 'Prop';   // the only sort in Stage 0; the field exists everywhere for the many-sorted future
  var OMEGA = 'Ω';     // the first data sort (Chapter 16+); modeled in Lean by `variable {Ω}` (Ω is a valid identifier)

  // ---------- symbol registry: one table drives parse + render + Lean emit ----------
  // {name, arity, fixity:'infix'|'prefix'|'atom', prec, assoc:'right', uni, abbrev:[…], resultSort}
  var SYMBOLS = {};
  function defSym(s) { SYMBOLS[s.name] = s; return s; }
  // precedences echo Lean's; all binary connectives are RIGHT-associative, as in Lean.
  defSym({ name: 'NOT', arity: 1, fixity: 'prefix', prec: 40, uni: '¬', abbrev: ['\\not', '\\neg', '\\lnot'], resultSort: PROP });
  defSym({ name: 'AND', arity: 2, fixity: 'infix', prec: 35, assoc: 'right', uni: '∧', abbrev: ['\\and', '\\wedge'], resultSort: PROP });
  defSym({ name: 'OR', arity: 2, fixity: 'infix', prec: 30, assoc: 'right', uni: '∨', abbrev: ['\\or', '\\vee'], resultSort: PROP });
  defSym({ name: 'IMPLIES', arity: 2, fixity: 'infix', prec: 25, assoc: 'right', uni: '→', abbrev: ['\\to', '\\imp', '\\rightarrow'], resultSort: PROP });
  defSym({ name: 'IFF', arity: 2, fixity: 'infix', prec: 20, assoc: 'right', uni: '↔', abbrev: ['\\iff', '\\leftrightarrow'], resultSort: PROP });
  defSym({ name: 'TRUE', arity: 0, fixity: 'atom', uni: 'True', abbrev: ['\\true', '\\top'], resultSort: PROP });
  defSym({ name: 'FALSE', arity: 0, fixity: 'atom', uni: 'False', abbrev: ['\\false', '\\bot'], resultSort: PROP });
  // Chapter 16+: predicate symbols (function application, rendered `Q(x, y)` on the board, `Q x y` in Lean).
  // The registry entry only marks the symbol as an `app` of result-sort Prop; each exercise's `preds` pins the
  // actual arity/argument sorts (so `Q` can be binary in one exercise and a predicate letter reused elsewhere).
  defSym({ name: 'P', arity: 1, fixity: 'app', argSorts: [OMEGA], resultSort: PROP, uni: 'P' });
  defSym({ name: 'Q', arity: 2, fixity: 'app', argSorts: [OMEGA, OMEGA], resultSort: PROP, uni: 'Q' });
  defSym({ name: 'R', arity: 1, fixity: 'app', argSorts: [OMEGA], resultSort: PROP, uni: 'R' });
  defSym({ name: 'S', arity: 1, fixity: 'app', argSorts: [OMEGA], resultSort: PROP, uni: 'S' });

  // ---------- Expr: {tag:'var',name,sort} | {tag:'app',sym,args,sort} | {tag:'binder',q,v,body,sort} ----------
  function varE(name, sort) { return { tag: 'var', name: name, sort: sort || PROP }; }
  function appE(symName, args) { return { tag: 'app', sym: symName, args: args || [], sort: SYMBOLS[symName].resultSort }; }
  function FORALL(v, body) { return { tag: 'binder', q: 'forall', v: { name: v.name, sort: v.sort }, body: body, sort: PROP }; }
  function EXISTS(v, body) { return { tag: 'binder', q: 'exists', v: { name: v.name, sort: v.sort }, body: body, sort: PROP }; }
  function AND(a, b) { return appE('AND', [a, b]); }
  function OR(a, b) { return appE('OR', [a, b]); }
  function IMPLIES(a, b) { return appE('IMPLIES', [a, b]); }
  function IFF(a, b) { return appE('IFF', [a, b]); }
  function NOT(a) { return appE('NOT', [a]); }
  function TRUE() { return appE('TRUE', []); }
  function FALSE() { return appE('FALSE', []); }
  function sortOf(e) { return e.sort; }
  // structural equality, up to α-renaming of bound variables (de Bruijn depth comparison)
  function exprEqR(a, b, ra, rb) {
    if (a.tag !== b.tag) return false;
    if (a.tag === 'var') {
      var ia = ra.lastIndexOf(a.name), ib = rb.lastIndexOf(b.name);
      if (ia >= 0 || ib >= 0) return ia === ib && a.sort === b.sort;   // both bound → same binding depth
      return a.name === b.name && a.sort === b.sort;                     // both free
    }
    if (a.tag === 'binder') return a.q === b.q && a.v.sort === b.v.sort && exprEqR(a.body, b.body, ra.concat([a.v.name]), rb.concat([b.v.name]));
    if (a.sym !== b.sym || a.args.length !== b.args.length) return false;
    for (var i = 0; i < a.args.length; i++) if (!exprEqR(a.args[i], b.args[i], ra, rb)) return false;
    return true;
  }
  function exprEq(a, b) { return exprEqR(a, b, [], []); }
  function atomsOf(e, acc) { acc = acc || []; if (e.tag === 'var') acc.push(e.name); else if (e.tag === 'binder') atomsOf(e.body, acc); else e.args.forEach(function (x) { atomsOf(x, acc); }); return acc; }
  function varsInto(e, set) { if (e.tag === 'var') set[e.name] = 1; else if (e.tag === 'binder') varsInto(e.body, set); else e.args.forEach(function (a) { varsInto(a, set); }); return set; }
  function varsInOrder(e, acc) { acc = acc || []; if (e.tag === 'var') { if (acc.indexOf(e.name) < 0) acc.push(e.name); } else if (e.tag === 'binder') varsInOrder(e.body, acc); else e.args.forEach(function (a) { varsInOrder(a, acc); }); return acc; }
  function freeIn(e, name, sort) {   // does the variable (name,sort) occur free in e?
    if (e.tag === 'var') return e.name === name && e.sort === sort;
    if (e.tag === 'binder') return (e.v.name === name && e.v.sort === sort) ? false : freeIn(e.body, name, sort);
    return e.args.some(function (a) { return freeIn(a, name, sort); });
  }
  var GENSYM = 0;
  // capture-avoiding substitution: replace the free variable (name,sort) by `repl` throughout e
  function substE(e, name, sort, repl) {
    if (e.tag === 'var') return (e.name === name && e.sort === sort) ? repl : e;
    if (e.tag === 'binder') {
      if (e.v.name === name && e.v.sort === sort) return e;                       // shadowed by this binder
      if (freeIn(repl, e.v.name, e.v.sort)) {                                     // would capture → α-rename the binder
        var fresh = e.v.name + "'" + (++GENSYM), fv = { name: fresh, sort: e.v.sort };
        var body1 = substE(e.body, e.v.name, e.v.sort, varE(fresh, e.v.sort));
        return { tag: 'binder', q: e.q, v: fv, body: substE(body1, name, sort, repl), sort: PROP };
      }
      return { tag: 'binder', q: e.q, v: e.v, body: substE(e.body, name, sort, repl), sort: PROP };
    }
    return appE(e.sym, e.args.map(function (a) { return substE(a, name, sort, repl); }));
  }
  // free propositional atoms (sort Prop, not bound by a binder) — for the `variable {A B : Prop}` preamble
  function propAtoms(e, bound, out) {
    if (e.tag === 'var') { if (e.sort === PROP && bound.indexOf(e.name) < 0 && out.indexOf(e.name) < 0) out.push(e.name); }
    else if (e.tag === 'binder') propAtoms(e.body, bound.concat([e.v.name]), out);
    else e.args.forEach(function (a) { propAtoms(a, bound, out); });
    return out;
  }

  // ---------- \-abbreviation expander (Lean-IDE style), registry-driven ----------
  var ABBREV = {};
  Object.keys(SYMBOLS).forEach(function (k) { (SYMBOLS[k].abbrev || []).forEach(function (a) { ABBREV[a] = SYMBOLS[k].uni; }); });
  function expandAbbrevs(str) { return String(str).replace(/\\[a-zA-Z]+/g, function (m) { return ABBREV[m] !== undefined ? ABBREV[m] : m; }); }

  // ---------- parser: precedence climbing over the registry ----------
  var UNI_OP = {}; Object.keys(SYMBOLS).forEach(function (k) { var s = SYMBOLS[k]; if (s.fixity !== 'atom') UNI_OP[s.uni] = k; });
  function tokenize(str) {
    var toks = [], i = 0;
    while (i < str.length) {
      var c = str[i];
      if (/\s/.test(c)) { i++; continue; }
      if (c === '(' || c === ')') { toks.push({ t: c }); i++; continue; }
      if (UNI_OP[c]) { toks.push({ t: 'op', sym: UNI_OP[c] }); i++; continue; }
      if (/[A-Za-z0-9_']/.test(c)) {
        var j = i; while (j < str.length && /[A-Za-z0-9_']/.test(str[j])) j++;
        var w = str.slice(i, j); i = j;
        if (w === 'True') toks.push({ t: 'atom', sym: 'TRUE' });
        else if (w === 'False') toks.push({ t: 'atom', sym: 'FALSE' });
        else toks.push({ t: 'id', name: w });
        continue;
      }
      return { error: 'unexpected character “' + c + '”' };
    }
    return { toks: toks };
  }
  function parse(str) {
    var tk = tokenize(expandAbbrevs(str));
    if (tk.error) return { ok: false, error: tk.error };
    var toks = tk.toks, pos = 0;
    function peek() { return toks[pos]; }
    function expr(minPrec) {
      var lhs = prefix(); if (!lhs.ok) return lhs;
      var e = lhs.expr;
      while (true) {
        var t = peek();
        if (!t || t.t !== 'op' || SYMBOLS[t.sym].fixity !== 'infix') break;
        var s = SYMBOLS[t.sym]; if (s.prec < minPrec) break;
        pos++;
        var rhs = expr(s.assoc === 'left' ? s.prec + 1 : s.prec);
        if (!rhs.ok) return rhs;
        e = appE(t.sym, [e, rhs.expr]);
      }
      return { ok: true, expr: e };
    }
    function prefix() {
      var t = peek();
      if (t && t.t === 'op' && SYMBOLS[t.sym].fixity === 'prefix') { pos++; var a = expr(SYMBOLS[t.sym].prec); if (!a.ok) return a; return { ok: true, expr: appE(t.sym, [a.expr]) }; }
      return atom();
    }
    function atom() {
      var t = toks[pos++];
      if (!t) return { ok: false, error: 'unexpected end of input' };
      if (t.t === '(') { var e = expr(0); if (!e.ok) return e; var c = toks[pos++]; if (!c || c.t !== ')') return { ok: false, error: 'expected “)”' }; return e; }
      if (t.t === 'id') return { ok: true, expr: varE(t.name, PROP) };
      if (t.t === 'atom') return { ok: true, expr: appE(t.sym, []) };
      return { ok: false, error: 'expected a formula' };
    }
    var r = expr(0); if (!r.ok) return r;
    if (pos !== toks.length) return { ok: false, error: 'unexpected extra input' };
    return { ok: true, expr: r.expr };
  }

  // ---------- renderer: minimal parentheses (shared by the board and the Lean output) ----------
  // opts.parens = true makes every compound sub-expression explicitly parenthesized (order-of-operations)
  var BINDER_PREC = 10;   // ∀/∃ bind looser than every connective (so they parenthesize as operands)
  function render(e, opts) {
    var parens = !!(opts && opts.parens), lean = !!(opts && opts.lean);
    function go(e, minPrec, top) {
      if (e.tag === 'var') return e.name;
      if (e.tag === 'binder') {
        var str = (e.q === 'forall' ? '∀' : '∃') + ' ' + e.v.name + ' : ' + e.v.sort + ', ' + go(e.body, 0, false);
        return (BINDER_PREC < minPrec || (parens && !top)) ? '(' + str + ')' : str;
      }
      var s = SYMBOLS[e.sym];
      if (s.fixity === 'atom') return s.uni;
      if (s.fixity === 'app') {   // predicate application: `Q x y` in Lean, `Q(x, y)` on the board
        var args = e.args.map(function (a) { return go(a, lean ? 100 : 0, false); });
        return lean ? e.sym + ' ' + args.join(' ') : e.sym + '(' + args.join(', ') + ')';
      }
      var str;
      if (s.fixity === 'prefix') str = s.uni + ' ' + go(e.args[0], s.prec, false);
      else str = go(e.args[0], s.assoc === 'left' ? s.prec : s.prec + 1, false) + ' ' + s.uni + ' ' + go(e.args[1], s.assoc === 'right' ? s.prec : s.prec + 1, false);
      return (s.prec < minPrec || (parens && !top)) ? '(' + str + ')' : str;
    }
    return go(e, 0, true);
  }

  // ---------- environment: one list of Bindings `name : type` (Lean local context) ----------
  function binding(name, type) { return { name: name, type: type }; }
  function newEnv(exercise) {
    // `vars` = the DATA half of the proof state (context variables of a non-Prop sort): given constants, plus any
    // variables introduced by ∀-introduction or `obtain`. This is the single source of truth for "in context".
    return { bindings: exercise.givens.map(function (g) { return binding(g.name, g.type); }), vars: (exercise.consts || []).map(function (c) { return { name: c.name, sort: c.sort }; }), goal: exercise.goal, steps: [], parent: null, assumption: null, depth: 0 };
  }
  function withEnv(env, over) {   // immutable env update preserving the nesting fields
    var o = { bindings: env.bindings, vars: env.vars, goal: env.goal, steps: env.steps, parent: env.parent, assumption: env.assumption, depth: env.depth };
    for (var k in over) o[k] = over[k];
    return o;
  }
  function implChain(types, tail) { var t = tail; for (var i = types.length - 1; i >= 0; i--) t = IMPLIES(types[i], t); return t; }
  // a sub-environment's `binder` is either a hypothesis {kind:'hyp',name,type} or a free variable {kind:'var',name,sort};
  // discharging wraps the proof in an implication (hyp) or a ∀ (var). Both emit `intro <name>` in Lean.
  function wrapBinder(b, tail) { return b.kind === 'var' ? FORALL({ name: b.name, sort: b.sort }, tail) : IMPLIES(b.type, tail); }
  function binderChain(binders, tail) { var t = tail; for (var i = binders.length - 1; i >= 0; i--) t = wrapBinder(binders[i], t); return t; }
  function byName(env, name) { for (var i = 0; i < env.bindings.length; i++) if (env.bindings[i].name === name) return env.bindings[i]; return null; }
  function freshName(type, env) {
    var base = 'h' + atomsOf(type).join(''), name = base, k = 2, used = {};
    env.bindings.forEach(function (b) { used[b.name] = 1; });
    while (used[name]) name = base + (k++);
    return name;
  }

  // ---------- recipes: the matcher is a black box on each recipe ----------
  // match(inputs, env) -> [ { output:Expr, lean:string } ]  (inputs are Bindings, in slot order)
  // an ingredient fed to a recipe is either a proof (a bench binding) or a formula (from the Formula bench)
  function proofIng(b) { return { type: b.type, name: b.name, proof: true }; }
  function formulaIng(e) { return { type: e, name: null, proof: false }; }
  function isConj(t) { return t.tag === 'app' && t.sym === 'AND'; }

  var RECIPES = {};
  function defRecipe(r) { RECIPES[r.id] = r; return r; }
  function allProofs(inp) { return inp.every(function (i) { return i.proof; }); }

  defRecipe({ id: 'And.intro', leanName: 'And.intro', chapter: 1, arity: 2, rule: 'A, B ⊢ A ∧ B', informal: 'conjunction introduction',
    match: function (inp) { return (inp.length === 2 && allProofs(inp)) ? [{ output: AND(inp[0].type, inp[1].type), lean: 'And.intro ' + inp[0].name + ' ' + inp[1].name }] : []; } });
  defRecipe({ id: 'And.left', leanName: 'And.left', chapter: 2, arity: 1, rule: 'A ∧ B ⊢ A', informal: 'conjunction elimination (left)',
    match: function (inp) { return (inp.length === 1 && inp[0].proof && isConj(inp[0].type)) ? [{ output: inp[0].type.args[0], lean: 'And.left ' + inp[0].name }] : []; } });
  defRecipe({ id: 'And.right', leanName: 'And.right', chapter: 2, arity: 1, rule: 'A ∧ B ⊢ B', informal: 'conjunction elimination (right)',
    match: function (inp) { return (inp.length === 1 && inp[0].proof && isConj(inp[0].type)) ? [{ output: inp[0].type.args[1], lean: 'And.right ' + inp[0].name }] : []; } });
  // Chapter 3: disjunction introduction — a proof plus a FORMULA (the other disjunct)
  defRecipe({ id: 'Or.inl', leanName: 'Or.inl', chapter: 3, arity: 2, rule: 'a proof of A, and a formula B ⊢ A ∨ B', informal: 'disjunction introduction (left)',
    match: function (inp) { return (inp.length === 2 && inp[0].proof && sortOf(inp[1].type) === PROP) ? [{ output: OR(inp[0].type, inp[1].type), lean: 'Or.inl ' + inp[0].name }] : []; } });
  defRecipe({ id: 'Or.inr', leanName: 'Or.inr', chapter: 3, arity: 2, rule: 'a proof of B, and a formula A ⊢ A ∨ B', informal: 'disjunction introduction (right)',
    match: function (inp) { return (inp.length === 2 && inp[0].proof && sortOf(inp[1].type) === PROP) ? [{ output: OR(inp[1].type, inp[0].type), lean: 'Or.inr ' + inp[0].name }] : []; } });
  // Chapter 8: modus ponens (→ elimination) — emit the Lean application  hAB hA
  defRecipe({ id: 'modus_ponens', leanName: 'modus_ponens', chapter: 8, arity: 2, rule: 'a proof of A, and a proof of A → B ⊢ B', informal: 'modus ponens',
    match: function (inp) {
      if (inp.length !== 2 || !allProofs(inp)) return [];
      var f = inp[0], a = inp[1];   // f the implication, a the argument
      return (f.type.tag === 'app' && f.type.sym === 'IMPLIES' && exprEq(f.type.args[0], a.type)) ? [{ output: f.type.args[1], lean: f.name + ' ' + a.name }] : [];
    }
  });
  // Chapter 9: case analysis (∨ elimination) — combine A → C and B → C into A ∨ B → C (emit an Or.elim lambda)
  defRecipe({ id: 'case_analysis', leanName: 'case_analysis', chapter: 9, arity: 2, rule: 'a proof of A → C, and a proof of B → C ⊢ A ∨ B → C', informal: 'case analysis (disjunction elimination)',
    match: function (inp) {
      if (inp.length !== 2 || !allProofs(inp)) return [];
      var f = inp[0].type, g = inp[1].type;
      if (!(f.tag === 'app' && f.sym === 'IMPLIES' && g.tag === 'app' && g.sym === 'IMPLIES')) return [];
      if (!exprEq(f.args[1], g.args[1])) return [];   // the two cases must reach the same conclusion
      return [{ output: IMPLIES(OR(f.args[0], g.args[0]), f.args[1]), lean: 'fun h => Or.elim h ' + inp[0].name + ' ' + inp[1].name }];
    }
  });
  // Chapter 10: bi-implication (↔) — introduction from the two directions, and forward/backward elimination
  defRecipe({ id: 'Iff.intro', leanName: 'Iff.intro', chapter: 10, arity: 2, rule: 'a proof of A → B, and a proof of B → A ⊢ A ↔ B', informal: 'iff introduction',
    match: function (inp) {
      if (inp.length !== 2 || !allProofs(inp)) return [];
      var f = inp[0].type, g = inp[1].type;
      if (!(f.tag === 'app' && f.sym === 'IMPLIES' && g.tag === 'app' && g.sym === 'IMPLIES')) return [];
      return (exprEq(f.args[0], g.args[1]) && exprEq(f.args[1], g.args[0])) ? [{ output: IFF(f.args[0], f.args[1]), lean: 'Iff.intro ' + inp[0].name + ' ' + inp[1].name }] : [];
    }
  });
  defRecipe({ id: 'Iff.mp', leanName: 'Iff.mp', chapter: 10, arity: 2, rule: 'a proof of A ↔ B, and a proof of A ⊢ B', informal: 'iff elimination (forward)',
    match: function (inp) {
      if (inp.length !== 2 || !allProofs(inp)) return [];
      var h = inp[0].type;
      return (h.tag === 'app' && h.sym === 'IFF' && exprEq(h.args[0], inp[1].type)) ? [{ output: h.args[1], lean: inp[0].name + '.mp ' + inp[1].name }] : [];
    }
  });
  defRecipe({ id: 'Iff.mpr', leanName: 'Iff.mpr', chapter: 10, arity: 2, rule: 'a proof of A ↔ B, and a proof of B ⊢ A', informal: 'iff elimination (backward)',
    match: function (inp) {
      if (inp.length !== 2 || !allProofs(inp)) return [];
      var h = inp[0].type;
      return (h.tag === 'app' && h.sym === 'IFF' && exprEq(h.args[1], inp[1].type)) ? [{ output: h.args[0], lean: inp[0].name + '.mpr ' + inp[1].name }] : [];
    }
  });
  // Chapter 11: from a contradiction (a proof of A and a proof of ¬A) anything follows (emits Lean `absurd`).
  // (`absurd hA hnA : B` hides the underlying `False`, which the game does not surface until Chapter 13.)
  defRecipe({ id: 'absurd', leanName: 'absurd', chapter: 11, arity: 3, rule: 'a proof of A, a proof of ¬A, and a formula B ⊢ B', informal: 'from a contradiction, anything',
    match: function (inp) {
      if (inp.length !== 3 || !inp[0].proof || !inp[1].proof || inp[2].proof || sortOf(inp[2].type) !== PROP) return [];
      return exprEq(inp[1].type, NOT(inp[0].type)) ? [{ output: inp[2].type, lean: 'absurd ' + inp[0].name + ' ' + inp[1].name }] : [];
    }
  });
  // Chapter 12: the law of the excluded middle (classical) — a formula A yields a proof of A ∨ ¬A
  defRecipe({ id: 'Classical.em', leanName: 'Classical.em', chapter: 12, arity: 1, rule: 'a formula A ⊢ A ∨ ¬A', informal: 'the law of the excluded middle',
    match: function (inp) {
      if (inp.length !== 1 || inp[0].proof || sortOf(inp[0].type) !== PROP) return [];
      return [{ output: OR(inp[0].type, NOT(inp[0].type)), lean: 'Classical.em (' + render(inp[0].type) + ')' }];
    }
  });
  // Chapter 13: True and False become first-class. True is trivially provable; from False, anything (ex falso).
  var isFalse = function (t) { return t.tag === 'app' && t.sym === 'FALSE'; };
  defRecipe({ id: 'True.intro', leanName: 'True.intro', chapter: 13, arity: 0, rule: '⊢ True', informal: 'True holds trivially',
    match: function (inp) { return inp.length === 0 ? [{ output: TRUE(), lean: 'True.intro' }] : []; } });
  defRecipe({ id: 'False.elim', leanName: 'False.elim', chapter: 13, arity: 2, rule: 'a proof of False, and a formula C ⊢ C', informal: 'from falsehood, anything (ex falso)',
    match: function (inp) {
      if (inp.length !== 2 || !inp[0].proof || inp[1].proof || sortOf(inp[1].type) !== PROP) return [];
      return isFalse(inp[0].type) ? [{ output: inp[1].type, lean: 'False.elim ' + inp[0].name }] : [];
    }
  });
  // Chapter 18: universal instantiation — the ∀ counterpart of modus_ponens (specialize ∀x,P(x) at a term t → P(t),
  // emitting the Lean application `h t`). The second ingredient is a TERM (a non-proof of the bound variable's sort).
  defRecipe({ id: 'universal_instantiation', leanName: 'universal_instantiation', chapter: 18, arity: 2, rule: 'a proof of ∀ x, P(x), and a term t ⊢ P(t)', informal: 'universal instantiation (specialization)',
    match: function (inp) {
      if (inp.length !== 2 || !inp[0].proof || inp[1].proof) return [];
      var h = inp[0].type, t = inp[1].type;
      if (h.tag !== 'binder' || h.q !== 'forall' || sortOf(t) !== h.v.sort) return [];
      return [{ output: substE(h.body, h.v.name, h.v.sort, t), lean: inp[0].name + ' ' + render(t, { lean: true }) }];
    }
  });
  // ---------- Chapter 22: existential introduction (finite occurrence-abstraction) ----------
  // enumAbstract(φ, t, xv): every body ψ with ψ[xv := t] = φ — i.e. φ with SOME SUBSET of the occurrences of the
  // (variable) witness t replaced by the fresh bound variable xv. Finite (2^#occurrences); the player picks which.
  // The witness is always a context VARIABLE (no compound terms yet), so each occurrence is independently abstract/keep.
  function cartesian(lists) {
    return lists.reduce(function (acc, l) { var out = []; acc.forEach(function (a) { l.forEach(function (x) { out.push(a.concat([x])); }); }); return out; }, [[]]);
  }
  function enumAbstract(e, t, xv) {
    if (e.tag === 'var') return exprEq(e, t) ? [xv, e] : [e];
    if (e.tag === 'binder') return enumAbstract(e.body, t, xv).map(function (b) { return { tag: 'binder', q: e.q, v: e.v, body: b, sort: PROP }; });
    return cartesian(e.args.map(function (a) { return enumAbstract(a, t, xv); })).map(function (args) { return appE(e.sym, args); });
  }
  function dedupExprs(list) { var out = []; list.forEach(function (e) { if (!out.some(function (o) { return exprEq(o, e); })) out.push(e); }); return out; }
  function freshBoundName(e, avoid) { var used = varsInto(e, {}); used[avoid] = 1; if (!used['x']) return 'x'; for (var i = 0; ; i++) if (!used['x' + i]) return 'x' + i; }
  // ∃-introduction: a proof of P(t) and a witness term t yield the finitely-many ∃ x, (P with some t's abstracted).
  // All share the Lean anonymous-constructor witness `⟨t, h⟩`; the `have`-type ascription disambiguates which body —
  // so the STEP records the concrete result (no lambda is ever shown to, or built by, the player).
  defRecipe({ id: 'Exists.intro', leanName: 'Exists.intro', chapter: 22, arity: 2, rule: 'a proof of P(t), and a term t ⊢ ∃ x, P(x)', informal: 'existential introduction',
    match: function (inp) {
      if (inp.length !== 2 || !inp[0].proof || inp[1].proof) return [];
      var proof = inp[0], t = inp[1].type;
      if (t.tag !== 'var') return [];   // the witness is a context variable
      var xname = freshBoundName(proof.type, t.name), xv = varE(xname, t.sort);
      return dedupExprs(enumAbstract(proof.type, t, xv)).map(function (body) {
        return { output: EXISTS({ name: xname, sort: t.sort }, body), lean: '⟨' + render(t, { lean: true }) + ', ' + proof.name + '⟩' };
      });
    }
  });
  var BASE_RECIPES = Object.keys(RECIPES).map(function (k) { return RECIPES[k]; });

  // ---------- generic (higher-order) unifier → a solved lemma becomes a reusable recipe ----------
  // Metavariables in a lemma template are: free variables (prop atoms A,B,C and term consts/vars α — first-order)
  // and the predicate symbols P,Q,R,S (SECOND-order). Predicate metavars are only ever SOLVED FOR by unification,
  // never supplied by the player — so a lemma with an undetermined predicate is (correctly) never craftable.
  var PRED_METAS = { P: 1, Q: 1, R: 1, S: 1 };
  function isPredMeta(sym) { return !!PRED_METAS[sym]; }
  function collectPredMetas(e, set) {
    if (e.tag === 'binder') collectPredMetas(e.body, set);
    else if (e.tag === 'app') { if (isPredMeta(e.sym)) set[e.sym] = 1; e.args.forEach(function (a) { collectPredMetas(a, set); }); }
    return set;
  }
  function freeVarsInto(e, bound, set) {
    if (e.tag === 'var') { if (bound.indexOf(e.name) < 0) set[e.name] = e.sort; }
    else if (e.tag === 'binder') freeVarsInto(e.body, bound.concat([e.v.name]), set);
    else e.args.forEach(function (a) { freeVarsInto(a, bound, set); });
    return set;
  }
  function freeVarsInOrder(e, bound, acc) {
    if (e.tag === 'var') { if (bound.indexOf(e.name) < 0 && !acc.some(function (v) { return v.name === e.name; })) acc.push({ name: e.name, sort: e.sort }); }
    else if (e.tag === 'binder') freeVarsInOrder(e.body, bound.concat([e.v.name]), acc);
    else e.args.forEach(function (a) { freeVarsInOrder(a, bound, acc); });
    return acc;
  }
  function rigidVarsIn(e, rigid, out) {   // variables of e that are ∀-bound (rigid) in the current scope
    if (e.tag === 'var') { if (rigid[e.name] && out.indexOf(e.name) < 0) out.push(e.name); }
    else if (e.tag === 'binder') rigidVarsIn(e.body, rigid, out);
    else e.args.forEach(function (a) { rigidVarsIn(a, rigid, out); });
    return out;
  }
  function applyPred(pred, args) {   // β-reduce a solved predicate: (λ params. body)(args)
    var body = pred.body;
    for (var i = 0; i < pred.params.length; i++) body = substE(body, pred.params[i].name, pred.params[i].sort, args[i]);
    return body;
  }
  // Miller-pattern higher-order unification. `rigid` (name->1) are the ∀-bound variables aligned so far.
  function unifyHO(tmpl, expr, subst, rigid) {
    if (tmpl.tag === 'var') {
      if (rigid[tmpl.name]) return expr.tag === 'var' && expr.name === tmpl.name && expr.sort === tmpl.sort;   // a bound var matches only itself
      if (subst[tmpl.name]) return exprEq(subst[tmpl.name], expr);                                             // first-order metavar: consistency
      if (rigidVarsIn(expr, rigid, []).length) return false;                                                   // a metavar may not capture a bound variable
      subst[tmpl.name] = expr; return true;
    }
    if (tmpl.tag === 'binder') {
      if (expr.tag !== 'binder' || tmpl.q !== expr.q || tmpl.v.sort !== expr.v.sort) return false;
      var canon = '#' + (GENSYM++), r2 = {}; for (var k in rigid) r2[k] = 1; r2[canon] = 1;
      return unifyHO(substE(tmpl.body, tmpl.v.name, tmpl.v.sort, varE(canon, tmpl.v.sort)),
                     substE(expr.body, expr.v.name, expr.v.sort, varE(canon, expr.v.sort)), subst, r2);
    }
    if (isPredMeta(tmpl.sym)) {                                                                                // second-order metavariable P(args)
      if (subst[tmpl.sym]) return exprEq(applyPred(subst[tmpl.sym], tmpl.args.map(function (a) { return applySubstHO(a, subst); })), expr);
      var names = {};                                                                                         // solve P — args must be DISTINCT bound variables (the pattern fragment)
      for (var i = 0; i < tmpl.args.length; i++) { var a = tmpl.args[i]; if (a.tag !== 'var' || !rigid[a.name] || names[a.name]) return false; names[a.name] = 1; }
      if (rigidVarsIn(expr, rigid, []).some(function (n) { return !names[n]; })) return false;                // expr may only depend on P's own arguments
      subst[tmpl.sym] = { params: tmpl.args.map(function (a) { return { name: a.name, sort: a.sort }; }), body: expr };
      return true;
    }
    if (expr.tag !== 'app' || tmpl.sym !== expr.sym || tmpl.args.length !== expr.args.length) return false;
    for (var i = 0; i < tmpl.args.length; i++) if (!unifyHO(tmpl.args[i], expr.args[i], subst, rigid)) return false;
    return true;
  }
  function applySubstHO(e, subst) {
    if (e.tag === 'var') { var s = subst[e.name]; return (s && s.tag) ? s : e; }
    if (e.tag === 'binder') return { tag: 'binder', q: e.q, v: e.v, body: applySubstHO(e.body, subst), sort: PROP };
    if (isPredMeta(e.sym) && subst[e.sym]) return applyPred(subst[e.sym], e.args.map(function (a) { return applySubstHO(a, subst); }));
    return appE(e.sym, e.args.map(function (a) { return applySubstHO(a, subst); }));
  }
  function recipeFromExercise(ex) {
    var consts = ex.consts || [];                                    // explicit TERM inputs (selectable), each a first-order metavar
    var givens = ex.givens.map(function (g) { return g.type; }), concl = ex.goal, name = ex.leanName;
    var predMetas = {}; givens.concat([concl]).forEach(function (t) { collectPredMetas(t, predMetas); });
    var gvFree = {}; givens.forEach(function (t) { freeVarsInto(t, [], gvFree); });
    var constNames = {}; consts.forEach(function (c) { constNames[c.name] = 1; });
    var freeVars = freeVarsInOrder(concl, [], []).filter(function (v) { return !gvFree[v.name] && !constNames[v.name]; });   // conclusion vars not fixed by the givens → explicit inputs
    var c = consts.length, g = givens.length, f = freeVars.length, arity = c + g + f;
    var rule = consts.map(function (x) { return 'term ' + x.name; })
      .concat(givens.map(function (t) { return render(t); }))
      .concat(freeVars.map(function (v) { return (v.sort === PROP ? 'formula ' : 'term ') + v.name; }))
      .join(', ') + ' ⊢ ' + render(concl);
    return {
      id: name, leanName: name, chapter: ex.chapter, arity: arity, minted: true, rule: rule, informal: 'the lemma ' + name,
      match: function (inp) {
        if (inp.length !== arity) return [];
        var subst = {};
        for (var i = 0; i < c; i++) { var ti = inp[i]; if (ti.proof || sortOf(ti.type) !== consts[i].sort) return []; subst[consts[i].name] = ti.type; }
        for (var i = 0; i < g; i++) { var pi = inp[c + i]; if (!pi.proof || !unifyHO(givens[i], pi.type, subst, {})) return []; }
        for (var j = 0; j < f; j++) { var xi = inp[c + g + j]; if (xi.proof || sortOf(xi.type) !== freeVars[j].sort) return []; if (subst[freeVars[j].name] && !exprEq(subst[freeVars[j].name], xi.type)) return []; subst[freeVars[j].name] = xi.type; }
        for (var p in predMetas) if (!subst[p]) return [];           // DETERMINACY GUARD: every predicate metavar must be pinned down
        var explicit = inp.slice(0, c).map(function (i) { return render(i.type, { lean: true }); }).concat(inp.slice(c, c + g).map(function (i) { return i.name; }));
        return [{ output: applySubstHO(concl, subst), lean: name + (explicit.length ? ' ' + explicit.join(' ') : '') }];
      }
    };
  }

  // apply a recipe to selected input bindings -> a new env (immutably) + the created binding
  // inputs: each a proof-binding NAME (string) or an ingredient object ({type,name?,proof})
  function craft(env, recipeId, inputs, which) {
    var recipe = RECIPES[recipeId];
    if (!recipe) return { ok: false, error: 'unknown recipe ' + recipeId };
    var ings = inputs.map(function (x) { if (typeof x === 'string') { var b = byName(env, x); return b ? proofIng(b) : null; } return x; });
    if (ings.some(function (i) { return !i; })) return { ok: false, error: 'unknown ingredient' };
    var cands = recipe.match(ings, env);
    if (!cands.length) return { ok: false, error: 'that recipe does not apply to those ingredients' };
    // `which` (an output Expr) selects among the finitely-many results of a multi-output recipe (e.g. ∃-introduction)
    var c = which ? cands.filter(function (x) { return exprEq(x.output, which); })[0] : cands[0];
    if (!c) return { ok: false, error: 'that specific result is not available' };
    var name = freshName(c.output, env);
    var b = binding(name, c.output);
    var step = { recipe: recipeId, name: name, type: c.output, lean: c.lean, froms: ings.map(function (i) { return i.type; }) };
    var env2 = withEnv(env, { bindings: env.bindings.concat([b]), steps: env.steps.concat([step]) });
    return { ok: true, env: env2, binding: b, solved: env.goal ? exprEq(c.output, env.goal) : false };
  }

  // ---------- Chapter 4: sub-environments (deduction theorem) · Chapter 16: ∀ (variable introduction) ----------
  function openAssumption(env, A) {   // assume the formula A → a child env that imports parent proofs + adds hA:A
    var asm = binding(freshName(A, env), A);
    return withEnv(env, { bindings: env.bindings.concat([asm]), vars: env.vars, goal: null, steps: [], parent: env, assumption: { kind: 'hyp', name: asm.name, type: A }, depth: env.depth + 1 });
  }
  function openVariable(env, v) {      // introduce a free variable x : Omega → a child env; discharging gives ∀ x, …
    return withEnv(env, { bindings: env.bindings, vars: env.vars.concat([{ name: v.name, sort: v.sort }]), goal: null, steps: [], parent: env, assumption: { kind: 'var', name: v.name, sort: v.sort }, depth: env.depth + 1 });
  }
  // Abandon a sub-proof: step back out to an ancestor environment, throwing away the assumption (or the
  // introduced variable) together with everything crafted inside it. `levels` says how far to climb, so
  // abandoning an outer level discards the inner ones with it. Nothing is emitted — a sub-environment leaves
  // no trace in its parent until it is discharged — so unlike discharging, this leaves no `have` behind.
  function abandon(env, levels) {
    var k = levels == null ? 1 : levels;
    if (!env.parent) return { ok: false, error: 'not inside a sub-proof' };
    if (k < 1 || k > env.depth) return { ok: false, error: 'no such sub-proof level' };
    var e = env;
    for (var i = 0; i < k; i++) e = e.parent;
    return { ok: true, env: e, abandoned: k };
  }
  // discharge options for a crafted statement P: one per ancestor level k=1..depth → the binder chain placed k up
  function dischargeOptions(env, proofName) {
    var pb = byName(env, proofName); if (!pb || !env.parent) return [];
    var res = [], binders = [], e = env;
    for (var k = 1; k <= env.depth; k++) { binders.unshift(e.assumption); e = e.parent; res.push({ level: k, output: binderChain(binders, pb.type), proofName: proofName }); }
    return res;
  }
  function discharge(env, proofName, k) {
    var pb = byName(env, proofName);
    if (!pb) return { ok: false, error: 'no such statement' };
    if (!env.parent || k < 1 || k > env.depth) return { ok: false, error: 'nothing to discharge' };
    var levels = [], e = env;
    for (var i = 0; i < k; i++) { levels.unshift({ binder: e.assumption, steps: e.steps }); e = e.parent; }
    var target = e, implType = binderChain(levels.map(function (l) { return l.binder; }), pb.type);
    var b = binding(freshName(implType, target), implType);
    var step = { kind: 'discharge', name: b.name, type: implType, levels: levels, conclName: proofName };
    var tenv = withEnv(target, { bindings: target.bindings.concat([b]), steps: target.steps.concat([step]) });
    return { ok: true, env: tenv, binding: b, solved: tenv.goal ? exprEq(implType, tenv.goal) : false };
  }
  // Chapter 12: negation introduction (reductio ad absurdum). Inside a sub-env assuming A, a contradiction
  // (a proof of C and a proof of ¬C) closes it as ¬A. Emitted as `have h : ¬A := by intro hA; …; exact absurd hC hnC`
  // (the reductio's `False` goal is discharged by `absurd`, so `False` never surfaces — deferred to Chapter 13).
  function isFalseT(t) { return t.tag === 'app' && t.sym === 'FALSE'; }
  function notIntroOption(env, names) {
    if (!env.parent || env.assumption.kind !== 'hyp') return null;   // reductio negates a hypothesis, not a variable
    var bs = (names || []).map(function (n) { return byName(env, n); }).filter(Boolean);
    for (var k = 0; k < bs.length; k++) if (isFalseT(bs[k].type)) return { fals: bs[k].name, output: NOT(env.assumption.type) };   // a direct proof of False (Chapter 13)
    for (var i = 0; i < bs.length; i++) for (var j = 0; j < bs.length; j++)
      if (i !== j && exprEq(bs[j].type, NOT(bs[i].type))) return { pos: bs[i].name, neg: bs[j].name, output: NOT(env.assumption.type) };
    return null;
  }
  // conclude ¬(assumption) by reductio: pass either (posName, negName) for a contradiction, or (falseName) alone
  function notIntro(env, a, b) {
    if (!env.parent || env.assumption.kind !== 'hyp') return { ok: false, error: 'not in a hypothesis sub-proof' };
    var contra;
    if (b == null) {
      var fb = byName(env, a);
      if (!fb || !isFalseT(fb.type)) return { ok: false, error: 'need a proof of False' };
      contra = { fals: a };
    } else {
      var pos = byName(env, a), neg = byName(env, b);
      if (!pos || !neg || !exprEq(neg.type, NOT(pos.type))) return { ok: false, error: 'those are not a contradiction' };
      contra = { pos: a, neg: b };
    }
    var target = env.parent, implType = NOT(env.assumption.type);
    var bnd = binding(freshName(implType, target), implType);
    var step = { kind: 'discharge', name: bnd.name, type: implType, levels: [{ binder: env.assumption, steps: env.steps }], contra: contra };
    var tenv = withEnv(target, { bindings: target.bindings.concat([bnd]), steps: target.steps.concat([step]) });
    return { ok: true, env: tenv, binding: bnd, solved: tenv.goal ? exprEq(implType, tenv.goal) : false };
  }
  // ---------- Chapter 19: ∃ elimination (`obtain`) ----------
  // From an existential hypothesis `h : ∃ x : Ω, P x` and an UNCLAIMED variable name, add a witness variable to the
  // context together with its defining property `P <name>` — WITHOUT opening a sub-environment; the goal is unchanged.
  // QED style keeps hypotheses, but Lean's `obtain` consumes its target, so we COPY first: `have h2 := h; obtain ⟨x,hx⟩ := h2`
  // (the original ∃ survives). Guard: the variable name must not already be in use (a context variable or a hypothesis).
  function isExists(t) { return t.tag === 'binder' && t.q === 'exists'; }
  function nameInUse(env, name) { return byName(env, name) != null || env.vars.some(function (v) { return v.name === name; }); }
  function obtainOptions(env, existName) {   // for the UI: is `existName` a usable ∃ hypothesis?
    var eb = byName(env, existName);
    return (eb && isExists(eb.type)) ? { sort: eb.type.v.sort, bound: eb.type.v.name } : null;
  }
  function obtain(env, existName, varName) {
    var eb = byName(env, existName);
    if (!eb || !isExists(eb.type)) return { ok: false, error: 'select a proof of an existential (∃) statement' };
    if (!varName) return { ok: false, error: 'name the witness variable' };
    if (nameInUse(env, varName)) return { ok: false, error: 'the name “' + varName + '” is already in use in this context' };
    var v = { name: varName, sort: eb.type.v.sort };
    var witness = substE(eb.type.body, eb.type.v.name, eb.type.v.sort, varE(varName, v.sort));
    var hx = binding(freshName(witness, env), witness);
    var copyName = freshName(eb.type, withEnv(env, { bindings: env.bindings.concat([hx]) }));   // fresh, distinct from hx
    var step = { kind: 'obtain', exist: existName, existType: eb.type, copyName: copyName, varName: varName, sort: v.sort, hxName: hx.name, witness: witness };
    var env2 = withEnv(env, { vars: env.vars.concat([v]), bindings: env.bindings.concat([hx]), steps: env.steps.concat([step]) });
    return { ok: true, env: env2, binding: hx, variable: v, solved: env.goal ? exprEq(witness, env.goal) : false };
  }

  // ---------- Chapter 21: pick an arbitrary inhabitant of a (nonempty) sort ----------
  // "pick a : Ω arbitrarily" — add a variable of a NONEMPTY sort directly to the CURRENT context (no hypothesis, no
  // existential; the goal is unchanged). Every sort in the game is nonempty by construction; Lean gets the witness
  // from the [Nonempty Ω] instance via `Classical.choice inferInstance`. Informal: "pick a natural number n
  // arbitrarily". Guard: the name must be unclaimed. Unlike ∀-introduction this opens NO sub-environment.
  function pick(env, varName, sort) {
    if (!varName) return { ok: false, error: 'name the variable to pick' };
    if (nameInUse(env, varName)) return { ok: false, error: 'the name “' + varName + '” is already in use in this context' };
    var v = { name: varName, sort: sort };
    var step = { kind: 'pick', varName: varName, sort: sort };
    return { ok: true, env: withEnv(env, { vars: env.vars.concat([v]), steps: env.steps.concat([step]) }), variable: v };
  }

  // all distinct new statements the current selection can craft (recipes × orderings), for the UI
  function kperms(arr, k) {
    if (k === 0) return [[]];
    var res = [];
    for (var i = 0; i < arr.length; i++) {
      var rest = arr.slice(0, i).concat(arr.slice(i + 1));
      kperms(rest, k - 1).forEach(function (p) { res.push([arr[i]].concat(p)); });
    }
    return res;
  }
  // ingredients: proof-binding names and/or ingredient objects (formulas). recipes: which recipes to try.
  function deductions(env, ingredients, recipes) {
    var ings = (ingredients || []).map(function (x) { if (typeof x === 'string') { var b = byName(env, x); return b ? proofIng(b) : null; } return x; }).filter(Boolean);
    var list = recipes || BASE_RECIPES, res = [], seen = {};
    list.forEach(function (r) {
      kperms(ings, r.arity).forEach(function (inp) {
        r.match(inp, env).forEach(function (c) {
          if (env.bindings.some(function (b) { return exprEq(b.type, c.output); })) return;   // already crafted
          // key includes the OUTPUT so a multi-output recipe (∃-introduction) offers each distinct result separately
          var key = r.id + '|' + inp.map(function (i) { return i.proof ? i.name : 'φ:' + render(i.type); }).join(',') + '|' + render(c.output);
          if (seen[key]) return; seen[key] = 1;
          res.push({ recipeId: r.id, inputs: inp, output: c.output, lean: c.lean });
        });
      });
    });
    return res;
  }

  // remove a crafted potion (not a given, and not one another step was brewed from)
  function deleteBinding(env, name) {
    if (!byName(env, name)) return { ok: false, error: 'no such potion' };
    if (!env.steps.some(function (s) { return s.name === name; })) return { ok: false, error: 'cannot delete a given hypothesis' };
    var used = env.steps.some(function (s) { return s.name !== name && new RegExp('(^|[ (])' + name + '($|[ )])').test(s.lean); });
    if (used) return { ok: false, error: 'another potion was brewed from this one' };
    return { ok: true, env: withEnv(env, { bindings: env.bindings.filter(function (x) { return x.name !== name; }), steps: env.steps.filter(function (s) { return s.name !== name; }) }) };
  }
  // ---------- formula-crafting recipes (build a FORMULA on the bench, not a proof) ----------
  var FORMULA_RECIPES = [
    { id: 'And', leanName: 'And', arity: 2, rule: 'A, B ↦ A ∧ B', make: function (a, b) { return AND(a, b); } },
    { id: 'Or', leanName: 'Or', arity: 2, rule: 'A, B ↦ A ∨ B', make: function (a, b) { return OR(a, b); } },
    { id: 'Implies', leanName: 'Implies', arity: 2, cap: 'assume', rule: 'A, B ↦ A → B', make: function (a, b) { return IMPLIES(a, b); } },
    { id: 'Not', leanName: 'Not', arity: 1, cap: 'neg', rule: 'A ↦ ¬A', make: function (a) { return NOT(a); } },
    { id: 'True', leanName: 'True', arity: 0, cap: 'tf', rule: '↦ True', make: function () { return TRUE(); } },
    { id: 'False', leanName: 'False', arity: 0, cap: 'tf', rule: '↦ False', make: function () { return FALSE(); } }
  ];
  // predicate constructors from an exercise's signature (e.g. Q : Omega → Omega → Prop → a formula recipe Q(α,β))
  function predRecipes(ex) {
    return (ex && ex.preds || []).map(function (p) {
      return { id: p.name, leanName: p.name, arity: p.argSorts.length, argSort: p.argSorts[0], pred: true,
        rule: p.argSorts.map(function (_, i) { return String.fromCharCode(945 + i); }).join(', ') + ' ↦ ' + p.name + '(' + p.argSorts.map(function (_, i) { return String.fromCharCode(945 + i); }).join(', ') + ')',
        make: function () { return appE(p.name, Array.prototype.slice.call(arguments)); } };
    });
  }
  // `pool` is a list of exprs (each carrying its .sort); each recipe consumes inputs of its `argSort` (default Prop)
  function formulaDeductions(pool, existing, recipes) {
    var res = [], seen = {}, list = recipes || FORMULA_RECIPES;
    list.forEach(function (r) {
      var argSort = r.argSort || PROP;
      var cands = (pool || []).filter(function (e) { return r.arity === 0 || sortOf(e) === argSort; });
      kperms(cands, r.arity).forEach(function (inp) {
        var out = r.make.apply(null, inp);
        if ((existing || []).some(function (e) { return exprEq(e, out); })) return;
        var key = r.id + '|' + inp.map(function (e) { return render(e); }).join(',');
        if (seen[key]) return; seen[key] = 1;
        res.push({ recipeId: r.id, inputs: inp, output: out });
      });
    });
    return res;
  }

  function rename(env, oldName, newName) {
    if (!byName(env, oldName) || byName(env, newName)) return env;
    var re = new RegExp('(^|[ (])' + oldName + '(?=$|[ )])', 'g');
    return withEnv(env, {
      bindings: env.bindings.map(function (x) { return x.name === oldName ? binding(newName, x.type) : x; }),
      steps: env.steps.map(function (s) {
        var t = {}; for (var k in s) t[k] = s[k];
        if (t.name === oldName) t.name = newName;
        if (typeof t.lean === 'string') t.lean = t.lean.replace(re, '$1' + newName);
        if (t.conclName === oldName) t.conclName = newName;
        return t;
      })
    });
  }

  // ---------- live pseudo-Lean "spellbook" ----------
  function leanOpts(opts) { return { parens: !!(opts && opts.parens), lean: true }; }   // Lean render (predicates as `Q x y`)
  function leanHeader(ex, opts) {
    var o = leanOpts(opts);
    var cs = (ex.consts || []).map(function (c) { return '(' + c.name + ' : ' + c.sort + ')'; }).join(' ');   // term constants in context
    var gs = ex.givens.map(function (g) { return '(' + g.name + ' : ' + render(g.type, o) + ')'; }).join(' ');
    var params = [cs, gs].filter(Boolean).join(' ');
    var head = ex.kind === 'lemma' ? ('theorem ' + ex.leanName) : 'example';   // `theorem` is core Lean; `lemma` needs Mathlib
    return head + (params ? ' ' + params : '') + ' : ' + render(ex.goal, o) + ' := by';
  }
  function goalNameIn(env) {
    for (var i = env.bindings.length - 1; i >= 0; i--) if (exprEq(env.bindings[i].type, env.goal)) return env.bindings[i].name;
    return null;
  }
  // declares the sorts, propositional atoms and predicates so the emitted proof is a standalone, buildable
  // Lean snippet (Init is imported automatically in Lean 4, so no `import` line is needed)
  function leanPreamble(ex) {
    var lines = [];
    (ex.sorts || []).forEach(function (s) { lines.push('variable {' + s + '}' + ((ex.nonempty || []).indexOf(s) >= 0 ? ' [Nonempty ' + s + ']' : '')); });
    var atoms = []; ex.givens.forEach(function (g) { propAtoms(g.type, [], atoms); }); propAtoms(ex.goal, [], atoms); atoms.sort();
    if (atoms.length) lines.push('variable {' + atoms.join(' ') + ' : Prop}');
    (ex.preds || []).forEach(function (p) { lines.push('variable {' + p.name + ' : ' + p.argSorts.concat([p.resultSort || PROP]).join(' → ') + '}'); });
    return lines.length ? lines.join('\n') + '\n\n' : '';
  }
  function emitSteps(steps, indent, opts) {
    var o = leanOpts(opts), out = [];
    steps.forEach(function (s) {
      if (s.kind === 'discharge') {
        out.push(indent + 'have ' + s.name + ' : ' + render(s.type, o) + ' := by');
        s.levels.forEach(function (lv) {
          out.push(indent + '  intro ' + lv.binder.name);
          emitSteps(lv.steps, indent + '  ', opts).forEach(function (l) { out.push(l); });
        });
        out.push(indent + '  exact ' + (s.contra ? (s.contra.fals ? s.contra.fals : 'absurd ' + s.contra.pos + ' ' + s.contra.neg) : s.conclName));
      } else if (s.kind === 'obtain') {   // non-destructive ∃-elim: copy, then destructure the copy (the ∃ survives)
        out.push(indent + 'have ' + s.copyName + ' := ' + s.exist);
        out.push(indent + 'obtain ⟨' + s.varName + ', ' + s.hxName + '⟩ := ' + s.copyName);
      } else if (s.kind === 'pick') {   // pick an arbitrary inhabitant of a nonempty sort
        out.push(indent + 'have ' + s.varName + ' : ' + s.sort + ' := Classical.choice inferInstance');
      } else {
        out.push(indent + 'have ' + s.name + ' : ' + render(s.type, o) + ' := ' + s.lean);
      }
    });
    return out;
  }
  function emitLean(ex, env, opts) {   // env = the root env (a completed proof)
    var lines = [leanHeader(ex, opts)].concat(emitSteps(env.steps, '  ', opts));
    var gn = goalNameIn(env);
    lines.push('  ' + (gn ? 'exact ' + gn : 'sorry'));
    return lines.join('\n');
  }
  // live view when the player may be inside an open sub-environment (cur = current innermost env)
  function emitLive(ex, cur, opts) {
    var chain = [], e = cur; while (e.parent) { chain.unshift(e); e = e.parent; }
    var root = e;
    if (!chain.length) return emitLean(ex, root, opts);
    var lines = [leanHeader(ex, opts)].concat(emitSteps(root.steps, '  ', opts));
    var typeExpr = binderChain(chain.map(function (c) { return c.assumption; }), varE('?a'));
    lines.push('  have this : ' + render(typeExpr, leanOpts(opts)) + ' := by');
    chain.forEach(function (c) {
      lines.push('    intro ' + c.assumption.name);
      emitSteps(c.steps, '    ', opts).forEach(function (l) { lines.push(l); });
    });
    lines.push('    sorry');
    var gn = goalNameIn(root);
    lines.push('  ' + (gn ? 'exact ' + gn : 'sorry'));
    return lines.join('\n');
  }

  // informal proof in the style of the original QED game (statements, not hypothesis labels)
  function informalSteps(steps, opts) {
    var R = function (e) { return render(e, opts); }, out = [];
    steps.forEach(function (s) {
      if (s.kind === 'discharge') {
        out.push('Introduce ' + s.levels.map(function (l) { return l.binder.kind === 'var' ? 'an arbitrary ' + l.binder.name + ' : ' + l.binder.sort : R(l.binder.type); }).join(', then ') + ':');
        s.levels.forEach(function (l) { informalSteps(l.steps, opts).forEach(function (x) { out.push('  ' + x); }); });
        out.push(s.contra ? 'This is a contradiction, so we conclude ' + R(s.type) + '.'
                          : 'Discharging, we obtain ' + R(s.type) + '.');
      } else if (s.kind === 'obtain') {
        out.push('Since ' + R(s.existType) + ', fix ' + s.varName + ' : ' + s.sort + ' with ' + R(s.witness) + '.');
      } else if (s.kind === 'pick') {
        out.push('Pick ' + s.varName + ' : ' + s.sort + ' arbitrarily (the sort is nonempty).');
      } else {
        var rec = RECIPES[s.recipe];
        out.push('From ' + (s.froms || []).map(R).join(', ') + ' we deduce ' + R(s.type) + '  (' + (rec && rec.informal || s.recipe) + ').');
      }
    });
    return out;
  }
  function emitInformal(ex, env, opts) {   // env = root
    var R = function (e) { return render(e, opts); }, L = [];
    if (ex.givens.length) L.push('We are given ' + ex.givens.map(function (g) { return R(g.type); }).join(', ') + '.');
    L.push('We wish to prove ' + R(ex.goal) + '.');
    informalSteps(env.steps, opts).forEach(function (x) { L.push(x); });
    if (env.bindings.some(function (b) { return exprEq(b.type, env.goal); })) L.push('This is what we wished to prove.  ∎');
    return L.join('\n');
  }

  // ---------- exercises + progression DAG (Chapters 1–8) ----------
  // Each exercise carries `unlocks` (successors made accessible on solving it) and `needs`
  // (the NEW capabilities it introduces — see CAPS below). Capabilities are cumulative: an
  // exercise is playable once accessible, and the union of `needs` over all accessible
  // exercises is the active capability set (so early exercises show a simplified interface).
  var A = varE('A'), B = varE('B'), C = varE('C'), D = varE('D');
  var X = varE('X', OMEGA), Y = varE('Y', OMEGA), alpha = varE('α', OMEGA), xL = varE('x', OMEGA);   // term variables of sort Ω (Chapter 16+)
  function fa(name, body) { return FORALL({ name: name, sort: OMEGA }, body); }
  function ee(name, body) { return EXISTS({ name: name, sort: OMEGA }, body); }
  var EXERCISES = [
    { id: '1.1', kind: 'example', chapter: 1, givens: [binding('hA', A), binding('hB', B), binding('hC', C)], goal: AND(AND(A, B), C), unlocks: ['1.2'], needs: ['and.intro'] },
    { id: '1.2', kind: 'lemma', leanName: 'And.idem', chapter: 1, givens: [binding('hA', A)], goal: AND(A, A), unlocks: ['2.1'], needs: [] },
    { id: '2.1', kind: 'lemma', leanName: "And.comm'", chapter: 2, givens: [binding('hAB', AND(A, B))], goal: AND(B, A), unlocks: ['2.2a', '2.2b'], needs: ['and.elim'] },
    { id: '2.2a', kind: 'lemma', leanName: 'And.assoc_left', chapter: 2, givens: [binding('hABC', AND(AND(A, B), C))], goal: AND(A, AND(B, C)), unlocks: ['3.1a'], needs: [] },
    { id: '2.2b', kind: 'lemma', leanName: 'And.assoc_right', chapter: 2, givens: [binding('hABC', AND(A, AND(B, C)))], goal: AND(AND(A, B), C), unlocks: ['3.1a'], needs: [] },
    { id: '3.1a', kind: 'example', chapter: 3, givens: [binding('hA', A)], formulas: [B, C], goal: OR(C, OR(A, B)), unlocks: ['3.1b'], needs: ['or', 'formula'] },
    { id: '3.1b', kind: 'lemma', leanName: 'Or.idem', chapter: 3, givens: [binding('hA', A)], formulas: [A], goal: OR(A, A), unlocks: ['6.1a'], needs: [] },
    // 6.1a (⊢ A → A) is the SIMPLEST assume-then-discharge exercise — bare intro/discharge with nothing
    // inside — so it introduces the deduction theorem (and the `assume` capability) even though its chapter
    // number is higher. 4.1 and 5.1 then hang off it as optional side-branches: same shape, but 4.1 crafts
    // an ∧ before discharging and 5.1 uses a bulkier formula. Map rows come from DAG depth, not chapter,
    // so this reads correctly on the tree.
    { id: '6.1a', kind: 'lemma', leanName: 'Impl.idem', chapter: 6, givens: [], formulas: [A], goal: IMPLIES(A, A), unlocks: ['4.1', '5.1', '6.1b', '7.1'], needs: ['assume'] },
    { id: '4.1', kind: 'example', chapter: 4, givens: [], formulas: [A], goal: IMPLIES(A, AND(A, A)), unlocks: [], needs: [] },
    { id: '5.1', kind: 'example', chapter: 5, givens: [], formulas: [A, B, C], goal: IMPLIES(OR(AND(A, B), C), OR(AND(A, B), C)), unlocks: ['5.2'], needs: [] },
    // 5.2 (QED 5.2): two assumptions deep, and the inner goal is the inner assumption — the first time a
    // sub-proof is opened inside a sub-proof. An optional leaf, like 5.1 itself.
    { id: '5.2', kind: 'example', chapter: 5, givens: [], formulas: [A, B], goal: IMPLIES(B, IMPLIES(A, A)), unlocks: [], needs: [] },
    // 6.1b is an OPTIONAL side-branch; the main path runs 6.1a → 7.1.
    { id: '6.1b', kind: 'example', chapter: 6, givens: [], formulas: [A, B], goal: IMPLIES(AND(A, OR(A, B)), A), unlocks: ['6.2'], needs: [] },
    // 6.2 (QED 6.2): the deduction theorem applied twice over — a statement you already hold can be
    // discharged through BOTH assumptions at once, giving A → B → C from C alone.
    { id: '6.2', kind: 'lemma', leanName: "imp_const'", chapter: 6, givens: [binding('hC', C)], formulas: [A, B], goal: IMPLIES(A, IMPLIES(B, C)), unlocks: [], needs: [] },
    { id: '7.1', kind: 'example', chapter: 7, givens: [], formulas: [A, B], goal: IMPLIES(A, IMPLIES(B, A)), unlocks: ['8.1'], needs: [] },
    // 8.1 (QED 8.1a): modus ponens by itself — one craft. It introduces the `mp` capability, so it is now
    // the entry to Chapter 8 rather than 8.2 (implies_trans), which needs a sub-proof as well.
    { id: '8.1', kind: 'example', chapter: 8, givens: [binding('hA', A), binding('hAB', IMPLIES(A, B))], formulas: [A, B], goal: B, unlocks: ['8.2'], needs: ['mp'] },
    { id: '8.2', kind: 'lemma', leanName: 'implies_trans', chapter: 8, givens: [binding('hAB', IMPLIES(A, B)), binding('hBC', IMPLIES(B, C))], formulas: [A, B, C], goal: IMPLIES(A, C), unlocks: ['8.3', '8.4a'], needs: [] },
    // 8.3 roots an OPTIONAL branch (8.3 → 8.5a → 8.5b); the main Chapter-8 spine is 8.2 → 8.4a → 8.4b → 8.6b.
    { id: '8.3', kind: 'lemma', leanName: "And.symm'", chapter: 8, givens: [], formulas: [A, B], goal: IMPLIES(AND(A, B), AND(B, A)), unlocks: ['8.5a'], needs: [] },
    { id: '8.4a', kind: 'lemma', leanName: "And.elim'", chapter: 8, givens: [binding('hABC', IMPLIES(A, IMPLIES(B, C)))], formulas: [A, B], goal: IMPLIES(AND(A, B), C), unlocks: ['8.4b', '8.4c'], needs: [] },
    { id: '8.4b', kind: 'lemma', leanName: 'And.elim_rev', chapter: 8, givens: [binding('hABC', IMPLIES(AND(A, B), C))], formulas: [A, B], goal: IMPLIES(A, IMPLIES(B, C)), unlocks: ['8.6a', '8.6b'], needs: [] },
    { id: '8.4c', kind: 'lemma', leanName: 'implies_swap', chapter: 8, givens: [binding('hABC', IMPLIES(A, IMPLIES(B, C)))], formulas: [A, B], goal: IMPLIES(B, IMPLIES(A, C)), unlocks: [], needs: [] },   // optional leaf
    { id: '8.5a', kind: 'lemma', leanName: 'implies_and_self', chapter: 8, givens: [binding('hAB', IMPLIES(A, B))], formulas: [A], goal: IMPLIES(A, AND(A, B)), unlocks: ['8.5b'], needs: [] },
    { id: '8.5b', kind: 'lemma', leanName: "implies_and_self'", chapter: 8, givens: [binding('hAB', IMPLIES(A, B))], formulas: [A], goal: IMPLIES(A, AND(B, A)), unlocks: [], needs: [] },   // optional leaf
    { id: '8.6a', kind: 'lemma', leanName: "And.imp_left'", chapter: 8, givens: [binding('hAB', AND(A, B)), binding('hAC', IMPLIES(A, C))], formulas: [], goal: AND(C, B), unlocks: ['9.14'], needs: [] },
    { id: '8.6b', kind: 'lemma', leanName: "And.imp_right'", chapter: 8, givens: [binding('hAB', AND(A, B)), binding('hBC', IMPLIES(B, C))], formulas: [], goal: AND(A, C), unlocks: ['9.1', '9.16'], needs: [] },
    // Chapter 9 — case analysis (∨ elimination), a WEB of QED §9 exercises. 9.1 introduces case_analysis; three
    // imp-lemma gateways (9.4/9.5/9.6) each unlock Chapter 10 (complete ANY path); associativity (9.7/9.8) and
    // distributivity (9.9–9.12) are optional sibling branches. Every one is solvable with BASE recipes only.
    { id: '9.1', kind: 'example', chapter: 9, givens: [binding('hAC', IMPLIES(A, C)), binding('hBC', IMPLIES(B, C))], formulas: [A, B], goal: IMPLIES(OR(A, B), C), unlocks: ['9.2', '9.3', '9.7'], needs: ['case'] },
    { id: '9.2', kind: 'lemma', leanName: "Or.symm'", chapter: 9, givens: [], formulas: [A, B], goal: IMPLIES(OR(A, B), OR(B, A)), unlocks: ['9.4', '9.6', '9.2b'], needs: [] },
    // 9.2b is the hypothesis form of 9.2, mirroring And.comm' (2.1) for ∨. A one-move consequence of the
    // minted Or.symm', and in turn the lemma that makes 9.8 cheap (see the comment there).
    { id: '9.2b', kind: 'lemma', leanName: "Or.comm'", chapter: 9, givens: [binding('hAB', OR(A, B))], formulas: [A, B], goal: OR(B, A), unlocks: ['9.8'], needs: [] },
    { id: '9.3', kind: 'lemma', leanName: "Or.elim'", chapter: 9, givens: [binding('hAB', OR(A, B)), binding('hAC', IMPLIES(A, C)), binding('hBC', IMPLIES(B, C))], formulas: [A, B], goal: C, unlocks: ['9.5', '9.13'], needs: [] },
    // 9.5 is the GENERAL two-implication form, so 9.4 and 9.6 are corollaries of it (take the other
    // implication to be the identity, i.e. the minted Impl.idem). It therefore sits before them and
    // unlocks them, giving a two-move alternate route in addition to the from-scratch one via 9.2.
    { id: '9.5', kind: 'lemma', leanName: "Or.imp'", chapter: 9, givens: [binding('hAB', OR(A, B)), binding('hAC', IMPLIES(A, C)), binding('hBD', IMPLIES(B, D))], formulas: [A, B, C, D], goal: OR(C, D), unlocks: ['10.1', '9.4', '9.6'], needs: [] },
    // three Chapter-10 gateways (Or.imp family — QED 9.4a/c/b): completing any one unlocks §10
    { id: '9.4', kind: 'lemma', leanName: "Or.imp_left'", chapter: 9, givens: [binding('hAB', OR(A, B)), binding('hAC', IMPLIES(A, C))], formulas: [A, B, C], goal: OR(C, B), unlocks: ['10.1', '9.15'], needs: [] },
    { id: '9.6', kind: 'lemma', leanName: "Or.imp_right'", chapter: 9, givens: [binding('hAB', OR(A, B)), binding('hBC', IMPLIES(B, C))], formulas: [A, B, C], goal: OR(A, C), unlocks: ['10.1', '9.17'], needs: [] },
    // associativity siblings (QED 9.2a/b) and distributivity (QED 9.3a–d) — optional alternate pathways
    { id: '9.7', kind: 'lemma', leanName: 'Or.assoc_left', chapter: 9, givens: [binding('hABC', OR(OR(A, B), C))], formulas: [A, B, C], goal: OR(A, OR(B, C)), unlocks: ['9.9', '9.12', '9.8'], needs: [] },
    // 9.8 is reachable from BOTH 9.7 (Or.assoc_left) and 9.2b (Or.comm'), so both are in principle in hand
    // as recipes: comm, assoc, comm, assoc, comm gets there in five moves instead of a dozen case splits.
    { id: '9.8', kind: 'lemma', leanName: 'Or.assoc_right', chapter: 9, givens: [binding('hABC', OR(A, OR(B, C)))], formulas: [A, B, C], goal: OR(OR(A, B), C), unlocks: ['9.10', '9.11'], needs: [] },
    { id: '9.9', kind: 'lemma', leanName: "or_and_left'", chapter: 9, givens: [binding('hABC', OR(A, AND(B, C)))], formulas: [A, B, C], goal: AND(OR(A, B), OR(A, C)), unlocks: [], needs: [] },
    { id: '9.10', kind: 'lemma', leanName: "and_or_left'", chapter: 9, givens: [binding('hABC', AND(A, OR(B, C)))], formulas: [A, B, C], goal: OR(AND(A, B), AND(A, C)), unlocks: [], needs: [] },
    { id: '9.11', kind: 'lemma', leanName: 'and_or_left_rev', chapter: 9, givens: [binding('hABC', OR(AND(A, B), AND(A, C)))], formulas: [A, B, C], goal: AND(A, OR(B, C)), unlocks: [], needs: [] },
    { id: '9.12', kind: 'lemma', leanName: 'or_and_left_rev', chapter: 9, givens: [binding('hABC', AND(OR(A, B), OR(A, C)))], formulas: [A, B, C], goal: OR(A, AND(B, C)), unlocks: [], needs: [] },
    // 9.13 (QED 9.1b): A ∨ A ⊢ A — two crafts, feeding the identity implication to Or.elim' twice.
    { id: '9.13', kind: 'lemma', leanName: "or_self_elim'", chapter: 9, givens: [binding('hAA', OR(A, A))], formulas: [A], goal: A, unlocks: [], needs: [] },
    // 9.14–9.17 (QED 9.5a–d): the congruence/monotonicity family — an implication A → B may be applied inside
    // either slot of a ∧ or a ∨. Each is the IMPLICATION form of a hypothesis-form lemma already minted
    // (8.6a/8.6b for ∧, 9.4/9.6 for ∨), so each is just assume, apply, discharge. The `mono` names are because
    // And.imp_left'/And.imp_right' are already taken by 8.6a/8.6b.
    { id: '9.14', kind: 'lemma', leanName: "And.mono_left'", chapter: 9, givens: [binding('hAB', IMPLIES(A, B))], formulas: [A, B, C, AND(A, C)], goal: IMPLIES(AND(A, C), AND(B, C)), unlocks: [], needs: [] },
    { id: '9.15', kind: 'lemma', leanName: "Or.mono_left'", chapter: 9, givens: [binding('hAB', IMPLIES(A, B))], formulas: [A, B, C, OR(A, C)], goal: IMPLIES(OR(A, C), OR(B, C)), unlocks: [], needs: [] },
    { id: '9.16', kind: 'lemma', leanName: "And.mono_right'", chapter: 9, givens: [binding('hAB', IMPLIES(A, B))], formulas: [A, B, C, AND(C, A)], goal: IMPLIES(AND(C, A), AND(C, B)), unlocks: [], needs: [] },
    { id: '9.17', kind: 'lemma', leanName: "Or.mono_right'", chapter: 9, givens: [binding('hAB', IMPLIES(A, B))], formulas: [A, B, C, OR(C, A)], goal: IMPLIES(OR(C, A), OR(C, B)), unlocks: [], needs: [] },
    // Chapter 10 — bi-implication (↔). 10.1 introduces Iff; symmetry (10.2) and transitivity (10.3) are the
    // MANDATORY spine (10.3 will unlock Ch11 later); reflexivity (10.4) and the ↔-congruences (10.5–10.7,
    // QED 10.1b/d/f) are optional side-branches.
    { id: '10.1', kind: 'example', chapter: 10, givens: [binding('hA', A), binding('hAB', IFF(A, B))], formulas: [A, B], goal: B, unlocks: ['10.2', '10.5'], needs: ['iff'] },
    { id: '10.2', kind: 'lemma', leanName: "Iff.symm'", chapter: 10, givens: [binding('hAB', IFF(A, B))], formulas: [A, B], goal: IFF(B, A), unlocks: ['10.3', '10.4'], needs: [] },
    { id: '10.3', kind: 'lemma', leanName: "Iff.trans'", chapter: 10, givens: [binding('hAB', IFF(A, B)), binding('hBC', IFF(B, C))], formulas: [A, B, C], goal: IFF(A, C), unlocks: ['11.1'], needs: [] },
    { id: '10.4', kind: 'lemma', leanName: "Iff.refl'", chapter: 10, givens: [], formulas: [A], goal: IFF(A, A), unlocks: [], needs: [] },
    { id: '10.5', kind: 'example', chapter: 10, givens: [binding('hAB', AND(A, B)), binding('hAC', IFF(A, C))], formulas: [A, B, C], goal: AND(C, B), unlocks: ['10.6', '10.7'], needs: [] },
    { id: '10.6', kind: 'example', chapter: 10, givens: [binding('hAB', OR(A, B)), binding('hAC', IFF(A, C))], formulas: [A, B, C], goal: OR(C, B), unlocks: [], needs: [] },
    { id: '10.7', kind: 'example', chapter: 10, givens: [binding('hAB', IMPLIES(A, B)), binding('hAC', IFF(A, C))], formulas: [A, B, C], goal: IMPLIES(C, B), unlocks: [], needs: [] },
    // Chapter 11 — from a contradiction, anything (ex falso, via `absurd`). 11.1 intro; 11.2 optional sibling.
    { id: '11.1', kind: 'example', chapter: 11, givens: [binding('hAnA', AND(A, NOT(A)))], formulas: [A, B], goal: B, unlocks: ['11.2', '12.1'], needs: ['neg'] },
    { id: '11.2', kind: 'example', chapter: 11, givens: [binding('hnAA', AND(NOT(A), A))], formulas: [A, B], goal: B, unlocks: [], needs: [] },
    // Chapter 12 — negation introduction (reductio) + excluded middle (classical). 12.1 introduces em; 12.2/12.3
    // are double-negation (intro via reductio, elim via em); 12.4 is the contrapositive.
    { id: '12.1', kind: 'example', chapter: 12, givens: [], formulas: [A], goal: OR(A, NOT(A)), unlocks: ['12.2', '12.3'], needs: ['em'] },
    { id: '12.2', kind: 'lemma', leanName: "not_not_intro'", chapter: 12, givens: [binding('hA', A)], formulas: [A, NOT(A)], goal: NOT(NOT(A)), unlocks: ['12.4', '12.20'], needs: [] },
    { id: '12.3', kind: 'lemma', leanName: 'not_not_elim', chapter: 12, givens: [binding('hnnA', NOT(NOT(A)))], formulas: [A, NOT(A)], goal: A, unlocks: ['12.8'], needs: [] },
    { id: '12.4', kind: 'lemma', leanName: "mt'", chapter: 12, givens: [binding('hAB', IMPLIES(A, B))], formulas: [A, B, NOT(B)], goal: IMPLIES(NOT(B), NOT(A)), unlocks: ['13.1', '12.5', '12.17'], needs: [] },
    // 12.5–12.7 (QED 12.1a/b/c): reductio in its general forms — assume A, reach a contradiction, conclude ¬A.
    // 12.7 splits on excluded middle instead, and is minted as a lemma (`by_cases'`) that later chapters reuse.
    { id: '12.5', kind: 'example', chapter: 12, givens: [binding('hAcon', IMPLIES(A, AND(B, NOT(B))))], formulas: [A], goal: NOT(A), unlocks: ['12.6'], needs: [] },
    { id: '12.6', kind: 'example', chapter: 12, givens: [binding('hAB', IMPLIES(A, B)), binding('hAnB', IMPLIES(A, NOT(B)))], formulas: [A], goal: NOT(A), unlocks: ['12.7'], needs: [] },
    { id: '12.7', kind: 'lemma', leanName: "by_cases'", chapter: 12, givens: [binding('hAB', IMPLIES(A, B)), binding('hnAB', IMPLIES(NOT(A), B))], formulas: [A, B], goal: B, unlocks: ['12.10', '12.21'], needs: [] },
    // 12.8–12.9 (QED 12.3a/b): proof by contradiction — assume ¬A, contradict, then strip the double negation
    // with the minted `not_not_elim` (12.3). The two differ only in the order of the contradictory pair.
    { id: '12.8', kind: 'example', chapter: 12, givens: [binding('hnAcon', IMPLIES(NOT(A), AND(B, NOT(B))))], formulas: [A, NOT(A)], goal: A, unlocks: ['12.9'], needs: [] },
    { id: '12.9', kind: 'example', chapter: 12, givens: [binding('hnAcon', IMPLIES(NOT(A), AND(NOT(B), B)))], formulas: [A, NOT(A)], goal: A, unlocks: [], needs: [] },
    // 12.10–12.13 (QED 12.5a/d/b/c): De Morgan for ∧/∨, ordered easiest-first rather than by QED's lettering.
    // The first three are constructive; only the last (¬(A ∧ B) ⊢ ¬A ∨ ¬B) genuinely needs excluded middle,
    // and it reuses the minted `by_cases'` (12.7) to do the split.
    { id: '12.10', kind: 'lemma', leanName: "not_or'", chapter: 12, givens: [binding('hnAB', NOT(OR(A, B)))], formulas: [A, B], goal: AND(NOT(A), NOT(B)), unlocks: ['12.11'], needs: [] },
    { id: '12.11', kind: 'lemma', leanName: "not_or_intro'", chapter: 12, givens: [binding('hnAnB', AND(NOT(A), NOT(B)))], formulas: [A, B, OR(A, B)], goal: NOT(OR(A, B)), unlocks: ['12.12'], needs: [] },
    { id: '12.12', kind: 'lemma', leanName: "not_and_of_not_or'", chapter: 12, givens: [binding('hnAonB', OR(NOT(A), NOT(B)))], formulas: [A, B, AND(A, B), NOT(A), NOT(B)], goal: NOT(AND(A, B)), unlocks: ['12.13'], needs: [] },
    // (`not_and'` is already declared by core Lean's Init, so this one is `not_and_or'` — cf. Mathlib's not_and_or.)
    { id: '12.13', kind: 'lemma', leanName: "not_and_or'", chapter: 12, givens: [binding('hnAB', NOT(AND(A, B)))], formulas: [A, B, NOT(A), NOT(B)], goal: OR(NOT(A), NOT(B)), unlocks: ['12.14'], needs: [] },
    // 12.14–12.16 (QED 12.4a/b/c): implication as a disjunction. 12.16 is just the two halves glued with
    // Iff.intro, so it reuses them rather than reproving anything.
    { id: '12.14', kind: 'lemma', leanName: "not_or_of_imp'", chapter: 12, givens: [binding('hAB', IMPLIES(A, B))], formulas: [A, B, NOT(A)], goal: OR(NOT(A), B), unlocks: ['12.15'], needs: [] },
    { id: '12.15', kind: 'lemma', leanName: "imp_of_not_or'", chapter: 12, givens: [binding('hnAB', OR(NOT(A), B))], formulas: [A, B, NOT(A)], goal: IMPLIES(A, B), unlocks: ['12.16', '12.22'], needs: [] },
    { id: '12.16', kind: 'lemma', leanName: "imp_iff_not_or'", chapter: 12, givens: [], formulas: [A, B, NOT(A), IMPLIES(A, B), OR(NOT(A), B)], goal: IFF(IMPLIES(A, B), OR(NOT(A), B)), unlocks: [], needs: [] },
    // 12.17–12.19 (QED 12.6b/c/d): the contrapositive family. All three are corollaries of the minted mt'
    // (12.4) — two or three moves each, rather than a fresh reductio every time.
    { id: '12.17', kind: 'lemma', leanName: "mt_apply'", chapter: 12, givens: [binding('hAB', IMPLIES(A, B)), binding('hnB', NOT(B))], formulas: [A, B], goal: NOT(A), unlocks: ['12.18'], needs: [] },
    { id: '12.18', kind: 'lemma', leanName: "not_of_iff'", chapter: 12, givens: [binding('hnA', NOT(A)), binding('hiff', IFF(A, B))], formulas: [A, B], goal: NOT(B), unlocks: ['12.19'], needs: [] },
    { id: '12.19', kind: 'lemma', leanName: "not_of_imp_not'", chapter: 12, givens: [binding('hAnB', IMPLIES(A, NOT(B))), binding('hB', B)], formulas: [A, B], goal: NOT(A), unlocks: [], needs: [] },
    // 12.20 (QED 12.2c): the ↔ form of double negation, from the two halves already minted (12.2, 12.3).
    { id: '12.20', kind: 'lemma', leanName: "not_not_iff'", chapter: 12, givens: [], formulas: [A, NOT(A), NOT(NOT(A))], goal: IFF(A, NOT(NOT(A))), unlocks: [], needs: [] },
    // 12.21 (QED 12.7) Peirce's law, the classical capstone: split on A with by_cases'; in the ¬A case a
    // vacuous A → B feeds the hypothesis. 12.22 (QED 12.8) is resolution, and falls out of 12.15 + Or.imp_left'.
    // (core Lean's Init already declares `peirce'`, hence `peirce_law'` — cf. the not_and' collision at 12.13)
    { id: '12.21', kind: 'lemma', leanName: "peirce_law'", chapter: 12, givens: [binding('hPA', IMPLIES(IMPLIES(A, B), A))], formulas: [A, B, NOT(A)], goal: A, unlocks: [], needs: [] },
    { id: '12.22', kind: 'lemma', leanName: "resolution'", chapter: 12, givens: [binding('hAB', OR(A, B)), binding('hnAC', OR(NOT(A), C))], formulas: [A, B, C], goal: OR(C, B), unlocks: [], needs: [] },
    // Chapter 13 — True and False as first-class objects (the last propositional chapter). 13.1 introduces them;
    // then the ∨/∧ identities, and the capstone 13.6 = the very definition of negation, ¬A ↔ (A → False).
    { id: '13.1', kind: 'example', chapter: 13, givens: [], formulas: [A], goal: OR(TRUE(), A), unlocks: ['13.2', '13.3'], needs: ['tf'] },
    { id: '13.2', kind: 'example', chapter: 13, givens: [], formulas: [A, FALSE()], goal: IMPLIES(FALSE(), A), unlocks: ['13.4', '13.5'], needs: [] },
    { id: '13.3', kind: 'example', chapter: 13, givens: [], formulas: [A], goal: IMPLIES(A, TRUE()), unlocks: [], needs: [] },
    { id: '13.4', kind: 'lemma', leanName: "true_and'", chapter: 13, givens: [], formulas: [A, TRUE(), AND(TRUE(), A)], goal: IFF(A, AND(TRUE(), A)), unlocks: ['13.6'], needs: [] },
    { id: '13.5', kind: 'lemma', leanName: "false_or'", chapter: 13, givens: [], formulas: [A, FALSE(), OR(FALSE(), A)], goal: IFF(A, OR(FALSE(), A)), unlocks: [], needs: [] },
    { id: '13.6', kind: 'lemma', leanName: 'not_iff_imp_false', chapter: 13, givens: [], formulas: [A, FALSE(), NOT(A), IMPLIES(A, FALSE())], goal: IFF(NOT(A), IMPLIES(A, FALSE())), unlocks: ['17.1'], needs: [] },
    // Chapters 16–18 — first-order logic over the generic sort Ω. Introduce a free variable (a sub-env, like an
    // assumption); discharging a proof gives ∀ x : Ω, … . 17.1 (one variable, unary predicate) is the gentle entry;
    // 16.1 (two variables) is an optional side-quest. Ch 18 adds universal_instantiation (the ∀ analogue of MP).
    { id: '17.1', kind: 'example', chapter: 17, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }], givens: [], formulas: [], terms: [X],
      goal: fa('X', IMPLIES(appE('P', [X]), appE('P', [X]))), unlocks: ['16.1', '17.2'], needs: ['forall'] },
    { id: '16.1', kind: 'example', chapter: 16, sorts: [OMEGA], preds: [{ name: 'Q', argSorts: [OMEGA, OMEGA], resultSort: PROP }], givens: [], formulas: [], terms: [varE('x', OMEGA), varE('y', OMEGA)],
      goal: FORALL({ name: 'x', sort: OMEGA }, FORALL({ name: 'y', sort: OMEGA }, IMPLIES(appE('Q', [varE('x', OMEGA), varE('y', OMEGA)]), appE('Q', [varE('x', OMEGA), varE('y', OMEGA)])))), unlocks: [], needs: [] },
    { id: '17.2', kind: 'example', chapter: 17, sorts: [OMEGA], preds: [{ name: 'Q', argSorts: [OMEGA, OMEGA], resultSort: PROP }], givens: [], formulas: [fa('X', fa('Y', appE('Q', [X, Y])))],
      goal: IMPLIES(fa('X', fa('Y', appE('Q', [X, Y]))), fa('X', fa('Y', appE('Q', [X, Y])))), unlocks: ['18.1'], needs: [] },
    { id: '18.1', kind: 'example', chapter: 18, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }, { name: 'R', argSorts: [OMEGA], resultSort: PROP }], terms: [X],
      givens: [binding('hpr', fa('X', IMPLIES(appE('P', [X]), appE('R', [X])))), binding('hp', fa('X', appE('P', [X])))],
      goal: fa('X', appE('R', [X])), unlocks: ['18.2a', '18.3a', '18.3b', '18.4', '18.5', '19.1'], needs: ['instantiate'] },
    // 18.3a "Barbara singular": a term constant α : Ω is given in the context; instantiate hPQ at α, then modus ponens.
    // A LEMMA — minting `barbara` mints a higher-order recipe (P, Q are second-order metavars, α explicit) reusable for 18.3b.
    { id: '18.3a', kind: 'lemma', leanName: 'barbara', chapter: 18, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }, { name: 'Q', argSorts: [OMEGA], resultSort: PROP }], consts: [{ name: 'α', sort: OMEGA }],
      givens: [binding('hPQ', fa('X', IMPLIES(appE('P', [X]), appE('Q', [X])))), binding('hP', appE('P', [alpha]))],
      goal: appE('Q', [alpha]), unlocks: [], needs: [] },
    { id: '18.2a', kind: 'example', chapter: 18, sorts: [OMEGA], preds: [], terms: [X], givens: [binding('hA', A)], goal: fa('X', A), unlocks: [], needs: [] },
    { id: '18.3b', kind: 'example', chapter: 18, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }, { name: 'R', argSorts: [OMEGA], resultSort: PROP }, { name: 'S', argSorts: [OMEGA], resultSort: PROP }], terms: [X],
      givens: [binding('hpr', fa('X', IMPLIES(appE('P', [X]), appE('R', [X])))), binding('hsp', fa('X', IMPLIES(appE('S', [X]), appE('P', [X]))))],
      goal: fa('X', IMPLIES(appE('S', [X]), appE('R', [X]))), unlocks: [], needs: [] },
    { id: '18.4', kind: 'example', chapter: 18, sorts: [OMEGA], preds: [{ name: 'Q', argSorts: [OMEGA, OMEGA], resultSort: PROP }], terms: [X, Y],
      givens: [binding('h', fa('X', fa('Y', appE('Q', [X, Y]))))],
      goal: fa('Y', fa('X', appE('Q', [X, Y]))), unlocks: [], needs: [] },
    // 18.5 / 18.6 — the ∀ distributes over ∧ (both directions), the capstone pair of the universal-quantifier chapter.
    { id: '18.5', kind: 'lemma', leanName: "forall_and'", chapter: 18, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }, { name: 'Q', argSorts: [OMEGA], resultSort: PROP }], terms: [X],
      givens: [binding('h', fa('X', AND(appE('P', [X]), appE('Q', [X]))))],
      goal: AND(fa('X', appE('P', [X])), fa('X', appE('Q', [X]))), unlocks: ['18.6'], needs: [] },
    { id: '18.6', kind: 'lemma', leanName: "forall_and_rev'", chapter: 18, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }, { name: 'Q', argSorts: [OMEGA], resultSort: PROP }], terms: [X],
      givens: [binding('h', AND(fa('X', appE('P', [X])), fa('X', appE('Q', [X]))))],
      goal: fa('X', AND(appE('P', [X]), appE('Q', [X]))), unlocks: [], needs: [] },
    // Chapter 19 — the existential quantifier ∃ and its ELIMINATION via `obtain`: given `∃ x, P x` and an UNCLAIMED
    // variable name, place that variable in context together with its witnessing hypothesis (no sub-environment; the
    // goal is unchanged). Non-destructive — `have h2 := h; obtain ⟨a, ha⟩ := h2` — so the ∃ survives. (QED §19's
    // "push" exercises don't port: they moved the goal INTO an ∃ sub-environment, which the Lean model has no need of.)
    // 19.1 introduces `exists` (obtain → instantiate → modus_ponens); 19.2 (ex falso) and 19.3 (∧-elim) are siblings.
    { id: '19.1', kind: 'example', chapter: 19, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }], terms: [varE('a', OMEGA)],
      givens: [binding('hex', ee('x', appE('P', [xL]))), binding('hpc', fa('X', IMPLIES(appE('P', [X]), C)))],
      goal: C, unlocks: ['19.2', '19.3', '21.1'], needs: ['exists'] },
    { id: '19.2', kind: 'example', chapter: 19, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }], terms: [varE('a', OMEGA)], formulas: [C],
      givens: [binding('hex', ee('x', appE('P', [xL]))), binding('hnp', fa('X', NOT(appE('P', [X]))))],
      goal: C, unlocks: [], needs: [] },
    { id: '19.3', kind: 'example', chapter: 19, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }, { name: 'Q', argSorts: [OMEGA], resultSort: PROP }], terms: [varE('a', OMEGA)],
      givens: [binding('hex', ee('x', AND(appE('P', [xL]), appE('Q', [xL])))), binding('hpc', fa('X', IMPLIES(appE('P', [X]), C)))],
      goal: C, unlocks: [], needs: [] },
    // Chapter 21 — every sort in the game is NONEMPTY, so one can "pick a : Ω arbitrarily" (a new recipe that adds a
    // variable directly to the context, no ∃/witness hypothesis). 21.1: from ∀x, A (A not depending on x) deduce A —
    // provable only because Ω is inhabited (pick a witness, then instantiate). Minted as the reusable `forall_const'`.
    { id: '21.1', kind: 'lemma', leanName: "forall_const'", chapter: 21, sorts: [OMEGA], nonempty: [OMEGA], terms: [varE('a', OMEGA)],
      givens: [binding('hA', fa('X', A))], goal: A, unlocks: ['22.1'], needs: ['pick'] },
    // Chapter 22 — EXISTENTIAL INTRODUCTION: from a proof of P(t) and a witness term t, conclude ∃x, P(x). The witness
    // occurrences are abstracted, and since that choice is not unique the player selects among the finitely-many results
    // (e.g. Q(α,α) offers ∃x,Q(x,x) / ∃x,Q(x,α) / ∃x,Q(α,x) / ∃x,Q(α,α)). 22.1 introduces it; 22.2 is the ∀→∃ implication
    // (needs a witness, so pick one first — Chapter 21); 22.3 is the four-way choice exercise.
    { id: '22.1', kind: 'example', chapter: 22, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }], consts: [{ name: 'α', sort: OMEGA }], terms: [alpha],
      givens: [binding('hP', appE('P', [alpha]))], goal: ee('x', appE('P', [xL])), unlocks: ['22.2', '22.3', '22.4'], needs: ['exists_intro'] },
    { id: '22.2', kind: 'lemma', leanName: 'exists_of_forall', chapter: 22, sorts: [OMEGA], nonempty: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }], terms: [varE('a', OMEGA)],
      givens: [binding('h', fa('X', appE('P', [X])))], goal: ee('x', appE('P', [xL])), unlocks: [], needs: [] },
    { id: '22.3', kind: 'example', chapter: 22, sorts: [OMEGA], preds: [{ name: 'Q', argSorts: [OMEGA, OMEGA], resultSort: PROP }], consts: [{ name: 'α', sort: OMEGA }], terms: [alpha],
      givens: [binding('hQ', appE('Q', [alpha, alpha]))], goal: ee('x', appE('Q', [xL, xL])), unlocks: [], needs: [] },
    // rest of QED §22 (obtain + instantiate + ∃-intro + reductio). QED 22.6(c) (bound-variable renaming) does NOT
    // port — α-equivalence is automatic here. 22.4 = QED 22.1 (∃-intro into a conjunction, a real abstraction choice);
    // 22.5a = QED 22.3(a) quantifier De Morgan; 22.6a/b = QED 22.4(a)/(b) syllogisms; 22.8a/b = QED 22.6(a)/(b) swaps.
    { id: '22.4', kind: 'example', chapter: 22, sorts: [OMEGA], preds: [{ name: 'Q', argSorts: [OMEGA, OMEGA], resultSort: PROP }], consts: [{ name: 'α', sort: OMEGA }], terms: [alpha],
      givens: [binding('hQ', appE('Q', [alpha, alpha]))], goal: ee('X', AND(appE('Q', [alpha, X]), appE('Q', [X, alpha]))), unlocks: ['22.5a', '22.6a', '22.6b', '22.8a'], needs: [] },
    { id: '22.5a', kind: 'example', chapter: 22, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }], terms: [X],
      givens: [], goal: IFF(NOT(ee('X', appE('P', [X]))), fa('X', NOT(appE('P', [X])))), unlocks: ['22.11', '22.12'], needs: [] },
    { id: '22.6a', kind: 'example', chapter: 22, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }, { name: 'Q', argSorts: [OMEGA], resultSort: PROP }, { name: 'R', argSorts: [OMEGA], resultSort: PROP }], terms: [X],
      givens: [binding('hnpq', NOT(ee('X', AND(appE('P', [X]), appE('Q', [X]))))), binding('hRP', fa('X', IMPLIES(appE('R', [X]), appE('P', [X]))))],
      goal: NOT(ee('X', AND(appE('R', [X]), appE('Q', [X])))), unlocks: ['22.10'], needs: [] },
    { id: '22.6b', kind: 'example', chapter: 22, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }, { name: 'Q', argSorts: [OMEGA], resultSort: PROP }, { name: 'R', argSorts: [OMEGA], resultSort: PROP }], terms: [X],
      givens: [binding('hPQ', fa('X', IMPLIES(appE('P', [X]), appE('Q', [X])))), binding('hex', ee('X', AND(appE('R', [X]), appE('P', [X]))))],
      goal: ee('X', AND(appE('R', [X]), appE('Q', [X]))), unlocks: ['22.6c', '22.7a'], needs: [] },
    // 22.6c = QED 22.4(c): derive an ∃ whose body has a negation proved by an inner reductio
    { id: '22.6c', kind: 'example', chapter: 22, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }, { name: 'Q', argSorts: [OMEGA], resultSort: PROP }, { name: 'R', argSorts: [OMEGA], resultSort: PROP }], terms: [X],
      givens: [binding('hnpq', NOT(ee('X', AND(appE('P', [X]), appE('Q', [X]))))), binding('hex', ee('X', AND(appE('R', [X]), appE('P', [X]))))],
      goal: ee('X', AND(appE('R', [X]), NOT(appE('Q', [X])))), unlocks: [], needs: [] },
    // 22.7a = QED 22.5(a): a chained syllogism with an existential witness
    { id: '22.7a', kind: 'example', chapter: 22, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }, { name: 'Q', argSorts: [OMEGA], resultSort: PROP }, { name: 'R', argSorts: [OMEGA], resultSort: PROP }], terms: [X],
      givens: [binding('hPQ', fa('X', IMPLIES(appE('P', [X]), appE('Q', [X])))), binding('hQR', fa('X', IMPLIES(appE('Q', [X]), appE('R', [X])))), binding('hex', ee('X', appE('P', [X])))],
      goal: ee('X', AND(appE('P', [X]), appE('R', [X]))), unlocks: [], needs: [] },
    // 22.10 = QED 22.8: a ∀-goal syllogism combining instantiation, chaining and an inner reductio
    { id: '22.10', kind: 'example', chapter: 22, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }, { name: 'Q', argSorts: [OMEGA], resultSort: PROP }, { name: 'R', argSorts: [OMEGA], resultSort: PROP }, { name: 'S', argSorts: [OMEGA], resultSort: PROP }], terms: [X],
      givens: [binding('hPnQ', fa('X', IMPLIES(appE('P', [X]), NOT(appE('Q', [X]))))), binding('hnQR', fa('X', IMPLIES(NOT(appE('Q', [X])), appE('R', [X])))), binding('hnrs', NOT(ee('X', AND(appE('R', [X]), appE('S', [X])))))],
      goal: fa('X', IMPLIES(appE('P', [X]), NOT(appE('S', [X])))), unlocks: [], needs: [] },
    { id: '22.8a', kind: 'example', chapter: 22, sorts: [OMEGA], preds: [{ name: 'Q', argSorts: [OMEGA, OMEGA], resultSort: PROP }], terms: [X, Y],
      givens: [binding('h', ee('Y', ee('X', appE('Q', [X, Y]))))], goal: ee('X', ee('Y', appE('Q', [X, Y]))), unlocks: ['22.8b'], needs: [] },
    { id: '22.8b', kind: 'example', chapter: 22, sorts: [OMEGA], preds: [{ name: 'Q', argSorts: [OMEGA, OMEGA], resultSort: PROP }], terms: [X, Y],
      givens: [binding('h', ee('Y', fa('X', appE('Q', [X, Y]))))], goal: fa('X', ee('Y', appE('Q', [X, Y]))), unlocks: [], needs: [] },
    // Helper lemmas → heavier claims via MATCHING (a Grimoire capability QED lacked). The directional De Morgan halves
    // (22.11/22.12) MINT reusable recipes (the hypothesis pins the predicate P, so they are determinate). 22.13
    // `forall_dne` reuses the earlier `not_not_elim` (12.3) under a ∀. The classical De Morgan 22.3b then accelerates:
    // `not_exists_forall_not` fires on `¬∃X,¬P X` (its predicate metavar solved to λx.¬P x by higher-order matching),
    // then `forall_dne`, then `not_not_elim` — a few steps instead of ~20 raw ones.
    { id: '22.11', kind: 'lemma', leanName: 'not_exists_forall_not', chapter: 22, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }], terms: [X],
      givens: [binding('hne', NOT(ee('X', appE('P', [X]))))], goal: fa('X', NOT(appE('P', [X]))), unlocks: ['22.13'], needs: [] },
    { id: '22.12', kind: 'lemma', leanName: 'forall_not_not_exists', chapter: 22, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }], terms: [X],
      givens: [binding('hfn', fa('X', NOT(appE('P', [X]))))], goal: NOT(ee('X', appE('P', [X]))), unlocks: [], needs: [] },
    { id: '22.13', kind: 'lemma', leanName: 'forall_dne', chapter: 22, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }], terms: [X],
      givens: [binding('hdn', fa('X', NOT(NOT(appE('P', [X])))))], goal: fa('X', appE('P', [X])), unlocks: ['22.3b'], needs: [] },
    // 22.3b = QED 22.3(b): classical De Morgan `¬∀X,P ↔ ∃X,¬P` — the heavy claim; the forward direction reuses 22.11 + 22.13 + not_not_elim
    { id: '22.3b', kind: 'lemma', leanName: 'not_forall_iff_exists_not', chapter: 22, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }], terms: [X],
      givens: [], goal: IFF(NOT(fa('X', appE('P', [X]))), ee('X', NOT(appE('P', [X])))), unlocks: [], needs: [] }
  ];
  var EX_BY_ID = {}; EXERCISES.forEach(function (e) { EX_BY_ID[e.id] = e; });

  // ---------- progression: accessible exercises + active capabilities from the solved set ----------
  var PROGRESSION_START = ['1.1'];
  // which capability each base recipe requires (minted lemmas gate themselves via `state.unlocked`)
  var RECIPE_CAP = { 'And.intro': 'and.intro', 'And.left': 'and.elim', 'And.right': 'and.elim', 'Or.inl': 'or', 'Or.inr': 'or', 'modus_ponens': 'mp', 'case_analysis': 'case', 'Iff.intro': 'iff', 'Iff.mp': 'iff', 'Iff.mpr': 'iff', 'absurd': 'neg', 'Classical.em': 'em', 'True.intro': 'tf', 'False.elim': 'tf', 'universal_instantiation': 'instantiate', 'Exists.intro': 'exists_intro' };
  // accessible = start ∪ { successors of every solved exercise }.  `solved` is an id→truthy map (or array).
  function accessibleSet(solved) {
    var acc = {}; PROGRESSION_START.forEach(function (id) { acc[id] = true; });
    (Array.isArray(solved) ? solved : Object.keys(solved || {})).forEach(function (pid) {
      var p = EX_BY_ID[pid]; if (p) (p.unlocks || []).forEach(function (u) { acc[u] = true; });
    });
    return acc;
  }
  // active capabilities = union of `needs` over every accessible exercise (cumulative, monotone)
  function activeCaps(acc) {
    var caps = {};
    Object.keys(acc).forEach(function (id) { var e = EX_BY_ID[id]; if (e && e.needs) e.needs.forEach(function (c) { caps[c] = true; }); });
    return caps;
  }

  var API = {
    PROP: PROP, SYMBOLS: SYMBOLS,
    varE: varE, appE: appE, AND: AND, OR: OR, IMPLIES: IMPLIES, IFF: IFF, NOT: NOT, TRUE: TRUE, FALSE: FALSE,
    sortOf: sortOf, exprEq: exprEq, atomsOf: atomsOf,
    expandAbbrevs: expandAbbrevs, parse: parse, render: render,
    binding: binding, newEnv: newEnv, byName: byName, freshName: freshName,
    RECIPES: RECIPES, BASE_RECIPES: BASE_RECIPES, craft: craft, rename: rename, deleteBinding: deleteBinding, deductions: deductions,
    proofIng: proofIng, formulaIng: formulaIng, recipeFromExercise: recipeFromExercise, defRecipe: defRecipe,
    leanHeader: leanHeader, leanPreamble: leanPreamble, emitLean: emitLean, emitLive: emitLive, emitInformal: emitInformal,
    openAssumption: openAssumption, discharge: discharge, dischargeOptions: dischargeOptions, abandon: abandon, implChain: implChain,
    notIntro: notIntro, notIntroOption: notIntroOption,
    OMEGA: OMEGA, FORALL: FORALL, EXISTS: EXISTS, openVariable: openVariable, binderChain: binderChain, predRecipes: predRecipes, substE: substE,
    obtain: obtain, obtainOptions: obtainOptions, isExists: isExists, pick: pick, enumAbstract: enumAbstract,
    FORMULA_RECIPES: FORMULA_RECIPES, formulaDeductions: formulaDeductions,
    EXERCISES: EXERCISES, EX_BY_ID: EX_BY_ID,
    PROGRESSION_START: PROGRESSION_START, RECIPE_CAP: RECIPE_CAP, accessibleSet: accessibleSet, activeCaps: activeCaps
  };
  root.Grimoire = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
