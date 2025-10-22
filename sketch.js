 let studentName = '';
let nameInput; // Global variable for name input
let classList = []; // Array to store student names from class list
let p5CategoryCheckboxes = []; // Global array to store p5.js checkbox elements
let isGenerating = false;
let generationStep = 0;
let audioCtx;
let scrambleInterval = null;
let revealInterval = null;
let shouldStop = false;
let isGenerationComplete = false;
let selectedMainCategory = null;
let saveButton;
let unusedPrompts = {
    AGE: [],
    STATUS: [],
    STRENGTH: [],
    WEAKNESS: []
};
let selectedSubcategory = null;
let usedAgeSubcategories = new Set();
let usedPrompts = {
    STATUS: new Set(),
    STRENGTH: new Set(),
    WEAKNESS: new Set()
};

// Add at the top of your file
let DEBUG = true;

// Add at the top with your other state variables
let showInstructions = true;

// Add at the top with other state variables
let categoryPromptCounts = {};

// Add at the top with other state variables
let allFirstPromptOptions = [];
let unusedFirstPrompts = new Set();
let firstPromptIndex = 0;

// Add constraint setting
let constraintEnabled = true;
// promptCount removed - completion is now based on student list processing

// Add selected category for generation
let selectedCategory = null;
let usedCategories = new Set(); // Track which categories have been used in the current cycle
let isAnimating = false; // Track if an animation is currently running
let shuffledPromptTypes = []; // Store the shuffled order of prompt types for the current generation
let globalUsedPrompts = {}; // Track used prompts across ALL categories
let generatedCount = 0; // Track how many prompts have been generated
let prevStudentButton; // < arrow button
let nextStudentButton; // > arrow button
let currentStudentIndex = 0; // Index of current student in class list
let isManualNameEntry = false; // Track if user manually typed a name
let classReport = []; // Array to store all student prompt data
let allStudents = []; // Array to track all students (both drawn and not drawn)
let drawnStudents = []; // Array to track students who have had prompts drawn
let recordButton; // Record button for screenshots
let downloadReportButton; // Download class report button
let resetReportButton; // Reset class report button
let controlPanel; // Control panel container
let controlPanelVisible = true;
let controlPanelToggle; // Toggle button for control panel

// Control panel positioning constants
const CONTROL_PANEL_OFFSET = 140;  // Position panel right next to toggle button
const TOGGLE_BUTTON_OFFSET = 50;
let uniqueStudentsProcessed = new Set(); // Track which students have been processed
let totalUniqueStudents = 0; // Total number of unique students (original class list only)
let manuallyAddedStudents = []; // Track manually added students for report
let originalClassList = []; // Track original uploaded class list separately
let addStudentButton; // + button for adding students mid-session

// Default styling
const DEFAULT_COLORS = {
    BACKGROUND: '#000000',
    TEXT: '#FFFFFF',
    HIGHLIGHT: '#33FF33',
    DIM: '#006600',
    ACCENT: '#00CC00'
};
const DEFAULT_FONT = 'VT323';

function debugLog(...args) {
    if (DEBUG) {
        console.log(...args);
    }
}

// Animation timing
const TIMING = {
    SCRAMBLE_SPEED: 50,
    REVEAL_SPEED: 50,
    SCRAMBLE_CYCLES: 15,
    PAUSE_BETWEEN: 200
}

// Sound settings
const SOUND = {
    SCRAMBLE: { FREQUENCY: 440, DURATION: 15 },
    REVEAL: { FREQUENCY: 600, DURATION: 25 },
    FINAL: { FREQUENCY: 1200, DURATION: 100 },
    VOLUME: 0.03
};

let categories = {};
let currentPrompts = {};

// Default rotating characters
function getRotatingChars() {
    return ['█', '▀', '▄', '▌', '▐', '░', '▒', '▓'];
}

// Default color getter
function getThemeColors() {
    return DEFAULT_COLORS;
}

// Theme management removed - now controlled by editor.js

// Theme management functions removed - now controlled by editor.js

// Function to apply theme changes from editor
function applyThemeFromEditor(themeName, bgColor) {
    console.log('Applying theme from editor:', themeName, bgColor);
    
    // Load theme from editor's localStorage
    const editorTheme = localStorage.getItem('selectedTheme') || 'orange';
    const editorBackground = localStorage.getItem('selectedBackground') || 'black';
    
    // Apply the theme and background by reading from editor's localStorage
    // This ensures we're always in sync with the editor
    const root = document.documentElement;
    
    // Apply background first
    if (editorBackground === 'white') {
        root.style.setProperty('--background-color', '#FFFFFF');
        root.style.setProperty('--text-color', '#000000');
        root.style.setProperty('--border-color', '#CCCCCC');
        root.style.setProperty('--frame-background', '#FFFFFF');
    } else if (editorBackground === 'grey') {
        root.style.setProperty('--background-color', '#808080');
        root.style.setProperty('--text-color', '#FFFFFF');
        root.style.setProperty('--border-color', '#A0A0A0');
        root.style.setProperty('--frame-background', '#808080');
    } else { // black
        root.style.setProperty('--background-color', '#000000');
        root.style.setProperty('--text-color', '#FFFFFF');
        root.style.setProperty('--border-color', '#333');
        root.style.setProperty('--frame-background', '#000000');
    }
    
    // Apply theme colors (we'll need to define these based on editor's theme system)
    // For now, we'll use the same theme definitions as editor.js
    const themes = {
        orange: {
            '--primary-color': '#D2691E',
            '--primary-hover': '#CD853F',
            '--primary-shadow': 'rgba(210, 105, 30, 0.3)',
            '--primary-shadow-hover': 'rgba(210, 105, 30, 0.5)',
            '--primary-shadow-light': 'rgba(210, 105, 30, 0.1)',
            '--accent-color': '#FF7F7F',
            '--delete-color': '#FF6B6B',
            '--frame-color': '#D2691E',
            '--frame-border': '#D2691E'
        },
        blue: {
            '--primary-color': '#4A90E2',
            '--primary-hover': '#6BB6FF',
            '--primary-shadow': 'rgba(74, 144, 226, 0.3)',
            '--primary-shadow-hover': 'rgba(74, 144, 226, 0.5)',
            '--primary-shadow-light': 'rgba(74, 144, 226, 0.1)',
            '--accent-color': '#7FB3FF',
            '--delete-color': '#FF6B6B',
            '--frame-color': '#4A90E2',
            '--frame-border': '#4A90E2'
        },
        green: {
            '--primary-color': '#4CAF50',
            '--primary-hover': '#66BB6A',
            '--primary-shadow': 'rgba(76, 175, 80, 0.3)',
            '--primary-shadow-hover': 'rgba(76, 175, 80, 0.5)',
            '--primary-shadow-light': 'rgba(76, 175, 80, 0.1)',
            '--accent-color': '#81C784',
            '--delete-color': '#FF6B6B',
            '--frame-color': '#4CAF50',
            '--frame-border': '#4CAF50'
        },
        purple: {
            '--primary-color': '#9C27B0',
            '--primary-hover': '#BA68C8',
            '--primary-shadow': 'rgba(156, 39, 176, 0.3)',
            '--primary-shadow-hover': 'rgba(156, 39, 176, 0.5)',
            '--primary-shadow-light': 'rgba(156, 39, 176, 0.1)',
            '--accent-color': '#CE93D8',
            '--delete-color': '#FF6B6B',
            '--frame-color': '#9C27B0',
            '--frame-border': '#9C27B0'
        },
        pink: {
            '--primary-color': '#E91E63',
            '--primary-hover': '#F06292',
            '--primary-shadow': 'rgba(233, 30, 99, 0.3)',
            '--primary-shadow-hover': 'rgba(233, 30, 99, 0.5)',
            '--primary-shadow-light': 'rgba(233, 30, 99, 0.1)',
            '--accent-color': '#F8BBD9',
            '--delete-color': '#FF6B6B',
            '--frame-color': '#E91E63',
            '--frame-border': '#E91E63'
        },
        white: {
            '--primary-color': '#FFFFFF',
            '--primary-hover': '#F0F0F0',
            '--primary-shadow': 'rgba(255, 255, 255, 0.3)',
            '--primary-shadow-hover': 'rgba(255, 255, 255, 0.5)',
            '--primary-shadow-light': 'rgba(255, 255, 255, 0.1)',
            '--accent-color': '#E0E0E0',
            '--delete-color': '#FF6B6B',
            '--frame-color': '#FFFFFF',
            '--frame-border': '#FFFFFF'
        },
        black: {
            '--primary-color': '#000000',
            '--primary-hover': '#333333',
            '--primary-shadow': 'rgba(0, 0, 0, 0.3)',
            '--primary-shadow-hover': 'rgba(0, 0, 0, 0.5)',
            '--primary-shadow-light': 'rgba(0, 0, 0, 0.1)',
            '--accent-color': '#404040',
            '--delete-color': '#FF6B6B',
            '--frame-color': '#000000',
            '--frame-border': '#000000'
        }
    };
    
    const theme = themes[editorTheme];
    if (theme) {
        Object.keys(theme).forEach(key => {
            root.style.setProperty(key, theme[key]);
        });
    }
    
    console.log('Theme applied from editor:', editorTheme, editorBackground);
}

// Function to load initial theme when sketch starts
function loadInitialThemeFromEditor() {
    console.log('Loading initial theme from editor');
    const editorTheme = localStorage.getItem('selectedTheme') || 'orange';
    const editorBackground = localStorage.getItem('selectedBackground') || 'black';
    applyThemeFromEditor(editorTheme, editorBackground);
}

// Apply theme immediately on page load to prevent flashing
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - applying theme immediately');
    loadInitialThemeFromEditor();
});

// Listen for localStorage changes to refresh interest section
window.addEventListener('storage', (e) => {
    if (e.key === 'prompt1InterestsMode') {
        console.log('DEBUG: prompt1InterestsMode changed, refreshing interest section');
        refreshInterestSection();
    }
});

// Also check periodically for changes (in case of same-tab updates)
let lastPrompt1InterestsMode = false;
// Get initial value
const initialData = localStorage.getItem('promptCategories');
if (initialData) {
    try {
        const parsedData = JSON.parse(initialData);
        lastPrompt1InterestsMode = parsedData.prompt1InterestsMode === true;
    } catch (e) {
        console.error('Error parsing initial prompt data:', e);
    }
}
console.log('DEBUG: Initial prompt1InterestsMode:', lastPrompt1InterestsMode);

setInterval(() => {
    let currentPrompt1InterestsMode = false;
    const promptData = localStorage.getItem('promptCategories');
    if (promptData) {
        try {
            const parsedData = JSON.parse(promptData);
            currentPrompt1InterestsMode = parsedData.prompt1InterestsMode === true;
        } catch (e) {
            console.error('Error parsing prompt data for polling:', e);
        }
    }
    
    if (currentPrompt1InterestsMode !== lastPrompt1InterestsMode) {
        console.log('DEBUG: prompt1InterestsMode changed via polling, refreshing interest section');
        console.log('DEBUG: Old value:', lastPrompt1InterestsMode, 'New value:', currentPrompt1InterestsMode);
        lastPrompt1InterestsMode = currentPrompt1InterestsMode;
        refreshInterestSection();
    }
}, 1000); // Check every second

// Student interest selection functions
function refreshInterestSection() {
    // This function can be called to refresh the interest section visibility
    populateInterestCheckboxes();
    updateInterestSelection();
}

