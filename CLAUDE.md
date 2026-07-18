@AGENTS.md

# LR-Helper — Agent Rules

ผู้ช่วยจับเวลา/แจ้งเตือนสำหรับพยาบาลห้องคลอด — **solo user, ไม่ใช่ระบบที่ รพ. อนุมัติ**
แผนงานเต็ม (critical/high/medium issues ตอนตั้งต้น): `C:\dev\NursProject\lr_helper_implementation_plan_v2.md`
— แผนนี้ **เก่ากว่าโค้ดจริงไปมากแล้ว** (โค้ดพัฒนาต่อทั้งจาก Claude และ Antigravity) ใช้เป็น background
context เรื่อง safety/PHI เท่านั้น อย่าเชื่อว่าอันไหน "ยังไม่ทำ" จากแผนนี้ — เช็คโค้ดจริงเสมอ

## Stack
Next.js 16 (App Router) + React 19 + Prisma 6 + Postgres ผ่าน Supabase (`DATABASE_URL`/`DIRECT_URL`)
+ Tailwind v4 + daisyUI + `web-push` (Web Push/VAPID) + Zustand (ยังไม่เห็นจุดใช้จริงในโค้ด)

**Prisma client**: import จาก `@prisma/client` (มาตรฐาน ไม่ใช่ custom output path) — client จริงอยู่ที่
`node_modules/.prisma/client/`. **`src/generated/prisma/` เป็นโฟลเดอร์เก่าที่ไม่มีอะไร import ใช้แล้ว
— ไม่ต้องแก้/ไม่ต้อง sync ตามมัน** (เคยสับสนมาแล้วครั้งหนึ่ง ว่า schema ใหม่ไม่ถูก pick up เพราะดูโฟลเดอร์ผิด)

**ไม่มี migration history** (`prisma/migrations/` ไม่มี) — ใช้ `npx prisma db push` sync schema ตรงๆ
ตาม pattern เดิมของโปรเจกต์ อย่าเริ่ม `prisma migrate dev` เองโดยไม่คุยก่อน (เปลี่ยน workflow ทั้งหมด)

**`package.json`'s `build` ต้องเป็น `prisma generate && next build` เสมอ ห้ามลดกลับเหลือแค่ `next build`**
(2026-07-18: แก้ schema เพิ่ม field ใหม่, `npx prisma db push` local สำเร็จ, build local ผ่าน — แต่ deploy
บน Vercel **fail เงียบๆ หลายรอบติด** เพราะ npm install cache ข้าม `@prisma/client`'s postinstall hook ไป
ทำให้ generated client ไม่ตรง schema ล่าสุด, error "'rr' does not exist in type..." — Vercel เสิร์ฟ build
เก่าต่อ (ยัง 200 อยู่ปกติ) ดูจาก curl เฉยๆ**ไม่รู้เลยว่า deploy พัง** ต้องเข้าไปดู Deployments tab จริงๆ) —
ทุกครั้งที่แก้ `schema.prisma` ต้องเช็ค Vercel Deployments ว่าขึ้นเขียว ไม่ใช่แค่ curl 200

**Windows + dev server ที่รันค้างอยู่**: `prisma generate` มักพัง `EPERM` เพราะ query engine DLL ถูก
dev server lock อยู่ — **ไม่ต้อง panic** ปกติ TS client code (types) regenerate สำเร็จอยู่ดี มีแค่ binary
swap ที่พัง และ engine เป็น schema-generic (อ่าน DMMF จาก client) ใช้งานได้จริงแม้ binary จะเก่า — verify
ด้วยการรัน query จริงเทียบ (ไม่ต้องเดา, ไม่ต้อง restart dev server ก็ได้ถ้า query ผ่านจริง)

## บริบทที่ต้องระวังเป็นพิเศษ (safety-critical, ไม่ใช่แอปทั่วไป)

1. **Reminder พลาด = พลาดรอบยาจริงของคนไข้จริง** (Oxytocin/MgSO4/Bricanyl timing) — โค้ดส่วน
   interval/scheduling/push ต้องระวังเป็นพิเศษ ห้ามแก้ default logic แบบเดาเอง ถ้าไม่แน่ใจให้ถามก่อน
