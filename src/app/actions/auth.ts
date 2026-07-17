'use server';

// PIN verification for the personal device lock (PinLock.tsx). The PIN lives
// only in LR_HELPER_PIN (server-side env var) — it never reaches the browser
// bundle, unlike the previous hardcoded value in the client component.
export async function verifyPin(pin: string): Promise<boolean> {
  const correctPin = process.env.LR_HELPER_PIN;

  // Fail closed: no configured PIN means nothing unlocks, rather than
  // silently accepting any input or falling back to a guessable default.
  if (!correctPin) {
    console.error('LR_HELPER_PIN is not set — add it to .env before the lock screen can be used.');
    return false;
  }

  return pin === correctPin;
}
