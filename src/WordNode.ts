let nextId = 0;
function getNextId() {
    return nextId++;
}

export class WordNode {
    public readonly id: number;

    public readonly children: Array<WordNode> = [];

    public offset: number = 0;

    public constructor(
        public readonly word: string,
        public readonly isEnd: boolean = false,
        public parent: WordNode | null = null,
        public readonly level: number = 0,
        id: number | null = null) {
        this.id = id ?? getNextId();
    }

    public makeNext(word: string, isEnd: boolean): WordNode {
        let next = this.children.find(node => node.word === word);
        if (next != null) {
            return next;
        }
        next = new WordNode(word, isEnd, this, this.level + 1);
        this.children.push(next);
        return next;
    }

    public find(id: number): WordNode | null {
        if (this.id === id) {
            return this;
        }
        for (const child of this.children) {
            const found = child.find(id);
            if (found != null) {
                return found;
            }
        }
        return null;
    }

    public *save(): Generator<WordNodeDb> {
        yield {
            id: this.id,
            word: this.word,
            isEnd: this.isEnd,
            parent: this.parent?.id ?? null,
            level: this.level,
        };
        for (const child of this.children) {
            yield* child.save();
        }
    }
}

export interface WordNodeDb {
    id: number;
    word: string;
    isEnd: boolean;
    parent: number | null;
    level: number;
}

export function loadWordNode(db: Array<WordNodeDb>): WordNode {
    const map = new Map<number, WordNode>();
    let max = -1;
    let root: WordNode | null = null;
    db.sort((a, b) => a.id - b.id);
    for (const dbNode of db) {
        map.set(dbNode.id, new WordNode(dbNode.word, dbNode.isEnd, null, dbNode.level, dbNode.id));
        max = Math.max(max, dbNode.id);
    }
    for (const dbNode of db) {
        if (dbNode.parent != null) {
            const parent = map.get(dbNode.parent)!;
            const child = map.get(dbNode.id)!;
            child.parent = parent;
            parent.children.push(child);
        }
        else {
            root = map.get(dbNode.id)!;
        }
    }
    nextId = max + 1;
    return root!;
}
