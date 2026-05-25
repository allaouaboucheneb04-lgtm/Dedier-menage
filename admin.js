import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, collection, getDocs,
  addDoc, updateDoc, serverTimestamp, query, orderBy, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { firebaseConfig, ROLES_COLLECTION, QUOTES_COLLECTION, TASKS_COLLECTION } from "./firebase-config.js";

const INVITES_COLLECTION = "invites";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let employees = [];
let currentUser = null;
let firstAdminSnapshot = true;

const $ = (id) => document.getElementById(id);

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  currentUser = user;
  $("adminEmail").textContent = user.email || user.uid;

  try {
    const roleSnap = await getDoc(doc(db, ROLES_COLLECTION, user.uid));

    if (!roleSnap.exists() || roleSnap.data().role !== "admin") {
      alert("Accès admin refusé. Vérifie le document users/" + user.uid);
      window.location.href = "login.html";
      return;
    }

    const logoutBtn = $("logoutBtn");
    if (logoutBtn) {
      logoutBtn.onclick = async () => {
        await signOut(auth);
        window.location.href = "login.html";
      };
    }

    const notifBtn = $("enableNotificationsBtn");
    if (notifBtn) {
      notifBtn.onclick = async () => {
        try {
          const mod = await import("./notifications.js");
          await mod.initNotifications(app, db, user, "admin");
        } catch (error) {
          console.error("Notifications module error:", error);
          alert("Erreur notifications, mais admin fonctionne.");
        }
      };
    }

    const refreshQuotes = $("refreshQuotes");
    if (refreshQuotes) refreshQuotes.onclick = loadQuotes;

    const refreshTasks = $("refreshTasks");
    if (refreshTasks) refreshTasks.onclick = loadTasks;

    await loadAll();
    setupAdminRealtimeNotifications();

  } catch (error) {
    console.error(error);
    alert("Erreur admin. Vérifie les rules Firestore.");
  }
});

async function loadAll() {
  await loadEmployees();
  await loadQuotes();
  await loadTasks();
}

async function loadEmployees() {
  const snap = await getDocs(collection(db, ROLES_COLLECTION));
  employees = [];

  snap.forEach((d) => {
    const data = d.data();
    if (data.role === "employe") {
      employees.push({ id: d.id, ...data });
    }
  });

  const countEmployees = $("countEmployees");
  if (countEmployees) countEmployees.textContent = employees.length;
}

const inviteForm = $("inviteForm");
if (inviteForm) {
  inviteForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(e.target).entries());
    const code = crypto.randomUUID().slice(0, 8).toUpperCase();
    const cleanEmail = data.email.trim().toLowerCase();
    const baseUrl = location.href.replace("admin.html", "");
    const link = `${baseUrl}invite.html?code=${code}`;

    try {
      await setDoc(doc(db, INVITES_COLLECTION, code), {
        code,
        name: data.name.trim(),
        email: cleanEmail,
        role: "employe",
        status: "pending",
        createdAt: serverTimestamp(),
        createdBy: currentUser.uid,
        inviteLink: link
      });

      const inviteStatus = $("inviteStatus");
      if (inviteStatus) {
        inviteStatus.textContent = "✅ Invitation créée. Copie le lien et envoie-le à l’employé.";
        inviteStatus.style.color = "#078b45";
      }

      if ($("inviteResult")) $("inviteResult").hidden = false;
      if ($("inviteLink")) $("inviteLink").value = link;

      e.target.reset();
    } catch (error) {
      console.error(error);
      const inviteStatus = $("inviteStatus");
      if (inviteStatus) {
        inviteStatus.textContent = "❌ Erreur création invitation.";
        inviteStatus.style.color = "#d21f3c";
      }
    }
  });
}

const copyInvite = $("copyInvite");
if (copyInvite) {
  copyInvite.addEventListener("click", async () => {
    await navigator.clipboard.writeText($("inviteLink").value);
    $("inviteStatus").textContent = "✅ Lien copié.";
    $("inviteStatus").style.color = "#078b45";
  });
}

