// Data Manager - Handles all data persistence and file operations
// Responsible for: localStorage, CSV uploads, reports, data validation

let classReport = []; // Array to store all student prompt data
let allStudents = []; // Array to track all students (both drawn and not drawn)
let drawnStudents = []; // Array to track students who have had prompts drawn
let manuallyAddedStudents = []; // Track manually added students for report
let originalClassList = []; // Track original uploaded class list separately
let totalUniqueStudents = 0; // Total number of unique students (original class list only)
let uniqueStudentsProcessed = new Set(); // Track which students have been processed

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
                
                // Load activity-specific report if activity name exists
                const activityName = parsedData.activityName;
                if (activityName) {
                    console.log('DEBUG: Loading report for activity:', activityName);
                    const reportLoaded = loadActivityReport(activityName);
                    if (!reportLoaded) {
                        // No activity-specific report found, try legacy report data
                        if (parsedData.classReport && Array.isArray(parsedData.classReport)) {
                            classReport = parsedData.classReport;
                            console.log('DEBUG: Restored legacy class report with', classReport.length, 'entries');
                            // Save to activity-specific storage
                            saveActivityReport(activityName);
                        } else {
                            classReport = [];
                            console.log('DEBUG: No class report found, starting fresh');
                        }
                    }
                } else {
                    // No activity name - use legacy report data if available
                    if (parsedData.classReport && Array.isArray(parsedData.classReport)) {
                        classReport = parsedData.classReport;
                        console.log('DEBUG: Restored legacy class report with', classReport.length, 'entries');
                    } else {
                        classReport = [];
                        console.log('DEBUG: No class report found, starting fresh');
                    }
                }
                
                if (parsedData.allStudents && Array.isArray(parsedData.allStudents)) {
                    // Filter out any single-character entries and invalid data
                    allStudents = parsedData.allStudents.filter(name => 
                        typeof name === 'string' && 
                        name.length > 1 && 
                        name.trim().length > 0 &&
                        !/^[a-zA-Z]$/.test(name) // Exclude single letters
                    );
                    console.log('Restored all students (filtered):', allStudents);
                    console.log('DEBUG: allStudents length:', allStudents.length);
                    console.log('DEBUG: allStudents contents:', JSON.stringify(allStudents));
                } else {
                    allStudents = [];
                }
                
                if (parsedData.drawnStudents && Array.isArray(parsedData.drawnStudents)) {
                    // Filter out any single-character entries (corrupted data)
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
                
                if (typeof parsedData.totalUniqueStudents === 'number') {
                    totalUniqueStudents = parsedData.totalUniqueStudents;
                    console.log('Restored total unique students count:', totalUniqueStudents);
                } else {
                    totalUniqueStudents = 0;
                }
                
                // Auto-populate first student name if students exist
                if (allStudents.length > 0) {
                    studentName = allStudents[0];
                    currentStudentIndex = 0;
                    if (nameInput) {
                        nameInput.value(studentName);
                    }
                    isManualNameEntry = false; // Mark as programmatic change
                    debugLog('Auto-populated first student name:', studentName);
                } else {
                    // No students - start with empty name field
                    studentName = '';
                    currentStudentIndex = 0;
                    if (typeof nameInput !== 'undefined' && nameInput) {
                        nameInput.value('');
                    }
                    isManualNameEntry = false; // Mark as programmatic change
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
        console.log('No saved data found in localStorage. Creating default structure.');
        // Create a default structure if no data exists
        categories = {
            objective: 'Design an object for a character with the following traits:',
            'PROMPT 1': {
                'A': ['Young', 'Middle-aged', 'Elderly'],
                'B': ['Creative', 'Analytical', 'Physical']
            },
            'PROMPT 2': {
                'A': ['Student', 'Professional', 'Retired'],
                'B': ['Impatient', 'Perfectionist', 'Shy']
            }
        };
        console.log('Created default categories:', categories);
    }
    
    // Initialize usedPrompts with data from editor.js
    usedPrompts = {};
    Object.keys(categories).forEach(category => {
        if (category !== 'objective') {
            usedPrompts[category] = new Set();
        }
    });
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
                if (nameInput) {
                    nameInput.value(studentName);
                }
                console.log('Loaded student name from localStorage:', studentName);
            }
        } catch (error) {
            console.error('Error loading student name:', error);
        }
    }
}

