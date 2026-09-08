import {
  calculateSalarySummary,
  getSalaryConfig,
} from '@/app/actions/salary';
import { getCurrentBangkokCycle } from '@/app/utils/shiftData';
import { getShiftsByDateRange } from '@/app/actions/shift';
import ScheduleClient from './ScheduleClient';

export const dynamic = 'force-dynamic';

export default async function SchedulePage() {
  const config = await getSalaryConfig();
  const { year, month } = getCurrentBangkokCycle(config.cycleStartDay);

  // Initial salary summary for current Bangkok cycle
  const initialSummary = await calculateSalarySummary(year, month);

  // Initial shifts range: covers prev month to next month for the calendar grid
  const prevM = month === 1 ? 12 : month - 1;
  const prevY = month === 1 ? year - 1 : year;
  const nextM = month === 12 ? 1 : month + 1;
  const nextY = month === 12 ? year + 1 : year;

  const startDate = `${prevY}-${String(prevM).padStart(2, '0')}-01`;
  const endDate = `${nextY}-${String(nextM).padStart(2, '0')}-31`;

  const initialShifts = await getShiftsByDateRange(startDate, endDate);

  return (
    <ScheduleClient
      initialShifts={initialShifts}
      initialSummary={initialSummary}
      initialConfig={config}
      initialYear={year}
      initialMonth={month}
    />
  );
}
