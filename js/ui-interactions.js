// js/ui-interactions.js
let currentAppStateRef; 

const predefinedSVGs = [
    { 
        id: 'circle-icon', 
        name: 'Círculo Básico',
        svgString: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="45" fill="#007bff" stroke="#333" stroke-width="2"/></svg>' 
    },
    { 
        id: 'square-icon', 
        name: 'Cuadrado',
        svgString: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="5" width="90" height="90" fill="#6c757d" stroke="#333" stroke-width="2"/></svg>' 
    },
    {
        id: 'star-icon',
        name: 'Estrella',
        svgString: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><polygon points="50,5 61,39 98,39 68,62 79,96 50,75 21,96 32,62 2,39 39,39" fill="gold" stroke="orange" stroke-width="2"/></svg>'
    },
    {
        id: 'heart-icon',
        name: 'Corazón',
        svgString: '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M50,30 C10,0 0,30 0,30 C0,70 50,100 50,100 C50,100 100,70 100,30 C100,30 90,0 50,30 Z" fill="red" stroke="darkred" stroke-width="2"/></svg>'
    }
];

function populateSVGLibrary() {
    const container = document.getElementById('libraryItemsContainer');
    if (!container) return;
    container.innerHTML = ''; 

    predefinedSVGs.forEach(svgData => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('library-item');
        itemDiv.setAttribute('draggable', true);
        itemDiv.dataset.svgId = svgData.id; 
        itemDiv.dataset.svgString = svgData.svgString; 
        itemDiv.title = svgData.name;
        itemDiv.innerHTML = svgData.svgString; 
        
        itemDiv.addEventListener('dragstart', handleLibraryItemDragStart);
        container.appendChild(itemDiv);
    });
}

function handleLibraryItemDragStart(event) {
    event.dataTransfer.setData('text/plain', event.target.dataset.svgString);
    event.dataTransfer.effectAllowed = 'copy';
}

function toggleSVGLibrary() {
    const panel = document.getElementById('svgLibraryPanel');
    const mainContent = document.querySelector('.main-content'); // Para ajustar margen si es necesario
    const btn = document.getElementById('toggleLibraryBtn');
    panel.classList.toggle('collapsed');
    
    if (panel.classList.contains('collapsed')) {
        btn.innerHTML = '&gt;'; // Flecha hacia la derecha
        if(mainContent) mainContent.style.marginLeft = '0px'; // O el ancho del botón colapsado
    } else {
        btn.innerHTML = '&lt;'; // Flecha hacia la izquierda
        if(mainContent) mainContent.style.marginLeft = panel.offsetWidth + 'px'; // Ajustar si el panel tiene un ancho fijo
    }
}


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
    window.addEventListener('click', (event) => {
        document.querySelectorAll('.dropdown-content.show').forEach(openDropdown => {
            if (!openDropdown.parentElement.contains(event.target)) { // Asegurarse que no se cierre si se clica dentro del dropdown
                 openDropdown.classList.remove('show');
            }
        });
    });
    
    ['select', 'pencil', 'rect', 'circle', 'line', 'polyline', 'spline', 'text'].forEach(toolName => {
        const btn = document.getElementById(toolName + '-tool');
        if (btn) btn.addEventListener('click', () => currentAppStateRef.setTool(toolName));
    });

    const toggleBtn = document.getElementById('toggleLibraryBtn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleSVGLibrary);
    }
    populateSVGLibrary();
    // Inicializar el estado del botón de la librería
    const panel = document.getElementById('svgLibraryPanel');
    if (panel && toggleBtn) { // Asegurar que existen
        if (panel.classList.contains('collapsed')) {
            toggleBtn.innerHTML = '&gt;';
        } else {
            toggleBtn.innerHTML = '&lt;';
        }
    }


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
        const targetObj = activeObj.type === 'activeSelection' ? activeObj.getObjects().find(x=>x.type==='i-text') : activeObj;
        if (!targetObj || targetObj.type !== 'i-text') return;
        const currentWeight = targetObj.fontWeight === 'bold' ? 'normal' : 'bold';
        currentAppStateRef.applyStyleToSelected('fontWeight', currentWeight, true);
        document.getElementById('font-bold').style.fontWeight = currentWeight;
    });
    document.getElementById('font-italic').addEventListener('click', () => {
        const activeObj = currentAppStateRef.fabricCanvas.getActiveObject(); if (!activeObj) return;
        const targetObj = activeObj.type === 'activeSelection' ? activeObj.getObjects().find(x=>x.type==='i-text') : activeObj;
        if (!targetObj || targetObj.type !== 'i-text') return;
        const currentStyle = targetObj.fontStyle === 'italic' ? 'normal' : 'italic';
        currentAppStateRef.applyStyleToSelected('fontStyle', currentStyle, true);
        document.getElementById('font-italic').style.fontStyle = currentStyle;
    });

    currentAppStateRef.fabricCanvas.on('selection:created', (e) => updateControlsForSelectionUI(e, currentAppStateRef));
    currentAppStateRef.fabricCanvas.on('selection:updated', (e) => updateControlsForSelectionUI(e, currentAppStateRef));
    currentAppStateRef.fabricCanvas.on('selection:cleared', () => {
        document.getElementById('text-options-toolbar-group').classList.add('hidden');
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
    } else if (toolId === 'select-tool') { 
         const selectBtn = document.getElementById('select-tool');
         if (selectBtn) selectBtn.classList.add('active');
    }
}

