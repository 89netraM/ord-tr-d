export const howToPlay = document.getElementById("how-to-play") as HTMLDialogElement;

howToPlay.querySelectorAll(".close-button").forEach(b => b.addEventListener("click", () => howToPlay.close()));

howToPlay.addEventListener("click", e => {
    var rect = howToPlay.getBoundingClientRect();
    var isInDialog = rect.top <= e.clientY
        && e.clientY <= rect.top + rect.height
        && rect.left <= e.clientX
        && e.clientX <= rect.left + rect.width;
    if (!isInDialog) {
        howToPlay.close();
    }
});
