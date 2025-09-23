# Polar Alignment

## Purpose
Capture the repeatable steps we use to polar align the Astro-Physics Mach2GTO before an automated session. The workflow pairs APCC/APPM feedback for coarse tuning with N.I.N.A.'s Three Point Polar Alignment (TPPA) plugin for the final sub-arcminute adjustment.

## At a Glance
- **Target accuracy:** < 1 arc-min (broadband) or < 30 arc-sec (narrowband / unguided).
- **Default TPPA settings:** 10-20 deg sample distance, East direction, Start from current position = enabled, 3 s L filter exposure (adjust if ASTAP struggles).
- **Knob conversion cheat sheet:**
  - Azimuth: 1 turn = 42 arc-min, 1 tick = 6 arc-min.
  - Altitude (~40 deg latitude): 1 turn = 71 arc-min, 1 tick = 4.4 arc-min.
- **Reference docs:** APCC Pro Help (Mach2 polar alignment), TPPA FAQ (Three Point Polar Alignment plugin).

## Prerequisites
- Mach2GTO mounted on a level, well-set pier or tripod, altitude/azimuth adjusters unlocked, vibration sources removed.
- APCC Pro running with the Mach2 connected through the AP V2 ASCOM driver.
- APPM installed (ships with APCC Pro).
- N.I.N.A. 3.x with the TPPA plugin installed and a plate solver configured (ASTAP recommended for full-frame sensors). Ensure the main imaging camera is roughly focused and dew-free.
- Mount site coordinates, UTC offset, and time sync verified in both N.I.N.A. and the mount controller; clear stale sync/model terms if the mount was moved.
- Optional: guide camera disconnected during TPPA so only the primary optical axis is measured.

## Workflow

### 1. Rough mechanical alignment
1. Park or home the mount. If clutches are released, recenter the RA axis and lock it before measuring; confirm the pier/tripod is still solid after transport or temperature swings.
2. Aim the RA axis toward true north using RAPAS, a digital level, or a compass corrected for declination.
3. Dial azimuth with the Mach2 knobs using the cheat sheet above. Approach the final value from the same direction to keep the adjuster block preloaded.
4. Set altitude with the latitude lever. At ~40 deg latitude, use partial turns (eighth- or quarter-turns) and let gravity settle the plate before locking both sides.

### 2. Optional APCC alignment check
1. Build a quick 25-30 point APPM model on the current pier side (takes ~5 minutes).
2. Hover over the APCC polar alignment readouts to see altitude and azimuth offsets. Convert these into knob turns using the table above; apply half the correction, rebuild the model, then apply any residual offset.
3. Once both offsets are < 1 arc-min you can proceed to TPPA.

### 3. N.I.N.A. TPPA refinement
1. Open TPPA (Plugins -> Three Point Polar Alignment) and confirm your plate solver is ready. Pick the side of the sky with the clearest view (East or West) and set the sample distance to 10-20 deg. Enable "Start from current position" if the default start is blocked.
2. Double-check the mount and N.I.N.A. time/location entries, then clear any lingering sync points or models so TPPA works from a clean sky solution.
3. Confirm sidereal tracking is on, then press Start. TPPA grabs three plate solves by slewing/rotating the RA axis. If prompted for Manual Mode, slew RA ~20 deg at a low rate and confirm when the camera stops.
4. Use the live TPPA readout to dial altitude and azimuth bolts just as you would during the mechanical step: work in small increments, approach from the same direction, and wait for each solve to update.
5. Stop TPPA when total error is below your target threshold. If the run lasts more than ~15 minutes, rerun TPPA so the baseline solve is fresh.

### 4. Post-alignment close-out
- Re-enable tracking (TPPA stops it on completion) and slew to a bright test target to confirm guiding drift is gone.
- Log the residual error, knob turns, and conditions in the runbook (append a dated note) for later comparison.

## Troubleshooting
- **Plate solve fails** - Increase exposure to 3-5 s, switch to the L filter, and confirm ASTAP has the correct catalog for your sensor size.
- **Error drifts after adjustments** - Leave tracking on throughout the session. If the run exceeds ~15 minutes, restart TPPA to capture a fresh baseline frame.
- **TPPA aborts because of obstructions** - Reduce the sample distance, pick the opposite direction, or use Manual Mode to start from the current position.
- **Repeat runs disagree** - Verify only the RA axis moved between solves and that both altitude and azimuth bolts are preloaded in the same direction before letting go.
- **TPPA reports success but guiding still drifts** - Recheck that tracking is on and rebuild a short APPM model; residual model terms sometimes reveal remaining mechanical flex.
- **Solver noise from sky conditions** - Thin clouds, bright moonlight, or narrowband filters suppress SNR; swap to a broadband filter, bump exposure, or wait for clearer sky before re-running.

## References
- Astro-Physics, "Advanced Pointing Model and Polar Alignment," APCC Pro Help (accessed 23-Sep-2025).
- Astro-Physics, Mach1GTO Manual (az/alt knob increments) (accessed 23-Sep-2025).
- Astrobasics, "Aligning with N.I.N.A. using Plate Solving" (accessed 23-Sep-2025).
- Alpaca Benro Polaris documentation, "NINA 3 Point Polar Alignment" (accessed 23-Sep-2025).
- N.I.N.A. TPPA FAQ, GitHub repository `isbeorn/nina.plugin.polaralignment` (accessed 23-Sep-2025).
- Stargazers Lounge, "NINA and Three Point Polar Alignment frustrations" (posted 21-Nov-2024).
- Cloudy Nights, "Having issues using Three Point Polar Alignment in NINA" (posted 08-Feb-2022).
- Reddit r/AskAstrophotography, "Polar alignment precision" (posted 24-Nov-2024).
- Reddit r/AskAstrophotography, "Nina stops tracking after polar alignment" (posted 18-Sep-2023).
