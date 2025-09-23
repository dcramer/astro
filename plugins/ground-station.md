# Ground Station

Ground Station adds remote messaging instructions and triggers so N.I.N.A.'s Advanced Sequencer can notify us and our automation stack about session progress or failures.citeturn0search0

## Version & Compatibility
- **Version:** 2.4.0.0 (released March 1, 2024)citeturn0search5
- **Minimum N.I.N.A.:** 3.0 RC1citeturn0search5
- **Installation:** Install from N.I.N.A.'s Plugin Manager, then restart to expose the Ground Station instruction/trigger category.citeturn0search0

## Supported Services
Configure one or more outputs under `Plugins > Ground Station`:
- Pushover (supports emergency-priority looping alerts)
- Telegram bot API
- Email (SMTP with auth + SSL/TLS)
- HTTP GET/POST webhooks (general purpose)
- IFTTT Webhooks gateway
- MQTT topics (includes birth/LWT payloads for home-automation brokers)
All services accept message tokens so you can inject target, filter, or error details into outbound notifications.citeturn0search0turn0search5

## Usage Notes
- Add `Ground Station > Send Message` instructions after critical milestones (e.g., sequence start, target complete) and pair `Ground Station > On Failure` triggers with retry loops for automated escalation.
- When using MQTT, configure birth/LWT payloads to let observatory dashboards detect lost connectivity automatically.citeturn0search5
- For unattended nights, combine Pushover alerts with Remote Copy and Shutdown PC so the phone notifies you if transfers stall or resolve before the system powers down.citeturn0search7

## Maintenance Checklist
- Document which services (Pushover, Telegram, MQTT topics) are live and store API keys in the secure ops vault—never in the repo.
- Re-test message tokens after N.I.N.A. or plugin upgrades; `FORMAT_DATETIME` parsing changed in 2.4.0.0.
- Review alert routing quarterly to ensure phone numbers, chat IDs, and HTTP endpoints remain valid.citeturn0search5

## Open Tasks
- [ ] Finalize notification channels (Pushover vs. Telegram) and record their credentials storage path.
- [ ] Dry-run failure triggers in the simulator to confirm escalations fire correctly.
- [ ] Capture a sample message template in `docs/` for future sequencer edits.
