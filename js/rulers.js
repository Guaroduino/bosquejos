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

        // Crear regla horizontal
        this.rulerH = document.createElement('div');
        this.rulerH.className = 'ruler-h';

        // Crear regla vertical
        this.rulerV = document.createElement('div');
        this.rulerV.className = 'ruler-v';

        // Crear esquina
        this.rulerCorner = document.createElement('div');
        this.rulerCorner.className = 'ruler-corner';

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
        const startX = Math.floor(-vpt[4] / zoom / interval) * interval;
        const startY = Math.floor(-vpt[5] / zoom / interval) * interval;
        const endX = Math.ceil((width - vpt[4]) / zoom / interval) * interval;
        const endY = Math.ceil((height - vpt[5]) / zoom / interval) * interval;

        // Crear marcas horizontales
        for (let x = startX; x <= endX; x += interval) {
            const mark = document.createElement('div');
            mark.className = 'ruler-mark ruler-mark-h';
            mark.style.left = `${x * zoom + vpt[4]}px`;

            const text = document.createElement('div');
            text.className = 'ruler-text ruler-text-h';
            text.textContent = x;
            text.style.left = `${x * zoom + vpt[4]}px`;

            this.rulerH.appendChild(mark);
            this.rulerH.appendChild(text);
        }

        // Crear marcas verticales
        for (let y = startY; y <= endY; y += interval) {
            const mark = document.createElement('div');
            mark.className = 'ruler-mark ruler-mark-v';
            mark.style.top = `${y * zoom + vpt[5]}px`;

            const text = document.createElement('div');
            text.className = 'ruler-text ruler-text-v';
            text.textContent = y;
            text.style.top = `${y * zoom + vpt[5]}px`;

            this.rulerV.appendChild(mark);
            this.rulerV.appendChild(text);
        }
    }

    calculateInterval(zoom) {
        // Ajustar el intervalo basado en el nivel de zoom
        if (zoom < 0.5) return 100;
        if (zoom < 1) return 50;
        if (zoom < 2) return 20;
        if (zoom < 4) return 10;
        return 5;
    }
} 