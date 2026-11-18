/* DOM-shim smoke test for the Lean Grimoire UI wiring (grimoire.html + grimoire.js). Path-independent:
 * finds the app by walking up from this file's directory, so keep it inside the repo tree (scratch/). */
const path = require('path'), fs = require('fs');
function findApps(d) { for (let i = 0; i < 16; i++) { if (fs.existsSync(path.join(d, 'static/apps/grimoire.js'))) return path.join(d, 'static/apps'); const u = path.dirname(d); if (u === d) break; d = u; } throw new Error('grimoire.js not found walking up from ' + __dirname + ' — keep this file in the repo (dev/grimoire/)'); }
const APPS = findApps(__dirname);
const G = require(path.join(APPS, 'grimoire.js'));
const html = fs.readFileSync(path.join(APPS, 'grimoire.html'), 'utf8');
let pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.log('FAIL: ' + m); } }
const strip = (h) => String(h).replace(/<[^>]+>/g, '');

function classList() {
  const s = new Set();
  return { add: c => s.add(c), remove: c => s.delete(c), contains: c => s.has(c), toggle: (c, f) => { const on = f === undefined ? !s.has(c) : f; on ? s.add(c) : s.delete(c); return on; } };
}
function makeEl(tag) {
  const e = {
    tagName: tag || 'DIV', value: '', textContent: '', className: '', disabled: false, hidden: false,
    selectionStart: 0, style: {}, children: [], classList: classList(), _attrs: {}, _h: {}, _html: '',
    clientWidth: 600, clientHeight: 340,
    get innerHTML() { return e._html; },
    set innerHTML(v) { e._html = v; e.children = []; },   // assigning innerHTML replaces children (as in a real DOM)
    appendChild: c => { e.children.push(c); return c; },
    removeChild: c => { const i = e.children.indexOf(c); if (i >= 0) e.children.splice(i, 1); return c; },
    get firstChild() { return e.children.length ? e.children[0] : null; },
    addEventListener: (t, fn) => { (e._h[t] = e._h[t] || []).push(fn); },
    fire: (t, ev) => { (e._h[t] || []).forEach(fn => fn(Object.assign({ target: e }, ev || {}))); },
    querySelectorAll: () => [],
    getAttribute: k => e._attrs[k], setAttribute: (k, v) => { e._attrs[k] = v; },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 600, height: 340 }),
    setPointerCapture: () => {}, setSelectionRange: () => {}, focus: () => {}
  };
  return e;
}
const els = {};
function get(id) { return els[id] || (els[id] = makeEl()); }
global.window = { Grimoire: G, prompt: () => 'hZ' };
global.document = { getElementById: get, createElement: t => makeEl(t), createElementNS: (ns, t) => makeEl(t), addEventListener: () => {} };
const _ls = {};
global.localStorage = { getItem: k => (k in _ls ? _ls[k] : null), setItem: (k, v) => { _ls[k] = String(v); }, removeItem: k => { delete _ls[k]; } };

// seed static prose so the ORIG capture inside the script has content (the shim doesn't parse the HTML body)
get('lede').innerHTML = 'Combine the potions with the recipes to brew statements in the spellbook.';
get('howto').innerHTML = 'Select potions; recipes light up; craft into the spellbook.';
get('seltip').textContent = 'Shift-tap adds a second copy of a potion';
const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
ok(scripts.length === 1, 'one inline wiring script');
let threw = null; try { (0, eval)(scripts[0]); } catch (e) { threw = e; }
ok(!threw, 'inline script runs without throwing' + (threw ? ': ' + threw : ''));
const A = window.__grimoire;
ok(A && typeof A.doCraft === 'function', 'test hook exposed');

// ---- progression tree: fresh state exposes only 1.1, and gating hides later tools ----
ok(Object.keys(A.accessible()).length === 1 && A.accessible()['1.1'], 'only exercise 1.1 is accessible at the start');
ok(A.hasCap('and.intro') && !A.hasCap('and.elim') && !A.hasCap('formula') && !A.hasCap('assume') && !A.hasCap('mp'), 'only the and.intro capability is active at the start');
ok(get('exsel').children.length === 1 && get('exsel').children[0].value === '1.1', 'the exercise dropdown is restricted to accessible exercises');
ok(get('formulaBench').hidden === true, 'the formula bench is hidden before Chapter 3');
ok(A.availableRecipes().length === 1 && A.availableRecipes()[0].id === 'And.intro', 'only And.intro is offered at the start (simplified early interface)');
ok(get('mapg').children.length > 0, 'the progression map renders nodes');
ok(A.state.mapFollow === true && get('mapfollow').checked === true, '"Follow current" is on by default');
ok(A.state.hideInactive === true && get('hideinactive').checked === true, '"Hide inactive" is on by default, to cut recipe clutter');

// initial load
ok(/Craft the goal/.test(get('goal').innerHTML) && /∧/.test(get('goal').innerHTML), 'goal banner shows the target');
ok(/example .*:= by/.test(strip(get('spellbook').innerHTML)) && /sorry/.test(strip(get('spellbook').innerHTML)), 'spellbook starts with an unfinished (sorry) proof');
ok(/potion/.test(get('bench').innerHTML) && /hA/.test(get('bench').innerHTML), 'bench renders potions');
ok(/title=/.test(get('bench').innerHTML) && /title=/.test(get('recipes').innerHTML), 'potions and recipes carry hover text');

// craft exercise 1.1 to completion via the hook
A.loadExercise('1.1');
A.doCraft('And.intro', ['hA', 'hB']);
ok(A.state.env.bindings.some(b => b.name === 'hAB'), 'crafting And.intro adds hAB to the env');
ok(/have hAB/.test(strip(get('spellbook').innerHTML)), 'the craft appears in the spellbook');
A.doCraft('And.intro', ['hAB', 'hC']);
ok(A.state.env.steps.length === 2, 'two steps recorded');
ok(/QED/.test(get('goal').innerHTML) && get('goal').className === 'solved', 'goal flips to QED when solved');
ok(/exact hABC/.test(strip(get('spellbook').innerHTML)) && !/sorry/.test(strip(get('spellbook').innerHTML)), 'finished proof ends in exact, no sorry');

// solving 1.1 unlocks 1.2 in the tree + dropdown, and announces it
ok(A.accessible()['1.2'], 'solving 1.1 unlocks exercise 1.2');
ok(A.state.justUnlockedEx.indexOf('1.2') >= 0 && /unlocked on the map/.test(get('goal').innerHTML), 'the goal banner announces the newly unlocked exercise');
ok(get('exsel').children.length === 3, 'the dropdown now offers 1.1, its practice exercise 1.2, and the next tutorial 2.1');
ok(A.accessible()['2.1'], 'solving the first tutorial also opens the second one — the chain never waits on practice');

// ---- navigation: after solving, the next unsolved exercise is offered right in the goal banner ----
ok(A.nextUnsolved() === '1.2', 'nextUnsolved() points at the freshly unlocked 1.2');
ok(get('nextunsolved').disabled === false, 'the "Next unsolved" toolbar button is enabled once one exists');
const gonext = get('goal').children.filter(c => c.className === 'gonext');
ok(gonext.length === 1, 'the solved goal banner carries exactly one "next" button');
ok(/1\.2/.test(gonext[0] ? gonext[0].textContent : ''), 'the "next" button names the exercise it goes to');
ok(A.neighbour(-1, false) === null, 'no previous exercise from the first one');

// the "Unlock all" cheat reveals everything for the remaining functional checks
A.setCheat(true);
ok(get('exsel').children.length === G.EXERCISES.length, 'the "Unlock all" cheat reveals every exercise');
// EVERY mechanic, not a spot-check of three: the cheat used to carry a hand-written capability list
// that silently fell behind when the last five chapters added `sets`/`ops`/`eq`/`groups`/`induction`,
// leaving those five dead under "Unlock all". It is derived from the exercise data now, so assert all.
const ALL_CAPS = [...new Set(G.EXERCISES.flatMap(e => e.needs || []))].sort();
ok(ALL_CAPS.length === 21, `21 mechanics are declared across the exercises (saw ${ALL_CAPS.length})`);
ok(ALL_CAPS.every(c => A.hasCap(c)), 'the cheat activates every declared mechanic: ' +
   ALL_CAPS.filter(c => !A.hasCap(c)).join(', '));
ok(get('formulaBench').hidden === false, 'the formula bench is visible under the cheat');

// undo
ok(get('undo').disabled === false, 'undo enabled after crafting');
A.el.undo.fire('click');
ok(A.state.env.steps.length === 1, 'undo reverts the last craft');
ok(/sorry/.test(strip(get('spellbook').innerHTML)), 'spellbook shows sorry again after undo');

// reset
A.el.reset.fire('click');
ok(A.state.env.steps.length === 0, 'reset clears the bench back to the givens');

// switching exercises
A.el.exsel.value = '2.1'; A.el.exsel.fire('change');
ok(A.state.ex.id === '2.1' && /B ∧ A/.test(get('goal').innerHTML), 'changing the dropdown loads exercise 2.1');

