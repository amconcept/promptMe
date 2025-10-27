// Editor Settings Manager - Handles activity management and settings
// Responsible for: Activity CRUD operations, button states, settings panel

// Global state for activity management
let currentLoadedActivity = null;
let isLoadingActivity = false; // Flag to prevent clearing activity during loading
let lastRunActivity = null; // Remember the last activity that was run

// Function to clear current activity tracking (when starting fresh)
function clearCurrentActivity() {
    currentLoadedActivity = null;
    console.log('Cleared current activity tracking - starting fresh');
    updateActivityStatusIndicator();
    updateButtonStates();
    updateActivityTitle();
}

// Function to update button states (activity status indicator removed)
function updateActivityStatusIndicator() {
    const saveCurrentBtn = document.getElementById('save-current-btn');
    
    // Show/hide the SAVE button
    if (saveCurrentBtn) {
        if (currentLoadedActivity) {
            saveCurrentBtn.style.display = 'inline-block';
            console.log('DEBUG: Showing SAVE button for activity:', currentLoadedActivity);
        } else {
            saveCurrentBtn.style.display = 'none';
            console.log('DEBUG: Hiding SAVE button - no activity loaded');
        }
    } else {
        console.log('DEBUG: SAVE button element not found!');
    }
}

// Update button states
function updateButtonStates() {
    const saveBtn = document.getElementById('save-btn');
    const saveAsBtn = document.getElementById('save-as-btn');
    const restoreBtn = document.getElementById('restore-btn');
    
    // Show/hide restore button based on last run activity
    if (lastRunActivity && !currentLoadedActivity) {
        restoreBtn.style.display = 'inline-block';
        restoreBtn.textContent = `RESTORE "${lastRunActivity.name}"`;
    } else {
        restoreBtn.style.display = 'none';
    }
    
    if (currentLoadedActivity) {
        // Activity is loaded - show SAVE and SAVE AS
        saveBtn.style.display = 'inline-block';
        saveBtn.textContent = 'SAVE';
        saveAsBtn.style.display = 'inline-block';
    } else {
        // No activity loaded - show only SAVE AS
        saveBtn.style.display = 'none';
        saveAsBtn.style.display = 'inline-block';
        saveAsBtn.textContent = 'SAVE ACTIVITY';
    }
}

// Update activity title display
function updateActivityTitle() {
    const titleDisplay = document.getElementById('activity-title-display');
    const activityNameEl = document.getElementById('current-activity-name');
    
    if (titleDisplay && activityNameEl) {
        if (currentLoadedActivity) {
            activityNameEl.textContent = currentLoadedActivity;
            titleDisplay.style.display = 'block';
        } else {
            titleDisplay.style.display = 'none';
        }
    }
}

// Save current activity as the last run activity
function saveCurrentActivityAsLastRun() {
    const currentData = {
        objective: document.getElementById('objective-input').value,
        constraintEnabled: true,
        prompt1InterestsMode: document.getElementById('prompt1-interests-mode').checked,
        criterionLabels: criterionLabels,
        activityName: currentLoadedActivity, // Include the activity name
        categories: {}
    };

    // Get all headers (column labels) - now from .prompt-column
    const headers = document.querySelectorAll('.header-input');
    const textareas = document.querySelectorAll('.textarea-container textarea');
    const criterionInputs = document.querySelectorAll('.criterion-label-input');
    
    // Calculate prompt count (number of headers)
    const promptCount = headers.length;
    
    // Build categories structure
    headers.forEach((header, columnIndex) => {
        const headerText = header.value.trim() || `PROMPT ${columnIndex + 1}`;
        currentData.categories[headerText] = {};
        
        // Get textareas for this column
        criterionInputs.forEach((criterionInput, rowIndex) => {
            const categoryLabel = criterionInput.value.trim() || `Category ${rowIndex + 1}`;
            const textareaIndex = rowIndex * promptCount + columnIndex;
            const textarea = textareas[textareaIndex];
            
            if (textarea) {
                const prompts = textarea.value.split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0);
                currentData.categories[headerText][categoryLabel] = prompts;
            }
        });
    });

    // Save as last run activity only if we have a real loaded activity
    if (currentLoadedActivity) {
        lastRunActivity = {
            name: currentLoadedActivity,
            data: currentData,
            timestamp: Date.now()
        };
        
        // Store in localStorage for persistence
        localStorage.setItem('lastRunActivity', JSON.stringify(lastRunActivity));
        
        console.log('Saved current activity as last run:', lastRunActivity.name);
    } else {
        console.log('No loaded activity - not saving last run activity');
    }
}

