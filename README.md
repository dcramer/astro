# N.I.N.A. Advanced Sequencer Configuration

This repository curates our Advanced Sequencer templates and the supporting documentation that keeps the N.I.N.A. environment reproducible for every imaging run.

## Repository Layout
- `templates/` mirrors N.I.N.A.'s in-app library: session-level templates (startup and shutdown), target templates, calibration flows, and reusable blocks. N.I.N.A. stores these as JSON under `Documents\N.I.N.A.\Templates`, and it respects any subfolder structure you create, so keep the same hierarchy here for easy round-tripping.
- `docs/` (create on demand) collects narratives that don't live in JSON—observing checklists, troubleshooting guides, sky survey notes, and screenshots that explain complex sequences.
- `plugins/` (optional) captures plugin manifests, exported configuration files, or markdown notes summarizing why each plugin is installed and how we configure it.
- `profiles/` (optional) archives profile exports, equipment presets, filter curves, and other backups pulled from Options > Equipment/Profile Manager.
- `horizons/` stores site-specific horizon profiles (`.hrz`) along with generation instructions—see `horizons/README.md`.

Keep filenames short, ASCII-only, and descriptive. Use markdown (`.md`) or native N.I.N.A. exports (`.json`, `.xml`) so we can import without manual edits.

## Workflow Guides
- [Template Library](templates/README.md) — export/import steps, JSON validation, and upkeep for Template by Reference blocks now in use.
- [Plugin Library](plugins/README.md) — per-plugin capabilities, dependencies, and rollout plans.
- [Horizon Profiles](horizons/README.md) — capturing and maintaining site skyline masks.

## Documentation Checklist
Capture the context that explains *why* a template looks the way it does:
- **Hardware snapshot:** Mount, camera, guider, focuser, rotator, filter wheel, dew control, and observatory automation with firmware/driver versions.
- **Environment:** Observatory coordinates, typical seeing, weather integrations, safety interlocks (roll-off roof, cloud sensors), and any automation dependencies.
- **Operational conventions:** Meridian flip timing, autofocus cadence, framing offsets, filter change policies, file pattern conventions, and recovery practices after faults.
- **Calibration strategy:** Dark/flat library cadence, per-filter exposure notes, and any standardized calibration blocks (store matching JSON in `3. Misc`).

House longer narratives or photos in `docs/` to avoid bloating template comments.

## Plugin Summary
We rely on Sequencer Powerups (Template by Reference), Remote Copy (automated file transfer), Ground Station (alerts), shutdown automation, and other focused plugins—see [Plugin Library](plugins/README.md) for the current roster, docs, and integration notes.citeturn2search0turn2search1turn0search0turn0search5turn1search0

## Profiles & Presets
List the active N.I.N.A. profiles, what hardware chain they expect, and which default templates they load. Keep exported `.nuprof` or `.json` backups in `profiles/` and annotate any post-import steps (e.g., re-linking ASCOM drivers, restoring filter wheel order).

## Change Management
- Use short, imperative commit messages (e.g., `Add SHO startup template`).
- Tie each change to an observing session, hardware tweak, or plugin upgrade and note validation steps in the commit or pull request description.
- Scrub personal data (site coordinates, API keys, network paths) before committing exports or screenshots.
- When opening a PR, include: affected templates, simulator/live validation results, and any new plugin requirements so reviewers can reproduce the workflow quickly.

## Open Tasks
- [ ] Populate hardware, plugin, and profile sections with live data.
- [ ] Capture Sequencer Powerups configuration deltas in `plugins/sequencer-powerups.md` once we move beyond default settings.
- [ ] Decide on how we snapshot nightly notes under `docs/` (per session vs. per project).
- [ ] Document our import/export workflow so newcomers can sync local templates with the repo safely.
- [ ] Add examples of validated templates (e.g., broadband, narrowband, calibration) with pointers to relevant documentation.

Treat this README as the map for everything that keeps our N.I.N.A. automation consistent and auditable.
