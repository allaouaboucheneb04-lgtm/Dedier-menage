const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.notifyNewQuote = functions.firestore
  .document("demandes_soumission/{id}")
  .onCreate(async (snap) => {
    const quote = snap.data();

    const tokensSnap = await admin.firestore()
      .collection("notification_tokens")
      .where("role", "==", "admin")
      .get();

    const tokens = tokensSnap.docs.map(d => d.data().token).filter(Boolean);
    if (!tokens.length) return null;

    return admin.messaging().sendEachForMulticast({
      tokens,
      notification: {
        title: "Nouvelle soumission Didier.Elo",
        body: `${quote.name || "Client"} - ${quote.service || "Service"}`
      },
      data: {
        type: "new_quote"
      }
    });
  });

exports.notifyAssignedTask = functions.firestore
  .document("taches/{id}")
  .onCreate(async (snap) => {
    const task = snap.data();

    if (!task.employeeId) return null;

    const tokenDoc = await admin.firestore()
      .collection("notification_tokens")
      .doc(task.employeeId)
      .get();

    if (!tokenDoc.exists || !tokenDoc.data().token) return null;

    return admin.messaging().send({
      token: tokenDoc.data().token,
      notification: {
        title: "Nouveau travail assigné",
        body: `${task.service || "Service"} - ${task.address || "Adresse"}`
      },
      data: {
        type: "assigned_task"
      }
    });
  });
