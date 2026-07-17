'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, ListTodo, PlusCircle } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'เตียง (Beds)', icon: Activity },
    { href: '/add', label: 'รับใหม่', icon: PlusCircle },
    { href: '/timeline', label: 'คิวงาน (Timeline)', icon: ListTodo },
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
            className={`flex flex-col items-center justify-center gap-1 h-full transition-all duration-200 ${
              isActive 
                ? 'text-indigo-600 font-semibold' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] tracking-wide text-center px-1 truncate w-full">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
