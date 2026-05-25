import { getMessaging, getToken, onMessage, isSupported } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { VAPID_KEY } from "./firebase-config.js";

export async function initNotifications(app, db, user, role) {
  const statusEl = document.getElementById("notificationStatus");

  if (!("Notification" in window)) {
    if (statusEl) statusEl.textContent = "Ce navigateur ne supporte pas les notifications.";
    return;
  }

  try {
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      if (statusEl) statusEl.textContent = "Notifications refusées. Va dans les réglages du navigateur pour autoriser.";
      return;
    }

    if ("serviceWorker" in navigator) {
      await navigator.serviceWorker.register("./firebase-messaging-sw.js");
      await navigator.serviceWorker.ready;
    }

    // Fonctionne tout de suite quand admin.html/employe.html est ouvert
    showLocalNotification("Notifications activées", "Vous recevrez les alertes pendant que l’espace est ouvert.");

    const supported = await isSupported().catch(() => false);

    if (!supported) {
      if (statusEl) {
        statusEl.textContent = "Notifications locales activées. Push FCM non supporté sur ce navigateur.";
      }
      return;
    }

    if (!VAPID_KEY || VAPID_KEY.includes("REMPLACE")) {
      if (statusEl) {
        statusEl.textContent = "Notifications locales activées. Pour recevoir même site fermé, ajoute la clé VAPID Firebase.";
      }
      return;
    }

    const messaging = getMessaging(app);
    const registration = await navigator.serviceWorker.ready;

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
    }

    onMessage(messaging, (payload) => {
      showLocalNotification(
        payload.notification?.title || "Didier.Elo",
        payload.notification?.body || "Nouvelle notification"
      );
    });

  } catch (error) {
    console.error("Notification error:", error);
    if (statusEl) statusEl.textContent = "Erreur notifications. Vérifie HTTPS, VAPID et permissions.";
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
  } catch (e) {
    console.warn("Local notification failed", e);
  }

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
