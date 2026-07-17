@AGENTS.md

# LR-Helper — Agent Rules

ผู้ช่วยจับเวลา/แจ้งเตือนสำหรับพยาบาลห้องคลอด — **solo user, ไม่ใช่ระบบที่ รพ. อนุมัติ**
แผนงานเต็ม (critical/high/medium issues, verification plan): `C:\dev\NursProject\lr_helper_implementation_plan_v2.md`

## Stack
Next.js 16 (App Router) + React 19 + Prisma 6 (`prisma-client-js`, generated to `src/generated/prisma/`)
+ Postgres ผ่าน Supabase (`DATABASE_URL`/`DIRECT_URL` — pooled + direct connection) + Tailwind v4 + daisyUI + Zustand.
DB access ทั้งหมดผ่าน **Prisma server actions** (`src/app/actions/*.ts`, `'use server'`) — ไม่ใช่เรียก
`@supabase/supabase-js` ตรงๆ แบบโปรเจกต์ StoneWorks/JadStore (แพ็กเกจนี้ยังอยู่ใน `package.json` แต่ยังไม่เห็นจุดใช้จริงในโค้ด)

## บริบทที่ต้องระวังเป็นพิเศษ (safety-critical, ไม่ใช่แอปทั่วไป)

1. **Reminder พลาด = พลาดรอบยาจริงของคนไข้จริง** (Oxytocin/MgSO4 timing) — โค้ดส่วน interval/scheduling
   ต้องระวังเป็นพิเศษ ห้ามแก้ default logic แบบเดาเอง ถ้าไม่แน่ใจให้ถามก่อน
2. **Default ของ Quick Action คือตัวช่วยกรอกเร็ว ไม่ใช่ source of truth** (H02) — MgSO4 บาง case
   ปรับ interval ตาม renal function เฉพาะราย ห้ามลบ/ข้าม prompt ให้เช็ค order จริงถ้ามีการเพิ่มเข้ามา
3. **PHI discipline**: schema เก็บ `nickname` + `bedNumber` เท่านั้น โดยตั้งใจ — **ห้ามเพิ่มฟิลด์ชื่อเต็ม/HN/AN จริง**
   กลับเข้าไปใน schema หรือ UI โดยไม่ถามก่อน แม้จะดู "สะดวกกว่า" ก็ตาม

## ช่องว่างที่รู้อยู่แล้วระหว่างแผน v2 กับโค้ดจริง (เช็คจริงแล้ว ณ 2026-07-18)

อย่าสมมติว่าอันไหน "ทำแล้ว" จากแค่อ่านแผน — โค้ดจริงตอนนี้:

- **C02 SQLite → Supabase: แก้แล้ว** — `prisma/schema.prisma` เป็น `provider = "postgresql"` แล้ว
- **C01 auto-purge: ยังไม่ครบ** — schema มี `Patient.expiresAt` แต่ `getPatients()`
  (`src/app/actions/patient.ts`) ใช้ hardcode `createdAt < 24hr ago` แทน ไม่ได้อ่าน `expiresAt` เลย
- **PIN lock ยัง hardcode**: `PinLock.tsx` มี `const CORRECT_PIN = '1234'` เป็น plaintext ใน
  client component (ไปโผล่ใน browser bundle ตรงๆ) — เป็นค่า placeholder ของ prototype ยังไม่ได้ทำเป็น
  ค่าที่ผู้ใช้ตั้งเอง/เก็บฝั่ง server
- **H02 prompt เช็ค order จริง, M01 MgSO4 checklist, M02 offline cache**: ยังไม่มีในโค้ด —
  โครงสร้างไฟล์ตอนนี้คือ `src/app/add/page.tsx` (ไม่ใช่ `AddOrderModal.tsx` ตามที่แผนเขียนไว้)

ถ้าถูกขอให้แก้จุดพวกนี้ ให้ทวนกับแผน v2 ก่อนเริ่ม เพราะมีเหตุผลเชิง safety/PHI อยู่เบื้องหลังการออกแบบ ไม่ใช่แค่ UX

## Verify before done
เปิด dev server ทดสอบจริงทุกครั้งที่แก้ scheduling/reminder/PIN logic — ฟีเจอร์กลุ่มนี้พลาดแล้วกระทบ
ผู้ใช้จริงโดยตรง อย่าเคลมว่าเสร็จจากแค่ build ผ่าน
