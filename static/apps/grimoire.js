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
  var OMEGA = 'Ω';     // the first data sort (Chapter 11+); modeled in Lean by `variable {Ω}` (Ω is a valid identifier)
  var SET = 'Set';     // Chapter 16: an ABSTRACT sort — a carrier equipped with a membership relation
  var MAGMA = 'M';     // Chapter 17: the axiom-free teaching sort (a magma with a constant and a unary map)
  var GRP = 'G';       // Chapter 19: a group — the first sort whose theory carries AXIOMS
  var NAT = 'Nat';     // Chapter 20: the first CONCRETE sort — modelled on core Lean's Nat, reached by `import`

  // ---------- sort registry: which sorts exist, and what each one carries ----------
  // Sorts are deliberately NOT first-class (no sort variables, no inference): this is a hardcoded table.
  // `kind` decides how the sort reaches Lean:
  //   'generic'  — Ω, the polymorphic sort. No operations at all (equality will be its only relation).
  //   'abstract' — emitted as a `variable` preamble bundling its carrier and its operations, so a theorem
  //                reads "for any type equipped with these …". Consistent by construction: no `axiom`.
  //   'concrete' — (later) modelled on a core Lean type in its own module, reached by `import`.
  // Each sort OWNS its operations, so the term/formula benches can offer only what is legal for the sorts in
  // play — an illegal move cannot be expressed rather than having to be detected and rejected.
  var SORTS = {};
  function defSort(d) { SORTS[d.name] = d; return d; }
  defSort({ name: OMEGA, kind: 'generic', ops: [] });
  defSort({ name: SET, kind: 'abstract', ops: [{ sym: 'MEM', lean: 'mem', type: [SET, SET, PROP] }] });   // ∪/∩ and the axioms are attached below, once the Expr helpers exist
  // Chapter 17's teaching sort: a MAGMA — a carrier with a binary operation, plus a constant and a unary
  // map. Deliberately axiom-free, so nothing can be proved ABOUT c, f or ∗ and attention stays on the
  // mechanic of building and placing terms. `c` is a SORT-LEVEL constant (0-ary operation): it belongs to
  // the theory, so it auto-populates the term bench in every exercise over M — unlike the per-exercise
  // constants α, β. The group and Nat chapters get `one`/`zero` the same way.
  defSort({ name: MAGMA, kind: 'abstract', ops: [
    { sym: 'c', lean: 'c', type: [MAGMA] },
    { sym: 'f', lean: 'f', type: [MAGMA, MAGMA] },
    { sym: 'star', lean: 'star', type: [MAGMA, MAGMA, MAGMA] }
  ] });

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
  // Chapter 11+: predicate symbols (function application, rendered `Q(x, y)` on the board, `Q x y` in Lean).
  // The registry entry only marks the symbol as an `app` of result-sort Prop; each exercise's `preds` pins the
  // actual arity/argument sorts (so `Q` can be binary in one exercise and a predicate letter reused elsewhere).
  defSym({ name: 'P', arity: 1, fixity: 'app', argSorts: [OMEGA], resultSort: PROP, flex: true, uni: 'P' });
  defSym({ name: 'Q', arity: 2, fixity: 'app', argSorts: [OMEGA, OMEGA], resultSort: PROP, flex: true, uni: 'Q' });
  defSym({ name: 'R', arity: 1, fixity: 'app', argSorts: [OMEGA], resultSort: PROP, flex: true, uni: 'R' });
  defSym({ name: 'S', arity: 1, fixity: 'app', argSorts: [OMEGA], resultSort: PROP, flex: true, uni: 'S' });
  // Chapter 16: a RELATION. Infix on the board (`Y ∈ X`) but a plain function in Lean (`mem Y X`) — no
  // typeclass is introduced. `leanApp` names the function the infix form emits as.
  // Chapter 17 operations. Note an `app` symbol emits its OWN NAME in Lean, so the registry name is the
  // Lean function name; `star` is infix on the board but a function in Lean, like ∈.
  defSym({ name: 'c', arity: 0, fixity: 'atom', uni: 'c', resultSort: MAGMA });
  defSym({ name: 'f', arity: 1, fixity: 'app', argSorts: [MAGMA], resultSort: MAGMA, uni: 'f' });
  defSym({ name: 'star', arity: 2, fixity: 'infix', prec: 60, assoc: 'left', uni: '∗', abbrev: ['\\star', '\\ast'], argSorts: [MAGMA, MAGMA], resultSort: MAGMA, leanApp: 'star' });
  // Chapter 18: set operations. Both are infix on the board and plain functions in Lean.
  defSym({ name: 'union', arity: 2, fixity: 'infix', prec: 65, assoc: 'left', uni: '∪', abbrev: ['\\union', '\\cup'], argSorts: [SET, SET], resultSort: SET, leanApp: 'union' });
  defSym({ name: 'inter', arity: 2, fixity: 'infix', prec: 70, assoc: 'left', uni: '∩', abbrev: ['\\inter', '\\cap'], argSorts: [SET, SET], resultSort: SET, leanApp: 'inter' });
  // Chapter 20: Peano arithmetic. `0` on the board is `zero` in Lean; `+` and `≤` are plain functions.
  defSym({ name: 'nzero', arity: 0, fixity: 'atom', uni: '0', leanApp: 'zero', resultSort: NAT });
  defSym({ name: 'succ', arity: 1, fixity: 'app', argSorts: [NAT], resultSort: NAT, uni: 'succ' });
  defSym({ name: 'add', arity: 2, fixity: 'infix', prec: 65, assoc: 'left', uni: '+', abbrev: ['\\add', '\\plus'], argSorts: [NAT, NAT], resultSort: NAT, leanApp: 'add' });
  defSym({ name: 'le', arity: 2, fixity: 'infix', prec: 50, uni: '≤', abbrev: ['\\le', '\\leq'], argSorts: [NAT, NAT], resultSort: PROP, leanApp: 'le' });
  // Chapter 19: the group carrier's operations.
  defSym({ name: 'one', arity: 0, fixity: 'atom', uni: '1', leanApp: 'one', resultSort: GRP });
  defSym({ name: 'mul', arity: 2, fixity: 'infix', prec: 65, assoc: 'left', uni: '·', abbrev: ['\\mul', '\\cdot'], argSorts: [GRP, GRP], resultSort: GRP, leanApp: 'mul' });
  defSym({ name: 'inv', arity: 1, fixity: 'app', argSorts: [GRP], resultSort: GRP, uni: 'inv' });
  // Chapter 18: EQUALITY — the one relation every sort has, and the only operation Ω will ever carry.
  // `polyArgs` marks it as sort-polymorphic: both sides must share a sort, and it may not compare formulas.
  // Infix in Lean too, so no `leanApp` is needed.
  defSym({ name: 'EQ', arity: 2, fixity: 'infix', prec: 38, uni: '=', abbrev: ['\\eq', '\\equals'], resultSort: PROP, polyArgs: true });
  defSym({ name: 'MEM', arity: 2, fixity: 'infix', prec: 38, uni: '∈', abbrev: ['\\in', '\\mem'], argSorts: [SET, SET], resultSort: PROP, leanApp: 'mem' });

  // ---------- words mode: the LOGICAL layer in English ----------
  // A player who has never met ∧ can read the informal proof but not the statements it is about, which
  // is a strange place to leave someone: the prose explains a line of symbols they cannot pronounce. So
  // the logical layer -- connectives, quantifiers, True/False -- gets an English rendering, and the
  // MATHEMATICAL layer (=, ∈, ≤, +, ·, ∪, ∩, ∗) keeps its ordinary school notation. Those symbols are
  // not what makes a statement unreadable, and spelling them out ("x is a member of a union b") reads
  // far worse than the symbols do. The Lean proof is never worded: it is the one place the player is
  // meant to be reading real notation, and it is the thing they will paste into an editor.
  var WORDS = { NOT: 'not', AND: 'and', OR: 'or', IMPLIES: 'implies', IFF: 'if and only if', TRUE: 'true', FALSE: 'false' };
  var QWORDS = { forall: 'for all', exists: 'for some' };
  // `X : Ω` is a typing judgement; in words it is just membership of the sort, which is what Ω means.
  function varPhrase(name, sort, opts) { return name + ((opts && opts.words) ? ' in ' : ' : ') + sort; }
  // Rule summaries on the recipe cards, hints, and the notes are hand-written strings carrying the same
  // notation, and minted recipes build theirs with render() at unlock time, so there is nothing to pass
  // an option to. They are transliterated instead -- crude, but these are short schematic lines, and it
  // keeps one source of truth for each rule rather than a parallel English copy that can drift.
  // ⊢ and ↦ become a separator rather than a word: the em dash does what the turnstile was doing, which
  // is to say where the inputs stop and the result starts.
  // A quantifier is transliterated two ways, because the prose uses the glyph both ways: binding a
  // variable ('∀ x, P(x)' → 'for all x, P(x)') and as the NAME of the thing ('modus ponens for ∀' →
  // 'modus ponens for “for all”'). The bound form is a one-letter variable, optionally with its sort,
  // then a comma — which is what tells it apart from 'the ∀ tutorial, one level deeper'.
  var QVAR = '([A-Za-z\\u0370-\\u03ff][0-9\']*(?:\\s*:\\s*[A-Za-z\\u0370-\\u03ff]+)?,)';
  var TRANSLIT = [[/∧/g, 'and'], [/∨/g, 'or'], [/→/g, 'implies'], [/↔/g, 'if and only if'], [/¬ ?/g, 'not '],
                  [/[⊢↦]/g, '— you get'],
                  [new RegExp('∀ ' + QVAR, 'g'), 'for all $1'], [new RegExp('∃ ' + QVAR, 'g'), 'for some $1'],
                  [/∀/g, '“for all”'], [/∃/g, '“for some”'], [/\bTrue\b/g, 'true'], [/\bFalse\b/g, 'false']];
  function wordsRule(str) {
    var s = String(str);
    TRANSLIT.forEach(function (t) { s = s.replace(t[0], t[1]); });
    return s.replace(/  +/g, ' ').replace(/^\s*— /, '');   // a nullary rule ('⊢ True') has no inputs to separate
  }
  // Words mode is an INPUT mode too, or it would be a strange half-measure: what the player reads on the
  // shelf, they can type into the bench. Longest phrase first, so "if and only if" is not read as an
  // "and". `in` is the sort separator only right after a quantifier ("for all x in Ω" → "∀ x : Ω"),
  // since on its own it is far more likely to mean ∈ -- which the player types as `in` either way.
  var WORD_IN = [[/\bif and only if\b/gi, '↔'], [/\biff\b/gi, '↔'], [/\bimplies\b/gi, '→'],
                 [/\band\b/gi, '∧'], [/\bor\b/gi, '∨'], [/\bnot\b/gi, '¬'],
                 [/([∀∃]\s*[A-Za-zͰ-Ͽ][0-9']*)\s+in\s+/g, '$1 : '],
                 [/\btrue\b/g, 'True'], [/\bfalse\b/g, 'False']];
  // The quantifier words come from `expandQuantWords`, which `parse` applies in every mode; this adds the
  // rest of the English, and then reads `in` as the sort separator wherever a quantifier was just written.
  function wordsToSymbols(str) {
    var s = expandQuantWords(str);
    WORD_IN.forEach(function (t) { s = s.replace(t[0], t[1]); });
    return s;
  }

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
  // ∀ and ∃ are not operator SYMBOLS -- they bind a variable, so the parser handles them structurally
  // rather than as entries in the registry -- but a player looking for them wants the same backslash
  // shortcuts as everything else, and the same live expansion on space or Tab.
  ABBREV['\\forall'] = '∀'; ABBREV['\\all'] = '∀';
  ABBREV['\\exists'] = '∃'; ABBREV['\\ex'] = '∃';
  function expandAbbrevs(str) { return String(str).replace(/\\[a-zA-Z]+/g, function (m) { return ABBREV[m] !== undefined ? ABBREV[m] : m; }); }
  // The WORDS, too, and in every mode. A player who has only met the symbol in the goal pane will try
  // "exists x" or "for all x" long before finding \exists, and there is nothing else those words could
  // mean in a formula here -- nothing in the game is named `exists`. `parse` runs this first, so the words
  // work whether or not Plain English is switched on. "there exists" has to be tried before the bare
  // "exists", or the "there" would be left stranded.
  var QUANT_WORDS = [
    [/\bfor\s+(?:all|every|each|any)\b/gi, '∀'], [/\bforall\b/gi, '∀'],
    [/\bfor\s+some\b/gi, '∃'], [/\bthere\s+(?:exists|exist|is|are)\b/gi, '∃'], [/\bexists\b/gi, '∃']
  ];
  function expandQuantWords(str) { var t = String(str); QUANT_WORDS.forEach(function (q) { t = t.replace(q[0], q[1]); }); return t; }

  // ---------- parser: precedence climbing over the registry ----------
  // Only genuine operator CHARACTERS go here. An `app` symbol (a predicate P, an operation f) is written as
  // an identifier followed by its arguments, so registering its name as an operator character would stop it
  // ever tokenising as an identifier — which is exactly why `P(x)` could not be typed before.
  var UNI_OP = {}; Object.keys(SYMBOLS).forEach(function (k) { var s = SYMBOLS[k]; if (s.fixity !== 'atom' && s.fixity !== 'app') UNI_OP[s.uni] = k; });
  // A nullary constant is DISPLAYED as its glyph but REGISTERED under an internal name -- `0` is `nzero`,
  // `1` is `one` -- so the parser has to accept the glyph as well, or the board shows `0 + a = a` and then
  // refuses to read it back.
  var UNI_ATOM = {}; Object.keys(SYMBOLS).forEach(function (k) { var s = SYMBOLS[k]; if (s.fixity === 'atom' && s.arity === 0) UNI_ATOM[s.uni] = k; });
  // Identifiers admit Greek letters, because the Ω-sorted constants the game hands out are α, β, γ …
  // (Ω itself is a sort name, never an identifier). Without this a player simply cannot type `α = β`.
  var IDENT_CH = /[A-Za-z0-9_'\u0370-\u03ff\u1f00-\u1fff]/;
  function tokenize(str) {
    var toks = [], i = 0;
    while (i < str.length) {
      var c = str[i];
      if (/\s/.test(c)) { i++; continue; }
      if (c === '(' || c === ')' || c === ',' || c === ':') { toks.push({ t: c }); i++; continue; }
      if (c === '∀' || c === '∃') { toks.push({ t: 'quant', q: c === '∀' ? 'forall' : 'exists' }); i++; continue; }
      if (UNI_OP[c]) { toks.push({ t: 'op', sym: UNI_OP[c] }); i++; continue; }
      if (IDENT_CH.test(c)) {
        var j = i; while (j < str.length && IDENT_CH.test(str[j])) j++;
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
  // A symbol that declares `argSorts` only applies to arguments of those sorts. Reporting this beats
  // building an ill-sorted formula that would later fail to match anything for no visible reason.
  function argSortError(sym, args) {
    var d = SYMBOLS[sym]; if (!d || d.flex) return null;   // a predicate letter's sorts come from the exercise
    if (d.polyArgs) {   // both sides share one sort, and it is a data sort (comparing formulas is not equality)
      var s0 = sortOf(args[0]), s1 = sortOf(args[1]);
      if (s0 === PROP || s1 === PROP) return d.uni + ' compares terms, not formulas';
      if (s0 !== s1) return d.uni + ' compares two terms of the same sort, but got ' + s0 + ' and ' + s1;
      return null;
    }
    if (!d.argSorts) return null;
    for (var i = 0; i < args.length; i++) {
      if (sortOf(args[i]) !== d.argSorts[i]) {
        return d.uni + ' needs ' + d.argSorts[i] + ' on ' + (i === 0 ? 'the left' : 'the right') +
               ', but got ' + (sortOf(args[i]) === PROP ? 'a formula' : sortOf(args[i]));
      }
    }
    return null;
  }
  // An exercise RE-DECLARES its predicate letters: Q is `Ω → Prop` on one level and `Ω → Ω → Prop` on
  // another, and the registry can only carry one of those as a default. So a level's own signatures win,
  // and unlike the registry's flexible default they are CHECKED -- `P(A)` with a formula where a term
  // belongs is worth reporting, not quietly building into something that can never match anything.
  function predSortError(name, sig, args) {
    for (var i = 0; i < args.length; i++) {
      var got = sortOf(args[i]);
      if (got !== sig.argSorts[i])
        return name + ' takes ' + sig.argSorts[i] + (sig.arity === 1 ? '' : ' as argument ' + (i + 1)) +
               ', but got ' + (got === PROP ? 'a formula' : got);
    }
    return null;
  }
  // `ctx` (optional) maps an identifier to its sort — the data variables currently in context (the gems).
  // Without it every identifier is a propositional atom, which is right for Chapters 1–10 but wrong the
  // moment a sort carries a relation: `r ∈ r` needs to know that r is a Set element, not a proposition.
  // `opts.sort` is the sort a quantifier binds at when the player writes none -- the exercise's own default
  // sort, which is what `∀ x, P(x)` means nine times in ten. `opts.preds` is the exercise's predicate
  // signatures; without them a level whose Q takes one argument will not accept `Q(α)`, because the
  // registry's Q takes two.
  function parse(str, ctx, opts) {
    var defSortName = (opts && opts.sort) || OMEGA;
    var preds = {};
    ((opts && opts.preds) || []).forEach(function (pd) {
      preds[pd.name] = { arity: pd.argSorts.length, argSorts: pd.argSorts, resultSort: pd.resultSort || PROP, fixity: 'app' };
    });
    var scope = {};   // variables bound by an enclosing ∀/∃; inside the body they shadow `ctx`
    var sortOfName = function (n) { return scope[n] || (ctx && ctx[n]) || PROP; };
    // Abbreviations FIRST: `\and` and `\forall` contain the words `and` and `forall`, so the word
    // pass would turn them into `\∧` and `\∀` and strand the backslash. Then the English, which is
    // read in EVERY mode -- nothing in a formula can be spelt `and` or `exists` but the connective and
    // the quantifier, so accepting them costs nothing and leaves one rule fewer for a player to know.
    var tk = tokenize(wordsToSymbols(expandAbbrevs(str)));
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
        var bad = argSortError(t.sym, [e, rhs.expr]);
        if (bad) return { ok: false, error: bad };
        e = appE(t.sym, [e, rhs.expr]);
      }
      return { ok: true, expr: e };
    }
    function prefix() {
      var t = peek();
      if (t && t.t === 'quant') { pos++; return binder(t.q); }
      if (t && t.t === 'op' && SYMBOLS[t.sym].fixity === 'prefix') { pos++; var a = expr(SYMBOLS[t.sym].prec); if (!a.ok) return a; return { ok: true, expr: appE(t.sym, [a.expr]) }; }
      return atom();
    }
    // `∀ x : Ω, body` -- one or more variables, an optional shared sort, a comma, then the body, which runs
    // as far to the right as it will go, because a binder is looser than every connective. That is also how
    // the renderer prints one, so what the board shows can be typed straight back in. Several variables
    // under one quantifier nest with the last innermost, as in Lean.
    function binder(q) {
      var glyph = q === 'forall' ? '∀' : '∃', names = [];
      while (toks[pos] && toks[pos].t === 'id') { names.push(toks[pos].name); pos++; }
      if (!names.length) return { ok: false, error: 'name the variable ' + glyph + ' binds, as in “' + glyph + ' x, P(x)”' };
      var sort = defSortName;
      if (toks[pos] && toks[pos].t === ':') {
        pos++;
        var sn = toks[pos];
        if (!sn || sn.t !== 'id') return { ok: false, error: 'expected a sort after “:”, as in “' + glyph + ' x : ' + defSortName + ', P(x)”' };
        pos++;
        sort = sn.name === 'Omega' ? OMEGA : sn.name;
        if (!SORTS[sort]) return { ok: false, error: 'there is no sort “' + sn.name + '”' };
      }
      if (!toks[pos] || toks[pos].t !== ',') return { ok: false, error: 'put a comma after the variable: “' + glyph + ' ' + names.join(' ') + (sort === defSortName ? '' : ' : ' + sort) + ', …”' };
      pos++;
      var saved = names.map(function (n) { return scope[n]; });
      names.forEach(function (n) { scope[n] = sort; });
      var b = expr(0);
      names.forEach(function (n, k) { if (saved[k] === undefined) delete scope[n]; else scope[n] = saved[k]; });
      if (!b.ok) return b;
      if (sortOf(b.expr) !== PROP) return { ok: false, error: 'a quantifier has to bind a formula, and “' + render(b.expr) + '” is a term' };
      var e = b.expr;
      for (var k2 = names.length - 1; k2 >= 0; k2--) e = (q === 'forall' ? FORALL : EXISTS)({ name: names[k2], sort: sort }, e);
      return { ok: true, expr: e };
    }
    function atom() {
      var t = toks[pos++];
      if (!t) return { ok: false, error: 'unexpected end of input' };
      if (t.t === '(') { var e = expr(0); if (!e.ok) return e; var c = toks[pos++]; if (!c || c.t !== ')') return { ok: false, error: 'expected “)”' }; return e; }
      if (t.t === 'id') {
        // `name(arg, …)` is an application of a registered symbol — a predicate (Q(x,y)) or an operation (f(x))
        if (toks[pos] && toks[pos].t === '(') {
          var d = preds[t.name] || SYMBOLS[t.name];
          if (!d || d.fixity !== 'app') return { ok: false, error: '“' + t.name + '” is not a function or predicate' };
          pos++;
          var args = [];
          if (toks[pos] && toks[pos].t === ')') pos++;
          else {
            while (true) {
              var a = expr(0); if (!a.ok) return a;
              args.push(a.expr);
              var nx = toks[pos++];
              if (nx && nx.t === ',') continue;
              if (nx && nx.t === ')') break;
              return { ok: false, error: 'expected “,” or “)” in the arguments of ' + t.name };
            }
          }
          if (args.length !== d.arity) return { ok: false, error: t.name + ' takes ' + d.arity + ' argument' + (d.arity === 1 ? '' : 's') + ' here, but got ' + args.length };
          var badA = preds[t.name] ? predSortError(t.name, preds[t.name], args) : argSortError(t.name, args);
          if (badA) return { ok: false, error: badA };
          return { ok: true, expr: appE(t.name, args) };
        }
        // A name the CONTEXT knows wins over a registry constant spelt the same way: `c` is the magma's
        // own constant on a magma level, but on a level over Set it is whatever that exercise called `c`.
        var local = scope[t.name] || (ctx && ctx[t.name]);
        var d0 = local ? null : (SYMBOLS[t.name] || SYMBOLS[UNI_ATOM[t.name]]);
        if (d0 && d0.arity === 0 && d0.fixity === 'atom') return { ok: true, expr: appE(d0.name, []) };   // a sort's constant
        return { ok: true, expr: varE(t.name, sortOfName(t.name)) };
      }
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
  // a sort may be written one way on the board and another in Lean (`Nat` vs the module's `Nat'`)
  function sortName(sn, lean) { return (lean && (SORTS[sn] || {}).lean) || sn; }
  function render(e, opts) {
    var lean = !!(opts && opts.lean), words = !lean && !!(opts && opts.words);
    var parens = !!(opts && opts.parens);
    // English has no operator-precedence conventions to lean on: "A and B or C" is not ambiguous in Lean
    // but it is to a reader, so a WORDED node always brackets. Only the worded ones, though: `x ∈ a or
    // x ∈ b` needs the bracket around the `or`, not around each membership, which still reads by its
    // ordinary precedence. The parens option, when the player has it on, brackets everything as before.
    function bracket(e) { return parens || (words && (e.tag === 'binder' || !!WORDS[e.sym])); }
    function go(e, minPrec, top) {
      if (e.tag === 'var') return e.name;
      if (e.tag === 'binder') {
        var str = words
          ? QWORDS[e.q] + ' ' + varPhrase(e.v.name, sortName(e.v.sort, false), opts) + ', ' + go(e.body, 0, false)
          : (e.q === 'forall' ? '∀' : '∃') + ' ' + e.v.name + ' : ' + sortName(e.v.sort, lean) + ', ' + go(e.body, 0, false);
        return (BINDER_PREC < minPrec || (bracket(e) && !top)) ? '(' + str + ')' : str;
      }
      var s = SYMBOLS[e.sym];
      // In Lean an application binds tighter than anything, so a nested one must be parenthesised:
      // `star c (f c)`, never `star c f c` — which would read as a three-argument application.
      // minPrec 100 is the marker for "I am an argument position".
      if (lean && s.leanApp) {   // an infix relation is emitted as the plain function it stands for
        if (!e.args.length) return s.leanApp;   // a constant: `1` on the board is `one` in Lean
        var la = s.leanApp + ' ' + e.args.map(function (a) { return go(a, 100, false); }).join(' ');
        return minPrec >= 100 ? '(' + la + ')' : la;
      }
      if (s.fixity === 'atom') return (words && WORDS[e.sym]) || s.uni;
      if (s.fixity === 'app') {   // predicate application: `Q x y` in Lean, `Q(x, y)` on the board
        var args = e.args.map(function (a) { return go(a, lean ? 100 : 0, false); });
        if (!lean) return e.sym + '(' + args.join(', ') + ')';
        var ap = e.sym + (args.length ? ' ' + args.join(' ') : '');
        return minPrec >= 100 ? '(' + ap + ')' : ap;
      }
      var str, op = (words && WORDS[e.sym]) || s.uni;
      if (s.fixity === 'prefix') str = op + ' ' + go(e.args[0], s.prec, false);
      else str = go(e.args[0], s.assoc === 'left' ? s.prec : s.prec + 1, false) + ' ' + op + ' ' + go(e.args[1], s.assoc === 'right' ? s.prec : s.prec + 1, false);
      return (s.prec < minPrec || (bracket(e) && !top)) ? '(' + str + ')' : str;
    }
    return (opts && opts.arg) ? go(e, 100, false) : go(e, 0, true);
  }

  // ---------- environment: one list of Bindings `name : type` (Lean local context) ----------
  function binding(name, type) { return { name: name, type: type }; }
  function newEnv(exercise) {
    // `vars` = the DATA half of the proof state (context variables of a non-Prop sort): given constants, plus any
    // variables introduced by ∀-introduction or `obtain`. This is the single source of truth for "in context".
    // A sort may carry AXIOMS. They are part of the theory rather than of any one exercise, so they are in
    // hand from the start — as potions, like any other hypothesis — instead of being restated as givens
    // every time (which is what makes QED's group exercises so bulky). They reach Lean the same way: as
    // ordinary `variable` hypotheses, so the theorem reads "for any group …" and no `axiom` is ever declared.
    var ax = [];
    (exercise.sorts || []).forEach(function (sn) {
      ((SORTS[sn] || {}).axioms || []).forEach(function (a) { ax.push(binding(a.name, a.type)); });
    });
    return { bindings: ax.concat(exercise.givens.map(function (g) { return binding(g.name, g.type); })), vars: (exercise.consts || []).map(function (c) { return { name: c.name, sort: c.sort }; }), goal: exercise.goal, steps: [], parent: null, assumption: null, depth: 0 };
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
  // Chapter 5: modus ponens (→ elimination) — emit the Lean application  hAB hA
  defRecipe({ id: 'modus_ponens', leanName: 'modus_ponens', chapter: 8, arity: 2, rule: 'a proof of A, and a proof of A → B ⊢ B', informal: 'modus ponens',
    match: function (inp) {
      if (inp.length !== 2 || !allProofs(inp)) return [];
      var f = inp[0], a = inp[1];   // f the implication, a the argument
      return (f.type.tag === 'app' && f.type.sym === 'IMPLIES' && exprEq(f.type.args[0], a.type)) ? [{ output: f.type.args[1], lean: f.name + ' ' + a.name }] : [];
    }
  });
  // Chapter 6: case analysis (∨ elimination) — combine A → C and B → C into A ∨ B → C (emit an Or.elim lambda)
  defRecipe({ id: 'case_analysis', leanName: 'case_analysis', chapter: 9, arity: 2, rule: 'a proof of A → C, and a proof of B → C ⊢ A ∨ B → C',
    ruleWords: 'a proof of A implies C, and a proof of B implies C — you get (A or B) implies C', informal: 'case analysis (disjunction elimination)',
    match: function (inp) {
      if (inp.length !== 2 || !allProofs(inp)) return [];
      var f = inp[0].type, g = inp[1].type;
      if (!(f.tag === 'app' && f.sym === 'IMPLIES' && g.tag === 'app' && g.sym === 'IMPLIES')) return [];
      if (!exprEq(f.args[1], g.args[1])) return [];   // the two cases must reach the same conclusion
      return [{ output: IMPLIES(OR(f.args[0], g.args[0]), f.args[1]), lean: 'fun h => Or.elim h ' + inp[0].name + ' ' + inp[1].name }];
    }
  });
  // Chapter 7: bi-implication (↔) — introduction from the two directions, and forward/backward elimination
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
  // Chapter 8: from a contradiction (a proof of A and a proof of ¬A) anything follows (emits Lean `absurd`).
  // (`absurd hA hnA : B` hides the underlying `False`, which the game does not surface until Chapter 10.)
  defRecipe({ id: 'absurd', leanName: 'absurd', chapter: 11, arity: 3, rule: 'a proof of A, a proof of ¬A, and a formula B ⊢ B', informal: 'from a contradiction, anything',
    match: function (inp) {
      if (inp.length !== 3 || !inp[0].proof || !inp[1].proof || inp[2].proof || sortOf(inp[2].type) !== PROP) return [];
      return exprEq(inp[1].type, NOT(inp[0].type)) ? [{ output: inp[2].type, lean: 'absurd ' + inp[0].name + ' ' + inp[1].name }] : [];
    }
  });
  // Chapter 9: the law of the excluded middle (classical) — a formula A yields a proof of A ∨ ¬A
  defRecipe({ id: 'Classical.em', leanName: 'Classical.em', chapter: 12, arity: 1, rule: 'a formula A ⊢ A ∨ ¬A', informal: 'the law of the excluded middle',
    match: function (inp) {
      if (inp.length !== 1 || inp[0].proof || sortOf(inp[0].type) !== PROP) return [];
      // must use the LEAN renderer: on a predicate application the display form is `Q(x, y)`, which Lean
      // rejects — it wants `Q x y`. (Only ever exercised on propositional atoms until 11.3, where the two differ.)
      return [{ output: OR(inp[0].type, NOT(inp[0].type)), lean: 'Classical.em (' + render(inp[0].type, { lean: true }) + ')' }];
    }
  });
  // Chapter 10: True and False become first-class. True is trivially provable; from False, anything (ex falso).
  var isFalse = function (t) { return t.tag === 'app' && t.sym === 'FALSE'; };
  defRecipe({ id: 'True.intro', leanName: 'True.intro', chapter: 13, arity: 0, rule: '⊢ True', informal: 'True holds trivially',
    match: function (inp) { return inp.length === 0 ? [{ output: TRUE(), lean: 'True.intro' }] : []; } });
  defRecipe({ id: 'False.elim', leanName: 'False.elim', chapter: 13, arity: 2, rule: 'a proof of False, and a formula C ⊢ C', informal: 'from falsehood, anything (ex falso)',
    match: function (inp) {
      if (inp.length !== 2 || !inp[0].proof || inp[1].proof || sortOf(inp[1].type) !== PROP) return [];
      return isFalse(inp[0].type) ? [{ output: inp[1].type, lean: 'False.elim ' + inp[0].name }] : [];
    }
  });
  // Chapter 12: universal instantiation — the ∀ counterpart of modus_ponens (specialize ∀x,P(x) at a term t → P(t),
  // emitting the Lean application `h t`). The second ingredient is a TERM (a non-proof of the bound variable's sort).
  defRecipe({ id: 'universal_instantiation', leanName: 'universal_instantiation', chapter: 18, arity: 2, rule: 'a proof of ∀ x, P(x), and a term t ⊢ P(t)',
    ruleWords: 'a proof that P(x) holds for all x, and a term t — you get P(t)', informal: 'universal instantiation (specialization)',
    match: function (inp) {
      if (inp.length !== 2 || !inp[0].proof || inp[1].proof) return [];
      var h = inp[0].type, t = inp[1].type;
      if (h.tag !== 'binder' || h.q !== 'forall' || sortOf(t) !== h.v.sort) return [];
      return [{ output: substE(h.body, h.v.name, h.v.sort, t), lean: inp[0].name + ' ' + render(t, { lean: true, arg: true }) }];
    }
  });
  // ---------- Chapter 15: existential introduction (finite occurrence-abstraction) ----------
  // enumAbstract(φ, t, xv): every body ψ with ψ[xv := t] = φ — i.e. φ with SOME SUBSET of the occurrences of the
  // (variable) witness t replaced by the fresh bound variable xv. Finite (2^#occurrences); the player picks which.
  // The witness is always a context VARIABLE (no compound terms yet), so each occurrence is independently abstract/keep.
  function cartesian(lists) {
    return lists.reduce(function (acc, l) { var out = []; acc.forEach(function (a) { l.forEach(function (x) { out.push(a.concat([x])); }); }); return out; }, [[]]);
  }
  // Every ψ with ψ[xv := t] = e — i.e. e with SOME occurrences of t abstracted to xv.
  // `t` may be COMPOUND (`f c`, `α ∗ β`), not just a variable: the check happens at every node, so an
  // occurrence can be abstracted whole, or left alone and its innards searched instead. Bound variables are
  // compared by de Bruijn depth in exprEq, so a t mentioning a context variable never captures a bound one.
  function enumAbstract(e, t, xv) {
    var here = exprEq(e, t) ? [xv] : [];
    if (e.tag === 'var') return here.concat([e]);
    if (e.tag === 'binder') return here.concat(enumAbstract(e.body, t, xv).map(function (b) { return { tag: 'binder', q: e.q, v: e.v, body: b, sort: PROP }; }));
    return here.concat(cartesian(e.args.map(function (a) { return enumAbstract(a, t, xv); })).map(function (args) { return appE(e.sym, args); }));
  }
  // a bound name fresh for BOTH the formula and the (possibly compound) term being abstracted
  function freshBoundNameFor(e, t) { var used = varsInto(e, {}); varsInto(t, used); if (!used['x']) return 'x'; for (var i = 0; ; i++) if (!used['x' + i]) return 'x' + i; }
  function dedupExprs(list) { var out = []; list.forEach(function (e) { if (!out.some(function (o) { return exprEq(o, e); })) out.push(e); }); return out; }
  function freshBoundName(e, avoid) { var used = varsInto(e, {}); used[avoid] = 1; if (!used['x']) return 'x'; for (var i = 0; ; i++) if (!used['x' + i]) return 'x' + i; }
  // ∃-introduction: a proof of P(t) and a witness term t yield the finitely-many ∃ x, (P with some t's abstracted).
  // All share the Lean anonymous-constructor witness `⟨t, h⟩`; the `have`-type ascription disambiguates which body —
  // so the STEP records the concrete result (no lambda is ever shown to, or built by, the player).
  defRecipe({ id: 'Exists.intro', leanName: 'Exists.intro', chapter: 22, arity: 2, rule: 'a proof of P(t), and a term t ⊢ ∃ x, P(x)',
    ruleWords: 'a proof of P(t), and a term t — you get: P(x) holds for some x', informal: 'existential introduction',
    match: function (inp) {
      if (inp.length !== 2 || !inp[0].proof || inp[1].proof) return [];
      var proof = inp[0], t = inp[1].type;
      if (sortOf(t) === PROP) return [];   // the witness is a TERM — a context variable or one built from operations
      var xname = freshBoundNameFor(proof.type, t), xv = varE(xname, sortOf(t));
      return dedupExprs(enumAbstract(proof.type, t, xv)).map(function (body) {
        return { output: EXISTS({ name: xname, sort: t.sort }, body), lean: '⟨' + render(t, { lean: true }) + ', ' + proof.name + '⟩' };
      });
    }
  });
  // ---------- Chapter 18: equality ----------
  // Only two primitives are needed. Everything else — symmetry, transitivity, congruence — is an EXERCISE
  // the player derives from them, which is the point of the chapter.
  defRecipe({ id: 'Eq.refl', leanName: 'Eq.refl', chapter: 24, arity: 1, rule: 'a term t ⊢ t = t', informal: 'everything equals itself',
    match: function (inp) {
      if (inp.length !== 1 || inp[0].proof || sortOf(inp[0].type) === PROP) return [];
      return [{ output: appE('EQ', [inp[0].type, inp[0].type]), lean: 'Eq.refl ' + render(inp[0].type, { lean: true, arg: true }) }];
    }
  });
  // Rewriting: from a proof of P and an equation a = b, replace SOME occurrences of a by b. Which ones is a
  // genuine choice, so this reuses `enumAbstract` — the same finite-choice machinery as ∃-introduction. The
  // abstracted body IS the Lean motive, which is why `Eq.subst` can pin down exactly the chosen occurrences
  // (plain `rw` would rewrite all of them).
  defRecipe({ id: 'rw', leanName: 'Eq.subst', chapter: 24, arity: 2, rule: 'a proof of P, and a proof of a = b ⊢ P with some a’s rewritten to b', informal: 'rewrite along an equation',
    match: function (inp) {
      if (inp.length !== 2 || !inp[0].proof || !inp[1].proof) return [];
      var h = inp[0], eq = inp[1].type;
      if (!(eq.tag === 'app' && eq.sym === 'EQ')) return [];
      var a = eq.args[0], b = eq.args[1];
      var xname = freshBoundNameFor(h.type, a), xv = varE(xname, sortOf(a));
      var out = [];
      dedupExprs(enumAbstract(h.type, a, xv)).forEach(function (psi) {
        if (exprEq(psi, h.type)) return;                   // abstracting nothing rewrites nothing
        out.push({
          output: substE(psi, xname, a.sort, b),
          lean: 'Eq.subst (motive := fun ' + xname + ' => ' + render(psi, { lean: true }) + ') ' + inp[1].name + ' ' + h.name
        });
      });
      return out;
    }
  });
  // Chapter 20: INDUCTION. The motive is not searched for — it is READ OFF the step's antecedent, which is
  // the only thing it could be, and then the two soundness conditions are checked outright:
  //   step : ∀ n, (A(n) → B(n))   with   B = A[n := succ n]   and   base = A[n := 0].
  // Both checks are first-order (substE + exprEq), so no higher-order unification is involved; this sits
  // beside `rw` and `Exists.intro`, which likewise sidestep it by structure rather than by search.
  defRecipe({ id: 'induction', leanName: 'induction', chapter: 26, arity: 2,
    rule: 'a proof of P(0), and a proof of ∀ n, (P(n) → P(succ n)) ⊢ ∀ n, P(n)',
    ruleWords: 'a proof of P(0), and a proof that P(n) implies P(succ n) for every n — you get: P(n) holds for all n', informal: 'proof by induction',
    match: function (inp) {
      if (inp.length !== 2 || !inp[0].proof || !inp[1].proof) return [];
      var base = inp[0].type, step = inp[1].type;
      if (step.tag !== 'binder' || step.q !== 'forall' || step.v.sort !== NAT) return [];
      var body = step.body;
      if (!(body.tag === 'app' && body.sym === 'IMPLIES')) return [];
      var A = body.args[0], B = body.args[1], nm = step.v.name;
      if (!exprEq(B, substE(A, nm, NAT, appE('succ', [varE(nm, NAT)])))) return [];   // the step really steps
      if (!exprEq(base, substE(A, nm, NAT, appE('nzero', [])))) return [];            // the base really starts
      return [{ output: FORALL({ name: nm, sort: NAT }, A), lean: "induction' " + inp[0].name + ' ' + inp[1].name }];
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
  // ---------- sort polymorphism ----------
  // Every exercise built before Chapter 16 lives over Ω, and its minted lemma is pure first-order logic, so
  // it must apply at ANY sort — M, Set, a group's carrier. That is the ONLY polymorphism needed: a lemma
  // about Nat never has to generalise. So when matching, Ω in a TEMPLATE is a sort metavariable while every
  // other sort is rigid, and the binding is made ONCE PER APPLICATION (stored under a reserved key), which
  // is what stops a single lemma straddling two sorts. Lean needs nothing: `variable {Ω}` already makes the
  // emitted theorem polymorphic, so applying it elsewhere is ordinary instantiation.
  var SORTVAR = '@sort';
  function sortMatch(tsort, esort, subst) {
    if (tsort !== OMEGA) return tsort === esort;      // a concrete sort matches only itself
    if (esort === PROP) return false;                 // Ω ranges over DATA sorts
    if (subst[SORTVAR]) return subst[SORTVAR] === esort;
    subst[SORTVAR] = esort; return true;
  }
  // rewrite Ω to whatever the match settled on, so the crafted statement is stated at the target sort
  function applySortSubst(e, to) {
    if (!to || to === OMEGA) return e;
    if (e.tag === 'var') return e.sort === OMEGA ? varE(e.name, to) : e;
    if (e.tag === 'binder') return { tag: 'binder', q: e.q, v: { name: e.v.name, sort: e.v.sort === OMEGA ? to : e.v.sort }, body: applySortSubst(e.body, to), sort: PROP };
    return appE(e.sym, e.args.map(function (a) { return applySortSubst(a, to); }));
  }
  function unifyHO(tmpl, expr, subst, rigid) {
    if (tmpl.tag === 'var') {
      if (rigid[tmpl.name]) return expr.tag === 'var' && expr.name === tmpl.name && sortMatch(tmpl.sort, expr.sort, subst);   // a bound var matches only itself
      if (subst[tmpl.name]) return exprEq(subst[tmpl.name], expr);                                             // first-order metavar: consistency
      if (rigidVarsIn(expr, rigid, []).length) return false;                                                   // a metavar may not capture a bound variable
      if (!sortMatch(tmpl.sort, sortOf(expr), subst)) return false;
      subst[tmpl.name] = expr; return true;
    }
    if (tmpl.tag === 'binder') {
      if (expr.tag !== 'binder' || tmpl.q !== expr.q || !sortMatch(tmpl.v.sort, expr.v.sort, subst)) return false;
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
    // the rule summary is built once, at unlock time, so both wordings are built here: transliterating
    // the symbolic one would word the statements but leave their bracketing to Lean's precedences
    var inputs = function (opts) {
      return consts.map(function (x) { return 'term ' + x.name; })
        .concat(givens.map(function (t) { return render(t, opts); }))
        .concat(freeVars.map(function (v) { return (v.sort === PROP ? 'formula ' : 'term ') + v.name; }))
        .join(', ');
    };
    var rule = inputs() + ' ⊢ ' + render(concl);
    var ruleWords = (inputs({ words: true }) + ' — you get ' + render(concl, { words: true })).replace(/^\s*— /, '');
    return {
      id: name, leanName: name, chapter: ex.chapter, arity: arity, minted: true, rule: rule, ruleWords: ruleWords, informal: 'the lemma ' + name,
      match: function (inp) {
        if (inp.length !== arity) return [];
        var subst = {};
        for (var i = 0; i < c; i++) { var ti = inp[i]; if (ti.proof || !sortMatch(consts[i].sort, sortOf(ti.type), subst)) return []; subst[consts[i].name] = ti.type; }
        for (var i = 0; i < g; i++) { var pi = inp[c + i]; if (!pi.proof || !unifyHO(givens[i], pi.type, subst, {})) return []; }
        for (var j = 0; j < f; j++) { var xi = inp[c + g + j]; if (xi.proof || !sortMatch(freeVars[j].sort, sortOf(xi.type), subst)) return []; if (subst[freeVars[j].name] && !exprEq(subst[freeVars[j].name], xi.type)) return []; subst[freeVars[j].name] = xi.type; }
        for (var p in predMetas) if (!subst[p]) return [];           // DETERMINACY GUARD: every predicate metavar must be pinned down
        // A lemma proved inside a theory was emitted with `include <ops and axioms> in`, which makes those
        // section variables EXPLICIT parameters of the theorem. So a use site must pass them — by name,
        // since the using proof is in the same section and has the very same variables in scope.
        var theoryArgs = [];
        (ex.sorts || []).forEach(function (sn) {
          if ((SORTS[sn] || {}).kind === 'concrete') return;   // imported names need no explicit passing
          ((SORTS[sn] || {}).ops || []).forEach(function (op) { theoryArgs.push(op.lean); });
          ((SORTS[sn] || {}).axioms || []).forEach(function (a) { theoryArgs.push(a.name); });
        });
        var explicit = theoryArgs.concat(inp.slice(0, c).map(function (i) { return render(i.type, { lean: true, arg: true }); })).concat(inp.slice(c, c + g).map(function (i) { return i.name; }));
        return [{ output: applySortSubst(applySubstHO(concl, subst), subst[SORTVAR]), lean: name + (explicit.length ? ' ' + explicit.join(' ') : '') }];
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

  // ---------- Chapter 4: sub-environments (deduction theorem) · Chapter 11: ∀ (variable introduction) ----------
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
  // Chapter 9: negation introduction (reductio ad absurdum). Inside a sub-env assuming A, a contradiction
  // (a proof of C and a proof of ¬C) closes it as ¬A. Emitted as `have h : ¬A := by intro hA; …; exact absurd hC hnC`
  // (the reductio's `False` goal is discharged by `absurd`, so `False` never surfaces — deferred to Chapter 10).
  function isFalseT(t) { return t.tag === 'app' && t.sym === 'FALSE'; }
  function notIntroOption(env, names) {
    if (!env.parent || env.assumption.kind !== 'hyp') return null;   // reductio negates a hypothesis, not a variable
    var bs = (names || []).map(function (n) { return byName(env, n); }).filter(Boolean);
    for (var k = 0; k < bs.length; k++) if (isFalseT(bs[k].type)) return { fals: bs[k].name, output: NOT(env.assumption.type) };   // a direct proof of False (Chapter 10)
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
  // ---------- Chapter 13: ∃ elimination (`obtain`) ----------
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

  // ---------- Chapter 14: pick an arbitrary inhabitant of a (nonempty) sort ----------
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
    var cs = (ex.consts || []).map(function (c) { return '(' + c.name + ' : ' + sortName(c.sort, true) + ')'; }).join(' ');   // term constants in context
    var gs = ex.givens.map(function (g) { return '(' + g.name + ' : ' + render(g.type, o) + ')'; }).join(' ');
    var params = [cs, gs].filter(Boolean).join(' ');
    var head = ex.kind === 'lemma' ? ('theorem ' + ex.leanName) : 'example';   // `theorem` is core Lean; `lemma` needs Mathlib
    // Lean only auto-includes a section `variable` that the STATEMENT mentions. A theory's operations and
    // axioms are typically used only inside the proof body, so they must be pulled in explicitly — without
    // this the body fails with "unknown identifier mul_one".
    var inc = [];
    (ex.sorts || []).forEach(function (sn) {
      if ((SORTS[sn] || {}).kind === 'concrete') return;   // module contents are imported, not section variables
      ((SORTS[sn] || {}).ops || []).forEach(function (op) { inc.push(op.lean); });
      ((SORTS[sn] || {}).axioms || []).forEach(function (a) { inc.push(a.name); });
    });
    var incLine = inc.length ? 'include ' + inc.join(' ') + ' in\n' : '';
    return incLine + head + (params ? ' ' + params : '') + ' : ' + render(ex.goal, o) + ' := by';
  }
  function goalNameIn(env) {
    for (var i = env.bindings.length - 1; i >= 0; i--) if (exprEq(env.bindings[i].type, env.goal)) return env.bindings[i].name;
    return null;
  }
  // declares the sorts, propositional atoms and predicates so the emitted proof is a standalone, buildable
  // Lean snippet (Init is imported automatically in Lean 4, so no `import` line is needed)
  // A concrete sort lives in its own Lean module: the proof `import`s it rather than declaring variables.
  // Imports must head the FILE, so these are returned separately for the caller to hoist.
  function leanImports(ex) {
    var out = [];
    (ex.sorts || []).forEach(function (sn) {
      var d = SORTS[sn] || {};
      if (d.module) out.push({ imp: 'import ' + d.module, open: d.open ? 'open ' + d.open : null });
    });
    return out;
  }
  // Everything a proof needs ahead of itself in order to compile ON ITS OWN. Lean 4 imports `Init` by
  // itself, and every atom, predicate, abstract sort, operation and axiom is emitted as a `variable`
  // declaration by `leanPreamble` below -- so for all but the concrete sorts this is empty, and the
  // emitted proof needs no import at all. A concrete sort is the exception: its definitions go in whole,
  // followed by the `open` the imported form would have needed anyway.
  function leanPrelude(ex) {
    var out = [];
    (ex.sorts || []).forEach(function (sn) {
      var d = SORTS[sn] || {};
      if (!d.prelude) return;
      out = out.concat(d.prelude, ['']);
      if (d.open) out.push('open ' + d.open, '');
    });
    return out.join('\n');
  }
  function leanPreamble(ex) {
    var lines = [];
    (ex.sorts || []).forEach(function (s) {
      if ((SORTS[s] || {}).kind === 'concrete') return;   // it is a real type in its own module, not a variable
      lines.push('variable {' + s + '}' + ((ex.nonempty || []).indexOf(s) >= 0 ? ' [Nonempty ' + s + ']' : ''));
      // an abstract sort also declares the operations it owns, so the proof stands alone with no `axiom`
      ((SORTS[s] || {}).ops || []).forEach(function (op) { lines.push('variable (' + op.lean + ' : ' + op.type.join(' → ') + ')'); });
      ((SORTS[s] || {}).axioms || []).forEach(function (a) { lines.push('variable (' + a.name + ' : ' + render(a.type, { lean: true }) + ')'); });
    });
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

  // How long a proof is, in MOVES -- the number the map compares against the par for the level. One unit
  // per thing the player did: a craft, an `obtain` and a `pick` are one move each, and so is a discharge,
  // but the assumption (or arbitrary variable) it closes over was a move of its own -- the Assume click --
  // so every level a discharge closes counts one more, with the work done inside it counted recursively.
  // Any OPEN sub-proof counts too, so the live tally rises the moment an assumption is made; abandoning
  // one takes its moves back off, which is right -- an abandoned sub-proof leaves nothing in the proof.
  function proofLength(cur) {
    function len(steps) {
      var n = 0;
      steps.forEach(function (s) {
        n += 1;
        if (s.kind === 'discharge') s.levels.forEach(function (lv) { n += 1 + len(lv.steps); });
      });
      return n;
    }
    var chain = [], e = cur; while (e.parent) { chain.unshift(e); e = e.parent; }
    var n = len(e.steps);
    chain.forEach(function (c) { n += 1 + len(c.steps); });
    return n;
  }

  // informal proof in the style of the original QED game (statements, not hypothesis labels)
  // How an assumption or an arbitrary variable is announced. Shared, because the live view below has
  // to word an OPEN sub-proof exactly as the finished one will be worded once it is discharged.
  function informalBinder(b, opts) {
    return b.kind === 'var' ? 'an arbitrary ' + varPhrase(b.name, b.sort, opts) : render(b.type, opts);
  }
  function informalSteps(steps, opts) {
    var R = function (e) { return render(e, opts); }, out = [];
    steps.forEach(function (s) {
      if (s.kind === 'discharge') {
        out.push('Introduce ' + s.levels.map(function (l) { return informalBinder(l.binder, opts); }).join(', then ') + ':');
        s.levels.forEach(function (l) { informalSteps(l.steps, opts).forEach(function (x) { out.push('  ' + x); }); });
        out.push(s.contra ? 'This is a contradiction, so we conclude ' + R(s.type) + '.'
                          : 'Discharging, we obtain ' + R(s.type) + '.');
      } else if (s.kind === 'obtain') {
        out.push('Since ' + R(s.existType) + ', fix ' + varPhrase(s.varName, s.sort, opts) + ' with ' + R(s.witness) + '.');
      } else if (s.kind === 'pick') {
        out.push('Pick ' + varPhrase(s.varName, s.sort, opts) + ' arbitrarily (the sort is nonempty).');
      } else {
        var rec = RECIPES[s.recipe];
        out.push('From ' + (s.froms || []).map(R).join(', ') + ' we deduce ' + R(s.type) + '  (' + (rec && rec.informal || s.recipe) + ').');
      }
    });
    return out;
  }
  function informalHeader(ex, opts) {
    var R = function (e) { return render(e, opts); }, L = [];
    if (ex.givens.length) L.push('We are given ' + ex.givens.map(function (g) { return R(g.type); }).join(', ') + '.');
    L.push('We wish to prove ' + R(ex.goal) + '.');
    return L;
  }
  function emitInformal(ex, env, opts) {   // env = root
    var L = informalHeader(ex, opts);
    informalSteps(env.steps, opts).forEach(function (x) { L.push(x); });
    if (env.bindings.some(function (b) { return exprEq(b.type, env.goal); })) L.push('This is what we wished to prove.  ∎');
    return L.join('\n');
  }
  // Live informal view, the counterpart of emitLive: the player may be working inside one or more open
  // sub-proofs, under an assumption or under an arbitrary variable. A `discharge` STEP is only written
  // into the parent once the sub-proof closes, so reading the root alone -- which is what this used to
  // do -- showed nothing at all of the work in progress, while the Lean view showed it under a `sorry`.
  // The open levels are therefore narrated here, in the same words the finished discharge will use,
  // and closed with a line saying what is still owed; it plays the part Lean's `sorry` plays, and the
  // pending conclusion is spelt with a `…` where Lean puts its `?a` metavariable -- which also saves
  // the line from having to word "under this assumption" and "for this arbitrary variable" differently.
  function emitInformalLive(ex, cur, opts) {
    var chain = [], e = cur; while (e.parent) { chain.unshift(e); e = e.parent; }
    var root = e;
    if (!chain.length) return emitInformal(ex, root, opts);
    var L = informalHeader(ex, opts);
    informalSteps(root.steps, opts).forEach(function (x) { L.push(x); });
    L.push('Introduce ' + chain.map(function (c) { return informalBinder(c.assumption, opts); }).join(', then ') + ':');
    chain.forEach(function (c) { informalSteps(c.steps, opts).forEach(function (x) { L.push('  ' + x); }); });
    var pending = binderChain(chain.map(function (c) { return c.assumption; }), varE('…'));
    L.push('  (Not discharged yet: discharging will conclude ' + render(pending, opts) + '.)');
    if (root.bindings.some(function (b) { return exprEq(b.type, root.goal); })) L.push('This is what we wished to prove.  ∎');
    return L.join('\n');
  }

  // ---------- exercises + progression DAG ----------
  // Levels come in two kinds.
  //
  //   A TUTORIAL introduces exactly one new game mechanic; `needs` names the capability it teaches
  //   (see RECIPE_CAP below), and a non-empty `needs` is what MAKES a level a tutorial. The tutorials
  //   form a single LINEAR chain: each one's only prerequisite is the one before it. So a player who
  //   wants mechanics and nothing else can walk the chain and skip every exercise.
  //
  //   An EXERCISE (`needs: []`) introduces no mechanic; it is practice. It opens once every tutorial
  //   for a mechanic its proof uses, and every earlier lemma its proof consumes, have been SOLVED.
  //
  // `prereqs` is the single source of truth and is an AND-gate: all of them must be solved. That is
  // what makes the graph a web rather than a chain — most of a chapter's exercises hang directly off
  // its tutorial and can be done in any order (or skipped), while the handful that are genuinely
  // corollaries of earlier results wait for them. `unlocks` is computed as its inverse, for the map.
  //
  // The graph is DERIVED, not hand-written: `scratch/prereqs.js` instruments the scripted solutions in
  // `scratch/lean/check_emitted.js` — the ones the Lean compile-check verifies — and reads off which
  // mechanics and which earlier lemmas each proof actually reaches for. `node scratch/prereqs.js
  // --check` re-derives it and diffs against what is written here; `--verify` replays every solution as
  // the player who has solved exactly that level's prerequisites, proving each level is solvable the
  // moment it opens. Change an exercise or its solution and re-run both.
  //
  // Capabilities are cumulative and keyed to ACCESSIBILITY, not solving: the union of `needs` over all
  // accessible levels is the active capability set, so a tutorial's mechanic is in hand as soon as the
  // tutorial itself is reachable (you need it to solve that tutorial), and early levels show a
  // correspondingly simplified interface.
  var A = varE('A'), B = varE('B'), C = varE('C'), D = varE('D');
  var X = varE('X', OMEGA), Y = varE('Y', OMEGA), alpha = varE('α', OMEGA), xL = varE('x', OMEGA);   // term variables of sort Ω (Chapter 11+)
  var beta = varE('β', OMEGA), gamma = varE('γ', OMEGA);      // further Ω constants, for the equality chapter
  // ---------- Chapter 18, second half: naive set theory ----------
  // ∪ and ∩ are not primitive: each is pinned down by WHEN SOMETHING BELONGS TO IT, and sets are equal when
  // they have the same members. So every set law is the corresponding PROPOSITIONAL law transported through
  // membership — commutativity of ∪ is Or.symm', of ∩ is And.symm', distributivity is and_or_left'. The
  // chapter is where Chapters 2 and 6 come back and pay.
  var sv2 = function (n) { return varE(n, SET); };
  var smem = function (x, a) { return appE('MEM', [x, a]); };
  var sunion = function (a, b) { return appE('union', [a, b]); }, sinter = function (a, b) { return appE('inter', [a, b]); };
  SORTS[SET].ops = SORTS[SET].ops.concat([
    { sym: 'union', lean: 'union', type: [SET, SET, SET] },
    { sym: 'inter', lean: 'inter', type: [SET, SET, SET] }
  ]);
  SORTS[SET].axioms = [
    { name: 'mem_union', type: faS('x', SET, faS('a', SET, faS('b', SET,
        IFF(smem(sv2('x'), sunion(sv2('a'), sv2('b'))), OR(smem(sv2('x'), sv2('a')), smem(sv2('x'), sv2('b'))))))) },
    { name: 'mem_inter', type: faS('x', SET, faS('a', SET, faS('b', SET,
        IFF(smem(sv2('x'), sinter(sv2('a'), sv2('b'))), AND(smem(sv2('x'), sv2('a')), smem(sv2('x'), sv2('b'))))))) },
    { name: 'ext', type: faS('a', SET, faS('b', SET,
        IMPLIES(faS('x', SET, IFF(smem(sv2('x'), sv2('a')), smem(sv2('x'), sv2('b')))), appE('EQ', [sv2('a'), sv2('b')])))) }
  ];

  // ---------- Chapter 20: Peano arithmetic ----------
  // A CONCRETE sort: `Nat` is modelled on core Lean's `Nat` in its own module, so its "axioms" are proved
  // theorems there and the theory is consistent by construction. The proof reaches them by `import`.
  var nv = function (n) { return varE(n, NAT); };
  var n0 = appE('nzero', []), nsucc = function (a) { return appE('succ', [a]); }, nadd = function (a, b) { return appE('add', [a, b]); };
  var nle = function (a, b) { return appE('le', [a, b]); };
  defSort({ name: NAT, kind: 'concrete', lean: "Nat'", module: 'Grimoire.Nat', open: "Grimoire Grimoire.Nat'",
    // The module's SOURCE, carried here rather than only in a file beside the compile-check. An exported
    // proof has to stand on its own: whoever receives it has no `Grimoire.Nat` to import, so `leanPrelude`
    // writes these lines into the file in place of the import. `scratch/lean/check_emitted.js` writes the
    // module out of them before it compiles, so there is one copy of this Lean and it cannot drift.
    prelude: [
      "/-",
      "  Grimoire's `Nat` sort: a CONCRETE sort, modelled on core Lean's `Nat`.",
      "",
      "  Because it is modelled rather than axiomatised, every \"axiom\" of the Grimoire theory is a proved",
      "  theorem here, so the theory is consistent by construction and the compile-check keeps its force.",
      "  No Mathlib, no `Add`/`LE` typeclass, no `axiom` command.",
      "-/",
      "namespace Grimoire",
      "",
      "/-- `def`, not `abbrev`: semireducible, so core's `Add`/`LE`/`OfNat` instances do not apply and our own",
      "    notation is unambiguous. -/",
      "def Nat' : Type := Nat",
      "",
      "/-- Required before any Ω-lemma carrying `[Nonempty Ω]` can be used at this sort. -/",
      "instance : Nonempty Nat' := ⟨Nat.zero⟩",
      "",
      "namespace Nat'",
      "",
      "def zero : Nat' := Nat.zero",
      "def succ (a : Nat') : Nat' := Nat.succ a",
      "def add (a b : Nat') : Nat' := Nat.add a b",
      "/-- `a ≤ b` is DEFINED as \"b is a plus something\". That is what lets the order facts be derived in-game",
      "    from the addition ladder — `le_refl` from `add_zero`, `le_trans` from `add_assoc` — rather than being",
      "    handed over as further axioms. -/",
      "def le (a b : Nat') : Prop := ∃ k : Nat', add a k = b",
      "",
      "scoped infixl:65 \" + \" => Grimoire.Nat'.add",
      "scoped infix:50 \" ≤ \" => Grimoire.Nat'.le",
      "",
      "/-- The two defining equations of addition. Both hold definitionally on the model. -/",
      "theorem add_zero (a : Nat') : add a zero = a := rfl",
      "theorem add_succ (a b : Nat') : add a (succ b) = succ (add a b) := rfl",
      "",
      "/-- Induction, packaged so a Grimoire proof can cite it by name and let Lean infer the motive from the",
      "    `have` ascription. Doing it here rather than emitting `Nat.rec` directly also hides the fact that",
      "    `Nat'` is only definitionally a `Nat`. -/",
      "theorem induction' {motive : Nat' → Prop} (base : motive zero)",
      "    (step : ∀ n, motive n → motive (succ n)) : ∀ n, motive n :=",
      "  fun n => Nat.rec base step n",
      "",
      "/-- Unfolding `≤`. The player uses this with Iff.mp / Iff.mpr, so `le_refl` and `le_trans` become",
      "    exercises rather than axioms. -/",
      "theorem le_def (a b : Nat') : le a b ↔ ∃ k : Nat', add a k = b := Iff.rfl",
      "",
      "/-- The one order fact that is NOT reachable from the addition ladder alone (it needs the successor to be",
      "    injective and non-zero), so it stays a theorem of the module. -/",
      "theorem not_succ_le (a : Nat') : ¬ le (succ a) a := by",
      "  intro h",
      "  obtain ⟨k, hk⟩ := h",
      "  exact absurd (Nat.le.intro hk) (Nat.not_succ_le_self a)",
      "",
      "end Nat'",
      "end Grimoire"
    ],

    ops: [{ sym: 'nzero', lean: 'zero', type: [NAT] }, { sym: 'succ', lean: 'succ', type: [NAT, NAT] },
          { sym: 'add', lean: 'add', type: [NAT, NAT, NAT] }, { sym: 'le', lean: 'le', type: [NAT, NAT, PROP] }],
    axioms: [
      { name: 'add_zero', type: faS('a', NAT, appE('EQ', [nadd(nv('a'), n0), nv('a')])) },
      { name: 'add_succ', type: faS('a', NAT, faS('b', NAT, appE('EQ', [nadd(nv('a'), nsucc(nv('b'))), nsucc(nadd(nv('a'), nv('b')))]))) },
      { name: 'le_def', type: faS('a', NAT, faS('b', NAT, IFF(nle(nv('a'), nv('b')), eeS('k', NAT, appE('EQ', [nadd(nv('a'), nv('k')), nv('b')]))))) },
      { name: 'not_succ_le', type: faS('a', NAT, NOT(nle(nsucc(nv('a')), nv('a')))) }
    ] });

  // ---------- Chapter 19: the theory of groups ----------
  // An ABSTRACT theory: carrier G with 1, ·, inv, and five axioms. Parameterised rather than axiomatised —
  // every one of these becomes a `variable` hypothesis, so the emitted theorem holds of ANY such structure
  // and the module is consistent by construction. Both identities and both inverses are included (rather
  // than the minimal left-handed presentation) so the chapter's exercises are the interesting CONSEQUENCES.
  var gv = function (n) { return varE(n, GRP); };
  var g1 = appE('one', []), gmul = function (a, b) { return appE('mul', [a, b]); }, ginv = function (a) { return appE('inv', [a]); };
  defSort({ name: GRP, kind: 'abstract',
    ops: [{ sym: 'one', lean: 'one', type: [GRP] }, { sym: 'mul', lean: 'mul', type: [GRP, GRP, GRP] }, { sym: 'inv', lean: 'inv', type: [GRP, GRP] }],
    axioms: [
      { name: 'one_mul', type: faS('x', GRP, appE('EQ', [gmul(g1, gv('x')), gv('x')])) },
      { name: 'mul_one', type: faS('x', GRP, appE('EQ', [gmul(gv('x'), g1), gv('x')])) },
      { name: 'mul_assoc', type: faS('x', GRP, faS('y', GRP, faS('z', GRP, appE('EQ', [gmul(gmul(gv('x'), gv('y')), gv('z')), gmul(gv('x'), gmul(gv('y'), gv('z')))])))) },
      { name: 'inv_mul', type: faS('x', GRP, appE('EQ', [gmul(ginv(gv('x')), gv('x')), g1])) },
      { name: 'mul_inv', type: faS('x', GRP, appE('EQ', [gmul(gv('x'), ginv(gv('x'))), g1])) }
    ] });
  function eq(a, b) { return appE('EQ', [a, b]); }
  var cO = function (n) { return { name: n, sort: OMEGA }; };
  function fa(name, body) { return FORALL({ name: name, sort: OMEGA }, body); }
  function ee(name, body) { return EXISTS({ name: name, sort: OMEGA }, body); }
  function faS(name, sort, body) { return FORALL({ name: name, sort: sort }, body); }
  function eeS(name, sort, body) { return EXISTS({ name: name, sort: sort }, body); }
  function mem(a, b) { return appE('MEM', [a, b]); }
  var setV = function (n) { return varE(n, SET); };
  var EXERCISES = [
    // ---------- Chapter 1: Conjunction introduction ----------
    { id: '1.1', kind: 'example', chapter: 1, givens: [binding('hA', A), binding('hB', B), binding('hC', C)], goal: AND(AND(A, B), C), prereqs: [], qed: '1.1', hint: 'Select the potions hA and hB, then brew And.intro to get A ∧ B. Select that and hC, brew it again, and the goal is yours.', needs: ['and.intro'] },
    { id: '1.2', kind: 'lemma', leanName: 'And.idem', chapter: 1, givens: [binding('hA', A)], goal: AND(A, A), prereqs: ['1.1'], qed: '1.2', hint: 'And.intro needs two ingredients, but hA is the only potion here — so select it twice: shift-tap it for a second copy, or switch on Repeat-select and tap it again.', needs: [] },

    // ---------- Chapter 2: Conjunction elimination ----------
    { id: '2.1', kind: 'lemma', leanName: "And.comm'", chapter: 2, givens: [binding('hAB', AND(A, B))], goal: AND(B, A), prereqs: ['1.1'], qed: '2.1', hint: 'Take the conjunction apart first: select hAB and brew And.left, then select hAB again and brew And.right. Now select the two halves — in the order the goal wants them — and brew And.intro.', needs: ['and.elim'] },
    { id: '2.2', kind: 'lemma', leanName: 'And.assoc_left', chapter: 2, givens: [binding('hABC', AND(AND(A, B), C))], goal: AND(A, AND(B, C)), prereqs: ['2.1'], qed: '2.2(a)', hint: 'Take hABC all the way down to A, B and C — And.left and And.right, then the same pair again on the half that is still a conjunction — and build it back up with the brackets the other way round.', needs: [] },
    { id: '2.3', kind: 'lemma', leanName: 'And.assoc_right', chapter: 2, givens: [binding('hABC', AND(A, AND(B, C)))], goal: AND(AND(A, B), C), prereqs: ['2.2'], qed: '2.2(b)', hint: "And.comm' and And.assoc_left are recipes by now, and alternating them walks the brackets across without an atom ever being touched: five single-ingredient brews. Breaking hABC down to A, B and C by hand and pairing them the other way round works too, and costs one move more.", needs: [] },

    // ---------- Chapter 3: Disjunction, and building formulas ----------
    { id: '3.1', kind: 'example', chapter: 3, givens: [binding('hA', A)], formulas: [B, C], goal: OR(C, OR(A, B)), prereqs: ['2.1'], qed: '3.1(a)', hint: 'A disjunction needs only one side proved; the other may be a bare formula. Select hA and the formula B and brew Or.inl for A ∨ B. Then select that together with the formula C and brew Or.inr.', needs: ['or', 'formula'] },
    { id: '3.2', kind: 'lemma', leanName: 'Or.idem', chapter: 3, givens: [binding('hA', A)], formulas: [A], goal: OR(A, A), prereqs: ['3.1'], qed: '3.1(b)', hint: 'Both sides of the goal are the same formula, so one proof of A is enough — select hA together with the formula A and brew Or.inl.', needs: [] },

    // ---------- Chapter 4: Assumptions and the deduction theorem ----------
    // 4.1 (⊢ A → A) is the SIMPLEST assume-then-discharge exercise — bare intro/discharge with nothing
    // inside — so it introduces the deduction theorem (and the `assume` capability) even though its chapter
    // number is higher. 4.2 and 4.3 then hang off it as optional side-branches: same shape, but 4.2 crafts
    // an ∧ before discharging and 4.3 uses a bulkier formula. Map rows come from DAG depth, not chapter,
    // so this reads correctly on the tree.
    { id: '4.1', kind: 'lemma', leanName: 'Impl.idem', chapter: 4, givens: [], formulas: [A], goal: IMPLIES(A, A), prereqs: ['3.1'], qed: '6.1(a)', hint: 'Nothing is given, so assume something. Right-click the formula A and choose Assume — a sub-proof opens holding hA : A. What you need is already inside it, so right-click hA and take the discharge it offers; the sub-proof closes as A → A.', needs: ['assume'] },
    { id: '4.2', kind: 'example', chapter: 4, givens: [], formulas: [A], goal: IMPLIES(A, AND(A, A)), prereqs: ['4.1'], qed: '4.1', qedNote: 'stated there with an assumption environment', hint: 'Assume A, and inside the sub-proof you have hA twice over. Brew the conjunction there, then discharge — the arrow appears when the sub-proof closes, not before.', needs: [] },
    { id: '4.3', kind: 'example', chapter: 4, givens: [], formulas: [A, B, C], goal: IMPLIES(OR(AND(A, B), C), OR(AND(A, B), C)), prereqs: ['4.1'], qed: '5.1', qedNote: 'stated there with an assumption environment', hint: 'The assumption you need is the whole left-hand side of the arrow, bracket for bracket: assume it, and it is already what you want, so discharge at once. There is a one-move way as well, because Impl.idem says exactly this at any formula at all — even one this big.', needs: [] },
    // 4.4 (QED 5.2): two assumptions deep, and the inner goal is the inner assumption — the first time a
    // sub-proof is opened inside a sub-proof. An optional leaf, like 4.3 itself.
    { id: '4.4', kind: 'example', chapter: 4, givens: [], formulas: [A, B], goal: IMPLIES(B, IMPLIES(A, A)), prereqs: ['4.1'], qed: '5.2', qedNote: 'stated there with an assumption environment', hint: 'Two arrows, two assumptions: assume B, then assume A inside it. A is then in hand, and one discharge through both levels closes both arrows.', needs: [] },
    // 4.5 is an OPTIONAL side-branch; the main path runs 4.1 → 4.7.
    { id: '4.5', kind: 'example', chapter: 4, givens: [], formulas: [A, B], goal: IMPLIES(AND(A, OR(A, B)), A), prereqs: ['4.1'], qed: '6.1(b)', hint: 'Assume the whole conjunction, and the half you want falls out with And.left. Then discharge.', needs: [] },
    // 4.6 (QED 6.2): the deduction theorem applied twice over — a statement you already hold can be
    // discharged through BOTH assumptions at once, giving A → B → C from C alone.
    { id: '4.6', kind: 'lemma', leanName: "imp_const'", chapter: 4, givens: [binding('hC', C)], formulas: [A, B], goal: IMPLIES(A, IMPLIES(B, C)), prereqs: ['4.1'], qed: '6.2', hint: 'Nothing inside either sub-proof is used at all — hC was given before you started. Assume A, assume B, and discharge hC through both levels.', needs: [] },
    { id: '4.7', kind: 'example', chapter: 4, givens: [], formulas: [A, B], goal: IMPLIES(A, IMPLIES(B, A)), prereqs: ['4.1'], qed: '7.1', hint: 'Assume A, then assume B inside it: A is still in hand in the inner sub-proof, and discharging it through both levels is the whole proof.', needs: [] },
    // 4.8 roots an OPTIONAL branch (4.8 → 5.6 → 5.7); the main Chapter-5 spine is 5.2 → 5.3 → 5.4 → 5.9.
    { id: '4.8', kind: 'lemma', leanName: "And.symm'", chapter: 4, givens: [], formulas: [A, B], goal: IMPLIES(AND(A, B), AND(B, A)), prereqs: ['4.1'], qed: '8.3', hint: "And.comm' is a recipe already — you proved it back in 2.1. So assume A ∧ B, brew that once, and discharge: the whole middle of this proof is a lemma you hold.", needs: [] },

    // ---------- Chapter 5: Modus ponens ----------
    // 5.1 (QED 8.1a): modus ponens by itself — one craft. It introduces the `mp` capability, so it is now
    // the entry to Chapter 5 rather than 5.2 (implies_trans), which needs a sub-proof as well.
    { id: '5.1', kind: 'example', chapter: 5, givens: [binding('hA', A), binding('hAB', IMPLIES(A, B))], formulas: [A, B], goal: B, prereqs: ['4.1'], qed: '8.1(a)', qedNote: 'modus ponens, stated there in assumption form', hint: 'Select both potions, hAB and hA, and brew modus_ponens.', needs: ['mp'] },
    { id: '5.2', kind: 'lemma', leanName: 'implies_trans', chapter: 5, givens: [binding('hAB', IMPLIES(A, B)), binding('hBC', IMPLIES(B, C))], formulas: [A, B, C], goal: IMPLIES(A, C), prereqs: ['5.1'], qed: '8.2', hint: 'Assume A. Then hAB carries you to B and hBC on from there to C; discharge to turn the journey into an arrow.', needs: [] },
    { id: '5.3', kind: 'lemma', leanName: "And.elim'", chapter: 5, givens: [binding('hABC', IMPLIES(A, IMPLIES(B, C)))], formulas: [A, B], goal: IMPLIES(AND(A, B), C), prereqs: ['5.1'], qed: '8.4(a)', hint: 'Assume the conjunction and split it, then feed the two halves to hABC one after the other — it wants A first, then B.', needs: [] },
    { id: '5.4', kind: 'lemma', leanName: 'And.elim_rev', chapter: 5, givens: [binding('hABC', IMPLIES(AND(A, B), C))], formulas: [A, B], goal: IMPLIES(A, IMPLIES(B, C)), prereqs: ['5.1'], qed: '8.4(b)', hint: 'The reverse: assume A, assume B, pair them into A ∧ B, and that is what hABC consumes. One discharge through both levels.', needs: [] },
    { id: '5.5', kind: 'lemma', leanName: 'implies_swap', chapter: 5, givens: [binding('hABC', IMPLIES(A, IMPLIES(B, C)))], formulas: [A, B], goal: IMPLIES(B, IMPLIES(A, C)), prereqs: ['5.1'], qed: '8.4(c)', hint: 'Assume B first and A second — the goal fixes that order — then apply hABC to A and the result to B.', needs: [] },   // optional leaf
    { id: '5.6', kind: 'lemma', leanName: 'implies_and_self', chapter: 5, givens: [binding('hAB', IMPLIES(A, B))], formulas: [A], goal: IMPLIES(A, AND(A, B)), prereqs: ['5.1'], qed: '8.5(a)', hint: 'Assume A; hAB turns it into B, and A is still in hand to pair with.', needs: [] },
    { id: '5.7', kind: 'lemma', leanName: "implies_and_self'", chapter: 5, givens: [binding('hAB', IMPLIES(A, B))], formulas: [A], goal: IMPLIES(A, AND(B, A)), prereqs: ['5.1'], qed: '8.5(b)', hint: 'As the one before, but the goal wants the pair the other way round.', needs: [] },   // optional leaf
    { id: '5.8', kind: 'lemma', leanName: "And.imp_left'", chapter: 5, givens: [binding('hAB', AND(A, B)), binding('hAC', IMPLIES(A, C))], formulas: [], goal: AND(C, B), prereqs: ['5.1'], qed: '8.6(a)', hint: 'Take A out of hAB, push it along hAC to C, and pair that with the B half of hAB.', needs: [] },
    { id: '5.9', kind: 'lemma', leanName: "And.imp_right'", chapter: 5, givens: [binding('hAB', AND(A, B)), binding('hBC', IMPLIES(B, C))], formulas: [], goal: AND(A, C), prereqs: ['5.1'], qed: '8.6(b)', hint: 'Take B out of hAB, push it along hBC to C, and pair the A half of hAB with that.', needs: [] },
    // 5.10–6.16 (QED 9.5a–d): the congruence/monotonicity family — an implication A → B may be applied inside
    // either slot of a ∧ or a ∨. Each is the IMPLICATION form of a hypothesis-form lemma already minted
    // (5.8/5.9 for ∧, 6.6/6.7 for ∨), so each is just assume, apply, discharge. The `mono` names are because
    // And.imp_left'/And.imp_right' are already taken by 5.8/5.9.
    { id: '5.10', kind: 'lemma', leanName: "And.mono_left'", chapter: 5, givens: [binding('hAB', IMPLIES(A, B))], formulas: [A, B, C, AND(A, C)], goal: IMPLIES(AND(A, C), AND(B, C)), prereqs: ['5.8'], qed: '9.5(a)', hint: "And.imp_left' is a recipe now, and it does all the work: assume A ∧ C, brew it with hAB, discharge. Three moves in all.", needs: [] },
    { id: '5.11', kind: 'lemma', leanName: "And.mono_right'", chapter: 5, givens: [binding('hAB', IMPLIES(A, B))], formulas: [A, B, C, AND(C, A)], goal: IMPLIES(AND(C, A), AND(C, B)), prereqs: ['5.9'], qed: '9.5(c)', hint: "The same three moves as the level before, with And.imp_right' in place of And.imp_left'.", needs: [] },

    // ---------- Chapter 6: Case analysis ----------
    // Case analysis (∨ elimination), a WEB of QED §9 exercises. 6.1 introduces case_analysis; three
    // imp-lemma gateways (6.6/6.5/6.7) each unlock Chapter 7 (complete ANY path); associativity (6.8/6.9) and
    // distributivity (6.10–6.13) are optional sibling branches. Every one is solvable with BASE recipes only.
    { id: '6.1', kind: 'example', chapter: 6, givens: [binding('hAC', IMPLIES(A, C)), binding('hBC', IMPLIES(B, C))], formulas: [A, B], goal: IMPLIES(OR(A, B), C), prereqs: ['5.1'], hint: 'Select both potions and brew case_analysis: if A gives C, and B gives C as well, then A ∨ B gives C.', needs: ['case'] },
    { id: '6.2', kind: 'lemma', leanName: "Or.symm'", chapter: 6, givens: [], formulas: [A, B], goal: IMPLIES(OR(A, B), OR(B, A)), prereqs: ['6.1'], qed: '9.1(a)', qedNote: 'the same law in implication form', hint: 'A disjunction is used by case analysis, so build one implication per case: assume A and swing it into B ∨ A, assume B and swing that in, then brew case_analysis on the two.', needs: [] },
    // 6.3 is the hypothesis form of 6.2, mirroring And.comm' (2.1) for ∨. A one-move consequence of the
    // minted Or.symm', and in turn the lemma that makes 6.9 cheap (see the comment there).
    { id: '6.3', kind: 'lemma', leanName: "Or.comm'", chapter: 6, givens: [binding('hAB', OR(A, B))], formulas: [A, B], goal: OR(B, A), prereqs: ['6.2'], qed: '9.1(a)', hint: "The implication form of this law is already a recipe — brew Or.symm' at the formulas A and B, then fire it at hAB with modus_ponens.", needs: [] },
    { id: '6.4', kind: 'lemma', leanName: "Or.elim'", chapter: 6, givens: [binding('hAB', OR(A, B)), binding('hAC', IMPLIES(A, C)), binding('hBC', IMPLIES(B, C))], formulas: [A, B], goal: C, prereqs: ['6.1'], hint: 'case_analysis glues the two implications into one that starts from A ∨ B, and then modus_ponens applies it to hAB.', needs: [] },
    // 6.5 is the GENERAL two-implication form, so 6.6 and 6.7 are corollaries of it (take the other
    // implication to be the identity, i.e. the minted Impl.idem). It therefore sits before them and
    // unlocks them, giving a two-move alternate route in addition to the from-scratch one via 6.2.
    { id: '6.5', kind: 'lemma', leanName: "Or.imp'", chapter: 6, givens: [binding('hAB', OR(A, B)), binding('hAC', IMPLIES(A, C)), binding('hBD', IMPLIES(B, D))], formulas: [A, B, C, D], goal: OR(C, D), prereqs: ['6.1'], qed: '9.4(c)', hint: 'One sub-proof per case: assume A, cross hAC to C, swing it into C ∨ D; assume B, cross hBD to D, swing that in. case_analysis joins them, modus_ponens applies the result to hAB.', needs: [] },
    // three Chapter-7 gateways (Or.imp family — QED 9.4a/c/b): completing any one unlocks §10
    { id: '6.6', kind: 'lemma', leanName: "Or.imp_left'", chapter: 6, givens: [binding('hAB', OR(A, B)), binding('hAC', IMPLIES(A, C))], formulas: [A, B, C], goal: OR(C, B), prereqs: ['6.5'], qed: '9.4(a)', hint: "Or.imp' maps both sides of a disjunction at once — and the side you want left alone is mapped by the identity implication, which Impl.idem brews from a bare formula.", needs: [] },
    { id: '6.7', kind: 'lemma', leanName: "Or.imp_right'", chapter: 6, givens: [binding('hAB', OR(A, B)), binding('hBC', IMPLIES(B, C))], formulas: [A, B, C], goal: OR(A, C), prereqs: ['6.5'], qed: '9.4(b)', hint: 'As the level before, with the identity implication on the left-hand side this time.', needs: [] },
    // associativity siblings (QED 9.2a/b) and distributivity (QED 9.3a–d) — optional alternate pathways
    { id: '6.8', kind: 'lemma', leanName: 'Or.assoc_left', chapter: 6, givens: [binding('hABC', OR(OR(A, B), C))], formulas: [A, B, C], goal: OR(A, OR(B, C)), prereqs: ['6.1'], qed: '9.2(a)', hint: 'The long way round, and worth walking once. Three leaves in all — A, B and C — and each has to be swung into A ∨ (B ∨ C) by hand: assume each in turn and discharge, and you hold three implications that all land in the same place. Two case analyses glue those into one implication out of (A ∨ B) ∨ C, and hABC fires it.', needs: [] },
    // 6.9 is reachable from BOTH 6.8 (Or.assoc_left) and 6.3 (Or.comm'), so both are in principle in hand
    // as recipes: comm, assoc, comm, assoc, comm gets there in five moves instead of a dozen case splits.
    { id: '6.9', kind: 'lemma', leanName: 'Or.assoc_right', chapter: 6, givens: [binding('hABC', OR(A, OR(B, C)))], formulas: [A, B, C], goal: OR(OR(A, B), C), prereqs: ['6.3', '6.8'], qed: '9.2(b)', hint: "No assumptions at all this time. Or.comm' and Or.assoc_left are both recipes now, and alternating them walks the brackets across: five single-ingredient brews.", needs: [] },
    { id: '6.10', kind: 'lemma', leanName: "or_and_left'", chapter: 6, givens: [binding('hABC', OR(A, AND(B, C)))], formulas: [A, B, C], goal: AND(OR(A, B), OR(A, C)), prereqs: ['6.1'], qed: '9.3(a)', hint: 'Case-analyse hABC. The A case proves both halves of the goal at once; the B ∧ C case splits and swings each half in separately.', needs: [] },
    { id: '6.11', kind: 'lemma', leanName: "and_or_left'", chapter: 6, givens: [binding('hABC', AND(A, OR(B, C)))], formulas: [A, B, C], goal: OR(AND(A, B), AND(A, C)), prereqs: ['6.1'], qed: '9.3(b)', hint: 'Split hABC first, so A is in hand throughout, then case-analyse the disjunction: each case pairs A with what it has and swings the result into the goal.', needs: [] },
    { id: '6.12', kind: 'lemma', leanName: 'and_or_left_rev', chapter: 6, givens: [binding('hABC', OR(AND(A, B), AND(A, C)))], formulas: [A, B, C], goal: AND(A, OR(B, C)), prereqs: ['6.1'], qed: '9.3(c)', hint: 'Case-analyse hABC. Both cases carry A, and the other half of each only needs swinging into B ∨ C.', needs: [] },
    { id: '6.13', kind: 'lemma', leanName: 'or_and_left_rev', chapter: 6, givens: [binding('hABC', AND(OR(A, B), OR(A, C)))], formulas: [A, B, C], goal: OR(A, AND(B, C)), prereqs: ['6.1'], qed: '9.3(d)', hint: 'Split hABC into A ∨ B and A ∨ C, then case-analyse A ∨ B. The A case is immediate; the B case needs a second case analysis, on A ∨ C, inside it.', needs: [] },
    // 6.14 (QED 9.1b): A ∨ A ⊢ A — two crafts, feeding the identity implication to Or.elim' twice.
    { id: '6.14', kind: 'lemma', leanName: "or_self_elim'", chapter: 6, givens: [binding('hAA', OR(A, A))], formulas: [A], goal: A, prereqs: ['6.4'], qed: '9.1(b)', hint: "Both sides of A ∨ A prove A, so Or.elim' will take the identity implication twice — Impl.idem brews it from the formula A.", needs: [] },
    { id: '6.15', kind: 'lemma', leanName: "Or.mono_left'", chapter: 6, givens: [binding('hAB', IMPLIES(A, B))], formulas: [A, B, C, OR(A, C)], goal: IMPLIES(OR(A, C), OR(B, C)), prereqs: ['6.6'], qed: '9.5(b)', hint: "Assume A ∨ C, brew Or.imp_left' with hAB, discharge.", needs: [] },
    { id: '6.16', kind: 'lemma', leanName: "Or.mono_right'", chapter: 6, givens: [binding('hAB', IMPLIES(A, B))], formulas: [A, B, C, OR(C, A)], goal: IMPLIES(OR(C, A), OR(C, B)), prereqs: ['6.7'], qed: '9.5(d)', hint: "Assume C ∨ A, brew Or.imp_right' with hAB, discharge.", needs: [] },

    // ---------- Chapter 7: If and only if ----------
    // Bi-implication (↔). 7.1 introduces Iff; symmetry (7.2) and transitivity (7.3) are the
    // MANDATORY spine (7.3 will unlock Ch 8 later); reflexivity (7.4) and the ↔-congruences (7.5–7.7,
    // QED 10.1b/d/f) are optional side-branches.
    { id: '7.1', kind: 'example', chapter: 7, givens: [binding('hA', A), binding('hAB', IFF(A, B))], formulas: [A, B], goal: B, prereqs: ['6.1'], qed: '10.1(a)', hint: 'An equivalence holds two implications at once. Select hAB and hA and brew Iff.mp to travel along the forward one.', needs: ['iff'] },
    { id: '7.2', kind: 'lemma', leanName: "Iff.symm'", chapter: 7, givens: [binding('hAB', IFF(A, B))], formulas: [A, B], goal: IFF(B, A), prereqs: ['7.1'], qed: '10.2(a)', hint: 'An equivalence is two implications, so build both: assume B and travel backwards along hAB, assume A and travel forwards, then glue the two with Iff.intro.', needs: [] },
    { id: '7.3', kind: 'lemma', leanName: "Iff.trans'", chapter: 7, givens: [binding('hAB', IFF(A, B)), binding('hBC', IFF(B, C))], formulas: [A, B, C], goal: IFF(A, C), prereqs: ['7.1'], qed: '10.2(b)', hint: 'Two sub-proofs again. Forwards, chain Iff.mp through hAB and then hBC; backwards, chain Iff.mpr the other way. Iff.intro glues them.', needs: [] },
    { id: '7.4', kind: 'lemma', leanName: "Iff.refl'", chapter: 7, givens: [], formulas: [A], goal: IFF(A, A), prereqs: ['7.1'], qed: '10.2(c)', hint: 'Assume A and discharge it — the identity implication serves as both halves of the equivalence.', needs: [] },
    { id: '7.5', kind: 'lemma', leanName: "And.congr_left'", chapter: 7, givens: [binding('hAB', AND(A, B)), binding('hAC', IFF(A, C))], formulas: [A, B, C], goal: AND(C, B), prereqs: ['7.1'], qed: '10.1(b)', hint: 'Pull hAB apart, carry the A half across hAC with Iff.mp, and pair the result with the B half.', needs: [] },
    { id: '7.6', kind: 'lemma', leanName: "Or.congr_left'", chapter: 7, givens: [binding('hAB', OR(A, B)), binding('hAC', IFF(A, C))], formulas: [A, B, C], goal: OR(C, B), prereqs: ['7.1'], qed: '10.1(d)', hint: 'Case-analyse hAB: the A case crosses hAC and swings into C ∨ B, the B case swings in untouched.', needs: [] },
    { id: '7.7', kind: 'example', chapter: 7, givens: [binding('hAB', IMPLIES(A, B)), binding('hAC', IFF(A, C))], formulas: [A, B, C], goal: IMPLIES(C, B), prereqs: ['7.1'], qed: '10.1(f)', hint: 'Assume C, travel backwards along hAC to A, apply hAB, discharge.', needs: [] },
    // 7.8 is a Grimoire helper, not a QED exercise: it turns a ↔ into the implication hiding inside it.
    // With it, QED's three "second slot" congruences (10.1c/e/g) each become two crafts, reusing the
    // monotonicity lemmas already minted (5.9 for ∧, 6.7 for ∨, 5.2 for →) — the same shape as 5.10–6.16.
    { id: '7.8', kind: 'lemma', leanName: "Iff.imp'", chapter: 7, givens: [binding('hiff', IFF(A, B))], formulas: [A, B], goal: IMPLIES(A, B), prereqs: ['7.1'], hint: 'An equivalence contains the implication you want: assume A, brew Iff.mp, discharge. Solving this one adds it as a recipe, and the next three levels all use it.', needs: [] },
    { id: '7.9', kind: 'lemma', leanName: "And.congr_right'", chapter: 7, givens: [binding('hAB', AND(A, B)), binding('hBC', IFF(B, C))], formulas: [A, B, C], goal: AND(A, C), prereqs: ['5.9', '7.8'], qed: '10.1(c)', hint: "Iff.imp' turns hBC into an implication, and And.imp_right' does the rest. Two brews.", needs: [] },
    { id: '7.10', kind: 'lemma', leanName: "Or.congr_right'", chapter: 7, givens: [binding('hAB', OR(A, B)), binding('hBC', IFF(B, C))], formulas: [A, B, C], goal: OR(A, C), prereqs: ['6.7', '7.8'], qed: '10.1(e)', hint: "As the level before, with Or.imp_right'.", needs: [] },
    { id: '7.11', kind: 'lemma', leanName: "imp_congr_right'", chapter: 7, givens: [binding('hAB', IMPLIES(A, B)), binding('hBC', IFF(B, C))], formulas: [A, B, C], goal: IMPLIES(A, C), prereqs: ['5.2', '7.8'], qed: '10.1(g)', hint: "Turn hBC into an implication with Iff.imp', then chain it onto hAB with implies_trans.", needs: [] },
    // 7.12–7.14 (QED 10.3, 10.4, 10.5): building a ↔ rather than using one. 7.12 is Iff.intro bare; the
    // other two glue it onto lemmas already minted (Or.idem/or_self_elim', And.assoc_left/right).
    { id: '7.12', kind: 'example', chapter: 7, givens: [binding('hAB', IMPLIES(A, B)), binding('hBA', IMPLIES(B, A))], formulas: [A, B], goal: IFF(A, B), prereqs: ['7.1'], qed: '10.3', qedNote: 'stated there with assumption environments', hint: 'Both implications are already given. One brew.', needs: [] },
    { id: '7.13', kind: 'lemma', leanName: "or_self_iff'", chapter: 7, givens: [], formulas: [A, OR(A, A)], goal: IFF(A, OR(A, A)), prereqs: ['3.2', '6.14', '7.1'], qed: '10.4', hint: "One implication each way, each from a recipe you already have: Or.idem going out, or_self_elim' coming back.", needs: [] },
    { id: '7.14', kind: 'lemma', leanName: "and_assoc_iff'", chapter: 7, givens: [], formulas: [A, B, C, AND(AND(A, B), C), AND(A, AND(B, C))], goal: IFF(AND(AND(A, B), C), AND(A, AND(B, C))), prereqs: ['2.3', '7.1'], qed: '10.5', hint: 'Both associativity lemmas are recipes now. Assume one side, apply the matching lemma, discharge; do it again the other way; glue with Iff.intro.', needs: [] },

    // ---------- Chapter 8: Negation and contradiction ----------
    // From a contradiction, anything (ex falso, via `absurd`). 8.1 intro; 8.2 optional sibling.
    { id: '8.1', kind: 'example', chapter: 8, givens: [binding('hAnA', AND(A, NOT(A)))], formulas: [A, B], goal: B, prereqs: ['7.1'], qed: '11.1, 12.3(a)', hint: 'Pull the contradiction apart first — And.left and And.right on hAnA give you A and ¬ A. Then select both of those together with the formula B and brew absurd: from a contradiction, anything at all.', needs: ['neg'] },
    { id: '8.2', kind: 'example', chapter: 8, givens: [binding('hnAA', AND(NOT(A), A))], formulas: [A, B], goal: B, prereqs: ['8.1'], qed: '11.2, 12.3(b)', hint: 'The same shape as the tutorial, with the halves of the conjunction the other way round — absurd wants the positive statement first.', needs: [] },
    { id: '8.3', kind: 'lemma', leanName: "not_not_intro'", chapter: 8, givens: [binding('hA', A)], formulas: [A, NOT(A)], goal: NOT(NOT(A)), prereqs: ['8.1'], qed: '12.2(b)', hint: 'To prove a negation, assume the thing and find a contradiction. Assume ¬ A; hA contradicts it on the spot, so take the reductio the sub-proof offers.', needs: [] },
    { id: '8.4', kind: 'lemma', leanName: "mt'", chapter: 8, givens: [binding('hAB', IMPLIES(A, B))], formulas: [A, B, NOT(B)], goal: IMPLIES(NOT(B), NOT(A)), prereqs: ['8.1'], qed: '12.6(a)', hint: 'Assume ¬ B, then assume A inside it. hAB gives B, which contradicts ¬ B, so the inner sub-proof closes as ¬ A by reductio — then discharge the outer one.', needs: [] },
    // 8.5–9.3 (QED 12.1a/b/c): reductio in its general forms — assume A, reach a contradiction, conclude ¬A.
    // 9.3 splits on excluded middle instead, and is minted as a lemma (`by_cases'`) that later chapters reuse.
    { id: '8.5', kind: 'example', chapter: 8, givens: [binding('hAcon', IMPLIES(A, AND(B, NOT(B))))], formulas: [A], goal: NOT(A), prereqs: ['8.1'], qed: '12.1(a)', qedNote: 'reductio ad absurdum, stated there with an assumption environment', hint: 'Assume A and apply hAcon: the conjunction you get is its own contradiction, and its two halves close the sub-proof.', needs: [] },
    { id: '8.6', kind: 'example', chapter: 8, givens: [binding('hAB', IMPLIES(A, B)), binding('hAnB', IMPLIES(A, NOT(B)))], formulas: [A], goal: NOT(A), prereqs: ['8.1'], qed: '12.1(b)', qedNote: 'reductio in separated form, stated there with assumption environments', hint: 'Assume A and apply both potions to it. The two results contradict each other, which closes the sub-proof as ¬ A.', needs: [] },
    // 8.7–9.6 (QED 12.5a/d/b/c): De Morgan for ∧/∨, ordered easiest-first rather than by QED's lettering.
    // The first three are constructive; only the last (¬(A ∧ B) ⊢ ¬A ∨ ¬B) genuinely needs excluded middle,
    // and it reuses the minted `by_cases'` (9.3) to do the split.
    { id: '8.7', kind: 'lemma', leanName: "not_or'", chapter: 8, givens: [binding('hnAB', NOT(OR(A, B)))], formulas: [A, B], goal: AND(NOT(A), NOT(B)), prereqs: ['8.1'], qed: '12.5(a)', hint: 'Each half needs its own reductio: assume A, swing it into A ∨ B, contradict hnAB. Then the same with B on the other side, and pair the two negations.', needs: [] },
    { id: '8.8', kind: 'lemma', leanName: "not_or_intro'", chapter: 8, givens: [binding('hnAnB', AND(NOT(A), NOT(B)))], formulas: [A, B, OR(A, B)], goal: NOT(OR(A, B)), prereqs: ['8.1'], qed: '12.5(d)', hint: 'Assume A ∨ B and case-analyse it down to B — the A case goes through absurd, the B case is immediate. That B then contradicts the ¬ B half of hnAnB.', needs: [] },
    { id: '8.9', kind: 'lemma', leanName: "not_and_of_not_or'", chapter: 8, givens: [binding('hnAonB', OR(NOT(A), NOT(B)))], formulas: [A, B, AND(A, B), NOT(A), NOT(B)], goal: NOT(AND(A, B)), prereqs: ['8.1'], qed: '12.5(b)', hint: 'Assume A ∧ B. Case-analyse hnAonB down to ¬ B (the ¬ A case is absurd against the A half), and that contradicts the B half.', needs: [] },
    { id: '8.10', kind: 'lemma', leanName: "imp_of_not_or'", chapter: 8, givens: [binding('hnAB', OR(NOT(A), B))], formulas: [A, B, NOT(A)], goal: IMPLIES(A, B), prereqs: ['6.4', '8.1'], qed: '12.4(b)', hint: "Or.elim' on hnAB, with one implication per branch: ¬ A gives B through absurd under an assumed A, and B gives B by Impl.idem.", needs: [] },
    // 8.11–8.13 (QED 12.6b/c/d): the contrapositive family. All three are corollaries of the minted mt'
    // (8.4) — two or three moves each, rather than a fresh reductio every time.
    { id: '8.11', kind: 'lemma', leanName: "mt_apply'", chapter: 8, givens: [binding('hAB', IMPLIES(A, B)), binding('hnB', NOT(B))], formulas: [A, B], goal: NOT(A), prereqs: ['8.4'], qed: '12.6(b)', hint: "mt' turns hAB round, and then it is plain modus ponens on hnB. Two brews, no assumptions.", needs: [] },
    { id: '8.12', kind: 'lemma', leanName: "not_of_iff'", chapter: 8, givens: [binding('hnA', NOT(A)), binding('hiff', IFF(A, B))], formulas: [A, B], goal: NOT(B), prereqs: ['8.1'], qed: '12.6(c)', hint: 'Assume B, travel backwards along hiff to A, and contradict hnA.', needs: [] },
    { id: '8.13', kind: 'lemma', leanName: "not_of_imp_not'", chapter: 8, givens: [binding('hAnB', IMPLIES(A, NOT(B))), binding('hB', B)], formulas: [A, B], goal: NOT(A), prereqs: ['8.3', '8.4'], qed: '12.6(d)', hint: "not_not_intro' lifts hB to ¬ (¬ B), which is exactly what the contrapositive of hAnB consumes.", needs: [] },
    { id: '8.14', kind: 'lemma', leanName: "resolution'", chapter: 8, givens: [binding('hAB', OR(A, B)), binding('hnAC', OR(NOT(A), C))], formulas: [A, B, C], goal: OR(C, B), prereqs: ['6.6', '8.10'], qed: '12.8', hint: "imp_of_not_or' reads the second potion as an implication, and then Or.imp_left' maps it over the first. Two brews.", needs: [] },
    { id: '8.15', kind: 'lemma', leanName: 'not_iff_imp_false', chapter: 8, givens: [], formulas: [A, FALSE(), NOT(A), IMPLIES(A, FALSE())], goal: IFF(NOT(A), IMPLIES(A, FALSE())), prereqs: ['8.1'], qed: '13.3(d)', hint: 'Both directions are reductios wearing different hats. Forwards: assume ¬ A, then A, and absurd gives False. Backwards: assume the arrow, assume A, obtain False — and a reductio closing on a bare False needs no second statement.', needs: [] },
    // 8.16 (QED 13.2a) is the one place a reductio closes on a DIRECT proof of False rather than on a
    // contradictory pair; 10.6 (QED 13.3c) is True acting as the unit of implication.
    { id: '8.16', kind: 'example', chapter: 8, givens: [], formulas: [A, FALSE(), AND(FALSE(), A)], goal: NOT(AND(FALSE(), A)), prereqs: ['8.1'], qed: '13.2(a)', hint: 'Assume the conjunction; its left half is False, and a reductio closing on a bare False needs nothing else.', needs: [] },

    // ---------- Chapter 9: The excluded middle ----------
    // Negation introduction (reductio) + excluded middle (classical). 9.1 introduces em; 8.3/9.2
    // are double-negation (intro via reductio, elim via em); 8.4 is the contrapositive.
    { id: '9.1', kind: 'example', chapter: 9, givens: [], formulas: [A], goal: OR(A, NOT(A)), prereqs: ['8.1'], qed: '12.1(d)', qedNote: 'QED states the reversed form, ¬A ∨ A', hint: 'No potion is needed here. Select nothing but the formula A, and brew Classical.em.', needs: ['em'] },
    { id: '9.2', kind: 'lemma', leanName: 'not_not_elim', chapter: 9, givens: [binding('hnnA', NOT(NOT(A)))], formulas: [A, NOT(A)], goal: A, prereqs: ['9.1'], qed: '12.2(a)', hint: 'Excluded middle on A splits the problem: the A case proves A outright, and the ¬ A case contradicts hnnA, so absurd supplies A there too.', needs: [] },
    { id: '9.3', kind: 'lemma', leanName: "by_cases'", chapter: 9, givens: [binding('hAB', IMPLIES(A, B)), binding('hnAB', IMPLIES(NOT(A), B))], formulas: [A, B], goal: B, prereqs: ['9.1'], qed: '12.1(c)', qedNote: 'the excluded middle in case-analysis form, stated there with assumptions', hint: 'case_analysis glues the two implications into one that starts from A ∨ (¬ A), and Classical.em supplies that disjunction. Solving it adds a recipe the rest of the chapter leans on.', needs: [] },
    // 9.4–9.5 (QED 12.3a/b): proof by contradiction — assume ¬A, contradict, then strip the double negation
    // with the minted `not_not_elim` (9.2). The two differ only in the order of the contradictory pair.
    { id: '9.4', kind: 'example', chapter: 9, givens: [binding('hnAcon', IMPLIES(NOT(A), AND(B, NOT(B))))], formulas: [A, NOT(A)], goal: A, prereqs: ['9.2'], hint: 'Assume ¬ A; hnAcon then hands you a contradiction, so the sub-proof closes as ¬ (¬ A). not_not_elim strips the two negations.', needs: [] },
    { id: '9.5', kind: 'example', chapter: 9, givens: [binding('hnAcon', IMPLIES(NOT(A), AND(NOT(B), B)))], formulas: [A, NOT(A)], goal: A, prereqs: ['9.2'], hint: 'As the level before, with the halves of the contradiction the other way round.', needs: [] },
    // (`not_and'` is already declared by core Lean's Init, so this one is `not_and_or'` — cf. Mathlib's not_and_or.)
    { id: '9.6', kind: 'lemma', leanName: "not_and_or'", chapter: 9, givens: [binding('hnAB', NOT(AND(A, B)))], formulas: [A, B, NOT(A), NOT(B)], goal: OR(NOT(A), NOT(B)), prereqs: ['9.3'], qed: '12.5(c)', hint: "by_cases' on A. If A holds, pair it with an assumed B to contradict hnAB, which gives ¬ B; if not, ¬ A is the other disjunct.", needs: [] },
    // 9.7–9.8 (QED 12.4a/b/c): implication as a disjunction. 9.8 is just the two halves glued with
    // Iff.intro, so it reuses them rather than reproving anything.
    { id: '9.7', kind: 'lemma', leanName: "not_or_of_imp'", chapter: 9, givens: [binding('hAB', IMPLIES(A, B))], formulas: [A, B, NOT(A)], goal: OR(NOT(A), B), prereqs: ['6.3', '6.6', '9.1'], qed: '12.4(a)', hint: "Classical.em hands you A ∨ (¬ A) for nothing, and that is already half of what you want — so map it rather than splitting on it. Or.imp_left' replaces the A on its left, using hAB as the implication, and Or.comm' turns the result round. Three brews, no assumptions at all. (by_cases' on A works too, and costs five more.)", needs: [] },
    { id: '9.8', kind: 'lemma', leanName: "imp_iff_not_or'", chapter: 9, givens: [], formulas: [A, B, NOT(A), IMPLIES(A, B), OR(NOT(A), B)], goal: IFF(IMPLIES(A, B), OR(NOT(A), B)), prereqs: ['8.10', '9.7'], qed: '12.4(c)', hint: "Both halves are recipes already — not_or_of_imp' one way, imp_of_not_or' the other. Assume, apply, discharge, twice over, then Iff.intro.", needs: [] },
    // 9.9 (QED 12.2c): the ↔ form of double negation, from the two halves already minted (8.3, 9.2).
    { id: '9.9', kind: 'lemma', leanName: "not_not_iff'", chapter: 9, givens: [], formulas: [A, NOT(A), NOT(NOT(A))], goal: IFF(A, NOT(NOT(A))), prereqs: ['8.3', '9.2'], qed: '12.2(c)', hint: "not_not_intro' and not_not_elim are both recipes now. One assume-apply-discharge each, then glue them.", needs: [] },
    // 9.10 (QED 12.7) Peirce's law, the classical capstone: split on A with by_cases'; in the ¬A case a
    // vacuous A → B feeds the hypothesis. 8.14 (QED 12.8) is resolution, and falls out of 8.10 + Or.imp_left'.
    // (core Lean's Init already declares `peirce'`, hence `peirce_law'` — cf. the not_and' collision at 9.6)
    { id: '9.10', kind: 'lemma', leanName: "peirce_law'", chapter: 9, givens: [binding('hPA', IMPLIES(IMPLIES(A, B), A))], formulas: [A, B, NOT(A)], goal: A, prereqs: ['9.3'], qed: '12.7', hint: "by_cases' on A. If A holds there is nothing to do. If not, A → B holds vacuously through absurd, and hPA turns that into A.", needs: [] },

    // ---------- Chapter 10: True and False ----------
    // True and False as first-class objects (the last propositional chapter). 10.1 introduces them;
    // then the ∨/∧ identities, and the capstone 8.15 = the very definition of negation, ¬A ↔ (A → False).
    { id: '10.1', kind: 'example', chapter: 10, givens: [], formulas: [A], goal: OR(TRUE(), A), prereqs: ['9.1'], qed: '13.2(b)', hint: 'True.intro takes no ingredients at all — brew it with nothing selected. Then select that proof of True together with the formula A and brew Or.inl.', needs: ['tf'] },
    { id: '10.2', kind: 'example', chapter: 10, givens: [], formulas: [A, FALSE()], goal: IMPLIES(FALSE(), A), prereqs: ['10.1'], qed: '13.3(a)', hint: 'Assume False, and False.elim will produce anything at all, the goal included. Then discharge.', needs: [] },
    { id: '10.3', kind: 'example', chapter: 10, givens: [], formulas: [A], goal: IMPLIES(A, TRUE()), prereqs: ['10.1'], qed: '13.3(b)', hint: 'Assume A, brew True.intro from nothing, discharge. The assumption is never used, which is the point.', needs: [] },
    { id: '10.4', kind: 'lemma', leanName: "true_and'", chapter: 10, givens: [], formulas: [A, TRUE(), AND(TRUE(), A)], goal: IFF(A, AND(TRUE(), A)), prereqs: ['10.1'], qed: '13.1(a)', hint: 'Forwards, assume A and pair it with True.intro. Backwards, assume True ∧ A and take its right half.', needs: [] },
    { id: '10.5', kind: 'lemma', leanName: "false_or'", chapter: 10, givens: [], formulas: [A, FALSE(), OR(FALSE(), A)], goal: IFF(A, OR(FALSE(), A)), prereqs: ['10.1'], qed: '13.1(b)', hint: 'Forwards is one swing with Or.inr. Backwards, assume False ∨ A and case-analyse it: the False branch goes through False.elim, the A branch is immediate.', needs: [] },
    { id: '10.6', kind: 'lemma', leanName: "iff_true_imp'", chapter: 10, givens: [], formulas: [A, TRUE(), IMPLIES(TRUE(), A)], goal: IFF(A, IMPLIES(TRUE(), A)), prereqs: ['10.1'], qed: '13.3(c)', hint: 'Forwards, assume A and then assume True on top of it, and discharge A through both levels. Backwards, feed True.intro to the assumed arrow.', needs: [] },

    // ---------- Chapter 11: Variables and the universal quantifier ----------
    // Chapters 11–12 — first-order logic over the generic sort Ω. Introduce a free variable (a sub-env, like an
    // assumption); discharging a proof gives ∀ x : Ω, … . 11.1 (one variable, unary predicate) is the gentle entry;
    // 11.2 (two variables) is an optional side-quest. Ch 12 adds universal_instantiation (the ∀ analogue of MP).
    { id: '11.1', kind: 'example', chapter: 11, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }], givens: [], formulas: [], terms: [X],
      goal: fa('X', IMPLIES(appE('P', [X]), appE('P', [X]))), prereqs: ['10.1'], qed: '17.1', hint: 'Two sub-proofs, one inside the other. Right-click the gem X on the term bench and choose Introduce; inside that sub-proof X is arbitrary. Select X and use the P constructor to form P(X), then right-click that formula and Assume it. The statement you want is now in hand, so discharge twice: once to close the assumption into an arrow, once more to close the variable into a ∀.', needs: ['forall'] },
    { id: '11.2', kind: 'example', chapter: 11, sorts: [OMEGA], preds: [{ name: 'Q', argSorts: [OMEGA, OMEGA], resultSort: PROP }], givens: [], formulas: [], terms: [varE('x', OMEGA), varE('y', OMEGA)],
      goal: FORALL({ name: 'x', sort: OMEGA }, FORALL({ name: 'y', sort: OMEGA }, IMPLIES(appE('Q', [varE('x', OMEGA), varE('y', OMEGA)]), appE('Q', [varE('x', OMEGA), varE('y', OMEGA)])))), prereqs: ['11.1'], qed: '23.1(a)', hint: 'Three levels this time: introduce x, introduce y, then form Q(x, y) and assume it. One discharge closes all three.', needs: [] },
    // 11.3 (QED 16.1): excluded middle holds of every instance of a two-place predicate. Introduce both
    // variables, invoke Classical.em on Q(x, y), then discharge straight through both levels.
    { id: '11.3', kind: 'example', chapter: 11, sorts: [OMEGA], preds: [{ name: 'Q', argSorts: [OMEGA, OMEGA], resultSort: PROP }], givens: [], formulas: [], terms: [varE('x', OMEGA), varE('y', OMEGA)],
      goal: fa('x', fa('y', OR(appE('Q', [varE('x', OMEGA), varE('y', OMEGA)]), NOT(appE('Q', [varE('x', OMEGA), varE('y', OMEGA)]))))), prereqs: ['11.1'], qed: '16.1', qedNote: 'stated there with free variables held arbitrary', hint: 'Introduce both variables, then brew Classical.em at the formula Q(x, y) inside — no assumption is needed at all. Discharge twice.', needs: [] },
    { id: '11.4', kind: 'example', chapter: 11, sorts: [OMEGA], preds: [{ name: 'Q', argSorts: [OMEGA, OMEGA], resultSort: PROP }], givens: [], formulas: [fa('X', fa('Y', appE('Q', [X, Y])))],
      goal: IMPLIES(fa('X', fa('Y', appE('Q', [X, Y]))), fa('X', fa('Y', appE('Q', [X, Y])))), prereqs: ['11.1'], qed: '17.2', hint: 'The whole quantified statement is on the formula shelf. Assume it and it is already what the arrow needs, so discharge.', needs: [] },
    { id: '11.5', kind: 'example', chapter: 11, sorts: [OMEGA], preds: [], terms: [X], givens: [binding('hA', A)], goal: fa('X', A), prereqs: ['11.1'], qed: '18.2(a)', hint: 'A is proved already and says nothing about X, so introduce X, leave hA alone, and discharge: a ∀ over a statement that ignores its own variable.', needs: [] },

    // ---------- Chapter 12: Universal instantiation ----------
    { id: '12.1', kind: 'example', chapter: 12, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }, { name: 'R', argSorts: [OMEGA], resultSort: PROP }], terms: [X],
      givens: [binding('hpr', fa('X', IMPLIES(appE('P', [X]), appE('R', [X])))), binding('hp', fa('X', appE('P', [X])))],
      goal: fa('X', appE('R', [X])), prereqs: ['11.1'], hint: 'Introduce the gem X first. universal_instantiation is modus ponens for ∀: select hpr and X to get P(X) → R(X), then hp and X to get P(X). Brew modus_ponens on those two and discharge to put the ∀ back.', needs: ['instantiate'] },
    // 12.2 "Barbara singular": a term constant α : Ω is given in the context; instantiate hPQ at α, then modus ponens.
    // A LEMMA — minting `barbara` mints a higher-order recipe (P, Q are second-order metavars, α explicit) reusable for 12.3.
    { id: '12.2', kind: 'lemma', leanName: 'barbara', chapter: 12, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }, { name: 'Q', argSorts: [OMEGA], resultSort: PROP }], consts: [{ name: 'α', sort: OMEGA }],
      givens: [binding('hPQ', fa('X', IMPLIES(appE('P', [X]), appE('Q', [X])))), binding('hP', appE('P', [alpha]))],
      goal: appE('Q', [alpha]), prereqs: ['12.1'], qed: '18.3(a)', hint: 'Instantiate hPQ at α, and then it is plain modus ponens on hP.', needs: [] },
    { id: '12.3', kind: 'example', chapter: 12, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }, { name: 'R', argSorts: [OMEGA], resultSort: PROP }, { name: 'S', argSorts: [OMEGA], resultSort: PROP }], terms: [X],
      givens: [binding('hpr', fa('X', IMPLIES(appE('P', [X]), appE('R', [X])))), binding('hsp', fa('X', IMPLIES(appE('S', [X]), appE('P', [X]))))],
      goal: fa('X', IMPLIES(appE('S', [X]), appE('R', [X]))), prereqs: ['12.1'], qed: '18.3(b)', hint: 'Introduce X and instantiate both potions there. Then assume S(X), walk it through to R(X), and discharge twice — once for the arrow, once for the ∀.', needs: [] },
    { id: '12.4', kind: 'example', chapter: 12, sorts: [OMEGA], preds: [{ name: 'Q', argSorts: [OMEGA, OMEGA], resultSort: PROP }], terms: [X, Y],
      givens: [binding('h', fa('X', fa('Y', appE('Q', [X, Y]))))],
      goal: fa('Y', fa('X', appE('Q', [X, Y]))), prereqs: ['12.1'], qed: '18.4', hint: 'Introduce Y first and X second, so that one discharge through both levels rebuilds the quantifiers in the order the goal wants. Then instantiate h at X and the result at Y.', needs: [] },
    // 12.5 / 12.6 — the ∀ distributes over ∧ (both directions), the capstone pair of the universal-quantifier chapter.
    { id: '12.5', kind: 'lemma', leanName: "forall_and'", chapter: 12, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }, { name: 'Q', argSorts: [OMEGA], resultSort: PROP }], terms: [X],
      givens: [binding('h', fa('X', AND(appE('P', [X]), appE('Q', [X]))))],
      goal: AND(fa('X', appE('P', [X])), fa('X', appE('Q', [X]))), prereqs: ['12.1'], qed: '18.5', qedNote: 'one direction of QED’s biconditional', hint: 'Each half needs its own variable: introduce X, instantiate h, keep the left half, discharge — then do all of that again keeping the right half, and pair the two quantified statements.', needs: [] },
    { id: '12.6', kind: 'lemma', leanName: "forall_and_rev'", chapter: 12, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }, { name: 'Q', argSorts: [OMEGA], resultSort: PROP }], terms: [X],
      givens: [binding('h', AND(fa('X', appE('P', [X])), fa('X', appE('Q', [X]))))],
      goal: fa('X', AND(appE('P', [X]), appE('Q', [X]))), prereqs: ['12.1'], qed: '18.5', qedNote: 'the other direction of QED’s biconditional', hint: 'Split h first, then introduce X once and instantiate both halves at it. Pair them and discharge.', needs: [] },
    // 12.7 (QED's 18.6): a hypothesis independent of X may be moved in or out of a ∀. Note Grimoire's own
    // 12.5/12.6 are the ∀-over-∧ pair, a DIFFERENT statement — QED's 18.6 had no counterpart until now.
    { id: '12.7', kind: 'lemma', leanName: "forall_imp_comm'", chapter: 12, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }], terms: [X],
      givens: [], formulas: [A, fa('X', appE('P', [X])), IMPLIES(A, fa('X', appE('P', [X]))), fa('X', IMPLIES(A, appE('P', [X])))],
      goal: IFF(IMPLIES(A, fa('X', appE('P', [X]))), fa('X', IMPLIES(A, appE('P', [X])))), prereqs: ['12.1'], qed: '18.6', hint: 'Four sub-proofs in all. Forwards, assume the arrow, introduce X, assume A, instantiate. Backwards, assume the quantified statement, assume A, and introduce X inside that — the order of those inner two is what makes the discharges come out right.', needs: [] },
    { id: '12.8', kind: 'lemma', leanName: 'forall_dne', chapter: 12, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }], terms: [X],
      givens: [binding('hdn', fa('X', NOT(NOT(appE('P', [X])))))], goal: fa('X', appE('P', [X])), prereqs: ['9.2', '12.1'], hint: 'Introduce X, instantiate hdn there, and not_not_elim strips the negations. Discharge.', needs: [] },

    // ---------- Chapter 13: The existential quantifier ----------
    // The existential quantifier ∃ and its ELIMINATION via `obtain`: given `∃ x, P x` and an UNCLAIMED
    // variable name, place that variable in context together with its witnessing hypothesis (no sub-environment; the
    // goal is unchanged). Non-destructive — `have h2 := h; obtain ⟨a, ha⟩ := h2` — so the ∃ survives. (QED §19's
    // "push" exercises don't port: they moved the goal INTO an ∃ sub-environment, which the Lean model has no need of.)
    // 13.1 introduces `exists` (obtain → instantiate → modus_ponens); 13.2 (ex falso) and 13.3 (∧-elim) are siblings.
    { id: '13.1', kind: 'example', chapter: 13, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }], terms: [varE('a', OMEGA)],
      givens: [binding('hex', ee('x', appE('P', [xL]))), binding('hpc', fa('X', IMPLIES(appE('P', [X]), C)))],
      goal: C, prereqs: ['12.1'], hint: 'An existence statement is no use until its witness has a name. Select hex and the unclaimed gem a and use the Obtain card — a joins the context along with a potion saying P(a). Then instantiate hpc at a and finish with modus_ponens.', needs: ['exists'] },
    { id: '13.2', kind: 'example', chapter: 13, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }], terms: [varE('a', OMEGA)], formulas: [C],
      givens: [binding('hex', ee('x', appE('P', [xL]))), binding('hnp', fa('X', NOT(appE('P', [X]))))],
      goal: C, prereqs: ['13.1'], hint: 'Obtain a witness from hex, instantiate hnp at it, and the two are a contradiction — absurd then yields the goal.', needs: [] },
    { id: '13.3', kind: 'example', chapter: 13, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }, { name: 'Q', argSorts: [OMEGA], resultSort: PROP }], terms: [varE('a', OMEGA)],
      givens: [binding('hex', ee('x', AND(appE('P', [xL]), appE('Q', [xL])))), binding('hpc', fa('X', IMPLIES(appE('P', [X]), C)))],
      goal: C, prereqs: ['13.1'], hint: 'Obtain a witness; the potion that comes with it is a conjunction, so take the half hpc wants before instantiating.', needs: [] },
    { id: '13.4', kind: 'lemma', leanName: 'forall_not_not_exists', chapter: 13, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }], terms: [X],
      givens: [binding('hfn', fa('X', NOT(appE('P', [X]))))], goal: NOT(ee('X', appE('P', [X]))), prereqs: ['13.1'], qed: '22.3(a)', qedNote: 'the other direction of QED’s biconditional', hint: 'To prove the negation of an existence statement, assume that statement, obtain a witness from it, and contradict hfn at the obtained variable.', needs: [] },

    // ---------- Chapter 14: Picking an inhabitant ----------
    // Every sort in the game is NONEMPTY, so one can "pick a : Ω arbitrarily" (a new recipe that adds a
    // variable directly to the context, no ∃/witness hypothesis). 14.1: from ∀x, A (A not depending on x) deduce A —
    // provable only because Ω is inhabited (pick a witness, then instantiate). Minted as the reusable `forall_const'`.
    { id: '14.1', kind: 'lemma', leanName: "forall_const'", chapter: 14, sorts: [OMEGA], nonempty: [OMEGA], terms: [varE('a', OMEGA)],
      givens: [binding('hA', fa('X', A))], goal: A, prereqs: ['13.1'], qed: '21.1', qedNote: 'QED’s "pull" for arbitrary variables', hint: 'To instantiate a ∀ you need something to instantiate it at, and nothing is given. Every sort in the game is nonempty, so select the gem a and use the Pick card to place an arbitrary inhabitant in the context. Then instantiate hA at it.', needs: ['pick'] },

    // ---------- Chapter 15: Existential introduction ----------
    // EXISTENTIAL INTRODUCTION: from a proof of P(t) and a witness term t, conclude ∃x, P(x). The witness
    // occurrences are abstracted, and since that choice is not unique the player selects among the finitely-many results
    // (e.g. Q(α,α) offers ∃x,Q(x,x) / ∃x,Q(x,α) / ∃x,Q(α,x) / ∃x,Q(α,α)). 15.1 introduces it; 15.2 is the ∀→∃ implication
    // (needs a witness, so pick one first — Chapter 14); 15.3 is the four-way choice exercise.
    { id: '15.1', kind: 'example', chapter: 15, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }], consts: [{ name: 'α', sort: OMEGA }], terms: [alpha],
      givens: [binding('hP', appE('P', [alpha]))], goal: ee('x', appE('P', [xL])), prereqs: ['14.1'], hint: 'Select the potion hP and the term α, then brew Exists.intro. It offers every way of abstracting α out of P(α) — here there is only one, but choosing is the point.', needs: ['exists_intro'] },
    { id: '15.2', kind: 'lemma', leanName: 'exists_of_forall', chapter: 15, sorts: [OMEGA], nonempty: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }], terms: [varE('a', OMEGA)],
      givens: [binding('h', fa('X', appE('P', [X])))], goal: ee('x', appE('P', [xL])), prereqs: ['15.1'], qed: '22.2', hint: 'There is nothing to witness with, so pick an arbitrary inhabitant first, instantiate h there, and use that same variable as the witness.', needs: [] },
    { id: '15.3', kind: 'example', chapter: 15, sorts: [OMEGA], preds: [{ name: 'Q', argSorts: [OMEGA, OMEGA], resultSort: PROP }], consts: [{ name: 'α', sort: OMEGA }], terms: [alpha],
      givens: [binding('hQ', appE('Q', [alpha, alpha]))], goal: ee('x', appE('Q', [xL, xL])), prereqs: ['15.1'], hint: 'One brew: the goal abstracts both slots of Q(α, α) at once, and Exists.intro offers that among its choices.', needs: [] },
    // rest of QED §22 (obtain + instantiate + ∃-intro + reductio). QED 22.6(c) (bound-variable renaming) does NOT
    // port — α-equivalence is automatic here. 15.4 = QED 22.1 (∃-intro into a conjunction, a real abstraction choice);
    // 15.5 = QED 22.3(a) quantifier De Morgan; 15.6/b = QED 22.4(a)/(b) syllogisms; 15.11/b = QED 22.6(a)/(b) swaps.
    { id: '15.4', kind: 'example', chapter: 15, sorts: [OMEGA], preds: [{ name: 'Q', argSorts: [OMEGA, OMEGA], resultSort: PROP }], consts: [{ name: 'α', sort: OMEGA }], terms: [alpha],
      givens: [binding('hQ', appE('Q', [alpha, alpha]))], goal: ee('X', AND(appE('Q', [alpha, X]), appE('Q', [X, alpha]))), prereqs: ['15.1'], qed: '22.1', hint: 'Pair hQ with itself first, then abstract α out of both slots. Exists.intro offers every way of doing it and the goal says which one you want.', needs: [] },
    { id: '15.5', kind: 'example', chapter: 15, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }], terms: [X],
      givens: [], goal: IFF(NOT(ee('X', appE('P', [X]))), fa('X', NOT(appE('P', [X])))), prereqs: ['15.1'], qed: '22.3(a)', hint: 'Forwards, assume the negated existence statement, introduce X, assume P(X), and witness the existence statement at X — a contradiction, so ¬ P(X). Backwards, assume the quantified statement and the existence statement, obtain a witness, and contradict the instantiated potion.', needs: [] },
    { id: '15.6', kind: 'example', chapter: 15, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }, { name: 'Q', argSorts: [OMEGA], resultSort: PROP }, { name: 'R', argSorts: [OMEGA], resultSort: PROP }], terms: [X],
      givens: [binding('hnpq', NOT(ee('X', AND(appE('P', [X]), appE('Q', [X]))))), binding('hRP', fa('X', IMPLIES(appE('R', [X]), appE('P', [X]))))],
      goal: NOT(ee('X', AND(appE('R', [X]), appE('Q', [X])))), prereqs: ['15.1'], qed: '22.4(a)', hint: 'Assume the existence statement you are negating and obtain its witness, carry R across hRP to P, repack the conjunction, and contradict hnpq.', needs: [] },
    { id: '15.7', kind: 'example', chapter: 15, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }, { name: 'Q', argSorts: [OMEGA], resultSort: PROP }, { name: 'R', argSorts: [OMEGA], resultSort: PROP }], terms: [X],
      givens: [binding('hPQ', fa('X', IMPLIES(appE('P', [X]), appE('Q', [X])))), binding('hex', ee('X', AND(appE('R', [X]), appE('P', [X]))))],
      goal: ee('X', AND(appE('R', [X]), appE('Q', [X]))), prereqs: ['15.1'], qed: '22.4(b)', hint: 'Obtain the witness from hex, carry its P half across hPQ, repack, and witness the goal at the same variable.', needs: [] },
    // 15.8 = QED 22.4(c): derive an ∃ whose body has a negation proved by an inner reductio
    { id: '15.8', kind: 'example', chapter: 15, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }, { name: 'Q', argSorts: [OMEGA], resultSort: PROP }, { name: 'R', argSorts: [OMEGA], resultSort: PROP }], terms: [X],
      givens: [binding('hnpq', NOT(ee('X', AND(appE('P', [X]), appE('Q', [X]))))), binding('hex', ee('X', AND(appE('R', [X]), appE('P', [X]))))],
      goal: ee('X', AND(appE('R', [X]), NOT(appE('Q', [X])))), prereqs: ['15.1'], qed: '22.4(c)', hint: 'Obtain the witness. For the ¬ Q half, assume Q at that witness, build the forbidden existence statement, and contradict hnpq — the reductio hands you ¬ Q right there.', needs: [] },
    // 15.9 = QED 22.5(a): a chained syllogism with an existential witness
    { id: '15.9', kind: 'example', chapter: 15, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }, { name: 'Q', argSorts: [OMEGA], resultSort: PROP }, { name: 'R', argSorts: [OMEGA], resultSort: PROP }], terms: [X],
      givens: [binding('hPQ', fa('X', IMPLIES(appE('P', [X]), appE('Q', [X])))), binding('hQR', fa('X', IMPLIES(appE('Q', [X]), appE('R', [X])))), binding('hex', ee('X', appE('P', [X])))],
      goal: ee('X', AND(appE('P', [X]), appE('R', [X]))), prereqs: ['15.1'], qed: '22.5(a)', hint: 'Obtain the witness and walk it along both implications in turn. Everything happens at the one variable.', needs: [] },
    // 15.10 = QED 22.8: a ∀-goal syllogism combining instantiation, chaining and an inner reductio
    { id: '15.10', kind: 'example', chapter: 15, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }, { name: 'Q', argSorts: [OMEGA], resultSort: PROP }, { name: 'R', argSorts: [OMEGA], resultSort: PROP }, { name: 'S', argSorts: [OMEGA], resultSort: PROP }], terms: [X],
      givens: [binding('hPnQ', fa('X', IMPLIES(appE('P', [X]), NOT(appE('Q', [X]))))), binding('hnQR', fa('X', IMPLIES(NOT(appE('Q', [X])), appE('R', [X])))), binding('hnrs', NOT(ee('X', AND(appE('R', [X]), appE('S', [X])))))],
      goal: fa('X', IMPLIES(appE('P', [X]), NOT(appE('S', [X])))), prereqs: ['15.1'], qed: '22.8', hint: 'Introduce X and assume P(X); the two quantified potions carry it to R(X). Then assume S(X), build the forbidden existence statement, and contradict hnrs — two discharges put the arrow and the ∀ back.', needs: [] },
    { id: '15.11', kind: 'example', chapter: 15, sorts: [OMEGA], preds: [{ name: 'Q', argSorts: [OMEGA, OMEGA], resultSort: PROP }], terms: [X, Y],
      givens: [binding('h', ee('Y', ee('X', appE('Q', [X, Y]))))], goal: ee('X', ee('Y', appE('Q', [X, Y]))), prereqs: ['15.1'], qed: '22.6(a)', hint: 'Obtain twice, once from each layer, then witness the goal in the other order: the inner existence statement first, then the outer.', needs: [] },
    { id: '15.12', kind: 'example', chapter: 15, sorts: [OMEGA], preds: [{ name: 'Q', argSorts: [OMEGA, OMEGA], resultSort: PROP }], terms: [X, Y],
      givens: [binding('h', ee('Y', fa('X', appE('Q', [X, Y]))))], goal: fa('X', ee('Y', appE('Q', [X, Y]))), prereqs: ['15.1'], qed: '22.6(b)', hint: 'Obtain the witness from h — what comes with it is a quantified statement — then introduce X, instantiate, and witness the inner existence statement at the obtained variable. Discharge once.', needs: [] },
    // Helper lemmas → heavier claims via MATCHING (a Grimoire capability QED lacked). The directional De Morgan halves
    // (15.13/13.4) MINT reusable recipes (the hypothesis pins the predicate P, so they are determinate). 12.8
    // `forall_dne` reuses the earlier `not_not_elim` (9.2) under a ∀. The classical De Morgan 15.14 then accelerates:
    // `not_exists_forall_not` fires on `¬∃X,¬P X` (its predicate metavar solved to λx.¬P x by higher-order matching),
    // then `forall_dne`, then `not_not_elim` — a few steps instead of ~20 raw ones.
    { id: '15.13', kind: 'lemma', leanName: 'not_exists_forall_not', chapter: 15, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }], terms: [X],
      givens: [binding('hne', NOT(ee('X', appE('P', [X]))))], goal: fa('X', NOT(appE('P', [X]))), prereqs: ['15.1'], qed: '22.3(a)', qedNote: 'one direction of QED’s biconditional', hint: 'Introduce X, assume P(X), and witnessing the existence statement at X contradicts hne. Solving it adds a recipe that two later levels reuse.', needs: [] },
    // 15.14 = QED 22.3(b): classical De Morgan `¬∀X,P ↔ ∃X,¬P` — the heavy claim; the forward direction reuses 15.13 + 12.8 + not_not_elim
    { id: '15.14', kind: 'lemma', leanName: 'not_forall_iff_exists_not', chapter: 15, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }], terms: [X],
      givens: [], goal: IFF(NOT(fa('X', appE('P', [X]))), ee('X', NOT(appE('P', [X])))), prereqs: ['12.8', '15.13'], qed: '22.3(b)', hint: 'Forwards is the delicate half: assume both negations, and not_exists_forall_not and forall_dne — both recipes already — carry you to a contradiction with the first. Backwards, assume the existence statement and the quantified one, obtain a witness, and contradict.', needs: [] },
    // 15.15/e = QED 22.4(d)/(e) and 15.17–e = QED 22.5(b)–(e): the rest of the syllogism family. All follow the
    // same shape — unearth a witness from the ∃, derive the missing component at that witness, then ∃-introduce
    // back. 15.15 additionally reuses the minted `mt'` (8.4) at the witness, and 15.17/c/d get their negated
    // component from an inner reductio against the ¬∃ hypothesis.
    { id: '15.15', kind: 'example', chapter: 15, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }, { name: 'Q', argSorts: [OMEGA], resultSort: PROP }, { name: 'R', argSorts: [OMEGA], resultSort: PROP }], terms: [X],
      givens: [binding('hPQ', fa('X', IMPLIES(appE('P', [X]), appE('Q', [X])))), binding('hex', ee('X', AND(appE('R', [X]), NOT(appE('Q', [X])))))],
      goal: ee('X', AND(appE('R', [X]), NOT(appE('P', [X])))), prereqs: ['8.4', '15.1'], qed: '22.4(d)', hint: "Obtain the witness; mt' turns the instantiated hPQ into an implication from ¬ Q to ¬ P, which is exactly what the witness carries.", needs: [] },
    { id: '15.16', kind: 'example', chapter: 15, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }, { name: 'Q', argSorts: [OMEGA], resultSort: PROP }, { name: 'R', argSorts: [OMEGA], resultSort: PROP }], terms: [X],
      givens: [binding('hex', ee('X', AND(appE('P', [X]), NOT(appE('Q', [X]))))), binding('hPR', fa('X', IMPLIES(appE('P', [X]), appE('R', [X]))))],
      goal: ee('X', AND(appE('R', [X]), NOT(appE('Q', [X])))), prereqs: ['15.1'], qed: '22.4(e)', hint: 'Obtain the witness, carry its P half across hPR, and keep the ¬ Q half as it stands.', needs: [] },
    { id: '15.17', kind: 'example', chapter: 15, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }, { name: 'Q', argSorts: [OMEGA], resultSort: PROP }, { name: 'R', argSorts: [OMEGA], resultSort: PROP }], terms: [X],
      givens: [binding('hnpq', NOT(ee('X', AND(appE('P', [X]), appE('Q', [X]))))), binding('hRP', fa('X', IMPLIES(appE('R', [X]), appE('P', [X])))), binding('hex', ee('X', appE('R', [X])))],
      goal: ee('X', AND(appE('R', [X]), NOT(appE('Q', [X])))), prereqs: ['15.1'], qed: '22.5(b)', hint: 'Obtain the witness and carry it across hRP to P. For the ¬ Q half, assume Q there and contradict hnpq.', needs: [] },
    { id: '15.18', kind: 'example', chapter: 15, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }, { name: 'Q', argSorts: [OMEGA], resultSort: PROP }, { name: 'R', argSorts: [OMEGA], resultSort: PROP }], terms: [X],
      givens: [binding('hPQ', fa('X', IMPLIES(appE('P', [X]), appE('Q', [X])))), binding('hnrq', NOT(ee('X', AND(appE('R', [X]), appE('Q', [X]))))), binding('hex', ee('X', appE('R', [X])))],
      goal: ee('X', AND(appE('R', [X]), NOT(appE('P', [X])))), prereqs: ['15.1'], qed: '22.5(c)', hint: 'Obtain the witness. For the ¬ P half, assume P there, push it along hPQ, build the forbidden existence statement and contradict hnrq.', needs: [] },
    { id: '15.19', kind: 'example', chapter: 15, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }, { name: 'Q', argSorts: [OMEGA], resultSort: PROP }, { name: 'R', argSorts: [OMEGA], resultSort: PROP }], terms: [X],
      givens: [binding('hnpq', NOT(ee('X', AND(appE('P', [X]), appE('Q', [X]))))), binding('hPR', fa('X', IMPLIES(appE('P', [X]), appE('R', [X])))), binding('hex', ee('X', appE('P', [X])))],
      goal: ee('X', AND(appE('R', [X]), NOT(appE('Q', [X])))), prereqs: ['15.1'], qed: '22.5(d)', qedNote: 'the Felapton syllogism; QED arranges the premises differently', hint: 'Obtain the witness and carry it across hPR for the R half; for the ¬ Q half, assume Q there and contradict hnpq.', needs: [] },
    { id: '15.20', kind: 'example', chapter: 15, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }, { name: 'Q', argSorts: [OMEGA], resultSort: PROP }, { name: 'R', argSorts: [OMEGA], resultSort: PROP }], terms: [X],
      givens: [binding('hPQ', fa('X', IMPLIES(appE('P', [X]), appE('Q', [X])))), binding('hPR', fa('X', IMPLIES(appE('P', [X]), appE('R', [X])))), binding('hex', ee('X', appE('P', [X])))],
      goal: ee('X', AND(appE('R', [X]), appE('Q', [X]))), prereqs: ['15.1'], qed: '22.5(e)', hint: 'One witness serves both halves: obtain it, and apply each quantified potion to it in turn.', needs: [] },
    // 15.21 = QED 22.7: two independent existentials may be merged into a nested one, and split back out.
    // The ∧ never mixes the witnesses, which is exactly why both directions go through.
    { id: '15.21', kind: 'lemma', leanName: "exists_and_iff'", chapter: 15, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }, { name: 'Q', argSorts: [OMEGA], resultSort: PROP }], terms: [X, Y],
      givens: [], formulas: [AND(ee('X', appE('P', [X])), ee('Y', appE('Q', [Y]))), ee('X', ee('Y', AND(appE('P', [X]), appE('Q', [Y]))))],
      goal: IFF(AND(ee('X', appE('P', [X])), ee('Y', appE('Q', [Y]))), ee('X', ee('Y', AND(appE('P', [X]), appE('Q', [Y]))))), prereqs: ['15.1'], qed: '22.7', hint: 'Forwards, assume the conjunction and obtain a witness from each side — two different variables — then nest the two existence statements. Backwards, obtain twice from the nested statement and split the conjunction between the two separate ones.', needs: [] },

    // ---------- Chapter 16: Sorts and relations ----------
    // SORTS WITH OPERATIONS. `Set` is an ABSTRACT sort — a carrier equipped with a
    // membership relation, emitted as a `variable` preamble (never an `axiom`), so each theorem reads
    // "for any type with such a relation …". Note nothing here can be proved ABOUT ∈ yet: without equality
    // an operation is opaque, so the facts you need arrive as hypotheses. That is the cliffhanger for Ch 18.
    // 16.1 is the notation drill (QED 23.1b's role); 16.2 is Russell's paradox (QED 23.2), which needs only
    // a relation — no operations — and which Grimoire can state honestly as `False` where QED writes ¬True.
    { id: '16.1', kind: 'example', chapter: 16, sorts: [SET], terms: [setV('X'), setV('Y')],
      givens: [], formulas: [],
      goal: faS('X', SET, faS('Y', SET, IMPLIES(mem(setV('Y'), setV('X')), mem(setV('Y'), setV('X'))))),
      prereqs: ['15.1'], qed: '23.1(b)', qedNote: 'the analogous exercise over a different relation', hint: 'The same shape as the ∀ tutorial, one level deeper and over a new sort. Introduce X, then Y, then form Y ∈ X and Assume it — and discharge three times.', needs: ['sets'] },
    // 16.2 (QED 23.2) Russell's paradox — an optional side-quest, disjoint from the algebra of ∪ and ∩:
    // it needs only membership, and it is where a set theory this naive is shown to break.
    { id: '16.2', kind: 'example', chapter: 16, sorts: [SET], terms: [],
      givens: [binding('hR', eeS('X', SET, faS('Y', SET, IFF(mem(setV('Y'), setV('X')), NOT(mem(setV('Y'), setV('Y')))))))],
      formulas: [FALSE()], goal: FALSE(), prereqs: ['16.1'], qed: '23.2', qedNote: 'Russell’s paradox', hint: 'Russell’s paradox. Obtain the set r, instantiate its defining property at r itself, and the biconditional r ∈ r ↔ ¬ (r ∈ r) does the rest: assume r ∈ r for a reductio, and the ¬ (r ∈ r) that comes out then proves r ∈ r.', needs: [] },   // an optional leaf: it leads nowhere on purpose

    // ---------- Chapter 17: Operations and compound terms ----------
    // OPERATIONS. The sort M is a magma — a carrier with a constant c,
    // a unary f and a binary ∗, and NO axioms at all. Nothing can be proved about them, which is the point:
    // these five drills are about BUILDING terms and putting them where a variable would go. `c` arrives in
    // the term bench on its own, because a 0-ary operation belongs to the sort rather than to the exercise.
    { id: '17.1', kind: 'example', chapter: 17, sorts: [MAGMA], preds: [{ name: 'P', argSorts: [MAGMA], resultSort: PROP }], terms: [varE('x', MAGMA)],
      givens: [], formulas: [],
      goal: faS('x', MAGMA, IMPLIES(appE('P', [appE('f', [varE('x', MAGMA)])]), appE('P', [appE('f', [varE('x', MAGMA)])]))), prereqs: ['16.1'], qed: '23.1(c)', qedNote: 'a predicate of a compound term, over a different operation', hint: 'Introduce the gem x, then BUILD the term f(x) on the term bench. Use that to form P(f(x)), Assume it, and discharge twice.', needs: ['ops'] },
    { id: '17.2', kind: 'example', chapter: 17, sorts: [MAGMA], preds: [{ name: 'P', argSorts: [MAGMA], resultSort: PROP }], terms: [],
      givens: [binding('h', faS('x', MAGMA, appE('P', [varE('x', MAGMA)])))], formulas: [],
      goal: appE('P', [appE('c', [])]), prereqs: ['17.1'], hint: 'A constant is a term like any other: instantiate h at c.', needs: [] },
    // 17.3: the same move, but the term must be BUILT first — f(c) ∗ c
    { id: '17.3', kind: 'example', chapter: 17, sorts: [MAGMA], preds: [{ name: 'P', argSorts: [MAGMA], resultSort: PROP }], terms: [],
      givens: [binding('h', faS('x', MAGMA, appE('P', [varE('x', MAGMA)])))], formulas: [],
      goal: appE('P', [appE('star', [appE('f', [appE('c', [])]), appE('c', [])])]), prereqs: ['17.1'], hint: 'Build the compound term on the term bench first, then instantiate h at it — a ∀ can be instantiated at anything of the right sort, however it is built.', needs: [] },
    // 17.4: a COMPOUND ∃-witness. Q(f c, f c) abstracts three ways over f c — pick the one asked for.
    { id: '17.4', kind: 'example', chapter: 17, sorts: [MAGMA], preds: [{ name: 'Q', argSorts: [MAGMA, MAGMA], resultSort: PROP }], terms: [],
      givens: [binding('hQ', appE('Q', [appE('f', [appE('c', [])]), appE('f', [appE('c', [])])]))], formulas: [],
      goal: eeS('x', MAGMA, appE('Q', [varE('x', MAGMA), appE('f', [appE('c', [])])])), prereqs: ['17.1'], hint: 'Exists.intro offers one result per way of abstracting f(c) out of Q(f(c), f(c)). The goal keeps the second slot fixed, so pick that abstraction.', needs: [] },

    // ---------- Chapter 18: Equality and rewriting ----------
    // 18.2: rewriting reaches INSIDE a term — α sits under f, and only the equation α = β is given.
    // EQUALITY. Largely original: QED supplies only symmetry and transitivity, and
    // here even those are EXERCISES rather than primitives. The chapter has just two primitives —
    // `Eq.refl` (a term equals itself) and `rw` (rewrite some occurrences along an equation) — and every
    // other fact is derived from them. `rw` reuses ∃-introduction's finite-choice machinery, so choosing
    // WHICH occurrences move is part of the puzzle (18.4 is where that first bites).
    // Equality is also the one relation every sort shares, so these lemmas serve every later chapter.
    { id: '18.1', kind: 'example', chapter: 18, sorts: [OMEGA], consts: [cO('α')], terms: [alpha],
      givens: [], formulas: [], goal: eq(alpha, alpha), prereqs: ['17.1'], hint: 'Select the term α and brew Eq.refl — everything equals itself. Its partner rw, which rewrites along an equation, arrives next.', needs: ['eq'] },
    // 18.2 lives here rather than in Chapter 17: it is an operations exercise, but the only way to move the
    // equation through `f` is `rw`, so it cannot open before the equality tutorial that introduces `rw`.
    { id: '18.2', kind: 'example', chapter: 18, sorts: [MAGMA], preds: [{ name: 'P', argSorts: [MAGMA], resultSort: PROP }], consts: [{ name: 'α', sort: MAGMA }, { name: 'β', sort: MAGMA }], terms: [varE('α', MAGMA), varE('β', MAGMA)],
      givens: [binding('hP', appE('P', [appE('f', [varE('α', MAGMA)])])), binding('hab', appE('EQ', [varE('α', MAGMA), varE('β', MAGMA)]))],
      formulas: [], goal: appE('P', [appE('f', [varE('β', MAGMA)])]), prereqs: ['18.1'], qed: '24.2', qedNote: 'substitution under a function symbol', hint: 'rw rewrites along an equation, and it will reach inside a term: hab moves the α buried under f.', needs: [] },
    { id: '18.3', kind: 'example', chapter: 18, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }], consts: [cO('α'), cO('β')], terms: [alpha, beta],
      givens: [binding('hP', appE('P', [alpha])), binding('hab', eq(alpha, beta))],
      formulas: [], goal: appE('P', [beta]), prereqs: ['18.1'], hint: 'One rewrite of hP along hab.', needs: [] },
    // 18.4: Q(α,α) has TWO occurrences of α, so rewriting offers Q(β,α), Q(α,β) and Q(β,β) — pick one.
    { id: '18.4', kind: 'example', chapter: 18, sorts: [OMEGA], preds: [{ name: 'Q', argSorts: [OMEGA, OMEGA], resultSort: PROP }], consts: [cO('α'), cO('β')], terms: [alpha, beta],
      givens: [binding('hQ', appE('Q', [alpha, alpha])), binding('hab', eq(alpha, beta))],
      formulas: [], goal: appE('Q', [alpha, beta]), prereqs: ['18.1'], hint: 'Q(α, α) offers a rewrite at each occurrence of α. The goal says which one moves.', needs: [] },
    // 18.5: symmetry (QED 24.1a) — rewrite inside `α = α` itself. The prettiest use of the two primitives.
    { id: '18.5', kind: 'lemma', leanName: "Eq.symm'", chapter: 18, sorts: [OMEGA], consts: [cO('α'), cO('β')], terms: [alpha, beta],
      givens: [binding('hab', eq(alpha, beta))], formulas: [], goal: eq(beta, alpha), prereqs: ['18.1'], qed: '24.1(a)', hint: 'Symmetry out of nothing but reflexivity: start from α = α and rewrite its left-hand α along hab.', needs: [] },
    // 18.6: transitivity (QED 24.1b) — a single rewrite of the first equation along the second.
    { id: '18.6', kind: 'lemma', leanName: "Eq.trans'", chapter: 18, sorts: [OMEGA], consts: [cO('α'), cO('β'), cO('γ')], terms: [alpha, beta, gamma],
      givens: [binding('hab', eq(alpha, beta)), binding('hbc', eq(beta, gamma))], formulas: [], goal: eq(alpha, gamma), prereqs: ['18.1'], qed: '24.1(b)', hint: 'Rewrite the β in hab along hbc. One brew.', needs: [] },
    // 18.7: congruence as a ↔ — needs BOTH directions, so it reuses the minted Eq.symm' to rewrite backwards.
    { id: '18.7', kind: 'lemma', leanName: "Eq.congr_iff'", chapter: 18, sorts: [OMEGA], preds: [{ name: 'P', argSorts: [OMEGA], resultSort: PROP }], consts: [cO('α'), cO('β')], terms: [alpha, beta],
      givens: [binding('hab', eq(alpha, beta))], formulas: [appE('P', [alpha]), appE('P', [beta])],
      goal: IFF(appE('P', [alpha]), appE('P', [beta])), prereqs: ['18.5'], hint: "Forwards is a rewrite under an assumption. Backwards needs the equation the other way round, which the Eq.symm' you have just proved supplies — note that a minted lemma asks for its constants as terms.", needs: [] },
    // SETS. Two sets are equal when they have the same members, so each law below
    // is the propositional law of Chapter 2 or 6, transported through membership by extensionality.
    { id: '18.8', kind: 'lemma', leanName: "union_comm'", chapter: 18, sorts: [SET],
      consts: [{ name: 'a', sort: SET }, { name: 'b', sort: SET }], terms: [sv2('a'), sv2('b')],
      givens: [], formulas: [],
      goal: appE('EQ', [sunion(sv2('a'), sv2('b')), sunion(sv2('b'), sv2('a'))]), prereqs: ['6.2', '7.2', '7.3', '18.1'], hint: "Extensionality says two sets are equal when they have the same members. So fix an arbitrary x, unfold both sides with mem_union, bridge the two bodies with Or.symm' in each direction, chain the biconditionals, and hand the quantified result to ext.", needs: [] },
    { id: '18.9', kind: 'lemma', leanName: "inter_comm'", chapter: 18, sorts: [SET],
      consts: [{ name: 'a', sort: SET }, { name: 'b', sort: SET }], terms: [sv2('a'), sv2('b')],
      givens: [], formulas: [],
      goal: appE('EQ', [sinter(sv2('a'), sv2('b')), sinter(sv2('b'), sv2('a'))]), prereqs: ['4.8', '7.2', '7.3', '18.1'], hint: "The same shape as union commutativity, with mem_inter and And.symm' in place of mem_union and Or.symm'.", needs: [] },
    // 18.10: the capstone. Distributivity of ∩ over ∪ is exactly the propositional distributivity of
    // Chapter 6 (and_or_left' / and_or_left_rev), carried across membership in both directions.
    { id: '18.10', kind: 'lemma', leanName: "inter_union_distrib'", chapter: 18, sorts: [SET],
      consts: [{ name: 'a', sort: SET }, { name: 'b', sort: SET }, { name: 'c', sort: SET }],
      terms: [sv2('a'), sv2('b'), sv2('c')], givens: [], formulas: [],
      goal: appE('EQ', [sinter(sv2('a'), sunion(sv2('b'), sv2('c'))),
                        sunion(sinter(sv2('a'), sv2('b')), sinter(sv2('a'), sv2('c')))]), prereqs: ['6.5', '6.11', '6.12', '7.2', '7.9', '18.1'], hint: "The longest level in the game, and mechanical throughout: fix x, unfold every membership with mem_inter and mem_union, and what is left is the propositional distributive law from Chapter 6 — and_or_left' forwards, and_or_left_rev back. Then pack the memberships up again and apply ext.", needs: [] },
    // 18.11–18.12: associativity, the same shape again — the bridge is Chapter 2/6's associativity, with the
    // left- and right-slot congruences (7.5/7.6, 7.9/7.10) reaching into whichever operand is unfolded.
    { id: '18.11', kind: 'lemma', leanName: "union_assoc'", chapter: 18, sorts: [SET],
      consts: [{ name: 'a', sort: SET }, { name: 'b', sort: SET }, { name: 'c', sort: SET }],
      terms: [sv2('a'), sv2('b'), sv2('c')], givens: [], formulas: [],
      goal: appE('EQ', [sunion(sunion(sv2('a'), sv2('b')), sv2('c')), sunion(sv2('a'), sunion(sv2('b'), sv2('c')))]),
      prereqs: ['6.9', '7.2', '7.6', '7.10', '18.1'], hint: "Unfold the nested operand on each side, re-associate with the Chapter 6 lemma, and use Or.congr_left' and Or.congr_right' to reach into whichever operand was unfolded. Then ext.", needs: [] },
    { id: '18.12', kind: 'lemma', leanName: "inter_assoc'", chapter: 18, sorts: [SET],
      consts: [{ name: 'a', sort: SET }, { name: 'b', sort: SET }, { name: 'c', sort: SET }],
      terms: [sv2('a'), sv2('b'), sv2('c')], givens: [], formulas: [],
      goal: appE('EQ', [sinter(sinter(sv2('a'), sv2('b')), sv2('c')), sinter(sv2('a'), sinter(sv2('b'), sv2('c')))]),
      prereqs: ['2.3', '7.2', '7.5', '7.9', '18.1'], hint: 'The same route as union associativity, with mem_inter and the two And congruences.', needs: [] },
    // 18.13: the dual capstone — ∪ over ∩, from or_and_left' / or_and_left_rev.
    { id: '18.13', kind: 'lemma', leanName: "union_inter_distrib'", chapter: 18, sorts: [SET],
      consts: [{ name: 'a', sort: SET }, { name: 'b', sort: SET }, { name: 'c', sort: SET }],
      terms: [sv2('a'), sv2('b'), sv2('c')], givens: [], formulas: [],
      goal: appE('EQ', [sunion(sv2('a'), sinter(sv2('b'), sv2('c'))),
                        sinter(sunion(sv2('a'), sv2('b')), sunion(sv2('a'), sv2('c')))]), prereqs: ['6.10', '6.13', '7.2', '7.5', '7.9', '7.10', '18.1'], hint: "The dual of the ∩-over-∪ law: or_and_left' forwards and or_and_left_rev back. Both operands of the ∩ need unfolding this time, so both congruences appear.", needs: [] },

    // ---------- Chapter 19: Theories with axioms ----------
    // GROUPS — the first branch chapter, and the first theory with AXIOMS.
    // The five axioms are in hand from the start because they belong to the sort, not to the exercise:
    // no exercise restates them. They reach Lean as `variable` hypotheses, so each theorem holds of any
    // group and nothing is ever declared with `axiom`.
    // 19.1 (QED 24.3): a left identity and a right identity must coincide. Needs no group axiom at all —
    // it is pure equality reasoning, which makes it the gentle way in.
    { id: '19.1', kind: 'example', chapter: 19, sorts: [GRP], consts: [{ name: 'α', sort: GRP }, { name: 'β', sort: GRP }], terms: [gv('α'), gv('β')],
      givens: [binding('hL', faS('x', GRP, appE('EQ', [gmul(gv('α'), gv('x')), gv('x')]))),
               binding('hR', faS('x', GRP, appE('EQ', [gmul(gv('x'), gv('β')), gv('x')])))],
      formulas: [], goal: appE('EQ', [gv('α'), gv('β')]), prereqs: ['18.1'], qed: '24.3', hint: 'Instantiate hL at β to get α · β = β, and hR at α to get α · β = α. Two equations sharing a left-hand side: select them and brew rw to rewrite one along the other, then choose α = β.', needs: ['groups'] },
    // 19.2: the inverse of the identity is the identity — the first proof that actually uses the axioms.
    { id: '19.2', kind: 'lemma', leanName: "inv_one'", chapter: 19, sorts: [GRP], consts: [], terms: [],
      givens: [], formulas: [], goal: appE('EQ', [ginv(g1), g1]), prereqs: ['19.1'], hint: 'inv(1) · 1 is two things at once: inv(1) by mul_one, and 1 by inv_mul. Instantiate both axioms there and rewrite one equation along the other.', needs: [] },
    // 19.3 (QED 24.4): left cancellation. The long one, and the first proof that needs an equation read
    // BACKWARDS — which is Eq.symm' (18.5) applied at G, i.e. the payoff of sort polymorphism.
    { id: '19.3', kind: 'lemma', leanName: "mul_left_cancel'", chapter: 19, sorts: [GRP],
      consts: [{ name: 'α', sort: GRP }, { name: 'β', sort: GRP }, { name: 'γ', sort: GRP }],
      terms: [gv('α'), gv('β'), gv('γ')],
      givens: [binding('h', appE('EQ', [gmul(gv('α'), gv('β')), gmul(gv('α'), gv('γ'))]))],
      formulas: [], goal: appE('EQ', [gv('β'), gv('γ')]), prereqs: ['18.5', '19.1'], qed: '24.4', qedNote: 'the cancellation law; QED carries the group axioms as premises', hint: "What you want is to multiply h on the left by inv(α), and rewriting is how that is done: β = 1 · β = (inv(α) · α) · β = inv(α) · (α · β), then h, then back down the same ladder to γ. Eq.symm' turns an equation round whenever a rewrite needs it the other way.", needs: [] },
    // 19.4 (QED 24.6): the inverse is an involution. A pure chain of rewrites through the axioms.
    { id: '19.4', kind: 'lemma', leanName: "inv_inv'", chapter: 19, sorts: [GRP], consts: [{ name: 'α', sort: GRP }], terms: [gv('α')],
      givens: [], formulas: [], goal: appE('EQ', [ginv(ginv(gv('α'))), gv('α')]), prereqs: ['18.5', '19.1'], qed: '24.6', qedNote: 'the inverse is an involution; QED carries the group axioms as premises', hint: 'The same ladder as cancellation, and shorter: α = 1 · α = (inv(inv(α)) · inv(α)) · α = inv(inv(α)) · (inv(α) · α) = inv(inv(α)) · 1 = inv(inv(α)).', needs: [] },
    // 19.5 (QED 24.5): the inverse of a product reverses it. The chapter's capstone — it shows that
    // (α·β)·(inv β·inv α) = 1, matches that against (α·β)·inv(α·β) = 1, and CANCELS with the minted 19.3.
    { id: '19.5', kind: 'lemma', leanName: "mul_inv_rev'", chapter: 19, sorts: [GRP], consts: [{ name: 'α', sort: GRP }, { name: 'β', sort: GRP }], terms: [gv('α'), gv('β')],
      givens: [], formulas: [], goal: appE('EQ', [ginv(gmul(gv('α'), gv('β'))), gmul(ginv(gv('β')), ginv(gv('α')))]), prereqs: ['19.3'], hint: 'Show that (α · β) · (inv(β) · inv(α)) = 1 by rewriting the middle away, match that against the axiom (α · β) · inv((α · β)) = 1, and cancel α · β on the left with the lemma from two levels back.', needs: [] },

    // ---------- Chapter 20: Induction ----------
    // PEANO ARITHMETIC. The first CONCRETE sort: `Nat` is a real type in its own
    // Lean module, so the proof `import`s it instead of quantifying over a carrier. Its two defining
    // equations give `a + 0` and `a + succ b`; everything on the LEFT has to be earned by induction.
    { id: '20.1', kind: 'lemma', leanName: "zero_add'", chapter: 20, sorts: [NAT], terms: [nv('n')],
      givens: [], formulas: [],
      goal: faS('a', NAT, appE('EQ', [nadd(n0, nv('a')), nv('a')])), prereqs: ['19.1'], hint: 'Induction wants a base case and a step. For the base, instantiate add_zero at 0 to get 0 + 0 = 0. For the step, introduce the gem n and Assume 0 + n = n, then reach 0 + succ n = succ n (instantiate add_succ at 0 and at n, then rw with the assumption) and discharge twice. Finally brew induction on the base and the step.', needs: ['induction'] },
    // 20.2: the other half of the asymmetry. `a + succ b` is definitional; `succ a + b` must be earned.
    { id: '20.2', kind: 'lemma', leanName: "succ_add'", chapter: 20, sorts: [NAT], terms: [nv('n')],
      givens: [], formulas: [],
      goal: faS('a', NAT, faS('b', NAT, appE('EQ', [nadd(nsucc(nv('a')), nv('b')), nsucc(nadd(nv('a'), nv('b')))]))),
      prereqs: ['18.5', '20.1'], hint: 'Fix a, then induct on b. The base case needs add_zero on each side; the step instantiates add_succ at succ(a) and at a, and rewrites with the induction hypothesis in between.', needs: [] },
    // 20.3: commutativity — the first rung that pays for the two before it.
    { id: '20.3', kind: 'lemma', leanName: "add_comm'", chapter: 20, sorts: [NAT], terms: [nv('n')],
      givens: [], formulas: [],
      goal: faS('a', NAT, faS('b', NAT, appE('EQ', [nadd(nv('a'), nv('b')), nadd(nv('b'), nv('a'))]))),
      prereqs: ['20.2'], hint: "Fix a and induct on b, and the two lemmas below this one do the work: zero_add' for the base case, succ_add' for the step.", needs: [] },
    // 20.4: associativity, by induction on the third summand.
    { id: '20.4', kind: 'lemma', leanName: "add_assoc'", chapter: 20, sorts: [NAT], terms: [nv('n')],
      givens: [], formulas: [],
      goal: faS('a', NAT, faS('b', NAT, faS('c', NAT, appE('EQ', [nadd(nadd(nv('a'), nv('b')), nv('c')), nadd(nv('a'), nadd(nv('b'), nv('c')))])))),
      prereqs: ['18.5', '20.1'], hint: 'Fix a and b, then induct on c. Base and step are add_zero and add_succ again, applied at the compound term a + b as well as at the atoms.', needs: [] },
    // 20.5–20.7: ORDER, defined as `a ≤ b` iff `b` is `a` plus something. So the order facts are earned
    // from the addition ladder rather than assumed: reflexivity is add_zero, transitivity is add_assoc.
    { id: '20.5', kind: 'lemma', leanName: "le_refl'", chapter: 20, sorts: [NAT], terms: [nv('n')],
      givens: [], formulas: [], goal: faS('a', NAT, nle(nv('a'), nv('a'))), prereqs: ['20.1'], hint: 'a ≤ a means that some k has a + k = a, and 0 is that k: instantiate add_zero at a, witness the existence statement with 0, and fold it back into ≤ with le_def.', needs: [] },
    { id: '20.6', kind: 'lemma', leanName: "le_trans'", chapter: 20, sorts: [NAT],
      consts: [{ name: 'a', sort: NAT }, { name: 'b', sort: NAT }, { name: 'c', sort: NAT }], terms: [nv('a'), nv('b'), nv('c')],
      givens: [binding('hab', nle(nv('a'), nv('b'))), binding('hbc', nle(nv('b'), nv('c')))],
      formulas: [], goal: nle(nv('a'), nv('c')), prereqs: ['20.4'], hint: 'Unfold both potions with le_def and obtain the two witnesses. Then a + (k + j) = c is one application of associativity away, and k + j is the witness for a ≤ c.', needs: [] },
    // 20.7: the capstone. QED had to hand you the key fact as a hypothesis; here it is a theorem of the
    // module, and everything else in the proof is the player's own ≤ machinery.
    { id: '20.7', kind: 'example', chapter: 20, sorts: [NAT], terms: [nv('n')],
      givens: [], formulas: [FALSE()],
      goal: NOT(eeS('m', NAT, faS('n', NAT, nle(nv('n'), nv('m'))))), prereqs: ['20.1'], qed: '23.3', qedNote: 'no largest natural number; QED carries the ordering axiom as a premise', hint: 'Assume there is a largest m and obtain it. Instantiating its property at succ(m) gives succ(m) ≤ m, which not_succ_le forbids.', needs: [] },
  ];
  var EX_BY_ID = {}; EXERCISES.forEach(function (e) { EX_BY_ID[e.id] = e; });
  // Which level proves each minted lemma. A recipe a player holds is one of three things: a BASE recipe,
  // which is Lean's own; a sort's AXIOM, which `leanPreamble` declares or the sort's prelude proves; or a
  // MINTED LEMMA, which is a theorem the player proved on an earlier level -- and nothing in an exported
  // file declares one of those unless that earlier proof travels with it.
  var LEMMA_OWNER = {};
  EXERCISES.forEach(function (e) { if (e.kind === 'lemma' && e.leanName) LEMMA_OWNER[e.leanName] = e.id; });
  // the minted lemmas a proof applies, in first-use order, counting work inside sub-proofs and inside any
  // sub-proof still open (an unfinished export carries its chain too)
  function lemmaDeps(cur) {
    var out = [], seen = {};
    function walk(steps) {
      steps.forEach(function (s) {
        if (s.recipe && LEMMA_OWNER[s.recipe] && !seen[s.recipe]) { seen[s.recipe] = 1; out.push(s.recipe); }
        if (s.kind === 'discharge') s.levels.forEach(function (lv) { walk(lv.steps); });
      });
    }
    var chain = [], e = cur; while (e.parent) { chain.unshift(e); e = e.parent; }
    walk(e.steps);
    chain.forEach(function (c) { walk(c.steps); });
    return out;
  }

  // ---------- par: how long the canonical proof is ----------
  // The length, in moves (see `proofLength`), of the scripted solution of each level -- the same scripts
  // the Lean compile-check compiles, so every number here is the length of a proof that is known to work.
  // It is the SHORTEST KNOWN proof, not a proved minimum: a player who comes in under par has found
  // something we did not, which the game says so out loud and asks them to write in about.
  //
  // DERIVED, not hand-written: `node scratch/canon.js --patch` prints this literal and `--check` diffs it
  // against the solutions. Re-run it whenever an exercise or a solution changes.
  var CANON = {
    '1.1': 2, '1.2': 1,
    '2.1': 3, '2.2': 6, '2.3': 5,
    '3.1': 2, '3.2': 1,
    '4.1': 2, '4.2': 3, '4.3': 1, '4.4': 3, '4.5': 3, '4.6': 3, '4.7': 3, '4.8': 3,
    '5.1': 1, '5.2': 4, '5.3': 6, '5.4': 5, '5.5': 5, '5.6': 4, '5.7': 4, '5.8': 4, '5.9': 4, '5.10': 3, '5.11': 3,
    '6.1': 1, '6.2': 7, '6.3': 2, '6.4': 2, '6.5': 10, '6.6': 2, '6.7': 2, '6.8': 14, '6.9': 5, '6.10': 14, '6.11': 12, '6.12': 14, '6.13': 18, '6.14': 2, '6.15': 3, '6.16': 3,
    '7.1': 1, '7.2': 7, '7.3': 9, '7.4': 3, '7.5': 4, '7.6': 9, '7.7': 4, '7.8': 3, '7.9': 2, '7.10': 2, '7.11': 2, '7.12': 1, '7.13': 7, '7.14': 7,
    '8.1': 3, '8.2': 3, '8.3': 2, '8.4': 5, '8.5': 5, '8.6': 4, '8.7': 7, '8.8': 11, '8.9': 11, '8.10': 7, '8.11': 2, '8.12': 3, '8.13': 3, '8.14': 2, '8.15': 11, '8.16': 3,
    '9.1': 1, '9.2': 8, '9.3': 3, '9.4': 6, '9.5': 6, '9.6': 10, '9.7': 3, '9.8': 7, '9.9': 7, '9.10': 8,
    '10.1': 2, '10.2': 3, '10.3': 3, '10.4': 8, '10.5': 13, '10.6': 8,
    '11.1': 3, '11.2': 4, '11.3': 4, '11.4': 2, '11.5': 2,
    '12.1': 5, '12.2': 2, '12.3': 8, '12.4': 5, '12.5': 9, '12.6': 7, '12.7': 16, '12.8': 4,
    '13.1': 3, '13.2': 3, '13.3': 4, '13.4': 4,
    '14.1': 2,
    '15.1': 1, '15.2': 3, '15.3': 1, '15.4': 2, '15.5': 14, '15.6': 9, '15.7': 7, '15.8': 9, '15.9': 7, '15.10': 12, '15.11': 4, '15.12': 5, '15.13': 5, '15.14': 14, '15.15': 8, '15.16': 7, '15.17': 9, '15.18': 9, '15.19': 9, '15.20': 7, '15.21': 19,
    '16.1': 4, '16.2': 7,
    '17.1': 3, '17.2': 1, '17.3': 1, '17.4': 1,
    '18.1': 1, '18.2': 1, '18.3': 1, '18.4': 1, '18.5': 2, '18.6': 1, '18.7': 8, '18.8': 17, '18.9': 17, '18.10': 48, '18.11': 34, '18.12': 34, '18.13': 40,
    '19.1': 3, '19.2': 3, '19.3': 18, '19.4': 12, '19.5': 18,
    '20.1': 8, '20.2': 17, '20.3': 19, '20.4': 22, '20.5': 7, '20.6': 19, '20.7': 5,
  };
  function par(id) { return CANON[id] || null; }
  // Where a par came from somebody else. The scripted solutions are the author's; when a player finds a
  // shorter proof and sends it in, that proof BECOMES the scripted solution -- so the compile-check
  // verifies it and the par still follows from a proof that is known to work -- and the credit is kept
  // here. Hand-written, unlike CANON itself: `canon.js` cannot know who wrote a proof.
  // The date is the first sighting; `also` names anyone who sent the same proof in independently after
  // that. Four of the five below came out of one evening's comments on the blog post.
  var CANON_CREDIT = {
    '2.3': { who: 'PistachioCake', date: '2026-11-12', also: ['an anonymous reader'] },
    '4.3': { who: 'an anonymous reader', date: '2026-11-12', also: ['Jacob', 'Dario Bajo'] },
    '4.8': { who: 'an anonymous reader', date: '2026-11-12' },
    '6.8': { who: 'an anonymous reader', date: '2026-11-12', also: ['Kantian'] },
    '9.7': { who: 'an anonymous reader', date: '2026-11-12' }
  };
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
  function longDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    return m ? (+m[3]) + ' ' + MONTHS[+m[2] - 1] + ' ' + m[1] : iso;
  }
  // 'X and Y', 'X, Y and Z'
  function nameList(ns) {
    return ns.length < 2 ? (ns[0] || '')
      : ns.slice(0, -1).join(', ') + ' and ' + ns[ns.length - 1];
  }
  // 'an anonymous reader on 12 November 2026, and independently by Jacob and Dario Bajo',
  // or '' where the par is the author's own
  function credit(id) {
    var c = CANON_CREDIT[id];
    if (!c) return '';
    return c.who + ' on ' + longDate(c.date) +
      ((c.also || []).length ? ', and independently by ' + nameList(c.also) : '');
  }

  // ---------- progression: accessible exercises + active capabilities from the solved set ----------
  // `unlocks` is the inverse of `prereqs`, built once here: the map draws it as edges and the UI uses it
  // to report what a solve has opened. Nothing should write `unlocks` by hand.
  EXERCISES.forEach(function (e) { e.unlocks = []; });
  EXERCISES.forEach(function (e) { (e.prereqs || []).forEach(function (p) { if (EX_BY_ID[p]) EX_BY_ID[p].unlocks.push(e.id); }); });
  // the levels that are open before anything is solved — i.e. those with no prerequisites (just 1.1)
  var PROGRESSION_START = EXERCISES.filter(function (e) { return !(e.prereqs || []).length; }).map(function (e) { return e.id; });
  // the tutorial chain, in order: the levels that introduce a mechanic
  var TUTORIALS = EXERCISES.filter(function (e) { return (e.needs || []).length; }).map(function (e) { return e.id; });
  // which capability each base recipe requires (minted lemmas gate themselves via `state.unlocked`)
  var RECIPE_CAP = { 'And.intro': 'and.intro', 'And.left': 'and.elim', 'And.right': 'and.elim', 'Or.inl': 'or', 'Or.inr': 'or', 'modus_ponens': 'mp', 'case_analysis': 'case', 'Iff.intro': 'iff', 'Iff.mp': 'iff', 'Iff.mpr': 'iff', 'absurd': 'neg', 'Classical.em': 'em', 'True.intro': 'tf', 'False.elim': 'tf', 'universal_instantiation': 'instantiate', 'Exists.intro': 'exists_intro', 'Eq.refl': 'eq', 'rw': 'eq', 'induction': 'induction' };
  // accessible = every level ALL of whose prerequisites are solved.  `solved` is an id→truthy map (or array).
  function accessibleSet(solved) {
    var sv = {}; (Array.isArray(solved) ? solved : Object.keys(solved || {})).forEach(function (id) { sv[id] = true; });
    var acc = {};
    EXERCISES.forEach(function (e) {
      var ps = e.prereqs || [], i;
      for (i = 0; i < ps.length; i++) if (!sv[ps[i]]) return;
      acc[e.id] = true;
    });
    return acc;
  }
  // which prerequisites a level is still waiting for — an AND-gate has to say WHY it is shut
  function missingPrereqs(id, solved) {
    var sv = {}; (Array.isArray(solved) ? solved : Object.keys(solved || {})).forEach(function (s2) { sv[s2] = true; });
    var e = EX_BY_ID[id];
    return e ? (e.prereqs || []).filter(function (p) { return !sv[p]; }) : [];
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
    expandAbbrevs: expandAbbrevs, expandQuantWords: expandQuantWords, parse: parse, render: render, wordsRule: wordsRule, wordsToSymbols: wordsToSymbols, varPhrase: varPhrase,
    binding: binding, newEnv: newEnv, byName: byName, freshName: freshName,
    SORTS: SORTS, defSort: defSort, SET: SET, NAT: NAT, leanImports: leanImports, leanPrelude: leanPrelude,
    RECIPES: RECIPES, BASE_RECIPES: BASE_RECIPES, craft: craft, rename: rename, deleteBinding: deleteBinding, deductions: deductions,
    proofIng: proofIng, formulaIng: formulaIng, recipeFromExercise: recipeFromExercise, defRecipe: defRecipe,
    leanHeader: leanHeader, leanPreamble: leanPreamble, emitLean: emitLean, emitLive: emitLive, emitInformal: emitInformal, emitInformalLive: emitInformalLive,
    proofLength: proofLength, CANON: CANON, par: par, CANON_CREDIT: CANON_CREDIT, credit: credit,
    openAssumption: openAssumption, discharge: discharge, dischargeOptions: dischargeOptions, abandon: abandon, implChain: implChain,
    notIntro: notIntro, notIntroOption: notIntroOption,
    OMEGA: OMEGA, FORALL: FORALL, EXISTS: EXISTS, openVariable: openVariable, binderChain: binderChain, predRecipes: predRecipes, substE: substE,
    obtain: obtain, obtainOptions: obtainOptions, isExists: isExists, pick: pick, enumAbstract: enumAbstract,
    FORMULA_RECIPES: FORMULA_RECIPES, formulaDeductions: formulaDeductions,
    EXERCISES: EXERCISES, EX_BY_ID: EX_BY_ID, LEMMA_OWNER: LEMMA_OWNER, lemmaDeps: lemmaDeps,
    PROGRESSION_START: PROGRESSION_START, TUTORIALS: TUTORIALS, RECIPE_CAP: RECIPE_CAP,
    accessibleSet: accessibleSet, activeCaps: activeCaps, missingPrereqs: missingPrereqs
  };
  root.Grimoire = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
