// Prompt Generator - Handles prompt generation logic and constraints
// Responsible for: Prompt generation, category selection, constraint management

let usedPrompts = {};
let selectedCategory = null;
let usedCategories = new Set(); // Track which categories have been used in the current cycle
let shuffledPromptTypes = []; // Store the shuffled order of prompt types for the current generation
let globalUsedPrompts = {}; // Track used prompts across ALL categories
let generatedCount = 0; // Track how many prompts have been generated
let constraintEnabled = true;
let pendingPrompts = []; // Track prompts that are displayed but not yet committed (format: {promptType, prompt, selectedCategory})
let currentStudentForPrompts = null; // Track which student the pending prompts belong to

// Spec R2/R3: leader draw from combined pool, then lock category for the run (see RANDOMIZER_LOGIC_SPEC.md)
let leaderPreselectedValue = null;
let leaderPreselectedActive = false;
// Categories eligible for this run (union exhaustion R6 uses this list)
let generationCandidateCategoriesForRun = [];

/** Ensure window.usedPrompts[type] is a Set; keep local usedPrompts as same reference. */
function ensureUsedSetForType(promptType) {
    if (window.usedPrompts && typeof window.usedPrompts === 'object') {
        usedPrompts = window.usedPrompts;
    }
    if (!usedPrompts || typeof usedPrompts !== 'object') {
        usedPrompts = {};
    }
    if (!(usedPrompts[promptType] instanceof Set)) {
        const prev = usedPrompts[promptType];
        usedPrompts[promptType] = Array.isArray(prev) ? new Set(prev) : new Set();
    }
    window.usedPrompts = usedPrompts;
    return usedPrompts[promptType];
}

/** R4: mark option in play as soon as it is chosen (do not wait for animation end). */
function markPromptInPlay(promptType, value) {
    if (!promptType || value == null || value === '') return;
    ensureUsedSetForType(promptType).add(value);
    debugLog('Marked in play:', promptType, value, 'size', usedPrompts[promptType].size);
}

/** All unique option strings for one prompt type across the given category keys (union of pools). */
function getUnionUniqueOptionsForPromptType(promptType, categoryKeys) {
    const set = new Set();
    if (!categoryKeys || !Array.isArray(categoryKeys)) return set;
    for (let i = 0; i < categoryKeys.length; i++) {
        const cat = categoryKeys[i];
        const arr = categories[promptType] && categories[promptType][cat];
        if (Array.isArray(arr)) {
            for (let j = 0; j < arr.length; j++) set.add(arr[j]);
        }
    }
    return set;
}

/** R6 / I5: every option in the union has been drawn at least once for this type. */
function isUnionFullyUsedForType(promptType, categoryKeys) {
    const union = getUnionUniqueOptionsForPromptType(promptType, categoryKeys);
    const used = usedPrompts && usedPrompts[promptType];
    if (!union.size) return false;
    if (!used || !(used instanceof Set)) return false;
    for (const v of union) {
        if (!used.has(v)) return false;
    }
    return true;
}

/**
 * True if this category still has at least one not-in-play option for promptType
 * (ignores R5 previous only when allowPrevious is true).
 */
function categoryHasUnusedForType(category, promptType, allowPrevious) {
    const arr = categories[promptType] && categories[promptType][category];
    if (!Array.isArray(arr) || arr.length === 0) return false;
    if (!usedPrompts[promptType]) usedPrompts[promptType] = new Set();
    const prev = (window.currentStudentPreviousPrompts && window.currentStudentPreviousPrompts[promptType]) || null;
    for (let i = 0; i < arr.length; i++) {
        const v = arr[i];
        if (usedPrompts[promptType].has(v)) continue;
        if (!allowPrevious && prev != null && v === prev) continue;
        return true;
    }
    return false;
}

/**
 * R3 lock is viable if every non-leader prompt type either still has unused options
 * in this category, or that type's global union is exhausted (R6 will refresh on draw).
 */
function isViableLockCategory(category, leaderType, candidateCategories, runPromptTypes) {
    for (let i = 0; i < runPromptTypes.length; i++) {
        const pt = runPromptTypes[i];
        if (pt === leaderType) continue;
        if (categoryHasUnusedForType(category, pt, false)) continue;
        if (isUnionFullyUsedForType(pt, candidateCategories)) continue;
        return false;
    }
    return true;
}

/**
 * Build map: option value -> list of categories that contain that value (leader combined pool).
 */
