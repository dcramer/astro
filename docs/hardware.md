# Hardware Inventory

This doc captures the core equipment in the N.I.N.A. automation stack along with specs needed for configuration and derived imaging metrics. Calculated values (e.g., image scale) are noted explicitly.

## Mount — Astro-Physics Mach2GTO
- German equatorial head with dual Renishaw Resolute absolute encoders and GTOCP5 servo control.
- Instrument payload: ~75 lb (34 kg) excluding counterweights; mount head weighs 42 lb.
- Native periodic error ≤0.25" peak-to-peak; absolute encoder tracking accuracy is lab-certified under 0.5" per hour.
- Power: 12–24 VDC, minimum 5 A continuous (1.5 A tracking @12 V, 4.2 A slewing).

## Optical Tube — Stellarvue SVX152T
- Apochromatic triplet: 152 mm clear aperture, 1200 mm focal length (f/7.9) using FPL-53 + lanthanum elements.
- OTA weight 23.2 lb; with rings and Losmandy rail ~28 lb.
- Tube length: 44.5" retracted / 52" with dew shield extended; dew shield diameter 7.33".
- Compatible flatteners: Stellarvue SFFX-3 (1.0×) with camera-specific adapters supplied on request.

## Focuser / Rotator — MoonLite NiteCrawler WR35
- Integrated rotator and zero-backlash linear focuser rated for 25 lb instrument loads; holds position when unpowered.
- Rotation resolution 0.001°; WR35 lead screw delivers 505,960 half-steps per turn (~0.2667 μm per step) over 0.9" travel.
- Power: 12 VDC, 400 mA (both motors active) / 120 mA idle.

## Camera — ZWO ASI6200MM Pro
- Sensor: Sony IMX455 full-frame (36 × 24 mm, 43.3 mm diagonal), 9576 × 6388 pixels at 3.76 μm.
- Full-well capacity 51.4 ke⁻; read noise 1.5–3.5 e⁻ (gain-dependent); true 16-bit ADC with 256 MB DDR3 buffer.
- Cooled two-stage TEC, ΔT up to 35 °C below ambient; camera mass 700 g, back focus 17.5 mm from T-thread.

## Filter Wheel — ZWO EFW 7×2″
- Seven positions for 2" threaded filters or 50.4 ± 0.5 mm unmounted filters; 20 mm optical thickness.
- Weight 650 g; powered via single USB 2.0 connection drawing ~120 mA @ 5 V; compatible with ASCOM/SDK control.
- Filter-to-sensor spacing ~18 mm when bolted directly to ASI6200 tilt plate.

## Flat Panel — DeepSkyDad FP2 Motorized Flap
- Servo-driven flap panel with 12-bit (0–4096) brightness control, magnets for positive closure, ASCOM/INDI/ASIAIR support.
- Power: 12 VDC @ 3 A; USB-C control. Panel sizes span FLAP150–FLAP194 to match 129–202 mm dew shield diameters—select FLAP194 for the SVX152T (dew shield 186 mm OD).

