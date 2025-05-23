// js/object-manager.js
export function setupObjectManagement(appState) {
    const fabricCanvas = appState.fabricCanvas;

    document.getElementById('delete-selected').addEventListener('click', () => deleteSelectedObjectsFromManager(appState));

    ['bring-forward','send-backward','bring-to-front','send-to-back'].forEach(id => {
        document.getElementById(id).addEventListener('click', () => {
            const activeObj = fabricCanvas.getActiveObject(); 
            if (activeObj) {
                switch(id) {
                    case 'bring-forward': fabricCanvas.bringForward(activeObj); break;
                    case 'send-backward': fabricCanvas.sendBackwards(activeObj); break;
                    case 'bring-to-front': fabricCanvas.bringToFront(activeObj); break;
                    case 'send-to-back': fabricCanvas.sendToBack(activeObj); break;
                }
                fabricCanvas.renderAll(); 
            }
            if (typeof appState.closeAllDropdowns === 'function') appState.closeAllDropdowns();
        });
    });

    document.getElementById('group-objects').addEventListener('click', () => {
        const activeObj = fabricCanvas.getActiveObject();
        if (!activeObj || activeObj.type !== 'activeSelection') return;
        activeObj.toGroup();
        fabricCanvas.requestRenderAll();
    });
    document.getElementById('ungroup-objects').addEventListener('click', () => {
        const activeObj = fabricCanvas.getActiveObject();
        if (!activeObj || activeObj.type !== 'group') return;
        activeObj.toActiveSelection(); 
        fabricCanvas.requestRenderAll();
    });
}

export function deleteSelectedObjectsFromManager(appState) { 
    const fabricCanvas = appState.fabricCanvas;
    const activeObjects = fabricCanvas.getActiveObjects(); 
    if (activeObjects.length > 0) {
        activeObjects.forEach(obj => fabricCanvas.remove(obj));
        fabricCanvas.discardActiveObject().renderAll();
    }
}