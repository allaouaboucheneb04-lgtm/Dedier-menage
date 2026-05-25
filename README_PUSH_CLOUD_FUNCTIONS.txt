NOTIFICATIONS PUSH MÊME APP FERMÉE

La clé VAPID est déjà ajoutée dans firebase-config.js.

CE QUI EST INCLUS:
- firebase-messaging-sw.js à la racine
- notifications.js pour demander permission + enregistrer token
- collection Firestore: notification_tokens
- dossier firebase-functions-push avec Cloud Functions:
  - notifyNewQuote: envoie aux admins quand une soumission arrive
  - notifyAssignedTask: envoie à l’employé quand une tâche est assignée

ÉTAPES OBLIGATOIRES:

1) Déploie le site complet
Upload tous les fichiers sur GitHub/Netlify.

2) Mets les règles Firestore
Copie FIRESTORE_RULES.txt dans:
Firebase Console > Firestore Database > Rules > Publish

3) Active Authentication Email/Password
Firebase Console > Authentication > Sign-in method > Email/Password

4) Dans admin/employé
Ouvre login.html, connecte-toi, clique le bouton:
🔔 Notifications
Accepte les notifications.

5) iPhone IMPORTANT
Pour recevoir même fermé:
- ouvrir le site dans Safari
- Partager
- Ajouter à l’écran d’accueil
- ouvrir l’icône installée
- cliquer 🔔 Notifications et accepter

6) Déployer les Cloud Functions

Depuis un ordinateur avec Node.js:
npm install -g firebase-tools
firebase login
firebase use dedie-menage
cd firebase-functions-push
npm install
cd ..
firebase deploy --only functions

NOTE:
GitHub Pages/Netlify ne peut pas déployer les Cloud Functions.
Les fonctions doivent être déployées avec Firebase CLI.

TEST:
- Soumission client => admin reçoit push
- Admin assigne tâche => employé reçoit push

SI ÇA NE MARCHE PAS:
- vérifie que notification_tokens contient un token pour admin/employé
- vérifie que les fonctions sont bien déployées dans Firebase > Functions
- sur iPhone, utiliser l’app installée sur écran d’accueil
