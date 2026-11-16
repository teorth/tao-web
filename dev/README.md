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
run `check_emitted.js` so the new proof is compiled along with the rest. Then run **`prereqs.js --check`**:
a shorter proof often reaches back for a lemma from another chapter, and unless the unlock graph is
updated to match, the level can open before the par on display is reachable.
