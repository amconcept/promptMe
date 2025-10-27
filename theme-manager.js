// Theme Manager - Handles all theme and styling functionality
// Responsible for: Theme switching, background changes, CSS variable management

// Theme definitions
const themes = {
    orange: {
        '--primary-color': '#D2691E',
        '--primary-hover': '#CD853F',
        '--primary-shadow': 'rgba(210, 105, 30, 0.3)',
        '--primary-shadow-hover': 'rgba(210, 105, 30, 0.5)',
        '--primary-shadow-light': 'rgba(210, 105, 30, 0.1)',
        '--accent-color': '#FF7F7F',
        '--background-color': '#000000',
        '--text-color': '#FFFFFF',
        '--border-color': '#333',
        '--delete-color': '#FF6B6B',
        '--frame-color': '#D2691E',
        '--frame-border': '#D2691E',
        '--frame-background': '#000000'
    },
    blue: {
        '--primary-color': '#4A90E2',
        '--primary-hover': '#6BB6FF',
        '--primary-shadow': 'rgba(74, 144, 226, 0.3)',
        '--primary-shadow-hover': 'rgba(74, 144, 226, 0.5)',
        '--primary-shadow-light': 'rgba(74, 144, 226, 0.1)',
        '--accent-color': '#7FB3FF',
        '--background-color': '#000000',
        '--text-color': '#FFFFFF',
        '--border-color': '#333',
        '--delete-color': '#FF6B6B',
        '--frame-color': '#4A90E2',
        '--frame-border': '#4A90E2',
        '--frame-background': '#000000'
    },
    green: {
        '--primary-color': '#4CAF50',
        '--primary-hover': '#66BB6A',
        '--primary-shadow': 'rgba(76, 175, 80, 0.3)',
        '--primary-shadow-hover': 'rgba(76, 175, 80, 0.5)',
        '--primary-shadow-light': 'rgba(76, 175, 80, 0.1)',
        '--accent-color': '#81C784',
        '--background-color': '#000000',
        '--text-color': '#FFFFFF',
        '--border-color': '#333',
        '--delete-color': '#FF6B6B',
        '--frame-color': '#4CAF50',
        '--frame-border': '#4CAF50',
        '--frame-background': '#000000'
    },
    purple: {
        '--primary-color': '#9C27B0',
        '--primary-hover': '#BA68C8',
        '--primary-shadow': 'rgba(156, 39, 176, 0.3)',
        '--primary-shadow-hover': 'rgba(156, 39, 176, 0.5)',
        '--primary-shadow-light': 'rgba(156, 39, 176, 0.1)',
        '--accent-color': '#CE93D8',
        '--background-color': '#000000',
        '--text-color': '#FFFFFF',
        '--border-color': '#333',
        '--delete-color': '#FF6B6B',
        '--frame-color': '#9C27B0',
        '--frame-border': '#9C27B0',
        '--frame-background': '#000000'
    },
    pink: {
        '--primary-color': '#E91E63',
        '--primary-hover': '#F06292',
        '--primary-shadow': 'rgba(233, 30, 99, 0.3)',
        '--primary-shadow-hover': 'rgba(233, 30, 99, 0.5)',
        '--primary-shadow-light': 'rgba(233, 30, 99, 0.1)',
        '--accent-color': '#F8BBD9',
        '--background-color': '#000000',
        '--text-color': '#FFFFFF',
        '--border-color': '#333',
        '--delete-color': '#FF6B6B',
        '--frame-color': '#E91E63',
        '--frame-border': '#E91E63',
        '--frame-background': '#000000'
    },
    white: {
        '--primary-color': '#FFFFFF',
        '--primary-hover': '#F0F0F0',
        '--primary-shadow': 'rgba(255, 255, 255, 0.3)',
        '--primary-shadow-hover': 'rgba(255, 255, 255, 0.5)',
        '--primary-shadow-light': 'rgba(255, 255, 255, 0.1)',
        '--accent-color': '#E0E0E0',
        '--background-color': '#000000',
        '--text-color': '#FFFFFF',
        '--border-color': '#333',
        '--delete-color': '#FF6B6B',
        '--frame-color': '#FFFFFF',
        '--frame-border': '#FFFFFF',
        '--frame-background': '#000000'
    },
    black: {
        '--primary-color': '#000000',
        '--primary-hover': '#333333',
        '--primary-shadow': 'rgba(0, 0, 0, 0.3)',
        '--primary-shadow-hover': 'rgba(0, 0, 0, 0.5)',
        '--primary-shadow-light': 'rgba(0, 0, 0, 0.1)',
        '--accent-color': '#404040',
        '--background-color': '#000000',
        '--text-color': '#FFFFFF',
        '--border-color': '#333',
        '--delete-color': '#FF6B6B',
        '--frame-color': '#000000',
        '--frame-border': '#000000',
        '--frame-background': '#000000'
    }
};

