# Rando Calrissian Design Decisions — Spec & Checker for AI (visual/UX layer)

Companion to RANDOMIZER_LOGIC_SPEC.md, same idea applied to visual and interaction
design instead of randomizer logic. When a design choice in code looks wrong or
gets "fixed" again, check here first — it may be intentional, and the fix should
update this doc, not just the code.

> Naming note: the app is called **Rando Calrissian** in the UI. The repository folder
> and some internal identifiers still read `PromptMe` — that's historical, not a second
> product.

Seeded from CHANGELOG.txt history. Incomplete on purpose — add a row only when a
future session could plausibly mistake the choice for a bug and revert it.
Routine visual tweaks are CHANGELOG-only (see Documentation routing in `.cursorrules`).

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
| D1 | Theme is one saved preference (`localStorage` key `selectedTheme`), applied on editor, sketch, and index. Missing key → **windows**. Each page’s CSS `:root` is only a flash-before-JS fallback (editor.html currently greenCRT-like values; sketch.html currently Chocolate `#D2691E`) and is overwritten once `applyThemeFromStorage()` runs. Not a fixed editor-orange / sketch-green split. | An activity should look like itself in both rooms | `applyThemeFromStorage()` in theme-manager.js; called from editor.html, sketch.html, index.html, sketch-refactored.js |
| D2 | VT323 monospace font throughout | Retro terminal aesthetic, ties to Apple II control panel concept | all HTML `<head>` font links |
| D3 | Prompt headers align with grouping columns via CSS grid knobs `--column-width` (200px) and `--grid-gap` (40px). A `.header-placeholder` cell occupies the first column so headers sit over the option boxes, not the grouping labels. | Headers must line up with the cells below | editor.html `:root` and `.prompt-grid`; `editor-ui-manager.js` rebuilds the grid using those variables |
| D4 | Delete buttons render as orange `[x]` in brackets, not circles | Cleaner look, less visual noise than circle+icon | editor-ui-manager.js |
| D5 | Delete `[ X ]` follows the theme’s `--primary-color` (via `--delete-color`). Not a separate warning red. | Chrome should read as one palette; a leftover `#FF6B6B` in theme presets was unused and would have fought that | `theme-manager.js` presets; `.delete-prompt` / `.delete-category` in editor.html |
| ~~D6~~ | *Retired — see 2.1* | | |
| ~~D7~~ | *Retired — see 2.1* | | |
| D8 | Theme system (8 presets: orangeCRT, blueCRT, windows, greenCRT, purpleCRT, pinkCRT, macintosh, black) is **fully live** — CHANGELOG's "THEME SYSTEM REMOVAL" entry is simply wrong, not a sign this was meant to go away | This is now understood as the seed of F5's "teachers can style it their way," not legacy weight — direction is to grow it, not decide whether to delete it | theme-manager.js + all three HTML files |
| D9 | `prompt1InterestsMode` (student-interest/category-selection): **open question, not dead code** — mechanism is fully built (checkbox UI, wiring, CSV round-trip) but hardcoded off. Paused because the real unsolved problem is *how a student's interest gets identified*, not the widget itself. See Future Directions F2 for where this is headed. | Alec wants this feature back, but not until the identification method is designed | editor.html (hidden/disabled checkbox), editor-data-manager.js, editor-settings-manager.js, sketch-refactored.js, prompt-generator.js, data-manager.js, ui-manager.js |
| D10 | Auto-save copies cube → grid **only while phone/cube layout is live** | Desktop and phone share one data model but two DOM copies. The cube stays in the page on desktop, hidden and empty. Flushing it on every save overwrote the visible prompt list after the 600ms auto-save delay. | `saveChanges()` in editor-data-manager.js; `flushPromptCube()` in editor-prompt-cube.js |
| D11 | Objective is optional at run time. Editor warns (“Missing objective”) with Skip; the prompting window only blocks when there are no prompts. | Teachers should be able to try prompt lists before writing an objective. Hard-blocking RUN after Skip made Skip a dead end. | `quickTest()` in editor-main.js; `triggerPromptRun()` in sketch-refactored.js |
| D12 | Prompt lists of **4+ words** (or one token ≥ 28 chars) use sentence reveal: ~1s target, fewer scramble flashes, beep per word. Layout wraps first and will not shrink below a readable floor. 1–3 words keep the original letter-by-letter timing. | Word-count is a teacher-facing rule that matches how lists are written; character-count is the fallback for a single long token. | `TIMING` in animation-manager.js; `CARD_FIT` in sketch-refactored.js |
| D13 | Scramble phase uses a **decoy** option from the same prompt column, not the chosen prompt’s length or spaces. Reveal still locks onto the real text. | Matching scramble length to the answer made the result readable before it landed. | `pickScrambleDecoyTemplate()` in animation-manager.js |
| D14 | Sentence reveal is **word-by-word** at 880Hz; scramble stays 440Hz; short lists stay 600Hz letter ticks. | Same beep as scramble made sentences sound like more letter chatter. | `SOUND.WORD_REVEAL` in animation-manager.js |
| D15 | PNG/JPG prompt options: `img:<uuid>` strings in the same lists as text; blobs in IndexedDB; skip letter-scramble and show the picture | Scramble is a text effect. Randomizer (R1–R7) already treats options as opaque strings | `image-store.js`, `editor-image-prompts.js`, animation-manager.js, sketch-refactored.js |
| ~~D16~~ | *Superseded by D17 — see long form* | Silent Cursor-style dots, then reveal | `TIMING.IMAGE_REVEAL_MS` (removed) |
| D17 | Picture wait uses the letter-scramble clock: 50ms ticks, 440Hz beep, dots flicker randomly each tick, then the image and the final ping | Silent thinking-dots did not feel like scramble | `TIMING.IMAGE_SCRAMBLE_CYCLES`, `SOUND.SCRAMBLE`, sketch-refactored.js |
| D18 | Empty prompt headings are omitted on the card (no invented “PROMPT 1”) | A blank heading is a choice, not a missing name | `isUnlabeledPromptHeader()` in editor-data-manager.js, data-manager.js, sketch-refactored.js |
| D19 | Image thumbs sit inside the prompt box; drop uses capture so a picture from another window does not open a new tab. Remote `http(s)` URLs are never fetched (D-020). | Thumbs outside the border looked like leftover UI; without `preventDefault` the browser navigates to the file | editor.html, editor-image-prompts.js |
| D20 | Accept PNG/JPG by file contents, not just MIME/name; do not fetch dropped http(s) URLs | Browser drops often omit type; fetching another site’s URL is blocked and looked like a “bad file” | image-store.js, editor-image-prompts.js |
| D21 | File drop: cancel `dragenter` and `dragover`, always `dropEffect = copy`, remember the box under the cursor, light it while a file is held over it | Paste already had the bytes. Safari skips `drop` if `dragenter` is not cancelled, and `dropEffect = none` (used when hit-testing missed) makes Finder withhold the file | `editor-image-prompts.js`, `.is-drop-target` in editor.html |
| D22 | Phone/narrow objective: measure width with a hidden mirror span; trim after `input`, never rewrite `input.value` on keydown | iOS Safari drops characters / breaks the caret if the field is rewritten mid-keystroke | `getObjectiveMirror()` / `enforceObjectiveWidthLimit()` in editor-ui-manager.js |
| D23 | Phone or narrow window uses the cube editor (one prompt at a time), not the desktop grid. Grid stays in the DOM as the data store. | A 4×N grid does not fit a phone; two DOM copies need an explicit live layout | `editor-prompt-cube.js`, `.prompt-cube-wrap` / `.editor-cube-layout` in editor.html |

