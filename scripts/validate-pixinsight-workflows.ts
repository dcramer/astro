#!/usr/bin/env tsx

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const SCRIPT_PREFIX = '$PXI_SRCDIR/scripts/';
const MODEL_CLASSES = new Set(['BlurXTerminator', 'NoiseXTerminator', 'StarXTerminator']);
const DEFAULT_PIXINSIGHT_ROOT = '/mnt/c/Program Files/PixInsight';

interface CliOptions {
  pixinsightRoot: string;
  strictScriptPaths: boolean;
  paths: string[];
}

interface WorkflowInstance {
  className: string;
  instanceId: string;
  params: Map<string, string>;
}

interface ValidationResult {
  ok: boolean;
  warnings: string[];
  errors: string[];
}

function parseCliOptions(): CliOptions {
  const parsed = parseArgs({
    allowPositionals: true,
    options: {
      'pixinsight-root': {
        type: 'string'
      },
      'strict-script-paths': {
        type: 'boolean'
      }
    }
  });

  return {
    pixinsightRoot: parsed.values['pixinsight-root'] ?? DEFAULT_PIXINSIGHT_ROOT,
    strictScriptPaths: parsed.values['strict-script-paths'] ?? false,
    paths: parsed.positionals
  };
}

function main(): number {
  const options = parseCliOptions();
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const scriptsRoot = path.join(options.pixinsightRoot, 'src', 'scripts');
  const libraryRoot = path.join(options.pixinsightRoot, 'library');
  const targets = collectTargets(options.paths, path.join(repoRoot, 'pixinsight', 'icons'));

  if (targets.length === 0) {
    console.error('ERROR no .xpsm files found to validate');
    return 1;
  }

  if (!existsSync(scriptsRoot) || !statSync(scriptsRoot).isDirectory()) {
    console.error(`ERROR missing PixInsight scripts directory: ${scriptsRoot}`);
    return 1;
  }

  if (!existsSync(libraryRoot) || !statSync(libraryRoot).isDirectory()) {
    console.error(`ERROR missing PixInsight library directory: ${libraryRoot}`);
    return 1;
  }

  let warningCount = 0;
  let errorCount = 0;

  for (const workflowPath of targets) {
    const result = validateWorkflow(workflowPath, scriptsRoot, libraryRoot, options.strictScriptPaths);
    if (result.ok) {
      console.log(`OK ${displayPath(workflowPath, repoRoot)}`);
      continue;
    }

    for (const warning of result.warnings) {
      warningCount += 1;
      console.log(`WARN ${displayPath(workflowPath, repoRoot)}: ${warning}`);
    }

    for (const error of result.errors) {
      errorCount += 1;
      console.log(`ERROR ${displayPath(workflowPath, repoRoot)}: ${error}`);
    }
  }

  console.log(`Validated ${targets.length} file(s): ${errorCount} error(s), ${warningCount} warning(s)`);
  return errorCount === 0 ? 0 : 1;
}

function collectTargets(rawPaths: string[], defaultIconsDir: string): string[] {
  if (rawPaths.length === 0) {
    return readdirSync(defaultIconsDir)
      .filter(name => name.endsWith('.xpsm'))
      .map(name => path.join(defaultIconsDir, name))
      .sort();
  }

  const targets = new Set<string>();
  for (const rawPath of rawPaths) {
    const resolvedPath = path.resolve(rawPath);
    if (!existsSync(resolvedPath)) {
      targets.add(resolvedPath);
      continue;
    }

    const stats = statSync(resolvedPath);
    if (stats.isDirectory()) {
      for (const entry of readdirSync(resolvedPath)) {
        if (entry.endsWith('.xpsm')) {
          targets.add(path.join(resolvedPath, entry));
        }
      }
      continue;
    }

    targets.add(resolvedPath);
  }

  return [...targets].sort();
}

