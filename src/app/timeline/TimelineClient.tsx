'use client';

import { useEffect, useRef, useState } from 'react';
import { getPatients } from '../actions/patient';
import { logEvent } from '../actions/order';
import { Check, AlertTriangle, Sparkles, Info } from 'lucide-react';
import { addMinutes, differenceInMinutes, format } from 'date-fns';
import { PRESET_MEDICATIONS } from '@/app/utils/drugData';

function computeTasks(patients: any[]) {
  const upcomingTasks: any[] = [];

  patients.forEach(patient => {
    patient.orders.forEach((order: any) => {
      if (!order.intervalMinutes) return;

      const lastEvent = order.eventLogs[0];
      const startTime = lastEvent ? lastEvent.doneAt : order.startTime;
      const nextDueTime = addMinutes(startTime, order.intervalMinutes);
      const minutesLeft = differenceInMinutes(nextDueTime, new Date());

      if (minutesLeft <= 120) {
        upcomingTasks.push({
          id: order.id + '-' + nextDueTime.getTime(),
          orderId: order.id,
          patientId: patient.id,
          bedNumber: patient.bedNumber,
          nickname: patient.nickname,
          name: order.name,
          dueTime: nextDueTime,
          minutesLeft,
          isMgso4: order.name.includes('MgSO4'),
        });
      }
    });
  });

  upcomingTasks.sort((a, b) => Math.sign(a.minutesLeft - b.minutesLeft));
  return upcomingTasks;
}

