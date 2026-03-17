/// <reference path="../worker-configuration.d.ts" />
/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare global {
  namespace Cloudflare {
    interface Env {
      SYNC_HMAC_SECRET?: string;
    }
  }

  type SiteRuntimeEnv = Env;
}

export {};
