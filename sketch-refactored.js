// Main Sketch File - Orchestrates all modules
// This is the main entry point that coordinates all functionality

// Core state variables
let studentName = '';
let previousName = ''; // Store completed name for display
window.clearPreviousNameForNavigation = function () { previousName = ''; };
let classList = []; // Array to store student names from class list
// Shared with prompt-generator.js / animation-manager.js (classic scripts).
// `let` here used to shadow their writes, so GENERATING… / STOP could stick until refresh.
window.isGenerating = false;
let generationStep = 0;
let audioCtx;
let shouldStop = false;
let isGenerationComplete = false;
let showInstructions = true;
let hideStudentCount = false; // Flag to hide student count during screenshots
let categories = {};
// Use window.currentPrompts as the single source of truth
// Initialize it if it doesn't exist
if (!window.currentPrompts) {
    window.currentPrompts = {};
}
// Keep local reference for convenience
let currentPrompts = window.currentPrompts;

let fieldClearedForNextStudent = false; // Track if field was cleared after name entry

// Define arrow key constants (not automatically available in p5.js)
const UP_ARROW = 38;
const DOWN_ARROW = 40;
const LEFT_ARROW = 37;
const RIGHT_ARROW = 39;

// Debug flag - set to true for verbose logging during development
let DEBUG = false;

// Default styling
const DEFAULT_COLORS = {
    BACKGROUND: '#000000',
    TEXT: '#FFFFFF',
    HIGHLIGHT: '#33FF33',
    DIM: '#006600',
    ACCENT: '#00CC00'
};
const DEFAULT_FONT = 'VT323';

