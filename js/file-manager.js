// js/file-manager.js
export function setupFileHandlers(appState) {
    const fabricCanvas = appState.fabricCanvas;
    const actualSvgImporter = document.getElementById('actual-svg-importer');

    document.getElementById('import-svg-button').addEventListener('click', () => {
        actualSvgImporter.click();
        if (typeof appState.closeAllDropdowns === 'function') appState.closeAllDropdowns();
    });

    actualSvgImporter.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const svgString = event.target.result;
            fabric.loadSVGFromString(svgString, (objects, options) => {
                const group = fabric.util.groupSVGElements(objects, options);
                const center = fabricCanvas.getCenter();
                group.set({
                    left: center.left - (group.width * (group.scaleX || 1) / 2),
                    top: center.top - (group.height * (group.scaleY || 1) / 2),
                });
                fabricCanvas.add(group).renderAll();
                fabricCanvas.setActiveObject(group);
                e.target.value = ''; 
            });
        };
        reader.readAsText(file);
    });

    document.getElementById('export-svg').addEventListener('click', () => {
        const svg = fabricCanvas.toSVG({
            suppressPreamble: true,
            viewBox: { x: 0, y: 0, width: fabricCanvas.getWidth(), height: fabricCanvas.getHeight() }
        });
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'canvas_export.svg';
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
        if (typeof appState.closeAllDropdowns === 'function') appState.closeAllDropdowns();
    });

    document.getElementById('clear-canvas').addEventListener('click', () => {
        if (confirm('¿Limpiar canvas? Esta acción no se puede deshacer.')) {
            fabricCanvas.clear();
            fabricCanvas.backgroundColor = 'white'; 
            fabricCanvas.renderAll();
        }
        if (typeof appState.closeAllDropdowns === 'function') appState.closeAllDropdowns();
    });
}

// Esta función es globalmente accesible a través de appState.applyStyleToSelected
export function applyStyleToSelectedObjects(property, value, appState, isTextProperty = false) {
    const fabricCanvas = appState.fabricCanvas;
    const activeObjects = fabricCanvas.getActiveObjects();
    if (activeObjects.length > 0) {
        activeObjects.forEach(obj => {
            if (isTextProperty && obj.type !== 'i-text') return;
            if (obj.type === 'activeSelection') { 
                obj.forEachObject(subObj => {
                    if (isTextProperty && subObj.type !== 'i-text') return;
                    subObj.set(property, value);
                });
            } else {
               obj.set(property, value);
            }
        });
        fabricCanvas.renderAll();
    } else if (appState.currentTool === 'pencil' && !isTextProperty) { 
        if (property === 'stroke') fabricCanvas.freeDrawingBrush.color = value;
        if (property === 'strokeWidth') fabricCanvas.freeDrawingBrush.width = parseInt(value, 10);
    }
}