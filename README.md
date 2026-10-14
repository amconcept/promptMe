# Rando Calrissian

**A creative prompt generation tool designed to spark imagination and engagement in educational settings.**

> Naming note: the app is called **Rando Calrissian** in the UI. The repository folder
> and some internal identifiers still read `PromptMe` — that's historical, not a second
> product. Code identifiers are deliberately left alone (see "Terminology" below).

---

## What is Rando Calrissian?

Rando Calrissian is a web-based application that helps teachers create structured, randomized prompts for students. Think of it as a digital prompt generator that ensures every student gets unique, varied combinations of ideas to work with—perfect for creative projects, design challenges, artistic exercises, or any activity where you want to provide structured inspiration.

Everything runs locally in the browser. There is no server, no build step, and no account — your data stays in your browser's local storage.

---

## Terminology

The app uses **grouping** in everything a teacher sees. The code and the randomizer
spec use **category** for the same concept.

| You see | Code calls it |
|---------|---------------|
| Grouping (A, B, C…) | `category`, `criterion`, `criterionLabels` |
| Prompt | `promptHeaders`, prompt type |

This split is intentional. `RANDOMIZER_LOGIC_SPEC.md` keeps "Category" as the internal
logic term, and renaming the identifiers would risk breaking the draw logic, so only the
user-facing wording changed.

---

## Why is Rando Calrissian Cool?

### 🎯 **Structured Creativity**
Instead of giving students a blank page and endless possibility, Rando Calrissian provides organized groupings of prompts that work together. For example, a design project might combine:
- **Grouping A**: Different materials (wood, fabric, metal)
- **Grouping B**: Different functions (storage, seating, lighting)
- **Grouping C**: Different styles (modern, vintage, minimalist)

Each student gets a unique combination, ensuring variety while maintaining structure and focusing on the skills teachers want to develop. This allows teachers to provide customized experiences for diverse learners. The system helps avoid repetition and copying while encouraging differentiation, making activities more challenging, customizable, and engaging.

### 🎲 **Smart Randomization**
The app automatically prevents repetition, so students won't get the same prompts until all options have been used. This means every student gets fresh, unique combinations without you having to manually track what's been used.

The exact rules are specified in `RANDOMIZER_LOGIC_SPEC.md` (rules R1–R7, invariants I1–I6). That document is the source of truth for draw behavior.

### 📊 **Easy Organization**
Enter student names as you go, or paste a comma-separated list. The app tracks who has received prompts, lets you navigate between them, take screenshots, and download a report at any time.

### 🎨 **Visual Appeal**
The prompting interface features a retro terminal aesthetic with smooth animations that make the experience engaging and fun. Students watch as their prompts reveal themselves in an exciting, game-like way. Eight themes and a customizable reveal animation live on the Customize page (see "Themes").

### 💾 **Save and Share**
Create activity templates and save them for future use. Share your prompt sets with other teachers as a CSV, or as a zip folder when the activity includes pictures. Everything is stored locally in your browser, so your data stays private.

---

## What Can It Be Used For?

### **Design Projects**
Create design challenges where students combine different materials, functions, and constraints. Perfect for architecture, product design, or art classes.

**Example**: "Make a gift for a friend that USES [material] AND [tool]"

### **Creative Writing**
Generate story prompts with different characters, settings, and plot elements. Each student gets a unique combination to spark their imagination.

**Example**: "[Character Type] + [Setting] + [Conflict] = Unique Story Prompt"

### **Problem-Solving Challenges**
Set up engineering or math challenges with varying constraints and requirements. Students work with different parameters while solving the same type of problem.

### **Language Learning**
Create vocabulary exercises where students combine different words, contexts, and grammar structures.

### **Any Structured Activity**
If you have groupings of options that need to be combined in different ways, Rando Calrissian can help you randomize and track them efficiently.

---

## How Does It Work?

Rando Calrissian has three main parts:

