import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { VAPID_KEY } from "./firebase-config.js";

export async function initNotifications(app, db, user, role) {
  const statusEl = document.getElementById("notificationStatus");

  if (!("Notification" in window)) {
    if (statusEl) statusEl.textContent = "Notifications non supportées sur ce navigateur.";
    return;
  }

  try {
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      if (statusEl) statusEl.textContent = "Notifications refusées.";
      return;
    }

    if ("serviceWorker" in navigator) {
      await navigator.serviceWorker.register("./firebase-messaging-sw.js");
    }

    if (!VAPID_KEY || VAPID_KEY.includes("REMPLACE")) {
      if (statusEl) {
        statusEl.textContent = "Notifications locales activées. Pour les push fermées, ajoute la clé VAPID.";
      }
      return;
    }

    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.ready
    });

    if (token) {
      await setDoc(doc(db, "notification_tokens", user.uid), {
        uid: user.uid,
        email: user.email || "",
        role,
        token,
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
    if (statusEl) statusEl.textContent = "Erreur notifications. Vérifie FCM/VAPID.";
  }
}

export function showLocalNotification(title, body) {
  try {
    if (Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "logo.jpeg"
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
