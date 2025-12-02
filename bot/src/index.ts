import * as Sentry from "@sentry/cloudflare";
import {
  getForecast,
  parseHourlyForecasts,
  getTonightHours,
  analyzeNight,
  formatNightSummary,
} from "./astrospheric";
import {
  sendMessage,
  sendPhoto,
  getClearOutsideImageUrl,
  getClearOutsideUrl,
  getAstrosphericUrl,
} from "./telegram";

export interface Env {
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
  ASTROSPHERIC_API_KEY: string;
  LATITUDE: string;
  LONGITUDE: string;
  CACHE: KVNamespace;
  SENTRY_DSN: string;
}

async function checkWeatherAndNotify(env: Env): Promise<string> {
  const lat = parseFloat(env.LATITUDE);
  const lon = parseFloat(env.LONGITUDE);

  // Fetch forecast from Astrospheric (with KV caching)
  const response = await getForecast(env.ASTROSPHERIC_API_KEY, lat, lon, env.CACHE);

  // Parse hourly forecasts and get tonight's hours
  const hourlyForecasts = parseHourlyForecasts(response);
  const tonightHours = getTonightHours(hourlyForecasts, lat, lon);
  const tonight = analyzeNight(tonightHours);

  if (!tonight) {
    return "No forecast data available for tonight";
  }

  // Use the new shouldNotify decision
  if (!tonight.shouldNotify) {
    return `Tonight: ${tonight.reason} (score: ${tonight.score}/100)`;
  }

  // Build notification message
  const lines = [
    `🔭 *Tonight looks good for imaging\\!*`,
    "",
    formatNightSummary(tonight),
    "",
    `[Astrospheric](${getAstrosphericUrl(lat, lon)}) \\| [Clear Outside](${getClearOutsideUrl(lat, lon)})`,
  ];

  const message = lines.join("\n");

  // Send text message
  const msgResult = await sendMessage(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID, message);
  if (!msgResult.ok) {
    throw new Error(`Telegram sendMessage failed: ${msgResult.description}`);
  }

  // Send Clear Outside forecast image
  const imageUrl = getClearOutsideImageUrl(lat, lon);
  const photoResult = await sendPhoto(
    env.TELEGRAM_BOT_TOKEN,
    env.TELEGRAM_CHAT_ID,
    imageUrl,
    "Clear Outside 7-day forecast"
  );
  if (!photoResult.ok) {
    console.error(`Telegram sendPhoto failed: ${photoResult.description}`);
  }

  return `Notified: ${tonight.reason}`;
}

export default Sentry.withSentry(
  (env: Env) => ({
    dsn: env.SENTRY_DSN,
    sendDefaultPii: true,
  }),
  {
    // Cron trigger handler
    async scheduled(
      _controller: ScheduledController,
      env: Env,
      ctx: ExecutionContext
    ): Promise<void> {
      ctx.waitUntil(
        checkWeatherAndNotify(env)
          .then((result) => console.log(result))
          .catch((error) => console.error("Weather check failed:", error))
      );
    },

    // HTTP handler for manual triggers and webhook setup
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
      const url = new URL(request.url);

      // Manual trigger endpoint
      if (url.pathname === "/check") {
        try {
          const result = await checkWeatherAndNotify(env);
          return new Response(result, { status: 200 });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          return new Response(`Error: ${message}`, { status: 500 });
        }
      }

      // Health check
      if (url.pathname === "/health") {
        return new Response("OK", { status: 200 });
      }

      // Forecast preview (returns JSON without sending notification)
      if (url.pathname === "/forecast") {
        try {
          const lat = parseFloat(env.LATITUDE);
          const lon = parseFloat(env.LONGITUDE);
          const response = await getForecast(env.ASTROSPHERIC_API_KEY, lat, lon, env.CACHE);

          const hourlyForecasts = parseHourlyForecasts(response);
          const tonightHours = getTonightHours(hourlyForecasts, lat, lon);
          const tonight = analyzeNight(tonightHours);

          return new Response(JSON.stringify({ tonight }, null, 2), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      return new Response("Astro Bot - /check, /forecast, /health", { status: 200 });
    },
  } satisfies ExportedHandler<Env>
);
