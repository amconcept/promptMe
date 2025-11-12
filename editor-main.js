// Editor Main - Orchestrates all editor functionality
// Responsible for: Initialization, event handling, coordination between modules

// Global variables
let classList = []; // Array to store student names from uploaded class list

// Quick test function - navigate to sketch
function quickTest() {
    // Play click sound
    if (window.playClickSound) {
        window.playClickSound();
    }
    
    // CRITICAL: Save current state to promptCategories so sketch.js can load it
    saveChanges();
    
    // Save current activity as the last run activity (after saveChanges to get fresh data)
    saveCurrentActivityAsLastRun();
    
    // Open the sketch app directly
    window.open('sketch.html', '_blank');
}

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

// Ensure Sample activity is always in history (recover if deleted)
async function ensureSampleInHistory() {
    const savedSettings = JSON.parse(localStorage.getItem('promptSettings') || '{}');
    
    // Only add if Sample doesn't exist
    if (!savedSettings['Sample']) {
        console.log('Sample not in history, loading from CSV to add it');
        
        // Load the CSV and add to history
        try {
            const response = await fetch('Sample-activity-2025-10-27.csv');
            const csvText = await response.text();
            const sampleActivity = parseCSVToActivity(csvText);
            
            // Convert from CSV format to stored format (matching saveActivityWithName exactly)
            // CSV format: categories: {header: {category: [items]}}
            // Stored format: categories: {category: [[items for col1], [items for col2], ...]}, promptHeaders: []
            const promptHeaders = Object.keys(sampleActivity.categories || {});
            const convertedCategories = {};
            
            // Get all unique category labels (criterion labels) from the CSV data
            const allCategoryLabels = new Set();
            promptHeaders.forEach(header => {
                Object.keys(sampleActivity.categories[header]).forEach(cat => {
                    if (cat) allCategoryLabels.add(cat);
                });
            });
            
            // Convert structure - matching the exact logic from saveActivityWithName
            // which reads: rowIndex * promptCount + colIndex for each textarea
            allCategoryLabels.forEach(categoryLabel => {
                // Initialize as array of arrays - one for each prompt column
                const categoryData = [];
                
                // For each prompt header (column)
                promptHeaders.forEach((header, colIndex) => {
                    const headerData = sampleActivity.categories[header];
                    const items = headerData[categoryLabel] || [];
                    // Filter out empty items and trim (matching saveActivityWithName logic)
                    categoryData.push(items.filter(item => item && item.trim()).map(item => item.trim()));
                });
                
                // Only add if there's data in at least one column (matching saveActivityWithName condition)
                if (categoryData.length > 0 && categoryData.some(col => col.length > 0)) {
                    convertedCategories[categoryLabel] = categoryData;
                }
            });
            
            // Add to history in the exact format that saveActivityWithName creates
            savedSettings['Sample'] = {
                objective: sampleActivity.objective || '',
                prompt1InterestsMode: sampleActivity.prompt1InterestsMode || false,
                criterionLabels: sampleActivity.criterionLabels || [],
                promptHeaders: promptHeaders,
                categories: convertedCategories,
                theme: (sampleActivity.theme && sampleActivity.theme !== 'pink' && sampleActivity.theme !== 'green' && sampleActivity.theme !== 'blue' && sampleActivity.theme !== 'purple' && sampleActivity.theme !== 'orange' && sampleActivity.theme !== 'white') ? sampleActivity.theme : 'pinkCRT',
                background: sampleActivity.background || 'black',
                name: 'Sample',
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('promptSettings', JSON.stringify(savedSettings));
            console.log('Sample activity added to history in correct format');
            console.log('DEBUG: Saved Sample data structure:', {
                promptHeaders: savedSettings['Sample'].promptHeaders,
                categories: Object.keys(savedSettings['Sample'].categories),
                criterionLabels: savedSettings['Sample'].criterionLabels
            });
        } catch (error) {
            console.error('Failed to load Sample from CSV for history recovery:', error);
        }
    }
}

// Load hardcoded default activity from CSV file
async function loadDefaultActivity() {
    // Try to load from CSV file
    let defaultActivity;
    try {
        const response = await fetch('Sample-activity-2025-10-27.csv');
        const csvText = await response.text();
        defaultActivity = parseCSVToActivity(csvText);
        console.log('Loaded Sample activity from CSV file');
    } catch (error) {
        console.error('Failed to load CSV, using hardcoded default:', error);
        // Fallback to hardcoded data if CSV not found
        defaultActivity = {
            objective: 'Design an object to think with that..',
            constraintEnabled: true,
            prompt1InterestsMode: true,
            criterionLabels: ['Furniture', 'textiles', 'electronics', ''],
            categories: {
                'USES': {
                    'Furniture': ['cat5 cable', 'wooden slats from window blinds', 'wood scraps', 'plastic bottles'],
                    'textiles': ['windsurfing sails', 'old jeans', 'cat5 cable', 'plastic strapping'],
                    'electronics': ['button from old electronics', 'cat5 cable', 'LED from a toy']
                },
                'AND IS': {
                    'Furniture': ['studious', 'comforting', 'inspiring', 'multi-functional'],
                    'textiles': ['reflective', 'empathetic', 'collaborative', 'organized'],
                    'electronics': ['humorous', 'helpful', 'expressive']
                }
            },
            activityName: 'Sample',
            theme: 'pinkCRT',
            background: 'black'
        };
    }
    
    // Don't override user's saved theme preference
    // Only set theme if there's no saved preference at all
    // Run migration first to ensure any old themes are converted
    if (window.migrateOldThemes) {
        window.migrateOldThemes();
    }
    
    // Only apply default activity theme if no theme is saved
    // This preserves the user's last selected theme preference
    if (!localStorage.getItem('selectedTheme')) {
        // No theme saved yet, use the default activity's theme (ensure it's migrated)
        let themeToUse = defaultActivity.theme;
        // Double-check migration for the default theme
        const themeMigration = {
            'orange': 'orangeCRT',
            'green': 'greenCRT',
            'blue': 'blueCRT',
            'purple': 'purpleCRT',
            'pink': 'pinkCRT',
            'white': 'macintosh'
        };
        if (themeMigration[themeToUse]) {
            themeToUse = themeMigration[themeToUse];
        }
        localStorage.setItem('selectedTheme', themeToUse);
        localStorage.setItem('selectedBackground', defaultActivity.background);
        if (window.changeTheme) {
            changeTheme(themeToUse);
        }
    } else {
        // User has a saved theme preference - load it instead of using default activity theme
        const savedTheme = localStorage.getItem('selectedTheme');
        const savedBackground = localStorage.getItem('selectedBackground') || 'black';
        if (window.changeTheme) {
            changeTheme(savedTheme);
        }
        if (window.changeBackground) {
            changeBackground(savedBackground);
        }
    }
    
    // Save to promptCategories
    localStorage.setItem('promptCategories', JSON.stringify(defaultActivity));
    
    // Clear the grid first
    const categoriesContainer = document.getElementById('categories-container');
    const promptHeaders = document.getElementById('prompt-headers');
    
    if (categoriesContainer) {
        categoriesContainer.innerHTML = '';
    }
    if (promptHeaders) {
        promptHeaders.innerHTML = '';
    }
    
    // Set current loaded activity IMMEDIATELY to prevent restore button
    currentLoadedActivity = defaultActivity.activityName;
    
    // Now manually populate the grid structure
    setTimeout(() => {
        populateDefaultActivity(defaultActivity);
        
        // Save to activity history after a delay
        setTimeout(() => {
            // Use saveActivityWithName to save to history
            const currentSettings = JSON.parse(localStorage.getItem('promptSettings') || '{}');
            const name = defaultActivity.activityName;
            
            // Check if already exists
            if (!currentSettings[name]) {
                // Save to history using the existing save function
                if (window.saveActivityWithName) {
                    console.log('Saving default activity to history');
                    saveActivityWithName(name);
                } else {
                    // Fallback: manually save to promptSettings
                    const savedSettings = JSON.parse(localStorage.getItem('promptSettings') || '{}');
                    const promptData = localStorage.getItem('promptCategories');
                    if (promptData) {
                        const parsed = JSON.parse(promptData);
                        savedSettings[name] = {
                            ...parsed,
                            name: name,
                            timestamp: new Date().toISOString()
                        };
                        localStorage.setItem('promptSettings', JSON.stringify(savedSettings));
                        console.log('Saved default activity to history manually');
                    }
                }
            }
            
            // Update button states and title
            updateButtonStates();
            updateActivityTitle();
        }, 300);
    }, 200);
    
    console.log('Default activity loaded:', defaultActivity);
}

// Parse CSV text to activity object
function parseCSVToActivity(csvText) {
    const lines = csvText.split('\n');
    
    // Parse CSV data
    let activityName = '';
    let objective = '';
    let theme = 'pink';
    let background = 'black';
    let prompt1InterestsMode = false;
    let criterionLabels = [];
    let categories = {};
    let promptHeaders = [];
    
    // Extract metadata
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('Activity Name: ')) {
            activityName = line.replace('Activity Name: ', '');
        } else if (line.startsWith('Objective: ')) {
            objective = line.replace('Objective: ', '');
        } else if (line.startsWith('Theme: ')) {
            theme = line.replace('Theme: ', '');
        } else if (line.startsWith('Background: ')) {
            background = line.replace('Background: ', '');
        } else if (line.startsWith('Prompt 1 Interests Mode: ')) {
            prompt1InterestsMode = line.replace('Prompt 1 Interests Mode: ', '') === 'Yes';
        } else if (line.startsWith('Criterion Labels: ')) {
            const labelsText = line.replace('Criterion Labels: ', '');
            criterionLabels = labelsText.split(',').map(label => label.trim()).filter(l => l);
        } else if (line.includes(',') && !line.startsWith('PromptMe') && !line.startsWith('Exported')) {
            // This is the header row or data row
            if (line.startsWith('Category,')) {
                // Header row - extract prompt headers
                const headers = line.split(',').slice(1);
                promptHeaders = headers.map(h => h.trim());
            } else if (line.includes(',')) {
                // Data row
                const parts = line.split(',');
                const category = parts[0].trim();
                const items = parts.slice(1).map(item => item.trim().replace(/"/g, ''));
                
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
    
    // Build categories structure for the app format
    const appCategories = {};
    promptHeaders.forEach(header => {
        appCategories[header] = {};
        Object.keys(categories).forEach(category => {
            const itemIndex = promptHeaders.indexOf(header);
            appCategories[header][category] = categories[category][itemIndex] || [];
        });
    });
    
    return {
        objective,
        prompt1InterestsMode,
        criterionLabels,
        categories: appCategories,
        activityName,
        theme,
        background
    };
}

// Manually populate the grid with default activity data
function populateDefaultActivity(data) {
    console.log('Populating default activity:', data);
    
    // Set objective
    const objectiveInput = document.getElementById('objective-input');
    if (objectiveInput) {
        objectiveInput.value = data.objective || '';
    }
    
    // Set checkbox
    const checkbox = document.getElementById('prompt1-interests-mode');
    if (checkbox) {
        checkbox.checked = data.prompt1InterestsMode || false;
    }
    
    // Add prompt headers
    const promptHeadersEl = document.getElementById('prompt-headers');
    const promptHeadersData = Object.keys(data.categories); // ['USES', 'AND IS']
    
    if (promptHeadersEl) {
        promptHeadersData.forEach((headerName, index) => {
            const headerDiv = document.createElement('div');
            headerDiv.className = 'prompt-column';
            headerDiv.innerHTML = `
                <input type="text" class="header-input" placeholder="Enter Prompt ${index + 1}" value="${headerName}">
                ${index > 0 ? '<button class="delete-prompt" onclick="deletePrompt(this)">[ X ]</button>' : ''}
            `;
            promptHeadersEl.appendChild(headerDiv);
        });
        
        // Update grid columns after adding headers
        if (window.updateGridColumns) {
            window.updateGridColumns();
        }
    }
    
    // Add categories
    const categoriesContainer = document.getElementById('categories-container');
    const criterionLabels = data.criterionLabels || [];
    
    if (categoriesContainer) {
        criterionLabels.forEach((label, labelIndex) => {
            if (!label) return;
            
            // Create criterion label container
            const criterionContainer = document.createElement('div');
            criterionContainer.className = 'criterion-label-container';
            
            const criterionInput = document.createElement('input');
            criterionInput.type = 'text';
            criterionInput.className = 'criterion-label-input';
            criterionInput.placeholder = 'Enter criterion label';
            criterionInput.value = label;
            
            if (labelIndex > 0) {
                criterionContainer.innerHTML = `<button class="delete-category" onclick="deleteCategory(this)">[ X ]</button>`;
            }
            criterionContainer.appendChild(criterionInput);
            
            categoriesContainer.appendChild(criterionContainer);
            
            // Add textareas for each prompt column
            promptHeadersData.forEach((headerName) => {
                const textareaContainer = document.createElement('div');
                textareaContainer.className = 'textarea-container';
                
                const textarea = document.createElement('textarea');
                textarea.placeholder = 'Enter prompts (one per line)';
                
                // Set textarea value from data
                const categoryData = data.categories[headerName];
                if (categoryData && categoryData[label]) {
                    textarea.value = Array.isArray(categoryData[label]) 
                        ? categoryData[label].join('\n')
                        : categoryData[label];
                }
                
                textareaContainer.appendChild(textarea);
                categoriesContainer.appendChild(textareaContainer);
            });
        });
    }
    
    console.log('Grid populated with default activity data');
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
            
            // Check if this is a loaded activity (has a name)
            if (data.activityName) {
                currentLoadedActivity = data.activityName;
                console.log('✅ Restored loaded activity:', currentLoadedActivity);
            }
            
            // Use the same loadSavedData function to ensure consistent restoration
            // This ensures the UI is always in the same state as when "NEW" is pressed
            if (window.loadSavedData) {
                console.log('✅ Using loadSavedData() for consistent state restoration');
                window.loadSavedData();
                
                // Restore activity name and update UI
                if (data.activityName) {
                    updateButtonStates();
                    updateActivityTitle();
                }
            } else {
                console.error('❌ loadSavedData function not available');
            }
            
            console.log('=== DEBUG: loadCurrentStateFromLocalStorage completed ===');
        } catch (e) {
            console.error('❌ Error loading current state:', e);
            // Fallback: ensure at least default state exists
            if (window.initializeDefaultState) {
                window.initializeDefaultState();
            }
        }
    } else {
        console.log('❌ No promptData found in localStorage - initializing default state');
        // If no data exists, initialize default state (same as NEW button)
        if (window.initializeDefaultState) {
            window.initializeDefaultState();
        }
    }
}

// Initialize audio context on first user interaction
document.addEventListener('click', () => {
    if (window.initEditorAudio) {
        window.initEditorAudio();
    }
}, { once: true });

// Initialize editor on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('=== DEBUG: DOMContentLoaded event fired ===');
    
    // Run theme migration immediately on page load to ensure old themes are converted
    if (window.migrateOldThemes) {
        window.migrateOldThemes();
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
        // Fresh load - check if we're starting completely fresh (no localStorage data)
        const existingPromptData = localStorage.getItem('promptCategories');
        let hasExistingData = false;
        
        // Check if there's meaningful data (not just empty object)
        if (existingPromptData) {
            try {
                const parsed = JSON.parse(existingPromptData);
                // Check if there are actual categories with content
                const hasCategories = parsed.categories && Object.keys(parsed.categories).length > 0;
                const hasPromptHeaders = parsed.promptHeaders && parsed.promptHeaders.length > 0;
                // Also check if categories have actual items
                let hasContent = false;
                if (hasCategories) {
                    Object.keys(parsed.categories).forEach(cat => {
                        const catData = parsed.categories[cat];
                        if (Array.isArray(catData)) {
                            // Check if any column has items
                            if (catData.some(col => Array.isArray(col) && col.length > 0)) {
                                hasContent = true;
                            }
                        }
                    });
                }
                hasExistingData = hasCategories && hasPromptHeaders && hasContent;
                console.log('Checking existing data:', {
                    hasCategories,
                    hasPromptHeaders,
                    hasContent,
                    hasExistingData
                });
            } catch (e) {
                console.log('Error parsing existing data, treating as empty:', e);
                hasExistingData = false;
            }
        }
        
        // Only initialize default empty state if starting completely fresh
        if (!hasExistingData) {
            console.log('No existing data found, initializing with default empty state (1 prompt, 1 category)');
            // Ensure Sample is in history but don't load it automatically
            // Wait for it to complete before updating the list
            ensureSampleInHistory().then(() => {
                // Update settings list after Sample is added
                if (window.updateSettingsList) {
                    window.updateSettingsList();
                }
            });
            // Initialize with empty default state (1 prompt, 1 category)
            if (window.initializeDefaultState) {
                window.initializeDefaultState();
            }
        } else {
            // Has existing data - try to restore last run activity or load current state
            const lastRun = loadLastRunActivity();
            if (lastRun) {
                console.log('Found last run activity, loading it:', lastRun.name);
                // Load the activity using the existing loadSettingsByName function
                loadSettingsByName(lastRun.name);
            } else {
                console.log('No last run activity found, loading current state');
                loadCurrentStateFromLocalStorage();
            }
        }
    }
    
    // Load saved theme IMMEDIATELY (synchronously if possible, before any activity loading)
    // This ensures the user's last selected theme is always respected and applied first
    if (window.migrateOldThemes) {
        window.migrateOldThemes();
    }
    
    // Get saved theme and apply it immediately (before any activity loading)
    const savedTheme = localStorage.getItem('selectedTheme');
    if (savedTheme && window.changeTheme) {
        console.log('Applying saved theme immediately:', savedTheme);
        changeTheme(savedTheme);
    }
    
    // Also set up the dropdown when DOM is ready
    const loadThemeDropdownWhenReady = () => {
        if (window.loadSavedTheme) {
            // This will update the dropdown to match the already-applied theme
            window.loadSavedTheme();
        } else {
            // Retry if function not available yet
            setTimeout(loadThemeDropdownWhenReady, 50);
        }
    };
    
    // Update dropdown when DOM is ready
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(loadThemeDropdownWhenReady, 100);
    } else {
        document.addEventListener('DOMContentLoaded', loadThemeDropdownWhenReady, { once: true });
        window.addEventListener('load', () => {
            setTimeout(loadThemeDropdownWhenReady, 50);
        }, { once: true });
    }
    
    // Update button states for empty start
    updateButtonStates();
    
    // Initialize settings list for history
    // First ensure Sample is in history (async), then update the list
    ensureSampleInHistory().then(() => {
        // Update list after Sample is added (if it was added)
        updateSettingsList();
    }).catch(() => {
        // If ensureSampleInHistory fails, still update the list with existing items
        updateSettingsList();
    });
    
    // Add click sound to checkbox
    const checkbox = document.getElementById('prompt1-interests-mode');
    if (checkbox) {
        checkbox.addEventListener('change', () => {
            // Play Mac SE-style click sound
            if (window.playClickSound) {
                window.playClickSound();
            }
        });
    }
    
    // Reload data when returning from randomizer (page becomes visible again)
    document.addEventListener('visibilitychange', () => {
        console.log('Visibility changed, hidden:', document.hidden);
        if (!document.hidden) {
            // Only reload data if we have a loaded activity, not on fresh start
            if (currentLoadedActivity) {
                console.log('Page became visible, reloading data for activity:', currentLoadedActivity);
                setTimeout(() => {
                    loadSavedData();
                }, 100); // Small delay to ensure page is fully loaded
            } else {
                console.log('Page became visible but no activity loaded - keeping fresh start');
            }
        }
    });
    
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
    
    // Add debug logs back
    console.log('Final prompt headers:', document.querySelectorAll('.header-input'));
    console.log('Final category rows:', document.querySelectorAll('.category-row'));
    
    // Checkbox state is now saved only when user explicitly saves via "SAVE" button
});

// Make functions globally available
window.quickTest = quickTest;
window.checkIfHasData = checkIfHasData;
window.loadCurrentStateFromLocalStorage = loadCurrentStateFromLocalStorage;
window.returnToApp = () => window.location.href = 'index.html';

// Global reference to UI manager functions
// These are defined in editor-ui-manager.js which loads before this file
// Just ensure they're accessible from the global scope when needed
