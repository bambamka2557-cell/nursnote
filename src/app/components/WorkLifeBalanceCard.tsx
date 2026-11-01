'use client';

import React, { useState, useMemo } from 'react';
import {
  HeartPulse,
  Clock,
  ChevronDown,
  ChevronUp,
  Calendar,
} from 'lucide-react';
import {
  DayShiftData,
  calculateWorkLifeBalance,
  WorkLifeBalanceResult,
} from '@/app/utils/shiftData';
import { WellnessThemeIcon } from './ThemeIcons';

interface WorkLifeBalanceCardProps {
  shifts: DayShiftData[];
  year: number;
  month: number;
  cycleStartDay?: number;
}

export default function WorkLifeBalanceCard({
  shifts,
  year,
  month,
  cycleStartDay = 26,
}: WorkLifeBalanceCardProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [mode, setMode] = useState<'cycle' | 'month'>('cycle');

  const stats: WorkLifeBalanceResult = useMemo(() => {
    return calculateWorkLifeBalance(shifts, year, month, cycleStartDay, mode);
  }, [shifts, year, month, cycleStartDay, mode]);

  const benchmarkHours = stats.standardBenchmarkHours; // 160 hrs
  const normalHoursClamped = Math.min(stats.normalHours, benchmarkHours);
  const normalPercent = Math.min(100, Math.round((normalHoursClamped / benchmarkHours) * 100));
  const otPercent = Math.min(
    100 - normalPercent,
    Math.round((stats.otHours / benchmarkHours) * 100)
  );

  return (
    <div className="bg-white rounded-2xl p-4 shadow-2xs border border-[#ece7dd] transition-all text-[#1d1d1f]">
      {/* Top Header (SunNotes Right-Panel Card Header Style with Vibrant Icon Chip) */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#10b981] text-white shadow-2xs">
            <HeartPulse size={16} />
          </span>
          <div className="min-w-0">
            <div className="text-sm font-bold text-[#1d1d1f] truncate">
              ชั่วโมงทำงาน & สมดุลชีวิต
            </div>
            <div className="flex items-center gap-1 text-[11px] text-[#6e6e73] font-medium">
              <Calendar size={11} className="text-[#10b981] shrink-0" />
              <span className="truncate">{stats.windowText}</span>
            </div>
          </div>
        </div>

        {/* Mode Toggle & Expand/Collapse */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="flex bg-[#efece4] p-0.5 rounded-xl border border-[#ece7dd] text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setMode('cycle')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                mode === 'cycle'
                  ? 'bg-white text-[#ec4899] shadow-2xs'
                  : 'text-[#6e6e73] hover:text-[#1d1d1f]'
              }`}
              title={`คิดตามรอบจ่าย (${cycleStartDay}→${cycleStartDay - 1})`}
            >
              รอบจ่าย
            </button>
            <button
              type="button"
              onClick={() => setMode('month')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                mode === 'month'
                  ? 'bg-white text-[#ec4899] shadow-2xs'
                  : 'text-[#6e6e73] hover:text-[#1d1d1f]'
              }`}
              title="คิดทั้งเดือนปฏิทิน (1→สิ้นเดือน)"
            >
              ทั้งเดือน
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl bg-[#faf8f4] hover:bg-[#efece4] text-[#6e6e73] transition-colors border border-[#ece7dd] cursor-pointer"
            title={isExpanded ? 'ย่อรายละเอียด' : 'ดูรายละเอียดสัดส่วนเวร'}
          >
            {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* 3 SunNotes-Style StatTiles (Fresh Luminous Tints + Vibrant Numbers) */}
      <div className="grid grid-cols-3 gap-2 mt-3 text-center">
        {/* Tile 1: Total Hours */}
        <div className="rounded-xl border border-[#fbcfe8] bg-[#fdf2f8] px-2 py-2.5">
          <div className="text-base font-extrabold text-[#ec4899] leading-tight">
            {stats.totalHours} <span className="text-[11px] font-semibold">ชม.</span>
          </div>
          <div className="mt-0.5 text-[11px] font-bold text-[#1d1d1f]">
            ชั่วโมงรวม
          </div>
          <div className="text-[9px] text-[#6e6e73] font-medium mt-0.5 truncate">
            {stats.hoursPercentageOfBenchmark}% ของเกณฑ์
          </div>
        </div>

        {/* Tile 2: Worked Days */}
        <div className="rounded-xl border border-[#fde68a] bg-[#fffbeb] px-2 py-2.5">
          <div className="text-base font-extrabold text-[#d99a00] leading-tight">
            {stats.totalWorkedDays} <span className="text-[11px] font-semibold">วัน</span>
          </div>
          <div className="mt-0.5 text-[11px] font-bold text-[#1d1d1f]">
            ขึ้นเวรจริง
          </div>
          <div className="text-[9px] text-[#6e6e73] font-medium mt-0.5 truncate">
            เวรควบ {stats.doubleShiftDays} วัน
          </div>
        </div>

        {/* Tile 3: Off Days */}
        <div className="rounded-xl border border-[#a7f3d0] bg-[#ecfdf5] px-2 py-2.5">
          <div className="text-base font-extrabold text-[#10b981] leading-tight">
            {stats.offDaysCount} <span className="text-[11px] font-semibold">วัน</span>
          </div>
          <div className="mt-0.5 text-[11px] font-bold text-[#1d1d1f]">
            วันพักผ่อน
          </div>
          <div className="text-[9px] text-[#059669] font-semibold mt-0.5 truncate">
            {stats.offDaysCount >= 8 ? 'พักผ่อนเพียงพอ' : 'วันพักน้อย'}
          </div>
        </div>
      </div>

      {/* Compact Working Hours Progress Bar */}
      <div className="mt-2.5 p-3 bg-[#faf8f4] rounded-xl border border-[#ece7dd] space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-semibold text-[#6e6e73]">
          <span className="flex items-center gap-1">
            <Clock size={12} className="text-[#ec4899]" />
            <span>เกณฑ์เวลาทำงานปกติ ({benchmarkHours} ชม.)</span>
          </span>
          <span className="text-[#ec4899] font-bold">
            {stats.totalHours} / {benchmarkHours} ชม.
          </span>
        </div>

        <div className="w-full h-2 bg-[#ece7dd] rounded-full overflow-hidden flex">
          <div
            style={{ width: `${normalPercent}%` }}
            className="bg-[#ec4899] h-full transition-all duration-500"
            title={`เวรปกติ: ${stats.normalHours} ชม.`}
          />
          {stats.otHours > 0 && (
            <div
              style={{ width: `${otPercent}%` }}
              className="bg-[#f43f5e] h-full transition-all duration-500"
              title={`เวร OT: ${stats.otHours} ชม.`}
            />
          )}
        </div>

        <div className="flex items-center justify-between text-[10px] text-[#6e6e73]">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ec4899]" />
              <span>ปกติ {stats.normalHours} ชม.</span>
            </span>
            {stats.otHours > 0 && (
              <span className="flex items-center gap-1 text-[#e11d48] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f43f5e]" />
                <span>OT {stats.otHours} ชม.</span>
              </span>
            )}
          </div>
          <span>
            {stats.totalHours > benchmarkHours ? (
              <span className="text-[#e11d48] font-semibold">
                +เกินเกณฑ์ {stats.totalHours - benchmarkHours} ชม.
              </span>
            ) : (
              <span>เหลืออีก {benchmarkHours - stats.totalHours} ชม.</span>
            )}
          </span>
        </div>
      </div>

      {/* Status & Wellness Summary Row */}
      <div className="mt-2.5 p-2.5 rounded-xl bg-[#faf8f4] border border-[#ece7dd] flex items-start gap-2">
        <WellnessThemeIcon iconKey={stats.wellnessTip.icon} size={15} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-bold text-[#1d1d1f] truncate">
              {stats.statusLabel}
            </span>
            <span className="text-[10px] text-[#6e6e73] font-medium shrink-0">
              ติดกันสูงสุด {stats.maxConsecutiveDays} วัน
            </span>
          </div>
          <p className="text-[11px] text-[#6e6e73] leading-snug mt-0.5">
            {stats.wellnessTip.message}
          </p>
        </div>
      </div>

      {/* Expandable Deep Shift Distribution Breakdown */}
      {isExpanded && (
        <div className="mt-2.5 pt-2.5 border-t border-[#ece7dd] space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-[11px] font-semibold text-[#6e6e73]">
            <span>สัดส่วนชั่วโมง เช้า / บ่าย / ดึก</span>
            <span>กะดึกติดกันสูงสุด {stats.maxConsecutiveNights} วัน</span>
          </div>

          <div className="w-full h-2 rounded-full overflow-hidden flex bg-[#ece7dd]">
            {stats.distribution.morning.percentage > 0 && (
              <div
                style={{ width: `${stats.distribution.morning.percentage}%` }}
                className="bg-[#ec4899] h-full"
              />
            )}
            {stats.distribution.afternoon.percentage > 0 && (
              <div
                style={{ width: `${stats.distribution.afternoon.percentage}%` }}
                className="bg-[#8b5cf6] h-full"
              />
            )}
            {stats.distribution.night.percentage > 0 && (
              <div
                style={{ width: `${stats.distribution.night.percentage}%` }}
                className="bg-[#4f46e5] h-full"
              />
            )}
          </div>

          <div className="grid grid-cols-3 gap-1 text-center text-[10px] text-[#6e6e73]">
            <div className="flex items-center justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#ec4899]" />
              <span>เช้า {stats.distribution.morning.hours} ชม.</span>
            </div>
            <div className="flex items-center justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#8b5cf6]" />
              <span>บ่าย {stats.distribution.afternoon.hours} ชม.</span>
            </div>
            <div className="flex items-center justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#4f46e5]" />
              <span>ดึก {stats.distribution.night.hours} ชม.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
