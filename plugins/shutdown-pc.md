# Shutdown PC

Shutdown PC gives the Advanced Sequencer a safe, automated way to power down the control machine after imaging completes.

## Key Capabilities
- Issues OS-level shutdown or restart commands with an optional delay so file transfers can finish.
- Provides a “cancel” window and error logging in case the machine should stay online.
- Integrates directly into end-of-night templates, reducing the need for external scripting.

## Usage Notes
- Schedule Shutdown PC after Remote Copy confirmations to avoid interrupting transfers.
- Document any system-specific credentials or policies required to allow remote shutdowns (e.g., Windows group policy adjustments).
- During testing, set a long delay and monitor the plugin log to validate behavior.

Reference the plugin release notes for configuration screens and safe usage guidelines.citeturn1search0