2. **Default ของ preset order คือตัวช่วยกรอกเร็ว ไม่ใช่ source of truth** — คำเตือนนี้แสดงอยู่แล้วในหน้า
   "รับผู้ป่วยใหม่" (`src/app/add/page.tsx`) ห้ามลบ
3. **PHI discipline**: schema เก็บ `nickname` + `bedNumber` เท่านั้น โดยตั้งใจ — **ห้ามเพิ่มฟิลด์ชื่อเต็ม/
   HN/AN จริงกลับเข้าไปใน schema หรือ UI โดยไม่ถามก่อน** แม้จะดู "สะดวกกว่า" ก็ตาม
4. **การลบ/หยุด order เป็น destructive จริง** — cascade ลบ `eventLog` (ประวัติการให้ยา) ไปด้วย ทุกปุ่มที่
   ลบ order ต้องมี confirm ที่บอกชัดว่าประวัติจะหายจากบันทึกส่งเวรด้วย (ดู `DiscontinueButton.tsx`)

## Code audit (2026-07-18) — Antigravity ตรวจ, Claude verify + แก้ทุกข้อแล้ว

Antigravity ตรวจโค้ดทั้งระบบเจอ 4 ประเด็น — เช็คโค้ดจริงยืนยันครบทุกข้อว่าเป็นบั๊กจริง (ไม่ใช่ AI มโน)
และแก้ครบทุกข้อแล้ว รายละเอียด/เหตุผลของแต่ละ fix ดูใน commit message ตรงๆ:

| ข้อ | ปัญหา | Fix | Commit |
|---|---|---|---|
| MgSO4 data loss | ค่า RR/Urine/DTR ที่กรอกในป๊อปอัปถูกทิ้ง ไม่เก็บ ไม่โชว์ในรายงานส่งเวร | เพิ่ม `rr/urineOutput/reflex` ใน `EventLog`, ต่อเข้า `logEvent()`, โชว์ในรายงาน — verify end-to-end จริงแล้ว | `41aa5fe` |
| Auto-purge เกิน 24ชม. | ลบคนไข้ตามอายุอย่างเดียว ทั้งที่ยังรักษาอยู่จริง (induction/preeclampsia นอนเกิน 24ชม.ได้ปกติ) | เพิ่มเงื่อนไข `orders: { none: {} }` — มี order ค้างอยู่ = ไม่โดนลบอัตโนมัติไม่ว่าจะนานแค่ไหน | `ecb399a` |
| Heuristic เวลาอนาคต 2ชม. | ตั้งเวลาล่วงหน้าเกิน 2ชม.ในวันเดียวกันถูกเข้าใจผิดเป็น "เมื่อวาน" → ระบบขึ้น "เลยเวลา 20ชม." ทันทีที่รับเคส | ขยาย threshold เป็น 12ชม. (ยังรองรับเคสเปลี่ยนเวรข้ามเที่ยงคืนถูกต้อง) — verify ด้วย script จริง 3 เคส | `cf27c69` |
| Beep ไม่ตรงกับ push | แอปเปิดค้าง (foreground) เตือนครั้งเดียวจบ ต่างจาก background push ที่เตือนซ้ำทุก 5 นาที | เปลี่ยน dedup จาก "fired-once Set" เป็น "last-fired-at Map" ให้ re-fire ทุก 5 นาทีเหมือนกัน | `c68ff0f` |

ถ้า Antigravity หรือใครส่ง audit report มาให้ตรวจอีกในอนาคต — เช็คโค้ดจริงเทียบทุกข้อก่อนเชื่อ/แก้เสมอ
(pattern เดิมของโปรเจกต์นี้) อย่าเชื่อ severity ที่ report ให้มาตรงๆด้วย ประเมินเองอีกชั้น (เช่น ข้อ auto-purge
ที่ Antigravity ให้ 🟡 ปานกลาง แต่จริงๆ ผลกระทบสูงกว่านั้นเพราะข้อมูลหายเงียบๆโดยพยาบาลไม่รู้ตัว)

