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

> ✅ **STATUS: READY TO BUILD — โครงสร้าง/สูตรครบแล้ว** (รอบจ่าย 26→25, เวรย่อย 3 ตัว × 2 สี, สีรายเวรย่อย, สูตรบวกเวรย่อย)
> **ค่าเรตทั้งหมดเป็น runtime config ที่ผู้ใช้กรอกเองในแอป ไม่ใช่ค่าที่ต้อง hardcode** ⇒ Antigravity implement ได้เลย: seed `shiftRates` (และ base/allowance/deduction) เป็น **0** ทั้งหมด, ยอดจะโชว์ 0 จนผู้ใช้เปิดหน้า "ตั้งค่าอัตราค่าตอบแทน" กรอกเรตจริง
> **Validate ยอดกับสลิปจริง** เป็นขั้นตอนที่ผู้ใช้ทำเองหลังกรอกเรต (ดู Verification) — ไม่ใช่ blocker ของการเขียนโค้ด

### ✅ ข้อเท็จจริงจากตารางเวรจริง (confirmed จากภาพ + คำอธิบายผู้ใช้)
1. **รอบจ่าย = วันที่ 26 ของเดือนก่อน → 25 ของเดือนนั้น** (หัวตาราง: "ประจำเดือน สิงหาคม 2569 (26 ก.ค. – 25 ส.ค. 2569)") — **ไม่ใช่ปฏิทิน 1–สิ้นเดือน** ⇒ การกรองเดือนต้องเป็น date-range window ไม่ใช่ prefix `YYYY-MM`
2. **สีอยู่ที่ "ตัวอักษรของเวรย่อยแต่ละตัว" ไม่ใช่ที่วัน และไม่ใช่ที่เวรควบทั้งก้อน** — ตัวอักษร**สีแดง = เวรย่อยนั้นคิด OT**, **สีดำ = ปกติ** และภายในเวรควบเดียวกันสีต่างกันได้ (เช่น วันที่เป็น ช/บ อาจ **ช แดง แต่ บ ดำ**) ⇒ ต้องเก็บสีเป็นราย "เวรย่อย" ไม่ใช่ราย row/วัน. รพ. กำหนดว่าตัวไหนแดงมาให้ในตาราง (ผู้ใช้ไม่รู้กฎ ⇒ ให้ผู้ใช้กด/ระบายสีแดงเองต่อเวรย่อยให้ตรงตารางจริง)
3. **หน่วยการคิดเงิน = เวรย่อย 3 ตัว (ช/บ/ด) × สี (ปกติ/OT)** — เวรควบ = ผลรวมเวรย่อยตามสีของแต่ละตัว (ช/บ = ช[สีช] + บ[สีบ]) เรตเก็บเป็น matrix **3 เวรย่อย × 2 สี = 6 ค่า**. เรตที่ทราบยังไม่พอแยกราย atomic (บ/ด ดำ = 360 คือ บ.ดำ + ด.ดำ, ส่วน 720/975 ยังไม่รู้ว่าเป็น atomic ตัวไหน) ⇒ ต้องขอผู้ใช้กรอกแยกราย ช/บ/ด

### 📝 ค่าที่ผู้ใช้กรอกเองในแอปทีหลัง (ไม่ใช่งานของ Antigravity — แค่ทำ UI ให้กรอก/แก้ได้)
- **เรต matrix 3×2:** ช/บ/ด แต่ละตัว × (ปกติดำ, OTแดง) = 6 ค่า — ผู้ใช้ยังไม่ทราบเรตตอนนี้ กรอกในแอปภายหลัง (seed 0 ไปก่อน)
- **เงินเดือน/พ.ต.ส./ค่าประจำ/รายการหัก** — กรอกในหน้าตั้งค่าเช่นกัน (seed 0)
- ~~legend รหัสเวร~~ ✅ resolved: ช=เช้า, บ=บ่าย, ด=ดึก, ช/บ, บ/ด (ไม่มี เช้า/ดึก)
- ~~"วันแดง" มาจากไหน~~ ✅ resolved: สีอยู่ที่ตัวอักษรเวรย่อย รพ. กำหนดมา ⇒ ผู้ใช้ระบายสีแดงเองต่อเวรย่อย (ไม่ auto เสาร์-อาทิตย์)

