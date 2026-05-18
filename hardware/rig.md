# Rig Inventory

## Purpose
Track the component-by-component hardware specs for the current imaging rig.

## Mount - Astro-Physics Mach2GTO
- German equatorial mount head with Renishaw Resolute absolute encoders and a GTOCP5 controller.
- Carries about 75 lb (34 kg) of gear, not counting counterweights; the head itself weighs 42 lb.
- Native periodic error is <=0.25" peak-to-peak and the encoders hold tracking to <0.5" per hour in factory tests.
- Runs on 12-24 VDC with a 5 A supply (about 1.5 A while tracking at 12 V and 4.2 A while slewing).

## Optical Tube - Stellarvue SVX152T
- Apochromatic triplet with a 152 mm aperture and 1200 mm focal length (f/7.9) that uses FPL-53 and lanthanum glass.
- OTA weighs 23.2 lb; rings plus a Losmandy rail bring it to about 28 lb.
- Tube length is 44.5" retracted and 52" with the dew shield out; the dew shield diameter is 7.33".
- Correctors on hand: SFFX-2 (1.0x flattener, current documented setup), SFFRX-152180 (0.75x reducer-flattener replacement target), SFFR.72 (0.72x reducer-flattener).

## Focuser / Rotator - MoonLite NiteCrawler WR35
- Combines a rotator and zero-backlash linear focuser rated for 25 lb; it holds position even when powered off.
- Rotates in 0.001 deg steps; the lead screw delivers 505,960 half-steps per turn (~0.2667 um per step) across 0.9" of travel.
- Draws about 400 mA at 12 V while both motors move and 120 mA when idle.

## Camera - ZWO ASI6200MM Pro
- Uses the Sony IMX455 full-frame sensor (36 x 24 mm, 43.3 mm diagonal) with 9576 x 6388 pixels at 3.76 um.
- Full-well capacity is 51.4 ke^-; read noise runs 1.5-3.5 e^- depending on gain; includes a 16-bit ADC and 256 MB DDR3 buffer.
- Two-stage TEC cools about 35 C below ambient; the camera weighs 700 g and needs 17.5 mm back focus from the T-thread.

## Filter Wheel - ZWO EFW 7x2"
- Holds seven 2" threaded filters or 50.4 +/- 0.5 mm unmounted filters, adding 20 mm of optical length.
- Weighs 650 g and runs from one USB 2.0 cable that draws about 120 mA at 5 V; works with the ASCOM driver and SDK.
- Places the filters about 18 mm from the sensor when bolted to the ASI6200 tilt plate.

## Flat Panel - DeepSkyDad FP2 Motorized Flap
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
