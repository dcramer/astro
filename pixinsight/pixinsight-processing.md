# PixInsight Stacking and Processing

## Purpose
Provide a repeatable PixInsight workflow for calibrating, stacking, and finishing deep-sky data from our rigs. The focus is on PixInsight 1.9.3 "Lockhart," its updated WeightedBatchPreprocessing (WBPP) 2.8 script, and the companion tools we rely on most often.

## At a Glance
- **Software baseline:** PixInsight 1.9.3 (Lockhart) with WBPP 2.8.3, BlurXTerminator / NoiseXTerminator / StarXTerminator (optional RC Astro add-ons), Generalized Hyperbolic Stretch (GHS) process module, and GraXpert 3.0.2 for gradient removal.
- **Target accuracy:** Integrated masters should have FWHM <= 2x seeing-limited frames, background gradients < 5% across field, and residual green channel < 0.1 after SPCC/SCNR for broadband targets.
- **Session dependencies:** Calibrated calibration frames (bias/dark/dark-flat/flat) from the same camera gain, temperature, and optical configuration; metadata preserved in FITS headers; master dark library kept up to date per seasonal temperature swing.

## Prerequisites
1. Install or upgrade PixInsight 1.9.3 from the software distribution site, then run `Resources > Updates > Check for Updates` to pull the latest scripts.
2. Add third-party repositories as needed: RC Astro tools and GraXpert each publish PixInsight update URLs that can be pasted into `Resources > Updates > Manage Repositories`.
3. Organize lights by filter, session, and exposure length. Keep calibration frames tightly matched to each configuration per PixInsight's master frame guidance.

## Data Preparation
- **File hygiene:** Keep consistent naming so WBPP can auto-group frames, and cull problem subframes with Blink before they skew weighting.
- **Calibration library:** Maintain temperature-binned masters and refresh them when the camera, optics, or environmental profile changes.
- **Metadata:** Confirm FITS headers include `XBINNING`, `FILTER`, `GAIN`, and `OFFSET` to ensure WBPP matches calibration files correctly.

## Weighted Batch Preprocessing Workflow
1. Launch **WBPP** (`Scripts > Batch Processing > WeightedBatchPreprocessing`). Load lights by filter (drag folders). Add matching darks, flats, and bias/dark flats.
2. **Global Settings:**
   - Weights: PSF Signal Weight.
   - Local Normalization: enable; choose "Generate new reference" and inspect the interactive selector when prompted.
   - CFA/Data: ensure debayer is enabled for OSC data (Adaptive Weighted CFA).
3. **Calibration Options:**
   - Enable Master Dark Optimization for cooled CMOS when dark exposure ~ light exposure.
   - Cosmetic Correction: auto-detect hot/cold pixels unless a master defect map exists.
4. **Registration & Integration:**
   - Select **Distortion Correction** for wide-field refractors; disable for narrowfields to save runtime.
   - Drizzle Integration: enable only when pixel scale <= 0.5"/px and dithered data are available; confirm `Enforce Rejection` is ticked to avoid memory spikes.
5. **Execution Monitor & Cache:**
   - Use the WBPP Execution Monitor to validate each stage; WBPP 2.8's caching lets you rerun integration choices without repeating calibration.
6. Output masters land under `_APP` (calibrated data) and `_APP/master` (integrations). Export the WBPP log for traceability.

## Post-WBPP Quality Checks
- Inspect integrated masters with **Blink** and **Histograms**; ensure no gradient or color banding.
- Run **SubframeSelector** on registered lights stored in `_APP` to flag frames with FWHM or eccentricity outliers; re-integrate without weak subs if the cache shows outliers.
- If drizzle data were produced, verify `drizzle_1x` vs `drizzle_2x` alignment using **Process > Geometry > IntegerResample** before final usage.

## Linear Processing Path
1. **DynamicCrop / ChannelCombination:** Crop stacking artifacts and, for narrowband, combine channels with PixelMath after linear alignment.
2. **Background:** Use **GraXpert** 3.x or **DynamicBackgroundExtraction** to remove gradients; follow with **BackgroundNeutralization** and **Spectrophotometric Color Calibration (SPCC)** on broadband data.
3. **Noise & Deconvolution:**
   - Apply **BlurXTerminator** early (linear, star mask protected). For SHO data, run per-channel before combination if halos persist.
   - Follow with **NoiseXTerminator** while the data are still linear, tuning strength for luminance vs. chrominance.
4. **Linear Stretch Prep:** Create starless copy via **StarXTerminator** (optional) to allow separate nebula/star treatment. Save masks for later.

## Stretching and Non-Linear Enhancements
1. Perform initial stretch with **GeneralizedHyperbolicStretch** (GHS) for detail-preserving lift; monitor black point histogram.
2. Fine-tune with **HistogramTransformation** or **MaskedStretch** for star layers.
3. **Color Management:**
   - **CurvesTransformation** with ColorMask or RangeMask for targeted saturation.
   - SHO remapping via PixelMath (e.g., HOO/Hubble palette). Keep green shift in check with **SCNR** or **Hue curves**; avoid over-suppressing emission regions. Nebularama's two-part SHO series (July 2023) offers practical recipes for channel balancing, Ha luminance, and selective saturation. Part 1: https://nebularama.com/2023/07/08/sho-processing-narrowband-data-in-pixinsight-part-one/ - Part 2: https://nebularama.com/2023/07/16/sho-processing-in-pixinsight-part-two/
