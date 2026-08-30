// Animation Manager - Handles all animation and sound effects
// Responsible for: Scrambling, revealing, sound effects, timing

let scrambleInterval = null;
let revealInterval = null;
let imageRevealTimeout = null;
let isAnimating = false;

// Animation timing (D-012 knobs — tune by feel)
const TIMING = {
    SCRAMBLE_SPEED: 50,
    REVEAL_SPEED: 50,
    SCRAMBLE_CYCLES: 15,
    PAUSE_BETWEEN: 200,
    // 4+ whitespace-separated tokens = a sentence; 1–3 stay "word" mode
    SENTENCE_WORD_MIN: 4,
    // One very long token (no spaces) still gets sentence timing
    SENTENCE_CHAR_MIN: 28,
    SENTENCE_REVEAL_TARGET_MS: 1000,
    SENTENCE_SCRAMBLE_CYCLES: 8,
    // D-014: one word per tick; spacing is independent of letter scramble (50ms)
    SENTENCE_WORD_REVEAL_MIN_MS: 90,
    SENTENCE_WORD_REVEAL_MAX_MS: 180,
    // D-017: pictures use the scramble clock (50ms + 440Hz); dots flicker per tick
    IMAGE_SCRAMBLE_CYCLES: 15,
    IMAGE_DOT_COUNT: 3,
    // D-013: scramble uses a decoy shape, not the chosen prompt's length
    SCRAMBLE_DECOY_MIN: 6,
    SCRAMBLE_DECOY_MAX: 18
}

// Sound settings
const SOUND = {
    SCRAMBLE: { FREQUENCY: 440, DURATION: 15 },
    REVEAL: { FREQUENCY: 600, DURATION: 25 },
    // D-014: word-land pitch — octave-plus above scramble (440) so sentences don't share the letter chatter
    WORD_REVEAL: { FREQUENCY: 880, DURATION: 40 },
    FINAL: { FREQUENCY: 1200, DURATION: 100 },
    RETURN_TO_FIELD: { FREQUENCY: 800, DURATION: 50 }, // New sound for returning to name field
    CLICK: { FREQUENCY: 550, DURATION: 12, TYPE: 'square', VOLUME: 0.30 }, // Mac SE-style click (significantly increased volume)
    TICK: { FREQUENCY: 800, DURATION: 30, TYPE: 'sine', VOLUME: 0.35 }, // Tick sound for checkboxes (significantly increased volume)
    VOLUME: 0.20 // Increased default volume
};

/** Split on whitespace; "a laser cutter" is 3 words, "make a gift for a friend" is 6. */
function countPromptWords(text) {
    const t = String(text == null ? '' : text).trim();
    if (!t) return 0;
    return t.split(/\s+/).filter(Boolean).length;
}

/** D-012: 1–3 words play as words; 4+ words (or one very long token) play as a sentence. */
function isSentencePrompt(text) {
    const t = String(text == null ? '' : text).trim();
    if (!t) return false;
    if (typeof isImagePromptToken === 'function' && isImagePromptToken(t)) return false;
    if (countPromptWords(t) >= TIMING.SENTENCE_WORD_MIN) return true;
    return t.length >= TIMING.SENTENCE_CHAR_MIN;
}

/** Per-prompt plan: word mode keeps 1 char / 50ms; sentences land one word at a time (D-014). */
function getRevealPlan(finalText) {
    const text = String(finalText == null ? '' : finalText);
    const sentence = isSentencePrompt(text);
    if (!sentence) {
        return {
            sentence: false,
            byWord: false,
            charsPerTick: 1,
            intervalMs: TIMING.REVEAL_SPEED,
            scrambleCycles: TIMING.SCRAMBLE_CYCLES
        };
    }
    const words = Math.max(1, countPromptWords(text));
    const intervalMs = Math.max(
        TIMING.SENTENCE_WORD_REVEAL_MIN_MS,
        Math.min(
            TIMING.SENTENCE_WORD_REVEAL_MAX_MS,
            Math.round(TIMING.SENTENCE_REVEAL_TARGET_MS / words)
        )
    );
    return {
        sentence: true,
        byWord: true,
        charsPerTick: 1,
        intervalMs: intervalMs,
        scrambleCycles: TIMING.SENTENCE_SCRAMBLE_CYCLES
    };
}

