"""HOS simulator: walks the trip's tasks and inserts breaks, rests, and
restarts wherever one of the four clocks runs out.

The four clocks (property-carrying, 70 hr / 8 day, no adverse conditions):

1. 11-hour driving limit   - driving since the last 10-hour reset
2. 14-hour driving window  - wall clock since first coming on duty after a reset;
                             non-driving work past 14 is legal but no driving is
3. 30-minute break         - required once 8 cumulative driving hours accrue
                             without a 30-minute non-driving interruption
4. 70-hour / 8-day cycle   - all on-duty time; seeded by "current cycle used";
                             at 70 no driving until a 34-hour restart

Pure Python, no Django imports, so it is trivially unit-testable.
"""

from datetime import datetime, timedelta

from . import constants as C
from .segments import (
    DRIVING,
    OFF_DUTY,
    ON_DUTY,
    SLEEPER,
    DriveTask,
    DutyTask,
    Segment,
    Stop,
)

EPS = 1e-6  # float tolerance, in hours


class Simulator:
    def __init__(self, start: datetime, cycle_used: float):
        self.t = start
        self.cycle_used = float(cycle_used)
        self.driving_since_rest = 0.0   # clock 1
        self.window_start = None        # clock 2 (None = window not running)
        self.driving_since_break = 0.0  # clock 3
        self.segments: list[Segment] = []
        self.stops: list[Stop] = []
        self.trip_miles = 0.0
        self.last_location = ""

    # ---- bookkeeping -------------------------------------------------

    def _add(self, status, hours, location="", note="", miles=0.0):
        end = self.t + timedelta(hours=hours)
        self.segments.append(Segment(status, self.t, end, location, note, miles))
        self.t = end
        if location:
            self.last_location = location

    def _window_remaining(self) -> float:
        if self.window_start is None:
            return C.WINDOW_LIMIT
        elapsed = (self.t - self.window_start).total_seconds() / 3600.0
        return C.WINDOW_LIMIT - elapsed

    def _ensure_window(self):
        if self.window_start is None:
            self.window_start = self.t

    def _stop(self, stop_type, label=""):
        self.stops.append(
            Stop(type=stop_type, time=self.t, trip_miles=self.trip_miles, label=label)
        )

    # ---- inserted rest periods ----------------------------------------

    def take_break(self):
        """30 consecutive non-driving minutes; resets clock 3 only."""
        self._stop("break_30m")
        self._add(OFF_DUTY, C.BREAK_DURATION, self.last_location, "30-min break")
        self.driving_since_break = 0.0

    def take_daily_rest(self):
        """10 consecutive hours off; resets clocks 1-3 but not the cycle."""
        self._stop("rest_10h")
        self._add(SLEEPER, C.DAILY_RESET, self.last_location, "10-hour rest")
        self.driving_since_rest = 0.0
        self.driving_since_break = 0.0
        self.window_start = None

    def take_restart(self):
        """34 consecutive hours off; resets the 70-hour cycle and clocks 1-3."""
        self._stop("restart_34h")
        self._add(OFF_DUTY, C.CYCLE_RESTART, self.last_location, "34-hour restart")
        self.cycle_used = 0.0
        self.driving_since_rest = 0.0
        self.driving_since_break = 0.0
        self.window_start = None

    # ---- tasks ---------------------------------------------------------

    def do_duty(self, task: DutyTask):
        """On-duty (not driving) work: pickup, drop-off, fueling."""
        if self.cycle_used + task.hours > C.CYCLE_LIMIT + EPS:
            self.take_restart()
        self._ensure_window()
        if task.stop_type:
            self._stop(task.stop_type, task.location)
        self._add(ON_DUTY, task.hours, task.location, task.note)
        self.cycle_used += task.hours
        if task.hours >= C.BREAK_DURATION - EPS:
            # 30+ consecutive non-driving minutes also satisfy the break rule
            self.driving_since_break = 0.0

    def do_drive(self, task: DriveTask):
        mph = task.miles / task.hours if task.hours > 0 else 0.0
        remaining = task.hours
        location = task.from_label
        while remaining > EPS:
            avail_drive = C.DRIVING_LIMIT - self.driving_since_rest
            avail_window = self._window_remaining()
            avail_break = C.BREAK_AFTER_DRIVING - self.driving_since_break
            avail_cycle = C.CYCLE_LIMIT - self.cycle_used

            if avail_cycle <= EPS:
                self.take_restart()
                continue
            if avail_drive <= EPS or avail_window <= EPS:
                self.take_daily_rest()
                continue
            if avail_break <= EPS:
                self.take_break()
                continue

            self._ensure_window()
            chunk = min(remaining, avail_drive, avail_window, avail_break, avail_cycle)
            self._add(
                DRIVING,
                chunk,
                location,
                f"Driving toward {task.to_label}",
                miles=chunk * mph,
            )
            self.trip_miles += chunk * mph
            self.driving_since_rest += chunk
            self.driving_since_break += chunk
            self.cycle_used += chunk
            remaining -= chunk
            location = ""  # only the first chunk is anchored to the named origin

    def run(self, tasks):
        for task in tasks:
            if isinstance(task, DriveTask):
                self.do_drive(task)
            else:
                self.do_duty(task)


