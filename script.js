// Canvas Manager Class
class CanvasManager {
    constructor(canvasId) {
        this.canvas = new fabric.Canvas(canvasId, {
            isDrawingMode: false,
            selection: true,
            backgroundColor: '#fff',
            width: 600,
            height: 400
        });
        this.resizeCanvas = this.resizeCanvas.bind(this);
        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('resize', this.resizeCanvas);
        this.resizeCanvas();
    }

    resizeCanvas() {
        const toolbarHeight = document.querySelector('.toolbar').offsetHeight + 20;
        const newWidth = window.innerWidth * 0.95;
        const newHeight = Math.max(200, (window.innerHeight - toolbarHeight) * 0.95);
        this.canvas.setWidth(newWidth);
        this.canvas.setHeight(newHeight);
        this.canvas.calcOffset();
        this.canvas.renderAll();
    }

    clear() {
        this.canvas.clear();
        this.canvas.backgroundColor = '#fff';
        this.canvas.renderAll();
    }

    saveAsSVG() {
        const svgData = this.canvas.toSVG({ suppressPreamble: true });
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'drawing.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Tool Manager Class
class ToolManager {
    constructor(canvasManager) {
        this.canvas = canvasManager.canvas;
        this.currentTool = 'line';
        this.currentColor = '#000000';
        this.currentStrokeWidth = 2;
        this.isDrawingShape = false;
        this.startCoords = null;
        this.currentShape = null;
        this.brushPoints = [];
        this.brushOptions = {
            size: 16,
            thinning: 0.5,
            smoothing: 0.5,
            streamline: 0.5,
            easing: (t) => t,
            start: {
                taper: true,
                easing: (t) => t * t,
                cap: true
            },
            end: {
                taper: true,
                easing: (t) => t * t,
                cap: true
            }
        };
        this.setupToolButtons();
        this.setupBrushEvents();
    }

    setupToolButtons() {
        const toolButtons = document.querySelectorAll('.tool-button');
        toolButtons.forEach(button => {
            button.addEventListener('click', () => this.activateTool(button.dataset.tool));
        });
    }

    activateTool(toolName) {
        const toolButtons = document.querySelectorAll('.tool-button');
        toolButtons.forEach(btn => btn.classList.remove('active'));
        const activeButton = document.getElementById(`tool-${toolName}`);
        if (activeButton) activeButton.classList.add('active');

        this.currentTool = toolName;
        this.updateCanvasMode();
    }

    updateCanvasMode() {
        if (this.currentTool === 'select') {
            this.canvas.isDrawingMode = false;
            this.canvas.selection = true;
            this.canvas.defaultCursor = 'default';
            this.canvas.hoverCursor = 'move';
            this.canvas.getObjects().forEach(obj => obj.set({ selectable: true, evented: true }));
        } else if (this.currentTool === 'brush') {
            this.canvas.isDrawingMode = false; // Set to false to handle drawing manually
            this.canvas.selection = false;
            this.canvas.defaultCursor = 'crosshair';
            this.canvas.hoverCursor = 'crosshair';
            this.canvas.getObjects().forEach(obj => obj.set({ selectable: false, evented: false }));
        } else {
            this.canvas.isDrawingMode = false;
            this.canvas.selection = false;
            this.canvas.defaultCursor = 'crosshair';
            this.canvas.hoverCursor = 'crosshair';
            this.canvas.getObjects().forEach(obj => obj.set({ selectable: false, evented: false }));
        }
        this.canvas.discardActiveObject().renderAll();
    }

    setupBrushEvents() {
        this.canvas.on('mouse:down', (o) => {
            if (this.currentTool !== 'brush') return;
            
            this.brushPoints = [];
            const pointer = this.canvas.getPointer(o.e);
            this.brushPoints.push([pointer.x, pointer.y, 0.5]); // Add pressure
            
            // Create initial brush stroke
            this.updateBrushStroke();
        });

        this.canvas.on('mouse:move', (o) => {
            if (this.currentTool !== 'brush' || !this.brushPoints.length) return;
            
            const pointer = this.canvas.getPointer(o.e);
            this.brushPoints.push([pointer.x, pointer.y, 0.5]); // Add pressure
            
            // Update brush stroke
            this.updateBrushStroke();
        });

        this.canvas.on('mouse:up', () => {
            if (this.currentTool !== 'brush' || !this.brushPoints.length) return;
            
            // Finalize the brush stroke
            this.finalizeBrushStroke();
        });
    }

    updateBrushStroke() {
        if (this.brushPoints.length < 2) return;

        const stroke = getStroke(this.brushPoints, {
            ...this.brushOptions,
            size: this.currentStrokeWidth * 8,
            color: this.currentColor
        });

        if (this.currentShape) {
            this.canvas.remove(this.currentShape);
        }

        const pathData = this.getSvgPathFromStroke(stroke);
        this.currentShape = new fabric.Path(pathData, {
            fill: this.currentColor,
            selectable: false,
            evented: false
        });

        this.canvas.add(this.currentShape);
        this.canvas.renderAll();
    }

    finalizeBrushStroke() {
        if (this.currentShape) {
            this.currentShape.set({
                selectable: true,
                evented: true
            });
            this.currentShape = null;
        }
        this.brushPoints = [];
    }

    getSvgPathFromStroke(points) {
        if (!points.length) return '';
        
        const d = points.reduce((acc, [x0, y0], i, arr) => {
            const [x1, y1] = arr[(i + 1) % arr.length];
            acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
            return acc;
        }, ['M', ...points[0], 'Q']);

        return d.join(' ');
    }
}

// SVG Manager Class
class SVGManager {
    constructor(canvasManager, toolManager) {
        this.canvas = canvasManager.canvas;
        this.toolManager = toolManager;
        this.isPlacingSvgMode = false;
        this.loadedSvgGroup = null;
        this.setupSVGHandlers();
    }

    setupSVGHandlers() {
        const loadSvgInput = document.getElementById('load-svg-input');
        const loadSvgButton = document.getElementById('load-svg-button');

        loadSvgButton.addEventListener('click', () => {
            if (this.isPlacingSvgMode) {
                this.setPlacingSvgMode(false);
            }
            loadSvgInput.value = ''; // Reset the input value
            loadSvgInput.click();
        });

        loadSvgInput.addEventListener('change', (event) => this.handleSVGFile(event));
    }

    handleSVGFile(event) {
        const file = event.target.files[0];
        if (!file) return;
        if (file.type !== "image/svg+xml") {
            alert("Please select an SVG file.");
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => this.processSVGString(e.target.result);
        reader.onerror = (e) => {
            console.error("Error reading file:", e);
            alert("Error reading SVG file.");
            event.target.value = '';
        };
        reader.readAsText(file);
    }

    processSVGString(svgString) {
        fabric.loadSVGFromString(svgString, (objects, options) => {
            if (!objects || objects.length === 0) {
                alert("Could not load SVG or SVG is empty/unsupported.");
                return;
            }
            const group = fabric.util.groupSVGElements(objects, options);
            this.prepareSVGGroup(group);
            this.setPlacingSvgMode(true, group);
        });
    }

    prepareSVGGroup(group) {
        // If group is a group, get its objects, otherwise treat it as a single object
        const objects = (typeof group.getObjects === 'function') ? group.getObjects() : [group];
        objects.forEach(obj => {
            if (obj.type === 'path' && !obj.stroke) {
                obj.set({ stroke: this.toolManager.currentColor, strokeWidth: this.toolManager.currentStrokeWidth });
            }
            if (!obj.fill) obj.set('fill', 'transparent');
            if (!obj.stroke) obj.set('stroke', this.toolManager.currentColor);
            if (!obj.strokeWidth) obj.set('strokeWidth', this.toolManager.currentStrokeWidth);
        });
    }

    setPlacingSvgMode(active, svgGroup = null) {
        this.isPlacingSvgMode = active;
        this.loadedSvgGroup = svgGroup;
        this.canvas.discardActiveObject();

        if (active && svgGroup) {
            document.body.classList.add('placing-svg-mode');
            this.canvas.add(svgGroup);
            this.canvas.centerObject(svgGroup);
            this.scaleSVGToFit(svgGroup);
            this.canvas.setActiveObject(svgGroup);
            this.canvas.renderAll();
            this.showStatus("SVG loaded. Use handles to resize/rotate, drag to position. Click tool or canvas to finalize.");
            this.toolManager.activateTool('select');
        } else {
            document.body.classList.remove('placing-svg-mode');
            this.showStatus("");
            this.loadedSvgGroup = null;
        }
    }

    scaleSVGToFit(svgGroup) {
        const canvasRatio = this.canvas.width / this.canvas.height;
        const svgRatio = svgGroup.width / svgGroup.height;
        let scaleFactor;
        if (canvasRatio > svgRatio) {
            scaleFactor = (this.canvas.height * 0.5) / svgGroup.height;
        } else {
            scaleFactor = (this.canvas.width * 0.5) / svgGroup.width;
        }
        svgGroup.scale(scaleFactor);
        svgGroup.setCoords();
        this.canvas.centerObject(svgGroup);
    }

    showStatus(message) {
        const statusMessage = document.getElementById('status-message');
        statusMessage.textContent = message;
        statusMessage.style.display = message ? 'block' : 'none';
    }
}

// Main Application Class
class DrawingApp {
    constructor() {
        this.canvasManager = new CanvasManager('drawing-canvas');
        this.toolManager = new ToolManager(this.canvasManager);
        this.svgManager = new SVGManager(this.canvasManager, this.toolManager);
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Color picker
        document.getElementById('color-picker').addEventListener('input', (e) => {
            this.toolManager.currentColor = e.target.value;
            this.updateActiveObjectColor();
        });

        // Stroke width picker
        document.getElementById('stroke-width-picker').addEventListener('input', (e) => {
            this.toolManager.currentStrokeWidth = parseInt(e.target.value, 10) || 1;
            this.updateActiveObjectStrokeWidth();
        });

        // Clear canvas button
        document.getElementById('clear-canvas').addEventListener('click', () => {
            if (this.svgManager.isPlacingSvgMode) {
                this.svgManager.setPlacingSvgMode(false);
            }
            this.canvasManager.clear();
        });

        // Save SVG button
        document.getElementById('save-svg').addEventListener('click', () => {
            if (this.svgManager.isPlacingSvgMode) {
                this.svgManager.setPlacingSvgMode(false);
            }
            if (this.toolManager.currentShape) {
                this.canvasManager.canvas.remove(this.toolManager.currentShape);
                this.toolManager.currentShape = null;
                this.toolManager.isDrawingShape = false;
            }
            this.canvasManager.saveAsSVG();
        });

        // Delete key handler
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (document.activeElement.tagName === 'INPUT') return;
                const activeObjects = this.canvasManager.canvas.getActiveObjects();
                if (activeObjects.length > 0) {
                    activeObjects.forEach(obj => this.canvasManager.canvas.remove(obj));
                    this.canvasManager.canvas.discardActiveObject();
                    this.canvasManager.canvas.renderAll();
                }
            }
        });

        // Canvas mouse events
        this.setupCanvasMouseEvents();
    }

