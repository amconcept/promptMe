// Phone cube editor — same data model as grid; A1 leads objective & prompt labels.
// Horizontal = prompt sets (max 4). Vertical = categories. Chevrons vs + by position.

let cubePromptIndex = 0;
let cubeCriterionIndex = 0;
let cubeTouchStartX = 0;
let cubeTouchStartY = 0;
let cubeTouchActive = false;
const CUBE_SWIPE_THRESHOLD = 48;

function getCubePromptCount() {
    return document.querySelectorAll('.header-input').length;
}

function getCubeCriterionCount() {
    return document.querySelectorAll('.criterion-label-input').length;
}

function clampCubeIndices() {
    const pc = Math.max(1, getCubePromptCount());
    const cc = Math.max(1, getCubeCriterionCount());
    cubePromptIndex = Math.max(0, Math.min(cubePromptIndex, pc - 1));
    cubeCriterionIndex = Math.max(0, Math.min(cubeCriterionIndex, cc - 1));
}

/** Label (prompt-set header) is editable on category A only; others inherit */
function isLabelEditableOnCube() {
    return cubeCriterionIndex === 0;
}

/** Write cube fields into hidden grid (no save — callers decide) */
function flushPromptCube() {
    const headers = document.querySelectorAll('.header-input');
    const textareas = document.querySelectorAll('.textarea-container textarea');
    const promptCount = headers.length;
    const criterionCount = getCubeCriterionCount();
    if (!promptCount || !criterionCount) return;

    clampCubeIndices();
    const p = cubePromptIndex;
    const c = cubeCriterionIndex;

    const headerInput = document.getElementById('cube-prompt-header');
    const promptsArea = document.getElementById('cube-prompts');

    // Prompt-set label lives on the column; edit only from category A
    if (headers[p] && headerInput && isLabelEditableOnCube() && !headerInput.readOnly) {
        headers[p].value = headerInput.value;
    }

    const ta = textareas[c * promptCount + p];
    if (ta && promptsArea) {
        ta.value = promptsArea.value;
    }
}

/** Show/hide chrome without removing layout space (keeps A/B and set # stable) */
function setCubeControlActive(el, active) {
    if (!el) return;
    el.classList.toggle('is-inactive', !active);
    el.setAttribute('aria-hidden', active ? 'false' : 'true');
    el.disabled = !active;
    el.tabIndex = active ? 0 : -1;
}

/** Update + / chevron / delete chrome for current cell */
function updateCubeChrome() {
    const pc = getCubePromptCount();
    const cc = getCubeCriterionCount();
    clampCubeIndices();
    const p = cubePromptIndex;
    const c = cubeCriterionIndex;
    const maxP = typeof MAX_PROMPTS === 'number' ? MAX_PROMPTS : 4;
    const maxC = typeof MAX_CATEGORIES === 'number' ? MAX_CATEGORIES : 6;

    const promptBadge = document.getElementById('cube-prompt-badge');
    const catBadge = document.getElementById('cube-cat-badge');
    const prevBtn = document.getElementById('cube-prompt-prev');
    const nextBtn = document.getElementById('cube-prompt-next');
    const addPromptBtn = document.getElementById('cube-prompt-add');
    const catUp = document.getElementById('cube-cat-up');
    const catDown = document.getElementById('cube-cat-down');
    const catAdd = document.getElementById('cube-cat-add');
    const deleteBtn = document.getElementById('cube-delete-action');

    // SVG <text> keeps VT323 glyphs geometrically centered in the circle
    if (promptBadge) {
        const label = String(p + 1);
        promptBadge.setAttribute('aria-label', label);
        const t = promptBadge.querySelector('text');
        if (t) t.textContent = label;
    }
    if (catBadge) {
        const label = String.fromCharCode(65 + c);
        catBadge.setAttribute('aria-label', label);
        const t = catBadge.querySelector('text');
        if (t) t.textContent = label;
    }

    // Prompt nav: + when can grow from last; chevrons when multiples; at max only back
    const atFirstPrompt = p === 0;
    const atLastPrompt = p === pc - 1;
    const canAddPrompt = pc < maxP;
    const showPrev = !(atFirstPrompt || pc <= 1);
    const showNext = !(atLastPrompt || pc <= 1);
    const showAddPrompt = canAddPrompt && atLastPrompt;

    setCubeControlActive(prevBtn, showPrev);
    setCubeControlActive(nextBtn, showNext);
    setCubeControlActive(addPromptBtn, showAddPrompt);

    // Category rail: fixed 3-row grid — inactive controls stay invisible but occupy space
    const atFirstCat = c === 0;
    const atLastCat = c === cc - 1;
    const canAddCat = cc < maxC;
    const showCatUp = !(atFirstCat || cc <= 1);
    const showCatDown = !(atLastCat || cc <= 1);
    const showCatAdd = canAddCat && atLastCat;

    setCubeControlActive(catUp, showCatUp);
    setCubeControlActive(catDown, showCatDown);
    setCubeControlActive(catAdd, showCatAdd);

    // Contextual delete (never A1)
    if (deleteBtn) {
        if (p > 0) {
            deleteBtn.hidden = false;
            deleteBtn.textContent = 'delete prompt set ' + (p + 1);
            deleteBtn.onclick = () => cubeDeletePrompt();
        } else if (c > 0) {
            deleteBtn.hidden = false;
            deleteBtn.textContent = 'delete grouping ' + String.fromCharCode(65 + c);
            deleteBtn.onclick = () => cubeDeleteCriterion();
        } else {
            deleteBtn.hidden = true;
            deleteBtn.textContent = '';
            deleteBtn.onclick = null;
        }
    }
}

