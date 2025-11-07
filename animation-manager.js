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
    CLICK: { FREQUENCY: 550, DURATION: 12, TYPE: 'square', VOLUME: 0.30 }, // Mac SE-style click (significantly increased volume)
    TICK: { FREQUENCY: 800, DURATION: 30, TYPE: 'sine', VOLUME: 0.35 }, // Tick sound for checkboxes (significantly increased volume)
    VOLUME: 0.20 // Increased default volume
};

// Default rotating characters
function getRotatingChars() {
    return ['█', '▀', '▄', '▌', '▐', '░', '▒', '▓'];
}

// Play sound effect
function playSound(soundConfig) {
    // Use window.audioCtx if available, otherwise fall back to local audioCtx
    let ctx = window.audioCtx || audioCtx;
    
    // If no audio context available, try to create one
    if (!ctx) {
        try {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
            window.audioCtx = ctx;
        } catch (e) {
            console.log('Could not create audio context:', e);
            return; // Can't play sound without audio context
        }
    }
    
    // If audio context is suspended, resume it and wait before playing
    if (ctx.state === 'suspended') {
        ctx.resume().then(() => {
            // Context is now running, play the sound
            playSoundInternal(ctx, soundConfig);
        }).catch(e => {
            console.log('Could not resume audio context in playSound:', e);
            // Try to play anyway - might work
            playSoundInternal(ctx, soundConfig);
        });
        return; // Exit early, sound will play after resume
    }
    
    // Context is already running, play immediately
    playSoundInternal(ctx, soundConfig);
}

// Internal function to actually play the sound (assumes context is ready)
function playSoundInternal(ctx, soundConfig) {
    if (!ctx) {
        console.log('Audio context not available for sound playback');
        return;
    }
    
    try {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        // Set oscillator type if specified (for Mac SE-style clicks)
        if (soundConfig.TYPE) {
            oscillator.type = soundConfig.TYPE;
        }
        
        oscillator.frequency.value = soundConfig.FREQUENCY;
        
        // For click sounds, use envelope for Mac SE-style sharp attack/decay
        if (soundConfig.TYPE === 'square' && soundConfig.DURATION <= 15) {
            const now = ctx.currentTime;
            const attackTime = 0.001; // 1ms attack
            const decayTime = soundConfig.DURATION / 1000;
            const maxVolume = soundConfig.VOLUME || SOUND.VOLUME;
            
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(maxVolume, now + attackTime);
            gainNode.gain.linearRampToValueAtTime(0, now + decayTime);
            
            oscillator.start(now);
            oscillator.stop(now + decayTime);
        } else if (soundConfig.TYPE === 'sine' && soundConfig.VOLUME) {
            // For tick sounds (sine wave), use envelope for better audibility
            const now = ctx.currentTime;
            const attackTime = 0.002; // 2ms attack
            const sustainTime = (soundConfig.DURATION / 1000) * 0.7; // 70% of duration
            const decayTime = soundConfig.DURATION / 1000;
            const maxVolume = soundConfig.VOLUME;
            
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(maxVolume, now + attackTime);
            gainNode.gain.setValueAtTime(maxVolume, now + sustainTime);
            gainNode.gain.linearRampToValueAtTime(0, now + decayTime);
            
            oscillator.start(now);
            oscillator.stop(now + decayTime);
        } else if (soundConfig.VOLUME && soundConfig.VOLUME > 0.1) {
            // For sounds with explicit high volume (like tick), use envelope even if not sine
            const now = ctx.currentTime;
            const attackTime = 0.002;
            const decayTime = (soundConfig.DURATION / 1000);
            const maxVolume = soundConfig.VOLUME;
            
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(maxVolume, now + attackTime);
            gainNode.gain.linearRampToValueAtTime(0, now + decayTime);
            
            oscillator.start(now);
            oscillator.stop(now + decayTime);
        } else {
            // For other sounds, use simple constant volume (increased)
            gainNode.gain.value = soundConfig.VOLUME || SOUND.VOLUME;
            oscillator.start();
            setTimeout(() => oscillator.stop(), soundConfig.DURATION);
        }
    } catch (e) {
        console.log('Error playing sound:', e);
        // If audio context wasn't ready, try again after a short delay
        if (ctx && ctx.state === 'suspended') {
            ctx.resume().then(() => {
                // Retry playing the sound once context is resumed
                playSoundInternal(ctx, soundConfig);
            }).catch(err => {
                console.log('Could not resume and retry sound:', err);
            });
        }
    }
}

// Start scramble animation
// promptType and selectedCategory are passed through so we can mark prompt as used after animation
function startScrambleAnimation(finalText, category, promptType, selectedCategory) {
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
                startRevealAnimation(finalText, category, promptType, selectedCategory);
            }, TIMING.PAUSE_BETWEEN);
        }
    }, TIMING.SCRAMBLE_SPEED);
}

// Start reveal animation
// promptType and selectedCategory are passed through so we can mark prompt as used when animation completes
function startRevealAnimation(finalText, category, promptType, selectedCategory) {
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
            
            // Add to pending prompts (not committed until student changes)
            // This allows regeneration for the same student without depleting options
            if (promptType && finalText) {
                // Track as pending - will be committed when student changes
                if (window.pendingPrompts === undefined) {
                    window.pendingPrompts = [];
                }
                window.pendingPrompts.push({
                    promptType: promptType,
                    prompt: finalText,
                    selectedCategory: selectedCategory
                });
                debugLog('Added to pending prompts:', finalText, 'for prompt type:', promptType);
                
                // Temporarily mark as used to prevent duplicates during current generation
                // But these will be uncommitted if student regenerates
                if (window.usedPrompts) {
                    // Initialize tracking for this prompt type if needed
                    if (!window.usedPrompts[promptType]) {
                        window.usedPrompts[promptType] = new Set();
                    }
                    window.usedPrompts[promptType].add(finalText);
                    debugLog('Temporarily marked prompt as used (pending):', finalText, 'for prompt type:', promptType);
                    
                    // Also track globally (temporarily)
                    if (selectedCategory && window.globalUsedPrompts) {
                        const globalKey = `${promptType}_${selectedCategory}_${finalText}`;
                        if (!window.globalUsedPrompts[globalKey]) {
                            window.globalUsedPrompts[globalKey] = true;
                            debugLog('Added to global tracking (pending):', globalKey);
                        }
                    }
                }
            }
            
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
window.clearAnimations = clearAnimations; // Export clearAnimations (was incorrectly named stopAnimation)
window.playSound = playSound; // Export playSound for use in other files
window.SOUND = SOUND; // Export SOUND for use in other files
