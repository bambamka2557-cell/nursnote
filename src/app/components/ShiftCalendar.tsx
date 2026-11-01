'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  SubShift,
  DayShiftData,
  ShiftPatternId,
  SHIFT_PATTERNS,
  STICKER_OPTIONS,
  ATOMIC_SHIFTS,
  matchShiftPattern,
  THAI_MONTH_NAMES,
  THAI_MONTH_NAMES_SHORT,
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
  Stethoscope,
  Flag,
  Palmtree,
  Compass,
  BarChart3,
  PanelRightClose,
  PanelRightOpen,
  Clock,
  Plus,
} from 'lucide-react';
import { getThaiHoliday } from '@/app/utils/thaiHolidays';
import { StickerThemeIcon, HolidayThemeIcon, ShiftAtomicIcon } from './ThemeIcons';

export type CalendarLayoutMode = 'month' | 'week' | 'list';

interface ShiftCalendarProps {
  initialShifts: DayShiftData[];
  initialYear: number;
  initialMonth: number; // 1-12
  onShiftUpdated: () => void;
  onMonthChange?: (year: number, month: number) => void;
  calendarMode?: 'shift' | 'holiday';
  onModeChange?: (mode: 'shift' | 'holiday') => void;
  activeView?: 'calendar' | 'overview';
  onViewChange?: (view: 'calendar' | 'overview') => void;
  rightPanelOpen?: boolean;
  onToggleRightPanel?: () => void;
}

interface CalendarCell {
  dateStr: string;
  dayNum: number;
  cellMonth: number; // 1-12
  cellYear: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export default function ShiftCalendar({
  initialShifts,
  initialYear,
  initialMonth,
  onShiftUpdated,
  onMonthChange,
  calendarMode: controlledMode,
  onModeChange,
  activeView = 'calendar',
  onViewChange,
  rightPanelOpen = true,
  onToggleRightPanel,
}: ShiftCalendarProps) {
  const router = useRouter();
  const [internalMode, setInternalMode] = useState<'shift' | 'holiday'>('shift');
  const calendarMode = controlledMode ?? internalMode;

  // Calendar layout view: 'month' (เดือน) | 'week' (สัปดาห์/แถว) | 'list' (รายการ)
  const [layoutMode, setLayoutMode] = useState<CalendarLayoutMode>('month');
  // Filter in list mode: 'all' (ทุกวันในเดือน) | 'active' (เฉพาะวันที่มีเวร/วันหยุด/บันทึก)
  const [listFilter, setListFilter] = useState<'all' | 'active'>('all');

  // Portal target in the global top bar (#topbar-slot in Header.tsx)
  const [topbarSlot, setTopbarSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setTopbarSlot(document.getElementById('topbar-slot'));
  }, []);

  const handleModeChange = (mode: 'shift' | 'holiday') => {
    onViewChange?.('calendar');
    if (onModeChange) {
      onModeChange(mode);
    } else {
      setInternalMode(mode);
    }
    try {
      localStorage.setItem('lr_calendar_mode', mode);
    } catch {}
  };

  const handleLayoutModeChange = (nextLayout: CalendarLayoutMode) => {
    onViewChange?.('calendar');
    setLayoutMode(nextLayout);
    try {
      localStorage.setItem('lr_calendar_layout', nextLayout);
    } catch {}
  };

