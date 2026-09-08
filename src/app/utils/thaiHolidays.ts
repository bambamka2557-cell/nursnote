/**
 * ฐานข้อมูลวันหยุดราชการไทยและวันสำคัญ (Thailand Public Holidays & Observances)
 * 
 * ข้อมูลวันหยุดอ้างอิงประกาศทางการ:
 * - ประกาศวันหยุดตามประเพณีของสถาบันการเงิน (ธนาคารแห่งประเทศไทย - BOT)
 * - ประกาศสำนักนายกรัฐมนตรี เรื่อง กำหนดเวลาทำงานและวันหยุดราชการ
 * - ปีที่ครอบคลุมวันหยุดจันทรคติ: 2024, 2025, 2026, 2027, 2028 (พ.ศ. 2567 - 2571)
 * - อัปเดตล่าสุด: กันยายน 2026
 * 
 * Guardrail สำคัญ (Audit Rule #1):
 * - ข้อมูลวันหยุดนี้ใช้เพื่อการแสดงผลในปฏิทินและสถิติวันหยุดเท่านั้น
 * - ห้ามนำข้อมูลนี้ไปแก้ไขหรือตัดสินสถานะ shift.ot (OT) ใน salary.ts หรือ shiftData.ts
 * - ค่าเวร OT ของโรงพยาบาลขึ้นกับการจัดตารางเวรของ รพ. (shift.ot) ไม่ผูกกับวันหยุดปฏิทิน
 */

import { DayShiftData, THAI_MONTH_NAMES } from './shiftData';

export interface ThaiHoliday {
  date: string; // YYYY-MM-DD
  name: string; // เช่น "วันสงกรานต์"
  isPublicHoliday: boolean; // true = วันหยุดราชการ/นักขัตฤกษ์ (นับในสถิติ), false = วันสำคัญทั่วไป
  badgeColor?: string;
  icon?: string;
  description?: string;
}

export interface HolidayMonthStats {
  year: number;
  month: number; // เดือนปฏิทิน 1-12
  publicHolidays: ThaiHoliday[];
  totalPublicHolidays: number; // นับเฉพาะ isPublicHoliday === true
  offOnHolidays: number; // วันหยุดที่พยาบาล "ได้หยุดจริง" (ไม่มีเวร)
  workedOnHolidays: number; // วันหยุดที่พยาบาล "ต้องขึ้นเวร" (มีเวรอย่างน้อย 1 เวร)
}

// -------------------------------------------------------------
// 1. วันหยุดราชการคงที่ตามสุริยคติ (Fixed Solar Public Holidays)
// -------------------------------------------------------------
interface FixedHolidayDef {
  monthDay: string; // MM-DD
  name: string;
  icon: string;
  isPublicHoliday: boolean;
  description?: string;
}