/** Load hidden grid cell into the cube */
function loadPromptCube() {
    const cube = document.getElementById('prompt-cube');
    if (!cube) return;

    const headers = document.querySelectorAll('.header-input');
    const textareas = document.querySelectorAll('.textarea-container textarea');
    const headerInput = document.getElementById('cube-prompt-header');
    const promptsArea = document.getElementById('cube-prompts');

    const promptCount = headers.length;
    const criterionCount = getCubeCriterionCount();
    if (!promptCount || !criterionCount) return;

    clampCubeIndices();
    const p = cubePromptIndex;
    const c = cubeCriterionIndex;

    if (headerInput) {
        const colLabel = headers[p] ? headers[p].value : '';
        headerInput.value = colLabel;
        const editable = isLabelEditableOnCube();
        headerInput.readOnly = !editable;
        if (editable) {
            headerInput.placeholder = '… insert a label';
        } else {
            headerInput.placeholder = 'same as label A' + (p + 1);
            if (!colLabel) headerInput.value = '';
        }
    }

    const ta = textareas[c * promptCount + p];
    if (promptsArea) {
        promptsArea.value = ta ? ta.value : '';
    }

    updateCubeChrome();
}

function refreshPromptCube() {
    clampCubeIndices();
    loadPromptCube();
}

/** Navigate without wrapping (edges use + / back-only rules) */
function navigatePromptCube(dPrompt, dCriterion) {
    const pc = getCubePromptCount();
    const cc = getCubeCriterionCount();
    if (!pc || !cc) return;

    flushPromptCube();

    if (dPrompt) {
        cubePromptIndex = Math.max(0, Math.min(pc - 1, cubePromptIndex + dPrompt));
    }
    if (dCriterion) {
        cubeCriterionIndex = Math.max(0, Math.min(cc - 1, cubeCriterionIndex + dCriterion));
    }

    const cube = document.getElementById('prompt-cube');
    if (cube) {
        cube.classList.remove('cube-flash');
        void cube.offsetWidth;
        cube.classList.add('cube-flash');
    }

    loadPromptCube();
    if (typeof playClickSound === 'function') playClickSound();
}

function cubeAddPrompt() {
    flushPromptCube();
    const before = getCubePromptCount();
    const maxP = typeof MAX_PROMPTS === 'number' ? MAX_PROMPTS : 4;
    if (before >= maxP) return;
    if (typeof addNewPrompt === 'function') addNewPrompt();
    cubePromptIndex = Math.max(0, getCubePromptCount() - 1);
    refreshPromptCube();
    if (typeof autoSaveToLocalStorage === 'function') autoSaveToLocalStorage();
}

function cubeAddCategory() {
    flushPromptCube();
    const before = getCubeCriterionCount();
    const maxC = typeof MAX_CATEGORIES === 'number' ? MAX_CATEGORIES : 6;
    if (before >= maxC) return;
    if (typeof addNewCategory === 'function') addNewCategory();
    cubeCriterionIndex = Math.max(0, getCubeCriterionCount() - 1);
    refreshPromptCube();
    if (typeof autoSaveToLocalStorage === 'function') autoSaveToLocalStorage();
}

