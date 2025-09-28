#!/usr/bin/env tsx

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

interface Config {
  sourceDir: string;
  destDir: string;
  calibrationDir: string;
  mastersDir: string;
  targetsDir: string;
  mode: 'copy' | 'move' | 'archive';
  dryRun: boolean;
  verbose: boolean;
}

interface FileInfo {
  path: string;
  filename: string;
  type: 'LIGHT' | 'FLAT' | 'DARK' | 'BIAS';
  target?: string;
  filter?: string;
  exposure?: number;
  temperature?: number;
  gain?: number;
  offset?: number;
  binning?: string;
  sessionDate: string;
  fwhm?: number;
}

interface MetadataMismatch {
  file: string;
  field: string;
  filenameValue: string | number | undefined;
  headerValue: string | number | undefined;
}

class AstroOrganizer {
  private filesProcessed = 0;
  private filesSkipped = 0;
  private errors: string[] = [];
  private operations: Array<{ from: string; to: string; type: string }> = [];
  private metadataMismatches: MetadataMismatch[] = [];
  private metadataChecks = 0;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  private log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    if (!this.config.verbose && level === 'info') return;

    const timestamp = new Date().toISOString();
    const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '✓';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  private async findDateDirectories(): Promise<string[]> {
    try {
      const entries = await fs.readdir(this.config.sourceDir, { withFileTypes: true });
      const dateDirs = entries
        .filter(entry => entry.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(entry.name))
        .map(entry => ({
          name: entry.name,
          path: path.join(this.config.sourceDir, entry.name)
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      if (dateDirs.length === 0) {
        this.log('No YYYY-MM-DD directories found, scanning source directory directly', 'warn');
        return [this.config.sourceDir];
      }

      this.log(`Found ${dateDirs.length} session directories`);
      return dateDirs.map(d => d.path);
    } catch (error) {
      this.log(`Error reading source directory: ${error}`, 'error');
      return [this.config.sourceDir];
    }
  }

  private extractSessionDate(dirPath: string, fileName?: string): string {
    // Try directory name first
    const dirMatch = dirPath.match(/(\d{4}-\d{2}-\d{2})$/);
    if (dirMatch) return dirMatch[1];

    // Try filename
    if (fileName) {
      const fileMatch = fileName.match(/(\d{4}-\d{2}-\d{2})/);
      if (fileMatch) return fileMatch[1];
    }

    // Default to today
    return new Date().toISOString().split('T')[0];
  }

  private parseFileName(filePath: string, sessionDate: string): FileInfo | null {
    const filename = path.basename(filePath);
    const dirPath = path.dirname(filePath);
    const parentDir = path.basename(dirPath).toUpperCase();

    // Determine frame type from parent directory name
    let type: FileInfo['type'];
    if (parentDir === 'LIGHT' || parentDir === 'LIGHTS') type = 'LIGHT';
    else if (parentDir === 'FLAT' || parentDir === 'FLATS') type = 'FLAT';
    else if (parentDir === 'DARK' || parentDir === 'DARKS') type = 'DARK';
    else if (parentDir === 'BIAS') type = 'BIAS';
    else {
      // If no parent directory match, skip the file
      return null;
    }

    const info: FileInfo = {
      path: filePath,
      filename,
      type,
      sessionDate
    };

    // N.I.N.A. filename template: [Target]_[Date]_[Time]_[Filter]_[Temp]_[Exposure]_[Binning]_[Number].fits
    // Example: Veil Nebula_2025-09-22_21-04-00_L_-9.90_300.00s_2x2_0000.fits
    const parts = filename.replace(/\.(fits?|xisf)$/i, '').split('_');

    // Parse LIGHT frame details (has target name)
    if (type === 'LIGHT') {
      // Find the date index (YYYY-MM-DD pattern)
      const dateIndex = parts.findIndex(p => /^\d{4}-\d{2}-\d{2}$/.test(p));
      if (dateIndex > 0) {
        // Everything before date is the target name
        info.target = this.sanitizeTargetName(parts.slice(0, dateIndex).join(' '));

        // Filter is at dateIndex + 2 (after date and time)
        if (parts[dateIndex + 2]) {
          info.filter = parts[dateIndex + 2].replace(/-/g, '').toUpperCase();
        }

        // Temperature is at dateIndex + 3
        if (parts[dateIndex + 3]) {
          info.temperature = parseFloat(parts[dateIndex + 3]);
        }

        // Exposure is at dateIndex + 4
        if (parts[dateIndex + 4]) {
          const expMatch = parts[dateIndex + 4].match(/(\d+(?:\.\d+)?)/);
          if (expMatch) {
            info.exposure = parseFloat(expMatch[1]);
          }
        }
      }
    }

    // Extract filter for FLAT frames
    if (type === 'FLAT') {
      // Both FlatWizard and regular flat format: [Target/FlatWizard]_[Date]_[Time]_[Filter]_[Temp]_[Exposure]_[Binning]_[Number].fits
      // Time format is HH-MM-SS, filter should not contain only digits and dashes
      const dateIndex = parts.findIndex(p => /^\d{4}-\d{2}-\d{2}$/.test(p));
      if (dateIndex >= 0) {
        // Skip the time part (dateIndex + 1) and get the filter (dateIndex + 2)
        // Filter should be a known filter name, not a time pattern
        const filterCandidate = parts[dateIndex + 2];
        if (filterCandidate && !/^\d{2}-\d{2}-\d{2}$/.test(filterCandidate)) {
          info.filter = filterCandidate.replace(/-/g, '').toUpperCase();
        }

        // Temperature is at dateIndex + 3
        if (parts[dateIndex + 3]) {
          info.temperature = parseFloat(parts[dateIndex + 3]);
        }

        // Exposure is at dateIndex + 4
        if (parts[dateIndex + 4]) {
          const expMatch = parts[dateIndex + 4].match(/(\d+(?:\.\d+)?)/);
          if (expMatch) {
            info.exposure = parseFloat(expMatch[1]);
          }
        }
      }
    }

    // Binning (e.g., 1x1 or 2x2)
    const binMatch = filename.match(/(\d+x\d+)/);
    if (binMatch) {
      info.binning = binMatch[1];
    } else {
      info.binning = '1x1'; // Default
    }

    // For calibration frames, extract gain/offset if present
    if (type !== 'LIGHT') {
      // Gain (e.g., g100)
      const gainMatch = filename.match(/g(\d+)/i);
      if (gainMatch) {
        info.gain = parseInt(gainMatch[1]);
      }

      // Offset (e.g., o50)
      const offsetMatch = filename.match(/o(\d+)/i);
      if (offsetMatch) {
        info.offset = parseInt(offsetMatch[1]);
      }
    }

    return info;
  }

  private normalizeFilter(filter: string): string {
    return filter.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  }

  private normalizeBinning(value: string | number): string | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
      const rounded = Math.max(1, Math.round(value));
      return `${rounded}x${rounded}`;
    }

    const trimmed = String(value).trim();
    const match = trimmed.match(/(\d+)\s*[xX]\s*(\d+)/);
    if (match) {
      return `${match[1]}x${match[2]}`;
    }

    const numeric = parseInt(trimmed, 10);
    if (!Number.isNaN(numeric)) {
      return `${numeric}x${numeric}`;
    }

    return undefined;
  }

  private recordMismatch(
    fileInfo: FileInfo,
    field: string,
    filenameValue: string | number | undefined,
    headerValue: string | number | undefined
  ): void {
    this.metadataMismatches.push({
      file: fileInfo.filename,
      field,
      filenameValue,
      headerValue
    });
    this.log(
      `Metadata mismatch for ${fileInfo.filename} (${field}): filename=${filenameValue ?? 'n/a'} header=${headerValue ?? 'n/a'}`,
      'warn'
    );
  }

  private async readFitsHeaders(
    filePath: string
  ): Promise<Map<string, string | number | boolean> | null> {
    const CARD_SIZE = 80;
    const BLOCK_SIZE = 2880;
    const MAX_BLOCKS = 32;
    let handle: fs.FileHandle | null = null;

    try {
      handle = await fs.open(filePath, 'r');
      const headers = new Map<string, string | number | boolean>();
      const buffer = Buffer.alloc(BLOCK_SIZE);
      let offset = 0;
      let endFound = false;

      for (let block = 0; block < MAX_BLOCKS && !endFound; block++) {
        const { bytesRead } = await handle.read(buffer, 0, BLOCK_SIZE, offset);
        if (bytesRead <= 0) {
          break;
        }

        const chunk = buffer.subarray(0, bytesRead).toString('ascii');

        for (let i = 0; i < chunk.length; i += CARD_SIZE) {
          const card = chunk.slice(i, i + CARD_SIZE);
          if (!card.trim()) {
            continue;
          }

          const key = card.slice(0, 8).trim();
          if (!key) {
            continue;
          }

          if (key === 'END') {
            endFound = true;
            break;
          }

          if (card[8] !== '=' || card[9] !== ' ') {
            continue;
          }

          let valuePart = card.slice(10);
          const commentIndex = valuePart.indexOf('/');
          if (commentIndex !== -1) {
            valuePart = valuePart.slice(0, commentIndex);
          }

          const trimmedValue = valuePart.trim();
          if (!trimmedValue) {
            continue;
          }

          let value: string | number | boolean = trimmedValue;

          if (trimmedValue.startsWith("'") && trimmedValue.endsWith("'")) {
            value = trimmedValue.slice(1, -1).trim();
          } else if (/^[TF]$/i.test(trimmedValue)) {
            value = trimmedValue.toUpperCase() === 'T';
          } else {
            const numeric = Number(trimmedValue);
            if (!Number.isNaN(numeric)) {
              value = numeric;
            }
          }

          headers.set(key.toUpperCase(), value);
        }

        offset += bytesRead;

        if (bytesRead < BLOCK_SIZE) {
          break;
        }
      }

      return headers;
    } catch (error) {
      this.log(
        `Failed to read FITS header for ${path.basename(filePath)}: ${error}`,
        'warn'
      );
      return null;
    } finally {
      if (handle) {
        await handle.close().catch(() => {
          /* ignore */
        });
      }
    }
  }

  private async verifyWithFitsHeader(fileInfo: FileInfo): Promise<void> {
    if (!/\.fits?$/i.test(fileInfo.filename)) {
      return;
    }

    const headers = await this.readFitsHeaders(fileInfo.path);
    if (!headers || headers.size === 0) {
      return;
    }

    const getHeaderValue = (key: string): string | number | boolean | undefined => {
      return headers.get(key.toUpperCase());
    };

    const getString = (keys: string[]): string | undefined => {
      for (const key of keys) {
        const value = getHeaderValue(key);
        if (typeof value === 'string') {
          const trimmed = value.trim();
          if (trimmed.length > 0) {
            return trimmed;
          }
        } else if (typeof value === 'number' || typeof value === 'boolean') {
          return String(value);
        }
      }
      return undefined;
    };

    const getNumber = (keys: string[]): number | undefined => {
      for (const key of keys) {
        const value = getHeaderValue(key);
        if (typeof value === 'number' && Number.isFinite(value)) {
          return value;
        }
        if (typeof value === 'string') {
          const parsed = Number(value);
          if (!Number.isNaN(parsed)) {
            return parsed;
          }
        }
      }
      return undefined;
    };

    const headerTargetRaw = getString(['OBJECT', 'TARGET', 'TARGNAME']);
    if (headerTargetRaw && fileInfo.type === 'LIGHT') {
      const sanitized = this.sanitizeTargetName(headerTargetRaw);
      if (sanitized) {
        if (fileInfo.target) {
          this.metadataChecks++;
          if (sanitized !== fileInfo.target) {
            this.recordMismatch(fileInfo, 'target', fileInfo.target, sanitized);
          }
        } else {
          fileInfo.target = sanitized;
        }
      }
    }

    const headerFilterRaw = getString(['FILTER', 'FILTER1', 'FILTER2']);
    if (headerFilterRaw) {
      const normalized = this.normalizeFilter(headerFilterRaw);
      if (normalized) {
        if (fileInfo.filter) {
          this.metadataChecks++;
          if (normalized !== fileInfo.filter) {
            this.recordMismatch(fileInfo, 'filter', fileInfo.filter, normalized);
          }
        } else {
          fileInfo.filter = normalized;
        }
      }
    }

    const headerExposure = getNumber(['EXPTIME', 'EXPOSURE']);
    if (headerExposure !== undefined) {
      if (fileInfo.exposure !== undefined) {
        this.metadataChecks++;
        if (Math.abs(fileInfo.exposure - headerExposure) > 0.01) {
          this.recordMismatch(fileInfo, 'exposure', fileInfo.exposure, headerExposure);
        }
      } else {
        fileInfo.exposure = headerExposure;
      }
    }

    const headerTemperature = getNumber(['CCD-TEMP', 'CCD_TEMP', 'SENSOR_TEMP', 'SET-TEMP']);
    if (headerTemperature !== undefined) {
      if (fileInfo.temperature !== undefined) {
        this.metadataChecks++;
        if (Math.abs(fileInfo.temperature - headerTemperature) > 0.5) {
          this.recordMismatch(fileInfo, 'temperature', fileInfo.temperature, headerTemperature);
        }
      } else {
        fileInfo.temperature = headerTemperature;
      }
    }

    const headerGain = getNumber(['GAIN']);
    if (headerGain !== undefined) {
      const normalizedGain = Math.round(headerGain);
      if (fileInfo.gain !== undefined) {
        this.metadataChecks++;
        if (fileInfo.gain !== normalizedGain) {
          this.recordMismatch(fileInfo, 'gain', fileInfo.gain, normalizedGain);
        }
      } else if (normalizedGain > 0) {
        fileInfo.gain = normalizedGain;
      }
    }

    const headerOffset = getNumber(['OFFSET', 'CAMERA_OFFSET']);
    if (headerOffset !== undefined) {
      const normalizedOffset = Math.round(headerOffset);
      if (fileInfo.offset !== undefined) {
        this.metadataChecks++;
        if (fileInfo.offset !== normalizedOffset) {
          this.recordMismatch(fileInfo, 'offset', fileInfo.offset, normalizedOffset);
        }
      } else if (normalizedOffset >= 0) {
        fileInfo.offset = normalizedOffset;
      }
    }

    const headerBinningCandidates: Array<string | number> = [];
    const binningString = getString(['BINNING']);
    if (binningString) headerBinningCandidates.push(binningString);
    const xBin = getNumber(['XBINNING']);
    const yBin = getNumber(['YBINNING']);
    if (xBin !== undefined && yBin !== undefined) {
      headerBinningCandidates.push(`${xBin}x${yBin}`);
    } else if (xBin !== undefined) {
      headerBinningCandidates.push(`${xBin}x${xBin}`);
    } else if (yBin !== undefined) {
      headerBinningCandidates.push(`${yBin}x${yBin}`);
    }

    let normalizedHeaderBinning: string | undefined;
    for (const candidate of headerBinningCandidates) {
      normalizedHeaderBinning = this.normalizeBinning(String(candidate));
      if (normalizedHeaderBinning) break;
    }

    if (normalizedHeaderBinning) {
      if (fileInfo.binning) {
        this.metadataChecks++;
        if (normalizedHeaderBinning !== fileInfo.binning) {
          this.recordMismatch(fileInfo, 'binning', fileInfo.binning, normalizedHeaderBinning);
        }
      } else {
        fileInfo.binning = normalizedHeaderBinning;
      }
    }

    const headerFwhm = getNumber(['FWHM', 'HFR', 'HALFFLUXR']);
    if (headerFwhm !== undefined) {
      fileInfo.fwhm = headerFwhm;
    }
  }

  private sanitizeTargetName(name: string): string {
    return name
      .replace(/[()]/g, '')
      .replace(/'/g, '')
      .trim()
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_');
  }

  private getCalibrationPath(info: FileInfo): string {
    const { type, sessionDate, temperature, gain, exposure, filter, offset = 50 } = info;

    let destPath: string;
    switch (type) {
      case 'DARK': {
        // Calibration/Darks/300s_-10C_g100_o50/2024-12-15/
        const temp = temperature !== undefined ? Math.round(temperature) : 0;
        const g = gain || 0;
        const exp = exposure || 0;
        const paramFolder = `${exp}s_${temp}C_g${g}_o${offset}`;

        destPath = path.join(
          this.config.calibrationDir,
          'Darks',
          paramFolder,
          sessionDate,
          info.filename
        );
        break;
      }
      case 'BIAS': {
        // Calibration/Bias/g100_o50/2024-12-15/
        // Bias frames don't depend on temperature (readout noise pattern)
        const g = gain || 0;
        const paramFolder = `g${g}_o${offset}`;

        destPath = path.join(
          this.config.calibrationDir,
          'Bias',
          paramFolder,
          sessionDate,
          info.filename
        );
        break;
      }
      case 'FLAT': {
        // Calibration/Flats/2024-12-15/[filter]/
        // If no filter detected, organize directly in date folder
        if (filter) {
          destPath = path.join(
            this.config.calibrationDir,
            'Flats',
            sessionDate,
            filter,
            info.filename
          );
        } else {
          // No filter detected, put directly in date folder
          destPath = path.join(
            this.config.calibrationDir,
            'Flats',
            sessionDate,
            info.filename
          );
        }
        break;
      }
      default:
        destPath = path.join(
          this.config.calibrationDir,
          type.toLowerCase(),
          sessionDate,
          info.filename
        );
    }

    return destPath;
  }

  private getTargetPath(info: FileInfo): string {
    const { targetsDir } = this.config;
    const { target, sessionDate, filter } = info;

    if (!target) return '';

    // Targets/M42_Orion_Nebula/2024-12-15/
    // All images in targets folder are lights, no need for explicit Lights folder
    let targetPath = path.join(
      targetsDir,
      target,
      sessionDate
    );

    // If we have filter info, organize by filter
    if (filter) {
      targetPath = path.join(targetPath, filter);
    }

    return path.join(targetPath, info.filename);
  }

  private async processFile(fileInfo: FileInfo): Promise<void> {
    let destPath: string;

    if (fileInfo.type === 'LIGHT') {
      destPath = this.getTargetPath(fileInfo);
      if (!destPath) {
        this.log(`Warning: Could not determine target for ${fileInfo.filename}`, 'warn');
        this.filesSkipped++;
        return;
      }
    } else {
      destPath = this.getCalibrationPath(fileInfo);
    }

    const destDir = path.dirname(destPath);

    if (this.config.dryRun) {
      // Show concise output: type/filename -> relative destination path
      const relativeDest = path.relative(this.config.destDir, destPath);
      const relativeDir = path.dirname(relativeDest);
      const parentFolder = path.basename(path.dirname(fileInfo.path));
      console.log(`  ${parentFolder}/${fileInfo.filename} → ${relativeDir}/`);
      this.operations.push({
        from: fileInfo.path,
        to: destPath,
        type: fileInfo.type
      });
    } else {
      // Create destination directory
      await fs.mkdir(destDir, { recursive: true });

      // Check if file already exists
      try {
        await fs.access(destPath);
        this.log(`Skipping ${fileInfo.filename} - already exists at destination`);
        this.filesSkipped++;
        return;
      } catch {
        // File doesn't exist, proceed
      }

      // Copy, move, or archive based on mode
      try {
        if (this.config.mode === 'move' || this.config.mode === 'archive') {
          await fs.rename(fileInfo.path, destPath);
          this.log(`Moved ${fileInfo.filename} to ${path.relative(this.config.destDir, destPath)}`);
        } else {
          await fs.copyFile(fileInfo.path, destPath);
          this.log(`Copied ${fileInfo.filename} to ${path.relative(this.config.destDir, destPath)}`);
        }
        this.filesProcessed++;
      } catch (error) {
        const msg = `Error processing ${fileInfo.filename}: ${error}`;
        this.log(msg, 'error');
        this.errors.push(msg);
      }
    }
  }

  private async findFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    async function walk(currentDir: string): Promise<void> {
      try {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);

          if (entry.isDirectory() && !entry.name.startsWith('.')) {
            await walk(fullPath);
          } else if (entry.isFile() && /\.(fits?|xisf)$/i.test(entry.name)) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        console.error(`Error reading directory ${currentDir}: ${error}`);
      }
    }

    await walk(dir);
    return files;
  }

