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
The prompting interface features a retro terminal aesthetic with smooth animations that make the experience engaging and fun. Students watch as their prompts reveal themselves in an exciting, game-like way. Eight themes are available in the editor (see "Themes").

### 💾 **Save and Share**
Create activity templates and save them for future use. Share your prompt sets with other teachers via CSV files. Everything is stored locally in your browser, so your data stays private.

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

Rando Calrissian has two main parts:

### 1. **The Editor** (`editor.html` — where you set up prompts)

- **Add Prompts**: Create up to **4** prompt columns (`MAX_PROMPTS`), each with an optional heading students see, such as USES, WITH, or AND. Leave the heading blank and it will not appear on the card.
- **Add Groupings**: Create up to **6** grouping rows (`MAX_CATEGORIES`), labelled A, B, C… automatically
- **Fill in Options**: Add one option per line in each cell. You can also drop or paste a PNG or JPG onto the list (under 2MB). Pictures chatter like a scramble, then appear on the card.
- **Set an Objective** (optional): Write what students should create or accomplish. You can Skip and still run if you have prompts.
- **Save Your Activity**: Use the File menu to name and save it

**Think of it like a grid**: rows are groupings, columns are prompts, and each cell holds one option per line.

On a **phone or narrow window**, the grid is replaced by a **cube layout** that shows one prompt at a time — see "The phone cube" below.

### 2. **The Prompting Window** (`sketch.html` — where students get prompts)

- **Enter a name** (optional — see "Unnamed runs")
- **Press RUN**, or the Up Arrow / Enter key, to generate a combination
- **Watch the animation** as prompts scramble and resolve. Short lists (1–3 words) reveal letter by letter; longer sentences (4+ words) finish in about a second and wrap to fit the card. The scramble borrows another option’s length so you can’t read the answer from how long the spinning text is. A picture option uses the same beep clock with flickering dots, then appears.
- **Navigate** between students with the ← → arrows
- **GO TO NEXT** confirms the current result and opens a fresh slot

**The Result**: each student gets one option from each prompt, all drawn from the same grouping — for example "a paperclip + a laser cutter".

---

## Quick Start Guide

**Try the Sample Activity First!**
- A sample activity called "Sample" is available in the File menu and is restored automatically if deleted
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
   - Type what students should create or accomplish — it appears at the top of the prompting screen
   - If you skip it, you can still run as long as you have prompts. The editor will ask once; choose **Skip** to proceed

5. **Save Your Activity**
   - Open the **File** menu (`...` in the top right)
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
| **RUN** button (circular) | Generate prompts. Becomes **RE-RUN** (dimmed) once a result is showing |
| **GO TO NEXT** button | Confirm the current result and open a fresh slot |
| **↑ (Up Arrow)** or **Enter** | Generate prompts (same as RUN) |
| **↓ (Down Arrow)** | Confirm and advance to the next slot |
| **← → (Left/Right Arrows)** | Navigate between students / browse history |
| **Space** | Interrupt a scramble in progress and reset it. Does **not** generate |
| **screenshot** | Save a PNG of the current result |
| **report** | Download the report for the current activity |
| **clear** | Clear the report for the current activity |
| **edit** | Return to the editor |

Pressing Up / Enter again on a finished result **re-rolls** that student: their previous
options go back into the pool and a new combination is drawn (rule R5). Presses are
ignored while the scramble animation is still running.

### In the Editor

| Control | What it does |
|---------|--------------|
| **P** | Go to the prompting window if the activity has data; if it doesn’t, go to `index.html`. Ignored while typing in a field |
| **File** menu (`...`) | New, Save, Save As, Share, Load, Restore Last Run |
| **Theme** menu | Choose one of 8 themes |
| **Help & Instructions** | Open the in-app guide |

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
Results are stored **per activity**, not in one shared pile. Switching activities saves the session you're leaving and restores the one you're entering, so two activities never mix their results. **Restore Last Run** in the File menu reopens the most recent session. Reports persist across trips to the editor and are only cleared by **clear**.

### **Activity History**
Save multiple activity templates and switch between them. Each activity remembers its prompts, groupings, grouping labels, objective, theme, and background.

### **Export and Share**
Save activities as CSV to share with other teachers, and import CSVs created by others. The CSV carries a metadata header (activity name, theme, background, objective, grouping labels) plus all prompt and grouping content. PNG/JPG files are **not** in the CSV (they stay in this browser); reports list pictures as `[image]`.

### **Reports and Screenshots**
- Take screenshots of individual student results
- Download a report showing all students and their prompts
- Reports include the objective and activity settings for context

### **Themes**
Eight themes ship with the app: Windows, Macintosh, Green CRT, Orange CRT, Blue CRT, Purple CRT, Pink CRT, and Black. The choice is saved per activity and carried through CSV export/import. Theming is live, maintained infrastructure — see decision **D8** in `DESIGN_DECISIONS.md`, which treats it as the foundation for letting teachers restyle the app as their own room.

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

**Storage**: `localStorage` is the source of truth for activity text and `img:` tokens.
The actual PNG/JPG files live in IndexedDB (`promptMeImages`, object store `blobs`).
Editor and prompting window sync through a `promptDataUpdated` custom event and the
`storage` event across tabs.

### Cache busting

Fourteen local module `<script>` tags carry `?v=20260830l` (seven on `editor.html`,
seven on `sketch.html`). After editing any of those modules, bump that value on **all
fourteen together**. Mismatched values load a mix of old and new files.

`theme-manager.js` is loaded on `editor.html`, `sketch.html`, and `index.html` with
**no** `?v=`. `index.html` has no other local modules. `sketch.html` also loads p5.js
from a CDN (untagged). The Sample activity CSV fetch uses the same `?v=20260830l`
value as the tagged modules.

### Companion documents

| Document | Purpose |
|----------|---------|
| `RANDOMIZER_LOGIC_SPEC.md` | Required randomizer behavior (R1–R7, I1–I6, scenarios S1–S10) |
| `DESIGN_DECISIONS.md` | Why visual/UX choices are the way they are (D1–D23: D6 and D7 retired; D16 superseded by D17), plus future directions |
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