function cubeDeletePrompt() {
    // Column delete removes that prompt set across all categories (grid logic)
    if (cubePromptIndex <= 0) return;
    flushPromptCube();
    if (typeof deletePromptAt === 'function') {
        deletePromptAt(cubePromptIndex);
    }
    clampCubeIndices();
    refreshPromptCube();
    if (typeof autoSaveToLocalStorage === 'function') autoSaveToLocalStorage();
}

function cubeDeleteCriterion() {
    // Cannot delete category A (minimum with prompt 1)
    if (cubeCriterionIndex <= 0) return;
    flushPromptCube();
    if (typeof deleteCategoryAt === 'function') {
        deleteCategoryAt(cubeCriterionIndex);
    }
    clampCubeIndices();
    refreshPromptCube();
    if (typeof autoSaveToLocalStorage === 'function') autoSaveToLocalStorage();
}

function onCubeFieldInput() {
    flushPromptCube();
    if (typeof autoSaveToLocalStorage === 'function') {
        autoSaveToLocalStorage();
    }
}

function initPromptCubeGestures() {
    const cube = document.getElementById('prompt-cube');
    if (!cube || cube.dataset.gesturesBound === '1') return;
    cube.dataset.gesturesBound = '1';

    let axisLocked = null; // 'x' | 'y' | null once direction is clear
    let navigatedThisGesture = false;

    cube.addEventListener('touchstart', (e) => {
        if (!e.touches || !e.touches[0]) return;
        const t = e.target;
        // Don't steal taps meant for ‹ › / + / RUN
        if (t && (t.closest('button') || t.closest('a'))) {
            cubeTouchActive = false;
            return;
        }
        cubeTouchActive = true;
        axisLocked = null;
        navigatedThisGesture = false;
        cubeTouchStartX = e.touches[0].clientX;
        cubeTouchStartY = e.touches[0].clientY;
    }, { passive: true });

    // Claim horizontal swipes so the browser doesn't cancel them (textarea stays pan-y for scroll)
    cube.addEventListener('touchmove', (e) => {
        if (!cubeTouchActive || navigatedThisGesture || !e.touches || !e.touches[0]) return;
        const dx = e.touches[0].clientX - cubeTouchStartX;
        const dy = e.touches[0].clientY - cubeTouchStartY;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);
        if (!axisLocked && (absX > 12 || absY > 12)) {
            axisLocked = absX > absY ? 'x' : 'y';
        }
        if (axisLocked === 'x' && absX > 14) {
            e.preventDefault();
        }
    }, { passive: false });

    cube.addEventListener('touchend', (e) => {
        if (!cubeTouchActive) return;
        cubeTouchActive = false;
        if (navigatedThisGesture) return;
        const t = e.changedTouches && e.changedTouches[0];
        if (!t) return;

        const dx = t.clientX - cubeTouchStartX;
        const dy = t.clientY - cubeTouchStartY;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);
        if (absX < CUBE_SWIPE_THRESHOLD && absY < CUBE_SWIPE_THRESHOLD) return;

        const target = e.target;
        const inTextarea = target && (target.id === 'cube-prompts' || target.id === 'cube-prompt-header');
        const horizontal = axisLocked === 'x' || (axisLocked !== 'y' && absX > absY);

        if (horizontal) {
            // Inside the list, require a clear sideways swipe so typing/scroll still works
            if (inTextarea && absX < absY * 1.35) return;
            if (absX < CUBE_SWIPE_THRESHOLD) return;
            // Finger left → next prompt; finger right → previous (carousel-style)
            navigatePromptCube(dx < 0 ? 1 : -1, 0);
            navigatedThisGesture = true;
            return;
        }

        // Vertical: skip when gesture started in the list (keep native scroll)
        if (inTextarea) return;
        if (absY < CUBE_SWIPE_THRESHOLD) return;
        navigatePromptCube(0, dy < 0 ? -1 : 1);
        navigatedThisGesture = true;
    }, { passive: true });

    document.addEventListener('keydown', (e) => {
        if (!isCubeLayout()) return;
        const tag = (document.activeElement && document.activeElement.tagName) || '';
        if (tag === 'TEXTAREA' || tag === 'INPUT') return;
        if (!cube.contains(document.activeElement) && document.activeElement !== document.body) return;

        if (e.key === 'ArrowRight') {
            e.preventDefault();
            navigatePromptCube(1, 0);
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            navigatePromptCube(-1, 0);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            navigatePromptCube(0, 1);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            navigatePromptCube(0, -1);
        }
    });

    ['cube-prompt-header', 'cube-prompts'].forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('input', onCubeFieldInput);
        el.addEventListener('change', onCubeFieldInput);
    });
}

