# PixInsight Tools

PixInsight Tools bridges N.I.N.A. and PixInsight so calibration scripts or process icons can run automatically while an imaging session progresses.

## Key Capabilities
- Invokes PixInsight via its command-line interface to apply preprocessing or cosmetic correction as soon as new subs land on disk.
- Supports running user-defined scripts or process containers on a configurable schedule (per frame, post-sequence, or manual trigger).
- Provides status feedback inside N.I.N.A. so operators can confirm PixInsight tasks completed without leaving the session.

## Deployment Notes
- Install PixInsight on the acquisition machine and ensure its command-line executable is in the system PATH.
- Configure the plugin with the target process container or script path, plus any output directories that should be monitored by downstream automation.
- Document each PixInsight project or script stored in version control (e.g., reference a `.xpsm` file under `docs/` if applicable).

See the GitHub project and walkthrough video for configuration examples.citeturn9search0turn16search1
