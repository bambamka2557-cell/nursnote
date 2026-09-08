# แผนการพัฒนา Feature: ปฏิทินตารางเวร + ระบบคำนวณเงินเดือนและค่าตอบแทนพยาบาล

ระบบสำหรับช่วยให้พยาบาลบันทึกตารางเวรประจำเดือนสไตล์ Hello Kitty พาสเทล พร้อม**ระบบคำนวณเงินเดือน ค่าเวร และค่าตอบแทนวิชาชีพโดยอัตโนมัติ**ในแต่ละเดือน โดยออกแบบเป็นโมดูลอิสระ (**ไม่กระทบระบบคนไข้, การจับเวลารอบยา หรือการแจ้งเตือนเดิม**)

---

## User Review Required

> [!IMPORTANT]
> **การคำนวณค่าตอบแทนอัตโนมัติจากตารางเวร**:
> - เมื่อพยาบาลลงเวรในปฏิทิน (เช้า, บ่าย, ดึก, เช้า/บ่าย, เช้า/ดึก ฯลฯ) ระบบจะนำจำนวนเวรในเดือนนั้นมาคูณกับอัตราค่าเวรที่ตั้งค่าไว้โดยอัตโนมัติ
> - พยาบาลสามารถกำหนดอัตราค่าเวรและรายการเงินเดือน/ค่าตอบแทนของตนเองได้ (เพราะแต่ละ รพ./วอร์ด/ประเภทการจ้าง มีอัตราต่างกัน)
> - มีปุ่ม **"ซ่อน/แสดงตัวเลขเงิน" (👁️ Privacy Toggle)** เพื่อป้องกันไม่ให้บุคคลอื่นมองเห็นยอดเงินขณะเปิดใช้งานในวอร์ด
>   *(หมายเหตุ audit: ปุ่มนี้เป็นแค่การซ่อนบนหน้าจอ (client-side / localStorage) กันคนแอบมองข้างๆ ไม่ใช่ระบบล็อกด้วยรหัส — ตัวเลขยังอยู่ใน DB/network ตามปกติ ระบุให้ชัดว่าไม่ใช่ security)*

---

## ❗ Decisions to Confirm ก่อน Antigravity ลงมือ (จาก audit)

แผนเดิมยังไม่ได้ระบุ "สูตรคิดเงิน" ให้ deterministic — ถ้าปล่อยไว้ AI ที่ลงมือจะ**เดาเอา** แล้วยอดเงินอาจผิด ประเด็นที่ต้องยืนยันก่อน (ผมใส่ค่า default ที่แนะนำไว้ให้แล้วในสูตรด้านล่าง แต่ควรเช็คกับโครงสร้างค่าตอบแทนจริงของวอร์ด):

1. **โมเดลค่าเวรควบ (double shift):** แนะนำใช้แบบ **บวกองค์ประกอบ** (M/N = ค่าเวรเช้า + ค่าเวรดึก) แทนการตั้ง `doubleShiftRate` แบนตัวเดียว — เพราะ M/A, M/N, A/N จ่ายไม่เท่ากันจริง และทำให้ตัวคูณวันหยุดนิยามได้ชัด ต้องยืนยันว่า รพ. จ่ายแบบนี้จริงไหม
2. **ตัวคูณวันหยุด (`holidayMultiplier`):** แนะนำให้คูณ**เฉพาะค่าเวรของวันนั้น** ไม่คูณเงินเดือน/ค่า พ.ต.ส. — ยืนยันขอบเขต และ `isHoliday` ตั้งเองด้วยมือต่อวัน (ไม่ auto จากปฏิทินนักขัตฤกษ์)
3. **เวรเช้ามีค่าเวรไหม:** default ตั้ง `morningRate = 0` (เวรเช้าในเวลาราชการปกติมักไม่มีค่าเวร) — ยืนยัน
4. **การแก้เรตย้อนหลัง:** ยอดคำนวณจาก config ปัจจุบัน × จำนวนเวร ไม่ได้ snapshot เรตรายเดือน ⇒ แก้เรตวันนี้จะกระทบยอดของเดือนก่อนๆ ด้วย (ยอมรับได้สำหรับแอปส่วนตัว แต่ให้เป็นการตัดสินใจที่รู้ตัว)

---

## สรุปฟังก์ชันการทำงาน (Proposed Features)

