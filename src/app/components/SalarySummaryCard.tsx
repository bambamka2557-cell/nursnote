'use client';

import { useState, useEffect } from 'react';
import { SalarySummaryResult } from '@/app/utils/shiftData';
import { ShiftAtomicIcon } from './ThemeIcons';
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
    <div className="bg-white rounded-2xl p-4 shadow-2xs border border-[#ece7dd] transition-all text-[#1d1d1f]">
      {/* Top Bar: Title & Actions (SunNotes Right-Panel Card Header Style with Vibrant Icon Chip) */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#ec4899] text-white shadow-2xs">
            <Wallet size={16} />
          </span>
          <div className="min-w-0">
            <div className="text-sm font-bold text-[#1d1d1f] truncate">
              สรุปค่าตอบแทนรอบนี้
            </div>
            <div className="flex items-center gap-1 text-[11px] text-[#6e6e73] font-medium">
              <Calendar size={11} className="text-[#ec4899] shrink-0" />
              <span className="truncate">{windowText}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Privacy Toggle Button */}
          <button
            type="button"
            onClick={togglePrivacy}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
              privacyHidden
                ? 'bg-[#faf8f4] border-[#ece7dd] text-[#6e6e73] hover:text-[#1d1d1f]'
                : 'bg-[#fdf2f8] border-[#fbcfe8] text-[#ec4899]'
            }`}
            title={privacyHidden ? 'แสดงตัวเลขเงิน' : 'ซ่อนตัวเลขเงิน (Privacy)'}
          >
            {privacyHidden ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>

          {/* Config Settings Button */}
          <button
            type="button"
            onClick={onOpenConfig}
            className="p-1.5 rounded-xl bg-[#faf8f4] hover:bg-[#efece4] text-[#6e6e73] border border-[#ece7dd] transition-all cursor-pointer"
            title="ตั้งค่าอัตราค่าตอบแทน"
          >
            <Settings size={15} />
          </button>
        </div>
      </div>

      {/* Fresh Luminous Net Income Box */}
      <div className="mt-3 p-3.5 rounded-xl bg-[#fdf2f8]/85 border border-[#fbcfe8]">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[11px] text-[#be185d] font-semibold block">
              รายรับสุทธิ (Net Income)
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-[#db2777] mt-0.5 tracking-tight flex items-baseline gap-1">
              <span className="text-sm sm:text-base font-bold">฿</span>
              <span>{isLoading ? '...' : formatMoney(breakdown.netIncome)}</span>
            </div>
          </div>
          <span className="text-[10px] bg-white text-[#db2777] border border-[#fbcfe8] px-2 py-0.5 rounded-full font-bold shrink-0">
            {shiftCounts.totalWorkedDays} วัน • {shiftCounts.totalShifts} เวรย่อย
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2.5 border-t border-[#fbcfe8]/80 text-[11px] text-[#6e6e73]">
          <div className="flex items-center gap-1 min-w-0">
            <TrendingUp size={12} className="text-[#10b981] shrink-0" />
            <span>รายรับ:</span>
            <span className="font-bold text-[#1d1d1f] truncate">{formatMoney(breakdown.totalIncome)}</span>
          </div>
          <div className="flex items-center gap-1 justify-end min-w-0">
            <TrendingDown size={12} className="text-[#f43f5e] shrink-0" />
            <span>หัก:</span>
            <span className="font-bold text-[#1d1d1f] truncate">{formatMoney(breakdown.totalDeductions)}</span>
          </div>
        </div>
      </div>

      {/* 3 SunNotes-Style StatTiles for Morning / Afternoon / Night */}
      <div className="grid grid-cols-3 gap-2 mt-2.5 text-center">
        <div className="rounded-xl border border-[#fbcfe8] bg-[#fdf2f8] px-2 py-2.5">
          <div className="text-base font-extrabold text-[#ec4899] leading-tight">
            {shiftCounts.MORNING.totalCount}
          </div>
          <div className="mt-0.5 text-[11px] font-bold text-[#1d1d1f] flex items-center justify-center gap-0.5">
            <ShiftAtomicIcon code="MORNING" size={10} />
            <span>เช้า (ช)</span>
          </div>
          <div className="text-[9px] text-[#6e6e73] font-medium mt-0.5">
            ปกติ {shiftCounts.MORNING.normalCount} • OT {shiftCounts.MORNING.otCount}
          </div>
        </div>

        <div className="rounded-xl border border-[#ddd6fe] bg-[#f5f3ff] px-2 py-2.5">
          <div className="text-base font-extrabold text-[#8b5cf6] leading-tight">
            {shiftCounts.AFTERNOON.totalCount}
          </div>
          <div className="mt-0.5 text-[11px] font-bold text-[#1d1d1f] flex items-center justify-center gap-0.5">
            <ShiftAtomicIcon code="AFTERNOON" size={10} />
            <span>บ่าย (บ)</span>
          </div>
          <div className="text-[9px] text-[#6e6e73] font-medium mt-0.5">
            ปกติ {shiftCounts.AFTERNOON.normalCount} • OT {shiftCounts.AFTERNOON.otCount}
          </div>
        </div>

        <div className="rounded-xl border border-[#c7d2fe] bg-[#eef2ff] px-2 py-2.5">
          <div className="text-base font-extrabold text-[#4f46e5] leading-tight">
            {shiftCounts.NIGHT.totalCount}
          </div>
          <div className="mt-0.5 text-[11px] font-bold text-[#1d1d1f] flex items-center justify-center gap-0.5">
            <ShiftAtomicIcon code="NIGHT" size={10} />
            <span>ดึก (ด)</span>
          </div>
          <div className="text-[9px] text-[#6e6e73] font-medium mt-0.5">
            ปกติ {shiftCounts.NIGHT.normalCount} • OT {shiftCounts.NIGHT.otCount}
          </div>
        </div>
      </div>

      {/* Breakdown Toggle Accordion */}
      <div className="mt-2.5 border-t border-[#ece7dd] pt-2">
        <button
          type="button"
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="w-full flex items-center justify-between py-1 px-1 text-[11px] font-semibold text-[#6e6e73] hover:text-[#ec4899] transition-colors cursor-pointer"
        >
          <span>ดูรายละเอียดแจกแจงรายรับ & รายหัก</span>
          {showBreakdown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showBreakdown && (
          <div className="mt-2 space-y-3 p-3 bg-[#faf8f4] rounded-xl border border-[#ece7dd] text-xs animate-in fade-in duration-150">
            {/* รายรับ */}
            <div>
              <span className="text-[11px] font-bold text-[#10b981] flex items-center gap-1 mb-1.5">
                <TrendingUp size={12} />
                <span>รายการรายรับ (Earnings)</span>
              </span>
              <div className="space-y-1 text-[#6e6e73] pl-1">
                <div className="flex justify-between">
                  <span>เงินเดือนพื้นฐาน</span>
                  <span className="font-bold text-[#1d1d1f]">฿{formatMoney(breakdown.baseSalary)}</span>
                </div>
                <div className="flex justify-between">
                  <span>ค่าเวร & OT (ตามจำนวนเวรที่ขึ้น)</span>
                  <span className="font-bold text-[#ec4899]">฿{formatMoney(breakdown.totalShiftAllowance)}</span>
                </div>
                {breakdown.ptsAllowance > 0 && (
                  <div className="flex justify-between">
                    <span>ค่า พ.ต.ส. (วิชาชีพ)</span>
                    <span className="font-bold text-[#1d1d1f]">฿{formatMoney(breakdown.ptsAllowance)}</span>
                  </div>
                )}
                {breakdown.noPrivatePractice > 0 && (
                  <div className="flex justify-between">
                    <span>ไม่ทำเวชปฏิบัติส่วนตัว / ฉ.11</span>
                    <span className="font-bold text-[#1d1d1f]">฿{formatMoney(breakdown.noPrivatePractice)}</span>
                  </div>
                )}
                {breakdown.inChargeAllowance > 0 && (
                  <div className="flex justify-between">
                    <span>ค่าหัวหน้าเวร / ตรวจการ</span>
                    <span className="font-bold text-[#1d1d1f]">฿{formatMoney(breakdown.inChargeAllowance)}</span>
                  </div>
                )}
                {breakdown.otherAllowance > 0 && (
                  <div className="flex justify-between">
                    <span>ค่าตอบแทนพิเศษอื่นๆ</span>
                    <span className="font-bold text-[#1d1d1f]">฿{formatMoney(breakdown.otherAllowance)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-[#ece7dd] font-bold text-[#1d1d1f]">
                  <span>รวมรายรับทั้งสิ้น</span>
                  <span className="text-[#10b981]">฿{formatMoney(breakdown.totalIncome)}</span>
                </div>
              </div>
            </div>

            {/* รายหัก */}
            {breakdown.totalDeductions > 0 && (
              <div className="pt-2 border-t border-[#ece7dd]">
                <span className="text-[11px] font-bold text-[#e11d48] flex items-center gap-1 mb-1.5">
                  <TrendingDown size={12} />
                  <span>รายการหัก (Deductions)</span>
                </span>
                <div className="space-y-1 text-[#6e6e73] pl-1">
                  {breakdown.taxDeduction > 0 && (
                    <div className="flex justify-between">
                      <span>ภาษี ณ ที่จ่าย</span>
                      <span className="font-bold text-[#e11d48]">-฿{formatMoney(breakdown.taxDeduction)}</span>
                    </div>
                  )}
                  {breakdown.socialSecurity > 0 && (
                    <div className="flex justify-between">
                      <span>ประกันสังคม</span>
                      <span className="font-bold text-[#e11d48]">-฿{formatMoney(breakdown.socialSecurity)}</span>
                    </div>
                  )}
                  {breakdown.providentFund > 0 && (
                    <div className="flex justify-between">
                      <span>กบข.</span>
                      <span className="font-bold text-[#e11d48]">-฿{formatMoney(breakdown.providentFund)}</span>
                    </div>
                  )}
                  {breakdown.coopDeduction > 0 && (
                    <div className="flex justify-between">
                      <span>สหกรณ์</span>
                      <span className="font-bold text-[#e11d48]">-฿{formatMoney(breakdown.coopDeduction)}</span>
                    </div>
                  )}
                  {breakdown.otherDeduction > 0 && (
                    <div className="flex justify-between">
                      <span>หักอื่นๆ</span>
                      <span className="font-bold text-[#e11d48]">-฿{formatMoney(breakdown.otherDeduction)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 border-t border-[#ece7dd] font-bold text-[#1d1d1f]">
                    <span>รวมรายหักทั้งสิ้น</span>
                    <span className="text-[#e11d48]">-฿{formatMoney(breakdown.totalDeductions)}</span>
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
