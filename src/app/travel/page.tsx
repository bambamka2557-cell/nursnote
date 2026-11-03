import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import TravelClient from './TravelClient';
import { FEATURE_TRAVEL } from '../utils/features';

interface PageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function TravelPage({ searchParams }: PageProps) {
  // Hidden for now — old bookmarks / home-screen links land on the schedule.
  if (!FEATURE_TRAVEL) redirect('/');

  const resolvedParams = await searchParams;

  // Bangkok local month default (Audit Note #4)
  const currentBangkokMonth = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' })
  ).getMonth() + 1;

  let monthParam = currentBangkokMonth;
  if (resolvedParams?.month) {
    const parsed = parseInt(resolvedParams.month, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 12) {
      monthParam = parsed;
    }
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-pink-50/40 flex items-center justify-center text-pink-500 font-bold">
          กำลังโหลดคู่มือท่องเที่ยวไทย...
        </div>
      }
    >
      <TravelClient initialMonth={monthParam} />
    </Suspense>
  );
}