function validateWorkflow(
  workflowPath: string,
  scriptsRoot: string,
  libraryRoot: string,
  strictScriptPaths: boolean
): ValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  let xmlText: string;
  try {
    xmlText = readFileSync(workflowPath, 'utf8');
  } catch (error) {
    return {
      ok: false,
      warnings,
      errors: [`failed to read XML: ${String(error)}`]
    };
  }

  const xmlErrors = validateXmlStructure(xmlText);
  if (xmlErrors.length > 0) {
    return {
      ok: false,
      warnings,
      errors: xmlErrors
    };
  }

  const instances = extractInstances(xmlText, errors);
  for (const instance of instances) {
    if (instance.className === 'Script') {
      validateScriptInstance(instance, scriptsRoot, strictScriptPaths, warnings, errors);
      continue;
    }

    if (MODEL_CLASSES.has(instance.className)) {
      validateModelInstance(instance, libraryRoot, errors);
    }
  }

  return {
    ok: warnings.length === 0 && errors.length === 0,
    warnings,
    errors
  };
}

function validateXmlStructure(xmlText: string): string[] {
  const errors: string[] = [];
  const stack: string[] = [];
  const tagPattern = /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!\[CDATA\[[\s\S]*?\]\]>|<![^>]*>|<\/?[^>]+?>/g;

  for (const match of xmlText.matchAll(tagPattern)) {
    const token = match[0];
    if (
      token.startsWith('<!--') ||
      token.startsWith('<?') ||
      token.startsWith('<![CDATA[') ||
      token.startsWith('<!')
    ) {
      continue;
    }

    const tagName = token.match(/^<\/?\s*([^\s/>]+)/)?.[1];
    if (!tagName) {
      errors.push(`unable to parse XML token: ${token}`);
      continue;
    }

    if (token.startsWith('</')) {
      const expected = stack.pop();
      if (expected !== tagName) {
        errors.push(`mismatched closing tag </${tagName}>; expected </${expected ?? 'none'}>`);
        break;
      }
      continue;
    }

    if (!token.endsWith('/>')) {
      stack.push(tagName);
    }
  }

  if (errors.length === 0 && stack.length > 0) {
    errors.push(`unclosed XML tag <${stack[stack.length - 1]}>`);
  }

  return errors;
}

function extractInstances(xmlText: string, errors: string[]): WorkflowInstance[] {
  const instances: WorkflowInstance[] = [];
  const stack: WorkflowInstance[] = [];
  let inComment = false;

  for (const rawLine of xmlText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.length === 0) {
      continue;
    }

    if (inComment) {
      if (line.includes('-->')) {
        inComment = false;
      }
      continue;
    }

    if (line.startsWith('<!--')) {
      if (!line.includes('-->')) {
        inComment = true;
      }
      continue;
    }

    if (line.startsWith('<instance ')) {
      const instance = {
        className: readAttribute(line, 'class') ?? '',
        instanceId: readAttribute(line, 'id') ?? readAttribute(line, 'class') ?? '<unnamed>',
        params: new Map<string, string>()
      };
      instances.push(instance);

      if (!line.endsWith('/>')) {
        stack.push(instance);
      }
      continue;
    }

    if (line.startsWith('</instance')) {
      stack.pop();
      continue;
    }

    if (!line.startsWith('<parameter ') || stack.length === 0) {
      continue;
    }

    const current = stack[stack.length - 1];
    const parameterId = readAttribute(line, 'id');
    if (!parameterId) {
      continue;
    }

    const valueAttribute = readAttribute(line, 'value');
    if (valueAttribute !== null) {
      current.params.set(parameterId, valueAttribute);
      continue;
    }

    const textMatch = line.match(/^<parameter\b[^>]*>([\s\S]*)<\/parameter>$/);
    current.params.set(parameterId, textMatch?.[1] ?? '');
  }

  if (stack.length > 0) {
    errors.push(`unclosed instance tag for ${stack[stack.length - 1].instanceId}`);
  }

  return instances;
}

