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
  jobs?: SideJob[];
}

// จ็อบนอก (โรงงาน / รพ.อื่น) — separate from hospital shifts on purpose:
// never fed into calculateSalarySummary / calculateDayShiftAllowance /
// calculateWorkLifeBalance. Its income is shown as its own total only.
export type SideJobType = 'FACTORY' | 'HOSPITAL' | 'OTHER';

export interface SideJob {
  type: SideJobType;
  place: string;
  start: string; // "HH:mm" (may be empty)
  end: string; // "HH:mm" (may be empty; earlier than start = ends next day)
  income: number; // บาท, 0 = not entered
}

export const SIDE_JOB_TYPES: Array<{ key: SideJobType; label: string; emoji: string }> = [
  { key: 'FACTORY', label: 'โรงงาน', emoji: '🏭' },
  { key: 'HOSPITAL', label: 'รพ.', emoji: '🏥' },
  { key: 'OTHER', label: 'อื่นๆ', emoji: '💼' },
];

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

// Shared by the save action (server) and readers — drops anything malformed
// instead of trusting stored/posted JSON.
export function sanitizeSideJobs(raw: unknown): SideJob[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((j) => {
      const o = (j ?? {}) as Record<string, unknown>;
      const type = SIDE_JOB_TYPES.some((t) => t.key === o.type) ? (o.type as SideJobType) : 'OTHER';
      const place = typeof o.place === 'string' ? o.place.trim().slice(0, 80) : '';
      const start = typeof o.start === 'string' && HHMM.test(o.start) ? o.start : '';
      const end = typeof o.end === 'string' && HHMM.test(o.end) ? o.end : '';
      const n = Number(String(o.income ?? '').replace(/,/g, ''));
      const income = Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0;
      return { type, place, start, end, income };
    })
    .slice(0, 5);
}

export function sideJobLabel(job: SideJob): string {
  // The place name usually already says what it is ("โรงงานพี่อ๊พ"), and the
  // type is shown by its emoji, so prefer the name alone.
  const t = SIDE_JOB_TYPES.find((x) => x.key === job.type) ?? SIDE_JOB_TYPES[2];
  return job.place || t.label;
}

export function sideJobTimeText(job: SideJob): string {
  if (job.start && job.end) return `${job.start}–${job.end}`;
  return job.start || job.end || '';
}

// Totals for the side-job card, over a YYYY-MM-DD range (inclusive).
export function summarizeSideJobs(
  days: DayShiftData[],
  startDate: string,
  endDate: string
): { dayCount: number; jobCount: number; income: number } {
  let dayCount = 0;
  let jobCount = 0;
  let income = 0;
  for (const d of days || []) {
    if (d.date < startDate || d.date > endDate) continue;
    const jobs = d.jobs || [];
    if (jobs.length === 0) continue;
    dayCount++;
    jobCount += jobs.length;
    for (const j of jobs) income += j.income || 0;
  }
  return { dayCount, jobCount, income: Math.round(income * 100) / 100 };
}

export type ShiftPatternId = 'M' | 'A' | 'N' | 'M_A' | 'A_N' | 'N_A' | 'OFF';

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
    defaultBg: 'bg-[#fdf2f8] text-pink-600 border-[#fbcfe8]',
  },
  AFTERNOON: {
    code: 'AFTERNOON',
    shortLabel: 'บ',
    fullLabel: 'เวรบ่าย',
    timeRange: '16:00 - 00:00',
    defaultBg: 'bg-[#f5f3ff] text-[#7c3aed] border-[#ddd6fe]',
  },
  NIGHT: {
    code: 'NIGHT',
    shortLabel: 'ด',
    fullLabel: 'เวรดึก',
    timeRange: '00:00 - 08:00',
    defaultBg: 'bg-indigo-50 text-indigo-500 border-indigo-200',
  },
};

