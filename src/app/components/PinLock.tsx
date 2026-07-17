'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import { verifyPin } from '@/app/actions/auth';

export default function PinLock({ children }: { children: React.ReactNode }) {
  const [isLocked, setIsLocked] = useState(true);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const unlocked = sessionStorage.getItem('lr_unlocked');
    if (unlocked === 'true') {
      setIsLocked(false);
    }
  }, []);

  const handleKeyPress = (num: string) => {
    if (checking || pin.length >= 4) return;

    const newPin = pin + num;
    setPin(newPin);
    setError(false);

    if (newPin.length === 4) {
      setChecking(true);
      verifyPin(newPin)
        .then((ok) => {
          if (ok) {
            sessionStorage.setItem('lr_unlocked', 'true');
            setIsLocked(false);
          } else {
            setError(true);
            setTimeout(() => setPin(''), 500);
          }
        })
        .catch(() => {
          // Fail closed on a network/server error too — never unlock on failure.
          setError(true);
          setTimeout(() => setPin(''), 500);
        })
        .finally(() => setChecking(false));
    }
  };

  const handleDelete = () => {
    if (checking) return;
    setPin(pin.slice(0, -1));
    setError(false);
  };

  if (!isLocked) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 bg-slate-50 z-50 flex flex-col items-center justify-center p-6 select-none">
      <div className="text-center mb-8 flex flex-col items-center">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-3 shadow-xs">
          <ShieldCheck size={24} />
        </div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-900 bg-clip-text text-transparent">LR-Helper</h1>
        <p className="text-xs text-slate-400 mt-1">กรุณาใส่รหัสผ่าน 4 หลัก เพื่อเข้าใช้งานระบบ</p>
      </div>

      {/* Dots */}
      <div className="flex gap-4 mb-10">
        {[...Array(4)].map((_, i) => (
          <div 
            key={i} 
            className={`w-3.5 h-3.5 rounded-full border transition-all duration-150 ${
              pin.length > i 
                ? error ? 'bg-rose-500 border-rose-500 scale-110' : 'bg-indigo-600 border-indigo-600 scale-110' 
                : 'border-slate-300 bg-white'
            }`} 
          />
        ))}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-y-4 gap-x-6 max-w-[280px] w-full">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleKeyPress(num.toString())}
            className="w-16 h-16 rounded-full bg-white border border-slate-100/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] text-xl font-bold text-slate-800 hover:bg-slate-50 active:bg-slate-100 active:scale-95 flex items-center justify-center transition-all"
          >
            {num}
          </button>
        ))}
        <div />
        <button
          onClick={() => handleKeyPress('0')}
          className="w-16 h-16 rounded-full bg-white border border-slate-100/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] text-xl font-bold text-slate-800 hover:bg-slate-50 active:bg-slate-100 active:scale-95 flex items-center justify-center transition-all"
        >
          0
        </button>
        <button
          onClick={handleDelete}
          className="text-sm font-semibold text-slate-400 hover:text-slate-600 active:scale-95 transition-all flex items-center justify-center"
        >
          ลบออก
        </button>
      </div>
      
      {error && (
        <p className="text-rose-600 mt-8 text-xs font-bold bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">
          รหัสผ่านไม่ถูกต้อง ลองอีกครั้ง
        </p>
      )}
    </div>
  );
}
