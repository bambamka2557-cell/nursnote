'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  THAILAND_MONTHLY_TRAVEL,
  TravelSpot,
  MonthTravelInfo,
} from '@/app/utils/thailandTravelData';
import {
  ChevronLeft,
  Calendar,
  Sparkles,
  MapPin,
  Clock,
  Heart,
  Compass,
  AlertCircle,
  Share2,
} from 'lucide-react';

interface TravelClientProps {
  initialMonth: number;
}

const THAI_MONTH_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

export default function TravelClient({ initialMonth }: TravelClientProps) {
  const router = useRouter();
  const validMonth = initialMonth >= 1 && initialMonth <= 12 ? initialMonth : 9;
  const [selectedMonth, setSelectedMonth] = useState<number>(validMonth);

  const currentMonthData: MonthTravelInfo =
    THAILAND_MONTHLY_TRAVEL[selectedMonth] || THAILAND_MONTHLY_TRAVEL[9];

  const handleMonthSelect = (m: number) => {
    setSelectedMonth(m);
    // Update URL shallowly so user can bookmark or share
    router.replace(`/travel?month=${m}`, { scroll: false });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50/50 via-pink-50/25 to-white pb-28 text-slate-800">
      {/* Top Header Floating Bar with Soft Rounded Corners */}
      <div className="sticky top-2 z-40 px-3 sm:px-6 pt-1.5">
        <div className="max-w-4xl mx-auto bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-pink-100 shadow-sm shadow-pink-100/30 px-3.5 sm:px-5 py-2.5 flex items-center justify-between gap-2">
          {/* Back to Schedule Button with Rounded-2xl */}
          <Link
            href="/schedule"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-pink-50 hover:bg-pink-100 text-pink-600 font-black text-xs sm:text-sm transition-all border border-pink-200/70 shadow-2xs active:scale-95 cursor-pointer"
          >
            <ChevronLeft size={16} />
            <span>กลับตารางเวร</span>
          </Link>

          {/* Title in Header */}
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl">✈️</span>
            <div className="text-right sm:text-left">
              <h1 className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
                เที่ยวไทยประจำเดือน
              </h1>
              <span className="text-[10px] text-pink-500 font-bold hidden sm:inline">
                สำหรับพยาบาลห้องคลอด LR
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-6 pt-4 space-y-4 sm:space-y-6">
        {/* Banner Hero */}
        <div className="bg-gradient-to-r from-pink-400 via-rose-400 to-sky-400 rounded-3xl p-4 sm:p-6 text-white shadow-md shadow-pink-200/50 relative overflow-hidden">
          <div className="relative z-10 space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[11px] font-black border border-white/30">
              <Sparkles size={12} />
              <span>Nurse Holiday & Travel Guide</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black">
              เหนื่อยจากเวร... ออกไปชาร์จพลังกันเถอะ 🏖️
            </h2>
            <p className="text-xs sm:text-sm text-pink-50 font-medium leading-relaxed">
              รวมพิกัดที่เที่ยวที่สวยที่สุดในแต่ละเดือนของไทย พร้อมป้ายแนะนำความยาวทริปเพื่อจับคู่กับวันหยุด OFF และเคล็ดลับการฟื้นฟูสุขภาพ
            </p>
          </div>
          {/* Decorative background emoji */}
          <div className="absolute -right-2 -bottom-4 text-7xl sm:text-8xl opacity-20 select-none pointer-events-none">
            🌺
          </div>
        </div>

        {/* 12 Months Selector Tabs */}
        <div className="bg-white/95 rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-pink-100 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-black text-slate-700">
            <span className="flex items-center gap-1.5">
              <Calendar size={14} className="text-pink-500" />
              <span>เลือกดูสถานที่เที่ยวตามเดือน</span>
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              แตะเพื่อเปลี่ยนเดือน
            </span>
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 sm:gap-2">
            {THAI_MONTH_SHORT.map((name, idx) => {
              const mNum = idx + 1;
              const isSelected = selectedMonth === mNum;
              return (
                <button
                  key={mNum}
                  type="button"
                  onClick={() => handleMonthSelect(mNum)}
                  className={`py-2 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer text-center flex flex-col items-center justify-center ${
                    isSelected
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-xs scale-103 ring-2 ring-pink-300/50'
                      : 'bg-slate-50 hover:bg-pink-50/50 text-slate-700 border border-slate-100 hover:border-pink-200'
                  }`}
                >
                  <span>{name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Month Highlight Overview Card */}
        <div className="bg-white/95 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-pink-100 shadow-2xs space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-pink-50">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-xl font-black text-slate-900">
                  เดือน {currentMonthData.monthName}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-700 text-xs font-black border border-pink-200">
                  {currentMonthData.seasonBadge}
                </span>
              </div>
              <p className="text-xs text-pink-600 font-extrabold mt-0.5">
                ✨ {currentMonthData.seasonTheme}
              </p>
            </div>

            {currentMonthData.publicHolidayNotice && (
              <span className="text-xs bg-rose-50 text-rose-700 font-bold px-3 py-1 rounded-xl border border-rose-200 flex items-center gap-1.5">
                <span>🎌</span>
                <span>{currentMonthData.publicHolidayNotice}</span>
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {currentMonthData.climateOverview}
          </p>
        </div>

        {/* Travel Spots Cards List */}
        <div className="space-y-4 sm:space-y-5">
          <h3 className="text-sm sm:text-base font-black text-slate-800 flex items-center gap-2">
            <Compass size={18} className="text-pink-500" />
            <span>ที่เที่ยวแนะนำประจำเดือน{currentMonthData.monthName} ({currentMonthData.spots.length} แห่ง)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {currentMonthData.spots.map((spot) => (
              <TravelSpotCard key={spot.id} spot={spot} />
            ))}
          </div>
        </div>

        {/* Bottom Return to Schedule Button */}
        <div className="pt-6 pb-4 text-center">
          <Link
            href="/schedule"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-black text-sm shadow-md shadow-pink-200 transition-all active:scale-95 cursor-pointer"
          >
            <ChevronLeft size={18} />
            <span>กลับไปเช็คตารางเวร & วางแผนวันหยุด</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Single Travel Spot Card Component with Smart Offline Image Fallback
function TravelSpotCard({ spot }: { spot: TravelSpot }) {
  const [imgError, setImgError] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-pink-100/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      {/* Photo Header with Overlay Badges */}
      <div className="relative w-full h-48 sm:h-52 bg-slate-100 overflow-hidden">
        {imgError ? (
          /* Graceful Fallback Card */
          <div className="w-full h-full bg-gradient-to-br from-pink-100 via-rose-50 to-sky-100 flex flex-col items-center justify-center p-4 text-center border-b border-pink-100">
            <span className="text-4xl mb-1 filter drop-shadow-2xs">
              {spot.imageEmoji || '🏞️'}
            </span>
            <span className="text-sm font-black text-slate-800">{spot.name}</span>
            <span className="text-[10px] text-pink-600 font-bold mt-1 bg-white/90 px-2.5 py-0.5 rounded-full border border-pink-200 shadow-2xs flex items-center gap-1">
              <AlertCircle size={10} />
              <span>
                {!isOnline ? '📶 โหมดออฟไลน์ (ไม่มีสัญญาณเน็ต)' : '🌸 ภาพบรรยากาศจำลอง'}
              </span>
            </span>
          </div>
        ) : (
          /* Real Photography with Shimmer Loader */
          <>
            {imgLoading && (
              <div className="absolute inset-0 bg-gradient-to-r from-pink-100 via-slate-50 to-pink-100 animate-pulse flex items-center justify-center text-xs text-pink-400 font-bold z-10">
                กำลังโหลดภาพวิว...
              </div>
            )}
            <img
              src={spot.imageUrl}
              alt={spot.name}
              loading="lazy"
              onLoad={() => setImgLoading(false)}
              onError={() => {
                setImgLoading(false);
                setImgError(true);
              }}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            />
          </>
        )}

        {/* Overlay Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1 pointer-events-none z-20">
          {/* Location Badge */}
          <span className="px-2.5 py-1 rounded-xl bg-slate-900/75 backdrop-blur-xs text-white text-[11px] font-black flex items-center gap-1 shadow-xs">
            <MapPin size={12} className="text-rose-400" />
            <span>{spot.province}</span>
          </span>

          {/* Trip Duration Badge */}
          <span
            className={`px-2.5 py-1 rounded-xl backdrop-blur-xs text-[11px] font-black shadow-xs flex items-center gap-1 ${
              spot.durationDays <= 2
                ? 'bg-emerald-500/90 text-white'
                : 'bg-amber-500/90 text-white'
            }`}
          >
            <Clock size={12} />
            <span>{spot.tripDuration}</span>
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          {/* Title & Tag */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-black text-base sm:text-lg text-slate-900 leading-tight">
                {spot.name}
              </h4>
              <span className="text-xs text-pink-500 font-bold">
                {spot.region}
              </span>
            </div>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-pink-50 text-pink-700 font-extrabold border border-pink-200/60 shrink-0">
              {spot.tag}
            </span>
          </div>

          {/* Highlight */}
          <div className="p-2.5 rounded-xl bg-pink-50/50 border border-pink-100 text-xs text-slate-700">
            <span className="font-black text-pink-600 block mb-0.5">🌟 ไฮไลท์สำคัญ:</span>
            <span>{spot.highlight}</span>
          </div>

          {/* Description */}
          <p className="text-xs text-slate-600 leading-relaxed">
            {spot.description}
          </p>
        </div>

        {/* Nurse Wellbeing Tip & Best Time */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-900 leading-relaxed">
            <span className="font-black text-emerald-700 flex items-center gap-1 mb-0.5">
              <Heart size={13} className="text-emerald-500" />
              <span>เคล็ดลับฟื้นฟูสุขภาพสำหรับพยาบาล:</span>
            </span>
            <span>{spot.nurseTip}</span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium px-1">
            <span>ช่วงเวลาที่สวยที่สุด:</span>
            <span className="font-bold text-slate-700">{spot.bestTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
