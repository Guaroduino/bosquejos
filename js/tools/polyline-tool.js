// js/tools/polyline-tool.js
export function handlePolylineMouseDown(o, appState) {
    const fabricCanvas = appState.fabricCanvas;
    const pointer = fabricCanvas.getPointer(o.e);
    
    if (o.e.detail === 2 && appState.polylinePoints.length > 1) {
        finishPolylineDrawing(appState);
        return;
    }
    appState.polylinePoints.push({ x: pointer.x, y: pointer.y });
    drawTempPolylineGuide(pointer, appState); // Mostrar guía desde el primer clic
}

export function handlePolylineMouseMove(o, appState) {
    if (appState.polylinePoints.length > 0) {
        const pointer = appState.fabricCanvas.getPointer(o.e);
        drawTempPolylineGuide(pointer, appState);
    }
}

function drawTempPolylineGuide(currentMousePos, appState) {
    const fabricCanvas = appState.fabricCanvas;
    if (appState.tempPolyline) fabricCanvas.remove(appState.tempPolyline);
    appState.tempPolyline = null;

    if (appState.polylinePoints.length > 0) {
        const previewPoints = [...appState.polylinePoints];
        if (currentMousePos) { // Solo añadir el punto del cursor si se está moviendo
            previewPoints.push(currentMousePos);
        }
        
        if (previewPoints.length > 1) {
            appState.tempPolyline = new fabric.Polyline(previewPoints, { 
                fill: 'transparent', 
                stroke: 'rgba(0,0,0,0.5)', 
                strokeWidth: parseInt(document.getElementById('stroke-width').value,10), 
                selectable: false, evented: false, objectCaching: false 
            });
            fabricCanvas.add(appState.tempPolyline);
        }
    }
    fabricCanvas.renderAll();
}

export function finishPolylineDrawing(appState) {
    const fabricCanvas = appState.fabricCanvas;
    if (appState.tempPolyline) fabricCanvas.remove(appState.tempPolyline);
    appState.tempPolyline = null;
    
    if (appState.polylinePoints.length < 2) {
        appState.polylinePoints = [];
        appState.setTool('select');
        fabricCanvas.renderAll();
        return;
    }

    const finalPolyline = new fabric.Polyline(appState.polylinePoints, {
        fill: 'transparent', 
        stroke: document.getElementById('stroke-color').value,
        strokeWidth: parseInt(document.getElementById('stroke-width').value, 10),
        selectable: true,
        objectCaching: false
    });
    fabricCanvas.add(finalPolyline).setActiveObject(finalPolyline);
    fabricCanvas.renderAll();

    appState.polylinePoints = [];
    appState.setTool('select');
}