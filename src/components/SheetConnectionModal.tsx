import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  ExternalLink,
  Upload,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  User,
  ShieldCheck,
  ClipboardCheck,
  Globe,
  Code2,
  Copy,
  Check,
} from 'lucide-react';
import { parseCsvToRecords, extractSheetIdAndGid, fetchGoogleSheetData } from '../services/googleSheets';
import { HealthRecord } from '../types';

interface SheetConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheetId: string;
  onUpdateSheetId: (newId: string) => void;
  creatorName: string;
  onUpdateCreatorName: (name: string) => void;
  sourceType: 'google-sheets-live' | 'fallback-sample' | 'custom-upload';
  syncMessage: string;
  errorDetail?: string;
  onReFetch: () => void;
  onCustomRecordsLoaded: (records: HealthRecord[], filename: string) => void;
  isSyncing: boolean;
  totalRecords: number;
}

export const SheetConnectionModal: React.FC<SheetConnectionModalProps> = ({
  isOpen,
  onClose,
  sheetId,
  onUpdateSheetId,
  creatorName,
  onUpdateCreatorName,
  sourceType,
  syncMessage,
  errorDetail,
  onReFetch,
  onCustomRecordsLoaded,
  isSyncing,
  totalRecords,
}) => {
  const [activeTab, setActiveTab] = useState<'sheet' | 'paste' | 'script' | 'upload'>('sheet');
  const [inputSheetId, setInputSheetId] = useState(sheetId);
  const [inputCreator, setInputCreator] = useState(creatorName);
  const [pasteContent, setPasteContent] = useState('');
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    rowCount?: number;
  } | null>(null);

  const [copiedScript, setCopiedScript] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const cleanTarget = inputSheetId.trim() || sheetId;
      const res = await fetchGoogleSheetData(cleanTarget);
      if (res.success && res.records.length > 0) {
        setTestResult({
          success: true,
          message: `เชื่อมต่อสำเร็จ! พบข้อมูลทั้งหมด ${res.records.length} แถว ตรงตาม Google Sheet ล่าสุด`,
          rowCount: res.records.length,
        });
        onUpdateSheetId(cleanTarget);
        onCustomRecordsLoaded(res.records, 'Google Sheet Live');
      } else {
        setTestResult({
          success: false,
          message:
            res.errorDetail ||
            'Google ปฏิเสธการเข้าถึง: แผ่นงานยังถูกตั้งเป็นส่วนตัว กรุณาทำตาม 3 ขั้นตอนในคำแนะนำเพื่อเปิดสิทธิ์',
        });
      }
    } catch (e: any) {
      setTestResult({
        success: false,
        message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + (e.message || 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้'),
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const records = parseCsvToRecords(text);
        if (records.length === 0) {
          setUploadError('ไม่พบแถวข้อมูลที่ถูกต้องในไฟล์ CSV');
          return;
        }
        setUploadError(null);
        onCustomRecordsLoaded(records, file.name);
        onClose();
      } catch (err: any) {
        setUploadError('เกิดข้อผิดพลาดในการอ่านไฟล์ CSV: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handlePasteSubmit = () => {
    if (!pasteContent.trim()) {
      setPasteError('กรุณาวางข้อมูล CSV หรือตารางที่คัดลอกจาก Google Sheet');
      return;
    }
    try {
      const records = parseCsvToRecords(pasteContent);
      if (records.length === 0) {
        setPasteError('ไม่สามารถแยกข้อมูลได้ กรุณาตรวจสอบว่ามีหัวตาราง (Header) และข้อมูลอย่างน้อย 1 แถว');
        return;
      }
      setPasteError(null);
      onCustomRecordsLoaded(records, 'ข้อมูลคัดลอกโดยตรงจากชีต');
      onClose();
    } catch (err: any) {
      setPasteError('เกิดข้อผิดพลาดในการประมวลผลข้อมูล: ' + err.message);
    }
  };

  const handleSaveConfig = () => {
    if (inputCreator.trim()) {
      onUpdateCreatorName(inputCreator.trim());
    }
    const cleanTarget = inputSheetId.trim();
    if (cleanTarget && cleanTarget !== sheetId) {
      onUpdateSheetId(cleanTarget);
    }
    onClose();
  };

  const cleanInfo = extractSheetIdAndGid(inputSheetId || sheetId);
  const sheetUrl = cleanInfo.isPublished
    ? `https://docs.google.com/spreadsheets/d/e/${cleanInfo.sheetId}/pubhtml`
    : cleanInfo.sheetId.startsWith('http')
    ? cleanInfo.sheetId
    : `https://docs.google.com/spreadsheets/d/${cleanInfo.sheetId}/edit`;

  const scriptCode = `function doGet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}`;

  const copyScriptToClipboard = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                ระบบเชื่อมโยงข้อมูล Google Sheet แบบ Real-time
              </h3>
              <p className="text-xs text-slate-500">
                ดึงข้อมูลสดจากแผ่นงาน หรือวางข้อมูลได้โดยตรงทันที
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 bg-white shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('sheet')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'sheet'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            1. Google Sheet ID / URL
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'paste'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            2. คัดลอก-วางตาราง (เร็วสุด)
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'script'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            3. Apps Script (สำหรับโดเมนสถาบัน)
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'upload'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            4. ไฟล์ CSV
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs text-slate-700 overflow-y-auto flex-1">
          {/* Status Alert */}
          <div
            className={`p-3 rounded-xl border flex items-start gap-2.5 ${
              sourceType === 'google-sheets-live'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : sourceType === 'custom-upload'
                ? 'bg-sky-50 border-sky-200 text-sky-900'
                : 'bg-amber-50 border-amber-200 text-amber-950'
            }`}
          >
            {sourceType === 'google-sheets-live' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            )}
            <div className="space-y-1">
              <span className="font-bold block">
                {sourceType === 'google-sheets-live'
                  ? `เชื่อมต่อเรียลไทม์สำเร็จ (${totalRecords} แถว)`
                  : sourceType === 'custom-upload'
                  ? `ใช้งานข้อมูลนำเข้า (${totalRecords} แถว)`
                  : 'กำลังรอการเปิดสิทธิ์การอ่านจาก Google Sheet'}
              </span>
              <p className="opacity-90">{syncMessage}</p>
              {errorDetail && <p className="text-[11px] text-amber-800 mt-0.5">{errorDetail}</p>}
            </div>
          </div>

          {/* Test Connection Live Result Banner */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              {testResult.success ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
              )}
              <div className="space-y-1">
                <span className="font-bold block">
                  {testResult.success ? 'ผลการทดสอบ: เชื่อมต่อสำเร็จ!' : 'ผลการทดสอบ: ยังไม่สามารถเข้าถึงได้'}
                </span>
                <p className="text-[11px] leading-relaxed">{testResult.message}</p>
              </div>
            </div>
          )}

          {activeTab === 'sheet' && (
            <div className="space-y-4">
              {/* Instructions Guide */}
              <div className="p-3.5 bg-teal-50/70 border border-teal-200 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-teal-950 text-xs">
                  <ShieldCheck className="w-4 h-4 text-teal-700" />
                  วิธีเปิดสิทธิ์ Google Sheet ให้ดึงข้อมูลสดได้ Real-time (ทำครั้งเดียว):
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-700 leading-relaxed pl-1">
                  <li>
                    เปิด Google Sheet ของคุณ:{' '}
                    <a
                      href={sheetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-teal-700 underline inline-flex items-center gap-0.5"
                    >
                      กดเปิดแผ่นงานที่นี่ <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                  <li>
                    กดปุ่ม <span className="font-semibold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">แชร์ (Share)</span> ที่มุมขวาบน
                  </li>
                  <li>
                    ในหัวข้อ <span className="font-semibold text-slate-900">"การเข้าถึงทั่วไป (General access)"</span> ให้เปลี่ยนเป็น{' '}
                    <span className="font-bold text-teal-800 bg-teal-100/70 px-1.5 py-0.5 rounded">
                      "ทุกคนที่มีลิงก์ (Anyone with the link)"
                    </span>{' '}
                    และเลือกเป็น <span className="font-semibold text-slate-900">"ผู้มีสิทธิ์อ่าน (Viewer)"</span>
                  </li>
                  <li>
                    กด <span className="font-semibold text-slate-900">เสร็จสิ้น (Done)</span> แล้วกดปุ่ม{' '}
                    <span className="font-bold text-teal-700">"ทดสอบดึงข้อมูลสดทันที"</span> ด้านล่างนี้
                  </li>
                </ol>
              </div>

              {/* Form: Sheet ID or URL */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                  Google Sheet ID หรือลิงก์แผ่นงาน (Full URL):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputSheetId}
                    onChange={(e) => setInputSheetId(e.target.value)}
                    placeholder="ระบุ Sheet ID หรือ URL เต็มของ Google Sheet"
                    className="flex-1 px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  <button
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    {isTesting ? 'กำลังทดสอบ...' : 'ทดสอบดึงข้อมูลสดทันที'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  * รองรับ Sheet ID เช่น <span className="font-mono">1WcSeDUWUBEXjs2ytcI-omatByKRqgajwPHzMU7s1u_M</span> หรือลิงก์เต็ม
                </p>
              </div>

              {/* Form: Creator Name */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-teal-600" />
                  ชื่อผู้จัดทำ (ตามโจทย์ระบุ: นายคณพศ คงเสมา)
                </label>
                <input
                  type="text"
                  value={inputCreator}
                  onChange={(e) => setInputCreator(e.target.value)}
                  placeholder="นายคณพศ คงเสมา"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
          )}

          {activeTab === 'paste' && (
            <div className="space-y-3">
              <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200 text-[11px] text-slate-700 space-y-1">
                <span className="font-bold text-teal-900 block">
                  ⚡ ทางเลือกที่เร็วที่สุดและรับประกันได้ผล 100% (แม้สถาบันจะล็อกสิทธิ์การแชร์):
                </span>
                <p>
                  1. ไปที่ Google Sheet &gt; กด <kbd className="bg-white border px-1.5 py-0.5 rounded shadow-2xs font-mono">Ctrl + A</kbd> (เลือกทั้งหมด) &gt; กด <kbd className="bg-white border px-1.5 py-0.5 rounded shadow-2xs font-mono">Ctrl + C</kbd> (คัดลอก)
                </p>
                <p>2. นำมากดวางในช่องข้อความด้านล่าง แล้วกด "นำเข้าข้อมูลทันที"</p>
              </div>

              <textarea
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                placeholder="คลิกที่นี่แล้วกด Ctrl + V เพื่อวางข้อมูลตารางจาก Google Sheet..."
                rows={7}
                className="w-full p-2.5 text-xs font-mono rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
              />

              {pasteError && <p className="text-xs text-rose-600">{pasteError}</p>}

              <button
                onClick={handlePasteSubmit}
                className="w-full py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ClipboardCheck className="w-4 h-4" />
                นำเข้าข้อมูลที่วางทันที (อัปเดต Dashboard ทันที)
              </button>
            </div>
          )}

          {activeTab === 'script' && (
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-950 space-y-1.5">
                <span className="font-bold block">
                  🔧 วิธีเชื่อมต่อแบบ Real-time แม้บัญชีสถาบัน (@kmpht.ac.th) จะห้ามแชร์ภายนอก:
                </span>
                <p>1. ใน Google Sheet ให้คลิกเมนู <b>ส่วนขยาย (Extensions) &gt; Apps Script</b></p>
                <p>2. ลบโค้ดเดิม แล้ววางโค้ดสคริปต์ด้านล่างนี้:</p>
              </div>

              <div className="relative">
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] overflow-x-auto">
                  {scriptCode}
                </pre>
                <button
                  onClick={copyScriptToClipboard}
                  className="absolute top-2 right-2 px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-semibold flex items-center gap-1 transition"
                >
                  {copiedScript ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedScript ? 'คัดลอกแล้ว' : 'คัดลอกโค้ด'}
                </button>
              </div>

              <div className="text-[11px] text-slate-600 space-y-1">
                <p>3. กดปุ่มสีน้ำเงิน <b>"การทำให้ใช้งานได้" (Deploy) &gt; "การทำให้ใช้งานได้ใหม่" (New deployment)</b></p>
                <p>4. เลือกประเภทเป็น <b>"เว็บแอป" (Web app)</b> &gt; ตรง "ผู้ที่มีสิทธิ์เข้าถึง" เลือก <b>"ทุกคน" (Anyone)</b> แล้วกด Deploy</p>
                <p>5. คัดลอก <b>URL เว็บแอป</b> ที่ได้ มาใส่ในช่อง Google Sheet URL ในแท็บที่ 1 ได้ทันที!</p>
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-3">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                เลือกไฟล์ CSV จากเครื่องคอมพิวเตอร์ของคุณ:
              </label>
              <div className="border-2 border-dashed border-slate-200 hover:border-teal-400 rounded-xl p-6 text-center cursor-pointer transition bg-slate-50 hover:bg-teal-50/20 relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <span className="font-semibold text-slate-700 block text-xs">
                  คลิกเพื่อเลือกไฟล์ CSV หรือลากไฟล์มาวาง
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">
                  (Export จาก Google Sheet: ไฟล์ &gt; ดาวน์โหลด &gt; ค่าที่คั่นด้วยจุลภาค .csv)
                </span>
              </div>
              {uploadError && <p className="text-xs text-rose-600 mt-1.5">{uploadError}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
          <button
            onClick={handleTestConnection}
            disabled={isTesting || isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-300 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold disabled:opacity-50 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting || isSyncing ? 'animate-spin' : ''}`} />
            {isTesting || isSyncing ? 'กำลังทดสอบดึงสด...' : 'ทดสอบดึงข้อมูลสดทันที'}
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-100 transition cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
            <button
              onClick={handleSaveConfig}
              className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              บันทึกและปิด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
