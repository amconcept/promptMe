document.addEventListener('DOMContentLoaded', () => {
    let categoryCounter = 0;
    let promptCounter = 0;
    const MAX_CATEGORIES = 10;
    const MAX_PROMPTS = 10;

    // Add these button variables at the top
    let downloadSettingsButton;
    let uploadSettingsButton;

    function addNewPrompt() {
        if (promptCounter >= MAX_PROMPTS) return;
        const promptHeaders = document.getElementById('prompt-headers');
        const addButton = promptHeaders.querySelector('.add-prompt-button');
        
        // Create new prompt column
        const newPrompt = document.createElement('div');
        newPrompt.className = 'prompt-column';
        promptCounter++;
        
        // Add input and delete button
        newPrompt.innerHTML = `
            <input type="text" class="header-input" placeholder="Enter label">
            <button class="delete-prompt" onclick="deletePrompt(this)">x</button>
        `;
        
        // Insert the new prompt before the add button
        promptHeaders.insertBefore(newPrompt, addButton);
        
        updateCategoryRows();
    }

    function updateCategoryRows() {
        const categoryRows = document.querySelectorAll('.category-row');
        const promptCount = document.querySelectorAll('.prompt-column').length;
        
        categoryRows.forEach((row, index) => {
            const currentTextareas = row.querySelectorAll('textarea').length;
            const label = row.querySelector('.row-label');
            label.textContent = String.fromCharCode(65 + index); // A, B, C, D
            
            // Add new textareas if needed
            for (let i = currentTextareas; i < promptCount; i++) {
                const textarea = document.createElement('textarea');
                textarea.placeholder = 'Enter prompts (one per line)';
                row.appendChild(textarea);
            }
        });
    }

    function addNewCategory() {
        if (categoryCounter >= MAX_CATEGORIES) return;
        const categoriesContainer = document.getElementById('categories-container');
        const newCategory = document.createElement('div');
        newCategory.className = 'category-row';
        categoryCounter++;
        
        // Create category label container
        const labelContainer = document.createElement('div');
        labelContainer.className = 'row-label-container';
        labelContainer.innerHTML = `
            <button class="delete-category" onclick="deleteCategory(this.closest('.category-row'))">x</button>
            <div class="row-label">${String.fromCharCode(64 + categoryCounter)}</div>
        `;
        
        newCategory.appendChild(labelContainer);
        
        // Add a textarea for each existing prompt column
        const promptCount = document.querySelectorAll('.prompt-column').length;
        for (let i = 0; i < promptCount; i++) {
            const textarea = document.createElement('textarea');
            textarea.placeholder = 'Enter prompts (one per line)';
            newCategory.appendChild(textarea);
        }
        
        categoriesContainer.appendChild(newCategory);
    }

    function deletePrompt(button) {
        const promptColumn = button.parentElement;
        promptColumn.remove();
        promptCounter--;
        updateCategoryRows();
    }

    function deleteCategory(categoryRow) {
        categoryRow.remove();
        categoryCounter--;
        updateCategoryRows();
    }

    function saveChanges() {
        const data = {
            objective: document.getElementById('objective-input').value,
            categories: {}
        };

        // Get all headers (column labels)
        const headers = document.querySelectorAll('.header-input');
        const categoryRows = document.querySelectorAll('.category-row');

        // For each header/column
        headers.forEach((header, columnIndex) => {
            const headerText = header.value.trim() || `PROMPT ${columnIndex + 1}`;
            data.categories[headerText] = {};
            
            // For each category (A, B, C, D)
            categoryRows.forEach((row, rowIndex) => {
                const categoryLabel = String.fromCharCode(65 + rowIndex);
                const textarea = row.querySelectorAll('textarea')[columnIndex];
                
                if (textarea && textarea.value.trim()) {
                    const prompts = textarea.value.split('\n')
                        .map(line => line.trim())
                        .filter(line => line.length > 0);
                    
                    if (prompts.length > 0) {
                        data.categories[headerText][categoryLabel] = prompts;
                    }
                }
            });
        });

        localStorage.setItem('promptCategories', JSON.stringify(data));
        alert('Changes saved!');
    }

    // Initialize with default state
    addNewPrompt();
    addNewCategory();

    // Attach functions to global scope
    window.addNewPrompt = addNewPrompt;
    window.addNewCategory = addNewCategory;
    window.deletePrompt = deletePrompt;
    window.deleteCategory = deleteCategory;
    window.saveChanges = saveChanges;
    window.returnToApp = () => window.location.href = 'index.html';

    // Also update loadSavedData to preserve the add button
    function loadSavedData() {
        const savedData = localStorage.getItem('promptCategories');
        if (savedData) {
            const data = JSON.parse(savedData);
            
            // Set objective
            document.getElementById('objective-input').value = data.objective || '';

            // Clear existing prompts but keep the add button
            const promptHeaders = document.getElementById('prompt-headers');
            const addButton = promptHeaders.querySelector('.add-prompt-button');
            promptHeaders.innerHTML = '';
            promptHeaders.appendChild(addButton);
            
            document.getElementById('categories-container').innerHTML = '';
            promptCounter = 0;
            categoryCounter = 0;

            // Add headers/prompts
            Object.entries(data.categories).forEach(([header]) => {
                addNewPrompt();
                const headerInputs = document.querySelectorAll('.header-input');
                headerInputs[headerInputs.length - 1].value = header;
            });

            // Add categories and fill in prompts
            Object.values(data.categories)[0] && Object.keys(Object.values(data.categories)[0]).forEach((categoryLabel) => {
                addNewCategory();
                const categoryRows = document.querySelectorAll('.category-row');
                const currentRow = categoryRows[categoryRows.length - 1];
                
                Object.entries(data.categories).forEach(([header, categoryData], columnIndex) => {
                    const textarea = currentRow.querySelectorAll('textarea')[columnIndex];
                    if (textarea && categoryData[categoryLabel]) {
                        textarea.value = categoryData[categoryLabel].join('\n');
                    }
                });
            });
        } else {
            // If no saved data, initialize with defaults
            addNewPrompt();
            addNewCategory();
        }
    }

    // Call loadSavedData instead of just adding default prompt and category
    loadSavedData();

    function downloadSettings() {
        const savedData = localStorage.getItem('promptCategories');
        if (savedData) {
            const blob = new Blob([savedData], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'prompt_settings.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }

    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const settings = JSON.parse(e.target.result);
                    localStorage.setItem('promptCategories', JSON.stringify(settings));
                    loadSavedData(); // Refresh the interface with new data
                    alert('Settings uploaded successfully!');
                } catch (error) {
                    alert('Error parsing settings file: ' + error.message);
                }
            };
            reader.readAsText(file);
        }
    }

    // Find the buttons container
    const buttonsContainer = document.querySelector('.buttons');
    
    // Create Download button
    const downloadButton = document.createElement('button');
    downloadButton.textContent = 'DOWNLOAD SPREADSHEET';
    downloadButton.className = 'save';  // Use same style as save button
    downloadButton.onclick = downloadSpreadsheet;
    
    // Create Upload button
    const uploadButton = document.createElement('button');
    uploadButton.textContent = 'UPLOAD SPREADSHEET';
    uploadButton.className = 'save';
    
    // File input for CSV
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv';
    fileInput.style.display = 'none';
    fileInput.onchange = handleSpreadsheetUpload;
    
    uploadButton.onclick = () => fileInput.click();

    // Add the buttons before the return button
    const returnButton = buttonsContainer.querySelector('.return');
    buttonsContainer.insertBefore(downloadButton, returnButton);
    buttonsContainer.insertBefore(uploadButton, returnButton);
    buttonsContainer.appendChild(fileInput);

    // Function to download as spreadsheet
    function downloadSpreadsheet() {
        console.log("Starting download...");
        
        // Get headers (prompt types)
        const headerInputs = document.querySelectorAll('.header-input');
        const headers = Array.from(headerInputs).map(input => input.value || 'Untitled');
        console.log("Headers:", headers);
        
        // Create CSV content
        let csvContent = 'Category,' + headers.join(',') + '\n';
        console.log("Initial CSV header:", csvContent);
        
        // Add each category's prompts
        const categoryRows = document.querySelectorAll('.category-row');
        console.log("Number of category rows:", categoryRows.length);
        
        categoryRows.forEach((row, index) => {
            const categoryLabel = row.querySelector('.row-label').textContent;
            const textareas = row.querySelectorAll('textarea');
            console.log(`Category ${categoryLabel} has ${textareas.length} textareas`);
            
            let rowData = [];
            textareas.forEach(textarea => {
                const value = textarea.value.trim();
                console.log(`Textarea value for ${categoryLabel}:`, value);
                rowData.push(`"${value.replace(/\n/g, ';')}"`);
            });
            
            csvContent += `${categoryLabel},${rowData.join(',')}\n`;
            console.log(`Row ${index} content:`, `${categoryLabel},${rowData.join(',')}`);
        });

        // Add objective
        const objective = document.getElementById('objective-input').value;
        console.log("Objective:", objective);
        if (objective) {
            csvContent += `\nObjective,"${objective}"`;
        }
        
        console.log("Final CSV content:", csvContent);
        
        // Create and trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        console.log("Blob size:", blob.size);
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'prompt_settings.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }

    // Function to handle spreadsheet upload
    function handleSpreadsheetUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const text = e.target.result;
                    const rows = text.split('\n').map(row => 
                        row.split(',').map(cell => 
                            // Remove quotes and convert semicolons back to newlines
                            cell.trim().replace(/^"(.*)"$/, '$1').replace(/;/g, '\n')
                        )
                    );
                    
                    // Clear existing content
                    const promptHeaders = document.getElementById('prompt-headers');
                    const addButton = promptHeaders.querySelector('.add-prompt-button');
                    promptHeaders.innerHTML = '';
                    promptHeaders.appendChild(addButton);
                    
                    document.getElementById('categories-container').innerHTML = '';
                    promptCounter = 0;
                    categoryCounter = 0;
                    
                    // Add headers (skip first column as it's category labels)
                    const headers = rows[0].slice(1);
                    headers.forEach(header => {
                        if (header && header !== 'Untitled') {
                            addNewPrompt();
                            const headerInputs = document.querySelectorAll('.header-input');
                            headerInputs[headerInputs.length - 1].value = header;
                        }
                    });
                    
                    // Add categories and prompts (skip header row)
                    rows.slice(1).forEach(row => {
                        if (row[0] && row[0] !== 'Objective') { // Skip objective row
                            addNewCategory();
                            const categoryRows = document.querySelectorAll('.category-row');
                            const currentRow = categoryRows[categoryRows.length - 1];
                            
                            // Fill in prompts
                            row.slice(1).forEach((cellValue, index) => {
                                const textarea = currentRow.querySelectorAll('textarea')[index];
                                if (textarea) {
                                    textarea.value = cellValue;
                                }
                            });
                        } else if (row[0] === 'Objective') {
                            // Set objective
                            document.getElementById('objective-input').value = row[1] || '';
                        }
                    });
                    
                    alert('Spreadsheet uploaded successfully!');
                } catch (error) {
                    alert('Error parsing spreadsheet: ' + error.message);
                }
            };
            reader.readAsText(file);
        }
    }

    // Style the buttons
    [downloadButton, uploadButton].forEach(button => {
        button.style.backgroundColor = '#A8D5BA';  // Light green like Save Changes
        button.style.color = 'white';
        button.style.fontSize = '20px';
        button.style.padding = '15px 30px';
        button.style.border = 'none';
        button.style.borderRadius = '25px';  // More rounded corners
        button.style.cursor = 'pointer';
        button.style.fontFamily = 'Arial, sans-serif';
        button.style.width = 'auto';
        button.style.margin = '10px';
        button.style.textTransform = 'uppercase';  // Make text uppercase
        button.style.letterSpacing = '1px';  // Add letter spacing
        button.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';  // Subtle shadow
    });
    
    // Add hover effect
    [downloadButton, uploadButton].forEach(button => {
        button.onmouseover = () => {
            button.style.backgroundColor = '#8FC3A3';  // Slightly darker on hover
            button.style.transition = 'background-color 0.3s ease';
        };
        button.onmouseout = () => {
            button.style.backgroundColor = '#A8D5BA';
        };
    });
});