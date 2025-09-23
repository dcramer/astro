# N.I.N.A. Flats

These notes walk through how we shoot panel flats in N.I.N.A. without turning it into a rigid SOP. Bring your flat panel, the Flat Wizard, and a few minutes at the end of an imaging night.

### Quick hits
- Aim for a histogram mean near 40 % (~26k ADU on 16‑bit cameras) with ±10 % wiggle room. Bump to ±15 % if the sky or panel drifts fast.
- Keep exposures ≥1 s so LED banding stays away; broadband usually lands around 2–6 s and narrowband can stretch to 10–20 s.
- Panel stuck at one brightness? Use Dynamic Exposure. Panel can dim per filter? Switch to Dynamic Brightness. Save Sky Flats for true emergencies.
- Every successful run should update the Trained Flat Exposure table so the sequencer knows the current timings.

### Before you start
- N.I.N.A. 3.x with Flat Wizard + Advanced Sequencer enabled (staging profile first, please).
- Flat panel online via ASCOM (Pegasus FlatMaster works nicely) or your preferred controller.
- Imaging train untouched since the lights: filters, rotator angle, focus, and dust pattern should all match.
- Dark room or panel shroud ready so daylight or porch lights don’t leak in.

### My run flow
1. **Button up the optics** – Leave the camera at the same cooled setpoint you used for lights. If the panel still forces <1 s exposures, add a diffuser (white acrylic sheet or double T‑shirt layer).
2. **Dial the panel** – Open Equipment ▸ Flat Panel, confirm the connection, and save brightness levels that yield ≥1 s for broadband and ≥3 s for narrowband. Manual panels: jot the dial values before diving into the wizard.
3. **Program Flat Wizard** – Launch the wizard in Multi Mode for a full filter sweep or Single Mode for quick touch-ups. Pick Dynamic Exposure or Dynamic Brightness as mentioned above. For each filter, set min exposure = 1 s (raise if banding sticks), max exposure = 6 s broadband / 10–20 s narrowband, mean target = 40 %, tolerance = 10 % (15–20 % if you’re stuck doing sky flats). Enable “Take darks” so matching dark flats follow automatically. Hit Start and watch the histogram—no clipping allowed.
4. **Let the sequences run** – Each filter typically needs 25–30 frames. When the wizard flips to dark flats, cover or turn off the panel first. After the run, hop into Equipment ▸ Flat Panel ▸ Trained Flat Exposure Times and confirm the table saved the right exposure + brightness. Clean out any oddball entries (different binning, experimental filters) so the sequencer doesn’t chase ghost values.
5. **Validate + stash** – Inspect a sample flat in the Statistics pane: mean near target, smooth standard deviation, no gradients. If you’ve got time, run a quick calibration stack (lights ▸ flats ▸ dark flats) to confirm vignetting and dust motes vanish without overcorrection. File the flats in the shared calibration library with date, filter, gain, offset, and panel brightness notes, plus mention any sim/live test in the session log.

### Troubleshooting cheat sheet
- **Banding or stripes** – Stretch exposures past 1 s with extra diffusion or lower panel brightness.
- **Wizard can’t converge** – Extend max exposure, brighten the panel, or relax tolerance to ~15 %. For sky flats, restart if illumination shifts more than a stop.
- **Over-corrected lights** – Double-check focus/rotation/filter match and confirm the mean stayed close to 40 %. Make sure the correct dark flats were applied.
- **Multiple exposures per filter** – Trim stale rows from the Trained Flat Exposure table so Target Scheduler doesn’t request mismatched dark flats.

### References to keep handy
- [Nighttime Imaging 'N' Astronomy docs: “Flat Wizard” + “Flat Panel”](https://nighttime-imaging.eu/docs/) (accessed 2025-09-23).
- [Pegasus Astro: “Flat Calibration Frames Howto”](https://pegasusastro.com/) (published 2024-07-26).
- [Target Scheduler docs: “Target Scheduler Flats”](https://nighttime-imaging.eu/docs/) (accessed 2025-09-23).
