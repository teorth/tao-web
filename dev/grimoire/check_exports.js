/* Compile each EXPORTED proof on its own, with plain core Lean.
 *
 *   node dev/grimoire/check_exports.js           # one level per chapter (20 files)
 *   node dev/grimoire/check_exports.js --all     # all 158, one `lean` run each (slow: a few minutes)
 *   node dev/grimoire/check_exports.js 18.8 6.9  # just these
 *
 * This is a DIFFERENT guarantee from check_emitted.js. That one puts all 158 proofs in a single file, so
 * a proof there may lean on anything declared above it -- the minted lemmas of earlier levels included.
 * An export has nothing above it: it is one file, sent to one person, and the Save button promises it
 * compiles as it stands. So the export carries the concrete sorts' definitions and the whole chain of
 * minted lemmas with it, and this harness is what checks that the promise holds.
 *
 * It drives the REAL export (`proofText` in grimoire.html), booted through the smoke test's DOM shim,
 * rather than a copy of its logic here.
 */
const FS = require('fs'), PT = require('path');
// SOL/solver come from solutions.js, NOT from check_emitted.js: that one has no export list and
// does its work when loaded, so requiring it would compile all 158 proofs before this even starts.
const { SOL, solver } = require(PT.join(__dirname, 'solutions.js'));
const { execSync } = require('child_process');

// boot the UI exactly as the smoke test does, up to the point where its hook is exposed
let src = FS.readFileSync(PT.join(__dirname, 'grimoire_smoke.js'), 'utf8');
src = src.slice(0, src.indexOf('const A = window.__grimoire;') + 'const A = window.__grimoire;'.length);
src = src.replace(/^ok\(/gm, '//ok(').replace(/^(const|let) /gm, 'var ');
eval(src);
A.setCheat(true);

// `G` and `A` come out of the eval above (the shim's own bindings), so neither is re-declared here.
// Replay every scripted solution, minting each lemma's recipe as the game does, and file the finished
// proof where the player's own would sit -- which is where the export reads its lemma chain from.
const envs = {};
G.EXERCISES.forEach(ex => {
  if (!SOL[ex.id]) return;
  const sv = solver(ex.id); SOL[ex.id](sv);
  envs[ex.id] = sv.env;
  A.state.progress[ex.id] = { env: sv.env, history: [], formulas: [], terms: [] };
  A.state.solved[ex.id] = true;
  if (ex.kind === 'lemma' && ex.leanName && !G.RECIPES[ex.leanName]) G.RECIPES[ex.leanName] = G.recipeFromExercise(ex);
});

const args = process.argv.slice(2);
let ids;
if (args.some(a => a === '--all')) ids = G.EXERCISES.filter(e => SOL[e.id]).map(e => e.id);
else if (args.length) ids = args;
else {   // one per chapter: the deepest level in it, which is the one carrying the longest lemma chain
  const byCh = {};
  G.EXERCISES.forEach(e => { if (SOL[e.id]) byCh[e.chapter] = e.id; });
  ids = Object.keys(byCh).sort((a, b) => a - b).map(c => byCh[c]);
}

const dir = PT.join(PT.resolve(__dirname, '..', '..'), 'scratch', 'lean', '_exports');
FS.rmSync(dir, { recursive: true, force: true });
FS.mkdirSync(dir, { recursive: true });

let bad = 0;
ids.forEach(id => {
  if (!G.EX_BY_ID[id]) { console.log('  ' + id + ': no such exercise'); bad++; return; }
  A.loadExercise(id);
  // `loadExercise` files the board it is leaving into `progress`, which clobbers the replayed proof of
  // whichever level happened to be open (1.1 at boot). Re-file them all, then take the board from the
  // replay rather than from `progress`, so neither the proof nor its lemma chain can be the stale one.
  G.EXERCISES.forEach(e => { if (envs[e.id]) A.state.progress[e.id] = { env: envs[e.id], history: [], formulas: [], terms: [] }; });
  A.state.env = envs[id];
  if (!A.isSolved()) { console.log('  ' + id + ': the replayed solution did not land'); bad++; return; }
  const txt = A.proofText();
  const f = PT.join(dir, 'ex' + id.replace(/\./g, '_') + '.lean');
  FS.writeFileSync(f, txt);
  const deps = (txt.match(/^section$/gm) || []).length;
  let note = id.padEnd(6) + String(txt.split('\n').length).padStart(4) + ' lines, ' + String(deps).padStart(2) + ' lemmas carried';
  if (/^import /m.test(txt)) { console.log('  ' + note + '  -- an export must need no import'); bad++; return; }
  if (/\bsorry\b/.test(txt)) { console.log('  ' + note + '  -- a `sorry` survived into a finished export'); bad++; return; }
  try {
    execSync('lean ' + JSON.stringify(f), { cwd: dir, stdio: 'pipe' });
    console.log('  ✓ ' + note);
  } catch (e) {
    bad++;
    console.log('  ✗ ' + note + '\n' + (e.stdout ? e.stdout.toString() : '') + (e.stderr ? e.stderr.toString() : ''));
  }
});
console.log(bad ? '\n' + bad + ' of ' + ids.length + ' exports did not compile on their own'
                : '\nall ' + ids.length + ' exports compile on their own with core Lean');
process.exitCode = bad ? 1 : 0;
