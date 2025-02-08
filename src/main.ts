import "./styles.css";
import { input } from "./interactions/textbox.ts";
import { wordWeb } from "./interactions/word-web.ts";
import { loadWordNode, WordNode } from "./WordNode.ts";
import { treeLayout } from "./tree-layout.ts";
import { WordValidator } from "../shared/WordValidator.ts";
import { downloadWordList, downloadDailyWords } from "./wordList.ts";

window.addEventListener(
    "load",
    async () => {
        if ("virtualKeyboard" in navigator) {
            (navigator.virtualKeyboard as any).overlaysContent = true;
            document.getElementById("viewport")?.setAttribute("content", "width=device-width, initial-scale=1.0");
        }

        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("service-worker.js");
        }

        let state = load() ?? await fetchDailyProblem(null);
        if (state?.dayId !== currentDayId()) {
            state = await fetchDailyProblem(state);
        }
        let { rootNode, currentNode, goal, dayId } = state;

        document.getElementById("goal")!.textContent = goal;

        const allowList = new Set<string>(await downloadWordList("all-words.json"));
        const validator = new WordValidator(allowList, goal);

        input.addEventListener(
            "guess",
            e => {
                if (validator.validateGuess(currentNode.word, e.guess)) {
                    currentNode = currentNode.makeNext(e.guess, e.guess == goal);
                    treeLayout(rootNode);
                    wordWeb.renderTree(rootNode, currentNode);
                    wordWeb.animateToNode(currentNode);
                    input.clear();
                    save({ rootNode, currentNode, goal, dayId });
                }
                else {
                    input.shake();
                }
            }
        );

        wordWeb.addEventListener(
            "nodeselected",
            e => {
                currentNode = e.selectedNode;
                wordWeb.renderTree(rootNode, e.selectedNode);
                wordWeb.animateToNode(currentNode);
                input.focus();
                save({ rootNode, currentNode, goal, dayId });
            }
        );

        treeLayout(rootNode);
        wordWeb.renderTree(rootNode, currentNode);
        wordWeb.moveToNode(currentNode);

        function load(): State | null {
            const saveState = localStorage.getItem("save-state");
            if (saveState == null) {
                return null;
            }
            const { wordNodeDb, currentId, goalWord, dayId } = JSON.parse(saveState);
            const rootNode = loadWordNode(wordNodeDb);
            const currentNode = rootNode.find(n => n.id === currentId)!;
            return { rootNode, currentNode, goal: goalWord, dayId };
        }

        async function fetchDailyProblem(state: State | null): Promise<State> {
            const dayId = currentDayId();
            const dailyWords = await downloadDailyWords();
            const from = dailyWords[dayId].from;
            const goal = dailyWords[dayId].to;

            if (state?.goal === from) {
                const previousGoal = state.rootNode.find(n => n.word === from && n.isEnd);
                if (previousGoal != null) {
                    save({ rootNode: state.rootNode, currentNode: previousGoal, goal, dayId });
                    return { rootNode: state.rootNode, currentNode: previousGoal, goal, dayId };
                }
            }

            if (state != null) {
                const lastNode = (state.rootNode.findDeepest(n => n.isEnd) ?? state.rootNode).findDeepest(_ => true)!;
                const currentNode = lastNode.addChild(from, false, true);
                save({ rootNode: state.rootNode, currentNode, goal, dayId });
                return { rootNode: state.rootNode, currentNode, goal, dayId };
            }

            const rootNode = new WordNode(from);

            save({ rootNode, currentNode: rootNode, goal, dayId });
            return { rootNode, currentNode: rootNode, goal, dayId };
        }

        function save(state: State) {
            const saveState = JSON.stringify({
                wordNodeDb: Array.from(state.rootNode.save()),
                currentId: state.currentNode.id,
                goalWord: state.goal,
                dayId: state.dayId,
            });
            localStorage.setItem("save-state", saveState);
        }

        function currentDayId(): number {
            const startDay = new Date(2025, 1, 1).getTime();
            const now = Date.now();
            return Math.floor((now - startDay) / 86400000);
        }
    }
);

interface State {
    rootNode: WordNode;
    currentNode: WordNode;
    goal: string;
    dayId: number;
}
