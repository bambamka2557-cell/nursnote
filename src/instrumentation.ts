// Runs once when the server starts (Next.js instrumentation hook). Vercel's
// serverless functions default to TZ=UTC, but every date-fns format() call
// in server components/actions (dashboard, handover report, check-reminders)
// renders using the process's local timezone — without this, a nurse
// entering "08:00" (her real Bangkok time) gets displayed back as "01:00"
// everywhere the server renders it, and due-time labels shift by the same
// -7h. This app has one timezone: Asia/Bangkok (single hospital, no remote
// users), so pinning it here is correct rather than doing real per-request
// timezone handling.
export function register() {
  process.env.TZ = 'Asia/Bangkok';
}
