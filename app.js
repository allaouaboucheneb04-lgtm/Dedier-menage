import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCz1BC9YSHQsBB1kBRWy8TdLqs2D7ytOiA",
  authDomain: "dedie-menage.firebaseapp.com",
  projectId: "dedie-menage",
  storageBucket: "dedie-menage.firebasestorage.app",
  messagingSenderId: "745599536988",
  appId: "1:745599536988:web:c217af2d377cf70ffffb99"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

emailjs.init({ publicKey: "n4Ln13zFITFZtnmdL" });

const form = document.getElementById("quoteForm");
const statusEl = document.getElementById("formStatus");
const submitBtn = document.getElementById("submitBtn");

form.addEventListener("submit", async(e)=>{
e.preventDefault();

const data = Object.fromEntries(new FormData(form).entries());

submitBtn.disabled = true;
submitBtn.textContent = "Envoi en cours...";

try{

await addDoc(collection(db,"demandes_soumission"),{
...data,
createdAt: serverTimestamp()
});

await emailjs.send(
"service_yxizoav",
"template_7xcmars",
data
);

statusEl.innerHTML = "✅ Demande envoyée avec succès";
statusEl.style.color = "#00a86b";

form.reset();

}catch(error){

console.error(error);

statusEl.innerHTML = "❌ Erreur d'envoi";
statusEl.style.color = "red";

}

submitBtn.disabled = false;
submitBtn.textContent = "Envoyer la demande";

});
