// Workbox précharge automatiquement les fichiers de l'app (généré au moment
// du build par vite-plugin-pwa) — c'est ce qui permet d'ouvrir l'app même sans
// connexion internet.
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

if (workbox) {
  workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);
  // Les données elles-mêmes viennent de Supabase — en ligne seulement pour
  // l'instant — mais l'app s'ouvre et affiche ce qui a déjà été chargé, même
  // hors ligne, plutôt que de rester bloquée sur un écran blanc.
  workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    new workbox.strategies.NetworkFirst({ cacheName: 'pages', networkTimeoutSeconds: 3 })
  );
}

self.addEventListener('push', (event) => {
  let data = { title: 'Planifamille', body: 'Nouvelle notification' };
  try { if (event.data) data = event.data.json(); } catch { /* garde les valeurs par défaut */ }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Planifamille', {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
