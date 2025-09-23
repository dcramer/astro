# Plugin Library

This directory centralizes documentation for every N.I.N.A. plugin we depend on. Each plugin has its own note under `plugins/*.md`; use this page as the index when updating versions, config details, or onboarding new gear.

## Plugin Roster
| Plug-in | Docs | Purpose / Notes |
|---------|------|-----------------|
| Sequencer Powerups | [Notes](sequencer-powerups.md) · [Docs](https://marcblank.github.io/) | Template by Reference, safety triggers, extended instructions. |
| Astro-Physics Tools | [Notes](astro-physics-tools.md) · [Docs](https://daleghent.com/astro-physics-tools/) | Automates APCC/APPM model building inside sequences. |
| Ground Station | [Notes](ground-station.md) · [Docs](https://daleghent.com/ground-station/) | Monitors capture status and pushes alerts/telemetry to remote dashboards. |
| Hocus Focus | [Notes](hocus-focus.md) · [Docs](https://patriotastro.github.io/NINA_Plugins/HocusFocus.html) | Multi-star autofocus with detailed diagnostics. |
| PixInsight Tools | [Notes](pixinsight-tools.md) · [Demo](https://www.bilibili.com/video/BV1os411A7Ha) | Launches PixInsight scripts during capture for in-session processing. |
| Remote Copy | [Notes](remote-copy.md) · [Docs](https://github.com/tcpalmer/NINA.Plugin.RemoteCopy) | Mirrors subs to processing/backup storage automatically. |
| Session Metadata | [Notes](session-metadata.md) · [Docs](https://github.com/tcpalmer/NINA.Plugin.SessionMetadata) | Generates structured nightly logs for analysis. |
| SGP Server Emulation | [Notes](sgp-server-emulation.md) · [Docs](https://nighttime-imaging.eu/news/2024/05/09/n.i.n.a.-3.0.0.1005-beta-release-notes/) | Restores SGPro API required by Astro-Physics Tools and APPM. |
| Shutdown PC | [Notes](shutdown-pc.md) · [Docs](https://github.com/tcpalmer/NINA.Plugin.ShutdownPC/releases) | Automates safe end-of-night power down. |
| Three Point Polar Alignment | [Notes](three-point-polar-alignment.md) · [Docs](https://doc.polo65.net/NINA-TPPA/) | Guides polar alignment via plate solving. |
| Web Session History Viewer | [Notes](web-session-history-viewer.md) · [Docs](https://github.com/tcpalmer/NINA.Plugin.WebSessionHistoryViewer) | Publishes live and historical session dashboards via browser. |

## Integration Notes
### Sequencer Powerups
Shared setup, calibration, and shutdown blocks now load via Template by Reference. Keep those reusable templates under `templates/4. Blocks`, reference them through `Powerups > Misc > Template by Reference`, and re-import sequences after edits so they pick up new revisions automatically.citeturn2search0turn2search1

### Shutdown PC
Our end-of-night flows finish with the Shutdown PC instruction after Remote Copy confirms file transfers. Set the delay long enough for storage jobs to finish, and document any credential or group-policy requirements in `shutdown-pc.md`.citeturn1search0

### Ground Station
Use Ground Station message instructions to push alerts to Pushover, Telegram, MQTT, or HTTP webhooks whenever sequencing hits critical milestones or faults. Configure the destinations under `Plugins > Ground Station`, keep API keys outside the repo, and re-test message tokens when upgrading to a new plugin version (2.4.0.0 introduced token changes like `FORMAT_DATETIME`).citeturn0search0turn0search5

## Maintenance Checklist
- Update the roster whenever we add/remove plugins or change versions.
- Note dependencies (e.g., SGP Server Emulation for Astro-Physics Tools) so upgrades stay coordinated.
- Capture configuration deltas in each plugin's note, including port numbers or advanced safety toggles.
- Link validation results or simulator runs in pull requests when plugin behavior changes.
