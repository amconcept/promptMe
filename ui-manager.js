// UI Manager - Handles all UI elements and interactions
// Responsible: buttons, inputs, positioning (control panel removed per wireframe redesign)

// When true: no sidebar control panel; only central card, screenshot top-right, name area, EDITOR link
const SKETCH_HIDE_CONTROL_PANEL = true;

// UI State Variables
let controlPanel;
let controlPanelVisible = true;
let controlPanelToggle;
let recordButton;
let downloadReportButton;
let resetReportButton;
let prevStudentButton;
let nextStudentButton;
let resultsLabel; // "Results X of Y" between arrows (below card)
let resultNameWrapper; // name input only — card identifier row
let resultNameInput;
let nextHintWrapper; // blinking "> NEXT" above top of card (separate from name)

// Control panel positioning constants - now responsive
const CONTROL_PANEL_OFFSET = () => Math.max(min(width * 0.15, 140), 100);  // 15% of width, max 140px, min 100px
const TOGGLE_BUTTON_OFFSET = () => Math.max(min(width * 0.05, 50), 30);    // 5% of width, max 50px, min 30px

// Update spacing to use relative values
const SPACING = {
    TOP_MARGIN: 0.05,        // 5% of height
    OBJECTIVE_MARGIN: 0.12,  // 12% of height
    PROMPT_START: 0.45,      // 25% of height
    PROMPT_SPACING: 0.06,    // 12% of height between prompts
    CATEGORY_OFFSET: 0.45,   // 45% of width
    PROMPT_OFFSET: 0.48,     // 48% of width
    BOTTOM_MARGIN: 0.05,     // 5% of height
    PROMPT_RESULTS_LEFT: 0.18  // 18% of width - prompt results block offset from left edge (labels right-justified, results in fixed column)
};

// Update font sizes to be dynamic with minimum constraints
// Use p5 width/height when available; fallback to window size so values are never NaN
function _fontBase() {
    const w = (typeof width !== 'undefined' && Number(width) > 0) ? width : (window.innerWidth || 800);
    const h = (typeof height !== 'undefined' && Number(height) > 0) ? height : (window.innerHeight || 600);
    return Math.min(w, h);
}
const FONT_SIZES = {
    NAME: () => Math.max(_fontBase() * 0.08, 16),      // Min 16px
    OBJECTIVE: () => Math.max(_fontBase() * 0.04, 12),  // Min 12px
    PROMPTS: () => Math.max(_fontBase() * 0.06, 12),   // Min 12px - Same as CATEGORY
    CATEGORY: () => Math.max(_fontBase() * 0.06, 12),  // Min 12px
    INSTRUCTIONS: () => Math.max(_fontBase() * 0.03, 10), // Min 10px
    INPUT: () => Math.max(_fontBase() * 0.03, 12),     // Min 12px
    BUTTON: () => Math.max(_fontBase() * 0.04, 10)    // Min 10px
};
if (typeof window !== 'undefined') window.FONT_SIZES = FONT_SIZES;

// Centered vintage prompt card (sketch) — tweak ratios here
const CARD_LAYOUT = {
    WIDTH_RATIO: 0.72,
    HEIGHT_RATIO: 0.75,
    PAD_X_RATIO: 0.08,
    PAD_Y_RATIO: 0.04,
    CORNER_MAX: 40
};
if (typeof window !== 'undefined') window.CARD_LAYOUT = CARD_LAYOUT;

// Update button sizes to be dynamic with minimum constraints
const BUTTON_SIZES = {
    WIDTH: () => Math.max(min(width * 0.25, 300), 200),    // 25% of width, max 300px, min 200px
    HEIGHT: () => Math.max(min(height * 0.06, 50), 30),    // 6% of height, max 50px, min 30px
    MARGIN: () => Math.max(min(width * 0.03, 40), 20),     // 3% of width, max 40px, min 20px
    BOTTOM_MARGIN: () => Math.max(min(height * 0.05, 40), 20), // 5% of height, max 40px, min 20px
    ELEMENT_SPACING: () => Math.max(min(height * 0.02, 20), 10) // Minimum spacing between elements
};

// Centralized control panel positioning function (when panel hidden: positions top-right bubbles)
function positionControlPanel() {
    const currentWidth = (typeof width !== 'undefined' && width > 0) ? width : window.innerWidth;
    const topRightY = 20;
    const topRightX = currentWidth - 20;

    if (SKETCH_HIDE_CONTROL_PANEL) {
        // Stack top-right bubbles: screenshot, report, clear
        const btnW = 90;
        const btnH = 36;
        const gap = 8;

        let y = topRightY;
        if (recordButton) {
            recordButton.position(topRightX - btnW, y);
            y += btnH + gap;
        }
        if (downloadReportButton) {
            downloadReportButton.position(topRightX - btnW, y);
            y += btnH + gap;
        }
        if (resetReportButton) {
            resetReportButton.position(topRightX - btnW, y);
        }
        return;
    }

    if (controlPanelToggle) {
        const toggleWidth = 28;
        controlPanelToggle.position(topRightX - toggleWidth, topRightY);
    }
    if (controlPanel) {
        const toggleHeight = 28;
        const gap = 12;
        const panelTop = topRightY + toggleHeight + gap;
        const panelWidth = 220;
        controlPanel.position(topRightX - 20 - panelWidth, panelTop);
    }
}

// Helper function to ensure audio context is ready and play click sound
function playClickSound() {
    // Ensure audio context exists - create if needed
    if (!window.audioCtx) {
        try {
            window.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Could not create audio context:', e);
            return;
        }
    }
    
    // Resume audio context if suspended (required by browser autoplay policy)
    if (window.audioCtx.state === 'suspended') {
        window.audioCtx.resume().then(() => {
            if (window.playSound && window.SOUND) {
                window.playSound(window.SOUND.CLICK);
            }
        }).catch(e => {
            console.log('Could not resume audio context:', e);
            // Try to play anyway - might work
            if (window.playSound && window.SOUND) {
                window.playSound(window.SOUND.CLICK);
            }
        });
    } else {
        // Context is already running, play immediately
        if (window.playSound && window.SOUND) {
            window.playSound(window.SOUND.CLICK);
        }
    }
}