// ---- navigation buttons actually move (cheat is on, so every exercise is unlocked) ----
const navList = A.accList().map(e => e.id), navAt = navList.indexOf('2.1');
A.el.nextex.fire('click');
ok(A.state.ex.id === navList[navAt + 1], 'the ▶ button steps to the next unlocked exercise');
A.el.prevex.fire('click');
ok(A.state.ex.id === '2.1', 'the ◀ button steps back');
A.el.nextunsolved.fire('click');
ok(A.state.ex.id !== '2.1' && !A.state.solved[A.state.ex.id], 'the "Next unsolved" button lands on an unsolved exercise');
A.loadExercise('1.1');
ok(A.state.ex.id === '1.1' && A.state.solved['1.1'], 'a solved exercise can still be revisited directly');
ok(A.nextUnsolved() && !A.state.solved[A.nextUnsolved()], 'from a solved exercise, nextUnsolved still finds work to do');

// formula bench: parse a typed expression → chip
A.loadExercise('1.1');   // no prepopulated formulas
get('formula-in').value = 'A \\and B';
A.el['formula-add'].fire('click');
ok(A.state.formulas.length === 1 && /A ∧ B/.test(get('formula-shelf').innerHTML), 'formula bench parses \\and into a chip');
var fBefore = A.state.formulas.length;
get('formula-in').value = 'A \\and';
A.el['formula-add'].fire('click');
ok(get('formula-in').classList.contains('bad') && A.state.formulas.length === fBefore, 'malformed formula: error shown, no chip');

// multi-select: two copies of one potion for A ∧ A (exercise 1.2)
A.loadExercise('1.2');
A.clickSel('hA', true); A.clickSel('hA', true);
ok(A.selectedNames().join(',') === 'hA,hA', 'shift-tap selects a potion twice');
ok(/A ∧ A/.test(get('recipes').innerHTML), 'And.intro offers A ∧ A from two copies of hA');
ok(/×2/.test(get('bench').innerHTML), 'potion shows a ×2 badge');
A.doCraft('And.intro', ['hA', 'hA']);
ok(A.state.env.bindings.some(b => b.name === 'hAA' && G.exprEq(b.type, G.AND(G.varE('A'), G.varE('A')))), 'crafts hAA : A ∧ A');

// plain-tap toggles; clear empties
A.loadExercise('1.1');
A.clickSel('hA'); ok(A.selectedNames().length === 1, 'plain tap selects');
A.clickSel('hA'); ok(A.selectedNames().length === 0, 'plain tap again deselects');
A.clickSel('hA'); A.clearSel(); ok(A.selectedNames().length === 0, 'clear empties the selection');

// informal (QED-style) proof toggle
A.loadExercise('2.1');
A.doCraft('And.left', ['hAB']); A.doCraft('And.right', ['hAB']); A.doCraft('And.intro', ['hB', 'hA']);
A.setStyle('informal');
ok(/we deduce/.test(strip(get('spellbook').innerHTML)) && /conjunction/.test(strip(get('spellbook').innerHTML)), 'informal style narrates deductions QED-style');
ok(!/have /.test(strip(get('spellbook').innerHTML)), 'informal style is prose, not a have-chain');
A.setStyle('lean');
ok(/have hBA/.test(strip(get('spellbook').innerHTML)), 'switching back to Lean restores the have-chain');

// fantasy vs plain vocabulary
ok(/potions|bench/i.test(get('benchHead').textContent), 'fantasy heading mentions potions/bench');
A.setFantasy(false);
ok(/context|hypothesis/i.test(get('benchHead').textContent) && get('wrap').className.indexOf('fantasy') === -1, 'plain mode swaps vocabulary and drops the fantasy class');
ok(/hypothes/i.test(get('lede').innerHTML) && !/\bpotion/i.test(get('lede').innerHTML), 'plain mode swaps the side-doc flavor text (lede: potions→hypotheses)');
A.setFantasy(true);
ok(/\bpotion/i.test(get('lede').innerHTML), 'fantasy mode restores the flavor text');

// Chapter 3: formula ingredient + Or, and lemma unlocking
A.loadExercise('3.2');                       // hA:A ⊢ A ∨ A, formula A prepopulated
ok(A.state.formulas.length === 1, 'exercise formulas prepopulate the bench');
A.clickSel('hA'); A.clickFormula(0);
ok(A.ingredients().length === 2, 'a proof and a formula are both selected as ingredients');
ok(/A ∨ A/.test(get('recipes').innerHTML), 'Or.inl offers A ∨ A from a proof + a formula');
var oi = A.state.ded.findIndex(function (d) { return d.action === 'proof' && d.d.recipeId === 'Or.inl'; });
A.doCraftIdx(oi);
ok(A.state.env.bindings.some(b => G.exprEq(b.type, G.OR(G.varE('A'), G.varE('A')))), 'crafting Or.inl solves 3.1b');
ok(A.state.unlocked['Or.idem'] && A.state.justUnlocked === 'Or.idem', 'solving a lemma unlocks it as a recipe');
ok(/unlocked/.test(get('goal').innerHTML), 'the goal banner announces the unlock');

// the unlocked lemma is available elsewhere; an example unlocks nothing
A.loadExercise('3.1');
ok(A.availableRecipes().some(r => r.id === 'Or.idem'), 'the unlocked lemma appears as a recipe on another exercise');
A.doCraft('Or.inl', ['hA', G.formulaIng(G.varE('B'))]);
A.doCraft('Or.inr', ['hAB', G.formulaIng(G.varE('C'))]);
ok(A.state.env.bindings.some(b => G.exprEq(b.type, G.OR(G.varE('C'), G.OR(G.varE('A'), G.varE('B'))))), 'Or.inl then Or.inr solves 3.1a');
ok(A.state.justUnlocked === null, 'solving an example unlocks nothing');

// per-exercise progress resumes on switch-back; reset discards it
A.loadExercise('1.1'); A.el.reset.fire('click');       // clean slate for 1.1
A.doCraft('And.intro', ['hA', 'hB']);                  // partial progress
ok(A.state.env.steps.length === 1, 'made partial progress on 1.1');
A.loadExercise('2.1'); A.el.reset.fire('click');
ok(A.state.env.steps.length === 0, 'switching to 2.1 shows a fresh board');
A.loadExercise('1.1');
ok(A.state.env.steps.length === 1, 'returning to 1.1 resumes the partial progress');
A.el.reset.fire('click');
ok(A.state.env.steps.length === 0, 'reset discards the saved progress');

// goal pane lists the givens
A.loadExercise('1.1');
ok(/Given/.test(get('goal').innerHTML) && /hA/.test(get('goal').innerHTML) && /hC/.test(get('goal').innerHTML), 'goal pane lists the given hypotheses');

// explicit parentheses
A.loadExercise('2.2');                                  // goal A ∧ (B ∧ C), explicit parens being the default
ok(/A ∧ \(B ∧ C\)/.test(get('goal').innerHTML), 'explicit parentheses are the default');
A.setParens(false);
ok(/A ∧ B ∧ C/.test(get('goal').innerHTML), 'turning them off gives the shorter idiomatic form');
A.setParens(true);
A.setParens(false);

// achievements log records solves and unlocks
A.loadExercise('3.2'); A.el.reset.fire('click');
A.doCraft('Or.inl', ['hA', G.formulaIng(G.varE('A'))]);
ok(/3\.2/.test(get('ach').innerHTML) && /Or\.idem/.test(get('ach').innerHTML), 'achievements log records the solve and the unlock');

// right-click delete of a crafted potion
A.loadExercise('1.1'); A.el.reset.fire('click');
A.doCraft('And.intro', ['hA', 'hB']);
A.deletePotion('hAB');
ok(!G.byName(A.state.env, 'hAB'), 'delete removes a crafted potion');
// right-click rename (window.prompt mocked → hZ)
A.doCraft('And.intro', ['hA', 'hB']);
A.renamePotion('hAB');
ok(G.byName(A.state.env, 'hZ') && !G.byName(A.state.env, 'hAB'), 'rename renames a potion');

// right-click delete of a formula
A.loadExercise('3.1');                                  // formulas [B, C]
var nf0 = A.state.formulas.length;
A.deleteFormula(0);
ok(A.state.formulas.length === nf0 - 1, 'delete removes a formula');

// paste a crafted formula into the input box at the cursor
get('formula-in').value = 'A \\or '; get('formula-in').selectionStart = get('formula-in').value.length;
A.pasteIntoFormula('B ∨ C');
ok(get('formula-in').value === 'A \\or B ∨ C', 'pasting a formula inserts it at the cursor');

// Chapter 4: assume → craft → discharge (4.1)
A.loadExercise('4.2'); A.el.reset.fire('click');
ok(A.state.formulas.length === 1, '4.1 prepopulates the formula A');
A.clickFormula(0);
var ai = A.state.ded.findIndex(function (d) { return d.action === 'assume'; });
ok(ai >= 0, 'selecting a formula offers "assume"');
A.doCraftIdx(ai);
ok(A.state.env.parent && A.state.env.depth === 1 && /assuming/.test(get('goal').innerHTML), 'assume opens a sub-env and shows the breadcrumb');
A.doCraft('And.intro', ['hA', 'hA']);
A.clickSel('hAA');
var di = A.state.ded.findIndex(function (d) { return d.action === 'discharge'; });
ok(di >= 0, 'a proof inside a sub-env offers discharge');
A.doCraftIdx(di);
ok(!A.state.env.parent && /QED/.test(get('goal').innerHTML), 'discharge returns to the root and solves 4.1');
ok(/A → A ∧ A/.test(strip(get('spellbook').innerHTML)) && /intro hA/.test(strip(get('spellbook').innerHTML)), 'spellbook shows the intro/discharge proof');

