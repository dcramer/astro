# Astro Site

Astro + Cloudflare site for:

- a private overlay route
- `/` public dashboard
- `/sessions` session archive
- local `pnpm run sync` daemon that pushes N.I.N.A. state to Cloudflare

## Install

```bash
pnpm install
```

## Local defaults

The package has local-first defaults so it behaves more like the original overlay:

- N.I.N.A. session URL defaults to `http://eagle4pro0329:8000`
- N.I.N.A. advanced API defaults to the same host on port `1888`
- sync target defaults to `http://127.0.0.1:4321`
- local HMAC secret defaults to `astro-site-local-dev-secret`

You only need a `.env` file if you want to override those defaults.

## Local sync daemon

Optionally copy `.env.example` to `.env` and override values for your environment, then run:

```bash
pnpm run sync
```

The daemon polls N.I.N.A. every `SYNC_INTERVAL_MS` milliseconds, pushes session/current-state data to the remote API, and uploads missing thumbnails.

Current image behavior:

- the live/overlay preview is uploaded from N.I.N.A.'s `prepared-image` endpoint every sync tick
- archived exposure thumbnails are rendered remotely by the Web Session History Viewer via `PUT /api/1020/image/create`, then copied into Cloudflare storage

## Cloudflare setup

Configure the following before deploy:

- `SYNC_HMAC_SECRET` Worker secret
- D1 database bound as `DB`
- R2 bucket bound as `THUMBNAILS`

Cloudflare binding types are generated into `worker-configuration.d.ts` via `wrangler types`. The package scripts run that automatically before `dev`, `build`, `check`, `typecheck`, and `cf:deploy`.

For production, do not rely on the local dev secret. Set a real `SYNC_HMAC_SECRET` in Cloudflare and on the machine running `pnpm run sync`.

Generate schema migrations with:

```bash
pnpm db:generate
```

Apply them with Wrangler:

```bash
pnpm db:apply
```

The D1 binding is configured to read migrations from `drizzle/`.

For production, use the `deploy` script so migrations are applied as part of deployment:

```bash
pnpm run cf:deploy
```

If you use Cloudflare Workers Builds with GitHub auto-deploys, set the deploy command to `pnpm run cf:deploy`.

## Validation

```bash
pnpm typecheck
pnpm build
```
