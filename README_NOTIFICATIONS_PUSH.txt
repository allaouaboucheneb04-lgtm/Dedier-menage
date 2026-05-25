NOTIFICATIONS AJOUTÉES

Ce qui fonctionne directement dans le navigateur:
- Admin reçoit une notification locale + bip quand une nouvelle soumission arrive pendant que admin.html est ouvert.
- Employé reçoit une notification locale + bip quand un travail lui est assigné pendant que employe.html est ouvert.
- Bouton 🔔 Notifications dans admin/employe.

Pour notifications push même quand le site est fermé:
1. Firebase Console > Project settings > Cloud Messaging
2. Web Push certificates > Generate key pair
3. Copie la clé VAPID
4. Dans firebase-config.js remplace:
   REMPLACE_PAR_TA_CLE_VAPID
5. Déploie le site avec firebase-messaging-sw.js à la racine
6. Déploie les Cloud Functions dans le dossier firebase-functions-push

IMPORTANT iPhone:
Sur iPhone, les push web fonctionnent surtout avec le site installé sur l’écran d’accueil (PWA) et l’utilisateur doit accepter les notifications.
