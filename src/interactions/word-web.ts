import { WordNode } from "../WordNode";

export const wordWeb = document.getElementById("word-web") as WordWeb;
{
    const { width: initialWidth, height: initialHeight } = wordWeb.getBoundingClientRect();
    wordWeb.width = initialWidth;
    wordWeb.height = initialHeight;
    wordWeb.pixelScale = 1.0;
}
const ctx = wordWeb.getContext("2d")!;

let rootNode: WordNode | null = null;
let zoom = 1;
let offset: Vector = { x: 0, y: 0 };
let currentNodeId: number | null = null;
const nodePositions = new Array<[Vector, WordNode]>();

const canvasResizeObserver = new ResizeObserver(entries => {
    const { inlineSize: width, blockSize: height } = entries[0].devicePixelContentBoxSize[0];
    const logicalHeight = entries[0].contentBoxSize[0].blockSize;
    window.requestAnimationFrame(time => {
        wordWeb.width = width;
        wordWeb.height = height;
        wordWeb.pixelScale = height / logicalHeight;
        renderScene(time);
    });
});
canvasResizeObserver.observe(wordWeb);

{
    let startMousePosition: Vector | null = null;
    let lastMousePosition: Vector | null = null;
    wordWeb.addEventListener("pointerdown", e => {
        if (e.pointerType !== "mouse") {
            return;
        }
        startMousePosition = { x: e.clientX | 0, y: e.clientY | 0 };
        lastMousePosition = { x: e.clientX * wordWeb.pixelScale, y: e.clientY * wordWeb.pixelScale };
        e.preventDefault();
        cancelAnimation();
    });
    window.addEventListener("pointermove", e => {
        if (e.pointerType !== "mouse") {
            return;
        }
        if (lastMousePosition != null) {
            const newMousePosition = { x: e.clientX * wordWeb.pixelScale, y: e.clientY * wordWeb.pixelScale };
            offset = {
                x: offset.x + newMousePosition.x - lastMousePosition.x,
                y: offset.y + newMousePosition.y - lastMousePosition.y,
            };
            lastMousePosition = newMousePosition;
            window.requestAnimationFrame(renderScene);
            e.preventDefault();
            cancelAnimation();
        }
    });
    window.addEventListener("pointerup", pointerUpHandler);
    window.addEventListener("pointercancel", pointerUpHandler);
    function pointerUpHandler(e: PointerEvent) {
        if (e.pointerType !== "mouse") {
            return;
        }
        lastMousePosition = null;
        cancelAnimation();
    }
    wordWeb.addEventListener("wheel", e => {
        if (e.deltaY != 0) {
            setZoom(zoom * (1 - e.deltaY / 1000), { x: e.clientX * wordWeb.pixelScale, y: e.clientY * wordWeb.pixelScale });
            window.requestAnimationFrame(renderScene);
            e.preventDefault();
            cancelAnimation();
        }
    });
    wordWeb.addEventListener("click", e => {
        const mousePosition = { x: e.clientX, y: e.clientY };
        if (startMousePosition?.x == mousePosition.x && startMousePosition?.y == mousePosition.y || (e as any).pointerType !== "mouse") {
            const scaledMousePosition = { x: mousePosition.x * wordWeb.pixelScale, y: mousePosition.y * wordWeb.pixelScale };
            const distance = wordWeb.pixelScale * zoom * 50;
            for (const [pos, node] of nodePositions) {
                if (Math.hypot(scaledMousePosition.x - pos.x, scaledMousePosition.y - pos.y) < distance) {
                    wordWeb.dispatchEvent(new SelectEvent(node));
                    break;
                }
            }
        }
    });
}

