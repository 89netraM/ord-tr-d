const wordLists = new Map<string, Promise<Array<string>>>();

export function downloadWordsList(listUrl: string): Promise<Array<string>> {
    if (wordLists.has(listUrl)) {
        return wordLists.get(listUrl)!;
    }
    const promise = (async () => {
        const response = await fetch(listUrl);
        const words = await response.json();
        return words;
    })();
    wordLists.set(listUrl, promise);
    return promise;
}
