// Theme / Customize page — preset cards + F4 pixel editor (D-024, D-025, D-027, D-030, D-031, D-032, D-033, D-041, D-042, D-049, D-046, D-048).
// Live re-skin goes through changeTheme(), same as the old dropdown.
// Read shared knobs off window — a second `const REVEAL` here would throw (already declared in reveal-animation.js).

const themePage = {
    state: null,
    selectedFrame: 0,
    tool: 'pen',
    // D-027: 1 = theme ink (follows the live preset). Hex = a palette paint.
    paintColor: 1,
    painting: false,
    customPlaying: false,
    customPlayhead: 0,
    customTimer: null,
    defaultTimer: null,
    defaultTick: 0,
    fillingKnobs: false,
    fillingShape: false,
    // D-030: which color chip the web swatches paint (ink / paper / stroke)
    colorSlot: 'primary',
    swatchGroup: 'primary',
    // D-031: film-strip selection + drag reorder
    selectedFrames: null,
    frameAnchor: 0,
    dragFrom: null,
    dragStartX: 0,
    dragStartY: 0,
    draggingFrame: false,
    frameDragged: false
};

function currentThemeName() {
    return localStorage.getItem('selectedTheme') || 'windows';
}

function setLookStatus(text) {
    const el = document.getElementById('theme-look-status');
    if (el) el.textContent = text || '';
}

function updateLookStatus() {
    const name = currentThemeName();
    const label = (window.THEME_PRESET_LABELS && window.THEME_PRESET_LABELS[name]) || name;
    const activity = (typeof getCurrentActivityName === 'function') ? getCurrentActivityName() : null;
    const apply = document.getElementById('knob-apply');
    if (apply) {
        apply.disabled = !activity;
        apply.classList.toggle('is-disabled', !activity);
        apply.textContent = activity ? ('Use on ' + activity) : 'Use on this activity';
    }
    const saved = (typeof themeHasSavedLook === 'function') && themeHasSavedLook(name);
    if (!activity) {
        setLookStatus(saved
            ? (label + ' thumbnail is saved in this browser. Open an activity to apply it.')
            : (label + ' is factory. Open an activity to apply a look.'));
        return;
    }
    setLookStatus(saved
        ? (label + ' thumbnail is saved. Use on ' + activity + ' stamps this activity.')
        : (label + ' is factory until you Save look.'));
}

function saveCurrentLook() {
    const name = currentThemeName();
    if (typeof commitThemeLook === 'function') commitThemeLook(name);
    if (typeof changeTheme === 'function') changeTheme(name);
    const label = (window.THEME_PRESET_LABELS && window.THEME_PRESET_LABELS[name]) || name;
    renderThemeCards();
    setLookStatus('Saved on the ' + label + ' thumbnail.');
}

function applyLookToActivity() {
    if (typeof applyThemeToCurrentActivity !== 'function') {
        setLookStatus('Could not apply — reload and try again.');
        return;
    }
    const result = applyThemeToCurrentActivity();
    const label = (window.THEME_PRESET_LABELS && window.THEME_PRESET_LABELS[result.theme]) || result.theme;
    renderThemeCards();
    if (!result.ok) {
        setLookStatus('Open an activity in the editor first, then Use on this activity.');
        updateLookStatus();
        return;
    }
    setLookStatus(label + ' is on ' + result.activityName + '. Opening that activity will recall this look.');
}

function persistThemePage() {
    if (typeof saveRevealAnimation === 'function') {
        themePage.state = saveRevealAnimation(themePage.state);
    }
    // D-055: the open activity keeps this film, same as File → Save.
    if (typeof stampRevealOnCurrentActivity === 'function') {
        stampRevealOnCurrentActivity(themePage.state);
    }
}

function paintColors() {
    return {
        primary: (typeof cssVarColor === 'function') ? cssVarColor('--primary-color', '#ffffff') : '#ffffff',
        background: (typeof cssVarColor === 'function') ? cssVarColor('--background-color', '#000080') : '#000080'
    };
}

/** How many cells on a side of the current drawing (D-032). */
function currentGridSize() {
    if (typeof revealGridSize === 'function') return revealGridSize(themePage.state);
    return (themePage.state && themePage.state.gridSize) || (window.REVEAL && window.REVEAL.GRID_SIZE) || 6;
}

/** How many drawings in the current sequence (D-032). */
function currentFrameCount() {
    if (typeof revealFrameCount === 'function') return revealFrameCount(themePage.state);
    const n = themePage.state && themePage.state.frames && themePage.state.frames.length;
    return n || (window.REVEAL && window.REVEAL.FRAME_COUNT) || 2;
}

function framePaintOpts() {
    const colors = paintColors();
    colors.size = currentGridSize();
    return colors;
}

function clampSelectedFrames() {
    const last = Math.max(0, currentFrameCount() - 1);
    themePage.selectedFrame = Math.min(themePage.selectedFrame || 0, last);
    const kept = new Set();
    selectedFrameSet().forEach(function (i) {
        if (i >= 0 && i <= last) kept.add(i);
    });
    if (!kept.size) kept.add(themePage.selectedFrame);
    themePage.selectedFrames = kept;
    if (!Number.isFinite(themePage.frameAnchor) || themePage.frameAnchor > last) {
        themePage.frameAnchor = themePage.selectedFrame;
    }
    if (themePage.customPlayhead > last) themePage.customPlayhead = 0;
}

