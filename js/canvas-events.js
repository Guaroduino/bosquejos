// js/canvas-events.js
import { handleShapeMouseDown, handleShapeMouseMove, handleShapeMouseUp } from './tools/shape-tools.js';
import { handlePolylineMouseDown, handlePolylineMouseMove, finishPolylineDrawing } from './tools/polyline-tool.js';
import { handleSplineMouseDown, handleSplineMouseMove, finishSplineDrawing } from './tools/spline-tool.js';
import { handleTextMouseDown } from './tools/text-tool.js';
// No necesitamos importar closeAllDropdowns aquí si es llamado desde appState.setTool

export function setupCanvasEventHandlers(appState) {
    const fabricCanvas = appState.fabricCanvas;

    fabricCanvas.on('mouse:down', (o) => {
        if (appState.isPanning) return;
        // const pointer = fabricCanvas.getPointer(o.e); // No siempre necesario aquí

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

    fabricCanvas.on('mouse:move', (o) => {
        if (appState.isPanning && o.e.buttons === 1) { 
            fabricCanvas.relativePan(new fabric.Point(o.e.movementX, o.e.movementY)); return; 
        }
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
        if (appState.isPanning) { 
            appState.isPanning = false; 
            fabricCanvas.defaultCursor = (appState.currentTool === 'select') ? 'default' : 'crosshair';
            fabricCanvas.selection = (appState.currentTool === 'select');
        }
        if (appState.currentTool === 'polyline' || appState.currentTool === 'spline') return; 
        if (appState.isDrawing && appState.currentShape) {
            handleShapeMouseUp(o, appState);
        }
        // appState.isDrawing se resetea en handleShapeMouseUp o en las herramientas respectivas
    });

    fabricCanvas.on('mouse:wheel', function(opt) { 
        let z=fabricCanvas.getZoom()*(0.999**opt.e.deltaY); 
        z=Math.max(0.01,Math.min(20,z)); 
        fabricCanvas.zoomToPoint({x:opt.e.offsetX,y:opt.e.offsetY},z); 
        opt.e.preventDefault(); opt.e.stopPropagation(); 
    });

    document.addEventListener('keydown', (e) => {
        const activeEl = document.activeElement;
        const isInputFocused = activeEl && (['input', 'textarea'].includes(activeEl.tagName.toLowerCase()) || activeEl.isContentEditable);

        if (e.key === 'Escape') {
            if (appState.currentTool === 'polyline' && appState.polylinePoints.length > 0) { finishPolylineDrawing(appState); } 
            else if (appState.currentTool === 'spline' && (appState.isDrawingSplineSegment || appState.bezierPathData)) { finishSplineDrawing(appState); } 
            else if (fabricCanvas.getActiveObject()?.isEditing) { fabricCanvas.getActiveObject().exitEditing(); fabricCanvas.renderAll(); } 
            else if (isInputFocused) { activeEl.blur(); }
            appState.closeAllDropdowns();
        }
        if (isInputFocused && e.key !== 'Escape') { if (e.key === 'Enter' && activeEl.tagName !== 'TEXTAREA') activeEl.blur(); return; }
        if (e.key === ' ' && !isInputFocused) { e.preventDefault(); if (!appState.isPanning) { appState.isPanning = true; fabricCanvas.defaultCursor = 'grab'; fabricCanvas.selection = false; fabricCanvas.renderAll(); } }
        
        if (e.key === 'Delete' || e.key === 'Backspace') { 
            if (!fabricCanvas.getActiveObject()?.isEditing) { e.preventDefault(); appState.deleteSelectedObjects(); } 
        }
        if (e.ctrlKey || e.metaKey) { 
            const ao = fabricCanvas.getActiveObject(); // getActiveObject de fabric, no de appState
            if (ao) {
                if (e.key === 'ArrowUp') { e.preventDefault(); if (e.shiftKey) fabricCanvas.bringToFront(ao); else fabricCanvas.bringForward(ao); fabricCanvas.renderAll(); } 
                else if (e.key === 'ArrowDown') { e.preventDefault(); if (e.shiftKey) fabricCanvas.sendToBack(ao); else fabricCanvas.sendBackwards(ao); fabricCanvas.renderAll(); }
            }
            if (e.key.toLowerCase() === 'g' && !e.shiftKey) { e.preventDefault(); document.getElementById('group-objects').click(); } 
            else if (e.key.toLowerCase() === 'g' && e.shiftKey) { e.preventDefault(); document.getElementById('ungroup-objects').click(); }
            else if (e.key === '+') { e.preventDefault(); document.getElementById('zoom-in').click(); } 
            else if (e.key === '-') { e.preventDefault(); document.getElementById('zoom-out').click(); } 
            else if (e.key === '0') { e.preventDefault(); document.getElementById('reset-zoom').click(); }
        } else if (!isInputFocused) { 
             switch(e.key.toLowerCase()){
                case 'v': appState.setTool('select'); break; case 'p': appState.setTool('pencil'); break;
                case 'r': appState.setTool('rect'); break; case 'c': appState.setTool('circle'); break;
                case 'l': appState.setTool('line'); break; case 't': appState.setTool('text'); break;
            }
        }
    });
    document.addEventListener('keyup', (e) => { if (e.key===' ' && appState.isPanning) { appState.isPanning=false; fabricCanvas.defaultCursor=(appState.currentTool==='select')?'default':'crosshair'; fabricCanvas.selection=(appState.currentTool==='select'); fabricCanvas.renderAll(); } });
}