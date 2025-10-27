// Prompt Generator - Handles prompt generation logic and constraints
// Responsible for: Prompt generation, category selection, constraint management

let usedPrompts = {};
let selectedCategory = null;
let usedCategories = new Set(); // Track which categories have been used in the current cycle
let shuffledPromptTypes = []; // Store the shuffled order of prompt types for the current generation
let globalUsedPrompts = {}; // Track used prompts across ALL categories
let generatedCount = 0; // Track how many prompts have been generated
let constraintEnabled = true;

// Start prompt generation
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
        // Get all available categories from the first prompt type
        const firstPromptType = shuffledPromptTypes[0];
        const firstPromptData = categories[firstPromptType];
        let availableCategories = Object.keys(firstPromptData);
        
        // Filter categories based on selected interests (category letters A, B, C, D)
        const selectedInterests = getSelectedInterests();
        console.log('DEBUG: Selected interests:', selectedInterests);
        console.log('DEBUG: Available categories before filtering:', availableCategories);
        
        if (selectedInterests !== 'all') {
            // Only filter by interests if the selected categories actually have content
            const categoriesWithContent = availableCategories.filter(cat => {
                // Check if this category has content in any prompt column
                let hasContent = false;
                Object.keys(categories).forEach(promptType => {
                    if (promptType !== 'objective' && promptType !== 'prompt1InterestsMode') {
                        const categoryData = categories[promptType];
                        if (categoryData && categoryData[cat]) {
                            const prompts = categoryData[cat];
                            if (Array.isArray(prompts) && prompts.length > 0) {
                                const hasNonEmptyPrompts = prompts.some(prompt => 
                                    prompt && prompt.trim().length > 0
                                );
                                if (hasNonEmptyPrompts) {
                                    hasContent = true;
                                }
                            }
                        }
                    }
                });
                return hasContent;
            });
            
            // Filter by selected interests only among categories that have content
            availableCategories = categoriesWithContent.filter(cat => selectedInterests.includes(cat));
            console.log('DEBUG: Filtered categories based on interests (only those with content):', availableCategories);
            debugLog('Filtered categories based on interests (only those with content):', availableCategories);
            
            // Force selection if only one category is available
            if (availableCategories.length === 1) {
                console.log('DEBUG: Forcing selection to only available category:', availableCategories[0]);
            }
        } else {
            // When "all" is selected, still only use categories that have content
            availableCategories = availableCategories.filter(cat => {
                let hasContent = false;
                Object.keys(categories).forEach(promptType => {
                    if (promptType !== 'objective' && promptType !== 'prompt1InterestsMode') {
                        const categoryData = categories[promptType];
                        if (categoryData && categoryData[cat]) {
                            const prompts = categoryData[cat];
                            if (Array.isArray(prompts) && prompts.length > 0) {
                                const hasNonEmptyPrompts = prompts.some(prompt => 
                                    prompt && prompt.trim().length > 0
                                );
                                if (hasNonEmptyPrompts) {
                                    hasContent = true;
                                }
                            }
                        }
                    }
                });
                return hasContent;
            });
            console.log('DEBUG: Using all categories with content (no interest filtering):', availableCategories);
        }
        
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
        
        // If only one category is available after filtering, select it directly
        if (candidateCategories.length === 1) {
            selectedCategory = candidateCategories[0];
            console.log('DEBUG: Only one category available, selecting directly:', selectedCategory);
            debugLog('Only one category available, selecting directly:', selectedCategory);
        } else {
            // Select a random category that will be used for ALL prompts in this generation
            selectedCategory = candidateCategories[Math.floor(Math.random() * candidateCategories.length)];
            console.log('DEBUG: Selected category for entire generation:', selectedCategory, 'from candidates:', candidateCategories);
            debugLog('Selected category for entire generation:', selectedCategory, 'from candidates:', candidateCategories);
        }
        
        usedCategories.add(selectedCategory);
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
            
            // Mark this as a reset event for tracking
            const globalKey = `${currentPromptType}_${selectedCategory}_RESET`;
            globalUsedPrompts[globalKey] = true;
            debugLog('Marked reset event for tracking:', globalKey);
        } else {
            // Select random unused item
            selectedPrompt = unusedItems[Math.floor(Math.random() * unusedItems.length)];
        }
        
        if (selectedPrompt) {
            usedPrompts[currentPromptType].add(selectedPrompt);
            
            // Also track globally
            const globalKey = `${currentPromptType}_${selectedCategory}_${selectedPrompt}`;
            if (!globalUsedPrompts[globalKey]) {
                globalUsedPrompts[globalKey] = true;
                debugLog('Added to global tracking:', globalKey);
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

// Export functions to window
window.startGeneration = startGeneration;
window.resetGeneratorState = resetGeneratorState;
window.generateNextAttribute = generateNextAttribute;
window.resetPrompts = resetPrompts;
