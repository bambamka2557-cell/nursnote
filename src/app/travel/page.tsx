import { Suspense } from 'react';
import TravelClient from './TravelClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function TravelPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const monthParam = resolvedParams?.month ? parseInt(resolvedParams.month, 10) : new Date().getMonth() + 1;

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