// Save current state to localStorage (including student name and report data)
function saveCurrentStateToLocalStorage() {
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
            
            // CRITICAL: Preserve existing class report data if current is empty
            if (classReport.length === 0 && data.classReport && data.classReport.length > 0) {
                console.log('DEBUG: WARNING - classReport is empty but existing data has report, preserving existing data');
                classReport = data.classReport;
            }
            if (allStudents.length === 0 && data.allStudents && data.allStudents.length > 0) {
                console.log('DEBUG: WARNING - allStudents is empty but existing data has students, preserving existing data');
                allStudents = data.allStudents;
            }
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
    // Save class report data for persistence - only update if we have data to save
    if (classReport.length > 0) {
        data.classReport = classReport;
    }
    if (allStudents.length > 0) {
        data.allStudents = allStudents;
    }
    data.drawnStudents = drawnStudents;
    data.manuallyAddedStudents = manuallyAddedStudents;
    data.totalUniqueStudents = totalUniqueStudents;
    data.classList = classList;
    data.originalClassList = originalClassList;
    
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

// Load report data for a specific activity
function loadActivityReport(activityName) {
    console.log('Loading report for activity:', activityName);
    try {
        const activityReports = JSON.parse(localStorage.getItem('activityReports') || '{}');
        const activityData = activityReports[activityName];
        
        if (activityData) {
            classReport = activityData.classReport || [];
            allStudents = activityData.allStudents || [];
            drawnStudents = activityData.drawnStudents || [];
            manuallyAddedStudents = activityData.manuallyAddedStudents || [];
            classList = activityData.classList || [];
            originalClassList = activityData.originalClassList || [];
            totalUniqueStudents = activityData.totalUniqueStudents || 0;
            console.log('Loaded report for activity:', activityName, 'with', classReport.length, 'students');
            return true;
        } else {
            // No existing report for this activity - start fresh
            console.log('No existing report for activity:', activityName, '- starting fresh');
            classReport = [];
            allStudents = [];
            drawnStudents = [];
            manuallyAddedStudents = [];
            classList = [];
            originalClassList = [];
            totalUniqueStudents = 0;
            return false;
        }
    } catch (e) {
        console.error('Error loading activity report:', e);
        return false;
    }
}

// Save report data for current activity
function saveActivityReport(activityName) {
    console.log('Saving report for activity:', activityName);
    try {
        const activityReports = JSON.parse(localStorage.getItem('activityReports') || '{}');
        activityReports[activityName] = {
            classReport: [...classReport],
            allStudents: [...allStudents],
            drawnStudents: [...drawnStudents],
            manuallyAddedStudents: [...manuallyAddedStudents],
            classList: [...classList],
            originalClassList: [...originalClassList],
            totalUniqueStudents: totalUniqueStudents
        };
        localStorage.setItem('activityReports', JSON.stringify(activityReports));
        console.log('Saved report for activity:', activityName);
    } catch (e) {
        console.error('Error saving activity report:', e);
    }
}

// Switch to a different activity and load its report
// This should be called when switching activities in the editor
function switchActivity(activityName) {
    console.log('Switching to activity:', activityName);
    // Save current activity's report before switching
    const currentActivity = getCurrentActivityName();
    if (currentActivity && currentActivity !== activityName) {
        saveActivityReport(currentActivity);
    }
    // Load the new activity's report
    loadActivityReport(activityName);
    // Update current activity name
    const currentData = localStorage.getItem('promptCategories');
    if (currentData) {
        try {
            const data = JSON.parse(currentData);
            data.activityName = activityName;
            localStorage.setItem('promptCategories', JSON.stringify(data));
        } catch (e) {
            console.error('Error updating activity name:', e);
        }
    }
    // Also update window reference
    if (window.currentLoadedActivity !== undefined) {
        window.currentLoadedActivity = activityName;
    }
}

// Export functions for use in other modules
window.getCurrentActivityName = getCurrentActivityName;
window.loadActivityReport = loadActivityReport;
window.saveActivityReport = saveActivityReport;
window.switchActivity = switchActivity;

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
    
    // Check if this student already exists in the report
    const existingStudentIndex = classReport.findIndex(student => student.name === studentNameForReport);
    console.log('DEBUG: existingStudentIndex:', existingStudentIndex);
    
    if (existingStudentIndex >= 0) {
        // Update existing student's prompts
        classReport[existingStudentIndex].prompts = studentPrompts;
        console.log('DEBUG: Updated existing student in report:', studentNameForReport);
    } else {
        // Add new student to report
        classReport.push({
            name: studentNameForReport,
            prompts: studentPrompts
        });
        console.log('DEBUG: Added new student to report:', studentNameForReport);
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
    
    // Save report for current activity
    const currentActivity = getCurrentActivityName();
    saveActivityReport(currentActivity);
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
    currentPrompts = {};
    isGenerationComplete = false;
    generationStep = 0;
    isGenerating = false;
    isAnimating = false;
    totalUniqueStudents = 0;
    manuallyAddedStudents = [];
    classList = [];
    originalClassList = [];
    
    // Clear input field
    if (nameInput) {
        nameInput.value('');
    }
    
    // Clear report for current activity
    const currentActivity = getCurrentActivityName();
    saveActivityReport(currentActivity);
    
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
                    studentName: ''
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
                    if (nameInput) {
                        nameInput.value(studentName);
                    }
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
                
                // Parse the class report to extract student data
                const parsedData = parseClassReport(text);
                
                if (parsedData.students.length === 0) {
                    alert('No valid student data found in the report file.');
                    return;
                }
                
                // If report contains an activity name, restore that activity
                if (parsedData.activityName) {
                    console.log('DEBUG: Report contains activity name:', parsedData.activityName);
                    // Set the activity name in localStorage so it can be loaded
                    const currentData = localStorage.getItem('promptCategories');
                    if (currentData) {
                        try {
                            const data = JSON.parse(currentData);
                            data.activityName = parsedData.activityName;
                            localStorage.setItem('promptCategories', JSON.stringify(data));
                            // Also set in window for editor
                            if (window.currentLoadedActivity !== undefined) {
                                window.currentLoadedActivity = parsedData.activityName;
                            }
                            console.log('DEBUG: Set activity name to:', parsedData.activityName);
                        } catch (e) {
                            console.error('Error updating activity name:', e);
                        }
                    }
                }
                
                // Clear existing data
                classReport = [];
                allStudents = [];
                drawnStudents = [];
                manuallyAddedStudents = [];
                classList = [];
                originalClassList = [];
                
                // Repopulate with parsed data
                classReport = parsedData.students;
                allStudents = parsedData.studentNames;
                drawnStudents = parsedData.studentNames; // All students in report have been drawn
                classList = parsedData.studentNames;
                originalClassList = [...parsedData.studentNames];
                totalUniqueStudents = parsedData.studentNames.length;
                
                // Save report for the activity (use parsed activity name or current activity)
                const activityName = parsedData.activityName || getCurrentActivityName();
                saveActivityReport(activityName);
                console.log('DEBUG: Saved report for activity:', activityName);
                
                // Update current student to first in list
                if (allStudents.length > 0) {
                    studentName = allStudents[0];
                    currentStudentIndex = 0;
                    if (nameInput) {
                        nameInput.value(studentName);
                    }
                    isManualNameEntry = false;
                    
                // Restore the first student's prompts
                console.log('DEBUG: About to recall results for first student:', studentName);
                const hasResults = recallStudentResults(studentName);
                console.log('DEBUG: Recall results returned:', hasResults);
                console.log('DEBUG: Current prompts after recall:', currentPrompts);
                }
                
                // Update UI
                positionNameInputAndButtons();
                
                // Show navigation buttons
                if (prevStudentButton) prevStudentButton.show();
                if (nextStudentButton) nextStudentButton.show();
                
                // Save the restored state
                saveCurrentStateToLocalStorage();
                
                console.log('Class report uploaded and restored:', {
                    students: classReport.length,
                    totalStudents: totalUniqueStudents,
                    firstStudent: studentName,
                    activityName: activityName
                });
                
                const activityMsg = activityName ? ` for activity "${activityName}"` : '';
                alert(`Project resumed successfully! ${classReport.length} students with their prompts restored${activityMsg}.`);
                
            } catch (error) {
                console.error('Error parsing class report:', error);
                alert('Error parsing class report: ' + error.message);
            }
        };
        reader.readAsText(file);
    }
}

