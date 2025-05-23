// js/tools/spline-tool.js
export function handleSplineMouseDown(o, appState) {
    const fabricCanvas = appState.fabricCanvas;
    const pointer = fabricCanvas.getPointer(o.e);

    if (o.e.detail === 2 && (appState.bezierPathData || appState.bezierCurrentSegmentPoints.length > 0)) {
        finishSplineDrawing(appState);
        return;
    }

    if (!appState.isDrawingSplineSegment) { 
        if (!appState.bezierLastP1) { 
            appState.bezierLastP1 = { x: pointer.x, y: pointer.y };
            appState.bezierPathData = `M ${appState.bezierLastP1.x} ${appState.bezierLastP1.y}`;
        }
        appState.isDrawingSplineSegment = true;
        appState.bezierCurrentSegmentPoints = []; 
        appState.bezierCurrentSegmentPoints.push({ x: pointer.x, y: pointer.y }); // C1
    } else { 
        appState.bezierCurrentSegmentPoints.push({ x: pointer.x, y: pointer.y }); // C2 o P1
    }

    if (appState.bezierCurrentSegmentPoints.length === 3) { 
        // const p0 = appState.bezierLastP1; // No se usa directamente aquí
        const c1 = appState.bezierCurrentSegmentPoints[0];
        const c2 = appState.bezierCurrentSegmentPoints[1];
        const p1 = appState.bezierCurrentSegmentPoints[2];

        appState.bezierPathData += ` C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p1.x} ${p1.y}`;
        appState.bezierLastP1 = p1; 
        
        appState.bezierCurrentSegmentPoints = []; 
        
        if (appState.tempSplinePathObject) fabricCanvas.remove(appState.tempSplinePathObject);
        appState.tempSplinePathObject = new fabric.Path(appState.bezierPathData, {
            fill: 'transparent', stroke: document.getElementById('stroke-color').value,
            strokeWidth: parseInt(document.getElementById('stroke-width').value,10),
            selectable: false, evented: false, objectCaching: false,
        });
        fabricCanvas.add(appState.tempSplinePathObject);
    }
    drawTempSplineGuideAndPath(pointer, appState); 
}

export function handleSplineMouseMove(o, appState) {
    if (appState.isDrawingSplineSegment) {
        const pointer = appState.fabricCanvas.getPointer(o.e);
        drawTempSplineGuideAndPath(pointer, appState);
    }
}

function drawTempSplineGuideAndPath(currentMousePos, appState) {
    const fabricCanvas = appState.fabricCanvas;
    if (appState.tempSplineGuideLine) fabricCanvas.remove(appState.tempSplineGuideLine);
    appState.tempSplineGuideLine = null;
    if (appState.tempSplinePathObject) fabricCanvas.remove(appState.tempSplinePathObject); // Siempre remover para redibujar completo
    appState.tempSplinePathObject = null;


    if (!appState.isDrawingSplineSegment || !appState.bezierLastP1) return;

    let previewPathStr = appState.bezierPathData; 
    let guideStartPoint = appState.bezierLastP1;

    if (appState.bezierCurrentSegmentPoints.length === 0) { // Esperando C1
        guideStartPoint = appState.bezierLastP1;
    } else if (appState.bezierCurrentSegmentPoints.length === 1) { // Esperando C2
        guideStartPoint = appState.bezierCurrentSegmentPoints[0]; // Guía desde C1
        previewPathStr += ` C ${appState.bezierCurrentSegmentPoints[0].x} ${appState.bezierCurrentSegmentPoints[0].y} ${currentMousePos.x} ${currentMousePos.y} ${currentMousePos.x} ${currentMousePos.y}`;
    } else if (appState.bezierCurrentSegmentPoints.length === 2) { // Esperando P1
        guideStartPoint = appState.bezierCurrentSegmentPoints[1]; // Guía desde C2
        previewPathStr += ` C ${appState.bezierCurrentSegmentPoints[0].x} ${appState.bezierCurrentSegmentPoints[0].y} ${appState.bezierCurrentSegmentPoints[1].x} ${appState.bezierCurrentSegmentPoints[1].y} ${currentMousePos.x} ${currentMousePos.y}`;
    }
    
    // Solo dibujar el path si tiene comandos de curva o es el path acumulado
    if (previewPathStr && (previewPathStr.includes('C') || appState.bezierCurrentSegmentPoints.length === 0 && appState.bezierPathData)) { 
        appState.tempSplinePathObject = new fabric.Path(previewPathStr, {
            fill: 'transparent', stroke: 'rgba(0,0,0,0.4)',
            strokeWidth: parseInt(document.getElementById('stroke-width').value,10),
            selectable: false, evented: false, objectCaching: false
        });
        fabricCanvas.add(appState.tempSplinePathObject);
    }
    
    appState.tempSplineGuideLine = new fabric.Line([guideStartPoint.x, guideStartPoint.y, currentMousePos.x, currentMousePos.y], {
        stroke: 'rgba(0,0,255,0.5)', strokeDashArray: [3, 3],
        selectable: false, evented: false
    });
    fabricCanvas.add(appState.tempSplineGuideLine);
    fabricCanvas.renderAll();
}


export function finishSplineDrawing(appState) {
    const fabricCanvas = appState.fabricCanvas;
    if (appState.tempSplinePathObject) fabricCanvas.remove(appState.tempSplinePathObject);
    appState.tempSplinePathObject = null;
    if (appState.tempSplineGuideLine) fabricCanvas.remove(appState.tempSplineGuideLine);
    appState.tempSplineGuideLine = null;

    if (appState.bezierPathData && (appState.bezierPathData.match(/C/g) || []).length > 0) {
        const finalPath = new fabric.Path(appState.bezierPathData, {
            fill: 'transparent', stroke: document.getElementById('stroke-color').value,
            strokeWidth: parseInt(document.getElementById('stroke-width').value,10),
            selectable: true, objectCaching: false
        });
        fabricCanvas.add(finalPath).setActiveObject(finalPath);
    }
    
    fabricCanvas.renderAll();
    appState.bezierPathData = ''; 
    appState.bezierCurrentSegmentPoints = []; 
    appState.bezierLastP1 = null; 
    appState.isDrawingSplineSegment = false;
    appState.setTool('select');
}