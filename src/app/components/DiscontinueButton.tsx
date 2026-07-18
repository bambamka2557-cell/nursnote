'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { discontinueOrder } from '@/app/actions/order';

// Confirmation wrapper for discontinuing an order. Discontinuing hard-deletes
// the order AND (via cascade) its eventLogs — i.e. the record that the drug was
// ever given disappears from the handover note. That's destructive and easy to
// trigger by an accidental tap on a phone, so it must be confirmed, and the
// prompt states plainly that the history is removed. Uses an in-app modal
// (matching the MgSO4 checklist modal's style) instead of window.confirm(),
// which renders as a plain unstyled browser dialog.
export default function DiscontinueButton({
  orderId,
  orderName,
}: {
  orderId: string;
  orderName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const onConfirm = async () => {
    setBusy(true);
    try {
      await discontinueOrder(orderId);
      router.refresh();
      setOpen(false);
    } catch {
      alert('หยุดการเตือนไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 border border-rose-100/50"
      >
        หยุดการเตือน
      </button>

      {open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl space-y-5 animate-in slide-in-from-bottom duration-250">
            <div className="flex items-start gap-3 text-rose-600">
              <div className="w-11 h-11 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div className="pt-1">
                <h3 className="font-extrabold text-lg text-slate-900">หยุดการเตือน?</h3>
                <p className="text-sm font-semibold text-slate-600 mt-0.5">&ldquo;{orderName}&rdquo;</p>
              </div>
            </div>

            <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-3.5">
              <p className="text-xs text-rose-700 leading-relaxed">
                รายการนี้และประวัติการให้ยา/ประเมินของรายการนี้จะถูกลบออกจากระบบ
                <span className="font-bold">อย่างถาวร</span> (รวมถึงบันทึกที่จะแสดงในสรุปส่งเวร)
                <br />
                <span className="font-bold">ย้อนกลับไม่ได้</span>
              </p>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={busy}
                className="flex-1 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl text-sm hover:bg-slate-50 active:scale-98 transition-all disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={busy}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-sm active:scale-98 transition-all disabled:opacity-60"
              >
                {busy ? 'กำลังหยุด...' : 'ยืนยัน หยุดการเตือน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
