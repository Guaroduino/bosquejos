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
    // (getStroke is globally available from the perfect-freehand script)
    const pfOptions = {
        size: currentStrokeWidth,
        thinning: 0.6, // How much the line thins when pressure is light
        smoothing: 0.5, // How much to smooth the stroke
        streamline: 0.5, // How much to streamline the stroke
        easing: (t) => t, // Linear easing
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
        pfOptions.size = currentStrokeWidth; // Update perfect-freehand option
    });

    clearBtn.addEventListener('click', () => {
        canvas.clear();
        // Re-set background color if clearing also removes it
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
        currentPoints = [[pointer.x, pointer.y, options.e.pressure || 0.5]]; // Start with one point
    });

    canvas.on('mouse:move', (options) => {
        if (!isDrawing) return;
        const pointer = canvas.getPointer(options.e);
        currentPoints.push([pointer.x, pointer.y, options.e.pressure || 0.5]);

        // Optional: Draw a temporary path for better UX while moving
        // For simplicity, we'll only draw the final path on mouse:up
    });

    canvas.on('mouse:up', () => {
        if (!isDrawing || currentPoints.length < 2) {
            isDrawing = false;
            currentPoints = [];
            return;
        }
        isDrawing = false;

        const stroke = getStroke(currentPoints, pfOptions);
        const pathData = getSvgPathFromStroke(stroke);

        const path = new fabric.Path(pathData, {
            fill: null, // No fill for strokes
            stroke: (currentTool === 'eraser') ? canvas.backgroundColor : currentColor,
            strokeWidth: 1, // perfect-freehand handles the width via the path shape
            strokeLineCap: 'round',
            strokeLineJoin: 'round',
            selectable: false, // Make paths non-selectable
            evented: false,    // Make paths non-evented
        });

        canvas.add(path);
        canvas.renderAll();
        currentPoints = [];
    });

    // Helper function (from perfect-freehand docs) to convert points to SVG path data
    function getSvgPathFromStroke(stroke) {
        if (!stroke.length) return '';

        const d = stroke.reduce(
            (acc, [x0, y0], i, arr) => {
                const [x1, y1] = arr[(i + 1) % arr.length];
                acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
                return acc;
            },
            ['M', ...stroke[0], 'Q']
        );

        d.push('Z');
        return d.join(' ');
    }

    // Initial UI update
    strokeWidthValue.textContent = currentStrokeWidth;
    pencilBtn.classList.add('active'); // Default to pencil

    // Adjust canvas size on window resize (basic)
    window.addEventListener('resize', () => {
        canvas.setWidth(window.innerWidth * 0.9);
        canvas.setHeight(window.innerHeight * 0.75);
        canvas.renderAll();
    });
});