export const defineButton = document.getElementById("define") as HTMLDefineElement;

defineButton.setWord = (word: string): void => {
    defineButton.href = `https://sv.wiktionary.org/wiki/${word}`;
};

if (navigator.onLine === false) {
    defineButton.hidden = true;
}
window.addEventListener("online", () => defineButton.hidden = false);
window.addEventListener("offline", () => defineButton.hidden = true);

export interface HTMLDefineElement extends HTMLAnchorElement {
    setWord(word: string): void;
}
