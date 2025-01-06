import { WordNode } from "../WordNode";

const canvas = document.getElementById("word-web") as ScaledHTMLCanvasElement;
{
    const { width: initialWidth, height: initialHeight } = canvas.getBoundingClientRect();
    canvas.width = initialWidth;
    canvas.height = initialHeight;
    canvas.pixelScale = 1.0;
}
const ctx = canvas.getContext("2d")!;

let rootNode: WordNode | null = null;
let zoom = 1;
let offset: Vector = { x: 0, y: 0 };

const canvasResizeObserver = new ResizeObserver(entries => {
    const { inlineSize: width, blockSize: height } = entries[0].devicePixelContentBoxSize[0];
    const logicalHeight = entries[0].contentBoxSize[0].blockSize;
    window.requestAnimationFrame(time => {
        canvas.width = width;
        canvas.height = height;
        canvas.pixelScale = height / logicalHeight;
        renderScene(time);
    });
});
canvasResizeObserver.observe(canvas);

{
    let lastMousePosition: Vector | null = null;
    canvas.addEventListener("pointerdown", e => {
        if (e.pointerType !== "mouse") {
            return;
        }
        lastMousePosition = { x: e.clientX * canvas.pixelScale, y: e.clientY * canvas.pixelScale };
        e.preventDefault();
    });
    window.addEventListener("pointermove", e => {
        if (e.pointerType !== "mouse") {
            return;
        }
        if (lastMousePosition != null) {
            const newMousePosition = { x: e.clientX * canvas.pixelScale, y: e.clientY * canvas.pixelScale };
            offset = {
                x: offset.x + newMousePosition.x - lastMousePosition.x,
                y: offset.y + newMousePosition.y - lastMousePosition.y,
            };
            lastMousePosition = newMousePosition;
            window.requestAnimationFrame(renderScene);
            e.preventDefault();
        }
    });
    window.addEventListener("pointerup", pointerUpHandler);
    window.addEventListener("pointercancel", pointerUpHandler);
    function pointerUpHandler(e: PointerEvent) {
        if (e.pointerType !== "mouse") {
            return;
        }
        lastMousePosition = null;
    }
    canvas.addEventListener("wheel", e => {
        if (e.deltaY != 0) {
            setZoom(zoom * (1 - e.deltaY / 1000), { x: e.clientX * canvas.pixelScale, y: e.clientY * canvas.pixelScale });
            window.requestAnimationFrame(renderScene);
            e.preventDefault();
        }
    });
}

{
    const lastTouchPositions = new Map<number, Vector>();
    canvas.addEventListener("touchstart", e => {
        for (const touch of e.changedTouches) {
            lastTouchPositions.set(touch.identifier, { x: touch.clientX * canvas.pixelScale, y: touch.clientY * canvas.pixelScale });
        }
    });
    canvas.addEventListener("touchmove", e => {
        let lastTouchCenter = calculateTouchCenter();
        let lastTouchDistance = calculateTouchDistance();

        for (const touch of e.changedTouches) {
            const newTouchPosition = { x: touch.clientX * canvas.pixelScale, y: touch.clientY * canvas.pixelScale };
            lastTouchPositions.set(touch.identifier, newTouchPosition);
        }
        let newTouchCenter = calculateTouchCenter();
        let newTouchDistance = calculateTouchDistance();

        if (lastTouchCenter != null && newTouchCenter != null) {
            let updated = false;
            if (lastTouchCenter?.x != newTouchCenter?.x || lastTouchCenter?.y != newTouchCenter?.y) {
                offset = {
                    x: offset.x + newTouchCenter.x - lastTouchCenter.x,
                    y: offset.y + newTouchCenter.y - lastTouchCenter.y,
                };
                updated = true;
            }
            if (lastTouchDistance != null && newTouchDistance != null && lastTouchDistance != newTouchDistance) {
                const newZoom = zoom * newTouchDistance / lastTouchDistance;
                setZoom(newZoom, newTouchCenter);
                updated = true;
            }
            if (updated) {
                window.requestAnimationFrame(renderScene);
            }
        }

        e.preventDefault();
    });
    canvas.addEventListener("touchend", touchEndHandler);
    canvas.addEventListener("touchcancel", touchEndHandler);
    function touchEndHandler(e: TouchEvent) {
        for (const touch of e.changedTouches) {
            lastTouchPositions.delete(touch.identifier);
        }
        window.requestAnimationFrame(renderScene);
    }

    function calculateTouchCenter(): Vector | null {
        if (lastTouchPositions.size == 1) {
            const [touch] = lastTouchPositions.values();
            return touch;
        }
        else if (lastTouchPositions.size > 1) {
            const [firstTouch, secondTouch] = lastTouchPositions.values();
            return {
                x: (firstTouch.x + secondTouch.x) / 2,
                y: (firstTouch.y + secondTouch.y) / 2,
            };
        }
        return null;
    }

    function calculateTouchDistance(): number | null {
        if (lastTouchPositions.size < 2) {
            return null;
        }
        const [firstTouch, secondTouch] = lastTouchPositions.values();
        return Math.hypot(firstTouch.x - secondTouch.x, firstTouch.y - secondTouch.y);
    }
}

function setZoom(newZoom: number, around: Vector): void {
    newZoom = Math.max(0.1, Math.min(10, newZoom));
    const diff = newZoom - zoom;
    offset = {
        x: offset.x + (offset.x - around.x) * diff / zoom,
        y: offset.y + (offset.y - around.y) * diff / zoom,
    };
    zoom = newZoom;
}

export function renderTree(root: WordNode, currentNode: WordNode | null): void {
    rootNode = root;
    if (currentNode != null) {
        const currentNodePosition = getPositionOfNode(currentNode, zoom * canvas.pixelScale);
        offset = {
            x: canvas.width / 2 - currentNodePosition.x,
            y: canvas.height / 2 - currentNodePosition.y,
        };
    }
    window.requestAnimationFrame(renderScene);
}

function renderScene(_: DOMHighResTimeStamp): void {
    const { width, height, pixelScale } = canvas;
    const scale = pixelScale * zoom;

    ctx.clearRect(0, 0, width, height);

    if (rootNode == null) {
        return;
    }
    renderNode(rootNode);

    function renderNode(node: WordNode): void {
        const pos = getPositionOfNode(node, scale);
        for (const child of node.children) {
            renderEdge(pos, getPositionOfNode(child, scale));
            renderNode(child);
        }
        renderText(pos.x, pos.y, node.word);
    }

    function renderEdge(from: Vector, to: Vector): void {
        ctx.strokeStyle = "#bada55";
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
    }

    function renderText(x: number, y: number, text: string): void {
        ctx.font = `${3 * scale}rem "Comic Sans MS", "Comic Sans", cursive`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeStyle = "#000000";
        ctx.fillStyle = "#ffffff";
        ctx.lineWidth = 2 * scale;
        ctx.fillText(text, x, y);
        ctx.strokeText(text, x, y);
    }
}

function getPositionOfNode(node: WordNode, scale: number): Vector {
    return {
        x: node.level * 250 * scale + offset.x,
        y: node.offset * 150 * scale + offset.y,
    }
}

interface ScaledHTMLCanvasElement extends HTMLCanvasElement {
    pixelScale: number;
}

interface Vector {
    readonly x: number;
    readonly y: number;
}