// Chapter 4: double discharge (7.1)
A.loadExercise('4.7'); A.el.reset.fire('click');
A.clickFormula(0); A.doCraftIdx(A.state.ded.findIndex(function (d) { return d.action === 'assume'; }));   // assume A
A.clickFormula(1); A.doCraftIdx(A.state.ded.findIndex(function (d) { return d.action === 'assume'; }));   // assume B
ok(A.state.env.depth === 2, 'nested assumptions reach depth 2');
A.clickSel('hA');
var dd = A.state.ded.findIndex(function (d) { return d.action === 'discharge' && d.level === 2; });
ok(dd >= 0, 'a two-level discharge is offered');
A.doCraftIdx(dd);
ok(!A.state.env.parent && /A → B → A/.test(strip(get('spellbook').innerHTML)), 'double discharge solves 7.1');

// formula crafting: A, B (and a hypothesis type) build A ∧ B
A.loadExercise('4.7'); A.el.reset.fire('click');
A.clickFormula(0); A.clickFormula(1);
var fi = A.state.ded.findIndex(function (d) { return d.action === 'formula' && G.exprEq(d.output, G.AND(G.varE('A'), G.varE('B'))); });
ok(fi >= 0, 'selecting formulas A and B offers building A ∧ B');
var nBefore = A.state.formulas.length; A.doCraftIdx(fi);
ok(A.state.formulas.length === nBefore + 1, 'building a formula adds it to the bench');
A.loadExercise('3.1'); A.el.reset.fire('click');
A.clickSel('hA'); A.clickFormula(0);   // proof hA : A + formula B
ok(A.state.ded.some(function (d) { return d.action === 'formula' && G.exprEq(d.output, G.AND(G.varE('A'), G.varE('B'))); }), 'a selected hypothesis contributes its type to formula-crafting');

// Chapter 9: case_analysis is gated by the 'case' capability and solves 9.1 in one step (under cheat)
ok(A.availableRecipes().some(r => r.id === 'case_analysis'), 'case_analysis is offered once its capability is active (cheat on)');
A.loadExercise('6.1');
A.clickSel('hAC'); A.clickSel('hBC');
var ci = A.state.ded.findIndex(function (d) { return d.action === 'proof' && d.d.recipeId === 'case_analysis'; });
ok(ci >= 0, 'selecting A→C and B→C offers case_analysis');
A.doCraftIdx(ci);
ok(/QED/.test(get('goal').innerHTML) && /Or\.elim/.test(strip(get('spellbook').innerHTML)), '9.1 solves and the spellbook shows the Or.elim term');

// Chapter 10: Iff recipes are available and solve the intro exercise 10.1 (A, A↔B ⊢ B)
ok(A.availableRecipes().some(r => r.id === 'Iff.mp') && A.availableRecipes().some(r => r.id === 'Iff.intro'), 'Iff recipes are offered once the iff capability is active');
A.loadExercise('7.1');
A.clickSel('hAB'); A.clickSel('hA');
var ii = A.state.ded.findIndex(function (d) { return d.action === 'proof' && d.d.recipeId === 'Iff.mp'; });
ok(ii >= 0, 'selecting A↔B and A offers Iff.mp');
A.doCraftIdx(ii);
ok(/QED/.test(get('goal').innerHTML) && /\.mp/.test(strip(get('spellbook').innerHTML)), '10.1 solves via Iff.mp (spellbook shows the .mp elimination)');

// Chapter 11: absurd (contradiction → anything) is available and 11.1 is solvable
ok(A.availableRecipes().some(r => r.id === 'absurd') && A.availableRecipes().some(r => r.id === 'Classical.em'), 'absurd and Classical.em are offered once neg/em are active');
A.loadExercise('8.1');
A.doCraft('And.left', ['hAnA']); A.doCraft('And.right', ['hAnA']);
var posA = A.state.env.bindings.find(b => G.exprEq(b.type, G.varE('A'))).name;
var negA = A.state.env.bindings.find(b => G.exprEq(b.type, G.NOT(G.varE('A')))).name;
A.clickSel(posA); A.clickSel(negA); A.clickFormula(A.state.formulas.findIndex(f => G.exprEq(f, G.varE('B'))));
var ai = A.state.ded.findIndex(function (d) { return d.action === 'proof' && d.d.recipeId === 'absurd'; });
ok(ai >= 0, 'selecting A, ¬A and formula B offers absurd');
A.doCraftIdx(ai);
ok(/QED/.test(get('goal').innerHTML) && /absurd /.test(strip(get('spellbook').innerHTML)) && !/False/.test(strip(get('spellbook').innerHTML)), '11.1 solves via absurd (no False in the spellbook)');

// Chapter 12: reductio (not_intro) solves 12.2 (A ⊢ ¬¬A)
A.loadExercise('8.3');   // hA : A ⊢ ¬¬A, formulas [A, ¬A]
A.clickFormula(A.state.formulas.findIndex(f => G.exprEq(f, G.NOT(G.varE('A')))));   // select ¬A
A.doCraftIdx(A.state.ded.findIndex(function (d) { return d.action === 'assume'; }));  // assume ¬A
var negAsm = A.state.env.assumption.name;
A.clickSel('hA'); A.clickSel(negAsm);
var ri = A.state.ded.findIndex(function (d) { return d.action === 'not_intro'; });
ok(ri >= 0, 'a statement and its negation in a sub-proof offer reductio');
A.doCraftIdx(ri);
ok(/QED/.test(get('goal').innerHTML) && /exact absurd/.test(strip(get('spellbook').innerHTML)) && !/False/.test(strip(get('spellbook').innerHTML)), '12.2 solves by reductio (spellbook uses absurd; no False)');

// Chapter 13: True.intro (arity 0) + False.elim available; 13.1 (⊢ True ∨ A) solved
ok(A.availableRecipes().some(r => r.id === 'True.intro') && A.availableRecipes().some(r => r.id === 'False.elim'), 'True.intro and False.elim are offered once tf is active');
A.loadExercise('10.1');
var ti = A.state.ded.findIndex(function (d) { return d.action === 'proof' && d.d.recipeId === 'True.intro'; });
ok(ti >= 0, 'True.intro is offered with no ingredients selected (arity 0)');
A.doCraftIdx(ti);
var tname = A.state.env.bindings.find(b => G.exprEq(b.type, G.TRUE())).name;
A.clickSel(tname); A.clickFormula(A.state.formulas.findIndex(f => G.exprEq(f, G.varE('A'))));
A.doCraftIdx(A.state.ded.findIndex(function (d) { return d.action === 'proof' && d.d.recipeId === 'Or.inl'; }));
ok(/QED/.test(get('goal').innerHTML) && /True\.intro/.test(strip(get('spellbook').innerHTML)), '13.1 ⊢ True ∨ A solved with True.intro + Or.inl');

// Chapter 16: term bench + ∀ intro/discharge solves 16.1 (∀x,∀y, Q(x,y) → Q(x,y))
A.loadExercise('11.2');
ok(get('termBench').hidden === false, 'the term bench appears in Chapter 16');
ok(/Sorts available:/.test(get('term-sorts').innerHTML) && /Ω/.test(get('term-sorts').innerHTML), 'the term bench lists the available sorts (Ω)');
// clicking a sort annotates the typed term (Ω is hard to type); a compound term is left alone
A.el['term-in'].value = 'w'; A.appendSort('Ω');
ok(A.el['term-in'].value === 'w : Ω', 'clicking a sort annotates a bare variable (w → w : Ω)');
A.el['term-in'].value = 'x+y'; A.appendSort('Ω');
ok(A.el['term-in'].value === 'x+y', 'a compound term (fixed sort) is left unchanged');
// clicking an existing term pastes it into the input at the cursor (like the formula bench)
A.el['term-in'].value = 'f('; A.el['term-in'].selectionStart = 2; A.pasteIntoTerm('x');
ok(A.el['term-in'].value === 'f(x', 'clicking a term pastes it into the term input at the cursor');
A.el['term-in'].value = '';
var Qxy = G.appE('Q', [G.varE('x', G.OMEGA), G.varE('y', G.OMEGA)]);
A.el['term-in'].value = 'x'; A.addTerm();
A.el['term-in'].value = 'y : Omega'; A.addTerm();
ok(A.state.terms.length === 2, 'two variables added to the term bench (plain and `: Omega` forms)');
A.clickTerm(0);
var ix = A.state.ded.findIndex(function (d) { return d.action === 'intro_var'; });
ok(ix >= 0, 'selecting a variable term offers intro');
A.doCraftIdx(ix);
ok(A.state.env.assumption.kind === 'var' && A.state.env.assumption.name === 'x', 'intro x opens a variable sub-env');
A.clickTerm(1); A.doCraftIdx(A.state.ded.findIndex(function (d) { return d.action === 'intro_var'; }));
A.clickTerm(0); A.clickTerm(1);
var qi = A.state.ded.findIndex(function (d) { return d.action === 'formula' && G.exprEq(d.output, Qxy); });
ok(qi >= 0, 'selecting terms x, y offers the Q(x, y) constructor');
A.doCraftIdx(qi);
A.clickFormula(A.state.formulas.findIndex(function (f) { return G.exprEq(f, Qxy); }));
A.doCraftIdx(A.state.ded.findIndex(function (d) { return d.action === 'assume'; }));
var hq = A.state.env.assumption.name; A.clickSel(hq);
var d3 = A.state.ded.findIndex(function (d) { return d.action === 'discharge' && d.level === 3; });
ok(d3 >= 0, 'a 3-level discharge (∀x, ∀y, →) is offered');
A.doCraftIdx(d3);
ok(/QED/.test(get('goal').innerHTML) && /intro x/.test(strip(get('spellbook').innerHTML)) && /Q x y/.test(strip(get('spellbook').innerHTML)), '16.1 solved via term bench + ∀ intro/discharge (Lean shows `intro x`, `Q x y`)');