### 1. ปฏิทินตารางเวร Hello Kitty (Shift Calendar)
- แสดงปฏิทินแบบ 7 วัน โทนสีชมพูพาสเทลตามภาพอ้างอิง
- แถบเวรสีพาสเทล:
  - 🌸 **เช้า (M)**
  - 🍇 **บ่าย (A)**
  - ☀️ **ดึก (N)**
  - 🍊 **เช้า/บ่าย (M/A)**
  - 🌊 **เช้า/ดึก (M/N)**
  - 🌙 **บ่าย/ดึก (A/N)**
  - 🌿 **หยุด (OFF)**
- สติกเกอร์น่ารักประจำวัน (🎀 โบว์, 🍒 เชอร์รี่, 🌸 ดอกไม้, 🐱 คิตตี้, 💖 หัวใจ)
- บันทึกโน้ตสั้นประจำวัน (เช่น "แลกเวรกับพี่ดาว")

### 2. ระบบคำนวณเงินเดือนและค่าตอบแทน (Salary & Allowance Calculator)
- **การคำนวณค่าเวรอัตโนมัติ (Shift Allowances)** — คำนวณตามจำนวนเวรที่ลงไว้ในเดือนนั้นๆ:
  > 📌 **สูตรที่ใช้จริง = ตาราง compositional ใน "Audit Notes — สูตรคำนวณ" ด้านล่าง (authoritative)** รายการสรุปด้านล่างนี้เป็นภาพรวมเฉยๆ ถ้าขัดกันให้ยึด Audit Notes
    - ค่าเวรของแต่ละวัน = ผลรวมเรตของกะที่ลง (เช่น เช้า/ดึก = เรตเช้า + เรตดึก)
    - วันหยุด (`isHoliday`) = ค่าเวรของวันนั้น × `holidayMultiplier`
- **เงินเดือนและค่าตอบแทนประจำ (Base & Allowances)**:
  - เงินเดือนพื้นฐาน (Base Salary)
  - ค่า พ.ต.ส. (เบี้ยเลี้ยงตำแหน่งวิชาชีพ)
  - ค่าไม่ทำเวชปฏิบัติส่วนตัว / เบี้ยเลี้ยงเหมาจ่าย (ฉ.11 / ฉ.8)
  - ค่าเวรหัวหน้าเวร / ตรวจการ (In-charge)
  - ค่าตอบแทนพิเศษอื่นๆ
- **รายการหัก (Deductions - เลือกใส่ได้)**:
  - กบข. / ประกันสังคม / ภาษี ณ ที่จ่าย / สหกรณ์
- **สรุปรายได้สุทธิประจำเดือน (Monthly Net Income Summary)**:
  - แสดงการ์ดสรุปยอดเงินรวมสุทธิประจำเดือน
  - ดูแจกแจงรายละเอียด (Breakdown) แต่ละรายการได้ชัดเจน

### 3. หน้าจอตั้งค่าอัตราค่าตอบแทน (Compensation Settings Modal)
- ป๊อปอัปให้พยาบาลแก้ไขอัตราค่าตอบแทนของตนเองได้ตลอดเวลา และบันทึกเก็บไว้ใช้งานในทุกๆ เดือนถัดไป

---

## Proposed Changes