// Toggle control panel visibility
// Same as editor: Unicode escapes so icon never shows as random text
var SKETCH_TOGGLE_MENU = '\u2630';   // ☰ hamburger (panel closed)
var SKETCH_TOGGLE_MINUS = '\u2212';  // − minimize (panel open)

function updateSketchToggleIcon() {
    if (!controlPanelToggle) return;
    controlPanelToggle.html(controlPanelVisible ? SKETCH_TOGGLE_MINUS : SKETCH_TOGGLE_MENU);
}

function toggleControlPanel() {
    if (SKETCH_HIDE_CONTROL_PANEL || !controlPanelToggle || !controlPanel) return;
    controlPanelVisible = !controlPanelVisible;
    if (controlPanelVisible) {
        controlPanel.style('display', 'block');
    } else {
        controlPanel.style('display', 'none');
    }
    updateSketchToggleIcon();
}

// Position name input, results nav, and >EDITOR without overlap
function positionNameInputAndButtons() {
    // Use actual window dimensions if p5.js dimensions aren't ready yet
    const currentWidth = (typeof width !== 'undefined' && width > 0) ? width : window.innerWidth;
    const currentHeight = (typeof height !== 'undefined' && height > 0) ? height : window.innerHeight;
    
    const elementHeight = BUTTON_SIZES.HEIGHT();
    const isNarrow = currentWidth <= 768;

    // >EDITOR DOM button — measure so nav can clear it
    const editorSection = document.querySelector('.design-prompts-section');
    const editorBtn = document.querySelector('.design-prompts');
    let editorW = isNarrow ? 88 : 140;
    let editorH = isNarrow ? 36 : 44;
    if (editorBtn) {
        const er = editorBtn.getBoundingClientRect();
        if (er.width > 0) editorW = er.width;
        if (er.height > 0) editorH = er.height;
    }
    const edgePad = isNarrow ? 10 : 20;
    const gap = isNarrow ? 10 : 16;

    // Bottom band: [<] Results [>]  ……  >EDITOR  (same row, no overlap)
    const arrowWidth = isNarrow ? 36 : 30;
    const nameFieldWidth = isNarrow
        ? Math.max(100, Math.min(currentWidth - editorW - arrowWidth * 2 - edgePad * 2 - gap * 3, 160))
        : BUTTON_SIZES.WIDTH();
    const navTotalW = nameFieldWidth + (arrowWidth * 2) + 20;
    const rowH = Math.max(elementHeight, editorH);
    const fieldY = currentHeight - edgePad - rowH;
    // Center nav in the space left of EDITOR
    const usableRight = currentWidth - edgePad - editorW - gap;
    const startX = Math.max(edgePad, (usableRight - navTotalW) / 2);
    const fieldX = startX + arrowWidth + 10;

    // Place EDITOR at bottom-right of the same band
    if (editorSection && editorSection.style) {
        editorSection.style.bottom = edgePad + 'px';
        editorSection.style.right = edgePad + 'px';
        editorSection.style.top = 'auto';
        editorSection.style.left = 'auto';
    }

    if (SKETCH_HIDE_CONTROL_PANEL && resultsLabel) {
        resultsLabel.position(fieldX, fieldY + Math.max(0, (rowH - elementHeight) / 2));
        resultsLabel.size(nameFieldWidth, elementHeight);

        const historyTotal = (typeof window.classReport !== 'undefined' && Array.isArray(window.classReport))
            ? window.classReport.length
            : 0;
        const fallbackTotal = (typeof allStudents !== 'undefined' && Array.isArray(allStudents))
            ? allStudents.length
            : 0;
        const baseTotal = historyTotal > 0 ? historyTotal : fallbackTotal;

        // 0-based slot index; do not clamp when currentStudentIndex === classReport.length (empty slot after NEXT)
        let idx = (typeof currentStudentIndex !== 'undefined' && currentStudentIndex >= 0) ? currentStudentIndex : 0;
        const displayTotal = Math.max(baseTotal, idx + 1, 1);

        resultsLabel.html('Results ' + (idx + 1) + ' of ' + displayTotal);
        resultsLabel.show();
    }
    // Name input: centered in the card identifier row
    if (SKETCH_HIDE_CONTROL_PANEL && resultNameWrapper && resultNameWrapper.elt) {
        const bounds = window.sketchCardBounds;
        if (bounds && typeof bounds.x === 'number') {
            const fontPx = bounds.nameSize || Math.max(FONT_SIZES.INPUT(), 18);
            const rowHName = bounds.nameRowH || 40;
            const rowY = (typeof bounds.nameRowY === 'number') ? bounds.nameRowY : (bounds.y + 16);
            resultNameWrapper.elt.style.fontSize = fontPx + 'px';
            resultNameWrapper.elt.style.fontWeight = 'bold';
            resultNameWrapper.elt.style.justifyContent = 'center';
            const approxW = Math.min(bounds.w * 0.55, 320);
            resultNameWrapper.elt.style.width = approxW + 'px';
            resultNameWrapper.position(bounds.x + (bounds.w - approxW) / 2, rowY + Math.max(0, (rowHName - fontPx) / 2 - 2));
            resultNameWrapper.show();
        } else {
            resultNameWrapper.position(Math.max(24, currentWidth * 0.02), Math.max(20, currentHeight * 0.06));
            resultNameWrapper.show();
        }
    }
    // NEXT control: above the top-right corner of the card (`>` then NEXT inline)
    if (SKETCH_HIDE_CONTROL_PANEL && nextHintWrapper && nextHintWrapper.elt) {
        const bounds = window.sketchCardBounds;
        const fontPx = Math.max(FONT_SIZES.INPUT(), 16);
        nextHintWrapper.elt.style.fontSize = fontPx + 'px';
        nextHintWrapper.elt.style.justifyContent = 'flex-end';
        if (bounds && typeof bounds.x === 'number') {
            const gapAboveCard = 8;
            const top = Math.max(8, bounds.y - gapAboveCard - fontPx * 1.15);
            // Align trailing "T" with where the top edge meets the corner radius (not the outer corner tip)
            const hintW = nextHintWrapper.elt.offsetWidth || Math.ceil(fontPx * 4.5);
            const radiusInset = (typeof bounds.cornerRadius === 'number') ? bounds.cornerRadius : 24;
            nextHintWrapper.position(bounds.x + bounds.w - hintW - radiusInset, top);
        } else {
            nextHintWrapper.position(Math.max(24, currentWidth * 0.72), Math.max(12, currentHeight * 0.04));
        }
        nextHintWrapper.show();
    }
    const arrowY = fieldY + Math.max(0, (rowH - elementHeight) / 2);
    if (prevStudentButton) {
        prevStudentButton.position(startX, arrowY);
        if (isNarrow) {
            prevStudentButton.style('width', arrowWidth + 'px');
            prevStudentButton.style('height', elementHeight + 'px');
        }
    }
    if (nextStudentButton) {
        nextStudentButton.position(startX + arrowWidth + 10 + nameFieldWidth + 10, arrowY);
        if (isNarrow) {
            nextStudentButton.style('width', arrowWidth + 'px');
            nextStudentButton.style('height', elementHeight + 'px');
        }
    }
}

