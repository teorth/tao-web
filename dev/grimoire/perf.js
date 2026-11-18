/* What does a click COST, on a long proof in a late chapter?
 *
 *   node dev/grimoire/perf.js 18.10          # every move of a level, timed
 *   node dev/grimoire/perf.js 18.10 --ladder # and then the same board padded out, to see the scaling
 *
 * Two readers reported Chrome eating gigabytes and crawling from 18.8 on (17-18 November 2026). The cause
 * was not in any one level: the panel's "hide inactive" option, which is ON by default, decides whether to
 * dim a recipe card by building the card list a SECOND time with everything on the bench selected at once
 * -- and the brew search then enumerated every ordered tuple of that selection, for every recipe in the
 * book. A 28-step proof in chapter 18 is 60 ingredients and a hundred-odd minted lemmas: 927 MILLION
 * tuples, materialised as arrays, on every render with nothing selected. This harness is what found it,
 * and what says it has not come back.
 *
 * It boots the real UI through the smoke suite's DOM shim and gives the player the board they would really
 * have at that point: every earlier level solved, and every lemma they have proved UNLOCKED AS A RECIPE.
 * That last part matters -- with `state.unlocked` left empty the search runs over 19 recipes instead of
 * 105, and the problem is invisible.
 */
const FS = require('fs'), PT = require('path');
const { SOL, solver } = require(PT.join(__dirname, 'solutions.js'));

let src = FS.readFileSync(PT.join(__dirname, 'grimoire_smoke.js'), 'utf8');
src = src.slice(0, src.indexOf('const A = window.__grimoire;') + 'const A = window.__grimoire;'.length);
src = src.replace(/^ok\(/gm, '//ok(').replace(/^(const|let) /gm, 'var ');
eval(src);
A.setCheat(true);

const envs = {};
G.EXERCISES.forEach(ex => {
  if (!SOL[ex.id]) return;
  const sv0 = solver(ex.id); SOL[ex.id](sv0);
  envs[ex.id] = sv0.env;
  A.state.solved[ex.id] = true;
  if (ex.kind === 'lemma' && ex.leanName && !G.RECIPES[ex.leanName]) {
    const rc = G.recipeFromExercise(ex);
    G.RECIPES[rc.id] = rc; A.state.unlocked[ex.leanName] = rc;   // the recipe book the search runs over
  }
});
G.EXERCISES.forEach(e => { if (envs[e.id]) A.state.progress[e.id] = { env: envs[e.id], history: [], formulas: [], terms: [] }; });

const args = process.argv.slice(2);
const id = args.filter(a => a[0] !== '-')[0] || '18.10';
const ladder = args.includes('--ladder');
const mb = () => (process.memoryUsage().heapUsed / 1048576).toFixed(0);
const ms = f => { const t = process.hrtime.bigint(); f(); return Number(process.hrtime.bigint() - t) / 1e6; };

A.loadExercise(id);
A.state.progress[id] = { env: G.newEnv(G.EX_BY_ID[id]), history: [], formulas: [], terms: [] };
console.log(id + ': par ' + G.par(id) + ', ' + A.availableRecipes().length + ' recipes in the book, heap ' + mb() + ' MB\n');

// ---- every move of the scripted solution, charged for the work a click does ----
const sv = solver(id);
let n = 0, worst = 0;
const cols = ['ingredients', 'recipes', 'spellbook', 'persist', 'one click'];
console.log('  #  move                        pots  forms' + cols.map(c => c.padStart(11)).join('') + '      heap');
function charge(label) {
  A.state.env = sv.env;
  const names = sv.env.bindings.map(b => b.name), last = names[names.length - 1];
  const t = {
    'ingredients': ms(() => A.ingredients()),
    'recipes': ms(() => A.availableRecipes()),
    'spellbook': ms(() => A.proofText()),
    'persist': ms(() => A.persist()),
    // select a potion, then clear it: the second render is the one with an EMPTY selection, which is
    // the case that runs the reachability probe -- the expensive one, and the one players sit through
    'one click': ms(() => { A.clickSel(last); A.clearSel(); }),
  };
  worst = Math.max(worst, t['one click']);
  console.log(String(++n).padStart(3) + '  ' + label.slice(0, 26).padEnd(26)
    + String(sv.env.bindings.length).padStart(5) + String(A.state.formulas.length).padStart(7)
    + cols.map(c => t[c].toFixed(1).padStart(11)).join('') + String(mb()).padStart(8) + ' MB');
}
['c', 'a', 'd', 'n', 'v', 'obtain', 'pick', 'ce', 'ab'].forEach(k => {
  const f = sv[k];
  sv[k] = (...a) => { const r = f(...a); charge(k + ' ' + (typeof a[0] === 'string' ? a[0] : '')); return r; };
});
SOL[id](sv);
console.log('\nworst click ' + worst.toFixed(0) + ' ms, final heap ' + mb() + ' MB');

// ---- and the same board with junk left on the bench, which is what a player's really looks like ----
if (ladder) {
  let env = sv.env;
  const pad = () => {
    const bs = env.bindings;
    for (let i = 0; i < bs.length - 1 && i < 4; i++) {
      const r = G.craft(env, 'And.intro', [G.proofIng(bs[bs.length - 1 - i]), G.proofIng(bs[(i * 7) % bs.length])]);
      if (r.ok) { env = r.env; return true; }
    }
    return false;
  };
  console.log('\nthe scripted solution is optimal; a player leaves failed attempts lying around:\n');
  console.log('  potions   ingredients     one click      heap');
  for (const target of [env.bindings.length, 45, 60, 90, 130]) {
    while (env.bindings.length < target && pad()) { /* grow */ }
    if (env.bindings.length < target) break;
    A.state.env = env;
    const names = env.bindings.map(b => b.name);
    A.clearSel();
    const t = ms(() => { for (let i = 0; i < 3; i++) { A.clickSel(names[names.length - 1]); A.clearSel(); } }) / 3;
    console.log('  ' + String(env.bindings.length).padStart(7) + String(2 * env.bindings.length).padStart(13)
      + t.toFixed(0).padStart(11) + ' ms' + String(mb()).padStart(9) + ' MB');
  }
}
