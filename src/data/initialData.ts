import { HealthRecord, RiskLevel, Gender, SmokingStatus, AlcoholStatus, ExerciseFrequency, DietHabit } from '../types';

export function calculateBmi(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
}

export function getBmiCategory(bmi: number): HealthRecord['bmiCategory'] {
  if (bmi < 18.5) return 'น้ำหนักน้อย';
  if (bmi < 23) return 'ปกติ';
  if (bmi < 25) return 'น้ำหนักเกิน';
  if (bmi < 30) return 'อ้วนระดับ 1';
  return 'อ้วนระดับ 2 (อันตราย)';
}

export function getBpCategory(sbp: number, dbp: number): HealthRecord['bpCategory'] {
  if (sbp < 120 && dbp < 80) return 'ปกติ';
  if (sbp < 140 || dbp < 90) return 'ความดันสูงเล็กน้อย (Pre-HT)';
  if (sbp < 160 || dbp < 100) return 'ความดันโลหิตสูงระดับ 1';
  return 'ความดันโลหิตสูงระดับ 2';
}

export function getSugarCategory(fbg: number): HealthRecord['sugarCategory'] {
  if (fbg < 100) return 'ปกติ (<100)';
  if (fbg <= 125) return 'ภาวะเสี่ยงเบาหวาน (100-125)';
  return 'เบาหวาน (≥126)';
}

export function calculateRiskScore(params: {
  bmi: number;
  sbp: number;
  fbg: number;
  age: number;
  smoking: SmokingStatus;
  alcohol: AlcoholStatus;
  exercise: ExerciseFrequency;
  dietHabit: DietHabit;
  familyHistory: boolean;
}): { score: number; level: RiskLevel } {
  let score = 5;

  // Age factor
  if (params.age >= 60) score += 16;
  else if (params.age >= 50) score += 10;
  else if (params.age >= 40) score += 5;

  // BMI factor
  if (params.bmi >= 30) score += 18;
  else if (params.bmi >= 25) score += 12;
  else if (params.bmi >= 23) score += 6;

  // Blood pressure
  if (params.sbp >= 160) score += 20;
  else if (params.sbp >= 140) score += 14;
  else if (params.sbp >= 130) score += 7;

  // Blood sugar
  if (params.fbg >= 126) score += 20;
  else if (params.fbg >= 100) score += 10;

  // Smoking
  if (params.smoking === 'สูบเป็นประจำ') score += 14;
  else if (params.smoking === 'สูบนานๆ ครั้ง') score += 6;

  // Alcohol
  if (params.alcohol === 'ดื่มเป็นประจำ') score += 10;
  else if (params.alcohol === 'ดื่มเข้าสังคม') score += 4;

  // Exercise
  if (params.exercise === 'ไม่ออกกำลังกาย') score += 8;
  else if (params.exercise === '1-2 วัน/สัปดาห์') score += 3;
  else if (params.exercise === '≥5 วัน/สัปดาห์') score -= 6;

  // Diet
  if (params.dietHabit === 'กินหวานมันเค็มประจำ') score += 8;
  else if (params.dietHabit === 'กินอาหารสุขภาพ/ควบคุมรสชาติ') score -= 5;

  if (params.familyHistory) score += 5;

  // Clamp 0 - 100
  const finalScore = Math.min(100, Math.max(5, Math.round(score)));

  let level: RiskLevel = 'ปกติ';
  if (finalScore >= 60) level = 'เสี่ยงสูงมาก';
  else if (finalScore >= 42) level = 'เสี่ยงสูง';
  else if (finalScore >= 24) level = 'เสี่ยงปานกลาง';

  return { score: finalScore, level };
}

// Generate an authentic seed set of 120 patient screening records
const thaiFirstNames = [
  'สมชาย', 'วิภา', 'ประเสริฐ', 'กานดา', 'ธีรพงษ์', 'วรรณา', 'อนันต์', 'ศิริพร', 'มนัส', 'สุชาดา',
  'พิชัย', 'นฤมล', 'ชวลิต', 'รัตนา', 'ดำรง', 'พิมลรัตน์', 'อัศวิน', 'อรัญญา', 'ชัชวาล', 'ศศิธร',
  'เกรียงไกร', 'บุษบา', 'สุรชัย', 'ทัศนีย์', 'กิตติศักดิ์', 'สุวรรณ', 'ชัยวัฒน์', 'พัชรี', 'สมศักดิ์', 'พรทิพย์',
  'ธวัชชัย', 'ดารณี', 'เจริญ', 'วาสนา', 'ชาญชัย', 'มาริษา', 'ไพโรจน์', 'นงลักษณ์', 'วีระ', 'นันทนา'
];

