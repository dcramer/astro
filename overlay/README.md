# N.I.N.A. Session Overlay

SSR overlay that renders live metrics from the N.I.N.A. Web Session History Viewer plugin for streaming scenes (OBS, Twitch studio, etc.). Drop it in as a 1928×900 transparent browser source and layer your RTSP feed beneath it—the overlay keeps a compact top-left stack (thumbnail + target card + exposure summary) with a 125 px stat bar to the right. Everything below remains transparent so your imaging feed fills the scene.

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

## Development

```
npm install
npm run dev
```

Visit `http://localhost:3000` to preview the overlay. The page disables static caching so every refresh requests fresh session data.

## Production Build

```
npm run build
npm run start
```

Deploy behind OBS browser sources or any hosting that supports Node.js/Next.js SSR.

## Validation Checklist
- Run `npm run lint` after changes.
- Load the overlay in a browser while a N.I.N.A. session is active and confirm active target, frame stats, and latest frame metrics update in real time.
- If the page shows “Waiting for N.I.N.A. session data…”, confirm firewall access to `NINA_SESSION_BASE_URL` and that the plugin wrote `sessions/sessions.json`.