> **การแก้เรตย้อนหลัง:** ยอดคำนวณจาก config ปัจจุบัน × เวรที่ลง (ไม่ snapshot เรตรายเดือน) ⇒ แก้เรตวันนี้กระทบยอดเดือนก่อนๆ ด้วย — ยอมรับได้สำหรับแอปส่วนตัว แต่ให้รู้ตัว

---

## สรุปฟังก์ชันการทำงาน (Proposed Features)

### 1. ปฏิทินตารางเวร Hello Kitty (Shift Calendar)
- แสดงปฏิทินแบบ 7 วัน โทนสีชมพูพาสเทลตามภาพอ้างอิง
- แถบเวรสีพาสเทล (ชุดรหัสจริงจากตารางเวร รพ. — 5 เวร + หยุด, ไม่มี เช้า/ดึก):
  - 🌸 **เช้า / ช (M)**
  - 🍇 **บ่าย / บ (A)**
  - 🌙 **ดึก / ด (N)**
  - 🍊 **เช้า/บ่าย / ช-บ (M/A)**
  - 🌊 **บ่าย/ดึก / บ-ด (A/N)**
  - 🌿 **หยุด / O (OFF)**
- สติกเกอร์น่ารักประจำวัน (🎀 โบว์, 🍒 เชอร์รี่, 🌸 ดอกไม้, 🐱 คิตตี้, 💖 หัวใจ)
- บันทึกโน้ตสั้นประจำวัน (เช่น "แลกเวรกับพี่ดาว")

