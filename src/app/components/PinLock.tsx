'use client';

export default function PinLock({ children }: { children: React.ReactNode }) {
  // Passcode lock screen removed per user request - no PIN entry needed.
  return <>{children}</>;
}

