import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  ShieldAlert,
  TrendingUp,
  Microscope,
  Table as TableIcon,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { HealthRecord, FilterState } from './types';
import { initialHealthRecords } from './data/initialData';
import { fetchGoogleSheetData, DEFAULT_SHEET_ID } from './services/googleSheets';
import { computeSummaryStats } from './utils/stats';

import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { KpiCards } from './components/KpiCards';
import { RiskAnalysisView } from './components/RiskAnalysisView';
import { TrendAndBehaviorView } from './components/TrendAndBehaviorView';
import { CorrelationDeepDiveView } from './components/CorrelationDeepDiveView';
import { DataTableDetailView } from './components/DataTableDetailView';
import { SheetConnectionModal } from './components/SheetConnectionModal';

type NavTab = 'overview' | 'risk' | 'trends' | 'correlation' | 'table';

export default function App() {
  const [allRecords, setAllRecords] = useState<HealthRecord[]>(initialHealthRecords);
  const [sheetId, setSheetId] = useState<string>(DEFAULT_SHEET_ID);
  const [sourceType, setSourceType] = useState<'google-sheets-live' | 'fallback-sample' | 'custom-upload'>('fallback-sample');
  const [syncMessage, setSyncMessage] = useState<string>('กำลังเชื่อมต่อข้อมูล Google Sheet...');
  const [errorDetail, setErrorDetail] = useState<string | undefined>();
  const [lastUpdated, setLastUpdated] = useState<string>('22 ก.ย. 2026, 10:30 น.');
  const [creatorName, setCreatorName] = useState<string>('นายคณพศ คงเสมา');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(0);
  const [toastNotification, setToastNotification] = useState<{
    show: boolean;
    type: 'success' | 'info' | 'error';
    text: string;
  } | null>(null);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [viewMode, setViewMode] = useState<'tabbed' | 'all'>('tabbed');

  // Multi-dimensional filters
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    gender: 'all',
    ageGroup: 'all',
    riskLevel: 'all',
    province: 'all',
    clinicalFilter: 'all',
    behaviorFilter: 'all',
  });

  // Fetch from Google Sheet on mount or when sheetId changes
  const loadSheetData = async (targetId: string = sheetId) => {
    setIsSyncing(true);
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })}, ${now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} น.`;

    try {
      const result = await fetchGoogleSheetData(targetId);
      setLastUpdated(result.timestamp || formattedDate);

      if (result.success && result.records.length > 0) {
        setAllRecords(result.records);
        setSourceType('google-sheets-live');
        setSyncMessage(result.message);
        setErrorDetail(undefined);
        setToastNotification({
          show: true,
          type: 'success',
          text: `ดึงข้อมูลเรียลไทม์จาก Google Sheet สำเร็จ (${result.records.length} แถว)`,
        });
      } else {
        // Private or restricted sheet -> Use structured sample records matching exact criteria
        setSourceType('fallback-sample');
        setSyncMessage(result.message);
        setErrorDetail(result.errorDetail);
        if (allRecords.length === 0) {
          setAllRecords(initialHealthRecords);
        }
        setToastNotification({
          show: true,
          type: 'info',
          text: 'ชีตถูกล็อกสิทธิ์ กรุณาเปิด "ทุกคนที่มีลิงก์มีสิทธิ์ดู" ใน Google Sheet เพื่อซิงค์สด',
        });
      }
    } catch (err: any) {
      setSourceType('fallback-sample');
      setSyncMessage('ไม่สามารถเข้าถึงแผ่นงานแบบสาธารณะได้ ระบบโหลดชุดข้อมูลตัวอย่างมาตรฐาน');
      setErrorDetail(err.message);
      setToastNotification({
        show: true,
        type: 'error',
        text: 'เกิดข้อผิดพลาดในการเชื่อมต่อ Google Sheet',
      });
    } finally {
      setIsSyncing(false);
      setTimeout(() => {
        setToastNotification(null);
      }, 4500);
    }
  };

  // Initial load
  useEffect(() => {
    loadSheetData(sheetId);
  }, [sheetId]);

  // Auto-refresh timer (real-time interval)
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    const timer = setInterval(() => {
      loadSheetData(sheetId);
    }, autoRefreshInterval * 1000);
    return () => clearInterval(timer);
  }, [autoRefreshInterval, sheetId]);

  // Unique list of provinces for filter
  const provinces = useMemo(() => {
    const set = new Set<string>();
    allRecords.forEach((r) => {
      if (r.province) set.add(r.province);
    });
    return Array.from(set).sort();
  }, [allRecords]);

  // Filter records
  const filteredRecords = useMemo(() => {
    return allRecords.filter((r) => {
      // 1. Search Query
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase().trim();
        const matchName = r.name.toLowerCase().includes(q);
        const matchId = r.id.toLowerCase().includes(q);
        const matchProv = r.province.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchProv) return false;
      }

      // 2. Gender
      if (filters.gender !== 'all' && r.gender !== filters.gender) {
        return false;
      }

      // 3. Age Group
      if (filters.ageGroup !== 'all') {
        if (filters.ageGroup === '20-34' && (r.age < 20 || r.age > 34)) return false;
        if (filters.ageGroup === '35-49' && (r.age < 35 || r.age > 49)) return false;
        if (filters.ageGroup === '50-59' && (r.age < 50 || r.age > 59)) return false;
        if (filters.ageGroup === '60+' && r.age < 60) return false;
      }

      // 4. Risk Level
      if (filters.riskLevel !== 'all' && r.riskLevel !== filters.riskLevel) {
        return false;
      }

      // 5. Province
      if (filters.province !== 'all' && r.province !== filters.province) {
        return false;
      }

      // 6. Clinical Filter
      if (filters.clinicalFilter !== 'all') {
        if (filters.clinicalFilter === 'high-sugar' && r.fastingBloodSugar < 100) return false;
        if (filters.clinicalFilter === 'diabetes' && r.fastingBloodSugar < 126) return false;
        if (filters.clinicalFilter === 'high-bp' && r.systolicBp < 140 && r.diastolicBp < 90) return false;
        if (filters.clinicalFilter === 'obese' && r.bmi < 25) return false;
        if (filters.clinicalFilter === 'family-ncd' && !r.familyHistoryNcd) return false;
      }

      // 7. Behavior Filter
      if (filters.behaviorFilter !== 'all') {
        if (filters.behaviorFilter === 'smoker' && r.smoking !== 'สูบเป็นประจำ') return false;
        if (filters.behaviorFilter === 'alcohol' && r.alcohol !== 'ดื่มเป็นประจำ') return false;
        if (filters.behaviorFilter === 'no-exercise' && r.exercise !== 'ไม่ออกกำลังกาย') return false;
        if (filters.behaviorFilter === 'unhealthy-diet' && r.dietHabit !== 'กินหวานมันเค็มประจำ') return false;
        if (filters.behaviorFilter === 'sleep-deprived' && r.sleepHours >= 6) return false;
      }

      return true;
    });
  }, [allRecords, filters]);

  // Compute KPI summary stats
  const stats = useMemo(() => {
    return computeSummaryStats(filteredRecords);
  }, [filteredRecords]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      gender: 'all',
      ageGroup: 'all',
      riskLevel: 'all',
      province: 'all',
      clinicalFilter: 'all',
      behaviorFilter: 'all',
    });
  };

  const handleCustomRecordsLoaded = (records: HealthRecord[], filename: string) => {
    setAllRecords(records);
    setSourceType('custom-upload');
    setSyncMessage(`นำเข้าข้อมูลจากไฟล์ CSV: ${filename} สำเร็จ (${records.length} แถว)`);
    setErrorDetail(undefined);
  };

  const navItems: Array<{ id: NavTab; label: string; icon: React.ReactNode; badge?: string }> = [
    {
      id: 'overview',
      label: '1. ภาพรวมและตัวชี้วัด (Overview)',
      icon: <LayoutDashboard className="w-4 h-4" />,
      badge: `${filteredRecords.length} คน`,
    },
    {
      id: 'risk',
      label: '2. การวิเคราะห์ความเสี่ยง (Health Risk)',
      icon: <ShieldAlert className="w-4 h-4" />,
      badge: '4+ Fields',
    },
    {
      id: 'trends',
      label: '3. แนวโน้มและพฤติกรรม (Trends & Behaviors)',
      icon: <TrendingUp className="w-4 h-4" />,
      badge: '6 Fields',
    },
    {
      id: 'correlation',
      label: '4. ความสัมพันธ์เชิงลึก (Deep Dive)',
      icon: <Microscope className="w-4 h-4" />,
      badge: '5 ประเด็น',
    },
    {
      id: 'table',
      label: '5. ข้อมูลรายบุคคลและคัดกรอง (Data Table)',
      icon: <TableIcon className="w-4 h-4" />,
      badge: `${stats.highRiskCount} เคสเสี่ยง`,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-['Prompt',sans-serif]">
      {/* 1. ส่วนหัวและระบบควบคุม Header */}
      <Header
        sheetId={sheetId}
        sourceType={sourceType}
        lastUpdated={lastUpdated}
        creatorName={creatorName}
        onRefresh={() => loadSheetData(sheetId)}
        onOpenSheetModal={() => setIsModalOpen(true)}
        isSyncing={isSyncing}
        totalRecords={allRecords.length}
        autoRefreshInterval={autoRefreshInterval}
        onChangeAutoRefresh={setAutoRefreshInterval}
      />

      {/* Floating Toast Notification */}
      {toastNotification && (
        <div className="fixed bottom-5 right-5 z-50 transition-all duration-300 transform translate-y-0">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2.5 backdrop-blur-md ${
              toastNotification.type === 'success'
                ? 'bg-emerald-600/95 text-white border-emerald-500'
                : toastNotification.type === 'error'
                ? 'bg-rose-600/95 text-white border-rose-500'
                : 'bg-slate-800/95 text-white border-slate-700'
            }`}
          >
            {toastNotification.type === 'success' ? (
              <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
            ) : null}
            <span>{toastNotification.text}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Notice Banner for Sheet Access */}
        {sourceType === 'fallback-sample' ? (
          <div className="mb-5 p-4 bg-amber-50/95 border border-amber-300 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3.5 text-xs text-amber-950 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-200/80 text-amber-900 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                !
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-slate-900 text-xs sm:text-sm">
                    ต้องการให้ข้อมูลอัปเดตแบบเรียลไทม์ตาม Google Sheet ทันที?
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-200/80 text-amber-900">
                    Google Sheet ID: {sheetId.slice(0, 10)}...{sheetId.slice(-4)}
                  </span>
                </div>
                <p className="text-amber-800 text-[11px] leading-relaxed">
                  เนื่องจากแผ่นงานตั้งค่าความเป็นส่วนตัวไว้ หากต้องการให้อัปเดตสด:
                  <b> 1. กดเปิดชีต </b> &gt; <b> 2. กด 'แชร์' (Share) เลือก 'ทุกคนที่มีลิงก์' </b> &gt; <b> 3. กด 'รีเฟรชเรียลไทม์' </b>
                  (หรือกดปุ่ม <b>"วางข้อมูล"</b> เพื่อคัดลอกแถวมาวางได้ทันที)
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <a
                href={`https://docs.google.com/spreadsheets/d/${sheetId}/edit`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 font-semibold text-xs transition inline-flex items-center gap-1 shadow-2xs"
              >
                เปิดแผ่นงาน ↗
              </a>
              <button
                onClick={() => loadSheetData(sheetId)}
                disabled={isSyncing}
                className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition shadow-xs disabled:opacity-60"
              >
                {isSyncing ? 'กำลังดึงสด...' : 'รีเฟรชเรียลไทม์'}
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition shadow-xs"
              >
                ตั้งค่า / วางข้อมูล
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-5 px-4 py-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-900 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <span className="font-semibold">
                เชื่อมโยงข้อมูลสดแบบ Real-Time จาก Google Sheet สำเร็จ ({allRecords.length} แถว)
              </span>
              <span className="text-emerald-700 text-[11px] hidden sm:inline">
                • เมื่อแก้ไขข้อมูลในชีตแล้วกด "รีเฟรชเรียลไทม์" ข้อมูลจะอัปเดตตามทันที
              </span>
            </div>
            <button
              onClick={() => loadSheetData(sheetId)}
              disabled={isSyncing}
              className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-200/60 hover:bg-emerald-200 px-2.5 py-1 rounded-lg shrink-0 transition"
            >
              {isSyncing ? 'กำลังรีเฟรช...' : 'รีเฟรชข้อมูล'}
            </button>
          </div>
        )}

        {/* Filters Bar (At least 4-5 filters) */}
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          provinces={provinces}
          totalFiltered={filteredRecords.length}
          totalAll={allRecords.length}
        />

        {/* 5. ระบบนำทาง (Navigation Controls) */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {navItems.map((item) => {
              const isActive = activeTab === item.id && viewMode === 'tabbed';
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setViewMode('tabbed');
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-teal-600 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* View Mode Toggle (Tabbed vs All-in-one scroll) */}
          <div className="flex items-center gap-1 shrink-0 self-end md:self-auto border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
            <button
              onClick={() => setViewMode(viewMode === 'tabbed' ? 'all' : 'tabbed')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                viewMode === 'all'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title="สลับระหว่างการเปิดทีละแท็บ หรือแสดงทุกส่วนพร้อมกันในหน้าเดียว"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{viewMode === 'all' ? 'กำลังแสดงทุกหมวดหมู่' : 'แสดงทุกส่วนในหน้าเดียว'}</span>
            </button>
          </div>
        </div>

        {/* 2. การสรุปข้อมูลสำคัญ KPI Cards (Always shown or in Overview) */}
        <KpiCards stats={stats} />

        {/* Content based on Navigation Tab or View Mode */}
        {viewMode === 'all' ? (
          <div className="space-y-10">
            <section id="section-risk">
              <RiskAnalysisView records={filteredRecords} />
            </section>
            <section id="section-trends">
              <TrendAndBehaviorView records={filteredRecords} />
            </section>
            <section id="section-correlation">
              <CorrelationDeepDiveView records={filteredRecords} />
            </section>
            <section id="section-table">
              <DataTableDetailView records={filteredRecords} />
            </section>
          </div>
        ) : (
          <div>
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Highlight Summary Card */}
                <div className="bg-gradient-to-r from-teal-800 to-slate-900 text-white rounded-2xl p-6 shadow-md">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-400/20 text-teal-200 border border-teal-400/30">
                        <Sparkles className="w-3 h-3 text-teal-300" />
                        บทสรุปสำหรับผู้บริหารและบุคลากรสาธารณสุข
                      </span>
                      <h3 className="text-xl font-bold">
                        สถานการณ์ความเสี่ยงสุขภาพกลุ่มเป้าหมาย (Health Risk Executive Summary)
                      </h3>
                      <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                        จากประชากรที่ได้รับการคัดกรองทั้งหมด <span className="font-semibold text-white">{stats.totalCount} คน</span>{' '}
                        พบผู้มีความเสี่ยงระดับสูงถึงวิกฤต <span className="font-semibold text-rose-300">{stats.highRiskCount} คน</span> ({stats.highRiskPercentage}%) โดยมีปัจจัยกระตุ้นสำคัญคือภาวะอ้วน (BMI ≥ 25) ถึง {stats.obesityPercentage}% และภาวะความดันโลหิตสูง {stats.hypertensionPercentage}%
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('table')}
                      className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shrink-0 transition shadow-sm"
                    >
                      ดูรายชื่อกลุ่มเสี่ยงสูง &gt;
                    </button>
                  </div>
                </div>

                {/* Primary Quick Visualizations */}
                <RiskAnalysisView records={filteredRecords} />

                {/* Quick Navigation to other modules */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div
                    onClick={() => setActiveTab('trends')}
                    className="p-4 rounded-xl bg-white border border-slate-200 hover:border-teal-400 cursor-pointer transition shadow-xs group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800 group-hover:text-teal-600 transition">
                        แนวโน้ม & พฤติกรรมสุขภาพ
                      </span>
                      <TrendingUp className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition" />
                    </div>
                    <p className="text-xs text-slate-500">
                      ตรวจดูเส้นแนวโน้ม FBG/SBP และสถิติ 4 พฤติกรรม (บุหรี่, สุรา, กิจกรรมทางกาย, อาหาร)
                    </p>
                  </div>

                  <div
                    onClick={() => setActiveTab('correlation')}
                    className="p-4 rounded-xl bg-white border border-slate-200 hover:border-teal-400 cursor-pointer transition shadow-xs group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800 group-hover:text-teal-600 transition">
                        ความสัมพันธ์เชิงลึก & Scatter Plots
                      </span>
                      <Microscope className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition" />
                    </div>
                    <p className="text-xs text-slate-500">
                      วิเคราะห์ความสัมพันธ์ BMI vs น้ำตาล, BMI vs ความดัน, กลุ่มอายุเสี่ยง, และพื้นที่
                    </p>
                  </div>

                  <div
                    onClick={() => setActiveTab('table')}
                    className="p-4 rounded-xl bg-white border border-slate-200 hover:border-teal-400 cursor-pointer transition shadow-xs group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800 group-hover:text-teal-600 transition">
                        ตารางคัดกรองรายบุคคล & Export
                      </span>
                      <TableIcon className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition" />
                    </div>
                    <p className="text-xs text-slate-500">
                      ตรวจรายบุคคล จัดการคัดแยกสีเตือนภัย (Conditional Colors) และส่งออกไฟล์ CSV
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'risk' && <RiskAnalysisView records={filteredRecords} />}
            {activeTab === 'trends' && <TrendAndBehaviorView records={filteredRecords} />}
            {activeTab === 'correlation' && <CorrelationDeepDiveView records={filteredRecords} />}
            {activeTab === 'table' && <DataTableDetailView records={filteredRecords} />}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-5 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Health Risk Analytics Dashboard</span>
            <span>• ระบบวิเคราะห์และประเมินความเสี่ยงสุขภาพเพื่อการดูแลเชิงรุก</span>
          </div>
          <div className="text-slate-600">
            <span>ผู้จัดทำ: {creatorName}</span>
          </div>
        </div>
      </footer>

      {/* Sheet Connection Modal */}
      <SheetConnectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sheetId={sheetId}
        onUpdateSheetId={(newId) => setSheetId(newId)}
        creatorName={creatorName}
        onUpdateCreatorName={(name) => setCreatorName(name)}
        sourceType={sourceType}
        syncMessage={syncMessage}
        errorDetail={errorDetail}
        onReFetch={() => loadSheetData(sheetId)}
        onCustomRecordsLoaded={handleCustomRecordsLoaded}
        isSyncing={isSyncing}
        totalRecords={allRecords.length}
      />
    </div>
  );
}
