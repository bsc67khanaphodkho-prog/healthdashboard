import React, { useMemo, useState } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  BarChart,
  Bar,
  Legend,
  Cell,
} from 'recharts';
import { Microscope, MapPin, Calendar, HeartPulse, Sparkles } from 'lucide-react';
import { HealthRecord } from '../types';

interface CorrelationDeepDiveViewProps {
  records: HealthRecord[];
}

export const CorrelationDeepDiveView: React.FC<CorrelationDeepDiveViewProps> = ({ records }) => {
  const [selectedCorrelation, setSelectedCorrelation] = useState<'bmi-sugar' | 'bmi-bp'>('bmi-sugar');

  // 1. กลุ่มอายุที่มีความเสี่ยงสูง (High-risk age groups)
  const ageRiskAnalysis = useMemo(() => {
    const groups: Record<
      string,
      { total: number; highRisk: number; normal: number; avgScore: number; sumScore: number }
    > = {
      '20-34 ปี (วัยทำงานต้น)': { total: 0, highRisk: 0, normal: 0, avgScore: 0, sumScore: 0 },
      '35-49 ปี (วัยทำงาน)': { total: 0, highRisk: 0, normal: 0, avgScore: 0, sumScore: 0 },
      '50-59 ปี (วัยก่อนสูงอายุ)': { total: 0, highRisk: 0, normal: 0, avgScore: 0, sumScore: 0 },
      '60 ปีขึ้นไป (ผู้สูงอายุ)': { total: 0, highRisk: 0, normal: 0, avgScore: 0, sumScore: 0 },
    };

    records.forEach((r) => {
      let key = '60 ปีขึ้นไป (ผู้สูงอายุ)';
      if (r.age < 35) key = '20-34 ปี (วัยทำงานต้น)';
      else if (r.age < 50) key = '35-49 ปี (วัยทำงาน)';
      else if (r.age < 60) key = '50-59 ปี (วัยก่อนสูงอายุ)';

      groups[key].total++;
      groups[key].sumScore += r.riskScore;
      if (r.riskLevel === 'เสี่ยงสูง' || r.riskLevel === 'เสี่ยงสูงมาก') {
        groups[key].highRisk++;
      } else {
        groups[key].normal++;
      }
    });

    return Object.entries(groups).map(([group, val]) => ({
      ageGroup: group,
      กลุ่มเสี่ยงสูง: val.highRisk,
      กลุ่มปกติและเสี่ยงปานกลาง: val.normal,
      highRiskRate: val.total > 0 ? Number(((val.highRisk / val.total) * 100).toFixed(1)) : 0,
      avgScore: val.total > 0 ? Number((val.sumScore / val.total).toFixed(1)) : 0,
      total: val.total,
    }));
  }, [records]);

  // 2. พื้นที่ที่มีผู้เสี่ยงสูง (High-risk areas / provinces)
  const areaRiskAnalysis = useMemo(() => {
    const provMap: Record<
      string,
      { total: number; highRisk: number; avgBmi: number; sumBmi: number; avgSugar: number; sumSugar: number }
    > = {};

    records.forEach((r) => {
      if (!provMap[r.province]) {
        provMap[r.province] = { total: 0, highRisk: 0, avgBmi: 0, sumBmi: 0, avgSugar: 0, sumSugar: 0 };
      }
      provMap[r.province].total++;
      provMap[r.province].sumBmi += r.bmi;
      provMap[r.province].sumSugar += r.fastingBloodSugar;
      if (r.riskLevel === 'เสี่ยงสูง' || r.riskLevel === 'เสี่ยงสูงมาก') {
        provMap[r.province].highRisk++;
      }
    });

    return Object.entries(provMap)
      .map(([province, val]) => ({
        province,
        highRiskCount: val.highRisk,
        total: val.total,
        highRiskRate: val.total > 0 ? Number(((val.highRisk / val.total) * 100).toFixed(1)) : 0,
        avgBmi: val.total > 0 ? Number((val.sumBmi / val.total).toFixed(1)) : 0,
        avgSugar: val.total > 0 ? Number((val.sumSugar / val.total).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.highRiskRate - a.highRiskRate);
  }, [records]);

  // 3 & 4. Scatter Plot Data: BMI vs Sugar / BMI vs BP
  const scatterPoints = useMemo(() => {
    return records.map((r) => ({
      id: r.id,
      name: r.name,
      bmi: r.bmi,
      sugar: r.fastingBloodSugar,
      sbp: r.systolicBp,
      dbp: r.diastolicBp,
      riskLevel: r.riskLevel,
      riskScore: r.riskScore,
      gender: r.gender,
      age: r.age,
      color:
        r.riskLevel === 'เสี่ยงสูงมาก'
          ? '#ef4444'
          : r.riskLevel === 'เสี่ยงสูง'
          ? '#f97316'
          : r.riskLevel === 'เสี่ยงปานกลาง'
          ? '#f59e0b'
          : '#10b981',
    }));
  }, [records]);

  // 5. พฤติกรรมกับระดับความเสี่ยง (Behavior vs Risk Level Matrix)
  const behaviorRiskMatrix = useMemo(() => {
    const list = [
      {
        behavior: 'สูบบุหรี่เป็นประจำ',
        records: records.filter((r) => r.smoking === 'สูบเป็นประจำ'),
      },
      {
        behavior: 'ดื่มสุราเป็นประจำ',
        records: records.filter((r) => r.alcohol === 'ดื่มเป็นประจำ'),
      },
      {
        behavior: 'ไม่ออกกำลังกาย',
        records: records.filter((r) => r.exercise === 'ไม่ออกกำลังกาย'),
      },
      {
        behavior: 'กินหวานมันเค็มประจำ',
        records: records.filter((r) => r.dietHabit === 'กินหวานมันเค็มประจำ'),
      },
      {
        behavior: 'นอนน้อย (<6 ชม./วัน)',
        records: records.filter((r) => r.sleepHours < 6),
      },
      {
        behavior: 'พฤติกรรมสุขภาพดี (ไม่สูบ/ไม่ดื่ม/ออกกำลังกาย)',
        records: records.filter(
          (r) =>
            r.smoking === 'ไม่สูบ' &&
            r.alcohol === 'ไม่ดื่ม' &&
            (r.exercise === '3-4 วัน/สัปดาห์' || r.exercise === '≥5 วัน/สัปดาห์')
        ),
      },
    ];

    return list.map((item) => {
      const total = item.records.length;
      const highRisk = item.records.filter(
        (r) => r.riskLevel === 'เสี่ยงสูง' || r.riskLevel === 'เสี่ยงสูงมาก'
      ).length;
      return {
        behavior: item.behavior,
        total,
        highRisk,
        highRiskRate: total > 0 ? Number(((highRisk / total) * 100).toFixed(1)) : 0,
        avgRiskScore:
          total > 0
            ? Number((item.records.reduce((acc, c) => acc + c.riskScore, 0) / total).toFixed(1))
            : 0,
      };
    });
  }, [records]);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-3">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Microscope className="w-5 h-5 text-teal-600" />
          การวิเคราะห์ความสัมพันธ์เชิงลึก (In-Depth Correlation & Health Deep Dive)
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          ประเด็นเจาะลึก 5 ด้าน: กลุ่มอายุเสี่ยงสูง, การจัดอันดับพื้นที่, ความสัมพันธ์ BMI กับน้ำตาล, BMI กับความดัน, และอิทธิพลของพฤติกรรมต่อความเสี่ยง
        </p>
      </div>

      {/* Deep Dive 1 & 2: Age & Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. กลุ่มอายุที่มีความเสี่ยงสูง */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-teal-600" />
                1. กลุ่มอายุที่มีความเสี่ยงสูง (High-Risk by Age Group)
              </h4>
              <p className="text-xs text-slate-500">เปรียบเทียบสัดส่วนและอัตราความเสี่ยงสูง (%) ในแต่ละช่วงอายุ</p>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageRiskAnalysis} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="ageGroup"
                  tick={{ fontSize: 10 }}
                  interval={0}
                  angle={-10}
                  textAnchor="end"
                  height={35}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any, name: any, item: any) => [
                    `${val} คน (${item.payload.highRiskRate}% ของกลุ่มอายุนี้)`,
                    name,
                  ]}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="กลุ่มเสี่ยงสูง" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="กลุ่มปกติและเสี่ยงปานกลาง" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-600 flex items-center justify-between">
            <span>กลุ่มที่อัตราเสี่ยงสูงที่สุด:</span>
            <span className="font-semibold text-rose-600">
              {ageRiskAnalysis.slice().sort((a, b) => b.highRiskRate - a.highRiskRate)[0]?.ageGroup} (
              {ageRiskAnalysis.slice().sort((a, b) => b.highRiskRate - a.highRiskRate)[0]?.highRiskRate}%)
            </span>
          </div>
        </div>

        {/* 2. พื้นที่ที่มีผู้เสี่ยงสูง */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-sky-600" />
                2. พื้นที่ที่มีผู้เสี่ยงสูง (High-Risk Geographic Areas)
              </h4>
              <p className="text-xs text-slate-500">จัดอันดับพื้นที่/จังหวัดตามอัตราส่วนประชากรกลุ่มเสี่ยงสูง</p>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={areaRiskAnalysis} layout="vertical" margin={{ top: 5, right: 25, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" unit="%" tick={{ fontSize: 10 }} domain={[0, 100]} />
                <YAxis type="category" dataKey="province" tick={{ fontSize: 10 }} width={85} />
                <Tooltip
                  formatter={(val: any, _, item: any) => [
                    `${val}% (เสี่ยงสูง ${item.payload.highRiskCount} จาก ${item.payload.total} คน)`,
                    'อัตราเสี่ยงสูง',
                  ]}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                />
                <Bar dataKey="highRiskRate" radius={[0, 4, 4, 0]}>
                  {areaRiskAnalysis.map((entry, index) => (
                    <Cell
                      key={entry.province}
                      fill={entry.highRiskRate >= 45 ? '#ef4444' : entry.highRiskRate >= 30 ? '#f97316' : '#14b8a6'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-600 flex items-center justify-between">
            <span>พื้นที่เฝ้าระวังอันดับ 1:</span>
            <span className="font-semibold text-rose-600">
              {areaRiskAnalysis[0]?.province} (เสี่ยงสูง {areaRiskAnalysis[0]?.highRiskRate}%)
            </span>
          </div>
        </div>
      </div>

      {/* Deep Dive 3 & 4: Correlation Scatter Plots */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-teal-600" />
              3 & 4. แผนภาพการกระจายความสัมพันธ์ (Correlation Scatter Plots)
            </h4>
            <p className="text-xs text-slate-500">
              ตรวจหาความสัมพันธ์ระหว่างดัชนีมวลกาย (BMI) กับค่าน้ำตาลในเลือด หรือ ค่าความดันโลหิต
            </p>
          </div>

          {/* Toggle buttons */}
          <div className="inline-flex p-1 bg-slate-100 rounded-lg text-xs font-medium">
            <button
              onClick={() => setSelectedCorrelation('bmi-sugar')}
              className={`px-3 py-1.5 rounded-md transition ${
                selectedCorrelation === 'bmi-sugar'
                  ? 'bg-white text-teal-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              BMI vs น้ำตาลในเลือด (Glucose)
            </button>
            <button
              onClick={() => setSelectedCorrelation('bmi-bp')}
              className={`px-3 py-1.5 rounded-md transition ${
                selectedCorrelation === 'bmi-bp'
                  ? 'bg-white text-teal-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              BMI vs ความดันโลหิต (SBP)
            </button>
          </div>
        </div>

        {/* Scatter View */}
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                type="number"
                dataKey="bmi"
                name="BMI"
                unit=" kg/m²"
                domain={[16, 40]}
                tick={{ fontSize: 11 }}
                label={{ value: 'ดัชนีมวลกาย (BMI kg/m²)', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#64748b' }}
              />
              {selectedCorrelation === 'bmi-sugar' ? (
                <YAxis
                  type="number"
                  dataKey="sugar"
                  name="น้ำตาล"
                  unit=" mg/dL"
                  domain={[60, 280]}
                  tick={{ fontSize: 11 }}
                  label={{ value: 'ระดับน้ำตาล FBG (mg/dL)', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11, fill: '#64748b' }}
                />
              ) : (
                <YAxis
                  type="number"
                  dataKey="sbp"
                  name="ความดันบน"
                  unit=" mmHg"
                  domain={[90, 200]}
                  tick={{ fontSize: 11 }}
                  label={{ value: 'ความดันบน Systolic BP (mmHg)', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11, fill: '#64748b' }}
                />
              )}
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 rounded-lg shadow-md border border-slate-200 text-xs space-y-1">
                        <div className="font-bold text-slate-800">{data.name} ({data.id})</div>
                        <div className="text-slate-600">เพศ {data.gender}, อายุ {data.age} ปี</div>
                        <div className="text-slate-700">ดัชนี BMI: <span className="font-semibold">{data.bmi}</span></div>
                        <div className="text-slate-700">
                          {selectedCorrelation === 'bmi-sugar'
                            ? `ระดับน้ำตาล: ${data.sugar} mg/dL`
                            : `ความดันโลหิต: ${data.sbp}/${data.dbp} mmHg`}
                        </div>
                        <div className="pt-1 border-t border-slate-100 flex items-center gap-1.5">
                          <span>ระดับความเสี่ยง:</span>
                          <span
                            className="font-bold px-1.5 py-0.5 rounded text-[10px]"
                            style={{ backgroundColor: `${data.color}20`, color: data.color }}
                          >
                            {data.riskLevel} (คะแนน {data.riskScore})
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {/* Clinical Guideline Reference Lines */}
              <ReferenceLine x={23} stroke="#94a3b8" strokeDasharray="3 3" label={{ value: 'BMI ปกติ (23)', fontSize: 10, fill: '#94a3b8' }} />
              <ReferenceLine x={25} stroke="#f97316" strokeDasharray="3 3" label={{ value: 'เกณฑ์อ้วน (25)', fontSize: 10, fill: '#ea580c' }} />

              {selectedCorrelation === 'bmi-sugar' ? (
                <>
                  <ReferenceLine y={100} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'เสี่ยงเบาหวาน (100 mg/dL)', fontSize: 10, fill: '#d97706' }} />
                  <ReferenceLine y={126} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'เบาหวาน (126 mg/dL)', fontSize: 10, fill: '#dc2626' }} />
                </>
              ) : (
                <>
                  <ReferenceLine y={130} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Pre-HT (130 mmHg)', fontSize: 10, fill: '#d97706' }} />
                  <ReferenceLine y={140} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'ความดันสูง (140 mmHg)', fontSize: 10, fill: '#dc2626' }} />
                </>
              )}

              <Scatter data={scatterPoints} fill="#14b8a6">
                {scatterPoints.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Scatter Legend & Insight Note */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 text-slate-600">
            <span className="font-semibold text-slate-700">สัญลักษณ์สีจุด:</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>เสี่ยงสูงมาก</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>เสี่ยงสูง</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>เสี่ยงปานกลาง</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>ปกติ</span>
          </div>
          <div className="text-slate-500 italic text-[11px]">
            * พบแนวโน้มเชิงบวกชัดเจน: เมื่อค่า BMI สูงกว่า 25 มีความสัมพันธ์กับระดับน้ำตาลและความดันโลหิตที่สูงขึ้น
          </div>
        </div>
      </div>

      {/* Deep Dive 5: พฤติกรรมกับระดับความเสี่ยง (Behaviors vs Risk Level) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="mb-4">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-600" />
            5. พฤติกรรมสุขภาพกับระดับความเสี่ยง (Behavior vs Risk Level Correlation)
          </h4>
          <p className="text-xs text-slate-500">
            เปรียบเทียบผลกระทบของแต่ละพฤติกรรมต่ออัตราการตกอยู่ในกลุ่มเสี่ยงสูงและคะแนนความเสี่ยงเฉลี่ย
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <th className="py-2.5 px-3 font-semibold">กลุ่มพฤติกรรมสุขภาพ</th>
                <th className="py-2.5 px-3 font-semibold text-center">จำนวนในกลุ่ม (คน)</th>
                <th className="py-2.5 px-3 font-semibold text-center">จำนวนที่เสี่ยงสูง (คน)</th>
                <th className="py-2.5 px-3 font-semibold text-center">อัตราเสี่ยงสูง (%)</th>
                <th className="py-2.5 px-3 font-semibold text-center">คะแนนความเสี่ยงเฉลี่ย (0-100)</th>
                <th className="py-2.5 px-3 font-semibold">ข้อเสนอแนะเชิงป้องกัน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {behaviorRiskMatrix.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-3 font-medium text-slate-800">{row.behavior}</td>
                  <td className="py-2.5 px-3 text-center text-slate-600">{row.total}</td>
                  <td className="py-2.5 px-3 text-center font-semibold text-rose-600">{row.highRisk}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded font-bold ${
                        row.highRiskRate >= 50
                          ? 'bg-rose-100 text-rose-700'
                          : row.highRiskRate >= 30
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {row.highRiskRate}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-medium text-slate-700">
                    {row.avgRiskScore}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                    {row.behavior.includes('สูบบุหรี่')
                      ? 'คลินิกช่วยเลิกบุหรี่ + ประเมินสมรรถภาพปอด'
                      : row.behavior.includes('ดื่มสุรา')
                      ? 'บำบัดลดละเลิกแอลกอฮอล์ + ตรวจการทำงานตับ'
                      : row.behavior.includes('ไม่ออกกำลังกาย')
                      ? 'จ่ายใบสั่งออกกำลังกาย (Exercise Prescription)'
                      : row.behavior.includes('กินหวานมันเค็ม')
                      ? 'ปรับพฤติกรรมลดโซเดียม น้ำตาล และไขมันอิ่มตัว'
                      : row.behavior.includes('นอนน้อย')
                      ? 'สุขอนามัยการนอนหลับ (Sleep Hygiene) 7-8 ชม.'
                      : 'รักษาพฤติกรรมที่ดีต่อเนื่อง เป็นบุคคลต้นแบบ'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
