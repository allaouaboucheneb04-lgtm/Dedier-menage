if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("./firebase-messaging-sw.js");
      console.log("PWA service worker registered");
    } catch (error) {
      console.error("PWA service worker error:", error);
    }
  });
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

window.didierEloPwaInfo = {
  isStandalone: isStandalone()
};
