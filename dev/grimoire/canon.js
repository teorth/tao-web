/* CANON — the par table in grimoire.js — is DERIVED from the scripted solutions, never hand-written:
 *     node dev/grimoire/canon.js            # diff the measured lengths against what grimoire.js claims
 *     node dev/grimoire/canon.js --patch    # print the literal to paste back into grimoire.js
 * Re-run it whenever a solution or an exercise changes. A shorter reader proof is recorded by replacing
 * that level's script in solutions.js and running this. */
const { G, SOL, solver } = require('./solutions.js');

const len = {}, failed = [];
G.EXERCISES.forEach(ex => {
  if (!SOL[ex.id]) { failed.push(ex.id + ': no scripted solution'); return; }
  let s;
  try {
    s = solver(ex.id); SOL[ex.id](s);
    if (s.env.parent) throw new Error('did not return to root');
    if (!s.env.bindings.some(b => G.exprEq(b.type, s.env.goal))) throw new Error('not solved');
  } catch (e) { failed.push(ex.id + ': ' + e.message); return; }
  len[ex.id] = G.proofLength(s.env);
  if (ex.kind === 'lemma' && ex.leanName && !G.RECIPES[ex.leanName]) G.RECIPES[ex.leanName] = G.recipeFromExercise(ex);
});
if (failed.length) { console.log('UNSOLVED (' + failed.length + '):'); failed.forEach(f => console.log('  ' + f)); }

if (process.argv.includes('--patch')) {
  const byCh = {};
  G.EXERCISES.forEach(ex => { if (len[ex.id] != null) (byCh[ex.chapter] = byCh[ex.chapter] || []).push(ex.id); });
  const lines = Object.keys(byCh).sort((a, b) => a - b).map(ch =>
    '    ' + byCh[ch].map(id => "'" + id + "': " + len[id]).join(', ') + ',');
  console.log('  var CANON = {\n' + lines.join('\n') + '\n  };');
} else {
  const diff = Object.keys(len).filter(id => G.CANON[id] !== len[id]);
  diff.forEach(id => console.log(id + ': grimoire.js says ' + G.CANON[id] + ', the script measures ' + len[id]));
  const extra = Object.keys(G.CANON).filter(id => len[id] == null);
  extra.forEach(id => console.log(id + ': grimoire.js has a par but no script measures it'));
  console.log(diff.length || extra.length || failed.length
    ? '\u2717 CANON is out of step (' + (diff.length + extra.length) + ')'
    : '\u2713 CANON matches the scripted solutions (' + Object.keys(len).length + ' levels)');
  if (diff.length || extra.length || failed.length) process.exit(1);
}
