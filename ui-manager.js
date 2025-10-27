// UI Manager - Handles all UI elements and interactions
// Responsible for: Control panel, buttons, inputs, positioning

// UI State Variables
let controlPanel;
let controlPanelVisible = true;
let controlPanelToggle;
let recordButton;
let downloadReportButton;
let resetReportButton;
let prevStudentButton;
let nextStudentButton;
let nameInput;

// Control panel positioning constants - now responsive
const CONTROL_PANEL_OFFSET = () => Math.max(min(width * 0.15, 140), 100);  // 15% of width, max 140px, min 100px
const TOGGLE_BUTTON_OFFSET = () => Math.max(min(width * 0.05, 50), 30);    // 5% of width, max 50px, min 30px

// Update spacing to use relative values
const SPACING = {
    TOP_MARGIN: 0.05,        // 5% of height
    OBJECTIVE_MARGIN: 0.12,  // 12% of height
    PROMPT_START: 0.45,      // 25% of height
    PROMPT_SPACING: 0.06,    // 12% of height between prompts
    CATEGORY_OFFSET: 0.45,   // 45% of width
    PROMPT_OFFSET: 0.48,     // 48% of width
    BOTTOM_MARGIN: 0.05      // 5% of height
};

// Update font sizes to be dynamic with minimum constraints
const FONT_SIZES = {
    NAME: () => Math.max(min(width, height) * 0.08, 16),      // Min 16px
    OBJECTIVE: () => Math.max(min(width, height) * 0.04, 12),  // Min 12px
    PROMPTS: () => Math.max(min(width, height) * 0.06, 12),   // Min 12px - Same as CATEGORY
    CATEGORY: () => Math.max(min(width, height) * 0.06, 12),  // Min 12px
    INSTRUCTIONS: () => Math.max(min(width, height) * 0.03, 10), // Min 10px
    INPUT: () => Math.max(min(width, height) * 0.03, 12),     // Min 12px
    BUTTON: () => Math.max(min(width, height) * 0.04, 10)    // Min 10px
};

// Update button sizes to be dynamic with minimum constraints
const BUTTON_SIZES = {
    WIDTH: () => Math.max(min(width * 0.25, 300), 200),    // 25% of width, max 300px, min 200px
    HEIGHT: () => Math.max(min(height * 0.06, 50), 30),    // 6% of height, max 50px, min 30px
    MARGIN: () => Math.max(min(width * 0.03, 40), 20),     // 3% of width, max 40px, min 20px
    BOTTOM_MARGIN: () => Math.max(min(height * 0.05, 40), 20), // 5% of height, max 40px, min 20px
    ELEMENT_SPACING: () => Math.max(min(height * 0.02, 20), 10) // Minimum spacing between elements
};

// Centralized control panel positioning function
function positionControlPanel() {
    if (controlPanel) {
        controlPanel.position(
            width - CONTROL_PANEL_OFFSET() - BUTTON_SIZES.MARGIN() - 80, // Nudged 20px left
            BUTTON_SIZES.MARGIN()
        );
    }
    if (controlPanelToggle) {
        controlPanelToggle.position(width - TOGGLE_BUTTON_OFFSET() - 20, BUTTON_SIZES.MARGIN()); // Nudged 20px left
    }
}

// Toggle control panel visibility
function toggleControlPanel() {
    controlPanelVisible = !controlPanelVisible;
    
    if (controlPanelVisible) {
        controlPanel.style('display', 'block');
        controlPanel.style('opacity', '1');
        controlPanel.style('transform', 'translateX(0)');
        controlPanelToggle.html('☰');
    } else {
        controlPanel.style('opacity', '0');
        controlPanel.style('transform', 'translateX(20px)');
        setTimeout(() => {
            if (!controlPanelVisible) {
                controlPanel.style('display', 'none');
            }
        }, 300);
        controlPanelToggle.html('☰');
    }
}