const CUBE_LAYOUT_MQ = window.matchMedia(
    '(max-width: 640px), ((max-width: 900px) and (max-aspect-ratio: 3/4))'
);
// Remember phone/cube across RUN → sketch → >EDITOR (new tab / viewport blips).
const EDITOR_LAYOUT_KEY = 'promptMeEditorLayout';
const DESKTOP_LAYOUT_MQ = window.matchMedia('(min-width: 901px)');

function rememberEditorLayoutForSketch() {
    // Prefer live media query at leave-time (not sticky flag) so we record what user saw.
    sessionStorage.setItem(EDITOR_LAYOUT_KEY, CUBE_LAYOUT_MQ.matches ? 'cube' : 'grid');
}

function prefersForcedCube() {
    return sessionStorage.getItem(EDITOR_LAYOUT_KEY) === 'cube';
}

function isCubeLayout() {
    return CUBE_LAYOUT_MQ.matches || prefersForcedCube();
}

function syncEditorLayoutMode() {
    const cubeMode = isCubeLayout();
    document.body.classList.toggle('editor-cube-layout', cubeMode);

    const grid = document.querySelector('.prompt-grid');
    const addBtns = document.querySelector('.add-buttons-container');
    const cubeWrap = document.querySelector('.prompt-cube-wrap');

    if (grid) grid.setAttribute('aria-hidden', cubeMode ? 'true' : 'false');
    if (addBtns) addBtns.setAttribute('aria-hidden', cubeMode ? 'true' : 'false');
    if (cubeWrap) cubeWrap.setAttribute('aria-hidden', cubeMode ? 'false' : 'true');

    if (cubeMode) {
        refreshPromptCube();
    } else if (typeof flushPromptCube === 'function') {
        flushPromptCube();
        if (typeof autoSaveToLocalStorage === 'function') autoSaveToLocalStorage();
    }
}

function onEditorLayoutMqChange() {
    // Drop sticky cube only when the window becomes clearly desktop.
    if (DESKTOP_LAYOUT_MQ.matches && !CUBE_LAYOUT_MQ.matches) {
        sessionStorage.removeItem(EDITOR_LAYOUT_KEY);
    }
    syncEditorLayoutMode();
}

function initPromptCube() {
    initPromptCubeGestures();
    syncEditorLayoutMode();
    if (isCubeLayout()) refreshPromptCube();

    if (typeof CUBE_LAYOUT_MQ.addEventListener === 'function') {
        CUBE_LAYOUT_MQ.addEventListener('change', onEditorLayoutMqChange);
        DESKTOP_LAYOUT_MQ.addEventListener('change', onEditorLayoutMqChange);
    } else if (typeof CUBE_LAYOUT_MQ.addListener === 'function') {
        CUBE_LAYOUT_MQ.addListener(onEditorLayoutMqChange);
        DESKTOP_LAYOUT_MQ.addListener(onEditorLayoutMqChange);
    }
}

window.flushPromptCube = flushPromptCube;
window.loadPromptCube = loadPromptCube;
window.refreshPromptCube = refreshPromptCube;
window.navigatePromptCube = navigatePromptCube;
window.cubeAddPrompt = cubeAddPrompt;
window.cubeAddCategory = cubeAddCategory;
window.cubeDeletePrompt = cubeDeletePrompt;
window.cubeDeleteCriterion = cubeDeleteCriterion;
window.initPromptCube = initPromptCube;
window.isCubeLayout = isCubeLayout;
window.syncEditorLayoutMode = syncEditorLayoutMode;
window.rememberEditorLayoutForSketch = rememberEditorLayoutForSketch;
window.updateCubeChrome = updateCubeChrome;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPromptCube);
} else {
    initPromptCube();
}

window.addEventListener('promptDataUpdated', () => {
    if (isCubeLayout()) setTimeout(refreshPromptCube, 50);
});
