export class WordNode {
    public readonly name: string;

    readonly #children: Array<WordNode> = [];
    public get children(): ReadonlyArray<WordNode> {
        return this.#children;
    }

    public constructor(
        public readonly word: string,
        public readonly parent: WordNode | null = null) {
        this.name = word;
    }

    public makeNext(word: string): WordNode {
        let next = this.#children.find(node => node.word === word);
        if (next != null) {
            return next;
        }
        next = new WordNode(word, this);
        this.#children.push(next);
        return next;
    }
}
