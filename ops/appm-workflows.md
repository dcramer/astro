# APPM All-Sky Modelling Playbook

This runbook captures the workflows we follow when building, verifying, and troubleshooting Astro-Physics Point Mapper (APPM) models that backstop N.I.N.A. automation and unguided imaging.

## Scope and Prerequisites
- **Software**: APCC Pro 1.9.7.17 or later with APPM and Dec Arc tracking licenses enabled; AP V2 ASCOM driver 5.60.06+; configured plate solver (ASTAP, PlateSolve2, PinPoint full, or TheSkyX Image Link). See the APPM version history and feature overview for current requirements ([Astro-Physics](https://www.apastrosoftware.com/help/apcc-pro/version_history.htm), [Sirius Imaging](https://www.siriusimaging.com/Help/APCC/features.htm)).
- **Hardware setup**: Mount homed or parked, optics balanced, cables strain-relieved, temperature and pressure telemetry available when possible so refraction terms stay accurate ([Astro-Physics](https://www.apastrosoftware.com/help/apcc-pro/appm_overview.htm)).
- **Session prep**: Warm start by slewing near zenith and running a plate solve with both *Recal* and *Recenter* enabled to synchronize the controller before mapping ([Astro-Physics](https://www.apastrosoftware.com/help/apcc-pro/appm_run_menu.htm)).

## Standard All-Sky Model Build
1. **Load or create mapping grid**: Use the Measurement Points tab to select an all-sky grid sized for the payload; for unguided automation we typically map 200-300 points per pier side so interpolation stays smooth (internal practice) ([Astro-Physics](https://www.apastrosoftware.com/help/apcc-pro/appm_overview.htm), [Sirius Imaging](https://www.siriusimaging.com/Help/APCC/features.htm)).
2. **Enable guiding options**: Check *Recal near Zenith at Start* and confirm exposure, binning, timeout, and image scale settings match the current optics so plate solves converge reliably ([Astro-Physics](https://www.apastrosoftware.com/help/apcc-pro/appm_platesolve_settings_tab.htm)).
3. **Run the model**: Start the mapping run and monitor the Good/Bad solve counters in the Run tab; investigate repeated failures immediately to avoid corrupting the point cloud ([Astro-Physics](https://www.apastrosoftware.com/help/apcc-pro/appm_run_menu.htm)).
4. **Install in APCC**: After the run completes, push the new dual-sided model into APCC and enable both pointing and tracking corrections. Confirm Dec Arc tracking is active once you have adequate declination coverage ([Astro-Physics](https://www.apastrosoftware.com/help/apcc-pro/advanced_pointing_model.htm), [Sirius Imaging](https://www.siriusimaging.com/Help/APCC/pointing_model_window.htm)).

## Verify Before Imaging
- **Quick Verify**: Run APPM in *Verify Pointing Model* mode with 30-40 points per pier side to sample the sky quickly and confirm the residuals sit inside expectations ([Astro-Physics](https://www.apastrosoftware.com/help/apcc-pro/appm_run_menu.htm)).
- **5x Verify for repeatability**: When chasing sub-arcminute accuracy or diagnosing flexure, select *Model 5x and Park* so APPM repeats the verify set five times and highlights persistent outliers ([Astro-Physics](https://www.apastrosoftware.com/help/apcc-pro/appm_run_menu.htm)).
- **Log management**: Use the APCC Log Zipper after a 5x verify run to archive solver logs alongside the uploaded model for regression tracking ([Astro-Physics](https://www.apastrosoftware.com/help/apcc-pro/appm_run_menu.htm)).

## Polar Alignment Touch-Up
- Capture a targeted 25-30 point map and read the azimuth and altitude offsets inside the APCC Pointing Model window. Apply mechanical adjustments, then rebuild the main model to fold the correction into the all-sky solution ([Astro-Physics](https://www.apastrosoftware.com/help/apcc-pro/advanced_pointing_model.htm)).

## Understanding RA/Dec Delta Metrics
- Each APPM data point stores the gap between the commanded coordinates and the plate-solved position; APPM reports that gap separately as RA delta and Dec delta in arcseconds ([Astro-Physics](https://www.apastrosoftware.com/help/apcc-pro/appm_platesolve_settings_tab.htm)).
- APCC rejects models whose RMS residual exceeds 500 arcseconds (about 8.3 arcminutes), so routinely seeing deltas near or above that threshold signals a major calibration or alignment fault ([Astro-Physics](https://www.apastrosoftware.com/help/apcc-pro/version_history.htm), [Sirius Imaging](https://www.siriusimaging.com/Help/APCC/pointing_model_window.htm)).
- *Practical guidance (internal inference)*: For unguided imaging we target verify-run RA and Dec deltas under 60 arcseconds so the residual drift remains under a few pixels at common imaging scales. Treat higher values as a trigger to rerun the troubleshooting checklist below.

## Troubleshooting >1 Arcminute Residuals
1. **Confirm reference frame**: Re-run plate solve with *Recal* and *Recenter* before restarting APPM to clear index errors ([Astro-Physics](https://www.apastrosoftware.com/help/apcc-pro/appm_run_menu.htm)).
2. **Check polar alignment**: Use the quick 25-30 point map to quantify azimuth and altitude errors and adjust the mount before rebuilding the main model ([Astro-Physics](https://www.apastrosoftware.com/help/apcc-pro/advanced_pointing_model.htm)).
3. **Inspect plate solving**: Verify exposure, binning, field of view, and image scale settings so the solver returns reliable residuals ([Astro-Physics](https://www.apastrosoftware.com/help/apcc-pro/appm_platesolve_settings_tab.htm)).
4. **Identify mechanical contributors**: Inspect for flexure, sagging camera trains, or cable drag in the sky regions that show persistent outliers ([Astro-Physics](https://www.apastrosoftware.com/help/apcc-pro/advanced_pointing_model.htm)).
5. **Run a 5x verify**: Repeat the verify set five times to confirm whether the outliers are repeatable (mechanical) or random (environmental) before the next full mapping run ([Astro-Physics](https://www.apastrosoftware.com/help/apcc-pro/appm_run_menu.htm)).

## Recording Results
- Document model date, time, point count, pier sides, verify statistics (mean and max RA/Dec delta), polar adjustments, and any mechanical fixes. Store APPM logs and APCC model files under `ops/` for traceability ([Astro-Physics](https://www.apastrosoftware.com/help/apcc-pro/appm_overview.htm)).
- Log unguided exposure tests and residual summaries in session notes so regressions are easy to spot in future seasons ([Sirius Imaging](https://www.siriusimaging.com/Help/APCC/features.htm)).

## References
- Astro-Physics, "APPM Run Menu," accessed September 23, 2025: https://www.apastrosoftware.com/help/apcc-pro/appm_run_menu.htm
- Astro-Physics, "APPM Overview," accessed September 23, 2025: https://www.apastrosoftware.com/help/apcc-pro/appm_overview.htm
- Astro-Physics, "APPM Plate Solve Settings," accessed September 23, 2025: https://www.apastrosoftware.com/help/apcc-pro/appm_platesolve_settings_tab.htm
- Astro-Physics, "Advanced Pointing Model," accessed September 23, 2025: https://www.apastrosoftware.com/help/apcc-pro/advanced_pointing_model.htm
- Astro-Physics, "APCC Version History" (v1.9.7.17), accessed September 23, 2025: https://www.apastrosoftware.com/help/apcc-pro/version_history.htm
- Sirius Imaging, "APCC Features," accessed September 23, 2025: https://www.siriusimaging.com/Help/APCC/features.htm
- Sirius Imaging, "APCC Pointing Model Window," accessed September 23, 2025: https://www.siriusimaging.com/Help/APCC/pointing_model_window.htm
