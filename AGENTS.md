# Repository Guidelines

## Project Structure & Module Organization
- `templates/` mirrors the N.I.N.A. library: `1. Setup`, `2. Targets`, `3. Misc`, and `4. Blocks`. Match the in-app folder names so exported JSON round-trips cleanly.
- `docs/` (if created) stores supporting write-ups such as observing checklists and troubleshooting notes.
- `plugins/` contains plugin briefs; see `plugins/sequencer-powerups.md` for an example.
- `profiles/` holds exported N.I.N.A. profiles or equipment presets when needed.

## Build, Test, and Development Commands
- `jq empty templates/<file>.template.json` — quick syntax validation for any edited template.
- `jq --sort-keys . file.template.json > tmp && mv tmp file.template.json` — normalizes key order before committing.
- `python3 -m json.tool file.template.json` — pretty-print nested blocks for review or diffing.

## Coding Style & Naming Conventions
- JSON uses two-space indentation and retains CRLF line endings from N.I.N.A. exports.
- File names should be descriptive (`Rosette SHO.template.json`) and ASCII-only.
- Keep `$id`, `$type`, and `$values` entries in their original order; automation depends on these keys.

## Testing Guidelines
- Validate every changed template with `jq empty` before committing.
- Import updates into a staging N.I.N.A. profile to confirm sequencer transitions, filter selections, and plugin-driven instructions (e.g., Sequencer Powerups Template by Reference).
- Document any simulator or live-test results in commit messages or PR notes.

## Commit & Pull Request Guidelines
- Use short, imperative commit messages (`Add narrowband startup template`).
- In PR descriptions, include: summary of observing scenario, validation steps (simulator run, plate solve check), and any new plugin requirements.
- Reference related issues or session logs, and scrub personal data (coordinates, API keys) before uploading exports.

## Security & Configuration Tips
- **Critical:** Never store personally identifiable information (PII) such as home addresses, names, phone numbers, or API credentials in this repo. Lat/long coordinates are acceptable only when they don't reveal a private residence.
- Store plugin or profile exports only after removing sensitive identifiers.
- Note required N.I.N.A. or .NET versions when adding plugins to avoid compatibility surprises during upgrades.
