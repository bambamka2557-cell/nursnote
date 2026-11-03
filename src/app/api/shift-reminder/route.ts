import { NextRequest, NextResponse } from 'next/server';
import { runShiftReminder } from '@/lib/shiftReminder';

// Evening "tomorrow's shift" push. Hit every tick by its own step in
// .github/workflows/check-reminders.yml (after the medication step), and does
// nothing until the configured time (default 18:00 Bangkok), then sends once
// per day. Same Bearer CRON_SECRET guard as /api/check-reminders.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await runShiftReminder();
  return NextResponse.json(result);
}
