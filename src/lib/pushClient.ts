'use client';

// Browser-side push subscription helper. Called from ReminderEngine once
// Notification permission is granted.

// Standard VAPID boilerplate: PushManager.subscribe() needs the application
// server key as a Uint8Array, but env vars/APIs hand it to us as a
// URL-safe base64 string.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Subscribes this browser to push (reusing an existing subscription if one
// is already active) and persists it server-side. Returns true on success so
// the caller can decide whether to surface a warning.
export async function subscribeToPush(): Promise<boolean> {
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) {
    console.error('NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set — cannot subscribe to push.');
    return false;
  }
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false; // platform doesn't support Web Push at all (e.g. old browser)
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        // TS 5's DOM lib types Uint8Array as generic over its backing buffer;
        // BufferSource wants an ArrayBuffer-backed view specifically. The
        // array below is always ArrayBuffer-backed at runtime — this is a
        // types-only mismatch.
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      });
    }

    const raw = sub.toJSON();
    if (!raw.endpoint || !raw.keys?.p256dh || !raw.keys?.auth) {
      console.error('Push subscription is missing required fields:', raw);
      return false;
    }

    const { saveSubscription } = await import('@/app/actions/push');
    await saveSubscription({
      endpoint: raw.endpoint,
      keys: { p256dh: raw.keys.p256dh, auth: raw.keys.auth },
    });
    return true;
  } catch (e) {
    console.error('subscribeToPush failed:', e);
    return false;
  }
}
