// Didier.Elo PUSH FIX - OneSignal Web SDK v16
// Charge OneSignal correctement: le callback est enregistré AVANT le SDK.
const DIDIER_ONESIGNAL_APP_ID = "6c4e8421-6a3f-48e1-948c-f7a5d07ed234";

window.didierPushState = {
  ready: false,
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

function loadOneSignalSdkOnce() {
  return new Promise((resolve, reject) => {
    if (window.OneSignal && window.didierPushState.ready) return resolve(window.OneSignal);

    window.OneSignalDeferred = window.OneSignalDeferred || [];

    window.OneSignalDeferred.push(async function(OneSignal) {
      try {
        await OneSignal.init({
          appId: DIDIER_ONESIGNAL_APP_ID,
          notifyButton: { enable: false }
        });

        window.didierPushState.ready = true;
        window.didierPushState.oneSignal = OneSignal;

        try {
          OneSignal.User.PushSubscription.addEventListener("change", function(event) {
            console.log("PushSubscription changed", event);
            const id = OneSignal.User?.PushSubscription?.id || "";
            if (id) {
              window.didierPushState.lastSubscriptionId = id;
              didierPushStatus("✅ Notifications activées. ID: " + id, true);
            }
          });
        } catch (e) { console.warn("listener error", e); }

        didierPushStatus("Push prêt. Clique 🔔 Notifications.", true);
        resolve(OneSignal);
      } catch (e) {
        window.didierPushState.error = e.message || String(e);
        didierPushStatus("Erreur init OneSignal: " + window.didierPushState.error, false);
        reject(e);
      }
    });

    if (!document.querySelector('script[src*="OneSignalSDK.page.js"]')) {
      const s = document.createElement("script");
      s.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
      s.async = true;
      s.onload = () => console.log("OneSignal SDK loaded");
      s.onerror = () => reject(new Error("Impossible de charger OneSignalSDK.page.js"));
      document.head.appendChild(s);
    }
  });
}

async function waitForOneSignal(maxMs = 20000) {
  if (!window.didierPushState.ready) {
    try { await loadOneSignalSdkOnce(); } catch (e) { /* handled below */ }
  }
  const started = Date.now();
  while (Date.now() - started < maxMs) {
    if (window.didierPushState.ready && window.didierPushState.oneSignal) return window.didierPushState.oneSignal;
    if (window.didierPushState.error) throw new Error(window.didierPushState.error);
    await new Promise(r => setTimeout(r, 300));
  }
  throw new Error("OneSignal ne charge pas. Vérifie /push-debug.html.");
}

// démarre le chargement dès que push.js est chargé
loadOneSignalSdkOnce().catch(e => console.error("OneSignal preload failed", e));

window.didierEloEnablePush = async function() {
  const btn = document.getElementById("enableNotificationsBtn");
  try {
    if (btn) btn.textContent = "Activation...";

    if (!("Notification" in window)) {
      didierPushStatus("Ce navigateur ne supporte pas les notifications. Sur iPhone, ouvre l’icône installée.", false);
      return;
    }

    if (!didierPushStandalone()) {
      console.warn("Mode navigateur détecté; on continue pour Android/desktop, iPhone Safari peut refuser.");
    }

    didierPushStatus("Chargement OneSignal...");
    const OneSignal = await waitForOneSignal();

    // Optionnel: lie l'abonné à l'utilisateur connecté si la page le donne
    try {
      if (window.didierCurrentUserId && OneSignal.login) await OneSignal.login(window.didierCurrentUserId);
    } catch(e) { console.warn("OneSignal login warning", e); }

    const before = Notification.permission;
    didierPushStatus("Permission actuelle: " + before);

    if (before === "denied") {
      didierPushStatus("Notifications bloquées. Réglages iPhone > Notifications > Didier.Elo > Autoriser.", false);
      return;
    }

    if (before !== "granted") {
      await OneSignal.Notifications.requestPermission();
    }

    const granted = ("Notification" in window && Notification.permission === "granted") || OneSignal.Notifications.permission;
    if (!granted) {
      didierPushStatus("Autorisation non accordée.", false);
      return;
    }

    didierPushStatus("Création du subscriber OneSignal...");
    try { await OneSignal.User.PushSubscription.optIn(); } catch(e) { console.warn("optIn warning", e); }

    let id = "";
    let opted = false;
    for (let i=0; i<40; i++) {
      id = OneSignal.User?.PushSubscription?.id || window.didierPushState.lastSubscriptionId || "";
      opted = OneSignal.User?.PushSubscription?.optedIn || false;
      if (id) break;
      await new Promise(r => setTimeout(r, 500));
    }

    if (id) {
      window.didierPushState.lastSubscriptionId = id;
      didierPushStatus("✅ Notifications activées. ID: " + id, true);
    } else {
      didierPushStatus("❌ Permission OK, mais aucun Subscription ID OneSignal. Ouvre Réglages > Notifications et vérifie Didier.Elo, puis reclique.", false);
      console.warn("OneSignal optedIn=", opted, "subscriptionId vide");
    }
  } catch(e) {
    console.error(e);
    didierPushStatus("Erreur Push: " + (e.message || e), false);
  } finally {
    if (btn) btn.textContent = "🔔 Notifications";
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
    pushSubscriptionId: OneSignal?.User?.PushSubscription?.id || window.didierPushState.lastSubscriptionId || "",
    pushOptedIn: OneSignal?.User?.PushSubscription?.optedIn || false
  };
  const files = ["OneSignalSDKWorker.js", "OneSignalSDKUpdaterWorker.js", "push.js", "manifest.json"];
  info.files = {};
  for (const f of files) {
    try {
      const r = await fetch("/" + f + "?t=" + Date.now(), { cache: "no-store" });
      info.files["/" + f] = r.status + (r.ok ? " OK" : " ERROR");
    } catch(e) { info.files["/" + f] = "ERROR " + e.message; }
  }
  return info;
};
