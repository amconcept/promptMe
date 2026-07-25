// Data Manager - Handles all data persistence and file operations
// Responsible for: localStorage, CSV uploads, reports, data validation

let classReport = []; // Array to store all student prompt data
let allStudents = []; // Array to track all students (both drawn and not drawn)
let drawnStudents = []; // Array to track students who have had prompts drawn
let manuallyAddedStudents = []; // Track manually added students for report
let originalClassList = []; // Track original uploaded class list separately
let totalUniqueStudents = 0; // Total number of unique students (original class list only)
let uniqueStudentsProcessed = new Set(); // Track which students have been processed
let promptedStudentsOrder = []; // Track the order of students who have been prompted (for left arrow navigation)

// Export to window for use in other modules
window.promptedStudentsOrder = promptedStudentsOrder;

// Clean up any corrupted data in localStorage
function cleanupCorruptedData() {
    try {
        const currentData = localStorage.getItem('promptCategories');
        if (currentData) {
            const data = JSON.parse(currentData);
            
            // Clean up allStudents array
            if (data.allStudents && Array.isArray(data.allStudents)) {
                data.allStudents = data.allStudents.filter(name => 
                    typeof name === 'string' && 
                    name.length > 1 && 
                    name.trim().length > 0 &&
                    !/^[a-zA-Z]$/.test(name)
                );
            }
            
            // Clean up drawnStudents array
            if (data.drawnStudents && Array.isArray(data.drawnStudents)) {
                data.drawnStudents = data.drawnStudents.filter(name => 
                    typeof name === 'string' && 
                    name.length > 1 && 
                    name.trim().length > 0 &&
                    !/^[a-zA-Z]$/.test(name)
                );
            }
            
            // Save cleaned data back
            localStorage.setItem('promptCategories', JSON.stringify(data));
            console.log('Cleaned up corrupted data from localStorage');
        }
    } catch (error) {
        console.error('Error cleaning up corrupted data:', error);
    }
}

// Load prompts and data from localStorage
function loadPromptsFromLocalStorage() {
    const promptData = localStorage.getItem('promptCategories');
    debugLog('Loading prompts from localStorage:', promptData);
    debugLog('Current timestamp:', Date.now());
    
    if (promptData) {
        try {
            const parsedData = JSON.parse(promptData);
            debugLog('Parsed data:', parsedData);
            console.log('Full parsed data structure:', JSON.stringify(parsedData, null, 2));
            
            if (parsedData.categories) {
                categories = parsedData.categories;
                
                // Load criterion labels if they exist
                if (parsedData.criterionLabels && Array.isArray(parsedData.criterionLabels)) {
                    window.criterionLabels = parsedData.criterionLabels;
                    console.log('DEBUG: Loaded criterion labels in main function:', window.criterionLabels);
                } else {
                    window.criterionLabels = ['', '', '', ''];
                    console.log('DEBUG: No criterion labels found, using empty in main function');
                }
                
                // Load prompt1InterestsMode setting
                if (typeof parsedData.prompt1InterestsMode === 'boolean') {
                    window.criterionSelectable = parsedData.prompt1InterestsMode;
                    console.log('DEBUG: Loaded prompt1InterestsMode:', parsedData.prompt1InterestsMode);
                } else {
                    window.criterionSelectable = false;
                    console.log('DEBUG: prompt1InterestsMode not found, defaulting to false');
                }

                // Load "require names" mode (default true) and unnamed counter for optional-name runs
                if (typeof parsedData.requireStudentNames === 'boolean') {
                    window.requireStudentNames = parsedData.requireStudentNames;
                } else if (typeof window.requireStudentNames !== 'boolean') {
                    window.requireStudentNames = false;
                }
                if (typeof parsedData.unnamedRunCounter === 'number' && !Number.isNaN(parsedData.unnamedRunCounter)) {
                    window.unnamedRunCounter = parsedData.unnamedRunCounter;
                } else if (typeof window.unnamedRunCounter !== 'number' || Number.isNaN(window.unnamedRunCounter)) {
                    window.unnamedRunCounter = 0;
                }
                
                // Load constraint setting (always enabled)
                constraintEnabled = true;
                debugLog('Constraint always enabled');
                
                // Load class list data from localStorage for report generation
                if (parsedData.classList && Array.isArray(parsedData.classList)) {
                    classList = parsedData.classList;
                    console.log('Restored class list:', classList);
                } else {
                    classList = [];
                }
                
                if (parsedData.originalClassList && Array.isArray(parsedData.originalClassList)) {
                    originalClassList = parsedData.originalClassList;
                    console.log('Restored original class list:', originalClassList);
                } else {
                    originalClassList = [];
                }
                
                // Prefer per-session activityReports when activity is named; fall back to working promptCategories
                const activityName = parsedData.activityName;
                let loadedSessionReport = false;
                if (activityName) {
                    loadedSessionReport = loadActivityReport(activityName, { resetIfMissing: false });
                    if (loadedSessionReport) {
                        console.log('DEBUG: Restored session report from activityReports for:', activityName, 'entries:', classReport.length);
                    } else if (parsedData.classReport && Array.isArray(parsedData.classReport) && parsedData.classReport.length > 0) {
                        classReport = parsedData.classReport;
                        console.log('DEBUG: Seeded session from working classReport with', classReport.length, 'entries');
                        saveActivityReport(activityName);
                    } else {
                        classReport = [];
                        console.log('DEBUG: No class report for activity yet:', activityName);
                    }
                } else if (parsedData.classReport && Array.isArray(parsedData.classReport) && parsedData.classReport.length > 0) {
                    classReport = parsedData.classReport;
                    console.log('DEBUG: Restored working class report from promptCategories with', classReport.length, 'entries');
                } else {
                    classReport = [];
                    console.log('DEBUG: No class report found, starting fresh');
                }
                window.classReport = classReport;
                
                // If session store already restored names/lists, don't overwrite with possibly other-session working state
                if (!loadedSessionReport) {
                    if (parsedData.allStudents && Array.isArray(parsedData.allStudents)) {
                        allStudents = parsedData.allStudents.filter(name => 
                            typeof name === 'string' && 
                            name.length > 1 && 
                            name.trim().length > 0 &&
                            !/^[a-zA-Z]$/.test(name)
                        );
                        console.log('Restored all students (filtered):', allStudents);
                    } else {
                        allStudents = [];
                    }
                    
                    if (parsedData.drawnStudents && Array.isArray(parsedData.drawnStudents)) {
                        drawnStudents = parsedData.drawnStudents.filter(name => 
                            typeof name === 'string' && name.length > 1
                        );
                        console.log('Restored drawn students (filtered):', drawnStudents);
                    } else {
                        drawnStudents = [];
                    }
                    
                    if (parsedData.manuallyAddedStudents && Array.isArray(parsedData.manuallyAddedStudents)) {
                        manuallyAddedStudents = parsedData.manuallyAddedStudents;
                        console.log('Restored manually added students:', manuallyAddedStudents);
                    } else {
                        manuallyAddedStudents = [];
                    }
                } else {
                    console.log('DEBUG: Keeping session allStudents/drawnStudents from activityReports');
                }
                
                if (!loadedSessionReport) {
                    if (typeof parsedData.totalUniqueStudents === 'number') {
                        totalUniqueStudents = parsedData.totalUniqueStudents;
                        console.log('Restored total unique students count:', totalUniqueStudents);
                    } else {
                        totalUniqueStudents = 0;
                    }
                }
                
                // Auto-populate from session history when present
                if (classReport.length > 0) {
                    currentStudentIndex = classReport.length - 1;
                    studentName = classReport[currentStudentIndex].name || '';
                    if (window.setResultNameFieldValue) window.setResultNameFieldValue(studentName);
                    isManualNameEntry = false;
                    debugLog('Restored last session result:', studentName, currentStudentIndex + 1, 'of', classReport.length);
                } else if (allStudents.length > 0) {
                    studentName = allStudents[0];
                    currentStudentIndex = 0;
                    if (window.setResultNameFieldValue) window.setResultNameFieldValue(studentName);
                    isManualNameEntry = false;
                    debugLog('Auto-populated first student name:', studentName);
                } else {
                    studentName = '';
                    currentStudentIndex = 0;
                    if (window.setResultNameFieldValue) window.setResultNameFieldValue('');
                    isManualNameEntry = false;
                    debugLog('Student name reset to empty (no students)');
                }
                
                // Update UI after loading
                positionNameInputAndButtons();
                
                // Debug objective
                debugLog('Loaded objective:', categories.objective);
                
                // If objective is not set, check if it's in a different structure
                if (!categories.objective && parsedData.objective) {
                    categories.objective = parsedData.objective;
                }
                
                debugLog('Final categories structure:', {
                    objective: categories.objective,
                    categories: Object.keys(categories)
                });
                
                console.log('Final categories object:', categories);
                console.log('Non-objective categories:', Object.keys(categories).filter(cat => cat !== 'objective'));
            } else {
                console.error('Invalid data structure:', parsedData);
                categories = {};
            }
        } catch (e) {
            console.error('Error parsing prompts:', e);
            categories = {};
        }
    } else {
        console.log('No saved data found in localStorage. Starting with empty structure.');
        categories = { objective: '' };
    }
    
    // Restore / rebuild in-play from committed report (authoritative for R4)
    if (typeof window.rebuildUsedPromptsFromClassReport === 'function') {
        window.rebuildUsedPromptsFromClassReport(-1);
    } else if (promptData) {
        try {
            const parsed = JSON.parse(promptData);
            if (parsed.usedPrompts && typeof parsed.usedPrompts === 'object') {
                usedPrompts = {};
                Object.keys(parsed.usedPrompts).forEach(cat => {
                    const arr = parsed.usedPrompts[cat];
                    usedPrompts[cat] = Array.isArray(arr) ? new Set(arr) : new Set();
                });
                if (typeof window !== 'undefined') window.usedPrompts = usedPrompts;
                console.log('DEBUG: Restored usedPrompts from promptCategories');
            }
        } catch (e) {
            console.warn('Could not restore usedPrompts:', e);
        }
    }
    if (!usedPrompts || Object.keys(usedPrompts).length === 0) {
        usedPrompts = {};
        Object.keys(categories).forEach(category => {
            if (category !== 'objective' && category !== 'prompt1InterestsMode') {
                usedPrompts[category] = new Set();
            }
        });
        if (typeof window !== 'undefined') window.usedPrompts = usedPrompts;
    }
}

