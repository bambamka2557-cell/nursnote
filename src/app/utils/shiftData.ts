import { formatInTimeZone } from 'date-fns-tz';

export type AtomicShiftCode = 'MORNING' | 'AFTERNOON' | 'NIGHT';

export interface SubShift {
  code: AtomicShiftCode;
  ot: boolean; // true = แดง (OT), false = ดำ (ปกติ)
}

export interface DayShiftData {
  id?: string;
  date: string; // YYYY-MM-DD
  shifts: SubShift[];
  note?: string | null;
  sticker?: string | null;
}

export type ShiftPatternId = 'M' | 'A' | 'N' | 'M_A' | 'A_N' | 'OFF';

export interface ShiftPatternDef {
  id: ShiftPatternId;
  code: string; // e.g. "M", "M/A", "OFF"
  shortLabel: string; // e.g. "ช", "ช/บ", "OFF"
  fullLabel: string; // e.g. "เช้า (ช)", "เช้า/บ่าย (ช/บ)"
  subShifts: AtomicShiftCode[];
  badgeBg: string;
  badgeBorder: string;
  badgeTextColor: string;
  dotColor: string;
}

export const ATOMIC_SHIFTS: Record<AtomicShiftCode, {
  code: AtomicShiftCode;
  shortLabel: string; // "ช", "บ", "ด"
  fullLabel: string; // "เวรเช้า", "เวรบ่าย", "เวรดึก"
  timeRange: string;
  defaultBg: string;
}> = {
  MORNING: {
    code: 'MORNING',
    shortLabel: 'ช',
    fullLabel: 'เวรเช้า',
    timeRange: '08:00 - 16:00',
    defaultBg: 'bg-pink-100 text-pink-700 border-pink-200',
  },
  AFTERNOON: {
    code: 'AFTERNOON',
    shortLabel: 'บ',
    fullLabel: 'เวรบ่าย',
    timeRange: '16:00 - 24:00',
    defaultBg: 'bg-purple-100 text-purple-700 border-purple-200',
  },
  NIGHT: {
    code: 'NIGHT',
    shortLabel: 'ด',
    fullLabel: 'เวรดึก',
    timeRange: '00:00 - 08:00',
    defaultBg: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  },
};

export const SHIFT_PATTERNS: ShiftPatternDef[] = [
  {
    id: 'M',
    code: 'M',
    shortLabel: 'ช',
    fullLabel: 'เช้า (ช)',
    subShifts: ['MORNING'],
    badgeBg: 'bg-pink-100/95',
    badgeBorder: 'border-pink-300',
    badgeTextColor: 'text-pink-800',
    dotColor: 'bg-pink-400',
  },
  {
    id: 'A',
    code: 'A',
    shortLabel: 'บ',
    fullLabel: 'บ่าย (บ)',
    subShifts: ['AFTERNOON'],
    badgeBg: 'bg-purple-100/95',
    badgeBorder: 'border-purple-300',
    badgeTextColor: 'text-purple-800',
    dotColor: 'bg-purple-400',
  },
  {
    id: 'N',
    code: 'N',
    shortLabel: 'ด',
    fullLabel: 'ดึก (ด)',
    subShifts: ['NIGHT'],
    badgeBg: 'bg-indigo-100/95',
    badgeBorder: 'border-indigo-300',
    badgeTextColor: 'text-indigo-800',
    dotColor: 'bg-indigo-400',
  },
  {
    id: 'M_A',
    code: 'M/A',
    shortLabel: 'ช/บ',
    fullLabel: 'เช้า/บ่าย (ช/บ)',
    subShifts: ['MORNING', 'AFTERNOON'],
    badgeBg: 'bg-amber-100/95',
    badgeBorder: 'border-amber-300',
    badgeTextColor: 'text-amber-800',
    dotColor: 'bg-amber-500',
  },
  {
    id: 'A_N',
    code: 'A/N',
    shortLabel: 'บ/ด',
    fullLabel: 'บ่าย/ดึก (บ/ด)',
    subShifts: ['AFTERNOON', 'NIGHT'],
    badgeBg: 'bg-teal-100/95',
    badgeBorder: 'border-teal-300',
    badgeTextColor: 'text-teal-800',
    dotColor: 'bg-teal-500',
  },
  {
    id: 'OFF',
    code: 'OFF',
    shortLabel: 'OFF',
    fullLabel: 'วันหยุด (OFF)',
    subShifts: [],
    badgeBg: 'bg-slate-100/80',
    badgeBorder: 'border-slate-200',
    badgeTextColor: 'text-slate-400',
    dotColor: 'bg-slate-300',
  },
];

