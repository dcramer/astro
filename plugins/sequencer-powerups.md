# Sequencer Powerups

We install the Sequencer Powerups plug-in to extend N.I.N.A.'s Advanced Sequencer with reusable building blocks (Template by Reference), additional safety logic, and helper instructions. The project is actively maintained at <https://marcblank.github.io/>.

## Version & Compatibility
- **Version:** 3.22.0.0 (matching our N.I.N.A. 3.2 build)
- **Installation:** Managed through N.I.N.A.'s Plug-in Marketplace; no manual files.
- **Status:** Installed with default settings; shared setup/calibration/shutdown blocks now reference the shared templates.
- **Dependencies:** Requires .NET 6 runtime bundled with N.I.N.A. 3.x.

## Why We Use It
- Adds the **Template by Reference** instruction so a shared template can be reused across multiple sequences without copy/paste.
- Provides enhanced safety and recovery triggers (e.g., park on disconnect, re-run blocks after weather clears).
- Includes utility instructions such as synchronous autofocus calls, pause/resume helpers, and additional logging.

## Template by Reference Maintenance
1. **Keep shared blocks isolated** - Startup, shutdown, calibration, and recovery routines stay under `templates/4. Blocks` (with helpers in `1. Setup` / `3. Misc` as needed).
2. **Reference, don't copy** - Insert `Powerups > Misc > Template by Reference` anywhere those blocks are used so edits to the source propagate.
3. **Re-export after edits** - Save and export the shared template after adjustments, then open dependent sequences to confirm they load the new revision.
4. **Log exceptions** - Note any sequences that temporarily break the reference during testing and restore the reference before committing.
5. **Share validation results** - Record simulator or live-run confirmations in commit messages/PRs when shared blocks change.

## Open Tasks
- [ ] Audit sequences quarterly to confirm they still reference the shared blocks.
- [ ] Flip on advanced safety triggers once we validate their behavior in the simulator.
- [ ] Capture release notes or breaking changes from the plug-in site when upgrading.

Keep the plugin entry in `README.md` current whenever versions or behaviors change.

Reference the official documentation for feature details.citeturn2search0turn2search1
