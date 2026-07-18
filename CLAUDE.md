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

## สถานะระบบแจ้งเตือน (เช็คจริงล่าสุด 2026-07-18)

| ชั้น | สถานะ | ไฟล์หลัก |
|---|---|---|
| Foreground (แอปเปิดค้าง จอไม่ดับ) — สั่น+เสียง+notification | ✅ ใช้งานได้ | `ReminderEngine.tsx`, `lib/reminders.ts` |
| Background push (จอล็อก/แอปปิด) — โครงสร้าง | ✅ สร้างแล้ว, verify เฉพาะ backend logic | `lib/webpush.ts`, `app/api/check-reminders/route.ts`, `PushSubscription` model |
| Background push — end-to-end จริงบนมือถือ | ❌ **ยังไม่เคย verify** (sandbox แอปทดสอบไม่ได้เพราะ browser auto-deny permission) | ต้องทดสอบจริงบนมือถือ |
| Scheduler ที่ยิง `/api/check-reminders` เป็นระยะ | ⏳ เขียน workflow ไว้แล้ว แต่ **inert** จนกว่าจะ push repo ขึ้น GitHub + deploy Vercel + ตั้ง secrets | `.github/workflows/check-reminders.yml` |

**ต้องทำต่อก่อนระบบแจ้งเตือนพื้นหลังจะทำงานจริง:**
1. Push repo ขึ้น GitHub (ยังไม่มี remote เลย ตอนนี้มีแค่ local git)
2. Deploy ขึ้น Vercel ผูกกับ repo นั้น — ใส่ env vars ให้ครบ: `DATABASE_URL`, `DIRECT_URL`, `LR_HELPER_PIN`,
   `VAPID_PUBLIC_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `CRON_SECRET`
   (ค่าเดียวกับใน `.env` local — ห้าม commit `.env` ขึ้น git เด็ดขาด, มันอยู่ใน `.gitignore` แล้ว)
3. ตั้ง GitHub Actions secrets: `CHECK_REMINDERS_URL` (URL จริงจาก Vercel + `/api/check-reminders`) และ
   `CRON_SECRET` (ต้องตรงกับที่ตั้งใน Vercel)
4. **ทดสอบบนมือถือจริง** กด "เปิดแจ้งเตือน" → ปิดจอ → รอถึงเวลา order ครบกำหนด → เช็คว่า push เด้งจริง
   — iOS ต้อง **Add to Home Screen ก่อน** (iOS 16.4+) ถึงจะรับ background push ได้ เปิดผ่าน Safari tab
   ธรรมดาจะไม่ได้เลย

## Verify before done
เปิด dev server ทดสอบจริงทุกครั้งที่แก้ scheduling/reminder/PIN/push logic — ฟีเจอร์กลุ่มนี้พลาดแล้ว
กระทบผู้ใช้จริงโดยตรง อย่าเคลมว่าเสร็จจากแค่ build ผ่าน ถ้า sandbox ทดสอบ end-to-end ไม่ได้ (เช่น
notification permission ที่ browser automation deny เสมอ) ให้บอกตรงๆ ว่า "verify ไม่ได้ในนี้ ต้องทดสอบจริง"
ไม่ใช่เคลมว่าผ่านทั้งที่ยังไม่ได้เห็นจริง