function populateInterestCheckboxes() {
    const interestCheckboxes = document.getElementById('interest-checkboxes');
    if (!interestCheckboxes) {
        console.log('DEBUG: interest-checkboxes element not found');
        return;
    }
    
    // Check if prompt1InterestsMode is enabled - look in the main prompt data
    let prompt1InterestsMode = false;
    const promptData = localStorage.getItem('promptCategories');
    if (promptData) {
        try {
            const parsedData = JSON.parse(promptData);
            prompt1InterestsMode = parsedData.prompt1InterestsMode === true;
        } catch (e) {
            console.error('Error parsing prompt data for interests mode:', e);
        }
    }
    const interestContainer = interestCheckboxes.parentElement;
    
    console.log('DEBUG: populateInterestCheckboxes called');
    console.log('DEBUG: prompt1InterestsMode from localStorage:', localStorage.getItem('prompt1InterestsMode'));
    console.log('DEBUG: prompt1InterestsMode boolean:', prompt1InterestsMode);
    console.log('DEBUG: interestContainer found:', !!interestContainer);
    
    if (!prompt1InterestsMode) {
        // Hide the interest selection section if mode is disabled
        console.log('DEBUG: Hiding interest section');
        interestContainer.style.display = 'none';
        return;
    } else {
        // Show the interest selection section if mode is enabled
        console.log('DEBUG: Showing interest section');
        interestContainer.style.display = 'block';
        console.log('DEBUG: Interest container display set to block');
    }
    
    // Clear existing category checkboxes (keep "All Categories")
    const existingCheckboxes = interestCheckboxes.querySelectorAll('.category-interest-checkbox');
    existingCheckboxes.forEach(checkbox => checkbox.parentElement.remove());
    p5CategoryCheckboxes = []; // Reset the array
    
    // Get criterion labels from the global variable (loaded in loadPromptsFromLocalStorage)
    const criterionLabels = window.criterionLabels || ['', '', '', ''];
    
    console.log('DEBUG: Criterion labels found:', criterionLabels);
    console.log('DEBUG: Categories object:', categories);
    console.log('DEBUG: Categories keys:', Object.keys(categories));
    console.log('DEBUG: prompt1InterestsMode from parsed data:', prompt1InterestsMode);
    console.log('DEBUG: Raw localStorage promptCategories:', localStorage.getItem('promptCategories'));
    
    // Check if any criterion labels have actual content
    const hasAnyLabels = criterionLabels.some(label => label && label.trim().length > 0);
    if (!hasAnyLabels) {
        console.log('DEBUG: No criterion labels with content found');
        return;
    }
    
    // Check which categories have content before creating checkboxes
    const categoriesWithContent = [];
    
    criterionLabels.forEach((label, index) => {
        const categoryLetter = String.fromCharCode(65 + index); // A, B, C, D
        
        // Check if this category has content in any prompt column
        let hasContent = false;
        if (categories && Object.keys(categories).length > 0) {
            Object.keys(categories).forEach(promptType => {
                if (promptType !== 'objective' && promptType !== 'prompt1InterestsMode') {
                    const categoryData = categories[promptType];
                    if (categoryData && categoryData[categoryLetter]) {
                        // Check if the category has any non-empty prompts
                        const prompts = categoryData[categoryLetter];
                        if (Array.isArray(prompts) && prompts.length > 0) {
                            const hasNonEmptyPrompts = prompts.some(prompt => 
                                prompt && prompt.trim().length > 0
                            );
                            if (hasNonEmptyPrompts) {
                                hasContent = true;
                            }
                        }
                    }
                }
            });
        }
        
        // Only include category if it has content AND the criterion label is not empty
        if (hasContent && label && label.trim().length > 0) {
            categoriesWithContent.push({
                label: label.trim(),
                categoryLetter: categoryLetter,
                index: index
            });
            console.log('DEBUG: Category', categoryLetter, 'has content and label "' + label.trim() + '", will be included');
        } else {
            console.log('DEBUG: Category', categoryLetter, 'is empty or has no label, will be excluded');
        }
    });
    
    console.log('DEBUG: Categories with content:', categoriesWithContent);
    
    // If no categories have content, hide the interest section
    if (categoriesWithContent.length === 0) {
        console.log('DEBUG: No categories have content, hiding interest section');
        interestContainer.style.display = 'none';
        return;
    }
    
    // Create checkboxes only for categories with content
    categoriesWithContent.forEach((categoryInfo) => {
        const { label, categoryLetter, index } = categoryInfo;
        const displayName = label;
        
        const categoryDiv = createDiv('');
        categoryDiv.parent(interestCheckboxes);
        categoryDiv.className = 'category-interest-checkbox';
        categoryDiv.style('display', 'flex');
        categoryDiv.style('align-items', 'center');
        categoryDiv.style('margin-bottom', '4px');
        
        // Create custom retro checkbox
        const checkbox = createDiv('');
        checkbox.parent(categoryDiv);
        checkbox.class('category-checkbox');
        checkbox.elt.className = 'category-checkbox'; // Set class on actual DOM element
        checkbox.attribute('data-category', categoryLetter);
        checkbox.attribute('data-checked', 'false');
        
        // Store reference to p5.js element
        p5CategoryCheckboxes.push(checkbox);
        checkbox.style('width', '12px');
        checkbox.style('height', '12px');
        checkbox.style('border', '1px solid var(--primary-color)');
        checkbox.style('background-color', 'var(--background-color)');
        checkbox.style('margin-right', '6px');
        checkbox.style('cursor', 'pointer');
        checkbox.style('position', 'relative');
        
        // No checkmark needed - just filled box
        
        const labelElement = createDiv(displayName);
        labelElement.parent(categoryDiv);
        labelElement.style('color', 'var(--primary-color)');
        labelElement.style('font-size', '10px');
        labelElement.style('cursor', 'pointer');
        labelElement.mousePressed(() => {
            console.log('DEBUG: Individual checkbox clicked via label');
            const isChecked = checkbox.attribute('data-checked') === 'true';
            console.log('DEBUG: Current state:', isChecked, 'switching to:', !isChecked);
            checkbox.attribute('data-checked', !isChecked);
            if (!isChecked) {
                checkbox.style('background-color', 'var(--primary-color)');
                console.log('DEBUG: Set to checked (orange)');
            } else {
                checkbox.style('background-color', 'var(--background-color)');
                console.log('DEBUG: Set to unchecked (black)');
            }
            
            // IMPORTANT: Uncheck "All Categories" when individual category is selected
            const allCategoriesCheckbox = document.getElementById('all-categories-checkbox');
            if (allCategoriesCheckbox) {
                allCategoriesCheckbox.setAttribute('data-checked', 'false');
                allCategoriesCheckbox.style.backgroundColor = 'var(--background-color)';
                console.log('DEBUG: Unchecked All Categories');
            }
            
            updateInterestSelection();
        });
        
        // Handle checkbox click
        checkbox.mousePressed(() => {
            console.log('DEBUG: Individual checkbox clicked directly');
            const isChecked = checkbox.attribute('data-checked') === 'true';
            console.log('DEBUG: Current state:', isChecked, 'switching to:', !isChecked);
            checkbox.attribute('data-checked', !isChecked);
            if (!isChecked) {
                checkbox.style('background-color', 'var(--primary-color)');
                console.log('DEBUG: Set to checked (orange)');
            } else {
                checkbox.style('background-color', 'var(--background-color)');
                console.log('DEBUG: Set to unchecked (black)');
            }
            
            // IMPORTANT: Uncheck "All Categories" when individual category is selected
            const allCategoriesCheckbox = document.getElementById('all-categories-checkbox');
            if (allCategoriesCheckbox) {
                allCategoriesCheckbox.setAttribute('data-checked', 'false');
                allCategoriesCheckbox.style.backgroundColor = 'var(--background-color)';
                console.log('DEBUG: Unchecked All Categories');
            }
            
            updateInterestSelection();
            console.log('Category checkbox changed, current selection:', getSelectedInterests());
        });
    });
}

function updateInterestSelection() {
    const allCategoriesCheckbox = document.getElementById('all-categories-checkbox');
    
    if (!allCategoriesCheckbox) return;
    
    // Check if prompt1InterestsMode is enabled - look in the main prompt data
    let prompt1InterestsMode = false;
    const promptData = localStorage.getItem('promptCategories');
    if (promptData) {
        try {
            const parsedData = JSON.parse(promptData);
            prompt1InterestsMode = parsedData.prompt1InterestsMode === true;
        } catch (e) {
            console.error('Error parsing prompt data for interests mode:', e);
        }
    }
    
    if (!prompt1InterestsMode) {
        // Default to all categories when interest mode is disabled
        localStorage.setItem('selectedInterests', 'all');
        return;
    }
    
    console.log('DEBUG: Individual checkboxes found:', p5CategoryCheckboxes.length);
    console.log('DEBUG: All categories checkbox checked:', allCategoriesCheckbox.getAttribute('data-checked'));
    
    if (allCategoriesCheckbox.getAttribute('data-checked') === 'true') {
        // If "All Categories" is checked, ensure all individual categories are OFF
        console.log('DEBUG: All Categories is checked - forcing individual categories OFF');
        p5CategoryCheckboxes.forEach(checkbox => {
            checkbox.attribute('data-checked', 'false');
            checkbox.style('background-color', 'var(--background-color)');
        });
        // Store that all categories are selected
        localStorage.setItem('selectedInterests', 'all');
        console.log('All categories selected - all individual categories OFF');
    } else {
        // Check if any individual categories are selected
        const selectedCategories = p5CategoryCheckboxes
            .filter(checkbox => checkbox.attribute('data-checked') === 'true')
            .map(checkbox => checkbox.attribute('data-category'));
        
        console.log('DEBUG: Selected categories before filtering:', selectedCategories);
        
        if (selectedCategories.length === 0) {
            // If no categories selected, default back to "All Categories"
            allCategoriesCheckbox.setAttribute('data-checked', 'true');
            allCategoriesCheckbox.style.backgroundColor = 'var(--primary-color)';
            // All categories checked
            localStorage.setItem('selectedInterests', 'all');
            console.log('No individual categories selected - defaulting to all categories');
        } else if (selectedCategories.length === p5CategoryCheckboxes.length) {
            // If ALL individual categories are selected, switch to "All Categories"
            console.log('DEBUG: All individual categories selected, switching to "All Categories"');
            console.log('DEBUG: selectedCategories.length:', selectedCategories.length, 'p5CategoryCheckboxes.length:', p5CategoryCheckboxes.length);
            allCategoriesCheckbox.setAttribute('data-checked', 'true');
            allCategoriesCheckbox.style.backgroundColor = 'var(--primary-color)';
            // Uncheck all individual categories
            p5CategoryCheckboxes.forEach(checkbox => {
                checkbox.attribute('data-checked', 'false');
                checkbox.style('background-color', 'var(--background-color)');
            });
            localStorage.setItem('selectedInterests', 'all');
            console.log('All individual categories selected - switching to "All Categories"');
        } else {
            // Store selected categories
            localStorage.setItem('selectedInterests', JSON.stringify(selectedCategories));
            console.log('Individual categories selected:', selectedCategories);
        }
    }
    
    console.log('Interest selection updated:', localStorage.getItem('selectedInterests'));
}

function getSelectedInterests() {
    const selectedInterests = localStorage.getItem('selectedInterests');
    console.log('getSelectedInterests - raw value:', selectedInterests);
    
    if (!selectedInterests) {
        console.log('getSelectedInterests - no value, returning all');
        return 'all';
    }
    
    if (selectedInterests === 'all') {
        console.log('getSelectedInterests - returning all');
        return 'all';
    }
    
    try {
        const parsed = JSON.parse(selectedInterests);
        console.log('getSelectedInterests - returning parsed:', parsed);
        return parsed;
    } catch (e) {
        console.log('getSelectedInterests - parse error, returning all');
        return 'all';
    }
}

// Update spacing to use relative values
const SPACING = {
    TOP_MARGIN: 0.05,        // 5% of height
    OBJECTIVE_MARGIN: 0.12,  // 12% of height
    PROMPT_START: 0.45,      // 25% of height
    PROMPT_SPACING: 0.06,    // 12% of height between prompts
    CATEGORY_OFFSET: 0.45,   // 45% of width
    PROMPT_OFFSET: 0.48,     // 48% of width
    BOTTOM_MARGIN: 0.05      // 5% of height
};

// Update font sizes to be dynamic
const FONT_SIZES = {
    NAME: () => min(width, height) * 0.08,
    OBJECTIVE: () => min(width, height) * 0.04,
    PROMPTS: () => min(width, height) * 0.09,
    CATEGORY: () => min(width, height) * 0.06,
    INSTRUCTIONS: () => min(width, height) * 0.03,
    INPUT: () => min(width, height) * 0.03,
    BUTTON: () => min(width, height) * 0.04
};

// Update button sizes to be dynamic
const BUTTON_SIZES = {
    WIDTH: () => min(width * 0.25, 300),    // 25% of width, max 300px (wider for name field)
    HEIGHT: () => min(height * 0.06, 50),    // 6% of height, max 50px
    MARGIN: () => min(width * 0.03, 40),     // 3% of width, max 40px
    BOTTOM_MARGIN: () => min(height * 0.05, 40), // 5% of height, max 40px
    ELEMENT_SPACING: () => min(height * 0.02, 20) // Minimum spacing between elements
};

function cleanupCorruptedData() {
    // Clean up any corrupted data in localStorage
    try {
        const currentData = localStorage.getItem('promptCategories');
        if (currentData) {
            const data = JSON.parse(currentData);
            
            // Clean up allStudents array
            if (data.allStudents && Array.isArray(data.allStudents)) {
                data.allStudents = data.allStudents.filter(name => 
                    typeof name === 'string' && 
                    name.length > 1 && 
                    name.trim().length > 0 &&
                    !/^[a-zA-Z]$/.test(name)
                );
            }
            
            // Clean up drawnStudents array
            if (data.drawnStudents && Array.isArray(data.drawnStudents)) {
                data.drawnStudents = data.drawnStudents.filter(name => 
                    typeof name === 'string' && 
                    name.length > 1 && 
                    name.trim().length > 0 &&
                    !/^[a-zA-Z]$/.test(name)
                );
            }
            
            // Save cleaned data back
            localStorage.setItem('promptCategories', JSON.stringify(data));
            console.log('Cleaned up corrupted data from localStorage');
        }
    } catch (error) {
        console.error('Error cleaning up corrupted data:', error);
    }
}

