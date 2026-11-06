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
| D1 | Theme is one saved preference (`localStorage` key `selectedTheme`), applied on editor, sketch, index, and theme.html. Missing key → **windows**. Each page’s CSS `:root` is only a flash-before-JS fallback (editor.html currently greenCRT-like values; sketch.html currently Chocolate `#D2691E`) and is overwritten once `applyThemeFromStorage()` runs. Not a fixed editor-orange / sketch-green split. | An activity should look like itself in both rooms | `applyThemeFromStorage()` in theme-manager.js; called from editor.html, sketch.html, index.html, theme.html, sketch-refactored.js |
| D2 | VT323 is the **factory default** font. A preset may override family, size, and style via `--ui-font*` (D-026). Missing customization → VT323 at 18px regular. | Retro terminal aesthetic, ties to Apple II control panel concept | `--ui-font`; Google Fonts links; theme-manager.js `THEME_FONTS` / `THEME_FONT_STYLES` |
| D3 | Prompt headers align with grouping columns via CSS grid knobs `--column-width` (200px) and `--grid-gap` (40px). A `.header-placeholder` cell occupies the first column so headers sit over the option boxes, not the grouping labels. | Headers must line up with the cells below | editor.html `:root` and `.prompt-grid`; `editor-ui-manager.js` rebuilds the grid using those variables |
| D4 | Delete buttons render as orange `[x]` in brackets, not circles | Cleaner look, less visual noise than circle+icon | editor-ui-manager.js |
| D5 | Delete `[ X ]` follows the theme’s `--primary-color` (via `--delete-color`). Not a separate warning red. | Chrome should read as one palette; a leftover `#FF6B6B` in theme presets was unused and would have fought that | `theme-manager.js` presets; `.delete-prompt` / `.delete-category` in editor.html |
| ~~D6~~ | *Retired — see 2.1* | | |
| ~~D7~~ | *Retired — see 2.1* | | |
| D8 | Theme system (8 presets: orangeCRT, blueCRT, windows, greenCRT, purpleCRT, pinkCRT, macintosh, black) is **fully live** — CHANGELOG's "THEME SYSTEM REMOVAL" entry is simply wrong, not a sign this was meant to go away. Picker lives on `theme.html` (D-024), not in the editor `...` dropdown. | This is now understood as the seed of F5's "teachers can style it their way," not legacy weight — direction is to grow it, not decide whether to delete it | theme-manager.js + editor.html, sketch.html, index.html, theme.html |
| D9 | *Superseded by D-063 — grouping labels in the prompting window identify which rows to draw from.* | Identification was unsolved; the control was hidden | `prompt1InterestsMode` storage key kept |
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
| D24 | Theme picker is a dedicated `theme.html` page (8 preset cards). The editor `...` panel’s Theme dropdown is **gone**, replaced by a Customize link. Hidden `#theme-select` stays in the editor for legacy `.value` reads. **Panel order is D-056.** | Alec: “remove old one.” A future session restoring the dropdown would duplicate the picker. | editor.html settings panel; theme.html; theme-manager.js still syncs `#theme-select` |
| D25 | Reveal animation is a fill-then-resolve overlay. Custom drawings persist in `localStorage` (`revealAnimation`) and as a downloadable JSON file (not IndexedDB). **Per-activity snapshot is D-055.** `sketch.html` plays the saved mode. Grid size and frame count: **D-032**. Film clock: **D-035**. Landing: **D-036** (paper tiles lift, prompts show through). Film and lift **overlap** (**D-037**). Film notes: **D-040**. | Filling the card first masks word vs phrase vs image. IndexedDB is for PNG blobs (D-015); this payload is small. | `reveal-animation.js`, theme.html, animation-manager.js, sketch-refactored.js |
| D26 | Each of the 8 presets can be tuned (ink, paper, stroke, glow, font family, size, style) without a ninth theme. Overlays in `themeCustomizations`. **Factory** restores that preset. The 8 cards are the thumbnails (**D-033**). Ink/paper/stroke use curated swatches (**D-030**). | Alec: restyle a chosen look as the room. Flattening knobs into factory objects would wipe edits. | `getThemeKnobs` / `resolveThemeCss`; Tune panel on theme.html |
| D27 | One leftover-card preview canvas for both reveal modes. Custom pixels default to **theme ink** (`1` in the frame data) so they follow the live preset; extra palette colors store `#rrggbb`. No separate custom-play canvas; no convergence-preview section. | A second frame under the editor duplicated the preview. Hardcoding white (or collapsing hex to 0/1) would look like the palette was broken. | `theme.html` `#reveal-preview`; `REVEAL.PIXEL_PALETTE`; `normalizeRevealCell()` |
| D28 | Reveal cells stay **square** and sit in the **middle of the card**, whatever the window aspect. Gutters and off-cells are `--background-color`. Objective sits **under the name field** (full inner width). Prompts cluster in the remaining space below. Overlay starts below the objective so the title stays visible during scramble. | Stretching cells to the leftover strip made a wide window look like a smeared barcode. Putting the objective in the prompt cluster hid it under the scramble and pulled it off the name row. | `revealSquareGridMetrics()`; `drawPixelRevealOverlay()`; `CARD_FIT.OBJECTIVE_BELOW_NAME*` |
| ~~D29~~ | *Superseded by D-032 — fixed 10×10 / 8 frames.* Saved 16×16 / 10-frame JSON was resampled rather than cropped. | Alec then asked for teacher-chosen size/count (D-032). | `resampleRevealFrame()` still used |
| D30 | Ink, paper, and stroke are picked from four curated web-color palettes (Pastel, Primary, Neon, Shades), not the OS `<input type="color">` picker. Existing off-palette hexes still display until a swatch is chosen. | Alec: less extensive, like Illustrator web swatches. Restoring the native picker would look like a “fix” for a missing color well. | `THEME_SWATCH_GROUPS` in theme-manager.js; chips + grid on theme.html |
| D31 | Custom film strip is **centered** above the draw grid. Frames **drag to reorder**. **Shift** while drawing flips pen/eraser. **Shift-click** selects a frame range. Clear Frame empties the selection; Reset All empties every frame. | Alec: timeline-style edit, not a left-aligned strip with one tool at a time. Restoring click-only selection or a non-flipping Shift would look like a bug. | `theme-page.js` `selectFilmFrame` / `reorderFrames` / `drawingUsesEraser`; `#reset-all-frames` |
| D32 | Teacher chooses reveal **grid size** (6–20) and **frame count** (2–12). A new animation (empty storage) starts at **6×6 / 2 frames**. An already-saved animation keeps its size and count (clamped). Changing the grid **resamples**. Shrinking the count **parks** leftover frames (**D-041**); it does not delete them. | Alec: min 6×6, max 20×20, 2–12 frames, default 2 frames 6×6. A future session restoring a hardcoded 10×10 / 8 would look like a “fix” against D-029. | `REVEAL.GRID_SIZE*` / `FRAME_COUNT*` in reveal-animation.js; sliders on theme.html |
| D33 | Tune is compact. Palette tiles **span the panel**. The 8 cards are leftover-card **thumbnails**. **Save look** stamps knobs onto that thumbnail. **Factory** recalls factory for that preset. **Use on [activity]** stamps preset + knob snapshot onto the open activity. Loading that activity restores the snapshot. CSV still only the preset id. | Alec: palette full width; save in thumbnail; recall defaults; apply to project; less spread out / phone-friendly. A second leftover-card mock under Tune duplicated the cards. | theme.html Tune panel; `commitThemeLook` / `applyThemeToCurrentActivity` / `restoreActivityTheme` |
| ~~D34~~ | *Superseded by D-036 — overlay resolved to paper, held 1s, then the prompts popped on.* Punch-through during the film is still rejected. | Alec then asked for a paper-tile puzzle over the results, not a blank beat. | `REVEAL.HOLD_MS` remains as an unused knob |
| D35 | Sketch **plays the film on `FRAME_MS`** (same as Customize Play), for at least one full loop. Default geometric uses one stable blob per frame slot, not a new random walk every sound tick. During lift the playhead **keeps moving** on leftover tiles (**D-037**). Custom film is not flickered (**D-044**). | Alec: looked like noise then prompt, not scrambling. Stepping the film on the 50ms sound clock strobed the drawing. | `REVEAL.FRAME_MS`; `getRevealDecoyFrame(state, tick, flickerSalt)`; `startPixelRevealAnimation()` |
| D36 | Lifted tiles are not drawn — the word or picture shows through. Leftover cells are **paper** (hides the result) with the film still painted on them. Shuffle order. No blank hold. | Alec: like a puzzle covering the results; as pieces lift, elements appear. Tiles match the background. | `ranksPuzzleShuffle()`; `drawPixelRevealOverlay()` |
| D37 | Film and lift are **one motion**. Holes open before the cover period would have ended (`REVEAL.OVERLAP`). Leftover tiles keep playing the film — do not freeze the last frame and switch to a dead paper grid. One full loop stays fully covered. | Alec: looked like 2 processes. The hard cut (film stops, then paper mosaic) was the second act. | `REVEAL.OVERLAP`; `revealLiftStartTick()` |
| D38 | Prompt pictures fill **leftover** height after name, objective, labels, and text. Width is the inner card (not the square text wrap). `IMAGE_SLOT*` is the floor. Multiple pictures split the leftover. **Live dest is D-053** (film square). | Alec: bigger, or as big as other elements allow. Restoring 110px as the drawn size would look like a regression. | `imageSlotH` in `sketch-refactored.js`; `CARD_FIT.IMAGE_SLOT*` |
| D39 | Prompt **labels** mix toward paper (`LABEL_MIX`) so they recede from the chosen values. Not `0.8 ×` primary (too close to full ink on black). Objective and name stay as they were. | Alec: labels needed more contrast from the prompts. Restoring 0.8× would flatten WITH/USING back into ALEC/FACE. | `CARD_FIT.LABEL_MIX`; `labelInkRgb()` |
| D40 | Pixel-film plays **one note per frame** from a pentatonic (`FRAME_SCALE_HZ`), on the playhead — not a beep every 50ms. Customize **Play** uses the same helper. Letter-scramble / image-dot keep 440Hz chatter. Which degree each frame uses: **D-042**. | Alec: try different sounds; a sound for every frame. Walking a scale is the score; teachers already pick the pictures. | `playRevealFrameSound()`; `REVEAL.FRAME_SCALE_HZ` |
| D41 | Lowering **Frames** parks leftover drawings (and their notes) past `frameCount`. Raising it restores them. **Reset All** is what actually throws parked frames away. Play / RUN only use the live count. | Alec: 12→2→12 erased frames 3–12. Restoring a truncate would look like a “fix” against disk size. | `normalizeRevealState()`; `applyRevealShape()` |
| D42 | Each live frame has a **scale degree** (`notes[]`), shown on the thumbnail. Click cycles. Never arbitrary Hz — every pick stays in the pentatonic or mute (**D-043**). Defaults to the D-040 walk. Saved in `revealAnimation` / the JSON file. | Alec: a way to change the tone of each frame, always harmonic. A Hz picker would let two frames clash. | `state.notes`; `.film-note`; `revealFrameNoteIndex()` |
| D43 | *Superseded by D-049 — scale is now C-1 through C3, then mute. Mute still 0 Hz.* | Alec then asked for another octave up and below. | `FRAME_SCALE_*` |
| D44 | Custom film plays **as drawn**. Flicker does not punch holes in it. During lift, leftover geometric tiles also stop flickering. Playtime decoy is resampled to the live grid so leftover cells are not empty paper. | Alec: a square/chunk blacked out while shuffling. 3% flicker on a 20×20 grid flips a dozen cells per tick. | `getRevealDecoyFrame()`; `normalizeRevealFrame()` |
| D45 | First **RUN** starts the film; it **loops** until **STOP**. STOP starts the paper-tile land (**D-048**), not an instant drop. No timed ending (**D-047**). Space still aborts and clears. | Alec: run to animate, second hit to stop. A few-second auto-end is not start/stop. | `skipRevealToResult()`; `startGeneration()` |
| D46 | Land ping (when the overlay drops) is a teacher-chosen scale degree on Customize (**Land**), same pentatonic including mute. Default **C2**. Not the old 1200 Hz chirp. | Alec: allow design of the final reveal sound. | `state.finalNote`; `playRevealFinalSound()`; `#final-note` |
| D47 | Pixel film **does not auto-complete**. It loops fully covered until STOP. Tile lift on a timer is unused while holding. | Alec: still timed; plays a few seconds then stops. Customize Play already loops until Pause. | `startPixelRevealAnimation()` tick |
| D48 | STOP lifts paper tiles with **rapid gated low tones** (C-1…G-1, one per tick), then the land note. Noise hiss rejected (read as a drum). | Alec: edit the glitch sound; shhh sounded like a random drum; rapid low / interrupted tones that match the transition. | `playRevealTransitionSound()` on lift ticks |
| D49 | Scale is C-1 … C3 (pentatonic) then mute. Saved v5 indices remap so C still means C. Default land stays C2. | Alec: another octave up and below; highest C3, lowest C-1. | `FRAME_SCALE_HZ` / `FRAME_SCALE_NAMES`; `migrateRevealNoteIndex()`; `FILE_VERSION` 6 |
| D50 | Ink-filled buttons (highlighted / RUN / GO TO NEXT / …) use **paper** for the label (`--on-primary-color`). Not hardcoded black. Outline / muted / hover: **D-054**. | Alec: Macintosh highlighted buttons hid the text (black on black). | `--on-primary-color`; sketch.html; editor.html; theme.html |
| D51 | First RUN / Up plays a **600 Hz start chime** (same family as left 300, down 400, right 500). The first film note waits until the playhead actually moves. No Mac-click on RUN. | Alec: start chime on first press was more tuneful before and complemented left/right/down. | `SOUND.START`; `startGenerationInternal()` |
| D52 | During STOP land, prompt **words scramble in the holes** and lock as tiles lift. Not finished text sitting under the film. Pictures: **D-053**. | Alec: the text should reveal as glitch too, not only be under animation. | `applyPixelLandGlitch()` |
| D53 | Pictures are **cover-cropped to the film square**. During lift they paint **one cell at a time**. After land they stay that square — edges do not grow to leftover width. | Alec: edges of the image grew suddenly; uniform and did not match the glitch. | `drawPromptImageInFilmSquare()` |
| D54 | Button glyphs set `-webkit-text-fill-color` to the **same token as `color`** (paper on ink fill, ink on paper chips). Not `currentColor` — native `<button>` may paint ink (ButtonText) and hide Macintosh GO TO NEXT / RUN. | Alec: Macintosh screenshot/report/clear/edit and RUN labels vanished; later GO TO NEXT was a solid ink bar. | `styleChromeLabel()`; `.sketch-run`; `.sketch-next-btn` |
| D55 | The live film is also stored on the open activity (`promptSettings` / `promptCategories.revealAnimation`). Loading that activity restores it. **Restore defaults** on Customize returns to factory geometric 6×6 / 2 frames. CSV still does not carry frames. | Alec: does the custom animation save with Activity History; there should be a button to restore to defaults. A future session treating the film as browser-global-only would look like a regression. | `stampRevealOnCurrentActivity()`; `#restore-anim-defaults` |
| D56 | Editor `...` panel order: **FILE** (top), Help & Instructions, **Customize** (advanced, under Help), Activity History. Label is **FILE**, not File. | Alec: Customize is too prominent; Rando should be as simple to operate as possible. Restoring Customize to the top would look like a “missing” first item. | `editor.html` `#settings-panel` |
| D57 | Share quotes CSV cells (RFC 4180). Pictures download as a zip (`activity.csv` + `media/<id>.png\|jpg`) after SHARE / CANCEL. No pictures → plain `.csv`. Load accepts `.csv` or `.zip`. Not base64 in the CSV. | Commas in sentences were split on Load. D-015 forbade binaries in the CSV; a folder-with-media pack is the share path. | `activity-pack.js`; `exportSettings` / `importSettings` |
| D58 | Empty Custom film does **not** play Default Pattern. RUN uses letter scramble (pictures: flicker dots). Default Pattern still plays the geometric film. | Substituting the factory blobs made Reset All / a blank custom look like the default animation. | `revealUsesPixelFilm()`; `startScrambleAnimation()` |
| D59 | Leftover-card **frame** is its own Tune knob (0–8px, 0 = none). Chrome Stroke size stays 1–6. Missing `cardStroke` on an old overlay keeps the old outline (`strokeWidth + 3`). | Stroke size could not turn the prompting-page card border off (it always added 3px). | `--card-stroke-width`; `sketchCardStroke()` |
| D60 | *Superseded by D-061 — leftover-card objective is sentence case, centered, last wrap line at least 3 words.* | Alec then asked for sentence case and a fuller second line. | `toSentenceCase()` / `balanceLastWrapLine()` |
| D61 | Leftover-card objective is **sentence case**, **centered**. 6+ words wrap to two even lines; last line is never 1–2 leftover words. Prompt headings stay ALL CAPS / centered. | Title Case + left looked like a heading; a one-word wrap (“That…”) looked unfinished. | `toSentenceCase()`; `wrapObjectiveToWidth()`; `CARD_FIT.OBJECTIVE_MIN_LAST_LINE_WORDS` |
| D62 | *Superseded by D-066 — History restore and first-visit are the three classroom sessions, not the sample trio.* | First-timers should only see SIMPLE / SOD+A / SOD+A w/ Groupings. | sample CSV files remain in the repo |
| D63 | **Students pick grouping** (editor, 2+ rows): grouping labels are tappable chips on the prompting window. Draw uses the selected row. Do not skip Prompt 1. Off by default. **One chip at a time: D-064.** | Alec: robotics vs pottery should get different rows; identification is the grouping label itself. | `#grouping-select-row`; `#grouping-picker`; `prompt1InterestsMode` |
| D64 | Grouping chips are **radio**: tapping one deselects the others. Exactly one is on. First row is the default if nothing was stored. | Alec: only one active button at a time. | `selectGroupingChip()` |
| D65 | Three classroom sessions always restore in History if missing: **SIMPLE**, **SOD+A**, **SOD+A w/ Groupings**. Groupings session is physical / digital / **textiles**, Students pick grouping on. History click uses the saved copy (not a CSV reload), so later desk edits stick. First-visit default is **D-066**. | Alec: set up three prompt sessions in memory; then bake the live groupings lists. | `WORKSHOP_SESSIONS`; `SIMPLE.csv`; `SOD-A.csv`; `SOD-A-w-Groupings.csv` |
| D66 | New browsers restore **only** SIMPLE, SOD+A, SOD+A w/ Groupings. First-visit opens **SIMPLE** and a three-step walkthrough (pick / edit / run). Help is the same short Run / Edit / Save path. D-062 sample names are not auto-restored. | Alec: if we push, they should only see the three; new teachers need concise run / edit / save, with GO TO NEXT defined. | `ensureBakedSamplesInHistory()`; `EDITOR_TOUR_STEPS`; Help popup; `index.html` welcome |
| D67 | Leftover-card name field shows placeholder **name** (dim) and a bottom rule when empty. Names stay optional. | Alec: on load it was not clear a space to type a name existed. Placeholder was a space on a transparent input. | `NAME_FIELD`; `.sketch-name-input` |

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

