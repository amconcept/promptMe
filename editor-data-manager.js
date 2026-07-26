// Editor Data Manager - Handles data persistence and CSV operations
// Responsible for: Saving/loading data, CSV export/import, localStorage management

// Save changes to localStorage (editor prompts/categories; working report and usedPrompts preserved)
let _saveChangesFlushing = false;
function saveChanges() {
    // Sync cube fields into the hidden grid before reading DOM (guard against re-entry)
    if (!_saveChangesFlushing && typeof flushPromptCube === 'function') {
        _saveChangesFlushing = true;
        try {
            flushPromptCube();
        } finally {
            _saveChangesFlushing = false;
        }
    }

    // Read existing promptCategories so we preserve working report and usedPrompts from sketch
    let existingData = {};
    try {
        const raw = localStorage.getItem('promptCategories');
        if (raw) existingData = JSON.parse(raw);
    } catch (e) {
        console.warn('Could not parse existing promptCategories for merge:', e);
    }

    const data = {
        objective: document.getElementById('objective-input').value,
        constraintEnabled: true,
        prompt1InterestsMode: document.getElementById('prompt1-interests-mode').checked,
        criterionLabels: criterionLabels,
        activityName: currentLoadedActivity,
        categories: {}
    };

    const headers = document.querySelectorAll('.header-input');
    const textareas = document.querySelectorAll('.textarea-container textarea');
    const criterionInputs = document.querySelectorAll('.criterion-label-input');
    const promptCount = headers.length;

    headers.forEach((header, columnIndex) => {
        const headerText = header.value.trim() || `PROMPT ${columnIndex + 1}`;
        data.categories[headerText] = {};
        criterionInputs.forEach((criterionInput, rowIndex) => {
            const categoryLabel = criterionInput.value.trim() || `Category ${rowIndex + 1}`;
            const textareaIndex = rowIndex * promptCount + columnIndex;
            const textarea = textareas[textareaIndex];
            if (textarea && textarea.value.trim()) {
                const prompts = textarea.value.split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0);
                if (prompts.length > 0) {
                    data.categories[headerText][categoryLabel] = prompts;
                }
            }
        });
    });

    // Preserve working report and names from sketch
    if (existingData.classReport && Array.isArray(existingData.classReport)) data.classReport = existingData.classReport;
    if (existingData.allStudents && Array.isArray(existingData.allStudents)) data.allStudents = existingData.allStudents;
    if (existingData.drawnStudents && Array.isArray(existingData.drawnStudents)) data.drawnStudents = existingData.drawnStudents;
    if (existingData.manuallyAddedStudents && Array.isArray(existingData.manuallyAddedStudents)) data.manuallyAddedStudents = existingData.manuallyAddedStudents;
    if (typeof existingData.totalUniqueStudents === 'number') data.totalUniqueStudents = existingData.totalUniqueStudents;
    if (existingData.classList && Array.isArray(existingData.classList)) data.classList = existingData.classList;
    if (existingData.originalClassList && Array.isArray(existingData.originalClassList)) data.originalClassList = existingData.originalClassList;
    // Preserve used prompts / exhaust state whenever it exists in storage (including {} or empty arrays per type)
    if (Object.prototype.hasOwnProperty.call(existingData, 'usedPrompts') && typeof existingData.usedPrompts === 'object' && existingData.usedPrompts !== null) {
        data.usedPrompts = existingData.usedPrompts;
    }
    // Preserve prompting-window name mode/settings
    if (typeof existingData.requireStudentNames === 'boolean') data.requireStudentNames = existingData.requireStudentNames;
    if (typeof existingData.unnamedRunCounter === 'number') data.unnamedRunCounter = existingData.unnamedRunCounter;

    localStorage.setItem('promptCategories', JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('promptDataUpdated', { detail: { timestamp: Date.now() } }));
}

// Debounced auto-save so prompts/categories are saved to localStorage as the teacher edits
let _autoSaveTimeout = null;
const AUTO_SAVE_DELAY_MS = 600;
function autoSaveToLocalStorage() {
    if (_autoSaveTimeout) clearTimeout(_autoSaveTimeout);
    _autoSaveTimeout = setTimeout(() => {
        _autoSaveTimeout = null;
        if (typeof saveChanges === 'function') saveChanges();
    }, AUTO_SAVE_DELAY_MS);
}