// Load student name from localStorage
function loadStudentNameFromLocalStorage() {
    const currentData = localStorage.getItem('promptCategories');
    if (currentData) {
        try {
            const data = JSON.parse(currentData);
            if (data.studentName) {
                studentName = data.studentName;
                // Update the input field if it exists
                if (window.setResultNameFieldValue) window.setResultNameFieldValue(studentName);
                console.log('Loaded student name from localStorage:', studentName);
            }
        } catch (error) {
            console.error('Error loading student name:', error);
        }
    }
}

// Merge in-play used prompts: memory wins per key when that key exists on window.usedPrompts; otherwise keep stored arrays (editor round-trip / empty ref).
function mergeUsedPromptsForPersistence(parsedData, memoryUsedPrompts) {
    const prev = (parsedData && typeof parsedData.usedPrompts === 'object' && parsedData.usedPrompts !== null)
        ? parsedData.usedPrompts
        : {};
    const mem = (memoryUsedPrompts && typeof memoryUsedPrompts === 'object') ? memoryUsedPrompts : {};
    const out = {};
    const keys = new Set([...Object.keys(prev), ...Object.keys(mem)]);
    keys.forEach(k => {
        if (Object.prototype.hasOwnProperty.call(mem, k)) {
            const v = mem[k];
            if (v instanceof Set) out[k] = Array.from(v);
            else if (Array.isArray(v)) out[k] = v.slice();
            else out[k] = [];
        } else if (Array.isArray(prev[k])) {
            out[k] = prev[k].slice();
        }
    });
    return out;
}

// Save current state to localStorage (including student name and report data)
function saveCurrentStateToLocalStorage(options) {
    console.log('=== DEBUG: saveCurrentStateToLocalStorage START ===');
    console.log('DEBUG: classReport being saved:', JSON.stringify(classReport, null, 2));
    console.log('DEBUG: allStudents being saved:', allStudents);
    console.log('DEBUG: classList being saved:', classList);
    console.log('DEBUG: originalClassList being saved:', originalClassList);
    console.log('DEBUG: manuallyAddedStudents being saved:', manuallyAddedStudents);
    
    const currentData = localStorage.getItem('promptCategories');
    let data;
    
    if (currentData) {
        try {
            data = JSON.parse(currentData);
            console.log('DEBUG: Found existing localStorage data, updating it');
        } catch (error) {
            console.error('Error parsing existing localStorage data:', error);
            data = {}; // Create new data structure if parsing fails
        }
    } else {
        console.log('DEBUG: No existing localStorage data found, creating new structure');
        data = {}; // Create new data structure
    }
    
    // Update student name
    data.studentName = studentName;
    data.requireStudentNames = window.requireStudentNames !== false;
    data.unnamedRunCounter = (typeof window.unnamedRunCounter === 'number' && !Number.isNaN(window.unnamedRunCounter))
        ? window.unnamedRunCounter : 0;
    // Keep activity name on working state when known
    const activityName = getCurrentActivityName();
    if (activityName) data.activityName = activityName;
    // Always write current session arrays (including empty) so switching activities cannot bleed reports
    data.classReport = Array.isArray(classReport) ? classReport : [];
    data.allStudents = Array.isArray(allStudents) ? allStudents : [];
    data.drawnStudents = Array.isArray(drawnStudents) ? drawnStudents : [];
    data.manuallyAddedStudents = Array.isArray(manuallyAddedStudents) ? manuallyAddedStudents : [];
    data.totalUniqueStudents = totalUniqueStudents;
    data.classList = Array.isArray(classList) ? classList : [];
    data.originalClassList = Array.isArray(originalClassList) ? originalClassList : [];

    // Persist used prompts: merge memory with last stored snapshot so empty {} memory does not drop exhaust state (editor ↔ sketch).
    const up = typeof window !== 'undefined' && window.usedPrompts && typeof window.usedPrompts === 'object' ? window.usedPrompts : usedPrompts;
    const mergedUsed = mergeUsedPromptsForPersistence(data, up);
    if (Object.keys(mergedUsed).length > 0) {
        data.usedPrompts = mergedUsed;
    }

    // Save back to localStorage
    try {
        localStorage.setItem('promptCategories', JSON.stringify(data));
        console.log('DEBUG: Successfully saved to localStorage');
        console.log('DEBUG: Saved data structure:', JSON.stringify(data, null, 2));
        
        // Verify the save worked
        const verifyData = localStorage.getItem('promptCategories');
        if (verifyData) {
            const verifyParsed = JSON.parse(verifyData);
            console.log('DEBUG: VERIFICATION - Saved classReport length:', verifyParsed.classReport ? verifyParsed.classReport.length : 0);
            console.log('DEBUG: VERIFICATION - Saved allStudents length:', verifyParsed.allStudents ? verifyParsed.allStudents.length : 0);
        }
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }

    // Also mirror into per-session activityReports (unless caller already handled switch)
    if (!options || !options.skipActivityReport) {
        if (activityName) saveActivityReport(activityName);
    }
    
    console.log('=== DEBUG: saveCurrentStateToLocalStorage END ===');
}

