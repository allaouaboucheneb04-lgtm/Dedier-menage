const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const https = require("https");

const ONESIGNAL_APP_ID = "6c4e8421-6a3f-48e1-948c-f7a5d07ed234";

function sendOneSignal(title, message, data = {}) {
  return new Promise((resolve, reject) => {
    // La clé est lue depuis la variable d'environnement ONESIGNAL_REST_KEY
    const key = process.env.ONESIGNAL_REST_KEY;
    if (!key) {
      return reject(new Error("ONESIGNAL_REST_KEY manquante. Crée le fichier .env dans firebase-functions-push/"));
    }

    const body = JSON.stringify({
      app_id: ONESIGNAL_APP_ID,
      included_segments: ["Subscribed Users"],
      headings: { en: title, fr: title },
      contents: { en: message, fr: message },
      url: "https://www.didiereloservices.com/admin.html",
      data
    });

    const req = https.request(
      {
        hostname: "onesignal.com",
        path: "/api/v1/notifications",
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Authorization": "Basic " + key,
          "Content-Length": Buffer.byteLength(body)
        }
      },
      (res) => {
        let response = "";
        res.on("data", (chunk) => (response += chunk));
        res.on("end", () => {
          console.log("OneSignal:", res.statusCode, response);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(response);
          } else {
            reject(new Error("OneSignal error " + res.statusCode + ": " + response));
          }
        });
      }
    );

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

exports.notifyNewQuote = onDocumentCreated(
  {
    document: "demandes_soumission/{id}",
    region: "us-central1"
  },
  async (event) => {
    const q = event.data ? event.data.data() : {};
    const nom = q.nom || q.name || q.fullName || q.clientName || "Nouveau client";
    const service = q.service || q.type || "Soumission";
    const phone = q.telephone || q.phone || q.tel || "";

    return sendOneSignal(
      "Nouvelle soumission Didier.Elo",
      `${nom} - ${service}${phone ? " - " + phone : ""}`,
      { type: "new_quote", quoteId: event.params.id }
    );
  }
);

exports.notifyAssignedTask = onDocumentCreated(
  {
    document: "taches/{id}",
    region: "us-central1"
  },
  async (event) => {
    const t = event.data ? event.data.data() : {};
    return sendOneSignal(
      "Nouveau travail assigné",
      `${t.service || "Travail"} - ${t.adresse || t.address || ""}`,
      { type: "assigned_task", taskId: event.params.id, employeeId: t.employeeId || "" }
    );
  }
);
