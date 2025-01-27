import { XORShift } from "random-seedable";
import "./styles.css";
import { input } from "./interactions/textbox.ts";
import { wordWeb } from "./interactions/word-web.ts";
import { loadWordNode, WordNode } from "./WordNode.ts";
import { treeLayout } from "./tree-layout.ts";
import { WordValidator } from "./WordValidator.ts";
import { findPathToNextGoal } from "./pathFinder.ts";
import { downloadWordsList as downloadWordList } from "./wordList.ts";

window.addEventListener(
    "load",
    async () => {
        if ("virtualKeyboard" in navigator) {
            (navigator.virtualKeyboard as any).overlaysContent = true;
            document.getElementById("viewport")?.setAttribute("content", "width=device-width, initial-scale=1.0");
        }

        let { rootNode: root, currentNode: current, goal, dayId } = load() ?? await generateDailyProblem();
        if (dayId !== currentDayId()) {
            ({ rootNode: root, currentNode: current, goal, dayId } = await generateDailyProblem());
        }

        document.getElementById("goal")!.textContent = goal;

        const allowList = new Set<string>(await downloadWordList("all-words.json"));
        const validator = new WordValidator(allowList, goal);

        input.addEventListener(
            "guess",
            e => {
                if (validator.validateGuess(current.word, e.guess)) {
                    current = current.makeNext(e.guess, e.guess == goal);
                    treeLayout(root);
                    wordWeb.renderTree(root, current);
                    wordWeb.animateToNode(current);
                    input.clear();
                    save(root, current, goal, dayId);
                }
                else {
                    input.shake();
                }
            }
        );

        wordWeb.addEventListener(
            "nodeselected",
            e => {
                current = e.selectedNode;
                wordWeb.renderTree(root, e.selectedNode);
                wordWeb.animateToNode(current);
                input.focus();
                save(root, current, goal, dayId);
            }
        );

        treeLayout(root);
        wordWeb.renderTree(root, current);
        wordWeb.moveToNode(current);

        function load(): { rootNode: WordNode, currentNode: WordNode, goal: string, dayId: string } | null {
            const saveState = localStorage.getItem("save-state");
            if (saveState == null) {
                return null;
            }
            const { wordNodeDb, currentId, goalWord, dayId } = JSON.parse(saveState);
            const rootNode = loadWordNode(wordNodeDb);
            const currentNode = rootNode.find(currentId)!;
            return { rootNode, currentNode, goal: goalWord, dayId };
        }

        async function generateDailyProblem(): Promise<{ rootNode: WordNode, currentNode: WordNode, goal: string, dayId: string }> {
            const commonWords = await downloadWordList("common-words.json");

            const dayId = currentDayId();
            const random = new XORShift(new Date(dayId).getTime());

            const start = random.choice(commonWords);
            const rootNode = new WordNode(start);
            const pathToGoal = findPathToNextGoal(new Set(commonWords), [], start, random)!;
            const goal = pathToGoal[pathToGoal.length - 1];
            save(rootNode, rootNode, goal, dayId);
            return { rootNode, currentNode: rootNode, goal, dayId };
        }

        function save(root: WordNode, current: WordNode, goal: string, dayId: string) {
            const saveState = JSON.stringify({
                wordNodeDb: Array.from(root.save()),
                currentId: current.id,
                goalWord: goal,
                dayId,
            });
            localStorage.setItem("save-state", saveState);
        }

        function currentDayId(): string {
            return new Date().toISOString().substring(0, 10);
        }
    }
);
