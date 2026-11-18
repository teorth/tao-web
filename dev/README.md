# dev/ — development tooling that belongs in the repo

Not part of the published site: `build.py` copies `static/` and renders `data/`, and never looks here.
What lives here is tooling whose *content is a record* — something a second machine, or a later session,
must have in order to reproduce a claim the site makes.

## `dev/grimoire/` — the scripted solutions of Lean Grimoire

| file | what it is |
|------|------------|
| `solutions.js` | one script per level: how that exercise is proved, in the engine's move language. |
| `check_emitted.js` | solves every level, emits the Lean, compiles the lot with core Lean (no Mathlib). |
| `canon.js` | measures the scripts; `CANON` in `grimoire.js` (the par the game shows) is derived from them. |
| `prereqs.js` | instruments the scripts to see what each proof consumes, and derives the unlock graph. |
| `order_audit.js` | three ordering questions `prereqs.js` does not ask (see its header). |
| `file_record.js` | takes a record a reader pasted into the blog, replays it, and says what to file. |
| `grimoire_test.js` | the core suite: the engine with no DOM in sight. |
| `grimoire_smoke.js` | the UI suite: `grimoire.html` driven against a fake DOM, in Node. |
| `check_exports.js` | compiles each *export* on its own — a different guarantee from `check_emitted.js`. |
| `Grimoire/Nat.lean` | the concrete `Nat` sort's own Lean module, imported by the emitted proofs. |

```bash
node dev/grimoire/canon.js            # does grimoire.js's par table still match the scripts?
node dev/grimoire/canon.js --patch    # print the CANON literal to paste back
node dev/grimoire/prereqs.js --check  # does the unlock graph still match what the proofs consume?
node dev/grimoire/order_audit.js      # can a level open before a lemma its par proof needs?
node dev/grimoire/check_emitted.js    # emit everything and compile it (needs `lean` on PATH)
node dev/grimoire/file_record.js comment.txt   # is this reader's proof really a record?

node dev/grimoire/grimoire_test.js    # the core suite
node dev/grimoire/grimoire_smoke.js   # the UI suite, against a fake DOM
node dev/grimoire/check_exports.js    # does each export compile ALONE?  (--all for all 158)
```

The two suites are the quality bar: every change to the game is checked against them, and they are what
makes the engine safe to refactor. Run both before committing, with `canon.js` and `order_audit.js`;
`check_emitted.js` as well when a solution or an exercise changed, and `check_exports.js` when the
export or a concrete sort's module changed. The last is a **different** guarantee: `check_emitted.js`
puts all 158 proofs in one file, where a proof may lean on anything declared above it, while an export
is one file sent to one person — so it has to carry the concrete sorts and the whole chain of minted
lemmas with it, and only `check_exports.js` compiles it with nothing above it.

Anything generated lands in `scratch/lean/`, which is gitignored — the sources are versioned, the build
artifacts are not.

**Why these moved here (2026-11-16, and the test suites on 2026-11-17).** They used to live in the
gitignored `scratch/`, mirrored between machines through Dropbox. That was survivable while the solutions were the author's own, but readers now
send in shorter proofs: a record *becomes* the script for its level, so the par the game shows follows
from a proof that is known to work. With the scripts outside git, a record recorded on one machine was
invisible to the other, and the laptop's copy drifted a week behind the desktop's. In git, a record
recorded anywhere is a record everywhere, and `canon.js` can check the claim on any checkout.

**What the suites' move cost, found the next day — read this before trusting a green run.** They had
drifted in *both* directions at once: the laptop's copy tracked the current engine but came from a
lineage predating the hint/par/export/quantifier work, while the desktop's had those sections and was
stale about everything else. The laptop's was the copy committed, so ten sections went missing — six
from the core suite (`words mode`, `the informal narration`, `hints`, which had been superseded by a
158-level version and came back as the old 21-level `tutorial hints`, `typing a quantifier`,
`everything the board shows can be typed back in`, `par, and whose proof it is`) and four from the
smoke suite (`Plain English`, `par`, `export`, `writing a quantifier`). **The suite still passed**,
because absent tests do not fail; the only trace was the pass count, 3128/311 where the other copy
reported 4747/353. They were spliced back on 2026-11-17 and all of them passed against the current
engine unchanged — the drift really had been additive — giving **core 4752, smoke 371**.

