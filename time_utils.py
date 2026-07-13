import datetime
from zoneinfo import ZoneInfo


DEFAULT_TIMEZONE = "Asia/Taipei"


def get_timezone(timezone_name: str | None) -> ZoneInfo:
    """Return a valid IANA timezone, falling back to Taiwan."""
    try:
        return ZoneInfo(timezone_name or DEFAULT_TIMEZONE)
    except Exception:
        return datetime.timezone(datetime.timedelta(hours=8), DEFAULT_TIMEZONE)


def resolve_client_datetime(
    client_now: str | None = None,
    client_timezone: str | None = None,
) -> datetime.datetime:
    """Parse a browser ISO timestamp and return local, timezone-aware time."""
    if client_now:
        try:
            parsed = datetime.datetime.fromisoformat(client_now.replace("Z", "+00:00"))
        except ValueError:
            parsed = datetime.datetime.now(datetime.timezone.utc)
    else:
        parsed = datetime.datetime.now(datetime.timezone.utc)

    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=datetime.timezone.utc)

    timezone = get_timezone(client_timezone)
    return parsed.astimezone(timezone)


def format_local_timestamp(dt: datetime.datetime) -> str:
    return dt.strftime("%Y-%m-%d %H:%M:%S")
