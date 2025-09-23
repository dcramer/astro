# SGP Server Emulation

SGP Server Emulation restores the SGPro-compatible camera API that was removed in N.I.N.A. 3.0, allowing legacy integrations to keep working.

## Why We Install It
- Astro-Physics Tools uses the SGPro camera endpoint to exchange data with APCC and APPM, so this plugin is mandatory for automated model building in our workflow.
- Third-party utilities that expect SGPro (e.g., APPM) can continue to communicate with N.I.N.A. through the emulated server.

## Configuration Notes
- Enable the plugin and verify the SGPro server port before starting APCC or APPM sessions.
- Document port changes and share them with any external tools scripted against the API.
- When upgrading N.I.N.A., confirm the plugin is updated to the latest release before the next imaging run.

See the N.I.N.A. 3.0 release notes and the APPM integration guidance for background on the plugin's necessity.citeturn8search3turn8search4
