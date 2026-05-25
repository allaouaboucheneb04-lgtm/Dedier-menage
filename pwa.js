if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        if (reg.active && reg.active.scriptURL.includes("firebase-messaging-sw.js")) {
          await reg.update();
        }
      }
      await navigator.serviceWorker.register("./firebase-messaging-sw.js", { scope: "./" });
      console.log("PWA service worker ok");
    } catch (error) {
      console.warn("PWA service worker skipped:", error);
    }
  });
}

window.didierEloPwaInfo = {
  isStandalone: window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true
};
