import "./styles.css";
import { input } from "./interactions/textbox.ts";
import { renderTree } from "./interactions/word-web.ts";
import { WordNode } from "./WordNode.ts";
import { treeLayout } from "./tree-layout.ts";
import { WordValidator } from "./WordValidator.ts";

const root = new WordNode("tråd");
let current = root.makeNext("träd");
const allowList = new Set<string>(await downloadAllWordsList());
const validator = new WordValidator(allowList, "värd");

input.addEventListener(
    "guess",
    e => {
        if (validator.validateGuess(current.word, e.guess)) {
            current = current.makeNext(e.guess);
            treeLayout(root);
            renderTree(root, current);
            input.clear();
        }
        else {
            input.shake();
        }
    }
);

treeLayout(root);
renderTree(root, root);

async function downloadAllWordsList(): Promise<Array<string>> {
    const response = await fetch("./all-words.json");
    const words = await response.json();
    return words;
}
