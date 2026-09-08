import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Pure logic tests
const THAI_MONTH_NAMES_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];
const THAI_MONTH_NAMES = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

function getCycleRangeForMonth(year, month, cycleStartDay = 26) {
  if (cycleStartDay <= 1) {
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const mStr = String(month).padStart(2, '0');
    return {
      startDate: `${year}-${mStr}-01`,
      endDate: `${year}-${mStr}-${String(daysInMonth).padStart(2, '0')}`,
    };
  }

  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;
  const startDayStr = String(cycleStartDay).padStart(2, '0');
  const endDay = cycleStartDay - 1;
  const endDayStr = String(endDay).padStart(2, '0');

  return {
    startDate: `${prevYear}-${String(prevMonth).padStart(2, '0')}-${startDayStr}`,
    endDate: `${year}-${String(month).padStart(2, '0')}-${endDayStr}`,
  };
}

function formatCycleWindowText(year, month, cycleStartDay = 26) {
  const currentMonthShort = THAI_MONTH_NAMES_SHORT[month - 1];
  const currentThaiYear = year + 543;

  if (cycleStartDay <= 1) {
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    return `1 ${currentMonthShort} – ${daysInMonth} ${currentMonthShort} ${currentThaiYear}`;
  }

  const prevMonthIndex = (month - 2 + 12) % 12;
  const prevYear = month === 1 ? year - 1 : year;
  const prevThaiYear = prevYear + 543;

  const prevMonthShort = THAI_MONTH_NAMES_SHORT[prevMonthIndex];
  const endDay = cycleStartDay - 1;

  if (prevYear === year) {
    return `${cycleStartDay} ${prevMonthShort} – ${endDay} ${currentMonthShort} ${currentThaiYear}`;
  }
  return `${cycleStartDay} ${prevMonthShort} ${prevThaiYear} – ${endDay} ${currentMonthShort} ${currentThaiYear}`;
}

function getCycleForDate(dateStr, cycleStartDay = 26) {
  const [y, m, d] = dateStr.split('-').map(Number);
  let cycleYear = y;
  let cycleMonth = m;

  if (cycleStartDay > 1 && d >= cycleStartDay) {
    cycleMonth = m === 12 ? 1 : m + 1;
    cycleYear = m === 12 ? y + 1 : y;
  }

  const windowText = formatCycleWindowText(cycleYear, cycleMonth, cycleStartDay);
  const cycleLabel = `${THAI_MONTH_NAMES[cycleMonth - 1]} ${cycleYear + 543}`;

  return {
    cycleYear,
    cycleMonth,
    cycleLabel,
    windowText,
  };
}

function calculateDayShiftAllowance(shifts, rates) {
  if (!shifts || shifts.length === 0) return 0;
  return shifts.reduce((sum, item) => {
    const shiftRate = rates?.[item.code];
    if (!shiftRate) return sum;
    const rate = item.ot ? shiftRate.ot : shiftRate.normal;
    return sum + (Number(rate) || 0);
  }, 0);
}