---

## 2.1 Retired decisions

Not deleted, and numbers are never reused — a retired row records that the decision was
considered and dropped, so it doesn't get re-derived from scratch later.

| # | Was | Status | Why retired |
|---|-----|--------|-------------|
| D6 | Manually-added students get a `*` prefix and sort to the end of navigation | **Retired Aug 2026** — not needed in the current iteration | Depended on the mid-session "+" button, which no longer exists. Defensive asterisk-stripping survives in `data-manager.js` (lines 565–566, 768, 884) and `student-manager.js` (line 163), but nothing can add an asterisk, so the branches never fire. Harmless; left in place, not load-bearing. |
| D7 | Keyboard scheme: ↑/Enter = generate, ↓ = clear name, ←/→ = navigate students, C = toggle panel, ESC = editor | **Retired Aug 2026** — not needed in the current iteration | Described three bindings that don't match the code: ↓ advances to a new run slot rather than clearing the name (`keyPressed()` in `sketch-refactored.js`, down-arrow ~line 1482), C is a no-op because the control panel is hidden, and no ESC handler exists. The keyboard scheme is now plain behaviour documented in README.md, not a design decision needing preservation here. |

The underlying intent of D7 — *the desk loop must work without reaching for the mouse* —
still holds as a general principle. It just doesn't need a D-row pinning specific keys.

