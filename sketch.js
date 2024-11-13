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



// Animation timing
const TIMING = {
    SCRAMBLE_SPEED: 15,
    REVEAL_SPEED: 20,
    SCRAMBLE_CYCLES: 30,
    PAUSE_BETWEEN: 500
};

// Sound settings
const SOUND = {
    SCRAMBLE: { FREQUENCY: 440, DURATION: 15 },
    REVEAL: { FREQUENCY: 880, DURATION: 25 },
    FINAL: { FREQUENCY: 1320, DURATION: 100 },
    VOLUME: 0.03
};

let categories = {};
let currentPrompts = {};

// Change to Alternative 2 - Digital feel
const ROTATING_CHARS = ['║', '╔', '═', '╗', '║', '╚', '═', '╝'];

// Add color constants for old computer theme
const COLORS = {
    BACKGROUND: '#001100',  // Dark green-black background
    TEXT: '#00FF00',       // Bright phosphor green
    HIGHLIGHT: '#33FF33',  // Brighter green for highlights
    DIM: '#006600'         // Dimmer green for less important text
};

function preload() {
    loadPromptsFromLocalStorage();
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    textAlign(CENTER, CENTER);
    textSize(24);
    textFont('VT323');
    
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    studentName = localStorage.getItem('studentName') || 'Unknown';
    
  // Create input field for the student's name
  nameInput = createInput(studentName);
  nameInput.position(50, 570); // Position it at the top left
  nameInput.size(200); // Set the size of the input field
  nameInput.style('font-size', '20px');
  nameInput.style('font-family', 'VT323');
  nameInput.style('color', '#00FF00');
  nameInput.style('background-color', '#001100');
  nameInput.style('border', '1px solid #33FF33');
  nameInput.input(updateStudentName); // Update name on input c

    resetPrompts();
 // Create save button

  saveButton = createButton('Save Image');
  saveButton.position(50, height - 70); // Adjust position as needed
  saveButton.mousePressed(saveImage); // Attach functionality
    
    // Customize the button's appearance
    saveButton.style('background-color', '#001100'); // Bright green
    saveButton.style('color', '#00FF00');           // Dark green text
    saveButton.style('font-size', '16px');          // Font size
    saveButton.style('padding', '10px 20px');       // Padding
    saveButton.style('border', '2px solid #00FF00');           // Remove border
    saveButton.style('border-radius', '5px');       // Rounded corners
    saveButton.style('cursor', 'pointer');          // Pointer cursor on hover 
    saveButton.style('font-family', 'VT323');       // Match the font
}

function saveImage() {
    if (studentName) {
        // Save the canvas using the student's name
        const sanitizedStudentName = studentName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_-]/g, '');
        const filename = `${sanitizedStudentName}_prompts`;
        saveCanvas(filename, 'png');
    } else {
        alert('Student name is not set. Unable to save the image.');
    }
}

function updateStudentName() {
    studentName = nameInput.value(); // Get the updated name
    localStorage.setItem('studentName', studentName); // Save to localStorage
}

function draw() {
    background(COLORS.BACKGROUND);
    
    // Display student name
    fill(COLORS.DIM);
    textSize(50);
    textAlign(LEFT, TOP);
    text(studentName, 20, 20);
    
    // Display objective text under name (without "OBJECTIVE" label)
    fill(COLORS.HIGHLIGHT);
    textSize(24);
    text(categories.objective || '', 20, 80);
    
    // Display prompts
    let yOffset = height * 0.4;  // Adjust this value (e.g., 0.4 for lower positioning)

    Object.keys(categories).forEach(header => {
        if (header !== 'objective') {  // Skip objective in the display
            // Display header
            fill(COLORS.DIM);
            textSize(60);
            textAlign(RIGHT, CENTER);
            text(header, width * 0.45, yOffset);
            
            // Display current prompt
            fill(COLORS.TEXT);
            textAlign(LEFT, CENTER);
            
            const prompt = currentPrompts[header];
            if (prompt && typeof prompt === 'object') {
                // Draw revealed part in large size
                textSize(60);
                text(prompt.revealed, width * 0.48, yOffset);
                
                // Draw rotating part in smaller size
                textSize(60);  // Smaller size for rotating characters
                text(prompt.rotating, width * 0.48 + textWidth(prompt.revealed), yOffset);
            } else {
                textSize(60);
                text(prompt || '', width * 0.48, yOffset);
            }
            
            yOffset += 70;
        }
    });
    
    // Display only ESC instruction
    fill(COLORS.DIM);
    textSize(16);
    textAlign(CENTER, BOTTOM);
    text('Press ESC to return to main menu', width/2, height - 20);
}

