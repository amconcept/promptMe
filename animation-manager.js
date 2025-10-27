// Animation Manager - Handles all animation and sound effects
// Responsible for: Scrambling, revealing, sound effects, timing

let scrambleInterval = null;
let revealInterval = null;
let isAnimating = false;

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
    RETURN_TO_FIELD: { FREQUENCY: 800, DURATION: 50 }, // New sound for returning to name field
    VOLUME: 0.03
};

// Default rotating characters
function getRotatingChars() {
    return ['█', '▀', '▄', '▌', '▐', '░', '▒', '▓'];
}

// Play sound effect
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

// Start scramble animation
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

// Start reveal animation
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
                    
                    // Save current name as previous name, then clear input field
                    previousName = studentName;
                    
                    // Focus back on name input field for next student entry
                    setTimeout(() => {
                        if (nameInput && nameInput.elt) {
                            // Clear the input field but keep the name visible on screen
                            nameInput.elt.value = '';
                            studentName = '';
                            nameInput.elt.focus();
                            // Play a different beep sound when returning to text field
                            playSound(SOUND.RETURN_TO_FIELD);
                            console.log('Focused name input field for next student entry, previous name:', previousName);
                        }
                    }, 500); // Small delay to ensure generation is fully complete
                }
            }, TIMING.PAUSE_BETWEEN);
        }
    }, TIMING.REVEAL_SPEED);
}

// Clear all animations
function clearAnimations() {
    if (scrambleInterval) {
        clearInterval(scrambleInterval);
        scrambleInterval = null;
    }
    if (revealInterval) {
        clearInterval(revealInterval);
        revealInterval = null;
    }
    isAnimating = false;
}

// Export functions to window
window.startScrambleAnimation = startScrambleAnimation;
window.stopAnimation = stopAnimation;
