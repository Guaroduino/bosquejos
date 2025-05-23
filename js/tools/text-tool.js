// js/tools/text-tool.js
export function handleTextMouseDown(o, appState) {
    const fabricCanvas = appState.fabricCanvas;
    const pointer = fabricCanvas.getPointer(o.e);

    const text = new fabric.IText('Texto...', {
        left: pointer.x, top: pointer.y,
        fontFamily: document.getElementById('font-family').value,
        fontSize: parseInt(document.getElementById('font-size').value, 10),
        fill: document.getElementById('fill-color').value,
    });
    fabricCanvas.add(text).setActiveObject(text);
    text.enterEditing();
    fabricCanvas.renderAll();

    document.getElementById('text-options-toolbar-group').classList.remove('hidden');
    // Para actualizar los pickers de UI, se podría llamar a una función de ui-interactions.js
    // que tome el objeto de texto y actualice los selectores de fuente, tamaño, etc.
    // Por ejemplo: updateTextControlUI(text); donde esa función es importada.
    // O el listener de 'selection:updated' en ui-interactions se encargará.
    
    appState.isDrawing = false; 
    appState.currentShape = null;
}