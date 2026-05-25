if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();

      // Nettoie les anciens SW avec cache/fetch qui causaient le bug
      for (const reg of regs) {
        if (reg.active && reg.active.scriptURL.includes("firebase-messaging-sw.js")) {
          await reg.unregister();
        }
      }

      const reg = await navigator.serviceWorker.register("./firebase-messaging-sw.js", { scope: "./" });
      await reg.update();
      console.log("Service worker propre installé");
    } catch (error) {
      console.warn("Service worker ignoré:", error);
    }
  });
}

window.didierEloPwaInfo = {
  isStandalone: window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true
};
