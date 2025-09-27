# Polar Alignment

Here’s the way we dial in the Mach2GTO before an automated session. It’s the same dance every time: rough in the mechanics, sanity-check with APPM if needed, then let N.I.N.A.’s Three Point Polar Alignment (TPPA) tighten the last bit.

### Targets and cheatsheet
- Accuracy goals: <1′ for broadband nights, <30″ when we’re running narrowband or unguided.
- TPPA defaults that rarely fail: 10–20° sample distance, East sky, “Start from current position” ON, 3 s exposure through the L filter (bump it if ASTAP grumbles).
- Knob math you’ll forget at 2 AM:
  - Azimuth: 1 turn ≈ 42′, one tick ≈ 6′.
  - Altitude around 40° lat: 1 turn ≈ 71′, one tick ≈ 4.4′.

### What to have ready
- Mach2GTO on a solid, level pier or tripod with az/alt adjusters loose and vibes under control.
- APCC Pro connected via the AP V2 ASCOM driver; APPM is already bundled.
- N.I.N.A. 3.x with TPPA installed, plate solver working (ASTAP is our go-to). Focus the main imaging camera enough for plate solving and wipe any dew.
- Time, coordinates, and sync terms matching across mount and N.I.N.A. Clear stale sync points if the mount moved.
- Optional: unplug the guide camera during TPPA so you’re measuring the primary optical axis only.

### Step 1: Mechanical rough-in
Home or park the mount, make sure RA is recentered if you loosened clutches, and confirm the pier hasn’t sagged. Aim RA toward true north using RAPAS, a level, or a declination-corrected compass. Spin the azimuth knobs toward north, always sneaking up on the final value from the same direction so the adjuster stays preloaded. Set altitude with small fractions of a turn, then let gravity settle the plate before you lock both sides.

### Step 2: Optional APCC double-check
Fire off a 25–30 point APPM map on the current pier side (about five minutes). APCC reports altitude/azimuth offsets—translate those into knob turns with the cheat sheet, apply half, rebuild the mini-map, then finish the adjustment. Once both offsets sit under 1′ you’re cleared for TPPA.

### Step 3: TPPA refinement
Open Plugins ▸ Three Point Polar Alignment. Choose the clearest horizon (East or West) and set the sample distance to 10–20°. Verify mount + N.I.N.A. clocks/coordinates match and wipe any old models or sync points. Enable sidereal tracking and press Start. TPPA will grab three solves, rotating RA between each. If it asks for Manual Mode, slew RA ~20° at low rate, then confirm when the camera stops. Watch the live readout as you tweak the altitude/azimuth bolts—move in small increments, always approach from the same direction, and wait for the next solve to settle before touching anything else. Stop when the total error hits your target. If the run stretches past ~15 minutes, rerun TPPA so the baseline frame is fresh.

### Step 4: Wrap it up
TPPA cuts tracking when it finishes—turn it back on, slew to a bright target, and confirm guiding drift is gone. Jot the final residual, knob turns, and seeing conditions in the run log so we know what "good" looked like next time.

After alignment is complete, proceed to **[appm-workflows.md](appm-workflows.md)** for pointing model creation if needed.

### Troubleshooting crib notes
- **Plate solves fail** – Increase exposure to 3–5 s, swap to L filter, and confirm ASTAP has the right catalog.
- **Error keeps drifting** – Leave tracking on throughout; rerun TPPA if you’ve been fiddling longer than 15 minutes.
- **Obstructions block the slew** – Reduce sample distance, pick the opposite sky, or use Manual Mode from the current position.
- **Runs disagree** – Make sure only RA moved between solves and preload both bolts in the same direction before releasing them.
- **Good TPPA, bad guiding** – Check that tracking resumed and throw together a short APPM model; leftover model terms sometimes expose flexure.
- **Solver noise** – Thin clouds, fat moon, or narrowband filters can tank SNR. Switch to broadband, bump exposure, or wait it out.

### References when you need the deep dive
- [Astro-Physics, “Advanced Pointing Model and Polar Alignment”](https://www.astro-physics.com/apcc) (APCC Pro Help, accessed 2025-09-23).
- [Astro-Physics, Mach1GTO Manual (az/alt knob increments)](https://www.astro-physics.com/products/mounts/mach1gto) (accessed 2025-09-23).
- [Astrobasics, “Aligning with N.I.N.A. using Plate Solving”](https://astrobasics.org/) (accessed 2025-09-23).
- [Alpaca Benro Polaris docs, “NINA 3 Point Polar Alignment”](https://alpaca.systems/) (accessed 2025-09-23).
- [N.I.N.A. TPPA FAQ, GitHub `isbeorn/nina.plugin.polaralignment`](https://github.com/isbeorn/NINA.Plugin.PolarAlignment) (accessed 2025-09-23).
- [Stargazers Lounge, “NINA and Three Point Polar Alignment frustrations”](https://stargazerslounge.com/) (posted 2024-11-21).
- [Cloudy Nights, “Having issues using Three Point Polar Alignment in NINA”](https://www.cloudynights.com/) (posted 2022-02-08).
- [Reddit r/AskAstrophotography, “Polar alignment precision”](https://www.reddit.com/r/AskAstrophotography/) (posted 2024-11-24).
- [Reddit r/AskAstrophotography, “Nina stops tracking after polar alignment”](https://www.reddit.com/r/AskAstrophotography/) (posted 2023-09-18).
