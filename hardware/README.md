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
- Stellarvue's SFFX-3 flattener (1.0x) is the matched accessory; Stellarvue includes any custom adapters.

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
- Gerd Neumann CTU-XT adds 11.3 mm of optical length and lets us tweak tilt with three cone screws (0.2 mm per turn) against spring preload. M68x1 threads on both sides match the EFW/ASI6200 chain, so it replaces an OAG while staying rigid.
- We skip an off-axis guider in this setup; guiding is external and the CTU keeps the spacing square.

## Imaging Train Notes
1. SVX152T (with SFFX-3 flattener when required)
2. NiteCrawler WR35 (rotator/focuser)
3. Gerd Neumann CTU-XT tilt unit (11.3 mm optical thickness)
4. ZWO EFW 7x2" (20 mm optical path)
5. ASI6200MM Pro (17.5 mm back focus)

For a 55 mm back-focus requirement the stack sums to 48.8 mm (11.3 + 20 + 17.5); budget the remaining 6.2 mm with adapters/spacers. Adjust as needed for flatteners or reducers. (Derived from component specs above.)

## Derived Astrograph Metrics
- Native focal ratio: f/7.9 (1200 mm / 152 mm). Calculated.
- Image scale: 206.265 x 3.76 um / 1200 mm ~ 0.65"/pixel. Calculated.
- Full-frame field of view: 1.72 deg x 1.15 deg (width x height) with 2.05 deg diagonal. Calculated from 36 x 24 mm sensor dimensions at 1200 mm focal length.
- Critical focus zone (CFZ) ~ 2.92 x lambda x f^2; at lambda = 0.54 um, CFZ ~ 9.8 um, well within the NiteCrawler's 0.27 um step size. Calculated.

Keep this sheet synchronized with hardware changes and ensure no personally identifiable information (PII) is ever stored here per `AGENTS.md` policy.

## References
- Astro-Physics, "Mach2GTO German Equatorial Mount," specifications sheet, accessed September 23, 2025. <https://www.astro-physics.com/mach2gto>
- Stellarvue, "SVX152T Premier Triplet Refractor," product overview, accessed September 23, 2025. <https://www.stellarvue.com/svx152t/>
- MoonLite Telescope Accessories, "NiteCrawler WR35," product documentation, accessed September 23, 2025. <https://focuser.com/products.php>
- ZWO Optical, "ASI6200MM Pro," product page, accessed September 23, 2025. <https://astronomy-imaging-camera.com/product/asi6200mm-pro>
- ZWO Optical, "EFW 7x2" Filter Wheel," product page, accessed September 23, 2025. <https://astronomy-imaging-camera.com/product/efw-2>
- DeepSkyDad, "FP2 Motorized Flat Panel," product page, accessed September 23, 2025. <https://www.deepskydad.com/products/fp2>
- Chroma Technology, "3 nm Narrowband Filter Set," product documentation, accessed September 23, 2025. <https://www.chroma.com/products/sets/27106-sii-ha-oiii-3nm>
- Chroma Technology, "27040 Luminance Filter," product documentation, accessed September 23, 2025. <https://www.chroma.com/products/parts/27040-lum>
- Gerd Neumann, "CTU XT Tilt Unit," product documentation, accessed September 23, 2025. <https://www.gerdneumann.net/english/astrofotografie.html>
- Internal calculations for optical metrics (focal ratio, image scale, field of view, CFZ), derived September 23, 2025.

## Maintenance
- Update component specs when gear, firmware, or accessories change.
- Keep calculated values current after altering imaging train spacing or sensor parameters.