---

## D-005 — Delete buttons follow the theme primary color
**Date:** 2026-08-30 · **Status:** Active · **Touches:** theme-manager.js, editor.html, sketch.html

**Decision** `[ X ]` delete controls use `--delete-color`, and that variable is `var(--primary-color)` in every theme preset. Not a separate warning red.
**Why** Alec: the buttons should follow the theme’s primary color so the editor reads as one palette.
**Rejected** Keeping `#FF6B6B` on `--delete-color` in `theme-manager.js` (it was never even read — the buttons already used `--primary-color` directly).
**Consequence** On Windows/Black (white primary) delete is white, not red. The knob is `--delete-color`; do not hardcode a hex on the buttons.

---

## D-010 — Auto-save flushes the cube only in cube layout
**Date:** 2026-08-29 · **Status:** Active · **Touches:** editor-data-manager.js, editor-prompt-cube.js

**Decision** `saveChanges()` copies cube fields into the hidden grid only when `isCubeLayout()` is true. Leaving phone layout still flushes explicitly in `syncEditorLayoutMode()`.
**Why** Desktop typing in the prompt list was wiped ~0.6s later: auto-save always ran `flushPromptCube()`, which wrote the hidden empty cube over the grid, then saved the empty result.
**Rejected** Making `flushPromptCube()` itself a no-op when not in cube layout — `syncEditorLayoutMode()` turns the cube class off *before* it flushes, so that guard would drop the last phone edits on resize. Guarding only the auto-save path keeps the leave-cube copy.
**Consequence** Cube input / swipe / add / delete still flush on their own. Desktop auto-save reads the grid as-is.

---

## D-011 — Objective optional; only missing prompts block a run
**Date:** 2026-08-30 · **Status:** Active · **Touches:** editor-main.js, sketch-refactored.js

**Decision** The editor still warns when RUN is pressed with no objective, and Skip opens the prompting window. Once there, RUN / Up / Enter generate as long as at least one prompt list has options. An empty objective is simply not drawn on the card.
**Why** Skip was a dead end: the prompting window still showed “Waiting for user to input objective.” The only real blocker is an empty prompt list.
**Rejected** Dropping the editor warning entirely (objective is still worth prompting for) and a sticky `objectiveSkipped` flag (unnecessary once sketch stops gating on it).
**Consequence** Help and README describe objective as optional; reports still say “No objective set” when it’s blank.

---

## D-012 — Sentence vs word reveal (4+ words)
**Date:** 2026-08-30 · **Status:** Active · **Touches:** animation-manager.js, sketch-refactored.js

**Decision** Count whitespace-separated tokens. 1–3 words keep the original 50ms-per-letter scramble/reveal. 4 or more words (or a single token of 28+ characters) are sentences: scramble 8 flashes instead of 15. Reveal timing and pitch for sentences are D-014. On the card, sentences start a bit smaller, wrap to extra lines, and never scale below `CARD_FIT.MIN_PROMPT_SIZE`.
**Why** A sentence at 50ms/letter felt like a queue; shrinking the whole card to fit made it unreadable. Word count matches how teachers write lists (“paperclip” vs “a gift that surprises someone”).
**Rejected** Scramble-then-pop (too abrupt), treating any space as a sentence (would reclassify “laser cutter”). Word-by-word reveal was listed here as rejected, then adopted in D-014.
**Consequence** Knobs live in `TIMING` and `CARD_FIT`. Mixed columns (one word list, one sentence list) animate per prompt. Images are D-015.

---

## D-013 — Scramble hides chosen length
**Date:** 2026-08-30 · **Status:** Active · **Touches:** animation-manager.js

