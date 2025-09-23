# N.I.N.A. Bias and Calibration Frames

## Purpose
Document the repeatable process for capturing bias, dark-flat, and dark frame libraries so the Advanced Sequencer can automate calibration set selection and keep masters aligned with current camera gain, offset, and temperature presets.

## At a Glance
- Bias targets: take 200+ zero-second exposures at the lowest possible readout overhead; discard the first 10 to purge driver warm-up artifacts.
- Dark-flat targets: reuse flat exposure times per filter and gain; capture 30-50 frames per exposure duration to match the Flat Wizard's trained library.
- Dark targets: record 30-50 frames per canonical light exposure length (e.g., 180 s broadband, 300 s narrowband) at the same temperature, gain, and offset as the lights.
- Cool the camera to the production setpoint before every run (typically -10 deg C); keep the delta within +/-0.3 deg C while sequences execute.
- Build masters in PixInsight WBPP or PixInsight ImageIntegration immediately after each run and archive the integration logs with the calibration FITS files.

## Refresh cadence
- Rebuild master dark and dark-flat libraries at least twice per year (cool- and warm-season sets) or any time amp glow, hot-pixel density, or exposure times change materially.
- Regenerate master biases annually and after any firmware, driver, or readout mode change; bias drift is minimal on modern cooled CMOS cameras, but replacements catch shifts introduced by maintenance.
- Spot-check mean, median, and hot-pixel counts from the latest masters against the calibration index log (`ops/calibration-index.md`); schedule an early refresh if thermal noise or pattern artifacts trend upward.
- When imaging presets change (new gain/offset, sensor mode, or temperature setpoint), capture fresh calibration frames immediately rather than reusing existing masters.

## Prerequisites
- N.I.N.A. 3.x with the Advanced Sequencer and Flat Wizard enabled; Sequencer Powerups plugin installed for template reuse.
- Camera connected and stable within a dark environment (covered telescope with cap, or camera cooled and attached to a dark box) to prevent light leaks during dark and bias captures.
- Staging N.I.N.A. profile configured with calibration-only equipment profile and output folder pointing to the shared calibration library volume.
- Flat Wizard training table up to date so dark-flat sequences can pull exposure metadata per filter.
- Camera driver offsets (hardware binning, USB limit, readout mode) saved in the production profile to avoid mismatch when applying the masters.

## Workflow

### 1. Plan the calibration set
1. List active imaging presets (gain/offset, sensor mode) for the upcoming season. Maintain a table in the session log to ensure each preset has a fresh master set.
2. For each preset, note the required light exposure lengths (per filter) so matching darks and dark flats can be captured without extra configuration later.
3. Confirm storage availability in the calibration library directory; allocate subfolders per date (e.g., `Calibration/2025-09-23/bias`, `.../dark-180s`).

### 2. Prepare the camera and environment
1. Mount the dust cap or install the camera on the dark box. Wrap the focuser drawtube or adapters with opaque cloth to block stray light.
2. Power on cooler and request the production setpoint (usually -10 deg C); allow 10 minutes for the sensor to stabilize and monitor the temperature graph in N.I.N.A.
3. Disable dithering, autofocus, and guiding instructions in the staging profile; keep only camera, filter wheel, and flat panel connections active if needed for metadata.

### 3. Capture master bias frames
1. Load the `Calibration -> Bias` Advanced Sequencer template (create one if missing) with a loop for 220 exposures at 0 s exposure time.
2. Set the camera readout mode, gain, and offset to match the light presets. Ensure `Use overscan` remains disabled unless your processing pipeline supports it.
3. Start the sequence. After completion, delete the first 10 frames (pre-charge stabilization) and spot-check several FITS headers to confirm `EXPTIME = 0` and `CCD-TEMP` within +/-0.3 deg C of target.
4. Integrate the remaining frames in PixInsight: use `ImageIntegration` with average combination, scale estimator = `Biweight midvariance`, pixel rejection = `Winsorized Sigma Clipping`. Save the master as `master-bias_GAINxxx_OFFSETyyy_T-10C.fit`. Export the integration `.xrs` log next to the master.

### 4. Capture dark-flat libraries
1. Pull the latest Flat Wizard exposure table (Equipment -> Flat Panel -> **Trained Flat Exposure Times**) and export it to CSV for reference.
2. In the Advanced Sequencer, build a `Calibration -> Dark Flats` loop that iterates over each filter entry, sets the exposure to the trained value, and records 40 frames per exposure duration.
3. Enable "Cooldown between groups" if your camera benefits from settling time; otherwise maintain continuous capture for efficiency.
4. After the run, sort captures into subdirectories named by filter and exposure (e.g., `darkflat_Ha_5.4s`). Integrate each stack in PixInsight with the same settings as the bias, and name masters `master-darkflat_FILTER_5p4s_GAINxxx_OFFSETyyy_T-10C.fit`.

### 5. Capture dark frame libraries
1. Duplicate your primary imaging sequence and strip slews, autofocusing, and plate solving, leaving only camera exposures at the target durations.
2. Configure loops per exposure length (e.g., 30 frames at 180 s, 30 frames at 300 s). Ensure `Temperature` lock, `Gain`, and `Offset` match the corresponding light template.
3. Run the sequence. Watch the cooler load; pause if power draw exceeds 85% to avoid temperature drift.
4. Integrate each exposure set separately. Use the same integration parameters as bias/dark flats but enable `Scale` rejection for long exposures if hot pixels bloom. Save masters as `master-dark_180s_GAINxxx_OFFSETyyy_T-10C.fit` and archive the logs.

### 6. Archive and register masters
1. Copy masters and integration logs to the calibration library under dated folders. Update the calibration index log (`ops/calibration-index.md`) with the new paths, exposure lengths, and validation notes.
2. Import the masters into the staging N.I.N.A. profile: Settings -> General -> Calibration Frames -> add entries pointing to the new master bias, dark flats, and darks per preset.
3. Run a simulator sequence or a short live test (plate-solve a calibration target) to confirm N.I.N.A. references the new masters automatically.
4. Record the run in the session log and mention simulator or live validation in the next commit message/PR notes.

## Validation Checklist
- Bias, dark-flat, and dark master mean and standard deviation align with previous season values; investigate deviations >10%.
- Master FITS headers contain correct keywords: `EXPTIME`, `CCD-TEMP`, `GAIN`, `OFFSET`, `FILTER` (for dark flats) so the sequencer can route them.
- PixInsight integration logs stored next to masters and referenced in the calibration index log (`ops/calibration-index.md`).
- Staging profile sequences completed without error; Advanced Sequencer picked up the masters via calibration library paths.

## Troubleshooting
- **Temperature drift >0.5 deg C** - Increase cooler headroom (lower ambient, raise target temperature slightly) or add soak time between sequences. Reject frames where `CCD-TEMP` falls outside tolerance.
- **Light leaks or gradients in darks** - Inspect camera adapters and dark box; add additional blackout cloth or remove dew heater power during captures.
- **Hot pixel bursts after driver updates** - Reinstall the camera driver or lower the USB speed slider; regenerate the master bias before reusing darks.
- **Mismatched master applied to lights** - Verify the calibration frame directories in N.I.N.A. and ensure filters or exposure lengths are not reusing stale filenames.

## References
- Nighttime Imaging 'N' Astronomy Documentation, "Calibration Frames" and "Advanced Sequencer," accessed 23-Sep-2025.
- PixInsight Resources, "ImageIntegration Process," build 1.8.9 guidance, accessed 23-Sep-2025.
- ZWO Technical Note, "Recommended Dark/Bias Frame Counts," rev. 2024-11.
