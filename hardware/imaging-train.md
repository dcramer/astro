# Imaging Train and Spacing

## Purpose
Track corrector-specific install order, backfocus budgets, spacer inventory, and remaining measurements. Keep each corrector setup as its own reinstall record. Do not move spacer notes between setups unless intentionally converting the train.

## Tilt / Spacing Hardware
- **Gerd Neumann CTU-XT M68x1**: 11.3 mm optical length with three cone screws for tilt adjustment (0.2 mm per turn) against spring preload. M68x1 female threads on both sides; includes 8mm M68 male extension. Replaces an off-axis guider while maintaining rigid spacing.
- **Guiding**: External guiding used; the CTU keeps the imaging train square without an OAG.

## Setup A - SFFX-2 Flattener Reinstall Spec
**Status:** known-good legacy setup.

**Backfocus target:** 79 mm from the SFFX-2 camera-side shoulder to the ASI6200 sensor.

### Camera Side - Sensor to SFFX-2
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
| 11 | Stellarvue SFFX-2 | n/a | M69 female (camera), 4.096" male (focuser) | 1.0x field flattener |

**Backfocus calculation:** 17.5 + 0.3 combined dark shims + 20.0 + 3.0 + 11.3 + 1.0 + 15.0 + 5.0 + 5.0 = **78.1 mm**
**Fine spacing target:** add about **0.9 mm** of S-SET10 fine shims on the camera side to reach 79 mm.

### Focuser Side - SFFX-2 to MoonLite
These parts only establish focus reach. They are not part of the SFFX-2 backfocus calculation.

| # | Component | Optical Path | Threading | Notes |
|---|-----------|--------------|-----------|-------|
| 12 | Stellarvue SFA-M4.096-M93.5 | 3.25 mm | 4.096" female -> WR35 thread male | Adapter to MoonLite 3.5" |
| 13 | MoonLite extension tubes (3x) | 88.9 mm | WR35 thread female-male | 0.5" + 1" + 2" (12.7 + 25.4 + 50.8 mm) |
| 14 | MoonLite NiteCrawler WR35 | n/a | WR35 thread male | 3.5" rotator/focuser |

## Setup B - SFFRX-152180 Reducer/Flattener Target
**Status:** new replacement target.

**Reducer factor:** 0.75x; Stellarvue lists this as the dedicated full-frame reducer/flattener for the SVX152T and SVX180T.

**Backfocus target:** use the "Camera Assembly Backfocus MM" value from the SFFRX-152180 order/paperwork. Stellarvue supplies reducer extension tube(s) to match that value. Use **55 mm** only if the reducer was configured for a standard 55 mm camera assembly.

### Install Order - OTA to Sensor
Use this physical order when replacing the SFFX-2:

SVX152T -> MoonLite NiteCrawler WR35 -> MoonLite WR35 extension tubes as needed for focus reach -> SFFRX-152180 focuser adapter -> SFFRX-152180 -> SFFRX-152180 camera-side adapter/spacer if required -> CTU -> M54-to-M68 adapter -> ZWO EFW -> D88 darkening rings -> ASI6200MM Pro.

Remove the SFFX-2-specific CTU-to-flattener spacer pack: 1 mm + 15 mm + 5 mm + ~5 mm flattener-end adapter/spacer, unless the SFFRX-152180 paperwork or thread fit explicitly requires one of them.

### Camera Side - Sensor to SFFRX-152180
Build this side to the reducer's specified backfocus first. These parts affect reducer correction and corner quality.

| # | Component | Optical Path | Threading | Notes |
|---|-----------|--------------|-----------|-------|
| 1 | ASI6200MM Pro | 17.5 mm | M54 female input | Camera body back focus |
| 2 | ZWO D88 dark shim | ~0.1-0.2 mm | M54 | Thin dark shim between camera and EFW; counts toward backfocus |
| 3 | ZWO EFW 7x2" (LSHORGB) | 20.0 mm | M54 male output | Filter wheel |
| 4 | ZWO D88 dark shim | ~0.1-0.2 mm | M54 | Thin dark shim after EFW; counts toward backfocus |
| 5 | M54-to-M68 adapter / short spacer between EFW and CTU | ~3.0 mm | M54 female -> M68 male | Keep in the SFFRX-152180 train unless replacing with an equivalent adapter; counts toward backfocus |
| 6 | Gerd Neumann CTU-XT M68x1 | 11.3 mm | M68 female (both sides) | Tilt correction unit |
| 7 | SFFRX-152180 adapter/spacer | ~2.9 mm target | TBD | Needed only if 55 mm target is confirmed |
| 8 | Stellarvue SFFRX-152180 | n/a | TBD | 0.75x reducer/flattener |

