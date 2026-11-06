// Editor Main - Orchestrates all editor functionality
// Responsible for: Initialization, event handling, coordination between modules

// Global variables
let classList = []; // Array to store student names from uploaded class list

// Open sketch in the same tab so >EDITOR returns to this window.
// Phone/cube preference is stored so editor can restore cube even if viewport blips.
function openSketchFromEditor() {
    if (typeof rememberEditorLayoutForSketch === 'function') {
        rememberEditorLayoutForSketch();
    } else if (window.matchMedia('(max-width: 640px), ((max-width: 900px) and (max-aspect-ratio: 3/4))').matches) {
        sessionStorage.setItem('promptMeEditorLayout', 'cube');
    } else {
        sessionStorage.setItem('promptMeEditorLayout', 'grid');
    }
    window.location.href = 'sketch.html?from=editor&v=20260830br';
}

// Quick test function - navigate to sketch. Blocks if prompts missing; offers Skip if only objective missing (D-011).
function quickTest() {
    if (window.playClickSound) {
        window.playClickSound();
    }
    saveChanges();
    const raw = localStorage.getItem('promptCategories');
    let missingObjective = true;
    let missingPrompts = true;
    if (raw) {
        try {
            const data = JSON.parse(raw);
            missingObjective = !(data.objective && String(data.objective).trim());
            const cats = data.categories || {};
            const headers = Object.keys(cats).filter(k => cats[k] && typeof cats[k] === 'object');
            const hasPromptContent = headers.some(h => Object.values(cats[h]).some(arr => Array.isArray(arr) && arr.length > 0));
            missingPrompts = !hasPromptContent;
        } catch (e) {
            missingObjective = true;
            missingPrompts = true;
        }
    }
    // Prompts missing: block and ask user to create prompts (no skip).
    if (missingPrompts) {
        if (window.showThemedAlert) {
            window.showThemedAlert('Please create prompts before starting.');
        } else {
            alert('Please create prompts before starting.');
        }
        return;
    }
    // Objective missing but prompts exist: warn, Skip proceeds anyway (D-011).
    if (missingObjective) {
        if (window.showMissingObjectiveWithSkip) {
            window.showMissingObjectiveWithSkip(() => openSketchFromEditor());
        } else {
            if (confirm('Missing objective. Skip and open prompting window?')) {
                openSketchFromEditor();
            }
        }
        return;
    }
    openSketchFromEditor();
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
    
    // Check if any textareas have content (including image-only cells, D-015)
    const textareas = document.querySelectorAll('textarea');
    for (let textarea of textareas) {
        if (textarea.value.trim().length > 0) return true;
        if (textarea.dataset && textarea.dataset.imageIds) return true;
    }
    
    // Check if criterion labels have content
    if (criterionLabels.some(label => label.trim().length > 0)) return true;
    
    return false;
}

// D-066: restore SIMPLE, SOD+A, SOD+A w/ Groupings if missing
async function ensureSampleInHistory() {
    if (typeof window.ensureBakedSamplesInHistory === 'function') {
        return window.ensureBakedSamplesInHistory();
    }
}

