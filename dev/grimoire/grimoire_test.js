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

// ---------- tutorial hints ----------
// Hints are prose, and prose rots: a recipe gets renamed and the hint quietly lies. So every hint has
// to name something that actually exists -- a recipe in the registry, or one of the sub-proof gestures
// the interface offers -- and the mechanic-bearing levels are exactly the ones that have hints.
{
  var names = {};
  G.BASE_RECIPES.forEach(function (r) { names[r.id] = true; });
  Object.keys(G.RECIPE_CAP).forEach(function (r) { names[r] = true; });
  var GESTURES = ['Assume', 'Introduce', 'discharge', 'Discharge', 'Obtain', 'Pick'];

  // Hints used to be a tutorial-only affair; since "a hint on every level" they are universal, and the
  // tutorials' are the ones that must name the mechanic being taught (checked just below).
  // the move log: a finished proof can say how it was made, and the engine can check the claim
  (function () {
    var moves = [['c', 'And.left', ['hAB'], null], ['c', 'And.right', ['hAB'], null],
                 ['c', 'And.intro', ['hB', 'hA'], null]];
    var r = G.replayMoves(G.EX_BY_ID['2.1'], moves);
    ok(r.ok, 'a log of three crafts replays into a proof of 2.1');
    eq(r.length, 3, 'and is measured at the length the game would show');
    var enc = G.encodeMoves(moves);
    ok(/^[A-Za-z0-9+/=]+$/.test(enc), 'the encoding is base64, so a blog comment cannot curl a quote in it');
    eq(JSON.stringify(G.decodeMoves(enc)), JSON.stringify(moves), 'and decodes back to the same moves');
    eq(G.decodeMoves('not base64 at all'), null, 'mangled input decodes to nothing rather than throwing');
    eq(G.decodeMoves(G.encodeMoves(['nonsense'])) [0], 'nonsense', 'decoding does not vet the moves');
    // an untrusted log is replayed, not believed
    ok(!G.replayMoves(G.EX_BY_ID['2.1'], [['c', 'And.left', ['hAB'], null]]).ok, 'a log that stops short is not a proof');
    ok(!G.replayMoves(G.EX_BY_ID['2.1'], [['c', 'And.left', ['nope'], null]]).ok, 'nor is one that names a potion that is not there');
    ok(!G.replayMoves(G.EX_BY_ID['2.1'], [['zzz']]).ok, 'nor is one with a move the engine does not know');
    ok(/sub-proof/.test(G.replayMoves(G.EX_BY_ID['4.1'], [['a', G.varE('A')]]).error),
       'a log that ends inside a sub-proof says so');
    // the expressions ride as data, so a term keeps its sort without anything having to re-parse it
    var withExpr = [['c', 'Or.inl', ['hA', { tag: 'var', name: 'B', sort: 'Prop' }], null]];
    eq(JSON.stringify(G.decodeMoves(G.encodeMoves(withExpr))), JSON.stringify(withExpr),
       'an expression ingredient survives the round trip exactly');
  })();

  // the Lean playground link: live.lean-lang.org reads `#code=<uri-encoded>` out of the fragment,
  // splitting the fragment on '&' and then on '=' — so both characters have to survive encoded, or the
  // code would be truncated at the first one.
  (function () {
    var code = 'theorem t (A B : Prop) (h : A \u2227 B) : B \u2227 A := by\n  exact \u27e8h.2, h.1\u27e9\n';
    var url = G.playgroundURL(code);
    ok(url.indexOf('https://live.lean-lang.org/#code=') === 0, 'the link points at the playground');
    ok(url.indexOf('#') > 0 && url.indexOf('?') < 0,
       'the code rides in the fragment, which a browser never sends to the server');
    eq(decodeURIComponent(url.split('#code=')[1]), code, 'and decodes back to exactly the proof');
    var tricky = G.playgroundURL('a = b & c');
    ok(tricky.indexOf('%3D') > 0 && tricky.indexOf('%26') > 0, "'=' and '&' are encoded, not left raw");
    eq(decodeURIComponent(tricky.split('#code=')[1]), 'a = b & c', 'so a proof containing them survives');
    eq(G.playgroundURL('x'.repeat(G.PLAYGROUND_MAX)), null, 'past the cap it returns null rather than a truncated link');
    ok(G.playgroundURL('') !== null && G.playgroundURL(null) !== null, 'an empty proof still gives a link');
  })();

  // id / number / position are three different things (see the note above EXERCISES). These are the
  // invariants that let a chapter be renumbered, or a level moved in the order, without a save migration.
  (function () {
    var ids = {}, nums = {};
    G.EXERCISES.forEach(function (e) {
      ok(!ids[e.id], 'id ' + e.id + ' is used once');
      ids[e.id] = true;
      var n = G.exNum(e);
      ok(!nums[n], 'the number ' + n + ' is shown for one level only');
      nums[n] = true;
    });
    ok(G.EXERCISES.every(function (e) { return G.exNum(e) === (e.num || e.id); }),
       'exNum shows `num` where there is one, and the id otherwise');
    // the numbering runs in the same direction as the array, so "you may lean on earlier levels" means
    // the same thing to a player reading numbers as it does to the par audit reading positions
    var pos = {}; G.EXERCISES.forEach(function (e, i) { pos[e.id] = i; });
    var prev = null, bad = [];
    G.EXERCISES.forEach(function (e) {
      var n = G.exNum(e).split('.').map(Number);
      if (prev && (n[0] < prev[0] || (n[0] === prev[0] && n[1] <= prev[1]))) bad.push(G.exNum(e));
      prev = n;
    });
    eq(bad.length, 0, 'the numbers a player sees run in array order' + (bad.length ? ' (out of step at ' + bad.join(', ') + ')' : ''));
    var fwd = [];
    G.EXERCISES.forEach(function (e) {
      (e.prereqs || []).forEach(function (p2) { if (pos[p2] > pos[e.id]) fwd.push(e.id + '<-' + p2); });
    });
    eq(fwd.length, 0, 'no level waits on one that comes after it' + (fwd.length ? ': ' + fwd.join(', ') : ''));
  })();

  eq(G.EXERCISES.filter(function (e) { return e.hint; }).length, G.EXERCISES.length, 'every level carries a hint');
  G.EXERCISES.forEach(function (e) {
    ok(typeof e.hint === 'string' && e.hint.length > 20, e.id + ': the hint says something');
  });
  G.TUTORIALS.forEach(function (id) {
    var h = G.EX_BY_ID[id].hint;
    ok(!!h, id + ' has a hint');
    if (!h) return;
    var named = Object.keys(names).filter(function (r) { return h.indexOf(r) >= 0; });
    var gestured = GESTURES.filter(function (g) { return h.indexOf(g) >= 0; });
    ok(named.length + gestured.length > 0,
       id + ': its hint names a real recipe or gesture (found ' +
       (named.concat(gestured).join(', ') || 'NOTHING') + ')');
    // a hint that walks the player through the whole proof is not a hint
    ok(h.length < 600, id + ': the hint stays short (' + h.length + ' chars)');
    // the given hypotheses it names must really be among the givens
    (h.match(/h[A-Za-z]+/g) || []).forEach(function (nm) {
      if (nm === 'hypotheses' || nm === 'hypothesis') return;
      ok(G.EX_BY_ID[id].givens.some(function (g) { return g.name === nm; }),
         id + ': the hint names the given ' + nm);
    });
  });
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

console.log(pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