// Change theme
function changeTheme(themeName) {
    const theme = themes[themeName];
    if (theme) {
        const root = document.documentElement;
        Object.keys(theme).forEach(key => {
            root.style.setProperty(key, theme[key]);
        });
        
        // Filter background options based on theme
        filterBackgroundOptions(themeName);
        
        // Special handling for white theme - automatically set background to black
        if (themeName === 'white') {
            changeBackground('black');
            // Update the background dropdown to reflect the change
            const bgSelect = document.getElementById('bg-select');
            if (bgSelect) {
                bgSelect.value = 'black';
            }
        } else if (themeName === 'black') {
            // For black theme, only allow grey and white backgrounds
            const currentBackground = localStorage.getItem('selectedBackground') || 'grey';
            if (currentBackground === 'black') {
                changeBackground('grey');
                const bgSelect = document.getElementById('bg-select');
                if (bgSelect) {
                    bgSelect.value = 'grey';
                }
            } else {
                changeBackground(currentBackground);
            }
        } else {
            // For other themes, preserve the current background setting
            const currentBackground = localStorage.getItem('selectedBackground') || 'black';
            changeBackground(currentBackground);
        }
        
        // Save theme preference
        localStorage.setItem('selectedTheme', themeName);
        
        // Dispatch custom event to notify sketch page of theme change
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: themeName, background: localStorage.getItem('selectedBackground') || 'black' }
        }));
        
        console.log(`Theme changed to: ${themeName}`);
    }
}

// Change background
function changeBackground(bgColor) {
    const root = document.documentElement;
    if (bgColor === 'white') {
        root.style.setProperty('--background-color', '#FFFFFF');
        root.style.setProperty('--text-color', '#000000');
        root.style.setProperty('--border-color', '#CCCCCC');
        root.style.setProperty('--frame-background', '#FFFFFF');
    } else if (bgColor === 'grey') {
        root.style.setProperty('--background-color', '#B0B0B0');
        root.style.setProperty('--text-color', '#000000');
        root.style.setProperty('--border-color', '#909090');
        root.style.setProperty('--frame-background', '#B0B0B0');
    } else {
        // Default to black
        root.style.setProperty('--background-color', '#000000');
        root.style.setProperty('--text-color', '#FFFFFF');
        root.style.setProperty('--border-color', '#333');
        root.style.setProperty('--frame-background', '#000000');
    }
    
    // Filter theme options based on background
    filterThemeOptions(bgColor);
    
    // Save background preference
    localStorage.setItem('selectedBackground', bgColor);
    
    // Dispatch custom event to notify sketch page of background change
    window.dispatchEvent(new CustomEvent('backgroundChanged', {
        detail: { 
            background: bgColor, 
            theme: localStorage.getItem('selectedTheme') || 'orange' 
        }
    }));
    
    console.log(`Background changed to: ${bgColor}`);
}

// Filter background options based on theme
function filterBackgroundOptions(themeName) {
    const bgSelect = document.getElementById('bg-select');
    if (!bgSelect) return;
    
    // Store current selection
    const currentValue = bgSelect.value;
    
    // Clear all options
    bgSelect.innerHTML = '';
    
    if (themeName === 'black') {
        // Black theme: only grey and white backgrounds
        bgSelect.innerHTML = '<option value="grey">Grey</option><option value="white">White</option>';
    } else if (themeName === 'white') {
        // White theme: only black background
        bgSelect.innerHTML = '<option value="black">Black</option>';
    } else {
        // Color themes (orange, blue, green, purple): only black and white backgrounds
        bgSelect.innerHTML = '<option value="black">Black</option><option value="white">White</option>';
    }
    
    // Restore selection if it's still valid, otherwise select first option
    if (bgSelect.querySelector(`option[value="${currentValue}"]`)) {
        bgSelect.value = currentValue;
    } else {
        bgSelect.selectedIndex = 0;
    }
}

// Filter theme options based on background
function filterThemeOptions(bgColor) {
    const themeSelect = document.getElementById('theme-select');
    if (!themeSelect) return;
    
    // Store current selection
    const currentValue = themeSelect.value;
    
    // Clear all options
    themeSelect.innerHTML = '';
    
    if (bgColor === 'grey') {
        // Grey background: only black and white themes
        themeSelect.innerHTML = '<option value="black">Black</option><option value="white">White</option>';
    } else {
        // Other backgrounds: all themes available
        themeSelect.innerHTML = '<option value="orange">Orange</option><option value="blue">Blue</option><option value="green">Green</option><option value="purple">Purple</option><option value="pink">Pink</option><option value="white">White</option><option value="black">Black</option>';
    }
    
    // Restore selection if it's still valid, otherwise select first option
    if (themeSelect.querySelector(`option[value="${currentValue}"]`)) {
        themeSelect.value = currentValue;
    } else {
        themeSelect.selectedIndex = 0;
    }
}

// Load saved theme
function loadSavedTheme() {
    const savedTheme = localStorage.getItem('selectedTheme') || 'orange';
    const savedBackground = localStorage.getItem('selectedBackground') || 'black';
    const themeSelect = document.getElementById('theme-select');
    const bgSelect = document.getElementById('bg-select');
    
    if (themeSelect && bgSelect) {
        // Set the values first
        themeSelect.value = savedTheme;
        bgSelect.value = savedBackground;
        
        // Apply the theme and background
        changeTheme(savedTheme);
        changeBackground(savedBackground);
    }
}

// Make functions globally available
window.changeTheme = changeTheme;
window.changeBackground = changeBackground;
window.loadSavedTheme = loadSavedTheme;
