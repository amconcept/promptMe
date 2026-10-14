// Animation Manager - Handles all animation and sound effects
// Responsible for: Scrambling, revealing, sound effects, timing

let scrambleInterval = null;
let revealInterval = null;
let imageRevealTimeout = null;
let pixelHoldTimeout = null;
// Shared with sketch-refactored.js draw() — `let` hid this flag from the canvas loop.
window.isAnimating = false;

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
    // Letter-scramble / image-dot fallback. Pixel film uses playRevealFrameSound (D-040).
    SCRAMBLE: { FREQUENCY: 440, DURATION: 15 },
    REVEAL: { FREQUENCY: 600, DURATION: 25 },
    // D-014: word-land pitch — octave-plus above scramble (440) so sentences don't share the letter chatter
    WORD_REVEAL: { FREQUENCY: 880, DURATION: 40 },
    FINAL: { FREQUENCY: 1200, DURATION: 100 },
    // Desk arrows + first RUN (D-051). Same sine family: left 300, down 400, right 500, start 600.
    START: { FREQUENCY: 600, DURATION: 80 },
    NAV_LEFT: { FREQUENCY: 300, DURATION: 80 },
    NAV_RIGHT: { FREQUENCY: 500, DURATION: 80 },
    NAV_DOWN: { FREQUENCY: 400, DURATION: 100 },
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

/** How far into `finalText` is locked at this lift ratio (D-052). Sentences lock
 *  whole words (D-014); short lists lock letters. */
function glitchLockIndex(finalText, lockRatio) {
    const t = String(finalText == null ? '' : finalText);
    const ratio = Math.max(0, Math.min(1, Number(lockRatio) || 0));
    if (!t.length) return 0;
    const plan = getRevealPlan(t);
    if (plan.byWord) {
        const wordCount = t.trim() ? t.trim().split(/\s+/).length : 0;
        const lockWords = Math.floor(ratio * wordCount);
        let idx = 0;
        for (let w = 0; w < lockWords; w++) {
            idx = nextWordEndIndex(t, idx);
        }
        return idx;
    }
    return Math.floor(ratio * t.length);
}

/** D-052: spinning glyphs under the film; they lock as paper tiles lift. Pictures
 *  have no letters — they still punch through (D-036). */
function applyPixelLandGlitch(lockRatio) {
    if (!window.currentPrompts) return;
    Object.keys(window.currentPrompts).forEach(function (key) {
        const p = window.currentPrompts[key];
        if (!p || typeof p !== 'object' || !p.pixelMasked) return;
        const text = p.final || p.revealed || '';
        if (typeof isImagePromptToken === 'function' && isImagePromptToken(text)) return;
        const lockAt = glitchLockIndex(text, lockRatio);
        window.currentPrompts[key] = {
            revealed: text.substring(0, lockAt),
            rotating: buildScrambleSegment(text, lockAt, text.length),
            final: text,
            pixelMasked: true
        };
    });
}

function pixelMaskedPromptState(finalText) {
    const text = String(finalText == null ? '' : finalText);
    const image = typeof isImagePromptToken === 'function' && isImagePromptToken(text);
    return {
        revealed: '',
        rotating: image ? '' : buildScrambleSegment(text, 0, text.length),
        final: text,
        pixelMasked: true
    };
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
        } else if (typeof abortGeneration === 'function') {
            abortGeneration(typeof RUN_EMPTY_GROUPING_MSG === 'string'
                ? RUN_EMPTY_GROUPING_MSG
                : 'Every grouping needs at least one option in each prompt. Fill the empty list.');
        } else {
            debugLog('Generation complete after error');
            isGenerationComplete = true;
            isGenerating = false;
            window.isGenerating = false;
        }
        return;
    }

    // D-025: pixel fill-then-resolve is the student-facing scramble (masks word / phrase / image)
    // D-058: empty Custom does not borrow Default Pattern — drop through to letter scramble
    // D-028: one overlay per RUN — earlier columns stash silently; the last plays the card
    const revealCfg = (typeof loadRevealAnimation === 'function') ? loadRevealAnimation() : null;
    const usePixelFilm = (typeof revealUsesPixelFilm === 'function')
        ? revealUsesPixelFilm(revealCfg)
        : !(revealCfg && revealCfg.mode === 'custom');
    if (usePixelFilm && typeof startPixelRevealAnimation === 'function') {
        const maxPrompts = (typeof shuffledPromptTypes !== 'undefined' && shuffledPromptTypes)
            ? shuffledPromptTypes.length
            : 1;
        const moreComing = generationStep + 1 < maxPrompts;
        if (moreComing) {
            if (!window.currentPrompts) window.currentPrompts = {};
            window.currentPrompts[category] = pixelMaskedPromptState(finalText);
            if (typeof isImagePromptToken === 'function' && isImagePromptToken(finalText)
                && typeof window.prefetchPromptImage === 'function') {
                window.prefetchPromptImage(finalText);
            }
            commitPromptPending(finalText, category, promptType, selectedCategory);
            generationStep += 1;
            if (typeof generateNextAttribute === 'function') generateNextAttribute();
            return;
        }
        startPixelRevealAnimation(finalText, category, promptType, selectedCategory);
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
                playLandSound();
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
            playLandSound();
            finishPromptReveal(finalText, category, promptType, selectedCategory);
        }
    }, plan.intervalMs);
}

