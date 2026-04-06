// Pascomfy Push Notification Service Worker

self.addEventListener("push", (event) => {
  let data = { title: "Pascomfy", body: "Nova notificação" };
  
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  // Build URL from metadata.event_id if available
  const metadata = data.metadata || {};
  const eventId = metadata.event_id;
  const url = eventId ? `/events/${eventId}` : "/";

  const options = {
    body: data.body || data.message || "Nova notificação",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    data: { ...metadata, url },
    tag: data.type || "default",
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Pascomfy", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Try to find an existing window and navigate it
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          if ("navigate" in client) {
            client.navigate(urlToOpen);
          }
          return client.focus();
        }
      }
      return clients.openWindow(urlToOpen);
    })
  );
});