// Load the last run activity
function loadLastRunActivity() {
    const saved = localStorage.getItem('lastRunActivity');
    if (saved) {
        try {
            lastRunActivity = JSON.parse(saved);
            console.log('Loaded last run activity:', lastRunActivity.name);
            return lastRunActivity;
        } catch (e) {
            console.error('Error loading last run activity:', e);
        }
    }
    return null;
}

// Restore the last run activity to the editor
function restoreLastRunActivity() {
    if (!lastRunActivity) {
        console.log('No last run activity to restore');
        return false;
    }

    console.log('Restoring last run activity:', lastRunActivity.name);
    
    // Set the loaded activity
    currentLoadedActivity = lastRunActivity.name;
    
    // Restore the data
    const data = lastRunActivity.data;
    
    // Restore objective
    document.getElementById('objective-input').value = data.objective || '';
    
    // Restore checkbox
    document.getElementById('prompt1-interests-mode').checked = data.prompt1InterestsMode || false;
    
    // Restore criterion labels
    if (data.criterionLabels && Array.isArray(data.criterionLabels)) {
        criterionLabels = [...data.criterionLabels];
    }
                    
    // Clear existing content
    clearAllFields();
    
    // Restore categories and prompts
    if (data.categories) {
        const promptTypes = Object.keys(data.categories);
        
        // Add prompts for each type
        promptTypes.forEach((promptType, index) => {
            if (index > 0) { // Skip first one since clearAllFields adds one
                addNewPrompt();
            }
            
            // Set the prompt header
            const headerInput = document.querySelectorAll('.header-input')[index];
            if (headerInput) {
                headerInput.value = promptType;
            }
        });
        
        // Add categories for each letter that has content
        const allCategoryLetters = new Set();
        promptTypes.forEach(promptType => {
            Object.keys(data.categories[promptType]).forEach(letter => {
                allCategoryLetters.add(letter);
            });
        });
        
        // Add categories
        Array.from(allCategoryLetters).forEach((letter, index) => {
            if (index > 0) { // Skip first one since clearAllFields adds one
                addNewCategory();
            }
        });
        
        // Fill in the data
        promptTypes.forEach((promptType, promptIndex) => {
            const categoryData = data.categories[promptType];
            Object.keys(categoryData).forEach(categoryLetter => {
                const rowIndex = categoryLetter.charCodeAt(0) - 65; // A=0, B=1, etc.
                const textarea = document.querySelector(`textarea[data-column="${promptIndex}"][data-row="${rowIndex}"]`);
                if (textarea) {
                    textarea.value = categoryData[categoryLetter].join('\n');
                }
            });
        });
        
        // Update criterion labels in the UI
        updateCategoryRows();
    }
    
    // Update button states
    updateButtonStates();
    updateActivityTitle();
    
    // Save the restored state
    saveChanges();
    
    console.log('Last run activity restored successfully');
    return true;
}

// Save new settings
function saveNewSettings() {
    showCustomPrompt('Enter a name for this activity:', (settingsName) => {
        if (!settingsName || !settingsName.trim()) {
            return;
        }
        saveActivityWithName(settingsName.trim());
    });
}

