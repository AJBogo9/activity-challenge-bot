import crypto from 'crypto';
import { sql, initDb } from '../src/db';

const BOT_TOKEN = process.env.BOT_TOKEN || 'test-bot-token-12345';
const BASE_URL = 'http://10.5.0.200:3001';

function signInitData(user: any): string {
  const userData = JSON.stringify({
    id: user.telegram_id,
    first_name: user.first_name,
    username: user.username
  });

  const params = new URLSearchParams();
  params.set('user', userData);
  params.set('auth_date', Math.floor(Date.now() / 1000).toString());
  params.set('query_id', 'AAGLxyz...');

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const hash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  params.set('hash', hash);
  return params.toString();
}

let globalReqCount = 0;

async function executeRequest(dbUser: any, headers: any) {
  const r = Math.random();
  let endpoint = '';
  let method = 'GET';
  let body = null;

  // Endpoint Selection logic
  if (r < 0.20) { // 20% Add Workout
    endpoint = '/api/simulation/activity/add';
    method = 'POST';
    body = JSON.stringify({
      type: ['Insane-Run', 'Power-Lift', 'Extreme-Yoga'][Math.floor(Math.random() * 3)],
      duration: 99,
      points: parseFloat((Math.random() * 50 + 10).toFixed(2))
    });
  } else if (r < 0.30) { // 10% Delete Workout
    endpoint = '/api/simulation/activity/delete';
    method = 'POST';
  } else if (r < 0.40) {
    endpoint = '/api/stats/guilds';
  } else if (r < 0.45) { // 5% Guild Details
    const guilds = ['Tietokilta', 'Athene', 'Inkubio', 'TiK', 'AS'];
    const g = guilds[Math.floor(Math.random() * guilds.length)];
    endpoint = `/api/stats/guild/details?name=${encodeURIComponent(g)}`;
  } else if (r < 0.50) { // 5% Player Details
    const targetId = ['12345678', '87654321', '13572468'][Math.floor(Math.random() * 3)];
    endpoint = `/api/stats/player/details?id=${targetId}`;
  } else if (r < 0.70) {
    endpoint = '/api/stats/personal';
  } else {
    // Deep paging leaderboard
    const page = Math.floor(Math.random() * 50);
    const limit = 100;
    endpoint = `/api/stats/players?page=${page}&limit=${limit}`;
  }

  const start = performance.now();
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body
    });
    const duration = (performance.now() - start).toFixed(2);
    globalReqCount++;

    if (globalReqCount % 500 === 0) {
      console.log(`🔥 [INSANE] Req: ${globalReqCount} | Last Latency: ${duration}ms | Target: ${endpoint}`);
    }

    if (!res.ok && res.status !== 429) {
      console.log(`❌ Error ${res.status} on ${endpoint}`);
    }
  } catch (e) { }
}

async function simulateUserSession(dbUser: any) {
  const initData = signInitData(dbUser);
  const headers = { 'X-Telegram-Init-Data': initData };

  while (true) {
    // 10% chance of massive burst
    if (Math.random() < 0.10) {
      await Promise.all(Array.from({ length: 25 }).map(() => executeRequest(dbUser, headers)));
    } else {
      await executeRequest(dbUser, headers);
    }

    // No artificial delay between sessions in Insane Mode
  }
}

async function startTraffic() {
  console.log("🚀 Initializing INSANE MODE traffic...");
  try {
    await initDb();
  } catch (e) {
    console.error("❌ DB connection failed.");
    process.exit(1);
  }

  const users = await sql`SELECT telegram_id, first_name, username FROM users`;
  if (users.length === 0) {
    console.error("❌ Database empty. Run populate first.");
    process.exit(1);
  }

  console.log(`💀 [INSANE MODE] 500 Concurrent Sessions | 30% Write Traffic | Deep Paging`);
  console.log("Press Ctrl+C to abort stress test.");

  const CONCURRENCY = 20000;
  for (let i = 0; i < CONCURRENCY; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    simulateUserSession(user);
  }
}

startTraffic();