// Reveal animation — shared by theme.html (editor) and sketch.html (students).
// D-025: fill-then-resolve + persist. D-032: teacher-chosen grid/frames; factory default 6×6 / 2.

const REVEAL = {
    // D-032: factory default when nothing is saved. Live size lives on the saved state.
    GRID_SIZE: 6,
    FRAME_COUNT: 2,
    GRID_SIZE_MIN: 6,
    GRID_SIZE_MAX: 20,
    FRAME_COUNT_MIN: 2,
    FRAME_COUNT_MAX: 12,
    STORAGE_KEY: 'revealAnimation',
    FILE_KIND: 'rando-reveal-animation',
    FILE_VERSION: 6,
    // D-049: 2 = C-1…C3 scale. Missing scaleRev on a v6 file may still need a land-note repair.
    SCALE_REV: 2,
    SAMPLE_WORD: 'BIKE',
    // D-027: 1 = theme ink (follows --primary-color). Hex strings are extra palette paints.
    PIXEL_THEME: 1,
    PIXEL_PALETTE: [
        { id: 'theme', label: 'Theme' },
        { hex: '#ffffff', label: 'White' },
        { hex: '#00ff00', label: 'Green' },
        { hex: '#ff8800', label: 'Orange' },
        { hex: '#55aaff', label: 'Blue' },
        { hex: '#cc66ff', label: 'Purple' },
        { hex: '#ff66aa', label: 'Pink' },
        { hex: '#ffff00', label: 'Yellow' },
        { hex: '#ff3333', label: 'Red' },
        { hex: '#000000', label: 'Black' }
    ],
    // Geometric decoy fill (~25% of cells). Cluster counts scale with grid size — see decoyParamsForSize().
    DECOY_FILL: 0.25,
    FLICKER_FRACTION: 0.08,
    // Mix distance-to-shape with shuffle so the blob shrinks toward the result
    // without a perfect diamond wipe
    DISTANCE_JITTER: 0.4,
    // Sound / resolve clock — same 50ms family as TIMING.SCRAMBLE_SPEED
    SCRAMBLE_CYCLES: 10,
    CONVERGE_TICKS: 8,
    TICK_MS: 50,
    // D-035: film playhead (Customize Play and sketch). Notes follow this clock (D-040).
    FRAME_MS: 120,
    // D-037: 0 = film then lift (two acts). 1 = holes as soon as one loop has played.
    // Remaining tiles keep playing the film; paper under each leftover cell hides the word.
    OVERLAP: 0.55,
    // D-049: pentatonic C–D–E–G–A from C-1 (one octave below C) to C3. Mute last (0 Hz).
    // Names are relative to middle C, not scientific pitch (C1 here is an octave up, not C1 ~32 Hz).
    FRAME_SCALE_HZ: [
        130.81, 146.83, 164.81, 196.00, 220.00,
        261.63, 293.66, 329.63, 392.00, 440.00,
        523.25, 587.33, 659.25, 783.99, 880.00,
        1046.50, 1174.66, 1318.51, 1567.98, 1760.00,
        2093.00, 0
    ],
    FRAME_SCALE_NAMES: [
        'C-1', 'D-1', 'E-1', 'G-1', 'A-1',
        'C', 'D', 'E', 'G', 'A',
        'C1', 'D1', 'E1', 'G1', 'A1',
        'C2', 'D2', 'E2', 'G2', 'A2',
        'C3', 'mute'
    ],
    // v5 and earlier: 0–10 = C…C2, 11 = mute. Prepending five low notes shifts those by this count.
    SCALE_LOW_COUNT: 5,
    SCALE_LEGACY_MUTE: 11,
    FRAME_NOTE_MS: 85,
    FRAME_NOTE_VOL: 0.22,
    FRAME_FINAL_MS: 100,
    FRAME_FINAL_VOL: 0.28,
    // D-048: one gated low square per lift tick (shorter than TICK_MS so it stutters).
    TRANSITION_HZ: [130.81, 146.83, 164.81, 196.00],
    TRANSITION_MS: 28,
    TRANSITION_VOL: 0.2,
    // D-034 used a blank hold before the prompts. D-036 lifts paper tiles instead;
    // keep the knob so a settle can come back without inventing a name.
    HOLD_MS: 1000
};

function clampRevealGridSize(n) {
    const v = Math.round(Number(n));
    if (!Number.isFinite(v) || v <= 0) return REVEAL.GRID_SIZE;
    return Math.max(REVEAL.GRID_SIZE_MIN, Math.min(REVEAL.GRID_SIZE_MAX, v));
}

function clampRevealFrameCount(n) {
    const v = Math.round(Number(n));
    if (!Number.isFinite(v) || v <= 0) return REVEAL.FRAME_COUNT;
    return Math.max(REVEAL.FRAME_COUNT_MIN, Math.min(REVEAL.FRAME_COUNT_MAX, v));
}

