const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

async function sendToTokens(tokens, notification, data = {}) {
  const cleanTokens = [...new Set(tokens.filter(Boolean))];

  if (!cleanTokens.length) {
    logger.info("No tokens to send.");
    return null;
  }

  const response = await admin.messaging().sendEachForMulticast({
    tokens: cleanTokens,
    notification,
    data,
    webpush: {
      fcmOptions: {
        link: data.url || "/login.html"
      },
      notification: {
        icon: "/logo.jpeg",
        badge: "/logo.jpeg",
        vibrate: [200, 100, 200],
        requireInteraction: false
      }
    }
  });

  logger.info("Push sent", {
    successCount: response.successCount,
    failureCount: response.failureCount
  });

  // Supprime les tokens morts
  const deletions = [];
  response.responses.forEach((r, i) => {
    if (!r.success) {
      const code = r.error && r.error.code;
      logger.warn("Token send failed", { code, message: r.error?.message });

      if (
        code === "messaging/registration-token-not-registered" ||
        code === "messaging/invalid-registration-token"
      ) {
        deletions.push(deleteToken(cleanTokens[i]));
      }
    }
  });

  await Promise.allSettled(deletions);
  return response;
}

async function deleteToken(token) {
  const snap = await admin.firestore()
    .collection("notification_tokens")
    .where("token", "==", token)
    .get();

  const batch = admin.firestore().batch();
  snap.docs.forEach((doc) => batch.delete(doc.ref));
  return batch.commit();
}

exports.notifyNewQuote = onDocumentCreated("demandes_soumission/{id}", async (event) => {
  const quote = event.data && event.data.data();
  if (!quote) return null;

  const tokensSnap = await admin.firestore()
    .collection("notification_tokens")
    .where("role", "==", "admin")
    .get();

  const tokens = tokensSnap.docs.map((d) => d.data().token);

  return sendToTokens(
    tokens,
    {
      title: "Nouvelle soumission Didier.Elo",
      body: `${quote.name || "Client"} - ${quote.service || "Nouveau service"}`
    },
    {
      type: "new_quote",
      quoteId: event.params.id,
      url: "/admin.html"
    }
  );
});

exports.notifyAssignedTask = onDocumentCreated("taches/{id}", async (event) => {
  const task = event.data && event.data.data();
  if (!task || !task.employeeId) return null;

  const tokenDoc = await admin.firestore()
    .collection("notification_tokens")
    .doc(task.employeeId)
    .get();

  const token = tokenDoc.exists ? tokenDoc.data().token : null;

  return sendToTokens(
    token ? [token] : [],
    {
      title: "Nouveau travail assigné",
      body: `${task.service || "Service"} - ${task.address || "Adresse"}`
    },
    {
      type: "assigned_task",
      taskId: event.params.id,
      url: "/employe.html"
    }
  );
});
