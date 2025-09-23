# Astro-Physics Mount Configuration Notes

These notes capture the settings we rely on when integrating Astro-Physics mounts with N.I.N.A., based on Dale Ghent's reference guide and our Mach2GTO setup.

## Control Software Stack
- **APCC Pro** (v1.9.2.5 or later) running with "NINA Camera Support" and "Decision Tracking" licenses enabled. Ensure APCC is started before N.I.N.A. so the GTOCP5 controller is online.
- **APPM** All-Sky modelling utility for periodic pointing model maintenance; launched via the Astro-Physics Tools sequencer instructions.
- **N.I.N.A.** 3.x with the **SGP Server Emulation** plugin loaded to expose the legacy SGPro camera API that APCC/APPM expect.

## Connectivity & Driver Settings
- Serial/Ethernet connection uses **AP V2 ASCOM driver** in "Advanced" mode with pulse guiding enabled; set the same COM port or IP that APCC uses.
- Under APCC, configure "PointXP" to accept APPM uploads automatically and enable "Side of Pier" checks so advanced sequencer slews honor meridian constraints.
- Keep "Unpark on Connect" disabled; N.I.N.A. handles unparking inside the setup templates.

## Sequencer Integration
- Use the **Astro-Physics Tools** plugin blocks (`Start APCC`, `Create All-Sky Model`, `Create Dec Arc Model`, `Park Mount`) instead of manual scripting so APCC/APPM calls log telemetry and respect safety interlocks.
- Place APPM modelling sequences in `templates/3. Misc` and archive the resulting `.apm` configuration in `docs/` next to session notes for reproducibility.

## Operational Practices
- Refresh the pointing model seasonally or after major hardware changes to keep automation accurate; log APPM run parameters in commit messages.
- Monitor encoder temperature and motor current in APCC during long runs; add Ground Station alerts if thresholds are exceeded.
- Keep the Mach2's power supply in the 13.8–15 V range when slewing with heavy payloads to avoid undervoltage errors.

Update this checklist whenever firmware revisions or APCC/APPM workflows change.

## References
- Dale Ghent, "N.I.N.A. and Astro-Physics Mounts," accessed September 23, 2025. <https://daleghent.com/nina-and-astro-physics-mounts>
