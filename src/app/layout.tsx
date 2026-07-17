import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import PinLock from "./components/PinLock";
import ReminderEngine from "./components/ReminderEngine";
import Header from "./components/Header";

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
          {/* Top Header Navigation & Tools */}
          <Header />

          {/* Reminder engine: notification permission banner + foreground
              due-time alerts (sound/vibration). Was imported but never
              rendered after the Header refactor — re-mounted here. */}
          <ReminderEngine />

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