/** After a prompt (text or image) has landed — pending/in-play bookkeeping, then next column. */
function commitPromptPending(finalText, category, promptType, selectedCategory) {
    if (!promptType || !finalText) return;
    if (window.pendingPrompts === undefined) {
        window.pendingPrompts = [];
    }
    window.pendingPrompts.push({
        promptType: promptType,
        prompt: finalText,
        selectedCategory: selectedCategory
    });
    debugLog('Added to pending prompts:', finalText, 'for prompt type:', promptType);
    if (window.usedPrompts) {
        if (!window.usedPrompts[promptType]) {
            window.usedPrompts[promptType] = new Set();
        }
        window.usedPrompts[promptType].add(finalText);
        debugLog('Temporarily marked prompt as used (pending):', finalText, 'for prompt type:', promptType);
        if (selectedCategory && window.globalUsedPrompts) {
            const globalKey = `${promptType}_${selectedCategory}_${finalText}`;
            if (!window.globalUsedPrompts[globalKey]) {
                window.globalUsedPrompts[globalKey] = true;
                debugLog('Added to global tracking (pending):', globalKey);
            }
        }
    }
}

function unmaskPixelPrompts() {
    if (!window.currentPrompts) return;
    Object.keys(window.currentPrompts).forEach(function (key) {
        const p = window.currentPrompts[key];
        if (p && typeof p === 'object' && p.pixelMasked) {
            const text = p.final || p.revealed || '';
            window.currentPrompts[key] = {
                revealed: text,
                rotating: '',
                final: text
            };
        }
    });
}

function clearPixelMaskedPrompts() {
    if (!window.currentPrompts) return;
    Object.keys(window.currentPrompts).forEach(function (key) {
        if (window.currentPrompts[key] && window.currentPrompts[key].pixelMasked) {
            delete window.currentPrompts[key];
        }
    });
}

function finishPromptReveal(finalText, category, promptType, selectedCategory) {
            commitPromptPending(finalText, category, promptType, selectedCategory);
            
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
    if (pixelHoldTimeout) {
        clearTimeout(pixelHoldTimeout);
        pixelHoldTimeout = null;
    }
    isAnimating = false;
    if (window.pixelReveal) {
        clearPixelMaskedPrompts();
        window.pixelReveal.active = false;
    }
}

/**
 * D-025 / D-032 / D-035 / D-047 / D-048: play the saved film on FRAME_MS in a
 * loop until STOP. STOP starts the paper-tile land (not a timer). Letter
 * scramble / image-dot paths stay below as fallback.
 */
