// Theme Manager - Handles all theme and styling functionality
// Responsible for: Theme switching, background changes, CSS variable management

// Theme definitions
const themes = {
    orangeCRT: {
        '--primary-color': '#FF8800',
        '--primary-hover': '#FFAA33',
        '--primary-shadow': 'rgba(255, 136, 0, 0.3)',
        '--primary-shadow-hover': 'rgba(255, 136, 0, 0.5)',
        '--primary-shadow-light': 'rgba(255, 136, 0, 0.1)',
        '--accent-color': '#FFAA55',
        '--background-color': '#1A0A00',
        '--text-color': '#FF8800',
        '--border-color': '#331100',
        '--delete-color': 'var(--primary-color)', // D5: same as chrome, not a warning red
        '--frame-color': '#FF8800',
        '--frame-border': '#FF8800',
        '--frame-background': '#1A0A00'
    },
    blueCRT: {
        '--primary-color': '#00BFFF',
        '--primary-hover': '#1E90FF',
        '--primary-shadow': 'rgba(0, 191, 255, 0.3)',
        '--primary-shadow-hover': 'rgba(0, 191, 255, 0.5)',
        '--primary-shadow-light': 'rgba(0, 191, 255, 0.1)',
        '--accent-color': '#87CEEB',
        '--background-color': '#000011',
        '--text-color': '#00BFFF',
        '--border-color': '#001133',
        '--delete-color': 'var(--primary-color)', // D5: same as chrome, not a warning red
        '--frame-color': '#00BFFF',
        '--frame-border': '#00BFFF',
        '--frame-background': '#000011'
    },
    windows: {
        '--primary-color': '#FFFFFF',
        '--primary-hover': '#E0E0E0',
        '--primary-shadow': 'rgba(255, 255, 255, 0.3)',
        '--primary-shadow-hover': 'rgba(255, 255, 255, 0.5)',
        '--primary-shadow-light': 'rgba(255, 255, 255, 0.1)',
        '--accent-color': '#C0C0C0',
        '--background-color': '#000080',
        '--text-color': '#FFFFFF',
        '--border-color': '#4169E1',
        '--delete-color': 'var(--primary-color)', // D5: same as chrome, not a warning red
        '--frame-color': '#FFFFFF',
        '--frame-border': '#FFFFFF',
        '--frame-background': '#000080'
    },
    greenCRT: {
        '--primary-color': '#00FF00',
        '--primary-hover': '#33FF33',
        '--primary-shadow': 'rgba(0, 255, 0, 0.3)',
        '--primary-shadow-hover': 'rgba(0, 255, 0, 0.5)',
        '--primary-shadow-light': 'rgba(0, 255, 0, 0.1)',
        '--accent-color': '#66FF66',
        '--background-color': '#001100',
        '--text-color': '#00FF00',
        '--border-color': '#003300',
        '--delete-color': 'var(--primary-color)', // D5: same as chrome, not a warning red
        '--frame-color': '#00FF00',
        '--frame-border': '#00FF00',
        '--frame-background': '#001100'
    },
    purpleCRT: {
        '--primary-color': '#BF00FF',
        '--primary-hover': '#DA70D6',
        '--primary-shadow': 'rgba(191, 0, 255, 0.3)',
        '--primary-shadow-hover': 'rgba(191, 0, 255, 0.5)',
        '--primary-shadow-light': 'rgba(191, 0, 255, 0.1)',
        '--accent-color': '#DDA0DD',
        '--background-color': '#110011',
        '--text-color': '#BF00FF',
        '--border-color': '#220022',
        '--delete-color': 'var(--primary-color)', // D5: same as chrome, not a warning red
        '--frame-color': '#BF00FF',
        '--frame-border': '#BF00FF',
        '--frame-background': '#110011'
    },
    pinkCRT: {
        '--primary-color': '#FF1493',
        '--primary-hover': '#FF69B4',
        '--primary-shadow': 'rgba(255, 20, 147, 0.3)',
        '--primary-shadow-hover': 'rgba(255, 20, 147, 0.5)',
        '--primary-shadow-light': 'rgba(255, 20, 147, 0.1)',
        '--accent-color': '#FFB6C1',
        '--background-color': '#1A000A',
        '--text-color': '#FF1493',
        '--border-color': '#330011',
        '--delete-color': 'var(--primary-color)', // D5: same as chrome, not a warning red
        '--frame-color': '#FF1493',
        '--frame-border': '#FF1493',
        '--frame-background': '#1A000A'
    },
    macintosh: {
        '--primary-color': '#000000',
        '--primary-hover': '#333333',
        '--primary-shadow': 'rgba(0, 0, 0, 0.3)',
        '--primary-shadow-hover': 'rgba(0, 0, 0, 0.5)',
        '--primary-shadow-light': 'rgba(0, 0, 0, 0.1)',
        '--accent-color': '#404040',
        '--background-color': '#F5F5F5',
        '--text-color': '#000000',
        '--border-color': '#E0E0E0',
        '--delete-color': 'var(--primary-color)', // D5: same as chrome, not a warning red
        '--frame-color': '#000000',
        '--frame-border': '#000000',
        '--frame-background': '#F5F5F5'
    },
    black: {
        '--primary-color': '#FFFFFF',
        '--primary-hover': '#E0E0E0',
        '--primary-shadow': 'rgba(255, 255, 255, 0.3)',
        '--primary-shadow-hover': 'rgba(255, 255, 255, 0.5)',
        '--primary-shadow-light': 'rgba(255, 255, 255, 0.1)',
        '--accent-color': '#CCCCCC',
        '--background-color': '#000000',
        '--text-color': '#FFFFFF',
        '--border-color': '#333',
        '--delete-color': 'var(--primary-color)', // D5: same as chrome, not a warning red
        '--frame-color': '#FFFFFF',
        '--frame-border': '#FFFFFF',
        '--frame-background': '#000000'
    }
};

