# Operations Guides

## Purpose
Keep the automation stack (N.I.N.A., APCC/APPM, helper scripts) reproducible without feeling like dry SOP paperwork. These are field notes we can skim at 2 AM while a run is on deck.

## Style and structure
- Lead with a short intro that frames the scenario, then dive into the “how” in plain language. Think lightweight blog post: conversational, direct, still technical.
- Use headings when they help the story (planning, execution, cleanup). Mix short paragraphs with targeted checklists; avoid rigid numbering unless the order truly matters.
- Call out tool versions, templates, or plugins inline where they matter instead of storing them in detached reference sections.
- Drop validation notes (simulator run, live test, template import) near the relevant step so future edits inherit the context.

## Contents
- **astro-physics-mounts.md** – APCC/APPM integration checklist for the Mach2GTO.
- **polar-alignment.md** – Polar alignment workflow using Mach2 adjustments and the TPPA plugin.
- **nina-sho-sequencing.md** – SHO narrowband sequencing playbook for the Advanced Sequencer.
- Add future runbooks here for import/export, troubleshooting, and nightly checklists.

## Maintenance
- Refresh guides whenever hardware, firmware, or plugin behavior changes.
- Log what you tested (sim run, live data, calibration refresh) when you update a procedure so the next editor knows what’s been verified.
