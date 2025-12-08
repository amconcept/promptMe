// Editor UI Manager - Handles all UI elements and interactions
// Responsible for: Prompt/category management, button states, form interactions

// Global UI state
let categoryCounter = 0;
let promptCounter = 0;
const MAX_CATEGORIES = 6;
const MAX_PROMPTS = 4;

// Criterion labels for student interests
let criterionLabels = ['', '', '', '']; // Start with empty labels - no hardcoded defaults

// Auto-resize textareas in each row to match the tallest one
function autoResizeTextareasInRows() {
    const textareas = document.querySelectorAll('.textarea-container textarea');
    const promptCount = document.querySelectorAll('.header-input').length;
    
    if (textareas.length === 0 || promptCount === 0) {
        return;
    }
    
    // Calculate number of rows (categories)
    const rowCount = Math.ceil(textareas.length / promptCount);
    
    // For each row, find the tallest textarea and set all in that row to match
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
        let maxHeight = 100; // Minimum height
        
        // First pass: find the maximum scrollHeight needed
        for (let colIndex = 0; colIndex < promptCount; colIndex++) {
            const textareaIndex = rowIndex * promptCount + colIndex;
            const textarea = textareas[textareaIndex];
            
            if (textarea) {
                // Temporarily set height to auto to get accurate scrollHeight
                textarea.style.height = 'auto';
                const scrollHeight = textarea.scrollHeight;
                maxHeight = Math.max(maxHeight, scrollHeight);
            }
        }
        
        // Second pass: set all textareas in this row to the max height
        for (let colIndex = 0; colIndex < promptCount; colIndex++) {
            const textareaIndex = rowIndex * promptCount + colIndex;
            const textarea = textareas[textareaIndex];
            
            if (textarea) {
                textarea.style.height = maxHeight + 'px';
            }
        }
    }
}

// Function to update criterion label
function updateCriterionLabel(index, value) {
    criterionLabels[index] = value.trim() || `criterion-${index + 1}`;
    // Save changes immediately when criterion labels are updated
    saveChanges();
}

// Update grid columns dynamically based on number of prompts
function updateGridColumns() {
    const promptGrid = document.querySelector('.prompt-grid');
    if (!promptGrid) {
        console.error('ERROR: prompt-grid element not found');
        return;
    }
    
    // Count actual prompts (header inputs)
    const promptCount = document.querySelectorAll('.header-input').length;
    // Grid needs: 1 column for label placeholder + N columns for prompts
    const totalColumns = 1 + promptCount;
    
    // Build grid-template-columns string: 1 label column + N prompt columns
    const columnWidth = getComputedStyle(document.documentElement).getPropertyValue('--column-width').trim() || '200px';
    const columns = `var(--column-width) ` + `var(--column-width) `.repeat(promptCount);
    
    promptGrid.style.gridTemplateColumns = columns.trim();
}

// Add new prompt column
function addNewPrompt() {
    // Play click sound
    playClickSound();
    
    // Reset promptCounter based on actual DOM elements
    const actualPromptCount = document.querySelectorAll('.prompt-column').length;
    promptCounter = actualPromptCount;
    
    if (promptCounter >= MAX_PROMPTS) {
        alert(`Maximum of ${MAX_PROMPTS} prompts reached`);
        return;
    }
    
    const promptHeaders = document.getElementById('prompt-headers');
    
    if (!promptHeaders) {
        console.error('ERROR: prompt-headers element not found in addNewPrompt');
        return;
    }
    
    // Create new prompt column
    const newPromptColumn = document.createElement('div');
    newPromptColumn.className = 'prompt-column';
    newPromptColumn.innerHTML = `
        <input type="text" class="header-input" placeholder="Enter Prompt ${promptCounter + 1}">
        ${promptCounter > 0 ? '<button class="delete-prompt" onclick="deletePrompt(this)">[ X ]</button>' : ''}
    `;
    
    // Add the new prompt to DOM
    promptHeaders.appendChild(newPromptColumn);
    
    promptCounter++;
    
    // Update grid columns FIRST before adding textareas
    updateGridColumns();
    
    // Add new textarea to existing categories
    addPromptToExistingCategories();
    
    // Update category rows
    updateCategoryRows();
    
    // Update prompt count displays
    updatePromptCounts();
    
    // Add buttons are now static in HTML - no position updates needed
    
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
    
    // Update letter labels for all category rows (A, B, C, D, etc.)
    const criterionLabelContainers = document.querySelectorAll('.criterion-label-container');
    criterionLabelContainers.forEach((container, index) => {
        let letterLabel = container.querySelector('.criterion-letter-label');
        if (!letterLabel) {
            // Create letter label if it doesn't exist
            letterLabel = document.createElement('span');
            letterLabel.className = 'criterion-letter-label';
            letterLabel.style.cssText = `
                font-family: 'VT323', monospace;
                font-size: 18px;
                color: var(--primary-color);
                font-weight: bold;
                margin-right: 5px;
                min-width: 20px;
                flex-shrink: 0;
            `;
            // Insert before the input field
            const input = container.querySelector('.criterion-label-input');
            if (input) {
                container.insertBefore(letterLabel, input);
            }
        }
        const letter = String.fromCharCode(65 + index); // A, B, C, D, etc.
        letterLabel.textContent = letter + ':';
    });
    
    // Grid system handles alignment automatically
}

