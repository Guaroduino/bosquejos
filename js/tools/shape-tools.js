// js/tools/shape-tools.js
export function handleShapeMouseDown(o, appState) {
    const fabricCanvas = appState.fabricCanvas;
    const pointer = fabricCanvas.getPointer(o.e);
    appState.isDrawing = true;
    appState.startX = pointer.x;
    appState.startY = pointer.y;

    const fill = document.getElementById('fill-color').value;
    const stroke = document.getElementById('stroke-color').value;
    const strokeWidth = parseInt(document.getElementById('stroke-width').value, 10);

    switch (appState.currentTool) {
        case 'rect':
            appState.currentShape = new fabric.Rect({
                left: appState.startX, top: appState.startY, width: 0, height: 0,
                fill: fill, stroke: stroke, strokeWidth: strokeWidth,
                originX: 'left', originY: 'top'
            });
            break;
        case 'circle':
            appState.currentShape = new fabric.Circle({
                left: appState.startX, top: appState.startY, radius: 0,
                fill: fill, stroke: stroke, strokeWidth: strokeWidth,
                originX: 'left', originY: 'top' 
            });
            break;
        case 'line':
            appState.currentShape = new fabric.Line(
                [appState.startX, appState.startY, appState.startX, appState.startY],
                { stroke: stroke, strokeWidth: strokeWidth }
            );
            break;
    }
    if (appState.currentShape) {
        fabricCanvas.add(appState.currentShape);
    }
}

export function handleShapeMouseMove(o, appState) {
    if (!appState.isDrawing || !appState.currentShape) return;
    const fabricCanvas = appState.fabricCanvas;
    const pointer = fabricCanvas.getPointer(o.e);

    switch (appState.currentTool) {
        case 'rect':
            appState.currentShape.set({
                width: Math.abs(pointer.x - appState.startX),
                height: Math.abs(pointer.y - appState.startY),
                left: Math.min(pointer.x, appState.startX),
                top: Math.min(pointer.y, appState.startY)
            });
            break;
        case 'circle':
            let w = Math.abs(pointer.x - appState.startX);
            let h = Math.abs(pointer.y - appState.startY);
            let d = Math.min(w, h);
            let r = d / 2;
            appState.currentShape.set({
                left: Math.min(pointer.x, appState.startX) + (w - d) / 2,
                top: Math.min(pointer.y, appState.startY) + (h - d) / 2,
                radius: r
            });
            break;
        case 'line':
            appState.currentShape.set({ x2: pointer.x, y2: pointer.y });
            break;
    }
    fabricCanvas.renderAll();
}

export function handleShapeMouseUp(o, appState) {
    const fabricCanvas = appState.fabricCanvas;
    appState.isDrawing = false; 

    if (!appState.currentShape) return;

    if (appState.currentShape.type === 'rect' && (appState.currentShape.width < 5 || appState.currentShape.height < 5)) {
        fabricCanvas.remove(appState.currentShape);
    } else if (appState.currentShape.type === 'circle' && appState.currentShape.radius < 3) {
        fabricCanvas.remove(appState.currentShape);
    } else if (appState.currentShape.type === 'line' && Math.hypot(appState.currentShape.x2 - appState.currentShape.x1, appState.currentShape.y2 - appState.currentShape.y1) < 5) {
        fabricCanvas.remove(appState.currentShape);
    } else {
        appState.currentShape.setCoords();
        fabricCanvas.setActiveObject(appState.currentShape);
    }
    
    fabricCanvas.renderAll();

    if (['rect', 'circle', 'line'].includes(appState.currentTool)) {
        appState.setTool('select'); 
    }
    appState.currentShape = null; 
}