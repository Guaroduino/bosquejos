// js/view-manager.js
export function setupViewControls(appState) {
    const fabricCanvas = appState.fabricCanvas;
    const canvasWrapper = document.getElementById('canvas-wrapper');
    const canvasEl = document.getElementById('editor-canvas');
    let isPanning = false;
    let lastPosX = 0;
    let lastPosY = 0;

    // Configurar el zoom con la rueda del mouse SOLO sobre el canvas
    canvasEl.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY;
        const zoom = fabricCanvas.getZoom();
        const newZoom = delta > 0 ? zoom * 0.9 : zoom * 1.1;
        setCanvasZoom(newZoom, appState);
    });

    // Paneo con botón central del mouse sobre el canvas
    canvasEl.addEventListener('mousedown', (e) => {
        if (e.button === 1) {
            e.preventDefault();
            isPanning = true;
            lastPosX = e.clientX;
            lastPosY = e.clientY;
            canvasEl.style.cursor = 'grabbing';
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (isPanning) {
            e.preventDefault();
            const deltaX = e.clientX - lastPosX;
            const deltaY = e.clientY - lastPosY;
            const zoom = fabricCanvas.getZoom();
            fabricCanvas.relativePan({ x: deltaX / zoom, y: deltaY / zoom });
            lastPosX = e.clientX;
            lastPosY = e.clientY;
        }
    });

    window.addEventListener('mouseup', (e) => {
        if (e.button === 1 && isPanning) {
            isPanning = false;
            canvasEl.style.cursor = 'default';
        }
    });

    canvasWrapper.addEventListener('mouseleave', () => {
        if (isPanning) {
            isPanning = false;
            canvasWrapper.style.cursor = 'default';
        }
    });

    // Botones de zoom
    document.getElementById('zoom-in').addEventListener('click', () => { 
        setCanvasZoom(fabricCanvas.getZoom() * 1.2, appState); 
        if (typeof appState.closeAllDropdowns === 'function') appState.closeAllDropdowns(); 
    });
    
    document.getElementById('zoom-out').addEventListener('click', () => { 
        setCanvasZoom(fabricCanvas.getZoom() / 1.2, appState); 
        if (typeof appState.closeAllDropdowns === 'function') appState.closeAllDropdowns(); 
    });
    
    document.getElementById('reset-zoom').addEventListener('click', () => { 
        resetZoomAndPanView(appState); 
        if (typeof appState.closeAllDropdowns === 'function') appState.closeAllDropdowns(); 
    });
    
    document.getElementById('apply-canvas-size').addEventListener('click', () => {
        const newWidth = parseInt(document.getElementById('canvas-width-input').value, 10);
        const newHeight = parseInt(document.getElementById('canvas-height-input').value, 10);
        if (newWidth > 0 && newHeight > 0) {
            fabricCanvas.setWidth(newWidth);
            fabricCanvas.setHeight(newHeight);
            fabricCanvas.calcOffset();
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
    fabricCanvas.requestRenderAll();
}

function centerCanvas(fabricCanvas) {
    const canvasWidth = fabricCanvas.width;
    const canvasHeight = fabricCanvas.height;
    const wrapperWidth = fabricCanvas.wrapperEl.parentNode.clientWidth;
    const wrapperHeight = fabricCanvas.wrapperEl.parentNode.clientHeight;
    
    const panX = (wrapperWidth - canvasWidth) / 2;
    const panY = (wrapperHeight - canvasHeight) / 2;
    
    fabricCanvas.absolutePan({ x: panX, y: panY });
    fabricCanvas.requestRenderAll();
}

export function resetZoomAndPanView(appState) {
    const fabricCanvas = appState.fabricCanvas;
    fabricCanvas.setZoom(1);
    centerCanvas(fabricCanvas);
}