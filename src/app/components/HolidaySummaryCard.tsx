'use client';

import React, { useMemo } from 'react';
import { Sparkles, Calendar, Coffee, Stethoscope, Info } from 'lucide-react';
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
  // Compute holiday list and cross-check stats for the calendar month
  const allHolidays = useMemo(() => getHolidaysForMonth(year, month), [year, month]);
  const stats = useMemo(() => getHolidayStatsForMonth(shifts, year, month), [shifts, year, month]);

  // Quick lookup for day shifts
  const shiftMap = useMemo(() => {
    const map = new Map<string, DayShiftData>();
    (shifts || []).forEach((s) => map.set(s.date, s));
    return map;
  }, [shifts]);

  const monthName = THAI_MONTH_NAMES[month - 1];
  const thaiYear = year + 543;
  const isAccurateYear = isYearHolidayDataAccurate(year);

  return (
    <div className="bg-white/95 rounded-2xl sm:rounded-3xl p-3 sm:p-5 md:p-6 shadow-[0_4px_20px_rgba(244,114,182,0.12)] border border-pink-100 transition-all text-slate-800 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-pink-50">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-400 to-pink-500 text-white flex items-center justify-center font-bold shadow-xs shadow-pink-200">
            <Calendar size={18} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-800 flex items-center gap-1.5">
              <span>วันหยุด & วันสำคัญประจำเดือน</span>
              <Sparkles size={14} className="text-pink-500" />
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">
              {monthName} {thaiYear} • ตรวจสอบสถานะการขึ้นเวรในวันหยุดราชการ
            </p>
          </div>
        </div>

        {!isAccurateYear && (
          <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
            <Info size={12} />
            <span>ข้อมูลวันหยุดจันทรคติรองรับถึงปี 2571</span>
          </span>
        )}
      </div>

      {/* 3 Holiday Cross-Check Stat Tiles */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {/* Total Public Holidays */}
        <div className="p-2.5 sm:p-3 rounded-2xl bg-rose-50/60 border border-rose-100/80 text-center">
          <span className="text-[11px] text-slate-500 font-bold block">
            🎌 วันหยุดราชการ
          </span>
          <div className="mt-1 flex items-baseline justify-center gap-1">
            <span className="text-lg sm:text-2xl font-black text-rose-600">
              {stats.totalPublicHolidays}
            </span>
            <span className="text-xs text-slate-400 font-medium">วัน</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            ในเดือน {monthName}
          </span>
        </div>

        {/* Off on Holidays (ได้หยุดจริง) */}
        <div className="p-2.5 sm:p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100/80 text-center">
          <span className="text-[11px] text-emerald-800 font-bold flex items-center justify-center gap-1">
            <Coffee size={12} className="text-emerald-500" />
            <span>ได้หยุดจริง (OFF)</span>
          </span>
          <div className="mt-1 flex items-baseline justify-center gap-1">
            <span className="text-lg sm:text-2xl font-black text-emerald-600">
              {stats.offOnHolidays}
            </span>
            <span className="text-xs text-slate-400 font-medium">วัน</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
            {stats.offOnHolidays > 0 ? '🌴 ได้พักผ่อน/เที่ยว' : 'ไม่มีวันหยุดที่ตรงกับ OFF'}
          </span>
        </div>

        {/* Worked on Holidays (ติดเวร) */}
        <div className="p-2.5 sm:p-3 rounded-2xl bg-amber-50/60 border border-amber-100/80 text-center">
          <span className="text-[11px] text-amber-800 font-bold flex items-center justify-center gap-1">
            <Stethoscope size={12} className="text-amber-500" />
            <span>ติดเวรในวันหยุด</span>
          </span>
          <div className="mt-1 flex items-baseline justify-center gap-1">
            <span className="text-lg sm:text-2xl font-black text-amber-700">
              {stats.workedOnHolidays}
            </span>
            <span className="text-xs text-slate-400 font-medium">วัน</span>
          </div>
          <span className="text-[10px] text-amber-600 block mt-0.5 truncate">
            {stats.workedOnHolidays > 0 ? 'ขึ้นเวรดูแลคนไข้' : 'ไม่มีเวรตรงวันหยุด'}
          </span>
        </div>
      </div>

      {/* List of Holidays in this month */}
      <div className="space-y-2 pt-1">
        <h4 className="text-xs font-black text-slate-700 flex items-center justify-between">
          <span>รายการวันหยุด & วันสำคัญในเดือนนี้</span>
          <span className="text-[11px] text-slate-400 font-normal">
            พบทั้งหมด {allHolidays.length} วัน
          </span>
        </h4>

        {allHolidays.length === 0 ? (
          <div className="p-6 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200">
            <span className="text-2xl block mb-1">🌸</span>
            <p className="text-xs font-bold text-slate-600">
              เดือนนี้ไม่มีวันหยุดราชการหรือวันสำคัญพิเศษ
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              เป็นเดือนปฏิบัติงานตามปกติของโรงพยาบาล
            </p>
          </div>
        ) : (
          <div className="space-y-2">
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
                  className={`p-2.5 sm:p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                    holiday.isPublicHoliday
                      ? 'bg-rose-50/40 border-rose-100 hover:border-rose-200'
                      : 'bg-slate-50/50 border-slate-100'
                  }`}
                >
                  {/* Left: Date badge + Name */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 font-black leading-tight border ${
                        holiday.isPublicHoliday
                          ? 'bg-rose-100/80 border-rose-200 text-rose-700'
                          : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}
                    >
                      <span className="text-xs">{dayNum}</span>
                      <span className="text-[9px] font-bold text-slate-500">{dayOfWeek}</span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {holiday.icon && <span className="text-sm">{holiday.icon}</span>}
                        <span className="text-xs sm:text-sm font-black text-slate-800 truncate">
                          {holiday.name}
                        </span>
                        {holiday.isPublicHoliday ? (
                          <span className="text-[9px] bg-rose-100 text-rose-700 font-extrabold px-1.5 py-0.2 rounded-md">
                            วันหยุดราชการ
                          </span>
                        ) : (
                          <span className="text-[9px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.2 rounded-md">
                            วันสำคัญ
                          </span>
                        )}
                      </div>
                      {holiday.description && (
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {holiday.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Nurse Shift Cross-Check (Only evaluate for public holidays) */}
                  <div className="shrink-0 text-right">
                    {holiday.isPublicHoliday ? (
                      hasShifts ? (
                        <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-pink-200 shadow-2xs">
                          <span className="text-[11px] text-slate-500 font-semibold">ติดเวร:</span>
                          <div className="flex items-center gap-0.5">
                            {shifts.map((s, idx) => {
                              const info = ATOMIC_SHIFTS[s.code];
                              return (
                                <span key={idx} className="flex items-center">
                                  {idx > 0 && <span className="text-slate-300 text-xs">/</span>}
                                  <span
                                    className={`text-xs font-black ${
                                      s.ot ? 'text-rose-600' : 'text-slate-800'
                                    }`}
                                    title={s.ot ? 'เวร OT (ตัวแดง)' : 'เวรปกติ (ตัวดำ)'}
                                  >
                                    {info ? info.shortLabel : s.code}
                                  </span>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-100/80 text-emerald-800 border border-emerald-200 text-xs font-black shadow-2xs">
                          <span>🌴 ได้หยุด</span>
                        </span>
                      )
                    ) : (
                      hasShifts ? (
                        <span className="text-[11px] text-slate-500 font-medium">
                          ขึ้นเวร {shifts.map((s) => ATOMIC_SHIFTS[s.code]?.shortLabel ?? s.code).join('/')}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">วันปกติ</span>
                      )
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
