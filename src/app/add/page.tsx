'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addPatient } from '../actions/patient';
import { PRESET_MEDICATIONS, PRESET_ASSESSMENTS } from '@/app/utils/drugData';
import { AlertTriangle, ChevronLeft, Save, Plus, Trash2, Clock, Info } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function AddPatient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Patient details
  const [bedNumber, setBedNumber] = useState('');
  const [nickname, setNickname] = useState('');
  const [dx, setDx] = useState('');
  const [initialNote, setInitialNote] = useState('');
  
  // Selected orders state
  const [selectedOrders, setSelectedOrders] = useState<any[]>([]);

  // Custom order inputs
  const [customName, setCustomName] = useState('');
  const [customInterval, setCustomInterval] = useState('60');
  const [customType, setCustomType] = useState('MEDICATION');

  // Handle toggling preset medication
  const toggleMedicationPreset = (presetName: string) => {
    if (!presetName) return;
    const isAlreadySelected = selectedOrders.find(o => o.name === presetName && o.type === 'MEDICATION');
    if (isAlreadySelected) {
      setSelectedOrders(selectedOrders.filter(o => !(o.name === presetName && o.type === 'MEDICATION')));
    } else {
      const preset = PRESET_MEDICATIONS.find(m => m.name === presetName);
      if (preset) {
        setSelectedOrders([
          ...selectedOrders, 
          { 
            type: 'MEDICATION', 
            name: preset.name, 
            intervalMinutes: preset.defaultInterval, 
            lastGivenTime: format(new Date(), 'HH:mm') 
          }
        ]);
      }
    }
  };

  // Handle toggling preset assessment
  const toggleAssessmentPreset = (presetName: string) => {
    if (!presetName) return;
    const isAlreadySelected = selectedOrders.find(o => o.name === presetName && o.type === 'ASSESSMENT');
    if (isAlreadySelected) {
      setSelectedOrders(selectedOrders.filter(o => !(o.name === presetName && o.type === 'ASSESSMENT')));
    } else {
      const preset = PRESET_ASSESSMENTS.find(a => a.name === presetName);
      if (preset) {
        setSelectedOrders([
          ...selectedOrders, 
          { 
            type: 'ASSESSMENT', 
            name: preset.name, 
            intervalMinutes: preset.defaultInterval, 
            lastGivenTime: format(new Date(), 'HH:mm') 
          }
        ]);
      }
    }
  };

  // Handle adding custom order
  const handleAddCustomOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    setSelectedOrders([
      ...selectedOrders,
      {
        type: customType,
        name: customName.trim(),
        intervalMinutes: parseInt(customInterval, 10) || 60,
        lastGivenTime: format(new Date(), 'HH:mm')
      }
    ]);

    setCustomName('');
    setCustomInterval('60');
  };

  const handleRemoveOrder = (name: string) => {
    setSelectedOrders(selectedOrders.filter(o => o.name !== name));
  };

  const handleUpdateInterval = (name: string, newInterval: number) => {
    setSelectedOrders(
      selectedOrders.map(o => o.name === name ? { ...o, intervalMinutes: newInterval } : o)
    );
  };

  const handleUpdateLastGivenTime = (name: string, newTime: string) => {
    setSelectedOrders(
      selectedOrders.map(o => o.name === name ? { ...o, lastGivenTime: newTime } : o)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Parse lastGivenTime for each order
    const parsedOrders = selectedOrders.map(order => {
      const [hours, minutes] = order.lastGivenTime.split(':').map(Number);
      const now = new Date();
      const orderDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
      
      // Heuristic: If target date is in the future by > 2 hours, it belongs to yesterday
      if (orderDate.getTime() > now.getTime() + 2 * 60 * 60 * 1000) {
        orderDate.setDate(orderDate.getDate() - 1);
      }
      
      return {
        type: order.type,
        name: order.name,
        intervalMinutes: order.intervalMinutes,
        startTime: orderDate,
      };
    });

    try {
      await addPatient({
        bedNumber,
        nickname,
        dx,
        initialNote,
        orders: parsedOrders,
      });
      router.push('/');
    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/" className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-all">
          <ChevronLeft size={22} />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">รับผู้ป่วยใหม่</h1>
          <p className="text-sm text-slate-500 mt-0.5">กรอกประวัติและเลือกคิวแจ้งเตือนงานดูแล</p>
        </div>
      </div>
      
      {/* Warning Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-amber-900 text-xs leading-relaxed">
        <AlertTriangle size={20} className="shrink-0 text-amber-600 mt-0.5" />
        <div>
          <span className="font-bold block mb-0.5 text-sm text-amber-950">สำคัญ: ตรวจสอบแผนการรักษาของแพทย์ตัวจริงเสมอ</span>
          ระบบตั้งเวลาแจ้งเตือนนี้เป็นเพียงระบบช่วยเตือนความจำพยาบาลเท่านั้น กรุณาปรับเปลี่ยนโดสหรือความถี่ตามใบสั่งแพทย์ในเคสปัจจุบัน
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Patient Info */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
          <h2 className="text-lg font-bold text-slate-800 border-b border-slate-50 pb-2.5">ข้อมูลผู้ป่วยแรกรับ</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">หมายเลขเตียง</label>
              <input 
                type="text" 
                required 
                value={bedNumber} 
                onChange={e => setBedNumber(e.target.value)} 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:outline-hidden text-sm font-medium transition-all text-slate-850" 
                placeholder="เช่น 1, 2" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">ชื่อเล่น / นามแฝง</label>
              <input 
                type="text" 
                required 
                value={nickname} 
                onChange={e => setNickname(e.target.value)} 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:outline-hidden text-sm font-medium transition-all text-slate-850" 
                placeholder="เช่น เอ, บี" 
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600">Dx (Diagnosis)</label>
            <input 
              type="text" 
              value={dx} 
              onChange={e => setDx(e.target.value)} 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:outline-hidden text-sm font-medium transition-all text-slate-850" 
              placeholder="เช่น G1P0A0 GA 38 wks c PROM" 
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600">Initial Note (แรกรับ)</label>
            <textarea 
              value={initialNote} 
              onChange={e => setInitialNote(e.target.value)} 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:outline-hidden text-sm font-medium min-h-[90px] transition-all text-slate-850" 
              placeholder="CC: เจ็บครรภ์คลอด&#10;PI: ...&#10;V/S: ..."
            ></textarea>
          </div>
        </div>

        {/* 2. Choose Presets with Category Dropdowns */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
          <h2 className="text-lg font-bold text-slate-800 border-b border-slate-50 pb-2.5">เลือกรายการยาและการประเมิน (Preset Orders)</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category 1: Tocolytic */}
            <div className="space-y-1.5 p-3.5 bg-pink-50/10 border border-pink-100/30 rounded-2xl">
              <label className="text-xs font-bold text-pink-700 block">👶 ยาระงับครรภ์ & ลดความดัน (Tocolytics & Anti-HT)</label>
              <select 
                onChange={e => {
                  toggleMedicationPreset(e.target.value);
                  e.target.value = ''; // Reset select
                }}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-pink-500 focus:outline-hidden text-sm font-medium transition-all text-slate-800 cursor-pointer"
              >
                <option value="">-- เลือกยากลุ่มนี้ --</option>
                {PRESET_MEDICATIONS.filter(m => m.category === 'tocolytic').map(m => {
                  const isSelected = selectedOrders.some(o => o.name === m.name && o.type === 'MEDICATION');
                  return (
                    <option key={m.name} value={m.name}>
                      {isSelected ? '✓ ' : ''}{m.name}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Category 2: Induction */}
            <div className="space-y-1.5 p-3.5 bg-indigo-50/10 border border-indigo-100/30 rounded-2xl">
              <label className="text-xs font-bold text-indigo-700 block">⚡ ยาเร่งคลอด & ชักนำคลอด (Induction of Labor)</label>
              <select 
                onChange={e => {
                  toggleMedicationPreset(e.target.value);
                  e.target.value = ''; // Reset select
                }}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-hidden text-sm font-medium transition-all text-slate-800 cursor-pointer"
              >
                <option value="">-- เลือกยากลุ่มนี้ --</option>
                {PRESET_MEDICATIONS.filter(m => m.category === 'induction').map(m => {
                  const isSelected = selectedOrders.some(o => o.name === m.name && o.type === 'MEDICATION');
                  return (
                    <option key={m.name} value={m.name}>
                      {isSelected ? '✓ ' : ''}{m.name}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Category 3: Pre-op */}
            <div className="space-y-1.5 p-3.5 bg-sky-50/10 border border-sky-100/30 rounded-2xl">
              <label className="text-xs font-bold text-sky-700 block">🏥 ยาเตรียมก่อนส่งผ่าตัด OR (Pre-op & OR Prep)</label>
              <select 
                onChange={e => {
                  toggleMedicationPreset(e.target.value);
                  e.target.value = ''; // Reset select
                }}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-sky-500 focus:outline-hidden text-sm font-medium transition-all text-slate-800 cursor-pointer"
              >
                <option value="">-- เลือกยากลุ่มนี้ --</option>
                {PRESET_MEDICATIONS.filter(m => m.category === 'preop').map(m => {
                  const isSelected = selectedOrders.some(o => o.name === m.name && o.type === 'MEDICATION');
                  return (
                    <option key={m.name} value={m.name}>
                      {isSelected ? '✓ ' : ''}{m.name}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Category 4: General */}
            <div className="space-y-1.5 p-3.5 bg-slate-50/30 border border-slate-100/50 rounded-2xl">
              <label className="text-xs font-bold text-slate-600 block">💊 ยาทั่วไป & ยาปฏิชีวนะ (General & Antibiotics)</label>
              <select 
                onChange={e => {
                  toggleMedicationPreset(e.target.value);
                  e.target.value = ''; // Reset select
                }}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-slate-500 focus:outline-hidden text-sm font-medium transition-all text-slate-800 cursor-pointer"
              >
                <option value="">-- เลือกยากลุ่มนี้ --</option>
                {PRESET_MEDICATIONS.filter(m => m.category === 'general').map(m => {
                  const isSelected = selectedOrders.some(o => o.name === m.name && o.type === 'MEDICATION');
                  return (
                    <option key={m.name} value={m.name}>
                      {isSelected ? '✓ ' : ''}{m.name}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Category 5: Assessments */}
            <div className="space-y-1.5 p-3.5 bg-emerald-50/10 border border-emerald-100/30 rounded-2xl md:col-span-2">
              <label className="text-xs font-bold text-emerald-700 block">🔍 การเฝ้าระวังและการประเมิน (Assessments)</label>
              <select 
                onChange={e => {
                  toggleAssessmentPreset(e.target.value);
                  e.target.value = ''; // Reset select
                }}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-hidden text-sm font-medium transition-all text-slate-800 cursor-pointer"
              >
                <option value="">-- เลือกการประเมินเฝ้าระวัง --</option>
                {PRESET_ASSESSMENTS.map(a => {
                  const isSelected = selectedOrders.some(o => o.name === a.name && o.type === 'ASSESSMENT');
                  return (
                    <option key={a.name} value={a.name}>
                      {isSelected ? '✓ ' : ''}{a.name}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        {/* 3. Custom Order Creator */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-3">
          <h2 className="text-lg font-bold text-slate-800 border-b border-slate-50 pb-2">เพิ่มการแจ้งเตือนแบบกำหนดเอง (Custom)</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              type="text" 
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              placeholder="พิมพ์ชื่อคำสั่งดูแล เช่น NPO, สังเกตอาการ"
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-hidden focus:border-indigo-500 focus:bg-white text-slate-800"
            />
            <div className="flex gap-2">
              <input 
                type="number" 
                value={customInterval}
                onChange={e => setCustomInterval(e.target.value)}
                placeholder="นาที"
                className="w-20 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-center font-semibold focus:outline-hidden focus:border-indigo-500 focus:bg-white text-slate-800"
              />
              <select 
                value={customType}
                onChange={e => setCustomType(e.target.value)}
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-indigo-500 text-slate-800"
              >
                <option value="MEDICATION">ยา</option>
                <option value="ASSESSMENT">ประเมิน</option>
              </select>
              <button 
                type="button"
                onClick={handleAddCustomOrder}
                className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl active:scale-95 transition-all flex items-center justify-center shrink-0 cursor-pointer"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* 4. Selected Orders Summary */}
        {selectedOrders.length > 0 && (
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-50 pb-2">รายการแจ้งเตือนที่เลือกไว้ ({selectedOrders.length} รายการ)</h2>
            <div className="divide-y divide-slate-100">
              {selectedOrders.map(order => (
                <div key={order.name} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="min-w-0">
                    <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${
                      order.type === 'MEDICATION' 
                        ? 'bg-pink-50 text-pink-700 border-pink-100' 
                        : 'bg-sky-50 text-sky-700 border-sky-100'
                    }`}>
                      {order.type === 'MEDICATION' ? 'MED' : 'CHECK'}
                    </span>
                    <span className="text-sm font-bold text-slate-800 ml-2">{order.name}</span>
                    {order.type === 'MEDICATION' && (() => {
                      const guide = PRESET_MEDICATIONS.find(m => m.name === order.name);
                      if (!guide) return null;
                      return (
                        <details className="mt-1 ml-10 group">
                          <summary className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer list-none flex items-center gap-1 select-none">
                            <Info size={11} />
                            <span>สูตรผสมและวิธีใช้</span>
                          </summary>
                          <div className="mt-1 p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs space-y-0.5 text-slate-500 max-w-sm">
                            <div><span className="font-bold text-slate-600">โดส:</span> {guide.dose}</div>
                            <div><span className="font-bold text-slate-600">ผสม:</span> {guide.mix}</div>
                            <div className="text-rose-600 font-medium"><span className="font-bold">ระวัง:</span> {guide.warning}</div>
                          </div>
                        </details>
                      );
                    })()}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span>เริ่มให้ยา/ประเมินล่าสุด:</span>
                      <input 
                        type="time"
                        value={order.lastGivenTime}
                        onChange={e => handleUpdateLastGivenTime(order.name, e.target.value)}
                        className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock size={12} />
                      <span>เตือนทุก</span>
                      <input 
                        type="number"
                        value={order.intervalMinutes || ''}
                        onChange={e => handleUpdateInterval(order.name, parseInt(e.target.value, 10) || 0)}
                        className="w-16 px-1.5 py-1 text-center bg-slate-50 border border-slate-200 rounded-md font-bold focus:outline-hidden focus:border-indigo-500 focus:bg-white text-slate-800"
                      />
                      <span>นาที</span>
                    </div>
                    
                    <button 
                      type="button"
                      onClick={() => handleRemoveOrder(order.name)}
                      className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={loading || selectedOrders.length === 0} 
          className="w-full py-4 bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white font-extrabold rounded-2xl shadow-lg border-b-3 border-indigo-700 active:translate-y-0.5 active:border-b-0 flex items-center justify-center gap-2 transition-all text-md cursor-pointer"
        >
          {loading ? (
            <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
          ) : (
            <>
              <Save size={20} />
              บันทึกข้อมูลเตียงและคิวแจ้งเตือน
            </>
          )}
        </button>
      </form>
    </div>
  );
}
