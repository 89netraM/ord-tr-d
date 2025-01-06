import "./styles.css";
import { input } from "./interactions/textbox.ts";
import { wordWeb } from "./interactions/word-web.ts";
import { WordNode } from "./WordNode.ts";
import { treeLayout } from "./tree-layout.ts";
import { WordValidator } from "./WordValidator.ts";

const root = new WordNode("tråd", true);
let current = root;
const allowList = new Set<string>(await downloadAllWordsList());
const validator = new WordValidator(allowList, "värd");

input.addEventListener(
    "guess",
    e => {
        if (validator.validateGuess(current.word, e.guess)) {
            current = current.makeNext(e.guess, e.guess == "värd");
            treeLayout(root);
            wordWeb.renderTree(root, current);
            input.clear();
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
        input.focus();
    }
);

treeLayout(root);
wordWeb.renderTree(root, current);

async function downloadAllWordsList(): Promise<Array<string>> {
    const response = await fetch("./all-words.json");
    const words = await response.json();
    return words;
}
