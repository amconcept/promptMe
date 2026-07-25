// Main Sketch File - Orchestrates all modules
// This is the main entry point that coordinates all functionality

// Core state variables
let studentName = '';
let previousName = ''; // Store completed name for display
window.clearPreviousNameForNavigation = function () { previousName = ''; };
let classList = []; // Array to store student names from class list
let p5CategoryCheckboxes = []; // Global array to store p5.js checkbox elements
let isGenerating = false;
let generationStep = 0;
let audioCtx;
let shouldStop = false;
let isGenerationComplete = false;
let showInstructions = true;
let hideStudentCount = false; // Flag to hide student count during screenshots
let categories = {};
// Use window.currentPrompts as the single source of truth
// Initialize it if it doesn't exist
if (!window.currentPrompts) {
    window.currentPrompts = {};
}
// Keep local reference for convenience
let currentPrompts = window.currentPrompts;

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

// Theme: single source is theme-manager.js (loaded by sketch.html)
function loadInitialThemeFromEditor() {
    debugLog('Loading initial theme via theme-manager');
    if (typeof window.applyThemeFromStorage === 'function') {
        window.applyThemeFromStorage();
    } else if (typeof window.changeTheme === 'function') {
        window.changeTheme(localStorage.getItem('selectedTheme') || 'windows', true);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    debugLog('DOM loaded - applying theme via theme-manager');
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
    hideStudentCount = true;   // Hide student count during screenshot
    // Name lives in a DOM input; paint it on canvas for saveCanvas and hide the overlay
    window._drawCardNameOnCanvas = true;
    let hiddenNameEl = null;
    if (typeof resultNameWrapper !== 'undefined' && resultNameWrapper && resultNameWrapper.elt) {
        hiddenNameEl = resultNameWrapper.elt;
        hiddenNameEl.style.visibility = 'hidden';
    } else if (window.getResultNameFieldElement) {
        const el = window.getResultNameFieldElement();
        if (el && el.parentElement) {
            hiddenNameEl = el.parentElement;
            hiddenNameEl.style.visibility = 'hidden';
        }
    }
    draw();  // Redraw once without instructions and student count (prompts remain in currentPrompts)
    
    // Use studentName, previousName, or a generic name for filename
    const nameToUse = studentName || previousName || 'Student';
    const sanitizedStudentName = nameToUse.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `${sanitizedStudentName}_${timestamp}`;
    
    // Save screenshot using p5.js saveCanvas
    saveCanvas(filename, 'png');
    
    // Restore instructions and student count, then redraw - prompts should still be visible
    window._drawCardNameOnCanvas = false;
    if (hiddenNameEl) hiddenNameEl.style.visibility = '';
    showInstructions = true;   // Show instructions again
    hideStudentCount = false;  // Show student count again
    draw();  // Redraw with instructions and student count (prompts still in currentPrompts, so they display)
}

// Themed popup (same style as editor) for missing objective/prompts
function showThemedMessage(message) {
    const existing = document.getElementById('sketch-themed-message');
    if (existing) existing.remove();
    const popup = document.createElement('div');
    popup.id = 'sketch-themed-message';
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: var(--background-color);
        color: var(--primary-color);
        border: 3px solid var(--primary-color);
        border-radius: 4px;
        padding: 30px 40px;
        font-family: 'VT323', monospace;
        font-size: 24px;
        font-weight: bold;
        text-align: center;
        letter-spacing: 2px;
        z-index: 10000;
        box-shadow: 0 0 20px rgba(0,0,0,0.4);
        animation: sketchMessageFadeIn 0.3s ease-out;
    `;
    popup.textContent = message;
    if (!document.getElementById('sketch-message-styles')) {
        const style = document.createElement('style');
        style.id = 'sketch-message-styles';
        style.textContent = `
            @keyframes sketchMessageFadeIn {
                from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
                to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }
            @keyframes sketchMessageFadeOut {
                from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                to { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
            }
        `;
        document.head.appendChild(style);
    }
    document.body.appendChild(popup);
    setTimeout(() => {
        popup.style.animation = 'sketchMessageFadeOut 0.3s ease-out';
        setTimeout(() => popup.remove(), 300);
    }, 2500);
}

function getAutoRunName() {
    let nextRun = (typeof window.unnamedRunCounter === 'number' && !Number.isNaN(window.unnamedRunCounter))
        ? window.unnamedRunCounter + 1
        : 1;
    let candidate = `Run ${nextRun}`;
    // Prefer classReport names (source of truth for history); allStudents can lag and allow collisions
    const existing = new Set();
    if (Array.isArray(classReport)) {
        classReport.forEach(e => { if (e && e.name) existing.add(e.name); });
    }
    if (Array.isArray(allStudents)) {
        allStudents.forEach(n => { if (n) existing.add(n); });
    }
    while (existing.has(candidate)) {
        nextRun += 1;
        candidate = `Run ${nextRun}`;
    }
    window.unnamedRunCounter = nextRun;
    // Do not push into allStudents here — Up/Enter assigns to currentStudentIndex (NEXT may already have reserved a slot).
    if (typeof saveCurrentStateToLocalStorage === 'function') {
        saveCurrentStateToLocalStorage();
    }
    return candidate;
}

// Returns { missingObjective, missingPrompts } from current categories
function getMissingEditorData() {
    const promptHeaders = categories && Object.keys(categories).filter(cat => cat !== 'objective' && cat !== 'prompt1InterestsMode');
    const hasPromptHeaders = Array.isArray(promptHeaders) && promptHeaders.length > 0;
    const hasPromptContent = hasPromptHeaders && promptHeaders.some(h => {
        const opts = categories[h];
        return opts && typeof opts === 'object' && Object.values(opts).some(arr => Array.isArray(arr) && arr.length > 0);
    });
    const missingObjective = !(categories && (categories.objective || '').trim());
    const missingPrompts = !hasPromptContent;
    return { missingObjective, missingPrompts };
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
        const theme = (event.detail && event.detail.theme) || localStorage.getItem('selectedTheme') || 'windows';
        if (typeof window.changeTheme === 'function') window.changeTheme(theme, true);
    });
    
    // Listen for background changes from editor
    window.addEventListener('backgroundChanged', function(event) {
        console.log('Background change event received from editor:', event.detail);
        const theme = (event.detail && event.detail.theme) || localStorage.getItem('selectedTheme') || 'windows';
        if (typeof window.changeTheme === 'function') window.changeTheme(theme, true);
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
    window.getResultNameHint = function() {
        return (window.classReport && window.classReport.length > 0) ? 'next' : 'start';
    };
    // Result name field ("> " top-left): label edits sync to classReport, allStudents, and localStorage immediately
    window.onResultNameFieldInput = function(value) {
        if (typeof window.syncResultLabelFromInput === 'function') {
            window.syncResultLabelFromInput(value);
        } else {
            studentName = (value || '').trim();
            if (Array.isArray(allStudents)) {
                while (allStudents.length <= currentStudentIndex) allStudents.push('');
                if (currentStudentIndex < 0) currentStudentIndex = 0;
                allStudents[currentStudentIndex] = studentName;
            }
        }
    };

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
    const frameBg = (computedStyle.getPropertyValue('--frame-background') || bgColor).trim();
    
    const bgRgb = hexToRgb(bgColor);
    const textRgb = hexToRgb(textColor);
    const primaryRgb = hexToRgb(primaryColor);
    const frameRgb = hexToRgb(frameBg);
    
    background(bgRgb.r, bgRgb.g, bgRgb.b);
    
    textFont(DEFAULT_FONT);

    // --- Static card + fixed type; prompts wrap at max inner width (no card resize / text zoom) ---
    const cardLayout = (typeof window !== 'undefined' && window.CARD_LAYOUT) ? window.CARD_LAYOUT : {
        WIDTH_RATIO: 0.72, HEIGHT_RATIO: 0.75, PAD_X_RATIO: 0.08, PAD_Y_RATIO: 0.04, CORNER_MAX: 40
    };
    const cardWidth = width * cardLayout.WIDTH_RATIO;
    const cardHeight = height * cardLayout.HEIGHT_RATIO;
    const cardX = (width - cardWidth) / 2;
    const cardY = (height - cardHeight) / 2;
    const cornerRadius = min(cardLayout.CORNER_MAX, cardWidth * 0.06, cardHeight * 0.05);
    const padX = cardWidth * cardLayout.PAD_X_RATIO;
    const padY = cardHeight * cardLayout.PAD_Y_RATIO;
    const innerWidth = cardWidth - padX * 2; // max visual width for prompts / objective wrap
    const MAX_PROMPT_WIDTH = innerWidth; // hard cap: never wider than card content area

    const objectiveText = (categories?.objective || '').trim();
    const prompt1InterestsMode = categories.prompt1InterestsMode || false;
    const promptHeaders = Object.keys(categories).filter(cat => cat !== 'objective' && cat !== 'prompt1InterestsMode');
    const headersToDraw = prompt1InterestsMode && promptHeaders.length > 0 ? promptHeaders.slice(1) : promptHeaders;
    const promptValueTexts = headersToDraw.map(header => {
        const prompt = window.currentPrompts[header];
        if (prompt && typeof prompt === 'object') {
            return {
                display: (prompt.revealed || '') + (prompt.rotating || ''),
                layout: prompt.final || ((prompt.revealed || '') + (prompt.rotating || ''))
            };
        }
        return { display: prompt || '', layout: prompt || '' };
    });
    const fieldName = (window.getResultNameFieldValue && window.getResultNameFieldValue()) || '';
    const displayName = (studentName || previousName || fieldName || '').trim();

    // Fixed design type sizes — slight scale; spacing tuned for up to 4 prompts in static card
    const PROMPT_TO_LABEL_RATIO = 1.4;
    const promptSize = Math.min(width * 0.048, 42);
    const labelSize = promptSize / PROMPT_TO_LABEL_RATIO;
    const objectiveSize = labelSize; // static objective title size
    const nameSize = Math.max(18, Math.min(30, promptSize * 0.72));
    const nameRowHeight = Math.max(34, nameSize * 1.35);
    const promptLineH = promptSize * 1.18;
    const labelLineH = labelSize * 1.12;
    const objectiveLineH = objectiveSize * 1.15;
    const labelGap = labelSize * 0.15; // header → value
    const promptBlockGap = labelSize * 0.5; // between prompt blocks
    // Space between objective title and first prompt (pushes prompts down)
    const objectiveToPromptGap = Math.max(40, padY * 3.);
    const innerLeft = cardX + padX;
    const centerX = cardX + cardWidth / 2;
    const innerTop = cardY + padY + nameRowHeight;
    const innerBottom = cardY + cardHeight - padY;
    const availableHeight = innerBottom - innerTop;

    function wrapTextToWidth(str, maxW) {
        const s = (str || '').toString();
        if (!s) return [''];
        if (textWidth(s) <= maxW) return [s];
        const words = s.split(/\s+/);
        const lines = [];
        let line = '';
        const pushChunkedWord = (word) => {
            let chunk = '';
            for (let c = 0; c < word.length; c++) {
                const next = chunk + word[c];
                if (chunk && textWidth(next) > maxW) {
                    lines.push(chunk);
                    chunk = word[c];
                } else {
                    chunk = next;
                }
            }
            line = chunk;
        };
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            if (!word) continue;
            if (textWidth(word) > maxW) {
                if (line) {
                    lines.push(line);
                    line = '';
                }
                pushChunkedWord(word);
                continue;
            }
            const test = line ? (line + ' ' + word) : word;
            if (line && textWidth(test) > maxW) {
                lines.push(line);
                line = word;
            } else {
                line = test;
            }
        }
        if (line) lines.push(line);
        return lines.length ? lines : [''];
    }

    // Line count follows final prompt (layout); display may scramble but must not add/remove lines
    function linesForPrompt(displayStr, layoutStr, maxW) {
        const layoutLines = wrapTextToWidth(layoutStr || displayStr || '', maxW);
        const lineCount = Math.max(1, layoutLines.length);
        let displayLines = wrapTextToWidth(displayStr || '', maxW);
        // If scramble still wraps more (rare), merge extras into last kept line to avoid bounce
        while (displayLines.length > lineCount) {
            const extra = displayLines.pop();
            displayLines[displayLines.length - 1] =
                (displayLines[displayLines.length - 1] || '') + extra;
        }
        while (displayLines.length < lineCount) displayLines.push('');
        return displayLines.slice(0, lineCount);
    }

    function measureContentHeight() {
        let total = 0;
        if (objectiveText) {
            textSize(objectiveSize);
            textStyle(NORMAL);
            total += wrapTextToWidth(objectiveText.toUpperCase(), MAX_PROMPT_WIDTH).length * objectiveLineH + objectiveToPromptGap;
        }
        for (let i = 0; i < headersToDraw.length; i++) {
            total += labelLineH + labelGap;
            textSize(promptSize);
            textStyle(BOLD);
            const entry = promptValueTexts[i] || { display: '', layout: '' };
            const lines = wrapTextToWidth(entry.layout || entry.display || '', MAX_PROMPT_WIDTH);
            total += lines.length * promptLineH;
            if (i < headersToDraw.length - 1) total += promptBlockGap;
        }
        textStyle(NORMAL);
        return total;
    }

    const contentH = measureContentHeight();

    window.sketchCardBounds = {
        x: cardX,
        y: cardY,
        w: cardWidth,
        h: cardHeight,
        bottom: cardY + cardHeight,
        cornerRadius: cornerRadius,
        nameRowY: cardY + padY,
        nameRowH: nameRowHeight,
        nameSize: nameSize
    };
    if (typeof window.positionNameInputAndButtons === 'function') {
        const key = cardX + ',' + cardY + ',' + nameRowHeight + ',' + nameSize;
        if (window._lastSketchCardNameKey !== key) {
            window._lastSketchCardNameKey = key;
            window.positionNameInputAndButtons();
        }
    }

    noStroke();
    fill(frameRgb.r, frameRgb.g, frameRgb.b);
    rect(cardX, cardY, cardWidth, cardHeight, cornerRadius);

    stroke(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    strokeWeight(4);
    noFill();
    rect(cardX, cardY, cardWidth, cardHeight, cornerRadius);
    noStroke();

    // Name is the DOM input in the card row. Only paint on canvas for screenshots (saveCanvas skips DOM).
    if (window._drawCardNameOnCanvas && displayName) {
        const nr = Number.isFinite(primaryRgb.r) ? primaryRgb.r : textRgb.r;
        const ng = Number.isFinite(primaryRgb.g) ? primaryRgb.g : textRgb.g;
        const nb = Number.isFinite(primaryRgb.b) ? primaryRgb.b : textRgb.b;
        fill(nr, ng, nb);
        textSize(nameSize);
        textStyle(BOLD);
        textAlign(CENTER, CENTER);
        text(displayName, centerX, cardY + padY + nameRowHeight / 2);
        textStyle(NORMAL);
        textAlign(LEFT, TOP);
    }

    // Start under name; objective sits near top, gap below pushes prompts down
    let contentY = innerTop + Math.max(10, padY * 0.9);

    // Objective title: static size, centered
    if (objectiveText) {
        fill(primaryRgb.r * .8, primaryRgb.g * .8, primaryRgb.b * .8);
        textSize(objectiveSize);
        textStyle(NORMAL);
        textAlign(CENTER, TOP);
        const objLines = wrapTextToWidth(objectiveText.toUpperCase(), MAX_PROMPT_WIDTH);
        for (let li = 0; li < objLines.length; li++) {
            text(objLines[li], centerX, contentY + li * objectiveLineH);
        }
        contentY += objLines.length * objectiveLineH + objectiveToPromptGap;
    }

    // Light feedback: show GENERATING… in the card until the first prompt text appears
    const hasPromptDisplay = promptValueTexts.some(p => (p.display || '').length > 0);
    if ((isGenerating || isAnimating) && !hasPromptDisplay) {
        const pulse = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(millis() / 280));
        fill(primaryRgb.r * pulse, primaryRgb.g * pulse, primaryRgb.b * pulse);
        textSize(Math.max(18, promptSize * 0.85));
        textStyle(NORMAL);
        textAlign(CENTER, CENTER);
        text('GENERATING…', centerX, cardY + cardHeight * 0.55);
        textAlign(LEFT, TOP);
        return;
    }

    // Prompts: fixed type; wrap at MAX_PROMPT_WIDTH (card does not resize)
    if (headersToDraw.length > 0) {
        const promptBrightness = 2;
        headersToDraw.forEach((header, i) => {
            const entry = promptValueTexts[i] || { display: '', layout: '' };
            const displayText = entry.display || '';
            const layoutText = entry.layout || displayText;
            fill(primaryRgb.r * .8, primaryRgb.g * .8, primaryRgb.b * .8);
            textSize(labelSize);
            textStyle(NORMAL);
            textAlign(CENTER, TOP);
            text((header || '').toUpperCase(), centerX, contentY);
            contentY += labelLineH + labelGap;
            fill(
                min(primaryRgb.r * promptBrightness, 255),
                min(primaryRgb.g * promptBrightness, 255),
                min(primaryRgb.b * promptBrightness, 255)
            );
            textSize(promptSize);
            textStyle(BOLD);
            textAlign(CENTER, TOP);
            // Line breaks follow final prompt, not scramble width (prevents bounce)
            const lines = linesForPrompt(displayText, layoutText, MAX_PROMPT_WIDTH);
            for (let li = 0; li < lines.length; li++) {
                text(lines[li], centerX, contentY + li * promptLineH);
            }
            contentY += lines.length * promptLineH;
            if (i < headersToDraw.length - 1) contentY += promptBlockGap;
        });
        textStyle(NORMAL);
    }
}

function keyPressed() {
    debugLog('1. Key pressed:', key, 'keyCode:', keyCode);
    
    const resultNameEl = window.getResultNameFieldElement ? window.getResultNameFieldElement() : null;
    const inputFocused = resultNameEl && resultNameEl === document.activeElement;
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

    // Toggle control panel with 'C' key (no-op when panel hidden)
    if (key === 'c' || key === 'C') {
        if (window.toggleControlPanel) window.toggleControlPanel();
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
        let inputValue = (window.getResultNameFieldValue && window.getResultNameFieldValue()) || '';
        if (!inputValue) inputValue = getAutoRunName();
        studentName = inputValue;
        // Keep index on the intended history slot (NEXT sets index === classReport.length).
        // Never clamp to allStudents.length - 1 — that jumped back into an old run and putBack freed its prompts.
        if (studentName && Array.isArray(allStudents)) {
            while (allStudents.length <= currentStudentIndex) allStudents.push('');
            if (currentStudentIndex < 0) currentStudentIndex = 0;
            allStudents[currentStudentIndex] = studentName;
            if (typeof totalUniqueStudents !== 'undefined') totalUniqueStudents = allStudents.length;
        }
        if (resultNameEl) resultNameEl.blur();
        // Check for missing objective or prompts – show themed message and encourage user to fill in editor
        const missing = getMissingEditorData();
        if (missing.missingObjective || missing.missingPrompts) {
            if (audioCtx && window.playSound) {
                window.playSound({ FREQUENCY: 200, DURATION: 150 });
            }
            let msg = 'Waiting for user to input objective and prompts.';
            if (missing.missingObjective && missing.missingPrompts) {
                msg = 'Waiting for user to input objective and prompts.';
            } else if (missing.missingObjective) {
                msg = 'Waiting for user to input objective.';
            } else {
                msg = 'Waiting for user to input prompts.';
            }
            showThemedMessage(msg);
            return;
        }
        
        // Resume audio context on this user gesture so scramble/reveal sounds play (browser requires gesture in call stack)
        if (window.audioCtx && window.audioCtx.state === 'suspended') {
            window.audioCtx.resume().catch(function() {});
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
    
    // Handle down arrow key – advance to a NEW run slot (same as clicking NEXT)
    if (keyCode === DOWN_ARROW || key === 'ArrowDown') {
        debugLog('Down arrow pressed - advancing to next run slot');
        if (typeof window.advanceToNextResultAndClearPrompts === 'function') {
            window.advanceToNextResultAndClearPrompts('');
        }
        if (resultNameEl) resultNameEl.focus();
        if (audioCtx && window.playSound) window.playSound({FREQUENCY: 400, DURATION: 100});
        return;
    }
    
    if (keyCode === 13 || key === 'Enter') {
        debugLog('Return/Enter pressed - generating prompts');
        let inputValue = (window.getResultNameFieldValue && window.getResultNameFieldValue()) || '';
        if (!inputValue) inputValue = getAutoRunName();
        studentName = inputValue;
        // Keep index on the intended history slot (NEXT sets index === classReport.length).
        // Never clamp to allStudents.length - 1 — that jumped back into an old run and putBack freed its prompts.
        if (studentName && Array.isArray(allStudents)) {
            while (allStudents.length <= currentStudentIndex) allStudents.push('');
            if (currentStudentIndex < 0) currentStudentIndex = 0;
            allStudents[currentStudentIndex] = studentName;
            if (typeof totalUniqueStudents !== 'undefined') totalUniqueStudents = allStudents.length;
        }
        if (resultNameEl) resultNameEl.blur();
        const missingEnter = getMissingEditorData();
            if (missingEnter.missingObjective || missingEnter.missingPrompts) {
                if (audioCtx && window.playSound) {
                    window.playSound({ FREQUENCY: 200, DURATION: 150 });
                }
                let msgEnter = 'Waiting for user to input objective and prompts.';
                if (missingEnter.missingObjective && missingEnter.missingPrompts) {
                    msgEnter = 'Waiting for user to input objective and prompts.';
                } else if (missingEnter.missingObjective) {
                    msgEnter = 'Waiting for user to input objective.';
                } else {
                    msgEnter = 'Waiting for user to input prompts.';
                }
                showThemedMessage(msgEnter);
                return;
            }
            
            // Resume audio context on this user gesture so scramble/reveal sounds play (browser requires gesture in call stack)
            if (window.audioCtx && window.audioCtx.state === 'suspended') {
                window.audioCtx.resume().catch(function() {});
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
    // Result name is in "> " field top-left (ui-manager); no canvas hit area needed
}

function windowResized() {
    updateUIOnResize();
}

// Export functions to window for use in other modules
window.takeScreenshot = takeScreenshot;