**Decision** A picture option is stored as the string `img:<uuid>` in the same `categories[header][grouping][]` arrays as text. The file itself lives in IndexedDB (`promptMeImages` / `blobs`). The editor hides those tokens: drop or paste PNG/JPG onto a prompt list, show a thumbnail with × to remove, and keep ids on `dataset.imageIds`. On the prompting window, skip letter-scramble, play the final ping, and draw the picture in the film square (D-053; `CARD_FIT.IMAGE_SLOT` is the fallback floor). Reports print `[image]`, not the token or the file. GIF/SVG/webp are rejected; max size 2MB (`IMAGE_MAX_BYTES`).
**Why** Teachers asked for pictures in the lists (F1). The draw rules (R1–R7) already treat options as opaque strings, so the randomizer does not need a new type. Scramble is a text effect — spinning letters over a picture would be nonsense. Reveal (show the chosen picture) is enough; we do not flash other images as a decoy.
**Rejected** Hosted/remote images (would add a backend this app does not have), embedding binaries in localStorage or CSV, scrambling/decoy-flashing other pictures, and GIF/SVG/webp (animation and scripting risk).
**Consequence** The CSV itself still does not embed binaries (that rejection stands). Teacher-to-teacher Share with pictures is a zip pack — D-057. Same-browser refresh works because localStorage keeps the tokens and IndexedDB keeps the blobs. Hosted images remain an open F1 question. Wait-then-reveal treatment is D-017. How big the picture draws on the leftover card is D-038.

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

