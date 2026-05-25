import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  getFirestore, doc, getDoc, collection, getDocs,
  updateDoc, serverTimestamp, query, where
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { firebaseConfig, ROLES_COLLECTION, TASKS_COLLECTION } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;

const $ = (id) => document.getElementById(id);

onAuthStateChanged(auth, async (user) => {
  if (!user) return window.location.href = "login.html";

  currentUser = user;
  $("employeeEmail").textContent = user.email || user.uid;

  const roleSnap = await getDoc(doc(db, ROLES_COLLECTION, user.uid));
  if (!roleSnap.exists() || roleSnap.data().role !== "employe") {
    alert("Accès employé refusé.");
    return window.location.href = "login.html";
  }

  await loadTasks();
});

$("logoutBtn").onclick = async () => {
  await signOut(auth);
  window.location.href = "login.html";
};

$("refreshTasks").onclick = loadTasks;

async function loadTasks() {
  const list = $("tasksList");
  list.innerHTML = "<p>Chargement...</p>";

  const snap = await getDocs(query(collection(db, TASKS_COLLECTION), where("employeeId", "==", currentUser.uid)));
  const tasks = [];
  snap.forEach((d) => {
    const data = d.data();
    if (data.status !== "terminé") {
      tasks.push({ id: d.id, ...data });
    }
  });

  if (!tasks.length) {
    list.innerHTML = "<p>Aucun travail assigné pour le moment.</p>";
    return;
  }

  list.innerHTML = tasks.map(taskCard).join("");

  list.querySelectorAll("[data-status]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const note = document.querySelector(`[data-note="${btn.dataset.task}"]`)?.value || "";
      const updateData = {
        status: btn.dataset.status,
        notes: note,
        updatedAt: serverTimestamp()
      };

      if (btn.dataset.status === "terminé") {
        updateData.completedAt = serverTimestamp();
      }

      await updateDoc(doc(db, TASKS_COLLECTION, btn.dataset.task), updateData);
      await loadTasks();
    });
  });
}

function taskCard(t) {
  const isStarted = t.status === "en cours";
  const mainButtonLabel = isStarted ? "Terminé" : "Commencer";
  const mainButtonStatus = isStarted ? "terminé" : "en cours";

  return `
    <article class="adminCard">
      <div class="cardTop">
        <h3>${escapeHtml(t.clientName || "Client")}</h3>
        <span class="status">${escapeHtml(t.status || "assigné")}</span>
      </div>
      <p><b>Service:</b> ${escapeHtml(t.service || "-")}</p>
      <p><b>Adresse:</b> ${escapeHtml(t.address || "-")}</p>
      <p><b>Date:</b> ${escapeHtml(t.date || "-")}</p>
      <p><b>Téléphone:</b> <a href="tel:${escapeHtml(t.phone || "")}">${escapeHtml(t.phone || "-")}</a></p>
      <p><b>Message:</b> ${escapeHtml(t.message || "-")}</p>

      <label class="noteLabel">Note employé
        <textarea data-note="${t.id}" placeholder="Ajouter une note...">${escapeHtml(t.notes || "")}</textarea>
      </label>

      <div class="assignRow oneButton">
        <button class="smallBtn ${isStarted ? "ok" : ""}" data-task="${t.id}" data-status="${mainButtonStatus}">
          ${mainButtonLabel}
        </button>
      </div>
    </article>
  `;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[m]));
}