### 1. Database Schema ([schema.prisma](file:///c:/Users/rttuser/Project_Atthanop/lr-helper__/prisma/schema.prisma))
#### [MODIFY] [schema.prisma](file:///c:/Users/rttuser/Project_Atthanop/lr-helper__/prisma/schema.prisma)
เพิ่มโมเดลใหม่ 2 ตาราง (ไม่ยุ่งเกี่ยวกับตาราง `Patient`, `Order`, หรือ `EventLog`):
```prisma
// ข้อมูลตารางเวรแต่ละวัน
model ShiftSchedule {
  id        String   @id @default(uuid())
  date      String   @unique // "YYYY-MM-DD"
  shiftType String   // "MORNING", "AFTERNOON", "NIGHT", "MORNING_AFTERNOON", "MORNING_NIGHT", "AFTERNOON_NIGHT", "OFF"
  note      String?
  sticker   String?  // "bow", "cherry", "flower", "kitty", "heart"
  isHoliday Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// การตั้งค่าอัตราเงินเดือนและค่าเวร
model NurseSalaryConfig {
  id                    String   @id @default("default")
  baseSalary            Float    @default(0)    // เงินเดือนพื้นฐาน
  morningRate           Float    @default(0)    // ค่าเวรเช้า (กรณีคิดค่าเวร)
  afternoonRate         Float    @default(450)  // ค่าเวรบ่าย
  nightRate             Float    @default(550)  // ค่าเวรดึก
  doubleShiftRate       Float    @default(1000) // (ทางเลือก) ไม่ใช้ในสูตร compositional ที่แนะนำ — ดู Audit Notes
  holidayMultiplier     Float    @default(1.5)  // ตัวคูณวันหยุด (คูณเฉพาะค่าเวรของวันนั้น)
  ptsAllowance          Float    @default(1500) // ค่า พ.ต.ส.
  noPrivatePractice     Float    @default(0)    // ค่าไม่ทำเวชฯ / ฉ.11
  inChargeAllowance     Float    @default(0)    // ค่าหัวหน้าเวร
  otherAllowance        Float    @default(0)    // ค่าอื่นๆ
  // --- รายการหัก: แยกให้ครบตาม feature list (เดิม schema มีแค่ 2 แต่ feature ระบุ 4) ---
  taxDeduction          Float    @default(0)    // ภาษี ณ ที่จ่าย
  socialSecurity        Float    @default(0)    // ประกันสังคม
  providentFund         Float    @default(0)    // กบข. (ข้าราชการ — มักใช้แทนประกันสังคม)
  coopDeduction         Float    @default(0)    // สหกรณ์ออมทรัพย์
  otherDeduction        Float    @default(0)    // หักอื่นๆ
  updatedAt             DateTime @updatedAt
}
```

> **⚠️ Audit Notes — schema (ต้องอ่านก่อนเขียน action):**
> - **`NurseSalaryConfig` เป็น singleton** (`id @default("default")`) — ทุก action ต้อง `upsert({ where: { id: 'default' }, ... })` และหน้า UI ต้องรองรับกรณี **ยังไม่มี row เลย (รันครั้งแรก)** โดยถือว่าเป็นค่า default ไม่ใช่ throw
> - **`date` เก็บเป็น String `"YYYY-MM-DD"`** — ดีแล้ว เพราะเลี่ยงปัญหา timezone ของ Vercel (ดู CLAUDE.md) **ห้าม** แปลงเป็น `Date` ฝั่ง server เพื่อจัดกลุ่มรายเดือน — กรองด้วย prefix ของ string (เช่น `date: { startsWith: '2026-09' }` หรือ `gte/lt`) เท่านั้น
> - **2 ตารางใหม่นี้ไม่ถูกแตะโดย `purgeExpiredPatients()`** (ลบเฉพาะ `Patient` ที่ไม่มี order) — ยืนยันแล้วว่าปลอดภัย ห้ามใครไป "ต่อยอด" ให้ purge มากวาดตารางเวร/เงินเดือน

### 2. Server Actions
#### [NEW] [src/app/actions/shift.ts](file:///c:/Users/rttuser/Project_Atthanop/lr-helper__/src/app/actions/shift.ts)
- จัดการดึงเวร, บันทึกเวร, ลบเวร
#### [NEW] [src/app/actions/salary.ts](file:///c:/Users/rttuser/Project_Atthanop/lr-helper__/src/app/actions/salary.ts)
- ดึงและบันทึกการตั้งค่าอัตราค่าตอบแทน `NurseSalaryConfig` ผ่าน `upsert({ where: { id: 'default' } })`
- คำนวณสรุปยอดเงินเดือนและค่าเวรประจำเดือนที่เลือก

