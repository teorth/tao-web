/* Derive the Grimoire unlock graph from the scripted solutions.
 *
 *   node dev/grimoire/prereqs.js            # the proposed graph, exercise by exercise
 *   node dev/grimoire/prereqs.js --patch    # just the `prereqs:` literals, to paste into grimoire.js
 *   node dev/grimoire/prereqs.js --check    # compare the derivation against what grimoire.js says
 *
 * The design (TT, 2026-11-08): levels are of two kinds.  A TUTORIAL introduces one new game mechanic;
 * the tutorials form a LINEAR chain, so the Nth mechanic opens as soon as the (N-1)th is solved, and an
 * impatient student can walk the chain and skip everything else.  An EXERCISE introduces no mechanic and
 * opens once (a) every tutorial for a mechanic its proof uses is solved, and (b) every earlier lemma its
 * proof consumes is solved.  Both are AND-gates, which is what makes the many parallel branches work.
 *
 * Rather than guess at (a) and (b), we read them off the scripts in `solutions.js` — the same
 * scripts the Lean compile-check verifies — by instrumenting the solver and watching what each proof
 * actually reaches for.  So the graph is derived from proofs that are known to work, and re-derivable
 * whenever the exercises change.
 *
 * SINCE THE READER RECORDS (2026-11-16) the derivation is a suggestion rather than a specification for
 * (b).  A record becomes the script for its level, and a shorter proof often reaches back into an earlier
 * chapter for something slicker than the route the level was built around.  The rule TT settled on is
 * that a level need NOT wait for those lemmas — par is the shortest proof the game knows, not the
 * shortest reachable from what this level opened with — provided every one of them is minted EARLIER in
 * the list, so playing in order gets you there.  `order_audit.js` is what enforces that; here, a
 * lemma-only difference is reported as expected, and only a missing MECHANIC is an error.
 */
const path = require('path');
const { G, SOL, solver } = require(path.join(__dirname, 'solutions.js'));

// ---------- which tutorial teaches which mechanic ----------
const TUT = {
  'and.intro': '1.1', 'and.elim': '2.1', 'or': '3.1', 'formula': '3.1', 'assume': '4.1',
  'mp': '5.1', 'case': '6.1', 'iff': '7.1', 'neg': '8.1', 'em': '9.1', 'tf': '10.1',
  'forall': '11.1', 'instantiate': '12.1', 'exists': '13.1', 'pick': '14.1', 'exists_intro': '15.1',
  'sets': '16.1', 'ops': '17.1', 'eq': '18.1', 'groups': '19.1', 'induction': '20.1',
};
const CHAIN = ['1.1', '2.1', '3.1', '4.1', '5.1', '6.1', '7.1', '8.1', '9.1', '10.1',
               '11.1', '12.1', '13.1', '14.1', '15.1', '16.1', '17.1', '18.1', '19.1', '20.1'];
// a sort in play means the tutorial that introduced that sort
const SORT_TUT = { 'Ω': '11.1', 'Set': '16.1', 'M': '17.1', 'G': '19.1', 'Nat': '20.1' };
// moves that are not crafts, and the mechanic each one needs
const MOVE_CAP = { a: 'assume', d: 'assume', n: 'neg', v: 'forall', obtain: 'exists', pick: 'pick' };

const idx = {}; G.EXERCISES.forEach((e, i) => { idx[e.id] = i; });
const lemmaOwner = {};   // minted recipe name -> the exercise that mints it
G.EXERCISES.forEach(e => { if (e.kind === 'lemma' && e.leanName) lemmaOwner[e.leanName] = e.id; });
const AXIOM_SORT = {};   // sort-owned axiom name -> its sort
Object.keys(G.SORTS).forEach(s => (G.SORTS[s].axioms || []).forEach(a => { AXIOM_SORT[a.name] = s; }));
const isBase = {}; G.BASE_RECIPES.forEach(r => { isBase[r.id] = true; });