export function setActiveToolState(tool, appState) {
    const fabricCanvas = appState.fabricCanvas;

    // 1. Botón activo cambia de color (incluye seleccionar)
    document.querySelectorAll('.tool-button').forEach(btn => {
        btn.classList.toggle('active', btn.id === tool + '-tool' || (tool === 'select' && btn.id === 'select-tool'));
    });

    // 2. Mostrar nombre de herramienta activa en el botón 'Dibujar'
    const drawTools = ['pencil', 'rect', 'circle', 'line', 'polyline', 'spline', 'text'];
    const drawLabel = document.getElementById('active-draw-tool-label');
    if (drawLabel) {
        if (drawTools.includes(tool)) {
            const btn = document.getElementById(tool + '-tool');
            drawLabel.textContent = btn ? `: ${btn.getAttribute('data-tool-name')}` : '';
        } else {
            drawLabel.textContent = '';
        }
    }

    // 3. Modo de dibujo de Fabric.js
    fabricCanvas.isDrawingMode = (tool === 'pencil');

    // 4. Actualizar el dropdown visualmente
    document.querySelectorAll('.dropdown-button').forEach(btn => btn.classList.remove('active-parent'));
    if (tool === 'select') {
        // Nada especial
    } else if (drawTools.includes(tool)) {
        const drawDropdown = document.querySelector('[data-dropdown-group="draw"] .dropdown-button');
        if (drawDropdown) drawDropdown.classList.add('active-parent');
    }

    // 5. Opciones de texto
    const textOptionsPanel = document.getElementById('text-options-toolbar-group');
    const activeObject = fabricCanvas.getActiveObject();
    textOptionsPanel.classList.toggle('hidden', !(tool === 'text' || (activeObject && activeObject.type === 'i-text')));

    // 6. Selección y cursor
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
        const targetForTextProps = isIText ? activeObject : (isGroupWithText ? activeObject.getObjects().find(o => o.type === 'i-text') : null);


        document.getElementById('fill-color').value = typeof activeObject.fill === 'string' ? activeObject.fill : '#ffffff00'; 
        document.getElementById('stroke-color').value = activeObject.stroke || '#000000';
        document.getElementById('stroke-width').value = activeObject.strokeWidth === undefined ? (targetForTextProps ? 0 : 1) : activeObject.strokeWidth;

        if (targetForTextProps) {
            textOptionsPanel.classList.remove('hidden');
            document.getElementById('font-family').value = targetForTextProps.fontFamily || 'Arial';
            document.getElementById('font-size').value = targetForTextProps.fontSize || 24;
            document.getElementById('font-bold').style.fontWeight = targetForTextProps.fontWeight === 'bold' ? 'bold' : 'normal';
            document.getElementById('font-italic').style.fontStyle = targetForTextProps.fontStyle === 'italic' ? 'italic' : 'normal';
        } else {
            textOptionsPanel.classList.add('hidden');
        }
    } else {
         textOptionsPanel.classList.add('hidden');
    }
}