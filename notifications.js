export async function initNotifications() {
  alert("FCM désactivé. Utilise OneSignal.");
}
export function showLocalNotification(title, body) {
  try {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "logo.jpeg" });
    }
  } catch (e) {}
}
