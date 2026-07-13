import datetime
import math
from functools import lru_cache
from zoneinfo import ZoneInfo

try:
    import sxtwl
except ImportError:  # pragma: no cover - exercised only in minimal deployments
    sxtwl = None


DEFAULT_TIMEZONE = "Asia/Taipei"

# The twelve "jie" solar terms that start the Chinese lunar months.
SOLAR_TERM_APPROX = {
    1: (1, 6, 285),
    2: (2, 4, 315),
    3: (3, 6, 345),
    4: (4, 5, 15),
    5: (5, 6, 45),
    6: (6, 6, 75),
    7: (7, 7, 105),
    8: (8, 7, 135),
    9: (9, 8, 165),
    10: (10, 8, 195),
    11: (11, 7, 225),
    12: (12, 7, 255),
}

# sxtwl uses the standard 24-term index: 1 小寒, 3 立春, ..., 23 大雪.
SOLAR_TERM_JQ_INDEX = {
    1: 1,
    2: 3,
    3: 5,
    4: 7,
    5: 9,
    6: 11,
    7: 13,
    8: 15,
    9: 17,
    10: 19,
    11: 21,
    12: 23,
}


def _timezone_name(dt: datetime.datetime) -> str:
    timezone = getattr(dt.tzinfo, "key", None)
    return timezone or DEFAULT_TIMEZONE


def _get_timezone(timezone_name: str):
    try:
        return ZoneInfo(timezone_name)
    except Exception:
        return datetime.timezone(datetime.timedelta(hours=8), DEFAULT_TIMEZONE)


def _solar_longitude(dt: datetime.datetime) -> float:
    """Approximate apparent solar longitude in degrees."""
    utc_dt = dt.astimezone(datetime.timezone.utc)
    julian_day = utc_dt.timestamp() / 86400.0 + 2440587.5
    centuries = (julian_day - 2451545.0) / 36525.0

    mean_longitude = (280.46646 + 36000.76983 * centuries + 0.0003032 * centuries ** 2) % 360
    mean_anomaly = math.radians(
        (357.52911 + 35999.05029 * centuries - 0.0001537 * centuries ** 2) % 360
    )
    equation_of_center = (
        (1.914602 - 0.004817 * centuries - 0.000014 * centuries ** 2) * math.sin(mean_anomaly)
        + (0.019993 - 0.000101 * centuries) * math.sin(2 * mean_anomaly)
        + 0.000289 * math.sin(3 * mean_anomaly)
    )
    true_longitude = mean_longitude + equation_of_center
    omega = math.radians(125.04 - 1934.136 * centuries)
    return (true_longitude - 0.00569 - 0.00478 * math.sin(omega)) % 360


def _angle_delta(angle: float, target: float) -> float:
    return (angle - target + 180) % 360 - 180


@lru_cache(maxsize=64)
def _solar_terms(year: int, timezone_name: str):
    timezone = _get_timezone(timezone_name)

    if sxtwl is not None:
        terms = {}
        target_indexes = set(SOLAR_TERM_JQ_INDEX.values())
        # getJieQiByYear starts at 立春 and includes the following January
        # terms, so inspect the preceding year for 小寒.
        for source_year in (year - 1, year):
            for item in sxtwl.getJieQiByYear(source_year):
                if item.jqIndex not in target_indexes:
                    continue
                solar_time = sxtwl.JD2DD(item.jd)
                shanghai = datetime.timezone(datetime.timedelta(hours=8), "Asia/Shanghai")
                term = datetime.datetime(
                    int(solar_time.getYear()),
                    int(solar_time.getMonth()),
                    int(solar_time.getDay()),
                    int(solar_time.getHour()),
                    int(solar_time.getMin()),
                    tzinfo=shanghai,
                ) + datetime.timedelta(seconds=float(solar_time.getSec()))
                term = term.astimezone(timezone)
                if term.year == year:
                    for month, jq_index in SOLAR_TERM_JQ_INDEX.items():
                        if item.jqIndex == jq_index:
                            terms[month] = term
        if len(terms) == 12:
            return terms

    # Keep a pure-Python fallback for environments that cannot install sxtwl.
    terms = {}
    for month, (term_month, term_day, target) in SOLAR_TERM_APPROX.items():
        center = datetime.datetime(year, term_month, term_day, 12, tzinfo=timezone)
        low = center - datetime.timedelta(days=3)
        high = center + datetime.timedelta(days=3)

        # The sun's longitude is monotonic across this short search window.
        for _ in range(50):
            middle = low + (high - low) / 2
            if _angle_delta(_solar_longitude(middle), target) < 0:
                low = middle
            else:
                high = middle
        terms[month] = low + (high - low) / 2
    return terms


