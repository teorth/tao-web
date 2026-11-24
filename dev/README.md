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
| `perf.js` | what a click costs on a long proof, and how that scales with the bench. |
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
node dev/grimoire/perf.js 18.10 --ladder  # what does a click cost in a late chapter?
```

The two suites are the quality bar: every change to the game is checked against them, and they are what
makes the engine safe to refactor. Note what the *derivation* tools cannot see, though: `canon.js`,
`prereqs.js` and `order_audit.js` all drive the ENGINE, which knows every recipe in the registry,
while the player crafts through a panel that offers a filtered list. Those two came apart until
2026-11-21 — a lemma that is a closed statement mints a recipe of arity 0, arity-0 recipes were
filtered out of the panel, and eight lemmas were therefore unusable *in the game* while being
perfectly usable in the scripts that measure the par. Chapter 20's whole ladder was affected. The
smoke suite now compares the two lists for every level, which is the only place that check can live. Run both before committing, with `canon.js` and `order_audit.js`;
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
why the counts are written down here and in the commit that moves them. **As of 2026-11-24: core 4986, smoke 482.**

**The spellbook is one walk now (2026-11-22), and that is worth knowing before touching the emitters.**
The Lean reading and the informal one were two functions over the same `steps` tree with identical
control flow; they are a single traversal (`proofNodes`) whose nodes carry both readings, and the three
views — Lean, informal, and the hybrid that interleaves them — are projections of it. The export is the
hybrid, so what the spellbook shows and what Copy writes cannot disagree.

Each node keeps an indent for EACH reading, because the difference is real: Lean closes a sub-proof from
inside it (`exact …`) while the prose closes it from outside ("Discharging, we obtain …"). A node also
carries a `path`, which is what the UI folds by — derived from the position in the proof tree, because
the spellbook is re-rendered after every move and a fold keyed to a row on screen would not survive it.

The refactor was checkable, and that is why it was safe: a scratch script required the previous
`grimoire.js` beside the new one and compared all four emitters across 2164 board/option combinations,
which came out byte-identical. The permanent guard is in the core suite — the hybrid's code lines must be
exactly the Lean view and its comment lines exactly the informal view, for every scripted proof and for
part-finished boards too — together with the expected-text assertions that have always pinned the format
(`emit exercise 1.1` and friends). If you change an emitter, those are what will tell you.

**And the second way a suite loses coverage, found 2026-11-21.** The sections spliced back on the
17th went in *after* the smoke suite's `console.log` and `process.exit` — so `par`, `export` and
`writing a quantifier` were present in the file, would have passed a header diff, and never ran.
The count said 371 because only one of the four had landed above the exit. Three of them needed a
`click()` on the DOM shim's elements before they passed, so they had never run against this engine
at all. **A header diff is not enough: check that the file has exactly ONE tail.**
`grep -c process.exit` on each suite is the whole check.

**What the suites could not have caught (2026-11-18).** Two readers reported Chrome eating gigabytes
and crawling from 18.8 on. Nothing was wrong with those levels: the recipe panel's “hide inactive”
option, which is on by default, decides whether to dim a card by building the card list a second time
with *everything on the bench selected at once* — and the brew search then enumerated every ordered
tuple of that selection for every recipe in the book, building the whole list of orderings before
trying the first. A 28-step proof in chapter 18 is 60 ingredients against 105 recipes: **927 million
tuples, materialised, on every render with nothing selected.** It now walks them lazily, skips what a
recipe's declared `slots` rule out, abandons a prefix its `prefix` test says cannot be completed, and
asks for FIRST brews only when all it needs is whether a card lights up. Same answers — a brute-force
oracle in the core suite enumerates every ordering and demands the search agree, for all 114 recipes.

The lesson for the suites: a test suite checks what the code *answers*, and this was a bug about what
it *costs*. So the guard that went in with the fix counts matcher calls rather than milliseconds —
under 400k for a forty-potion bench, where the old search would have walked billions — and `perf.js`
is there to be run by hand when a chapter grows. Note what it has to set up to see the problem at all:
a player's real board has every lemma they have proved UNLOCKED AS A RECIPE, and with `state.unlocked`
left empty the search runs over 19 recipes instead of 105 and the blow-up is invisible.

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

The line itself is **v2** since 2026-11-21: the moves as s-expressions rather than base64'd JSON, about
four times shorter and legible, because a reader with a shorter 18.10 could not post the export at all —
the blog refused the comment, and that proof's replay line alone was 6.5 KB. The longest any level now
produces is about 2 KB, and the game has a **Copy record** button that copies the header and that line
and nothing else. v1 lines still read: records were posted in that format. The filer also normalises what
a comment box does to a pasted line (a leading `--` curled into an em dash, base64 wrapped across lines),
so the raw text of a blog comment can be fed to it as it stands — including the apostrophes it curls.
That last one was a mistake in the v2 design: the line was said to have "no quotes in it to be curled",
and then the first v2 record that arrived came back as `unknown recipe Or.imp’`, because half the recipe
names end in a prime. The filer straightens every quote in a payload, which is safe where a payload is
identifiers, sorts and symbols, and the core suite now mangles a line the way the blog does before
reading it back.

Two traps worth knowing about, both of which bit on real submissions:

(1) On the first batch the tool was really used on (2026-11-18):
the replay starts from a fresh board, and a fresh board holds only the BASE recipes — so a submission
that applies a lemma the reader had minted came back as `NOT A PROOF: unknown recipe Or.imp_left'`,
which reads exactly like a forgery. Five genuine records in a row said that. `file_record.js` now stocks
the registry first with every lemma owned by a level EARLIER IN THE LIST, which is what the par rule
allows a record to lean on anyway; the tool's own tests had only ever replayed a base-recipe proof (2.1),
which is why the gap sat there unnoticed. If a submission ever fails on a recipe name again, check that
before doubting the reader.

(2) A potion is named after its own statement, so anything that changes which names are in use changes
what a later move's ingredient names mean. Two things did that silently: `deletePotion`/`renamePotion`
were not logged at all (fixed 2026-11-21 — they are `['del', name]` and `['ren', old, new]` moves now),
and capture-avoiding substitution picked its fresh name from a GLOBAL counter, so the same proof played
twice gave `b'1` one time and `b'3` the next. The second made six chapter-18 levels unreplayable — 18.10
among them, which is the proof the reader above was trying to send. **If a submission fails on a NAME,
suspect the pipeline before the reader.**

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
