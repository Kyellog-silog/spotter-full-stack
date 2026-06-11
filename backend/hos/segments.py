"""Data shapes shared by the simulator, log-sheet builder, and API."""

from dataclasses import dataclass, field
from datetime import datetime

# Duty statuses, matching the four rows of the DOT log grid.
OFF_DUTY = "off_duty"
SLEEPER = "sleeper"
DRIVING = "driving"
ON_DUTY = "on_duty"

STATUSES = (OFF_DUTY, SLEEPER, DRIVING, ON_DUTY)


@dataclass
class Segment:
    """One continuous duty-status block on the timeline."""

    status: str
    start: datetime
    end: datetime
    location: str = ""
    note: str = ""
    miles: float = 0.0  # miles driven during this segment (0 unless driving)

    @property
    def duration_hours(self) -> float:
        return (self.end - self.start).total_seconds() / 3600.0


@dataclass
class Stop:
    """A point event shown as a marker on the map."""

    type: str  # pickup | dropoff | fuel | break_30m | rest_10h | restart_34h
    time: datetime
    trip_miles: float  # cumulative miles along the route, for lat/lng interpolation
    label: str = ""
    lat: float = 0.0
    lng: float = 0.0


@dataclass
class DriveTask:
    miles: float
    hours: float
    from_label: str
    to_label: str


@dataclass
class DutyTask:
    hours: float
    location: str
    note: str
    stop_type: str = ""  # emit a Stop of this type when the task starts
