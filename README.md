# Astrophotography Operations Stack

This repository tracks everything needed to reproduce our automated deep-sky imaging runs: N.I.N.A. Advanced Sequencer templates, hardware specifications, plugin configurations, horizon masks, and supporting playbooks.

## Repository Layout
- `nina/templates/` - Advanced Sequencer exports pulled straight from N.I.N.A.
- `nina/plugins/` - How we configure each plugin and the reminders we need when reinstalling.
- `nina/ops/` - Runbooks and checklists for sequencer workflows (mount setup, automation SOPs, troubleshooting).
- `hardware/` - Imaging rig specifications, spacing budgets, and filter notes.
- `horizons/` - Site-specific horizon masks (`.hrz`) and capture instructions.

Follow the guidance in `AGENTS.md` before contributing; most importantly, never store personally identifiable information (addresses, phone numbers, API secrets) in this repo.

- ## Key References
- [Template Library](nina/templates/README.md) - export/import workflow and Template by Reference upkeep.
- [Plugin Library](nina/plugins/README.md) - current plugin roster, integration notes, and links to official docs.
- [Astro-Physics Mount Notes](nina/ops/astro-physics-mounts.md) - APCC/APPM integration specifics for the Mach2GTO.
- [Polar Alignment Runbook](nina/ops/polar-alignment.md) - combined Mach2 alignment and N.I.N.A. TPPA workflow.
- [Hardware Inventory](hardware/README.md) - mount, optics, camera train, and filter specifications with derived imaging metrics.
- [Horizon Profiles](horizons/README.md) - recording skyline limits and importing them into N.I.N.A.

## Automation & Tooling Summary
Our core automation relies on Sequencer Powerups for shared blocks, Remote Copy for data offload, Ground Station for alerts, and Shutdown PC for end-of-night power-down. The plugin notes capture any extra setup required.

## Hardware Snapshot
The current imaging rig is an Astro-Physics Mach2GTO mount paired with a Stellarvue SVX152T refractor, MoonLite NiteCrawler WR35 focuser/rotator, Gerd Neumann CTU tilt unit, ZWO ASI6200MM Pro camera, ZWO 7x2" EFW, and Chroma 3 nm SHO filters plus luminance/dark slots. Full specs, spacing budgets, and filter links live in `hardware/README.md`.

## Operating Notes
- Keep templates synchronized with the live N.I.N.A. profile (staging import, simulator validation, then commit).
- Update the hardware inventory and plugin notes when gear changes, firmware updates, or new calibration workflows are introduced.
- Store session narratives, troubleshooting steps, and observing checklists under `nina/ops/` instead of embedding long prose in JSON templates.
- Honor the security checklist in `AGENTS.md`: scrub PII, keep credentials in the ops vault, and document access-controlled assets separately.

## Open Tasks
- Populate the hardware documentation with current firmware versions and note which N.I.N.A. profiles are active.
- Record Ground Station notification channel choices and sample message templates once finalized.
- Capture import/export SOPs for templates and horizons so new operators can sync their environments confidently.
