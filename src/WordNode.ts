let nextId = 0;
function getNextId() {
    return nextId++;
}

export class WordNode {
    public readonly id: number;

    readonly #children: Array<WordNode> = [];
    public get children(): ReadonlyArray<WordNode> {
        return this.#children;
    }

    public offset: number = 0;

    public constructor(
        public readonly word: string,
        public readonly parent: WordNode | null = null,
        public readonly level: number = 0,
        id: number | null = null) {
        this.id = id ?? getNextId();
    }

    public makeNext(word: string): WordNode {
        let next = this.#children.find(node => node.word === word);
        if (next != null) {
            return next;
        }
        next = new WordNode(word, this, this.level + 1);
        this.#children.push(next);
        return next;
    }
}
