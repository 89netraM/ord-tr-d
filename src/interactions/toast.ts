export const toast = document.getElementById("toast") as HTMLToastElement;

const displayAnimationOptions: KeyframeAnimationOptions = {
    duration: 2000,
    direction: "alternate",
    iterations: 2
};
const displayAnimationKeyframes: Array<Keyframe> = [
    {
        display: "block",
        transform: "scale(0.75)",
        offset: 0,
    },
    {
        display: "block",
        transform: "scale(1)",
        offset: 100 / (displayAnimationOptions.duration as number),
    },
];

let currentAnimation: Animation | null = null;
(window as any).showToast = toast.show = (message: string): void => {
    currentAnimation?.cancel();
    toast.innerText = message;
    currentAnimation = toast.animate(displayAnimationKeyframes, displayAnimationOptions);
};

export interface HTMLToastElement extends HTMLDivElement {
    show(message: string): void;
}
