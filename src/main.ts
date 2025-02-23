import "./styles.css";
import { defineButton } from "./interactions/define-button.ts";
import { input } from "./interactions/textbox.ts";
import { wordWeb } from "./interactions/word-web.ts";
import { howToPlay } from "./interactions/how-to-play.ts";
import { toast } from "./interactions/toast.ts";
import { loadWordNode, WordNode } from "./WordNode.ts";
import { treeLayout } from "./tree-layout.ts";
import { ValidationResult, WordValidator } from "../shared/WordValidator.ts";
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

        const dailyWords = await downloadDailyWords();
        const currentFromWord = dailyWords[currentDayId()].from;

        let state = load();
        if (state == null) {
            howToPlay.showModal();
            state = await fetchDailyProblem(null);
        }
        if (state?.dayId !== currentDayId()) {
            state = await fetchDailyProblem(state);
        }
        let { rootNode, currentNode, goal, dayId } = state;
        rootNode
            .findDeepest(n => (n.isEnd || n.isDisjointChild || n.parent == null) && n.word === currentFromWord)!
            .visit(n => {
                if (n.word !== goal) {
                    n.isActive = true;
                }
            });
        defineButton.setWord(currentNode.word);

        document.getElementById("goal")!.textContent = goal;
        input.setIsActive(currentNode.isActive);

        const allowList = new Set<string>(await downloadWordList("all-words.json"));
        const validator = new WordValidator(allowList, goal);

        input.addEventListener(
            "guess",
            e => {
                const validationResult = validator.validateGuess(currentNode.word, e.guess);
                if (validationResult === ValidationResult.Success) {
                    currentNode = currentNode.makeNext(e.guess, e.guess == goal);
                    treeLayout(rootNode);
                    wordWeb.renderTree(rootNode, currentNode);
                    wordWeb.animateToNode(currentNode);
                    input.clear();
                    input.setIsActive(currentNode.isActive);
                    defineButton.setWord(currentNode.word);
                    save({ rootNode, currentNode, goal, dayId });
                }
                else {
                    switch (validationResult) {
                        case ValidationResult.IllegalMove:
                            toast.show("Ogiltigt drag");
                            break;
                        case ValidationResult.UnknownWord:
                            toast.show("Okänt ord");
                            break;
                        default:
                            toast.show(ValidationResult[validationResult]);
                            break;
                    }
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
                input.setIsActive(currentNode.isActive);
                defineButton.setWord(currentNode.word);
                if (currentNode.isActive) {
                    input.focus();
                }
                save({ rootNode, currentNode, goal, dayId });
            }
        );

        document.getElementById("help")?.addEventListener("click", () => {
            howToPlay.showModal();
        });

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
                const currentNode = lastNode.addChild(from, false, false, true);
                save({ rootNode: state.rootNode, currentNode, goal, dayId });
                return { rootNode: state.rootNode, currentNode, goal, dayId };
            }

            const rootNode = new WordNode(from);

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
