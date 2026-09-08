'use server';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import {
  SubShift,
  ShiftRateMatrix,
  DEFAULT_SHIFT_RATES,
  calculateDayShiftAllowance,
  formatCycleWindowText,
  getCycleRangeForMonth,
  NurseSalaryConfigData,
  DEFAULT_CONFIG,
  SalarySummaryResult,
} from '@/app/utils/shiftData';

/**
 * Merge raw database rates with defaults to ensure all keys exist
 */
function sanitizeShiftRates(raw: unknown): ShiftRateMatrix {
  const rates = (raw && typeof raw === 'object' ? raw : {}) as Partial<ShiftRateMatrix>;
  return {
    MORNING: {
      normal: Math.max(0, Number(rates.MORNING?.normal) || 0),
      ot: Math.max(0, Number(rates.MORNING?.ot) || 0),
    },
    AFTERNOON: {
      normal: Math.max(0, Number(rates.AFTERNOON?.normal) || 0),
      ot: Math.max(0, Number(rates.AFTERNOON?.ot) || 0),
    },
    NIGHT: {
      normal: Math.max(0, Number(rates.NIGHT?.normal) || 0),
      ot: Math.max(0, Number(rates.NIGHT?.ot) || 0),
    },
  };
}

/**
 * Get salary config (singleton 'default' row), or defaults if row doesn't exist yet
 */
export async function getSalaryConfig(): Promise<NurseSalaryConfigData> {
  try {
    const config = await prisma.nurseSalaryConfig.findUnique({
      where: { id: 'default' },
    });

    if (!config) {
      return DEFAULT_CONFIG;
    }

    return {
      id: config.id,
      baseSalary: config.baseSalary,
      ptsAllowance: config.ptsAllowance,
      noPrivatePractice: config.noPrivatePractice,
      inChargeAllowance: config.inChargeAllowance,
      otherAllowance: config.otherAllowance,
      shiftRates: sanitizeShiftRates(config.shiftRates),
      cycleStartDay: Math.floor(config.cycleStartDay) || 26,
      taxDeduction: config.taxDeduction,
      socialSecurity: config.socialSecurity,
      providentFund: config.providentFund,
      coopDeduction: config.coopDeduction,
      otherDeduction: config.otherDeduction,
    };
  } catch (error) {
    console.error('Failed to get salary config:', error);
    return DEFAULT_CONFIG;
  }
}

/**
 * Save / update salary config via singleton upsert
 */
export async function saveSalaryConfig(data: Partial<NurseSalaryConfigData>): Promise<{ success: boolean; error?: string }> {
  try {
    const shiftRates = data.shiftRates ? sanitizeShiftRates(data.shiftRates) : DEFAULT_SHIFT_RATES;
    const rawCycleDay = Math.floor(Number(data.cycleStartDay));
    const cycleStartDay = (rawCycleDay >= 1 && rawCycleDay <= 28) ? rawCycleDay : 26;

    const payload = {
      baseSalary: Math.max(0, Number(data.baseSalary) || 0),
      ptsAllowance: Math.max(0, Number(data.ptsAllowance) || 0),
      noPrivatePractice: Math.max(0, Number(data.noPrivatePractice) || 0),
      inChargeAllowance: Math.max(0, Number(data.inChargeAllowance) || 0),
      otherAllowance: Math.max(0, Number(data.otherAllowance) || 0),
      shiftRates: shiftRates as unknown as Prisma.InputJsonValue,
      cycleStartDay,
      taxDeduction: Math.max(0, Number(data.taxDeduction) || 0),
      socialSecurity: Math.max(0, Number(data.socialSecurity) || 0),
      providentFund: Math.max(0, Number(data.providentFund) || 0),
      coopDeduction: Math.max(0, Number(data.coopDeduction) || 0),
      otherDeduction: Math.max(0, Number(data.otherDeduction) || 0),
    };

    await prisma.nurseSalaryConfig.upsert({
      where: { id: 'default' },
      update: payload,
      create: {
        id: 'default',
        ...payload,
      },
    });

    revalidatePath('/schedule');
    return { success: true };
  } catch (error) {
    console.error('Failed to save salary config:', error);
    return { success: false, error: 'ไม่สามารถบันทึกการตั้งค่าเงินเดือนได้' };
  }
}

/**
 * Calculate salary and shift allowance summary for a specific month and cycle
 */
export async function calculateSalarySummary(year: number, month: number): Promise<SalarySummaryResult> {
  const config = await getSalaryConfig();
  const { startDate, endDate } = getCycleRangeForMonth(year, month, config.cycleStartDay);
  const windowText = formatCycleWindowText(year, month, config.cycleStartDay);

  // Fetch shifts in this exact date range
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

  const shiftCounts = {
    MORNING: { normalCount: 0, otCount: 0, totalCount: 0, totalAmount: 0 },
    AFTERNOON: { normalCount: 0, otCount: 0, totalCount: 0, totalAmount: 0 },
    NIGHT: { normalCount: 0, otCount: 0, totalCount: 0, totalAmount: 0 },
    totalShifts: 0,
    totalWorkedDays: 0,
  };

  let totalShiftAllowance = 0;

  for (const record of records) {
    const shifts = (Array.isArray(record.shifts) ? record.shifts : []) as unknown as SubShift[];
    if (shifts.length > 0) {
      shiftCounts.totalWorkedDays += 1;
    }

    for (const sub of shifts) {
      if (sub.code === 'MORNING' || sub.code === 'AFTERNOON' || sub.code === 'NIGHT') {
        shiftCounts.totalShifts += 1;
        const target = shiftCounts[sub.code];
        const rate = sub.ot ? config.shiftRates[sub.code].ot : config.shiftRates[sub.code].normal;
        const amount = Number(rate) || 0;

        if (sub.ot) {
          target.otCount += 1;
        } else {
          target.normalCount += 1;
        }
        target.totalCount += 1;
        target.totalAmount += amount;
      }
    }

    const dayAllowance = calculateDayShiftAllowance(shifts, config.shiftRates);
    totalShiftAllowance += dayAllowance;
  }

  const totalIncome =
    config.baseSalary +
    totalShiftAllowance +
    config.ptsAllowance +
    config.noPrivatePractice +
    config.inChargeAllowance +
    config.otherAllowance;

  const totalDeductions =
    config.taxDeduction +
    config.socialSecurity +
    config.providentFund +
    config.coopDeduction +
    config.otherDeduction;

  const netIncome = totalIncome - totalDeductions;

  return {
    year,
    month,
    startDate,
    endDate,
    windowText,
    config,
    shiftCounts,
    breakdown: {
      baseSalary: config.baseSalary,
      totalShiftAllowance,
      ptsAllowance: config.ptsAllowance,
      noPrivatePractice: config.noPrivatePractice,
      inChargeAllowance: config.inChargeAllowance,
      otherAllowance: config.otherAllowance,
      totalIncome,
      taxDeduction: config.taxDeduction,
      socialSecurity: config.socialSecurity,
      providentFund: config.providentFund,
      coopDeduction: config.coopDeduction,
      otherDeduction: config.otherDeduction,
      totalDeductions,
      netIncome,
    },
  };
}
