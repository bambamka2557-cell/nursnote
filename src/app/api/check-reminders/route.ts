import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPush } from '@/lib/webpush';
import { computeDueOrders } from '@/lib/reminders';
import { purgeExpiredPatients } from '@/app/actions/patient';
import { formatInTimeZone } from 'date-fns-tz';

// Server-only route — see src/app/page.tsx for why this can't just be
// date-fns' format() (Vercel's server isn't in Asia/Bangkok, and TZ is a
// reserved env var name Vercel won't let us override). Matters here because
// this formats the time shown inside the push notification text itself.
const format = (date: Date | number, fmt: string) => formatInTimeZone(date, 'Asia/Bangkok', fmt);

// Host-agnostic reminder tick. Whatever scheduler ends up in front of this
// (Vercel Cron, an external cron-ping service, a `node-cron` loop on a VPS —
// not yet decided) just needs to hit this route on an interval with the
// shared secret. This route does the actual work: find due orders, push to
// every subscribed device, dedupe so the same due-instance isn't repushed.
//
// Auth: Authorization: Bearer <CRON_SECRET>. This is a public URL once
// deployed — without this check anyone who finds it could trigger pushes to
// every subscribed device.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Moved here from getPatients() so every page load doesn't pay for a
  // DELETE query — this tick (every 5 min) is a good enough cadence for it.
  await purgeExpiredPatients();

  const patients = await prisma.patient.findMany({
    include: {
      orders: {
        include: {
          eventLogs: { orderBy: { doneAt: 'desc' }, take: 1 },
        },
      },
    },
  });

  const due = computeDueOrders(patients);
  // Re-push every tick (every 5 min, see the workflow's cron schedule) for as
  // long as an order stays overdue and ungiven — a single brief push is easy
  // to miss (iOS web push has no custom sound/vibration, just a short default
  // ping), so this is the actual safety net, not the one-shot notify it used
  // to be. lastNotifiedKey is still recorded below but no longer gates
  // sending; sw.js's `renotify: true` is what makes each repeat actually
  // re-alert instead of silently replacing the prior notification.
  const toNotify = due;

  let subscriptions = await prisma.pushSubscription.findMany();
  let pushesSent = 0;
  let pushesFailed = 0;
  const deadEndpoints = new Set<string>();

  for (const order of toNotify) {
    const payload = {
      title: `🛏️ เตียง ${order.bedNumber} (${order.nickname})`,
      body: `🔔 ถึงเวลา: ${order.name} (กำหนด ${format(order.dueTime, 'HH:mm')} น.)`,
      tag: order.key,
    };

    for (const sub of subscriptions) {
      if (deadEndpoints.has(sub.endpoint)) continue;
      const result = await sendPush(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      );
      if (result.ok) {
        pushesSent++;
      } else {
        pushesFailed++;
        if (result.gone) deadEndpoints.add(sub.endpoint);
      }
    }

    // Mark notified regardless of per-subscription send outcome — this is a
    // dedup marker against re-alerting the same due-instance, not a delivery
    // guarantee. Retrying indefinitely on a dead subscription would just spam
    // the log every tick until someone prunes it.
    await prisma.order.update({
      where: { id: order.orderId },
      data: { lastNotifiedKey: order.key },
    });
  }

  if (deadEndpoints.size > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint: { in: [...deadEndpoints] } },
    });
  }

  return NextResponse.json({
    dueCount: due.length,
    notifiedCount: toNotify.length,
    subscriptionCount: subscriptions.length,
    pushesSent,
    pushesFailed,
    prunedSubscriptions: deadEndpoints.size,
  });
}
