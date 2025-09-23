# Astro-Physics Mount Configuration Notes

Here’s the short list of settings that keep our Mach2GTO happy inside N.I.N.A. Most of it echoes Dale Ghent’s excellent write-up, trimmed to what we actually use night to night.

### Control stack
- APCC Pro v1.9.2.5+ with the “NINA Camera Support” + “Decision Tracking” licenses. Launch APCC before N.I.N.A. so the GTOCP5 is awake.
- APPM for pointing models, usually triggered through the Astro-Physics Tools plugin blocks.
- N.I.N.A. 3.x with the SGP Server Emulation plugin (lets APCC/APPM talk to the camera through the legacy API they expect).

### Connectivity + driver bits
- Run the AP V2 ASCOM driver in Advanced mode with pulse guiding enabled. Match the COM/IP to whatever APCC is using so both apps talk to the same controller.
- Inside APCC, turn on PointXP auto-accept for APPM uploads and keep “Side of Pier” checks enabled so sequencer slews respect the meridian rules.
- Leave “Unpark on Connect” off—our setup templates handle unparking safely.

### Sequencer integration
- Lean on the Astro-Physics Tools plugin instructions (`Start APCC`, `Create All-Sky Model`, `Create Dec Arc Model`, `Park Mount`) instead of scripting raw calls. They log telemetry and honour interlocks.
- File the APPM-focused templates under `nina/templates/3. Misc` and stash exported `.apm` configs in `ops/` next to the session notes.

### Operational habits
- Refresh the pointing model at least once per season or after hardware changes; note APPM parameters in commits for traceability.
- Watch encoder temperature + motor current in APCC on long runs. Queue Ground Station alerts if you see trends.
- Keep the Mach2 supply between 13.8 V and 15 V, especially when slewing heavy payloads, to avoid undervoltage hiccups.

Ping this file when firmware or APCC/APPM workflows change.

### Reference
- Dale Ghent, “N.I.N.A. and Astro-Physics Mounts,” accessed 2025-09-23.
