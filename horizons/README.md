# Horizon Profiles

This folder stores horizon masks used by N.I.N.A. to enforce per-site altitude limits during automated sessions. Files use the `.hrz` format exported and imported via `Options → Imaging → Horizon`. Keep filenames descriptive (e.g., `sf.hrz` for the San Francisco site) and version them whenever the skyline changes.

## Capturing a Horizon
1. Stand at the telescope location and record the skyline with a level compass/altitude device.
2. For a quick capture, open <https://rkinnett.github.io/gyrocam/> in a mobile browser (works well on iPhone). The app reports azimuth/altitude pairs as you sweep the horizon.
3. Export or transcribe the azimuth/altitude samples into a `.hrz` file following N.I.N.A.'s format: one sample per line (`Azimuth,Altitude` in degrees).
4. Import the profile in N.I.N.A. to validate the skyline, then commit the `.hrz` file here along with notes on obstacles or tree lines in `docs/` if needed.

## Maintenance Tips
- Re-measure after any construction, tree trimming, or mount relocation.
- Keep the latest profile synced to observatory machines via this repository.
- Reference horizon names inside sequencer templates when scheduling time-constrained targets.
