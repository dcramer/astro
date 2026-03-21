# PixInsight Agent Notes

## Updating Script `md5sum` Values In Icon Workflows
- Workflow icon packs live in `pixinsight/icons/*.xpsm`.
- Run `pnpm validate:pixinsight` before and after editing workflow exports.
- When a serialized `Script` instance has a stale `<parameter id="md5sum">`, hash the installed PixInsight script from `/mnt/c/Program Files/PixInsight/src/scripts`.
- Match each hash to the serialized `<parameter id="filePath">` entry in the `.xpsm` file and update only the `md5sum` value unless a path fix is also required.
- Use `md5sum "<script-path>"` to compute the current hash.
- Some scripts are installed in subdirectories. Current known example: `ImageBlend` is installed at `/mnt/c/Program Files/PixInsight/src/scripts/CosmicPhotons/ImageBlend/ImageBlend.js`, even if older workflow exports reference `$PXI_SRCDIR/scripts/ImageBlend/ImageBlend.js`.
- On Windows, RC Astro AI model files are `.pb`, not `.mlpackage`. In `.xpsm` exports, normalize entries such as `BlurXTerminator.4.pb`, `NoiseXTerminator.3.pb`, and `StarXTerminator.11.pb`.
- Verify model filenames against `/mnt/c/Program Files/PixInsight/library` before editing if the installed version may have changed.
- The validator in `scripts/validate-pixinsight-workflows.ts` checks XML structure, script `md5sum` values, script path resolution, and Windows RC Astro `.pb` model filenames.
- If multiple `.xpsm` files reference the same script, update all of them in the same change so shared hashes stay consistent.
