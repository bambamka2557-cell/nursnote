'use client';

import React from 'react';
import {
  Sparkles,
  Cherry,
  Flower2,
  Cat,
  Heart,
  Crown,
  Droplets,
  Flame,
  Stethoscope,
  BookOpen,
  Star,
  Award,
  Sun,
  Sunset,
  Moon,
  Palmtree,
  Flag,
  HeartPulse,
  Compass,
  Mountain,
  CloudSun,
  Trees,
  Waves,
  Tent,
  Camera,
} from 'lucide-react';

/**
 * Custom bow SVG icon in LR-Helper pastel theme
 */
function BowSvg({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 12C9.5 8.5 4 7 4 12c0 5 5.5 3.5 8 0Z" fill="currentColor" fillOpacity="0.2" />
      <path d="M12 12c2.5-3.5 8-5 8 0 0 5-5.5 3.5-8 0Z" fill="currentColor" fillOpacity="0.2" />
      <path d="M9.5 14.5 7 20" />
      <path d="M14.5 14.5 17 20" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}

/**
 * Renders a themed vector icon for daily calendar stickers (bow, cherry, flower, kitty, heart)
 */
export function StickerThemeIcon({
  stickerKey,
  size = 15,
  withBadge = true,
}: {
  stickerKey?: string | null;
  size?: number;
  withBadge?: boolean;
}) {
  if (!stickerKey) return null;

  const map: Record<
    string,
    { icon: React.ReactNode; badgeClass: string; iconClass: string }
  > = {
    bow: {
      icon: <BowSvg size={size} />,
      badgeClass: 'bg-pink-100/90 text-pink-600 border-pink-200',
      iconClass: 'text-pink-500',
    },
    cherry: {
      icon: <Cherry size={size} strokeWidth={2.2} />,
      badgeClass: 'bg-rose-100/90 text-rose-600 border-rose-200',
      iconClass: 'text-rose-500',
    },
    flower: {
      icon: <Flower2 size={size} strokeWidth={2.2} />,
      badgeClass: 'bg-fuchsia-100/90 text-fuchsia-600 border-fuchsia-200',
      iconClass: 'text-fuchsia-500',
    },
    kitty: {
      icon: <Cat size={size} strokeWidth={2.2} />,
      badgeClass: 'bg-amber-100/90 text-amber-600 border-amber-200',
      iconClass: 'text-amber-500',
    },
    heart: {
      icon: <Heart size={size} strokeWidth={2.2} className="fill-pink-400/30" />,
      badgeClass: 'bg-pink-100/90 text-pink-600 border-pink-200',
      iconClass: 'text-pink-500',
    },
  };

  const entry = map[stickerKey];
  if (!entry) return null;

  if (!withBadge) {
    return <span className={`inline-flex items-center justify-center ${entry.iconClass}`}>{entry.icon}</span>;
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg border p-1 shadow-2xs ${entry.badgeClass}`}
    >
      {entry.icon}
    </span>
  );
}

/**
 * Renders a themed vector icon for Thai holidays instead of raw OS emojis
 */
export function HolidayThemeIcon({
  iconKey,
  isPublicHoliday = true,
  size = 13,
}: {
  iconKey?: string;
  isPublicHoliday?: boolean;
  size?: number;
}) {
  const colorClass = isPublicHoliday ? 'text-rose-500' : 'text-amber-500';

  switch (iconKey) {
    case 'royal':
    case '👑':
    case '💛':
    case '💜':
    case '💙':
    case '🎗️':
      return <Crown size={size} className={colorClass} />;
    case 'water':
    case '💦':
      return <Droplets size={size} className="text-sky-500" />;
    case 'lotus':
    case '🪷':
    case '🌸':
      return <Flower2 size={size} className={colorClass} />;
    case 'lantern':
    case '🪔':
      return <Flame size={size} className="text-amber-500" />;
    case 'nurse':
    case '🩺':
      return <Stethoscope size={size} className="text-pink-500" />;
    case 'book':
    case '📜':
      return <BookOpen size={size} className={colorClass} />;
    case 'heart':
    case '💖':
    case '👩':
      return <Heart size={size} className="text-pink-500" />;
    case 'star':
    case '✨':
    case '🎆':
    case '🎄':
    case '🎈':
      return <Sparkles size={size} className={colorClass} />;
    case 'award':
    case '⚒️':
      return <Award size={size} className={colorClass} />;
    default:
      return isPublicHoliday ? (
        <Flag size={size} className="text-rose-500" />
      ) : (
        <Star size={size} className="text-amber-500" />
      );
  }
}

/**
 * Renders a themed vector icon for Wellness Tips (replaces raw emojis)
 */
export function WellnessThemeIcon({
  iconKey,
  size = 20,
}: {
  iconKey?: string;
  size?: number;
}) {
  switch (iconKey) {
    case 'moon':
    case '🌙':
      return (
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100/80 text-indigo-600 border border-indigo-200/60">
          <Moon size={size} />
        </span>
      );
    case 'stretch':
    case '🧘‍♀️':
      return (
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100/80 text-amber-600 border border-amber-200/60">
          <HeartPulse size={size} />
        </span>
      );
    case 'relax':
    case '🌸':
      return (
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-600 border border-emerald-200/60">
          <Flower2 size={size} />
        </span>
      );
    default:
      return (
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pink-100/80 text-pink-600 border border-pink-200/60">
          <Heart size={size} />
        </span>
      );
  }
}

/**
 * Renders a themed vector icon for Morning / Afternoon / Night atomic shifts
 */
export function ShiftAtomicIcon({
  code,
  size = 13,
}: {
  code: 'MORNING' | 'AFTERNOON' | 'NIGHT';
  size?: number;
}) {
  if (code === 'MORNING') {
    return <Sun size={size} className="text-pink-500 shrink-0" />;
  }
  if (code === 'AFTERNOON') {
    return <Sunset size={size} className="text-purple-500 shrink-0" />;
  }
  return <Moon size={size} className="text-indigo-500 shrink-0" />;
}

/**
 * Renders a themed travel icon for travel spots & seasonal badges
 */
export function TravelThemeIcon({
  month,
  hint,
  size = 16,
  className = 'text-pink-500',
}: {
  month?: number;
  hint?: string;
  size?: number;
  className?: string;
}) {
  if (hint) {
    if (/(ทะเล|หาด|เกาะ|ดำน้ำ|อ่าว)/.test(hint)) {
      return <Waves size={size} className={className} />;
    }
    if (/(ดอก|ซากุระ|พญาเสือโคร่ง|บัวตอง|ทุ่ง|ชมพู)/.test(hint)) {
      return <Flower2 size={size} className={className} />;
    }
    if (/(ประเพณี|ยี่เป็ง|ลอยกระทง|เทียน|เทศกาล)/.test(hint)) {
      return <Flame size={size} className={className} />;
    }
    if (/(ป่า|น้ำตก|นาขั้นบันได|ธรรมชาติ|เขื่อน|ล่องแพ)/.test(hint)) {
      return <Trees size={size} className={className} />;
    }
    if (/(ดอย|ภู|หมอก|หนาว|ยอดเขา)/.test(hint)) {
      return <Mountain size={size} className={className} />;
    }
  }
  if (month && [1, 10, 11, 12].includes(month)) {
    return <Mountain size={size} className={className} />;
  }
  if (month && [2, 3, 4, 5].includes(month)) {
    return <Waves size={size} className={className} />;
  }
  if (month && [6, 7, 8, 9].includes(month)) {
    return <Trees size={size} className={className} />;
  }
  return <Compass size={size} className={className} />;
}

export { Palmtree, Flag, Stethoscope, Sparkles, CloudSun, Tent, Camera };
