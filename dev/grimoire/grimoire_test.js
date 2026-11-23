/* Node tests for the proof-crafting core (grimoire.js). Path-independent: finds the app by walking up
 * from this file's directory, so keep it inside the repo tree (scratch/). */
const path = require('path'), fs = require('fs');
function findApps(d) { for (let i = 0; i < 16; i++) { if (fs.existsSync(path.join(d, 'static/apps/grimoire.js'))) return path.join(d, 'static/apps'); const u = path.dirname(d); if (u === d) break; d = u; } throw new Error('grimoire.js not found walking up from ' + __dirname + ' — keep this file in the repo (dev/grimoire/)'); }
const APPS = findApps(__dirname);
const G = require(path.join(APPS, 'grimoire.js'));
let pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.log('FAIL: ' + m); } }
function eq(a, b, m) { ok(a === b, m + '  (got: ' + JSON.stringify(a) + ')'); }
const { varE, AND, OR, IMPLIES, IFF, NOT, TRUE, FALSE, render, parse, expandAbbrevs, exprEq, sortOf, newEnv, craft, emitLean, EX_BY_ID, byName } = G;
const A = varE('A'), B = varE('B'), C = varE('C');

// ---------- Expr basics ----------
eq(sortOf(AND(A, B)), 'Prop', 'conjunction has sort Prop');
ok(exprEq(AND(A, B), AND(A, B)) && !exprEq(AND(A, B), AND(B, A)), 'exprEq is structural');

// ---------- renderer (min parens, Lean right-assoc) ----------
eq(render(AND(AND(A, B), C)), '(A ∧ B) ∧ C', 'left-nested ∧ needs parens (Lean is right-assoc)');
eq(render(AND(A, AND(B, C))), 'A ∧ B ∧ C', 'right-nested ∧ needs none');
eq(render(IMPLIES(A, IMPLIES(B, C))), 'A → B → C', '→ right-assoc, no parens');
eq(render(IMPLIES(IMPLIES(A, B), C)), '(A → B) → C', 'left-nested → needs parens');
eq(render(NOT(AND(A, B))), '¬ (A ∧ B)', '¬ over a conjunction parenthesizes');
eq(render(AND(NOT(A), B)), '¬ A ∧ B', '¬ binds tighter than ∧');
eq(render(OR(AND(A, B), C)), 'A ∧ B ∨ C', '∧ binds tighter than ∨');
eq(render(IFF(A, B)), 'A ↔ B', 'iff renders');

// ---------- \-abbreviation expander ----------
eq(expandAbbrevs('(A \\and B) \\and C'), '(A ∧ B) ∧ C', 'expand \\and');
eq(expandAbbrevs('\\not A \\or B'), '¬ A ∨ B', 'expand \\not, \\or');
eq(expandAbbrevs('A \\to B \\iff C'), 'A → B ↔ C', 'expand \\to, \\iff');
eq(expandAbbrevs('\\true \\false'), 'True False', 'expand \\true, \\false');

// ---------- parser ----------
function P(s) { const r = parse(s); ok(r.ok, 'parses: ' + s + (r.ok ? '' : ' — ' + r.error)); return r.expr; }
ok(exprEq(P('(A \\and B) \\and C'), AND(AND(A, B), C)), 'parse groups by parens');
ok(exprEq(P('A \\and B \\or C'), OR(AND(A, B), C)), '∧ binds tighter than ∨ in the parser');
ok(exprEq(P('A \\to B \\to C'), IMPLIES(A, IMPLIES(B, C))), '→ parses right-assoc');
ok(exprEq(P('A ∧ B ∧ C'), AND(A, AND(B, C))), 'unicode input, ∧ right-assoc');
ok(exprEq(P('\\not (A \\and B)'), NOT(AND(A, B))), 'prefix ¬ over parens');
// round-trips
[AND(AND(A, B), C), IMPLIES(A, IMPLIES(B, C)), OR(AND(A, B), NOT(C)), IFF(A, AND(B, C))].forEach(function (e, i) {
  ok(exprEq(parse(render(e)).expr, e), 'round-trip #' + i + ': ' + render(e));
});
// errors (no silent failure)
ok(!parse('A \\and').ok, 'dangling operator rejected');
ok(!parse('(A \\and B').ok, 'unbalanced paren rejected');
ok(!parse('A B').ok, 'two atoms in a row rejected');
ok(!parse('A & B').ok, 'unknown character rejected');
// A reader hit "unexpected character '*'" on 17.3's term bench: ∗ is U+2217, not the asterisk on
// anybody's keyboard. A symbol may now declare ASCII aliases, and ∗ claims the obvious one.
(function () {
  var M = 'M', ctx = { 'c': M };
  var viaAscii = G.parse('f(c) * c', M), viaGlyph = G.parse('f(c) ∗ c', M);
  ok(viaAscii.ok, 'the ASCII asterisk parses as ∗');
  ok(viaGlyph.ok && G.exprEq(viaAscii.expr, viaGlyph.expr), 'and builds the same term as the glyph does');
  ok(G.render(viaAscii.expr).indexOf('∗') >= 0, 'but renders back as ∗, not as the alias');
  ok(G.SYMBOLS.star.ascii.indexOf('*') >= 0, 'the alias is declared on the symbol, not special-cased');
})();

// ---------- recipes / matcher (via craft) ----------
{
  let e = newEnv(EX_BY_ID['1.1']);
  let r1 = craft(e, 'And.intro', ['hA', 'hB']); ok(r1.ok && r1.binding.name === 'hAB' && exprEq(r1.binding.type, AND(A, B)), 'And.intro crafts hAB : A ∧ B');
  let r2 = craft(r1.env, 'And.intro', ['hAB', 'hC']); ok(r2.ok && r2.binding.name === 'hABC' && r2.solved, 'And.intro crafts the goal (A ∧ B) ∧ C → solved');
}
{
  let e = newEnv(EX_BY_ID['2.1']);            // hAB : A ∧ B ⊢ B ∧ A
  ok(!craft(e, 'And.left', ['hAB']).ok === false, 'And.left applies to a conjunction');
  let bad = craft(newEnv(EX_BY_ID['1.2']), 'And.left', ['hA']); ok(!bad.ok, 'And.left rejects a non-conjunction');
  let l = craft(e, 'And.left', ['hAB']); ok(l.binding.name === 'hA' && exprEq(l.binding.type, A), 'And.left → hA : A');
  let r = craft(l.env, 'And.right', ['hAB']); ok(r.binding.name === 'hB' && exprEq(r.binding.type, B), 'And.right → hB : B');
  let f = craft(r.env, 'And.intro', ['hB', 'hA']); ok(f.solved && f.binding.name === 'hBA', 'And.intro hB hA → hBA : B ∧ A → solved');
}

// ---------- live Lean emitter ----------
{
  let e = newEnv(EX_BY_ID['1.1']);
  e = craft(e, 'And.intro', ['hA', 'hB']).env;
  e = craft(e, 'And.intro', ['hAB', 'hC']).env;
  const expected = [
    'example (hA : A) (hB : B) (hC : C) : (A ∧ B) ∧ C := by',
    '  have hAB : A ∧ B := And.intro hA hB',
    '  have hABC : (A ∧ B) ∧ C := And.intro hAB hC',
    '  exact hABC'
  ].join('\n');
  eq(emitLean(EX_BY_ID['1.1'], e), expected, 'emit exercise 1.1');
}
{
  let e = newEnv(EX_BY_ID['1.2']);
  e = craft(e, 'And.intro', ['hA', 'hA']).env;
  const expected = [
    'theorem And.idem (hA : A) : A ∧ A := by',
    '  have hAA : A ∧ A := And.intro hA hA',
    '  exact hAA'
  ].join('\n');
  eq(emitLean(EX_BY_ID['1.2'], e), expected, 'emit lemma And.idem (1.2)');
}
{
  let e = newEnv(EX_BY_ID['2.1']);
  e = craft(e, 'And.left', ['hAB']).env;
  e = craft(e, 'And.right', ['hAB']).env;
  e = craft(e, 'And.intro', ['hB', 'hA']).env;
  const expected = [
    "theorem And.comm' (hAB : A ∧ B) : B ∧ A := by",
    '  have hA : A := And.left hAB',
    '  have hB : B := And.right hAB',
    '  have hBA : B ∧ A := And.intro hB hA',
    '  exact hBA'
  ].join('\n');
  eq(emitLean(EX_BY_ID['2.1'], e), expected, 'emit lemma And.comm\' (2.1)');
}

// ---------- associativity exercises are solvable ----------
{
  let e = newEnv(EX_BY_ID['2.2']);           // (A ∧ B) ∧ C ⊢ A ∧ (B ∧ C)
  e = craft(e, 'And.left', ['hABC']).env;     // hAB : A ∧ B
  e = craft(e, 'And.right', ['hABC']).env;    // hC : C
  e = craft(e, 'And.left', ['hAB']).env;      // hA : A
  e = craft(e, 'And.right', ['hAB']).env;     // hB : B
  e = craft(e, 'And.intro', ['hB', 'hC']).env;// hBC : B ∧ C
  let last = craft(e, 'And.intro', ['hA', 'hBC']);
  ok(last.solved, 'exercise 2.2a (associativity) reaches its goal');
}

// ---------- rename ----------
{
  let e = newEnv(EX_BY_ID['1.2']);
  e = craft(e, 'And.intro', ['hA', 'hA']).env;
  e = G.rename(e, 'hAA', 'potion1');
  ok(byName(e, 'potion1') && !byName(e, 'hAA'), 'rename updates the binding');
  ok(/have potion1 :/.test(emitLean(EX_BY_ID['1.2'], e)), 'rename flows into the emitted Lean');
}

// ---------- deduction enumerator (for the UI) ----------
{
  let e = newEnv(EX_BY_ID['1.1']);
  let d0 = G.deductions(e, []); ok(d0.every(x => x.recipeId === 'True.intro'), 'no selection → only the nullary True.intro applies (gated by the tf capability in play)');
  let d2 = G.deductions(e, ['hA', 'hB']);
  ok(d2.some(x => x.recipeId === 'And.intro' && exprEq(x.output, AND(A, B))) && d2.some(x => x.recipeId === 'And.intro' && exprEq(x.output, AND(B, A))), 'And.intro on {hA,hB} offers A∧B and B∧A');
  let e2 = newEnv(EX_BY_ID['2.1']);            // hAB : A ∧ B
  let d1 = G.deductions(e2, ['hAB']);
  ok(d1.some(x => x.recipeId === 'And.left' && exprEq(x.output, A)) && d1.some(x => x.recipeId === 'And.right' && exprEq(x.output, B)), 'And.left/right on a conjunction are offered');
  // already-owned outputs are not re-offered
  let e3 = craft(e2, 'And.left', ['hAB']).env;  // now owns A
  ok(!G.deductions(e3, ['hAB']).some(x => exprEq(x.output, A)), 'a statement already in the bench is not re-offered');
}

// ---------- Chapter 3: disjunction (formula ingredients) ----------
{
  const fA = G.formulaIng(varE('A')), fB = G.formulaIng(varE('B')), fC = G.formulaIng(varE('C'));
  let r = craft(newEnv(EX_BY_ID['3.2']), 'Or.inl', ['hA', fA]);      // hA:A + formula A → A ∨ A
  ok(r.ok && r.solved && exprEq(r.binding.type, OR(varE('A'), varE('A'))), 'Or.inl with a formula crafts A ∨ A (solves 3.1b)');
  ok(r.env.steps[0].lean === 'Or.inl hA', 'Or.inl emits without the (inferred) formula');
  let e2 = craft(newEnv(EX_BY_ID['3.1']), 'Or.inl', ['hA', fB]).env; // hAB : A ∨ B
  let last = craft(e2, 'Or.inr', ['hAB', fC]);                        // hCAB : C ∨ (A ∨ B)
  ok(last.ok && last.solved, 'Or.inl then Or.inr solves 3.1a');
  const expected = [
    'example (hA : A) : C ∨ A ∨ B := by',
    '  have hAB : A ∨ B := Or.inl hA',
    '  have hCAB : C ∨ A ∨ B := Or.inr hAB',
    '  exact hCAB'
  ].join('\n');
  ok(emitLean(EX_BY_ID['3.1'], last.env) === expected, 'emit 3.1a with disjunctions');
  let ded = G.deductions(newEnv(EX_BY_ID['3.2']), ['hA', fA], G.BASE_RECIPES);
  ok(ded.some(x => x.recipeId === 'Or.inl' && exprEq(x.output, OR(varE('A'), varE('A')))), 'a proof + a formula makes Or.inl available');
  ok(G.deductions(newEnv(EX_BY_ID['3.2']), ['hA'], G.BASE_RECIPES).every(x => x.recipeId[0] !== 'O'), 'Or is NOT offered without a formula selected');
}

// ---------- a solved lemma becomes a recipe (generic unifier) ----------
{
  const rc = G.recipeFromExercise(EX_BY_ID['2.1']);      // And.comm' : A ∧ B ⊢ B ∧ A
  ok(rc.arity === 1 && /A ∧ B ⊢ B ∧ A/.test(rc.rule), 'minted recipe has arity 1 and the right rule');
  G.RECIPES[rc.id] = rc;                                 // register (as the UI does on solve)
  let env = { bindings: [G.binding('h', AND(AND(varE('A'), varE('B')), varE('C')))], goal: null, steps: [] };
  let r = craft(env, "And.comm'", ['h']);                // (A ∧ B) ∧ C  →  C ∧ (A ∧ B)
  ok(r.ok && exprEq(r.binding.type, AND(varE('C'), AND(varE('A'), varE('B')))), "And.comm' instantiates its metavariables on a compound input");
  ok(r.env.steps[0].lean === "And.comm' h", 'minted recipe emits its lemma name');
  delete G.RECIPES[rc.id];                               // keep the global clean for other tests
}

// ---------- delete a potion, and explicit-parentheses rendering ----------
{
  let e = newEnv(EX_BY_ID['1.1']);
  e = craft(e, 'And.intro', ['hA', 'hB']).env;         // hAB
  ok(!G.deleteBinding(e, 'hA').ok, 'cannot delete a given hypothesis');
  ok(G.deleteBinding(e, 'hAB').ok && !byName(G.deleteBinding(e, 'hAB').env, 'hAB'), 'can delete a leaf crafted potion');
  let e2 = craft(e, 'And.intro', ['hAB', 'hC']).env;   // hABC brewed from hAB
  ok(!G.deleteBinding(e2, 'hAB').ok, 'cannot delete a potion another was brewed from');
}
ok(render(AND(A, AND(B, C)), { parens: true }) === 'A ∧ (B ∧ C)', 'explicit-parens mode fully parenthesizes');
ok(render(AND(A, AND(B, C))) === 'A ∧ B ∧ C', 'default stays minimal');
ok(G.emitLean(EX_BY_ID['2.3'], newEnv(EX_BY_ID['2.3']), { parens: true }).indexOf('A ∧ (B ∧ C)') >= 0, 'emitLean honours the parens option');

