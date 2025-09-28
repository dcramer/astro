# Astrophotography Image Organization Strategy

## Overview
This document describes the folder structure and organization strategy for managing astrophotography images captured with N.I.N.A. and processed with PixInsight.

## Directory Structure

```
/mnt/astro/
├── Unprocessed/              # Raw incoming data from N.I.N.A. (Robocopy pulls from C:\\Users\\PrimaLuceLab\\Documents\\N.I.N.A\\Unprocessed\\)
│   └── [YYYY-MM-DD]/         # Session folders generated via $$DATEMINUS12$$ token
│       ├── *_LIGHT_*.fits    # Light frames
│       ├── FLAT_*.fits       # Flat frames
│       ├── DARK_*.fits       # Dark frames
│       └── BIAS_*.fits       # Bias frames
│
├── Calibration/              # Raw calibration frames
│   ├── Bias/
│   │   └── g[gain]_o[offset]/
│   │       └── [YYYY-MM-DD]/
│   │           └── BIAS_*.fits
│   ├── Darks/
│   │   └── [exposure]s_[temp]_g[gain]_o[offset]/
│   │       └── [YYYY-MM-DD]/
│   │           └── DARK_*.fits
│   └── Flats/
│       └── [YYYY-MM-DD]/
│           └── [filter]/     # Session-specific, organized by filter
│               └── FLAT_*.fits
│
├── Masters/                  # Processed master calibration frames
│   ├── Darks/
│   │   └── [exposure]s_[temp]_g[gain]_o[offset]/
│   │       └── master_dark_[YYYY-MM-DD].xisf
│   └── Bias/
│       └── g[gain]_o[offset]/
│           └── master_bias_[YYYY-MM-DD].xisf
│
└── Targets/                  # Organized by target
    ├── M42_Orion_Nebula/
    │   ├── [YYYY-MM-DD]/     # Session folders with raw light frames
    │   │   └── *_LIGHT_*.fits
    │   ├── Calibrated/       # WBPP output
    │   │   └── [YYYY-MM-DD]/
    │   │       └── *.xisf   # Calibrated frames
    │   ├── Integration/      # Combined data
    │   │   ├── Masters/      # Master lights per filter
    │   │   └── Working/      # Integration workspace
    │   └── Results/          # Final processed images
    │       ├── [YYYY-MM-DD]_M42_[filter/palette].tif
    │       └── Web/          # JPEG exports for sharing
    │
    └── NGC7380_Wizard_Nebula/
        └── [same structure...]
```

## Naming Conventions

### Calibration Folders (Raw Frames)
**Darks & Bias** - Organized by parameters for reuse across sessions:
- **Darks:** `Calibration/Darks/[exposure]s_[temp]_g[gain]_o[offset]/[YYYY-MM-DD]/`
  - Example: `Calibration/Darks/300s_-10C_g100_o50/2024-12-15/`
  - Temperature critical due to dark current
- **Bias:** `Calibration/Bias/g[gain]_o[offset]/[YYYY-MM-DD]/`
  - Example: `Calibration/Bias/g100_o50/2024-12-15/`
  - Temperature independent (readout noise pattern)

**Flats** - Session-specific due to dust, rotation:
- **Flats:** `Calibration/Flats/[YYYY-MM-DD]/[filter]/`
  - Example: `Calibration/Flats/2024-12-15/Ha/`

### Masters Folders (Processed Calibration)
Integrated master frames from PixInsight:
- **Master Darks:** `Masters/Darks/[exposure]s_[temp]_g[gain]_o[offset]/`
  - Example: `Masters/Darks/300s_-10C_g100_o50/master_dark_2024-12-15.xisf`
- **Master Bias:** `Masters/Bias/g[gain]_o[offset]/`
  - Example: `Masters/Bias/g100_o50/master_bias_2024-12-15.xisf`

### Target Names
- Use common name with catalog designation
- Format: `[Catalog]_[Common_Name]`
- Examples:
  - `M42_Orion_Nebula`
  - `NGC7380_Wizard_Nebula`
  - `IC1396_Elephants_Trunk`

### File Names (from N.I.N.A.)
Current imaging profile (updated 2025-09-28) writes to `./Unprocessed` with the filename pattern:
`$$DATEMINUS12$$\$$IMAGETYPE$$\$$TARGETNAME$$_$$DATETIME$$_$$FILTER$$_$$SENSORTEMP$$_$$EXPOSURETIME$$s_$$BINNING$$_$$FRAMENR$$`

