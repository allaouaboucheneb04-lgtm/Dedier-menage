NOTIFICATIONS NOUVELLE SOUMISSION - DIDIER.ELO

Ce ZIP corrige les Cloud Functions pour envoyer les notifications avec OneSignal quand une nouvelle soumission est créée dans Firestore.

Collection surveillée:
demandes_soumission

App ID OneSignal:
6c4e8421-6a3f-48e1-948c-f7a5d07ed234

IMPORTANT:
Ne mets jamais la REST API Key OneSignal dans le code du site public.

À faire une seule fois dans Git Bash / CMD depuis le dossier du projet:

1) Installer les dépendances:
cd firebase-functions-push
npm install
cd ..

2) Ajouter la clé REST API OneSignal dans Firebase Functions:
firebase functions:config:set onesignal.key="TA_REST_API_KEY_ONESIGNAL" onesignal.app_id="6c4e8421-6a3f-48e1-948c-f7a5d07ed234"

3) Déployer:
firebase deploy --only functions --project dedie-menage

Après ça:
- Quand un client envoie une soumission, l'admin reçoit une notification.
- Quand un travail est créé, une notification est envoyée aussi.

La REST API Key est dans OneSignal:
Settings > Keys & IDs > REST API Key
