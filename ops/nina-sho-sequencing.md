# N.I.N.A. SHO Sequencing Notes

This is the working recipe I keep nearby when I want SHO (SII, Hα, OIII) data without overthinking the paperwork. It assumes the staging N.I.N.A. profile, the Sequencer Powerups plugin, and our current narrowband rig. Tweak the numbers to match your site.

### tl;dr cheat sheet
- Hα does double duty as the synthetic luminance; no separate L filter unless you want true broadband stars.
- Stick to 300–600 s subs at unity gain with 3 nm filters under Bortle 5–7 skies; drop to 180–240 s if clipping or guiding hiccups, stretch to 900 s in darker conditions.
- Moon out? Lean on Hα. Save OIII and SII for the darker windows or when the target crosses the meridian.
- Dither every 2–3 frames (or on filter change) and let Sequencer Powerups `Smart Dither` handle the timing so short exposures keep flowing.
- Keep autofocus tied to temperature (≥2 °C shift) or 45 min per filter, using the filter offset table to dodge unnecessary moves.
- Refresh calibration libraries: matching darks for each sub length, per-filter flats, and dark flats to keep narrowband amp glow in check.

### Before the session
Run the usual sanity checks: Powerups installed, offsets verified in `Equipment ▸ Filters`, guider connected with dither permissions, and fresh weather/moon visibility notes (Telescopius, Sky Atlas, or your favorite). Make sure the dark/flat library covers whatever exposure lengths you plan tonight.

### Planning the night
I start with the moon phase. If it is brighter than ~70 % or sitting near the target, I front-load Hα blocks. For balanced colour, aim for roughly six hours per line (think 36 × 600 s), but skew to a 40/30/30 split (Hα/SII/OIII) when the structure needs help. Log the target goals inside the `nina/templates/2. Targets/` entry so the Advanced Sequencer template stays in sync with this runbook.

### Building the sequence
Duplicate the `SHO Target Block.template.json` in the staging profile if you need a fresh start. Add a `Target` node with the usual slew → plate solve → center → start guiding steps, and include the Sequencer Powerups “Template by Reference” action when our preflight macro should run.

Inside the main loop, carve out one block per filter with `Filter Exposure`. Set the exposure length, gain, and frame count (I like 5 × 600 s chunks). Flip on `Advanced ▸ Filter Settling` so the wheel isn’t caught mid-spin. Tag the final exposure in each block with `Smart Dither`; I keep OIII on an every-other-frame cadence when gradients are stubborn. Drop in autofocus triggers keyed to temperature drift or runtime, then close the loop with a quick comment that reports remaining integration—handy for next-night resumes.

### Luminance and star colour detours
Pure SHO doesn’t need a luminance filter—the stretched Hα master is usually the luminance layer. If I want proper star colour, I append a tiny RGB block: 30–60 s exposures, heavy dithering (every frame), and `Sequence Metadata ▸ Tag` so the stacks split cleanly. If you truly need broadband L data, cap those subs at 120–180 s and only shoot them in the darkest window so the narrowband contrast survives.

### Calibration and wrap-up
Close with a calibration block that runs trained panel flats plus the matching dark flats (`Flat Wizard ▸ Use Trained Exposure`). Grab new darks for any exposure/temperature combo you touched tonight—Sequencer Powerups `Dark Series` is perfect if the rig sits idle before dawn. Export the sequencer log (`Sequence ▸ Save Report`) and drop the highlights into the nightly ops notes once you confirm the automation behaved.

### Quick validation pass
- Import the updated template into the staging profile and run a simulation to double-check filter order, autofocus triggers, and plugin hooks.
- Confirm the first sub from each filter puts the histogram between 20–35 % without clipping.
- Scan the guider RMS and backlash numbers; tighten dither settle tolerances if the sequence waits forever for guiding to calm down.
- Toss a fast stack together—if Hα isn’t delivering the structure you want, plan extra Hα time or bump SII to balance the palette.

### When things misbehave
- **OIII gradients** → schedule OIII later in the night, lengthen subs rather than cranking gain, add extra dithers, and only reach for gradient removal once calibration frames look spotless.
- **Weak SII** → extend total SII time or push to 900 s subs if guiding allows; double-check that flats aren’t hiding dust motes as “signal.”
- **Bloated Hα stars** → tighten autofocus cadence, shorten to ~480 s, or capture an RGB stars block and replace them in processing.
- **Filter change stalls** → revisit filter wheel backlash/offsets and insert a 5 s `Wait` if the wheel reports settled late.

### Sources worth bookmarking
- Nighttime Imaging 'N' Astronomy docs: “Advanced Sequencer” + “Filter Control” (accessed 2025-09-23).
- N.I.N.A. Plugins Hub: “Sequencer Powerups” v1.5 release notes (accessed 2025-09-15).
- Insight Observatory: “Narrowband SHO Imaging Techniques” (published 2024-04-18).
