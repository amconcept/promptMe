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
                
                // Restore report data for persistence
                if (parsedData.classReport && Array.isArray(parsedData.classReport)) {
                    classReport = parsedData.classReport;
                    console.log('DEBUG: Restored class report with', classReport.length, 'entries');
                    console.log('DEBUG: Restored classReport:', JSON.stringify(classReport, null, 2));
                } else {
                    classReport = [];
                    console.log('DEBUG: No class report found, starting fresh');
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
    Object.keys(categories).forEach(header => {
        console.log('DEBUG: Checking header:', header);
        if (header !== 'objective' && header !== 'prompt1InterestsMode' && currentPrompts[header]) {
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
            console.log('DEBUG: Skipping header:', header, 'reason:', 
                header === 'objective' ? 'objective' : 
                header === 'prompt1InterestsMode' ? 'prompt1InterestsMode' : 
                'no currentPrompts[header]');
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
}

// Download class report
function downloadClassReport() {
    console.log('DEBUG: downloadClassReport called');
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
    a.download = `ClassReport_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('Class report downloaded with all students');
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
    
    // Clear localStorage data completely
    try {
        localStorage.removeItem('promptCategories');
        console.log('Completely cleared localStorage');
    } catch (error) {
        console.error('Error clearing localStorage:', error);
    }
    
    // Update UI
    positionNameInputAndButtons();
    
    console.log('Class report reset - all data cleared');
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
                    firstStudent: studentName
                });
                
                alert(`Project resumed successfully! ${classReport.length} students with their prompts restored.`);
                
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
    
    let currentStudent = null;
    let inStudentSection = false;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
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
    
    return {
        students: students,
        studentNames: studentNames
    };
}
