# Template Library

## Purpose
Store every Advanced Sequencer export we rely on and explain how to keep them synchronized with the live N.I.N.A. profile.

## Contents
- **1. Setup**, **2. Targets**, **3. Misc**, **4. Blocks** - mirror the in-app library for one-step imports.
- **This README** - editing workflow, Template by Reference guidance, JSON conventions.

## Editing Workflow
1. Build or tweak the sequence in N.I.N.A. and save/export it from the Advanced Sequencer sidebar.
2. Place the exported JSON in the matching folder here. Avoid renaming directories so subsequent imports land in the same library path.
3. Validate syntax with `jq empty path/to/template.json`.
4. Normalize diffs using `jq --sort-keys . file.template.json > tmp && mv tmp file.template.json` so key order stays consistent.
5. Import the updated template into a staging profile and simulate the run to confirm triggers, loops, and plugin-provided instructions resolve correctly.

## Template by Reference
- Use Sequencer Powerups > Misc > Template by Reference to insert shared blocks (startup, calibration, shutdown). Referenced templates must reside in the library before a sequence loads.
- After editing a shared block, re-export it, replace the JSON in `4. Blocks`, and re-validate dependent sequences by opening them in N.I.N.A. (they pick up the new version automatically).
- During debugging you may expand a reference and make temporary edits, but revert to the shared template before committing changes so downstream sequences stay in sync.
- Track any intentional overrides in commit messages or `nina/ops/` so the next operator understands why a sequence diverges from the shared block.

## JSON Conventions
- Two-space indentation; keep CRLF line endings that N.I.N.A. writes out.
- Preserve `$id`, `$type`, and `$values` ordering; automation relies on it.
- File names: `Target Name.template.json`, `Block - Action.template.json`, ASCII characters only.

Re-run the workflow above whenever hardware, plugins, or filtering logic changes to keep the on-disk templates aligned with the live profile.

## Maintenance
- Re-export templates after simulator validation and commit the JSON alongside a note in `nina/ops/` if behavior changes.
- Periodically audit sequences to confirm Template by Reference links still resolve and shared blocks remain centralized.