function buildLeaderValueToCategoriesMap(leaderType, candidateCategories) {
    const valueToCategories = new Map();
    for (let c = 0; c < candidateCategories.length; c++) {
        const cat = candidateCategories[c];
        const arr = categories[leaderType] && categories[leaderType][cat];
        if (!Array.isArray(arr)) continue;
        for (let i = 0; i < arr.length; i++) {
            const item = arr[i];
            if (!valueToCategories.has(item)) valueToCategories.set(item, []);
            valueToCategories.get(item).push(cat);
        }
    }
    return valueToCategories;
}

/**
 * R2, R3: pick first prompt type option from combined pool (excluding in-play), then lock category.
 * I3: same string in multiple categories — one drawable value; lock category chosen at random among those rows.
 * R6: clear in-play only when the global union for this type is exhausted — never on category-local empty.
 */
function pickLeaderOptionAndCategory(leaderType, candidateCategories) {
    ensureUsedSetForType(leaderType);
    const valueToCategories = buildLeaderValueToCategoriesMap(leaderType, candidateCategories);
    const values = Array.from(valueToCategories.keys());
    if (values.length === 0) {
        console.error('pickLeaderOptionAndCategory: empty combined pool for leader type', leaderType);
        return { value: null, category: null };
    }
    const prev = (window.currentStudentPreviousPrompts && window.currentStudentPreviousPrompts[leaderType]) || null;
    const runPromptTypes = (shuffledPromptTypes && shuffledPromptTypes.length)
        ? shuffledPromptTypes
        : [leaderType];

    function filterUnused(arr, respectPrev) {
        let out = arr.filter(v => !usedPrompts[leaderType].has(v));
        if (respectPrev && prev != null) out = out.filter(v => v !== prev);
        return out;
    }

    /** Prefer values that can lock a category with unused options for the rest of the run. */
    function filterViable(arr) {
        return arr.filter(v => {
            const cats = valueToCategories.get(v) || [];
            return cats.some(cat => isViableLockCategory(cat, leaderType, candidateCategories, runPromptTypes));
        });
    }

    let candidates = filterViable(filterUnused(values, true));

    // R6 only: refresh when every option in the global union has been in play
    if (candidates.length === 0 && isUnionFullyUsedForType(leaderType, candidateCategories)) {
        debugLog('Leader: global union exhausted for', leaderType, '- refresh in-play (R6)');
        usedPrompts[leaderType].clear();
        window.usedPrompts = usedPrompts;
        candidates = filterViable(filterUnused(values, true));
    }

    // Prefer a viable lock even if it means reusing an in-play leader, rather than
    // locking a dead category and repeating a follower before global exhaustion (R4).
    if (candidates.length === 0) {
        candidates = values.filter(v => {
            const cats = valueToCategories.get(v) || [];
            return cats.some(cat => isViableLockCategory(cat, leaderType, candidateCategories, runPromptTypes));
        });
        if (prev != null) {
            const withoutPrev = candidates.filter(v => v !== prev);
            if (withoutPrev.length > 0) candidates = withoutPrev;
        }
        debugLog('Leader: viable lock with possible leader reuse (avoid follower early repeat)', candidates.length);
    }

    // Still empty: unused exist but none lock a viable category
    if (candidates.length === 0) {
        candidates = filterUnused(values, true);
        debugLog('Leader: falling back to unused (may lock sparse category)', candidates.length);
    }
    if (candidates.length === 0) {
        candidates = values.filter(v => v !== prev);
        if (candidates.length === 0) candidates = values.slice();
        debugLog('Leader: last-resort pool without clearing in-play', candidates.length);
    }

    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    const catList = valueToCategories.get(pick) || [];
    const viableCats = catList.filter(cat =>
        isViableLockCategory(cat, leaderType, candidateCategories, runPromptTypes)
    );
    const lockPool = viableCats.length > 0 ? viableCats : catList;
    const category = lockPool[Math.floor(Math.random() * lockPool.length)];
    // Mark leader in play immediately so later runs (and mid-run) honor R4
    markPromptInPlay(leaderType, pick);
    return { value: pick, category: category };
}

// Start prompt generation
function startGeneration() {
    debugLog('4. startGeneration called');

    // Hat-safe: ignore Up/Enter while a scramble is still running.
    // Re-roll is allowed only after the current result finishes (puts that slip back, draws from remaining).
    if (isGenerating || isAnimating) {
        debugLog('Ignoring generate — scramble still in progress (no mid-roll interrupt)');
        if (window.audioCtx && window.playSound) {
            window.playSound({ FREQUENCY: 220, DURATION: 40 });
        }
        return;
    }

    startGenerationInternal();
}

