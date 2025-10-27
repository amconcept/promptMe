// Editor UI Manager - Handles all UI elements and interactions
// Responsible for: Prompt/category management, button states, form interactions

// Global UI state
let categoryCounter = 0;
let promptCounter = 0;
const MAX_CATEGORIES = 6;
const MAX_PROMPTS = 4;

// Criterion labels for student interests
let criterionLabels = ['sport', 'entertainment', 'academic', 'creative'];

// Function to update criterion label
function updateCriterionLabel(index, value) {
    criterionLabels[index] = value.trim() || `criterion-${index + 1}`;
    console.log('Updated criterion label:', index, criterionLabels[index]);
    console.log('Current criterionLabels array:', criterionLabels);
    // Save changes immediately when criterion labels are updated
    saveChanges();
}

// Add new prompt column
function addNewPrompt() {
    console.log('=== DEBUG: addNewPrompt called ===');
    console.log('Current promptCounter:', promptCounter);
    console.log('MAX_PROMPTS:', MAX_PROMPTS);
    
    // Reset promptCounter based on actual DOM elements
    const actualPromptCount = document.querySelectorAll('.prompt-column').length;
    promptCounter = actualPromptCount;
    console.log('Actual prompt count from DOM:', actualPromptCount);
    console.log('Updated promptCounter:', promptCounter);
    
    if (promptCounter >= MAX_PROMPTS) {
        alert(`Maximum of ${MAX_PROMPTS} prompts reached`);
        return;
    }
    
    const promptHeaders = document.getElementById('prompt-headers');
    console.log('Found prompt-headers element:', promptHeaders);
    
    if (!promptHeaders) {
        console.log('ERROR: prompt-headers element not found in addNewPrompt');
        return;
    }
    
    // Create new prompt column
    const newPromptColumn = document.createElement('div');
    newPromptColumn.className = 'prompt-column';
    newPromptColumn.innerHTML = `
        <input type="text" class="header-input" placeholder="Enter Prompt ${promptCounter + 1}">
        ${promptCounter > 0 ? '<button class="delete-prompt" onclick="deletePrompt(this)">[ X ]</button>' : ''}
    `;
    
    console.log('Created new prompt column:', newPromptColumn);
    
    // Add the new prompt to DOM
    promptHeaders.appendChild(newPromptColumn);
    console.log('Added prompt column to DOM');
    
    promptCounter++;
    console.log('Incremented promptCounter to:', promptCounter);
    
    // Add new textarea to existing categories
    addPromptToExistingCategories();
    
    // Update category rows
    updateCategoryRows();
    
    // Update prompt count displays
    updatePromptCounts();
    
    // Add buttons are now static in HTML - no position updates needed
    
    console.log('addNewPrompt completed successfully');
}

// Update category rows for grid system
function updateCategoryRows() {
    const promptColumns = document.querySelectorAll('.prompt-column');
    const promptCount = promptColumns.length;
    
    // Update delete button visibility - only show for prompts beyond the first
    promptColumns.forEach((column, index) => {
        const deleteBtn = column.querySelector('.delete-prompt');
        if (deleteBtn) {
            deleteBtn.style.display = index > 0 ? 'flex' : 'none';
        }
    });
    
    // Grid system handles alignment automatically
    console.log('Grid system update completed');
}

// Add new prompt to existing categories
function addPromptToExistingCategories() {
    const categoriesContainer = document.getElementById('categories-container');
    const existingTextareas = document.querySelectorAll('.textarea-container');
    const existingCriterionLabels = document.querySelectorAll('.criterion-label-container');
    
    if (existingTextareas.length === 0 || existingCriterionLabels.length === 0) {
        console.log('No existing categories to update');
        return;
    }
    
    // Each category has: 1 criterion label + N textareas (where N = old prompt count)
    const oldPromptCount = existingTextareas.length / existingCriterionLabels.length;
    const newPromptCount = oldPromptCount + 1;
    
    console.log(`Adding textarea to each of ${existingCriterionLabels.length} existing categories`);
    console.log(`Old prompt count: ${oldPromptCount}, New prompt count: ${newPromptCount}`);
    
    // Add one textarea to each category
    existingCriterionLabels.forEach((labelContainer, categoryIndex) => {
        // Find the last textarea for this category
        const categoryTextareas = Array.from(document.querySelectorAll('.textarea-container'));
        const lastIndexInCategory = categoryIndex * oldPromptCount + (oldPromptCount - 1);
        const lastTextareaContainer = categoryTextareas[lastIndexInCategory];
        
        if (lastTextareaContainer) {
            const textareaContainer = document.createElement('div');
            textareaContainer.className = 'textarea-container';
            
            const textarea = document.createElement('textarea');
            textarea.placeholder = 'Enter prompts (one per line)';
            textareaContainer.appendChild(textarea);
            
            // Insert after the last textarea of this category
            lastTextareaContainer.insertAdjacentElement('afterend', textareaContainer);
        }
    });
    
    console.log('Added textareas to all existing categories');
}