const FIXED_HOLIDAYS: FixedHolidayDef[] = [
  { monthDay: '01-01', name: 'วันขึ้นปีใหม่', icon: '✨', isPublicHoliday: true },
  { monthDay: '01-16', name: 'วันครู', icon: '📚', isPublicHoliday: false, description: 'วันสำคัญแห่งชาติ' },
  { monthDay: '02-14', name: 'วันวาเลนไทน์', icon: '💖', isPublicHoliday: false, description: 'วันแห่งความรัก' },
  { monthDay: '03-08', name: 'วันสตรีสากล', icon: '👩', isPublicHoliday: false, description: 'วันสำคัญสากล' },
  { monthDay: '04-06', name: 'วันจักรี', icon: '👑', isPublicHoliday: true, description: 'วันพระบาทสมเด็จพระพุทธยอดฟ้าจุฬาโลกมหาราช และวันที่ระลึกมหาจักรีบรมราชวงศ์' },
  { monthDay: '04-13', name: 'วันสงกรานต์', icon: '💦', isPublicHoliday: true, description: 'วันขึ้นปีใหม่ไทย และวันผู้สูงอายุแห่งชาติ' },
  { monthDay: '04-14', name: 'วันสงกรานต์', icon: '💦', isPublicHoliday: true, description: 'วันครอบครัว' },
  { monthDay: '04-15', name: 'วันสงกรานต์', icon: '💦', isPublicHoliday: true },
  { monthDay: '05-01', name: 'วันแรงงานแห่งชาติ', icon: '⚒️', isPublicHoliday: true },
  { monthDay: '05-04', name: 'วันฉัตรมงคล', icon: '👑', isPublicHoliday: true, description: 'วันรำลึกพระราชพิธีบรมราชาภิเษก' },
  { monthDay: '06-03', name: 'วันเฉลิมพระชนมพรรษาพระราชินี', icon: '💜', isPublicHoliday: true, description: 'วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าสุทิดาฯ พระบรมราชินี' },
  { monthDay: '07-28', name: 'วันเฉลิมพระชนมพรรษา ร.10', icon: '💛', isPublicHoliday: true, description: 'วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว' },
  { monthDay: '08-12', name: 'วันแม่แห่งชาติ', icon: '💙', isPublicHoliday: true, description: 'วันเฉลิมพระชนมพรรษาสมเด็จพระบรมราชชนนีพันปีหลวง' },
  { monthDay: '10-13', name: 'วันนวมินทรมหาราช', icon: '🎗️', isPublicHoliday: true, description: 'วันคล้ายวันสวรรคตพระบาทสมเด็จพระบรมชนกาธิเบศร มหาภูมิพลอดุลยเดชมหาราช บรมนาถบพิตร' },
  { monthDay: '10-21', name: 'วันพยาบาลแห่งชาติ', icon: '🩺', isPublicHoliday: false, description: 'วันคล้ายวันพระราชสมภพสมเด็จพระศรีนครินทราบรมราชชนนี' },
  { monthDay: '10-23', name: 'วันปิยมหาราช', icon: '👑', isPublicHoliday: true, description: 'วันคล้ายวันสวรรคตพระบาทสมเด็จพระจุลจอมเกล้าเจ้าอยู่หัว' },
  { monthDay: '12-05', name: 'วันพ่อแห่งชาติ', icon: '💛', isPublicHoliday: true, description: 'วันคล้ายวันพระบรมราชสมภพ ร.9 และวันชาติ' },
  { monthDay: '12-10', name: 'วันรัฐธรรมนูญ', icon: '📜', isPublicHoliday: true },
  { monthDay: '12-25', name: 'วันคริสต์มาส', icon: '🎄', isPublicHoliday: false },
  { monthDay: '12-31', name: 'วันสิ้นปี', icon: '🎆', isPublicHoliday: true },
];