// Get current activity name
function getCurrentActivityName() {
    // Try to get from window (set by editor)
    if (window.currentLoadedActivity) {
        return window.currentLoadedActivity;
    }
    // Fallback to localStorage
    try {
        const promptData = localStorage.getItem('promptCategories');
        if (promptData) {
            const parsed = JSON.parse(promptData);
            return parsed.activityName || 'Untitled Activity';
        }
    } catch (e) {
        console.error('Error getting activity name:', e);
    }
    return 'Untitled Activity';
}

// Load report data for a specific activity (session-isolated)
// resetIfMissing: when true (default), clear in-memory report if this activity has none (activity switch).
function loadActivityReport(activityName, options) {
    const resetIfMissing = !options || options.resetIfMissing !== false;
    console.log('Loading report for activity:', activityName);
    try {
        const activityReports = JSON.parse(localStorage.getItem('activityReports') || '{}');
        const activityData = activityReports[activityName];
        
        if (activityData) {
            classReport = Array.isArray(activityData.classReport) ? activityData.classReport : [];
            allStudents = Array.isArray(activityData.allStudents) ? activityData.allStudents : [];
            drawnStudents = Array.isArray(activityData.drawnStudents) ? activityData.drawnStudents : [];
            manuallyAddedStudents = Array.isArray(activityData.manuallyAddedStudents) ? activityData.manuallyAddedStudents : [];
            classList = Array.isArray(activityData.classList) ? activityData.classList : [];
            originalClassList = Array.isArray(activityData.originalClassList) ? activityData.originalClassList : [];
            totalUniqueStudents = activityData.totalUniqueStudents || 0;
            if (typeof activityData.unnamedRunCounter === 'number') {
                window.unnamedRunCounter = activityData.unnamedRunCounter;
            }
            // Restore per-session exhaust / in-play list
            if (activityData.usedPrompts && typeof activityData.usedPrompts === 'object') {
                usedPrompts = {};
                Object.keys(activityData.usedPrompts).forEach(cat => {
                    const arr = activityData.usedPrompts[cat];
                    usedPrompts[cat] = Array.isArray(arr) ? new Set(arr) : new Set();
                });
                if (typeof window !== 'undefined') window.usedPrompts = usedPrompts;
            }
            window.classReport = classReport;
            console.log('Loaded report for activity:', activityName, 'with', classReport.length, 'students');
            return true;
        }

        console.log('No existing report for activity:', activityName, resetIfMissing ? '- starting fresh' : '- keeping current memory');
        if (resetIfMissing) {
            classReport = [];
            allStudents = [];
            drawnStudents = [];
            manuallyAddedStudents = [];
            classList = [];
            originalClassList = [];
            totalUniqueStudents = 0;
            window.classReport = classReport;
        }
        return false;
    } catch (e) {
        console.error('Error loading activity report:', e);
        return false;
    }
}

// Save report data for current activity (session memory — keyed by activity name)
function saveActivityReport(activityName) {
    if (!activityName) return;
    console.log('Saving report for activity:', activityName);
    try {
        const activityReports = JSON.parse(localStorage.getItem('activityReports') || '{}');
        const up = (typeof window !== 'undefined' && window.usedPrompts && typeof window.usedPrompts === 'object')
            ? window.usedPrompts
            : usedPrompts;
        const usedSerialized = {};
        if (up && typeof up === 'object') {
            Object.keys(up).forEach(cat => {
                if (up[cat] instanceof Set) usedSerialized[cat] = Array.from(up[cat]);
                else if (Array.isArray(up[cat])) usedSerialized[cat] = up[cat];
            });
        }
        activityReports[activityName] = {
            classReport: Array.isArray(classReport) ? [...classReport] : [],
            allStudents: Array.isArray(allStudents) ? [...allStudents] : [],
            drawnStudents: Array.isArray(drawnStudents) ? [...drawnStudents] : [],
            manuallyAddedStudents: Array.isArray(manuallyAddedStudents) ? [...manuallyAddedStudents] : [],
            classList: Array.isArray(classList) ? [...classList] : [],
            originalClassList: Array.isArray(originalClassList) ? [...originalClassList] : [],
            totalUniqueStudents: totalUniqueStudents || 0,
            unnamedRunCounter: (typeof window.unnamedRunCounter === 'number' && !Number.isNaN(window.unnamedRunCounter))
                ? window.unnamedRunCounter : 0,
            usedPrompts: usedSerialized
        };
        localStorage.setItem('activityReports', JSON.stringify(activityReports));
        window.classReport = classReport;
        console.log('Saved report for activity:', activityName, 'entries:', classReport.length);
    } catch (e) {
        console.error('Error saving activity report:', e);
    }
}

// Switch to a different activity and load its report (preserves each session's names/history)
function switchActivity(activityName) {
    if (!activityName) return;
    console.log('Switching to activity:', activityName);
    const currentActivity = getCurrentActivityName();
    if (currentActivity && currentActivity !== activityName) {
        // Persist leaving session into activityReports BEFORE replacing memory
        saveActivityReport(currentActivity);
        saveCurrentStateToLocalStorage({ skipActivityReport: true });
    }
    loadActivityReport(activityName, { resetIfMissing: true });
    // Point working activity at the new session before writing promptCategories
    window.currentLoadedActivity = activityName;
    if (typeof currentLoadedActivity !== 'undefined') {
        try { currentLoadedActivity = activityName; } catch (e) { /* editor-only binding */ }
    }
    saveCurrentStateToLocalStorage({ skipActivityReport: true });
    const currentData = localStorage.getItem('promptCategories');
    if (currentData) {
        try {
            const data = JSON.parse(currentData);
            data.activityName = activityName;
            data.classReport = classReport;
            data.allStudents = allStudents;
            data.drawnStudents = drawnStudents;
            data.manuallyAddedStudents = manuallyAddedStudents;
            data.classList = classList;
            data.originalClassList = originalClassList;
            data.totalUniqueStudents = totalUniqueStudents;
            localStorage.setItem('promptCategories', JSON.stringify(data));
        } catch (e) {
            console.error('Error updating activity name:', e);
        }
    }
    // Ensure new session slot exists even if empty
    saveActivityReport(activityName);
}

