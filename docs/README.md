# Documentation Overview

This directory captures supporting references for the automation stack: hardware specifications, observatory procedures, mount integration notes, and similar runbooks that do not belong inside JSON templates. Keep these pages concise, actionable, and free of sensitive data per `AGENTS.md`.

## Authoring Guidelines
- Structure pages with clear headings that mirror the workflow (e.g., setup, operation, maintenance).
- Include a `## References` section at the end of each document with the external sources consulted (manufacturer manuals, official plugin docs, etc.) and note when calculations are internal.
- Use descriptive filenames (kebab-case with `.md`) and keep content ASCII unless quoting vendor names that require symbols.
- When capturing procedures, call out prerequisite tooling, validation steps, and hand-off notes so other operators can reproduce the work.

## Current Documents
- `docs/hardware.md` — Hardware inventory, imaging train configuration, derived optical metrics, and vendor references for each component.
- `docs/astro-physics-mounts.md` — APCC/APPM integration checklist for the Mach2GTO, including driver setup, sequencing practices, and reference material from Dale Ghent.

Add new files here for additional subsystems (e.g., observatory networking, calibration workflows) and follow the guidelines above so every page stays consistent and traceable.
