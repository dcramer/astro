# Hardware

## Purpose
Document the imaging rig so we know which components are in play when planning automation, calculating spacing, or troubleshooting hardware issues. Calculated values (image scale, CFZ, etc.) are marked as such.

## Contents
- **Inventory** - component-by-component specs for the current rig.
- **Filters** - quick reference table for the Chroma set and dark slot.
- **Derived Metrics** - math behind spacing, image scale, and field of view.
- **References** - source links and notes for future updates.

## Inventory

### Mount - Astro-Physics Mach2GTO
- German equatorial mount head with Renishaw Resolute absolute encoders and a GTOCP5 controller.
- Carries about 75 lb (34 kg) of gear, not counting counterweights; the head itself weighs 42 lb.
- Native periodic error is <=0.25" peak-to-peak and the encoders hold tracking to <0.5" per hour in factory tests.
- Runs on 12-24 VDC with a 5 A supply (about 1.5 A while tracking at 12 V and 4.2 A while slewing).

### Optical Tube - Stellarvue SVX152T
- Apochromatic triplet with a 152 mm aperture and 1200 mm focal length (f/7.9) that uses FPL-53 and lanthanum glass.
- OTA weighs 23.2 lb; rings plus a Losmandy rail bring it to about 28 lb.
- Tube length is 44.5" retracted and 52" with the dew shield out; the dew shield diameter is 7.33".
- Flatteners on hand: SFFR.72 (0.72x reducer-flattener), SFFX-2 (1.0x flattener). SFFX-2 is in active use.

### Focuser / Rotator - MoonLite NiteCrawler WR35
- Combines a rotator and zero-backlash linear focuser rated for 25 lb; it holds position even when powered off.
- Rotates in 0.001 deg steps; the lead screw delivers 505,960 half-steps per turn (~0.2667 um per step) across 0.9" of travel.
- Draws about 400 mA at 12 V while both motors move and 120 mA when idle.

### Camera - ZWO ASI6200MM Pro
- Uses the Sony IMX455 full-frame sensor (36 x 24 mm, 43.3 mm diagonal) with 9576 x 6388 pixels at 3.76 um.
- Full-well capacity is 51.4 ke^-; read noise runs 1.5-3.5 e^- depending on gain; includes a 16-bit ADC and 256 MB DDR3 buffer.
- Two-stage TEC cools about 35 C below ambient; the camera weighs 700 g and needs 17.5 mm back focus from the T-thread.

### Filter Wheel - ZWO EFW 7x2"
- Holds seven 2" threaded filters or 50.4 +/- 0.5 mm unmounted filters, adding 20 mm of optical length.
- Weighs 650 g and runs from one USB 2.0 cable that draws about 120 mA at 5 V; works with the ASCOM driver and SDK.
- Places the filters about 18 mm from the sensor when bolted to the ASI6200 tilt plate.

### Flat Panel - DeepSkyDad FP2 Motorized Flap
- Servo-driven flap panel with 12-bit (0-4096) brightness control, magnetic closure, and ASCOM/INDI/ASIAIR drivers.
- Needs 12 VDC at 3 A and uses USB-C for control. Select the FLAP194 size for the SVX152T (186 mm dew shield OD).