export default function TimelineClient({ initialPatients }: { initialPatients: any[] }) {
  // Seeded from the server-rendered initial fetch — no loading spinner on
  // first paint, unlike the old client-only useEffect fetch.
  const [tasks, setTasks] = useState<any[]>(() => computeTasks(initialPatients));
  // Bug found in testing: the check button had no busy state, so a nurse
  // tapping it a few times (nothing visibly happens until the round-trip
  // completes) fired one logEvent() per tap — 13 duplicate rows landed in
  // the DB for one order within 6 seconds. submittingOrderId drives the
  // disabled/spinner UI, but React state updates are batched/async, so a
  // burst of clicks within the same tick can all read the state before any
  // of them re-renders — verified this by clicking 5x programmatically and
  // getting 5 duplicate rows despite the state guard. submittingRef is a
  // second, synchronous gate that closes on the very first call.
  const [submittingOrderId, setSubmittingOrderId] = useState<string | null>(null);
  const submittingRef = useRef<string | null>(null);

  // Modal states for MgSO4
  const [mgso4ModalOpen, setMgso4ModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<any>(null);

  // MgSO4 form
  const [rr, setRr] = useState('');
  const [urine, setUrine] = useState('');
  const [reflex, setReflex] = useState('');

  const loadTasks = async () => {
    const patients = await getPatients();
    setTasks(computeTasks(patients));
  };

  useEffect(() => {
    const interval = setInterval(loadTasks, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleDone = async (task: any) => {
    if (task.isMgso4) {
      setActiveTask(task);
      setMgso4ModalOpen(true);
      return;
    }
    if (submittingRef.current === task.orderId) return; // already in flight

    submittingRef.current = task.orderId;
    setSubmittingOrderId(task.orderId);
    try {
      await logEvent(task.orderId, new Date());
      await loadTasks();
    } finally {
      submittingRef.current = null;
      setSubmittingOrderId(null);
    }
  };

  const submitMgso4 = async () => {
    if (!rr || !urine || !reflex) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    if (submittingRef.current === activeTask.orderId) return; // already in flight

    submittingRef.current = activeTask.orderId;
    setSubmittingOrderId(activeTask.orderId);
    try {
      await logEvent(activeTask.orderId, new Date(), {
        rr: parseInt(rr, 10),
        urineOutput: parseInt(urine, 10),
        reflex,
      });
    } finally {
      submittingRef.current = null;
      setSubmittingOrderId(null);
    }

    setMgso4ModalOpen(false);
    setRr('');
    setUrine('');
    setReflex('');
    loadTasks();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">คิวงานวันนี้</h1>
        <p className="text-xs text-slate-500 mt-0.5">รวมประเมินและให้ยาที่ต้องทำภายใน 2 ชั่วโมง</p>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-slate-400 bg-white border border-dashed border-slate-200 rounded-2xl p-8">
          <Sparkles size={28} className="text-indigo-400 mb-2" />
          <p className="font-semibold text-sm text-slate-500">ไม่มีคิวงานค้างอยู่</p>
          <p className="text-xs text-slate-400 text-center mt-1">ยินดีด้วย! คุณเคลียร์งานทั้งหมดเรียบร้อยแล้ว</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => {
            const isOverdue = task.minutesLeft < 0;
            const isWarning = task.minutesLeft >= 0 && task.minutesLeft <= 15;

            let cardBorder = 'border-slate-100 bg-white';
            let iconColor = 'text-indigo-500 bg-indigo-50';
            let btnClass = 'bg-slate-900 text-white hover:bg-slate-800';
            let badgeClass = 'bg-indigo-50 text-indigo-700';

            if (isOverdue) {
              cardBorder = 'border-rose-100 bg-rose-50/20';
              iconColor = 'text-rose-600 bg-rose-50';
              btnClass = 'bg-rose-600 text-white hover:bg-rose-700';
              badgeClass = 'bg-rose-100 text-rose-800 font-bold';
            } else if (isWarning) {
              cardBorder = 'border-amber-100 bg-amber-50/20';
              iconColor = 'text-amber-600 bg-amber-50';
              btnClass = 'bg-amber-600 text-white hover:bg-amber-700';
              badgeClass = 'bg-amber-100 text-amber-800';
            }

            return (
              <div
                key={task.id}
                className={`border rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.01)] transition-all flex items-center justify-between gap-4 ${cardBorder}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-black px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-md border border-indigo-200/50">
                      เตียง {task.bedNumber}
                    </span>
                    <span className="text-xs font-semibold text-slate-600 truncate">{task.nickname}</span>
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-lg mt-1.5 truncate">{task.name}</h3>

                  {/* Collapsible Guideline for high-alert drugs */}
                  {(() => {
                    const guide = PRESET_MEDICATIONS.find(m => m.name === task.name);
                    if (!guide) return null;
                    return (
                      <details className="mt-2 group">
                        <summary className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer list-none flex items-center gap-1 select-none">
                          <Info size={12} />
                          <span>สูตรผสมและวิธีใช้</span>
                        </summary>
                        <div className="mt-1.5 p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] space-y-1 text-slate-500 max-w-sm">
                          <div><span className="font-bold text-slate-600">โดส:</span> {guide.dose}</div>
                          <div><span className="font-bold text-slate-600">ผสม:</span> {guide.mix}</div>
                          <div className="text-rose-600 font-medium"><span className="font-bold">ระวัง:</span> {guide.warning}</div>
                        </div>
                      </details>
                    );
                  })()}

                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${badgeClass}`}>
                      {format(task.dueTime, 'HH:mm')} น.
                    </span>
                    <span className={`text-xs ${isOverdue ? 'text-rose-600 font-bold' : isWarning ? 'text-amber-600 font-medium' : 'text-slate-400'}`}>
                      {isOverdue ? `เลยเวลา ${Math.abs(task.minutesLeft)} นาที!` : `อีก ${task.minutesLeft} นาที`}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleDone(task)}
                  disabled={submittingOrderId === task.orderId}
                  className={`w-14 h-14 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all shrink-0 disabled:opacity-60 disabled:active:scale-100 ${btnClass}`}
                >
                  {submittingOrderId === task.orderId ? (
                    <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <Check size={24} strokeWidth={3} />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* MgSO4 Checklist Modal */}
      {mgso4ModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-250">
            <div className="flex items-start gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">บันทึกการประเมิน MgSO4</h3>
                <p className="text-xs text-slate-500 mt-0.5">เตียง {activeTask?.bedNumber} ({activeTask?.nickname})</p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Respiration Rate (RR) / min</label>
                <input
                  type="text"
                  value={rr}
                  onChange={e => setRr(e.target.value)}
                  placeholder="เช่น 18, 20 (ปกติ >= 14)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:outline-hidden text-sm transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Urine Output in last hour (ml)</label>
                <input
                  type="text"
                  value={urine}
                  onChange={e => setUrine(e.target.value)}
                  placeholder="เช่น 50, 100 (ปกติ >= 30ml/hr)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:outline-hidden text-sm transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Deep Tendon Reflex (DTR)</label>
                <select
                  value={reflex}
                  onChange={e => setReflex(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:outline-hidden text-sm transition-all"
                >
                  <option value="" disabled>เลือกผลการประเมิน...</option>
                  <option value="2+">2+ (ปกติ / Normal)</option>
                  <option value="1+">1+ (ลดลง / Decreased)</option>
                  <option value="0">0 (ไม่มี / Absent - อันตราย!)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button
                className="flex-1 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl text-sm hover:bg-slate-50 active:scale-98 transition-all disabled:opacity-50"
                onClick={() => setMgso4ModalOpen(false)}
                disabled={submittingOrderId === activeTask?.orderId}
              >
                ยกเลิก
              </button>
              <button
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm active:scale-98 transition-all disabled:opacity-60"
                onClick={submitMgso4}
                disabled={submittingOrderId === activeTask?.orderId}
              >
                {submittingOrderId === activeTask?.orderId ? 'กำลังบันทึก...' : 'บันทึกสำเร็จ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
