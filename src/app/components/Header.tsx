'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, PlusCircle, ListTodo, Calculator, BookOpen, Clock, Heart, ShieldAlert, CheckCircle, Info, Copy } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();

  // Modals state
  const [gaOpen, setGaOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  // GA Calculator state
  const [edcDate, setEdcDate] = useState('');
  const [calculatedGa, setCalculatedGa] = useState('');
  const [copied, setCopied] = useState(false);

  // Guidelines Tab state
  const [activeTab, setActiveTab] = useState<'triage' | 'mgso4' | 'tocolytic' | 'nst' | 'psychology'>('triage');

  // GA calculation logic
  const handleCalculateGa = (dateStr: string) => {
    setEdcDate(dateStr);
    if (!dateStr) {
      setCalculatedGa('');
      return;
    }

    const edc = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    edc.setHours(0, 0, 0, 0);

    // Difference in days
    const diffTime = edc.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Days of pregnancy today (280 days is full term)
    const pregnancyDays = 280 - diffDays;

    if (pregnancyDays < 0 || pregnancyDays > 300) {
      setCalculatedGa('วันที่ไม่ถูกต้อง');
      return;
    }

    const weeks = Math.floor(pregnancyDays / 7);
    const days = pregnancyDays % 7;

    setCalculatedGa(`${weeks}+${days} wks`);
    setCopied(false);
  };

  const handleCopyGa = () => {
    if (!calculatedGa || calculatedGa === 'วันที่ไม่ถูกต้อง') return;
    navigator.clipboard.writeText(`GA ${calculatedGa}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-sky-100/90 backdrop-blur-md border-b border-sky-200/40 px-4 md:px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4 md:gap-6">
          <Link href="/" className="flex items-center gap-1.5 shrink-0">
            <span className="text-lg md:text-xl font-black bg-gradient-to-r from-pink-500 to-indigo-600 bg-clip-text text-transparent">LR-Helper</span>
            <span className="text-[9px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 bg-pink-100 text-pink-700 rounded-full border border-pink-200/20">LR</span>
          </Link>
          
          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-600">
            <Link href="/" className={`flex items-center gap-1.5 transition-all ${
              pathname === '/' 
                ? 'bg-gradient-to-b from-indigo-500 to-indigo-600 text-white font-black shadow-[0_4px_10px_rgba(99,102,241,0.25)] border-b-3 border-indigo-700 px-3 py-1.5 rounded-xl active:translate-y-0.5 active:border-b-0' 
                : 'bg-white/60 text-slate-700 hover:bg-white hover:text-indigo-600 hover:shadow-sm border border-slate-200/50 px-3 py-1.5 rounded-xl active:translate-y-0.5'
            }`}>
              <Activity size={16} />
              <span>เตียงทั้งหมด</span>
            </Link>
            <Link href="/add" className={`flex items-center gap-1.5 transition-all ${
              pathname === '/add' 
                ? 'bg-gradient-to-b from-pink-400 to-pink-500 text-white font-black shadow-[0_4px_10px_rgba(244,114,182,0.25)] border-b-3 border-pink-600 px-3 py-1.5 rounded-xl active:translate-y-0.5 active:border-b-0' 
                : 'bg-white/60 text-slate-700 hover:bg-white hover:text-pink-600 hover:shadow-sm border border-slate-200/50 px-3 py-1.5 rounded-xl active:translate-y-0.5'
            }`}>
              <PlusCircle size={16} />
              <span>รับใหม่</span>
            </Link>
            <Link href="/timeline" className={`flex items-center gap-1.5 transition-all ${
              pathname === '/timeline' 
                ? 'bg-gradient-to-b from-indigo-500 to-indigo-600 text-white font-black shadow-[0_4px_10px_rgba(99,102,241,0.25)] border-b-3 border-indigo-700 px-3 py-1.5 rounded-xl active:translate-y-0.5 active:border-b-0' 
                : 'bg-white/60 text-slate-700 hover:bg-white hover:text-indigo-600 hover:shadow-sm border border-slate-200/50 px-3 py-1.5 rounded-xl active:translate-y-0.5'
            }`}>
              <ListTodo size={16} />
              <span>คิวงานรวม</span>
            </Link>
          </nav>
        </div>

        {/* Global Toolbar & Status */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* GA Calculator Trigger */}
          <button
            onClick={() => setGaOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-b from-sky-400 to-sky-500 hover:from-sky-500 hover:to-sky-600 text-white text-xs font-black rounded-xl border-b-3 border-sky-600 shadow-[0_4px_10px_rgba(56,189,248,0.25)] hover:shadow-[0_6px_14px_rgba(56,189,248,0.35)] transition-all active:translate-y-0.5 active:border-b-0 shrink-0 cursor-pointer"
            title="เครื่องคำนวณ GA"
          >
            <Calculator size={14} className="text-white" />
            <span className="hidden sm:inline">คำนวณ GA</span>
          </button>

          {/* LR Guidelines Trigger */}
          <button
            onClick={() => setGuideOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-b from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white text-xs font-black rounded-xl border-b-3 border-pink-600 shadow-[0_4px_10px_rgba(244,114,182,0.25)] hover:shadow-[0_6px_14px_rgba(244,114,182,0.35)] transition-all active:translate-y-0.5 active:border-b-0 shrink-0 cursor-pointer"
            title="คู่มือพยาบาลใหม่"
          >
            <BookOpen size={14} className="text-white" />
            <span className="hidden sm:inline">คู่มือ LR</span>
          </button>

          <div className="flex items-center gap-1.5 pl-1 md:pl-2 border-l border-sky-200/30">
            <span className="hidden lg:inline text-[10px] text-slate-400 font-medium">DB Active</span>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Database Connected"></div>
          </div>
        </div>
      </header>

      {/* Global GA Calculator Modal */}
      {gaOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 text-slate-800">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calculator size={18} className="text-indigo-500" />
                <h3 className="font-extrabold text-base text-slate-900">เครื่องคำนวณอายุครรภ์ (GA)</h3>
              </div>
              <button onClick={() => setGaOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold p-1">✕</button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">เลือกวันกำหนดคลอด (EDC / Due Date)</label>
                <input
                  type="date"
                  value={edcDate}
                  onChange={(e) => handleCalculateGa(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-hidden focus:border-indigo-500 focus:bg-white text-slate-800"
                />
              </div>

              {calculatedGa && (
                <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-500 block">GA วันนี้ (Gestational Age)</span>
                    <span className="text-xl font-black text-indigo-900">GA {calculatedGa}</span>
                  </div>
                  {calculatedGa !== 'วันที่ไม่ถูกต้อง' && (
                    <button
                      onClick={handleCopyGa}
                      className={`p-2.5 rounded-lg border transition-all flex items-center justify-center gap-1 active:scale-95 ${copied ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'}`}
                      title="คัดลอกเพื่อนำไปกรอกลง Dx"
                    >
                      {copied ? <CheckCircle size={15} /> : <Copy size={15} />}
                      <span className="text-[10px] font-bold">{copied ? 'ก๊อปปี้แล้ว' : 'คัดลอก'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="text-center pt-2">
              <button
                onClick={() => setGaOpen(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all active:scale-95"
              >
                เสร็จสิ้น
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global LR Guidelines Modal */}
      {guideOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 text-slate-800">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen size={20} className="text-pink-600" />
                <div>
                  <h3 className="font-extrabold text-base md:text-lg text-slate-900">คู่มือพยาบาลห้องคลอดมือใหม่</h3>
                  <p className="text-xs text-slate-400">เกณฑ์การดูแลรักษาและการเฝ้าระวังความปลอดภัยหญิงตั้งครรภ์</p>
                </div>
              </div>
              <button onClick={() => setGuideOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold p-1">✕</button>
            </div>

            {/* Tab selection buttons */}
            <div className="flex flex-wrap gap-1.5 border-b border-slate-100 pb-2">
              <button
                onClick={() => setActiveTab('triage')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'triage' ? 'bg-pink-100 text-pink-700 font-extrabold shadow-sm' : 'hover:bg-slate-50 text-slate-500'}`}
              >
                แรกรับ Admit/Obs
              </button>
              <button
                onClick={() => setActiveTab('mgso4')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'mgso4' ? 'bg-pink-100 text-pink-700 font-extrabold shadow-sm' : 'hover:bg-slate-50 text-slate-500'}`}
              >
                การเฝ้าระวัง MgSO4
              </button>
              <button
                onClick={() => setActiveTab('tocolytic')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'tocolytic' ? 'bg-pink-100 text-pink-700 font-extrabold shadow-sm' : 'hover:bg-slate-50 text-slate-500'}`}
              >
                ยายับยั้งคลอด
              </button>
              <button
                onClick={() => setActiveTab('nst')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'nst' ? 'bg-pink-100 text-pink-700 font-extrabold shadow-sm' : 'hover:bg-slate-50 text-slate-500'}`}
              >
                การอ่าน NST / FHS
              </button>
              <button
                onClick={() => setActiveTab('psychology')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'psychology' ? 'bg-pink-100 text-pink-700 font-extrabold shadow-sm' : 'hover:bg-slate-50 text-slate-500'}`}
              >
                จิตวิทยาและการสื่อสาร
              </button>
            </div>

            {/* Tab content */}
            <div className="py-2">
              {activeTab === 'triage' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2.5 bg-rose-50/30 border border-rose-100/50 rounded-xl p-4">
                    <h4 className="font-extrabold text-rose-700 text-sm flex items-center gap-1.5 border-b border-rose-100 pb-1.5">
                      🔴 รับเข้าห้องคลอดทันที (Admit to LR)
                    </h4>
                    <ul className="text-sm text-slate-600 space-y-2.5 list-disc pl-4 leading-relaxed">
                      <li><span className="font-bold text-slate-800">Active Labor:</span> ปากมดลูก dilate &gt;= 4 ซม. (ครรภ์แรก) หรือ &gt;= 3 ซม. (ครรภ์หลัง) ร่วมกับมดลูกบีบตัวสม่ำเสมอทุก 3-5 นาที</li>
                      <li><span className="font-bold text-slate-800">PROM/SROM (น้ำเดิน):</span> น้ำคร่ำไหลจากช่องคลอดชัดเจน ต้องรับตรวจรวดเร็วเนื่องจากเสี่ยง Cord prolapse และการติดเชื้อ</li>
                      <li><span className="font-bold text-slate-800">Severe features:</span> BP &gt;= 140/90 mmHg ร่วมกับมีปวดหัวรุนแรง ตาพร่ามัว จุกแน่นลิ้นปี่</li>
                      <li><span className="font-bold text-slate-800">Bleeding:</span> เลือดสดไหลจากช่องคลอด</li>
                      <li><span className="font-bold text-slate-800">Fetal distress / ดิ้นลดลง:</span> FHS &lt; 110 หรือ &gt; 160 ครั้ง/นาที</li>
                    </ul>
                  </div>

                  <div className="space-y-2.5 bg-sky-50/30 border border-sky-100/50 rounded-xl p-4">
                    <h4 className="font-extrabold text-sky-700 text-sm flex items-center gap-1.5 border-b border-sky-100 pb-1.5">
                      🔵 เฝ้าสังเกตอาการ (Observe 2-4 ชม.)
                    </h4>
                    <ul className="text-sm text-slate-600 space-y-2.5 list-disc pl-4 leading-relaxed">
                      <li><span className="font-bold text-slate-800">Latent Phase / False Labor:</span> มดลูกหดตัวไม่สม่ำเสมอ ปากมดลูกเปิด &lt; 3 ซม. ให้เฝ้าสังเกตอาการ 2-4 ชม. ตรวจ NST หากปากมดลูกไม่ก้าวหน้าส่งกลับบ้านได้</li>
                      <li><span className="font-bold text-slate-800">Suspected PROM (สงสัยน้ำเดิน):</span> ตรวจ Speculum ไม่ยืนยัน ให้ใส่ Pad เดินประเมิน 1-2 ชม. แล้วตรวจซ้ำ</li>
                      <li><span className="font-bold text-slate-800">Mild BP Elevation:</span> พักนอนตะแคงซ้าย 30-60 นาที แล้วตรวจวัดความดันโลหิตซ้ำ</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'mgso4' && (
                <div className="space-y-3 bg-indigo-50/20 border border-indigo-100/40 rounded-xl p-4">
                  <h4 className="font-extrabold text-indigo-800 text-sm flex items-center gap-1.5 border-b border-indigo-100 pb-1.5">
                    <ShieldAlert size={16} className="text-indigo-600" />
                    มาตรฐานการเฝ้าระวังผู้ป่วยได้รับยา MgSO4
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 leading-relaxed">
                    <div className="space-y-1.5">
                      <p className="font-bold text-slate-800">✅ เกณฑ์ประเมินก่อนให้และขณะให้ยา (ทุก 1 ชม.):</p>
                      <ul className="list-disc pl-4 space-y-1.5">
                        <li><span className="font-bold">Deep Tendon Reflex (DTR):</span> ต้องเป็นบวก (+2 หรือมีอยู่)</li>
                        <li><span className="font-bold">Respiration Rate (RR):</span> ห้ามต่ำกว่า 14 ครั้ง/นาที</li>
                        <li><span className="font-bold">Urine Output:</span> ต้องได้มากกว่าหรือเท่ากับ 30 ml/ชั่วโมง</li>
                      </ul>
                    </div>
                    <div className="space-y-1.5">
                      <p className="font-bold text-rose-700">⚠️ อาการเป็นพิษ (Magnesium Toxicity):</p>
                      <ul className="list-disc pl-4 space-y-1.5 text-rose-600">
                        <li>สูญเสีย DTR (DTR absent)</li>
                        <li>หายใจช้าลง (RR &lt; 12 ครั้ง/นาที)</li>
                        <li>ปัสสาวะออกน้อยผิดปกติ (&lt; 30 ml/ชม.)</li>
                        <li><span className="font-bold text-rose-700">Antidote:</span> หากพบพิษ ให้หยุด MgSO4 ทันที และเตรียมยา <span className="font-bold underline">10% Calcium Gluconate 10 ml IV push ช้าๆ ใน 3 นาที</span></li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'tocolytic' && (
                <div className="space-y-3 bg-pink-50/20 border border-pink-100/40 rounded-xl p-4 text-sm text-slate-600 leading-relaxed">
                  <h4 className="font-extrabold text-pink-700 text-sm flex items-center gap-1.5 border-b border-pink-100 pb-1.5">
                    <Heart size={16} className="text-pink-600" />
                    การบริหารยายับยั้งครรภ์คลอด (Tocolytics)
                  </h4>
                  
                  <div className="space-y-4">
                    <div className="border-b border-pink-100/30 pb-3">
                      <p className="font-bold text-slate-800 text-[15px]">1. Adalat (Nifedipine 5mg) - แคลเซียมแชนแนลบล็อกเกอร์</p>
                      <p className="mt-1"><span className="font-bold text-slate-700">โดสแรกรับ:</span> กินครั้งละ 2 เม็ด (10 mg) ทุก 15 นาที ติดต่อกัน 4 ครั้ง (รวม 40 mg ใน 1 ชม.)</p>
                      <p className="mt-0.5"><span className="font-bold text-slate-700">โดสประคอง:</span> กินครั้งละ 4 เม็ด (20 mg) ทุก 6 ชม. (สูงสุดไม่เกิน 160 mg/วัน)</p>
                      <p className="mt-1.5 text-rose-600 font-bold bg-rose-50 border border-rose-100 p-2.5 rounded-lg text-xs">
                        ⚠️ สิ่งสำคัญ: ต้องวัดความดันโลหิตและชีพจรก่อนให้ยาทุกครั้ง ห้ามให้หากคนไข้มีภาวะความดันต่ำ
                      </p>
                    </div>
                    
                    <div>
                      <p className="font-bold text-slate-800 text-[15px]">2. Bricanyl (Terbutaline) - เบต้าทูอะโกนิสต์</p>
                      <p className="mt-1"><span className="font-bold text-slate-700">ฉีด SC:</span> 1/2 amp (0.25 mg) ฉีดใต้ผิวหนังทุก 4 ชม. สำหรับ 24 ชม.</p>
                      <p className="mt-0.5"><span className="font-bold text-slate-700">ดริป IV:</span> ผสม Bricanyl 10 amp ใน 5% D/W 500 ml ดริปเริ่มต้น 15 ml/ชม. ปรับเพิ่มขึ้นครั้งละ 15 ml ทุก 15 นาที</p>
                      <p className="mt-1.5 text-rose-600 font-bold bg-rose-50 border border-rose-100 p-2.5 rounded-lg text-xs">
                        ⚠️ สิ่งสำคัญ: ห้ามให้หรือห้ามปรับเพิ่มยาเด็ดขาดหากมารดามีชีพจร (Maternal Heart Rate) เกิน 120 ครั้ง/นาที หรือแจ้งอาการเจ็บแน่นหน้าอก
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'nst' && (
                <div className="space-y-3 bg-sky-50/20 border border-sky-100/40 rounded-xl p-4 text-sm text-slate-600 leading-relaxed">
                  <h4 className="font-extrabold text-sky-700 text-sm flex items-center gap-1.5 border-b border-sky-100 pb-1.5">
                    <Info size={16} className="text-sky-600" />
                    หลักการอ่านกราฟ NST และอัตราการเต้นหัวใจทารก (FHS)
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="font-bold text-slate-800">🟢 NST - Reactive (ปกติ):</p>
                      <ul className="list-disc pl-4 space-y-1 mt-1">
                        <li>FHR Baseline อยู่ระหว่าง 110 - 160 ครั้ง/นาที</li>
                        <li>มี Accelerations (อัตราหัวใจเร่งสูงขึ้นอย่างน้อย 15 bpm นาน 15 วินาที) อย่างน้อย 2 ครั้งใน 20 นาที</li>
                      </ul>
                    </div>
                    
                    <div>
                      <p className="font-bold text-rose-700">🚨 NST - Non-reactive หรือ Fetal Distress (เสี่ยงอันตราย):</p>
                      <ul className="list-disc pl-4 space-y-1 text-rose-600 mt-1">
                        <li>ไม่มี Accelerations เลยในช่วงการทดสอบ 40 นาที</li>
                        <li>มี Late Decelerations (อัตราหัวใจทารกเต้นช้าลงตามหลังจุดบีบตัวของมดลูก) หรือ Severe Variable Decelerations</li>
                        <li><span className="font-bold text-slate-800">วิธีแก้ไขกู้ชีพในมดลูก (Intrauterine Resuscitation):</span> จัดท่ามารดานอนตะแคงซ้ายทันที, ให้ออกซิเจนกึ่งครอบจมูก 8-10 L/min, โหลดสารน้ำ IVF, หยุดยาเร่งคลอด Oxytocin ทันที และรีบแจ้งแพทย์</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'psychology' && (
                <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
                  {/* Dilation guidelines */}
                  <div className="bg-pink-50/20 border border-pink-100/40 rounded-xl p-4 space-y-2.5">
                    <h4 className="font-extrabold text-pink-700 text-sm flex items-center gap-1.5 border-b border-pink-100 pb-1.5">
                      💬 การสื่อสารตามความก้าวหน้าปากมดลูก (Cervical Progression Guide)
                    </h4>
                    <div className="divide-y divide-pink-100/30 space-y-3">
                      <div className="pt-3 first:pt-0">
                        <span className="font-bold text-slate-800 text-[14px]">1. ระยะเริ่มต้น (Latent Phase - ปากมดลูกเปิด 1-3 ซม.):</span>
                        <p className="mt-1 text-slate-500 text-sm">
                          <span className="font-bold text-slate-700">อารมณ์:</span> คุณแม่อาจรู้สึกตื่นเต้น กังวล เจ็บน้อยคล้ายประจำเดือน ทนปวดได้ดี
                          <br />
                          <span className="font-bold text-indigo-600">จิตวิทยา & คำแนะนำ:</span> กระตุ้นให้พักผ่อนเก็บพลังงานไว้ ไม่เบ่งโดยไม่จำเป็น, เดินแกว่งสะโพกสลับนอนตะแคงซ้าย, ฝึกหายใจเข้าลึก ๆ ช้า ๆ ท้องพอง ลมหายใจออกยาว ๆ (Slow Chest Breathing) เพื่อลดความตึงเครียด
                        </p>
                      </div>
                      <div className="pt-3">
                        <span className="font-bold text-slate-800 text-[14px]">2. ระยะเร่ง (Active Phase - ปากมดลูกเปิด 4-7 ซม.):</span>
                        <p className="mt-1 text-slate-500 text-sm">
                          <span className="font-bold text-slate-700">อารมณ์:</span> ปวดท้องถี่ขึ้น ทุก 3-5 นาที เริ่มทนไม่ไหว พูดน้อยลง กังวล หวาดกลัว
                          <br />
                          <span className="font-bold text-indigo-600">จิตวิทยา & คำแนะนำ:</span> ให้กำลังใจเชิงบวกเสมอ พูดชมเชย ("คุณแม่ทำได้ดีมากเลยค่ะ"), ช่วยลูบหลังเพื่อบล็อกกระแสประสาทความเจ็บปวด (Gate Control Theory), แนะนำให้เปลี่ยนมาหายใจตื้นเร็วเบา ๆ (He-He-Who Breathing) เมื่อเริ่มมีอาการเกร็ง
                        </p>
                      </div>
                      <div className="pt-3">
                        <span className="font-bold text-slate-800 text-[14px]">3. ระยะเปลี่ยนผ่าน (Transition Phase - ปากมดลูกเปิด 8-10 ซม.):</span>
                        <p className="mt-1 text-slate-500 text-sm">
                          <span className="font-bold text-slate-700">อารมณ์:</span> ปวดรุนแรงที่สุด มีอารมณ์ฉุนเฉียว หงุดหงิด สับสน หรือร้องไห้หมดกำลังใจ (เกิดจากฮอร์โมนแปรปรวนขั้นสุด)
                          <br />
                          <span className="font-bold text-indigo-600">จิตวิทยา & คำแนะนำ:</span> พยาบาลต้องคงน้ำเสียงที่นิ่ง มั่นคง และชัดเจน บอกคุณแม่ว่า "เจ็บสุด ๆ แสดงว่ามดลูกทำงานได้ดีมาก อีกนิดเดียวจะได้เจอกันแล้วนะ", <span className="text-rose-600 font-bold underline">ห้ามคุณแม่เบ่งเด็ดขาดจนกว่าปากมดลูกจะเปิดครบ 10 ซม. (ป้องกันปากมดลูกบวม/ฉีกขาด)</span> สอนคุณแม่ให้ใช้วิธีเป่าลมออกทางปากยาว ๆ (Blow-blow-blow) เมื่อมดลูกเริ่มปั้นรัด
                        </p>
                      </div>
                      <div className="pt-3">
                        <span className="font-bold text-slate-800 text-[14px]">4. ระยะเบ่ง (Stage 2 - ปากมดลูกเปิดครบ 10 ซม.):</span>
                        <p className="mt-1 text-slate-500 text-sm">
                          <span className="font-bold text-slate-700">อารมณ์:</span> รู้สึกอยากเบ่งเต็มที่ เหนื่อยล้าและใช้พลังงานมหาศาล
                          <br />
                          <span className="font-bold text-indigo-600">จิตวิทยา & คำแนะนำ:</span> ให้จังหวะเบ่งที่มั่นใจ สอนท่าทางที่ถูกต้อง: คางชิดอก มือจับเหล็กข้างเตียง ดึงเข้าหาตัว สูดลมหายใจเข้าลึก ๆ แล้วก้มหน้าเบ่งลงล่าง (ห้ามร้องครางเสียเสียงเปล่า) ชื่นชมทุกรอบเพื่อเพิ่มพลังใจคุณแม่
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* C/S Risks */}
                  <div className="bg-sky-50/20 border border-sky-100/40 rounded-xl p-4 space-y-2.5">
                    <h4 className="font-extrabold text-sky-800 text-sm flex items-center gap-1.5 border-b border-sky-100 pb-1.5">
                      ⚠️ วิธีแจ้งความเสี่ยงการผ่าตัดคลอด (C/S Risk & Communication)
                    </h4>
                    <p className="text-slate-500 text-sm">
                      <span className="font-bold text-slate-700">หลักจิตวิทยา:</span> ห้ามขู่ให้กลัวเด็ดขาด แต่ต้องชี้แจงความเป็นจริงอย่างอ่อนโยน สุภาพ และเน้นว่าเป็นการตัดสินใจเพื่อความปลอดภัยสูงสุดของทั้งแม่และลูก (Benefit Outweighs Risk)
                      <br />
                      <span className="font-bold text-slate-700">ประเด็นความเสี่ยงที่ต้องแจ้งแบบสร้างสรรค์:</span>
                    </p>
                    <ul className="list-disc pl-4 space-y-2 text-slate-500 text-sm leading-relaxed">
                      <li><span className="font-bold text-slate-700">การดูแลหลังผ่าตัด:</span> คุณแม่อาจรู้สึกปวดแผลหน้าท้องและฟื้นตัวช้ากว่าคลอดปกติเล็กน้อยในช่วง 1-2 วันแรก แต่ในห้องผ่าตัดจะมียาแก้ปวดประสิทธิภาพสูงคอยช่วยพยุงอาการให้ค่ะ</li>
                      <li><span className="font-bold text-slate-700">การบล็อกหลัง (Spinal Anesthesia):</span> คุณแม่อาจรู้สึกหนาวสั่น ปัสสาวะลำบากชั่วคราว หรือปวดศีรษะหลังยาหมดฤทธิ์ ซึ่งวิสัญญีแพทย์จะคอยตรวจเช็กและดูแลความสบายตลอดการผ่าตัด</li>
                      <li><span className="font-bold text-slate-700">การเสียเลือดและพังผืด:</span> การเสียเลือดมากกว่าคลอดธรรมชาติเล็กน้อยตามปกติของการผ่าตัดช่องท้อง และอาจมีพังผืดในช่องท้องบ้างในระยะยาว แต่แพทย์ผู้ผ่าตัดจะทำอย่างประณีตและระมัดระวังที่สุดค่ะ</li>
                    </ul>
                    <div className="p-3 bg-sky-100/40 border border-sky-200/30 rounded-xl text-sky-900 font-bold italic text-center text-sm">
                      "การผ่าตัดในครั้งนี้เป็นหนทางที่ทีมแพทย์วิเคราะห์แล้วว่าปลอดภัยที่สุดสำหรับตัวคุณแม่และน้องค่ะ ทีมกุมารแพทย์พร้อมสแตนบายรอน้องทันทีที่คลอดออกมารับประกันความปลอดภัยค่ะ"
                    </div>
                  </div>

                  {/* Admit Guidelines */}
                  <div className="bg-indigo-50/20 border border-indigo-100/40 rounded-xl p-4 space-y-2.5">
                    <h4 className="font-extrabold text-indigo-800 text-sm flex items-center gap-1.5 border-b border-indigo-100 pb-1.5">
                      🏥 วิธีให้คำแนะนำคุณแม่แรกรับ Admit (Admit Orientation & Reassurance)
                    </h4>
                    <div className="text-slate-500 space-y-2.5 leading-relaxed text-sm">
                      <p>
                        <span className="font-bold text-slate-700">หลักจิตวิทยา:</span> มารดาแรกรับมักมีความวิตกกังวลสูงจากสภาพแวดล้อมที่ไม่คุ้นเคยและเสียงร้องของเตียงข้าง ๆ การสร้างสัมพันธภาพ (Rapport) แนะนำตัวเอง แนะนำสถานที่ และอธิบายขั้นตอนอย่างสั้น ๆ จะช่วยลดฮอร์โมนความเครียด (Cortisol) ซึ่งจะช่วยให้มดลูกหดรัดตัวได้ดีขึ้น
                      </p>
                      <ul className="list-decimal pl-4 space-y-2">
                        <li><span className="font-bold text-slate-700">แนะนำตัวและสร้างความเป็นมิตร:</span> "สวัสดีค่ะคุณแม่ หมอเวรพิจารณารับคุณแม่นอนรอคลอดนะคะ วันนี้พยาบาล [ชื่อ] จะเป็นผู้ดูแลตลอดเวรนี้ค่ะ มีเรื่องปวดท้องหรือกังวลตรงไหนบอกพยาบาลได้ตลอดนะคะ"</li>
                        <li><span className="font-bold text-slate-700">อธิบายขั้นตอนแรกรับสั้น ๆ:</span> "เดี๋ยวพยาบาลจะขอให้คุณแม่เปลี่ยนชุด ตรวจเช็กสัญญาณชีพเจาะเลือด และติดสายรัดหน้าท้องเพื่อเช็กอัตราเต้นหัวใจของน้องกับประเมินจังหวะการบีบตัวของมดลูกประมาณ 30 นาทีนะคะ"</li>
                        <li><span className="font-bold text-slate-700">ปูพื้นฐานเรื่องสถานที่และปุ่มเรียก:</span> แนะนำตำแหน่งห้องน้ำ วิธีใช้ปุ่มกดเรียกพยาบาลฉุกเฉินข้างเตียง และแนะนำสิทธิ์ญาติในการเฝ้าไข้เพื่อสร้างความอุ่นใจ</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="text-center pt-2 border-t border-slate-100">
              <button
                onClick={() => setGuideOpen(false)}
                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all active:scale-95"
              >
                เข้าใจแล้ว
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
