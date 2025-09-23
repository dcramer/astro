# N.I.N.A. Flats

## Purpose
Capture the repeatable procedure we use to build calibrated flat-field libraries in N.I.N.A. The workflow assumes a controllable flat panel and leverages the Flat Wizard and trained exposure tables so sequencer jobs can request flats automatically at the end of an imaging run.

## At a Glance
- Histogram mean target: 40% (~26,000 ADU on 16-bit cameras) with 10% tolerance for most filters; widen to 15% when sky conditions fluctuate quickly.
- Exposure guardrails: set the Flat Wizard minimum to 1 s to avoid LED panel banding, allow 2–6 s for broadband, and extend the maximum to 10 s (or more if needed) for 3 nm narrowband filters.
- Mode selection: use Dynamic Exposure when the panel brightness is fixed, Dynamic Brightness when the panel can dim per filter, and Sky Flats only when the panel is unavailable.
- Record every successful run in the Trained Flat Exposure table so the Advanced Sequencer and Target Scheduler instructions can reuse the timings per filter, gain, and brightness.

## Prerequisites
- N.I.N.A. 3.x with the Flat Wizard and Advanced Sequencer enabled; Flat Wizard settings updated for each active filter profile.
- Flat panel connected over ASCOM (Pegasus Astro FlatMaster driver recommended) or another supported interface with brightness control.
- Optical train fully assembled as during light acquisition: filters, rotator angle, reducer/flattener spacing, focus position, and dust state untouched since the last imaging session.
- Dark environment or panel shroud available so ambient light does not leak into the telescope during flats.
- Staging profile in N.I.N.A. available for validation captures prior to promoting settings to the live automation profile.

## Workflow

### 1. Prepare the optical train
1. Leave the imaging camera cooled to the operating setpoint to match dark-current conditions.
2. Confirm the focuser has not moved since the last set of lights; refocus only if you will rebuild the entire flat library.
3. Seal the dew shield with the panel or add a diffuser (white acrylic or double-layer T-shirt) if exposures will still be shorter than 1 s at the lowest panel brightness.

### 2. Configure the flat panel
1. Launch the panel’s ASCOM device configuration from N.I.N.A. (Equipment ▸ Flat Panel) and verify connectivity.
2. Set a per-filter brightness preset if the panel supports it (e.g., Pegasus FlatMaster brightness levels). Save brightness values that yield ≥1 s exposures for broadband and ≥3 s for narrowband filters.
3. If using a manual brightness control, note the dial positions in the runbook before starting the wizard.

### 3. Program Flat Wizard
1. Open the Flat Wizard (Imaging ▸ Flats) and select **Multi Mode** when running a full filter set; use **Single Mode** for quick updates.
2. Select Dynamic Exposure for fixed-brightness panels or Dynamic Brightness for motorised panels. Avoid Sky Flats unless you cannot use a panel; Sky Flats skip dark-flat capture and require monitoring changing sky flux.
3. For each enabled filter:
   - Set **Flat Min Exposure** = 1 s; increase to 2 s if residual banding persists.
   - Set **Flat Max Exposure** = 6 s for broadband, extending to 10–20 s for 3 nm narrowband if the panel is still dim at maximum brightness.
   - Leave **Histogram Mean Target** at 40% (~26k ADU). For narrowband, accept up to 45% if the panel cannot reach target brightness within max exposure.
   - Keep **Mean Tolerance** at 10% for panel flats. Increase to 15–20% when taking sky flats to account for changing illumination.
4. Enable **Take darks** for each exposure time so matching dark flats are acquired immediately after every filter’s flats.
5. Start the wizard. Monitor the preview histogram; ensure no pixels clip (Max ADU remains below 65,000 on 16-bit sensors).

### 4. Capture and record flats
1. Once the wizard locks in an exposure, let it complete the requested number of flats (typically 25–30 per filter).
2. When prompted, cover the panel (or turn it off) before the dark-flat sequence begins.
3. After the run, navigate to Equipment ▸ Flat Panel ▸ **Trained Flat Exposure Times** and confirm the wizard stored the exposure and brightness per filter. Edit any entries that relied on temporary adjustments (e.g., alternate binnings) so the sequencer references the correct values.
4. Update Target Scheduler or Advanced Sequencer templates to call the trained flat exposure instruction for each filter set, ensuring future sessions reuse the calibrated timings automatically.

### 5. Validate and archive
1. Spot-check a representative flat in N.I.N.A.’s image statistics: verify the mean matches the target, standard deviation is smooth, and no banding is visible when auto-stretched.
2. Calibrate a sample stack (lights ▸ flats ▸ dark flats) in your processing workflow or staging profile to confirm vignetting and dust motes disappear without introducing over-correction halos.
3. Store the new flats in the shared calibration library with date, filter, gain, offset, and panel brightness metadata. Note any simulator or live-test results in the session log.

## Troubleshooting
- **Banding or striping in flats** – Ensure exposures stay above 1 s; add additional diffusion or reduce panel brightness so the wizard lengthens the exposure. Persistent banding usually indicates the panel is still too bright at the minimum level.
- **Wizard loops without converging** – Expand the maximum exposure limit, raise panel brightness, or relax tolerance to 15%. For sky flats, restart the wizard if the illumination has changed more than one stop.
- **Over-correction in calibrated lights** – Recheck that flats were captured at the same focus, rotation, and filter as the lights. Verify mean ADU stayed near the 40% target and that the corresponding dark flats were applied.
- **Multiple exposure values per filter** – Delete stale rows in the Trained Flat Exposure table so Target Scheduler does not request mismatched dark flats. Keep only the current exposure/brightness pair.

## References
- Nighttime Imaging 'N' Astronomy Documentation, “Flat Wizard” and “Flat Panel,” accessed 23-Sep-2025.
- Pegasus Astro, “Flat Calibration Frames Howto,” published 26-Jul-2024.
- Target Scheduler Documentation, “Target Scheduler Flats,” accessed 23-Sep-2025.
