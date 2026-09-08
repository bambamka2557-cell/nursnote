'use client';

import { useState, useEffect } from 'react';
import { NurseSalaryConfigData } from '@/app/utils/shiftData';
import { saveSalaryConfig } from '@/app/actions/salary';
import { Settings, Save, X, Coins, Shield, Calendar, DollarSign } from 'lucide-react';

interface SalaryConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialConfig: NurseSalaryConfigData;
  onSaved: () => void;
}

export default function SalaryConfigModal({
  isOpen,
  onClose,
  initialConfig,
  onSaved,
}: SalaryConfigModalProps) {
  const [formData, setFormData] = useState<NurseSalaryConfigData>({
    ...initialConfig,
    shiftRates: {
      MORNING: {
        normal: initialConfig.shiftRates?.MORNING?.normal ?? 0,
        ot: initialConfig.shiftRates?.MORNING?.ot ?? 0,
      },
      AFTERNOON: {
        normal: initialConfig.shiftRates?.AFTERNOON?.normal ?? 0,
        ot: initialConfig.shiftRates?.AFTERNOON?.ot ?? 0,
      },
      NIGHT: {
        normal: initialConfig.shiftRates?.NIGHT?.normal ?? 0,
        ot: initialConfig.shiftRates?.NIGHT?.ot ?? 0,
      },
    },
  });

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state whenever the modal opens or initialConfig changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        ...initialConfig,
        shiftRates: {
          MORNING: {
            normal: initialConfig.shiftRates?.MORNING?.normal ?? 0,
            ot: initialConfig.shiftRates?.MORNING?.ot ?? 0,
          },
          AFTERNOON: {
            normal: initialConfig.shiftRates?.AFTERNOON?.normal ?? 0,
            ot: initialConfig.shiftRates?.AFTERNOON?.ot ?? 0,
          },
          NIGHT: {
            normal: initialConfig.shiftRates?.NIGHT?.normal ?? 0,
            ot: initialConfig.shiftRates?.NIGHT?.ot ?? 0,
          },
        },
      });
      setErrorMsg(null);
    }
  }, [isOpen, initialConfig]);

  if (!isOpen) return null;

  const handleNumberChange = (field: keyof NurseSalaryConfigData, value: string) => {
    const num = Math.max(0, parseFloat(value) || 0);
    setFormData((prev) => ({
      ...prev,
      [field]: num,
    }));
  };

  const handleRateChange = (
    shift: 'MORNING' | 'AFTERNOON' | 'NIGHT',
    type: 'normal' | 'ot',
    value: string
  ) => {
    const num = Math.max(0, parseFloat(value) || 0);
    setFormData((prev) => ({
      ...prev,
      shiftRates: {
        ...prev.shiftRates,
        [shift]: {
          ...prev.shiftRates[shift],
          [type]: num,
        },
      },
    }));
  };

  const handleSave = async () => {
    if (formData.cycleStartDay < 1 || formData.cycleStartDay > 28) {
      setErrorMsg('วันเริ่มต้นรอบจ่ายต้องอยู่ระหว่างวันที่ 1 ถึง 28');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await saveSalaryConfig(formData);
      if (res.success) {
        onSaved();
        onClose();
      } else {
        setErrorMsg(res.error || 'บันทึกข้อมูลไม่สำเร็จ');
      }
    } catch {
      setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl p-5 md:p-6 shadow-2xl border border-pink-100 max-h-[90vh] flex flex-col text-slate-800">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-pink-100 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-pink-100 flex items-center justify-center text-pink-600 shadow-xs">
              <Settings size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-base md:text-lg text-slate-800">ตั้งค่าอัตราค่าตอบแทน & เงินเดือน</h3>
              <p className="text-[11px] text-pink-500 font-semibold">ปรับอัตราตามเกณฑ์ รพ. และวิชาชีพของคุณ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-600 font-medium">
              {errorMsg}
            </div>
          )}

          {/* Section 1: Shift Rates Matrix */}
          <div className="bg-gradient-to-br from-pink-50/60 to-rose-50/30 border border-pink-100 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-extrabold text-pink-700 text-sm">
                <Coins size={16} />
                <span>อัตราค่าเวรรายเวรย่อย (Shift Rates)</span>
              </div>
              <span className="text-[10px] text-slate-400 bg-white px-2 py-0.5 rounded-full border border-pink-100">
                บาท / เวร
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              เรตคิดแยกรายเวรย่อย 3 ตัว (เช้า, บ่าย, ดึก) × สี (ปกติ ตัวดำ / OT ตัวแดง). เวรควบระบบจะบวกจากเวรย่อยให้อัตโนมัติ
            </p>

            <div className="grid grid-cols-3 gap-2.5 pt-1">
              {/* MORNING */}
              <div className="bg-white/80 border border-pink-100/80 p-3 rounded-xl space-y-2 text-center shadow-xs">
                <span className="font-extrabold text-pink-600 block text-xs">🌸 เวรเช้า (ช)</span>
                <div className="space-y-1.5 text-left">
                  <div>
                    <label className="text-[10px] text-slate-500 font-medium block">ปกติ (ดำ)</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.shiftRates.MORNING.normal || ''}
                      placeholder="0"
                      onChange={(e) => handleRateChange('MORNING', 'normal', e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:border-pink-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-rose-600 font-bold block">OT (แดง)</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.shiftRates.MORNING.ot || ''}
                      placeholder="0"
                      onChange={(e) => handleRateChange('MORNING', 'ot', e.target.value)}
                      className="w-full px-2 py-1.5 bg-rose-50/50 border border-rose-200 rounded-lg text-xs font-bold text-rose-700 focus:bg-white focus:border-rose-500"
                    />
                  </div>
                </div>
              </div>

              {/* AFTERNOON */}
              <div className="bg-white/80 border border-purple-100/80 p-3 rounded-xl space-y-2 text-center shadow-xs">
                <span className="font-extrabold text-purple-600 block text-xs">🍇 เวรบ่าย (บ)</span>
                <div className="space-y-1.5 text-left">
                  <div>
                    <label className="text-[10px] text-slate-500 font-medium block">ปกติ (ดำ)</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.shiftRates.AFTERNOON.normal || ''}
                      placeholder="0"
                      onChange={(e) => handleRateChange('AFTERNOON', 'normal', e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-rose-600 font-bold block">OT (แดง)</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.shiftRates.AFTERNOON.ot || ''}
                      placeholder="0"
                      onChange={(e) => handleRateChange('AFTERNOON', 'ot', e.target.value)}
                      className="w-full px-2 py-1.5 bg-rose-50/50 border border-rose-200 rounded-lg text-xs font-bold text-rose-700 focus:bg-white focus:border-rose-500"
                    />
                  </div>
                </div>
              </div>

              {/* NIGHT */}
              <div className="bg-white/80 border border-indigo-100/80 p-3 rounded-xl space-y-2 text-center shadow-xs">
                <span className="font-extrabold text-indigo-600 block text-xs">🌙 เวรดึก (ด)</span>
                <div className="space-y-1.5 text-left">
                  <div>
                    <label className="text-[10px] text-slate-500 font-medium block">ปกติ (ดำ)</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.shiftRates.NIGHT.normal || ''}
                      placeholder="0"
                      onChange={(e) => handleRateChange('NIGHT', 'normal', e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-rose-600 font-bold block">OT (แดง)</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.shiftRates.NIGHT.ot || ''}
                      placeholder="0"
                      onChange={(e) => handleRateChange('NIGHT', 'ot', e.target.value)}
                      className="w-full px-2 py-1.5 bg-rose-50/50 border border-rose-200 rounded-lg text-xs font-bold text-rose-700 focus:bg-white focus:border-rose-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Salary & Regular Allowances */}
          <div className="bg-slate-50/80 border border-slate-200/80 p-4 rounded-2xl space-y-3">
            <div className="flex items-center gap-1.5 font-extrabold text-slate-700 text-sm">
              <DollarSign size={16} className="text-emerald-500" />
              <span>เงินเดือน & ค่าตอบแทนประจำ (รายได้คงที่)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-600 block mb-1">เงินเดือนพื้นฐาน (Base)</label>
                <input
                  type="number"
                  min={0}
                  value={formData.baseSalary || ''}
                  placeholder="0"
                  onChange={(e) => handleNumberChange('baseSalary', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-pink-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">ค่า พ.ต.ส. (วิชาชีพ)</label>
                <input
                  type="number"
                  min={0}
                  value={formData.ptsAllowance || ''}
                  placeholder="0"
                  onChange={(e) => handleNumberChange('ptsAllowance', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-pink-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">ไม่ทำเวชฯ / ฉ.11 / ฉ.8</label>
                <input
                  type="number"
                  min={0}
                  value={formData.noPrivatePractice || ''}
                  placeholder="0"
                  onChange={(e) => handleNumberChange('noPrivatePractice', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-pink-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">ค่าหัวหน้าเวร / ตรวจการ</label>
                <input
                  type="number"
                  min={0}
                  value={formData.inChargeAllowance || ''}
                  placeholder="0"
                  onChange={(e) => handleNumberChange('inChargeAllowance', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-pink-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-600 block mb-1">ค่าตอบแทนพิเศษอื่นๆ</label>
                <input
                  type="number"
                  min={0}
                  value={formData.otherAllowance || ''}
                  placeholder="0"
                  onChange={(e) => handleNumberChange('otherAllowance', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 focus:border-pink-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Cycle Day Setting */}
          <div className="bg-sky-50/50 border border-sky-100 p-4 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-extrabold text-sky-800 text-sm">
                <Calendar size={16} />
                <span>วันเริ่มต้นรอบจ่ายเงินเดือน</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">วันที่</span>
                <input
                  type="number"
                  min={1}
                  max={28}
                  step={1}
                  value={formData.cycleStartDay}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      cycleStartDay: Math.max(0, Math.floor(parseFloat(e.target.value) || 0)),
                    }))
                  }
                  className="w-16 px-2 py-1.5 bg-white border border-sky-200 rounded-xl text-center font-black text-sky-800 focus:border-sky-500"
                />
              </div>
            </div>
            <p className="text-[11px] text-sky-600/80">
              ค่าเริ่มต้นคือวันที่ 26 (เช่น รอบ ส.ค. คิดตั้งแต่ 26 ก.ค. ถึง 25 ส.ค.)
            </p>
          </div>

          {/* Section 4: Deductions */}
          <div className="bg-rose-50/40 border border-rose-100/80 p-4 rounded-2xl space-y-3">
            <div className="flex items-center gap-1.5 font-extrabold text-rose-700 text-sm">
              <Shield size={16} />
              <span>รายการหักประจำเดือน (Deductions)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-600 block mb-1">ภาษี ณ ที่จ่าย</label>
                <input
                  type="number"
                  min={0}
                  value={formData.taxDeduction || ''}
                  placeholder="0"
                  onChange={(e) => handleNumberChange('taxDeduction', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-rose-200/70 rounded-xl font-bold text-slate-800 focus:border-rose-400"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">ประกันสังคม</label>
                <input
                  type="number"
                  min={0}
                  value={formData.socialSecurity || ''}
                  placeholder="0"
                  onChange={(e) => handleNumberChange('socialSecurity', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-rose-200/70 rounded-xl font-bold text-slate-800 focus:border-rose-400"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">กบข. (ข้าราชการ)</label>
                <input
                  type="number"
                  min={0}
                  value={formData.providentFund || ''}
                  placeholder="0"
                  onChange={(e) => handleNumberChange('providentFund', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-rose-200/70 rounded-xl font-bold text-slate-800 focus:border-rose-400"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">สหกรณ์ออมทรัพย์</label>
                <input
                  type="number"
                  min={0}
                  value={formData.coopDeduction || ''}
                  placeholder="0"
                  onChange={(e) => handleNumberChange('coopDeduction', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-rose-200/70 rounded-xl font-bold text-slate-800 focus:border-rose-400"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-600 block mb-1">หักอื่นๆ</label>
                <input
                  type="number"
                  min={0}
                  value={formData.otherDeduction || ''}
                  placeholder="0"
                  onChange={(e) => handleNumberChange('otherDeduction', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-rose-200/70 rounded-xl font-bold text-slate-800 focus:border-rose-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-100 pt-3 flex gap-2.5 justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 active:scale-95 transition-all text-xs"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-extrabold shadow-sm active:scale-95 transition-all disabled:opacity-50 text-xs cursor-pointer"
          >
            <Save size={15} />
            <span>{saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
