import { getPatients } from './actions/patient';
import Link from 'next/link';
import { Clock, CheckCircle2, AlertCircle, Plus } from 'lucide-react';
import { differenceInMinutes, addMinutes, format } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const patients = await getPatients();

  if (patients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-2xl mb-4">
          🛏️
        </div>
        <p className="font-medium text-slate-500">ยังไม่มีผู้ป่วยในระบบ</p>
        <p className="text-xs text-slate-400 mt-1">รับผู้ป่วยใหม่เพื่อเริ่มการติดตาม</p>
        <Link 
          href="/add" 
          className="mt-6 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-md shadow-indigo-100 flex items-center gap-2 transition-all duration-200"
        >
          <Plus size={18} />
          รับผู้ป่วยใหม่
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">แผงควบคุมเตียง</h1>
          <p className="text-xs text-slate-500 mt-0.5">ติดตามสถานะความเร่งด่วนของแต่ละเตียง</p>
        </div>
        <Link 
          href="/add" 
          className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-all"
        >
          <Plus size={20} />
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {patients.map(patient => {
          let nextTask: any = null;
          let minMinutesLeft = Infinity;

          patient.orders.forEach(order => {
            if (!order.intervalMinutes) return;
            
            const lastEvent = order.eventLogs[0];
            const startTime = lastEvent ? lastEvent.doneAt : order.startTime;
            
            const nextDueTime = addMinutes(startTime, order.intervalMinutes);
            const minutesLeft = differenceInMinutes(nextDueTime, new Date());

            if (minutesLeft < minMinutesLeft) {
              minMinutesLeft = minutesLeft;
              nextTask = {
                name: order.name,
                time: format(nextDueTime, 'HH:mm'),
                minutesLeft
              };
            }
          });

          // Style definitions
          let cardBorder = 'border-slate-100';
          let statusBg = 'bg-emerald-50 text-emerald-700';
          let statusLabel = 'ปกติ';
          let pulseClass = '';

          if (nextTask) {
            if (nextTask.minutesLeft < 0) {
              cardBorder = 'border-rose-200 bg-rose-50/20';
              statusBg = 'bg-rose-500 text-white';
              statusLabel = 'เลยเวลา!';
              pulseClass = 'pulse-overdue';
            } else if (nextTask.minutesLeft <= 15) {
              cardBorder = 'border-amber-200 bg-amber-50/10';
              statusBg = 'bg-amber-100 text-amber-800';
              statusLabel = 'ใกล้ถึงเวลา';
            } else {
              cardBorder = 'border-slate-100 bg-white';
              statusBg = 'bg-indigo-50 text-indigo-700';
              statusLabel = 'คิวต่อไป';
            }
          } else {
            cardBorder = 'border-slate-100 bg-white';
            statusBg = 'bg-slate-100 text-slate-600';
            statusLabel = 'ไม่มีงาน';
          }

          return (
            <Link key={patient.id} href={`/patient/${patient.id}/report`} className="block">
              <div className={`border rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] active:scale-[0.99] ${cardBorder} ${pulseClass}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase font-extrabold tracking-wider px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md border border-indigo-200/50">
                        BED {patient.bedNumber}
                      </span>
                      <span className="font-semibold text-slate-800 text-lg">{patient.nickname}</span>
                    </div>
                    {patient.dx && (
                      <p className="text-xs text-slate-500 mt-2 line-clamp-1 bg-slate-50 p-1.5 rounded-lg border border-slate-100/50">
                        <span className="font-medium text-slate-700">Dx:</span> {patient.dx}
                      </p>
                    )}
                  </div>
                  
                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${statusBg}`}>
                    {statusLabel}
                  </span>
                </div>
                
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
                  {nextTask ? (
                    <div className="flex items-center gap-2">
                      {nextTask.minutesLeft < 0 ? (
                        <AlertCircle size={16} className="text-rose-500" />
                      ) : (
                        <Clock size={16} className="text-indigo-500" />
                      )}
                      <span className="font-bold text-slate-800">{nextTask.time} น.</span>
                      <span className="text-slate-500 truncate max-w-[180px]">- {nextTask.name}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-emerald-600 font-medium">
                      <CheckCircle2 size={16} />
                      <span>ไม่มีงานรออยู่</span>
                    </div>
                  )}

                  {nextTask && (
                    <span className={`text-xs font-semibold ${nextTask.minutesLeft < 0 ? 'text-rose-600 font-bold' : nextTask.minutesLeft <= 15 ? 'text-amber-600' : 'text-slate-400'}`}>
                      {nextTask.minutesLeft < 0 
                        ? `ช้ากว่ากำหนด ${Math.abs(nextTask.minutesLeft)} น.` 
                        : `อีก ${nextTask.minutesLeft} น.`
                      }
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