// Parse class report text to extract student data
function parseClassReport(reportText) {
    console.log('DEBUG: Parsing class report text');
    
    const lines = reportText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const students = [];
    const studentNames = [];
    let activityName = null;
    
    let currentStudent = null;
    let inStudentSection = false;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Extract activity name from report header
        if (line.startsWith('ACTIVITY: ')) {
            activityName = line.replace('ACTIVITY: ', '').trim();
            console.log('DEBUG: Found activity name in report:', activityName);
        }
        
        // Check if we're in the students section
        if (line.includes('STUDENTS WITH GENERATED PROMPTS') || line.includes('=== STUDENTS WITH GENERATED PROMPTS ===')) {
            inStudentSection = true;
            continue;
        }
        
        // Check if we've moved to a different section
        if (inStudentSection && (line.includes('STUDENTS WITH NO GENERATED PROMPTS') || line.includes('=== STUDENTS WITH NO GENERATED PROMPTS ==='))) {
            break;
        }
        
        if (inStudentSection) {
            // Check if this line is a student name (not indented, not a prompt)
            if (!line.startsWith('  ') && !line.includes(':') && line.length > 0) {
                // This is a student name
                if (currentStudent) {
                    // Save the previous student
                    students.push(currentStudent);
                    studentNames.push(currentStudent.name);
                }
                
                // Start new student
                currentStudent = {
                    name: line,
                    prompts: []
                };
            } else if (currentStudent && line.startsWith('  ') && line.includes(':')) {
                // This is a prompt line (indented with colon)
                const promptMatch = line.match(/^\s+([^:]+):\s*(.+)$/);
                if (promptMatch) {
                    const [, label, value] = promptMatch;
                    currentStudent.prompts.push({
                        label: label.trim(),
                        value: value.trim()
                    });
                }
            }
        }
    }
    
    // Don't forget the last student
    if (currentStudent) {
        students.push(currentStudent);
        studentNames.push(currentStudent.name);
    }
    
    console.log('DEBUG: Parsed students:', students);
    console.log('DEBUG: Student names:', studentNames);
    console.log('DEBUG: Activity name:', activityName);
    
    return {
        students: students,
        studentNames: studentNames,
        activityName: activityName
    };
}
