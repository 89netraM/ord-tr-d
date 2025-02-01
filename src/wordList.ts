export async function downloadWordList(listUrl: string): Promise<Array<string>> {
    const response = await fetch(listUrl);
    const words = await response.json();
    return words;
}

export async function downloadDailyWords(): Promise<{ [day: number]: { from: string, to: string } }> {
    const response = await fetch("daily-words.json");
    const dailyWords = await response.json();
    return dailyWords;
}