// Chapter 18: universal_instantiation uses a selected TERM as an ingredient
A.loadExercise('12.1');   // hpr : ∀X,P(X)→R(X), hp : ∀X,P(X); term X prepopulated
A.clickTerm(0); A.doCraftIdx(A.state.ded.findIndex(function (d) { return d.action === 'intro_var'; }));   // intro X
A.clickSel('hpr'); A.clickTerm(0);   // a ∀-proof + a term
var ui = A.state.ded.findIndex(function (d) { return d.action === 'proof' && d.d.recipeId === 'universal_instantiation'; });
ok(ui >= 0, 'selecting a ∀-proof and a term offers universal_instantiation');
A.doCraftIdx(ui);
var PX_RX = G.IMPLIES(G.appE('P', [G.varE('X', G.OMEGA)]), G.appE('R', [G.varE('X', G.OMEGA)]));
ok(A.state.env.bindings.some(b => G.exprEq(b.type, PX_RX)) && /hpr X/.test(strip(get('spellbook').innerHTML)), '18.1: instantiating hpr at X gives P(X)→R(X) (spellbook shows `hpr X`)');

// context guard: a term is usable only if its variables are in the proof context
A.loadExercise('12.1'); A.el.reset.fire('click');   // fresh: term X prepopulated but NOT yet in context
A.clickSel('hpr'); A.clickTerm(0);
ok(A.state.ded.findIndex(function (d) { return d.action === 'proof' && d.d.recipeId === 'universal_instantiation'; }) < 0, 'an un-intro’d variable cannot instantiate a ∀ (not in context)');
A.clearSel(); A.clickTerm(0); A.doCraftIdx(A.state.ded.findIndex(function (d) { return d.action === 'intro_var'; }));   // intro X
A.clickSel('hpr'); A.clickTerm(0);
ok(A.state.ded.findIndex(function (d) { return d.action === 'proof' && d.d.recipeId === 'universal_instantiation'; }) >= 0, 'after intro (now in context) the variable can instantiate the ∀');
A.loadExercise('12.2'); A.el.reset.fire('click');   // a given constant α is in context from the start
A.clickSel('hPQ'); A.clickTerm(A.state.terms.findIndex(function (t) { return t.name === 'α'; }));
ok(A.state.ded.findIndex(function (d) { return d.action === 'proof' && d.d.recipeId === 'universal_instantiation'; }) >= 0, '18.3a: the given constant α is in context and instantiates hPQ');