  private async createTargetStructure(targetName: string): Promise<void> {
    if (this.config.dryRun) return;

    const targetDir = path.join(this.config.targetsDir, targetName);
    const dirs = [
      path.join(targetDir, 'Calibrated'),
      path.join(targetDir, 'Integration', 'Masters'),
      path.join(targetDir, 'Integration', 'Working'),
      path.join(targetDir, 'Results', 'Web')
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  async organize(): Promise<void> {
    // Validate source
    try {
      const stats = await fs.stat(this.config.sourceDir);
      if (!stats.isDirectory()) {
        throw new Error(`Source is not a directory: ${this.config.sourceDir}`);
      }
    } catch (error) {
      throw new Error(`Source directory error: ${error}`);
    }

    // Create destination directories
    if (!this.config.dryRun) {
      await fs.mkdir(this.config.calibrationDir, { recursive: true });
      await fs.mkdir(this.config.mastersDir, { recursive: true });
      await fs.mkdir(this.config.targetsDir, { recursive: true });
    }

    console.log(`\n🔭 Astro Image Organizer`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Source:      ${this.config.sourceDir}`);
    console.log(`Calibration: ${this.config.calibrationDir}`);
    console.log(`Masters:     ${this.config.mastersDir}`);
    console.log(`Targets:     ${this.config.targetsDir}`);
    console.log(`Mode:        ${this.config.mode}${this.config.dryRun ? ' (DRY RUN)' : ''}`);
    console.log();

    const dateDirs = await this.findDateDirectories();
    const processedTargets = new Set<string>();

    for (const dateDir of dateDirs) {
      const sessionDate = this.extractSessionDate(dateDir);
      console.log(`📅 Processing session: ${sessionDate}`);

      const files = await this.findFiles(dateDir);
      console.log(`   Found ${files.length} FITS/XISF files`);

      for (const file of files) {
        const fileInfo = this.parseFileName(file, sessionDate);
        if (!fileInfo) continue;

        await this.verifyWithFitsHeader(fileInfo);

        // Track targets for target structure creation
        if (fileInfo.target && !processedTargets.has(fileInfo.target)) {
          processedTargets.add(fileInfo.target);
          await this.createTargetStructure(fileInfo.target);
        }

        await this.processFile(fileInfo);
      }
    }

    // Summary
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`✅ Organization complete`);
    console.log(`   Files processed: ${this.filesProcessed}`);
    console.log(`   Files skipped: ${this.filesSkipped}`);
    if (this.errors.length > 0) {
      console.log(`   Errors: ${this.errors.length}`);
    }

    if (this.metadataChecks > 0) {
      console.log(`   Metadata checks: ${this.metadataChecks}`);
      if (this.metadataMismatches.length > 0) {
        console.log(`   Metadata mismatches: ${this.metadataMismatches.length}`);
      }
    }

    if (this.metadataMismatches.length > 0) {
      console.log('\n⚠️ Metadata mismatches detected:');
      for (const mismatch of this.metadataMismatches) {
        console.log(
          `   ${mismatch.file} → ${mismatch.field}: filename=${mismatch.filenameValue ?? 'n/a'} header=${mismatch.headerValue ?? 'n/a'}`
        );
      }
    }

    if (this.config.dryRun && this.operations.length > 0) {
      console.log('\n📊 Summary of operations:');
      const summary = this.operations.reduce((acc, op) => {
        acc[op.type] = (acc[op.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      for (const [type, count] of Object.entries(summary)) {
        console.log(`   ${type}: ${count} files`);
      }

      // Show target summary for LIGHT frames
      const targets = new Set(
        this.operations
          .filter(op => op.type === 'LIGHT')
          .map(op => {
            const match = op.to.match(/Targets\/([^\/]+)\//);
            return match ? match[1] : 'Unknown';
          })
      );

      if (targets.size > 0) {
        console.log('\n🎯 Targets found:');
        for (const target of targets) {
          console.log(`   - ${target}`);
        }
      }
    }

    // Clean up empty source directories in archive mode
    if (this.config.mode === 'archive' && !this.config.dryRun && this.filesProcessed > 0) {
      console.log('\n🧹 Cleaning empty directories...');
      await this.cleanEmptyDirs(this.config.sourceDir);
    }
  }

  private async cleanEmptyDirs(dir: string): Promise<void> {
    try {
      const entries = await fs.readdir(dir);

      if (entries.length === 0) {
        await fs.rmdir(dir);
        this.log(`Removed empty directory: ${dir}`);
      } else {
        // Check subdirectories
        for (const entry of entries) {
          const fullPath = path.join(dir, entry);
          const stats = await fs.stat(fullPath);
          if (stats.isDirectory()) {
            await this.cleanEmptyDirs(fullPath);
          }
        }

        // Check again if now empty
        const remaining = await fs.readdir(dir);
        if (remaining.length === 0 && dir !== this.config.sourceDir) {
          await fs.rmdir(dir);
          this.log(`Removed empty directory: ${dir}`);
        }
      }
    } catch (error) {
      // Ignore errors during cleanup
    }
  }
}

async function main() {
  const usage = `Usage: organize-nas-photos.ts [options]

Options:
  -s, --source <path>     Source directory (default: $NAS_SOURCE_DIR or /mnt/astro/Unprocessed)
  -d, --dest <path>       Base destination directory (default: $NAS_DEST_DIR or /mnt/astro)
  --calibration <path>    Calibration directory for raw frames (default: dest/Calibration)
  --masters <path>        Masters directory for processed calibration (default: dest/Masters)
  --targets <path>        Targets directory for light frames (default: dest/Targets)
  -m, --mode <mode>       Operation mode: copy, move, or archive (default: copy)
                          - copy: Copy files to destination
                          - move: Move files to destination
                          - archive: Move files and clean up empty source dirs
  -t, --dry-run           Show what would be done without making changes
  -v, --verbose           Show detailed progress
  -h, --help              Show this help message

Environment Variables:
  NAS_SOURCE_DIR          Default source directory
  NAS_DEST_DIR            Default destination base directory
  ASTRO_CALIBRATION_DIR   Default calibration directory (raw frames)
  ASTRO_MASTERS_DIR       Default masters directory (processed calibration)
  ASTRO_TARGETS_DIR       Default targets directory

Examples:
  # Dry run to preview organization
  npm run organize:dry

  # Organize new images (copy mode)
  npm run organize -- -s /mnt/astro/unprocessed -d /mnt/astro

  # Archive mode (move and clean up)
  npm run organize -- --mode archive -v`;

  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      source: { type: 'string', short: 's' },
      dest: { type: 'string', short: 'd' },
      calibration: { type: 'string' },
      masters: { type: 'string' },
      targets: { type: 'string' },
      mode: { type: 'string', short: 'm', default: 'copy' },
      'dry-run': { type: 'boolean', short: 't', default: false },
      verbose: { type: 'boolean', short: 'v', default: false },
      help: { type: 'boolean', short: 'h' }
    }
  });

  if (values.help) {
    console.log(usage);
    process.exit(0);
  }

  // Validate mode
  const mode = values.mode as string;
  if (!['copy', 'move', 'archive'].includes(mode)) {
    console.error(`Invalid mode: ${mode}`);
    console.log(usage);
    process.exit(1);
  }

  // Set up paths
  const sourceDir = values.source || process.env.NAS_SOURCE_DIR || '/mnt/astro/Unprocessed';
  const destDir = values.dest || process.env.NAS_DEST_DIR || '/mnt/astro';
  const calibrationDir = values.calibration || process.env.ASTRO_CALIBRATION_DIR || path.join(destDir, 'Calibration');
  const mastersDir = values.masters || process.env.ASTRO_MASTERS_DIR || path.join(destDir, 'Masters');
  const targetsDir = values.targets || process.env.ASTRO_TARGETS_DIR || path.join(destDir, 'Targets');

  const config: Config = {
    sourceDir: path.resolve(sourceDir),
    destDir: path.resolve(destDir),
    calibrationDir: path.resolve(calibrationDir),
    mastersDir: path.resolve(mastersDir),
    targetsDir: path.resolve(targetsDir),
    mode: mode as 'copy' | 'move' | 'archive',
    dryRun: values['dry-run'] as boolean,
    verbose: values.verbose as boolean
  };

  try {
    const organizer = new AstroOrganizer(config);
    await organizer.organize();
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