### 2. ระบบคำนวณเงินเดือนและค่าตอบแทน (Salary & Allowance Calculator)
- **การคำนวณค่าเวรอัตโนมัติ (Shift Allowances)** — คำนวณตามจำนวนเวรที่ลงไว้ในเดือนนั้นๆ:
  > 📌 **สูตรที่ใช้จริง = ตารางเรต matrix ใน "Audit Notes — สูตรคำนวณ" ด้านล่าง (authoritative)** รายการสรุปนี้เป็นภาพรวม ถ้าขัดกันให้ยึด Audit Notes
    - ค่าเวรของแต่ละวัน = ผลรวมเวรย่อย: `Σ shiftRates[เวรย่อย][ดำ/แดง]` (ผู้ใช้กรอกเรตเอง)
    - สีเป็น**รายเวรย่อย** (ช แดง / บ ดำ ในวันเดียวกันได้) → เลือกคอลัมน์ `ot` แทน `normal` เฉพาะตัวที่แดง
    - รวมยอดตาม **รอบจ่าย 26→25** ไม่ใช่เดือนปฏิทิน
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
  // เวรของวันนั้นเก็บเป็น "รายเวรย่อย" เพราะสี (ปกติ/OT) แยกอิสระต่อเวรย่อย
  // เช่น วัน ช/บ อาจ ช=แดง(OT) บ=ดำ(ปกติ) — เก็บ boolean เดียวต่อ row ไม่ได้
  // source of truth ของการคิดเงิน: array เวรย่อย {code, ot}; วันหยุด(OFF) = [] ว่าง
  // label ที่โชว์บนปฏิทิน (ช/บ, บ/ด ฯลฯ) + สี pastel = derive จาก shifts ใน shiftData.ts
  shifts    Json     // [{ "code":"MORNING","ot":false }, { "code":"AFTERNOON","ot":true }]  // code ∈ MORNING|AFTERNOON|NIGHT
  note      String?
  sticker   String?  // "bow", "cherry", "flower", "kitty", "heart"
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// การตั้งค่าอัตราเงินเดือนและค่าเวร
model NurseSalaryConfig {
  id                    String   @id @default("default")
  baseSalary            Float    @default(0)    // เงินเดือนพื้นฐาน
  ptsAllowance          Float    @default(0)    // ค่า พ.ต.ส.
  noPrivatePractice     Float    @default(0)    // ค่าไม่ทำเวชฯ / ฉ.11
  inChargeAllowance     Float    @default(0)    // ค่าหัวหน้าเวร
  otherAllowance        Float    @default(0)    // ค่าอื่นๆ
  // --- ค่าเวร (OT): "ตารางเรต" (matrix) เวรย่อย 3 ตัว × สี (normal ดำ / ot แดง) ---
  // เวรย่อยคือ atomic (MORNING/AFTERNOON/NIGHT) เท่านั้น — เวรควบคิดจากผลรวมเวรย่อยตามสีของแต่ละตัว
  // (เรตวันแดง = OT ไม่ใช่ตัวคูณคงที่ของวันดำ ⇒ เก็บ 2 คอลัมน์แยก ไม่ใช้ multiplier)
  // shape: { "MORNING":{"normal":0,"ot":0}, "AFTERNOON":{"normal":0,"ot":0}, "NIGHT":{"normal":0,"ot":0} }
  shiftRates            Json
  cycleStartDay         Int      @default(26)   // รอบจ่ายเริ่มวันที่ 26 ของเดือนก่อน → 25 ของเดือนนั้น
  // --- รายการหัก ---
  taxDeduction          Float    @default(0)    // ภาษี ณ ที่จ่าย
  socialSecurity        Float    @default(0)    // ประกันสังคม
  providentFund         Float    @default(0)    // กบข. (ข้าราชการ — มักใช้แทนประกันสังคม)
  coopDeduction         Float    @default(0)    // สหกรณ์ออมทรัพย์
  otherDeduction        Float    @default(0)    // หักอื่นๆ
  updatedAt             DateTime @updatedAt
}
```
*(สีของเวรย่อยเก็บใน `shifts[].ot` (true = แดง/OT) → เลือกเรตคอลัมน์ `ot` แทน `normal` เฉพาะเวรย่อยตัวนั้น)*

> **⚠️ Audit Notes — schema (ต้องอ่านก่อนเขียน action):**
> - **`NurseSalaryConfig` เป็น singleton** (`id @default("default")`) — ทุก action ต้อง `upsert({ where: { id: 'default' }, ... })` และหน้า UI ต้องรองรับกรณี **ยังไม่มี row เลย (รันครั้งแรก)** โดยถือว่าเป็นค่า default ไม่ใช่ throw. `shiftRates` เป็น `Json` ⇒ ตอน seed ให้ใส่ครบทั้ง 3 เวรย่อย (MORNING/AFTERNOON/NIGHT) แต่ละตัวมี `{normal, ot}` (ค่าที่ยังไม่ทราบใส่ 0 ไว้ก่อน) กัน key หายตอน lookup
> - **`date` เก็บเป็น String `"YYYY-MM-DD"`** — ดีแล้ว เลี่ยง timezone ของ Vercel (ดู CLAUDE.md) **ห้าม** `new Date(date)` ฝั่ง server เพื่อจัดกลุ่มเดือน
> - **รอบจ่าย 26→25 ⇒ กรองด้วย date-range ของ string** ไม่ใช่ prefix เดือน เช่น รอบ "ส.ค." = `where: { date: { gte: '2026-07-26', lte: '2026-08-25' } }` (string ISO เทียบ lexicographic ได้ถูกต้อง) — ดูสูตรคำนวณช่วง window ใน Audit Notes ของ `salary.ts`
> - **2 ตารางใหม่นี้ไม่ถูกแตะโดย `purgeExpiredPatients()`** (ลบเฉพาะ `Patient` ที่ไม่มี order) — ยืนยันแล้วว่าปลอดภัย ห้ามใครไป "ต่อยอด" ให้ purge มากวาดตารางเวร/เงินเดือน

### 2. Server Actions
#### [NEW] [src/app/actions/shift.ts](file:///c:/Users/rttuser/Project_Atthanop/lr-helper__/src/app/actions/shift.ts)
- จัดการดึงเวร, บันทึกเวร, ลบเวร
#### [NEW] [src/app/actions/salary.ts](file:///c:/Users/rttuser/Project_Atthanop/lr-helper__/src/app/actions/salary.ts)
- ดึงและบันทึกการตั้งค่าอัตราค่าตอบแทน `NurseSalaryConfig` ผ่าน `upsert({ where: { id: 'default' } })`
- คำนวณสรุปยอดเงินเดือนและค่าเวรประจำเดือนที่เลือก

> **⚠️ Audit Notes — สูตรคำนวณ (deterministic spec ห้ามเดา — อิงเรตจริงจากตารางเวร รพ.):**
>
> **1. ค่าเวรต่อวัน = ผลรวมเวรย่อย โดย lookup เรตของแต่ละเวรย่อยตามสีของมันเอง:**
> ```
> allowanceของวัน = Σ over p in day.shifts:  shiftRates[p.code]?.[ p.ot ? 'ot' : 'normal' ] ?? 0
> // วัน ช/บ ที่ ช=แดง บ=ดำ  →  shiftRates.MORNING.ot + shiftRates.AFTERNOON.normal
> // วันหยุด (shifts = []) → 0
> ```
> **ห้าม**สมมติความสัมพันธ์เชิงเลข (ไม่มีตัวคูณวันหยุด) — เรตของแต่ละเวรย่อย/แต่ละสี อ่านจาก `shiftRates` ที่ผู้ใช้กรอกเองล้วนๆ เพราะข้อมูลจริงพิสูจน์แล้วว่าเรตไม่เป็นสัดส่วนกัน. **สีเป็นรายเวรย่อย** (ช แดงได้ ขณะ บ ดำ ในวันเดียวกัน) ห้ามคิดสีเป็นรายวัน/ราย row
>
> **2. ยอดสุทธิต่อรอบจ่าย (26→25):**
> ```
> รายรับ  = baseSalary + ptsAllowance + noPrivatePractice + inChargeAllowance + otherAllowance
>          + Σ(allowanceของทุกวันในรอบจ่ายนั้น)
> รายหัก  = taxDeduction + socialSecurity + providentFund + coopDeduction + otherDeduction
> สุทธิ   = รายรับ − รายหัก
> ```
> *(เงินเดือน/ค่าประจำ/รายหัก คงที่ต่อรอบจาก config — ตัวที่เปลี่ยนตามรอบคือ Σ ค่าเวร)*
>
> **3. การกรองรอบจ่าย 26→25 (แทนการกรองเดือนปฏิทิน) — TIMEZONE GOTCHA:** action รันบน Vercel (UTC, `TZ` แก้ไม่ได้ — ดู CLAUDE.md)
> - รอบจ่ายของ "เดือน Y-M" = ช่วงวันที่ **`(M-1)/cycleStartDay` → `M/(cycleStartDay-1)`** เช่น cycleStartDay=26, รอบ ส.ค. 2026 = `2026-07-26` ถึง `2026-08-25`
> - สร้างขอบเขตเป็น **string `"YYYY-MM-DD"`** แล้ว query `where: { date: { gte: start, lte: end } }` — string ISO เทียบ lexicographic ถูกต้อง **ห้าม** แปลงเป็น `Date` แล้ว `.getMonth()` ฝั่ง server (เพี้ยน −7 ชม.)
> - ถ้าต้องหา "รอบปัจจุบัน" เป็น default ฝั่ง server: อ่านวันวันนี้ด้วย `formatInTimeZone(new Date(), 'Asia/Bangkok', 'yyyy-MM-dd')` ก่อน แล้วค่อยคำนวณว่าตกรอบไหน (ถ้า day ≥ cycleStartDay → รอบของเดือนถัดไป) — ไม่ใช้ ambient timezone ของ server

### 3. Frontend Components & Pages
#### [NEW] [src/app/schedule/page.tsx](file:///c:/Users/rttuser/Project_Atthanop/lr-helper__/src/app/schedule/page.tsx)
- หน้าหลักรวมปฏิทินตารางเวรและการ์ดสรุปรายได้ (server component: ดึงเวร + config รอบแรกแล้วส่ง `initialData` ให้ client component — pattern เดียวกับ [timeline/page.tsx](src/app/timeline/page.tsx))
- **ต้องใส่ `export const dynamic = 'force-dynamic';`** เหมือนหน้า `/` และ `/timeline` — ไม่งั้น build จะพังตอน static-generate เพราะ query Supabase ตรงๆ (documented gotcha ใน CLAUDE.md)
#### [NEW] [src/app/utils/shiftData.ts](file:///c:/Users/rttuser/Project_Atthanop/lr-helper__/src/app/utils/shiftData.ts) *(เพิ่มจาก audit)*
- constant กลาง: (ก) เวรย่อย atomic `MORNING/AFTERNOON/NIGHT → { label ช/บ/ด, สี pastel }`; (ข) แพทเทิร์นเวรที่เลือกได้บนปฏิทิน (ช, บ, ด, ช/บ, บ/ด, OFF) → set ของเวรย่อย; (ค) ฟังก์ชัน derive label/สี จาก `shifts[]` — ให้ปฏิทิน + การ์ดสรุป + สูตรคำนวณ **อ้างแหล่งเดียวกัน** แนวเดียวกับ [drugData.ts](src/app/utils/drugData.ts)
#### [NEW] [src/app/components/ShiftCalendar.tsx](file:///c:/Users/rttuser/Project_Atthanop/lr-helper__/src/app/components/ShiftCalendar.tsx)
- ปฏิทิน Hello Kitty สลับเดือนได้ แตะลงเวรง่าย (client component, `'use client'`; ใช้ `date-fns` `format()` ธรรมดาได้เพราะรันบน browser ผู้ใช้ที่อยู่ Asia/Bangkok อยู่แล้ว)
- แตะวัน → เลือกแพทเทิร์นเวร (ช/บ/ด/ช-บ/บ-ด/OFF) แล้ว **กดสลับสีแดง(OT)/ดำ(ปกติ) ราย "เวรย่อย"** (เช่น ช/บ ตั้ง ช แดง, บ ดำ ได้) → บันทึกลง `shifts[]`
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
- **ทดสอบขอบรอบจ่าย 26→25 (สำคัญ):** ลงเวรวันที่ **25** และ **26** ให้เห็นว่าตกคนละรอบจ่ายกัน และเวรวันที่ 26 ต้น-เดือน 00:00–07:00 ยังนับเข้ารอบถูก (จับ bug −7 ชม. บน Vercel UTC → เวรข้ามรอบ ยอดเงินเพี้ยน) — verify บน production ไม่ใช่แค่ local
- **ทดสอบเวรควบสีผสม:** ลงวัน ช/บ ที่ตั้ง **ช = แดง(OT), บ = ดำ(ปกติ)** → ยอดของวันนั้นต้อง = `MORNING.ot + AFTERNOON.normal` (พิสูจน์ว่าสีคิดรายเวรย่อยจริง ไม่ใช่รายวัน)
- **Validate เรตกับสลิปจริง 1 รอบ (สำคัญที่สุดของฟีเจอร์เงิน):** เอาตารางเวรจริง 1 เดือน (เช่น ส.ค. 2569) กรอกลงระบบ (รวมสีแดง/ดำ ราย เวรย่อยให้ตรงตาราง) แล้วเทียบยอดค่าเวรที่คำนวณได้กับยอดในสลิป/ที่ รพ. จ่ายจริง — ต้องตรงก่อนถือว่าสูตร/เรต CONFIRMED
- ทดสอบปุ่มซ่อน/แสดงยอดเงิน (Privacy Toggle) และรีโหลดแล้วสถานะยังอยู่ (localStorage)
- ทดสอบรันครั้งแรกที่ยังไม่มี row `NurseSalaryConfig` (หน้าไม่ควร error, ควรโชว์ค่า default + `shiftRates` ครบทุก key)
- **Regression — ระบบ safety-critical เดิมต้องไม่กระทบ:** การรับคนไข้ `/add`, หน้าเตียง `/`, ไทม์ไลน์ยา `/timeline`, **การแจ้งเตือนรอบยา (foreground beep + background push)** และ auto-purge — ยืนยันว่าฟีเจอร์ปฏิทิน/เงินเดือนเป็นโมดูลแยก ไม่แตะ scheduling/reminder/push logic เลย