// Add new prompt to existing categories
function addPromptToExistingCategories() {
    const categoriesContainer = document.getElementById('categories-container');
    const existingCriterionLabels = document.querySelectorAll('.criterion-label-container');
    
    if (existingCriterionLabels.length === 0) {
        return;
    }
    
    
    // Get all children of categoriesContainer in current DOM order
    const allChildren = Array.from(categoriesContainer.children);
    
    // For each category row, find the last textarea in that row and insert after it
    existingCriterionLabels.forEach((labelContainer, categoryIndex) => {
        // Find the index of this label container in the DOM
        const labelIndex = allChildren.indexOf(labelContainer);
        
        if (labelIndex === -1) {
            console.warn(`Could not find label container at index ${categoryIndex}`);
            return;
        }
        
        // Find the last textarea in this row by traversing forward from the label
        // until we hit the next label container or run out of children
        let lastTextareaInRow = null;
        for (let i = labelIndex + 1; i < allChildren.length; i++) {
            const child = allChildren[i];
            if (child.classList.contains('textarea-container')) {
                lastTextareaInRow = child;
            } else if (child.classList.contains('criterion-label-container')) {
                // We've hit the next category row, stop here
                break;
            }
        }
        
        // Create new textarea container
        const textareaContainer = document.createElement('div');
        textareaContainer.className = 'textarea-container';
        
        const textarea = document.createElement('textarea');
        textarea.placeholder = 'Enter prompts (one per line)';
        
        // Add event listeners for auto-resizing
        textarea.addEventListener('input', () => {
            setTimeout(autoResizeTextareasInRows, 10);
        });
        
        textareaContainer.appendChild(textarea);
        
        // Insert the new textarea after the last one in this row
        if (lastTextareaInRow) {
            // Insert after the last textarea in this row
            lastTextareaInRow.insertAdjacentElement('afterend', textareaContainer);
        } else {
            // No textareas found in this row yet (shouldn't happen, but handle gracefully)
            // Insert after the label container
            labelContainer.insertAdjacentElement('afterend', textareaContainer);
        }
    });
    
    // Auto-resize after adding new prompt
    setTimeout(autoResizeTextareasInRows, 10);
}

// Add new category row
function addNewCategory() {
    // Play click sound
    playClickSound();
    
    
    if (categoryCounter >= MAX_CATEGORIES) {
        alert(`Maximum of ${MAX_CATEGORIES} categories reached`);
        return;
    }
    
    const categoriesContainer = document.getElementById('categories-container');
    
    if (!categoriesContainer) {
        console.error('ERROR: categories-container element not found in addNewCategory');
        return;
    }
    
    categoryCounter++;
    
    // Get prompt count - count header inputs, not columns
    const promptCount = document.querySelectorAll('.header-input').length;
    
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
    
    // Add letter prefix label (A, B, C, D, etc.) for clarity
    const letterLabel = document.createElement('span');
    letterLabel.className = 'criterion-letter-label';
    const letter = String.fromCharCode(65 + (categoryCounter - 1)); // A, B, C, D, etc.
    letterLabel.textContent = letter + ':';
    letterLabel.style.cssText = `
        font-family: 'VT323', monospace;
        font-size: 18px;
        color: var(--primary-color);
        font-weight: bold;
        margin-right: 5px;
        min-width: 20px;
        flex-shrink: 0;
    `;
    criterionLabelContainer.appendChild(letterLabel);
    
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
        
        // Add event listeners for auto-resizing
        textarea.addEventListener('input', () => {
            setTimeout(autoResizeTextareasInRows, 10);
        });
        
        textareaContainer.appendChild(textarea);
        
        // Add textarea directly to grid (columns 2, 3, 4, etc.)
        categoriesContainer.appendChild(textareaContainer);
    }
    
    console.log('Added category elements to grid');
    
    updateCategoryRows();
    
    // Auto-resize after adding new category
    setTimeout(autoResizeTextareasInRows, 10);
    
    // Update prompt count displays
    updatePromptCounts();
    
    // Add buttons are now static in HTML - no position updates needed
    
    console.log('addNewCategory completed successfully');
}

