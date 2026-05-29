async function waitForOneSignal() {
  for (let i = 0; i < 20; i++) {
    if (window.didierEloOneSignalSubscribe) return true;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  return false;
}

export async function initNotifications() {
  const ready = await waitForOneSignal();
  if (!ready) {
    const el = document.getElementById("notificationStatus") || document.getElementById("adminDebugBox");
    const msg = "OneSignal ne charge pas. Vérifie que OneSignalSDKWorker.js est accessible à la racine du domaine.";
    if (el) {
      el.textContent = msg;
      el.style.color = "#d21f3c";
    } else {
      alert(msg);
    }
    return;
  }
  return window.didierEloOneSignalSubscribe();
}

export function showLocalNotification(title, body) {
  try {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "logo.jpeg" });
    }
  } catch (e) {}
}
