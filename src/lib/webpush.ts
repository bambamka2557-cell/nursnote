import webpush from 'web-push';

// Server-only. Never import this from a 'use client' file — the `web-push`
// package uses Node crypto/http and the private VAPID key must never reach
// the browser bundle.

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT;

if (publicKey && privateKey && subject) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export type PushSubscriptionData = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export type PushPayload = {
  title: string;
  body: string;
  tag?: string;
};

// Result discriminates "gone" (404/410 — the browser unsubscribed or the
// subscription expired; caller should delete it) from other failures (worth
// logging but not deleting, e.g. a transient push-service outage).
export type SendPushResult = { ok: true } | { ok: false; gone: boolean; error: string };

export async function sendPush(sub: PushSubscriptionData, payload: PushPayload): Promise<SendPushResult> {
  if (!publicKey || !privateKey || !subject) {
    return { ok: false, gone: false, error: 'VAPID keys not configured (check .env)' };
  }
  try {
    await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, JSON.stringify(payload));
    return { ok: true };
  } catch (err: any) {
    const status = err?.statusCode;
    return { ok: false, gone: status === 404 || status === 410, error: err?.message ?? String(err) };
  }
}