// Delete prompt column
function deletePrompt(button) {
    // Play click sound
    playClickSound();
    
    const promptColumn = button.closest('.prompt-column');
    if (!promptColumn) {
        console.error('Could not find prompt column');
        return;
    }
    
    const promptColumns = document.querySelectorAll('.prompt-column');
    
    // Only prevent deletion if it would leave us with less than 1 prompt
    if (promptColumns.length <= 1) {
        return;
    }
    
    // Find the index of this prompt column
    const promptIndex = Array.from(promptColumns).indexOf(promptColumn);
    
    if (promptIndex === -1) {
        console.error('Could not find prompt index');
        return;
    }
    
    console.log(`Deleting prompt column at index ${promptIndex}`);
    
    // Get all children of categories container to traverse in DOM order
    const categoriesContainer = document.getElementById('categories-container');
    const allChildren = Array.from(categoriesContainer.children);
    
    // Find all criterion label containers (one per row)
    const criterionLabels = document.querySelectorAll('.criterion-label-container');
    
    // For each category row, find and remove the textarea at the correct column index
    criterionLabels.forEach((labelContainer, rowIndex) => {
        // Find the index of this label in the DOM
        const labelIndex = allChildren.indexOf(labelContainer);
        
        if (labelIndex === -1) {
            console.warn(`Could not find label container at row ${rowIndex}`);
            return;
        }
        
        // Traverse forward from the label to find textareas in this row
        // Count textareas until we reach the one at promptIndex
        let textareaCount = 0;
        let targetTextarea = null;
        
        for (let i = labelIndex + 1; i < allChildren.length; i++) {
            const child = allChildren[i];
            if (child.classList.contains('textarea-container')) {
                if (textareaCount === promptIndex) {
                    targetTextarea = child;
                    break;
                }
                textareaCount++;
            } else if (child.classList.contains('criterion-label-container')) {
                // We've hit the next category row, stop searching
                break;
            }
        }
        
        // Remove the target textarea if found
        if (targetTextarea) {
            console.log(`Removing textarea at row ${rowIndex}, column ${promptIndex}`);
            targetTextarea.remove();
        } else {
            console.warn(`Could not find textarea at row ${rowIndex}, column ${promptIndex}`);
        }
    });
    
    // Remove the prompt column header
    promptColumn.remove();
    promptCounter--;
    
    // Update grid columns after deletion
    updateGridColumns();
    
    // Update category rows to refresh criterion labels
    updateCategoryRows();
    
    // Update prompt count displays
    updatePromptCounts();
    
    // Show the add button if we're below MAX_PROMPTS
    const addButton = document.querySelector('.add-prompt-button');
    if (addButton && promptCounter < MAX_PROMPTS) {
        addButton.style.display = 'flex';
    }
    
    // Auto-resize textareas after deleting prompt
    setTimeout(autoResizeTextareasInRows, 10);
    
    console.log(`Successfully deleted prompt column at index ${promptIndex}`);
}

