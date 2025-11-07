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
        '--delete-color': '#FF6B6B',
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
        '--delete-color': '#FF6B6B',
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
        '--delete-color': '#FF6B6B',
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
        '--delete-color': '#FF6B6B',
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
        '--delete-color': '#FF6B6B',
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
        '--delete-color': '#FF6B6B',
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
        '--delete-color': '#FF6B6B',
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
        '--delete-color': '#FF6B6B',
        '--frame-color': '#FFFFFF',
        '--frame-border': '#FFFFFF',
        '--frame-background': '#000000'
    }
};

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
        
        // Update dropdown immediately if it exists
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.value = themeName;
        }
        const mobileThemeSelect = document.getElementById('mobile-theme-select');
        if (mobileThemeSelect) {
            mobileThemeSelect.value = themeName;
        }
    }
    
    const theme = themes[themeName];
    if (theme) {
        console.log(`Applying theme: ${themeName}, skipSave: ${skipSave}`);
        const root = document.documentElement;
        Object.keys(theme).forEach(key => {
            root.style.setProperty(key, theme[key]);
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
            theme: localStorage.getItem('selectedTheme') || 'greenCRT' 
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
    
    // If no saved theme exists, use greenCRT as default (not random)
    // This ensures consistent behavior and the theme will be saved when user changes it
    if (!savedTheme) {
        savedTheme = 'greenCRT';
        localStorage.setItem('selectedTheme', savedTheme);
        console.log('No saved theme found, using default: greenCRT');
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
                console.warn(`Theme "${savedTheme}" not found in dropdown, defaulting to greenCRT`);
                savedTheme = 'greenCRT';
                localStorage.setItem('selectedTheme', savedTheme);
                // Apply the fallback theme
                if (window.changeTheme) {
                    changeTheme(savedTheme);
                }
            }
            
            // Set the dropdown value to match the current theme
            themeSelect.value = savedTheme;
            
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

// Run migration immediately when this script loads (before DOM is ready)
// This ensures old themes are migrated before any other code tries to use them
if (typeof window !== 'undefined') {
    migrateOldThemes();
}
