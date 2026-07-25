// Student Manager - Handles student navigation and management
// Responsible for: Student list navigation, recalling results, student switching

let currentStudentIndex = 0; // Index of current student in class list
let isManualNameEntry = false; // Track if user manually typed a name

// Navigate to next student
function nextStudent() {
    // Prefer navigating over classReport history (actual runs with prompts).
    const hasHistory = Array.isArray(classReport) && classReport.length > 0;
    if (hasHistory) {
        if (window.clearPreviousNameForNavigation) window.clearPreviousNameForNavigation();
        if (window.commitPendingPrompts) window.commitPendingPrompts();

        const total = classReport.length;
        if (total === 0) return;

        currentStudentIndex = (currentStudentIndex + 1) % total;
        const entry = classReport[currentStudentIndex];
        studentName = entry ? entry.name : '';

        if (window.setResultNameFieldValue) window.setResultNameFieldValue(studentName);
        isManualNameEntry = false;

        const hasResults = recallStudentResults(studentName);
        if (!hasResults) {
            window.currentPrompts = {};
            currentPrompts = window.currentPrompts;
            isGenerationComplete = false;
            generationStep = 0;
            isGenerating = false;
            isAnimating = false;
        }

        clearAnimations();
        saveCurrentStateToLocalStorage();
        if (window.positionNameInputAndButtons) window.positionNameInputAndButtons();
        console.log('Switched to history entry:', currentStudentIndex + 1, 'of', total, 'name:', studentName);
    } else if (allStudents.length > 0) {
        // Fallback: navigate over allStudents when there is no history yet.
        if (window.clearPreviousNameForNavigation) window.clearPreviousNameForNavigation();
        if (window.commitPendingPrompts) window.commitPendingPrompts();

        currentStudentIndex = (currentStudentIndex + 1) % allStudents.length;
        studentName = allStudents[currentStudentIndex];

        if (window.setResultNameFieldValue) window.setResultNameFieldValue(studentName);
        isManualNameEntry = false;

        const hasResults = recallStudentResults(studentName);
        if (!hasResults) {
            window.currentPrompts = {};
            currentPrompts = window.currentPrompts;
            isGenerationComplete = false;
            generationStep = 0;
            isGenerating = false;
            isAnimating = false;
        }

        clearAnimations();
        saveCurrentStateToLocalStorage();
        if (window.positionNameInputAndButtons) window.positionNameInputAndButtons();
        console.log('Switched to student (fallback):', studentName, '(', currentStudentIndex + 1, 'of', allStudents.length, ')');
    }
}

// Called when teacher explicitly advances to the next run (NEXT button or down arrow):
// create a new, empty run slot at the end of history and prepare for new prompts.
function advanceToNextResultAndClearPrompts(newName) {
    if (typeof window.commitPendingPrompts === 'function') window.commitPendingPrompts();
    if (typeof window.stopResultNameArrowFlash === 'function') window.stopResultNameArrowFlash();

    const historyTotal = Array.isArray(classReport) ? classReport.length : 0;
    // New run always starts at the end of history (index === length means empty slot)
    currentStudentIndex = historyTotal;
    studentName = newName || '';

    // Align allStudents to history, then reserve the new empty slot at currentStudentIndex
    if (Array.isArray(allStudents)) {
        while (allStudents.length < historyTotal) allStudents.push('');
        if (allStudents.length === historyTotal) {
            allStudents.push(studentName);
        } else {
            allStudents[currentStudentIndex] = studentName;
        }
        if (typeof totalUniqueStudents !== 'undefined') totalUniqueStudents = allStudents.length;
    }
    
    window.currentPrompts = {};
    if (typeof currentPrompts !== 'undefined') currentPrompts = window.currentPrompts;
    if (typeof isGenerationComplete !== 'undefined') isGenerationComplete = false;
    if (typeof generationStep !== 'undefined') generationStep = 0;
    if (typeof isGenerating !== 'undefined') isGenerating = false;
    if (typeof isAnimating !== 'undefined') isAnimating = false;
    if (typeof clearAnimations === 'function') clearAnimations();
    if (typeof saveCurrentStateToLocalStorage === 'function') saveCurrentStateToLocalStorage();
    if (typeof window.setResultNameFieldValue === 'function') window.setResultNameFieldValue(studentName);
    if (typeof window.positionNameInputAndButtons === 'function') window.positionNameInputAndButtons();
}

