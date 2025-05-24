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

    // Inicializar las reglas
    // Asegúrate de que CanvasRulers esté definido y funcione correctamente.
    // Si CanvasRulers no es esencial para el paneo, puedes comentarlo temporalmente para aislar problemas.
    let rulers = null;
    try {
        rulers = new CanvasRulers(fabricCanvas);
    } catch (e) {
        console.error("Error initializing CanvasRulers:", e);
        // Continuar sin reglas si fallan, para no bloquear el resto.
    }


    // Función para actualizar la configuración de selección según la herramienta
    // Esta función es útil, pero la lógica de paneo anulará temporalmente estos ajustes.
    function updateSelectionSettings() {
        const isDrawing = isDrawingTool(appState.currentTool);
        fabricCanvas.selection = !isDrawing;
        fabricCanvas.defaultCursor = isDrawing ? 'crosshair' : 'default';
        
        if (isDrawing) {
            const activeObject = fabricCanvas.getActiveObject();
            if (activeObject) {
                fabricCanvas.discardActiveObject();
                fabricCanvas.requestRenderAll();
            }
        }
    }

    let isPanning = false; // Verdadero si el mouse está presionado Y se está paneando
    let lastClientX, lastClientY;
    let spacebarDown = false; // Verdadero si la tecla espaciadora está presionada
    let activePanType = null; // 'spacebar' o 'middle' durante un paneo activo con el mouse

    fabricCanvas.on('mouse:down', (o) => {
        const event = o.e;

        // Paneo con botón central del mouse
        if (event.button === 1 && !isDrawingTool(appState.currentTool)) {
            isPanning = true;
            activePanType = 'middle';
            lastClientX = event.clientX;
            lastClientY = event.clientY;
            fabricCanvas.defaultCursor = 'grabbing';
            fabricCanvas.selection = false; // Desactivar selección durante el paneo
            event.preventDefault();
            fabricCanvas.requestRenderAll(); // Actualizar cursor inmediatamente
            return;
        }

        // Paneo con barra espaciadora + botón izquierdo del mouse
        if (event.button === 0 && spacebarDown && !isDrawingTool(appState.currentTool)) {
            isPanning = true;
            activePanType = 'spacebar';
            lastClientX = event.clientX;
            lastClientY = event.clientY;
            fabricCanvas.defaultCursor = 'grabbing';
            // fabricCanvas.selection ya debería ser false por el evento keydown de la barra espaciadora
            event.preventDefault();
            fabricCanvas.requestRenderAll(); // Actualizar cursor inmediatamente
            return;
        }

        // Lógica de herramientas de dibujo (si no se está paneando)
        if (isDrawingTool(appState.currentTool)) {
            fabricCanvas.selection = false; // Asegurar que la selección esté desactivada para dibujar
            // (Manejo específico de herramientas)
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
        } else {
            // Si no es una herramienta de dibujo y no se inició un paneo,
            // la selección debería estar activa para la herramienta 'select'.
            // setActiveToolState se encarga de esto al cambiar de herramienta.
        }
    });

    fabricCanvas.on('mouse:move', (o) => {
        const event = o.e;
        if (isPanning) { // Solo si el paneo está activo (mouse presionado en modo paneo)
            const deltaX = event.clientX - lastClientX;
            const deltaY = event.clientY - lastClientY;
            lastClientX = event.clientX;
            lastClientY = event.clientY;
            fabricCanvas.relativePan(new fabric.Point(deltaX, deltaY));
            if (rulers) {
                rulers.updateRulers(); // Actualizar reglas si existen
            }
            event.preventDefault();
            return;
        }
        // --- Lógica de herramientas (mousemove) ---
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
        // Si se estaba paneando (isPanning era true)
        if (isPanning) {
            // Y el botón que se suelta es el que inició el paneo
            if ((activePanType === 'middle' && event.button === 1) ||
                (activePanType === 'spacebar' && event.button === 0)) {

                isPanning = false;
                activePanType = null; // Limpiar el tipo de paneo activo

                // Si la barra espaciadora NO está presionada, restaurar cursor/selección normales.
                // Si la barra espaciadora SÍ está presionada, mantener cursor 'grab' para posible re-paneo.
                if (!spacebarDown) {
                    fabricCanvas.defaultCursor = isDrawingTool(appState.currentTool) ? 'crosshair' : 'default';
                    if (!isDrawingTool(appState.currentTool)) {
                        fabricCanvas.selection = true;
                    }
                } else {
                    // La barra espaciadora sigue presionada, mantener cursor de paneo
                    fabricCanvas.defaultCursor = 'grab';
                    fabricCanvas.selection = false; // Mantener selección desactivada
                }
                event.preventDefault();
                fabricCanvas.requestRenderAll();
                return;
            }
        }

        // --- Lógica de herramientas (mouseup) ---
        // Evitar que se completen formas si era un paneo con polyline/spline
        if (appState.currentTool === 'polyline' && appState.tempPolyline) {
             // No llamar a finishPolylineDrawing aquí si solo fue un paneo
             // La lógica de polyline/spline debe manejar si se añade un punto o se finaliza.
        } else if (appState.currentTool === 'spline' && appState.isDrawingSplineSegment) {
            // Similar para spline
        } else if (appState.isDrawing && appState.currentShape) {
            handleShapeMouseUp(o, appState);
        }
        // appState.isDrawing se resetea en handleShapeMouseUp o en las herramientas respectivas
    });

    fabricCanvas.on('mouse:wheel', function(opt) { 
        let z = fabricCanvas.getZoom() * (0.999 ** opt.e.deltaY); 
        z = Math.max(0.01, Math.min(20, z)); 
        fabricCanvas.zoomToPoint({x: opt.e.offsetX, y: opt.e.offsetY}, z); 
        if (rulers) {
            rulers.updateRulers(); // Actualizar reglas después del zoom
        }
        opt.e.preventDefault(); 
        opt.e.stopPropagation(); 
    });

    // Eventos de drag & drop de archivos (si los tienes)
    // const canvasContainer = fabricCanvas.wrapperEl; 
    // canvasContainer.addEventListener('dragover', (event) => { /* ... */ });
    // canvasContainer.addEventListener('dragleave', () => { /* ... */ });
    // canvasContainer.addEventListener('drop', (event) => { /* ... */ });


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
        
        // Si un input tiene el foco, no procesar atajos de teclado (excepto Escape y Enter para desenfocar)
        if (isInputFocused && e.key !== 'Escape') { 
            if (e.key === 'Enter' && activeEl.tagName !== 'TEXTAREA') activeEl.blur(); 
            return; 
        }
        
        // Activar modo paneo con barra espaciadora
        if (e.key === ' ' && !spacebarDown && !isInputFocused) { // !spacebarDown para evitar re-trigger
            e.preventDefault();
            spacebarDown = true;
            if (!isPanning) { // Solo cambiar cursor si no se está ya paneando con el mouse
                fabricCanvas.defaultCursor = 'grab';
                fabricCanvas.selection = false; // Desactivar selección
                fabricCanvas.renderAll();
            }
        }
        
        if (e.key === 'Delete' || e.key === 'Backspace') { 
            if (!fabricCanvas.getActiveObject()?.isEditing) { 
                e.preventDefault(); 
                if (typeof appState.deleteSelectedObjects === 'function') appState.deleteSelectedObjects(); 
            } 
        }
        // Otros atajos (Ctrl, etc.)
        // if (e.ctrlKey || e.metaKey) { /* ... */ } 
        // else if (!isInputFocused) { /* ... */ }
    });

    document.addEventListener('keyup', (e) => { 
        if (e.key === ' ') {
            // e.preventDefault(); // Opcional: prevenir comportamiento por defecto de space en keyup si es necesario
            spacebarDown = false;
            if (!isPanning) { // Si no se está paneando activamente con el mouse
                fabricCanvas.defaultCursor = isDrawingTool(appState.currentTool) ? 'crosshair' : 'default';
                if (!isDrawingTool(appState.currentTool)) {
                    fabricCanvas.selection = true; // Reactivar selección si corresponde
                }
                fabricCanvas.renderAll();
            }
            // Si isPanning es true, mouse:up se encargará de restaurar el cursor/selección.
        }
    });

    // Inicializar la configuración de selección según la herramienta actual (al cargar)
    updateSelectionSettings();
}