## D-024 — Theme picker moved off the editor dropdown
**Date:** 2026-08-30 · **Status:** Active · **Touches:** editor.html, theme.html, theme-page.js, theme-manager.js

**Decision** Theme selection lives on `theme.html` as 8 clickable preset cards. The `theme-menu-dropdown` block (`theme-menu-trigger` / `theme-menu-list`) is removed from the editor `...` panel. That slot is a **Customize** button to the new page. File / Help / Activity History stay. The hidden native `<select id="theme-select">` stays in the editor DOM and stays synced by `changeTheme()` / `syncThemeMenuSelection()`, because `editor-settings-manager.js` and `editor-data-manager.js` still read `theme-select.value`.
**Why** Alec: relocate the picker onto its own page and “remove old one.” Cards re-skin the whole page live via the existing `changeTheme()` path (D1 / D8).
**Rejected** Keeping the dropdown in parallel; deleting `theme-select` (legacy readers would fall back to `selectedTheme`, but activity save/load still writes the select).
**Consequence** Do not restore a Theme dropdown in the settings panel. The leftover `initThemeMenuDropdown()` in theme-manager.js no-ops when those nodes are missing — that is not a sign the picker should come back. Customize at the top of the `...` panel is D-056, not this row.

---

## D-025 — Fill-then-resolve reveal; localStorage + downloadable JSON
**Date:** 2026-08-30 · **Status:** Active · **Touches:** reveal-animation.js, theme.html, theme-page.js, animation-manager.js, sketch-refactored.js, sketch.html

**Decision** Scramble is a fill-then-resolve overlay that first fills the leftover card so you cannot tell word vs phrase vs image, then a paper-tile puzzle lifts so the result shows through (D-036). The film clock is D-035. Default mode uses a geometric decoy; Custom is hand-drawn frames. The active animation is stored in `localStorage` key `revealAnimation`, and can be downloaded / loaded as a JSON file (`kind: rando-reveal-animation`). The prompting window (`sketch.html`) reads that saved animation. Not IndexedDB. **Grid size and frame count live in D-032** (this entry originally specified 16×16 / 10 frames; D-029 then fixed 10×10 / 8). **A copy on the open activity is D-055.**
**Why** Alec: mask type during scramble; persist like `selectedTheme` but also be downloadable for recall on another machine. Frame data is a few kilobytes — D-015’s IndexedDB is for PNG/JPG blobs.
**Rejected** IndexedDB persistence; editor-only preview that sketch would ignore; shrinking the *pixel size* independently of the grid (only how many cells are still noise changes). 10×10 was rejected here, then adopted in D-029, then made teacher-chosen in D-032.
**Consequence** Letter-scramble and image-dot paths remain in animation-manager.js as fallback if `reveal-animation.js` does not load, **and when Custom is empty** (D-058). Do not “fix” the overlay by sizing it to the chosen prompt — that would leak the type. Tune grid size / frame count from Customize (D-032), not by hardcoding `REVEAL.GRID_SIZE`. Do not punch through before one full film loop (D-037). Landing is D-036. Do not step the film on the 50ms sound clock — that is D-035. Film notes follow the playhead (D-040). Do not fill empty Custom with the factory geometric decoy — that is D-058.

---

## D-026 — Per-preset theme knobs, not a ninth theme
**Date:** 2026-08-30 · **Status:** Active · **Touches:** theme-manager.js, theme.html, theme-page.js, sketch-refactored.js, ui-manager.js, editor.html, sketch.html, index.html

**Decision** Each of the 8 factory presets can be tuned: ink (primary), paper (background), stroke color, stroke size (1–6px), glow (shadow alpha), font family (a short list; VT323 remains the default), font size (12–28px), and font style (regular / italic / bold / bold italic). Edits are stored per preset id in `localStorage` key `themeCustomizations`. `resolveThemeCss()` starts from the factory `themes` object and overlays knobs; it does not mutate the factory. **Factory** clears only that preset’s overlay. Not written into activity CSV (an activity snapshot is D-033). The Customize page chrome and the 8 cards show the look; the leftover-card mock under Tune was removed as duplicate (D-033).
**Why** Alec: teachers should restyle a chosen look as their room, not only pick a canned swatch; they need to see those changes on Customize because they affect the other windows. Keeping overlays separate means factory Windows/Green CRT stay recoverable.
**Rejected** A ninth “Custom” preset (hides which room you started from); putting knobs into the factory objects (un-resettable); exposing every CSS variable (F5 — low floor).
**Consequence** Do not “simplify” by writing ink/paper back into `const themes`. Glow derives `--primary-shadow*` from ink + the glow knob. Stroke size sets `--stroke-width` / `--panel-stroke-width`. Leftover-card outline is `--card-stroke-width` (D-059), not chrome stroke + 3. Font loads extra Google Fonts on demand. Size/style set `--ui-font-size` / `--ui-font-style` / `--ui-font-weight`. Ink/paper/stroke wells are curated swatches (D-030), not the OS color picker.

---

## D-027 — One leftover-card preview; pixels default to theme ink
**Date:** 2026-08-30 · **Status:** Active · **Touches:** theme.html, theme-page.js, reveal-animation.js, sketch-refactored.js

**Decision** The Default Pattern window (`#reveal-preview`) is the only card-shaped preview. Custom Play runs there; do not add a second playback canvas under the drawing grid. Convergence Preview (sample word BIKE + slider) is gone — the prompting window is the place that resolve is judged. Custom cells store `0` (empty), `1` (theme ink, follows `--primary-color`), or a `#rrggbb` from the palette. The pen starts on Theme.
**Why** Alec: don’t need a convergence preview; the default window should preview custom animation; pixels need a palette but should default to the global theme. A future session “fixing” theme-ink cells to a baked white would make the palette look broken when the theme changes.
**Rejected** A second preview under Custom; baking the current ink hex into every new stroke (would freeze pixels against later Tune knobs).
**Consequence** `normalizeRevealFrame` must not collapse truthy cells to `1` — that would strip palette colors. Old JSON with 0/1 still loads. Tune `PIXEL_PALETTE` in `REVEAL`.

---

## D-028 — Square reveal grid, centered cluster
**Date:** 2026-08-30 · **Status:** Active · **Touches:** sketch-refactored.js, reveal-animation.js

