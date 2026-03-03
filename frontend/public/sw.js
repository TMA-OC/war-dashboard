// War Dashboard Service Worker — Local Push Notifications

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SHOW_NOTIFICATION') {
    const { title, body, confidence } = event.data;
    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'alert-' + Date.now(),
        data: { url: '/dashboard' },
        vibrate: confidence >= 80 ? [200, 100, 200] : [100],
        silent: confidence < 70,
      })
    );
  }
});

self.addEventListener('push', (event) => {
  let payload = { title: 'War Intel Alert', body: 'New alert received.', confidence: 70 };
  try {
    if (event.data) payload = Object.assign({}, payload, event.data.json());
  } catch {}
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'push-' + Date.now(),
      data: { url: '/dashboard' },
      vibrate: payload.confidence >= 80 ? [200, 100, 200] : [100],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  var targetUrl = (event.notification.data && event.notification.data.url) || '/dashboard';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        try {
          var url = new URL(client.url);
          if (url.pathname.startsWith('/dashboard') && 'focus' in client) {
            return client.focus();
          }
        } catch(e) {}
      }
      return clients.openWindow(targetUrl);
    })
  );
});

self.addEventListener('install', function() { self.skipWaiting(); });
self.addEventListener('activate', function(event) { event.waitUntil(clients.claim()); });
