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
    // Use actual window width if p5.js width isn't ready yet
    const currentWidth = (typeof width !== 'undefined' && width > 0) ? width : window.innerWidth;
    const currentHeight = (typeof height !== 'undefined' && height > 0) ? height : window.innerHeight;
    
    // Position toggle button at top right (matching editor)
    if (controlPanelToggle) {
        const toggleTop = 20; // Match editor toggle position
        const toggleRight = 20; // Match editor toggle position (distance from right edge)
        const toggleWidth = 28; // Toggle button width
        // Position toggle so its right edge is 20px from right: currentWidth - toggleRight
        // Left edge position: currentWidth - toggleRight - toggleWidth
        controlPanelToggle.position(currentWidth - toggleRight - toggleWidth, toggleTop);
    }
    
    // Position control panel directly below toggle button (matching editor)
    if (controlPanel) {
        const toggleTop = 20; // Match editor toggle position
        const toggleHeight = 28; // Toggle button height
        const gap = 12; // Gap between toggle and panel
        const panelTop = toggleTop + toggleHeight + gap; // 60px total (matching editor)
        const panelRight = 20; // Panel right edge distance from right (matching toggle)
        const panelWidth = 220; // Panel width as set in style
        
        // Align panel's right edge with toggle's right edge
        // Toggle right edge: currentWidth - 20 (toggleRight = 20)
        // Panel right edge should also be: currentWidth - 20
        // In p5.js, position() sets the top-left corner
        // Panel left position = currentWidth - panelRight - panelWidth
        // This positions panel so its right edge (including border) aligns with toggle's right edge
        controlPanel.position(currentWidth - panelRight - panelWidth, panelTop);
    }
}

// Helper function to ensure audio context is ready and play click sound
function playClickSound() {
    // Ensure audio context exists - create if needed
    if (!window.audioCtx) {
        try {
            window.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Could not create audio context:', e);
            return;
        }
    }
    
    // Resume audio context if suspended (required by browser autoplay policy)
    if (window.audioCtx.state === 'suspended') {
        window.audioCtx.resume().then(() => {
            if (window.playSound && window.SOUND) {
                window.playSound(window.SOUND.CLICK);
            }
        }).catch(e => {
            console.log('Could not resume audio context:', e);
            // Try to play anyway - might work
            if (window.playSound && window.SOUND) {
                window.playSound(window.SOUND.CLICK);
            }
        });
    } else {
        // Context is already running, play immediately
        if (window.playSound && window.SOUND) {
            window.playSound(window.SOUND.CLICK);
        }
    }
}

// Toggle control panel visibility
function toggleControlPanel() {
    controlPanelVisible = !controlPanelVisible;
    
    if (controlPanelVisible) {
        controlPanel.style('display', 'block');
        controlPanelToggle.html('☰');
    } else {
        controlPanel.style('display', 'none');
        controlPanelToggle.html('☰');
    }
}

