const canvas = document.getElementById("word-web") as ScaledHTMLCanvasElement;
{
    const { width: initialWidth, height: initialHeight } = canvas.getBoundingClientRect();
    canvas.width = initialWidth;
    canvas.height = initialHeight;
    canvas.scale = 1.0;
}
const ctx = canvas.getContext("2d")!;

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

window.requestAnimationFrame(renderScene);

function renderScene(time: DOMHighResTimeStamp): void {
    const { width, height, scale } = canvas;
    ctx.clearRect(0, 0, width, height);

    renderText(width / 2, height / 2, "tråd");

    function renderText(x: number, y: number, text: string): void {
        ctx.font = `${3 * scale}rem "Comic Sans MS", "Comic Sans", cursive`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, x, y);
    }
}


interface ScaledHTMLCanvasElement extends HTMLCanvasElement {
    scale: number;
}
