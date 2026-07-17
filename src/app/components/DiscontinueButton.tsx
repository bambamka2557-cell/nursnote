'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { discontinueOrder } from '@/app/actions/order';

// Confirmation wrapper for discontinuing an order. Discontinuing hard-deletes
// the order AND (via cascade) its eventLogs — i.e. the record that the drug was
// ever given disappears from the handover note. That's destructive and easy to
// trigger by an accidental tap on a phone, so it must be confirmed, and the
// prompt states plainly that the history is removed.
export default function DiscontinueButton({
  orderId,
  orderName,
}: {
  orderId: string;
  orderName: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    const ok = window.confirm(
      `หยุดการเตือน "${orderName}" ?\n\n` +
        'รายการนี้และประวัติการให้ยา/ประเมินของรายการนี้จะถูกลบออกจากระบบอย่างถาวร ' +
        '(รวมถึงบันทึกที่จะแสดงในสรุปส่งเวร) — ย้อนกลับไม่ได้'
    );
    if (!ok) return;
    setBusy(true);
    try {
      await discontinueOrder(orderId);
      router.refresh();
    } catch {
      alert('หยุดการเตือนไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 border border-rose-100/50 disabled:opacity-50"
    >
      {busy ? 'กำลังหยุด...' : 'หยุดการเตือน'}
    </button>
  );
}
