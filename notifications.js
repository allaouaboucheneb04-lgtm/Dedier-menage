import { getMessaging, getToken, onMessage, isSupported } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { VAPID_KEY } from "./firebase-config.js";

export async function initNotifications(app, db, user, role) {
  const statusEl = document.getElementById("notificationStatus");

  if (!("Notification" in window)) {
    if (statusEl) statusEl.textContent = "Ce navigateur ne supporte pas les notifications.";
    return;
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    if (statusEl) statusEl.textContent = "Notifications refusées.";
    return;
  }

  // Toujours activer une notification locale pour confirmer.
  showLocalNotification("Notifications activées", "Les alertes Didier.Elo sont activées.");

  // Si la clé VAPID est absente, ne pas casser le site.
  if (!VAPID_KEY || VAPID_KEY.includes("REMPLACE")) {
    if (statusEl) statusEl.textContent = "✅ Notifications locales activées. Clé VAPID manquante.";
    return;
  }

  try {
    if (!("serviceWorker" in navigator)) {
      if (statusEl) statusEl.textContent = "✅ Notifications locales activées. Service Worker non supporté.";
      return;
    }

    const supported = await isSupported().catch(() => false);
    if (!supported) {
      if (statusEl) statusEl.textContent = "✅ Notifications locales activées. FCM non supporté ici.";
      return;
    }

    const registration = await navigator.serviceWorker.register("./firebase-messaging-sw.js");
    await navigator.serviceWorker.ready;

    const messaging = getMessaging(app);

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (token) {
      await setDoc(doc(db, "notification_tokens", user.uid), {
        uid: user.uid,
        email: user.email || "",
        role,
        token,
        userAgent: navigator.userAgent,
        standalone: window.navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches,
        updatedAt: serverTimestamp()
      }, { merge: true });

      if (statusEl) statusEl.textContent = "✅ Notifications push activées.";
    } else {
      if (statusEl) statusEl.textContent = "✅ Notifications locales activées. Aucun token push reçu.";
    }

    onMessage(messaging, (payload) => {
      showLocalNotification(
        payload.notification?.title || "Didier.Elo",
        payload.notification?.body || "Nouvelle notification"
      );
    });

  } catch (error) {
    console.error("Erreur FCM push, fallback local:", error);
    if (statusEl) {
      statusEl.textContent = "✅ Notifications locales activées. Push FCM à vérifier.";
    }
  }
}

export function showLocalNotification(title, body) {
  try {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "logo.jpeg",
        badge: "logo.jpeg"
      });
    }
  } catch (e) {}

  playBeep();
}

export function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.value = 0.08;

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.22);
  } catch (e) {}
}