// Get previous prompts for the CURRENT history slot only (R5 redraw exclusion).
// Never look up by name across other slots — that wrongly excluded/freed other runs' combos.
function getStudentPreviousPrompts(studentName) {
    const out = {};
    if (typeof currentStudentIndex !== 'number' || currentStudentIndex < 0 || currentStudentIndex >= classReport.length) {
        return out; // new empty slot after NEXT — no previous combo
    }
    const studentData = classReport[currentStudentIndex];
    if (!studentData || !studentData.prompts || !Array.isArray(studentData.prompts)) return out;
    studentData.prompts.forEach(p => {
        if (p && p.label && p.value != null) out[p.label] = p.value;
    });
    return out;
}

// Rename a student/result label across report + navigation arrays.
// Returns true when rename succeeded, false on validation/conflict.
function renameStudentResult(oldName, newName) {
    const from = (oldName || '').toString().trim();
    const to = (newName || '').toString().trim();
    if (!from || !to) return false;
    if (from === to) return true;

    const fromReport = from.startsWith('*') ? from.substring(1) : from;
    const toReport = to.startsWith('*') ? to.substring(1) : to;

    const oldIdx = classReport.findIndex(s => s && s.name === fromReport);
    const newIdx = classReport.findIndex(s => s && s.name === toReport);
    const allStudentsConflict = Array.isArray(allStudents) && allStudents.some(n => n === to || n === toReport);
    const oldPresentInAllStudents = Array.isArray(allStudents) && allStudents.some(n => n === from || n === fromReport);
    // Prevent silent overwrite/merge unless renaming to the same entry.
    if (newIdx >= 0 && newIdx !== oldIdx) return false;
    if (allStudentsConflict && !oldPresentInAllStudents) return false;

    if (oldIdx >= 0) {
        classReport[oldIdx].name = toReport;
    }

    const replaceNameInArray = (arr) => {
        if (!Array.isArray(arr)) return;
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] === from || arr[i] === fromReport) arr[i] = toReport;
        }
    };

    replaceNameInArray(allStudents);
    replaceNameInArray(drawnStudents);
    replaceNameInArray(manuallyAddedStudents);
    replaceNameInArray(classList);
    replaceNameInArray(originalClassList);
    if (window.promptedStudentsOrder) replaceNameInArray(window.promptedStudentsOrder);

    if (studentName === from || studentName === fromReport) studentName = toReport;
    if (typeof window !== 'undefined') window.classReport = classReport;
    saveCurrentStateToLocalStorage();
    return true;
}

// Live-update the label for the current run slot: class report, nav arrays, and persistence (teacher edits name in place).
function syncResultLabelFromInput(rawValue) {
    const trimmed = (rawValue || '').toString().trim();
    if (typeof currentStudentIndex !== 'number' || currentStudentIndex < 0) return;

    studentName = trimmed;

    // Extend allStudents to fit the slot index — NEVER clamp currentStudentIndex down
    // (clamping jumped NEXT back onto an old run and putBack freed its prompts early).
    if (Array.isArray(allStudents)) {
        while (allStudents.length <= currentStudentIndex) allStudents.push('');
        allStudents[currentStudentIndex] = trimmed;
        if (typeof totalUniqueStudents !== 'undefined') totalUniqueStudents = allStudents.length;
    }

    if (currentStudentIndex < classReport.length && classReport[currentStudentIndex]) {
        const prev = classReport[currentStudentIndex].name;
        classReport[currentStudentIndex].name = trimmed;
        if (prev !== trimmed) {
            const replaceInArray = (arr) => {
                if (!Array.isArray(arr)) return;
                for (let i = 0; i < arr.length; i++) {
                    if (arr[i] === prev) arr[i] = trimmed;
                }
            };
            replaceInArray(drawnStudents);
            if (window.promptedStudentsOrder) replaceInArray(window.promptedStudentsOrder);
        }
    }

    if (typeof window !== 'undefined') window.classReport = classReport;
    saveCurrentStateToLocalStorage();
}

/**
 * R4/R6 source of truth: rebuild in-play bags from classReport in draw order.
 * Each prompt type is a without-replacement bag; when its union is covered, that
 * type's bag clears (R6) and a new cycle starts. excludeSlotIndex omits a slot (R5 redraw).
 */
function rebuildUsedPromptsFromClassReport(excludeSlotIndex) {
    const next = {};
    const unionSize = {};
    if (typeof categories === 'object' && categories) {
        Object.keys(categories).forEach(k => {
            if (k === 'objective' || k === 'prompt1InterestsMode') return;
            next[k] = new Set();
            const u = new Set();
            const byCat = categories[k];
            if (byCat && typeof byCat === 'object') {
                Object.keys(byCat).forEach(cat => {
                    const arr = byCat[cat];
                    if (Array.isArray(arr)) arr.forEach(v => u.add(v));
                });
            }
            unionSize[k] = u.size;
        });
    }
    if (Array.isArray(classReport)) {
        for (let i = 0; i < classReport.length; i++) {
            if (typeof excludeSlotIndex === 'number' && excludeSlotIndex >= 0 && i === excludeSlotIndex) continue;
            const entry = classReport[i];
            if (!entry || !Array.isArray(entry.prompts)) continue;
            entry.prompts.forEach(p => {
                if (!p || !p.label || p.value == null || p.value === '') return;
                if (!(next[p.label] instanceof Set)) next[p.label] = new Set();
                next[p.label].add(p.value);
                const need = unionSize[p.label] || 0;
                if (need > 0 && next[p.label].size >= need) {
                    next[p.label].clear(); // R6: finished a full cycle for this type
                }
            });
        }
    }
    usedPrompts = next;
    if (typeof window !== 'undefined') window.usedPrompts = next;
    const snapshot = {};
    Object.keys(next).forEach(k => { snapshot[k] = Array.from(next[k]); });
    console.log('DEBUG: Cycle-aware rebuilt usedPrompts (exclude', excludeSlotIndex, '):', snapshot);
    return next;
}

// Put CURRENT SLOT's prompts back into the pool (R5: same slot, new draw only).
// Prefer rebuildUsedPromptsFromClassReport at generation start; kept for compatibility.
function putBackStudentPromptsIntoPool(studentName) {
    if (typeof currentStudentIndex !== 'number' || currentStudentIndex < 0 || currentStudentIndex >= classReport.length) {
        return;
    }
    const studentData = classReport[currentStudentIndex];
    if (!studentData || !studentData.prompts || !Array.isArray(studentData.prompts) || studentData.prompts.length === 0) return;
    if (!window.usedPrompts || typeof window.usedPrompts !== 'object') return;
    studentData.prompts.forEach(p => {
        if (p && p.label && p.value != null && window.usedPrompts[p.label]) {
            const set = window.usedPrompts[p.label];
            if (set && typeof set.delete === 'function') {
                set.delete(p.value);
                console.log('DEBUG: Put back into pool (slot', currentStudentIndex + '):', p.label, p.value);
            }
        }
    });
}

