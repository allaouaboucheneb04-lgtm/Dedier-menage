ONE SIGNAL - NOTIFICATIONS IPHONE

Cette version désactive FCM pour éviter l’erreur:
Network response is CORS-cross-origin

Elle ajoute OneSignal:
- onesignal-init.js
- OneSignalSDKWorker.js
- OneSignalSDKUpdaterWorker.js
- SDK OneSignal dans admin.html et employe.html

ÉTAPES:
1. Va sur https://onesignal.com
2. Crée une app
3. Choisis Web Push
4. Site URL:
   https://allaouaboucheneb04-lgtm.github.io
   ou ton vrai domaine
5. Copie le OneSignal App ID
6. Ouvre onesignal-init.js
7. Remplace:
   REMPLACE_PAR_TON_ONESIGNAL_APP_ID
8. Déploie sur GitHub
9. Ouvre l’app installée sur iPhone
10. Clique 🔔 Notifications

IMPORTANT:
OneSignal peut envoyer des notifications depuis son dashboard.
Pour envoyer automatiquement quand une soumission arrive, il faudra ajouter une Cloud Function ou webhook OneSignal.