async function loadQuotes() {
  const list = $("quotesList");
  if (!list) return;

  list.innerHTML = "<p>Chargement des soumissions...</p>";

  let snap;
  try {
    snap = await getDocs(query(collection(db, QUOTES_COLLECTION), orderBy("createdAt", "desc")));
  } catch (error) {
    console.warn("OrderBy failed, fallback simple getDocs", error);
    snap = await getDocs(collection(db, QUOTES_COLLECTION));
  }

  const docs = [];
  snap.forEach((d) => docs.push({ id: d.id, ...d.data() }));

  const countQuotes = $("countQuotes");
  if (countQuotes) countQuotes.textContent = docs.length;

  if (!docs.length) {
    list.innerHTML = "<p>Aucune soumission pour le moment.</p>";
    return;
  }

  list.innerHTML = docs.map((q) => quoteCard(q)).join("");

  list.querySelectorAll("[data-assign]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const quoteId = btn.dataset.assign;
      const select = document.querySelector(`[data-employee-select="${quoteId}"]`);
      const emp = employees.find(e => e.id === select.value);

      if (!emp) {
        alert("Choisis un employé.");
        return;
      }

      const q = docs.find(x => x.id === quoteId);

      await addDoc(collection(db, TASKS_COLLECTION), {
        quoteId,
        clientName: q.name || "",
        phone: q.phone || "",
        email: q.email || "",
        service: q.service || "",
        address: q.address || "",
        date: q.date || "",
        message: q.message || "",
        employeeId: emp.id,
        employeeName: emp.name || emp.email || "Employé",
        employeeEmail: emp.email || "",
        status: "assigné",
        notes: "",
        createdAt: serverTimestamp(),
        assignedBy: currentUser.uid
      });

      await updateDoc(doc(db, QUOTES_COLLECTION, quoteId), {
        status: "assigné",
        assignedTo: emp.id,
        assignedToName: emp.name || emp.email || "Employé"
      });

      alert("Travail assigné ✅");
      await loadAll();
    });
  });
}

function quoteCard(q) {
  const options = employees.map(e => `<option value="${e.id}">${escapeHtml(e.name || e.email)}</option>`).join("");

  return `
    <article class="adminCard">
      <div class="cardTop">
        <h3>${escapeHtml(q.name || "Sans nom")}</h3>
        <span class="status">${escapeHtml(q.status || "nouveau")}</span>
      </div>
      <p><b>Service:</b> ${escapeHtml(q.service || "-")}</p>
      <p><b>Téléphone:</b> ${phoneLink(q.phone)}</p>
      <p><b>Email:</b> ${escapeHtml(q.email || "-")}</p>
      <p><b>Adresse:</b> ${mapLink(q.address)}</p>
      <p><b>Date:</b> ${escapeHtml(q.date || "-")}</p>
      <p><b>Message:</b> ${escapeHtml(q.message || "-")}</p>
      <div class="assignRow">
        <select data-employee-select="${q.id}">
          <option value="">Choisir employé</option>
          ${options}
        </select>
        <button data-assign="${q.id}" class="smallBtn">Assigner</button>
      </div>
    </article>
  `;
}

async function loadTasks() {
  const list = $("tasksList");
  if (!list) return;

  list.innerHTML = "<p>Chargement des travaux...</p>";

  let snap;
  try {
    snap = await getDocs(query(collection(db, TASKS_COLLECTION), orderBy("createdAt", "desc")));
  } catch (error) {
    snap = await getDocs(collection(db, TASKS_COLLECTION));
  }

  const docs = [];
  snap.forEach((d) => {
    const data = d.data();
    if (data.status !== "terminé") {
      docs.push({ id: d.id, ...data });
    }
  });

  const countTasks = $("countTasks");
  if (countTasks) countTasks.textContent = docs.length;

  if (!docs.length) {
    list.innerHTML = "<p>Aucun travail actif.</p>";
    return;
  }

  list.innerHTML = docs.map(taskCard).join("");

  list.querySelectorAll("[data-status]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const updateData = {
        status: btn.dataset.status,
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
  return `
    <article class="adminCard">
      <div class="cardTop">
        <h3>${escapeHtml(t.clientName || "Client")}</h3>
        <span class="status">${escapeHtml(t.status || "-")}</span>
      </div>
      <p><b>Employé:</b> ${escapeHtml(t.employeeName || "-")}</p>
      <p><b>Service:</b> ${escapeHtml(t.service || "-")}</p>
      <p><b>Adresse:</b> ${mapLink(t.address)}</p>
      <p><b>Téléphone:</b> ${phoneLink(t.phone)}</p>
      <div class="assignRow">
        <button class="smallBtn" data-task="${t.id}" data-status="assigné">Assigné</button>
        <button class="smallBtn" data-task="${t.id}" data-status="en cours">En cours</button>
        <button class="smallBtn ok" data-task="${t.id}" data-status="terminé">Terminé</button>
      </div>
    </article>
  `;
}

function setupAdminRealtimeNotifications() {
  try {
    const q = query(collection(db, QUOTES_COLLECTION), orderBy("createdAt", "desc"));

    onSnapshot(q, (snap) => {
      if (firstAdminSnapshot) {
        firstAdminSnapshot = false;
        return;
      }

      snap.docChanges().forEach((change) => {
        if (change.type === "added") {
          const q = change.doc.data();
          safeNotify(
            "Nouvelle soumission Didier.Elo",
            `${q.name || "Client"} - ${q.service || "Service"}`
          );
          loadQuotes();
        }
      });
    });
  } catch (error) {
    console.error("Realtime admin notification error:", error);
  }
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
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}


async function safeNotify(title, body) {
  try {
    const mod = await import("./notifications.js");
    mod.safeNotify(title, body);
  } catch (error) {
    console.warn("Notification skipped:", error);
  }
}
