// Editor Settings Manager - Handles activity management and settings
// Responsible for: Activity CRUD operations, button states, settings panel

// Global state for activity management
let currentLoadedActivity = null;
let isLoadingActivity = false; // Flag to prevent clearing activity during loading
let lastRunActivity = null; // Remember the last activity that was run

/** D-055: Activity History carries the live film so loading an activity recalls it. */
function attachCurrentRevealToActivity(currentData) {
    if (!currentData) return;
    try {
        const raw = localStorage.getItem('revealAnimation');
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') currentData.revealAnimation = parsed;
    } catch (e) { /* ignore */ }
}

function applyActivityReveal(settings) {
    if (typeof restoreActivityReveal === 'function') {
        restoreActivityReveal(settings);
        return;
    }
    if (!settings || !settings.revealAnimation || typeof settings.revealAnimation !== 'object') return;
    try {
        localStorage.setItem('revealAnimation', JSON.stringify(settings.revealAnimation));
    } catch (e) { /* ignore */ }
}

// Function to clear current activity tracking (when starting fresh)
function clearCurrentActivity() {
    currentLoadedActivity = null;
    console.log('Cleared current activity tracking - starting fresh');
    updateActivityStatusIndicator();
    updateButtonStates();
    updateActivityTitle();
}

// Activity status indicator UI was removed; kept as no-op so callers remain valid.
function updateActivityStatusIndicator() {
    // SAVE/SAVE AS visibility is handled by updateButtonStates().
}

// Update File menu option states (Save / Save As / Restore)
function updateButtonStates() {
    const saveOpt = document.getElementById('file-menu-save');
    const saveAsOpt = document.getElementById('file-menu-save-as');
    const restoreOpt = document.getElementById('file-menu-restore');

    if (restoreOpt) {
        if (lastRunActivity && !currentLoadedActivity) {
            restoreOpt.classList.remove('disabled');
            restoreOpt.setAttribute('aria-disabled', 'false');
            restoreOpt.textContent = `Restore "${lastRunActivity.name}"`;
        } else {
            restoreOpt.classList.add('disabled');
            restoreOpt.setAttribute('aria-disabled', 'true');
            restoreOpt.textContent = 'Restore Last Run';
        }
    }

    if (saveOpt) {
        if (currentLoadedActivity) {
            saveOpt.classList.remove('disabled');
            saveOpt.setAttribute('aria-disabled', 'false');
        } else {
            saveOpt.classList.add('disabled');
            saveOpt.setAttribute('aria-disabled', 'true');
        }
        saveOpt.textContent = 'Save';
    }
    if (saveAsOpt) {
        saveAsOpt.classList.remove('disabled');
        saveAsOpt.setAttribute('aria-disabled', 'false');
        saveAsOpt.textContent = 'Save As';
    }
}

function closeFileMenuDropdown() {
    const dropdown = document.getElementById('file-menu-dropdown');
    const trigger = document.getElementById('file-menu-trigger');
    if (dropdown) dropdown.classList.remove('open');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
}

function toggleFileMenuDropdown(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    if (typeof closeThemeMenuDropdown === 'function') closeThemeMenuDropdown();
    const dropdown = document.getElementById('file-menu-dropdown');
    const trigger = document.getElementById('file-menu-trigger');
    if (!dropdown || !trigger) return;
    const willOpen = !dropdown.classList.contains('open');
    dropdown.classList.toggle('open', willOpen);
    trigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
}

// File dropdown actions (themed custom menu — not native <select>)
function runFileMenuAction(action) {
    if (!action) return;
    closeFileMenuDropdown();
    switch (action) {
        case 'new':
            if (typeof startNewPromptSet === 'function') startNewPromptSet();
            break;
        case 'save':
            if (typeof saveCurrentActivity === 'function') saveCurrentActivity();
            break;
        case 'save-as':
            if (typeof saveAsNewActivity === 'function') saveAsNewActivity();
            break;
        case 'share':
            if (typeof sharePromptSet === 'function') sharePromptSet();
            break;
        case 'load':
            if (typeof loadPromptSet === 'function') loadPromptSet();
            break;
        case 'restore':
            if (typeof restoreLastRunActivity === 'function') restoreLastRunActivity();
            break;
        default:
            break;
    }
}

// Back-compat alias if anything still calls the old select handler
function handleFileMenuSelect(selectEl) {
    if (!selectEl) return;
    const action = selectEl.value;
    if (selectEl.selectedIndex != null) selectEl.selectedIndex = 0;
    runFileMenuAction(action);
}

