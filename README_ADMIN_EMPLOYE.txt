CONFIGURATION ADMIN / EMPLOYÉ

IMPORTANT:
Les pages admin/employé ne sont PAS affichées au client dans le menu public.

Pages cachées:
- login.html
- admin.html
- employe.html

1) Active Firebase Authentication
Firebase Console > Authentication > Sign-in method > Email/Password > Enable

2) Crée ton compte admin dans Firebase Auth
Exemple: ton email + mot de passe

3) Copie ton UID Firebase Auth

4) Dans Firestore, crée:
Collection: users
Document ID: TON_UID_ADMIN
Champs:
role = admin
name = Allaoua
email = ton email
active = true

5) Mets les règles Firestore dans:
Firebase > Firestore Database > Rules
Copie le fichier FIRESTORE_RULES.txt

6) Pour créer un employé:
- Firebase Auth > Add user
- copie son UID
- connecte-toi à admin.html
- ajoute nom, email, UID
- ensuite l’employé se connecte via login.html

Workflow:
Client envoie soumission -> Admin la voit -> Admin choisit employé -> tâche créée -> employé voit seulement ses tâches.
