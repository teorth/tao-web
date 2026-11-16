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
| `Grimoire/Nat.lean` | the concrete `Nat` sort's own Lean module, imported by the emitted proofs. |

```bash
node dev/grimoire/canon.js            # does grimoire.js's par table still match the scripts?
node dev/grimoire/canon.js --patch    # print the CANON literal to paste back
node dev/grimoire/prereqs.js --check  # does the unlock graph still match what the proofs consume?
node dev/grimoire/order_audit.js      # can a level open before a lemma its par proof needs?
node dev/grimoire/check_emitted.js    # emit everything and compile it (needs `lean` on PATH)
```

Anything generated lands in `scratch/lean/`, which is gitignored — the sources are versioned, the build
artifacts are not.

**Why these moved here (2026-11-16).** They used to live in the gitignored `scratch/`, mirrored between
machines through Dropbox. That was survivable while the solutions were the author's own, but readers now
send in shorter proofs: a record *becomes* the script for its level, so the par the game shows follows
from a proof that is known to work. With the scripts outside git, a record recorded on one machine was
invisible to the other, and the laptop's copy drifted a week behind the desktop's. In git, a record
recorded anywhere is a record everywhere, and `canon.js` can check the claim on any checkout.

**The rule, when a reader sends in a shorter proof:** replace that level's script in `solutions.js`,
run `canon.js --patch` and paste the literal into `grimoire.js`, add the finder to `CANON_CREDIT`, and
run `check_emitted.js` so the new proof is compiled along with the rest. Then run **`order_audit.js`**.

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
