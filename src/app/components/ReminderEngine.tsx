'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, BellRing, BellOff } from 'lucide-react';
import { format } from 'date-fns';
import { getPatients } from '../actions/patient';
import { computeDueOrders, dueMsFromKey, type DueOrder } from '@/lib/reminders';

const POLL_MS = 30_000;
const FIRED_KEY = 'lr_fired_reminders';

type Perm = 'default' | 'granted' | 'denied' | 'unsupported';

export default function ReminderEngine() {
  const [perm, setPerm] = useState<Perm>('default');
  const firedRef = useRef<Set<string>>(new Set());
  const audioCtxRef = useRef<AudioContext | null>(null);

  // --- fired-key persistence (so a reload doesn't re-alert past dues) ---
  const loadFired = () => {
    try {
      const raw = localStorage.getItem(FIRED_KEY);
      const arr: string[] = raw ? JSON.parse(raw) : [];
      const cutoff = Date.now() - 24 * 60 * 60 * 1000; // drop keys older than 24h
      firedRef.current = new Set(arr.filter((k) => dueMsFromKey(k) >= cutoff));
      persistFired();
    } catch {
      firedRef.current = new Set();
    }
  };
  const persistFired = () => {
    try {
      localStorage.setItem(FIRED_KEY, JSON.stringify([...firedRef.current]));
    } catch {
      /* storage full / unavailable — dedup degrades to in-memory only */
    }
  };

  // --- sound: a short beep via WebAudio (no audio asset needed) ---
  const beep = useCallback((times = 3) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    let t = ctx.currentTime;
    for (let i = 0; i < times; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
      t += 0.35;
    }
  }, []);

  const fire = useCallback(
    async (order: DueOrder) => {
      // Vibration: works on Android Chrome; silently ignored on iOS Safari.
      try {
        navigator.vibrate?.([500, 250, 500, 250, 500]);
      } catch {
        /* not supported */
      }
      beep(3);

      const title = `⏰ ถึงเวลา: ${order.name}`;
      const body = `เตียง ${order.bedNumber} (${order.nickname}) — กำหนด ${format(order.dueTime, 'HH:mm')} น.`;
      const opts: NotificationOptions & { vibrate?: number[] } = {
        body,
        tag: order.key, // collapse duplicates for the same due-instance
        requireInteraction: true,
        vibrate: [500, 250, 500, 250, 500],
      };

      // Prefer the service worker so the notification is robust; fall back to a
      // page Notification if the SW isn't controlling this client yet.
      try {
        const reg = await navigator.serviceWorker?.ready;
        if (reg) {
          await reg.showNotification(title, opts);
          return;
        }
      } catch {
        /* fall through */
      }
      try {
        new Notification(title, opts);
      } catch {
        /* nothing else we can do on this platform */
      }
    },
    [beep]
  );

  const check = useCallback(async () => {
    if (Notification.permission !== 'granted') return;
    let patients: any[];
    try {
      patients = await getPatients();
    } catch {
      return; // network blip — try again next poll
    }
    const due = computeDueOrders(patients);
    let changed = false;
    for (const o of due) {
      if (firedRef.current.has(o.key)) continue;
      firedRef.current.add(o.key);
      changed = true;
      void fire(o);
    }
    if (changed) persistFired();
  }, [fire]);

  // Register the service worker + set up the poll loop.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window)) {
      setPerm('unsupported');
      return;
    }
    setPerm(Notification.permission as Perm);
    loadFired();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((e) => {
        console.error('SW registration failed:', e);
      });
    }

    check();
    const id = setInterval(check, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Permission + audio must be unlocked from a user gesture (button tap).
  const enable = async () => {
    try {
      // Create/resume the AudioContext on the gesture so beeps can play later.
      if (!audioCtxRef.current) {
        const AC = window.AudioContext || (window as any).webkitAudioContext;
        if (AC) audioCtxRef.current = new AC();
      }
      await audioCtxRef.current?.resume();
      beep(1); // confirmation beep + unlocks audio on iOS

      const result = await Notification.requestPermission();
      setPerm(result as Perm);
      if (result === 'granted') check();
    } catch (e) {
      console.error('enable notifications failed:', e);
    }
  };

  if (perm === 'unsupported') return null;

  if (perm !== 'granted') {
    return (
      <div className="mx-auto max-w-md md:max-w-6xl w-full px-5 pt-3">
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <Bell size={18} className="shrink-0 text-amber-600" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-amber-900">ยังไม่ได้เปิดการแจ้งเตือน</p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              {perm === 'denied'
                ? 'ถูกบล็อกไว้ — เปิดสิทธิ์แจ้งเตือนของเว็บนี้ในตั้งค่าเบราว์เซอร์ก่อน'
                : 'เปิดเพื่อให้เตือน (สั่น + เสียง) เมื่อถึงเวลาให้ยา/ประเมิน'}
            </p>
          </div>
          {perm !== 'denied' && (
            <button
              onClick={enable}
              className="shrink-0 rounded-lg bg-amber-600 px-3 py-2 text-xs font-bold text-white active:scale-95 transition-all"
            >
              เปิดแจ้งเตือน
            </button>
          )}
        </div>
      </div>
    );
  }

  // Granted — show a compact status that is honest about the foreground-only limit.
  return (
    <div className="mx-auto max-w-md md:max-w-6xl w-full px-5 pt-3">
      <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3.5 py-2">
        <BellRing size={14} className="shrink-0 text-emerald-600" />
        <p className="text-[11px] text-emerald-800 leading-tight">
          แจ้งเตือนเปิดอยู่ — ทำงานขณะ<strong>เปิดแอปค้างไว้และจอไม่ดับ</strong> เท่านั้น
          (ถ้าปิดจอ/สลับแอปนานๆ อาจไม่เตือน)
        </p>
      </div>
    </div>
  );
}