/** Next index after the following word (and its trailing space). */
function nextWordEndIndex(text, fromIndex) {
    if (fromIndex >= text.length) return text.length;
    let i = fromIndex;
    while (i < text.length && /\s/.test(text.charAt(i))) i++;
    if (i >= text.length) return text.length;
    while (i < text.length && !/\s/.test(text.charAt(i))) i++;
    if (i < text.length && /\s/.test(text.charAt(i))) i++;
    return i;
}

// Scramble glyphs — letter-sized (not block ▓/█ which are wider/taller and force wrap + bounce)
function getRotatingChars() {
    return 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789#*+'.split('');
}

/** Build scramble glyphs from a template. Spaces/punctuation stay so wrap stays stable;
 *  letters spin. D-013: scramble phase uses a decoy template, not the chosen prompt. */
function buildScrambleSegment(source, fromIndex, toIndex) {
    const rotatingChars = getRotatingChars();
    let out = '';
    const end = (typeof toIndex === 'number') ? toIndex : source.length;
    for (let i = fromIndex; i < end; i++) {
        const ch = source.charAt(i);
        if (/\s/.test(ch)) {
            out += ch;
        } else if (/[.,;:!?'"()\-]/.test(ch)) {
            out += ch;
        } else {
            out += rotatingChars[Math.floor(Math.random() * rotatingChars.length)];
        }
    }
    return out;
}

/** All option strings for one prompt column (every grouping). */
function getPromptPoolStrings(promptType) {
    let data = null;
    try {
        if (typeof categories !== 'undefined' && categories) data = categories[promptType];
    } catch (e) { /* ignore */ }
    if (!data && typeof window !== 'undefined' && window.categories) {
        data = window.categories[promptType];
    }
    if (!data) {
        try {
            const parsed = JSON.parse(localStorage.getItem('promptCategories') || '{}');
            data = parsed.categories && parsed.categories[promptType];
        } catch (e) { /* ignore */ }
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) return [];
    const out = [];
    Object.keys(data).forEach((row) => {
        if (row === 'objective' || row === 'prompt1InterestsMode') return;
        const arr = data[row];
        if (!Array.isArray(arr)) return;
        arr.forEach((s) => {
            const t = String(s == null ? '' : s).trim();
            if (t) out.push(t);
        });
    });
    return out;
}

/** Pick another option's shape so scramble length ≠ the chosen word when the list allows it. */
function pickScrambleDecoyTemplate(promptType, chosenText) {
    const chosen = String(chosenText == null ? '' : chosenText);
    const pool = getPromptPoolStrings(promptType);
    // D-015: never scramble an img: token — that's a picture, not a letter silhouette
    const others = pool.filter((s) => {
        if (s === chosen) return false;
        if (typeof isImagePromptToken === 'function' && isImagePromptToken(s)) return false;
        return true;
    });
    if (others.length) {
        return others[Math.floor(Math.random() * others.length)];
    }
    const minL = TIMING.SCRAMBLE_DECOY_MIN;
    const maxL = TIMING.SCRAMBLE_DECOY_MAX;
    let n = minL + Math.floor(Math.random() * (maxL - minL + 1));
    if (chosen.length && n === chosen.length) {
        n = n === maxL ? minL : n + 1;
    }
    return 'X'.repeat(Math.max(1, n));
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
    const plan = getRevealPlan(finalText);

    // D-015/D-017: pictures don't scramble letters — flicker dots on the scramble clock, then land
    if (typeof isImagePromptToken === 'function' && isImagePromptToken(finalText)) {
        if (scrambleInterval) clearInterval(scrambleInterval);
        if (revealInterval) clearInterval(revealInterval);
        if (imageRevealTimeout) {
            clearTimeout(imageRevealTimeout);
            imageRevealTimeout = null;
        }
        isAnimating = true;
        if (!window.currentPrompts) window.currentPrompts = {};
        if (typeof window.prefetchPromptImage === 'function') {
            window.prefetchPromptImage(finalText);
        }
        const dotCount = TIMING.IMAGE_DOT_COUNT;
        let imageCycles = 0;
        const tickImageScramble = function () {
            if (shouldStop) {
                if (scrambleInterval) clearInterval(scrambleInterval);
                scrambleInterval = null;
                return;
            }
            imageCycles++;
            if (imageCycles > TIMING.IMAGE_SCRAMBLE_CYCLES) {
                clearInterval(scrambleInterval);
                scrambleInterval = null;
                window.currentPrompts[category] = {
                    revealed: finalText,
                    rotating: '',
                    final: finalText
                };
                playSound(SOUND.FINAL);
                finishPromptReveal(finalText, category, promptType, selectedCategory);
                return;
            }
            const flicker = [];
            for (let i = 0; i < dotCount; i++) flicker.push(Math.random());
            window.currentPrompts[category] = {
                revealed: '',
                rotating: '',
                final: finalText,
                imageWait: true,
                dotFlicker: flicker
            };
            playSound(SOUND.SCRAMBLE);
        };
        tickImageScramble();
        scrambleInterval = setInterval(tickImageScramble, TIMING.SCRAMBLE_SPEED);
        return;
    }

    // D-013: decoy from the same column so spinning glyphs don't silhouette the answer
    const decoyTemplate = pickScrambleDecoyTemplate(promptType || category, finalText);
    
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
        
        let scrambledText = buildScrambleSegment(decoyTemplate, 0, decoyTemplate.length);
        
        // Access currentPrompts from window (defined in sketch-refactored.js)
        if (!window.currentPrompts) {
            window.currentPrompts = {};
        }
        window.currentPrompts[category] = {
            revealed: '',
            rotating: scrambledText,
            final: decoyTemplate // wrap to the decoy, not the chosen prompt (D-013)
        };
        
        playSound(SOUND.SCRAMBLE);
        scrambleCycles++;
        
        if (scrambleCycles >= plan.scrambleCycles) {
            clearInterval(scrambleInterval);
            
            // Start reveal after pause
            setTimeout(() => {
                startRevealAnimation(finalText, category, promptType, selectedCategory, plan);
            }, TIMING.PAUSE_BETWEEN);
        }
    }, TIMING.SCRAMBLE_SPEED);
}

