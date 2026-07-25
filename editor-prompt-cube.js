// Prompt Cube — one central cell editor; swipe right = prompts, swipe down = criteria
// Keeps the hidden .prompt-grid in sync for existing save/load logic.

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

/** Write visible cube fields back into the hidden grid cell */
function flushPromptCube() {
    const headers = document.querySelectorAll('.header-input');
    const criteria = document.querySelectorAll('.criterion-label-input');
    const textareas = document.querySelectorAll('.textarea-container textarea');
    const promptCount = headers.length;
    if (!promptCount || !criteria.length) return;

    clampCubeIndices();
    const p = cubePromptIndex;
    const c = cubeCriterionIndex;

    const headerInput = document.getElementById('cube-prompt-header');
    const criterionInput = document.getElementById('cube-criterion-label');
    const promptsArea = document.getElementById('cube-prompts');

    if (headers[p] && headerInput) {
        headers[p].value = headerInput.value;
    }
    if (criteria[c] && criterionInput) {
        criteria[c].value = criterionInput.value;
        if (typeof updateCriterionLabel === 'function') {
            updateCriterionLabel(c, criterionInput.value);
        }
    }
    const ta = textareas[c * promptCount + p];
    if (ta && promptsArea) {
        ta.value = promptsArea.value;
    }
}

/** Load hidden grid cell into the cube */
function loadPromptCube() {
    const cube = document.getElementById('prompt-cube');
    if (!cube) return;

    const headers = document.querySelectorAll('.header-input');
    const criteria = document.querySelectorAll('.criterion-label-input');
    const textareas = document.querySelectorAll('.textarea-container textarea');
    const letterEl = document.getElementById('cube-criterion-letter');
    const headerInput = document.getElementById('cube-prompt-header');
    const criterionInput = document.getElementById('cube-criterion-label');
    const promptsArea = document.getElementById('cube-prompts');
    const promptPos = document.getElementById('cube-prompt-pos');
    const criterionPos = document.getElementById('cube-criterion-pos');
    const deletePromptBtn = document.getElementById('cube-delete-prompt');
    const deleteCriterionBtn = document.getElementById('cube-delete-criterion');

    const promptCount = headers.length;
    const criterionCount = criteria.length;
    if (!promptCount || !criterionCount) return;

    clampCubeIndices();
    const p = cubePromptIndex;
    const c = cubeCriterionIndex;

    if (letterEl) {
        letterEl.textContent = String.fromCharCode(65 + c) + ':';
    }
    if (headerInput) {
        headerInput.value = headers[p] ? headers[p].value : '';
        headerInput.placeholder = 'Prompt ' + (p + 1) + ' name';
    }
    if (criterionInput) {
        criterionInput.value = criteria[c] ? criteria[c].value : '';
    }
    const ta = textareas[c * promptCount + p];
    if (promptsArea) {
        promptsArea.value = ta ? ta.value : '';
    }
    if (promptPos) {
        promptPos.textContent = 'PROMPT ' + (p + 1) + ' / ' + promptCount;
    }
    if (criterionPos) {
        criterionPos.textContent = 'CRITERION ' + String.fromCharCode(65 + c) + ' / ' + criterionCount;
    }
    if (deletePromptBtn) {
        deletePromptBtn.hidden = promptCount <= 1;
    }
    if (deleteCriterionBtn) {
        deleteCriterionBtn.hidden = criterionCount <= 1;
    }

    // Keep add buttons in sync with limits
    const addPromptBtn = document.querySelector('.cube-add-prompt');
    const addCatBtn = document.querySelector('.cube-add-category');
    if (addPromptBtn) {
        addPromptBtn.style.display = promptCount >= MAX_PROMPTS ? 'none' : 'inline-flex';
    }
    if (addCatBtn) {
        addCatBtn.style.display = criterionCount >= MAX_CATEGORIES ? 'none' : 'inline-flex';
    }
}

