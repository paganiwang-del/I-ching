import datetime
import math

class CalendarEngine:
    STEMS = "甲乙丙丁戊己庚辛壬癸"
    BRANCHES = "子丑寅卯辰巳午未申酉戌亥"
    
    # 24 節氣對應西曆日期 (大約值，精確計算需天文公式)
    # 這裡使用簡單查表加微調，或直接計算儒略日
    
    @staticmethod
    def get_gan_zhi(dt: datetime.datetime):
        """
        計算西曆時間對應的干支 (年, 月, 日, 時)
        """
        # 1. 儒略日計算 (Julian Day)
        def get_julian_day(y, m, d, h):
            if m <= 2:
                y -= 1
                m += 12
            a = math.floor(y / 100)
            b = 2 - a + math.floor(a / 4)
            jd = math.floor(365.25 * (y + 4716)) + math.floor(30.6001 * (m + 1)) + d + b - 1524.5
            return jd + h / 24.0

        jd = get_julian_day(dt.year, dt.month, dt.day, dt.hour)
        
        # 2. 日干支 (以 1899-12-21 00:00 為基準，當天是 甲子日, JD = 2415010)
        # 實際上 1900-01-01 是 甲戌日
        # 這裡用 JD 計算更穩健
        base_jd = 2415020.5 # 1900-01-01 00:00:00 (甲戌)
        offset = int(jd - base_jd + 0.5)
        
        # 甲戌的索引：甲=0, 戌=10
        # 日干 = (0 + offset) % 10
        # 日支 = (10 + offset) % 12
        day_stem_idx = (0 + offset) % 10
        day_branch_idx = (10 + offset) % 12
        
        day_stem = CalendarEngine.STEMS[day_stem_idx]
        day_branch = CalendarEngine.BRANCHES[day_branch_idx]

        # 3. 時干支 (根據日干求時干)
        # 甲己起甲子, 乙庚起丙子, 丙辛起戊子, 丁壬起庚子, 戊癸起壬子
        hour_branch_idx = (int((dt.hour + 1) / 2)) % 12
        time_stem_start = {
            '甲': 0, '己': 0,
            '乙': 2, '庚': 2,
            '丙': 4, '辛': 4,
            '丁': 6, '壬': 6,
            '戊': 8, '癸': 8
        }
        hour_stem_idx = (time_stem_start[day_stem] + hour_branch_idx) % 10
        hour_stem = CalendarEngine.STEMS[hour_stem_idx]
        hour_branch = CalendarEngine.BRANCHES[hour_branch_idx]

        # 4. 年干支 (以立春為界)
        # 這裡簡化處理，具體立春需精確節氣表
        year = dt.year
        if dt.month < 2 or (dt.month == 2 and dt.day < 4): # 假設 2/4 立春
            year -= 1
        year_stem_idx = (year - 4) % 10
        year_branch_idx = (year - 4) % 12
        year_stem = CalendarEngine.STEMS[year_stem_idx]
        year_branch = CalendarEngine.BRANCHES[year_branch_idx]

        # 5. 月干支 (以節氣為界)
        # 這裡也簡化，具體需精確 24 節氣
        months = [
            (1, 5, '小寒'), (2, 4, '立春'), (3, 6, '驚蟄'), (4, 5, '清明'),
            (5, 5, '立夏'), (6, 6, '芒種'), (7, 7, '小暑'), (8, 7, '立秋'),
            (9, 8, '白露'), (10, 8, '寒露'), (11, 7, '立冬'), (12, 7, '大雪')
        ]
        month_idx = dt.month
        # 若在該月節氣前，算前一個月
        term_day = 5 # 預設大約 5 號換月
        if dt.day < term_day:
            month_idx -= 1
        if month_idx == 0: month_idx = 12
        
        # 月支：寅月是正月 (索引 2)
        month_branch_idx = (month_idx + 1) % 12
        # 月干：根據年干求月干
        # 甲己之年丙作首, 乙庚之年戊為頭...
        year_stem_to_month_start = {
            '甲': 2, '己': 2,
            '乙': 4, '庚': 4,
            '丙': 6, '辛': 6,
            '丁': 8, '壬': 8,
            '戊': 0, '癸': 0
        }
        month_stem_idx = (year_stem_to_month_start[year_stem] + (month_idx - 1)) % 10
        month_stem = CalendarEngine.STEMS[month_stem_idx]
        month_branch = CalendarEngine.BRANCHES[month_branch_idx]

        return {
            'year': f"{year_stem}{year_branch}",
            'month': f"{month_stem}{month_branch}",
            'day': f"{day_stem}{day_branch}",
            'hour': f"{hour_stem}{hour_branch}",
            'year_stem': year_stem, 'year_branch': year_branch,
            'month_stem': month_stem, 'month_branch': month_branch,
            'day_stem': day_stem, 'day_branch': day_branch,
            'hour_stem': hour_stem, 'hour_branch': hour_branch
        }