// Navigate to previous student (cycle through full list like right arrow)
function prevStudent() {
    const hasHistory = Array.isArray(classReport) && classReport.length > 0;
    if (hasHistory) {
        if (window.clearPreviousNameForNavigation) window.clearPreviousNameForNavigation();
        if (window.commitPendingPrompts) window.commitPendingPrompts();

        const total = classReport.length;
        if (total === 0) return;

        currentStudentIndex = currentStudentIndex === 0 ? total - 1 : currentStudentIndex - 1;
        const entry = classReport[currentStudentIndex];
        studentName = entry ? entry.name : '';

        if (window.setResultNameFieldValue) window.setResultNameFieldValue(studentName);
        isManualNameEntry = false;

        const hasResults = recallStudentResults(studentName);
        if (!hasResults) {
            window.currentPrompts = {};
            currentPrompts = window.currentPrompts;
            isGenerationComplete = false;
            generationStep = 0;
            isGenerating = false;
            isAnimating = false;
        }

        clearAnimations();
        saveCurrentStateToLocalStorage();
        if (window.positionNameInputAndButtons) window.positionNameInputAndButtons();
        console.log('Switched to previous history entry:', currentStudentIndex + 1, 'of', total, 'name:', studentName);
    } else if (allStudents.length > 0) {
        // Fallback: navigate over allStudents when there is no history yet.
        if (window.clearPreviousNameForNavigation) window.clearPreviousNameForNavigation();
        if (window.commitPendingPrompts) window.commitPendingPrompts();

        currentStudentIndex = currentStudentIndex === 0 ? allStudents.length - 1 : currentStudentIndex - 1;
        studentName = allStudents[currentStudentIndex];

        if (window.setResultNameFieldValue) window.setResultNameFieldValue(studentName);
        isManualNameEntry = false;

        const hasResults = recallStudentResults(studentName);
        if (!hasResults) {
            window.currentPrompts = {};
            currentPrompts = window.currentPrompts;
            isGenerationComplete = false;
            generationStep = 0;
            isGenerating = false;
            isAnimating = false;
        }

        clearAnimations();
        saveCurrentStateToLocalStorage();
        if (window.positionNameInputAndButtons) window.positionNameInputAndButtons();
        console.log('Switched to previous student (fallback):', studentName, '(', currentStudentIndex + 1, 'of', allStudents.length, ')');
    }
}

// Recall student results from class report
function recallStudentResults(studentName) {
    const studentNameForReport = studentName.startsWith('*') ? studentName.substring(1) : studentName;
    
    // No report entry for this index: show blank (don't fall back to find by name or last slot would show second-to-last's result)
    if (currentStudentIndex >= classReport.length) return false;
    
    // Prefer the entry at currentStudentIndex when it matches (keeps nav in sync; avoids duplicate/wrong result when same name appears multiple times)
    let studentData = null;
    if (currentStudentIndex >= 0 && currentStudentIndex < classReport.length) {
        const atIndex = classReport[currentStudentIndex];
        if (atIndex.name === studentNameForReport && atIndex.prompts && atIndex.prompts.length > 0) {
            studentData = atIndex;
        }
    }
    if (!studentData) {
        studentData = classReport.find(student => student.name === studentNameForReport);
    }
    
    if (studentData && studentData.prompts.length > 0) {
        // Stop any ongoing animations
        isAnimating = false;
        
        // Restore the prompts to currentPrompts
        window.currentPrompts = {};
        currentPrompts = window.currentPrompts; // Keep local reference in sync
        studentData.prompts.forEach(prompt => {
            window.currentPrompts[prompt.label] = prompt.value;
        });
        currentPrompts = window.currentPrompts; // Keep local reference in sync
        
        // Mark as generation complete since we're showing existing results
        isGenerationComplete = true;
        generationStep = studentData.prompts.length;
        
        console.log('Recalled results for:', studentName, studentData.prompts);
        return true;
    }
    
    return false;
}

window.advanceToNextResultAndClearPrompts = advanceToNextResultAndClearPrompts;