## สถานะระบบแจ้งเตือน (เช็คจริงล่าสุด 2026-07-18)

Deploy จริงแล้วที่ `https://nursnote.vercel.app` (Vercel project `nursnote`, repo `bambamka2557-cell/nursnote`)

| ชั้น | สถานะ | ไฟล์หลัก |
|---|---|---|
| Foreground (แอปเปิดค้าง จอไม่ดับ) — สั่น+เสียง+notification | ✅ **verify แล้วบน production จริง** (เห็น toast แจ้งเตือนจริงจาก nursnote.vercel.app) | `ReminderEngine.tsx`, `lib/reminders.ts` |
| Background push (จอล็อก/แอปปิด) — โครงสร้าง | ✅ สร้างแล้ว, verify เฉพาะ backend logic | `lib/webpush.ts`, `app/api/check-reminders/route.ts`, `PushSubscription` model |
| Background push — end-to-end จริงบนมือถือ | ❌ **ยังไม่เคย verify** (sandbox แอปทดสอบไม่ได้เพราะ browser auto-deny permission) | ต้องทดสอบจริงบนมือถือ |
| Scheduler ที่ยิง `/api/check-reminders` เป็นระยะ | ✅ ตั้ง secrets แล้ว + manual run เขียว (curl ยิงถูก endpoint จริง) รันอัตโนมัติทุก 5 นาทีแล้ว | `.github/workflows/check-reminders.yml` |

**เหลือขั้นตอนเดียวก่อนระบบแจ้งเตือนพื้นหลังจะ verify ครบ:**
1. ~~Push repo ขึ้น GitHub~~ ✅ เสร็จแล้ว
2. ~~Deploy ขึ้น Vercel~~ ✅ เสร็จแล้ว (`nursnote.vercel.app`)
3. ~~ตั้ง GitHub Actions secrets~~ ✅ เสร็จแล้ว (`CHECK_REMINDERS_URL`, `CRON_SECRET`), manual trigger ทดสอบผ่าน
4. ~~ทดสอบบนมือถือจริง~~ ✅ **verify แล้วบน iPhone จริง** (จอล็อก, ผ่าน Add to Home Screen) — push เด้งจริง
   ตอนล็อกจอ ยืนยันครบทั้ง 4 ชั้นของระบบแจ้งเตือนแล้ว

**iOS web push — ข้อจำกัดจริงที่ยืนยันแล้ว ไม่ใช่บั๊ก แก้ไม่ได้ด้วยโค้ด:**
- **เสียง**: iOS ไม่รองรับไฟล์เสียงกำหนดเองสำหรับ web push เลย ใช้เสียง default ของระบบตายตัว (สั้น เบา)
- **สั่น**: `vibrate` option ใน `showNotification()` ถูก iOS Safari/WebKit เพิกเฉยเสมอ — ที่รู้สึกสั่นได้คือ
  haptic default ของ iOS เอง ไม่ใช่ pattern ที่โค้ดตั้ง ปรับความยาว/ความแรงไม่ได้
- **ทางแก้ที่ใช้จริง (2026-07-18)**: เนื่องจากเตือนครั้งเดียวสั้นๆ พลาดง่าย เปลี่ยนจาก "แจ้งครั้งเดียวต่อ
  due-instance" เป็น **ส่ง push ซ้ำทุก tick ของ cron (ทุก ~5 นาที) ตราบใดที่ order ยังไม่ถูกให้** — ดู
  `check-reminders/route.ts` (`toNotify = due` ไม่กรองด้วย `lastNotifiedKey` อีกต่อไป) + `sw.js`
  (`renotify: true` ทำให้แต่ละรอบ re-alert จริง ไม่ใช่แค่ silently update notification เดิม)