// -------------------------------------------------------------
// 2. ฐานข้อมูลวันหยุดพิเศษและวันหยุดทางศาสนาพุทธรายปี (Year-specific / Lunar)
// ตรวจสอบกับประกาศทางการ ธปท. และ ครม. (ปี 2024 - 2028)
// -------------------------------------------------------------
const YEAR_SPECIFIC_HOLIDAYS: Record<number, Array<{
  date: string; // YYYY-MM-DD
  name: string;
  icon: string;
  isPublicHoliday: boolean;
  description?: string;
}>> = {
  // --- ปี 2024 (พ.ศ. 2567) ---
  2024: [
    { date: '2024-01-13', name: 'วันเด็กแห่งชาติ', icon: '🎈', isPublicHoliday: false },
    { date: '2024-02-24', name: 'วันมาฆบูชา', icon: '🪷', isPublicHoliday: true },
    { date: '2024-02-26', name: 'ชดเชยวันมาฆบูชา', icon: '🪷', isPublicHoliday: true },
    { date: '2024-04-08', name: 'ชดเชยวันจักรี', icon: '👑', isPublicHoliday: true },
    { date: '2024-04-16', name: 'ชดเชยวันสงกรานต์', icon: '💦', isPublicHoliday: true },
    { date: '2024-05-06', name: 'ชดเชยวันฉัตรมงคล', icon: '👑', isPublicHoliday: true },
    { date: '2024-05-22', name: 'วันวิสาขบูชา', icon: '🪷', isPublicHoliday: true },
    { date: '2024-07-20', name: 'วันอาสาฬหบูชา', icon: '🪷', isPublicHoliday: true },
    { date: '2024-07-21', name: 'วันเข้าพรรษา', icon: '🪷', isPublicHoliday: true },
    { date: '2024-07-22', name: 'ชดเชยวันเข้าพรรษา', icon: '🪷', isPublicHoliday: true },
    { date: '2024-07-29', name: 'ชดเชยวันเฉลิมพระชนมพรรษา ร.10', icon: '💛', isPublicHoliday: true },
    { date: '2024-10-14', name: 'ชดเชยวันนวมินทรมหาราช', icon: '🎗️', isPublicHoliday: true },
    { date: '2024-11-15', name: 'วันลอยกระทง', icon: '🪔', isPublicHoliday: false },
  ],

  // --- ปี 2025 (พ.ศ. 2568) ---
  2025: [
    { date: '2025-01-11', name: 'วันเด็กแห่งชาติ', icon: '🎈', isPublicHoliday: false },
    { date: '2025-02-12', name: 'วันมาฆบูชา', icon: '🪷', isPublicHoliday: true },
    { date: '2025-04-07', name: 'ชดเชยวันจักรี', icon: '👑', isPublicHoliday: true },
    { date: '2025-04-16', name: 'ชดเชยวันสงกรานต์', icon: '💦', isPublicHoliday: true },
    { date: '2025-05-05', name: 'ชดเชยวันฉัตรมงคล', icon: '👑', isPublicHoliday: true },
    { date: '2025-05-11', name: 'วันวิสาขบูชา', icon: '🪷', isPublicHoliday: true },
    { date: '2025-05-12', name: 'ชดเชยวันวิสาขบูชา', icon: '🪷', isPublicHoliday: true },
    { date: '2025-07-10', name: 'วันอาสาฬหบูชา', icon: '🪷', isPublicHoliday: true },
    { date: '2025-07-11', name: 'วันเข้าพรรษา', icon: '🪷', isPublicHoliday: true },
    { date: '2025-11-05', name: 'วันลอยกระทง', icon: '🪔', isPublicHoliday: false },
  ],

  // --- ปี 2026 (พ.ศ. 2569 - ปีปัจจุบัน) ---
  2026: [
    { date: '2026-01-02', name: 'วันหยุดพิเศษปีใหม่', icon: '✨', isPublicHoliday: true },
    { date: '2026-01-10', name: 'วันเด็กแห่งชาติ', icon: '🎈', isPublicHoliday: false },
    { date: '2026-03-03', name: 'วันมาฆบูชา', icon: '🪷', isPublicHoliday: true },
    { date: '2026-05-31', name: 'วันวิสาขบูชา', icon: '🪷', isPublicHoliday: true },
    { date: '2026-06-01', name: 'ชดเชยวันวิสาขบูชา', icon: '🪷', isPublicHoliday: true },
    { date: '2026-07-29', name: 'วันอาสาฬหบูชา', icon: '🪷', isPublicHoliday: true },
    { date: '2026-07-30', name: 'วันเข้าพรรษา', icon: '🪷', isPublicHoliday: true },
    { date: '2026-12-07', name: 'ชดเชยวันพ่อแห่งชาติ', icon: '💛', isPublicHoliday: true },
    { date: '2026-11-24', name: 'วันลอยกระทง', icon: '🪔', isPublicHoliday: false },
  ],

  // --- ปี 2027 (พ.ศ. 2570) ---
  2027: [
    { date: '2027-01-09', name: 'วันเด็กแห่งชาติ', icon: '🎈', isPublicHoliday: false },
    { date: '2027-02-21', name: 'วันมาฆบูชา', icon: '🪷', isPublicHoliday: true },
    { date: '2027-02-22', name: 'ชดเชยวันมาฆบูชา', icon: '🪷', isPublicHoliday: true },
    { date: '2027-05-20', name: 'วันวิสาขบูชา', icon: '🪷', isPublicHoliday: true },
    { date: '2027-07-18', name: 'วันอาสาฬหบูชา', icon: '🪷', isPublicHoliday: true },
    { date: '2027-07-19', name: 'วันเข้าพรรษา', icon: '🪷', isPublicHoliday: true },
    { date: '2027-11-13', name: 'วันลอยกระทง', icon: '🪔', isPublicHoliday: false },
  ],

  // --- ปี 2028 (พ.ศ. 2571) ---
  2028: [
    { date: '2028-01-08', name: 'วันเด็กแห่งชาติ', icon: '🎈', isPublicHoliday: false },
    { date: '2028-02-09', name: 'วันมาฆบูชา', icon: '🪷', isPublicHoliday: true },
    { date: '2028-05-08', name: 'วันวิสาขบูชา', icon: '🪷', isPublicHoliday: true },
    { date: '2028-07-06', name: 'วันอาสาฬหบูชา', icon: '🪷', isPublicHoliday: true },
    { date: '2028-07-07', name: 'วันเข้าพรรษา', icon: '🪷', isPublicHoliday: true },
    { date: '2028-11-01', name: 'วันลอยกระทง', icon: '🪔', isPublicHoliday: false },
  ],
};