// Create UI elements (control panel omitted when SKETCH_HIDE_CONTROL_PANEL)
function createUI() {
    // Default behavior: randomizer mode (names hidden) unless enabled in saved state
    if (typeof window.requireStudentNames !== 'boolean') {
        window.requireStudentNames = false;
    }
    if (typeof window.unnamedRunCounter !== 'number' || Number.isNaN(window.unnamedRunCounter)) {
        window.unnamedRunCounter = 0;
    }

    if (!SKETCH_HIDE_CONTROL_PANEL) {
        controlPanelToggle = createButton('');
        controlPanelToggle.style('display', 'block');
        controlPanelToggle.mousePressed(() => { playClickSound(); toggleControlPanel(); });
        controlPanelToggle.style('background-color', 'var(--background-color)');
        controlPanelToggle.style('border', '2px solid var(--primary-color)');
        controlPanelToggle.style('border-radius', '0px');
        controlPanelToggle.style('color', 'var(--primary-color)');
        controlPanelToggle.style('font-family', 'VT323, monospace');
        controlPanelToggle.style('font-size', '14px');
        controlPanelToggle.style('font-weight', 'bold');
        controlPanelToggle.style('width', '28px');
        controlPanelToggle.style('height', '28px');
        controlPanelToggle.style('box-sizing', 'border-box');
        controlPanelToggle.style('cursor', 'pointer');
        controlPanelToggle.style('box-shadow', 'inset 1px 1px 0px var(--primary-color), inset -1px -1px 0px var(--primary-color)');
        controlPanelToggle.style('transition', 'all 0.1s ease');
        controlPanelToggle.mouseOver(() => {
            controlPanelToggle.style('background-color', 'var(--primary-color)');
            controlPanelToggle.style('color', 'var(--background-color)');
            controlPanelToggle.style('box-shadow', 'inset 1px 1px 0px var(--background-color), inset -1px -1px 0px var(--background-color)');
        });
        controlPanelToggle.mouseOut(() => {
            controlPanelToggle.style('background-color', 'var(--background-color)');
            controlPanelToggle.style('color', 'var(--primary-color)');
            controlPanelToggle.style('box-shadow', 'inset 1px 1px 0px var(--primary-color), inset -1px -1px 0px var(--primary-color)');
        });
        controlPanel = createDiv('');
        controlPanel.style('background-color', 'var(--background-color)');
        controlPanel.style('border', '2px solid var(--primary-color)');
        controlPanel.style('border-radius', '0px');
        controlPanel.style('padding', '6px');
        controlPanel.style('font-family', 'VT323, monospace');
        controlPanel.style('color', 'var(--text-color)');
        controlPanel.style('font-size', 'clamp(16px, 2.5vw, 20px)');
        controlPanel.style('width', '220px');
        controlPanel.style('box-sizing', 'border-box');
        controlPanel.style('box-shadow', 'inset 1px 1px 0px var(--primary-color), inset -1px -1px 0px var(--primary-color), 2px 2px 0px var(--primary-shadow)');
        controlPanel.style('transition', 'none');
        controlPanel.style('display', 'block');
        updateSketchToggleIcon();
        positionControlPanel();
        const panelTitle = createDiv('CONTROL PANEL');
        panelTitle.parent(controlPanel);
        panelTitle.style('text-align', 'center');
        panelTitle.style('font-weight', 'bold');
        panelTitle.style('margin-bottom', '4px');
        panelTitle.style('color', 'var(--primary-color)');
        panelTitle.style('font-size', '18px');
        panelTitle.style('letter-spacing', '1px');
        const instructionsCard = createDiv(
            '<div style="font-weight:bold; margin-bottom:4px;">INSTRUCTIONS</div>' +
            '<div>↑ / Enter : Run prompts</div>' +
            '<div>← → : Browse results</div>' +
            '<div>+ : Use names</div>' +
            '<div>X : Randomizer mode</div>'
        );
        instructionsCard.parent(controlPanel);
        instructionsCard.style('border', '1px solid var(--primary-color)');
        instructionsCard.style('padding', '6px');
        instructionsCard.style('margin-bottom', '6px');
        instructionsCard.style('color', 'var(--primary-color)');
        instructionsCard.style('font-size', '16px');
        instructionsCard.style('line-height', '1.2');
        instructionsCard.style('text-align', 'left');
        instructionsCard.style('letter-spacing', '0.3px');
    }

    if (SKETCH_HIDE_CONTROL_PANEL) {
        resultsLabel = createDiv('Results 1 of 1');
        resultsLabel.style('font-family', 'VT323, monospace');
        resultsLabel.style('font-size', FONT_SIZES.INPUT() + 'px');
        resultsLabel.style('color', 'var(--primary-color)');
        resultsLabel.style('background-color', 'var(--background-color)');
        resultsLabel.style('border', 'none');
        resultsLabel.style('display', 'flex');
        resultsLabel.style('align-items', 'center');
        resultsLabel.style('justify-content', 'center');
        resultsLabel.style('text-align', 'center');
        // Card name input (identifier) — separate from NEXT
        resultNameWrapper = createDiv('');
        resultNameWrapper.elt.style.cssText = 'display:inline-flex; flex-direction:row; align-items:center; justify-content:center; white-space:nowrap; font-family: VT323, monospace; color: var(--primary-color); font-size: ' + Math.max(FONT_SIZES.INPUT(), 14) + 'px; position: absolute;';

        // Blinking "> NEXT" control — above top-right of card; label to the right of chevron
        nextHintWrapper = createDiv('');
        nextHintWrapper.elt.style.cssText = 'display:inline-flex; flex-direction:row; align-items:center; justify-content:flex-end; white-space:nowrap; font-family: VT323, monospace; color: var(--primary-color); font-size: ' + Math.max(FONT_SIZES.INPUT(), 16) + 'px; position: absolute; z-index: 5;';
        const prefixContainer = document.createElement('div');
        prefixContainer.style.cssText = 'display:flex; flex-direction:row; align-items:baseline; gap:0.35em; cursor:pointer; outline:none; -webkit-tap-highlight-color:transparent; flex-shrink:0;';
        prefixContainer.setAttribute('tabindex', '-1');
        const prefixSpan = document.createElement('span');
        prefixSpan.textContent = '>';
        prefixSpan.style.userSelect = 'none';
        prefixSpan.style.fontWeight = 'bold';
        const hintLabel = document.createElement('span');
        hintLabel.textContent = 'NEXT';
        // No transitions — only opacity blinking (synced to three-note cue)
        hintLabel.style.cssText = 'font-size:0.85em; font-weight:bold; letter-spacing:0.08em; opacity:0; transition:none; line-height:1;';
        prefixContainer.appendChild(prefixSpan);
        prefixContainer.appendChild(hintLabel);
        nextHintWrapper.elt.appendChild(prefixContainer);
        let blinkInterval = null;
        let flashInterval = null;
        let flashStartTimeout = null;
        function stopArrowFlash() {
            if (flashStartTimeout) { clearTimeout(flashStartTimeout); flashStartTimeout = null; }
            if (flashInterval) { clearInterval(flashInterval); flashInterval = null; }
            if (blinkInterval) { clearInterval(blinkInterval); blinkInterval = null; }
            prefixSpan.style.opacity = '1';
            hintLabel.style.opacity = '0';
        }
        window.stopResultNameArrowFlash = stopArrowFlash;
        window.startResultNameArrowFlash = function(hint) {
            const mode = (hint === 'start' || hint === 'next') ? hint : (window.getResultNameHint && window.getResultNameHint() || 'next');
            hintLabel.textContent = (mode === 'start') ? 'START' : 'NEXT';
            if (flashStartTimeout) { clearTimeout(flashStartTimeout); flashStartTimeout = null; }
            if (flashInterval) { clearInterval(flashInterval); flashInterval = null; }
            hintLabel.style.opacity = '0';
            prefixSpan.style.opacity = '1';

            function startContinuousBlink() {
                flashInterval = setInterval(() => {
                    const dim = prefixSpan.style.opacity === '0.35';
                    prefixSpan.style.opacity = dim ? '1' : '0.35';
                    hintLabel.style.opacity = dim ? '1' : '0.35';
                }, 400);
            }

            if (typeof window.playNextHintCueSound === 'function') {
                window.playNextHintCueSound(function (beatIndex) {
                    hintLabel.style.opacity = '1';
                    prefixSpan.style.opacity = '1';
                    if (beatIndex < 2) {
                        setTimeout(function () {
                            hintLabel.style.opacity = '0.35';
                            prefixSpan.style.opacity = '0.35';
                        }, 72);
                    }
                });
                flashStartTimeout = setTimeout(function () {
                    flashStartTimeout = null;
                    startContinuousBlink();
                }, 430);
            } else {
                hintLabel.style.opacity = '1';
                startContinuousBlink();
            }
        };
        window.setResultNameHint = function(t) { hintLabel.textContent = (t === 'start') ? 'START' : 'NEXT'; };
        prefixContainer.addEventListener('mouseenter', () => {
            const mode = (window.getResultNameHint && window.getResultNameHint()) || 'next';
            hintLabel.textContent = (mode === 'start') ? 'START' : 'NEXT';
            hintLabel.style.opacity = '1';
            let count = 0;
            blinkInterval = setInterval(() => {
                prefixSpan.style.opacity = prefixSpan.style.opacity === '0.35' ? '1' : '0.35';
                count++;
                if (count >= 6) { clearInterval(blinkInterval); blinkInterval = null; prefixSpan.style.opacity = '1'; }
            }, 120);
        });
        prefixContainer.addEventListener('mouseleave', () => {
            if (blinkInterval) { clearInterval(blinkInterval); blinkInterval = null; }
            prefixSpan.style.opacity = '1';
            if (!flashInterval) hintLabel.style.opacity = '0';
        });
        prefixContainer.addEventListener('click', () => {
            stopArrowFlash();
            if (typeof window.advanceToNextResultAndClearPrompts === 'function') window.advanceToNextResultAndClearPrompts('');
            if (resultNameInput && resultNameInput.elt) resultNameInput.elt.focus();
        });
        resultNameInput = createInput('');
        resultNameInput.elt.setAttribute('placeholder', ' ');
        resultNameInput.elt.style.cssText = 'border:none; background:transparent; outline:none; color:var(--primary-color); -webkit-text-fill-color:var(--primary-color); caret-color:var(--primary-color); font:inherit; font-weight:bold; text-align:center; padding:0; margin:0; display:inline-block; width:100%; min-width:6em;';
        resultNameWrapper.elt.appendChild(resultNameInput.elt);
        if (resultNameInput.elt) resultNameInput.elt.addEventListener('focus', stopArrowFlash);
        resultNameInput.input(() => {
            const val = (resultNameInput.value() || '').trim();
            if (typeof window.onResultNameFieldInput === 'function') window.onResultNameFieldInput(val);
        });
    }

    if (!SKETCH_HIDE_CONTROL_PANEL) {
        const interestContainer = createDiv('');
        interestContainer.parent(controlPanel);
        interestContainer.style('margin-bottom', '4px');
        interestContainer.style('border-top', '1px solid var(--primary-color)');
        interestContainer.style('padding-top', '8px');
        if (interestContainer.elt) interestContainer.elt.setAttribute('data-p5-container', 'interest');
        const interestTitle = createDiv('STUDENT INTERESTS');
        interestTitle.parent(interestContainer);
        interestTitle.style('color', 'var(--primary-color)');
        interestTitle.style('font-size', '18px');
        interestTitle.style('font-weight', 'bold');
        interestTitle.style('margin-bottom', '4px');
        interestTitle.style('text-align', 'center');
        const interestCheckboxes = createDiv('');
        interestCheckboxes.parent(interestContainer);
        interestCheckboxes.id('interest-checkboxes');
        interestContainer.hide();
        const allCategoriesDiv = createDiv('');
        allCategoriesDiv.parent(interestCheckboxes);
    allCategoriesDiv.style('display', 'flex');
    allCategoriesDiv.style('align-items', 'center');
    allCategoriesDiv.style('margin-bottom', '4px');
    
    // Create custom retro checkbox
    const allCategoriesCheckbox = createDiv('');
    allCategoriesCheckbox.parent(allCategoriesDiv);
    allCategoriesCheckbox.id('all-categories-checkbox');
    // CRITICAL: Also set ID on the actual DOM element so document.getElementById() can find it
    if (allCategoriesCheckbox.elt) {
        allCategoriesCheckbox.elt.id = 'all-categories-checkbox';
    }
    allCategoriesCheckbox.class('all-categories-checkbox');
    allCategoriesCheckbox.style('width', '12px');
    allCategoriesCheckbox.style('height', '12px');
    allCategoriesCheckbox.style('border', '1px solid var(--primary-color)');
    allCategoriesCheckbox.style('background-color', 'var(--primary-color)');
    allCategoriesCheckbox.style('margin-right', '6px');
    allCategoriesCheckbox.style('cursor', 'pointer');
    allCategoriesCheckbox.style('position', 'relative');
    allCategoriesCheckbox.attribute('data-checked', 'true');
    // CRITICAL: Also set data-checked on the actual DOM element
    if (allCategoriesCheckbox.elt) {
        allCategoriesCheckbox.elt.setAttribute('data-checked', 'true');
    }
    allCategoriesCheckbox.style('background-color', 'var(--primary-color)');
    
    const allCategoriesLabel = createDiv('All Categories');
    allCategoriesLabel.parent(allCategoriesDiv);
    allCategoriesLabel.style('color', 'var(--primary-color)');
    allCategoriesLabel.style('font-size', '18px');  // Match editor theme-picker label
    allCategoriesLabel.style('cursor', 'pointer');
    allCategoriesLabel.mousePressed(() => {
        // Play click sound for checkbox
        playClickSound();
        
        const isChecked = allCategoriesCheckbox.attribute('data-checked') === 'true';
        allCategoriesCheckbox.attribute('data-checked', !isChecked);
        if (!isChecked) {
            allCategoriesCheckbox.style('background-color', 'var(--primary-color)');
            // Uncheck all individual categories when "All Categories" is selected
            const categoryCheckboxes = document.querySelectorAll('.category-checkbox');
            categoryCheckboxes.forEach(checkbox => {
                checkbox.setAttribute('data-checked', 'false');
                checkbox.style.backgroundColor = 'var(--background-color)';
            });
        } else {
            allCategoriesCheckbox.style('background-color', 'var(--background-color)');
        }
        updateInterestSelection();
    });
    
    // Handle checkbox click
    allCategoriesCheckbox.mousePressed(() => {
        // Play click sound for checkbox
        playClickSound();
        
        const isChecked = allCategoriesCheckbox.attribute('data-checked') === 'true';
        allCategoriesCheckbox.attribute('data-checked', !isChecked);
        if (!isChecked) {
            allCategoriesCheckbox.style('background-color', 'var(--primary-color)');
            // Uncheck all individual categories when "All Categories" is selected
            const categoryCheckboxes = document.querySelectorAll('.category-checkbox');
            categoryCheckboxes.forEach(checkbox => {
                checkbox.setAttribute('data-checked', 'false');
                checkbox.style.backgroundColor = 'var(--background-color)';
            });
        } else {
            allCategoriesCheckbox.style('background-color', 'var(--background-color)');
        }
        updateInterestSelection();
    });
    
    // Create class list upload button (FIRST)
    const classListUploadButton = createButton('LOAD CLASS LIST');
    classListUploadButton.parent(controlPanel);
    classListUploadButton.mousePressed(() => {
        // Play Mac SE-style click sound
        playClickSound();
        
        // Create file input for class list
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.txt,.csv';
        fileInput.style.display = 'none';
        fileInput.onchange = (event) => {
            handleClassListUpload(event);
            // Clean up after processing
            setTimeout(() => {
                if (document.body.contains(fileInput)) {
                    document.body.removeChild(fileInput);
                }
            }, 100);
        };
        document.body.appendChild(fileInput);
        fileInput.click();
    });
    classListUploadButton.style('background-color', 'var(--background-color)');
    classListUploadButton.style('color', 'var(--primary-color)');
    classListUploadButton.style('font-family', 'VT323, monospace');
    classListUploadButton.style('font-size', '18px');  // Match editor settings-item
    classListUploadButton.style('width', '100%');
    classListUploadButton.style('height', '28px');
    classListUploadButton.style('border', '1px solid var(--primary-color)');
    classListUploadButton.style('border-radius', '4px');
    classListUploadButton.style('cursor', 'pointer');
    classListUploadButton.style('margin-bottom', '4px');
    classListUploadButton.style('text-align', 'center');
    classListUploadButton.style('letter-spacing', '0.5px');
    classListUploadButton.mouseOver(() => {
        classListUploadButton.style('background-color', 'var(--primary-color)');
        classListUploadButton.style('color', 'var(--background-color)');
    });
    classListUploadButton.mouseOut(() => {
        classListUploadButton.style('background-color', 'var(--background-color)');
        classListUploadButton.style('color', 'var(--primary-color)');
    });
    
    }

    // Screenshot button: top-right when panel hidden (wireframe), else in panel
    recordButton = createButton(SKETCH_HIDE_CONTROL_PANEL ? 'screenshot' : 'SCREENSHOT');
    if (!SKETCH_HIDE_CONTROL_PANEL) recordButton.parent(controlPanel);
    recordButton.mousePressed(() => {
        playClickSound();
        if (window.takeScreenshot) window.takeScreenshot();
        else {
            const nameToUse = studentName || previousName || 'Student';
            const sanitized = nameToUse.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            saveCanvas(`${sanitized}_${timestamp}`, 'png');
        }
    });
    window.recordButton = recordButton;
    recordButton.style('background-color', 'var(--background-color)');
    recordButton.style('color', 'var(--primary-color)');
    recordButton.style('font-family', 'VT323, monospace');
    recordButton.style('font-size', SKETCH_HIDE_CONTROL_PANEL ? '14px' : '18px');
    recordButton.style('width', SKETCH_HIDE_CONTROL_PANEL ? '90px' : '100%');
    recordButton.style('height', SKETCH_HIDE_CONTROL_PANEL ? '36px' : '28px');
    recordButton.style('border', '1px solid var(--primary-color)');
    recordButton.style('border-radius', SKETCH_HIDE_CONTROL_PANEL ? '18px' : '4px');
    recordButton.style('cursor', 'pointer');
    recordButton.style('margin-bottom', '4px');
    recordButton.style('text-align', 'center');
    recordButton.style('letter-spacing', '0.5px');
    recordButton.mouseOver(() => { recordButton.style('background-color', 'var(--primary-color)'); recordButton.style('color', 'var(--background-color)'); });
    recordButton.mouseOut(() => { recordButton.style('background-color', 'var(--background-color)'); recordButton.style('color', 'var(--primary-color)'); });
    // When panel is hidden, also create compact report/clear bubbles under screenshot
    if (SKETCH_HIDE_CONTROL_PANEL) {
        // Download report bubble
        downloadReportButton = createButton('report');
        downloadReportButton.mousePressed(() => {
            playClickSound();
            if (typeof downloadClassReport === 'function') {
                downloadClassReport();
            }
        });
        downloadReportButton.style('background-color', 'var(--background-color)');
        downloadReportButton.style('color', 'var(--primary-color)');
        downloadReportButton.style('font-family', 'VT323, monospace');
        downloadReportButton.style('font-size', '14px');
        downloadReportButton.style('width', '90px');
        downloadReportButton.style('height', '36px');
        downloadReportButton.style('border', '1px solid var(--primary-color)');
        downloadReportButton.style('border-radius', '18px');
        downloadReportButton.style('cursor', 'pointer');
        downloadReportButton.style('margin-bottom', '4px');
        downloadReportButton.style('text-align', 'center');
        downloadReportButton.style('letter-spacing', '0.5px');
        downloadReportButton.mouseOver(() => {
            downloadReportButton.style('background-color', 'var(--primary-color)');
            downloadReportButton.style('color', 'var(--background-color)');
        });
        downloadReportButton.mouseOut(() => {
            downloadReportButton.style('background-color', 'var(--background-color)');
            downloadReportButton.style('color', 'var(--primary-color)');
        });

        // Clear results bubble
        resetReportButton = createButton('clear');
        resetReportButton.mousePressed(() => {
            playClickSound();
            if (typeof resetClassReport === 'function') {
                resetClassReport();
            }
        });
        resetReportButton.style('background-color', 'var(--background-color)');
        resetReportButton.style('color', 'var(--primary-color)');
        resetReportButton.style('font-family', 'VT323, monospace');
        resetReportButton.style('font-size', '14px');
        resetReportButton.style('width', '90px');
        resetReportButton.style('height', '36px');
        resetReportButton.style('border', '1px solid var(--primary-color)');
        resetReportButton.style('border-radius', '18px');
        resetReportButton.style('cursor', 'pointer');
        resetReportButton.style('text-align', 'center');
        resetReportButton.style('letter-spacing', '0.5px');
        resetReportButton.mouseOver(() => {
            resetReportButton.style('background-color', 'var(--primary-color)');
            resetReportButton.style('color', 'var(--background-color)');
        });
        resetReportButton.mouseOut(() => {
            resetReportButton.style('background-color', 'var(--background-color)');
            resetReportButton.style('color', 'var(--primary-color)');
        });

        // Position all three bubbles
        positionControlPanel();
    }

    if (!SKETCH_HIDE_CONTROL_PANEL) {
    // Create class report button
    downloadReportButton = createButton('DOWNLOAD REPORT');
    downloadReportButton.parent(controlPanel);
    downloadReportButton.mousePressed(() => {
        // Play Mac SE-style click sound
        playClickSound();
        downloadClassReport();
    });
    downloadReportButton.style('background-color', 'var(--background-color)');
    downloadReportButton.style('color', 'var(--primary-color)');
    downloadReportButton.style('font-family', 'VT323, monospace');
    downloadReportButton.style('font-size', '18px');  // Match editor settings-item
    downloadReportButton.style('width', '100%');
    downloadReportButton.style('height', '28px');  // Slightly taller for readability
    downloadReportButton.style('border', '1px solid var(--primary-color)');
    downloadReportButton.style('border-radius', '4px');
    downloadReportButton.style('cursor', 'pointer');
    downloadReportButton.style('margin-bottom', '4px');
    downloadReportButton.style('text-align', 'center');
    downloadReportButton.style('letter-spacing', '0.5px');
    
    // Add hover effect for class report button
    downloadReportButton.mouseOver(() => {
        downloadReportButton.style('background-color', 'var(--primary-color)');
        downloadReportButton.style('color', 'var(--background-color)');
    });
    downloadReportButton.mouseOut(() => {
        downloadReportButton.style('background-color', 'var(--background-color)');
        downloadReportButton.style('color', 'var(--primary-color)');
    });
    
    // Create class report upload button
    const classReportUploadButton = createButton('LOAD REPORT');
    classReportUploadButton.parent(controlPanel);
    classReportUploadButton.mousePressed(() => {
        // Play Mac SE-style click sound
        playClickSound();
        
        // Create file input for class report
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.txt';
        fileInput.style.display = 'none';
        fileInput.onchange = (event) => {
            handleClassReportUpload(event);
            // Clean up after processing
            setTimeout(() => {
                if (document.body.contains(fileInput)) {
                    document.body.removeChild(fileInput);
                }
            }, 100);
        };
        document.body.appendChild(fileInput);
        fileInput.click();
    });
    
    // Style class report upload button
    classReportUploadButton.style('background-color', 'var(--background-color)');
    classReportUploadButton.style('color', 'var(--primary-color)');
    classReportUploadButton.style('font-family', 'VT323, monospace');
    classReportUploadButton.style('font-size', '18px');  // Match editor settings-item
    classReportUploadButton.style('width', '100%');
    classReportUploadButton.style('height', '28px');  // Slightly taller for readability
    classReportUploadButton.style('border', '1px solid var(--primary-color)');
    classReportUploadButton.style('border-radius', '4px');
    classReportUploadButton.style('cursor', 'pointer');
    classReportUploadButton.style('margin-bottom', '4px');
    classReportUploadButton.style('text-align', 'center');
    classReportUploadButton.style('letter-spacing', '0.5px');
    
    // Add hover effect for class report upload button
    classReportUploadButton.mouseOver(() => {
        classReportUploadButton.style('background-color', 'var(--primary-color)');
        classReportUploadButton.style('color', 'var(--background-color)');
    });
    classReportUploadButton.mouseOut(() => {
        classReportUploadButton.style('background-color', 'var(--background-color)');
        classReportUploadButton.style('color', 'var(--primary-color)');
    });
    
    // Create reset report button
    resetReportButton = createButton('CLEAR MEMORY');
    resetReportButton.parent(controlPanel);
    resetReportButton.mousePressed(() => {
        // Play Mac SE-style click sound
        playClickSound();
        resetClassReport();
    });
    resetReportButton.style('background-color', 'var(--background-color)');
    resetReportButton.style('color', 'var(--primary-color)');
    resetReportButton.style('font-family', 'VT323, monospace');
    resetReportButton.style('font-size', '18px');  // Match editor settings-item
    resetReportButton.style('width', '100%');
    resetReportButton.style('height', '28px');  // Slightly taller for readability
    resetReportButton.style('border', '1px solid var(--primary-color)');
    resetReportButton.style('border-radius', '4px');
    resetReportButton.style('cursor', 'pointer');
    resetReportButton.style('text-align', 'center');
    resetReportButton.style('margin-bottom', '4px');
    resetReportButton.style('letter-spacing', '0.5px');
    
    // Add hover effect for reset button
    resetReportButton.mouseOver(() => {
        resetReportButton.style('background-color', 'var(--primary-color)');
        resetReportButton.style('color', 'var(--background-color)');
    });
    resetReportButton.mouseOut(() => {
        resetReportButton.style('background-color', 'var(--background-color)');
        resetReportButton.style('color', 'var(--primary-color)');
    });
    }

    // Add-name logic removed – will be re-added in the right place

    // Create navigation arrows (always create them)
    console.log('Class list length:', classList.length);
    
    // Calculate centered positioning for equal gaps
    // Use window dimensions as fallback if p5.js dimensions aren't ready
    const currentWidth = (typeof width !== 'undefined' && width > 0) ? width : window.innerWidth;
    const currentHeight = (typeof height !== 'undefined' && height > 0) ? height : window.innerHeight;
    const nameFieldWidth = BUTTON_SIZES.WIDTH();
    const arrowWidth = 30;
    const totalWidth = nameFieldWidth + (arrowWidth * 2) + 20; // 20px total gap (10px each side)
    const startX = (currentWidth - totalWidth) / 2;
    
    // Create previous student button (<)
    try {
        prevStudentButton = createButton('<');
        if (!prevStudentButton) {
            console.error('Failed to create prevStudentButton');
            prevStudentButton = null;
        } else {
            prevStudentButton.style('display', 'block'); // Ensure button is visible
            const bottomMargin = BUTTON_SIZES.BOTTOM_MARGIN();
            const elementHeight = BUTTON_SIZES.HEIGHT();
            const elementSpacing = BUTTON_SIZES.ELEMENT_SPACING();
            const verticalOffset = 80; // Match positionNameInputAndButtons
            prevStudentButton.position(
                startX, 
                currentHeight - bottomMargin - (elementHeight * 2) - elementSpacing - verticalOffset
            );
            prevStudentButton.mousePressed(prevStudent);
        }
    } catch (error) {
        console.error('Error creating prevStudentButton:', error);
        prevStudentButton = null;
    }
    
    // Create next student button (>)
    try {
        nextStudentButton = createButton('>');
        if (!nextStudentButton) {
            console.error('Failed to create nextStudentButton');
            nextStudentButton = null;
        } else {
            nextStudentButton.style('display', 'block'); // Ensure button is visible
            const bottomMargin = BUTTON_SIZES.BOTTOM_MARGIN();
            const elementHeight = BUTTON_SIZES.HEIGHT();
            const elementSpacing = BUTTON_SIZES.ELEMENT_SPACING();
            const verticalOffset = 80; // Match positionNameInputAndButtons
            nextStudentButton.position(
                startX + arrowWidth + 10 + nameFieldWidth + 10, 
                currentHeight - bottomMargin - (elementHeight * 2) - elementSpacing - verticalOffset
            );
            // Match prefix `>` / Down arrow: new empty run slot (not cycling history — use keyboard Right for that)
            nextStudentButton.mousePressed(() => {
                if (typeof window.advanceToNextResultAndClearPrompts === 'function') {
                    window.advanceToNextResultAndClearPrompts('');
                }
                if (typeof resultNameInput !== 'undefined' && resultNameInput && resultNameInput.elt) {
                    resultNameInput.elt.focus();
                }
            });
        }
    } catch (error) {
        console.error('Error creating nextStudentButton:', error);
        nextStudentButton = null;
    }
    
    // Show custom dialog before folder selection for automatic screenshots
    window.showScreenshotFolderDialog = function() {
        return new Promise((resolve) => {
            // Create overlay
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.85);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                font-family: 'VT323', monospace;
            `;
            
            // Create dialog
            const dialog = document.createElement('div');
            dialog.style.cssText = `
                background-color: var(--background-color);
                border: 2px solid var(--primary-color);
                border-radius: 8px;
                padding: 30px;
                color: var(--primary-color);
                max-width: 500px;
                width: 90%;
                box-shadow: 0 0 20px var(--primary-shadow);
            `;
            
            // Add title
            const title = document.createElement('div');
            title.textContent = 'AUTOMATIC SCREENSHOTS';
            title.style.cssText = `
                font-size: 24px;
                font-weight: bold;
                text-align: center;
                margin-bottom: 20px;
                color: var(--primary-color);
                text-transform: uppercase;
                letter-spacing: 2px;
            `;
            
            // Add message
            const message = document.createElement('div');
            message.innerHTML = `
                <div style="margin-bottom: 15px; font-size: 18px; line-height: 1.6;">
                    Please select a folder where screenshots will be saved automatically.
                </div>
                <div style="margin-bottom: 20px; font-size: 16px; line-height: 1.6; color: var(--primary-hover); padding: 15px; background-color: var(--primary-shadow-light); border: 1px solid var(--primary-color); border-radius: 4px;">
                    <strong>Note:</strong> Enabling this feature will save screenshots automatically after every prompt generation, without any popups or dialogs.
                </div>
            `;
            message.style.cssText = `
                margin-bottom: 20px;
                color: var(--primary-color);
                text-align: center;
            `;
            
            // Add button container
            const buttonContainer = document.createElement('div');
            buttonContainer.style.cssText = `
                display: flex;
                gap: 10px;
                justify-content: center;
            `;
            
            // Add Continue button
            const continueBtn = document.createElement('button');
            continueBtn.textContent = 'SELECT FOLDER';
            continueBtn.style.cssText = `
                background-color: var(--primary-color);
                color: var(--background-color);
                border: 1px solid var(--primary-color);
                padding: 12px 24px;
                border-radius: 4px;
                cursor: pointer;
                font-family: 'VT323', monospace;
                font-size: 18px;
                font-weight: bold;
                transition: all 0.3s ease;
            `;
            continueBtn.onmouseover = () => {
                continueBtn.style.backgroundColor = 'var(--primary-hover)';
            };
            continueBtn.onmouseout = () => {
                continueBtn.style.backgroundColor = 'var(--primary-color)';
            };
            continueBtn.onclick = () => {
                if (window.playClickSound) {
                    window.playClickSound();
                }
                document.body.removeChild(overlay);
                resolve(true);
            };
            
            // Add Cancel button
            const cancelBtn = document.createElement('button');
            cancelBtn.textContent = 'CANCEL';
            cancelBtn.style.cssText = `
                background-color: var(--background-color);
                color: var(--primary-color);
                border: 1px solid var(--primary-color);
                padding: 12px 24px;
                border-radius: 4px;
                cursor: pointer;
                font-family: 'VT323', monospace;
                font-size: 18px;
                transition: all 0.3s ease;
            `;
            cancelBtn.onmouseover = () => {
                cancelBtn.style.backgroundColor = 'var(--primary-color)';
                cancelBtn.style.color = 'var(--background-color)';
            };
            cancelBtn.onmouseout = () => {
                cancelBtn.style.backgroundColor = 'var(--background-color)';
                cancelBtn.style.color = 'var(--primary-color)';
            };
            cancelBtn.onclick = () => {
                if (window.playClickSound) {
                    window.playClickSound();
                }
                document.body.removeChild(overlay);
                resolve(false);
            };
            
            // Close on overlay click (outside dialog)
            overlay.onclick = (e) => {
                if (e.target === overlay) {
                    if (window.playClickSound) {
                        window.playClickSound();
                    }
                    document.body.removeChild(overlay);
                    resolve(false);
                }
            };
            
            // Assemble dialog
            buttonContainer.appendChild(continueBtn);
            buttonContainer.appendChild(cancelBtn);
            dialog.appendChild(title);
            dialog.appendChild(message);
            dialog.appendChild(buttonContainer);
            overlay.appendChild(dialog);
            
            // Add to page
            document.body.appendChild(overlay);
        });
    }
    
    // Style navigation buttons
    if (prevStudentButton && nextStudentButton) {
        [prevStudentButton, nextStudentButton].forEach(button => {
            if (button) {
                button.style('background-color', 'var(--background-color)');
                button.style('color', 'var(--primary-color)');
                button.style('font-family', 'VT323, monospace');
                button.style('font-size', FONT_SIZES.INPUT() + 'px');
                button.style('width', '30px');
                button.style('height', BUTTON_SIZES.HEIGHT() + 'px');
                button.style('border', '1px solid var(--primary-color)');
                button.style('border-radius', '4px');
                button.style('cursor', 'pointer');
                
                // Add hover effects
                button.mouseOver(() => {
                    button.style('background-color', 'var(--primary-color)');
                    button.style('color', 'var(--background-color)');
                });
                button.mouseOut(() => {
                    button.style('background-color', 'var(--background-color)');
                    button.style('color', 'var(--primary-color)');
                });
            }
        });
    } else {
        console.error('Navigation buttons not created:', { prevStudentButton, nextStudentButton });
    }
    
    // Show/hide navigation buttons based on student list
    if (allStudents.length === 0) {
        // No students - hide navigation arrows
        prevStudentButton.hide();
        nextStudentButton.hide();
    } else {
        // Has students - show navigation buttons (even with just 1 student)
        prevStudentButton.show();
        nextStudentButton.show();
    }
    
    positionNameInputAndButtons();
}

// Update UI on window resize
function updateUIOnResize() {
    resizeCanvas(windowWidth, windowHeight);
    
    // Position control panel and toggle button
    positionControlPanel();
    
    // Use the centralized positioning function
    positionNameInputAndButtons();
    
    const inputFontSize = FONT_SIZES.INPUT() + 'px';
    // Update button font sizes to match input
    if (prevStudentButton && nextStudentButton) {
        [prevStudentButton, nextStudentButton].forEach(button => {
            button.style('font-size', inputFontSize);
        });
    }
}

// Export positioning functions for use in sketch-refactored.js
window.positionControlPanel = positionControlPanel;
window.positionNameInputAndButtons = positionNameInputAndButtons;
window.getResultNameFieldValue = function() { return (resultNameInput && resultNameInput.value()) ? resultNameInput.value().trim() : ''; };
window.setResultNameFieldValue = function(val) { if (resultNameInput) resultNameInput.value(val || ''); };
window.getResultNameFieldElement = function() { return resultNameInput && resultNameInput.elt ? resultNameInput.elt : null; };
