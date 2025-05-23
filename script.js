document.addEventListener('DOMContentLoaded', () => {
    const fabricCanvas = new fabric.Canvas('drawing-canvas', {
        isDrawingMode: false,
        selection: true,
        backgroundColor: '#fff',
        // Set initial dimensions; resizeCanvas will adjust
        width: 600,
        height: 400
    });

    const toolbar = document.querySelector('.toolbar');
    const colorPicker = document.getElementById('color-picker');
    const strokeWidthPicker = document.getElementById('stroke-width-picker');
    const loadSvgInput = document.getElementById('load-svg-input');
    const loadSvgButton = document.getElementById('load-svg-button');
    const statusMessage = document.getElementById('status-message');

    let currentTool = 'line';
    let isDrawingShape = false;
    let startCoords = null; // {x, y}
    let currentShape = null;

    let currentColor = '#000000';
    let currentStrokeWidth = 2;

    let isPlacingSvgMode = false;
    let loadedSvgGroup = null;

    function showStatus(message) {
        statusMessage.textContent = message;
        statusMessage.style.display = message ? 'block' : 'none';
    }

    function setPlacingSvgMode(active, svgGroup = null) {
        isPlacingSvgMode = active;
        loadedSvgGroup = svgGroup;
        fabricCanvas.discardActiveObject();

        if (active && svgGroup) {
            document.body.classList.add('placing-svg-mode');
            fabricCanvas.add(svgGroup);
            fabricCanvas.centerObject(svgGroup);

            // Scale to fit reasonably
            const canvasRatio = fabricCanvas.width / fabricCanvas.height;
            const svgRatio = svgGroup.width / svgGroup.height;
            let scaleFactor;
            if (canvasRatio > svgRatio) { // Canvas is wider or same aspect as SVG
                scaleFactor = (fabricCanvas.height * 0.5) / svgGroup.height;
            } else { // Canvas is taller or same aspect as SVG
                scaleFactor = (fabricCanvas.width * 0.5) / svgGroup.width;
            }
            svgGroup.scale(scaleFactor);
            
            // Recenter after scaling
            svgGroup.setCoords(); // Update controls
            fabricCanvas.centerObject(svgGroup);


            fabricCanvas.setActiveObject(svgGroup);
            fabricCanvas.renderAll();
            showStatus("SVG loaded. Use handles to resize/rotate, drag to position. Click tool or canvas to finalize.");
            activateTool('select'); // Implicitly switch to select tool for manipulation
        } else {
            document.body.classList.remove('placing-svg-mode');
            showStatus("");
            if (svgGroup && !active && !fabricCanvas.contains(svgGroup)) { // If canceling placement before adding
                // This case might not be hit if we always add it.
            }
            loadedSvgGroup = null; // Clear reference if finalized or canceled
        }
    }

    function resizeCanvas() {
        const toolbarHeight = toolbar.offsetHeight + 20;
        const newWidth = window.innerWidth * 0.95;
        const newHeight = Math.max(200, (window.innerHeight - toolbarHeight) * 0.95); // Min height

        fabricCanvas.setWidth(newWidth);
        fabricCanvas.setHeight(newHeight);
        fabricCanvas.calcOffset();
        fabricCanvas.renderAll();
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const toolButtons = document.querySelectorAll('.tool-button');
    function activateTool(toolName) {
        toolButtons.forEach(btn => btn.classList.remove('active'));
        const activeButton = document.getElementById(`tool-${toolName}`);
        if (activeButton) activeButton.classList.add('active');

        currentTool = toolName;

        if (currentTool === 'select') {
            fabricCanvas.isDrawingMode = false;
            fabricCanvas.selection = true;
            fabricCanvas.defaultCursor = 'default';
            fabricCanvas.hoverCursor = 'move';
            fabricCanvas.getObjects().forEach(obj => obj.set({ selectable: true, evented: true }));
        } else {
            fabricCanvas.isDrawingMode = false;
            fabricCanvas.selection = false;
            fabricCanvas.defaultCursor = 'crosshair';
            fabricCanvas.hoverCursor = 'crosshair'; // Keep crosshair when over objects while drawing
            fabricCanvas.getObjects().forEach(obj => obj.set({ selectable: false, evented: false }));
        }
        fabricCanvas.discardActiveObject().renderAll();
    }

    toolButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (isPlacingSvgMode) {
                // Finalize SVG placement: simply make it not the 'loadedSvgGroup' anymore
                // The object is already on canvas and active.
                setPlacingSvgMode(false); // Clears the mode, keeps the object
            }
            activateTool(button.dataset.tool);
        });
    });

    colorPicker.addEventListener('input', (e) => {
        currentColor = e.target.value;
        const activeObj = fabricCanvas.getActiveObject();
        if (activeObj) {
            const applyColor = (obj) => { if (obj.stroke || obj.type === 'path') obj.set('stroke', currentColor); }; // Paths might not have stroke initially
            if (activeObj.isType('activeSelection')) { // Group selection
                activeObj.forEachObject(applyColor);
            } else {
                applyColor(activeObj);
            }
            fabricCanvas.renderAll();
        }
    });

    strokeWidthPicker.addEventListener('input', (e) => {
        currentStrokeWidth = parseInt(e.target.value, 10) || 1;
        const activeObj = fabricCanvas.getActiveObject();
        if (activeObj) {
            const applyStrokeWidth = (obj) => { if (obj.strokeWidth || obj.type === 'path') obj.set('strokeWidth', currentStrokeWidth); };
            if (activeObj.isType('activeSelection')) {
                activeObj.forEachObject(applyStrokeWidth);
            } else {
                applyStrokeWidth(activeObj);
            }
            fabricCanvas.renderAll();
        }
    });

    fabricCanvas.on('mouse:down', (o) => {
        if (currentTool === 'select') {
            if (isPlacingSvgMode && o.target !== loadedSvgGroup) {
                setPlacingSvgMode(false); // Finalize by clicking off
            }
            return; // Fabric handles selection
        }
        if (isPlacingSvgMode) return; // Don't draw new shapes while placing SVG

        isDrawingShape = true;
        startCoords = fabricCanvas.getPointer(o.e);

        const commonProps = {
            stroke: currentColor,
            strokeWidth: currentStrokeWidth,
            fill: 'transparent',
            selectable: false,
            evented: false
        };

        switch (currentTool) {
            case 'line':
                currentShape = new fabric.Line([startCoords.x, startCoords.y, startCoords.x, startCoords.y], commonProps);
                break;
            case 'rect':
                currentShape = new fabric.Rect({
                    left: startCoords.x,
                    top: startCoords.y,
                    width: 0,
                    height: 0,
                    ...commonProps
                });
                break;
            case 'circle':
                currentShape = new fabric.Circle({
                    left: startCoords.x, // Center X
                    top: startCoords.y,  // Center Y
                    radius: 0,
                    originX: 'center',
                    originY: 'center',
                    ...commonProps
                });
                break;
        }
        if (currentShape) fabricCanvas.add(currentShape);
    });

    fabricCanvas.on('mouse:move', (o) => {
        if (!isDrawingShape || !currentShape || currentTool === 'select' || isPlacingSvgMode) return;

        const pointer = fabricCanvas.getPointer(o.e);

        switch (currentTool) {
            case 'line':
                currentShape.set({ x2: pointer.x, y2: pointer.y });
                break;
            case 'rect':
                const width = pointer.x - startCoords.x;
                const height = pointer.y - startCoords.y;
                currentShape.set({
                    width: Math.abs(width),
                    height: Math.abs(height),
                    left: width > 0 ? startCoords.x : pointer.x,
                    top: height > 0 ? startCoords.y : pointer.y,
                });
                break;
            case 'circle':
                const radius = Math.sqrt(Math.pow(pointer.x - startCoords.x, 2) + Math.pow(pointer.y - startCoords.y, 2));
                currentShape.set({ radius: radius });
                break;
        }
        fabricCanvas.renderAll();
    });

    fabricCanvas.on('mouse:up', (o) => {
        if (isDrawingShape && currentShape) {
            currentShape.set({ selectable: true, evented: true });
            // Remove tiny shapes
            if (currentTool === 'line' && (Math.abs(currentShape.x1 - currentShape.x2) < 3 && Math.abs(currentShape.y1 - currentShape.y2) < 3)) {
                fabricCanvas.remove(currentShape);
            } else if (currentTool === 'rect' && (currentShape.width < 3 || currentShape.height < 3)) {
                fabricCanvas.remove(currentShape);
            } else if (currentTool === 'circle' && currentShape.radius < 2) {
                fabricCanvas.remove(currentShape);
            }
            currentShape = null;
        }
        isDrawingShape = false;
        startCoords = null;

        if (currentTool !== 'select' && !isPlacingSvgMode) {
            // Optionally switch to select tool after drawing
            // setTimeout(() => activateTool('select'), 50);
        }
    });

    loadSvgButton.addEventListener('click', () => {
        if (isPlacingSvgMode) {
            setPlacingSvgMode(false); // Finalize current SVG if any
        }
        loadSvgInput.click();
    });

    loadSvgInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        if (file.type !== "image/svg+xml") {
            alert("Please select an SVG file.");
            loadSvgInput.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const svgString = e.target.result;
            fabric.loadSVGFromString(svgString, (objects, options) => {
                if (!objects || objects.length === 0) {
                    alert("Could not load SVG or SVG is empty/unsupported.");
                    return;
                }
                const group = fabric.util.groupSVGElements(objects, options);
                group.getObjects().forEach(obj => {
                    if (obj.type === 'path' && !obj.stroke) { // Ensure paths have a stroke for visibility
                        obj.set({ stroke: currentColor, strokeWidth: obj.strokeWidth || currentStrokeWidth });
                    } else {
                        if (obj.stroke) obj.set('stroke', obj.stroke); else obj.set('stroke', currentColor);
                        if (obj.strokeWidth) obj.set('strokeWidth', obj.strokeWidth); else obj.set('strokeWidth', currentStrokeWidth);
                    }
                    obj.set('fill', 'transparent'); // Override fills
                });
                setPlacingSvgMode(true, group);
            });
            loadSvgInput.value = '';
        };
        reader.onerror = (e) => {
            console.error("Error reading file:", e);
            alert("Error reading SVG file.");
            loadSvgInput.value = '';
        };
        reader.readAsText(file);
    });

    document.getElementById('clear-canvas').addEventListener('click', () => {
        if (isPlacingSvgMode) {
            setPlacingSvgMode(false); // Clear placement mode
        }
        fabricCanvas.clear();
        fabricCanvas.backgroundColor = '#fff';
        fabricCanvas.renderAll();
    });

    document.getElementById('save-svg').addEventListener('click', () => {
        if (isPlacingSvgMode) {
            setPlacingSvgMode(false); // Finalize placement
        }
        if (currentShape) { // If a shape is being actively drawn, discard it
            fabricCanvas.remove(currentShape);
            currentShape = null;
            isDrawingShape = false;
        }
        const svgData = fabricCanvas.toSVG({ suppressPreamble: true });
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'drawing.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (document.activeElement.tagName === 'INPUT') return; // Don't delete if typing in input

            const activeObjects = fabricCanvas.getActiveObjects(); // Use getActiveObjects for multiselect
            if (activeObjects.length > 0) {
                activeObjects.forEach(obj => fabricCanvas.remove(obj));
                fabricCanvas.discardActiveObject(); // Deselect
                fabricCanvas.renderAll();
            }
        }
    });

    // Initial tool activation
    activateTool('line');
});