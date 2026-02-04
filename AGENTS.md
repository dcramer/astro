# Agent Instructions

## Package Manager
Use **pnpm**: `pnpm install`

## Commit Attribution
AI commits MUST include:
```
Co-Authored-By: (the agent model's name and attribution byline)
```

## Project Structure
| Directory | Purpose |
|-----------|---------|
| `nina/templates/` | N.I.N.A. sequencer templates (mirrors `1. Setup`, `2. Targets`, `3. Misc`, `4. Blocks`) |
| `nina/plugins/` | Plugin briefs |
| `ops/` | Runbooks, checklists, SOPs |
| `hardware/` | Rig specs, spacing budgets, filter details |
| `horizons/` | Horizon data |
| `pixinsight/` | PixInsight scripts/configs |

## JSON Conventions
- Two-space indentation, CRLF line endings
- Preserve `$id`, `$type`, `$values` key order
- ASCII-only file names: `Rosette SHO.template.json`

## Validation
```bash
jq empty <file.json>
```

## Commits
- Short, imperative: `Add narrowband startup template`
- Include validation steps in PR notes

## Security
- **Never** store PII (addresses, names, phone numbers, API keys)
- Lat/long acceptable only if not revealing private residence
- Scrub sensitive data before uploading exports
