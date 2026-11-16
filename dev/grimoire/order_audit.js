/* Ordering audit for the scripted solutions:
 *     node dev/grimoire/order_audit.js
 *
 * The rule (TT, 2026-11-16): a level's par may depend on lemmas the level does not WAIT for. The par is
 * the shortest proof the game knows, not the shortest proof reachable from what this level opened with,
 * and a reader's record often reaches back into an earlier chapter for something slicker. What must hold
 * is weaker, and about READING ORDER rather than the gate: every lemma a par proof uses has to be minted
 * EARLIER in the list, so a player working through in order has met it by the time they arrive.
 *
 * So section A is the error — a par that leans on a lemma from further down the list, which no amount of
 * playing in order would have given you. B catches a gate pointing forwards. C is a placement smell, not
 * an error: levels drilling a move their own predecessors already used (this is what turned up 7.12).
 */
const path = require('path');
const { G, SOL, solver } = require(path.join(__dirname, 'solutions.js'));

const order = {}; G.EXERCISES.forEach((e, i) => { order[e.id] = i; });
const lemmaOwner = {};
G.EXERCISES.forEach(e => { if (e.kind === 'lemma' && e.leanName) lemmaOwner[e.leanName] = e.id; });
const isBase = {}; G.BASE_RECIPES.forEach(r => { isBase[r.id] = true; });

// what each scripted solution reaches for
const uses = {};
G.EXERCISES.forEach(ex => {
  if (!SOL[ex.id]) return;
  const seen = new Set();
  const s = solver(ex.id);
  const c = s.c, ce = s.ce;
  s.c = (r, ...a) => { seen.add(r); return c(r, ...a); };
  s.ce = (r, t, ...a) => { seen.add(r); return ce(r, t, ...a); };
  try { SOL[ex.id](s); } catch (e) { return; }
  uses[ex.id] = seen;
  if (ex.kind === 'lemma' && ex.leanName && !G.RECIPES[ex.leanName]) G.RECIPES[ex.leanName] = G.recipeFromExercise(ex);
});

const anc = {};
function ancestors(id) {
  if (anc[id]) return anc[id];
  const out = new Set();
  (G.EX_BY_ID[id].prereqs || []).forEach(p => { out.add(p); ancestors(p).forEach(a => out.add(a)); });
  return (anc[id] = out);
}
G.EXERCISES.forEach(e => ancestors(e.id));

let errors = 0;

console.log('A. a par proof that uses a lemma minted LATER in the list (nothing in order gives it to you):\n');
let a = 0, outside = [];
G.EXERCISES.forEach(ex => {
  (uses[ex.id] || []).forEach(r => {
    if (isBase[r] || !lemmaOwner[r] || lemmaOwner[r] === ex.id) return;
    const owner = lemmaOwner[r];
    if (order[owner] > order[ex.id]) {
      a++; errors++;
      console.log('   %s uses %s (minted by %s, further down the list)', ex.id.padEnd(6), r.padEnd(24), owner);
    } else if (!ancestors(ex.id).has(owner)) {
      outside.push([ex.id, r, owner]);
    }
  });
});
if (!a) console.log('   (none)');

console.log('\n   For information — par helpers that come earlier but are not waited for, which the rule above');
console.log('   permits: a player who skipped them down a branch will not be able to match par until they');
console.log('   go back for them.\n');
if (!outside.length) console.log('   (none)');
outside.forEach(([id, r, owner]) => console.log('   %s uses %s (minted by %s)', id.padEnd(6), r.padEnd(24), owner));

console.log('\nB. a level gated on something later in the numbering:\n');
let b = 0;
G.EXERCISES.forEach(ex => {
  (ex.prereqs || []).forEach(p => {
    if (order[p] > order[ex.id]) { b++; errors++; console.log('   %s <- %s (which is further down the list)', ex.id, p); }
  });
});
if (!b) console.log('   (none)');

console.log('\nC. levels that drill a move their own predecessors already needed (a smell, not an error):\n');
const trivial = G.EXERCISES.filter(e => uses[e.id] && [...uses[e.id]].every(r => isBase[r]) && G.CANON[e.id] <= 2);
let c = 0;
trivial.forEach(ex => {
  const rs = [...uses[ex.id]];
  if (!rs.length) return;
  const earlier = G.EXERCISES.filter(o => order[o.id] < order[ex.id] && o.chapter === ex.chapter
    && uses[o.id] && rs.every(r => uses[o.id].has(r)));
  if (earlier.length) {
    c++;
    console.log('   %s (%s, par %d) drills %s, already used by %s',
      ex.id.padEnd(6), ex.kind, G.CANON[ex.id], rs.join('+'), earlier.map(e => e.id).join(', '));
  }
});
if (!c) console.log('   (none)');

console.log(errors ? '\n✗ ' + errors + ' ordering error(s)' : '\n✓ no ordering errors');
process.exit(errors ? 1 : 0);