4. **Detail & Stars:**
   - Apply **LocalHistogramEqualization** and **HDRMultiscaleTransform** on starless data for contrast; reinject stars via PixelMath with moderated scaling (0.8-0.9 multiply) to prevent bloating.
   - Use **MorphologicalTransformation** or **StarXTerminator** star reduction if necessary.
5. **Finishing Touches:**
   - Inspect background with **Statistics** process to keep median ~0.12-0.18 and noise sigma uniform across field.
   - Stamp residual artifacts with **CloneStamp** sparingly.

## Narrowband vs. One-Shot Color Notes
- **OSC:** Dual-band filters simplify emission targets; after stacking, extract channels if you need separate H-alpha/OIII treatments, then rebalance with SPCC and gentle SCNR.
- **Monochrome SHO:** Calibrate each filter set independently in WBPP, normalize channels with **LinearFit**, then map colors via PixelMath (HOO, SHO, or custom). Use ColorMask-based tweaks to keep faint nebulosity intact. Nebularama's workflow highlights star color recovery with PixelMath after SHO stretches (Part 2 covers star reintegration).

## Export & Archiving
- Save the project (`File > Save Project As`) at major milestones.
- Export 16-bit TIFF (Adobe RGB) for Lightroom/Photoshop polish; export 16-bit PNG when sharing online to avoid compression banding.
- Archive master integrations, process icons, and final PixInsight project in the nightly target folder alongside acquisition logs.

## Troubleshooting
- **WBPP stalls on integration:** Check memory usage and, if necessary, split projects into smaller batches before recombining with WBPP's cache-aware reruns.
- **Calibration mismatch:** Rebuild or replace weak master frames-PixInsight's master-frame methodology assumes clean, bias/dark-subtracted flats.
- **Plate solving failures inside WBPP:** Recheck focus and exposure; if ASTAP struggles, increase exposure slightly or refocus before rerunning TPPA/platesolve loops.
- **TPPA inconsistent results feeding into WBPP:** Run the NINA Three Point Polar Alignment plugin with tracking enabled, keep runs short, and repeat until residual drift stabilizes.

## Supplementary Scripts & Resources
- **GAME script (Hartmut Bornemann):** build precise masks directly inside PixInsight for complex targets; add the SKYPIXELS repository to stay current.
- **EZ Processing Suite:** community-maintained but no longer officially distributed; historical tutorials exist, yet PixInsight 1.9 users should rely on modern tools (RC Astro suite, GraXpert, GHS) instead of attempting to install the deprecated packages.
- **Nebularama process icon loader:** automate loading your custom process icons at startup on Windows. https://nebularama.com/2023/07/10/automatically-load-process-icons-in-pixinsight-on-windows/

## References
- PixInsight Development Team. "PixInsight 1.9.3 Lockhart release notes." https://pixinsight.com/release_notes/1.9.3/ (accessed 23 Sep 2025).
- RC Astro. "Installing RC Astro Tools in PixInsight." https://www.rc-astro.com/resources/installation/ (accessed 23 Sep 2025).
- Cranfield, Mike and David Payne. "Generalised Hyperbolic Stretch Primer." https://ghsastro.co.uk/docs/primer.pdf (accessed 23 Sep 2025).
- GraXpert Project. "GraXpert 3.0.2 Release." https://github.com/Steffenhir/GraXpert/releases/tag/v3.0.2 (accessed 23 Sep 2025).
- Peris, Vicent. "Master Calibration Frames: Acquisition and Processing." https://pixinsight.com/tutorials/master-frames/ (accessed 23 Sep 2025).
- RemoteAstrophotography.com. "Easy and Effective Noise Reduction using NoiseXTerminator." https://remoteastrophotography.com/noisexterminator-noise-reduction/ (accessed 23 Sep 2025).
- AstroBackyard. "Wide Field Astrophotography Processing Tutorial for 2025." https://astrobackyard.com/wide-field-astrophotography/ (accessed 23 Sep 2025).
- r/AskAstrophotography. "NINA (3 point polar alignment & platesolve help)." https://www.reddit.com/r/AskAstrophotography/comments/1bqy3mi/nina_3_point_polar_alignment_platesolve_help/ (accessed 23 Sep 2025).
- Nebularama. "SHO Processing - Narrowband Data in PixInsight (Part One)." https://nebularama.com/2023/07/08/sho-processing-narrowband-data-in-pixinsight-part-one/ (accessed 23 Sep 2025).
- Nebularama. "SHO Processing in PixInsight (Part Two)." https://nebularama.com/2023/07/16/sho-processing-in-pixinsight-part-two/ (accessed 23 Sep 2025).
- Nebularama. "Automatically Load Process Icons in PixInsight on Windows." https://nebularama.com/2023/07/10/automatically-load-process-icons-in-pixinsight-on-windows/ (accessed 23 Sep 2025).
