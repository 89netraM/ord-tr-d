export class WordValidator {
    readonly #allowList: ReadonlySet<string>;

    public constructor(
        allowList: ReadonlySet<string>,
        public goalWord: string | null) {
        this.#allowList = allowList;
    }

    public *getAllPossibleNextWords(currentWord: string): Generator<string, void, void> {
        for (const word of this.#allowList) {
            if (this.validateGuess(currentWord, word)) {
                yield word;
            }
        }
    }

    public validateGuess(currentWord: string, guessWord: string): boolean {
        if (guessWord.length !== currentWord.length) {
            return false;
        }
        if (guessWord === currentWord) {
            return false;
        }
        const oneDiff = this.#hasOneLetterDifference(currentWord, guessWord);
        const anagram = this.#isAnagram(currentWord, guessWord);
        if (oneDiff === anagram) {
            return false;
        }
        if (guessWord === this.goalWord) {
            return true;
        }
        return this.#allowList.has(guessWord);
    }

    #hasOneLetterDifference(word1: string, word2: string): boolean {
        let diffCount = 0;
        for (let i = 0; i < word1.length; i++) {
            if (word1[i] !== word2[i]) {
                diffCount++;
            }
        }
        return diffCount === 1;
    }

    #isAnagram(word1: string, word2: string): boolean {
        return [...word1].sort().join("") === [...word2].sort().join("");
    }
}
