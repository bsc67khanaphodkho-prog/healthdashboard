import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, Activity, Cigarette, Wine, Dumbbell, Utensils, Moon } from 'lucide-react';
import { HealthRecord } from '../types';

interface TrendAndBehaviorViewProps {
  records: HealthRecord[];
}

export const TrendAndBehaviorView: React.FC<TrendAndBehaviorViewProps> = ({ records }) => {
  // 1. Health Trend (by Month / Checkup Period)
  const monthlyTrends = useMemo(() => {
    const monthMap: Record<
      string,
      { count: number; sumBmi: number; sumFbg: number; sumSbp: number; sumScore: number }
    > = {};

    records.forEach((r) => {
      // YYYY-MM
      const m = r.checkupDate.slice(0, 7);
      if (!monthMap[m]) {
        monthMap[m] = { count: 0, sumBmi: 0, sumFbg: 0, sumSbp: 0, sumScore: 0 };
      }
      monthMap[m].count++;
      monthMap[m].sumBmi += r.bmi;
      monthMap[m].sumFbg += r.fastingBloodSugar;
      monthMap[m].sumSbp += r.systolicBp;
      monthMap[m].sumScore += r.riskScore;
    });

    const thaiMonths: Record<string, string> = {
      '01': 'ม.ค.',
      '02': 'ก.พ.',
      '03': 'มี.ค.',
      '04': 'เม.ย.',
      '05': 'พ.ค.',
      '06': 'มิ.ย.',
      '07': 'ก.ค.',
      '08': 'ส.ค.',
      '09': 'ก.ย.',
      '10': 'ต.ค.',
      '11': 'พ.ย.',
      '12': 'ธ.ค.',
    };

    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([ym, val]) => {
        const [_, monthPart] = ym.split('-');
        return {
          month: `${thaiMonths[monthPart] || monthPart} 69`,
          avgFbg: Number((val.sumFbg / val.count).toFixed(1)),
          avgSbp: Number((val.sumSbp / val.count).toFixed(1)),
          avgBmi: Number((val.sumBmi / val.count).toFixed(1)),
          avgScore: Number((val.sumScore / val.count).toFixed(1)),
          count: val.count,
        };
      });
  }, [records]);

  // 2. Health Behaviors (4 Fields)
  // Field 1: Smoking Behavior
  const smokingStats = useMemo(() => {
    const counts: Record<string, number> = {
      ไม่สูบ: 0,
      เคยสูบแต่เลิกแล้ว: 0,
      'สูบนานๆ ครั้ง': 0,
      สูบเป็นประจำ: 0,
    };
    records.forEach((r) => {
      counts[r.smoking] = (counts[r.smoking] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      percent: records.length > 0 ? Number(((count / records.length) * 100).toFixed(1)) : 0,
    }));
  }, [records]);

  // Field 2: Alcohol Behavior
  const alcoholStats = useMemo(() => {
    const counts: Record<string, number> = {
      ไม่ดื่ม: 0,
      ดื่มเข้าสังคม: 0,
      ดื่มเป็นประจำ: 0,
    };
    records.forEach((r) => {
      counts[r.alcohol] = (counts[r.alcohol] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      percent: records.length > 0 ? Number(((count / records.length) * 100).toFixed(1)) : 0,
    }));
  }, [records]);

  // Field 3: Exercise Behavior
  const exerciseStats = useMemo(() => {
    const counts: Record<string, number> = {
      ไม่ออกกำลังกาย: 0,
      '1-2 วัน/สัปดาห์': 0,
      '3-4 วัน/สัปดาห์': 0,
      '≥5 วัน/สัปดาห์': 0,
    };
    records.forEach((r) => {
      counts[r.exercise] = (counts[r.exercise] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      percent: records.length > 0 ? Number(((count / records.length) * 100).toFixed(1)) : 0,
    }));
  }, [records]);

  // Field 4: Diet Habit
  const dietStats = useMemo(() => {
    const counts: Record<string, number> = {
      กินหวานมันเค็มประจำ: 0,
      กินหวานมันเค็มปานกลาง: 0,
      'กินอาหารสุขภาพ/ควบคุมรสชาติ': 0,
    };
    records.forEach((r) => {
      counts[r.dietHabit] = (counts[r.dietHabit] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      percent: records.length > 0 ? Number(((count / records.length) * 100).toFixed(1)) : 0,
    }));
  }, [records]);

  // Field 5: Sleep Hygiene / Duration (5th Behavior Field)
  const sleepStats = useMemo(() => {
    const counts: Record<string, number> = {
      'นอนน้อย (<6 ชม.)': 0,
      'เหมาะสม (6-8 ชม.)': 0,
      'นอนมาก (>8 ชม.)': 0,
    };
    records.forEach((r) => {
      if (r.sleepHours < 6) {
        counts['นอนน้อย (<6 ชม.)']++;
      } else if (r.sleepHours <= 8) {
        counts['เหมาะสม (6-8 ชม.)']++;
      } else {
        counts['นอนมาก (>8 ชม.)']++;
      }
    });
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      percent: records.length > 0 ? Number(((count / records.length) * 100).toFixed(1)) : 0,
    }));
  }, [records]);

  return (
    <div className="space-y-6">
      {/* SECTION 1: Health Trend */}
      <div>
        <div className="border-b border-slate-200 pb-3 mb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal-600" />
              แนวโน้มตัวชี้วัดสุขภาพ 4 มิติตามช่วงเวลา (Health Trend Analysis)
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 font-semibold border border-teal-200">
              วิเคราะห์ครบ 4 Fields: FBG, SBP, BMI, Risk Score
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            ติดตามการเปลี่ยนแปลงเฉลี่ยของระดับน้ำตาล (FBG), ความดันโลหิต (SBP), ดัชนีมวลกาย (BMI), และคะแนนความเสี่ยง (Risk Score)
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trend 1: Glucose & Blood Pressure */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-800">
                  1. แนวโน้มระดับน้ำตาลในเลือด (FBG) และความดันบน (SBP)
                </h4>
                <p className="text-xs text-slate-500">ค่าเฉลี่ยรายเดือน (หน่วย: mg/dL และ mmHg)</p>
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorFbg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorSbp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis domain={['dataMin - 10', 'dataMax + 10']} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Area
                    type="monotone"
                    name="น้ำตาลเฉลี่ย (FBG mg/dL)"
                    dataKey="avgFbg"
                    stroke="#f59e0b"
                    fillOpacity={1}
                    fill="url(#colorFbg)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    name="ความดันบนเฉลี่ย (SBP mmHg)"
                    dataKey="avgSbp"
                    stroke="#ef4444"
                    fillOpacity={1}
                    fill="url(#colorSbp)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Trend 2: BMI & Overall Risk Score */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-800">
                  2. แนวโน้มดัชนีมวลกาย (BMI) และคะแนนความเสี่ยงเฉลี่ย (Risk Score)
                </h4>
                <p className="text-xs text-slate-500">ติดตามพลวัตของปัจจัยเสี่ยงรวมและค่าความอ้วน</p>
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} domain={[18, 32]} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    name="BMI เฉลี่ย (kg/m²)"
                    dataKey="avgBmi"
                    stroke="#0ea5e9"
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    name="คะแนนความเสี่ยง (0-100)"
                    dataKey="avgScore"
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    strokeDasharray="4 4"
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Health Behaviors (5 Fields) */}
      <div>
        <div className="border-b border-slate-200 pb-3 mb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-600" />
              พฤติกรรมสุขภาพ 5 มิติ (Health Behaviors Analysis - 5 Fields)
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 font-semibold border border-teal-200">
              วิเคราะห์ครบ 5 พฤติกรรม: สูบบุหรี่, ดื่มสุรา, ออกกำลังกาย, หวานมันเค็ม, สุขอนามัยการนอน
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            สำรวจพฤติกรรมการใช้ชีวิตที่มีผลกระทบโดยตรงต่อความเสี่ยงโรค NCDs และสุขภาพหัวใจหลอดเลือด
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* Behavior 1: Smoking */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center">
                <Cigarette className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">1. การสูบบุหรี่ (Smoking)</h4>
                <p className="text-[10px] text-slate-500">พฤติกรรมการสูบยาสูบ</p>
              </div>
            </div>

            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={smokingStats} layout="vertical" margin={{ top: 0, right: 15, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={68} />
                  <Tooltip
                    formatter={(val: any, _, item: any) => [`${val} คน (${item.payload.percent}%)`, 'จำนวน']}
                    contentStyle={{ fontSize: '11px', borderRadius: '6px' }}
                  />
                  <Bar dataKey="count" fill="#f43f5e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Behavior 2: Alcohol */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
                <Wine className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">2. การดื่มสุรา (Alcohol)</h4>
                <p className="text-[10px] text-slate-500">การดื่มเครื่องดื่มแอลกอฮอล์</p>
              </div>
            </div>

            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={alcoholStats} layout="vertical" margin={{ top: 0, right: 15, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={68} />
                  <Tooltip
                    formatter={(val: any, _, item: any) => [`${val} คน (${item.payload.percent}%)`, 'จำนวน']}
                    contentStyle={{ fontSize: '11px', borderRadius: '6px' }}
                  />
                  <Bar dataKey="count" fill="#d97706" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Behavior 3: Exercise */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Dumbbell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">3. การออกกำลังกาย (Exercise)</h4>
                <p className="text-[10px] text-slate-500">กิจกรรมทางกายต่อสัปดาห์</p>
              </div>
            </div>

            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={exerciseStats} layout="vertical" margin={{ top: 0, right: 15, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={78} />
                  <Tooltip
                    formatter={(val: any, _, item: any) => [`${val} คน (${item.payload.percent}%)`, 'จำนวน']}
                    contentStyle={{ fontSize: '11px', borderRadius: '6px' }}
                  />
                  <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Behavior 4: Diet */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center">
                <Utensils className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">4. โภชนาการ (Diet Habit)</h4>
                <p className="text-[10px] text-slate-500">พฤติกรรมการกินหวานมันเค็ม</p>
              </div>
            </div>

            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dietStats} layout="vertical" margin={{ top: 0, right: 15, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={82} />
                  <Tooltip
                    formatter={(val: any, _, item: any) => [`${val} คน (${item.payload.percent}%)`, 'จำนวน']}
                    contentStyle={{ fontSize: '11px', borderRadius: '6px' }}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Behavior 5: Sleep Hygiene */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">5. การนอนหลับ (Sleep)</h4>
                <p className="text-[10px] text-slate-500">ชั่วโมงพักผ่อนต่อคืน</p>
              </div>
            </div>

            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sleepStats} layout="vertical" margin={{ top: 0, right: 15, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={82} />
                  <Tooltip
                    formatter={(val: any, _, item: any) => [`${val} คน (${item.payload.percent}%)`, 'จำนวน']}
                    contentStyle={{ fontSize: '11px', borderRadius: '6px' }}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
