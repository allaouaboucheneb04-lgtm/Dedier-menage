import { getMessaging, getToken, onMessage, isSupported } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { VAPID_KEY } from "./firebase-config.js";

function setStatus(message, ok = true) {
  const statusEl = document.getElementById("notificationStatus");
  if (statusEl) {
    statusEl.textContent = message;
    statusEl.style.color = ok ? "#078b45" : "#d21f3c";
  }
  console.log("[Notifications]", message);
}

export async function initNotifications(app, db, user, role) {
  if (!user) {
    setStatus("Erreur: utilisateur non connecté.", false);
    return;
  }

  if (!("Notification" in window)) {
    setStatus("Ce navigateur ne supporte pas les notifications.", false);
    return;
  }

  try {
    let permission = Notification.permission;
    if (permission !== "granted") {
      permission = await Notification.requestPermission();
    }

    if (permission !== "granted") {
      setStatus("Notifications refusées. Autorise-les dans les réglages iPhone.", false);
      return;
    }

    const supported = await isSupported().catch(() => false);
    if (!supported) {
      setStatus("FCM non supporté ici. Ouvre depuis l’icône installée sur iPhone.", false);
      return;
    }

    if (!("serviceWorker" in navigator)) {
      setStatus("Service Worker non supporté.", false);
      return;
    }

    const registration = await navigator.serviceWorker.register("./firebase-messaging-sw.js", { scope: "./" });
    await navigator.serviceWorker.ready;

    const messaging = getMessaging(app);

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (!token) {
      setStatus("Aucun token reçu. Réessaie depuis l’app installée.", false);
      return;
    }

    await setDoc(doc(db, "notification_tokens", user.uid), {
      uid: user.uid,
      email: user.email || "",
      role,
      token,
      updatedAt: serverTimestamp(),
      userAgent: navigator.userAgent,
      standalone: window.navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches,
      permission: Notification.permission
    }, { merge: true });

    setStatus("✅ Notifications push activées et token enregistré.");
    showLocalNotification("Didier.Elo", "Notifications push activées.");

    onMessage(messaging, (payload) => {
      showLocalNotification(
        payload.notification?.title || "Didier.Elo",
        payload.notification?.body || "Nouvelle notification"
      );
    });
  } catch (error) {
    console.error("Notification error:", error);
    setStatus("Erreur token: " + (error.code || error.message || error), false);
  }
}

export function showLocalNotification(title, body) {
  try {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "logo.jpeg", badge: "logo.jpeg" });
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
