# Derived Metrics

## Purpose
Keep calculated optical metrics separate from physical inventory and spacer records. Recalculate these values whenever focal length, reducer factor, sensor dimensions, or pixel size changes.

## Native SVX152T
- Native focal ratio: f/7.9 (1200 mm / 152 mm). Calculated.
- Native image scale: 206.265 x 3.76 um / 1200 mm ~ 0.65"/pixel. Calculated.
- Native full-frame field of view: 1.72 deg x 1.15 deg (width x height) with about 2.07 deg diagonal. Calculated from 36 x 24 mm sensor dimensions at 1200 mm focal length.

## SFFRX-152180 Reduced Setup
- SFFRX-152180 reduced focal length: 900 mm (1200 mm x 0.75). Calculated from Stellarvue's reducer factor.
- SFFRX-152180 reduced focal ratio: f/5.9 (900 mm / 152 mm); Stellarvue rounds the SVX152T reduced speed to f/6. Calculated.
- SFFRX-152180 reduced image scale: 206.265 x 3.76 um / 900 mm ~ 0.86"/pixel. Calculated.
- SFFRX-152180 reduced full-frame field of view: 2.29 deg x 1.53 deg (width x height) with about 2.76 deg diagonal. Calculated from 36 x 24 mm sensor dimensions at 900 mm focal length.

## Critical Focus Zone
- Critical focus zone (CFZ) ~ 2.92 x lambda x f^2.
- At lambda = 0.54 um, CFZ is about 98 um at f/7.9 and about 55 um at f/5.9.
- Both CFZ values are well within the NiteCrawler's 0.27 um step size. Calculated.
