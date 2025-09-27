# Operations Guides

## Purpose
Keep the automation stack (N.I.N.A., APCC/APPM, helper scripts) reproducible without feeling like dry SOP paperwork. These are field notes we can skim at 2 AM while a run is on deck.

## Style and structure
- Lead with a short intro that frames the scenario, then dive into the “how” in plain language. Think lightweight blog post: conversational, direct, still technical.
- Use headings when they help the story (planning, execution, cleanup). Mix short paragraphs with targeted checklists; avoid rigid numbering unless the order truly matters.
- Call out tool versions, templates, or plugins inline where they matter instead of storing them in detached reference sections.
- Drop validation notes (simulator run, live test, template import) near the relevant step so future edits inherit the context.

## Contents

### Setup & Alignment
- **[astro-physics-mounts.md](astro-physics-mounts.md)** – APCC/APPM integration checklist for the Mach2GTO.
- **[polar-alignment.md](polar-alignment.md)** – Polar alignment workflow using Mach2 adjustments and the TPPA plugin.
- **[appm-workflows.md](appm-workflows.md)** – APPM pointing model creation and validation.

### Calibration Workflow
1. **[nina-dark-library.md](nina-dark-library.md)** – Dark library management for the ASI6200MM Pro.
2. **[nina-bias-and-darks.md](nina-bias-and-darks.md)** – Quick reference for bias/dark capture.
3. **[nina-flats.md](nina-flats.md)** – Panel flat acquisition with Flat Wizard.

### Imaging Sessions
- **[nina-sho-sequencing.md](nina-sho-sequencing.md)** – SHO narrowband sequencing playbook for the Advanced Sequencer.

### Data Management
- **[image-organization.md](image-organization.md)** – Complete folder structure and file organization strategy for all image types.

## Workflow Dependencies

### Typical Session Flow
1. Start with **[astro-physics-mounts.md](astro-physics-mounts.md)** for mount setup
2. Run **[polar-alignment.md](polar-alignment.md)** before imaging sessions
3. Create pointing model with **[appm-workflows.md](appm-workflows.md)** if needed
4. Ensure calibration is current:
   - **[nina-flats.md](nina-flats.md)** → **[nina-dark-library.md](nina-dark-library.md)**
5. Execute imaging with **[nina-sho-sequencing.md](nina-sho-sequencing.md)** for narrowband
6. Organize all files per **[image-organization.md](image-organization.md)**

## Maintenance
- Refresh guides whenever hardware, firmware, or plugin behavior changes.
- Log what you tested (sim run, live data, calibration refresh) when you update a procedure so the next editor knows what's been verified.