// Display order / labels for the Customize page cards (D-024). Keys stay the preset ids.
const THEME_PRESET_ORDER = ['windows', 'macintosh', 'greenCRT', 'orangeCRT', 'blueCRT', 'purpleCRT', 'pinkCRT', 'black'];
const THEME_PRESET_LABELS = {
    windows: 'Windows',
    macintosh: 'Macintosh',
    greenCRT: 'Green CRT',
    orangeCRT: 'Orange CRT',
    blueCRT: 'Blue CRT',
    purpleCRT: 'Purple CRT',
    pinkCRT: 'Pink CRT',
    black: 'Black'
};

// D-026 knobs — per-preset overlays on the factory palettes above
const THEME_CUSTOM_KEY = 'themeCustomizations';
const THEME_KNOB_DEFAULTS = {
    glow: 0.3,
    strokeWidth: 1,
    // D-059: leftover-card outline on the prompting window. 0 = none.
    cardStroke: 4,
    cardStrokeMin: 0,
    cardStrokeMax: 8,
    font: 'VT323',
    fontSize: 18,
    fontStyle: 'regular'
};
const THEME_FONTS = [
    { id: 'VT323', label: 'VT323', stack: "'VT323', monospace", google: null },
    { id: 'Share Tech Mono', label: 'Share Tech Mono', stack: "'Share Tech Mono', monospace", google: 'Share+Tech+Mono' },
    { id: 'Press Start 2P', label: 'Press Start 2P', stack: "'Press Start 2P', cursive", google: 'Press+Start+2P' },
    { id: 'Silkscreen', label: 'Silkscreen', stack: "'Silkscreen', sans-serif", google: 'Silkscreen' },
    { id: 'IBM Plex Mono', label: 'IBM Plex Mono', stack: "'IBM Plex Mono', monospace", google: 'IBM+Plex+Mono' },
    { id: 'Orbitron', label: 'Orbitron', stack: "'Orbitron', sans-serif", google: 'Orbitron' },
    { id: 'Space Mono', label: 'Space Mono', stack: "'Space Mono', monospace", google: 'Space+Mono' },
    { id: 'Anonymous Pro', label: 'Anonymous Pro', stack: "'Anonymous Pro', monospace", google: 'Anonymous+Pro' },
    { id: 'Pixelify Sans', label: 'Pixelify Sans', stack: "'Pixelify Sans', sans-serif", google: 'Pixelify+Sans' },
    { id: 'Rubik', label: 'Rubik', stack: "'Rubik', sans-serif", google: 'Rubik' },
    { id: 'Georgia', label: 'Georgia', stack: "Georgia, 'Times New Roman', serif", google: null },
    { id: 'Courier New', label: 'Courier New', stack: "'Courier New', Courier, monospace", google: null }
];
const THEME_FONT_STYLES = [
    { id: 'regular', label: 'Regular', cssStyle: 'normal', cssWeight: '400' },
    { id: 'italic', label: 'Italic', cssStyle: 'italic', cssWeight: '400' },
    { id: 'bold', label: 'Bold', cssStyle: 'normal', cssWeight: '700' },
    { id: 'bold-italic', label: 'Bold Italic', cssStyle: 'italic', cssWeight: '700' }
];

