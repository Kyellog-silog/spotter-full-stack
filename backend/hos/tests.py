"""HOS engine tests. Pure Python — run with:

    python -m unittest hos.tests -v
"""

import unittest
from datetime import date, datetime

from . import constants as C
from .logsheets import build_log_sheets
from .segments import DRIVING, OFF_DUTY, ON_DUTY, SLEEPER, Segment
from .simulator import build_tasks, plan_trip

D = date(2026, 6, 15)


def dt(day_offset, hour, minute=0):
    base = datetime(2026, 6, 15 + day_offset)
    return base.replace(hour=int(hour), minute=minute)


class GoldenJohnDoeTest(unittest.TestCase):
    """FMCSA guide pp. 18-19: John Doe, Richmond VA -> Newark NJ, 350 mi.
    Per-status totals must be Off 10, Sleeper 1.75, Driving 7.75,
    On Duty 4.5, summing to exactly 24."""

    def test_totals(self):
        segs = [
            Segment(OFF_DUTY, dt(0, 0), dt(0, 6), "Richmond, VA"),
            Segment(ON_DUTY, dt(0, 6), dt(0, 7), "Richmond, VA", "Pre-trip"),
            Segment(DRIVING, dt(0, 7), dt(0, 11), "Richmond, VA", miles=180),
            Segment(ON_DUTY, dt(0, 11), dt(0, 12), "Fredericksburg, VA"),
            Segment(DRIVING, dt(0, 12), dt(0, 13, 45), "Fredericksburg, VA", miles=80),
            Segment(SLEEPER, dt(0, 13, 45), dt(0, 15, 30), "Baltimore, MD"),
            Segment(DRIVING, dt(0, 15, 30), dt(0, 17, 30), "Baltimore, MD", miles=90),
            Segment(ON_DUTY, dt(0, 17, 30), dt(0, 20), "Newark, NJ", "Unload"),
            Segment(OFF_DUTY, dt(0, 20), dt(1, 0), "Newark, NJ"),
        ]
        sheets = build_log_sheets(segs)
        self.assertEqual(len(sheets), 1)
        totals = sheets[0]["totals"]
        self.assertAlmostEqual(totals["off_duty"], 10.0)
        self.assertAlmostEqual(totals["sleeper"], 1.75)
        self.assertAlmostEqual(totals["driving"], 7.75)
        self.assertAlmostEqual(totals["on_duty"], 4.5)
        self.assertAlmostEqual(sum(totals.values()), 24.0)
        self.assertEqual(sheets[0]["total_miles"], 350)


def run(leg1_miles, leg2_miles, cycle_used, mph=55.0):
    legs = [
        {"from": "A", "to": "B", "miles": leg1_miles, "hours": leg1_miles / mph},
        {"from": "B", "to": "C", "miles": leg2_miles, "hours": leg2_miles / mph},
    ]
    return plan_trip(legs, cycle_used, start_date=D)