## Filters
| Filter | Chroma part | Intended line(s) | Nominal CWL | Bandwidth | Official resource | Notes |
|--------|-------------|------------------|--------------|-----------|-------------------|-------|
| Luminance (L) | 27040 Lum | Broadband luminance | 550 nm | Wideband continuum | [Chroma 27040 product page](https://www.chroma.com/products/parts/27040-lum) | Catalog Type: AS (Astronomy); used for L frames.citeturn14search0 |
| H-alpha 3 nm | 27001 H-alpha 3nm Bandpass | Hα 656.28 nm | Tuned to 656.3 nm | 3 nm FWHM | [Chroma 27106 SHO set overview](https://www.chroma.com/cn/products/sets/27106-sii-ha-oiii-3nm) | Part of the 3 nm SHO set; isolates the Hα emission doublet.citeturn13search3 |
| OIII 3 nm | 27006 OIII 3nm Bandpass | [O III] 500.7 nm | Tuned to 500.7 nm | 3 nm FWHM | [Chroma 27106 SHO set overview](https://www.chroma.com/cn/products/sets/27106-sii-ha-oiii-3nm) | Part of the 3 nm SHO set; targets the doubly ionized oxygen line.citeturn13search3 |
| SII 3 nm | 27009 SII 3nm Bandpass | [S II] 671.6/673.1 nm | Tuned to 672.4 nm (doublet midpoint) | 3 nm FWHM | [Chroma 27106 SHO set overview](https://www.chroma.com/cn/products/sets/27106-sii-ha-oiii-3nm) | Part of the 3 nm SHO set; captures the sulfur doublet.citeturn13search3 |
| Dark cap | N/A (custom slot) | Closed shutter | — | — | — | Plastic cap used for darks/bias frames; no optical glass. |

## Tilt / Spacing Hardware
- Gerd Neumann CTU-XT (11.3 mm optical thickness) provides fine sensor tilt adjustment via three cone screws (0.2 mm per turn) and disk-spring preload; female M68×1 threads on both sides match the EFW/ASI6200 chain, so it replaces the OAG while keeping a rigid connection.citeturn0search0turn0search5
- We are not running an off-axis guider in this train; guiding is handled externally while the CTU maintains ortho spacing.

## Imaging Train Notes
1. SVX152T (with SFFX-3 flattener when required)
2. NiteCrawler WR35 (rotator/focuser)
3. Gerd Neumann CTU-XT tilt unit (11.3 mm optical thickness)
4. ZWO EFW 7×2″ (20 mm optical path)
5. ASI6200MM Pro (17.5 mm back focus)

For a 55 mm back-focus requirement the stack sums to 48.8 mm (11.3 + 20 + 17.5); budget the remaining 6.2 mm with adapters/spacers. Adjust as needed for flatteners or reducers. (Derived from component specs above.)

## Derived Astrograph Metrics
- Native focal ratio: f/7.9 (1200 mm ÷ 152 mm). Calculated.
- Image scale: 206.265 × 3.76 μm ÷ 1200 mm ≈ 0.65"/pixel. Calculated.
- Full-frame field of view: 1.72° × 1.15° (width × height) with 2.05° diagonal. Calculated from 36 × 24 mm sensor dimensions at 1200 mm focal length.
- Critical focus zone (CFZ) ≈ 2.92 × λ × f²; at λ = 0.54 μm, CFZ ≈ 9.8 μm—well within the NiteCrawler’s 0.27 μm step size. Calculated.

Keep this sheet synchronized with hardware changes and ensure no personally identifiable information (PII) is ever stored here per `AGENTS.md` policy.

## References
- Astro-Physics, "Mach2GTO German Equatorial Mount," specifications sheet, accessed September 23, 2025. <https://www.astro-physics.com/mach2gto>
- Stellarvue, "SVX152T Premier Triplet Refractor," product overview, accessed September 23, 2025. <https://www.stellarvue.com/svx152t/>
- MoonLite Telescope Accessories, "NiteCrawler WR35," product documentation, accessed September 23, 2025. <https://focuser.com/products.php>
- ZWO Optical, "ASI6200MM Pro," product page, accessed September 23, 2025. <https://astronomy-imaging-camera.com/product/asi6200mm-pro>
- ZWO Optical, "EFW 7×2" Filter Wheel," product page, accessed September 23, 2025. <https://astronomy-imaging-camera.com/product/efw-2>
- DeepSkyDad, "FP2 Motorized Flat Panel," product page, accessed September 23, 2025. <https://www.deepskydad.com/products/fp2>
- Chroma Technology, "3 nm Narrowband Filter Set," product documentation, accessed September 23, 2025. <https://www.chroma.com/products/sets/27106-sii-ha-oiii-3nm>
- Chroma Technology, "27040 Luminance Filter," product documentation, accessed September 23, 2025. <https://www.chroma.com/products/parts/27040-lum>
- Gerd Neumann, "CTU XT Tilt Unit," product documentation, accessed September 23, 2025. <https://www.gerdneumann.net/english/astrofotografie.html>
- Internal calculations for optical metrics (focal ratio, image scale, field of view, CFZ), derived September 23, 2025.
