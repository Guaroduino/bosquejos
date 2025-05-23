// js/canvas-events.js
import { handleShapeMouseDown, handleShapeMouseMove, handleShapeMouseUp } from './tools/shape-tools.js';
import { handlePolylineMouseDown, handlePolylineMouseMove, finishPolylineDrawing } from './tools/polyline-tool.js';
import { handleSplineMouseDown, handleSplineMouseMove, finishSplineDrawing } from './tools/spline-tool.js';
import { handleTextMouseDown } from './tools/text-tool.js';
import { CanvasRulers } from './rulers.js';

// Función auxiliar para determinar si la herramienta actual es de dibujo
function isDrawingTool(tool) {
    return ['rect', 'circle', 'line', 'polyline', 'spline', 'text', 'pencil'].includes(tool);
}

export function setupCanvasEventHandlers(appState) {
    const fabricCanvas = appState.fabricCanvas;
    let lastClientX, lastClientY; // Para el paneo con botón central

    // Inicializar las reglas
    const rulers = new CanvasRulers(fabricCanvas);

    // Función para actualizar la configuración de selección según la herramienta
    function updateSelectionSettings() {
        const isDrawing = isDrawingTool(appState.currentTool);
        fabricCanvas.selection = !isDrawing;
        fabricCanvas.defaultCursor = isDrawing ? 'crosshair' : 'default';
        
        // Desactivar la selección de objetos existentes si estamos en modo dibujo
        if (isDrawing) {
            const activeObject = fabricCanvas.getActiveObject();
            if (activeObject) {
                fabricCanvas.discardActiveObject();
                fabricCanvas.requestRenderAll();
            }
        }
    }

    fabricCanvas.on('mouse:down', (o) => {
        const event = o.e;
        // --- Paneo con Botón Central (Rueda) ---
        if (event.button === 1) { // 1 es el botón central del ratón
            appState.isMiddleMouseButtonPanning = true;
            lastClientX = event.clientX;
            lastClientY = event.clientY;
            fabricCanvas.defaultCursor = 'grabbing';
            fabricCanvas.selection = false;
            fabricCanvas.renderAll();
            event.preventDefault();
            // Escuchar paneo globalmente
            window.addEventListener('mousemove', handleGlobalPanMove);
            window.addEventListener('mouseup', handleGlobalPanUp);
            return;
        }

        if (appState.isPanningWithSpacebar) return; // Si ya estamos paneando con barra espaciadora

        // Si estamos en modo dibujo, no permitir selección
        if (isDrawingTool(appState.currentTool)) {
            fabricCanvas.selection = false;
        }

        switch (appState.currentTool) {
            case 'rect': case 'circle': case 'line':
                handleShapeMouseDown(o, appState); break;
            case 'polyline':
                handlePolylineMouseDown(o, appState); break;
            case 'spline':
                handleSplineMouseDown(o, appState); break;
            case 'text':
                handleTextMouseDown(o, appState); break;
        }
    });

    function handleGlobalPanMove(e) {
        if (appState.isMiddleMouseButtonPanning) {
            const deltaX = e.clientX - lastClientX;
            const deltaY = e.clientY - lastClientY;
            lastClientX = e.clientX;
            lastClientY = e.clientY;
            fabricCanvas.relativePan(new fabric.Point(deltaX, deltaY));
            rulers.updateRulers();
            e.preventDefault();
        }
    }
    function handleGlobalPanUp(e) {
        if (e.button === 1 && appState.isMiddleMouseButtonPanning) {
            appState.isMiddleMouseButtonPanning = false;
            fabricCanvas.defaultCursor = isDrawingTool(appState.currentTool) ? 'crosshair' : 'default';
            window.removeEventListener('mousemove', handleGlobalPanMove);
            window.removeEventListener('mouseup', handleGlobalPanUp);
        }
    }

    fabricCanvas.on('mouse:move', (o) => {
        const event = o.e;
        // --- Paneo con Botón Central (Rueda) ---
        if (appState.isMiddleMouseButtonPanning) {
            const deltaX = event.clientX - lastClientX;
            const deltaY = event.clientY - lastClientY;
            lastClientX = event.clientX;
            lastClientY = event.clientY;

            fabricCanvas.relativePan(new fabric.Point(deltaX, deltaY));
            rulers.updateRulers(); // Actualizar reglas después del paneo
            return;
        }

        // --- Paneo con Barra Espaciadora ---
        if (appState.isPanningWithSpacebar && event.buttons === 1) { // event.buttons === 1 es clic izquierdo
            fabricCanvas.relativePan(new fabric.Point(event.movementX, event.movementY)); 
            return; 
        }

        // --- Lógica de herramientas ---
        switch (appState.currentTool) {
            case 'rect': case 'circle': case 'line':
                handleShapeMouseMove(o, appState); break;
            case 'polyline':
                handlePolylineMouseMove(o, appState); break;
            case 'spline':
                handleSplineMouseMove(o, appState); break;
        }
    });

    fabricCanvas.on('mouse:up', (o) => {
        const event = o.e;
        // --- Paneo con Botón Central (Rueda) ---
        if (event.button === 1 && appState.isMiddleMouseButtonPanning) {
            appState.isMiddleMouseButtonPanning = false;
            updateSelectionSettings();
            return; // No procesar otras lógicas de mouse:up
        }
        
        // --- Paneo con Barra Espaciadora ---
        if (appState.isPanningWithSpacebar) { // Se maneja en keyup
            // appState.isPanningWithSpacebar = false; // Esto se resetea en keyup
            // Restaurar cursor y selección
            // ... (lógica similar a la de arriba, pero se hace en keyup)
        }

        if (appState.currentTool === 'polyline' || appState.currentTool === 'spline') return; 
        if (appState.isDrawing && appState.currentShape) {
            handleShapeMouseUp(o, appState);
        }
        // appState.isDrawing se resetea en handleShapeMouseUp o en las herramientas respectivas
    });

    fabricCanvas.on('mouse:wheel', function(opt) { 
        let z = fabricCanvas.getZoom() * (0.999 ** opt.e.deltaY); 
        z = Math.max(0.01, Math.min(20, z)); 
        fabricCanvas.zoomToPoint({x: opt.e.offsetX, y: opt.e.offsetY}, z); 
        rulers.updateRulers(); // Actualizar reglas después del zoom
        opt.e.preventDefault(); 
        opt.e.stopPropagation(); 
    });

    const canvasContainer = fabricCanvas.wrapperEl; 
    canvasContainer.addEventListener('dragover', (event) => { /* ... dragover ... */ });
    canvasContainer.addEventListener('dragleave', () => { /* ... dragleave ... */ });
    canvasContainer.addEventListener('drop', (event) => { /* ... drop ... */ });


    document.addEventListener('keydown', (e) => {
        const activeEl = document.activeElement;
        const isInputFocused = activeEl && (['input', 'textarea'].includes(activeEl.tagName.toLowerCase()) || activeEl.isContentEditable);

        if (e.key === 'Escape') {
            if (appState.currentTool === 'polyline' && appState.polylinePoints.length > 0) { finishPolylineDrawing(appState); } 
            else if (appState.currentTool === 'spline' && (appState.isDrawingSplineSegment || appState.bezierPathData)) { finishSplineDrawing(appState); } 
            else if (fabricCanvas.getActiveObject()?.isEditing) { fabricCanvas.getActiveObject().exitEditing(); fabricCanvas.renderAll(); } 
            else if (isInputFocused) { activeEl.blur(); }
            if (typeof appState.closeAllDropdowns === 'function') appState.closeAllDropdowns();
        }
        if (isInputFocused && e.key !== 'Escape') { if (e.key === 'Enter' && activeEl.tagName !== 'TEXTAREA') activeEl.blur(); return; }
        
        // --- Paneo con Barra Espaciadora (Inicio) ---
        if (e.key === ' ' && !isInputFocused && !appState.isPanningWithSpacebar && !appState.isMiddleMouseButtonPanning) { 
            e.preventDefault(); 
            appState.isPanningWithSpacebar = true; 
            fabricCanvas.defaultCursor = 'grab'; 
            fabricCanvas.selection = false; 
            fabricCanvas.renderAll(); 
        }
        
        if (e.key === 'Delete' || e.key === 'Backspace') { 
            if (!fabricCanvas.getActiveObject()?.isEditing) { e.preventDefault(); if (typeof appState.deleteSelectedObjects === 'function') appState.deleteSelectedObjects(); } 
        }
        if (e.ctrlKey || e.metaKey) { /* ... atajos Ctrl ... */ } 
        else if (!isInputFocused) { /* ... atajos de una tecla ... */ }
    });

    document.addEventListener('keyup', (e) => { 
        // --- Paneo con Barra Espaciadora (Fin) ---
        if (e.key===' ' && appState.isPanningWithSpacebar) { 
            appState.isPanningWithSpacebar=false; 
            updateSelectionSettings(); 
        } 
    });

    // Inicializar la configuración de selección
    updateSelectionSettings();
}