// Start reveal animation
// promptType and selectedCategory are passed through so we can mark prompt as used when animation completes
function startRevealAnimation(finalText, category, promptType, selectedCategory, plan) {
    let charIndex = 0;
    plan = plan || getRevealPlan(finalText);
    
    revealInterval = setInterval(() => {
        if (shouldStop) {
            clearInterval(revealInterval);
            return;
        }
        
        if (charIndex < finalText.length) {
            const nextIndex = plan.byWord
                ? nextWordEndIndex(finalText, charIndex)
                : Math.min(finalText.length, charIndex + plan.charsPerTick);
            const revealed = finalText.substring(0, nextIndex);
            const rotating = buildScrambleSegment(finalText, nextIndex, finalText.length);
            
            // Access currentPrompts from window (defined in sketch-refactored.js)
            if (!window.currentPrompts) {
                window.currentPrompts = {};
            }
            window.currentPrompts[category] = {
                revealed: revealed,
                rotating: rotating,
                final: finalText
            };
            
            // D-014: sentences ping WORD_REVEAL (880Hz); letter mode keeps REVEAL (600Hz). Scramble stays 440Hz.
            if (plan.byWord) {
                playSound(SOUND.WORD_REVEAL);
            } else {
                playSound(SOUND.REVEAL);
            }
            charIndex = nextIndex;
        } else {
            clearInterval(revealInterval);
            playSound(SOUND.FINAL);
            finishPromptReveal(finalText, category, promptType, selectedCategory);
        }
    }, plan.intervalMs);
}

