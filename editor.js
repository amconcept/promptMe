    // Theme Management
    const themes = {
        orange: {
            '--primary-color': '#D2691E',
            '--primary-hover': '#CD853F',
            '--primary-shadow': 'rgba(210, 105, 30, 0.3)',
            '--primary-shadow-hover': 'rgba(210, 105, 30, 0.5)',
            '--primary-shadow-light': 'rgba(210, 105, 30, 0.1)',
            '--accent-color': '#FF7F7F',
            '--background-color': '#000000',
            '--text-color': '#FFFFFF',
            '--border-color': '#333',
            '--delete-color': '#FF6B6B',
            '--frame-color': '#D2691E',
            '--frame-border': '#D2691E',
            '--frame-background': '#000000'
        },
        blue: {
            '--primary-color': '#4A90E2',
            '--primary-hover': '#6BB6FF',
            '--primary-shadow': 'rgba(74, 144, 226, 0.3)',
            '--primary-shadow-hover': 'rgba(74, 144, 226, 0.5)',
            '--primary-shadow-light': 'rgba(74, 144, 226, 0.1)',
            '--accent-color': '#7FB3FF',
            '--background-color': '#000000',
            '--text-color': '#FFFFFF',
            '--border-color': '#333',
            '--delete-color': '#FF6B6B',
            '--frame-color': '#4A90E2',
            '--frame-border': '#4A90E2',
            '--frame-background': '#000000'
        },
        green: {
            '--primary-color': '#4CAF50',
            '--primary-hover': '#66BB6A',
            '--primary-shadow': 'rgba(76, 175, 80, 0.3)',
            '--primary-shadow-hover': 'rgba(76, 175, 80, 0.5)',
            '--primary-shadow-light': 'rgba(76, 175, 80, 0.1)',
            '--accent-color': '#81C784',
            '--background-color': '#000000',
            '--text-color': '#FFFFFF',
            '--border-color': '#333',
            '--delete-color': '#FF6B6B',
            '--frame-color': '#4CAF50',
            '--frame-border': '#4CAF50',
            '--frame-background': '#000000'
        },
        purple: {
            '--primary-color': '#9C27B0',
            '--primary-hover': '#BA68C8',
            '--primary-shadow': 'rgba(156, 39, 176, 0.3)',
            '--primary-shadow-hover': 'rgba(156, 39, 176, 0.5)',
            '--primary-shadow-light': 'rgba(156, 39, 176, 0.1)',
            '--accent-color': '#CE93D8',
            '--background-color': '#000000',
            '--text-color': '#FFFFFF',
            '--border-color': '#333',
            '--delete-color': '#FF6B6B',
            '--frame-color': '#9C27B0',
            '--frame-border': '#9C27B0',
            '--frame-background': '#000000'
        },
        pink: {
            '--primary-color': '#E91E63',
            '--primary-hover': '#F06292',
            '--primary-shadow': 'rgba(233, 30, 99, 0.3)',
            '--primary-shadow-hover': 'rgba(233, 30, 99, 0.5)',
            '--primary-shadow-light': 'rgba(233, 30, 99, 0.1)',
            '--accent-color': '#F8BBD9',
            '--background-color': '#000000',
            '--text-color': '#FFFFFF',
            '--border-color': '#333',
            '--delete-color': '#FF6B6B',
            '--frame-color': '#E91E63',
            '--frame-border': '#E91E63',
            '--frame-background': '#000000'
        },
        white: {
            '--primary-color': '#FFFFFF',
            '--primary-hover': '#F0F0F0',
            '--primary-shadow': 'rgba(255, 255, 255, 0.3)',
            '--primary-shadow-hover': 'rgba(255, 255, 255, 0.5)',
            '--primary-shadow-light': 'rgba(255, 255, 255, 0.1)',
            '--accent-color': '#E0E0E0',
            '--background-color': '#000000',
            '--text-color': '#FFFFFF',
            '--border-color': '#333',
            '--delete-color': '#FF6B6B',
            '--frame-color': '#FFFFFF',
            '--frame-border': '#FFFFFF',
            '--frame-background': '#000000'
        },
        black: {
            '--primary-color': '#000000',
            '--primary-hover': '#333333',
            '--primary-shadow': 'rgba(0, 0, 0, 0.3)',
            '--primary-shadow-hover': 'rgba(0, 0, 0, 0.5)',
            '--primary-shadow-light': 'rgba(0, 0, 0, 0.1)',
            '--accent-color': '#404040',
            '--background-color': '#000000',
            '--text-color': '#FFFFFF',
            '--border-color': '#333',
            '--delete-color': '#FF6B6B',
            '--frame-color': '#000000',
            '--frame-border': '#000000',
            '--frame-background': '#000000'
        }
    };

    function changeTheme(themeName) {
        const theme = themes[themeName];
        if (theme) {
            const root = document.documentElement;
            Object.keys(theme).forEach(key => {
                root.style.setProperty(key, theme[key]);
            });
            
            // Filter background options based on theme
            filterBackgroundOptions(themeName);
            
            // Special handling for white theme - automatically set background to black
            if (themeName === 'white') {
                changeBackground('black');
                // Update the background dropdown to reflect the change
                const bgSelect = document.getElementById('bg-select');
                if (bgSelect) {
                    bgSelect.value = 'black';
                }
            } else if (themeName === 'black') {
                // For black theme, only allow grey and white backgrounds
                const currentBackground = localStorage.getItem('selectedBackground') || 'grey';
                if (currentBackground === 'black') {
                    changeBackground('grey');
                    const bgSelect = document.getElementById('bg-select');
                    if (bgSelect) {
                        bgSelect.value = 'grey';
                    }
                } else {
                    changeBackground(currentBackground);
                }
            } else {
                // For other themes, preserve the current background setting
                const currentBackground = localStorage.getItem('selectedBackground') || 'black';
                changeBackground(currentBackground);
            }
            
            // Save theme preference
            localStorage.setItem('selectedTheme', themeName);
            
            // Dispatch custom event to notify sketch page of theme change
            window.dispatchEvent(new CustomEvent('themeChanged', {
                detail: { theme: themeName, background: localStorage.getItem('selectedBackground') || 'black' }
            }));
            
            console.log(`Theme changed to: ${themeName}`);
        }
    }

    function changeBackground(bgColor) {
        const root = document.documentElement;
        if (bgColor === 'white') {
            root.style.setProperty('--background-color', '#FFFFFF');
            root.style.setProperty('--text-color', '#000000');
            root.style.setProperty('--border-color', '#CCCCCC');
            root.style.setProperty('--frame-background', '#FFFFFF');
        } else if (bgColor === 'grey') {
            root.style.setProperty('--background-color', '#808080');
            root.style.setProperty('--text-color', '#FFFFFF');
            root.style.setProperty('--border-color', '#A0A0A0');
            root.style.setProperty('--frame-background', '#808080');
        } else {
            // Default to black
            root.style.setProperty('--background-color', '#000000');
            root.style.setProperty('--text-color', '#FFFFFF');
            root.style.setProperty('--border-color', '#333');
            root.style.setProperty('--frame-background', '#000000');
        }
        
        // Filter theme options based on background
        filterThemeOptions(bgColor);
        
        // Save background preference
        localStorage.setItem('selectedBackground', bgColor);
        
        // Dispatch custom event to notify sketch page of background change
        window.dispatchEvent(new CustomEvent('backgroundChanged', {
            detail: { 
                background: bgColor, 
                theme: localStorage.getItem('selectedTheme') || 'orange' 
            }
        }));
        
        console.log(`Background changed to: ${bgColor}`);
    }

    function filterBackgroundOptions(themeName) {
        const bgSelect = document.getElementById('bg-select');
        if (!bgSelect) return;
        
        // Store current selection
        const currentValue = bgSelect.value;
        
        // Clear all options
        bgSelect.innerHTML = '';
        
        if (themeName === 'black') {
            // Black theme: only grey and white backgrounds
            bgSelect.innerHTML = '<option value="grey">Grey</option><option value="white">White</option>';
        } else if (themeName === 'white') {
            // White theme: only black background
            bgSelect.innerHTML = '<option value="black">Black</option>';
        } else {
            // Color themes (orange, blue, green, purple): only black and white backgrounds
            bgSelect.innerHTML = '<option value="black">Black</option><option value="white">White</option>';
        }
        
        // Restore selection if it's still valid, otherwise select first option
        if (bgSelect.querySelector(`option[value="${currentValue}"]`)) {
            bgSelect.value = currentValue;
        } else {
            bgSelect.selectedIndex = 0;
        }
    }

    function filterThemeOptions(bgColor) {
        const themeSelect = document.getElementById('theme-select');
        if (!themeSelect) return;
        
        // Store current selection
        const currentValue = themeSelect.value;
        
        // Clear all options
        themeSelect.innerHTML = '';
        
        if (bgColor === 'grey') {
            // Grey background: only black and white themes
            themeSelect.innerHTML = '<option value="black">Black</option><option value="white">White</option>';
        } else {
            // Other backgrounds: all themes available
            themeSelect.innerHTML = '<option value="orange">Orange</option><option value="blue">Blue</option><option value="green">Green</option><option value="purple">Purple</option><option value="pink">Pink</option><option value="white">White</option><option value="black">Black</option>';
        }
        
        // Restore selection if it's still valid, otherwise select first option
        if (themeSelect.querySelector(`option[value="${currentValue}"]`)) {
            themeSelect.value = currentValue;
        } else {
            themeSelect.selectedIndex = 0;
        }
    }

    function loadSavedTheme() {
        const savedTheme = localStorage.getItem('selectedTheme') || 'orange';
        const savedBackground = localStorage.getItem('selectedBackground') || 'black';
        const themeSelect = document.getElementById('theme-select');
        const bgSelect = document.getElementById('bg-select');
        
        if (themeSelect && bgSelect) {
            // Set the values first
            themeSelect.value = savedTheme;
            bgSelect.value = savedBackground;
            
            // Apply the theme and background
            changeTheme(savedTheme);
            changeBackground(savedBackground);
        }
    }

    // Make functions globally available
    window.changeTheme = changeTheme;
    window.changeBackground = changeBackground;
    window.loadSavedTheme = loadSavedTheme;

    // Initialize theme on page load
    document.addEventListener('DOMContentLoaded', () => {
        loadSavedTheme();
    });

