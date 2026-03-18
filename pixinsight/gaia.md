# PixInsight GAIA Catalog Setup

## Purpose
Document the GAIA catalog data required for PixInsight astrometry and color calibration so rebuilt workstations do not miss a critical post-install step.

## What Ships with PixInsight
- The GAIA process is part of the standard PixInsight distribution. Do not download a separate GAIA module.
- What must be downloaded separately are the GAIA database files from the PixInsight software distribution site using the account download interface in a web browser.
- PixInsight does not provide an in-app downloader for these databases.

## Which Database to Download
- **Astrometry / plate solving / ImageSolver:** download the Gaia DR3 astrometric database files.
- **SPCC color calibration:** download the Gaia DR3/SP photometric database files.
- These are different databases and are not interchangeable.

## Dataset Size Planning
- **Gaia DR3 astrometric database:** 16 numbered files, typically about 2.8 GB each, about 40 GB total.
- **Gaia DR3/SP photometric database:** 20 numbered files, typically about 3.3 GB each, about 63 GB total.
- Both sets are ordered by object magnitude, with brighter objects in the earlier files.
- The first four DR3 files include objects down to magnitude 18.69.
- The first four DR3/SP files include objects down to magnitude 15.4.
- For smoke testing, one or two files from each database can be enough to prove the configuration works, but routine processing usually needs more coverage.

## Download and Storage Workflow
1. Sign in to the PixInsight software distribution site in a web browser.
2. Download the required `.xpsd` files for Gaia DR3 and/or Gaia DR3/SP.
3. Store the astrometric and photometric databases in separate folders.
4. Open the GAIA process in PixInsight and point it at the folders that contain the downloaded files.
5. Validate the setup with one ImageSolver run and one SPCC run before treating the workstation as ready.

## Storage Notes
- The `.xpsd` files can live anywhere on the system; configuration only tells PixInsight where they are and does not move or modify them.
- Keep DR3 and DR3/SP in different folders so it is obvious which catalog is mapped to which task.
- Record the chosen paths in the processing journal when rebuilding or reimaging a workstation.

## Download Reliability Notes
- These files are much larger than typical script or module downloads.
- On a sustained 100 Mb/s link, downloading a full database can take roughly 2 to 3 hours if the connection stays saturated.
- Browser download managers usually support resuming interrupted transfers, which matters for these multi-hour downloads.
