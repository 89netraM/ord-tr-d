import { findPathToNextGoal } from "../shared/pathFinder";
import { downloadWordList } from "./wordList";

self.addEventListener("message", async e => {
    if (e.data?.kind === "calculate-path") {
        const path = await calculatePath();
        self.postMessage({ kind: "calculated-path", path });
    }
});

async function calculatePath(): Promise<Array<string>> {
    const allowList = await fetchAllowList();
    let path = findPathToNextGoal(
        new Set<string>(allowList),
        4,
        new Set<string>(),
        allowList[Math.floor(Math.random() * allowList.length)],
        shuffle);
    return path ?? calculatePath();
}

let allowList: ReadonlyArray<string> | null = null;
async function fetchAllowList(): Promise<ReadonlyArray<string>> {
    return allowList ??= await downloadWordList("/all-words.json");
}

function shuffle<T>(array: Array<T>): Array<T> {
    for (let i = 0; i < array.length - 1; i++) {
        const swapI = i + 1 + Math.floor(Math.random() * (array.length - i - 1));
        [array[i], array[swapI]] = [array[swapI], array[i]];
    }
    return array;
}
