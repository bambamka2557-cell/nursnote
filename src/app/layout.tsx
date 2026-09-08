import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import ReminderEngine from "./components/ReminderEngine";
import Header from "./components/Header";
import SplashScreen from "./components/SplashScreen";

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
      <body className={`${inter.className} min-h-full flex flex-col pb-16 md:pb-0 bg-[#fff3f5] text-slate-900 overflow-x-hidden`}>
        {/* App launch transition / splash screen (shows cover image on opening) */}
        <SplashScreen />

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
      </body>
    </html>
  );
}
