# N.I.N.A. Dark Library Playbook

## Why this exists
- The ASI6200MM Pro's Sony IMX455 sensor is exceptionally clean, but lab measurements still show a persistent population of warm pixels (~0.024%) that only calibrate out with matched dark frames.[PASP 2023]
- Dark current stays low when the cooler holds a fixed setpoint, yet it rises by an order of magnitude between -10 C and +5 C in peer measurements of IMX455-class cameras. A consistent dark library prevents those temperature swings from leaking into your lights.[Moravian 2024]

## Rig baseline
- Camera: ZWO ASI6200MM Pro cooled mono, operated at -10 C unless summertime loads require -15 C.
- Sequencer: N.I.N.A. 3.x Advanced Sequencer with Sequencer Powerups Template by Reference.
- Optics: SVX152T imaging train with dark-cap position in the ZWO 7x2" wheel for hands-off calibration.
- Profiles: Staging profile handles capture; production profile only consumes published masters.

## Calibrated exposure sets
| Light use case | Filters | Exposure(s) | Gain/offset | Library target |
|----------------|---------|-------------|-------------|----------------|
| Broadband LRGB | L filter | 120 s | Gain 0 / Offset 50 | 32-frame master per exposure |
| SHO narrowband | Ha, OIII, SII | 300 s, 600 s | Gain 100 / Offset 50 | 32-frame master per duration |
| Short-focus tests | Any | 60 s | Gain 0 / Offset 50 | 20-frame master (optional) |

> Adjust or add rows whenever a template introduces a new exposure length, gain, or sensor mode.

The frame counts align with industry guidance (>=30 subs) to push down dark-current shot noise before subtraction.[Sky&Telescope 2024; High Point 2025]

## Refresh cadence
- **Seasonal baseline** - Capture a full set each March and September to bracket ambient extremes.
- **Trigger refresh** - Rebuild on sensor firmware/driver updates, new gain/offset presets, cooler performance changes >1 C, or when hot-pixel counts drift >10% versus the previous season.
- **Emergency refresh** - Any time cosmetic correction fails or a new light sequence won't accept the current master.

## Capture workflow
1. **Prep** - Load the calibration-only equipment preset, park the scope, engage the dark-cap slot, and cool to the chosen setpoint with <=0.3 C variance for ten minutes.
2. **Sequencer sanity check** - In Advanced Sequencer, run `Calibration -> Dark Library` (clone of your light plan with slews/platesolves removed). Confirm per-duration loops use the counts above and have "End of sequence" cooldown disabled.
3. **Run** - Monitor cooler load (<85%) and log `TEC %, CCD-TEMP, GAIN, OFFSET` from the device panel midway through each loop.
4. **On-the-fly QA** - Spot-check a few frames in Fits Liberator or PixInsight; abort and restart a block if you see light leaks or temperature excursions.

## Post-processing & handoff
1. Integrate each set in PixInsight's ImageIntegration (or WBPP) with `Sigma Low=4`, `Sigma High=3`, and output masters plus `.xrs` logs beside the stacked FITS.
2. Run `jq empty` across the metadata JSON and template exports touched by the refresh before staging a pull request.
3. Save masters following the folder structure in [image-organization.md](image-organization.md). The folder names encode all metadata (dates, temp, gain, exposure).
4. Import masters into the staging N.I.N.A. profile (Settings -> General -> Calibration Frames) and run a simulator job that references every duration. Document the result in session notes.

## Storage & retention
- Keep both the integrated master and the raw subframes for at least one season so you can rebuild if a future stack needs different rejection parameters.
- Follow the folder structure defined in [image-organization.md](image-organization.md):
  - Raw darks: `/mnt/astro/calibration/darks/[exposure]s_[temp]_g[gain]_o[offset]/[YYYY-MM-DD]/`
  - Masters: `/mnt/astro/masters/darks/[exposure]s_[temp]_g[gain]_o[offset]/master_dark_[YYYY-MM-DD].xisf`
- Mirror the library to the NAS overnight; note checksum mismatches in the calibration index.

## Health monitoring
- Log median ADU and hot-pixel counts (pixels >5 sigma) during each refresh. If medians climb >15% at the same setpoint, schedule cooler service or investigate desiccant changes.
- When ambient highs exceed the cooler's delta T, schedule an interim run at -15 C and mark the masters clearly so templates pull the right set.

## References
- Scientific CMOS Sensors in Astronomy: IMX455 and IMX411, PASP 135, 055001 (2023).[PASP 2023]
- Johnson & Wake, Quantifying the performance of a Moravian C3-61000 IMX455 CMOS Camera, AAS Meeting #243 (2024).[Moravian 2024]
- Richard Wright, "Dark Frames and Bias Frames Demystified," Sky & Telescope (updated April 2024).[Sky&Telescope 2024]
- High Point Scientific, "Understanding Calibration Frames" (2025).[High Point 2025]
