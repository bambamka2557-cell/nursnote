'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addPatient } from '../actions/patient';
import { AlertTriangle, Clock, ChevronLeft, Save } from 'lucide-react';
import Link from 'next/link';

const COMMON_MEDS = [
  { name: 'Ampicillin 2g IV', intervalMinutes: 240 }, // q4h
  { name: 'Dexamethasone 12mg IM', intervalMinutes: 720 }, // q12h
  { name: 'Oxytocin (Syntocinon)', intervalMinutes: 30 }, // q30m titrate
  { name: 'MgSO4 (Loading/Maintenance)', intervalMinutes: 60 }, // q1h checks
];

const COMMON_ASSESSMENTS = [
  { name: 'PV (Pelvic Exam)', intervalMinutes: 240 }, // q4h
  { name: 'FHS & UC Check', intervalMinutes: 30 }, // q30m
  { name: 'V/S (Vital Signs)', intervalMinutes: 240 }, // q4h
];

export default function AddPatient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [bedNumber, setBedNumber] = useState('');
  const [nickname, setNickname] = useState('');
  const [dx, setDx] = useState('');
  const [initialNote, setInitialNote] = useState('');
  
  const [selectedOrders, setSelectedOrders] = useState<any[]>([]);

  const togglePreset = (preset: any, type: string) => {
    const exists = selectedOrders.find(o => o.name === preset.name);
    if (exists) {
      setSelectedOrders(selectedOrders.filter(o => o.name !== preset.name));
    } else {
      setSelectedOrders([...selectedOrders, { ...preset, type, startTime: new Date() }]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await addPatient({
        bedNumber,
        nickname,
        dx,
        initialNote,
        orders: selectedOrders,
      });
      router.push('/');
    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/" className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-all">
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">รับผู้ป่วยใหม่</h1>
          <p className="text-xs text-slate-500 mt-0.5">กรอกข้อมูลและเลือกตั้งเวลาเตือนความจำ</p>
        </div>
      </div>
      
      {/* Warning Notice */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3 text-amber-800 text-xs leading-relaxed">
        <AlertTriangle size={18} className="shrink-0 text-amber-500 mt-0.5" />
        <div>
          <span className="font-bold block mb-0.5">ตรวจสอบออร์เดอร์จริงเสมอ!</span>
          การตั้งค่าเวลาในระบบเป็นเพียงตัวช่วยเบื้องต้น กรุณาเทียบตารางจริงกับคำสั่งแพทย์ก่อนทุกครั้ง
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Details */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
          <h2 className="text-md font-bold text-slate-800 border-b border-slate-50 pb-2">ข้อมูลผู้ป่วย (PHI Safe)</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">หมายเลขเตียง</label>
              <input 
                type="text" 
                required 
                value={bedNumber} 
                onChange={e => setBedNumber(e.target.value)} 
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:outline-hidden text-sm transition-all" 
                placeholder="เช่น 1, 2" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">ชื่อเล่น/นามแฝง</label>
              <input 
                type="text" 
                required 
                value={nickname} 
                onChange={e => setNickname(e.target.value)} 
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:outline-hidden text-sm transition-all" 
                placeholder="เช่น เอ, บี" 
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Dx (Diagnosis)</label>
            <input 
              type="text" 
              value={dx} 
              onChange={e => setDx(e.target.value)} 
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:outline-hidden text-sm transition-all" 
              placeholder="เช่น G1P0A0 GA 38 wks c PROM" 
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Initial Note (แรกรับ)</label>
            <textarea 
              value={initialNote} 
              onChange={e => setInitialNote(e.target.value)} 
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:outline-hidden text-sm min-h-[90px] transition-all" 
              placeholder="CC: เจ็บครรภ์คลอด&#10;PI: ...&#10;V/S: ..."
            ></textarea>
          </div>
        </div>

        {/* Med Presets */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-3">
          <h2 className="text-md font-bold text-slate-800 border-b border-slate-50 pb-2">ยาด่วน (Medications)</h2>
          <div className="grid gap-2">
            {COMMON_MEDS.map(med => {
              const isSelected = !!selectedOrders.find(o => o.name === med.name);
              return (
                <button
                  key={med.name}
                  type="button"
                  onClick={() => togglePreset(med, 'MEDICATION')}
                  className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                    isSelected 
                      ? 'border-indigo-500 bg-indigo-50/30 text-indigo-900 font-semibold' 
                      : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div>
                    <span className="text-sm block">{med.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal flex items-center gap-1 mt-1">
                      <Clock size={10} /> แจ้งเตือนทุก {med.intervalMinutes / 60} ชม. ({med.intervalMinutes} นาที)
                    </span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                    isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white'
                  }`}>
                    {isSelected && <span className="text-xs">✓</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Assessment Presets */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-3">
          <h2 className="text-md font-bold text-slate-800 border-b border-slate-50 pb-2">การประเมิน (Assessments)</h2>
          <div className="grid gap-2">
            {COMMON_ASSESSMENTS.map(ast => {
              const isSelected = !!selectedOrders.find(o => o.name === ast.name);
              return (
                <button
                  key={ast.name}
                  type="button"
                  onClick={() => togglePreset(ast, 'ASSESSMENT')}
                  className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                    isSelected 
                      ? 'border-emerald-500 bg-emerald-50/20 text-emerald-900 font-semibold' 
                      : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div>
                    <span className="text-sm block">{ast.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal flex items-center gap-1 mt-1">
                      <Clock size={10} /> แจ้งเตือนทุก {ast.intervalMinutes} นาที
                    </span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                    isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white'
                  }`}>
                    {isSelected && <span className="text-xs">✓</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={loading} 
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 transition-all"
        >
          {loading ? (
            <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
          ) : (
            <>
              <Save size={18} />
              บันทึกและเริ่มตั้งเวลา
            </>
          )}
        </button>
      </form>
    </div>
  );
}
