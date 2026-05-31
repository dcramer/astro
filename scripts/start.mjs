#!/usr/bin/env node

import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const ROOT_DIR = fileURLToPath(new URL("..", import.meta.url));
const SITE_HOST = "127.0.0.1";
const SHUTDOWN_TIMEOUT_MS = 8_000;
const WRANGLER_LOG_PATH = path.join(os.tmpdir(), "astro-wrangler-logs");

const services = new Map();
let stopping = false;
let shutdownExitCode = 0;

mkdirSync(WRANGLER_LOG_PATH, { recursive: true });

function prefixStream(name, stream) {
  let buffer = "";

  return (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      stream.write(line ? `[${name}] ${line}\n` : `[${name}]\n`);
    }
  };
}

function killProcessGroup(child, signal) {
  if (!child.pid || child.exitCode !== null) {
    return;
  }

  try {
    if (process.platform === "win32") {
      child.kill(signal);
    } else {
      process.kill(-child.pid, signal);
    }
  } catch (error) {
    if (error?.code !== "ESRCH") {
      console.error(`[start] failed to send ${signal} to ${child.spawnargs.join(" ")}:`, error);
    }
  }
}

function describeExit(code, signal) {
  return signal ? `signal ${signal}` : `exit code ${code ?? 0}`;
}

function shutdown(exitCode) {
  if (stopping) {
    return;
  }

  stopping = true;
  shutdownExitCode = exitCode;

  for (const child of services.values()) {
    killProcessGroup(child, "SIGTERM");
  }

  const forceExit = setTimeout(() => {
    for (const child of services.values()) {
      killProcessGroup(child, "SIGKILL");
    }
    process.exit(shutdownExitCode);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  if (services.size === 0) {
    process.exit(shutdownExitCode);
  }
}

function spawnCommand({ name, args, env = {} }) {
  const childEnv = {
    ...process.env,
    ...env,
  };

  if (childEnv.NO_COLOR) {
    delete childEnv.FORCE_COLOR;
  } else {
    childEnv.FORCE_COLOR ??= "1";
  }

  const child = spawn("pnpm", args, {
    cwd: ROOT_DIR,
    detached: process.platform !== "win32",
    env: childEnv,
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", prefixStream(name, process.stdout));
  child.stderr.on("data", prefixStream(name, process.stderr));

  return child;
}

function startService({ name, args, env = {} }) {
  const child = spawnCommand({ name, args, env });
  services.set(name, child);

  child.on("exit", (code, signal) => {
    services.delete(name);

    if (!stopping) {
      console.error(`[start] ${name} stopped unexpectedly (${describeExit(code, signal)}).`);
      shutdown(code && code > 0 ? code : 1);
      return;
    }

    if (services.size === 0) {
      process.exit(shutdownExitCode);
    }
  });

  child.on("error", (error) => {
    console.error(`[start] failed to start ${name}:`, error);
    shutdown(1);
  });

  return child;
}

process.once("SIGINT", () => shutdown(0));
process.once("SIGTERM", () => shutdown(0));

async function main() {
  console.log("[start] booting astro overlay and production sync");
  console.log(`[start] overlay: http://localhost:3060`);
  console.log("[start] sync:    site/.env SYNC_API_BASE_URL");

  startService({
    name: "overlay",
    args: ["--dir", "overlay", "exec", "next", "dev", "-H", SITE_HOST, "-p", "3060"],
  });

  startService({
    name: "sync",
    args: ["--dir", "site", "run", "sync"],
    env: {
      WRANGLER_LOG_PATH,
    },
  });
}

void main().catch((error) => {
  if (!stopping) {
    console.error(`[start] ${error.message}`);
    shutdown(1);
  }
});