/** After a prompt (text or image) has landed — pending/in-play bookkeeping, then next column. */
function finishPromptReveal(finalText, category, promptType, selectedCategory) {
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
                    
                    // Track this student in the prompted order list (for left arrow navigation)
                    if (studentName && window.promptedStudentsOrder) {
                        // Remove if already in list (to avoid duplicates)
                        const index = window.promptedStudentsOrder.indexOf(studentName);
                        if (index > -1) {
                            window.promptedStudentsOrder.splice(index, 1);
                        }
                        // Add to end of list (most recent)
                        window.promptedStudentsOrder.push(studentName);
                        console.log('Added to prompted order:', studentName, 'Order:', window.promptedStudentsOrder);
                    }
                    
                    // No auto-advance - user must use navigation buttons
                    
                    // Check if we've processed all unique students
                    console.log('After prompt generation - Processed:', uniqueStudentsProcessed.size, 'Total:', totalUniqueStudents);
                    // No popup - just mark generation as complete
                    isGenerating = false;
                    
                    isGenerationComplete = true;
                    
                    // Take automatic screenshot if enabled
                    if (window.automaticScreenshotsEnabled && window.takeScreenshot) {
                        // Small delay to ensure all prompts are fully displayed
                        setTimeout(() => {
                            window.takeScreenshot();
                        }, 500);
                    }
                    
                    // Save current name as previous name, then clear input field
                    previousName = studentName;
                    
                    // Focus back on name field; start arrow flash with "start" or "next"
                    setTimeout(() => {
                        const nameEl = window.getResultNameFieldElement && window.getResultNameFieldElement();
                        if (nameEl) {
                            nameEl.focus();
                            // NEXT cue uses three-note chime in startResultNameArrowFlash (no separate field beep)
                        }
                        if (window.startResultNameArrowFlash) window.startResultNameArrowFlash();
                    }, 500); // Small delay to ensure generation is fully complete
                }
            }, TIMING.PAUSE_BETWEEN);
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
    if (imageRevealTimeout) {
        clearTimeout(imageRevealTimeout);
        imageRevealTimeout = null;
    }
    isAnimating = false;
}

/**
 * Three-note "up — da — da": first note up, second and third same pitch; onBeat(0..2) on each attack.
 */
function playNextHintCueSound(onBeat) {
    const notes = [
        { FREQUENCY: 523, DURATION: 58, TYPE: 'sine', VOLUME: 0.4 },
        { FREQUENCY: 698, DURATION: 58, TYPE: 'sine', VOLUME: 0.42 },
        { FREQUENCY: 698, DURATION: 58, TYPE: 'sine', VOLUME: 0.42 }
    ];
    const stepMs = 118;
    let t = 0;
    notes.forEach((cfg, i) => {
        setTimeout(() => {
            playSound(cfg);
            if (typeof onBeat === 'function') onBeat(i);
        }, t);
        t += stepMs;
    });
    return t + 70;
}

window.playNextHintCueSound = playNextHintCueSound;

// Export functions to window
window.startScrambleAnimation = startScrambleAnimation;
window.clearAnimations = clearAnimations; // Export clearAnimations (was incorrectly named stopAnimation)
window.playSound = playSound; // Export playSound for use in other files
window.SOUND = SOUND; // Export SOUND for use in other files
window.TIMING = TIMING;
window.countPromptWords = countPromptWords;
window.isSentencePrompt = isSentencePrompt;
