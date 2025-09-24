# PixInsight Workflows

## Purpose
Document stacking and post-processing procedures that occur entirely inside PixInsight so the imaging team can reproduce results outside the N.I.N.A. capture workflow.

## Contents
- **sho-processing.md** - Narrowband (SHO) stacking and post-processing workflow built around PixInsight 1.9.3 (Lockhart), WBPP 2.8.x, and modern RC Astro/GraXpert tooling.
- **osc-processing.md** - One-shot color (OSC) stacking and post-processing workflow with color-preserving calibration, SPCC, and star color enhancement.
- **plugins.md** - Repository-level notes for required PixInsight add-ons (scripts and modules).
- **icons/README.md** - Process icon libraries and import workflows for shared PixInsight setups.

Add additional guides here for specialized topics (e.g., mosaic workflows, narrowband combination strategies, custom scripts) as they mature.

## Recommended Tutorials & Courses
- **Step-by-step SHO workflow (Frosth76, 10 Nov 2024)** - blog post and video covering calibration selection, BlurX/NoiseX, GHS stretching, and synthetic RGB stars for the Fish Head Nebula. Blog: https://www.frosth.se/2024/11/10/1492/ - Video: https://youtu.be/wYFzbOa-lpU
- **NightSkyPics 12-step PixInsight series (updated Jul 2025)** - detailed article series with embedded videos showing a full narrowband+RGB workflow, including PixelMath combinations and Ha luminance. https://nightskypics.com/pixinsight-tutorial/
- **Masters of PixInsight "Photons to Photos" workshops** - live and recorded end-to-end sessions (e.g., Photons to Photos #32 on 30 Sep 2025 covering SHO with an OSC camera) that include data sets and process icons. https://www.mastersofpixinsight.com/photons-to-photos
- **Galactic Hunter PixInsight processing course** - subscription-based curriculum with SHO nebula modules, downloadable projects, and icon sets. https://www.galactic-hunter.com/product-page/advanced-pixinsight-course
- **CW Astrophotography RGB & SHO workflows (Nov 2024)** - written guide covering NarrowbandNormalization, GHS, and star color management for SHO targets plus updated RGB steps. https://www.theastroshed.com/my-rgb-and-sho-workflows-2024-edition/
- **Night Photons process icon library (updated Mar 2025)** - downloadable PixInsight process icons grouped by workflow stage with setup notes and usage tips. https://www.nightphotons.com/guides/process-icons/
- **Astro-Photographie PixInsight hub (French)** - comprehensive, image-rich walkthroughs of WBPP, deconvolution, GHS, and SHO color mapping; browser translation works well if you do not read French. https://astro-photographie.fr/traitement_pixinsight.html
- **Nebularama SHO processing series (Jul 2023)** - multi-part article that dives into SHO-specific channel balancing, LocalNormalization, and star color recovery in PixInsight. Part 1: https://nebularama.com/2023/07/08/sho-processing-narrowband-data-in-pixinsight-part-one/ - Part 2: https://nebularama.com/2023/07/16/sho-processing-in-pixinsight-part-two/
- **Nebularama process icon automation (Jul 2023)** - guide to auto-loading your PixInsight process icons at startup on Windows. https://nebularama.com/2023/07/10/automatically-load-process-icons-in-pixinsight-on-windows/

## Maintenance
- Update these notes whenever PixInsight releases major revisions (WBPP, SPCC, BlurXTerminator, etc.).
- Record validation runs-include dataset, build number, and notable parameter changes-so future edits can be traced to real-world tests.
