# PixInsight Process Icons

## Purpose
Track icon libraries we depend on for repeatable workflows and keep install steps in sync with the rest of our PixInsight configuration notes. Use this doc to load the shared baseline set, then layer team-specific icons or process containers when they are stable enough to publish.

## Repository Icon Packs

### SHO Narrowband Workflow (`SHO-Workflow.xpsm`)
- Generated: 06 Feb 2025 16:06 UTC from PixInsight 1.9.2 (x64).
- Scope: end-to-end SHO sequence (WBPP, Gradient Removal, BlurX/NoiseX passes, star extraction, PixelMath recombination, GHS stretch, star reintegration).
- Validation: aligns with the SHO sequencing documented in `pixinsight/sho-processing.md`; import into staging profiles after major PixInsight updates to confirm no module IDs changed.

### RGB Broadband Workflow (`RGB-Workflow.xpsm`)
- Generated: 06 Feb 2025 16:05 UTC from PixInsight 1.9.2 (x64).
- Scope: broadband OSC/LRGB flow (WBPP, SPCC, color-preserving stretch, denoise/reconstruct, star management, final cosmetic tweaks).
- Validation: mirrors the OSC workflow in `pixinsight/osc-processing.md`; run against the Rosette OSC validation set after PixInsight upgrades or SPCC catalog changes.

### Import Workflow
1. Copy the desired `.xpsm` file from `pixinsight/icons/` to a local, write-protected location (e.g., `Documents/PixInsight/Icons/AstroLab`).
2. In PixInsight open `Process > Process Icons > Load Process Icons…` and browse to the staged `.xpsm` file.
3. Verify that the icons appear in the Process Explorer pane. If you have an existing layout, use `Save Process Icons…` first so you can roll back.
4. Tag or color-code imported icons so site-specific containers remain distinguishable from the baseline library.
5. Document any required tweaks (e.g., reference catalogs, BlurX settings) in the processing journal before modifying the shared file.

### Operational Notes
- Keep shared `.xpsm` files read-only and clone them per site/operator to avoid accidental edits to the repository versions.
- When exporting updates, retain PixInsight metadata (build number, generation timestamp) so we can audit which application versions produced the icons.
- If a workflow now depends on additional scripts or modules, cross-link those requirements in `pixinsight/plugins.md` and the relevant processing guide.

## External Icon Sets
- Jamie Smith Icon Library — https://github.com/jamiesmith/pixinsight-icons (MIT). Use as a reference when we need alternative BlurX/NoiseX tunings or PixelMath snippets not covered in our baseline workflows.

## Future Work
- Version the repository icon packs (e.g., `SHO-Workflow-2025-02.xpsm`) once we start distributing them to production sites.
- Capture release dates and PixInsight build compatibility for each icon pack to keep validation auditable.