// D-030: Illustrator-style web swatches — four short groups, not the OS color picker.
// Names follow the CSS/web set Illustrator ships; CRT factory inks/papers are in Neon/Shades so Reset colors stay pickable.
const THEME_SWATCH_GROUPS = [
    {
        id: 'pastel',
        label: 'Pastel',
        swatches: [
            { hex: '#ffe4e1', label: 'Misty Rose' },
            { hex: '#ffdab9', label: 'Peach' },
            { hex: '#fffacd', label: 'Lemon Chiffon' },
            { hex: '#98fb98', label: 'Pale Green' },
            { hex: '#afeeee', label: 'Pale Turquoise' },
            { hex: '#b0e0e6', label: 'Powder Blue' },
            { hex: '#e6e6fa', label: 'Lavender' },
            { hex: '#d8bfd8', label: 'Thistle' },
            { hex: '#ffc0cb', label: 'Pink' },
            { hex: '#f5deb3', label: 'Wheat' },
            { hex: '#f0fff0', label: 'Honeydew' },
            { hex: '#fff5ee', label: 'Seashell' }
        ]
    },
    {
        id: 'primary',
        label: 'Primary',
        swatches: [
            { hex: '#ff0000', label: 'Red' },
            { hex: '#ffa500', label: 'Orange' },
            { hex: '#ffd700', label: 'Gold' },
            { hex: '#008000', label: 'Green' },
            { hex: '#0000ff', label: 'Blue' },
            { hex: '#800080', label: 'Purple' },
            { hex: '#008080', label: 'Teal' },
            { hex: '#800000', label: 'Maroon' },
            { hex: '#000080', label: 'Navy' },
            { hex: '#4169e1', label: 'Royal Blue' },
            { hex: '#ffffff', label: 'White' },
            { hex: '#000000', label: 'Black' }
        ]
    },
    {
        id: 'neon',
        label: 'Neon',
        swatches: [
            { hex: '#ff073a', label: 'Neon Red' },
            { hex: '#ff6b00', label: 'Neon Orange' },
            { hex: '#ffff00', label: 'Yellow' },
            { hex: '#39ff14', label: 'Neon Green' },
            { hex: '#00ffff', label: 'Aqua' },
            { hex: '#bf00ff', label: 'Neon Purple' },
            { hex: '#ff1493', label: 'Deep Pink' },
            { hex: '#ff00ff', label: 'Fuchsia' },
            { hex: '#ff8800', label: 'Orange CRT' },
            { hex: '#00ff00', label: 'Green CRT' },
            { hex: '#00bfff', label: 'Blue CRT' },
            { hex: '#7fff00', label: 'Chartreuse' }
        ]
    },
    {
        id: 'shades',
        label: 'Shades',
        swatches: [
            { hex: '#ffffff', label: 'White' },
            { hex: '#f5f5f5', label: 'Smoke' },
            { hex: '#c0c0c0', label: 'Silver' },
            { hex: '#808080', label: 'Gray' },
            { hex: '#404040', label: 'Charcoal' },
            { hex: '#000000', label: 'Black' },
            { hex: '#000080', label: 'Navy' },
            { hex: '#000011', label: 'CRT Blue paper' },
            { hex: '#001100', label: 'CRT Green paper' },
            { hex: '#1a0a00', label: 'CRT Orange paper' },
            { hex: '#110011', label: 'CRT Purple paper' },
            { hex: '#1a000a', label: 'CRT Pink paper' }
        ]
    }
];

function normalizeHex(hex, fallback) {
    const raw = String(hex == null ? '' : hex).trim();
    const fb = fallback || '#ffffff';
    if (!raw || raw.charAt(0) !== '#') return fb;
    let h = raw.slice(1);
    if (h.length === 3) h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2);
    if (h.length > 6) h = h.slice(0, 6);
    if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) return fb;
    return '#' + h.toLowerCase();
}

