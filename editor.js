document.addEventListener('DOMContentLoaded', () => {
    let categoryCounter = 0;
    let promptCounter = 0;
    const MAX_CATEGORIES = 6;
    const MAX_PROMPTS = 4;

    // Add these button variables at the top
    let downloadSettingsButton;
    let uploadSettingsButton;

    function addNewPrompt() {
        if (promptCounter >= MAX_PROMPTS) {
            alert(`Maximum of ${MAX_PROMPTS} prompts reached`);
            return;
        }
        const promptHeaders = document.getElementById('prompt-headers');
        
        // Create new prompt column
        const newPromptColumn = document.createElement('div');
        newPromptColumn.className = 'prompt-column';
        newPromptColumn.innerHTML = `
            <input type="text" class="header-input" placeholder="Enter Prompt ${promptCounter + 1}">
            <button class="delete-prompt" onclick="deletePrompt(this)">×</button>
            ${promptCounter >= 1 ? '<div class="horizontal-arrow">+</div>' : ''}
        `;
        
        // Add the new prompt to DOM
        promptHeaders.appendChild(newPromptColumn);
        
        // Add new textarea containers to existing categories
        const categoryRows = document.querySelectorAll('.category-row');
        categoryRows.forEach((row, rowIndex) => {
            const textareaContainer = document.createElement('div');
            textareaContainer.className = 'textarea-container';
            
            const textarea = document.createElement('textarea');
            textarea.placeholder = `Enter prompts for Prompt ${promptCounter + 1} (one per line)`;
            textareaContainer.appendChild(textarea);
            
            // Add vertical arrow if not last category
            if (rowIndex < categoryRows.length - 1) {
                const verticalArrow = document.createElement('div');
                verticalArrow.className = 'vertical-arrow';
                verticalArrow.innerHTML = '↓';
                textareaContainer.appendChild(verticalArrow);
            }
            
            row.appendChild(textareaContainer);
        });
        
        promptCounter++;
        
        // Update all arrows
        updateCategoryRows();
        
        // Update exhaust column options when new prompts are added
        updateExhaustColumnOptions();
    }

    function updateCategoryRows() {
        const categoryRows = document.querySelectorAll('.category-row');
        const promptColumns = document.querySelectorAll('.prompt-column');
        const promptCount = promptColumns.length;
        
        // Update delete button visibility - show for all prompts
        promptColumns.forEach((column, index) => {
            const deleteBtn = column.querySelector('.delete-prompt');
            if (deleteBtn) {
                deleteBtn.style.display = 'flex';
            }
            
            // Update horizontal arrows
            const existingArrow = column.querySelector('.horizontal-arrow');
            if (existingArrow) {
                existingArrow.remove();
            }
            if (index >= 1 && index < promptCount - 1) {
                const arrowDiv = document.createElement('div');
                arrowDiv.className = 'horizontal-arrow';
                arrowDiv.innerHTML = '+';
                column.appendChild(arrowDiv);
            }
        });
        
        categoryRows.forEach((row, rowIndex) => {
            const label = row.querySelector('.row-label');
            label.textContent = String.fromCharCode(65 + rowIndex);
            
            // Remove excess textareas and their containers
            const textareaContainers = row.querySelectorAll('.textarea-container');
            for (let i = textareaContainers.length - 1; i >= promptCount; i--) {
                textareaContainers[i].remove();
            }
            
            // Add new textareas if needed
            for (let i = textareaContainers.length; i < promptCount; i++) {
                const textareaContainer = document.createElement('div');
                textareaContainer.className = 'textarea-container';
                
                const textarea = document.createElement('textarea');
                textarea.placeholder = 'Enter prompts (one per line)';
                textareaContainer.appendChild(textarea);
                
                // Add vertical arrow if not last category
                if (rowIndex < categoryRows.length - 1) {
                    const verticalArrow = document.createElement('div');
                    verticalArrow.className = 'vertical-arrow';
                    verticalArrow.innerHTML = '↓';
                    textareaContainer.appendChild(verticalArrow);
                }
                
                row.appendChild(textareaContainer);
            }
            
            // Update existing containers' arrows
            const containers = row.querySelectorAll('.textarea-container');
            containers.forEach((container) => {
                // Remove any existing arrows
                const existingArrow = container.querySelector('.vertical-arrow');
                if (existingArrow) {
                    existingArrow.remove();
                }
                
                // Add vertical arrow if not last category
                if (rowIndex < categoryRows.length - 1) {
                    const verticalArrow = document.createElement('div');
                    verticalArrow.className = 'vertical-arrow';
                    verticalArrow.innerHTML = '↓';
                    container.appendChild(verticalArrow);
                }
            });
        });
    }

    function addNewCategory() {
        if (categoryCounter >= MAX_CATEGORIES) {
            alert(`Maximum of ${MAX_CATEGORIES} categories reached`);
            return;
        }
        const categoriesContainer = document.getElementById('categories-container');
        const newCategory = document.createElement('div');
        newCategory.className = 'category-row';
        categoryCounter++;
        
        // Create category label container
        const labelContainer = document.createElement('div');
        labelContainer.className = 'row-label-container';
        labelContainer.innerHTML = `
            <button class="delete-category" onclick="deleteCategory(this.closest('.category-row'))">x</button>
            <div class="row-label">${String.fromCharCode(64 + categoryCounter)}</div>
        `;
        
        newCategory.appendChild(labelContainer);
        
        // Add a textarea for each existing prompt column
        const promptCount = document.querySelectorAll('.prompt-column').length;
        for (let i = 0; i < promptCount; i++) {
            const textareaContainer = document.createElement('div');
            textareaContainer.className = 'textarea-container';
            
            const textarea = document.createElement('textarea');
            textarea.placeholder = 'Enter prompts (one per line)';
            textareaContainer.appendChild(textarea);
            
            // Add vertical arrow if not the last category
            if (categoryCounter < MAX_CATEGORIES) {
                const verticalArrow = document.createElement('div');
                verticalArrow.className = 'vertical-arrow';
                verticalArrow.innerHTML = '↓';
                textareaContainer.appendChild(verticalArrow);
            }
            
            newCategory.appendChild(textareaContainer);
        }
        
        categoriesContainer.appendChild(newCategory);
        updateCategoryRows();
    }

    function deletePrompt(button) {
        const promptColumn = button.closest('.prompt-column');
        const promptColumns = document.querySelectorAll('.prompt-column');
        
        // Only prevent deletion if it would leave us with less than 1 prompt
        if (promptColumns.length <= 1) {
            return;
        }
        
        // Remove corresponding textarea from each category row
        const categoryRows = document.querySelectorAll('.category-row');
        const promptIndex = Array.from(promptColumns).indexOf(promptColumn);
        
        categoryRows.forEach(row => {
            const textareas = row.querySelectorAll('.textarea-container');
            if (textareas[promptIndex]) {
                textareas[promptIndex].remove();
            }
        });
        
        promptColumn.remove();
        promptCounter--;
        
        // Show the add button if we're below MAX_PROMPTS
        const addButton = document.querySelector('.add-prompt-button');
        if (addButton && promptCounter < MAX_PROMPTS) {
            addButton.style.display = 'flex';
        }
        
        updateCategoryRows();
        
        // Update exhaust column options when prompts are deleted
        updateExhaustColumnOptions();
    }

    function deleteCategory(categoryRow) {
        const categoryRows = document.querySelectorAll('.category-row');
        
        // Don't allow deletion if:
        // 1. It's the first category (A)
        // 2. It would leave us with less than 1 category
        if (categoryRows.length <= 1 || categoryRow === categoryRows[0]) {
            return;
        }
        
        categoryRow.remove();
        categoryCounter--;
        updateCategoryRows();
    }

    function saveChanges() {
        const data = {
            objective: document.getElementById('objective-input').value,
            constraintEnabled: true, // Always enabled now
            constraintSettings: {}, // No longer needed
            exhaustMode: document.getElementById('exhaust-checkbox').checked,
            exhaustModeType: getExhaustMode(),
            exhaustSettings: getExhaustSettings(),
            exhaustColumn: document.getElementById('exhaust-column-select').value,
            currentTheme: window.currentTheme || 'apple2',
            categories: {}
        };

        // Get all headers (column labels)
        const headers = document.querySelectorAll('.header-input');
        const categoryRows = document.querySelectorAll('.category-row');

        // For each header/column
        headers.forEach((header, columnIndex) => {
            const headerText = header.value.trim() || `PROMPT ${columnIndex + 1}`;
            data.categories[headerText] = {};
            
            // For each category (A, B, C, D)
            categoryRows.forEach((row, rowIndex) => {
                const categoryLabel = String.fromCharCode(65 + rowIndex);
                const textarea = row.querySelectorAll('textarea')[columnIndex];
                
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

        // Debug logs to verify the data being saved
        console.log('Saving data:', data);

        localStorage.setItem('promptCategories', JSON.stringify(data));
        alert('Changes saved!');
    }

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

    function loadSavedData() {
        console.log('Loading saved data...');
        
        // Check if required elements exist
        const objectiveInput = document.getElementById('objective-input');
        const exhaustCheckbox = document.getElementById('exhaust-checkbox');
        
        if (!objectiveInput || !exhaustCheckbox) {
            console.error('Required HTML elements not found, retrying in 200ms...');
            setTimeout(() => {
                loadSavedData();
            }, 200);
            return;
        }
        
        const savedData = localStorage.getItem('promptCategories');
        console.log('Saved data from localStorage:', savedData);
        
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                console.log('Parsed data:', data);
                
                // Set objective
                if (objectiveInput) {
                    objectiveInput.value = data.objective || '';
                    console.log('Set objective to:', objectiveInput.value);
                }
                
                // Constraint is always enabled now - no need to load setting
                console.log('Constraint prevention is always enabled');

                // Set exhaust mode setting
                if (exhaustCheckbox) {
                    exhaustCheckbox.checked = data.exhaustMode === true; // Default to false if not specified
                    console.log('Set exhaust checkbox to:', exhaustCheckbox.checked);
                }

                // Set exhaust mode type
                if (data.exhaustModeType) {
                    const exhaustModeRadio = document.querySelector(`input[name="exhaust-mode"][value="${data.exhaustModeType}"]`);
                    if (exhaustModeRadio) {
                        exhaustModeRadio.checked = true;
                        console.log('Set exhaust mode to:', data.exhaustModeType);
                    }
                }

                // Set exhaust column selection
                if (data.exhaustColumn) {
                    const exhaustColumnSelect = document.getElementById('exhaust-column-select');
                    if (exhaustColumnSelect) {
                        exhaustColumnSelect.value = data.exhaustColumn;
                        console.log('Set exhaust column to:', data.exhaustColumn);
                    }
                }
                
                // Set theme setting
                if (data.currentTheme) {
                    selectTheme(data.currentTheme);
                    console.log('Set theme to:', data.currentTheme);
                }

                // Don't update exhaust control visibility here - it will be called after prompt headers are loaded

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

                    // Add categories and fill in prompts
                    const firstCategoryData = Object.values(data.categories)[0];
                    if (firstCategoryData && Object.keys(firstCategoryData).length > 0) {
                        Object.keys(firstCategoryData).forEach((categoryLabel) => {
                            addNewCategory();
                            const categoryRows = document.querySelectorAll('.category-row');
                            const currentRow = categoryRows[categoryRows.length - 1];
                            
                            Object.entries(data.categories).forEach(([header, categoryData], columnIndex) => {
                                const textarea = currentRow.querySelectorAll('textarea')[columnIndex];
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

                // Update exhaust control visibility after all data is loaded
                updateExhaustControlVisibility();
                
                // Set exhaust column value after options are populated
                if (data.exhaustColumn) {
                    const exhaustColumnSelect = document.getElementById('exhaust-column-select');
                    if (exhaustColumnSelect) {
                        // Wait a bit for the options to be populated
                        setTimeout(() => {
                            exhaustColumnSelect.value = data.exhaustColumn;
                            console.log('Set exhaust column to (after delay):', data.exhaustColumn);
                        }, 100);
                    }
                }

                // Update add button visibility based on number of prompts
                if (addButton) {
                    addButton.style.display = promptCounter >= MAX_PROMPTS ? 'none' : 'flex';
                }

                // Constraint controls are no longer needed - repetition prevention is always on
                // Exhaust controls are simplified to just one toggle
                
                console.log('Successfully loaded saved data');
                console.log('Final state after loading:');
                console.log('- Objective:', document.getElementById('objective-input').value);
                console.log('- Constraint enabled: true (always on)');
                console.log('- Exhaust mode:', document.getElementById('exhaust-checkbox').checked);
                console.log('- Prompt headers:', document.querySelectorAll('.header-input').length);
                console.log('- Category rows:', document.querySelectorAll('.category-row').length);
                
                // Show a brief success message
                const indicator = document.getElementById('auto-save-indicator');
                if (indicator) {
                    indicator.textContent = '✓ Data loaded successfully';
                    indicator.style.display = 'inline';
                    indicator.style.color = '#00FF00';
                    setTimeout(() => {
                        indicator.style.display = 'none';
                    }, 3000);
                }
                
                // Also show an alert for testing
                console.log('🎉 SUCCESS: All data loaded from localStorage!');
                console.log('You can now refresh the page and your data should persist.');
                
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

    function downloadSettings() {
        const savedData = localStorage.getItem('promptCategories');
        if (savedData) {
            const blob = new Blob([savedData], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'prompt_settings.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }

    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const settings = JSON.parse(e.target.result);
                    localStorage.setItem('promptCategories', JSON.stringify(settings));
                    loadSavedData(); // Refresh the interface with new data
                    alert('Settings uploaded successfully!');
                } catch (error) {
                    alert('Error parsing settings file: ' + error.message);
                }
            };
            reader.readAsText(file);
        }
    }

    function downloadSpreadsheet() {
        console.log("Starting download...");
        
        // Get headers (prompt types)
        const headerInputs = document.querySelectorAll('.header-input');
        const headers = Array.from(headerInputs).map(input => input.value || 'Untitled');
        console.log("Headers:", headers);
        
        // Create CSV content
        let csvContent = 'Category,' + headers.join(',') + '\n';
        console.log("Initial CSV header:", csvContent);
        
        // Add each category's prompts
        const categoryRows = document.querySelectorAll('.category-row');
        console.log("Number of category rows:", categoryRows.length);
        
        categoryRows.forEach((row, index) => {
            const categoryLabel = row.querySelector('.row-label').textContent;
            const textareas = row.querySelectorAll('textarea');
            console.log(`Category ${categoryLabel} has ${textareas.length} textareas`);
            
            let rowData = [];
            textareas.forEach(textarea => {
                const value = textarea.value.trim();
                console.log(`Textarea value for ${categoryLabel}:`, value);
                rowData.push(`"${value.replace(/\n/g, ';')}"`);
            });
            
            csvContent += `${categoryLabel},${rowData.join(',')}\n`;
            console.log(`Row ${index} content:`, `${categoryLabel},${rowData.join(',')}`);
        });

        // Add objective
        const objective = document.getElementById('objective-input').value;
        console.log("Objective:", objective);
        if (objective) {
            csvContent += `\nObjective,"${objective}"`;
        }
        
        console.log("Final CSV content:", csvContent);
        
        // Create and trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        console.log("Blob size:", blob.size);
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'prompt_settings.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }

    function handleSpreadsheetUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const text = e.target.result;
                    const rows = text.split('\n').map(row => 
                        row.split(',').map(cell => 
                            // Remove quotes and convert semicolons back to newlines
                            cell.trim().replace(/^"(.*)"$/, '$1').replace(/;/g, '\n')
                        )
                    );
                    
                    // Clear existing content
                    const promptHeaders = document.getElementById('prompt-headers');
                    const addButton = promptHeaders.querySelector('.add-prompt-button');
                    promptHeaders.innerHTML = '';
                    promptHeaders.appendChild(addButton);
                    
                    document.getElementById('categories-container').innerHTML = '';
                    promptCounter = 0;
                    categoryCounter = 0;
                    
                    // Add headers (skip first column as it's category labels)
                    const headers = rows[0].slice(1);
                    headers.forEach(header => {
                        if (header && header !== 'Untitled') {
                            addNewPrompt();
                            const headerInputs = document.querySelectorAll('.header-input');
                            headerInputs[headerInputs.length - 1].value = header;
                        }
                    });
                    
                    // Add categories and prompts (skip header row)
                    rows.slice(1).forEach(row => {
                        if (row[0] && row[0] !== 'Objective') { // Skip objective row
                            addNewCategory();
                            const categoryRows = document.querySelectorAll('.category-row');
                            const currentRow = categoryRows[categoryRows.length - 1];
                            
                            // Fill in prompts
                            row.slice(1).forEach((cellValue, index) => {
                                const textarea = currentRow.querySelectorAll('textarea')[index];
                                if (textarea) {
                                    textarea.value = cellValue;
                                }
                            });
                        } else if (row[0] === 'Objective') {
                            // Set objective
                            document.getElementById('objective-input').value = row[1] || '';
                        }
                    });
                    
                    alert('Spreadsheet uploaded successfully!');
                } catch (error) {
                    alert('Error parsing spreadsheet: ' + error.message);
                }
            };
            reader.readAsText(file);
        }
    }

    // Theme selection function
    function selectTheme(themeKey) {
        // Remove active class from all theme buttons
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active class to selected theme button
        const selectedBtn = document.querySelector(`[data-theme="${themeKey}"]`);
        if (selectedBtn) {
            selectedBtn.classList.add('active');
        }
        
        // Store current theme globally
        window.currentTheme = themeKey;
        
        // Save theme to localStorage
        localStorage.setItem('currentTheme', themeKey);
        
        // Auto-save all changes
        autoSave();
        
        console.log('Theme selected:', themeKey);
    }

    // Auto-save function
    function autoSave() {
        const data = {
            objective: document.getElementById('objective-input').value,
            constraintEnabled: true, // Always enabled now
            constraintSettings: {}, // No longer needed
            exhaustMode: document.getElementById('exhaust-checkbox').checked,
            exhaustModeType: getExhaustMode(),
            exhaustSettings: getExhaustSettings(),
            exhaustColumn: document.getElementById('exhaust-column-select').value,
            currentTheme: window.currentTheme || 'apple2',
            categories: {}
        };

        // Get all headers (column labels)
        const headers = document.querySelectorAll('.header-input');
        const categoryRows = document.querySelectorAll('.category-row');

        // For each header/column
        headers.forEach((header, columnIndex) => {
            const headerText = header.value.trim() || `PROMPT ${columnIndex + 1}`;
            data.categories[headerText] = {};
            
            // For each category (A, B, C, D)
            categoryRows.forEach((row, rowIndex) => {
                const categoryLabel = String.fromCharCode(65 + rowIndex);
                const textarea = row.querySelectorAll('textarea')[columnIndex];
                
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

        // Save to localStorage
        localStorage.setItem('promptCategories', JSON.stringify(data));
        console.log('Auto-saved changes to localStorage');
        console.log('Saved data structure:', data);
        
        // Verify the data was saved
        const verifyData = localStorage.getItem('promptCategories');
        if (verifyData) {
            console.log('✓ Data successfully saved to localStorage');
        } else {
            console.error('✗ Failed to save data to localStorage');
        }
        
        // Show auto-save indicator
        const indicator = document.getElementById('auto-save-indicator');
        if (indicator) {
            indicator.style.display = 'inline';
            setTimeout(() => {
                indicator.style.display = 'none';
            }, 2000);
        }
    }

    // Quick test function
    function quickTest() {
        // Auto-save first
        autoSave();
        
        // Open the sketch app directly in a new tab for testing
        window.open('sketch.html', '_blank');
    }

    // Attach functions to window object AFTER they are defined
    window.addNewPrompt = addNewPrompt;
    window.addNewCategory = addNewCategory;
    window.deletePrompt = deletePrompt;
    window.deleteCategory = deleteCategory;
    window.saveChanges = saveChanges;
    window.quickTest = quickTest;
    window.returnToApp = () => window.location.href = 'index.html';
    window.downloadSettings = downloadSettings;
    window.handleFileUpload = handleFileUpload;
    window.downloadSpreadsheet = downloadSpreadsheet;
    window.handleSpreadsheetUpload = handleSpreadsheetUpload;
    window.selectTheme = selectTheme;

    // Add auto-save triggers to all input fields
    // Constraint control functions removed - repetition prevention is always enabled

    // Exhaust control functions removed - simplified to just one toggle
    function getExhaustMode() {
        return 'row'; // Default mode, not used in simplified system
    }

    function getExhaustSettings() {
        return {}; // Simplified system - no complex exhaust settings
    }

    function updateExhaustControlVisibility() {
        const exhaustCheckbox = document.getElementById('exhaust-checkbox');
        const exhaustColumnSection = document.getElementById('exhaust-column-section');
        
        if (exhaustCheckbox && exhaustColumnSection) {
            if (exhaustCheckbox.checked) {
                exhaustColumnSection.style.display = 'flex';
                updateExhaustColumnOptions();
            } else {
                exhaustColumnSection.style.display = 'none';
            }
        }
    }

    function updateExhaustColumnOptions() {
        const exhaustColumnSelect = document.getElementById('exhaust-column-select');
        if (!exhaustColumnSelect) return;

        // Store current selection
        const currentSelection = exhaustColumnSelect.value;

        // Clear existing options except the first one
        exhaustColumnSelect.innerHTML = '<option value="">Select a prompt column...</option>';

        // Get all prompt headers
        const promptHeaders = document.querySelectorAll('.header-input');
        promptHeaders.forEach((header, index) => {
            const promptName = header.value.trim() || `Prompt ${index + 1}`;
            const option = document.createElement('option');
            option.value = promptName;
            option.textContent = promptName;
            exhaustColumnSelect.appendChild(option);
        });

        // Restore selection if it still exists
        if (currentSelection && Array.from(exhaustColumnSelect.options).some(option => option.value === currentSelection)) {
            exhaustColumnSelect.value = currentSelection;
        }
    }

    function setupAutoSave() {
        // Auto-save on objective input change
        const objectiveInput = document.getElementById('objective-input');
        if (objectiveInput) {
            objectiveInput.addEventListener('input', autoSave);
        }
        
        // Constraint checkbox removed - repetition prevention is always enabled
        
        // Auto-save on exhaust checkbox change
        const exhaustCheckbox = document.getElementById('exhaust-checkbox');
        if (exhaustCheckbox) {
            exhaustCheckbox.addEventListener('change', () => {
                updateExhaustControlVisibility();
                updateExhaustColumnOptions();
                autoSave();
            });
        }

        // Auto-save on exhaust column selection change
        const exhaustColumnSelect = document.getElementById('exhaust-column-select');
        if (exhaustColumnSelect) {
            exhaustColumnSelect.addEventListener('change', autoSave);
        }

        // Update exhaust column options when prompt headers change
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('header-input')) {
                updateExhaustColumnOptions();
            }
        });

        // Auto-save on exhaust mode change
        const exhaustModeRadios = document.querySelectorAll('input[name="exhaust-mode"]');
        exhaustModeRadios.forEach(radio => {
            radio.addEventListener('change', autoSave);
        });
        
        // Auto-save on header input changes
        document.addEventListener('input', (event) => {
            if (event.target.classList.contains('header-input')) {
                autoSave();
            }
        });
        
        // Auto-save on textarea changes
        document.addEventListener('input', (event) => {
            if (event.target.tagName === 'TEXTAREA') {
                autoSave();
            }
        });
    }

    // ESC key handler removed - handled by individual pages now

    // Find the buttons container and set up spreadsheet buttons
    const buttonsContainer = document.querySelector('.buttons');
    
    // Create Download button
    const downloadButton = document.createElement('button');
    downloadButton.textContent = 'DOWNLOAD SPREADSHEET';
    downloadButton.className = 'save';  // Use same style as save button
    downloadButton.onclick = downloadSpreadsheet;
    
    // Create Upload button
    const uploadButton = document.createElement('button');
    uploadButton.textContent = 'UPLOAD SPREADSHEET';
    uploadButton.className = 'save';
    
    // File input for CSV
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv';
    fileInput.style.display = 'none';
    fileInput.onchange = handleSpreadsheetUpload;
    
    uploadButton.onclick = () => fileInput.click();

    // Add the buttons before the return button
    const returnButton = buttonsContainer.querySelector('.return');
    buttonsContainer.insertBefore(downloadButton, returnButton);
    buttonsContainer.insertBefore(uploadButton, returnButton);
    buttonsContainer.appendChild(fileInput);

    // Style the buttons to match retro terminal theme
    [downloadButton, uploadButton].forEach(button => {
        button.style.backgroundColor = '#FFFFFF';  // White background
        button.style.color = '#000000';  // Green text
        button.style.fontSize = '16px';
        button.style.padding = '15px 30px';
        button.style.border = '1px solid #000000';  // Green border
        button.style.borderRadius = '4px';
        button.style.cursor = 'pointer';
        button.style.fontFamily = 'VT323, monospace';
        button.style.width = 'auto';
        button.style.margin = '10px';
        button.style.textTransform = 'uppercase';
    });
    
    // Update hover effect for download/upload buttons only
    [downloadButton, uploadButton].forEach(button => {
        button.onmouseover = () => {
            button.style.backgroundColor = '#00FF00';
            button.style.color = '#FFFFFF';
        };
        button.onmouseout = () => {
            button.style.backgroundColor = '#FFFFFF';
            button.style.color = '#00FF00';
        };
    });

    // Test localStorage availability
    function testLocalStorage() {
        try {
            const testKey = 'test-localStorage';
            localStorage.setItem(testKey, 'test');
            const testValue = localStorage.getItem(testKey);
            localStorage.removeItem(testKey);
            if (testValue === 'test') {
                console.log('✓ localStorage is working');
                return true;
            } else {
                console.error('✗ localStorage test failed');
                return false;
            }
        } catch (error) {
            console.error('✗ localStorage not available:', error);
            return false;
        }
    }
    
    // Initialize the editor with a delay to ensure all elements are ready
    setTimeout(() => {
        console.log('Initializing editor...');
        if (testLocalStorage()) {
            loadSavedData();
        } else {
            console.error('localStorage not available, initializing with defaults');
            initializeDefaultState();
        }
    }, 100);
    
    // Setup auto-save functionality
    setupAutoSave();
    
    // Reload data when returning from randomizer (page becomes visible again)
    document.addEventListener('visibilitychange', () => {
        console.log('Visibility changed, hidden:', document.hidden);
        if (!document.hidden) {
            // Page became visible again, reload data
            console.log('Page became visible, reloading data...');
            setTimeout(() => {
                loadSavedData();
            }, 100); // Small delay to ensure page is fully loaded
        }
    });
    
    // Also reload data when window gains focus (additional safety)
    window.addEventListener('focus', () => {
        console.log('Window gained focus, reloading data...');
        setTimeout(() => {
            loadSavedData();
        }, 100);
    });
    
    // Auto-save before leaving the page
    window.addEventListener('beforeunload', () => {
        console.log('Page unloading, auto-saving...');
        autoSave();
    });

    // Add debug logs back
    console.log('Final prompt headers:', document.querySelectorAll('.header-input'));
    console.log('Final category rows:', document.querySelectorAll('.category-row'));
    
    // Add debug functions to window for testing
    window.debugEditor = {
        testSave: () => {
            console.log('Testing save...');
            autoSave();
            const saved = localStorage.getItem('promptCategories');
            console.log('Saved data:', saved ? JSON.parse(saved) : 'No data');
        },
        testLoad: () => {
            console.log('Testing load...');
            loadSavedData();
        },
        clearData: () => {
            console.log('Clearing localStorage...');
            localStorage.removeItem('promptCategories');
            console.log('localStorage cleared');
        },
        showData: () => {
            const data = localStorage.getItem('promptCategories');
            console.log('Current localStorage data:', data ? JSON.parse(data) : 'No data');
        }
    };
    
    console.log('Debug functions available: window.debugEditor.testSave(), window.debugEditor.testLoad(), window.debugEditor.clearData(), window.debugEditor.showData()');
});