// Internal generation function
function startGenerationInternal() {
    debugLog('4. startGenerationInternal called');
    
    // Play initial beep to indicate generation has started
    // Use same pattern as error handlers - check for audioCtx and playSound
    if (window.audioCtx && window.playSound) {
        window.playSound({FREQUENCY: 600, DURATION: 50});
    } else if (window.playSound) {
        // Fallback - try to play even if audioCtx check fails
        window.playSound({FREQUENCY: 600, DURATION: 50});
    }
    
    // Get current student name
    const currentStudent = window.studentName || null;

    // R4: rebuild in-play from committed report (source of truth).
    // R5: when regenerating an existing slot, exclude that slot so its options return to the pool.
    const regeneratingExistingSlot = (typeof currentStudentIndex === 'number'
        && currentStudentIndex >= 0
        && typeof classReport !== 'undefined'
        && Array.isArray(classReport)
        && currentStudentIndex < classReport.length
        && classReport[currentStudentIndex]
        && Array.isArray(classReport[currentStudentIndex].prompts)
        && classReport[currentStudentIndex].prompts.length > 0);

    const excludeSlot = regeneratingExistingSlot ? currentStudentIndex : -1;
    if (typeof window.rebuildUsedPromptsFromClassReport === 'function') {
        window.rebuildUsedPromptsFromClassReport(excludeSlot);
        usedPrompts = window.usedPrompts;
    } else if (regeneratingExistingSlot && window.putBackStudentPromptsIntoPool) {
        // Fallback if rebuild unavailable
        window.putBackStudentPromptsIntoPool(currentStudent);
    }

    // R5: exclude previous combo when redrawing the same slot
    window.currentStudentPreviousPrompts = regeneratingExistingSlot && window.getStudentPreviousPrompts
        ? window.getStudentPreviousPrompts(currentStudent) : {};
    isGenerationComplete = false;

    // Clear pending from any interrupted animation; in-play already rebuilt from report
    pendingPrompts = [];
    window.pendingPrompts = [];
    
    // Update current student tracking
    currentStudentForPrompts = currentStudent;
    
    isGenerating = true;
    shouldStop = false;
    generationStep = 0;  // Double-check generation step is 0
    // Clear prompts - use window.currentPrompts as source of truth
    window.currentPrompts = {};
    currentPrompts = window.currentPrompts; // Keep local reference in sync
    selectedCategory = null; // Reset selected category for new generation
    leaderPreselectedValue = null;
    leaderPreselectedActive = false;
    generationCandidateCategoriesForRun = [];
    isAnimating = false; // Reset animation flag
    
    // Initialize usedPrompts tracking if not exists (don't reset across generations)
    // CRITICAL: Always sync with window.usedPrompts first (animation-manager modifies window.usedPrompts)
    if (window.usedPrompts && typeof window.usedPrompts === 'object') {
        usedPrompts = window.usedPrompts; // Use the same reference
        debugLog('Synced usedPrompts with window.usedPrompts');
    } else if (!usedPrompts || Object.keys(usedPrompts).length === 0) {
        usedPrompts = {};
        const promptTypes = Object.keys(categories).filter(cat => cat !== 'objective');
        promptTypes.forEach(promptType => {
            usedPrompts[promptType] = new Set();
        });
        debugLog('Initialized usedPrompts tracking');
        // Update window reference so animation manager can access it
        window.usedPrompts = usedPrompts;
    } else {
        debugLog('Using existing usedPrompts tracking across generations');
        // Ensure window reference is synced
        window.usedPrompts = usedPrompts;
    }
    
    // Use prompt types in order (1, 2, 3, 4) - no shuffling
    let promptTypes = Object.keys(categories).filter(cat => cat !== 'objective' && cat !== 'prompt1InterestsMode');
    
    // Skip the first prompt if prompt1InterestsMode is enabled
    const prompt1InterestsMode = categories.prompt1InterestsMode || false;
    if (prompt1InterestsMode && promptTypes.length > 0) {
        promptTypes = promptTypes.slice(1); // Remove the first prompt
        debugLog('Skipping first prompt due to prompt1InterestsMode');
    }
    
    shuffledPromptTypes = [...promptTypes]; // Keep original order
    debugLog('Prompt types for this generation (in order):', shuffledPromptTypes);
    debugLog('Current settings - constraintEnabled:', constraintEnabled, 'completion based on student list processing');
    debugLog('usedPrompts initialized:', usedPrompts);
    
    generateNextAttribute();
}

