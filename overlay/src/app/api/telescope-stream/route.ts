import {
  spawn,
  spawnSync,
  type ChildProcessWithoutNullStreams,
} from "node:child_process";

import { getTelescopeStreamFfmpegConfig } from "@nina/config";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const BOUNDARY = "astro-overlay-telescope";

let ffmpegAvailability:
  | { available: boolean; executable: string; message: string | null }
  | null = null;

function buildFfmpegArgs({
  fps,
  inputUrl,
  outputHeightPx,
  outputWidthPx,
  quality,
}: NonNullable<ReturnType<typeof getTelescopeStreamFfmpegConfig>>): string[] {
  const parsedInput = new URL(inputUrl);
  const inputArgs =
    parsedInput.protocol === "rtsp:" || parsedInput.protocol === "rtsps:"
      ? ["-rtsp_transport", "tcp"]
      : [];

  return [
    "-hide_banner",
    "-loglevel",
    "error",
    "-nostdin",
    "-fflags",
    "nobuffer",
    "-flags",
    "low_delay",
    ...inputArgs,
    "-i",
    inputUrl,
    "-an",
    "-vf",
    `scale=${outputWidthPx}:${outputHeightPx}:force_original_aspect_ratio=increase,crop=${outputWidthPx}:${outputHeightPx}`,
    "-r",
    String(fps),
    "-q:v",
    String(quality),
    "-f",
    "mpjpeg",
    "-boundary_tag",
    BOUNDARY,
    "pipe:1",
  ];
}

function getFfmpegAvailability(executable: string) {
  if (ffmpegAvailability?.executable === executable) {
    return ffmpegAvailability;
  }

  const result = spawnSync(executable, ["-version"], { stdio: "ignore" });
  if (!result.error && result.status === 0) {
    ffmpegAvailability = {
      available: true,
      executable,
      message: null,
    };
    return ffmpegAvailability;
  }

  const code = result.error
    ? (result.error as NodeJS.ErrnoException).code
    : null;
  const message =
    code === "ENOENT"
      ? `ffmpeg was not found at "${executable}".`
      : result.error
        ? `ffmpeg check failed: ${result.error.message}`
        : `ffmpeg check exited with status ${result.status ?? "unknown"}.`;

  ffmpegAvailability = {
    available: false,
    executable,
    message,
  };
  return ffmpegAvailability;
}

function escapeSvgText(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderPlaceholderImage(
  widthPx: number,
  heightPx: number,
  title: string,
  detail: string,
) {
  const width = Math.max(1, widthPx);
  const height = Math.max(1, heightPx);
  const centerX = width / 2;
  const centerY = height / 2;
  const titleY = centerY - 10;
  const detailY = centerY + 18;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<rect width="100%" height="100%" fill="#020617"/>
<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" fill="none" stroke="rgba(148,197,255,0.35)"/>
<text x="${centerX}" y="${titleY}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700" fill="#e6f6ff">${escapeSvgText(title)}</text>
<text x="${centerX}" y="${detailY}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="12" fill="rgba(203,213,225,0.85)">${escapeSvgText(detail)}</text>
</svg>`;

  return new Response(svg, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "image/svg+xml; charset=utf-8",
    },
  });
}

export async function GET(request: Request) {
  const config = getTelescopeStreamFfmpegConfig();
  if (!config) {
    return new Response("Telescope stream is not configured.\n", {
      status: 404,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  const availability = getFfmpegAvailability(config.ffmpegPath);
  if (!availability.available) {
    console.warn("Telescope stream unavailable:", availability.message);
    return renderPlaceholderImage(
      config.outputWidthPx,
      config.outputHeightPx,
      "ffmpeg unavailable",
      "Install ffmpeg or set FFMPEG_PATH",
    );
  }

  let ffmpeg: ChildProcessWithoutNullStreams | null = null;
  let closed = false;

  const stopFfmpeg = () => {
    if (!ffmpeg || ffmpeg.killed) {
      return;
    }

    ffmpeg.kill("SIGTERM");
    const forceKill = setTimeout(() => {
      if (ffmpeg && !ffmpeg.killed) {
        ffmpeg.kill("SIGKILL");
      }
    }, 2500);
    forceKill.unref();
  };

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const process = spawn(config.ffmpegPath, buildFfmpegArgs(config));
      ffmpeg = process;

      const abort = () => {
        closed = true;
        stopFfmpeg();
      };

      request.signal.addEventListener("abort", abort, { once: true });

      process.stdout.on("data", (chunk: Buffer) => {
        if (closed) {
          return;
        }

        try {
          controller.enqueue(new Uint8Array(chunk));
        } catch (error) {
          closed = true;
          console.error("Failed to stream telescope frame:", error);
          stopFfmpeg();
        }
      });

      process.stderr.setEncoding("utf8");
      process.stderr.on("data", (chunk: string) => {
        const message = chunk.trim();
        if (message) {
          console.warn("ffmpeg telescope stream:", message);
        }
      });

      process.on("error", (error) => {
        if (!closed) {
          closed = true;
          controller.error(error);
        }
        console.error("Failed to start ffmpeg for telescope stream:", error);
      });

      process.on("close", (code, signal) => {
        const expectedClose = closed;
        request.signal.removeEventListener("abort", abort);
        if (!closed) {
          closed = true;
          controller.close();
        }
        if (!expectedClose && code !== 0 && signal !== "SIGTERM") {
          console.warn(
            `ffmpeg telescope stream exited with code ${code ?? "unknown"}.`,
          );
        }
      });
    },
    cancel() {
      closed = true;
      stopFfmpeg();
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Connection: "close",
      "Content-Type": `multipart/x-mixed-replace; boundary=${BOUNDARY}`,
      Pragma: "no-cache",
    },
  });
}
