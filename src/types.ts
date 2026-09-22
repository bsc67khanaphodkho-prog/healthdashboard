export type RiskLevel = 'ปกติ' | 'เสี่ยงปานกลาง' | 'เสี่ยงสูง' | 'เสี่ยงสูงมาก';

export type Gender = 'ชาย' | 'หญิง';

export type SmokingStatus = 'ไม่สูบ' | 'เคยสูบแต่เลิกแล้ว' | 'สูบนานๆ ครั้ง' | 'สูบเป็นประจำ';

export type AlcoholStatus = 'ไม่ดื่ม' | 'ดื่มเข้าสังคม' | 'ดื่มเป็นประจำ';

export type ExerciseFrequency = 'ไม่ออกกำลังกาย' | '1-2 วัน/สัปดาห์' | '3-4 วัน/สัปดาห์' | '≥5 วัน/สัปดาห์';

export type DietHabit = 'กินหวานมันเค็มประจำ' | 'กินหวานมันเค็มปานกลาง' | 'กินอาหารสุขภาพ/ควบคุมรสชาติ';

export interface HealthRecord {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  province: string;
  district: string;
  heightCm: number;
  weightKg: number;
  bmi: number;
  bmiCategory: 'น้ำหนักน้อย' | 'ปกติ' | 'น้ำหนักเกิน' | 'อ้วนระดับ 1' | 'อ้วนระดับ 2 (อันตราย)';
  systolicBp: number; // mmHg
  diastolicBp: number; // mmHg
  bpCategory: 'ปกติ' | 'ความดันสูงเล็กน้อย (Pre-HT)' | 'ความดันโลหิตสูงระดับ 1' | 'ความดันโลหิตสูงระดับ 2';
  fastingBloodSugar: number; // mg/dL
  sugarCategory: 'ปกติ (<100)' | 'ภาวะเสี่ยงเบาหวาน (100-125)' | 'เบาหวาน (≥126)';
  smoking: SmokingStatus;
  alcohol: AlcoholStatus;
  exercise: ExerciseFrequency;
  dietHabit: DietHabit;
  sleepHours: number;
  familyHistoryNcd: boolean; // ประวัติโรคเรื้อรังในครอบครัว
  riskScore: number; // 0 - 100
  riskLevel: RiskLevel;
  checkupDate: string; // YYYY-MM-DD
  triageNote?: string;
}

export interface FilterState {
  searchQuery: string;
  gender: string;
  ageGroup: string;
  riskLevel: string;
  province: string;
  clinicalFilter: string; // all, high-sugar, high-bp, high-bmi
  behaviorFilter: string; // all, smoker, alcohol, no-exercise
}

export interface SummaryStats {
  totalCount: number;
  // ค่าเฉลี่ย
  avgBmi: number;
  avgBloodSugar: number;
  avgSystolicBp: number;
  avgDiastolicBp: number;
  avgAge: number;
  avgRiskScore: number;
  // ค่าต่ำสุด / ค่าสูงสุด
  minBloodSugar: number;
  maxBloodSugar: number;
  minSystolicBp: number;
  maxSystolicBp: number;
  minBmi: number;
  maxBmi: number;
  // สัดส่วน
  highRiskCount: number;
  highRiskProportion: string; // e.g. "48 / 150 (1 : 3.1)"
  // ร้อยละ
  highRiskPercentage: number;
  abnormalSugarPercentage: number;
  hypertensionPercentage: number;
  obesityPercentage: number;
  unhealthyBehaviorPercentage: number;
}
