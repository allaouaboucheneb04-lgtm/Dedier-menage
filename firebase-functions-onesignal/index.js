const { onDocumentCreated } = require("firebase-functions/v2/firestore");

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || "REMPLACE_PAR_APP_ID";
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY || "REMPLACE_PAR_REST_API_KEY";

async function sendOneSignal(title, message) {
  const res = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Authorization": `Basic ${ONESIGNAL_REST_API_KEY}`
    },
    body: JSON.stringify({
      app_id: ONESIGNAL_APP_ID,
      included_segments: ["Subscribed Users"],
      headings: { en: title, fr: title },
      contents: { en: message, fr: message },
      url: "/admin.html"
    })
  });

  if (!res.ok) {
    console.error(await res.text());
  }
}

exports.notifyNewQuoteOneSignal = onDocumentCreated("demandes_soumission/{id}", async (event) => {
  const q = event.data.data();
  await sendOneSignal(
    "Nouvelle soumission Didier.Elo",
    `${q.name || "Client"} - ${q.service || "Service"}`
  );
});
