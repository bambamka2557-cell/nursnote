'use server';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { SubShift, DayShiftData, SideJob, sanitizeSideJobs } from '@/app/utils/shiftData';

/**
 * Get all shifts within a specific date range [startDate, endDate] inclusive
 * Both startDate and endDate are in 'YYYY-MM-DD' format
 */
export async function getShiftsByDateRange(startDate: string, endDate: string): Promise<DayShiftData[]> {
  try {
    const records = await prisma.shiftSchedule.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    return records.map((record) => ({
      id: record.id,
      date: record.date,
      shifts: (Array.isArray(record.shifts) ? record.shifts : []) as unknown as SubShift[],
      note: record.note,
      sticker: record.sticker,
      jobs: sanitizeSideJobs(record.jobs),
    }));
  } catch (error) {
    console.error('Failed to get shifts by date range:', error);
    return [];
  }
}

/**
 * Save or update shift for a given date
 */
export async function saveShift(data: {
  date: string;
  shifts: SubShift[];
  note?: string | null;
  sticker?: string | null;
  jobs?: SideJob[];
}): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanShifts = (data.shifts || []).map((s) => ({
      code: s.code,
      ot: Boolean(s.ot),
    }));
    // Side jobs are stored as-is for display + their own income total only.
    const cleanJobs = sanitizeSideJobs(data.jobs);
    const jobsValue = cleanJobs.length > 0 ? (cleanJobs as unknown as Prisma.InputJsonValue) : Prisma.DbNull;

    await prisma.shiftSchedule.upsert({
      where: {
        date: data.date,
      },
      update: {
        shifts: cleanShifts as unknown as Prisma.InputJsonValue,
        note: data.note ? data.note.trim() : null,
        sticker: data.sticker || null,
        jobs: jobsValue,
      },
      create: {
        date: data.date,
        shifts: cleanShifts as unknown as Prisma.InputJsonValue,
        note: data.note ? data.note.trim() : null,
        sticker: data.sticker || null,
        jobs: jobsValue,
      },
    });

    revalidatePath('/');
    revalidatePath('/schedule');
    return { success: true };
  } catch (error) {
    console.error('Failed to save shift:', error);
    return { success: false, error: 'ไม่สามารถบันทึกตารางเวรได้' };
  }
}

/**
 * Delete shift entry for a specific date
 */
export async function deleteShift(date: string): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.shiftSchedule.deleteMany({
      where: {
        date,
      },
    });

    revalidatePath('/');
    revalidatePath('/schedule');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete shift:', error);
    return { success: false, error: 'ไม่สามารถลบเวรได้' };
  }
}
