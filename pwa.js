if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        for (const k of keys) await caches.delete(k);
      }
      await navigator.serviceWorker.register("./firebase-messaging-sw.js", { scope: "./" });
    } catch (e) {
      console.warn("SW skipped", e);
    }
  });
}
