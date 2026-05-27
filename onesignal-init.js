window.OneSignalDeferred = window.OneSignalDeferred || [];

OneSignalDeferred.push(async function(OneSignal) {
  await OneSignal.init({
    appId: "6c4e8421-6a3f-48e1-948c-f7a5d07ed234",
  });

  window.didierEloOneSignalSubscribe = async function () {
    try {
      await OneSignal.Notifications.requestPermission();

      let el = document.getElementById("notificationStatus");
      if (!el) {
        el = document.createElement("p");
        el.id = "notificationStatus";
        el.className = "notificationStatus";
        const main = document.querySelector(".adminMain") || document.body;
        main.prepend(el);
      }

      if (OneSignal.Notifications.permission) {
        el.textContent = "✅ Notifications OneSignal activées.";
        el.style.color = "#078b45";
      } else {
        el.textContent = "Notifications refusées dans les réglages.";
        el.style.color = "#d21f3c";
      }
    } catch (e) {
      alert("Erreur OneSignal: " + (e.message || e));
    }
  };
});
