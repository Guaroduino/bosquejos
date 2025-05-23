// js/view-manager.js
export function setupViewControls(appState) {
    const fabricCanvas = appState.fabricCanvas;

    document.getElementById('zoom-in').addEventListener('click', () => { setCanvasZoom(fabricCanvas.getZoom() * 1.2, appState); if (typeof appState.closeAllDropdowns === 'function') appState.closeAllDropdowns(); });
    document.getElementById('zoom-out').addEventListener('click', () => { setCanvasZoom(fabricCanvas.getZoom() / 1.2, appState); if (typeof appState.closeAllDropdowns === 'function') appState.closeAllDropdowns(); });
    document.getElementById('reset-zoom').addEventListener('click', () => { resetZoomAndPanView(appState); if (typeof appState.closeAllDropdowns === 'function') appState.closeAllDropdowns(); });
    document.getElementById('fit-to-screen').addEventListener('click', () => {
        fabricCanvas.setZoom(1);
        resetZoomAndPanView(appState); 
        const objects = fabricCanvas.getObjects().filter(obj => obj.visible);
        if (objects.length === 0) { if (typeof appState.closeAllDropdowns === 'function') appState.closeAllDropdowns(); return; }
        const group = new fabric.Group(objects); const br = group.getBoundingRect(true); group.destroy(); 
        if (!br.width || !br.height) { if (typeof appState.closeAllDropdowns === 'function') appState.closeAllDropdowns(); return; }
        const canvasWidth = fabricCanvas.width / fabricCanvas.getZoom(); 
        const canvasHeight = fabricCanvas.height / fabricCanvas.getZoom();
        let newZoom = Math.min(canvasWidth / br.width, canvasHeight / br.height) * 0.95; 
        newZoom = Math.max(0.01, Math.min(20, newZoom)); 
        const panX = (canvasWidth / 2 / newZoom) - (br.left + br.width / 2);
        const panY = (canvasHeight / 2 / newZoom) - (br.top + br.height / 2);
        fabricCanvas.setZoom(newZoom); fabricCanvas.absolutePan({ x: panX, y: panY });
        fabricCanvas.renderAll();
        if (typeof appState.closeAllDropdowns === 'function') appState.closeAllDropdowns();
    });

    document.getElementById('apply-canvas-size').addEventListener('click', () => {
        const newWidth = parseInt(document.getElementById('canvas-width-input').value, 10);
        const newHeight = parseInt(document.getElementById('canvas-height-input').value, 10);
        if (newWidth > 0 && newHeight > 0) {
            fabricCanvas.setWidth(newWidth); fabricCanvas.setHeight(newHeight);
            fabricCanvas.calcOffset(); fabricCanvas.renderAll();
            resetZoomAndPanView(appState); 
        }
        if (typeof appState.closeAllDropdowns === 'function') appState.closeAllDropdowns();
    });
}

function setCanvasZoom(zoomLevel, appState) { 
    const fabricCanvas = appState.fabricCanvas;
    const newZoom = Math.max(0.01, Math.min(20, zoomLevel));
    const center = fabricCanvas.getCenter();
    fabricCanvas.zoomToPoint(new fabric.Point(center.left, center.top), newZoom);
}

export function resetZoomAndPanView(appState) { // Exportada para ser llamada desde main.js
    const fabricCanvas = appState.fabricCanvas;
    fabricCanvas.setZoom(1);
    fabricCanvas.viewportTransform[4] = 0; 
    fabricCanvas.viewportTransform[5] = 0; 
    fabricCanvas.requestRenderAll();
}