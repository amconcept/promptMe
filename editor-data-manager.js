// Editor Data Manager - Handles data persistence and CSV operations
// Responsible for: Saving/loading data, CSV export/import, localStorage management

// D-018: empty headings stay unlabeled. Categories can't use "" as a key twice,
// so a blank column is stored as __blank_0, __blank_1, … and never drawn on the card.
const BLANK_PROMPT_HEADER_PREFIX = '__blank_';
function isUnlabeledPromptHeader(header) {
    const t = String(header == null ? '' : header).trim();
    if (!t) return true;
    if (t.indexOf(BLANK_PROMPT_HEADER_PREFIX) === 0) return true;
    // Old save path invented "PROMPT 1" when the field was empty
    return /^PROMPT\s+\d+$/i.test(t);
}
function promptHeaderStorageKey(rawLabel, columnIndex) {
    const t = String(rawLabel == null ? '' : rawLabel).trim();
    if (!t || isUnlabeledPromptHeader(t)) return BLANK_PROMPT_HEADER_PREFIX + columnIndex;
    return t;
}
function promptHeaderEditorValue(storageKey) {
    return isUnlabeledPromptHeader(storageKey) ? '' : String(storageKey == null ? '' : storageKey);
}
window.isUnlabeledPromptHeader = isUnlabeledPromptHeader;
window.promptHeaderStorageKey = promptHeaderStorageKey;
window.promptHeaderEditorValue = promptHeaderEditorValue;

/** D-063: teacher switch — grouping labels become tappable in the prompting window. */
function isGroupingSelectModeOn() {
    const el = document.getElementById('prompt1-interests-mode');
    return !!(el && el.checked);
}
function setGroupingSelectMode(on) {
    const el = document.getElementById('prompt1-interests-mode');
    if (el) {
        el.disabled = false;
        el.removeAttribute('hidden');
        el.checked = !!on;
    }
    if (typeof window.syncGroupingSelectRow === 'function') {
        window.syncGroupingSelectRow({ skipSave: true });
    }
}
window.isGroupingSelectModeOn = isGroupingSelectModeOn;
window.setGroupingSelectMode = setGroupingSelectMode;

