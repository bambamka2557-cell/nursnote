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
    <div className="bg-white rounded-2xl p-4 shadow-2xs border border-[#e8dfdc] transition-all text-[#1d1d1f]">
      {/* Top Bar: Title & Actions (SunNotes Right-Panel Card Header Style) */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-sm font-bold text-[#1d1d1f]">
            <Wallet size={15} className="text-[#a63e54] shrink-0" />
            <span className="truncate">สรุปค่าตอบแทนรอบนี้</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[#78716c] font-medium mt-0.5">
            <Calendar size={11} className="text-[#a63e54]/80 shrink-0" />
            <span className="truncate">{windowText}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Privacy Toggle Button */}
          <button
            type="button"
            onClick={togglePrivacy}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
              privacyHidden
                ? 'bg-[#faf6f5] border-[#e8dfdc] text-[#78716c] hover:text-[#1d1d1f]'
                : 'bg-[#f6eaec] border-[#d6c5c1] text-[#a63e54]'
            }`}
            title={privacyHidden ? 'แสดงตัวเลขเงิน' : 'ซ่อนตัวเลขเงิน (Privacy)'}
          >
            {privacyHidden ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>

          {/* Config Settings Button */}
          <button
            type="button"
            onClick={onOpenConfig}
            className="p-1.5 rounded-xl bg-[#faf6f5] hover:bg-[#f3ecea] text-[#57534e] border border-[#e8dfdc] transition-all cursor-pointer"
            title="ตั้งค่าอัตราค่าตอบแทน"
          >
            <Settings size={15} />
          </button>
        </div>
      </div>

      {/* Calm Warm-Cream Net Income Box (No bright neon pink block) */}
      <div className="mt-3 p-3.5 rounded-xl bg-[#f6efed] border border-[#e4d8d5]">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[11px] text-[#78716c] font-semibold block">
              รายรับสุทธิ (Net Income)
            </span>
            <div className="text-xl sm:text-2xl font-extrabold text-[#a63e54] mt-0.5 tracking-tight flex items-baseline gap-1">
              <span className="text-sm sm:text-base font-bold">฿</span>
              <span>{isLoading ? '...' : formatMoney(breakdown.netIncome)}</span>
            </div>
          </div>
          <span className="text-[10px] bg-white text-[#57534e] border border-[#e4d8d5] px-2 py-0.5 rounded-full font-semibold shrink-0">
            {shiftCounts.totalWorkedDays} วัน • {shiftCounts.totalShifts} เวรย่อย
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2.5 border-t border-[#e4d8d5]/80 text-[11px] text-[#57534e]">
          <div className="flex items-center gap-1 min-w-0">
            <TrendingUp size={12} className="text-[#457a58] shrink-0" />
            <span className="text-[#78716c]">รายรับ:</span>
            <span className="font-bold text-[#1d1d1f] truncate">{formatMoney(breakdown.totalIncome)}</span>
          </div>
          <div className="flex items-center gap-1 justify-end min-w-0">
            <TrendingDown size={12} className="text-[#a3332b] shrink-0" />
            <span className="text-[#78716c]">หัก:</span>
            <span className="font-bold text-[#1d1d1f] truncate">{formatMoney(breakdown.totalDeductions)}</span>
          </div>
        </div>
      </div>

      {/* 3 SunNotes-Style StatTiles for Morning / Afternoon / Night */}
      <div className="grid grid-cols-3 gap-2 mt-2.5 text-center">
        <div className="rounded-xl border border-[#eadcdf] bg-[#f7eeef]/80 px-2 py-2.5">
          <div className="text-base font-bold text-[#a63e54] leading-tight">
            {shiftCounts.MORNING.totalCount}
          </div>
          <div className="mt-0.5 text-[11px] font-semibold text-[#57534e] flex items-center justify-center gap-0.5">
            <ShiftAtomicIcon code="MORNING" size={10} />
            <span>เช้า (ช)</span>
          </div>
          <div className="text-[9px] text-[#78716c] font-medium mt-0.5">
            ปกติ {shiftCounts.MORNING.normalCount} • OT {shiftCounts.MORNING.otCount}
          </div>
        </div>

        <div className="rounded-xl border border-[#e4dce8] bg-[#f3eff6]/80 px-2 py-2.5">
          <div className="text-base font-bold text-[#6e527a] leading-tight">
            {shiftCounts.AFTERNOON.totalCount}
          </div>
          <div className="mt-0.5 text-[11px] font-semibold text-[#57534e] flex items-center justify-center gap-0.5">
            <ShiftAtomicIcon code="AFTERNOON" size={10} />
            <span>บ่าย (บ)</span>
          </div>
          <div className="text-[9px] text-[#78716c] font-medium mt-0.5">
            ปกติ {shiftCounts.AFTERNOON.normalCount} • OT {shiftCounts.AFTERNOON.otCount}
          </div>
        </div>

        <div className="rounded-xl border border-[#dce2ea] bg-[#eff2f6]/80 px-2 py-2.5">
          <div className="text-base font-bold text-[#495872] leading-tight">
            {shiftCounts.NIGHT.totalCount}
          </div>
          <div className="mt-0.5 text-[11px] font-semibold text-[#57534e] flex items-center justify-center gap-0.5">
            <ShiftAtomicIcon code="NIGHT" size={10} />
            <span>ดึก (ด)</span>
          </div>
          <div className="text-[9px] text-[#78716c] font-medium mt-0.5">
            ปกติ {shiftCounts.NIGHT.normalCount} • OT {shiftCounts.NIGHT.otCount}
          </div>
        </div>
      </div>

      {/* Breakdown Toggle Accordion */}
      <div className="mt-2.5 border-t border-[#e8dfdc] pt-2">
        <button
          type="button"
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="w-full flex items-center justify-between py-1 px-1 text-[11px] font-semibold text-[#78716c] hover:text-[#a63e54] transition-colors cursor-pointer"
        >
          <span>ดูรายละเอียดแจกแจงรายรับ & รายหัก</span>
          {showBreakdown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showBreakdown && (
          <div className="mt-2 space-y-3 p-3 bg-[#faf6f5] rounded-xl border border-[#e8dfdc] text-xs animate-in fade-in duration-150">
            {/* รายรับ */}
            <div>
              <span className="text-[11px] font-bold text-[#457a58] flex items-center gap-1 mb-1.5">
                <TrendingUp size={12} />
                <span>รายการรายรับ (Earnings)</span>
              </span>
              <div className="space-y-1 text-[#57534e] pl-1">
                <div className="flex justify-between">
                  <span>เงินเดือนพื้นฐาน</span>
                  <span className="font-bold text-[#1d1d1f]">฿{formatMoney(breakdown.baseSalary)}</span>
                </div>
                <div className="flex justify-between">
                  <span>ค่าเวร & OT (ตามจำนวนเวรที่ขึ้น)</span>
                  <span className="font-bold text-[#a63e54]">฿{formatMoney(breakdown.totalShiftAllowance)}</span>
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
                <div className="flex justify-between pt-1 border-t border-[#e8dfdc] font-bold text-[#1d1d1f]">
                  <span>รวมรายรับทั้งสิ้น</span>
                  <span className="text-[#457a58]">฿{formatMoney(breakdown.totalIncome)}</span>
                </div>
              </div>
            </div>

            {/* รายหัก */}
            {breakdown.totalDeductions > 0 && (
              <div className="pt-2 border-t border-[#e8dfdc]">
                <span className="text-[11px] font-bold text-[#a3332b] flex items-center gap-1 mb-1.5">
                  <TrendingDown size={12} />
                  <span>รายการหัก (Deductions)</span>
                </span>
                <div className="space-y-1 text-[#57534e] pl-1">
                  {breakdown.taxDeduction > 0 && (
                    <div className="flex justify-between">
                      <span>ภาษี ณ ที่จ่าย</span>
                      <span className="font-bold text-[#a3332b]">-฿{formatMoney(breakdown.taxDeduction)}</span>
                    </div>
                  )}
                  {breakdown.socialSecurity > 0 && (
                    <div className="flex justify-between">
                      <span>ประกันสังคม</span>
                      <span className="font-bold text-[#a3332b]">-฿{formatMoney(breakdown.socialSecurity)}</span>
                    </div>
                  )}
                  {breakdown.providentFund > 0 && (
                    <div className="flex justify-between">
                      <span>กบข.</span>
                      <span className="font-bold text-[#a3332b]">-฿{formatMoney(breakdown.providentFund)}</span>
                    </div>
                  )}
                  {breakdown.coopDeduction > 0 && (
                    <div className="flex justify-between">
                      <span>สหกรณ์</span>
                      <span className="font-bold text-[#a3332b]">-฿{formatMoney(breakdown.coopDeduction)}</span>
                    </div>
                  )}
                  {breakdown.otherDeduction > 0 && (
                    <div className="flex justify-between">
                      <span>หักอื่นๆ</span>
                      <span className="font-bold text-[#a3332b]">-฿{formatMoney(breakdown.otherDeduction)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 border-t border-[#e8dfdc] font-bold text-[#1d1d1f]">
                    <span>รวมรายหักทั้งสิ้น</span>
                    <span className="text-[#a3332b]">-฿{formatMoney(breakdown.totalDeductions)}</span>
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
