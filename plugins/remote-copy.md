# Remote Copy

Remote Copy automates post-capture file transfers so raw frames land on processing or backup machines without manual intervention.

## Key Capabilities
- Watches one or more source directories and copies new exposures to a remote host via UNC path or local drive mapping.
- Can down-select by file patterns (e.g., only light frames, or a specific filter tag) to conserve bandwidth.
- Exposes transfer statistics inside N.I.N.A., helping confirm that files reach downstream systems before shutdown routines begin.

## Deployment Notes
- Configure a dedicated destination path in the plugin settings and ensure the N.I.N.A. service account has write access.
- Pair with Shutdown PC or other end-of-night scripts to guarantee file transfer completes before power down.
- Log transfer summaries under `docs/` when testing new storage hardware.

See tcpalmer's plugin documentation for UI conventions and setup instructions.citeturn1search3