/** Live grid size from a saved animation (clamped). Falls back to the factory default. */
function revealGridSize(state) {
    if (state && typeof state.gridSize === 'number' && state.gridSize > 0) {
        return clampRevealGridSize(state.gridSize);
    }
    if (state && Array.isArray(state.frames) && state.frames[0]) {
        return clampRevealGridSize(inferRevealGridSize(state.frames[0]));
    }
    return REVEAL.GRID_SIZE;
}

/** Live frame count from a saved animation (clamped). Falls back to the factory default. */
function revealFrameCount(state) {
    if (state && typeof state.frameCount === 'number' && state.frameCount > 0) {
        return clampRevealFrameCount(state.frameCount);
    }
    if (state && Array.isArray(state.frames) && state.frames.length) {
        return clampRevealFrameCount(state.frames.length);
    }
    return REVEAL.FRAME_COUNT;
}

/** How many resolve ticks to punch through n×n cells (scales with grid; D-032). */
function convergeTicksForSize(n) {
    const size = clampRevealGridSize(n);
    return Math.max(8, Math.min(40, Math.round(size * 1.2)));
}

/**
 * D-037: first tick where holes may open. Always after one full film loop so the
 * drawing reads; OVERLAP pulls that start earlier into leftover cover ticks.
 */
function revealLiftStartTick(coverTicks, frameCount, tickMs, frameMs) {
    const frames = Math.max(1, frameCount || REVEAL.FRAME_COUNT);
    const tick = tickMs || REVEAL.TICK_MS;
    const frame = frameMs || REVEAL.FRAME_MS;
    const loopTicks = Math.max(1, Math.ceil((frames * frame) / tick));
    const cover = Math.max(1, coverTicks || loopTicks);
    const frac = (typeof REVEAL.OVERLAP === 'number')
        ? Math.max(0, Math.min(1, REVEAL.OVERLAP))
        : 0.55;
    const ideal = Math.round(cover * (1 - frac));
    return Math.max(loopTicks, Math.min(cover, ideal));
}

function revealScaleLength() {
    const names = REVEAL.FRAME_SCALE_NAMES;
    const hz = REVEAL.FRAME_SCALE_HZ;
    const n = Math.max(
        (names && names.length) || 0,
        (hz && hz.length) || 0
    );
    return Math.max(1, n);
}

/** Sounding pentatonic slots only — mute is not a default (D-043). */
function revealSoundingScaleLength() {
    const scale = REVEAL.FRAME_SCALE_HZ || [];
    let n = 0;
    for (let i = 0; i < scale.length; i++) {
        if (scale[i] > 0) n += 1;
    }
    return Math.max(1, n);
}

function revealNoteIsMute(noteIndex) {
    const scale = REVEAL.FRAME_SCALE_HZ || [];
    const n = scale.length;
    if (!n) return false;
    const i = ((noteIndex % n) + n) % n;
    return !(scale[i] > 0);
}

/**
 * Default walk when a slot has no saved degree (D-040). Starts at middle C so new
 * frames are not all C-1 after D-049 prepended a lower octave.
 */
function defaultRevealNoteIndex(frameIndex) {
    const names = REVEAL.FRAME_SCALE_NAMES || [];
    const n = revealSoundingScaleLength();
    const start = Math.max(0, names.indexOf('C'));
    const i = Math.max(0, Math.round(Number(frameIndex)) || 0);
    return ((start + i) % n + n) % n;
}

/**
 * D-049: FILE_VERSION < 6 stored C…C2 then mute as 0–11. Shift those so C still
 * means C, not C-1. Already-v6 indices are left alone.
 */
function migrateRevealNoteIndex(value, fileVersion) {
    if (value == null || value === '') return value;
    const idx = Math.round(Number(value));
    if (!Number.isFinite(idx) || idx < 0) return value;
    const v = Math.round(Number(fileVersion));
    if (Number.isFinite(v) && v >= 6) return idx;
    const mute = REVEAL.SCALE_LEGACY_MUTE;
    const shift = REVEAL.SCALE_LOW_COUNT || 5;
    if (idx === mute) return Math.max(0, revealScaleLength() - 1);
    return idx + shift;
}

function clampRevealNoteIndex(value, frameIndex) {
    // Number(null) is 0, and 0 is now C-1 — missing must not become the lowest note.
    if (value == null || value === '') return defaultRevealNoteIndex(frameIndex);
    const n = revealScaleLength();
    const v = Math.round(Number(value));
    if (Number.isFinite(v) && v >= 0 && v < n) return v;
    return defaultRevealNoteIndex(frameIndex);
}

function normalizeRevealNotes(rawNotes, storedCount, fileVersion) {
    const count = Math.max(0, storedCount || 0);
    const src = Array.isArray(rawNotes) ? rawNotes : [];
    const notes = [];
    for (let i = 0; i < count; i++) {
        notes[i] = clampRevealNoteIndex(migrateRevealNoteIndex(src[i], fileVersion), i);
    }
    return notes;
}

