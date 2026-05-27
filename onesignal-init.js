window.OneSignalDeferred = window.OneSignalDeferred || [];

function didierStatus(message, ok = true) {
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
  console.log("[OneSignal Didier.Elo]", message);
}

async function unregisterFirebaseSW() {
  try {
    if (!("serviceWorker" in navigator)) return;
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const reg of regs) {
      const url = reg.active?.scriptURL || reg.installing?.scriptURL || reg.waiting?.scriptURL || "";
      if (url.includes("firebase-messaging-sw.js")) await reg.unregister();
    }
  } catch(e) {}
}

OneSignalDeferred.push(async function(OneSignal) {
  try {
    await unregisterFirebaseSW();

    await OneSignal.init({
      appId: "6c4e8421-6a3f-48e1-948c-f7a5d07ed234",
      notifyButton: { enable: false },
      serviceWorkerPath: "OneSignalSDKWorker.js",
      serviceWorkerParam: { scope: "/" }
    });

    window.didierEloOneSignalSubscribe = async function () {
      try {
        didierStatus("Activation OneSignal...");
        await OneSignal.Notifications.requestPermission();

        if (!OneSignal.Notifications.permission) {
          didierStatus("Permission refusée dans iPhone.", false);
          return;
        }

        try {
          await OneSignal.User.PushSubscription.optIn();
        } catch(e) {
          console.warn("optIn warning", e);
        }

        let subId = null;
        let optedIn = false;
        for (let i = 0; i < 10; i++) {
          subId = OneSignal.User?.PushSubscription?.id;
          optedIn = OneSignal.User?.PushSubscription?.optedIn;
          if (subId || optedIn) break;
          await new Promise(r => setTimeout(r, 1000));
        }

        if (subId || optedIn) {
          didierStatus("✅ Notifications activées. ID: " + (subId || "opted-in"));
        } else {
          didierStatus("Permission OK mais OneSignal n'a pas créé le subscriber. Vérifie URL exacte et ouvre depuis l'écran d'accueil.", false);
        }
      } catch(e) {
        console.error(e);
        didierStatus("Erreur OneSignal: " + (e.message || e), false);
      }
    };
  } catch(e) {
    console.error(e);
    didierStatus("Erreur init OneSignal: " + (e.message || e), false);
  }
});
