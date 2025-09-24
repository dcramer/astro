# Target Scheduler

Target Scheduler raises N.I.N.A.'s automation level by maintaining a project/target database and dispatching the best exposure in real time based on visibility, moon avoidance, and project priorities. The plugin handles slews, filter changes, dithers, and exposure execution through a single Advanced Sequencer instruction.

## Setup Notes
- Install via N.I.N.A.'s Plugin Manager, then restart so the Target Scheduler panels and sequencer instruction load.
- Confirm the observatory profile is stable: plate solving, meridian flips, filter wheel naming, and autofocus must already run reliably in the Advanced Sequencer.
- Walk through the plugin's Getting Started flow to create profiles, projects, targets, exposure templates, and exposure plans before relying on automation.
- Use Scheduler Preview to validate plans for tonight's date/time and confirm there are no blocking conditions before running live.

## Why We Use It
- Dispatch scheduling reacts to live conditions rather than following a static all-night script, so targets can be reprioritized as weather, grading, or completion status changes.
- The scoring engine weights meridian windows, project priority, percent complete, mosaics, moon avoidance, and target switches to maximize useful exposures while minimizing unnecessary flips and slews.
- Exposure selection respects filter cadence, smart moon avoidance, and dithering rules, keeping broadband captures away from bright moon windows while still advancing narrowband plans.
- Integrates tightly with existing safety logic: custom event containers let us insert autofocus, startup, recovery, and notification blocks before/after each target, exposure, or wait period.

## Scheduler Workflow
1. Maintain the project/target database under `Plugins > Target Scheduler`, grouping targets by N.I.N.A. profile and defining minimum altitudes, meridian windows, and moon rules.
2. Build exposure templates first, then attach them to exposure plans so filter settings and default exposures stay consistent across projects.
3. Preview nightly plans with `Plugins > Target Scheduler > Scheduler Preview` to see the timeline, scoring rationale, and any blockers before starting a session.
4. In the Advanced Sequencer, wrap nightly automation around the **Target Scheduler Container** instruction; pair it with our shared setup/shutdown blocks via Sequencer Powerups references.
5. Use the plugin's acquisition reports, image grader, and post-acquisition exports to audit completion percentages and rejection reasons after each run.

## Maintenance Checklist
- Keep release notes handy and re-read migration guidance when upgrading major versions (v5 introduced single-exposure plans and revised scoring behavior).
- Backup the plugin database before large edits; synchronize project definitions across rigs via the plugin's export/import tools.
- Revisit scoring weights each season to balance mosaics, percent complete, and meridian-window priorities against current goals.
- Verify moon avoidance and twilight settings when adding new filters so broadband targets do not start under bright sky conditions.

## Open Tasks
- [ ] Run a simulator night to confirm our shared startup and recovery blocks behave correctly when the scheduler issues wait plans.
- [ ] Document standard scoring-weight presets (broadband vs. narrowband campaigns) in `ops/`.
- [ ] Capture database backup/export steps in the runbook before the next major upgrade.

## References
- tcpalmer, "Target Scheduler Plug-in Home," accessed September 24, 2025.
- tcpalmer, "Target Scheduler Getting Started," accessed September 24, 2025.
- tcpalmer, "Target Scheduler Planning Engine," accessed September 24, 2025.
