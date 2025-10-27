// Main Sketch File - Orchestrates all modules
// This is the main entry point that coordinates all functionality

// Core state variables
let studentName = '';
let previousName = ''; // Store completed name for display
let classList = []; // Array to store student names from class list
let p5CategoryCheckboxes = []; // Global array to store p5.js checkbox elements
let isGenerating = false;
let generationStep = 0;
let audioCtx;
let shouldStop = false;
let isGenerationComplete = false;
let showInstructions = true;
let categories = {};
let currentPrompts = {};
let fieldClearedForNextStudent = false; // Track if field was cleared after name entry

// Define arrow key constants (not automatically available in p5.js)
const UP_ARROW = 38;
const DOWN_ARROW = 40;
const LEFT_ARROW = 37;
const RIGHT_ARROW = 39;

// Debug flag
let DEBUG = true;

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

// Function for navigating to editor - defined at global scope
function goToEditor() {
    console.log('Design Prompts button clicked - redirecting to editor.html');
    console.log('DEBUG: Current classReport before saving:', JSON.stringify(classReport, null, 2));
    console.log('DEBUG: Current allStudents before saving:', allStudents);
    console.log('DEBUG: Current totalUniqueStudents before saving:', totalUniqueStudents);
    
    // Force save current state before navigation
    saveCurrentStateToLocalStorage();
    
    // Add a longer delay to ensure save completes
    setTimeout(() => {
        console.log('DEBUG: Verifying save completed - checking localStorage');
        const savedData = localStorage.getItem('promptCategories');
        if (savedData) {
            const parsed = JSON.parse(savedData);
            console.log('DEBUG: Saved classReport in localStorage:', JSON.stringify(parsed.classReport, null, 2));
            console.log('DEBUG: Saved allStudents in localStorage:', parsed.allStudents);
        }
        console.log('Redirecting to editor.html from button');
        window.location.href = 'editor.html?from=sketch';
    }, 200); // Increased delay to ensure save completes
}