{
    const lastTouchPositions = new Map<number, Vector>();
    wordWeb.addEventListener("touchstart", e => {
        for (const touch of e.changedTouches) {
            lastTouchPositions.set(touch.identifier, { x: touch.clientX * wordWeb.pixelScale, y: touch.clientY * wordWeb.pixelScale });
        }
        cancelAnimation();
    });
    wordWeb.addEventListener("touchmove", e => {
        let lastTouchCenter = calculateTouchCenter();
        let lastTouchDistance = calculateTouchDistance();

        for (const touch of e.changedTouches) {
            const newTouchPosition = { x: touch.clientX * wordWeb.pixelScale, y: touch.clientY * wordWeb.pixelScale };
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
                cancelAnimation();
            }
        }

        e.preventDefault();
    });
    wordWeb.addEventListener("touchend", touchEndHandler);
    wordWeb.addEventListener("touchcancel", touchEndHandler);
    function touchEndHandler(e: TouchEvent) {
        for (const touch of e.changedTouches) {
            lastTouchPositions.delete(touch.identifier);
        }
        window.requestAnimationFrame(renderScene);
        cancelAnimation();
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

let animateTo: (target: Vector, duration: number) => void;
let cancelAnimation: () => void;
{
    let animationFrameId: number | null = null;
    let animationStart: number | null = null;
    let animationDuration: number | null = null;
    let animationStartOffset: Vector | null = null;
    let animationTargetOffset: Vector | null = null;

    animateTo = (target: Vector, duration: number): void => {
        cancelAnimation();
        animationStart = performance.now();
        animationDuration = duration;
        animationStartOffset = { x: offset.x, y: offset.y };
        animationTargetOffset = target;
        animationFrameId = window.requestAnimationFrame(animate);
    };

    function animate(time: DOMHighResTimeStamp): void {
        if (animationStart == null || animationDuration == null || animationStartOffset == null || animationTargetOffset == null) {
            return;
        }
        const progress = Math.min(1, (time - animationStart) / animationDuration);
        offset = {
            x: animationStartOffset.x + (animationTargetOffset.x - animationStartOffset.x) * progress,
            y: animationStartOffset.y + (animationTargetOffset.y - animationStartOffset.y) * progress,
        };
        renderScene(time);
        if (progress < 1) {
            animationFrameId = window.requestAnimationFrame(animate);
        } else {
            animationFrameId = null;
        }
    }

    cancelAnimation = (): void => {
        if (animationFrameId != null) {
            window.cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    };
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

wordWeb.renderTree = (root: WordNode, currentNode: WordNode | null): void => {
    rootNode = root;
    if (currentNode != null) {
        currentNodeId = currentNode.id;
    }
    else {
        window.requestAnimationFrame(renderScene);
    }
};
wordWeb.moveToNode = (node: WordNode): void => {
    const currentNodePosition = getPositionOfNode(node, zoom * wordWeb.pixelScale);
    offset = {
        x: wordWeb.width / 2 - (currentNodePosition.x - offset.x),
        y: wordWeb.height / 2 - (currentNodePosition.y - offset.y),
    };
    window.requestAnimationFrame(renderScene);
};
wordWeb.animateToNode = (node: WordNode): void => {
    const currentNodePosition = getPositionOfNode(node, zoom * wordWeb.pixelScale);
    const targetOffset = {
        x: wordWeb.width / 2 - (currentNodePosition.x - offset.x),
        y: wordWeb.height / 2 - (currentNodePosition.y - offset.y),
    };
    animateTo(targetOffset, 250);
};

function renderScene(_: DOMHighResTimeStamp): void {
    const { width, height, pixelScale } = wordWeb;
    const scale = pixelScale * zoom;

    ctx.clearRect(0, 0, width, height);

    nodePositions.splice(0, nodePositions.length);
    if (rootNode == null) {
        return;
    }
    renderNode(rootNode);

    function renderNode(node: WordNode): void {
        const pos = getPositionOfNode(node, scale);
        for (const child of node.children) {
            if (!child.isDisjointChild) {
                renderEdge(pos, getPositionOfNode(child, scale));
            }
            renderNode(child);
        }
        if (currentNodeId == node.id) {
            renderUnderline(pos, node.word, getNodeColor(node));
        }
        renderText(pos, node.word, getNodeColor(node));
        nodePositions.push([pos, node]);
    }

    function renderEdge(from: Vector, to: Vector): void {
        ctx.strokeStyle = "#bada55";
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
    }

    function getNodeColor(node: WordNode): string {
        if (node.isEnd) {
            return "#ffd700";
        } else {
            return "#ffffff";
        }
    }

    function renderText(pos: Vector, text: string, color: string): void {
        nodeTextStyling(color);
        ctx.fillText(text, pos.x, pos.y);
        ctx.strokeText(text, pos.x, pos.y);
    }

    function renderUnderline(pos: Vector, text: string, color: string): void {
        nodeTextStyling(color);
        ctx.lineWidth = 5 * scale;
        const measurements = ctx.measureText(text);
        ctx.beginPath();
        ctx.moveTo(pos.x - measurements.width / 2, pos.y + measurements.actualBoundingBoxAscent / 2 + 4 * scale);
        ctx.lineTo(pos.x + measurements.width / 2, pos.y + measurements.actualBoundingBoxAscent / 2 + 4 * scale);
        ctx.stroke();
        ctx.lineWidth = 1 * scale;
        ctx.strokeStyle = color;
        ctx.stroke();
    }

    function nodeTextStyling(color: string): void {
        ctx.font = `${3 * scale}rem "Comic Sans MS", "Comic Sans", cursive`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeStyle = "#000000";
        ctx.fillStyle = color;
        ctx.lineWidth = 2 * scale;
        ctx.lineCap = "round";
    }
}

function getPositionOfNode(node: WordNode, scale: number): Vector {
    return {
        x: node.level * 250 * scale + offset.x,
        y: node.offset * 150 * scale + offset.y,
    }
}

export interface WordWeb extends HTMLCanvasElement {
    addEventListener<K extends keyof GlobalEventHandlersEventMap | "nodeselected">(
        type: K,
        listener: (this: WordWeb, e: K extends keyof GlobalEventHandlersEventMap ? GlobalEventHandlersEventMap[K] : SelectEvent) => any,
        options?: boolean | AddEventListenerOptions
    ): void;

    renderTree(root: WordNode, currentNode: WordNode | null): void;

    moveToNode(node: WordNode): void;
    animateToNode(node: WordNode): void;

    pixelScale: number;
}

export class SelectEvent extends Event {
    public constructor(public selectedNode: WordNode) {
        super("nodeselected", { bubbles: true });
    }
}

interface Vector {
    readonly x: number;
    readonly y: number;
}