// Copy working report from promptCategories into saved history (only on explicit Save/Save As)
function copyWorkingReportToActivityReports(activityName) {
    if (!activityName) return;
    try {
        const raw = localStorage.getItem('promptCategories');
        if (!raw) return;
        const data = JSON.parse(raw);
        const activityReports = JSON.parse(localStorage.getItem('activityReports') || '{}');
        activityReports[activityName] = {
            classReport: Array.isArray(data.classReport) ? [...data.classReport] : [],
            allStudents: Array.isArray(data.allStudents) ? [...data.allStudents] : [],
            drawnStudents: Array.isArray(data.drawnStudents) ? [...data.drawnStudents] : [],
            manuallyAddedStudents: Array.isArray(data.manuallyAddedStudents) ? [...data.manuallyAddedStudents] : [],
            classList: Array.isArray(data.classList) ? [...data.classList] : [],
            originalClassList: Array.isArray(data.originalClassList) ? [...data.originalClassList] : [],
            totalUniqueStudents: typeof data.totalUniqueStudents === 'number' ? data.totalUniqueStudents : 0,
            unnamedRunCounter: typeof data.unnamedRunCounter === 'number' ? data.unnamedRunCounter : 0,
            usedPrompts: (data.usedPrompts && typeof data.usedPrompts === 'object') ? data.usedPrompts : {}
        };
        localStorage.setItem('activityReports', JSON.stringify(activityReports));
    } catch (e) {
        console.error('Error copying working report to activityReports:', e);
    }
}

// Load saved data
function loadSavedData() {
    console.log('Loading saved data...');
    const savedData = localStorage.getItem('promptCategories');
    console.log('Saved data from localStorage:', savedData);
    
    if (savedData) {
        try {
        const data = JSON.parse(savedData);
            console.log('Parsed data:', data);
        
        // Set objective
            const objectiveInput = document.getElementById('objective-input');
            if (objectiveInput) {
                objectiveInput.value = data.objective || '';
            }

            // Set prompt1 interests mode
            const prompt1InterestsModeCheckbox = document.getElementById('prompt1-interests-mode');
            if (prompt1InterestsModeCheckbox) {
                prompt1InterestsModeCheckbox.checked = data.prompt1InterestsMode || false;
            }

            // Don't load class list from localStorage - start fresh each time
            classList = [];
            console.log('Class list reset to empty (not loaded from localStorage)');
            
            // Constraint is always enabled (no UI element needed)

            // Prompt count is now handled in the prompting window (sketch-refactored.js)
            

            // Clear existing UI elements
        const promptHeaders = document.getElementById('prompt-headers');
        const addButton = promptHeaders.querySelector('.add-prompt-button');
                
                // Remove the add button temporarily to preserve it
                if (addButton) {
                    addButton.remove();
                }
                
        promptHeaders.innerHTML = '';
                
                // Add the add button back
                if (addButton) {
            promptHeaders.appendChild(addButton);
                }
        
        document.getElementById('categories-container').innerHTML = '';
        promptCounter = 0;
        categoryCounter = 0;

                // Add headers/prompts first
                if (data.categories && Object.keys(data.categories).length > 0) {
            Object.entries(data.categories).forEach(([header]) => {
                addNewPrompt();
                const headerInputs = document.querySelectorAll('.header-input');
                headerInputs[headerInputs.length - 1].value = header;
            });

            // Add categories and fill in prompts using new grid structure
                    const firstCategoryData = Object.values(data.categories)[0];
                    if (firstCategoryData && Object.keys(firstCategoryData).length > 0) {
                        Object.keys(firstCategoryData).forEach((categoryLabel) => {
                addNewCategory();
                
                // Fill in criterion label and textareas using grid structure
                const criterionInputs = document.querySelectorAll('.criterion-label-input');
                const textareas = document.querySelectorAll('.textarea-container textarea');
                const currentRowIndex = criterionInputs.length - 1;
                const promptCount = document.querySelectorAll('.header-input').length;
                
                // Set criterion label
                if (criterionInputs[currentRowIndex]) {
                    criterionInputs[currentRowIndex].value = categoryLabel;
                }
                
                Object.entries(data.categories).forEach(([header, categoryData], columnIndex) => {
                    const textareaIndex = currentRowIndex * promptCount + columnIndex;
                    const textarea = textareas[textareaIndex];
                    if (textarea && categoryData[categoryLabel]) {
                        textarea.value = categoryData[categoryLabel].join('\n');
                    }
                });
            });
                    }
                }

            // Ensure we have at least one prompt and category
            if (promptCounter === 0) {
                addNewPrompt();
            }
            if (categoryCounter === 0) {
                addNewCategory();
            }
            
            // Update grid columns after loading data
            if (window.updateGridColumns) {
                window.updateGridColumns();
            }

            // Update add button visibility based on number of prompts
            if (addButton) {
                addButton.style.display = promptCounter >= MAX_PROMPTS ? 'none' : 'flex';
                }

        // Update prompt count displays AFTER UI is built
        setTimeout(() => {
            updatePromptCounts();
            // Attach event listeners to all textareas and auto-resize
            if (window.attachTextareaEventListeners) {
                window.attachTextareaEventListeners();
            } else if (window.autoResizeTextareasInRows) {
                window.autoResizeTextareasInRows();
            }
            if (window.refreshPromptCube) {
                window.refreshPromptCube();
            }
        }, 200);
                
                console.log('Successfully loaded saved data');
                console.log('Final state after loading:');
                console.log('- Objective:', document.getElementById('objective-input').value);
                console.log('- Constraint enabled: true (always)');
                console.log('- Prompt headers:', document.querySelectorAll('.header-input').length);
                console.log('- Category rows:', document.querySelectorAll('.category-row').length);
                
                // Show a brief success message
                const indicator = document.getElementById('auto-save-indicator');
                if (indicator) {
                    indicator.textContent = 'Data loaded successfully';
                    indicator.style.display = 'inline';
                    indicator.style.color = 'var(--primary-color)';
                    setTimeout(() => {
                        indicator.style.display = 'none';
                    }, 3000);
                }
                
        } catch (error) {
            console.error('Error parsing saved data:', error);
            // If parsing fails, initialize with defaults
            initializeDefaultState();
        }
    } else {
        console.log('No saved data found, initializing with defaults');
        // If no saved data, initialize with defaults
        initializeDefaultState();
    }
}

