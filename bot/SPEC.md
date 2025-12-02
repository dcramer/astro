# Astro Weather Bot - Specification

## Overview

A Telegram bot running on Cloudflare Workers that monitors astrophotography weather conditions and sends proactive notifications when good imaging nights are forecasted.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Cloudflare     │────▶│  Astrospheric    │     │  Telegram   │
│  Workers (Cron) │     │  API             │     │  Bot API    │
└────────┬────────┘     └──────────────────┘     └──────▲──────┘
         │                                              │
         │              ┌──────────────────┐            │
         └─────────────▶│  Clear Outside   │────────────┘
                        │  (Image URL)     │
                        └──────────────────┘
```

## Data Flow

1. **Cron Trigger** (every 6 hours) → Worker executes
2. **Fetch Forecast** → Astrospheric API returns 81-hour forecast
3. **Analyze Nights** → Score each night based on conditions
4. **Filter** → Find nights exceeding threshold
5. **Notify** → Send Telegram message + Clear Outside image

## Scoring Algorithm

Each night receives a 0-100 score based on weighted factors:

| Factor        | Weight | Optimal Value |
|---------------|--------|---------------|
| Cloud Cover   | 40%    | 0%            |
| Seeing        | 25%    | 5/5           |
| Transparency  | 20%    | 5/5           |
| Humidity      | 10%    | <60%          |
| Smoke         | 5%     | 0/5           |

### Rating Thresholds
- 🟢 **Excellent**: 80-100
- 🟡 **Good**: 60-79
- 🟠 **Fair**: 40-59
- 🔴 **Poor**: 0-39

## Configuration

| Variable             | Required | Description                          |
|----------------------|----------|--------------------------------------|
| TELEGRAM_BOT_TOKEN   | Yes      | Bot token from @BotFather            |
| TELEGRAM_CHAT_ID     | Yes      | Target chat/group ID                 |
| ASTROSPHERIC_API_KEY | Yes      | Astrospheric Pro API key             |
| LATITUDE             | Yes      | Observing site latitude              |
| LONGITUDE            | Yes      | Observing site longitude             |
| NOTIFY_THRESHOLD     | No       | Min score to notify (default: 60)    |

## API Endpoints

### `GET /check`
Manually trigger a weather check. Sends notification if conditions meet threshold.

**Response**: `200 OK` with status message

### `GET /forecast`
Preview forecast data without sending notifications.

**Response**: `200 OK` with JSON array of analyzed nights

### `GET /health`
Health check endpoint.

**Response**: `200 OK`

## Notification Format

```
🔭 **Astro Weather Alert**

2 potential imaging nights ahead:

**Sat, Dec 7** - 🟢 Excellent (85/100)
☁️ Clouds: 12%
👁️ Seeing: 4.2/5
✨ Transparency: 4.0/5
🌡️ Low: 8°C
💧 Max Humidity: 55%

**Sun, Dec 8** - 🟡 Good (72/100)
...

📊 More details:
[Astrospheric](https://...)
[Clear Outside](https://...)
```

Followed by Clear Outside forecast image.

## Future Phases

### Phase 2: Enhanced Notifications
- Moon phase and illumination percentage
- Astronomical twilight times
- Best imaging window (consecutive good hours)
- Weather trend indicator (improving/worsening)

### Phase 3: Interactive Bot
- `/forecast` command to query on-demand
- `/subscribe` to manage notification preferences
- `/threshold` to adjust personal notification threshold
- Inline buttons for quick actions

### Phase 4: Integration
- Pull target list from N.I.N.A. Target Scheduler
- Suggest optimal targets based on altitude/transit time
- Track imaging history to recommend unfinished targets

### Phase 5: Multi-User
- Support multiple observing locations
- Per-user notification preferences
- Group vs DM notification routing