function syncRevealShapeKnobs() {
    const size = currentGridSize();
    const count = currentFrameCount();
    const grid = document.getElementById('reveal-grid-size');
    const frames = document.getElementById('reveal-frame-count');
    const gridVal = document.getElementById('reveal-grid-val');
    const framesVal = document.getElementById('reveal-frames-val');
    themePage.fillingShape = true;
    if (grid) grid.value = String(size);
    if (frames) frames.value = String(count);
    if (gridVal) gridVal.textContent = size + '×' + size;
    if (framesVal) framesVal.textContent = String(count);
    themePage.fillingShape = false;
    drawFinalNote();
}

/**
 * D-032: resample drawings when the grid changes.
 * D-041: shrinking parks leftover frames; growing restores them (pads empty only if never drawn).
 */
function applyRevealShape(nextSize, nextCount) {
    const fromSize = currentGridSize();
    const toSize = (typeof clampRevealGridSize === 'function')
        ? clampRevealGridSize(nextSize)
        : nextSize;
    const toCount = (typeof clampRevealFrameCount === 'function')
        ? clampRevealFrameCount(nextCount)
        : nextCount;
    if (toSize === fromSize && toCount === currentFrameCount()
        && themePage.state.gridSize === toSize && themePage.state.frameCount === toCount) {
        syncRevealShapeKnobs();
        return;
    }
    const src = themePage.state.frames || [];
    const srcNotes = themePage.state.notes || [];
    const maxFrames = (window.REVEAL && window.REVEAL.FRAME_COUNT_MAX) || 12;
    const stored = Math.min(maxFrames, Math.max(toCount, src.length));
    const next = [];
    const nextNotes = [];
    for (let i = 0; i < stored; i++) {
        next[i] = (typeof resampleRevealFrame === 'function')
            ? resampleRevealFrame(src[i], fromSize, toSize)
            : revealEmptyFrame(toSize);
        nextNotes[i] = (typeof clampRevealNoteIndex === 'function')
            ? clampRevealNoteIndex(srcNotes[i], i)
            : (i % 21);
    }
    themePage.state.gridSize = toSize;
    themePage.state.frameCount = toCount;
    themePage.state.frames = next;
    themePage.state.notes = nextNotes;
    clampSelectedFrames();
    persistThemePage();
    const wrap = document.getElementById('film-strip');
    if (wrap) wrap.innerHTML = '';
    syncRevealShapeKnobs();
    drawFilmStrip();
    drawEditorGrid();
    drawRevealPreview();
    updateCopyButtons();
}

function bindRevealShapeKnobs() {
    const grid = document.getElementById('reveal-grid-size');
    const frames = document.getElementById('reveal-frame-count');
    if (grid) {
        grid.addEventListener('input', function () {
            if (themePage.fillingShape) return;
            applyRevealShape(Number(grid.value), currentFrameCount());
        });
    }
    if (frames) {
        frames.addEventListener('input', function () {
            if (themePage.fillingShape) return;
            applyRevealShape(currentGridSize(), Number(frames.value));
        });
    }
}

function renderThemeCards() {
    const grid = document.getElementById('theme-preset-grid');
    if (!grid || typeof window.themes === 'undefined') return;
    const active = currentThemeName();
    grid.innerHTML = '';
    window.THEME_PRESET_ORDER.forEach(function (name) {
        const css = (typeof resolveThemeCss === 'function') ? resolveThemeCss(name) : (window.themes[name] || {});
        const preset = window.themes[name];
        if (!preset && !css) return;
        const card = document.createElement('button');
        card.type = 'button';
        const saved = (typeof themeHasSavedLook === 'function') && themeHasSavedLook(name);
        card.className = 'theme-preset-card'
            + (name === active ? ' is-active' : '')
            + (saved ? ' has-saved' : '');
        card.setAttribute('data-theme', name);
        card.setAttribute('aria-pressed', name === active ? 'true' : 'false');
        if (saved) card.title = 'Saved look on this thumbnail';
        const bg = css['--background-color'] || preset['--background-color'];
        const fg = css['--primary-color'] || preset['--primary-color'];
        const bd = css['--border-color'] || preset['--border-color'];
        const glow = css['--primary-shadow'] || preset['--primary-shadow'];
        // D-033: each card is a leftover-card thumbnail, not a giant mock below Tune.
        card.innerHTML =
            '<span class="theme-preset-saved" aria-hidden="true"></span>' +
            '<div class="theme-preset-swatch" style="background:' + bg + ';color:' + fg + ';border-color:' + bd + ';box-shadow:0 0 8px ' + glow + '">' +
            '<span class="theme-preset-mini-name">Run</span>' +
            '<span class="theme-preset-mini-plus">+</span>' +
            '</div>' +
            '<div class="theme-preset-label">' + ((window.THEME_PRESET_LABELS && window.THEME_PRESET_LABELS[name]) || name) + '</div>';
        card.addEventListener('click', function () {
            if (typeof changeTheme === 'function') changeTheme(name);
            updateLookStatus();
        });
        grid.appendChild(card);
    });
}

function setPreviewHint() {
    const hint = document.getElementById('preview-hint');
    if (!hint) return;
    if (themePage.state && themePage.state.mode === 'custom') {
        hint.textContent = 'This window is the leftover-card preview. Play runs your frames here.';
    } else {
        hint.textContent = 'Default geometric decoy — fills the leftover card, then shrinks toward the result. No drawing needed.';
    }
}