const thaiLastNames = [
  'สุขสวัสดิ์', 'เจริญสุข', 'ทองดี', 'ประสิทธิ์ผล', 'ศิริวัฒน์', 'คงมั่น', 'วงศ์สุวรรณ', 'รัตนชัย',
  'มีสุข', 'พงษ์พาณิชย์', 'มั่นคง', 'เลิศวิริยะ', 'แซ่ตั้ง', 'วงศ์ษา', 'บุญมี', 'แก้ววิจิตร',
  'ศรีสวัสดิ์', 'จิตเจริญ', 'ประเสริฐสุข', 'สมบูรณ์', 'วัฒนากุล', 'ดิลกคุณารักษ์', 'ทวีโชค', 'ชัยเจริญ'
];

const provincesWithDistricts: { province: string; districts: string[] }[] = [
  { province: 'กรุงเทพมหานคร', districts: ['จตุจักร', 'บางกะปิ', 'ธนบุรี', 'มีนบุรี', 'พญาไท'] },
  { province: 'ขอนแก่น', districts: ['เมืองขอนแก่น', 'ชุมแพ', 'บ้านไผ่', 'น้ำพอง', 'กระนวน'] },
  { province: 'เชียงใหม่', districts: ['เมืองเชียงใหม่', 'สันทราย', 'แม่ริม', 'หางดง', 'สารภี'] },
  { province: 'นครราชสีมา', districts: ['เมืองนครราชสีมา', 'ปากช่อง', 'พิมาย', 'โชคชัย', 'ด่านขุนทด'] },
  { province: 'สงขลา', districts: ['เมืองสงขลา', 'หาดใหญ่', 'สะเดา', 'สิงหนคร', 'จะนะ'] },
  { province: 'ชลบุรี', districts: ['เมืองชลบุรี', 'ศรีราชา', 'บางละมุง', 'สัตหีบ', 'พานทอง'] },
  { province: 'อุบลราชธานี', districts: ['เมืองอุบลฯ', 'วารินชำราบ', 'เดชอุดม', 'ตระการพืชผล'] },
  { province: 'สุราษฎร์ธานี', districts: ['เมืองสุราษฎร์ฯ', 'เกาะสมุย', 'พุนพิน', 'กาญจนดิษฐ์'] }
];

