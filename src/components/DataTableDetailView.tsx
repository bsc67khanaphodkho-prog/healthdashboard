import React, { useState, useMemo } from 'react';
import {
  Download,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Heart,
  Activity,
  FileText,
} from 'lucide-react';
import { HealthRecord } from '../types';

interface DataTableDetailViewProps {
  records: HealthRecord[];
}

export const DataTableDetailView: React.FC<DataTableDetailViewProps> = ({ records }) => {
  const [sortField, setSortField] = useState<keyof HealthRecord>('riskScore');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(null);

  // Sorting
  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === 'string') {
        const res = (valA as string).localeCompare(valB as string);
        return sortAsc ? res : -res;
      }
      if (typeof valA === 'number') {
        return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
      }
      return 0;
    });
  }, [records, sortField, sortAsc]);

  // Pagination
  const totalPages = Math.ceil(sortedRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, page, pageSize]);

  const handleSort = (field: keyof HealthRecord) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // default descending for metrics
    }
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (records.length === 0) return;
    const headers = [
      'รหัส (ID)',
      'ชื่อ-นามสกุล',
      'อายุ',
      'เพศ',
      'จังหวัด',
      'อำเภอ',
      'ส่วนสูง(cm)',
      'น้ำหนัก(kg)',
      'BMI',
      'กลุ่มBMI',
      'ความดันบน(SBP)',
      'ความดันล่าง(DBP)',
      'กลุ่มความดัน',
      'น้ำตาลในเลือด(FBG)',
      'กลุ่มน้ำตาล',
      'สูบบุหรี่',
      'ดื่มแอลกอฮอล์',
      'ออกกำลังกาย',
      'พฤติกรรมการกิน',
      'ชั่วโมงนอน',
      'คะแนนความเสี่ยง',
      'ระดับความเสี่ยง',
      'วันที่ตรวจ',
      'ข้อเสนอแนะ',
    ];

    const rows = sortedRecords.map((r) => [
      `"${r.id}"`,
      `"${r.name}"`,
      r.age,
      `"${r.gender}"`,
      `"${r.province}"`,
      `"${r.district}"`,
      r.heightCm,
      r.weightKg,
      r.bmi,
      `"${r.bmiCategory}"`,
      r.systolicBp,
      r.diastolicBp,
      `"${r.bpCategory}"`,
      r.fastingBloodSugar,
      `"${r.sugarCategory}"`,
      `"${r.smoking}"`,
      `"${r.alcohol}"`,
      `"${r.exercise}"`,
      `"${r.dietHabit}"`,
      r.sleepHours,
      r.riskScore,
      `"${r.riskLevel}"`,
      `"${r.checkupDate}"`,
      `"${r.triageNote || ''}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Health_Risk_Screening_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Header of Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600" />
            ข้อมูลเชิงลึกรายบุคคล (Individual Health Triage & Screening Detail)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            ประเด็นเชิงลึก: การคัดแยกกลุ่มผู้มีความเสี่ยงสูงเพื่อจัดทำแผนการส่งต่อและนัดหมายคลินิก NCDs พร้อมระบบไฮไลต์สีตามระดับความรุนแรง (Conditional Formatting)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            ส่งออกข้อมูล CSV ({sortedRecords.length})
          </button>
        </div>
      </div>

      {/* Legend for Conditional Formatting */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-100/80 rounded-lg text-[11px] text-slate-700 border border-slate-200">
        <span className="font-semibold text-slate-800">เกณฑ์สีเตือนความเสี่ยง (Conditional Colors):</span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-medium">
          🔴 เสี่ยงสูงมาก (คะแนน ≥60)
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-orange-100 text-orange-800 font-medium">
          🟠 เสี่ยงสูง (คะแนน 42-59)
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">
          🟡 เสี่ยงปานกลาง (คะแนน 24-41)
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
          🟢 ปกติ (&lt;24)
        </span>
        <span className="text-slate-400">|</span>
        <span className="text-slate-600">
          * ตัวเลขสีแดงแสดงค่าผิดปกติ: BMI ≥ 25 (อ้วน), SBP ≥ 140 หรือ DBP ≥ 90 (ความดันสูง), FBG ≥ 100 (น้ำตาลสูง)
        </span>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold select-none">
                <th
                  onClick={() => handleSort('id')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    รหัส ID <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    ชื่อ-นามสกุล <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('age')}
                  className="py-3 px-2 cursor-pointer hover:bg-slate-100 transition text-center whitespace-nowrap"
                >
                  <div className="flex items-center justify-center gap-1">
                    อายุ <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-2 text-center whitespace-nowrap">เพศ</th>
                <th className="py-3 px-3 whitespace-nowrap">พื้นที่/จังหวัด</th>
                <th
                  onClick={() => handleSort('bmi')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition text-center whitespace-nowrap"
                >
                  <div className="flex items-center justify-center gap-1">
                    BMI (kg/m²) <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('systolicBp')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition text-center whitespace-nowrap"
                >
                  <div className="flex items-center justify-center gap-1">
                    ความดัน (mmHg) <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('fastingBloodSugar')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition text-center whitespace-nowrap"
                >
                  <div className="flex items-center justify-center gap-1">
                    น้ำตาล FBG (mg/dL) <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-2 text-center whitespace-nowrap">พฤติกรรมเสี่ยง</th>
                <th
                  onClick={() => handleSort('riskScore')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition text-center whitespace-nowrap"
                >
                  <div className="flex items-center justify-center gap-1">
                    คะแนนเสี่ยง <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('riskLevel')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition text-center whitespace-nowrap"
                >
                  <div className="flex items-center justify-center gap-1">
                    ระดับความเสี่ยง <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center whitespace-nowrap">การจัดการ/ดูรายละเอียด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-slate-400">
                    ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหาหรือตัวกรอง
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r) => {
                  const isHighBmi = r.bmi >= 25;
                  const isHighBp = r.systolicBp >= 140 || r.diastolicBp >= 90;
                  const isHighSugar = r.fastingBloodSugar >= 100;
                  const isDiabetes = r.fastingBloodSugar >= 126;

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-teal-50/40 transition cursor-pointer ${
                        r.riskLevel === 'เสี่ยงสูงมาก' ? 'bg-rose-50/25' : ''
                      }`}
                      onClick={() => setSelectedRecord(r)}
                    >
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-600">{r.id}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {r.name}
                        {r.familyHistoryNcd && (
                          <span
                            className="ml-1.5 text-[10px] text-purple-600 bg-purple-50 px-1 py-0.2 rounded border border-purple-200"
                            title="มีประวัติโรคเรื้อรังในครอบครัว"
                          >
                            กรรมพันธุ์
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-center text-slate-600">{r.age}</td>
                      <td className="py-2.5 px-2 text-center text-slate-600">
                        <span
                          className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-medium ${
                            r.gender === 'ชาย' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'
                          }`}
                        >
                          {r.gender}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        <span className="font-medium text-slate-700">{r.province}</span>
                        <span className="text-[10px] text-slate-400 block">{r.district}</span>
                      </td>

                      {/* BMI with Conditional Color */}
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`font-semibold font-mono ${
                            isHighBmi ? 'text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200' : 'text-slate-700'
                          }`}
                        >
                          {r.bmi}
                        </span>
                        <span className="block text-[10px] text-slate-400">{r.bmiCategory}</span>
                      </td>

                      {/* BP with Conditional Color */}
                      <td className="py-2.5 px-3 text-center font-mono">
                        <span
                          className={`font-semibold ${
                            isHighBp ? 'text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200' : 'text-slate-700'
                          }`}
                        >
                          {r.systolicBp}/{r.diastolicBp}
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          {r.bpCategory.includes('ระดับ') ? r.bpCategory : r.bpCategory}
                        </span>
                      </td>

                      {/* Blood Sugar with Conditional Color */}
                      <td className="py-2.5 px-3 text-center font-mono">
                        <span
                          className={`font-semibold ${
                            isDiabetes
                              ? 'text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 font-bold'
                              : isHighSugar
                              ? 'text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200'
                              : 'text-slate-700'
                          }`}
                        >
                          {r.fastingBloodSugar}
                        </span>
                        <span className="block text-[10px] text-slate-400">{r.sugarCategory}</span>
                      </td>

                      {/* Behavior Icons/Badges */}
                      <td className="py-2.5 px-2 text-center">
                        <div className="flex items-center justify-center gap-1 text-[10px]">
                          {r.smoking === 'สูบเป็นประจำ' && (
                            <span className="bg-rose-100 text-rose-700 px-1 rounded font-medium" title="สูบบุหรี่ประจำ">
                              สูบ
                            </span>
                          )}
                          {r.alcohol === 'ดื่มเป็นประจำ' && (
                            <span className="bg-amber-100 text-amber-700 px-1 rounded font-medium" title="ดื่มสุราประจำ">
                              ดื่ม
                            </span>
                          )}
                          {r.exercise === 'ไม่ออกกำลังกาย' && (
                            <span className="bg-slate-200 text-slate-700 px-1 rounded font-medium" title="ไม่ออกกำลังกาย">
                              ไม่ออก
                            </span>
                          )}
                          {r.smoking === 'ไม่สูบ' && r.alcohol === 'ไม่ดื่ม' && r.exercise !== 'ไม่ออกกำลังกาย' && (
                            <span className="bg-emerald-50 text-emerald-600 px-1 rounded" title="พฤติกรรมดี">
                              สุขภาพดี
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Risk Score */}
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                        {r.riskScore}
                        <span className="text-[10px] text-slate-400 font-normal">/100</span>
                      </td>

                      {/* Risk Level Badge */}
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${
                            r.riskLevel === 'เสี่ยงสูงมาก'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : r.riskLevel === 'เสี่ยงสูง'
                              ? 'bg-orange-100 text-orange-800 border border-orange-300'
                              : r.riskLevel === 'เสี่ยงปานกลาง'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {r.riskLevel}
                        </span>
                      </td>

                      {/* Action View Detail */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRecord(r);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 transition font-medium text-[11px]"
                        >
                          <Eye className="w-3 h-3" />
                          ดูแผนดูแล
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>แสดงแถวต่อหน้า:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="px-2 py-1 rounded border border-slate-200 bg-white focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>
              (หน้า {page} จาก {totalPages} | ข้อมูลทั้งหมด {sortedRecords.length} แถว)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium text-slate-800">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Patient Detail & Triage Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {selectedRecord.id}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">{selectedRecord.name}</h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  อายุ {selectedRecord.age} ปี | เพศ {selectedRecord.gender} | พื้นที่ {selectedRecord.district}, จังหวัด{selectedRecord.province}
                </p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Triage Alert Banner */}
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  selectedRecord.riskLevel === 'เสี่ยงสูงมาก'
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : selectedRecord.riskLevel === 'เสี่ยงสูง'
                    ? 'bg-orange-50 border-orange-200 text-orange-800'
                    : selectedRecord.riskLevel === 'เสี่ยงปานกลาง'
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}
              >
                {selectedRecord.riskLevel.includes('สูง') ? (
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">
                      ระดับความเสี่ยง: {selectedRecord.riskLevel} (คะแนน {selectedRecord.riskScore}/100)
                    </span>
                  </div>
                  <p className="text-xs opacity-90">{selectedRecord.triageNote}</p>
                </div>
              </div>

              {/* Clinical Metrics Grid */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                  ข้อมูลตัวชี้วัดทางคลินิก (Clinical Measurements)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 block mb-1">ดัชนีมวลกาย (BMI)</span>
                    <span className="text-base font-bold text-slate-800 font-mono">{selectedRecord.bmi}</span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">{selectedRecord.bmiCategory}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 block mb-1">ความดันโลหิต (BP)</span>
                    <span className="text-base font-bold text-slate-800 font-mono">
                      {selectedRecord.systolicBp}/{selectedRecord.diastolicBp}
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">mmHg</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 block mb-1">น้ำตาลในเลือด (FBG)</span>
                    <span className="text-base font-bold text-slate-800 font-mono">{selectedRecord.fastingBloodSugar}</span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">{selectedRecord.sugarCategory}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 block mb-1">ส่วนสูง / น้ำหนัก</span>
                    <span className="text-base font-bold text-slate-800 font-mono">
                      {selectedRecord.weightKg} kg / {selectedRecord.heightCm} cm
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">ส่วนต่างมาตรฐาน</span>
                  </div>
                </div>
              </div>

              {/* Behavior & Lifestyle Checklist */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                  พฤติกรรมและการดำเนินชีวิต (Health Behaviors)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg border border-slate-200 flex justify-between items-center">
                    <span className="text-slate-600">การสูบบุหรี่:</span>
                    <span className="font-semibold text-slate-800">{selectedRecord.smoking}</span>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-200 flex justify-between items-center">
                    <span className="text-slate-600">การดื่มสุรา/แอลกอฮอล์:</span>
                    <span className="font-semibold text-slate-800">{selectedRecord.alcohol}</span>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-200 flex justify-between items-center">
                    <span className="text-slate-600">การออกกำลังกาย:</span>
                    <span className="font-semibold text-slate-800">{selectedRecord.exercise}</span>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-200 flex justify-between items-center">
                    <span className="text-slate-600">การบริโภคอาหาร:</span>
                    <span className="font-semibold text-slate-800">{selectedRecord.dietHabit}</span>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-200 flex justify-between items-center">
                    <span className="text-slate-600">การนอนหลับ:</span>
                    <span className="font-semibold text-slate-800">{selectedRecord.sleepHours} ชั่วโมง/วัน</span>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-200 flex justify-between items-center">
                    <span className="text-slate-600">ประวัติโรคเรื้อรังครอบครัว:</span>
                    <span className={`font-semibold ${selectedRecord.familyHistoryNcd ? 'text-rose-600' : 'text-slate-800'}`}>
                      {selectedRecord.familyHistoryNcd ? 'มีประวัติโรคเรื้อรัง' : 'ไม่มีประวัติ'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Medical Action Plan */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                <span className="font-bold text-slate-800 block">แนวทางการดูแลและแผนติดตามผล (Care Pathway):</span>
                <ul className="list-disc list-inside text-slate-600 space-y-1">
                  <li>
                    {selectedRecord.fastingBloodSugar >= 126
                      ? 'ส่งตรวจ HbA1c เพื่อยืนยันการวินิจฉัยโรคเบาหวาน และนัดแพทย์ตรวจจอประสาทตาและไต'
                      : selectedRecord.fastingBloodSugar >= 100
                      ? 'เข้ากลุ่มโปรแกรมปรับพฤติกรรมลดน้ำตาลในเลือด นัดติดตาม FBS ใน 3 เดือน'
                      : 'ค่าน้ำตาลอยู่ในเกณฑ์ปกติ คงพฤติกรรมการบริโภคที่ดี'}
                  </li>
                  <li>
                    {selectedRecord.systolicBp >= 140
                      ? 'ส่งวัดความดันโลหิตซ้ำ 2 ครั้ง ติดตาม Home BP monitoring และปรึกษาแพทย์เรื่องยาลดความดัน'
                      : 'ความดันโลหิตปกติ แนะนำลดอาหารเค็มและโซเดียม'}
                  </li>
                  <li>
                    {selectedRecord.bmi >= 25
                      ? 'เข้าคลินิกโภชนาการและออกกำลังกายเป้าหมายลดน้ำหนัก 5-7% ภายใน 6 เดือน'
                      : 'ดัชนีมวลกายปกติ ควบคุมน้ำหนักให้คงที่'}
                  </li>
                  <li>วันที่บันทึกคัดกรอง: {selectedRecord.checkupDate}</li>
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-end">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