def _solar_term(year: int, month: int, timezone_name: str) -> datetime.datetime:
    return _solar_terms(year, timezone_name)[month]


def _get_solar_term_month_index(dt: datetime.datetime) -> int:
    timezone_name = _timezone_name(dt)
    boundary_month = dt.month
    if dt < _solar_term(dt.year, boundary_month, timezone_name):
        boundary_month -= 1
        if boundary_month == 0:
            boundary_month = 12

    # Solar-term month 2 (立春) is 寅月, month 3 is 卯月, ..., month 12 is 子月.
    branch_index = boundary_month % 12
    return ((branch_index - 2) % 12) + 1


def _get_lunar_info(dt: datetime.datetime):
    if sxtwl is None:
        return None
    lunar = sxtwl.fromSolar(dt.year, dt.month, dt.day)
    return {
        "year": int(lunar.getLunarYear()),
        "month": abs(int(lunar.getLunarMonth())),
        "day": int(lunar.getLunarDay()),
        "is_leap": bool(lunar.isLunarLeap()),
    }


def _get_month_index(dt: datetime.datetime) -> int:
    # 六爻月建以節氣為界；農曆月份只提供萬年曆日期顯示。
    return _get_solar_term_month_index(dt)


class CalendarEngine:
    STEMS = "甲乙丙丁戊己庚辛壬癸"
    BRANCHES = "子丑寅卯辰巳午未申酉戌亥"
    
    # 24 節氣對應西曆日期 (大約值，精確計算需天文公式)
    # 這裡使用簡單查表加微調，或直接計算儒略日
    
    @staticmethod
    def get_gan_zhi(dt: datetime.datetime):
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=_get_timezone(DEFAULT_TIMEZONE))

        lunar_info = _get_lunar_info(dt)

        """
        計算西曆時間對應的干支 (年, 月, 日, 時)
        """
        # 子初換日：23:00 起算下一個日干支。
        day_for_pillar = dt + datetime.timedelta(hours=1)
        
        # 2. 日干支 (以 1899-12-21 00:00 為基準，當天是 甲子日, JD = 2415010)
        # 實際上 1900-01-01 是 甲戌日
        # 這裡用 JD 計算更穩健
        offset = (day_for_pillar.date() - datetime.date(1900, 1, 1)).days
        
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
        if dt < _solar_term(dt.year, 2, _timezone_name(dt)):
            year -= 1
        year_stem_idx = (year - 4) % 10
        year_branch_idx = (year - 4) % 12
        year_stem = CalendarEngine.STEMS[year_stem_idx]
        year_branch = CalendarEngine.BRANCHES[year_branch_idx]

        # 5. 月干支 (以節氣為界)
        # 這裡也簡化，具體需精確 24 節氣
        # 若在該月節氣前，算前一個月
        month_idx = _get_month_index(dt)
        
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

        result = {
            'year': f"{year_stem}{year_branch}",
            'month': f"{month_stem}{month_branch}",
            'day': f"{day_stem}{day_branch}",
            'hour': f"{hour_stem}{hour_branch}",
            'year_stem': year_stem, 'year_branch': year_branch,
            'month_stem': month_stem, 'month_branch': month_branch,
            'day_stem': day_stem, 'day_branch': day_branch,
            'hour_stem': hour_stem, 'hour_branch': hour_branch
        }
        if lunar_info is not None:
            result.update({
                'lunar_year': lunar_info['year'],
                'lunar_month': lunar_info['month'],
                'lunar_day': lunar_info['day'],
                'lunar_is_leap': lunar_info['is_leap'],
            })
        return result
