import React from 'react';
import { Users, Gauge, HeartPulse, Droplets, PieChart, Percent, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { SummaryStats } from '../types';

interface KpiCardsProps {
  stats: SummaryStats;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ stats }) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <span>สรุปภาพรวมตัวชี้วัดสุขภาพสำคัญ (Health Overview KPIs)</span>
        </h2>
        <span className="text-xs text-slate-500 font-medium">คำนวณตามเกณฑ์ทางการแพทย์และสาธารณสุข</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {/* KPI 1: จำนวน (Total Count) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-teal-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500">1. จำนวนผู้รับการคัดกรอง</span>
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">
                {stats.totalCount.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500">คน</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
            <span>อายุเฉลี่ย:</span>
            <span className="font-semibold text-slate-800">{stats.avgAge} ปี</span>
          </div>
        </div>

        {/* KPI 2: ค่าเฉลี่ย (Average BMI & Sugar) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-teal-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500">2. ค่าเฉลี่ยสุขภาพ (Mean)</span>
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <Gauge className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">
                {stats.avgBmi}
              </span>
              <span className="text-xs text-slate-500 font-medium">kg/m² (BMI)</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1 text-[11px]">
            <div className="flex justify-between text-slate-600">
              <span>น้ำตาลเฉลี่ย:</span>
              <span className="font-semibold text-slate-800">{stats.avgBloodSugar} mg/dL</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>ความดันเฉลี่ย:</span>
              <span className="font-semibold text-slate-800">{stats.avgSystolicBp}/{stats.avgDiastolicBp} mmHg</span>
            </div>
          </div>
        </div>

        {/* KPI 3: ค่าต่ำสุด - ค่าสูงสุด (Min - Max) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-teal-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500">3. ค่าต่ำสุด - สูงสุด (Min/Max)</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <HeartPulse className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-slate-900">
                {stats.minBloodSugar} - {stats.maxBloodSugar}
              </span>
              <span className="text-xs text-slate-500">mg/dL (น้ำตาล)</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1 text-[11px]">
            <div className="flex justify-between text-slate-600">
              <span>ความดันบน (SBP):</span>
              <span className="font-semibold text-slate-800">{stats.minSystolicBp} - {stats.maxSystolicBp} mmHg</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>ดัชนี BMI:</span>
              <span className="font-semibold text-slate-800">{stats.minBmi} - {stats.maxBmi}</span>
            </div>
          </div>
        </div>

        {/* KPI 4: สัดส่วน (Proportion) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-teal-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500">4. สัดส่วนกลุ่มเสี่ยงสูง (Ratio)</span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <PieChart className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-rose-600 tracking-tight">
                {stats.highRiskCount}
              </span>
              <span className="text-xs text-slate-500">/ {stats.totalCount} คน</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
            <span>อัตราส่วนประชากร:</span>
            <span className="font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
              {stats.highRiskProportion.includes('1 :') ? stats.highRiskProportion.split('(')[1]?.replace(')', '') : '1 : 3.0'}
            </span>
          </div>
        </div>

        {/* KPI 5: ร้อยละ (Percentage) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-teal-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500">5. ร้อยละความเสี่ยง (Percent)</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">
                {stats.highRiskPercentage}%
              </span>
              <span className="text-xs text-rose-600 font-medium">เสี่ยงสูง-วิกฤต</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1 text-[11px]">
            <div className="flex justify-between text-slate-600">
              <span>ความดันโลหิตสูง:</span>
              <span className="font-semibold text-slate-800">{stats.hypertensionPercentage}%</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>ภาวะอ้วน (BMI ≥ 25):</span>
              <span className="font-semibold text-slate-800">{stats.obesityPercentage}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