**Decision** The grid uses the largest **square** cell that fits in the inner card, then centers that grid. Do not set cell width and height independently from the card’s aspect. Empty cells and the gutters around the square are `--background-color`. On-cells use theme ink or a palette hex (D-027). The overlay covers the inner card **below the objective** (which sits under the name field), not a leftover strip under the current heading and not over the title. Prompt list is a cluster, vertically centered in the remaining space, wrapped to that square width so they stay inside the card.
**Why** Alec: widening the window stretched the leftover strip into a barcode; negative space should be background; the name field and objective belong together at the top; the chosen prompt(s) should sit in the middle of the remaining card.
**Rejected** Filling the whole wide card with non-square cells; shrinking the overlay to the prompt’s bounding box (leaks word vs phrase vs image — D-025); keeping the objective inside the prompt cluster (it disappeared under the scramble and sat away from the name).
**Consequence** `CARD_FIT.REVEAL_INSET` / `OBJECTIVE_BELOW_NAME*` / `OBJECTIVE_PROMPT_GAP*` are the knobs. Do not restore the objective as a “push prompts down” spacer inside the cluster. p5’s default clear is white — `html`/`canvas` use `--background-color`, and overlay drawing uses p5 `push`/`pop` (not raw clip) so a missed frame does not flash white. One fill-then-resolve per RUN (not one per prompt column) — a second scramble in a row is a bug, not leftover-strip sequencing.

---

## D-029 — Reveal is 10×10, 8 frames
**Date:** 2026-08-30 · **Status:** Superseded by D-032 · **Touches:** reveal-animation.js, theme.html, theme-page.js, sketch-refactored.js, animation-manager.js

**Decision** `REVEAL.GRID_SIZE` is 10 and `REVEAL.FRAME_COUNT` is 8. Saved animations with the old 16×16 / 10-frame shape are resampled on load (`FILE_VERSION` 3) rather than cropped cell-by-cell. Fill-then-resolve behaviour and `localStorage` / JSON persistence stay D-025.
**Why** Alec: 8 frames, not 10; grid 10×10, not 16. Coarser cells are easier to draw and read at leftover-card size.
**Rejected** Keeping 16×16 (D-025’s original size); padding extra empty frames to 10; dropping old drawings instead of resampling.
**Consequence** Do not restore 16×16 / 10 frames as a “bug fix” against D-025’s old Rejected line. Size and count are now teacher-chosen (D-032). `resampleRevealFrame()` remains the load path for a mismatch.

---

## D-030 — Curated web-color swatches, not the OS picker
**Date:** 2026-08-30 · **Status:** Active · **Touches:** theme-manager.js, theme.html, theme-page.js

**Decision** Ink, paper, and stroke are three target chips plus a shared swatch grid in four groups: **Pastel**, **Primary**, **Neon**, **Shades** (`THEME_SWATCH_GROUPS`). No `<input type="color">`. Names follow the CSS/web set Illustrator uses; Neon and Shades also include factory CRT inks and papers so Reset colors stay pickable. A hex already stored that is not in any group still shows on the chip until the teacher picks a swatch — do not snap it.
**Why** Alec: the OS picker is too extensive; Illustrator’s web swatches are the model — a short named grid, grouped.
**Rejected** Keeping the native color well; dumping the 216 web-safe colors; snapping old custom hexes onto the nearest swatch on load.
**Consequence** Tune the four arrays in `THEME_SWATCH_GROUPS`. Do not “fix” a missing rainbow by restoring `type="color"`. Pixel-draw palette (`REVEAL.PIXEL_PALETTE`) is a separate control (D-027).

---

## D-031 — Film-strip timeline: center, drag, Shift-flip, multi-select
**Date:** 2026-08-30 · **Status:** Active · **Touches:** theme.html, theme-page.js, reveal-animation.js

**Decision** Custom frames sit in a **centered** row above the draw grid. Drag a thumbnail to a new slot to reorder `state.frames` (numbers 1–N stay in strip order). **Shift** while drawing inverts the parked tool (pen erases, eraser draws). **Shift-click** selects an inclusive range from the last plain click; the outlined frame is the one the pen paints. **Clear Frame** empties every selected frame. **Reset All** replaces the whole sequence with empty frames, including drawings parked by lowering Frames (D-041). No confirm dialog. Frame count and grid size are D-032.
**Why** Alec: frames in the middle above the grid; drag to move a frame; Shift as the opposite of the current tool; reset all or shift-select many.
**Rejected** Left-aligned scrolling strip; HTML5-only drag (weak on touch — pointer distance threshold instead); snapping Shift to “always erase.”
**Consequence** Do not treat Shift-draw as a stuck eraser. Tune the drag threshold (`8px`) in `bindFilmStrip`. Copy to Next / Copy Previous still act on the outlined frame only.

---

## D-032 — Teacher-chosen grid size and frame count
**Date:** 2026-08-30 · **Status:** Active · **Touches:** reveal-animation.js, theme.html, theme-page.js, animation-manager.js, sketch-refactored.js

**Decision** Customize has two sliders: **Grid** 6–20 (square) and **Frames** 2–12. Factory default when nothing is saved is **6×6 and 2 frames**. An already-saved animation keeps its `gridSize` and `frameCount` (clamped into those ranges) — do not snap an existing 10×10 / 8-frame drawing down to 6×6 / 2 on load. Changing the grid **resamples** every stored frame, including parked ones (D-041). Sketch and the leftover-card preview play `frameCount` frames, not `frames.length`. `FILE_VERSION` 5 (stash + notes; was 4 in this entry).
**Why** Alec: min 6×6, max 20×20, max 12 frames, min 2, default 2 frames 6×6.
**Rejected** Keeping a hardcoded 10×10 / 8 (D-029); snapping every old save to the new default; cropping instead of resampling when the grid changes.
**Consequence** Do not “fix” a 10×10 save by rewriting it to 6×6. Decoy fill (~25%) and resolve ticks scale with `n`. Tune the ranges on `REVEAL.GRID_SIZE_MIN/MAX` and `FRAME_COUNT_MIN/MAX`. Shrinking the count no longer drops leftover frames — that truncate is D-041.

---

## D-033 — Compact Tune: full-width palette, thumbnail save, apply to activity
**Date:** 2026-08-30 · **Status:** Active · **Touches:** theme.html, theme-page.js, theme-manager.js, editor-settings-manager.js

**Decision** The Tune panel is dense, not a second leftover-card stage. Swatches are a full-width grid of equal tiles (not a short centered strip). Each of the 8 cards is a mini leftover-card **thumbnail**. **Save look** writes the current knobs onto that preset’s overlay so the thumbnail holds the mix. **Factory** deletes that overlay (factory recipe again). **Use on [activity]** copies preset id + knob snapshot onto the open activity (`promptSettings` / `promptCategories`). Loading that activity restores the snapshot (`restoreActivityTheme`). CSV still carries only the preset name (D-026). A pip on the card marks a saved overlay. Phone keeps four thumbnail columns and larger tiles (~36px) for tap.
**Why** Alec: palette spanning the window; a way to save the theme in the thumbnail; recall defaults; apply to the project; less spread out and phone-friendly.
**Rejected** A ninth Custom preset (D-026); keeping the tall leftover-card mock under Tune; auto-applying every slider tick onto the activity (that would stamp unfinished mixes).
**Consequence** Do not restore the Tune leftover-card mock as a “missing preview.” The page chrome plus the eight thumbnails are the preview. Do not skip an activity’s stamped theme because `selectedTheme` already exists — that made Apply look like a no-op.

---

## D-034 — Overlay ends on paper, then a beat, then prompts
**Date:** 2026-08-30 · **Status:** Superseded by D-036 · **Touches:** reveal-animation.js, animation-manager.js, sketch-refactored.js

**Decision** When a cell resolves, it paints `--background-color` (paper). It does not skip so the real word or picture shows through. After every cell is paper, the overlay stays up for `REVEAL.HOLD_MS` (1000). Then the overlay drops, the prompts unmask, and `SOUND.FINAL` plays. Space / clear still cancels the hold.
**Why** Alec: the animation should end on background color, pause a second, then reveal the prompts. Punch-through made the result readable while pixels were still finishing.
**Rejected** Punch-through as the resolve (the previous landing); holding with leftover decoy still on screen; playing the final ping at the start of the hold (it belongs with the words).
**Consequence** Superseded by D-036. The blank hold felt paused, and “animation then nothing then results” was not the intent. Punch-through *during the colored film* is still rejected. `HOLD_MS` remains in `REVEAL` unused.

---

## D-035 — Film plays on FRAME_MS, then freezes while clearing
**Date:** 2026-08-30 · **Status:** Active · **Touches:** reveal-animation.js, animation-manager.js

**Decision** Sketch advances decoy frames on `REVEAL.FRAME_MS` (120), the same clock as Customize **Play**. Scramble lasts at least one full loop of the saved frame count. During lift the playhead keeps moving on leftover tiles (D-037). Flicker may still shimmer cells on the 50ms sound clock. Default geometric decoy is one stable blob per frame index (`idx * 97 + 3`), not `makeGeometricFrame(size, tick)` every tick.
**Why** Alec: the prompting window looked like noise then prompt, not scrambling. A 3-frame custom drawing stepped every 50ms (~20fps) and kept mutating while cells vanished, so the film never read as an animation.
**Rejected** Driving `getRevealDecoyFrame` from the scramble tick counter; regenerating default geometry every tick; punching through before one loop has played.
**Consequence** Do not “sync” sketch to `TICK_MS` for the playhead. Pixel-film notes follow the playhead too (D-040); the old 50ms chatter was the sound clock, not the picture clock. Tune `FRAME_MS`. Flicker salt is the third argument to `getRevealDecoyFrame`. Do not freeze the last frame as a “cleanup” — that is the two-act cut D-037 forbids.