function hexToRgbTriple(hex) {
    const h = normalizeHex(hex, '#ffffff').slice(1);
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function rgbToHex(r, g, b) {
    const to = function (n) { return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0'); };
    return '#' + to(r) + to(g) + to(b);
}

function lightenHex(hex, amt) {
    const rgb = hexToRgbTriple(hex);
    const lift = function (c) { return c + (255 - c) * amt; };
    return rgbToHex(lift(rgb[0]), lift(rgb[1]), lift(rgb[2]));
}

function rgbaFromHex(hex, alpha) {
    const rgb = hexToRgbTriple(hex);
    return 'rgba(' + rgb[0] + ', ' + rgb[1] + ', ' + rgb[2] + ', ' + alpha + ')';
}

function loadThemeCustomizations() {
    try {
        const parsed = JSON.parse(localStorage.getItem(THEME_CUSTOM_KEY) || '{}');
        return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
    } catch (e) {
        return {};
    }
}

function saveThemeCustomizations(all) {
    localStorage.setItem(THEME_CUSTOM_KEY, JSON.stringify(all || {}));
}

function getThemeKnobs(themeName) {
    const factory = themes[themeName] || themes.windows;
    const custom = loadThemeCustomizations()[themeName] || {};
    const fontIds = THEME_FONTS.map(function (f) { return f.id; });
    const font = fontIds.indexOf(custom.font) >= 0 ? custom.font : THEME_KNOB_DEFAULTS.font;
    const styleIds = THEME_FONT_STYLES.map(function (s) { return s.id; });
    const fontStyle = styleIds.indexOf(custom.fontStyle) >= 0 ? custom.fontStyle : THEME_KNOB_DEFAULTS.fontStyle;
    let fontSize = (typeof custom.fontSize === 'number') ? custom.fontSize : THEME_KNOB_DEFAULTS.fontSize;
    fontSize = Math.max(12, Math.min(28, Math.round(fontSize)));
    const strokeWidth = (typeof custom.strokeWidth === 'number') ? custom.strokeWidth : THEME_KNOB_DEFAULTS.strokeWidth;
    // Older looks had no cardStroke knob — keep the leftover-card outline they already had (stroke + 3).
    const cardStrokeRaw = (typeof custom.cardStroke === 'number')
        ? custom.cardStroke
        : (Math.round(strokeWidth) + 3);
    return {
        primary: normalizeHex(custom.primary || factory['--primary-color'], '#ffffff'),
        background: normalizeHex(custom.background || factory['--background-color'], '#000000'),
        stroke: normalizeHex(custom.stroke || factory['--border-color'], '#333333'),
        glow: (typeof custom.glow === 'number') ? custom.glow : THEME_KNOB_DEFAULTS.glow,
        strokeWidth: strokeWidth,
        cardStroke: clampThemeCardStroke(cardStrokeRaw),
        font: font,
        fontSize: fontSize,
        fontStyle: fontStyle
    };
}

function clampThemeCardStroke(n) {
    const v = Math.round(Number(n));
    const min = THEME_KNOB_DEFAULTS.cardStrokeMin;
    const max = THEME_KNOB_DEFAULTS.cardStrokeMax;
    if (!Number.isFinite(v)) return THEME_KNOB_DEFAULTS.cardStroke;
    return Math.max(min, Math.min(max, v));
}

function setThemeKnobs(themeName, patch) {
    if (!themes[themeName]) return getThemeKnobs(themeName);
    const all = loadThemeCustomizations();
    const next = Object.assign({}, all[themeName] || {}, patch || {});
    all[themeName] = next;
    saveThemeCustomizations(all);
    return getThemeKnobs(themeName);
}

function resetThemeKnobs(themeName) {
    const all = loadThemeCustomizations();
    delete all[themeName];
    saveThemeCustomizations(all);
    return getThemeKnobs(themeName);
}

/** True when this preset has a saved overlay (the thumbnail is not factory). D-033. */
function themeHasSavedLook(themeName) {
    const custom = loadThemeCustomizations()[themeName];
    return !!(custom && typeof custom === 'object' && Object.keys(custom).length);
}

/** Stamp the live knobs onto this preset’s overlay so the thumbnail holds the look (D-033). */
function commitThemeLook(themeName) {
    if (!themes[themeName]) return getThemeKnobs(themeName);
    const knobs = getThemeKnobs(themeName);
    const all = loadThemeCustomizations();
    all[themeName] = {
        primary: knobs.primary,
        background: knobs.background,
        stroke: knobs.stroke,
        glow: knobs.glow,
        strokeWidth: knobs.strokeWidth,
        cardStroke: knobs.cardStroke,
        font: knobs.font,
        fontSize: knobs.fontSize,
        fontStyle: knobs.fontStyle
    };
    saveThemeCustomizations(all);
    return knobs;
}

function getCurrentActivityName() {
    try {
        const pc = JSON.parse(localStorage.getItem('promptCategories') || '{}');
        if (pc && pc.activityName) return pc.activityName;
    } catch (e) { /* ignore */ }
    try {
        const last = JSON.parse(localStorage.getItem('lastRunActivity') || 'null');
        if (last && last.name) return last.name;
    } catch (e) { /* ignore */ }
    return null;
}

/**
 * D-033: copy this preset + knob snapshot onto the open activity so that
 * activity remembers the look in this browser. CSV still only stores the preset id (D-026).
 */
function applyThemeToCurrentActivity() {
    const themeName = localStorage.getItem('selectedTheme') || 'windows';
    const background = localStorage.getItem('selectedBackground') || 'black';
    const knobs = commitThemeLook(themeName);
    const activityName = getCurrentActivityName();
    try {
        const pc = JSON.parse(localStorage.getItem('promptCategories') || '{}');
        pc.theme = themeName;
        pc.background = background;
        pc.themeKnobs = Object.assign({}, loadThemeCustomizations()[themeName] || {});
        localStorage.setItem('promptCategories', JSON.stringify(pc));
    } catch (e) { /* ignore */ }
    if (!activityName) return { ok: false, reason: 'no-activity', theme: themeName };
    try {
        const settings = JSON.parse(localStorage.getItem('promptSettings') || '{}');
        if (settings[activityName]) {
            settings[activityName].theme = themeName;
            settings[activityName].background = background;
            settings[activityName].themeKnobs = Object.assign({}, loadThemeCustomizations()[themeName] || {});
            localStorage.setItem('promptSettings', JSON.stringify(settings));
        }
    } catch (e) { /* ignore */ }
    window.dispatchEvent(new CustomEvent('promptDataUpdated', { detail: { timestamp: Date.now() } }));
    return { ok: true, activityName: activityName, theme: themeName, knobs: knobs };
}

/** Load an activity’s stamped look (preset + optional knob snapshot). D-033. */
function restoreActivityTheme(settings) {
    if (!settings || !settings.theme || !themes[settings.theme]) return false;
    if (settings.themeKnobs && typeof settings.themeKnobs === 'object' && !Array.isArray(settings.themeKnobs)) {
        const all = loadThemeCustomizations();
        all[settings.theme] = Object.assign({}, settings.themeKnobs);
        saveThemeCustomizations(all);
    }
    if (settings.background) {
        localStorage.setItem('selectedBackground', settings.background);
    }
    changeTheme(settings.theme);
    return true;
}

function themeFontSpec(fontId) {
    for (let i = 0; i < THEME_FONTS.length; i++) {
        if (THEME_FONTS[i].id === fontId) return THEME_FONTS[i];
    }
    return THEME_FONTS[0];
}

function themeFontStyleSpec(styleId) {
    for (let i = 0; i < THEME_FONT_STYLES.length; i++) {
        if (THEME_FONT_STYLES[i].id === styleId) return THEME_FONT_STYLES[i];
    }
    return THEME_FONT_STYLES[0];
}

function ensureThemeFontLoaded(fontId) {
    const spec = themeFontSpec(fontId);
    if (!spec.google) return;
    const elId = 'theme-font-' + spec.id.replace(/\s+/g, '-');
    if (document.getElementById(elId)) return;
    const link = document.createElement('link');
    link.id = elId;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=' + spec.google + '&display=swap';
    document.head.appendChild(link);
}

function ensureThemeKnobSheet() {
    if (typeof document === 'undefined' || document.getElementById('theme-knob-sheet')) return;
    const sheet = document.createElement('style');
    sheet.id = 'theme-knob-sheet';
    // D-026: one sheet so font + stroke knobs reach every page that loads theme-manager.js
    sheet.textContent = [
        "body { font-family: var(--ui-font, 'VT323', monospace) !important; font-size: var(--ui-font-size, 18px); font-style: var(--ui-font-style, normal); font-weight: var(--ui-font-weight, 400); }",
        "button:not(.sketch-run):not(.sketch-next-btn), input, textarea, select, .themed-dropdown-trigger, .themed-dropdown-menu li, .settings-help-button, .theme-chrome-btn { font-family: var(--ui-font, 'VT323', monospace) !important; font-size: var(--ui-font-size, 18px) !important; font-style: var(--ui-font-style, normal); font-weight: var(--ui-font-weight, 400); }",
        "button:not(.sketch-run):not(.sketch-next-btn), input, textarea, select, .themed-dropdown-trigger, .settings-help-button, .theme-chrome-btn { border-width: var(--stroke-width, 1px) !important; }",
        ".settings-panel, .theme-monitor, .theme-preset-card { border-width: var(--panel-stroke-width, 2px) !important; }",
        // D-054: do not set fill on all buttons — filled chrome (RUN, GO TO NEXT, ...)
        // needs paper (D-050). Outline Tune/editor chips use ink.
        ".theme-chrome-btn { -webkit-text-fill-color: var(--primary-color); }",
        ".theme-chrome-btn:hover, .theme-chrome-btn.is-active, .theme-toggle button.is-active { color: var(--on-primary-color, var(--background-color)); -webkit-text-fill-color: var(--on-primary-color, var(--background-color)); }"
    ].join('\n');
    (document.head || document.documentElement).appendChild(sheet);
}

/** Factory palette + this-browser knobs → CSS variables (D-026). */
function resolveThemeCss(themeName) {
    const factory = themes[themeName] || themes.windows;
    const knobs = getThemeKnobs(themeName);
    const glow = Math.max(0, Math.min(0.7, knobs.glow));
    const strokePx = Math.max(1, Math.min(6, Math.round(knobs.strokeWidth)));
    const cardPx = clampThemeCardStroke(knobs.cardStroke);
    const spec = themeFontSpec(knobs.font);
    const styleSpec = themeFontStyleSpec(knobs.fontStyle);
    const css = {};
    Object.keys(factory).forEach(function (key) { css[key] = factory[key]; });
    css['--primary-color'] = knobs.primary;
    css['--text-color'] = knobs.primary;
    css['--frame-color'] = knobs.primary;
    css['--frame-border'] = knobs.primary;
    css['--delete-color'] = 'var(--primary-color)';
    css['--primary-hover'] = lightenHex(knobs.primary, 0.2);
    css['--accent-color'] = lightenHex(knobs.primary, 0.35);
    css['--primary-shadow'] = rgbaFromHex(knobs.primary, glow);
    css['--primary-shadow-hover'] = rgbaFromHex(knobs.primary, Math.min(0.9, glow + 0.2));
    css['--primary-shadow-light'] = rgbaFromHex(knobs.primary, Math.max(0.05, glow * 0.35));
    css['--background-color'] = knobs.background;
    css['--frame-background'] = knobs.background;
    // D-050: label color on ink-filled buttons (paper). Hardcoded #000 vanished on Macintosh.
    css['--on-primary-color'] = knobs.background;
    css['--border-color'] = knobs.stroke;
    css['--ui-font'] = spec.stack;
    css['--ui-font-size'] = knobs.fontSize + 'px';
    css['--ui-font-style'] = styleSpec.cssStyle;
    css['--ui-font-weight'] = styleSpec.cssWeight;
    css['--stroke-width'] = strokePx + 'px';
    css['--panel-stroke-width'] = Math.max(2, strokePx) + 'px';
    // D-059: leftover-card outline is its own knob (0 = none), not chrome stroke + 3.
    css['--card-stroke-width'] = cardPx + 'px';
    return css;
}

// Change theme
// skipSave: if true, applies theme but doesn't save to localStorage (for activity loading)
function changeTheme(themeName, skipSave = false) {
    // Migrate old theme names to new CRT versions
    const themeMigration = {
        'orange': 'orangeCRT',
        'green': 'greenCRT',
        'blue': 'blueCRT',
        'purple': 'purpleCRT',
        'pink': 'pinkCRT',
        'white': 'macintosh'
    };
    
    // If theme name needs migration, update it
    if (themeMigration[themeName]) {
        console.log(`Migrating old theme "${themeName}" to "${themeMigration[themeName]}"`);
        themeName = themeMigration[themeName];
        // Only save during migration if skipSave is false
        if (!skipSave) {
            localStorage.setItem('selectedTheme', themeName);
        }
    }

    // Keep hidden select + custom menu selection in sync
    syncThemeMenuSelection(themeName);
    const mobileThemeSelect = document.getElementById('mobile-theme-select');
    if (mobileThemeSelect) {
        mobileThemeSelect.value = themeName;
    }
    
    const theme = themes[themeName];
    if (theme) {
        console.log(`Applying theme: ${themeName}, skipSave: ${skipSave}`);
        ensureThemeKnobSheet();
        const knobs = getThemeKnobs(themeName);
        ensureThemeFontLoaded(knobs.font);
        const root = document.documentElement;
        const css = resolveThemeCss(themeName);
        Object.keys(css).forEach(key => {
            root.style.setProperty(key, css[key]);
        });
        
        // Automatically set background based on theme
        // Note: The theme object already contains all the CSS variables including background colors
        // We only need to call changeBackground to save the background preference, not to override theme colors
        let backgroundToSave = 'black'; // default
        if (themeName === 'windows') {
            backgroundToSave = 'blue-black';
        } else if (themeName === 'greenCRT') {
            backgroundToSave = 'green-crt';
        } else if (themeName === 'orangeCRT') {
            backgroundToSave = 'orange-crt';
        } else if (themeName === 'blueCRT') {
            backgroundToSave = 'blue-crt';
        } else if (themeName === 'purpleCRT') {
            backgroundToSave = 'purple-crt';
        } else if (themeName === 'pinkCRT') {
            backgroundToSave = 'pink-crt';
        } else if (themeName === 'macintosh') {
            backgroundToSave = 'grey';
        } else if (themeName === 'black') {
            backgroundToSave = 'black';
        } else {
            console.warn(`Unknown theme: ${themeName}, defaulting to black background`);
            backgroundToSave = 'black';
        }
        
        // Save background preference (but don't call changeBackground as it would override theme colors)
        // The theme object already has all the correct CSS variables set above
        if (!skipSave) {
            localStorage.setItem('selectedBackground', backgroundToSave);
            console.log(`Background preference saved: ${backgroundToSave}`);
        }
        
        // Save theme preference (unless skipSave is true - used when loading activities)
        if (!skipSave) {
            localStorage.setItem('selectedTheme', themeName);
            console.log(`✅ Theme changed and saved to localStorage: ${themeName}`);
        } else {
            console.log(`⚠️ Theme changed temporarily to: ${themeName} (not saved)`);
        }
        
        // Dispatch custom event to notify sketch page of theme change
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: themeName, background: localStorage.getItem('selectedBackground') || 'black' }
        }));
    } else {
        console.error(`❌ Theme "${themeName}" not found in themes object! Available themes:`, Object.keys(themes));
    }
}

