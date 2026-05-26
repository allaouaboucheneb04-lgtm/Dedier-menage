export async function initNotifications() {
  if (window.didierEloOneSignalSubscribe) {
    return window.didierEloOneSignalSubscribe();
  }
  alert("OneSignal charge encore. Réessaie dans 5 secondes.");
}

export function showLocalNotification(title, body) {
  try {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "logo.jpeg" });
    }
  } catch (e) {}
}
