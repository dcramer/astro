# Calibration Index Log

This page is the running ledger for our calibration masters. Use it to remember when to rebuild libraries and to spot drift before it sneaks into live profiles.

### Refresh calendar
- March 15 + September 15: rebuild master dark and dark-flat libraries (cool vs warm observing seasons).
- January 5: refresh bias masters, or sooner if you touch firmware/driver/readout settings.
- Any time gain/offset/sensor mode/temperature changes, schedule a calibration run within 48 hours and note it here.

### Master library metrics template
| Date | Preset (Gain/Offset/Mode) | Frame Type | Exposure (s) | Mean ADU | Median ADU | Hot Pixels (>5σ) | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| _Add rows after each calibration session_ | | | | | | | |

### Logging habits
- Record PixInsight ImageIntegration stats (mean, median, hot pixel count) for every master and paste the highlights into the table (or link out to a CSV if that’s easier).
- Drop the PixInsight `.xrs` log path in the Notes column so future you can see the rejection settings.
- Flag any metric that drifts >10% from the previous entry with the same preset, then plan an early refresh.

### Ongoing maintenance
- Update the table right after each calibration session and reference the git commit that introduced the new masters.
- Each December, double-check the calendar reminders against the coming season’s schedule and maintenance windows.