// Generate next prompt attribute
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
        // CRITICAL: Get categories that exist in ALL prompt types (not just the first one)
        // This ensures the selected category will work for all prompts in the generation
        const allPromptTypes = shuffledPromptTypes.filter(pt => pt !== 'objective' && pt !== 'prompt1InterestsMode');
        
        // Find categories that exist in ALL prompt types
        let availableCategories = [];
        if (allPromptTypes.length > 0) {
            // Start with categories from the first prompt type
            const firstPromptType = allPromptTypes[0];
            const firstPromptData = categories[firstPromptType];
            availableCategories = Object.keys(firstPromptData || {});
            
            // Filter to only include categories that exist in ALL prompt types
            availableCategories = availableCategories.filter(cat => {
                return allPromptTypes.every(promptType => {
                    const promptData = categories[promptType];
                    return promptData && promptData[cat] && Array.isArray(promptData[cat]) && promptData[cat].length > 0;
                });
            });
            
            console.log('DEBUG: Categories that exist in ALL prompt types:', availableCategories);
        }
        
        // Filter categories based on selected interests (category names like "Furniture", "textiles", etc.)
        const selectedInterests = getSelectedInterests();
        console.log('DEBUG: Selected interests:', selectedInterests);
        console.log('DEBUG: Available categories before interest filtering:', availableCategories);
        console.log('DEBUG: selectedInterests type:', typeof selectedInterests, 'is array:', Array.isArray(selectedInterests));
        
        if (selectedInterests !== 'all' && Array.isArray(selectedInterests) && selectedInterests.length > 0) {
            // Filter by selected interests - only keep categories that are in the selected interests
            console.log('DEBUG: Filtering categories by selected interests');
            console.log('DEBUG: selectedInterests array:', selectedInterests);
            console.log('DEBUG: availableCategories before filtering:', availableCategories);
            console.log('DEBUG: Checking each category against selectedInterests:');
            
            availableCategories = availableCategories.filter(cat => {
                const isIncluded = selectedInterests.includes(cat);
                console.log('DEBUG: Category "' + cat + '" in selectedInterests?', isIncluded, '(selectedInterests:', selectedInterests, ')');
                if (!isIncluded) {
                    console.log('DEBUG: Category "' + cat + '" was FILTERED OUT because it is not in selectedInterests');
                }
                return isIncluded;
            });
            console.log('DEBUG: Filtered categories based on interests:', availableCategories);
            console.log('DEBUG: These are the ONLY categories that will be used for this generation');
            debugLog('Filtered categories based on interests:', availableCategories);
        } else {
            console.log('DEBUG: Using all categories (no interest filtering or "all" selected):', availableCategories);
        }
        
        if (availableCategories.length === 0) {
            console.error('No categories found that exist in all prompt types and match selected interests');
            isGenerationComplete = true;
            return;
        }
        
        // Candidate rows for this run (interests + “exists in all prompt types”)
        const candidateCategories = [...availableCategories];
        generationCandidateCategoriesForRun = candidateCategories;
        if (typeof window !== 'undefined') window.generationCandidateCategoriesForRun = candidateCategories;

        const forcedCategory = candidateCategories.length === 1; // R7: single row — no combined leader pool

        if (forcedCategory) {
            // R7 — all prompts (including first) from this category only
            selectedCategory = candidateCategories[0];
            leaderPreselectedValue = null;
            leaderPreselectedActive = false;
            usedCategories.add(selectedCategory);
            console.log('DEBUG: Forced category (R7), entire run:', selectedCategory);
            debugLog('Forced category for entire run:', selectedCategory);
        } else {
            // R2, R3 — leader = first prompt type in run order, drawn from combined pool; lock category from chosen option
            const leaderType = shuffledPromptTypes[0];
            const pick = pickLeaderOptionAndCategory(leaderType, candidateCategories);
            if (pick.value == null || pick.category == null) {
                console.error('Leader draw failed — empty combined pool or missing category for', leaderType);
                isGenerationComplete = true;
                return;
            }
            selectedCategory = pick.category;
            leaderPreselectedValue = pick.value;
            leaderPreselectedActive = true;
            usedCategories.add(selectedCategory);
            console.log('DEBUG: Leader type', leaderType, 'value', pick.value, 'locked category', selectedCategory);
            debugLog('Leader locked category:', selectedCategory, 'leader value:', pick.value);
        }
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
    // CRITICAL: selectedCategory should already be validated to exist in all prompt types
    // But double-check here to prevent errors
    const promptData = categories[currentPromptType];
    
    console.log('DEBUG: Using selectedCategory:', selectedCategory, 'for prompt type:', currentPromptType);
    console.log('DEBUG: selectedCategory was set at generationStep 0 and should NOT change');
    console.log('DEBUG: Available categories in this prompt type:', Object.keys(promptData || {}));
    
    if (!promptData || !promptData[selectedCategory]) {
        console.error('ERROR: selectedCategory does not exist in current prompt type!');
        console.error('Current prompt type:', currentPromptType);
        console.error('Selected category:', selectedCategory);
        console.error('Available categories for this prompt type:', Object.keys(promptData || {}));
        console.error('This should not happen - selectedCategory should exist in all prompt types');
        console.error('This means the category filtering logic failed to ensure category exists in all types');
        
        // This is a critical error - the category selection logic failed
        isGenerationComplete = true;
        return;
    }
    
    const promptOptions = promptData[selectedCategory];
    console.log('DEBUG: Successfully using selectedCategory:', selectedCategory, 'for prompt type:', currentPromptType);
    console.log('DEBUG: Found', promptOptions.length, 'prompt options for this category');
    
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
    const shouldConstrain = true;
    const leaderType = shuffledPromptTypes[0];
    // R2/R3: first prompt in run was chosen from combined pool; use it without re-rolling
    const isLeaderPreselectedStep = leaderPreselectedActive && generationStep === 0 && currentPromptType === leaderType;

    debugLog('Constraint is always enabled - preventing repetition');

    if (shouldConstrain) {
        ensureUsedSetForType(currentPromptType);

        const previousValueForThisType = (window.currentStudentPreviousPrompts && window.currentStudentPreviousPrompts[currentPromptType]) || null;

        if (isLeaderPreselectedStep) {
            selectedPrompt = leaderPreselectedValue;
            leaderPreselectedActive = false;
            leaderPreselectedValue = null;
            // Leader already marked in play at pick time
            debugLog('Leader step: using preselected value from combined pool:', selectedPrompt);
        } else {
            let unusedItems = promptOptions.filter(
                item => !usedPrompts[currentPromptType].has(item)
            );
            if (previousValueForThisType != null) {
                unusedItems = unusedItems.filter(item => item !== previousValueForThisType);
            }

            debugLog('CONSTRAINT - Prompt type:', currentPromptType, 'unused in locked category:', unusedItems.length, 'pool size:', promptOptions.length);

            // R6 / I5: clear in-play only when the global union is exhausted.
            // Category-local empty must NOT clear — that caused early repeats (e.g. A1 before B1/BB1).
            if (unusedItems.length === 0) {
                const cats = generationCandidateCategoriesForRun.length
                    ? generationCandidateCategoriesForRun
                    : (selectedCategory ? [selectedCategory] : []);
                if (isUnionFullyUsedForType(currentPromptType, cats)) {
                    debugLog('R6: full union exhausted for', currentPromptType, '- refresh in-play set');
                    usedPrompts[currentPromptType].clear();
                    window.usedPrompts = usedPrompts;
                    unusedItems = promptOptions.filter(
                        item => !usedPrompts[currentPromptType].has(item)
                    );
                    if (previousValueForThisType != null) {
                        unusedItems = unusedItems.filter(item => item !== previousValueForThisType);
                    }
                } else {
                    debugLog(
                        'Locked category empty for', currentPromptType,
                        'but union not exhausted — keep in-play (R4); fall back within category only'
                    );
                }
            }

            if (unusedItems.length === 0) {
                // Should be rare when leader prefers viable locks. Stay in category (R3).
                const otherThanPrevious = promptOptions.filter(item => item !== previousValueForThisType);
                const pool = otherThanPrevious.length > 0 ? otherThanPrevious : promptOptions;
                selectedPrompt = pool[Math.floor(Math.random() * pool.length)];
                console.warn('R4 stress: locked category empty, union not exhausted; local pick', currentPromptType, selectedPrompt);
            } else {
                selectedPrompt = unusedItems[Math.floor(Math.random() * unusedItems.length)];
            }
            markPromptInPlay(currentPromptType, selectedPrompt);
        }
    } else {
        debugLog('CONSTRAINT DISABLED for', currentPromptType, '- selecting randomly from all items');
        selectedPrompt = promptOptions[Math.floor(Math.random() * promptOptions.length)];
        markPromptInPlay(currentPromptType, selectedPrompt);
    }
    
    // Fallback: ensure we always have a selection
    if (!selectedPrompt && promptOptions && promptOptions.length > 0) {
        debugLog('FALLBACK: No selection made, picking random item');
        selectedPrompt = promptOptions[Math.floor(Math.random() * promptOptions.length)];
    }
    
    debugLog('Selected prompt:', selectedPrompt, 'from prompt type', currentPromptType, 'category', selectedCategory);
    // Pass prompt type and selected prompt to animation so it can mark as used when complete
    if (window.startScrambleAnimation) {
        window.startScrambleAnimation(selectedPrompt, currentPromptType, currentPromptType, selectedCategory);
    } else {
        console.error('startScrambleAnimation is not available on window object');
        // Fallback: set prompt directly without animation
        currentPrompts[currentPromptType] = selectedPrompt;
    }
}