// Load hardcoded default activity from CSV file
async function loadDefaultActivity() {
    // Try to load from CSV file
    let defaultActivity;
    try {
            const response = await fetch('SIMPLE.csv?v=20260830br');
        const csvText = await response.text();
        defaultActivity = parseCSVToActivity(csvText);
        console.log('Loaded Sample activity from CSV file');
    } catch (error) {
        console.error('Failed to load CSV, using empty fallback:', error);
        defaultActivity = {
            objective: '',
            constraintEnabled: true,
            prompt1InterestsMode: false,
            criterionLabels: ['', '', '', ''],
            categories: {},
            activityName: 'Sample',
            theme: 'windows',
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
        // No theme saved yet, use Windows (Microsoft) as default
        const themeToUse = 'windows';
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
    const parsed = (typeof parseActivityCsv === 'function')
        ? parseActivityCsv(csvText)
        : { activityName: '', objective: '', theme: 'pink', background: 'black', prompt1InterestsMode: false, criterionLabels: [], promptHeaders: [], categories: {} };
    const promptHeaders = parsed.promptHeaders || [];
    const categories = parsed.categories || {};
    const appCategories = {};
    promptHeaders.forEach(function (header) {
        appCategories[header] = {};
        Object.keys(categories).forEach(function (category) {
            const itemIndex = promptHeaders.indexOf(header);
            appCategories[header][category] = (categories[category] && categories[category][itemIndex]) || [];
        });
    });
    return {
        objective: parsed.objective,
        prompt1InterestsMode: parsed.prompt1InterestsMode,
        criterionLabels: parsed.criterionLabels,
        categories: appCategories,
        activityName: parsed.activityName,
        theme: parsed.theme,
        background: parsed.background
    };
}

// Manually populate the grid with default activity data
function populateDefaultActivity(data) {
    console.log('Populating default activity:', data);
    
    // Set objective
    const objectiveInput = document.getElementById('objective-input');
    if (objectiveInput) {
        objectiveInput.value = data.objective || '';
        if (window.enforceObjectiveWidthLimit) setTimeout(window.enforceObjectiveWidthLimit, 0);
    }
    
    // Criteria-selectable UI removed — keep off until feature is ready
    const checkbox = document.getElementById('prompt1-interests-mode');
    if (checkbox) checkbox.checked = false;
    
    // Add prompt headers
    const promptHeadersEl = document.getElementById('prompt-headers');
    const promptHeadersData = Object.keys(data.categories); // e.g. ['USES', 'AND']
    
    if (promptHeadersEl) {
        promptHeadersData.forEach((headerName, index) => {
            const headerDiv = document.createElement('div');
            headerDiv.className = 'prompt-column';
            headerDiv.innerHTML = `
                <input type="text" class="header-input" placeholder="Enter Prompt ${index + 1}" value="${(typeof promptHeaderEditorValue === 'function' ? promptHeaderEditorValue(headerName) : headerName).replace(/"/g, '&quot;')}">
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
            criterionInput.placeholder = 'Enter grouping label';
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
                
                // Add event listeners for auto-resizing
                textarea.addEventListener('input', () => {
                    if (window.autoResizeTextareasInRows) {
                        setTimeout(window.autoResizeTextareasInRows, 10);
                    }
                });
                
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
    
    // Check if we're returning from sketch or opening Help from the welcome page
    const urlParams = new URLSearchParams(window.location.search);
    const isFromSketch = urlParams.get('from') === 'sketch';
    const openHelp = urlParams.get('help') === '1';
    const openTour = urlParams.get('tour') === '1';
    
    console.log('=== DEBUG: Editor initialization ===');
    console.log('Current URL:', window.location.href);
    console.log('URL params:', window.location.search);
    console.log('isFromSketch:', isFromSketch);
    
    if (isFromSketch) {
        console.log('✅ Returned from sketch - restoring working state from promptCategories');
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        // Always load working state (promptCategories), not saved history (promptSettings)
        loadCurrentStateFromLocalStorage();
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
                // promptCategories stores categories as { "PROMPT 1": { "A": [...], "B": [...] }, ... }
                const hasCategories = parsed.categories && typeof parsed.categories === 'object' && Object.keys(parsed.categories).length > 0;
                let hasContent = false;
                if (hasCategories) {
                    Object.values(parsed.categories).forEach(catData => {
                        if (catData && typeof catData === 'object' && !Array.isArray(catData)) {
                            Object.values(catData).forEach(arr => {
                                if (Array.isArray(arr) && arr.length > 0) hasContent = true;
                            });
                        }
                    });
                }
                hasExistingData = hasCategories && (hasContent || Object.keys(parsed.categories).length > 0);
                console.log('Checking existing data:', { hasCategories, hasContent, hasExistingData });
            } catch (e) {
                console.log('Error parsing existing data, treating as empty:', e);
                hasExistingData = false;
            }
        }
        
        // D-066: first-time (no lists yet) opens SIMPLE, then the short walkthrough
        if (!hasExistingData) {
            console.log('No existing data found, loading SIMPLE');
            ensureSampleInHistory().then(function () {
                if (window.updateSettingsList) window.updateSettingsList();
                if (typeof window.loadSettingsByName === 'function') {
                    return window.loadSettingsByName('SIMPLE');
                }
                if (window.initializeDefaultState) window.initializeDefaultState();
            }).then(function () {
                setTimeout(function () {
                    if (window.startEditorTour) {
                        window.startEditorTour({ firstVisit: true });
                    }
                }, 350);
            }).catch(function (err) {
                console.error('Failed first-visit session load:', err);
                if (window.initializeDefaultState) window.initializeDefaultState();
            });
        } else {
            // Has existing data - load working state from promptCategories (not saved history)
            console.log('Found existing promptCategories, loading working state');
            loadCurrentStateFromLocalStorage();
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
            if (window.playClickSound) window.playClickSound();
        });
    }

    // Auto-save prompts/categories to localStorage as teacher edits (debounced)
    const editorContainer = document.querySelector('.editor-content') || document.getElementById('editor-content') || document.body;
    if (editorContainer && window.autoSaveToLocalStorage) {
        editorContainer.addEventListener('input', window.autoSaveToLocalStorage);
        editorContainer.addEventListener('change', window.autoSaveToLocalStorage);
    }
    // Also hook objective and prompt headers if they live outside that container
    const objectiveInput = document.getElementById('objective-input');
    if (objectiveInput && window.autoSaveToLocalStorage) {
        objectiveInput.addEventListener('input', window.autoSaveToLocalStorage);
    }
    if (window.bindObjectiveWidthLimit) window.bindObjectiveWidthLimit();
    if (window.enforceObjectiveWidthLimit) window.enforceObjectiveWidthLimit();

    // When editor tab becomes visible again, refresh UI from working state (promptCategories)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && window.loadSavedData) {
            const raw = localStorage.getItem('promptCategories');
            if (raw) {
                try {
                    const data = JSON.parse(raw);
                    if (data.activityName) currentLoadedActivity = data.activityName;
                } catch (e) { /* ignore */ }
                setTimeout(() => {
                    loadSavedData();
                    if (window.updateButtonStates) window.updateButtonStates();
                    if (window.updateActivityTitle) window.updateActivityTitle();
                    // If an activity name is set (e.g. after loading a report), load that session from history so it's selected in the sidebar
                    if (currentLoadedActivity && window.loadSettingsByName) {
                        const savedSettings = JSON.parse(localStorage.getItem('promptSettings') || '{}');
                        if (savedSettings[currentLoadedActivity]) {
                            window.loadSettingsByName(currentLoadedActivity);
                        }
                    }
                }, 100);
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
                saveChanges();
                window.location.href = 'sketch.html?v=20260830br';
            } else {
                console.log('P pressed in editor - no data, going to index');
                window.location.href = 'index.html';
            }
        }
    });
    
    // Add debug logs back
    console.log('Final prompt headers:', document.querySelectorAll('.header-input'));
    console.log('Final category rows:', document.querySelectorAll('.category-row'));
    
    // Welcome page: editor.html?help=1 opens Help; ?tour=1 replays the walkthrough (D-066)
    if (openHelp || openTour) {
        const params = new URLSearchParams(window.location.search);
        params.delete('help');
        params.delete('tour');
        const qs = params.toString();
        window.history.replaceState({}, document.title, window.location.pathname + (qs ? '?' + qs : ''));
        setTimeout(() => {
            if (openTour && typeof window.startEditorTour === 'function') {
                window.startEditorTour({ force: true });
            } else if (openHelp && typeof window.showInstructionsPopup === 'function') {
                window.showInstructionsPopup();
            }
        }, 250);
    }
    
    // Checkbox state is now saved only when user explicitly saves via "SAVE" button
});

// Make functions globally available
window.quickTest = quickTest;
window.openSketchFromEditor = openSketchFromEditor;
window.checkIfHasData = checkIfHasData;
window.loadCurrentStateFromLocalStorage = loadCurrentStateFromLocalStorage;

// Global reference to UI manager functions
// These are defined in editor-ui-manager.js which loads before this file
// Just ensure they're accessible from the global scope when needed
