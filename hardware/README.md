# Hardware Docs

## Purpose
Document the imaging rig so we know which components are in play when planning automation, calculating spacing, or troubleshooting hardware issues. Keep source-of-truth details in focused Markdown files rather than concentrating everything in this index.

## Current Rig
- Mount: Astro-Physics Mach2GTO.
- Optical tube: Stellarvue SVX152T, 152 mm aperture, 1200 mm native focal length.
- Current documented corrector: Stellarvue SFFX-2 1.0x field flattener.
- Replacement reducer target: Stellarvue SFFRX-152180 0.75x reducer/flattener.
- Camera train: MoonLite NiteCrawler WR35, Gerd Neumann CTU-XT M68x1, ZWO EFW 7x2", ZWO ASI6200MM Pro.
- Filters: Chroma LSHORGB set in the ZWO wheel.

## Documents
| Document | Purpose |
|----------|---------|
| [Rig Inventory](rig.md) | Component specs for the mount, optics, focuser, camera train, flat panel, and filters. |
| [Imaging Train and Spacing](imaging-train.md) | Corrector-specific install order, backfocus budgets, spacer inventory, and measurement checklist. |
| [Derived Metrics](derived-metrics.md) | Focal ratio, focal length, image scale, field of view, and critical focus zone calculations. |
| [References](references.md) | Source links and internal calculation notes used by the hardware docs. |

## Maintenance
- Update component specs when gear, firmware, or accessories change.
- Update spacing notes when the corrector, adapters, CTU, filter wheel, or camera-side stack changes.
- Update calculated values after altering imaging train spacing, reducer factor, focal length, or sensor parameters.
- Mark calculated values clearly and keep formulas visible enough to audit.
- Never store personally identifiable information (PII) here; lat/long is acceptable only when it does not reveal a private residence.