### 1. **The Editor** (`editor.html` — where you set up prompts)

- **Add Prompts**: Create up to **4** prompt columns (`MAX_PROMPTS`), each with an optional heading students see, such as USES, WITH, or AND. Leave the heading blank and it will not appear on the card.
- **Add Groupings**: Create up to **6** grouping rows (`MAX_CATEGORIES`), labelled A, B, C… automatically
- **Fill in Options**: Add one option per line in each cell. You can also drop or paste a PNG or JPG onto the list (under 2MB). Pictures use the same pixel-fill reveal as words and sentences.
- **Set an Objective** (optional): Write what students should create or accomplish. You can Skip and still run if you have prompts.
- **Save Your Activity**: Use the FILE menu to name and save it

**Think of it like a grid**: rows are groupings, columns are prompts, and each cell holds one option per line.

On a **phone or narrow window**, the grid is replaced by a **cube layout** that shows one prompt at a time — see "The phone cube" below.

### 2. **The Prompting Window** (`sketch.html` — where students get prompts)

- **Enter a name** (optional — see "Unnamed runs")
- **Press RUN**, or the Up Arrow / Enter key, to generate a combination. First press plays a short start tone in the same family as the left / right / down arrows, then the film notes.
- **Watch the animation** as the leftover card plays the frames from Customize (or the default pattern) at the same speed as **Play** on that page, with one musical note per frame (you pick each frame’s note on Customize). Press **STOP** and square tiles the same color as the background lift off. Through those holes the words scramble (spinning letters) and lock into place with the tiles; a picture is cropped to that same square of tiles and comes through in chunks, then stays that size. You cannot tell the type while the film is covering. If Custom is on but the frames are empty (never drawn, or **Reset All**), RUN skips that overlay and scrambles the letters instead — it does not fill in the default pattern. The pixels stay square and sit in the middle of the card even if the window is wide; empty cells are the page background. The objective sits under the name field; the chosen prompt (or the stack of prompts) sits in the center of the remaining card.
- **Navigate** between students with the ← → arrows
- **GO TO NEXT** confirms the current result and opens a fresh slot

**The Result**: each student gets one option from each prompt, all drawn from the same grouping — for example "a paperclip + a laser cutter".

### 3. **Customize** (`theme.html` — themes and reveal animation)

Opened from **Customize** in the editor `...` menu (under Help & Instructions — advanced). Pick one of 8 leftover-card thumbnails (the page re-skins immediately). Tune ink, paper, stroke, leftover-card frame (0 = none), glow, font family, size, and style. **Save look** stamps that mix onto the selected thumbnail; **Factory** recalls the original recipe; **Use on [activity]** stamps it onto the open activity. Choose the default geometric reveal, or draw your own (grid 6×6–20×20, 2–12 frames; a new animation starts at 6×6 with 2 frames). An empty custom drawing does not play the default pattern — the prompting window scrambles text instead. The film saves with the open activity. **Restore defaults** returns to the factory geometric film. Download the animation as a JSON file to recall it on another machine.

---

## Quick Start Guide

**Try the Sample Activity First!**
- A sample activity called "Sample" is available in the FILE menu and is restored automatically if deleted
- It is loaded from `Sample-activity-2025-10-27.csv`, which is the source of truth for it
- Run it to see how the system works

1. **Open the Editor**
   - Open `editor.html` in your browser
   - The sample activity loads automatically on first use

2. **Create Your First Prompt**
   - Click **+ Add Prompt** to create a column (max 4)
   - Give it a heading (e.g. "USES", "AND")

3. **Add Groupings**
   - Click **+ Add Grouping** to create a row (max 6)
   - Groupings are labelled A, B, C… automatically
   - Fill in options, one per line

4. **Set an Objective** (optional)
   - Type what students should create or accomplish — it appears under the name field on the leftover card
   - If you skip it, you can still run as long as you have prompts. The editor will ask once; choose **Skip** to proceed

