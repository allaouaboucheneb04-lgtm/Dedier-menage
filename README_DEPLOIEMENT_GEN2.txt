DEPLOIEMENT FIREBASE FUNCTIONS GEN 2 - DIDIER.ELO

Ce ZIP remplace les fonctions Gen 1 par Gen 2 Node 20.
Cela corrige l'erreur:
Cannot set CPU ... because they are GCF gen 1

IMPORTANT: ta clé OneSignal REST API doit être mise en secret Firebase.

Depuis le dossier principal du projet:

1) Installer les dépendances:
cd firebase-functions-push
npm install
cd ..

2) Ajouter la clé REST API OneSignal comme secret:
firebase functions:secrets:set ONESIGNAL_REST_KEY

Quand Firebase demande la valeur, colle ta REST API Key OneSignal.

3) Déployer:
firebase deploy --only functions --project dedie-menage

Les fonctions surveillent:
- demandes_soumission/{id} => notifyNewQuote
- taches/{id} => notifyAssignedTask

App ID OneSignal:
6c4e8421-6a3f-48e1-948c-f7a5d07ed234