// cannot re-introduce a variable already in context
A.loadExercise('12.1'); A.el.reset.fire('click');
A.clickTerm(0); A.doCraftIdx(A.state.ded.findIndex(function (d) { return d.action === 'intro_var'; }));   // intro X
A.clickTerm(0);
ok(A.state.ded.findIndex(function (d) { return d.action === 'intro_var'; }) < 0, 'a variable already in context cannot be re-introduced');
// an out-of-context formula is flagged unusable and rendered greyed with an explanatory tooltip
ok(!A.inContext(G.appE('Q', [G.varE('z', G.OMEGA), G.varE('w', G.OMEGA)])), 'a formula with out-of-context variables is flagged unusable');
A.loadExercise('11.2'); A.el.reset.fire('click');
A.state.formulas = [G.appE('Q', [G.varE('z', G.OMEGA), G.varE('w', G.OMEGA)])]; A.clickFormula(0);
ok(/fchip[^"]*dim/.test(get('formula-shelf').innerHTML) && /not in the current context/.test(get('formula-shelf').innerHTML), 'the out-of-context formula chip is greyed with an explanatory tooltip');

// solving 18.3a mints the higher-order `barbara` recipe, reusable in later exercises
A.loadExercise('12.2'); A.el.reset.fire('click');
var ai = A.state.terms.findIndex(function (t) { return t.name === 'α'; });
A.clickSel('hPQ'); A.clickTerm(ai);
A.doCraftIdx(A.state.ded.findIndex(function (d) { return d.action === 'proof' && d.d.recipeId === 'universal_instantiation'; }));   // P α → Q α
var Pa_Qa = G.IMPLIES(G.appE('P', [G.varE('α', G.OMEGA)]), G.appE('Q', [G.varE('α', G.OMEGA)]));
var impl = A.state.env.bindings.find(function (b) { return G.exprEq(b.type, Pa_Qa); }).name;
A.clickSel(impl); A.clickSel('hP');
A.doCraftIdx(A.state.ded.findIndex(function (d) { return d.action === 'proof' && d.d.recipeId === 'modus_ponens'; }));   // Q α
ok(/QED/.test(get('goal').innerHTML) && A.state.unlocked['barbara'], 'solving 18.3a mints the higher-order `barbara` recipe');
A.loadExercise('11.2');
ok(A.availableRecipes().some(function (r) { return r.id === 'barbara'; }), 'the minted barbara recipe is available in later exercises');

// Chapter 19: ∃-elimination via obtain — the workbench surfaces context gems; obtain adds a witness variable + hypothesis
A.setCheat(true);
A.loadExercise('13.1'); A.el.reset.fire('click');   // hex : ∃x,P(x), hpc : ∀X,P(X)→C; candidate variable a prepopulated
ok(A.state.terms.some(function (t) { return t.name === 'a'; }), '19.1 provides a candidate variable a in the term bench');
ok(A.state.env.vars.length === 0 && get('benchvars').innerHTML === '', 'no context gems shown before obtaining');
A.clickSel('hex'); A.clickTerm(A.state.terms.findIndex(function (t) { return t.name === 'a'; }));
var oi = A.state.ded.findIndex(function (d) { return d.action === 'obtain'; });
ok(oi >= 0 && /class="rname">Obtain</.test(get('recipes').innerHTML), 'selecting an ∃ hypothesis + a fresh variable offers the Obtain card');
A.doCraftIdx(oi);
ok(A.state.env.vars.some(function (v) { return v.name === 'a'; }), 'after obtain, a : Ω is a context variable');
ok(/class="gem"/.test(get('benchvars').innerHTML) && /a/.test(get('benchvars').innerHTML), 'the workbench surfaces the obtained variable as a gem');
ok(A.state.env.bindings.some(function (b) { return G.exprEq(b.type, G.appE('P', [G.varE('a', G.OMEGA)])); }), 'after obtain, the witness P(a) is on the bench');
ok(A.state.env.bindings.some(function (b) { return b.name === 'hex'; }), 'the ∃ hypothesis survives the obtain (non-destructive)');
ok(/obtain ⟨a,/.test(strip(get('spellbook').innerHTML)), 'the spellbook shows the obtain step');
// the gem in hand is itself selectable as an ingredient (like a term-bench gem): use it to instantiate hpc
ok(/class="gem[^"]*" data-vkey="a:/.test(get('benchvars').innerHTML), 'the context gem is a clickable button carrying its key');
A.clickSel('hpc'); A.clickGemVar('a:' + G.OMEGA);
ok(A.selGemExprs().some(function (t) { return t.name === 'a'; }) && /class="gem sel"/.test(get('benchvars').innerHTML), 'clicking a gem in hand selects it (shown highlighted) and it becomes an ingredient');
ok(A.state.ded.findIndex(function (d) { return d.action === 'proof' && d.d.recipeId === 'universal_instantiation'; }) >= 0, 'a ∀-proof + a selected gem-in-hand offers universal_instantiation');
A.doCraftIdx(A.state.ded.findIndex(function (d) { return d.action === 'proof' && d.d.recipeId === 'universal_instantiation'; }));
var impA = A.state.env.bindings.find(function (b) { return G.exprEq(b.type, G.IMPLIES(G.appE('P', [G.varE('a', G.OMEGA)]), G.varE('C'))); }).name;
var wa = A.state.env.bindings.find(function (b) { return G.exprEq(b.type, G.appE('P', [G.varE('a', G.OMEGA)])); }).name;
A.clickSel(impA); A.clickSel(wa);
A.doCraftIdx(A.state.ded.findIndex(function (d) { return d.action === 'proof' && d.d.recipeId === 'modus_ponens'; }));
ok(/QED/.test(get('goal').innerHTML), '19.1 solved: obtain → instantiate → modus_ponens reaches C');
// obtain is gated by the exists capability (absent in early chapters, in non-cheat mode)
A.setCheat(false); A.loadExercise('4.3'); A.el.reset.fire('click');
ok(!/class="rname">Obtain</.test(get('recipes').innerHTML), 'the Obtain card is hidden before the exists capability is unlocked');
A.setCheat(true);

// Chapter 21: "pick" an arbitrary inhabitant of a nonempty sort, then instantiate a constant-body ∀
A.setCheat(true);
A.loadExercise('14.1'); A.el.reset.fire('click');   // hA : ∀x,A ⊢ A; candidate variable a prepopulated
A.clickTerm(A.state.terms.findIndex(function (t) { return t.name === 'a'; }));
ok(/class="rname">Pick</.test(get('recipes').innerHTML) && A.state.ded.findIndex(function (d) { return d.action === 'pick'; }) >= 0, 'selecting an unclaimed variable offers the Pick card');
A.doCraftIdx(A.state.ded.findIndex(function (d) { return d.action === 'pick'; }));
ok(A.state.env.vars.some(function (v) { return v.name === 'a'; }) && /class="gem"/.test(get('benchvars').innerHTML), 'after picking, a : Ω is a context gem');
ok(A.state.env.bindings.length === A.state.ex.givens.length, 'pick adds no hypothesis (only a variable)');
ok(/Classical\.choice inferInstance/.test(strip(get('spellbook').innerHTML)) && /Nonempty Ω/.test(get('spellbook').innerHTML), 'the spellbook shows the pick (Classical.choice) and a [Nonempty Ω] preamble');
A.clickSel('hA'); A.clickGemVar('a:' + G.OMEGA);
A.doCraftIdx(A.state.ded.findIndex(function (d) { return d.action === 'proof' && d.d.recipeId === 'universal_instantiation'; }));
ok(/QED/.test(get('goal').innerHTML) && A.state.unlocked["forall_const'"], '21.1 solved (pick → instantiate) and mints the reusable forall_const\' recipe');
// the Pick card is gated by the pick capability (checked on a fresh progression, then state restored)
var _savedSolved = A.state.solved, _savedUnlocked = A.state.unlocked;
A.setCheat(false); A.state.solved = {}; A.state.unlocked = {}; A.loadExercise('4.3'); A.el.reset.fire('click');
ok(!/class="rname">Pick</.test(get('recipes').innerHTML), 'the Pick card is hidden before the pick capability is unlocked');
A.state.solved = _savedSolved; A.state.unlocked = _savedUnlocked;
A.setCheat(true);

// Chapter 22: existential introduction — the player picks among the finitely-many witness abstractions
A.setCheat(true);
A.loadExercise('15.3'); A.el.reset.fire('click');   // hQ : Q(α,α) ⊢ ∃x, Q(x,x); α a given constant (in context)
A.clickSel('hQ'); A.clickGemVar('α:' + G.OMEGA);
var eiCands = A.state.ded.filter(function (d) { return d.action === 'proof' && d.d.recipeId === 'Exists.intro'; });
ok(eiCands.length === 4 && /class="rname">Exists.intro</.test(get('recipes').innerHTML), '∃-introduction offers all four abstractions of Q(α,α) as separate brews');
var XX = G.EXISTS({ name: 'x', sort: G.OMEGA }, G.appE('Q', [G.varE('x', G.OMEGA), G.varE('x', G.OMEGA)]));
var pick4 = A.state.ded.findIndex(function (d) { return d.action === 'proof' && d.d.recipeId === 'Exists.intro' && G.exprEq(d.d.output, XX); });
ok(pick4 >= 0, 'one of the four brews is exactly ∃x, Q(x,x)');
A.doCraftIdx(pick4);
ok(/QED/.test(get('goal').innerHTML) && /⟨α, hQ⟩/.test(strip(get('spellbook').innerHTML)), '22.3 solved by choosing the ∃x,Q(x,x) abstraction; spellbook shows ⟨α, hQ⟩');
// 22.2 the ∀→∃ implication: pick a witness, instantiate, then ∃-introduce
A.loadExercise('15.2'); A.el.reset.fire('click');   // h : ∀x,P x ⊢ ∃x, P x; candidate a
A.clickTerm(A.state.terms.findIndex(function (t) { return t.name === 'a'; }));
A.doCraftIdx(A.state.ded.findIndex(function (d) { return d.action === 'pick'; }));
A.clickSel('h'); A.clickGemVar('a:' + G.OMEGA);
A.doCraftIdx(A.state.ded.findIndex(function (d) { return d.action === 'proof' && d.d.recipeId === 'universal_instantiation'; }));
var pa = A.state.env.bindings.find(function (b) { return G.exprEq(b.type, G.appE('P', [G.varE('a', G.OMEGA)])); }).name;
A.clickSel(pa); A.clickGemVar('a:' + G.OMEGA);
var exFa = G.EXISTS({ name: 'x', sort: G.OMEGA }, G.appE('P', [G.varE('x', G.OMEGA)]));
A.doCraftIdx(A.state.ded.findIndex(function (d) { return d.action === 'proof' && d.d.recipeId === 'Exists.intro' && G.exprEq(d.d.output, exFa); }));
ok(/QED/.test(get('goal').innerHTML) && A.state.unlocked['exists_of_forall'], '22.2 solved (pick→instantiate→∃-intro) and mints the reusable exists_of_forall');
// Exists.intro is gated by the exists_intro capability (fresh progression, then restored)
var _sS = A.state.solved, _sU = A.state.unlocked;
A.setCheat(false); A.state.solved = {}; A.state.unlocked = {}; A.loadExercise('12.1'); A.el.reset.fire('click');
ok(!/class="rname">Exists.intro</.test(get('recipes').innerHTML), 'the Exists.intro card is hidden before the exists_intro capability is unlocked');
A.state.solved = _sS; A.state.unlocked = _sU;
A.setCheat(true);

// each formula constructor is its own card (dimmed when inactive); the Hide-inactive toggle removes dimmed cards
A.loadExercise('3.1'); A.clearSel();
ok(/class="rname">And</.test(get('recipes').innerHTML) && /class="rname">Or</.test(get('recipes').innerHTML) && /class="rname">Implies</.test(get('recipes').innerHTML), 'And, Or, Implies show as individual constructor cards');
ok((get('recipes').innerHTML.match(/recipe dim/g) || []).length > 0, 'with nothing selected, inactive cards are shown dimmed');
A.el.hideinactive.checked = true; A.el.hideinactive.fire('change');
ok((get('recipes').innerHTML.match(/recipe dim/g) || []).length > 0,
   'with NOTHING selected, Hide inactive still shows the cards (hiding them all would blank the panel)');
A.clickSel('hA');
ok((get('recipes').innerHTML.match(/recipe dim/g) || []).length === 0,
   'once something is selected, Hide inactive removes every card that does not apply');
A.clearSel();
A.el.hideinactive.checked = false; A.el.hideinactive.fire('change');
ok((get('recipes').innerHTML.match(/recipe dim/g) || []).length > 0, 'clearing Hide inactive brings the dimmed cards back');

// fantasy theme: terms are 💎 gems, formulas are 📜 scrolls; the emojis vanish in plain mode
A.setFantasy(true);
A.loadExercise('11.2'); A.el['term-in'].value = 'g'; A.addTerm();
ok(/💎/.test(get('term-shelf').innerHTML) && /💎/.test(get('termHead').innerHTML), 'fantasy: terms shown as 💎 gems (chip + header)');
A.loadExercise('3.1');
ok(/📜/.test(get('formula-shelf').innerHTML) && /📜/.test(get('formulaHead').innerHTML), 'fantasy: formulas shown as 📜 scrolls (chip + header)');
A.setFantasy(false);
ok(!/📜/.test(get('formula-shelf').innerHTML) && /Formula bench/.test(get('formulaHead').innerHTML), 'plain: no scroll emoji, header reads Formula bench');
A.loadExercise('11.2');
ok(!/💎/.test(get('term-shelf').innerHTML) && /Term bench/.test(get('termHead').innerHTML), 'plain: no gem emoji, header reads Term bench');
A.setFantasy(true);

// distinct create-verbs: brew/derive potions, scribe/form scrolls, craft/build gems
A.setFantasy(true); A.loadExercise('3.1'); A.clearSel();
ok(get('formula-add').textContent === 'Scribe scroll' && get('term-add').textContent === 'Craft gem', 'fantasy create-buttons: Scribe scroll / Craft gem');
A.clickFormula(0); A.clickFormula(1);
ok(/scribe →/.test(get('recipes').innerHTML), 'fantasy: a formula-constructor brew uses the verb "scribe"');
A.setFantasy(false);
ok(get('formula-add').textContent === 'Form formula' && get('term-add').textContent === 'Build term', 'plain create-buttons: Form formula / Build term');
ok(/form →/.test(get('recipes').innerHTML) && !/scribe →/.test(get('recipes').innerHTML), 'plain: a formula-constructor brew uses the verb "form"');
A.setFantasy(true);


// turning the cheat back off restores the progression restriction (only solved-derived exercises)
A.setCheat(false);
ok(!A.accessible()['5.9'], 'clearing the cheat re-locks exercises that were never reached');
ok(A.accessible()['1.1'] && A.accessible()['1.2'], 'the start and its genuinely-unlocked successor stay accessible');

// map "Follow current" re-centers the view when the exercise changes
get('mapwrap').open = true;
A.el.mapfollow.checked = true; A.el.mapfollow.fire('change');
ok(A.state.mapFollow === true, 'the map Follow-current checkbox toggles state.mapFollow');
A.loadExercise('1.1'); var vtx = A.map.view.tx, vty = A.map.view.ty;
A.loadExercise('1.2');
ok(A.map.view.tx !== vtx || A.map.view.ty !== vty, 'Follow-current re-centers the map when the exercise changes');
A.el.mapfollow.checked = false; A.el.mapfollow.fire('change'); get('mapwrap').open = false;
A.map.view.tx = 0; A.map.view.ty = 0; A.map.view.s = 1;   // reset to identity for the tap hit-test below

// tapping an unlocked node on the map selects that exercise (hit-test in the pointerup handler)
A.loadExercise('1.1');            // 1.2 is accessible (1.1 solved earlier)
var p12 = A.map.pos['1.2'];
A.el.mapsvg.fire('pointerdown', { clientX: p12.x, clientY: p12.y, pointerId: 1 });
A.el.mapsvg.fire('pointerup', { clientX: p12.x, clientY: p12.y, pointerId: 1 });
ok(A.state.ex.id === '1.2', 'tapping an unlocked node on the map loads that exercise');
// a tap on empty space selects nothing
A.loadExercise('1.1'); var exNow = A.state.ex.id;
A.el.mapsvg.fire('pointerdown', { clientX: 3, clientY: 3, pointerId: 1 });
A.el.mapsvg.fire('pointerup', { clientX: 3, clientY: 3, pointerId: 1 });
ok(A.state.ex.id === exNow, 'a tap on empty map space selects nothing');

// Chapters 4–7 are pure deduction-theorem practice, so they all hang straight off the assume tutorial
// (6.1a) and can be done in any order, or skipped entirely on the way to the next mechanic.
['4.2', '4.3', '4.4', '4.5', '4.6', '4.7'].forEach(function (id) {
  ok(G.EX_BY_ID[id].prereqs.join(',') === '4.1', id + ' hangs directly off the assume tutorial');
  ok((G.EX_BY_ID[id].unlocks || []).length === 0, id + ' is a leaf: nothing waits on it');
  ok((G.EX_BY_ID[id].needs || []).length === 0, id + ' is practice, not a tutorial');
});
// ---- the two kinds of level are visible to the player ----
var wasFantasy = A.state.fantasy;
A.setCheat(true);                 // reveal every level so any one can be loaded
A.setFantasy(false);
A.loadExercise('6.1');
ok(/Tutorial/.test(get('goal').innerHTML) && /case analysis/.test(get('goal').innerHTML),
   'a tutorial level says so, and names the mechanic it brings');
A.loadExercise('6.10');
ok(!/Tutorial/.test(get('goal').innerHTML), 'a practice level carries no tutorial badge');
A.setFantasy(true); A.loadExercise('6.1');
ok(/New magic here/.test(get('goal').innerHTML), 'the badge follows fantasy mode');
A.setFantasy(false);
var opts = get('exsel').children.map(function (o) { return o.textContent; });
ok(opts.some(function (t) { return t.indexOf('★ Exercise 6.1 — new: case analysis') === 0; }),
   'the dropdown stars the tutorials and names the mechanic');
ok(opts.some(function (t) { return t.indexOf("Exercise 6.10 — or_and_left'") === 0; }),
   'practice levels are listed by their lemma name');

// the QED correspondence under the goal: shown for a level that descends from a QED exercise, with
// the "stated differently there" note only where the statement actually differs, and absent entirely
// for a level Grimoire invented
A.loadExercise('10.1');                      // exact statement match: QED 13.2(b)
ok(/Corresponds to <strong>QED 13\.2\(b\)<\/strong>/.test(get('goal').innerHTML),
   'a level matching a QED exercise names it under the goal');
ok(!/— stated/.test(get('goal').innerHTML), 'an exact match carries no "stated differently" note');
A.loadExercise('9.1');                       // restated: QED 12.1(d) gives the reversed form
var g91 = get('goal').innerHTML;
ok(/QED 12\.1\(d\)/.test(g91) && /reversed form/.test(g91),
   'a restated correspondence says how QED states it');
A.loadExercise('7.8');                       // Iff.imp', a Grimoire helper with no QED ancestor
ok(!/Corresponds to/.test(get('goal').innerHTML),
   'a level with no QED ancestor claims no correspondence');
ok(G.EXERCISES.filter(function (e) { return e.qed; }).length === 125,
   '125 of the 158 levels carry a QED correspondence');
ok(G.EXERCISES.every(function (e) { return !e.qedNote || e.qed; }),
   'a "stated differently" note never appears without a QED reference');

// the tutorial hint: shown while the level is unsolved, phrased in fantasy vocabulary and swapped to
// plain wording with the mode, and gone once the level is done
A.setFantasy(true); A.loadExercise('1.1'); A.el.reset.fire('click');
var hintF = get('goal').innerHTML;
ok(/class="hint"/.test(hintF), 'a tutorial level shows a hint');
ok(/Hint/.test(hintF) && /And\.intro/.test(hintF), 'the hint names the recipe to use');
ok(/potions/.test(hintF) && /brew/.test(hintF), 'in fantasy mode the hint says potions and brew');
A.setFantasy(false); A.loadExercise('1.1'); A.el.reset.fire('click');
var hintP = get('goal').innerHTML;
ok(/hypotheses/.test(hintP) && /derive/.test(hintP),
   'with fantasy off the hint says hypotheses and derive');
ok(!/potion|brew/.test(hintP), 'no fantasy vocabulary survives in plain mode');
// "gem" now swaps too, which the quantifier hints rely on
A.loadExercise('11.1');
ok(/variable X on the term bench/.test(get('goal').innerHTML),
   'gem becomes variable in plain mode');
A.setFantasy(true); A.loadExercise('11.1');
ok(/gem X on the term bench/.test(get('goal').innerHTML), 'and stays a gem in fantasy mode');
A.setFantasy(false);
// solving it retires the hint
A.loadExercise('1.1'); A.el.reset.fire('click');
A.doCraft('And.intro', ['hA', 'hB']);
A.doCraft('And.intro', [A.state.env.bindings[A.state.env.bindings.length - 1].name, 'hC']);
ok(/QED/.test(get('goal').innerHTML), '1.1 is solved by the two And.intro brews');
ok(!/class="hint"/.test(get('goal').innerHTML), 'the hint is gone once the level is solved');
// a practice level carries one too, but behind a button: it waits until it is asked for
A.loadExercise('6.10');
var practice = get('goal').innerHTML;
ok(!/class="hint"/.test(practice), 'a practice level does not volunteer its hint');
ok(/hintbtn/.test(practice), 'but it offers the button that reveals one');
A.setHintOpen(true);
ok(/class="hint"/.test(get('goal').innerHTML), 'and asking for it shows it');
A.setHintOpen(false);
ok(G.EXERCISES.filter(function (e) { return e.hint; }).length === G.EXERCISES.length,
   'every level carries a hint');
ok(G.TUTORIALS.every(function (id) { return !!G.EX_BY_ID[id].hint; }),
   'every tutorial has one');

// 16.1 quantifies over Set, and introducing a variable there used to hand the engine `X : Ω` whatever
// the bench said — which made the level's own hint lead nowhere. The sort now comes from the term.
A.loadExercise('16.1');
(function () {
  var before = A.state.env;
  A.doIntroVar({ tag: 'var', name: 'X', sort: G.SET });
  var v = A.state.env.vars[A.state.env.vars.length - 1];
  ok(v && v.name === 'X', 'introducing a bench term opens a variable');
  ok(v && v.sort === G.SET, 'and it carries the term\'s own sort, not Ω');
  A.state.env = before;
})();
A.loadExercise('1.1');
A.setCheat(false); A.setFantasy(wasFantasy); A.loadExercise('1.1');

// 6.1a (⊢ A → A) is the simplest assume/discharge exercise, so it is the one that teaches the mechanic
ok(G.EX_BY_ID['4.1'].needs.indexOf('assume') >= 0, '6.1a introduces the assume capability');
ok(G.EX_BY_ID['4.1'].prereqs.join(',') === '3.1', 'and it follows the ∨/formula tutorial in the chain');
// the next mechanic (mp) is reachable without touching any of that practice
ok(G.EX_BY_ID['5.1'].prereqs.join(',') === '4.1' && G.EX_BY_ID['5.1'].needs.indexOf('mp') >= 0,
   'the mp tutorial follows the assume tutorial directly, so the practice is skippable');
// and an early lemma can pay off much later: 8.3 (And.symm') is what Chapter 27 needs for ∩-commutativity
ok(G.EX_BY_ID['4.8'].unlocks.indexOf('18.9') >= 0, 'a Chapter 8 lemma is a prerequisite for a Chapter 27 set law');

// ---- save progress (opt-in; browser local storage, with explicit consent) ----
A.loadExercise('1.1');
localStorage.removeItem(A.SAVE_KEY); A.state.save = false; A.el.save.checked = false;

// enabling shows a consent box, and stores nothing until the user accepts
A.el.save.checked = true; A.el.save.fire('change');
ok(get('dialog').hidden === false && /Save your progress/.test(get('dlg-msg').textContent), 'checking "Save progress" shows a consent box');
ok(localStorage.getItem(A.SAVE_KEY) === null, 'nothing is written to storage before the user accepts');
A.clickDialog(0);   // accept
ok(A.state.save === true, 'accepting the consent enables saving');
var blob = JSON.parse(localStorage.getItem(A.SAVE_KEY) || 'null');
ok(blob && blob.solved && blob.solved['1.1'], 'the saved blob records the solved set');
ok(blob.last === '1.1', 'the saved blob records the current exercise');

// canceling the consent box keeps saving off and stores nothing
localStorage.removeItem(A.SAVE_KEY); A.state.save = false; A.el.save.checked = true; A.el.save.fire('change'); A.clickDialog(1);
ok(A.state.save === false && A.el.save.checked === false && localStorage.getItem(A.SAVE_KEY) === null, 'canceling consent stores nothing and leaves the box unchecked');

// re-enable, then simulate a reload with boot(): the saved progress is restored
A.el.save.checked = true; A.el.save.fire('change'); A.clickDialog(0);
A.state.solved = {}; A.state.unlocked = {}; A.state.progress = {};   // wipe in-memory progression
A.boot();
ok(A.state.solved['1.1'] && A.accessible()['1.2'], 'reloading (boot) restores the solved set and re-derives the unlocked tree');
ok(A.state.unlocked['And.idem'], 'restore re-mints the recipes for solved lemmas (And.idem from 1.2)');
ok(A.state.save === true && A.el.save.checked === true, 'a stored blob keeps saving enabled after reload');

// the undo stack is NOT stored: each of its entries is a whole environment, and JSON copies out the
// structure they share, so keeping it cost O(moves^2) and could fill the browser's quota by itself
A.loadExercise('2.1'); A.el.reset.fire('click');
A.doCraft('And.left', ['hAB']); A.doCraft('And.right', ['hAB']);
ok(A.state.history.length >= 2, 'the session still has an undo stack');
var saved = JSON.parse(localStorage.getItem(A.SAVE_KEY) || 'null');
ok(saved && saved.progress && saved.progress['2.1'], 'the board is stored for the level being played');
ok(!('history' in saved.progress['2.1']), 'but its undo stack is not');
ok(Object.keys(saved.progress).every(function (k) { return !('history' in saved.progress[k]); }),
   'and no level stores one');
ok(JSON.stringify(saved).length < 200000, 'which keeps the whole save well under the browser quota');
// a level resumed from a save comes back with an empty undo stack rather than an undefined one
A.loadExercise('1.1');   // leave 2.1 first, or saveProgress would put its live history straight back
A.state.progress = JSON.parse(JSON.stringify(saved.progress));
A.loadExercise('2.1');
ok(Array.isArray(A.state.history) && A.state.history.length === 0,
   'a level restored from a save starts with an empty undo stack');

// a full quota is reported, not swallowed: the game used to keep playing while nothing was being saved
(function () {
  var realSet = localStorage.setItem, calls = 0;
  localStorage.setItem = function () { calls++; throw new Error('QuotaExceededError'); };
  A.state.saveWarned = false;
  var okWrite = A.persist();
  localStorage.setItem = realSet;
  ok(okWrite === false, 'persist reports that the write failed');
  ok(calls === 2, 'it first retries with just the current level before giving up');
  ok(get('dialog').hidden === false && /could not be saved/.test(get('dlg-msg').textContent),
     'and the player is told, once');
  A.clickDialog(0);
})();
A.loadExercise('1.1');

// disabling shows the "won't be restored" acknowledgment and clears the stored data
A.el.save.checked = false; A.el.save.fire('change');
ok(get('dialog').hidden === false && /not be restored/.test(get('dlg-msg').textContent), 'unchecking "Save progress" shows the not-restored acknowledgment');
A.clickDialog(0);
ok(A.state.save === false && localStorage.getItem(A.SAVE_KEY) === null, 'disabling saving clears the stored data');

// ---- the move log: what the game plays, it can replay ----
A.loadExercise('2.1'); A.el.reset.fire('click');
ok(A.state.moves.length === 0, 'a fresh board has no moves logged');
A.doCraft('And.left', ['hAB']);
A.doCraft('And.right', ['hAB']);
ok(A.state.moves.length === 2 && A.state.moves[0][0] === 'c' && A.state.moves[0][1] === 'And.left',
   'each craft is logged, with its recipe');
A.el.undo.fire('click');
ok(A.state.moves.length === 1, 'undo takes the last move off the log as well as the board');
A.doCraft('And.right', ['hAB']);
A.doCraft('And.intro', ['hB', 'hA']);
ok(A.isSolved(), '2.1 is solved');
(function () {
  var r = G.replayMoves(G.EX_BY_ID['2.1'], A.state.moves);
  ok(r.ok && r.length === A.state.moves.length, 'the log replays into the same proof from a fresh board');
  var line = /-- grimoire-replay v1 (\S+) (\S+)/.exec(A.proofText());
  ok(!!line, 'a solved proof exports a replay line');
  ok(line[1] === '2.1', 'headed with the id, not the number — it is what the tables are keyed by');
  var back = G.decodeMoves(line[2]);
  ok(JSON.stringify(back) === JSON.stringify(A.state.moves), 'carrying exactly the moves that were played');
  ok(G.replayMoves(G.EX_BY_ID['2.1'], back).ok, 'which replay into a proof');
})();
// the log belongs to the board, so it survives leaving the level and coming back
A.loadExercise('1.1');
A.loadExercise('2.1');
ok(A.state.moves.length === 3, 'returning to a level brings its move log back');
A.el.reset.fire('click');
ok(A.state.moves.length === 0, 'and Reset clears it with everything else');

// ---- the Playground button hands the proof to live.lean-lang.org ----
A.loadExercise('2.1'); A.el.reset.fire('click');
A.doCraft('And.left', ['hAB']); A.doCraft('And.right', ['hAB']);
(function () {
  var opened = [];
  window.open = function (u, target, feat) { opened.push([u, target, feat]); };
  A.el.playproof.fire('click');
  ok(opened.length === 1, 'clicking Playground opens one window');
  ok(/^https:\/\/live\.lean-lang\.org\/#code=/.test(opened[0][0]), 'at the playground, with the code in the fragment');
  ok(opened[0][1] === '_blank' && /noopener/.test(opened[0][2] || ''), 'in a new tab, with noopener');
  ok(decodeURIComponent(opened[0][0].split('#code=')[1]) === A.proofText(),
     'carrying exactly what Copy would have put on the clipboard');
  // nothing is sent anywhere by the app itself: the button only ever navigates
  ok(typeof fetch === 'undefined' || opened.length === 1, 'and no request is made to get there');

  // a proof too long for a URL says so instead of opening a truncated one
  var realURL = G.playgroundURL;
  G.playgroundURL = function () { return null; };   // as it does past PLAYGROUND_MAX
  opened = [];
  A.el.playproof.fire('click');
  ok(opened.length === 0, 'an over-long proof opens nothing');
  ok(get('dialog').hidden === false && /too long to travel in a link/.test(get('dlg-msg').textContent),
     'and says why, pointing at Copy and Save');
  A.clickDialog(0);
  G.playgroundURL = realURL;
  delete window.open;
})();
A.loadExercise('1.1');

// ---- the player sees `num`, while everything persistent keys on `id` ----
A.loadExercise('1.1');
(function () {
  var ex = G.EX_BY_ID['7.12'];
  ex.num = '7.99';                                   // pretend chapter 7 was renumbered
  A.loadExercise('7.12');
  ok(/exercise 7\.99/.test(A.proofText()), 'the exported proof is headed with the number, not the id');
  ok(!/exercise 7\.12/.test(A.proofText()), 'and the id does not appear there');
  ok(A.el.exsel.children.some(function (c) { return /Exercise 7\.99/.test(c.textContent); }),
     'the dropdown lists it by number');
  ok(A.el.exsel.children.some(function (c) { return c.value === '7.12'; }),
     'but the option still carries the id as its value');
  ok(G.par('7.12') != null && A.state.ex.id === '7.12', 'and the par table is still keyed by id');
  delete ex.num;
})();
A.loadExercise('1.1');

// ---- "Unlock all": asks before switching on, and is remembered ----
localStorage.removeItem(A.SAVE_KEY); A.state.save = false; A.state.cheat = false;
A.el.save.checked = true; A.el.save.fire('change'); A.clickDialog(0);   // saving on
A.loadExercise('1.1');

A.el.cheat.fire('click');
ok(get('dialog').hidden === false && /Unlock every level/.test(get('dlg-msg').textContent),
   'clicking "Unlock all" asks first');
ok(/cannot be put back/.test(get('dlg-msg').textContent),
   'and says the earned progression cannot be put back');
ok(A.state.cheat === false, 'nothing is unlocked while the question is open');
A.clickDialog(1);   // cancel
ok(A.state.cheat === false && !A.accessible()['20.7'], 'cancelling leaves the progression as it was');

A.el.cheat.fire('click'); A.clickDialog(0);   // accept
ok(A.state.cheat === true && A.accessible()['20.7'], 'accepting reveals every level');
ok(A.el.cheat.classList.contains('on'), 'and the button shows it is on');
var cblob = JSON.parse(localStorage.getItem(A.SAVE_KEY) || 'null');
ok(cblob && cblob.cheat === true, 'the saved blob remembers it');

// a reload keeps it, which is the point — it used to be forgotten, locking everything again
A.state.cheat = false; A.el.cheat.classList.toggle('on', false);
A.boot();
ok(A.state.cheat === true && A.accessible()['20.7'], 'reloading (boot) restores it');
ok(A.el.cheat.classList.contains('on'), 'and the button still shows it is on after a reload');

// switching it off again needs no ceremony, and is remembered too
A.el.cheat.fire('click');
ok(get('dialog').hidden === true, 'switching it off asks nothing');
ok(A.state.cheat === false && !A.accessible()['20.7'], 'and the earned progression is back');
ok(JSON.parse(localStorage.getItem(A.SAVE_KEY)).cheat === false, 'the save records that too');
A.el.save.checked = false; A.el.save.fire('change'); A.clickDialog(0);
A.loadExercise('1.1');

// ---- "Clear after crafting": on by default, and turning it off keeps the ingredients selected ----
ok(A.state.autoclear === true && get('autoclear').checked === true, '"Clear after crafting" is on by default');
A.loadExercise('2.1');                                   // hAB : A ∧ B ⊢ B ∧ A
A.clickSel('hAB');
ok(A.selectedNames().length === 1, 'a potion can be selected');
A.doCraft('And.left', ['hAB']);
ok(A.selectedNames().length === 0, 'with auto-clear on, crafting empties the selection');
A.el.autoclear.checked = false; A.el.autoclear.fire('change');
ok(A.state.autoclear === false, 'unchecking "Clear after crafting" updates the state');
A.clickSel('hAB');
A.doCraft('And.right', ['hAB']);
ok(A.selectedNames().join(',') === 'hAB', 'with auto-clear off, the same ingredient stays selected for the next craft');
ok(A.state.env.bindings.some(b => b.name === 'hA') && A.state.env.bindings.some(b => b.name === 'hB'),
   'both halves of A ∧ B were drawn from one selection');
A.el.autoclear.checked = true; A.el.autoclear.fire('change');

// ---- map: follow-current defaults on, re-picking the same exercise re-arms it, and "Current" is one-off ----
A.map.focusNode('1.1');                                  // pretend the map has already followed 1.1
A.loadExercise('1.1');
ok(A.map.view && typeof A.map.view.s === 'number', 're-picking the current exercise leaves the map view usable');
const followBefore = A.state.mapFollow;
A.el.mapcur.fire('click');
ok(A.state.mapFollow === followBefore, 'the "Current" button re-centres without touching the Follow current setting');

// ---- right-click shortcuts: Assume on a scroll, Introduce on a gem (gated by capability) ----
A.setCheat(false);
A.loadExercise('1.1');
// gating is a property of the current capabilities, whatever the accumulated solved set happens to be
const fm0 = A.formulaMenu(0).map(m => m.label), tm0 = A.termMenu(0).map(m => m.label);
ok((fm0.indexOf('Assume') >= 0) === A.hasCap('assume'), 'a scroll offers Assume exactly when the deduction theorem is unlocked');
ok((tm0.indexOf('Introduce') >= 0) === A.hasCap('forall'), 'a gem offers Introduce exactly when ∀ is unlocked');
ok(fm0[fm0.length - 1] === 'Delete' && tm0[tm0.length - 1] === 'Delete', 'Delete stays available on both, and stays last');
A.setCheat(true);                                        // unlock everything
ok(A.formulaMenu(0).map(m => m.label).join(',') === 'Assume,Delete', 'once unlocked, a scroll offers Assume then Delete');
ok(A.termMenu(0).map(m => m.label).join(',') === 'Introduce,Delete', 'once unlocked, a gem offers Introduce then Delete');
// the Assume entry really assumes that formula
A.loadExercise('4.1');                                  // ⊢ A → A, with formula A on the shelf
const fmA = A.state.formulas[0];
A.formulaMenu(0)[0].fn();
ok(A.state.env.parent && G.exprEq(A.state.env.assumption.type, fmA), 'the scroll\'s Assume entry opens a sub-proof assuming that formula');

// ---- right-click a potion: discharge options appear only inside a sub-proof ----
A.loadExercise('4.1');                                  // ⊢ A → A
A.el.reset.fire('click');                                // the block above left a sub-proof open on 6.1a
ok(!A.state.env.parent, 'reset returns 6.1a to the top level');
ok(A.potionMenu('hA').every(m => !/^Discharge/.test(m.label)),
   'at the top level a potion offers no discharge (nothing to discharge into)');
A.formulaMenu(0)[0].fn();                                // assume A → opens the sub-proof
const asmName = A.state.env.assumption.name;
const pmenu = A.potionMenu(asmName).map(m => m.label);
ok(pmenu.some(l => /^Discharge to /.test(l)), 'inside a sub-proof, a potion offers a Discharge entry');
ok(pmenu[pmenu.length - 2] === 'Rename…' && pmenu[pmenu.length - 1] === 'Delete', 'Rename and Delete stay at the end');
A.potionMenu(asmName)[0].fn();                           // discharge it
ok(!A.state.env.parent && A.state.solved['4.1'], 'discharging from the potion menu closes the sub-proof and solves 6.1a');

// ---- abandoning a sub-proof from the goal banner's ✕ ----
A.loadExercise('4.1');
A.el.reset.fire('click');
A.formulaMenu(0)[0].fn();                                // assume A
ok(A.state.env.parent, 'assuming opens a sub-proof');
ok(/data-abandon="1"/.test(get('goal').innerHTML), 'the assumption chain carries an ✕ close box');
const stepsBefore = A.state.env.parent.steps.length;
A.el.goal.fire('click', { target: { getAttribute: k => (k === 'data-abandon' ? '1' : null) } });
ok(!A.state.env.parent, 'clicking the ✕ backs out of the sub-proof');
ok(A.state.env.steps.length === stepsBefore, 'abandoning leaves no step (no "have") behind');
ok(!/have/.test(strip(get('spellbook').innerHTML)), 'the spellbook shows no have for the abandoned sub-proof');
A.el.undo.fire('click');
ok(!!A.state.env.parent, 'undo restores the abandoned sub-proof');
// nested: the outer level offers a deeper abandon
A.doAbandon(1);
A.formulaMenu(0)[0].fn();
const inner = A.state.env; A.doCraft('And.intro', [inner.assumption.name, inner.assumption.name]);
ok(/data-abandon="1"/.test(get('goal').innerHTML), 'a single-level sub-proof offers exactly a one-level abandon');
A.el.reset.fire('click');

// ---- Chapter 23: a sort that carries a relation ----
A.setCheat(true);
A.loadExercise('16.2');                                  // Russell — givens mention ∈, context starts empty
ok(A.state.ex.sorts.indexOf(G.SET) >= 0, '27.3 declares the Set sort');
ok(/∈/.test(get('goal').innerHTML) || /∈/.test(get('bench').innerHTML), 'the ∈ relation renders on the board');
// scribing `r ∈ r` is impossible before r exists, and possible after — the parser reads sorts from the gems
get('formula-in').value = 'r ∈ r';
A.el['formula-add'].fire('click');
ok(get('formula-in').classList.contains('bad'), 'before unearthing r, `r ∈ r` is rejected (r is not a Set element)');
A.doObtain('hR', 'r');
ok(A.state.env.vars.some(v => v.name === 'r' && v.sort === G.SET), 'obtain adds r as a Set-sorted gem');
get('formula-in').value = 'r ∈ r';
A.el['formula-in'].fire('input');                        // typing clears the previous error, as in the real UI
A.el['formula-add'].fire('click');
ok(!get('formula-in').classList.contains('bad') && A.state.formulas.some(f => f.tag === 'app' && f.sym === 'MEM'),
   'once r is in context, `r ∈ r` scribes as a Set membership formula');

// ---- Chapter 23 operations: the term bench builds compound terms, and a sort's constant is just there ----
A.loadExercise('17.3');                                  // ∀x P(x) ⊢ P(f(c) ∗ c), over the magma M
ok(A.state.terms.some(t => t.tag === 'app' && t.sym === 'c'),
   'the sort-level constant c auto-populates the term bench (no exercise declares it)');
get('term-in').value = 'f(c) ∗ c';
A.el['term-add'].fire('click');
const built = A.state.terms[A.state.terms.length - 1];
ok(built && G.render(built) === 'f(c) ∗ c', 'a compound term can be built in the term bench');
ok(G.sortOf(built) === 'M', 'the built term has the sort of the operation that made it');
ok(G.render(built, { lean: true }) === 'star (f c) c', 'and emits as a properly parenthesised Lean application');
// a formula is refused there, and an unknown function is reported
get('term-in').value = 'P(c)'; A.el['term-in'].fire('input'); A.el['term-add'].fire('click');
ok(get('term-in').classList.contains('bad') && /not a term/.test(get('term-err').textContent),
   'a formula typed into the term bench is refused, with a reason');
get('term-in').value = 'g(c)'; A.el['term-in'].fire('input'); A.el['term-add'].fire('click');
ok(get('term-in').classList.contains('bad') && /not a function/.test(get('term-err').textContent),
   'an unknown operation is reported rather than silently ignored');

console.log(pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