5. **Save Your Activity**
   - Open the **FILE** menu (`...` in the top right)
   - Choose **Save** or **Save As** and give it a name

6. **Start Prompting**
   - Click **RUN** / **START PROMPTING**
   - Optionally enter a student name
   - Press **RUN**, Up Arrow, or Enter to generate

---

## Controls

> **Maintainers:** these tables are the only record of the control scheme — the design
> decision that used to pin it (D7) was retired. They mirror `keyPressed()` in
> `sketch-refactored.js` and the button wiring in `ui-manager.js`. If you change a binding
> or a button label, update this section in the same turn, and verify against the code
> rather than against this table.

### In the Prompting Window

| Control | What it does |
|---------|--------------|
| **RUN** button (circular) | Generate prompts and **start** the film. While it loops the button reads **STOP** — press again to glitch-land on the prompts (transition sound, then land note). The film does not end on its own. Becomes **RE-RUN** (dimmed) once a result is showing |
| **GO TO NEXT** button | Confirm the current result and open a fresh slot |
| **↑ (Up Arrow)** or **Enter** | Generate prompts (same as RUN). Second press while the film is up skips to the result |
| **↓ (Down Arrow)** | Confirm and advance to the next slot |
| **← → (Left/Right Arrows)** | Navigate between students / browse history |
| **Space** | Interrupt a scramble in progress and **clear** it (no result). Does **not** generate |
| **screenshot** | Save a PNG of the current result |
| **report** | Download the report for the current activity |
| **clear** | Clear the report for the current activity |
| **edit** | Return to the editor |

Pressing Up / Enter again on a finished result **re-rolls** that student: their previous
options go back into the pool and a new combination is drawn (rule R5). While the film
is still looping, a second RUN / Up / Enter **stops** it: a short transition sound, paper tiles lift, the words scramble into place through the holes, then the land note. The film does not time out.

### In the Editor

| Control | What it does |
|---------|--------------|
| **P** | Go to the prompting window if the activity has data; if it doesn’t, go to `index.html`. Ignored while typing in a field |
| **FILE** menu (`...`) | New, Save, Save As, Share, Load, Restore Last Run |
| **Help & Instructions** | Open the in-app guide |
| **Customize** (`...`) | Advanced; under Help. Opens the theme + reveal-animation page (`theme.html`) |

### The phone cube

On a phone or narrow window the editor switches to a single-prompt "cube" view:

- **Swipe left / right**, or the **‹ ›** buttons, to move between prompts
- **Swipe up / down** (outside a text area) to move between groupings
- **+** adds a prompt or grouping
- Text areas still scroll normally; the gesture handler locks to one axis so scrolling and taps aren't hijacked

---

## Key Features

### **Smart Repetition Prevention**
Options that have been drawn stay "in play" and can't be drawn again until they're put back or the pool for that prompt is exhausted, at which point it refreshes. Tracking is per prompt, across all groupings. See `RANDOMIZER_LOGIC_SPEC.md`.

### **Unnamed runs**
Student names are **optional**. If no name is entered, runs are labelled automatically as "Run 1", "Run 2", and so on. Naming can be required per activity via the `requireStudentNames` setting; the default is off, so a teacher can start prompting immediately.

### **Student names**
Type a name, or paste several separated by commas ("Alec, Marc, Miles") to build a list you can navigate with ← →. A counter under the field shows your position in the list.

### **Per-activity reports**
Results are stored **per activity**, not in one shared pile. Switching activities saves the session you're leaving and restores the one you're entering, so two activities never mix their results. **Restore Last Run** in the FILE menu reopens the most recent session. Reports persist across trips to the editor and are only cleared by **clear**.

### **Activity History**
Save multiple activity templates and switch between them. Each activity remembers its prompts, groupings, grouping labels, objective, theme, background, and reveal animation.

