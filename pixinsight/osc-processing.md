# PixInsight OSC Stacking and Processing

## Purpose
Provide a repeatable PixInsight workflow for calibrating, stacking, and finishing one-shot color (OSC) deep-sky data. The workflow targets PixInsight 1.9.3 "Lockhart" and the latest WeightedBatchPreprocessing (WBPP) script, then follows a linear-to-nonlinear processing path optimized for color-preserving OSC projects.

## At a Glance
- **Software baseline:** PixInsight 1.9.3 with WBPP 2.8.3, BlurXTerminator / NoiseXTerminator (optional RC Astro add-ons), GraXpert 3.0.2 gradient removal, and Generalized Hyperbolic Stretch (GHS).
- **Target accuracy:** Integrated masters should deliver FWHM <= 2x median subframe seeing, background gradients < 5%, and color balance close to expected spectral profiles after PhotometricColorCalibration (PCC) or Spectrophotometric Color Calibration (SPCC).
- **Session dependencies:** Well-matched calibration frames (darks, flats, dark flats/bias) captured at the same gain, temperature, and optical setup; dithered light frames to enable drizzle and residual amp glow rejection.

## Prerequisites
1. Install or update PixInsight to 1.9.3 and run `Resources > Updates > Check for Updates` for all core scripts.
2. Add third-party repositories (RC Astro, GraXpert) via `Resources > Updates > Manage Repositories`; enable automatic updates.
3. Organize lights by session/target; maintain calibration libraries temperature-binned in 5 C increments. PixInsight"s master-frame tutorial covers recommended acquisition and integration strategies.
4. Optional: configure PixInsight to auto-load OSC process icons (WBPP presets, color calibration flows) using Nebularama"s icon loader instructions.

## Data Preparation
- **Blink screening:** Reject cloudy or trailed subs prior to WBPP to prevent PSF Signal Weight bias.
- **Frame naming:** Use `target_filter_gain_temp_exposure_sequence.fit` style so WBPP auto-groups exposure series.
- **Calibration masters:** Update dark and dark-flat libraries seasonally; for OSC, bias frames are optional if dark flats cover short exposures.

## WBPP Workflow (OSC)
1. Launch **WBPP** (`Scripts > Batch Processing > WeightedBatchPreprocessing`).
2. Load lights; WBPP auto-detects CFA pattern from FITS metadata. Add matching darks, flats, and dark flats/bias.
3. **Global Settings:**
   - Weights: `PSF Signal Weight` for best SNR-based ranking.
   - Local Normalization: enable and set the reference to the best-quality subframe (WBPP interactive selector).
   - CFA Options: ensure `Debayer` is checked; for OSC, choose `Adaptive Weighted CFA`.
4. **Calibration Options:**
   - Enable Master Dark Optimization when dark exposure length matches lights.
   - Cosmetic Correction: Auto detect hot/cold pixels, or supply a master defect map.
5. **Registration & Integration:**
- Distortion Correction: enable for wide-field refractors; skip for narrow fields to save runtime.
- Drizzle Integration: enable when pixel scale <= 2x seeing and dithering was used (CFA images benefit from drizzling back to native color resolution).
   - Rejection algorithm: start with Winsorized Sigma Clipping; evaluate WBPP report for residual artifacts.
6. Run WBPP; calibrated subs appear under `_APP`, masters under `_APP/master`. Archive WBPP logs and process icons for reproducibility.

## Post-WBPP Quality Checks
- Use **SubframeSelector** on registered lights to inspect FWHM, eccentricity, and noise; re-integrate using WBPP cache if poor frames are found.
- Inspect the master with **Blink** and **ScreenTransferFunction**; confirm no color channel clipping or residual gradients.

## Linear Processing Path
1. **DynamicCrop** to remove stacking artifacts.
2. **GraXpert** 3.x or **DynamicBackgroundExtraction** to remove gradients; follow with **BackgroundNeutralization**.
3. **Color Calibration:**
   - Run **Spectrophotometric Color Calibration (SPCC)** with the appropriate catalog (APASS DR10 for broadband; Pan-STARRS if available).
   - For light-polluted data, consider **Photometric Color Calibration (PCC)** after cropping out bright gradients.
