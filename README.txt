SITE MODERNE DIDIER.ELO MULTI SERVICE INC

Fichiers inclus:
- index.html
- style.css
- app.js
- manifest.json
- logo.jpeg

Firebase:
Collection utilisée:
demandes_soumission

Règles Firestore:
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /demandes_soumission/{document} {
      allow create: if true;
      allow read, update, delete: if false;
    }
  }
}

EmailJS:
Service ID: service_yxizoav
Template ID: template_7xcmars
Public Key: intégré dans app.js

Déploiement GitHub:
1. Remplace les anciens fichiers par ceux-ci.
2. Upload tout dans GitHub.
3. Attends 2-5 minutes.
4. Recharge le site.
