(async () => {
  const CLEAN_KEY = "didierelo_cache_clean_v6";

  try {
    if ("caches" in window && localStorage.getItem(CLEAN_KEY) !== "done") {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
      localStorage.setItem(CLEAN_KEY, "done");
      console.log("Old caches cleared");
    }

    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) {
        if (reg.active && !reg.active.scriptURL.includes("firebase-messaging-sw.js")) {
          await reg.unregister();
        }
      }

      await navigator.serviceWorker.register("./firebase-messaging-sw.js", { scope: "./" });
      console.log("Clean notification SW registered");
    }
  } catch (e) {
    console.warn("PWA cleanup skipped", e);
  }
})();

window.didierEloPwaInfo = {
  isStandalone: window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true
};
