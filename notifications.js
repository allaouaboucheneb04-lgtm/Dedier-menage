import { getMessaging, getToken, onMessage, isSupported } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { VAPID_KEY } from "./firebase-config.js";

function setStatus(message, ok = true) {
  const el = document.getElementById("notificationStatus");
  if (el) {
    el.textContent = message;
    el.style.color = ok ? "#078b45" : "#d21f3c";
  }
  console.log("[Didier.Elo Notifications]", message);
}

export async function initNotifications(app, db, user, role) {
  try {
    if (!user) return setStatus("Tu dois être connecté.", false);

    if (!("Notification" in window)) {
      return setStatus("Notifications non supportées sur ce navigateur.", false);
    }

    let permission = Notification.permission;
    if (permission !== "granted") {
      permission = await Notification.requestPermission();
    }
    if (permission !== "granted") {
      return setStatus("Notifications refusées dans les réglages.", false);
    }

    if (!("serviceWorker" in navigator)) {
      return setStatus("Service Worker non supporté.", false);
    }

    const supported = await isSupported().catch(() => false);
    if (!supported) {
      return setStatus("FCM non supporté ici. Teste sur Chrome/Android ou utilise OneSignal pour iPhone fermé.", false);
    }

    // Vérifie que le fichier service worker existe vraiment avant l’enregistrement.
    const swUrl = new URL("./firebase-messaging-sw.js", location.href).href;
    const swCheck = await fetch(swUrl, { cache: "reload" }).catch(() => null);
    if (!swCheck || !swCheck.ok) {
      return setStatus("firebase-messaging-sw.js introuvable à la racine du site.", false);
    }

    const registration = await navigator.serviceWorker.register(swUrl, { scope: "./" });
    await navigator.serviceWorker.ready;

    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (!token) {
      return setStatus("Aucun token reçu de Firebase.", false);
    }

    await setDoc(doc(db, "notification_tokens", user.uid), {
      uid: user.uid,
      email: user.email || "",
      role,
      token,
      updatedAt: serverTimestamp(),
      standalone: window.navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches,
      permission: Notification.permission,
      userAgent: navigator.userAgent
    }, { merge: true });

    setStatus("✅ Token enregistré dans notification_tokens.");
    showLocalNotification("Didier.Elo", "Notifications activées.");

    onMessage(messaging, (payload) => {
      showLocalNotification(
        payload.notification?.title || "Didier.Elo",
        payload.notification?.body || "Nouvelle notification"
      );
    });

  } catch (error) {
    console.error(error);
    setStatus("Erreur notifications : " + (error.code || error.message || error), false);
  }
}

export function showLocalNotification(title, body) {
  try {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "logo.jpeg", badge: "logo.jpeg" });
    }
  } catch (e) {}
}
