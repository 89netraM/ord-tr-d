import "./styles.css";
import { input } from "./interactions/textbox.ts";
import "./interactions/word-web.ts";

input.addEventListener(
    "guess",
    _ => {
        input.shake();
        input.clear();
    }
);
