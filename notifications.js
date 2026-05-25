import { getMessaging, getToken, onMessage, isSupported } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { VAPID_KEY } from "./firebase-config.js";

function setStatus(message, ok = true) {
  const el = document.getElementById("notificationStatus") || document.getElementById("adminDebugBox");
  if (el) {
    el.textContent = message;
    el.style.color = ok ? "#078b45" : "#d21f3c";
  }
  console.log("[Notifications]", message);
}

export async function initNotifications(app, db, user, role) {
  try {
    if (!user) return setStatus("Utilisateur non connecté.", false);
    if (!("Notification" in window)) return setStatus("Notifications non supportées.", false);

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return setStatus("Notifications refusées.", false);

    if (!("serviceWorker" in navigator)) return setStatus("Service Worker non supporté.", false);

    const supported = await isSupported().catch(() => false);
    if (!supported) return setStatus("FCM non supporté sur ce navigateur.", false);

    const registration = await navigator.serviceWorker.register("./firebase-messaging-sw.js", { scope: "./" });
    await navigator.serviceWorker.ready;

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
      updatedAt: serverTimestamp(),
      standalone: window.navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches,
      userAgent: navigator.userAgent,
      permission: Notification.permission
    }, { merge: true });

    setStatus("✅ Notifications activées et token enregistré.");
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
  } catch(e) {}
}