---

## D-036 — Paper tiles lift; the results show through
**Date:** 2026-08-30 · **Status:** Active · **Touches:** sketch-refactored.js, animation-manager.js, reveal-animation.js

**Decision** Lifted tiles are not drawn, so the real word or picture shows through that hole. Leftover cells are `--background-color` (paper) so empty decoy spots cannot leak the result, and the film still paints on those leftover cells (D-037). Gutters around the square stay paper. Order is a shuffle of all cells (`ranksPuzzleShuffle`), not far-from-shape first. When the last tile lifts, the overlay drops immediately — no `HOLD_MS` blank card.
**Why** Alec: like a puzzle covering the results; as pieces are removed, elements are revealed. Not animation over already-visible results, not animation then nothing then results. Reveal tiles are the same color as the background.
**Rejected** D-034’s hold-then-pop; far-cells-first (cleared empty paper first, so the word appeared only at the end and felt paused).
**Consequence** Do not restore a blank beat as a “missing pause.” Do not drop the film off leftover tiles (that reads as a second process — D-037). Tune shuffle vs another lift order only with a new decision. What the holes show for **text** is D-052 (glyphs that lock), not the finished word from tick one.

---

## D-037 — Film and lift overlap; leftover tiles keep playing
**Date:** 2026-08-30 · **Status:** Active · **Touches:** reveal-animation.js, animation-manager.js, sketch-refactored.js

**Decision** The cover period and the lift share time. `REVEAL.OVERLAP` (0–1, default 0.55) is how much of the cover window already has holes. Holes never open before one full film loop. After lift starts, leftover tiles **keep advancing** on `FRAME_MS` — paper underneath, decoy on top. Not a freeze-then-paper-grid second act.
**Why** Alec: needs more overlap between animation and final reveal; looked like 2 processes instead of one. Stopping the film and switching to dead paper tiles was the cut.
**Rejected** Waiting for the film to finish, then starting a separate puzzle; punching through from tick 1 (would leak type before the drawing reads).
**Consequence** Tune `REVEAL.OVERLAP`. Do not restore `pixelReveal.phase = 'puzzle'` as a film-off mode.

---

## D-038 — Pictures fill leftover card height
**Date:** 2026-08-30 · **Status:** Active · **Touches:** sketch-refactored.js

**Decision** After type is locked (D-012), leftover height below the objective is given to picture prompts: `IMAGE_SLOT` / `IMAGE_SLOT_PHONE` is the **floor**, then remaining slack is split equally across pictures. Each picture aspect-fits in that slot. Width is the **inner card** (minus inset), not the square text-wrap used for words (D-028). Name, objective, labels, and text prompts are not shrunk to make pictures huge.
**Why** Alec: bigger, or as big as possible given the other elements. A fixed 110px slot left empty card around a lone picture. Wrapping pictures to the reveal square left unused width.
**Rejected** A second hardcoded size; shrinking the word floor to feed the picture; stretching the bitmap (aspect stays).
**Consequence** Do not “fix” a large picture by restoring `IMAGE_SLOT` as the drawn height, or by wrapping pictures to `MAX_PROMPT_WIDTH`. Tune the floor on `CARD_FIT.IMAGE_SLOT*`. **Drawn dest on the leftover card is D-053** (film square, cover-crop). Do not restore inner-card-width aspect-fit as the live picture.

---

## D-039 — Prompt labels recede toward paper
**Date:** 2026-08-30 · **Status:** Active · **Touches:** sketch-refactored.js

**Decision** Prompt headings on the leftover card (`WITH`, `USING`, …) are `mix(primary, paper, LABEL_MIX)` with `LABEL_MIX` 0.55. Chosen values stay full prompt ink (including the 2× CRT boost). Mixing toward paper works on both white-on-black and black-on-white. The objective under the name is unchanged.
**Why** Alec: labels needed more contrast from the prompts. `0.8 ×` primary on Black is #CCC on #FFF — too close.
**Rejected** Painting labels a second theme color; dimming the chosen values; applying the mix to the objective.
**Consequence** Tune `CARD_FIT.LABEL_MIX`. Do not restore `primary * 0.8` as the label fill.

---

## D-040 — One note per film frame, from a scale
**Date:** 2026-08-30 · **Status:** Active · **Touches:** reveal-animation.js, animation-manager.js, theme-page.js, theme.html

**Decision** Each time the film playhead lands on a frame, play one sine from `REVEAL.FRAME_SCALE_HZ` (C–D–E–G–A–C pentatonic). Same helper on Customize **Play** and on RUN. The leftover-card auto-preview stays silent. Letter-scramble and image-dot fallbacks keep `SOUND.SCRAMBLE` / `SOUND.REVEAL` on the 50ms clock. Overlay-complete still plays `SOUND.FINAL`. Which degree each frame uses is **D-042**; if `notes` is missing, walk the scale by frame index.
**Why** Alec: try different sounds; is there a smart way to customize; basically a sound for every frame. The drawing already is a sequence — mapping frame index to a scale is the customization without a frequency editor.
**Rejected** Keeping the 440Hz / 600Hz beep every 50ms during cover and lift; a per-frame Hz picker (degrees, not Hertz, is D-042).
**Consequence** Do not restore 50ms chatter on the pixel path. Tune `FRAME_SCALE_HZ` / `FRAME_NOTE_MS` / `FRAME_NOTE_VOL`. Do not store raw Hertz in the JSON. Film notes always play through `playRevealTone` in reveal-animation.js — never `window.playSound` (that envelope is a different beep, so Customize Play would not match RUN).

---

## D-041 — Unused frames stay parked
**Date:** 2026-08-30 · **Status:** Active · **Touches:** reveal-animation.js, theme-page.js, theme.html

**Decision** `frameCount` is how many drawings play and show in the film strip. `frames[]` may be longer (up to 12). Lowering Frames keeps the extra drawings (and their notes). Raising Frames restores them in order; new slots that were never drawn start empty. **Reset All** truncates to the live count and empties those frames. Play, RUN, and `revealHasPaint` only look at the live count. `FILE_VERSION` 5.
**Why** Alec: sampling 12→2→12 erased frames 3–12. The slider is a loop length, not a delete.
**Rejected** Keeping the D-032 truncate; a separate “attic” list with its own UI; confirming before shrink.
**Consequence** Do not splice `frames` down to `frameCount` in `normalizeRevealState` or `applyRevealShape`. Grid resample must include parked frames so they still match if the slider comes back.

---

## D-042 — Per-frame tone, pentatonic only
**Date:** 2026-08-30 · **Status:** Active · **Touches:** reveal-animation.js, theme-page.js, theme.html, animation-manager.js

**Decision** Each stored frame has a scale degree in `state.notes`. The film strip shows that name under the thumbnail; click cycles to the next degree and previews the note (silence if mute). Drag-reorder moves the note with the drawing. Missing `notes` walk the sounding pentatonic (D-040). No Hertz field, no off-scale pitches. The live list of degrees is **D-043**.
**Why** Alec: a way to change the tone of each frame, always tonally harmonic / complementary.
**Rejected** A Hz or waveform picker; a second scale (major/minor) in this pass; copying the note with Copy to Next (the picture copies; the tone stays on that slot).
**Consequence** Do not let a frame pick an arbitrary frequency. Tune names on `FRAME_SCALE_NAMES` to match `FRAME_SCALE_HZ`. The second octave and mute are D-043, not a silent lengthening of this list.

---

## D-043 — Second octave up, and mute
**Date:** 2026-08-30 · **Status:** Superseded by D-049 · **Touches:** reveal-animation.js, theme-page.js, theme.html

**Decision** The click-cycle list is C D E G A, then C1 D1 E1 G1 A1 C2, then **mute**. C1 is one octave above C (old C′). Mute stores as scale index with `FRAME_SCALE_HZ` 0; Play and RUN skip that frame. Defaults never land on mute — they wrap the sounding notes only. Saved 0–5 still map to C D E G A C1.
**Why** Alec: allow a second octave up (c1 d1 etc.) and mute.
**Rejected** A third octave; a separate Mute checkbox; dropping mute off the cycle (it has to live on the same control as the tones).
**Consequence** Do not restore the 6-name list. `playRevealFrameSound` must no-op when Hz is 0 so mute does not play a 0 Hz oscillator.

---

## D-044 — Film stays intact while tiles lift
**Date:** 2026-08-30 · **Status:** Active · **Touches:** reveal-animation.js, animation-manager.js