## Filters
| Filter | Chroma part | Intended line(s) | Nominal CWL | Bandwidth | Official resource | Notes |
|--------|-------------|------------------|--------------|-----------|-------------------|-------|
| Luminance (L) | 27040 Lum | Broadband luminance | 550 nm | Wideband continuum | [Chroma 27040 product page](https://www.chroma.com/products/parts/27040-lum) | Catalog Type: AS (Astronomy); used for L frames. |
| H-alpha 3 nm | 27001 H-alpha 3nm Bandpass | H-alpha 656.28 nm | Tuned to 656.3 nm | 3 nm FWHM | [Chroma 27106 SHO set overview](https://www.chroma.com/products/sets/27106-sii-ha-oiii-3nm) | Part of the 3 nm SHO set; isolates the H-alpha emission doublet. |
| OIII 3 nm | 27006 OIII 3nm Bandpass | [O III] 500.7 nm | Tuned to 500.7 nm | 3 nm FWHM | [Chroma 27106 SHO set overview](https://www.chroma.com/products/sets/27106-sii-ha-oiii-3nm) | Part of the 3 nm SHO set; targets the doubly ionized oxygen line. |
| SII 3 nm | 27009 SII 3nm Bandpass | [S II] 671.6/673.1 nm | Tuned to 672.4 nm (doublet midpoint) | 3 nm FWHM | [Chroma 27106 SHO set overview](https://www.chroma.com/products/sets/27106-sii-ha-oiii-3nm) | Part of the 3 nm SHO set; captures the sulfur doublet. |
| Dark cap | N/A (custom slot) | Closed shutter | - | - | - | Plastic cap used for darks/bias frames; no optical glass. |

## Tilt / Spacing Hardware
- **Gerd Neumann CTU-XT M68x1**: 11.3 mm optical length with three cone screws for tilt adjustment (0.2 mm per turn) against spring preload. M68x1 female threads on both sides; includes 8mm M68 male extension. Replaces an off-axis guider while maintaining rigid spacing.
- **Guiding**: External guiding used; the CTU keeps the imaging train square without an OAG.
- See "Imaging Train Configuration" section below for complete spacer inventory and threading details.

## Imaging Train Configuration

### Current Setup (Sensor to Focuser)
**SFFX-2 Back Focus Requirement:** 79mm from rear of flattener to sensor for SVX152T.

| # | Component | Optical Path | Threading | Notes |
|---|-----------|--------------|-----------|-------|
| 1 | ASI6200MM Pro | 17.5 mm | M54 female input | Camera body back focus |
| 2-4 | ZWO D88 Darkening Rings (3×) | ~0.3 mm | M54 | Light baffles |
| 5 | ZWO EFW 7x2" (LSHORGB) | 20.0 mm | M54 male output | Filter wheel |
| 6 | M54-to-M68 adapter | ~3.0 mm | M54 female → M68 male | Measure to verify exact thickness |
| 7 | Gerd Neumann CTU-XT M68x1 | 11.3 mm | M68 female (both sides) | Tilt correction unit |
| 8 | Blue Fireball M68 spacer | 5.0 mm | M68 male-female | S-M68-05 |
| 9 | Blue Fireball M68 spacer | 15.0 mm | M68 male-female | S-M68-15 |
| 10 | M68-to-M69 adapter | 3.0 mm | M68 male → M69 male | Stellarvue SFA-M69M68-003 (likely) |
| 11 | Stellarvue SFFX-2 | — | M69 female (camera), 4.096" male (focuser) | 1.0× field flattener |
| 12 | Stellarvue SFA-M4.096-M93.5 | 3.25 mm | 4.096" female → WR35 thread male | Adapter to MoonLite 3.5" |
| 13 | MoonLite extension tubes (3×) | 88.9 mm | WR35 thread female-male | 0.5" + 1" + 2" (12.7 + 25.4 + 50.8 mm) |
| 14 | MoonLite NiteCrawler WR35 | — | WR35 thread male | 3.5" rotator/focuser |

**Back Focus Calculation (Items 1-10):** 17.5 + 0.3 + 20.0 + 3.0 + 11.3 + 5.0 + 15.0 + 3.0 = **75.1 mm**
**Target:** 79 mm
**Adjustment needed:** ~3.9 mm (use Blue Fireball S-SET10 fine-tuning spacers between items 8-10)

### Spacer Inventory
- **In imaging train**: 5mm (S-M68-05), 15mm (S-M68-15)
- **Available spares**: 9mm (S-M68-09), 10mm (S-M68-10), 5mm female-to-female
- **Fine-tuning set** (S-SET10): 9 pieces ranging 0.15-1.0 mm
- **Light baffles**: ZWO D88 Darkening Rings (4 pcs: 2× 55mm ID, 2× 58mm ID)

### Items to Measure/Verify
1. **M54-to-M68 adapter** (item #6): Measure exact optical thickness
2. **M68-to-M69 adapter** (item #10): Confirm it's Stellarvue SFA-M69M68-003 (3mm spec)

## Derived Astrograph Metrics
- Native focal ratio: f/7.9 (1200 mm / 152 mm). Calculated.
- Image scale: 206.265 x 3.76 um / 1200 mm ~ 0.65"/pixel. Calculated.
- Full-frame field of view: 1.72 deg x 1.15 deg (width x height) with 2.05 deg diagonal. Calculated from 36 x 24 mm sensor dimensions at 1200 mm focal length.
- Critical focus zone (CFZ) ~ 2.92 x lambda x f^2; at lambda = 0.54 um, CFZ ~ 9.8 um, well within the NiteCrawler's 0.27 um step size. Calculated.

Keep this sheet synchronized with hardware changes and ensure no personally identifiable information (PII) is ever stored here per `AGENTS.md` policy.

## References
- Astro-Physics, "Mach2GTO German Equatorial Mount," specifications sheet, accessed September 23, 2025. <https://www.astro-physics.com/mach2gto>
- Stellarvue, "SVX152T Premier Triplet Refractor," product overview, accessed September 23, 2025. <https://www.stellarvue.com/svx152t/>
- Stellarvue, "SFFX-2 Field Flattener," product page, accessed November 26, 2025. <https://www.stellarvue.com/sffx2/>
- Stellarvue, "Using Photographic Field Flatteners," technical guide, accessed November 26, 2025. <https://www.stellarvue.com/using-field-flatteners/>
- MoonLite Telescope Accessories, "NiteCrawler WR35," product documentation, accessed September 23, 2025. <https://focuser.com/products.php>
- ZWO Optical, "ASI6200MM Pro," product page, accessed September 23, 2025. <https://astronomy-imaging-camera.com/product/asi6200mm-pro>
- ZWO Optical, "EFW 7x2" Filter Wheel," product page, accessed September 23, 2025. <https://astronomy-imaging-camera.com/product/efw-2>
- ZWO Optical, "5 connection methods to get 55mm back focus length," technical guide, accessed November 26, 2025. <https://www.zwoastro.com/2024/09/26/asi6200-guide-5-connection-methods-to-get-55mm-back-focus-length/>
- DeepSkyDad, "FP2 Motorized Flat Panel," product page, accessed September 23, 2025. <https://www.deepskydad.com/products/fp2>
- Chroma Technology, "3 nm Narrowband Filter Set," product documentation, accessed September 23, 2025. <https://www.chroma.com/products/sets/27106-sii-ha-oiii-3nm>
- Chroma Technology, "27040 Luminance Filter," product documentation, accessed September 23, 2025. <https://www.chroma.com/products/parts/27040-lum>
- Gerd Neumann, "CTU XT M68x1 Tilt Unit," product documentation, accessed November 26, 2025. <https://www.gerdneumann.net/deutsch/ctu-xt-m68x1.html>
- Blue Fireball Optics, "M68x1 Thread Spacer Set," product specifications, accessed November 26, 2025.
- Internal calculations for optical metrics (focal ratio, image scale, field of view, CFZ, back focus), derived September 23, 2025 and November 26, 2025.

## Maintenance
- Update component specs when gear, firmware, or accessories change.
- Keep calculated values current after altering imaging train spacing or sensor parameters.
