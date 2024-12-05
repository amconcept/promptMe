let studentName = '';
let isGenerating = false;
let generationStep = 0;
let audioCtx;
let scrambleInterval = null;
let revealInterval = null;
let shouldStop = false;
let isGenerationComplete = false;
let selectedCategory = null;
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

// You can also modify the scramble characters themselves
// const ROTATING_CHARS = ['║', '╔', '', '╗', '║', '╚', '═', '╝'];  // Current set
// or try alternatives like:
const ROTATING_CHARS = ['█', '▀', '▄', '▌', '▐', '░', '▒', '▓'];  // More solid blocks
// const ROTATING_CHARS = ['┃', '┏', '━', '┓', '┃', '┗', '━', '┛'];  // Thinner lines

// Add color constants for old computer theme
const COLORS = {
    BACKGROUND: '#001100',  // Dark green-black background
    TEXT: '#00FF00',       // Bright phosphor green
    HIGHLIGHT: '#33FF33',  // Brighter green for highlights
    DIM: '#006600'         // Dimmer green for less important text
};

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
    
    // Load and check data
    loadPromptsFromLocalStorage();
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
    
    // Style save button responsively
    saveButton.style('background-color', '#001100');
    saveButton.style('color', '#00FF00');
    saveButton.style('font-family', 'VT323');
    saveButton.style('font-size', FONT_SIZES.BUTTON() + 'px');
    saveButton.style('width', BUTTON_SIZES.WIDTH() + 'px');
    saveButton.style('height', BUTTON_SIZES.HEIGHT() + 'px');
    saveButton.style('border', '2px solid #00FF00');
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
    
    // Style name input responsively
    nameInput.size(BUTTON_SIZES.WIDTH());
    nameInput.style('height', BUTTON_SIZES.HEIGHT() + 'px');
    nameInput.style('font-family', 'VT323');
    nameInput.style('font-size', FONT_SIZES.INPUT() + 'px');
    nameInput.style('color', '#00FF00');
    nameInput.style('background-color', '#001100');
    nameInput.style('border', '1px solid #33FF33');
    nameInput.style('padding', '5px 10px');
    nameInput.style('box-sizing', 'border-box');
    nameInput.attribute('placeholder', 'Enter student name here');
    
    checkAndClearCache();
    loadPromptsFromLocalStorage();
    checkCategoryStructure();
    initializeUnusedPrompts();
    resetPrompts();
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
    background(COLORS.BACKGROUND);
    
    // Draw student name
    fill(COLORS.DIM);
    textSize(FONT_SIZES.NAME());
    textAlign(LEFT, TOP);
    text(studentName, width * SPACING.TOP_MARGIN, height * SPACING.TOP_MARGIN);
    
    // Draw objective - make it dynamic
    fill(COLORS.HIGHLIGHT);
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
            fill(COLORS.DIM);
            textSize(FONT_SIZES.CATEGORY());
            textAlign(RIGHT, CENTER);
            text(header, width * SPACING.CATEGORY_OFFSET, yPosition);
            
            // Draw prompt
            fill(COLORS.TEXT);
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
    
    // Draw instructions only if showInstructions is true
    if (showInstructions) {
        fill(COLORS.DIM);
        textSize(FONT_SIZES.INSTRUCTIONS());
        textAlign(CENTER, BOTTOM);
        text('Press ESC to return to main menu', 
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
        window.location.href = 'index.html';
        return;
    }
    
    if (key === 'A' || key === 'a') {
        debugLog('2. A key pressed:', {
            isGenerating,
            generationStep,
            categories: categories
        });
        
        // Check if categories exists and has content
        if (!categories || Object.keys(categories).filter(cat => cat !== 'objective').length === 0) {
            console.error('No categories loaded or categories empty');
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
}

function startGeneration() {
    debugLog('4. startGeneration called');
    isGenerating = true;
    shouldStop = false;
    generationStep = 0;  // Double-check generation step is 0
    currentPrompts = {};
    generateNextAttribute();
}

function generateNextAttribute() {
    debugLog('5. generateNextAttribute called');
    
    const categoryNames = Object.keys(categories).filter(cat => cat !== 'objective');
    
    if (!categoryNames.length) {
        console.error('No valid categories found');
        return;
    }
    
    if (generationStep < categoryNames.length && !shouldStop) {
        const currentCategory = categoryNames[generationStep];
        debugLog('6. Current category:', currentCategory);
        
        // Get prompts directly from the category
        const allPrompts = categories[currentCategory]['0'];
        
        if (!allPrompts || !Array.isArray(allPrompts) || allPrompts.length === 0) {
            console.error(`No valid prompts for category ${currentCategory}`);
            generationStep++;
            generateNextAttribute();
            return;
        }
        
        // Initialize usedPrompts for this category if needed
        if (!usedPrompts[currentCategory]) {
            usedPrompts[currentCategory] = new Set();
        }
        
        // Reset if all prompts have been used
        if (usedPrompts[currentCategory].size >= allPrompts.length) {
            usedPrompts[currentCategory].clear();
        }
        
        // Get available prompts
        const availablePrompts = allPrompts.filter(
            prompt => !usedPrompts[currentCategory].has(prompt)
        );
        
        if (availablePrompts.length === 0) {
            usedPrompts[currentCategory].clear();  // Reset if no prompts available
            generateNextAttribute();  // Try again
            return;
        }
        
        // Select random prompt
        const randomIndex = Math.floor(Math.random() * availablePrompts.length);
        const selectedPrompt = availablePrompts[randomIndex];
        usedPrompts[currentCategory].add(selectedPrompt);
        
        // Animation part
        let scrambleCycles = 0;
        let charIndex = 0;
        const finalText = selectedPrompt;
        
        // Clear any existing intervals
        if (scrambleInterval) clearInterval(scrambleInterval);
        if (revealInterval) clearInterval(revealInterval);
        
        // Start scramble animation
        scrambleInterval = setInterval(() => {
            if (shouldStop) {
                clearInterval(scrambleInterval);
                return;
            }
            
            let scrambledText = '';
            for (let i = 0; i < finalText.length; i++) {
                scrambledText += ROTATING_CHARS[Math.floor(Math.random() * ROTATING_CHARS.length)];
            }
            
            currentPrompts[currentCategory] = {
                revealed: '',
                rotating: scrambledText
            };
            
            playSound(SOUND.SCRAMBLE);
            scrambleCycles++;
            
            if (scrambleCycles >= TIMING.SCRAMBLE_CYCLES) {
                clearInterval(scrambleInterval);
                
                // Start reveal after pause
                setTimeout(() => {
                    revealInterval = setInterval(() => {
                        if (shouldStop) {
                            clearInterval(revealInterval);
                            return;
                        }
                        
                        if (charIndex < finalText.length) {
                            const revealed = finalText.substring(0, charIndex + 1);
                            let rotating = '';
                            
                            for (let i = charIndex + 1; i < finalText.length; i++) {
                                rotating += ROTATING_CHARS[Math.floor(Math.random() * ROTATING_CHARS.length)];
                            }
                            
                            currentPrompts[currentCategory] = {
                                revealed: revealed,
                                rotating: rotating
                            };
                            
                            charIndex++;
                            playSound(SOUND.REVEAL);
                        } else {
                            clearInterval(revealInterval);
                            playSound(SOUND.FINAL);
                            
                            setTimeout(() => {
                                generationStep++;
                                generateNextAttribute();
                            }, TIMING.PAUSE_BETWEEN);
                        }
                    }, TIMING.REVEAL_SPEED);
                }, TIMING.PAUSE_BETWEEN);
            }
        }, TIMING.SCRAMBLE_SPEED);
    } else {
        isGenerationComplete = true;
    }
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
    
    // Reset usedPrompts for all categories
    usedPrompts = {};
    Object.keys(categories).forEach(category => {
        if (category !== 'objective') {
            usedPrompts[category] = new Set();
        }
    });
    
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
    
    debugLog('Reset state:', {
        categories: Object.keys(categories),
        usedPrompts,
        unusedPrompts
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
            
            if (parsedData.categories) {
                categories = parsedData.categories;
                
                // Debug objective
                debugLog('Loaded objective:', categories.objective);
                
                // If objective is not set, check if it's in a different structure
                if (!categories.objective && parsedData.objective) {
                    categories.objective = parsedData.objective;
                }
                
                // Ensure each category has a '0' subcategory with prompts
                Object.keys(categories).forEach(catName => {
                    if (catName !== 'objective') {
                        // If category has direct array of prompts, wrap it in '0' subcategory
                        if (Array.isArray(categories[catName])) {
                            categories[catName] = { '0': categories[catName] };
                        }
                        // If category has no '0' subcategory but has prompts in other subcategories
                        else if (typeof categories[catName] === 'object' && !categories[catName]['0']) {
                            // Collect all prompts from subcategories
                            const allPrompts = [];
                            Object.values(categories[catName]).forEach(subcatPrompts => {
                                if (Array.isArray(subcatPrompts)) {
                                    allPrompts.push(...subcatPrompts);
                                }
                            });
                            categories[catName] = { '0': allPrompts };
                        }
                        // Ensure '0' subcategory is an array
                        if (!Array.isArray(categories[catName]['0'])) {
                            categories[catName]['0'] = [];
                        }
                    }
                });
                
                debugLog('Final categories structure:', {
                    objective: categories.objective,
                    categories: Object.keys(categories)
                });
            } else {
                console.error('Invalid data structure:', parsedData);
                categories = {};
            }
        } catch (e) {
            console.error('Error parsing prompts:', e);
            categories = {};
        }
    }
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
