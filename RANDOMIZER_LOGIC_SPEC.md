# PromptMe Randomizer Logic — Spec & Checker for AI

Use this document to verify implementation against desired behaviour. When behaviour is wrong, compare code paths to the rules and invariants below; any mismatch is a bug.

---

## 1. Glossary (single source of truth)

| Term | Meaning |
|------|--------|
| **Prompt** | One drawable option (e.g. "Item 1"); belongs to one category and one prompt type. |
| **Prompt type** | Column in the design (e.g. Item, Thing). Each has its own pools and in-play tracking. |
| **Category** | Row/theme (e.g. Robotics, Textiles). Groups associated prompts; one category locks per run when not forced. |
| **Pool** | Set of options for one prompt type. Split by category (Category 1 pool, Category 2 pool, …). "The pool" for a type = union of all category pools for that type. |
| **In play** | Prompts currently drawn and not put back. Cannot be drawn again until put back or pool exhausted. Tracked per prompt type, across all categories. |
| **Leader prompt** | First prompt type in a run when no category is forced. Drawn from combined pool (all categories); its category locks the run. |
| **Locking** | After leader (or when category forced), all other prompts in that run come only from that category's pools. |
| **Exhaustion** | A prompt type is exhausted when every option for that type (across all categories) has been in play at least once. Then that type's in-play set is cleared (refresh). |
| **Forcing** | User selects a category; every prompt in the run (including first) is drawn only from that category's pools. |
| **Put-back** | When a student changes result, their old combo leaves "in play" so others can draw it; that student must not get the same combo on next draw. |

---

## 2. Rules (must hold)

- **R1** Each Randomizer press produces one run: one prompt per prompt type. That combo is in play until put back or refresh.
- **R2** When no category is forced, the first prompt type is the leader. Leader is drawn from the **combined** pool (all categories for that type). One option is chosen at random from that combined set, excluding in-play.
- **R3** The category of the chosen leader option **locks** the run: all other prompt types in that run use **only** that category's pools (same category for the whole run).
- **R4** No option that is in play may be drawn. In play is tracked **per prompt type**, **across all categories**.
- **R5** When a student changes result (new draw for same slot): (a) their old combo is put back (no longer in play); (b) their new draw must not be the same combo.
- **R6** A prompt type is exhausted only when **all** its options (all categories) have been in play at least once. On exhaustion, that type's in-play set is cleared (refresh).
- **R7** When a category is forced, **all** prompts in the run (including the first) are drawn only from that category's pools. No combined leader pool; category is fixed before any draw.

---

## 3. Invariants (quick checks)

- **I1** Leader (when not forced) is never drawn from a single category only; it must use the union of all categories for that prompt type.
- **I2** After the first draw in a run, every subsequent draw in that run uses only the locked category's pool for each prompt type.
- **I3** usedPrompts (or equivalent) is keyed by prompt type only, not by (prompt type + category). Same option string in different categories shares one "in play" state.
- **I4** Put-back runs only when a result is changed (same slot, new draw); it removes that slot's previous prompts from in play and excludes that combo for the next draw for that student.
- **I5** Exhaustion/reset for a prompt type happens only when the count (or set) of drawn options for that type equals the full set of options for that type across all categories.
- **I6** Forced category: no random category choice; first and all other prompts are drawn only from the forced category's pools.

---

## 4. Scenario checklist (expected outcomes)

Use these to verify behaviour; if the system disagrees, one of the rules or invariants is violated.

