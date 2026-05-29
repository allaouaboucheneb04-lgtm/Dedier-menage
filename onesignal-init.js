window.OneSignalDeferred = window.OneSignalDeferred || [];

function setDidierOneSignalStatus(message, ok = true) {
  let el = document.getElementById("notificationStatus") || document.getElementById("adminDebugBox");
  if (!el) {
    el = document.createElement("p");
    el.id = "notificationStatus";
    el.className = "notificationStatus";
    const main = document.querySelector(".adminMain") || document.querySelector("main") || document.body;
    main.prepend(el);
  }
  el.textContent = message;
  el.style.color = ok ? "#078b45" : "#d21f3c";
  console.log("[OneSignal]", message);
}

OneSignalDeferred.push(async function(OneSignal) {
  try {
    await OneSignal.init({
      appId: "6c4e8421-6a3f-48e1-948c-f7a5d07ed234",
      notifyButton: { enable: false }
    });

    window.didierEloOneSignalReady = true;

    window.didierEloOneSignalSubscribe = async function () {
      try {
        setDidierOneSignalStatus("Demande autorisation notifications...");

        await OneSignal.Notifications.requestPermission();

        if (!OneSignal.Notifications.permission) {
          setDidierOneSignalStatus("Notifications refusées dans les réglages iPhone.", false);
          return;
        }

        setDidierOneSignalStatus("Création abonnement OneSignal...");

        try {
          await OneSignal.User.PushSubscription.optIn();
        } catch (e) {
          console.warn("optIn warning", e);
        }

        let subId = "";
        let optedIn = false;

        for (let i = 0; i < 15; i++) {
          subId = OneSignal.User?.PushSubscription?.id || "";
          optedIn = OneSignal.User?.PushSubscription?.optedIn || false;
          if (subId || optedIn) break;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        if (subId || optedIn) {
          setDidierOneSignalStatus("✅ Notifications activées avec OneSignal. " + (subId ? "ID: " + subId : ""));
        } else {
          setDidierOneSignalStatus("Permission OK, mais subscriber non créé. Vérifie OneSignal Site URL = https://www.didiereloservices.com", false);
        }
      } catch (e) {
        console.error(e);
        setDidierOneSignalStatus("Erreur OneSignal: " + (e.message || e), false);
      }
    };
  } catch (e) {
    console.error(e);
    setDidierOneSignalStatus("Erreur init OneSignal: " + (e.message || e), false);
  }
});
