importScripts("https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCz1BC9YSHQsBB1kBRWy8TdLqs2D7ytOiA",
  authDomain: "dedie-menage.firebaseapp.com",
  projectId: "dedie-menage",
  storageBucket: "dedie-menage.firebasestorage.app",
  messagingSenderId: "745599536988",
  appId: "1:745599536988:web:c217af2d377cf70ffffb99"
});

const CACHE_NAME = "didierelo-pwa-v3";
const APP_SHELL = [
  "./",
  "./index.html",
  "./login.html",
  "./admin.html",
  "./employe.html",
  "./historique.html",
  "./style.css",
  "./admin.css",
  "./logo.jpeg",
  "./manifest.json"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL).catch(() => null))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  event.respondWith(
    fetch(req).catch(() => caches.match(req).then((res) => res || caches.match("./login.html")))
  );
});

try {
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title || "Didier.Elo";
    const options = {
      body: payload.notification?.body || "Nouvelle notification",
      icon: "./logo.jpeg",
      badge: "./logo.jpeg",
      data: payload.data || {}
    };
    self.registration.showNotification(title, options);
  });
} catch (e) {
  console.log("FCM background not available", e);
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow("./login.html")
  );
});
