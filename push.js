// Didier.Elo PUSH FINAL - OneSignal Web SDK v16
const DIDIER_ONESIGNAL_APP_ID = "6c4e8421-6a3f-48e1-948c-f7a5d07ed234";
window.OneSignalDeferred = window.OneSignalDeferred || [];
window.didierPushState = {
  ready: false,
  error: "",
  oneSignal: null
};

function didierPushStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function didierPushStatus(message, ok = true) {
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
  console.log("[DidierElo Push]", message);
}

function didierPermissionText() {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
}

OneSignalDeferred.push(async function(OneSignal) {
  try {
    await OneSignal.init({
      appId: DIDIER_ONESIGNAL_APP_ID,
      notifyButton: { enable: false },
      welcomeNotification: { disable: true }
    });

    window.didierPushState.ready = true;
    window.didierPushState.oneSignal = OneSignal;

    didierPushStatus("Push prêt. Clique 🔔 Notifications.", true);

    try {
      OneSignal.User.PushSubscription.addEventListener("change", function(event) {
        console.log("PushSubscription changed", event);
        const id = OneSignal.User?.PushSubscription?.id || "";
        const opted = OneSignal.User?.PushSubscription?.optedIn || false;
        if (id || opted) didierPushStatus("✅ Notifications activées. " + (id ? "ID: " + id : ""), true);
      });
    } catch(e) {}
  } catch (e) {
    window.didierPushState.error = e.message || String(e);
    didierPushStatus("Erreur init OneSignal: " + window.didierPushState.error, false);
  }
});

async function waitForOneSignal(maxMs = 20000) {
  const started = Date.now();
  while (Date.now() - started < maxMs) {
    if (window.didierPushState.ready && window.didierPushState.oneSignal) return window.didierPushState.oneSignal;
    if (window.didierPushState.error) throw new Error(window.didierPushState.error);
    await new Promise(r => setTimeout(r, 300));
  }
  throw new Error("OneSignal ne charge pas. Ouvre /push-debug.html.");
}

window.didierEloEnablePush = async function() {
  const oldBtn = document.getElementById("enableNotificationsBtn");
  try {
    if (oldBtn) oldBtn.textContent = "Activation...";

    if (!("Notification" in window)) {
      didierPushStatus("Ce navigateur ne supporte pas les notifications.", false);
      return;
    }

    if (!didierPushStandalone()) {
      didierPushStatus("Sur iPhone: ouvre depuis l’icône écran d’accueil, pas Safari.", false);
      return;
    }

    didierPushStatus("Chargement OneSignal...");
    const OneSignal = await waitForOneSignal();

    const before = Notification.permission;
    didierPushStatus("Permission actuelle: " + before);

    if (before === "denied") {
      didierPushStatus("Notifications bloquées. Va dans Réglages iPhone > Notifications > Didier.Elo et autorise.", false);
      return;
    }

    // Must be called from button click.
    if (before !== "granted") {
      await OneSignal.Notifications.requestPermission();
    }

    if (Notification.permission !== "granted" && !OneSignal.Notifications.permission) {
      didierPushStatus("Autorisation non accordée.", false);
      return;
    }

    didierPushStatus("Création abonnement OneSignal...");
    try {
      await OneSignal.User.PushSubscription.optIn();
    } catch (e) {
      console.warn("optIn warning", e);
    }

    let id = "";
    let opted = false;

    for (let i = 0; i < 30; i++) {
      id = OneSignal.User?.PushSubscription?.id || "";
      opted = OneSignal.User?.PushSubscription?.optedIn || false;
      if (id || opted) break;
      await new Promise(r => setTimeout(r, 500));
    }

    if (id) {
      didierPushStatus("✅ Notifications activées. " + (id ? "ID: " + id : "Opted-in"), true);
    } else {
      didierPushStatus("Permission OK mais aucun subscriber. Ouvre /push-debug.html et envoie-moi la capture.", false);
    }
  } catch (e) {
    console.error(e);
    didierPushStatus("Erreur Push: " + (e.message || e), false);
  } finally {
    if (oldBtn) oldBtn.textContent = "🔔 Notifications";
  }
};

window.didierEloPushDebugInfo = async function() {
  const info = {
    origin: location.origin,
    href: location.href,
    userAgent: navigator.userAgent,
    standalone: didierPushStandalone(),
    notificationPermission: didierPermissionText(),
    oneSignalReady: window.didierPushState.ready,
    oneSignalError: window.didierPushState.error,
    pushSubscriptionId: window.didierPushState.oneSignal?.User?.PushSubscription?.id || "",
    pushOptedIn: window.didierPushState.oneSignal?.User?.PushSubscription?.optedIn || false
  };

  const files = ["OneSignalSDKWorker.js", "OneSignalSDKUpdaterWorker.js", "push.js", "manifest.json"];
  info.files = {};
  for (const f of files) {
    try {
      const r = await fetch("/" + f + "?t=" + Date.now(), { cache: "no-store" });
      info.files["/" + f] = r.status + (r.ok ? " OK" : " ERROR");
    } catch (e) {
      info.files["/" + f] = "ERROR " + e.message;
    }
  }

  return info;
};