### **Export and Share**
Share from FILE to give another teacher the activity. Sentences with commas stay intact (the CSV quotes those cells). If the activity has pictures, you get a warning — **Saving this means saving images** — then a zip folder with `activity.csv` and a `media` folder. No pictures → a plain CSV. Load accepts either. Reports list pictures as `[image]`. The reveal animation is still a separate JSON download (D-055).

### **Reports and Screenshots**
- Take screenshots of individual student results
- Download a report showing all students and their prompts
- Reports include the objective and activity settings for context

### **Themes**
Eight themes ship with the app: Windows, Macintosh, Green CRT, Orange CRT, Blue CRT, Purple CRT, Pink CRT, and Black. Open **Customize** from the editor `...` menu under Help & Instructions (`theme.html`) — not a dropdown on that panel. The choice is saved per activity and carried through CSV export/import.

Each preset can be tuned on that page: ink, paper, stroke color, stroke size, leftover-card **frame** (0 = none), glow, font family, font size, and font style. Ink, paper, and stroke are four short palettes (Pastel, Primary, Neon, Shades) that span the Tune panel — named web colors, not the full system picker (**D-030**, **D-033**). The eight cards are leftover-card thumbnails: **Save look** stamps the mix on the selected card, **Factory** recalls that card’s original recipe, **Use on [activity]** stamps the look onto the open activity so opening it later recalls it (**D-033**). Tweaks stay with that preset in this browser (**D-026**).

On the same page you can keep the default geometric reveal, or draw a custom animation. Two sliders set **grid size** (6–20 squares on a side) and **frames** (2–12 drawings). A new animation starts at 6×6 with 2 frames; an animation already saved in this browser keeps the size you last used. Lowering **Frames** parks the extra drawings; raising it brings them back (**D-041**). **Reset All** is what actually throws those parked drawings away. The frames sit in a centered row above the drawing grid; drag a thumbnail to reorder. Under each thumbnail is a note name — C-1 through C3 (pentatonic C D E G A at each octave), or **mute**. Click it to cycle. Those pitches always sound complementary; the number after the letter is how many octaves above this app’s C, and **-1** is one octave below (**D-042**, **D-049**). Shift-click selects a range of frames; hold Shift while drawing to flip pen and eraser. **Clear Frame** empties the selected frame(s); **Reset All** empties the whole sequence. The leftover-card window at the top of that section previews both modes (silently). **Play** on a custom animation hears those notes — the same ones the prompting window uses (**D-040**). **Land** (next to Grid / Frames) is the ping when the prompts appear, from the same scale (**D-046**). **Copy to Next** duplicates the outlined drawing onto the next slot (not the tone). The pixel palette starts on **Theme ink** so strokes follow the current look; other swatches stay that color. The animation is saved in this browser and **with the open activity**, and can be downloaded as a JSON file. **Restore defaults** returns to the factory geometric film (6×6, 2 frames). Empty Custom does not play that factory film — RUN scrambles letters instead (**D-058**). Drawn Custom and Default Pattern still play as saved (**D-025**, **D-027**, **D-031**, **D-032**, **D-055**).

### **Welcome popup**
First-time visitors to `index.html` get a one-time welcome explaining the idea, the difference between prompts and groupings, and a link into Help & Instructions. It is shown once and remembered in local storage (`randoCalrissianWelcomeSeen`).

### **Help & Instructions**
The editor has a built-in guide covering how prompting works, prompts vs groupings, classroom uses, and every control on both desktop and phone. Link straight to it with `editor.html?help=1`.

---

## Tips for Best Results

### **Organize Your Groupings Logically**
Groupings let you keep combinations compatible, or differentiate by age, experience, interests, or support needs. For example:
- **Grouping A**: beginner-friendly materials and tools
- **Grouping B**: advanced materials and tools

Because a run locks to a single grouping, options in the same grouping should make sense together.

### **Use Clear, Specific Options**
- ✅ Good: "a laser cutter"
- ❌ Less useful: "a tool"