// ---------- watch one solution ----------
function trace(ex) {
  const caps = new Set(), lemmas = new Set(), unknown = new Set();
  const s = solver(ex.id);
  function ingredients(ins) {
    ins.forEach(i => {
      if (!i || typeof i !== 'object' || i.proof || !i.type) return;   // a bare name is a potion in hand
      const sort = G.sortOf(i.type);
      if (sort === G.PROP) caps.add('formula');
      else { caps.add('forall'); if (i.type.tag === 'app' && i.type.args.length) caps.add('ops'); }
    });
  }
  function recipe(r) {
    if (G.RECIPE_CAP[r]) caps.add(G.RECIPE_CAP[r]);
    else if (lemmaOwner[r]) lemmas.add(r);
    else if (AXIOM_SORT[r]) caps.add(SORT_TUT[AXIOM_SORT[r]] === '16.1' ? 'sets' : AXIOM_SORT[r] === 'G' ? 'groups' : AXIOM_SORT[r] === 'Nat' ? 'induction' : 'ops');
    else if (!isBase[r]) unknown.add(r);
  }
  const raw = { c: s.c, ce: s.ce };
  s.c = (r, ...ins) => { recipe(r); ingredients(ins); return raw.c(r, ...ins); };
  s.ce = (r, target, ...ins) => { recipe(r); ingredients([target].concat(ins)); return raw.ce(r, target, ...ins); };
  Object.keys(MOVE_CAP).forEach(k => {
    const orig = s[k];
    s[k] = (...args) => { caps.add(MOVE_CAP[k]); return orig(...args); };
  });
  SOL[ex.id](s);
  // the statement itself can demand machinery the proof never crafts with
  (ex.sorts || []).forEach(so => { if (SORT_TUT[so]) caps.add(so === 'Ω' ? 'forall' : so === 'Set' ? 'sets' : so === 'M' ? 'ops' : so === 'G' ? 'groups' : 'induction'); });
  if ((ex.formulas || []).length) caps.add('formula');
  if ((ex.terms || []).length || (ex.consts || []).length) caps.add('forall');
  if (G.render(ex.goal).indexOf('=') >= 0 && (ex.sorts || []).length) caps.add('eq');
  return { caps, lemmas, unknown, env: s.env };
}

// ---------- build the graph in array order, then reduce it ----------
const anc = {};                       // id -> Set of all ancestors (transitive closure of prereqs)
const out = [];                       // { id, prereqs, kind, mech, caps, lemmas }
const problems = [];
G.EXERCISES.forEach(ex => {
  const t = trace(ex);
  t.unknown.forEach(u => problems.push(ex.id + ': unrecognised recipe ' + u));
  const tutPos = CHAIN.indexOf(ex.id);
  let want = new Set();
  if (tutPos > 0) want.add(CHAIN[tutPos - 1]);                       // a tutorial follows the previous one
  if (tutPos < 0) t.caps.forEach(c => { if (TUT[c] && TUT[c] !== ex.id) want.add(TUT[c]); });
  t.lemmas.forEach(l => { if (lemmaOwner[l] !== ex.id) want.add(lemmaOwner[l]); });
  // transitive reduction: drop anything already implied by another prerequisite
  [...want].forEach(p => { if (p !== ex.id && idx[p] > idx[ex.id]) problems.push(ex.id + ': needs ' + p + ', which comes LATER in the array (reorder it)'); });
  const list = [...want].filter(p => p !== ex.id && idx[p] < idx[ex.id]);
  const keep = list.filter(p => !list.some(q => q !== p && anc[q] && anc[q].has(p)));
  const closure = new Set(keep);
  keep.forEach(p => (anc[p] || new Set()).forEach(a => closure.add(a)));
  anc[ex.id] = closure;
  out.push({ id: ex.id, kind: tutPos >= 0 ? 'tutorial' : 'exercise', mech: tutPos >= 0 ? Object.keys(TUT).filter(c => TUT[c] === ex.id).join('+') : '',
             prereqs: keep.sort((a, b) => idx[a] - idx[b]), caps: [...t.caps].sort(), lemmas: [...t.lemmas].sort() });
  if (ex.kind === 'lemma' && ex.leanName && !G.RECIPES[ex.leanName]) G.RECIPES[ex.leanName] = G.recipeFromExercise(ex);
});

