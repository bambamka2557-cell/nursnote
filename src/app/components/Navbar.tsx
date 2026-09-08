'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, ListTodo, PlusCircle, CalendarDays } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'เตียง (Beds)', icon: Activity, activeClass: 'text-pink-500' },
    { href: '/add', label: 'รับใหม่', icon: PlusCircle, activeClass: 'text-sky-400' },
    { href: '/timeline', label: 'คิวงาน (Timeline)', icon: ListTodo, activeClass: 'text-pink-500' },
    { href: '/schedule', label: 'ตารางเวร', icon: CalendarDays, activeClass: 'text-pink-500' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto pt-2 pb-[max(1.5rem,env(safe-area-inset-bottom,28px))] px-2.5 glass-nav z-50 grid grid-cols-4 md:hidden shadow-[0_-4px_25px_rgba(244,114,182,0.18)] border-t border-pink-200/80">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        
        return (
          <Link 
            key={item.href} 
            href={item.href} 
            className={`flex flex-col items-center justify-center gap-1 py-1.5 px-0.5 mx-1 rounded-2xl transition-all duration-200 ${
              isActive 
                ? `${item.activeClass} bg-white shadow-sm font-black scale-105 border border-pink-200/60 ring-1 ring-pink-300/30` 
                : 'text-slate-400 hover:text-slate-600 active:scale-95 font-bold'
            }`}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] tracking-tight text-center px-0.5 truncate w-full leading-tight">
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
