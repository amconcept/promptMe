# PromptMe Design Decisions — Spec & Checker for AI (visual/UX layer)

Companion to RANDOMIZER_LOGIC_SPEC.md, same idea applied to visual and interaction
design instead of randomizer logic. When a design choice in code looks wrong or
gets "fixed" again, check here first — it may be intentional, and the fix should
update this doc, not just the code.

Seeded from CHANGELOG.txt history. Incomplete on purpose — add a row every time
you make a visual/UX call you'd be annoyed to re-derive later.

---

## 1. Glossary

| Term | Meaning |
|------|---------|
| **Knob** | A value meant to be hand-tuned (color, spacing, timing, copy). Should live in one named place, not inline in logic. |
| **D-rule** | A tagged design decision (D1, D2, …) referenced in code comments, same pattern as R1–R7 in the logic spec. |

---

## 2. Decisions (must hold until explicitly revised here)

| # | Decision | Why | Where it lives in code |
|---|----------|-----|-------------------------|
| D1 | Editor uses orange (#D2691E "Chocolate"), Sketch uses green | Visually separates "designing" mode from "running" mode at a glance | editor.html CSS, sketch.html CSS |
| D2 | VT323 monospace font throughout | Retro terminal aesthetic, ties to Apple II control panel concept | all HTML `<head>` font links |
| D3 | Category label (60px) + gap (60px) = 120px left offset on prompt headers | Prompt headers must align vertically with category textareas below them | editor.html, editor-ui-manager.js — currently bare `120px`/`60px` literals, not commented at the declaration |
| D4 | Delete buttons render as orange `[x]` in brackets, not circles | Cleaner look, less visual noise than circle+icon | editor-ui-manager.js |
| D5 | Delete button color follows theme's `--primary-color`, not a fixed red | Consistency with per-theme styling instead of a hardcoded warning color | CSS `--delete-color` var |
| ~~D6~~ | *Retired — see 2.1* | | |
| ~~D7~~ | *Retired — see 2.1* | | |
| D8 | Theme system (8 presets: orangeCRT, blueCRT, windows, greenCRT, purpleCRT, pinkCRT, macintosh, black) is **fully live** — CHANGELOG's "THEME SYSTEM REMOVAL" entry is simply wrong, not a sign this was meant to go away | This is now understood as the seed of F5's "teachers can style it their way," not legacy weight — direction is to grow it, not decide whether to delete it | theme-manager.js + all three HTML files |
| D9 | `prompt1InterestsMode` (student-interest/category-selection): **open question, not dead code** — mechanism is fully built (checkbox UI, wiring, CSV round-trip) but hardcoded off. Paused because the real unsolved problem is *how a student's interest gets identified*, not the widget itself. See Future Directions F2 for where this is headed. | Alec wants this feature back, but not until the identification method is designed | editor.html (hidden/disabled checkbox), editor-data-manager.js, editor-settings-manager.js, sketch-refactored.js, prompt-generator.js, data-manager.js, ui-manager.js |

---

## 2.1 Retired decisions

Not deleted, and numbers are never reused — a retired row records that the decision was
considered and dropped, so it doesn't get re-derived from scratch later.

| # | Was | Status | Why retired |
|---|-----|--------|-------------|
| D6 | Manually-added students get a `*` prefix and sort to the end of navigation | **Retired Aug 2026** — not needed in the current iteration | Depended on the mid-session "+" button, which no longer exists. Defensive asterisk-stripping survives in `data-manager.js` (lines 545–546, 748, 857) and `student-manager.js` (line 163), but nothing can add an asterisk, so the branches never fire. Harmless; left in place, not load-bearing. |
| D7 | Keyboard scheme: ↑/Enter = generate, ↓ = clear name, ←/→ = navigate students, C = toggle panel, ESC = editor | **Retired Aug 2026** — not needed in the current iteration | Described three bindings that don't match the code: ↓ advances to a new run slot rather than clearing the name (`sketch-refactored.js:1340`), C is a no-op because the control panel is hidden, and no ESC handler exists. The keyboard scheme is now plain behaviour documented in README.md, not a design decision needing preservation here. |

The underlying intent of D7 — *the desk loop must work without reaching for the mouse* —
still holds as a general principle. It just doesn't need a D-row pinning specific keys.

---

## 3. Known drift (flag, don't silently "fix")

- ~~CHANGELOG's documented module line counts no longer match actual file sizes.~~
  **Resolved Aug 2026** — counts corrected and the false ones retracted in CHANGELOG.txt.
  Expect them to go stale again: they are a snapshot, not a live figure. Re-measure with
  `wc -l` before citing a count anywhere, and don't treat the listed numbers as current.
- **Control scheme has no drift guard.** Retiring D7 left `README.md` as the only record of
  what the keys and buttons do. It mirrors `keyPressed()` in `sketch-refactored.js`
  (~line 1280 onward) plus the button wiring in `ui-manager.js`, and nothing enforces that
  they agree — this already bit once, when Space was documented as "generate" while the code
  only used it to interrupt a running scramble. When you change a binding or a button label,
  update README.md's Controls tables in the same turn.
- Heavy `console.log`/`debugLog` density in data-manager.js and sketch-refactored.js — likely a mix of "still needed" and "debugging residue from a specific past bug." Needs a human pass (Alec), not an automatic strip, since some of these were added to catch real recurring bugs (see CHANGELOG's many "Fixed: variable scope" entries).

---

## 4. Future directions (captured, not yet decided)

Nothing in this section is a decision — these are directions Alec wants to
explore. Do not build against these without confirming scope first; they're
here so the reasoning isn't lost between conversations.

- **F1 — Multi-format prompts.** Teachers should be able to author prompt
  options as short words (current behavior), full sentences, or images
  (drag-and-drop PNG) — not just single words. The randomizer's pool/category
  logic is content-agnostic already (R1–R7 don't care what an option "is"),
  so this is mainly a data-model and reveal-animation problem, not a logic
  rewrite. Open question: do images stay embedded/local (bigger storage,
  works fully offline like today) or get hosted externally (lighter, but
  introduces a backend dependency the app doesn't currently have)?
- **F2 — Invisible teacher curation.** A teacher should be able to bias or
  pin which options come up — either preset before a session or adjusted
  live while a student is at the desk — without the student perceiving
  anything other than genuine randomness. This directly extends the open
  `prompt1InterestsMode` question (see D9): "interest" doesn't have to be
  something a student declares — it can be something a teacher steers
  invisibly. Implementing this means adding a weighting/override layer on
  top of the existing uniform-random draw, without changing the visible
  reveal behavior at all.
- **F3 — Design constraint: mimics AI, requires teacher intent.** The system
  should feel unpredictable/generative the way AI output does, but it must
  structurally force the teacher to make deliberate curatorial choices
  rather than free-generating content for them. Any future AI feature
  (e.g. an authoring assistant that helps draft prompt options) should be
  checked against this constraint before being added — assist the teacher's
  curation, don't replace it.
- **F4 — Customizable animations.** The reveal animation (currently one
  hardcoded terminal-scramble effect) should become a swappable, parameterized
  "knob" rather than a single fixed effect — same philosophy as D-tagged
  knobs elsewhere in this doc. Connects to F1: images will need a different
  reveal treatment than text since character-scrambling doesn't apply to a
  picture.
- **F5 — Low floor, wide walls.** First-time view of the app must be minimal
  — a teacher should be able to open it and successfully build and run an
  activity without touching anything beyond the essentials. Everything else
  (theming, F1's sentence/image authoring, F2's curation controls, F4's
  animation options) should reveal itself progressively as a teacher gets
  more comfortable, not sit exposed by default. This is a **cross-cutting
  constraint on the other F-items**, not a standalone feature: it decides
  *how* F1/F2/F4 get exposed in the UI, not whether they exist. High ceiling
  is deliberately not a goal here — this is a microworld for prompting
  student design-thinking experiences, not a power-user tool; depth isn't
  the point, breadth of who can make it their own is.
  - **Concrete instance of "wide walls":** Alec styled the current look
    himself, but thinks adoption depends on teachers being able to restyle
    it as *their* room, not just use his. The 8-preset theme system (D8) is
    real, working infrastructure toward this already — but "their way" may
    mean more than choosing from a fixed preset list (custom colors, fonts,
    branding). How far "their way" goes — pick-a-preset vs. true
    customization — is an open scope question, not yet decided.

## 5. How to use this with AI

1. **Before styling changes:** check here first — a "weird" number or color may be load-bearing (see D3).
2. **After a visual/UX change:** add or update a row here in the same turn, same as RANDOMIZER_LOGIC_SPEC.md's rules.
3. **Audit:** periodically ask "for each design decision a user would notice, is there a D-row and a comment at the code site, or is the reasoning only in CHANGELOG.txt?"