def _quarter(hours: float) -> float:
    """Snap a drive duration to 15-minute ticks (the paper grid's resolution)."""
    return max(0.25, round(hours * 4) / 4)


def build_tasks(legs, total_miles):
    """Turn the two route legs into a task list with fuel stops injected
    every FUEL_INTERVAL_MILES of cumulative trip distance.

    legs: [{"from", "to", "miles", "hours"}, ...]  (current->pickup, pickup->dropoff)
    """
    tasks = []
    fuel_points = [
        m * C.FUEL_INTERVAL_MILES
        for m in range(1, int(total_miles // C.FUEL_INTERVAL_MILES) + 1)
        if m * C.FUEL_INTERVAL_MILES < total_miles - 1.0
    ]
    odometer = 0.0
    fi = 0

    for i, leg in enumerate(legs):
        leg_miles, leg_hours = leg["miles"], leg["hours"]
        mph = leg_miles / leg_hours if leg_hours > 0 else 1.0
        cursor = 0.0  # miles into this leg
        while fi < len(fuel_points) and fuel_points[fi] <= odometer + leg_miles:
            at = fuel_points[fi] - odometer  # miles into the leg
            chunk = at - cursor
            if chunk > 1.0:
                tasks.append(
                    DriveTask(chunk, _quarter(chunk / mph), leg["from"] if cursor == 0 else "", leg["to"])
                )
            tasks.append(DutyTask(C.FUEL_STOP_HOURS, "", "Fueling", stop_type="fuel"))
            cursor = at
            fi += 1
        chunk = leg_miles - cursor
        if chunk > 0.5:
            tasks.append(
                DriveTask(chunk, _quarter(chunk / mph), leg["from"] if cursor == 0 else "", leg["to"])
            )
        odometer += leg_miles

        if i == 0:
            tasks.append(DutyTask(C.PICKUP_HOURS, leg["to"], "Pickup", stop_type="pickup"))
        else:
            tasks.append(DutyTask(C.DROPOFF_HOURS, leg["to"], "Drop-off", stop_type="dropoff"))
    return tasks


def plan_trip(legs, cycle_used, start_date=None):
    """Run the whole trip. Returns the simulator (segments, stops, clocks)
    plus trip-level summary numbers.

    Assumption stated in the README: the driver starts with fresh daily
    clocks (just finished a 10-hour reset) at 08:00 home-terminal time,
    with the 70-hour cycle seeded at `cycle_used`.
    """
    if start_date is None:
        start_date = datetime.now().date()
    midnight = datetime.combine(start_date, datetime.min.time())
    start = midnight + timedelta(hours=C.TRIP_START_HOUR)

    total_miles = sum(l["miles"] for l in legs)
    tasks = build_tasks(legs, total_miles)

    sim = Simulator(start, cycle_used)
    # Leading off-duty block from midnight so day 1 starts as a full sheet.
    sim.segments.append(
        Segment(OFF_DUTY, midnight, start, legs[0]["from"], "Off duty before trip")
    )
    sim.last_location = legs[0]["from"]
    sim.run(tasks)

    trip_end = sim.t
    # Pad the final day with off duty to midnight so totals sum to 24.
    end_of_day = datetime.combine(trip_end.date(), datetime.min.time()) + timedelta(days=1)
    if end_of_day > trip_end:
        sim.segments.append(
            Segment(OFF_DUTY, trip_end, end_of_day, legs[-1]["to"], "Off duty after drop-off")
        )

    summary = {
        "total_miles": round(total_miles),
        "total_drive_hours": round(sum(s.duration_hours for s in sim.segments if s.status == DRIVING), 2),
        "total_duration_hours": round((trip_end - start).total_seconds() / 3600.0, 2),
        "num_days": (trip_end.date() - start.date()).days + 1,
        "num_fuel_stops": sum(1 for s in sim.stops if s.type == "fuel"),
        "num_rests": sum(1 for s in sim.stops if s.type in ("rest_10h", "restart_34h")),
        "cycle_used_start": round(float(cycle_used), 2),
        "cycle_used_end": round(sim.cycle_used, 2),
    }
    return sim, summary
