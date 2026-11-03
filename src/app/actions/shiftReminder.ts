'use server';

import { prisma } from '@/lib/prisma';
import {
  DEFAULT_SHIFT_REMINDER,
  readShiftReminderSetting,
  runShiftReminder,
  type ShiftReminderResult,
  type ShiftReminderSettingData,
} from '@/lib/shiftReminder';

export async function getShiftReminderSetting(): Promise<ShiftReminderSettingData & { ready: boolean }> {
  try {
    const s = await readShiftReminderSetting();
    return { enabled: s.enabled, hour: s.hour, minute: s.minute, ready: true };
  } catch {
    return { ...DEFAULT_SHIFT_REMINDER, ready: false };
  }
}

export async function saveShiftReminderSetting(
  data: ShiftReminderSettingData
): Promise<{ success: boolean; error?: string }> {
  const hour = Math.floor(Number(data.hour));
  const minute = Math.floor(Number(data.minute));
  if (!(hour >= 0 && hour <= 23) || !(minute >= 0 && minute <= 59)) {
    return { success: false, error: 'เวลาไม่ถูกต้อง' };
  }
  try {
    await prisma.shiftReminderSetting.upsert({
      where: { id: 'default' },
      update: { enabled: Boolean(data.enabled), hour, minute },
      create: { id: 'default', enabled: Boolean(data.enabled), hour, minute },
    });
    return { success: true };
  } catch (e) {
    console.error('saveShiftReminderSetting failed:', e);
    return { success: false, error: 'บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง' };
  }
}

// "ลองส่งตอนนี้" — sends tomorrow's reminder immediately to every subscribed
// device without using up this evening's scheduled one.
export async function sendShiftReminderTest(): Promise<ShiftReminderResult> {
  return runShiftReminder(new Date(), { test: true });
}
