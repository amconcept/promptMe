// Student Manager - Handles student navigation and management
// Responsible for: Student list navigation, recalling results, student switching

let currentStudentIndex = 0; // Index of current student in class list
let isManualNameEntry = false; // Track if user manually typed a name

// Navigate to next student
function nextStudent() {
    if (allStudents.length > 0) {
        // Move to next student in the allStudents list
        currentStudentIndex = (currentStudentIndex + 1) % allStudents.length;
        studentName = allStudents[currentStudentIndex];
        
        // Update input field to show current student name
        if (nameInput) {
            nameInput.value(studentName);
        }
        isManualNameEntry = false; // Mark as programmatic change
        
        // Try to recall previous results for this student
        const hasResults = recallStudentResults(studentName);
        
        if (!hasResults) {
            // No previous results - clear prompts for new generation
            currentPrompts = {};
            isGenerationComplete = false;
            generationStep = 0;
            isGenerating = false;
            isAnimating = false;
        }
        
        // Clear any running intervals
        clearAnimations();
        
        saveCurrentStateToLocalStorage();
        console.log('Switched to student:', studentName, '(', currentStudentIndex + 1, 'of', allStudents.length, ')');
    }
}

// Navigate to previous student
function prevStudent() {
    if (allStudents.length > 0) {
        // Move to previous student in the allStudents list
        currentStudentIndex = currentStudentIndex === 0 ? allStudents.length - 1 : currentStudentIndex - 1;
        studentName = allStudents[currentStudentIndex];
        
        // Update input field to show current student name
        if (nameInput) {
            nameInput.value(studentName);
        }
        isManualNameEntry = false; // Mark as programmatic change
        
        // Try to recall previous results for this student
        const hasResults = recallStudentResults(studentName);
        
        if (!hasResults) {
            // No previous results - clear prompts for new generation
            currentPrompts = {};
            isGenerationComplete = false;
            generationStep = 0;
            isGenerating = false;
            isAnimating = false;
        }
        
        // Clear any running intervals
        clearAnimations();
        
        saveCurrentStateToLocalStorage();
        console.log('Switched to student:', studentName, '(', currentStudentIndex + 1, 'of', allStudents.length, ')');
    }
}

// Recall student results from class report
function recallStudentResults(studentName) {
    const studentNameForReport = studentName.startsWith('*') ? studentName.substring(1) : studentName;
    
    // Find the student in the class report
    const studentData = classReport.find(student => student.name === studentNameForReport);
    
    if (studentData && studentData.prompts.length > 0) {
        // Stop any ongoing animations
        isAnimating = false;
        
        // Restore the prompts to currentPrompts
        currentPrompts = {};
        studentData.prompts.forEach(prompt => {
            currentPrompts[prompt.label] = prompt.value;
        });
        
        // Mark as generation complete since we're showing existing results
        isGenerationComplete = true;
        generationStep = studentData.prompts.length;
        
        console.log('Recalled results for:', studentName, studentData.prompts);
        return true;
    }
    
    return false;
}