> **⚠️ Audit Notes — สูตรคำนวณ (deterministic spec ห้ามเดา):**
>
> **1. ค่าเวรต่อวัน (compositional model — แนะนำ):**
> | shiftType | allowance ของวันนั้น |
> |---|---|
> | `OFF` | 0 |
> | `MORNING` | `morningRate` |
> | `AFTERNOON` | `afternoonRate` |
> | `NIGHT` | `nightRate` |
> | `MORNING_AFTERNOON` | `morningRate + afternoonRate` |
> | `MORNING_NIGHT` | `morningRate + nightRate` |
> | `AFTERNOON_NIGHT` | `afternoonRate + nightRate` |
>
> ถ้า `isHoliday === true` ให้เอา allowance ของวันนั้น **× `holidayMultiplier`** (คูณเฉพาะค่าเวร ไม่คูณเงินเดือน/พ.ต.ส.)
>
> **2. ยอดสุทธิรายเดือน:**
> ```
> รายรับ  = baseSalary + ptsAllowance + noPrivatePractice + inChargeAllowance + otherAllowance
>          + Σ(allowanceของแต่ละวันในเดือนนั้น)
> รายหัก  = taxDeduction + socialSecurity + providentFund + coopDeduction + otherDeduction
> สุทธิ   = รายรับ − รายหัก
> ```
> *(หมายเหตุ: เงินเดือน/ค่าประจำ/รายหัก เป็นค่าคงที่ต่อเดือนจาก config — ค่าที่เปลี่ยนตามเดือนคือ Σ ค่าเวรเท่านั้น)*
>
> **3. การกรองเดือน — TIMEZONE GOTCHA (สำคัญ):** action นี้รันบน Vercel (UTC ไม่ใช่ Asia/Bangkok, และ `TZ` เป็น env var สงวน แก้ไม่ได้ — ดู CLAUDE.md)
> - กรองเวรของเดือนด้วย **string prefix** ของ `date` เท่านั้น เช่น `where: { date: { startsWith: '2026-09' } }` — **ห้าม** `new Date(date).getMonth()` ฝั่ง server (จะเพี้ยน −7 ชม. ทำให้เวรวันที่ 1 ตก 00:00–07:00 ถูกนับเป็นเดือนก่อน → ยอดเงินผิด)
> - ถ้าต้องหา "เดือนปัจจุบัน" เป็น default ฝั่ง server ให้ใช้ `formatInTimeZone(new Date(), 'Asia/Bangkok', 'yyyy-MM')` (จาก `date-fns-tz`) ไม่ใช่ `format()` ธรรมดา

### 3. Frontend Components & Pages
#### [NEW] [src/app/schedule/page.tsx](file:///c:/Users/rttuser/Project_Atthanop/lr-helper__/src/app/schedule/page.tsx)
- หน้าหลักรวมปฏิทินตารางเวรและการ์ดสรุปรายได้ (server component: ดึงเวร + config รอบแรกแล้วส่ง `initialData` ให้ client component — pattern เดียวกับ [timeline/page.tsx](src/app/timeline/page.tsx))
- **ต้องใส่ `export const dynamic = 'force-dynamic';`** เหมือนหน้า `/` และ `/timeline` — ไม่งั้น build จะพังตอน static-generate เพราะ query Supabase ตรงๆ (documented gotcha ใน CLAUDE.md)
#### [NEW] [src/app/utils/shiftData.ts](file:///c:/Users/rttuser/Project_Atthanop/lr-helper__/src/app/utils/shiftData.ts) *(เพิ่มจาก audit)*
- constant กลาง: mapping `shiftType → { label, emoji, สี pastel, องค์ประกอบ [morning/afternoon/night] }` ให้ปฏิทิน + การ์ดสรุป + สูตรคำนวณ **อ้างแหล่งเดียวกัน** (เลี่ยงนิยามเวร/สีซ้ำกันหลายที่แล้วหลุดไม่ตรง) — แนวเดียวกับ [drugData.ts](src/app/utils/drugData.ts)
#### [NEW] [src/app/components/ShiftCalendar.tsx](file:///c:/Users/rttuser/Project_Atthanop/lr-helper__/src/app/components/ShiftCalendar.tsx)
- ปฏิทิน Hello Kitty สลับเดือนได้ แตะลงเวรง่าย (client component, `'use client'`; ใช้ `date-fns` `format()` ธรรมดาได้เพราะรันบน browser ผู้ใช้ที่อยู่ Asia/Bangkok อยู่แล้ว)
- ปุ่ม toggle `isHoliday` ต่อวัน (ให้ผู้ใช้ตั้งวันหยุดเอง)
#### [NEW] [src/app/components/SalarySummaryCard.tsx](file:///c:/Users/rttuser/Project_Atthanop/lr-helper__/src/app/components/SalarySummaryCard.tsx)
- การ์ดสรุปค่าเวร + เงินเดือนประจำเดือน พร้อมปุ่มซ่อน/แสดงยอดเงิน (Privacy Mode — client-only, เก็บสถานะใน localStorage) และปุ่มแก้ไขเรตค่าตอบแทน
#### [NEW] [src/app/components/SalaryConfigModal.tsx](file:///c:/Users/rttuser/Project_Atthanop/lr-helper__/src/app/components/SalaryConfigModal.tsx)
- หน้าต่างแก้ไขตัวเลขเงินเดือน เรตค่าเวร และค่า พ.ต.ส. (pattern modal เดียวกับที่มีอยู่ใน `Header.tsx`/`TimelineClient.tsx`)
#### [MODIFY] [src/app/components/Navbar.tsx](file:///c:/Users/rttuser/Project_Atthanop/lr-helper__/src/app/components/Navbar.tsx)
- เพิ่มแท็บ "ตารางเวร" ใน Navbar ด้านล่าง — **ต้องเปลี่ยน `grid-cols-3` → `grid-cols-4`** (บรรทัด 17 ปัจจุบัน hardcode ไว้ ถ้าไม่แก้แท็บที่ 4 จะล้น/เบียด) และเลือก icon จาก `lucide-react` ที่มีจริง เช่น `CalendarDays`
#### [MODIFY] [src/app/components/Header.tsx](file:///c:/Users/rttuser/Project_Atthanop/lr-helper__/src/app/components/Header.tsx)
- เพิ่มลิงก์ "ตารางเวร" ใน desktop nav (ตามรูปแบบ ternary ต่อลิงก์ที่มีอยู่) — อย่าลืม `import` icon เพิ่มในบรรทัด import ของ `lucide-react` (เช่น `CalendarDays`) ให้ตรงกับ Navbar