**Decision** Custom decoy frames are resampled to the live grid at play time and are **not** flickered. Geometric decoy may still shimmer on the 50ms clock until lift starts; once tiles lift, leftover cells keep a stable picture (`flickerSalt === false`). Shuffle still opens holes — those holes show the prompts, not punched-out ink inside a leftover tile.
**Why** Alec: part of the animation was masked; where there should be a square a chunk was blacked out; keep the animation intact when shuffling. Flicker of ~3% on a large grid flips many on-cells per tick (paper/black holes in the drawing). A frame shorter than `n×n` left the extra cells empty paper.
**Rejected** Keeping custom flicker as “life”; painting lifted holes as black instead of skip-through.
**Consequence** Do not call `flickerFrame` on custom film. Do not pass a numeric flicker salt after `liftStart`. Restore shimmer on leftover custom tiles only with a new decision.

---

## D-045 — Second RUN stops the film and shows the result
**Date:** 2026-08-30 · **Status:** Active · **Touches:** prompt-generator.js, animation-manager.js, ui-manager.js, sketch-refactored.js

**Decision** While `pixelReveal` is active, RUN / Up / Enter call `skipRevealToResult()`: first press starts the paper-tile land (D-048); a second press during that land jumps to the result. The button label is **STOP**. The film itself **loops until that press** (D-047) — it does not end on a timer. Space still sets `shouldStop` and **clears** the masked prompts (abort, no result). Presses after the result lands still re-roll (R5).
**Why** Alec: run to animate, second hit to stop. Mid-film RUN used to no-op with a dull beep. Instant unmask on STOP dropped the glitch land (D-048).
**Rejected** Making second RUN abort like Space (that throws away the draw); ignoring RUN until the film ends (D-012 era).
**Consequence** Do not treat STOP as a new generate. Letter-scramble fallback (no pixel overlay) still ignores a second generate.

---

## D-046 — Designed land (final) note
**Date:** 2026-08-30 · **Status:** Active · **Touches:** reveal-animation.js, theme-page.js, theme.html, animation-manager.js

**Decision** `state.finalNote` is a scale degree from the same pentatonic as the film, including mute. Customize **Land** (next to Grid / Frames) cycles it and previews. Overlay-complete and STOP both play `playRevealFinalSound` after the transition land (D-048). Missing value defaults to **C2** (not “highest note”, which moved when D-049 added C3).
**Why** Alec: allow design of the final reveal sound.
**Rejected** A second Hz picker; a one-off 1200 Hz factory that sits off the scale.
**Consequence** Do not restore `SOUND.FINAL` 1200 Hz on the pixel path. Letter-scramble / image-dot fallbacks also use the land note when `playRevealFinalSound` exists. Do not retarget the default to C3 just because it is now the top of the scale.

---

## D-047 — Film loops until STOP; no timed ending
**Date:** 2026-08-30 · **Status:** Active · **Touches:** animation-manager.js, sketch-refactored.js, sketch.html

**Decision** After RUN, the pixel film loops fully covering the leftover card (same clock as Customize Play). `resolveCount` stays 0. It does **not** lift tiles or unmask after N ticks. STOP begins the land (D-048). Space still aborts/clears.
**Why** Alec: RUN is still timed and plays a few seconds before stopping — not start/stop; press 1 to start, 2 to stop.
**Rejected** Keeping auto lift-and-finish (D-036/D-037 on a timer) and only adding a skip that races the timer.
**Consequence** Do not call `finishPromptReveal` from the looping tick. Tile-lift-on-a-clock would make the overlay end without a second press. Landing on STOP is D-048, not a return of the timer.

---

## D-048 — STOP plays the glitch land, then the land note
**Date:** 2026-08-30 · **Status:** Active · **Touches:** animation-manager.js, reveal-animation.js, sketch-refactored.js

**Decision** First STOP while the film is looping starts paper-tile lift (D-036) with leftover film still playing (D-037). Each lift tick plays one **gated low square** walking C-1 D-1 E-1 G-1 (`TRANSITION_HZ`), shorter than `TICK_MS` so the gaps read as interruption. When the last tile lifts, the overlay drops, `playRevealFinalSound` plays, and `finishPromptReveal` runs. A second STOP during the lift skips remaining tiles and lands immediately. Tune `TRANSITION_HZ` / `TRANSITION_MS` / `TRANSITION_VOL`.
**Why** Alec: the glitch should be rapid low or interrupted tones that match the transition. The shhh sounded like a random drum.
**Rejected** Instant unmask + land note on STOP. A one-shot noise burst (SID hiss / drum). Playing the land note at the start of the lift.
**Consequence** Do not finish the overlay in `skipRevealToResult` on the first press. Call `playRevealTransitionSound` from the lift tick, not once at STOP. Frame notes pause during lift. Do not restore `TRANSITION_NOISE_*`.

---

## D-049 — Scale from C-1 to C3
**Date:** 2026-08-30 · **Status:** Active · **Touches:** reveal-animation.js, theme-page.js, theme.html

**Decision** Click-cycle list is C-1 D-1 E-1 G-1 A-1, C D E G A, C1…A1, C2…A2, **C3**, then mute. Same pentatonic; C-1 is one octave below C, C3 is three octaves above. `FILE_VERSION` 6. Saved v5 indices 0–10 (C…C2) shift by +5; old mute (11) stays mute. New frames with no saved note still walk from middle **C**, not C-1. Default **Land** stays C2.
**Why** Alec: another octave up and below; highest C3, lowest C-1.
**Rejected** Leaving the D-043 list (too short); putting new notes only at the end of the cycle (C-1 would sit after C3); snapping default land to C3.
**Consequence** Do not prepend the low octave without remapping saved indices — C would become C-1. Names are relative to this app’s C, not scientific pitch (scientific C1 is ~32 Hz). Missing `finalNote` must default to C2, never index 0 (`Number(null)` is 0). `scaleRev` 2 marks a file as already on this list.

---

## D-050 — Ink-filled buttons use paper for the label
**Date:** 2026-08-30 · **Status:** Active · **Touches:** theme-manager.js, sketch.html, editor.html, theme.html, ui-manager.js

**Decision** When a control is filled with ink (`--primary-color`) — highlighted / active / RUN / GO TO NEXT / the `...` menu — the label is `--on-primary-color`, which is paper (`--background-color`). Macintosh is black ink on light paper, so filled buttons are light-on-black. CRT neon fill still gets dark paper on the chip.
**Why** Alec: in Macintosh mode, highlighted buttons do not invert text color (black label on black fill).
**Rejected** Leaving hardcoded `#000` (assumed CRT neon-on-black). Computing a separate white/black from luminance (paper *is* the invert).
**Consequence** Do not set filled-button text to `#000`. Tune paper if a custom ink/paper pair still has weak contrast. Outline / muted / hover chips must not keep a paper `-webkit-text-fill-color` — that is D-054.

---

## D-051 — Start chime sits with left / right / down
**Date:** 2026-08-30 · **Status:** Active · **Touches:** animation-manager.js, prompt-generator.js, sketch.html, ui-manager.js, sketch-refactored.js

**Decision** First RUN / Up / Enter plays `SOUND.START` at 600 Hz / 80 ms — the same sine family as left 300, down 400, right 500. The first film-frame note is skipped so the chime is not stacked under a pentatonic (or mute). The RUN button does not play the Mac click on start (STOP still uses the glitch ticks). Knobs: `SOUND.START` / `NAV_LEFT` / `NAV_RIGHT` / `NAV_DOWN`.
**Why** Alec: the start chime on first press was more tuneful before and complemented left right down.
**Rejected** Keeping the Mac click plus 600 Hz plus frame-0 note (three sounds on one press). Letting frame 0 be the start chime (mute or C-1 does not sit with 300/400/500).
**Consequence** Do not restore `playClickSound` on RUN start. Customize Play still sounds every frame including the first — that page is scoring the film, not the desk loop.

---

## D-052 — Text glitches through the holes
**Date:** 2026-08-31 · **Status:** Active · **Touches:** animation-manager.js

**Decision** While paper tiles lift, prompt values are spinning glyphs (`getRotatingChars`) that lock to the real letters as `resolveCount` grows — letters for 1–3 word lists, whole words for sentences (D-012 / D-014). Wrap still follows `final` so the card does not bounce. Pictures are D-053 (cropped to the film square, mosaic while lifting). Cover keeps the text fully scrambled so a missed overlay frame cannot flash the answer. Second STOP still jumps to the finished word. No extra beeps — lift already has the gated land tones (D-048).
**Why** Alec: the text should reveal as glitch too, not only be under animation.
**Rejected** Leaving finished words under the film (the screenshot: static “Mil” in the holes). Replacing the tile lift with letter-scramble alone (would drop D-036). Scrambling headings / the objective (those are chrome, not the draw).
**Consequence** Do not set `revealed` to `final` while `pixelMasked` is true. `unmaskPixelPrompts()` is still what lands the real string.

---

## D-053 — Pictures stay in the film square
**Date:** 2026-08-31 · **Status:** Active · **Touches:** sketch-refactored.js

