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

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

try {
  const messaging = firebase.messaging();
  messaging.onBackgroundMessage((payload) => {
    self.registration.showNotification(payload.notification?.title || "Didier.Elo", {
      body: payload.notification?.body || "Nouvelle notification",
      icon: "./logo.jpeg",
      badge: "./logo.jpeg",
      data: payload.data || {}
    });
  });
} catch (error) {}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("./login.html"));
});
