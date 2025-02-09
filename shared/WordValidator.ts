export class WordValidator {
    readonly #allowList: ReadonlySet<string>;

    public constructor(
        allowList: ReadonlySet<string>,
        public goalWord: string | null) {
        this.#allowList = allowList;
    }

    public *getAllPossibleNextWords(currentWord: string): Generator<string, void, void> {
        for (const word of this.#allowList) {
            if (this.validateGuess(currentWord, word) === ValidationResult.Success) {
                yield word;
            }
        }
    }

    public validateGuess(currentWord: string, guessWord: string): ValidationResult {
        if (guessWord.length !== currentWord.length) {
            return ValidationResult.IllegalMove;
        }
        if (guessWord === currentWord) {
            return ValidationResult.IllegalMove;
        }
        const oneDiff = this.#hasOneLetterDifference(currentWord, guessWord);
        const anagram = this.#isAnagram(currentWord, guessWord);
        if (oneDiff === anagram) {
            return ValidationResult.IllegalMove;
        }
        if (guessWord === this.goalWord) {
            return ValidationResult.Success;
        }
        if (!this.#allowList.has(guessWord)){
            return ValidationResult.UnknownWord;
        }
        return ValidationResult.Success;
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

export enum ValidationResult {
    Success,
    UnknownWord,
    IllegalMove,
}