// ---------- words mode: the logical layer in English ----------
// The point of the option is that a player who cannot read ∧ can still read the goal, so what it must
// get right is (a) only the LOGIC is worded -- the mathematics keeps its school notation -- and (b) the
// Lean view is never touched, since that is the one thing the player is meant to read as notation.
{
  const W = { words: true };
  eq(render(AND(A, B), W), 'A and B', 'conjunction');
  eq(render(OR(A, B), W), 'A or B', 'disjunction');
  eq(render(IMPLIES(A, B), W), 'A implies B', 'implication');
  eq(render(G.IFF(A, B), W), 'A if and only if B', 'bi-implication');
  eq(render(NOT(A), W), 'not A', 'negation');
  eq(render(G.TRUE(), W) + '/' + render(G.FALSE(), W), 'true/false', 'True and False');
  eq(render(G.FORALL({ name: 'X', sort: G.OMEGA }, G.appE('P', [varE('X', G.OMEGA)])), W),
     'for all X in Ω, P(X)', 'a ∀ names its sort with `in`, which is what Ω means');
  eq(render(G.EXISTS({ name: 'x', sort: G.OMEGA }, G.appE('P', [varE('x', G.OMEGA)])), W),
     'for some x in Ω, P(x)', 'and ∃ reads the same way');
  // English has no precedence conventions, so a worded operand brackets even with the parens option off
  eq(render(AND(A, AND(B, C)), W), 'A and (B and C)', 'nested connectives bracket without being asked');
  eq(render(OR(NOT(A), B), W), '(not A) or B', 'so does a negation inside a disjunction');
  // ...but ONLY the worded ones: the mathematics still reads by its ordinary precedence
  {
    let mem = function (x, a) { return G.appE('MEM', [varE(x, G.SET), varE(a, G.SET)]); };
    eq(render(OR(mem('x', 'a'), mem('x', 'b')), W), 'x ∈ a or x ∈ b',
       'a relation is left alone -- bracketing every membership would read worse than the symbols do');
    eq(render(OR(mem('x', 'a'), mem('x', 'b')), { words: true, parens: true }), '(x ∈ a) or (x ∈ b)',
       'and the parens option still brackets everything, as it says it does');
  }
  // the Lean emitter must be deaf to the option, whatever is passed through to it
  ok(G.emitLean(EX_BY_ID['4.2'], newEnv(EX_BY_ID['4.2']), { words: true, parens: true }).indexOf('A → (A ∧ A)') >= 0,
     'the Lean view is never worded, even when the option is handed to it');
  eq(render(AND(A, B), { words: true, lean: true }), 'A ∧ B', 'nor is anything else rendered FOR Lean');
}
{
  // the informal narration words its scaffolding too, or the proof would read half in English
  let v = G.openVariable(newEnv(EX_BY_ID['11.1']), { name: 'X', sort: G.OMEGA });
  const L = G.emitInformalLive(EX_BY_ID['11.1'], v, { words: true }).split('\n');
  eq(L[1], 'Introduce an arbitrary X in Ω:', 'an introduced variable is announced in English');
  eq(L[2], '  (Not discharged yet: discharging will conclude for all X in Ω, ….)', 'as is what is owed');
}
{
  // RULE summaries are hand-written strings (and minted ones are built at unlock time), so they are
  // transliterated. ⊢ becomes the dash that was doing its work.
  eq(G.wordsRule('A, B ⊢ A ∧ B'), 'A, B — you get A and B', 'a rule line transliterates');
  eq(G.wordsRule('⊢ True'), 'you get true', 'a nullary rule has no inputs to separate');
  // the quantifier glyph is used both as a binder and as a NAME, and both readings have to work
  eq(G.wordsRule('a proof of ∀ x, P(x)'), 'a proof of for all x, P(x)', 'as a binder');
  eq(G.wordsRule('modus ponens for ∀'), 'modus ponens for “for all”', 'as a name');
  eq(G.wordsRule('the ∀ tutorial, one level deeper'), 'the “for all” tutorial, one level deeper',
     'a trailing comma does not make a word into a bound variable');
  // no hint, note or QED note may be left holding a symbol the mode promises to remove
  let left = [];
  G.EXERCISES.forEach(function (e) {
    [e.hint, e.note, e.qedNote].forEach(function (t) {
      if (t && /[∧∨→↔¬⊢∀∃↦]/.test(G.wordsRule(t))) left.push(e.id);
    });
  });
  eq(left.join(','), '', 'every authored hint and note transliterates completely');
  // a minted recipe carries both wordings, built from the statement rather than transliterated
  {
    let rc = G.recipeFromExercise(EX_BY_ID['4.2']);
    eq(rc.rule, 'formula A ⊢ A → A ∧ A', 'the symbolic rule of a minted lemma');
    eq(rc.ruleWords, 'formula A — you get A implies (A and A)', 'and its English one, bracketed as English needs');
  }
}
{
  // what the player READS they can also TYPE: the words go back to symbols before parsing
  const roundTrip = function (str) { const r = G.parse(G.wordsToSymbols(str), {}); return r.ok ? render(r.expr, { parens: true }) : 'FAIL: ' + r.error; };
  eq(roundTrip('A and (B and C)'), 'A ∧ (B ∧ C)', 'typed English parses');
  eq(roundTrip('not A or B'), '(¬ A) ∨ B', 'so does a negation');
  eq(roundTrip('A if and only if B'), 'A ↔ B', 'and the longest phrase wins over the `and` inside it');
  eq(roundTrip('A implies not B'), 'A → (¬ B)', 'and `implies`');
  eq(G.wordsToSymbols('x \\in a'), 'x \\in a', '`in` on its own is left alone -- it means ∈ far more often');
  eq(G.wordsToSymbols('for all x in Ω, P(x)'), '∀ x : Ω, P(x)', 'but right after a quantifier it is the sort separator');
}

// ---------- Chapter 4: sub-environments / deduction theorem ----------
{
  let e = newEnv(EX_BY_ID['4.2']);                       // ⊢ A → A ∧ A
  let sub = G.openAssumption(e, varE('A'));
  ok(sub.depth === 1 && sub.parent === e && byName(sub, 'hA'), 'openAssumption makes a sub-env with hA : A');
  sub = craft(sub, 'And.intro', ['hA', 'hA']).env;
  ok(sub.depth === 1, 'crafting inside the sub-env keeps the nesting');
  let d = G.discharge(sub, 'hAA', 1);
  ok(d.ok && d.solved && exprEq(d.binding.type, IMPLIES(varE('A'), AND(varE('A'), varE('A')))), 'discharge yields A → A ∧ A and solves 4.1');
  ok(emitLean(EX_BY_ID['4.2'], d.env) === [
    'example : A → A ∧ A := by',
    '  have hAAA : A → A ∧ A := by',
    '    intro hA',
    '    have hAA : A ∧ A := And.intro hA hA',
    '    exact hAA',
    '  exact hAAA'
  ].join('\n'), 'emit 4.1 (deduction theorem, intro form)');
}
{
  let e = newEnv(EX_BY_ID['4.7']);                       // ⊢ A → B → A
  let s2 = G.openAssumption(G.openAssumption(e, varE('A')), varE('B'));
  ok(s2.depth === 2 && byName(s2, 'hA') && byName(s2, 'hB'), 'a nested assumption imports the outer hypothesis');
  let opts = G.dischargeOptions(s2, 'hA');
  ok(opts.length === 2 && exprEq(opts[0].output, IMPLIES(varE('B'), varE('A'))) && exprEq(opts[1].output, IMPLIES(varE('A'), IMPLIES(varE('B'), varE('A')))), 'discharge offers B→A and A→(B→A)');
  let d = G.discharge(s2, 'hA', 2);
  ok(d.ok && d.solved, 'double discharge solves 7.1');
  ok(emitLean(EX_BY_ID['4.7'], d.env) === [
    'example : A → B → A := by',
    '  have hABA : A → B → A := by',
    '    intro hA',
    '    intro hB',
    '    exact hA',
    '  exact hABA'
  ].join('\n'), 'emit 7.1 (double discharge)');
  let live = G.emitLive(EX_BY_ID['4.7'], s2);
  ok(/A → B → \?a/.test(live) && /intro hA/.test(live) && /intro hB/.test(live) && /sorry/.test(live), 'live view shows the open ?a subproof');
}
// ---------- the informal (QED-style) narration ----------
// The informal view used to be emitted from the ROOT environment, so while the player was inside an
// open sub-proof it showed nothing of the work done under the assumption -- the Lean view showed it
// all along, under a `sorry`. emitInformalLive narrates the open levels too, and the invariant worth
// holding on to is that the open narration is what the finished one will say, minus the last line:
// a player who keeps the informal view open watches the proof being written, rather than watching
// nothing happen and then everything appear at once.
{
  let e = newEnv(EX_BY_ID['4.2']);                        // ⊢ A → A ∧ A
  eq(G.emitInformalLive(EX_BY_ID['4.2'], e), G.emitInformal(EX_BY_ID['4.2'], e),
     'with no sub-proof open, the live narration is the plain one');

  let sub = craft(G.openAssumption(e, varE('A')), 'And.intro', ['hA', 'hA']).env;
  const open = G.emitInformalLive(EX_BY_ID['4.2'], sub).split('\n');
  eq(open[0], 'We wish to prove A → A ∧ A.', 'the header survives inside a sub-proof');
  eq(open[1], 'Introduce A:', 'the open assumption is announced');
  ok(/From A, A we deduce A ∧ A/.test(open[2]), 'and the work done under it is narrated: ' + open[2]);
  eq(open[3], '  (Not discharged yet: discharging will conclude A → ….)',
     'with a closing line in the part Lean plays with `sorry`');
  eq(open.length, 4, 'and nothing else');

  const fin = G.emitInformal(EX_BY_ID['4.2'], G.discharge(sub, 'hAA', 1).env).split('\n');
  ok(open.slice(0, 3).every(function (l, i) { return fin[i] === l; }),
     'every line of the open narration but the last is already what the finished one says');
  ok(/^Discharging, we obtain A → A ∧ A\.$/.test(fin[3]) && /∎/.test(fin[4]),
     'and the discharge replaces that last line');
}
{
  // the same for a free variable, which the player introduces rather than assumes
  let v = G.openVariable(newEnv(EX_BY_ID['11.1']), { name: 'X', sort: G.OMEGA });
  const L = G.emitInformalLive(EX_BY_ID['11.1'], v).split('\n');
  eq(L[1], 'Introduce an arbitrary X : Ω:', 'an introduced variable is announced as arbitrary');
  eq(L[2], '  (Not discharged yet: discharging will conclude ∀ X : Ω, ….)',
     'and the pending conclusion is a ∀, not an implication');
  // nested: a variable and then an assumption, in one open chain
  let s2 = G.openAssumption(v, G.appE('P', [varE('X', G.OMEGA)]));
  const M = G.emitInformalLive(EX_BY_ID['11.1'], s2).split('\n');
  eq(M[1], 'Introduce an arbitrary X : Ω, then P(X):', 'a mixed chain is announced in one line');
  eq(M[2], '  (Not discharged yet: discharging will conclude ∀ X : Ω, P(X) → ….)',
     'and the pending conclusion threads both binders');
}
{
  // work already finished at the root stays visible while a sub-proof is open
  let r = craft(newEnv(EX_BY_ID['1.1']), 'And.intro', ['hA', 'hB']).env;
  const L = G.emitInformalLive(EX_BY_ID['1.1'], G.openAssumption(r, varE('C'))).split('\n');
  eq(L[0], 'We are given A, B, C.', 'the givens are still stated');
  ok(/we deduce A ∧ B/.test(L[2]), 'the root-level deduction is still narrated: ' + L[2]);
  eq(L[3], 'Introduce C:', 'and the open sub-proof follows it');
}

// ---------- formula-crafting recipes ----------
{
  let fd = G.formulaDeductions([varE('A'), varE('B')], []);
  ok(fd.some(x => x.recipeId === 'And' && exprEq(x.output, AND(varE('A'), varE('B')))) && fd.some(x => x.recipeId === 'Or' && exprEq(x.output, OR(varE('A'), varE('B')))), 'formula recipes build A ∧ B and A ∨ B');
  ok(!G.formulaDeductions([varE('A'), varE('B')], [AND(varE('A'), varE('B'))]).some(x => exprEq(x.output, AND(varE('A'), varE('B')))), 'an already-present formula is not re-offered');
}

// ---------- hypotheses count as formulas; a no-hypothesis lemma instantiates from a formula ----------
{
  let e = { bindings: [G.binding('hA', varE('A')), G.binding('hB', varE('B'))], goal: null, steps: [], parent: null, assumption: null, depth: 0 };
  let d = G.deductions(e, ['hA', 'hB'], G.BASE_RECIPES);
  ok(d.some(x => x.recipeId === 'Or.inl' && exprEq(x.output, OR(varE('A'), varE('B')))), 'Or.inl accepts a hypothesis as its second disjunct');
}
{
  const rc = G.recipeFromExercise(EX_BY_ID['4.1']);   // Impl.idem : A → A (no givens)
  ok(rc.arity === 1, 'Impl.idem takes one formula input (its proposition)');
  let r = rc.match([G.formulaIng(OR(varE('A'), varE('B')))]);
  ok(r.length === 1 && exprEq(r[0].output, IMPLIES(OR(varE('A'), varE('B')), OR(varE('A'), varE('B')))), 'Impl.idem instantiates to (A ∨ B) → (A ∨ B) from a pure formula');
  ok(r[0].lean === 'Impl.idem', 'the formula argument is inferred (no explicit term arg)');
}

// ---------- 5.1 / 6.1b: assume a compound formula, then discharge ----------
{
  let e = newEnv(EX_BY_ID['4.3']);                        // ((A∧B)∨C) → ((A∧B)∨C)
  let sub = G.openAssumption(e, OR(AND(varE('A'), varE('B')), varE('C')));
  let d = G.discharge(sub, sub.assumption.name, 1);
  ok(d.ok && d.solved, '5.1: assume ((A∧B)∨C) and discharge the assumption');
}
{
  let e = newEnv(EX_BY_ID['4.5']);                       // (A ∧ (A∨B)) → A
  let sub = G.openAssumption(e, AND(varE('A'), OR(varE('A'), varE('B'))));
  sub = craft(sub, 'And.left', [sub.assumption.name]).env;
  let d = G.discharge(sub, 'hA', 1);
  ok(d.ok && d.solved && exprEq(d.binding.type, IMPLIES(AND(varE('A'), OR(varE('A'), varE('B'))), varE('A'))), '6.1b: assume, And.left, discharge → (A ∧ (A∨B)) → A');
}

// ---------- Chapter 8: modus ponens ----------
{
  let e = { bindings: [G.binding('hAB', IMPLIES(varE('A'), varE('B'))), G.binding('hA', varE('A'))], goal: null, steps: [], parent: null, assumption: null, depth: 0 };
  let d = G.deductions(e, ['hAB', 'hA'], G.BASE_RECIPES);
  ok(d.some(x => x.recipeId === 'modus_ponens' && exprEq(x.output, varE('B'))), 'modus ponens: A and A→B give B');
}
{
  let e = newEnv(EX_BY_ID['5.2']);                     // impl_trans
  let sub = G.openAssumption(e, varE('A'));
  sub = craft(sub, 'modus_ponens', ['hAB', 'hA']).env;
  sub = craft(sub, 'modus_ponens', ['hBC', 'hB']).env;
  let out = G.discharge(sub, 'hC', 1);
  ok(out.ok && out.solved, '8.2 impl_trans solved via modus ponens + discharge');
  ok(emitLean(EX_BY_ID['5.2'], out.env) === [
    'theorem implies_trans (hAB : A → B) (hBC : B → C) : A → C := by',
    '  have hAC : A → C := by',
    '    intro hA',
    '    have hB : B := hAB hA',
    '    have hC : C := hBC hB',
    '    exact hC',
    '  exact hAC'
  ].join('\n'), 'emit 8.2 with modus ponens applications');
}
{
  let e = newEnv(EX_BY_ID['5.8']);                    // A∧B, A→C ⊢ C∧B (no sub-env)
  e = craft(e, 'And.left', ['hAB']).env;
  e = craft(e, 'modus_ponens', ['hAC', 'hA']).env;
  e = craft(e, 'And.right', ['hAB']).env;
  ok(craft(e, 'And.intro', ['hC', 'hB']).solved, '8.6a solved (And.left, modus ponens, And.right, And.intro)');
}

// ---------- Chapter 9: case analysis (∨ elimination) ----------
{
  // the recipe: two implications with a common conclusion → an implication on their disjunction
  let e = { bindings: [G.binding('hAC', IMPLIES(A, C)), G.binding('hBC', IMPLIES(B, C))], goal: null, steps: [], parent: null, assumption: null, depth: 0 };
  let d = G.deductions(e, ['hAC', 'hBC'], G.BASE_RECIPES);
  ok(d.some(x => x.recipeId === 'case_analysis' && exprEq(x.output, IMPLIES(OR(A, B), C))), 'case_analysis: A→C and B→C give (A∨B)→C');
  ok(d.some(x => x.recipeId === 'case_analysis' && exprEq(x.output, IMPLIES(OR(B, A), C))), 'case_analysis offers both case orders');
  ok(/fun h => Or\.elim h hAC hBC/.test(d.find(x => x.recipeId === 'case_analysis' && exprEq(x.output, IMPLIES(OR(A, B), C))).lean), 'case_analysis emits an Or.elim lambda');
  // mismatched conclusions are rejected
  let e2 = { bindings: [G.binding('hAC', IMPLIES(A, C)), G.binding('hBD', IMPLIES(B, varE('D')))], goal: null, steps: [], parent: null, assumption: null, depth: 0 };
  ok(!G.deductions(e2, ['hAC', 'hBD'], G.BASE_RECIPES).some(x => x.recipeId === 'case_analysis'), 'case_analysis needs a common conclusion');
  // 9.1 is a one-step application; 9.3 is direct elimination (case_analysis then modus ponens)
  ok(craft(newEnv(EX_BY_ID['6.1']), 'case_analysis', ['hAC', 'hBC']).solved, '9.1 solved by one case_analysis');
  let t = craft(newEnv(EX_BY_ID['6.4']), 'case_analysis', ['hAC', 'hBC']);
  ok(t.ok && craft(t.env, 'modus_ponens', [t.binding.name, 'hAB']).solved, '9.3 solved by case_analysis + modus ponens');
}
{
  // 9.2 Or.symm' : the flagship — two SEPARATE assume/discharge cycles (single open sub-env), then case_analysis
  let e = newEnv(EX_BY_ID['6.2']);                            // ⊢ (A∨B) → (B∨A)
  let sub = G.openAssumption(e, A);
  let r1 = craft(sub, 'Or.inr', ['hA', G.formulaIng(B)]);     // B ∨ A
  let d1 = G.discharge(r1.env, r1.binding.name, 1);           // A → (B∨A)
  ok(!d1.env.parent, 'the first case is discharged back to the root before the second is opened');
  let sub2 = G.openAssumption(d1.env, B);
  let r2 = craft(sub2, 'Or.inl', ['hB', G.formulaIng(A)]);    // B ∨ A
  let d2 = G.discharge(r2.env, r2.binding.name, 1);           // B → (B∨A)
  let fin = craft(d2.env, 'case_analysis', [d1.binding.name, d2.binding.name]);
  ok(fin.ok && fin.solved && exprEq(fin.binding.type, IMPLIES(OR(A, B), OR(B, A))), "9.2 Or.symm' solved via two assume/discharge cycles + case_analysis");
}
{
  // 9.4 Or.imp_left' : A∨B, A→C ⊢ C∨B — case-split A∨B, build each case, combine, apply (a full QED §9 exercise)
  let e = newEnv(EX_BY_ID['6.6']);
  let s1 = G.openAssumption(e, A);
  let c = craft(s1, 'modus_ponens', ['hAC', 'hA']);
  let p1 = craft(c.env, 'Or.inl', [c.binding.name, G.formulaIng(B)]);   // C ∨ B
  let d1 = G.discharge(p1.env, p1.binding.name, 1);
  let s2 = G.openAssumption(d1.env, B);
  let p2 = craft(s2, 'Or.inr', ['hB', G.formulaIng(C)]);                // C ∨ B
  let d2 = G.discharge(p2.env, p2.binding.name, 1);
  let imp = craft(d2.env, 'case_analysis', [d1.binding.name, d2.binding.name]);
  ok(imp.ok && craft(imp.env, 'modus_ponens', [imp.binding.name, 'hAB']).solved, "9.4 Or.imp_left' solved (case analysis over a given A∨B)");
}

