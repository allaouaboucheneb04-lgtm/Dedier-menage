NOUVELLE INVITATION EMPLOYÉ PAR EMAIL

Pages cachées:
- login.html
- admin.html
- employe.html
- invite.html

Workflow:
1. Admin se connecte sur login.html
2. Admin va dans admin.html
3. Dans "Inviter un employé par email":
   - nom
   - email
   - rôle employé
4. Le système crée un lien invitation:
   invite.html?code=XXXXXXXX
5. Clique "Envoyer par email"
6. L’employé ouvre le lien, crée son mot de passe
7. Son compte Firebase Auth + son document users sont créés automatiquement
8. L’employé arrive sur employe.html

IMPORTANT:
Active Firebase Authentication > Email/Password.

Règles:
Copie FIRESTORE_RULES.txt dans Firestore Rules.