4. **BlurXTerminator** (linear, star mask protected) followed by **NoiseXTerminator** at conservative settings (strength 0.8-1.0).
5. Optionally create a starless copy via **StarXTerminator** to allow separate nebula/star adjustments.

## Stretching & Non-Linear Enhancements
1. Apply **GeneralizedHyperbolicStretch** (GHS) to the starless or full image; monitor the black point to avoid clipping.
2. Fine-tune with **HistogramTransformation**; use **CurvesTransformation** with ColorMask to control saturation.
3. For starless layer, boost structure with **LocalHistogramEqualization** and **HDRMultiscaleTransform**.
4. Reintroduce stars using PixelMath (e.g., `NewImage = Starless + Stars * 0.9`) to prevent bloated highlights.
5. Clean residual chroma noise with **SCNR** or **Curves** adjustments as needed.

## Star Color Preservation & Enhancements
- Extract a synthetic luminance (or use the integrated master) to sharpen detail via **MultiscaleLinearTransform** before combining back with color using **LRGBCombination**.
- Use **Bill Blanshan StarReduction** PixelMath set or MorphologicalTransformation with a star mask to control star sizes without desaturating cores.

## Narrowband Combination (Dual-Band OSC)
- If using dual-band filters (e.g., L-eXtreme), extract R/G/B channels with **ChannelExtraction**; treat blue channel as OIII and green channel mixture as H-alpha.
- Create HOO combinations via PixelMath (`R = Ha`, `G = 0.5*Ha + 0.5*OIII`, `B = OIII`). Nebularama Part 2 demonstrates adding synthetic green to restore natural-looking stars.
- Apply SPCC with a narrowband catalog or manual white balance after recombination.

## Export & Archiving
- Save the PixInsight project at key checkpoints (`File > Save Project As`).
- Export 16-bit TIFF (Adobe RGB) for external finishing and 16-bit PNG for web sharing.
- Archive WBPP logs, process icons, and final masters alongside acquisition notes.

## Troubleshooting
- **Color calibration fails:** Ensure the image covers adequate calibration stars and SPCC catalog matches the filter set; otherwise use PCC with manual white reference.
- **Residual walking noise:** Confirm dithering cadence is frequent enough; consider using **NoiseXTerminator** at higher settings post-stretch.
- **Color blotches after stretching:** Re-run GraXpert/DBE on the linear starless copy and restretch; inspect flats for vignetting mismatch.

## References
- PixInsight Development Team. "PixInsight 1.9.3 Lockhart release notes." https://pixinsight.com/release_notes/1.9.3/ (accessed 23 Sep 2025).
- RC Astro. "Installing RC Astro Tools in PixInsight." https://www.rc-astro.com/resources/installation/ (accessed 23 Sep 2025).
- GraXpert Project. "GraXpert 3.0.2 Release." https://github.com/Steffenhir/GraXpert/releases/tag/v3.0.2 (accessed 23 Sep 2025).
- PixInsight. "Master Calibration Frames: Acquisition and Processing." https://pixinsight.com/tutorials/master-frames/ (accessed 23 Sep 2025).
- AstroBackyard. "One Shot Color Astrophotography Processing in PixInsight (2025)." https://astrobackyard.com/osc-pixinsight-workflow/ (accessed 23 Sep 2025).
- NightSkyPics. "PixInsight Tutorial - RGB Workflow." https://nightskypics.com/pixinsight-tutorial/ (accessed 23 Sep 2025).
- Nebularama. "SHO Processing in PixInsight (Part Two)." Relevant for dual-band OSC star color recovery. https://nebularama.com/2023/07/16/sho-processing-in-pixinsight-part-two/ (accessed 23 Sep 2025).
- Bill Blanshan. "Star Reduction PixelMath Expressions for PixInsight." https://www.billionsandbillions.com/star-reduction-pixelmath (accessed 23 Sep 2025).
