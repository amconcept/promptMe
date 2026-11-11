// Editor UI Manager - Handles all UI elements and interactions
// Responsible for: Prompt/category management, button states, form interactions

// Global UI state
let categoryCounter = 0;
let promptCounter = 0;
const MAX_CATEGORIES = 6;
const MAX_PROMPTS = 4;

// Criterion labels for grouping rows (user-facing: grouping)
let criterionLabels = ['', '', '', '']; // Start with empty labels - no hardcoded defaults

function groupingRowCount() {
    return document.querySelectorAll('.criterion-label-input').length;
}

/** D-063: the switch only appears once there are two grouping rows to choose between. */
function syncGroupingSelectRow(opts) {
    const row = document.getElementById('grouping-select-row');
    const box = document.getElementById('prompt1-interests-mode');
    if (!row || !box) return;
    const show = groupingRowCount() >= 2;
    row.classList.toggle('is-available', show);
    row.hidden = !show;
    if (!show && box.checked) {
        box.checked = false;
        if (!(opts && opts.skipSave) && typeof window.autoSaveToLocalStorage === 'function') {
            window.autoSaveToLocalStorage();
        }
    }
}
window.syncGroupingSelectRow = syncGroupingSelectRow;

// D-071: measure off-screen. Setting the live box to height:auto collapses it
// and the page jumps to the top of the list while the teacher is typing at the bottom.
function measureTextareaContentHeight(textarea) {
    const cs = window.getComputedStyle(textarea);
    const probe = document.createElement('textarea');
    probe.value = textarea.value;
    probe.rows = 1;
    probe.setAttribute('aria-hidden', 'true');
    probe.tabIndex = -1;
    probe.style.cssText = [
        'position:absolute',
        'left:-9999px',
        'top:0',
        'height:auto',
        'min-height:0',
        'overflow:hidden',
        'visibility:hidden',
        'pointer-events:none',
        'box-sizing:' + cs.boxSizing,
        'width:' + textarea.clientWidth + 'px',
        'padding:' + cs.padding,
        'border-width:' + cs.borderWidth,
        'border-style:' + cs.borderStyle,
        'font:' + cs.font,
        'line-height:' + cs.lineHeight,
        'letter-spacing:' + cs.letterSpacing
    ].join(';');
    document.body.appendChild(probe);
    const height = probe.scrollHeight;
    probe.remove();
    return height;
}

// Auto-resize textareas in each row to match the tallest one
function autoResizeTextareasInRows() {
    const textareas = document.querySelectorAll('.textarea-container textarea');
    const promptCount = document.querySelectorAll('.header-input').length;
    
    if (textareas.length === 0 || promptCount === 0) {
        return;
    }

    const scroller = document.scrollingElement || document.documentElement;
    const scrollY = scroller.scrollTop;
    
    const rowCount = Math.ceil(textareas.length / promptCount);
    
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
        let maxHeight = 100;
        
        for (let colIndex = 0; colIndex < promptCount; colIndex++) {
            const textarea = textareas[rowIndex * promptCount + colIndex];
            if (textarea) {
                maxHeight = Math.max(maxHeight, measureTextareaContentHeight(textarea));
            }
        }
        
        for (let colIndex = 0; colIndex < promptCount; colIndex++) {
            const textarea = textareas[rowIndex * promptCount + colIndex];
            if (textarea) {
                textarea.style.height = maxHeight + 'px';
            }
        }
    }

    scroller.scrollTop = scrollY;
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
    if (typeof refreshPromptCube === 'function') refreshPromptCube();
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
        textarea.placeholder = 'one per line, or drop PNG/JPG';
        
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
        alert(`Maximum of ${MAX_CATEGORIES} groupings reached`);
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
    criterionInput.placeholder = 'Enter grouping label';
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
        textarea.placeholder = 'one per line, or drop PNG/JPG';
        
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
    if (typeof refreshPromptCube === 'function') refreshPromptCube();
    if (typeof window.syncGroupingSelectRow === 'function') window.syncGroupingSelectRow();
    
    console.log('addNewCategory completed successfully');
}

// Delete prompt column by index (used by prompt cube)
function deletePromptAt(promptIndex) {
    const promptColumns = document.querySelectorAll('.prompt-column');
    if (promptColumns.length <= 1) return;
    if (promptIndex < 0 || promptIndex >= promptColumns.length) return;

    playClickSound();
    removePromptColumnAtIndex(promptIndex);
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

    removePromptColumnAtIndex(promptIndex);
}

