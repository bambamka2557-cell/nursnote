'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  Activity,
  ListTodo,
  CalendarDays,
  Plane,
  Plus,
  Calculator,
  BookOpen,
  X,
  type LucideIcon,
} from 'lucide-react';

// SunNotes-style side menu (structure from SunNotes, colours = LR-Helper pink).
// Used twice by Header: pinned on desktop (lg+) and as a sheet behind ☰ on
// smaller screens. Navigation only — no data is read or written here.

interface SidebarProps {
  pathname: string;
  onNavigate?: () => void; // closes the mobile sheet after a tap
  onOpenGa: () => void;
  onOpenGuide: () => void;
  onClose?: () => void; // shown only in the mobile sheet
}

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  chip: string; // solid icon-chip colour
  isActive: (path: string) => boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'เตียงทั้งหมด', icon: Activity, chip: 'bg-rose-400', isActive: (p) => p === '/' || p.startsWith('/patient') },
  { href: '/timeline', label: 'คิวงานรวม', icon: ListTodo, chip: 'bg-indigo-400', isActive: (p) => p.startsWith('/timeline') },
  { href: '/schedule', label: 'ตารางเวร', icon: CalendarDays, chip: 'bg-pink-500', isActive: (p) => p.startsWith('/schedule') },
  { href: '/travel', label: 'ที่เที่ยว', icon: Plane, chip: 'bg-emerald-400', isActive: (p) => p.startsWith('/travel') },
];

export default function Sidebar({ pathname, onNavigate, onOpenGa, onOpenGuide, onClose }: SidebarProps) {
  const isAddActive = pathname.startsWith('/add');

  return (
    <div className="flex h-full flex-col bg-[#fff6f8] pt-[env(safe-area-inset-top,0px)]">
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <Link href="/" onClick={onNavigate} className="flex min-w-0 flex-1 items-center gap-3">
          <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-pink-200/70 bg-white shadow-sm">
            <Image src="/LOGO_App.png" alt="LR-Helper" width={44} height={44} className="h-full w-full object-cover" priority />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-lg font-bold tracking-wide text-pink-600">LR-Helper</span>
            <span className="block truncate text-[11px] font-medium text-slate-500">ห้องคลอด • ตารางเวร</span>
          </span>
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-pink-100/60 hover:text-slate-700"
            aria-label="ปิดเมนู"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {/* Primary action (SunNotes "จดโน้ตด่วน" slot) */}
        <Link
          href="/add"
          onClick={onNavigate}
          className={`mb-4 flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold shadow-sm transition-colors active:scale-[0.98] ${
            isAddActive
              ? 'border-pink-300 bg-pink-500 text-white'
              : 'border-pink-100 bg-white text-pink-600 hover:bg-pink-50'
          }`}
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>รับผู้ป่วยใหม่</span>
        </Link>

        {/* Main menu */}
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.isActive(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors ${
                  active
                    ? 'bg-white font-semibold text-slate-900 shadow-sm'
                    : 'font-medium text-slate-600 hover:bg-white/70 hover:text-slate-900'
                }`}
              >
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white ${item.chip}`}>
                  <Icon size={16} strokeWidth={2.25} />
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Tools */}
        <div className="mt-5 mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          เครื่องมือ
        </div>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => {
              onNavigate?.();
              onOpenGa();
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-white/70 hover:text-slate-900"
          >
            <Calculator size={18} className="shrink-0 text-indigo-500" />
            <span>คำนวณ GA</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onNavigate?.();
              onOpenGuide();
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-white/70 hover:text-slate-900"
          >
            <BookOpen size={18} className="shrink-0 text-pink-500" />
            <span>คู่มือ LR</span>
          </button>
        </div>
      </div>

      {/* Footer: database status (same indicator the old top bar had) */}
      <div className="flex items-center gap-2 border-t border-pink-100 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
        <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-500" title="Database Connected" />
        <span className="text-[11px] font-medium text-slate-500">ฐานข้อมูลพร้อมใช้งาน</span>
      </div>
    </div>
  );
}