    setupCanvasMouseEvents() {
        const canvas = this.canvasManager.canvas;
        const toolManager = this.toolManager;
        const svgManager = this.svgManager;

        canvas.on('mouse:down', (o) => {
            if (toolManager.currentTool === 'select') {
                if (svgManager.isPlacingSvgMode && o.target !== svgManager.loadedSvgGroup) {
                    svgManager.setPlacingSvgMode(false);
                }
                return;
            }
            if (svgManager.isPlacingSvgMode) return;

            toolManager.isDrawingShape = true;
            toolManager.startCoords = canvas.getPointer(o.e);

            const commonProps = {
                stroke: toolManager.currentColor,
                strokeWidth: toolManager.currentStrokeWidth,
                fill: 'transparent',
                selectable: false,
                evented: false
            };

            switch (toolManager.currentTool) {
                case 'line':
                    toolManager.currentShape = new fabric.Line(
                        [toolManager.startCoords.x, toolManager.startCoords.y, 
                         toolManager.startCoords.x, toolManager.startCoords.y], 
                        commonProps
                    );
                    break;
                case 'rect':
                    toolManager.currentShape = new fabric.Rect({
                        left: toolManager.startCoords.x,
                        top: toolManager.startCoords.y,
                        width: 0,
                        height: 0,
                        ...commonProps
                    });
                    break;
                case 'circle':
                    toolManager.currentShape = new fabric.Circle({
                        left: toolManager.startCoords.x,
                        top: toolManager.startCoords.y,
                        radius: 0,
                        originX: 'center',
                        originY: 'center',
                        ...commonProps
                    });
                    break;
            }
            if (toolManager.currentShape) canvas.add(toolManager.currentShape);
        });

        canvas.on('mouse:move', (o) => {
            if (!toolManager.isDrawingShape || !toolManager.currentShape || 
                toolManager.currentTool === 'select' || svgManager.isPlacingSvgMode) return;

            const pointer = canvas.getPointer(o.e);

            switch (toolManager.currentTool) {
                case 'line':
                    toolManager.currentShape.set({ x2: pointer.x, y2: pointer.y });
                    break;
                case 'rect':
                    const width = pointer.x - toolManager.startCoords.x;
                    const height = pointer.y - toolManager.startCoords.y;
                    toolManager.currentShape.set({
                        width: Math.abs(width),
                        height: Math.abs(height),
                        left: width > 0 ? toolManager.startCoords.x : pointer.x,
                        top: height > 0 ? toolManager.startCoords.y : pointer.y,
                    });
                    break;
                case 'circle':
                    const radius = Math.sqrt(
                        Math.pow(pointer.x - toolManager.startCoords.x, 2) + 
                        Math.pow(pointer.y - toolManager.startCoords.y, 2)
                    );
                    toolManager.currentShape.set({ radius: radius });
                    break;
            }
            canvas.renderAll();
        });

        canvas.on('mouse:up', (o) => {
            if (toolManager.isDrawingShape && toolManager.currentShape) {
                toolManager.currentShape.set({ selectable: true, evented: true });
                
                // Remove tiny shapes
                if (toolManager.currentTool === 'line' && 
                    (Math.abs(toolManager.currentShape.x1 - toolManager.currentShape.x2) < 3 && 
                     Math.abs(toolManager.currentShape.y1 - toolManager.currentShape.y2) < 3)) {
                    canvas.remove(toolManager.currentShape);
                } else if (toolManager.currentTool === 'rect' && 
                         (toolManager.currentShape.width < 3 || toolManager.currentShape.height < 3)) {
                    canvas.remove(toolManager.currentShape);
                } else if (toolManager.currentTool === 'circle' && toolManager.currentShape.radius < 2) {
                    canvas.remove(toolManager.currentShape);
                }
                toolManager.currentShape = null;
            }
            toolManager.isDrawingShape = false;
            toolManager.startCoords = null;
        });
    }

    updateActiveObjectColor() {
        const activeObj = this.canvasManager.canvas.getActiveObject();
        if (activeObj) {
            const applyColor = (obj) => {
                if (obj.stroke || obj.type === 'path') obj.set('stroke', this.toolManager.currentColor);
            };
            if (activeObj.isType('activeSelection')) {
                activeObj.forEachObject(applyColor);
            } else {
                applyColor(activeObj);
            }
            this.canvasManager.canvas.renderAll();
        }
    }

    updateActiveObjectStrokeWidth() {
        const activeObj = this.canvasManager.canvas.getActiveObject();
        if (activeObj) {
            const applyStrokeWidth = (obj) => {
                if (obj.strokeWidth || obj.type === 'path') {
                    obj.set('strokeWidth', this.toolManager.currentStrokeWidth);
                }
            };
            if (activeObj.isType('activeSelection')) {
                activeObj.forEachObject(applyStrokeWidth);
            } else {
                applyStrokeWidth(activeObj);
            }
            this.canvasManager.canvas.renderAll();
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const app = new DrawingApp();
});

// Ensure getStroke is available globally for brush tool
const getStroke = window.perfectFreehand && window.perfectFreehand.getStroke;