// Save current activity
function saveCurrentActivity() {
    if (!currentLoadedActivity) {
        alert('No activity loaded to save. Please load an activity first or use "SAVE ACTIVITY" to create a new one.');
        return;
    }
    
    console.log('Saving current activity:', currentLoadedActivity);
    
    // Get current prompt data (same as saveActivityWithName)
    const currentData = {
        objective: document.getElementById('objective-input').value,
        prompt1InterestsMode: document.getElementById('prompt1-interests-mode').checked, // Include criterion selection state
        criterionLabels: criterionLabels, // Include criterion labels
        categories: {},
        promptHeaders: [],
        timestamp: new Date().toISOString(),
        name: currentLoadedActivity
    };
    
    // Collect prompt headers
    const headerInputs = document.querySelectorAll('.header-input');
    headerInputs.forEach(header => {
        if (header.value.trim()) {
            currentData.promptHeaders.push(header.value.trim());
        }
    });
    
    // Collect all category data using new grid structure
    const criterionInputs = document.querySelectorAll('.criterion-label-input');
    const textareas = document.querySelectorAll('.textarea-container textarea');
    const promptCount = document.querySelectorAll('.header-input').length;
    
    criterionInputs.forEach((criterionInput, rowIndex) => {
        const categoryLabel = criterionInput.value.trim() || `Category ${rowIndex + 1}`;
        
        // Save data from all prompt columns for this category
        const categoryData = [];
        for (let colIndex = 0; colIndex < promptCount; colIndex++) {
            const textareaIndex = rowIndex * promptCount + colIndex;
            const textarea = textareas[textareaIndex];
            if (textarea && textarea.value.trim()) {
                categoryData.push(textarea.value.trim().split('\n').filter(line => line.trim()));
            } else {
                categoryData.push([]);
            }
        }
        
        if (categoryData.length > 0) {
            currentData.categories[categoryLabel] = categoryData;
        }
    });
    
    // Update the saved activity
    console.log('DEBUG: Saving currentData:', currentData);
    console.log('DEBUG: prompt1InterestsMode being saved:', currentData.prompt1InterestsMode);
    const savedSettings = JSON.parse(localStorage.getItem('promptSettings') || '{}');
    savedSettings[currentLoadedActivity] = currentData;
    localStorage.setItem('promptSettings', JSON.stringify(savedSettings));
    
    // Also save to main promptCategories localStorage that sketch.js reads
    saveChanges();
    
    // Show success message
    const indicator = document.getElementById('auto-save-indicator');
    if (indicator) {
        indicator.textContent = `✓ Updated "${currentLoadedActivity}"`;
        indicator.style.display = 'inline';
        setTimeout(() => {
            indicator.style.display = 'none';
        }, 3000);
    }
    
    // Show confirmation popup
    showSaveConfirmation(`✓ SETTINGS SAVED`);
    
    // Update button states
    updateButtonStates();
    updateActivityTitle();
    
    console.log('Activity updated:', currentLoadedActivity);
}