// Add new category row
function addNewCategory() {
    console.log('=== DEBUG: addNewCategory called ===');
    console.log('Current categoryCounter:', categoryCounter);
    console.log('MAX_CATEGORIES:', MAX_CATEGORIES);
    
    if (categoryCounter >= MAX_CATEGORIES) {
        alert(`Maximum of ${MAX_CATEGORIES} categories reached`);
        return;
    }
    
    const categoriesContainer = document.getElementById('categories-container');
    console.log('Found categories-container element:', categoriesContainer);
    
    if (!categoriesContainer) {
        console.log('ERROR: categories-container element not found in addNewCategory');
        return;
    }
    
    categoryCounter++;
    console.log('Incremented categoryCounter to:', categoryCounter);
    
    // Get prompt count - count header inputs, not columns
    const promptCount = document.querySelectorAll('.header-input').length;
    console.log('Found prompt headers:', promptCount);
    
    // Create criterion label input field (goes in first column of grid)
    const criterionLabelContainer = document.createElement('div');
    criterionLabelContainer.className = 'criterion-label-container';
    
    // Check if there will be multiple categories after adding this one
    const existingCategories = document.querySelectorAll('.criterion-label-input').length;
    const willHaveMultipleCategories = existingCategories > 0;
    
    // Conditionally add onclick attribute and visible class
    const buttonClass = willHaveMultipleCategories ? 'delete-category' : 'delete-category invisible-delete';
    const onClickAttr = willHaveMultipleCategories ? 'onclick="deleteCategory(this)"' : '';
    
    criterionLabelContainer.innerHTML = `
        <button class="${buttonClass}" ${onClickAttr}>[ X ]</button>
    `;
    const criterionInput = document.createElement('input');
    criterionInput.type = 'text';
    criterionInput.className = 'criterion-label-input';
    criterionInput.placeholder = 'Enter criterion label';
    criterionInput.value = criterionLabels[categoryCounter - 1] || '';
    criterionInput.onchange = () => updateCriterionLabel(categoryCounter - 1, criterionInput.value);
    criterionLabelContainer.appendChild(criterionInput);
    
    // Add criterion label to grid (first column)
    categoriesContainer.appendChild(criterionLabelContainer);
    
    // Add a textarea for each prompt column (in subsequent columns)
    for (let i = 0; i < promptCount; i++) {
        const textareaContainer = document.createElement('div');
        textareaContainer.className = 'textarea-container';
        
        const textarea = document.createElement('textarea');
        textarea.placeholder = 'Enter prompts (one per line)';
        textareaContainer.appendChild(textarea);
        
        // Add textarea directly to grid (columns 2, 3, 4, etc.)
        categoriesContainer.appendChild(textareaContainer);
    }
    
    console.log('Added category elements to grid');
    
    updateCategoryRows();
    
    // Update prompt count displays
    updatePromptCounts();
    
    // Add buttons are now static in HTML - no position updates needed
    
    console.log('addNewCategory completed successfully');
}

// Delete prompt column
function deletePrompt(button) {
    const promptColumn = button.closest('.prompt-column');
    const promptColumns = document.querySelectorAll('.prompt-column');
    
    // Only prevent deletion if it would leave us with less than 1 prompt
    if (promptColumns.length <= 1) {
        return;
    }
    
    // Find the index of this prompt column
    const promptIndex = Array.from(promptColumns).indexOf(promptColumn);
    
    // Remove corresponding textarea from each category using grid structure
    const criterionInputs = document.querySelectorAll('.criterion-label-container');
    const textareas = document.querySelectorAll('.textarea-container textarea');
    const oldPromptCount = promptColumns.length;
    
    criterionInputs.forEach((criterionContainer, rowIndex) => {
        // Calculate which textarea to remove for this category
        const textareaIndex = rowIndex * oldPromptCount + promptIndex;
        const textarea = textareas[textareaIndex];
        if (textarea && textarea.parentElement) {
            textarea.parentElement.remove(); // Remove the textarea-container div
        }
    });
    
    promptColumn.remove();
    promptCounter--;
    
    // Update category rows to refresh criterion labels
    updateCategoryRows();
    
    // Show the add button if we're below MAX_PROMPTS
    const addButton = document.querySelector('.add-prompt-button');
    if (addButton && promptCounter < MAX_PROMPTS) {
        addButton.style.display = 'flex';
    }
    
    // Update prompt count displays
    updatePromptCounts();
}

