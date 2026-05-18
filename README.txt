SITE DIDIER.ELO MULTI SERVICE INC

Fichiers:
- index.html
- style.css
- app.js
- manifest.json
- icon.svg

Déploiement GitHub:
1. Crée un nouveau repository.
2. Upload tous les fichiers.
3. Va dans Settings > Pages.
4. Source: Deploy from branch.
5. Branche: main / root.
6. Attends le lien GitHub Pages.

Firebase:
Le formulaire enregistre les demandes dans:
demandes_soumission

Règles Firestore simples pour test:
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /demandes_soumission/{id} {
      allow create: if true;
      allow read, update, delete: if false;
    }
  }
}

EmailJS:
Service ID: service_yxizoav
Template ID: template_7xcmars
Public Key déjà intégré.
