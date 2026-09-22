import React from 'react';
import { Filter, Search, RotateCcw } from 'lucide-react';
import { FilterState } from '../types';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  onResetFilters: () => void;
  provinces: string[];
  totalFiltered: number;
  totalAll: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  provinces,
  totalFiltered,
  totalAll,
}) => {
  const isFiltered =
    filters.searchQuery !== '' ||
    filters.gender !== 'all' ||
    filters.ageGroup !== 'all' ||
    filters.riskLevel !== 'all' ||
    filters.province !== 'all' ||
    filters.clinicalFilter !== 'all' ||
    filters.behaviorFilter !== 'all';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs mb-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-3.5 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 text-slate-800">
          <Filter className="w-4 h-4 text-teal-600" />
          <span className="font-semibold text-sm">ระบบตัวกรองข้อมูลสุขภาพ (Multi-Dimensional Filters)</span>
          <span className="text-xs text-slate-500">
            (แสดง {totalFiltered.toLocaleString()} จากทั้งหมด {totalAll.toLocaleString()} รายการ)
          </span>
        </div>

        {isFiltered && (
          <button
            onClick={onResetFilters}
            className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-medium px-2.5 py-1 rounded-md hover:bg-rose-50 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            ล้างตัวกรองทั้งหมด
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {/* 1. Search Query */}
        <div className="relative xl:col-span-1">
          <label className="block text-[11px] font-medium text-slate-500 mb-1">ค้นหาบุคคล</label>
          <div className="relative">
            <input
              type="text"
              placeholder="ค้นหาชื่อ หรือ รหัส..."
              value={filters.searchQuery}
              onChange={(e) => onFilterChange('searchQuery', e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        {/* 2. Gender */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">เพศ (Gender)</label>
          <select
            value={filters.gender}
            onChange={(e) => onFilterChange('gender', e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-700"
          >
            <option value="all">ทุกเพศ (ทั้งหมด)</option>
            <option value="ชาย">ชาย</option>
            <option value="หญิง">หญิง</option>
          </select>
        </div>

        {/* 3. Age Group */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">กลุ่มอายุ (Age Group)</label>
          <select
            value={filters.ageGroup}
            onChange={(e) => onFilterChange('ageGroup', e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-700"
          >
            <option value="all">ทุกช่วงอายุ</option>
            <option value="20-34">20 - 34 ปี (วัยทำงานต้น)</option>
            <option value="35-49">35 - 49 ปี (วัยทำงานกลาง)</option>
            <option value="50-59">50 - 59 ปี (วัยก่อนสูงอายุ)</option>
            <option value="60+">60 ปีขึ้นไป (ผู้สูงอายุ)</option>
          </select>
        </div>

        {/* 4. Risk Level */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">ระดับความเสี่ยง (Risk Level)</label>
          <select
            value={filters.riskLevel}
            onChange={(e) => onFilterChange('riskLevel', e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-700"
          >
            <option value="all">ทุกระดับความเสี่ยง</option>
            <option value="เสี่ยงสูงมาก">🔴 เสี่ยงสูงมาก (Critical)</option>
            <option value="เสี่ยงสูง">🟠 เสี่ยงสูง (High)</option>
            <option value="เสี่ยงปานกลาง">🟡 เสี่ยงปานกลาง (Moderate)</option>
            <option value="ปกติ">🟢 ปกติ (Normal)</option>
          </select>
        </div>

        {/* 5. Province / Area */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">พื้นที่ / จังหวัด (Area)</label>
          <select
            value={filters.province}
            onChange={(e) => onFilterChange('province', e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-700"
          >
            <option value="all">ทุกพื้นที่/จังหวัด</option>
            {provinces.map((prov) => (
              <option key={prov} value={prov}>
                {prov}
              </option>
            ))}
          </select>
        </div>

        {/* 6. Clinical Risk Factor */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">ปัจจัยทางคลินิก (Clinical)</label>
          <select
            value={filters.clinicalFilter}
            onChange={(e) => onFilterChange('clinicalFilter', e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-700"
          >
            <option value="all">ปัจจัยทางคลินิกทั้งหมด</option>
            <option value="high-sugar">น้ำตาลสูง (FBG ≥ 100 mg/dL)</option>
            <option value="diabetes">เป็นเบาหวาน (FBG ≥ 126 mg/dL)</option>
            <option value="high-bp">ความดันสูง (BP ≥ 140/90 mmHg)</option>
            <option value="obese">ภาวะอ้วน (BMI ≥ 25 kg/m²)</option>
            <option value="family-ncd">มีประวัติครอบครัว NCDs</option>
          </select>
        </div>

        {/* 7. Behavior Filter */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">พฤติกรรมเสี่ยง (Behavior)</label>
          <select
            value={filters.behaviorFilter}
            onChange={(e) => onFilterChange('behaviorFilter', e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-700"
          >
            <option value="all">พฤติกรรมทั้งหมด</option>
            <option value="smoker">สูบบุหรี่เป็นประจำ</option>
            <option value="alcohol">ดื่มแอลกอฮอล์เป็นประจำ</option>
            <option value="no-exercise">ไม่ออกกำลังกาย</option>
            <option value="unhealthy-diet">กินหวานมันเค็มประจำ</option>
            <option value="sleep-deprived">นอนน้อย (&lt; 6 ชม./วัน)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
