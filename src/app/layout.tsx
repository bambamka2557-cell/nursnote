import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import PinLock from "./components/PinLock";
import Link from "next/link";
import { Activity, PlusCircle, ListTodo } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LR-Helper",
  description: "Labor Room Assistant",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="h-full antialiased">
      <body className={`${inter.className} min-h-full flex flex-col pb-16 md:pb-0 bg-slate-50 text-slate-900`}>
        <PinLock>
          {/* Top Header */}
          <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">LR-Helper</span>
                <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full">LR</span>
              </Link>
              
              {/* Desktop Navigation Links */}
              <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-500">
                <Link href="/" className="flex items-center gap-1.5 px-3 py-2 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-all">
                  <Activity size={16} />
                  <span>เตียงทั้งหมด</span>
                </Link>
                <Link href="/add" className="flex items-center gap-1.5 px-3 py-2 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-all">
                  <PlusCircle size={16} />
                  <span>รับใหม่</span>
                </Link>
                <Link href="/timeline" className="flex items-center gap-1.5 px-3 py-2 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-all">
                  <ListTodo size={16} />
                  <span>คิวงานรวม</span>
                </Link>
              </nav>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="hidden md:inline text-xs text-slate-400 font-medium">Database Connected</span>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Database Connected"></div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 p-5 max-w-md md:max-w-6xl mx-auto w-full">
            {children}
          </main>

          {/* Bottom Navigation (Mobile Only) */}
          <Navbar />
        </PinLock>
      </body>
    </html>
  );
}
