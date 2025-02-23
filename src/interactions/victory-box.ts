import { WordNode } from "../WordNode";
import { WordTreeRenderer } from "../WordTreeRenderer";

export const victoryBox = document.getElementById("victory-box") as HTMLVictoryBoxElement;
const stepsDisplay = document.getElementById("steps") as HTMLSpanElement;
const shareButton = document.getElementById("share-button") as HTMLButtonElement;

const shareCanvas = document.getElementById("share-canvas") as HTMLCanvasElement;
const shareCanvasCtx = shareCanvas.getContext("bitmaprenderer")!;

const installButton = document.getElementById("install-button") as HTMLButtonElement;

const offscreenCanvas = new OffscreenCanvas(shareCanvas.width, shareCanvas.height);
const wordTreeRenderer = new WordTreeRenderer(offscreenCanvas);
wordTreeRenderer.levelDistance = 150;
wordTreeRenderer.offsetSpacing = 50;
const letters = "abcdefghijklmnopqrstuvwxyzåäö";

let shareData: ShareData | null = null;

victoryBox.querySelectorAll(".close-button").forEach(b => b.addEventListener("click", () => victoryBox.close()));

victoryBox.addEventListener("click", e => {
    var rect = victoryBox.getBoundingClientRect();
    var isInDialog = rect.top <= e.clientY
        && e.clientY <= rect.top + rect.height
        && rect.left <= e.clientX
        && e.clientX <= rect.left + rect.width;
    if (!isInDialog) {
        victoryBox.close();
    }
});

shareButton.addEventListener("click", () => {
    if (shareData != null) {
        navigator.share(shareData);
    }
});

victoryBox.showVictory = (startNode: WordNode, endNode: WordNode): void => {
    const steps = endNode.level - startNode.level;
    stepsDisplay.innerText = `${steps}`;

    // Render to canvas
    wordTreeRenderer.rootNode = startNode;
    wordTreeRenderer.wordTransformer = n => n.word;
    wordTreeRenderer.renderContained();
    shareCanvasCtx.transferFromImageBitmap(offscreenCanvas.transferToImageBitmap());

    if ("share" in navigator) {
        shareData = {
            text: `Jag löste dagens Ord Tråd på ${steps} drag!\nhttps://ord-tråd.se/`,
        };
        shareButton.style.display = navigator.canShare(shareData) ? "flex" : "none";
        // Render to screenshot
        wordTreeRenderer.wordTransformer = n =>
            n === startNode || n.word === endNode.word
                ? n.word
                : [...n.word].map(_ => letters[Math.floor(Math.random() * letters.length)]).join("");
        wordTreeRenderer.renderWordTree();
        offscreenCanvas.convertToBlob().then(shareScreenshot);
    }

    victoryBox.showModal();
};

function shareScreenshot(blob: Blob | null): void {
    if (blob == null) {
        return;
    }

    const screenshot = new File([blob], "ord-trad.png", { type: blob.type });
    const shareDataWithScreenshot: ShareData = {
        ...shareData,
        files: [screenshot],
    };
    if (navigator.canShare(shareDataWithScreenshot)) {
        shareData = shareDataWithScreenshot;
        shareButton.style.display = "flex";
    }
}

let installPrompt: any = null;
window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    installPrompt = e;
    installButton.style.display = "flex";
});
installButton.addEventListener("click", async _ => {
    const result = await installPrompt?.prompt();
    if (result?.outcome === "accepted") {
        installButton.style.display = "none";
    }
});

export interface HTMLVictoryBoxElement extends HTMLDialogElement {
    showVictory(startNode: WordNode, endNode: WordNode): void;
}