---

## Verification Plan

### Automated Tests
- `npx prisma db push`: เพิ่มตาราง `ShiftSchedule` และ `NurseSalaryConfig` เข้า Supabase (รันจาก local, ใช้ `DIRECT_URL`)
- `npx prisma generate`: สร้าง Client สำหรับโมเดลใหม่
  - **หมายเหตุ (CLAUDE.md):** บน Windows ถ้า dev server รันค้าง `prisma generate` อาจพัง `EPERM` (query engine DLL ถูก lock) — ปกติ TS types regenerate สำเร็จอยู่ดี ไม่ต้อง panic ให้ verify ด้วยการรัน query จริงเทียบ ไม่ต้อง restart ถ้า query ผ่าน
- `npm run build`: ทดสอบ compile และ type check (ยืนยัน `build` script ยังเป็น `prisma generate && next build` — ห้ามลดเหลือ `next build`)
- **เช็ค Vercel Deployments tab ว่าขึ้นเขียว/Ready จริง** ไม่ใช่แค่ curl 200 — แผนนี้แตะ `schema.prisma` ซึ่งเคยทำ Vercel build **fail เงียบๆ** (Vercel เสิร์ฟ build เก่าต่อ ยังตอบ 200) มาแล้วหลายรอบ (documented gotcha)

### Manual Verification
- ทดสอบลงเวรในปฏิทิน -> ตรวจสอบว่าจำนวนเวรและยอดเงินคำนวณเพิ่มขึ้นทันที
- ทดสอบแก้ไขเรตค่าเวรและเงินเดือน -> ตรวจสอบว่ายอดคำนวณอัปเดตอัตโนมัติ (และรีเฟรชแล้วค่ายังอยู่ = upsert singleton ถูกต้อง)
- **ทดสอบ timezone boundary (สำคัญ):** ลงเวรวันที่ **1** และวันที่ **สุดท้าย** ของเดือน แล้วเช็คว่าถูกนับเข้าเดือนที่ถูกต้อง (จับ bug −7 ชม. ที่อาจทำให้เวรตกเดือนผิด → ยอดเงินเพี้ยน) — verify บน production (Vercel UTC) ไม่ใช่แค่ local
- ทดสอบปุ่มซ่อน/แสดงยอดเงิน (Privacy Toggle) และรีโหลดแล้วสถานะยังอยู่ (localStorage)
- ทดสอบรันครั้งแรกที่ยังไม่มี row `NurseSalaryConfig` (หน้าไม่ควร error, ควรโชว์ค่า default)
- **Regression — ระบบ safety-critical เดิมต้องไม่กระทบ:** การรับคนไข้ `/add`, หน้าเตียง `/`, ไทม์ไลน์ยา `/timeline`, **การแจ้งเตือนรอบยา (foreground beep + background push)** และ auto-purge — ยืนยันว่าฟีเจอร์ปฏิทิน/เงินเดือนเป็นโมดูลแยก ไม่แตะ scheduling/reminder/push logic เลย
