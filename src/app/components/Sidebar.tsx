'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FEATURE_TRAVEL } from '../utils/features';
import {
  Activity,
  ListTodo,
  CalendarDays,
  Compass,
  Settings,
  Plus,
  Calculator,
  BookOpen,
  X,
} from 'lucide-react';

interface SidebarProps {
  pathname: string;
  onNavigate?: () => void;
  onOpenGa: () => void;
  onOpenGuide: () => void;
  onCollapse?: () => void;
  onClose?: () => void;
}

export default function Sidebar({
  pathname,
  onNavigate,
  onOpenGa,
  onOpenGuide,
  onClose,
}: SidebarProps) {
  const router = useRouter();

  useEffect(() => {
    router.prefetch('/');
    router.prefetch('/schedule');
    if (FEATURE_TRAVEL) router.prefetch('/travel');
    router.prefetch('/beds');
    router.prefetch('/timeline');
    router.prefetch('/add');
    router.prefetch('/settings');
  }, [router]);

  const handleGo = (href: string) => {
    onNavigate?.();
    router.push(href);
  };

  const isScheduleActive = pathname === '/' || pathname.startsWith('/schedule');
  const isTravelActive = pathname.startsWith('/travel');
  const isBedsActive = pathname.startsWith('/beds') || pathname.startsWith('/patient');
  const isTimelineActive = pathname.startsWith('/timeline');
  const isAddActive = pathname.startsWith('/add');
  const isSettingsActive = pathname.startsWith('/settings');

  return (
    <div
      className="flex h-full w-64 shrink-0 flex-col bg-surface-container-low border-r border-card-border pt-[env(safe-area-inset-top,0px)] select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Brand header (h-14 = 56px, aligns flush with Top Bar border-b) */}
      <div className="flex h-14 shrink-0 items-center justify-between gap-2 px-4 border-b border-card-border">
        <button
          type="button"
          onClick={() => handleGo('/')}
          onContextMenu={(e) => e.preventDefault()}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left cursor-pointer"
        >
          <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-card-border bg-white shadow-2xs">
            <Image
              src="/LOGO_App.png"
              alt="LR-Helper"
              width={36}
              height={36}
              className="h-full w-full object-cover pointer-events-none"
              draggable={false}
              priority
            />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-extrabold tracking-wide text-pink-500 leading-tight">
              LR-Helper
            </span>
            <span className="block truncate text-[11px] font-medium text-text-secondary">
              ตารางเวร • ห้องคลอด
            </span>
          </span>
        </button>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-container hover:text-text-primary cursor-pointer"
            aria-label="ปิดเมนู"
          >
            <X size={19} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {/* Top Priority Quick Action: GA Calculator (matches SunNotes white quick-action button) */}
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            onOpenGa();
          }}
          onContextMenu={(e) => e.preventDefault()}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-card-border bg-white px-3 py-2.5 text-sm font-bold text-pink-500 shadow-2xs transition-all hover:bg-surface active:scale-[0.98] cursor-pointer"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-pink-500 text-white">
            <Calculator size={14} />
          </span>
          <span>คำนวณอายุครรภ์ (GA)</span>
        </button>

        {/* Primary Menu (Shift Schedule & Nurse Features first — vibrant SunNotes icon chips) */}
        <div className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
          เมนูหลัก
        </div>
        <nav className="space-y-1">
          <button
            type="button"
            onClick={() => handleGo('/')}
            onContextMenu={(e) => e.preventDefault()}
            className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm transition-colors cursor-pointer ${
              isScheduleActive
                ? 'bg-white font-bold text-text-primary shadow-2xs border border-card-border'
                : 'font-medium text-text-secondary hover:bg-surface-container hover:text-text-primary'
            }`}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-pink-500 text-white shadow-2xs">
              <CalendarDays size={15} strokeWidth={2.25} />
            </span>
            <span className="truncate">ตารางเวร</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onNavigate?.();
              onOpenGa();
            }}
            onContextMenu={(e) => e.preventDefault()}
            className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm font-medium text-text-secondary transition-colors hover:bg-surface-container hover:text-text-primary cursor-pointer"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500 text-white shadow-2xs">
              <Calculator size={15} strokeWidth={2.25} />
            </span>
            <span className="truncate">คำนวณอายุครรภ์ (GA)</span>
          </button>

          {FEATURE_TRAVEL && (
          <button
            type="button"
            onClick={() => handleGo('/travel')}
            onContextMenu={(e) => e.preventDefault()}
            className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm transition-colors cursor-pointer ${
              isTravelActive
                ? 'bg-white font-bold text-text-primary shadow-2xs border border-card-border'
                : 'font-medium text-text-secondary hover:bg-surface-container hover:text-text-primary'
            }`}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#10b981] text-white shadow-2xs">
              <Compass size={15} strokeWidth={2.25} />
            </span>
            <span className="truncate">ที่เที่ยวรายเดือน</span>
          </button>
          )}

          <button
            type="button"
            onClick={() => {
              onNavigate?.();
              onOpenGuide();
            }}
            onContextMenu={(e) => e.preventDefault()}
            className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm font-medium text-text-secondary transition-colors hover:bg-surface-container hover:text-text-primary cursor-pointer"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#d99a00] text-white shadow-2xs">
              <BookOpen size={15} strokeWidth={2.25} />
            </span>
            <span className="truncate">คู่มือพยาบาล LR</span>
          </button>
        </nav>

        {/* Secondary Section: Labor Room Bed Tracking (vibrant solid icon chips just like SunNotes) */}
        <div className="mt-5 mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
          ระบบติดตามเตียงห้องคลอด
        </div>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => handleGo('/beds')}
            onContextMenu={(e) => e.preventDefault()}
            className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm transition-colors cursor-pointer ${
              isBedsActive
                ? 'bg-white font-bold text-text-primary shadow-2xs border border-card-border'
                : 'font-medium text-text-secondary hover:bg-surface-container hover:text-text-primary'
            }`}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-500 text-white shadow-2xs">
              <Activity size={15} strokeWidth={2.25} />
            </span>
            <span className="truncate">เตียงทั้งหมด</span>
          </button>

          <button
            type="button"
            onClick={() => handleGo('/timeline')}
            onContextMenu={(e) => e.preventDefault()}
            className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm transition-colors cursor-pointer ${
              isTimelineActive
                ? 'bg-white font-bold text-text-primary shadow-2xs border border-card-border'
                : 'font-medium text-text-secondary hover:bg-surface-container hover:text-text-primary'
            }`}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1b5cad] text-white shadow-2xs">
              <ListTodo size={15} strokeWidth={2.25} />
            </span>
            <span className="truncate">คิวงานรวม</span>
          </button>

          <button
            type="button"
            onClick={() => handleGo('/add')}
            onContextMenu={(e) => e.preventDefault()}
            className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm transition-colors cursor-pointer ${
              isAddActive
                ? 'bg-white font-bold text-text-primary shadow-2xs border border-card-border'
                : 'font-medium text-text-secondary hover:bg-surface-container hover:text-text-primary'
            }`}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#8b5cf6] text-white shadow-2xs">
              <Plus size={15} strokeWidth={2.5} />
            </span>
            <span className="truncate">รับผู้ป่วยใหม่</span>
          </button>
        </div>
      </div>

      {/* Settings (SunNotes keeps it pinned above the footer) */}
      <div className="border-t border-card-border px-3 py-2">
        <button
          type="button"
          onClick={() => handleGo('/settings')}
          onContextMenu={(e) => e.preventDefault()}
          className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm transition-colors cursor-pointer ${
            isSettingsActive
              ? 'bg-white font-bold text-text-primary shadow-2xs border border-card-border'
              : 'font-medium text-text-secondary hover:bg-surface-container hover:text-text-primary'
          }`}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#6b7280] text-white shadow-2xs">
            <Settings size={15} strokeWidth={2.25} />
          </span>
          <span className="truncate">ตั้งค่า</span>
        </button>
      </div>

      {/* Footer: database status */}
      <div className="flex items-center gap-2 border-t border-card-border px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] bg-surface/70">
        <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-[#10b981]" title="Database Connected" />
        <span className="text-[11px] font-medium text-text-secondary">ฐานข้อมูลพร้อมใช้งาน</span>
      </div>
    </div>
  );
}