**Gotcha ที่เจอจริงตอน deploy (2026-07-18) — Supabase direct connection ใช้จาก Vercel serverless ไม่ได้:**
`DATABASE_URL` ที่ชี้ direct connection (`db.<ref>.supabase.co:5432`) ใช้ได้ปกติจาก local แต่ทำให้ build
พังตอน static-generate (fix ด้วย `export const dynamic = 'force-dynamic'` บนหน้าที่ query DB ตรงๆ — ดู
`page.tsx`, `patient/[id]/report/page.tsx`) แล้วก็ยังพังต่อตอน runtime ด้วย `PrismaClientInitializationError:
Can't reach database server` เพราะ Vercel serverless ต่อ direct port 5432 ของ Supabase ไม่ได้ (ปัญหา known
issue) — **ทางแก้: `DATABASE_URL` ต้องใช้ connection pooler (Transaction mode, port 6543,
`aws-0-<region>.pooler.supabase.com`, username เปลี่ยนเป็น `postgres.<project-ref>`, ต่อท้ายด้วย
`?pgbouncer=true`) ส่วน `DIRECT_URL` ปล่อยเป็น direct 5432 เหมือนเดิม** (Prisma migrate/db push ต้องการ direct
connection, รันจาก local เท่านั้น ไม่ได้รันบน Vercel) — ถ้าเจอ error นี้อีกใน Supabase+Vercel project อื่น
ให้เช็คจุดนี้ก่อนเลย

**Gotcha ที่เจอจริง (2026-07-18) — เวลาที่ format ฝั่ง server เพี้ยน -7 ชม.:** Vercel serverless ไม่ได้รันที่
Asia/Bangkok (default UTC) และ **`TZ` เป็นชื่อ env var ที่ Vercel reserve ไว้เอง ตั้งเองจาก dashboard ไม่ได้
เลย** (ขึ้น error "The name of your Environment Variable is reserved") ลอง `process.env.TZ = '...'` ใน
`instrumentation.ts` แล้วก็ไม่ทำงานจริงบน production เช่นกัน (verify แล้วว่าไม่ช่วย) — **ทางแก้ที่ใช้จริง**:
ทุกจุดที่ format วันที่ในไฟล์ server-side (ไม่มี `'use client'`) ต้องใช้ `date-fns-tz`'s
`formatInTimeZone(date, 'Asia/Bangkok', fmt)` แทน `date-fns`'s `format()` ธรรมดา — ระบุ timezone ตรงๆทุกครั้ง
ไม่พึ่ง server's ambient timezone เลย ไฟล์ที่ต้องระวัง (grep `format(` ในไฟล์ที่ไม่มี `'use client'`):
`page.tsx` (dashboard), `patient/[id]/report/page.tsx`, `api/check-reminders/route.ts` — client component
(`ReminderEngine.tsx`, `TimelineClient.tsx`, `add/page.tsx`) ใช้ `format()` ปกติได้ เพราะ browser ผู้ใช้จริง
อยู่ Asia/Bangkok อยู่แล้ว ไม่มีปัญหา

## Verify before done
เปิด dev server ทดสอบจริงทุกครั้งที่แก้ scheduling/reminder/PIN/push logic — ฟีเจอร์กลุ่มนี้พลาดแล้ว
กระทบผู้ใช้จริงโดยตรง อย่าเคลมว่าเสร็จจากแค่ build ผ่าน ถ้า sandbox ทดสอบ end-to-end ไม่ได้ (เช่น
notification permission ที่ browser automation deny เสมอ) ให้บอกตรงๆ ว่า "verify ไม่ได้ในนี้ ต้องทดสอบจริง"
ไม่ใช่เคลมว่าผ่านทั้งที่ยังไม่ได้เห็นจริง

**เช็ค Vercel Deployments tab จริง ไม่ใช่แค่ curl 200:** curl/browser ที่ตอบ 200 ไม่ได้แปลว่า deploy ล่าสุด
สำเร็จ — Vercel เสิร์ฟ build **ที่แล้ว** ต่อถ้า build ล่าสุด fail (ไม่ down) หลัง push ที่แตะ `schema.prisma`
หรือ dependency ใหม่ ให้เข้าไปดู Deployments tab ว่าขึ้นเขียว/Ready จริง ก่อนจะเชื่อว่า fix ขึ้น production แล้ว
