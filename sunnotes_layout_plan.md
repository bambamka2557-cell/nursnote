# แผนงานปรับโฉมหน้าตารางเวรและโครงสร้างหน้าจอแบบ SunNotes (ธีมชมพูพาสเทล LR-Helper)

**วันที่อัปเดตล่าสุด:** 1 พ.ย. 2569  
**ผู้รับผิดชอบ:** Antigravity  
**สถานะ:** ดำเนินการเสร็จสมบูรณ์และตรวจสอบผ่าน (`npm run build` 0 errors)

---

## 1. เป้าหมายหลัก (Scope & Intent)
ปรับปรุงโครงสร้างหน้าจอ (`AppShell`) และปฏิทินตารางเวร (`/schedule`) รวมถึงหน้าที่เที่ยว (`/travel`) ให้มีเลย์เอาต์และการใช้งานเหมือน **SunNotes** (`Brain/16-sunnotes-design-system.md` และ `Brain/templates/sunnotes-kit/reference/AppShell.tsx`) โดย **คงโทนสีชมพูพาสเทลเดิมของ LR-Helper** (`#fff5f7`, `#fdf4f6`, ชมพู-โรส) และ **ห้ามแตะต้องลอจิกคำนวณเงินเดือน/ชั่วโมงเวร หรือข้อมูลตารางเวรในฐานข้อมูลเด็ดขาด**

---

## 2. รายการที่ดำเนินการเสร็จสิ้น (รวมรายการปรับแก้เพิ่มเติม)

1. **แถบด้านบน (Top Bar) แนบสนิท ไม่ลอย (`Header.tsx`, `layout.tsx`, `TravelClient.tsx`)**
   - เปลี่ยนแถบด้านบนเป็นพื้นขาวทึบ (`bg-white border-b border-pink-100/90`) แนบชิดขอบบนและเชื่อมต่อกับแถบซ้าย/ขวาอย่างเป็นเนื้อเดียวกัน
   - นำแถบหัวข้อแบบลอย (`sticky top-2`) ในหน้า `/travel` ออก และย้ายปุ่ม `[< กลับตารางเวร]` + ชื่อเดือนขึ้นไปอยู่ใน `#topbar-slot` บนแถบด้านบนโดยตรง

2. **แยกส่วนสรุปเงินเดือนและชั่วโมงทำงานออกจากด้านล่างปฏิทิน (`ShiftCalendar.tsx`)**
   - นำการ์ดสรุปเงินเดือน (`SalarySummaryCard`), การ์ดสมดุลชีวิต (`WorkLifeBalanceCard`) และการ์ดสรุปวันหยุด (`HolidaySummaryCard`) ออกจากด้านล่างตารางปฏิทินทั้งหมด เพื่อให้หน้าปฏิทินแสดงตารางเวรเต็มพื้นที่เหมือน SunNotes
   - เพิ่มการเข้าถึงข้อมูลสรุป 2 รูปแบบ:
     - **แท็บ `[ภาพรวม]` บนแถบด้านบน**: สลับมุมมองเป็นแดชบอร์ดสรุปค่าตอบแทน + ชั่วโมงทำงาน + วันหยุดราชการแบบเต็มหน้าจอ
     - **แถบด้านขวา (Right Panel)**: เปิดดูสรุปค่าตอบแทนและสมดุลชีวิตควบคู่ไปกับตารางปฏิทินด้านซ้ายได้ทันที

3. **พับเก็บแถบซ้าย (Left Sidebar) และแถบขวา (Right Panel) พร้อมแอนิเมชันยืด-หดนุ่มนวล (`Sidebar.tsx`, `Header.tsx`, `ShiftCalendar.tsx`)**
   - แถบซ้าย (`Sidebar.tsx`): พับ/กางได้ด้วยปุ่ม `PanelLeftClose` / `PanelLeftOpen` โดยใช้ `transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] overflow-hidden` ครอบกล่องความกว้างคงที่ `w-64` และซิงก์ตัวแปร `--left-sidebar-w` ทำให้เนื้อหาหลักขยายตามอย่างลื่นไหล ไม่กระพริบและข้อความไม่หดซ้อนกัน
   - แถบขวา (`ShiftCalendar.tsx`): พับ/กางได้ด้วยปุ่ม `PanelRightClose` / `PanelRightOpen` บนแถบด้านบน ใช้ `transition-[width,margin] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] overflow-hidden` ครอบกล่องความกว้างคงที่ `w-[368px]` (บนมือถือเปิดเป็นลิ้นชักเลื่อนจากขวาอย่างนุ่มนวล)

4. **เปลี่ยนอีโมจิธรรมดาทั้งหมดเป็นไอคอนสัญลักษณ์ประจำธีม (`ThemeIcons.tsx` และทุกคอมโพเนนต์)**
   - สร้าง [`src/app/components/ThemeIcons.tsx`](file:///c:/Users/rttuser/Project_Atthanop/lr-helper__/src/app/components/ThemeIcons.tsx) รวมไอคอนเวกเตอร์โทนพาสเทล (`StickerThemeIcon`, `HolidayThemeIcon`, `WellnessThemeIcon`, `ShiftAtomicIcon`, `TravelThemeIcon`)
   - แทนที่อีโมจิ Unicode ธรรมดาทั้งหมดใน `ShiftCalendar.tsx`, `WorkLifeBalanceCard.tsx`, `SalarySummaryCard.tsx`, `SalaryConfigModal.tsx`, `HolidaySummaryCard.tsx`, `TravelClient.tsx`, `Header.tsx`, `Sidebar.tsx`, `page.tsx`, `add/page.tsx` และ `shiftData.ts`

5. **ล็อกพื้นหลังนิ่งเมื่อเปิดหน้าต่าง Modal (`ScrollLock.tsx`)**
   - ติดตั้ง `ScrollLock.tsx` ใน `src/app/layout.tsx` และใส่ `data-scroll-lock` ให้ทุก Modal/Drawer

---

## 3. การตรวจสอบ (Verification)
- รัน `npm run build` (Prisma generate + TypeScript + Next.js 16 production build) ผ่าน **0 errors** (ครบทั้ง 8 routes)
- ตรวจสอบข้อมูลตารางเวรในฐานข้อมูล (`ShiftSchedule` 60 รายการของเดือน ก.ย. และ พ.ย. 2569) อยู่ครบถ้วน 100%
- เปิดเซิร์ฟเวอร์พัฒนา (`http://localhost:3000/schedule` และ `http://localhost:3000/travel`) ตอบกลับ `200 OK`
