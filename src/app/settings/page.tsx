import { Bell } from 'lucide-react';
import ShiftReminderCard from '../components/ShiftReminderCard';

// ตั้งค่า — app-wide settings. Each section is its own card so more can be
// added later without reshuffling the page.
export default function SettingsPage() {
  return (
    <div className="mx-auto w-full max-w-xl space-y-5 pb-8 text-text-primary">
      <section className="space-y-2.5">
        <h2 className="flex items-center gap-1.5 px-1 text-xs font-semibold text-text-secondary">
          <Bell size={14} className="text-pink-500" />
          การแจ้งเตือน
        </h2>
        <ShiftReminderCard />
      </section>
    </div>
  );
}
