/* The scripted solution of every Grimoire exercise: one function per level, written in the little
 * move language below (`s.c` craft, `s.a` assume, `s.d` discharge, `s.n` reductio, `s.v` introduce a
 * variable, `s.obtain`, `s.pick`, `s.ce` pick one result of a multi-output recipe).
 *
 * These are the project's record of HOW each level is meant to be proved, and they are load-bearing:
 *   - `check_emitted.js` emits each one as Lean and compiles the lot, so every scripted proof is real;
 *   - `canon.js` measures them, which is where `CANON` (the par shown in the game) comes from;
 *   - `prereqs.js` instruments them to see which mechanic and which earlier lemma each proof consumes.
 *
 * So a reader's shorter proof BECOMES the script for that level — that is what keeps the par honest.
 * Lived in a gitignored scratch directory until 2026-11-16, which made records machine-local; they are
 * in git now so that a record recorded on one machine is a record everywhere. */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
function findApps(d) { for (let i = 0; i < 16; i++) { if (fs.existsSync(path.join(d, 'static/apps/grimoire.js'))) return path.join(d, 'static/apps'); const u = path.dirname(d); if (u === d) break; d = u; } throw new Error('grimoire.js not found walking up from ' + __dirname + ' — keep this file in the repo (scratch/lean/)'); }
const G = require(path.join(findApps(__dirname), 'grimoire.js'));
const A = G.varE('A'), B = G.varE('B'), C = G.varE('C'), D = G.varE('D'), AND = G.AND, OR = G.OR, IMPLIES = G.IMPLIES, IFF = G.IFF, NOT = G.NOT, TRUE = G.TRUE, FALSE = G.FALSE, F = G.formulaIng;
const OMEGA = G.OMEGA, xO = G.varE('x', OMEGA), yO = G.varE('y', OMEGA), X = G.varE('X', OMEGA), Y = G.varE('Y', OMEGA), alpha = G.varE('α', OMEGA), aO = G.varE('a', OMEGA);
const Q = (a, b) => G.appE('Q', [a, b]), Pp = (t) => G.appE('P', [t]), Rp = (t) => G.appE('R', [t]), Sp = (t) => G.appE('S', [t]);
const EE = (n, b) => G.EXISTS({ name: n, sort: OMEGA }, b);
const fa = (n, b) => G.FORALL({ name: n, sort: OMEGA }, b), bO = G.varE('b', OMEGA), Qu = (t) => G.appE('Q', [t]);
const SET = G.SET, sv = (n) => G.varE(n, SET), Mem = (a, b) => G.appE('MEM', [a, b]);
const beta = G.varE('β', OMEGA), gamma = G.varE('γ', OMEGA), Eq = (a, b) => G.appE('EQ', [a, b]);
const M = 'M', mc = G.appE('c', []), mf = (a) => G.appE('f', [a]), mstar = (a, b) => G.appE('star', [a, b]);
const GRP = 'G', g1 = G.appE('one', []), gmul = (a, b) => G.appE('mul', [a, b]), ginv = (a) => G.appE('inv', [a]);
const ga = G.varE('α', GRP), gb = G.varE('β', GRP);
const mv = (n) => G.varE(n, M), Pm = (a) => G.appE('P', [a]), Qm = (a, b) => G.appE('Q', [a, b]);
const faS = (n, s, b) => G.FORALL({ name: n, sort: s }, b);
const NAT = 'Nat', nz = G.appE('nzero', []), nsuc = (a) => G.appE('succ', [a]), nadd = (a, b) => G.appE('add', [a, b]);
const nv = (n) => G.varE(n, NAT);

