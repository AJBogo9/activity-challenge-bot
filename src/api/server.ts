import { validateInitData, getWebAppData } from '../utils/webapp-auth';
import * as pointsDb from '../db/points';
import * as activitiesDb from '../db/activities';
import * as usersDb from '../db/users';
import { join } from 'path';

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const WEBAPP_DIST = join(process.cwd(), 'dist/webapp');

export function startApiServer(port: number = 3000) {
  return Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url);
      
      // CORS
      if (req.method === 'OPTIONS') {
        return new Response(null, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'X-Telegram-Init-Data, Content-Type',
          },
        });
      }

      // Serve static files for webapp
      if (!url.pathname.startsWith('/api')) {
        let path = url.pathname;
        if (path === '/') path = '/index.html';
        
        const file = Bun.file(join(WEBAPP_DIST, path));
        if (await file.exists()) {
          return new Response(file);
        }
        
        // Fallback to index.html for SPA
        return new Response(Bun.file(join(WEBAPP_DIST, 'index.html')));
      }

      // Auth middleware for API
      const initData = req.headers.get('X-Telegram-Init-Data');
      if (!initData || !validateInitData(initData, BOT_TOKEN)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
          status: 401,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      const webAppUser = getWebAppData(initData);
      const telegramId = webAppUser?.id?.toString();

      if (!telegramId) {
        return new Response(JSON.stringify({ error: 'Invalid user data' }), { status: 400 });
      }

      // API Routes
      try {
        if (url.pathname === '/api/stats/personal') {
          const userSummary = await pointsDb.getUserSummary(telegramId);
          const topUsers = await pointsDb.getTopUsers(10);
          
          // Get user internal id
          const user = await usersDb.findUserByTelegramId(telegramId);
          let history: any[] = [];
          let typeBreakdown: any[] = [];
          let rankingHistory: any[] = [];
          let topUsersHistory: any[] = [];
          if (user) {
            const activities = await activitiesDb.getActivitiesByUser(user.id);
            rankingHistory = await pointsDb.getUserRankingHistory(telegramId, 30);
            
            const topUsers = await pointsDb.getTopUsers(3);
            topUsersHistory = await Promise.all(topUsers.map(async (u) => {
              const h = await pointsDb.getUserRankingHistory(u.telegram_id, 30);
              return { name: u.first_name, history: h };
            }));

            // Aggregation for line chart
            const aggregated = activities.reduce((acc: any, curr) => {
              const date = new Date(curr.activity_date).toISOString().split('T')[0];
              acc[date] = (acc[date] || 0) + Number(curr.points);
              return acc;
            }, {});
            
            history = Object.entries(aggregated)
              .map(([date, points]) => ({ date, points }))
              .sort((a, b) => a.date.localeCompare(b.date))
              .slice(-14);

            // Aggregation for pie chart
            const types = activities.reduce((acc: any, curr) => {
              const type = curr.activity_type;
              acc[type] = (acc[type] || 0) + Number(curr.points);
              return acc;
            }, {});

            typeBreakdown = Object.entries(types)
              .map(([name, value]) => ({ name, value }))
              .sort((a: any, b: any) => b.value - a.value);
          }

          return Response.json({ ...userSummary, topUsers: await pointsDb.getTopUsers(10), history, typeBreakdown, rankingHistory, topUsersHistory }, { headers: { 'Access-Control-Allow-Origin': '*' } });
        }

        if (url.pathname === '/api/stats/guilds') {
          const guildLeaderboard = await pointsDb.getGuildLeaderboard();
          const rankingHistory = await pointsDb.getGuildRankingHistory(30);
          console.log(`📊 Guild leaderboard requested. Found ${guildLeaderboard.length} guilds.`);
          return Response.json({ leaderboard: guildLeaderboard, rankingHistory }, { headers: { 'Access-Control-Allow-Origin': '*' } });
        }

        return new Response('Not Found', { status: 404 });
      } catch (error) {
        console.error('API Error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
      }
    },
  });
}
