import { WordNode } from "../WordNode";

export const victoryBox = document.getElementById("victory-box") as HTMLVictoryBoxElement;
const stepsDisplay = document.getElementById("steps") as HTMLSpanElement;
const shareParagraph = document.getElementById("share-paragraph") as HTMLParagraphElement;
const shareButton = document.getElementById("share-button") as HTMLButtonElement;

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

    shareData = {
        title: "Ord Tråd",
        text: `Jag löste dagens Ord Tråd på ${steps} drag!`,
        url: window.location.href,
    };
    shareParagraph.style.display = navigator.canShare(shareData) ? "block" : "none";

    victoryBox.showModal();
};

export interface HTMLVictoryBoxElement extends HTMLDialogElement {
    showVictory(startNode: WordNode, endNode: WordNode): void;
}
