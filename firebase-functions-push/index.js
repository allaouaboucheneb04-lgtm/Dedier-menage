const functions = require("firebase-functions");
const admin = require("firebase-admin");
const https = require("https");

admin.initializeApp();

const ONESIGNAL_APP_ID =
  (functions.config().onesignal && functions.config().onesignal.app_id) ||
  process.env.ONESIGNAL_APP_ID ||
  "6c4e8421-6a3f-48e1-948c-f7a5d07ed234";

const ONESIGNAL_REST_KEY =
  (functions.config().onesignal && functions.config().onesignal.key) ||
  process.env.ONESIGNAL_REST_KEY;

function sendOneSignalNotification({ title, message, url, data = {} }) {
  return new Promise((resolve, reject) => {
    if (!ONESIGNAL_REST_KEY) {
      console.error("ONESIGNAL_REST_KEY manquante. Ajoute la clé REST API OneSignal dans Firebase Functions config.");
      return resolve(null);
    }

    const body = JSON.stringify({
      app_id: ONESIGNAL_APP_ID,
      included_segments: ["Subscribed Users"],
      headings: { fr: title, en: title },
      contents: { fr: message, en: message },
      url: url || "https://www.didiereloservices.com/admin.html",
      data
    });

    const req = https.request(
      {
        hostname: "api.onesignal.com",
        path: "/notifications",
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Authorization": "Key " + ONESIGNAL_REST_KEY,
          "Content-Length": Buffer.byteLength(body)
        }
      },
      (res) => {
        let response = "";
        res.on("data", (chunk) => (response += chunk));
        res.on("end", () => {
          console.log("OneSignal response:", res.statusCode, response);
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

exports.notifyNewQuote = functions.firestore
  .document("demandes_soumission/{id}")
  .onCreate(async (snap, context) => {
    const quote = snap.data() || {};

    const nom =
      quote.name ||
      quote.nom ||
      quote.fullName ||
      quote.clientName ||
      "Nouveau client";

    const service = quote.service || quote.type || "Soumission";
    const phone = quote.phone || quote.telephone || quote.tel || "";

    return sendOneSignalNotification({
      title: "Nouvelle soumission Didier.Elo",
      message: `${nom} - ${service}${phone ? " - " + phone : ""}`,
      url: "https://www.didiereloservices.com/admin.html",
      data: {
        type: "new_quote",
        quoteId: context.params.id
      }
    });
  });

exports.notifyAssignedTask = functions.firestore
  .document("taches/{id}")
  .onCreate(async (snap, context) => {
    const task = snap.data() || {};

    const service = task.service || "Nouveau travail";
    const address = task.address || task.adresse || "Adresse non précisée";

    return sendOneSignalNotification({
      title: "Nouveau travail assigné",
      message: `${service} - ${address}`,
      url: "https://www.didiereloservices.com/admin.html",
      data: {
        type: "assigned_task",
        taskId: context.params.id,
        employeeId: task.employeeId || ""
      }
    });
  });
