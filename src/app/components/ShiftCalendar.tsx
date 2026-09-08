'use client';

import { useState, useEffect, useMemo } from 'react';
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

interface ShiftCalendarProps {
  initialShifts: DayShiftData[];
  initialYear: number;
  initialMonth: number; // 1-12
  onShiftUpdated: () => void;
  onMonthChange?: (year: number, month: number) => void;
}

export default function ShiftCalendar({
  initialShifts,
  initialYear,
  initialMonth,
  onShiftUpdated,
  onMonthChange,
}: ShiftCalendarProps) {
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

  // Count shifts by pattern for the currently viewed month (like user reference app)
  const patternCounts = useMemo(() => {
    const counts: Record<string, number> = {
      M: 0,
      A: 0,
      N: 0,
      M_A: 0,
      A_N: 0,
      OFF: 0,
    };
    for (const cell of cells) {
      if (!cell.isCurrentMonth) continue;
      const data = shiftsMap[cell.dateStr];
      if (!data) continue;
      const patId = matchShiftPattern(data.shifts || []);
      if (patId && counts[patId] !== undefined) {
        counts[patId]++;
      } else if (data.shifts && data.shifts.length === 0) {
        counts.OFF++;
      }
    }
    return counts;
  }, [cells, shiftsMap]);

  // Collect days with notes in the currently viewed month
  const monthNotes = useMemo(() => {
    const list: Array<{ dayNum: number; dateStr: string; note: string; patternId: ShiftPatternId | null; shifts: SubShift[] }> = [];
    for (const cell of cells) {
      if (!cell.isCurrentMonth) continue;
      const data = shiftsMap[cell.dateStr];
      if (data?.note && data.note.trim()) {
        const patId = matchShiftPattern(data.shifts || []);
        list.push({
          dayNum: cell.dayNum,
          dateStr: cell.dateStr,
          note: data.note.trim(),
          patternId: patId,
          shifts: data.shifts || [],
        });
      }
    }
    return list;
  }, [cells, shiftsMap]);

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
    <div className="bg-white/95 rounded-3xl p-4 md:p-6 shadow-[0_4px_25px_rgba(244,114,182,0.12)] border border-pink-100 transition-all text-slate-800">
      {/* Calendar Top Header: Month title, Kitty Theme, Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-pink-100">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-pink-400 to-rose-400 flex items-center justify-center text-white shadow-sm shadow-pink-200 shrink-0">
            <span className="text-xl sm:text-2xl">📅</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-800">
                {THAI_MONTH_NAMES[currentMonth - 1]} {currentYear + 543}
              </h2>
              <span className="text-xs bg-pink-100 text-pink-700 font-extrabold px-2.5 py-0.5 rounded-full border border-pink-200/50">
                ห้องคลอด LR
              </span>
            </div>
            <p className="text-xs sm:text-sm text-pink-500 font-medium mt-0.5">ตารางเวรพยาบาลห้องคลอด</p>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleGoToday}
            className="px-3.5 py-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-600 font-black text-xs sm:text-sm transition-colors border border-pink-200/60 cursor-pointer shadow-2xs"
          >
            วันนี้
          </button>
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl bg-slate-50 hover:bg-pink-50 text-slate-600 hover:text-pink-600 transition-colors border border-slate-200 cursor-pointer shadow-2xs"
            title="เดือนก่อนหน้า"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl bg-slate-50 hover:bg-pink-50 text-slate-600 hover:text-pink-600 transition-colors border border-slate-200 cursor-pointer shadow-2xs"
            title="เดือนถัดไป"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Weekday Names Header */}
      <div className="grid grid-cols-7 gap-1 md:gap-2 mt-3 text-center">
        {dayOfWeekLabels.map((d, idx) => (
          <div
            key={idx}
            className={`py-2 text-xs sm:text-sm md:text-base font-black rounded-xl bg-pink-50/50 ${d.color}`}
          >
            {d.label}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 md:gap-2 mt-2">
        {cells.map((cell) => {
          const shiftData = shiftsMap[cell.dateStr];
          const shifts = shiftData?.shifts || [];
          const patternId = matchShiftPattern(shifts);
          const pattern = SHIFT_PATTERNS.find((p) => p.id === patternId);
          const stickerEmoji = STICKER_OPTIONS.find((s) => s.key === shiftData?.sticker)?.emoji;

          return (
            <button
              key={cell.dateStr}
              type="button"
              onClick={() => handleCellClick(cell.dateStr)}
              className={`min-h-[82px] sm:min-h-[94px] md:min-h-[105px] p-1 sm:p-1.5 rounded-2xl border transition-all text-left flex flex-col justify-between relative group cursor-pointer ${
                cell.isToday
                  ? 'bg-pink-50/90 border-pink-400 ring-2 ring-pink-300/40 shadow-xs'
                  : cell.isCurrentMonth
                  ? 'bg-white hover:bg-pink-50/40 border-pink-100/80 hover:border-pink-300 hover:shadow-xs'
                  : 'bg-slate-50/50 border-slate-100 opacity-40 hover:opacity-75'
              }`}
            >
              {/* Day number & Sticker */}
              <div className="flex items-center justify-between w-full px-1">
                <span
                  className={`font-black ${
                    cell.isToday
                      ? 'w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-pink-500 text-white flex items-center justify-center text-xs sm:text-sm shadow-xs'
                      : cell.isCurrentMonth
                      ? 'text-slate-800 text-sm sm:text-base md:text-lg'
                      : 'text-slate-400 text-sm sm:text-base'
                  }`}
                >
                  {cell.dayNum}
                </span>
                {stickerEmoji && (
                  <span className="text-sm sm:text-base md:text-lg filter drop-shadow-xs animate-in zoom-in-50">
                    {stickerEmoji}
                  </span>
                )}
              </div>

              {/* Shift Badge (With icons and colors matching user's reference app) */}
              <div className="w-full my-auto px-0.5">
                {shifts.length > 0 ? (
                  <div
                    className={`w-full py-1 px-1 rounded-xl border text-center font-black text-xs sm:text-sm md:text-base shadow-2xs flex items-center justify-center gap-1 ${
                      pattern && patternId !== 'OFF'
                        ? `${pattern.badgeBg} ${pattern.badgeBorder}`
                        : 'bg-pink-50/90 border-pink-200'
                    }`}
                  >
                    {pattern?.icon && (
                      <span className="text-sm sm:text-base leading-none shrink-0">{pattern.icon}</span>
                    )}
                    <span className="flex items-center">
                      {shifts.map((s, idx) => (
                        <span key={idx} className="flex items-center">
                          {idx > 0 && (
                            <span
                              className={`${
                                pattern?.id === 'A_N' ? 'text-white/80' : 'text-slate-400'
                              } text-xs sm:text-sm mx-0.5`}
                            >
                              /
                            </span>
                          )}
                          <span
                            className={
                              s.ot
                                ? 'text-rose-600 font-black drop-shadow-xs'
                                : pattern?.id === 'A_N'
                                ? 'text-white font-black'
                                : 'text-slate-900 font-black'
                            }
                            title={`${ATOMIC_SHIFTS[s.code]?.fullLabel ?? s.code} (${s.ot ? 'OT สีแดง' : 'ปกติ สีดำ'})`}
                          >
                            {ATOMIC_SHIFTS[s.code]?.shortLabel ?? s.code}
                          </span>
                        </span>
                      ))}
                    </span>
                  </div>
                ) : shiftData && patternId === 'OFF' ? (
                  <div className="w-full py-1 px-1 rounded-xl border border-[#6ee7b7] bg-[#a7f3d0] text-center font-black text-xs sm:text-sm text-emerald-950 shadow-2xs flex items-center justify-center gap-1">
                    <span className="text-sm">🎉</span>
                    <span>หยุด</span>
                  </div>
                ) : null}
              </div>

              {/* Note Indicator (Red text under shift badge like in user's app) */}
              <div className="w-full min-h-[16px] flex items-center justify-center mt-0.5">
                {shiftData?.note ? (
                  <span
                    className="text-[10px] sm:text-xs text-rose-600 font-bold truncate max-w-full block px-1 text-center"
                    title={shiftData.note}
                  >
                    {shiftData.note}
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      {/* Shift Legend & Counters Bar (Styled after user's reference app) */}
      <div className="mt-4 pt-3.5 border-t border-pink-100 space-y-3">
        {/* Chips grid with counts */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {SHIFT_PATTERNS.map((p) => {
            const count = patternCounts[p.id] || 0;
            return (
              <div
                key={p.id}
                className={`py-1.5 px-2 rounded-xl border text-center shadow-2xs flex items-center justify-center gap-1.5 transition-all ${p.badgeBg} ${p.badgeBorder}`}
              >
                {p.icon && <span className="text-sm sm:text-base">{p.icon}</span>}
                <span className={`text-xs sm:text-sm font-black ${p.id === 'A_N' ? 'text-white' : 'text-slate-900'}`}>
                  {p.shortLabel}
                </span>
                <span className={`text-xs sm:text-sm font-bold opacity-80 ${p.id === 'A_N' ? 'text-white' : 'text-slate-800'}`}>
                  ({count})
                </span>
              </div>
            );
          })}
        </div>

        {/* OT vs Normal explanation */}
        <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-600 font-medium">
          <span className="text-slate-900 font-black">ตัวดำ: เวรปกติ</span>
          <span className="text-slate-300">|</span>
          <span className="text-rose-600 font-black">ตัวแดง: เวร OT</span>
        </div>

        {/* Days with Notes List (like ✏️ 3 - ☀️ เช้า | อบรม) */}
        {monthNotes.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-pink-50">
            <span className="text-xs font-bold text-slate-500 block">
              บันทึกประจำเดือน ({monthNotes.length} รายการ):
            </span>
            <div className="flex flex-wrap gap-2">
              {monthNotes.map((item) => {
                const pat = SHIFT_PATTERNS.find((p) => p.id === item.patternId);
                return (
                  <div
                    key={item.dateStr}
                    onClick={() => handleCellClick(item.dateStr)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-50/80 hover:bg-pink-100 border border-pink-200/60 text-xs font-medium text-slate-800 transition-colors cursor-pointer shadow-2xs"
                  >
                    <span className="font-black text-pink-700">✏️ วันที่ {item.dayNum}</span>
                    {pat && (
                      <span className="font-bold text-slate-600 flex items-center gap-0.5">
                        {pat.icon && <span>{pat.icon}</span>}
                        <span>{pat.shortLabel}</span>
                      </span>
                    )}
                    <span className="text-slate-400">|</span>
                    <span className="text-rose-600 font-bold">{item.note}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

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
                        {p.icon ? (
                          <span className="text-base leading-none">{p.icon}</span>
                        ) : (
                          <span className={`w-2.5 h-2.5 rounded-full ${p.dotColor}`} />
                        )}
                        <span className="text-sm font-black">{p.shortLabel}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-semibold block truncate mt-0.5">
                        {p.code}
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
                onClick={handleDeleteModal}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-100 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
              >
                <Trash2 size={16} />
                <span>ล้างเวร</span>
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