**Decision** While letters are spinning, scramble a *different* option from the same prompt column (length and spaces from that decoy). If the column has only one option, use a random mask of 6–18 characters. When reveal starts, switch to the real prompt.
**Why** Scramble used to be the same length as the answer, so you could read the result from the silhouette (`hat` vs a sentence) before it resolved.
**Rejected** Fully random 1–40 character noise (overflowed the card or looked tiny) and keeping the chosen length (the leak).
**Consequence** One layout snap at scramble→reveal is expected. A list where every option is the same length still can’t hide that length. Reveal-phase tail scramble matches the real text once locking has begun.

---

## D-014 — Sentence reveal is word-by-word at a different pitch
**Date:** 2026-08-30 · **Status:** Active · **Touches:** animation-manager.js

**Decision** Sentences land one word per tick (90–180ms, aimed at ~1s total). Each word plays `SOUND.WORD_REVEAL` at 880Hz. Letter scramble stays 440Hz; letter-by-letter reveal (1–3 word lists) stays 600Hz.
**Why** Sharing the scramble tick with sentence reveals made long lines sound like the same chatter. A higher, slightly longer ping marks “a word arrived.”
**Rejected** Keeping 600Hz for both reveal modes; speeding the 50ms letter clock (would still sound like scramble).
**Consequence** `WORD_REVEAL` frequency/duration are knobs next to `SOUND.SCRAMBLE`. Adopts the word-by-word path D-012 had rejected.

---

## D-015 — PNG/JPG as prompt options (local, skip scramble)
**Date:** 2026-08-30 · **Status:** Active · **Touches:** image-store.js, editor-image-prompts.js, editor-data-manager.js, animation-manager.js, sketch-refactored.js, data-manager.js

**Decision** A picture option is stored as the string `img:<uuid>` in the same `categories[header][grouping][]` arrays as text. The file itself lives in IndexedDB (`promptMeImages` / `blobs`). The editor hides those tokens: drop or paste PNG/JPG onto a prompt list, show a thumbnail with × to remove, and keep ids on `dataset.imageIds`. On the prompting window, skip letter-scramble, play the final ping, and draw the picture in a fitted slot (`CARD_FIT.IMAGE_SLOT`). Reports print `[image]`, not the token or the file. GIF/SVG/webp are rejected; max size 2MB (`IMAGE_MAX_BYTES`).
**Why** Teachers asked for pictures in the lists (F1). The draw rules (R1–R7) already treat options as opaque strings, so the randomizer does not need a new type. Scramble is a text effect — spinning letters over a picture would be nonsense. Reveal (show the chosen picture) is enough; we do not flash other images as a decoy.
**Rejected** Hosted/remote images (would add a backend this app does not have), embedding binaries in localStorage or CSV, scrambling/decoy-flashing other pictures, and GIF/SVG/webp (animation and scripting risk).
**Consequence** Sharing a CSV does not carry the files — another browser gets dead `img:` tokens unless the blobs are already in that machine’s IndexedDB. Same-browser refresh works because localStorage keeps the tokens and IndexedDB keeps the blobs. Hosted images remain an open F1 question. Wait-then-reveal treatment is D-017.

---

## D-016 — Picture wait is blinking dots, then reveal
**Date:** 2026-08-30 · **Status:** Superseded by D-017 · **Touches:** animation-manager.js, sketch-refactored.js

**Decision** While a picture option is waiting, show three dots that pulse in sequence (the Cursor “thinking” pattern). After `IMAGE_REVEAL_MS` (~1.2s), swap the dots for the image and play the final ping. Letter scramble is not used.
**Why** Instant pop felt unfinished; spinning letters on a picture is the wrong effect. Sequential dots are a familiar “something is coming” cue without leaking the result.
**Rejected** Keeping the 280ms pop from D-015; decoy-flashing other pictures; scrambling `img:` as text.
**Consequence** Knobs: `TIMING.IMAGE_REVEAL_MS` (how long the wait lasts) and `CARD_FIT.IMAGE_DOT_*` (size, gap, blink speed). Space still cancels the wait via `clearAnimations()`.

---

## D-017 — Picture wait ticks like scramble (sound + flicker)
**Date:** 2026-08-30 · **Status:** Active · **Touches:** animation-manager.js, sketch-refactored.js