export const SHIFT_PATTERNS: ShiftPatternDef[] = [
  {
    id: 'M',
    code: 'M',
    shortLabel: 'ช',
    fullLabel: 'เช้า (ช)',
    subShifts: ['MORNING'],
    badgeBg: 'bg-[#fdf2f8]',
    badgeBorder: 'border-[#fbcfe8]',
    badgeTextColor: 'text-text-primary',
    dotColor: 'bg-pink-500',
  },
  {
    id: 'A',
    code: 'A',
    shortLabel: 'บ',
    fullLabel: 'บ่าย (บ)',
    subShifts: ['AFTERNOON'],
    badgeBg: 'bg-[#f5f3ff]',
    badgeBorder: 'border-[#ddd6fe]',
    badgeTextColor: 'text-text-primary',
    dotColor: 'bg-[#8b5cf6]',
  },
  {
    id: 'N',
    code: 'N',
    shortLabel: 'ด',
    fullLabel: 'ดึก (ด)',
    subShifts: ['NIGHT'],
    badgeBg: 'bg-indigo-50',
    badgeBorder: 'border-indigo-200',
    badgeTextColor: 'text-text-primary',
    dotColor: 'bg-indigo-500',
  },
  {
    id: 'M_A',
    code: 'M/A',
    shortLabel: 'ช/บ',
    fullLabel: 'เช้า/บ่าย (ช/บ)',
    subShifts: ['MORNING', 'AFTERNOON'],
    badgeBg: 'bg-[#fffbeb]',
    badgeBorder: 'border-[#fde68a]',
    badgeTextColor: 'text-text-primary',
    dotColor: 'bg-[#f59e0b]',
  },
  {
    id: 'A_N',
    code: 'A/N',
    shortLabel: 'บ/ด',
    fullLabel: 'บ่าย/ดึก (บ/ด)',
    subShifts: ['AFTERNOON', 'NIGHT'],
    badgeBg: 'bg-[#f0fdfa]',
    badgeBorder: 'border-[#99f6e4]',
    badgeTextColor: 'text-text-primary',
    dotColor: 'bg-[#14b8a6]',
  },
  {
    id: 'N_A',
    code: 'N/A',
    shortLabel: 'ด/บ',
    fullLabel: 'ดึก/บ่าย (ด/บ)',
    subShifts: ['NIGHT', 'AFTERNOON'],
    badgeBg: 'bg-[#ecfdf5]',
    badgeBorder: 'border-[#a7f3d0]',
    badgeTextColor: 'text-text-primary',
    dotColor: 'bg-[#10b981]',
  },
  {
    id: 'OFF',
    code: 'OFF',
    shortLabel: 'OFF',
    fullLabel: 'วันหยุด (OFF)',
    subShifts: [],
    badgeBg: 'bg-surface-container-low/85',
    badgeBorder: 'border-card-border',
    badgeTextColor: 'text-text-muted',
    dotColor: 'bg-[#c7c2b8]',
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
    if (codes[0] === 'NIGHT' && codes[1] === 'AFTERNOON') return 'N_A';
    if (codes[0] === 'AFTERNOON' && codes[1] === 'NIGHT') return 'A_N';
    if (codes.includes('AFTERNOON') && codes.includes('NIGHT')) return 'A_N';
  }
  return 'OFF';
}

/**
 * Get display information for a day's shifts
 */
