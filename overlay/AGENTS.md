# Agent Instructions

## Package Manager
- Use `pnpm`
- Root commands: `pnpm install`, `pnpm dev`, `pnpm lint`, `pnpm build`, `pnpm start`

## File-Scoped Commands
| Task | Command |
|------|---------|
| Lint a file | `pnpm exec eslint path/to/file.tsx` |
| Typecheck overlay | `pnpm exec tsc --noEmit` |
| Typecheck catalog package | `pnpm --dir packages/astro-catalog typecheck` |
| Validate JSON | `jq empty path/to/file.json` |

## Commit Attribution
AI commits MUST include:
```text
Co-Authored-By: (the agent model's name and attribution byline)
```

## Key Conventions
- Source of truth: edit `src/**`, `packages/nina/src/**`, and `packages/astro-catalog/src/**`; do not hand-edit `.next/**` or `packages/astro-catalog/dist/**`
- App routes live in `src/app/**`; API handlers live in `src/app/api/**/route.ts`
- JSON: two-space indentation, CRLF line endings, preserve `$id`, `$type`, `$values` key order
- JSON filenames: ASCII only, e.g. `Rosette SHO.template.json`
- Commit messages: short, imperative, e.g. `Add narrowband startup template`
- Include validation steps in PR notes

## Project Structure
| Path | Purpose |
|------|---------|
| `nina/templates/` | N.I.N.A. sequencer templates (`1. Setup`, `2. Targets`, `3. Misc`, `4. Blocks`) |
| `nina/plugins/` | Plugin briefs |
| `ops/` | Runbooks, checklists, SOPs |
| `hardware/` | Rig specs, spacing budgets, filter details |
| `horizons/` | Horizon data |
| `pixinsight/` | PixInsight scripts/configs |
| `src/app/` | Next.js overlay app |
| `packages/nina/src/` | N.I.N.A. TypeScript helpers |
| `packages/astro-catalog/src/` | Catalog source; `dist/` is generated |

## Security
- Never store PII, API keys, or private addresses
- Lat/long is acceptable only when it does not reveal a private residence
- Scrub sensitive data before uploading exports