// ---------- Chapter 10: bi-implication (↔) ----------
{
  let e = newEnv(EX_BY_ID['7.1']);   // hA : A, hAB : A ↔ B  (B is NOT already owned)
  let d = G.deductions(e, ['hAB', 'hA'], G.BASE_RECIPES);
  ok(d.some(x => x.recipeId === 'Iff.mp' && exprEq(x.output, B)), 'Iff.mp: A↔B and A give B');
  ok(/hAB\.mp hA/.test((d.find(x => x.recipeId === 'Iff.mp') || {}).lean || ''), 'Iff.mp emits dot-notation .mp');
  let e3 = { bindings: [G.binding('hAB', IFF(A, B)), G.binding('hB', B)], goal: null, steps: [], parent: null, assumption: null, depth: 0 };
  ok(G.deductions(e3, ['hAB', 'hB'], G.BASE_RECIPES).some(x => x.recipeId === 'Iff.mpr' && exprEq(x.output, A)), 'Iff.mpr: A↔B and B give A');
  let e2 = { bindings: [G.binding('hf', IMPLIES(A, B)), G.binding('hg', IMPLIES(B, A))], goal: null, steps: [], parent: null, assumption: null, depth: 0 };
  ok(G.deductions(e2, ['hf', 'hg'], G.BASE_RECIPES).some(x => x.recipeId === 'Iff.intro' && exprEq(x.output, IFF(A, B))), 'Iff.intro: A→B and B→A give A↔B');
  ok(!G.deductions(e2, ['hf'], G.BASE_RECIPES).some(x => x.recipeId === 'Iff.intro'), 'Iff.intro needs both directions');
  ok(craft(newEnv(EX_BY_ID['7.1']), 'Iff.mp', ['hAB', 'hA']).solved, '10.1 solved by one Iff.mp');
}
{
  // 10.2 Iff.symm' (MANDATORY): A↔B ⊢ B↔A — build B→A and A→B via mpr/mp + discharge, then Iff.intro
  let e = newEnv(EX_BY_ID['7.2']);
  let s1 = G.openAssumption(e, B);
  let a = craft(s1, 'Iff.mpr', ['hAB', s1.assumption.name]);
  let iBA = G.discharge(a.env, a.binding.name, 1);
  let s2 = G.openAssumption(iBA.env, A);
  let b = craft(s2, 'Iff.mp', ['hAB', s2.assumption.name]);
  let iAB = G.discharge(b.env, b.binding.name, 1);
  let fin = craft(iAB.env, 'Iff.intro', [iBA.binding.name, iAB.binding.name]);
  ok(fin.ok && fin.solved && exprEq(fin.binding.type, IFF(B, A)), "10.2 Iff.symm' solved (mandatory core result)");
}

// ---------- Chapters 11–12: negation, contradiction, excluded middle (no False surfaced) ----------
{
  const NOT = G.NOT;
  // absurd: A + ¬A + a formula ⊢ that formula
  let e = { bindings: [G.binding('hA', A), G.binding('hnA', NOT(A))], goal: null, steps: [], parent: null, assumption: null, depth: 0 };
  let d = G.deductions(e, ['hA', 'hnA', G.formulaIng(B)], G.BASE_RECIPES);
  ok(d.some(x => x.recipeId === 'absurd' && exprEq(x.output, B)), 'absurd: A, ¬A, and a formula B give B');
  ok(/absurd hA hnA/.test((d.find(x => x.recipeId === 'absurd') || {}).lean || ''), 'absurd emits `absurd hA hnA` (no False)');
  ok(!G.deductions(e, ['hA', 'hnA'], G.BASE_RECIPES).some(x => x.recipeId === 'absurd'), 'absurd also needs the target formula');
  ok(craft(newEnv(EX_BY_ID['8.1']), 'And.left', ['hAnA']).ok, '11.1 lets you split the contradiction');
  // Classical.em: a formula A ⊢ A ∨ ¬A
  let em = G.deductions({ bindings: [], goal: null, steps: [], parent: null, assumption: null, depth: 0 }, [G.formulaIng(A)], G.BASE_RECIPES);
  ok(em.some(x => x.recipeId === 'Classical.em' && exprEq(x.output, OR(A, NOT(A)))), 'Classical.em: formula A gives A ∨ ¬A');
  ok(craft(newEnv(EX_BY_ID['9.1']), 'Classical.em', [G.formulaIng(A)]).solved, '12.1 solved by one Classical.em');
}
{
  // 12.2 not_not_intro' : A ⊢ ¬¬A — reductio: assume ¬A, contradiction with A, conclude ¬¬A
  const NOT = G.NOT;
  let e = newEnv(EX_BY_ID['8.3']);              // hA : A ⊢ ¬¬A
  let sub = G.openAssumption(e, NOT(A));         // assume ¬A
  let nm = sub.assumption.name;
  ok(G.notIntroOption(sub, ['hA', nm]) && exprEq(G.notIntroOption(sub, ['hA', nm]).output, NOT(NOT(A))), 'a statement and its negation offer reductio → ¬(assumption)');
  let r = G.notIntro(sub, 'hA', nm);
  ok(r.ok && r.solved && exprEq(r.binding.type, NOT(NOT(A))), "12.2 not_not_intro' solved by reductio");
  ok(/exact absurd hA /.test(emitLean(EX_BY_ID['8.3'], r.env)), 'the reductio emits `exact absurd …` (False stays hidden)');
  ok(!/False/.test(emitLean(EX_BY_ID['8.3'], r.env)), 'no False appears in the emitted proof');
}

// ---------- sort polymorphism: an Ω lemma applies at every sort, but never straddles two ----------
{
  const SYM = "Eq.symm'", F = G.formulaIng;
  G.RECIPES[SYM] = G.recipeFromExercise(EX_BY_ID['18.5']);          // α = β ⊢ β = α, minted over Ω
  const EQ = (x, y) => G.appE('EQ', [x, y]);
  function applyAt(sort) {
    const a = G.varE('α', sort), b = G.varE('β', sort);
    const env = { bindings: [G.binding('e', EQ(a, b))], vars: [{ name: 'α', sort: sort }, { name: 'β', sort: sort }],
                  goal: null, steps: [], parent: null, assumption: null, depth: 0 };
    return G.deductions(env, [F(a), F(b), 'e'], [G.RECIPES[SYM]]).filter(d => d.recipeId === SYM);
  }
  [G.OMEGA, 'G', 'M', G.SET].forEach(function (sort) {
    const hits = applyAt(sort);
    ok(hits.length === 1, 'the Ω lemma Eq.symm\' applies at sort ' + sort);
    ok(hits.length === 1 && G.sortOf(hits[0].output.args[0]) === sort,
       'and states its conclusion at ' + sort + ', not at Ω');
  });
  // ONE binding per application: a lemma may not be used across two sorts at once
  const mixed = { bindings: [G.binding('e', EQ(G.varE('α', 'G'), G.varE('β', 'M')))],
                  vars: [{ name: 'α', sort: 'G' }, { name: 'β', sort: 'M' }], goal: null, steps: [], parent: null, assumption: null, depth: 0 };
  ok(G.deductions(mixed, [F(G.varE('α', 'G')), F(G.varE('β', 'M')), 'e'], [G.RECIPES[SYM]]).length === 0,
     'a single application may not straddle two sorts');
  // Ω ranges over DATA sorts only — a formula is not a term
  const propy = { bindings: [], vars: [], goal: null, steps: [], parent: null, assumption: null, depth: 0 };
  ok(G.deductions(propy, [F(A), F(B), 'nope'], [G.RECIPES[SYM]]).length === 0, 'Ω does not match Prop');
  delete G.RECIPES[SYM];
}

