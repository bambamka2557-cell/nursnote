'use client';

import React, { useMemo } from 'react';
import { Calendar, Info, Palmtree, Flower2 } from 'lucide-react';
import { HolidayThemeIcon } from './ThemeIcons';
import { DayShiftData, THAI_MONTH_NAMES, ATOMIC_SHIFTS } from '@/app/utils/shiftData';
import {
  getHolidaysForMonth,
  getHolidayStatsForMonth,
  isYearHolidayDataAccurate,
  ThaiHoliday,
} from '@/app/utils/thaiHolidays';

interface HolidaySummaryCardProps {
  shifts: DayShiftData[];
  year: number;
  month: number;
}

const THAI_DAY_OF_WEEK = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

export default function HolidaySummaryCard({
  shifts,
  year,
  month,
}: HolidaySummaryCardProps) {
  const allHolidays = useMemo(() => getHolidaysForMonth(year, month), [year, month]);
  const stats = useMemo(() => getHolidayStatsForMonth(shifts, year, month), [shifts, year, month]);

  const shiftMap = useMemo(() => {
    const map = new Map<string, DayShiftData>();
    (shifts || []).forEach((s) => map.set(s.date, s));
    return map;
  }, [shifts]);

  const monthName = THAI_MONTH_NAMES[month - 1];
  const thaiYear = year + 543;
  const isAccurateYear = isYearHolidayDataAccurate(year);

  return (
    <div className="bg-white rounded-2xl p-4 shadow-2xs border border-[#ece7dd] transition-all text-[#1d1d1f] space-y-3">
      {/* Header (SunNotes Right-Panel Card Header Style with Vibrant Icon Chip) */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#f43f5e] text-white shadow-2xs">
            <Calendar size={16} />
          </span>
          <div className="min-w-0">
            <div className="text-sm font-bold text-[#1d1d1f] truncate">
              วันหยุด & วันสำคัญประจำเดือน
            </div>
            <p className="text-[11px] text-[#6e6e73] font-medium truncate">
              {monthName} {thaiYear} • สถานะการขึ้นเวรในวันหยุดราชการ
            </p>
          </div>
        </div>

        {!isAccurateYear && (
          <span className="text-[10px] bg-[#fffbeb] text-[#b45309] border border-[#fde68a] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
            <Info size={12} />
            <span>รองรับถึงปี 2571</span>
          </span>
        )}
      </div>

      {/* 3 SunNotes-Style StatTiles */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {/* Total Public Holidays */}
        <div className="rounded-xl border border-[#fecdd3] bg-[#fff1f2] px-2 py-2.5">
          <div className="text-base font-extrabold text-[#f43f5e] leading-tight">
            {stats.totalPublicHolidays} <span className="text-[11px] font-semibold">วัน</span>
          </div>
          <div className="mt-0.5 text-[11px] font-bold text-[#1d1d1f]">
            วันหยุดราชการ
          </div>
          <div className="text-[9px] text-[#6e6e73] font-medium mt-0.5 truncate">
            เดือน{monthName}
          </div>
        </div>

        {/* Off on Holidays (ได้หยุดจริง) */}
        <div className="rounded-xl border border-[#a7f3d0] bg-[#ecfdf5] px-2 py-2.5">
          <div className="text-base font-extrabold text-[#10b981] leading-tight">
            {stats.offOnHolidays} <span className="text-[11px] font-semibold">วัน</span>
          </div>
          <div className="mt-0.5 text-[11px] font-bold text-[#1d1d1f]">
            ได้หยุดจริง
          </div>
          <div className="text-[9px] text-[#059669] font-semibold mt-0.5 truncate">
            {stats.offOnHolidays > 0 ? 'ได้พักผ่อน' : 'ไม่มีตรง OFF'}
          </div>
        </div>

        {/* Worked on Holidays (ติดเวร) */}
        <div className="rounded-xl border border-[#fde68a] bg-[#fffbeb] px-2 py-2.5">
          <div className="text-base font-extrabold text-[#d99a00] leading-tight">
            {stats.workedOnHolidays} <span className="text-[11px] font-semibold">วัน</span>
          </div>
          <div className="mt-0.5 text-[11px] font-bold text-[#1d1d1f]">
            ติดเวรวันหยุด
          </div>
          <div className="text-[9px] text-[#b45309] font-medium mt-0.5 truncate">
            {stats.workedOnHolidays > 0 ? 'ขึ้นเวรดูแลคนไข้' : 'ไม่ติดเวร'}
          </div>
        </div>
      </div>

      {/* List of Holidays in this month */}
      <div className="space-y-2 pt-1 border-t border-[#ece7dd]">
        <h4 className="text-xs font-bold text-[#6e6e73] flex items-center justify-between pt-1">
          <span>รายการวันหยุด & วันสำคัญ</span>
          <span className="text-[11px] text-[#8e8e93] font-normal">
            {allHolidays.length} วัน
          </span>
        </h4>

        {allHolidays.length === 0 ? (
          <div className="p-4 text-center rounded-xl bg-[#faf8f4] border border-dashed border-[#ece7dd]">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#fdf2f8] text-[#ec4899] mb-1">
              <Flower2 size={16} />
            </span>
            <p className="text-xs font-bold text-[#6e6e73]">
              เดือนนี้ไม่มีวันหยุดราชการหรือวันสำคัญพิเศษ
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {allHolidays.map((holiday: ThaiHoliday) => {
              const [, , dStr] = holiday.date.split('-');
              const dayNum = parseInt(dStr, 10);
              const dateObj = new Date(`${holiday.date}T00:00:00Z`);
              const dayOfWeek = THAI_DAY_OF_WEEK[dateObj.getUTCDay()];

              const dayShiftData = shiftMap.get(holiday.date);
              const shifts = dayShiftData?.shifts || [];
              const hasShifts = shifts.length > 0;

              return (
                <div
                  key={holiday.date}
                  className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                    holiday.isPublicHoliday
                      ? 'bg-[#fff1f2]/70 border-[#fecdd3]'
                      : 'bg-[#faf8f4] border-[#ece7dd]'
                  }`}
                >
                  {/* Left: Date badge + Name */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center shrink-0 font-bold leading-tight border ${
                        holiday.isPublicHoliday
                          ? 'bg-[#ffe4e6] border-[#fecdd3] text-[#e11d48]'
                          : 'bg-white border-[#ece7dd] text-[#6e6e73]'
                      }`}
                    >
                      <span className="text-xs">{dayNum}</span>
                      <span className="text-[9px] font-semibold text-[#6e6e73]">{dayOfWeek}</span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {holiday.icon && (
                          <HolidayThemeIcon
                            iconKey={holiday.icon}
                            isPublicHoliday={holiday.isPublicHoliday}
                            size={13}
                          />
                        )}
                        <span className="text-xs font-bold text-[#1d1d1f] truncate">
                          {holiday.name}
                        </span>
                      </div>
                      {holiday.description && (
                        <p className="text-[10px] text-[#6e6e73] truncate mt-0.5">
                          {holiday.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Nurse Shift Cross-Check */}
                  <div className="shrink-0 text-right">
                    {holiday.isPublicHoliday ? (
                      hasShifts ? (
                        <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border border-[#ece7dd] shadow-2xs">
                          <span className="text-[10px] text-[#6e6e73] font-semibold">เวร:</span>
                          <div className="flex items-center gap-0.5">
                            {shifts.map((s, idx) => {
                              const info = ATOMIC_SHIFTS[s.code];
                              return (
                                <span key={idx} className="flex items-center">
                                  {idx > 0 && <span className="text-[#8e8e93] text-xs">/</span>}
                                  <span
                                    className={`text-xs font-bold ${
                                      s.ot ? 'text-[#e11d48]' : 'text-[#1d1d1f]'
                                    }`}
                                  >
                                    {info ? info.shortLabel : s.code}
                                  </span>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0] text-[11px] font-bold">
                          <Palmtree size={11} className="text-[#10b981]" />
                          <span>ได้หยุด</span>
                        </span>
                      )
                    ) : hasShifts ? (
                      <span className="text-[11px] text-[#6e6e73] font-medium">
                        เวร {shifts.map((s) => ATOMIC_SHIFTS[s.code]?.shortLabel ?? s.code).join('/')}
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#8e8e93]">วันสำคัญ</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