function syncThemeMenuSelection(themeName) {
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect && themeName) {
        themeSelect.value = themeName;
    }
    const list = document.getElementById('theme-menu-list');
    if (!list) return;
    list.querySelectorAll('li[data-value]').forEach(item => {
        const selected = item.getAttribute('data-value') === themeName;
        item.classList.toggle('selected', selected);
        if (selected) item.setAttribute('aria-selected', 'true');
        else item.removeAttribute('aria-selected');
    });
}

function closeThemeMenuDropdown() {
    const dropdown = document.getElementById('theme-menu-dropdown');
    const trigger = document.getElementById('theme-menu-trigger');
    if (dropdown) dropdown.classList.remove('open');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
}

function toggleThemeMenuDropdown(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    // Close File menu if open so only one panel shows
    if (typeof closeFileMenuDropdown === 'function') closeFileMenuDropdown();
    const dropdown = document.getElementById('theme-menu-dropdown');
    const trigger = document.getElementById('theme-menu-trigger');
    if (!dropdown || !trigger) return;
    const willOpen = !dropdown.classList.contains('open');
    dropdown.classList.toggle('open', willOpen);
    trigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
}

function initThemeMenuDropdown() {
    const dropdown = document.getElementById('theme-menu-dropdown');
    const trigger = document.getElementById('theme-menu-trigger');
    const list = document.getElementById('theme-menu-list');
    if (!dropdown || !trigger || !list || trigger.dataset.bound === '1') return;
    trigger.dataset.bound = '1';

    trigger.addEventListener('click', toggleThemeMenuDropdown);

    list.querySelectorAll('li[data-value]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const value = item.getAttribute('data-value');
            closeThemeMenuDropdown();
            if (value) changeTheme(value);
        });
    });

    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) closeThemeMenuDropdown();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeThemeMenuDropdown();
    });

    const current = localStorage.getItem('selectedTheme') || 'windows';
    syncThemeMenuSelection(current);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThemeMenuDropdown);
} else {
    initThemeMenuDropdown();
}