function setMode(mode) {
    themePage.state.mode = mode === 'custom' ? 'custom' : 'default';
    persistThemePage();
    const defBtn = document.getElementById('mode-default');
    const custBtn = document.getElementById('mode-custom');
    const custPanel = document.getElementById('custom-panel');
    if (defBtn) defBtn.classList.toggle('is-active', themePage.state.mode === 'default');
    if (custBtn) custBtn.classList.toggle('is-active', themePage.state.mode === 'custom');
    if (custPanel) custPanel.classList.toggle('is-hidden', themePage.state.mode !== 'custom');
    setPreviewHint();
    if (themePage.state.mode === 'custom') {
        stopDefaultPreview();
        drawEditorGrid();
        drawFilmStrip();
        renderPalette();
        drawRevealPreview();
    } else {
        stopCustomPlayback();
        startDefaultPreview();
    }
}

function selectedFrameSet() {
    if (!(themePage.selectedFrames instanceof Set)) {
        themePage.selectedFrames = new Set([themePage.selectedFrame || 0]);
    }
    return themePage.selectedFrames;
}

function selectFilmFrame(idx, event) {
    const n = currentFrameCount();
    idx = Math.max(0, Math.min(n - 1, idx));
    if (event && event.shiftKey) {
        const anchor = Number.isFinite(themePage.frameAnchor) ? themePage.frameAnchor : themePage.selectedFrame;
        const a = Math.min(anchor, idx);
        const b = Math.max(anchor, idx);
        const next = new Set();
        for (let i = a; i <= b; i++) next.add(i);
        themePage.selectedFrames = next;
    } else {
        themePage.selectedFrames = new Set([idx]);
        themePage.frameAnchor = idx;
    }
    themePage.selectedFrame = idx;
    drawFilmStrip();
    drawEditorGrid();
    if (!themePage.customPlaying) drawRevealPreview();
    updateCopyButtons();
}

function reorderFrames(from, to) {
    const n = currentFrameCount();
    if (!Number.isFinite(from) || !Number.isFinite(to) || from === to) return;
    if (from < 0 || to < 0 || from >= n || to >= n) return;
    const frames = themePage.state.frames;
    const moved = frames.splice(from, 1)[0];
    frames.splice(to, 0, moved);
    if (!Array.isArray(themePage.state.notes)) themePage.state.notes = [];
    const notes = themePage.state.notes;
    while (notes.length < frames.length) {
        notes.push(typeof defaultRevealNoteIndex === 'function'
            ? defaultRevealNoteIndex(notes.length)
            : notes.length % 11);
    }
    const movedNote = notes.splice(from, 1)[0];
    notes.splice(to, 0, movedNote);
    // D-031: the dropped slot becomes the edited frame (numbers 1–N stay in order)
    themePage.selectedFrame = to;
    themePage.selectedFrames = new Set([to]);
    themePage.frameAnchor = to;
    persistThemePage();
    const wrap = document.getElementById('film-strip');
    if (wrap) wrap.innerHTML = '';
    drawFilmStrip();
    drawEditorGrid();
    if (!themePage.customPlaying) drawRevealPreview();
    updateCopyButtons();
}

function bindFilmStrip() {
    const wrap = document.getElementById('film-strip');
    if (!wrap || wrap.getAttribute('data-bound') === '1') return;
    wrap.setAttribute('data-bound', '1');
    wrap.addEventListener('click', function (event) {
        if (themePage.frameDragged) {
            themePage.frameDragged = false;
            event.preventDefault();
            return;
        }
        const noteBtn = event.target.closest('.film-note');
        if (noteBtn && wrap.contains(noteBtn)) {
            event.preventDefault();
            cycleFrameNote(Number(noteBtn.getAttribute('data-frame')));
            return;
        }
        const slot = event.target.closest('.film-slot') || event.target.closest('.film-frame');
        if (!slot) return;
        selectFilmFrame(Number(slot.getAttribute('data-frame')), event);
    });
    wrap.addEventListener('pointerdown', function (event) {
        if (event.target.closest('.film-note')) return;
        const slot = event.target.closest('.film-slot') || event.target.closest('.film-frame');
        if (!slot || event.button) return;
        themePage.dragFrom = Number(slot.getAttribute('data-frame'));
        themePage.dragStartX = event.clientX;
        themePage.dragStartY = event.clientY;
        themePage.draggingFrame = false;
    });
    window.addEventListener('pointermove', function (event) {
        if (themePage.dragFrom == null) return;
        const dx = event.clientX - themePage.dragStartX;
        const dy = event.clientY - themePage.dragStartY;
        if (!themePage.draggingFrame && (dx * dx + dy * dy) > 64) {
            themePage.draggingFrame = true;
            wrap.classList.add('is-reordering');
        }
        if (!themePage.draggingFrame) return;
        wrap.querySelectorAll('.is-drop-target').forEach(function (el) {
            el.classList.remove('is-drop-target');
        });
        const el = document.elementFromPoint(event.clientX, event.clientY);
        const over = el && el.closest
            ? (el.closest('.film-slot') || el.closest('.film-frame'))
            : null;
        if (over && wrap.contains(over)) over.classList.add('is-drop-target');
    });
    window.addEventListener('pointerup', function () {
        if (themePage.dragFrom == null) return;
        const from = themePage.dragFrom;
        themePage.dragFrom = null;
        wrap.classList.remove('is-reordering');
        const over = wrap.querySelector('.is-drop-target');
        wrap.querySelectorAll('.is-drop-target').forEach(function (el) {
            el.classList.remove('is-drop-target');
        });
        if (themePage.draggingFrame) {
            themePage.frameDragged = true;
            themePage.draggingFrame = false;
            if (over) reorderFrames(from, Number(over.getAttribute('data-frame')));
        }
    });
}

