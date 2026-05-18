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
- Correctors on hand: SFFX-2 (1.0x flattener, current documented setup), SFFRX-3 (new replacement target), SFFR.72 (0.72x reducer-flattener).

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

## Filters (LSHORGB Configuration)
Filters are loaded in the ZWO EFW 7x2" in LSHORGB order (positions 1-7):

| Position | Filter | Chroma part | Target | Nominal CWL | Bandwidth | Notes |
|----------|--------|-------------|--------|-------------|-----------|-------|
| 1 | Luminance (L) | 27040 | Broadband luminance | 550 nm | Wideband | Clear continuum for detail; [product page](https://www.chroma.com/products/parts/27040-lum) |
| 2 | Sulfur-II (S) | 27009 | [S II] 671.6/673.1 nm | 672.4 nm | 3 nm FWHM | SHO set; captures sulfur doublet; [27106 set](https://www.chroma.com/products/sets/27106-sii-ha-oiii-3nm) |
| 3 | Hydrogen-alpha (H) | 27001 | H-alpha 656.28 nm | 656.3 nm | 3 nm FWHM | SHO set; isolates H-alpha emission; [27106 set](https://www.chroma.com/products/sets/27106-sii-ha-oiii-3nm) |
| 4 | Oxygen-III (O) | 27006 | [O III] 500.7 nm | 500.7 nm | 3 nm FWHM | SHO set; doubly ionized oxygen; [27106 set](https://www.chroma.com/products/sets/27106-sii-ha-oiii-3nm) |
| 5 | Red (R) | 27041 | Red continuum | 650 nm | ~80 nm | RGB set; [product page](https://www.chroma.com/products/parts/27041-red) |
| 6 | Green (G) | 27042 | Green continuum | ~540 nm | ~100 nm | RGB set; [product page](https://www.chroma.com/products/parts/27042-green) |
| 7 | Blue (B) | 27043 | Blue continuum | 460 nm | ~120 nm | RGB set; [product page](https://www.chroma.com/products/parts/27043-blue) |

## Tilt / Spacing Hardware
- **Gerd Neumann CTU-XT M68x1**: 11.3 mm optical length with three cone screws for tilt adjustment (0.2 mm per turn) against spring preload. M68x1 female threads on both sides; includes 8mm M68 male extension. Replaces an off-axis guider while maintaining rigid spacing.
- **Guiding**: External guiding used; the CTU keeps the imaging train square without an OAG.
- See "Imaging Train Setups" section below for setup-specific spacer inventory and threading details.

## Imaging Train Setups

Keep each corrector setup as its own reinstall record. Do not move spacer notes between setups unless intentionally converting the train.

### Setup A - SFFX-2 Flattener Reinstall Spec
**Status:** known-good legacy setup.
**Backfocus target:** 79 mm from the SFFX-2 camera-side shoulder to the ASI6200 sensor.

#### Camera Side - Sensor to SFFX-2
These parts set SFFX-2 correction spacing and should be restored together when reinstalling the old flattener.

| # | Component | Optical Path | Threading | Notes |
|---|-----------|--------------|-----------|-------|
| 1 | ASI6200MM Pro | 17.5 mm | M54 female input | Camera body back focus |
| 2 | ZWO D88 dark shim | ~0.1-0.2 mm | M54 | Thin dark shim between camera and EFW; measure if possible |
| 3 | ZWO EFW 7x2" (LSHORGB) | 20.0 mm | M54 male output | Filter wheel |
| 4 | ZWO D88 dark shim | ~0.1-0.2 mm | M54 | Thin dark shim after EFW |
| 5 | M54-to-M68 adapter / short spacer between EFW and CTU | ~3.0 mm | M54 female -> M68 male | Keep unless replacing with an equivalent adapter; measure exact thickness |
| 6 | Gerd Neumann CTU-XT M68x1 | 11.3 mm | M68 female (both sides) | Tilt correction unit |
| 7 | Fine spacer | 1.0 mm | M68 | Part of the SFFX-2 CTU-to-flattener spacer pack |
| 8 | Blue Fireball M68 spacer | 15.0 mm | M68 male-female | S-M68-15 |
| 9 | Blue Fireball M68 spacer | 5.0 mm | M68 male-female | S-M68-05; likely same size as flattener-end spacer |
| 10 | Flattener-end adapter/spacer | ~5.0 mm | M68/M69 TBD | Stays with SFFX-2 reinstall kit; part of CTU-to-flattener spacing |
| 11 | Stellarvue SFFX-2 | — | M69 female (camera), 4.096" male (focuser) | 1.0x field flattener |

**Backfocus calculation:** 17.5 + 0.3 combined dark shims + 20.0 + 3.0 + 11.3 + 1.0 + 15.0 + 5.0 + 5.0 = **78.1 mm**
**Fine spacing target:** add about **0.9 mm** of S-SET10 fine shims on the camera side to reach 79 mm.

#### Focuser Side - SFFX-2 to MoonLite
These parts only establish focus reach. They are not part of the SFFX-2 backfocus calculation.

| # | Component | Optical Path | Threading | Notes |
|---|-----------|--------------|-----------|-------|
| 12 | Stellarvue SFA-M4.096-M93.5 | 3.25 mm | 4.096" female -> WR35 thread male | Adapter to MoonLite 3.5" |
| 13 | MoonLite extension tubes (3x) | 88.9 mm | WR35 thread female-male | 0.5" + 1" + 2" (12.7 + 25.4 + 50.8 mm) |
| 14 | MoonLite NiteCrawler WR35 | — | WR35 thread male | 3.5" rotator/focuser |

### Setup B - SFFRX-3 Reducer/Flattener Target
**Status:** new replacement target.
**Backfocus target:** use the "Camera Assembly Backfocus MM" value from the SFFRX-3 order/paperwork. Stellarvue supplies reducer extension tube(s) to match that value. Use **55 mm** only if the reducer was configured for a standard 55 mm camera assembly.

#### Install Order - OTA to Sensor
Use this physical order when replacing the SFFX-2:

SVX152T -> MoonLite NiteCrawler WR35 -> MoonLite WR35 extension tubes as needed for focus reach -> SFFRX-3 focuser adapter -> SFFRX-3 -> SFFRX-3 camera-side adapter/spacer if required -> CTU -> M54-to-M68 adapter -> ZWO EFW -> D88 darkening rings -> ASI6200MM Pro.

Remove the SFFX-2-specific CTU-to-flattener spacer pack: 1 mm + 15 mm + 5 mm + ~5 mm flattener-end adapter/spacer, unless the SFFRX-3 paperwork or thread fit explicitly requires one of them.

#### Camera Side - Sensor to SFFRX-3
Build this side to the reducer's specified backfocus first. These parts affect reducer correction and corner quality.

| # | Component | Optical Path | Threading | Notes |
|---|-----------|--------------|-----------|-------|
| 1 | ASI6200MM Pro | 17.5 mm | M54 female input | Camera body back focus |
| 2 | ZWO D88 dark shim | ~0.1-0.2 mm | M54 | Thin dark shim between camera and EFW; counts toward backfocus |
| 3 | ZWO EFW 7x2" (LSHORGB) | 20.0 mm | M54 male output | Filter wheel |
| 4 | ZWO D88 dark shim | ~0.1-0.2 mm | M54 | Thin dark shim after EFW; counts toward backfocus |
| 5 | M54-to-M68 adapter / short spacer between EFW and CTU | ~3.0 mm | M54 female -> M68 male | Keep in the SFFRX-3 train unless replacing with an equivalent adapter; counts toward backfocus |
| 6 | Gerd Neumann CTU-XT M68x1 | 11.3 mm | M68 female (both sides) | Tilt correction unit |
| 7 | SFFRX-3 adapter/spacer | ~2.9 mm target | TBD | Needed only if 55 mm target is confirmed |
| 8 | Stellarvue SFFRX-3 | — | TBD | New reducer/flattener |

**Fixed camera stack:** 17.5 + 0.3 combined dark shims + 20.0 + 3.0 + 11.3 = **52.1 mm**. This includes both dark shims and the short adapter/spacer between the EFW and CTU.
**If reducer was configured for 55 mm:** add **2.9 mm** between the CTU and SFFRX-3.
**If reducer was configured for 52.1 mm:** attach the CTU-side stack directly to the SFFRX-3 camera-side thread, subject to thread-gender adapters.
**Do not carry over:** the SFFX-2 1 mm + 15 mm + 5 mm + ~5 mm flattener-end spacer pack for a 55 mm target. It makes the camera side too long.

#### Focuser Side - SFFRX-3 to MoonLite
These parts only establish focus reach. Add/remove MoonLite-side extensions after the camera side is correct.
Do not assume the old SFFX-2 MoonLite extension stack must carry over, and do not assume direct-to-NiteCrawler is correct either. Start with the SFFRX-3 supplied focuser adapter, then add the minimum MoonLite extension needed to reach focus with the NiteCrawler near mid-travel.

| # | Component | Optical Path | Threading | Notes |
|---|-----------|--------------|-----------|-------|
| 10 | SFFRX-3 focuser adapter | TBD | M68 or supplied SFFRX thread -> WR35 / 3.5" MoonLite interface | Installed to couple the reducer to the NiteCrawler; record exact part/threading after measurement |
| 11 | MoonLite extension tubes | TBD | WR35 thread female-male | Use only as needed to place focus inside NiteCrawler travel; remove any unneeded old SFFX-2 extensions |
| 12 | MoonLite NiteCrawler WR35 | — | WR35 thread male | 3.5" rotator/focuser |

#### SFFRX-3 Delta From SFFX-2
- SFFX-2 camera-side target: **79.0 mm**.
- Example SFFRX-3 camera-side target: **55.0 mm** if the reducer was configured for a standard 55 mm camera assembly.
- Target-to-target delta: **-24.0 mm**; the SFFRX-3 camera side is 24.0 mm shorter.
- Current SFFX-2 camera-side stack without final fine shims: **78.1 mm**.
- Converting that unshimmed SFFX-2 camera stack to 55 mm means removing **23.1 mm** of camera-side spacing.
- The bare camera + EFW + CTU stack is **52.1 mm**, so it needs about **+2.9 mm** only if the SFFRX-3 target is 55 mm.
- Actual removed SFFX-2 camera-side spacer pack is now understood as four spacers between the CTU and SFFX-2: **1 mm + 15 mm + 5 mm + ~5 mm flattener-end adapter/spacer = ~26 mm**. CTU-to-camera stack is unchanged.
- This is close to the **26.9 mm** CTU-to-SFFX-2 spacing implied by the old 79 mm backfocus target.
- Removing the **~26 mm** SFFX-2 pack and adding only the reducer's needed CTU-side adapter/spacer is consistent with a 55 mm reducer target.

### Shared Spacer Inventory
- **SFFX-2 reinstall spacers**: 1 mm fine spacer, 15 mm (S-M68-15), 5 mm (S-M68-05), ~5 mm flattener-end adapter/spacer, plus any final S-SET10 fine shim needed.
- **SFFRX-3 target spacer**: about 2.9 mm between SFFRX-3 and CTU if the reducer was configured for 55 mm; none beyond thread-gender adapters if configured for 52.1 mm.
- **Available spares**: 9 mm (S-M68-09), 10 mm (S-M68-10), 5 mm female-to-female.
- **Fine-tuning set** (S-SET10): 9 pieces ranging 0.15-1.0 mm.
- **Light baffles**: ZWO D88 Darkening Rings (4 pcs: 2x 55 mm ID, 2x 58 mm ID).

### Items to Measure/Verify
1. **Dark shims**: Measure combined thickness of the camera-side and EFW-side dark shims if possible.
2. **M54-to-M68 adapter**: Measure exact optical thickness.
3. **M68-to-M69 adapter**: Confirm it is Stellarvue SFA-M69M68-003 (3 mm spec) for SFFX-2 reinstall records.
4. **SFFRX-3 paperwork**: Record reducer factor, camera-side target spacing, thread sizes, supplied adapters, and focuser-side native length.
5. **SFFRX-3 solved frame**: Update N.I.N.A. focal length and platesolver profile after confirming the reducer factor.

## Derived Astrograph Metrics
- Native focal ratio: f/7.9 (1200 mm / 152 mm). Calculated.
- Native image scale: 206.265 x 3.76 um / 1200 mm ~ 0.65"/pixel. Calculated.
- Native full-frame field of view: 1.72 deg x 1.15 deg (width x height) with about 2.07 deg diagonal. Calculated from 36 x 24 mm sensor dimensions at 1200 mm focal length.
- SFFRX-3 reduced metrics: TBD after confirming the reducer factor; update focal length, image scale, and full-frame field of view from a solved frame.
- Critical focus zone (CFZ) ~ 2.92 x lambda x f^2; at lambda = 0.54 um, CFZ is about 98 um at f/7.9 and about 57 um if reduced to f/6, both well within the NiteCrawler's 0.27 um step size. Calculated.

Keep this sheet synchronized with hardware changes and ensure no personally identifiable information (PII) is ever stored here per `AGENTS.md` policy.

## References
- Astro-Physics, "Mach2GTO German Equatorial Mount," specifications sheet, accessed September 23, 2025. <https://www.astro-physics.com/mach2gto>
- Stellarvue, "SVX152T Premier Triplet Refractor," product overview, accessed May 18, 2026. <https://www.stellarvue.com/product/svx152t>
- Stellarvue, "SFFRX-152180," product page, accessed May 18, 2026. <https://www.stellarvue.com/product/sffrx-152180>
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