// Delete category row
function deleteCategory(button) {
    // Play click sound
    playClickSound();
    
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
    
    // Auto-resize textareas after deleting category
    setTimeout(autoResizeTextareasInRows, 10);
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
    
    // Reset criterion labels to empty (no hardcoded defaults)
    criterionLabels = ['', '', '', ''];
    console.log('DEBUG: Reset criterion labels to empty in initializeDefaultState');
    
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
    
    // Update grid columns
    updateGridColumns();
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

// Show instructions popup
function showInstructionsPopup() {
    // Play click sound
    playClickSound();
    
    // Remove any existing popup
    const existingPopup = document.getElementById('instructions-popup');
    if (existingPopup) {
        existingPopup.remove();
    }
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'instructions-popup';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.85);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        font-family: 'VT323', monospace;
    `;
    
    // Create dialog
    const dialog = document.createElement('div');
    dialog.style.cssText = `
        background-color: var(--background-color);
        border: 3px solid var(--primary-color);
        border-radius: 8px;
        padding: 0;
        color: var(--primary-color);
        max-width: 600px;
        max-height: 80vh;
        width: 90%;
        box-shadow: 0 0 30px var(--primary-shadow);
        display: flex;
        flex-direction: column;
        overflow: hidden;
    `;
    
    // Create header
    const header = document.createElement('div');
    header.style.cssText = `
        padding: 20px;
        border-bottom: 2px solid var(--primary-color);
        font-size: 24px;
        font-weight: bold;
        text-align: center;
        text-transform: uppercase;
        letter-spacing: 2px;
        color: var(--primary-color);
    `;
    header.textContent = 'Help & Instructions';
    
    // Create scrollable content area
    const content = document.createElement('div');
    content.style.cssText = `
        padding: 20px;
        overflow-y: auto;
        overflow-x: hidden;
        flex: 1;
        font-size: 16px;
        line-height: 1.8;
    `;
    
    // Add scrollbar styling
    const style = document.createElement('style');
    style.textContent = `
        #instructions-popup-content::-webkit-scrollbar {
            width: 10px;
        }
        #instructions-popup-content::-webkit-scrollbar-track {
            background: var(--background-color);
        }
        #instructions-popup-content::-webkit-scrollbar-thumb {
            background: var(--primary-color);
            border-radius: 5px;
        }
        #instructions-popup-content::-webkit-scrollbar-thumb:hover {
            background: var(--primary-hover);
        }
    `;
    content.id = 'instructions-popup-content';
    document.head.appendChild(style);
    
    // Add content sections
    content.innerHTML = `
        <div style="margin-bottom: 25px;">
            <strong style="color: var(--primary-hover); font-size: 18px;">Quick Start:</strong>
            <ul style="margin: 10px 0; padding-left: 25px; color: var(--primary-color);">
                <li style="margin: 8px 0;">Try the "Sample" activity first (loaded automatically)</li>
                <li style="margin: 8px 0;">Click "Add Prompt" to create prompt columns</li>
                <li style="margin: 8px 0;">Click "Add Category" to create category rows</li>
                <li style="margin: 8px 0;">Fill in options for each category</li>
                <li style="margin: 8px 0;">Set your objective at the top</li>
                <li style="margin: 8px 0;">Click "START PROMPTING" to test</li>
            </ul>
        </div>
        
        <div style="margin-bottom: 25px;">
            <strong style="color: var(--primary-hover); font-size: 18px;">Keyboard Controls (Prompting):</strong>
            <ul style="margin: 10px 0; padding-left: 25px; color: var(--primary-color);">
                <li style="margin: 8px 0;"><strong>↑ or Enter</strong> : Generate prompts (name required)</li>
                <li style="margin: 8px 0;"><strong>↓</strong> : Clear / insert student name</li>
                <li style="margin: 8px 0;"><strong>← →</strong> : Navigate between students</li>
            </ul>
        </div>
        
        <div style="margin-bottom: 25px;">
            <strong style="color: var(--primary-hover); font-size: 18px;">Understanding the Grid:</strong>
            <ul style="margin: 10px 0; padding-left: 25px; color: var(--primary-color);">
                <li style="margin: 8px 0;"><strong>Columns</strong> = Different prompt types or characteristics</li>
                <li style="margin: 8px 0;"><strong>Rows (A, B, C, D)</strong> = Categories that work together</li>
                <li style="margin: 8px 0;">Each student gets one prompt from the same category (row)</li>
                <li style="margin: 8px 0;">Example: Row A might be "Elementary level", Row B "Advanced level"</li>
            </ul>
        </div>
        
        <div style="margin-bottom: 25px;">
            <strong style="color: var(--primary-hover); font-size: 18px;">Tips & Best Practices:</strong>
            <ul style="margin: 10px 0; padding-left: 25px; color: var(--primary-color);">
                <li style="margin: 8px 0;">Save your activities to reuse them later</li>
                <li style="margin: 8px 0;">Share activities with colleagues via CSV export</li>
                <li style="margin: 8px 0;">Use clear, specific options in each category</li>
                <li style="margin: 8px 0;">Test your activity before using with students</li>
                <li style="margin: 8px 0;">The app prevents repetition automatically</li>
            </ul>
        </div>
        
        <div style="margin-bottom: 25px;">
            <strong style="color: var(--primary-hover); font-size: 18px;">Activity Management:</strong>
            <ul style="margin: 10px 0; padding-left: 25px; color: var(--primary-color);">
                <li style="margin: 8px 0;"><strong>NEW</strong> : Start a fresh activity</li>
                <li style="margin: 8px 0;"><strong>SAVE</strong> : Save changes to current activity</li>
                <li style="margin: 8px 0;"><strong>SAVE AS</strong> : Save as a new activity</li>
                <li style="margin: 8px 0;"><strong>SHARE</strong> : Export activity as CSV file</li>
                <li style="margin: 8px 0;"><strong>LOAD</strong> : Import activity from CSV file</li>
            </ul>
        </div>
    `;
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'CLOSE';
    closeButton.style.cssText = `
        margin: 20px;
        padding: 12px 24px;
        background-color: var(--background-color);
        color: var(--primary-color);
        border: 2px solid var(--primary-color);
        border-radius: 4px;
        cursor: pointer;
        font-family: 'VT323', monospace;
        font-size: 18px;
        font-weight: bold;
        text-transform: uppercase;
        transition: all 0.3s ease;
        align-self: center;
    `;
    closeButton.onmouseover = () => {
        closeButton.style.backgroundColor = 'var(--primary-color)';
        closeButton.style.color = 'var(--background-color)';
    };
    closeButton.onmouseout = () => {
        closeButton.style.backgroundColor = 'var(--background-color)';
        closeButton.style.color = 'var(--primary-color)';
    };
    closeButton.onclick = () => {
        playClickSound();
        document.body.removeChild(overlay);
        document.head.removeChild(style);
    };
    
    // Close on overlay click (outside dialog)
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
            document.head.removeChild(style);
        }
    };
    
    // Assemble dialog
    dialog.appendChild(header);
    dialog.appendChild(content);
    dialog.appendChild(closeButton);
    overlay.appendChild(dialog);
    
    // Add to page
    document.body.appendChild(overlay);
}

// Show copyright popup
function showCopyrightPopup() {
    // Play click sound
    playClickSound();
    // Remove any existing popup
    const existingPopup = document.getElementById('copyright-popup');
    if (existingPopup) {
        existingPopup.remove();
    }
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'copyright-popup';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.85);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        font-family: 'VT323', monospace;
    `;
    
    // Create dialog
    const dialog = document.createElement('div');
    dialog.style.cssText = `
        background-color: var(--background-color);
        border: 3px solid var(--primary-color);
        border-radius: 8px;
        padding: 0;
        color: var(--primary-color);
        max-width: 700px;
        max-height: 80vh;
        width: 90%;
        box-shadow: 0 0 30px var(--primary-shadow);
        display: flex;
        flex-direction: column;
        overflow: hidden;
    `;
    
    // Create header
    const header = document.createElement('div');
    header.style.cssText = `
        padding: 20px;
        border-bottom: 2px solid var(--primary-color);
        font-size: 24px;
        font-weight: bold;
        text-align: center;
        text-transform: uppercase;
        letter-spacing: 2px;
        color: var(--primary-color);
    `;
    header.textContent = 'Copyright & Attribution';
    
    // Create scrollable content area
    const content = document.createElement('div');
    content.style.cssText = `
        padding: 20px;
        overflow-y: auto;
        overflow-x: hidden;
        flex: 1;
        font-size: 16px;
        line-height: 1.8;
    `;
    
    // Add scrollbar styling
    const style = document.createElement('style');
    style.textContent = `
        #copyright-popup-content::-webkit-scrollbar {
            width: 10px;
        }
        #copyright-popup-content::-webkit-scrollbar-track {
            background: var(--background-color);
        }
        #copyright-popup-content::-webkit-scrollbar-thumb {
            background: var(--primary-color);
            border-radius: 5px;
        }
        #copyright-popup-content::-webkit-scrollbar-thumb:hover {
            background: var(--primary-hover);
        }
    `;
    content.id = 'copyright-popup-content';
    document.head.appendChild(style);
    
    // Add content
    content.innerHTML = `
        <div style="margin-bottom: 25px;">
            <strong style="color: var(--primary-hover); font-size: 18px;">PromptMe App</strong>
            <p style="margin-top: 10px;">Copyright © 2025 by <strong>Alec Mathewson</strong></p>
            <p>This work is licensed under a <a href="http://creativecommons.org/licenses/by/4.0/" target="_blank" style="color: var(--primary-color);">Creative Commons Attribution 4.0 International License</a>.</p>
            <p style="margin-top: 10px;">You are free to share and adapt this work, with appropriate attribution.</p>
        </div>
        
        <div style="margin-bottom: 25px;">
            <strong style="color: var(--primary-hover); font-size: 18px;">Third-Party Components</strong>
            
            <div style="margin: 15px 0; padding: 15px; background-color: rgba(76, 175, 80, 0.1); border-left: 4px solid var(--primary-color);">
                <strong>VT323 Font (Retro Terminal Font)</strong><br>
                Source: Google Fonts | Designer: Peter Hull<br>
                License: SIL Open Font License (OFL)<br>
                <a href="https://fonts.google.com/specimen/VT323" target="_blank" style="color: var(--primary-color);">https://fonts.google.com/specimen/VT323</a><br><br>
                <em>Provides the distinctive retro computer terminal aesthetic throughout the application.</em>
            </div>
            
            <div style="margin: 15px 0; padding: 15px; background-color: rgba(76, 175, 80, 0.1); border-left: 4px solid var(--primary-color);">
                <strong>p5.js Library (Animation & Graphics)</strong><br>
                Source: p5.js Foundation | Version: 1.4.0<br>
                License: LGPL 2.1<br>
                <a href="https://p5js.org/" target="_blank" style="color: var(--primary-color);">https://p5js.org/</a><br><br>
                Attribution: This application uses p5.js, a JavaScript library for creative coding, developed by the p5.js Foundation and community.<br><br>
                <em>The scrambling and revealing animations in the prompting interface are powered by p5.js.</em>
            </div>
            
            <div style="margin: 15px 0; padding: 15px; background-color: rgba(76, 175, 80, 0.1); border-left: 4px solid var(--primary-color);">
                <strong>Helvetica Font Family</strong><br>
                Source: Adobe Systems / Linotype<br>
                License: Proprietary (Commercial License Required)<br><br>
                <em>Note: Helvetica fonts in assets folder are proprietary. Commercial use requires proper licensing.</em>
            </div>
        </div>
        
        <div style="margin-bottom: 25px;">
            <strong style="color: var(--primary-hover); font-size: 18px;">Retro Design & Animation Style</strong>
            <p style="margin-top: 10px;">The retro terminal aesthetic, including:</p>
            <ul style="margin: 10px 0; padding-left: 25px;">
                <li>Terminal-style green-on-black color scheme</li>
                <li>Scrambling and revealing text animations</li>
                <li>Monospace font styling (VT323)</li>
                <li>Retro computer interface design elements</li>
            </ul>
            <p style="margin-top: 10px;">These design elements are part of the PromptMe App by Alec Mathewson and are licensed under Creative Commons Attribution 4.0 International License.</p>
        </div>
    `;
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'CLOSE';
    closeButton.style.cssText = `
        margin: 20px;
        padding: 12px 24px;
        background-color: var(--background-color);
        color: var(--primary-color);
        border: 2px solid var(--primary-color);
        border-radius: 4px;
        cursor: pointer;
        font-family: 'VT323', monospace;
        font-size: 18px;
        font-weight: bold;
        text-transform: uppercase;
        transition: all 0.3s ease;
        align-self: center;
    `;
    closeButton.onmouseover = () => {
        closeButton.style.backgroundColor = 'var(--primary-color)';
        closeButton.style.color = 'var(--background-color)';
    };
    closeButton.onmouseout = () => {
        closeButton.style.backgroundColor = 'var(--background-color)';
        closeButton.style.color = 'var(--primary-color)';
    };
    closeButton.onclick = () => {
        playClickSound();
        document.body.removeChild(overlay);
        document.head.removeChild(style);
    };
    
    // Close on overlay click (outside dialog)
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
            document.head.removeChild(style);
        }
    };
    
    // Assemble dialog
    dialog.appendChild(header);
    dialog.appendChild(content);
    dialog.appendChild(closeButton);
    overlay.appendChild(dialog);
    
    // Add to page
    document.body.appendChild(overlay);
}

