import * as Sentry from "@sentry/cloudflare";
import { Hono } from "hono";
import {
  getForecast,
  parseHourlyForecasts,
  getTonightHours,
  analyzeNight,
  formatNightSummary,
  getRatingEmoji,
  scoreCloudCover,
  scoreTransparency,
  scoreSeeing,
  scoreHumidity,
  type NightForecast,
} from "./astrospheric";
import {
  sendMessage,
  sendPhoto,
  getClearOutsideImageUrl,
  getClearOutsideUrl,
  getAstrosphericUrl,
} from "./telegram";
import { logger } from "./logger";

export interface Env {
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
  ASTROSPHERIC_API_KEY: string;
  LATITUDE: string;
  LONGITUDE: string;
  CACHE: KVNamespace;
  SENTRY_DSN: string;
}

function formatTime(date: Date, timeZone: string): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone,
  });
}

function generateForecastHTML(tonight: NightForecast | null, lat: number, lon: number): string {
  if (!tonight) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Astro Forecast</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            max-width: 800px;
            margin: 40px auto;
            padding: 20px;
            background: #1a1a1a;
            color: #e0e0e0;
          }
          .error {
            background: #3a1a1a;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #ff4444;
          }
        </style>
      </head>
      <body>
        <div class="error">
          <h1>⚠️ No Forecast Data</h1>
          <p>No forecast data available for tonight.</p>
        </div>
      </body>
      </html>
    `;
  }

  const emoji = getRatingEmoji(tonight.score);
  const statusColor = tonight.shouldNotify ? "#4caf50" : "#ff9800";
  const statusText = tonight.shouldNotify ? "GOOD FOR IMAGING" : "NOT RECOMMENDED";

  const cloudDesc = tonight.avgCloudCover < 15 ? "Clear" :
                    tonight.avgCloudCover < 30 ? "Mostly clear" :
                    tonight.avgCloudCover < 50 ? "Partly cloudy" : "Cloudy";

  const clearOutsideUrl = getClearOutsideUrl(lat, lon);
  const astrosphericUrl = getAstrosphericUrl(lat, lon);
  const imageUrl = getClearOutsideImageUrl(lat, lon);

  // Generate hourly breakdown table
  const bestWindowStart = tonight.bestWindow?.startHour.getTime();
  const bestWindowEnd = tonight.bestWindow?.endHour.getTime();

  const hourlyRows = tonight.hours.map(hour => {
    const cloudScore = scoreCloudCover(hour.cloudCover);
    const transScore = scoreTransparency(hour.transparency);
    const seeingScore = scoreSeeing(hour.seeing);
    const humidityScore = scoreHumidity(hour.humidity);

    const hourTime = hour.localTime.getTime();
    const inWindow = bestWindowStart && bestWindowEnd && hourTime >= bestWindowStart && hourTime < bestWindowEnd;

    return `
      <tr class="${inWindow ? 'in-window' : ''}">
        <td>${formatTime(hour.localTime, tonight.timeZone)}</td>
        <td>${hour.cloudCover.toFixed(1)}% <span class="score-cell">[${cloudScore}]</span></td>
        <td>${hour.transparency} <span class="score-cell">[${transScore}]</span></td>
        <td>${hour.seeing}" <span class="score-cell">[${seeingScore}]</span></td>
        <td>${Math.round(hour.humidity)}% <span class="score-cell">[${humidityScore}]</span></td>
        <td><strong>${Math.round(hour.hourScore)}</strong></td>
        <td class="${hour.isImageable ? 'imageable-yes' : 'imageable-no'}">${hour.isImageable ? '✓' : '✗'}</td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Astro Forecast - ${statusText}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background: #1a1a1a;
          color: #e0e0e0;
          line-height: 1.6;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .header h1 {
          margin: 0;
          font-size: 2em;
        }
        .status {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 4px;
          font-weight: 600;
          margin: 10px 0;
          background: ${statusColor};
          color: white;
        }
        .score {
          font-size: 3em;
          margin: 10px 0;
        }
        .section {
          background: #2a2a2a;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          border-left: 4px solid ${statusColor};
        }
        .section h2 {
          margin-top: 0;
          color: ${statusColor};
        }
        .window {
          background: #1a3a1a;
          padding: 15px;
          border-radius: 6px;
          margin: 10px 0;
        }
        .stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin: 15px 0;
        }
        .stat {
          background: #333;
          padding: 15px;
          border-radius: 6px;
        }
        .stat-label {
          font-size: 0.85em;
          color: #999;
          margin-bottom: 5px;
        }
        .stat-value {
          font-size: 1.5em;
          font-weight: 600;
        }
        .links {
          text-align: center;
          margin: 20px 0;
        }
        .links a {
          color: #64b5f6;
          text-decoration: none;
          margin: 0 10px;
        }
        .links a:hover {
          text-decoration: underline;
        }
        .forecast-image {
          width: 100%;
          border-radius: 8px;
          margin: 20px 0;
        }
        .warning {
          background: #3a1a1a;
          padding: 15px;
          border-radius: 6px;
          border-left: 4px solid #ff4444;
          margin: 10px 0;
        }
        .timestamp {
          text-align: center;
          color: #666;
          font-size: 0.9em;
          margin-top: 30px;
        }
        .hourly-table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
          font-size: 0.9em;
        }
        .hourly-table th {
          background: #333;
          padding: 10px 8px;
          text-align: left;
          font-weight: 600;
          border-bottom: 2px solid #444;
        }
        .hourly-table td {
          padding: 8px;
          border-bottom: 1px solid #333;
        }
        .hourly-table tr:hover {
          background: #2a2a2a;
        }
        .hourly-table .imageable-yes {
          color: #4caf50;
          font-weight: 600;
        }
        .hourly-table .imageable-no {
          color: #ff4444;
        }
        .hourly-table .in-window {
          background: #1a3a1a;
        }
        .score-cell {
          font-family: monospace;
          color: #999;
          font-size: 0.85em;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🔭 Astrophotography Forecast</h1>
        <div class="score">${emoji}</div>
        <div class="status">${statusText}</div>
        <p><strong>Score: ${tonight.score}/100</strong></p>
      </div>

      ${tonight.bestWindow ? `
        <div class="section">
          <h2>🌙 Best Imaging Window</h2>
          <div class="window">
            <p style="font-size: 1.2em; margin: 0;">
              <strong>${formatTime(tonight.bestWindow.startHour, tonight.timeZone)} - ${formatTime(tonight.bestWindow.endHour, tonight.timeZone)}</strong>
            </p>
            <p style="margin: 5px 0 0 0; color: #999;">
              ${tonight.bestWindow.length} consecutive hours · Quality: ${tonight.bestWindow.avgQuality}%
            </p>
          </div>
        </div>
      ` : ''}

      <div class="section">
        <h2>📊 Tonight's Conditions</h2>
        <div class="stats">
          <div class="stat">
            <div class="stat-label">☁️ Cloud Cover</div>
            <div class="stat-value">${cloudDesc}</div>
            <div class="stat-label">~${Math.round(tonight.avgCloudCover)}%</div>
          </div>
          <div class="stat">
            <div class="stat-label">🌡️ Low Temperature</div>
            <div class="stat-value">${Math.round(tonight.minTemp)}°C</div>
          </div>
          <div class="stat">
            <div class="stat-label">💧 Max Humidity</div>
            <div class="stat-value">${Math.round(tonight.maxHumidity)}%</div>
          </div>
          <div class="stat">
            <div class="stat-label">🌫️ Avg Transparency</div>
            <div class="stat-value">${tonight.avgTransparency.toFixed(1)}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>📅 Hourly Breakdown</h2>
        <table class="hourly-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Clouds</th>
              <th>Trans</th>
              <th>Seeing</th>
              <th>Humidity</th>
              <th>Score</th>
              <th>OK?</th>
            </tr>
          </thead>
          <tbody>
            ${hourlyRows}
          </tbody>
        </table>
        <p style="font-size: 0.85em; color: #999; margin-top: 10px;">
          Scores shown in brackets []. Green background = best imaging window. ✓ = imageable (≤10% clouds, <90% humidity).
        </p>
      </div>

      ${tonight.hasDealBreaker ? `
        <div class="warning">
          <strong>⚠️ Warning:</strong> ${tonight.dealBreakerReason}
        </div>
      ` : ''}

      <div class="section">
        <h2>💡 Decision</h2>
        <p>${tonight.reason}</p>
      </div>

      <div class="links">
        <a href="${astrosphericUrl}" target="_blank">View on Astrospheric</a>
        <a href="${clearOutsideUrl}" target="_blank">View on Clear Outside</a>
      </div>

      <img src="${imageUrl}" alt="Clear Outside 7-day forecast" class="forecast-image" />

      <div class="timestamp">
        Last updated: ${new Date().toLocaleString()}
      </div>
    </body>
    </html>
  `;
}

async function checkWeatherAndNotify(env: Env): Promise<string> {
  const lat = parseFloat(env.LATITUDE);
  const lon = parseFloat(env.LONGITUDE);

  logger.info("Starting weather check", { lat, lon });

  // Fetch forecast from Astrospheric (with KV caching)
  const response = await getForecast(env.ASTROSPHERIC_API_KEY, lat, lon, env.CACHE);

  // Parse hourly forecasts and get tonight's hours
  const hourlyForecasts = parseHourlyForecasts(response);
  const tonightHours = getTonightHours(hourlyForecasts, lat, lon);
  const tonight = analyzeNight(tonightHours, response.TimeZone);

  if (!tonight) {
    logger.warn("No forecast data available for tonight");
    return "No forecast data available for tonight";
  }

  logger.info("Analyzed tonight's forecast", {
    score: tonight.score,
    shouldNotify: tonight.shouldNotify,
    reason: tonight.reason,
    avgCloudCover: Math.round(tonight.avgCloudCover),
    bestWindowLength: tonight.bestWindow?.length ?? 0,
    hasDealBreaker: tonight.hasDealBreaker,
  });

  // Use the new shouldNotify decision
  if (!tonight.shouldNotify) {
    logger.info("Decision: NOT notifying", {
      score: tonight.score,
      reason: tonight.reason,
      avgCloudCover: Math.round(tonight.avgCloudCover),
      bestWindowLength: tonight.bestWindow?.length ?? 0,
    });
    return `Tonight: ${tonight.reason} (score: ${tonight.score}/100)`;
  }

  logger.info("Decision: NOTIFYING user", {
    score: tonight.score,
    reason: tonight.reason,
    bestWindowStart: tonight.bestWindow?.startHour,
    bestWindowEnd: tonight.bestWindow?.endHour,
    bestWindowLength: tonight.bestWindow?.length,
  });

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
    logger.warn("Photo notification sent, but photo failed to send");
  }

  logger.info("Notification sent successfully", {
    reason: tonight.reason,
    score: tonight.score,
  });

  return `Notified: ${tonight.reason}`;
}

// Create Hono app
const app = new Hono<{ Bindings: Env }>();

// Health check endpoint
app.get("/health", (c) => {
  return c.text("OK");
});

// Manual trigger endpoint
app.get("/check", async (c) => {
  logger.info("Manual trigger endpoint called", {
    method: c.req.method,
    userAgent: c.req.header("user-agent"),
  });

  try {
    const result = await checkWeatherAndNotify(c.env);
    logger.info("Manual trigger completed successfully", { result });
    return c.text(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Manual trigger failed", {
      error: message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return c.text(`Error: ${message}`, 500);
  }
});

// Forecast preview endpoint (JSON)
app.get("/forecast", async (c) => {
  logger.info("Forecast preview endpoint called", {
    method: c.req.method,
  });

  try {
    const lat = parseFloat(c.env.LATITUDE);
    const lon = parseFloat(c.env.LONGITUDE);
    const response = await getForecast(c.env.ASTROSPHERIC_API_KEY, lat, lon, c.env.CACHE);

    const hourlyForecasts = parseHourlyForecasts(response);
    const tonightHours = getTonightHours(hourlyForecasts, lat, lon);
    const tonight = analyzeNight(tonightHours, response.TimeZone);

    logger.info("Forecast preview completed", {
      score: tonight?.score,
      shouldNotify: tonight?.shouldNotify,
    });

    return c.json({ tonight });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Forecast preview failed", {
      error: message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return c.json({ error: message }, 500);
  }
});

// HTML view handler (shared between / and /view)
const htmlViewHandler = async (c: any) => {
  logger.info("HTML view endpoint called", {
    method: c.req.method,
    path: c.req.path,
  });

  try {
    const lat = parseFloat(c.env.LATITUDE);
    const lon = parseFloat(c.env.LONGITUDE);
    const response = await getForecast(c.env.ASTROSPHERIC_API_KEY, lat, lon, c.env.CACHE);

    const hourlyForecasts = parseHourlyForecasts(response);
    const tonightHours = getTonightHours(hourlyForecasts, lat, lon);
    const tonight = analyzeNight(tonightHours, response.TimeZone);

    const html = generateForecastHTML(tonight, lat, lon);

    return c.html(html);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("HTML view failed", {
      error: message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return c.html(`<html><body><h1>Error</h1><p>${message}</p></body></html>`, 500);
  }
};

// Root endpoint - HTML view
app.get("/", htmlViewHandler);

// /view endpoint - alias for root
app.get("/view", htmlViewHandler);

// Wrap with Sentry
export default Sentry.withSentry(
  (env: Env) => ({
    dsn: env.SENTRY_DSN,
    sendDefaultPii: true,
  }),
  {
    // Cron trigger handler
    async scheduled(
      controller: ScheduledController,
      env: Env,
      ctx: ExecutionContext
    ): Promise<void> {
      logger.info("Scheduled job triggered", {
        scheduledTime: controller.scheduledTime,
        cron: controller.cron,
      });

      ctx.waitUntil(
        checkWeatherAndNotify(env)
          .then((result) => {
            logger.info("Scheduled job completed successfully", { result });
          })
          .catch((error) => {
            logger.error("Scheduled job failed", {
              error: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
            });
          })
      );
    },

    // HTTP handler - delegate to Hono
    fetch: app.fetch,
  } satisfies ExportedHandler<Env>
);