// Save activity with name
function saveActivityWithName(settingsName) {
    // Get current prompt data
    const currentData = {
        objective: document.getElementById('objective-input').value,
        prompt1InterestsMode: document.getElementById('prompt1-interests-mode').checked, // Include criterion selection state
        criterionLabels: criterionLabels,
        categories: {},
        promptHeaders: [],
        timestamp: new Date().toISOString(),
        name: settingsName.trim()
    };
    
    // Collect prompt headers
    const headerInputs = document.querySelectorAll('.header-input');
    headerInputs.forEach(header => {
        if (header.value.trim()) {
            currentData.promptHeaders.push(header.value.trim());
        }
    });
    
    // Collect all category data using new grid structure
    const criterionInputs = document.querySelectorAll('.criterion-label-input');
    const textareas = document.querySelectorAll('.textarea-container textarea');
    const promptCount = document.querySelectorAll('.header-input').length;
    
    criterionInputs.forEach((criterionInput, rowIndex) => {
        const categoryLabel = criterionInput.value.trim() || `Category ${rowIndex + 1}`;
        
        // Save data from all prompt columns for this category
        const categoryData = [];
        for (let colIndex = 0; colIndex < promptCount; colIndex++) {
            const textareaIndex = rowIndex * promptCount + colIndex;
            const textarea = textareas[textareaIndex];
            if (textarea && textarea.value.trim()) {
                categoryData.push(textarea.value.trim().split('\n').filter(line => line.trim()));
            } else {
                categoryData.push([]);
            }
        }
        
        if (categoryData.length > 0) {
            currentData.categories[categoryLabel] = categoryData;
        }
    });
    
    // Save to localStorage
    console.log('DEBUG: Saving currentData for new activity:', currentData);
    console.log('DEBUG: prompt1InterestsMode being saved:', currentData.prompt1InterestsMode);
    const savedSettings = JSON.parse(localStorage.getItem('promptSettings') || '{}');
    savedSettings[settingsName.trim()] = currentData;
    localStorage.setItem('promptSettings', JSON.stringify(savedSettings));
    
    // Also save to main promptCategories localStorage that sketch.js reads
    saveChanges();
    
    // Show confirmation popup
    showSaveConfirmation(`✓ ACTIVITY SAVED`);
    
    // Update settings list
    updateSettingsList();
    
    // Set this as the current loaded activity
    currentLoadedActivity = settingsName.trim();
    
    // Show activity status indicator
    updateActivityStatusIndicator();
    
    // Update button states
    updateButtonStates();
    updateActivityTitle();
    
    // Automatically select the newly saved activity
    setTimeout(() => {
        const newItem = Array.from(document.querySelectorAll('.settings-item')).find(item => 
            item.querySelector('.settings-item-content').textContent === settingsName.trim()
        );
        if (newItem) {
            newItem.click();
        }
    }, 100);
}

// Show custom prompt dialog
function showCustomPrompt(message, callback) {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.8);
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
        border: 2px solid var(--primary-color);
        border-radius: 8px;
        padding: 20px;
        color: var(--primary-color);
        max-width: 400px;
        width: 90%;
        box-shadow: 0 0 20px var(--primary-shadow);
    `;
    
    // Add message
    const messageEl = document.createElement('div');
    messageEl.textContent = message;
    messageEl.style.cssText = `
        margin-bottom: 15px;
        color: var(--primary-color);
        font-size: 16px;
        text-align: center;
    `;
    
    // Add input field
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Activity name';
    input.style.cssText = `
        width: 100%;
        padding: 10px;
        margin-bottom: 15px;
        background-color: var(--background-color);
        border: 1px solid var(--primary-color);
        border-radius: 4px;
        color: var(--text-color);
        font-family: 'VT323', monospace;
        font-size: 16px;
        box-sizing: border-box;
    `;
    
    // Add button container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        gap: 10px;
        justify-content: center;
    `;
    
    // Add Save button
    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'SAVE';
    saveBtn.style.cssText = `
        background-color: var(--background-color);
        color: var(--text-color);
        border: 1px solid var(--primary-color);
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-family: 'VT323', monospace;
        font-size: 14px;
        transition: all 0.3s ease;
    `;
    saveBtn.onmouseover = () => saveBtn.style.backgroundColor = 'var(--primary-hover)';
    saveBtn.onmouseout = () => saveBtn.style.backgroundColor = 'var(--background-color)';
    saveBtn.onclick = () => {
        callback(input.value);
        document.body.removeChild(overlay);
    };
    
    // Add Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'CANCEL';
    cancelBtn.style.cssText = `
        background-color: var(--background-color);
        color: var(--text-color);
        border: 1px solid var(--primary-color);
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-family: 'VT323', monospace;
        font-size: 14px;
        transition: all 0.3s ease;
    `;
    cancelBtn.onmouseover = () => cancelBtn.style.backgroundColor = 'var(--primary-hover)';
    cancelBtn.onmouseout = () => cancelBtn.style.backgroundColor = 'var(--background-color)';
    cancelBtn.onclick = () => {
        document.body.removeChild(overlay);
    };
    
    // Handle Enter key
    input.onkeypress = (e) => {
        if (e.key === 'Enter') {
            callback(input.value);
            document.body.removeChild(overlay);
        }
    };
    
    // Assemble dialog
    buttonContainer.appendChild(saveBtn);
    buttonContainer.appendChild(cancelBtn);
    dialog.appendChild(messageEl);
    dialog.appendChild(input);
    dialog.appendChild(buttonContainer);
    overlay.appendChild(dialog);
    
    // Add to page
    document.body.appendChild(overlay);
    
    // Focus input
    input.focus();
}