// Reset generator state
function resetGeneratorState() {
    generationStep = 0;
    shouldStop = false;
    isGenerationComplete = false;
    // Clear prompts - use window.currentPrompts as source of truth
    window.currentPrompts = {};
    currentPrompts = window.currentPrompts; // Keep local reference in sync
    selectedCategory = null;
    leaderPreselectedValue = null;
    leaderPreselectedActive = false;
    generationCandidateCategoriesForRun = [];
    isAnimating = false; // Reset animation flag
    
    // Don't reset usedCategories here - we want to maintain the cycle across generations
    
    // Don't reset usedPrompts - we want to maintain constraint across generations
    // Only initialize if not exists
    if (!usedPrompts || Object.keys(usedPrompts).length === 0) {
        usedPrompts = {};
        Object.keys(categories).forEach(category => {
            if (category !== 'objective') {
                usedPrompts[category] = new Set();
            }
        });
        // Update window reference so animation manager can access it
        window.usedPrompts = usedPrompts;
    }
    
    // Reset first prompt tracking - removed legacy variables
    
    // Reset category sequence for new generation
    if (window.categorySequence) {
        window.categorySequence = [];
    }
    
    const categoryNames = Object.keys(categories).filter(cat => cat !== 'objective');
    const maxPrompts = categoryNames.length; // Generate as many prompts as there are categories
    
    debugLog('Reset state:', {
        categories: Object.keys(categories),
        usedPrompts,
        maxPrompts: maxPrompts
    });
}

