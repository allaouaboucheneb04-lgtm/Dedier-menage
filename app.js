import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyCz1BC9YSHQsBB1kBRWy8TdLqs2D7ytOiA",
  authDomain: "dedie-menage.firebaseapp.com",
  projectId: "dedie-menage",
  storageBucket: "dedie-menage.firebasestorage.app",
  messagingSenderId: "745599536988",
  appId: "1:745599536988:web:c217af2d377cf70ffffb99",
  measurementId: "G-217K38KGHD"
};

const EMAILJS_SERVICE_ID = "service_yxizoav";
const EMAILJS_TEMPLATE_ID = "template_7xcmars";
const EMAILJS_PUBLIC_KEY = "n4Ln13zFITFZtnmdL";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

try { getAnalytics(app); } catch (error) {}

emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });

document.getElementById("year").textContent = new Date().getFullYear();

const form = document.getElementById("quoteForm");
const statusEl = document.getElementById("formStatus");
const submitBtn = document.getElementById("submitBtn");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const data = Object.fromEntries(new FormData(form).entries());

  submitBtn.disabled = true;
  submitBtn.textContent = "Envoi en cours...";
  statusEl.textContent = "";

  try {
    await addDoc(collection(db, "demandes_soumission"), {
      ...data,
      source: "site_web",
      createdAt: serverTimestamp()
    });

    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      name: data.name || "",
      phone: data.phone || "",
      email: data.email || "",
      service: data.service || "",
      address: data.address || "",
      date: data.date || "",
      message: data.message || ""
    });

    statusEl.textContent = "✅ Demande envoyée avec succès. Nous allons vous contacter rapidement.";
    statusEl.style.color = "#0a8f45";
    form.reset();
  } catch (error) {
    console.error("Erreur formulaire:", error);
    statusEl.textContent = "❌ Erreur d’envoi. Vérifiez Firebase, EmailJS ou vos règles Firestore.";
    statusEl.style.color = "#d21f3c";
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Envoyer la demande";
  }
});
