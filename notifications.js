const ONESIGNAL_APP_ID = "6c4e8421-6a3f-48e1-948c-f7a5d07ed234";
let oneSignalPromise = null;

function setStatus(message, ok = true) {
  let el = document.getElementById("notificationStatus") || document.getElementById("adminDebugBox");
  if (!el) {
    el = document.createElement("p");
    el.id = "notificationStatus";
    el.className = "notificationStatus";
    const main = document.querySelector(".adminMain") || document.querySelector("main") || document.body;
    main.prepend(el);
  }
  el.textContent = message;
  el.style.color = ok ? "#078b45" : "#d21f3c";
  console.log("[OneSignal]", message);
}

async function cleanupOldServiceWorkers() {
  try {
    if (!("serviceWorker" in navigator)) return;
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const reg of regs) {
      const url = reg.active?.scriptURL || reg.installing?.scriptURL || reg.waiting?.scriptURL || "";
      if (url.includes("firebase-messaging-sw.js")) {
        await reg.unregister();
      }
    }
  } catch (e) {
    console.warn("SW cleanup skipped", e);
  }
}

function loadAndInitOneSignal() {
  if (oneSignalPromise) return oneSignalPromise;

  oneSignalPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("OneSignal ne répond pas. Vérifie le domaine HTTPS et les fichiers OneSignalSDKWorker.js."));
    }, 15000);

    window.OneSignalDeferred = window.OneSignalDeferred || [];

    // This MUST be pushed before SDK script loads.
    window.OneSignalDeferred.push(async function(OneSignal) {
      try {
        await cleanupOldServiceWorkers();

        await OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          notifyButton: { enable: false },
          serviceWorkerPath: "OneSignalSDKWorker.js",
          serviceWorkerParam: { scope: "/" }
        });

        clearTimeout(timeout);
        resolve(OneSignal);
      } catch (e) {
        clearTimeout(timeout);
        reject(e);
      }
    });

    if (!document.querySelector('script[src*="OneSignalSDK.page.js"]')) {
      const script = document.createElement("script");
      script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
      script.defer = true;
      script.onerror = () => {
        clearTimeout(timeout);
        reject(new Error("Impossible de charger le SDK OneSignal."));
      };
      document.head.appendChild(script);
    }
  });

  return oneSignalPromise;
}

export async function initNotifications() {
  try {
    setStatus("Chargement OneSignal...");
    const OneSignal = await loadAndInitOneSignal();

    setStatus("Demande autorisation...");
    await OneSignal.Notifications.requestPermission();

    if (!OneSignal.Notifications.permission) {
      setStatus("Permission refusée dans iPhone.", false);
      return;
    }

    setStatus("Création abonnement...");
    try {
      await OneSignal.User.PushSubscription.optIn();
    } catch (e) {
      console.warn("optIn warning", e);
    }

    let subId = null;
    let optedIn = false;

    for (let i = 0; i < 12; i++) {
      subId = OneSignal.User?.PushSubscription?.id || null;
      optedIn = OneSignal.User?.PushSubscription?.optedIn || false;
      if (subId || optedIn) break;
      await new Promise(r => setTimeout(r, 1000));
    }

    if (subId || optedIn) {
      setStatus("✅ Notifications activées. ID: " + (subId || "opted-in"));
    } else {
      setStatus("Permission OK mais subscriber non créé. Vérifie Site URL OneSignal = https://www.didiereloservices.com", false);
    }
  } catch (e) {
    console.error(e);
    setStatus("Erreur OneSignal: " + (e.message || e), false);
  }
}

export function showLocalNotification(title, body) {
  try {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "logo.jpeg" });
    }
  } catch (e) {}
}
