'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, ListTodo, PlusCircle } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'เตียง (Beds)', icon: Activity, activeClass: 'text-pink-500' },
    { href: '/add', label: 'รับใหม่', icon: PlusCircle, activeClass: 'text-sky-400' },
    { href: '/timeline', label: 'คิวงาน (Timeline)', icon: ListTodo, activeClass: 'text-pink-500' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto h-16 glass-nav z-50 grid grid-cols-3 md:hidden">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        
        return (
          <Link 
            key={item.href} 
            href={item.href} 
            className={`flex flex-col items-center justify-center gap-0.5 h-[80%] my-auto mx-2 rounded-xl transition-all duration-200 ${
              isActive 
                ? `${item.activeClass} bg-white shadow-[0_4px_12px_rgba(0,0,0,0.04)] font-bold scale-105 border border-slate-100/50` 
                : 'text-slate-400 hover:text-slate-600 active:scale-95'
            }`}
          >
            <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[9px] tracking-wide text-center px-1 truncate w-full">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