**Decision** A prompt picture is cover-cropped into the same centered square as the pixel film (`revealSquareGridMetrics` on the leftover card). Several pictures split that square into cell-aligned rows. While tiles lift, the bitmap is drawn **cell by cell** (same cell size as the film). After land — and on recall — it stays that square, sharp, clipped. Not leftover-card width (D-038). Hidden while the film fully covers so a missed frame cannot flash the photo.
**Why** Alec: maybe images have to be cropped or masked to size of grid; edges of the image grow suddenly which diminishes the effect because it is so uniform and does not match the glitch transition style.
**Rejected** Aspect-fitting a smooth photo in the leftover slot (edges pop when the overlay drops). Pixelating after land (the land should be the real picture, just not a bigger rectangle).
**Consequence** Do not restore `drawFittedPromptImage` leftover-width as the live dest. `IMAGE_SLOT*` remains the fallback for wait-dots if the pixel overlay is missing.

---

## D-054 — Button fill-color follows `color`
**Date:** 2026-09-09 · **Status:** Active · **Touches:** theme-manager.js, sketch.html, ui-manager.js, editor.html, theme.html

**Decision** Every control paints glyphs with `-webkit-text-fill-color` set to the **same CSS token as `color`**: paper (`--on-primary-color`) on ink-filled rest (D-050), ink (`--primary-color`) on paper chips / RE-RUN / hover-invert. Safari/Chrome otherwise keep a parent’s computed fill and ignore `color`.
**Why** Alec: Macintosh theme — screenshot / report / clear / edit and the RUN circle had no visible labels (text matched the fill). Later GO TO NEXT was a solid ink bar with no “GO TO NEXT”.
**Rejected** Reverting D-050 to hardcoded `#000` on filled CRT buttons. Using `currentColor` for the fill (native `<button>` may resolve that to ButtonText / ink, so Macintosh filled chips stay ink-on-ink until refresh).
**Consequence** Do not set `-webkit-text-fill-color` to paper on a chip whose background is paper. Do not use `currentColor` on these native buttons. When `color` swaps on hover or muted, set the fill token in the same rule.

---

## D-055 — Film saves with the activity; Restore defaults
**Date:** 2026-10-13 · **Status:** Active · **Touches:** reveal-animation.js, theme-page.js, theme.html, editor-settings-manager.js, editor-data-manager.js

**Decision** The live reveal animation still lives in `localStorage` key `revealAnimation` (D-025) so the prompting window can play it. A **clone** of that snapshot is also stored on the open activity (`promptSettings[name].revealAnimation` and the working `promptCategories` copy). File → Save / Save As writes it; Customize edits stamp it onto the current activity as they persist. Loading that activity from History restores the snapshot into `revealAnimation`. An older activity with no snapshot leaves the current film alone. **Restore defaults** on Customize replaces the live film with factory geometric decoy at **6×6 / 2 frames** (D-032), Default Pattern, factory notes — not the same as **Reset All**, which only empties custom frames. CSV still does not carry frames; share a drawing with **Download Animation**.
**Why** Alec: does the custom animation save with Activity History; there should be a button to restore to defaults. Theme already stamps per activity (D-033); the film was one browser-wide key, so switching activities kept the last drawing.
**Rejected** Putting pixel frames into the CSV (too large; JSON download is the share format). Making Restore defaults confirm (Reset All has no dialog — D-031). Treating Restore defaults as Reset All.
**Consequence** Do not “fix” the film back to a single global key. Auto-save must keep `revealAnimation` on `promptCategories` (same as theme knobs). Do not snap Restore defaults to an already-saved custom size — factory is 6×6 / 2.

---

## D-056 — FILE first; Customize under Help
**Date:** 2026-10-14 · **Status:** Active · **Touches:** editor.html

**Decision** The editor `...` panel lists **FILE** at the top (New / Save / Save As / Share / Load / Restore Last Run), then Help & Instructions, then **Customize**, then Activity History. The trigger label is **FILE**, not File. Customize stays in the panel (D-024 still owns the page itself) but sits under Help because it is an advanced look-and-film editor, not an everyday step.
**Why** Alec: Customize is too prominent; make Rando as simple to operate as possible. FILE first is the save/load path teachers need; burying Customize under Help keeps the room from looking like a theme app.
**Rejected** Removing Customize from the panel (still needs a door). Putting it below Activity History (scroll-hidden). Keeping “File” mixed-case.
**Consequence** Do not restore Customize as the first row. Do not add a Theme dropdown back (D-024). Hidden `#theme-select` can stay next to the Customize button.

---

## D-057 — Quoted CSV Share; pictures as a zip folder
**Date:** 2026-10-14 · **Status:** Active · **Touches:** activity-pack.js, editor-data-manager.js, editor-settings-manager.js, editor-main.js, data-manager.js, editor.html, sketch.html

**Decision** Share writes RFC 4180 quoted CSV so commas (and quotes) in sentences, grouping names, and headings survive Load. If the activity has picture options (`img:` tokens), Share warns: “Saving this means saving images. The download is a folder (zip) with the prompt list and a media folder.” Buttons **SHARE** / **CANCEL**. Confirm downloads `activity.csv` plus `media/<id>.png` or `.jpg` (uncompressed zip). No pictures → a plain `.csv`. Load accepts `.csv` or `.zip` and puts blobs back in IndexedDB. Class reports use the same quoted CSV block. Film frames stay out of this pack (D-055 / Download Animation).
**Why** Alec: escape commas so long sentences keep their syntax on load; pictures need to be shared in a folder with the media, with a warning that saving this means saving images.
**Rejected** Putting binaries or base64 into the CSV (D-015). Requiring a build step / JSZip. Writing a real OS folder (the browser can only download a zip). Silently attaching pictures with no warning.
**Consequence** Do not revert Load to `line.split(',')`. Do not treat a missing `media/` file as a parser error — the list still loads, that thumb stays broken. Finder may re-zip with deflate; unpack method 8 via `DecompressionStream` when present. Cache-bust tags move together with this new module.

---

## D-058 — Empty Custom uses letter scramble, not Default Pattern
**Date:** 2026-10-14 · **Status:** Active · **Touches:** reveal-animation.js, animation-manager.js

**Decision** If Customize is on **Custom** and the live frames have no paint (`revealHasPaint` is false — Reset All, or never drawn), the prompting window does **not** play Default Pattern. RUN uses the letter-scramble path (spinning decoy letters, then reveal). Pictures still use flicker dots (D-017). **Default Pattern** still plays the factory geometric film. **Restore defaults** still recalls that factory film (D-055) — it is an explicit switch to default, not “fill in empty custom.”
**Why** Alec: when custom animation is empty do not put default; we can just scramble text.
**Rejected** Playing empty paper tiles as a film (the result would show through immediately). Substituting `makeGeometricFrame` whenever custom has no paint (looked like the default animation came back after Reset All).
**Consequence** Do not “fix” empty Custom by falling back to geometric decoy. Parked frames past `frameCount` still do not count as paint (D-041).

---

## D-059 — Leftover-card frame is its own knob (0 = none)
**Date:** 2026-10-14 · **Status:** Active · **Touches:** theme-manager.js, theme.html, theme-page.js, sketch-refactored.js

**Decision** Customize Tune has **Card frame** (0–8px). **0** draws no outline around the leftover card on the prompting window. Chrome **Stroke size** stays 1–6px for buttons and panels. Factory / unsaved looks keep the old 4px card outline (`strokeWidth + 3`). **Save look** / **Use on [activity]** store `cardStroke` with the other knobs.
**Why** Alec: want to be able to remove the frame / border on the prompting page. Stroke size could not do that because the card was always 3px thicker than chrome.
**Rejected** Setting Stroke size to 0 (would also strip editor/Customize button borders). Deleting the card outline for everyone.
**Consequence** Do not map `--card-stroke-width` back to `strokeWidth + 3`. `sketchCardStroke()` must treat `0` as none, not as “missing, use 4.”

---

## D-060 — Objective is Title Case, left-aligned
**Date:** 2026-10-14 · **Status:** Superseded by D-061 · **Touches:** sketch-refactored.js

**Decision** On the leftover card, the objective is shown in **Title Case** (each word capitalized) and **left-aligned** to the inner card padding. Prompt headings (`WITH`, `USING`, …) stay ALL CAPS and centered. Storage and the editor keep whatever the teacher typed; only the card display changes.
**Why** Alec: make the objective title case and left justified.
**Rejected** Sentence case (only the first word); matching the objective to prompt-heading caps and center (reads as a second banner, not the brief).
**Consequence** Do not restore `objectiveText.toUpperCase()` or `textAlign(CENTER)` on the objective. Wrap and height use the same title-case string so lines do not overflow after the case change.

---

## D-061 — Objective is sentence case, centered, no short last wrap
**Date:** 2026-10-14 · **Status:** Active · **Touches:** sketch-refactored.js

