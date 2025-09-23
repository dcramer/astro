# Ground Station

Ground Station adds remote messaging instructions and triggers so N.I.N.A.'s Advanced Sequencer can notify us and our automation stack about session progress or failures.

## Setup Notes
- Install from N.I.N.A.'s Plugin Manager and restart so the Ground Station instruction category appears.
- Configure outputs under `Plugins > Ground Station` before adding instructions to sequences.

## Supported Services
Configure one or more outputs under `Plugins > Ground Station`:
- Pushover (supports emergency-priority looping alerts)
- Telegram bot API
- Email (SMTP with auth + SSL/TLS)
- HTTP GET/POST webhooks (general purpose)
- IFTTT Webhooks gateway
- MQTT topics (includes birth/LWT payloads for home-automation brokers)
    All services accept message tokens so you can inject target, filter, or error details into outbound notifications.

## Usage Notes

## Telegram Setup
1. Chat with [@BotFather](https://t.me/BotFather) in Telegram, run `/newbot`, and follow the prompts to name the bot and pick a unique username. BotFather returns a token like `123456789:ABC-DEF...`-treat it as a secret.
2. In the Ground Station settings (Plugins > Ground Station > Telegram), paste the bot token, and set the polling interval (default 30 s). Store the token in the ops secrets vault; never commit it.
3. Retrieve the chat ID for the recipient channel: either add the bot to a group and use Telegram's `getUpdates` API to read the `chat.id`, or DM the bot once and capture the resulting ID.
4. Enter the chat ID in Ground Station and send a test message (`Ground Station > Send Message`). Verify the bot delivers alerts before enabling production triggers.

- Add `Ground Station > Send Message` instructions after critical milestones (e.g., sequence start, target complete) and pair `Ground Station > On Failure` triggers with retry loops for automated escalation.
- When using MQTT, configure birth/LWT payloads to let observatory dashboards detect lost connectivity automatically.
- For unattended nights, combine Pushover alerts with Remote Copy and Shutdown PC so the phone notifies you if transfers stall or resolve before the system powers down.

## Maintenance Checklist
- Document which services (Pushover, Telegram, MQTT topics) are live and store API keys in the secure ops vault-never in the repo.
- Re-test message tokens after N.I.N.A. or plugin upgrades so formatting changes do not break alerts.
- Review alert routing quarterly to ensure phone numbers, chat IDs, and HTTP endpoints remain valid.

## Open Tasks
- [ ] Finalize notification channels (Pushover vs. Telegram) and record their credentials storage path.
- [ ] Dry-run failure triggers in the simulator to confirm escalations fire correctly.
- [ ] Capture a sample message template in the runbook so future sequencer edits stay consistent.

## References
- Dale Ghent, "Ground Station for N.I.N.A.," accessed September 23, 2025. <https://daleghent.com/ground-station/>
- Telegram, "BotFather Documentation," accessed September 23, 2025. <https://core.telegram.org/bots#botfather>
- tcpalmer, "N.I.N.A. Remote Copy Plugin," GitHub repository, accessed September 23, 2025. <https://github.com/tcpalmer/NINA.Plugin.RemoteCopy>