// Position name input and navigation buttons
function positionNameInputAndButtons() {
    // Use actual window dimensions if p5.js dimensions aren't ready yet
    const currentWidth = (typeof width !== 'undefined' && width > 0) ? width : window.innerWidth;
    const currentHeight = (typeof height !== 'undefined' && height > 0) ? height : window.innerHeight;
    
    const bottomMargin = BUTTON_SIZES.BOTTOM_MARGIN();
    const elementHeight = BUTTON_SIZES.HEIGHT();
    const elementSpacing = BUTTON_SIZES.ELEMENT_SPACING();
    
    // Always show arrows next to name field
    // Calculate centered positioning for equal gaps
    const nameFieldWidth = BUTTON_SIZES.WIDTH();
    const arrowWidth = 30;
    const totalWidth = nameFieldWidth + (arrowWidth * 2) + 20; // 20px total gap (10px each side)
    const startX = (currentWidth - totalWidth) / 2;
    
    // Position name input between arrows (moved up further)
    const verticalOffset = 80; // Increased from 40px to 80px to move field higher
    if (nameInput) {
        nameInput.position(
            startX + arrowWidth + 10, 
            currentHeight - bottomMargin - (elementHeight * 2) - elementSpacing - verticalOffset
        );
    }
    
    // Position buttons (moved up to match name input)
    if (prevStudentButton) {
        prevStudentButton.position(
            startX, 
            currentHeight - bottomMargin - (elementHeight * 2) - elementSpacing - verticalOffset
        );
    }
    if (nextStudentButton) {
        nextStudentButton.position(
            startX + arrowWidth + 10 + nameFieldWidth + 10, 
            currentHeight - bottomMargin - (elementHeight * 2) - elementSpacing - verticalOffset
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
    controlPanelToggle.style('display', 'block'); // Ensure toggle is visible
    controlPanelToggle.mousePressed(() => {
        // Play click sound first, then toggle
        playClickSound();
        toggleControlPanel();
    });
    controlPanelToggle.style('background-color', 'var(--background-color)');
    controlPanelToggle.style('border', '2px solid var(--primary-color)');
    controlPanelToggle.style('border-radius', '0px');
    controlPanelToggle.style('color', 'var(--primary-color)');
    controlPanelToggle.style('font-family', 'VT323, monospace');
    controlPanelToggle.style('font-size', '14px');
    controlPanelToggle.style('font-weight', 'bold');
    controlPanelToggle.style('width', '28px');
    controlPanelToggle.style('height', '28px');
    controlPanelToggle.style('box-sizing', 'border-box'); // Include border in width calculation
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
    controlPanel.style('font-size', 'clamp(16px, 2.5vw, 20px)');  // Match editor control panel
    controlPanel.style('width', '220px');  // Match editor control panel width (adjusted for 18px fonts)
    controlPanel.style('box-sizing', 'border-box'); // Include border in width calculation
    controlPanel.style('box-shadow', 'inset 1px 1px 0px var(--primary-color), inset -1px -1px 0px var(--primary-color), 2px 2px 0px var(--primary-shadow)');
    controlPanel.style('transition', 'none'); // No animation - instant show/hide
    controlPanel.style('display', 'block'); // Ensure panel is visible by default
    
    // Position control panel and toggle button (will be repositioned after canvas is ready)
    // Use window dimensions as fallback if p5.js dimensions aren't ready
    positionControlPanel();
    
    // Add title
    const panelTitle = createDiv('CONTROL PANEL');
    panelTitle.parent(controlPanel);
    panelTitle.style('text-align', 'center');
    panelTitle.style('font-weight', 'bold');
    panelTitle.style('margin-bottom', '4px');
    panelTitle.style('color', 'var(--primary-color)');
    panelTitle.style('font-size', '18px');  // Match editor settings-title
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
    
    const interestTitle = createDiv('FORCE CATEGORY');
    interestTitle.parent(interestContainer);
    interestTitle.style('color', 'var(--primary-color)');
    interestTitle.style('font-size', '18px');  // Match editor settings-title
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
    // CRITICAL: Also set ID on the actual DOM element so document.getElementById() can find it
    if (allCategoriesCheckbox.elt) {
        allCategoriesCheckbox.elt.id = 'all-categories-checkbox';
    }
    allCategoriesCheckbox.class('all-categories-checkbox');
    allCategoriesCheckbox.style('width', '12px');
    allCategoriesCheckbox.style('height', '12px');
    allCategoriesCheckbox.style('border', '1px solid var(--primary-color)');
    allCategoriesCheckbox.style('background-color', 'var(--primary-color)');
    allCategoriesCheckbox.style('margin-right', '6px');
    allCategoriesCheckbox.style('cursor', 'pointer');
    allCategoriesCheckbox.style('position', 'relative');
    allCategoriesCheckbox.attribute('data-checked', 'true');
    // CRITICAL: Also set data-checked on the actual DOM element
    if (allCategoriesCheckbox.elt) {
        allCategoriesCheckbox.elt.setAttribute('data-checked', 'true');
    }
    allCategoriesCheckbox.style('background-color', 'var(--primary-color)');
    
    const allCategoriesLabel = createDiv('All Categories');
    allCategoriesLabel.parent(allCategoriesDiv);
    allCategoriesLabel.style('color', 'var(--primary-color)');
    allCategoriesLabel.style('font-size', '18px');  // Match editor theme-picker label
    allCategoriesLabel.style('cursor', 'pointer');
    allCategoriesLabel.mousePressed(() => {
        // Play click sound for checkbox
        playClickSound();
        
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
        // Play click sound for checkbox
        playClickSound();
        
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
        // Play Mac SE-style click sound
        playClickSound();
        
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
    classListUploadButton.style('font-size', '18px');  // Match editor settings-item
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
    recordButton.mousePressed(() => {
        // Play Mac SE-style click sound
        playClickSound();
        takeScreenshot();
    });
    recordButton.style('background-color', 'var(--background-color)');
    recordButton.style('color', 'var(--primary-color)');
    recordButton.style('font-family', 'VT323, monospace');
    recordButton.style('font-size', '18px');  // Match editor settings-item
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
    downloadReportButton.mousePressed(() => {
        // Play Mac SE-style click sound
        playClickSound();
        downloadClassReport();
    });
    downloadReportButton.style('background-color', 'var(--background-color)');
    downloadReportButton.style('color', 'var(--primary-color)');
    downloadReportButton.style('font-family', 'VT323, monospace');
    downloadReportButton.style('font-size', '18px');  // Match editor settings-item
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
        // Play Mac SE-style click sound
        playClickSound();
        
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
    classReportUploadButton.style('font-size', '18px');  // Match editor settings-item
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
    resetReportButton.mousePressed(() => {
        // Play Mac SE-style click sound
        playClickSound();
        resetClassReport();
    });
    resetReportButton.style('background-color', 'var(--background-color)');
    resetReportButton.style('color', 'var(--primary-color)');
    resetReportButton.style('font-family', 'VT323, monospace');
    resetReportButton.style('font-size', '18px');  // Match editor settings-item
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
    nameInput.style('display', 'block'); // Ensure input is visible
    
    // Add input event handler for single name entry - only update on blur/enter
    nameInput.input(() => {
        const newName = nameInput.value().trim();
        const wasEmpty = !studentName || studentName.length === 0;
        const previousStudent = studentName; // Store previous student name
        
        // If student name changed (not just typing), commit pending prompts
        if (previousStudent && previousStudent !== newName && previousStudent.length > 0 && newName.length > 0) {
            if (window.commitPendingPrompts) {
                window.commitPendingPrompts();
            }
        }
        
        studentName = newName;
        
        // Clear previous name when user starts typing a new name
        previousName = '';
        isManualNameEntry = true; // Mark as manual entry
        
        // Clear prompts when user starts typing (first character entered)
        // This ensures prompts disappear as soon as user begins entering a new name
        if (wasEmpty && newName.length > 0) {
            console.log('First character entered - clearing prompts');
            currentPrompts = {};
            isGenerationComplete = false;
            generationStep = 0;
            isGenerating = false;
            isAnimating = false;
        }
        
        // Don't add to allStudents on every keystroke - wait for completion
        console.log('DEBUG: Input value changed to:', newName);
    });
    
    // Add blur event handler to add complete names
    nameInput.elt.addEventListener('blur', () => {
        const newName = nameInput.value().trim();
        const previousStudent = studentName; // Store previous student name
        
        // If student name changed, commit pending prompts
        if (previousStudent && previousStudent !== newName && previousStudent.length > 0) {
            if (window.commitPendingPrompts) {
                window.commitPendingPrompts();
            }
        }
        
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
            // Empty name field - but DON'T clear prompts if they're currently displayed
            // Prompts should only be cleared when user starts typing a new name (handled in input handler)
            // or when a new prompt generation starts
            studentName = '';
            // DO NOT clear currentPrompts here - they should remain visible after screenshot
            // Only clear generation state flags, not the displayed prompts
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
    // Use window dimensions as fallback if p5.js dimensions aren't ready
    const currentWidth = (typeof width !== 'undefined' && width > 0) ? width : window.innerWidth;
    const currentHeight = (typeof height !== 'undefined' && height > 0) ? height : window.innerHeight;
    const nameFieldWidth = BUTTON_SIZES.WIDTH();
    const arrowWidth = 30;
    const totalWidth = nameFieldWidth + (arrowWidth * 2) + 20; // 20px total gap (10px each side)
    const startX = (currentWidth - totalWidth) / 2;
    
    // Create previous student button (<)
    prevStudentButton = createButton('<');
    prevStudentButton.style('display', 'block'); // Ensure button is visible
    const bottomMargin = BUTTON_SIZES.BOTTOM_MARGIN();
    const elementHeight = BUTTON_SIZES.HEIGHT();
    const elementSpacing = BUTTON_SIZES.ELEMENT_SPACING();
    const verticalOffset = 80; // Match positionNameInputAndButtons
    prevStudentButton.position(
        startX, 
        currentHeight - bottomMargin - (elementHeight * 2) - elementSpacing - verticalOffset
    );
    prevStudentButton.mousePressed(prevStudent);
    
    // Create next student button (>)
    nextStudentButton = createButton('>');
    nextStudentButton.style('display', 'block'); // Ensure button is visible
    nextStudentButton.position(
        startX + arrowWidth + 10 + nameFieldWidth + 10, 
        currentHeight - bottomMargin - (elementHeight * 2) - elementSpacing - verticalOffset
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

// Export positioning functions for use in sketch-refactored.js
window.positionControlPanel = positionControlPanel;
window.positionNameInputAndButtons = positionNameInputAndButtons;
