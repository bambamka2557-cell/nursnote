// LR-Helper service worker.
//
// Scope for now: display notifications and handle taps on them. It does NOT
// cache anything (offline support is a separate task, M02) and it does NOT do
// background scheduling — a service worker cannot run a timer that survives the
// app being suspended. Reliable reminders while the phone is locked require a
// Web Push server (VAPID) that sends a push at each due time; this file is the
// on-device half that such a server would deliver notifications through.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Tapping a notification focuses the open app (or opens it). Medication
// reminders carry no url and keep the old behaviour (focus, else /timeline);
// the evening shift reminder carries url '/' and takes the app to the shift
// calendar.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url;
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            if (url && 'navigate' in client) {
              return client.navigate(url).then((c) => (c || client).focus()).catch(() => client.focus());
            }
            return client.focus();
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(url || '/timeline');
      })
  );
});

self.addEventListener('push', (event) => {
  let payload = { title: 'LR-Helper', body: 'ถึงเวลาทำรายการ' };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    /* non-JSON payload — keep defaults */
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      tag: payload.tag,
      icon: payload.icon,
      data: { url: payload.url },
      // Defaults are the medication-reminder behaviour; only the shift
      // reminder overrides them (one calm, non-sticky alert per evening).
      requireInteraction: payload.requireInteraction !== false,
      vibrate: [500, 250, 500, 250, 500],
      // Without this, repeat pushes for the same still-overdue order (same
      // tag) would silently replace the notification with no new alert —
      // renotify makes each 5-min repeat actually re-sound/vibrate.
      renotify: payload.renotify !== false,
    })
  );
});