function refreshPromptCube() {
    clampCubeIndices();
    loadPromptCube();
}

function navigatePromptCube(dPrompt, dCriterion) {
    const pc = getCubePromptCount();
    const cc = getCubeCriterionCount();
    if (!pc || !cc) return;

    flushPromptCube();

    if (dPrompt) {
        cubePromptIndex = (cubePromptIndex + dPrompt + pc) % pc;
    }
    if (dCriterion) {
        cubeCriterionIndex = (cubeCriterionIndex + dCriterion + cc) % cc;
    }

    const cube = document.getElementById('prompt-cube');
    if (cube) {
        cube.classList.remove('cube-flash');
        // force reflow for animation restart
        void cube.offsetWidth;
        cube.classList.add('cube-flash');
    }

    loadPromptCube();
    if (typeof playClickSound === 'function') playClickSound();
}

function cubeAddPrompt() {
    flushPromptCube();
    if (typeof addNewPrompt === 'function') addNewPrompt();
    cubePromptIndex = Math.max(0, getCubePromptCount() - 1);
    refreshPromptCube();
}

function cubeAddCategory() {
    flushPromptCube();
    if (typeof addNewCategory === 'function') addNewCategory();
    cubeCriterionIndex = Math.max(0, getCubeCriterionCount() - 1);
    refreshPromptCube();
}

function cubeDeletePrompt() {
    flushPromptCube();
    if (typeof deletePromptAt === 'function') {
        deletePromptAt(cubePromptIndex);
    }
    clampCubeIndices();
    refreshPromptCube();
}

function cubeDeleteCriterion() {
    flushPromptCube();
    if (typeof deleteCategoryAt === 'function') {
        deleteCategoryAt(cubeCriterionIndex);
    }
    clampCubeIndices();
    refreshPromptCube();
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

    cube.addEventListener('touchstart', (e) => {
        if (!e.touches || !e.touches[0]) return;
        cubeTouchActive = true;
        cubeTouchStartX = e.touches[0].clientX;
        cubeTouchStartY = e.touches[0].clientY;
    }, { passive: true });

    cube.addEventListener('touchend', (e) => {
        if (!cubeTouchActive) return;
        cubeTouchActive = false;
        const t = e.changedTouches && e.changedTouches[0];
        if (!t) return;

        const dx = t.clientX - cubeTouchStartX;
        const dy = t.clientY - cubeTouchStartY;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);
        if (absX < CUBE_SWIPE_THRESHOLD && absY < CUBE_SWIPE_THRESHOLD) return;

        const target = e.target;
        const inTextarea = target && target.id === 'cube-prompts';

        // Horizontal: swipe right → next prompt, left → previous
        if (absX > absY) {
            if (dx > 0) navigatePromptCube(1, 0);
            else navigatePromptCube(-1, 0);
            return;
        }

        // Vertical: allow native scroll inside prompts textarea
        if (inTextarea) return;

        // Swipe down → next criterion, up → previous
        if (dy > 0) navigatePromptCube(0, 1);
        else navigatePromptCube(0, -1);
    }, { passive: true });

    // Desktop: arrow keys when focus is inside cube (not while typing in textarea/input)
    document.addEventListener('keydown', (e) => {
        if (!cube.contains(document.activeElement) && document.activeElement !== document.body) {
            // allow arrows when nothing focused / cube focused
        }
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

    ['cube-prompt-header', 'cube-criterion-label', 'cube-prompts'].forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('input', onCubeFieldInput);
        el.addEventListener('change', onCubeFieldInput);
    });
}

function initPromptCube() {
    initPromptCubeGestures();
    refreshPromptCube();
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

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPromptCube);
} else {
    initPromptCube();
}

// Refresh cube after grid rebuilds (load / add / delete)
window.addEventListener('promptDataUpdated', () => {
    setTimeout(refreshPromptCube, 50);
});