function initFileMenuDropdown() {
    const dropdown = document.getElementById('file-menu-dropdown');
    const trigger = document.getElementById('file-menu-trigger');
    const list = document.getElementById('file-menu-list');
    if (!dropdown || !trigger || !list || trigger.dataset.bound === '1') return;
    trigger.dataset.bound = '1';

    trigger.addEventListener('click', toggleFileMenuDropdown);

    list.querySelectorAll('li[data-value]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            if (item.classList.contains('disabled') || item.getAttribute('aria-disabled') === 'true') return;
            runFileMenuAction(item.getAttribute('data-value'));
        });
    });

    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) closeFileMenuDropdown();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeFileMenuDropdown();
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFileMenuDropdown);
} else {
    initFileMenuDropdown();
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
        prompt1InterestsMode: false, // UI removed — feature not ready
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
        const headerText = (typeof promptHeaderStorageKey === 'function')
            ? promptHeaderStorageKey(header.value, columnIndex)
            : (header.value.trim() || ('__blank_' + columnIndex));
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
    // Play click sound
    if (window.playClickSound) {
        window.playClickSound();
    }
    
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
    if (window.enforceObjectiveWidthLimit) setTimeout(window.enforceObjectiveWidthLimit, 0);
    
    // Criteria-selectable UI removed — keep off until feature is ready
    const interestsRestore = document.getElementById('prompt1-interests-mode');
    if (interestsRestore) interestsRestore.checked = false;
    
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
    // Play click sound
    if (window.playClickSound) {
        window.playClickSound();
    }
    
    if (!currentLoadedActivity) {
        alert('No activity loaded to save. Please load an activity first or use "SAVE AS" to create a new one.');
        return;
    }
    
    console.log('Saving current activity:', currentLoadedActivity);
    
    // Get current prompt data (same as saveActivityWithName)
    const currentData = {
        objective: document.getElementById('objective-input').value,
        prompt1InterestsMode: false, // UI removed — feature not ready
        criterionLabels: criterionLabels, // Include criterion labels
        categories: {},
        promptHeaders: [],
        timestamp: new Date().toISOString(),
        name: currentLoadedActivity,
        // Include theme and background settings - read from dropdown to ensure current value
        theme: (() => {
            const themeSelect = document.getElementById('theme-select');
            return themeSelect ? themeSelect.value : (localStorage.getItem('selectedTheme') || 'windows');
        })(),
        background: localStorage.getItem('selectedBackground') || 'black'
    };
    attachCurrentRevealToActivity(currentData);
    
    // Collect prompt headers
    const headerInputs = document.querySelectorAll('.header-input');
    headerInputs.forEach(header => {
        currentData.promptHeaders.push(header.value.trim());
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
            if (textarea) {
                const lines = (typeof getPromptLinesFromTextarea === 'function')
                    ? getPromptLinesFromTextarea(textarea)
                    : (textarea.value.trim() ? textarea.value.trim().split('\n').filter(line => line.trim()) : []);
                categoryData.push(lines);
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
    console.log('DEBUG: Theme being saved:', currentData.theme);
    console.log('DEBUG: Background being saved:', currentData.background);
    const savedSettings = JSON.parse(localStorage.getItem('promptSettings') || '{}');
    savedSettings[currentLoadedActivity] = currentData;
    localStorage.setItem('promptSettings', JSON.stringify(savedSettings));
    
    // Also save to main promptCategories localStorage that the prompting window (sketch) reads
    saveChanges();
    if (window.copyWorkingReportToActivityReports) window.copyWorkingReportToActivityReports(currentLoadedActivity);

    // Show success message
    const indicator = document.getElementById('auto-save-indicator');
    if (indicator) {
        indicator.textContent = `Updated "${currentLoadedActivity}"`;
        indicator.style.display = 'inline';
        setTimeout(() => {
            indicator.style.display = 'none';
        }, 3000);
    }
    
    // Show confirmation popup with activity name
    showSaveConfirmation(`SETTINGS SAVED: ${currentLoadedActivity}`);
    
    // Update button states
    updateButtonStates();
    updateActivityTitle();
    
    console.log('Activity updated:', currentLoadedActivity);
}

// Save activity with name
function saveActivityWithName(settingsName) {
    // Play click sound
    if (window.playClickSound) {
        window.playClickSound();
    }
    
    // Get current prompt data
    const currentData = {
        objective: document.getElementById('objective-input').value,
        prompt1InterestsMode: false, // UI removed — feature not ready
        criterionLabels: criterionLabels,
        categories: {},
        promptHeaders: [],
        timestamp: new Date().toISOString(),
        name: settingsName.trim(),
        // Include theme and background settings - read from dropdown to ensure current value
        theme: (() => {
            const themeSelect = document.getElementById('theme-select');
            return themeSelect ? themeSelect.value : (localStorage.getItem('selectedTheme') || 'windows');
        })(),
        background: localStorage.getItem('selectedBackground') || 'black'
    };
    attachCurrentRevealToActivity(currentData);
    
    // Collect prompt headers
    const headerInputs = document.querySelectorAll('.header-input');
    headerInputs.forEach(header => {
        currentData.promptHeaders.push(header.value.trim());
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
            if (textarea) {
                const lines = (typeof getPromptLinesFromTextarea === 'function')
                    ? getPromptLinesFromTextarea(textarea)
                    : (textarea.value.trim() ? textarea.value.trim().split('\n').filter(line => line.trim()) : []);
                categoryData.push(lines);
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
    console.log('DEBUG: Theme being saved:', currentData.theme);
    console.log('DEBUG: Background being saved:', currentData.background);
    const savedSettings = JSON.parse(localStorage.getItem('promptSettings') || '{}');
    savedSettings[settingsName.trim()] = currentData;
    localStorage.setItem('promptSettings', JSON.stringify(savedSettings));
    
    // Also save to main promptCategories localStorage that the prompting window (sketch) reads
    saveChanges();
    
    // Show confirmation popup
    showSaveConfirmation(`ACTIVITY SAVED: ${settingsName.trim()}`);
    
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
        if (window.playClickSound) {
            window.playClickSound();
        }
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
        if (window.playClickSound) {
            window.playClickSound();
        }
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
        content.onclick = () => {
            if (window.playClickSound) {
                window.playClickSound();
            }
            selectSettings(name);
        };
        
        // Create delete button
        const deleteBtn = document.createElement('span');
        deleteBtn.className = 'settings-item-delete';
        deleteBtn.textContent = '[ X ]';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            if (window.playClickSound) {
                window.playClickSound();
            }
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
async function loadSettingsByName(settingsName) {
    console.log('=== DEBUG: loadSettingsByName called ===');
    console.log('Loading activity:', settingsName);
    
    let settings;
    
    // Special handling for Sample - always reload from CSV to ensure latest data
    if (settingsName === 'Sample') {
        console.log('Loading Sample - reloading from CSV to ensure latest data');
        try {
            const response = await fetch('Sample-activity-2025-10-27.csv?v=20260830az');
            const csvText = await response.text();
            const parsed = (typeof parseActivityCsv === 'function')
                ? parseActivityCsv(csvText)
                : { objective: '', prompt1InterestsMode: false, criterionLabels: [], promptHeaders: [], categories: {}, theme: 'pinkCRT', background: 'black' };
            const themeMigration = {
                'orange': 'orangeCRT',
                'green': 'greenCRT',
                'blue': 'blueCRT',
                'purple': 'purpleCRT',
                'pink': 'pinkCRT',
                'white': 'macintosh'
            };
            const sampleTheme = themeMigration[parsed.theme] || parsed.theme || 'pinkCRT';
            const sampleSettings = {
                objective: parsed.objective,
                prompt1InterestsMode: parsed.prompt1InterestsMode,
                criterionLabels: parsed.criterionLabels,
                promptHeaders: parsed.promptHeaders,
                categories: parsed.categories,
                theme: sampleTheme,
                background: parsed.background || 'black',
                name: 'Sample',
                timestamp: new Date().toISOString()
            };
            
            // Use the parsed settings object
            settings = sampleSettings;
        } catch (error) {
            console.error('Failed to load Sample from CSV, falling back to saved version:', error);
            // Fall through to regular loading
            const savedSettings = JSON.parse(localStorage.getItem('promptSettings') || '{}');
            settings = savedSettings[settingsName];
        }
    } else {
        const savedSettings = JSON.parse(localStorage.getItem('promptSettings') || '{}');
        console.log('All saved settings:', Object.keys(savedSettings));
        settings = savedSettings[settingsName];
        console.log('Found settings:', settings);
        console.log('Settings prompt1InterestsMode:', settings?.prompt1InterestsMode);
    }
    
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
        
        // CRITICAL: Switch activity reports before loading new activity
        // This saves the current activity's report and loads the new activity's report
        if (window.switchActivity) {
            console.log('Switching activity reports before loading:', settingsName);
            window.switchActivity(settingsName);
        }
        
        // Track the currently loaded activity for auto-updating
        currentLoadedActivity = settingsName;
        console.log('Set currentLoadedActivity to:', currentLoadedActivity);
        
        // Also update window reference for sketch.html
        window.currentLoadedActivity = settingsName;
        
        // Show activity status indicator
        updateActivityStatusIndicator();
        
        // D-033: an activity that was stamped from Customize recalls that look.
        if (typeof restoreActivityTheme === 'function') {
            restoreActivityTheme(settings);
        } else if (settings.theme && window.changeTheme) {
            changeTheme(settings.theme);
        }
        // D-055: recall that activity's film if one was saved with it.
        applyActivityReveal(settings);
        
        // Load objective
        document.getElementById('objective-input').value = settings.objective || '';
        if (window.enforceObjectiveWidthLimit) setTimeout(window.enforceObjectiveWidthLimit, 0);
        
        // Criteria-selectable UI removed — keep off until feature is ready
        const interestsCheckbox = document.getElementById('prompt1-interests-mode');
        if (interestsCheckbox) interestsCheckbox.checked = false;
        
        // Load criterion labels if they exist
        if (settings.criterionLabels && Array.isArray(settings.criterionLabels)) {
            criterionLabels = [...settings.criterionLabels];
            window.criterionLabels = criterionLabels; // Also set on window like importSettings does
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
                headerInputs[headerInputs.length - 1].value = (typeof promptHeaderEditorValue === 'function')
                    ? promptHeaderEditorValue(headerName)
                    : headerName;
            });
        } else if (settings.categories && Object.keys(settings.categories).length > 0) {
            // Fallback: create generic prompts based on first category data
            const firstCategory = Object.keys(settings.categories)[0];
            const firstCategoryData = settings.categories[firstCategory];
            
            for (let i = 0; i < firstCategoryData.length; i++) {
                addNewPrompt();
                const headerInputs = document.querySelectorAll('.header-input');
                headerInputs[headerInputs.length - 1].value = '';
            }
        }
        
        // Load categories - using same logic as importSettings
        const categoryKeys = Object.keys(settings.categories);
        console.log('DEBUG: Loading categories:', categoryKeys);
        
        // Ensure we have at least one category row
        if (categoryKeys.length > 0) {
            // Add categories as needed using new grid structure (matching importSettings)
            categoryKeys.forEach(categoryName => {
                addNewCategory();
                
                // Get newly added row using grid structure (matching importSettings pattern)
                const criterionInputs = document.querySelectorAll('.criterion-label-input');
                const textareas = document.querySelectorAll('.textarea-container textarea');
                const lastRowIndex = criterionInputs.length - 1; // Use lastRowIndex like importSettings
                const promptCount = document.querySelectorAll('.header-input').length;
                
                console.log(`DEBUG: Loading category "${categoryName}" at row ${lastRowIndex}, ${promptCount} prompts`);
                
                // Set criterion label (matching importSettings)
                if (criterionInputs[lastRowIndex]) {
                    criterionInputs[lastRowIndex].value = categoryName;
                    console.log(`DEBUG: Set criterion label to:`, categoryName);
                }
                
                // Load data into all textareas for this category
                const categoryData = settings.categories[categoryName];
                console.log(`DEBUG: Category data for "${categoryName}":`, categoryData);
                
                if (Array.isArray(categoryData)) {
                    // New format: array of arrays (one for each prompt column)
                    categoryData.forEach((promptData, colIndex) => {
                        const textareaIndex = lastRowIndex * promptCount + colIndex;
                        const textarea = textareas[textareaIndex];
                        if (textarea && Array.isArray(promptData)) {
                            textarea.value = promptData.join('\n');
                            console.log(`DEBUG: Set textarea[${colIndex}] at index ${textareaIndex} to ${promptData.length} items`);
                        } else if (textarea && promptData) {
                            // Fallback for non-array data
                            textarea.value = Array.isArray(promptData) ? promptData.join('\n') : promptData;
                            console.log(`DEBUG: Set textarea[${colIndex}] (fallback) to:`, promptData);
                        }
                    });
                } else {
                    // Old format: single array (fallback for backward compatibility)
                    const textareaIndex = lastRowIndex * promptCount;
                    const textarea = textareas[textareaIndex];
                    if (textarea && Array.isArray(categoryData)) {
                        textarea.value = categoryData.join('\n');
                        console.log(`DEBUG: Set textarea (old format) to ${categoryData.length} items`);
                    }
                }
            });
        }
        
        // Update grid columns after loading settings
        if (window.updateGridColumns) {
            window.updateGridColumns();
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
        
        // Sync cube FROM grid before save — otherwise flushPromptCube overwrites
        // the active cell with stale empty cube text and drops a whole prompt column.
        if (typeof window.refreshPromptCube === 'function') {
            window.refreshPromptCube();
        }
        if (typeof window.hydrateAllPromptImageFields === 'function') {
            window.hydrateAllPromptImageFields();
        }

        // IMPORTANT: Use saveChanges() to properly save to promptCategories
        console.log('=== DEBUG: About to call saveChanges from loadSettingsByName ===');
        console.log('currentLoadedActivity at this point:', currentLoadedActivity);
        console.log('objective value at this point:', document.getElementById('objective-input').value);
        console.log('criterionLabels at this point:', criterionLabels);
        
        // Use the existing saveChanges function to ensure proper data conversion
        saveChanges();
        console.log('=== DEBUG: saveChanges completed from loadSettingsByName ===');
        
        // Attach event listeners to all textareas and auto-resize after loading
        setTimeout(() => {
            if (window.attachTextareaEventListeners) {
                window.attachTextareaEventListeners();
            } else if (window.autoResizeTextareasInRows) {
                window.autoResizeTextareasInRows();
            }
        }, 200);
    }

// New button functions
function startNewPromptSet() {
    // Play click sound
    if (window.playClickSound) {
        window.playClickSound();
    }
    
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
                studentName: parsed.studentName || '',
                requireStudentNames: typeof parsed.requireStudentNames === 'boolean' ? parsed.requireStudentNames : false,
                unnamedRunCounter: typeof parsed.unnamedRunCounter === 'number' ? parsed.unnamedRunCounter : 0
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
    // Play click sound
    if (window.playClickSound) {
        window.playClickSound();
    }
    
    // Share: quoted CSV, or zip with media/ when the activity has pictures (D-057)
    exportSettings();
}

function loadPromptSet() {
    // Play click sound
    if (window.playClickSound) {
        window.playClickSound();
    }
    
    // Load a quoted CSV or a zip pack with pictures (D-057)
    importSettings();
}

// Themed alert: message + OK button (no skip). Used when prompts are missing.
function showThemedAlert(message) {
    const existing = document.getElementById('themed-alert-popup');
    if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.id = 'themed-alert-popup';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background-color: rgba(0, 0, 0, 0.6);
        display: flex; justify-content: center; align-items: center;
        z-index: 10000; font-family: 'VT323', monospace;
    `;
    const box = document.createElement('div');
    box.style.cssText = `
        background-color: var(--background-color);
        color: var(--primary-color);
        border: 3px solid var(--primary-color);
        border-radius: 4px;
        padding: 30px 40px;
        font-size: 24px;
        font-weight: bold;
        text-align: center;
        letter-spacing: 2px;
        box-shadow: 0 0 20px var(--primary-shadow);
    `;
    box.textContent = message;
    const okBtn = document.createElement('button');
    okBtn.textContent = 'OK';
    okBtn.style.cssText = `
        margin-top: 20px;
        padding: 10px 24px;
        background-color: var(--background-color);
        color: var(--primary-color);
        border: 2px solid var(--primary-color);
        border-radius: 4px;
        font-family: 'VT323', monospace;
        font-size: 20px;
        cursor: pointer;
    `;
    okBtn.onclick = () => {
        if (window.playClickSound) window.playClickSound();
        overlay.remove();
    };
    box.appendChild(okBtn);
    overlay.appendChild(box);
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    box.onclick = (e) => e.stopPropagation();
    document.body.appendChild(overlay);
}

// Two-button themed confirm. onResult(true) = confirm, onResult(false) = cancel.
function showThemedConfirm(message, buttons, onResult) {
    const existing = document.getElementById('themed-confirm-popup');
    if (existing) existing.remove();
    const labels = buttons || {};
    const overlay = document.createElement('div');
    overlay.id = 'themed-confirm-popup';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background-color: rgba(0, 0, 0, 0.6);
        display: flex; justify-content: center; align-items: center;
        z-index: 10000; font-family: 'VT323', monospace;
    `;
    const box = document.createElement('div');
    box.style.cssText = `
        background-color: var(--background-color);
        color: var(--primary-color);
        border: 3px solid var(--primary-color);
        border-radius: 4px;
        padding: 30px 40px;
        font-size: 22px;
        font-weight: bold;
        text-align: center;
        letter-spacing: 1px;
        box-shadow: 0 0 20px var(--primary-shadow);
        max-width: 28em;
    `;
    const msg = document.createElement('div');
    msg.textContent = message;
    msg.style.cssText = 'line-height: 1.35;';
    const btnWrap = document.createElement('div');
    btnWrap.style.cssText = 'margin-top: 20px; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;';
    const btnStyle = `
        padding: 10px 24px;
        background-color: var(--background-color);
        color: var(--primary-color);
        border: 2px solid var(--primary-color);
        border-radius: 4px;
        font-family: 'VT323', monospace;
        font-size: 20px;
        cursor: pointer;
    `;
    function finish(ok) {
        if (window.playClickSound) window.playClickSound();
        overlay.remove();
        if (typeof onResult === 'function') onResult(ok);
    }
    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = labels.confirm || 'OK';
    confirmBtn.style.cssText = btnStyle;
    confirmBtn.onclick = function () { finish(true); };
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = labels.cancel || 'CANCEL';
    cancelBtn.style.cssText = btnStyle;
    cancelBtn.onclick = function () { finish(false); };
    btnWrap.appendChild(confirmBtn);
    btnWrap.appendChild(cancelBtn);
    box.appendChild(msg);
    box.appendChild(btnWrap);
    overlay.appendChild(box);
    overlay.onclick = function (e) { if (e.target === overlay) finish(false); };
    box.onclick = function (e) { e.stopPropagation(); };
    document.body.appendChild(overlay);
}

// Missing objective popup with Skip (proceed) and Cancel (stay). onSkip is called when user clicks Skip.
function showMissingObjectiveWithSkip(onSkip) {
    const existing = document.getElementById('missing-objective-popup');
    if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.id = 'missing-objective-popup';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background-color: rgba(0, 0, 0, 0.6);
        display: flex; justify-content: center; align-items: center;
        z-index: 10000; font-family: 'VT323', monospace;
    `;
    const box = document.createElement('div');
    box.style.cssText = `
        background-color: var(--background-color);
        color: var(--primary-color);
        border: 3px solid var(--primary-color);
        border-radius: 4px;
        padding: 30px 40px;
        font-size: 24px;
        font-weight: bold;
        text-align: center;
        letter-spacing: 2px;
        box-shadow: 0 0 20px var(--primary-shadow);
    `;
    box.textContent = 'Missing objective.';
    const btnWrap = document.createElement('div');
    btnWrap.style.cssText = 'margin-top: 20px; display: flex; gap: 12px; justify-content: center;';
    const skipBtn = document.createElement('button');
    skipBtn.textContent = 'Skip';
    skipBtn.style.cssText = `
        padding: 10px 24px;
        background-color: var(--background-color);
        color: var(--primary-color);
        border: 2px solid var(--primary-color);
        border-radius: 4px;
        font-family: 'VT323', monospace;
        font-size: 20px;
        cursor: pointer;
    `;
    skipBtn.onclick = () => {
        if (window.playClickSound) window.playClickSound();
        overlay.remove();
        if (typeof onSkip === 'function') onSkip();
    };
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = skipBtn.style.cssText;
    cancelBtn.onclick = () => {
        if (window.playClickSound) window.playClickSound();
        overlay.remove();
    };
    btnWrap.appendChild(skipBtn);
    btnWrap.appendChild(cancelBtn);
    box.appendChild(btnWrap);
    overlay.appendChild(box);
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    box.onclick = (e) => e.stopPropagation();
    document.body.appendChild(overlay);
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
window.handleFileMenuSelect = handleFileMenuSelect;
window.runFileMenuAction = runFileMenuAction;
window.toggleFileMenuDropdown = toggleFileMenuDropdown;
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
window.showThemedAlert = showThemedAlert;
window.showThemedConfirm = showThemedConfirm;
window.showMissingObjectiveWithSkip = showMissingObjectiveWithSkip;