// Position name input and navigation buttons
function positionNameInputAndButtons() {
    const bottomMargin = BUTTON_SIZES.BOTTOM_MARGIN();
    const elementHeight = BUTTON_SIZES.HEIGHT();
    const elementSpacing = BUTTON_SIZES.ELEMENT_SPACING();
    
    // Always show arrows next to name field
    // Calculate centered positioning for equal gaps
    const nameFieldWidth = BUTTON_SIZES.WIDTH();
    const arrowWidth = 30;
    const totalWidth = nameFieldWidth + (arrowWidth * 2) + 20; // 20px total gap (10px each side)
    const startX = (width - totalWidth) / 2;
    
    // Position name input between arrows
    nameInput.position(
        startX + arrowWidth + 10, 
        height - bottomMargin - (elementHeight * 2) - elementSpacing
    );
    
    // Position buttons
    if (prevStudentButton) {
        prevStudentButton.position(
            startX, 
            height - bottomMargin - (elementHeight * 2) - elementSpacing
        );
    }
    if (nextStudentButton) {
        nextStudentButton.position(
            startX + arrowWidth + 10 + nameFieldWidth + 10, 
        height - bottomMargin - (elementHeight * 2) - elementSpacing
    );
    }
    
    // Update name input styling based on class list state
    updateNameInputForNoClassList();
}

function updateNameInputForNoClassList() {
    if (!nameInput) return;
    
    // Add + icon to placeholder when no class list
    if (classList.length === 0) {
        nameInput.attribute('placeholder', '+ Add student name');
    } else {
        nameInput.attribute('placeholder', 'Enter student name here');
    }
}

