# Astro Weather Bot

Telegram bot that monitors astrophotography weather conditions and sends notifications when good imaging nights are forecasted.

## Data Sources

- **Astrospheric** - Primary forecast data (cloud ensemble, seeing, transparency)
- **Clear Outside** - Visual forecast image included in notifications

## Setup

### 1. Create Telegram Bot

1. Message [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot` and follow prompts
3. Save the bot token

### 2. Get Chat ID

For a **group chat**:
1. Add your bot to the group
2. Send a message in the group
3. Visit `https://api.telegram.org/bot<TOKEN>/getUpdates`
4. Find the `chat.id` (negative number for groups)

For **direct messages**:
1. Message your bot
2. Visit the getUpdates URL above
3. Find your `chat.id`

### 3. Get Astrospheric API Key

1. Subscribe to [Astrospheric Pro](https://www.astrospheric.com/)
2. Go to My Profile → API Key
3. Copy your API key

### 4. Configure Secrets

```bash
cd bot
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID
npx wrangler secret put ASTROSPHERIC_API_KEY
npx wrangler secret put LATITUDE
npx wrangler secret put LONGITUDE
npx wrangler secret put NOTIFY_THRESHOLD  # optional, default: 60
```

### 5. Deploy

```bash
pnpm deploy
```

## Endpoints

- `GET /check` - Manually trigger weather check and notification
- `GET /forecast` - Preview forecast data as JSON (no notification sent)
- `GET /health` - Health check

## Cron Schedule

By default, checks weather every 6 hours. Edit `wrangler.toml` to change:

```toml
[triggers]
crons = ["0 */6 * * *"]  # Every 6 hours
```

## Scoring

Hourly scores are weighted for urban DSO imaging:
- Cloud cover (50%) - blocks all photons
- Seeing (30%) - arc-seconds, lower is better
- Transparency (15%) - extinction index, lower is better
- Humidity (5%) - dew risk

Notifications are sent when there are 6+ consecutive clear hours with score ≥ 60.

## Local Development

```bash
cp .env.example .env
# Edit .env with your credentials
pnpm install
pnpm dev
```

Then visit:
- `http://localhost:8787/forecast` - Preview tonight's forecast
- `http://localhost:8787/check` - Trigger notification (if conditions are good)
- `http://localhost:8787/health` - Health check
