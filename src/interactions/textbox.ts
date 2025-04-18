const guessTextbox = document.getElementById("guess-textbox") as HTMLInputElement;
const guessLetters = document.querySelectorAll(".guess-letter") as NodeListOf<HTMLSpanElement>;
const guessButton = document.getElementById("guess-button") as HTMLButtonElement;

guessTextbox.addEventListener(
    "input",
    _ => {
        if (guessTextbox.disabled) return;
        updateLetterSelection();
        guessTextbox.value = guessTextbox.value.toLowerCase().substring(0, 4);
        guessLetters.forEach(
            (letter, i) => {
                letter.textContent = guessTextbox.value[i] ?? "";
            }
        );
    }
);
guessTextbox.addEventListener("focus", updateLetterSelection);
guessTextbox.addEventListener("selectionchange", updateLetterSelection);
guessTextbox.addEventListener(
    "blur",
    e => {
        guessLetters.forEach(
            letter => letter.classList.remove("selected")
        );
        if (e.relatedTarget === guessButton) {
            e.preventDefault();
            guessTextbox.focus();
        }
    }
);
guessTextbox.addEventListener(
    "keydown",
    e => {
        if (guessTextbox.disabled) return;
        if (e.key === "Enter") {
            e.target?.dispatchEvent(new GuessEvent(guessTextbox.value));
        }
    }
);

guessButton.addEventListener(
    "click",
    e => {
        if (guessTextbox.disabled) return;
        e.target?.dispatchEvent(new GuessEvent(guessTextbox.value));
    }
);

guessLetters.forEach(
    (letter, i) => {
        letter.addEventListener(
            "click",
            _ => {
                guessTextbox.focus();
                guessTextbox.setSelectionRange(i, i + 1);
            }
        );
    }
);

function updateLetterSelection() {
    const selectionStart = guessTextbox.selectionStart ?? 0;
    guessLetters.forEach(
        (letter, i) => {
            if (i === selectionStart) {
                letter.classList.add("selected");
            } else {
                letter.classList.remove("selected");
            }
        }
    );
    guessTextbox.setSelectionRange(selectionStart, selectionStart + 1);
}

export const input = document.getElementById("input") as GuessInput;

const shakeAnimation: Array<Keyframe> = [
    { transform: "translateX(-0.25em)" },
    { transform: "translateX(0.25em)" },
];
const shakeTiming: KeyframeAnimationOptions = {
    duration: 75,
    iterations: 4,
    direction: "alternate",
    easing: "ease-in-out",
};
const vibrationPattern = [37.5, 37.5, 37.5, 37.5, 37.5, 37.5, 37.5, 37.5];
input.shake = () => {
    guessLetters.forEach(guessLetter => guessLetter.animate(shakeAnimation, shakeTiming));
    guessButton.animate(shakeAnimation, shakeTiming);
    navigator.vibrate?.(vibrationPattern);
};
input.focus = () => guessTextbox.focus();

input.clear = () => {
    guessTextbox.value = "";
    guessLetters.forEach(letter => letter.textContent = "");
    updateLetterSelection();
};

input.setIsActive = (value: boolean) => {
    guessTextbox.disabled = !value;
};

export interface GuessInput extends HTMLDivElement {
    addEventListener<K extends keyof GlobalEventHandlersEventMap | "guess">(
        type: K,
        listener: (this: GuessInput, e: K extends keyof GlobalEventHandlersEventMap ? GlobalEventHandlersEventMap[K] : GuessEvent) => any,
        options?: boolean | AddEventListenerOptions
    ): void;

    shake(): void;

    clear(): void;

    focus(): void;

    setIsActive(value: boolean): void;
}

export class GuessEvent extends Event {
    public constructor(public guess: string) {
        super("guess", { bubbles: true });
    }
}
