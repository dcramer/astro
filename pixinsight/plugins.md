# PixInsight Plugin Repositories

## Usage
Use this catalog whenever we rebuild PixInsight or validate lab/staging machines. Add each URL under `Resources > Updates > Manage Repositories`, run `Check for Updates`, then restart PixInsight so the new scripts or modules register. Record the validation date, PixInsight build, and dataset in the processing journal.

## Repository Catalog

### Jamie Smith Process Repository
- Maintainer: Jamie Smith
- Repository URL: `https://raw.githubusercontent.com/jamiesmith/pixinsight-repo/main/`
- Contents: Process icons, scripts, and process modules referenced in Jamie Smith tutorials.
- Installation: Add the repository URL, check for updates, then confirm new entries under `Scripts` and `Process > Process Icons`.
- Notes: Many items overlap with the icon packs documented in `pixinsight/icons/README.md`; keep imported icons read-only so local tweaks do not overwrite the upstream set. Flagged as a trial addition for the Q4 2025 processing regression tests; remove after evaluation if it duplicates our in-repo icon libraries.

### EZ Processing Suite
- Maintainer: Dark Archon (Elveteek)
- Repository URL: `https://elveteek.ch/pixinsight-updates/ez-processing-suite/`
- Contents: `EZ Decon`, `EZ Denoise`, `EZ HDR`, and companion scripts.
- Installation: Add the repository URL and run updates; scripts land under `Scripts > EZ Processing Suite`.
- Notes: Verify compatibility with the current PixInsight build; past releases required 1.8.8-6 or newer.

### Foraxx Palette Utility
- Maintainer: Foraxx Palette Utility team
- Repository URL: `https://foraxxpaletteutility.com/FPU/`
- Contents: Foraxx Palette Utility process module for narrowband color mapping.
- Installation: Add the repository URL and run updates; module appears under `Process > Color Spaces > ForaxxPaletteUtility`.
- Notes: License is proprietary; confirm allowed usage before distributing in public profiles.

### SETI Astro Repository
- Maintainer: SETI Institute / SETI Astro community
- Repository URL: `https://raw.githubusercontent.com/setiastro/pixinsight-updates/main/`
- Contents: SETI Astro PixInsight scripts/modules (e.g., Star Removal, Utility tools).
- Installation: Add the repository URL and run updates; review the update log for component placements.
- Notes: Check the upstream README for license information—varies per script.

### Cosmic Photons Modules & Scripts
- Maintainer: Cosmic Photons (Hans Van Berlo)
- Module Repository: `https://www.cosmicphotons.com/pi-modules/narrowbandnormalization/`
- Script Repositories:
  - `https://www.cosmicphotons.com/pi-scripts/bfke/`
  - `https://www.cosmicphotons.com/pi-scripts/imageblend/`
  - `https://www.cosmicphotons.com/pi-scripts/nbcolourmapper/`
  - `https://www.cosmicphotons.com/pi-scripts/starreduction/`
- Installation: Add each repository URL individually; PixInsight installs corresponding tools under `Process > Utilities` or `Scripts > Cosmic Photons`.
- Notes: Capture the exact versions after install—Cosmic Photons occasionally publishes minor updates without bumping the version string.

### Generalised Hyperbolic Stretch (GHS)
- Maintainers: Dave Payne & Mike Cranfield
- Repository URL: `https://www.ghsastro.co.uk/updates/`
- Source: Script (`https://github.com/mikec1485/GHS`) and module (`https://github.com/mikec1485/GHS-Module`)
- Installation: Remove legacy script if needed, add the repository URL, run updates, restart, and confirm entries under `Scripts > Utilities` and `Process > Intensity Transformations`.
- Notes: Requires PixInsight 1.8.9-1 or newer for the compiled module; document validation using the checklist in this file.

### iDeviceApps Utilities
- Maintainer: iDeviceApps (Hartmut Bornemann)
- Repository URL: `https://www.ideviceapps.de/PixInsight/Utilities/`
- Contents: Utility scripts including `LosslessCompression`, `BatchCrop`, and workflow helpers.
- Installation: Add the repository URL and run updates; utilities install under `Scripts > Utilities`.
- Notes: Review the upstream documentation for each script’s licensing terms before redistribution.

### RC Astro Tools
- Maintainer: RC Astro (Russell Croman)
- Repository URLs:
  - BlurXTerminator: `https://www.rc-astro.com/BlurXTerminator/PixInsight/`
  - NoiseXTerminator: `https://www.rc-astro.com/NoiseXTerminator/PixInsight/`
  - StarXTerminator: `https://www.rc-astro.com/resources/StarXTerminator/PixInsight/`
- Installation: Add each URL and run updates; modules appear under `Process > Deconvolution`, `Process > Noise Reduction`, and `Process > Morphology` respectively.
- Notes: Commercial licenses—verify activation keys post-install and ensure operators store license files securely (not in this repo).

### SkyPixels HVB Repository
- Maintainer: Hartmut Bornemann (SkyPixels)
- Repository URL: `https://www.skypixels.at/HVB_Repository/`
- Contents: `HVB-AutoCrop`, `HVB-SkyGlow`, and additional Hartmut utilities.
- Installation: Add the repository URL and run updates; scripts typically land under `Scripts > Utilities > HVB`.
- Notes: Confirm compatibility with the current PixInsight build and document any module-specific dependencies.

## Validation Checklist
- Always run `Resources > Updates > Check for Updates` twice—first to download, second to confirm no pending packages.
- After installation, open each new script/module to confirm it loads without missing resource errors.
- Log validation details (date, PixInsight build, dataset, outcome) in the processing journal.
- If a repository fails to resolve, capture the error message and ISP/network details so we can escalate to the maintainer or try a mirror.

## Future Work
- Publish internal mirrors or packages for critical tools (BlurX/NoiseX/StarX, GHS) if upstream downtime becomes a risk.
- Once our customized icon or script sets are stable, host them under `pixinsight/icons/` or `pixinsight/scripts/` and add them to this catalog with versioned filenames.