**Decision** A picture option still does not scramble letters. During the wait, use the same clock as letter scramble: one tick every `SCRAMBLE_SPEED` (50ms), `SOUND.SCRAMBLE` (440Hz) each tick, and the three dots randomly bright/dim on that tick. After `IMAGE_SCRAMBLE_CYCLES` (15, same as a short word list), show the picture and play `SOUND.FINAL`.
**Why** A silent sine-wave “thinking” pulse did not feel like scramble. The chatter is the scramble; the dots are only a stand-in so we don’t spin `img:` as text.
**Rejected** Keeping D-016’s silent Cursor pulse; scrambling the `img:` token as letters; decoy-flashing other pictures.
**Consequence** Duration is cycle count × 50ms (~0.75s of chatter, then land). Tune `IMAGE_SCRAMBLE_CYCLES` or reuse `SCRAMBLE_SPEED` / `SOUND.SCRAMBLE`.

---

## D-018 — Empty prompt heading is omitted on the card
**Date:** 2026-08-30 · **Status:** Active · **Touches:** editor-data-manager.js, editor-settings-manager.js, data-manager.js, sketch-refactored.js

**Decision** If the prompt heading field is blank, the randomization card draws only the option — no heading row and no invented “PROMPT 1”. Storage still needs a unique key per column, so blanks are saved as `__blank_0`, `__blank_1`, … The editor shows those as empty. Legacy keys matching `PROMPT N` (the old auto-fill) are treated as unlabeled too.
**Why** “PROMPT 1” was a save fallback that leaked onto the student-facing card. A blank heading means the teacher does not want a label.
**Rejected** Drawing an empty line (still took space) and keeping “PROMPT 1” as a visible default.
**Consequence** Typing the literal name “PROMPT 1” is also treated as unlabeled. Reports omit the label prefix for unlabeled columns. CSV header cells may be empty.

---

## D-019 — Image thumbs inside the box; capture drops from other windows
**Date:** 2026-08-30 · **Status:** Active · **Touches:** editor.html, editor-image-prompts.js

**Decision** Thumbnails sit inside the same bordered box as the prompt list (the container holds the border, not the textarea). Drop listeners run in the capture phase and `preventDefault` for image/file drags so the browser does not navigate to the file. A drag may arrive as a `File` list; `data:` and `blob:` URLs may be read. Remote `http(s)` URLs are never fetched — that rule is D-020.
**Why** Thumbs below the box looked unfinished. Paste worked because it never navigates; drop from another window did, because we only claimed the event when `dataTransfer.files` was already filled.
**Rejected** Leaving thumbs as siblings under the textarea (the screenshot) and only handling Finder file lists.
**Consequence** Capture-phase `preventDefault` on `dragover` is what stops the new tab. Whether a URL-only drop can become a file is D-020 (it cannot, for `http(s)`).

---

## D-020 — Judge dropped pictures by their bytes; don’t fetch other sites
**Date:** 2026-08-30 · **Status:** Active · **Touches:** image-store.js, editor-image-prompts.js

**Decision** A dropped file is a PNG or JPG if its first bytes say so (89 50 4E 47 / FF D8 FF), even when the browser leaves `type` and `name` blank. Do not `fetch` an `http(s)` URL from a drag — that is blocked and was shown as “could not add that picture.” Size and real-type warnings stay. Paste and Finder files are unchanged.
**Why** An acceptable photo was triggering the same alert as a GIF. The drag was a URL, `fetch` failed, and we treated that like a bad file.
**Rejected** Keeping the fetch-and-warn path; accepting GIF/webp from sniff.
**Consequence** Dragging a picture from a web page may still do nothing if the browser only hands us a URL. Copy-paste or dropping the file from Finder still works.

---

## D-021 — Claim Finder drops the whole way down; never `dropEffect: none`
**Date:** 2026-08-30 · **Status:** Active · **Touches:** editor-image-prompts.js, editor.html

**Decision** Cancel `dragenter` and `dragover` for file/image drags, always set `dropEffect` to `copy` (never `none`), find the prompt box via `composedPath` / `elementsFromPoint` / last hover, and light that box (`.is-drop-target`) while a file is held over it. Safari’s `webkitGetAsEntry` is used when `getAsFile()` is empty. Snapshot the files in the `drop` handler itself — the browser empties `dataTransfer` after that function returns.
**Why** Paste put a thumb in the box; drag-and-drop did not. Safari often never fires `drop` unless `dragenter` is cancelled, and setting `dropEffect` to `none` when hit-testing missed the textarea made Finder refuse to hand over the file.
**Rejected** Fetching `http(s)` URLs from another tab (that is D-020 — blocked, looked like a bad file).
**Consequence** A picture dragged from a web page that only sends a URL still will not land (copy-paste or a Finder file will). The box lighting up is the signal that the drop target is live.