function startPixelRevealAnimation(finalText, category, promptType, selectedCategory) {
    if (scrambleInterval) clearInterval(scrambleInterval);
    if (revealInterval) clearInterval(revealInterval);
    if (imageRevealTimeout) {
        clearTimeout(imageRevealTimeout);
        imageRevealTimeout = null;
    }
    if (pixelHoldTimeout) {
        clearTimeout(pixelHoldTimeout);
        pixelHoldTimeout = null;
    }

    const cfg = (typeof loadRevealAnimation === 'function') ? loadRevealAnimation() : { mode: 'default', frames: [] };
    const size = (typeof revealGridSize === 'function')
        ? revealGridSize(cfg)
        : ((cfg && cfg.gridSize) || (window.REVEAL && window.REVEAL.GRID_SIZE) || 6);
    if (!window.currentPrompts) window.currentPrompts = {};
    window.currentPrompts[category] = pixelMaskedPromptState(finalText);
    const ranks = (typeof ranksPuzzleShuffle === 'function')
        ? ranksPuzzleShuffle(size)
        : [];
    const tickMs = (window.REVEAL && window.REVEAL.TICK_MS) || 50;
    const frameMs = (window.REVEAL && window.REVEAL.FRAME_MS) || 120;
    const frameCount = (typeof revealFrameCount === 'function')
        ? revealFrameCount(cfg)
        : ((cfg && cfg.frameCount) || (window.REVEAL && window.REVEAL.FRAME_COUNT) || 2);

    isAnimating = true;
    Object.keys(window.currentPrompts).forEach(function (key) {
        const p = window.currentPrompts[key];
        const val = (p && (p.final || p.revealed)) || '';
        if (val && typeof isImagePromptToken === 'function' && isImagePromptToken(val)
            && typeof window.prefetchPromptImage === 'function') {
            window.prefetchPromptImage(val);
        }
    });

    let cycle = 0;
    let lastSoundFrame = null;
    const decoyFor = function (frameTick, flickerSalt) {
        if (typeof getRevealDecoyFrame !== 'function') return [];
        return getRevealDecoyFrame(cfg, frameTick, flickerSalt);
    };
    const totalCells = size * size;
    const convergeTicks = (typeof convergeTicksForSize === 'function')
        ? convergeTicksForSize(size)
        : ((window.REVEAL && window.REVEAL.CONVERGE_TICKS) || 8);
    const cellsPerTick = Math.max(1, Math.ceil(totalCells / Math.max(1, convergeTicks)));

    window.pixelReveal = {
        active: true,
        landing: false,
        category: category,
        size: size,
        decoy: decoyFor(0, 0),
        ranks: ranks,
        resolveCount: 0,
        frameTick: 0,
        finishArgs: {
            finalText: finalText,
            category: category,
            promptType: promptType,
            selectedCategory: selectedCategory
        }
    };

    const tick = function () {
        if (shouldStop) {
            if (scrambleInterval) clearInterval(scrambleInterval);
            scrambleInterval = null;
            if (window.pixelReveal) window.pixelReveal.active = false;
            clearPixelMaskedPrompts();
            return;
        }
        const pr = window.pixelReveal;
        if (!pr || !pr.active) return;
        cycle += 1;
        const frameTick = Math.floor(((cycle - 1) * tickMs) / frameMs);
        pr.frameTick = frameTick;
        if (pr.landing) {
            // D-048 / D-044: lift paper tiles; leftover film stays intact (no flicker).
            // One gated low tone per tick so the sound stutters with the holes.
            pr.decoy = decoyFor(frameTick, false);
            pr.resolveCount = Math.min(totalCells, (pr.resolveCount || 0) + cellsPerTick);
            // D-052: letters lock with the holes — not finished text sitting under the film
            applyPixelLandGlitch(pr.resolveCount / totalCells);
            if (pr.resolveCount >= totalCells) {
                completePixelLand();
                return;
            }
            if (typeof playRevealTransitionSound === 'function') {
                playRevealTransitionSound();
            } else {
                playSound(SOUND.REVEAL);
            }
            return;
        }
        // D-047: loop the film until STOP. Do not lift or unmask on a timer.
        pr.decoy = decoyFor(frameTick, cycle);
        pr.resolveCount = 0;
        applyPixelLandGlitch(0);
        const frameIdx = ((frameTick % Math.max(1, frameCount)) + Math.max(1, frameCount)) % Math.max(1, frameCount);
        // D-040: one note when the picture changes, not a beep every 50ms
        if (typeof playRevealFrameSound === 'function') {
            // D-051: start chime already spoke on RUN; don't stack the first film note on it
            if (lastSoundFrame === null) {
                lastSoundFrame = frameIdx;
            } else if (lastSoundFrame !== frameIdx) {
                lastSoundFrame = frameIdx;
                playRevealFrameSound(frameIdx, frameCount, cfg);
            }
        } else {
            playSound(SOUND.SCRAMBLE);
        }
    };
    tick();
    scrambleInterval = setInterval(tick, tickMs);
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

function playLandSound(state) {
    const cfg = state || ((typeof loadRevealAnimation === 'function') ? loadRevealAnimation() : null);
    if (typeof playRevealFinalSound === 'function') {
        playRevealFinalSound(cfg);
        return;
    }
    playSound(SOUND.FINAL);
}

/**
 * D-048: overlay drops, land note, prompts unmask. Shared by the lift finishing
 * and by a second STOP that skips the rest of the tiles.
 */
function completePixelLand() {
    const pr = window.pixelReveal;
    if (!pr || !pr.active) return;
    const args = pr.finishArgs || {};
    if (scrambleInterval) {
        clearInterval(scrambleInterval);
        scrambleInterval = null;
    }
    pr.active = false;
    pr.landing = false;
    unmaskPixelPrompts();
    playLandSound();
    isAnimating = false;
    finishPromptReveal(args.finalText, args.category, args.promptType, args.selectedCategory);
}

/**
 * D-045 / D-048: first STOP starts the paper-tile land + transition sound.
 * A second STOP while tiles are still lifting jumps to the result.
 * Space still aborts and clears (does not generate).
 */
function skipRevealToResult() {
    const pr = window.pixelReveal;
    if (!pr || !pr.active) return false;
    if (pr.landing) {
        completePixelLand();
        return true;
    }
    pr.landing = true;
    pr.resolveCount = 0;
    // D-052: scramble before the first hole opens so a missed overlay frame
    // cannot flash the finished word.
    applyPixelLandGlitch(0);
    return true;
}

window.skipRevealToResult = skipRevealToResult;

// Export functions to window
window.startScrambleAnimation = startScrambleAnimation;
window.startPixelRevealAnimation = startPixelRevealAnimation;
window.clearAnimations = clearAnimations; // Export clearAnimations (was incorrectly named stopAnimation)
window.playSound = playSound; // Export playSound for use in other files
window.SOUND = SOUND; // Export SOUND for use in other files
window.TIMING = TIMING;
window.countPromptWords = countPromptWords;
window.isSentencePrompt = isSentencePrompt;
