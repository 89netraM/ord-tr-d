import { WordNode } from "./WordNode";

export function treeLayout(root: WordNode): void {
    const mod = new Map<number, number>();
    const thread = new Map<number, WordNode>();
    const ancestor = new Map<number, WordNode>();
    const prelim = new Map<number, number>();
    const change = new Map<number, number>();
    const shift = new Map<number, number>();

    firstWalk(root);
    secondWalk(root, -getPrelim(root));

    function firstWalk(v: WordNode): void {
        if (v.children.length === 0) {
            const leftSibling = getLeftSibling(v);
            if (leftSibling != null) {
                prelim.set(v.id, getPrelim(leftSibling) + 1);
            }
            return;
        }

        let defaultAncestor = v.children[0];
        for (const w of v.children) {
            firstWalk(w);
            defaultAncestor = apportion(w, defaultAncestor);
        }

        executeShifts(v);

        const midpoint = (getPrelim(v.children[0]) + getPrelim(v.children[v.children.length - 1])) / 2;
        const leftSibling = getLeftSibling(v);
        if (leftSibling != null) {
            prelim.set(v.id, getPrelim(leftSibling) + 1);
            mod.set(v.id, getPrelim(v) - midpoint);
        }
        else {
            prelim.set(v.id, midpoint);
        }
    }

    function apportion(v: WordNode, defaultAncestor: WordNode): WordNode {
        const w = getLeftSibling(v);
        if (w != null) {
            let vip = v;
            let vop = v;
            let vim = w;
            let vom = getLeftmostSibling(vip)!;
            let sip = getMod(vip);
            let sop = getMod(vop);
            let sim = getMod(vim);
            let som = getMod(vom);

            for (
                let nextRight = getNextRight(vim),
                nextLeft = getNextLeft(vip);
                nextRight != null && nextLeft != null;
                nextRight = getNextRight(vim),
                nextLeft = getNextLeft(vip)
            ) {
                vim = nextRight;
                vip = nextLeft;
                vom = nextRight;
                vop = nextLeft;
                ancestor.set(vop.id, v);
                const shift = (getPrelim(vim) + sim) - (getPrelim(vip) + sip) + 1;
                if (shift > 0) {
                    moveSubtree(ancestorFunction(vim, v, defaultAncestor), v, shift);
                    sip += shift;
                    sop += shift;
                }
                sim += getMod(vim);
                sip += getMod(vip);
                som += getMod(vom);
                sop += getMod(vop);
            }

            const vimNextRight = getNextRight(vim);
            const vopNextRight = getNextRight(vop);
            if (vimNextRight != null && vopNextRight == null) {
                thread.set(vop.id, vimNextRight);
                mod.set(vop.id, getMod(vop) + sim - sop);
            }
            const vipNextLeft = getNextLeft(vip);
            const vomNextLeft = getNextLeft(vom);
            if (vipNextLeft != null && vomNextLeft == null) {
                thread.set(vom.id, vipNextLeft);
                mod.set(vom.id, getMod(vom) + sip - som);
                defaultAncestor = v;
            }
        }
        return defaultAncestor;
    }

    function getNextLeft(v: WordNode): WordNode | null {
        return v.children.length > 0 ? v.children[0] : getThread(v);
    }

    function getNextRight(v: WordNode): WordNode | null {
        return v.children.length > 0 ? v.children[v.children.length - 1] : getThread(v);
    }

    function getLeftSibling(node: WordNode): WordNode | null {
        if (node.parent == null) {
            return null;
        }
        const siblings = node.parent.children;
        const index = siblings.indexOf(node);
        return index === 0 ? null : siblings[index - 1];
    }

    function getLeftmostSibling(node: WordNode): WordNode | null {
        if (node.parent == null) {
            return null;
        }
        return node.parent.children.length > 0 ? node.parent.children[0] : null;
    }

    function moveSubtree(wm: WordNode, wp: WordNode, s: number): void {
        const subtrees = wp.parent!.children.indexOf(wp) - wm.parent!.children.indexOf(wm) + 1;
        change.set(wp.id, getChange(wp) - s / subtrees);
        shift.set(wp.id, getShift(wp) + s);
        change.set(wm.id, getChange(wm) + s / subtrees);
        prelim.set(wp.id, getPrelim(wp) + s);
        mod.set(wp.id, getMod(wp) + s);
    }

    function executeShifts(v: WordNode): void {
        let s = 0;
        let c = 0;
        for (let i = v.children.length - 1; i >= 0; i--) {
            const w = v.children[i];
            prelim.set(w.id, getPrelim(w) + s);
            mod.set(w.id, getMod(w) + s);
            c += getChange(w);
            s += getShift(w) + c;
        }
    }

    function ancestorFunction(vim: WordNode, v: WordNode, defaultAncestor: WordNode): WordNode {
        const vimAncestor = getAncestor(vim);
        return vimAncestor.parent === v.parent ? vimAncestor : defaultAncestor;
    }

    function secondWalk(v: WordNode, m: number): void {
        v.offset = getPrelim(v) + m;
        for (const w of v.children) {
            secondWalk(w, m + getMod(v));
        }
    }

    function getMod(node: WordNode): number {
        return mod.get(node.id) ?? 0;
    }
    function getThread(node: WordNode): WordNode | null {
        return thread.get(node.id) ?? null;
    }
    function getAncestor(node: WordNode): WordNode {
        return ancestor.get(node.id) ?? node;
    }
    function getPrelim(node: WordNode): number {
        return prelim.get(node.id) ?? 0;
    }
    function getChange(node: WordNode): number {
        return change.get(node.id) ?? 0;
    }
    function getShift(node: WordNode): number {
        return shift.get(node.id) ?? 0;
    }
}
