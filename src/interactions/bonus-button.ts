export const bonusButton = document.getElementById("bonus-buttons") as BonusButton;

const channel = new BroadcastChannel("bonus-channel");

const bonusBox = document.getElementById("bonus-box") as HTMLDialogElement;
const buyButton = document.getElementById("buy-bonus") as HTMLButtonElement;

const backButton = bonusButton.querySelector("#back-to-daily-button") as HTMLButtonElement;
backButton.addEventListener("click", () => {
    bonusButton.dispatchEvent(new BackToDailyEvent(goToStartingState));
});
const startBonusGameButton = bonusButton.querySelector("#start-bonus-game-button") as HTMLButtonElement;
const startBonusGameText = startBonusGameButton.querySelector("span") as HTMLSpanElement;
const startBonusGameIcon = startBonusGameButton.querySelector("svg") as SVGSVGElement;
startBonusGameButton.addEventListener("click", () => {
    if (getPurchaseState()) {
        goToLoadingState();
        bonusButton.dispatchEvent(new StartBonusGameEvent(goToBonusState, goToStartingState));
    }
    else {
        bonusBox.showModal();
    }
});

buyButton.addEventListener("click", () => {
    channel.addEventListener("message", afterPurchase);
    window.open(import.meta.env.VITE_PAYMENT_URL, "_blank", "popup");

    function afterPurchase(e: MessageEvent): void {
        if (e.data?.kind !== "purchase-success") return;

        channel.removeEventListener("message", afterPurchase);
        bonusBox.close();
        goToLoadingState();
        bonusButton.dispatchEvent(new StartBonusGameEvent(goToBonusState, goToStartingState));
    }
});
bonusBox.querySelector(".close-button")?.addEventListener("click", () => {
    bonusBox.close();
});

function goToStartingState(): void {
    backButton.hidden = true;
    startBonusGameText.hidden = false;
    startBonusGameIcon.classList.remove("loading");
}

function goToLoadingState(): void {
    startBonusGameIcon.classList.add("loading");
}

function goToBonusState(): void {
    backButton.hidden = false;
    startBonusGameText.hidden = true;
    startBonusGameIcon.classList.remove("loading");
}

const purchaseState = "purchase-state";
function getPurchaseState(): boolean {
    return JSON.parse(localStorage.getItem(purchaseState) ?? "false");
}

export interface BonusButton extends HTMLDivElement {
    addEventListener<K extends keyof GlobalEventHandlersEventMap | "startbonusgame" | "backtodaily">(
        type: K,
        listener: (
            this: BonusButton,
            e: K extends keyof GlobalEventHandlersEventMap
                ? GlobalEventHandlersEventMap[K]
                : K extends "startbonusgame"
                    ? StartBonusGameEvent
                    : BackToDailyEvent
        ) => any,
        options?: boolean | AddEventListenerOptions
    ): void;
}

export class StartBonusGameEvent extends Event {
    public constructor(
        public readonly success: () => void,
        public readonly fail: () => void) {
        super("startbonusgame");
    }
}

export class BackToDailyEvent extends Event {
    public constructor(public readonly success: () => void) {
        super("backtodaily");
    }
}
