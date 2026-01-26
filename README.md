# RunPaceFlow

Personal running data visualization platform with automatic Strava sync.

[中文文档](./docs/README_CN.md)

## Features

- Strava / Nike Run Club data import
- Map route visualization with animated playback
- Split pace analysis and charts
- AI-powered running insights (Claude AI)
- Daily auto-sync via GitHub Actions
- Responsive design for desktop and mobile

## Configuration

### Environment Variables

Create a `.env.local` file:

```bash
# Required - Map style
NEXT_PUBLIC_MAP_STYLE=https://basemaps.cartocdn.com/gl/positron-gl-style/style.json

# Strava (recommended)
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret
STRAVA_REFRESH_TOKEN=your_refresh_token

# Nike Run Club (optional)
NIKE_ACCESS_TOKEN=your_access_token

# Claude AI (optional - for running insights)
ANTHROPIC_API_KEY=your_api_key
ANTHROPIC_BASE_URL=  # Optional: custom API endpoint for proxy
```

### Getting Strava Token

1. Go to [Strava API Settings](https://www.strava.com/settings/api) and create an app
2. Get your `Client ID` and `Client Secret`
3. Obtain `Refresh Token` via OAuth flow (see [strava-oauth guide](https://github.com/yihong0618/running_page/blob/master/docs/strava_bindtoken.md))

### Claude AI Setup (Optional)

The AI feature generates personalized running insights for each activity, analyzing your pace, splits, and performance patterns.

1. Get an API key from [Anthropic Console](https://console.anthropic.com/)
2. Add `ANTHROPIC_API_KEY` to your environment variables
3. (Optional) Set `ANTHROPIC_BASE_URL` if using a proxy or alternative API endpoint

> Note: Without Claude AI configured, the app works normally but without AI insights.

## Local Development

```bash
# Install dependencies
bun install

# Initialize database
bun run db:push

# Start dev server
bun run dev

# Manual sync
bun run sync
```

Visit http://localhost:3000

## Deployment

### Option 1: Vercel (Recommended)

1. Fork this repository
2. Import project in Vercel
3. Configure environment variables (same as `.env.local`)
4. Deploy

> Note: Vercel deployment requires GitHub Actions for data sync. Database is stored in the repository.

### Option 2: Docker (WIP)

```bash
# Using docker-compose
docker compose up -d

# Or manual build
docker build -t runpaceflow .
docker run -d -p 3000:3000 \
  -e NEXT_PUBLIC_MAP_STYLE=https://basemaps.cartocdn.com/gl/positron-gl-style/style.json \
  -e STRAVA_CLIENT_ID=your_id \
  -e STRAVA_CLIENT_SECRET=your_secret \
  -e STRAVA_REFRESH_TOKEN=your_token \
  -v runpaceflow_data:/app/data \
  runpaceflow
```

## GitHub Actions Auto-Sync

Built-in GitHub Actions workflow for daily activity sync.

### Configure Secrets

Add in repository `Settings → Secrets and variables → Actions`:

| Secret                 | Description                           |
| ---------------------- | ------------------------------------- |
| `STRAVA_CLIENT_ID`     | Strava Client ID                      |
| `STRAVA_CLIENT_SECRET` | Strava Client Secret                  |
| `STRAVA_REFRESH_TOKEN` | Strava Refresh Token                  |
| `PAT`                  | Personal Access Token for push access |

### Sync Schedule

- **Auto sync**: Daily at UTC 0:00 (Beijing 8:00)
  Customize by editing cron in `.github/workflows/sync.yml`:
  ```yaml
  on:
    schedule:
      - cron: '0 0 * * *' # UTC time, format: min hour day month weekday
  ```
- **Manual trigger**: Actions → Sync Activities → Run workflow
- **Data storage**: SQLite database auto-committed to `data/activities.db`

## Credits

Inspired by [yihong0618/running_page](https://github.com/yihong0618/running_page)

## License

MIT