// Create control panel and UI elements
function createUI() {
    // Create retro toggle button for control panel
    controlPanelToggle = createButton('☰');
    controlPanelToggle.mousePressed(toggleControlPanel);
    controlPanelToggle.style('background-color', 'var(--background-color)');
    controlPanelToggle.style('border', '2px solid var(--primary-color)');
    controlPanelToggle.style('border-radius', '0px');
    controlPanelToggle.style('color', 'var(--primary-color)');
    controlPanelToggle.style('font-family', 'VT323, monospace');
    controlPanelToggle.style('font-size', '14px');
    controlPanelToggle.style('font-weight', 'bold');
    controlPanelToggle.style('width', '28px');
    controlPanelToggle.style('height', '28px');
    controlPanelToggle.style('cursor', 'pointer');
    controlPanelToggle.style('box-shadow', 'inset 1px 1px 0px var(--primary-color), inset -1px -1px 0px var(--primary-color)');
    controlPanelToggle.style('transition', 'all 0.1s ease');
    
    // Add hover effects
    controlPanelToggle.mouseOver(() => {
        controlPanelToggle.style('background-color', 'var(--primary-color)');
        controlPanelToggle.style('color', 'var(--background-color)');
        controlPanelToggle.style('box-shadow', 'inset 1px 1px 0px var(--background-color), inset -1px -1px 0px var(--background-color)');
    });
    
    controlPanelToggle.mouseOut(() => {
        controlPanelToggle.style('background-color', 'var(--background-color)');
        controlPanelToggle.style('color', 'var(--primary-color)');
        controlPanelToggle.style('box-shadow', 'inset 1px 1px 0px var(--primary-color), inset -1px -1px 0px var(--primary-color)');
    });
    
    // Create Apple II-style control panel
    controlPanel = createDiv('');
    controlPanel.style('background-color', 'var(--background-color)');
    controlPanel.style('border', '2px solid var(--primary-color)');
    controlPanel.style('border-radius', '0px');
    controlPanel.style('padding', '6px');
    controlPanel.style('font-family', 'VT323, monospace');
    controlPanel.style('color', 'var(--text-color)');
    controlPanel.style('font-size', '12px');
    controlPanel.style('width', '160px');  // Wider to fit larger text
    controlPanel.style('box-shadow', 'inset 1px 1px 0px var(--primary-color), inset -1px -1px 0px var(--primary-color), 2px 2px 0px var(--primary-shadow)');
    controlPanel.style('transition', 'all 0.3s ease-in-out');
    
    // Position control panel and toggle button
    positionControlPanel();
    
    // Add title
    const panelTitle = createDiv('CONTROL PANEL');
    panelTitle.parent(controlPanel);
    panelTitle.style('text-align', 'center');
    panelTitle.style('font-weight', 'bold');
    panelTitle.style('margin-bottom', '4px');
    panelTitle.style('color', 'var(--primary-color)');
    panelTitle.style('font-size', '18px');  // Match editor control panel
    panelTitle.style('letter-spacing', '1px');
    
    // Add interest selection section
    const interestContainer = createDiv('');
    interestContainer.parent(controlPanel);
    interestContainer.style('margin-bottom', '4px');
    interestContainer.style('border-top', '1px solid var(--primary-color)');
    interestContainer.style('padding-top', '8px');
    // Add data attribute for p5.js selection
    if (interestContainer.elt) {
        interestContainer.elt.setAttribute('data-p5-container', 'interest');
    }
    
    const interestTitle = createDiv('STUDENT INTERESTS');
    interestTitle.parent(interestContainer);
    interestTitle.style('color', 'var(--primary-color)');
    interestTitle.style('font-size', '18px');  // Match editor control panel
    interestTitle.style('font-weight', 'bold');
    interestTitle.style('margin-bottom', '4px');
    interestTitle.style('text-align', 'center');
    
    // Container for interest checkboxes
    const interestCheckboxes = createDiv('');
    interestCheckboxes.parent(interestContainer);
    interestCheckboxes.id('interest-checkboxes');
    
    // Initially hide the interest section - will be shown if prompt1InterestsMode is enabled
    interestContainer.hide();
    console.log('DEBUG: Interest container initially hidden');
    
    // "All Categories" option
    const allCategoriesDiv = createDiv('');
    allCategoriesDiv.parent(interestCheckboxes);
    allCategoriesDiv.style('display', 'flex');
    allCategoriesDiv.style('align-items', 'center');
    allCategoriesDiv.style('margin-bottom', '4px');
    
    // Create custom retro checkbox
    const allCategoriesCheckbox = createDiv('');
    allCategoriesCheckbox.parent(allCategoriesDiv);
    allCategoriesCheckbox.id('all-categories-checkbox');
    allCategoriesCheckbox.class('all-categories-checkbox');
    allCategoriesCheckbox.style('width', '12px');
    allCategoriesCheckbox.style('height', '12px');
    allCategoriesCheckbox.style('border', '1px solid var(--primary-color)');
    allCategoriesCheckbox.style('background-color', 'var(--primary-color)');
    allCategoriesCheckbox.style('margin-right', '6px');
    allCategoriesCheckbox.style('cursor', 'pointer');
    allCategoriesCheckbox.style('position', 'relative');
    allCategoriesCheckbox.attribute('data-checked', 'true');
    allCategoriesCheckbox.style('background-color', 'var(--primary-color)');
    
    const allCategoriesLabel = createDiv('All Categories');
    allCategoriesLabel.parent(allCategoriesDiv);
    allCategoriesLabel.style('color', 'var(--primary-color)');
    allCategoriesLabel.style('font-size', '16px');  // Match editor control panel
    allCategoriesLabel.style('cursor', 'pointer');
    allCategoriesLabel.mousePressed(() => {
        const isChecked = allCategoriesCheckbox.attribute('data-checked') === 'true';
        allCategoriesCheckbox.attribute('data-checked', !isChecked);
        if (!isChecked) {
            allCategoriesCheckbox.style('background-color', 'var(--primary-color)');
            // Uncheck all individual categories when "All Categories" is selected
            const categoryCheckboxes = document.querySelectorAll('.category-checkbox');
            categoryCheckboxes.forEach(checkbox => {
                checkbox.setAttribute('data-checked', 'false');
                checkbox.style.backgroundColor = 'var(--background-color)';
            });
        } else {
            allCategoriesCheckbox.style('background-color', 'var(--background-color)');
        }
        updateInterestSelection();
    });
    
    // Handle checkbox click
    allCategoriesCheckbox.mousePressed(() => {
        const isChecked = allCategoriesCheckbox.attribute('data-checked') === 'true';
        allCategoriesCheckbox.attribute('data-checked', !isChecked);
        if (!isChecked) {
            allCategoriesCheckbox.style('background-color', 'var(--primary-color)');
            // Uncheck all individual categories when "All Categories" is selected
            const categoryCheckboxes = document.querySelectorAll('.category-checkbox');
            categoryCheckboxes.forEach(checkbox => {
                checkbox.setAttribute('data-checked', 'false');
                checkbox.style.backgroundColor = 'var(--background-color)';
            });
        } else {
            allCategoriesCheckbox.style('background-color', 'var(--background-color)');
        }
        updateInterestSelection();
    });
    
    // Create class list upload button (FIRST)
    const classListUploadButton = createButton('LOAD CLASS LIST');
    classListUploadButton.parent(controlPanel);
    classListUploadButton.mousePressed(() => {
        // Create file input for class list
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.txt,.csv';
        fileInput.style.display = 'none';
        fileInput.onchange = (event) => {
            handleClassListUpload(event);
            // Clean up after processing
            setTimeout(() => {
                if (document.body.contains(fileInput)) {
                    document.body.removeChild(fileInput);
                }
            }, 100);
        };
        document.body.appendChild(fileInput);
        fileInput.click();
    });
    classListUploadButton.style('background-color', 'var(--background-color)');
    classListUploadButton.style('color', 'var(--primary-color)');
    classListUploadButton.style('font-family', 'VT323, monospace');
    classListUploadButton.style('font-size', '18px');
    classListUploadButton.style('width', '100%');
    classListUploadButton.style('height', '28px');
    classListUploadButton.style('border', '1px solid var(--primary-color)');
    classListUploadButton.style('border-radius', '4px');
    classListUploadButton.style('cursor', 'pointer');
    classListUploadButton.style('margin-bottom', '4px');
    classListUploadButton.style('text-align', 'center');
    classListUploadButton.style('letter-spacing', '0.5px');
    classListUploadButton.mouseOver(() => {
        classListUploadButton.style('background-color', 'var(--primary-color)');
        classListUploadButton.style('color', 'var(--background-color)');
    });
    classListUploadButton.mouseOut(() => {
        classListUploadButton.style('background-color', 'var(--background-color)');
        classListUploadButton.style('color', 'var(--primary-color)');
    });
    
    // Create screenshot button
    recordButton = createButton('SCREENSHOT');
    recordButton.parent(controlPanel);
    recordButton.mousePressed(takeScreenshot);
    recordButton.style('background-color', 'var(--background-color)');
    recordButton.style('color', 'var(--primary-color)');
    recordButton.style('font-family', 'VT323, monospace');
    recordButton.style('font-size', '18px');  // Match editor control panel
    recordButton.style('width', '100%');
    recordButton.style('height', '28px');  // Slightly taller for readability
    recordButton.style('border', '1px solid var(--primary-color)');
    recordButton.style('border-radius', '4px');
    recordButton.style('cursor', 'pointer');
    recordButton.style('margin-bottom', '4px');
    recordButton.style('text-align', 'center');
    recordButton.style('letter-spacing', '0.5px');
    
    // Add hover effect for screenshot button
    recordButton.mouseOver(() => {
        recordButton.style('background-color', 'var(--primary-color)');
        recordButton.style('color', 'var(--background-color)');
    });
    recordButton.mouseOut(() => {
        recordButton.style('background-color', 'var(--background-color)');
        recordButton.style('color', 'var(--primary-color)');
    });
    
    // Create class report button
    downloadReportButton = createButton('DOWNLOAD REPORT');
    downloadReportButton.parent(controlPanel);
    downloadReportButton.mousePressed(downloadClassReport);
    downloadReportButton.style('background-color', 'var(--background-color)');
    downloadReportButton.style('color', 'var(--primary-color)');
    downloadReportButton.style('font-family', 'VT323, monospace');
    downloadReportButton.style('font-size', '18px');  // Match editor control panel
    downloadReportButton.style('width', '100%');
    downloadReportButton.style('height', '28px');  // Slightly taller for readability
    downloadReportButton.style('border', '1px solid var(--primary-color)');
    downloadReportButton.style('border-radius', '4px');
    downloadReportButton.style('cursor', 'pointer');
    downloadReportButton.style('margin-bottom', '4px');
    downloadReportButton.style('text-align', 'center');
    downloadReportButton.style('letter-spacing', '0.5px');
    
    // Add hover effect for class report button
    downloadReportButton.mouseOver(() => {
        downloadReportButton.style('background-color', 'var(--primary-color)');
        downloadReportButton.style('color', 'var(--background-color)');
    });
    downloadReportButton.mouseOut(() => {
        downloadReportButton.style('background-color', 'var(--background-color)');
        downloadReportButton.style('color', 'var(--primary-color)');
    });
    
    // Create class report upload button
    const classReportUploadButton = createButton('LOAD REPORT');
    classReportUploadButton.parent(controlPanel);
    classReportUploadButton.mousePressed(() => {
        // Create file input for class report
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.txt';
        fileInput.style.display = 'none';
        fileInput.onchange = (event) => {
            handleClassReportUpload(event);
            // Clean up after processing
            setTimeout(() => {
                if (document.body.contains(fileInput)) {
                    document.body.removeChild(fileInput);
                }
            }, 100);
        };
        document.body.appendChild(fileInput);
        fileInput.click();
    });
    
    // Style class report upload button
    classReportUploadButton.style('background-color', 'var(--background-color)');
    classReportUploadButton.style('color', 'var(--primary-color)');
    classReportUploadButton.style('font-family', 'VT323, monospace');
    classReportUploadButton.style('font-size', '18px');  // Match editor control panel
    classReportUploadButton.style('width', '100%');
    classReportUploadButton.style('height', '28px');  // Slightly taller for readability
    classReportUploadButton.style('border', '1px solid var(--primary-color)');
    classReportUploadButton.style('border-radius', '4px');
    classReportUploadButton.style('cursor', 'pointer');
    classReportUploadButton.style('margin-bottom', '4px');
    classReportUploadButton.style('text-align', 'center');
    classReportUploadButton.style('letter-spacing', '0.5px');
    
    // Add hover effect for class report upload button
    classReportUploadButton.mouseOver(() => {
        classReportUploadButton.style('background-color', 'var(--primary-color)');
        classReportUploadButton.style('color', 'var(--background-color)');
    });
    classReportUploadButton.mouseOut(() => {
        classReportUploadButton.style('background-color', 'var(--background-color)');
        classReportUploadButton.style('color', 'var(--primary-color)');
    });
    
    // Create reset report button
    resetReportButton = createButton('CLEAR');
    resetReportButton.parent(controlPanel);
    resetReportButton.mousePressed(resetClassReport);
    resetReportButton.style('background-color', 'var(--background-color)');
    resetReportButton.style('color', 'var(--primary-color)');
    resetReportButton.style('font-family', 'VT323, monospace');
    resetReportButton.style('font-size', '18px');  // Match editor control panel
    resetReportButton.style('width', '100%');
    resetReportButton.style('height', '28px');  // Slightly taller for readability
    resetReportButton.style('border', '1px solid var(--primary-color)');
    resetReportButton.style('border-radius', '4px');
    resetReportButton.style('cursor', 'pointer');
    resetReportButton.style('text-align', 'center');
    resetReportButton.style('margin-bottom', '4px');
    resetReportButton.style('letter-spacing', '0.5px');
    
    // Add hover effect for reset button
    resetReportButton.mouseOver(() => {
        resetReportButton.style('background-color', 'var(--primary-color)');
        resetReportButton.style('color', 'var(--background-color)');
    });
    resetReportButton.mouseOut(() => {
        resetReportButton.style('background-color', 'var(--background-color)');
        resetReportButton.style('color', 'var(--primary-color)');
    });
    
    // Create name input with empty initial value
    nameInput = createInput('');
    
    // Add input event handler for single name entry - only update on blur/enter
    nameInput.input(() => {
        const newName = nameInput.value().trim();
        studentName = newName;
        // Clear previous name when user starts typing a new name
        previousName = '';
        isManualNameEntry = true; // Mark as manual entry
        
        // Don't add to allStudents on every keystroke - wait for completion
        console.log('DEBUG: Input value changed to:', newName);
    });
    
    // Add blur event handler to add complete names
    nameInput.elt.addEventListener('blur', () => {
        const newName = nameInput.value().trim();
        
        if (newName.length > 0) {
            // Add to allStudents if not already there
            if (!allStudents.includes(newName)) {
                allStudents.push(newName);
                currentStudentIndex = allStudents.length - 1; // Set to last added student
                console.log('DEBUG: Added new student on blur:', newName);
            } else {
                // Find existing student index
                currentStudentIndex = allStudents.indexOf(newName);
                console.log('DEBUG: Found existing student at index:', currentStudentIndex);
            }
            
            // Update total unique students count
            totalUniqueStudents = allStudents.length;
            
            console.log('DEBUG: allStudents after blur:', allStudents);
            console.log('DEBUG: totalUniqueStudents:', totalUniqueStudents);
            
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
            
            // Update navigation buttons visibility
            positionNameInputAndButtons();
            
            saveCurrentStateToLocalStorage(); // Save to localStorage
        } else {
            // Empty name - clear everything
            studentName = '';
            currentPrompts = {};
            isGenerationComplete = false;
            generationStep = 0;
            isGenerating = false;
            isAnimating = false;
        }
        
        console.log('Name input completed:', studentName);
    });
    
    // Add enter key handler to add complete names
    nameInput.elt.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            const newName = nameInput.value().trim();
            
            if (newName.length > 0) {
                // Play beep sound for feedback
                playSound(SOUND.REVEAL);
                
                // Add to allStudents if not already there
                if (!allStudents.includes(newName)) {
                    allStudents.push(newName);
                    currentStudentIndex = allStudents.length - 1; // Set to last added student
                    console.log('DEBUG: Added new student on enter:', newName);
                } else {
                    // Find existing student index
                    currentStudentIndex = allStudents.indexOf(newName);
                    console.log('DEBUG: Found existing student at index:', currentStudentIndex);
                }
                
                // Update total unique students count
                totalUniqueStudents = allStudents.length;
                
                console.log('DEBUG: allStudents after enter:', allStudents);
                console.log('DEBUG: totalUniqueStudents:', totalUniqueStudents);
                
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
                
                // Update navigation buttons visibility
                positionNameInputAndButtons();
                
                saveCurrentStateToLocalStorage(); // Save to localStorage
                
                // Blur the input field so user can immediately press up arrow to run prompts
                nameInput.elt.blur();
            }
            
            console.log('Name input completed on enter:', studentName);
        }
    });
    
    // Create navigation arrows (always create them)
    console.log('Class list length:', classList.length);
    
    // Calculate centered positioning for equal gaps
    const nameFieldWidth = BUTTON_SIZES.WIDTH();
    const arrowWidth = 30;
    const totalWidth = nameFieldWidth + (arrowWidth * 2) + 20; // 20px total gap (10px each side)
    const startX = (width - totalWidth) / 2;
    
    // Create previous student button (<)
    prevStudentButton = createButton('<');
    prevStudentButton.position(
        startX, 
        height - BUTTON_SIZES.BOTTOM_MARGIN() - (BUTTON_SIZES.HEIGHT() * 2) - BUTTON_SIZES.ELEMENT_SPACING()
    );
    prevStudentButton.mousePressed(prevStudent);
    
    // Create next student button (>)
    nextStudentButton = createButton('>');
    nextStudentButton.position(
        startX + arrowWidth + 10 + nameFieldWidth + 10, 
        height - BUTTON_SIZES.BOTTOM_MARGIN() - (BUTTON_SIZES.HEIGHT() * 2) - BUTTON_SIZES.ELEMENT_SPACING()
    );
    
    nextStudentButton.mousePressed(nextStudent);
    
    // Style navigation buttons
    [prevStudentButton, nextStudentButton].forEach(button => {
        button.style('background-color', 'var(--background-color)');
        button.style('color', 'var(--primary-color)');
        button.style('font-family', 'VT323, monospace');
        button.style('font-size', FONT_SIZES.INPUT() + 'px');
        button.style('width', '30px');
        button.style('height', BUTTON_SIZES.HEIGHT() + 'px');
        button.style('border', '1px solid var(--primary-color)');
        button.style('border-radius', '4px');
        button.style('cursor', 'pointer');
        
        // Add hover effects
        button.mouseOver(() => {
            button.style('background-color', 'var(--primary-color)');
            button.style('color', 'var(--background-color)');
        });
        button.mouseOut(() => {
            button.style('background-color', 'var(--background-color)');
            button.style('color', 'var(--primary-color)');
        });
    });
    
    // Show/hide navigation buttons based on student list
    if (allStudents.length === 0) {
        // No students - hide navigation arrows
        prevStudentButton.hide();
        nextStudentButton.hide();
    } else {
        // Has students - show navigation buttons (even with just 1 student)
        prevStudentButton.show();
        nextStudentButton.show();
    }
    
    // Style name input with terminal colors
    nameInput.size(BUTTON_SIZES.WIDTH());
    nameInput.style('height', BUTTON_SIZES.HEIGHT() + 'px');
    nameInput.style('font-family', 'VT323, monospace');
    nameInput.style('font-size', FONT_SIZES.INPUT() + 'px');
    nameInput.style('color', 'var(--primary-color)');
    nameInput.style('background-color', 'var(--background-color)');
    nameInput.style('border', '1px solid var(--primary-color)');
    nameInput.style('padding', '5px 10px');
    nameInput.style('box-sizing', 'border-box');
    nameInput.attribute('placeholder', 'Enter student name here');
    
    // Position name input after data is loaded
    positionNameInputAndButtons();
    
    // Update name input for no class list scenario
    updateNameInputForNoClassList();
}

// Update UI on window resize
function updateUIOnResize() {
    resizeCanvas(windowWidth, windowHeight);
    
    // Position control panel and toggle button
    positionControlPanel();
    
    // Use the centralized positioning function
    positionNameInputAndButtons();
    
    // Calculate new font sizes
    const inputFontSize = FONT_SIZES.INPUT() + 'px';
    
    // Update input size and font (position already set above)
    nameInput.size(BUTTON_SIZES.WIDTH());
    nameInput.style('height', BUTTON_SIZES.HEIGHT() + 'px');
    nameInput.style('font-size', inputFontSize);
    
    nameInput.style('font-family', 'VT323, monospace');
    nameInput.style('color', 'var(--text-color)');
    nameInput.style('background-color', 'var(--background-color)');
    nameInput.style('border', '1px solid var(--primary-color)');
    nameInput.style('padding', '5px 10px');
    nameInput.style('box-sizing', 'border-box');
    
    // Update button font sizes to match input
    if (prevStudentButton && nextStudentButton) {
        [prevStudentButton, nextStudentButton].forEach(button => {
            button.style('font-size', inputFontSize);
        });
    }
}
