self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "usMoment", body: event.data.text() };
  }

  const {
    title = "usMoment",
    body = "You have a new notification",
    icon = "/pwa-icon-192.png",
    badge = "/pwa-icon-192.png",
    url = "/dashboard",
    tag = "usmoment-notification",
    requireInteraction = false,
    renotify = false,
    vibrate = [200, 100, 200],
  } = payload;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      tag,
      renotify,
      requireInteraction,
      vibrate,
      data: { url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    }),
  );
});
