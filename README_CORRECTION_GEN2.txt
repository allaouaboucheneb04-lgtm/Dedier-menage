CORRECTION GEN2 DIDIER.ELO

Fichier corrigé:
- firebase-functions-push/index.js

Cette version utilise la bonne syntaxe Firebase Functions Gen 2:
onDocumentCreated(...)

Commandes à faire sur PC depuis le dossier principal:

cd firebase-functions-push
del package-lock.json
rmdir /s /q node_modules
npm install firebase-functions@latest firebase-admin@latest --save
cd ..
firebase deploy --only functions --project dedie-menage

Si le secret n'est pas encore configuré:
firebase functions:secrets:set ONESIGNAL_REST_KEY