// solution = a sequence of moves; s.c(recipe,…inputs)/s.a(formula)/s.d(name,level) each return the new binding name
function solver(exId) {
  const s = { env: G.newEnv(G.EX_BY_ID[exId]) };
  s.c = (r, ...ins) => { const res = G.craft(s.env, r, ins); if (!res.ok) throw new Error(exId + ' craft ' + r + ': ' + res.error); s.env = res.env; return res.binding.name; };
  s.a = (f) => { s.env = G.openAssumption(s.env, f); return s.env.assumption.name; };
  s.d = (n, k) => { const res = G.discharge(s.env, n, k); if (!res.ok) throw new Error(exId + ' discharge: ' + res.error); s.env = res.env; return res.binding.name; };
  s.n = (pos, neg) => { const res = G.notIntro(s.env, pos, neg); if (!res.ok) throw new Error(exId + ' notIntro: ' + res.error); s.env = res.env; return res.binding.name; };
  s.v = (name, sort) => { s.env = G.openVariable(s.env, { name: name, sort: sort || OMEGA }); return name; };
  s.obtain = (existName, varName) => { const res = G.obtain(s.env, existName, varName); if (!res.ok) throw new Error(exId + ' obtain: ' + res.error); s.env = res.env; return res.binding.name; };
  s.pick = (varName) => { const res = G.pick(s.env, varName, OMEGA); if (!res.ok) throw new Error(exId + ' pick: ' + res.error); s.env = res.env; return varName; };
  s.ce = (r, target, ...ins) => { const res = G.craft(s.env, r, ins, target); if (!res.ok) throw new Error(exId + ' craft ' + r + ': ' + res.error); s.env = res.env; return res.binding.name; };
  s.ab = (levels) => { const res = G.abandon(s.env, levels); if (!res.ok) throw new Error(exId + ' abandon: ' + res.error); s.env = res.env; return null; };   // back out of a sub-proof, discarding it
  return s;
}
// Both commutativity laws have identical shape, so they share one script: unfold `x ∈ a op b` on each side
// with the membership axiom, bridge the two bodies with the propositional symmetry lemma (an implication in
// both directions makes the ↔), chain the three biconditionals, then apply extensionality.
// A RECORD in all four of chapter 18's laws (Kantian, 2026-11-24), and one idea: `mem_union x` is
// `∀ a, ∀ b, (x ∈ a ∪ b ↔ …)`, so the several unfoldings a law needs are instantiations of ONE
// partly-instantiated potion, not independent walks down the same axiom from the top. That is why no
// script here uses an `inst3` any more: it costs a move a law in the commutativity pair (17 → 16) and
// four in the associativity and distributivity ones.
function setLaw(s, memAx, symmLemma, op) {
  const SET = G.SET, sv2 = (n) => G.varE(n, SET), mem = (x, a) => G.appE('MEM', [x, a]);
  const a = sv2('a'), b = sv2('b'), x = sv2('x');
  const at = (h, t) => s.c('universal_instantiation', h, F(t));
  s.v('x', SET);
  const m = at(memAx, x);                                 // ∀ a, ∀ b, (x ∈ a op b ↔ …)
  const e1 = at(at(m, a), b);                             // x ∈ a op b  ↔  (x∈a ⋆ x∈b)
  const e2 = at(at(m, b), a);                             // x ∈ b op a  ↔  (x∈b ⋆ x∈a)
  const i1 = s.c(symmLemma, F(mem(x, a)), F(mem(x, b)));  // (x∈a ⋆ x∈b) → (x∈b ⋆ x∈a)
  const i2 = s.c(symmLemma, F(mem(x, b)), F(mem(x, a)));  // and back
  const bridge = s.c('Iff.intro', i1, i2);
  const t1 = s.c("Iff.trans'", e1, bridge);               // x ∈ a op b ↔ (x∈b ⋆ x∈a)
  const t2 = s.c("Iff.trans'", t1, s.c("Iff.symm'", e2)); // … ↔ x ∈ b op a
  const all = s.d(t2, 1);                                 // ∀ x, (x ∈ a op b ↔ x ∈ b op a)
  const extAt = s.c('universal_instantiation', s.c('universal_instantiation', 'ext', F(op(a, b))), F(op(b, a)));
  s.c('modus_ponens', extAt, all);
}
// Associativity has one shape for both operations: unfold the nested operand on each side, re-associate with
// the Chapter 2/9 lemma, and use the left/right congruences to reach into whichever operand was unfolded.
function assocLaw(s, memAx, congrL, congrR, assocL, assocR, op) {
  const SET = G.SET, sv2 = (n) => G.varE(n, SET), mem = (x, a) => G.appE('MEM', [x, a]);
  const a = sv2('a'), b = sv2('b'), c = sv2('c'), x = sv2('x');
  const at = (h, t) => s.c('universal_instantiation', h, F(t));
  s.v('x', SET);
  const m = at(memAx, x), mA = at(m, a);
  const u2 = at(mA, b);                                   // x ∈ a op b      ↔ (x∈a ⋆ x∈b)
  const u3 = at(mA, op(b, c));                            // x ∈ a op (b op c) ↔ (x∈a ⋆ x∈ b op c)
  const u1 = at(at(m, op(a, b)), c);                      // x ∈ (a op b) op c ↔ (x∈ a op b ⋆ x∈c)
  const u4 = at(at(m, b), c);                             // x ∈ b op c      ↔ (x∈b ⋆ x∈c)
  const h = s.a(mem(x, op(op(a, b), c)));
  const p2 = s.c(congrL, s.c('Iff.mp', u1, h), u2);
  const p4 = s.c(congrR, s.c(assocL, p2), s.c("Iff.symm'", u4));
  const fwd = s.d(s.c('Iff.mpr', u3, p4), 1);
  const h2 = s.a(mem(x, op(a, op(b, c))));
  const q2 = s.c(congrR, s.c('Iff.mp', u3, h2), u4);
  const q4 = s.c(congrL, s.c(assocR, q2), s.c("Iff.symm'", u2));
  const bwd = s.d(s.c('Iff.mpr', u1, q4), 1);
  const all = s.d(s.c('Iff.intro', fwd, bwd), 1);
  s.c('modus_ponens', s.c('universal_instantiation', s.c('universal_instantiation', 'ext', F(op(op(a, b), c))), F(op(a, op(b, c)))), all);
}
// And the two distributive laws are the same proof as each other, which nothing in the file said until
// Kantian sent both of them in the same shape. `out` distributes over `in`; the congruences reach into
// whichever side was unfolded; `distrib`/`distribRev` are the propositional law and its converse. No
// sub-proof unpacks a membership here — the congruences rewrite inside the connective instead, which is
// what takes 18.10 from 48 moves to 35.
function distribLaw(s, memOut, memIn, outCongrR, inCongrL, inCongrR, distrib, distribRev, out, inn) {
  const SET = G.SET, sv2 = (n) => G.varE(n, SET), mem = (x, a) => G.appE('MEM', [x, a]);
  const a = sv2('a'), b = sv2('b'), c = sv2('c'), x = sv2('x');
  const at = (h, t) => s.c('universal_instantiation', h, F(t));
  s.v('x', SET);
  const mo = at(memOut, x), mi = at(memIn, x), moA = at(mo, a);
  const oab = at(moA, b);                                 // x ∈ a out b        ↔ (x∈a ⊕ x∈b)
  const oac = at(moA, c);
  const oabc = at(moA, inn(b, c));                        // x ∈ a out (b in c) ↔ (x∈a ⊕ x∈ b in c)
  const ibc = at(at(mi, b), c);                           // x ∈ b in c        ↔ (x∈b ⊗ x∈c)
  const iR = at(at(mi, out(a, b)), out(a, c));            // the right-hand side, unfolded
  const h = s.a(mem(x, out(a, inn(b, c))));
  const p2 = s.c(outCongrR, s.c('Iff.mp', oabc, h), ibc); // x∈a ⊕ (x∈b ⊗ x∈c)
  const p3 = s.c(distrib, p2);                            // (x∈a ⊕ x∈b) ⊗ (x∈a ⊕ x∈c)
  const p5 = s.c(inCongrR, s.c(inCongrL, p3, s.c("Iff.symm'", oab)), s.c("Iff.symm'", oac));
  const fwd = s.d(s.c('Iff.mpr', iR, p5), 1);
  const h2 = s.a(mem(x, inn(out(a, b), out(a, c))));
  const q3 = s.c(inCongrR, s.c(inCongrL, s.c('Iff.mp', iR, h2), oab), oac);
  const q5 = s.c(outCongrR, s.c(distribRev, q3), s.c("Iff.symm'", ibc));
  const bwd = s.d(s.c('Iff.mpr', oabc, q5), 1);
  const all = s.d(s.c('Iff.intro', fwd, bwd), 1);
  const extAt = s.c('universal_instantiation', s.c('universal_instantiation', 'ext', F(out(a, inn(b, c)))), F(inn(out(a, b), out(a, c))));
  s.c('modus_ponens', extAt, all);
}
const SOL = {
  '1.1': s => { s.c('And.intro', s.c('And.intro', 'hA', 'hB'), 'hC'); },
  '1.2': s => { s.c('And.intro', 'hA', 'hA'); },
  '2.1': s => { const a = s.c('And.left', 'hAB'), b = s.c('And.right', 'hAB'); s.c('And.intro', b, a); },
  '2.2': s => { const ab = s.c('And.left', 'hABC'), c = s.c('And.right', 'hABC'), a = s.c('And.left', ab), b = s.c('And.right', ab); s.c('And.intro', a, s.c('And.intro', b, c)); },
  '2.3': s => {
    let h = s.c("And.comm'", 'hABC');
    h = s.c('And.assoc_left', h);
    h = s.c("And.comm'", h);
    h = s.c('And.assoc_left', h);
    s.c("And.comm'", h);
  },
  '3.1': s => { s.c('Or.inr', s.c('Or.inl', 'hA', F(B)), F(C)); },
  '3.2': s => { s.c('Or.inl', 'hA', F(A)); },
  '4.2': s => { s.a(A); s.d(s.c('And.intro', 'hA', 'hA'), 1); },
  '4.3': s => { s.c('Impl.idem', F(OR(AND(A, B), C))); },
  '4.1': s => { s.d(s.a(A), 1); },
  // 5.2 / 6.2: open two sub-proofs, then discharge straight through both levels at once
  '4.4': s => { s.a(B); s.d(s.a(A), 2); },
  '4.6': s => { s.a(A); s.a(B); s.d('hC', 2); },
  // 8.1: modus ponens, one craft
  '5.1': s => { s.c('modus_ponens', 'hAB', 'hA'); },
  '4.5': s => { const n = s.a(AND(A, OR(A, B))); s.d(s.c('And.left', n), 1); },
  '4.7': s => { s.a(A); s.a(B); s.d('hA', 2); },
  '5.2': s => { s.a(A); const b = s.c('modus_ponens', 'hAB', 'hA'); s.d(s.c('modus_ponens', 'hBC', b), 1); },
  '4.8': s => { const n = s.a(AND(A, B)); s.d(s.c("And.comm'", n), 1); },
  '5.3': s => { const n = s.a(AND(A, B)), a = s.c('And.left', n), b = s.c('And.right', n), bc = s.c('modus_ponens', 'hABC', a); s.d(s.c('modus_ponens', bc, b), 1); },
  '5.4': s => { s.a(A); s.a(B); const ab = s.c('And.intro', 'hA', 'hB'); s.d(s.c('modus_ponens', 'hABC', ab), 2); },
  '5.5': s => { s.a(B); s.a(A); const bc = s.c('modus_ponens', 'hABC', 'hA'); s.d(s.c('modus_ponens', bc, 'hB'), 2); },
  '5.6': s => { s.a(A); const b = s.c('modus_ponens', 'hAB', 'hA'); s.d(s.c('And.intro', 'hA', b), 1); },
  // A RECORD (3, was 4): no sub-proof at all — implies_and_self gives A → A ∧ B, And.symm' is the
  // flip as an implication, and implies_trans glues the two. Three minted lemmas, three moves.
  '5.7': s => {
    const aab = s.c('implies_and_self', 'hAB');     // A → A ∧ B
    const flip = s.c("And.symm'", F(A), F(B));      // (A ∧ B) → (B ∧ A)
    s.c('implies_trans', aab, flip);
  },
  '5.8': s => { const a = s.c('And.left', 'hAB'), c = s.c('modus_ponens', 'hAC', a); s.c('And.intro', c, s.c('And.right', 'hAB')); },
  // A RECORD (3, was 4): turn the conjunction round, improve the half that is now on the left with the
  // And.imp_left' just proved, and turn it back. A sandwich, and nothing is taken apart.
  '5.9': s => {
    const ba = s.c("And.comm'", 'hAB');             // B ∧ A
    const ca = s.c("And.imp_left'", ba, 'hBC');     // C ∧ A
    s.c("And.comm'", ca);
  },
  '6.1': s => { s.c('case_analysis', 'hAC', 'hBC'); },
  '6.2': s => { s.a(A); const p1 = s.c('Or.inr', 'hA', F(B)); const i1 = s.d(p1, 1); s.a(B); const p2 = s.c('Or.inl', 'hB', F(A)); const i2 = s.d(p2, 1); s.c('case_analysis', i1, i2); },
  // 9.2b Or.comm' = the hypothesis form of Or.symm' (9.2): instantiate that lemma, then modus ponens
  '6.3': s => { s.c('modus_ponens', s.c("Or.symm'", F(A), F(B)), 'hAB'); },
  '6.4': s => { const imp = s.c('case_analysis', 'hAC', 'hBC'); s.c('modus_ponens', imp, 'hAB'); },
  // 9.4 and 9.6 are 9.5 (Or.imp') with the other implication taken to be the identity (Impl.idem, 6.1a):
  // two crafts each, instead of the assume / case_analysis / modus_ponens chain they used to need.
  '6.6': s => { s.c("Or.imp'", 'hAB', 'hAC', s.c('Impl.idem', F(B))); },
  // A RECORD (9, was 10): the minted Or.elim' consumes the disjunction and both cases in ONE move, where
  // case_analysis builds an implication that then has to be applied. The same move is worth one brew in
  // every proof of this shape below — 6.10, 6.11, 6.12, 6.13, 10.5.
  '6.5': s => {
    s.a(A); const i1 = s.d(s.c('Or.inl', s.c('modus_ponens', 'hAC', 'hA'), F(D)), 1);
    s.a(B); const i2 = s.d(s.c('Or.inr', s.c('modus_ponens', 'hBD', 'hB'), F(C)), 1);
    s.c("Or.elim'", 'hAB', i1, i2);
  },
  '6.7': s => { s.c("Or.imp'", 'hAB', s.c('Impl.idem', F(A)), 'hBC'); },
  // A RECORD (9, was 13, and 14 before that): the A case need not be proved at all. `Or.mono_right'`
  // turns B → (B ∨ C) into (A ∨ B) → (A ∨ (B ∨ C)), which IS the left case of the given, carrying the
  // untouched A along with it — so one little sub-proof does the work of two and no case_analysis
  // appears. (This is the record the chapter was reordered for: Or.mono_right' is 6.16, and a par may
  // only lean on a lemma minted earlier in the list, so 6.15/6.16 moved up behind 6.7.)
  '6.8': s => {
    s.a(B); const iB = s.d(s.c('Or.inl', 'hB', F(C)), 1);                       // B → (B ∨ C)
    const left = s.c("Or.mono_right'", iB, F(A));                               // (A ∨ B) → (A ∨ (B ∨ C))
    s.a(C); const iC = s.d(s.c('Or.inr', s.c('Or.inr', 'hC', F(B)), F(A)), 1);  // C → (A ∨ (B ∨ C))
    s.c("Or.elim'", 'hABC', left, iC);
  },
  // 9.8 the cheap way, now that both Or.comm' (9.2b) and Or.assoc_left (9.7) are in hand:
  //   A ∨ (B ∨ C) → (B ∨ C) ∨ A → B ∨ (C ∨ A) → (C ∨ A) ∨ B → C ∨ (A ∨ B) → (A ∨ B) ∨ C
  // Five single-input crafts, instead of the dozen Or.inl/Or.inr/case_analysis moves it used to take.
  '6.9': s => {
    const x1 = s.c("Or.comm'", 'hABC');        // (B ∨ C) ∨ A
    const x2 = s.c('Or.assoc_left', x1);       // B ∨ (C ∨ A)
    const x3 = s.c("Or.comm'", x2);            // (C ∨ A) ∨ B
    const x4 = s.c('Or.assoc_left', x3);       // C ∨ (A ∨ B)
    s.c("Or.comm'", x4);                       // (A ∨ B) ∨ C
  },
  // A RECORD (9, was 13): do not case-analyse at all. Each half of the goal is the GIVEN disjunction with
  // its right-hand side improved — B ∧ C → B for one, B ∧ C → C for the other — and `Or.imp_right'` does
  // exactly that in one brew. Two little sub-proofs and a pairing, where the case split needed thirteen.
  '6.10': s => {
    const bc1 = s.a(AND(B, C));
    const iB = s.d(s.c('And.left', bc1), 1);              // (B ∧ C) → B
    const ab = s.c("Or.imp_right'", 'hABC', iB);          // A ∨ B
    const bc2 = s.a(AND(B, C));
    const iC = s.d(s.c('And.right', bc2), 1);             // (B ∧ C) → C
    const ac = s.c("Or.imp_right'", 'hABC', iC);          // A ∨ C
    s.c('And.intro', ab, ac);
  },
  // A RECORD (9, was 11): the two branch implications need not swing their results into the goal by hand
  // — `Or.imp'` takes the disjunction and BOTH implications and does it, so neither Or.inl nor Or.inr
  // appears in the proof at all.
  '6.11': s => {
    const ha = s.c('And.left', 'hABC');
    const hbc = s.c('And.right', 'hABC');
    s.a(B); const iB = s.d(s.c('And.intro', ha, 'hB'), 1);   // B → A ∧ B
    s.a(C); const iC = s.d(s.c('And.intro', ha, 'hC'), 1);   // C → A ∧ C
    s.c("Or.imp'", hbc, iB, iC);
  },
  // A RECORD (13, was 14): Or.elim' in place of case_analysis + modus ponens.
  '6.12': s => {
    const hab = s.a(AND(A, B));
    const p1 = s.c('And.intro', s.c('And.left', hab), s.c('Or.inl', s.c('And.right', hab), F(C)));
    const iAB = s.d(p1, 1);
    const hac = s.a(AND(A, C));
    const p2 = s.c('And.intro', s.c('And.left', hac), s.c('Or.inr', s.c('And.right', hac), F(B)));
    const iAC = s.d(p2, 1);
    s.c("Or.elim'", 'hABC', iAB, iAC);
  },
  // A RECORD (12, was 13, and 15 before that): the B case does not split A ∨ C a second time. Under B,
  // assume C as well and pair them, then discharge only the C level — what you hold is C → (B ∧ C), and
  // `Or.imp_right'` improves the A ∨ C already in hand with it. One assumption more, one case split less.
  '6.13': s => {
    const hab = s.c('And.left', 'hABC');                     // A ∨ B
    const hac = s.c('And.right', 'hABC');                    // A ∨ C
    s.a(A); const iA = s.d(s.c('Or.inl', 'hA', F(AND(B, C))), 1);   // A → (A ∨ (B ∧ C))
    const hb = s.a(B); s.a(C);
    const cbc = s.d(s.c('And.intro', hb, 'hC'), 1);          // C → (B ∧ C)
    const iB = s.d(s.c("Or.imp_right'", hac, cbc), 1);       // B → (A ∨ (B ∧ C))
    s.c("Or.elim'", hab, iA, iB);
  },
  '7.1': s => { s.c('Iff.mp', 'hAB', 'hA'); },
  '7.2': s => { s.a(B); const a = s.c('Iff.mpr', 'hAB', 'hB'); const iBA = s.d(a, 1); s.a(A); const b = s.c('Iff.mp', 'hAB', 'hA'); const iAB = s.d(b, 1); s.c('Iff.intro', iBA, iAB); },
  '7.3': s => { s.a(A); const b1 = s.c('Iff.mp', 'hAB', 'hA'); const c1 = s.c('Iff.mp', 'hBC', b1); const iAC = s.d(c1, 1); s.a(C); const b2 = s.c('Iff.mpr', 'hBC', 'hC'); const a2 = s.c('Iff.mpr', 'hAB', b2); const iCA = s.d(a2, 1); s.c('Iff.intro', iAC, iCA); },
  '7.4': s => { const i = s.c('Impl.idem', F(A)); s.c('Iff.intro', i, i); },
  '7.5': s => { const a = s.c('And.left', 'hAB'); const c = s.c('Iff.mp', 'hAC', a); const b = s.c('And.right', 'hAB'); s.c('And.intro', c, b); },
  '7.6': s => {
    const a = s.a(A);
    const c = s.c('Iff.mp', 'hAC', a);
    const imp = s.d(c, 1);
    s.c("Or.imp_left'", 'hAB', imp);
  },
  '7.7': s => { s.a(C); const a = s.c('Iff.mpr', 'hAC', 'hC'); const b = s.c('modus_ponens', 'hAB', a); s.d(b, 1); },
  '8.1': s => { const a = s.c('And.left', 'hAnA'); const na = s.c('And.right', 'hAnA'); s.c('absurd', a, na, F(B)); },
  '8.2': s => { const na = s.c('And.left', 'hnAA'); const a = s.c('And.right', 'hnAA'); s.c('absurd', a, na, F(B)); },
  '9.1': s => { s.c('Classical.em', F(A)); },
  '8.3': s => { const hna = s.a(NOT(A)); s.n('hA', hna); },
  // A RECORD (5, was 6): no sub-proof and no `absurd`. Excluded middle gives A ∨ ¬ A, turned round to
  // ¬ A ∨ A; the given ¬ ¬ A, weakened to ¬ ¬ A ∨ A, is the clause that resolves against it; and
  // `resolution'` cancels the ¬ A against the ¬ ¬ A, leaving A ∨ A.
  '9.2': s => {
    const em = s.c('Classical.em', F(A));                 // A ∨ ¬ A
    const flip = s.c("Or.comm'", em);                     // ¬ A ∨ A
    const nn = s.c('Or.inl', 'hnnA', F(A));               // ¬ ¬ A ∨ A
    s.c("or_self_elim'", s.c("resolution'", flip, nn));
  },
  '8.4': s => { const hnb = s.a(NOT(B)); const ha = s.a(A); const hb = s.c('modus_ponens', 'hAB', ha); const nA = s.n(hb, hnb); s.d(nA, 1); },
  '8.5': s => { const ha = s.a(A); const c = s.c('modus_ponens', 'hAcon', ha); s.n(s.c('And.left', c), s.c('And.right', c)); },
  '8.6': s => { const ha = s.a(A); s.n(s.c('modus_ponens', 'hAB', ha), s.c('modus_ponens', 'hAnB', ha)); },
  '9.3': s => { const em = s.c('Classical.em', F(A)); s.c("Or.elim'", em, 'hAB', 'hnAB'); },
  '9.4': s => { const hna = s.a(NOT(A)); const c = s.c('modus_ponens', 'hnAcon', hna); const nn = s.n(s.c('And.left', c), s.c('And.right', c)); s.c('not_not_elim', nn); },
  '9.5': s => { const hna = s.a(NOT(A)); const c = s.c('modus_ponens', 'hnAcon', hna); const nn = s.n(s.c('And.right', c), s.c('And.left', c)); s.c('not_not_elim', nn); },
  // De Morgan. 12.10: negate each disjunct separately by reductio against ¬(A ∨ B), then pair them up.
  '8.7': s => {
    const na = s.n(s.c('Or.inl', s.a(A), F(B)), 'hnAB');
    const nb = s.n(s.c('Or.inr', s.a(B), F(A)), 'hnAB');
    s.c('And.intro', na, nb);
  },
  // 12.11: assume A ∨ B, case-analyse it down to B (the A case goes through `absurd`), then contradict ¬B.
  '8.8': s => {
    const nA = s.c('And.left', 'hnAnB'), nB = s.c('And.right', 'hnAnB');
    const hab = s.a(OR(A, B));
    const b = s.a(B);
    const a = s.c('absurd', b, nB, F(A));
    const imp = s.d(a, 1);
    const aa = s.c("Or.imp_right'", hab, imp);
    const got = s.c("or_self_elim'", aa);
    s.n(got, nA);
  },
  // 12.12. A RECORD (6, was 8, and 9 before that): read A → ¬ B straight off the given with
  // imp_of_not_or', then assume A ∧ B and improve its left half along that implication — which leaves
  // (¬ B) ∧ B, a contradiction sitting in one potion. (The other record the reorder was for: that lemma
  // is 8.10, which now sits in front of this level.)
  '8.9': s => {
    const imp = s.c("imp_of_not_or'", 'hnAonB');          // A → ¬ B
    const hab = s.a(AND(A, B));
    const bb = s.c("And.imp_left'", hab, imp);            // (¬ B) ∧ B
    s.n(s.c('And.right', bb), s.c('And.left', bb));
  },
  // 12.13 (classical): split on A via the minted by_cases'. If A holds, ¬B follows by reductio against ¬(A ∧ B).
  // 10.8: assume the left side, push it through the ↔, discharge — the implication inside a ↔
  '7.8': s => { s.d(s.c('Iff.mp', 'hiff', s.a(A)), 1); },
  // 10.9-10.11 (QED 10.1c/e/g): second-slot congruences = monotonicity lemma + the ↔ turned into an implication
  '7.9': s => { s.c("And.imp_right'", 'hAB', s.c("Iff.imp'", 'hBC')); },
  '7.10': s => { s.c("Or.imp_right'", 'hAB', s.c("Iff.imp'", 'hBC')); },
  '7.11': s => { s.c('implies_trans', 'hAB', s.c("Iff.imp'", 'hBC')); },
  // 10.12-10.14 (QED 10.3/10.4/10.5): Iff.intro bare, then glued onto already-minted lemmas
  '7.12': s => { s.c('Iff.intro', 'hAB', 'hBA'); },
  // A RECORD (6, was 7): Impl.idem states A → A for free, and case_analysis takes it as BOTH cases of
  // A ∨ A → A — so the backwards half needs no sub-proof of its own.
  '7.13': s => {
    const i1 = s.d(s.c('Or.idem', s.a(A)), 1);      // A → A ∨ A
    const idem = s.c('Impl.idem', F(A));
    s.c('Iff.intro', i1, s.c('case_analysis', idem, idem));
  },
  '7.14': s => {
    const i1 = s.d(s.c('And.assoc_left', s.a(AND(AND(A, B), C))), 1);
    const i2 = s.d(s.c('And.assoc_right', s.a(AND(A, AND(B, C)))), 1);
    s.c('Iff.intro', i1, i2);
  },
  // 9.13 (QED 9.1b): both branches of A ∨ A prove A, so Or.elim' takes the identity implication twice
  '6.14': s => { const i = s.c('Impl.idem', F(A)); s.c("Or.elim'", 'hAA', i, i); },
  // 9.14-9.17 (QED 9.5a-d): the implication form of a hypothesis-form lemma — assume, apply, discharge
  '5.10': s => { s.d(s.c("And.imp_left'", s.a(AND(A, C)), 'hAB'), 1); },
  '6.15': s => { s.d(s.c("Or.imp_left'", s.a(OR(A, C)), 'hAB'), 1); },
  '5.11': s => { s.d(s.c("And.imp_right'", s.a(AND(C, A)), 'hAB'), 1); },
  '6.16': s => { s.d(s.c("Or.imp_right'", s.a(OR(C, A)), 'hAB'), 1); },
  // 12.14: classical split on A. If A holds, modus ponens gives B; if not, ¬A is the left disjunct.
  '9.7': s => {
    const em = s.c('Classical.em', F(A));
    const bna = s.c("Or.imp_left'", em, 'hAB');
    s.c("Or.comm'", bna);
  },
  // 12.15: assume A, then eliminate the disjunction — the ¬A branch is absurd, the B branch is immediate.
  '8.10': s => {
    const ha = s.a(A);
    const i1 = s.d(s.c('absurd', ha, s.a(NOT(A)), F(B)), 1);   // ¬A → B
    const i2 = s.c('Impl.idem', F(B));                          // B → B
    s.d(s.c("Or.elim'", 'hnAB', i1, i2), 1);
  },
  // 12.16: glue the two halves just minted
  '9.8': s => {
    const i1 = s.d(s.c("not_or_of_imp'", s.a(IMPLIES(A, B))), 1);
    const i2 = s.d(s.c("imp_of_not_or'", s.a(OR(NOT(A), B))), 1);
    s.c('Iff.intro', i1, i2);
  },
  // 12.17-12.19: corollaries of mt' (12.4)
  '8.11': s => { s.c('modus_ponens', s.c("mt'", 'hAB'), 'hnB'); },
  '8.12': s => { s.n(s.c('Iff.mpr', 'hiff', s.a(B)), 'hnA'); },
  '8.13': s => { const nn = s.c("not_not_intro'", 'hB'); s.c("mt_apply'", 'hAnB', nn); },
  // 12.20: the two halves of double negation, already minted as 12.2 and 12.3
  '9.9': s => {
    const i1 = s.d(s.c("not_not_intro'", s.a(A)), 1);
    const i2 = s.d(s.c('not_not_elim', s.a(NOT(NOT(A)))), 1);
    s.c('Iff.intro', i1, i2);
  },
  // 12.21 Peirce. A RECORD (6, was 8): suppose ¬A. Then the hypothesis cannot take an A → B (mt_apply'),
  // and yet ¬A hands you one (imp_of_not_or' on (¬A) ∨ B) — so ¬¬A, and A. A reductio, not a case split.
  '9.10': s => {
    const hna = s.a(NOT(A));
    const nimp = s.c("mt_apply'", 'hPA', hna);                            // ¬(A → B)
    const imp = s.c("imp_of_not_or'", s.c('Or.inl', hna, F(B)));          // A → B
    s.c('not_not_elim', s.n(imp, nimp));
  },
  // 12.22 resolution: ¬A ∨ C is really A → C (12.15), and then it is just Or.imp_left' (9.4)
  '8.14': s => { s.c("Or.imp_left'", 'hAB', s.c("imp_of_not_or'", 'hnAC')); },
  // A RECORD (7, was 10): one reductio gives B → ¬A, and then excluded middle on B is MAPPED through it
  // by Or.imp_left' rather than split on — so the ¬B case needs no sub-proof of its own.
  '9.6': s => {
    const hb = s.a(B), ha = s.a(A);
    const nA = s.n(s.c('And.intro', ha, hb), 'hnAB');     // inside B: ¬A, against the given ¬(A ∧ B)
    const iBA = s.d(nA, 1);                               // B → ¬A
    s.c("Or.imp_left'", s.c('Classical.em', F(B)), iBA);  // (B ∨ ¬B) becomes (¬A) ∨ (¬B)
  },
  '10.1': s => { const t = s.c('True.intro'); s.c('Or.inl', t, F(A)); },
  '10.2': s => { const f = s.a(FALSE()); const a = s.c('False.elim', f, F(A)); s.d(a, 1); },
  '10.3': s => { s.a(A); const t = s.c('True.intro'); s.d(t, 1); },
  '10.4': s => {
    const ha = s.a(A); const t = s.c('True.intro'); const ta = s.c('And.intro', t, ha); const iF = s.d(ta, 1);
    const hta = s.a(AND(TRUE(), A)); const a = s.c('And.right', hta); const iB = s.d(a, 1);
    s.c('Iff.intro', iF, iB);
  },
  // A RECORD (11, was 13): the A → A half comes from the minted Impl.idem rather than from assuming A and
  // discharging it, and Or.elim' consumes the disjunction directly instead of case_analysis + modus ponens.
  // A RECORD (9, was 11, and 13 before that): case_analysis builds (False ∨ A) → A directly out of the
  // two branch implications, so the backwards half never assumes False ∨ A — two moves saved over
  // assuming it and discharging. Impl.idem still supplies the A branch for nothing.
  '10.5': s => {
    const iF = s.d(s.c('Or.inr', s.a(A), F(FALSE())), 1);                          // A → False ∨ A
    const hf = s.a(FALSE());
    const iFalse = s.d(s.c('False.elim', hf, F(A)), 1);                            // False → A
    s.c('Iff.intro', iF, s.c('case_analysis', iFalse, s.c('Impl.idem', F(A))));
  },
  '8.15': s => {
    const na = s.a(NOT(A));
    const a1 = s.a(A);
    const f1 = s.c('absurd', a1, na, F(FALSE()));
    const fwd = s.d(f1, 2);
    const af = s.a(IMPLIES(A, FALSE()));
    const a2 = s.a(A);
    const f2 = s.c('modus_ponens', af, a2);
    const nn = s.n(f2, null);
    const bwd = s.d(nn, 1);
    s.c('Iff.intro', fwd, bwd);
  },
  // 13.7: the reductio closes on a direct proof of False (the one-argument form of notIntro)
  '8.16': s => { const h = s.a(AND(FALSE(), A)); s.n(s.c('And.left', h)); },
  // 13.8: True is the unit of implication — one direction is a vacuous discharge, the other feeds True.intro
  '10.6': s => {
    s.a(A); const i1 = s.d(s.a(TRUE()) && 'hA', 2);
    const h = s.a(IMPLIES(TRUE(), A));
    const i2 = s.d(s.c('modus_ponens', h, s.c('True.intro')), 1);
    s.c('Iff.intro', i1, i2);
  },
  // 16.2: introduce both variables, then excluded middle on Q(x, y), then discharge through both
  '11.3': s => { s.v('x'); s.v('y'); s.d(s.c('Classical.em', F(Q(xO, yO))), 2); },
  // 18.7: a hypothesis not mentioning X crosses the ∀ in both directions.
  // A RECORD (13, was 16): each half closes its three open levels — the variable, the assumption A, and
  // the hypothesis — with ONE discharge, where the old script stepped out of them one at a time.
  '12.7': s => {
    const h1 = s.a(fa('X', IMPLIES(A, Pp(X))));
    const hA = s.a(A);
    s.v('X');
    const i1 = s.d(s.c('modus_ponens', s.c('universal_instantiation', h1, F(X)), hA), 3);
    const h2 = s.a(IMPLIES(A, fa('X', Pp(X))));
    s.v('X');
    const hA2 = s.a(A);
    const i2 = s.d(s.c('universal_instantiation', s.c('modus_ponens', h2, hA2), F(X)), 3);
    s.c('Iff.intro', i2, i1);   // the goal states the →∀ side first
  },
  '11.2': s => { s.v('x'); s.v('y'); const hq = s.a(Q(xO, yO)); s.d(hq, 3); },
  '11.1': s => { s.v('X'); const h = s.a(Pp(X)); s.d(h, 2); },
  // A RECORD (1, was 2): no need to assume the antecedent and discharge it — Impl.idem IS this statement,
  // at the formula (∀ X, ∀ Y, Q(X, Y)). A minted lemma applies to a compound formula as readily as to an atom.
  '11.4': s => { s.c('Impl.idem', F(fa('X', fa('Y', Q(X, Y))))); },
  '12.1': s => { s.v('X'); const i1 = s.c('universal_instantiation', 'hpr', F(X)); const i2 = s.c('universal_instantiation', 'hp', F(X)); const r = s.c('modus_ponens', i1, i2); s.d(r, 1); },
  '11.5': s => { s.v('X'); s.d('hA', 1); },
  '12.3': s => {
    s.v('X');
    const sp = s.c('universal_instantiation', 'hsp', F(X));
    const pr = s.c('universal_instantiation', 'hpr', F(X));
    const sr = s.c('implies_trans', sp, pr);
    s.d(sr, 1);
  },
  '12.4': s => { s.v('Y'); s.v('X'); const i1 = s.c('universal_instantiation', 'h', F(X)); const i2 = s.c('universal_instantiation', i1, F(Y)); s.d(i2, 2); },
  '12.2': s => { const i = s.c('universal_instantiation', 'hPQ', F(alpha)); s.c('modus_ponens', i, 'hP'); },
  '12.5': s => {
    s.v('X'); const pq1 = s.c('universal_instantiation', 'h', F(X)); const iP = s.d(s.c('And.left', pq1), 1);
    s.v('X'); const pq2 = s.c('universal_instantiation', 'h', F(X)); const iQ = s.d(s.c('And.right', pq2), 1);
    s.c('And.intro', iP, iQ);
  },
  '12.6': s => {
    const hp = s.c('And.left', 'h'); const hq = s.c('And.right', 'h');
    s.v('X'); const pX = s.c('universal_instantiation', hp, F(X)); const qX = s.c('universal_instantiation', hq, F(X));
    s.d(s.c('And.intro', pX, qX), 1);
  },
  // Chapter 19 — ∃-elimination via obtain (non-destructive: the ∃ survives)
  '13.1': s => { const ha = s.obtain('hex', 'a'); const imp = s.c('universal_instantiation', 'hpc', F(aO)); s.c('modus_ponens', imp, ha); },
  '13.2': s => { const ha = s.obtain('hex', 'a'); const na = s.c('universal_instantiation', 'hnp', F(aO)); s.c('absurd', ha, na, F(C)); },
  '13.3': s => { const hpq = s.obtain('hex', 'a'); const hp = s.c('And.left', hpq); const imp = s.c('universal_instantiation', 'hpc', F(aO)); s.c('modus_ponens', imp, hp); },
  // Chapter 21 — pick an arbitrary inhabitant of the nonempty sort, then instantiate the (constant-body) ∀
  '14.1': s => { s.pick('a'); s.c('universal_instantiation', 'hA', F(aO)); },
  // Chapter 22 — existential introduction (the player picks the specific abstraction)
  '15.1': s => { s.ce('Exists.intro', EE('x', Pp(xO)), 'hP', F(alpha)); },
  '15.2': s => { s.pick('a'); const pa = s.c('universal_instantiation', 'h', F(aO)); s.ce('Exists.intro', EE('x', Pp(xO)), pa, F(aO)); },
  '15.3': s => { s.ce('Exists.intro', EE('x', Q(xO, xO)), 'hQ', F(alpha)); },
  // 22.4 (QED 22.1): And.intro then ∃-intro into the conjunction (pick the Q(α,x)∧Q(x,α) abstraction)
  '15.4': s => { const c = s.c('And.intro', 'hQ', 'hQ'); s.ce('Exists.intro', EE('X', AND(Q(alpha, X), Q(X, alpha))), c, F(alpha)); },
  // 22.5a (QED 22.3a): ¬∃X,P X ↔ ∀X,¬P X
  '15.5': s => {
    const hne = s.a(NOT(EE('X', Pp(X))));
    s.v('X'); const hp = s.a(Pp(X));
    const ex = s.ce('Exists.intro', EE('x', Pp(xO)), hp, F(X));
    const iFwd = s.d(s.n(ex, hne), 2);
    const hfa = s.a(fa('X', NOT(Pp(X))));
    const back = s.c('forall_not_not_exists', hfa);
    const iBwd = s.d(back, 1);
    s.c('Iff.intro', iFwd, iBwd);
  },
  // 22.6a (QED 22.4a): ¬∃X,(P∧Q), ∀X,(R→P) ⊢ ¬∃X,(R∧Q)
  '15.6': s => {
    const hex = s.a(EE('X', AND(Rp(X), Qu(X))));
    const rq = s.obtain(hex, 'b');
    const rp = s.c('universal_instantiation', 'hRP', F(bO));
    const pq = s.c("And.imp_left'", rq, rp);
    const ex = s.ce('Exists.intro', EE('x', AND(Pp(xO), Qu(xO))), pq, F(bO));
    s.n(ex, 'hnpq');
  },
  // 22.6b (QED 22.4b): ∀X,(P→Q), ∃X,(R∧P) ⊢ ∃X,(R∧Q)
  '15.7': s => {
    const rp = s.obtain('hex', 'b');
    const pq = s.c('universal_instantiation', 'hPQ', F(bO));
    const rq = s.c("And.imp_right'", rp, pq);
    s.ce('Exists.intro', EE('X', AND(Rp(X), Qu(X))), rq, F(bO));
  },
  // 22.8a (QED 22.6a): ∃Y∃X,Q(X,Y) ⊢ ∃X∃Y,Q(X,Y)
  '15.11': s => {
    const hy = s.obtain('h', 'b'); const hx = s.obtain(hy, 'a');
    const ey = s.ce('Exists.intro', EE('y', Q(aO, yO)), hx, F(bO));
    s.ce('Exists.intro', EE('X', EE('Y', Q(X, Y))), ey, F(aO));
  },
  // 22.8b (QED 22.6b): ∃Y∀X,Q(X,Y) ⊢ ∀X∃Y,Q(X,Y)
  '15.12': s => {
    const hfa = s.obtain('h', 'b'); s.v('X');
    const qxb = s.c('universal_instantiation', hfa, F(X));
    s.d(s.ce('Exists.intro', EE('Y', Q(X, Y)), qxb, F(bO)), 1);
  },
  // 22.6c (QED 22.4c): ∃(R∧¬Q) — the ¬Q b proved by an inner reductio against ¬∃(P∧Q)
  '15.8': s => {
    const rp = s.obtain('hex', 'b'); const rb = s.c('And.left', rp); const pb = s.c('And.right', rp);
    const hq = s.a(Qu(bO));
    const ex = s.ce('Exists.intro', EE('x', AND(Pp(xO), Qu(xO))), s.c('And.intro', pb, hq), F(bO));
    const nQb = s.n(ex, 'hnpq');
    s.ce('Exists.intro', EE('X', AND(Rp(X), NOT(Qu(X)))), s.c('And.intro', rb, nQb), F(bO));
  },
  // 22.7a (QED 22.5a): ∀(P→Q),∀(Q→R),∃P ⊢ ∃(P∧R)
  '15.9': s => {
    const pb = s.obtain('hex', 'b');
    const qb = s.c('modus_ponens', s.c('universal_instantiation', 'hPQ', F(bO)), pb);
    const rb = s.c('modus_ponens', s.c('universal_instantiation', 'hQR', F(bO)), qb);
    s.ce('Exists.intro', EE('X', AND(Pp(X), Rp(X))), s.c('And.intro', pb, rb), F(bO));
  },
  // 22.6d (QED 22.4d): the witness carries ¬Q, and mt' (12.4) turns P→Q into ¬Q→¬P right there
  '15.15': s => {
    const rq = s.obtain('hex', 'b');
    const pq = s.c('universal_instantiation', 'hPQ', F(bO));
    const nqnp = s.c("mt'", pq);
    const rnp = s.c("And.imp_right'", rq, nqnp);
    s.ce('Exists.intro', EE('X', AND(Rp(X), NOT(Pp(X)))), rnp, F(bO));
  },
  // 22.6e (QED 22.4e)
  '15.16': s => {
    const pq = s.obtain('hex', 'b');
    const pr = s.c('universal_instantiation', 'hPR', F(bO));
    const rq = s.c("And.imp_left'", pq, pr);
    s.ce('Exists.intro', EE('X', AND(Rp(X), NOT(Qu(X)))), rq, F(bO));
  },
  // 22.7b-d (QED 22.5b-d): the negated component comes from an inner reductio against the ¬∃ hypothesis
  // A RECORD (8, was 9): `barbara` instead of universal_instantiation + modus ponens.
  '15.17': s => {
    const rb = s.obtain('hex', 'b');
    const pb = s.c('barbara', F(bO), 'hRP', rb);
    const qb = s.a(Qu(bO));
    const ex = s.ce('Exists.intro', EE('X', AND(Pp(X), Qu(X))), s.c('And.intro', pb, qb), F(bO));
    const nqb = s.n(ex, 'hnpq');
    s.ce('Exists.intro', EE('X', AND(Rp(X), NOT(Qu(X)))), s.c('And.intro', rb, nqb), F(bO));
  },
  // A RECORD (8, was 9): `barbara` instead of universal_instantiation + modus ponens.
  '15.18': s => {
    const rb = s.obtain('hex', 'b');
    const pb = s.a(Pp(bO));
    const qb = s.c('barbara', F(bO), 'hPQ', pb);
    const ex = s.ce('Exists.intro', EE('X', AND(Rp(X), Qu(X))), s.c('And.intro', rb, qb), F(bO));
    const npb = s.n(ex, 'hnrq');
    s.ce('Exists.intro', EE('X', AND(Rp(X), NOT(Pp(X)))), s.c('And.intro', rb, npb), F(bO));
  },
  // A RECORD (8, was 9): `barbara` instead of universal_instantiation + modus ponens.
  '15.19': s => {
    const pb = s.obtain('hex', 'b');
    const rb = s.c('barbara', F(bO), 'hPR', pb);
    const qb = s.a(Qu(bO));
    const ex = s.ce('Exists.intro', EE('X', AND(Pp(X), Qu(X))), s.c('And.intro', pb, qb), F(bO));
    const nqb = s.n(ex, 'hnpq');
    s.ce('Exists.intro', EE('X', AND(Rp(X), NOT(Qu(X)))), s.c('And.intro', rb, nqb), F(bO));
  },
  // 22.7e (QED 22.5e): both components come straight off the same witness
  // A RECORD (5, was 7): `barbara` twice, and the witness is the same variable both times.
  '15.20': s => {
    const pb = s.obtain('hex', 'b');
    const qb = s.c('barbara', F(bO), 'hPQ', pb);
    const rb = s.c('barbara', F(bO), 'hPR', pb);
    s.ce('Exists.intro', EE('X', AND(Rp(X), Qu(X))), s.c('And.intro', rb, qb), F(bO));
  },
  // 22.9 (QED 22.7): merge two independent ∃ into a nested one, and split back
  '15.21': s => {
    const h = s.a(AND(EE('X', Pp(X)), EE('Y', Qu(Y))));
    const pa = s.obtain(s.c('And.left', h), 'a');
    const qb = s.obtain(s.c('And.right', h), 'b');
    const inner = s.ce('Exists.intro', EE('y', AND(Pp(aO), Qu(yO))), s.c('And.intro', pa, qb), F(bO));
    const i1 = s.d(s.ce('Exists.intro', EE('x', EE('y', AND(Pp(xO), Qu(yO)))), inner, F(aO)), 1);
    const h2 = s.a(EE('X', EE('Y', AND(Pp(X), Qu(Y)))));
    const c2 = G.varE('c', OMEGA), d2 = G.varE('d', OMEGA);
    const pq = s.obtain(s.obtain(h2, 'c'), 'd');
    const ep = s.ce('Exists.intro', EE('X', Pp(X)), s.c('And.left', pq), F(c2));
    const eq = s.ce('Exists.intro', EE('Y', Qu(Y)), s.c('And.right', pq), F(d2));
    const i2 = s.d(s.c('And.intro', ep, eq), 1);
    s.c('Iff.intro', i1, i2);
  },
  // 23.1: the notation drill — introduce both variables, assume `Y ∈ X`, discharge through all three levels
  '16.1': s => { s.v('X', SET); s.v('Y', SET); s.d(s.a(Mem(sv('Y'), sv('X'))), 3); },
  // 27.3 Russell: unearth the set r, specialise its defining property AT r, and the biconditional
  // `r ∈ r ↔ ¬(r ∈ r)` contradicts itself — reductio gives ¬(r ∈ r), which then yields r ∈ r.
  '16.2': s => {
    const hr = s.obtain('hR', 'r');
    const h2 = s.c('universal_instantiation', hr, F(sv('r')));
    const hm = s.a(Mem(sv('r'), sv('r')));
    const neg = s.n(hm, s.c('Iff.mp', h2, hm));
    s.c('absurd', s.c('Iff.mpr', h2, neg), neg, F(G.FALSE()));
  },
  // ---- Chapter 23, operations: building terms and putting them where a variable goes ----
  '17.1': s => { s.v('x', M); s.d(s.a(Pm(mf(mv('x')))), 2); },
  '17.2': s => { s.c('universal_instantiation', 'h', F(mc)); },
  '17.3': s => { s.c('universal_instantiation', 'h', F(mstar(mf(mc), mc))); },
  // 23.6: Q(f c, f c) abstracts three ways over the compound witness f c — the target picks one
  '17.4': s => { s.ce('Exists.intro', G.EXISTS({ name: 'x', sort: M }, Qm(mv('x'), mf(mc))), 'hQ', F(mf(mc))); },
  // 23.7: α is buried under f, so the rewrite has to reach inside the term
  '18.2': s => { s.ce('rw', Pm(mf(mv('β'))), 'hP', 'hab'); },
  // ---- Chapter 26: Peano arithmetic. add_zero/add_succ are on the bench; induction is a recipe. ----
  // 26.1  0 + a = a. Base: 0 + 0 = 0 straight from add_zero. Step: 0 + succ n = succ (0 + n) = succ n,
  // the second equality being the induction hypothesis rewritten into the first.
  '20.1': s => {
    const nzero = G.appE('nzero', []), nsucc = (a) => G.appE('succ', [a]), nadd = (a, b) => G.appE('add', [a, b]);
    const n = G.varE('n', 'Nat');
    const base = s.c('universal_instantiation', 'add_zero', F(nzero));            // 0 + 0 = 0
    s.v('n', 'Nat');
    const ih = s.a(Eq(nadd(nzero, n), n));                                        // assume 0 + n = n
    const e1 = s.c('universal_instantiation', s.c('universal_instantiation', 'add_succ', F(nzero)), F(n));
    const e2 = s.ce('rw', Eq(nadd(nzero, nsucc(n)), nsucc(n)), e1, ih);           // 0 + succ n = succ n
    const step = s.d(e2, 2);                                                      // ∀ n, (0+n=n → 0+succ n=succ n)
    s.c('induction', base, step);
  },
  // 26.2  succ a + b = succ (a + b): fix a, induct on b.
  '20.2': s => {
    const symm = (l, r, e) => s.c("Eq.symm'", F(l), F(r), e);
    const a = nv('a'), n = nv('n'), sa = nsuc(a);
    s.v('a', NAT);
    const b1 = s.c('universal_instantiation', 'add_zero', F(sa));                 // succ a + 0 = succ a
    const b2 = s.c('universal_instantiation', 'add_zero', F(a));                  // a + 0 = a
    const base = s.ce('rw', Eq(nadd(sa, nz), nsuc(nadd(a, nz))), b1, symm(nadd(a, nz), a, b2));
    s.v('n', NAT);
    const ih = s.a(Eq(nadd(sa, n), nsuc(nadd(a, n))));
    const e3 = s.c('universal_instantiation', s.c('universal_instantiation', 'add_succ', F(sa)), F(n));
    const e4 = s.ce('rw', Eq(nadd(sa, nsuc(n)), nsuc(nsuc(nadd(a, n)))), e3, ih);
    const e5 = s.c('universal_instantiation', s.c('universal_instantiation', 'add_succ', F(a)), F(n));
    const e6 = s.ce('rw', Eq(nadd(sa, nsuc(n)), nsuc(nadd(a, nsuc(n)))), e4, symm(nadd(a, nsuc(n)), nsuc(nadd(a, n)), e5));
    const step = s.d(e6, 2);
    s.d(s.c('induction', base, step), 1);
  },
  // 26.3  a + b = b + a: fix a, induct on b, using 26.1 for the base and 26.2 for the step.
  '20.3': s => {
    const symm = (l, r, e) => s.c("Eq.symm'", F(l), F(r), e);
    const a = nv('a'), n = nv('n');
    s.v('a', NAT);
    const b1 = s.c('universal_instantiation', 'add_zero', F(a));                  // a + 0 = a
    const za = s.c('universal_instantiation', s.c("zero_add'"), F(a));            // 0 + a = a
    const base = s.ce('rw', Eq(nadd(a, nz), nadd(nz, a)), b1, symm(nadd(nz, a), a, za));
    s.v('n', NAT);
    const ih = s.a(Eq(nadd(a, n), nadd(n, a)));
    const e3 = s.c('universal_instantiation', s.c('universal_instantiation', 'add_succ', F(a)), F(n));
    const e4 = s.ce('rw', Eq(nadd(a, nsuc(n)), nsuc(nadd(n, a))), e3, ih);
    const e5 = s.c('universal_instantiation', s.c('universal_instantiation', s.c("succ_add'"), F(n)), F(a));
    const e6 = s.ce('rw', Eq(nadd(a, nsuc(n)), nadd(nsuc(n), a)), e4, symm(nadd(nsuc(n), a), nsuc(nadd(n, a)), e5));
    const step = s.d(e6, 2);
    s.d(s.c('induction', base, step), 1);
  },
  // 26.4  (a + b) + c = a + (b + c): fix a and b, induct on c.
  '20.4': s => {
    const symm = (l, r, e) => s.c("Eq.symm'", F(l), F(r), e);
    const a = nv('a'), b = nv('b'), n = nv('n'), ab = nadd(a, b);
    s.v('a', NAT); s.v('b', NAT);
    const b1 = s.c('universal_instantiation', 'add_zero', F(ab));                 // (a+b)+0 = a+b
    const b2 = s.c('universal_instantiation', 'add_zero', F(b));                  // b+0 = b
    const base = s.ce('rw', Eq(nadd(ab, nz), nadd(a, nadd(b, nz))), b1, symm(nadd(b, nz), b, b2));
    s.v('n', NAT);
    const ih = s.a(Eq(nadd(ab, n), nadd(a, nadd(b, n))));
    const e3 = s.c('universal_instantiation', s.c('universal_instantiation', 'add_succ', F(ab)), F(n));
    const e4 = s.ce('rw', Eq(nadd(ab, nsuc(n)), nsuc(nadd(a, nadd(b, n)))), e3, ih);
    const e6 = s.c('universal_instantiation', s.c('universal_instantiation', 'add_succ', F(a)), F(nadd(b, n)));
    const e7 = s.ce('rw', Eq(nadd(ab, nsuc(n)), nadd(a, nsuc(nadd(b, n)))), e4, symm(nadd(a, nsuc(nadd(b, n))), nsuc(nadd(a, nadd(b, n))), e6));
    const e5 = s.c('universal_instantiation', s.c('universal_instantiation', 'add_succ', F(b)), F(n));
    const e8 = s.ce('rw', Eq(nadd(ab, nsuc(n)), nadd(a, nadd(b, nsuc(n)))), e7, symm(nadd(b, nsuc(n)), nsuc(nadd(b, n)), e5));
    const step = s.d(e8, 2);
    s.d(s.c('induction', base, step), 2);
  },
  // 26.5  a ≤ a: witness 0, since a + 0 = a.
  '20.5': s => {
    const a = nv('a');
    s.v('a', NAT);
    const az = s.c('universal_instantiation', 'add_zero', F(a));                  // a + 0 = a
    const ex = s.ce('Exists.intro', G.EXISTS({ name: 'k', sort: NAT }, Eq(nadd(a, G.varE('k', NAT)), a)), az, F(nz));
    const unfold = s.c('universal_instantiation', s.c('universal_instantiation', 'le_def', F(a)), F(a));
    s.d(s.c('Iff.mpr', unfold, ex), 1);
  },
  // 26.6  transitivity: a + k = b and b + j = c give a + (k + j) = c — which is associativity.
  '20.6': s => {
    const a = nv('a'), b = nv('b'), c = nv('c');
    const at = (h, t) => s.c('universal_instantiation', h, F(t));
    const leA = at('le_def', a);                                                  // ∀ b, (a ≤ b ↔ ∃ k, a + k = b)
    const unf = (x, y) => (x === a ? at(leA, y) : at(at('le_def', x), y));
    const kj = s.obtain(s.c('Iff.mp', unf(a, b), 'hab'), 'k');                    // a + k = b
    const k = nv('k');
    const jj = s.obtain(s.c('Iff.mp', unf(b, c), 'hbc'), 'j');                    // b + j = c
    const j = nv('j');
    const as3 = s.c('universal_instantiation', s.c('universal_instantiation', s.c('universal_instantiation', s.c("add_assoc'"), F(a)), F(k)), F(j));
    // b + j = c, and b is a + k, so (a+k) + j = c; associativity then regroups it as a + (k+j) = c
    const e2 = s.ce('rw', Eq(nadd(nadd(a, k), j), c), jj, s.c("Eq.symm'", F(nadd(a, k)), F(b), kj));
    const e3 = s.ce('rw', Eq(nadd(a, nadd(k, j)), c), e2, as3);
    const ex = s.ce('Exists.intro', G.EXISTS({ name: 'k', sort: NAT }, Eq(nadd(a, G.varE('k', NAT)), c)), e3, F(nadd(k, j)));
    s.c('Iff.mpr', unf(a, c), ex);
  },
  // 26.7  no largest number: a largest m would satisfy succ m ≤ m, which not_succ_le forbids.
  '20.7': s => {
    const m = nv('m');
    const hex = s.a(G.EXISTS({ name: 'm', sort: NAT }, faS('n', NAT, G.appE('le', [nv('n'), nv('m')]))));
    const hm = s.obtain(hex, 'm');
    const big = s.c('universal_instantiation', hm, F(nsuc(m)));                   // succ m ≤ m
    const no = s.c('universal_instantiation', 'not_succ_le', F(m));               // ¬ (succ m ≤ m)
    s.n(big, no);
  },
  // ---- Chapter 27: sets. Each law is the propositional law transported through membership. ----
  // The shape is the same every time: fix x, unfold both sides with the membership axiom, connect the two
  // bodies with the Chapter 2/9 lemma, then hand the resulting ∀x, (… ↔ …) to extensionality.
  '18.8': s => setLaw(s, 'mem_union', "Or.symm'", (x, y) => G.appE('union', [x, y])),
  '18.9': s => setLaw(s, 'mem_inter', "And.symm'", (x, y) => G.appE('inter', [x, y])),
  '18.11': s => assocLaw(s, 'mem_union', "Or.congr_left'", "Or.congr_right'", 'Or.assoc_left', 'Or.assoc_right', (x, y) => G.appE('union', [x, y])),
  '18.12': s => assocLaw(s, 'mem_inter', "And.congr_left'", "And.congr_right'", 'And.assoc_left', 'And.assoc_right', (x, y) => G.appE('inter', [x, y])),
  // 27.7: the dual capstone — ∪ over ∩.
  '18.13': s => distribLaw(s, 'mem_union', 'mem_inter', "Or.congr_right'", "And.congr_left'", "And.congr_right'",
    "or_and_left'", 'or_and_left_rev', (p, q) => G.appE('union', [p, q]), (p, q) => G.appE('inter', [p, q])),
  // 27.4 distributivity: ∩ over ∪, the same proof as 18.13 with the two connectives exchanged.
  '18.10': s => distribLaw(s, 'mem_inter', 'mem_union', "And.congr_right'", "Or.congr_left'", "Or.congr_right'",
    "and_or_left'", 'and_or_left_rev', (p, q) => G.appE('inter', [p, q]), (p, q) => G.appE('union', [p, q])),
  // ---- Chapter 25: groups. The axioms are already on the bench; no exercise restates them. ----
  // 25.1: instantiate each hypothesis at the OTHER constant, then rewrite one equation with the other —
  // both say something about α · β, so rewriting that subterm turns `α · β = β` straight into `α = β`.
  '19.1': s => {
    const e1 = s.c('universal_instantiation', 'hL', F(gb));   // α · β = β
    const e2 = s.c('universal_instantiation', 'hR', F(ga));   // α · β = α
    s.ce('rw', Eq(ga, gb), e1, e2);
  },
  // 25.3 left cancellation. A RECORD (13, was 18): do not walk β all the way to γ along a chain of
  // equalities. Associativity at inv α and α gives (inv α·α)·z = inv α·(α·z) for any z, so instantiate
  // that ONE potion at β and at γ; the given turns the β side into inv α·(α·γ); inv α·α = 1 collapses
  // both left-hand sides to 1·β and 1·γ; and 1·β = β, 1·γ = γ finish it. Five rewrites, no Eq.symm'.
  '19.3': s => {
    const a = ga, b = gb, c = G.varE('γ', GRP), ia = ginv(a);
    const at = (h, t) => s.c('universal_instantiation', h, F(t));
    const as2 = at(at('mul_assoc', ia), a);                               // ∀ z, (inv α·α)·z = inv α·(α·z)
    const e1 = at(as2, b);                                                // (inv α·α)·β = inv α·(α·β)
    const e2 = s.ce('rw', Eq(gmul(gmul(ia, a), b), gmul(ia, gmul(a, c))), e1, 'h');
    const u = at('inv_mul', a);                                           // inv α·α = 1
    const e3 = s.ce('rw', Eq(gmul(g1, b), gmul(ia, gmul(a, c))), e2, u);  // 1·β = inv α·(α·γ)
    const f1 = at(as2, c);                                                // (inv α·α)·γ = inv α·(α·γ)
    const f2 = s.ce('rw', Eq(gmul(g1, c), gmul(ia, gmul(a, c))), f1, u);  // 1·γ = inv α·(α·γ)
    const f3 = s.ce('rw', Eq(gmul(ia, gmul(a, c)), c), at('one_mul', c), f2);   // inv α·(α·γ) = γ
    const g2 = s.ce('rw', Eq(b, gmul(ia, gmul(a, c))), e3, at('one_mul', b));   // β = inv α·(α·γ)
    s.ce('rw', Eq(b, c), g2, f3);
  },
  // 25.4 involution: α = 1·α = (inv(inv α)·inv α)·α = inv(inv α)·(inv α·α) = inv(inv α)·1 = inv(inv α)
  // A RECORD (5, was 12), and the largest cut any reader has sent: don't unfold the group — CANCEL. Both
  // inv(α)·inv(inv(α)) and inv(α)·α are 1, so they are equal, and mul_left_cancel' (19.3) strikes the
  // inv(α) off the front of both. One rewrite is all it takes to put the two equations together.
  '19.4': s => {
    const ia = ginv(ga), iia = ginv(ia);
    const e1 = s.c('universal_instantiation', 'mul_inv', F(ia));          // inv(α) · inv(inv(α)) = 1
    const e2 = s.c('universal_instantiation', 'inv_mul', F(ga));          // inv(α) · α = 1
    const e2s = s.c("Eq.symm'", F(gmul(ia, ga)), F(g1), e2);              // 1 = inv(α) · α
    const both = s.ce('rw', Eq(gmul(ia, iia), gmul(ia, ga)), e1, e2s);
    s.c("mul_left_cancel'", F(ia), F(iia), F(ga), both);
  },
  // 25.5 the inverse of a product. A RECORD (17, was 18): show that (α·β)·(inv β·inv α) = 1, which is
  // also what (α·β)·inv (α·β) equals, and cancel α·β off the front with 19.3's lemma. Both halves of
  // the ⋅ are built by instantiating ONE associativity potion twice, which is where the move comes from.
  '19.5': s => {
    const a = ga, b = gb, ia = ginv(a), ib = ginv(b);
    const at = (h, t) => s.c('universal_instantiation', h, F(t));
    const asB = at(at(at('mul_assoc', b), ib), ia);                       // (β·inv β)·inv α = β·(inv β·inv α)
    const bb = at('mul_inv', b);                                          // β·inv β = 1
    const e1 = s.ce('rw', Eq(gmul(g1, ia), gmul(b, gmul(ib, ia))), asB, bb);
    const e2 = s.ce('rw', Eq(ia, gmul(b, gmul(ib, ia))), e1, at('one_mul', ia));
    const aa = at('mul_inv', a);                                          // α·inv α = 1
    const e3 = s.ce('rw', Eq(gmul(a, gmul(b, gmul(ib, ia))), g1), aa, e2);
    const asA = at(at(at('mul_assoc', a), b), gmul(ib, ia));              // (α·β)·(inv β·inv α) = α·(β·(inv β·inv α))
    const e4 = s.ce('rw', Eq(gmul(gmul(a, b), gmul(ib, ia)), g1), asA, e3);
    const prod = at('mul_inv', gmul(a, b));                               // (α·β)·inv (α·β) = 1
    const e5 = s.c("Eq.symm'", F(gmul(gmul(a, b), gmul(ib, ia))), F(g1), e4);
    const e6 = s.ce('rw', Eq(gmul(gmul(a, b), ginv(gmul(a, b))), gmul(gmul(a, b), gmul(ib, ia))), prod, e5);
    s.c("mul_left_cancel'", F(gmul(a, b)), F(ginv(gmul(a, b))), F(gmul(ib, ia)), e6);
  },
  // 25.2: inv 1 · 1 is both inv 1 (by mul_one) and 1 (by inv_mul), so rewriting one into the other is enough
  '19.2': s => {
    const a = s.c('universal_instantiation', 'mul_one', F(ginv(g1)));   // inv 1 · 1 = inv 1
    const b = s.c('universal_instantiation', 'inv_mul', F(g1));         // inv 1 · 1 = 1
    s.ce('rw', Eq(ginv(g1), g1), b, a);
  },
  // ---- Chapter 24: equality. Two primitives, everything else derived. ----
  '18.1': s => { s.c('Eq.refl', F(alpha)); },
  '18.3': s => { s.ce('rw', Pp(beta), 'hP', 'hab'); },
  // 24.3: Q(α,α) offers three rewrites — the target picks which occurrence moves
  '18.4': s => { s.ce('rw', Q(alpha, beta), 'hQ', 'hab'); },
  // 24.4 symmetry: rewrite the LEFT α of `α = α` into β
  '18.5': s => { s.ce('rw', Eq(beta, alpha), s.c('Eq.refl', F(alpha)), 'hab'); },
  // 24.5 transitivity: rewrite β in `α = β` along `β = γ`
  '18.6': s => { s.ce('rw', Eq(alpha, gamma), 'hab', 'hbc'); },
  // 24.6 congruence. A RECORD (4, was 5, and 8 before that). Rewriting along α = β gives EITHER
  // direction depending on which occurrence of α you rewrite, so both halves of the ↔ come from one
  // implication and Eq.symm' goes unused. That implication is P(α) → P(α), and Kantian's record gets it
  // for nothing from `Impl.idem` instead of paying two moves to assume P(α) and discharge it — the same
  // move that took a move off 7.13.
  '18.7': s => {
    const refl = s.c('Impl.idem', F(Pp(alpha)));                          // P(α) → P(α)
    const fwd = s.ce('rw', IMPLIES(Pp(alpha), Pp(beta)), refl, 'hab');    // rewrite the α on the right
    const bwd = s.ce('rw', IMPLIES(Pp(beta), Pp(alpha)), refl, 'hab');    // and the one on the left
    s.c('Iff.intro', fwd, bwd);
  },
  // 22.10 (QED 22.8): ∀(P→¬Q),∀(¬Q→R),¬∃(R∧S) ⊢ ∀(P→¬S)
  // A RECORD (9, was 11, and 12 before that): `barbara` — instantiate a ∀-implication AND apply it — is
  // one move where universal_instantiation followed by modus ponens is two. It pays twice here, and in
  // every 15.x below.
  '15.10': s => {
    s.v('X');
    const hp = s.a(Pp(X));
    const nq = s.c('barbara', F(X), 'hPnQ', hp);     // ¬ Q(X)
    const rX = s.c('barbara', F(X), 'hnQR', nq);     // R(X)
    const hs = s.a(Sp(X));
    const ex = s.ce('Exists.intro', EE('x', AND(Rp(xO), Sp(xO))), s.c('And.intro', rX, hs), F(X));
    s.d(s.n(ex, 'hnrs'), 2);
  },
  // 22.11 not_exists_forall_not: ¬∃X,P X ⊢ ∀X,¬P X (a directional De Morgan half — mints a reusable recipe)
  '15.13': s => {
    s.v('X'); const hp = s.a(Pp(X));
    const ex = s.ce('Exists.intro', EE('x', Pp(xO)), hp, F(X));
    s.d(s.n(ex, 'hne'), 1);
  },
  // 22.12 forall_not_not_exists: ∀X,¬P X ⊢ ¬∃X,P X
  '13.4': s => {
    const hex = s.a(EE('X', Pp(X)));
    const pb = s.obtain(hex, 'b');
    s.n(pb, s.c('universal_instantiation', 'hfn', F(bO)));
  },
  // 22.13 forall_dne: ∀X,¬¬P X ⊢ ∀X,P X — REUSES the minted not_not_elim (12.3) under a ∀
  '12.8': s => {
    s.v('X'); const nn = s.c('universal_instantiation', 'hdn', F(X));
    s.d(s.c('not_not_elim', nn), 1);
  },
  // 22.3b not_forall_iff_exists_not: ¬∀X,P ↔ ∃X,¬P — forward ACCELERATED by reusing 22.11 (P↦¬P), 22.13, not_not_elim
  '15.14': s => {
    const h = s.a(NOT(fa('X', Pp(X))));
    const hne = s.a(NOT(EE('X', NOT(Pp(X)))));
    const h1 = s.c('not_exists_forall_not', hne);   // ∀X,¬¬P X  (predicate metavar solved to λx.¬P x)
    const h2 = s.c('forall_dne', h1);               // ∀X,P X
    const nne = s.n(h2, h);                          // ¬¬∃X,¬P X
    const fwd = s.d(s.c('not_not_elim', nne), 1);    // ¬∀→∃¬
    const he = s.a(EE('X', NOT(Pp(X))));
    const hfa = s.a(fa('X', Pp(X)));
    const nb = s.obtain(he, 'b');
    const bwd = s.d(s.n(s.c('universal_instantiation', hfa, F(bO)), nb), 1);   // ∃¬→¬∀
    s.c('Iff.intro', fwd, bwd);
  }
};

// The scripted solutions are the project's record of HOW each exercise is meant to be proved, so they
// are also the source of the unlock graph: `scratch/prereqs.js` instruments them to see which mechanics
// and which earlier lemmas each proof actually consumes. Export them when required as a module, and do
// the emit-and-compile run only when this file is the entry point.

module.exports = { G, SOL, solver, F };