/** D-042: scale degree for slot i. Missing notes walk the pentatonic (D-040). */
function revealFrameNoteIndex(state, frameIndex) {
    const i = Math.max(0, Math.round(Number(frameIndex)) || 0);
    if (state && Array.isArray(state.notes) && state.notes.length > i) {
        return clampRevealNoteIndex(state.notes[i], i);
    }
    return defaultRevealNoteIndex(i);
}

function revealNoteName(noteIndex) {
    const names = REVEAL.FRAME_SCALE_NAMES || ['C', 'D', 'E', 'G', 'A', 'C1', 'mute'];
    const n = names.length || revealScaleLength();
    const i = ((noteIndex % n) + n) % n;
    return names[i] || String(i + 1);
}

/** D-040: pitch for film slot i. D-042 / D-043: saved degree; 0 Hz is mute. */
function revealFrameHz(frameIndex, frameCount, state) {
    const scale = REVEAL.FRAME_SCALE_HZ || [261.63, 329.63, 392.00, 523.25];
    const n = scale.length;
    const idx = revealFrameNoteIndex(state, frameIndex);
    return scale[((idx % n) + n) % n] || 0;
}

let revealAudioCtx = null;

function getRevealAudioCtx() {
    if (!revealAudioCtx) {
        revealAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return revealAudioCtx;
}

function withRevealAudio(go) {
    try {
        const ctx = getRevealAudioCtx();
        if (ctx.state === 'suspended') {
            ctx.resume().then(function () { go(ctx); }).catch(function () { go(ctx); });
            return;
        }
        go(ctx);
    } catch (e) { /* no Web Audio — stay silent */ }
}

/**
 * D-040: one shared sine ping for Customize Play, thumbnail clicks, and RUN film notes.
 * Do not route through animation-manager playSound — that envelope is a different beep.
 * Desk start / arrows are D-051 (SOUND.START / NAV_*), not this helper.
 */
function playRevealTone(cfg) {
    if (!cfg || !(cfg.FREQUENCY > 0)) return;
    withRevealAudio(function (ctx) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = cfg.TYPE || 'sine';
        osc.frequency.value = cfg.FREQUENCY;
        const now = ctx.currentTime;
        const dur = Math.max(0.012, (cfg.DURATION || 90) / 1000);
        const vol = cfg.VOLUME != null ? cfg.VOLUME : 0.22;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
        osc.start(now);
        osc.stop(now + dur + 0.02);
    });
}

function playRevealToneFallback(cfg) {
    playRevealTone(cfg);
}

function defaultRevealFinalNoteIndex() {
    const names = REVEAL.FRAME_SCALE_NAMES || [];
    const c2 = names.indexOf('C2');
    if (c2 >= 0 && !revealNoteIsMute(c2)) return c2;
    return Math.max(0, revealSoundingScaleLength() - 1);
}

function revealFinalNoteIndex(state) {
    if (state && state.finalNote != null && state.finalNote !== '') {
        const n = Number(state.finalNote);
        if (Number.isFinite(n)) {
            return clampRevealNoteIndex(n, defaultRevealFinalNoteIndex());
        }
    }
    return defaultRevealFinalNoteIndex();
}

/**
 * D-048: one interrupted low square per paper-tile tick, walking C-1 D-1 E-1 G-1.
 * Shorter than TICK_MS so you hear the gaps. Not a noise burst (that read as a drum).
 */
let revealGlitchStep = 0;
function playRevealTransitionSound(state) {
    const lows = REVEAL.TRANSITION_HZ || [130.81, 146.83, 164.81, 196.00];
    if (!lows.length) return;
    const hz = lows[revealGlitchStep % lows.length];
    revealGlitchStep += 1;
    playRevealTone({
        FREQUENCY: hz,
        DURATION: REVEAL.TRANSITION_MS || 28,
        TYPE: 'square',
        VOLUME: REVEAL.TRANSITION_VOL != null ? REVEAL.TRANSITION_VOL : 0.2
    });
}

/** Land ping when the overlay drops (D-046). Mute is silence. */
function playRevealFinalSound(state) {
    const scale = REVEAL.FRAME_SCALE_HZ || [];
    const idx = revealFinalNoteIndex(state);
    const hz = scale[idx];
    if (!(hz > 0)) return;
    playRevealTone({
        FREQUENCY: hz,
        DURATION: REVEAL.FRAME_FINAL_MS || 100,
        TYPE: 'sine',
        VOLUME: REVEAL.FRAME_FINAL_VOL != null ? REVEAL.FRAME_FINAL_VOL : 0.28
    });
}

