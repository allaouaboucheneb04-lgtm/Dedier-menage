if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("./firebase-messaging-sw.js");
      await reg.update();
      console.log("PWA service worker registered/updated");
    } catch (error) {
      console.error("PWA service worker error:", error);
    }
  });
}

window.didierEloPwaInfo = {
  isStandalone: window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true
};
