# N.I.N.A. Bias, Dark Flats, and Darks

This is the calibration library loop I run whenever we refresh masters for the staging or production profiles. It keeps the Advanced Sequencer happy without burying us in ceremony.

### Fast facts
- Bias run: 200 zero-second frames, toss the first 10 to clear warm-up funk.
- Dark flats: reuse the Flat Wizard exposure table, 30–50 frames per entry so the trained library stays sharp.
- Darks: 30–50 frames per light exposure length (180 s broadband, 300 s SHO, etc.) at the same gain/offset/temperature as the lights.
- Cooler target: -10 °C (adjust to taste) with ±0.3 °C tolerance while the sequences run.
- Integrate everything in PixInsight (WBPP or ImageIntegration) right after capture and stash the `.xrs` logs beside the masters.

### Refresh rhythm
- Dark + dark-flat libraries: rebuild twice a year—once for cold season, once for warm season—or anytime amp glow, exposure lengths, or presets change.
- Bias masters: annual refresh plus after firmware/driver/readout tweaks.
- Spot-check mean/median/hot-pixel counts against `ops/calibration-index.md`; early refresh if any metric drifts >10%.
- New gain/offset/sensor mode or temperature? Capture fresh calibration data immediately; no recycling allowed.

### Before you press go
- Load N.I.N.A. 3.x with Advanced Sequencer + Flat Wizard + Sequencer Powerups.
- Park the camera in a dark environment (scope capped or dark box) and confirm no stray light leaks.
- Use the staging profile with the calibration-only equipment preset and output path pointed to the shared library.
- Double-check the Flat Wizard training table so dark-flat loops know the latest exposure per filter.
- Lock in the camera driver settings (binning, USB limit, readout mode) that match your light templates.

### Capture loop in practice
1. **Plan the set** – List the active presets (gain/offset/mode) and matching light exposure lengths. Create dated subfolders (`Calibration/2025-09-23/bias`, `…/dark-180s`, etc.) so files land in the right place.
2. **Stabilize the camera** – Cap the scope, cool to the target temperature, watch the graph for ~10 minutes, and disable guiding/dithering/autofocus extras in the sequencer.
3. **Bias run** – Launch the `Calibration → Bias` template configured for 220 frames at 0 s. After the run, delete the first 10 frames, sanity-check FITS headers (`EXPTIME = 0`, `CCD-TEMP` within tolerance), and integrate the rest. Name the master `master-bias_GAINxxx_OFFSETyyy_T-10C.fit` and save the integration log next to it.
4. **Dark flats** – Pull the Trained Flat Exposure table, then run a `Calibration → Dark Flats` loop that iterates filters/exposures and collects 40-ish frames per setting. If the camera likes a breather, enable “Cooldown between groups.” File the stacks by filter/exposure, integrate, and name them `master-darkflat_FILTER_5p4s_GAINxxx_OFFSETyyy_T-10C.fit` (adjust for your exposure).
5. **Darks** – Clone your light sequence, delete slews/focus/platesolve, leave only exposures grouped by duration (e.g., 30 × 180 s, 30 × 300 s). Keep an eye on cooler load <85%. Integrate each set; flip on `Scale` rejection if long exposures sprout hot pixels. Save as `master-dark_180s_GAINxxx_OFFSETyyy_T-10C.fit` plus logs.
6. **Archive + register** – Copy masters and logs into the dated folders, update `ops/calibration-index.md` with stats and paths, and wire the new masters into N.I.N.A. (Settings → General → Calibration Frames). Run a simulator sequence or short live check to confirm the sequencer grabs the new files automatically. Note the validation run in your session log or commit message.

### Quick validation list
- Means/standard deviations line up with previous season values (flag anything drifting >10%).
- FITS headers carry the key metadata (`EXPTIME`, `CCD-TEMP`, `GAIN`, `OFFSET`, `FILTER`).
- Integration logs stored next to each master and recorded in the calibration index.
- Staging profile simulation finishes cleanly with the new masters attached.

### Troubleshooting crib notes
- **Temperature drift >0.5 °C** – Raise the cooler setpoint a smidge or let the camera soak longer; drop frames outside tolerance.
- **Stray light gradients** – Check adapters/dust cap, kill the dew heater, or throw extra blackout cloth over the train.
- **Hot pixel spike after driver updates** – Reinstall the driver or drop USB speed, then rebuild the bias before trusting existing darks.
- **Wrong master applied** – Audit the calibration frame directory in N.I.N.A. and clean out stale filenames or filter mismatches.

### References on hand
- [Nighttime Imaging 'N' Astronomy docs: “Calibration Frames” + “Advanced Sequencer”](https://nighttime-imaging.eu/docs/) (accessed 2025-09-23).
- [PixInsight Resources: “ImageIntegration Process,” build 1.8.9 guidance](https://pixinsight.com/) (accessed 2025-09-23).
- [ZWO Technical Note: “Recommended Dark/Bias Frame Counts”](https://www.zwoastro.com/) (rev. 2024-11).
