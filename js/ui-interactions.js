// js/ui-interactions.js
let currentAppStateRef; // Para acceder a appState desde este módulo

export function setupUIEventListeners(appState) {
    currentAppStateRef = appState;

    document.querySelectorAll('.dropdown').forEach(dropdown => {
        const button = dropdown.querySelector('.dropdown-button');
        const content = dropdown.querySelector('.dropdown-content');
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            document.querySelectorAll('.dropdown-content.show').forEach(od => { if (od !== content) od.classList.remove('show'); });
            content.classList.toggle('show');
        });
    });
    window.addEventListener('click', () => document.querySelectorAll('.dropdown-content.show').forEach(od => od.classList.remove('show')));
    
    ['select', 'pencil', 'rect', 'circle', 'line', 'polyline', 'spline', 'text'].forEach(toolName => {
        const btn = document.getElementById(toolName + '-tool');
        if (btn) btn.addEventListener('click', () => currentAppStateRef.setTool(toolName));
    });

    // Listeners para estilos y texto (llaman a appState.applyStyleToSelected)
    document.getElementById('fill-color').addEventListener('input', (e) => currentAppStateRef.applyStyleToSelected('fill', e.target.value));
    document.getElementById('stroke-color').addEventListener('input', (e) => currentAppStateRef.applyStyleToSelected('stroke', e.target.value));
    document.getElementById('stroke-width').addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        currentAppStateRef.applyStyleToSelected('strokeWidth', val);
        if (currentAppStateRef.currentTool === 'pencil') currentAppStateRef.fabricCanvas.freeDrawingBrush.width = val;
    });

    document.getElementById('font-family').addEventListener('change', (e) => currentAppStateRef.applyStyleToSelected('fontFamily', e.target.value, true));
    document.getElementById('font-size').addEventListener('input', (e) => currentAppStateRef.applyStyleToSelected('fontSize', parseInt(e.target.value, 10), true));
    
    document.getElementById('font-bold').addEventListener('click', () => {
        const activeObj = currentAppStateRef.fabricCanvas.getActiveObject(); if (!activeObj) return;
        const currentWeight = (activeObj.type === 'activeSelection' ? activeObj.getObjects().find(x=>x.type==='i-text')?.fontWeight : activeObj.fontWeight) === 'bold' ? 'normal' : 'bold';
        currentAppStateRef.applyStyleToSelected('fontWeight', currentWeight, true);
        document.getElementById('font-bold').style.fontWeight = currentWeight; // Actualizar UI del botón
    });
    document.getElementById('font-italic').addEventListener('click', () => {
        const activeObj = currentAppStateRef.fabricCanvas.getActiveObject(); if (!activeObj) return;
        const currentStyle = (activeObj.type === 'activeSelection' ? activeObj.getObjects().find(x=>x.type==='i-text')?.fontStyle : activeObj.fontStyle) === 'italic' ? 'normal' : 'italic';
        currentAppStateRef.applyStyleToSelected('fontStyle', currentStyle, true);
        document.getElementById('font-italic').style.fontStyle = currentStyle; // Actualizar UI del botón
    });


    // Actualización de controles de UI cuando cambia la selección
    currentAppStateRef.fabricCanvas.on('selection:created', (e) => updateControlsForSelectionUI(e, currentAppStateRef));
    currentAppStateRef.fabricCanvas.on('selection:updated', (e) => updateControlsForSelectionUI(e, currentAppStateRef));
    currentAppStateRef.fabricCanvas.on('selection:cleared', () => {
        document.getElementById('text-options-toolbar-group').classList.add('hidden');
        // Opcional: resetear los pickers de color/trazo a valores por defecto
    });
}

export function closeAllDropdownsFromUI() { 
    document.querySelectorAll('.dropdown-content.show').forEach(od => od.classList.remove('show')); 
}

