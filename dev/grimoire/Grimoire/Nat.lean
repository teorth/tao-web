/-
  Grimoire's `Nat` sort: a CONCRETE sort, modelled on core Lean's `Nat`.

  Because it is modelled rather than axiomatised, every "axiom" of the Grimoire theory is a proved
  theorem here, so the theory is consistent by construction and the compile-check keeps its force.
  No Mathlib, no `Add`/`LE` typeclass, no `axiom` command.
-/
namespace Grimoire

/-- `def`, not `abbrev`: semireducible, so core's `Add`/`LE`/`OfNat` instances do not apply and our own
    notation is unambiguous. -/
def Nat' : Type := Nat

/-- Required before any Ω-lemma carrying `[Nonempty Ω]` can be used at this sort. -/
instance : Nonempty Nat' := ⟨Nat.zero⟩

namespace Nat'

def zero : Nat' := Nat.zero
def succ (a : Nat') : Nat' := Nat.succ a
def add (a b : Nat') : Nat' := Nat.add a b
/-- `a ≤ b` is DEFINED as "b is a plus something". That is what lets the order facts be derived in-game
    from the addition ladder — `le_refl` from `add_zero`, `le_trans` from `add_assoc` — rather than being
    handed over as further axioms. -/
def le (a b : Nat') : Prop := ∃ k : Nat', add a k = b

scoped infixl:65 " + " => Grimoire.Nat'.add
scoped infix:50 " ≤ " => Grimoire.Nat'.le

/-- The two defining equations of addition. Both hold definitionally on the model. -/
theorem add_zero (a : Nat') : add a zero = a := rfl
theorem add_succ (a b : Nat') : add a (succ b) = succ (add a b) := rfl

/-- Induction, packaged so a Grimoire proof can cite it by name and let Lean infer the motive from the
    `have` ascription. Doing it here rather than emitting `Nat.rec` directly also hides the fact that
    `Nat'` is only definitionally a `Nat`. -/
theorem induction' {motive : Nat' → Prop} (base : motive zero)
    (step : ∀ n, motive n → motive (succ n)) : ∀ n, motive n :=
  fun n => Nat.rec base step n

/-- Unfolding `≤`. The player uses this with Iff.mp / Iff.mpr, so `le_refl` and `le_trans` become
    exercises rather than axioms. -/
theorem le_def (a b : Nat') : le a b ↔ ∃ k : Nat', add a k = b := Iff.rfl

/-- The one order fact that is NOT reachable from the addition ladder alone (it needs the successor to be
    injective and non-zero), so it stays a theorem of the module. -/
theorem not_succ_le (a : Nat') : ¬ le (succ a) a := by
  intro h
  obtain ⟨k, hk⟩ := h
  exact absurd (Nat.le.intro hk) (Nat.not_succ_le_self a)

end Nat'
end Grimoire