// Export functions for use in other modules
window.getCurrentActivityName = getCurrentActivityName;
window.loadActivityReport = loadActivityReport;
window.saveActivityReport = saveActivityReport;
window.switchActivity = switchActivity;
window.putBackStudentPromptsIntoPool = putBackStudentPromptsIntoPool;
window.rebuildUsedPromptsFromClassReport = rebuildUsedPromptsFromClassReport;
window.getStudentPreviousPrompts = getStudentPreviousPrompts;
window.renameStudentResult = renameStudentResult;
window.syncResultLabelFromInput = syncResultLabelFromInput;

// Collect prompt data for class report
function collectPromptData() {
    console.log('=== DEBUG: collectPromptData START ===');
    console.log('DEBUG: studentName:', studentName);
    console.log('DEBUG: currentPrompts:', currentPrompts);
    console.log('DEBUG: categories keys:', Object.keys(categories));
    console.log('DEBUG: classReport before:', classReport);
    
    if (!studentName) {
        console.log('DEBUG: No student name, returning');
        return;
    }
    
    // Get the current student's prompts
    const studentPrompts = [];
    
    // Check if prompt1InterestsMode is enabled - if so, skip the first prompt
    const prompt1InterestsMode = categories.prompt1InterestsMode || false;
    const allHeaders = Object.keys(categories).filter(cat => cat !== 'objective' && cat !== 'prompt1InterestsMode');
    const firstHeader = prompt1InterestsMode && allHeaders.length > 0 ? allHeaders[0] : null;
    
    Object.keys(categories).forEach(header => {
        console.log('DEBUG: Checking header:', header);
        
        // Skip objective, prompt1InterestsMode, and first header if prompt1InterestsMode is enabled
        if (header === 'objective' || header === 'prompt1InterestsMode') {
            console.log('DEBUG: Skipping header:', header, 'reason: special field');
            return;
        }
        
        // Skip first prompt if prompt1InterestsMode is enabled
        if (prompt1InterestsMode && header === firstHeader) {
            console.log('DEBUG: Skipping header:', header, 'reason: first prompt skipped in prompt1InterestsMode');
            return;
        }
        
        if (currentPrompts[header]) {
            const promptValue = typeof currentPrompts[header] === 'object' 
                ? currentPrompts[header].revealed 
                : currentPrompts[header];
            console.log('DEBUG: Header', header, 'has prompt value:', promptValue);
            if (promptValue) {
                studentPrompts.push({
                    label: header,
                    value: promptValue
                });
                console.log('DEBUG: Added prompt:', header, '=', promptValue);
            }
        } else {
            console.log('DEBUG: Skipping header:', header, 'reason: no currentPrompts[header]');
        }
    });
    
    console.log('DEBUG: Collected studentPrompts:', studentPrompts);
    
    // Store student name without asterisk in report
    const studentNameForReport = studentName.startsWith('*') ? studentName.substring(1) : studentName;
    console.log('DEBUG: studentNameForReport:', studentNameForReport);
    
    // Slot-scoped write: regenerate updates current index; NEXT (index past end) always appends.
    // Never find-by-name — duplicate auto-names must not overwrite / put-back a different run.
    if (typeof currentStudentIndex === 'number' && currentStudentIndex >= 0 && currentStudentIndex < classReport.length) {
        classReport[currentStudentIndex].name = studentNameForReport;
        classReport[currentStudentIndex].prompts = studentPrompts;
        console.log('DEBUG: Updated report slot', currentStudentIndex, 'name:', studentNameForReport);
    } else {
        classReport.push({
            name: studentNameForReport,
            prompts: studentPrompts
        });
        currentStudentIndex = classReport.length - 1;
        if (typeof window !== 'undefined') window.currentStudentIndex = currentStudentIndex;
        console.log('DEBUG: Appended new report slot', currentStudentIndex, 'name:', studentNameForReport);
    }
    // Keep allStudents aligned with history length so Up/Enter cannot clamp into an old slot
    if (Array.isArray(allStudents)) {
        while (allStudents.length < classReport.length) allStudents.push('');
        if (currentStudentIndex < allStudents.length) {
            allStudents[currentStudentIndex] = studentNameForReport;
        } else {
            allStudents.push(studentNameForReport);
        }
        if (typeof totalUniqueStudents !== 'undefined') totalUniqueStudents = allStudents.length;
    }
    
    // Add to drawn students if not already there
    if (!drawnStudents.includes(studentNameForReport)) {
        drawnStudents.push(studentNameForReport);
        console.log('DEBUG: Added to drawnStudents:', studentNameForReport);
    }
    
    console.log('DEBUG: Final classReport length:', classReport.length);
    console.log('DEBUG: Final classReport:', JSON.stringify(classReport, null, 2));
    console.log('DEBUG: drawnStudents:', drawnStudents);
    console.log('=== DEBUG: collectPromptData END ===');
    console.log('Collected prompt data for:', studentName, studentPrompts);
    
    // Sync to window for batch screenshot and other functions
    window.classReport = classReport;

    // Keep in-play aligned with committed history after each completed run
    if (typeof rebuildUsedPromptsFromClassReport === 'function') {
        rebuildUsedPromptsFromClassReport(-1);
    }

    // Persist to working state only; history updated only on explicit Save/Save As in editor
    saveCurrentStateToLocalStorage();
}