---

## D-022 — iOS objective: measure with a mirror span, trim after input
**Date:** 2026-08-30 · **Status:** Active · **Touches:** editor-ui-manager.js

**Decision** On phone/cube layout, the objective is one line the width of the window. Width is measured with a hidden off-screen `<span>` that copies the input’s font. Trimming happens on `input` / `compositionend` / paste / resize — never by rewriting `input.value` inside `keydown` or `beforeinput`.
**Why** iOS Safari only registered one character when the field was rewritten mid-keystroke (caret and IME broke).
**Rejected** `preventDefault` on keydown to block extra characters, and measuring by assigning to `input.value` then reading `scrollWidth`.
**Consequence** Desktop/grid objective is unconstrained. Phone overflow is silently trimmed to what fits.

---

## D-023 — Phone/narrow editor is the cube, not a squeezed grid
**Date:** 2026-08-30 · **Status:** Active · **Touches:** editor-prompt-cube.js, editor.html

**Decision** When the window is phone-narrow (`max-width: 640px`, or `max-width: 900px` and `max-aspect-ratio: 3/4`) — or when returning from sketch after leaving in that layout (`sessionStorage` `promptMeEditorLayout`) — show the cube: one prompt at a time, swipe or ‹ › between prompts, swipe up/down between groupings, `+` to add. The desktop grid stays in the DOM, visually hidden, as the data store. Prompt headings are editable on grouping A only; other groupings inherit the heading.
**Why** A 4-column grid does not fit a phone. Hiding the grid without removing it keeps one save path.
**Rejected** A responsive squeezed grid, and a second data model for phone.
**Consequence** Two DOM copies of the same lists. Auto-save must not flush the empty hidden cube over the grid — that guard is D-010, not this row.

---

## 3. Known drift (flag, don't silently "fix")

- ~~CHANGELOG's documented module line counts no longer match actual file sizes.~~
  **Resolved Aug 2026** — counts corrected and the false ones retracted in CHANGELOG.txt.
  Expect them to go stale again: they are a snapshot, not a live figure. Re-measure with
  `wc -l` before citing a count anywhere, and don't treat the listed numbers as current.
- **Control scheme has no drift guard.** Retiring D7 left `README.md` as the only record of
  what the keys and buttons do. It mirrors `keyPressed()` in `sketch-refactored.js`
  (starts ~line 1422) plus the button wiring in `ui-manager.js`, and nothing enforces that
  they agree — this already bit once, when Space was documented as "generate" while the code
  only used it to interrupt a running scramble. When you change a binding or a button label,
  update README.md's Controls tables in the same turn.
- Heavy `console.log`/`debugLog` density in data-manager.js and sketch-refactored.js — likely a mix of "still needed" and "debugging residue from a specific past bug." Needs a human pass (Alec), not an automatic strip, since some of these were added to catch real recurring bugs (see CHANGELOG's many "Fixed: variable scope" entries).

---

## 4. Future directions (captured, not yet decided)

Nothing in this section is a decision — these are directions Alec wants to
explore. Do not build against these without confirming scope first; they're
here so the reasoning isn't lost between conversations.

- **F1 — Multi-format prompts.** Short words and full sentences are in (D-012 / D-014). Local PNG/JPG options are in (D-015): drop onto a prompt list, `img:` token in the pool, blob in IndexedDB. Still open: hosted/external images (lighter storage, but a backend this app does not have).
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
  knobs elsewhere in this doc. Connects to F1/D-015/D-017: pictures skip letter
  scramble and chatter on the same beep clock with flickering dots, then appear.
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

1. **Before styling or interaction changes:** check here first — a "weird" number or color may be load-bearing (see D3).
2. **After a visual/UX change:** add or update a row here only if a future session could plausibly mistake the choice for a bug and revert it. Routine visual tweaks are CHANGELOG-only. Same test as `RANDOMIZER_LOGIC_SPEC.md` (decision, not log). See Documentation routing in `.cursorrules`.
3. **Audit:** periodically ask "for each design decision a user would notice, is there a D-row and a comment at the code site, or is the reasoning only in CHANGELOG.txt?"