// Reset prompts display
function resetPrompts() {
    // Clear prompts - use window.currentPrompts as source of truth
    window.currentPrompts = {};
    currentPrompts = window.currentPrompts; // Keep local reference in sync
    Object.keys(categories).forEach(category => {
        currentPrompts[category] = '';
    });
}

// Commit pending prompts to used list (called when student changes)
function commitPendingPrompts() {
    debugLog('Committing pending prompts to used list');
    // Sync with window.pendingPrompts first (animation-manager uses window.pendingPrompts)
    if (window.pendingPrompts && Array.isArray(window.pendingPrompts)) {
        pendingPrompts = [...window.pendingPrompts];
    }
    
    // Pending prompts are already in usedPrompts, just clear the pending list
    // This marks them as permanently used (they stay in usedPrompts)
    if (pendingPrompts && pendingPrompts.length > 0) {
        debugLog('Committed', pendingPrompts.length, 'pending prompts');
        debugLog('Committed prompts:', pendingPrompts);
    }
    pendingPrompts = []; // Always clear
    if (window.pendingPrompts) {
        window.pendingPrompts = []; // Also clear window reference
    }
    currentStudentForPrompts = null; // Reset student tracking
    debugLog('Cleared pending prompts after commit');
}

// Export functions to window
window.startGeneration = startGeneration;
window.resetGeneratorState = resetGeneratorState;
window.generateNextAttribute = generateNextAttribute;
window.resetPrompts = resetPrompts;
window.commitPendingPrompts = commitPendingPrompts;
// Export usedPrompts and globalUsedPrompts so animation manager can mark prompts as used
window.usedPrompts = usedPrompts;
window.globalUsedPrompts = globalUsedPrompts;
window.pendingPrompts = pendingPrompts;
