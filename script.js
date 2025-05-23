document.addEventListener('DOMContentLoaded', () => {
    const canvasElement = document.getElementById('drawingCanvas');
    const pencilBtn = document.getElementById('pencilBtn');
    const eraserBtn = document.getElementById('eraserBtn');
    const colorPicker = document.getElementById('colorPicker');
    const strokeWidthSlider = document.getElementById('strokeWidth');
    const strokeWidthValue = document.getElementById('strokeWidthValue');
    const clearBtn = document.getElementById('clearBtn');
    const saveBtn = document.getElementById('saveBtn');

    // Initialize Fabric.js canvas
    const canvas = new fabric.Canvas(canvasElement, {
        width: window.innerWidth * 0.9,
        height: window.innerHeight * 0.75,
        isDrawingMode: false, // We'll handle drawing manually
        backgroundColor: 'white'
    });

    let currentTool = 'pencil'; // 'pencil' or 'eraser'
    let currentColor = colorPicker.value;
    let currentStrokeWidth = parseInt(strokeWidthSlider.value);
    let isDrawing = false;
    let currentPoints = []; // To store points for perfect-freehand

    // --- Perfect-Freehand Stroke Options ---
    const pfOptions = {
        size: currentStrokeWidth,
        thinning: 0.6,
        smoothing: 0.5,
        streamline: 0.5,
        easing: (t) => t,
        start: {
            taper: 0,
            cap: true
        },
        end: {
            taper: 0,
            cap: true
        },
    };

    // --- Event Listeners for Toolbar ---
    pencilBtn.addEventListener('click', () => {
        currentTool = 'pencil';
        pencilBtn.classList.add('active');
        eraserBtn.classList.remove('active');
    });

    eraserBtn.addEventListener('click', () => {
        currentTool = 'eraser';
        eraserBtn.classList.add('active');
        pencilBtn.classList.remove('active');
    });

    colorPicker.addEventListener('input', (e) => {
        currentColor = e.target.value;
    });

    strokeWidthSlider.addEventListener('input', (e) => {
        currentStrokeWidth = parseInt(e.target.value);
        strokeWidthValue.textContent = currentStrokeWidth;
        pfOptions.size = currentStrokeWidth;
    });

    clearBtn.addEventListener('click', () => {
        canvas.clear();
        canvas.setBackgroundColor('white', canvas.renderAll.bind(canvas));
    });

    saveBtn.addEventListener('click', () => {
        const svgData = canvas.toSVG();
        const a = document.createElement('a');
        a.href = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);
        a.download = 'drawing.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });

    // --- Canvas Mouse Events ---
    canvas.on('mouse:down', (options) => {
        isDrawing = true;
        const pointer = canvas.getPointer(options.e);
        currentPoints = [[pointer.x, pointer.y, options.e.pressure || 0.5]];
    });

    canvas.on('mouse:move', (options) => {
        if (!isDrawing) return;
        const pointer = canvas.getPointer(options.e);
        currentPoints.push([pointer.x, pointer.y, options.e.pressure || 0.5]);
    });

    canvas.on('mouse:up', () => {
        if (!isDrawing || currentPoints.length < 2) {
            isDrawing = false;
            currentPoints = [];
            return;
        }
        isDrawing = false;

        // Use functions from the PerfectFreehand global object
        const strokeOutlinePoints = PerfectFreehand.getStroke(currentPoints, pfOptions);

        // If getStroke returns no points, or very few, it might not be drawable
        if (!strokeOutlinePoints || strokeOutlinePoints.length === 0) {
            currentPoints = [];
            return;
        }

        const pathData = PerfectFreehand.getSvgPathFromStroke(strokeOutlinePoints);

        if (!pathData || pathData.length === 0) {
            currentPoints = [];
            return; // No path data to draw
        }

        const path = new fabric.Path(pathData, {
            // The path from perfect-freehand is an outline. Fill it to get a solid line.
            fill: (currentTool === 'eraser') ? canvas.backgroundColor : currentColor,
            stroke: null, // No stroke for the outline itself
            selectable: false,
            evented: false,
        });

        canvas.add(path);
        canvas.renderAll();
        currentPoints = [];
    });

    // The local getSvgPathFromStroke function is no longer needed
    // as PerfectFreehand.getSvgPathFromStroke is used.

    // Initial UI update
    strokeWidthValue.textContent = currentStrokeWidth;
    pencilBtn.classList.add('active');

    window.addEventListener('resize', () => {
        canvas.setWidth(window.innerWidth * 0.9);
        canvas.setHeight(window.innerHeight * 0.75);
        canvas.renderAll();
    });
});