export function updateActiveToolIndicatorInUI(toolId) {
    document.querySelectorAll('.dropdown-button').forEach(btn => {
        btn.classList.remove('active-parent');
        const indicator = btn.querySelector('.active-tool-indicator');
        if(indicator) indicator.textContent = '';
    });
    document.querySelectorAll('.tool-button').forEach(btn => btn.classList.remove('active'));

    const activeButton = document.getElementById(toolId);
    if (activeButton) {
        activeButton.classList.add('active');
        const parentDropdown = activeButton.closest('.dropdown');
        if (parentDropdown) {
            const parentBtn = parentDropdown.querySelector('.dropdown-button');
            parentBtn.classList.add('active-parent');
            const indicator = parentBtn.querySelector('.active-tool-indicator');
            if(indicator) indicator.textContent = `(${activeButton.dataset.toolName || activeButton.textContent.trim()})`;
        }
    } else if (toolId === 'select-tool') { // El ID ya es 'select-tool'
         const selectBtn = document.getElementById('select-tool');
         if (selectBtn) selectBtn.classList.add('active');
    }
}

export function setActiveToolState(tool, appState) {
    const fabricCanvas = appState.fabricCanvas;

    fabricCanvas.isDrawingMode = (tool === 'pencil');
    updateActiveToolIndicatorInUI(tool + '-tool'); // Llama a la función de UI para actualizar el indicador
    
    const textOptionsPanel = document.getElementById('text-options-toolbar-group');
    const activeObject = fabricCanvas.getActiveObject();
    textOptionsPanel.classList.toggle('hidden', !(tool === 'text' || (activeObject && activeObject.type === 'i-text')));

    fabricCanvas.selection = (tool === 'select');
    fabricCanvas.defaultCursor = (tool === 'select') ? 'default' : 'crosshair';
    if (tool === 'polyline' || tool === 'spline') { fabricCanvas.defaultCursor = 'crosshair'; fabricCanvas.selection = false; }
    
    if (tool === 'pencil') { 
        fabricCanvas.freeDrawingBrush.color = document.getElementById('stroke-color').value;
        fabricCanvas.freeDrawingBrush.width = parseInt(document.getElementById('stroke-width').value, 10);
     }
    if (tool !== 'select' && tool !== 'text' && activeObject && !(activeObject.type === 'i-text' && tool === 'select')) { 
        fabricCanvas.discardActiveObject(); 
    }
    fabricCanvas.renderAll(); 
    if (tool !== 'select') closeAllDropdownsFromUI();
}

function updateControlsForSelectionUI(e, appState) {
    const activeObject = e.selected ? (e.selected.length === 1 ? e.selected[0] : e.target) : null; 
    const textOptionsPanel = document.getElementById('text-options-toolbar-group');
    
    if (activeObject) {
        const isIText = activeObject.type === 'i-text';
        const isGroupWithText = activeObject.type === 'activeSelection' && activeObject.getObjects().some(o => o.type === 'i-text');

        document.getElementById('fill-color').value = typeof activeObject.fill === 'string' ? activeObject.fill : '#ffffff00'; // Handle transparent
        document.getElementById('stroke-color').value = activeObject.stroke || '#000000';
        document.getElementById('stroke-width').value = activeObject.strokeWidth === undefined ? (isIText ? 0 : 1) : activeObject.strokeWidth;

        if (isIText || isGroupWithText) {
            textOptionsPanel.classList.remove('hidden');
            const textObjToInspect = isIText ? activeObject : activeObject.getObjects().find(o => o.type === 'i-text');
            if (textObjToInspect) {
                document.getElementById('font-family').value = textObjToInspect.fontFamily || 'Arial';
                document.getElementById('font-size').value = textObjToInspect.fontSize || 24;
                document.getElementById('font-bold').style.fontWeight = textObjToInspect.fontWeight === 'bold' ? 'bold' : 'normal';
                document.getElementById('font-italic').style.fontStyle = textObjToInspect.fontStyle === 'italic' ? 'italic' : 'normal';
            }
        } else {
            textOptionsPanel.classList.add('hidden');
        }
    } else {
         textOptionsPanel.classList.add('hidden');
    }
}