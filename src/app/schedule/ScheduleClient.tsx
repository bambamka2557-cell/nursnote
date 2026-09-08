'use client';

import { useState, useCallback, useTransition } from 'react';
import ShiftCalendar from '@/app/components/ShiftCalendar';
import SalarySummaryCard from '@/app/components/SalarySummaryCard';
import SalaryConfigModal from '@/app/components/SalaryConfigModal';
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
import { Sparkles, CalendarDays } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-b from-pink-50/50 via-white to-pink-50/30 pb-24 md:pb-12 text-slate-800">
      {/* Page Header Banner */}
      <div className="px-4 md:px-8 pt-4 pb-2 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 flex items-center justify-center text-white shadow-sm shadow-pink-200">
              <CalendarDays size={22} />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black text-slate-900 flex items-center gap-1.5">
                <span>ตารางเวร & คำนวณเงินเดือน</span>
                <Sparkles size={16} className="text-pink-500" />
              </h1>
              <p className="text-xs text-slate-400">
                ระบบบันทึกเวรพยาบาลห้องคลอด สไตล์ Hello Kitty พาสเทล
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="px-3 sm:px-4 md:px-8 max-w-5xl mx-auto space-y-4 md:space-y-6 mt-2">
        {/* Shift Calendar */}
        <ShiftCalendar
          initialShifts={shifts}
          initialYear={year}
          initialMonth={month}
          onShiftUpdated={() => refreshData(year, month)}
          onMonthChange={handleMonthChange}
        />

        {/* Salary Summary Card */}
        <SalarySummaryCard
          summary={summary}
          onOpenConfig={() => setIsConfigOpen(true)}
          isLoading={isPending}
        />
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
