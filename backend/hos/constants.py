"""HOS limits for a property-carrying driver, 70 hr / 8 day cycle.

Sources: FMCSA "Interstate Truck Driver's Guide to Hours of Service"
plus the fixed assumptions from the assessment brief.
"""

# The four clocks (hours)
DRIVING_LIMIT = 11.0          # max driving between 10-hour resets
WINDOW_LIMIT = 14.0           # driving window after coming on duty
BREAK_AFTER_DRIVING = 8.0     # cumulative driving hours that trigger a 30-min break
CYCLE_LIMIT = 70.0            # on-duty hours in any 8 consecutive days

# Resets (hours)
BREAK_DURATION = 0.5          # 30 consecutive minutes, any non-driving status
DAILY_RESET = 10.0            # off duty / sleeper to reset clocks 1-3
CYCLE_RESTART = 34.0          # consecutive off-duty hours to reset the 70-hr cycle

# Brief assumptions
FUEL_INTERVAL_MILES = 1000.0  # fuel at least once every 1,000 miles
FUEL_STOP_HOURS = 0.5         # on duty (not driving); also satisfies the 30-min break
PICKUP_HOURS = 1.0            # on duty (not driving)
DROPOFF_HOURS = 1.0           # on duty (not driving)

# Trip scheduling assumptions (stated in the README / Loom)
TRIP_START_HOUR = 8.0         # driver starts the day at 08:00 after a full 10-hr reset