// Change background (internal function - backgrounds are now set automatically by themes)
function changeBackground(bgColor) {
    const root = document.documentElement;
    if (bgColor === 'grey') {
        root.style.setProperty('--background-color', '#F5F5F5');
        root.style.setProperty('--text-color', '#000000');
        root.style.setProperty('--border-color', '#E0E0E0');
        root.style.setProperty('--frame-background', '#F5F5F5');
    } else if (bgColor === 'blue-black') {
        // Early Windows blue-black background
        root.style.setProperty('--background-color', '#000080');
        root.style.setProperty('--text-color', '#FFFFFF');
        root.style.setProperty('--border-color', '#4169E1');
        root.style.setProperty('--frame-background', '#000080');
    } else if (bgColor === 'green-crt') {
        // Green CRT style background - very dark green tint
        root.style.setProperty('--background-color', '#001100');
        root.style.setProperty('--text-color', '#00FF00');
        root.style.setProperty('--border-color', '#003300');
        root.style.setProperty('--frame-background', '#001100');
    } else if (bgColor === 'orange-crt') {
        // Orange CRT style background - very dark orange/brown tint
        root.style.setProperty('--background-color', '#1A0A00');
        root.style.setProperty('--text-color', '#FF8800');
        root.style.setProperty('--border-color', '#331100');
        root.style.setProperty('--frame-background', '#1A0A00');
    } else if (bgColor === 'blue-crt') {
        // Blue CRT style background - very dark blue tint
        root.style.setProperty('--background-color', '#000011');
        root.style.setProperty('--text-color', '#00BFFF');
        root.style.setProperty('--border-color', '#001133');
        root.style.setProperty('--frame-background', '#000011');
    } else if (bgColor === 'purple-crt') {
        // Purple CRT style background - very dark purple tint
        root.style.setProperty('--background-color', '#110011');
        root.style.setProperty('--text-color', '#BF00FF');
        root.style.setProperty('--border-color', '#220022');
        root.style.setProperty('--frame-background', '#110011');
    } else if (bgColor === 'pink-crt') {
        // Pink CRT style background - very dark pink tint
        root.style.setProperty('--background-color', '#1A000A');
        root.style.setProperty('--text-color', '#FF1493');
        root.style.setProperty('--border-color', '#330011');
        root.style.setProperty('--frame-background', '#1A000A');
    } else {
        // Default to black
        root.style.setProperty('--background-color', '#000000');
        root.style.setProperty('--text-color', '#FFFFFF');
        root.style.setProperty('--border-color', '#333');
        root.style.setProperty('--frame-background', '#000000');
    }
    
    // Save background preference
    localStorage.setItem('selectedBackground', bgColor);
    
    // Dispatch custom event to notify sketch page of background change
    window.dispatchEvent(new CustomEvent('backgroundChanged', {
        detail: { 
            background: bgColor, 
            theme: localStorage.getItem('selectedTheme') || 'windows' 
        }
    }));
    
    console.log(`Background changed to: ${bgColor}`);
}