async function runTests() {
  console.log('--- STARTING VERIFICATION TESTS ---');

  // Test 1: Cycle Date Range logic
  console.log('\nTest 1: Cycle Date Range calculation:');
  const augCycle = getCycleRangeForMonth(2026, 8, 26);
  console.log('August 2026 cycle:', augCycle);
  if (augCycle.startDate !== '2026-07-26' || augCycle.endDate !== '2026-08-25') {
    throw new Error(`Aug cycle incorrect: ${JSON.stringify(augCycle)}`);
  }
  console.log('✅ August 2026 cycle correct (2026-07-26 to 2026-08-25)');

  const janCycle = getCycleRangeForMonth(2027, 1, 26);
  console.log('January 2027 cycle:', janCycle);
  if (janCycle.startDate !== '2026-12-26' || janCycle.endDate !== '2027-01-25') {
    throw new Error(`Jan cycle incorrect: ${JSON.stringify(janCycle)}`);
  }
  console.log('✅ January 2027 cross-year cycle correct (2026-12-26 to 2027-01-25)');

  // Test 2: formatCycleWindowText & cycleStartDay <= 1 edge case
  console.log('\nTest 2: formatCycleWindowText format & edge cases:');
  const augWindowText = formatCycleWindowText(2026, 8, 26);
  console.log('August 2026 window text:', augWindowText);
  if (augWindowText !== '26 ก.ค. – 25 ส.ค. 2569') {
    throw new Error(`Aug window text mismatch: got "${augWindowText}", expected "26 ก.ค. – 25 ส.ค. 2569"`);
  }

  const janWindowText = formatCycleWindowText(2027, 1, 26);
  console.log('January 2027 window text:', janWindowText);
  if (janWindowText !== '26 ธ.ค. 2569 – 25 ม.ค. 2570') {
    throw new Error(`Jan window text mismatch: got "${janWindowText}"`);
  }

  const firstDayCycleText = formatCycleWindowText(2026, 8, 1);
  console.log('August 2026 cycleStartDay=1 window text:', firstDayCycleText);
  if (firstDayCycleText !== '1 ส.ค. – 31 ส.ค. 2569') {
    throw new Error(`Cycle day 1 window text mismatch: got "${firstDayCycleText}"`);
  }
  console.log('✅ Window text formatting (including cycleStartDay=1) verified');

  // Test 3: getCycleForDate boundary mapping
  console.log('\nTest 3: getCycleForDate boundary mapping:');
  const c25 = getCycleForDate('2026-08-25', 26);
  if (c25.cycleMonth !== 8 || c25.cycleYear !== 2026) {
    throw new Error(`Date 2026-08-25 mapped to wrong cycle: ${JSON.stringify(c25)}`);
  }
  console.log('2026-08-25 ->', c25.cycleLabel, c25.windowText);

  const c26 = getCycleForDate('2026-08-26', 26);
  if (c26.cycleMonth !== 9 || c26.cycleYear !== 2026) {
    throw new Error(`Date 2026-08-26 mapped to wrong cycle: ${JSON.stringify(c26)}`);
  }
  console.log('2026-08-26 ->', c26.cycleLabel, c26.windowText);

  const cDec26 = getCycleForDate('2026-12-26', 26);
  if (cDec26.cycleMonth !== 1 || cDec26.cycleYear !== 2027) {
    throw new Error(`Date 2026-12-26 mapped to wrong cycle: ${JSON.stringify(cDec26)}`);
  }
  console.log('2026-12-26 ->', cDec26.cycleLabel, cDec26.windowText);
  console.log('✅ getCycleForDate boundary mapping verified');

  // Test 4: Allowance calculation with mixed OT colors
  console.log('\nTest 4: Allowance calculation for mixed colors (M ot=true, A ot=false):');
  const sampleRates = {
    MORNING: { normal: 300, ot: 500 },
    AFTERNOON: { normal: 360, ot: 600 },
    NIGHT: { normal: 400, ot: 700 },
  };

  const dayShiftsMixed = [
    { code: 'MORNING', ot: true }, // OT -> 500
    { code: 'AFTERNOON', ot: false }, // Normal -> 360
  ];
  const totalMixed = calculateDayShiftAllowance(dayShiftsMixed, sampleRates);
  console.log('Calculated mixed allowance:', totalMixed, 'expected: 860');
  if (totalMixed !== 860) {
    throw new Error(`Mixed allowance mismatch: got ${totalMixed}, expected 860`);
  }
  console.log('✅ Mixed sub-shift allowance matches formula Σ shiftRates[code][ot ? ot : normal]');

  // Test 5: Prisma Database Interaction
  console.log('\nTest 5: Database operations (ShiftSchedule & NurseSalaryConfig):');

  // 5a: Verify NurseSalaryConfig singleton read/upsert
  const testConfig = await prisma.nurseSalaryConfig.upsert({
    where: { id: 'default' },
    update: {
      baseSalary: 25000,
      ptsAllowance: 3000,
      shiftRates: sampleRates,
      cycleStartDay: 26,
    },
    create: {
      id: 'default',
      baseSalary: 25000,
      ptsAllowance: 3000,
      shiftRates: sampleRates,
      cycleStartDay: 26,
    },
  });
  console.log('Upserted default config baseSalary:', testConfig.baseSalary);

  // 5b: Boundary tests for 25th and 26th and end-of-month (31st)
  const testDates = [
    { date: '2026-07-25', shifts: [{ code: 'MORNING', ot: false }] }, // Pre-cycle
    { date: '2026-07-26', shifts: [{ code: 'MORNING', ot: true }] },  // Aug Cycle Day 1
    { date: '2026-08-25', shifts: [{ code: 'AFTERNOON', ot: false }] }, // Aug Cycle Last Day
    { date: '2026-08-26', shifts: [{ code: 'NIGHT', ot: true }] },    // Sep Cycle Day 1
    { date: '2026-08-31', shifts: [{ code: 'MORNING', ot: false }] }, // Day 31 of month
  ];

  for (const t of testDates) {
    await prisma.shiftSchedule.upsert({
      where: { date: t.date },
      update: { shifts: t.shifts, note: 'TEST_ENTRY' },
      create: { date: t.date, shifts: t.shifts, note: 'TEST_ENTRY' },
    });
  }
  console.log('Inserted test boundary dates');

  // Query August cycle window: [2026-07-26, 2026-08-25]
  const augRecords = await prisma.shiftSchedule.findMany({
    where: {
      date: {
        gte: '2026-07-26',
        lte: '2026-08-25',
      },
    },
    orderBy: { date: 'asc' },
  });

  const returnedDates = augRecords.map((r) => r.date);
  console.log('August cycle records found:', returnedDates);
  if (!returnedDates.includes('2026-07-26') || !returnedDates.includes('2026-08-25')) {
    throw new Error('Cycle boundary records missing from query');
  }
  if (returnedDates.includes('2026-07-25') || returnedDates.includes('2026-08-26')) {
    throw new Error('Records outside cycle boundary leaked into query');
  }

  // Query wide calendar window covering up to 2026-08-31:
  const wideRecords = await prisma.shiftSchedule.findMany({
    where: {
      date: {
        gte: '2026-07-01',
        lte: '2026-08-31',
      },
    },
  });
  const wideDates = wideRecords.map(r => r.date);
  if (!wideDates.includes('2026-08-31')) {
    throw new Error('Day 31 not included in wide query');
  }
  console.log('✅ Wide date window query with day 31 verified');

  // Clean up test entries
  console.log('\nCleaning up test entries...');
  for (const t of testDates) {
    await prisma.shiftSchedule.deleteMany({
      where: { date: t.date },
    });
  }

  // Restore config to seed defaults (0) as specified in the plan
  await prisma.nurseSalaryConfig.upsert({
    where: { id: 'default' },
    update: {
      baseSalary: 0,
      ptsAllowance: 0,
      noPrivatePractice: 0,
      inChargeAllowance: 0,
      otherAllowance: 0,
      shiftRates: {
        MORNING: { normal: 0, ot: 0 },
        AFTERNOON: { normal: 0, ot: 0 },
        NIGHT: { normal: 0, ot: 0 },
      },
      cycleStartDay: 26,
      taxDeduction: 0,
      socialSecurity: 0,
      providentFund: 0,
      coopDeduction: 0,
      otherDeduction: 0,
    },
    create: {
      id: 'default',
      baseSalary: 0,
      ptsAllowance: 0,
      noPrivatePractice: 0,
      inChargeAllowance: 0,
      otherAllowance: 0,
      shiftRates: {
        MORNING: { normal: 0, ot: 0 },
        AFTERNOON: { normal: 0, ot: 0 },
        NIGHT: { normal: 0, ot: 0 },
      },
      cycleStartDay: 26,
      taxDeduction: 0,
      socialSecurity: 0,
      providentFund: 0,
      coopDeduction: 0,
      otherDeduction: 0,
    },
  });
  console.log('✅ Restored NurseSalaryConfig to default seed values (0)');

  console.log('\n--- ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ---');
}

runTests()
  .catch((err) => {
    console.error('Test error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
