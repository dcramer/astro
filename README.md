# Astrophotography Operations Stack

This repository tracks everything needed to reproduce our automated deep-sky imaging runs: N.I.N.A. Advanced Sequencer templates, hardware specifications, plugin configurations, horizon masks, and supporting playbooks.

## Repository Layout
- `templates/` — Advanced Sequencer exports organized by phase (`1. Setup`, `2. Targets`, `3. Misc`, `4. Blocks`). Keep filenames aligned with their in-app equivalents for round-trips.
- `plugins/` — Plugin index plus per-plugin notes documenting capabilities, dependencies, and configuration decisions.
- `docs/` — Narrative references such as hardware specs (`docs/hardware.md`), observing checklists, troubleshooting logs, or session metadata conventions.
- `horizons/` — Site-specific horizon masks (`.hrz`) and capture instructions.
- `profiles/` — Optional home for N.I.N.A. profile exports, equipment presets, or filter curves.

Follow the guidance in `AGENTS.md` before contributing—most importantly, never store personally identifiable information (addresses, phone numbers, API secrets) in this repo.

## Key References
- [Template Library](templates/README.md) — export/import workflow, JSON validation, and Template by Reference upkeep.
- [Plugin Library](plugins/README.md) — current plugin roster, integration notes, and links to official docs.
- [Hardware Inventory](docs/hardware.md) — mount, optics, camera train, and filter specifications with derived imaging metrics.
- [Astro-Physics Mount Notes](docs/astro-physics-mounts.md) — APCC/APPM configuration specifics for the Mach2GTO integration.
- [Horizon Profiles](horizons/README.md) — recording skyline limits and importing them into N.I.N.A.

## Automation & Tooling Summary
Sequencer Powerups handles shared block reuse, Remote Copy mirrors frames to processing storage, Ground Station pushes session alerts, Shutdown PC handles end-of-night power-down, and the remaining plugins in the library cover guiding, polar alignment, and data inspection. Consult each plugin note for version-specific details and dependencies.

## Hardware Snapshot
The current imaging rig is an Astro-Physics Mach2GTO mount paired with a Stellarvue SVX152T refractor, MoonLite NiteCrawler WR35 focuser/rotator, Gerd Neumann CTU tilt unit, ZWO ASI6200MM Pro camera, ZWO 7×2" EFW, and Chroma 3 nm SHO filters plus luminance/dark slots. Full specs, spacing budgets, and filter links live in `docs/hardware.md`.

## Operating Notes
- Keep templates synchronized with the live N.I.N.A. profile (staging import, simulator validation, then commit).
- Update the hardware inventory and plugin notes when gear changes, firmware updates, or new calibration workflows are introduced.
- Store session narratives, troubleshooting steps, and observing checklists under `docs/` instead of embedding long prose in JSON templates.
- Honor the security checklist in `AGENTS.md`: scrub PII, keep credentials in the ops vault, and document access-controlled assets separately.

## Open Tasks
- Populate hardware/profile summaries with current firmware versions and active N.I.N.A. profiles.
- Record Ground Station notification channel choices and sample message templates once finalized.
- Capture import/export SOPs for templates, horizons, and profiles so new operators can sync their environments confidently.
