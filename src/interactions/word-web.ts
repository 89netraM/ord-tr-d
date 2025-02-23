import { WordNode } from "../WordNode";
import { WordTreeRenderer } from "../WordTreeRenderer";

export const wordWeb = document.getElementById("word-web") as WordWeb;
{
    const { width: initialWidth, height: initialHeight } = wordWeb.getBoundingClientRect();
    wordWeb.width = initialWidth;
    wordWeb.height = initialHeight;
}

const wordTreeRenderer = new WordTreeRenderer(wordWeb);

const canvasResizeObserver = new ResizeObserver(entries => {
    const { inlineSize: width, blockSize: height } = entries[0].devicePixelContentBoxSize[0];
    const logicalHeight = entries[0].contentBoxSize[0].blockSize;
    window.requestAnimationFrame(time => {
        wordWeb.width = width;
        wordWeb.height = height;
        wordTreeRenderer.scale = height / logicalHeight;
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
        lastMousePosition = { x: e.clientX * wordTreeRenderer.scale, y: e.clientY * wordTreeRenderer.scale };
        e.preventDefault();
        cancelAnimation();
    });
    window.addEventListener("pointermove", e => {
        if (e.pointerType !== "mouse") {
            return;
        }
        if (lastMousePosition != null) {
            const newMousePosition = { x: e.clientX * wordTreeRenderer.scale, y: e.clientY * wordTreeRenderer.scale };
            wordTreeRenderer.offset = {
                x: wordTreeRenderer.offset.x + newMousePosition.x - lastMousePosition.x,
                y: wordTreeRenderer.offset.y + newMousePosition.y - lastMousePosition.y,
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
            wordTreeRenderer.setZoom(wordTreeRenderer.zoom * (1 - e.deltaY / 1000), { x: e.clientX * wordTreeRenderer.scale, y: e.clientY * wordTreeRenderer.scale });
            window.requestAnimationFrame(renderScene);
            e.preventDefault();
            cancelAnimation();
        }
    });
    wordWeb.addEventListener("click", e => {
        const mousePosition = { x: e.clientX, y: e.clientY };
        if (startMousePosition?.x == mousePosition.x && startMousePosition?.y == mousePosition.y || (e as any).pointerType !== "mouse") {
            const scaledMousePosition = { x: mousePosition.x * wordTreeRenderer.scale, y: mousePosition.y * wordTreeRenderer.scale };
            const distance = wordTreeRenderer.scaledZoom * 50;
            const foundNode = wordTreeRenderer.getNodeAt(scaledMousePosition, distance);
            if (foundNode != null) {
                wordWeb.dispatchEvent(new SelectEvent(foundNode));
            }
        }
    });
}

{
    const lastTouchPositions = new Map<number, Vector>();
    wordWeb.addEventListener("touchstart", e => {
        for (const touch of e.changedTouches) {
            lastTouchPositions.set(touch.identifier, { x: touch.clientX * wordTreeRenderer.scale, y: touch.clientY * wordTreeRenderer.scale });
        }
        cancelAnimation();
    });
    wordWeb.addEventListener("touchmove", e => {
        let lastTouchCenter = calculateTouchCenter();
        let lastTouchDistance = calculateTouchDistance();

        for (const touch of e.changedTouches) {
            const newTouchPosition = { x: touch.clientX * wordTreeRenderer.scale, y: touch.clientY * wordTreeRenderer.scale };
            lastTouchPositions.set(touch.identifier, newTouchPosition);
        }
        let newTouchCenter = calculateTouchCenter();
        let newTouchDistance = calculateTouchDistance();

        if (lastTouchCenter != null && newTouchCenter != null) {
            let updated = false;
            if (lastTouchCenter?.x != newTouchCenter?.x || lastTouchCenter?.y != newTouchCenter?.y) {
                wordTreeRenderer.offset = {
                    x: wordTreeRenderer.offset.x + newTouchCenter.x - lastTouchCenter.x,
                    y: wordTreeRenderer.offset.y + newTouchCenter.y - lastTouchCenter.y,
                };
                updated = true;
            }
            if (lastTouchDistance != null && newTouchDistance != null && lastTouchDistance != newTouchDistance) {
                const newZoom = wordTreeRenderer.zoom * newTouchDistance / lastTouchDistance;
                wordTreeRenderer.setZoom(newZoom, newTouchCenter);
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

let animateTo: (target: Vector, duration: number) => Promise<boolean>;
let cancelAnimation: () => void;
{
    let animationFrameId: number | null = null;
    let animationStart: number | null = null;
    let animationDuration: number | null = null;
    let animationStartOffset: Vector | null = null;
    let animationTargetOffset: Vector | null = null;
    let animationPromiseResolver: ((completed: boolean) => void) | null = null;

    animateTo = (target: Vector, duration: number): Promise<boolean> => {
        return new Promise<boolean>(r => {
            animationPromiseResolver = r;
            cancelAnimation();
            animationStart = performance.now();
            animationDuration = duration;
            animationStartOffset = { x: wordTreeRenderer.offset.x, y: wordTreeRenderer.offset.y };
            animationTargetOffset = target;
            animationFrameId = window.requestAnimationFrame(animate);
        });
    };

    function animate(time: DOMHighResTimeStamp): void {
        if (animationStart == null || animationDuration == null || animationStartOffset == null || animationTargetOffset == null) {
            return;
        }
        const progress = Math.min(1, (time - animationStart) / animationDuration);
        wordTreeRenderer.offset = {
            x: animationStartOffset.x + (animationTargetOffset.x - animationStartOffset.x) * progress,
            y: animationStartOffset.y + (animationTargetOffset.y - animationStartOffset.y) * progress,
        };
        renderScene(time);
        if (progress < 1) {
            animationFrameId = window.requestAnimationFrame(animate);
        } else {
            animationFrameId = null;
            animationPromiseResolver?.(true);
        }
    }

    cancelAnimation = (): void => {
        if (animationFrameId != null) {
            window.cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
            animationPromiseResolver?.(false);
        }
    };
}

wordWeb.renderTree = (root: WordNode, currentNode: WordNode | null): void => {
    wordTreeRenderer.rootNode = root;
    if (currentNode != null) {
        wordTreeRenderer.currentNodeId = currentNode.id;
    }
    else {
        window.requestAnimationFrame(renderScene);
    }
};
wordWeb.moveToNode = (node: WordNode): void => {
    const currentNodePosition = wordTreeRenderer.getPositionOfNode(node);
    wordTreeRenderer.offset = {
        x: wordWeb.width / 2 - (currentNodePosition.x - wordTreeRenderer.offset.x),
        y: wordWeb.height / 2 - (currentNodePosition.y - wordTreeRenderer.offset.y),
    };
    window.requestAnimationFrame(renderScene);
};
wordWeb.animateToNode = (node: WordNode): Promise<boolean> => {
    const currentNodePosition = wordTreeRenderer.getPositionOfNode(node);
    const targetOffset = {
        x: wordWeb.width / 2 - (currentNodePosition.x - wordTreeRenderer.offset.x),
        y: wordWeb.height / 2 - (currentNodePosition.y - wordTreeRenderer.offset.y),
    };
    return animateTo(targetOffset, 250);
};

function renderScene(_: DOMHighResTimeStamp): void {
    if (document.fonts.status !== "loaded") {
        document.fonts.ready.then(() => window.requestAnimationFrame(renderScene));
        return;
    }

    wordTreeRenderer.renderWordTree();
}

export interface WordWeb extends HTMLCanvasElement {
    addEventListener<K extends keyof GlobalEventHandlersEventMap | "nodeselected">(
        type: K,
        listener: (this: WordWeb, e: K extends keyof GlobalEventHandlersEventMap ? GlobalEventHandlersEventMap[K] : SelectEvent) => any,
        options?: boolean | AddEventListenerOptions
    ): void;

    renderTree(root: WordNode, currentNode: WordNode | null): void;

    moveToNode(node: WordNode): void;
    animateToNode(node: WordNode): Promise<boolean>;
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
