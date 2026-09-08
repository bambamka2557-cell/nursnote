# แผนการพัฒนา Feature: ปฏิทินตารางเวร + ระบบคำนวณเงินเดือนและค่าตอบแทนพยาบาล

ระบบสำหรับช่วยให้พยาบาลบันทึกตารางเวรประจำเดือนสไตล์ Hello Kitty พาสเทล พร้อม**ระบบคำนวณเงินเดือน ค่าเวร และค่าตอบแทนวิชาชีพโดยอัตโนมัติ**ในแต่ละเดือน โดยออกแบบเป็นโมดูลอิสระ (**ไม่กระทบระบบคนไข้, การจับเวลารอบยา หรือการแจ้งเตือนเดิม**)

---

## User Review Required

> [!IMPORTANT]
> **การคำนวณค่าตอบแทนอัตโนมัติจากตารางเวร**:
> - เมื่อพยาบาลลงเวรในปฏิทิน (เช้า, บ่าย, ดึก, เช้า/บ่าย, เช้า/ดึก ฯลฯ) ระบบจะนำจำนวนเวรในเดือนนั้นมาคูณกับอัตราค่าเวรที่ตั้งค่าไว้โดยอัตโนมัติ
> - พยาบาลสามารถกำหนดอัตราค่าเวรและรายการเงินเดือน/ค่าตอบแทนของตนเองได้ (เพราะแต่ละ รพ./วอร์ด/ประเภทการจ้าง มีอัตราต่างกัน)
> - มีปุ่ม **"ซ่อน/แสดงตัวเลขเงิน" (👁️ Privacy Toggle)** เพื่อป้องกันไม่ให้บุคคลอื่นมองเห็นยอดเงินขณะเปิดใช้งานในวอร์ด

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
- **การคำนวณค่าเวรอัตโนมัติ (Shift Allowances)**:
  - คำนวณตามจำนวนเวรที่ลงไว้ในเดือนนั้นๆ:
    - (จำนวนเวรบ่าย × เรตค่าเวรบ่าย)
    - (จำนวนเวรดึก × เรตค่าเวรดึก)
    - (จำนวนเวรควบ × เรตค่าเวรควบ)
    - (ค่าเวรวันหยุดพิเศษ/นักขัตฤกษ์)
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
  doubleShiftRate       Float    @default(1000) // ค่าเวรควบ
  holidayMultiplier     Float    @default(1.5)  // ตัวคูณวันหยุด
  ptsAllowance          Float    @default(1500) // ค่า พ.ต.ส.
  noPrivatePractice     Float    @default(0)    // ค่าไม่ทำเวชฯ / ฉ.11
  inChargeAllowance     Float    @default(0)    // ค่าหัวหน้าเวร
  otherAllowance        Float    @default(0)    // ค่าอื่นๆ
  taxDeduction          Float    @default(0)    // หักภาษี
  socialSecurity        Float    @default(0)    // ประกันสังคม/กบข.
  updatedAt             DateTime @updatedAt
}
```

### 2. Server Actions
#### [NEW] [src/app/actions/shift.ts](file:///c:/Users/rttuser/Project_Atthanop/lr-helper__/src/app/actions/shift.ts)
- จัดการดึงเวร, บันทึกเวร, ลบเวร
#### [NEW] [src/app/actions/salary.ts](file:///c:/Users/rttuser/Project_Atthanop/lr-helper__/src/app/actions/salary.ts)
- ดึงและบันทึกการตั้งค่าอัตราค่าตอบแทน `NurseSalaryConfig`
- คำนวณสรุปยอดเงินเดือนและค่าเวรประจำเดือนที่เลือก

### 3. Frontend Components & Pages
#### [NEW] [src/app/schedule/page.tsx](file:///c:/Users/rttuser/Project_Atthanop/lr-helper__/src/app/schedule/page.tsx)
- หน้าหลักรวมปฏิทินตารางเวรและการ์ดสรุปรายได้
#### [NEW] [src/app/components/ShiftCalendar.tsx](file:///c:/Users/rttuser/Project_Atthanop/lr-helper__/src/app/components/ShiftCalendar.tsx)
- ปฏิทิน Hello Kitty สลับเดือนได้ แตะลงเวรง่าย
#### [NEW] [src/app/components/SalarySummaryCard.tsx](file:///c:/Users/rttuser/Project_Atthanop/lr-helper__/src/app/components/SalarySummaryCard.tsx)
- การ์ดสรุปค่าเวร + เงินเดือนประจำเดือน พร้อมปุ่มซ่อน/แสดงยอดเงิน (Privacy Mode) และปุ่มแก้ไขเรตค่าตอบแทน
#### [NEW] [src/app/components/SalaryConfigModal.tsx](file:///c:/Users/rttuser/Project_Atthanop/lr-helper__/src/app/components/SalaryConfigModal.tsx)
- หน้าต่างแก้ไขตัวเลขเงินเดือน เรตค่าเวร และค่า พ.ต.ส.
#### [MODIFY] [src/app/components/Navbar.tsx](file:///c:/Users/rttuser/Project_Atthanop/lr-helper__/src/app/components/Navbar.tsx)
- เพิ่มแท็บ "ตารางเวร" ใน Navbar ด้านล่าง
#### [MODIFY] [src/app/components/Header.tsx](file:///c:/Users/rttuser/Project_Atthanop/lr-helper__/src/app/components/Header.tsx)
- เพิ่มเมนู "ตารางเวร" บน Header ด้านบน

---

## Verification Plan

### Automated Tests
- `npx prisma db push`: เพิ่มตาราง `ShiftSchedule` และ `NurseSalaryConfig` เข้า Supabase
- `npx prisma generate`: สร้าง Client สำหรับโมเดลใหม่
- `npm run build`: ทดสอบ compile และ type check 100%

### Manual Verification
- ทดสอบลงเวรในปฏิทิน -> ตรวจสอบว่าจำนวนเวรและยอดเงินคำนวณเพิ่มขึ้นทันที
- ทดสอบแก้ไขเรตค่าเวรและเงินเดือน -> ตรวจสอบว่ายอดคำนวณอัปเดตอัตโนมัติ
- ทดสอบปุ่มซ่อน/แสดงยอดเงิน (Privacy Toggle)
- ทดสอบระบบเดิม (การรับคนไข้ `/add`, หน้าเตียง `/`, ไทม์ไลน์ยา `/timeline`) เพื่อรับประกันว่าไม่มีผลกระทบใดๆ
