// js/main.js
import { initializeFabricCanvas } from './fabric-config.js';
import { setupUIEventListeners, setActiveToolState, updateActiveToolIndicatorInUI, closeAllDropdownsFromUI } from './ui-interactions.js';
import { setupCanvasEventHandlers } from './canvas-events.js';
import { setupFileHandlers, applyStyleToSelectedObjects } from './file-manager.js';
import { setupObjectManagement, deleteSelectedObjectsFromManager } from './object-manager.js';
import { setupViewControls, resetZoomAndPanView } from './view-manager.js';

document.addEventListener('DOMContentLoaded', () => {
    const fabricCanvas = initializeFabricCanvas('editor-canvas');

    // Captura el botón central del mouse y previene el autoscroll del navegador
    const htmlCanvas = document.getElementById('editor-canvas');
    htmlCanvas.addEventListener('mousedown', (e) => {
        if (e.button === 1) {
            e.preventDefault();
        }
    });

    const appState = {
        currentTool: 'select',
        isDrawing: false, 
        startX: 0, startY: 0,
        currentShape: null, 
        isPanningWithSpacebar: false, // Renombrado para claridad
        isMiddleMouseButtonPanning: false, // NUEVO para el paneo con botón central
        
        polylinePoints: [], tempPolyline: null,
        bezierPathData: '', bezierCurrentSegmentPoints: [], bezierLastP1: null,        
        isDrawingSplineSegment: false, tempSplinePathObject: null, tempSplineGuideLine: null,

        fabricCanvas: fabricCanvas,
        
        setTool: (tool) => {
            // Limpieza de herramientas anteriores
            if (appState.currentTool === 'polyline' && tool !== 'polyline') {
                if (appState.tempPolyline) appState.fabricCanvas.remove(appState.tempPolyline); appState.tempPolyline = null;
                appState.polylinePoints = [];
            }
            if (appState.currentTool === 'spline' && tool !== 'spline') {
                if (appState.tempSplinePathObject) appState.fabricCanvas.remove(appState.tempSplinePathObject); appState.tempSplinePathObject = null;
                if (appState.tempSplineGuideLine) appState.fabricCanvas.remove(appState.tempSplineGuideLine); appState.tempSplineGuideLine = null;
                appState.bezierPathData = ''; appState.bezierCurrentSegmentPoints = []; appState.bezierLastP1 = null; appState.isDrawingSplineSegment = false;
            }

            appState.currentTool = tool;
            setActiveToolState(tool, appState); 
        },
        getActiveTool: () => appState.currentTool,
        updateActiveToolIndicator: updateActiveToolIndicatorInUI, 
        closeAllDropdowns: closeAllDropdownsFromUI, 
        applyStyleToSelected: (property, value, isTextProperty = false) => {
            applyStyleToSelectedObjects(property, value, appState, isTextProperty);
        },
        deleteSelectedObjects: () => deleteSelectedObjectsFromManager(appState),
        resetZoomAndPan: () => resetZoomAndPanView(appState)
    };

    setupUIEventListeners(appState);
    setupCanvasEventHandlers(appState); // Aquí se pasarán los nuevos estados
    setupFileHandlers(appState);
    setupObjectManagement(appState);
    setupViewControls(appState);

    const initialWidth = parseInt(document.getElementById('canvas-width-input').value, 10) || 800;
    const initialHeight = parseInt(document.getElementById('canvas-height-input').value, 10) || 600;
    fabricCanvas.setWidth(initialWidth);
    fabricCanvas.setHeight(initialHeight);
    fabricCanvas.calcOffset();
    appState.resetZoomAndPan();

    appState.setTool('select');

    // Paneo manual con botón central del mouse sobre el canvas HTML
    let isManualMiddlePanning = false;
    let lastPanX = 0, lastPanY = 0;
    htmlCanvas.addEventListener('mousedown', (e) => {
        if (e.button === 1 && !['rect','circle','line','polyline','spline','text','pencil'].includes(appState.currentTool)) {
            isManualMiddlePanning = true;
            lastPanX = e.clientX;
            lastPanY = e.clientY;
            htmlCanvas.style.cursor = 'grabbing';
            e.preventDefault();
        }
    });
    window.addEventListener('mousemove', (e) => {
        if (isManualMiddlePanning) {
            const deltaX = e.clientX - lastPanX;
            const deltaY = e.clientY - lastPanY;
            lastPanX = e.clientX;
            lastPanY = e.clientY;
            fabricCanvas.relativePan(new fabric.Point(deltaX, deltaY));
            fabricCanvas.requestRenderAll();
        }
    });
    window.addEventListener('mouseup', (e) => {
        if (e.button === 1 && isManualMiddlePanning) {
            isManualMiddlePanning = false;
            htmlCanvas.style.cursor = '';
        }
    });

    console.log('Editor SVG Modular v4 con Fabric.js inicializado.');
});