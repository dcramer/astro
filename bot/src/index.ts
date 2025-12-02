import {
  getForecast,
  analyzeNight,
  formatNightSummary,
  type ForecastDataPoint,
  type NightForecast,
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
  // Minimum score to trigger a notification (default: 60)
  NOTIFY_THRESHOLD?: string;
}

function groupByDate(forecast: ForecastDataPoint[]): Map<string, ForecastDataPoint[]> {
  const grouped = new Map<string, ForecastDataPoint[]>();

  for (const point of forecast) {
    const date = new Date(point.LocalTime).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    if (!grouped.has(date)) {
      grouped.set(date, []);
    }
    grouped.get(date)!.push(point);
  }

  return grouped;
}

async function checkWeatherAndNotify(env: Env): Promise<string> {
  const lat = parseFloat(env.LATITUDE);
  const lon = parseFloat(env.LONGITUDE);
  const threshold = parseInt(env.NOTIFY_THRESHOLD || "60", 10);

  // Fetch forecast from Astrospheric
  const response = await getForecast(env.ASTROSPHERIC_API_KEY, lat, lon);

  if (response.StatusCode !== 200 || response.ErrorMessage) {
    throw new Error(
      `Astrospheric API error: ${response.ErrorMessage || response.StatusCode}`
    );
  }

  // Group forecast by date and analyze each night
  const byDate = groupByDate(response.ForecastData);
  const nights: NightForecast[] = [];

  for (const [date, hours] of byDate) {
    const night = analyzeNight(hours, date);
    if (night) {
      nights.push(night);
    }
  }

  // Find nights that meet the threshold
  const goodNights = nights.filter((n) => n.score >= threshold);

  if (goodNights.length === 0) {
    return `No good nights found (threshold: ${threshold}). Best upcoming: ${nights[0]?.score || 0}/100`;
  }

  // Build notification message
  const lines = [
    "🔭 **Astro Weather Alert**",
    "",
    `${goodNights.length} potential imaging night${goodNights.length > 1 ? "s" : ""} ahead:`,
    "",
  ];

  for (const night of goodNights.slice(0, 3)) {
    lines.push(formatNightSummary(night));
    lines.push("");
  }

  // Add links
  lines.push("📊 More details:");
  lines.push(`[Astrospheric](${getAstrosphericUrl(lat, lon)})`);
  lines.push(`[Clear Outside](${getClearOutsideUrl(lat, lon)})`);

  const message = lines.join("\n");

  // Send text message
  await sendMessage(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID, message);

  // Send Clear Outside forecast image
  const imageUrl = getClearOutsideImageUrl(lat, lon);
  await sendPhoto(
    env.TELEGRAM_BOT_TOKEN,
    env.TELEGRAM_CHAT_ID,
    imageUrl,
    "Clear Outside 7-day forecast"
  );

  return `Notified about ${goodNights.length} good night(s)`;
}

export default {
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
        const response = await getForecast(env.ASTROSPHERIC_API_KEY, lat, lon);

        const byDate = groupByDate(response.ForecastData);
        const nights: NightForecast[] = [];

        for (const [date, hours] of byDate) {
          const night = analyzeNight(hours, date);
          if (night) {
            nights.push(night);
          }
        }

        return new Response(JSON.stringify(nights, null, 2), {
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
};