So: **if either number falls, something was dropped.** That is the whole early-warning system, which is
why the counts are written down here and in the commit that moves them.

The test suites followed a day later, for the same reason and a sharper one: the laptop's copies had
drifted a week behind the game and reported **142 failures** that were all stale assertions — hints had
moved to every level, explicit parentheses had become the default — which is worse than no suite at all,
because it trains you to ignore the output. A suite that ships with the code it tests cannot drift from
it. Nothing about them needs a scratch directory: each finds `static/apps/grimoire.js` by walking up
from its own location, so they run from wherever they sit inside the repo.

**When a reader sends in a shorter proof**, feed what they pasted to `file_record.js`. Since
2026-11-16 the game ends a solved export with a line of its own moves —

```
-- grimoire-replay v1 7.4 W1siYyIsIkltcGwuaWRlbSIs…
```

— base64 so that a blog comment cannot curl a quote inside it, and holding the ingredients as parsed
expressions rather than as text, so nothing has to be re-parsed without its sort context. The tool
replays those moves through the engine from a fresh board: a claim is **checked, not believed** (it must
reach the goal, and beat the current par), and then it prints the three things a record is — the script
for `solutions.js`, the new `CANON` number, and a `CANON_CREDIT` line. Rewrite the generated script's
expressions with the shorthands the file uses before committing; it comes out as raw data, which is
correct and unreadable. Then `canon.js --patch`, `check_emitted.js`, `order_audit.js`, and the two node
suites.

A proof exported before 2026-11-16 carries no replay line, and has to be read and scripted by hand, as
the first twenty records were. Asking the reader to press Copy again is usually quicker.

**Three things a level carries, which are not the same thing (TT, 2026-11-16).**

| | what it is | who reads it | may it change? |
|---|---|---|---|
| `id` | the stable tag | saved progress, `CANON`, `CANON_CREDIT`, `prereqs`, the map | **never** — reuse it and a reader's save points at the wrong board |
| `num` | the number shown, defaulting to `id` | the player: dropdown, map, exported proof, filename | freely |
| position in `EXERCISES` | the linear order | par legality, navigation, the derivation tools | freely, by moving the entry |

So renumbering a chapter is `num` plus a reordering of the array, and old saves keep working — no key
bump, no migration. Two invariants keep it honest, both checked by `grimoire_test.js`: `num` runs in the
same direction as the array (otherwise the numbering would imply a dependency order the game does not
have), and no level waits on one that comes after it.

Chapter 7 is the worked example (2026-11-16). A reader pointed out that 7.12 — a one-brew `Iff.intro`
drill — sat ten levels after the exercises that already needed the move. Its entry moved to just behind
the chapter's tutorial and the chapter's `num`s shifted up, so it now reads 7.2 and the rest run on from
there. **No id changed**, so every saved game still points at the board it was playing:

| shown as | 7.1 | 7.2 | 7.3 | 7.4 | 7.5 | 7.6 | 7.7 | 7.8 | 7.9 | 7.10 | 7.11 | 7.12 | 7.13 | 7.14 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| id | 7.1 | **7.12** | 7.2 | 7.3 | 7.4 | 7.5 | 7.6 | 7.7 | 7.8 | 7.9 | 7.10 | 7.11 | 7.13 | 7.14 |

**When a reader quotes a number, translate it.** An exported proof is headed with the `num`, and the
comments on the blog post quote whatever the game showed at the time — so a record for "exercise 7.5"
belongs under `CANON_CREDIT['7.4']`, and a record posted before 16 November 2026 uses the old numbering
altogether. The id is what every table is keyed by; the number is just what the player saw.

**What a par is allowed to depend on (TT, 2026-11-16).** A shorter proof often reaches back into an
earlier chapter for something slicker than the route its level was built around. The level does **not**
have to wait for those lemmas: par is the shortest proof the game knows, not the shortest reachable from
what this level opened with, and a player who met the helper on the way will see the shorter route.
What must hold is that every such helper is minted **earlier in the list**, so working through in order
gets you there. That is section A of `order_audit.js`, and it is the check that matters when a record
lands. `prereqs.js --check` still reports those levels, now as "par leans on them, which the ordering
rule permits", and fails only on a missing *mechanic* gate; `prereqs.js --verify` replays every level as
a player who has solved exactly its prerequisites, and lists the pars that are out of reach at opening
without counting them as faults.
