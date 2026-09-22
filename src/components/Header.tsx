import React from 'react';
import { Activity, RefreshCw, FileSpreadsheet, User, Clock, ShieldAlert, Wifi, WifiOff } from 'lucide-react';

interface HeaderProps {
  sheetId: string;
  sourceType: 'google-sheets-live' | 'fallback-sample' | 'custom-upload';
  lastUpdated: string;
  creatorName: string;
  onRefresh: () => void;
  onOpenSheetModal: () => void;
  isSyncing: boolean;
  totalRecords: number;
  autoRefreshInterval: number; // 0 = off, 15 = 15s, 30 = 30s, 60 = 60s
  onChangeAutoRefresh: (seconds: number) => void;
}

export const Header: React.FC<HeaderProps> = ({
  sheetId,
  sourceType,
  lastUpdated,
  creatorName,
  onRefresh,
  onOpenSheetModal,
  isSyncing,
  totalRecords,
  autoRefreshInterval,
  onChangeAutoRefresh,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Brand & Title */}
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm shrink-0 mt-0.5">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  Health Risk <span className="font-semibold text-slate-600 text-lg sm:text-xl">Dashboard</span>
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200">
                  <ShieldAlert className="w-3 h-3 text-teal-600" />
                  ระบบประเมินและคัดกรองความเสี่ยงสุขภาพ
                </span>
                {sourceType === 'google-sheets-live' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <Wifi className="w-3 h-3" />
                    เชื่อมโยงสดเรียลไทม์ ({totalRecords} รายการ)
                  </span>
                ) : sourceType === 'custom-upload' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-300">
                    <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                    ข้อมูลนำเข้า ({totalRecords} รายการ)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-300">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <WifiOff className="w-3 h-3" />
                    ชุดข้อมูลมาตรฐาน ({totalRecords} รายการ)
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 line-clamp-1">
                การวิเคราะห์ปัจจัยเสี่ยงด้านสุขภาพ (BMI, ความดันโลหิต, น้ำตาลในเลือด) และพฤติกรรมเสี่ยงเพื่อการดูแลเชิงรุก
              </p>
            </div>
          </div>

          {/* Metadata & Controls */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-xs text-slate-600">
            {/* Creator info */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50/80 border border-teal-200 text-teal-950 shadow-2xs">
              <User className="w-3.5 h-3.5 text-teal-600" />
              <span className="font-medium text-slate-700">ผู้จัดทำ:</span>
              <span className="font-bold text-slate-900" title={creatorName}>
                {creatorName}
              </span>
            </div>

            {/* Last updated */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-mono text-[11px]">{lastUpdated}</span>
            </div>

            {/* Auto-Refresh Select */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
              <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">ออโต้:</span>
              <select
                value={autoRefreshInterval}
                onChange={(e) => onChangeAutoRefresh(Number(e.target.value))}
                className="text-[11px] font-medium text-slate-700 bg-transparent border-0 focus:ring-0 cursor-pointer py-0.5 pl-0 pr-1.5"
                title="ตั้งเวลาให้อัปเดตข้อมูลจาก Google Sheet แบบอัตโนมัติ"
              >
                <option value={0}>ปิดออโต้</option>
                <option value={15}>ทุก 15 วิ</option>
                <option value={30}>ทุก 30 วิ</option>
                <option value={60}>ทุก 1 นาที</option>
              </select>
            </div>

            {/* Sheet Link Badge & Settings */}
            <button
              onClick={onOpenSheetModal}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border font-medium transition-all ${
                sourceType === 'google-sheets-live'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : sourceType === 'custom-upload'
                  ? 'bg-sky-50 text-sky-800 border-sky-300 hover:bg-sky-100'
                  : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
              }`}
              title="คลิกเพื่อจัดการการเชื่อมต่อ Google Sheet หรือดูสถานะ"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="font-mono text-[11px] hidden md:inline">
                {sheetId.length > 14 ? `${sheetId.slice(0, 6)}...${sheetId.slice(-4)}` : sheetId}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/80 font-bold">
                {sourceType === 'google-sheets-live' ? 'Live Sheet' : sourceType === 'custom-upload' ? 'CSV File' : 'ตั้งค่าชีต'}
              </span>
            </button>

            {/* Real-time Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-700 transition shadow-xs disabled:opacity-60 cursor-pointer active:scale-98"
              title="ดึงข้อมูลล่าสุดจาก Google Sheet แบบ Real-time ทันที"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="font-semibold">{isSyncing ? 'กำลังดึงสด...' : 'รีเฟรชเรียลไทม์'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