### **Test Your Activity First**
Before using with students, run it yourself to make sure the combinations make sense.

### **Save Frequently**
Save activities with descriptive names so you can reuse or share them later.

---

## Example Use Case

**Scenario**: A design teacher wants students to design a gift.

1. **In the Editor**:
   - Prompt 1: "USES" (a paperclip, rope, colour paper, an elastic)
   - Prompt 2: "AND" (a laser cutter, a 3D printer, an embroidery machine, a vinyl cutter)
   - Objective: "Make a gift for a friend that:"
   - Saves as "Gift Design Challenge"

2. **In the Prompting Window**:
   - Student "Alex" runs and gets "a paperclip + a laser cutter"
   - Student "Sam" runs and gets "rope + a vinyl cutter"
   - Neither of those four options can come up again until the pools refresh

3. **Result**:
   - All students work on the same kind of project with different constraints
   - The teacher can track who got what and download a report

---

## For Developers

**Stack**: HTML5/CSS3, vanilla JavaScript, and p5.js for the prompting window. **No build step** — open the HTML files directly, or serve the folder (`python3 -m http.server 8000`).

**Storage**: `localStorage` is the source of truth for activity text, `img:` tokens, `selectedTheme`, per-preset `themeCustomizations`, and the reveal animation (`revealAnimation`, plus a copy on the open activity — D-055).
The actual PNG/JPG files live in IndexedDB (`promptMeImages`, object store `blobs`).
Editor and prompting window sync through a `promptDataUpdated` custom event and the
`storage` event across tabs.

### Cache busting

Twenty-three local module `<script>` tags carry `?v=20260830ba` (nine on `editor.html`,
ten on `sketch.html`, three on `theme.html`, one on `index.html`). After editing any of those modules, bump that value on **all
twenty-three together**. Mismatched values load a mix of old and new files.

`sketch.html` also loads p5.js from a CDN (untagged). The Sample activity CSV fetch uses the same `?v=20260830ba`
value as the tagged modules.

### Companion documents

| Document | Purpose |
|----------|---------|
| `RANDOMIZER_LOGIC_SPEC.md` | Required randomizer behavior (R1–R7, I1–I6, scenarios S1–S10) |
| `DESIGN_DECISIONS.md` | Why visual/UX choices are the way they are (D1–D59: D6 and D7 retired; D16 superseded by D17; D29 superseded by D32; D34 superseded by D36; D43 superseded by D49), plus future directions |
| `CHANGELOG.txt` | Development history |
| `docs/TROUBLESHOOT_LOCALHOST.md` | Local server troubleshooting |

---

## Copyright & Attribution

### Creative Commons License

**Rando Calrissian** by **Alec Mathewson**

This work is licensed under a [Creative Commons Attribution 4.0 International License](http://creativecommons.org/licenses/by/4.0/).

You are free to:
- **Share** — copy and redistribute the material in any medium or format
- **Adapt** — remix, transform, and build upon the material for any purpose, even commercially

Under the following terms:
- **Attribution** — You must give appropriate credit, provide a link to the license, and indicate if changes were made

### Third-Party Components

**VT323 Font (Retro Terminal Font)**
- Source: Google Fonts
- Designer: Peter Hull
- License: SIL Open Font License (OFL)
- Used throughout the application interface for the retro terminal aesthetic

**p5.js Library (Animation & Graphics)**
- Source: p5.js Foundation
- Version: 1.4.0
- License: LGPL 2.1
- Used for creative coding, graphics rendering, and animation effects in the prompting interface
- Attribution: This application uses p5.js, a JavaScript library for creative coding, developed by the p5.js Foundation and community. The scrambling and revealing animations are powered by p5.js.

### Application Copyright

Rando Calrissian © 2025–2026 by Alec Mathewson

This application is designed for educational use. The source code, user interface, and original content are protected by copyright and licensed under Creative Commons Attribution 4.0 International License.
