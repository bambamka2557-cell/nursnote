'use client';

import { useState, useEffect } from 'react';
import { SalarySummaryResult } from '@/app/utils/shiftData';
import {
  Eye,
  EyeOff,
  Settings,
  ChevronDown,
  ChevronUp,
  Wallet,
  TrendingUp,
  TrendingDown,
  Calendar,
} from 'lucide-react';

interface SalarySummaryCardProps {
  summary: SalarySummaryResult;
  onOpenConfig: () => void;
  isLoading?: boolean;
}

export default function SalarySummaryCard({
  summary,
  onOpenConfig,
  isLoading = false,
}: SalarySummaryCardProps) {
  const [privacyHidden, setPrivacyHidden] = useState<boolean>(true);
  const [showBreakdown, setShowBreakdown] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('lr_salary_privacy_hidden');
    if (stored !== null) {
      setPrivacyHidden(stored === 'true');
    }
  }, []);

  const togglePrivacy = () => {
    const next = !privacyHidden;
    setPrivacyHidden(next);
    localStorage.setItem('lr_salary_privacy_hidden', String(next));
  };

  const formatMoney = (amount: number): string => {
    if (!mounted || privacyHidden) {
      return '••••••';
    }
    return amount.toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const { breakdown, shiftCounts, windowText } = summary;

  return (
    <div className="bg-white/95 rounded-2xl sm:rounded-3xl p-3 sm:p-4 md:p-5 shadow-[0_4px_20px_rgba(244,114,182,0.12)] border border-pink-100 transition-all text-slate-800">
      {/* Top Bar: Title & Actions */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-pink-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-pink-500/10 text-pink-600 flex items-center justify-center font-bold">
            <Wallet size={18} />
          </div>
          <div>
            <h2 className="text-sm md:text-base font-extrabold text-slate-800 flex items-center gap-1.5">
              <span>สรุปค่าตอบแทนรอบนี้</span>
            </h2>
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
              <Calendar size={12} className="text-pink-400" />
              <span>{windowText}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Privacy Toggle Button */}
          <button
            onClick={togglePrivacy}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              privacyHidden
                ? 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'
                : 'bg-pink-50 border-pink-200 text-pink-600'
            }`}
            title={privacyHidden ? 'แสดงตัวเลขเงิน' : 'ซ่อนตัวเลขเงิน (Privacy)'}
          >
            {privacyHidden ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>

          {/* Config Settings Button */}
          <button
            onClick={onOpenConfig}
            className="p-2 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 border border-pink-100 transition-all cursor-pointer"
            title="ตั้งค่าอัตราค่าตอบแทน"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Main Highlights Card */}
      <div className="mt-3.5 p-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white shadow-md relative overflow-hidden">
        {/* Kitty background glow accent */}
        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />

        <div className="flex justify-between items-start">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-pink-100 font-bold block">
              รายรับสุทธิ (Net Income)
            </span>
            <div className="text-2xl md:text-3xl font-black mt-0.5 tracking-tight flex items-baseline gap-1">
              <span className="text-base md:text-lg font-bold">฿</span>
              <span>{isLoading ? '...' : formatMoney(breakdown.netIncome)}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold">
              ขึ้น {shiftCounts.totalWorkedDays} วัน ({shiftCounts.totalShifts} เวรย่อย)
            </span>
          </div>
        </div>

        {/* Mini stats inside banner */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/15 text-[11px]">
          <div className="flex items-center gap-1.5">
            <TrendingUp size={13} className="text-emerald-200" />
            <span className="text-pink-100">รวมรายรับ:</span>
            <span className="font-bold">{formatMoney(breakdown.totalIncome)}</span>
          </div>
          <div className="flex items-center gap-1.5 justify-end">
            <TrendingDown size={13} className="text-rose-200" />
            <span className="text-pink-100">รวมหัก:</span>
            <span className="font-bold">{formatMoney(breakdown.totalDeductions)}</span>
          </div>
        </div>
      </div>

      {/* Quick Shift Counter Chips */}
      <div className="grid grid-cols-3 gap-2 mt-3 text-center">
        <div className="bg-pink-50/70 border border-pink-100 p-2 rounded-xl">
          <span className="text-[10px] text-pink-600 font-extrabold block">🌸 เช้า (ช)</span>
          <span className="text-xs font-black text-slate-800">
            {shiftCounts.MORNING.totalCount}{' '}
            <span className="text-[9px] font-medium text-slate-400">
              (ปกติ {shiftCounts.MORNING.normalCount} / OT {shiftCounts.MORNING.otCount})
            </span>
          </span>
        </div>
        <div className="bg-purple-50/70 border border-purple-100 p-2 rounded-xl">
          <span className="text-[10px] text-purple-600 font-extrabold block">🍇 บ่าย (บ)</span>
          <span className="text-xs font-black text-slate-800">
            {shiftCounts.AFTERNOON.totalCount}{' '}
            <span className="text-[9px] font-medium text-slate-400">
              (ปกติ {shiftCounts.AFTERNOON.normalCount} / OT {shiftCounts.AFTERNOON.otCount})
            </span>
          </span>
        </div>
        <div className="bg-indigo-50/70 border border-indigo-100 p-2 rounded-xl">
          <span className="text-[10px] text-indigo-600 font-extrabold block">🌙 ดึก (ด)</span>
          <span className="text-xs font-black text-slate-800">
            {shiftCounts.NIGHT.totalCount}{' '}
            <span className="text-[9px] font-medium text-slate-400">
              (ปกติ {shiftCounts.NIGHT.normalCount} / OT {shiftCounts.NIGHT.otCount})
            </span>
          </span>
        </div>
      </div>

      {/* Breakdown Toggle Accordion */}
      <div className="mt-3 border-t border-slate-100 pt-2">
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="w-full flex items-center justify-between py-1 px-2 text-[11px] font-bold text-slate-500 hover:text-pink-600 transition-colors cursor-pointer"
        >
          <span>ดูรายละเอียดแจกแจงรายรับ & รายหัก</span>
          {showBreakdown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showBreakdown && (
          <div className="mt-2 space-y-3 p-3 bg-slate-50/70 rounded-2xl border border-slate-100 text-xs animate-in fade-in duration-150">
            {/* รายรับ */}
            <div>
              <span className="text-[11px] font-black text-emerald-600 flex items-center gap-1 mb-1.5">
                <TrendingUp size={12} />
                <span>รายการรายรับ (Earnings)</span>
              </span>
              <div className="space-y-1 text-slate-600 pl-1">
                <div className="flex justify-between">
                  <span>เงินเดือนพื้นฐาน</span>
                  <span className="font-bold text-slate-800">฿{formatMoney(breakdown.baseSalary)}</span>
                </div>
                <div className="flex justify-between">
                  <span>ค่าเวร & OT (ตามจำนวนเวรที่ขึ้น)</span>
                  <span className="font-bold text-pink-600">฿{formatMoney(breakdown.totalShiftAllowance)}</span>
                </div>
                {breakdown.ptsAllowance > 0 && (
                  <div className="flex justify-between">
                    <span>ค่า พ.ต.ส. (วิชาชีพ)</span>
                    <span className="font-bold text-slate-800">฿{formatMoney(breakdown.ptsAllowance)}</span>
                  </div>
                )}
                {breakdown.noPrivatePractice > 0 && (
                  <div className="flex justify-between">
                    <span>ไม่ทำเวชปฏิบัติส่วนตัว / ฉ.11</span>
                    <span className="font-bold text-slate-800">฿{formatMoney(breakdown.noPrivatePractice)}</span>
                  </div>
                )}
                {breakdown.inChargeAllowance > 0 && (
                  <div className="flex justify-between">
                    <span>ค่าหัวหน้าเวร / ตรวจการ</span>
                    <span className="font-bold text-slate-800">฿{formatMoney(breakdown.inChargeAllowance)}</span>
                  </div>
                )}
                {breakdown.otherAllowance > 0 && (
                  <div className="flex justify-between">
                    <span>ค่าตอบแทนพิเศษอื่นๆ</span>
                    <span className="font-bold text-slate-800">฿{formatMoney(breakdown.otherAllowance)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-slate-800">
                  <span>รวมรายรับทั้งสิ้น</span>
                  <span className="text-emerald-600">฿{formatMoney(breakdown.totalIncome)}</span>
                </div>
              </div>
            </div>

            {/* รายหัก */}
            {breakdown.totalDeductions > 0 && (
              <div className="pt-2 border-t border-slate-200/60">
                <span className="text-[11px] font-black text-rose-600 flex items-center gap-1 mb-1.5">
                  <TrendingDown size={12} />
                  <span>รายการหัก (Deductions)</span>
                </span>
                <div className="space-y-1 text-slate-600 pl-1">
                  {breakdown.taxDeduction > 0 && (
                    <div className="flex justify-between">
                      <span>ภาษี ณ ที่จ่าย</span>
                      <span className="font-bold text-rose-600">-฿{formatMoney(breakdown.taxDeduction)}</span>
                    </div>
                  )}
                  {breakdown.socialSecurity > 0 && (
                    <div className="flex justify-between">
                      <span>ประกันสังคม</span>
                      <span className="font-bold text-rose-600">-฿{formatMoney(breakdown.socialSecurity)}</span>
                    </div>
                  )}
                  {breakdown.providentFund > 0 && (
                    <div className="flex justify-between">
                      <span>กบข.</span>
                      <span className="font-bold text-rose-600">-฿{formatMoney(breakdown.providentFund)}</span>
                    </div>
                  )}
                  {breakdown.coopDeduction > 0 && (
                    <div className="flex justify-between">
                      <span>สหกรณ์</span>
                      <span className="font-bold text-rose-600">-฿{formatMoney(breakdown.coopDeduction)}</span>
                    </div>
                  )}
                  {breakdown.otherDeduction > 0 && (
                    <div className="flex justify-between">
                      <span>หักอื่นๆ</span>
                      <span className="font-bold text-rose-600">-฿{formatMoney(breakdown.otherDeduction)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-slate-800">
                    <span>รวมรายหักทั้งสิ้น</span>
                    <span className="text-rose-600">-฿{formatMoney(breakdown.totalDeductions)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