// ---------- Chapter 24: equality — two primitives, and the occurrence choice in `rw` ----------
{
  const O = G.OMEGA, F = G.formulaIng;
  const a = G.varE('α', O), b = G.varE('β', O);
  const EQ = (x, y) => G.appE('EQ', [x, y]), Qb = (x, y) => G.appE('Q', [x, y]), Pu = (x) => G.appE('P', [x]);
  function envOf(bindings) {
    return { bindings: bindings, vars: [{ name: 'α', sort: O }, { name: 'β', sort: O }], goal: null, steps: [], parent: null, assumption: null, depth: 0 };
  }
  // Eq.refl takes a TERM and yields `t = t`; it must refuse a proof or a formula
  const e0 = envOf([]);
  const refl = G.deductions(e0, [F(a)], G.BASE_RECIPES).filter(d => d.recipeId === 'Eq.refl');
  ok(refl.length === 1 && exprEq(refl[0].output, EQ(a, a)), 'Eq.refl on a term gives t = t');
  ok(/Eq\.refl α/.test(refl[0].lean), 'Eq.refl emits `Eq.refl α`');
  ok(G.deductions(envOf([G.binding('hP', Pu(a))]), ['hP'], G.BASE_RECIPES).filter(d => d.recipeId === 'Eq.refl').length === 0,
     'Eq.refl does not apply to a proof');
  // = is polymorphic but may not compare formulas, and both sides must share a sort
  ok(!G.parse('A = B').ok, '= refuses to compare two formulas');
  ok(G.parse('α = β', { 'α': O, 'β': O }).ok, '= accepts two terms of the same sort');
  ok(!G.parse('α = s', { 'α': O, 's': G.SET }).ok, '= refuses to compare terms of different sorts');
  // rw: Q(α,α) along α = β offers exactly the three non-trivial rewrites, each with its own motive
  const eR = envOf([G.binding('hQ', Qb(a, a)), G.binding('e', EQ(a, b))]);
  const rws = G.deductions(eR, ['hQ', 'e'], G.BASE_RECIPES).filter(d => d.recipeId === 'rw');
  eq(rws.length, 3, 'rw on Q(α,α) offers three rewrites (left, right, both)');
  [Qb(b, a), Qb(a, b), Qb(b, b)].forEach(function (want) {
    ok(rws.some(r => exprEq(r.output, want)), 'rw offers ' + G.render(want));
  });
  ok(rws.every(r => /Eq\.subst \(motive := fun x =>/.test(r.lean)), 'each rewrite emits an explicit motive, pinning the occurrences');
  ok(!rws.some(r => exprEq(r.output, Qb(a, a))), 'the no-op rewrite is not offered');
  // rewriting needs an equation on the right
  ok(G.deductions(envOf([G.binding('hQ', Qb(a, a)), G.binding('h2', Pu(a))]), ['hQ', 'h2'], G.BASE_RECIPES).filter(d => d.recipeId === 'rw').length === 0,
     'rw refuses a second input that is not an equation');
}

// ---------- abandoning a sub-proof (back out, leaving no `have` behind) ----------
{
  const NOT = G.NOT;
  let e0 = newEnv(EX_BY_ID['4.1']);                       // ⊢ A → A
  ok(!G.abandon(e0, 1).ok, 'abandon is refused at the top level');
  let s1 = G.openAssumption(e0, A);
  let r1 = G.abandon(s1, 1);
  ok(r1.ok && r1.env === e0, 'abandoning one level returns the parent environment object itself');
  ok(r1.env.steps.length === 0 && r1.env.bindings.length === e0.bindings.length,
     'the parent is untouched — no step and no binding are left behind');
  // crafting inside the sub-proof does not change that
  let s2 = G.openAssumption(e0, A);
  let c2 = craft(s2, 'And.intro', [s2.assumption.name, s2.assumption.name]);
  ok(c2.ok && c2.env.steps.length === 1, 'a craft inside the sub-proof lands in the sub-proof');
  let r2 = G.abandon(c2.env, 1);
  ok(r2.ok && r2.env.steps.length === 0, 'abandoning discards what was crafted inside');
  ok(!/have/.test(emitLean(EX_BY_ID['4.1'], r2.env)), 'nothing is emitted for an abandoned sub-proof');
  // nested levels: abandoning an outer level takes the inner ones with it
  let n1 = G.openAssumption(e0, A), n2 = G.openAssumption(n1, NOT(A));
  ok(n2.depth === 2, 'two nested assumptions give depth 2');
  ok(G.abandon(n2, 1).env === n1, 'abandoning one level from depth 2 lands in the outer sub-proof');
  ok(G.abandon(n2, 2).env === e0, 'abandoning two levels from depth 2 lands back at the top');
  ok(!G.abandon(n2, 3).ok, 'abandoning more levels than exist is refused');
  ok(!G.abandon(n2, 0).ok, 'abandoning zero levels is refused');
}

// ---------- Chapter 12, the reductio family (QED 12.1a-c, 12.3a/b) ----------
{
  const NOT = G.NOT, IMPLIES = G.IMPLIES;
  // helper: assume `f`, run modus ponens against given `imp`, split the resulting conjunction, contradict
  function contradictUnder(exId, assumed, impName, leftIsPositive) {
    const sub = G.openAssumption(newEnv(EX_BY_ID[exId]), assumed);
    const c = craft(sub, 'modus_ponens', [impName, sub.assumption.name]);
    ok(c.ok, exId + ': modus ponens fires under the assumption');
    const l = craft(c.env, 'And.left', [c.binding.name]);
    const r = craft(l.env, 'And.right', [c.binding.name]);
    return leftIsPositive ? G.notIntro(r.env, l.binding.name, r.binding.name)
                          : G.notIntro(r.env, r.binding.name, l.binding.name);
  }
  // 12.5 (QED 12.1a): A → B ∧ ¬B ⊢ ¬A
  let f5 = contradictUnder('8.5', A, 'hAcon', true);
  ok(f5.ok && f5.solved && exprEq(f5.binding.type, NOT(A)), '12.5 solved by reductio (QED 12.1a)');
  // 12.6 (QED 12.1b): A → B and A → ¬B ⊢ ¬A — two separate implications, no conjunction to split
  {
    const sub = G.openAssumption(newEnv(EX_BY_ID['8.6']), A);
    const b = craft(sub, 'modus_ponens', ['hAB', sub.assumption.name]);
    const nb = craft(b.env, 'modus_ponens', ['hAnB', sub.assumption.name]);
    const fin = G.notIntro(nb.env, b.binding.name, nb.binding.name);
    ok(fin.ok && fin.solved && exprEq(fin.binding.type, NOT(A)), '12.6 solved by reductio (QED 12.1b)');
  }
  // 12.7 (QED 12.1c): A → B and ¬A → B ⊢ B — split on excluded middle instead of contradicting
  {
    const ca = craft(newEnv(EX_BY_ID['9.3']), 'case_analysis', ['hAB', 'hnAB']);
    ok(ca.ok && exprEq(ca.binding.type, IMPLIES(G.OR(A, NOT(A)), B)), '12.7 case analysis gives (A ∨ ¬A) → B');
    const em = craft(ca.env, 'Classical.em', [G.formulaIng(A)]);
    const mp = craft(em.env, 'modus_ponens', [ca.binding.name, em.binding.name]);
    ok(mp.ok && mp.solved, "12.7 by_cases' solved by excluded middle + case analysis (QED 12.1c)");
  }
  // 12.8 (QED 12.3a): ¬A → B ∧ ¬B ⊢ A — reductio only reaches ¬¬A; the minted 12.3 lemma finishes it
  let f8 = contradictUnder('9.4', NOT(A), 'hnAcon', true);
  ok(f8.ok && exprEq(f8.binding.type, NOT(NOT(A))) && !f8.solved, '12.8 reductio yields ¬¬A, which is not yet the goal A');
  G.RECIPES['not_not_elim'] = G.recipeFromExercise(EX_BY_ID['9.2']);
  const done8 = craft(f8.env, 'not_not_elim', [f8.binding.name]);
  ok(done8.ok && done8.solved && exprEq(done8.binding.type, A), '12.8 finished by reusing the minted not_not_elim (QED 12.3a)');
  delete G.RECIPES['not_not_elim'];                      // keep the global recipe table as we found it
  // 12.9 (QED 12.3b): same, with the contradictory pair in the other order
  let f9 = contradictUnder('9.5', NOT(A), 'hnAcon', false);
  ok(f9.ok && exprEq(f9.binding.type, NOT(NOT(A))), '12.9 reductio yields ¬¬A with the pair reversed (QED 12.3b)');
}

// ---------- Chapter 12, De Morgan (QED 12.5a/d/b/c) ----------
{
  const NOT = G.NOT, AND = G.AND, OR = G.OR, F = G.formulaIng;
  // a tiny core-level solver, so De Morgan is proven solvable without needing the Lean harness
  function mk(exId) {
    const st = { env: newEnv(EX_BY_ID[exId]) };
    st.c = function (r) {
      const ins = Array.prototype.slice.call(arguments, 1), x = craft(st.env, r, ins);
      ok(x.ok, exId + ' crafts ' + r + (x.ok ? '' : ': ' + x.error));
      if (x.ok) { st.env = x.env; st.solved = x.solved; }
      return x.ok ? x.binding.name : null;
    };
    st.a = function (f) { st.env = G.openAssumption(st.env, f); return st.env.assumption.name; };
    st.d = function (n, k) { const x = G.discharge(st.env, n, k); ok(x.ok, exId + ' discharges'); if (x.ok) { st.env = x.env; st.solved = x.solved; } return x.ok ? x.binding.name : null; };
    st.n = function (p, q) { const x = G.notIntro(st.env, p, q); ok(x.ok, exId + ' closes a reductio'); if (x.ok) { st.env = x.env; st.solved = x.solved; } return x.ok ? x.binding.name : null; };
    return st;
  }
  // 12.10 (QED 12.5a): ¬(A ∨ B) ⊢ ¬A ∧ ¬B — negate each disjunct separately, then pair
  { const s = mk('8.7');
    const na = s.n(s.c('Or.inl', s.a(A), F(B)), 'hnAB');
    const nb = s.n(s.c('Or.inr', s.a(B), F(A)), 'hnAB');
    s.c('And.intro', na, nb);
    ok(s.solved, '12.10 not_or\' solved (QED 12.5a)'); }
  // 12.11 (QED 12.5d): ¬A ∧ ¬B ⊢ ¬(A ∨ B) — case-analyse the assumed disjunction down to B
  { const s = mk('8.8');
    const na = s.c('And.left', 'hnAnB'), nb = s.c('And.right', 'hnAnB');
    const hab = s.a(OR(A, B));
    const i1 = s.d(s.c('absurd', s.a(A), na, F(B)), 1), i2 = s.d(s.a(B), 1);
    s.n(s.c('modus_ponens', s.c('case_analysis', i1, i2), hab), nb);
    ok(s.solved, '12.11 not_or_intro\' solved (QED 12.5d)'); }
  // 12.12 (QED 12.5b): ¬A ∨ ¬B ⊢ ¬(A ∧ B) — case-analyse the given disjunction down to ¬B
  { const s = mk('8.9');
    const hab = s.a(AND(A, B));
    const a = s.c('And.left', hab), b = s.c('And.right', hab);
    const i1 = s.d(s.c('absurd', a, s.a(NOT(A)), F(NOT(B))), 1), i2 = s.d(s.a(NOT(B)), 1);
    s.n(b, s.c('modus_ponens', s.c('case_analysis', i1, i2), 'hnAonB'));
    ok(s.solved, '12.12 not_and_of_not_or\' solved (QED 12.5b)'); }
  // 12.13 (QED 12.5c): the CLASSICAL direction — needs excluded middle, via the minted by_cases' (12.7)
  { G.RECIPES["by_cases'"] = G.recipeFromExercise(EX_BY_ID['9.3']);
    const s = mk('9.6');
    const ha = s.a(A);
    const nb = s.n(s.c('And.intro', ha, s.a(B)), 'hnAB');
    const i1 = s.d(s.c('Or.inr', nb, F(NOT(A))), 1);
    const i2 = s.d(s.c('Or.inl', s.a(NOT(A)), F(NOT(B))), 1);
    s.c("by_cases'", i1, i2);
    ok(s.solved, '12.13 not_and_or\' solved by reusing the minted by_cases\' (QED 12.5c, classical)');
    delete G.RECIPES["by_cases'"]; }                     // leave the global recipe table as we found it
}

// ---------- Chapter 13: True / False as first-class objects ----------
{
  const TRUE = G.TRUE, FALSE = G.FALSE, NOT = G.NOT;
  let e = { bindings: [], goal: null, steps: [], parent: null, assumption: null, depth: 0 };
  ok(G.deductions(e, [], G.BASE_RECIPES).some(x => x.recipeId === 'True.intro' && exprEq(x.output, TRUE())), 'True.intro ⊢ True (arity 0, from nothing)');
  let e2 = { bindings: [G.binding('hF', FALSE())], goal: null, steps: [], parent: null, assumption: null, depth: 0 };
  let d = G.deductions(e2, ['hF', G.formulaIng(A)], G.BASE_RECIPES);
  ok(d.some(x => x.recipeId === 'False.elim' && exprEq(x.output, A)), 'False.elim: False + a formula A give A');
  ok(/False\.elim hF/.test((d.find(x => x.recipeId === 'False.elim') || {}).lean || ''), 'False.elim emits `False.elim hF`');
  let t = craft(newEnv(EX_BY_ID['10.1']), 'True.intro', []);
  ok(t.ok && craft(t.env, 'Or.inl', [t.binding.name, G.formulaIng(A)]).solved, '13.1 ⊢ True ∨ A solved (True.intro + Or.inl)');
}
{
  // reductio from a DIRECT proof of False (Chapter 13): assume A, obtain False, conclude ¬A
  const FALSE = G.FALSE, NOT = G.NOT;
  let root = { bindings: [], goal: NOT(A), steps: [], parent: null, assumption: null, depth: 0 };
  let sub = G.openAssumption(root, A);
  sub = { bindings: sub.bindings.concat([G.binding('hF', FALSE())]), goal: sub.goal, steps: sub.steps, parent: sub.parent, assumption: sub.assumption, depth: sub.depth };
  let opt = G.notIntroOption(sub, ['hF']);
  ok(opt && opt.fals === 'hF' && exprEq(opt.output, NOT(A)), 'a direct False proof offers reductio → ¬(assumption)');
  let r = G.notIntro(sub, 'hF', null);
  ok(r.ok && r.solved && exprEq(r.binding.type, NOT(A)), 'reductio from False concludes ¬A');
  ok(/exact hF/.test(emitLean({ kind: 'example', chapter: 13, givens: [], goal: NOT(A) }, r.env)), 'the reductio-from-False emits `exact hF` (False now visible in Ch13)');
}

// ---------- Chapter 16: the universal quantifier ∀ over the sort Omega ----------
{
  const OMEGA = G.OMEGA, x = G.varE('x', OMEGA), y = G.varE('y', OMEGA), z = G.varE('z', OMEGA), Qxy = G.appE('Q', [x, y]);
  ok(G.exprEq(G.FORALL({ name: 'x', sort: OMEGA }, G.appE('Q', [x, x])), G.FORALL({ name: 'z', sort: OMEGA }, G.appE('Q', [z, z]))), '∀ is compared up to α-renaming of the bound variable');
  ok(!G.exprEq(G.FORALL({ name: 'x', sort: OMEGA }, Qxy), G.FORALL({ name: 'x', sort: OMEGA }, G.appE('Q', [x, x]))), 'α-equivalence does not conflate distinct bodies');
  eq(G.render(Qxy), 'Q(x, y)', 'predicate renders Q(x, y) on the board');
  eq(G.render(Qxy, { lean: true }), 'Q x y', 'predicate renders Q x y in Lean');
  eq(G.render(EX_BY_ID['11.2'].goal), '∀ x : Ω, ∀ y : Ω, Q(x, y) → Q(x, y)', 'the ∀ goal renders (sort shown as Ω)');
  let e = newEnv(EX_BY_ID['11.2']);
  let e1 = G.openVariable(e, { name: 'x', sort: OMEGA });
  ok(e1.assumption.kind === 'var' && e1.assumption.name === 'x' && e1.depth === 1, 'openVariable opens a variable sub-env');
  let e3 = G.openAssumption(G.openVariable(e1, { name: 'y', sort: OMEGA }), Qxy);
  let hq = e3.assumption.name;
  let opts = G.dischargeOptions(e3, hq);
  ok(opts.length === 3 && exprEq(opts[2].output, EX_BY_ID['11.2'].goal), 'discharging all 3 levels gives ∀x,∀y,Q(x,y)→Q(x,y)');
  let d = G.discharge(e3, hq, 3);
  ok(d.ok && d.solved, '16.1 solved: intro x, intro y, assume Q(x,y), discharge ×3');
  ok(/variable \{Ω\}/.test(G.leanPreamble(EX_BY_ID['11.2'])) && /variable \{Q : Ω → Ω → Prop\}/.test(G.leanPreamble(EX_BY_ID['11.2'])), 'the preamble declares the sort Ω and predicate Q');
  ok(/intro x/.test(emitLean(EX_BY_ID['11.2'], d.env)) && /Q x y/.test(emitLean(EX_BY_ID['11.2'], d.env)), 'emitted 16.1 uses `intro x` and Lean-style `Q x y`');
  let fd = G.formulaDeductions([x, y], [], G.predRecipes(EX_BY_ID['11.2']));
  ok(fd.some(function (r) { return r.recipeId === 'Q' && exprEq(r.output, Qxy); }), 'the Q constructor builds Q(x, y) from the terms x, y');
}

// ---------- Chapters 17–18: unary predicates, ∀-entry, universal instantiation ----------
{
  const OMEGA = G.OMEGA, X = G.varE('X', OMEGA), Y = G.varE('Y', OMEGA), Pf = function (t) { return G.appE('P', [t]); };
  ok(exprEq(G.substE(Pf(X), 'X', OMEGA, Y), Pf(Y)), 'substE replaces a free variable (P(X)[X:=Y] = P(Y))');
  ok(exprEq(G.substE(G.FORALL({ name: 'X', sort: OMEGA }, Pf(X)), 'X', OMEGA, Y), G.FORALL({ name: 'X', sort: OMEGA }, Pf(X))), 'substE respects a shadowing ∀ binder');
  let e = { bindings: [G.binding('h', G.FORALL({ name: 'X', sort: OMEGA }, Pf(X)))], goal: null, steps: [], parent: null, assumption: null, depth: 0 };
  let d = G.deductions(e, ['h', G.formulaIng(Y)], G.BASE_RECIPES);
  ok(d.some(z => z.recipeId === 'universal_instantiation' && exprEq(z.output, Pf(Y))), 'universal_instantiation: ∀X,P(X) and a term Y give P(Y)');
  ok(/h Y/.test((d.find(z => z.recipeId === 'universal_instantiation') || {}).lean || ''), 'universal_instantiation emits the application `h Y`');
  ok(!G.deductions(e, ['h'], G.BASE_RECIPES).some(z => z.recipeId === 'universal_instantiation'), 'universal_instantiation needs a term as well as the ∀-proof');
  { let s = G.openAssumption(G.openVariable(newEnv(EX_BY_ID['11.1']), { name: 'X', sort: OMEGA }), Pf(X)); let r = G.discharge(s, s.assumption.name, 2); ok(r.ok && r.solved, '17.1 solved: intro X, assume P(X), discharge ×2'); }
  { let s = G.openVariable(newEnv(EX_BY_ID['12.1']), { name: 'X', sort: OMEGA });
    let i1 = craft(s, 'universal_instantiation', ['hpr', G.formulaIng(X)]);
    let i2 = craft(i1.env, 'universal_instantiation', ['hp', G.formulaIng(X)]);
    let mp = craft(i2.env, 'modus_ponens', [i1.binding.name, i2.binding.name]);
    let r = G.discharge(mp.env, mp.binding.name, 1);
    ok(r.ok && r.solved && exprEq(r.binding.type, EX_BY_ID['12.1'].goal), '18.1 solved: intro X, instantiate hpr & hp, modus ponens, discharge'); }
  // 17.1 is the ∀ tutorial, reached from the True/False tutorial; the 16.x pair is an optional side-quest
  // off it — two INDEPENDENT levels now, since neither proof uses the other (16.2 = QED 16.1, em under two ∀)
  ok(EX_BY_ID['11.1'].prereqs.join(',') === '10.1', '17.1 is the ∀ tutorial, following the True/False tutorial');
  ok(EX_BY_ID['11.2'].prereqs.join(',') === '11.1' && EX_BY_ID['11.3'].prereqs.join(',') === '11.1',
     'the 16.x side-quest is two independent levels hanging off 17.1');
  ok((EX_BY_ID['11.2'].unlocks || []).length === 0 && (EX_BY_ID['11.3'].unlocks || []).length === 0,
     'neither 16.x level gates anything else');
}

// ---------- higher-order (predicate) matching: minting Barbara 18.3a, reusing it via unification ----------
{
  const OMEGA = G.OMEGA, X = G.varE('X', OMEGA), y = G.varE('y', OMEGA);
  const Sf = function (t) { return G.appE('S', [t]); }, Pf = function (t) { return G.appE('P', [t]); }, Qf = function (t) { return G.appE('Q', [t]); };
  const fa = function (n, b) { return G.FORALL({ name: n, sort: OMEGA }, b); };
  let barbara = G.recipeFromExercise(EX_BY_ID['12.2']);
  ok(barbara.arity === 3, 'the barbara recipe takes 3 inputs (α term + 2 proof hypotheses)');
  // an 18.3b-style situation: term X, hsp : ∀y, S y → P y, hS : S X  ⊢  P X  (predicates P,Q solved by unification)
  let inp = [G.formulaIng(X), G.proofIng(G.binding('hsp', fa('y', IMPLIES(Sf(y), Pf(y))))), G.proofIng(G.binding('hS', Sf(X)))];
  let out = barbara.match(inp);
  ok(out.length === 1 && exprEq(out[0].output, Pf(X)), 'barbara higher-order matches: (X, ∀y,S y→P y, S X) ⊢ P X — predicates solved by unification');
  ok(/barbara X hsp hS/.test(out[0].lean), 'barbara emits `barbara X hsp hS` (α explicit; the predicates are inferred)');
  ok(barbara.match([G.formulaIng(X), inp[1], G.proofIng(G.binding('hT', G.appE('R', [X])))]).length === 0, 'barbara rejects a third hypothesis inconsistent with the solved predicate (R X ≠ S X)');
  // DETERMINACY GUARD: a lemma whose predicate is not pinned down by the inputs is never craftable
  let bad = G.recipeFromExercise({ leanName: 'refl_imp', chapter: 18, consts: [], givens: [], goal: fa('X', IMPLIES(Pf(X), Pf(X))) });
  ok(bad.match([]).length === 0, 'a lemma like ∀X, P X→P X (P undetermined) yields NO craftable output — the determinacy guard fires');
  // sanity: the propositional minter is unchanged (And.comm' still applies to a compound instantiation)
  let comm = G.recipeFromExercise(EX_BY_ID['2.1']);
  let cr = comm.match([G.proofIng(G.binding('h', AND(AND(A, B), C)))]);
  ok(cr.length === 1 && exprEq(cr[0].output, AND(C, AND(A, B))), 'propositional minting still works (And.comm\' on a compound)');
}

// ---------- Chapter 19: the existential quantifier and `obtain` (∃-elimination) ----------
{
  const OMEGA = G.OMEGA, aO = G.varE('a', OMEGA), X = G.varE('X', OMEGA);
  const Pf = function (t) { return G.appE('P', [t]); };
  // env.vars is seeded from an exercise's given constants (the DATA half of the context)
  const be = G.newEnv(EX_BY_ID['12.2']);
  ok(be.vars.length === 1 && be.vars[0].name === 'α' && be.vars[0].sort === OMEGA, 'newEnv seeds env.vars from given constants (α : Ω in Barbara-singular)');
  // 19.1: obtain a witness from ∃x, P x
  let env = G.newEnv(EX_BY_ID['13.1']);
  ok(env.vars.length === 0, 'no context variables before obtaining');
  ok(!G.isExists(G.byName(env, 'hpc').type) && G.isExists(G.byName(env, 'hex').type), 'isExists distinguishes ∃ (hex) from ∀ (hpc)');
  const r = G.obtain(env, 'hex', 'a');
  ok(r.ok, 'obtain succeeds on an ∃ hypothesis + a fresh name');
  ok(r.env.vars.some(function (v) { return v.name === 'a' && v.sort === OMEGA; }), 'the obtained variable a : Ω enters env.vars (the context)');
  ok(exprEq(r.binding.type, Pf(aO)), 'the witnessing hypothesis has type P a');
  ok(G.byName(r.env, 'hex'), 'the original ∃ hypothesis survives (non-destructive obtain)');
  // guards
  ok(!G.obtain(r.env, 'hex', 'a').ok, 'cannot obtain into a name already in context');
  ok(!G.obtain(env, 'hpc', 'a').ok, 'cannot obtain from a non-existential (∀) hypothesis');
  ok(!G.obtain(env, 'hex', 'hex').ok, 'cannot obtain into a name already used by a hypothesis');
  // non-destructive emission: copy first, then destructure the copy
  const em = G.emitLean(EX_BY_ID['13.1'], (function () {
    const o = G.obtain(env, 'hex', 'a'); let e = o.env;
    const imp = G.craft(e, 'universal_instantiation', ['hpc', G.formulaIng(aO)]); e = imp.env;
    return G.craft(e, 'modus_ponens', [imp.binding.name, o.binding.name]).env;
  })());
  ok(/obtain ⟨a, \w+⟩ := \w+/.test(em) && /have \w+ := hex/.test(em), 'emitted Lean copies the ∃ then `obtain ⟨a, …⟩` (the ∃ is preserved)');
  // consistency with the in-context invariant: a formula over `a` is unusable before obtaining, usable after
  const before = {}; env.vars.forEach(function (v) { before[v.name + ':' + v.sort] = 1; });
  ok(!before['a:' + OMEGA], 'a is NOT in context before obtaining (so P(a) would be greyed)');
  const after = {}; r.env.vars.forEach(function (v) { after[v.name + ':' + v.sort] = 1; });
  ok(after['a:' + OMEGA], 'a IS in context after obtaining (so P(a) becomes usable) — greying invariant preserved');
}

// ---------- Chapter 21: pick an arbitrary inhabitant of a nonempty sort ----------
{
  const OMEGA = G.OMEGA;
  let env = G.newEnv(EX_BY_ID['14.1']);   // hA : ∀x, A ⊢ A
  ok(env.vars.length === 0, 'no context variables before picking');
  const r = G.pick(env, 'a', OMEGA);
  ok(r.ok && r.env.vars.some(function (v) { return v.name === 'a' && v.sort === OMEGA; }), 'pick adds an arbitrary variable a : Ω to the context');
  ok(r.env.bindings.length === env.bindings.length, 'pick adds NO hypothesis (unlike obtain) — only a variable');
  ok(!G.pick(r.env, 'a', OMEGA).ok, 'cannot pick a name already in context');
  ok(!G.pick(env, 'hA', OMEGA).ok, 'cannot pick a name already used by a hypothesis');
  // solve 21.1: pick a witness, then instantiate the constant-body ∀
  const inst = G.craft(r.env, 'universal_instantiation', ['hA', G.formulaIng(G.varE('a', OMEGA))]);
  ok(inst.ok && exprEq(inst.binding.type, A) && inst.solved, '21.1 solved: pick a, then instantiate ∀x,A at a gives A');
  const em = G.leanPreamble(EX_BY_ID['14.1']) + G.emitLean(EX_BY_ID['14.1'], inst.env);
  ok(/\[Nonempty Ω\]/.test(em), 'the preamble declares [Nonempty Ω] for a pick exercise');
  ok(/have a : Ω := Classical\.choice inferInstance/.test(em), 'pick emits `have a : Ω := Classical.choice inferInstance`');
  // 21.1 mints the reusable forall_const' recipe (A is a first-order metavar, uniquely determined)
  const fc = G.recipeFromExercise(EX_BY_ID['14.1']);
  const m = fc.match([G.proofIng(G.binding('h', G.FORALL({ name: 'y', sort: OMEGA }, AND(B, C))))]);
  ok(m.length === 1 && exprEq(m[0].output, AND(B, C)), 'forall_const\' reuses: from ∀y, (B∧C) deduce B∧C (body independent of y)');
  const m2 = fc.match([G.proofIng(G.binding('h', G.FORALL({ name: 'y', sort: OMEGA }, G.appE('P', [G.varE('y', OMEGA)]))))]);
  ok(m2.length === 0, 'forall_const\' does NOT apply when the body depends on the bound variable');
}

// ---------- Chapter 22: existential introduction (finite occurrence-abstraction) ----------
{
  const OMEGA = G.OMEGA, al = G.varE('α', OMEGA), xv = G.varE('x', OMEGA);
  const Pf = function (t) { return G.appE('P', [t]); }, Qf = function (a, b) { return G.appE('Q', [a, b]); };
  const EE = function (b) { return G.EXISTS({ name: 'x', sort: OMEGA }, b); };
  // enumAbstract: Q(α,α) with witness α gives the FOUR abstractions (2^2 occurrences)
  const abs = G.enumAbstract(Qf(al, al), al, xv);
  ok(abs.length === 4, 'enumAbstract(Q(α,α), α) yields four bodies (2^2 occurrences)');
  const rendered = abs.map(function (e) { return G.render(e); }).sort().join(' | ');
  ok(/Q\(x, x\)/.test(rendered) && /Q\(x, α\)/.test(rendered) && /Q\(α, x\)/.test(rendered) && /Q\(α, α\)/.test(rendered), 'the four bodies are Q(x,x), Q(x,α), Q(α,x), Q(α,α)');
  ok(G.enumAbstract(Pf(al), al, xv).length === 2, 'P(α) yields two bodies: P(x) and P(α)');
  // the Exists.intro recipe offers all four; each shares the witness ⟨α, hQ⟩, the ∃-type disambiguating
  const rec = G.RECIPES['Exists.intro'];
  const cands = rec.match([G.proofIng(G.binding('hQ', Qf(al, al))), G.formulaIng(al)]);
  ok(cands.length === 4 && cands.every(function (c) { return c.output.tag === 'binder' && c.output.q === 'exists'; }), 'Exists.intro offers four ∃-introductions for Q(α,α) at witness α');
  ok(cands.every(function (c) { return /^⟨α, hQ⟩$/.test(c.lean); }), 'every ∃-intro shares the anonymous-constructor witness ⟨α, hQ⟩ (the have-type disambiguates)');
  // crafting a SPECIFIC one: `which` selects the ∃x, Q(x,x) result
  let env = G.newEnv(EX_BY_ID['15.3']);   // hQ : Q(α,α) ⊢ ∃x, Q(x,x)
  const bad = G.craft(env, 'Exists.intro', ['hQ', G.formulaIng(al)], EE(Qf(al, al)));   // ∃x, Q(α,α) — not the goal
  ok(bad.ok && !bad.solved, 'crafting the ∃x,Q(α,α) abstraction does not solve the goal');
  const good = G.craft(env, 'Exists.intro', ['hQ', G.formulaIng(al)], EE(Qf(xv, xv)));
  ok(good.ok && good.solved && exprEq(good.binding.type, EE(Qf(xv, xv))), 'crafting the ∃x,Q(x,x) abstraction solves 22.3');
  ok(/⟨α, hQ⟩/.test(good.env.steps[good.env.steps.length - 1].lean), 'the crafted ∃-intro step records the ⟨α, hQ⟩ witness');
  // 22.2 (∀→∃) mints exists_of_forall via the existing (Miller-unique) minter — P from the ∀ hypothesis
  const eof = G.recipeFromExercise(EX_BY_ID['15.2']);
  const m = eof.match([G.proofIng(G.binding('h', G.FORALL({ name: 'y', sort: OMEGA }, Pf(G.varE('y', OMEGA)))))]);
  ok(m.length === 1 && m[0].output.tag === 'binder' && m[0].output.q === 'exists', 'exists_of_forall reuses: from ∀y, P y deduce ∃x, P x');
}

// ---------- helper lemmas reused via higher-order matching (Chapter 22 heavy claims) ----------
{
  const OMEGA = G.OMEGA, X = G.varE('X', OMEGA), Pf = function (t) { return G.appE('P', [t]); };
  // a minted directional De Morgan half, reused on a NEGATED predicate (its metavar solves to λx.¬P x)
  const nef = G.recipeFromExercise(EX_BY_ID['15.13']);   // not_exists_forall_not : ¬∃X,P X ⊢ ∀X,¬P X
  ok(nef.arity === 1, 'not_exists_forall_not takes one proof input (the predicate is inferred, not supplied)');
  const inNeg = G.NOT(G.EXISTS({ name: 'X', sort: OMEGA }, G.NOT(Pf(X))));      // ¬∃X, ¬P X
  const out = nef.match([G.proofIng(G.binding('hne', inNeg))]);
  const want = G.FORALL({ name: 'X', sort: OMEGA }, G.NOT(G.NOT(Pf(X))));       // ∀X, ¬¬P X
  ok(out.length === 1 && exprEq(out[0].output, want), 'not_exists_forall_not reuses on ¬∃X,¬P X → ∀X,¬¬P X (metavar solved to λx.¬P x by matching)');
  ok(/^not_exists_forall_not hne$/.test(out[0].lean), 'the reused lemma emits `not_exists_forall_not hne` (Lean infers the predicate)');
  // forall_dne is genuinely reusable too (predicate pinned by the ∀¬¬ hypothesis)
  const dne = G.recipeFromExercise(EX_BY_ID['12.8']);
  const dout = dne.match([G.proofIng(G.binding('hdn', G.FORALL({ name: 'X', sort: OMEGA }, G.NOT(G.NOT(Pf(X))))))]);
  ok(dout.length === 1 && exprEq(dout[0].output, G.FORALL({ name: 'X', sort: OMEGA }, Pf(X))), 'forall_dne reuses: ∀X,¬¬P X → ∀X,P X');
  // the classical De Morgan 22.3b has an undetermined predicate → NOT itself craftable (determinacy guard), as expected
  const dm = G.recipeFromExercise(EX_BY_ID['15.14']);
  ok(dm.match([]).length === 0, 'the ¬∀↔∃¬ iff (no determining hypothesis) is correctly not craftable as a recipe');
}

// ---------- progression DAG: accessibility + capability gating ----------
{
  const { EXERCISES, EX_BY_ID, accessibleSet, activeCaps, RECIPE_CAP } = G;

  const acc0 = accessibleSet({});
  eq(Object.keys(acc0).length, 1, 'exactly one exercise is accessible at the start');
  ok(acc0['1.1'], 'the start node is 1.1');
  const c0 = activeCaps(acc0);
  ok(c0['and.intro'] && !c0['and.elim'] && !c0['formula'] && !c0['assume'] && !c0['mp'], 'only and.intro is active at the start');

  // solve in file order (a topological order): each exercise must be accessible when reached,
  // its declared needs must be active, and the capability set must grow monotonically.
  let solved = {}, capsCount = 0;
  EXERCISES.forEach(function (ex) {
    const acc = accessibleSet(solved);
    ok(acc[ex.id], ex.id + ' is accessible by the time it is reached');
    const cp = activeCaps(acc);
    (ex.needs || []).forEach(function (c) { ok(cp[c], ex.id + ' has its needed capability ' + c + ' active'); });
    const n = Object.keys(cp).length; ok(n >= capsCount, 'capabilities never decrease (' + ex.id + ')'); capsCount = n;
    solved[ex.id] = true;
  });

  const accAll = activeCaps(accessibleSet(solved));
  eq(Object.keys(accessibleSet(solved)).length, EXERCISES.length, 'solving everything unlocks every exercise (full reachability)');
  ['and.intro', 'and.elim', 'or', 'formula', 'assume', 'mp', 'case', 'iff', 'neg', 'em', 'tf', 'forall', 'instantiate'].forEach(function (c) { ok(accAll[c], 'capability ' + c + ' is active once all is solved'); });

  // the DAG is acyclic and well-formed: every unlock points forward to a real exercise
  const idx = {}; EXERCISES.forEach(function (e, i) { idx[e.id] = i; });
  EXERCISES.forEach(function (e) {
    (e.unlocks || []).forEach(function (u) {
      ok(EX_BY_ID[u], e.id + ' unlocks a real exercise (' + u + ')');
      ok(idx[u] > idx[e.id], e.id + ' unlocks ' + u + ' strictly later in order (acyclic)');
    });
  });

  // ---------- the two-kind model: a linear tutorial chain, AND-gated practice hanging off it ----------
  // Tutorials introduce mechanics and run in one straight line, so the mechanics can be collected without
  // doing any practice; exercises teach nothing and open once ALL their prerequisites are solved.
  {
    const TUTORIALS = G.TUTORIALS, missingPrereqs = G.missingPrereqs, PROGRESSION_START = G.PROGRESSION_START;

    eq(PROGRESSION_START.length, 1, 'exactly one level starts open (it has no prerequisites)');
    eq(PROGRESSION_START[0], '1.1', 'and that level is 1.1');

    // prereqs/unlocks are inverse views of one graph; every edge points backwards in file order
    EXERCISES.forEach(function (e) {
      (e.prereqs || []).forEach(function (p) {
        ok(EX_BY_ID[p], e.id + ' has a real prerequisite (' + p + ')');
        ok(idx[p] < idx[e.id], e.id + ' waits on ' + p + ', which is strictly earlier in order (acyclic)');
        ok((EX_BY_ID[p].unlocks || []).indexOf(e.id) >= 0, p + ' lists ' + e.id + ' among what it unlocks');
      });
      (e.unlocks || []).forEach(function (u) {
        ok((EX_BY_ID[u].prereqs || []).indexOf(e.id) >= 0, 'unlocks inverts prereqs exactly (' + e.id + ' → ' + u + ')');
      });
    });

    // a level is a tutorial exactly when it introduces a mechanic, and each mechanic is introduced once
    eq(TUTORIALS.length, 20, 'twenty tutorial levels, one per mechanic');
    const introducedBy = {};
    EXERCISES.forEach(function (e) {
      (e.needs || []).forEach(function (c) {
        ok(!introducedBy[c], 'mechanic ' + c + ' is introduced exactly once (' + e.id + ')');
        introducedBy[c] = e.id;
      });
      ok(((e.needs || []).length > 0) === (TUTORIALS.indexOf(e.id) >= 0), e.id + ': tutorial iff it teaches a mechanic');
      if (!(e.needs || []).length) ok((e.prereqs || []).length > 0, e.id + ' is practice, so something comes before it');
    });

    // THE CHAIN: each tutorial's single prerequisite is the tutorial before it
    TUTORIALS.forEach(function (id, i) {
      const ps = EX_BY_ID[id].prereqs || [];
      if (i === 0) eq(ps.length, 0, 'the first tutorial (' + id + ') needs nothing');
      else eq(ps.join(','), TUTORIALS[i - 1], 'tutorial ' + id + ' follows tutorial ' + TUTORIALS[i - 1] + ', and only that');
    });

    // AND semantics: every one of a level's prerequisites is load-bearing
    const many = EXERCISES.filter(function (e) { return (e.prereqs || []).length > 1; });
    ok(many.length >= 20, 'many levels have several prerequisites (' + many.length + ')');
    many.forEach(function (e) {
      e.prereqs.forEach(function (held, k) {
        const partial = {}; e.prereqs.forEach(function (p, j) { if (j !== k) partial[p] = true; });
        ok(!accessibleSet(partial)[e.id], e.id + ' stays shut while ' + held + ' is unsolved');
        eq(missingPrereqs(e.id, partial).join(','), held, e.id + ' reports exactly what it is waiting for');
      });
      const all = {}; e.prereqs.forEach(function (p) { all[p] = true; });
      ok(accessibleSet(all)[e.id], e.id + ' opens when the last of its ' + e.prereqs.length + ' prerequisites lands');
    });

    // THE IMPATIENT PATH: walk the tutorials and nothing else
    let chainSolved = {};
    TUTORIALS.forEach(function (id) {
      ok(accessibleSet(chainSolved)[id], 'tutorial ' + id + ' is reachable on the tutorials alone');
      const cp = activeCaps(accessibleSet(chainSolved));
      (EX_BY_ID[id].needs || []).forEach(function (c) {
        ok(cp[c], id + ': its own mechanic ' + c + ' is in hand when it opens (capabilities key off accessibility)');
      });
      chainSolved[id] = true;
    });
    const openOnChain = Object.keys(accessibleSet(chainSolved)).length;
    ok(openOnChain > EXERCISES.length * 0.6, 'the tutorial chain alone opens most of the game (' + openOnChain + ' of ' + EXERCISES.length + ')');
    ok(openOnChain < EXERCISES.length, 'but not all of it: some exercises are corollaries of other exercises');

    // THE COMPLETIONIST PATH: one mechanic's practice at a time, in chapter order, never stalls
    let doneAll = {}, stalled = [];
    TUTORIALS.forEach(function (tid) {
      doneAll[tid] = true;
      EXERCISES.forEach(function (e) {
        if (doneAll[e.id] || !accessibleSet(doneAll)[e.id]) return;
        if (TUTORIALS.indexOf(e.id) >= 0) return;   // leave the next tutorial for the next round
        doneAll[e.id] = true;
      });
    });
    // one more sweep: exercises whose prerequisites were only completed late
    for (let round = 0; round < 6; round++) {
      EXERCISES.forEach(function (e) { if (!doneAll[e.id] && accessibleSet(doneAll)[e.id]) doneAll[e.id] = true; });
    }
    EXERCISES.forEach(function (e) { if (!doneAll[e.id]) stalled.push(e.id); });
    eq(stalled.join(','), '', 'the completionist route reaches every level');
  }

  // capability-per-recipe map gates exactly the base recipes
  eq(RECIPE_CAP['And.intro'], 'and.intro', 'And.intro is gated by and.intro');
  eq(RECIPE_CAP['And.left'], 'and.elim', 'And.left is gated by and.elim');
  eq(RECIPE_CAP['And.right'], 'and.elim', 'And.right is gated by and.elim');
  eq(RECIPE_CAP['Or.inl'], 'or', 'Or.inl is gated by or');
  eq(RECIPE_CAP['modus_ponens'], 'mp', 'modus ponens is gated by mp');
}

// ---------- the numbering: one chapter per mechanic, so numeric order IS play order ----------
{
  var EX = G.EXERCISES, byId = G.EX_BY_ID;
  var at = {}; EX.forEach(function (e, i) { at[e.id] = i; });

  // every id is `chapter.position`, with no letter suffixes left over from the QED-aligned scheme
  var malformed = EX.filter(function (e) { return !/^\d+\.\d+$/.test(e.id); }).map(function (e) { return e.id; });
  eq(malformed.join(','), '', 'every id is plain chapter.position');

  // chapters run 1..20 with no gaps, and each is numbered 1..n in play order
  var chs = [];
  EX.forEach(function (e) { if (chs.indexOf(e.chapter) < 0) chs.push(e.chapter); });
  eq(chs.join(','), '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20',
     'the chapters are 1..20, in order, with no gaps');
  // The NUMBER a player sees runs 1..n within its chapter, in array order. The id does not have to:
  // chapter 7's drill keeps the id 7.12 it was saved under while showing as 7.2 (see `exNum`).
  var count = {}, seq = [];
  EX.forEach(function (e) {
    var want = e.chapter + '.' + (count[e.chapter] = (count[e.chapter] || 0) + 1);
    if (G.exNum(e) !== want) seq.push('expected ' + want + ' but found ' + G.exNum(e));
  });
  eq(seq.join('; '), '', 'the numbers shown run 1..n within their chapter, in array order');

  // the array order IS the numeric order: ascending chapter, then ascending position
  var out = [];
  for (var i = 1; i < EX.length; i++) {
    var a = EX[i - 1], b = EX[i];
    if (a.chapter > b.chapter) out.push(a.id + ' precedes ' + b.id);
  }
  eq(out.join('; '), '', 'the array never goes back to an earlier chapter');

  // chapter N is introduced by exercise N.1, and that is the chapter's only tutorial
  eq(G.TUTORIALS.join(' '),
     '1.1 2.1 3.1 4.1 5.1 6.1 7.1 8.1 9.1 10.1 11.1 12.1 13.1 14.1 15.1 16.1 17.1 18.1 19.1 20.1',
     'the tutorial chain is exactly N.1 for N = 1..20');
  EX.forEach(function (e) {
    if ((e.needs || []).length) ok(/\.1$/.test(e.id), e.id + ' teaches a mechanic, so it is a chapter opener');
  });

  // no exercise may depend on a LATER number -- this is what the scheme buys
  var fwd = [];
  EX.forEach(function (e) {
    (e.prereqs || []).forEach(function (q) { if (at[q] >= at[e.id]) fwd.push(e.id + ' needs ' + q); });
  });
  eq(fwd.join('; '), '', 'no level depends on a higher-numbered level');

  // every level's chapter is the chapter of the last mechanic it needs, which is what makes the
  // chapter headings true: nothing in chapter N requires a mechanic introduced after N.1
  var tIdx = {}; G.TUTORIALS.forEach(function (id, i) { tIdx[id] = i + 1; });
  var deep = {};
  function latest(id) {
    if (deep[id] !== undefined) return deep[id];
    var best = tIdx[id] || 0;
    (byId[id].prereqs || []).forEach(function (q) { var v = latest(q); if (v > best) best = v; });
    return deep[id] = best;
  }
  var misfiled = EX.filter(function (e) { return latest(e.id) !== e.chapter; }).map(function (e) { return e.id; });
  eq(misfiled.join(','), '', 'each level sits in the chapter of the last mechanic it needs');
}

// ---------- hints ----------
// EVERY level carries a hint now. A tutorial shows its hint under the goal, since the mechanic is new and
// teaching it is what the level is for; a practice level keeps the hint behind a button, so a player who
// wants to think first is not spoiled by text they never asked to read.
//
// Hints are prose, and prose rots: a recipe gets renamed and the hint quietly lies. So anything in a hint
// that LOOKS like code -- a dotted name, a snake_case name, a name ending in a prime -- has to be a recipe
// or axiom that really exists, and any hypothesis name has to be one the level really gives. The h-words of
// ordinary English are listed out, so that a typo cannot hide among them.
{
  var names = {};
  G.BASE_RECIPES.forEach(function (r) { names[r.id] = true; });
  Object.keys(G.RECIPE_CAP).forEach(function (r) { names[r] = true; });
  G.EXERCISES.forEach(function (e) { if (e.leanName) names[e.leanName] = true; });        // minted lemmas
  Object.keys(G.SORTS).forEach(function (sn) {                                            // a theory's axioms
    (G.SORTS[sn].axioms || []).forEach(function (a) { names[a.name] = true; });
  });
  var GESTURES = ['Assume', 'assume', 'Introduce', 'introduce', 'discharge', 'Discharge',
                  'Obtain', 'obtain', 'Pick', 'pick', 'witness', 'shift-tap', 'Repeat-select'];
  // ordinary English that the hypothesis-name pattern also catches
  var ENGLISH = ['half', 'halves', 'hand', 'hands', 'hang', 'happens', 'has', 'hats', 'have',
                 'here', 'hold', 'holding', 'holds', 'how', 'however', 'hypotheses', 'hypothesis'];
  // names a hint may use that the PROOF creates rather than the level giving them
  var MADE = { '4.1': ['hA'], '4.2': ['hA'] };
  var HINTED_OPEN = G.TUTORIALS.concat(['1.2']);   // the hints shown without being asked for
  // a name is mentioned only when it stands on its own -- `ext` inside "next" is not a mention
  function mentions(h, nm) {
    for (var i = h.indexOf(nm); i >= 0; i = h.indexOf(nm, i + 1)) {
      var b = i === 0 ? '' : h.charAt(i - 1), a = h.charAt(i + nm.length);
      if (!/[A-Za-z0-9_]/.test(b) && !/[A-Za-z0-9_]/.test(a)) return true;
    }
    return false;
  }

  eq(G.EXERCISES.filter(function (e) { return e.hint; }).length, G.EXERCISES.length,
     'every level carries a hint');
  HINTED_OPEN.forEach(function (id) {
    ok(!!G.EX_BY_ID[id].hint, id + ' shows its hint openly, so it must have one');
  });
  G.EXERCISES.forEach(function (e) {
    var h = e.hint;
    if (!h) return;
    // a hint that walks the player through the whole proof is not a hint
    ok(h.length < 600, e.id + ': the hint stays short (' + h.length + ' chars)');
    // the hypothesis names it uses are really given (or really made by the proof)
    (h.match(/\bh[A-Za-z]+\b/g) || []).forEach(function (nm) {
      if (ENGLISH.indexOf(nm) >= 0 || (MADE[e.id] || []).indexOf(nm) >= 0) return;
      ok(e.givens.some(function (g) { return g.name === nm; }),
         e.id + ': the hint names the given ' + nm);
    });
    // everything in it that looks like code is a name the game actually has
    var code = (h.match(/[A-Za-z][A-Za-z0-9_]*(?:[._][A-Za-z0-9_]+)+'?|\b[a-z]+'/g) || []);
    code.forEach(function (tok) {
      ok(!!names[tok], e.id + ': the hint names the real recipe or axiom ' + tok);
    });
  });
  // an openly shown hint has to get the player moving, so it names a recipe or a gesture outright
  HINTED_OPEN.forEach(function (id) {
    var h = G.EX_BY_ID[id].hint;
    if (!h) return;
    var named = Object.keys(names).filter(function (r) { return mentions(h, r); });
    var gestured = GESTURES.filter(function (g) { return mentions(h, g); });
    ok(named.length + gestured.length > 0,
       id + ': its hint names a real recipe or gesture (found ' +
       (named.concat(gestured).join(', ') || 'NOTHING') + ')');
  });
  // the fantasy vocabulary is what `flavor()` translates, so a hint written in plain words would simply
  // stay plain in fantasy mode -- every hint that talks about doing something should use the game's words
  var FANTASY = ['potion', 'potions', 'recipe', 'recipes', 'brew', 'brews', 'gem', 'gems',
                 'ingredient', 'ingredients', 'craft', 'crafts', 'spellbook'];
  var plain = ['hypothesis', 'hypotheses', 'rule', 'rules', 'derive', 'derives', 'variable', 'variables',
               'input', 'inputs', 'build', 'builds', 'proof'];
  G.EXERCISES.forEach(function (e) {
    // "induction hypothesis" is the standard name for the thing and reads correctly in either mode
    var h = e.hint.replace(/induction hypothesis/g, '');
    plain.forEach(function (w) {
      if (w === 'proof' || w === 'build' || w === 'builds' || w === 'variable' || w === 'variables') return;   // ordinary English too
      ok(!mentions(h, w), e.id + ': the hint uses the fantasy word, not the plain one (' + w + ')');
    });
  });
  ok(G.EXERCISES.filter(function (e) { return FANTASY.some(function (w) { return mentions(e.hint, w); }); }).length > 20,
     'the hints do use the game vocabulary, which plain mode then translates');
}

// ---------- typing a quantifier ----------
// A reader could not write a quantified formula on the scroll shelf at all: the parser had no binders, so
// ∃ and \exists and "exists" were each an error, and from Chapter 11 on the shelf could not express the
// statements its own level was about. Three ways in are offered, because a player will reach for whichever
// they already know -- the glyph, the backslash shortcut, or the English.
{
  const P1 = [{ name: 'P', argSorts: [G.OMEGA] }];
  const pq = function (str, opts) {
    const r = G.parse(str, (opts && opts.ctx) || {}, { sort: (opts && opts.sort) || G.OMEGA, preds: (opts && opts.preds) || P1 });
    return r.ok ? render(r.expr, { parens: true }) : 'ERROR: ' + r.error;
  };
  eq(pq('∀ x : Ω, P(x)'), '∀ x : Ω, P(x)', 'the glyph with an explicit sort');
  eq(pq('∀ x, P(x)'), '∀ x : Ω, P(x)', 'and without one: the sort is the exercise\'s own');
  eq(pq('∃ x, P(x)'), '∃ x : Ω, P(x)', '∃ likewise');
  eq(pq('\\forall x, P(x)'), '∀ x : Ω, P(x)', 'the backslash shortcut, as for every other symbol');
  eq(pq('\\exists x, P(x)'), '∃ x : Ω, P(x)', 'and for ∃');
  eq(pq('\\all x, P(x)') + '/' + pq('\\ex x, P(x)'), '∀ x : Ω, P(x)/∃ x : Ω, P(x)', 'and the short forms Lean also takes');
  // the words, in EVERY mode: a player who has only seen the symbol in the goal pane types what they read
  eq(pq('for all x, P(x)'), '∀ x : Ω, P(x)', '“for all”');
  eq(pq('forall x, P(x)'), '∀ x : Ω, P(x)', '“forall” as one word');
  eq(pq('exists x, P(x)'), '∃ x : Ω, P(x)', '“exists” -- the one the reader tried');
  eq(pq('there exists x, P(x)'), '∃ x : Ω, P(x)', '“there exists”, with the “there” not left stranded');
  eq(pq('for some x, P(x)'), '∃ x : Ω, P(x)', '“for some”');
  eq(pq('for every x, P(x)'), '∀ x : Ω, P(x)', 'and the other words for the same thing');
  // shape: a binder is looser than every connective, and binds as far right as it can -- as Lean reads it
  eq(pq('∀ x, P(x) → P(x)'), '∀ x : Ω, (P(x) → P(x))', 'the body runs to the end of the formula');
  eq(pq('(∀ x, P(x)) → P(a)', { ctx: { a: G.OMEGA } }), '(∀ x : Ω, P(x)) → P(a)',
     'so a quantifier used as an operand needs its brackets, exactly as the board prints them');
  eq(pq('∀ x y, Q(x, y)', { preds: [{ name: 'Q', argSorts: [G.OMEGA, G.OMEGA] }] }),
     '∀ x : Ω, (∀ y : Ω, Q(x, y))', 'several variables under one quantifier nest, last innermost');
  eq(pq('∀ x, ∃ y, Q(x, y)', { preds: [{ name: 'Q', argSorts: [G.OMEGA, G.OMEGA] }] }),
     '∀ x : Ω, (∃ y : Ω, Q(x, y))', 'and they alternate freely');
  // over another sort, where the default sort is that sort and `∈` has to typecheck
  eq(pq('∀ x, x ∈ a', { sort: G.SET, ctx: { a: G.SET } }), '∀ x : Set, (x ∈ a)',
     'the bound variable takes the sort, so the relation typechecks inside the body');
  eq(pq('∀ x : Set, (x ∈ a)', { sort: G.OMEGA, ctx: { a: G.SET } }), '∀ x : Set, (x ∈ a)',
     'and an explicit sort overrides the default');
  // what it says when it cannot read one
  ok(/name the variable ∀ binds/.test(pq('∀ , P(x)')), 'a quantifier with no variable says so');
  ok(/put a comma after the variable/.test(pq('∀ x P(x)')), 'a missing comma says so');
  ok(/no sort “Thing”/.test(pq('∀ x : Thing, P(x)')), 'an unknown sort is named');
  ok(/has to bind a formula/.test(pq('∀ x, f(x)', { sort: 'M' })), 'a quantifier over a term, not a formula, is refused');
  // an exercise re-declares its predicate letters, and the registry's default arity is not always right
  eq(pq('Q(a)', { ctx: { a: G.OMEGA }, preds: [{ name: 'Q', argSorts: [G.OMEGA] }] }), 'Q(a)',
     'a one-argument Q on a level that declares one, though the registry keeps two');
  ok(/Q takes 2 arguments here/.test(pq('Q(a)', { ctx: { a: G.OMEGA }, preds: [{ name: 'Q', argSorts: [G.OMEGA, G.OMEGA] }] })),
     'and two where the level says two');
  ok(/P takes Ω, but got a formula/.test(pq('P(A)')), 'an exercise signature is CHECKED, so a formula where a term belongs is reported');
  // the English is read in every mode, and the backslash shortcuts survive the word pass that reads it
  eq(pq('A and B'), 'A ∧ B', 'the connective words parse too, with Plain English off');
  eq(pq('A implies not B'), 'A → (¬ B)', 'and so do the rest of them');
  eq(pq('A \\and B'), 'A ∧ B', '`\\and` is expanded BEFORE the words are read, so its own `and` survives');
  eq(pq('\\forall x, P(x)'), '∀ x : Ω, P(x)', 'and `\\forall` likewise');
  // a nullary constant is shown as a glyph and registered under a name; both have to read
  eq(pq('0 + a', { sort: G.NAT, ctx: { a: G.NAT } }), '0 + a', 'the glyph of a nullary constant parses');
  eq(pq('c ∈ a', { sort: G.SET, ctx: { c: G.SET, a: G.SET } }), 'c ∈ a',
     'and a context variable spelt like a registry constant is the context\'s, not the registry\'s');
}

// ---------- everything the board shows can be typed back in ----------
// The one invariant that would have caught the reader's complaint on its own: take every statement the
// game ever displays -- goals, givens, the formulas it starts a level with -- render it as the player sees
// it, and read it back. 43 of these carry a quantifier, and before binders existed every one of them was
// a formula the game could show and the player could not write.
{
  var failed = [];
  G.EXERCISES.forEach(function (e) {
    var ctx = {};
    (e.consts || []).forEach(function (c) { ctx[c.name] = c.sort; });
    (e.terms || []).forEach(function (t) { if (t.tag === 'var') ctx[t.name] = t.sort; });
    var opts = { sort: (e.sorts && e.sorts[0]) || G.OMEGA, preds: e.preds };
    [e.goal].concat(e.givens.map(function (g) { return g.type; }), e.formulas || []).forEach(function (t) {
      var txt = render(t, { parens: true });
      var r = G.parse(txt, ctx, opts);
      if (!r.ok) failed.push(e.id + ': ' + txt + ' -> ' + r.error);
      else if (!exprEq(r.expr, t)) failed.push(e.id + ': ' + txt + ' -> ' + render(r.expr, { parens: true }));
    });
  });
  eq(failed.slice(0, 4).join(' | '), '', 'every statement the game displays parses back to itself');
  var quantified = G.EXERCISES.filter(function (e) { return JSON.stringify(e.goal).indexOf('"binder"') >= 0; });
  ok(quantified.length > 40, quantified.length + ' levels have a quantified goal, so this is not a corner case');
}

// ---------- par, and whose proof it is ----------
// CANON is derived from the scripted solutions (`scratch/canon.js --check`), so nothing here re-derives
// it. What is NOT derivable is who wrote a proof: when a reader sends in a shorter one it becomes the
// scripted solution, and CANON_CREDIT records the credit by hand. So that table is what needs guarding.
{
  eq(Object.keys(G.CANON).length, G.EXERCISES.length, 'every level has a par');
  G.EXERCISES.forEach(function (e) {
    ok(G.par(e.id) > 0, e.id + ': its par is a positive number of moves');
  });
  Object.keys(G.CANON).forEach(function (id) {
    ok(!!G.EX_BY_ID[id], id + ': in CANON and a real level');
  });
  Object.keys(G.CANON_CREDIT).forEach(function (id) {
    var c = G.CANON_CREDIT[id];
    ok(!!G.EX_BY_ID[id], id + ': credited and a real level');
    ok(!!c.who && /^\d{4}-\d{2}-\d{2}$/.test(c.date), id + ': the credit names someone and an ISO date');
    ok(G.credit(id).indexOf(c.who + ' on ') === 0 &&
       / \d{1,2} [A-Z][a-z]+ \d{4}(, and independently by .+)?$/.test(G.credit(id)),
       id + ': and reads as "' + G.credit(id) + '"');
    // whoever found it first is not also listed as having found it independently afterwards
    (c.also || []).forEach(function (w) {
      ok(w !== c.who, id + ': ' + w + ' is credited once, not twice');
      ok(G.credit(id).indexOf(w) > 0, id + ': and ' + w + ' is named too');
    });
  });
  eq(G.credit('4.7'), '', 'a par of the author\'s own is credited to nobody');
  // The records readers have sent in, each adopted as the scripted solution and compile-checked.
  // 4.8: three moves where the game had five, by applying the lemma 2.1 mints.
  eq(G.par('4.8'), 3, '4.8 holds the submitted record');
  eq(G.credit('4.8'), 'an anonymous reader on 12 November 2026', 'and says who found it');
  ok(G.EX_BY_ID['4.8'].hint.indexOf("And.comm'") >= 0,
     'and its hint points at the lemma that route turns on, not at the longer one');
  // 2.3: five, by alternating the two lemmas of chapter 2 instead of taking the conjunction apart
  eq(G.par('2.3'), 5, '2.3 holds the submitted record');
  eq(G.credit('2.3'), 'PistachioCake on 12 November 2026, and independently by an anonymous reader',
     'and credits both who sent it');
  // 4.3: one, because Impl.idem already says A → A at any formula at all
  eq(G.par('4.3'), 1, '4.3 holds the submitted record');
  ok(G.EX_BY_ID['4.3'].hint.indexOf('Impl.idem') >= 0, 'and its hint admits the one-move route');
  // 6.8: thirteen — the three branch implications, and Or.elim' for the last glue (2026-11-22; it was
  // 14 with a second case_analysis, and 17 before any reader touched it)
  eq(G.par('6.8'), 13, '6.8 holds the submitted record');
  // 9.7: three where the game had eight — the largest saving sent in
  eq(G.par('9.7'), 3, '9.7 holds the submitted record');
  ok(G.EX_BY_ID['9.7'].hint.indexOf("Or.imp_left'") >= 0, 'and its hint maps the excluded middle');
  // every level a reader holds is one the hint should not be talking past: the hint names a recipe the
  // record actually uses, so following it does not cost moves the par does not allow for
  ok(Object.keys(G.CANON_CREDIT).length >= 5,
     Object.keys(G.CANON_CREDIT).length + ' levels are held by readers');
}

// ---------- the QED correspondence ----------
{
  var withQed = G.EXERCISES.filter(function (e) { return e.qed; });
  eq(withQed.length, 125, '125 levels record a QED correspondence');
  eq(G.EXERCISES.filter(function (e) { return e.qedNote; }).length, 24,
     '24 of those are restated differently in QED');
  G.EXERCISES.forEach(function (e) {
    if (e.qedNote) ok(!!e.qed, e.id + ': a restatement note comes with a QED reference');
    if (e.qed) ok(/^\d+\.\d+(\([a-z]\))?(, \d+\.\d+(\([a-z]\))?)*$/.test(e.qed),
                  e.id + ': QED reference "' + e.qed + '" is well formed');
  });
  // QED's numbering must NOT be assumed to agree with ours -- these are the cases that prove it
  eq(G.EX_BY_ID['10.1'].qed, '13.2(b)', 'our 10.1 is QED 13.2(b), not QED 10.1');
  eq(G.EX_BY_ID['11.2'].qed, '23.1(a)', 'our 11.2 is QED 23.1(a) -- a whole section away');
  eq(G.EX_BY_ID['16.2'].qed, '23.2', "Russell's paradox is QED 23.2");
}

// ---------- the brew search: a pruned, lazy walk that may not lose a single brew ----------
// `deductions` used to build every ordering of the selected ingredients up front and try them all. The
// reachability probe behind "hide inactive" selects EVERY potion at once, so on a long proof in a late
// chapter that was a billion tuples, materialised, on every render: two readers reported Chrome eating
// gigabytes and crawling from 18.8 on. It now walks the tuples lazily, skips those a recipe's `slots`
// rule out, and abandons a prefix its `prefix` test says cannot be completed.
//
// All three are OPTIMISATIONS, and the one thing they must never do is hide a brew the player had. So
// the test is a brute-force oracle: enumerate every ordering, call the matcher directly, and demand the
// same answer. If a filter is ever wrong, this is what says so.
{
  const F = G.formulaIng, X = G.varE('X', G.OMEGA);
  const EQo = (x, y) => G.appE('EQ', [x, y]);
  const bench = [
    G.binding('h1', AND(A, B)), G.binding('h2', IMPLIES(A, B)), G.binding('h3', A),
    G.binding('h4', NOT(A)), G.binding('h5', OR(A, B)), G.binding('h6', IFF(A, B)),
    G.binding('h7', IMPLIES(B, C)), G.binding('h8', G.FORALL({ name: 'X', sort: G.OMEGA }, G.appE('P', [X]))),
    G.binding('h9', EQo(G.varE('α', G.OMEGA), G.varE('β', G.OMEGA))),
  ];
  const env = { bindings: bench, vars: [{ name: 'α', sort: G.OMEGA }, { name: 'β', sort: G.OMEGA }],
                goal: null, steps: [], parent: null, assumption: null, depth: 0 };
  const ings = bench.map(b => G.proofIng(b)).concat([F(C), F(A), F(X)]);

  // the oracle: every ordering of distinct ingredients, no pruning, no early exit
  function perms(arr, k) {
    if (k === 0) return [[]];
    const out = [];
    arr.forEach((x, i) => perms(arr.slice(0, i).concat(arr.slice(i + 1)), k - 1).forEach(p => out.push([x].concat(p))));
    return out;
  }
  const show = d => d.recipeId + ' ⊢ ' + render(d.output);
  function brute(recipes, pool) {
    const out = [];
    recipes.forEach(r => perms(pool, r.arity).forEach(inp => r.match(inp, env).forEach(c => {
      if (env.bindings.some(b => exprEq(b.type, c.output))) return;
      out.push(r.id + ' ⊢ ' + render(c.output));
    })));
    return Array.from(new Set(out)).sort();
  }

  // every base recipe, and every lemma the game mints, against the oracle
  const minted = G.EXERCISES.filter(e => e.kind === 'lemma' && e.leanName).map(e => G.recipeFromExercise(e));
  eq(minted.length, 95, 'the game mints 95 lemma recipes (the rest of the 158 levels are examples)');
  ok(minted.some(r => r.arity >= 4), 'some of them take four or more ingredients');
  let checked = 0, lost = [];
  [G.BASE_RECIPES, minted].forEach(group => group.forEach(r => {
    // the oracle is factorial, so give the widest recipes a shorter bench
    const pool = r.arity >= 4 ? ings.slice(0, 6) : ings;
    const want = brute([r], pool);
    const got = Array.from(new Set(G.deductions(env, pool, [r]).map(show))).sort();
    if (want.join('|') !== got.join('|')) lost.push(r.id + ': oracle ' + want.length + ', search ' + got.length);
    checked++;
  }));
  ok(lost.length === 0, 'the pruned search finds exactly what brute force finds, for all ' + checked
     + ' recipes' + (lost.length ? ' — lost: ' + lost.slice(0, 5).join('; ') : ''));

  // `firstOnly` (what the probe asks for) must agree about WHETHER a recipe fires -- that is the only
  // thing read off it, and a card dimmed by mistake is a brew the player cannot see.
  let disagreed = [];
  [G.BASE_RECIPES, minted].forEach(group => group.forEach(r => {
    const pool = r.arity >= 4 ? ings.slice(0, 6) : ings;
    const full = G.deductions(env, pool, [r]).length;
    const first = G.deductions(env, pool, [r], { firstOnly: true }).length;
    if ((full > 0) !== (first > 0) || first > 1) disagreed.push(r.id + ' (' + full + '/' + first + ')');
  }));
  ok(disagreed.length === 0, 'firstOnly fires exactly when the full search does, at most once'
     + (disagreed.length ? ' — ' + disagreed.slice(0, 5).join('; ') : ''));

  // the slot filters and the prefix test are NECESSARY conditions: whatever the matcher accepts, they pass
  let unsound = [];
  [G.BASE_RECIPES, minted].forEach(group => group.forEach(r => {
    if (!r.slots && !r.prefix) return;
    const pool = r.arity >= 4 ? ings.slice(0, 6) : ings;
    perms(pool, r.arity).forEach(inp => {
      if (!r.match(inp, env).length) return;
      inp.forEach((x, i) => { if (r.slots && r.slots[i] && !r.slots[i](x)) unsound.push(r.id + ' slot ' + i); });
      if (r.prefix) for (let d = 0; d < inp.length; d++) if (!r.prefix(inp, d)) unsound.push(r.id + ' prefix ' + d);
    });
  }));
  ok(unsound.length === 0, 'no slot filter or prefix test rejects a tuple the matcher accepts'
     + (unsound.length ? ' — ' + Array.from(new Set(unsound)).slice(0, 5).join('; ') : ''));

  // the formula bench has the same firstOnly contract
  const fpool = [A, B, C, AND(A, B), OR(A, B)];
  const fFull = G.formulaDeductions(fpool, [], G.FORMULA_RECIPES);
  const fFirst = G.formulaDeductions(fpool, [], G.FORMULA_RECIPES, { firstOnly: true });
  ok(fFull.length > 20, 'the formula constructors offer plenty from a five-formula pool (' + fFull.length + ')');
  eq(fFirst.length, Array.from(new Set(fFull.map(d => d.recipeId))).length,
     'firstOnly keeps exactly one formula brew per constructor');

  // ---- eachTuple itself ----
  eq(G.eachTuple([1, 2, 3], 0, null, () => { }), false, 'arity 0 visits the empty tuple once');
  let seen = [];
  G.eachTuple(['a', 'b', 'c'], 2, null, t => { seen.push(t.join('')); });
  eq(seen.join(' '), 'ab ac ba bc ca cb', 'ordered pairs of DISTINCT ingredients, every one of them');
  let n = 0;
  G.eachTuple([1, 2, 3, 4], 2, null, () => { n++; return n === 3; });
  eq(n, 3, 'returning true stops the walk');
  let kept = [];
  G.eachTuple([1, 2, 3], 2, null, t => { kept.push(t); });
  ok(kept.every(t => t === kept[0]), 'the tuple is ONE reused buffer — a caller that keeps it must copy');
  ok(G.deductions(env, ings, [G.RECIPES['And.intro']]).every((d, i, all) => i === 0 || d.inputs !== all[0].inputs),
     'and `deductions` does copy: its brews do not all share one inputs array');
  // a slot filter cuts the walk, and only where it says
  let tried = 0;
  G.eachTuple([1, 2, 3, 4], 2, [x => x % 2 === 0, null], t => { tried++; });
  eq(tried, 6, 'a filter on the first slot alone leaves 2 × 3 tuples');

  // The call the probe actually makes: every potion on a long bench offered twice, against the whole
  // recipe book. Nominally that is 927 MILLION tuples at 28 potions and 5.8 BILLION at 40, which the
  // old walk built as arrays before trying the first one. The guard is on work done rather than on the
  // clock, so it means the same thing on any machine.
  {
    const big = [];
    for (let i = 0; i < 40; i++) big.push(G.binding('p' + i,
      i % 3 === 0 ? AND(A, varE('B' + i)) : i % 3 === 1 ? IMPLIES(A, varE('B' + i)) : OR(A, varE('B' + i))));
    const bigEnv = { bindings: big, vars: [], goal: null, steps: [], parent: null, assumption: null, depth: 0 };
    const twice = [];
    big.forEach(b => { twice.push(G.proofIng(b)); twice.push(G.proofIng(b)); });
    let calls = 0;
    const counted = G.BASE_RECIPES.concat(minted).map(r => Object.assign({}, r, {
      match: function (inp, e) { calls++; return r.match(inp, e); }
    }));
    const brews = G.deductions(bigEnv, twice, counted, { firstOnly: true });
    ok(brews.length > 0, 'a forty-potion bench does offer brews (' + brews.length + ')');
    ok(calls < 400000, 'and finding them costs under 400k matcher calls, not a billion tuples (' + calls + ')');
  }

  // the head test underneath the slot filters
  ok(G.headCompatible(A, AND(B, C)), 'a metavariable is compatible with anything');
  ok(G.headCompatible(AND(A, B), AND(B, C)) && !G.headCompatible(AND(A, B), OR(B, C)),
     'a conjunction template wants a conjunction');
  ok(!G.headCompatible(G.FORALL({ name: 'X', sort: G.OMEGA }, A), G.EXISTS({ name: 'X', sort: G.OMEGA }, A)),
     'a ∀ template does not take an ∃');
  ok(G.headCompatible(G.appE('P', [X]), AND(A, B)), 'a predicate metavariable P(X) is compatible with anything');
}

// ---------- the move log: tidying the bench is part of the proof ----------
// A crafted potion is named after its own statement, so tidying one away frees its name for the next
// brew to take. Renames and deletes therefore have to be IN the log: replay it without them and every
// later ingredient name can mean a different potion, and the measured length is wrong too.
//
// This is not hypothetical. A reader's 19.4 (five moves against a par of twelve, 2026-11-21) came back
// as `Eq.symm': that recipe does not apply to those ingredients` -- indistinguishable from a forgery --
// because they had tidied one unused potion away and the export did not say so.
{
  const synth = { id: 'synth', kind: 'example', chapter: 6, formulas: [A, B],
                  givens: [G.binding('hA', A), G.binding('hB', B)], goal: AND(A, B) };
  const tidy = [
    ['c', 'Or.inl', ['hA', B], null],      // hAB : A ∨ B  -- a brew that led nowhere
    ['del', 'hAB'],                        // tidied away, and its name falls free
    ['c', 'And.intro', ['hA', 'hB'], null],// hAB : A ∧ B  -- the name comes back, meaning something else
    ['c', 'And.left', ['hAB'], null],      // so THIS reads the conjunction
  ];
  const r = G.replayMoves(synth, tidy);
  ok(r.ok, 'a log that records the tidying replays' + (r.ok ? '' : ': ' + r.error));
  eq(r.length, 2, 'and measures only the moves still standing in the proof');

  // the same log with the delete dropped, which is what the game used to export
  const naive = tidy.filter(m => m[0] !== 'del');
  const r2 = G.replayMoves(synth, naive);
  ok(!r2.ok && /And\.left/.test(r2.error),
     'drop it and a later move reaches for the wrong potion entirely (' + (r2.error || 'it still passed!') + ')');

  // a rename moves a name too, and the log carries that as well
  const renamed = G.replayMoves(synth, [['c', 'And.intro', ['hA', 'hB'], null], ['ren', 'hAB', 'conj'],
                                        ['c', 'And.left', ['conj'], null]]);
  ok(renamed.ok, 'a rename replays, and the new name is what later moves use'
     + (renamed.ok ? '' : ': ' + renamed.error));
  ok(!G.replayMoves(synth, [['c', 'And.intro', ['hA', 'hB'], null], ['c', 'And.left', ['conj'], null]]).ok,
     'without it that name is unknown');

  // deleting something a later step was brewed from is refused, as it is in the game
  const bad = G.replayMoves(synth, [['c', 'And.intro', ['hA', 'hB'], null], ['del', 'hA']]);
  ok(!bad.ok && /delete hA/.test(bad.error), 'a log cannot delete a given, and says which move tried');
}

// ---------- the replay line a reader has to paste ----------
// v1 was base64'd JSON, with every expression spelled out in full and a `sort` on every node. A reader
// who found a shorter 18.10 could not post it: the blog refused the comment for length, and that proof's
// line alone ran to 6.5 KB. v2 writes the moves as s-expressions -- about four times shorter, no quotes
// in it to be curled by a comment box, and legible. v1 lines must go on working: records were posted in it.
{
  const X = G.varE('X', G.OMEGA);
  const moves = [
    ['c', 'Or.inl', ['hA', B], null],
    ['c', 'Exists.intro', ['hP', X], G.EXISTS({ name: 'x', sort: G.OMEGA }, G.appE('P', [G.varE('x', G.OMEGA)]))],
    ['a', AND(A, NOT(B))],
    ['d', 'hAB', 2],
    ['n', 'hA', 'hnA'],
    ['n', 'hFalse', null],
    ['v', 'X', 'Ω'],
    ['ob', 'hex', 'b'],
    ['p', 'a', 'Ω'],
    ['ab', 1],
    ['ren', 'hAB2', 'conj'],
    ['del', 'hAB3'],
  ];
  const text = G.encodeMovesText(moves);
  ok(JSON.stringify(G.decodeMovesText(text)) === JSON.stringify(moves),
     'every kind of move survives the compact encoding exactly');
  ok(text.indexOf('"') < 0 && text.indexOf("'") < 0, 'and it contains no quotes for a comment box to curl');
  ok(/^c Or\.inl hA \(v B Prop\)/.test(text), 'a potion is named, a formula is written out: ' + text.slice(0, 40));
  ok(text.length * 3 < G.encodeMoves(moves).length * 2, 'it is substantially shorter than the base64 JSON ('
     + text.length + ' against ' + G.encodeMoves(moves).length + ')');

  // the line itself, in both versions
  const line = G.replayLine('2.1', moves);
  const read = G.readReplayLine(line);
  ok(read && read.version === 2 && read.id === '2.1', 'the line says which version and which level');
  ok(read && JSON.stringify(read.moves) === JSON.stringify(moves), 'and carries the moves back');
  const old = G.readReplayLine('-- grimoire-replay v1 2.1 ' + G.encodeMoves(moves));
  ok(old && old.version === 1 && JSON.stringify(old.moves) === JSON.stringify(moves),
     'a v1 line still reads: a record posted in it must go on working');
  ok(G.readReplayLine('nothing here') === null, 'a line that is not a replay line reads as nothing');
  ok(G.readReplayLine('-- grimoire-replay v9 2.1 xx').moves === null, 'and a version from the future is refused');
  // the blog curls a leading `--` into an em dash; the tool that reads these normalises before it asks
  ok(G.readReplayLine('  -- grimoire-replay v2 2.1 ' + text) !== null, 'leading space is fine');

  // Every scripted solution's log, through the encoding and back. This is the test that matters: the
  // encoder has to be exact for the real corpus, not just for a hand-made list.
  const SOLS = require('./solutions.js');
  let drift = [], biggest = 0;
  G.EXERCISES.forEach(function (ex) {
    if (ex.kind === 'lemma' && ex.leanName && !G.RECIPES[ex.leanName]) G.RECIPES[ex.leanName] = G.recipeFromExercise(ex);
  });
  G.EXERCISES.forEach(function (ex) {
    if (!SOLS.SOL[ex.id]) return;
    const sv = SOLS.solver(ex.id), log = [];
    const mi = x => (typeof x === 'string' ? x : (x && x.proof && x.name ? x.name : (x && x.type ? x.type : x)));
    const rc = sv.c, rce = sv.ce, ra = sv.a, rd = sv.d, rn = sv.n, rv = sv.v, rob = sv.obtain, rp = sv.pick, rab = sv.ab;
    sv.c = (r, ...i) => { log.push(['c', r, i.map(mi), null]); return rc(r, ...i); };
    sv.ce = (r, t, ...i) => { log.push(['c', r, i.map(mi), t]); return rce(r, t, ...i); };
    sv.a = f => { log.push(['a', f]); return ra(f); };
    sv.d = (n, k) => { log.push(['d', n, k]); return rd(n, k); };
    sv.n = (a, b) => { log.push(['n', mi(a), b ? mi(b) : null]); return rn(a, b); };
    sv.v = (n, so) => { log.push(['v', n, so || G.OMEGA]); return rv(n, so); };
    sv.obtain = (e2, v) => { log.push(['ob', e2, v]); return rob(e2, v); };
    sv.pick = v => { log.push(['p', v, G.OMEGA]); return rp(v); };
    sv.ab = l => { log.push(['ab', l]); return rab(l); };
    SOLS.SOL[ex.id](sv);
    const l2 = G.replayLine(ex.id, log), r2 = G.readReplayLine(l2);
    if (!r2 || JSON.stringify(r2.moves) !== JSON.stringify(log)) { drift.push(ex.id + ': round trip'); return; }
    const rep = G.replayMoves(ex, r2.moves);
    if (!rep.ok) drift.push(ex.id + ': ' + rep.error);
    biggest = Math.max(biggest, l2.length);
  });
  ok(drift.length === 0, 'all 158 logs survive the line and replay from it'
     + (drift.length ? ' -- ' + drift.slice(0, 4).join('; ') : ''));
  ok(biggest < 3000, 'and the longest line any level produces fits in a comment box (' + biggest + ' chars)');
}

// ---------- a potion's name must not depend on when it was brewed ----------
// A binding is named after its own statement, and a statement whose substitution has to avoid capture
// renames the bound variable. That rename used a GLOBAL counter, so the same proof played twice gave
// `b'1` one time and `b'3` the next -- and a replay of a reader's log then could not resolve the names.
// Six chapter-18 levels were affected, 18.10 among them, which is the proof a reader was trying to send.
{
  const P = (t) => G.appE('P', [t]), Q = (a, b) => G.appE('Q', [a, b]);
  const b = G.varE('b', G.OMEGA);
  const tmpl = G.FORALL({ name: 'b', sort: G.OMEGA }, Q(G.varE('a', G.OMEGA), G.varE('b', G.OMEGA)));
  const once = G.substE(tmpl, 'a', G.OMEGA, b);
  const twice = G.substE(tmpl, 'a', G.OMEGA, b);
  ok(render(once) === render(twice), 'the same substitution gives the same name every time: ' + render(once));
  ok(/b'1/.test(render(once)), "and it is the first index free, not a counter: " + render(once));
  // an index already taken is stepped over
  const tmpl2 = G.FORALL({ name: 'b', sort: G.OMEGA }, Q(G.varE("b'1", G.OMEGA), G.varE('b', G.OMEGA)));
  ok(/b'2/.test(render(G.substE(tmpl2, "b'1", G.OMEGA, b))), 'a name already in use is stepped over');
}

// ---------- one walk, three readings ----------
// The Lean reading and the informal one were two functions over the same `steps` tree, with identical
// control flow. They are one walk now (`proofNodes`), and the three views are projections of it. The
// tests that matter are the equalities: the projections have to be what the two emitters always were,
// and the hybrid has to be exactly the two of them interleaved -- otherwise a view is lying about a proof.
{
  const SOLS = require('./solutions.js');
  G.EXERCISES.forEach(function (e) {
    if (e.kind === 'lemma' && e.leanName && !G.RECIPES[e.leanName]) G.RECIPES[e.leanName] = G.recipeFromExercise(e);
  });

  // ---- the hybrid is the interleaving, for every scripted proof and every board on the way to it ----
  let drift = [], boards = 0;
  G.EXERCISES.forEach(function (e) {
    if (!SOLS.SOL[e.id]) return;
    const seen = [], sv = SOLS.solver(e.id);
    ['c', 'a', 'd', 'n', 'v', 'obtain', 'pick', 'ce', 'ab'].forEach(function (k) {
      const f = sv[k];
      sv[k] = function () { const r = f.apply(null, arguments); seen.push(sv.env); return r; };
    });
    SOLS.SOL[e.id](sv);
    // the finished proof, and a sample of the part-finished ones (which exercise the open-sub-proof path)
    seen.filter(function (_, i) { return i % 4 === 0; }).concat([sv.env]).forEach(function (env) {
      boards++;
      const both = G.emitBoth(e, env, {}).split('\n');
      const code = both.filter(function (l) { return !/^\s*-- /.test(l); }).join('\n');
      if (code !== G.emitLive(e, env, {})) drift.push(e.id + ': the code in the hybrid is not the Lean view');
      // the prose carries the Lean indent in the hybrid (a comment sits with the line it explains) and its
      // own in the prose view, so compare the lines unindented
      const flat = function (t) { return t.split('\n').map(function (l) { return l.trim(); }).join('\n'); };
      const prose = both.filter(function (l) { return /^\s*-- /.test(l); }).map(function (l) { return l.replace(/^\s*-- /, ''); }).join('\n');
      if (flat(prose) !== flat(G.emitInformalLive(e, env, {}))) drift.push(e.id + ': the comments in the hybrid are not the informal view');
    });
  });
  ok(drift.length === 0, 'the hybrid is exactly the two readings interleaved, across ' + boards + ' boards'
     + (drift.length ? ' -- ' + Array.from(new Set(drift)).slice(0, 4).join('; ') : ''));

  // ---- the hybrid is a Lean file: every comment line is a comment ----
  const both13 = G.emitBoth(EX_BY_ID['9.6'], (function () { const sv = SOLS.solver('9.6'); SOLS.SOL['9.6'](sv); return sv.env; })(), {});
  ok(both13.split('\n').every(function (l) { return !/^\s*--/.test(l) || /^\s*-- /.test(l); }),
     'each comment opens with `-- ` and nothing else can be mistaken for one');
  ok(/^  -- Introduce B:\n  have hBA : B \u2192 \u00ac A := by$/m.test(both13),
     'a comment sits at the indent of the line it explains, directly above it');

  // ---- the words option words the PROSE and leaves the Lean alone ----
  {
    const sv = SOLS.solver('2.1'); SOLS.SOL['2.1'](sv);
    const w = G.emitBoth(EX_BY_ID['2.1'], sv.env, { words: true });
    ok(/-- .*\band\b/.test(w), 'in words mode the comments are worded: ' + (/-- (From.*)/.exec(w) || [])[1]);
    ok(/have hA : A := And\.left hAB/.test(w) && w.indexOf('A and B :=') < 0, 'while the Lean stays Lean');
  }

  // ---- rows, and what a fold hides ----
  {
    const sv = SOLS.solver('9.6'); SOLS.SOL['9.6'](sv);
    const nodes = G.proofNodes(EX_BY_ID['9.6'], sv.env, {});
    const rows = G.nodeRows(nodes, 'both');
    eq(rows.map(function (r) { return r.text; }).join('\n'), G.emitBoth(EX_BY_ID['9.6'], sv.env, {}),
       'the rows and the text are the same thing');
    ok(rows.every(function (r) { return r.cls === 'prose' || r.cls === 'code'; }), 'every row says which reading it is');
    ok(rows.some(function (r) { return r.foldable; }), 'and the sub-proof openers are marked foldable');
    const open = nodes.filter(function (n) { return n.foldable; })[0];
    const inside = rows.filter(function (r) { return G.foldHides(open.path, r.path); });
    ok(inside.length > 0, 'folding the first sub-proof hides its ' + inside.length + ' inner rows');
    ok(!inside.some(function (r) { return r.path === open.path; }), 'but not the line that opens it');
    ok(inside.some(function (r) { return /exact absurd/.test(r.text); }), 'the line that closes the block is inside the fold');
    // a nested block's rows are hidden by the fold of either block
    const nested = nodes.filter(function (n) { return n.foldable; })[1];
    ok(nested && G.foldHides(open.path, nested.path), 'and a fold of the outer block hides the inner one too');
    ok(!G.foldHides(nested.path, open.path), 'not the other way round');
  }

  // ---- the paths a fold is keyed by survive a re-walk, which is what makes folding stick ----
  {
    const sv = SOLS.solver('20.3'); SOLS.SOL['20.3'](sv);
    const a = G.proofNodes(EX_BY_ID['20.3'], sv.env, {}).map(function (n) { return n.path; });
    const b = G.proofNodes(EX_BY_ID['20.3'], sv.env, { words: true, parens: true }).map(function (n) { return n.path; });
    eq(a.join(' '), b.join(' '), 'the paths do not depend on how the statements are rendered');
    ok(new Set(a).size === a.length, 'and no two nodes share one (' + a.length + ' nodes)');
  }
}

// ---------- every recipe can say what it is in words ----------
// The recipe panel names itself after the spellbook's view, so an informal name is no longer optional
// decoration: on the Informal view it is the ONLY name a card shows.
{
  const noWords = [];
  G.BASE_RECIPES.forEach(function (r) { if (!r.informal) noWords.push('base ' + r.id); });
  G.FORMULA_RECIPES.forEach(function (r) { if (!r.informal) noWords.push('formula ' + r.id); });
  G.EXERCISES.forEach(function (e) {
    if (e.kind !== 'lemma' || !e.leanName) return;
    if (!G.recipeFromExercise(e).informal) noWords.push('minted ' + e.id);
  });
  G.EXERCISES.forEach(function (e) {
    G.predRecipes(e).forEach(function (r) { if (!r.informal) noWords.push('predicate ' + e.id + ' ' + r.id); });
  });
  ok(noWords.length === 0, 'every recipe carries an informal name' + (noWords.length ? ' -- ' + noWords.slice(0, 5).join(', ') : ''));
  eq(G.RECIPES['And.left'].informal, 'conjunction elimination (left)', 'which for And.left is what the spellbook prints');
  eq(G.recipeFromExercise(EX_BY_ID['2.1']).informal, "the lemma And.comm'",
     'and for a minted lemma names the lemma, as the spellbook does');
  // the same string the informal proof uses, so the panel and the proof agree
  {
    const SOLS = require('./solutions.js');
    const sv = SOLS.solver('2.2'); SOLS.SOL['2.2'](sv);
    const prose = G.emitInformal(EX_BY_ID['2.2'], sv.env, {});
    ok(prose.indexOf('(' + G.RECIPES['And.left'].informal + ')') >= 0,
       'and it is the very string the informal proof puts in brackets');
  }
}

// ---------- what a comment box does to a pasted record ----------
// The filer reads what a reader pasted, and a blog is not a text file: WordPress turns the line's
// leading `--` into an em dash and curls every apostrophe. v2 was designed with "no quotes in it to be
// curled", which was wrong -- half the recipe names end in a prime -- and the first v2 record to arrive
// came back as `unknown recipe Or.imp’`, which reads exactly like a forgery. The payload is
// identifiers, sorts and symbols, so the filer straightens every quote in it.
{
  const FR = require('./file_record.js');
  const line = G.replayLine('6.11', [['c', "Or.imp'", ['hBC', 'hB', 'hC'], null]]);
  ok(line.indexOf("Or.imp'") > 0, 'a replay line can carry a lemma whose name ends in a prime');
  // as the blog serves it back: em-dashed, curled
  const mangled = line.replace(/^--/, '—').replace(/'/g, '’');
  const read = FR.replayLines(mangled);
  ok(read.length === 1 && read[0].version === 2 && read[0].id === '6.11', 'the filer finds it anyway');
  ok(read[0].payload.indexOf("Or.imp'") >= 0 && read[0].payload.indexOf('’') < 0,
     'with the quotes straightened: ' + read[0].payload);
  ok(JSON.stringify(G.decodeMovesText(read[0].payload)) === JSON.stringify([['c', "Or.imp'", ['hBC', 'hB', 'hC'], null]]),
     'so the moves come back exactly');
  // the other curls a comment box produces, and the left single quote for good measure
  ['‘', 'ʼ', '´', '`'].forEach(function (q) {
    const r = FR.replayLines(line.replace(/'/g, q));
    ok(r.length === 1 && r[0].payload.indexOf("Or.imp'") >= 0, 'and ' + JSON.stringify(q) + ' is straightened too');
  });
  // a v1 line is base64 and has no quotes to curl, but it may be WRAPPED by the comment box
  const v1 = '-- grimoire-replay v1 2.1 ' + G.encodeMoves([['c', 'And.left', ['hAB'], null]]);
  const split = v1.slice(0, 40) + String.fromCharCode(10) + v1.slice(40);
  const back = FR.replayLines(split);
  ok(back.length === 1 && JSON.stringify(G.decodeMoves(back[0].payload)) === JSON.stringify([['c', 'And.left', ['hAB'], null]]),
     'a v1 payload wrapped across lines is put back together');
}

console.log(pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