// -------------------------------------------------------------
// 3. Helper Functions สำหรับค้นหาและวิเคราะห์วันหยุด
// -------------------------------------------------------------

/**
 * ดึงข้อมูลวันหยุดของวันที่ระบุ (YYYY-MM-DD)
 * คืนค่า ThaiHoliday หรือ null หากไม่ใช่วันหยุด/วันสำคัญ
 */
export function getThaiHoliday(dateStr: string): ThaiHoliday | null {
  if (!dateStr || dateStr.length < 10) return null;
  const parts = dateStr.split('-');
  if (parts.length < 3) return null;

  const year = parseInt(parts[0], 10);
  const monthDay = `${parts[1]}-${parts[2]}`;

  // 1. ตรวจสอบจาก Year-Specific / Lunar วันหยุดพิเศษ
  const yearList = YEAR_SPECIFIC_HOLIDAYS[year];
  if (yearList) {
    const specific = yearList.find((h) => h.date === dateStr);
    if (specific) {
      return {
        date: specific.date,
        name: specific.name,
        isPublicHoliday: specific.isPublicHoliday,
        icon: specific.icon,
        description: specific.description,
      };
    }
  }

  // 2. ตรวจสอบจาก Fixed Public Holidays
  const fixed = FIXED_HOLIDAYS.find((h) => h.monthDay === monthDay);
  if (fixed) {
    return {
      date: dateStr,
      name: fixed.name,
      isPublicHoliday: fixed.isPublicHoliday,
      icon: fixed.icon,
      description: fixed.description,
    };
  }

  return null;
}

/**
 * ดึงรายการวันหยุดและวันสำคัญทั้งหมดของเดือนปฏิทินที่กำหนด (1-12)
 * เรียงตามลำดับวันที่จากน้อยไปมาก
 */
export function getHolidaysForMonth(year: number, month: number): ThaiHoliday[] {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const holidays: ThaiHoliday[] = [];
  const mStr = String(month).padStart(2, '0');

  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = String(d).padStart(2, '0');
    const dateStr = `${year}-${mStr}-${dStr}`;
    const h = getThaiHoliday(dateStr);
    if (h) {
      holidays.push(h);
    }
  }

  return holidays;
}

/**
 * ตรวจสอบว่าปีนี้มีข้อมูลวันหยุดจันทรคติที่แม่นยำหรือไม่
 */
export function isYearHolidayDataAccurate(year: number): boolean {
  return year >= 2024 && year <= 2028;
}

/**
 * สรุปสถิติวันหยุดราชการประจำเดือนและสถานะการขึ้นเวรของพยาบาล (Holiday Cross-Check)
 * 
 * ใช้เดือนปฏิทิน (1 ถึง 30/31) ไม่ใช่รอบจ่าย 26→25
 * นับเฉพาะวันหยุดที่ isPublicHoliday === true
 */
export function getHolidayStatsForMonth(
  shifts: DayShiftData[],
  year: number,
  month: number
): HolidayMonthStats {
  const monthHolidays = getHolidaysForMonth(year, month);
  const publicHolidays = monthHolidays.filter((h) => h.isPublicHoliday);

  // สร้าง Map ของวันที่ขึ้นเวร
  const shiftMap = new Map<string, DayShiftData>();
  (shifts || []).forEach((s) => shiftMap.set(s.date, s));

  let offOnHolidays = 0;
  let workedOnHolidays = 0;

  for (const h of publicHolidays) {
    const day = shiftMap.get(h.date);
    const hasWorkedShift = Boolean(day && day.shifts && day.shifts.length > 0);

    if (hasWorkedShift) {
      workedOnHolidays++;
    } else {
      offOnHolidays++;
    }
  }

  return {
    year,
    month,
    publicHolidays,
    totalPublicHolidays: publicHolidays.length,
    offOnHolidays,
    workedOnHolidays,
  };
}
