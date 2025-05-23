// --- Minimal, Modular Fabric.js Drawing App ---

document.addEventListener('DOMContentLoaded', () => {
    // --- Setup ---
    const canvas = new fabric.Canvas('drawing-canvas', {
        isDrawingMode: false,
        selection: true,
        backgroundColor: '#fff',
    });

    // --- Make canvas fill the available screen ---
    function resizeCanvasToFullScreen() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        canvas.setWidth(width);
        canvas.setHeight(height);
        canvas.calcOffset();
        canvas.renderAll();
    }
    window.addEventListener('resize', resizeCanvasToFullScreen);
    resizeCanvasToFullScreen();

    // --- State ---
    let currentTool = 'select';
    let currentColor = '#000000';
    let currentStrokeWidth = 2;
    let drawingShape = null;
    let brushPoints = [];

    // --- Toolbar Elements ---
    const colorPicker = document.getElementById('color-picker');
    const strokeWidthPicker = document.getElementById('stroke-width-picker');
    const loadSvgInput = document.getElementById('load-svg-input');
    const loadSvgButton = document.getElementById('load-svg-button');

    // --- Tool Switching ---
    function activateTool(tool) {
        currentTool = tool;
        canvas.isDrawingMode = false;
        canvas.selection = (tool === 'select');
        canvas.defaultCursor = (tool === 'select') ? 'default' : 'crosshair';
        canvas.getObjects().forEach(obj => obj.set({ selectable: tool === 'select', evented: tool === 'select' }));
        canvas.discardActiveObject().renderAll();
    }
    document.getElementById('tool-select').onclick = () => activateTool('select');
    document.getElementById('tool-line').onclick = () => activateTool('line');
    document.getElementById('tool-rect').onclick = () => activateTool('rect');
    document.getElementById('tool-circle').onclick = () => activateTool('circle');
    document.getElementById('tool-brush').onclick = () => activateTool('brush');
    activateTool('select');

    // --- Color and Stroke Width ---
    colorPicker.oninput = e => currentColor = e.target.value;
    strokeWidthPicker.oninput = e => currentStrokeWidth = parseInt(e.target.value, 10) || 1;

    // --- Drawing Logic ---
    canvas.on('mouse:down', o => {
        if (currentTool === 'select') return;
        const pointer = canvas.getPointer(o.e);
        if (currentTool === 'brush') {
            brushPoints = [[pointer.x, pointer.y, 0.5]];
            drawBrushStroke();
        } else {
            const common = { stroke: currentColor, strokeWidth: currentStrokeWidth, fill: 'transparent', selectable: false, evented: false };
            if (currentTool === 'line') {
                drawingShape = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], common);
            } else if (currentTool === 'rect') {
                drawingShape = new fabric.Rect({ left: pointer.x, top: pointer.y, width: 0, height: 0, ...common });
            } else if (currentTool === 'circle') {
                drawingShape = new fabric.Circle({ left: pointer.x, top: pointer.y, radius: 0, originX: 'center', originY: 'center', ...common });
            }
            if (drawingShape) canvas.add(drawingShape);
        }
    });

    canvas.on('mouse:move', o => {
        if (currentTool === 'brush' && brushPoints.length) {
            const pointer = canvas.getPointer(o.e);
            brushPoints.push([pointer.x, pointer.y, 0.5]);
            drawBrushStroke();
        } else if (drawingShape && (currentTool === 'line' || currentTool === 'rect' || currentTool === 'circle')) {
            const pointer = canvas.getPointer(o.e);
            if (currentTool === 'line') {
                drawingShape.set({ x2: pointer.x, y2: pointer.y });
            } else if (currentTool === 'rect') {
                const width = pointer.x - drawingShape.left;
                const height = pointer.y - drawingShape.top;
                drawingShape.set({ width: Math.abs(width), height: Math.abs(height), left: width > 0 ? drawingShape.left : pointer.x, top: height > 0 ? drawingShape.top : pointer.y });
            } else if (currentTool === 'circle') {
                const radius = Math.sqrt(Math.pow(pointer.x - drawingShape.left, 2) + Math.pow(pointer.y - drawingShape.top, 2));
                drawingShape.set({ radius });
            }
            canvas.renderAll();
        }
    });

    canvas.on('mouse:up', () => {
        if (currentTool === 'brush' && brushPoints.length) {
            finalizeBrushStroke();
        } else if (drawingShape) {
            drawingShape.set({ selectable: true, evented: true });
            drawingShape = null;
        }
    });

    // --- Brush Tool (Perfect Freehand) ---
    function drawBrushStroke() {
        if (brushPoints.length < 2) return;
        if (drawingShape) canvas.remove(drawingShape);
        const stroke = window.getStroke(brushPoints, { size: currentStrokeWidth * 8, thinning: 0.5, smoothing: 0.5, streamline: 0.5 });
        const pathData = getSvgPathFromStroke(stroke);
        drawingShape = new fabric.Path(pathData, { fill: currentColor, selectable: false, evented: false });
        canvas.add(drawingShape);
        canvas.renderAll();
    }
    function finalizeBrushStroke() {
        if (drawingShape) {
            drawingShape.set({ selectable: true, evented: true });
            drawingShape = null;
        }
        brushPoints = [];
    }
    function getSvgPathFromStroke(points) {
        if (!points.length) return '';
        let d = '';
        for (let i = 0; i < points.length; i++) {
            const [x, y] = points[i];
            d += (i === 0 ? 'M' : 'L') + x + ' ' + y + ' ';
        }
        d += 'Z';
        return d;
    }

    // --- SVG Import/Export ---
    document.getElementById('save-svg').onclick = () => {
        const svgData = canvas.toSVG({ suppressPreamble: true });
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'drawing.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    loadSvgButton.onclick = () => { loadSvgInput.value = ''; loadSvgInput.click(); };
    loadSvgInput.onchange = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        if (file.type !== 'image/svg+xml') { alert('Please select an SVG file.'); return; }
        const reader = new FileReader();
        reader.onload = (e) => {
            fabric.loadSVGFromString(e.target.result, (objects, options) => {
                if (!objects || objects.length === 0) { alert('Could not load SVG.'); return; }
                // Always create a group, even if only one object
                const group = new fabric.Group(objects, options);
                group.set({ selectable: true, evented: true });
                canvas.add(group);
                canvas.renderAll();
            });
        };
        reader.readAsText(file);
    };

    // --- Clear Canvas ---
    document.getElementById('clear-canvas').onclick = () => {
        canvas.clear();
        canvas.backgroundColor = '#fff';
        canvas.renderAll();
    };

    // --- Keyboard Delete ---
    window.addEventListener('keydown', (e) => {
        if ((e.key === 'Delete' || e.key === 'Backspace') && document.activeElement.tagName !== 'INPUT') {
            const activeObjects = canvas.getActiveObjects();
            if (activeObjects.length > 0) {
                activeObjects.forEach(obj => canvas.remove(obj));
                canvas.discardActiveObject();
                canvas.renderAll();
            }
        }
    });
});