function keyPressed() {

 
    // Ignore keypresses if the name input is focused
     if (nameInput && nameInput.elt === document.activeElement) {
            return; // Do nothing if the input field is active
        }

    if (keyCode === ESCAPE) {
        window.location.href = 'index.html';
    }
    
    if ((key === 'A' || key === 'a')) {
        // Allow new generation if not currently generating
        if (!isGenerating) {
            resetGeneratorState();
            isGenerating = true;  // Set this here instead of in resetGeneratorState
            shouldStop = false;   // Set this here instead of in resetGeneratorState
            generationStep = 0;   // Reset step counter
            generateNextAttribute();
        }
    }
}

function startGeneration() {
    isGenerating = true;
    shouldStop = false;
    generationStep = 0;
    generateNextAttribute();
}

function generateNextAttribute() {
    if (generationStep < Object.keys(categories).length && !shouldStop) {
        const header = Object.keys(categories)[generationStep];
        if (header === 'objective') {
            generationStep++;
            generateNextAttribute();
            return;
        }
        
        let options;
        // For first prompt, select randomly from any category
        if (generationStep === 0) {
            options = [];
            // Get all options from all categories
            Object.entries(categories[header]).forEach(([category, prompts]) => {
                if (prompts && prompts.length > 0) {
                    // Store the category with the first option
                    options.push(...prompts.map(prompt => ({
                        text: prompt,
                        category: category
                    })));
                }
            });
        } else {
            // For subsequent prompts, only select from the same category
            options = categories[header][selectedCategory] || [];
            options = options.map(text => ({ text, category: selectedCategory }));
        }

        if (options.length === 0) {
            generationStep++;
            generateNextAttribute();
            return;
        }

        let scrambleCycles = 0;
        let charIndex = 0;
        let rotationIndex = 0;
        let finalSelection = random(options);
        // Store the selected category from the first prompt
        if (generationStep === 0) {
            selectedCategory = finalSelection.category;
        }
        let currentDisplay = '';
        
        if (scrambleInterval) clearInterval(scrambleInterval);
        if (revealInterval) clearInterval(revealInterval);
        
        scrambleInterval = setInterval(() => {
            if (shouldStop) {
                clearInterval(scrambleInterval);
                return;
            }
            
            currentDisplay = '';
            rotationIndex = (rotationIndex + 1) % ROTATING_CHARS.length;
            
            // Build display string with two parts
            let revealedPart = finalSelection.text.substring(0, charIndex);
            let rotatingPart = '';
            
            for (let i = charIndex; i < finalSelection.text.length; i++) {
                rotatingPart += ROTATING_CHARS[(rotationIndex + i) % ROTATING_CHARS.length];
            }
            
            // Store both parts separately
            currentPrompts[header] = {
                revealed: revealedPart,
                rotating: rotatingPart
            };
            
            scrambleCycles++;
            
            if (scrambleCycles % 8 === 0) {
                charIndex++;
                playBeep(SOUND.REVEAL.FREQUENCY, SOUND.REVEAL.DURATION);
            }
            
            if (charIndex > finalSelection.text.length) {
                clearInterval(scrambleInterval);
                currentPrompts[header] = finalSelection.text;
                playBeep(SOUND.FINAL.FREQUENCY, SOUND.FINAL.DURATION);
                
                setTimeout(() => {
                    if (!shouldStop) {
                        generationStep++;
                        if (generationStep < Object.keys(categories).length) {
                            generateNextAttribute();
                        } else {
                            isGenerating = false;
                            isGenerationComplete = true;
                            selectedCategory = null;  // Reset for next generation
                        }
                    }
                }, TIMING.PAUSE_BETWEEN);
            }
        }, TIMING.SCRAMBLE_SPEED);
    } else {
        // Reset state if we're done or stopped
        isGenerating = false;
        isGenerationComplete = false;
        shouldStop = false;
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
    // Clear any ongoing animations
    if (scrambleInterval) {
        clearInterval(scrambleInterval);
        scrambleInterval = null;
    }
    if (revealInterval) {
        clearInterval(revealInterval);
        revealInterval = null;
    }
    
    // Reset state variables
    isGenerating = false;
    isGenerationComplete = false;
    shouldStop = true;
    currentPrompts = {}; // Clear current prompts
    
    // Reset prompts
    Object.keys(categories).forEach(category => {
        if (category !== 'objective') {
            currentPrompts[category] = '';
        }
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
    if (savedData) {
        const parsedData = JSON.parse(savedData);
        
        // Validate and load categories
        categories = parsedData.categories || {};
        Object.keys(categories).forEach(header => {
            const headerPrompts = categories[header];
            if (typeof headerPrompts === 'object') {
                Object.keys(headerPrompts).forEach(category => {
                    if (!Array.isArray(headerPrompts[category])) {
                        categories[header][category] = []; // Ensure it's always an array
                    }
                });
            } else {
                categories[header] = {}; // Reset malformed headers
            }
        });
        categories.objective = parsedData.objective || '';
    } else {
        // Default state
        categories = {
            "COMPANY": {
                "A": ["NIKE", "GOOGLE", "FACEBOOK"]
            },
            objective: "Design a product for a character based on the following prompts."
        };
    }
}


function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}