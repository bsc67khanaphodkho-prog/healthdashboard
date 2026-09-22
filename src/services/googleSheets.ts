import Papa from 'papaparse';
import { HealthRecord, Gender, SmokingStatus, AlcoholStatus, ExerciseFrequency, DietHabit, RiskLevel } from '../types';
import { calculateBmi, getBmiCategory, getBpCategory, getSugarCategory, calculateRiskScore } from '../data/initialData';

export const DEFAULT_SHEET_ID = '1WcSeDUWUBEXjs2ytcI-omatByKRqgajwPHzMU7s1u_M';

export interface SheetFetchResult {
  success: boolean;
  records: HealthRecord[];
  source: 'google-sheets-live' | 'fallback-sample' | 'custom-upload';
  message: string;
  errorDetail?: string;
  rowCount: number;
  timestamp: string;
}

/**
 * Parses a Sheet URL or ID and extracts sheetId and optional gid
 */
export function extractSheetIdAndGid(input: string): {
  sheetId: string;
  gid?: string;
  isPublished: boolean;
  isAppsScript?: boolean;
} {
  const trimmed = input.trim();

  // Google Apps Script Web App URL
  if (trimmed.startsWith('https://script.google.com/macros/s/')) {
    return { sheetId: trimmed, isPublished: true, isAppsScript: true };
  }

  // Published to web link (/d/e/2PACX-.../pub...)
  if (trimmed.includes('/d/e/')) {
    const match = trimmed.match(/\/d\/e\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      const gidMatch = trimmed.match(/[?&]gid=([0-9]+)/);
      return { sheetId: match[1], gid: gidMatch ? gidMatch[1] : undefined, isPublished: true, isAppsScript: false };
    }
  }

  // Standard edit / export / gviz URL (/d/<sheetId>/...)
  if (trimmed.includes('/d/')) {
    const match = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      const gidMatch = trimmed.match(/[?#&]gid=([0-9]+)/);
      return { sheetId: match[1], gid: gidMatch ? gidMatch[1] : undefined, isPublished: false, isAppsScript: false };
    }
  }

  // Raw sheet ID
  return { sheetId: trimmed, isPublished: trimmed.startsWith('2PACX-'), isAppsScript: false };
}

/**
 * Fetches Google Sheet data using multiple prioritized real-time endpoints with cache-busting
 */
export async function fetchGoogleSheetData(targetInput: string = DEFAULT_SHEET_ID): Promise<SheetFetchResult> {
  const { sheetId, gid, isPublished, isAppsScript } = extractSheetIdAndGid(targetInput);
  const now = new Date();
  const timeStr = `${now.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}, ${now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} น.`;
  const ts = Date.now();

  const gidParam = gid ? `&gid=${gid}` : '';

  // Candidate URLs with cache-busting timestamps
  const urlsToTry: { url: string; type: 'csv' | 'json' | 'appsscript'; name: string }[] = [];

  if (isAppsScript) {
    urlsToTry.push({
      url: `${sheetId}${sheetId.includes('?') ? '&' : '?'}_t=${ts}`,
      type: 'appsscript',
      name: 'Google Apps Script Web App',
    });
  } else if (isPublished) {
    urlsToTry.push({
      url: `https://docs.google.com/spreadsheets/d/e/${sheetId}/pub?output=csv&_t=${ts}${gidParam}`,
      type: 'csv',
      name: 'Published Web CSV',
    });
  } else {
    // 1. Google Visualization CSV (most reliable for public sheets)
    urlsToTry.push({
      url: `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&tq=&_t=${ts}&nocache=${ts}${gidParam}`,
      type: 'csv',
      name: 'Google Visualization CSV',
    });
    // 2. Google Visualization JSON
    urlsToTry.push({
      url: `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&_t=${ts}${gidParam}`,
      type: 'json',
      name: 'Google Visualization JSON',
    });
    // 3. Export format=csv
    urlsToTry.push({
      url: `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&_t=${ts}${gidParam}`,
      type: 'csv',
      name: 'Direct CSV Export',
    });
    // 4. Pub output=csv
    urlsToTry.push({
      url: `https://docs.google.com/spreadsheets/d/${sheetId}/pub?output=csv&_t=${ts}${gidParam}`,
      type: 'csv',
      name: 'Web Publish CSV',
    });
  }

  let lastError = '';

  for (const item of urlsToTry) {
    try {
      const res = await fetch(item.url, {
        headers: {
          Accept: item.type === 'json' || item.type === 'appsscript' ? 'application/json, text/plain' : 'text/csv, text/plain',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
        cache: 'no-store',
      });

      if (res.ok) {
        const text = await res.text();

        // Check if redirected to Google sign-in HTML
        if (
          text.includes('<!doctype html>') ||
          text.includes('Google Accounts') ||
          text.includes('accounts.google.com') ||
          text.includes('ServiceLogin')
        ) {
          lastError = 'Google Sheet ถูกจำกัดสิทธิ์การเข้าถึง (ต้องกดแชร์เป็น "ทุกคนที่มีลิงก์มีสิทธิ์ดู")';
          continue;
        }

        let records: HealthRecord[] = [];
        if (item.type === 'appsscript') {
          try {
            const data = JSON.parse(text);
            if (Array.isArray(data)) {
              if (data.length > 1 && Array.isArray(data[0])) {
                // 2D Array format: [ [header1, header2], [val1, val2] ]
                const headers = data[0].map(String);
                const rows = data.slice(1).map((r: any[]) => {
                  const obj: Record<string, string> = {};
                  headers.forEach((h: string, idx: number) => {
                    obj[h] = r[idx] !== undefined && r[idx] !== null ? String(r[idx]).trim() : '';
                  });
                  return obj;
                });
                records = mapRowObjectsToRecords(rows);
              } else if (typeof data[0] === 'object') {
                records = mapRowObjectsToRecords(data);
              }
            }
          } catch (e) {
            records = parseCsvToRecords(text);
          }
        } else if (item.type === 'json') {
          records = parseGvizJsonToRecords(text);
        } else {
          records = parseCsvToRecords(text);
        }

        if (records.length > 0) {
          return {
            success: true,
            records,
            source: 'google-sheets-live',
            message: `ดึงข้อมูลเรียลไทม์จาก Google Sheet สำเร็จ (${records.length} แถว)`,
            rowCount: records.length,
            timestamp: timeStr,
          };
        }
      }
    } catch (err: any) {
      lastError = err.message || 'Network error';
    }
  }

  // If live fetch couldn't read (because Google Sheet is private or requires login)
  return {
    success: false,
    records: [],
    source: 'fallback-sample',
    message: `Google Sheet ID (${sheetId}) ตั้งค่าความปลอดภัยเฉพาะผู้มีสิทธิ์เข้าถึง ระบบจึงใช้ชุดข้อมูลมาตรฐาน Health Risk ในการวิเคราะห์`,
    errorDetail:
      'วิธีทำให้ข้อมูลซิงค์สดแบบ Real-time: เปิด Google Sheet > กดปุ่ม "แชร์" (Share) > เปลี่ยน "การเข้าถึงทั่วไป" เป็น "ทุกคนที่มีลิงก์ (Anyone with the link)" มีสิทธิ์ "ผู้มีสิทธิ์อ่าน" > แล้วกดปุ่มรีเฟรชอีกครั้ง',
    rowCount: 0,
    timestamp: timeStr,
  };
}

/**
 * Parses Gviz JSON format response
 */
export function parseGvizJsonToRecords(gvizJsonText: string): HealthRecord[] {
  try {
    const start = gvizJsonText.indexOf('{');
    const end = gvizJsonText.lastIndexOf('}');
    if (start === -1 || end === -1) return [];
    const json = JSON.parse(gvizJsonText.slice(start, end + 1));
    const table = json.table;
    if (!table || !table.cols || !table.rows) return [];

    const headers: string[] = table.cols.map((col: any) => (col.label || col.id || '').trim());
    const rows = table.rows.map((r: any) => {
      const obj: Record<string, string> = {};
      r.c?.forEach((cell: any, i: number) => {
        const header = headers[i] || `col_${i}`;
        obj[header] = cell ? String(cell.v ?? cell.f ?? '').trim() : '';
      });
      return obj;
    });

    return mapRowObjectsToRecords(rows);
  } catch (e) {
    console.warn('Error parsing Gviz JSON:', e);
    return [];
  }
}

/**
 * Parses standard CSV text to HealthRecord array
 */
export function parseCsvToRecords(csvText: string): HealthRecord[] {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: 'greedy',
  });

  if (!parsed.data || parsed.data.length === 0) {
    return [];
  }

  return mapRowObjectsToRecords(parsed.data);
}

