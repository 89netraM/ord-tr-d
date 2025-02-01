import { readFileSync, writeFileSync } from "fs";
import { XORShift } from "random-seedable";
import { findPathToNextGoal } from "./pathFinder";
import { join } from "path";

const wordList = new Set<string>(JSON.parse(readFileSync(join(__dirname, "../public/common-words.json"), "utf8")));

const pathLength = 4;
const random = new XORShift(1337);
let fromWord = "tråd";

const goalWords = new Set<string>([fromWord]);
const dailyWords: { [day: number]: { from: string, to: string }} = {};

for (let day = 0; true; day++) {
    let path = findPathToNextGoal(wordList, pathLength, goalWords, fromWord, random);
    if (path == null) {
        break;
    }
    let toWord = path[path.length - 1];
    dailyWords[day] = { from: fromWord, to: toWord };
    goalWords.add(toWord);
    fromWord = toWord;
}

writeFileSync(join(__dirname, "../public/daily-words.json"), JSON.stringify(dailyWords), "utf8");
