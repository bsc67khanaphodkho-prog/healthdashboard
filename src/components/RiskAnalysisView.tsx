import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { ShieldAlert, AlertTriangle, Activity, HeartCrack } from 'lucide-react';
import { HealthRecord } from '../types';

interface RiskAnalysisViewProps {
  records: HealthRecord[];
}

const RISK_COLORS: Record<string, string> = {
  ปกติ: '#10b981', // emerald-500
  เสี่ยงปานกลาง: '#f59e0b', // amber-500
  เสี่ยงสูง: '#f97316', // orange-500
  เสี่ยงสูงมาก: '#ef4444', // red-500
};

const BMI_COLORS: Record<string, string> = {
  น้ำหนักน้อย: '#38bdf8',
  ปกติ: '#10b981',
  น้ำหนักเกิน: '#facc15',
  'อ้วนระดับ 1': '#f97316',
  'อ้วนระดับ 2 (อันตราย)': '#dc2626',
};

export const RiskAnalysisView: React.FC<RiskAnalysisViewProps> = ({ records }) => {
  // Field 1: Overall Risk Level Distribution
  const riskDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      ปกติ: 0,
      เสี่ยงปานกลาง: 0,
      เสี่ยงสูง: 0,
      เสี่ยงสูงมาก: 0,
    };
    records.forEach((r) => {
      counts[r.riskLevel] = (counts[r.riskLevel] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      percentage: records.length > 0 ? ((value / records.length) * 100).toFixed(1) : '0',
    }));
  }, [records]);

  // Field 2: Risk Level by Gender
  const riskByGender = useMemo(() => {
    const map: Record<string, { male: number; female: number }> = {
      ปกติ: { male: 0, female: 0 },
      เสี่ยงปานกลาง: { male: 0, female: 0 },
      เสี่ยงสูง: { male: 0, female: 0 },
      เสี่ยงสูงมาก: { male: 0, female: 0 },
    };
    records.forEach((r) => {
      if (r.gender === 'ชาย') {
        map[r.riskLevel].male++;
      } else {
        map[r.riskLevel].female++;
      }
    });
    return Object.entries(map).map(([risk, counts]) => ({
      risk,
      ชาย: counts.male,
      หญิง: counts.female,
      total: counts.male + counts.female,
    }));
  }, [records]);

  // Field 3: BMI Category Distribution
  const bmiDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      น้ำหนักน้อย: 0,
      ปกติ: 0,
      น้ำหนักเกิน: 0,
      'อ้วนระดับ 1': 0,
      'อ้วนระดับ 2 (อันตราย)': 0,
    };
    records.forEach((r) => {
      counts[r.bmiCategory] = (counts[r.bmiCategory] || 0) + 1;
    });
    return Object.entries(counts).map(([category, count]) => ({
      category,
      count,
      percent: records.length > 0 ? Number(((count / records.length) * 100).toFixed(1)) : 0,
    }));
  }, [records]);

  // Field 4: Blood Pressure Categories
  const bpDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      ปกติ: 0,
      'ความดันสูงเล็กน้อย (Pre-HT)': 0,
      'ความดันโลหิตสูงระดับ 1': 0,
      'ความดันโลหิตสูงระดับ 2': 0,
    };
    records.forEach((r) => {
      counts[r.bpCategory] = (counts[r.bpCategory] || 0) + 1;
    });
    return Object.entries(counts).map(([stage, count]) => ({
      stage,
      count,
      percent: records.length > 0 ? Number(((count / records.length) * 100).toFixed(1)) : 0,
    }));
  }, [records]);

  // Field 5: Blood Sugar Category Breakdown
  const sugarDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      'ปกติ (<100)': 0,
      'ภาวะเสี่ยงเบาหวาน (100-125)': 0,
      'เบาหวาน (≥126)': 0,
    };
    records.forEach((r) => {
      counts[r.sugarCategory] = (counts[r.sugarCategory] || 0) + 1;
    });
    return Object.entries(counts).map(([category, count]) => ({
      category,
      count,
      percent: records.length > 0 ? Number(((count / records.length) * 100).toFixed(1)) : 0,
    }));
  }, [records]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-teal-600" />
            การวิเคราะห์ความเสี่ยงสุขภาพ (Health Risk Analysis)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            วิเคราะห์ 5 มิติปัจจัยเสี่ยง: ระดับความเสี่ยงรวม, ความเสี่ยงตามเพศ, ดัชนีมวลกาย (BMI), ความดันโลหิต, และระดับน้ำตาล
          </p>
        </div>
      </div>

      {/* Row 1: Charts 1 & 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Field 1: Overall Risk Donut */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-800">
                1. สัดส่วนระดับความเสี่ยงสุขภาพรวม (Risk Level Distribution)
              </h4>
              <p className="text-xs text-slate-500">คำนวณจากคะแนนความเสี่ยง 0 - 100 ตามเกณฑ์คัดกรอง</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              {records.length} รายการ
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {riskDistribution.map((entry) => (
                    <Cell key={entry.name} fill={RISK_COLORS[entry.name] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any, item: any) => [
                    `${value} คน (${item.payload.percentage}%)`,
                    `ระดับ: ${name}`,
                  ]}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend
                  formatter={(val, entry: any) => `${val}: ${entry.payload.value} คน (${entry.payload.percentage}%)`}
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Field 2: Risk by Gender */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-800">
                2. เปรียบเทียบระดับความเสี่ยงจำแนกตามเพศ (Risk by Gender)
              </h4>
              <p className="text-xs text-slate-500">อัตราความเสี่ยงระหว่างเพศชายและเพศหญิงในแต่ละระดับ</p>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskByGender} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="risk" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [`${val} คน`, '']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar dataKey="ชาย" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="หญิง" fill="#ec4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Charts 3, 4 & 5 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Field 3: BMI Category */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="mb-3">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-teal-600" />
              3. การกระจายตัวของค่า BMI
            </h4>
            <p className="text-xs text-slate-500">เกณฑ์มาตรฐานเอเชีย (Asia-Pacific)</p>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bmiDistribution} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="category" tick={{ fontSize: 10 }} width={80} />
                <Tooltip
                  formatter={(val: any, _, item: any) => [`${val} คน (${item.payload.percent}%)`, 'จำนวน']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {bmiDistribution.map((entry) => (
                    <Cell key={entry.category} fill={BMI_COLORS[entry.category] || '#0d9488'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Field 4: Blood Pressure Stages */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="mb-3">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <HeartCrack className="w-4 h-4 text-rose-600" />
              4. ภาวะความดันโลหิต (Hypertension)
            </h4>
            <p className="text-xs text-slate-500">ตามเกณฑ์สมาคมความดันโลหิตแห่งประเทศไทย</p>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bpDistribution} margin={{ top: 5, right: 10, left: -15, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="stage"
                  tick={{ fontSize: 9 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={40}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(val: any, _, item: any) => [`${val} คน (${item.payload.percent}%)`, 'จำนวน']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                />
                <Bar dataKey="count" fill="#e11d48" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Field 5: Blood Sugar Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="mb-3">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              5. ภาวะน้ำตาลในเลือด (Glucose)
            </h4>
            <p className="text-xs text-slate-500">ระดับ Fasting Blood Sugar (mg/dL)</p>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sugarDistribution} margin={{ top: 5, right: 10, left: -15, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 9 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={40}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(val: any, _, item: any) => [`${val} คน (${item.payload.percent}%)`, 'จำนวน']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                />
                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
