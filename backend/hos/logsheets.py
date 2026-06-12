"""Slice the trip's duty segments into one log sheet per calendar day.

Times inside a sheet are "HH:MM" within that day, with "24:00" allowed as
the end-of-day boundary, so the SVG renderer stays trivial. Per-status
totals on every sheet must sum to 24 hours.
"""

from datetime import datetime, timedelta

from .segments import DRIVING, STATUSES


def _fmt(dt: datetime, day_start: datetime) -> str:
    if dt >= day_start + timedelta(days=1):
        return "24:00"
    return dt.strftime("%H:%M")


def build_log_sheets(segments):
    if not segments:
        return []

    first_day = segments[0].start.date()
    last_day = (segments[-1].end - timedelta(seconds=1)).date()

    sheets = []
    day = first_day
    while day <= last_day:
        day_start = datetime.combine(day, datetime.min.time())
        day_end = day_start + timedelta(days=1)

        day_segments = []
        totals = {s: 0.0 for s in STATUSES}
        miles = 0.0
        remarks = []

        for seg in segments:
            start = max(seg.start, day_start)
            end = min(seg.end, day_end)
            if end <= start:
                continue
            hours = (end - start).total_seconds() / 3600.0
            totals[seg.status] += hours
            if seg.status == DRIVING and seg.duration_hours > 0:
                miles += seg.miles * (hours / seg.duration_hours)

            entry = {
                "status": seg.status,
                "start": _fmt(start, day_start),
                "end": _fmt(end, day_start),
                "location": seg.location,
                "note": seg.note,
            }
            # Merge with the previous entry when the status continues unchanged
            prev = day_segments[-1] if day_segments else None
            if prev and prev["status"] == entry["status"] and prev["end"] == entry["start"]:
                prev["end"] = entry["end"]
                prev["note"] = prev["note"] or entry["note"]
            else:
                day_segments.append(entry)

            # Remarks: name the place at each change of duty status. Segments
            # without a resolved place (continuation driving chunks) are skipped.
            if seg.start >= day_start and seg.location:
                if not remarks or remarks[-1]["location"] != seg.location:
                    remarks.append({"time": _fmt(start, day_start), "location": seg.location})

        sheets.append(
            {
                "date": day.isoformat(),
                "total_miles": round(miles),
                "totals": {s: round(totals[s], 2) for s in STATUSES},
                "segments": day_segments,
                "remarks": remarks,
            }
        )
        day += timedelta(days=1)
    return sheets