  // Sync saved mode & layout from localStorage on mount (hydration safe)
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('lr_calendar_mode');
      if (savedMode === 'shift' || savedMode === 'holiday') {
        if (onModeChange) {
          onModeChange(savedMode);
        } else {
          setInternalMode(savedMode);
        }
      }
      const savedLayout = localStorage.getItem('lr_calendar_layout');
      if (savedLayout === 'month' || savedLayout === 'week' || savedLayout === 'list') {
        setLayoutMode(savedLayout);
      }
    } catch {}
  }, []);

  const [currentYear, setCurrentYear] = useState(initialYear);
  const [currentMonth, setCurrentMonth] = useState(initialMonth); // 1-12
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number>(0);

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
  const [confirmClear, setConfirmClear] = useState(false);

  // Format today's date in local browser
  const todayDateObj = new Date();
  const todayStr = `${todayDateObj.getFullYear()}-${String(todayDateObj.getMonth() + 1).padStart(2, '0')}-${String(todayDateObj.getDate()).padStart(2, '0')}`;

  // Build calendar grid days for currentYear & currentMonth
  const cells = useMemo<CalendarCell[]>(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();
    const daysInCurrentMonth = new Date(currentYear, currentMonth, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth - 1, 0).getDate();
    const result: CalendarCell[] = [];

    // Previous month padding
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const prevM = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevY = currentMonth === 1 ? currentYear - 1 : currentYear;
      const dateStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      result.push({
        dateStr,
        dayNum: day,
        cellMonth: prevM,
        cellYear: prevY,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      result.push({
        dateStr,
        dayNum: d,
        cellMonth: currentMonth,
        cellYear: currentYear,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // Next month padding to complete 35 or 42 cells (multiple of 7)
    const remainingCells = (7 - (result.length % 7)) % 7;
    for (let d = 1; d <= remainingCells; d++) {
      const nextM = currentMonth === 12 ? 1 : currentMonth + 1;
      const nextY = currentMonth === 12 ? currentYear + 1 : currentYear;
      const dateStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      result.push({
        dateStr,
        dayNum: d,
        cellMonth: nextM,
        cellYear: nextY,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    return result;
  }, [currentYear, currentMonth, todayStr]);

  // Group cells into weeks (chunks of 7) for Week View
  const weeks = useMemo<CalendarCell[][]>(() => {
    const chunked: CalendarCell[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      chunked.push(cells.slice(i, i + 7));
    }
    return chunked;
  }, [cells]);

  // Default selectedWeekIndex to the week containing today (if in current month), else week 0
  useEffect(() => {
    const todayWeekIdx = weeks.findIndex((w) => w.some((c) => c.dateStr === todayStr));
    if (todayWeekIdx >= 0) {
      setSelectedWeekIndex(todayWeekIdx);
    } else {
      setSelectedWeekIndex(0);
    }
  }, [currentYear, currentMonth, weeks.length, todayStr]);

  // Step prev/next (steps by 1 week when in 'week' view, or 1 month in 'month'/'list' view)
  const handlePrev = () => {
    if (activeView === 'calendar' && layoutMode === 'week') {
      if (selectedWeekIndex > 0) {
        setSelectedWeekIndex((prev) => prev - 1);
        return;
      }
      // Jump to last week of previous month
      let newYear = currentYear;
      let newMonth = currentMonth - 1;
      if (newMonth < 1) {
        newMonth = 12;
        newYear -= 1;
      }
      setCurrentYear(newYear);
      setCurrentMonth(newMonth);
      onMonthChange?.(newYear, newMonth);
      setTimeout(() => setSelectedWeekIndex(4), 0);
      return;
    }

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

  const handleNext = () => {
    if (activeView === 'calendar' && layoutMode === 'week') {
      if (selectedWeekIndex < weeks.length - 1) {
        setSelectedWeekIndex((prev) => prev + 1);
        return;
      }
      // Jump to first week of next month
      let newYear = currentYear;
      let newMonth = currentMonth + 1;
      if (newMonth > 12) {
        newMonth = 1;
        newYear += 1;
      }
      setCurrentYear(newYear);
      setCurrentMonth(newMonth);
      onMonthChange?.(newYear, newMonth);
      setTimeout(() => setSelectedWeekIndex(0), 0);
      return;
    }

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

  const handleCloseModal = () => {
    setSelectedDate(null);
    setConfirmClear(false);
  };

  const handleSelectPattern = (patternId: ShiftPatternId) => {
    const pattern = SHIFT_PATTERNS.find((p) => p.id === patternId);
    if (!pattern || patternId === 'OFF') {
      setEditShifts([]);
      return;
    }

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

  const handleToggleOt = (code: string) => {
    setEditShifts((prev) =>
      prev.map((s) => (s.code === code ? { ...s, ot: !s.ot } : s))
    );
  };

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

  const getModalDateHeader = () => {
    if (!selectedDate) return '';
    const [y, m, d] = selectedDate.split('-').map(Number);
    const thaiYear = y + 543;
    const monthName = THAI_MONTH_NAMES[m - 1];
    return `วันที่ ${d} ${monthName} ${thaiYear}`;
  };

  const dayOfWeekLabels = [
    { full: 'อาทิตย์', short: 'อา.', eng: 'SUN', isSunday: true },
    { full: 'จันทร์', short: 'จ.', eng: 'MON', isSunday: false },
    { full: 'อังคาร', short: 'อ.', eng: 'TUE', isSunday: false },
    { full: 'พุธ', short: 'พ.', eng: 'WED', isSunday: false },
    { full: 'พฤหัส', short: 'พฤ.', eng: 'THU', isSunday: false },
    { full: 'ศุกร์', short: 'ศ.', eng: 'FRI', isSunday: false },
    { full: 'เสาร์', short: 'ส.', eng: 'SAT', isSunday: false },
  ];

  // Unified [วันนี้ | ‹ ›] pill (SunNotes style)
  const renderTodayNavPill = () => (
    <div className="inline-flex items-center rounded-xl border border-pink-200/80 bg-pink-50/40 overflow-hidden shrink-0">
      <button
        type="button"
        onClick={handleGoToday}
        className="px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-pink-100/60 hover:text-pink-600 transition-colors cursor-pointer active:scale-95"
      >
        วันนี้
      </button>
      <span className="h-4 w-px bg-pink-200/70" />
      <button
        type="button"
        onClick={handlePrev}
        className="p-1 sm:p-1.5 text-slate-500 hover:bg-pink-100/60 hover:text-pink-600 transition-colors cursor-pointer active:scale-95"
        title={layoutMode === 'week' ? 'สัปดาห์ก่อนหน้า' : 'เดือนก่อนหน้า'}
        aria-label={layoutMode === 'week' ? 'สัปดาห์ก่อนหน้า' : 'เดือนก่อนหน้า'}
      >
        <ChevronLeft size={16} />
      </button>
      <button
        type="button"
        onClick={handleNext}
        className="p-1 sm:p-1.5 text-slate-500 hover:bg-pink-100/60 hover:text-pink-600 transition-colors cursor-pointer active:scale-95"
        title={layoutMode === 'week' ? 'สัปดาห์ถัดไป' : 'เดือนถัดไป'}
        aria-label={layoutMode === 'week' ? 'สัปดาห์ถัดไป' : 'เดือนถัดไป'}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );

  // View Switcher: [เดือน | สัปดาห์ | รายการ] (SunNotes style)
  const renderLayoutViewSwitcher = () => (
    <div className="inline-flex items-center rounded-xl border border-pink-200/80 bg-pink-50/70 p-0.5 shrink-0">
      {(
        [
          { id: 'month', label: 'เดือน' },
          { id: 'week', label: 'สัปดาห์' },
          { id: 'list', label: 'รายการ' },
        ] as const
      ).map((tab) => {
        const isActive = activeView === 'calendar' && layoutMode === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleLayoutModeChange(tab.id)}
            className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs sm:text-sm transition-all cursor-pointer ${
              isActive
                ? 'bg-white text-pink-600 font-bold shadow-2xs border border-pink-200/60'
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );

  // Mode Switcher: [ตารางเวร | วันหยุด]
  const renderModeSwitcher = (compact = false) => (
    <div className="inline-flex items-center rounded-xl border border-pink-200/80 bg-pink-50/70 p-0.5 shrink-0">
      <button
        type="button"
        onClick={() => handleModeChange('shift')}
        className={`${compact ? 'px-2 py-1 text-[11px]' : 'px-2.5 sm:px-3 py-1 text-xs sm:text-sm'} rounded-lg transition-all cursor-pointer ${
          calendarMode === 'shift'
            ? 'bg-white text-pink-600 font-bold shadow-2xs border border-pink-200/60'
            : 'text-slate-600 hover:text-slate-900 font-medium'
        }`}
      >
        {compact ? 'เวร' : 'ตารางเวร'}
      </button>
      <button
        type="button"
        onClick={() => handleModeChange('holiday')}
        className={`${compact ? 'px-2 py-1 text-[11px]' : 'px-2.5 sm:px-3 py-1 text-xs sm:text-sm'} rounded-lg transition-all cursor-pointer ${
          calendarMode === 'holiday'
            ? 'bg-white text-rose-600 font-bold shadow-2xs border border-rose-200/60'
            : 'text-slate-600 hover:text-slate-900 font-medium'
        }`}
      >
        วันหยุด
      </button>
    </div>
  );

  // Top bar content (portaled into #topbar-slot in Header.tsx)
  // Matches SunNotes desktop & mobile top bar: Right Panel toggle is ALWAYS in the top-right of the Top Bar!
  const topbarControls = (
    <div className="flex w-full items-center justify-between gap-2 min-w-0">
      {/* Left: Plan badge (desktop) + Month Title + Today Nav (md+) */}
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
        <span className="hidden xl:inline-flex items-center gap-1.5 rounded-xl border border-pink-100 bg-pink-50/50 px-2.5 py-1 text-xs font-semibold text-slate-700 shrink-0">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-pink-500 text-white">
            {calendarMode === 'shift' ? <Stethoscope size={12} /> : <Flag size={12} />}
          </span>
          <span>ตารางเวรพยาบาล</span>
        </span>

        <h2 className="text-base sm:text-xl font-bold text-slate-900 truncate">
          {THAI_MONTH_NAMES[currentMonth - 1]} {currentYear + 543}
        </h2>

        <div className="hidden md:block">
          {renderTodayNavPill()}
        </div>
      </div>

      {/* Right side of Top Bar: View/Mode controls + Right Panel Toggle at top-right */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Desktop (md+) View Switcher [เดือน | สัปดาห์ | รายการ] */}
        <div className="hidden md:block">
          {renderLayoutViewSwitcher()}
        </div>

        {/* Desktop (md+) Overview button */}
        {onViewChange && (
          <button
            type="button"
            onClick={() => onViewChange(activeView === 'overview' ? 'calendar' : 'overview')}
            className={`hidden md:inline-flex items-center gap-1.5 rounded-xl border px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold shadow-2xs transition-all cursor-pointer active:scale-[0.98] ${
              activeView === 'overview'
                ? 'border-pink-400 bg-pink-500 text-white'
                : 'border-pink-200/80 bg-white text-slate-700 hover:bg-pink-50 hover:text-pink-600'
            }`}
            title="ดูสรุปเงินเดือนและชั่วโมงทำงาน"
          >
            <BarChart3 size={14} className={activeView === 'overview' ? 'text-white' : 'text-pink-500'} />
            <span>ภาพรวม</span>
          </button>
        )}

        {/* Mode Switcher: [เวร | วันหยุด] on mobile, [ตารางเวร | วันหยุด] on desktop */}
        <div className="md:hidden">{renderModeSwitcher(true)}</div>
        <div className="hidden lg:block">{renderModeSwitcher(false)}</div>

        {/* Travel Guide Button (button + router.push to prevent iOS long-press URL preview) */}
        <button
          type="button"
          onClick={() => router.push(`/travel?month=${currentMonth}`)}
          onContextMenu={(e) => e.preventDefault()}
          className="inline-flex h-8 w-8 sm:h-9 sm:w-auto sm:px-2.5 items-center justify-center gap-1.5 rounded-xl border border-pink-200/80 bg-white hover:bg-pink-50 text-xs sm:text-sm font-semibold text-slate-700 hover:text-pink-600 shadow-2xs transition-colors active:scale-[0.98] cursor-pointer"
          title={`แนะนำที่เที่ยวไทยประจำเดือน ${THAI_MONTH_NAMES[currentMonth - 1]}`}
          aria-label="แนะนำที่เที่ยวไทยประจำเดือน"
        >
          <Compass size={15} className="text-pink-500 shrink-0" />
          <span className="hidden sm:inline">ที่เที่ยว</span>
        </button>

        {/* Right Panel Collapse/Expand Button — moved up to the Top Bar on all screen sizes! */}
        {onToggleRightPanel && (
          <button
            type="button"
            onClick={onToggleRightPanel}
            className={`inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border transition-colors cursor-pointer shadow-2xs active:scale-95 ${
              rightPanelOpen
                ? 'border-pink-300 bg-pink-50 text-pink-600'
                : 'border-pink-100 bg-white text-slate-500 hover:bg-pink-50 hover:text-pink-600'
            }`}
            title={rightPanelOpen ? 'พับแผงสรุปด้านขวา' : 'เปิดแผงสรุปด้านขวา'}
            aria-label={rightPanelOpen ? 'พับแผงสรุปด้านขวา' : 'เปิดแผงสรุปด้านขวา'}
          >
            {rightPanelOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
          </button>
        )}
      </div>
    </div>
  );

  // Mobile/Tablet sub-bar (matches SunNotes mobile Screenshot 4: [วันนี้ | < >] on left, [เดือน | สัปดาห์ | รายการ] + [ภาพรวม] on right)
  const renderMobileSubBar = () => (
    <div className="flex md:hidden items-center justify-between gap-1.5 px-2.5 py-2 border-b border-pink-100 bg-pink-50/25">
      {renderTodayNavPill()}

      <div className="flex items-center gap-1.5">
        {renderLayoutViewSwitcher()}

        {onViewChange && (
          <button
            type="button"
            onClick={() => onViewChange(activeView === 'overview' ? 'calendar' : 'overview')}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-xl border shadow-2xs transition-all cursor-pointer active:scale-95 ${
              activeView === 'overview'
                ? 'border-pink-400 bg-pink-500 text-white'
                : 'border-pink-200/80 bg-white text-pink-500 hover:bg-pink-50'
            }`}
            title="ดูภาพรวมเงินเดือนและชั่วโมงทำงาน"
            aria-label="ดูภาพรวมเงินเดือนและชั่วโมงทำงาน"
          >
            <BarChart3 size={15} />
          </button>
        )}
      </div>
    </div>
  );

  const safeWeekIdx = Math.min(Math.max(0, selectedWeekIndex), Math.max(0, weeks.length - 1));
  const currentWeekCells = weeks[safeWeekIdx] || [];
  const currentMonthCells = useMemo(
    () => cells.filter((c) => c.isCurrentMonth),
    [cells]
  );

  const filteredListCells = useMemo(() => {
    if (listFilter === 'all') return currentMonthCells;
    return currentMonthCells.filter((c) => {
      const sd = shiftsMap[c.dateStr];
      const hol = getThaiHoliday(c.dateStr);
      return Boolean((sd && (sd.shifts.length > 0 || sd.note || sd.sticker)) || hol);
    });
  }, [currentMonthCells, listFilter, shiftsMap]);

  return (
    <>
      {topbarSlot && createPortal(topbarControls, topbarSlot)}

      {activeView === 'overview' && (
        <div className="mb-3 rounded-2xl border border-pink-100 bg-white overflow-hidden shadow-2xs md:hidden">
          {renderMobileSubBar()}
        </div>
      )}

      {activeView === 'calendar' && (
        <div className="rounded-2xl border border-pink-200/80 bg-white shadow-sm overflow-hidden text-slate-800">
          {/* Fallback header if topbarSlot is not yet mounted */}
          {!topbarSlot && (
            <div className="px-3 sm:px-4 py-2.5 border-b border-pink-100 bg-white">
              {topbarControls}
            </div>
          )}

          {/* Mobile sub-bar: [วันนี้ | < >] + [เดือน | สัปดาห์ | รายการ] + [ภาพรวม] */}
          {renderMobileSubBar()}

          {/* ==================== 1. MONTH VIEW (เดือน) ==================== */}
          {layoutMode === 'month' && (
            <>
              {/* SunNotes-style Weekday Header Row */}
              <div className="grid grid-cols-7 bg-pink-50/55 border-b border-pink-200/70 text-center select-none">
                {dayOfWeekLabels.map((d, idx) => (
                  <div
                    key={idx}
                    className="py-2 sm:py-2.5 px-0.5 flex flex-col items-center justify-center"
                  >
                    <span
                      className={`text-xs sm:text-sm font-bold leading-tight ${
                        d.isSunday ? 'text-rose-500' : 'text-slate-800'
                      }`}
                    >
                      <span className="sm:hidden">{d.short}</span>
                      <span className="hidden sm:inline">{d.full}</span>
                    </span>
                    <span className="text-[9px] sm:text-[11px] font-medium uppercase tracking-wider text-slate-400 mt-0.5 leading-none">
                      {d.eng}
                    </span>
                  </div>
                ))}
              </div>

              {/* SunNotes-style Contiguous Days Grid */}
              <div className="grid grid-cols-7">
                {cells.map((cell, idx) => {
                  const shiftData = shiftsMap[cell.dateStr];
                  const shifts = shiftData?.shifts || [];
                  const patternId = matchShiftPattern(shifts);
                  const pattern = SHIFT_PATTERNS.find((p) => p.id === patternId);
                  const hasSticker = Boolean(shiftData?.sticker);
                  const thaiHoliday = getThaiHoliday(cell.dateStr);
                  const isPublicHoliday = Boolean(thaiHoliday?.isPublicHoliday);
                  const isHolidayMode = calendarMode === 'holiday';
                  const isSunday = idx % 7 === 0;
                  const showFirstOfMonthLabel = cell.dayNum === 1 && !cell.isToday;

                  return (
                    <button
                      key={cell.dateStr}
                      type="button"
                      onClick={() => handleCellClick(cell.dateStr)}
                      className={`group relative min-h-[76px] sm:min-h-[98px] md:min-h-[112px] p-1.5 sm:p-2 border-b border-r border-pink-100/90 last:border-r-0 [&:nth-child(7n)]:border-r-0 flex flex-col justify-between text-left transition-colors cursor-pointer ${
                        !cell.isCurrentMonth
                          ? 'bg-pink-50/25 text-slate-400 opacity-55 hover:opacity-85'
                          : cell.isToday
                          ? 'bg-pink-100/45 ring-2 ring-inset ring-pink-400/70'
                          : isHolidayMode && isPublicHoliday
                          ? 'bg-rose-50/45 hover:bg-rose-50/75'
                          : 'bg-white hover:bg-pink-50/40'
                      }`}
                    >
                      {/* Top row: Date Number (left) + Today pill / Sticker / Hover '+' (right) */}
                      <div className="flex items-start justify-between w-full gap-0.5">
                        <div className="flex items-center gap-1 min-w-0">
                          <span
                            className={`text-xs sm:text-sm font-bold inline-flex items-center justify-center leading-none ${
                              cell.isToday
                                ? 'w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-full bg-pink-500 text-white shadow-2xs font-extrabold'
                                : !cell.isCurrentMonth
                                ? 'text-slate-400 font-medium'
                                : isSunday || isPublicHoliday
                                ? 'text-rose-500 font-bold'
                                : 'text-slate-800'
                            }`}
                          >
                            {showFirstOfMonthLabel
                              ? `1 ${THAI_MONTH_NAMES_SHORT[cell.cellMonth - 1]}`
                              : cell.dayNum}
                          </span>

                          {!isHolidayMode && thaiHoliday && cell.isCurrentMonth && (
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                isPublicHoliday ? 'bg-rose-500' : 'bg-amber-400'
                              }`}
                              title={thaiHoliday.name}
                            />
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {cell.isToday && (
                            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-pink-600 border border-pink-200 shadow-2xs leading-none">
                              วันนี้
                            </span>
                          )}

                          {isHolidayMode && thaiHoliday && cell.isCurrentMonth ? (
                            <span title={thaiHoliday.name} className="inline-flex items-center">
                              <HolidayThemeIcon
                                iconKey={thaiHoliday.icon}
                                isPublicHoliday={isPublicHoliday}
                                size={13}
                              />
                            </span>
                          ) : hasSticker ? (
                            <StickerThemeIcon
                              stickerKey={shiftData?.sticker}
                              size={14}
                              withBadge={false}
                            />
                          ) : !cell.isToday ? (
                            <span className="hidden sm:inline-flex opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 text-sm font-medium leading-none select-none">
                              +
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* Main Content Area: Shift pill or Holiday cross-check */}
                      {!isHolidayMode ? (
                        <div className="w-full my-auto pt-1">
                          {shifts.length > 0 ? (
                            <div
                              className={`w-full py-0.5 sm:py-1 px-1.5 rounded-lg border text-center font-bold text-xs sm:text-sm shadow-2xs flex items-center justify-center gap-1.5 ${
                                pattern && patternId !== 'OFF'
                                  ? `${pattern.badgeBg} ${pattern.badgeBorder}`
                                  : 'bg-[#f6efed] border-[#e4d8d5]'
                              }`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  pattern?.dotColor || 'bg-[#b85d70]'
                                }`}
                              />
                              <span className="inline-flex items-center">
                                {shifts.map((s, sIdx) => (
                                  <span key={sIdx} className="inline-flex items-center">
                                    {sIdx > 0 && <span className="text-[#9c918e] text-xs mx-0.5">/</span>}
                                    <span
                                      className={
                                        s.ot
                                          ? 'text-[#a3332b] font-black'
                                          : 'text-[#1d1d1f] font-extrabold'
                                      }
                                      title={`${ATOMIC_SHIFTS[s.code]?.fullLabel ?? s.code} (${s.ot ? 'OT สีแดง' : 'ปกติ สีดำ'})`}
                                    >
                                      {ATOMIC_SHIFTS[s.code]?.shortLabel ?? s.code}
                                    </span>
                                  </span>
                                ))}
                              </span>
                            </div>
                          ) : shiftData ? (
                            <div className="text-[11px] sm:text-xs text-[#8e8886] text-center font-bold py-0.5 px-1.5 rounded-lg bg-[#f4f0ef]/75 border border-[#e6dedc] flex items-center justify-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#b5aba8] shrink-0" />
                              <span>OFF</span>
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <div className="w-full my-auto pt-1 flex flex-col items-center justify-center gap-0.5">
                          {thaiHoliday && cell.isCurrentMonth ? (
                            <div className="w-full text-center">
                              <div
                                className={`w-full px-1 py-0.5 rounded text-[8px] sm:text-[10px] md:text-[11px] font-bold truncate ${
                                  isPublicHoliday
                                    ? 'bg-rose-100/90 text-rose-700 border border-rose-200/80'
                                    : 'bg-amber-100/80 text-amber-800 border border-amber-200/80'
                                }`}
                                title={thaiHoliday.name}
                              >
                                {thaiHoliday.name}
                              </div>

                              {shifts.length > 0 ? (
                                <div className="mt-0.5 py-0.5 px-1 rounded bg-white/95 border border-pink-200 text-center text-[8px] sm:text-[10px] md:text-[11px] font-black flex items-center justify-center gap-0.5 shadow-2xs">
                                  <span className="text-[7px] sm:text-[9px] text-slate-400 font-semibold">เวร:</span>
                                  {shifts.map((s, sIdx) => (
                                    <span key={sIdx} className="flex items-center">
                                      {sIdx > 0 && <span className="text-slate-300 mx-0.5">/</span>}
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
                                <div className="mt-0.5 py-0.5 px-1 rounded bg-emerald-100/90 border border-emerald-200 text-emerald-800 font-black text-[8px] sm:text-[10px] md:text-[11px] text-center flex items-center justify-center gap-1 shadow-2xs">
                                  <Palmtree size={10} className="text-emerald-600 shrink-0" />
                                  <span className="truncate">ได้หยุด</span>
                                </div>
                              ) : (
                                <div className="mt-0.5 text-[8px] sm:text-[9px] text-slate-400 text-center font-bold">
                                  {shiftData ? 'OFF' : 'วันสำคัญ'}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="w-full text-center">
                              {shifts.length > 0 ? (
                                <div className="w-full py-0.5 px-1 rounded bg-slate-50 border border-slate-200/80 text-center text-[9px] sm:text-xs font-black flex items-center justify-center gap-0.5">
                                  <span className="text-[7px] sm:text-[9px] text-slate-400 font-semibold">เวร:</span>
                                  {shifts.map((s, sIdx) => (
                                    <span key={sIdx} className="flex items-center">
                                      {sIdx > 0 && <span className="text-slate-300 mx-0.5">/</span>}
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

                      {/* Bottom Note Indicator */}
                      <div className="w-full min-h-[14px] flex items-center justify-start pt-0.5">
                        {shiftData?.note ? (
                          <div
                            className="w-full border-l-2 border-pink-400 bg-pink-50/75 rounded-r px-1 py-0.5 text-[9px] sm:text-[11px] text-pink-700 font-medium truncate"
                            title={shiftData.note}
                          >
                            {shiftData.note}
                          </div>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* ==================== 2. WEEK / ROW VIEW (สัปดาห์ / แถว — matches SunNotes Screenshot 4) ==================== */}
          {layoutMode === 'week' && (
            <div>
              {/* Week selector bar within current month */}
              <div className="flex items-center justify-between gap-2 px-3 py-2 bg-pink-50/40 border-b border-pink-100 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-1.5 shrink-0">
                  {weeks.map((w, wIdx) => {
                    const firstCell = w[0];
                    const lastCell = w[6];
                    const isSelected = wIdx === safeWeekIdx;
                    const hasToday = w.some((c) => c.isToday);
                    return (
                      <button
                        key={wIdx}
                        type="button"
                        onClick={() => setSelectedWeekIndex(wIdx)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'bg-pink-500 text-white shadow-2xs'
                            : 'bg-white border border-pink-100 text-slate-600 hover:bg-pink-50'
                        }`}
                      >
                        <span>สัปดาห์ {wIdx + 1}</span>
                        <span className={`text-[10px] ${isSelected ? 'text-pink-100' : 'text-slate-400'}`}>
                          ({firstCell.dayNum}–{lastCell.dayNum})
                        </span>
                        {hasToday && !isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
                <span className="text-[11px] text-slate-400 font-medium shrink-0 hidden sm:inline">
                  เลื่อนซ้าย-ขวาหรือแตะเลือกวันเพื่อลงเวร
                </span>
              </div>

              {/* 7-Day Column Strip (horizontally scrollable on phone so 4 columns show at a time like SunNotes Screenshot 4) */}
              <div className="overflow-x-auto no-scrollbar">
                <div className="grid grid-cols-7 min-w-[616px] lg:min-w-0 divide-x divide-pink-100/90 border-b border-pink-100">
                  {currentWeekCells.map((cell, dayIdx) => {
                    const dLabel = dayOfWeekLabels[dayIdx];
                    const shiftData = shiftsMap[cell.dateStr];
                    const shifts = shiftData?.shifts || [];
                    const patternId = matchShiftPattern(shifts);
                    const pattern = SHIFT_PATTERNS.find((p) => p.id === patternId);
                    const thaiHoliday = getThaiHoliday(cell.dateStr);
                    const isPublicHoliday = Boolean(thaiHoliday?.isPublicHoliday);

                    return (
                      <div
                        key={cell.dateStr}
                        onClick={() => handleCellClick(cell.dateStr)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') handleCellClick(cell.dateStr);
                        }}
                        className={`flex flex-col min-h-[360px] sm:min-h-[420px] transition-colors cursor-pointer select-none ${
                          !cell.isCurrentMonth
                            ? 'bg-pink-50/20 opacity-65'
                            : cell.isToday
                            ? 'bg-pink-50/35'
                            : 'bg-white hover:bg-pink-50/25'
                        }`}
                      >
                        {/* Column Header (Matches SunNotes Screenshot 4: Day name + Big Circle Date Number) */}
                        <div
                          className={`py-3 px-1.5 border-b border-pink-100 text-center flex flex-col items-center justify-center gap-1 ${
                            cell.isToday ? 'bg-pink-100/40' : 'bg-pink-50/30'
                          }`}
                        >
                          <span
                            className={`text-xs font-semibold ${
                              dLabel.isSunday || isPublicHoliday ? 'text-rose-500' : 'text-slate-600'
                            }`}
                          >
                            {dLabel.full}
                          </span>
                          <span
                            className={`w-8 h-8 rounded-full inline-flex items-center justify-center text-sm font-bold ${
                              cell.isToday
                                ? 'bg-pink-500 text-white shadow-xs'
                                : dLabel.isSunday || isPublicHoliday
                                ? 'text-rose-500'
                                : 'text-slate-900'
                            }`}
                          >
                            {cell.dayNum}
                          </span>
                        </div>

                        {/* Column Body */}
                        <div className="flex-1 p-2 flex flex-col gap-2 justify-between">
                          <div className="space-y-2">
                            {/* Shift Pill & Atomic Sub-shift Time Breakdown */}
                            {shifts.length > 0 ? (
                              <>
                                <div
                                  className={`w-full py-1.5 px-2 rounded-xl border text-center font-bold text-sm shadow-2xs flex items-center justify-center gap-1.5 ${
                                    pattern && patternId !== 'OFF'
                                      ? `${pattern.badgeBg} ${pattern.badgeBorder}`
                                      : 'bg-[#f6efed] border-[#e4d8d5]'
                                  }`}
                                >
                                  <span
                                    className={`w-2 h-2 rounded-full shrink-0 ${
                                      pattern?.dotColor || 'bg-[#b85d70]'
                                    }`}
                                  />
                                  <span className="inline-flex items-center">
                                    {shifts.map((s, sIdx) => (
                                      <span key={sIdx} className="inline-flex items-center">
                                        {sIdx > 0 && <span className="text-[#9c918e] text-xs mx-0.5">/</span>}
                                        <span className={s.ot ? 'text-[#a3332b] font-black' : 'text-[#1d1d1f] font-extrabold'}>
                                          {ATOMIC_SHIFTS[s.code]?.shortLabel ?? s.code}
                                        </span>
                                      </span>
                                    ))}
                                  </span>
                                </div>

                                <div className="space-y-1.5">
                                  {shifts.map((s, sIdx) => {
                                    const info = ATOMIC_SHIFTS[s.code];
                                    return (
                                      <div
                                        key={sIdx}
                                        className="rounded-xl border border-pink-100/90 bg-white p-2 shadow-2xs space-y-0.5"
                                      >
                                        <div className="flex items-center justify-between gap-1">
                                          <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-800">
                                            <ShiftAtomicIcon code={s.code} size={12} />
                                            <span>{info?.fullLabel ?? s.code}</span>
                                          </span>
                                          <span
                                            className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${
                                              s.ot
                                                ? 'bg-rose-100 text-rose-600'
                                                : 'bg-slate-100 text-slate-600'
                                            }`}
                                          >
                                            {s.ot ? 'OT' : 'ปกติ'}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                                          <Clock size={10} />
                                          <span>{info?.timeRange}</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </>
                            ) : shiftData ? (
                              <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 py-2.5 px-2 text-center space-y-0.5">
                                <div className="flex items-center justify-center gap-1 text-emerald-700 font-black text-xs">
                                  <Palmtree size={13} />
                                  <span>OFF</span>
                                </div>
                                <span className="block text-[10px] text-emerald-600 font-medium">
                                  วันหยุดพักผ่อน
                                </span>
                              </div>
                            ) : null}

                            {/* Thai Holiday Card */}
                            {thaiHoliday && (
                              <div
                                className={`rounded-xl border p-2 text-[11px] leading-snug space-y-0.5 ${
                                  isPublicHoliday
                                    ? 'bg-rose-50/80 border-rose-200/80 text-rose-700'
                                    : 'bg-amber-50/80 border-amber-200/80 text-amber-800'
                                }`}
                              >
                                <div className="flex items-center gap-1 font-bold">
                                  <HolidayThemeIcon
                                    iconKey={thaiHoliday.icon}
                                    isPublicHoliday={isPublicHoliday}
                                    size={12}
                                  />
                                  <span className="line-clamp-2">{thaiHoliday.name}</span>
                                </div>
                              </div>
                            )}

                            {/* Sticker & Note */}
                            {(shiftData?.sticker || shiftData?.note) && (
                              <div className="rounded-xl border border-pink-100 bg-pink-50/40 p-2 space-y-1">
                                {shiftData?.sticker && (
                                  <div className="flex items-center gap-1">
                                    <StickerThemeIcon
                                      stickerKey={shiftData.sticker}
                                      size={13}
                                      withBadge={true}
                                    />
                                    <span className="text-[10px] font-bold text-pink-600">
                                      {STICKER_OPTIONS.find((st) => st.key === shiftData.sticker)?.label}
                                    </span>
                                  </div>
                                )}
                                {shiftData?.note && (
                                  <p className="text-[11px] text-slate-600 font-medium break-words leading-snug">
                                    {shiftData.note}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Bottom Subtle Add/Edit Prompt */}
                          {!shifts.length && !shiftData && (
                            <div className="pt-2 text-center">
                              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-slate-300">
                                <Plus size={12} />
                                <span>ลงเวร</span>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ==================== 3. LIST / AGENDA VIEW (รายการ — matches SunNotes AgendaView) ==================== */}
          {layoutMode === 'list' && (
            <div>
              {/* List Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 sm:px-5 py-2.5 bg-pink-50/40 border-b border-pink-100">
                <div className="inline-flex items-center rounded-xl border border-pink-200/80 bg-white p-0.5">
                  <button
                    type="button"
                    onClick={() => setListFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      listFilter === 'all'
                        ? 'bg-pink-500 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ทุกวันในเดือน ({currentMonthCells.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setListFilter('active')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      listFilter === 'active'
                        ? 'bg-pink-500 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    เฉพาะวันที่มีเวร/วันหยุด
                  </button>
                </div>

                <span className="text-xs text-slate-500 font-medium">
                  แตะที่แถวเพื่อแก้ไขเวรหรือเพิ่มโน้ต
                </span>
              </div>

              {filteredListCells.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-2">
                  <p className="text-sm font-bold text-slate-600">ยังไม่มีรายการเวรในเดือนนี้</p>
                  <button
                    type="button"
                    onClick={() => setListFilter('all')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-pink-500 px-3.5 py-1.5 text-xs font-bold text-white cursor-pointer"
                  >
                    แสดงทุกวันในเดือนนี้
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-pink-100/80 max-h-[68vh] overflow-y-auto">
                  {filteredListCells.map((cell) => {
                    const dateObj = new Date(cell.cellYear, cell.cellMonth - 1, cell.dayNum);
                    const dowIdx = dateObj.getDay();
                    const dLabel = dayOfWeekLabels[dowIdx];
                    const shiftData = shiftsMap[cell.dateStr];
                    const shifts = shiftData?.shifts || [];
                    const patternId = matchShiftPattern(shifts);
                    const pattern = SHIFT_PATTERNS.find((p) => p.id === patternId);
                    const thaiHoliday = getThaiHoliday(cell.dateStr);
                    const isPublicHoliday = Boolean(thaiHoliday?.isPublicHoliday);

                    return (
                      <button
                        key={cell.dateStr}
                        type="button"
                        onClick={() => handleCellClick(cell.dateStr)}
                        className={`w-full flex items-center justify-between gap-3 px-3.5 sm:px-5 py-3 text-left transition-colors cursor-pointer ${
                          cell.isToday
                            ? 'bg-pink-50/70 hover:bg-pink-100/50'
                            : 'bg-white hover:bg-pink-50/35'
                        }`}
                      >
                        {/* Left: Date Badge */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className={`w-13 sm:w-14 shrink-0 rounded-xl border py-1.5 px-1 text-center flex flex-col items-center justify-center ${
                              cell.isToday
                                ? 'bg-pink-500 text-white border-pink-500 shadow-2xs'
                                : dLabel.isSunday || isPublicHoliday
                                ? 'bg-rose-50/70 text-rose-600 border-rose-200/70'
                                : 'bg-slate-50 text-slate-700 border-slate-200/70'
                            }`}
                          >
                            <span
                              className={`text-[10px] font-bold leading-none ${
                                cell.isToday ? 'text-pink-100' : ' opacity-75'
                              }`}
                            >
                              {dLabel.short}
                            </span>
                            <span className="text-base sm:text-lg font-black leading-tight mt-0.5">
                              {cell.dayNum}
                            </span>
                          </div>

                          {/* Center: Shift Info + Holiday + Note */}
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {shifts.length > 0 ? (
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border text-xs sm:text-sm font-bold shadow-2xs ${
                                    pattern && patternId !== 'OFF'
                                      ? `${pattern.badgeBg} ${pattern.badgeBorder}`
                                      : 'bg-[#f6efed] border-[#e4d8d5]'
                                  }`}
                                >
                                  <span
                                    className={`w-2 h-2 rounded-full shrink-0 ${
                                      pattern?.dotColor || 'bg-[#b85d70]'
                                    }`}
                                  />
                                  <span className="inline-flex items-center">
                                    {shifts.map((s, sIdx) => (
                                      <span key={sIdx} className="inline-flex items-center">
                                        {sIdx > 0 && <span className="text-[#9c918e] mx-0.5">/</span>}
                                        <span className={s.ot ? 'text-[#a3332b] font-black' : 'text-[#1d1d1f] font-extrabold'}>
                                          {ATOMIC_SHIFTS[s.code]?.shortLabel ?? s.code}
                                        </span>
                                      </span>
                                    ))}
                                  </span>
                                </span>
                              ) : shiftData ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-black">
                                  <Palmtree size={12} />
                                  <span>วันหยุด (OFF)</span>
                                </span>
                              ) : (
                                <span className="text-xs font-medium text-slate-400">
                                  ยังไม่ได้ระบุเวร
                                </span>
                              )}

                              {/* Detailed shift names & time ranges */}
                              {shifts.length > 0 && (
                                <span className="text-xs text-slate-500 font-medium truncate">
                                  {shifts
                                    .map(
                                      (s) =>
                                        `${ATOMIC_SHIFTS[s.code]?.fullLabel} (${ATOMIC_SHIFTS[s.code]?.timeRange}${s.ot ? ' • OT' : ''})`
                                    )
                                    .join(' + ')}
                                </span>
                              )}

                              {cell.isToday && (
                                <span className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 text-[10px] font-bold">
                                  วันนี้
                                </span>
                              )}
                            </div>

                            {/* Holiday or Note Row */}
                            {(thaiHoliday || shiftData?.note) && (
                              <div className="flex items-center gap-2 flex-wrap text-xs">
                                {thaiHoliday && (
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[11px] ${
                                      isPublicHoliday
                                        ? 'bg-rose-50 text-rose-700 border border-rose-200/70'
                                        : 'bg-amber-50 text-amber-800 border border-amber-200/70'
                                    }`}
                                  >
                                    <HolidayThemeIcon
                                      iconKey={thaiHoliday.icon}
                                      isPublicHoliday={isPublicHoliday}
                                      size={11}
                                    />
                                    <span>{thaiHoliday.name}</span>
                                  </span>
                                )}

                                {shiftData?.note && (
                                  <span className="inline-flex items-center gap-1 text-pink-700 bg-pink-50/80 border-l-2 border-pink-400 px-2 py-0.5 rounded-r text-[11px] font-medium truncate max-w-full">
                                    <span>{shiftData.note}</span>
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right: Sticker + Chevron */}
                        <div className="flex items-center gap-2 shrink-0">
                          {shiftData?.sticker && (
                            <StickerThemeIcon
                              stickerKey={shiftData.sticker}
                              size={15}
                              withBadge={true}
                            />
                          )}
                          <ChevronRight size={16} className="text-slate-300" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Mode-Specific Legend Bar inside Card Footer */}
          {calendarMode === 'shift' ? (
            <div className="flex flex-wrap items-center justify-center gap-2.5 md:gap-4 px-3 py-3 bg-[#f3ecea]/65 border-t border-[#e8dfdc] text-xs sm:text-sm text-[#57534e]">
              <span className="font-bold text-[#a63e54] flex items-center gap-1">
                <Sparkles size={14} />
                <span>สัญลักษณ์เวร:</span>
              </span>
              <div className="flex items-center gap-1.5 font-semibold text-[#1d1d1f]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#b85d70]" />
                <span>ช (เช้า)</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-[#1d1d1f]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8a6d96]" />
                <span>บ (บ่าย)</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-[#1d1d1f]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#5b6b88]" />
                <span>ด (ดึก)</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-[#1d1d1f]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#c4843d]" />
                <span>ช/บ</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-[#1d1d1f]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4d827a]" />
                <span>บ/ด</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-[#1d1d1f]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#558263]" />
                <span>ด/บ</span>
              </div>
              <div className="flex items-center gap-1.5 pl-2 sm:pl-3 border-l border-[#e4d8d5]">
                <span className="text-[#1d1d1f] font-bold">ตัวดำ: ปกติ</span>
                <span className="text-[#c5b8b4]">|</span>
                <span className="text-[#a3332b] font-bold">ตัวแดง: OT</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-2.5 md:gap-4 px-3 py-3 bg-[#f3ecea]/65 border-t border-[#e8dfdc] text-xs sm:text-sm text-[#57534e]">
              <span className="font-bold text-[#a63e54] flex items-center gap-1">
                <Flag size={13} />
                <span>สัญลักษณ์วันหยุด:</span>
              </span>
              <div className="flex items-center gap-1.5 font-semibold text-[#1d1d1f]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#b85d70]" />
                <span>วันหยุดราชการ</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-[#1d1d1f]">
                <Palmtree size={13} className="text-[#558263]" />
                <span>ได้หยุดจริง (OFF)</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-[#1d1d1f]">
                <Stethoscope size={13} className="text-[#c4843d]" />
                <span>ติดเวร</span>
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-[#1d1d1f]">
                <Sparkles size={13} className="text-[#8e8886]" />
                <span>วันสำคัญทั่วไป</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Shift Modal */}
      {selectedDate && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-[100] flex items-center justify-center p-3 sm:p-4"
          data-scroll-lock
        >
          <div className="bg-white w-full max-w-sm sm:max-w-md rounded-2xl p-5 shadow-2xl border border-pink-100 space-y-4 max-h-[90vh] overflow-y-auto text-slate-800">
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
                    บันทึกเวร & สัญลักษณ์ประจำวัน{selectedDate ? ` • ${getCycleForDate(selectedDate).windowText}` : ''}
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
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/80 border border-pink-100">
                    <HolidayThemeIcon
                      iconKey={hol.icon}
                      isPublicHoliday={hol.isPublicHoliday}
                      size={16}
                    />
                  </span>
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
                  const isOff = p.id === 'OFF';
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPattern(p.id)}
                      className={`py-2.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                        isOff ? 'col-span-3 py-2' : ''
                      } ${
                        isSelected
                          ? `${p.badgeBg} ${p.badgeBorder} ring-2 ring-pink-400 font-black shadow-xs`
                          : 'bg-slate-50 border-slate-200/80 hover:bg-white text-slate-700 font-bold'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        {isOff ? (
                          <Palmtree size={14} className="text-emerald-600" />
                        ) : (
                          <span className={`w-2.5 h-2.5 rounded-full ${p.dotColor}`} />
                        )}
                        <span className="text-sm font-black">
                          {isOff ? 'วันหยุด (OFF)' : p.code}
                        </span>
                      </div>
                      {!isOff && (
                        <span className="text-xs text-slate-600 font-bold block truncate mt-0.5">
                          {p.shortLabel}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sub-shift Color Selector (Red OT vs Black Normal) */}
            {editShifts.length > 0 && (
              <div className="p-3.5 bg-gradient-to-br from-pink-50/60 to-rose-50/40 rounded-2xl border border-pink-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-black text-pink-700 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span>กำหนดสีตัวอักษรรายเวรย่อย (OT / ปกติ)</span>
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
                            className={`w-2.5 h-2.5 rounded-full ${
                              sub.ot ? 'bg-white' : 'bg-slate-900'
                            }`}
                          />
                          <span>{sub.ot ? 'OT (ตัวแดง)' : 'ปกติ (ตัวดำ)'}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Themed Sticker Selector */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-extrabold text-slate-700 flex items-center justify-between">
                <span>สัญลักษณ์ประจำวัน</span>
                {editSticker && (
                  <button
                    type="button"
                    onClick={() => setEditSticker(null)}
                    className="text-xs text-slate-400 hover:text-slate-600 underline cursor-pointer"
                  >
                    ลบสัญลักษณ์
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
                      className={`flex-1 py-2 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        isChosen
                          ? 'bg-pink-100 border-pink-300 ring-2 ring-pink-400 shadow-xs'
                          : 'bg-slate-50 border-slate-200 hover:bg-pink-50/50'
                      }`}
                      title={st.label}
                    >
                      <StickerThemeIcon stickerKey={st.key} size={16} withBadge={true} />
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
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-sm font-medium text-slate-800 focus:bg-white focus:border-pink-500"
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
    </>
  );
}
