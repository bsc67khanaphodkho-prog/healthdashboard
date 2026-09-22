import { HealthRecord, SummaryStats } from '../types';

export function computeSummaryStats(records: HealthRecord[]): SummaryStats {
  if (records.length === 0) {
    return {
      totalCount: 0,
      avgBmi: 0,
      avgBloodSugar: 0,
      avgSystolicBp: 0,
      avgDiastolicBp: 0,
      avgAge: 0,
      avgRiskScore: 0,
      minBloodSugar: 0,
      maxBloodSugar: 0,
      minSystolicBp: 0,
      maxSystolicBp: 0,
      minBmi: 0,
      maxBmi: 0,
      highRiskCount: 0,
      highRiskProportion: '0 / 0 (0%)',
      highRiskPercentage: 0,
      abnormalSugarPercentage: 0,
      hypertensionPercentage: 0,
      obesityPercentage: 0,
      unhealthyBehaviorPercentage: 0,
    };
  }

  const count = records.length;
  let sumBmi = 0;
  let sumFbg = 0;
  let sumSbp = 0;
  let sumDbp = 0;
  let sumAge = 0;
  let sumScore = 0;

  let minFbg = records[0].fastingBloodSugar;
  let maxFbg = records[0].fastingBloodSugar;
  let minSbp = records[0].systolicBp;
  let maxSbp = records[0].systolicBp;
  let minBmi = records[0].bmi;
  let maxBmi = records[0].bmi;

  let highRiskCount = 0;
  let abnormalSugarCount = 0; // FBG >= 100
  let hypertensionCount = 0; // SBP >= 140 or DBP >= 90
  let obesityCount = 0; // BMI >= 25
  let unhealthyBehaviorCount = 0; // smoking or alcohol regular or no exercise

  for (const r of records) {
    sumBmi += r.bmi;
    sumFbg += r.fastingBloodSugar;
    sumSbp += r.systolicBp;
    sumDbp += r.diastolicBp;
    sumAge += r.age;
    sumScore += r.riskScore;

    if (r.fastingBloodSugar < minFbg) minFbg = r.fastingBloodSugar;
    if (r.fastingBloodSugar > maxFbg) maxFbg = r.fastingBloodSugar;

    if (r.systolicBp < minSbp) minSbp = r.systolicBp;
    if (r.systolicBp > maxSbp) maxSbp = r.systolicBp;

    if (r.bmi < minBmi) minBmi = r.bmi;
    if (r.bmi > maxBmi) maxBmi = r.bmi;

    if (r.riskLevel === 'เสี่ยงสูง' || r.riskLevel === 'เสี่ยงสูงมาก') {
      highRiskCount++;
    }
    if (r.fastingBloodSugar >= 100) {
      abnormalSugarCount++;
    }
    if (r.systolicBp >= 140 || r.diastolicBp >= 90) {
      hypertensionCount++;
    }
    if (r.bmi >= 25) {
      obesityCount++;
    }
    if (
      r.smoking === 'สูบเป็นประจำ' ||
      r.alcohol === 'ดื่มเป็นประจำ' ||
      r.exercise === 'ไม่ออกกำลังกาย' ||
      r.dietHabit === 'กินหวานมันเค็มประจำ'
    ) {
      unhealthyBehaviorCount++;
    }
  }

  const highRiskRatio = highRiskCount > 0 ? (count / highRiskCount).toFixed(1) : '0';
  const highRiskPercent = Number(((highRiskCount / count) * 100).toFixed(1));

  return {
    totalCount: count,
    avgBmi: Number((sumBmi / count).toFixed(1)),
    avgBloodSugar: Number((sumFbg / count).toFixed(1)),
    avgSystolicBp: Number((sumSbp / count).toFixed(1)),
    avgDiastolicBp: Number((sumDbp / count).toFixed(1)),
    avgAge: Number((sumAge / count).toFixed(1)),
    avgRiskScore: Number((sumScore / count).toFixed(1)),
    minBloodSugar: minFbg,
    maxBloodSugar: maxFbg,
    minSystolicBp: minSbp,
    maxSystolicBp: maxSbp,
    minBmi: minBmi,
    maxBmi: maxBmi,
    highRiskCount,
    highRiskProportion: `${highRiskCount} จาก ${count} คน (1 : ${highRiskRatio})`,
    highRiskPercentage: highRiskPercent,
    abnormalSugarPercentage: Number(((abnormalSugarCount / count) * 100).toFixed(1)),
    hypertensionPercentage: Number(((hypertensionCount / count) * 100).toFixed(1)),
    obesityPercentage: Number(((obesityCount / count) * 100).toFixed(1)),
    unhealthyBehaviorPercentage: Number(((unhealthyBehaviorCount / count) * 100).toFixed(1)),
  };
}