// Update settings list
function updateSettingsList() {
    const settingsList = document.getElementById('settings-list');
    const savedSettings = JSON.parse(localStorage.getItem('promptSettings') || '{}');
    
    // Clear existing items
    settingsList.innerHTML = '';
    
    // Add saved settings as clickable items
    Object.keys(savedSettings).sort().forEach(name => {
        const settings = savedSettings[name];
        const item = document.createElement('div');
        item.className = 'settings-item';
        
        // Create content wrapper
        const content = document.createElement('div');
        content.className = 'settings-item-content';
        content.textContent = name;
        content.onclick = () => selectSettings(name);
        
        // Create delete button
        const deleteBtn = document.createElement('span');
        deleteBtn.className = 'settings-item-delete';
        deleteBtn.textContent = '[ X ]';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteActivity(name);
        };
        
        item.appendChild(content);
        item.appendChild(deleteBtn);
        settingsList.appendChild(item);
    });
}

// Delete activity
function deleteActivity(activityName) {
    if (!confirm(`Are you sure you want to delete "${activityName}"?`)) {
        return;
    }
    
    const savedSettings = JSON.parse(localStorage.getItem('promptSettings') || '{}');
    delete savedSettings[activityName];
    localStorage.setItem('promptSettings', JSON.stringify(savedSettings));
    
    // Clear selection if this was selected
    if (window.selectedSettingsName === activityName) {
        window.selectedSettingsName = null;
    }
    
    // Update settings list
    updateSettingsList();
    
    alert(`Activity "${activityName}" deleted successfully!`);
}

