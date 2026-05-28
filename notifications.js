const ONESIGNAL_APP_ID = "6c4e8421-6a3f-48e1-948c-f7a5d07ed234";
let oneSignalInitPromise = null;

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

function loadOneSignalSdk() {
  return new Promise((resolve, reject) => {
    if (window.OneSignalDeferred) return resolve();

    window.OneSignalDeferred = window.OneSignalDeferred || [];

    const script = document.createElement("script");
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Impossible de charger OneSignalSDK.page.js"));
    document.head.appendChild(script);
  });
}

async function initOneSignal() {
  if (oneSignalInitPromise) return oneSignalInitPromise;

  oneSignalInitPromise = new Promise(async (resolve, reject) => {
    try {
      await loadOneSignalSdk();

      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async function(OneSignal) {
        try {
          await OneSignal.init({
            appId: ONESIGNAL_APP_ID,
            notifyButton: { enable: false },
            serviceWorkerPath: "OneSignalSDKWorker.js",
            serviceWorkerParam: { scope: "/" }
          });
          resolve(OneSignal);
        } catch (e) {
          reject(e);
        }
      });
    } catch (e) {
      reject(e);
    }
  });

  return oneSignalInitPromise;
}

export async function initNotifications() {
  try {
    setStatus("Activation OneSignal...");
    const OneSignal = await initOneSignal();

    await OneSignal.Notifications.requestPermission();

    if (!OneSignal.Notifications.permission) {
      setStatus("Permission refusée dans les réglages iPhone.", false);
      return;
    }

    try {
      await OneSignal.User.PushSubscription.optIn();
    } catch (e) {
      console.warn("optIn warning", e);
    }

    let subId = null;
    let optedIn = false;

    for (let i = 0; i < 12; i++) {
      subId = OneSignal.User?.PushSubscription?.id;
      optedIn = OneSignal.User?.PushSubscription?.optedIn;
      if (subId || optedIn) break;
      await new Promise(r => setTimeout(r, 1000));
    }

    if (subId || optedIn) {
      setStatus("✅ Notifications activées. ID: " + (subId || "opted-in"));
    } else {
      setStatus("Permission OK mais subscriber non créé. Vérifie HTTPS + URL OneSignal.", false);
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
  } catch(e) {}
}
