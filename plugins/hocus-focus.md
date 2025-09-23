# Hocus Focus

Hocus Focus adds a multi-star, real-time focusing utility that replaces the built-in autofocus routine in N.I.N.A.

## Key Capabilities
- Measures focus using stacked HFR samples across many stars instead of a single V-curve, improving robustness in poor seeing.
- Supports filter offsets, backlash compensation, and autofocus triggers tied to temperature or filter changes.
- Exposes diagnostic graphs and can hand back best-focus offsets to the Advanced Sequencer.

## Usage Notes
- Configure the plugin via the Hocus Focus dock; once enabled, Advanced Sequencer autofocus instructions will execute through Hocus Focus automatically.
- Record chosen profiles, backlash settings, and weighting options when they deviate from defaults; store snapshots in `plugins/hocus-focus.md` for traceability.
- For testing, run the plugin's simulated autofocus to confirm step size and exposure before the next live session.

Reference the user guide for detailed configuration steps.citeturn8search5
