import { readFileSync } from "fs";
import { findPathToNextGoal } from "./src/pathFinder";

const filePath = process.argv[2];
const wordList = new Set(JSON.parse(readFileSync(filePath, "utf8")));
console.log(wordList[Math.floor(Math.random() * wordList.size)]);
