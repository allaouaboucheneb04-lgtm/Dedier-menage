// Didier.Elo PUSH FIX BOUTON - OneSignal Web SDK v16
const DIDIER_ONESIGNAL_APP_ID = "6c4e8421-6a3f-48e1-948c-f7a5d07ed234";

window.didierPushState = window.didierPushState || {
  ready: false,
  loading: false,
  error: "",
  oneSignal: null,
  lastSubscriptionId: ""
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

function didierSetButton(text) {
  const btn = document.getElementById("enableNotificationsBtn");
  if (btn) btn.textContent = text;
}

function didierGetSubId(OneSignal) {
  return OneSignal?.User?.PushSubscription?.id ||
         OneSignal?.User?.PushSubscription?.token ||
         window.didierPushState.lastSubscriptionId ||
         "";
}

let didierLoadPromise = null;

function loadOneSignalSdkOnce() {
  if (window.didierPushState.ready && window.didierPushState.oneSignal) {
    return Promise.resolve(window.didierPushState.oneSignal);
  }
  if (didierLoadPromise) return didierLoadPromise;

  didierLoadPromise = new Promise((resolve, reject) => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];

    window.OneSignalDeferred.push(async function(OneSignal) {
      try {
        await OneSignal.init({
          appId: DIDIER_ONESIGNAL_APP_ID,
          notifyButton: { enable: false },
          welcomeNotification: { disable: false }
        });

        window.didierPushState.ready = true;
        window.didierPushState.loading = false;
        window.didierPushState.oneSignal = OneSignal;

        const id = didierGetSubId(OneSignal);
        if (id) window.didierPushState.lastSubscriptionId = id;

        try {
          OneSignal.User.PushSubscription.addEventListener("change", function(event) {
            console.log("PushSubscription changed", event);
            const newId = didierGetSubId(OneSignal);
            if (newId) {
              window.didierPushState.lastSubscriptionId = newId;
              didierPushStatus("✅ Notifications activées. ID: " + newId, true);
            }
          });
        } catch(e) {
          console.warn("listener error", e);
        }

        resolve(OneSignal);
      } catch(e) {
        window.didierPushState.error = e.message || String(e);
        window.didierPushState.loading = false;
        didierPushStatus("Erreur init OneSignal: " + window.didierPushState.error, false);
        reject(e);
      }
    });

    if (!document.querySelector('script[src*="OneSignalSDK.page.js"]')) {
      const s = document.createElement("script");
      s.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
      s.async = true;
      s.onerror = () => reject(new Error("Impossible de charger OneSignalSDK.page.js"));
      document.head.appendChild(s);
    }
  });

  return didierLoadPromise;
}

async function waitForOneSignal(maxMs = 15000) {
  if (window.didierPushState.ready && window.didierPushState.oneSignal) return window.didierPushState.oneSignal;

  const p = loadOneSignalSdkOnce();
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("OneSignal ne charge pas. Recharge l’app puis réessaie.")), maxMs)
  );
  return Promise.race([p, timeout]);
}

// Précharge sans bloquer l’interface
loadOneSignalSdkOnce().then((OneSignal) => {
  const id = didierGetSubId(OneSignal);
  const opted = OneSignal?.User?.PushSubscription?.optedIn || false;
  if (id) didierPushStatus("✅ Notifications déjà activées. ID: " + id, true);
  else if (opted || (("Notification" in window) && Notification.permission === "granted")) didierPushStatus("✅ Notifications déjà autorisées.", true);
  else didierPushStatus("Push prêt. Clique 🔔 Notifications.", true);
}).catch(e => console.warn("OneSignal preload failed", e));

window.didierEloEnablePush = async function() {
  if (window.didierPushState.loading) {
    didierPushStatus("Activation déjà en cours...", true);
    return;
  }

  window.didierPushState.loading = true;
  didierSetButton("Activation...");

  try {
    if (!("Notification" in window)) {
      didierPushStatus("Ce navigateur ne supporte pas les notifications. Ouvre l’icône installée sur iPhone.", false);
      return;
    }

    didierPushStatus("Chargement OneSignal...");
    const OneSignal = await waitForOneSignal();

    const currentId = didierGetSubId(OneSignal);
    const currentOpted = OneSignal?.User?.PushSubscription?.optedIn || false;

    // Correction du bug: si déjà autorisé/opted-in, ne reste plus bloqué sur Chargement.
    if (currentId) {
      window.didierPushState.lastSubscriptionId = currentId;
      didierPushStatus("✅ Notifications déjà activées. ID: " + currentId, true);
      return;
    }
    if (currentOpted && Notification.permission === "granted") {
      didierPushStatus("✅ Notifications déjà activées.", true);
      return;
    }

    if (Notification.permission === "denied") {
      didierPushStatus("Notifications bloquées. Réglages iPhone > Notifications > Didier.Elo > Autoriser.", false);
      return;
    }

    if (Notification.permission !== "granted") {
      didierPushStatus("Demande autorisation...");
      await OneSignal.Notifications.requestPermission();
    }

    const granted = Notification.permission === "granted" || OneSignal.Notifications.permission;
    if (!granted) {
      didierPushStatus("Autorisation non accordée.", false);
      return;
    }

    didierPushStatus("Création abonnement OneSignal...");
    try {
      await OneSignal.User.PushSubscription.optIn();
    } catch(e) {
      console.warn("optIn warning", e);
    }

    let id = "";
    let opted = false;
    for (let i = 0; i < 30; i++) {
      id = didierGetSubId(OneSignal);
      opted = OneSignal?.User?.PushSubscription?.optedIn || false;
      if (id) break;
      await new Promise(r => setTimeout(r, 500));
    }

    if (id) {
      window.didierPushState.lastSubscriptionId = id;
      didierPushStatus("✅ Notifications activées. ID: " + id, true);
    } else if (opted || Notification.permission === "granted") {
      didierPushStatus("✅ Notifications activées.", true);
    } else {
      didierPushStatus("❌ Aucun Subscription ID OneSignal.", false);
    }
  } catch(e) {
    console.error(e);
    didierPushStatus("Erreur Push: " + (e.message || e), false);
  } finally {
    window.didierPushState.loading = false;
    didierSetButton("🔔 Notifications");
  }
};

window.didierEloPushDebugInfo = async function() {
  try { await waitForOneSignal(5000); } catch(e) { console.warn(e); }
  const OneSignal = window.didierPushState.oneSignal;
  const info = {
    origin: location.origin,
    href: location.href,
    userAgent: navigator.userAgent,
    standalone: didierPushStandalone(),
    notificationPermission: didierPermissionText(),
    oneSignalReady: window.didierPushState.ready,
    oneSignalError: window.didierPushState.error,
    pushSubscriptionId: didierGetSubId(OneSignal),
    pushOptedIn: OneSignal?.User?.PushSubscription?.optedIn || false
  };
  const files = ["OneSignalSDKWorker.js", "OneSignalSDKUpdaterWorker.js", "push.js", "manifest.json"];
  info.files = {};
  for (const f of files) {
    try {
      const r = await fetch("/" + f + "?t=" + Date.now(), { cache: "no-store" });
      info.files["/" + f] = r.status + (r.ok ? " OK" : " ERROR");
    } catch(e) {
      info.files["/" + f] = "ERROR " + e.message;
    }
  }
  return info;
};
