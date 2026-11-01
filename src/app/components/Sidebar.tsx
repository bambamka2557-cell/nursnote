'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  Activity,
  ListTodo,
  CalendarDays,
  Compass,
  Plus,
  Calculator,
  BookOpen,
  X,
  type LucideIcon,
} from 'lucide-react';

interface SidebarProps {
  pathname: string;
  onNavigate?: () => void;
  onOpenGa: () => void;
  onOpenGuide: () => void;
  onCollapse?: () => void;
  onClose?: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  chip: string;
  isActive: (path: string) => boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/',
    label: 'เตียงทั้งหมด',
    icon: Activity,
    chip: 'bg-rose-400',
    isActive: (p) => p === '/' || p.startsWith('/patient'),
  },
  {
    href: '/timeline',
    label: 'คิวงานรวม',
    icon: ListTodo,
    chip: 'bg-indigo-400',
    isActive: (p) => p.startsWith('/timeline'),
  },
  {
    href: '/schedule',
    label: 'ตารางเวร',
    icon: CalendarDays,
    chip: 'bg-pink-500',
    isActive: (p) => p.startsWith('/schedule'),
  },
  {
    href: '/travel',
    label: 'ที่เที่ยวรายเดือน',
    icon: Compass,
    chip: 'bg-emerald-400',
    isActive: (p) => p.startsWith('/travel'),
  },
];

export default function Sidebar({
  pathname,
  onNavigate,
  onOpenGa,
  onOpenGuide,
  onClose,
}: SidebarProps) {
  const isAddActive = pathname.startsWith('/add');

  return (
    <div className="flex h-full w-64 shrink-0 flex-col bg-[#fdf4f6] border-r border-pink-100/90 pt-[env(safe-area-inset-top,0px)] select-none">
      {/* Brand header (h-14 = 56px, aligns flush with Top Bar border-b) */}
      <div className="flex h-14 shrink-0 items-center justify-between gap-2 px-4 border-b border-pink-100/90">
        <Link href="/" onClick={onNavigate} className="flex min-w-0 flex-1 items-center gap-2.5">
          <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-pink-200/70 bg-white shadow-2xs">
            <Image
              src="/LOGO_App.png"
              alt="LR-Helper"
              width={36}
              height={36}
              className="h-full w-full object-cover"
              priority
            />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-extrabold tracking-wide text-pink-600 leading-tight">
              LR-Helper
            </span>
            <span className="block truncate text-[11px] font-medium text-slate-500">
              ห้องคลอด • ตารางเวร
            </span>
          </span>
        </Link>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-pink-100/60 hover:text-slate-700 cursor-pointer"
            aria-label="ปิดเมนู"
          >
            <X size={19} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {/* Primary quick-action card (SunNotes "จดโน้ตด่วน" slot) */}
        <Link
          href="/add"
          onClick={onNavigate}
          className={`mb-4 flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold shadow-2xs transition-all active:scale-[0.98] ${
            isAddActive
              ? 'border-pink-400 bg-pink-500 text-white'
              : 'border-pink-200/80 bg-white text-pink-600 hover:bg-pink-50'
          }`}
        >
          <Plus size={17} strokeWidth={2.5} />
          <span>รับผู้ป่วยใหม่</span>
        </Link>

        {/* Main navigation */}
        <div className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          เมนูหลัก
        </div>
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.isActive(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition-colors ${
                  active
                    ? 'bg-white font-bold text-slate-900 shadow-2xs border border-pink-100'
                    : 'font-medium text-slate-600 hover:bg-white/70 hover:text-slate-900'
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white shadow-2xs ${item.chip}`}
                >
                  <Icon size={15} strokeWidth={2.25} />
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Tools section */}
        <div className="mt-5 mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          เครื่องมือห้องคลอด
        </div>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => {
              onNavigate?.();
              onOpenGa();
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-white/70 hover:text-slate-900 cursor-pointer"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
              <Calculator size={15} />
            </span>
            <span>คำนวณอายุครรภ์ (GA)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onNavigate?.();
              onOpenGuide();
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-white/70 hover:text-slate-900 cursor-pointer"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-pink-100 text-pink-600">
              <BookOpen size={15} />
            </span>
            <span>คู่มือพยาบาล LR</span>
          </button>
        </div>
      </div>

      {/* Footer: database status */}
      <div className="flex items-center gap-2 border-t border-pink-100/90 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] bg-white/50">
        <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-500" title="Database Connected" />
        <span className="text-[11px] font-medium text-slate-500">ฐานข้อมูลพร้อมใช้งาน</span>
      </div>
    </div>
  );
}