class SimulatorTest(unittest.TestCase):
    def test_short_trip_single_day(self):
        sim, summary = run(100, 200, 0)
        self.assertEqual(summary["num_days"], 1)
        self.assertEqual(summary["num_rests"], 0)
        self.assertEqual(summary["num_fuel_stops"], 0)
        # driving (quantized to 15-min ticks) + pickup + dropoff land in the cycle
        q = lambda h: max(0.25, round(h * 4) / 4)
        expected_cycle = q(100 / 55.0) + q(200 / 55.0) + 2.0
        self.assertAlmostEqual(summary["cycle_used_end"], expected_cycle, places=2)

    def test_break_inserted_after_8h_driving(self):
        # 500 mi to pickup at 55 mph is ~9.1 h driving: a 30-min break must
        # appear after exactly 8 h of driving.
        sim, _ = run(500, 50, 0)
        breaks = [s for s in sim.segments if s.note == "30-min break"]
        self.assertEqual(len(breaks), 1)
        driven_before = sum(
            s.duration_hours for s in sim.segments
            if s.status == DRIVING and s.end <= breaks[0].start
        )
        self.assertAlmostEqual(driven_before, 8.0, places=4)

    def test_11h_limit_forces_10h_rest(self):
        sim, summary = run(100, 900, 0)  # ~18.2 h total driving
        rests = [s for s in sim.segments if s.note == "10-hour rest"]
        self.assertGreaterEqual(len(rests), 1)
        # no continuous-driving stretch may exceed 11 h between rests
        driven = 0.0
        for s in sim.segments:
            if s.status == DRIVING:
                driven += s.duration_hours
                self.assertLessEqual(driven, C.DRIVING_LIMIT + 1e-6)
            elif s.note == "10-hour rest":
                driven = 0.0

    def test_14h_window_not_exceeded_by_driving(self):
        sim, _ = run(400, 800, 0)
        window_start = None
        for s in sim.segments:
            if s.note in ("10-hour rest", "34-hour restart"):
                window_start = None
            elif s.status in (DRIVING, ON_DUTY):
                if window_start is None:
                    window_start = s.start
                if s.status == DRIVING:
                    hours_in = (s.end - window_start).total_seconds() / 3600
                    self.assertLessEqual(hours_in, C.WINDOW_LIMIT + 1e-6)

    def test_fuel_stops_every_1000_miles(self):
        _, summary = run(200, 2300, 0)  # 2500 mi -> fuel at 1000 and 2000
        self.assertEqual(summary["num_fuel_stops"], 2)

    def test_cycle_exhaustion_forces_34h_restart(self):
        sim, summary = run(100, 500, 68)  # only 2 cycle hours left
        restarts = [s for s in sim.segments if s.note == "34-hour restart"]
        self.assertEqual(len(restarts), 1)
        self.assertAlmostEqual(restarts[0].duration_hours, 34.0)
        # cycle restarted: end value reflects only post-restart work
        self.assertLess(summary["cycle_used_end"], 70)

    def test_every_sheet_sums_to_24(self):
        for args in ((100, 200, 0), (500, 700, 10), (300, 2400, 30), (100, 500, 69)):
            sim, summary = run(*args)
            sheets = build_log_sheets(sim.segments)
            self.assertEqual(len(sheets), summary["num_days"])
            for sheet in sheets:
                self.assertAlmostEqual(
                    sum(sheet["totals"].values()), 24.0, places=2,
                    msg=f"sheet {sheet['date']} of trip {args}",
                )
                # segments tile the day continuously from 00:00 to 24:00
                self.assertEqual(sheet["segments"][0]["start"], "00:00")
                self.assertEqual(sheet["segments"][-1]["end"], "24:00")
                for a, b in zip(sheet["segments"], sheet["segments"][1:]):
                    self.assertEqual(a["end"], b["start"])

    def test_daily_miles_sum_to_trip_total(self):
        sim, summary = run(300, 2400, 0)
        sheets = build_log_sheets(sim.segments)
        self.assertAlmostEqual(
            sum(s["total_miles"] for s in sheets), 2700, delta=len(sheets)
        )

    def test_pickup_and_dropoff_take_one_hour_on_duty(self):
        sim, _ = run(100, 200, 0)
        notes = [(s.note, s.duration_hours) for s in sim.segments if s.status == ON_DUTY]
        self.assertIn(("Pickup", 1.0), notes)
        self.assertIn(("Drop-off", 1.0), notes)


class BuildTasksTest(unittest.TestCase):
    def test_no_fuel_under_1000(self):
        legs = [
            {"from": "A", "to": "B", "miles": 400, "hours": 8},
            {"from": "B", "to": "C", "miles": 599, "hours": 11},
        ]
        tasks = build_tasks(legs, 999)
        kinds = [getattr(t, "stop_type", None) for t in tasks]
        self.assertNotIn("fuel", kinds)

    def test_fuel_split_inside_first_leg(self):
        legs = [
            {"from": "A", "to": "B", "miles": 1200, "hours": 20},
            {"from": "B", "to": "C", "miles": 300, "hours": 6},
        ]
        tasks = build_tasks(legs, 1500)
        fuels = [t for t in tasks if getattr(t, "stop_type", "") == "fuel"]
        self.assertEqual(len(fuels), 1)
        # total drive miles preserved across the split
        drive_miles = sum(t.miles for t in tasks if hasattr(t, "miles") and hasattr(t, "mph") is False and hasattr(t, "from_label"))
        self.assertAlmostEqual(drive_miles, 1500, delta=2)


if __name__ == "__main__":
    unittest.main()