function preload() {
    loadPromptsFromLocalStorage();
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    textFont('VT323');
    textAlign(CENTER, CENTER);
    
    // Clean up any corrupted data first
    cleanupCorruptedData();
    
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    studentName = '';
    
    // Add native E key handler as backup
    document.addEventListener('keydown', function(event) {
        if (event.key === 'e' || event.key === 'E') {
            // Don't trigger if user is typing in an input field
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.isContentEditable) {
                return;
            }
            
            event.preventDefault();
            event.stopPropagation();
            console.log('E key handler triggered - redirecting to editor.html');
            console.log('Current URL:', window.location.href);
            saveCurrentStateToLocalStorage();
            // Use a small delay to ensure the save completes
            setTimeout(() => {
                console.log('Redirecting to editor.html now');
                window.location.href = 'editor.html?from=sketch';
            }, 50);
        }
    });

    // Function for the Edit Prompts button
    function goToEditor() {
        console.log('Edit Prompts button clicked - redirecting to editor.html');
        saveCurrentStateToLocalStorage();
        setTimeout(() => {
            console.log('Redirecting to editor.html from button');
            window.location.href = 'editor.html?from=sketch';
        }, 50);
    }
    
    // Listen for theme changes from editor
    window.addEventListener('themeChanged', function(event) {
        console.log('Theme change event received from editor:', event.detail);
        const { theme, background } = event.detail;
        applyThemeFromEditor(theme, background);
    });
    
    // Listen for background changes from editor
    window.addEventListener('backgroundChanged', function(event) {
        console.log('Background change event received from editor:', event.detail);
        const { background, theme } = event.detail;
        applyThemeFromEditor(theme, background);
    });
    
    // Listen for prompt data updates from editor
    window.addEventListener('promptDataUpdated', function(event) {
        console.log('Prompt data updated event received from editor:', event.detail);
        // Reload data from localStorage
    loadPromptsFromLocalStorage();
        checkCategoryStructure();
        initializeUnusedPrompts();
        resetPrompts();
        
        // Add small delay to ensure data is fully processed before populating checkboxes
        setTimeout(() => {
            populateInterestCheckboxes();
            updateInterestSelection();
        }, 50);
    });
    
    // Load and check data with a delay to ensure editor has saved fresh data
    setTimeout(() => {
        loadPromptsFromLocalStorage();
        loadStudentNameFromLocalStorage();
    checkPromptData();
    }, 100); // Reduced delay since editor now saves fresh data immediately
    
    // Load initial theme from editor with a small delay to prevent flashing
    setTimeout(() => {
        loadInitialThemeFromEditor();
    }, 10);
    
    // Create retro toggle button for control panel
    controlPanelToggle = createButton('☰');
    // Position will be set by positionControlPanel() function
    controlPanelToggle.mousePressed(toggleControlPanel);
    controlPanelToggle.style('background-color', 'var(--background-color)');
    controlPanelToggle.style('border', '2px solid var(--primary-color)');
    controlPanelToggle.style('border-radius', '0px');
    controlPanelToggle.style('color', 'var(--primary-color)');
    controlPanelToggle.style('font-family', 'VT323, monospace');
    controlPanelToggle.style('font-size', '14px');
    controlPanelToggle.style('font-weight', 'bold');
    controlPanelToggle.style('width', '28px');
    controlPanelToggle.style('height', '28px');
    controlPanelToggle.style('cursor', 'pointer');
    controlPanelToggle.style('box-shadow', 'inset 1px 1px 0px var(--primary-color), inset -1px -1px 0px var(--primary-color)');
    controlPanelToggle.style('text-shadow', '1px 1px 0px var(--primary-shadow)');
    controlPanelToggle.style('transition', 'all 0.1s ease');
    
    // Add hover effects
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
    
    // Create Apple II-style control panel
    controlPanel = createDiv('');
    // Position will be set by positionControlPanel() function
    controlPanel.style('background-color', 'var(--background-color)');
    controlPanel.style('border', '2px solid var(--primary-color)');
    controlPanel.style('border-radius', '0px');
    controlPanel.style('padding', '6px');
    controlPanel.style('font-family', 'VT323, monospace');
    controlPanel.style('color', 'var(--text-color)');
    controlPanel.style('font-size', '12px');
    controlPanel.style('width', '100px');
    controlPanel.style('box-shadow', 'inset 1px 1px 0px var(--primary-color), inset -1px -1px 0px var(--primary-color), 2px 2px 0px var(--primary-shadow)');
    controlPanel.style('transition', 'all 0.3s ease-in-out');
    controlPanel.style('text-shadow', '1px 1px 0px var(--primary-shadow)');
    
    // Position control panel and toggle button
    positionControlPanel();
    
    // Add title
    const panelTitle = createDiv('CONTROL PANEL');
    panelTitle.parent(controlPanel);
    panelTitle.style('text-align', 'center');
    panelTitle.style('font-weight', 'bold');
    panelTitle.style('margin-bottom', '4px');
    panelTitle.style('color', 'var(--primary-color)');
    panelTitle.style('font-size', '14px');
    panelTitle.style('letter-spacing', '1px');
    
    // Theme controls removed - now controlled by editor.js
    
    // Add interest selection section
    const interestContainer = createDiv('');
    interestContainer.parent(controlPanel);
    interestContainer.style('margin-bottom', '4px');
    interestContainer.style('border-top', '1px solid var(--primary-color)');
    interestContainer.style('padding-top', '8px');
    
    const interestTitle = createDiv('STUDENT INTERESTS');
    interestTitle.parent(interestContainer);
    interestTitle.style('color', 'var(--primary-color)');
    interestTitle.style('font-size', '11px');
    interestTitle.style('font-weight', 'bold');
    interestTitle.style('margin-bottom', '4px');
    interestTitle.style('text-align', 'center');
    
    // Container for interest checkboxes
    const interestCheckboxes = createDiv('');
    interestCheckboxes.parent(interestContainer);
    interestCheckboxes.id('interest-checkboxes');
    
    // Initially hide the interest section - will be shown if prompt1InterestsMode is enabled
    interestContainer.hide();
    console.log('DEBUG: Interest container initially hidden');
    
    // "All Categories" option
    const allCategoriesDiv = createDiv('');
    allCategoriesDiv.parent(interestCheckboxes);
    allCategoriesDiv.style('display', 'flex');
    allCategoriesDiv.style('align-items', 'center');
    allCategoriesDiv.style('margin-bottom', '4px');
    
    // Create custom retro checkbox
    const allCategoriesCheckbox = createDiv('');
    allCategoriesCheckbox.parent(allCategoriesDiv);
    allCategoriesCheckbox.id('all-categories-checkbox');
    allCategoriesCheckbox.class('all-categories-checkbox');
    allCategoriesCheckbox.style('width', '12px');
    allCategoriesCheckbox.style('height', '12px');
    allCategoriesCheckbox.style('border', '1px solid var(--primary-color)');
    allCategoriesCheckbox.style('background-color', 'var(--primary-color)');
    allCategoriesCheckbox.style('margin-right', '6px');
    allCategoriesCheckbox.style('cursor', 'pointer');
    allCategoriesCheckbox.style('position', 'relative');
    allCategoriesCheckbox.attribute('data-checked', 'true');
    allCategoriesCheckbox.style('background-color', 'var(--primary-color)');
    
    // No checkmark needed - just filled box
    
    const allCategoriesLabel = createDiv('All Categories');
    allCategoriesLabel.parent(allCategoriesDiv);
    allCategoriesLabel.style('color', 'var(--primary-color)');
    allCategoriesLabel.style('font-size', '10px');
    allCategoriesLabel.style('cursor', 'pointer');
    allCategoriesLabel.mousePressed(() => {
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
    
    // Create screenshot button
    recordButton = createButton('SCREENSHOT');
    recordButton.parent(controlPanel);
    recordButton.mousePressed(takeScreenshot);
    recordButton.style('background-color', 'var(--background-color)');
    recordButton.style('color', 'var(--primary-color)');
    recordButton.style('font-family', 'VT323, monospace');
    recordButton.style('font-size', '11px');
    recordButton.style('width', '100%');
    recordButton.style('height', '22px');
    recordButton.style('border', '1px solid var(--primary-color)');
    recordButton.style('border-radius', '4px');
    recordButton.style('cursor', 'pointer');
    recordButton.style('margin-bottom', '4px');
    recordButton.style('text-align', 'center');
    recordButton.style('letter-spacing', '0.5px');
    
    // Add hover effect for screenshot button
    recordButton.mouseOver(() => {
        recordButton.style('background-color', 'var(--primary-color)');
        recordButton.style('color', 'var(--background-color)');
    });
    recordButton.mouseOut(() => {
        recordButton.style('background-color', 'var(--background-color)');
        recordButton.style('color', 'var(--primary-color)');
    });
    
    const bottomMargin = BUTTON_SIZES.BOTTOM_MARGIN();
    const elementHeight = BUTTON_SIZES.HEIGHT();
    const elementSpacing = BUTTON_SIZES.ELEMENT_SPACING();
    
    // Create name input with empty initial value
    nameInput = createInput('');
    
    // Initial positioning will be done after data is loaded
    
    // Add input event handler for single name entry - only update on blur/enter
    nameInput.input(() => {
        const newName = nameInput.value().trim();
        studentName = newName;
        isManualNameEntry = true; // Mark as manual entry
        
        // Don't add to allStudents on every keystroke - wait for completion
        console.log('DEBUG: Input value changed to:', newName);
    });
    
    // Add blur event handler to add complete names
    nameInput.elt.addEventListener('blur', () => {
        const newName = nameInput.value().trim();
        
        if (newName.length > 0) {
            // Add to allStudents if not already there
            if (!allStudents.includes(newName)) {
                allStudents.push(newName);
                currentStudentIndex = allStudents.length - 1; // Set to last added student
                console.log('DEBUG: Added new student on blur:', newName);
            } else {
                // Find existing student index
                currentStudentIndex = allStudents.indexOf(newName);
                console.log('DEBUG: Found existing student at index:', currentStudentIndex);
            }
            
            // Update total unique students count
            totalUniqueStudents = allStudents.length;
            
            console.log('DEBUG: allStudents after blur:', allStudents);
            console.log('DEBUG: totalUniqueStudents:', totalUniqueStudents);
            
            // Try to recall previous results for this student
            const hasResults = recallStudentResults(studentName);
            
            if (!hasResults) {
                // No previous results - clear prompts for new generation
                currentPrompts = {};
                isGenerationComplete = false;
                generationStep = 0;
                isGenerating = false;
                isAnimating = false;
            }
            
            // Update navigation buttons visibility
            positionNameInputAndButtons();
            
            saveCurrentStateToLocalStorage(); // Save to localStorage
        } else {
            // Empty name - clear everything
            studentName = '';
            currentPrompts = {};
            isGenerationComplete = false;
            generationStep = 0;
            isGenerating = false;
            isAnimating = false;
        }
        
        console.log('Name input completed:', studentName);
    });
    
    // Add enter key handler to add complete names
    nameInput.elt.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            const newName = nameInput.value().trim();
            
            if (newName.length > 0) {
                // Add to allStudents if not already there
                if (!allStudents.includes(newName)) {
                    allStudents.push(newName);
                    currentStudentIndex = allStudents.length - 1; // Set to last added student
                    console.log('DEBUG: Added new student on enter:', newName);
                } else {
                    // Find existing student index
                    currentStudentIndex = allStudents.indexOf(newName);
                    console.log('DEBUG: Found existing student at index:', currentStudentIndex);
                }
                
                // Update total unique students count
                totalUniqueStudents = allStudents.length;
                
                console.log('DEBUG: allStudents after enter:', allStudents);
                console.log('DEBUG: totalUniqueStudents:', totalUniqueStudents);
                
                // Try to recall previous results for this student
                const hasResults = recallStudentResults(studentName);
                
                if (!hasResults) {
                    // No previous results - clear prompts for new generation
                    currentPrompts = {};
                    isGenerationComplete = false;
                    generationStep = 0;
                    isGenerating = false;
                    isAnimating = false;
                }
                
                // Update navigation buttons visibility
                positionNameInputAndButtons();
                
                saveCurrentStateToLocalStorage(); // Save to localStorage
            }
            
            console.log('Name input completed on enter:', studentName);
        }
    });
    
    // No blur event handler needed - use plus button instead
    
    // Create navigation arrows (always create them)
    console.log('Class list length:', classList.length);
    
    // Calculate centered positioning for equal gaps
    const nameFieldWidth = BUTTON_SIZES.WIDTH();
    const arrowWidth = 30;
    const totalWidth = nameFieldWidth + (arrowWidth * 2) + 20; // 20px total gap (10px each side)
    const startX = (width - totalWidth) / 2;
    
    // Create previous student button (<)
    prevStudentButton = createButton('<');
    prevStudentButton.position(
        startX, 
        height - bottomMargin - (elementHeight * 2) - elementSpacing
    );
    prevStudentButton.mousePressed(prevStudent);
    
    // Create next student button (>)
    nextStudentButton = createButton('>');
    nextStudentButton.position(
        startX + arrowWidth + 10 + nameFieldWidth + 10, 
        height - bottomMargin - (elementHeight * 2) - elementSpacing
    );
    
    // Create add student button (+) - REMOVED for comma-separated names
    // addStudentButton = createButton('+');
    // addStudentButton.position(
    //     startX + arrowWidth + 10 + nameFieldWidth + 10 + arrowWidth + 10, 
    //     height - bottomMargin - (elementHeight * 2) - elementSpacing
    // );
    // addStudentButton.mousePressed(showAddSingleStudentDialog);
    
    nextStudentButton.mousePressed(nextStudent);
    
    // Create upload groups button
    // UPLOAD GROUPS button removed
    
    // Style navigation buttons
    [prevStudentButton, nextStudentButton].forEach(button => {
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
    });
    
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
    
    // Create class report button
    downloadReportButton = createButton('CLASS REPORT');
    downloadReportButton.parent(controlPanel);
    downloadReportButton.mousePressed(downloadClassReport);
    downloadReportButton.style('background-color', 'var(--background-color)');
    downloadReportButton.style('color', 'var(--primary-color)');
    downloadReportButton.style('font-family', 'VT323, monospace');
    downloadReportButton.style('font-size', '11px');
    downloadReportButton.style('width', '100%');
    downloadReportButton.style('height', '22px');
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
    
    // Create class list upload button
    const classListUploadButton = createButton('UPLOAD CLASS');
    classListUploadButton.parent(controlPanel);
    classListUploadButton.mousePressed(() => {
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
    classListUploadButton.style('font-size', '11px');
    classListUploadButton.style('width', '100%');
    classListUploadButton.style('height', '22px');
    classListUploadButton.style('border', '1px solid var(--primary-color)');
    classListUploadButton.style('border-radius', '4px');
    classListUploadButton.style('cursor', 'pointer');
    classListUploadButton.style('margin-bottom', '4px');
    classListUploadButton.style('text-align', 'center');
    classListUploadButton.style('letter-spacing', '0.5px');
    
    // Add hover effect for class list upload button
    classListUploadButton.mouseOver(() => {
        classListUploadButton.style('background-color', 'var(--primary-color)');
        classListUploadButton.style('color', 'var(--background-color)');
    });
    classListUploadButton.mouseOut(() => {
        classListUploadButton.style('background-color', 'var(--background-color)');
        classListUploadButton.style('color', 'var(--primary-color)');
    });
    
    // Create reset report button
    resetReportButton = createButton('RESET REPORT');
    resetReportButton.parent(controlPanel);
    resetReportButton.mousePressed(resetClassReport);
    resetReportButton.style('background-color', 'var(--background-color)');
    resetReportButton.style('color', 'var(--primary-color)');
    resetReportButton.style('font-family', 'VT323, monospace');
    resetReportButton.style('font-size', '11px');
    resetReportButton.style('width', '100%');
    resetReportButton.style('height', '22px');
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
    
    // Create Edit Prompts button
    const editPromptsButton = createButton('EDIT PROMPTS');
    editPromptsButton.parent(controlPanel);
    editPromptsButton.mousePressed(goToEditor);
    editPromptsButton.style('background-color', 'var(--background-color)');
    editPromptsButton.style('color', 'var(--primary-color)');
    editPromptsButton.style('font-family', 'VT323, monospace');
    editPromptsButton.style('font-size', '11px');
    editPromptsButton.style('width', '100%');
    editPromptsButton.style('height', '22px');
    editPromptsButton.style('border', '1px solid var(--primary-color)');
    editPromptsButton.style('border-radius', '4px');
    editPromptsButton.style('cursor', 'pointer');
    editPromptsButton.style('margin-bottom', '4px');
    editPromptsButton.style('text-align', 'center');
    editPromptsButton.style('letter-spacing', '0.5px');
    
    // Add hover effect for edit prompts button
    editPromptsButton.mouseOver(() => {
        editPromptsButton.style('background-color', 'var(--primary-color)');
        editPromptsButton.style('color', 'var(--background-color)');
    });
    editPromptsButton.mouseOut(() => {
        editPromptsButton.style('background-color', 'var(--background-color)');
        editPromptsButton.style('color', 'var(--primary-color)');
    });
    
    // Style name input with terminal colors
    nameInput.size(BUTTON_SIZES.WIDTH());
    nameInput.style('height', BUTTON_SIZES.HEIGHT() + 'px');
    nameInput.style('font-family', 'VT323, monospace');
    nameInput.style('font-size', FONT_SIZES.INPUT() + 'px');
    nameInput.style('color', 'var(--primary-color)');
    nameInput.style('background-color', 'var(--background-color)');
    nameInput.style('border', '1px solid var(--primary-color)');
    nameInput.style('padding', '5px 10px');
    nameInput.style('box-sizing', 'border-box');
    nameInput.attribute('placeholder', 'Enter student name here');
    
    checkAndClearCache();
    loadPromptsFromLocalStorage();
    checkCategoryStructure();
    initializeUnusedPrompts();
    resetPrompts();
    
    // Populate interest checkboxes with loaded categories
    // Use a small delay to ensure control panel elements are fully created
    setTimeout(() => {
        console.log('DEBUG: Calling populateInterestCheckboxes after control panel created');
        populateInterestCheckboxes();
        // Initialize interest selection state
        updateInterestSelection();
    }, 100);
    
    // Position name input after data is loaded
    positionNameInputAndButtons();
    
    // Update name input for no class list scenario
    updateNameInputForNoClassList();
    
    // Debug: Log final state after setup
    console.log('Setup complete. Categories loaded:', Object.keys(categories));
    console.log('Non-objective categories:', Object.keys(categories).filter(cat => cat !== 'objective'));
}

function saveImage() {
    if (studentName) {
        showInstructions = false;  // Hide instructions
        draw();  // Redraw once without instructions
        const sanitizedStudentName = studentName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
        const filename = `${sanitizedStudentName}_prompts`;
        saveCanvas(filename, 'png');
        showInstructions = true;   // Show instructions again
        draw();  // Redraw with instructions
    } else {
        alert('Student name is not set. Please enter a student name first.');
    }
}

function downloadResultsWithName() {
    if (studentName) {
        showInstructions = false;  // Hide instructions
        draw();  // Redraw once without instructions
        const sanitizedStudentName = studentName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
        const filename = `${sanitizedStudentName}_results`;
        saveCanvas(filename, 'png');
        showInstructions = true;   // Show instructions again
        draw();  // Redraw with instructions
        console.log('Downloaded results for student:', studentName);
    } else {
        alert('Student name is not set. Please enter a student name first.');
    }
}

function takeScreenshot() {
    if (studentName) {
        showInstructions = false;  // Hide instructions
        draw();  // Redraw once without instructions
        const sanitizedStudentName = studentName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `${sanitizedStudentName}_${timestamp}`;
        saveCanvas(filename, 'png');
        showInstructions = true;   // Show instructions again
        draw();  // Redraw with instructions
        console.log('Screenshot taken for student:', studentName);
    } else {
        alert('Student name is not set. Please enter a student name first.');
    }
}

function downloadClassReport() {
    console.log('DEBUG: downloadClassReport called');
    console.log('DEBUG: classReport length:', classReport.length);
    console.log('DEBUG: classReport:', classReport);
    console.log('DEBUG: classList length:', classList.length);
    console.log('DEBUG: classList:', classList);
    console.log('DEBUG: manuallyAddedStudents length:', manuallyAddedStudents.length);
    console.log('DEBUG: manuallyAddedStudents:', manuallyAddedStudents);
    console.log('DEBUG: originalClassList length:', originalClassList.length);
    console.log('DEBUG: originalClassList:', originalClassList);
    
    if (classReport.length === 0) {
        alert('No class report data available. Generate some prompts first.');
        return;
    }
    
    // Get current date and time for report header
    const now = new Date();
    const dateString = now.toLocaleDateString();
    const timeString = now.toLocaleTimeString();
    
    let reportText = `CLASS REPORT - ${dateString} at ${timeString}\n`;
    reportText += '================================\n\n';
    
    // Add objective if available
    if (categories.objective && categories.objective.trim() !== '') {
        reportText += `OBJECTIVE: ${categories.objective}\n`;
        reportText += '================================\n\n';
    }
    
    // Get all students from the classReport (these are the students who have generated prompts)
    const studentsWithData = classReport.map(s => s.name);
    const allStudentsList = [...new Set(allStudents)]; // Use the global allStudents array
    
    reportText += `Total Students: ${allStudentsList.length}\n`;
    reportText += `Students with Generated Prompts: ${classReport.length}\n`;
    reportText += '\n';
    
    // Add all students who have generated prompts
    if (classReport.length > 0) {
        reportText += '=== STUDENTS WITH GENERATED PROMPTS ===\n';
        classReport.forEach(student => {
            reportText += `${student.name}\n`;
            student.prompts.forEach(prompt => {
                reportText += `  ${prompt.label}: ${prompt.value}\n`;
            });
            reportText += '\n';
        });
    }
    
    // Add students with no data
    const studentsWithoutData = allStudentsList.filter(name => {
        const nameWithoutAsterisk = name.startsWith('*') ? name.substring(1) : name;
        return !studentsWithData.includes(name) && !studentsWithData.includes(nameWithoutAsterisk);
    });
    
    if (studentsWithoutData.length > 0) {
        reportText += '=== STUDENTS WITH NO GENERATED PROMPTS ===\n';
        studentsWithoutData.forEach(name => {
            reportText += `  - ${name}\n`;
        });
        reportText += '\n';
    }
    
    // Create and download text file
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ClassReport_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('Class report downloaded with all students');
}

function resetClassReport() {
    // Clear all data structures
    classReport = [];
    allStudents = [];
    drawnStudents = [];
    currentStudentIndex = 0;
    studentName = '';
    currentPrompts = {};
    isGenerationComplete = false;
    generationStep = 0;
    isGenerating = false;
    isAnimating = false;
    totalUniqueStudents = 0;
    manuallyAddedStudents = [];
    classList = [];
    originalClassList = [];
    
    // Clear input field
    if (nameInput) {
        nameInput.value('');
    }
    
    // Clear localStorage data completely
    try {
        localStorage.removeItem('promptCategories');
        console.log('Completely cleared localStorage');
    } catch (error) {
        console.error('Error clearing localStorage:', error);
    }
    
    // Update UI
    positionNameInputAndButtons();
    
    console.log('Class report reset - all data cleared');
    alert('Class report has been reset.');
}

function collectPromptData() {
    console.log('=== DEBUG: collectPromptData START ===');
    console.log('DEBUG: studentName:', studentName);
    console.log('DEBUG: currentPrompts:', currentPrompts);
    console.log('DEBUG: categories keys:', Object.keys(categories));
    console.log('DEBUG: classReport before:', classReport);
    
    if (!studentName) {
        console.log('DEBUG: No student name, returning');
        return;
    }
    
    // Get the current student's prompts
    const studentPrompts = [];
    Object.keys(categories).forEach(header => {
        console.log('DEBUG: Checking header:', header);
        if (header !== 'objective' && header !== 'prompt1InterestsMode' && currentPrompts[header]) {
            const promptValue = typeof currentPrompts[header] === 'object' 
                ? currentPrompts[header].revealed 
                : currentPrompts[header];
            console.log('DEBUG: Header', header, 'has prompt value:', promptValue);
            if (promptValue) {
                studentPrompts.push({
                    label: header,
                    value: promptValue
                });
                console.log('DEBUG: Added prompt:', header, '=', promptValue);
            }
        } else {
            console.log('DEBUG: Skipping header:', header, 'reason:', 
                header === 'objective' ? 'objective' : 
                header === 'prompt1InterestsMode' ? 'prompt1InterestsMode' : 
                'no currentPrompts[header]');
        }
    });
    
    console.log('DEBUG: Collected studentPrompts:', studentPrompts);
    
    // Store student name without asterisk in report
    const studentNameForReport = studentName.startsWith('*') ? studentName.substring(1) : studentName;
    console.log('DEBUG: studentNameForReport:', studentNameForReport);
    
    // Check if this student already exists in the report
    const existingStudentIndex = classReport.findIndex(student => student.name === studentNameForReport);
    console.log('DEBUG: existingStudentIndex:', existingStudentIndex);
    
    if (existingStudentIndex >= 0) {
        // Update existing student's prompts
        classReport[existingStudentIndex].prompts = studentPrompts;
        console.log('DEBUG: Updated existing student in report:', studentNameForReport);
    } else {
        // Add new student to report
        classReport.push({
            name: studentNameForReport,
            prompts: studentPrompts
        });
        console.log('DEBUG: Added new student to report:', studentNameForReport);
    }
    
    // Add to drawn students if not already there
    if (!drawnStudents.includes(studentNameForReport)) {
        drawnStudents.push(studentNameForReport);
        console.log('DEBUG: Added to drawnStudents:', studentNameForReport);
    }
    
    console.log('DEBUG: Final classReport length:', classReport.length);
    console.log('DEBUG: Final classReport:', JSON.stringify(classReport, null, 2));
    console.log('DEBUG: drawnStudents:', drawnStudents);
    console.log('=== DEBUG: collectPromptData END ===');
    console.log('Collected prompt data for:', studentName, studentPrompts);
}

function recallStudentResults(studentName) {
    const studentNameForReport = studentName.startsWith('*') ? studentName.substring(1) : studentName;
    
    // Find the student in the class report
    const studentData = classReport.find(student => student.name === studentNameForReport);
    
    if (studentData && studentData.prompts.length > 0) {
        // Restore the prompts to currentPrompts
        currentPrompts = {};
        studentData.prompts.forEach(prompt => {
            currentPrompts[prompt.label] = prompt.value;
        });
        
        // Mark as generation complete since we're showing existing results
        isGenerationComplete = true;
        generationStep = studentData.prompts.length;
        
        console.log('Recalled results for:', studentName, studentData.prompts);
        return true;
    }
    
    return false;
}

function updateStudentName() {
    studentName = nameInput.value();
    saveCurrentStateToLocalStorage();
}

function nextStudent() {
    if (allStudents.length > 0) {
        // Move to next student in the allStudents list
        currentStudentIndex = (currentStudentIndex + 1) % allStudents.length;
        studentName = allStudents[currentStudentIndex];
        
        // Update input field to show current student name
        if (nameInput) {
            nameInput.value(studentName);
        }
        isManualNameEntry = false; // Mark as programmatic change
        
        // Try to recall previous results for this student
        const hasResults = recallStudentResults(studentName);
        
        if (!hasResults) {
            // No previous results - clear prompts for new generation
            currentPrompts = {};
            isGenerationComplete = false;
            generationStep = 0;
            isGenerating = false;
            isAnimating = false;
        }
        
        // Clear any running intervals
        if (scrambleInterval) {
            clearInterval(scrambleInterval);
            scrambleInterval = null;
        }
        if (revealInterval) {
            clearInterval(revealInterval);
            revealInterval = null;
        }
        
        saveCurrentStateToLocalStorage();
        console.log('Switched to student:', studentName, '(', currentStudentIndex + 1, 'of', allStudents.length, ')');
    }
}

function prevStudent() {
    if (allStudents.length > 0) {
        // Move to previous student in the allStudents list
        currentStudentIndex = currentStudentIndex === 0 ? allStudents.length - 1 : currentStudentIndex - 1;
        studentName = allStudents[currentStudentIndex];
        
        // Update input field to show current student name
        if (nameInput) {
            nameInput.value(studentName);
        }
        isManualNameEntry = false; // Mark as programmatic change
        
        // Try to recall previous results for this student
        const hasResults = recallStudentResults(studentName);
        
        if (!hasResults) {
            // No previous results - clear prompts for new generation
            currentPrompts = {};
            isGenerationComplete = false;
            generationStep = 0;
            isGenerating = false;
            isAnimating = false;
        }
        
        // Clear any running intervals
        if (scrambleInterval) {
            clearInterval(scrambleInterval);
            scrambleInterval = null;
        }
        if (revealInterval) {
            clearInterval(revealInterval);
            revealInterval = null;
        }
        
        saveCurrentStateToLocalStorage();
        console.log('Switched to student:', studentName, '(', currentStudentIndex + 1, 'of', allStudents.length, ')');
    }
}


function showAddSingleStudentDialog() {
    
    // Create dialog overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10001;
        font-family: 'VT323', monospace;
    `;
    
    // Create dialog content
    const dialog = document.createElement('div');
    dialog.style.cssText = `
        background-color: #001100;
        border: 2px solid #66CDAA;
        border-radius: 10px;
        padding: 30px;
        color: #FFFFFF;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
    `;
    
    // Add title
    const title = document.createElement('h2');
    title.textContent = 'Upload Student Groups';
    title.style.cssText = `
        margin: 0 0 20px 0;
        color: #FFFFFF;
        font-size: 24px;
        font-weight: bold;
        text-align: center;
    `;
    
    // Add instructions
    const instructions = document.createElement('p');
    instructions.textContent = 'Choose how to add students:';
    instructions.style.cssText = `
        margin: 0 0 20px 0;
        color: #FFFFFF;
        font-size: 16px;
        text-align: center;
    `;
    
    // Create tab container
    const tabContainer = document.createElement('div');
    tabContainer.style.cssText = `
        display: flex;
        margin-bottom: 20px;
        border-bottom: 1px solid #66CDAA;
    `;
    
    // Create Text Input tab
    const textTab = document.createElement('button');
    textTab.textContent = 'Text Input';
    textTab.style.cssText = `
        flex: 1;
        padding: 10px;
        background-color: #001100;
        color: #FFFFFF;
        border: none;
        border-bottom: 2px solid #66CDAA;
        font-family: 'VT323', monospace;
        font-size: 16px;
        cursor: pointer;
    `;
    
    // Create CSV Upload tab
    const csvTab = document.createElement('button');
    csvTab.textContent = 'CSV Upload';
    csvTab.style.cssText = `
        flex: 1;
        padding: 10px;
        background-color: #001100;
        color: #66CDAA;
        border: none;
        border-bottom: 2px solid transparent;
        font-family: 'VT323', monospace;
        font-size: 16px;
        cursor: pointer;
    `;
    
    // Create content area
    const contentArea = document.createElement('div');
    contentArea.id = 'upload-content';
    
    // Text input content
    const textContent = document.createElement('div');
    textContent.id = 'text-content';
    textContent.style.cssText = 'display: block;';
    
    const textInstructions = document.createElement('p');
    textInstructions.textContent = 'Enter student names separated by commas:';
    textInstructions.style.cssText = `
        margin: 0 0 15px 0;
        color: #FFFFFF;
        font-size: 14px;
    `;
    
    const textExample = document.createElement('p');
    textExample.textContent = 'Example: John, Sarah, Mike';
    textExample.style.cssText = `
        margin: 0 0 15px 0;
        color: #00CC00;
        font-size: 12px;
        font-style: italic;
    `;
    
    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.placeholder = 'Student names separated by commas';
    textInput.style.cssText = `
        width: 100%;
        padding: 10px;
        margin-bottom: 20px;
        background-color: #000000;
        border: 1px solid #FFFFFF;
        border-radius: 4px;
        color: #FFFFFF;
        font-family: 'VT323', monospace;
        font-size: 16px;
        box-sizing: border-box;
    `;
    
    textContent.appendChild(textInstructions);
    textContent.appendChild(textExample);
    textContent.appendChild(textInput);
    
    // CSV upload content
    const csvContent = document.createElement('div');
    csvContent.id = 'csv-content';
    csvContent.style.cssText = 'display: none;';
    
    const csvInstructions = document.createElement('p');
    csvInstructions.textContent = 'Upload a CSV file with student names:';
    csvInstructions.style.cssText = `
        margin: 0 0 15px 0;
        color: #FFFFFF;
        font-size: 14px;
    `;
    
    const csvExample = document.createElement('p');
    csvExample.textContent = 'CSV format: One name per line, or names in first column';
    csvExample.style.cssText = `
        margin: 0 0 15px 0;
        color: #00CC00;
        font-size: 12px;
        font-style: italic;
    `;
    
    const csvInput = document.createElement('input');
    csvInput.type = 'file';
    csvInput.accept = '.csv,.txt';
    csvInput.style.cssText = `
        width: 100%;
        padding: 10px;
        margin-bottom: 20px;
        background-color: #000000;
        border: 1px solid #FFFFFF;
        border-radius: 4px;
        color: #FFFFFF;
        font-family: 'VT323', monospace;
        font-size: 16px;
        box-sizing: border-box;
    `;
    
    csvContent.appendChild(csvInstructions);
    csvContent.appendChild(csvExample);
    csvContent.appendChild(csvInput);
    
    contentArea.appendChild(textContent);
    contentArea.appendChild(csvContent);
    
    // Tab switching logic
    textTab.onclick = () => {
        textTab.style.color = '#FFFFFF';
        textTab.style.borderBottomColor = '#66CDAA';
        csvTab.style.color = '#66CDAA';
        csvTab.style.borderBottomColor = 'transparent';
        textContent.style.display = 'block';
        csvContent.style.display = 'none';
    };
    
    csvTab.onclick = () => {
        csvTab.style.color = '#FFFFFF';
        csvTab.style.borderBottomColor = '#66CDAA';
        textTab.style.color = '#66CDAA';
        textTab.style.borderBottomColor = 'transparent';
        textContent.style.display = 'none';
        csvContent.style.display = 'block';
    };
    
    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        gap: 10px;
        justify-content: center;
    `;
    
    // Create Add button
    const addBtn = document.createElement('button');
    addBtn.textContent = 'Add Students';
    addBtn.style.cssText = `
        background-color: #001100;
        color: #FFFFFF;
        border: 1px solid #66CDAA;
        padding: 10px 20px;
        border-radius: 4px;
        cursor: pointer;
        font-family: 'VT323', monospace;
        font-size: 16px;
        transition: background-color 0.3s ease;
    `;
    addBtn.onmouseover = () => addBtn.style.backgroundColor = '#003300';
    addBtn.onmouseout = () => addBtn.style.backgroundColor = '#001100';
    addBtn.onclick = () => {
        const isTextMode = textContent.style.display !== 'none';
        
        if (isTextMode) {
            // Handle text input
            const inputValue = textInput.value.trim();
            
            if (inputValue.length > 0) {
                // Split by comma and clean up names
                const names = inputValue.split(',')
                    .map(name => name.trim())
                    .filter(name => name.length > 0);
                
                if (names.length > 0) {
                    addStudentsToClassList(names);
                    closeDialog(overlay);
                } else {
                    alert('Please enter at least one valid student name!');
                }
            } else {
                alert('Please enter student names!');
            }
        } else {
            // Handle CSV upload
            const file = csvInput.files[0];
            
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const csvText = e.target.result;
                        const names = parseCsvNames(csvText);
                        
                        if (names.length > 0) {
                            addStudentsToClassList(names);
                            closeDialog(overlay);
                        } else {
                            alert('No valid student names found in the CSV file!');
                        }
                    } catch (error) {
                        alert('Error reading CSV file: ' + error.message);
                    }
                };
                reader.readAsText(file);
            } else {
                alert('Please select a CSV file!');
            }
        }
    };
    
    // Create Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = `
        background-color: #001100;
        color: #FFFFFF;
        border: 1px solid #FF6B6B;
        padding: 10px 20px;
        border-radius: 4px;
        cursor: pointer;
        font-family: 'VT323', monospace;
        font-size: 16px;
        transition: background-color 0.3s ease;
    `;
    cancelBtn.onmouseover = () => cancelBtn.style.backgroundColor = '#330000';
    cancelBtn.onmouseout = () => cancelBtn.style.backgroundColor = '#001100';
    cancelBtn.onclick = () => closeDialog(overlay);
    
    // Helper function to add students to class list
    function addStudentsToClassList(names) {
        let addedCount = 0;
        
        // Add each student to allStudents if not already there
        names.forEach(name => {
            if (!allStudents.includes(name)) {
                allStudents.push(name);
                addedCount++;
            }
        });
        
        // Update classList for backward compatibility (with asterisk prefix)
        names.forEach(name => {
            const studentWithAsterisk = '*' + name;
            if (!classList.includes(studentWithAsterisk)) {
                classList.push(studentWithAsterisk);
            }
        });
        
        // Update manually added students for report
        names.forEach(name => {
            if (!manuallyAddedStudents.includes(name)) {
                manuallyAddedStudents.push(name);
            }
        });
        
        // Update total count
        totalUniqueStudents = allStudents.length;
        
        // Set current student to the first newly added student
        if (addedCount > 0) {
            currentStudentIndex = allStudents.length - addedCount;
            studentName = allStudents[currentStudentIndex];
            if (nameInput) {
                nameInput.value(studentName);
            }
        }
        
        // Show success message
        const studentText = addedCount === 1 ? 'student' : 'students';
        alert(`Added ${addedCount} new ${studentText}: ${names.join(', ')}! Total students: ${allStudents.length}`);
        
        // Update UI to show navigation buttons
        positionNameInputAndButtons();
    }
    
    // Helper function to parse CSV names
    function parseCsvNames(csvText) {
        const lines = csvText.split('\n');
        const names = [];
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.length > 0) {
                // Split by comma and take first column
                const columns = trimmedLine.split(',');
                const name = columns[0].trim();
                if (name.length > 0) {
                    names.push(name);
                }
            }
        }
        
        return names;
    }
    
    // Helper function to close dialog
    function closeDialog(overlay) {
        document.body.removeChild(overlay);
    }
    
    // Assemble dialog
    tabContainer.appendChild(textTab);
    tabContainer.appendChild(csvTab);
    buttonContainer.appendChild(addBtn);
    buttonContainer.appendChild(cancelBtn);
    dialog.appendChild(title);
    dialog.appendChild(instructions);
    dialog.appendChild(tabContainer);
    dialog.appendChild(contentArea);
    dialog.appendChild(buttonContainer);
    overlay.appendChild(dialog);
    
    // Add to page
    document.body.appendChild(overlay);
    
    // Focus the text input field
    textInput.focus();
}

function draw() {
    // Get colors from CSS variables
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    
    const bgColor = computedStyle.getPropertyValue('--background-color').trim();
    const textColor = computedStyle.getPropertyValue('--text-color').trim();
    const primaryColor = computedStyle.getPropertyValue('--primary-color').trim();
    
    // Convert hex colors to RGB for p5.js
    const bgRgb = hexToRgb(bgColor);
    const textRgb = hexToRgb(textColor);
    const primaryRgb = hexToRgb(primaryColor);
    
    background(bgRgb.r, bgRgb.g, bgRgb.b);
    
    // Set default font
    textFont(DEFAULT_FONT);
    
    // Draw student name - use primary color for emphasis
    fill(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    textSize(FONT_SIZES.NAME());
    textAlign(LEFT, TOP);
    text(studentName, width * SPACING.TOP_MARGIN, height * SPACING.TOP_MARGIN);
    
    // Draw objective - use primary color for emphasis
    fill(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    textSize(FONT_SIZES.OBJECTIVE());
    textAlign(LEFT, TOP);
    const defaultObjective = 'Design an object for a character with the following traits:';
    text(categories?.objective || defaultObjective, 
         width * SPACING.TOP_MARGIN, 
         height * SPACING.OBJECTIVE_MARGIN);
    
    // Draw prompts
    let yPosition = height * SPACING.PROMPT_START;
    
    // Check if prompt1 interests mode is enabled
    const prompt1InterestsMode = categories.prompt1InterestsMode || false;
    
    Object.keys(categories).forEach(header => {
        if (header !== 'objective' && header !== 'prompt1InterestsMode') {
            // Skip the first prompt if interests mode is enabled
            if (prompt1InterestsMode && header === Object.keys(categories).find(cat => cat !== 'objective' && cat !== 'prompt1InterestsMode')) {
                return; // Skip drawing the first prompt
            }
            
            // Draw category - use primary color
            fill(primaryRgb.r, primaryRgb.g, primaryRgb.b);
            textSize(FONT_SIZES.CATEGORY());
            textAlign(RIGHT, CENTER);
            text(header, width * SPACING.CATEGORY_OFFSET, yPosition);
            
            // Draw prompt - use primary color for both revealed and rotating text
            fill(primaryRgb.r, primaryRgb.g, primaryRgb.b);
            textAlign(LEFT, CENTER);
            const prompt = currentPrompts[header];
            
            if (prompt && typeof prompt === 'object') {
                textSize(min(width, height) * 0.05); //size of prompt text
                text(prompt.revealed, width * SPACING.PROMPT_OFFSET, yPosition);
                text(prompt.rotating, width * SPACING.PROMPT_OFFSET + textWidth(prompt.revealed), yPosition);
            } else {
                textSize(FONT_SIZES.PROMPTS());
                text(prompt || '', width * SPACING.PROMPT_OFFSET, yPosition);
            }
            
            yPosition += height * SPACING.PROMPT_SPACING;
        }
    });
    
    // Draw generation progress - use primary color
    fill(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    textSize(FONT_SIZES.INSTRUCTIONS());
    textAlign(RIGHT, BOTTOM);
    
    // Show number of students in the system
    // Student count removed - redundant with counter under name field
    
    
    // Draw instructions only if showInstructions is true - use primary color
    if (showInstructions) {
        fill(primaryRgb.r, primaryRgb.g, primaryRgb.b);
        textSize(FONT_SIZES.INSTRUCTIONS());
        textAlign(CENTER, BOTTOM);
        const categoryNames = Object.keys(categories).filter(cat => cat !== 'objective');
        const promptCount = categoryNames.length;
        
        // Show student list indicator if multiple students are available
        if (allStudents.length > 1) {
            const currentPosition = currentStudentIndex + 1;
            const totalStudents = allStudents.length;
            text(`Student ${currentPosition} of ${totalStudents}`, 
             width/2, 
                 height * (1 - SPACING.BOTTOM_MARGIN) - 30);
        }
    }
}

// Helper function to convert hex to RGB
function hexToRgb(hex) {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse hex values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return { r, g, b };
}

function keyPressed() {
    debugLog('1. Key pressed:', key, 'keyCode:', keyCode);
    
    // Ignore keypresses if the name input is focused
    if (nameInput && nameInput.elt === document.activeElement) {
        debugLog('Input field focused, ignoring keypress');
        return;
    }


    // Ignore keypresses if user is typing in any input field
    const activeElement = document.activeElement;
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable)) {
        debugLog('User is typing in input field, ignoring keypress');
        return;
    }

    if (key === 'e' || key === 'E') {
        // Prevent default browser behavior
        console.log('E pressed in p5.js handler - redirecting to editor.html');
        event.preventDefault();
        event.stopPropagation();
        
        // Save current state and redirect to editor
        saveCurrentStateToLocalStorage();
        setTimeout(() => {
            console.log('Redirecting to editor.html from p5.js handler');
            window.location.href = 'editor.html?from=sketch';
        }, 50);
        return;
    }
    
    // Toggle control panel with 'C' key
    if (key === 'c' || key === 'C') {
        console.log('C pressed - toggling control panel');
        toggleControlPanel();
        return;
    }
    
    // Handle left/right arrow keys for student navigation
    if (keyCode === LEFT_ARROW) {
        console.log('Left arrow pressed - navigating to previous student');
        prevStudent();
        return;
    }
    
    if (keyCode === RIGHT_ARROW) {
        console.log('Right arrow pressed - navigating to next student');
        nextStudent();
        return;
    }
    
    if (key === 'A' || key === 'a') {
        debugLog('2. A key pressed:', {
            isGenerating,
            generationStep,
            categories: categories,
            categoriesKeys: Object.keys(categories),
            nonObjectiveCategories: Object.keys(categories).filter(cat => cat !== 'objective')
        });
        
        // Check if categories exists and has content
        if (!categories || Object.keys(categories).filter(cat => cat !== 'objective').length === 0) {
            console.error('No categories loaded or categories empty. Categories:', categories);
            console.error('Available categories:', Object.keys(categories));
            alert('No prompt categories found. Please go to the editor to set up prompts first.');
            return;
        }
        
        // Force reset regardless of isGenerating state
        resetGeneratorState();
        startGeneration();
    }
    
    // Arrow key navigation
    if (keyCode === LEFT_ARROW) {
        if (classList.length > 0) {
            prevStudent();
        }
    }
    
    if (keyCode === RIGHT_ARROW) {
        if (classList.length > 0) {
            nextStudent();
        }
    }
    
    if (key === ' ') {
        if (isGenerating) {
            shouldStop = true;
            isGenerating = false;
        }
    }
    
    
}

function mousePressed() {
    // Mouse click handling removed - no longer needed for comma-separated names
    // Users can now enter multiple names directly in the input field
}

function startGeneration() {
    debugLog('4. startGeneration called');
    isGenerating = true;
    shouldStop = false;
    generationStep = 0;  // Double-check generation step is 0
    currentPrompts = {};
    selectedCategory = null; // Reset selected category for new generation
    isAnimating = false; // Reset animation flag
    
    // Initialize usedPrompts tracking if not exists (don't reset across generations)
    if (!usedPrompts || Object.keys(usedPrompts).length === 0) {
        usedPrompts = {};
        const promptTypes = Object.keys(categories).filter(cat => cat !== 'objective');
        promptTypes.forEach(promptType => {
            usedPrompts[promptType] = new Set();
        });
        debugLog('Initialized usedPrompts tracking');
    } else {
        debugLog('Using existing usedPrompts tracking across generations');
    }
    
    // Use prompt types in order (1, 2, 3, 4) - no shuffling
    let promptTypes = Object.keys(categories).filter(cat => cat !== 'objective' && cat !== 'prompt1InterestsMode');
    
    // Skip the first prompt if prompt1InterestsMode is enabled
    const prompt1InterestsMode = categories.prompt1InterestsMode || false;
    if (prompt1InterestsMode && promptTypes.length > 0) {
        promptTypes = promptTypes.slice(1); // Remove the first prompt
        debugLog('Skipping first prompt due to prompt1InterestsMode');
    }
    
    shuffledPromptTypes = [...promptTypes]; // Keep original order
    debugLog('Prompt types for this generation (in order):', shuffledPromptTypes);
    debugLog('Current settings - constraintEnabled:', constraintEnabled, 'completion based on student list');
    debugLog('usedPrompts initialized:', usedPrompts);
    
    generateNextAttribute();
}

function generateNextAttribute() {
    debugLog('5. generateNextAttribute called');
    
    // Prevent generating next attribute if animation is in progress
    if (isAnimating) {
        debugLog('Animation in progress, skipping generateNextAttribute');
        return;
    }
    
    // The data structure is: categories[promptType][categoryLetter] = [prompts]
    const maxPrompts = shuffledPromptTypes.length; // Generate as many prompts as there are prompt types
    
    if (!shuffledPromptTypes.length) {
        console.error('No valid prompt types found');
        return;
    }
    
    debugLog('Current state:', {
        generationStep,
        maxPrompts,
        shuffledPromptTypes,
        totalPromptTypes: shuffledPromptTypes.length
    });
    
    // For the first generation step, select a category (row) that will be used for ALL prompts
    if (generationStep === 0) {
        // Get all available categories from the first prompt type
        const firstPromptType = shuffledPromptTypes[0];
        const firstPromptData = categories[firstPromptType];
        let availableCategories = Object.keys(firstPromptData);
        
        // Filter categories based on selected interests (category letters A, B, C, D)
        const selectedInterests = getSelectedInterests();
        console.log('DEBUG: Selected interests:', selectedInterests);
        console.log('DEBUG: Available categories before filtering:', availableCategories);
        
        if (selectedInterests !== 'all') {
            // Only filter by interests if the selected categories actually have content
            const categoriesWithContent = availableCategories.filter(cat => {
                // Check if this category has content in any prompt column
                let hasContent = false;
                Object.keys(categories).forEach(promptType => {
                    if (promptType !== 'objective' && promptType !== 'prompt1InterestsMode') {
                        const categoryData = categories[promptType];
                        if (categoryData && categoryData[cat]) {
                            const prompts = categoryData[cat];
                            if (Array.isArray(prompts) && prompts.length > 0) {
                                const hasNonEmptyPrompts = prompts.some(prompt => 
                                    prompt && prompt.trim().length > 0
                                );
                                if (hasNonEmptyPrompts) {
                                    hasContent = true;
                                }
                            }
                        }
                    }
                });
                return hasContent;
            });
            
            // Filter by selected interests only among categories that have content
            availableCategories = categoriesWithContent.filter(cat => selectedInterests.includes(cat));
            console.log('DEBUG: Filtered categories based on interests (only those with content):', availableCategories);
            debugLog('Filtered categories based on interests (only those with content):', availableCategories);
            
            // Force selection if only one category is available
            if (availableCategories.length === 1) {
                console.log('DEBUG: Forcing selection to only available category:', availableCategories[0]);
            }
        } else {
            // When "all" is selected, still only use categories that have content
            availableCategories = availableCategories.filter(cat => {
                let hasContent = false;
                Object.keys(categories).forEach(promptType => {
                    if (promptType !== 'objective' && promptType !== 'prompt1InterestsMode') {
                        const categoryData = categories[promptType];
                        if (categoryData && categoryData[cat]) {
                            const prompts = categoryData[cat];
                            if (Array.isArray(prompts) && prompts.length > 0) {
                                const hasNonEmptyPrompts = prompts.some(prompt => 
                                    prompt && prompt.trim().length > 0
                                );
                                if (hasNonEmptyPrompts) {
                                    hasContent = true;
                                }
                            }
                        }
                    }
                });
                return hasContent;
            });
            console.log('DEBUG: Using all categories with content (no interest filtering):', availableCategories);
        }
        
        if (availableCategories.length === 0) {
            console.error('No categories found for prompt type:', firstPromptType);
            isGenerationComplete = true;
            return;
        }
        
        // Apply category cycling constraint if there are more than 2 categories
        let candidateCategories = [...availableCategories];
        
        if (constraintEnabled && availableCategories.length > 2) {
            // If we've used all categories, reset the cycle
            if (usedCategories.size >= availableCategories.length) {
                usedCategories.clear();
                debugLog('Reset category cycle - all categories have been used');
            }
            
            // Filter out already used categories
            candidateCategories = availableCategories.filter(cat => !usedCategories.has(cat));
            
            // If constraint eliminated all options, use all available categories
            if (candidateCategories.length === 0) {
                candidateCategories = [...availableCategories];
                debugLog('Constraint eliminated all options, using all categories');
            }
        }
        
        // If only one category is available after filtering, select it directly
        if (candidateCategories.length === 1) {
            selectedCategory = candidateCategories[0];
            console.log('DEBUG: Only one category available, selecting directly:', selectedCategory);
            debugLog('Only one category available, selecting directly:', selectedCategory);
        } else {
            // Select a random category that will be used for ALL prompts in this generation
            selectedCategory = candidateCategories[Math.floor(Math.random() * candidateCategories.length)];
            console.log('DEBUG: Selected category for entire generation:', selectedCategory, 'from candidates:', candidateCategories);
            debugLog('Selected category for entire generation:', selectedCategory, 'from candidates:', candidateCategories);
        }
        
        usedCategories.add(selectedCategory);
        debugLog('Used categories so far:', Array.from(usedCategories));
    }
    
    // Get the current prompt type (column) for this generation step
    const currentPromptType = shuffledPromptTypes[generationStep];
    debugLog('Current prompt type for step', generationStep + 1, ':', currentPromptType);
    
    if (!currentPromptType || !categories[currentPromptType]) {
        console.error('Invalid prompt type:', currentPromptType);
            isGenerationComplete = true;
            return;
        }
        
    // Get the selected category's prompts for this prompt type
    const promptData = categories[currentPromptType];
    const promptOptions = promptData[selectedCategory];
    
    debugLog('Data structure check:', {
        currentPromptType,
        selectedCategory,
        promptData,
        promptOptions,
        categories: categories
    });
    
    if (!promptOptions || !Array.isArray(promptOptions) || promptOptions.length === 0) {
        console.error('No valid prompts found for prompt type:', currentPromptType, 'category:', selectedCategory);
        console.error('Available categories for this prompt type:', Object.keys(categories[currentPromptType] || {}));
        console.error('Selected category:', selectedCategory);
        console.error('Prompt data:', categories[currentPromptType]);
        
        if (generationStep + 1 < maxPrompts) {
            generationStep++;
            generateNextAttribute();
        } else {
            isGenerationComplete = true;
        }
            return;
        }
        
    let selectedPrompt;
    
    // Constraint is always enabled now - repetition prevention is always on
    const shouldConstrain = true;
    debugLog('Constraint is always enabled - preventing repetition');
    
    if (shouldConstrain) {
        // Initialize tracking for this prompt type if needed
        if (!usedPrompts[currentPromptType]) {
            usedPrompts[currentPromptType] = new Set();
        }
        
        // Get unused items for this prompt type (check if this specific value has been used before)
        const unusedItems = promptOptions.filter(
            item => !usedPrompts[currentPromptType].has(item)
        );
        
        debugLog('CONSTRAINT ENABLED - Prompt type:', currentPromptType, 'unused items:', unusedItems.length, 'total items:', promptOptions.length);
        
        if (unusedItems.length === 0) {
            // If all items used for this prompt type, clear tracking and start over
            debugLog('All items used for', currentPromptType, 'clearing tracking and starting over');
            usedPrompts[currentPromptType].clear();
            selectedPrompt = promptOptions[Math.floor(Math.random() * promptOptions.length)];
            
            // Mark this as a reset event for tracking
            const globalKey = `${currentPromptType}_${selectedCategory}_RESET`;
            globalUsedPrompts[globalKey] = true;
            debugLog('Marked reset event for tracking:', globalKey);
        } else {
            // Select random unused item
            selectedPrompt = unusedItems[Math.floor(Math.random() * unusedItems.length)];
        }
        
        if (selectedPrompt) {
            usedPrompts[currentPromptType].add(selectedPrompt);
            
            // Also track globally
            const globalKey = `${currentPromptType}_${selectedCategory}_${selectedPrompt}`;
            if (!globalUsedPrompts[globalKey]) {
                globalUsedPrompts[globalKey] = true;
                debugLog('Added to global tracking:', globalKey);
            }
        }
    } else {
        // No constraint for this prompt type - select randomly from all items
        debugLog('CONSTRAINT DISABLED for', currentPromptType, '- selecting randomly from all items');
        selectedPrompt = promptOptions[Math.floor(Math.random() * promptOptions.length)];
    }
    
    // Fallback: ensure we always have a selection
    if (!selectedPrompt && promptOptions && promptOptions.length > 0) {
        debugLog('FALLBACK: No selection made, picking random item');
        selectedPrompt = promptOptions[Math.floor(Math.random() * promptOptions.length)];
    }
    
    debugLog('Selected prompt:', selectedPrompt, 'from prompt type', currentPromptType, 'category', selectedCategory);
    startScrambleAnimation(selectedPrompt, currentPromptType);
}

function startScrambleAnimation(finalText, category) {
    // Add error checking
    if (!finalText) {
        console.error('No text provided for animation:', {finalText, category});
        
        // Clear any existing animations before moving to next prompt
        if (scrambleInterval) clearInterval(scrambleInterval);
        if (revealInterval) clearInterval(revealInterval);
        
        // Clear animation flag
        isAnimating = false;
        
        const maxPrompts = shuffledPromptTypes.length;
        debugLog('Error handling, generationStep:', generationStep, 'maxPrompts:', maxPrompts);
        if (generationStep + 1 < maxPrompts) {
        generationStep++;
            generateNextAttribute();
        } else {
            debugLog('Generation complete after error');
            isGenerationComplete = true;
        }
        return;
    }
    
    let scrambleCycles = 0;
    let charIndex = 0;
    
    // Clear any existing intervals
    if (scrambleInterval) clearInterval(scrambleInterval);
    if (revealInterval) clearInterval(revealInterval);
    
    // Set animation flag
    isAnimating = true;
    
    // Start scramble animation
    scrambleInterval = setInterval(() => {
        if (shouldStop) {
            clearInterval(scrambleInterval);
            return;
        }
        
        let scrambledText = '';
        const rotatingChars = getRotatingChars();
        for (let i = 0; i < finalText.length; i++) {
            scrambledText += rotatingChars[Math.floor(Math.random() * rotatingChars.length)];
        }
        
        currentPrompts[category] = {
            revealed: '',
            rotating: scrambledText
        };
        
        playSound(SOUND.SCRAMBLE);
        scrambleCycles++;
        
        if (scrambleCycles >= TIMING.SCRAMBLE_CYCLES) {
            clearInterval(scrambleInterval);
            
            // Start reveal after pause
            setTimeout(() => {
                startRevealAnimation(finalText, category);
            }, TIMING.PAUSE_BETWEEN);
        }
    }, TIMING.SCRAMBLE_SPEED);
}

function startRevealAnimation(finalText, category) {
    let charIndex = 0;
    
    revealInterval = setInterval(() => {
        if (shouldStop) {
            clearInterval(revealInterval);
            return;
        }
        
        if (charIndex < finalText.length) {
            const revealed = finalText.substring(0, charIndex + 1);
            let rotating = '';
            const rotatingChars = getRotatingChars();
            
            for (let i = charIndex + 1; i < finalText.length; i++) {
                rotating += rotatingChars[Math.floor(Math.random() * rotatingChars.length)];
            }
            
            currentPrompts[category] = {
                revealed: revealed,
                rotating: rotating
            };
            
            charIndex++;
            playSound(SOUND.REVEAL);
        } else {
            clearInterval(revealInterval);
            playSound(SOUND.FINAL);
            
            // Clear animation flag
            isAnimating = false;
            
            setTimeout(() => {
                const maxPrompts = shuffledPromptTypes.length; // Use the shuffled prompt types length
                debugLog('Reveal complete, generationStep:', generationStep, 'maxPrompts:', maxPrompts);
                if (generationStep + 1 < maxPrompts) {
                generationStep++;
                    generateNextAttribute();
                } else {
                    debugLog('Generation complete, all prompts generated');
                    
                    // Increment the generated count
                    generatedCount++;
                    debugLog('Generated count:', generatedCount, 'Completion based on student list processing');
                    
                    // Collect prompt data for class report
                    collectPromptData();
                    
                    // Mark current student as processed (only when prompts are actually generated)
                    if (studentName && !uniqueStudentsProcessed.has(studentName)) {
                        uniqueStudentsProcessed.add(studentName);
                        console.log('Marked student as processed:', studentName, 'Total processed:', uniqueStudentsProcessed.size);
                    }
                    
                    // No auto-advance - user must use navigation buttons
                    
                    // Check if we've processed all unique students
                    console.log('After prompt generation - Processed:', uniqueStudentsProcessed.size, 'Total:', totalUniqueStudents);
                    // No popup - just mark generation as complete
                    isGenerating = false;
                    
                    isGenerationComplete = true;
                }
            }, TIMING.PAUSE_BETWEEN);
        }
    }, TIMING.REVEAL_SPEED);
}

function playBeep(frequency, duration) {
    if (audioCtx) {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.frequency.value = frequency;
        gainNode.gain.value = SOUND.VOLUME;
        
        oscillator.start();
        setTimeout(() => oscillator.stop(), duration);
    }
}

function resetGeneratorState() {
    generationStep = 0;
    shouldStop = false;
    isGenerationComplete = false;
    currentPrompts = {};
    selectedSubcategory = null;
    selectedMainCategory = null;
    selectedCategory = null;
    // Note: Don't reset usedCategories here - we want to maintain the cycle across generations
    
    // Don't reset usedPrompts - we want to maintain constraint across generations
    // Only initialize if not exists
    if (!usedPrompts || Object.keys(usedPrompts).length === 0) {
    usedPrompts = {};
    Object.keys(categories).forEach(category => {
        if (category !== 'objective') {
            usedPrompts[category] = new Set();
        }
    });
    }
    
    // Reset unusedPrompts for all categories
    unusedPrompts = {};
    Object.keys(categories).forEach(category => {
        if (category !== 'objective') {
            unusedPrompts[category] = [];
            if (categories[category] && categories[category]['0']) {
                unusedPrompts[category] = [...categories[category]['0']];
            }
        }
    });
    
    // Reset first prompt tracking
    allFirstPromptOptions = [];
    unusedFirstPrompts = new Set();
    
    // Reset category sequence for new generation
    if (window.categorySequence) {
        window.categorySequence = [];
    }
    
    const categoryNames = Object.keys(categories).filter(cat => cat !== 'objective');
    const maxPrompts = categoryNames.length; // Generate as many prompts as there are categories
    
    debugLog('Reset state:', {
        categories: Object.keys(categories),
        usedPrompts,
        unusedPrompts,
        maxPrompts: maxPrompts
    });
}

function resetPrompts() {
    currentPrompts = {};
    Object.keys(categories).forEach(category => {
        currentPrompts[category] = '';
    });
}

function loadPromptsFromLocalStorage() {
    // Force reload by adding cache-busting timestamp
    const promptData = localStorage.getItem('promptCategories');
    debugLog('Loading prompts from localStorage:', promptData);
    debugLog('Current timestamp:', Date.now());
    
    if (promptData) {
        try {
            const parsedData = JSON.parse(promptData);
            debugLog('Parsed data:', parsedData);
            console.log('Full parsed data structure:', JSON.stringify(parsedData, null, 2));
            
            if (parsedData.categories) {
                categories = parsedData.categories;
                
                // Load criterion labels if they exist
                if (parsedData.criterionLabels && Array.isArray(parsedData.criterionLabels)) {
                    window.criterionLabels = parsedData.criterionLabels;
                    console.log('DEBUG: Loaded criterion labels in main function:', window.criterionLabels);
                } else {
                    window.criterionLabels = ['', '', '', ''];
                    console.log('DEBUG: No criterion labels found, using empty in main function');
                }
                
                // Load constraint setting (always enabled)
                constraintEnabled = true;
                debugLog('Constraint always enabled');
                
                // Prompt count is now handled automatically based on student list
                // No need to load from localStorage
                debugLog('Prompt count handled automatically in sketch.js');

                // Load class list data from localStorage for report generation
                if (parsedData.classList && Array.isArray(parsedData.classList)) {
                    classList = parsedData.classList;
                    console.log('Restored class list:', classList);
                } else {
                    classList = [];
                }
                
                if (parsedData.originalClassList && Array.isArray(parsedData.originalClassList)) {
                    originalClassList = parsedData.originalClassList;
                    console.log('Restored original class list:', originalClassList);
                } else {
                    originalClassList = [];
                }
                
                // Restore report data for persistence
                if (parsedData.classReport && Array.isArray(parsedData.classReport)) {
                    classReport = parsedData.classReport;
                    console.log('DEBUG: Restored class report with', classReport.length, 'entries');
                    console.log('DEBUG: Restored classReport:', JSON.stringify(classReport, null, 2));
                } else {
                    classReport = [];
                    console.log('DEBUG: No class report found, starting fresh');
                }
                
                if (parsedData.allStudents && Array.isArray(parsedData.allStudents)) {
                    // Filter out any single-character entries and invalid data
                    allStudents = parsedData.allStudents.filter(name => 
                        typeof name === 'string' && 
                        name.length > 1 && 
                        name.trim().length > 0 &&
                        !/^[a-zA-Z]$/.test(name) // Exclude single letters
                    );
                    console.log('Restored all students (filtered):', allStudents);
                    console.log('DEBUG: allStudents length:', allStudents.length);
                    console.log('DEBUG: allStudents contents:', JSON.stringify(allStudents));
                } else {
                    allStudents = [];
                }
                
                if (parsedData.drawnStudents && Array.isArray(parsedData.drawnStudents)) {
                    // Filter out any single-character entries (corrupted data)
                    drawnStudents = parsedData.drawnStudents.filter(name => 
                        typeof name === 'string' && name.length > 1
                    );
                    console.log('Restored drawn students (filtered):', drawnStudents);
                } else {
                    drawnStudents = [];
                }
                
                if (parsedData.manuallyAddedStudents && Array.isArray(parsedData.manuallyAddedStudents)) {
                    manuallyAddedStudents = parsedData.manuallyAddedStudents;
                    console.log('Restored manually added students:', manuallyAddedStudents);
                } else {
                    manuallyAddedStudents = [];
                }
                
                if (typeof parsedData.totalUniqueStudents === 'number') {
                    totalUniqueStudents = parsedData.totalUniqueStudents;
                    console.log('Restored total unique students count:', totalUniqueStudents);
                } else {
                    totalUniqueStudents = 0;
                }
                
                // Auto-populate first student name if students exist
                if (allStudents.length > 0) {
                    studentName = allStudents[0];
                    currentStudentIndex = 0;
                    if (nameInput) {
                        nameInput.value(studentName);
                    }
                    isManualNameEntry = false; // Mark as programmatic change
                    debugLog('Auto-populated first student name:', studentName);
                } else {
                    // No students - start with empty name field
                    studentName = '';
                    currentStudentIndex = 0;
                    if (typeof nameInput !== 'undefined' && nameInput) {
                        nameInput.value('');
                    }
                    isManualNameEntry = false; // Mark as programmatic change
                    debugLog('Student name reset to empty (no students)');
                }
                
                // Update UI after loading
                positionNameInputAndButtons();
                
                
                // Debug objective
                debugLog('Loaded objective:', categories.objective);
                
                // If objective is not set, check if it's in a different structure
                if (!categories.objective && parsedData.objective) {
                    categories.objective = parsedData.objective;
                }
                
                // The data structure from editor is already correct:
                // categories[promptType][categoryLetter] = [prompts]
                // We don't need to modify it
                
                debugLog('Final categories structure:', {
                    objective: categories.objective,
                    categories: Object.keys(categories)
                });
                
                console.log('Final categories object:', categories);
                console.log('Non-objective categories:', Object.keys(categories).filter(cat => cat !== 'objective'));
            } else {
                console.error('Invalid data structure:', parsedData);
                categories = {};
            }
        } catch (e) {
            console.error('Error parsing prompts:', e);
            categories = {};
        }
    } else {
        console.log('No saved data found in localStorage. Creating default structure.');
        // Create a default structure if no data exists
        // Structure: categories[promptType][categoryLetter] = [prompts]
        categories = {
            objective: 'Design an object for a character with the following traits:',
            'PROMPT 1': {
                'A': ['Young', 'Middle-aged', 'Elderly'],
                'B': ['Creative', 'Analytical', 'Physical']
            },
            'PROMPT 2': {
                'A': ['Student', 'Professional', 'Retired'],
                'B': ['Impatient', 'Perfectionist', 'Shy']
            }
        };
        console.log('Created default categories:', categories);
    }
    
    // Initialize usedPrompts with data from editor.js
    usedPrompts = {};
    Object.keys(categories).forEach(category => {
        if (category !== 'objective') {
            usedPrompts[category] = new Set();
        }
    });
}

// Add this helper function to check the data
function checkPromptData() {
    console.log('Current categories:', {
        type: typeof categories,
        isArray: Array.isArray(categories),
        keys: Object.keys(categories)
    });
    
    Object.keys(categories).forEach(cat => {
        console.log(`Category ${cat}:`, {
            data: categories[cat],
            prompts: categories[cat]?.['0']
        });
    });
}

// Add this to help check the data structure
function checkCategoryStructure() {
    console.log('Checking category structure:');
    console.log('Categories type:', typeof categories);
    console.log('Is Array?', Array.isArray(categories));
    console.log('Keys:', Object.keys(categories));
    Object.keys(categories).forEach(key => {
        console.log(`Category ${key}:`, categories[key]);
        if (categories[key] && categories[key]['0']) {
            console.log(`Prompts for ${key}:`, categories[key]['0']);
        }
    });
}

// Update windowResized to handle dynamic sizing
function positionNameInputAndButtons() {
    const bottomMargin = BUTTON_SIZES.BOTTOM_MARGIN();
    const elementHeight = BUTTON_SIZES.HEIGHT();
    const elementSpacing = BUTTON_SIZES.ELEMENT_SPACING();
    
    // Always show arrows next to name field
    // Calculate centered positioning for equal gaps
    const nameFieldWidth = BUTTON_SIZES.WIDTH();
    const arrowWidth = 30;
    const totalWidth = nameFieldWidth + (arrowWidth * 2) + 20; // 20px total gap (10px each side)
    const startX = (width - totalWidth) / 2;
    
    // Position name input between arrows
    nameInput.position(
        startX + arrowWidth + 10, 
        height - bottomMargin - (elementHeight * 2) - elementSpacing
    );
    
    // Position buttons
    if (prevStudentButton) {
        prevStudentButton.position(
            startX, 
            height - bottomMargin - (elementHeight * 2) - elementSpacing
        );
    }
    if (nextStudentButton) {
        nextStudentButton.position(
            startX + arrowWidth + 10 + nameFieldWidth + 10, 
        height - bottomMargin - (elementHeight * 2) - elementSpacing
    );
    }
    if (addStudentButton) {
        addStudentButton.position(
            startX + arrowWidth + 10 + nameFieldWidth + 10 + arrowWidth + 10, 
            height - bottomMargin - (elementHeight * 2) - elementSpacing
        );
    }
    
    // Update name input styling based on class list state
    updateNameInputForNoClassList();
}

function updateNameInputForNoClassList() {
    if (!nameInput) return;
    
    // Add + icon to placeholder when no class list
    if (classList.length === 0) {
        nameInput.attribute('placeholder', '+ Add student name');
    } else {
        nameInput.attribute('placeholder', 'Enter student name here');
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    
    const bottomMargin = BUTTON_SIZES.BOTTOM_MARGIN();
    const elementHeight = BUTTON_SIZES.HEIGHT();
    const elementSpacing = BUTTON_SIZES.ELEMENT_SPACING();
    
    
    // Position control panel and toggle button
    positionControlPanel();
    
    // Use the centralized positioning function
    positionNameInputAndButtons();
    
    // No add student button to position
    
    // Calculate new font sizes
    const inputFontSize = FONT_SIZES.INPUT() + 'px';
    
    // Update input size and font (position already set above)
    nameInput.size(BUTTON_SIZES.WIDTH());
    nameInput.style('height', BUTTON_SIZES.HEIGHT() + 'px');
    nameInput.style('font-size', inputFontSize);
    
    
    nameInput.style('font-family', 'VT323, monospace');
    nameInput.style('color', 'var(--text-color)');
    nameInput.style('background-color', 'var(--background-color)');
    nameInput.style('border', '1px solid var(--primary-color)');
    nameInput.style('padding', '5px 10px');
    nameInput.style('box-sizing', 'border-box');
    
    // Update button font sizes to match input
    if (prevStudentButton && nextStudentButton) {
        [prevStudentButton, nextStudentButton].forEach(button => {
            button.style('font-size', inputFontSize);
        });
    }
}

function initializeUnusedPrompts() {
    if (categories && categories['AGE']) {
        unusedPrompts.AGE = [];
        // Collect all prompts from all subcategories of AGE
        Object.keys(categories['AGE']).forEach(subcat => {
            if (Array.isArray(categories['AGE'][subcat])) {
                unusedPrompts.AGE = unusedPrompts.AGE.concat(
                    categories['AGE'][subcat]
                );
            }
        });
        // Shuffle the array for good measure, even though we'll select randomly
        shuffleArray(unusedPrompts.AGE);
        debugLog('Initialized unused prompts:', unusedPrompts.AGE);
    }
}

function initializeSubcategoryPrompts(category) {
    debugLog(`Initializing ${category} prompts for subcategory:`, selectedSubcategory);
    if (selectedSubcategory && categories[category] && categories[category][selectedSubcategory]) {
        unusedPrompts[category] = [...categories[category][selectedSubcategory]];
        shuffleArray(unusedPrompts[category]);
        debugLog(`Initialized ${category} prompts:`, unusedPrompts[category]);
    } else {
        debugLog(`Failed to initialize ${category} prompts. Category data:`, categories[category]);
    }
}

// Add this helper function to shuffle arrays
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Add this debug function to check category structure
function checkCategories() {
    console.log('Current categories structure:', JSON.stringify(categories, null, 2));
    Object.keys(categories).forEach(header => {
        if (header !== 'objective') {
            console.log(`Category ${header}:`, categories[header]['0']);
        }
    });
}

function checkAndClearCache() {
    console.log('Current localStorage content:', localStorage.getItem('promptCategories'));
    
    // Let's look at what's actually in localStorage
    console.log('Raw localStorage data:', {
        promptCategories: localStorage.getItem('promptCategories'),
        parsedData: JSON.parse(localStorage.getItem('promptCategories'))
    });
}

// Add this function near your other audio-related code
function playSound(soundConfig) {
    if (audioCtx) {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.frequency.value = soundConfig.FREQUENCY;
        gainNode.gain.value = SOUND.VOLUME;
        
        oscillator.start();
        setTimeout(() => oscillator.stop(), soundConfig.DURATION);
    }
}


// Debug function to test constraint behavior
function testConstraints() {
    console.log('=== CONSTRAINT TEST ===');
    console.log('constraintEnabled: true (always enabled)');
    console.log('completion based on student list processing');
    console.log('generatedCount:', generatedCount);
    console.log('usedPrompts:', usedPrompts);
    console.log('globalUsedPrompts:', globalUsedPrompts);
    console.log('categories:', categories);
    console.log('shuffledPromptTypes:', shuffledPromptTypes);
    console.log('======================');
}

// Make test function available globally
window.testConstraints = testConstraints;

// Debug function to inspect current state
function debugReportState() {
    console.log('=== DEBUG REPORT STATE ===');
    console.log('classReport:', JSON.stringify(classReport, null, 2));
    console.log('classReport.length:', classReport.length);
    console.log('allStudents:', allStudents);
    console.log('allStudents.length:', allStudents.length);
    console.log('classList:', classList);
    console.log('classList.length:', classList.length);
    console.log('originalClassList:', originalClassList);
    console.log('originalClassList.length:', originalClassList.length);
    console.log('manuallyAddedStudents:', manuallyAddedStudents);
    console.log('manuallyAddedStudents.length:', manuallyAddedStudents.length);
    console.log('drawnStudents:', drawnStudents);
    console.log('drawnStudents.length:', drawnStudents.length);
    console.log('currentPrompts:', currentPrompts);
    console.log('studentName:', studentName);
    console.log('categories:', categories);
    console.log('localStorage promptCategories:', localStorage.getItem('promptCategories'));
    console.log('=== END DEBUG REPORT STATE ===');
}

// Make debug function available globally
window.debugReportState = debugReportState;

// Centralized control panel positioning function
function positionControlPanel() {
    if (controlPanel) {
        controlPanel.position(
            width - CONTROL_PANEL_OFFSET - BUTTON_SIZES.MARGIN(), 
            BUTTON_SIZES.MARGIN()
        );
    }
    if (controlPanelToggle) {
        controlPanelToggle.position(width - TOGGLE_BUTTON_OFFSET, BUTTON_SIZES.MARGIN());
    }
}

// Toggle control panel visibility
function toggleControlPanel() {
    controlPanelVisible = !controlPanelVisible;
    
    if (controlPanelVisible) {
        controlPanel.style('display', 'block');
        controlPanel.style('opacity', '1');
        controlPanel.style('transform', 'translateX(0)');
        controlPanelToggle.html('☰');
    } else {
        controlPanel.style('opacity', '0');
        controlPanel.style('transform', 'translateX(20px)');
        setTimeout(() => {
            if (!controlPanelVisible) {
                controlPanel.style('display', 'none');
            }
        }, 300);
        controlPanelToggle.html('☰');
    }
}


// Handle class list upload directly in sketch.js
function handleClassListUpload(event) {
    console.log('DEBUG: handleClassListUpload called');
    const file = event.target.files[0];
    console.log('DEBUG: Selected file:', file);
    
    if (file) {
        console.log('DEBUG: File name:', file.name);
        console.log('DEBUG: File type:', file.type);
        console.log('DEBUG: File size:', file.size);
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const text = e.target.result;
                console.log('DEBUG: File content preview:', text.substring(0, 200));
                
                // Handle both CSV and TXT files
                let lines;
                if (file.name.toLowerCase().endsWith('.csv')) {
                    console.log('DEBUG: Processing as CSV file');
                    // For CSV files, split by comma first, then by lines
                    lines = text.split('\n')
                        .map(line => line.split(',').map(item => item.trim()))
                        .flat()
                        .filter(item => item.length > 0);
                } else {
                    console.log('DEBUG: Processing as TXT file');
                    // For TXT files, split by lines
                    lines = text.split('\n')
                        .map(line => line.trim())
                        .filter(line => line.length > 0);
                }
                
                console.log('DEBUG: Parsed lines:', lines);
                
                classList = lines;
                
                // Update original class list
                originalClassList = [...classList];
                
                // Add ALL uploaded names to allStudents array
                allStudents = [...classList];
                console.log('DEBUG: Added all uploaded names to allStudents:', allStudents);
                
                // Update total unique students count
                totalUniqueStudents = classList.length;
                
                console.log('Class list uploaded:', classList);
                console.log('Total students:', totalUniqueStudents);
                
                // Update UI to show navigation buttons
                positionNameInputAndButtons();
                
                // Show all navigation buttons now that we have a class list
                if (prevStudentButton) prevStudentButton.show();
                if (nextStudentButton) nextStudentButton.show();
                // addStudentButton removed - no longer needed
                
                // Auto-populate first student name
                if (classList.length > 0) {
                    studentName = classList[0];
                    if (nameInput) {
                        nameInput.value(studentName);
                    }
                    isManualNameEntry = false;
                    console.log('Auto-populated first student:', studentName);
                }
                
                alert(`Class list uploaded successfully! ${classList.length} students loaded.`);
                
                // Save the updated state to localStorage
                saveCurrentStateToLocalStorage();
                
            } catch (error) {
                alert('Error parsing class list: ' + error.message);
            }
        };
        reader.readAsText(file);
    }
}

// Load student name from localStorage
function loadStudentNameFromLocalStorage() {
    const currentData = localStorage.getItem('promptCategories');
    if (currentData) {
        try {
            const data = JSON.parse(currentData);
            if (data.studentName) {
                studentName = data.studentName;
                // Update the input field if it exists
                if (nameInput) {
                    nameInput.value(studentName);
                }
                console.log('Loaded student name from localStorage:', studentName);
            }
        } catch (error) {
            console.error('Error loading student name:', error);
        }
    }
}

// Save current state to localStorage (including student name and report data)
function saveCurrentStateToLocalStorage() {
    console.log('=== DEBUG: saveCurrentStateToLocalStorage START ===');
    console.log('DEBUG: classReport being saved:', JSON.stringify(classReport, null, 2));
    console.log('DEBUG: allStudents being saved:', allStudents);
    console.log('DEBUG: classList being saved:', classList);
    console.log('DEBUG: originalClassList being saved:', originalClassList);
    console.log('DEBUG: manuallyAddedStudents being saved:', manuallyAddedStudents);
    
    const currentData = localStorage.getItem('promptCategories');
    let data;
    
    if (currentData) {
        try {
            data = JSON.parse(currentData);
            console.log('DEBUG: Found existing localStorage data, updating it');
        } catch (error) {
            console.error('Error parsing existing localStorage data:', error);
            data = {}; // Create new data structure if parsing fails
        }
    } else {
        console.log('DEBUG: No existing localStorage data found, creating new structure');
        data = {}; // Create new data structure
    }
    
    // Update student name
    data.studentName = studentName;
    // Save class report data for persistence
    data.classReport = classReport;
    data.allStudents = allStudents;
    data.drawnStudents = drawnStudents;
    data.manuallyAddedStudents = manuallyAddedStudents;
    data.totalUniqueStudents = totalUniqueStudents;
    data.classList = classList;
    data.originalClassList = originalClassList;
    
    // Save back to localStorage
    try {
        localStorage.setItem('promptCategories', JSON.stringify(data));
        console.log('DEBUG: Successfully saved to localStorage');
        console.log('DEBUG: Saved data structure:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
    
    console.log('=== DEBUG: saveCurrentStateToLocalStorage END ===');
}


function startNewRound() {
    console.log('Starting new round - resetting all used prompts');
    
    // Reset all used prompts
    usedPrompts = {};
    usedCategories = new Set();
    globalUsedPrompts = {};
    
    // Reset generation state
    isGenerating = false;
    isGenerationComplete = false;
    generationStep = 0;
    shuffledPromptTypes = [];
    generatedCount = 0; // Reset the generated count
    isManualNameEntry = false; // Reset manual entry flag
    
    // Reset animation state
    isAnimating = false;
    
    // Reset category selection
    selectedCategory = null;
    selectedMainCategory = null;
    selectedSubcategory = null;
    
    // Clear intervals
    if (scrambleInterval) {
        clearInterval(scrambleInterval);
        scrambleInterval = null;
    }
    if (revealInterval) {
        clearInterval(revealInterval);
        revealInterval = null;
    }
    
    // Clear the display
    currentPrompts = [];
    
    console.log('New round started - all data reset');
}