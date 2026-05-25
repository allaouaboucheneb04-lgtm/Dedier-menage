CORRECTION PWA + NOTIFICATIONS

Corrections incluses:
- manifest.json avec display standalone
- start_url = ./login.html
- scope = ./
- apple-mobile-web-app-capable ajouté dans admin/login/employe
- service worker ajouté à la racine
- pwa.js ajouté à toutes les pages
- notifications locales plus robustes

IMPORTANT POUR QUE ADMIN DEVIENNE UNE APP:
1. Déploie tous les fichiers à la racine du site GitHub/Netlify.
2. Ouvre https://tonsite.com/login.html dans Safari iPhone.
3. Clique Partager.
4. Ajouter à l’écran d’accueil.
5. Ouvre l’icône créée. Là elle sera en mode app sans barre Safari.

IMPORTANT NOTIFICATIONS:
- Les notifications locales marchent quand admin.html ou employe.html est ouvert.
- Pour recevoir même quand le site est fermé:
  1. Firebase Console > Project settings > Cloud Messaging
  2. Web Push certificates > Generate key pair
  3. Copie la clé VAPID
  4. Dans firebase-config.js remplace REMPLACE_PAR_TA_CLE_VAPID
  5. Déploie Cloud Functions dans firebase-functions-push
  6. Sur iPhone, installe le site sur écran d’accueil et accepte les notifications.

Sans VAPID + Cloud Functions, il n’y aura pas de vraie push quand l’app est fermée.