// Migrate old theme names (call this early, before any theme loading)
function migrateOldThemes() {
    const themeMigration = {
        'orange': 'orangeCRT',
        'green': 'greenCRT',
        'blue': 'blueCRT',
        'purple': 'purpleCRT',
        'pink': 'pinkCRT',
        'white': 'macintosh'
    };
    
    let savedTheme = localStorage.getItem('selectedTheme');
    
    // If saved theme needs migration, update it immediately
    if (savedTheme && themeMigration[savedTheme]) {
        console.log(`Migrating old saved theme "${savedTheme}" to "${themeMigration[savedTheme]}"`);
        savedTheme = themeMigration[savedTheme];
        localStorage.setItem('selectedTheme', savedTheme);
    }
    
    // Also check and migrate any saved activities that might have old theme names
    const promptSettings = JSON.parse(localStorage.getItem('promptSettings') || '{}');
    let needsUpdate = false;
    
    Object.keys(promptSettings).forEach(activityName => {
        const activity = promptSettings[activityName];
        if (activity && activity.theme && themeMigration[activity.theme]) {
            console.log(`Migrating theme in activity "${activityName}" from "${activity.theme}" to "${themeMigration[activity.theme]}"`);
            activity.theme = themeMigration[activity.theme];
            needsUpdate = true;
        }
    });
    
    if (needsUpdate) {
        localStorage.setItem('promptSettings', JSON.stringify(promptSettings));
    }
}

