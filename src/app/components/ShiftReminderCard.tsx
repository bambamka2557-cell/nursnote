'use client';

import { useEffect, useState } from 'react';
import { Bell, Send } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';
import type { DayShiftData } from '@/app/utils/shiftData';
import { addDaysToDateStr, buildShiftReminderPayload } from '@/app/utils/shiftReminderText';
import { getShiftsByDateRange } from '@/app/actions/shift';
import {
  getShiftReminderSetting,
  saveShiftReminderSetting,
  sendShiftReminderTest,
} from '@/app/actions/shiftReminder';
import { subscribeToPush } from '@/lib/pushClient';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];
const pad = (n: number) => String(n).padStart(2, '0');

// Settings + live preview for the evening "tomorrow's shift" push.
// `shifts` (optional) only re-triggers the preview fetch when a calendar on the
// same screen changes; the settings page renders it without one.
export default function ShiftReminderCard({ shifts }: { shifts?: DayShiftData[] } = {}) {
  const [enabled, setEnabled] = useState(true);
  const [hour, setHour] = useState(18);
  const [minute, setMinute] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [testing, setTesting] = useState(false);
  const [tomorrowDay, setTomorrowDay] = useState<DayShiftData | null | undefined>(undefined);

  const tomorrow = addDaysToDateStr(formatInTimeZone(new Date(), 'Asia/Bangkok', 'yyyy-MM-dd'), 1);

  useEffect(() => {
    getShiftReminderSetting().then((s) => {
      setEnabled(s.enabled);
      setHour(s.hour);
      setMinute(s.minute);
      setLoaded(true);
    });
  }, []);

  // Re-read tomorrow whenever the calendar's data changes (shift added/edited).
  useEffect(() => {
    let alive = true;
    getShiftsByDateRange(tomorrow, tomorrow)
      .then((rows) => alive && setTomorrowDay(rows[0] ?? null))
      .catch(() => alive && setTomorrowDay(null));
    return () => {
      alive = false;
    };
  }, [shifts, tomorrow]);

  const save = async (next: { enabled: boolean; hour: number; minute: number }) => {
    setEnabled(next.enabled);
    setHour(next.hour);
    setMinute(next.minute);
    const r = await saveShiftReminderSetting(next);
    setMsg(r.success ? { text: 'บันทึกแล้ว', ok: true } : { text: r.error ?? 'บันทึกไม่สำเร็จ', ok: false });
  };

  const sendTest = async () => {
    setTesting(true);
    setMsg(null);
    try {
      if (!('Notification' in window)) {
        setMsg({ text: 'เครื่องนี้ไม่รองรับการแจ้งเตือน (iPhone ต้องเพิ่มแอปไว้ที่หน้าจอโฮมก่อน)', ok: false });
        return;
      }
      let perm = Notification.permission;
      if (perm === 'default') perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        setMsg({ text: 'ยังไม่ได้อนุญาตการแจ้งเตือน — เปิดสิทธิ์ในตั้งค่าของเครื่องก่อน', ok: false });
        return;
      }
      await subscribeToPush();
      const r = await sendShiftReminderTest();
      if (r.status === 'sent' && (r.pushesSent ?? 0) > 0) {
        setMsg({ text: `ส่งแล้ว ${r.pushesSent} เครื่อง — ดูที่แจ้งเตือนของเครื่องได้เลย`, ok: true });
      } else if (r.status === 'sent') {
        setMsg({ text: 'ส่งไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', ok: false });
      } else if (r.status === 'no-shift-entered') {
        setMsg({ text: 'พรุ่งนี้ยังไม่ได้ลงเวร เลยยังไม่มีอะไรให้ส่ง', ok: false });
      } else if (r.status === 'no-subscriptions') {
        setMsg({ text: 'ยังไม่มีเครื่องไหนเปิดรับแจ้งเตือน', ok: false });
      } else {
        setMsg({ text: 'ระบบยังไม่พร้อม กรุณาลองใหม่ภายหลัง', ok: false });
      }
    } catch {
      setMsg({ text: 'ส่งไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', ok: false });
    } finally {
      setTesting(false);
    }
  };

  const preview =
    tomorrowDay && buildShiftReminderPayload(tomorrow, tomorrowDay.shifts, tomorrowDay.note, tomorrowDay.sticker, tomorrowDay.jobs);
  const minuteOptions = MINUTES.includes(minute) ? MINUTES : [...MINUTES, minute].sort((a, b) => a - b);
  const selectCls =
    'rounded-xl border border-card-border bg-white px-2.5 py-1.5 text-[16px] sm:text-sm font-semibold text-text-primary focus:border-pink-500 focus:outline-hidden disabled:opacity-50';

  return (
    <div className="bg-white rounded-2xl p-4 shadow-2xs border border-card-border text-text-primary space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-pink-500 text-white shadow-2xs">
            <Bell size={16} />
          </span>
          <div className="min-w-0">
            <div className="text-sm font-bold text-text-primary truncate">แจ้งเตือนเวรพรุ่งนี้</div>
            <p className="text-[11px] text-text-secondary font-medium truncate">
              {enabled ? `ทุกเย็น เวลา ${pad(hour)}:${pad(minute)} น.` : 'ปิดอยู่'}
            </p>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="เปิดหรือปิดแจ้งเตือนเวรพรุ่งนี้"
          disabled={!loaded}
          onClick={() => save({ enabled: !enabled, hour, minute })}
          className="flex h-10 w-12 shrink-0 items-center justify-center cursor-pointer disabled:opacity-50"
        >
          <span className={`relative h-6 w-10 rounded-full transition-colors ${enabled ? 'bg-pink-500' : 'bg-[#c7c2b8]'}`}>
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-[left] ${
                enabled ? 'left-[1.125rem]' : 'left-0.5'
              }`}
            />
          </span>
        </button>
      </div>

      {/* Time */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-text-secondary">
        <span>เวลาแจ้งเตือน</span>
        <select
          aria-label="ชั่วโมง"
          value={hour}
          disabled={!loaded || !enabled}
          onChange={(e) => save({ enabled, hour: Number(e.target.value), minute })}
          className={selectCls}
        >
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {pad(h)}
            </option>
          ))}
        </select>
        <span>:</span>
        <select
          aria-label="นาที"
          value={minute}
          disabled={!loaded || !enabled}
          onChange={(e) => save({ enabled, hour, minute: Number(e.target.value) })}
          className={selectCls}
        >
          {minuteOptions.map((m) => (
            <option key={m} value={m}>
              {pad(m)}
            </option>
          ))}
        </select>
        <span>น.</span>
      </div>

      {/* Preview — what the phone will show this evening */}
      <div className="rounded-2xl border border-[#fbcfe8] bg-[#fdf2f8] p-3">
        <div className="mb-1.5 text-[10px] font-semibold text-pink-700">ตัวอย่างแจ้งเตือนเย็นนี้</div>
        {tomorrowDay === undefined ? (
          <p className="text-xs text-text-secondary">กำลังโหลด...</p>
        ) : preview ? (
          <div className="flex items-start gap-2.5 rounded-xl bg-white/90 p-2.5 shadow-2xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon-192.png" alt="" className="h-9 w-9 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2 text-[10px] text-text-muted">
                <span className="font-semibold">LR-Helper</span>
                <span>
                  {pad(hour)}:{pad(minute)}
                </span>
              </div>
              <p className="text-[13px] font-bold leading-snug text-text-primary break-words">{preview.title}</p>
              <p className="mt-0.5 whitespace-pre-line text-xs leading-relaxed text-text-secondary break-words">
                {preview.body}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-text-secondary">พรุ่งนี้ยังไม่ได้ลงเวร — จะยังไม่ส่งแจ้งเตือนจนกว่าจะลงเวร</p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={sendTest}
          disabled={testing || !preview}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[#fbcfe8] bg-white px-3 py-2 text-xs font-semibold text-pink-600 hover:bg-[#fdf2f8] transition-colors cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-default"
        >
          <Send size={14} />
          {testing ? 'กำลังส่ง...' : 'ลองส่งตอนนี้'}
        </button>
        {msg && (
          <p role="status" className={`text-[11px] font-semibold ${msg.ok ? 'text-[#059669]' : 'text-rose-600'}`}>
            {msg.text}
          </p>
        )}
      </div>

      <p className="text-[10px] leading-relaxed text-text-muted">
        ส่งถึงทุกเครื่องที่เปิดแจ้งเตือนไว้ แม้ไม่ได้เปิดแอป · อาจช้ากว่าเวลาที่ตั้ง 5–30 นาที · iPhone ต้องเพิ่มแอปไว้ที่หน้าจอโฮม
      </p>
    </div>
  );
}
