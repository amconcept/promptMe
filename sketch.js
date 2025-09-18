let studentName = '';
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
let exhaustMode = false; // When true, stop generation after all options are used

// Add selected category for generation
let selectedCategory = null;
let usedCategories = new Set(); // Track which categories have been used in the current cycle
let isAnimating = false; // Track if an animation is currently running
let shuffledPromptTypes = []; // Store the shuffled order of prompt types for the current generation
let globalUsedPrompts = {}; // Track used prompts across ALL categories for exhaust mode
let exhaustSettings = {}; // Track which prompt types should be exhausted
let constraintSettings = {}; // Track which prompt types should be constrained
let exhaustModeType = 'row'; // Track exhaustion mode: 'row', 'column', or 'table'

// Theme system
let currentTheme = 'apple2';
let themes = {
    apple2: {
        name: 'Apple 2',
        colors: {
            BACKGROUND: '#000000',
            TEXT: '#00FF00',
            HIGHLIGHT: '#33FF33',
            DIM: '#006600',
            ACCENT: '#00CC00'
        },
        font: 'VT323',
        style: 'monochrome'
    },
    macintosh: {
        name: 'Macintosh',
        colors: {
            BACKGROUND: '#C0C0C0',
            TEXT: '#000000',
            HIGHLIGHT: '#0000FF',
            DIM: '#808080',
            ACCENT: '#FF0000'
        },
        font: 'Chicago',
        style: 'classic'
    },
    windows94: {
        name: 'Windows 94',
        colors: {
            BACKGROUND: '#C0C0C0',
            TEXT: '#000000',
            HIGHLIGHT: '#000080',
            DIM: '#808080',
            ACCENT: '#800000'
        },
        font: 'MS Sans Serif',
        style: 'windows'
    },
    graffiti: {
        name: 'Graffiti',
        colors: {
            BACKGROUND: '#1a1a1a',
            TEXT: '#FF6B35',
            HIGHLIGHT: '#F7931E',
            DIM: '#666666',
            ACCENT: '#00FF41'
        },
        font: 'Impact',
        style: 'street'
    },
    expo67: {
        name: 'Modernism Expo 67',
        colors: {
            BACKGROUND: '#2C3E50',
            TEXT: '#ECF0F1',
            HIGHLIGHT: '#E74C3C',
            DIM: '#7F8C8D',
            ACCENT: '#F39C12'
        },
        font: 'Futura',
        style: 'modern'
    }
};

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

// Theme-specific rotating characters
function getRotatingChars() {
    const charSets = {
        apple2: ['█', '▀', '▄', '▌', '▐', '░', '▒', '▓'],
        macintosh: ['■', '□', '●', '○', '▲', '△', '▼', '▽'],
        windows94: ['█', '▄', '▀', '▌', '▐', '░', '▒', '▓'],
        graffiti: ['█', '▓', '▒', '░', '▄', '▀', '▌', '▐'],
        expo67: ['◊', '◈', '◉', '◊', '◈', '◉', '◊', '◈']
    };
    return charSets[currentTheme] || charSets.apple2;
}

// Theme-aware color getter
function getThemeColors() {
    return themes[currentTheme].colors;
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
    WIDTH: () => min(width * 0.15, 180),    // 15% of width, max 180px
    HEIGHT: () => min(height * 0.06, 50),    // 6% of height, max 50px
    MARGIN: () => min(width * 0.03, 40),     // 3% of width, max 40px
    BOTTOM_MARGIN: () => min(height * 0.05, 40), // 5% of height, max 40px
    ELEMENT_SPACING: () => min(height * 0.02, 20) // Minimum spacing between elements
};