**Fixed camera stack:** 17.5 + 0.3 combined dark shims + 20.0 + 3.0 + 11.3 = **52.1 mm**. This includes both dark shims and the short adapter/spacer between the EFW and CTU.
**If reducer was configured for 55 mm:** add **2.9 mm** between the CTU and SFFRX-152180.
**If reducer was configured for 52.1 mm:** attach the CTU-side stack directly to the SFFRX-152180 camera-side thread, subject to thread-gender adapters.
**Do not carry over:** the SFFX-2 1 mm + 15 mm + 5 mm + ~5 mm flattener-end spacer pack for a 55 mm target. It makes the camera side too long.

### Focuser Side - SFFRX-152180 to MoonLite
These parts only establish focus reach. Add/remove MoonLite-side extensions after the camera side is correct.
Do not assume the old SFFX-2 MoonLite extension stack must carry over, and do not assume direct-to-NiteCrawler is correct either. Start with the SFFRX-152180 supplied focuser adapter, then add the minimum MoonLite extension needed to reach focus with the NiteCrawler near mid-travel.

| # | Component | Optical Path | Threading | Notes |
|---|-----------|--------------|-----------|-------|
| 10 | SFFRX-152180 focuser adapter | TBD | M68 or supplied SFFRX thread -> WR35 / 3.5" MoonLite interface | Installed to couple the reducer to the NiteCrawler; record exact part/threading after measurement |
| 11 | MoonLite extension tubes | TBD | WR35 thread female-male | Use only as needed to place focus inside NiteCrawler travel; remove any unneeded old SFFX-2 extensions |
| 12 | MoonLite NiteCrawler WR35 | n/a | WR35 thread male | 3.5" rotator/focuser |

### SFFRX-152180 Delta From SFFX-2
- SFFX-2 camera-side target: **79.0 mm**.
- Example SFFRX-152180 camera-side target: **55.0 mm** if the reducer was configured for a standard 55 mm camera assembly.
- Target-to-target delta: **-24.0 mm**; the SFFRX-152180 camera side is 24.0 mm shorter.
- Current SFFX-2 camera-side stack without final fine shims: **78.1 mm**.
- Converting that unshimmed SFFX-2 camera stack to 55 mm means removing **23.1 mm** of camera-side spacing.
- The bare camera + EFW + CTU stack is **52.1 mm**, so it needs about **+2.9 mm** only if the SFFRX-152180 target is 55 mm.
- Actual removed SFFX-2 camera-side spacer pack is now understood as four spacers between the CTU and SFFX-2: **1 mm + 15 mm + 5 mm + ~5 mm flattener-end adapter/spacer = ~26 mm**. CTU-to-camera stack is unchanged.
- This is close to the **26.9 mm** CTU-to-SFFX-2 spacing implied by the old 79 mm backfocus target.
- Removing the **~26 mm** SFFX-2 pack and adding only the reducer's needed CTU-side adapter/spacer is consistent with a 55 mm reducer target.

## Shared Spacer Inventory
- **SFFX-2 reinstall spacers**: 1 mm fine spacer, 15 mm (S-M68-15), 5 mm (S-M68-05), ~5 mm flattener-end adapter/spacer, plus any final S-SET10 fine shim needed.
- **SFFRX-152180 target spacer**: about 2.9 mm between SFFRX-152180 and CTU if the reducer was configured for 55 mm; none beyond thread-gender adapters if configured for 52.1 mm.
- **Available spares**: 9 mm (S-M68-09), 10 mm (S-M68-10), 5 mm female-to-female.
- **Fine-tuning set** (S-SET10): 9 pieces ranging 0.15-1.0 mm.
- **Light baffles**: ZWO D88 Darkening Rings (4 pcs: 2x 55 mm ID, 2x 58 mm ID).

## Items to Measure/Verify
1. **Dark shims**: Measure combined thickness of the camera-side and EFW-side dark shims if possible.
2. **M54-to-M68 adapter**: Measure exact optical thickness.
3. **M68-to-M69 adapter**: Confirm it is Stellarvue SFA-M69M68-003 (3 mm spec) for SFFX-2 reinstall records.
4. **SFFRX-152180 paperwork**: Record camera-side target spacing, thread sizes, supplied adapters, and focuser-side native length.
5. **SFFRX-152180 solved frame**: Update N.I.N.A. focal length and platesolver profile after confirming the installed focal length from a solved frame.