This yields paths such as:
```
C:\Users\PrimaLuceLab\Documents\N.I.N.A\Unprocessed\2025-09-27\LIGHT\NGC7380_Wizard_Nebula_2025-09-28T01-25-30_Ha_-10C_600s_1x1_0001.fits
```
- `$$DATEMINUS12$$` creates the nightly session folder (local date minus 12 hours to keep post-midnight subs grouped with the previous evening).
- `$$IMAGETYPE$$` builds the calibration subfolders (`LIGHT`, `FLAT`, `DARK`, etc.).
- Remaining tokens preserve target, timestamp, filter, sensor temperature, exposure length, binning, and frame counter for downstream parsing.

## Workflow

### 1. Acquisition (N.I.N.A.)
- N.I.N.A. now saves all frames to `C:\Users\PrimaLuceLab\Documents\N.I.N.A\Unprocessed\[date]\[imagetype]\` using the pattern above.
- Robocopy (or direct network write) mirrors that tree to `/mnt/astro/unprocessed/[date]/` for the NAS-backed workflow.

### 2. Organization (Script)
Run the organization script after each imaging session:
```bash
./scripts/organize-nas-photos.ts \
  -s /mnt/astro/unprocessed \
  -d /mnt/astro \
  --mode archive  # Move files after organizing
```

The script will:
- Parse target names from LIGHT frame filenames
- Move LIGHT frames to `Targets/[target]/[date]/`
- Sort all calibration frames to `Calibration/[type]/[date]/`
- Create target folder structure for new targets
- Note: Master creation is done separately in PixInsight

### 3. Calibration (PixInsight WBPP)
- Input: `Targets/[target]/[date]/` (light frames)
- Raw calibration: Pull from `Calibration/[type]/[date]/`
- Master calibration: Pull from `Masters/` if available
- Output: `Targets/[target]/Calibrated/[date]/`

### 4. Integration (PixInsight)
- Work in `Targets/[target]/Integration/Working/`
- Save masters to `Targets/[target]/Integration/Masters/`
- Keep intermediate files until project complete

### 5. Processing & Export
- Final images saved to `Targets/[target]/Results/`
- Include processing date and filter/palette in filename
- Export web-ready versions for sharing

## Calibration Management

### Master Creation Process
1. Collect 20+ raw frames from `Calibration/[type]/[date]/`
2. Use PixInsight's ImageIntegration with sigma clipping
3. Save masters to `Masters/[type]/[parameters]/`
4. Name format: `master_[type]_[YYYY-MM-DD].xisf`

### Retention Policy
- Raw calibration frames in `Calibration/`: Keep for 3-6 months
- Master calibrations in `Masters/`: Keep indefinitely
- Always preserve masters with matching temperature, gain, and exposure

### Matching Criteria for Calibration
When selecting calibration frames:
- **Darks**: Must match exposure time, temperature (±2°C), gain, and binning
- **Bias**: Must match temperature (±2°C), gain, and binning
- **Flats**: Use from same session (in `calibration/[date]/`), must match filter

## Special Considerations

### Multi-Session Projects
For targets imaged across multiple nights:
- Each session gets its own `[date]/` folder with light frames
- Calibrated frames from all sessions go to respective `Calibrated/[date]/` folders
- Integration combines all calibrated data in `Integration/`

### Mosaics
Create sub-folders for panels:
```
Targets/NGC7000_North_America_Mosaic/
├── panel1/[date]/
├── panel2/[date]/
└── panel3/[date]/
```

### Filter Sets
Organize by filter when relevant:
```
Targets/M42_Orion_Nebula/
└── 2024-12-15/
    ├── Ha/
    ├── OIII/
    └── SII/
```

## Backup Strategy
- Primary storage: `/mnt/astro` on NAS
- Cloud backup: `Targets/*/Results/` only (finished images)
- Archive to external drive: Complete projects after processing
- Raw frames: Keep for 1 year minimum, then evaluate

## Script Configuration

Environment variables for the organization script:
```bash
export NAS_SOURCE_DIR="/mnt/astro/unprocessed"
export NAS_DEST_DIR="/mnt/astro"
export ASTRO_CALIBRATION_DIR="/mnt/astro/calibration"
export ASTRO_MASTERS_DIR="/mnt/astro/masters"
export ASTRO_TARGETS_DIR="/mnt/astro/targets"
```

## References
- [Jamie's Organization Strategy](https://www.theastroshed.com/trying-to-stay-organized-with-all-of-these-images/)
- N.I.N.A. file patterns documentation
- PixInsight WBPP best practices
