import type { Metadata, Viewport } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import ReminderEngine from "./components/ReminderEngine";
import Header from "./components/Header";
import SplashScreen from "./components/SplashScreen";

const prompt = Prompt({
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  subsets: ["thai", "latin"],
  display: "swap",
  variable: "--font-prompt",
});

export const viewport: Viewport = {
  themeColor: "#fce7eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "LR-Helper",
  description: "Labor Room Assistant",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="h-full antialiased overscroll-none">
      <body className={`${prompt.className} ${prompt.variable} min-h-full flex flex-col pb-28 md:pb-0 bg-[#fff3f5] text-slate-900 overflow-x-hidden overscroll-none`}>
        {/* App launch transition / splash screen (shows cover image on opening) */}
        <SplashScreen />

        {/* Top Header Navigation & Tools (Fixed to top of viewport) */}
        <Header />

        {/* Top spacer matching fixed Header height + safe area inset */}
        <div className="h-[calc(3.5rem+env(safe-area-inset-top,0px))] shrink-0" />

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
