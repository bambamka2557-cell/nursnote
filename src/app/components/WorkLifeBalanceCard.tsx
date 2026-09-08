'use client';

import React, { useState, useMemo } from 'react';
import {
  HeartPulse,
  Clock,
  Coffee,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Moon,
  Sun,
  Flame,
  Calendar,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import {
  DayShiftData,
  calculateWorkLifeBalance,
  WorkLifeBalanceResult,
} from '@/app/utils/shiftData';

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
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [mode, setMode] = useState<'cycle' | 'month'>('cycle');

  // Calculate stats based on selected mode
  const stats: WorkLifeBalanceResult = useMemo(() => {
    return calculateWorkLifeBalance(shifts, year, month, cycleStartDay, mode);
  }, [shifts, year, month, cycleStartDay, mode]);

  // Safe percentage calculation for progress bar
  const benchmarkHours = stats.standardBenchmarkHours; // 160 hrs
  const normalHoursClamped = Math.min(stats.normalHours, benchmarkHours);
  const normalPercent = Math.min(100, Math.round((normalHoursClamped / benchmarkHours) * 100));
  const otPercent = Math.min(
    100 - normalPercent,
    Math.round((stats.otHours / benchmarkHours) * 100)
  );

  return (
    <div className="bg-white/95 rounded-2xl sm:rounded-3xl p-3 sm:p-5 md:p-6 shadow-[0_4px_20px_rgba(244,114,182,0.12)] border border-pink-100 transition-all text-slate-800">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-pink-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-pink-500/10 text-pink-600 flex items-center justify-center font-bold">
            <HeartPulse size={18} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-800 flex items-center gap-1.5">
              <span>ชั่วโมงทำงาน & สมดุลชีวิต</span>
              <Sparkles size={14} className="text-pink-500" />
            </h2>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
              <Calendar size={12} className="text-pink-400" />
              <span>{stats.windowText}</span>
            </div>
          </div>
        </div>

        {/* Mode Toggle & Expand/Collapse */}
        <div className="flex items-center gap-1.5">
          {/* Cycle vs Month Mode Toggle */}
          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/80 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setMode('cycle')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                mode === 'cycle'
                  ? 'bg-white text-pink-600 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              รอบจ่าย ({cycleStartDay}→{cycleStartDay - 1})
            </button>
            <button
              type="button"
              onClick={() => setMode('month')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                mode === 'month'
                  ? 'bg-white text-pink-600 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              ทั้งเดือน (1→สิ้นเดือน)
            </button>
          </div>

          {/* Toggle Expand */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-600 transition-colors border border-pink-200/50 cursor-pointer"
            title={isExpanded ? 'ย่อรายละเอียด' : 'ขยายรายละเอียด'}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Main Status & Hours Bar */}
      <div className="mt-3.5 space-y-3">
        {/* Status Indicator Banner */}
        <div
          className={`p-3 sm:p-3.5 rounded-2xl border flex items-center justify-between gap-2.5 transition-all ${stats.statusColor.bg} ${stats.statusColor.border}`}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xl sm:text-2xl">{stats.wellnessTip.icon}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xs sm:text-sm font-black ${stats.statusColor.text}`}>
                  {stats.statusLabel}
                </span>
                <span
                  className={`text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full font-extrabold ${stats.statusColor.badge}`}
                >
                  {stats.hoursPercentageOfBenchmark}% ของเกณฑ์ 160 ชม.
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5">
                {stats.statusDesc}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-xs text-slate-500 block">ทำงานรวม</span>
            <span className="text-base sm:text-xl font-black text-slate-800">
              {stats.totalHours}{' '}
              <span className="text-xs text-slate-500 font-semibold">ชม.</span>
            </span>
          </div>
        </div>

        {/* Working Hours Progress Bar */}
        <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1">
              <Clock size={13} className="text-pink-500" />
              <span>ความคืบหน้าชั่วโมงทำงาน (เกณฑ์ปกติ 160 ชม.)</span>
            </span>
            <span className="text-pink-600 font-black">
              {stats.totalHours} / {benchmarkHours} ชม.
            </span>
          </div>

          {/* Stacked Progress Bar */}
          <div className="w-full h-3 bg-slate-200/80 rounded-full overflow-hidden flex shadow-inner">
            {/* Normal hours (Pink) */}
            <div
              style={{ width: `${normalPercent}%` }}
              className="bg-gradient-to-r from-pink-400 to-pink-500 h-full transition-all duration-500"
              title={`เวรปกติ: ${stats.normalHours} ชม.`}
            />
            {/* OT hours (Rose / Red) */}
            {stats.otHours > 0 && (
              <div
                style={{ width: `${otPercent}%` }}
                className="bg-gradient-to-r from-rose-500 to-red-500 h-full transition-all duration-500"
                title={`เวร OT: ${stats.otHours} ชม.`}
              />
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-pink-500" />
                <span>ปกติ: {stats.normalHours} ชม.</span>
              </span>
              {stats.otHours > 0 && (
                <span className="flex items-center gap-1 text-rose-600 font-bold">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>OT: {stats.otHours} ชม.</span>
                </span>
              )}
            </div>
            <span>
              {stats.totalHours > benchmarkHours ? (
                <span className="text-rose-600 font-bold">
                  +เกินเกณฑ์ {stats.totalHours - benchmarkHours} ชม.
                </span>
              ) : (
                <span>เหลืออีก {benchmarkHours - stats.totalHours} ชม.</span>
              )}
            </span>
          </div>
        </div>

        {/* 4 Quick Stat Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
          {/* Tile 1: Total Working Days */}
          <div className="p-2.5 sm:p-3 rounded-2xl bg-white border border-pink-100 shadow-2xs">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
              <Calendar size={13} className="text-pink-500" />
              <span>ขึ้นเวรจริง</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-lg sm:text-xl font-black text-slate-800">
                {stats.totalWorkedDays}
              </span>
              <span className="text-xs text-slate-400">/ {stats.totalCycleDays} วัน</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
              {stats.totalSubShifts} กะย่อยในรอบนี้
            </span>
          </div>

          {/* Tile 2: Off Days / Rest */}
          <div className="p-2.5 sm:p-3 rounded-2xl bg-white border border-pink-100 shadow-2xs">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
              <Coffee size={13} className="text-emerald-500" />
              <span>วันพักผ่อน</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-lg sm:text-xl font-black text-emerald-600">
                {stats.offDaysCount}
              </span>
              <span className="text-xs text-slate-400">วัน</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
              {stats.offDaysCount >= 8 ? '✅ พักผ่อนเพียงพอ' : '⚠️ วันพักค่อนข้างน้อย'}
            </span>
          </div>

          {/* Tile 3: Double Shift Days (16 hrs) */}
          <div className="p-2.5 sm:p-3 rounded-2xl bg-white border border-pink-100 shadow-2xs">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
              <Flame size={13} className="text-amber-500" />
              <span>เวรควบ 16 ชม.</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span
                className={`text-lg sm:text-xl font-black ${
                  stats.doubleShiftDays >= 4
                    ? 'text-rose-600'
                    : stats.doubleShiftDays >= 2
                    ? 'text-amber-600'
                    : 'text-slate-800'
                }`}
              >
                {stats.doubleShiftDays}
              </span>
              <span className="text-xs text-slate-400">วัน</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
              {stats.doubleShiftDays === 0
                ? 'ไม่มีเวรควบ ยอดเยี่ยม'
                : `ช/บ หรือ บ/ด (${stats.doubleShiftDays * 16} ชม.)`}
            </span>
          </div>

          {/* Tile 4: Night Shifts & Max Streak */}
          <div className="p-2.5 sm:p-3 rounded-2xl bg-white border border-pink-100 shadow-2xs">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
              <Moon size={13} className="text-indigo-500" />
              <span>กะดึกสะสม</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-lg sm:text-xl font-black text-indigo-700">
                {stats.distribution.night.count}
              </span>
              <span className="text-xs text-slate-400">กะ</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
              ติดกันสูงสุด {stats.maxConsecutiveNights} วัน
            </span>
          </div>
        </div>

        {/* Collapsible Deep Details: Shift Breakdown & Nurse Wellness Tip */}
        {isExpanded && (
          <div className="space-y-3 pt-1 border-t border-pink-50 animate-in fade-in-50 duration-200">
            {/* Shift Ratio Bar */}
            <div className="p-3 rounded-2xl bg-white border border-pink-100 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs font-extrabold text-slate-700">
                <span className="flex items-center gap-1">
                  <span>สัดส่วนเวร เช้า 🌸 / บ่าย 🍇 / ดึก 🌙</span>
                </span>
                <span className="text-xs text-slate-500 font-bold">
                  ทำงานติดกันสูงสุด {stats.maxConsecutiveDays} วัน
                </span>
              </div>

              {/* Multi-segment distribution bar */}
              <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-slate-100 shadow-xs">
                {stats.distribution.morning.percentage > 0 && (
                  <div
                    style={{ width: `${stats.distribution.morning.percentage}%` }}
                    className="bg-pink-400 h-full"
                    title={`เวรเช้า: ${stats.distribution.morning.count} กะ (${stats.distribution.morning.hours} ชม.)`}
                  />
                )}
                {stats.distribution.afternoon.percentage > 0 && (
                  <div
                    style={{ width: `${stats.distribution.afternoon.percentage}%` }}
                    className="bg-purple-400 h-full"
                    title={`เวรบ่าย: ${stats.distribution.afternoon.count} กะ (${stats.distribution.afternoon.hours} ชม.)`}
                  />
                )}
                {stats.distribution.night.percentage > 0 && (
                  <div
                    style={{ width: `${stats.distribution.night.percentage}%` }}
                    className="bg-indigo-400 h-full"
                    title={`เวรดึก: ${stats.distribution.night.count} กะ (${stats.distribution.night.hours} ชม.)`}
                  />
                )}
              </div>

              {/* Labels below distribution bar */}
              <div className="grid grid-cols-3 gap-1 text-center text-[11px] pt-0.5">
                <div className="flex items-center justify-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-pink-400" />
                  <span className="font-bold text-slate-700">
                    เช้า: {stats.distribution.morning.count} ({stats.distribution.morning.hours} ชม.)
                  </span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  <span className="font-bold text-slate-700">
                    บ่าย: {stats.distribution.afternoon.count} ({stats.distribution.afternoon.hours} ชม.)
                  </span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  <span className="font-bold text-slate-700">
                    ดึก: {stats.distribution.night.count} ({stats.distribution.night.hours} ชม.)
                  </span>
                </div>
              </div>
            </div>

            {/* Personalized Wellness Tip for Nurse */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-pink-50/70 via-rose-50/50 to-pink-50/70 border border-pink-200/60 flex items-start gap-2.5">
              <span className="text-xl sm:text-2xl mt-0.5">{stats.wellnessTip.icon}</span>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-pink-700">
                  {stats.wellnessTip.title}
                </h4>
                <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed mt-0.5">
                  {stats.wellnessTip.message}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
