#!/usr/bin/env node

import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import net from "node:net";
import process from "node:process";

const ROOT_DIR = fileURLToPath(new URL("..", import.meta.url));
const SITE_HOST = "127.0.0.1";
const SITE_PORT = 4321;
const SITE_ORIGIN = `http://${SITE_HOST}:${SITE_PORT}`;
const LOCAL_SYNC_HMAC_SECRET = "astro-site-local-dev-secret";
const READY_TIMEOUT_MS = 60_000;
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

function runStep({ name, args, env = {} }) {
  return new Promise((resolve, reject) => {
    const child = spawnCommand({ name, args, env });
    services.set(name, child);

    child.once("exit", (code, signal) => {
      services.delete(name);

      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${name} failed (${describeExit(code, signal)})`));
    });

    child.once("error", (error) => {
      services.delete(name);
      reject(error);
    });
  });
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

function waitForPort({ host, port, timeoutMs }) {
  const deadline = Date.now() + timeoutMs;

  return new Promise((resolve, reject) => {
    const attempt = () => {
      const socket = net.createConnection({ host, port });
      let settled = false;

      const retry = () => {
        if (settled) {
          return;
        }
        settled = true;
        socket.destroy();

        if (Date.now() >= deadline) {
          reject(new Error(`${host}:${port} was not ready after ${timeoutMs / 1000}s`));
          return;
        }

        setTimeout(attempt, 1_000);
      };

      socket.setTimeout(1_000);
      socket.once("connect", () => {
        if (settled) {
          return;
        }
        settled = true;
        socket.destroy();
        resolve();
      });
      socket.once("error", retry);
      socket.once("timeout", retry);
    };

    attempt();
  });
}

process.once("SIGINT", () => shutdown(0));
process.once("SIGTERM", () => shutdown(0));

async function main() {
  console.log("[start] booting local astro stack");
  console.log(`[start] site:    http://localhost:${SITE_PORT}`);
  console.log(`[start] overlay: http://localhost:3060`);
  console.log(`[start] sync:    ${SITE_ORIGIN}`);

  await runStep({
    name: "types",
    args: ["--dir", "site", "run", "cf:types"],
    env: {
      WRANGLER_LOG_PATH,
    },
  });

  await runStep({
    name: "db",
    args: ["--dir", "site", "run", "db:apply"],
    env: {
      WRANGLER_LOG_PATH,
    },
  });

  if (stopping) {
    return;
  }

  startService({
    name: "site",
    args: ["--dir", "site", "exec", "astro", "dev", "--host", SITE_HOST, "--port", String(SITE_PORT)],
    env: {
      CLOUDFLARE_INCLUDE_PROCESS_ENV: "true",
      SYNC_API_BASE_URL: SITE_ORIGIN,
      SYNC_HMAC_SECRET: LOCAL_SYNC_HMAC_SECRET,
      WRANGLER_LOG_PATH,
    },
  });

  startService({
    name: "overlay",
    args: ["--dir", "overlay", "exec", "next", "dev", "-H", SITE_HOST, "-p", "3060"],
  });

  await waitForPort({ host: SITE_HOST, port: SITE_PORT, timeoutMs: READY_TIMEOUT_MS });

  if (stopping) {
    return;
  }

  startService({
    name: "sync",
    args: ["--dir", "site", "run", "sync"],
    env: {
      SYNC_API_BASE_URL: SITE_ORIGIN,
      SYNC_HMAC_SECRET: LOCAL_SYNC_HMAC_SECRET,
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
