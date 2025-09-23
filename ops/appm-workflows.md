# APPM All-Sky Modelling Notes

When the mount needs a fresh pointing model, this is the playbook I reach for. It keeps APPM runs predictable without sounding like a dry SOP.

### Gear check before you launch APPM
- APCC Pro 1.9.7.17+ with the APPM and Dec Arc licenses unlocked.
- AP V2 ASCOM driver 5.60.06 or newer pointing at the same COM/IP that APCC uses.
- Plate solver in working order (ASTAP, PlateSolve2, PinPoint, or TheSkyX Image Link).
- Mount parked, optics balanced, cables tidy, and—if available—temperature/pressure telemetry feeding APCC so refraction terms behave.
- Warm start: slew near zenith, run a plate solve with both `Recal` and `Recenter` to sync the controller.

### Building the model without drama
Pick the all-sky grid that fits tonight’s payload. For unguided automation we usually map 200–300 points per pier side to keep interpolation smooth. In the Measurement Points tab enable `Recal near Zenith at Start`, then double-check exposure, binning, timeout, and image scale so the solver nails focus right away. Kick off the run and keep an eye on the Good/Bad counters—if solves start failing, pause and fix the issue before the point cloud goes sideways. When the pass finishes, push the model into APCC, enable pointing + tracking corrections, and confirm Dec Arc tracking flips on once you’ve covered enough declination.

### Quick confidence pass
Before you cut to lights, flip APPM into *Verify Pointing Model*. Thirty to forty samples per pier side is enough to confirm residuals behave. Chasing sub-arcminute unguided work? Use *Model 5x and Park* so APPM repeats the verify set five times—persistent outliers pop right out. Wrap each run with APCC Log Zipper so you have the plate-solve receipts next to the installed model.

### Polar alignment touch-up (optional but fast)
Grab a targeted 25–30 point map, read the azimuth/altitude offsets in APCC, and turn the Mach2 knobs using the cheat sheet below. Apply half the correction, rerun the mini-map, then finish the adjustment. Anything under ~1 arc-minute on both axes is good enough to hand off to TPPA for the final tweak.

### RA/Dec delta sanity targets
APPM reports the gap between commanded vs plate-solved coordinates as separate RA and Dec deltas. APCC throws out models with RMS >500 arc-seconds (~8.3 arc-minutes), but we aim much tighter: keep verify-run RA and Dec deltas under 60 arc-seconds so unguided subs stay crisp. Seeing higher numbers is my cue to run the troubleshooting checklist below.

### If residuals blow past an arc-minute
1. Re-run a plate solve with `Recal` + `Recenter` to clear any sync funk before restarting APPM.
2. Knock out a quick polar check, adjust the mount, then rebuild the main model.
3. Inspect plate-solver settings—exposure too short, wrong binning, or bad image scale will tank residuals.
4. Walk the rig for flexure or cable drag where the outliers live.
5. Run the 5x verify loop to separate repeatable mechanical issues from random seeing spikes before you burn another full-sky pass.

### Logging what matters
Drop the essentials into the session log: date, point count per pier side, verify stats (mean/max RA/Dec delta), any polar tweaks, and mechanical fixes. Archive the APPM log bundle and APCC model files under `ops/` so we can rewind later. If you tested unguided exposures post-model, add the residual drift numbers too.

### Knob conversion cheat sheet
- Azimuth: one full turn ≈ 42′, one tick ≈ 6′.
- Altitude at ~40° latitude: one full turn ≈ 71′, one tick ≈ 4.4′.

### References worth keeping around
- [Astro-Physics, "APPM Run Menu"](https://www.astro-physics.com/apcc) (accessed 2025-09-23).
- [Astro-Physics, "APPM Overview"](https://www.astro-physics.com/apcc) (accessed 2025-09-23).
- [Astro-Physics, "APPM Plate Solve Settings"](https://www.astro-physics.com/apcc) (accessed 2025-09-23).
- [Astro-Physics, "Advanced Pointing Model"](https://www.astro-physics.com/apcc) (accessed 2025-09-23).
- [Astro-Physics, "APCC Version History" (v1.9.7.17)](https://www.astro-physics.com/apcc) (accessed 2025-09-23).
- [Sirius Imaging, "APCC Features"](https://www.siriusimaging.com/) (accessed 2025-09-23).
- [Sirius Imaging, "APCC Pointing Model Window"](https://www.siriusimaging.com/) (accessed 2025-09-23).
