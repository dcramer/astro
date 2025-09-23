# Session Metadata

Session Metadata captures structured run information at the end of each imaging night so logs and automation artifacts remain searchable.

## Key Capabilities
- Writes customizable JSON or CSV summaries with session start/stop times, targets, filters, and weather observations.
- Supports user-defined fields (e.g., seeing, transparency, or manual notes) to maintain observational context in version control.
- Exposes variables that Advanced Sequencer templates can consume to branch on current conditions.

## Usage Notes
- Configure the output directory to a repository-backed path (e.g., `docs/session-logs/`) so metadata files persist alongside templates.
- Adopt a consistent filename pattern such as `YYYY-MM-DD_session.json` for easy sorting.
- Consider pairing with Web Session History Viewer to visualize metadata after each run.

Refer to the repository documentation for advanced configuration options.citeturn1search5