function preload() {
    loadPromptsFromLocalStorage();
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    textFont('VT323');
    textAlign(CENTER, CENTER);
    
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    studentName = '';
    
    // Add native ESC key handler as backup
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            console.log('Native ESC handler triggered - redirecting to editor.html');
            saveCurrentStateToLocalStorage();
            // Use a small delay to ensure the save completes
            setTimeout(() => {
                console.log('Redirecting to editor.html now');
                window.location.href = 'editor.html';
            }, 50);
        }
    });
    
    // Load and check data
    loadPromptsFromLocalStorage();
    loadStudentNameFromLocalStorage();
    checkPromptData();
    
    // Create and position save button
    saveButton = createButton('Save Image');
    const bottomMargin = BUTTON_SIZES.BOTTOM_MARGIN();
    const elementHeight = BUTTON_SIZES.HEIGHT();
    const elementSpacing = BUTTON_SIZES.ELEMENT_SPACING();
    
    saveButton.position(
        BUTTON_SIZES.MARGIN(), 
        height - bottomMargin - elementHeight
    );
    
    // Add this line to connect the click handler
    saveButton.mousePressed(saveImage);
    
    // Style save button responsively with theme colors
    const colors = getThemeColors();
    saveButton.style('background-color', colors.BACKGROUND);
    saveButton.style('color', colors.TEXT);
    saveButton.style('font-family', themes[currentTheme].font);
    saveButton.style('font-size', FONT_SIZES.BUTTON() + 'px');
    saveButton.style('width', BUTTON_SIZES.WIDTH() + 'px');
    saveButton.style('height', BUTTON_SIZES.HEIGHT() + 'px');
    saveButton.style('border', '2px solid ' + colors.HIGHLIGHT);
    saveButton.style('border-radius', '5px');
    saveButton.style('cursor', 'pointer');
    saveButton.style('display', 'flex');
    saveButton.style('align-items', 'center');
    saveButton.style('justify-content', 'center');
    saveButton.style('white-space', 'nowrap');
    saveButton.style('min-width', 'fit-content');
    
    // Create name input with empty initial value
    nameInput = createInput('');
    nameInput.position(
        BUTTON_SIZES.MARGIN(), 
        height - bottomMargin - (elementHeight * 2) - elementSpacing
    );
    
    // Add input event handler
    nameInput.input(() => {
        studentName = nameInput.value(); // Update studentName when input changes
        localStorage.setItem('studentName', studentName); // Save to localStorage
    });
    
    // Style name input responsively with theme colors
    nameInput.size(BUTTON_SIZES.WIDTH());
    nameInput.style('height', BUTTON_SIZES.HEIGHT() + 'px');
    nameInput.style('font-family', themes[currentTheme].font);
    nameInput.style('font-size', FONT_SIZES.INPUT() + 'px');
    nameInput.style('color', colors.TEXT);
    nameInput.style('background-color', colors.BACKGROUND);
    nameInput.style('border', '1px solid ' + colors.HIGHLIGHT);
    nameInput.style('padding', '5px 10px');
    nameInput.style('box-sizing', 'border-box');
    nameInput.attribute('placeholder', 'Enter student name here');
    
    checkAndClearCache();
    loadPromptsFromLocalStorage();
    loadThemeFromLocalStorage();
    checkCategoryStructure();
    initializeUnusedPrompts();
    resetPrompts();
    
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
        alert('Student name is not set. Unable to save the image.');
    }
}

function updateStudentName() {
    studentName = nameInput.value();
    localStorage.setItem('studentName', studentName);
}