// Download class report
function downloadClassReport() {
    console.log('DEBUG: downloadClassReport called');
    const currentActivity = getCurrentActivityName();
    console.log('DEBUG: Current activity:', currentActivity);
    console.log('DEBUG: classReport length:', classReport.length);
    console.log('DEBUG: classReport:', classReport);
    console.log('DEBUG: classList length:', classList.length);
    console.log('DEBUG: classList:', classList);
    console.log('DEBUG: manuallyAddedStudents length:', manuallyAddedStudents.length);
    console.log('DEBUG: manuallyAddedStudents:', manuallyAddedStudents);
    console.log('DEBUG: originalClassList length:', originalClassList.length);
    console.log('DEBUG: originalClassList:', originalClassList);
    
    if (classReport.length === 0) {
        alert('No class report data available. Generate some prompts first.');
        return;
    }
    
    // Get current date and time for report header
    const now = new Date();
    const dateString = now.toLocaleDateString();
    const timeString = now.toLocaleTimeString();
    
    let reportText = `CLASS REPORT - ${dateString} at ${timeString}\n`;
    reportText += `ACTIVITY: ${currentActivity}\n`;
    reportText += '================================\n\n';
    
    // Add objective if available
    if (categories.objective && categories.objective.trim() !== '') {
        reportText += `OBJECTIVE: ${categories.objective}\n`;
        reportText += '================================\n\n';
    }
    
    // Get all students from the classReport (these are the students who have generated prompts)
    const studentsWithData = classReport.map(s => s.name);
    const allStudentsList = [...new Set(allStudents)]; // Use the global allStudents array
    
    reportText += `Total Students: ${allStudentsList.length}\n`;
    reportText += `Students with Generated Prompts: ${classReport.length}\n`;
    reportText += '\n';
    
    // Add all students who have generated prompts
    if (classReport.length > 0) {
        reportText += '=== STUDENTS WITH GENERATED PROMPTS ===\n';
        classReport.forEach(student => {
            reportText += `${student.name}\n`;
            student.prompts.forEach(prompt => {
                reportText += `  ${prompt.label}: ${prompt.value}\n`;
            });
            reportText += '\n';
        });
    }
    
    // Add students with no data
    const studentsWithoutData = allStudentsList.filter(name => {
        const nameWithoutAsterisk = name.startsWith('*') ? name.substring(1) : name;
        return !studentsWithData.includes(name) && !studentsWithData.includes(nameWithoutAsterisk);
    });
    
    if (studentsWithoutData.length > 0) {
        reportText += '=== STUDENTS WITH NO GENERATED PROMPTS ===\n';
        studentsWithoutData.forEach(name => {
            reportText += `  - ${name}\n`;
        });
        reportText += '\n';
    }

    // Include full activity settings (CSV format) so loading the report can restore the session in the editor
    reportText += '=== ACTIVITY SETTINGS (CSV) ===\n';
    try {
        const pc = localStorage.getItem('promptCategories');
        const activityFromSettings = pc ? (JSON.parse(localStorage.getItem('promptSettings') || '{}')[currentActivity] || null) : null;
        const parsed = pc ? JSON.parse(pc) : {};
        const objective = parsed.objective || categories.objective || '';
        const prompt1InterestsMode = typeof parsed.prompt1InterestsMode === 'boolean' ? parsed.prompt1InterestsMode : (categories.prompt1InterestsMode || false);
        const criterionLabels = (parsed.criterionLabels && Array.isArray(parsed.criterionLabels)) ? parsed.criterionLabels : (window.criterionLabels || ['', '', '', '']);
        const theme = (activityFromSettings && activityFromSettings.theme) ? activityFromSettings.theme : (localStorage.getItem('selectedTheme') || 'windows');
        const background = (activityFromSettings && activityFromSettings.background) ? activityFromSettings.background : (localStorage.getItem('selectedBackground') || 'black');
        const headers = Object.keys(categories || {}).filter(c => c !== 'objective' && c !== 'prompt1InterestsMode');
        reportText += `PromptMe Activity Export\n`;
        reportText += `Exported: ${new Date().toLocaleString()}\n`;
        reportText += `Activity Name: ${currentActivity}\n`;
        reportText += `Objective: ${(objective || 'No objective set').replace(/\n/g, ' ')}\n`;
        reportText += `Theme: ${theme}\n`;
        reportText += `Background: ${background}\n`;
        reportText += `Prompt 1 Interests Mode: ${prompt1InterestsMode ? 'Yes' : 'No'}\n`;
        reportText += `Criterion Labels: ${(criterionLabels || []).join(', ')}\n\n`;
        if (headers.length > 0 && parsed.categories) {
            reportText += `Category,${headers.join(',')}\n`;
            const firstHeader = headers[0];
            const catLabels = Object.keys(parsed.categories[firstHeader] || {});
            catLabels.forEach(catLabel => {
                let maxRows = 1;
                headers.forEach(h => {
                    const arr = parsed.categories[h] && parsed.categories[h][catLabel];
                    if (Array.isArray(arr)) maxRows = Math.max(maxRows, arr.length);
                });
                for (let r = 0; r < maxRows; r++) {
                    const row = [catLabel];
                    headers.forEach(h => {
                        const arr = parsed.categories[h] && parsed.categories[h][catLabel];
                        const val = (Array.isArray(arr) && arr[r] !== undefined) ? String(arr[r]).replace(/,/g, ';') : '';
                        row.push(val);
                    });
                    reportText += row.join(',') + '\n';
                }
            });
        }
    } catch (err) {
        console.warn('Could not append activity settings to report:', err);
    }
    
    // Create and download text file
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Include activity name in filename
    const safeActivityName = currentActivity.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    a.download = `ClassReport_${safeActivityName}_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('Class report downloaded for activity:', currentActivity);
}

// Reset class report
function resetClassReport() {
    // Clear all data structures
    classReport = [];
    allStudents = [];
    drawnStudents = [];
    currentStudentIndex = 0;
    studentName = '';
    window.currentPrompts = {};
    currentPrompts = window.currentPrompts; // Keep local reference in sync
    isGenerationComplete = false;
    generationStep = 0;
    isGenerating = false;
    isAnimating = false;
    totalUniqueStudents = 0;
    manuallyAddedStudents = [];
    classList = [];
    originalClassList = [];
    // Reset auto-run counter so unnamed runs start again from Run 1
    if (typeof window.unnamedRunCounter === 'number') {
        window.unnamedRunCounter = 0;
    }
    // Clear in-play tracking
    usedPrompts = {};
    if (typeof window !== 'undefined') {
        window.usedPrompts = usedPrompts;
        if (typeof window.rebuildUsedPromptsFromClassReport === 'function') {
            window.rebuildUsedPromptsFromClassReport(-1);
        }
    }
    // Clear prompted students order (memory for left arrow navigation)
    if (window.promptedStudentsOrder) {
        window.promptedStudentsOrder = [];
    }
    
    // Clear input field
    if (window.setResultNameFieldValue) window.setResultNameFieldValue('');
    
    // Clear report for current activity from activityReports
    const currentActivity = getCurrentActivityName();
    try {
        const activityReports = JSON.parse(localStorage.getItem('activityReports') || '{}');
        if (activityReports[currentActivity]) {
            // Clear the report data but keep the activity entry
            activityReports[currentActivity] = {
                classReport: [],
                allStudents: [],
                drawnStudents: [],
                manuallyAddedStudents: [],
                classList: [],
                originalClassList: [],
                totalUniqueStudents: 0
            };
            localStorage.setItem('activityReports', JSON.stringify(activityReports));
            console.log('Cleared activity report for:', currentActivity);
        }
    } catch (e) {
        console.error('Error clearing activity report:', e);
    }
    
    // Sync window.classReport
    window.classReport = [];
    
    // IMPORTANT: Preserve prompt data (categories, objective, etc.) when clearing report
    // Only clear class report related data, not the prompt structure
    try {
        const existingData = localStorage.getItem('promptCategories');
        if (existingData) {
            try {
                const parsed = JSON.parse(existingData);
                // Keep prompt structure, clear only report data
                const preservedData = {
                    objective: parsed.objective || '',
                    constraintEnabled: parsed.constraintEnabled !== undefined ? parsed.constraintEnabled : true,
                    prompt1InterestsMode: parsed.prompt1InterestsMode || false,
                    criterionLabels: parsed.criterionLabels || ['', '', '', ''],
                    activityName: parsed.activityName || null,
                    categories: parsed.categories || {},
                    // Clear all report-related data
                    classReport: [],
                    allStudents: [],
                    drawnStudents: [],
                    manuallyAddedStudents: [],
                    totalUniqueStudents: 0,
                    classList: [],
                    originalClassList: [],
                    studentName: '',
                    unnamedRunCounter: 0
                };
                localStorage.setItem('promptCategories', JSON.stringify(preservedData));
                console.log('Preserved prompt data, cleared only report data');
            } catch (parseError) {
                console.error('Error parsing existing data:', parseError);
                // If parsing fails, just remove the item
                localStorage.removeItem('promptCategories');
            }
        } else {
            // No existing data, just clear
            localStorage.removeItem('promptCategories');
        }
    } catch (error) {
        console.error('Error clearing localStorage:', error);
    }
    
    // Update UI
    positionNameInputAndButtons();
    
    // Refresh interest checkboxes to ensure they're not duplicated
    // Use a small delay to ensure localStorage update is complete and prevent multiple calls
    // Clear any pending timeouts first
    if (window.clearInterestRefreshTimeout) {
        clearTimeout(window.clearInterestRefreshTimeout);
    }
    window.clearInterestRefreshTimeout = setTimeout(() => {
        if (window.populateInterestCheckboxes) {
            console.log('Refreshing interest checkboxes after clear');
            window.populateInterestCheckboxes();
        }
        window.clearInterestRefreshTimeout = null;
    }, 150);
    
    console.log('Class report reset - all data cleared for activity:', currentActivity);
    alert('Class report has been reset.');
}

// Handle class list upload
function handleClassListUpload(event) {
    console.log('DEBUG: handleClassListUpload called');
    const file = event.target.files[0];
    console.log('DEBUG: Selected file:', file);
    
    if (file) {
        console.log('DEBUG: File name:', file.name);
        console.log('DEBUG: File type:', file.type);
        console.log('DEBUG: File size:', file.size);
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const text = e.target.result;
                console.log('DEBUG: File content preview:', text.substring(0, 200));
                
                // Handle both CSV and TXT files
                let lines;
                if (file.name.toLowerCase().endsWith('.csv')) {
                    console.log('DEBUG: Processing as CSV file');
                    // For CSV files, split by comma first, then by lines
                    lines = text.split('\n')
                        .map(line => line.split(',').map(item => item.trim()))
                        .flat()
                        .filter(item => item.length > 0);
                } else {
                    console.log('DEBUG: Processing as TXT file');
                    // For TXT files, split by lines
                    lines = text.split('\n')
                        .map(line => line.trim())
                        .filter(line => line.length > 0);
                }
                
                console.log('DEBUG: Parsed lines:', lines);
                
                classList = lines;
                
                // Update original class list
                originalClassList = [...classList];
                
                // Add ALL uploaded names to allStudents array
                allStudents = [...classList];
                console.log('DEBUG: Added all uploaded names to allStudents:', allStudents);
                
                // Update total unique students count
                totalUniqueStudents = classList.length;
                
                console.log('Class list uploaded:', classList);
                console.log('Total students:', totalUniqueStudents);
                
                // Update UI to show navigation buttons
                positionNameInputAndButtons();
                
                // Show all navigation buttons now that we have a class list
                if (prevStudentButton) prevStudentButton.show();
                if (nextStudentButton) nextStudentButton.show();
                
                // Auto-populate first student name
                if (classList.length > 0) {
                    studentName = classList[0];
                    if (window.setResultNameFieldValue) window.setResultNameFieldValue(studentName);
                    isManualNameEntry = false;
                    console.log('Auto-populated first student:', studentName);
                }
                
                alert(`Class list uploaded successfully! ${classList.length} students loaded.`);
                
                // Save the updated state to localStorage
                saveCurrentStateToLocalStorage();
                
            } catch (error) {
                alert('Error parsing class list: ' + error.message);
            }
        };
        reader.readAsText(file);
    }
}

// Load an activity from editor history (promptSettings) and merge with report data into promptCategories.
// So when user loads a Session 1 report, we restore Session 1's prompts in editor and the report in prompting window.
function loadActivityAndReportIntoPromptCategories(activityName, reportData) {
    const promptSettings = JSON.parse(localStorage.getItem('promptSettings') || '{}');
    const settings = promptSettings[activityName];
    const data = {
        objective: '',
        constraintEnabled: true,
        prompt1InterestsMode: false,
        criterionLabels: ['', '', '', ''],
        activityName: activityName,
        categories: {},
        classReport: reportData.students || [],
        allStudents: reportData.studentNames || [],
        drawnStudents: reportData.studentNames || [],
        classList: reportData.studentNames || [],
        originalClassList: [...(reportData.studentNames || [])],
        totalUniqueStudents: (reportData.studentNames || []).length
    };
    if (settings) {
        data.objective = settings.objective || '';
        data.prompt1InterestsMode = settings.prompt1InterestsMode === true;
        data.criterionLabels = Array.isArray(settings.criterionLabels) ? settings.criterionLabels : ['', '', '', ''];
        const headers = (settings.promptHeaders && settings.promptHeaders.length) ? settings.promptHeaders : ['PROMPT 1'];
        data.categories = {};
        headers.forEach((header, colIndex) => {
            data.categories[header] = {};
            if (settings.categories && typeof settings.categories === 'object') {
                Object.keys(settings.categories).forEach(catLabel => {
                    const columnPrompts = settings.categories[catLabel] && settings.categories[catLabel][colIndex];
                    if (columnPrompts && columnPrompts.length) {
                        data.categories[header][catLabel] = columnPrompts;
                    }
                });
            }
        });
        console.log('DEBUG: Loaded session from editor history:', activityName);
    } else {
        data.categories = { 'PROMPT 1': {} };
        console.log('DEBUG: Activity not in history, using report data only; open editor to set prompts.');
    }
    localStorage.setItem('promptCategories', JSON.stringify(data));
    if (window.currentLoadedActivity !== undefined) {
        window.currentLoadedActivity = activityName;
    }
}

// Handle class report upload to resume a project
function handleClassReportUpload(event) {
    console.log('DEBUG: handleClassReportUpload called');
    const file = event.target.files[0];
    console.log('DEBUG: Selected report file:', file);
    
    if (file) {
        console.log('DEBUG: Report file name:', file.name);
        console.log('DEBUG: Report file type:', file.type);
        console.log('DEBUG: Report file size:', file.size);
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const text = e.target.result;
                console.log('DEBUG: Report content preview:', text.substring(0, 500));
                
                const parsedData = parseClassReport(text);
                
                if (parsedData.students.length === 0) {
                    alert('No valid student data found in the report file.');
                    return;
                }
                
                let activityName = parsedData.activityName || getCurrentActivityName();
                // If report includes full activity settings (CSV block), save to editor history so session loads by name
                if (parsedData.activitySettings && parsedData.activitySettings.name) {
                    const settings = parsedData.activitySettings;
                    activityName = settings.name;
                    try {
                        const savedSettings = JSON.parse(localStorage.getItem('promptSettings') || '{}');
                        savedSettings[activityName] = {
                            name: settings.name,
                            objective: settings.objective || '',
                            theme: settings.theme || 'greenCRT',
                            background: settings.background || 'black',
                            prompt1InterestsMode: !!settings.prompt1InterestsMode,
                            criterionLabels: Array.isArray(settings.criterionLabels) ? settings.criterionLabels : ['', '', '', ''],
                            promptHeaders: Array.isArray(settings.promptHeaders) ? settings.promptHeaders : ['PROMPT 1'],
                            categories: settings.categories || {},
                            timestamp: settings.timestamp || new Date().toISOString()
                        };
                        localStorage.setItem('promptSettings', JSON.stringify(savedSettings));
                        console.log('DEBUG: Saved activity to editor history:', activityName);
                    } catch (e) {
                        console.error('Error saving activity settings from report:', e);
                    }
                }
                // Load the session into promptCategories and merge report
                loadActivityAndReportIntoPromptCategories(activityName, {
                    students: parsedData.students,
                    studentNames: parsedData.studentNames
                });
                
                // Reload from promptCategories so sketch has correct categories and report
                loadPromptsFromLocalStorage();
                
                classReport = parsedData.students;
                window.classReport = classReport;
                allStudents = parsedData.studentNames;
                drawnStudents = parsedData.studentNames;
                classList = parsedData.studentNames;
                originalClassList = [...parsedData.studentNames];
                totalUniqueStudents = parsedData.studentNames.length;

                saveCurrentStateToLocalStorage();

                if (allStudents.length > 0) {
                    studentName = allStudents[0];
                    currentStudentIndex = 0;
                    if (window.setResultNameFieldValue) window.setResultNameFieldValue(studentName);
                    isManualNameEntry = false;
                    const hasResults = recallStudentResults(studentName);
                    console.log('DEBUG: Recall first student:', hasResults);
                }
                
                positionNameInputAndButtons();
                if (prevStudentButton) prevStudentButton.show();
                if (nextStudentButton) nextStudentButton.show();
                saveCurrentStateToLocalStorage();
                
                console.log('Class report uploaded and restored:', {
                    students: classReport.length,
                    totalStudents: totalUniqueStudents,
                    firstStudent: studentName,
                    activityName: activityName
                });
                
                const sessionMsg = activityName ? ` Session "${activityName}" is restored in the editor; names and results are in the prompting window.` : '';
                alert(`Report loaded.${sessionMsg}\n\n${classReport.length} students with their prompts restored. You can recall results, rerun prompts for anyone, or add new students (no duplicates).`);
                
            } catch (error) {
                console.error('Error parsing class report:', error);
                alert('Error parsing class report: ' + error.message);
            }
        };
        reader.readAsText(file);
    }
}

// Parse class report text: student data and optional ACTIVITY SETTINGS (CSV) block
function parseClassReport(reportText) {
    const rawLines = reportText.split(/\r?\n/);
    const students = [];
    const studentNames = [];
    let activityName = null;
    let currentStudent = null;
    let inStudentSection = false;
    let activitySettings = null;

    for (let i = 0; i < rawLines.length; i++) {
        const line = rawLines[i];
        const trimmed = line.trim();
        if (trimmed.length === 0) continue;

        if (line.startsWith('ACTIVITY: ')) {
            activityName = line.replace('ACTIVITY: ', '').trim();
            continue;
        }
        if (trimmed.includes('STUDENTS WITH GENERATED PROMPTS') && trimmed.includes('===')) {
            inStudentSection = true;
            continue;
        }
        if (inStudentSection && trimmed.includes('STUDENTS WITH NO GENERATED PROMPTS')) {
            inStudentSection = false;
            continue;
        }
        // End student section when we hit the activity settings (CSV) block (report may not have "no prompts" section)
        if (inStudentSection && (trimmed.includes('ACTIVITY SETTINGS (CSV)') || trimmed.startsWith('PromptMe Activity Export'))) {
            inStudentSection = false;
            continue;
        }

        if (inStudentSection) {
            const hasIndent = /^\s/.test(line);
            const promptMatch = line.match(/^\s*([^:]+):\s*(.*)$/);
            const looksLikePrompt = hasIndent && promptMatch && promptMatch[1].trim().length > 0;
            if (looksLikePrompt && currentStudent) {
                currentStudent.prompts.push({
                    label: promptMatch[1].trim(),
                    value: (promptMatch[2] || '').trim().replace(/;/g, ',')
                });
            } else if (!looksLikePrompt && !trimmed.startsWith('===')) {
                if (currentStudent) {
                    students.push(currentStudent);
                    studentNames.push(currentStudent.name);
                }
                currentStudent = { name: trimmed, prompts: [] };
            }
        }
    }
    if (currentStudent) {
        students.push(currentStudent);
        studentNames.push(currentStudent.name);
    }

    // Parse ACTIVITY SETTINGS (CSV) block if present (same format as CSV export)
    const csvStart = rawLines.findIndex(l => l.trim().startsWith('PromptMe Activity Export'));
    if (csvStart >= 0) {
        let activityNameCsv = '';
        let objective = '';
        let theme = 'windows';
        let background = 'black';
        let prompt1InterestsMode = false;
        let criterionLabels = ['', '', '', ''];
        let promptHeaders = [];
        const categories = {};
        for (let i = csvStart; i < rawLines.length; i++) {
            const line = rawLines[i].trim();
            if (!line) continue;
            if (line.startsWith('Activity Name: ')) {
                activityNameCsv = line.replace('Activity Name: ', '').trim();
            } else if (line.startsWith('Objective: ')) {
                objective = line.replace('Objective: ', '').trim();
            } else if (line.startsWith('Theme: ')) {
                theme = line.replace('Theme: ', '').trim();
            } else if (line.startsWith('Background: ')) {
                background = line.replace('Background: ', '').trim();
            } else if (line.startsWith('Prompt 1 Interests Mode: ')) {
                prompt1InterestsMode = line.replace('Prompt 1 Interests Mode: ', '').trim() === 'Yes';
            } else if (line.startsWith('Criterion Labels: ')) {
                const labelsText = line.replace('Criterion Labels: ', '');
                criterionLabels = labelsText.split(',').map(l => l.trim());
            } else if (line.startsWith('Category,')) {
                promptHeaders = line.split(',').slice(1).map(h => h.trim());
            } else if (promptHeaders.length > 0 && line.includes(',') && !line.startsWith('PromptMe') && !line.startsWith('Exported')) {
                const parts = line.split(',');
                const category = parts[0].trim();
                const items = parts.slice(1).map(item => item.trim().replace(/;/g, ','));
                if (category) {
                    if (!categories[category]) {
                        categories[category] = promptHeaders.map(() => []);
                    }
                    items.forEach((item, index) => {
                        if (index < promptHeaders.length && item) {
                            categories[category][index].push(item);
                        }
                    });
                }
            }
        }
        if (activityNameCsv || Object.keys(categories).length > 0) {
            activitySettings = {
                name: activityNameCsv || activityName,
                objective,
                theme,
                background,
                prompt1InterestsMode,
                criterionLabels: Array.isArray(criterionLabels) && criterionLabels.length ? criterionLabels : ['', '', '', ''],
                promptHeaders: promptHeaders.length ? promptHeaders : ['PROMPT 1'],
                categories,
                timestamp: new Date().toISOString()
            };
            if (activityNameCsv) activityName = activityNameCsv;
            console.log('DEBUG: Parsed activity settings from report:', activitySettings.name);
        }
    }

    console.log('DEBUG: Parsed students:', students.length, 'activitySettings:', !!activitySettings);
    return { students, studentNames, activityName, activitySettings };
}
