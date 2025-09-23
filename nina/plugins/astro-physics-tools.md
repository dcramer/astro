# Astro-Physics Tools

Astro-Physics Tools adds dedicated Advanced Sequencer instructions for observatories that run APCC and APPM with Astro-Physics mounts.

## What It Provides
- Launches APCC and connects N.I.N.A. to the AP mount driver (`Start APCC`).
- Automates APPM all-sky or declination-arc point models directly from a sequence instruction and pushes results back into APCC (`Create All-Sky Model`, `Create Dec Arc Model`).
- Includes safety-centric actions such as scripted mount parking.

## Prerequisites
- N.I.N.A. 2.0+ with the server interface enabled, or N.I.N.A. 3.x with the SGP Server Emulation plugin installed to expose the SGPro-compatible camera API.
- APCC Pro >= 1.9.2.5 with NINA Camera Support and Dec Arc Tracking licensed.

## Notes for Our Setup
- Installing SGP Server Emulation remains mandatory on our N.I.N.A. 3.x systems before enabling model-building instructions.
- Capture and archive APPM configuration files used in automated runs alongside the related target templates.

Further documentation lives on Dale Ghent's support page for the plugin.