// Export settings as CSV
function exportSettings() {
    // Get current data (not just selected activity)
    const currentData = {
        activityName: currentLoadedActivity || 'Untitled Activity',
        objective: document.getElementById('objective-input').value,
        theme: localStorage.getItem('selectedTheme') || 'windows',
        background: localStorage.getItem('selectedBackground') || 'black',
        prompt1InterestsMode: document.getElementById('prompt1-interests-mode').checked,
        criterionLabels: criterionLabels,
        categories: {},
        promptHeaders: [],
        timestamp: new Date().toISOString()
    };
    
    console.log('DEBUG: Exporting data:', currentData);
    
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
    
    // Create CSV export data
    let csvContent = `PromptMe Activity Export\n`;
    csvContent += `Exported: ${new Date().toLocaleString()}\n`;
    csvContent += `Activity Name: ${currentData.activityName}\n`;
    csvContent += `Objective: ${currentData.objective || 'No objective set'}\n`;
    csvContent += `Theme: ${currentData.theme}\n`;
    csvContent += `Background: ${currentData.background}\n`;
    csvContent += `Prompt 1 Interests Mode: ${currentData.prompt1InterestsMode ? 'Yes' : 'No'}\n`;
    csvContent += `Criterion Labels: ${currentData.criterionLabels.join(', ')}\n\n`;
    
    console.log('DEBUG: CSV content so far:', csvContent);
    
    // Add headers
    let headers = currentData.promptHeaders;
    if (headers.length === 0) {
        // Generate default headers based on category data
        const maxColumns = Math.max(...Object.values(currentData.categories).map(arr => Array.isArray(arr) ? arr.length : 0), 1);
        headers = Array.from({length: maxColumns}, (_, i) => `PROMPT ${i + 1}`);
    }
    csvContent += `Category,${headers.join(',')}\n`;
    
    // Add category data
    Object.keys(currentData.categories).forEach(category => {
        const categoryData = currentData.categories[category];
        if (Array.isArray(categoryData)) {
            // New format: array of arrays
            const maxRows = Math.max(...categoryData.map(arr => arr.length));
            for (let i = 0; i < maxRows; i++) {
                const row = [category];
                categoryData.forEach(promptData => {
                    row.push(promptData[i] || '');
                });
                csvContent += row.join(',') + '\n';
            }
        } else {
            // Old format fallback
            csvContent += `${category},${(categoryData || []).join(',')}\n`;
        }
    });
    
    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `promptme-activity-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('Activity exported as CSV successfully!');
}

// Import settings from CSV
function importSettings() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv';
    fileInput.style.display = 'none';
        
        fileInput.onchange = function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                        const csvText = e.target.result;
                        const lines = csvText.split('\n');
                        
                        // Parse CSV data
                        let activityName = '';
                        let objective = '';
                        let theme = 'windows';
                        let background = 'black';
                        let prompt1InterestsMode = false;
                        let criterionLabels = ['', '', '', '']; // No hardcoded defaults - start empty
                        let promptHeaders = [];
                        let categories = {};
                        
                        // Extract metadata
                        for (let i = 0; i < lines.length; i++) {
                            const line = lines[i].trim();
                            console.log(`DEBUG: Parsing line ${i}:`, line);
                            if (line.startsWith('Activity Name: ')) {
                                activityName = line.replace('Activity Name: ', '');
                                console.log('DEBUG: Found activity name:', activityName);
                            } else if (line.startsWith('Objective: ')) {
                                objective = line.replace('Objective: ', '');
                                console.log('DEBUG: Found objective:', objective);
                            } else if (line.startsWith('Theme: ')) {
                                theme = line.replace('Theme: ', '');
                                console.log('DEBUG: Found theme:', theme);
                            } else if (line.startsWith('Background: ')) {
                                background = line.replace('Background: ', '');
                                console.log('DEBUG: Found background:', background);
                            } else if (line.startsWith('Prompt 1 Interests Mode: ')) {
                                prompt1InterestsMode = line.replace('Prompt 1 Interests Mode: ', '') === 'Yes';
                                console.log('DEBUG: Found prompt1InterestsMode:', prompt1InterestsMode);
                            } else if (line.startsWith('Criterion Labels: ')) {
                                const labelsText = line.replace('Criterion Labels: ', '');
                                criterionLabels = labelsText.split(', ').map(label => label.trim());
                                console.log('DEBUG: Found criterionLabels:', criterionLabels);
                            } else if (line.includes(',') && !line.startsWith('PromptMe') && !line.startsWith('Exported') && !line.startsWith('Activity Name') && !line.startsWith('Objective') && !line.startsWith('Theme') && !line.startsWith('Background') && !line.startsWith('Prompt 1') && !line.startsWith('Criterion')) {
                                // This is the header row or data row
                                if (line.startsWith('Category,')) {
                                    // Header row - extract prompt headers
                                    const headers = line.split(',').slice(1);
                                    promptHeaders = headers.map(h => h.trim());
                                    console.log('DEBUG: Found prompt headers:', promptHeaders);
                                } else if (line.includes(',')) {
                                    // Data row
                                    const parts = line.split(',');
                                    const category = parts[0].trim();
                                    const items = parts.slice(1).map(item => item.trim().replace(/"/g, ''));
                                    
                                    console.log('DEBUG: Processing data row - category:', category, 'items:', items);
                                    
                                    if (category) {
                                        if (!categories[category]) {
                                            // Initialize as array of arrays - one for each prompt column
                                            categories[category] = items.map(() => []);
                                        }
                                        
                                        // Add items to each prompt column
                                        items.forEach((item, index) => {
                                            if (item) {
                                                categories[category][index].push(item);
                                            }
                                        });
                                    }
                                }
                            }
                        }
                        
                        // Apply theme settings
                        if (theme) {
                            console.log('DEBUG: Applying theme:', theme);
                            localStorage.setItem('selectedTheme', theme);
                            changeTheme(theme);
                            // Update theme dropdown
                            const themeSelect = document.getElementById('theme-select');
                            if (themeSelect) {
                                themeSelect.value = theme;
                                console.log('DEBUG: Updated theme dropdown to:', theme);
                            }
                        }
                        if (background) {
                            console.log('DEBUG: Applying background:', background);
                            localStorage.setItem('selectedBackground', background);
                            changeBackground(background);
                            // Update background dropdown
                            const bgSelect = document.getElementById('bg-select');
                            if (bgSelect) {
                                bgSelect.value = background;
                                console.log('DEBUG: Updated background dropdown to:', background);
                            }
                        }
                        
                        // Apply prompt1InterestsMode
                        const interestsCheckbox = document.getElementById('prompt1-interests-mode');
                        if (interestsCheckbox) {
                            interestsCheckbox.checked = prompt1InterestsMode;
                        }
                        
                        // Apply criterion labels
                        window.criterionLabels = criterionLabels;
                        
                        // Apply objective
                        const objectiveInput = document.getElementById('objective-input');
                        if (objectiveInput) {
                            objectiveInput.value = objective;
                        }
                        
                        // Clear existing prompts and categories
                        const promptHeadersEl = document.getElementById('prompt-headers');
                        const addButton = promptHeadersEl.querySelector('.add-prompt-button');
                        
                        if (addButton) {
                            addButton.remove();
                        }
                        promptHeadersEl.innerHTML = '';
                        
                        if (addButton) {
                            promptHeadersEl.appendChild(addButton);
                        }
                        
                        const categoriesContainer = document.getElementById('categories-container');
                        categoriesContainer.innerHTML = '';
                        
                        // Reset counters
                    promptCounter = 0;
                    categoryCounter = 0;
                    
                        // Add prompt headers
                        console.log('DEBUG: Adding prompt headers:', promptHeaders);
                        promptHeaders.forEach(headerName => {
                            addNewPrompt();
                            const newHeaderInputs = document.querySelectorAll('.header-input');
                            const lastHeader = newHeaderInputs[newHeaderInputs.length - 1];
                            if (lastHeader) {
                                lastHeader.value = headerName;
                                console.log('DEBUG: Set header value:', headerName);
                            }
                        });
                        
                        // Add categories using new grid structure
                        console.log('DEBUG: Adding categories:', Object.keys(categories));
                        Object.keys(categories).forEach(categoryName => {
                            addNewCategory();
                            
                            // Get newly added row using grid structure
                            const criterionInputs = document.querySelectorAll('.criterion-label-input');
                            const textareas = document.querySelectorAll('.textarea-container textarea');
                            const lastRowIndex = criterionInputs.length - 1;
                            const promptCount = document.querySelectorAll('.header-input').length;
                            
                            // Set criterion label
                            if (criterionInputs[lastRowIndex]) {
                                criterionInputs[lastRowIndex].value = categoryName;
                            }
                            
                            const categoryData = categories[categoryName];
                            console.log('DEBUG: Adding category data for', categoryName, ':', categoryData);
                            
                            // Add data to each prompt column
                            categoryData.forEach((columnData, colIndex) => {
                                const textareaIndex = lastRowIndex * promptCount + colIndex;
                                const textarea = textareas[textareaIndex];
                                if (textarea && Array.isArray(columnData)) {
                                    // Join array items with newlines to match original format
                                    textarea.value = columnData.join('\n');
                                    console.log('DEBUG: Set textarea', colIndex, 'to:', columnData.length, 'items');
                                } else if (textarea && columnData) {
                                    // Fallback for non-array data
                                    textarea.value = Array.isArray(columnData) ? columnData.join('\n') : columnData;
                                }
                            });
                        });
                        
                        // Update grid columns after importing
                        if (window.updateGridColumns) {
                            window.updateGridColumns();
                        }
                        
                        // Update prompt counts
                        updateColumnCounts();
                        
                        // Save to main promptCategories localStorage
                        saveChanges();
                        
                        // Add to Activity History using the imported activity name
                        if (activityName) {
                            saveNewSettings(activityName);
                            console.log('DEBUG: Added imported activity to history:', activityName);
                        } else {
                            const fallbackName = `Imported Activity ${new Date().toLocaleString()}`;
                            saveNewSettings(fallbackName);
                            console.log('DEBUG: Added imported activity to history with fallback name:', fallbackName);
                        }
                        
                        // Update button states
                        updateButtonStates();
                        if (window.refreshPromptCube) {
                            window.refreshPromptCube();
                        }
                        
                        console.log('DEBUG: Import completed successfully');
                        console.log('DEBUG: Final parsed data:', {
                            activityName, objective, theme, background, prompt1InterestsMode, 
                            criterionLabels, promptHeaders, categories
                        });
                        
                        alert('Activity imported successfully!');
                        
                } catch (error) {
                        alert('Error importing CSV file: ' + error.message);
                }
            };
            reader.readAsText(file);
        }
        };
        
        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
    }

// Make functions globally available
window.saveChanges = saveChanges;
window.autoSaveToLocalStorage = autoSaveToLocalStorage;
window.copyWorkingReportToActivityReports = copyWorkingReportToActivityReports;
window.loadSavedData = loadSavedData;
window.exportSettings = exportSettings;
window.importSettings = importSettings;