**Decision** On the leftover card, the objective is shown in **sentence case** (first letter of each sentence capital, rest lower) and **centered**. Six or more words wrap to **two even lines** when both fit, so a long brief is not a single banner. The last wrap line must have at least **3 words** (`CARD_FIT.OBJECTIVE_MIN_LAST_LINE_WORDS`) — never a leftover “That…”. Shorter phrases stay one line. Prompt headings stay ALL CAPS and centered. Storage and the editor keep whatever the teacher typed; only the card display changes.
**Why** Alec: sentence case, center justified, wrap so it is never just one or two words on the second line (that looks funny). Title Case + left (D-060) was the previous ask.
**Rejected** Keeping Title Case. Leaving a long sentence on one line when two even lines would fit. Shrinking type to jam a short leftover onto the first line.
**Consequence** Do not restore Title Case, left-align, or ALL CAPS on the objective. Height measurement must use the same sentence-case + balanced wrap as the draw, or the card will clip. A 3-word leftover is allowed only when the previous line cannot spare a word without overflowing.

---

## D-062 — Three baked samples and a first-visit walkthrough
**Date:** 2026-10-18 · **Status:** Superseded by D-066 · **Touches:** editor-settings-manager.js, editor-main.js, editor-ui-manager.js, index.html, One-prompt-sample.csv, Two-prompt-sample.csv, Design-challenge.csv

**Decision** Activity History always restores **One prompt sample**, **Two prompt sample**, and **Design challenge** from those CSV files (not named SOD+A). Design challenge groupings are **physical** and **digital**. A first-time editor (no prompt lists in this browser) opens Two prompt sample and a six-step spotlight walkthrough (Welcome, Objective, Prompts, Groupings, FILE, RUN). A **run** is one randomized draw of prompts. Replay lives in Help (`?tour=1` also replays). Teachers who already have lists are not switched or overwritten. Baked CSV reloads on History click so shipped lists stay current; a teacher’s own copy under another name is untouched.
**Why** Alec: bake the design-challenge lists; first-timers should land on prompts and be asked to adjust to their school; keep a small sample; show a grouping example; walkthrough popups highlighting features.
**Rejected** Replacing Sample with SOD+A 2.0 as the only starter. Auto-starting the tour for returning browsers. Putting Customize on the tour.
**Consequence** Do not drop a baked sample from History without a new decision. First-visit must not call `initializeDefaultState()` instead of Two prompt sample. Do not name Design challenge SOD+A in the UI. Walkthrough Prompts frames **one** prompt column (heading + its list box). Groupings frames each horizontal row (letter + boxes), not the prompt headings.

---

## D-063 — Students pick grouping by tapping labels
**Date:** 2026-11-04 · **Status:** Active · **Touches:** editor.html, editor-ui-manager.js, editor-data-manager.js, editor-settings-manager.js, ui-manager.js, sketch.html, sketch-refactored.js, prompt-generator.js, data-manager.js, RANDOMIZER_LOGIC_SPEC.md

**Decision** If the teacher turns on **Students pick grouping** (visible once there are two grouping rows), the prompting window shows those grouping labels as tappable chips. A run draws only from the selected grouping. That chip is R7 (the row is forced). Chip exclusivity is **D-064**. Prompt columns all still draw. Storage/CSV key stays `prompt1InterestsMode`. Default is off.
**Why** Alec: rebuild select-based-on-grouping so robotics students get robotics rows and pottery students get pottery rows. The unsolved D9 question was *how interest is identified* — the answer is the grouping label itself, not Prompt 1 and not a hidden control panel.
**Rejected** Using Prompt 1 as the interest picker (skipped that column on the card). Putting the picker back in the removed control panel (`SKETCH_HIDE_CONTROL_PANEL`). Showing the editor switch with only one grouping (nothing to pick). F2 invisible teacher steering (separate future).
**Consequence** Do not hide `#prompt1-interests-mode` or hardcode it false. Do not `slice(1)` prompt types when the flag is on. Exhaustion (R6) for a filtered run is the selected grouping’s union; pottery stays in play when robotics refills. F2 remains a different idea (teacher steers without the student seeing a choice). Chip multi-select is rejected in D-064.

---

## D-064 — Grouping chips are radio, one at a time
**Date:** 2026-11-04 · **Status:** Active · **Touches:** ui-manager.js, sketch.html

**Decision** When Students pick grouping is on, exactly **one** grouping chip is active. Tapping a chip turns it on and turns every other chip off. The first grouping is selected if nothing was stored. Tapping the already-on chip leaves it on (cannot have zero).
**Why** Alec: only one active button at a time; as soon as a grouping is selected, others deselect.
**Rejected** Independent toggles / several chips on at once (D-063’s first ship). An extra All chip (the editor switch off already means every grouping).
**Consequence** Do not restore multi-select on these chips. With the feature on, every run is R7 for the chosen row.

---

## D-065 — Three classroom sessions in Activity History
**Date:** 2026-11-04 · **Status:** Active · **Touches:** editor-settings-manager.js, SIMPLE.csv, SOD-A.csv, SOD-A-w-Groupings.csv

**Decision** Activity History always restores **SIMPLE**, **SOD+A**, and **SOD+A w/ Groupings** if those names are missing. Groupings is the split (physical / digital / **textiles**, Students pick grouping on). **SOD+A** is that same union in one grouping (INCLUDES / USES / EXPLORES). **SIMPLE** is that same union in one **INCORPORATES** list. First-time editor opens **SIMPLE** (**D-066**). Clicking a workshop name in History loads the saved copy, not a fresh CSV, so later list edits persist. Existing **SOD+A 2.0** is not renamed or overwritten.
**Why** Alec: set up three prompt sessions in memory — simple one-prompt, SOD+A combined, SOD+A with physical / digital / textiles.
**Rejected** Reloading from CSV on every History click (would wipe desk edits). First-visit default and dropping D-062 samples: **D-066**.
**Consequence** Do not drop these three from History restore without a new decision. Do not treat `SOD+A` and `SOD+A 2.0` as the same activity.

---

## D-066 — Classroom sessions only, short teacher path
**Date:** 2026-11-04 · **Status:** Active · **Touches:** editor-settings-manager.js, editor-main.js, editor-ui-manager.js, index.html, README.md

**Decision** A new browser restores **only** **SIMPLE**, **SOD+A**, and **SOD+A w/ Groupings**. First-visit opens **SIMPLE** and a three-step walkthrough (pick a session → edit → run). Help is the same short path: **Run**, **Edit**, **Save**. **GO TO NEXT** keeps the result and starts the next student (options stay out). **RE-RUN** redraws the same student (options go back in). **FILE → Save** writes the session in this browser; **FILE → Share** is the file backup. D-062 sample names are not auto-restored; leftover copies are not deleted.
**Why** Alec: after cleanup, a pushed version should only show the three sessions; a never-seen-this teacher needs concise run / edit / save, with GO TO NEXT defined; too much text loses them.
**Rejected** Keeping One / Two prompt sample and Design challenge in History for new browsers. The six-step sample walkthrough as first-visit. A long Help essay.
**Consequence** Do not restore D-062 samples on first visit. Do not auto-delete a teacher’s leftover sample names. Do not reopen first-visit with Two prompt sample.

---

## D-067 — Name slot is visible when empty
**Date:** 2026-11-06 · **Status:** Active · **Touches:** ui-manager.js

**Decision** The leftover-card name field shows placeholder **name** at reduced opacity and a bottom rule. Names stay optional (unnamed runs are still Run 1, Run 2…). Typed text uses full ink.
**Why** Alec: when we load, it is not clear that a space to input a name is available. The field was transparent with placeholder `" "` so the slot disappeared into the card.
**Rejected** Leaving the space placeholder. Requiring a name before RUN. Auto-focus (would pop the phone keyboard).
**Consequence** Do not set the name placeholder to a space or empty string. Do not hide the underline on the empty field.

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
  anything other than genuine randomness. This is a different path from
  D-063 (student taps a grouping label). "Interest" can still be something
  a teacher steers invisibly. Implementing this means adding a weighting/override
  layer on top of the existing uniform-random draw, without changing the
  visible reveal behavior at all.
- **F3 — Design constraint: mimics AI, requires teacher intent.** The system
  should feel unpredictable/generative the way AI output does, but it must
  structurally force the teacher to make deliberate curatorial choices
  rather than free-generating content for them. Any future AI feature
  (e.g. an authoring assistant that helps draft prompt options) should be
  checked against this constraint before being added — assist the teacher's
  curation, don't replace it.
- **F4 — Customizable animations.** First concrete surface is `theme.html` (D-024 / D-025 / D-027 / D-032): default geometric decoy vs a teacher-sized custom drawing with a theme-ink-first palette, previewed in the leftover-card window. Still open: more parameterized knobs beyond this editor, and how far “their way” goes past one saved animation per browser.
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
    real, working infrastructure toward this already. First custom-color/font/stroke/glow
    knobs shipped as D-026 (per-preset overlays on Customize). How far “their way”
    still goes — branding uploads, arbitrary typefaces — remains open.

## 5. How to use this with AI

1. **Before styling or interaction changes:** check here first — a "weird" number or color may be load-bearing (see D3).
2. **After a visual/UX change:** add or update a row here only if a future session could plausibly mistake the choice for a bug and revert it. Routine visual tweaks are CHANGELOG-only. Same test as `RANDOMIZER_LOGIC_SPEC.md` (decision, not log). See Documentation routing in `.cursorrules`.
3. **Audit:** periodically ask "for each design decision a user would notice, is there a D-row and a comment at the code site, or is the reasoning only in CHANGELOG.txt?"
