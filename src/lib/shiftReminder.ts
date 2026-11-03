import { formatInTimeZone } from 'date-fns-tz';
import { prisma } from '@/lib/prisma';
import { sendPush } from '@/lib/webpush';
import { addDaysToDateStr, buildShiftReminderPayload } from '@/app/utils/shiftReminderText';

// Server-only. Evening "what's my shift tomorrow" push.
//
// Deliberately separate from the medication reminder path
// (api/check-reminders): it never reads or writes Patient/Order, and it is hit
// by its own cron step, so a bug or DB error here can't stop a drug reminder.
// Reads ShiftSchedule only — never writes it.

const TZ = 'Asia/Bangkok';

export type ShiftReminderSettingData = {
  enabled: boolean;
  hour: number;
  minute: number;
};

export const DEFAULT_SHIFT_REMINDER: ShiftReminderSettingData = { enabled: true, hour: 18, minute: 0 };

export async function readShiftReminderSetting(): Promise<ShiftReminderSettingData & { lastSentDate: string | null }> {
  const row = await prisma.shiftReminderSetting.upsert({
    where: { id: 'default' },
    update: {},
    create: { id: 'default' },
  });
  return { enabled: row.enabled, hour: row.hour, minute: row.minute, lastSentDate: row.lastSentDate };
}

export type ShiftReminderResult = {
  status:
    | 'sent'
    | 'disabled'
    | 'too-early'
    | 'already-sent'
    | 'no-shift-entered'
    | 'no-subscriptions'
    | 'not-ready';
  tomorrow?: string;
  title?: string;
  pushesSent?: number;
  pushesFailed?: number;
  subscriptionCount?: number;
  error?: string;
};

// test = "send it now" from the settings card: skips the time window and the
// once-a-day marker, and doesn't consume today's evening reminder.
export async function runShiftReminder(now = new Date(), opts: { test?: boolean } = {}): Promise<ShiftReminderResult> {
  let setting;
  try {
    setting = await readShiftReminderSetting();
  } catch (e) {
    // Table not created yet (code deployed before `prisma db push`) — stay
    // quiet instead of failing the cron step.
    return { status: 'not-ready', error: e instanceof Error ? e.message : String(e) };
  }

  const today = formatInTimeZone(now, TZ, 'yyyy-MM-dd');
  const nowMinutes = Number(formatInTimeZone(now, TZ, 'H')) * 60 + Number(formatInTimeZone(now, TZ, 'm'));
  const tomorrow = addDaysToDateStr(today, 1);

  if (!opts.test) {
    if (!setting.enabled) return { status: 'disabled' };
    if (nowMinutes < setting.hour * 60 + setting.minute) return { status: 'too-early', tomorrow };
    if (setting.lastSentDate === today) return { status: 'already-sent', tomorrow };
  }

  const day = await prisma.shiftSchedule.findUnique({ where: { date: tomorrow } });
  // Nothing entered for tomorrow → say nothing. Not marked as sent, so if the
  // nurse fills tomorrow in later this evening, the next tick still reminds.
  // A malformed row is treated the same — never guess "day off" from bad data.
  if (!day || !Array.isArray(day.shifts)) return { status: 'no-shift-entered', tomorrow };

  const subscriptions = await prisma.pushSubscription.findMany();
  if (subscriptions.length === 0) return { status: 'no-subscriptions', tomorrow, subscriptionCount: 0 };

  if (!opts.test) {
    // Atomic claim: two overlapping cron ticks can't both send.
    const claim = await prisma.shiftReminderSetting.updateMany({
      where: { id: 'default', OR: [{ lastSentDate: null }, { lastSentDate: { not: today } }] },
      data: { lastSentDate: today },
    });
    if (claim.count === 0) return { status: 'already-sent', tomorrow };
  }

  const payload = buildShiftReminderPayload(tomorrow, day.shifts, day.note, day.sticker, day.jobs);

  let pushesSent = 0;
  let pushesFailed = 0;
  const dead: string[] = [];
  for (const sub of subscriptions) {
    const r = await sendPush({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload);
    if (r.ok) pushesSent++;
    else {
      pushesFailed++;
      if (r.gone) dead.push(sub.endpoint);
    }
  }
  if (dead.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: dead } } });
  }

  return {
    status: 'sent',
    tomorrow,
    title: payload.title,
    pushesSent,
    pushesFailed,
    subscriptionCount: subscriptions.length,
  };
}