// Select settings
function selectSettings(settingsName) {
    // Remove previous selection
    document.querySelectorAll('.settings-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Add selection to clicked item
    const clickedItem = event.target.closest('.settings-item');
    if (clickedItem) {
        clickedItem.classList.add('selected');
    }
    
    // Store selected settings name for export
    window.selectedSettingsName = settingsName;
    
    // Load the settings immediately
    loadSettingsByName(settingsName);
}

// Load settings by name
function loadSettingsByName(settingsName) {
    console.log('=== DEBUG: loadSettingsByName called ===');
    console.log('Loading activity:', settingsName);
    
    const savedSettings = JSON.parse(localStorage.getItem('promptSettings') || '{}');
    console.log('All saved settings:', Object.keys(savedSettings));
    const settings = savedSettings[settingsName];
    console.log('Found settings:', settings);
    console.log('Settings prompt1InterestsMode:', settings?.prompt1InterestsMode);
    
    if (!settings) {
        console.log('Settings not found for:', settingsName);
        console.log('Falling back to fresh start');
        
        // Clear any existing "Current Activity" from localStorage to prevent confusion
        const savedSettings = JSON.parse(localStorage.getItem('promptSettings') || '{}');
        if (savedSettings['Current Activity']) {
            delete savedSettings['Current Activity'];
            localStorage.setItem('promptSettings', JSON.stringify(savedSettings));
            console.log('Cleared invalid "Current Activity" from localStorage');
        }
        
        // Clear any loaded activity and start fresh
        currentLoadedActivity = null;
            
            // CRITICAL: Preserve existing class report data before clearing localStorage
            const existingData = localStorage.getItem('promptCategories');
            let preservedData = {};
            
            if (existingData) {
                try {
                    const parsed = JSON.parse(existingData);
                    // Preserve all class report related data
                    preservedData = {
                        classReport: parsed.classReport || [],
                        allStudents: parsed.allStudents || [],
                        drawnStudents: parsed.drawnStudents || [],
                        manuallyAddedStudents: parsed.manuallyAddedStudents || [],
                        totalUniqueStudents: parsed.totalUniqueStudents || 0,
                        classList: parsed.classList || [],
                        originalClassList: parsed.originalClassList || [],
                        studentName: parsed.studentName || ''
                    };
                    console.log('DEBUG: Preserved class report data:', preservedData);
                } catch (error) {
                    console.error('Error parsing existing data for preservation:', error);
                }
            }
            
            // Clear localStorage first to ensure fresh start
            localStorage.removeItem('promptCategories');
            
            // Save empty data immediately to prevent sketch from loading old data
            const emptyData = {
                objective: '',
                constraintEnabled: true,
                prompt1InterestsMode: false,
                criterionLabels: ['', '', '', ''],
                categories: {},
                // Preserve all class report data
                ...preservedData
            };
            localStorage.setItem('promptCategories', JSON.stringify(emptyData));
            
            // Initialize with fresh content after a small delay to ensure DOM is ready
            console.log('DEBUG: About to call initializeDefaultContent with setTimeout');
            setTimeout(() => {
                console.log('DEBUG: setTimeout callback executing - calling initializeDefaultContent');
                initializeDefaultContent();
            }, 10);
            
            return;
        }
        
        // Set loading flag to prevent clearing activity during loading
        isLoadingActivity = true;
        
        // Track the currently loaded activity for auto-updating
        currentLoadedActivity = settingsName;
        console.log('Set currentLoadedActivity to:', currentLoadedActivity);
        
        // Show activity status indicator
        updateActivityStatusIndicator();
        
        // Load objective
        document.getElementById('objective-input').value = settings.objective || '';
        
        // Load prompt1 interests mode (criterion selection state)
        const interestsCheckbox = document.getElementById('prompt1-interests-mode');
        if (interestsCheckbox && typeof settings.prompt1InterestsMode === 'boolean') {
            interestsCheckbox.checked = settings.prompt1InterestsMode;
            console.log('Loaded prompt1InterestsMode:', settings.prompt1InterestsMode);
        }
        
        // Load criterion labels if they exist
        if (settings.criterionLabels && Array.isArray(settings.criterionLabels)) {
            criterionLabels = [...settings.criterionLabels];
            console.log('Loaded criterion labels:', criterionLabels);
        } else {
            // Keep existing criterion labels if none found in settings
            console.log('No criterion labels found in settings, keeping existing:', criterionLabels);
        }
        // Clear existing prompts and categories
        const promptHeadersContainer = document.getElementById('prompt-headers');
        const addButton = promptHeadersContainer.querySelector('.add-prompt-button');
        
        // Remove the add button temporarily to preserve it
        if (addButton) {
            addButton.remove();
        }
        
        promptHeadersContainer.innerHTML = '';
        
        // Add the add button back
        if (addButton) {
            promptHeadersContainer.appendChild(addButton);
        }
                    
        const categoriesContainer = document.getElementById('categories-container');
        categoriesContainer.innerHTML = '';
        
        // Reset counters
                    promptCounter = 0;
                    categoryCounter = 0;
                    
        // Load prompt headers first
        if (settings.promptHeaders && settings.promptHeaders.length > 0) {
            // Use saved prompt headers
            settings.promptHeaders.forEach(headerName => {
                addNewPrompt();
                const headerInputs = document.querySelectorAll('.header-input');
                headerInputs[headerInputs.length - 1].value = headerName;
            });
        } else if (settings.categories && Object.keys(settings.categories).length > 0) {
            // Fallback: create generic prompts based on first category data
            const firstCategory = Object.keys(settings.categories)[0];
            const firstCategoryData = settings.categories[firstCategory];
            
            for (let i = 0; i < firstCategoryData.length; i++) {
                addNewPrompt();
                const headerInputs = document.querySelectorAll('.header-input');
                headerInputs[headerInputs.length - 1].value = `PROMPT ${i + 1}`;
            }
        }
        
        // Load categories
        const categoryKeys = Object.keys(settings.categories);
        
        // Ensure we have at least one category row
        if (categoryKeys.length > 0) {
            // Add categories as needed using new grid structure
            for (let i = 0; i < categoryKeys.length; i++) {
                addNewCategory();
                
                // Get newly added row using grid structure
                const criterionInputs = document.querySelectorAll('.criterion-label-input');
                const textareas = document.querySelectorAll('.textarea-container textarea');
                const targetRowIndex = i;
                const promptCount = document.querySelectorAll('.header-input').length;
                
                // Set criterion label
                if (criterionInputs[targetRowIndex]) {
                    criterionInputs[targetRowIndex].value = categoryKeys[i];
                }
                
                // Load data into all textareas for this category
                const categoryData = settings.categories[categoryKeys[i]];
                if (Array.isArray(categoryData)) {
                    // New format: array of arrays (one for each prompt column)
                    categoryData.forEach((promptData, promptIndex) => {
                        const textareaIndex = targetRowIndex * promptCount + promptIndex;
                        const textarea = textareas[textareaIndex];
                        if (textarea && Array.isArray(promptData)) {
                            textarea.value = promptData.join('\n');
                        }
                    });
                } else {
                    // Old format: single array (fallback for backward compatibility)
                    const textareaIndex = targetRowIndex * promptCount;
                    const textarea = textareas[textareaIndex];
                    if (textarea && Array.isArray(categoryData)) {
                        textarea.value = categoryData.join('\n');
                    }
                }
            }
        }
        
        // Update prompt counts
        updateColumnCounts();
        
        // Update category rows to refresh criterion label inputs with loaded values
        updateCategoryRows();
        
        // Clear loading flag - loading is complete
        isLoadingActivity = false;
        
        // Update button states after loading
        updateButtonStates();
        updateActivityTitle();
        
        // IMPORTANT: Use saveChanges() to properly save to promptCategories
        console.log('=== DEBUG: About to call saveChanges from loadSettingsByName ===');
        console.log('currentLoadedActivity at this point:', currentLoadedActivity);
        console.log('objective value at this point:', document.getElementById('objective-input').value);
        console.log('criterionLabels at this point:', criterionLabels);
        
        // Use the existing saveChanges function to ensure proper data conversion
        saveChanges();
        console.log('=== DEBUG: saveChanges completed from loadSettingsByName ===');
    }

// New button functions
function startNewPromptSet() {
    // Clear all fields and start fresh with 1 default prompt and category
    initializeDefaultContent();
    clearCurrentActivity();
    
    // Clear last run activity when starting new
    lastRunActivity = null;
    localStorage.removeItem('lastRunActivity');
    
    // CRITICAL: Preserve existing class report data before clearing localStorage
    const existingData = localStorage.getItem('promptCategories');
    let preservedData = {};
    
    if (existingData) {
        try {
            const parsed = JSON.parse(existingData);
            // Preserve all class report related data
            preservedData = {
                classReport: parsed.classReport || [],
                allStudents: parsed.allStudents || [],
                drawnStudents: parsed.drawnStudents || [],
                manuallyAddedStudents: parsed.manuallyAddedStudents || [],
                totalUniqueStudents: parsed.totalUniqueStudents || 0,
                classList: parsed.classList || [],
                originalClassList: parsed.originalClassList || [],
                studentName: parsed.studentName || ''
            };
            console.log('DEBUG: Preserved class report data in startNewPromptSet:', preservedData);
        } catch (error) {
            console.error('Error parsing existing data for preservation in startNewPromptSet:', error);
        }
    }
    
    // IMPORTANT: Clear the promptCategories localStorage to prevent mixing old data
    localStorage.removeItem('promptCategories');
    
    const emptyData = {
        objective: '',
        constraintEnabled: true,
        prompt1InterestsMode: false,
        criterionLabels: ['', '', '', ''],
        activityName: null,
        categories: {},
        // Preserve all class report data
        ...preservedData
    };
    localStorage.setItem('promptCategories', JSON.stringify(emptyData));
    
    updateButtonStates();
    updateActivityTitle();
    console.log('Started new prompt set - cleared all localStorage data');
}

function saveAsNewActivity() {
    // Save current content as a new activity
    showCustomPrompt('Enter a name for this new activity:', (settingsName) => {
        if (!settingsName || !settingsName.trim()) {
            return;
        }
        saveActivityWithName(settingsName.trim());
        updateButtonStates();
    });
}

function sharePromptSet() {
    // Export current content as CSV for sharing
    exportSettings();
}

function loadPromptSet() {
    // Load a CSV file
    importSettings();
}

// Show save confirmation popup
function showSaveConfirmation(message) {
    // Remove any existing popup
    const existingPopup = document.getElementById('save-confirmation-popup');
    if (existingPopup) {
        existingPopup.remove();
    }
    
    // Create popup element
    const popup = document.createElement('div');
    popup.id = 'save-confirmation-popup';
    popup.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: var(--background-color);
        color: var(--primary-color);
        border: 3px solid var(--primary-color);
        border-radius: 4px;
        padding: 30px 40px;
        font-family: 'VT323', monospace;
        font-size: 24px;
        font-weight: bold;
        text-align: center;
        letter-spacing: 2px;
        z-index: 10000;
        box-shadow: 0 0 20px var(--primary-shadow);
        animation: fadeIn 0.3s ease-out;
    `;
    
    // Add animation keyframes if not already present
    if (!document.getElementById('save-confirmation-styles')) {
        const style = document.createElement('style');
        style.id = 'save-confirmation-styles';
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
                to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }
            @keyframes fadeOut {
                from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                to { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
            }
        `;
        document.head.appendChild(style);
    }
    
    popup.textContent = message;
    document.body.appendChild(popup);
    
    // Remove popup after 2 seconds with fade out
    setTimeout(() => {
        popup.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            popup.remove();
        }, 300);
    }, 2000);
}

// Make functions globally available
window.clearCurrentActivity = clearCurrentActivity;
window.updateActivityStatusIndicator = updateActivityStatusIndicator;
window.updateButtonStates = updateButtonStates;
window.updateActivityTitle = updateActivityTitle;
window.saveCurrentActivityAsLastRun = saveCurrentActivityAsLastRun;
window.loadLastRunActivity = loadLastRunActivity;
window.restoreLastRunActivity = restoreLastRunActivity;
window.saveNewSettings = saveNewSettings;
window.saveCurrentActivity = saveCurrentActivity;
window.saveAsNewActivity = saveAsNewActivity;
window.sharePromptSet = sharePromptSet;
window.loadPromptSet = loadPromptSet;
window.startNewPromptSet = startNewPromptSet;
window.updateSettingsList = updateSettingsList;
window.deleteActivity = deleteActivity;
window.selectSettings = selectSettings;
window.loadSettingsByName = loadSettingsByName;
window.showCustomPrompt = showCustomPrompt;
window.saveActivityWithName = saveActivityWithName;