function validateScriptInstance(
  instance: WorkflowInstance,
  scriptsRoot: string,
  strictScriptPaths: boolean,
  warnings: string[],
  errors: string[]
): void {
  const filePath = instance.params.get('filePath') ?? '';
  const expectedMd5 = instance.params.get('md5sum') ?? '';

  if (filePath.length === 0) {
    errors.push(`[${instance.instanceId}] missing Script filePath parameter`);
    return;
  }

  if (expectedMd5.length === 0) {
    errors.push(`[${instance.instanceId}] missing Script md5sum parameter`);
    return;
  }

  const resolved = resolveScriptPath(filePath, scriptsRoot);
  if (!resolved.path) {
    errors.push(`[${instance.instanceId}] ${resolved.message}`);
    return;
  }

  const actualMd5 = md5sum(resolved.path);
  if (actualMd5 !== expectedMd5) {
    errors.push(
      `[${instance.instanceId}] md5 mismatch for ${filePath}: expected ${expectedMd5}, got ${actualMd5} from ${resolved.path}`
    );
  }

  if (resolved.message) {
    const message = `[${instance.instanceId}] ${resolved.message}`;
    if (strictScriptPaths) {
      errors.push(message);
    } else {
      warnings.push(message);
    }
  }
}

function validateModelInstance(instance: WorkflowInstance, libraryRoot: string, errors: string[]): void {
  const aiFile = instance.params.get('ai_file') ?? '';
  if (aiFile.length === 0) {
    errors.push(`[${instance.instanceId}] ${instance.className} missing ai_file parameter`);
    return;
  }

  if (aiFile.endsWith('.mlpackage')) {
    const windowsName = `${path.parse(aiFile).name}.pb`;
    if (existsSync(path.join(libraryRoot, windowsName))) {
      errors.push(
        `[${instance.instanceId}] ${instance.className} uses ${aiFile}; Windows PixInsight expects ${windowsName}`
      );
      return;
    }
  }

  if (!aiFile.endsWith('.pb')) {
    errors.push(`[${instance.instanceId}] ${instance.className} ai_file must end with .pb on Windows: ${aiFile}`);
    return;
  }

  const modelPath = path.join(libraryRoot, aiFile);
  if (!existsSync(modelPath)) {
    errors.push(`[${instance.instanceId}] ${instance.className} model file not found: ${modelPath}`);
  }
}

function resolveScriptPath(
  filePath: string,
  scriptsRoot: string
): { path: string | null; message: string | null } {
  if (!filePath.startsWith(SCRIPT_PREFIX)) {
    return {
      path: null,
      message: `unsupported script path format: ${filePath}`
    };
  }

  const relativePath = filePath.slice(SCRIPT_PREFIX.length);
  const directPath = path.join(scriptsRoot, ...relativePath.split('/'));
  if (existsSync(directPath)) {
    return {
      path: directPath,
      message: null
    };
  }

  const matches = walkFiles(scriptsRoot).filter(candidate => path.basename(candidate) === path.basename(relativePath));
  if (matches.length === 0) {
    return {
      path: null,
      message: `script file not found for ${filePath}`
    };
  }

  if (matches.length === 1) {
    return {
      path: matches[0],
      message: `resolved ${filePath} via basename fallback to ${matches[0]}`
    };
  }

  const normalizedRelativePath = relativePath.replaceAll('\\', '/');
  const suffixMatches = matches.filter(candidate =>
    path.relative(scriptsRoot, candidate).replaceAll('\\', '/').endsWith(normalizedRelativePath)
  );
  if (suffixMatches.length === 1) {
    return {
      path: suffixMatches[0],
      message: `resolved ${filePath} via suffix fallback to ${suffixMatches[0]}`
    };
  }

  return {
    path: null,
    message: `ambiguous script path for ${filePath}: ${matches.slice(0, 5).join(', ')}`
  };
}

function walkFiles(rootDir: string): string[] {
  const files: string[] = [];
  const stack = [rootDir];

  while (stack.length > 0) {
    const currentDir = stack.pop();
    if (!currentDir) {
      continue;
    }

    for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
      const entryPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        stack.push(entryPath);
        continue;
      }

      if (entry.isFile()) {
        files.push(entryPath);
      }
    }
  }

  return files;
}

function md5sum(filePath: string): string {
  const hash = createHash('md5');
  hash.update(readFileSync(filePath));
  return hash.digest('hex');
}

function readAttribute(line: string, attribute: string): string | null {
  const escapedAttribute = attribute.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = line.match(new RegExp(`${escapedAttribute}="([^"]*)"`, 'u'));
  return match?.[1] ?? null;
}

function displayPath(targetPath: string, repoRoot: string): string {
  const relativePath = path.relative(repoRoot, targetPath);
  return relativePath.startsWith('..') ? targetPath : relativePath;
}

process.exitCode = main();
