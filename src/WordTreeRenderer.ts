import { WordNode } from "./WordNode";

export class WordTreeRenderer {
    readonly #canvas: HTMLCanvasElement | OffscreenCanvas;
    readonly #ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

    public rootNode: WordNode | null = null;
    public currentNodeId: number | null = null;
    public offset: Vector = { x: 0, y: 0 };
    public scale: number = 1.0;
    public zoom: number = 1.0;

    public levelDistance: number = 250;
    public offsetSpacing: number = 150;

    public get scaledZoom(): number {
        return this.scale * this.zoom;
    }

    public wordTransformer: (node: WordNode) => string = n => n.word;

    readonly #nodePositions: Array<[Vector, WordNode]> = [];

    public constructor(canvas: HTMLCanvasElement | OffscreenCanvas) {
        this.#canvas = canvas;
        this.#ctx = this.#canvas.getContext("2d")!;
    }

    public renderContained(): void {
        if (this.rootNode == null) {
            return;
        }

        let minLevel = this.rootNode.level;
        let maxLevel = this.rootNode.level;
        let minOffset = this.rootNode.offset;
        let maxOffset = this.rootNode.offset;
        this.rootNode.visit(n => {
            minLevel = Math.min(minLevel, n.level);
            maxLevel = Math.max(maxLevel, n.level);
            minOffset = Math.min(minOffset, n.offset);
            maxOffset = Math.max(maxOffset, n.offset);
        });

        const width = (maxLevel - minLevel + 1) * this.levelDistance;
        const height = (maxOffset - minOffset + 1) * this.offsetSpacing;
        const widthZoom = this.#canvas.width / width;
        const heightZoom = this.#canvas.height / height;
        this.zoom = Math.min(widthZoom, heightZoom);

        this.offset = {
            x: -minLevel * this.levelDistance * this.scaledZoom + (this.#canvas.width - (width - this.levelDistance) * this.scaledZoom) / 2,
            y: -minOffset * this.offsetSpacing * this.scaledZoom + (this.#canvas.height - (height - this.offsetSpacing) * this.scaledZoom) / 2,
        };

        this.renderWordTree();
    }

    public renderWordTree(): void {
        const { width, height } = this.#canvas;

        this.#ctx.clearRect(0, 0, width, height);

        this.#nodePositions.splice(0, this.#nodePositions.length);
        if (this.rootNode == null) {
            return;
        }
        this.#renderNode(this.rootNode);
    }

    #renderNode(node: WordNode): void {
        const pos = this.getPositionOfNode(node);
        for (const child of node.children) {
            if (!child.isDisjointChild) {
                this.#renderEdge(pos, this.getPositionOfNode(child));
            }
        }
        for (const child of node.children) {
            this.#renderNode(child);
        }
        if (this.currentNodeId == node.id) {
            this.#renderUnderline(pos, node.word, this.#getNodeColor(node));
        }
        this.#renderText(pos, this.wordTransformer(node), this.#getNodeColor(node));
        this.#nodePositions.push([pos, node]);
    }

    #renderEdge(from: Vector, to: Vector): void {
        this.#ctx.strokeStyle = "#bada55";
        this.#ctx.lineWidth = 2 * this.scaledZoom;
        this.#ctx.beginPath();
        this.#ctx.moveTo(from.x, from.y);
        this.#ctx.lineTo(to.x, to.y);
        this.#ctx.stroke();
    }

    #getNodeColor(node: WordNode): string {
        if (node.isEnd) {
            return "#ffd700";
        } else {
            return "#ffffff";
        }
    }

    #renderText(pos: Vector, text: string, color: string): void {
        this.#nodeTextStyling(color);
        this.#ctx.fillText(text, pos.x, pos.y);
        this.#ctx.strokeText(text, pos.x, pos.y);
    }

    #renderUnderline(pos: Vector, text: string, color: string): void {
        this.#nodeTextStyling(color);
        this.#ctx.lineWidth = 5 * this.scaledZoom;
        const measurements = this.#ctx.measureText(text);
        this.#ctx.beginPath();
        this.#ctx.moveTo(pos.x - measurements.width / 2, pos.y + measurements.fontBoundingBoxDescent / 2 + 4 * this.scaledZoom);
        this.#ctx.lineTo(pos.x + measurements.width / 2, pos.y + measurements.fontBoundingBoxDescent / 2 + 4 * this.scaledZoom);
        this.#ctx.stroke();
        this.#ctx.lineWidth = 1 * this.scaledZoom;
        this.#ctx.strokeStyle = color;
        this.#ctx.stroke();
    }

    #nodeTextStyling(color: string): void {
        const remSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
        this.#ctx.font = `${3 * this.scaledZoom * remSize}px "Comic Neue"`;
        this.#ctx.textAlign = "center";
        this.#ctx.textBaseline = "middle";
        this.#ctx.strokeStyle = "#000000";
        this.#ctx.fillStyle = color;
        this.#ctx.lineWidth = 2 * this.scaledZoom;
        this.#ctx.lineCap = "round";
    }

    public setZoom(newZoom: number, around: Vector): void {
        newZoom = Math.max(0.1, Math.min(10, newZoom));
        const diff = newZoom - this.zoom;
        this.offset = {
            x: this.offset.x + (this.offset.x - around.x) * diff / this.zoom,
            y: this.offset.y + (this.offset.y - around.y) * diff / this.zoom,
        };
        this.zoom = newZoom;
    }

    public getPositionOfNode(node: WordNode): Vector {
        return {
            x: node.level * this.levelDistance * this.scaledZoom + this.offset.x,
            y: node.offset * this.offsetSpacing * this.scaledZoom + this.offset.y,
        }
    }

    public getNodeAt(target: Vector, distance: number): WordNode | null {
        for (const [pos, node] of this.#nodePositions) {
            if (Math.hypot(target.x - pos.x, target.y - pos.y) < distance) {
                return node;
            }
        }
        return null;
    }
}

interface Vector {
    readonly x: number;
    readonly y: number;
}