// Delete category row
function deleteCategory(button) {
    const criterionLabelContainer = button.closest('.criterion-label-container');
    const allCriterionLabels = document.querySelectorAll('.criterion-label-container');
    
    // Don't allow deletion if it would leave us with less than 1 category
    if (allCriterionLabels.length <= 1) {
        return;
    }
    
    // Find the index of this category row
    const rowIndex = Array.from(allCriterionLabels).indexOf(criterionLabelContainer);
    
    if (rowIndex === -1) return;
    
    // Get prompt count
    const promptCount = document.querySelectorAll('.header-input').length;
    
    // Remove this category's textareas from all prompt columns
    const textareas = document.querySelectorAll('.textarea-container textarea');
    for (let colIndex = 0; colIndex < promptCount; colIndex++) {
        const textareaIndex = rowIndex * promptCount + colIndex;
        const textarea = textareas[textareaIndex];
        if (textarea && textarea.parentElement) {
            textarea.parentElement.remove();
        }
    }
    
    // Remove the criterion label container
    criterionLabelContainer.remove();
    
    categoryCounter--;
    updateCategoryRows();
    
    // Update prompt count displays
    updatePromptCounts();
    updateColumnCounts();
}

// Update prompt count displays
function updatePromptCounts() {
    // This function is now deprecated - using updateColumnCounts instead
    updateColumnCounts();
}

// Update column counts for grid system - tooltip only (no visible badge)
function updateColumnCounts() {
    const promptHeaders = document.querySelectorAll('.header-input');
    const textareas = document.querySelectorAll('.textarea-container textarea');
    
    if (promptHeaders.length === 0) return;

    // Count items for each prompt column
    const promptCount = promptHeaders.length;
    const categoriesCount = textareas.length / promptCount;
    
    promptHeaders.forEach((header, columnIndex) => {
        let totalItems = 0;
        
        // Count items across all categories for this prompt column
        for (let categoryIndex = 0; categoryIndex < categoriesCount; categoryIndex++) {
            const textareaIndex = categoryIndex * promptCount + columnIndex;
            const textarea = textareas[textareaIndex];
            if (textarea && textarea.value.trim()) {
                const items = textarea.value.split('\n')
                    .map(item => item.trim())
                    .filter(item => item.length > 0);
                totalItems += items.length;
            }
        }
        
        // Add count as title attribute (tooltip on hover) - that's it
        header.setAttribute('title', `${totalItems} possible selections`);
    });
}

// Create and position add buttons
function createAddButtons() {
    // Remove any floating add buttons that might exist from old code
    const existingFloatingPrompt = document.querySelector('.add-prompt-button');
    const existingFloatingCategory = document.querySelector('.add-category-button');
    
    // Only remove if they're floating (not in the container)
    if (existingFloatingPrompt && !existingFloatingPrompt.closest('.add-buttons-container')) {
        existingFloatingPrompt.remove();
        console.log('DEBUG: Removed existing floating add prompt button');
    }
    if (existingFloatingCategory && !existingFloatingCategory.closest('.add-buttons-container')) {
        existingFloatingCategory.remove();
        console.log('DEBUG: Removed existing floating add category button');
    }
    
    // The buttons are now static in the HTML, so we don't need to create them
    console.log('DEBUG: Add buttons are now static in HTML - no need to create floating buttons');
}

// Update add button positions when prompts/categories change
function updateAddButtonPositions() {
    // No longer needed since buttons are static in HTML
    console.log('DEBUG: Add buttons are static - no position updates needed');
}

// Initialize default state
function initializeDefaultState() {
    // Clear existing state
    const promptHeaders = document.getElementById('prompt-headers');
    promptHeaders.innerHTML = '';
    
    document.getElementById('categories-container').innerHTML = '';
    promptCounter = 0;
    categoryCounter = 0;
    
    // Add one prompt column
    addNewPrompt();
    
    // Add one category row
    addNewCategory();
    
    // Show add prompt row
    const addPromptRow = document.querySelector('.add-prompt-row');
    if (addPromptRow) {
        addPromptRow.style.display = 'flex';
    }
    
    // Update the UI
    updateCategoryRows();
}

// Clear all fields
function clearAllFields() {
    // Clear objective
    document.getElementById('objective-input').value = '';
    
    // Clear checkbox
    document.getElementById('prompt1-interests-mode').checked = false;
    
    // Clear prompt headers
    const promptHeaders = document.getElementById('prompt-headers');
    const addButton = promptHeaders.querySelector('.add-prompt-button');
    if (addButton) {
        addButton.remove();
    }
    promptHeaders.innerHTML = '';
    if (addButton) {
        promptHeaders.appendChild(addButton);
    }
    
    // Clear categories
    const categoriesContainer = document.getElementById('categories-container');
    categoriesContainer.innerHTML = '';
    
    // Reset counters
    promptCounter = 0;
    categoryCounter = 0;
    
    // Update UI
    updatePromptCounts();
    updateColumnCounts();
}