function cycleFinalNote() {
    if (!themePage.state) return;
    const scaleN = (window.REVEAL && window.REVEAL.FRAME_SCALE_NAMES && window.REVEAL.FRAME_SCALE_NAMES.length)
        || (window.REVEAL && window.REVEAL.FRAME_SCALE_HZ && window.REVEAL.FRAME_SCALE_HZ.length)
        || 22;
    const cur = (typeof revealFinalNoteIndex === 'function')
        ? revealFinalNoteIndex(themePage.state)
        : (scaleN - 2);
    themePage.state.finalNote = (cur + 1) % scaleN;
    persistThemePage();
    drawFinalNote();
    if (typeof playRevealFinalSound === 'function') {
        playRevealFinalSound(themePage.state);
    }
}

function drawFinalNote() {
    const btn = document.getElementById('final-note');
    if (!btn) return;
    const degree = (typeof revealFinalNoteIndex === 'function')
        ? revealFinalNoteIndex(themePage.state)
        : 15;
    const name = (typeof revealNoteName === 'function') ? revealNoteName(degree) : 'C2';
    const muted = (typeof revealNoteIsMute === 'function') && revealNoteIsMute(degree);
    btn.textContent = name;
    btn.classList.toggle('is-mute', !!muted);
    const spoken = muted ? 'Land muted' : ('Land ' + name);
    btn.setAttribute('aria-label', spoken + ' — click to change');
    btn.title = spoken + ' (click to change)';
}

function cycleFrameNote(idx) {
    const n = currentFrameCount();
    if (!Number.isFinite(idx) || idx < 0 || idx >= n) return;
    if (!Array.isArray(themePage.state.notes)) themePage.state.notes = [];
    const scaleN = (window.REVEAL && window.REVEAL.FRAME_SCALE_NAMES && window.REVEAL.FRAME_SCALE_NAMES.length)
        || (window.REVEAL && window.REVEAL.FRAME_SCALE_HZ && window.REVEAL.FRAME_SCALE_HZ.length)
        || 22;
    const cur = (typeof revealFrameNoteIndex === 'function')
        ? revealFrameNoteIndex(themePage.state, idx)
        : (idx % scaleN);
    themePage.state.notes[idx] = (cur + 1) % scaleN;
    themePage.selectedFrame = idx;
    themePage.selectedFrames = new Set([idx]);
    themePage.frameAnchor = idx;
    persistThemePage();
    drawFilmStrip();
    drawEditorGrid();
    if (!themePage.customPlaying) drawRevealPreview();
    if (typeof playRevealFrameSound === 'function') {
        playRevealFrameSound(idx, n, themePage.state);
    }
}

function drawFilmStrip() {
    const wrap = document.getElementById('film-strip');
    if (!wrap) return;
    const selected = selectedFrameSet();
    const n = currentFrameCount();
    const needsRebuild = wrap.childElementCount !== n
        || (n > 0 && wrap.firstElementChild && !wrap.firstElementChild.classList.contains('film-slot'));
    if (needsRebuild) {
        wrap.innerHTML = '';
        for (let i = 0; i < n; i++) {
            const slot = document.createElement('div');
            slot.className = 'film-slot';
            slot.setAttribute('data-frame', String(i));
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'film-frame';
            btn.setAttribute('data-frame', String(i));
            const cv = document.createElement('canvas');
            cv.width = 46;
            cv.height = 46;
            btn.appendChild(cv);
            const lab = document.createElement('span');
            lab.className = 'film-num';
            lab.textContent = String(i + 1);
            btn.appendChild(lab);
            slot.appendChild(btn);
            const note = document.createElement('button');
            note.type = 'button';
            note.className = 'film-note';
            note.setAttribute('data-frame', String(i));
            slot.appendChild(note);
            wrap.appendChild(slot);
        }
    }
    wrap.querySelectorAll('.film-slot').forEach(function (slot, i) {
        slot.setAttribute('data-frame', String(i));
        const btn = slot.querySelector('.film-frame');
        if (btn) btn.setAttribute('data-frame', String(i));
        const lab = slot.querySelector('.film-num');
        if (lab) lab.textContent = String(i + 1);
        if (btn) {
            btn.classList.toggle('is-selected', selected.has(i));
            btn.classList.toggle('is-editing', i === themePage.selectedFrame);
            btn.classList.toggle('is-playhead', themePage.customPlaying && i === themePage.customPlayhead);
        }
        const cv = slot.querySelector('canvas');
        const ctx = cv && cv.getContext('2d');
        if (ctx) paintFrameGrid(ctx, themePage.state.frames[i], framePaintOpts());
        const note = slot.querySelector('.film-note');
        if (note) {
            note.setAttribute('data-frame', String(i));
            const degree = (typeof revealFrameNoteIndex === 'function')
                ? revealFrameNoteIndex(themePage.state, i)
                : (i % 21);
            const name = (typeof revealNoteName === 'function')
                ? revealNoteName(degree)
                : String(degree);
            note.textContent = name;
            const muted = (typeof revealNoteIsMute === 'function')
                ? revealNoteIsMute(degree)
                : (name === 'mute');
            note.classList.toggle('is-mute', muted);
            const spoken = muted ? 'Muted' : ('Tone ' + name);
            note.setAttribute('aria-label', spoken + ' — click to change');
            note.title = spoken + ' (click to change)';
        }
    });
}

