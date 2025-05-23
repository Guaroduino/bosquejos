export class CanvasRulers {
    constructor(canvas) {
        this.canvas = canvas;
        this.container = canvas.wrapperEl;
        this.setupRulers();
        this.updateRulers();
    }

    setupRulers() {
        // Crear contenedor de reglas
        this.rulersContainer = document.createElement('div');
        this.rulersContainer.className = 'canvas-rulers';
        this.rulersContainer.style.pointerEvents = 'none';

        // Crear regla horizontal
        this.rulerH = document.createElement('div');
        this.rulerH.className = 'ruler-h';
        this.rulerH.style.position = 'absolute';
        this.rulerH.style.left = '20px';
        this.rulerH.style.top = '0';
        this.rulerH.style.right = '0';
        this.rulerH.style.height = '20px';

        // Crear regla vertical
        this.rulerV = document.createElement('div');
        this.rulerV.className = 'ruler-v';
        this.rulerV.style.position = 'absolute';
        this.rulerV.style.left = '0';
        this.rulerV.style.top = '20px';
        this.rulerV.style.width = '20px';
        this.rulerV.style.bottom = '0';

        // Crear esquina
        this.rulerCorner = document.createElement('div');
        this.rulerCorner.className = 'ruler-corner';
        this.rulerCorner.style.position = 'absolute';
        this.rulerCorner.style.left = '0';
        this.rulerCorner.style.top = '0';
        this.rulerCorner.style.width = '20px';
        this.rulerCorner.style.height = '20px';

        // Agregar reglas al contenedor
        this.rulersContainer.appendChild(this.rulerCorner);
        this.rulersContainer.appendChild(this.rulerH);
        this.rulersContainer.appendChild(this.rulerV);

        // Agregar contenedor de reglas antes del canvas
        this.container.parentNode.insertBefore(this.rulersContainer, this.container);

        // Ajustar posición del canvas
        this.container.style.marginLeft = '20px';
        this.container.style.marginTop = '20px';
    }

    updateRulers() {
        const zoom = this.canvas.getZoom();
        const vpt = this.canvas.viewportTransform;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Limpiar marcas existentes
        this.rulerH.innerHTML = '';
        this.rulerV.innerHTML = '';

        // Calcular intervalos basados en el zoom
        const interval = this.calculateInterval(zoom);
        // El desplazamiento del viewport (paneo) en pixeles
        const offsetX = vpt[4];
        const offsetY = vpt[5];

        // El área visible en coordenadas canvas
        const visibleStartX = Math.max(0, -offsetX / zoom);
        const visibleEndX = Math.min(width, (this.container.clientWidth - offsetX) / zoom);
        const visibleStartY = Math.max(0, -offsetY / zoom);
        const visibleEndY = Math.min(height, (this.container.clientHeight - offsetY) / zoom);

        // Marcas horizontales (arriba)
        for (let x = Math.floor(visibleStartX / interval) * interval; x <= visibleEndX; x += interval) {
            const px = Math.round(x * zoom + offsetX);
            if (px < 0 || px > this.container.clientWidth) continue;
            const mark = document.createElement('div');
            mark.className = 'ruler-mark ruler-mark-h';
            mark.style.left = `${px}px`;
            mark.style.height = '6px';
            mark.style.width = '1px';
            mark.style.bottom = '0';
            mark.style.position = 'absolute';

            const text = document.createElement('div');
            text.className = 'ruler-text ruler-text-h';
            text.textContent = x;
            text.style.left = `${px}px`;
            text.style.position = 'absolute';
            text.style.bottom = '2px';

            this.rulerH.appendChild(mark);
            this.rulerH.appendChild(text);
        }

        // Marcas verticales (izquierda)
        for (let y = Math.floor(visibleStartY / interval) * interval; y <= visibleEndY; y += interval) {
            const py = Math.round(y * zoom + offsetY);
            if (py < 0 || py > this.container.clientHeight) continue;
            const mark = document.createElement('div');
            mark.className = 'ruler-mark ruler-mark-v';
            mark.style.top = `${py}px`;
            mark.style.width = '6px';
            mark.style.height = '1px';
            mark.style.right = '0';
            mark.style.position = 'absolute';

            const text = document.createElement('div');
            text.className = 'ruler-text ruler-text-v';
            text.textContent = y;
            text.style.top = `${py}px`;
            text.style.position = 'absolute';
            text.style.right = '2px';

            this.rulerV.appendChild(mark);
            this.rulerV.appendChild(text);
        }
    }

    calculateInterval(zoom) {
        if (zoom < 0.5) return 100;
        if (zoom < 1) return 50;
        if (zoom < 2) return 20;
        if (zoom < 4) return 10;
        return 5;
    }
} 