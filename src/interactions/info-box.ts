export const infoBox = document.getElementById("info-box") as HTMLDialogElement;

infoBox.querySelectorAll(".close-button").forEach(b => b.addEventListener("click", () => infoBox.close()));

infoBox.addEventListener("click", e => {
    var rect = infoBox.getBoundingClientRect();
    var isInDialog = rect.top <= e.clientY
        && e.clientY <= rect.top + rect.height
        && rect.left <= e.clientX
        && e.clientX <= rect.left + rect.width;
    if (!isInDialog) {
        infoBox.close();
    }
});

document.getElementById("info")?.addEventListener("click", () => {
    infoBox.showModal();
});