function draw() {
    const colors = getThemeColors();
    background(colors.BACKGROUND);
    
    // Set theme font
    textFont(themes[currentTheme].font);
    
    // Draw student name
    fill(colors.DIM);
    textSize(FONT_SIZES.NAME());
    textAlign(LEFT, TOP);
    text(studentName, width * SPACING.TOP_MARGIN, height * SPACING.TOP_MARGIN);
    
    // Draw objective - make it dynamic
    fill(colors.HIGHLIGHT);
    textSize(FONT_SIZES.OBJECTIVE());
    textAlign(LEFT, TOP);
    const defaultObjective = 'Design an object for a character with the following traits:';
    text(categories?.objective || defaultObjective, 
         width * SPACING.TOP_MARGIN, 
         height * SPACING.OBJECTIVE_MARGIN);
    
    // Draw prompts
    let yPosition = height * SPACING.PROMPT_START;
    
    Object.keys(categories).forEach(header => {
        if (header !== 'objective') {
            // Draw category
            fill(colors.DIM);
            textSize(FONT_SIZES.CATEGORY());
            textAlign(RIGHT, CENTER);
            text(header, width * SPACING.CATEGORY_OFFSET, yPosition);
            
            // Draw prompt
            fill(colors.TEXT);
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
    
    // Draw constraint status and generation progress
    fill(colors.DIM);
    textSize(FONT_SIZES.INSTRUCTIONS());
    textAlign(RIGHT, BOTTOM);
    
    const categoryNames = Object.keys(categories).filter(cat => cat !== 'objective');
    
    let statusText = '';
    
    // Only show feedback when constraint is enabled AND exhaust mode is enabled
    if (constraintEnabled && exhaustMode) {
        // Calculate total possible generations based on selected exhaust column
        let totalPossibleGenerations = 0;
        
        // Get the selected exhaust column from localStorage
        const currentData = localStorage.getItem('promptCategories');
        let exhaustColumn = null;
        if (currentData) {
            try {
                const data = JSON.parse(currentData);
                exhaustColumn = data.exhaustColumn;
            } catch (e) {
                console.error('Error parsing exhaust column data:', e);
            }
        }
        
        // Find the actual prompt type that matches the selected exhaust column
        let actualPromptType = null;
        if (exhaustColumn) {
            // Look for a category that matches the exhaust column name
            for (const promptType of categoryNames) {
                if (promptType === exhaustColumn || promptType.includes(exhaustColumn)) {
                    actualPromptType = promptType;
                    break;
                }
            }
        }
        
        if (actualPromptType && categories[actualPromptType]) {
            // Count the total number of items in the selected prompt column
            // This represents the maximum number of complete generations possible
            const availableCategories = Object.keys(categories[actualPromptType] || {});
            
            debugLog('Calculating total possible generations:', {
                actualPromptType,
                availableCategories,
                categories: categories[actualPromptType]
            });
            
            for (const category of availableCategories) {
                const promptOptions = categories[actualPromptType][category];
                if (promptOptions && Array.isArray(promptOptions)) {
                    totalPossibleGenerations += promptOptions.length;
                    debugLog(`Added ${promptOptions.length} items from category ${category}, total now: ${totalPossibleGenerations}`);
                }
            }
        } else {
            // Fallback: if no column selected, count total items in first available column
            const firstPromptType = categoryNames[0];
            if (firstPromptType && categories[firstPromptType]) {
                const availableCategories = Object.keys(categories[firstPromptType] || {});
                
                for (const category of availableCategories) {
                    const promptOptions = categories[firstPromptType][category];
                    if (promptOptions && Array.isArray(promptOptions)) {
                        totalPossibleGenerations += promptOptions.length;
                    }
                }
            }
        }
        
        // Calculate how many generations have been completed
        // Count the minimum number of items used across all prompt types
        // This represents the number of complete generations finished
        let completedGenerations = 0;
        
        if (Object.keys(usedPrompts).length > 0) {
            // Find the minimum number of items used across all prompt types
            let minUsedItems = Infinity;
            for (const promptType of categoryNames) {
                if (usedPrompts[promptType]) {
                    minUsedItems = Math.min(minUsedItems, usedPrompts[promptType].size);
                }
            }
            
            if (minUsedItems !== Infinity) {
                completedGenerations = minUsedItems;
            }
        }
        
        const remainingGenerations = totalPossibleGenerations - completedGenerations;
        statusText = `GENERATIONS: ${remainingGenerations}`;
        
        debugLog('Generation count calculation:', {
            totalPossibleGenerations,
            completedGenerations,
            remainingGenerations,
            usedPromptsSizes: Object.keys(usedPrompts).reduce((acc, key) => {
                acc[key] = usedPrompts[key] ? usedPrompts[key].size : 0;
                return acc;
            }, {})
        });
    }
    // When constraint is off, statusText remains empty
    
    if (statusText) {
        text(statusText, width - width * SPACING.TOP_MARGIN, height * (1 - SPACING.BOTTOM_MARGIN));
    }
    
    // Draw theme indicator
    fill(colors.ACCENT);
    textSize(FONT_SIZES.INSTRUCTIONS());
    textAlign(LEFT, BOTTOM);
    text(`THEME: ${themes[currentTheme].name.toUpperCase()}`, width * SPACING.TOP_MARGIN, height * (1 - SPACING.BOTTOM_MARGIN));
    
    // Draw instructions only if showInstructions is true
    if (showInstructions) {
        fill(colors.DIM);
        textSize(FONT_SIZES.INSTRUCTIONS());
        textAlign(CENTER, BOTTOM);
        const categoryNames = Object.keys(categories).filter(cat => cat !== 'objective');
        const promptCount = categoryNames.length;
        text(`Press ESC to return to main menu`, 
             width/2, 
             height * (1 - SPACING.BOTTOM_MARGIN));
    }
}

function keyPressed() {
    debugLog('1. Key pressed:', key, 'keyCode:', keyCode);
    
    // Ignore keypresses if the name input is focused
    if (nameInput && nameInput.elt === document.activeElement) {
        debugLog('Input field focused, ignoring keypress');
        return;
    }

    if (keyCode === ESCAPE) {
        // Prevent default browser behavior
        console.log('ESC pressed in p5.js handler');
        // The native handler will take care of the redirect
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
    
    if (key === ' ') {
        if (isGenerating) {
            shouldStop = true;
            isGenerating = false;
        }
    }
    
    
    // Theme switching with number keys
    if (key >= '1' && key <= '5') {
        const themeKeys = ['apple2', 'macintosh', 'windows94', 'graffiti', 'expo67'];
        const themeIndex = parseInt(key) - 1;
        if (themeIndex < themeKeys.length) {
            switchTheme(themeKeys[themeIndex]);
        }
    }
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
    const promptTypes = Object.keys(categories).filter(cat => cat !== 'objective');
    shuffledPromptTypes = [...promptTypes]; // Keep original order
    debugLog('Prompt types for this generation (in order):', shuffledPromptTypes);
    debugLog('Current settings - constraintEnabled:', constraintEnabled, 'exhaustMode:', exhaustMode);
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
        const availableCategories = Object.keys(firstPromptData);
        
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
        
        // Select a random category that will be used for ALL prompts in this generation
        selectedCategory = candidateCategories[Math.floor(Math.random() * candidateCategories.length)];
        usedCategories.add(selectedCategory);
        debugLog('Selected category for entire generation:', selectedCategory, 'from candidates:', candidateCategories);
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
            
            // Mark this as a reset event for exhaustion tracking
            // This ensures the exhaustion logic knows this prompt type has cycled through all items
            if (exhaustMode) {
                const globalKey = `${currentPromptType}_${selectedCategory}_RESET`;
                globalUsedPrompts[globalKey] = true;
                debugLog('Marked reset event for exhaustion tracking:', globalKey);
            }
        } else {
            // Select random unused item
            selectedPrompt = unusedItems[Math.floor(Math.random() * unusedItems.length)];
        }
        
        if (selectedPrompt) {
            usedPrompts[currentPromptType].add(selectedPrompt);
            
            // Also track globally for exhaust mode
            if (exhaustMode) {
                const globalKey = `${currentPromptType}_${selectedCategory}_${selectedPrompt}`;
                if (!globalUsedPrompts[globalKey]) {
                    globalUsedPrompts[globalKey] = true;
                    debugLog('Added to global tracking:', globalKey);
                }
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
                    
                    // Check if exhaust mode is enabled and all options are exhausted
                    // Only check exhaustion at the end of a complete generation
                    if (exhaustMode) {
                        // Get the selected exhaust column from localStorage
                        const currentData = localStorage.getItem('promptCategories');
                        let exhaustColumn = null;
                        if (currentData) {
                            try {
                                const data = JSON.parse(currentData);
                                exhaustColumn = data.exhaustColumn;
                            } catch (e) {
                                console.error('Error parsing exhaust column data:', e);
                            }
                        }
                        
                        debugLog('Exhaust mode check:', {
                            exhaustMode,
                            exhaustColumn,
                            usedPrompts: Object.keys(usedPrompts),
                            usedPromptsSizes: Object.keys(usedPrompts).reduce((acc, key) => {
                                acc[key] = usedPrompts[key] ? usedPrompts[key].size : 0;
                                return acc;
                            }, {})
                        });
                        
                        // Check if the selected exhaust column is exhausted
                        let isExhausted = false;
                        
                        // Find the actual prompt type that matches the selected exhaust column
                        let actualPromptType = null;
                        if (exhaustColumn) {
                            debugLog('Looking for exhaust column match:', {
                                exhaustColumn,
                                categoryNames,
                                categories: Object.keys(categories)
                            });
                            // Look for a category that matches the exhaust column name
                            for (const promptType of categoryNames) {
                                if (promptType === exhaustColumn || promptType.includes(exhaustColumn)) {
                                    actualPromptType = promptType;
                                    debugLog('Found matching prompt type:', actualPromptType);
                                    break;
                                }
                            }
                            if (!actualPromptType) {
                                debugLog('No matching prompt type found for exhaust column:', exhaustColumn);
                            }
                        }
                        
                        if (actualPromptType && categories[actualPromptType]) {
                            // Count the total number of items in the selected prompt column
                            // This represents the maximum number of complete generations possible
                            const availableCategories = Object.keys(categories[actualPromptType] || {});
                            let totalItems = 0;
                            let usedItems = 0;
                            
                            for (const category of availableCategories) {
                                const promptOptions = categories[actualPromptType][category];
                                if (promptOptions && Array.isArray(promptOptions)) {
                                    totalItems += promptOptions.length;
                                }
                            }
                            
                            // Count the minimum number of items used across all prompt types
                            // This represents the number of complete generations finished
                            let minUsedItems = Infinity;
                            for (const promptType of categoryNames) {
                                if (usedPrompts[promptType]) {
                                    minUsedItems = Math.min(minUsedItems, usedPrompts[promptType].size);
                                }
                            }
                            
                            const completedGenerations = minUsedItems !== Infinity ? minUsedItems : 0;
                            
                            isExhausted = (completedGenerations >= totalItems);
                            
                            debugLog(`Exhaust check for column ${exhaustColumn} (mapped to ${actualPromptType}): ${completedGenerations}/${totalItems} generations completed`);
                        } else {
                            // Fallback: check first available column
                            const firstPromptType = categoryNames[0];
                            if (firstPromptType && categories[firstPromptType]) {
                                // Count the total number of items in the first available column
                                const availableCategories = Object.keys(categories[firstPromptType] || {});
                                let totalItems = 0;
                                let usedItems = 0;
                                
                                for (const category of availableCategories) {
                                    const promptOptions = categories[firstPromptType][category];
                                    if (promptOptions && Array.isArray(promptOptions)) {
                                        totalItems += promptOptions.length;
                                    }
                                }
                                
                                // Count the minimum number of items used across all prompt types
                                let minUsedItems = Infinity;
                                for (const promptType of categoryNames) {
                                    if (usedPrompts[promptType]) {
                                        minUsedItems = Math.min(minUsedItems, usedPrompts[promptType].size);
                                    }
                                }
                                
                                const completedGenerations = minUsedItems !== Infinity ? minUsedItems : 0;
                                
                                isExhausted = (completedGenerations >= totalItems);
                                
                                debugLog(`Exhaust check for fallback column ${firstPromptType}: ${completedGenerations}/${totalItems} generations completed`);
                            }
                        }
                        
                        if (isExhausted) {
                            debugLog('Exhaust mode: all options exhausted in selected column');
                            showExhaustedPopup();
                            isGenerating = false;
                        }
                    }
                    
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
    const savedData = localStorage.getItem('promptCategories');
    debugLog('Loading prompts from localStorage:', savedData);
    
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            debugLog('Parsed data:', parsedData);
            console.log('Full parsed data structure:', JSON.stringify(parsedData, null, 2));
            
            if (parsedData.categories) {
                categories = parsedData.categories;
                
                // Load constraint setting
                constraintEnabled = parsedData.constraintEnabled !== false; // Default to true if not specified
                debugLog('Loaded constraint setting:', constraintEnabled);
                
                // Load constraint settings
                constraintSettings = parsedData.constraintSettings || {};
                debugLog('Loaded constraint settings:', constraintSettings);
                
                // Load exhaust mode setting
                exhaustMode = parsedData.exhaustMode === true; // Default to false if not specified
                debugLog('Loaded exhaust mode setting:', exhaustMode, 'from data:', parsedData.exhaustMode);
                
                // Load exhaust settings
                exhaustSettings = parsedData.exhaustSettings || {};
                debugLog('Loaded exhaust settings:', exhaustSettings);
                
                // Load exhaust mode type
                exhaustModeType = parsedData.exhaustModeType || 'row';
                debugLog('Loaded exhaust mode type:', exhaustModeType);
                
                // Load theme setting
                if (parsedData.currentTheme && themes[parsedData.currentTheme]) {
                    currentTheme = parsedData.currentTheme;
                    debugLog('Loaded theme from data:', themes[currentTheme].name);
                }
                
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
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    
    const bottomMargin = BUTTON_SIZES.BOTTOM_MARGIN();
    const elementHeight = BUTTON_SIZES.HEIGHT();
    const elementSpacing = BUTTON_SIZES.ELEMENT_SPACING();
    
    // Position save button first
    saveButton.position(
        BUTTON_SIZES.MARGIN(), 
        height - bottomMargin - elementHeight
    );
    
    // Position input above save button with fixed spacing
    nameInput.position(
        BUTTON_SIZES.MARGIN(), 
        height - bottomMargin - (elementHeight * 2) - elementSpacing
    );
    
    // Calculate new font sizes
    const buttonFontSize = FONT_SIZES.BUTTON() + 'px';
    const inputFontSize = FONT_SIZES.INPUT() + 'px';
    
    // Update button position, size and font
    saveButton.position(
        BUTTON_SIZES.MARGIN(), 
        height - bottomMargin - elementHeight
    );
    saveButton.style('width', BUTTON_SIZES.WIDTH() + 'px');
    saveButton.style('height', BUTTON_SIZES.HEIGHT() + 'px');
    saveButton.style('font-size', buttonFontSize);
    
    // Update input position, size and font
    nameInput.position(
        BUTTON_SIZES.MARGIN(), 
        height - bottomMargin - (elementHeight * 2) - elementSpacing
    );
    nameInput.size(BUTTON_SIZES.WIDTH());
    nameInput.style('height', BUTTON_SIZES.HEIGHT() + 'px');
    nameInput.style('font-size', inputFontSize);
    
    // Re-apply all styles to ensure consistency
    saveButton.style('background-color', '#001100');
    saveButton.style('color', '#00FF00');
    saveButton.style('font-family', 'VT323');
    saveButton.style('border', '2px solid #00FF00');
    saveButton.style('border-radius', '5px');
    saveButton.style('display', 'flex');
    saveButton.style('align-items', 'center');
    saveButton.style('justify-content', 'center');
    saveButton.style('white-space', 'nowrap');
    saveButton.style('min-width', 'fit-content');
    
    nameInput.style('font-family', 'VT323');
    nameInput.style('color', '#00FF00');
    nameInput.style('background-color', '#001100');
    nameInput.style('border', '1px solid #33FF33');
    nameInput.style('padding', '5px 10px');
    nameInput.style('box-sizing', 'border-box');
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
        shuffle(unusedPrompts.AGE);
        debugLog('Initialized unused prompts:', unusedPrompts.AGE);
    }
}

function initializeSubcategoryPrompts(category) {
    debugLog(`Initializing ${category} prompts for subcategory:`, selectedSubcategory);
    if (selectedSubcategory && categories[category] && categories[category][selectedSubcategory]) {
        unusedPrompts[category] = [...categories[category][selectedSubcategory]];
        shuffle(unusedPrompts[category]);
        debugLog(`Initialized ${category} prompts:`, unusedPrompts[category]);
    } else {
        debugLog(`Failed to initialize ${category} prompts. Category data:`, categories[category]);
    }
}

// Add this helper function to shuffle arrays
function shuffle(array) {
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

// Theme management functions
function switchTheme(themeKey) {
    if (themes[themeKey]) {
        currentTheme = themeKey;
        saveThemeToLocalStorage();
        updateUITheme();
        debugLog('Switched to theme:', themes[themeKey].name);
    }
}

function updateUITheme() {
    const colors = getThemeColors();
    
    // Update save button styling
    if (saveButton) {
        saveButton.style('background-color', colors.BACKGROUND);
        saveButton.style('color', colors.TEXT);
        saveButton.style('font-family', themes[currentTheme].font);
        saveButton.style('border', '2px solid ' + colors.HIGHLIGHT);
    }
    
    // Update name input styling
    if (nameInput) {
        nameInput.style('color', colors.TEXT);
        nameInput.style('background-color', colors.BACKGROUND);
        nameInput.style('border', '1px solid ' + colors.HIGHLIGHT);
        nameInput.style('font-family', themes[currentTheme].font);
    }
}

function loadThemeFromLocalStorage() {
    const savedTheme = localStorage.getItem('currentTheme');
    if (savedTheme && themes[savedTheme]) {
        currentTheme = savedTheme;
        updateUITheme();
        debugLog('Loaded theme from localStorage:', themes[currentTheme].name);
    }
}

function saveThemeToLocalStorage() {
    localStorage.setItem('currentTheme', currentTheme);
}

// Debug function to test constraint behavior
function testConstraints() {
    console.log('=== CONSTRAINT TEST ===');
    console.log('constraintEnabled: true (always enabled)');
    console.log('exhaustMode:', exhaustMode);
    console.log('exhaustSettings:', exhaustSettings);
    console.log('usedPrompts:', usedPrompts);
    console.log('globalUsedPrompts:', globalUsedPrompts);
    console.log('categories:', categories);
    console.log('shuffledPromptTypes:', shuffledPromptTypes);
    console.log('======================');
}

// Make test function available globally
window.testConstraints = testConstraints;

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

// Save current state to localStorage (including student name)
function saveCurrentStateToLocalStorage() {
    const currentData = localStorage.getItem('promptCategories');
    if (currentData) {
        try {
            const data = JSON.parse(currentData);
            // Update student name
            data.studentName = studentName;
            // Save back to localStorage
            localStorage.setItem('promptCategories', JSON.stringify(data));
            console.log('Saved current state to localStorage');
        } catch (error) {
            console.error('Error saving current state:', error);
        }
    }
}

function showExhaustedPopup() {
    // Create popup overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        font-family: 'VT323', monospace;
    `;
    
    // Create popup content
    const popup = document.createElement('div');
    popup.style.cssText = `
        background-color: #2C2C2C;
        border: 3px solid #66CDAA;
        border-radius: 10px;
        padding: 30px;
        text-align: center;
        color: white;
        max-width: 400px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    `;
    
    // Add title
    const title = document.createElement('h2');
    title.textContent = '🎉 All Options Exhausted!';
    title.style.cssText = `
        margin: 0 0 20px 0;
        color: #66CDAA;
        font-size: 24px;
    `;
    
    // Add message
    const message = document.createElement('p');
    message.textContent = 'You\'ve used all available combinations. Would you like to start a new round?';
    message.style.cssText = `
        margin: 0 0 25px 0;
        font-size: 16px;
        line-height: 1.4;
    `;
    
    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        gap: 15px;
        justify-content: center;
    `;
    
    // Create "New Round" button
    const newRoundBtn = document.createElement('button');
    newRoundBtn.textContent = '🔄 New Round';
    newRoundBtn.style.cssText = `
        background-color: #66CDAA;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        font-family: 'VT323', monospace;
        font-size: 16px;
        cursor: pointer;
        transition: background-color 0.3s ease;
    `;
    newRoundBtn.onmouseover = () => newRoundBtn.style.backgroundColor = '#5BB89A';
    newRoundBtn.onmouseout = () => newRoundBtn.style.backgroundColor = '#66CDAA';
    newRoundBtn.onclick = () => {
        startNewRound();
        document.body.removeChild(overlay);
    };
    
    // Create "Close" button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✖️ Close';
    closeBtn.style.cssText = `
        background-color: #FF7F7F;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        font-family: 'VT323', monospace;
        font-size: 16px;
        cursor: pointer;
        transition: background-color 0.3s ease;
    `;
    closeBtn.onmouseover = () => closeBtn.style.backgroundColor = '#FF6666';
    closeBtn.onmouseout = () => closeBtn.style.backgroundColor = '#FF7F7F';
    closeBtn.onclick = () => {
        document.body.removeChild(overlay);
    };
    
    // Assemble popup
    buttonContainer.appendChild(newRoundBtn);
    buttonContainer.appendChild(closeBtn);
    popup.appendChild(title);
    popup.appendChild(message);
    popup.appendChild(buttonContainer);
    overlay.appendChild(popup);
    
    // Add to page
    document.body.appendChild(overlay);
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