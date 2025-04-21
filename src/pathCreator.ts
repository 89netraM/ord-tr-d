import PathCreator from "./pathCreator-worker?worker";

const worker = new PathCreator();

let promise: Promise<Array<string>> | null = null;

export function createPath(): Promise<Array<string>> {
    return promise ??= new Promise(resolve => {
        console.log("Creating");
        worker.addEventListener("message", handleMessage);
        worker.postMessage({ kind: "calculate-path" });
        function handleMessage(e: MessageEvent): void {
            console.log(e);
            if (e.data?.kind === "calculated-path") {
                worker.removeEventListener("message", handleMessage);
                promise = null;
                resolve(e.data.path);
            }
        }
    });
}
