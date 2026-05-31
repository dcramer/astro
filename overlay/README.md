# N.I.N.A. Session Overlay

SSR overlay that renders live metrics from the N.I.N.A. Web Session History Viewer plugin for streaming scenes (OBS, Twitch studio, etc.). Drop it in as a 1600×900 transparent browser source; the overlay keeps a compact top-left stack (thumbnail + target card + exposure summary) with a 125 px stat bar to the right, and can optionally render a cropped telescope camera stream in a bottom corner.

## Prerequisites
- N.I.N.A. Web Session History Viewer plugin enabled and reachable from the overlay host.
- Node.js 18.18+ (matches Next.js 15 runtime).

## Configuration
Create `overlay/.env.local` with the URL to your plugin instance:

```
NINA_SESSION_BASE_URL=http://eagle4pro0329:9000
```

Optional override for slow networks:

```
NINA_OVERLAY_FETCH_TIMEOUT_MS=8000
```

Restart the dev server after making changes to `.env.local` so Next.js picks up the new variables.

## Telescope Camera Stream

The overlay proxies the local telescope camera feed through `ffmpeg` and renders it as a centered, cropped 352×264 frame that matches the width of the top-left image preview. This removes the need to run VLC separately.

Install `ffmpeg` on the machine running the overlay. The default stream is:

```
TELESCOPE_STREAM_URL=rtsp://192.168.1.128:8554/unicast
```

Optional stream settings:

```
FFMPEG_PATH=ffmpeg
TELESCOPE_STREAM_POSITION=bottom-left
TELESCOPE_STREAM_FPS=10
TELESCOPE_STREAM_QUALITY=5
TELESCOPE_STREAM_REFRESH_MS=60000
```

`TELESCOPE_STREAM_POSITION` accepts `bottom-left` or `bottom-right`. The server route converts the feed to MJPEG at `/api/telescope-stream`, so OBS only needs the overlay browser source. The browser reconnects the stream every `TELESCOPE_STREAM_REFRESH_MS` milliseconds so stale RTSP/MJPEG connections recover without refreshing the full overlay.

## Development

```
pnpm install
pnpm dev
```

Visit `http://localhost:3060` to preview the overlay. The page disables static caching so every refresh requests fresh session data.

## Streamlabs Browser Source

Use a deploy-specific cache buster in the Browser Source URL when you change overlay code:

```
http://localhost:3060/?v=2026-05-31-1
```

Increment `v` after each deploy. In Streamlabs, enable `Shutdown source when not visible` and `Refresh browser when scene becomes active`. The overlay also sends `no-store` headers and appends cache-busting query params to live API, thumbnail, and telescope stream requests so Streamlabs' embedded browser does not reuse stale responses.

## Production Build

```
pnpm build
pnpm start
```

Deploy behind OBS browser sources or any hosting that supports Node.js/Next.js SSR.

## Validation Checklist
- Run `pnpm lint` after changes.
- Load the overlay in a browser while a N.I.N.A. session is active and confirm active target, frame stats, and latest frame metrics update in real time.
- If the page shows “Waiting for N.I.N.A. session data…”, confirm firewall access to `NINA_SESSION_BASE_URL` and that the plugin wrote `sessions/sessions.json`.
- If the telescope stream is blank, confirm `ffmpeg` is installed and the overlay host can reach `TELESCOPE_STREAM_URL`.
