async function waitForOneSignalReady() {
  for (let i = 0; i < 30; i++) {
    if (window.didierEloOneSignalReady && window.didierEloOneSignal) return window.didierEloOneSignal;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  return null;
}

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
}

export async function initNotifications() {
  try {
    setStatus("Chargement OneSignal...");
    const OneSignal = await waitForOneSignalReady();
    if (!OneSignal) {
      setStatus("OneSignal ne charge pas. Ouvre /onesignal-check.html pour vérifier les fichiers.", false);
      return;
    }

    setStatus("Demande autorisation...");
    await OneSignal.Notifications.requestPermission();

    if (!OneSignal.Notifications.permission) {
      setStatus("Notifications refusées dans les réglages iPhone.", false);
      return;
    }

    setStatus("Création abonnement...");
    try { await OneSignal.User.PushSubscription.optIn(); } catch (e) { console.warn("optIn warning", e); }

    let subId = "";
    let optedIn = false;
    for (let i = 0; i < 20; i++) {
      subId = OneSignal.User?.PushSubscription?.id || "";
      optedIn = OneSignal.User?.PushSubscription?.optedIn || false;
      if (subId || optedIn) break;
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (subId || optedIn) {
      setStatus("✅ Notifications activées. " + (subId ? "Subscriber: " + subId : "Opted-in"));
    } else {
      setStatus("Permission OK mais OneSignal n’a pas créé le subscriber. Vérifie que l’app est ouverte depuis l’écran d’accueil et que Site URL = https://www.didiereloservices.com", false);
    }
  } catch (error) {
    console.error(error);
    setStatus("Erreur OneSignal: " + (error.message || error), false);
  }
}

export function showLocalNotification(title, body) {
  try {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "logo.jpeg" });
    }
  } catch (e) {}
}
