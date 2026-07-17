'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <button 
      onClick={handleCopy}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
        copied 
          ? 'bg-emerald-50 text-emerald-700' 
          : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 active:scale-95'
      }`}
    >
      {copied ? (
        <>
          <Check size={14} />
          คัดลอกแล้ว!
        </>
      ) : (
        <>
          <Copy size={14} />
          คัดลอกข้อความ
        </>
      )}
    </button>
  );
}