/** One note when the film playhead lands on a frame (D-040 / D-042). Mute is silence (D-043). */
function playRevealFrameSound(frameIndex, frameCount, state) {
    const hz = revealFrameHz(frameIndex, frameCount, state);
    if (!(hz > 0)) return;
    playRevealTone({
        FREQUENCY: hz,
        DURATION: REVEAL.FRAME_NOTE_MS || 85,
        TYPE: 'sine',
        VOLUME: REVEAL.FRAME_NOTE_VOL != null ? REVEAL.FRAME_NOTE_VOL : 0.22
    });
}

function revealEmptyFrame(size) {
    const n = size || REVEAL.GRID_SIZE;
    return new Array(n * n).fill(0);
}

function revealCellOn(cell) {
    return !!cell && cell !== 0 && cell !== '0';
}

/** On-cells: hex stays that color; 1 / 'theme' / true follow the live theme ink. */
function revealCellColor(cell, primary) {
    if (typeof cell === 'string' && cell.charAt(0) === '#') return cell;
    return primary || '#ffffff';
}

function normalizeRevealCell(value) {
    if (value == null || value === 0 || value === false || value === '0' || value === '') return 0;
    if (value === 1 || value === true || value === '1' || value === 'theme') return REVEAL.PIXEL_THEME;
    if (typeof value === 'string') {
        const hex = value.trim();
        if (/^#[0-9a-fA-F]{6}$/.test(hex)) return hex.toLowerCase();
        if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
            return ('#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3]).toLowerCase();
        }
    }
    return REVEAL.PIXEL_THEME;
}

function revealEmptyFrames(count, size) {
    const c = clampRevealFrameCount(count != null ? count : REVEAL.FRAME_COUNT);
    const s = clampRevealGridSize(size != null ? size : REVEAL.GRID_SIZE);
    const frames = [];
    for (let i = 0; i < c; i++) {
        frames.push(revealEmptyFrame(s));
    }
    return frames;
}

function revealDefaultState() {
    return {
        kind: REVEAL.FILE_KIND,
        version: REVEAL.FILE_VERSION,
        mode: 'default',
        gridSize: REVEAL.GRID_SIZE,
        frameCount: REVEAL.FRAME_COUNT,
        frames: revealEmptyFrames(REVEAL.FRAME_COUNT, REVEAL.GRID_SIZE),
        notes: normalizeRevealNotes(null, REVEAL.FRAME_COUNT),
        finalNote: defaultRevealFinalNoteIndex(),
        scaleRev: REVEAL.SCALE_REV
    };
}

function inferRevealGridSize(frame) {
    if (!Array.isArray(frame) || !frame.length) return REVEAL.GRID_SIZE;
    const n = Math.round(Math.sqrt(frame.length));
    return n > 0 ? n : REVEAL.GRID_SIZE;
}

function resampleRevealFrame(frame, fromSize, toSize) {
    if (!fromSize || fromSize === toSize) return normalizeRevealFrame(frame, toSize);
    const out = revealEmptyFrame(toSize);
    const src = Array.isArray(frame) ? frame : [];
    for (let y = 0; y < toSize; y++) {
        for (let x = 0; x < toSize; x++) {
            const sx = Math.min(fromSize - 1, Math.floor((x + 0.5) * fromSize / toSize));
            const sy = Math.min(fromSize - 1, Math.floor((y + 0.5) * fromSize / toSize));
            out[y * toSize + x] = normalizeRevealCell(src[sy * fromSize + sx]);
        }
    }
    return out;
}

function normalizeRevealFrame(frame, size) {
    const n = size * size;
    const out = revealEmptyFrame(size);
    if (!Array.isArray(frame)) return out;
    for (let i = 0; i < n && i < frame.length; i++) {
        out[i] = normalizeRevealCell(frame[i]);
    }
    return out;
}

function normalizeRevealState(raw) {
    if (!raw || typeof raw !== 'object') return revealDefaultState();
    const src = Array.isArray(raw.frames) ? raw.frames : [];
    // Source cell count for resampling: trust the first frame's length when it is a
    // square, so a stale gridSize (slider moved before frames were rewritten, or a
    // hand-edited JSON) still resamples instead of reading the wrong cells (D-032).
    const inferred = inferRevealGridSize(src[0]);
    const fromSize = (src[0] && Array.isArray(src[0]) && inferred > 0
        && src[0].length === inferred * inferred)
        ? inferred
        : ((typeof raw.gridSize === 'number' && raw.gridSize > 0) ? raw.gridSize : inferred);
    const toSize = clampRevealGridSize(
        (typeof raw.gridSize === 'number' && raw.gridSize > 0) ? raw.gridSize : fromSize
    );
    const toCount = clampRevealFrameCount(
        (typeof raw.frameCount === 'number' && raw.frameCount > 0)
            ? raw.frameCount
            : (src.length || REVEAL.FRAME_COUNT)
    );
    // D-041: keep drawings past frameCount so 12→2→12 restores frames 3–12.
    const storedCount = Math.min(
        REVEAL.FRAME_COUNT_MAX,
        Math.max(toCount, src.length)
    );
    const state = {
        kind: REVEAL.FILE_KIND,
        version: REVEAL.FILE_VERSION,
        mode: (raw.mode === 'custom' || raw.mode === 'default') ? raw.mode : 'default',
        gridSize: toSize,
        frameCount: toCount,
        frames: [],
        notes: [],
        scaleRev: REVEAL.SCALE_REV
    };
    const srcSize = fromSize > 0 ? fromSize : toSize;
    for (let i = 0; i < storedCount; i++) {
        state.frames[i] = resampleRevealFrame(src[i], srcSize, toSize);
    }
    const srcNotes = Array.isArray(raw.notes) ? raw.notes : [];
    const alreadyLongScale = srcNotes.some(function (n) { return Number(n) > 11; });
    const scaleRev = Math.round(Number(raw.scaleRev));
    const scaleDone = Number.isFinite(scaleRev) && scaleRev >= REVEAL.SCALE_REV;
    if (scaleDone) {
        state.notes = normalizeRevealNotes(srcNotes, storedCount, 6);
        state.finalNote = revealFinalNoteIndex(raw);
    } else if (alreadyLongScale) {
        // Notes already remapped; a persisted 0 here is Number(null)→C-1, not a chosen low C.
        state.notes = normalizeRevealNotes(srcNotes, storedCount, 6);
        const rawFinal = raw.finalNote;
        state.finalNote = (rawFinal === 0 || rawFinal === '0' || rawFinal == null || rawFinal === '')
            ? defaultRevealFinalNoteIndex()
            : revealFinalNoteIndex(raw);
    } else {
        state.notes = normalizeRevealNotes(srcNotes, storedCount, 5);
        state.finalNote = revealFinalNoteIndex({
            finalNote: migrateRevealNoteIndex(raw.finalNote, 5)
        });
    }
    return state;
}

function loadRevealAnimation() {
    try {
        const raw = localStorage.getItem(REVEAL.STORAGE_KEY);
        if (!raw) return revealDefaultState();
        return normalizeRevealState(JSON.parse(raw));
    } catch (e) {
        return revealDefaultState();
    }
}

function saveRevealAnimation(state) {
    const normalized = normalizeRevealState(state);
    localStorage.setItem(REVEAL.STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
}

/** Copy of the live film to stamp onto an activity (D-055). */
function cloneRevealSnapshot(state) {
    const src = state || (typeof loadRevealAnimation === 'function' ? loadRevealAnimation() : null);
    if (!src) {
        try {
            const raw = localStorage.getItem(REVEAL.STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }
    try {
        return JSON.parse(JSON.stringify(src));
    } catch (e) {
        return src;
    }
}

/**
 * D-055: write the live film onto the open activity in this browser.
 * promptSettings is Activity History; promptCategories is the working copy.
 * CSV still does not carry frames — download the JSON for another machine (D-025).
 */
function stampRevealOnCurrentActivity(state) {
    const snapshot = cloneRevealSnapshot(state);
    if (!snapshot) return false;
    try {
        const pc = JSON.parse(localStorage.getItem('promptCategories') || '{}');
        pc.revealAnimation = snapshot;
        localStorage.setItem('promptCategories', JSON.stringify(pc));
    } catch (e) { /* ignore */ }
    let activityName = (typeof getCurrentActivityName === 'function') ? getCurrentActivityName() : null;
    if (!activityName) {
        try {
            const pc = JSON.parse(localStorage.getItem('promptCategories') || '{}');
            activityName = pc && pc.activityName ? pc.activityName : null;
        } catch (e) { /* ignore */ }
    }
    if (!activityName) return false;
    try {
        const settings = JSON.parse(localStorage.getItem('promptSettings') || '{}');
        if (settings[activityName]) {
            settings[activityName].revealAnimation = snapshot;
            localStorage.setItem('promptSettings', JSON.stringify(settings));
            return true;
        }
    } catch (e) { /* ignore */ }
    return false;
}

/** Load an activity’s stamped film into the live `revealAnimation` key. Missing snapshot → leave the current film. */
function restoreActivityReveal(settings) {
    if (!settings || !settings.revealAnimation || typeof settings.revealAnimation !== 'object') return false;
    if (typeof saveRevealAnimation === 'function') {
        saveRevealAnimation(settings.revealAnimation);
        return true;
    }
    try {
        localStorage.setItem(REVEAL.STORAGE_KEY, JSON.stringify(settings.revealAnimation));
        return true;
    } catch (e) {
        return false;
    }
}

function parseRevealAnimationFile(text) {
    let parsed;
    try {
        parsed = JSON.parse(text);
    } catch (e) {
        throw new Error('That file is not valid JSON.');
    }
    if (!parsed || parsed.kind !== REVEAL.FILE_KIND) {
        throw new Error('That file is not a Rando reveal animation.');
    }
    return normalizeRevealState(parsed);
}

function downloadRevealAnimation(state) {
    const normalized = normalizeRevealState(state);
    const blob = new Blob([JSON.stringify(normalized, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rando-reveal-animation.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}

function revealHasPaint(state) {
    const frames = (state && state.frames) || [];
    // D-041: parked frames past frameCount do not count — an empty 2-frame loop
    // should not look “custom” just because frame 12 still has a doodle.
    const live = Math.min(frames.length, revealFrameCount(state));
    for (let f = 0; f < live; f++) {
        const frame = frames[f];
        if (!frame) continue;
        for (let i = 0; i < frame.length; i++) {
            if (revealCellOn(frame[i])) return true;
        }
    }
    return false;
}

/** D-058: pixel film only for Default Pattern, or Custom that actually has paint. */
function revealUsesPixelFilm(state) {
    if (state && state.mode === 'custom') return revealHasPaint(state);
    return true;
}

/** Deterministic 0–1 from an integer seed (no Math.random — decoy must be replayable). */
function revealRand(seedHolder) {
    seedHolder.s = (Math.imul(seedHolder.s, 1664525) + 1013904223) >>> 0;
    return seedHolder.s / 4294967296;
}

/** Cluster count/length so the decoy stays ~25% filled on any legal grid (D-032). */
function decoyParamsForSize(n) {
    const size = n || REVEAL.GRID_SIZE;
    const target = Math.max(4, Math.round(size * size * REVEAL.DECOY_FILL));
    const clusterSize = Math.max(2, Math.round(size / 2));
    const clusters = Math.max(2, Math.round(target / clusterSize));
    return { clusters: clusters, clusterSize: clusterSize };
}

/** Clustered geometric decoy — fills the card so scramble length/type is not readable. */
function makeGeometricFrame(size, salt) {
    const n = size || REVEAL.GRID_SIZE;
    const cells = revealEmptyFrame(n);
    const params = decoyParamsForSize(n);
    const seedHolder = { s: (salt * 1103515245 + 12345) >>> 0 };
    for (let c = 0; c < params.clusters; c++) {
        let x = Math.floor(revealRand(seedHolder) * n);
        let y = Math.floor(revealRand(seedHolder) * n);
        for (let k = 0; k < params.clusterSize; k++) {
            cells[y * n + x] = 1;
            const dir = Math.floor(revealRand(seedHolder) * 4);
            if (dir === 0) x = Math.min(n - 1, x + 1);
            else if (dir === 1) x = Math.max(0, x - 1);
            else if (dir === 2) y = Math.min(n - 1, y + 1);
            else y = Math.max(0, y - 1);
        }
    }
    return cells;
}

function flickerFrame(frame, salt, fraction) {
    if (!fraction || fraction <= 0) {
        return Array.isArray(frame) ? frame.slice() : [];
    }
    const out = frame.slice();
    const n = out.length;
    const seedHolder = { s: (salt * 2654435761) >>> 0 };
    const ons = [];
    for (let i = 0; i < n; i++) {
        if (revealCellOn(out[i])) ons.push(i);
    }
    if (!ons.length) return out;
    const flips = Math.max(1, Math.floor(n * (fraction == null ? REVEAL.FLICKER_FRACTION : fraction)));
    // Only dim existing on-cells. Flipping empty cells to theme ink read as the
    // background flashing white once the grid sat in the middle of the card (D-028).
    for (let i = 0; i < flips; i++) {
        const idx = ons[Math.floor(revealRand(seedHolder) * ons.length)];
        out[idx] = 0;
    }
    return out;
}

function getRevealDecoyFrame(state, tick, flickerSalt) {
    const size = revealGridSize(state);
    const count = revealFrameCount(state);
    const idx = ((tick % count) + count) % count;
    const useCustom = state && state.mode === 'custom' && revealHasPaint(state);
    // D-058: empty Custom stays empty — do not substitute the factory geometric film.
    const raw = useCustom
        ? (state.frames[idx] || revealEmptyFrame(size))
        : ((state && state.mode === 'custom')
            ? revealEmptyFrame(size)
            : makeGeometricFrame(size, idx * 97 + 3));
    // D-044: always the live grid so leftover cells are not empty paper (a black chunk).
    const sized = normalizeRevealFrame(raw, size);
    // Custom drawings play as painted. Geometric may shimmer until tiles lift.
    // flickerSalt === false means lift is in progress — keep leftover tiles intact.
    if (useCustom || flickerSalt === false) return sized;
    const salt = (flickerSalt != null) ? flickerSalt : tick;
    return flickerFrame(sized, salt + 91, REVEAL.FLICKER_FRACTION);
}

/** Threshold a word/phrase onto the grid so ranks can shrink toward its silhouette. */
function rasterizeRevealText(text, size) {
    const n = size || REVEAL.GRID_SIZE;
    const cells = revealEmptyFrame(n);
    if (typeof document === 'undefined') return cells;
    const cv = document.createElement('canvas');
    cv.width = n;
    cv.height = n;
    const ctx = cv.getContext('2d');
    if (!ctx) return cells;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, n, n);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const label = String(text == null ? '' : text).trim().slice(0, 24) || REVEAL.SAMPLE_WORD;
    let fontSize = Math.round(n * (label.length > 8 ? 0.28 : 0.42));
    ctx.font = 'bold ' + fontSize + 'px VT323, monospace';
    while (fontSize > 5 && ctx.measureText(label).width > n * 0.92) {
        fontSize -= 1;
        ctx.font = 'bold ' + fontSize + 'px VT323, monospace';
    }
    ctx.fillText(label, n / 2, n / 2 + 0.5);
    const img = ctx.getImageData(0, 0, n, n).data;
    for (let i = 0; i < n * n; i++) {
        cells[i] = img[i * 4] > 80 ? 1 : 0;
    }
    return cells;
}

function rasterizeRevealRect(size, xFrac, yFrac, wFrac, hFrac) {
    const n = size || REVEAL.GRID_SIZE;
    const cells = revealEmptyFrame(n);
    const x0 = Math.max(0, Math.floor(n * xFrac));
    const y0 = Math.max(0, Math.floor(n * yFrac));
    const x1 = Math.min(n, Math.ceil(n * (xFrac + wFrac)));
    const y1 = Math.min(n, Math.ceil(n * (yFrac + hFrac)));
    for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
            cells[y * n + x] = 1;
        }
    }
    return cells;
}

function rasterizeRevealTarget(finalText, size) {
    const n = size || REVEAL.GRID_SIZE;
    const text = String(finalText == null ? '' : finalText);
    if (typeof isImagePromptToken === 'function' && isImagePromptToken(text)) {
        return rasterizeRevealRect(n, 0.18, 0.22, 0.64, 0.52);
    }
    const trimmed = text.trim();
    if (!trimmed) return rasterizeRevealRect(n, 0.25, 0.35, 0.5, 0.28);
    return rasterizeRevealText(trimmed, n);
}

/** OR several prompt silhouettes so one resolve can uncover a whole cluster (D-028). */
function combineRevealTargets(texts, size) {
    const n = size || REVEAL.GRID_SIZE;
    const list = Array.isArray(texts) ? texts : [];
    if (!list.length) return rasterizeRevealRect(n, 0.2, 0.2, 0.6, 0.6);
    const out = revealEmptyFrame(n);
    for (let t = 0; t < list.length; t++) {
        const part = rasterizeRevealTarget(list[t], n);
        for (let i = 0; i < out.length; i++) {
            if (part[i]) out[i] = 1;
        }
    }
    return out;
}

/**
 * Far cells resolve first (noise clears from the edges), cells on the shape last.
 * Jitter keeps it from reading as a geometric iris wipe.
 */
function ranksTowardTarget(target, size) {
    const n = size || REVEAL.GRID_SIZE;
    const total = n * n;
    const ons = [];
    for (let i = 0; i < total; i++) {
        if (revealCellOn(target && target[i])) ons.push(i);
    }
    const cx = (n - 1) / 2;
    const cy = (n - 1) / 2;
    const scored = [];
    for (let i = 0; i < total; i++) {
        const x = i % n;
        const y = Math.floor(i / n);
        let dist;
        if (ons.length) {
            let minD = Infinity;
            for (let j = 0; j < ons.length; j++) {
                const ox = ons[j] % n;
                const oy = Math.floor(ons[j] / n);
                const d = (x - ox) * (x - ox) + (y - oy) * (y - oy);
                if (d < minD) minD = d;
            }
            dist = Math.sqrt(minD);
        } else {
            dist = Math.hypot(x - cx, y - cy);
        }
        scored.push({ i: i, score: dist + Math.random() * n * REVEAL.DISTANCE_JITTER });
    }
    scored.sort(function (a, b) { return b.score - a.score; });
    const ranks = new Array(total);
    for (let r = 0; r < scored.length; r++) {
        ranks[scored[r].i] = r;
    }
    return ranks;
}

/**
 * D-036: shuffle every cell so holes open over the word from the first ticks.
 * Far-from-shape first (ranksTowardTarget) cleared empty paper first and felt paused.
 */
function ranksPuzzleShuffle(size) {
    const n = size || REVEAL.GRID_SIZE;
    const total = n * n;
    const order = [];
    for (let i = 0; i < total; i++) order.push(i);
    for (let i = total - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = order[i];
        order[i] = order[j];
        order[j] = tmp;
    }
    const ranks = new Array(total);
    for (let r = 0; r < total; r++) {
        ranks[order[r]] = r;
    }
    return ranks;
}

function cssVarColor(name, fallback) {
    if (typeof getComputedStyle === 'undefined' || typeof document === 'undefined') {
        return fallback || '#ffffff';
    }
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback || '#ffffff';
}

/** D-028 / D-032: largest square-cell grid that fits in width×height, centered. */
function revealSquareGridMetrics(width, height, size) {
    const n = size || REVEAL.GRID_SIZE;
    const cell = Math.max(1, Math.floor(Math.min(width, height) / n));
    const grid = cell * n;
    return {
        n: n,
        cell: cell,
        grid: grid,
        ox: Math.floor((width - grid) / 2),
        oy: Math.floor((height - grid) / 2)
    };
}

/**
 * 2D canvas painter used by the Theme page previews.
 * Square cells, centered; gutters are background (D-028).
 * resolvePct 0 = full decoy mask; 100 = only the target silhouette.
 */
function paintRevealGrid(ctx, opts) {
    const size = (opts && opts.size) || REVEAL.GRID_SIZE;
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const decoy = (opts && opts.decoy) || revealEmptyFrame(size);
    const target = (opts && opts.target) || revealEmptyFrame(size);
    const ranks = (opts && opts.ranks) || ranksTowardTarget(target, size);
    const resolvePct = opts && typeof opts.resolvePct === 'number' ? opts.resolvePct : 0;
    const primary = (opts && opts.primary) || cssVarColor('--primary-color', '#ffffff');
    const background = (opts && opts.background) || cssVarColor('--background-color', '#000080');
    const m = revealSquareGridMetrics(width, height, size);
    const threshold = (resolvePct / 100) * size * size;
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
    for (let i = 0; i < size * size; i++) {
        const resolved = ranks[i] < threshold;
        const on = resolved ? target[i] : decoy[i];
        if (!revealCellOn(on)) continue;
        const x = i % size;
        const y = Math.floor(i / size);
        ctx.fillStyle = revealCellColor(on, primary);
        ctx.fillRect(m.ox + x * m.cell, m.oy + y * m.cell, m.cell, m.cell);
    }
}

function paintFrameGrid(ctx, frame, opts) {
    const size = (opts && opts.size) || REVEAL.GRID_SIZE;
    paintRevealGrid(ctx, {
        size: size,
        decoy: frame,
        target: frame,
        ranks: ranksTowardTarget(frame, size),
        resolvePct: 0,
        primary: opts && opts.primary,
        background: opts && opts.background
    });
}

window.REVEAL = REVEAL;
window.clampRevealGridSize = clampRevealGridSize;
window.clampRevealFrameCount = clampRevealFrameCount;
window.revealGridSize = revealGridSize;
window.revealFrameCount = revealFrameCount;
window.convergeTicksForSize = convergeTicksForSize;
window.revealLiftStartTick = revealLiftStartTick;
window.revealFrameHz = revealFrameHz;
window.revealFrameNoteIndex = revealFrameNoteIndex;
window.revealNoteName = revealNoteName;
window.revealNoteIsMute = revealNoteIsMute;
window.clampRevealNoteIndex = clampRevealNoteIndex;
window.defaultRevealNoteIndex = defaultRevealNoteIndex;
window.playRevealFrameSound = playRevealFrameSound;
window.playRevealTransitionSound = playRevealTransitionSound;
window.playRevealFinalSound = playRevealFinalSound;
window.revealFinalNoteIndex = revealFinalNoteIndex;
window.defaultRevealFinalNoteIndex = defaultRevealFinalNoteIndex;
window.normalizeRevealFrame = normalizeRevealFrame;
window.resampleRevealFrame = resampleRevealFrame;
window.revealDefaultState = revealDefaultState;
window.loadRevealAnimation = loadRevealAnimation;
window.saveRevealAnimation = saveRevealAnimation;
window.cloneRevealSnapshot = cloneRevealSnapshot;
window.stampRevealOnCurrentActivity = stampRevealOnCurrentActivity;
window.restoreActivityReveal = restoreActivityReveal;
window.parseRevealAnimationFile = parseRevealAnimationFile;
window.downloadRevealAnimation = downloadRevealAnimation;
window.revealHasPaint = revealHasPaint;
window.revealUsesPixelFilm = revealUsesPixelFilm;
window.makeGeometricFrame = makeGeometricFrame;
window.getRevealDecoyFrame = getRevealDecoyFrame;
window.rasterizeRevealText = rasterizeRevealText;
window.rasterizeRevealTarget = rasterizeRevealTarget;
window.combineRevealTargets = combineRevealTargets;
window.ranksTowardTarget = ranksTowardTarget;
window.ranksPuzzleShuffle = ranksPuzzleShuffle;
window.paintRevealGrid = paintRevealGrid;
window.paintFrameGrid = paintFrameGrid;
window.revealEmptyFrame = revealEmptyFrame;
window.revealEmptyFrames = revealEmptyFrames;
window.normalizeRevealState = normalizeRevealState;
window.normalizeRevealCell = normalizeRevealCell;
window.revealCellOn = revealCellOn;
window.revealCellColor = revealCellColor;
window.cssVarColor = cssVarColor;
window.revealSquareGridMetrics = revealSquareGridMetrics;