export function generateSeedRecords(): HealthRecord[] {
  const records: HealthRecord[] = [];

  // Seeded deterministic generator
  let seed = 42;
  function random(): number {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  const smokingOptions: SmokingStatus[] = ['ไม่สูบ', 'ไม่สูบ', 'ไม่สูบ', 'เคยสูบแต่เลิกแล้ว', 'สูบนานๆ ครั้ง', 'สูบเป็นประจำ'];
  const alcoholOptions: AlcoholStatus[] = ['ไม่ดื่ม', 'ไม่ดื่ม', 'ดื่มเข้าสังคม', 'ดื่มเข้าสังคม', 'ดื่มเป็นประจำ'];
  const exerciseOptions: ExerciseFrequency[] = ['ไม่ออกกำลังกาย', 'ไม่ออกกำลังกาย', '1-2 วัน/สัปดาห์', '3-4 วัน/สัปดาห์', '≥5 วัน/สัปดาห์'];
  const dietOptions: DietHabit[] = ['กินหวานมันเค็มประจำ', 'กินหวานมันเค็มปานกลาง', 'กินหวานมันเค็มปานกลาง', 'กินอาหารสุขภาพ/ควบคุมรสชาติ'];

  for (let i = 1; i <= 30; i++) {
    const gender: Gender = random() > 0.48 ? 'หญิง' : 'ชาย';
    const age = Math.floor(random() * 52) + 21; // 21 - 72

    const fName = thaiFirstNames[(i * 3 + Math.floor(random() * 5)) % thaiFirstNames.length];
    const lName = thaiLastNames[(i * 7 + Math.floor(random() * 7)) % thaiLastNames.length];
    const provObj = provincesWithDistricts[Math.floor(random() * provincesWithDistricts.length)];
    const district = provObj.districts[Math.floor(random() * provObj.districts.length)];

    // Height & Weight correlated with gender
    const baseHeight = gender === 'ชาย' ? 168 : 158;
    const heightCm = Math.round(baseHeight + (random() * 20 - 10));

    // Distribution of body weights (some normal, some overweight, some obese)
    const weightFactor = random();
    let weightKg = 0;
    if (weightFactor < 0.45) {
      // lean to normal
      weightKg = Math.round((heightCm - 105) + (random() * 8 - 4));
    } else if (weightFactor < 0.75) {
      // overweight
      weightKg = Math.round((heightCm - 100) + (random() * 10 + 2));
    } else {
      // obese
      weightKg = Math.round((heightCm - 92) + (random() * 18 + 8));
    }
    const bmi = calculateBmi(weightKg, heightCm);
    const bmiCat = getBmiCategory(bmi);

    // Blood pressure correlated with age & BMI
    let sbpBase = 112 + (age > 50 ? 12 : (age > 40 ? 6 : 0)) + (bmi > 25 ? 10 : 0);
    const sbp = Math.min(185, Math.max(98, Math.round(sbpBase + (random() * 24 - 10))));
    const dbp = Math.min(110, Math.max(62, Math.round(sbp * 0.64 + (random() * 12 - 6))));
    const bpCat = getBpCategory(sbp, dbp);

    // Fasting Blood Sugar correlated with BMI & age
    let fbgBase = 86 + (bmi > 25 ? 10 : 0) + (age > 45 ? 6 : 0);
    if (random() > 0.70) {
      fbgBase += 28 + (random() * 35); // diabetic or high risk spike
    }
    const fbg = Math.min(235, Math.max(74, Math.round(fbgBase + (random() * 18 - 8))));
    const sugarCat = getSugarCategory(fbg);

    const smoking = smokingOptions[Math.floor(random() * smokingOptions.length)];
    const alcohol = alcoholOptions[Math.floor(random() * alcoholOptions.length)];
    const exercise = exerciseOptions[Math.floor(random() * exerciseOptions.length)];
    const diet = dietOptions[Math.floor(random() * dietOptions.length)];
    const sleepHours = Math.round((random() * 4 + 4.5) * 10) / 10;
    const familyHistory = random() > 0.55;

    const { score, level } = calculateRiskScore({
      bmi,
      sbp,
      fbg,
      age,
      smoking,
      alcohol,
      exercise,
      dietHabit: diet,
      familyHistory
    });

    // Month in 2026 from Jan to Sep
    const month = String(Math.floor(random() * 9) + 1).padStart(2, '0');
    const day = String(Math.floor(random() * 27) + 1).padStart(2, '0');
    const checkupDate = `2026-${month}-${day}`;

    let note = '';
    if (level === 'เสี่ยงสูงมาก') {
      note = 'ส่งต่อพบแพทย์เฉพาะทาง ติดตามภาวะแทรกซ้อน NCDs ด่วนภายใน 1 สัปดาห์';
    } else if (level === 'เสี่ยงสูง') {
      note = 'นัดเข้าคลินิกปรับเปลี่ยนพฤติกรรม ตรวจซ้ำ FBS/ความดัน ภายใน 1 เดือน';
    } else if (level === 'เสี่ยงปานกลาง') {
      note = 'ให้คำปรึกษาโภชนาการ การออกกำลังกาย นัดประเมินซ้ำ 3 เดือน';
    } else {
      note = 'สุขภาพโดยรวมอยู่ในเกณฑ์ดี แนะนำตรวจคัดกรองประจำปีตามรอบ';
    }

    records.push({
      id: `HR-${String(i).padStart(4, '0')}`,
      name: `${fName} ${lName}`,
      age,
      gender,
      province: provObj.province,
      district,
      heightCm,
      weightKg,
      bmi,
      bmiCategory: bmiCat,
      systolicBp: sbp,
      diastolicBp: dbp,
      bpCategory: bpCat,
      fastingBloodSugar: fbg,
      sugarCategory: sugarCat,
      smoking,
      alcohol,
      exercise,
      dietHabit: diet,
      sleepHours,
      familyHistoryNcd: familyHistory,
      riskScore: score,
      riskLevel: level,
      checkupDate,
      triageNote: note
    });
  }

  return records;
}

export const initialHealthRecords = generateSeedRecords();