// Initialize default content
function initializeDefaultContent() {
    console.log('=== DEBUG: initializeDefaultContent called ===');
    
    // Clear objective
    const objectiveInput = document.getElementById('objective-input');
    if (objectiveInput) {
        objectiveInput.value = '';
        console.log('DEBUG: Cleared objective input');
    } else {
        console.log('ERROR: objective-input element not found');
    }
    
    // Clear checkbox
    const checkbox = document.getElementById('prompt1-interests-mode');
    if (checkbox) {
        checkbox.checked = false;
        console.log('DEBUG: Cleared checkbox');
    } else {
        console.log('ERROR: prompt1-interests-mode element not found');
    }
    
    // Clear prompt headers
    const promptHeaders = document.getElementById('prompt-headers');
    if (promptHeaders) {
        console.log('DEBUG: Found prompt-headers element');
        const addButton = promptHeaders.querySelector('.add-prompt-button');
        if (addButton) {
            addButton.remove();
        }
        promptHeaders.innerHTML = '';
        if (addButton) {
            promptHeaders.appendChild(addButton);
        }
        console.log('DEBUG: Cleared prompt headers');
    } else {
        console.log('ERROR: prompt-headers element not found');
    }
    
    // Clear categories
    const categoriesContainer = document.getElementById('categories-container');
    if (categoriesContainer) {
        categoriesContainer.innerHTML = '';
        console.log('DEBUG: Cleared categories container');
    } else {
        console.log('ERROR: categories-container element not found');
    }
    
    // Reset counters
    promptCounter = 0;
    categoryCounter = 0;
    console.log('DEBUG: Reset counters to 0');
    
    // Reset criterion labels to empty
    criterionLabels = ['', '', '', ''];
    console.log('DEBUG: Reset criterion labels');
    
    // Add 1 default prompt
    console.log('DEBUG: About to call addNewPrompt()');
    addNewPrompt();
    console.log('DEBUG: addNewPrompt() completed');
    
    // Add 1 default category
    console.log('DEBUG: About to call addNewCategory()');
    addNewCategory();
    console.log('DEBUG: addNewCategory() completed');
    
    // Keep prompt1InterestsMode unchecked by default for empty start
    if (checkbox) {
        checkbox.checked = false;
        console.log('DEBUG: Ensured checkbox is unchecked');
    }
    
    // Update UI
    console.log('DEBUG: About to update UI');
    updatePromptCounts();
    updateColumnCounts();
    console.log('DEBUG: UI updates completed');
    
    // Force sketch to reload by dispatching a custom event
    window.dispatchEvent(new CustomEvent('promptDataUpdated', {
        detail: { timestamp: Date.now() }
    }));
    
    // Add buttons are now static in HTML - no need to create them
    
    console.log('DEBUG: initializeDefaultContent completed successfully');
}

// Toggle prompting tips dropdown
function togglePromptingTips() {
    const tipsList = document.getElementById('prompting-tips-list');
    const toggle = document.getElementById('tips-toggle');
    
    if (tipsList.style.display === 'none') {
        tipsList.style.display = 'block';
        toggle.textContent = '▲';
    } else {
        tipsList.style.display = 'none';
        toggle.textContent = '▼';
    }
}

// Toggle settings panel visibility
function toggleSettingsPanel() {
    const panel = document.getElementById('settings-panel');
    const toggle = document.getElementById('settings-panel-toggle');
    
    if (panel.style.display === 'none') {
        panel.style.display = 'block';
        panel.style.opacity = '1';
        panel.style.transform = 'translateX(0)';
        toggle.innerHTML = '☰';
    } else {
        panel.style.opacity = '0';
        panel.style.transform = 'translateX(20px)';
        setTimeout(() => {
            panel.style.display = 'none';
        }, 300);
        toggle.innerHTML = '☰';
    }
}

// Make functions globally available
window.addNewPrompt = addNewPrompt;
window.addNewCategory = addNewCategory;
window.deletePrompt = deletePrompt;
window.deleteCategory = deleteCategory;
window.togglePromptingTips = togglePromptingTips;
window.toggleSettingsPanel = toggleSettingsPanel;
window.updateCriterionLabel = updateCriterionLabel;
window.criterionLabels = criterionLabels;
window.initializeDefaultContent = initializeDefaultContent;
window.clearAllFields = clearAllFields;
window.updateCategoryRows = updateCategoryRows;
window.updatePromptCounts = updatePromptCounts;
window.updateColumnCounts = updateColumnCounts;
window.createAddButtons = createAddButtons;
window.initializeDefaultState = initializeDefaultState;
