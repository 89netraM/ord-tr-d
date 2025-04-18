import "./styles.css";
import { defineButton } from "./interactions/define-button.ts";
import { input } from "./interactions/textbox.ts";
import { wordWeb } from "./interactions/word-web.ts";
import { howToPlay } from "./interactions/how-to-play.ts";
import "./interactions/info-box.ts";
import { toast } from "./interactions/toast.ts";
import { victoryBox } from "./interactions/victory-box.ts";
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

        const [initialState, isFirstTime] = loadDaily();
        if (isFirstTime) {
            howToPlay.showModal();
        }
        let { rootNode, currentNode, goal, dayId, currentFromWord } = setupState(initialState);

        const allowList = new Set<string>(await downloadWordList("all-words.json"));
        const validator = new WordValidator(allowList, goal);

        input.addEventListener(
            "guess",
            e => {
                const validationResult = validator.validateGuess(currentNode.word, e.guess);
                if (validationResult === ValidationResult.Success) {
                    if (e.guess.toLocaleLowerCase("sv") === goal.toLocaleLowerCase("sv")) {
                        e.guess = goal;
                    }
                    currentNode = currentNode.makeNext(e.guess, e.guess == goal);
                    treeLayout(rootNode);
                    wordWeb.renderTree(rootNode, currentNode);
                    const animationPromise = wordWeb.animateToNode(currentNode);
                    input.clear();
                    input.setIsActive(currentNode.isActive);
                    defineButton.setWord(currentNode.word);
                    save({ rootNode, currentNode, goal, dayId });

                    if (e.guess == goal) {
                        const startNode = rootNode.findDeepest(n => (n.isEnd || n.isDisjointChild || n.parent == null) && n.word === currentFromWord)!;
                        animationPromise
                            .then(completed => completed ? new Promise<void>(r => setTimeout(r, 200)) : null)
                            .then(() => victoryBox.showVictory(startNode, currentNode));
                    }
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

        function loadDaily(): [State, boolean] {
            let state = load();
            let isFirstTime = state == null;
            if (state?.dayId !== currentDayId()) {
                state = fetchDailyProblem(state);
            }
            return [state, isFirstTime];
        }

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

        function fetchDailyProblem(state: State | null): State {
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

        function setupState(state: State): State & { currentFromWord: string } {
            const currentFromWord = dailyWords[state.dayId].from;
            state.rootNode
                .findDeepest(n => (n.isEnd || n.isDisjointChild || n.parent == null) && n.word === currentFromWord)!
                .visit(n => {
                    if (n.word !== state.goal) {
                        n.isActive = true;
                    }
                });
            defineButton.setWord(state.currentNode.word);

            document.getElementById("goal")!.textContent = state.goal;
            input.setIsActive(state.currentNode.isActive);

            treeLayout(state.rootNode);
            wordWeb.renderTree(state.rootNode, state.currentNode);
            wordWeb.moveToNode(state.currentNode);

            return { ...state, currentFromWord };
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
