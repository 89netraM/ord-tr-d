import { WordValidator } from "./WordValidator";

export function findPathBetween(wordList: ReadonlySet<string>, fromWord: string, toWord: string): Array<string> {
    const validator = new WordValidator(wordList, null);
    const visitedWords = new Map();
    const queue: Array<[string, number]> = [[fromWord, 0]];
    findPath(
        visitedWords,
        queue,
        (word: string, _: number) => word === toWord,
        (word: string) => validator.getAllPossibleNextWords(word));
    return buildPath(visitedWords, fromWord, toWord);
}

export function findPathToNextGoal(wordList: ReadonlySet<string>, forbiddenWords: ReadonlyArray<string>, fromWord: string): Array<string> | null {
    const validator = new WordValidator(wordList, null);
    const visitedWords = new Map(forbiddenWords.map(x => [x, null])).set(fromWord, null);
    const queue: Array<[string, number]> = [[fromWord, 0]];
    const toWord = findPath(
        visitedWords,
        queue,
        (_: string, steps: number) => steps === 4,
        (word: string) => shuffle([...validator.getAllPossibleNextWords(word)]));
    if (toWord == null) {
        return null;
    }
    return buildPath(visitedWords, fromWord, toWord);
}

function findPath(
    visitedWords: Map<string, string | null>,
    queue: Array<[string, number]>,
    isGoal: (currentWord: string, steps: number) => boolean,
    getNexts: (currentWord: string) => Iterable<string, any, any>): string | null {
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

function shuffle<T>(array: Array<T>): Array<T> {
    for (let i = array.length - 1; i >= 0; i--) {
        const j = Math.floor(Math.random() * i);
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
