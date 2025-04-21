const cacheName = "v1";

self.addEventListener("install", e => {
    e.waitUntil((async () => {
        const cache = await caches.open(cacheName);
        await cache.addAll([
            "/",
            "/index.html",
            "/index.js",
            "/index.css",
            "/all-words.json",
            "/ComicNeue-Bold.ttf",
            "/daily-words.json",
            "/service-worker.js",
            "/pathCreator-worker.js",
            "/bonus-ord",
            "/bonus-ord/index.html",
        ]);
    })());
});

self.addEventListener("activate", e => {
    e.waitUntil((async () => {
        if ("navigationPreload" in self.registration) {
            await self.registration.navigationPreload.enable();
        }
    })());
});

self.addEventListener("fetch", e => {
    e.respondWith((async () => {
        if (self.navigator.onLine !== false) {
            try {
                const preloadedResponse = await e.preloadResponse;
                if (preloadedResponse) {
                    await putInCache(e.request, preloadedResponse);
                    return preloadedResponse;
                }
            } catch { }
    
            try {
                const networkResponse = await fetch(e.request);
                await putInCache(e.request, networkResponse);
                return networkResponse;
            } catch { }
        }

        const cachedResponse = await caches.match(e.request);
        if (cachedResponse) {
            return cachedResponse;
        }

        return new Response("Nätverksfel", {
            status: 408,
            headers: { "Content-Type": "text/plain" },
        });
    })());
});

async function putInCache(request, response) {
    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
}
