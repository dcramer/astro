# Astrophotography Image Organization Strategy

## Overview
This document describes the folder structure and organization strategy for managing astrophotography images captured with N.I.N.A. and processed with PixInsight.

## Directory Structure

```
/mnt/astro/
├── unprocessed/              # Raw incoming data from N.I.N.A. (via Robocopy)
│   └── [YYYY-MM-DD]/         # Session folders auto-created by N.I.N.A.
│       ├── *_LIGHT_*.fits    # Light frames
│       ├── FLAT_*.fits       # Flat frames
│       ├── DARK_*.fits       # Dark frames
│       └── BIAS_*.fits       # Bias frames
│
├── calibration/              # Raw calibration frames
│   ├── bias/
│   │   └── g[gain]_o[offset]/
│   │       └── [YYYY-MM-DD]/
│   │           └── BIAS_*.fits
│   ├── darks/
│   │   └── [exposure]s_[temp]_g[gain]_o[offset]/
│   │       └── [YYYY-MM-DD]/
│   │           └── DARK_*.fits
│   └── flats/
│       └── [YYYY-MM-DD]/
│           └── [filter]/     # Session-specific, organized by filter
│               └── FLAT_*.fits
│
├── masters/                  # Processed master calibration frames
│   ├── darks/
│   │   └── [exposure]s_[temp]_g[gain]_o[offset]/
│   │       └── master_dark_[YYYY-MM-DD].xisf
│   └── bias/
│       └── g[gain]_o[offset]/
│           └── master_bias_[YYYY-MM-DD].xisf
│
└── targets/                  # Organized by target
    ├── M42_Orion_Nebula/
    │   ├── captures/         # Raw light frames by session
    │   │   └── [YYYY-MM-DD]/
    │   │       └── LIGHTS/
    │   │           └── *_LIGHT_*.fits
    │   ├── calibrated/       # WBPP output
    │   │   └── [YYYY-MM-DD]/
    │   │       └── *.xisf   # Calibrated frames
    │   ├── integration/      # Combined data
    │   │   ├── masters/      # Master lights per filter
    │   │   └── working/      # Integration workspace
    │   └── results/          # Final processed images
    │       ├── [YYYY-MM-DD]_M42_[filter/palette].tif
    │       └── web/          # JPEG exports for sharing
    │
    └── NGC7380_Wizard_Nebula/
        └── [same structure...]
```

## Naming Conventions

### Calibration Folders (Raw Frames)
**Darks & Bias** - Organized by parameters for reuse across sessions:
- **Darks:** `calibration/darks/[exposure]s_[temp]_g[gain]_o[offset]/[YYYY-MM-DD]/`
  - Example: `calibration/darks/300s_-10C_g100_o50/2024-12-15/`
  - Temperature critical due to dark current
- **Bias:** `calibration/bias/g[gain]_o[offset]/[YYYY-MM-DD]/`
  - Example: `calibration/bias/g100_o50/2024-12-15/`
  - Temperature independent (readout noise pattern)

**Flats** - Session-specific due to dust, rotation:
- **Flats:** `calibration/flats/[YYYY-MM-DD]/[filter]/`
  - Example: `calibration/flats/2024-12-15/Ha/`

### Masters Folders (Processed Calibration)
Integrated master frames from PixInsight:
- **Master Darks:** `masters/darks/[exposure]s_[temp]_g[gain]_o[offset]/`
  - Example: `masters/darks/300s_-10C_g100_o50/master_dark_2024-12-15.xisf`
- **Master Bias:** `masters/bias/g[gain]_o[offset]/`
  - Example: `masters/bias/g100_o50/master_bias_2024-12-15.xisf`

### Target Names
- Use common name with catalog designation
- Format: `[Catalog]_[Common_Name]`
- Examples:
  - `M42_Orion_Nebula`
  - `NGC7380_Wizard_Nebula`
  - `IC1396_Elephants_Trunk`

### File Names (from N.I.N.A.)
Standard N.I.N.A. pattern is preserved:
`[Target]_[Filter]_[Exposure]s_[Temp]C_[Gain]_[Sequence].fits`

## Workflow

### 1. Acquisition (N.I.N.A.)
- N.I.N.A. saves all frames to `/mnt/astro/unprocessed/[date]/`
- Robocopy or direct network write handles the transfer

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
- Move LIGHT frames to `targets/[target]/captures/[date]/`
- Sort all calibration frames to `calibration/[type]/[date]/`
- Create target folder structure for new targets
- Note: Master creation is done separately in PixInsight

### 3. Calibration (PixInsight WBPP)
- Input: `targets/[target]/captures/[date]/LIGHTS/`
- Raw calibration: Pull from `calibration/[type]/[date]/`
- Master calibration: Pull from `masters/` if available
- Output: `targets/[target]/calibrated/[date]/`

### 4. Integration (PixInsight)
- Work in `targets/[target]/integration/working/`
- Save masters to `targets/[target]/integration/masters/`
- Keep intermediate files until project complete

### 5. Processing & Export
- Final images saved to `targets/[target]/results/`
- Include processing date and filter/palette in filename
- Export web-ready versions for sharing

## Calibration Management

### Master Creation Process
1. Collect 20+ raw frames from `calibration/[type]/[date]/`
2. Use PixInsight's ImageIntegration with sigma clipping
3. Save masters to `masters/[type]/[parameters]/`
4. Name format: `master_[type]_[YYYY-MM-DD].xisf`

### Retention Policy
- Raw calibration frames in `calibration/`: Keep for 3-6 months
- Master calibrations in `masters/`: Keep indefinitely
- Always preserve masters with matching temperature, gain, and exposure

### Matching Criteria for Calibration
When selecting calibration frames:
- **Darks**: Must match exposure time, temperature (±2°C), gain, and binning
- **Bias**: Must match temperature (±2°C), gain, and binning
- **Flats**: Use from same session (in `calibration/[date]/`), must match filter

## Special Considerations

### Multi-Session Projects
For targets imaged across multiple nights:
- Each session gets its own `captures/[date]/` folder
- Calibrated frames from all sessions go to respective `calibrated/[date]/` folders
- Integration combines all calibrated data in `integration/`

### Mosaics
Create sub-folders for panels:
```
targets/NGC7000_North_America_Mosaic/
├── captures/
│   ├── panel1/[date]/
│   ├── panel2/[date]/
│   └── panel3/[date]/
```

### Filter Sets
Organize by filter when relevant:
```
targets/M42_Orion_Nebula/
├── captures/
│   └── 2024-12-15/
│       ├── Ha/
│       ├── OIII/
│       └── SII/
```

## Backup Strategy
- Primary storage: `/mnt/astro` on NAS
- Cloud backup: `targets/*/results/` only (finished images)
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