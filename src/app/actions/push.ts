'use server';

import { prisma } from '@/lib/prisma';

type SubscriptionInput = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

// Upsert by endpoint: a browser re-subscribing (e.g. after clearing site
// data) gets a new endpoint, so this is really "insert or refresh keys for
// this exact endpoint" rather than a per-user update.
export async function saveSubscription(sub: SubscriptionInput) {
  await prisma.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    create: { endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    update: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
  });
}

export async function deleteSubscriptionByEndpoint(endpoint: string) {
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
}
