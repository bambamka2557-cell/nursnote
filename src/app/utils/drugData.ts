export interface DrugGuideline {
  name: string;
  category: 'tocolytic' | 'induction' | 'preop' | 'general';
  defaultInterval: number; // in minutes
  dose: string;
  mix: string;
  warning: string;
}

export const PRESET_MEDICATIONS: DrugGuideline[] = [
  {
    name: 'Ampicillin 2g IV',
    category: 'general',
    defaultInterval: 240,
    dose: '2 g IV ทุก 6 ชั่วโมง (สำหรับ PROM/Chorioamnionitis)',
    mix: 'ละลายด้วย Sterile Water 10 ml ผสม NSS 100 ml IV drip ใน 30 นาที',
    warning: 'ตรวจสอบประวัติแพ้ยา Penicillin ทุกครั้ง'
  },
  {
    name: 'Dexamethasone 12mg IM',
    category: 'general',
    defaultInterval: 720,
    dose: '12 mg IM ทุก 12 ชั่วโมง (เพื่อกระตุ้นปอดทารก)',
    mix: 'ฉีดเข้ากล้ามเนื้อสะโพกแบบลึก (Deep IM)',
    warning: 'ห้ามฉีดเข้าหลอดเลือดดำ (IV) เด็ดขาด'
  },
  {
    name: 'Oxytocin (Syntocinon)',
    category: 'induction',
    defaultInterval: 30,
    dose: 'เริ่มต้น 12 ml/hr ปรับเพิ่มครั้งละ 12 ml/hr ทุก 30 นาที (Max 60 ml/hr) เพื่อให้ได้ UC 2-3 นาที',
    mix: 'ผสม Oxytocin 10 unit ใน 5% D/N/2 500 ml (12 ml/hr = 4 mU/min)',
    warning: 'ต้องเฝ้าระวังมดลูกบีบเกร็งเกินขนาด (Tachysystole) และประเมิน FHS ตลอดเวลา'
  },
  {
    name: 'MgSO4 (Loading/Maintenance)',
    category: 'tocolytic',
    defaultInterval: 60,
    dose: 'Loading 4 g IV ใน 20 นาที | Maintenance 1-2 g/ชม. IV drip',
    mix: 'Maintenance: ผสม MgSO4 20 g ใน 5% D/N/2 500 ml',
    warning: 'ตรวจสอบ DTR, หายใจ >= 14/นาที และปัสสาวะ >= 30 ml/ชม. ก่อนฉีด'
  },
  {
    name: 'Ceftriaxone 1g IV',
    category: 'general',
    defaultInterval: 1440, // q24h
    dose: '1-2 g IV ทุก 24 ชั่วโมง',
    mix: 'ละลายผงยา 1 g ด้วย Sterile Water 9.6 ml แล้วดริปใน NSS 50-100 ml ใน 30 นาที',
    warning: 'ระวังประวัติแพ้ยา Cephalosporin/Penicillin'
  },
  {
    name: 'Hydralazine 5mg IV',
    category: 'tocolytic',
    defaultInterval: 20, // Check and repeat q20m
    dose: '5-10 mg IV ทุก 20-30 นาที (เมื่อ BP >= 160/110)',
    mix: 'ดึงยา 5 mg (0.25 ml จาก amp 20mg/ml) ผสม NSS ให้ได้ 10 ml ค่อยๆ ฉีด IV push ช้าๆ ใน 3-5 นาที',
    warning: 'วัดความดันโลหิต (BP) ทุก 5-10 นาทีก่อนและหลังฉีดยา'
  },
  {
    name: 'Bricanyl',
    category: 'tocolytic',
    defaultInterval: 15,
    dose: 'SC: 1/2 amp (0.25 mg) ทุก 4 ชม. | IV drip: เริ่ม 15 ml/ชม. ปรับเพิ่ม q 15 นาที',
    mix: 'SC: ฉีดเข้าใต้ผิวหนัง | IV drip: ผสม Bricanyl 10 amp ใน 5% D/W 500 ml',
    warning: 'ประเมินอาการใจสั่น แน่นหน้าอก และจับชีพจรมารดา (ห้ามให้หาก Maternal HR > 120/นาที)'
  },
  {
    name: 'Adalat (Nifedipine 5mg)',
    category: 'tocolytic',
    defaultInterval: 15,
    dose: 'ยับยั้งด่วน: 2 เม็ด ทุก 15 นาที (สูงสุด 4 ครั้ง) | ต่อเนื่อง: 4 เม็ด ทุก 6 ชม.',
    mix: 'ยารับประทาน (Oral) ห้ามเคี้ยว',
    warning: 'วัดความดันโลหิต (BP) และชีพจรทุกครั้งก่อนให้ยา ระวังภาวะความดันต่ำเฉียบพลัน'
  },
  {
    name: 'Triferdine (วิตามินบำรุงครรภ์)',
    category: 'general',
    defaultInterval: 1440,
    dose: '1 เม็ด กินหลังอาหารทันที วันละ 1 ครั้ง',
    mix: 'ยารับประทานหลังอาหารทันที',
    warning: 'ห้ามรับประทานพร้อมนม ยาลดกรด หรือชา/กาแฟ'
  },
  {
    name: 'Cytotec (Misoprostol 200mcg)',
    category: 'induction',
    defaultInterval: 120,
    dose: '1 เม็ด (200 mcg) ผสมน้ำสะอาด 200 ml กินครั้งละ 25 ml ทุก 2 ชั่วโมง จนกว่าจะมี UC ที่ดี',
    mix: 'ละลายยา 1 เม็ดในน้ำสะอาด 200 ml แล้วตวงกินครั้งละ 25 ml',
    warning: 'ห้ามกินแบบกลืนทั้งเม็ดเด็ดขาด ระวังภาวะมดลูกบีบตัวรุนแรง (Hyperstimulation) และติดตาม FHS เสมอ'
  },
  {
    name: 'Cefazolin 2g IV',
    category: 'preop',
    defaultInterval: 1440,
    dose: '2 g IV ครั้งเดียวก่อนผ่าตัด (ก่อนไป OR 1 ชั่วโมง)',
    mix: 'ละลายผงยาด้วย Sterile Water 10 ml ฉีด IV push ช้าๆ หรือผสม NSS 100 ml IV drip ใน 30 นาที',
    warning: 'ตรวจสอบประวัติแพ้ยา Cephalosporin และ Penicillin อย่างละเอียด'
  },
  {
    name: 'Ranitidine 50mg IV',
    category: 'preop',
    defaultInterval: 480,
    dose: '50 mg IV ก่อนไป OR',
    mix: 'ฉีด IV push ช้าๆ ใน 2-3 นาที (หรือผสม NSS 20 ml)',
    warning: 'ระวังการฉีดเร็วเกินไปอาจทำให้เกิดภาวะหัวใจเต้นช้าหรือความดันต่ำ'
  },
  {
    name: 'Plasil (Metoclopramide 10mg) IV',
    category: 'preop',
    defaultInterval: 480,
    dose: '10 mg IV ก่อนไป OR เพื่อป้องกันคลื่นไส้อาเจียน',
    mix: 'ฉีด IV push ช้าๆ ใน 1-2 นาที',
    warning: 'เฝ้าระวังอาการเกร็งสั่นกลุ่ม Extrapyramidal ในมารดาอายุน้อย'
  },
  {
    name: 'Carbetocin (Duratocin)',
    category: 'preop',
    defaultInterval: 1440,
    dose: '100 mcg IV/IM ป้องกันตกเลือดหลังคลอด (เตรียมไป OR)',
    mix: 'ฉีด IV push ช้าๆ นานอย่างน้อย 1 นาที หรือฉีด IM หลังทารกคลอด',
    warning: 'ห้ามฉีด IV push เร็วเด็ดขาด ให้หลังเด็กคลอดออกมาเรียบร้อยแล้วเท่านั้น'
  },
  {
    name: 'Transamine (Tranexamic acid 1g) IV',
    category: 'preop',
    defaultInterval: 480,
    dose: '1 g IV ช้าๆ (เตรียมไป OR สำหรับมารดาเสี่ยงตกเลือด)',
    mix: 'ดึงยา 10 ml (2 amp) ฉีด IV push ช้าๆ อัตราไม่เกิน 1 ml/นาที',
    warning: 'ห้ามฉีดเร็วเด็ดขาด (ทำให้ความดันตกเฉียบพลัน) ระวังในผู้ที่มีประวัติลิ่มเลือดอุดตัน'
  },
  {
    name: 'Azithromycin 500mg IV',
    category: 'preop',
    defaultInterval: 1440,
    dose: '500 mg IV drip ใน 1 ชั่วโมง ก่อนไป OR (กรณีดมยาสลบผ่าคลอด)',
    mix: 'ผสมใน 0.9% NSS 250 ml แล้วดริป IV ในเวลา 1 ชั่วโมง',
    warning: 'ห้ามฉีด IV push และต้องดริปอย่างน้อย 60 นาทีขึ้นไป'
  },
  {
    name: 'Methylergonovine (Methergine)',
    category: 'preop',
    defaultInterval: 240,
    dose: '0.2 mg IM ทุก 2-4 ชั่วโมง (ป้องกัน/รักษาภาวะตกเลือดหลังคลอด)',
    mix: 'ฉีดเข้ากล้ามเนื้อสะโพกแบบลึก (IM)',
    warning: 'ห้ามใช้ในมารดาที่มีภาวะความดันโลหิตสูง (Hypertension / Preeclampsia) เด็ดขาด เนื่องจากยาจะกระตุ้นความดันโลหิตให้สูงขึ้นอย่างรุนแรง'
  }
];

export const PRESET_ASSESSMENTS = [
  { name: 'PV (Pelvic Exam)', defaultInterval: 240 },
  { name: 'FHS & UC Check', defaultInterval: 30 },
  { name: 'V/S (Vital Signs)', defaultInterval: 240 },
  { name: 'Record Urine Output', defaultInterval: 60 }
];

export function getDrugGuideline(name: string): DrugGuideline | undefined {
  return PRESET_MEDICATIONS.find(m => m.name === name);
}
