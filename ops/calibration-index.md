# Calibration Index Log

## Purpose
Track calibration master refresh deadlines and summarize quality metrics so we can spot drift before it impacts live imaging profiles.

## Refresh Calendar
- Create two recurring calendar events: March 15 and September 15 each year to rebuild master dark and dark-flat libraries (aligns with cool/warm observing seasons).
- Add an annual January 5 reminder to regenerate master bias frames or immediately after any camera firmware, driver, or readout mode change.
- When imaging presets change (new gain, offset, sensor mode, or temperature setpoint), schedule an ad-hoc calibration run within 48 hours and record it below.

## Master Library Metrics Template
| Date | Preset (Gain/Offset/Mode) | Frame Type | Exposure (s) | Mean ADU | Median ADU | Hot Pixels (>5 sigma) | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| _Add rows after each calibration session_ | | | | | | | |

## Logging Guidelines
- Record PixInsight ImageIntegration statistics (mean, median, hot pixel count) for every master generated; update the table above or maintain one row per file in an external CSV if preferred.
- Attach the corresponding PixInsight `.xrs` log path in the Notes column so future reviews can trace rejection parameters.
- If any metric drifts by more than 10% relative to the previous entry for the same preset, flag the entry and plan an earlier refresh.

## Maintenance
- Update the table immediately after each calibration session and cross-link commits that introduced new masters.
- Review calendar reminders each December to confirm they align with the upcoming observing schedule and planned maintenance windows.