export function getDayShiftDisplay(shifts: SubShift[]) {
  const patternId = matchShiftPattern(shifts);
  const pattern =
    SHIFT_PATTERNS.find((p) => p.id === patternId) ||
    SHIFT_PATTERNS.find((p) => p.id === 'OFF') ||
    SHIFT_PATTERNS[0];

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
  cycleStartDay = Math.floor(cycleStartDay) || 26;
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

export type WorkLifeBalanceStatus = 'HEALTHY' | 'MODERATE' | 'HEAVY';

export interface ShiftDistribution {
  morning: { count: number; hours: number; percentage: number };
  afternoon: { count: number; hours: number; percentage: number };
  night: { count: number; hours: number; percentage: number };
}

export interface WorkLifeBalanceResult {
  startDate: string;
  endDate: string;
  windowText: string;
  totalCycleDays: number;
  totalWorkedDays: number;
  offDaysCount: number;
  normalHours: number;
  otHours: number;
  totalHours: number;
  totalSubShifts: number;
  doubleShiftDays: number;
  maxConsecutiveDays: number;
  maxConsecutiveNights: number;
  standardBenchmarkHours: number;
  hoursPercentageOfBenchmark: number;
  distribution: ShiftDistribution;
  status: WorkLifeBalanceStatus;
  statusLabel: string;
  statusDesc: string;
  statusColor: {
    bg: string;
    text: string;
    border: string;
    badge: string;
    indicator: string;
  };
  wellnessTip: {
    title: string;
    message: string;
    icon: string;
  };
}

/**
 * Calculate nurse Work-Life Balance and Working Hours statistics
 */
export function calculateWorkLifeBalance(
  shifts: DayShiftData[],
  year: number,
  month: number,
  cycleStartDay = 26,
  mode: 'cycle' | 'month' = 'cycle'
): WorkLifeBalanceResult {
  let startDate = '';
  let endDate = '';
  let windowText = '';

  if (mode === 'month' || cycleStartDay <= 1) {
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const mStr = String(month).padStart(2, '0');
    startDate = `${year}-${mStr}-01`;
    endDate = `${year}-${mStr}-${String(daysInMonth).padStart(2, '0')}`;
    const mShort = THAI_MONTH_NAMES_SHORT[month - 1];
    const thaiYear = year + 543;
    windowText = `1 – ${daysInMonth} ${mShort} ${thaiYear}`;
  } else {
    const range = getCycleRangeForMonth(year, month, cycleStartDay);
    startDate = range.startDate;
    endDate = range.endDate;
    windowText = formatCycleWindowText(year, month, cycleStartDay);
  }

  // Filter shifts within range
  const filtered = (shifts || []).filter((s) => s.date >= startDate && s.date <= endDate);
  const shiftMap = new Map<string, DayShiftData>();
  filtered.forEach((s) => shiftMap.set(s.date, s));

  // Generate all dates in range
  const allDates: string[] = [];
  const curr = new Date(`${startDate}T00:00:00Z`);
  const stop = new Date(`${endDate}T00:00:00Z`);

  while (curr <= stop) {
    allDates.push(curr.toISOString().split('T')[0]);
    curr.setUTCDate(curr.getUTCDate() + 1);
  }

  let normalCount = 0;
  let otCount = 0;
  let morningCount = 0;
  let afternoonCount = 0;
  let nightCount = 0;
  let doubleShiftDays = 0;
  let totalWorkedDays = 0;

  let currentStreak = 0;
  let maxConsecutiveDays = 0;

  let currentNightStreak = 0;
  let maxConsecutiveNights = 0;

  for (const dateStr of allDates) {
    const day = shiftMap.get(dateStr);
    const dayShifts = day?.shifts || [];

    if (dayShifts.length > 0) {
      totalWorkedDays++;
      currentStreak++;
      if (currentStreak > maxConsecutiveDays) {
        maxConsecutiveDays = currentStreak;
      }

      let hasNight = false;
      if (dayShifts.length >= 2) {
        doubleShiftDays++;
      }

      for (const s of dayShifts) {
        if (s.ot) otCount++;
        else normalCount++;

        if (s.code === 'MORNING') morningCount++;
        else if (s.code === 'AFTERNOON') afternoonCount++;
        else if (s.code === 'NIGHT') {
          nightCount++;
          hasNight = true;
        }
      }

      if (hasNight) {
        currentNightStreak++;
        if (currentNightStreak > maxConsecutiveNights) {
          maxConsecutiveNights = currentNightStreak;
        }
      } else {
        currentNightStreak = 0;
      }
    } else {
      currentStreak = 0;
      currentNightStreak = 0;
    }
  }

  const totalCycleDays = allDates.length;
  const offDaysCount = Math.max(0, totalCycleDays - totalWorkedDays);
  const normalHours = normalCount * 8;
  const otHours = otCount * 8;
  const totalHours = normalHours + otHours;
  const totalSubShifts = normalCount + otCount;

  const standardBenchmarkHours = 160;
  const hoursPercentageOfBenchmark = Math.round((totalHours / standardBenchmarkHours) * 100);

  const distribution: ShiftDistribution = {
    morning: {
      count: morningCount,
      hours: morningCount * 8,
      percentage: totalSubShifts > 0 ? Math.round((morningCount / totalSubShifts) * 100) : 0,
    },
    afternoon: {
      count: afternoonCount,
      hours: afternoonCount * 8,
      percentage: totalSubShifts > 0 ? Math.round((afternoonCount / totalSubShifts) * 100) : 0,
    },
    night: {
      count: nightCount,
      hours: nightCount * 8,
      percentage: totalSubShifts > 0 ? Math.round((nightCount / totalSubShifts) * 100) : 0,
    },
  };

  let status: WorkLifeBalanceStatus = 'HEALTHY';
  let statusLabel = 'สมดุลยอดเยี่ยม';
  let statusDesc = 'ชั่วโมงทำงานและวันพักผ่อนอยู่ในเกณฑ์สุขภาพดีเยี่ยม';
  let statusColor = {
    bg: 'bg-emerald-50/80',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-800',
    indicator: 'bg-emerald-500',
  };

  if (totalHours > 200 || doubleShiftDays >= 5 || offDaysCount < 5 || maxConsecutiveDays >= 7) {
    status = 'HEAVY';
    statusLabel = 'งานหนักเสี่ยงล้าสะสม';
    statusDesc = 'มีชั่วโมงทำงานหรือเวรควบค่อนข้างสูง ควรหาเวลาพักผ่อนฟื้นฟูร่างกาย';
    statusColor = {
      bg: 'bg-rose-50/80',
      text: 'text-rose-700',
      border: 'border-rose-200',
      badge: 'bg-rose-100 text-rose-800',
      indicator: 'bg-rose-500',
    };
  } else if (totalHours > 168 || doubleShiftDays >= 3 || offDaysCount < 8 || maxConsecutiveDays >= 5) {
    status = 'MODERATE';
    statusLabel = 'งานค่อนข้างแน่น';
    statusDesc = 'ภาระงานปานกลาง-แน่น มีวันพักผ่อนกำลังดี ควรดื่มน้ำและนอนหลับให้เพียงพอ';
    statusColor = {
      bg: 'bg-amber-50/80',
      text: 'text-amber-800',
      border: 'border-amber-200',
      badge: 'bg-amber-100 text-amber-900',
      indicator: 'bg-amber-500',
    };
  }

  let wellnessTip = {
    title: 'เคล็ดลับความสดชื่นประจำวัน',
    message: 'ดื่มน้ำให้ได้วันละ 2 ลิตร ทานอาหารที่มีโปรตีนและผักผลไม้สด ช่วยให้ร่างกายตื่นตัวและพร้อมดูแลคนไข้เสมอ',
    icon: '💖',
  };

  if (nightCount >= 5 || maxConsecutiveNights >= 2) {
    wellnessTip = {
      title: 'ฟื้นฟูจังหวะร่างกายหลังกะดึก',
      message: 'เดือนนี้มีเวรดึกสะสม แนะนำปรับห้องนอนให้มืดสนิท เลี่ยงคาเฟอีนก่อนนอน 6 ชม. และงีบหลับสั้น 20-30 นาทีเพื่อคืนความสดชื่น',
      icon: '🌙',
    };
  } else if (doubleShiftDays >= 3) {
    wellnessTip = {
      title: 'ดูแลกล้ามเนื้อจากเวรควบ 16 ชม.',
      message: 'มีเวรควบหลายวัน อย่าลืมยืดเหยียดขาและหลัง ดื่มน้ำบ่อยๆ และสวมถุงน่องซัพพอร์ตเพื่อลดอาการเมื่อยล้าเส้นเลือดขอด',
      icon: '🧘‍♀️',
    };
  } else if (offDaysCount >= 8) {
    wellnessTip = {
      title: 'ใช้วันหยุดเติมพลังชีวิต',
      message: 'เดือนนี้มีวันพักผ่อนสมดุลดีมาก เหมาะสำหรับการไปเที่ยว พักผ่อนกับคนที่รัก หรือทำกิจกรรมที่ชอบเพื่อรีชาร์จพลังใจ',
      icon: '🌸',
    };
  }

  return {
    startDate,
    endDate,
    windowText,
    totalCycleDays,
    totalWorkedDays,
    offDaysCount,
    normalHours,
    otHours,
    totalHours,
    totalSubShifts,
    doubleShiftDays,
    maxConsecutiveDays,
    maxConsecutiveNights,
    standardBenchmarkHours,
    hoursPercentageOfBenchmark,
    distribution,
    status,
    statusLabel,
    statusDesc,
    statusColor,
    wellnessTip,
  };
}
