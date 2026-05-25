import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { getMessaging, getToken, onMessage, isSupported } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging.js";
import { VAPID_KEY } from "./firebase-config.js";

function setStatus(message, ok = true) {
  const el = document.getElementById("notificationStatus") || document.getElementById("adminDebugBox");
  if (el) {
    el.textContent = message;
    el.style.color = ok ? "#078b45" : "#d21f3c";
  }
  console.log("[Notifications]", message);
}

async function getCleanRegistration() {
  if (!("serviceWorker" in navigator)) throw new Error("Service Worker non supporté.");

  // Supprime les anciens SW/cache qui peuvent causer CORS/cache bug
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const r of regs) {
      if (r.active && !String(r.active.scriptURL).includes("firebase-messaging-sw.js")) {
        await r.unregister();
      }
    }
  } catch(e) {}

  // IMPORTANT: URL absolue même origine pour éviter "CORS-cross-origin"
  const swUrl = new URL("firebase-messaging-sw.js?v=notif-cors-fix-1", location.href).href;
  const reg = await navigator.serviceWorker.register(swUrl, { scope: "./" });
  await navigator.serviceWorker.ready;
  return reg;
}

export async function initNotifications(app, db, user, role) {
  try {
    setStatus("Activation des notifications...");

    if (!user) return setStatus("Utilisateur non connecté.", false);
    if (!("Notification" in window)) return setStatus("Notifications non supportées.", false);

    const supported = await isSupported().catch(() => false);
    if (!supported) return setStatus("FCM non supporté sur ce navigateur.", false);

    let permission = Notification.permission;
    if (permission !== "granted") permission = await Notification.requestPermission();
    if (permission !== "granted") return setStatus("Notifications refusées.", false);

    const registration = await getCleanRegistration();

    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (!token) return setStatus("Aucun token reçu.", false);

    await setDoc(doc(db, "notification_tokens", user.uid), {
      uid: user.uid,
      email: user.email || "",
      role,
      token,
      permission: Notification.permission,
      userAgent: navigator.userAgent,
      standalone: window.navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches,
      updatedAt: serverTimestamp()
    }, { merge: true });

    setStatus("✅ Notifications activées.");
    showLocalNotification("Didier.Elo", "Notifications activées.");

    onMessage(messaging, (payload) => {
      showLocalNotification(payload.notification?.title || "Didier.Elo", payload.notification?.body || "Nouvelle notification");
    });

  } catch (error) {
    console.error(error);
    setStatus("Erreur notifications: " + (error.code || error.message || error), false);
  }
}

export function showLocalNotification(title, body) {
  try {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "logo.jpeg", badge: "logo.jpeg" });
    }
  } catch (e) {}
}
