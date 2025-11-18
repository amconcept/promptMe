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

// Start prompt generation
function startGeneration() {
    debugLog('4. startGeneration called');
    
    // If generation is in progress, stop it first (allow interruption and restart)
    if (isGenerating || isAnimating) {
        debugLog('Stopping current generation to start new one');
        shouldStop = true;
        isGenerating = false;
        isAnimating = false;
        // Clear any running intervals
        if (window.clearAnimations) {
            window.clearAnimations();
        }
        // Small delay to ensure cleanup completes
        setTimeout(() => {
            startGenerationInternal();
        }, 50);
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
    
    // Get current student name to track if we're regenerating for same student
    const currentStudent = window.studentName || null;
    
    // Sync local pendingPrompts with window.pendingPrompts (animation-manager uses window.pendingPrompts)
    if (window.pendingPrompts && Array.isArray(window.pendingPrompts)) {
        pendingPrompts = [...window.pendingPrompts]; // Sync local copy
    } else {
        pendingPrompts = []; // Ensure it's an array
    }
    
    // If regenerating for the same student, unuse previous pending prompts
    if (currentStudent === currentStudentForPrompts && pendingPrompts.length > 0) {
        debugLog('Regenerating for same student - unusing previous pending prompts');
        debugLog('Pending prompts to unuse:', pendingPrompts);
        pendingPrompts.forEach(pending => {
            if (window.usedPrompts && window.usedPrompts[pending.promptType]) {
                const wasRemoved = window.usedPrompts[pending.promptType].delete(pending.prompt);
                debugLog('Unused pending prompt:', pending.prompt, 'for type:', pending.promptType, 'wasRemoved:', wasRemoved);
            }
            // Also remove from global tracking
            if (window.globalUsedPrompts && pending.selectedCategory) {
                const globalKey = `${pending.promptType}_${pending.selectedCategory}_${pending.prompt}`;
                delete window.globalUsedPrompts[globalKey];
                debugLog('Removed from global tracking:', globalKey);
            }
        });
        pendingPrompts = []; // Clear pending prompts
        window.pendingPrompts = []; // Also clear window reference
        debugLog('Cleared pending prompts after unusing');
    }
    
    // Update current student tracking
    currentStudentForPrompts = currentStudent;
    
    isGenerating = true;
    shouldStop = false;
    generationStep = 0;  // Double-check generation step is 0
    currentPrompts = {};
    selectedCategory = null; // Reset selected category for new generation
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
        
        // Apply category cycling constraint - always cycle through categories to avoid repeats
        // This works for both "All Categories" and individual category selections
        let candidateCategories = [...availableCategories];
        
        if (constraintEnabled && availableCategories.length > 2) {
            // If we've used all categories, reset the cycle
            if (usedCategories.size >= availableCategories.length) {
                usedCategories.clear();
                debugLog('Reset category cycle - all categories have been used');
            }
            
            // Filter out already used categories to ensure no repeats until all are used
            candidateCategories = availableCategories.filter(cat => !usedCategories.has(cat));
            
            // If constraint eliminated all options, use all available categories
            if (candidateCategories.length === 0) {
                candidateCategories = [...availableCategories];
                debugLog('Constraint eliminated all options, using all categories');
            }
        } else if (availableCategories.length <= 2) {
            // If 2 or fewer categories, cycle through them (no need for constraint)
            // Filter out already used categories
            candidateCategories = availableCategories.filter(cat => !usedCategories.has(cat));
            
            // If all have been used, reset
            if (candidateCategories.length === 0) {
                usedCategories.clear();
                candidateCategories = [...availableCategories];
                debugLog('Reset category cycle - all categories have been used (2 or fewer categories)');
            }
        }
        
        // If only one category is available after filtering, select it directly
        if (candidateCategories.length === 1) {
            selectedCategory = candidateCategories[0];
            console.log('DEBUG: Only one category available, selecting directly:', selectedCategory);
            debugLog('Only one category available, selecting directly:', selectedCategory);
        } else {
            // Select a random category that will be used for ALL prompts in this generation
            selectedCategory = candidateCategories[Math.floor(Math.random() * candidateCategories.length)];
            console.log('DEBUG: Selected category for entire generation:', selectedCategory, 'from candidates:', candidateCategories);
            console.log('DEBUG: selectedInterests was:', selectedInterests);
            console.log('DEBUG: This category will be used for ALL', maxPrompts, 'prompts in this generation');
            debugLog('Selected category for entire generation:', selectedCategory, 'from candidates:', candidateCategories);
        }
        
        // Always track used categories to ensure cycling through all options
        // This applies to both "All Categories" and individual category selections
        usedCategories.add(selectedCategory);
        debugLog('Used categories so far:', Array.from(usedCategories));
        console.log('DEBUG: selectedCategory set to:', selectedCategory, '- this will be used for ALL prompts in this generation');
        console.log('DEBUG: selectedCategory will NOT change during this generation - it stays:', selectedCategory);
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
    
    // Constraint is always enabled now - repetition prevention is always on
    const shouldConstrain = true;
    debugLog('Constraint is always enabled - preventing repetition');
    
    if (shouldConstrain) {
        // CRITICAL: Sync with window.usedPrompts before checking (animation-manager modifies window.usedPrompts)
        if (window.usedPrompts && typeof window.usedPrompts === 'object') {
            usedPrompts = window.usedPrompts; // Use the same reference
        }
        
        // Initialize tracking for this prompt type if needed
        if (!usedPrompts[currentPromptType]) {
            usedPrompts[currentPromptType] = new Set();
            // Update window reference
            window.usedPrompts = usedPrompts;
        }
        
        // Get unused items for this prompt type (check if this specific value has been used before)
        const unusedItems = promptOptions.filter(
            item => !usedPrompts[currentPromptType].has(item)
        );
        
        debugLog('CONSTRAINT ENABLED - Prompt type:', currentPromptType, 'unused items:', unusedItems.length, 'total items:', promptOptions.length);
        debugLog('Used prompts for this type:', Array.from(usedPrompts[currentPromptType] || []));
        debugLog('Available options:', promptOptions);
        
        if (unusedItems.length === 0) {
            // If all items used for this prompt type, clear tracking and start over
            debugLog('All items used for', currentPromptType, 'clearing tracking and starting over');
            usedPrompts[currentPromptType].clear();
            selectedPrompt = promptOptions[Math.floor(Math.random() * promptOptions.length)];
            
            // Mark this as a reset event for tracking
            const globalKey = `${currentPromptType}_${selectedCategory}_RESET`;
            globalUsedPrompts[globalKey] = true;
            debugLog('Marked reset event for tracking:', globalKey);
        } else {
            // Select random unused item
            selectedPrompt = unusedItems[Math.floor(Math.random() * unusedItems.length)];
        }
        
        // Don't mark as used yet - wait until animation completes
        // This prevents rapid triggering from depleting options faster
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
    // Pass prompt type and selected prompt to animation so it can mark as used when complete
    startScrambleAnimation(selectedPrompt, currentPromptType, currentPromptType, selectedCategory);
}

// Reset generator state
function resetGeneratorState() {
    generationStep = 0;
    shouldStop = false;
    isGenerationComplete = false;
    currentPrompts = {};
    selectedCategory = null;
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
    currentPrompts = {};
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
