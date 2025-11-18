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

// Theme management functions
function applyThemeFromEditor(themeName, bgColor) {
    debugLog('Applying theme from editor:', themeName, bgColor);
    
    // Load theme from editor's localStorage
    const editorTheme = localStorage.getItem('selectedTheme') || 'greenCRT';
    const editorBackground = localStorage.getItem('selectedBackground') || 'black';
    
    // Apply the theme and background by reading from editor's localStorage
    const root = document.documentElement;
    
    // Apply background first
    if (editorBackground === 'grey') {
        root.style.setProperty('--background-color', '#F5F5F5');
        root.style.setProperty('--text-color', '#000000');
        root.style.setProperty('--border-color', '#E0E0E0');
        root.style.setProperty('--frame-background', '#F5F5F5');
    } else if (editorBackground === 'blue-black') {
        root.style.setProperty('--background-color', '#000080');
        root.style.setProperty('--text-color', '#FFFFFF');
        root.style.setProperty('--border-color', '#4169E1');
        root.style.setProperty('--frame-background', '#000080');
    } else if (editorBackground === 'green-crt') {
        root.style.setProperty('--background-color', '#001100');
        root.style.setProperty('--text-color', '#00FF00');
        root.style.setProperty('--border-color', '#003300');
        root.style.setProperty('--frame-background', '#001100');
    } else if (editorBackground === 'orange-crt') {
        root.style.setProperty('--background-color', '#1A0A00');
        root.style.setProperty('--text-color', '#FF8800');
        root.style.setProperty('--border-color', '#331100');
        root.style.setProperty('--frame-background', '#1A0A00');
    } else if (editorBackground === 'blue-crt') {
        root.style.setProperty('--background-color', '#000011');
        root.style.setProperty('--text-color', '#00BFFF');
        root.style.setProperty('--border-color', '#001133');
        root.style.setProperty('--frame-background', '#000011');
    } else if (editorBackground === 'purple-crt') {
        root.style.setProperty('--background-color', '#110011');
        root.style.setProperty('--text-color', '#BF00FF');
        root.style.setProperty('--border-color', '#220022');
        root.style.setProperty('--frame-background', '#110011');
    } else if (editorBackground === 'pink-crt') {
        root.style.setProperty('--background-color', '#1A000A');
        root.style.setProperty('--text-color', '#FF1493');
        root.style.setProperty('--border-color', '#330011');
        root.style.setProperty('--frame-background', '#1A000A');
    } else { // black
        root.style.setProperty('--background-color', '#000000');
        root.style.setProperty('--text-color', '#FFFFFF');
        root.style.setProperty('--border-color', '#333');
        root.style.setProperty('--frame-background', '#000000');
    }
    
    // Apply theme colors
    const themes = {
        orangeCRT: {
            '--primary-color': '#FF8800',
            '--primary-hover': '#FFAA33',
            '--primary-shadow': 'rgba(255, 136, 0, 0.3)',
            '--primary-shadow-hover': 'rgba(255, 136, 0, 0.5)',
            '--primary-shadow-light': 'rgba(255, 136, 0, 0.1)',
            '--accent-color': '#FFAA55',
            '--delete-color': '#FF6B6B',
            '--frame-color': '#FF8800',
            '--frame-border': '#FF8800'
        },
        blueCRT: {
            '--primary-color': '#00BFFF',
            '--primary-hover': '#1E90FF',
            '--primary-shadow': 'rgba(0, 191, 255, 0.3)',
            '--primary-shadow-hover': 'rgba(0, 191, 255, 0.5)',
            '--primary-shadow-light': 'rgba(0, 191, 255, 0.1)',
            '--accent-color': '#87CEEB',
            '--delete-color': '#FF6B6B',
            '--frame-color': '#00BFFF',
            '--frame-border': '#00BFFF'
        },
        windows: {
            '--primary-color': '#FFFFFF',
            '--primary-hover': '#E0E0E0',
            '--primary-shadow': 'rgba(255, 255, 255, 0.3)',
            '--primary-shadow-hover': 'rgba(255, 255, 255, 0.5)',
            '--primary-shadow-light': 'rgba(255, 255, 255, 0.1)',
            '--accent-color': '#C0C0C0',
            '--delete-color': '#FF6B6B',
            '--frame-color': '#FFFFFF',
            '--frame-border': '#FFFFFF'
        },
        greenCRT: {
            '--primary-color': '#00FF00',
            '--primary-hover': '#33FF33',
            '--primary-shadow': 'rgba(0, 255, 0, 0.3)',
            '--primary-shadow-hover': 'rgba(0, 255, 0, 0.5)',
            '--primary-shadow-light': 'rgba(0, 255, 0, 0.1)',
            '--accent-color': '#66FF66',
            '--delete-color': '#FF6B6B',
            '--frame-color': '#00FF00',
            '--frame-border': '#00FF00'
        },
        purpleCRT: {
            '--primary-color': '#BF00FF',
            '--primary-hover': '#DA70D6',
            '--primary-shadow': 'rgba(191, 0, 255, 0.3)',
            '--primary-shadow-hover': 'rgba(191, 0, 255, 0.5)',
            '--primary-shadow-light': 'rgba(191, 0, 255, 0.1)',
            '--accent-color': '#DDA0DD',
            '--delete-color': '#FF6B6B',
            '--frame-color': '#BF00FF',
            '--frame-border': '#BF00FF'
        },
        pinkCRT: {
            '--primary-color': '#FF1493',
            '--primary-hover': '#FF69B4',
            '--primary-shadow': 'rgba(255, 20, 147, 0.3)',
            '--primary-shadow-hover': 'rgba(255, 20, 147, 0.5)',
            '--primary-shadow-light': 'rgba(255, 20, 147, 0.1)',
            '--accent-color': '#FFB6C1',
            '--delete-color': '#FF6B6B',
            '--frame-color': '#FF1493',
            '--frame-border': '#FF1493'
        },
        macintosh: {
            '--primary-color': '#000000',
            '--primary-hover': '#333333',
            '--primary-shadow': 'rgba(0, 0, 0, 0.3)',
            '--primary-shadow-hover': 'rgba(0, 0, 0, 0.5)',
            '--primary-shadow-light': 'rgba(0, 0, 0, 0.1)',
            '--accent-color': '#404040',
            '--delete-color': '#FF6B6B',
            '--frame-color': '#000000',
            '--frame-border': '#000000'
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
    
    debugLog('Theme applied from editor:', editorTheme, editorBackground);
}

// Function to load initial theme when sketch starts
function loadInitialThemeFromEditor() {
    debugLog('Loading initial theme from editor');
    const editorTheme = localStorage.getItem('selectedTheme') || 'greenCRT';
    const editorBackground = localStorage.getItem('selectedBackground') || 'black';
    applyThemeFromEditor(editorTheme, editorBackground);
}

// Apply theme immediately on page load to prevent flashing
document.addEventListener('DOMContentLoaded', function() {
        debugLog('DOM loaded - applying theme immediately');
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
        debugLog('interest-checkboxes element not found');
        return;
    }
    
    // Check if prompt1InterestsMode is enabled - look in global variable first
    let prompt1InterestsMode = false;
    // First check if global variable is set (loaded from data-manager.js)
    if (typeof window.criterionSelectable !== 'undefined') {
        prompt1InterestsMode = window.criterionSelectable;
                debugLog('Using window.criterionSelectable:', prompt1InterestsMode);
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
        debugLog('Using localStorage prompt1InterestsMode:', prompt1InterestsMode);
    }
    // Get parent container using p5.js methods
    const interestContainer = interestCheckboxes.elt ? interestCheckboxes.elt.parentElement : null;
    
    debugLog('populateInterestCheckboxes called, prompt1InterestsMode:', prompt1InterestsMode);
    
    if (!prompt1InterestsMode) {
        // Hide the interest selection section if mode is disabled
        debugLog('Hiding interest section');
        // Hide using p5.js method (primary method)
        const p5Container = select('[data-p5-container="interest"]');
        if (p5Container) {
            p5Container.hide();
        }
        // Also hide DOM element directly
        if (interestContainer) {
            if (interestContainer.elt) {
                interestContainer.elt.style.display = 'none';
            }
        }
        return;
    } else {
        // Show the interest selection section if mode is enabled
        debugLog('Showing interest section, prompt1InterestsMode:', prompt1InterestsMode);
        // Show using p5.js method (primary method)
        const p5Container = select('[data-p5-container="interest"]');
        if (p5Container) {
            p5Container.show();
            debugLog('Interest container shown via p5.js');
        }
        // Also show DOM element directly
        if (interestContainer) {
            if (interestContainer.elt) {
                interestContainer.elt.style.display = 'block';
            }
        }
        debugLog('Interest container display set to block');
    }
    
    // Clear existing category checkboxes (keep "All Categories")
    // IMPORTANT: Clear both DOM elements and p5.js elements to prevent duplication
    // First, remove all p5.js elements
    p5CategoryCheckboxes.forEach(checkbox => {
        if (checkbox) {
            // Remove from p5.js parent
            if (checkbox.parent && checkbox.parent.removeChild) {
                try {
                    checkbox.parent.removeChild(checkbox);
                } catch (e) {
                    console.log('Error removing p5.js element:', e);
                }
            }
            // Also try to remove from DOM directly
            if (checkbox.elt && checkbox.elt.parentElement) {
                try {
                    checkbox.elt.parentElement.removeChild(checkbox.elt);
                } catch (e) {
                    console.log('Error removing DOM element:', e);
                }
            }
        }
    });
    p5CategoryCheckboxes = []; // Reset the array
    
    // Now clear all DOM elements with the category-interest-checkbox class
    const existingCheckboxes = interestCheckboxes.querySelectorAll('.category-interest-checkbox');
    existingCheckboxes.forEach(checkbox => {
        // Remove from DOM
        if (checkbox && checkbox.parentElement) {
            checkbox.parentElement.removeChild(checkbox);
        }
    });
    
    // Also clear any remaining children that aren't "All Categories"
    // More aggressive clearing - remove all divs except the one containing "All Categories"
    if (interestCheckboxes) {
        // CRITICAL: interestCheckboxes is retrieved via document.getElementById, so it's a DOM element
        // But we need to be careful when finding the "All Categories" checkbox
        // First, try to find it using document.getElementById (most reliable)
        let allCategoriesCheckboxEl = document.getElementById('all-categories-checkbox');
        let allCategoriesDiv = null;
        
        if (allCategoriesCheckboxEl) {
            // Find the parent div that contains the checkbox and label
            allCategoriesDiv = allCategoriesCheckboxEl.closest('div');
            debugLog('All Categories checkbox element found');
        } else {
            // Fallback: try querySelector on the container
            allCategoriesCheckboxEl = interestCheckboxes.querySelector('#all-categories-checkbox');
            if (allCategoriesCheckboxEl) {
                allCategoriesDiv = allCategoriesCheckboxEl.closest('div');
                debugLog('All Categories checkbox found via querySelector');
            } else {
                console.log('WARNING: All Categories checkbox not found at all!');
            }
        }
        
        // Remove all children except "All Categories"
        const children = Array.from(interestCheckboxes.children || []);
        debugLog('Clearing category checkboxes, total children:', children.length);
        children.forEach((child, index) => {
            // Only keep the "All Categories" div, remove everything else
            // Check if this child contains the "All Categories" checkbox
            const containsAllCategories = allCategoriesDiv && (child === allCategoriesDiv || child.contains(allCategoriesCheckboxEl));
            
            if (!containsAllCategories) {
                // This is not the "All Categories" div, remove it
                debugLog('Removing child', index);
                try {
                    child.remove();
                } catch (e) {
                    console.log('Error removing child:', e);
                    // Fallback: try to remove via parent
                    if (child.parentNode) {
                        child.parentNode.removeChild(child);
                    }
                }
            } else {
                debugLog('Preserving All Categories div');
            }
        });
        
        // Double-check: query again and remove any remaining category-interest-checkbox elements
        // But preserve the "All Categories" div
        const remainingCheckboxes = interestCheckboxes.querySelectorAll('.category-interest-checkbox');
        remainingCheckboxes.forEach(checkbox => {
            // Only remove if it's not the "All Categories" div or doesn't contain it
            const isAllCategoriesDiv = allCategoriesDiv && (checkbox === allCategoriesDiv || checkbox.contains(allCategoriesCheckboxEl));
            if (!isAllCategoriesDiv) {
                try {
                    checkbox.remove();
                } catch (e) {
                    console.log('Error removing remaining checkbox:', e);
                }
            }
        });
        
        // Verify "All Categories" still exists after clearing
        const verifyAllCategories = document.getElementById('all-categories-checkbox');
        debugLog('All Categories checkbox verification:', !!verifyAllCategories);
        
        // If "All Categories" checkbox doesn't exist, log an error
        if (!verifyAllCategories) {
            console.error('ERROR: All Categories checkbox was removed during clearing!');
            console.error('ERROR: This will cause updateInterestSelection to fail.');
            console.error('ERROR: The checkbox should be created in ui-manager.js createUI() function.');
        }
    }
    
    // Get criterion labels from the global variable (loaded in loadPromptsFromLocalStorage)
    // Note: criterionLabels are no longer required - we use actual category names from data
    const criterionLabels = window.criterionLabels || ['', '', '', ''];
    
    debugLog('Populating interest checkboxes, categories:', Object.keys(categories).length);
    debugLog('Criterion labels found:', criterionLabels);
    
    // Check which categories have content before creating checkboxes
    // The data structure is: categories[promptType][categoryName] = [items]
    // We need to find all unique category names across all prompt types
    const allCategoryNames = new Set();
    
    if (categories && Object.keys(categories).length > 0) {
        Object.keys(categories).forEach(promptType => {
            if (promptType !== 'objective' && promptType !== 'prompt1InterestsMode') {
                const categoryData = categories[promptType];
                if (categoryData && typeof categoryData === 'object') {
                    Object.keys(categoryData).forEach(categoryName => {
                        const items = categoryData[categoryName];
                        // Check if this category has any non-empty items
                        if (Array.isArray(items) && items.length > 0) {
                            const hasNonEmptyItems = items.some(item => 
                                item && item.trim && item.trim().length > 0
                            );
                            if (hasNonEmptyItems) {
                                allCategoryNames.add(categoryName);
                            }
                        }
                    });
                }
            }
        });
    }
    
    debugLog('Category names found:', Array.from(allCategoryNames).length);
    
    // Create categories with content - use actual category names from data
    // Always display the actual category names, not the criterion labels
    const categoriesWithContent = [];
    const categoryNamesArray = Array.from(allCategoryNames);
    
    categoryNamesArray.forEach((categoryName, index) => {
        // Always use the actual category name for display (e.g., "Furniture", "textiles", "electronics")
        // The criterion labels are just row labels in the editor, but the category names are what matter
        categoriesWithContent.push({
            label: categoryName, // Always use actual category name for display
            categoryName: categoryName, // Always use actual category name for data lookup
            categoryLetter: String.fromCharCode(65 + index),
            index: index
        });
        debugLog('Category will be displayed:', categoryName);
    });
    
    debugLog('Categories with content:', categoriesWithContent.length);
    
    // If no categories have content, hide the interest section
    if (categoriesWithContent.length === 0) {
        debugLog('No categories have content, hiding interest section');
        const p5Container = select('[data-p5-container="interest"]');
        if (p5Container) {
            p5Container.hide();
        }
        if (interestContainer && interestContainer.elt) {
            interestContainer.elt.style.display = 'none';
        }
        return;
    }
    
    // Create checkboxes only for categories with content
    categoriesWithContent.forEach((categoryInfo) => {
        const { label, categoryName, categoryLetter, index } = categoryInfo;
        const displayName = label; // Use the criterion label for display
        const dataCategoryName = categoryName || label; // Use actual category name for data lookup
        
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
        checkbox.attribute('data-category', dataCategoryName); // Use actual category name for data lookup
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
        labelElement.style('font-size', '18px');  // Match editor settings-item
        labelElement.style('cursor', 'pointer');
        labelElement.mousePressed(() => {
            // Play click sound for checkbox - ensure audio context is resumed
            if (window.audioCtx) {
                if (window.audioCtx.state === 'suspended') {
                    window.audioCtx.resume().then(() => {
                        // Play sound after context is resumed
                        if (window.playSound && window.SOUND) {
                            window.playSound(window.SOUND.CLICK);
                        }
                    }).catch(e => {
                        console.log('Could not resume audio context:', e);
                        // Try to play anyway
                        if (window.playSound && window.SOUND) {
                            window.playSound(window.SOUND.CLICK);
                        }
                    });
                } else {
                    // Context is already running, play immediately
                    if (window.playSound && window.SOUND) {
                        window.playSound(window.SOUND.CLICK);
                    }
                }
            } else if (window.playSound && window.SOUND) {
                // No audio context available, try to play anyway
                window.playSound(window.SOUND.CLICK);
            }
            
            debugLog('Individual checkbox clicked via label');
            const isChecked = checkbox.attribute('data-checked') === 'true';
            checkbox.attribute('data-checked', !isChecked);
            if (!isChecked) {
                checkbox.style('background-color', 'var(--primary-color)');
                debugLog('Checkbox set to checked');
            } else {
                checkbox.style('background-color', 'var(--background-color)');
                debugLog('Checkbox set to unchecked');
            }
            
            // IMPORTANT: Uncheck "All Categories" when individual category is selected
            const allCategoriesCheckbox = document.getElementById('all-categories-checkbox');
            if (allCategoriesCheckbox) {
                allCategoriesCheckbox.setAttribute('data-checked', 'false');
                allCategoriesCheckbox.style.backgroundColor = 'var(--background-color)';
                debugLog('Unchecked All Categories');
            }
            
            updateInterestSelection();
        });
        
        // Handle checkbox click
        checkbox.mousePressed(() => {
            // Play click sound for checkbox - ensure audio context is resumed
            if (window.audioCtx) {
                if (window.audioCtx.state === 'suspended') {
                    window.audioCtx.resume().then(() => {
                        // Play sound after context is resumed
                        if (window.playSound && window.SOUND) {
                            window.playSound(window.SOUND.CLICK);
                        }
                    }).catch(e => {
                        console.log('Could not resume audio context:', e);
                        // Try to play anyway
                        if (window.playSound && window.SOUND) {
                            window.playSound(window.SOUND.CLICK);
                        }
                    });
                } else {
                    // Context is already running, play immediately
                    if (window.playSound && window.SOUND) {
                        window.playSound(window.SOUND.CLICK);
                    }
                }
            } else if (window.playSound && window.SOUND) {
                // No audio context available, try to play anyway
                window.playSound(window.SOUND.CLICK);
            }
            
            debugLog('Individual checkbox clicked directly');
            const isChecked = checkbox.attribute('data-checked') === 'true';
            const newState = !isChecked;
            
            // Update checkbox state
            checkbox.attribute('data-checked', newState);
            if (newState) {
                checkbox.style('background-color', 'var(--primary-color)');
                debugLog('Checkbox set to checked');
            } else {
                checkbox.style('background-color', 'var(--background-color)');
                debugLog('Checkbox set to unchecked');
            }
            
            // IMPORTANT: Uncheck "All Categories" when individual category is selected
            const allCategoriesCheckbox = document.getElementById('all-categories-checkbox');
            if (allCategoriesCheckbox) {
                allCategoriesCheckbox.setAttribute('data-checked', 'false');
                allCategoriesCheckbox.style.backgroundColor = 'var(--background-color)';
                debugLog('Unchecked All Categories');
            }
            
            // Use setTimeout to ensure checkbox state is fully updated before reading
            // This is necessary because p5.js attribute updates might not be immediately available
            setTimeout(() => {
                debugLog('Calling updateInterestSelection after state update');
                updateInterestSelection();
            }, 10);
        });
    });
}

function updateInterestSelection() {
    debugLog('updateInterestSelection() called');
    const allCategoriesCheckbox = document.getElementById('all-categories-checkbox');
    
    if (!allCategoriesCheckbox) {
        debugLog('allCategoriesCheckbox not found - returning early');
        return;
    }
    
    // Check if prompt1InterestsMode is enabled - look in global variable first
    let prompt1InterestsMode = false;
    // First check if global variable is set (loaded from data-manager.js)
    if (typeof window.criterionSelectable !== 'undefined') {
        prompt1InterestsMode = window.criterionSelectable;
        debugLog('updateInterestSelection using window.criterionSelectable:', prompt1InterestsMode);
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
        debugLog('updateInterestSelection using localStorage prompt1InterestsMode:', prompt1InterestsMode);
    }
    
    if (!prompt1InterestsMode) {
        // Default to all categories when interest mode is disabled
        localStorage.setItem('selectedInterests', 'all');
        return;
    }
    
    debugLog('Individual checkboxes found:', p5CategoryCheckboxes.length);
    const allCategoriesChecked = allCategoriesCheckbox.getAttribute('data-checked') === 'true';
    
    if (allCategoriesChecked) {
        // If "All Categories" is checked, ensure all individual categories are OFF
        debugLog('All Categories is checked - forcing individual categories OFF');
        p5CategoryCheckboxes.forEach(checkbox => {
            checkbox.attribute('data-checked', 'false');
            checkbox.style('background-color', 'var(--background-color)');
        });
        // Store that all categories are selected
        localStorage.setItem('selectedInterests', 'all');
        console.log('All categories selected - all individual categories OFF');
        console.log('DEBUG: Stored "all" in localStorage');
    } else {
        console.log('DEBUG: All Categories is NOT checked - checking individual checkboxes');
        // Check if any individual categories are selected
        // IMPORTANT: Read checkbox states directly from DOM to ensure we get the latest values
        console.log('DEBUG: Checking individual checkbox states...');
        console.log('DEBUG: p5CategoryCheckboxes.length:', p5CategoryCheckboxes.length);
        
        const selectedCategories = [];
        p5CategoryCheckboxes.forEach((checkbox, index) => {
            // Try to read from both p5.js attribute and DOM element to ensure we get the latest value
            const p5Checked = checkbox.attribute('data-checked') === 'true';
            const domChecked = checkbox.elt && checkbox.elt.getAttribute('data-checked') === 'true';
            const isChecked = domChecked || p5Checked; // Prefer DOM value as it's more reliable
            const categoryName = checkbox.attribute('data-category');
            console.log('DEBUG: Checkbox', index, 'category:', categoryName, 'p5 checked:', p5Checked, 'DOM checked:', domChecked, 'final checked:', isChecked);
            if (isChecked) {
                selectedCategories.push(categoryName);
            }
        });
        
        console.log('DEBUG: Selected categories after reading all checkboxes:', selectedCategories);
        console.log('DEBUG: Number of selected categories:', selectedCategories.length, 'out of', p5CategoryCheckboxes.length);
        
        if (selectedCategories.length === 0) {
            // If no categories selected, default back to "All Categories"
            console.log('DEBUG: No categories selected - defaulting to "All Categories"');
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
            console.log('DEBUG: Storing', selectedCategories.length, 'selected categories:', selectedCategories);
            localStorage.setItem('selectedInterests', JSON.stringify(selectedCategories));
            console.log('Individual categories selected:', selectedCategories);
            console.log('DEBUG: Stored in localStorage as:', JSON.stringify(selectedCategories));
            console.log('DEBUG: These category names should match the actual category names in the data structure');
            console.log('DEBUG: Verifying storage - reading back:', localStorage.getItem('selectedInterests'));
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
    draw();  // Redraw once without instructions (prompts remain in currentPrompts)
    
    // Use studentName, previousName, or a generic name for filename
    const nameToUse = studentName || previousName || 'Student';
    const sanitizedStudentName = nameToUse.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `${sanitizedStudentName}_${timestamp}`;
    
    // Save canvas at full window size - ensures consistent aspect ratio
    saveCanvas(filename, 'png');
    
    // Restore instructions and redraw - prompts should still be visible
    showInstructions = true;   // Show instructions again
    draw();  // Redraw with instructions (prompts still in currentPrompts, so they display)
    console.log('Screenshot taken for:', nameToUse, 'at size:', windowWidth, 'x', windowHeight);
    // Note: currentPrompts is NOT modified - prompts remain on screen
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
        
        // Update name input for no class list scenario
        updateNameInputForNoClassList();
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
    
    // Convert hex colors to RGB for p5.js
    const bgRgb = hexToRgb(bgColor);
    const textRgb = hexToRgb(textColor);
    const primaryRgb = hexToRgb(primaryColor);
    
    background(bgRgb.r, bgRgb.g, bgRgb.b);
    
    // Set default font
    textFont(DEFAULT_FONT);
    
    // Draw student name - use brighter color to match prompt results
    // Show previous name if available, otherwise show current name
    const nameToDisplay = previousName || studentName;
    // Use same brighter color as prompts for consistency
    const nameBrightness = 1.3; // 30% brighter than full primary color (matches prompts)
    fill(
        min(primaryRgb.r * nameBrightness, 255),
        min(primaryRgb.g * nameBrightness, 255),
        min(primaryRgb.b * nameBrightness, 255)
    );
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
            
            // Draw category label - use darker shade of primary color
            // Left-aligned with name
            fill(primaryRgb.r * 0.7, primaryRgb.g * 0.7, primaryRgb.b * 0.7);
            textSize(FONT_SIZES.CATEGORY());
            textAlign(LEFT, CENTER);
            const labelX = width * SPACING.TOP_MARGIN;
            text(header, labelX, yPosition);
            
            // Calculate prompt X position - to the right of the label with spacing
            const labelWidth = textWidth(header);
            const spacingBetween = width * 0.02; // 2% of screen width as spacing
            const promptX = labelX + labelWidth + spacingBetween;
            
            // Draw prompt - use much brighter color for strong contrast with labels
            // Positioned to the right of the category label
            // Increase brightness beyond 100% for better visibility (clamped to 255)
            const promptBrightness = 1.3; // 30% brighter than full primary color
            fill(
                min(primaryRgb.r * promptBrightness, 255),
                min(primaryRgb.g * promptBrightness, 255),
                min(primaryRgb.b * promptBrightness, 255)
            );
            textAlign(LEFT, CENTER);
            const prompt = currentPrompts[header];
            
            // Use consistent text size for all prompts (both animated and recalled)
            // Don't enlarge text when navigating with left/right arrows
            if (prompt && typeof prompt === 'object') {
                textSize(min(width, height) * 0.05); //size of prompt text during animation
                text(prompt.revealed, promptX, yPosition);
                text(prompt.rotating, promptX + textWidth(prompt.revealed), yPosition);
            } else {
                // Use same size as animated prompts to prevent enlargement when navigating
                textSize(min(width, height) * 0.05); // Same size as animated prompts
                text(prompt || '', promptX, yPosition);
            }
            
            yPosition += height * SPACING.PROMPT_SPACING;
        }
    });
    
    // Draw student count below name input field
    if (allStudents.length > 1 && nameInput) {
        const currentPosition = currentStudentIndex + 1;
        const totalStudents = allStudents.length;
        
        // Get actual position of name input field from DOM
        const nameInputElement = nameInput.elt;
        if (nameInputElement) {
            const nameInputRect = nameInputElement.getBoundingClientRect();
            const canvasRect = document.querySelector('canvas').getBoundingClientRect();
            const nameInputY = nameInputRect.top - canvasRect.top;
            const nameInputHeight = nameInputRect.height;
            const spacingBelowInput = 10; // Space between input and student count
            
            // Draw student count
            fill(primaryRgb.r, primaryRgb.g, primaryRgb.b);
            textSize(FONT_SIZES.INSTRUCTIONS());
            textAlign(CENTER, TOP);
            text(`Student ${currentPosition} of ${totalStudents}`, 
                 width/2, 
                 nameInputY + nameInputHeight + spacingBelowInput);
        }
    }
    
    // Draw generation progress - use primary color
    fill(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    textSize(FONT_SIZES.INSTRUCTIONS());
    textAlign(RIGHT, BOTTOM);
    
    // Draw instructions only if showInstructions is true - use primary color
    if (showInstructions) {
        fill(primaryRgb.r, primaryRgb.g, primaryRgb.b);
        textSize(FONT_SIZES.INSTRUCTIONS());
        textAlign(CENTER, BOTTOM);
        
        // Show keyboard instructions
        const instructionsY = height * (1 - SPACING.BOTTOM_MARGIN);
        text('↑ or Enter : Generate prompts  |  ↓ : Clear / insert name  |  ← → : Navigate', 
             width/2, 
             instructionsY);
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
    
    // Handle up arrow key for generating prompts (same as Enter)
    if (keyCode === UP_ARROW || key === 'ArrowUp') {
        debugLog('Up arrow pressed - generating prompts');
        
        // CRITICAL: Check input field value FIRST - if empty, error immediately
        // This prevents running prompts when field is cleared but name is still on screen
        let inputValue = '';
        if (nameInput) {
            inputValue = nameInput.value().trim();
        }
        
        // Fallback to DOM element if p5.js input not available
        if (!inputValue) {
            const nameInputElement = document.querySelector('input[placeholder*="student name"], input[placeholder*="Add student"]');
            if (nameInputElement) {
                inputValue = nameInputElement.value.trim();
            }
        }
        
        // If input field is empty, error immediately (even if name is still on screen)
        if (!inputValue || inputValue.length === 0) {
            console.log('No name in input field - cannot generate prompts');
            // Play error beep immediately
            if (audioCtx && window.playSound) {
                window.playSound({FREQUENCY: 200, DURATION: 150});
            }
            return;
        }
        
        // Input field has a value - update studentName and proceed
        studentName = inputValue;
        
        // Blur the input field first
        const nameInputElement = document.querySelector('input[placeholder*="student name"], input[placeholder*="Add student"]');
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
    
    // Handle down arrow key for focusing name input to enter new names
    if (keyCode === DOWN_ARROW || key === 'ArrowDown') {
        debugLog('Down arrow pressed - focusing and clearing name input');
        
        // Clear the name field and variables
        studentName = '';
        previousName = '';
        fieldClearedForNextStudent = false;
        
        // Clear p5.js input if available
        if (nameInput) {
            nameInput.value('');
        }
        
        // Clear DOM input element
        const nameInputElement = document.querySelector('input[placeholder*="student name"], input[placeholder*="Add student"]');
        if (nameInputElement) {
            nameInputElement.value = '';
            nameInputElement.focus();
            
            // Play beep sound
            if (audioCtx && window.playSound) {
                window.playSound({FREQUENCY: 400, DURATION: 100});
            }
            
            console.log('Name field cleared and focused for entry');
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
            
            // CRITICAL: Check input field value FIRST - if empty, error immediately
            // This prevents running prompts when field is cleared but name is still on screen
            let inputValue = '';
            if (nameInput) {
                inputValue = nameInput.value().trim();
            }
            
            // Fallback to DOM element if p5.js input not available
            if (!inputValue && nameInputElement) {
                inputValue = nameInputElement.value.trim();
            }
            
            // If input field is empty, error immediately (even if name is still on screen)
            if (!inputValue || inputValue.length === 0) {
                console.log('No name in input field - cannot generate prompts');
                // Play error beep immediately
                if (audioCtx && window.playSound) {
                    window.playSound({FREQUENCY: 200, DURATION: 150});
                }
                return;
            }
            
            // Input field has a value - update studentName and proceed
            studentName = inputValue;
            
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

function mousePressed() {
    // Mouse click handling removed - no longer needed for comma-separated names
    // Users can now enter multiple names directly in the input field
}

function windowResized() {
    updateUIOnResize();
}