function removePromptColumnAtIndex(promptIndex) {
    const promptColumns = document.querySelectorAll('.prompt-column');
    const promptColumn = promptColumns[promptIndex];
    if (!promptColumn) return;
    
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
    if (typeof refreshPromptCube === 'function') refreshPromptCube();
    
    console.log(`Successfully deleted prompt column at index ${promptIndex}`);
}

// Delete category row by index (used by prompt cube)
function deleteCategoryAt(rowIndex) {
    const allCriterionLabels = document.querySelectorAll('.criterion-label-container');
    if (allCriterionLabels.length <= 1) return;
    if (rowIndex < 0 || rowIndex >= allCriterionLabels.length) return;
    playClickSound();
    removeCategoryAtIndex(rowIndex);
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
    removeCategoryAtIndex(rowIndex);
}

function removeCategoryAtIndex(rowIndex) {
    const allCriterionLabels = document.querySelectorAll('.criterion-label-container');
    const criterionLabelContainer = allCriterionLabels[rowIndex];
    if (!criterionLabelContainer) return;

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
    if (typeof refreshPromptCube === 'function') refreshPromptCube();
    if (typeof window.syncGroupingSelectRow === 'function') window.syncGroupingSelectRow();
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
            if (textarea) {
                const items = (typeof getPromptLinesFromTextarea === 'function')
                    ? getPromptLinesFromTextarea(textarea)
                    : textarea.value.split('\n').map((item) => item.trim()).filter((item) => item.length > 0);
                totalItems += items.length;
            }
        }
        
        // Add count as title attribute (tooltip on hover) - that's it
        header.setAttribute('title', `${totalItems} possible selections`);
    });
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
    
    // D-063: empty start is one grouping, so the pick-grouping switch stays hidden
    if (typeof window.syncGroupingSelectRow === 'function') {
        window.syncGroupingSelectRow({ skipSave: true });
    }
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
        line-height: 1.4;
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
    
    // D-066: short teacher path — run, edit, save. Same facts as the walkthrough.
    content.innerHTML = `
        <div style="margin-bottom: 16px;">
            <strong style="color: var(--primary-hover); font-size: 18px;">Run</strong>
            <ol style="margin: 8px 0 0; padding-left: 22px; color: var(--primary-color);">
                <li style="margin: 6px 0;">Open <strong>...</strong> (top right) and click <strong>SIMPLE</strong>, <strong>SOD+A</strong>, or <strong>SOD+A w/ Groupings</strong>.</li>
                <li style="margin: 6px 0;"><strong>START PROMPTING</strong>.</li>
                <li style="margin: 6px 0;"><strong>RUN</strong> — draw one combination.</li>
                <li style="margin: 6px 0;"><strong>GO TO NEXT</strong> — keep that result and start the next student. Those options stay out until the list is used up.</li>
                <li style="margin: 6px 0;"><strong>RE-RUN</strong> — same student, new draw. Those options go back in.</li>
            </ol>
            <p style="margin: 8px 0 0; color: var(--primary-color);">On <strong>SOD+A w/ Groupings</strong>, tap <strong>physical</strong>, <strong>digital</strong>, or <strong>textiles</strong> first.</p>
        </div>
        <div style="margin-bottom: 16px;">
            <strong style="color: var(--primary-hover); font-size: 18px;">Edit</strong>
            <p style="margin: 8px 0 0; color: var(--primary-color);">Change any line to match your school. Add or delete lines. That is now your version.</p>
        </div>
        <div style="margin-bottom: 16px;">
            <strong style="color: var(--primary-hover); font-size: 18px;">Save</strong>
            <ul style="margin: 8px 0 0; padding-left: 22px; color: var(--primary-color);">
                <li style="margin: 6px 0;">This browser remembers what you type.</li>
                <li style="margin: 6px 0;"><strong>FILE → Save</strong> writes it onto that session name.</li>
                <li style="margin: 6px 0;"><strong>FILE → Share</strong> downloads a backup. Load that file on another computer.</li>
                <li style="margin: 6px 0;">Clearing this browser’s data erases sessions unless you have that file.</li>
            </ul>
        </div>
        <button type="button" id="help-replay-tour" style="font-family: VT323, monospace; font-size: 16px; padding: 8px 14px; border: 2px solid var(--primary-color); background: var(--background-color); color: var(--primary-color); border-radius: 4px; cursor: pointer;">Replay walkthrough</button>
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
    
    const replayBtn = content.querySelector('#help-replay-tour');
    if (replayBtn) {
        replayBtn.onclick = () => {
            playClickSound();
            if (overlay.parentNode) overlay.remove();
            if (style.parentNode) style.remove();
            if (typeof window.startEditorTour === 'function') {
                window.startEditorTour({ force: true });
            }
        };
    }

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

// Same as sketch: use button text for icon (Unicode escapes avoid encoding issues)
var SETTINGS_TOGGLE_MENU = '...'; // overflow menu (standard UI convention)

function updateSettingsToggleIcon() {
    var toggle = document.getElementById('settings-panel-toggle');
    var panel = document.getElementById('settings-panel');
    if (!toggle || !panel) return;
    toggle.textContent = SETTINGS_TOGGLE_MENU;
    const isOpen = panel.classList.contains('open') || panel.style.display === 'block';
    toggle.classList.toggle('panel-open', isOpen);
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
}

// Ignore outside-close after open (mobile ghost-clicks often land ~300–600ms later)
let _overflowMenuIgnoreOutsideUntil = 0;
let _overflowMenuToggleLockUntil = 0;

// Toggle overflow menu (... top-right)
function toggleSettingsPanel(event) {
    if (event) {
        try {
            event.preventDefault();
            event.stopPropagation();
        } catch (err) { /* optional */ }
    }

    // Prevent open+close from double-bound handlers or stacked click/pointer events
    const now = Date.now();
    if (now < _overflowMenuToggleLockUntil) return;
    _overflowMenuToggleLockUntil = now + 320;

    const panel = document.getElementById('settings-panel');
    if (!panel) return;

    try { playClickSound(); } catch (e) { /* audio optional */ }

    const willOpen = !panel.classList.contains('open');
    panel.classList.toggle('open', willOpen);
    panel.style.display = willOpen ? 'block' : 'none';
    updateSettingsToggleIcon();

    if (willOpen) {
        // Long enough to absorb iOS/Android ghost taps after the opening gesture
        _overflowMenuIgnoreOutsideUntil = Date.now() + 900;
        if (typeof closeFileMenuDropdown === 'function') closeFileMenuDropdown();
        if (typeof closeThemeMenuDropdown === 'function') closeThemeMenuDropdown();
    }
}

function closeSettingsPanel() {
    const panel = document.getElementById('settings-panel');
    if (!panel) return;
    panel.classList.remove('open');
    panel.style.display = 'none';
    updateSettingsToggleIcon();
}

// Wire ... toggle + close overflow menu on outside pointer / Escape
(function initOverflowMenu() {
    function isOverflowUiTarget(target) {
        const panel = document.getElementById('settings-panel');
        const toggle = document.getElementById('settings-panel-toggle');
        if (!target || !target.closest) return false;
        if (toggle && (toggle === target || toggle.contains(target))) return true;
        if (panel && (panel === target || panel.contains(target))) return true;
        return false;
    }

    function onDocPointerDown(e) {
        const panel = document.getElementById('settings-panel');
        if (!panel || !panel.classList.contains('open')) return;
        if (Date.now() < _overflowMenuIgnoreOutsideUntil) return;
        if (isOverflowUiTarget(e.target)) return;
        closeSettingsPanel();
    }

    function onKey(e) {
        if (e.key === 'Escape') closeSettingsPanel();
    }

    function bind() {
        const toggle = document.getElementById('settings-panel-toggle');
        if (toggle && toggle.dataset.bound !== '1') {
            toggle.dataset.bound = '1';
            // Single click path only — pointerup+click together causes open-then-close
            toggle.addEventListener('click', (e) => {
                toggleSettingsPanel(e);
            });
        }
        // pointerdown only for outside-close (extra document click listener caused ghost closes)
        document.addEventListener('pointerdown', onDocPointerDown, true);
        document.addEventListener('keydown', onKey);
        closeSettingsPanel();
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bind);
    } else {
        bind();
    }
})();

// Export functions for use in other files
window.playClickSound = playClickSound;
window.initEditorAudio = initEditorAudio;

/** Phone/cube: objective is one line the width of the window — no more chars past the edge */
function isPhoneObjectiveLayout() {
    return document.body.classList.contains('editor-cube-layout')
        || (typeof window.matchMedia === 'function'
            && (window.matchMedia('(max-width: 640px)').matches
                || window.matchMedia('(max-width: 900px) and (max-aspect-ratio: 3/4)').matches));
}

// Hidden span for width checks — never mutate the real <input> during key events
// (iOS Safari breaks caret/IME if value is rewritten mid-keystroke).
let _objectiveMirror = null;
function getObjectiveMirror(input) {
    if (!_objectiveMirror) {
        _objectiveMirror = document.createElement('span');
        _objectiveMirror.setAttribute('aria-hidden', 'true');
        _objectiveMirror.style.cssText = [
            'position:absolute',
            'left:-99999px',
            'top:0',
            'visibility:hidden',
            'pointer-events:none',
            'white-space:pre',
            'display:inline-block'
        ].join(';');
        document.body.appendChild(_objectiveMirror);
    }
    const style = window.getComputedStyle(input);
    _objectiveMirror.style.font = style.font;
    _objectiveMirror.style.fontSize = style.fontSize;
    _objectiveMirror.style.fontFamily = style.fontFamily;
    _objectiveMirror.style.fontWeight = style.fontWeight;
    _objectiveMirror.style.fontStyle = style.fontStyle;
    _objectiveMirror.style.letterSpacing = style.letterSpacing;
    _objectiveMirror.style.textTransform = style.textTransform;
    _objectiveMirror.style.padding = '0';
    _objectiveMirror.style.border = '0';
    return _objectiveMirror;
}

function measureObjectiveTextWidth(text, input) {
    const mirror = getObjectiveMirror(input);
    // Use non-breaking space so empty string still has a measurable box
    mirror.textContent = (text == null || text === '') ? '' : String(text);
    return mirror.offsetWidth;
}

function objectiveTextFits(input, text) {
    const maxW = input.clientWidth || input.getBoundingClientRect().width;
    if (!maxW) return true; // not laid out yet — never block typing
    return measureObjectiveTextWidth(text, input) <= maxW + 1;
}

function fitObjectiveToWidth(value, input) {
    const maxW = input.clientWidth || input.getBoundingClientRect().width;
    if (!maxW) return value;
    let v = value || '';
    if (objectiveTextFits(input, v)) return v;
    let lo = 0;
    let hi = v.length;
    while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        if (objectiveTextFits(input, v.slice(0, mid))) lo = mid;
        else hi = mid - 1;
    }
    return v.slice(0, lo);
}

function enforceObjectiveWidthLimit() {
    // D-068: do not slice the objective to the phone field's width.
    // That cut used to land in the saved sentence, so the card dropped the ending
    // ("…and make" instead of "…and make an object that…"). The field can scroll;
    // the leftover card wraps (D-061).
}

function bindObjectiveWidthLimit() {
    const input = document.getElementById('objective-input');
    if (!input || input.dataset.widthLimitBound === '1') return;
    input.dataset.widthLimitBound = '1';

    // Soft limit: trim after input. Avoid keydown/beforeinput preventDefault —
    // those (plus rewriting input.value to measure) break iPhone keyboards.
    input.addEventListener('input', (e) => {
        if (e.isComposing) return;
        enforceObjectiveWidthLimit();
    });

    input.addEventListener('compositionend', () => {
        enforceObjectiveWidthLimit();
    });

    input.addEventListener('paste', () => {
        setTimeout(enforceObjectiveWidthLimit, 0);
    });

    window.addEventListener('resize', () => {
        enforceObjectiveWidthLimit();
    });

    setTimeout(enforceObjectiveWidthLimit, 0);
}

// D-066: three-step walkthrough. A run is one randomized draw of prompts.
const EDITOR_TOUR_SEEN_KEY = 'randoCalrissianTourSeen';
const EDITOR_TOUR_STEPS = [
    {
        title: 'Pick a session',
        body: [
            'Open ... (top right). Activity History has three sessions: SIMPLE, SOD+A, and SOD+A w/ Groupings. Click one.'
        ]
    },
    {
        title: 'Edit',
        body: [
            'Change any line to match your school. Add or delete lines. FILE → Save writes it onto that session name.'
        ]
    },
    {
        title: 'Run',
        body: [
            'START PROMPTING. RUN draws one combination. GO TO NEXT keeps that result and starts the next student. RE-RUN is a new draw for the same student.'
        ]
    }
];

function editorTourIsCube() {
    return document.body.classList.contains('editor-cube-layout');
}

function editorTourEls(list) {
    return (list || []).filter(Boolean).map(function (el) { return { els: [el] }; });
}

/** Each grouping row is letter + that row's list boxes (not the INCLUDES/USES headings). */
function editorTourGroupingRows() {
    const kids = Array.from(document.querySelectorAll('#categories-container > *'));
    const promptCount = document.querySelectorAll('.header-input').length;
    const stride = 1 + promptCount;
    const rows = [];
    for (let i = 0; i < kids.length; i += stride) {
        const slice = kids.slice(i, i + stride);
        if (slice.length) rows.push({ els: slice });
    }
    return rows;
}

function editorTourTargets(stepIndex) {
    const cube = editorTourIsCube();
    if (stepIndex === 0) {
        return editorTourEls([
            document.getElementById('settings-panel-toggle'),
            document.getElementById('file-menu-dropdown'),
            document.getElementById('settings-list')
        ]);
    }
    if (stepIndex === 1) {
        if (cube) {
            return [{
                els: [
                    document.getElementById('cube-prompt-header'),
                    document.querySelector('.cube-prompt-box') || document.getElementById('cube-prompts')
                ]
            }];
        }
        const header = document.querySelector('.prompt-headers .prompt-column') || document.querySelector('.header-input');
        const boxes = Array.from(document.querySelectorAll('.prompt-grid .textarea-container'));
        return [{ els: [header].concat(boxes).filter(Boolean) }];
    }
    if (stepIndex === 2) {
        return editorTourEls([
            cube ? document.querySelector('.cube-run') : document.querySelector('.start-prompting')
        ]);
    }
    return [];
}

let _editorTourStep = 0;
let _editorTourNodes = null;

function editorTourEnsureStyle() {
    if (document.getElementById('editor-tour-style')) return;
    const style = document.createElement('style');
    style.id = 'editor-tour-style';
    style.textContent = [
        '#editor-tour-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.72);z-index:10040;}',
        '.tour-highlight-frame{position:fixed;border:3px solid var(--primary-color);border-radius:6px;box-shadow:0 0 16px var(--primary-color);z-index:10041;pointer-events:none;}',
        '#editor-tour-card{position:fixed;z-index:10042;max-width:min(440px,calc(100vw - 32px));background:var(--background-color);color:var(--primary-color);border:3px solid var(--primary-color);border-radius:8px;padding:16px 18px 14px;font-family:VT323,monospace;box-shadow:0 8px 28px rgba(0,0,0,0.45);}',
        '#editor-tour-card h2{margin:0 0 10px;font-size:22px;font-weight:normal;color:var(--primary-hover);}',
        '#editor-tour-card p{margin:0 0 10px;font-size:18px;line-height:1.35;}',
        '#editor-tour-card p:last-of-type{margin-bottom:14px;}',
        '#editor-tour-actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center;}',
        '#editor-tour-actions button{font-family:VT323,monospace;font-size:16px;padding:8px 14px;border-radius:4px;cursor:pointer;border:2px solid var(--primary-color);background:var(--background-color);color:var(--primary-color);-webkit-text-fill-color:var(--primary-color);}',
        '#editor-tour-next{background:var(--primary-color);color:var(--background-color);-webkit-text-fill-color:var(--background-color);}',
        '#editor-tour-skip{margin-left:auto;opacity:0.9;}'
    ].join('');
    document.head.appendChild(style);
}

function editorTourClearSpotlights() {
    document.querySelectorAll('.tour-highlight-frame').forEach(function (el) {
        el.remove();
    });
}

function editorTourGroupEls(group) {
    if (!group) return [];
    if (group.els) return group.els.filter(Boolean);
    return group.getBoundingClientRect ? [group] : [];
}

function editorTourUnionRect(els) {
    let minL = Infinity;
    let minT = Infinity;
    let maxR = -Infinity;
    let maxB = -Infinity;
    (els || []).forEach(function (el) {
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) return;
        minL = Math.min(minL, r.left);
        minT = Math.min(minT, r.top);
        maxR = Math.max(maxR, r.right);
        maxB = Math.max(maxB, r.bottom);
    });
    if (maxR <= minL || maxB <= minT) return null;
    return { left: minL, top: minT, right: maxR, bottom: maxB };
}

function editorTourDrawHighlights(targets) {
    editorTourClearSpotlights();
    (targets || []).forEach(function (group) {
        const box = editorTourUnionRect(editorTourGroupEls(group));
        if (!box) return;
        const frame = document.createElement('div');
        frame.className = 'tour-highlight-frame';
        frame.style.left = (box.left - 4) + 'px';
        frame.style.top = (box.top - 4) + 'px';
        frame.style.width = (box.right - box.left + 8) + 'px';
        frame.style.height = (box.bottom - box.top + 8) + 'px';
        document.body.appendChild(frame);
    });
}

function editorTourPlaceCard(card, targets) {
    const pad = 12;
    const cardW = card.offsetWidth || 400;
    const cardH = card.offsetHeight || 200;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let top = (vh - cardH) / 2;
    let left = (vw - cardW) / 2;
    const boxes = (targets || []).map(function (group) {
        return editorTourUnionRect(editorTourGroupEls(group));
    }).filter(Boolean);
    if (boxes.length) {
        let minL = Infinity;
        let minT = Infinity;
        let maxR = -Infinity;
        let maxB = -Infinity;
        boxes.forEach(function (box) {
            minL = Math.min(minL, box.left);
            minT = Math.min(minT, box.top);
            maxR = Math.max(maxR, box.right);
            maxB = Math.max(maxB, box.bottom);
        });
        const below = maxB + pad;
        const above = minT - cardH - pad;
        if (below + cardH + pad <= vh) top = below;
        else if (above >= pad) top = above;
        else top = Math.max(pad, Math.min(vh - cardH - pad, minT));
        left = Math.max(pad, Math.min(vw - cardW - pad, minL));
    }
    card.style.top = Math.round(top) + 'px';
    card.style.left = Math.round(left) + 'px';
}

function editorTourShowStep() {
    if (!_editorTourNodes) return;
    const step = EDITOR_TOUR_STEPS[_editorTourStep];
    const card = _editorTourNodes.card;
    const backBtn = _editorTourNodes.backBtn;
    const nextBtn = _editorTourNodes.nextBtn;
    editorTourClearSpotlights();

    const wantsPanel = _editorTourStep === 0;
    const panel = document.getElementById('settings-panel');
    const panelOpen = panel && panel.classList.contains('open');
    if (wantsPanel && !panelOpen && typeof toggleSettingsPanel === 'function') {
        toggleSettingsPanel();
    } else if (!wantsPanel && panelOpen && typeof closeSettingsPanel === 'function') {
        closeSettingsPanel();
    }

    const targets = editorTourTargets(_editorTourStep).filter(Boolean);

    card.querySelector('h2').textContent = step.title;
    const bodyWrap = card.querySelector('.editor-tour-body');
    bodyWrap.innerHTML = '';
    step.body.forEach(function (para) {
        const p = document.createElement('p');
        p.textContent = para;
        bodyWrap.appendChild(p);
    });
    backBtn.style.display = _editorTourStep === 0 ? 'none' : '';
    nextBtn.textContent = _editorTourStep === EDITOR_TOUR_STEPS.length - 1 ? 'Done' : 'Next';
    requestAnimationFrame(function () {
        const live = editorTourTargets(_editorTourStep).filter(Boolean);
        editorTourDrawHighlights(live);
        editorTourPlaceCard(card, live);
    });
}

function editorTourMarkSeen() {
    try { localStorage.setItem(EDITOR_TOUR_SEEN_KEY, '1'); } catch (e) { /* ignore */ }
}

function editorTourCleanup() {
    editorTourClearSpotlights();
    if (typeof closeSettingsPanel === 'function') closeSettingsPanel();
    if (_editorTourNodes) {
        if (_editorTourNodes.overlay && _editorTourNodes.overlay.parentNode) {
            _editorTourNodes.overlay.remove();
        }
        if (_editorTourNodes.card && _editorTourNodes.card.parentNode) {
            _editorTourNodes.card.remove();
        }
        window.removeEventListener('resize', _editorTourNodes.onResize);
        document.removeEventListener('keydown', _editorTourNodes.onKey);
    }
    _editorTourNodes = null;
}

function stopEditorTour() {
    editorTourMarkSeen();
    editorTourCleanup();
}

function startEditorTour(opts) {
    opts = opts || {};
    let seen = false;
    try { seen = localStorage.getItem(EDITOR_TOUR_SEEN_KEY) === '1'; } catch (e) { seen = false; }
    if (seen && !opts.force) return;
    if (_editorTourNodes) editorTourCleanup();

    editorTourEnsureStyle();
    _editorTourStep = 0;

    const overlay = document.createElement('div');
    overlay.id = 'editor-tour-overlay';
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) stopEditorTour();
    });

    const card = document.createElement('div');
    card.id = 'editor-tour-card';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');
    card.innerHTML = [
        '<h2></h2>',
        '<div class="editor-tour-body"></div>',
        '<div id="editor-tour-actions">',
        '<button type="button" id="editor-tour-back">Back</button>',
        '<button type="button" id="editor-tour-next">Next</button>',
        '<button type="button" id="editor-tour-skip">Skip</button>',
        '</div>'
    ].join('');

    const backBtn = card.querySelector('#editor-tour-back');
    const nextBtn = card.querySelector('#editor-tour-next');
    const skipBtn = card.querySelector('#editor-tour-skip');
    backBtn.addEventListener('click', function () {
        if (_editorTourStep > 0) {
            _editorTourStep -= 1;
            editorTourShowStep();
        }
    });
    nextBtn.addEventListener('click', function () {
        if (_editorTourStep >= EDITOR_TOUR_STEPS.length - 1) {
            stopEditorTour();
            return;
        }
        _editorTourStep += 1;
        editorTourShowStep();
    });
    skipBtn.addEventListener('click', stopEditorTour);

    const onResize = function () { editorTourShowStep(); };
    const onKey = function (e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            stopEditorTour();
        } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
            e.preventDefault();
            nextBtn.click();
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            backBtn.click();
        }
    };

    _editorTourNodes = { overlay: overlay, card: card, backBtn: backBtn, nextBtn: nextBtn, onResize: onResize, onKey: onKey };
    document.body.appendChild(overlay);
    document.body.appendChild(card);
    window.addEventListener('resize', onResize);
    document.addEventListener('keydown', onKey);
    editorTourShowStep();
}

window.startEditorTour = startEditorTour;
window.stopEditorTour = stopEditorTour;

// Make functions globally available
window.addNewPrompt = addNewPrompt;
window.addNewCategory = addNewCategory;
window.deletePrompt = deletePrompt;
window.deletePromptAt = deletePromptAt;
window.deleteCategory = deleteCategory;
window.deleteCategoryAt = deleteCategoryAt;
window.closeSettingsPanel = closeSettingsPanel;
window.showInstructionsPopup = showInstructionsPopup;
window.toggleSettingsPanel = toggleSettingsPanel;
window.updateSettingsToggleIcon = updateSettingsToggleIcon;
window.updateGridColumns = updateGridColumns;
window.updateCriterionLabel = updateCriterionLabel;
window.criterionLabels = criterionLabels;
window.initializeDefaultContent = initializeDefaultContent;
window.clearAllFields = clearAllFields;
window.updateCategoryRows = updateCategoryRows;
window.updatePromptCounts = updatePromptCounts;
window.updateColumnCounts = updateColumnCounts;
window.initializeDefaultState = initializeDefaultState;
window.autoResizeTextareasInRows = autoResizeTextareasInRows;
window.enforceObjectiveWidthLimit = enforceObjectiveWidthLimit;
window.bindObjectiveWidthLimit = bindObjectiveWidthLimit;

// Set toggle icon on load (same as sketch: button text, so it renders correctly)
function onEditorUiReady() {
    updateSettingsToggleIcon();
    bindObjectiveWidthLimit();
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onEditorUiReady);
} else {
    onEditorUiReady();
}

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
    if (typeof window.hydrateAllPromptImageFields === 'function') {
        window.hydrateAllPromptImageFields();
    }
    
    // Initial resize after attaching listeners
    setTimeout(autoResizeTextareasInRows, 10);
}

window.attachTextareaEventListeners = attachTextareaEventListeners;
