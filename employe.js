import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  getFirestore, doc, getDoc, collection, getDocs,
  updateDoc, serverTimestamp, query, where, onSnapshot
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
  const notifBtn = document.getElementById("enableNotificationsBtn");
  if (notifBtn) {
    notifBtn.onclick = async () => {
      try {
        notifBtn.disabled = true;
        notifBtn.textContent = "Activation...";
        const mod = await import("./notifications.js");
        await mod.initNotifications(app, db, user, "employe");
      } catch (error) {
        alert("Erreur notifications: " + (error.message || error));
      } finally {
        notifBtn.disabled = false;
        notifBtn.textContent = "🔔 Notifications";
      }
    };
  }
  $("employeeEmail").textContent = user.email || user.uid;

  const roleSnap = await getDoc(doc(db, ROLES_COLLECTION, user.uid));
  if (!roleSnap.exists() || roleSnap.data().role !== "employe") {
    alert("Accès employé refusé.");
    return window.location.href = "login.html";
  }

  await loadTasks();
  setupEmployeeRealtimeNotifications();

  const notifBtn = document.getElementById("enableNotificationsBtn");
  if (notifBtn) notifBtn.onclick = async () => {
        try {
          const mod = await import("./notifications.js");
          await mod.initNotifications(app, db, user, "employe");
        } catch (error) {
          console.error("Notifications module error:", error);
          alert("Erreur notifications, mais espace employé fonctionne.");
        }
      };
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
      <p><b>Adresse:</b> ${mapLink(t.address)}</p>
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


function phoneLink(phone) {
  if (!phone) return "-";
  const clean = String(phone).replace(/[^\d+]/g, "");
  return `<a href="tel:${clean}">${escapeHtml(phone)}</a>`;
}

function mapLink(address) {
  if (!address) return "-";
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  return `<a href="${url}" target="_blank" rel="noopener">${escapeHtml(address)}</a>`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[m]));
}


let firstEmployeeSnapshot = true;

function setupEmployeeRealtimeNotifications() {
  try {
    const q = query(
      collection(db, TASKS_COLLECTION),
      where("employeeId", "==", currentUser.uid)
    );

    onSnapshot(q, (snap) => {
      if (firstEmployeeSnapshot) {
        firstEmployeeSnapshot = false;
        return;
      }

      snap.docChanges().forEach((change) => {
        if (change.type === "added") {
          const t = change.doc.data();
          safeNotify(
            "Nouveau travail assigné",
            `${t.service || "Service"} - ${t.address || "Adresse"}`
          );
          loadTasks();
        }

        if (change.type === "modified") {
          loadTasks();
        }
      });
    });
  } catch (error) {
    console.error("Realtime employee notification error:", error);
  }
}


async function safeNotify(title, body) {
  try {
    const mod = await import("./notifications.js");
    mod.safeNotify(title, body);
  } catch (error) {
    console.warn("Notification skipped:", error);
  }
}