// Load saved theme (primarily for updating dropdown - theme should already be applied)
function loadSavedTheme() {
    // Run migration first to ensure old themes are converted
    migrateOldThemes();
    
    let savedTheme = localStorage.getItem('selectedTheme');
    
    // If no saved theme exists, use Windows as default (not random)
    // This ensures consistent behavior and the theme will be saved when user changes it
    if (!savedTheme) {
        savedTheme = 'windows';
        localStorage.setItem('selectedTheme', savedTheme);
        console.log('No saved theme found, using default: windows');
        // Apply the default theme
        if (window.changeTheme) {
            changeTheme(savedTheme);
        }
    } else {
        console.log('Updating dropdown for saved theme:', savedTheme);
    }
    
    // Use requestAnimationFrame to ensure DOM is ready
    const setThemeAndDropdown = () => {
        const themeSelect = document.getElementById('theme-select');
        
        if (themeSelect) {
            // Ensure the theme exists in the dropdown options
            const themeExists = Array.from(themeSelect.options).some(option => option.value === savedTheme);
            
            if (!themeExists) {
                console.warn(`Theme "${savedTheme}" not found in dropdown, defaulting to windows`);
                savedTheme = 'windows';
                localStorage.setItem('selectedTheme', savedTheme);
                // Apply the fallback theme
                if (window.changeTheme) {
                    changeTheme(savedTheme);
                }
            }
            
            // Set the dropdown value to match the current theme
            themeSelect.value = savedTheme;
            if (typeof syncThemeMenuSelection === 'function') {
                syncThemeMenuSelection(savedTheme);
            }
            
            // Also update mobile theme select if it exists
            const mobileThemeSelect = document.getElementById('mobile-theme-select');
            if (mobileThemeSelect) {
                mobileThemeSelect.value = savedTheme;
            }
            
            // Note: Don't call changeTheme again here - it should already be applied
            // This function is mainly for updating the dropdown UI
        } else {
            // If dropdown doesn't exist yet, retry after a short delay
            setTimeout(setThemeAndDropdown, 50);
        }
    };
    
    // Try immediately, then retry if needed
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setThemeAndDropdown);
    } else {
        setThemeAndDropdown();
    }
}

// Make functions globally available
window.changeTheme = changeTheme;
window.changeBackground = changeBackground;
window.loadSavedTheme = loadSavedTheme;
window.migrateOldThemes = migrateOldThemes;
window.syncThemeMenuSelection = syncThemeMenuSelection;
window.closeThemeMenuDropdown = closeThemeMenuDropdown;
window.toggleThemeMenuDropdown = toggleThemeMenuDropdown;
window.THEME_PRESET_ORDER = THEME_PRESET_ORDER;
window.THEME_PRESET_LABELS = THEME_PRESET_LABELS;
window.THEME_FONTS = THEME_FONTS;
window.THEME_FONT_STYLES = THEME_FONT_STYLES;
window.THEME_SWATCH_GROUPS = THEME_SWATCH_GROUPS;
window.THEME_KNOB_DEFAULTS = THEME_KNOB_DEFAULTS;
window.clampThemeCardStroke = clampThemeCardStroke;
window.themes = themes;
window.getThemeKnobs = getThemeKnobs;
window.setThemeKnobs = setThemeKnobs;
window.resetThemeKnobs = resetThemeKnobs;
window.commitThemeLook = commitThemeLook;
window.themeHasSavedLook = themeHasSavedLook;
window.getCurrentActivityName = getCurrentActivityName;
window.applyThemeToCurrentActivity = applyThemeToCurrentActivity;
window.restoreActivityTheme = restoreActivityTheme;
window.resolveThemeCss = resolveThemeCss;
window.themeFontSpec = themeFontSpec;

/** Apply saved theme from localStorage without writing (anti-flash / page load). */
function applyThemeFromStorage() {
    if (typeof migrateOldThemes === 'function') migrateOldThemes();
    const name = localStorage.getItem('selectedTheme') || 'windows';
    changeTheme(name, true);
}
window.applyThemeFromStorage = applyThemeFromStorage;

// Run migration immediately when this script loads (before DOM is ready)
// This ensures old themes are migrated before any other code tries to use them
if (typeof window !== 'undefined') {
    migrateOldThemes();
}
