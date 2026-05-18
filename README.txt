Version WOW / tape-à-l'œil pour Didier.Elo Multi Service Inc.

Remplace les anciens fichiers GitHub par ceux-ci:
index.html
style.css
app.js
manifest.json
logo.jpeg

Firebase collection:
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
