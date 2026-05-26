window.OneSignalDeferred = window.OneSignalDeferred || [];

function setOneSignalStatus(message, ok = true) {
  let el = document.getElementById("notificationStatus") || document.getElementById("adminDebugBox");
  if (!el) {
    el = document.createElement("p");
    el.id = "notificationStatus";
    el.className = "notificationStatus";
    const main = document.querySelector(".adminMain") || document.body;
    main.prepend(el);
  }
  el.textContent = message;
  el.style.color = ok ? "#078b45" : "#d21f3c";
  console.log("[OneSignal]", message);
}

OneSignalDeferred.push(async function(OneSignal) {
  await OneSignal.init({
    appId: "6c4e8421-6a3f-48e1-948c-f7a5d07ed234",
    notifyButton: { enable: false },
    allowLocalhostAsSecureOrigin: true
  });

  window.didierEloOneSignalSubscribe = async function () {
    try {
      setOneSignalStatus("Activation des notifications...");
      await OneSignal.Notifications.requestPermission();

      if (!OneSignal.Notifications.permission) {
        setOneSignalStatus("Notifications refusées dans les réglages iPhone.", false);
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 2500));

      const subId = OneSignal.User && OneSignal.User.PushSubscription ? OneSignal.User.PushSubscription.id : null;
      const optedIn = OneSignal.User && OneSignal.User.PushSubscription ? OneSignal.User.PushSubscription.optedIn : false;

      if (subId || optedIn) {
        setOneSignalStatus("✅ Notifications activées avec OneSignal.");
      } else {
        setOneSignalStatus("Autorisation donnée. Ferme/r ouvre l’app puis clique encore 🔔.", false);
      }
    } catch (e) {
      console.error(e);
      setOneSignalStatus("Erreur OneSignal: " + (e.message || e), false);
    }
  };
});
