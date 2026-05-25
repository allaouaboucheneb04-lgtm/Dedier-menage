// Didier.Elo - OneSignal Push Notifications
// 1) Crée une app Web Push dans OneSignal
// 2) Copie ton APP ID ici
// 3) Mets le domaine exact de ton site dans OneSignal:
//    https://allaouaboucheneb04-lgtm.github.io

const DIDIER_ELO_ONESIGNAL_APP_ID = "REMPLACE_PAR_TON_ONESIGNAL_APP_ID";

function setOneSignalStatus(message, ok = true) {
  let el = document.getElementById("notificationStatus");
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

window.OneSignalDeferred = window.OneSignalDeferred || [];

if (DIDIER_ELO_ONESIGNAL_APP_ID.includes("REMPLACE")) {
  window.didierEloOneSignalSubscribe = async function () {
    setOneSignalStatus("OneSignal pas configuré: ajoute ton APP ID dans onesignal-init.js", false);
  };
} else {
  OneSignalDeferred.push(async function(OneSignal) {
    await OneSignal.init({
      appId: DIDIER_ELO_ONESIGNAL_APP_ID,
      safari_web_id: "",
      notifyButton: {
        enable: false
      },
      allowLocalhostAsSecureOrigin: true
    });

    window.didierEloOneSignalSubscribe = async function () {
      try {
        setOneSignalStatus("Activation OneSignal...");
        await OneSignal.Notifications.requestPermission();

        if (OneSignal.User && OneSignal.User.PushSubscription) {
          const id = OneSignal.User.PushSubscription.id;
          if (id) {
            setOneSignalStatus("✅ Notifications OneSignal activées.");
          } else {
            setOneSignalStatus("Autorisation donnée, abonnement en cours. Réessaie dans 10 secondes.", false);
          }
        } else {
          setOneSignalStatus("Permission demandée. Vérifie l’état dans OneSignal.", true);
        }
      } catch (e) {
        console.error(e);
        setOneSignalStatus("Erreur OneSignal: " + (e.message || e), false);
      }
    };
  });
}