function drawEditorGrid() {
    const cv = document.getElementById('draw-grid');
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const colors = paintColors();
    const size = currentGridSize();
    const frame = themePage.state.frames[themePage.selectedFrame];
    paintFrameGrid(ctx, frame, framePaintOpts());
    // Cell grid lines so the drawing is drawable, not a muddy block
    const m = (typeof revealSquareGridMetrics === 'function')
        ? revealSquareGridMetrics(cv.width, cv.height, size)
        : { cell: cv.width / size, ox: 0, oy: 0, grid: cv.width };
    ctx.strokeStyle = colors.primary;
    ctx.globalAlpha = 0.22;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < size; i++) {
        const x = m.ox + i * m.cell + 0.5;
        const y = m.oy + i * m.cell + 0.5;
        ctx.moveTo(x, m.oy);
        ctx.lineTo(x, m.oy + m.grid);
        ctx.moveTo(m.ox, y);
        ctx.lineTo(m.ox + m.grid, y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
}

/** One leftover-card canvas for both modes (D-027) — default decoy loop, or the custom frames. */
function drawRevealPreview() {
    const cv = document.getElementById('reveal-preview');
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const colors = paintColors();
    if (themePage.state && themePage.state.mode === 'custom') {
        const idx = themePage.customPlaying ? themePage.customPlayhead : themePage.selectedFrame;
        paintFrameGrid(ctx, themePage.state.frames[idx], framePaintOpts());
        return;
    }
    const decoy = getRevealDecoyFrame(themePage.state, themePage.defaultTick);
    const size = currentGridSize();
    paintRevealGrid(ctx, {
        size: size,
        decoy: decoy,
        target: decoy,
        ranks: ranksTowardTarget(decoy, size),
        resolvePct: 0,
        primary: colors.primary,
        background: colors.background
    });
}

function cellFromPointer(canvas, event) {
    const size = currentGridSize();
    const rect = canvas.getBoundingClientRect();
    const m = (typeof revealSquareGridMetrics === 'function')
        ? revealSquareGridMetrics(rect.width, rect.height, size)
        : { cell: rect.width / size, ox: 0, oy: 0, grid: rect.width };
    const x = event.clientX - rect.left - m.ox;
    const y = event.clientY - rect.top - m.oy;
    if (x < 0 || y < 0 || x >= m.grid || y >= m.grid) return -1;
    const cx = Math.max(0, Math.min(size - 1, Math.floor(x / m.cell)));
    const cy = Math.max(0, Math.min(size - 1, Math.floor(y / m.cell)));
    return cy * size + cx;
}

function drawingUsesEraser(shiftKey) {
    // D-031: Shift flips the parked tool — eraser draws, pen erases
    if (themePage.tool === 'eraser') return !shiftKey;
    return !!shiftKey;
}

function paintAtEvent(point, modifierEvent) {
    const cv = document.getElementById('draw-grid');
    if (!cv) return;
    const idx = cellFromPointer(cv, point);
    if (idx < 0) return;
    const frame = themePage.state.frames[themePage.selectedFrame];
    const erase = drawingUsesEraser(modifierEvent && modifierEvent.shiftKey);
    const next = erase ? 0 : themePage.paintColor;
    if (frame[idx] === next) return;
    frame[idx] = next;
    persistThemePage();
    drawEditorGrid();
    drawFilmStrip();
    if (!themePage.customPlaying) drawRevealPreview();
}

function paletteValue(spec) {
    if (!spec || spec.id === 'theme') return window.REVEAL.PIXEL_THEME;
    return spec.hex;
}

function renderPalette() {
    const wrap = document.getElementById('pixel-palette');
    if (!wrap || !window.REVEAL || !window.REVEAL.PIXEL_PALETTE) return;
    const colors = paintColors();
    wrap.innerHTML = '';
    window.REVEAL.PIXEL_PALETTE.forEach(function (spec) {
        const value = paletteValue(spec);
        const isTheme = spec.id === 'theme';
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pixel-swatch';
        if (isTheme) btn.classList.add('pixel-swatch-theme');
        btn.classList.toggle('is-active', themePage.paintColor === value);
        btn.title = spec.label;
        btn.setAttribute('aria-label', spec.label);
        btn.style.background = isTheme ? colors.primary : spec.hex;
        btn.addEventListener('click', function () {
            themePage.paintColor = value;
            themePage.tool = 'pen';
            const pen = document.getElementById('tool-pen');
            const eraser = document.getElementById('tool-eraser');
            if (pen) pen.classList.add('is-active');
            if (eraser) eraser.classList.remove('is-active');
            renderPalette();
        });
        wrap.appendChild(btn);
    });
}

function startDefaultPreview() {
    stopDefaultPreview();
    const cv = document.getElementById('reveal-preview');
    if (!cv) return;
    const tick = function () {
        themePage.defaultTick += 1;
        drawRevealPreview();
    };
    tick();
    themePage.defaultTimer = setInterval(tick, window.REVEAL.FRAME_MS);
}

function stopDefaultPreview() {
    if (themePage.defaultTimer) {
        clearInterval(themePage.defaultTimer);
        themePage.defaultTimer = null;
    }
}

function startCustomPlayback() {
    if (themePage.customPlaying) {
        stopCustomPlayback();
        return;
    }
    themePage.customPlaying = true;
    themePage.customPlayhead = 0;
    const btn = document.getElementById('play-custom');
    if (btn) btn.textContent = 'Pause';
    const ping = function (idx) {
        if (typeof playRevealFrameSound === 'function') {
            playRevealFrameSound(idx, currentFrameCount(), themePage.state);
        }
    };
    ping(0);
    themePage.customTimer = setInterval(function () {
        themePage.customPlayhead = (themePage.customPlayhead + 1) % currentFrameCount();
        ping(themePage.customPlayhead);
        drawRevealPreview();
        drawFilmStrip();
    }, window.REVEAL.FRAME_MS);
    drawRevealPreview();
    drawFilmStrip();
}

function stopCustomPlayback() {
    themePage.customPlaying = false;
    if (themePage.customTimer) {
        clearInterval(themePage.customTimer);
        themePage.customTimer = null;
    }
    const btn = document.getElementById('play-custom');
    if (btn) btn.textContent = 'Play';
    drawFilmStrip();
    drawRevealPreview();
}

function updateCopyButtons() {
    const last = currentFrameCount() - 1;
    const nextBtn = document.getElementById('copy-next');
    const prevBtn = document.getElementById('copy-prev');
    if (nextBtn) {
        nextBtn.classList.toggle('is-disabled', themePage.selectedFrame >= last);
        nextBtn.disabled = themePage.selectedFrame >= last;
    }
    if (prevBtn) {
        prevBtn.classList.toggle('is-disabled', themePage.selectedFrame <= 0);
        prevBtn.disabled = themePage.selectedFrame <= 0;
    }
}

function copyFrameToNext() {
    const last = currentFrameCount() - 1;
    if (themePage.selectedFrame >= last) return;
    const src = themePage.state.frames[themePage.selectedFrame];
    themePage.state.frames[themePage.selectedFrame + 1] = src.slice();
    themePage.selectedFrame += 1;
    themePage.selectedFrames = new Set([themePage.selectedFrame]);
    themePage.frameAnchor = themePage.selectedFrame;
    persistThemePage();
    drawEditorGrid();
    drawFilmStrip();
    drawRevealPreview();
    updateCopyButtons();
}

function fillThemeKnobs() {
    if (typeof getThemeKnobs !== 'function') return;
    const name = currentThemeName();
    const knobs = getThemeKnobs(name);
    const labels = window.THEME_PRESET_LABELS || {};
    const heading = document.getElementById('knob-heading');
    if (heading) heading.textContent = 'Tune ' + (labels[name] || name);
    themePage.fillingKnobs = true;
    const strokeWidth = document.getElementById('knob-stroke-width');
    const glow = document.getElementById('knob-glow');
    const font = document.getElementById('knob-font');
    const fontStyle = document.getElementById('knob-font-style');
    const fontSize = document.getElementById('knob-font-size');
    updateColorChips();
    renderSwatchGroups();
    renderSwatchGrid();
    if (strokeWidth) {
        strokeWidth.value = String(knobs.strokeWidth);
        const val = document.getElementById('knob-stroke-width-val');
        if (val) val.textContent = knobs.strokeWidth + 'px';
    }
    if (glow) {
        glow.value = String(Math.round(knobs.glow * 100));
        const val = document.getElementById('knob-glow-val');
        if (val) val.textContent = Math.round(knobs.glow * 100) + '%';
    }
    if (font) {
        if (!font.options.length && window.THEME_FONTS) {
            window.THEME_FONTS.forEach(function (spec) {
                const opt = document.createElement('option');
                opt.value = spec.id;
                opt.textContent = spec.label;
                font.appendChild(opt);
            });
        }
        font.value = knobs.font;
    }
    if (fontStyle) {
        if (!fontStyle.options.length && window.THEME_FONT_STYLES) {
            window.THEME_FONT_STYLES.forEach(function (spec) {
                const opt = document.createElement('option');
                opt.value = spec.id;
                opt.textContent = spec.label;
                fontStyle.appendChild(opt);
            });
        }
        fontStyle.value = knobs.fontStyle;
    }
    if (fontSize) {
        fontSize.value = String(knobs.fontSize);
        const val = document.getElementById('knob-font-size-val');
        if (val) val.textContent = knobs.fontSize + 'px';
    }
    themePage.fillingKnobs = false;
}

function applyKnobPatch(patch) {
    if (themePage.fillingKnobs) return;
    if (typeof setThemeKnobs !== 'function' || typeof changeTheme !== 'function') return;
    setThemeKnobs(currentThemeName(), patch);
    changeTheme(currentThemeName());
}

function colorForSlot(slot) {
    if (typeof getThemeKnobs !== 'function') return '#ffffff';
    const knobs = getThemeKnobs(currentThemeName());
    if (slot === 'background') return knobs.background;
    if (slot === 'stroke') return knobs.stroke;
    return knobs.primary;
}

function groupIdForHex(hex) {
    const n = String(hex || '').toLowerCase();
    const groups = window.THEME_SWATCH_GROUPS || [];
    for (let i = 0; i < groups.length; i++) {
        const hit = groups[i].swatches.some(function (s) { return s.hex === n; });
        if (hit) return groups[i].id;
    }
    return null;
}

function currentSwatchGroup() {
    const groups = window.THEME_SWATCH_GROUPS || [];
    for (let i = 0; i < groups.length; i++) {
        if (groups[i].id === themePage.swatchGroup) return groups[i];
    }
    return groups[0] || { id: 'primary', label: 'Primary', swatches: [] };
}

function updateColorChips() {
    const slots = ['primary', 'background', 'stroke'];
    slots.forEach(function (slot) {
        const chip = document.getElementById('chip-' + slot);
        const face = document.getElementById('chip-' + slot + '-face');
        const hex = colorForSlot(slot);
        if (chip) {
            chip.classList.toggle('is-active', themePage.colorSlot === slot);
            chip.setAttribute('aria-pressed', themePage.colorSlot === slot ? 'true' : 'false');
        }
        if (face) face.style.backgroundColor = hex;
    });
}

function renderSwatchGroups() {
    const wrap = document.getElementById('theme-swatch-groups');
    if (!wrap || !window.THEME_SWATCH_GROUPS) return;
    if (!wrap.childElementCount) {
        window.THEME_SWATCH_GROUPS.forEach(function (group) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'theme-chrome-btn';
            btn.setAttribute('data-group', group.id);
            btn.setAttribute('role', 'tab');
            btn.textContent = group.label;
            btn.addEventListener('click', function () {
                themePage.swatchGroup = group.id;
                renderSwatchGroups();
                renderSwatchGrid();
            });
            wrap.appendChild(btn);
        });
    }
    wrap.querySelectorAll('[data-group]').forEach(function (btn) {
        const on = btn.getAttribute('data-group') === themePage.swatchGroup;
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
}

function renderSwatchGrid() {
    const grid = document.getElementById('theme-swatch-grid');
    if (!grid) return;
    const group = currentSwatchGroup();
    const selected = colorForSlot(themePage.colorSlot).toLowerCase();
    grid.innerHTML = '';
    group.swatches.forEach(function (swatch) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'theme-web-swatch' + (swatch.hex === selected ? ' is-selected' : '');
        btn.style.backgroundColor = swatch.hex;
        btn.title = swatch.label;
        btn.setAttribute('aria-label', swatch.label);
        btn.setAttribute('role', 'option');
        btn.setAttribute('aria-selected', swatch.hex === selected ? 'true' : 'false');
        btn.addEventListener('click', function () {
            const patch = {};
            patch[themePage.colorSlot] = swatch.hex;
            applyKnobPatch(patch);
        });
        grid.appendChild(btn);
    });
}

function setColorSlot(slot) {
    themePage.colorSlot = slot;
    const gid = groupIdForHex(colorForSlot(slot));
    if (gid) themePage.swatchGroup = gid;
    updateColorChips();
    renderSwatchGroups();
    renderSwatchGrid();
}

function bindThemeKnobs() {
    const strokeWidth = document.getElementById('knob-stroke-width');
    const glow = document.getElementById('knob-glow');
    const font = document.getElementById('knob-font');
    const fontStyle = document.getElementById('knob-font-style');
    const fontSize = document.getElementById('knob-font-size');
    const reset = document.getElementById('knob-reset');
    const save = document.getElementById('knob-save');
    const apply = document.getElementById('knob-apply');
    document.querySelectorAll('.theme-color-chip').forEach(function (chip) {
        chip.addEventListener('click', function () {
            setColorSlot(chip.getAttribute('data-slot') || 'primary');
        });
    });
    if (strokeWidth) {
        strokeWidth.addEventListener('input', function () {
            const n = Number(strokeWidth.value) || 1;
            const val = document.getElementById('knob-stroke-width-val');
            if (val) val.textContent = n + 'px';
            applyKnobPatch({ strokeWidth: n });
        });
    }
    if (glow) {
        glow.addEventListener('input', function () {
            const n = Number(glow.value) || 0;
            const val = document.getElementById('knob-glow-val');
            if (val) val.textContent = Math.round(n) + '%';
            applyKnobPatch({ glow: n / 100 });
        });
    }
    if (font) font.addEventListener('change', function () { applyKnobPatch({ font: font.value }); });
    if (fontStyle) fontStyle.addEventListener('change', function () { applyKnobPatch({ fontStyle: fontStyle.value }); });
    if (fontSize) {
        fontSize.addEventListener('input', function () {
            const n = Number(fontSize.value) || 18;
            const val = document.getElementById('knob-font-size-val');
            if (val) val.textContent = n + 'px';
            applyKnobPatch({ fontSize: n });
        });
    }
    if (save) save.addEventListener('click', saveCurrentLook);
    if (apply) apply.addEventListener('click', applyLookToActivity);
    if (reset) {
        reset.addEventListener('click', function () {
            const name = currentThemeName();
            if (typeof resetThemeKnobs === 'function') resetThemeKnobs(name);
            if (typeof changeTheme === 'function') changeTheme(name);
            const label = (window.THEME_PRESET_LABELS && window.THEME_PRESET_LABELS[name]) || name;
            renderThemeCards();
            setLookStatus(label + ' is factory again.');
        });
    }
}

function bindDrawGrid() {
    const cv = document.getElementById('draw-grid');
    if (!cv) return;
    const down = function (event) {
        event.preventDefault();
        themePage.painting = true;
        const point = event.touches ? event.touches[0] : event;
        paintAtEvent(point, event);
    };
    const move = function (event) {
        if (!themePage.painting) return;
        event.preventDefault();
        const point = event.touches ? event.touches[0] : event;
        paintAtEvent(point, event);
    };
    const up = function () { themePage.painting = false; };
    cv.addEventListener('mousedown', down);
    cv.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    cv.addEventListener('touchstart', down, { passive: false });
    cv.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', up);
}

function initThemePage() {
    themePage.state = loadRevealAnimation();
    themePage.paintColor = window.REVEAL.PIXEL_THEME;
    themePage.selectedFrame = Math.min(themePage.selectedFrame || 0, Math.max(0, currentFrameCount() - 1));
    themePage.selectedFrames = new Set([themePage.selectedFrame]);
    themePage.frameAnchor = themePage.selectedFrame;

    document.getElementById('back-to-editor').addEventListener('click', function () {
        window.location.href = 'editor.html';
    });

    renderThemeCards();
    window.addEventListener('themeChanged', function () {
        renderThemeCards();
        fillThemeKnobs();
        updateLookStatus();
        renderPalette();
        drawEditorGrid();
        drawFilmStrip();
        drawRevealPreview();
    });

    document.getElementById('mode-default').addEventListener('click', function () { setMode('default'); });
    document.getElementById('mode-custom').addEventListener('click', function () { setMode('custom'); });

    document.getElementById('tool-pen').addEventListener('click', function () {
        themePage.tool = 'pen';
        this.classList.add('is-active');
        document.getElementById('tool-eraser').classList.remove('is-active');
    });
    document.getElementById('tool-eraser').addEventListener('click', function () {
        themePage.tool = 'eraser';
        this.classList.add('is-active');
        document.getElementById('tool-pen').classList.remove('is-active');
    });
    document.getElementById('clear-frame').addEventListener('click', function () {
        const size = currentGridSize();
        selectedFrameSet().forEach(function (i) {
            themePage.state.frames[i] = revealEmptyFrame(size);
        });
        persistThemePage();
        drawEditorGrid();
        drawFilmStrip();
        drawRevealPreview();
    });
    const resetAll = document.getElementById('reset-all-frames');
    if (resetAll) {
        resetAll.addEventListener('click', function () {
            themePage.state.frames = revealEmptyFrames(currentFrameCount(), currentGridSize());
            themePage.state.notes = [];
            themePage.state.gridSize = currentGridSize();
            themePage.state.frameCount = currentFrameCount();
            persistThemePage();
            drawEditorGrid();
            drawFilmStrip();
            drawRevealPreview();
        });
    }
    document.getElementById('copy-prev').addEventListener('click', function () {
        if (themePage.selectedFrame <= 0) return;
        themePage.state.frames[themePage.selectedFrame] =
            themePage.state.frames[themePage.selectedFrame - 1].slice();
        themePage.selectedFrames = new Set([themePage.selectedFrame]);
        themePage.frameAnchor = themePage.selectedFrame;
        persistThemePage();
        drawEditorGrid();
        drawFilmStrip();
        drawRevealPreview();
        updateCopyButtons();
    });
    const copyNext = document.getElementById('copy-next');
    if (copyNext) copyNext.addEventListener('click', copyFrameToNext);
    document.getElementById('play-custom').addEventListener('click', startCustomPlayback);
    const land = document.getElementById('final-note');
    if (land) land.addEventListener('click', cycleFinalNote);
    bindFilmStrip();
    bindDrawGrid();
    bindThemeKnobs();
    bindRevealShapeKnobs();
    fillThemeKnobs();
    syncRevealShapeKnobs();
    renderPalette();

    function applyRevealStateToPage() {
        themePage.selectedFrame = 0;
        themePage.selectedFrames = new Set([0]);
        themePage.frameAnchor = 0;
        const wrap = document.getElementById('film-strip');
        if (wrap) wrap.innerHTML = '';
        syncRevealShapeKnobs();
        setMode(themePage.state.mode);
        drawEditorGrid();
        drawFilmStrip();
        drawRevealPreview();
        updateCopyButtons();
    }

    document.getElementById('download-anim').addEventListener('click', function () {
        downloadRevealAnimation(themePage.state);
    });
    const restoreDefaults = document.getElementById('restore-anim-defaults');
    if (restoreDefaults) {
        restoreDefaults.addEventListener('click', function () {
            // Factory geometric film: 6×6, 2 frames, default notes, Default Pattern (D-032, D-055).
            // Reset All only empties custom frames; this is the full factory recall.
            const factory = (typeof window.revealDefaultState === 'function')
                ? window.revealDefaultState()
                : { mode: 'default', gridSize: 6, frameCount: 2, frames: [], notes: [] };
            factory.mode = 'default';
            themePage.state = factory;
            persistThemePage();
            applyRevealStateToPage();
            setMode('default');
        });
    }
    document.getElementById('load-anim').addEventListener('click', function () {
        document.getElementById('load-anim-file').click();
    });
    document.getElementById('load-anim-file').addEventListener('change', function (event) {
        const file = event.target.files && event.target.files[0];
        event.target.value = '';
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function () {
            try {
                themePage.state = saveRevealAnimation(parseRevealAnimationFile(String(reader.result || '')));
                if (typeof stampRevealOnCurrentActivity === 'function') {
                    stampRevealOnCurrentActivity(themePage.state);
                }
                applyRevealStateToPage();
            } catch (err) {
                alert(err.message || 'Could not load that animation file.');
            }
        };
        reader.readAsText(file);
    });

    setMode(themePage.state.mode);
    drawFilmStrip();
    drawEditorGrid();
    updateCopyButtons();
    updateLookStatus();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThemePage);
} else {
    initThemePage();
}
