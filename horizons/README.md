# Horizon Profiles

## Purpose
Track the horizon masks we rely on so automated sessions respect altitude limits at each site.

## Contents
- `.hrz` files exported from N.I.N.A. for each observing site.
- This README with acquisition and maintenance instructions.

## Capturing a Horizon

## Capturing a Horizon
1. Stand at the telescope location and record the skyline with a level compass/altitude device.
2. For a quick capture, open <https://rkinnett.github.io/gyrocam/> in a mobile browser (works well on iPhone). The app reports azimuth/altitude pairs as you sweep the horizon.
3. Export or transcribe the azimuth/altitude samples into a `.hrz` file following N.I.N.A.'s format: one sample per line (`Azimuth,Altitude` in degrees).
4. Import the profile in N.I.N.A. to validate the skyline, then commit the `.hrz` file here along with any obstacle notes in `ops/` if needed.

## Maintenance
- Re-measure after any construction, tree trimming, or mount relocation.
- Keep the latest profile synced to observatory machines via this repository.
- Reference horizon names inside sequencer templates when scheduling time-constrained targets.