function sketchUiFont() {
    try {
        const raw = getComputedStyle(document.documentElement).getPropertyValue('--ui-font').trim();
        if (!raw) return DEFAULT_FONT;
        const first = raw.split(',')[0].replace(/['"]/g, '').trim();
        const name = first || DEFAULT_FONT;
        // Unloaded webfont: p5 draws nothing until refresh. Fall back until fonts.ready.
        if (document.fonts && name) {
            const spec = '12px "' + name + '"';
            if (!document.fonts.check(spec)) return 'monospace';
        }
        return name;
    } catch (e) {
        return DEFAULT_FONT;
    }
}

function sketchCardStroke() {
    try {
        const raw = getComputedStyle(document.documentElement).getPropertyValue('--card-stroke-width').trim();
        const n = parseFloat(raw);
        // D-059: 0 is a real choice (no leftover-card frame). Missing CSS still means factory 4.
        if (Number.isFinite(n) && n >= 0) return n;
        return 4;
    } catch (e) {
        return 4;
    }
}

function sketchTypeScale() {
    try {
        const n = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ui-font-size'));
        return (Number.isFinite(n) && n > 0) ? (n / 18) : 1;
    } catch (e) {
        return 1;
    }
}

function sketchFontStyle() {
    try {
        const style = getComputedStyle(document.documentElement).getPropertyValue('--ui-font-style').trim();
        const weight = getComputedStyle(document.documentElement).getPropertyValue('--ui-font-weight').trim();
        const italic = style === 'italic';
        const bold = weight === 'bold' || Number(weight) >= 600;
        if (italic && bold) return BOLDITALIC;
        if (italic) return ITALIC;
        if (bold) return BOLD;
        return NORMAL;
    } catch (e) {
        return NORMAL;
    }
}

// D-012: wrap-first sizing for sentence prompts (4+ words). Floor stops the card from shrinking type unreadably.
const CARD_FIT = {
    MIN_PROMPT_SIZE: 20,
    MIN_PROMPT_SIZE_PHONE: 18,
    SENTENCE_PROMPT_SIZE: 32,
    SENTENCE_PROMPT_SIZE_PHONE: 30,
    WORD_LINE_HEIGHT: 1.14,
    SENTENCE_LINE_HEIGHT: 1.08,
    // D-038: floor while other chrome is measured. Live height is leftover after
    // name, objective, labels, and text prompts (split across pictures).
    IMAGE_SLOT: 110,
    IMAGE_SLOT_PHONE: 88,
    // D-017: dots flicker per scramble tick (brightness comes from animation, not a sine wave)
    IMAGE_DOT_COUNT: 3,
    IMAGE_DOT_RADIUS: 5,
    IMAGE_DOT_GAP: 16,
    IMAGE_DOT_DIM: 0.18,
    IMAGE_DOT_BRIGHT: 1.05,
    // D-028: square reveal grid inset from the card stroke
    REVEAL_INSET: 10,
    // D-028: objective sits under the name field, then prompts cluster below
    OBJECTIVE_BELOW_NAME: 8,
    OBJECTIVE_BELOW_NAME_PHONE: 6,
    OBJECTIVE_PROMPT_GAP: 12,
    OBJECTIVE_PROMPT_GAP_PHONE: 8,
    // D-061: last wrap line of the objective must not be 1–2 leftover words.
    OBJECTIVE_MIN_LAST_LINE_WORDS: 3,
    // D-039: mix labels toward paper so they recede from the chosen values.
    // 0 = same as prompt ink; 1 = paper (invisible). Was a flat 0.8× primary.
    LABEL_MIX: 0.55
};

/** D-061: leftover-card objective is sentence case, not Title Case or ALL CAPS. */
function toSentenceCase(text) {
    const raw = String(text == null ? '' : text).trim();
    if (!raw) return '';
    return raw.toLowerCase().replace(/(^|[.!?]\s+)(\S)/g, function (match, prefix, ch) {
        return prefix + ch.toUpperCase();
    });
}

/**
 * D-061: after a greedy wrap, move words down so the last line is not a
 * 1–2-word leftover. Stops if the last line would overflow, or the previous
 * line would empty. Unavoidable when the whole phrase is only a few words.
 */
function balanceLastWrapLine(lines, maxW, measureWidth) {
    const minLast = CARD_FIT.OBJECTIVE_MIN_LAST_LINE_WORDS;
    const out = (lines && lines.length) ? lines.slice() : [''];
    while (out.length >= 2) {
        const lastIdx = out.length - 1;
        const lastWords = out[lastIdx].split(/\s+/).filter(Boolean);
        if (lastWords.length >= minLast) break;
        const prevWords = out[lastIdx - 1].split(/\s+/).filter(Boolean);
        if (prevWords.length <= 1) break;
        const moved = prevWords[prevWords.length - 1];
        const newLast = moved + ' ' + lastWords.join(' ');
        if (measureWidth(newLast) > maxW) break;
        prevWords.pop();
        out[lastIdx - 1] = prevWords.join(' ');
        out[lastIdx] = newLast;
    }
    return out;
}

// p5.Image cache for img: tokens (D-015). Values: Image | 'loading' | 'fail'
const promptImageCache = {};

function prefetchPromptImage(token) {
    if (typeof isImagePromptToken !== 'function' || !isImagePromptToken(token)) return;
    if (promptImageCache[token] || typeof loadImage !== 'function') return;
    if (typeof getPromptImageRecord !== 'function') return;
    promptImageCache[token] = 'loading';
    const id = imageIdFromToken(token);
    getPromptImageRecord(id).then((rec) => {
        if (!rec || !rec.blob) {
            promptImageCache[token] = 'fail';
            return;
        }
        const url = URL.createObjectURL(rec.blob);
        loadImage(url, (img) => {
            promptImageCache[token] = img;
            URL.revokeObjectURL(url);
        }, () => {
            promptImageCache[token] = 'fail';
            URL.revokeObjectURL(url);
        });
    }).catch(() => {
        promptImageCache[token] = 'fail';
    });
}
window.prefetchPromptImage = prefetchPromptImage;

function promptImageSlotHeight(phone) {
    return phone ? CARD_FIT.IMAGE_SLOT_PHONE : CARD_FIT.IMAGE_SLOT;
}

function isPromptImageEntry(entry) {
    const t = ((entry && (entry.layout || entry.display)) || '').toString().trim();
    return typeof isImagePromptToken === 'function' && isImagePromptToken(t);
}

/** Per-tick flicker — same 50ms / 440Hz clock as letter scramble (D-017). */
function drawImageWaitDots(cx, y, slotH, rgb, flicker) {
    const n = (window.TIMING && window.TIMING.IMAGE_DOT_COUNT) || CARD_FIT.IMAGE_DOT_COUNT;
    const radius = CARD_FIT.IMAGE_DOT_RADIUS;
    const gap = CARD_FIT.IMAGE_DOT_GAP;
    const dim = CARD_FIT.IMAGE_DOT_DIM;
    const bright = CARD_FIT.IMAGE_DOT_BRIGHT;
    const totalW = (n - 1) * gap;
    const startX = cx - totalW / 2;
    const cy = y + slotH / 2;
    noStroke();
    ellipseMode(CENTER);
    for (let i = 0; i < n; i++) {
        const raw = (flicker && flicker.length) ? flicker[i % flicker.length] : Math.random();
        const a = dim + (bright - dim) * raw;
        fill((rgb.r || 180) * a, (rgb.g || 180) * a, (rgb.b || 180) * a);
        circle(startX + i * gap, cy, radius * 2);
    }
}

/**
 * D-025 / D-028 / D-032 / D-036 / D-037: square-cell mask, centered in the card.
 * Full cover: opaque paper + decoy film (results stay hidden).
 * Once tiles lift: leftover cells are paper (hides the word) with the film still
 * painted on them; lifted cells skip so the real word/picture shows through.
 * Gutters stay paper so type does not leak at the edges of the square (D-028).
 */
function drawPixelRevealOverlay(bounds, primaryRgb, bgRgb) {
    const pr = window.pixelReveal;
    if (!pr || !pr.active || !bounds || bounds.w < 8 || bounds.h < 8) return;
    const size = pr.size || (window.REVEAL && window.REVEAL.GRID_SIZE) || 6;
    const decoy = pr.decoy || [];
    const ranks = pr.ranks || [];
    const resolveCount = pr.resolveCount || 0;
    const lifting = resolveCount > 0;
    const metrics = (typeof revealSquareGridMetrics === 'function')
        ? revealSquareGridMetrics(bounds.w, bounds.h, size)
        : { cell: Math.max(1, Math.floor(Math.min(bounds.w, bounds.h) / size)), n: size, ox: 0, oy: 0, grid: 0 };
    const cell = metrics.cell;
    const ox = bounds.x + metrics.ox;
    const oy = bounds.y + metrics.oy;
    const grid = metrics.grid || cell * size;
    const paper = (bgRgb && Number.isFinite(bgRgb.r)) ? bgRgb : sketchPageRgb();
    // p5 push/pop — raw clip+restore was popping the retina transform and leaving
    // unpainted canvas (browser default white) around the card (D-028)
    push();
    noStroke();
    rectMode(CORNER);
    fill(paper.r, paper.g, paper.b);
    if (lifting) {
        // Cover only the gutters. Holes in the square must show the prompts (D-036).
        if (oy > bounds.y) rect(bounds.x, bounds.y, bounds.w, oy - bounds.y);
        const bottom = oy + grid;
        if (bottom < bounds.y + bounds.h) {
            rect(bounds.x, bottom, bounds.w, bounds.y + bounds.h - bottom);
        }
        if (ox > bounds.x) rect(bounds.x, oy, ox - bounds.x, grid);
        const right = ox + grid;
        if (right < bounds.x + bounds.w) rect(right, oy, bounds.x + bounds.w - right, grid);
    } else {
        rect(bounds.x, bounds.y, bounds.w, bounds.h);
    }
    for (let i = 0; i < size * size; i++) {
        if (lifting && ranks[i] != null && ranks[i] < resolveCount) continue;
        const gx = i % size;
        const gy = Math.floor(i / size);
        if (lifting) {
            fill(paper.r, paper.g, paper.b);
            rect(ox + gx * cell, oy + gy * cell, cell + 0.5, cell + 0.5);
        }
        const cellVal = decoy[i];
        const on = (typeof revealCellOn === 'function') ? revealCellOn(cellVal) : !!cellVal;
        if (!on) continue;
        // D-027: hex paints stay that color; 1 / theme ink follows the live preset
        if (typeof cellVal === 'string' && cellVal.charAt(0) === '#') {
            const rgb = hexToRgb(cellVal);
            fill(rgb.r, rgb.g, rgb.b);
        } else {
            fill(primaryRgb.r, primaryRgb.g, primaryRgb.b);
        }
        rect(ox + gx * cell, oy + gy * cell, cell + 0.5, cell + 0.5);
    }
    pop();
}

/** Draw a prompt picture fitted in the leftover slot (D-038 fallback / wait-dots). */
function drawFittedPromptImage(token, cx, y, maxW, slotH, rgb) {
    prefetchPromptImage(token);
    const cached = promptImageCache[token];
    if (cached && cached !== 'loading' && cached !== 'fail' && cached.width) {
        const scale = Math.min(maxW / cached.width, slotH / cached.height);
        const dw = cached.width * scale;
        const dh = cached.height * scale;
        imageMode(CORNER);
        image(cached, cx - dw / 2, y + (slotH - dh) / 2, dw, dh);
        return slotH;
    }
    // Missing blob or still loading — don't print the img: token
    const r = (rgb && rgb.r) || 180;
    const g = (rgb && rgb.g) || 180;
    const b = (rgb && rgb.b) || 180;
    fill(r * 0.7, g * 0.7, b * 0.7);
    textStyle(NORMAL);
    textAlign(CENTER, CENTER);
    text(cached === 'loading' ? '…' : '[image]', cx, y + slotH / 2);
    textAlign(CENTER, TOP);
    return slotH;
}

function sketchRevealGridSize() {
    const pr = window.pixelReveal;
    if (pr && pr.size) return pr.size;
    if (typeof loadRevealAnimation === 'function' && typeof revealGridSize === 'function') {
        return revealGridSize(loadRevealAnimation());
    }
    return (window.REVEAL && window.REVEAL.GRID_SIZE) || 6;
}

/** Same leftover rect the film overlay uses (D-028). */
function leftoverRevealBounds(cardX, cardY, cardWidth, cardHeight, innerTop, innerBottom) {
    const inset = CARD_FIT.REVEAL_INSET;
    const x = cardX + inset;
    const y = Math.max(cardY + inset, innerTop);
    const r = cardX + cardWidth - inset;
    const b = Math.min(cardY + cardHeight - inset, innerBottom);
    return { x: x, y: y, w: Math.max(0, r - x), h: Math.max(0, b - y) };
}

function filmSquareFromBounds(bounds, size) {
    const metrics = (typeof revealSquareGridMetrics === 'function')
        ? revealSquareGridMetrics(bounds.w, bounds.h, size)
        : { cell: 1, n: size, ox: 0, oy: 0, grid: Math.min(bounds.w, bounds.h) };
    return {
        x: bounds.x + metrics.ox,
        y: bounds.y + metrics.oy,
        w: metrics.grid,
        h: metrics.grid,
        cell: metrics.cell,
        n: metrics.n
    };
}

/** Cover-crop source rect so the bitmap fills dest (D-053). */
function coverCropSource(img, destW, destH) {
    const scale = Math.max(destW / img.width, destH / img.height);
    const sw = destW / scale;
    const sh = destH / scale;
    return {
        sx: (img.width - sw) / 2,
        sy: (img.height - sh) / 2,
        sw: sw,
        sh: sh
    };
}

function splitFilmSquareRow(square, count, index) {
    const n = Math.max(1, square.n || 1);
    const cell = square.cell || square.h;
    const rowsEach = Math.max(1, Math.floor(n / Math.max(1, count)));
    const startRow = index * rowsEach;
    const endRow = (index === count - 1) ? n : Math.min(n, (index + 1) * rowsEach);
    return {
        x: square.x,
        y: square.y + startRow * cell,
        w: square.w,
        h: Math.max(cell, (endRow - startRow) * cell),
        cell: cell,
        n: n,
        startRow: startRow,
        endRow: endRow
    };
}

/**
 * D-053: picture lives in the film square — cover-cropped, never wider than the grid.
 * During tile lift, paint one cell at a time so edges don't pop as a smooth rectangle.
 */
function drawPromptImageInFilmSquare(token, square, mosaic, rgb) {
    prefetchPromptImage(token);
    const cached = promptImageCache[token];
    if (!square || square.w < 2 || square.h < 2) return;
    if (!cached || cached === 'loading' || cached === 'fail' || !cached.width) {
        const r = (rgb && rgb.r) || 180;
        const g = (rgb && rgb.g) || 180;
        const b = (rgb && rgb.b) || 180;
        fill(r * 0.7, g * 0.7, b * 0.7);
        textStyle(NORMAL);
        textAlign(CENTER, CENTER);
        text(cached === 'loading' ? '…' : '[image]', square.x + square.w / 2, square.y + square.h / 2);
        textAlign(CENTER, TOP);
        return;
    }
    const src = coverCropSource(cached, square.w, square.h);
    imageMode(CORNER);
    if (mosaic && square.cell > 0 && square.n > 0) {
        const n = square.n;
        const cell = square.cell;
        const row0 = (typeof square.startRow === 'number') ? square.startRow : 0;
        const row1 = (typeof square.endRow === 'number') ? square.endRow : n;
        const localRows = Math.max(1, row1 - row0);
        for (let ly = 0; ly < localRows; ly++) {
            for (let gx = 0; gx < n; gx++) {
                const sx = src.sx + (gx / n) * src.sw;
                const sy = src.sy + (ly / localRows) * src.sh;
                image(
                    cached,
                    square.x + gx * cell,
                    square.y + ly * cell,
                    cell + 0.5,
                    cell + 0.5,
                    sx,
                    sy,
                    src.sw / n,
                    src.sh / localRows
                );
            }
        }
        return;
    }
    const ctx = (typeof drawingContext !== 'undefined') ? drawingContext : null;
    if (ctx && typeof ctx.save === 'function') {
        ctx.save();
        ctx.beginPath();
        ctx.rect(square.x, square.y, square.w, square.h);
        ctx.clip();
    }
    image(cached, square.x, square.y, square.w, square.h, src.sx, src.sy, src.sw, src.sh);
    if (ctx && typeof ctx.restore === 'function') ctx.restore();
}

function debugLog(...args) {
    if (DEBUG) {
        console.log(...args);
    }
}

// Function for navigating to editor - defined at global scope
function goToEditor() {
    // Play click sound on button press - resume audio context if needed and play immediately
    if (window.audioCtx) {
        // Resume audio context if suspended (don't wait for promise to avoid delay)
        if (window.audioCtx.state === 'suspended') {
            window.audioCtx.resume().catch(e => {
                console.log('Could not resume audio context:', e);
            });
        }
        // Play sound immediately (even if resume is still pending, it will work)
        if (window.playSound && window.SOUND) {
            window.playSound(window.SOUND.CLICK);
        }
    } else if (window.playSound && window.SOUND) {
        window.playSound(window.SOUND.CLICK);
    }
    
    debugLog('Design Prompts button clicked - redirecting to editor.html');
    
    // Force save current state before navigation
    saveCurrentStateToLocalStorage();
    
    // Add a longer delay to ensure save completes
    setTimeout(() => {
        debugLog('Verifying save completed - checking localStorage');
        window.location.href = 'editor.html?from=sketch';
    }, 200); // Increased delay to ensure save completes
}
window.goToEditor = goToEditor;

// Theme: single source is theme-manager.js (loaded by sketch.html)
function loadInitialThemeFromEditor() {
    debugLog('Loading initial theme via theme-manager');
    if (typeof window.applyThemeFromStorage === 'function') {
        window.applyThemeFromStorage();
    } else if (typeof window.changeTheme === 'function') {
        window.changeTheme(localStorage.getItem('selectedTheme') || 'windows', true);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    debugLog('DOM loaded - applying theme via theme-manager');
    loadInitialThemeFromEditor();
});

// D-063: grouping chips live in ui-manager.js leftover-card chrome.
function refreshInterestSection() {
    if (typeof window.refreshGroupingPicker === 'function') window.refreshGroupingPicker();
}
function populateInterestCheckboxes() {
    refreshInterestSection();
}
function updateInterestSelection() {
    if (typeof window.readGroupingPickerSelection === 'function') {
        const sel = window.readGroupingPickerSelection();
        if (sel === 'all') localStorage.setItem('selectedInterests', 'all');
        else localStorage.setItem('selectedInterests', JSON.stringify(sel));
    }
}
function getSelectedInterests() {
    if (window.criterionSelectable !== true) return 'all';
    if (typeof window.readGroupingPickerSelection === 'function') {
        return window.readGroupingPickerSelection();
    }
    const raw = localStorage.getItem('selectedInterests');
    if (!raw || raw === 'all') return 'all';
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : 'all';
    } catch (e) {
        return 'all';
    }
}
window.addEventListener('storage', function (e) {
    if (e.key === 'promptCategories' || e.key === 'selectedInterests') {
        refreshInterestSection();
    }
});

// Helper function to convert hex to RGB
function hexToRgb(hex) {
    // Invalid / rgb() values used to become NaN → p5 paints white (the canvas default)
    if (!hex || typeof hex !== 'string') return { r: 0, g: 0, b: 0 };
    const trimmed = hex.trim();
    const rgbMatch = trimmed.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (rgbMatch) {
        return { r: Number(rgbMatch[1]), g: Number(rgbMatch[2]), b: Number(rgbMatch[3]) };
    }
    let h = trimmed.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (h.length !== 6) return { r: 0, g: 0, b: 0 };
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    if (![r, g, b].every(function (n) { return Number.isFinite(n); })) {
        return { r: 0, g: 0, b: 0 };
    }
    return { r: r, g: g, b: b };
}

function mixRgb(a, b, t) {
    const u = Math.max(0, Math.min(1, t));
    const ar = (a && a.r) || 0, ag = (a && a.g) || 0, ab = (a && a.b) || 0;
    const br = (b && b.r) || 0, bg = (b && b.g) || 0, bb = (b && b.b) || 0;
    return {
        r: ar + (br - ar) * u,
        g: ag + (bg - ag) * u,
        b: ab + (bb - ab) * u
    };
}

/** D-039: prompt labels sit toward paper so the chosen values stay the loud ink. */
function labelInkRgb(primaryRgb, paperRgb) {
    const t = (typeof CARD_FIT.LABEL_MIX === 'number') ? CARD_FIT.LABEL_MIX : 0.55;
    return mixRgb(primaryRgb, paperRgb, t);
}

function sketchPageRgb() {
    try {
        const raw = getComputedStyle(document.documentElement).getPropertyValue('--background-color').trim();
        return hexToRgb(raw);
    } catch (e) {
        return { r: 0, g: 0, b: 0 };
    }
}

function paintSketchPageBackground() {
    const rgb = sketchPageRgb();
    background(rgb.r, rgb.g, rgb.b);
}

// Screenshot function
function takeScreenshot() {
    // IMPORTANT: This function should NOT clear prompts - they should remain visible
    // Prompts are only cleared when:
    // 1. A new prompt generation starts (in startGeneration/resetGeneratorState)
    // 2. User starts typing a new name (first character entered in nameInput.input handler)
    
    // Ensure canvas is at full window size for consistent screenshots
    // This prevents aspect ratio changes based on prompt content
    if (width !== windowWidth || height !== windowHeight) {
        resizeCanvas(windowWidth, windowHeight);
    }
    
    // Allow screenshots regardless of name field state
    showInstructions = false;  // Hide instructions temporarily for screenshot
    hideStudentCount = true;   // Hide student count during screenshot
    // Name lives in a DOM input; paint it on canvas for saveCanvas and hide the overlay
    window._drawCardNameOnCanvas = true;
    let hiddenNameEl = null;
    if (typeof resultNameWrapper !== 'undefined' && resultNameWrapper && resultNameWrapper.elt) {
        hiddenNameEl = resultNameWrapper.elt;
        hiddenNameEl.style.visibility = 'hidden';
    } else if (window.getResultNameFieldElement) {
        const el = window.getResultNameFieldElement();
        if (el && el.parentElement) {
            hiddenNameEl = el.parentElement;
            hiddenNameEl.style.visibility = 'hidden';
        }
    }
    draw();  // Redraw once without instructions and student count (prompts remain in currentPrompts)
    
    // Use studentName, previousName, or a generic name for filename
    const nameToUse = studentName || previousName || 'Student';
    const sanitizedStudentName = nameToUse.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `${sanitizedStudentName}_${timestamp}`;
    
    // Save screenshot using p5.js saveCanvas
    saveCanvas(filename, 'png');
    
    // Restore instructions and student count, then redraw - prompts should still be visible
    window._drawCardNameOnCanvas = false;
    if (hiddenNameEl) hiddenNameEl.style.visibility = '';
    showInstructions = true;   // Show instructions again
    hideStudentCount = false;  // Show student count again
    draw();  // Redraw with instructions and student count (prompts still in currentPrompts, so they display)
}

// Themed popup (same style as editor) for missing prompts
function showThemedMessage(message) {
    const existing = document.getElementById('sketch-themed-message');
    if (existing) existing.remove();
    const popup = document.createElement('div');
    popup.id = 'sketch-themed-message';
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: var(--background-color);
        color: var(--primary-color);
        border: 3px solid var(--primary-color);
        border-radius: 4px;
        padding: 30px 40px;
        font-family: 'VT323', monospace;
        font-size: 24px;
        font-weight: bold;
        text-align: center;
        letter-spacing: 2px;
        z-index: 10000;
        box-shadow: 0 0 20px rgba(0,0,0,0.4);
        animation: sketchMessageFadeIn 0.3s ease-out;
    `;
    popup.textContent = message;
    if (!document.getElementById('sketch-message-styles')) {
        const style = document.createElement('style');
        style.id = 'sketch-message-styles';
        style.textContent = `
            @keyframes sketchMessageFadeIn {
                from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
                to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }
            @keyframes sketchMessageFadeOut {
                from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                to { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
            }
        `;
        document.head.appendChild(style);
    }
    document.body.appendChild(popup);
    setTimeout(() => {
        popup.style.animation = 'sketchMessageFadeOut 0.3s ease-out';
        setTimeout(() => popup.remove(), 300);
    }, 2500);
}

function getAutoRunName() {
    let nextRun = (typeof window.unnamedRunCounter === 'number' && !Number.isNaN(window.unnamedRunCounter))
        ? window.unnamedRunCounter + 1
        : 1;
    let candidate = `Run ${nextRun}`;
    // Prefer classReport names (source of truth for history); allStudents can lag and allow collisions
    const existing = new Set();
    if (Array.isArray(classReport)) {
        classReport.forEach(e => { if (e && e.name) existing.add(e.name); });
    }
    if (Array.isArray(allStudents)) {
        allStudents.forEach(n => { if (n) existing.add(n); });
    }
    while (existing.has(candidate)) {
        nextRun += 1;
        candidate = `Run ${nextRun}`;
    }
    window.unnamedRunCounter = nextRun;
    // Do not push into allStudents here — Up/Enter assigns to currentStudentIndex (NEXT may already have reserved a slot).
    if (typeof saveCurrentStateToLocalStorage === 'function') {
        saveCurrentStateToLocalStorage();
    }
    return candidate;
}

// Returns { missingObjective, missingPrompts } from current categories.
// D-011: missingObjective is informational — triggerPromptRun only blocks on missingPrompts.
function getMissingEditorData() {
    const promptHeaders = categories && Object.keys(categories).filter(cat => cat !== 'objective' && cat !== 'prompt1InterestsMode');
    const hasPromptHeaders = Array.isArray(promptHeaders) && promptHeaders.length > 0;
    const hasPromptContent = hasPromptHeaders && promptHeaders.some(h => {
        const opts = categories[h];
        return opts && typeof opts === 'object' && Object.values(opts).some(arr => Array.isArray(arr) && arr.length > 0);
    });
    const missingObjective = !(categories && (categories.objective || '').trim());
    const missingPrompts = !hasPromptContent;
    return { missingObjective, missingPrompts };
}

// p5.js main functions
function preload() {
    loadPromptsFromLocalStorage();
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    textFont(sketchUiFont());
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () {
            if (typeof textFont === 'function') textFont(sketchUiFont());
        });
    }
    textAlign(CENTER, CENTER);
    paintSketchPageBackground();
    
    // Clean up any corrupted data first
    cleanupCorruptedData();
    
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    // Export audioCtx to window so other modules can access it
    window.audioCtx = audioCtx;
    
    // Resume audio context on first user interaction to avoid delays
    // This ensures sounds play immediately when buttons are clicked
    const resumeAudioOnInteraction = () => {
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume().catch(e => {
                console.log('Could not resume audio context:', e);
            });
        }
    };
    // Resume on any user interaction (click, keypress, etc.)
    document.addEventListener('click', resumeAudioOnInteraction, { once: true });
    document.addEventListener('keydown', resumeAudioOnInteraction, { once: true });
    document.addEventListener('touchstart', resumeAudioOnInteraction, { once: true });
    
    studentName = '';
    
    // Listen for theme changes from editor
    window.addEventListener('themeChanged', function(event) {
        console.log('Theme change event received from editor:', event.detail);
        const theme = (event.detail && event.detail.theme) || localStorage.getItem('selectedTheme') || 'windows';
        if (typeof window.changeTheme === 'function') window.changeTheme(theme, true);
    });
    
    // Listen for background changes from editor
    window.addEventListener('backgroundChanged', function(event) {
        console.log('Background change event received from editor:', event.detail);
        const theme = (event.detail && event.detail.theme) || localStorage.getItem('selectedTheme') || 'windows';
        if (typeof window.changeTheme === 'function') window.changeTheme(theme, true);
    });
    
    // Listen for prompt data updates from editor
    window.addEventListener('promptDataUpdated', function(event) {
        console.log('Prompt data updated event received from editor:', event.detail);
        // Reload data from localStorage
        loadPromptsFromLocalStorage();
        resetPrompts();
        
        // Add small delay to ensure data is fully processed before populating checkboxes
        setTimeout(() => {
            populateInterestCheckboxes();
            updateInterestSelection();
        }, 50);
    });
    
    // Load and check data with a delay to ensure editor has saved fresh data
    setTimeout(() => {
        console.log('DEBUG: Loading data after setup - checking for existing class report');
        const existingData = localStorage.getItem('promptCategories');
        if (existingData) {
            const parsed = JSON.parse(existingData);
            console.log('DEBUG: Existing classReport in localStorage:', JSON.stringify(parsed.classReport, null, 2));
            console.log('DEBUG: Existing allStudents in localStorage:', parsed.allStudents);
        }
        
        loadPromptsFromLocalStorage();
        loadStudentNameFromLocalStorage();
    
        // Verify data was loaded correctly
        console.log('DEBUG: After loading - classReport length:', classReport.length);
        console.log('DEBUG: After loading - allStudents length:', allStudents.length);
        
        // Populate interest checkboxes after data is loaded
        setTimeout(() => {
            console.log('DEBUG: Populating interest checkboxes after data load');
            console.log('DEBUG: window.criterionSelectable:', window.criterionSelectable);
            populateInterestCheckboxes();
            updateInterestSelection();
        }, 50);
    }, 100); // Reduced delay since editor now saves fresh data immediately
    
    // Load initial theme from editor with a small delay to prevent flashing
    setTimeout(() => {
        loadInitialThemeFromEditor();
    }, 10);
    
    // Ensure audio context is ready before creating UI
    // Resume audio context immediately if suspended
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().then(() => {
            console.log('Audio context resumed in setup');
        }).catch(e => {
            console.log('Could not resume audio context in setup:', e);
        });
    }
    
    // Verify playSound and SOUND are available
    console.log('Setup: playSound available:', !!window.playSound, 'SOUND available:', !!window.SOUND, 'audioCtx available:', !!window.audioCtx);
    
    // Create UI elements
    createUI();
    window.getResultNameHint = function() {
        return (window.classReport && window.classReport.length > 0) ? 'next' : 'start';
    };
    // Result name field ("> " top-left): label edits sync to classReport, allStudents, and localStorage immediately
    window.onResultNameFieldInput = function(value) {
        if (typeof window.syncResultLabelFromInput === 'function') {
            window.syncResultLabelFromInput(value);
        } else {
            studentName = (value || '').trim();
            if (Array.isArray(allStudents)) {
                while (allStudents.length <= currentStudentIndex) allStudents.push('');
                if (currentStudentIndex < 0) currentStudentIndex = 0;
                allStudents[currentStudentIndex] = studentName;
            }
        }
    };

    loadPromptsFromLocalStorage();
    resetPrompts();
    
    // Populate interest checkboxes with loaded categories
    // Use a small delay to ensure control panel elements are fully created
    setTimeout(() => {
        console.log('DEBUG: Calling populateInterestCheckboxes after control panel created');
        populateInterestCheckboxes();
        // Initialize interest selection state
        updateInterestSelection();
    }, 100);
    
    // Position UI elements after canvas is ready
    // Use multiple strategies to ensure positioning works when switching from editor
    function positionUIElements() {
        // Position control panel and toggle button
        if (window.positionControlPanel) {
            window.positionControlPanel();
        }
        
        // Position name input and buttons
        if (window.positionNameInputAndButtons) {
            window.positionNameInputAndButtons();
        }
    }
    
    // Strategy 1: requestAnimationFrame (after render)
    requestAnimationFrame(() => {
        positionUIElements();
    });
    
    // Strategy 2: Multiple timeouts with increasing delays to handle page switches
    setTimeout(() => {
        positionUIElements();
    }, 50);
    
    setTimeout(() => {
        positionUIElements();
    }, 150);
    
    setTimeout(() => {
        positionUIElements();
    }, 300);
    
    // Strategy 3: On window focus (when switching back to this tab)
    window.addEventListener('focus', () => {
        setTimeout(() => {
            positionUIElements();
        }, 100);
    });
    
    // Debug: Log final state after setup
    console.log('Setup complete. Categories loaded:', Object.keys(categories));
    console.log('Non-objective categories:', Object.keys(categories).filter(cat => cat !== 'objective'));
}

function draw() {
    // Get colors from CSS variables
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    
    const bgColor = computedStyle.getPropertyValue('--background-color').trim();
    const textColor = computedStyle.getPropertyValue('--text-color').trim();
    const primaryColor = computedStyle.getPropertyValue('--primary-color').trim();
    const frameBg = (computedStyle.getPropertyValue('--frame-background') || bgColor).trim();
    
    const bgRgb = hexToRgb(bgColor);
    const textRgb = hexToRgb(textColor);
    const primaryRgb = hexToRgb(primaryColor);
    const frameRgb = hexToRgb(frameBg);
    
    paintSketchPageBackground();
    
    textFont(sketchUiFont());
    const cardTextStyle = sketchFontStyle();
    const typeScale = sketchTypeScale();

    // --- LOCKED card; chrome evenly distributed: tools → NEXT → card → results → RUN ---
    const cardLayout = (typeof window !== 'undefined' && window.CARD_LAYOUT) ? window.CARD_LAYOUT : {
        WIDTH_RATIO: 0.82, HEIGHT_RATIO: 0.5, PAD_X_RATIO: 0.08, PAD_Y_RATIO: 0.04, CORNER_MAX: 40
    };
    const chrome = (typeof window.getSketchChromeMetrics === 'function')
        ? window.getSketchChromeMetrics(width, height)
        : {
            phone: width <= 768, toolTop: 10, toolH: 32, toolsBottom: 42,
            navH: 28, nextH: 28, runSize: 56, runGap: 12, bottomPad: 14,
            nextTop: 52, cardY: 90, cardH: 320, resultsTop: 430, runTop: 470
        };
    const toolsBottom = chrome.toolsBottom != null ? chrome.toolsBottom : 42;
    const cardY = (typeof chrome.cardY === 'number') ? chrome.cardY : toolsBottom + 40;
    const cardHeight = (typeof chrome.cardH === 'number') ? chrome.cardH : height * 0.45;
    const runTop = (typeof chrome.runTop === 'number') ? chrome.runTop : (height - 70);
    const nextTop = (typeof chrome.nextTop === 'number') ? chrome.nextTop : (toolsBottom + 10);
    const resultsTop = (typeof chrome.resultsTop === 'number') ? chrome.resultsTop : (cardY + cardHeight + 12);

    const cardWidth = width * (chrome.phone ? 0.86 : (cardLayout.WIDTH_RATIO || 0.78));
    const cardX = (width - cardWidth) / 2;
    const cornerRadius = min(cardLayout.CORNER_MAX || 40, cardWidth * 0.06, cardHeight * 0.05);
    const padX = cardWidth * (cardLayout.PAD_X_RATIO || 0.08);
    const padY = cardHeight * (cardLayout.PAD_Y_RATIO || 0.04);
    const innerWidth = cardWidth - padX * 2;

    const objectiveText = (categories?.objective || '').trim();
    const promptHeaders = Object.keys(categories).filter(cat => cat !== 'objective' && cat !== 'prompt1InterestsMode');
    const headersToDraw = promptHeaders;
    const promptValueTexts = headersToDraw.map(header => {
        const prompt = window.currentPrompts[header];
        if (prompt && typeof prompt === 'object') {
            return {
                display: (prompt.revealed || '') + (prompt.rotating || ''),
                layout: prompt.final || ((prompt.revealed || '') + (prompt.rotating || '')),
                imageWait: !!prompt.imageWait,
                dotFlicker: prompt.dotFlicker || null
            };
        }
        return { display: prompt || '', layout: prompt || '', imageWait: false };
    });
    const fieldName = (window.getResultNameFieldValue && window.getResultNameFieldValue()) || '';
    const displayName = (studentName || previousName || fieldName || '').trim();

    // Type sizes — start roomy, then wrap-first for sentences, then scale down with a floor (D-012)
    const PROMPT_TO_LABEL_RATIO = 1.35;
    const sentenceHeavy = promptValueTexts.some(entry => {
        const t = (entry && (entry.layout || entry.display)) || '';
        return typeof isSentencePrompt === 'function' && isSentencePrompt(t);
    });
    const lineHeightRatio = sentenceHeavy ? CARD_FIT.SENTENCE_LINE_HEIGHT : CARD_FIT.WORD_LINE_HEIGHT;
    const minPromptSize = (chrome.phone ? CARD_FIT.MIN_PROMPT_SIZE_PHONE : CARD_FIT.MIN_PROMPT_SIZE) * typeScale;
    let promptSize = chrome.phone ? Math.min(width * 0.068, 48) : Math.min(width * 0.048, 42);
    if (sentenceHeavy) {
        promptSize = Math.min(promptSize, chrome.phone ? CARD_FIT.SENTENCE_PROMPT_SIZE_PHONE : CARD_FIT.SENTENCE_PROMPT_SIZE);
    }
    promptSize *= typeScale;
    let labelSize = promptSize / PROMPT_TO_LABEL_RATIO;
    let objectiveSize = labelSize;
    let nameSize = Math.max(18 * typeScale, Math.min((chrome.phone ? 32 : 30) * typeScale, promptSize * 0.75));
    let nameRowHeight = Math.max(32 * typeScale, nameSize * 1.25);
    let promptLineH = promptSize * lineHeightRatio;
    let labelLineH = labelSize * 1.08;
    let objectiveLineH = objectiveSize * 1.1;
    let labelGap = labelSize * 0.1;
    let promptBlockGap = labelSize * 0.35;
    const belowNameGap = chrome.phone ? CARD_FIT.OBJECTIVE_BELOW_NAME_PHONE : CARD_FIT.OBJECTIVE_BELOW_NAME;
    let objectiveToPromptGap = chrome.phone
        ? CARD_FIT.OBJECTIVE_PROMPT_GAP_PHONE
        : CARD_FIT.OBJECTIVE_PROMPT_GAP;
    const innerLeft = cardX + padX;
    const centerX = cardX + cardWidth / 2;
    let innerTop = cardY + padY + nameRowHeight;
    let innerBottom = cardY + cardHeight - padY;
    let availableHeight = innerBottom - innerTop;
    function clusterWrapWidth() {
        return Math.max(80, Math.min(innerWidth, availableHeight) - CARD_FIT.REVEAL_INSET * 2);
    }
    let MAX_PROMPT_WIDTH = clusterWrapWidth();
    // D-038: start at the floor; leftover cluster height is added after type is locked
    let imageSlotH = promptImageSlotHeight(chrome.phone);

    function wrapTextToWidth(str, maxW) {
        const s = (str || '').toString();
        if (!s) return [''];
        if (textWidth(s) <= maxW) return [s];
        const words = s.split(/\s+/);
        const lines = [];
        let line = '';
        const pushChunkedWord = (word) => {
            let chunk = '';
            for (let c = 0; c < word.length; c++) {
                const next = chunk + word[c];
                if (chunk && textWidth(next) > maxW) {
                    lines.push(chunk);
                    chunk = word[c];
                } else {
                    chunk = next;
                }
            }
            line = chunk;
        };
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            if (!word) continue;
            if (textWidth(word) > maxW) {
                if (line) {
                    lines.push(line);
                    line = '';
                }
                pushChunkedWord(word);
                continue;
            }
            const test = line ? (line + ' ' + word) : word;
            if (line && textWidth(test) > maxW) {
                lines.push(line);
                line = word;
            } else {
                line = test;
            }
        }
        if (line) lines.push(line);
        return lines.length ? lines : [''];
    }

    function wrapObjectiveToWidth(str, maxW) {
        const minLast = CARD_FIT.OBJECTIVE_MIN_LAST_LINE_WORDS;
        const words = String(str || '').split(/\s+/).filter(Boolean);
        if (!words.length) return [''];
        // D-061: 6+ words wrap to two even lines when both fit, so a long
        // brief is not a single banner and the second line is never 1–2 words.
        if (words.length >= minLast * 2) {
            let bestI = null;
            let bestDiff = Infinity;
            for (let i = minLast; i <= words.length - minLast; i++) {
                const a = words.slice(0, i).join(' ');
                const b = words.slice(i).join(' ');
                if (textWidth(a) > maxW || textWidth(b) > maxW) continue;
                const diff = Math.abs(textWidth(a) - textWidth(b));
                if (diff < bestDiff) {
                    bestDiff = diff;
                    bestI = i;
                }
            }
            if (bestI != null) {
                return [words.slice(0, bestI).join(' '), words.slice(bestI).join(' ')];
            }
        }
        return balanceLastWrapLine(wrapTextToWidth(str, maxW), maxW, textWidth);
    }

    // Line count follows final prompt (layout); display may scramble but must not add/remove lines
    function linesForPrompt(displayStr, layoutStr, maxW) {
        const layoutLines = wrapTextToWidth(layoutStr || displayStr || '', maxW);
        const lineCount = Math.max(1, layoutLines.length);
        let displayLines = wrapTextToWidth(displayStr || '', maxW);
        // If scramble still wraps more (rare), merge extras into last kept line to avoid bounce
        while (displayLines.length > lineCount) {
            const extra = displayLines.pop();
            displayLines[displayLines.length - 1] =
                (displayLines[displayLines.length - 1] || '') + extra;
        }
        while (displayLines.length < lineCount) displayLines.push('');
        return displayLines.slice(0, lineCount);
    }

    function measureObjectiveHeight(wrapW) {
        if (!objectiveText) return 0;
        textSize(objectiveSize);
        textStyle(cardTextStyle);
        return wrapObjectiveToWidth(toSentenceCase(objectiveText), wrapW).length * objectiveLineH;
    }

    function measurePromptClusterHeight() {
        let total = 0;
        for (let i = 0; i < headersToDraw.length; i++) {
            if (!(typeof isUnlabeledPromptHeader === 'function' && isUnlabeledPromptHeader(headersToDraw[i]))) {
                total += labelLineH + labelGap;
            }
            textSize(promptSize);
            textStyle(cardTextStyle);
            const entry = promptValueTexts[i] || { display: '', layout: '' };
            if (isPromptImageEntry(entry)) {
                // D-053: pictures sit in the film square, not the cluster stack
                if (entry.imageWait) total += imageSlotH;
            } else {
                const lines = wrapTextToWidth(entry.layout || entry.display || '', MAX_PROMPT_WIDTH);
                total += Math.max(1, lines.length) * promptLineH;
            }
            if (i < headersToDraw.length - 1) total += promptBlockGap;
        }
        return total;
    }

    function layoutBelowName() {
        const nameBottom = cardY + padY + nameRowHeight;
        const objH = measureObjectiveHeight(innerWidth);
        const objBlock = objH ? (belowNameGap + objH + objectiveToPromptGap) : 0;
        innerTop = nameBottom + objBlock;
        innerBottom = cardY + cardHeight - padY;
        availableHeight = innerBottom - innerTop;
        MAX_PROMPT_WIDTH = clusterWrapWidth();
    }

    // Scale type down so up to 4 prompts stay inside the locked card (no spill).
    // D-012: never shrink below minPromptSize — extra length wraps instead of going tiny.
    layoutBelowName();
    let contentH = measurePromptClusterHeight();
    const nameBottom = cardY + padY + nameRowHeight;
    const packed = (innerTop - nameBottom) + contentH;
    const belowName = innerBottom - nameBottom;
    if (packed > belowName && belowName > 40 && packed > 0) {
        const s = belowName / packed;
        const nextPrompt = Math.max(minPromptSize, promptSize * s);
        const promptScale = nextPrompt / promptSize;
        promptSize = nextPrompt;
        labelSize *= promptScale;
        objectiveSize *= promptScale;
        nameSize = Math.max(16 * typeScale, nameSize * promptScale);
        nameRowHeight = Math.max(28 * typeScale, nameSize * 1.25);
        promptLineH = promptSize * lineHeightRatio;
        labelLineH = labelSize * 1.08;
        objectiveLineH = objectiveSize * 1.1;
        labelGap = labelSize * 0.1;
        promptBlockGap = labelSize * 0.35;
        objectiveToPromptGap = Math.max(8, objectiveToPromptGap * promptScale);
        layoutBelowName();
        contentH = measurePromptClusterHeight();
    }

    // D-038 leftover-slot grow is unused while pictures live in the film square (D-053).
    const imageCount = promptValueTexts.filter(isPromptImageEntry).length;
    const fallbackImageWait = promptValueTexts.some(function (e) { return e && e.imageWait; });
    if (fallbackImageWait && imageCount > 0) {
        layoutBelowName();
        imageSlotH = promptImageSlotHeight(chrome.phone);
        const used = measurePromptClusterHeight();
        const slack = availableHeight - used;
        if (slack > 1) {
            imageSlotH += Math.floor(slack / imageCount);
        }
        contentH = measurePromptClusterHeight();
        if (contentH > availableHeight) {
            const over = contentH - availableHeight;
            imageSlotH = Math.max(
                promptImageSlotHeight(chrome.phone),
                imageSlotH - Math.ceil(over / imageCount)
            );
        }
    }

    // D-028: prompts cluster in the remaining space below the objective
    contentH = measurePromptClusterHeight();
    // Pictures occupy the film square (D-053); pin labels to the top so they sit in the gutter
    const clusterTop = (imageCount > 0 && !fallbackImageWait)
        ? innerTop
        : innerTop + Math.max(0, (availableHeight - contentH) / 2);

    window.sketchCardBounds = {
        x: cardX,
        y: cardY,
        w: cardWidth,
        h: cardHeight,
        bottom: cardY + cardHeight,
        nextTop: nextTop,
        resultsTop: resultsTop,
        runTop: runTop,
        toolsBottom: toolsBottom,
        cornerRadius: cornerRadius,
        nameRowY: cardY + padY,
        nameRowH: nameRowHeight,
        nameSize: nameSize
    };
    // Always sync DOM chrome to the locked card (don't skip — RUN was getting stuck off-screen)
    if (typeof window.positionNameInputAndButtons === 'function') {
        window.positionNameInputAndButtons();
    }

    noStroke();
    fill(frameRgb.r, frameRgb.g, frameRgb.b);
    rect(cardX, cardY, cardWidth, cardHeight, cornerRadius);

    const cardStrokeW = sketchCardStroke();
    if (cardStrokeW > 0) {
        stroke(primaryRgb.r, primaryRgb.g, primaryRgb.b);
        strokeWeight(cardStrokeW);
        noFill();
        rect(cardX, cardY, cardWidth, cardHeight, cornerRadius);
        noStroke();
    }

    // Name is the DOM input in the card row. Only paint on canvas for screenshots (saveCanvas skips DOM).
    if (window._drawCardNameOnCanvas && displayName) {
        const nr = Number.isFinite(primaryRgb.r) ? primaryRgb.r : textRgb.r;
        const ng = Number.isFinite(primaryRgb.g) ? primaryRgb.g : textRgb.g;
        const nb = Number.isFinite(primaryRgb.b) ? primaryRgb.b : textRgb.b;
        fill(nr, ng, nb);
        textSize(nameSize);
        textStyle(cardTextStyle);
        textAlign(CENTER, CENTER);
        text(displayName, centerX, cardY + padY + nameRowHeight / 2);
        textAlign(LEFT, TOP);
    }

    // D-028: objective sits under the name field, full inner width
    // D-061: sentence case, centered; last wrap line is not 1–2 leftover words
    if (objectiveText) {
        fill(primaryRgb.r * .8, primaryRgb.g * .8, primaryRgb.b * .8);
        textSize(objectiveSize);
        textStyle(cardTextStyle);
        textAlign(CENTER, TOP);
        const objLines = wrapObjectiveToWidth(toSentenceCase(objectiveText), innerWidth);
        const objY = cardY + padY + nameRowHeight + belowNameGap;
        for (let li = 0; li < objLines.length; li++) {
            text(objLines[li], centerX, objY + li * objectiveLineH);
        }
    }

    // Prompts start centered in the remaining space below the objective
    let contentY = clusterTop;

    // Light feedback: show GENERATING… in the card until the first prompt text appears
    const hasPromptDisplay = promptValueTexts.some(p => {
        if ((p.display || '').length > 0 || p.imageWait) return true;
        const layout = (p && p.layout) || '';
        return typeof isImagePromptToken === 'function' && isImagePromptToken(layout);
    });
    if ((isGenerating || isAnimating) && !hasPromptDisplay) {
        const pulse = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(millis() / 280));
        fill(primaryRgb.r * pulse, primaryRgb.g * pulse, primaryRgb.b * pulse);
        textSize(Math.max(18 * typeScale, promptSize * 0.85));
        textStyle(cardTextStyle);
        textAlign(CENTER, CENTER);
        text('GENERATING…', centerX, cardY + cardHeight * 0.55);
        textAlign(LEFT, TOP);
        return;
    }

    // Prompts: wrap to the centered cluster width so type stays inside the card (D-028)
    const leftoverBounds = leftoverRevealBounds(cardX, cardY, cardWidth, cardHeight, innerTop, innerBottom);
    const filmSquare = filmSquareFromBounds(leftoverBounds, sketchRevealGridSize());
    const prActive = window.pixelReveal && window.pixelReveal.active;
    const prLanding = !!(prActive && window.pixelReveal.landing);
    const imageTokens = [];
    if (headersToDraw.length > 0) {
        const promptBrightness = 2;
        headersToDraw.forEach((header, i) => {
            const entry = promptValueTexts[i] || { display: '', layout: '' };
            const displayText = entry.display || '';
            const layoutText = entry.layout || displayText;
            // D-018: skip the heading row when the teacher left the prompt label blank
            const showLabel = !(typeof isUnlabeledPromptHeader === 'function' && isUnlabeledPromptHeader(header));
            if (showLabel) {
                const labelInk = labelInkRgb(primaryRgb, bgRgb);
                fill(labelInk.r, labelInk.g, labelInk.b);
                textSize(labelSize);
                textStyle(cardTextStyle);
                textAlign(CENTER, TOP);
                text((header || '').toUpperCase(), centerX, contentY);
                contentY += labelLineH + labelGap;
            }
            fill(
                min(primaryRgb.r * promptBrightness, 255),
                min(primaryRgb.g * promptBrightness, 255),
                min(primaryRgb.b * promptBrightness, 255)
            );
            textSize(promptSize);
            textStyle(cardTextStyle);
            textAlign(CENTER, TOP);
            // D-015/D-016: pictures skip scramble; dots while waiting, then the image
            if (typeof isImagePromptToken === 'function' && isImagePromptToken(layoutText || displayText)) {
                if (entry.imageWait) {
                    const slotH = imageSlotH;
                    drawImageWaitDots(centerX, contentY, slotH, primaryRgb, entry.dotFlicker);
                    contentY += slotH;
                } else {
                    imageTokens.push(layoutText || displayText);
                }
            } else {
                // Line breaks follow final prompt, not scramble width (prevents bounce)
                const lines = linesForPrompt(displayText, layoutText, MAX_PROMPT_WIDTH);
                for (let li = 0; li < lines.length; li++) {
                    text(lines[li], centerX, contentY + li * promptLineH);
                }
                contentY += lines.length * promptLineH;
            }
            if (i < headersToDraw.length - 1) contentY += promptBlockGap;
        });
    }

    // D-053: pictures in the film square. Skip while the film fully covers (no edge flash).
    // Mosaic while tiles lift so the photo matches the glitch grid; sharp crop after land.
    if (imageTokens.length && !(prActive && !prLanding)) {
        const mosaic = prLanding;
        imageTokens.forEach(function (token, i) {
            const dest = imageTokens.length === 1
                ? filmSquare
                : splitFilmSquareRow(filmSquare, imageTokens.length, i);
            drawPromptImageInFilmSquare(token, dest, mosaic, primaryRgb);
        });
    }

    let pixelOverlayBounds = null;
    if (prActive) {
        pixelOverlayBounds = leftoverBounds;
    }

    if (pixelOverlayBounds) {
        drawPixelRevealOverlay(pixelOverlayBounds, primaryRgb, bgRgb);
    }
}

function keyPressed() {
    debugLog('1. Key pressed:', key, 'keyCode:', keyCode);
    
    const resultNameEl = window.getResultNameFieldElement ? window.getResultNameFieldElement() : null;
    const inputFocused = resultNameEl && resultNameEl === document.activeElement;
    const activeElement = document.activeElement;
    const inInputField = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable);
    
    // When input is NOT focused, all keys work normally
    if (!inputFocused && !inInputField) {
        // All keys work normally when input is not focused
    } else {
        // When input IS focused:
        // - UP arrow generates prompts (allow through)
        // - DOWN arrow focuses input (allow through)  
        // - LEFT/RIGHT arrows navigate between students (allow through)
        // - ENTER/RETURN generates prompts (allow through)
        // - All other keys blocked
        if (keyCode !== UP_ARROW && keyCode !== DOWN_ARROW && keyCode !== LEFT_ARROW && keyCode !== RIGHT_ARROW && keyCode !== 13 && key !== 'Enter') {
            debugLog('Input field focused, ignoring keypress:', key);
            return;
        }
    }

    // Toggle control panel with 'C' key (no-op when panel hidden)
    if (key === 'c' || key === 'C') {
        if (window.toggleControlPanel) window.toggleControlPanel();
        return;
    }

    // Handle left/right arrow keys for student navigation
    if (keyCode === LEFT_ARROW) {
        console.log('Left arrow pressed - navigating to previous student');
        previousName = ''; // Clear previous name
        prevStudent();
        // Play beep sound
        if (audioCtx && window.playSound) {
            window.playSound((window.SOUND && window.SOUND.NAV_LEFT) || { FREQUENCY: 300, DURATION: 80 });
        }
        return;
    }
    
    if (keyCode === RIGHT_ARROW) {
        console.log('Right arrow pressed - navigating to next student');
        previousName = ''; // Clear previous name
        nextStudent();
        // Play beep sound
        if (audioCtx && window.playSound) {
            window.playSound((window.SOUND && window.SOUND.NAV_RIGHT) || { FREQUENCY: 500, DURATION: 80 });
        }
        return;
    }
    
    // Handle up arrow key for generating prompts (same as Enter / phone RUN)
    if (keyCode === UP_ARROW || key === 'ArrowUp') {
        debugLog('Up arrow pressed - generating prompts');
        triggerPromptRun();
        return;
    }
    
    // Handle down arrow key – advance to a NEW run slot (same as clicking NEXT)
    if (keyCode === DOWN_ARROW || key === 'ArrowDown') {
        debugLog('Down arrow pressed - advancing to next run slot');
        if (typeof window.advanceToNextResultAndClearPrompts === 'function') {
            window.advanceToNextResultAndClearPrompts('');
        }
        if (resultNameEl) resultNameEl.focus();
        if (audioCtx && window.playSound) {
            window.playSound((window.SOUND && window.SOUND.NAV_DOWN) || { FREQUENCY: 400, DURATION: 100 });
        }
        return;
    }
    
    if (keyCode === 13 || key === 'Enter') {
        debugLog('Return/Enter pressed - generating prompts');
        triggerPromptRun();
        return;
    }
    
    if (key === ' ') {
        if (isGenerating || isAnimating) {
            shouldStop = true;
            isGenerating = false;
            isAnimating = false;
            // Clear any running intervals
            if (window.clearAnimations) {
                window.clearAnimations();
            }
            debugLog('Generation interrupted by spacebar - state reset');
        }
    }
}

// Same action as UP arrow / Enter — used by phone RUN button
function triggerPromptRun() {
    // D-047: second press must stop even if name/missing checks would run first.
    if (window.pixelReveal && window.pixelReveal.active
        && typeof window.skipRevealToResult === 'function') {
        window.skipRevealToResult();
        return;
    }
    const resultNameEl = window.getResultNameFieldElement ? window.getResultNameFieldElement() : null;
    let inputValue = (window.getResultNameFieldValue && window.getResultNameFieldValue()) || '';
    if (!inputValue) inputValue = getAutoRunName();
    studentName = inputValue;
    // Keep index on the intended history slot (NEXT sets index === classReport.length).
    if (studentName && Array.isArray(allStudents)) {
        while (allStudents.length <= currentStudentIndex) allStudents.push('');
        if (currentStudentIndex < 0) currentStudentIndex = 0;
        allStudents[currentStudentIndex] = studentName;
        if (typeof totalUniqueStudents !== 'undefined') totalUniqueStudents = allStudents.length;
    }
    if (resultNameEl) resultNameEl.blur();

    const missing = getMissingEditorData();
    // D-011: objective is optional after Skip. Only missing prompts block a run.
    if (missing.missingPrompts) {
        if (audioCtx && window.playSound) {
            window.playSound({ FREQUENCY: 200, DURATION: 150 });
        }
        showThemedMessage('Waiting for user to input prompts.');
        return;
    }

    // Resume audio on this gesture so scramble/reveal sounds can play
    if (window.audioCtx && window.audioCtx.state === 'suspended') {
        window.audioCtx.resume().catch(function () {});
    }
    if (window.startGeneration) {
        debugLog('Calling window.startGeneration');
        window.startGeneration();
        fieldClearedForNextStudent = false;
    } else {
        console.error('startGeneration is not available on window object');
        if (window.resetGeneratorState) window.resetGeneratorState();
        if (window.generateNextAttribute) window.generateNextAttribute();
        fieldClearedForNextStudent = false;
    }
}

function mousePressed() {
    // Result name is in "> " field top-left (ui-manager); no canvas hit area needed
}

function windowResized() {
    updateUIOnResize();
}

// Export functions to window for use in other modules
window.takeScreenshot = takeScreenshot;
window.triggerPromptRun = triggerPromptRun;