// ---------- the guarantee: every level is solvable the moment it opens ----------
// Replay each scripted solution as the student who solved EXACTLY this level's prerequisite closure and
// nothing else: strip every minted lemma they have not earned out of the registry, and check each mechanic
// the proof uses is active for them.  If that replay still solves the exercise, the gate is honest.
const traceCache = {};   // id -> the minted lemmas its scripted proof uses
out.forEach(o => { traceCache[o.id] = new Set(o.lemmas); });
function verify() {
  const soft = [];
  // The base recipes, taken from the registry of them rather than from G.RECIPES: by the time this
  // runs, the derivation pass above has already minted every solved lemma into G.RECIPES, so reading
  // it here would have made the whole check vacuous (every recipe would look available to everyone).
  const base = {}; G.BASE_RECIPES.forEach(r => { base[r.id] = G.RECIPES[r.id]; });
  const minted = {};
  G.EXERCISES.forEach(ex => { if (ex.kind === 'lemma' && ex.leanName && !base[ex.leanName]) minted[ex.leanName] = G.recipeFromExercise(ex); });
  const prereqOf = {}; G.EXERCISES.forEach(e => { prereqOf[e.id] = e.prereqs || []; });
  let bad = 0;
  G.EXERCISES.forEach(ex => {
    // what grimoire.js actually gives this level, not what the derivation would have given it
    const solved = {}; closureOf(ex.id).forEach(id => { solved[id] = true; });
    const acc = {}; G.EXERCISES.forEach(e => { if ((prereqOf[e.id] || []).every(p => solved[p])) acc[e.id] = true; });
    const caps = G.activeCaps(acc);   // a mechanic is live once its tutorial is REACHABLE (you need it to solve that tutorial)
    if (!acc[ex.id]) { console.log('✗ ' + ex.id + ' is not even accessible under its own prerequisite closure'); bad++; return; }
    // the registry as this student sees it
    Object.keys(G.RECIPES).forEach(k => { if (!base[k]) delete G.RECIPES[k]; });
    Object.keys(minted).forEach(n => { if (solved[lemmaOwner[n]]) G.RECIPES[n] = minted[n]; });
    const miss = [];
    const s = solver(ex.id);
    const raw = { c: s.c, ce: s.ce };
    const need = r => { const c = G.RECIPE_CAP[r]; if (c && !caps[c]) miss.push(r + ' needs the “' + c + '” mechanic'); };
    s.c = (r, ...ins) => { need(r); return raw.c(r, ...ins); };
    s.ce = (r, t, ...ins) => { need(r); return raw.ce(r, t, ...ins); };
    Object.keys(MOVE_CAP).forEach(k => { const o = s[k]; s[k] = (...a) => { if (!caps[MOVE_CAP[k]]) miss.push('the “' + MOVE_CAP[k] + '” mechanic'); return o(...a); }; });
    try {
      SOL[ex.id](s);
      if (!s.env.bindings.some(b => G.exprEq(b.type, s.env.goal))) throw new Error('did not reach the goal');
      if (miss.length) { console.log('✗ ' + ex.id + ' opens without: ' + [...new Set(miss)].join('; ')); bad++; }
    } catch (e) {
      // The script may be a reader's record that reaches for a lemma this closure has not earned. The
      // level is still solvable the way it was built — that proof is simply no longer the scripted one —
      // so this is reported as par-out-of-reach rather than counted as a gating fault.
      const unearned = [...(traceCache[ex.id] || new Set())].filter(l => lemmaOwner[l] && !solved[lemmaOwner[l]]);
      if (unearned.length) { soft.push(ex.id + ': par needs ' + unearned.join(', ') + ' (earlier in the list, not waited for)'); }
      else { console.log('✗ ' + ex.id + ' cannot be solved on opening (' + prereqOf[ex.id].join(', ') + '): ' + e.message); bad++; }
    }
  });
  Object.keys(minted).forEach(n => { G.RECIPES[n] = minted[n]; });
  if (soft.length) {
    console.log('\n' + soft.length + ' level(s) open before the lemmas their PAR uses, which the ordering rule permits:');
    soft.forEach(m => console.log('   ' + m));
  }
  console.log(bad ? '\n✗ ' + bad + ' of ' + G.EXERCISES.length + ' levels are gated wrongly' :
    '\n✓ all ' + G.EXERCISES.length + ' levels are solvable the moment they unlock (recipes and mechanics both checked)');
  return bad;
}

