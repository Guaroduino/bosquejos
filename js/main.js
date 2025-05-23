// js/main.js
import { initializeFabricCanvas } from './fabric-config.js';
import { setupUIEventListeners, setActiveToolState, updateActiveToolIndicatorInUI, closeAllDropdownsFromUI } from './ui-interactions.js';
import { setupCanvasEventHandlers } from './canvas-events.js';
import { setupFileHandlers, applyStyleToSelectedObjects } from './file-manager.js';
import { setupObjectManagement, deleteSelectedObjectsFromManager } from './object-manager.js';
import { setupViewControls, resetZoomAndPanView } from './view-manager.js';

document.addEventListener('DOMContentLoaded', () => {
    const fabricCanvas = initializeFabricCanvas('editor-canvas');

    const appState = {
        currentTool: 'select',
        isDrawing: false, // Para herramientas de arrastre simple (rect, circle, line)
        startX: 0, startY: 0,
        currentShape: null, // Para rect, circle, line
        isPanning: false,
        
        // Polilínea
        polylinePoints: [],
        tempPolyline: null,
        // tempLine es usado por polyline y spline para la guía al cursor
        
        // Spline (Curva Bézier)
        bezierPathData: '',      
        bezierCurrentSegmentPoints: [], 
        bezierLastP1: null,        
        isDrawingSplineSegment: false, 
        tempSplinePathObject: null, 
        tempSplineGuideLine: null, // Renombrado desde tempLine para claridad

        fabricCanvas: fabricCanvas,
        
        setTool: (tool) => {
            // Limpieza de herramientas anteriores
            if (appState.currentTool === 'polyline' && tool !== 'polyline') {
                if (appState.tempPolyline) appState.fabricCanvas.remove(appState.tempPolyline); appState.tempPolyline = null;
                // tempLine (guía al cursor) se limpia en la herramienta respectiva al cambiar
                appState.polylinePoints = [];
            }
            if (appState.currentTool === 'spline' && tool !== 'spline') {
                if (appState.tempSplinePathObject) appState.fabricCanvas.remove(appState.tempSplinePathObject); appState.tempSplinePathObject = null;
                if (appState.tempSplineGuideLine) appState.fabricCanvas.remove(appState.tempSplineGuideLine); appState.tempSplineGuideLine = null;
                appState.bezierPathData = ''; appState.bezierCurrentSegmentPoints = []; appState.bezierLastP1 = null; appState.isDrawingSplineSegment = false;
            }

            appState.currentTool = tool;
            setActiveToolState(tool, appState); // Llama a la función de ui-interactions
        },
        getActiveTool: () => appState.currentTool,
        updateActiveToolIndicator: updateActiveToolIndicatorInUI, // Referencia a la función de UI
        closeAllDropdowns: closeAllDropdownsFromUI, // Referencia a la función de UI
        applyStyleToSelected: (property, value, isTextProperty = false) => {
            applyStyleToSelectedObjects(property, value, appState, isTextProperty);
        },
        deleteSelectedObjects: () => deleteSelectedObjectsFromManager(appState),
        resetZoomAndPan: () => resetZoomAndPanView(appState)
    };

    setupUIEventListeners(appState);
    setupCanvasEventHandlers(appState);
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

    console.log('Editor SVG Modular con Fabric.js inicializado.');
});