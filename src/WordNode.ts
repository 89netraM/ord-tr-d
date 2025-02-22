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
        public isActive: boolean = true,
        public parent: WordNode | null = null,
        public readonly isDisjointChild: boolean = false,
        public readonly level: number = 0,
        id: number | null = null) {
        this.id = id ?? getNextId();
    }

    public makeNext(word: string, isEnd: boolean): WordNode {
        if (!this.isEnd && this.parent?.word === word) {
            return this.parent;
        }
        let next = this.children.find(node => node.word === word);
        if (next != null) {
            return next;
        }
        return this.addChild(word, isEnd, !isEnd, false);
    }

    public addChild(word: string, isEnd: boolean, isActive: boolean, isDisjointChild: boolean): WordNode {
        const child = new WordNode(word, isEnd, isActive, this, isDisjointChild, this.level + 1);
        this.children.push(child);
        return child;
    }

    public find(predicate: (node: WordNode) => boolean): WordNode | null {
        if (predicate(this)) {
            return this;
        }
        for (const child of this.children) {
            const found = child.find(predicate);
            if (found != null) {
                return found;
            }
        }
        return null;
    }

    public findUp(predicate: (node: WordNode) => boolean): WordNode | null {
        if (predicate(this)) {
            return this;
        }
        return this.parent?.findUp(predicate) ?? null;
    }

    public findDeepest(predicate: (node: WordNode) => boolean): WordNode | null {
        let found: WordNode | null = predicate(this) ? this : null;
        for (const child of this.children) {
            const childFound = child.findDeepest(predicate);
            if (found == null || (childFound != null && found.level < childFound.level)) {
                found = childFound;
            }
        }
        return found;
    }

    public visit(action: (node: WordNode) => void): void {
        action(this);
        for (const child of this.children) {
            child.visit(action);
        }
    }

    public *save(): Generator<WordNodeDb> {
        yield {
            id: this.id,
            word: this.word,
            isEnd: this.isEnd,
            parent: this.parent?.id ?? null,
            isDisjointChild: this.isDisjointChild,
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
    isDisjointChild: boolean;
    level: number;
}

export function loadWordNode(db: Array<WordNodeDb>): WordNode {
    const map = new Map<number, WordNode>();
    let max = -1;
    let root: WordNode | null = null;
    db.sort((a, b) => a.id - b.id);
    for (const dbNode of db) {
        map.set(dbNode.id,
            new WordNode(
                dbNode.word,
                dbNode.isEnd,
                false,
                null,
                dbNode.isDisjointChild,
                dbNode.level,
                dbNode.id
            )
        );
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
