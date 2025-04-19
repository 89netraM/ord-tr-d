import { WordValidator } from "./WordValidator";

export function findPathToNextGoal(wordList: ReadonlySet<string>, pathLength: number, forbiddenWords: ReadonlySet<string>, fromWord: string, shuffler: (array: Array<string>) => Array<string>): Array<string> | null {
    const validator = new WordValidator(wordList, null);
    const visitedWords = new Map([[fromWord, null]]);
    const queue: Array<[string, number]> = [[fromWord, 0]];
    const toWord = findPath(
        visitedWords,
        queue,
        (word: string, steps: number) => steps === pathLength && !forbiddenWords.has(word),
        (word: string) => shuffler([...validator.getAllPossibleNextWords(word)]));
    if (toWord == null) {
        return null;
    }
    return buildPath(visitedWords, fromWord, toWord);
}

function findPath(
    visitedWords: Map<string, string | null>,
    queue: Array<[string, number]>,
    isGoal: (currentWord: string, steps: number) => boolean,
    getNexts: (currentWord: string) => Iterable<string>): string | null {
    while (queue.length > 0) {
        const [currentWord, steps] = queue.shift()!;
        if (isGoal(currentWord, steps)) {
            return currentWord;
        }
        for (const word of getNexts(currentWord)) {
            if (!visitedWords.has(word)) {
                visitedWords.set(word, currentWord);
                queue.push([word, steps + 1]);
            }
        }
    }
    return null;
}

function buildPath(visitedWords: ReadonlyMap<string, string | null>, fromWord: string, toWord: string): Array<string> {
    const path = [toWord];
    let currentWord: string | null | undefined = toWord;
    while (currentWord !== fromWord && currentWord != null) {
        currentWord = visitedWords.get(currentWord);
        if (currentWord != null) {
            path.unshift(currentWord);
        }
    }
    return path;
}
