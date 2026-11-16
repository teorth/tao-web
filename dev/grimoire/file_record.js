/* Take a record a reader has sent in and check it, from whatever they pasted:
 *
 *     node dev/grimoire/file_record.js comment.txt        # or: … < comment.txt, or paste and ^D
 *     node dev/grimoire/file_record.js comment.txt --json
 *
 * The export the game writes ends with a line
 *
 *     -- grimoire-replay v1 <id> <base64>
 *
 * holding the moves that made the proof. This replays them through the engine from a fresh board, so a
 * claim is checked rather than believed: it must reach the goal, and it must be shorter than the par the
 * game currently knows. Then it prints what to paste where — the scripted solution for `solutions.js`,
 * the new number for `CANON`, and a `CANON_CREDIT` line — because those three are what a record is.
 *
 * Nothing here needs a server. The reader pastes into the blog; this reads what they pasted.
 */
const fs = require('fs');
const { G } = require('./solutions.js');

const RE = /--\s*grimoire-replay\s+v(\d+)\s+(\S+)\s+([A-Za-z0-9+/=\s]+?)(?:\n\s*\n|\n--|$)/g;

// Every replay line in a pasted comment, checked. `parOf` is injectable so the tests can ask what the
// tool would say about a level whose par it does not actually hold.
function assess(text, parOf) {
  const par = parOf || (id => G.par(id));
  const out = [];
  let m;
  RE.lastIndex = 0;
  while ((m = RE.exec(text)) !== null) {
    const v = +m[1], id = m[2], b64 = m[3].replace(/\s+/g, '');
    const ex = G.EX_BY_ID[id];
    const r = { id: id, version: v, shownAs: ex ? G.exNum(ex) : null };
    if (v !== 1) { r.verdict = 'unknown replay version ' + v; out.push(r); continue; }
    if (!ex) { r.verdict = 'no level has the id ' + id; out.push(r); continue; }
    const moves = G.decodeMoves(b64);
    if (!moves) { r.verdict = 'the replay line is not readable — it may have been truncated in the paste'; out.push(r); continue; }
    const res = G.replayMoves(ex, moves);
    if (!res.ok) { r.verdict = 'NOT A PROOF: ' + res.error; out.push(r); continue; }
    const p = par(id);
    Object.assign(r, { length: res.length, par: p, moves: moves, record: p != null && res.length < p });
    r.verdict = p == null ? 'proves it in ' + res.length + ' (this level has no par yet)'
      : res.length < p ? 'A RECORD: ' + res.length + ' moves against a par of ' + p
      : res.length === p ? 'matches the par of ' + p + ' — nothing to record'
      : 'longer than the par of ' + p + ' (' + res.length + ') — nothing to record';
    out.push(r);
  }
  return out;
}

// The moves as a scripted solution. Expressions come out as data — correct, and unreadable; the printed
// advice says to rewrite them with the shorthands the file already uses before committing.
function scriptFor(id, moves) {
  const lit = e => JSON.stringify(e);
  const ing = x => typeof x === 'string' ? JSON.stringify(x) : 'F(' + lit(x) + ')';
  const lines = [];
  let n = 0;
  moves.forEach(mv => {
    switch (mv[0]) {
      case 'c': {
        const head = mv[3] ? 's.ce(' + JSON.stringify(mv[1]) + ', ' + lit(mv[3]) : 's.c(' + JSON.stringify(mv[1]);
        lines.push('const b' + (++n) + ' = ' + head + (mv[2].length ? ', ' + mv[2].map(ing).join(', ') : '') + ');');
        break;
      }
      case 'a': lines.push('s.a(' + lit(mv[1]) + ');'); break;
      case 'd': lines.push('s.d(' + JSON.stringify(mv[1]) + ', ' + mv[2] + ');'); break;
      case 'n': lines.push('s.n(' + JSON.stringify(mv[1]) + ', ' + (mv[2] ? JSON.stringify(mv[2]) : 'null') + ');'); break;
      case 'v': lines.push('s.v(' + JSON.stringify(mv[1]) + ', ' + JSON.stringify(mv[2]) + ');'); break;
      case 'ob': lines.push('s.obtain(' + JSON.stringify(mv[1]) + ', ' + JSON.stringify(mv[2]) + ');'); break;
      case 'p': lines.push('s.pick(' + JSON.stringify(mv[1]) + ');'); break;
      case 'ab': lines.push('s.ab(' + mv[1] + ');'); break;
    }
  });
  return "  '" + id + "': s => {\n    " + lines.join('\n    ') + '\n  },';
}

if (require.main !== module) { module.exports = { assess, scriptFor, RE }; return; }

const argv = process.argv.slice(2);
const asJson = argv.includes('--json');
const file = argv.filter(a => a[0] !== '-')[0];
const text = file ? fs.readFileSync(file, 'utf8') : fs.readFileSync(0, 'utf8');
const out = assess(text);

if (!out.length) {
  console.log('No replay line in that text.\n');
  console.log('A record carries one, written by the game at the end of the exported proof:');
  console.log('    -- grimoire-replay v1 7.4 W1siYyIsIkltcGwuaWRlbSIs…\n');
  console.log('A proof exported before 2026-11-16 has none — those have to be read and scripted by hand,');
  console.log('as the first twenty records were. If the reader still has the level solved in their');
  console.log('browser, asking them to press Copy again is quicker than reconstructing it.');
  process.exit(2);
}

if (asJson) {
  console.log(JSON.stringify(out, null, 1));
} else {
  out.forEach(r => {
    console.log('\n' + r.id + (r.shownAs && r.shownAs !== r.id ? '  (shown as ' + r.shownAs + ')' : '') + ' — ' + r.verdict);
    if (!r.record) return;
    console.log('\n  1. the script, into dev/grimoire/solutions.js, replacing the entry for ' + r.id + ':\n');
    console.log(scriptFor(r.id, r.moves).split('\n').map(l => '  ' + l).join('\n'));
    console.log('\n     The expressions are dumped as data, which is correct but unreadable. Rewrite them with');
    console.log('     the shorthands the file already uses (A, B, AND, EE, Pp …) before committing — the');
    console.log("     script is the project's record of how a level is proved, and someone has to read it.");
    console.log('\n  2. then: node dev/grimoire/canon.js --patch     (CANON[' + r.id + '] becomes ' + r.length + ')');
    console.log('  3. and a line in CANON_CREDIT, with the name and the date of the comment:\n');
    console.log("       '" + r.id + "': { who: '…', date: '" + new Date().toISOString().slice(0, 10) + "' },");
    console.log('\n  4. finally: node dev/grimoire/check_emitted.js, and the two node suites.');
  });
  console.log('');
}
process.exit(out.some(r => /NOT A PROOF|not readable/.test(r.verdict)) ? 1 : 0);