export const STICKER_OPTIONS: Array<{ key: string; emoji: string; label: string }> = [
  { key: 'bow', emoji: '🎀', label: 'โบว์' },
  { key: 'cherry', emoji: '🍒', label: 'เชอร์รี่' },
  { key: 'flower', emoji: '🌸', label: 'ดอกไม้' },
  { key: 'kitty', emoji: '🐱', label: 'คิตตี้' },
  { key: 'heart', emoji: '💖', label: 'หัวใจ' },
];

export interface ShiftRateMatrix {
  MORNING: { normal: number; ot: number };
  AFTERNOON: { normal: number; ot: number };
  NIGHT: { normal: number; ot: number };
}

export const DEFAULT_SHIFT_RATES: ShiftRateMatrix = {
  MORNING: { normal: 0, ot: 0 },
  AFTERNOON: { normal: 0, ot: 0 },
  NIGHT: { normal: 0, ot: 0 },
};

export interface NurseSalaryConfigData {
  id: string;
  baseSalary: number;
  ptsAllowance: number;
  noPrivatePractice: number;
  inChargeAllowance: number;
  otherAllowance: number;
  shiftRates: ShiftRateMatrix;
  cycleStartDay: number;
  taxDeduction: number;
  socialSecurity: number;
  providentFund: number;
  coopDeduction: number;
  otherDeduction: number;
}

export const DEFAULT_CONFIG: NurseSalaryConfigData = {
  id: 'default',
  baseSalary: 0,
  ptsAllowance: 0,
  noPrivatePractice: 0,
  inChargeAllowance: 0,
  otherAllowance: 0,
  shiftRates: { ...DEFAULT_SHIFT_RATES },
  cycleStartDay: 26,
  taxDeduction: 0,
  socialSecurity: 0,
  providentFund: 0,
  coopDeduction: 0,
  otherDeduction: 0,
};

export interface ShiftCountBreakdown {
  normalCount: number;
  otCount: number;
  totalCount: number;
  totalAmount: number;
}

export interface SalarySummaryResult {
  year: number;
  month: number;
  startDate: string;
  endDate: string;
  windowText: string;
  config: NurseSalaryConfigData;
  shiftCounts: {
    MORNING: ShiftCountBreakdown;
    AFTERNOON: ShiftCountBreakdown;
    NIGHT: ShiftCountBreakdown;
    totalShifts: number;
    totalWorkedDays: number;
  };
  breakdown: {
    baseSalary: number;
    totalShiftAllowance: number;
    ptsAllowance: number;
    noPrivatePractice: number;
    inChargeAllowance: number;
    otherAllowance: number;
    totalIncome: number;
    taxDeduction: number;
    socialSecurity: number;
    providentFund: number;
    coopDeduction: number;
    otherDeduction: number;
    totalDeductions: number;
    netIncome: number;
  };
}

/**
 * Determine pattern ID matching an array of SubShifts
 */
export function matchShiftPattern(shifts: SubShift[]): ShiftPatternId {
  if (!shifts || shifts.length === 0) return 'OFF';
  const codes = shifts.map(s => s.code);
  if (codes.length === 1) {
    if (codes[0] === 'MORNING') return 'M';
    if (codes[0] === 'AFTERNOON') return 'A';
    if (codes[0] === 'NIGHT') return 'N';
  }
  if (codes.length === 2) {
    if (codes.includes('MORNING') && codes.includes('AFTERNOON')) return 'M_A';
    if (codes.includes('AFTERNOON') && codes.includes('NIGHT')) return 'A_N';
  }
  return 'OFF';
}

/**
 * Get display information for a day's shifts
 */
export function getDayShiftDisplay(shifts: SubShift[]) {
  const patternId = matchShiftPattern(shifts);
  const pattern = SHIFT_PATTERNS.find(p => p.id === patternId) || SHIFT_PATTERNS[5];

  return {
    patternId,
    pattern,
    isOff: patternId === 'OFF',
    subShiftItems: (shifts || []).map(s => ({
      code: s.code,
      label: ATOMIC_SHIFTS[s.code]?.shortLabel ?? s.code,
      isOt: Boolean(s.ot),
      colorClass: s.ot ? 'text-rose-600 font-black' : 'text-slate-800 font-bold',
    })),
  };
}

/**
 * Calculate total allowance for a single day based on shift rates
 * Formula: Σ over p in day.shifts: shiftRates[p.code]?.[ p.ot ? 'ot' : 'normal' ] ?? 0
 */
