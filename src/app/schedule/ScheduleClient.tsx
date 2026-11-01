'use client';

import { useState, useCallback, useTransition, useEffect } from 'react';
import ShiftCalendar from '@/app/components/ShiftCalendar';
import WorkLifeBalanceCard from '@/app/components/WorkLifeBalanceCard';
import SalarySummaryCard from '@/app/components/SalarySummaryCard';
import SalaryConfigModal from '@/app/components/SalaryConfigModal';
import HolidaySummaryCard from '@/app/components/HolidaySummaryCard';
import {
  DayShiftData,
  SalarySummaryResult,
  NurseSalaryConfigData,
  THAI_MONTH_NAMES,
} from '@/app/utils/shiftData';
import {
  calculateSalarySummary,
  getSalaryConfig,
} from '@/app/actions/salary';
import { getShiftsByDateRange } from '@/app/actions/shift';
import {
  CalendarDays,
  BarChart3,
  PanelRightClose,
  Settings,
  X,
} from 'lucide-react';

interface ScheduleClientProps {
  initialShifts: DayShiftData[];
  initialSummary: SalarySummaryResult;
  initialConfig: NurseSalaryConfigData;
  initialYear: number;
  initialMonth: number;
}

export default function ScheduleClient({
  initialShifts,
  initialSummary,
  initialConfig,
  initialYear,
  initialMonth,
}: ScheduleClientProps) {
  const [calendarMode, setCalendarMode] = useState<'shift' | 'holiday'>('shift');
  const [activeView, setActiveView] = useState<'calendar' | 'overview'>('calendar');
  // Desktop right panel collapse state (lg+)
  const [rightCollapsed, setRightCollapsed] = useState<boolean>(false);
  // Mobile/Tablet right sheet state (< lg)
  const [rightDrawerOpen, setRightDrawerOpen] = useState<boolean>(false);

  const [shifts, setShifts] = useState<DayShiftData[]>(initialShifts);
  const [summary, setSummary] = useState<SalarySummaryResult>(initialSummary);
  const [config, setConfig] = useState<NurseSalaryConfigData>(initialConfig);
  const [year, setYear] = useState<number>(initialYear);
  const [month, setMonth] = useState<number>(initialMonth);
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();

  // Sync saved right panel state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lr_right_collapsed');
      if (saved === 'true') {
        setRightCollapsed(true);
      }
    } catch {}
  }, []);

  const handleToggleRightPanel = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setRightDrawerOpen((prev) => !prev);
      return;
    }
    if (activeView === 'overview') {
      setActiveView('calendar');
      setRightCollapsed(false);
      try {
        localStorage.setItem('lr_right_collapsed', 'false');
      } catch {}
      return;
    }
    setRightCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('lr_right_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    if (!rightDrawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setRightDrawerOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [rightDrawerOpen]);

  // Refresh summary and shifts for currently active year and month
  const refreshData = useCallback((targetYear = year, targetMonth = month) => {
    startTransition(async () => {
      const updatedSummary = await calculateSalarySummary(targetYear, targetMonth);
      setSummary(updatedSummary);

      const prevM = targetMonth === 1 ? 12 : targetMonth - 1;
      const prevY = targetMonth === 1 ? targetYear - 1 : targetYear;
      const nextM = targetMonth === 12 ? 1 : targetMonth + 1;
      const nextY = targetMonth === 12 ? targetYear + 1 : targetYear;

      const startDate = `${prevY}-${String(prevM).padStart(2, '0')}-01`;
      const endDate = `${nextY}-${String(nextM).padStart(2, '0')}-31`;

      const updatedShifts = await getShiftsByDateRange(startDate, endDate);
      setShifts(updatedShifts);
    });
  }, [year, month]);

  const handleMonthChange = (newYear: number, newMonth: number) => {
    setYear(newYear);
    setMonth(newMonth);
    refreshData(newYear, newMonth);
  };

  const handleConfigSaved = async () => {
    const freshConfig = await getSalaryConfig();
    setConfig(freshConfig);
    refreshData(year, month);
  };

  const showDesktopRight = activeView === 'calendar' && !rightCollapsed;

  const renderRightPanelCards = (onClosePanel?: () => void) => (
    <div className="space-y-3">
      {/* Mobile Drawer Top Bar (shown only when inside mobile slide-over drawer) */}
      {onClosePanel && (
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-[#e8dfdc] bg-white px-3.5 py-2.5 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#f6eaec] text-[#a63e54]">
              <BarChart3 size={15} />
            </span>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-[#1d1d1f] truncate">
                สรุปประจำเดือน {THAI_MONTH_NAMES[month - 1]} {year + 543}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                onClosePanel();
                setActiveView('overview');
              }}
              className="rounded-lg border border-[#e8dfdc] bg-[#faf6f5] px-2.5 py-1 text-[11px] font-semibold text-[#a63e54] hover:bg-[#f3ecea] transition-colors cursor-pointer"
            >
              ขยายเต็มจอ
            </button>
            <button
              type="button"
              onClick={onClosePanel}
              className="rounded-lg p-1.5 text-[#78716c] hover:bg-[#f3ecea] hover:text-[#1d1d1f] transition-colors cursor-pointer"
              title="ปิดแผงสรุปด้านขวา"
              aria-label="ปิดแผงสรุปด้านขวา"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {calendarMode === 'shift' ? (
        <>
          <SalarySummaryCard
            summary={summary}
            onOpenConfig={() => setIsConfigOpen(true)}
            isLoading={isPending}
          />
          <WorkLifeBalanceCard
            shifts={shifts}
            year={year}
            month={month}
            cycleStartDay={config.cycleStartDay}
          />
        </>
      ) : (
        <>
          <HolidaySummaryCard
            shifts={shifts}
            year={year}
            month={month}
          />
          <SalarySummaryCard
            summary={summary}
            onOpenConfig={() => setIsConfigOpen(true)}
            isLoading={isPending}
          />
        </>
      )}
    </div>
  );

  return (
    <div className="pb-6 text-slate-800">
      {/* Main Calendar + Collapsible Right Panel (cards are NEVER stacked underneath the calendar) */}
      <div className="flex items-start">
        <div className="min-w-0 flex-1">
          <ShiftCalendar
            initialShifts={shifts}
            initialYear={year}
            initialMonth={month}
            onShiftUpdated={() => refreshData(year, month)}
            onMonthChange={handleMonthChange}
            calendarMode={calendarMode}
            onModeChange={setCalendarMode}
            activeView={activeView}
            onViewChange={setActiveView}
            rightPanelOpen={showDesktopRight || rightDrawerOpen}
            onToggleRightPanel={handleToggleRightPanel}
          />

          {/* Full Overview Tab (when user clicks "ภาพรวม" in top bar) */}
          {activeView === 'overview' && (
            <div className="space-y-4">
              {/* Overview Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-pink-100 bg-white px-4 py-3 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-500 text-white shadow-2xs">
                    <BarChart3 size={18} />
                  </span>
                  <div>
                    <h2 className="text-sm sm:text-base font-extrabold text-slate-800">
                      ภาพรวมค่าตอบแทน & สมดุลชั่วโมงทำงาน
                    </h2>
                    <p className="text-xs text-slate-400">
                      ประจำเดือน {THAI_MONTH_NAMES[month - 1]} {year + 543} • รอบคำนวณ {summary.windowText}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsConfigOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-pink-200 bg-pink-50/70 hover:bg-pink-100 px-3 py-1.5 text-xs font-bold text-pink-600 transition-colors cursor-pointer"
                  >
                    <Settings size={14} />
                    <span>ตั้งค่าเรทเงินเดือน</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveView('calendar')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-pink-500 hover:bg-pink-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs transition-colors cursor-pointer"
                  >
                    <CalendarDays size={14} />
                    <span>กลับตารางเวร</span>
                  </button>
                </div>
              </div>

              {/* 2-Column Overview Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                <div className="space-y-4">
                  <SalarySummaryCard
                    summary={summary}
                    onOpenConfig={() => setIsConfigOpen(true)}
                    isLoading={isPending}
                  />
                  <HolidaySummaryCard
                    shifts={shifts}
                    year={year}
                    month={month}
                  />
                </div>
                <div>
                  <WorkLifeBalanceCard
                    shifts={shifts}
                    year={year}
                    month={month}
                    cycleStartDay={config.cycleStartDay}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Right Panel (lg+): smooth width expand/collapse without content reflow or flicker */}
        <aside
          className={`hidden lg:block shrink-0 overflow-hidden transition-[width,margin] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            showDesktopRight ? 'w-[368px] ml-4' : 'w-0 ml-0'
          }`}
        >
          <div className="w-[368px]">
            {renderRightPanelCards()}
          </div>
        </aside>
      </div>

      {/* Tablet / Mobile Right Drawer (< lg): smooth slide-over sheet from right */}
      <div
        className={`fixed inset-0 z-[90] lg:hidden transition-opacity duration-300 ${
          rightDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        {...(rightDrawerOpen ? { 'data-scroll-lock': '1024' } : {})}
      >
        <div
          className="absolute inset-0 bg-slate-900/40"
          onClick={() => setRightDrawerOpen(false)}
        />
        <aside
          className={`absolute inset-y-0 right-0 w-[360px] max-w-[92vw] overflow-y-auto bg-[#faf6f5] border-l border-[#e8dfdc] p-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-[max(1rem,env(safe-area-inset-bottom,0px))] rounded-l-2xl shadow-xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            rightDrawerOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {renderRightPanelCards(() => setRightDrawerOpen(false))}
        </aside>
      </div>

      {/* Salary Config Modal */}
      <SalaryConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        initialConfig={config}
        onSaved={handleConfigSaved}
      />
    </div>
  );
}
