'use client';

import { useState, useCallback, useTransition } from 'react';
import ShiftCalendar from '@/app/components/ShiftCalendar';
import WorkLifeBalanceCard from '@/app/components/WorkLifeBalanceCard';
import SalarySummaryCard from '@/app/components/SalarySummaryCard';
import SalaryConfigModal from '@/app/components/SalaryConfigModal';
import HolidaySummaryCard from '@/app/components/HolidaySummaryCard';
import {
  DayShiftData,
  SalarySummaryResult,
  NurseSalaryConfigData,
} from '@/app/utils/shiftData';
import {
  calculateSalarySummary,
  getSalaryConfig,
} from '@/app/actions/salary';
import { getShiftsByDateRange } from '@/app/actions/shift';

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
  const [shifts, setShifts] = useState<DayShiftData[]>(initialShifts);
  const [summary, setSummary] = useState<SalarySummaryResult>(initialSummary);
  const [config, setConfig] = useState<NurseSalaryConfigData>(initialConfig);
  const [year, setYear] = useState<number>(initialYear);
  const [month, setMonth] = useState<number>(initialMonth);
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();

  // Refresh summary and shifts for currently active year and month
  const refreshData = useCallback((targetYear = year, targetMonth = month) => {
    startTransition(async () => {
      // 1. Fetch updated summary for the cycle of this month
      const updatedSummary = await calculateSalarySummary(targetYear, targetMonth);
      setSummary(updatedSummary);

      // 2. Fetch shifts for the wider calendar grid view (from prev month to next month)
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

  // When user navigates calendar month
  const handleMonthChange = (newYear: number, newMonth: number) => {
    setYear(newYear);
    setMonth(newMonth);
    refreshData(newYear, newMonth);
  };

  // When config is saved in modal
  const handleConfigSaved = async () => {
    const freshConfig = await getSalaryConfig();
    setConfig(freshConfig);
    refreshData(year, month);
  };

  return (
    <div className="pb-8 text-slate-800">
      {/* SunNotes 2-column layout on xl+: Calendar (center) + Summary cards (right panel) */}
      <div className="flex flex-col xl:flex-row xl:items-start gap-4">
        {/* Main Calendar Area */}
        <div className="min-w-0 flex-1">
          <ShiftCalendar
            initialShifts={shifts}
            initialYear={year}
            initialMonth={month}
            onShiftUpdated={() => refreshData(year, month)}
            onMonthChange={handleMonthChange}
            calendarMode={calendarMode}
            onModeChange={setCalendarMode}
          />
        </div>

        {/* Right Panel (370px on xl+, stacked below calendar on < xl) */}
        <aside className="w-full xl:w-[370px] xl:shrink-0 space-y-4">
          {calendarMode === 'shift' ? (
            <>
              {/* Salary Summary Card */}
              <SalarySummaryCard
                summary={summary}
                onOpenConfig={() => setIsConfigOpen(true)}
                isLoading={isPending}
              />

              {/* Work-Life Balance & Working Hours Statistics */}
              <WorkLifeBalanceCard
                shifts={shifts}
                year={year}
                month={month}
                cycleStartDay={config.cycleStartDay}
              />
            </>
          ) : (
            /* Monthly Holiday Summary & Cross-Check Card */
            <HolidaySummaryCard
              shifts={shifts}
              year={year}
              month={month}
            />
          )}
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