export function calculateDayShiftAllowance(shifts: SubShift[], rates: ShiftRateMatrix): number {
  if (!shifts || shifts.length === 0) return 0;
  return shifts.reduce((sum, item) => {
    const shiftRate = rates?.[item.code];
    if (!shiftRate) return sum;
    const rate = item.ot ? shiftRate.ot : shiftRate.normal;
    return sum + (Number(rate) || 0);
  }, 0);
}

/**
 * Compute the date window [startDate, endDate] for a given cycle
 * E.g. month=8, cycleStartDay=26 -> '2026-07-26' to '2026-08-25'
 */
export function getCycleRangeForMonth(year: number, month: number, cycleStartDay = 26): { startDate: string; endDate: string } {
  if (cycleStartDay <= 1) {
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const mStr = String(month).padStart(2, '0');
    return {
      startDate: `${year}-${mStr}-01`,
      endDate: `${year}-${mStr}-${String(daysInMonth).padStart(2, '0')}`,
    };
  }

  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;
  const startDayStr = String(cycleStartDay).padStart(2, '0');
  const endDay = cycleStartDay - 1;
  const endDayStr = String(endDay).padStart(2, '0');

  return {
    startDate: `${prevYear}-${String(prevMonth).padStart(2, '0')}-${startDayStr}`,
    endDate: `${year}-${String(month).padStart(2, '0')}-${endDayStr}`,
  };
}

/**
 * Get Bangkok's current cycle month & year
 * If Bangkok day >= cycleStartDay, cycle belongs to the next month
 */
export function getCurrentBangkokCycle(cycleStartDay = 26): { year: number; month: number; todayStr: string } {
  const todayStr = formatInTimeZone(new Date(), 'Asia/Bangkok', 'yyyy-MM-dd');
  const [yStr, mStr, dStr] = todayStr.split('-');
  const currentYear = parseInt(yStr, 10);
  const currentMonth = parseInt(mStr, 10);
  const currentDay = parseInt(dStr, 10);

  let year = currentYear;
  let month = currentMonth;

  if (cycleStartDay > 1 && currentDay >= cycleStartDay) {
    month = currentMonth === 12 ? 1 : currentMonth + 1;
    year = currentMonth === 12 ? currentYear + 1 : currentYear;
  }

  return { year, month, todayStr };
}

/**
 * Thai month names
 */
export const THAI_MONTH_NAMES = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

export const THAI_MONTH_NAMES_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

/**
 * Format date window text for the salary cycle
 * e.g. for year 2026, month 8, cycleStartDay 26 -> "26 ก.ค. – 25 ส.ค. 2569"
 */
export function formatCycleWindowText(year: number, month: number, cycleStartDay = 26): string {
  const currentMonthShort = THAI_MONTH_NAMES_SHORT[month - 1];
  const currentThaiYear = year + 543;

  if (cycleStartDay <= 1) {
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    return `1 ${currentMonthShort} – ${daysInMonth} ${currentMonthShort} ${currentThaiYear}`;
  }

  const prevMonthIndex = (month - 2 + 12) % 12;
  const prevYear = month === 1 ? year - 1 : year;
  const prevThaiYear = prevYear + 543;

  const prevMonthShort = THAI_MONTH_NAMES_SHORT[prevMonthIndex];

  const endDay = cycleStartDay - 1;

  if (prevYear === year) {
    return `${cycleStartDay} ${prevMonthShort} – ${endDay} ${currentMonthShort} ${currentThaiYear}`;
  }
  return `${cycleStartDay} ${prevMonthShort} ${prevThaiYear} – ${endDay} ${currentMonthShort} ${currentThaiYear}`;
}

/**
 * Determine which salary cycle month and year a given date belongs to
 * E.g., for date "2026-08-26" and cycleStartDay=26, returns cycle for September 2026
 */
export function getCycleForDate(dateStr: string, cycleStartDay = 26): {
  cycleYear: number;
  cycleMonth: number;
  cycleLabel: string;
  windowText: string;
} {
  const [y, m, d] = dateStr.split('-').map(Number);
  let cycleYear = y;
  let cycleMonth = m;

  if (cycleStartDay > 1 && d >= cycleStartDay) {
    cycleMonth = m === 12 ? 1 : m + 1;
    cycleYear = m === 12 ? y + 1 : y;
  }

  const windowText = formatCycleWindowText(cycleYear, cycleMonth, cycleStartDay);
  const cycleLabel = `${THAI_MONTH_NAMES[cycleMonth - 1]} ${cycleYear + 543}`;

  return {
    cycleYear,
    cycleMonth,
    cycleLabel,
    windowText,
  };
}

