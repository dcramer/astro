# N.I.N.A. SHO Sequencing

## Purpose
Document the standard operating procedure for planning and executing narrowband sulfur-hydrogen-oxygen (SHO) imaging runs in N.I.N.A., including filter cadence, exposure strategies, and plugin-driven automation. This guide answers the recurring question about luminance frames in SHO projects and keeps templates aligned with the Advanced Sequencer and Sequencer Powerups instructions.

## At a Glance
- SHO data relies on SII, Hα, and OIII masters; a separate luminance filter is optional because Hα typically serves as the synthetic luminance channel during processing.
- Target sub lengths between 300–600 s at unity gain for 3 nm filters under Bortle 5–7 skies; shorten to 180–240 s if stars clip or guiding drifts, extend to 900 s at darker sites (Bortle 3–4).
- Prioritize Hα when the moon is bright (>70% illumination) or near the target; collect OIII and SII during darker windows or near the meridian to mitigate gradients and airglow variability.
- Dither every 2–3 frames (or every filter switch) with guiding settled before resuming; pair with Sequencer Powerups “Smart Dither” so short exposures are not needlessly interrupted.
- Use filter-specific autofocus triggers (temperature or time-based) and maintain the filter offset table so the sequencer can refocus only after large offsets or temperature swings.
- Keep calibration libraries current: darks that match each exposure length/gain, flats per filter, and dark flats for every flat exposure to avoid narrowband amp glow artifacts.

## Prerequisites
- N.I.N.A. 3.x Advanced Sequencer with the Sequencer Powerups plugin installed and configured in the staging profile.
- Calibrated filter wheel offsets for SII, Hα, and OIII; stored in `Equipment ▸ Filters` with accurate backlash compensation.
- Guiding solution (PHD2 or equivalent) integrated through N.I.N.A.’s Guider interface, with dithering permissions granted to the sequencer.
- Recent calibration frames: matching-temperature dark library, SHO flats captured using the panel workflow, and dark flats or bias frames for each flat set.
- Updated weather, moon phase, and target visibility analysis completed in the session planning tool (e.g., Telescopius, N.I.N.A. Sky Atlas).

## Workflow

### 1. Session planning
1. Assess moon illumination and separation. Schedule OIII and SII blocks for darker portions of the night; allow Hα to cover bright phases when gradients are tolerable.
2. Compute required integration per channel. For balanced SHO color, plan at least 6 h per line (e.g., 36 × 600 s) or skew toward Hα (40/30/30%) when structural signal is weak.
3. Update the target entry in the `2. Targets` template library to note total frames per filter and any prioritization rules. Reference this runbook inside the template metadata for future audits.

### 2. Build the sequencer block
1. Start from the staging profile’s SHO template (`nina/templates/2. Targets/SHO Target Block.template.json`). If unavailable, duplicate the closest narrowband template.
2. Add a `Target` node with pre-sequence actions: slew, plate solve, center, and start guiding. Include a `Sequencer Powerups ▸ Template by Reference` instruction if the session relies on standard pre-check macros.
3. Insert a parent `Loop` that runs until integration goals are met (e.g., `repeat until frames collected` condition tied to each filter’s counter).
4. Within the loop, create child blocks per filter using the `Filter Exposure` instruction:
   - Set exposure time, gain/offset, and frame count (e.g., 5 × 600 s Hα).
   - Enable filter change settling delays (`Advanced ▸ Filter Settling`) to let the wheel stop before exposures resume.
   - Attach `Smart Dither` to the final sub in the block; configure dithering to trigger every 2 frames for OIII when gradients are strong.
5. Add `Auto Focus` triggers when temperature changes ≥2 °C or after 45 minutes if offsets are inaccurate for that filter.
6. Close the loop with `End of Loop` actions: evaluate remaining time, optionally prioritize OIII when the moon sets, and log status via `Comment` instructions for later audit.

### 3. Optional luminance or star color data
1. SHO workflows do not require a dedicated luminance filter. Most processors stretch the Hα master as synthetic luminance to highlight structure.
2. If broadband star color is desired, add a short `RGB Stars` block at the end of the sequence:
   - Capture 30–60 s exposures through RGB filters (or dual-band if available) after the nebular data is complete.
   - Increase dithering cadence to every frame to minimize star color gradients.
   - Tag these frames in N.I.N.A. using `Sequence Metadata ▸ Tag` so post-processing scripts isolate them easily.
3. For a true luminance layer, ensure the target can tolerate bright broadband stars; limit L exposures to 120–180 s and schedule during the darkest window to avoid washing out narrowband contrast.

### 4. Calibration and wrap-up
1. Append a `Calibrations` block that runs panel flats and matching dark flats automatically using the trained exposure table (`Flat Wizard ▸ Use Trained Exposure`).
2. Capture new dark frames for any exposure length or temperature not yet covered in the library. Leverage the Sequencer Powerups “Dark Series” action if overnight downtime is available.
3. Export the Advanced Sequencer log (`Sequence ▸ Save Report`) and attach it to the nightly session notes in `ops/` once validated.

### 5. Validation checklist
- Import the updated template into the staging profile and simulate the run to confirm filter order, autofocus triggers, and plugin hooks fire as expected.
- Review the `Target Signal` graphs after the first sub from each filter to confirm histograms peak between 20–35% without clipping.
- Inspect guiding RMS and backlash compensation in the sequencer log; adjust dither settle tolerances if exposures fail due to guide settle timeouts.
- After processing a quick stack, verify that Hα provides sufficient detail for synthetic luminance. If the image lacks structure, increase Hα integration or add additional SII for balance.

## Troubleshooting
- **OIII subs show heavy gradients** – Increase filter exposure length instead of gain, schedule OIII away from the moon, and consider additional dithers. Apply gradient reduction during processing only after confirming calibration frames are clean.
- **SII signal too weak** – Extend total SII time or run 900 s exposures if tracking allows. Reduce read noise by lowering sensor temperature and ensure flats have no residual dust motes that could masquerade as faint signal.
- **Stars bloated in Hα** – Tighten autofocus cadence for Hα, reduce exposure time slightly (e.g., 480 s), or add a star-replacement RGB block for final composites.
- **Sequencer stalls on filter change** – Verify filter wheel offsets and backlash settings; add a 5 s `Wait` action after filter changes when the wheel reports completion late.

## References
- Nighttime Imaging 'N' Astronomy Documentation, “Advanced Sequencer” and “Filter Control,” accessed 23-Sep-2025.
- N.I.N.A. Plugins Hub, “Sequencer Powerups,” version 1.5 release notes, accessed 15-Sep-2025.
- Insight Observatory, “Narrowband SHO Imaging Techniques,” 18-Apr-2024.
