// assets/js/spectrum-viewer.js

document.addEventListener('DOMContentLoaded', () => {
    // =================================================================
    // 0. Element retrieval and constants (ported from Python)
    // =================================================================
    const uploadInput = document.getElementById('upload-data');
    const uploadBox = document.getElementById('upload-box');
    const fileTypeRadios = document.getElementById('file-type-radios');
    const resolvedTypeEl = document.getElementById('resolved-type');
    const wl0Input = document.getElementById('wl0-input');
    const velRangeInput = document.getElementById('vel-range');
    const lineButtonsContainer = document.getElementById('line-buttons-container');
    const colChecklist = document.getElementById('col-checklist');
    const chartContainer = document.getElementById('spectrum-figure');

    if (!uploadInput || !chartContainer) return;
    // Constants and element definitions
    const LINES = {
        "Hα 6563": 656.28, "Hβ 4861": 486.13, "Hγ 4340": 434.05,
        "Hδ 4102": 410.17, "Hε 3970": 397.01, "Hζ 3889": 388.9064,
        "He I D3 5876": 587.56, "He I 4472": 447.15, "He I 4026": 402.62,
        "He I 3889": 388.86, "He II 4686": 468.57038,
        "Na II D1 5890": 588.995, "Na II D2 5896": 589.592,
        "Ca II K 3934": 393.37, "Ca II H 3969": 396.85,
        "Ca II IRT-1 8498": 849.80, "Ca II IRT-2 8542": 854.21,
        "Ca II IRT-3 8662": 866.21,
    };

    // Physical constants and conversion functions (ported from Python)
    const C_KMS = 299792.458;
    const wl2v = (wl, wl0) => (wl - wl0) / wl0 * C_KMS;
    const v2dwl = (v, wl0) => wl0 * v / C_KMS;

    // Global state variables
    let parsedData = null; // Stores parsed data { data: {}, columns: [], xCol: '', resolvedType: '' }

    // =================================================================
    // 1. Event listeners
    // =================================================================
    uploadBox.addEventListener('click', () => uploadInput.click());
    uploadInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
    uploadBox.addEventListener('dragover', (e) => { e.preventDefault(); uploadBox.classList.add('dragover'); });
    uploadBox.addEventListener('dragleave', () => uploadBox.classList.remove('dragover'));
    uploadBox.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadBox.classList.remove('dragover');
        handleFile(e.dataTransfer.files[0]);
    });

    // Redraw when controls change
    [wl0Input, velRangeInput, fileTypeRadios].forEach(el => {
        el.addEventListener('change', processAndDraw);
    });
    colChecklist.addEventListener('change', () => drawChart());
    
    // Initialization
    generateLineButtons();
    drawChart(); // Draw an empty initial chart

    // =================================================================
    // 2. Core logic functions (ported from Python)
    // =================================================================

    /**
     * File handling entry point
     * @param {File} file 
     */
    function handleFile(file) {
        if (!file) return;
        uploadBox.innerHTML = `Loading: <em>${file.name}</em>`;
        resolvedTypeEl.textContent = 'Processing...';
        
        const reader = new FileReader();
        reader.onload = (e) => {
            // After successful file read, call processAndDraw
            processAndDraw(e.target.result, file.name);
        };
        reader.onerror = () => {
            showError("An error occurred while reading the file.");
        };
        reader.readAsText(file);
    }
    
    /**
     * Main processing flow: parse data, update UI, draw chart
     * @param {string | Event} contentOrEvent - File content string or event object
     * @param {string} filename - File name
     */
    function processAndDraw(contentOrEvent, filename = null) {
        let fileContent;
        // Function may be called by event listeners or directly with content
        if (typeof contentOrEvent === 'string') {
            fileContent = contentOrEvent;
        } else if (parsedData) {
            // If triggered by an event and data already exists, just redraw
            drawChart();
            return;
        } else {
            // If triggered by an event but no data, do nothing
            return;
        }

        try {
            const fileTypeHint = document.querySelector('input[name="file-type"]:checked').value;
            parsedData = parseAndProcessText(fileContent, fileTypeHint);
            
            updateUI(filename);
            drawChart();
        } catch (error) {
            showError(error.message);
            console.error("Failed to process file:", error);
        }
    }
    
    /**
     * Display error message
     * @param {string} message 
     */
    function showError(message) {
        parsedData = null;
        chartContainer.innerHTML = `<p style="color: red; text-align: center; padding: 20px;">Error: ${message}</p>`;
        resolvedTypeEl.textContent = 'Load failed';
        colChecklist.innerHTML = `<small>Loading failed.</small>`;
        if (uploadBox) uploadBox.innerHTML = 'Load failed, please try again. <a>Click to choose file</a>';
    }

    /**
     * Update UI elements such as filename, checkboxes, etc.
     * @param {string} filename 
     */
    function updateUI(filename) {
        if (!parsedData) return;

        if (filename) {
            uploadBox.innerHTML = `Loaded: <em>${filename}</em>. Drag or choose a new file to replace.`;
        }
        
        const typeMap = {
            "spec_pol": "Spec (pol)", "spec_i": "Spec (I)",
            "lsd_pol": "LSD (pol)", "lsd_i": "LSD (I)",
        };
        resolvedTypeEl.textContent = typeMap[parsedData.resolvedType] || parsedData.resolvedType;

        // Update column selection checkboxes
        colChecklist.innerHTML = '';
        const yCols = parsedData.columns.filter(c => c !== parsedData.xCol && c !== 'order_id');
        const defaultChecked = ["Int", "Pol", "Null1"];
        
        yCols.forEach(colName => {
            const div = document.createElement('div');
            div.style.display = 'inline-block';
            div.style.marginRight = '15px';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `col-${colName}`;
            checkbox.value = colName;
            checkbox.checked = defaultChecked.includes(colName);
            const label = document.createElement('label');
            label.htmlFor = `col-${colName}`;
            label.textContent = colName;
            div.appendChild(checkbox);
            div.appendChild(label);
            colChecklist.appendChild(div);
        });

        // Show/hide spectral line buttons based on file type
        const isSpecType = parsedData.resolvedType.startsWith('spec');
        lineButtonsContainer.style.display = isSpecType ? 'block' : 'none';
    }

    // --- Core data parsing (ported from Python) ---

    /**
     * Ported from python: parse_text_to_df, detect_and_assign_columns, identify_portions
     * @param {string} text - File content
     * @param {string} fileTypeHint - User-selected file type
     * @returns {object} - Parsed data object
     */
    function parseAndProcessText(text, fileTypeHint) {
        // 1. Smartly parse into a 2D array (ported from parse_text_to_df)
        const lines = text.split('\n');
        const nonCommentLines = lines.filter(ln => !ln.trim().startsWith('*'));
        
        let startIdx = -1;
        for (let i = 0; i < nonCommentLines.length; i++) {
            const parts = nonCommentLines[i].trim().split(/\s+/);
            const numCount = parts.reduce((count, p) => count + (isFinite(p) && p !== '' ? 1 : 0), 0);
            if (numCount >= 3) {
                startIdx = i;
                break;
            }
        }

        if (startIdx === -1) { // Fallback if not found
            startIdx = nonCommentLines.findIndex(ln => ln.trim().split(/\s+/).length >=2);
            if(startIdx === -1) throw new Error("Could not find valid data lines in the file.");
        }

        const dataLines = nonCommentLines.slice(startIdx);
        const rawData = dataLines
            .map(line => line.trim().split(/\s+/).map(parseFloat))
            .filter(row => row.length > 0 && !row.some(isNaN));
        
        if (rawData.length === 0) throw new Error("No valid data after parsing.");
        
        const ncol = rawData[0].length;

        // 2. Detect type and assign column names (ported from detect_and_assign_columns)
        let resolvedType, columnNames, xCol;

        const assigner = (type) => {
            const result = _assignColumnsByType(ncol, type);
            if (!result) throw new Error(`The file has ${ncol} columns, which does not match the requirements for the selected type ${type}.`);
            return { ...result, resolvedType: type };
        };

        if (fileTypeHint === 'auto') {
            resolvedType = _heuristicGuess(rawData);
            if (!resolvedType) throw new Error("Unable to automatically determine data type. Please select manually.");
            ({ columnNames, xCol } = assigner(resolvedType));
        } else {
            ({ columnNames, xCol, resolvedType } = assigner(fileTypeHint));
        }

        // 3. Convert 2D array into column-oriented data object
        const data = {};
        columnNames.forEach(col => data[col] = []);
        rawData.forEach(row => {
            for (let i = 0; i < columnNames.length; i++) {
                if(row[i] !== undefined) data[columnNames[i]].push(row[i]);
            }
        });

        // 4. Split into segments/orders (ported from identify_portions)
        const xData = data[xCol];
        let prevX = -Infinity;
        let currentSegment = 0;
        data['order_id'] = xData.map(x => {
            if (x < prevX) currentSegment++;
            prevX = x;
            return currentSegment;
        });

        return { data, columns: [...columnNames, 'order_id'], xCol, resolvedType };
    }

    /**
     * Ported from _assign_columns_by_type
     */
    function _assignColumnsByType(ncol, type) {
        const columnMap = {
            spec_pol: { ncol: 6, names: ["Wav", "Int", "Pol", "Null1", "Null2", "sigma_int"], xCol: "Wav" },
            spec_i:   { ncol: 3, names: ["Wav", "Int", "sigma_int"], xCol: "Wav" },
            lsd_pol:  { ncol: 7, names: ["RV", "Int", "sigma_int", "Pol", "sigma_pol", "Null1", "sigma_null1"], xCol: "RV" },
            lsd_i:    { ncol: 3, names: ["RV", "Int", "sigma_int"], xCol: "RV" },
        };
        const spec = columnMap[type];
        if (!spec || spec.ncol !== ncol) return null;
        return { columnNames: spec.names, xCol: spec.xCol };
    }

    /**
     * Ported from _heuristic_guess
     */
    function _heuristicGuess(rawData) {
        if (!rawData || rawData.length === 0) return null;
        const ncol = rawData[0].length;

        if (ncol === 6) return "spec_pol";
        if (ncol === 7) return "lsd_pol";
        
        if (ncol === 3) {
            const x = rawData.map(row => row[0]);
            const xmin = Math.min(...x);
            const xmax = Math.max(...x);

            const is_wav = (xmin >= 200) && (xmax <= 5000);
            const is_rv = (xmin < 0) || (Math.abs(xmin) <= 10000 && Math.abs(xmax) <= 10000 && xmax < 200);

            if (is_wav && !is_rv) return "spec_i";
            if (is_rv && !is_wav) return "lsd_i";
        }
        return null; // Unable to determine
    }

    // --- Plotting and interactions ---

    /**
     * Dynamically generate spectral line buttons (ported from make_line_buttons)
     */
    function generateLineButtons() {
        lineButtonsContainer.innerHTML = '';
        Object.entries(LINES).forEach(([label, wl]) => {
            const button = document.createElement('button');
            button.textContent = label;
            button.className = 'btn btn-sm btn-outline-primary m-1'; // Use some generic styles
            button.addEventListener('click', () => handleLineButtonClick(wl, label));
            lineButtonsContainer.appendChild(button);
        });
        lineButtonsContainer.style.display = 'none'; // Hidden by default
    }

    /**
     * Handle spectral line button click
     * @param {number} wl_c - Central wavelength
     * @param {string} label - Button label
     */
    function handleLineButtonClick(wl_c, label) {
        if (!parsedData) return;
        
        // Update wl0 input value
        wl0Input.value = wl_c.toFixed(2);

        const vel_range = parseFloat(velRangeInput.value);
        if (isNaN(vel_range)) return;

        const dwl = v2dwl(vel_range, wl_c);
        const xRange = [wl_c - dwl, wl_c + dwl];
        
        drawChart(xRange); // Redraw with new range
    }

    /**
     * Core plotting function (ported from update_figure)
     * @param {Array<number>} xZoomRange - Optional x-axis zoom range [min, max]
     */
    function drawChart(xZoomRange = null) {
        if (typeof Plotly === 'undefined') {
            chartContainer.innerHTML = "Plotly.js library not loaded.";
            return;
        }

        if (!parsedData) {
            const fig = {
                layout: {
                    title: "Please upload a data file",
                    xaxis: { title: "Wavelength (nm) / Velocity (km/s)" },
                    yaxis: { title: "Intensity" },
                    height: 500
                }
            };
            Plotly.newPlot(chartContainer, [], fig.layout, { responsive: true });
            return;
        }

        const { data, columns, xCol, resolvedType } = parsedData;
        const selectedCols = Array.from(colChecklist.querySelectorAll('input:checked')).map(cb => cb.value);

        const basePanelCols = {
            N: columns.filter(c => ["Null1", "Null2", "Null"].includes(c)),
            V: columns.filter(c => ["Pol", "V"].includes(c)),
            I: columns.filter(c => ["Int"].includes(c)),
        };

        const panelCols = {};
        Object.keys(basePanelCols).forEach(key => {
            const effective = basePanelCols[key].filter(c => selectedCols.includes(c));
            panelCols[key] = effective.length > 0 ? effective : basePanelCols[key];
        });

        const colorCycle = {
            "Int": "#1f77b4", "Pol": "#d62728", "V": "#d62728",
            "Null": "#2ca02c", "Null1": "#2ca02c", "Null2": "#17becf",
            "sigma_int": "#9467bd"
        };
        
        const traces = [];
        const addTraces = (cols, yaxis) => {
            cols.forEach(col => {
                if (!data[col]) return;
                // Plot by segments using order_id
                const segments = [...new Set(data['order_id'])];
                segments.forEach(segId => {
                    const indices = data['order_id'].reduce((acc, val, i) => (val === segId ? [...acc, i] : acc), []);
                    traces.push({
                        x: indices.map(i => data[xCol][i]),
                        y: indices.map(i => data[col][i]),
                        mode: 'lines',
                        name: col,
                        yaxis: yaxis,
                        line: { color: colorCycle[col] || '#000000', width: 1.5 },
                        legendgroup: col,
                        showlegend: segId === 0, // Show legend only for the first segment
                    });
                });
            });
        };

        addTraces(panelCols.N, 'y3'); // Top panel
        addTraces(panelCols.V, 'y2'); // Middle panel
        addTraces(panelCols.I, 'y');  // Bottom panel

        const xlabel = resolvedType.startsWith('spec') ? "Wavelength (nm)" : "Radial Velocity (km/s)";
        const layout = {
            grid: { rows: 3, columns: 1, pattern: 'independent' },
            title: 'Spectral Data',
            xaxis: { title: xlabel, anchor: 'y' },
            yaxis:  { domain: [0, 0.6], title: 'I' }, // Bottom
            yaxis2: { domain: [0.62, 0.8], title: 'V' }, // Middle
            yaxis3: { domain: [0.82, 1.0], title: 'N' }, // Top
            hovermode: 'x unified',
            legend: { orientation: 'h', y: -0.2, x: 0.5, xanchor: 'center' },
            margin: { l: 60, r: 30, b: 80, t: 50 },
            height: 600
        };

        // Apply zoom range if requested
        if (xZoomRange) {
            layout.xaxis.range = xZoomRange;

            // Auto-scale Y axes
            const adaptY = (cols, yaxisKey) => {
                let ymin = Infinity, ymax = -Infinity;
                let hasDataInRange = false;
                cols.forEach(col => {
                    if (!data[col]) return;
                    for (let i = 0; i < data[xCol].length; i++) {
                        if (data[xCol][i] >= xZoomRange[0] && data[xCol][i] <= xZoomRange[1]) {
                            ymin = Math.min(ymin, data[col][i]);
                            ymax = Math.max(ymax, data[col][i]);
                            hasDataInRange = true;
                        }
                    }
                });
                if (hasDataInRange) {
                    const pad = (ymax - ymin) * 0.05 || Math.abs(ymin) * 0.05 || 0.1;
                    layout[yaxisKey].range = [ymin - pad, ymax + pad];
                }
            };
            adaptY(panelCols.I, 'yaxis');
            adaptY(panelCols.V, 'yaxis2');
            adaptY(panelCols.N, 'yaxis3');
        }

        Plotly.newPlot(chartContainer, traces, layout, { responsive: true });
    }
});