| # | Scenario | Expected |
|---|----------|----------|
| S1 | No category forced, nothing in play, two categories (Cat1: Item 1,2,3 / Thing 1,2,3; Cat2: Item 4,5 / Thing 6,7,8). One run. | First draw is one of Item 1,2,3,4,5. If Item from Cat1, then Thing is one of 1,2,3. If Item from Cat2, then Thing is one of 6,7,8. |
| S2 | Same setup; Item 1 and Thing 3 already in play. Run. | First draw is one of Item 2,3,4,5. If Item 2 or 3, Thing from 1,2 (not 3). If Item 4 or 5, Thing from 6,7,8. |
| S3 | Student A got Item 1 + Thing 3. Student B runs. | Item 1 and Thing 3 not available for B. B gets e.g. Item 3 + Thing 2 (or any valid combo from remaining). |
| S4 | Student A changes result (randomizer again). | A's old combo (Item 1, Thing 3) goes back to pool. A gets a new combo that is not Item 1 + Thing 3. |
| S5 | All Items (1,2,3,4,5) have been in play. Next run. | Item pool is refreshed; all five are available again. |
| S6 | Category 2 forced. Run. | First draw is one of Item 4,5. Thing is one of 6,7,8. No Item 1,2,3 or Thing 1,2,3 in this run. |
| S7 | Cat1: Item 1,2,3 / Thing 1,2,3; Cat2: Item 4,5 / Thing 6,7,8. All Things (1–8) exhausted and refreshed; all Items still in play except Item 1. Student D runs (no forced category). | Leader: one of Item 2,3,4,5 (Item 1 in play). If leader is Item 2 or 3, Thing from 1,2,3; if Item 4 or 5, Thing from 6,7,8. |
| S8 | Same as S7. Student E runs after D got Item 1 + Thing 4 (so Item 1 and Thing 4 now in play). Thing pool had refreshed so 1,2,3,4,5,6,7,8 available; only Thing 4 in play. | Leader: one of Item 2,3,4,5. Things available per category: Cat1: 1,2,3 (4 in play); Cat2: 5,6,7,8 (4 in play). E gets e.g. Item 3 + Thing 2, or Item 5 + Thing 6. |
| S9 | Teacher removes Thing 3 from design. Student C had Item 1 + Thing 3; teacher goes back, "removes" for C (change result). C randomizes again. | C's old combo put back (Item 1, Thing 3). Thing 3 no longer in pool (removed). C gets Item 1 + one of remaining Things (e.g. 1,2,4,5,…). No Thing 3. |
| S10 | Category 1 forced. Item 1,2,3 and Thing 1,2,3 only. Item 1 and Thing 2 in play. Run. | First draw one of Item 2,3. Thing one of 1,3 (not 2). |

---

## 5. How to use this with AI

1. **Debugging:** Paste this spec + a short description of the bug (e.g. "Student B got Item 1 after A had it"). Ask: "Which rule or invariant is violated?" Then: "Where in the code does [that rule] get enforced? Show the exact logic."
2. **Audit:** Ask: "For each of R1–R7 and I1–I6, point to the code that implements it. If none, say 'NOT IMPLEMENTED'."
3. **Regression:** After a change, ask: "Re-check invariants I1–I6 against the current code; list any that no longer hold."
4. **Scenarios:** Run S1–S10 (or a subset) in the app or in tests; if outcome differs from the table, map the failure to a rule (e.g. "S4 failed → R5 or I4").

---

## 6. Classroom flow (hat model)

Think of each prompt type as a **hat of slips**. Taken slips stay out until put back or the hat is empty (then all return).

| Action | What happens to the hat |
|--------|-------------------------|
| **Up / Enter** on empty or new slot (after NEXT) | Draw one combo; those slips leave the hat (in play). |
| **Up / Enter** again on the **same** finished result | Put that student's slips back; draw again from slips still in the hat (not other students' taken slips). Prefer not the exact same combo (R5). |
| **Up / Enter** while scramble still running | **Ignored** — wait until the result finishes. |
| **NEXT / Down** | Confirm current result; open a new empty slot for the next student. Previous slips stay out of the hat. |
| **Left / Right** | Browse history. Up on an old slot = re-roll that student (put their slips back, draw from what remains now). |
| **Editor add/remove prompts** | Pool is the current design. New slips can be drawn; removed slips are no longer drawable. In-play tracking follows the current union (R6). |

Typical desk loop: student Up → wait for result → (optional re-roll Up) → NEXT chime → next student.
