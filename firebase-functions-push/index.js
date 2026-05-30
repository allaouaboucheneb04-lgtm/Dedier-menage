const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const https = require("https");

const ONESIGNAL_REST_KEY = defineSecret("ONESIGNAL_REST_KEY");
const ONESIGNAL_APP_ID = "6c4e8421-6a3f-48e1-948c-f7a5d07ed234";

function postToOneSignal(restKey, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);

    const req = https.request(
      {
        hostname: "api.onesignal.com",
        path: "/notifications",
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Authorization": "Key " + restKey,
          "Content-Length": Buffer.byteLength(body)
        }
      },
      (res) => {
        let response = "";
        res.on("data", (chunk) => (response += chunk));
        res.on("end", () => {
          logger.info("OneSignal response", { statusCode: res.statusCode, response });
          if (res.statusCode >= 200 && res.statusCode < 300) resolve(response);
          else reject(new Error("OneSignal error " + res.statusCode + ": " + response));
        });
      }
    );

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function sendOneSignalNotification(restKey, { title, message, url, data = {} }) {
  return postToOneSignal(restKey, {
    app_id: ONESIGNAL_APP_ID,
    included_segments: ["Subscribed Users"],
    headings: { fr: title, en: title },
    contents: { fr: message, en: message },
    url: url || "https://www.didiereloservices.com/admin.html",
    data
  });
}

exports.notifyNewQuote = onDocumentCreated(
  {
    document: "demandes_soumission/{id}",
    region: "us-central1",
    secrets: [ONESIGNAL_REST_KEY]
  },
  async (event) => {
    const quote = event.data ? event.data.data() : {};
    const id = event.params.id;

    const nom =
      quote.name ||
      quote.nom ||
      quote.fullName ||
      quote.clientName ||
      "Nouveau client";

    const service = quote.service || quote.type || "Soumission";
    const phone = quote.phone || quote.telephone || quote.tel || "";

    logger.info("Nouvelle soumission", { id, nom, service, phone });

    return sendOneSignalNotification(ONESIGNAL_REST_KEY.value(), {
      title: "Nouvelle soumission Didier.Elo",
      message: `${nom} - ${service}${phone ? " - " + phone : ""}`,
      url: "https://www.didiereloservices.com/admin.html",
      data: {
        type: "new_quote",
        quoteId: id
      }
    });
  }
);

exports.notifyAssignedTask = onDocumentCreated(
  {
    document: "taches/{id}",
    region: "us-central1",
    secrets: [ONESIGNAL_REST_KEY]
  },
  async (event) => {
    const task = event.data ? event.data.data() : {};
    const id = event.params.id;

    const service = task.service || "Nouveau travail";
    const address = task.address || task.adresse || "Adresse non précisée";

    logger.info("Nouveau travail", { id, service, address });

    return sendOneSignalNotification(ONESIGNAL_REST_KEY.value(), {
      title: "Nouveau travail assigné",
      message: `${service} - ${address}`,
      url: "https://www.didiereloservices.com/admin.html",
      data: {
        type: "assigned_task",
        taskId: id,
        employeeId: task.employeeId || ""
      }
    });
  }
);