// Global audio context for editor (created once and reused)
let editorAudioCtx = null;

// Initialize audio context on first user interaction
function initEditorAudio() {
    if (!editorAudioCtx) {
        try {
            editorAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Audio context not available:', e);
        }
    }
    // Resume audio context if suspended (required by browser autoplay policies)
    if (editorAudioCtx && editorAudioCtx.state === 'suspended') {
        editorAudioCtx.resume().catch(e => {
            console.log('Could not resume audio context:', e);
        });
    }
}

// Simple playSound function for editor (doesn't require p5.js audio context)
function playSoundEditor(soundConfig) {
    try {
        // Initialize audio on first use
        initEditorAudio();
        
        if (!editorAudioCtx) {
            return; // Audio not available
        }
        
        const oscillator = editorAudioCtx.createOscillator();
        const gainNode = editorAudioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(editorAudioCtx.destination);
        
        // Set oscillator type for Mac SE-style "pop" (square wave gives that distinctive tick)
        oscillator.type = soundConfig.TYPE || 'square';
        oscillator.frequency.value = soundConfig.FREQUENCY;
        
        // Create envelope for Mac SE-style click: sharp attack, quick decay
        const now = editorAudioCtx.currentTime;
        const attackTime = 0.001; // 1ms attack (very sharp)
        const decayTime = soundConfig.DURATION / 1000; // Duration in seconds
        const maxVolume = soundConfig.VOLUME || 0.05; // Slightly louder for that "pop"
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(maxVolume, now + attackTime);
        gainNode.gain.linearRampToValueAtTime(0, now + decayTime);
        
        oscillator.start(now);
        oscillator.stop(now + decayTime);
    } catch (e) {
        // Silently fail if audio context not available
        console.log('Audio not available:', e);
    }
}