/**
 * Maps raw key-value dictionary rows into typed HealthRecord objects
 */
export function mapRowObjectsToRecords(rows: Record<string, string>[]): HealthRecord[] {
  return rows
    .filter((row) => {
      // Must have at least one non-empty value
      return Object.values(row).some((v) => String(v).trim().length > 0);
    })
    .map((row, index) => {
      const getVal = (...keys: string[]): string => {
        for (const k of keys) {
          for (const [rowKey, val] of Object.entries(row)) {
            const cleanRowKey = rowKey.trim().toLowerCase().replace(/[\s_()\-]/g, '');
            const cleanK = k.trim().toLowerCase().replace(/[\s_()\-]/g, '');
            if (cleanRowKey === cleanK || cleanRowKey.includes(cleanK)) {
              return String(val ?? '').trim();
            }
          }
        }
        return '';
      };

      const id =
        getVal('id', 'รหัส', 'ลำดับ', 'no', 'hn', 'patientid') || `HR-${String(index + 1).padStart(4, '0')}`;
      const name =
        getVal('name', 'ชื่อ', 'ชื่อนามสกุล', 'fullname', 'ชื่อสกุล', 'ชื่อผู้ป่วย', 'ชื่อผู้ตรวจ') ||
        `ผู้ตรวจสุขภาพ ${index + 1}`;
      const age = parseInt(getVal('age', 'อายุ'), 10) || 25 + (index % 45);

      const genderRaw = getVal('gender', 'เพศ').toLowerCase();
      const gender: Gender = genderRaw.includes('ชาย') || genderRaw.startsWith('m') ? 'ชาย' : 'หญิง';

      const province = getVal('province', 'จังหวัด', 'พื้นที่', 'area') || 'กรุงเทพมหานคร';
      const district = getVal('district', 'อำเภอ', 'เขต', 'ตำบล') || 'เมือง';

      const heightCm =
        parseFloat(getVal('height', 'heightcm', 'ส่วนสูง', 'ส่วนสูงซม', 'ส่วนสูงcm', 'h')) ||
        (gender === 'ชาย' ? 168 : 158);
      const weightKg =
        parseFloat(getVal('weight', 'weightkg', 'น้ำหนัก', 'น้ำหนักกก', 'น้ำหนักkg', 'w')) || 62;

      // BMI
      const parsedBmi = parseFloat(getVal('bmi', 'ดัชนีมวลกาย'));
      const bmi = parsedBmi > 0 ? Number(parsedBmi.toFixed(1)) : calculateBmi(weightKg, heightCm);
      const bmiCategory = getBmiCategory(bmi);

      // Blood Pressure (support separate SBP/DBP or combined "120/80")
      let systolicBp = parseInt(
        getVal('systolic', 'sbp', 'ความดันบน', 'ความดันโลหิตตัวบน', 'ความดันตัวบน', 'bpsys', 'sys'),
        10
      );
      let diastolicBp = parseInt(
        getVal('diastolic', 'dbp', 'ความดันล่าง', 'ความดันโลหิตตัวล่าง', 'ความดันตัวล่าง', 'bpdia', 'dia'),
        10
      );

      if (isNaN(systolicBp) || isNaN(diastolicBp)) {
        const combinedBp = getVal('bp', 'ความดัน', 'ความดันโลหิต', 'bloodpressure');
        if (combinedBp.includes('/')) {
          const parts = combinedBp.split('/').map((s) => parseInt(s.trim(), 10));
          if (!isNaN(parts[0])) systolicBp = parts[0];
          if (!isNaN(parts[1])) diastolicBp = parts[1];
        }
      }
      if (isNaN(systolicBp) || systolicBp <= 0) systolicBp = 120;
      if (isNaN(diastolicBp) || diastolicBp <= 0) diastolicBp = 80;
      const bpCategory = getBpCategory(systolicBp, diastolicBp);

      // Blood Sugar
      const fastingBloodSugar =
        parseInt(
          getVal('bloodsugar', 'sugar', 'glucose', 'fbg', 'ระดับน้ำตาล', 'น้ำตาลในเลือด', 'ค่าน้ำตาล'),
          10
        ) || 95;
      const sugarCategory = getSugarCategory(fastingBloodSugar);

      // Behaviors
      const smokingRaw = getVal('smoking', 'สูบบุหรี่', 'บุหรี่', 'พฤติกรรมการสูบ');
      let smoking: SmokingStatus = 'ไม่สูบ';
      if (smokingRaw.includes('ประจำ') || smokingRaw.includes('สูบ')) smoking = 'สูบเป็นประจำ';
      else if (smokingRaw.includes('ครั้ง') || smokingRaw.includes('นาน')) smoking = 'สูบนานๆ ครั้ง';
      else if (smokingRaw.includes('เลิก')) smoking = 'เคยสูบแต่เลิกแล้ว';

      const alcoholRaw = getVal('alcohol', 'แอลกอฮอล์', 'สุรา', 'เหล้า', 'ดื่มสุรา');
      let alcohol: AlcoholStatus = 'ไม่ดื่ม';
      if (alcoholRaw.includes('ประจำ')) alcohol = 'ดื่มเป็นประจำ';
      else if (alcoholRaw.includes('สังคม') || alcoholRaw.includes('ครั้งคราว')) alcohol = 'ดื่มเข้าสังคม';

      const exerciseRaw = getVal('exercise', 'ออกกำลังกาย', 'การออกกำลังกาย');
      let exercise: ExerciseFrequency = '1-2 วัน/สัปดาห์';
      if (exerciseRaw.includes('ไม่')) exercise = 'ไม่ออกกำลังกาย';
      else if (exerciseRaw.includes('5') || exerciseRaw.includes('ทุกวัน')) exercise = '≥5 วัน/สัปดาห์';
      else if (exerciseRaw.includes('3') || exerciseRaw.includes('4')) exercise = '3-4 วัน/สัปดาห์';

      const dietRaw = getVal('diet', 'อาหาร', 'รสหวานมันเค็ม', 'พฤติกรรมการกิน', 'โภชนาการ');
      let dietHabit: DietHabit = 'กินหวานมันเค็มปานกลาง';
      if (dietRaw.includes('ประจำ') || dietRaw.includes('หวาน') || dietRaw.includes('มัน') || dietRaw.includes('เค็ม')) {
        dietHabit = 'กินหวานมันเค็มประจำ';
      } else if (dietRaw.includes('สุขภาพ') || dietRaw.includes('คลีน')) {
        dietHabit = 'กินอาหารสุขภาพ/ควบคุมรสชาติ';
      }

      const sleepHours =
        parseFloat(getVal('sleep', 'sleephours', 'การนอน', 'ชั่วโมงการนอน', 'นอนหลับ')) || 7;
      const familyHistory = getVal('familyhistory', 'ประวัติครอบครัว', 'พันธุกรรม', 'กรรมพันธุ์').includes('มี');

      // Risk score calculation
      const calculated = calculateRiskScore({
        bmi,
        sbp: systolicBp,
        fbg: fastingBloodSugar,
        age,
        smoking,
        alcohol,
        exercise,
        dietHabit,
        familyHistory,
      });

      // If sheet already has custom risk level or score, allow overriding
      const rawRiskLevel = getVal('risklevel', 'ระดับความเสี่ยง', 'ความเสี่ยง', 'risk');
      let riskLevel: RiskLevel = calculated.level;
      if (rawRiskLevel) {
        if (
          rawRiskLevel.includes('สูงมาก') ||
          rawRiskLevel.toLowerCase().includes('critical') ||
          rawRiskLevel.toLowerCase().includes('very high')
        ) {
          riskLevel = 'เสี่ยงสูงมาก';
        } else if (rawRiskLevel.includes('สูง') || rawRiskLevel.toLowerCase().includes('high')) {
          riskLevel = 'เสี่ยงสูง';
        } else if (
          rawRiskLevel.includes('กลาง') ||
          rawRiskLevel.toLowerCase().includes('moderate') ||
          rawRiskLevel.toLowerCase().includes('medium')
        ) {
          riskLevel = 'เสี่ยงปานกลาง';
        } else if (
          rawRiskLevel.includes('ปกติ') ||
          rawRiskLevel.toLowerCase().includes('normal') ||
          rawRiskLevel.toLowerCase().includes('low')
        ) {
          riskLevel = 'ปกติ';
        }
      }

      const parsedRiskScore = parseFloat(getVal('riskscore', 'คะแนนความเสี่ยง', 'คะแนน', 'score'));
      const riskScore = !isNaN(parsedRiskScore) && parsedRiskScore >= 0 ? parsedRiskScore : calculated.score;

      const checkupDate = getVal('date', 'วันที่', 'checkupdate', 'วันที่ตรวจ') || '2026-09-15';
      const customTriage = getVal('triage', 'triageNote', 'ข้อเสนอแนะ', 'การดูแล');

      return {
        id,
        name,
        age,
        gender,
        province,
        district,
        heightCm,
        weightKg,
        bmi,
        bmiCategory,
        systolicBp,
        diastolicBp,
        bpCategory,
        fastingBloodSugar,
        sugarCategory,
        smoking,
        alcohol,
        exercise,
        dietHabit,
        sleepHours,
        familyHistoryNcd: familyHistory,
        riskScore,
        riskLevel,
        checkupDate,
        triageNote:
          customTriage ||
          (riskLevel === 'เสี่ยงสูงมาก'
            ? 'พบแพทย์เฉพาะทางทันที มีความเสี่ยงโรคแทรกซ้อนสูง'
            : riskLevel === 'เสี่ยงสูง'
            ? 'ติดตามค่าน้ำตาล/ความดันซ้ำใน 1 เดือน และเข้าคลินิกปรับพฤติกรรม'
            : riskLevel === 'เสี่ยงปานกลาง'
            ? 'ปรับเปลี่ยนพฤติกรรมเสี่ยง ลดหวานมันเค็ม ออกกำลังกายเพิ่มขึ้น'
            : 'สุขภาพปกติ ตรวจสุขภาพประจำปีอย่างต่อเนื่อง'),
      };
    });
}
