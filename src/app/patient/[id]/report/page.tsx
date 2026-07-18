import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ChevronLeft, Copy, Trash2, UserMinus } from 'lucide-react';
import { notFound } from 'next/navigation';
import { formatInTimeZone } from 'date-fns-tz';

// Server Component — see src/app/page.tsx for why this can't just be
// date-fns' format() (Vercel's server isn't in Asia/Bangkok, and TZ is a
// reserved env var name Vercel won't let us override).
const format = (date: Date | number, fmt: string) => formatInTimeZone(date, 'Asia/Bangkok', fmt);
import { dischargePatient } from '@/app/actions/patient';
import { redirect } from 'next/navigation';
import CopyButton from '@/app/components/CopyButton';
import DiscontinueButton from '@/app/components/DiscontinueButton';

export const dynamic = 'force-dynamic';

export default async function HandoverReport({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      orders: {
        include: {
          eventLogs: {
            orderBy: { doneAt: 'desc' },
          },
        },
      },
    },
  });

  if (!patient) return notFound();

  // Format Handover Note (iCHART compatible)
  let reportText = `[สรุปส่งเวร LR] เตียง ${patient.bedNumber} (${patient.nickname})\n`;
  if (patient.dx) reportText += `Dx: ${patient.dx}\n`;
  if (patient.initialNote) reportText += `แรกรับ:\n${patient.initialNote}\n`;
  
  reportText += `\n[บันทึกการดูแล/ให้ยาล่าสุด]\n`;
  
  const allLogs: {
    name: string;
    doneAt: Date;
    rr: number | null;
    urineOutput: number | null;
    reflex: string | null;
  }[] = [];
  patient.orders.forEach(order => {
    order.eventLogs.forEach(log => {
      allLogs.push({
        name: order.name,
        doneAt: log.doneAt,
        rr: log.rr,
        urineOutput: log.urineOutput,
        reflex: log.reflex,
      });
    });
  });

  allLogs.sort((a, b) => b.doneAt.getTime() - a.doneAt.getTime()); // newest first for handover notes

  if (allLogs.length === 0) {
    reportText += `- ยังไม่มีประวัติการดูแลในรอบเวรนี้`;
  } else {
    allLogs.forEach(log => {
      reportText += `- ${format(log.doneAt, 'HH:mm')} น. : ${log.name}`;
      if (log.rr !== null || log.urineOutput !== null || log.reflex !== null) {
        reportText += ` (RR ${log.rr ?? '-'}, Urine ${log.urineOutput ?? '-'}ml/hr, DTR ${log.reflex ?? '-'})`;
      }
      reportText += `\n`;
    });
  }

  const handleDischarge = async () => {
    'use server';
    await dischargePatient(patient.id);
    redirect('/');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/" className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-all">
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">ส่งเวร เตียง {patient.bedNumber}</h1>
          <p className="text-xs text-slate-500 mt-0.5">{patient.nickname}</p>
        </div>
      </div>

      {/* Active Orders List with Discontinue Controls */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
        <h2 className="text-lg font-bold text-slate-800 border-b border-slate-50 pb-2.5 flex items-center justify-between">
          <span>คำสั่งการรักษาที่ยังแจ้งเตือนอยู่ (Active Alerts)</span>
          <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-medium">
            {patient.orders.length} รายการ
          </span>
        </h2>
        
        {patient.orders.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">ไม่มีรายการเตือนภัยใด ๆ ในขณะนี้</p>
        ) : (
          <div className="divide-y divide-slate-50">
            {patient.orders.map(order => (
              <div key={order.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md border ${
                    order.type === 'MEDICATION' 
                      ? 'bg-pink-50 text-pink-700 border-pink-100' 
                      : 'bg-sky-50 text-sky-700 border-sky-100'
                  }`}>
                    {order.type === 'MEDICATION' ? 'MED' : 'CHECK'}
                  </span>
                  <span className="text-sm font-bold text-slate-800 ml-2">{order.name}</span>
                  <p className="text-[10px] text-slate-400 ml-10 mt-1">
                    เตือนทุก {order.intervalMinutes} นาที (กำหนดเริ่มเมื่อ {format(order.startTime, 'HH:mm')} น.)
                  </p>
                </div>
                
                <DiscontinueButton orderId={order.id} orderName={order.name} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report Box */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">iCHART TEXT BLOCK</span>
          <CopyButton text={reportText} />
        </div>
        
        <textarea 
          readOnly 
          className="w-full h-80 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs leading-relaxed text-slate-700 focus:outline-hidden resize-none"
          value={reportText}
        />
      </div>

      {/* Discharge Form */}
      <div className="pt-4">
        <form action={handleDischarge}>
          <button 
            type="submit" 
            className="w-full py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-99"
          >
            <UserMinus size={18} />
            จำหน่ายผู้ป่วย (ลบข้อมูลออกจากระบบ)
          </button>
        </form>
        <p className="text-center text-[10px] text-slate-400 mt-2">
          *การกดจำหน่ายจะเป็นการล้างประวัติของเตียงนี้ทั้งหมดอย่างถาวรเพื่อความปลอดภัยของข้อมูลผู้ป่วย (PHI)
        </p>
      </div>
    </div>
  );
}
