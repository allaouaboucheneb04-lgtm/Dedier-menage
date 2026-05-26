export async function initNotifications() {
  const el = document.getElementById("notificationStatus");
  const msg = "Notifications temporairement désactivées pour remettre le site stable.";
  if (el) el.textContent = msg;
  alert(msg);
}
export function showLocalNotification() {}
