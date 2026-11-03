import {
  ATOMIC_SHIFTS,
  SHIFT_PATTERNS,
  STICKER_OPTIONS,
  THAI_MONTH_NAMES_SHORT,
  matchShiftPattern,
  type SubShift,
} from '@/app/utils/shiftData';

// Pure text for the evening "tomorrow's shift" notification. No server
// imports, so the settings card can render the exact same preview the phone
// will get (src/lib/shiftReminder.ts sends it).

export type ShiftReminderPayload = {
  title: string;
  body: string;
  tag: string;
  url: string;
  icon: string;
  requireInteraction: boolean;
  renotify: boolean;
};

const THAI_DOW = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const SUB_EMOJI: Record<SubShift['code'], string> = {
  MORNING: '🌸',
  AFTERNOON: '🌷',
  NIGHT: '🌙',
};

// "YYYY-MM-DD" + n days, calendar arithmetic in UTC so it's timezone-proof.
export function addDaysToDateStr(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

function thaiShortDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${THAI_DOW[dow]} ${d} ${THAI_MONTH_NAMES_SHORT[m - 1]}`;
}

function parseShifts(raw: unknown): SubShift[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (s): s is SubShift => !!s && typeof s === 'object' && (s as SubShift).code in ATOMIC_SHIFTS
  );
}

// Pure: what the notification says. Exported so it can be checked by script.
export function buildShiftReminderPayload(
  dateStr: string,
  rawShifts: unknown,
  note?: string | null,
  sticker?: string | null
): ShiftReminderPayload {
  const shifts = parseShifts(rawShifts);
  const when = thaiShortDate(dateStr);
  const stickerEmoji = STICKER_OPTIONS.find((s) => s.key === sticker)?.emoji;
  const noteLine = note?.trim() ? `📝 ${note.trim()}` : null;

  const base = {
    tag: `shift-${dateStr}`,
    url: '/',
    icon: '/icon-192.png',
    // One calm reminder per evening — not the sticky, re-alerting style the
    // medication pushes need.
    requireInteraction: false,
    renotify: false,
  };

  if (shifts.length === 0) {
    return {
      ...base,
      title: `💕 พรุ่งนี้วันหยุด · ${when}`,
      body: ['พักผ่อนให้เต็มที่นะ 🌸', noteLine].filter(Boolean).join('\n'),
    };
  }

  const patternId = matchShiftPattern(shifts);
  // matchShiftPattern() falls back to 'OFF' for combos it doesn't know — but
  // there ARE shifts that day, so never call it a day off; list them instead.
  const label =
    patternId !== 'OFF'
      ? SHIFT_PATTERNS.find((p) => p.id === patternId)!.shortLabel
      : shifts.map((s) => ATOMIC_SHIFTS[s.code].shortLabel).join('/');

  const lines: string[] = [];
  // ด runs 00:00–08:00 *of that date*, i.e. it starts at midnight tonight.
  if (shifts[0].code === 'NIGHT') lines.push('⏰ เริ่มเที่ยงคืนนี้ (00:00)');
  for (const s of shifts) {
    const a = ATOMIC_SHIFTS[s.code];
    lines.push(`${SUB_EMOJI[s.code]} ${a.fullLabel} ${a.timeRange.replace(/\s/g, '')}${s.ot ? ' · OT' : ''}`);
  }
  if (noteLine) lines.push(noteLine);

  return {
    ...base,
    title: `🎀 พรุ่งนี้เวร ${label} · ${when}${stickerEmoji ? ` ${stickerEmoji}` : ''}`,
    body: lines.join('\n'),
  };
}