// Theme management functions
function applyThemeFromEditor(themeName, bgColor) {
    console.log('Applying theme from editor:', themeName, bgColor);
    
    // Load theme from editor's localStorage
    const editorTheme = localStorage.getItem('selectedTheme') || 'orange';
    const editorBackground = localStorage.getItem('selectedBackground') || 'black';
    
    // Apply the theme and background by reading from editor's localStorage
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
    
    // Apply theme colors
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

// Student interest selection functions
function refreshInterestSection() {
    populateInterestCheckboxes();
    updateInterestSelection();
}

function populateInterestCheckboxes() {
    const interestCheckboxes = document.getElementById('interest-checkboxes');
    if (!interestCheckboxes) {
        console.log('DEBUG: interest-checkboxes element not found');
        return;
    }
    
    // Check if prompt1InterestsMode is enabled - look in global variable first
    let prompt1InterestsMode = false;
    // First check if global variable is set (loaded from data-manager.js)
    if (typeof window.criterionSelectable !== 'undefined') {
        prompt1InterestsMode = window.criterionSelectable;
        console.log('DEBUG: Using window.criterionSelectable:', prompt1InterestsMode);
    } else {
        // Fallback: check localStorage
        const promptData = localStorage.getItem('promptCategories');
        if (promptData) {
            try {
                const parsedData = JSON.parse(promptData);
                prompt1InterestsMode = parsedData.prompt1InterestsMode === true;
            } catch (e) {
                console.error('Error parsing prompt data for interests mode:', e);
            }
        }
        console.log('DEBUG: Using localStorage prompt1InterestsMode:', prompt1InterestsMode);
    }
    // Get parent container using p5.js methods
    const interestContainer = interestCheckboxes.elt ? interestCheckboxes.elt.parentElement : null;
    
    console.log('DEBUG: populateInterestCheckboxes called');
    console.log('DEBUG: prompt1InterestsMode from localStorage:', localStorage.getItem('prompt1InterestsMode'));
    console.log('DEBUG: prompt1InterestsMode boolean:', prompt1InterestsMode);
    console.log('DEBUG: interestContainer found:', !!interestContainer);
    
    if (!prompt1InterestsMode) {
        // Hide the interest selection section if mode is disabled
        console.log('DEBUG: Hiding interest section');
        if (interestContainer) {
            interestContainer.style.display = 'none';
        }
        // Also hide using p5.js method
        const p5Container = select('[data-p5-container="interest"]');
        if (p5Container) p5Container.hide();
        return;
    } else {
        // Show the interest selection section if mode is enabled
        console.log('DEBUG: Showing interest section');
        if (interestContainer) {
            interestContainer.style.display = 'block';
        }
        // Also show using p5.js method
        const p5Container = select('[data-p5-container="interest"]');
        if (p5Container) p5Container.show();
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
        // Skip empty labels
        if (!label || !label.trim()) {
            console.log('DEBUG: Criterion at index', index, 'is empty, skipping');
            return;
        }
        
        const trimmedLabel = label.trim();
        
        // Check if this criterion has content in any prompt column
        let hasContent = false;
        if (categories && Object.keys(categories).length > 0) {
            Object.keys(categories).forEach(promptType => {
                if (promptType !== 'objective' && promptType !== 'prompt1InterestsMode') {
                    const categoryData = categories[promptType];
                    if (categoryData && categoryData[trimmedLabel]) {
                        // Check if the category has any non-empty prompts
                        const prompts = categoryData[trimmedLabel];
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
        
        // Only include category if it has content
        if (hasContent) {
            categoriesWithContent.push({
                label: trimmedLabel,
                categoryLetter: String.fromCharCode(65 + index), // A, B, C, D for backward compatibility
                index: index
            });
            console.log('DEBUG: Criterion "' + trimmedLabel + '" has content, will be included');
        } else {
            console.log('DEBUG: Criterion "' + trimmedLabel + '" has no content, will be excluded');
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
        checkbox.attribute('data-category', label); // Use actual label, not letter
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
        
        const labelElement = createDiv(displayName);
        labelElement.parent(categoryDiv);
        labelElement.style('color', 'var(--primary-color)');
        labelElement.style('font-size', '16px');  // Match editor control panel
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
    
    // Check if prompt1InterestsMode is enabled - look in global variable first
    let prompt1InterestsMode = false;
    // First check if global variable is set (loaded from data-manager.js)
    if (typeof window.criterionSelectable !== 'undefined') {
        prompt1InterestsMode = window.criterionSelectable;
        console.log('DEBUG: updateInterestSelection using window.criterionSelectable:', prompt1InterestsMode);
    } else {
        // Fallback: check localStorage
        const promptData = localStorage.getItem('promptCategories');
        if (promptData) {
            try {
                const parsedData = JSON.parse(promptData);
                prompt1InterestsMode = parsedData.prompt1InterestsMode === true;
            } catch (e) {
                console.error('Error parsing prompt data for interests mode:', e);
            }
        }
        console.log('DEBUG: updateInterestSelection using localStorage prompt1InterestsMode:', prompt1InterestsMode);
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

// Helper function to shuffle arrays
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Screenshot function
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

// p5.js main functions
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
    }, 100); // Reduced delay since editor now saves fresh data immediately
    
    // Load initial theme from editor with a small delay to prevent flashing
    setTimeout(() => {
        loadInitialThemeFromEditor();
    }, 10);
    
    // Create UI elements
    createUI();
    
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
    
    // Position name input after data is loaded
    positionNameInputAndButtons();
    
    // Update name input for no class list scenario
    updateNameInputForNoClassList();
    
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
    
    // Convert hex colors to RGB for p5.js
    const bgRgb = hexToRgb(bgColor);
    const textRgb = hexToRgb(textColor);
    const primaryRgb = hexToRgb(primaryColor);
    
    background(bgRgb.r, bgRgb.g, bgRgb.b);
    
    // Set default font
    textFont(DEFAULT_FONT);
    
    // Draw student name - use primary color for emphasis
    // Show previous name if available, otherwise show current name
    const nameToDisplay = previousName || studentName;
    fill(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    textSize(FONT_SIZES.NAME());
    textAlign(LEFT, TOP);
    text(nameToDisplay, width * SPACING.TOP_MARGIN, height * SPACING.TOP_MARGIN);
    
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
            
            // Draw category - use darker shade of primary color
            fill(primaryRgb.r * 0.7, primaryRgb.g * 0.7, primaryRgb.b * 0.7);
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

function keyPressed() {
    debugLog('1. Key pressed:', key, 'keyCode:', keyCode);
    
    // Check if input field is focused
    const inputFocused = nameInput && nameInput.elt === document.activeElement;
    const activeElement = document.activeElement;
    const inInputField = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable);
    
    // When input is NOT focused, all keys work normally
    if (!inputFocused && !inInputField) {
        // All keys work normally when input is not focused
    } else {
        // When input IS focused:
        // - UP arrow blurs input (allow through)
        // - DOWN arrow focuses input (allow through)  
        // - LEFT/RIGHT arrows work if UP was pressed first (allow through)
        // - ENTER/RETURN generates prompts (allow through)
        // - All other keys blocked
        if (keyCode !== UP_ARROW && keyCode !== DOWN_ARROW && keyCode !== LEFT_ARROW && keyCode !== RIGHT_ARROW && keyCode !== 13 && key !== 'Enter') {
            debugLog('Input field focused, ignoring keypress:', key);
            return;
        }
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
        previousName = ''; // Clear previous name
        prevStudent();
        // Play beep sound
        if (audioCtx && window.playSound) {
            window.playSound({FREQUENCY: 300, DURATION: 80});
        }
        return;
    }
    
    if (keyCode === RIGHT_ARROW) {
        console.log('Right arrow pressed - navigating to next student');
        previousName = ''; // Clear previous name
        nextStudent();
        // Play beep sound
        if (audioCtx && window.playSound) {
            window.playSound({FREQUENCY: 500, DURATION: 80});
        }
        return;
    }
    
    // Handle up arrow key for blurring input field (allows left/right navigation)
    if (keyCode === UP_ARROW || key === 'ArrowUp') {
        console.log('Up arrow pressed - blurring input field');
        // Get the name input from ui-manager.js
        const nameInputElement = document.querySelector('input[placeholder*="student name"], input[placeholder*="Add student"]');
        if (nameInputElement) {
            nameInputElement.blur();
            // Play beep sound
            if (audioCtx && window.playSound) {
                window.playSound({FREQUENCY: 600, DURATION: 80});
            }
            console.log('Input field blurred - can now use left/right arrows');
        }
        return;
    }
    
    // Handle down arrow key for focusing name input to enter new names
    if (keyCode === DOWN_ARROW || key === 'ArrowDown') {
        debugLog('Down arrow pressed - focusing name input');
        // Get the name input from ui-manager.js
        const nameInputElement = document.querySelector('input[placeholder*="student name"], input[placeholder*="Add student"]');
        if (nameInputElement) {
            // Don't clear - just focus
            nameInputElement.focus();
            nameInputElement.select(); // Select existing text for easy replacement
            fieldClearedForNextStudent = false; // Reset flag when focusing field again
            
            // Play beep sound
            if (audioCtx && window.playSound) {
                window.playSound({FREQUENCY: 400, DURATION: 100});
            }
            
            console.log('Name field focused for entry');
        }
        return;
    }
    
    // Handle Return/Enter key - two stage behavior
    if (keyCode === 13 || key === 'Enter') { // Return/Enter key
        const nameInputElement = document.querySelector('input[placeholder*="student name"], input[placeholder*="Add student"]');
        const inputFocused = nameInputElement && nameInputElement === document.activeElement;
        
        if (inputFocused && !fieldClearedForNextStudent) {
            // Stage 1: Clear field for next student (with a name already there)
            console.log('Enter pressed - clearing field for next student');
            nameInputElement.value = '';
            studentName = '';
            previousName = '';
            fieldClearedForNextStudent = true;
            
            // Play beep sound
            if (audioCtx && window.playSound) {
                window.playSound({FREQUENCY: 500, DURATION: 100});
            }
            return;
        } else {
            // Stage 2: Generate prompts (field already cleared or no name)
            debugLog('Return/Enter pressed - generating prompts');
            
            // Blur the input field first
            if (nameInputElement) {
                nameInputElement.blur();
            }
            
            // Check if categories exists and has content
            if (!categories || Object.keys(categories).filter(cat => cat !== 'objective' && cat !== 'prompt1InterestsMode').length === 0) {
                console.error('No categories loaded or categories empty. Categories:', categories);
                console.error('Available categories:', Object.keys(categories));
                alert('No prompt categories found. Please go to the editor to set up prompts first.');
                return;
            }
            
            // Call startGeneration which will trigger animation
            if (window.startGeneration) {
                debugLog('Calling window.startGeneration');
                window.startGeneration();
                fieldClearedForNextStudent = false; // Reset flag
            } else {
                console.error('startGeneration is not available on window object');
                // Force reset regardless of isGenerating state
                if (window.resetGeneratorState) {
                    window.resetGeneratorState();
                }
                if (window.generateNextAttribute) {
                    window.generateNextAttribute();
                }
                fieldClearedForNextStudent = false; // Reset flag
            }
            return;
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

function windowResized() {
    updateUIOnResize();
}
