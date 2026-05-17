// calendar_engine.ts - 移植自 calendar_engine.py
// 計算當下時間的四柱干支

const STEMS = "甲乙丙丁戊己庚辛壬癸";
const BRANCHES = "子丑寅卯辰巳午未申酉戌亥";

function getJulianDay(y: number, m: number, d: number, h: number): number {
  if (m <= 2) { y -= 1; m += 12; }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  const jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + b - 1524.5;
  return jd + h / 24.0;
}

export interface GanZhi {
  year: string;
  month: string;
  day: string;
  hour: string;
  year_stem: string; year_branch: string;
  month_stem: string; month_branch: string;
  day_stem: string; day_branch: string;
  hour_stem: string; hour_branch: string;
}

export function getGanZhi(dt: Date): GanZhi {
  const jd = getJulianDay(dt.getFullYear(), dt.getMonth() + 1, dt.getDate(), dt.getHours());

  // 日干支 (以 1900-01-01 甲戌為基準)
  const baseJd = 2415020.5;
  const offset = Math.round(jd - baseJd);
  const dayStemIdx = ((0 + offset) % 10 + 10) % 10;
  const dayBranchIdx = ((10 + offset) % 12 + 12) % 12;
  const day_stem = STEMS[dayStemIdx];
  const day_branch = BRANCHES[dayBranchIdx];

  // 時干支
  const hourBranchIdx = Math.floor((dt.getHours() + 1) / 2) % 12;
  const timeStemStart: Record<string, number> = {
    '甲': 0, '己': 0, '乙': 2, '庚': 2,
    '丙': 4, '辛': 4, '丁': 6, '壬': 6, '戊': 8, '癸': 8
  };
  const hourStemIdx = (timeStemStart[day_stem] + hourBranchIdx) % 10;
  const hour_stem = STEMS[hourStemIdx];
  const hour_branch = BRANCHES[hourBranchIdx];

  // 年干支
  let year = dt.getFullYear();
  if (dt.getMonth() < 1 || (dt.getMonth() === 1 && dt.getDate() < 4)) year -= 1;
  const yearStemIdx = ((year - 4) % 10 + 10) % 10;
  const yearBranchIdx = ((year - 4) % 12 + 12) % 12;
  const year_stem = STEMS[yearStemIdx];
  const year_branch = BRANCHES[yearBranchIdx];

  // 月干支
  let monthIdx = dt.getMonth() + 1;
  if (dt.getDate() < 5) { monthIdx -= 1; if (monthIdx === 0) monthIdx = 12; }
  const monthBranchIdx = (monthIdx + 1) % 12;
  const yearStemToMonthStart: Record<string, number> = {
    '甲': 2, '己': 2, '乙': 4, '庚': 4,
    '丙': 6, '辛': 6, '丁': 8, '壬': 8, '戊': 0, '癸': 0
  };
  const monthStemIdx = (yearStemToMonthStart[year_stem] + (monthIdx - 1)) % 10;
  const month_stem = STEMS[monthStemIdx];
  const month_branch = BRANCHES[monthBranchIdx];

  return {
    year: `${year_stem}${year_branch}`,
    month: `${month_stem}${month_branch}`,
    day: `${day_stem}${day_branch}`,
    hour: `${hour_stem}${hour_branch}`,
    year_stem, year_branch,
    month_stem, month_branch,
    day_stem, day_branch,
    hour_stem, hour_branch,
  };
}