document.addEventListener('DOMContentLoaded', () => {
    let categoryCounter = 0;
    let promptCounter = 0;
    const MAX_CATEGORIES = 6;
    const MAX_PROMPTS = 5;

    // Add these button variables at the top
    let downloadSettingsButton;
    let uploadSettingsButton;
    let classList = []; // Array to store student names from uploaded class list
    
    // Track currently loaded activity for auto-updating
    let currentLoadedActivity = null;
    let isLoadingActivity = false; // Flag to prevent clearing activity during loading
    let lastRunActivity = null; // Remember the last activity that was run
    
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
    
    // Function to clear current activity tracking (when starting fresh)
    function clearCurrentActivity() {
        currentLoadedActivity = null;
        console.log('Cleared current activity tracking - starting fresh');
        updateActivityStatusIndicator();
        updateButtonStates();
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

    function addNewPrompt() {
        // Reset promptCounter based on actual DOM elements
        const actualPromptCount = document.querySelectorAll('.prompt-column').length;
        promptCounter = actualPromptCount;
        
        if (promptCounter >= MAX_PROMPTS) {
            alert(`Maximum of ${MAX_PROMPTS} prompts reached`);
            return;
        }
        
        // Don't clear current activity when user makes changes - they should be able to update it
        // Only clear during explicit "start new" actions
        const promptHeaders = document.getElementById('prompt-headers');
        
        // Create new prompt column
        const newPromptColumn = document.createElement('div');
        newPromptColumn.className = 'prompt-column';
        newPromptColumn.innerHTML = `
            <input type="text" class="header-input" placeholder="Enter Prompt ${promptCounter + 1}">
            ${promptCounter > 0 ? '<button class="delete-prompt" onclick="deletePrompt(this)">[x]</button>' : ''}
            ${promptCounter >= 0 ? '<div class="horizontal-arrow">+</div>' : ''}
        `;
        
        // Add the new prompt to DOM
        promptHeaders.appendChild(newPromptColumn);
        
        promptCounter++;
        
        // Update all arrows and add textareas to existing categories
        updateCategoryRows();
        
        // Update prompt count displays
        updatePromptCounts();
    }

    function updateCategoryRows() {
        const categoryRows = document.querySelectorAll('.category-row');
        const promptColumns = document.querySelectorAll('.prompt-column');
        const promptCount = promptColumns.length;
        
        // Don't update if no category rows exist
        if (categoryRows.length === 0) {
            return;
        }
        
        // Update delete button visibility - only show for prompts beyond the first
        promptColumns.forEach((column, index) => {
            const deleteBtn = column.querySelector('.delete-prompt');
            if (deleteBtn) {
                deleteBtn.style.display = index > 0 ? 'flex' : 'none';
            }
            
            // Update horizontal arrows
            const existingArrow = column.querySelector('.horizontal-arrow');
            if (existingArrow) {
                existingArrow.remove();
            }
            if (index >= 0 && index < promptCount - 1) {
                const arrowDiv = document.createElement('div');
                arrowDiv.className = 'horizontal-arrow';
                arrowDiv.innerHTML = '+';
                column.appendChild(arrowDiv);
            }
        });
        
        categoryRows.forEach((row, rowIndex) => {
            const label = row.querySelector('.row-label');
            label.textContent = String.fromCharCode(65 + rowIndex);
            
            // Update category delete button visibility - only show for categories beyond the first
            const deleteBtn = row.querySelector('.delete-category');
            if (deleteBtn) {
                deleteBtn.style.display = rowIndex > 0 ? 'flex' : 'none';
            }
            
            // Ensure criterion label input exists
            let criterionLabelContainer = row.querySelector('.criterion-label-container');
            if (!criterionLabelContainer) {
                criterionLabelContainer = document.createElement('div');
                criterionLabelContainer.className = 'criterion-label-container';
                const criterionInput = document.createElement('input');
                criterionInput.type = 'text';
                criterionInput.className = 'criterion-label-input';
                criterionInput.placeholder = 'Enter criterion label';
                criterionInput.value = criterionLabels[rowIndex] || '';
                criterionInput.onchange = () => updateCriterionLabel(rowIndex, criterionInput.value);
                criterionLabelContainer.appendChild(criterionInput);
                
                // Insert after the label container
                const labelContainer = row.querySelector('.row-label-container');
                labelContainer.insertAdjacentElement('afterend', criterionLabelContainer);
            } else {
                // Update existing input value
                const criterionInput = criterionLabelContainer.querySelector('.criterion-label-input');
                if (criterionInput) {
                    const newValue = criterionLabels[rowIndex] || '';
                    console.log(`Updating criterion label for row ${rowIndex}: "${criterionInput.value}" -> "${newValue}"`);
                    criterionInput.value = newValue;
                }
            }
            
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
                
                
                // Add horizontal arrow pointing to prompts (only for existing columns)
                if (i < promptCount - 1) {
                    const horizontalArrow = document.createElement('div');
                    horizontalArrow.className = 'horizontal-arrow';
                    horizontalArrow.innerHTML = '→';
                    textareaContainer.appendChild(horizontalArrow);
                }
                
                row.appendChild(textareaContainer);
            }
            
            // Update existing containers' arrows
            const containers = row.querySelectorAll('.textarea-container');
            containers.forEach((container, containerIndex) => {
                // Remove any existing arrows
                const existingArrow = container.querySelector('.horizontal-arrow');
                if (existingArrow) {
                    existingArrow.remove();
                }
                
                // Add horizontal arrow pointing to prompts (only for existing columns)
                if (containerIndex < promptCount - 1) {
                    const horizontalArrow = document.createElement('div');
                    horizontalArrow.className = 'horizontal-arrow';
                    horizontalArrow.innerHTML = '→';
                    container.appendChild(horizontalArrow);
                }
            });
        });
    }

    function addNewCategory() {
        if (categoryCounter >= MAX_CATEGORIES) {
            alert(`Maximum of ${MAX_CATEGORIES} categories reached`);
            return;
        }
        
        // Don't clear current activity when user makes changes - they should be able to update it
        // Only clear during explicit "start new" actions
        const categoriesContainer = document.getElementById('categories-container');
        const newCategory = document.createElement('div');
        newCategory.className = 'category-row';
        categoryCounter++;
        
        // Create category label container
        const labelContainer = document.createElement('div');
        labelContainer.className = 'row-label-container';
        labelContainer.innerHTML = `
            ${categoryCounter > 1 ? '<button class="delete-category" onclick="deleteCategory(this.closest(\'.category-row\'))">[x]</button>' : ''}
            <div class="row-label">${String.fromCharCode(64 + categoryCounter)}</div>
        `;
        
        // Create criterion label input field
        const criterionLabelContainer = document.createElement('div');
        criterionLabelContainer.className = 'criterion-label-container';
        const criterionInput = document.createElement('input');
        criterionInput.type = 'text';
        criterionInput.className = 'criterion-label-input';
        criterionInput.placeholder = 'Enter criterion label';
        criterionInput.value = criterionLabels[categoryCounter - 1] || '';
        criterionInput.onchange = () => updateCriterionLabel(categoryCounter - 1, criterionInput.value);
        criterionLabelContainer.appendChild(criterionInput);
        
        newCategory.appendChild(labelContainer);
        newCategory.appendChild(criterionLabelContainer);
        
        // Add a textarea for each existing prompt column
        const promptCount = document.querySelectorAll('.prompt-column').length;
        for (let i = 0; i < promptCount; i++) {
            const textareaContainer = document.createElement('div');
            textareaContainer.className = 'textarea-container';
            
            const textarea = document.createElement('textarea');
            textarea.placeholder = 'Enter prompts (one per line)';
            textareaContainer.appendChild(textarea);
            
            
            // Add horizontal arrow pointing to prompts (only for existing columns)
            if (i < promptCount - 1) {
                const horizontalArrow = document.createElement('div');
                horizontalArrow.className = 'horizontal-arrow';
                horizontalArrow.innerHTML = '→';
                textareaContainer.appendChild(horizontalArrow);
            }
            
            newCategory.appendChild(textareaContainer);
        }
        
        categoriesContainer.appendChild(newCategory);
        updateCategoryRows();
        
        // Update prompt count displays
        updatePromptCounts();
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
        
        // Update category rows to refresh arrows
        updateCategoryRows();
        
        // Show the add button if we're below MAX_PROMPTS
        const addButton = document.querySelector('.add-prompt-button');
        if (addButton && promptCounter < MAX_PROMPTS) {
            addButton.style.display = 'flex';
        }
        
        // Update prompt count displays
        updatePromptCounts();
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
        
        // Update prompt count displays
        updatePromptCounts();
    }

    function saveChanges() {
        const data = {
            objective: document.getElementById('objective-input').value,
            // classList: classList, // Don't save class list to localStorage
            constraintEnabled: true, // Always enabled
            prompt1InterestsMode: document.getElementById('prompt1-interests-mode').checked,
            criterionLabels: criterionLabels, // Include criterion labels for sketch.js
            activityName: currentLoadedActivity, // Include the loaded activity name
            // promptCount: removed - now handled in sketch.js
            categories: {}
        };
        
        console.log('=== DEBUG: saveChanges called ===');
        console.log('Current loaded activity:', currentLoadedActivity);
        console.log('Objective value:', data.objective);
        console.log('Criterion labels:', data.criterionLabels);
        console.log('Activity name being saved:', data.activityName);
        
        console.log('DEBUG: Saving data with criterionLabels:', criterionLabels);

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
        
        // Dispatch event to notify sketch of data update
        window.dispatchEvent(new CustomEvent('promptDataUpdated', {
            detail: { timestamp: Date.now() }
        }));
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

                // Prompt count is now handled in sketch.js
                

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

            // Update add button visibility based on number of prompts
            if (addButton) {
                addButton.style.display = promptCounter >= MAX_PROMPTS ? 'none' : 'flex';
                }

        // Update prompt count displays AFTER UI is built
        setTimeout(() => {
            updatePromptCounts();
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
                    indicator.textContent = '✓ Data loaded successfully';
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



    // Auto-save function
    // Auto-save functionality removed - use manual SAVE button instead

    // Function to update the currently loaded activity with current changes
    function updateCurrentActivity() {
        if (!currentLoadedActivity) {
            return;
        }
        
        console.log('Auto-updating saved activity:', currentLoadedActivity);
        
        // Get current prompt data (same as saveActivityWithName)
        const currentData = {
            objective: document.getElementById('objective-input').value,
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
        
        // Collect all category data
        const categoryRows = document.querySelectorAll('.category-row');
        categoryRows.forEach((row, index) => {
            const categoryLabel = row.querySelector('.row-label').textContent;
            const textareas = row.querySelectorAll('textarea');
            
            // Save data from all prompt columns for this category
            const categoryData = [];
            textareas.forEach(textarea => {
                if (textarea && textarea.value.trim()) {
                    categoryData.push(textarea.value.trim().split('\n').filter(line => line.trim()));
                } else {
                    categoryData.push([]);
                }
            });
            
            if (categoryData.length > 0) {
                currentData.categories[categoryLabel] = categoryData;
            }
        });
        
        // Update the saved activity
        const savedSettings = JSON.parse(localStorage.getItem('promptSettings') || '{}');
        savedSettings[currentLoadedActivity] = currentData;
        localStorage.setItem('promptSettings', JSON.stringify(savedSettings));
        
        console.log('Activity auto-updated:', currentLoadedActivity);
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

        // Get all headers (column labels)
        const headers = document.querySelectorAll('.header-input');
        const categoryRows = document.querySelectorAll('.category-row');

        // For each header/column
        headers.forEach((header, columnIndex) => {
            const headerText = header.value.trim() || `PROMPT ${columnIndex + 1}`;
            currentData.categories[headerText] = {};
            
            // For each category row
            categoryRows.forEach((row, rowIndex) => {
                const categoryLetter = String.fromCharCode(65 + rowIndex); // A, B, C, D
                const textarea = row.querySelector(`textarea[data-column="${columnIndex}"]`);
                if (textarea) {
                    const prompts = textarea.value.split('\n')
                        .map(line => line.trim())
                        .filter(line => line.length > 0);
                    currentData.categories[headerText][categoryLetter] = prompts;
                }
            });
        });

        // Save as last run activity
        lastRunActivity = {
            name: currentLoadedActivity || 'Current Activity',
            data: currentData,
            timestamp: Date.now()
        };
        
        // Store in localStorage for persistence
        localStorage.setItem('lastRunActivity', JSON.stringify(lastRunActivity));
        
        console.log('Saved current activity as last run:', lastRunActivity.name);
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
        
        // Save the restored state
        saveChanges();
        
        console.log('Last run activity restored successfully');
        return true;
    }

    // Quick test function
    function quickTest() {
        // CRITICAL: Save current state to promptCategories so sketch.js can load it
        saveChanges();
        
        // Save current activity as the last run activity (after saveChanges to get fresh data)
        saveCurrentActivityAsLastRun();
        
        // Open the sketch app directly
        window.open('sketch.html', '_blank');
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
    window.togglePromptingTips = togglePromptingTips;

    // Settings Management Functions
    function saveSettings() {
        const settingsName = document.getElementById('settings-name').value.trim();
        if (!settingsName) {
            alert('Please enter a name for your settings!');
            return;
        }
        
        // Get current prompt data
        const currentData = {
            objective: document.getElementById('objective').value,
            categories: {},
            timestamp: new Date().toISOString(),
            name: settingsName
        };
        
        // Collect all category data
        const categoryRows = document.querySelectorAll('.category-row');
        categoryRows.forEach((row, index) => {
            const categoryLabel = row.querySelector('.row-label').textContent;
            const textarea = row.querySelector('textarea');
            if (textarea && textarea.value.trim()) {
                currentData.categories[categoryLabel] = textarea.value.trim().split('\n').filter(line => line.trim());
            }
        });
        
        // Save to localStorage
        const savedSettings = JSON.parse(localStorage.getItem('promptSettings') || '{}');
        savedSettings[settingsName] = currentData;
        localStorage.setItem('promptSettings', JSON.stringify(savedSettings));
        
        // Update settings list
        updateSettingsList();
        
        // Clear name input
        document.getElementById('settings-name').value = '';
        
        alert(`Settings "${settingsName}" saved successfully!`);
    }

    function loadSettings() {
        const settingsList = document.getElementById('settings-list');
        const selectedName = settingsList.value;
        
        if (!selectedName) {
            alert('Please select settings to load!');
            return;
        }
        
        const savedSettings = JSON.parse(localStorage.getItem('promptSettings') || '{}');
        const settings = savedSettings[selectedName];
        
        if (!settings) {
            alert('Settings not found!');
            return;
        }
        
        // Load objective
        document.getElementById('objective-input').value = settings.objective || '';
        
        // Clear existing categories
        const categoriesContainer = document.getElementById('categories-container');
        categoriesContainer.innerHTML = '';
        
        // Load categories
        Object.keys(settings.categories).forEach(categoryLabel => {
            addNewCategory();
            const lastRow = categoriesContainer.lastElementChild;
            const labelElement = lastRow.querySelector('.row-label');
            const textarea = lastRow.querySelector('textarea');
            
            labelElement.textContent = categoryLabel;
            textarea.value = settings.categories[categoryLabel].join('\n');
        });
        
        // Update prompt counts
        updateColumnCounts();
        
        alert(`Settings "${selectedName}" loaded successfully!`);
    }

    function deleteSettings() {
        const settingsList = document.getElementById('settings-list');
        const selectedName = settingsList.value;
        
        if (!selectedName) {
            alert('Please select settings to delete!');
            return;
        }
        
        if (!confirm(`Are you sure you want to delete settings "${selectedName}"?`)) {
            return;
        }
        
        const savedSettings = JSON.parse(localStorage.getItem('promptSettings') || '{}');
        delete savedSettings[selectedName];
        localStorage.setItem('promptSettings', JSON.stringify(savedSettings));
        
        // Update settings list
        updateSettingsList();
        
        alert(`Settings "${selectedName}" deleted successfully!`);
    }

    function exportSettings() {
        // Get current data (not just selected activity)
        const currentData = {
            activityName: currentLoadedActivity || 'Untitled Activity',
            objective: document.getElementById('objective-input').value,
            theme: localStorage.getItem('selectedTheme') || 'orange',
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
        
        // Collect all category data
        const categoryRows = document.querySelectorAll('.category-row');
        categoryRows.forEach((row, index) => {
            const categoryLabel = row.querySelector('.row-label').textContent;
            const textareas = row.querySelectorAll('textarea');
            
            // Save data from all prompt columns for this category
            const categoryData = [];
            textareas.forEach(textarea => {
                if (textarea && textarea.value.trim()) {
                    categoryData.push(textarea.value.trim().split('\n').filter(line => line.trim()));
                } else {
                    categoryData.push([]);
                }
            });
            
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
                        let theme = 'orange';
                        let background = 'black';
                        let prompt1InterestsMode = false;
                        let criterionLabels = ['sport', 'entertainment', 'academic', 'creative'];
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
                                    
                                    if (category && !categories[category]) {
                                        categories[category] = [];
                                    }
                                    
                                    // Add items to category
                                    items.forEach(item => {
                                        if (item) {
                                            categories[category].push(item);
                                        }
                                    });
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
                        
                        // Add categories
                        console.log('DEBUG: Adding categories:', Object.keys(categories));
                        Object.keys(categories).forEach(categoryName => {
                            addNewCategory();
                            const categoryRows = document.querySelectorAll('.category-row');
                            const lastRow = categoryRows[categoryRows.length - 1];
                            if (lastRow) {
                                const textareas = lastRow.querySelectorAll('textarea');
                                const categoryData = categories[categoryName];
                                console.log('DEBUG: Adding category data for', categoryName, ':', categoryData);
                                
                                // Add data to each prompt column
                                categoryData.forEach((item, index) => {
                                    if (textareas[index] && item) {
                                        textareas[index].value = item;
                                        console.log('DEBUG: Set textarea', index, 'to:', item);
                                    }
                                });
                            }
                        });
                        
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
            deleteBtn.textContent = '[x]';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                deleteActivity(name);
            };
            
            item.appendChild(content);
            item.appendChild(deleteBtn);
            settingsList.appendChild(item);
        });
    }

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

    function loadSettingsByName(settingsName) {
        console.log('=== DEBUG: loadSettingsByName called ===');
        console.log('Loading activity:', settingsName);
        
        const savedSettings = JSON.parse(localStorage.getItem('promptSettings') || '{}');
        console.log('All saved settings:', Object.keys(savedSettings));
        const settings = savedSettings[settingsName];
        console.log('Found settings:', settings);
        
        if (!settings) {
            console.log('Settings not found for:', settingsName);
            throw new Error('Settings not found');
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
            // Add categories as needed
            for (let i = 0; i < categoryKeys.length; i++) {
                            addNewCategory();
                
                            const categoryRows = document.querySelectorAll('.category-row');
                const targetRow = categoryRows[i];
                const labelElement = targetRow.querySelector('.row-label');
                const textareas = targetRow.querySelectorAll('textarea');
                
                labelElement.textContent = categoryKeys[i];
                
                // Load data into all textareas for this category
                const categoryData = settings.categories[categoryKeys[i]];
                if (Array.isArray(categoryData)) {
                    // New format: array of arrays (one for each prompt column)
                    categoryData.forEach((promptData, promptIndex) => {
                        if (textareas[promptIndex] && Array.isArray(promptData)) {
                            textareas[promptIndex].value = promptData.join('\n');
                        }
                    });
                } else {
                    // Old format: single array (fallback for backward compatibility)
                    if (textareas[0] && Array.isArray(categoryData)) {
                        textareas[0].value = categoryData.join('\n');
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
        
        // IMPORTANT: Use saveChanges() to properly save to promptCategories
        console.log('=== DEBUG: About to call saveChanges from loadSettingsByName ===');
        console.log('currentLoadedActivity at this point:', currentLoadedActivity);
        console.log('objective value at this point:', document.getElementById('objective-input').value);
        console.log('criterionLabels at this point:', criterionLabels);
        
        // Use the existing saveChanges function to ensure proper data conversion
        saveChanges();
        console.log('=== DEBUG: saveChanges completed from loadSettingsByName ===');
    }

    function saveNewSettings() {
        showCustomPrompt('Enter a name for this activity:', (settingsName) => {
            if (!settingsName || !settingsName.trim()) {
                return;
            }
            saveActivityWithName(settingsName.trim());
        });
    }
    
    function saveCurrentActivity() {
        if (!currentLoadedActivity) {
            alert('No activity loaded to save. Please load an activity first or use "SAVE ACTIVITY" to create a new one.');
            return;
        }
        
        console.log('Saving current activity:', currentLoadedActivity);
        
        // Get current prompt data (same as saveActivityWithName)
        const currentData = {
            objective: document.getElementById('objective-input').value,
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
        
        // Collect all category data
        const categoryRows = document.querySelectorAll('.category-row');
        categoryRows.forEach((row, index) => {
            const categoryLabel = row.querySelector('.row-label').textContent;
            const textareas = row.querySelectorAll('textarea');
            
            // Save data from all prompt columns for this category
            const categoryData = [];
            textareas.forEach(textarea => {
                if (textarea && textarea.value.trim()) {
                    categoryData.push(textarea.value.trim().split('\n').filter(line => line.trim()));
                } else {
                    categoryData.push([]);
                }
            });
            
            if (categoryData.length > 0) {
                currentData.categories[categoryLabel] = categoryData;
            }
        });
        
        // Update the saved activity
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
        
        // Update button states
        updateButtonStates();
        
        console.log('Activity updated:', currentLoadedActivity);
    }

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

    function saveActivityWithName(settingsName) {
        // Get current prompt data
        const currentData = {
            objective: document.getElementById('objective-input').value,
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
        
        // Collect all category data
        const categoryRows = document.querySelectorAll('.category-row');
        categoryRows.forEach((row, index) => {
            const categoryLabel = row.querySelector('.row-label').textContent;
            const textareas = row.querySelectorAll('textarea');
            
            // Save data from all prompt columns for this category
            const categoryData = [];
            textareas.forEach(textarea => {
                if (textarea && textarea.value.trim()) {
                    categoryData.push(textarea.value.trim().split('\n').filter(line => line.trim()));
                } else {
                    categoryData.push([]);
                }
            });
            
            if (categoryData.length > 0) {
                currentData.categories[categoryLabel] = categoryData;
            }
        });
        
        // Save to localStorage
        const savedSettings = JSON.parse(localStorage.getItem('promptSettings') || '{}');
        savedSettings[settingsName.trim()] = currentData;
        localStorage.setItem('promptSettings', JSON.stringify(savedSettings));
        
        // Also save to main promptCategories localStorage that sketch.js reads
        saveChanges();
        
        // Update settings list
        updateSettingsList();
        
        // Set this as the current loaded activity
        currentLoadedActivity = settingsName.trim();
        
        // Show activity status indicator
        updateActivityStatusIndicator();
        
        // Update button states
        updateButtonStates();
        
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

    // New button functions
    function startNewPromptSet() {
        // Clear all fields and start fresh with 1 default prompt and category
        initializeDefaultContent();
        clearCurrentActivity();
        
        // Clear last run activity when starting new
        lastRunActivity = null;
        localStorage.removeItem('lastRunActivity');
        
        // IMPORTANT: Clear the promptCategories localStorage to prevent mixing old data
        localStorage.removeItem('promptCategories');
        
        // Save fresh empty data to localStorage
        const emptyData = {
            objective: '',
            constraintEnabled: true,
            prompt1InterestsMode: false,
            criterionLabels: ['', '', '', ''],
            activityName: null,
            categories: {}
        };
        localStorage.setItem('promptCategories', JSON.stringify(emptyData));
        
        updateButtonStates();
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

    function initializeDefaultContent() {
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
        
        // Reset criterion labels to empty
        criterionLabels = ['', '', '', ''];
        
        // Add 1 default prompt
        addNewPrompt();
        
        // Add 1 default category
        addNewCategory();
        
        // Enable prompt1InterestsMode by default when starting fresh
        document.getElementById('prompt1-interests-mode').checked = true;
        
        // Update UI
        updatePromptCounts();
        updateColumnCounts();
        
        // Save the fresh state to localStorage with timestamp
        saveChanges();
        
        // Force sketch to reload by dispatching a custom event
        window.dispatchEvent(new CustomEvent('promptDataUpdated', {
            detail: { timestamp: Date.now() }
        }));
    }

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

    // Global functions for HTML onclick handlers
    window.saveSettings = saveSettings;
    window.loadSettings = loadSettings;
    window.startNewPromptSet = startNewPromptSet;
    window.restoreLastRunActivity = restoreLastRunActivity;
    window.saveCurrentActivity = saveCurrentActivity;
    window.saveAsNewActivity = saveAsNewActivity;
    window.sharePromptSet = sharePromptSet;
    window.loadPromptSet = loadPromptSet;
    window.deleteSettings = deleteSettings;
    window.exportSettings = exportSettings;
    window.importSettings = importSettings;
    window.saveNewSettings = saveNewSettings;

    // Add auto-save triggers to all input fields
    // Update prompt count displays function
    function updatePromptCounts() {
        // This function is now deprecated - using updateColumnCounts instead
        updateColumnCounts();
    }
    
    function updateColumnCounts() {
        // Get all prompt headers and category rows
        const promptHeaders = document.querySelectorAll('.header-input');
        const categoryRows = document.querySelectorAll('.category-row');
        const columnCountsContainer = document.getElementById('column-counts-container');
        
        if (promptHeaders.length === 0 || categoryRows.length === 0) return;

        // Clear existing column counts
        columnCountsContainer.innerHTML = '';

        // Count items for each prompt column
        const headerInputs = document.querySelectorAll('.header-input');
        headerInputs.forEach((header, columnIndex) => {
            let totalItems = 0;
            
            // Count items across all categories for this prompt
            categoryRows.forEach((row) => {
                const textarea = row.querySelectorAll('textarea')[columnIndex];
                if (textarea && textarea.value.trim()) {
                    const items = textarea.value.split('\n')
                        .map(line => line.trim())
                        .filter(line => line.length > 0);
                    totalItems += items.length;
                }
            });
            
            // Create count display for this column
            const countDisplay = document.createElement('div');
            countDisplay.className = 'prompt-count-display';
            countDisplay.style.display = 'inline-block';
            countDisplay.style.textAlign = 'center';
            countDisplay.style.width = '200px'; // Match the prompt column width exactly
            countDisplay.style.padding = '10px'; // Match header-input padding
            countDisplay.style.border = '1px solid var(--frame-border)';
            countDisplay.style.borderRadius = '4px';
            countDisplay.style.backgroundColor = 'var(--frame-background)';
            countDisplay.style.color = 'var(--frame-color)';
            countDisplay.style.fontFamily = 'VT323, monospace';
            countDisplay.style.fontSize = '16px'; // Match header-input font size
            countDisplay.innerHTML = `Possible selections: ${totalItems}`;
            columnCountsContainer.appendChild(countDisplay);
        });
    }

    function setupAutoSave() {
        // Auto-save functionality removed - use manual SAVE button instead
    }

    // Add P key handler - go to sketch for testing, or index if no data
    document.addEventListener('keyup', (event) => {
        if (event.key === 'p' || event.key === 'P') {
            // Don't trigger if user is typing in an input field
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.isContentEditable) {
                return;
            }
            
            event.preventDefault();
            // Check if we have any data to test
            const hasData = checkIfHasData();
            if (hasData) {
                console.log('P pressed in editor - going to sketch to test');
                // Save current state first, then save as last run activity
                saveChanges();
                saveCurrentActivityAsLastRun();
                window.location.href = 'sketch.html';
            } else {
                console.log('P pressed in editor - no data, going to index');
                window.location.href = 'index.html';
            }
        }
    });

    // Helper function to check if editor has any data worth testing
    function checkIfHasData() {
        // Check if objective has content
        const objective = document.getElementById('objective-input').value.trim();
        if (objective.length > 0) return true;
        
        // Check if any prompt headers have content
        const headers = document.querySelectorAll('.header-input');
        for (let header of headers) {
            if (header.value.trim().length > 0) return true;
        }
        
        // Check if any textareas have content
        const textareas = document.querySelectorAll('textarea');
        for (let textarea of textareas) {
            if (textarea.value.trim().length > 0) return true;
        }
        
        // Check if criterion labels have content
        if (criterionLabels.some(label => label.trim().length > 0)) return true;
        
        return false;
    }

    // Load current state from localStorage when returning from sketch
    function loadCurrentStateFromLocalStorage() {
        console.log('=== DEBUG: loadCurrentStateFromLocalStorage called ===');
        const promptData = localStorage.getItem('promptCategories');
        console.log('Raw promptData from localStorage:', promptData);
        
        if (promptData) {
            try {
                const data = JSON.parse(promptData);
                console.log('Parsed data from localStorage:', data);
                console.log('Data keys:', Object.keys(data));
                console.log('Activity name in data:', data.activityName);
                console.log('Categories in data:', data.categories);
                
                // Check if this data is actually valid and not corrupted
                if (!data.categories || Object.keys(data.categories).length === 0) {
                    console.log('❌ No valid categories found in data, skipping restoration');
                    return;
                }
                
                // Check if this is a loaded activity (has a name)
                if (data.activityName) {
                    currentLoadedActivity = data.activityName;
                    console.log('✅ Restored loaded activity:', currentLoadedActivity);
                } else {
                    console.log('❌ No activity name found in data');
                }
                
                // Restore categories and prompts first
                if (data.categories && Object.keys(data.categories).length > 0) {
                    console.log('✅ Found categories, restoring...');
                    
                    // Clear existing content first
                    clearAllFields();
                    
                    const promptTypes = Object.keys(data.categories).filter(key => key !== 'objective' && key !== 'prompt1InterestsMode' && key !== 'activityName');
                    console.log('Prompt types to restore:', promptTypes);
                    
                    // Reset counters
                    promptCounter = 0;
                    categoryCounter = 0;
                    
                    // Add prompts for each type
                    promptTypes.forEach((promptType, index) => {
                        addNewPrompt();
                        
                        // Set the prompt header
                        const headerInputs = document.querySelectorAll('.header-input');
                        if (headerInputs[index]) {
                            headerInputs[index].value = promptType;
                            console.log(`✅ Set header ${index}:`, promptType);
                        }
                    });
                    
                    // Add categories for each letter that has content
                    const allCategoryLetters = new Set();
                    promptTypes.forEach(promptType => {
                        Object.keys(data.categories[promptType]).forEach(letter => {
                            allCategoryLetters.add(letter);
                        });
                    });
                    console.log('Category letters to restore:', Array.from(allCategoryLetters));
                    
                    // Add categories
                    Array.from(allCategoryLetters).forEach((letter, index) => {
                        addNewCategory();
                    });
                    
                    // Fill in the data
                    promptTypes.forEach((promptType, promptIndex) => {
                        const categoryData = data.categories[promptType];
                        Object.keys(categoryData).forEach(categoryLetter => {
                            const rowIndex = categoryLetter.charCodeAt(0) - 65; // A=0, B=1, etc.
                            const textarea = document.querySelector(`textarea[data-column="${promptIndex}"][data-row="${rowIndex}"]`);
                            if (textarea) {
                                textarea.value = categoryData[categoryLetter].join('\n');
                                console.log(`✅ Filled textarea [${promptIndex}][${rowIndex}]:`, categoryData[categoryLetter]);
                            }
                        });
                    });
                    
                    // Update criterion labels in the UI
                    updateCategoryRows();
                    
                    // Update counters
                    updatePromptCounts();
                    updateColumnCounts();
                } else {
                    console.log('❌ No categories found in data');
                }
                
                // Restore objective AFTER UI is built
                if (data.objective) {
                    document.getElementById('objective-input').value = data.objective;
                    console.log('✅ Restored objective:', data.objective);
                } else {
                    console.log('❌ No objective found in data');
                }
                
                // Restore checkbox AFTER UI is built
                if (typeof data.prompt1InterestsMode === 'boolean') {
                    document.getElementById('prompt1-interests-mode').checked = data.prompt1InterestsMode;
                    console.log('✅ Restored checkbox:', data.prompt1InterestsMode);
                } else {
                    console.log('❌ No checkbox state found in data');
                }
                
                // Restore criterion labels AFTER UI is built
                if (data.criterionLabels && Array.isArray(data.criterionLabels)) {
                    criterionLabels = [...data.criterionLabels];
                    console.log('✅ Restored criterion labels:', criterionLabels);
                } else {
                    console.log('❌ No criterion labels found in data');
                }
                
                // Update the criterion label inputs in the UI after all data is restored
                updateCategoryRows();
                
                // Update button states to show the loaded activity
                updateButtonStates();
                console.log('✅ Updated button states');
                
                // Debug: Check what's actually in the DOM after loading
                console.log('=== DEBUG: DOM state after loading ===');
                console.log('Prompt headers found:', document.querySelectorAll('.header-input').length);
                console.log('Category rows found:', document.querySelectorAll('.category-row').length);
                console.log('Objective value:', document.getElementById('objective-input').value);
                console.log('Current loaded activity:', currentLoadedActivity);
                
                console.log('=== DEBUG: loadCurrentStateFromLocalStorage completed ===');
            } catch (e) {
                console.error('❌ Error loading current state:', e);
            }
        } else {
            console.log('❌ No promptData found in localStorage');
        }
    }


    // Check if we're returning from sketch
    const urlParams = new URLSearchParams(window.location.search);
    const isFromSketch = urlParams.get('from') === 'sketch';
    
    console.log('=== DEBUG: Editor initialization ===');
    console.log('Current URL:', window.location.href);
    console.log('URL params:', window.location.search);
    console.log('isFromSketch:', isFromSketch);
    
    if (isFromSketch) {
        console.log('✅ Returned from sketch - preserving current state');
        // Remove the URL parameter to clean up the URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        
        // Try to restore last run activity first, fallback to current state
        const lastRun = loadLastRunActivity();
        if (lastRun) {
            console.log('Restoring last run activity on return from sketch:', lastRun.name);
            try {
                loadSettingsByName(lastRun.name);
            } catch (error) {
                console.log('Failed to load last run activity, falling back to current state:', error);
                loadCurrentStateFromLocalStorage();
            }
        } else {
            console.log('No last run activity, loading current state from localStorage');
            loadCurrentStateFromLocalStorage();
        }
        updateButtonStates();
        console.log('=== DEBUG: updateButtonStates completed ===');
    } else {
        // Fresh load - try to restore last run activity or start fresh
        const lastRun = loadLastRunActivity();
        if (lastRun) {
            console.log('Found last run activity, loading it:', lastRun.name);
            // Load the activity using the existing loadSettingsByName function
            loadSettingsByName(lastRun.name);
        } else {
            console.log('No last run activity found, starting fresh');
            // Update button states even if no last run activity
            updateButtonStates();
            
            // Clear any loaded activity and initialize with 1 default prompt and category
            currentLoadedActivity = null;
            
            // Clear localStorage first to ensure fresh start
            localStorage.removeItem('promptCategories');
            
            // Save empty data immediately to prevent sketch from loading old data
            const emptyData = {
                objective: '',
                constraintEnabled: true,
                prompt1InterestsMode: true,
                criterionLabels: ['', '', '', ''],
                categories: {}
            };
            localStorage.setItem('promptCategories', JSON.stringify(emptyData));
            
            // Initialize with fresh content
            initializeDefaultContent();
        }
    }
    
    // Load saved theme and background
    const savedTheme = localStorage.getItem('selectedTheme') || 'white';
    const savedBackground = localStorage.getItem('selectedBackground') || 'black';
    
    // Apply saved theme and background
    changeTheme(savedTheme);
    changeBackground(savedBackground);
    
    // Update button states for empty start
    updateButtonStates();
    
    // Setup auto-save functionality
    setupAutoSave();
    
    // Initialize settings list for history
    updateSettingsList();
    
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
    // DISABLED: This was interfering with proper restoration
    // window.addEventListener('focus', () => {
    //     console.log('Window gained focus, reloading data...');
    //     setTimeout(() => {
    //         loadSavedData();
    //     }, 100);
    // });
    
    // Auto-save functionality removed - use manual SAVE button instead

    // Add debug logs back
    console.log('Final prompt headers:', document.querySelectorAll('.header-input'));
    console.log('Final category rows:', document.querySelectorAll('.category-row'));
});

// Essential functions that were accidentally removed
function addNewPrompt() {
    if (promptCounter >= MAX_PROMPTS) {
        alert(`Maximum ${MAX_PROMPTS} prompts allowed!`);
        return;
    }
    
    promptCounter++;
    
    // Create prompt column
    const promptColumn = document.createElement('div');
    promptColumn.className = 'prompt-column';
    
    // Add delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-prompt';
    deleteBtn.innerHTML = '[x]';
    deleteBtn.onclick = () => deletePrompt(promptCounter - 1);
    promptColumn.appendChild(deleteBtn);
    
    // Add header input
    const headerInput = document.createElement('input');
    headerInput.type = 'text';
    headerInput.className = 'header-input';
    headerInput.placeholder = `PROMPT ${promptCounter}`;
    headerInput.value = `PROMPT ${promptCounter}`;
    promptColumn.appendChild(headerInput);
    
    // Add count display
    const countDisplay = document.createElement('div');
    countDisplay.className = 'prompt-count-display';
    countDisplay.textContent = '0';
    promptColumn.appendChild(countDisplay);
    
    // Add to headers container
    document.getElementById('prompt-headers').appendChild(promptColumn);
    
    // Add textareas to existing category rows
    updateCategoryRows();
    
    // Update counters
    updatePromptCounts();
    updateColumnCounts();
}

function addNewCategory() {
    if (categoryCounter >= MAX_CATEGORIES) {
        alert(`Maximum ${MAX_CATEGORIES} categories allowed!`);
        return;
    }
    
    categoryCounter++;
    
    // Create category row
    const categoryRow = document.createElement('div');
    categoryRow.className = 'category-row';
    
    // Add row label container
    const rowLabelContainer = document.createElement('div');
    rowLabelContainer.className = 'row-label-container';
    
    // Add delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-category';
    deleteBtn.innerHTML = '[x]';
    deleteBtn.onclick = () => deleteCategory(categoryCounter - 1);
    rowLabelContainer.appendChild(deleteBtn);
    
    // Add row label
    const rowLabel = document.createElement('div');
    rowLabel.className = 'row-label';
    rowLabel.textContent = String.fromCharCode(64 + categoryCounter); // A, B, C, etc.
    rowLabelContainer.appendChild(rowLabel);
    
    // Add criterion label input
    const criterionLabelContainer = document.createElement('div');
    criterionLabelContainer.className = 'criterion-label-container';
    
    const criterionLabelInput = document.createElement('input');
    criterionLabelInput.type = 'text';
    criterionLabelInput.className = 'criterion-label-input';
    criterionLabelInput.placeholder = `criterion-${categoryCounter}`;
    criterionLabelInput.value = criterionLabels[categoryCounter - 1] || '';
    criterionLabelInput.oninput = (e) => updateCriterionLabel(categoryCounter - 1, e.target.value);
    criterionLabelContainer.appendChild(criterionLabelInput);
    
    categoryRow.appendChild(rowLabelContainer);
    categoryRow.appendChild(criterionLabelContainer);
    
    // Add textareas for each prompt
    const headerInputs = document.querySelectorAll('.header-input');
    headerInputs.forEach((header, index) => {
        const textareaContainer = document.createElement('div');
        textareaContainer.className = 'textarea-container';
        
        const textarea = document.createElement('textarea');
        textarea.setAttribute('data-column', index);
        textarea.setAttribute('data-row', categoryCounter - 1);
        textarea.placeholder = `Enter items for ${header.value || `PROMPT ${index + 1}`}`;
        textareaContainer.appendChild(textarea);
        
        categoryRow.appendChild(textareaContainer);
    });
    
    // Add to categories container
    document.getElementById('categories-container').appendChild(categoryRow);
    
    // Update arrows
    updateCategoryRows();
    
    // Update counters
    updatePromptCounts();
    updateColumnCounts();
}

function deletePrompt(promptIndex) {
    if (promptCounter <= 1) {
        alert('At least one prompt is required!');
        return;
    }
    
    // Remove the prompt column
    const promptColumns = document.querySelectorAll('.prompt-column');
    if (promptColumns[promptIndex]) {
        promptColumns[promptIndex].remove();
    }
    
    promptCounter--;
    
    // Update remaining prompt indices
    const remainingColumns = document.querySelectorAll('.prompt-column');
    remainingColumns.forEach((column, index) => {
        const headerInput = column.querySelector('.header-input');
        if (headerInput) {
            headerInput.placeholder = `PROMPT ${index + 1}`;
        }
    });
    
    // Update category rows to remove corresponding textareas
    updateCategoryRows();
    
    // Update counters
    updatePromptCounts();
    updateColumnCounts();
}

function deleteCategory(categoryIndex) {
    if (categoryCounter <= 1) {
        alert('At least one category is required!');
        return;
    }
    
    // Remove the category row
    const categoryRows = document.querySelectorAll('.category-row');
    if (categoryRows[categoryIndex]) {
        categoryRows[categoryIndex].remove();
    }
    
    categoryCounter--;
    
    // Update remaining category labels
    const remainingRows = document.querySelectorAll('.category-row');
    remainingRows.forEach((row, index) => {
        const rowLabel = row.querySelector('.row-label');
        if (rowLabel) {
            rowLabel.textContent = String.fromCharCode(65 + index); // A, B, C, etc.
        }
    });
    
    // Update arrows
    updateCategoryRows();
    
    // Update counters
    updatePromptCounts();
    updateColumnCounts();
}
