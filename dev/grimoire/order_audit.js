/* Ordering audit: does any level depend on something that comes after it?
 *     node dev/grimoire/order_audit.js
 * Three questions, none of which `prereqs.js --check` asks:
 *   A. does a level's scripted proof use a lemma that is not an ancestor of it in the unlock graph?
 *      (then the level can open before the proof it advertises as par is available)
 *   B. is a level gated on something further down the numbering?
 *   C. which levels drill a move that their own predecessors already needed? — a placement smell,
 *      not an error; this is what turned up 7.12. */
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

// reachability in the prereq DAG
const anc = {};
function ancestors(id) {
  if (anc[id]) return anc[id];
  const out = new Set();
  (G.EX_BY_ID[id].prereqs || []).forEach(p => { out.add(p); ancestors(p).forEach(a => out.add(a)); });
  return (anc[id] = out);
}
G.EXERCISES.forEach(e => ancestors(e.id));

console.log('A. a level whose scripted proof uses a lemma that is NOT an ancestor in the unlock graph');
console.log('   (so the level can open before the lemma it needs exists):\n');
let a = 0;
G.EXERCISES.forEach(ex => {
  (uses[ex.id] || []).forEach(r => {
    if (isBase[r] || !lemmaOwner[r] || lemmaOwner[r] === ex.id) return;
    const owner = lemmaOwner[r];
    if (!ancestors(ex.id).has(owner)) {
      a++;
      console.log('   %s uses %s (minted by %s)%s', ex.id.padEnd(6), r.padEnd(24), owner,
        order[owner] > order[ex.id] ? '  <-- and ' + owner + ' comes LATER in the list' : '');
    }
  });
});
if (!a) console.log('   (none)');

console.log('\nB. a level that is gated on something later in the numbering:\n');
let b = 0;
G.EXERCISES.forEach(ex => {
  (ex.prereqs || []).forEach(p => {
    if (order[p] > order[ex.id]) { b++; console.log('   %s <- %s (which is further down the list)', ex.id, p); }
  });
});
if (!b) console.log('   (none)');

console.log('\nC. levels that drill a move their own predecessors already needed:\n');
// a level whose proof uses ONLY base recipes, placed after a sibling whose proof uses the same recipe
const trivial = G.EXERCISES.filter(e => uses[e.id] && [...uses[e.id]].every(r => isBase[r]) && G.CANON[e.id] <= 2);
trivial.forEach(ex => {
  const rs = [...uses[ex.id]];
  const earlier = G.EXERCISES.filter(o => order[o.id] < order[ex.id] && o.chapter === ex.chapter
    && uses[o.id] && rs.every(r => uses[o.id].has(r)));
  if (earlier.length) {
    console.log('   %s (%s, par %d) drills %s, already used by %s',
      ex.id.padEnd(6), ex.kind, G.CANON[ex.id], rs.join('+'), earlier.map(e => e.id).join(', '));
  }
});
