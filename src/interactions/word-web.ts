import { WordNode } from "../WordNode";

const canvas = document.getElementById("word-web") as ScaledHTMLCanvasElement;
{
    const { width: initialWidth, height: initialHeight } = canvas.getBoundingClientRect();
    canvas.width = initialWidth;
    canvas.height = initialHeight;
    canvas.scale = 1.0;
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
        canvas.scale = height / logicalHeight;
        renderScene(time);
    });
});
canvasResizeObserver.observe(canvas);

export function renderTree(root: WordNode, currentNode: WordNode | null): void {
    rootNode = root;
    if (currentNode != null) {
        offset = {
            x: -currentNode.level * 250 * canvas.scale + canvas.width / 2,
            y: -currentNode.offset * 150 * canvas.scale + canvas.height / 2
        };
    }
    window.requestAnimationFrame(renderScene);
}

function renderScene(_: DOMHighResTimeStamp): void {
    const { width, height, scale: pixelScale } = canvas;
    const scale = pixelScale * zoom;

    ctx.clearRect(0, 0, width, height);

    if (rootNode == null) {
        return;
    }
    renderNode(rootNode);

    function renderNode(node: WordNode): void {
        const pos = getPositionOfNode(node);
        for (const child of node.children) {
            renderEdge(pos, getPositionOfNode(child));
            renderNode(child);
        }
        renderText(pos.x, pos.y, node.word);
    }

    function getPositionOfNode(node: WordNode): Vector {
        return {
            x: node.level * 250 * scale + offset.x,
            y: node.offset * 150 * scale + offset.y,
        }
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

interface ScaledHTMLCanvasElement extends HTMLCanvasElement {
    scale: number;
}

interface Vector {
    readonly x: number;
    readonly y: number;
}