// Helper function to play Mac SE-style click sound for buttons
function playClickSound() {
    // Mac SE click characteristics: ~550Hz, 12ms duration, square wave for "pop"
    playSoundEditor({ 
        FREQUENCY: 550, 
        DURATION: 12, 
        TYPE: 'square',
        VOLUME: 0.05 
    });
}

// Toggle settings panel visibility
function toggleSettingsPanel() {
    const panel = document.getElementById('settings-panel');
    const toggle = document.getElementById('settings-panel-toggle');
    
    // Play click sound
    playClickSound();
    
    if (panel.style.display === 'none') {
        panel.style.display = 'block';
        toggle.innerHTML = '☰';
    } else {
        panel.style.display = 'none';
        toggle.innerHTML = '☰';
    }
}

// Export functions for use in other files
window.playClickSound = playClickSound;
window.initEditorAudio = initEditorAudio;

// Make functions globally available
window.addNewPrompt = addNewPrompt;
window.addNewCategory = addNewCategory;
window.deletePrompt = deletePrompt;
window.deleteCategory = deleteCategory;
window.togglePromptingTips = togglePromptingTips;
window.showInstructionsPopup = showInstructionsPopup;
window.showCopyrightPopup = showCopyrightPopup;
window.toggleSettingsPanel = toggleSettingsPanel;
window.updateGridColumns = updateGridColumns;
window.updateCriterionLabel = updateCriterionLabel;
window.criterionLabels = criterionLabels;
window.initializeDefaultContent = initializeDefaultContent;
window.clearAllFields = clearAllFields;
window.updateCategoryRows = updateCategoryRows;
window.updatePromptCounts = updatePromptCounts;
window.updateColumnCounts = updateColumnCounts;
window.createAddButtons = createAddButtons;
window.initializeDefaultState = initializeDefaultState;
window.autoResizeTextareasInRows = autoResizeTextareasInRows;

// Attach event listeners to all existing textareas
function attachTextareaEventListeners() {
    const textareas = document.querySelectorAll('.textarea-container textarea');
    textareas.forEach(textarea => {
        // Remove existing listeners to avoid duplicates
        const newTextarea = textarea.cloneNode(true);
        textarea.parentNode.replaceChild(newTextarea, textarea);
        
        // Add event listener for auto-resizing
        newTextarea.addEventListener('input', () => {
            setTimeout(autoResizeTextareasInRows, 10);
        });
    });
    
    // Initial resize after attaching listeners
    setTimeout(autoResizeTextareasInRows, 10);
}

window.attachTextareaEventListeners = attachTextareaEventListeners;
