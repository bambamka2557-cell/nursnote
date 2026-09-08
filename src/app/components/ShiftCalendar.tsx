'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  SubShift,
  DayShiftData,
  ShiftPatternId,
  SHIFT_PATTERNS,
  STICKER_OPTIONS,
  ATOMIC_SHIFTS,
  matchShiftPattern,
  THAI_MONTH_NAMES,
  getCycleForDate,
} from '@/app/utils/shiftData';
import { saveShift, deleteShift } from '@/app/actions/shift';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Sparkles,
  Trash2,
  Check,
  X,
  FileText,
} from 'lucide-react';
import { getThaiHoliday } from '@/app/utils/thaiHolidays';

interface ShiftCalendarProps {
  initialShifts: DayShiftData[];
  initialYear: number;
  initialMonth: number; // 1-12
  onShiftUpdated: () => void;
  onMonthChange?: (year: number, month: number) => void;
  calendarMode?: 'shift' | 'holiday';
  onModeChange?: (mode: 'shift' | 'holiday') => void;
}

export default function ShiftCalendar({
  initialShifts,
  initialYear,
  initialMonth,
  onShiftUpdated,
  onMonthChange,
  calendarMode: controlledMode,
  onModeChange,
}: ShiftCalendarProps) {
  const [internalMode, setInternalMode] = useState<'shift' | 'holiday'>('shift');
  const calendarMode = controlledMode ?? internalMode;

  const handleModeChange = (mode: 'shift' | 'holiday') => {
    if (onModeChange) {
      onModeChange(mode);
    } else {
      setInternalMode(mode);
    }
    try {
      localStorage.setItem('lr_calendar_mode', mode);
    } catch {}
  };

  // Sync saved mode from localStorage on mount (hydration safe)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lr_calendar_mode');
      if (saved === 'shift' || saved === 'holiday') {
        if (onModeChange) {
          onModeChange(saved);
        } else {
          setInternalMode(saved);
        }
      }
    } catch {}
  }, []);

  const [currentYear, setCurrentYear] = useState(initialYear);
  const [currentMonth, setCurrentMonth] = useState(initialMonth); // 1-12
  const [shiftsMap, setShiftsMap] = useState<Record<string, DayShiftData>>(() => {
    const map: Record<string, DayShiftData> = {};
    for (const item of initialShifts) {
      map[item.date] = item;
    }
    return map;
  });

  // Sync state if initialShifts changes
  useEffect(() => {
    const map: Record<string, DayShiftData> = {};
    for (const item of initialShifts) {
      map[item.date] = item;
    }
    setShiftsMap(map);
  }, [initialShifts]);

  // Sync state if initialYear or initialMonth changes from parent
  useEffect(() => {
    setCurrentYear(initialYear);
    setCurrentMonth(initialMonth);
  }, [initialYear, initialMonth]);

  // Modal edit state
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editShifts, setEditShifts] = useState<SubShift[]>([]);
  const [editNote, setEditNote] = useState<string>('');
  const [editSticker, setEditSticker] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  // Two-tap guard for the destructive "clear shift" button (first tap arms it).
  const [confirmClear, setConfirmClear] = useState(false);

  // Format today's date in local browser
  const todayDateObj = new Date();
  const todayStr = `${todayDateObj.getFullYear()}-${String(todayDateObj.getMonth() + 1).padStart(2, '0')}-${String(todayDateObj.getDate()).padStart(2, '0')}`;

  // Month navigation
  const handlePrevMonth = () => {
    let newYear = currentYear;
    let newMonth = currentMonth - 1;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    setCurrentYear(newYear);
    setCurrentMonth(newMonth);
    onMonthChange?.(newYear, newMonth);
  };

  const handleNextMonth = () => {
    let newYear = currentYear;
    let newMonth = currentMonth + 1;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    setCurrentYear(newYear);
    setCurrentMonth(newMonth);
    onMonthChange?.(newYear, newMonth);
  };

  const handleGoToday = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    setCurrentYear(y);
    setCurrentMonth(m);
    onMonthChange?.(y, m);
  };

  // Build calendar grid days for currentYear & currentMonth
  // 1st day of month day of week (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();
  const daysInCurrentMonth = new Date(currentYear, currentMonth, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth - 1, 0).getDate();

  // Days array
  interface CalendarCell {
    dateStr: string;
    dayNum: number;
    isCurrentMonth: boolean;
    isToday: boolean;
  }

  const cells: CalendarCell[] = [];

  // Previous month padding
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const prevM = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevY = currentMonth === 1 ? currentYear - 1 : currentYear;
    const dateStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    cells.push({
      dateStr,
      dayNum: day,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({
      dateStr,
      dayNum: d,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
    });
  }

  // Next month padding to complete 35 or 42 cells (multiple of 7)
  const remainingCells = (7 - (cells.length % 7)) % 7;
  for (let d = 1; d <= remainingCells; d++) {
    const nextM = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextY = currentMonth === 12 ? currentYear + 1 : currentYear;
    const dateStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({
      dateStr,
      dayNum: d,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
    });
  }

  // Open modal for day
  const handleCellClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setConfirmClear(false);
    const existing = shiftsMap[dateStr];
    if (existing) {
      setEditShifts(existing.shifts ? [...existing.shifts] : []);
      setEditNote(existing.note || '');
      setEditSticker(existing.sticker || null);
    } else {
      setEditShifts([]);
      setEditNote('');
      setEditSticker(null);
    }
  };

  // Close modal
  const handleCloseModal = () => {
    setSelectedDate(null);
    setConfirmClear(false);
  };

  // Quick pattern select
  const handleSelectPattern = (patternId: ShiftPatternId) => {
    const pattern = SHIFT_PATTERNS.find((p) => p.id === patternId);
    if (!pattern || patternId === 'OFF') {
      setEditShifts([]);
      return;
    }

    // Keep existing OT values if the sub-shift code already exists
    const currentOtMap: Record<string, boolean> = {};
    for (const s of editShifts) {
      currentOtMap[s.code] = s.ot;
    }

    const newShifts: SubShift[] = pattern.subShifts.map((code) => ({
      code,
      ot: currentOtMap[code] ?? false,
    }));

    setEditShifts(newShifts);
  };

  // Toggle OT for specific sub-shift
  const handleToggleOt = (code: string) => {
    setEditShifts((prev) =>
      prev.map((s) => (s.code === code ? { ...s, ot: !s.ot } : s))
    );
  };

  // Save changes
  const handleSaveModal = async () => {
    if (!selectedDate) return;
    setIsSaving(true);
    try {
      const res = await saveShift({
        date: selectedDate,
        shifts: editShifts,
        note: editNote,
        sticker: editSticker,
      });

      if (res.success) {
        setShiftsMap((prev) => ({
          ...prev,
          [selectedDate]: {
            date: selectedDate,
            shifts: editShifts,
            note: editNote || null,
            sticker: editSticker || null,
          },
        }));
        onShiftUpdated();
        handleCloseModal();
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Delete / Clear shift
  const handleDeleteModal = async () => {
    if (!selectedDate) return;
    setIsSaving(true);
    try {
      const res = await deleteShift(selectedDate);
      if (res.success) {
        setShiftsMap((prev) => {
          const next = { ...prev };
          delete next[selectedDate];
          return next;
        });
        onShiftUpdated();
        handleCloseModal();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const selectedPatternId = matchShiftPattern(editShifts);

  // Format date text for modal header
  const getModalDateHeader = () => {
    if (!selectedDate) return '';
    const [y, m, d] = selectedDate.split('-').map(Number);
    const thaiYear = y + 543;
    const monthName = THAI_MONTH_NAMES[m - 1];
    return `วันที่ ${d} ${monthName} ${thaiYear}`;
  };

  const dayOfWeekLabels = [
    { label: 'อา', color: 'text-rose-500' },
    { label: 'จ', color: 'text-amber-500' },
    { label: 'อ', color: 'text-pink-500' },
    { label: 'พ', color: 'text-emerald-500' },
    { label: 'พฤ', color: 'text-orange-500' },
    { label: 'ศ', color: 'text-sky-500' },
    { label: 'ส', color: 'text-purple-500' },
  ];

  return (
    <div className="bg-white/95 rounded-2xl sm:rounded-3xl p-2 sm:p-5 md:p-6 shadow-[0_4px_25px_rgba(244,114,182,0.12)] border border-pink-100 transition-all text-slate-800">
      {/* Calendar Top Header: Month title, Kitty Theme, Mode Toggle & Navigation */}
      <div className="pb-3 sm:pb-4 border-b border-pink-100 space-y-2.5 sm:space-y-3">
        {/* Row 1: Month Title & Kitty Theme */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-pink-400 to-rose-400 flex items-center justify-center text-white shadow-sm shadow-pink-200 shrink-0">
            <span className="text-xl sm:text-2xl">{calendarMode === 'shift' ? '🐱' : '🌸'}</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h2 className="text-base sm:text-xl md:text-2xl font-black text-slate-800">
                {THAI_MONTH_NAMES[currentMonth - 1]} {currentYear + 543}
              </h2>
              <span className="text-xs bg-pink-100 text-pink-700 font-extrabold px-2.5 py-0.5 rounded-full border border-pink-200/50">
                ห้องคลอด LR
              </span>
            </div>
            <p className="text-xs sm:text-sm text-pink-500 font-medium mt-0.5">
              {calendarMode === 'shift' ? 'ตารางเวรพยาบาลห้องคลอด' : 'ปฏิทินวันหยุดราชการ & เทศกาล'}
            </p>
          </div>
        </div>

        {/* Row 2: Navigation (Left) + The Two Circled Buttons (Right) */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-2 pt-1 border-t border-pink-50/80">
          {/* Left: Navigation Buttons [วันนี้] [<] [>] */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <button
              onClick={handleGoToday}
              className="px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-600 font-black text-xs sm:text-sm transition-colors border border-pink-200/60 cursor-pointer shadow-2xs active:scale-95"
            >
              วันนี้
            </button>
            <button
              onClick={handlePrevMonth}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-50 hover:bg-pink-50 text-slate-600 hover:text-pink-600 transition-colors border border-slate-200 cursor-pointer shadow-2xs active:scale-95"
              title="เดือนก่อนหน้า"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-50 hover:bg-pink-50 text-slate-600 hover:text-pink-600 transition-colors border border-slate-200 cursor-pointer shadow-2xs active:scale-95"
              title="เดือนถัดไป"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Right: The Two Circled Buttons (Single Toggle Button & Travel Guide Button) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* วงกลมที่ 1: ปุ่มเดียวกดสลับโหมดปฏิทิน พร้อมคำว่าสลับ */}
            <button
              type="button"
              onClick={() => handleModeChange(calendarMode === 'shift' ? 'holiday' : 'shift')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer border shadow-2xs active:scale-95 ${
                calendarMode === 'shift'
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200/80 shadow-rose-100/50'
                  : 'bg-pink-50 hover:bg-pink-100 text-pink-600 border-pink-200/80 shadow-pink-100/50'
              }`}
              title={calendarMode === 'shift' ? 'แตะเพื่อสลับเป็นปฏิทินวันหยุด' : 'แตะเพื่อสลับเป็นตารางเวร'}
            >
              <span className="text-xs sm:text-sm">{calendarMode === 'shift' ? '📅' : '🩺'}</span>
              <span>สลับ{calendarMode === 'shift' ? 'วันหยุด' : 'ตารางเวร'}</span>
            </button>

            {/* วงกลมที่ 2: ปุ่มแนะนำที่เที่ยวประจำเดือน */}
            <Link
              href={`/travel?month=${currentMonth}`}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer border shadow-2xs active:scale-95 bg-sky-50 hover:bg-sky-100 text-sky-600 border-sky-200/80 shadow-sky-100/50"
              title={`แนะนำที่เที่ยวไทยประจำเดือน ${THAI_MONTH_NAMES[currentMonth - 1]}`}
            >
              <span className="text-xs sm:text-sm">✈️</span>
              <span>ที่เที่ยว</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Weekday Names Header */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1.5 md:gap-2 mt-2 sm:mt-3 text-center">
        {dayOfWeekLabels.map((d, idx) => (
          <div
            key={idx}
            className={`py-1.5 sm:py-2 text-xs sm:text-sm md:text-base font-black rounded-lg sm:rounded-xl bg-pink-50/50 ${d.color}`}
          >
            {d.label}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1.5 md:gap-2 mt-1.5 sm:mt-2">
        {cells.map((cell) => {
          const shiftData = shiftsMap[cell.dateStr];
          const shifts = shiftData?.shifts || [];
          const patternId = matchShiftPattern(shifts);
          const pattern = SHIFT_PATTERNS.find((p) => p.id === patternId);
          const stickerEmoji = STICKER_OPTIONS.find((s) => s.key === shiftData?.sticker)?.emoji;
          const thaiHoliday = getThaiHoliday(cell.dateStr);
          const isPublicHoliday = Boolean(thaiHoliday?.isPublicHoliday);
          const isHolidayMode = calendarMode === 'holiday';

          return (
            <button
              key={cell.dateStr}
              type="button"
              onClick={() => handleCellClick(cell.dateStr)}
              className={`min-h-[72px] sm:min-h-[88px] md:min-h-[105px] p-1 sm:p-2 rounded-xl sm:rounded-2xl border transition-all text-left flex flex-col justify-between relative group cursor-pointer ${
                cell.isToday
                  ? isHolidayMode && isPublicHoliday
                    ? 'bg-rose-100/90 border-rose-400 ring-2 ring-rose-300/50 shadow-xs'
                    : 'bg-pink-50/90 border-pink-400 ring-2 ring-pink-300/40 shadow-xs'
                  : !cell.isCurrentMonth
                  ? 'bg-slate-50/50 border-slate-100 opacity-30 hover:opacity-60'
                  : isHolidayMode
                  ? isPublicHoliday
                    ? 'bg-rose-50/70 border-rose-300/80 ring-1 ring-rose-200/50 hover:bg-rose-50 hover:border-rose-400 hover:shadow-xs'
                    : thaiHoliday
                    ? 'bg-amber-50/50 border-amber-200/80 hover:bg-amber-50 hover:border-amber-300 hover:shadow-xs'
                    : 'bg-white hover:bg-pink-50/30 border-pink-100/80 hover:border-pink-300 hover:shadow-xs'
                  : isPublicHoliday
                  ? 'bg-white hover:bg-pink-50/40 border-rose-200/80 hover:border-rose-300 hover:shadow-xs'
                  : 'bg-white hover:bg-pink-50/40 border-pink-100/80 hover:border-pink-300 hover:shadow-xs'
              }`}
            >
              {/* Day number & Sticker / Holiday Icon */}
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-0.5 sm:gap-1">
                  <span
                    className={`font-black ${
                      cell.isToday
                        ? 'w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-pink-500 text-white flex items-center justify-center text-xs sm:text-sm shadow-xs'
                        : isPublicHoliday && cell.isCurrentMonth
                        ? 'text-rose-600 text-xs sm:text-base md:text-lg'
                        : cell.isCurrentMonth
                        ? 'text-slate-800 text-xs sm:text-base md:text-lg'
                        : 'text-slate-400 text-xs sm:text-base'
                    }`}
                  >
                    {cell.dayNum}
                  </span>
                  {/* Small festive balloon in shift mode for public holidays */}
                  {!isHolidayMode && isPublicHoliday && cell.isCurrentMonth && (
                    <span
                      className="text-[9px] sm:text-[11px] leading-none text-rose-500 select-none filter drop-shadow-2xs"
                      title={thaiHoliday?.name}
                    >
                      🎈
                    </span>
                  )}
                </div>

                {/* Right icon: In Holiday Mode show holiday icon; in Shift mode show sticker */}
                {isHolidayMode && thaiHoliday && cell.isCurrentMonth ? (
                  <span
                    className="text-xs sm:text-sm md:text-base filter drop-shadow-2xs leading-none"
                    title={thaiHoliday.name}
                  >
                    {thaiHoliday.icon || '🎌'}
                  </span>
                ) : stickerEmoji ? (
                  <span className="text-xs sm:text-base md:text-lg filter drop-shadow-xs animate-in zoom-in-50 leading-none">
                    {stickerEmoji}
                  </span>
                ) : null}
              </div>

              {/* Main Content Area */}
              {!isHolidayMode ? (
                /* === SHIFT MODE: Classic Shift Badges with sub-shift red/black OT colors === */
                <div className="w-full my-auto">
                  {shifts.length > 0 ? (
                    <div
                      className={`w-full py-0.5 sm:py-1 px-0.5 sm:px-1 rounded-lg sm:rounded-xl border text-center font-black text-xs sm:text-base md:text-lg shadow-2xs flex items-center justify-center gap-0.5 ${
                        pattern && patternId !== 'OFF'
                          ? `${pattern.badgeBg} ${pattern.badgeBorder}`
                          : 'bg-pink-50/90 border-pink-200'
                      }`}
                    >
                      {shifts.map((s, idx) => (
                        <span key={idx} className="flex items-center">
                          {idx > 0 && <span className="text-slate-400 text-xs sm:text-sm mx-0.5">/</span>}
                          <span
                            className={
                              s.ot
                                ? 'text-rose-600 font-black drop-shadow-xs'
                                : 'text-slate-800 font-black'
                            }
                            title={`${ATOMIC_SHIFTS[s.code]?.fullLabel ?? s.code} (${s.ot ? 'OT สีแดง' : 'ปกติ สีดำ'})`}
                          >
                            {ATOMIC_SHIFTS[s.code]?.shortLabel ?? s.code}
                          </span>
                        </span>
                      ))}
                    </div>
                  ) : shiftData ? (
                    <div className="text-xs sm:text-sm text-slate-400 text-center font-extrabold py-1">
                      OFF
                    </div>
                  ) : null}
                </div>
              ) : (
                /* === HOLIDAY MODE: Holiday Name + Nurse Shift Cross-Check === */
                <div className="w-full my-auto flex flex-col items-center justify-center gap-0.5">
                  {thaiHoliday && cell.isCurrentMonth ? (
                    <div className="w-full text-center">
                      {/* Holiday Name (compact & truncated for mobile) */}
                      <div
                        className={`w-full px-0.5 sm:px-1 py-0.5 rounded text-[8px] sm:text-[10px] md:text-[11px] font-black truncate ${
                          isPublicHoliday
                            ? 'bg-rose-100/90 text-rose-700 border border-rose-200/80'
                            : 'bg-amber-100/80 text-amber-800 border border-amber-200/80'
                        }`}
                        title={thaiHoliday.name}
                      >
                        {thaiHoliday.name}
                      </div>

                      {/* Nurse Cross-Check on Holiday (Strict Audit #1: Real OT red/black, NO auto-OT) */}
                      {shifts.length > 0 ? (
                        <div className="mt-0.5 py-0.5 px-0.5 sm:px-1 rounded bg-white/95 border border-pink-200 text-center text-[8px] sm:text-[10px] md:text-[11px] font-black flex items-center justify-center gap-0.5 shadow-2xs">
                          <span className="text-[7px] sm:text-[9px] text-slate-400 font-semibold">เวร:</span>
                          {shifts.map((s, idx) => (
                            <span key={idx} className="flex items-center">
                              {idx > 0 && <span className="text-slate-300 mx-0.5">/</span>}
                              <span
                                className={s.ot ? 'text-rose-600 font-black' : 'text-slate-800 font-black'}
                                title={s.ot ? 'OT (ตัวแดง)' : 'ปกติ (ตัวดำ)'}
                              >
                                {ATOMIC_SHIFTS[s.code]?.shortLabel ?? s.code}
                              </span>
                            </span>
                          ))}
                        </div>
                      ) : isPublicHoliday ? (
                        <div className="mt-0.5 py-0.5 px-0.5 sm:px-1 rounded bg-emerald-100/90 border border-emerald-200 text-emerald-800 font-black text-[8px] sm:text-[10px] md:text-[11px] text-center flex items-center justify-center gap-0.5 shadow-2xs">
                          <span className="text-[8px] sm:text-[10px]">🌴</span>
                          <span className="truncate">ได้หยุด</span>
                        </div>
                      ) : (
                        <div className="mt-0.5 text-[8px] sm:text-[9px] text-slate-400 text-center font-bold">
                          {shiftData ? 'OFF' : 'วันสำคัญ'}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Non-holiday day in holiday view: Show shifts or OFF cleanly */
                    <div className="w-full text-center">
                      {shifts.length > 0 ? (
                        <div className="w-full py-0.5 px-0.5 sm:px-1 rounded bg-slate-50 border border-slate-200/80 text-center text-[9px] sm:text-xs font-black flex items-center justify-center gap-0.5">
                          <span className="text-[7px] sm:text-[9px] text-slate-400 font-semibold">เวร:</span>
                          {shifts.map((s, idx) => (
                            <span key={idx} className="flex items-center">
                              {idx > 0 && <span className="text-slate-300 mx-0.5">/</span>}
                              <span className={s.ot ? 'text-rose-600' : 'text-slate-700'}>
                                {ATOMIC_SHIFTS[s.code]?.shortLabel ?? s.code}
                              </span>
                            </span>
                          ))}
                        </div>
                      ) : shiftData ? (
                        <div className="text-[9px] sm:text-xs text-slate-400 text-center font-bold">
                          OFF
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              )}

              {/* Note Indicator */}
              <div className="w-full min-h-[14px] flex items-center justify-start">
                {shiftData?.note ? (
                  <div
                    className="flex items-center gap-1 text-[10px] sm:text-xs text-pink-600 font-semibold truncate max-w-full"
                    title={shiftData.note}
                  >
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-pink-500 shrink-0" />
                    <span className="truncate">{shiftData.note}</span>
                  </div>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      {/* Mode-Specific Legend Bar */}
      {calendarMode === 'shift' ? (
        /* Shift Legend Bar */
        <div className="flex flex-wrap items-center justify-center gap-2.5 md:gap-4 mt-4 pt-3.5 border-t border-pink-100 text-xs sm:text-sm text-slate-700">
          <span className="font-extrabold text-pink-600 flex items-center gap-1">
            <Sparkles size={14} />
            <span>สัญลักษณ์เวร:</span>
          </span>
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-3 h-3 rounded-full bg-pink-400 shadow-2xs" />
            <span>ช (เช้า)</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-3 h-3 rounded-full bg-purple-400 shadow-2xs" />
            <span>บ (บ่าย)</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-3 h-3 rounded-full bg-indigo-400 shadow-2xs" />
            <span>ด (ดึก)</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-3 h-3 rounded-full bg-amber-500 shadow-2xs" />
            <span>ช/บ</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-3 h-3 rounded-full bg-teal-500 shadow-2xs" />
            <span>บ/ด</span>
          </div>
          <div className="flex items-center gap-1.5 pl-2 sm:pl-3 border-l border-pink-200">
            <span className="text-slate-900 font-black">ตัวดำ: ปกติ</span>
            <span className="text-slate-300">|</span>
            <span className="text-rose-600 font-black">ตัวแดง: OT</span>
          </div>
        </div>
      ) : (
        /* Holiday Legend Bar */
        <div className="flex flex-wrap items-center justify-center gap-2.5 md:gap-4 mt-4 pt-3.5 border-t border-pink-100 text-xs sm:text-sm text-slate-700">
          <span className="font-extrabold text-rose-600 flex items-center gap-1">
            <span>🎌 สัญลักษณ์วันหยุด:</span>
          </span>
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-3 h-3 rounded-full bg-rose-400 shadow-2xs" />
            <span>วันหยุดราชการ</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-2xs" />
            <span>🌴 ได้หยุดจริง (OFF)</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-3 h-3 rounded-full bg-amber-500 shadow-2xs" />
            <span>🩺 ติดเวร</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-3 h-3 rounded-full bg-slate-300 shadow-2xs" />
            <span>🎈 วันสำคัญทั่วไป</span>
          </div>
        </div>
      )}

      {/* Edit Shift Modal */}
      {selectedDate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm sm:max-w-md rounded-3xl p-5 shadow-2xl border border-pink-100 space-y-4 max-h-[92vh] overflow-y-auto text-slate-800">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-pink-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold shrink-0">
                  <CalendarIcon size={18} />
                </div>
                <div>
                  <h3 className="font-black text-base md:text-lg text-slate-800">
                    {getModalDateHeader()}
                  </h3>
                  <p className="text-xs text-pink-500 font-medium">
                    บันทึกเวร & สติกเกอร์ประจำวัน{selectedDate ? ` • ${getCycleForDate(selectedDate).windowText}` : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 flex items-center justify-center cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Holiday Notice in Modal if date is a Thai Holiday */}
            {(() => {
              const hol = selectedDate ? getThaiHoliday(selectedDate) : null;
              if (!hol) return null;
              return (
                <div
                  className={`p-2.5 sm:p-3 rounded-2xl border flex items-center gap-2.5 ${
                    hol.isPublicHoliday
                      ? 'bg-rose-50/80 border-rose-200 text-rose-800'
                      : 'bg-amber-50/80 border-amber-200 text-amber-800'
                  }`}
                >
                  <span className="text-xl">{hol.icon || '🎌'}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-black text-xs sm:text-sm text-slate-900">{hol.name}</span>
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-md ${
                          hol.isPublicHoliday
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {hol.isPublicHoliday ? 'วันหยุดราชการ' : 'วันสำคัญ'}
                      </span>
                    </div>
                    {hol.description && (
                      <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                        {hol.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Pattern Quick Selector */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-extrabold text-slate-700 flex items-center justify-between">
                <span>เลือกเวรประจำวัน</span>
                <span className="text-xs text-pink-500 font-normal">แตะเลือกเพื่อเปลี่ยน</span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                {SHIFT_PATTERNS.map((p) => {
                  const isSelected = selectedPatternId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPattern(p.id)}
                      className={`py-2.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? `${p.badgeBg} ${p.badgeBorder} ring-2 ring-pink-400 font-black shadow-xs scale-102`
                          : 'bg-slate-50 border-slate-200/80 hover:bg-white text-slate-700 font-bold'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${p.dotColor}`} />
                        <span className="text-sm font-black">{p.code}</span>
                      </div>
                      <span className="text-xs text-slate-600 font-bold block truncate mt-0.5">
                        {p.shortLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sub-shift Color Selector (Red OT vs Black Normal) */}
            {editShifts.length > 0 && (
              <div className="p-3.5 bg-gradient-to-br from-pink-50/60 to-rose-50/40 rounded-2xl border border-pink-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-black text-pink-700 flex items-center gap-1">
                    <span>🔴 กำหนดสีตัวอักษรรายเวรย่อย (OT / ปกติ)</span>
                  </span>
                  <span className="text-[11px] text-slate-500 bg-white px-2.5 py-0.5 rounded-full border border-pink-100 font-medium">
                    แตะเพื่อสลับ
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  รพ. กำหนดสีเป็นรายตัวอักษรเวรย่อย (แดง = คิด OT, ดำ = ปกติ). วัน ช/บ สามารถตั้ง ช แดง และ บ ดำ ได้อย่างอิสระ
                </p>

                <div className="space-y-2 pt-1">
                  {editShifts.map((sub) => {
                    const info = ATOMIC_SHIFTS[sub.code];
                    return (
                      <div
                        key={sub.code}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-pink-100 shadow-2xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-slate-800">
                            {info.fullLabel} ({info.shortLabel})
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            {info.timeRange}
                          </span>
                        </div>

                        {/* OT Toggle Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleOt(sub.code)}
                          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                            sub.ot
                              ? 'bg-rose-500 text-white shadow-xs shadow-rose-200'
                              : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              sub.ot ? 'bg-white' : 'bg-slate-900'
                            }`}
                          />
                          <span>{sub.ot ? '🔴 OT (ตัวแดง)' : '⚫ ปกติ (ตัวดำ)'}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sticker Selector */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-extrabold text-slate-700 flex items-center justify-between">
                <span>สติกเกอร์น่ารัก</span>
                {editSticker && (
                  <button
                    type="button"
                    onClick={() => setEditSticker(null)}
                    className="text-xs text-slate-400 hover:text-slate-600 underline"
                  >
                    ลบสติกเกอร์
                  </button>
                )}
              </label>
              <div className="flex gap-2 justify-between">
                {STICKER_OPTIONS.map((st) => {
                  const isChosen = editSticker === st.key;
                  return (
                    <button
                      key={st.key}
                      type="button"
                      onClick={() => setEditSticker(isChosen ? null : st.key)}
                      className={`flex-1 py-2.5 rounded-xl border text-lg sm:text-xl flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                        isChosen
                          ? 'bg-pink-100 border-pink-300 ring-2 ring-pink-400 shadow-xs scale-105'
                          : 'bg-slate-50 border-slate-200 hover:bg-pink-50/50'
                      }`}
                      title={st.label}
                    >
                      <span>{st.emoji}</span>
                      <span className="text-[10px] sm:text-xs text-slate-600 font-bold">{st.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Daily Note */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-extrabold text-slate-700 flex items-center gap-1">
                <FileText size={15} className="text-pink-500" />
                <span>โน้ตประจำวัน</span>
              </label>
              <input
                type="text"
                value={editNote}
                placeholder="เช่น แลกเวรกับพี่ดาว, เวรตรวจการ, ทำหัตถการ"
                onChange={(e) => setEditNote(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:border-pink-500"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
              <button
                type="button"
                onClick={() => (confirmClear ? handleDeleteModal() : setConfirmClear(true))}
                disabled={isSaving}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer border ${
                  confirmClear
                    ? 'bg-rose-500 text-white border-rose-500 hover:bg-rose-600'
                    : 'text-rose-600 hover:bg-rose-50 border-rose-100'
                }`}
              >
                <Trash2 size={16} />
                <span>{isSaving ? 'กำลังล้าง...' : confirmClear ? 'กดยืนยันล้างเวร' : 'ล้างเวร'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs sm:text-sm font-bold hover:bg-slate-50 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleSaveModal}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-extrabold text-xs sm:text-sm shadow-xs active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Check size={16} />
                  <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึก'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