// Save changes to localStorage (editor prompts/categories; working report and usedPrompts preserved)
let _saveChangesFlushing = false;
function saveChanges() {
    // D-010: only copy cube → grid when the cube is the live editor. On desktop
    // the cube fields still exist but are empty/hidden; flushing them here
    // overwrote the grid ~0.6s after typing (auto-save).
    const cubeIsLive = typeof isCubeLayout === 'function' && isCubeLayout();
    if (!_saveChangesFlushing && cubeIsLive && typeof flushPromptCube === 'function') {
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
        prompt1InterestsMode: isGroupingSelectModeOn(),
        criterionLabels: criterionLabels,
        activityName: currentLoadedActivity,
        categories: {}
    };

    const headers = document.querySelectorAll('.header-input');
    const textareas = document.querySelectorAll('.textarea-container textarea');
    const criterionInputs = document.querySelectorAll('.criterion-label-input');
    const promptCount = headers.length;

    headers.forEach((header, columnIndex) => {
        const headerText = promptHeaderStorageKey(header.value, columnIndex);
        data.categories[headerText] = {};
        criterionInputs.forEach((criterionInput, rowIndex) => {
            const categoryLabel = criterionInput.value.trim() || `Category ${rowIndex + 1}`;
            const textareaIndex = rowIndex * promptCount + columnIndex;
            const textarea = textareas[textareaIndex];
            // D-015: include img: tokens from data-image-ids so picture-only cells still save
            const lines = (typeof getPromptLinesFromTextarea === 'function')
                ? getPromptLinesFromTextarea(textarea)
                : (textarea && textarea.value.trim()
                    ? textarea.value.split('\n').map((line) => line.trim()).filter((line) => line.length > 0)
                    : []);
            if (textarea && lines.length > 0) {
                data.categories[headerText][categoryLabel] = lines;
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
    // D-033 / D-055: auto-save rebuilds this object from the grid — keep stamped look + film.
    if (existingData.theme) data.theme = existingData.theme;
    if (existingData.background) data.background = existingData.background;
    if (existingData.themeKnobs && typeof existingData.themeKnobs === 'object') data.themeKnobs = existingData.themeKnobs;
    if (existingData.revealAnimation && typeof existingData.revealAnimation === 'object') {
        data.revealAnimation = existingData.revealAnimation;
    }

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

/**
 * D-068: the phone editor used to cut the objective to one window-width line,
 * and RUN saved that cut. Activity History often still has the rest of the
 * sentence. When the working text is only the start of the saved one, put
 * the ending back. A sentence the teacher shortened and then Saved is left alone.
 */
function restoreObjectiveTailIfPhoneTrimmed(parsedData) {
    if (!parsedData || typeof parsedData !== 'object') return;
    const working = String(parsedData.objective || '').trim();
    const name = parsedData.activityName;
    if (!working || !name) return;
    let saved = '';
    try {
        const all = JSON.parse(localStorage.getItem('promptSettings') || '{}');
        const row = all[name];
        saved = String((row && row.objective) || '').trim();
    } catch (e) {
        return;
    }
    if (!saved || saved.length <= working.length || saved.indexOf(working) !== 0) return;
    parsedData.objective = saved;
    try {
        const raw = localStorage.getItem('promptCategories');
        const stored = raw ? JSON.parse(raw) : null;
        if (stored && stored.activityName === name && String(stored.objective || '').trim() === working) {
            stored.objective = saved;
            localStorage.setItem('promptCategories', JSON.stringify(stored));
        }
    } catch (e) { /* in-memory sentence still has the ending */ }
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
                // D-068: put back an ending the phone field sliced off, when History still has it.
                restoreObjectiveTailIfPhoneTrimmed(data);
                objectiveInput.value = data.objective || '';
            }

            // D-063: restore after rows exist so the switch can show at 2+ groupings

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
                headerInputs[headerInputs.length - 1].value = promptHeaderEditorValue(header);
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

            setGroupingSelectMode(data.prompt1InterestsMode === true);

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
            if (typeof window.hydrateAllPromptImageFields === 'function') {
                window.hydrateAllPromptImageFields();
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

function collectShareActivityData() {
    const currentData = {
        activityName: (typeof currentLoadedActivity !== 'undefined' && currentLoadedActivity) ? currentLoadedActivity : 'Untitled Activity',
        objective: document.getElementById('objective-input').value,
        theme: localStorage.getItem('selectedTheme') || 'windows',
        background: localStorage.getItem('selectedBackground') || 'black',
        prompt1InterestsMode: isGroupingSelectModeOn(),
        criterionLabels: criterionLabels,
        categories: {},
        promptHeaders: []
    };

    document.querySelectorAll('.header-input').forEach(function (header) {
        currentData.promptHeaders.push(header.value.trim());
    });

    const criterionInputs = document.querySelectorAll('.criterion-label-input');
    const textareas = document.querySelectorAll('.textarea-container textarea');
    const promptCount = document.querySelectorAll('.header-input').length;

    criterionInputs.forEach(function (criterionInput, rowIndex) {
        const categoryLabel = criterionInput.value.trim() || ('Category ' + (rowIndex + 1));
        const categoryData = [];
        for (let colIndex = 0; colIndex < promptCount; colIndex++) {
            const textarea = textareas[rowIndex * promptCount + colIndex];
            if (textarea) {
                const lines = (typeof getPromptLinesFromTextarea === 'function')
                    ? getPromptLinesFromTextarea(textarea)
                    : (textarea.value.trim() ? textarea.value.trim().split('\n').filter(function (line) { return line.trim(); }) : []);
                categoryData.push(lines);
            } else {
                categoryData.push([]);
            }
        }
        if (categoryData.length > 0) {
            currentData.categories[categoryLabel] = categoryData;
        }
    });

    if (currentData.promptHeaders.length === 0) {
        const maxColumns = Math.max.apply(null, Object.keys(currentData.categories).map(function (k) {
            const arr = currentData.categories[k];
            return Array.isArray(arr) ? arr.length : 0;
        }).concat([1]));
        currentData.promptHeaders = Array.from({ length: maxColumns }, function () { return ''; });
    }
    return currentData;
}

function downloadShareFile(blob, filename) {
    if (typeof downloadBlob === 'function') {
        downloadBlob(blob, filename);
        return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function notifyShareResult(message, isError) {
    if (typeof showThemedAlert === 'function') showThemedAlert(message);
    else alert(message);
    if (isError) console.error(message);
}

// Share: quoted CSV (D-057). Pictures → zip with media/ after a SHARE/CANCEL warning.
function exportSettings() {
    const currentData = collectShareActivityData();
    const csvContent = (typeof serializeActivityCsv === 'function')
        ? serializeActivityCsv(currentData)
        : '';
    if (!csvContent) {
        notifyShareResult('Could not share this activity.');
        return;
    }
    const dateStamp = new Date().toISOString().split('T')[0];
    const stem = (typeof safeShareStem === 'function')
        ? safeShareStem(currentData.activityName)
        : 'activity';
    const tokens = (typeof listImageTokensFromGrid === 'function')
        ? listImageTokensFromGrid(currentData.categories)
        : [];

    function downloadCsv() {
        downloadShareFile(new Blob([csvContent], { type: 'text/csv' }), 'promptme-' + stem + '-' + dateStamp + '.csv');
        notifyShareResult('Activity shared as CSV.');
    }

    function downloadZip() {
        const fetchFiles = (typeof fetchImageFilesForTokens === 'function')
            ? fetchImageFilesForTokens(tokens)
            : Promise.resolve([]);
        fetchFiles.then(function (files) {
            const zipBlob = buildActivityZip(csvContent, files);
            downloadShareFile(zipBlob, 'promptme-' + stem + '-' + dateStamp + '.zip');
            notifyShareResult('Activity shared as a folder with images.');
        }).catch(function (err) {
            notifyShareResult('Could not pack the images. ' + (err && err.message ? err.message : ''), true);
        });
    }

    if (!tokens.length) {
        downloadCsv();
        return;
    }
    const warning = (typeof SHARE_IMAGES_WARNING === 'string')
        ? SHARE_IMAGES_WARNING
        : 'Saving this means saving images. The download is a folder (zip) with the prompt list and a media folder.';
    if (typeof showThemedConfirm === 'function') {
        showThemedConfirm(warning, { confirm: 'SHARE', cancel: 'CANCEL' }, function (ok) {
            if (ok) downloadZip();
        });
        return;
    }
    if (window.confirm(warning)) downloadZip();
}

function applyImportedActivity(parsed) {
    const activityName = parsed.activityName || '';
    const objective = parsed.objective || '';
    const theme = parsed.theme || 'windows';
    const background = parsed.background || 'black';
    const criterionLabelsImported = Array.isArray(parsed.criterionLabels) ? parsed.criterionLabels : [];
    const promptHeaders = parsed.promptHeaders || [];
    const categories = parsed.categories || {};

    if (theme) {
        localStorage.setItem('selectedTheme', theme);
        if (typeof changeTheme === 'function') changeTheme(theme);
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) themeSelect.value = theme;
    }
    if (background) {
        localStorage.setItem('selectedBackground', background);
        if (typeof changeBackground === 'function') changeBackground(background);
        const bgSelect = document.getElementById('bg-select');
        if (bgSelect) bgSelect.value = background;
    }

    // D-063: apply after grouping rows exist (end of this function)

    window.criterionLabels = criterionLabelsImported;
    if (typeof criterionLabels !== 'undefined') criterionLabels = criterionLabelsImported;

    const objectiveInput = document.getElementById('objective-input');
    if (objectiveInput) {
        objectiveInput.value = objective;
        if (window.enforceObjectiveWidthLimit) setTimeout(window.enforceObjectiveWidthLimit, 0);
    }

    const promptHeadersEl = document.getElementById('prompt-headers');
    const addButton = promptHeadersEl.querySelector('.add-prompt-button');
    if (addButton) addButton.remove();
    promptHeadersEl.innerHTML = '';
    if (addButton) promptHeadersEl.appendChild(addButton);

    document.getElementById('categories-container').innerHTML = '';
    promptCounter = 0;
    categoryCounter = 0;

    promptHeaders.forEach(function (headerName) {
        addNewPrompt();
        const newHeaderInputs = document.querySelectorAll('.header-input');
        const lastHeader = newHeaderInputs[newHeaderInputs.length - 1];
        if (lastHeader) {
            lastHeader.value = (typeof promptHeaderEditorValue === 'function')
                ? promptHeaderEditorValue(headerName)
                : headerName;
        }
    });

    Object.keys(categories).forEach(function (categoryName) {
        addNewCategory();
        const criterionInputs = document.querySelectorAll('.criterion-label-input');
        const textareas = document.querySelectorAll('.textarea-container textarea');
        const lastRowIndex = criterionInputs.length - 1;
        const promptCount = document.querySelectorAll('.header-input').length;
        if (criterionInputs[lastRowIndex]) {
            criterionInputs[lastRowIndex].value = categoryName;
        }
        const categoryData = categories[categoryName];
        (categoryData || []).forEach(function (columnData, colIndex) {
            const textarea = textareas[lastRowIndex * promptCount + colIndex];
            if (textarea && Array.isArray(columnData)) {
                textarea.value = columnData.join('\n');
            } else if (textarea && columnData) {
                textarea.value = Array.isArray(columnData) ? columnData.join('\n') : columnData;
            }
        });
    });

    if (window.updateGridColumns) window.updateGridColumns();
    if (typeof updateColumnCounts === 'function') updateColumnCounts();
    if (window.refreshPromptCube) window.refreshPromptCube();
    if (typeof window.hydrateAllPromptImageFields === 'function') {
        window.hydrateAllPromptImageFields();
    }
    setGroupingSelectMode(parsed.prompt1InterestsMode === true);
    saveChanges();

    const historyName = activityName || ('Imported Activity ' + new Date().toLocaleString());
    if (typeof saveActivityWithName === 'function') saveActivityWithName(historyName);
    if (typeof updateButtonStates === 'function') updateButtonStates();
}

// Load a quoted CSV or a zip pack with media/ (D-057).
function importSettings() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv,.zip,text/csv,application/zip';
    fileInput.style.display = 'none';

    fileInput.onchange = function (event) {
        const file = event.target.files[0];
        if (!file) return;
        const readPack = (typeof readActivityPack === 'function')
            ? readActivityPack(file)
            : new Promise(function (resolve, reject) {
                const reader = new FileReader();
                reader.onload = function () { resolve({ csvText: String(reader.result || ''), images: [] }); };
                reader.onerror = function () { reject(new Error('Could not read that file.')); };
                reader.readAsText(file);
            });
        readPack.then(function (pack) {
            const parsed = (typeof parseActivityCsv === 'function')
                ? parseActivityCsv(pack.csvText)
                : null;
            if (!parsed) throw new Error('Could not read that activity.');
            const store = (typeof storeImportedImages === 'function')
                ? storeImportedImages(pack.images)
                : Promise.resolve();
            return store.then(function () { applyImportedActivity(parsed); });
        }).catch(function (error) {
            notifyShareResult('Error loading activity: ' + (error && error.message ? error.message : error), true);
        });
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
