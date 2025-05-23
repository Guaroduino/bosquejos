// js/fabric-config.js
export function initializeFabricCanvas(canvasId) {
    const fabricCanvas = new fabric.Canvas(canvasId, {
        width: 800, height: 600, backgroundColor: 'white',
        cornerSize: 8, touchCornerSize: 20, transparentCorners: false,
        cornerColor: 'var(--primary-accent)', borderColor: 'var(--primary-accent)', padding: 0,
    });
    return fabricCanvas;
}