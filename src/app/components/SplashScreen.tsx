'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';

export default function SplashScreen() {
  const [show, setShow] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleDismiss = useCallback(() => {
    setIsFading(true);
  }, []);

  // Lock body scroll while splash screen is visible
  useEffect(() => {
    if (show) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [show]);

  // Auto-transition after 2 seconds on initial launch
  useEffect(() => {
    const autoTimer = setTimeout(() => {
      setIsFading(true);
    }, 2000);

    return () => clearTimeout(autoTimer);
  }, []);

  // Unmount after smooth fade-out transition
  useEffect(() => {
    if (!isFading) return;

    fadeTimerRef.current = setTimeout(() => {
      setShow(false);
    }, 450);

    return () => {
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current);
      }
    };
  }, [isFading]);

  if (!show) return null;

  return (
    <div
      onClick={handleDismiss}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center select-none cursor-pointer bg-[#fdd4e1] overscroll-none touch-none transition-opacity duration-400 ease-out ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      role="button"
      tabIndex={0}
      aria-label="แตะเพื่อเข้าสู่แอป"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleDismiss();
        }
      }}
    >
      {/* Full-bleed splash cover image */}
      <div className="relative w-full h-full max-w-sm sm:max-w-md max-h-[100dvh] flex items-center justify-center p-2">
        <Image
          src="/app-cover.png"
          alt="LR-Helper Cover"
          fill
          priority
          sizes="(max-width: 640px) 100vw, 448px"
          className="object-contain select-none pointer-events-none"
        />
      </div>

      {/* Subtle tap affordance */}
      <div className="absolute bottom-6 sm:bottom-8 left-0 right-0 flex justify-center pointer-events-none px-4">
        <span className="text-xs text-pink-600/80 font-bold px-4 py-1.5 rounded-full bg-white/70 backdrop-blur-xs border border-pink-200/60 shadow-xs animate-pulse">
          แตะที่ใดก็ได้เพื่อเริ่มใช้งาน
        </span>
      </div>
    </div>
  );
}