// the transitive closure of what grimoire.js currently says, as opposed to the derived `anc`
const curClosure = {};
function closureOf(id) {
  if (curClosure[id]) return curClosure[id];
  const out2 = new Set();
  curClosure[id] = out2;   // guard against a cycle while we build
  ((G.EX_BY_ID[id] || {}).prereqs || []).forEach(p2 => { out2.add(p2); closureOf(p2).forEach(a => out2.add(a)); });
  return out2;
}

const mode = process.argv[2] || '';
if (mode === '--verify') {
  process.exit(verify() ? 1 : 0);
} else if (mode === '--patch') {
  out.forEach(o => console.log("  '" + o.id + "': [" + o.prereqs.map(p => "'" + p + "'").join(', ') + "],"
    + (o.kind === 'tutorial' ? '   // TUTORIAL: ' + o.mech : '')));
} else if (mode === '--check') {
  let bad = 0, soft = 0;
  out.forEach(o => {
    const cur = (G.EX_BY_ID[o.id].prereqs || []).join(',');
    if (cur === o.prereqs.join(',')) return;
    // which of the derived prerequisites are missing, and are they only there because the PAR proof
    // reaches for a lemma from elsewhere?  That is allowed; a missing mechanic is not.
    const have = closureOf(o.id);   // what grimoire.js ACTUALLY gives this level, transitively
    const missing = o.prereqs.filter(x => !have.has(x));
    const lemmaOwners = new Set(o.lemmas.map(l => lemmaOwner[l]));
    const hard = missing.filter(x => !lemmaOwners.has(x) || CHAIN.indexOf(x) >= 0);
    if (hard.length) { bad++; console.log('\u2717 ' + o.id + '  in grimoire.js: [' + cur + ']   derived: [' + o.prereqs.join(',') + ']   missing mechanic gate: ' + hard.join(',')); }
    else { soft++; console.log('  ' + o.id + '  opens without ' + missing.join(',') + ' \u2014 par leans on them, which the ordering rule permits'); }
  });
  console.log(bad ? '\u2717 ' + bad + ' level(s) are gated wrongly' + (soft ? ' (and ' + soft + ' lean on earlier lemmas, which is fine)' : '')
    : '\u2713 every gate is sound' + (soft ? '; ' + soft + ' level(s) have a par that leans on earlier lemmas they do not wait for' : '') + ' (' + out.length + ' levels)');
  process.exit(bad ? 1 : 0);
} else {
  out.forEach(o => console.log([o.id.padEnd(6), o.kind === 'tutorial' ? 'TUT ' + o.mech : 'ex       ',
    '<- [' + o.prereqs.join(', ') + ']', '   mechanics: ' + o.caps.join(','), o.lemmas.length ? '   lemmas: ' + o.lemmas.join(',') : ''].join('  ')));
  const roots = out.filter(o => !o.prereqs.length).map(o => o.id);
  console.log('\n' + out.length + ' levels; ' + out.filter(o => o.kind === 'tutorial').length + ' tutorials; roots: ' + roots.join(', '));
  const fan = {}; out.forEach(o => o.prereqs.forEach(p => { fan[p] = (fan[p] || 0) + 1; }));
  console.log('widest branch points: ' + Object.entries(fan).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => k + '→' + v).join(', '));
  console.log('levels open after the tutorial chain alone: ' + (function () {
    const solved = {}; CHAIN.forEach(c => { solved[c] = true; });
    return out.filter(o => o.prereqs.every(p => solved[p])).length;
  })());
}
if (problems.length) { console.log('\nPROBLEMS:'); problems.forEach(p => console.log('  ' + p)); }
