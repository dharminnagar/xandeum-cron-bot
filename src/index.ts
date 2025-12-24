import { Telegraf } from 'telegraf';
import https from 'https';
import http from 'http';

// ================== CONFIG ==================
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SNAPSHOT_URL = `${BASE_URL}/api/pods/snapshot`;
const CLEANUP_URL = `${BASE_URL}/api/cleanup`;
const CRON_SECRET = process.env.CRON_SECRET || '';
const BOT_TOKEN = process.env.BOT_TOKEN!;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID!;

if (!BOT_TOKEN || !ADMIN_CHAT_ID) {
  console.error(
    '❌ Missing required environment variables: BOT_TOKEN or ADMIN_CHAT_ID'
  );
  process.exit(1);
}

// ================== TELEGRAM ==================
const bot = new Telegraf(BOT_TOKEN);

// ================== STATE ==================
let lastSnapshotRun: Date | null = null;
let lastCleanupRun: Date | null = null;
let lastError: string | null = null;

// ================== HTTP POST ==================
function post(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(CRON_SECRET ? { Authorization: `Bearer ${CRON_SECRET}` } : {}),
      },
    };

    const protocol = urlObj.protocol === 'https:' ? https : http;
    const req = protocol.request(options, (res) => {
      resolve(res.statusCode || 0);
    });

    req.on('error', reject);
    req.end();
  });
}

// ================== JOBS ==================
async function runSnapshot() {
  try {
    const status = await post(SNAPSHOT_URL);
    lastSnapshotRun = new Date();

    await bot.telegram.sendMessage(
      ADMIN_CHAT_ID,
      `📸 Snapshot Job\nStatus: ${status}\nTime: ${lastSnapshotRun.toISOString()}`
    );
  } catch (err: any) {
    lastError = err.message;
    await bot.telegram.sendMessage(
      ADMIN_CHAT_ID,
      `❌ Snapshot Failed\nError: ${err.message}`
    );
  }
}

async function runCleanup() {
  try {
    const status = await post(CLEANUP_URL);
    lastCleanupRun = new Date();

    await bot.telegram.sendMessage(
      ADMIN_CHAT_ID,
      `🧹 Cleanup Job\nStatus: ${status}\nTime: ${lastCleanupRun.toISOString()}`
    );
  } catch (err: any) {
    lastError = err.message;
    await bot.telegram.sendMessage(
      ADMIN_CHAT_ID,
      `❌ Cleanup Failed\nError: ${err.message}`
    );
  }
}

// ================== SCHEDULER ==================

// Snapshot → every 1 minute
setInterval(runSnapshot, 60 * 1000);

// Cleanup → check every hour, execute only quarterly
setInterval(
  () => {
    const now = new Date();
    const isQuarterMonth = [0, 3, 6, 9].includes(now.getUTCMonth());
    const isFirstDay = now.getUTCDate() === 1;
    const isMidnight = now.getUTCHours() === 0;

    if (isQuarterMonth && isFirstDay && isMidnight) {
      runCleanup();
    }
  },
  60 * 60 * 1000
);

// ================== TELEGRAM COMMAND ==================
bot.command('health', async (ctx) => {
  const status = `
🩺 Health Check
🟢 Service: Running
📸 Last Snapshot: ${lastSnapshotRun ?? 'Not yet'}
🧹 Last Cleanup: ${lastCleanupRun ?? 'Not yet'}
⚠️ Last Error: ${lastError ?? 'None'}
⏱️ Uptime: ${process.uptime().toFixed(0)}s
`;

  await ctx.reply(status);
});

// ================== START ==================
bot.launch();
console.log('🤖 Bot started successfully');
console.log(`📸 Snapshot URL: ${SNAPSHOT_URL}`);
console.log(`🧹 Cleanup URL: ${CLEANUP_URL}`);

bot.telegram.sendMessage(
  ADMIN_CHAT_ID,
  '🚀 Cron Service Started & Monitoring Enabled'
);

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
