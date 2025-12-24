# Xandeum Cron Bot

A simple Telegram bot that periodically calls Xandeum Analytics Dashboard API endpoints and reports status updates.

## Features

- 📸 **Automatic Snapshots**: Calls snapshot endpoint every minute
- 🧹 **Quarterly Cleanup**: Runs cleanup job once per quarter (Jan 1, Apr 1, Jul 1, Oct 1 at midnight UTC)
- 💬 **Telegram Notifications**: Sends status updates and error alerts
- 🩺 **Health Checks**: `/health` command to check bot status

## Setup

### Prerequisites

- [Bun](https://bun.sh) runtime installed
- A Telegram bot token from [@BotFather](https://t.me/botfather)
- Xandeum Analytics Dashboard running with snapshot and cleanup endpoints

### Installation

1. **Install dependencies:**

   ```bash
   bun install
   ```

2. **Create `.env` file:**

   ```bash
   cp .env.example .env
   ```

3. **Configure environment variables:**

   ```env
   # Get your bot token from @BotFather on Telegram
   BOT_TOKEN=your_telegram_bot_token_here

   # Your Telegram chat ID for admin notifications
   ADMIN_CHAT_ID=your_chat_id

   # Dashboard API endpoints
   SNAPSHOT_URL=https://your-dashboard.vercel.app/api/pods/snapshot
   CLEANUP_URL=https://your-dashboard.vercel.app/api/cleanup

   # Optional: API authorization secret
   CRON_SECRET=your_secret_here
   ```

### Getting Your Chat ID

1. Send a message to your bot on Telegram
2. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. Look for the `chat.id` field in the response

## Usage

### Start the Bot

```bash
bun run start
```

Or for development with auto-reload:

```bash
bun run dev
```

### Telegram Commands

- `/health` - Check bot status, last runs, and uptime

## How It Works

1. **Snapshot Job**: Runs every 1 minute, calls `POST /api/pods/snapshot` endpoint
2. **Cleanup Job**: Checks every hour, executes on Jan 1, Apr 1, Jul 1, Oct 1 at midnight UTC
3. **Status Updates**: Sends Telegram message with HTTP status code and timestamp
4. **Error Handling**: Catches and reports any failures via Telegram

## Configuration

### Snapshot Frequency

Default: Every 1 minute. Modify in [src/index.ts](src/index.ts):

```typescript
setInterval(runSnapshot, 60 * 1000); // milliseconds
```

### Cleanup Schedule

Default: Quarterly (Jan, Apr, Jul, Oct) on day 1 at midnight UTC. Modify the quarterly check logic in [src/index.ts](src/index.ts).

## Development

```bash
# Check formatting
bun run format:check

# Fix formatting
bun run format

# Run linter
bun run lint

# Fix linting issues
bun run lint:fix

# Build
bun run build
```

## Example Notification Messages

**Successful Snapshot:**

```
📸 Snapshot Job
Status: 200
Time: 2025-12-24T10:30:00.000Z
```

**Failed Snapshot:**

```
❌ Snapshot Failed
Error: connect ECONNREFUSED 127.0.0.1:3000
```

**Cleanup Job:**

```
🧹 Cleanup Job
Status: 200
Time: 2025-01-01T00:00:00.000Z
```

**Health Check:**

```
🩺 Health Check
🟢 Service: Running
📸 Last Snapshot: Tue Dec 24 2025 10:30:00
🧹 Last Cleanup: Not yet
⚠️ Last Error: None
⏱️ Uptime: 3600s
```

## Troubleshooting

### Bot doesn't respond

- Verify `BOT_TOKEN` is correct
- Check the bot is running with `bun run start`
- Send `/health` command to check status

### No snapshots being created

- Verify `SNAPSHOT_URL` is correct and accessible
- Check dashboard API is running
- Look at terminal logs for errors

### Not receiving notifications

- Verify `ADMIN_CHAT_ID` is correct
- Test by sending `/health` command

## License

MIT
