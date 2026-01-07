import { validateInitData, getWebAppData } from '../utils/webapp-auth';
import * as pointsDb from '../db/points';
import * as activitiesDb from '../db/activities';
import * as usersDb from '../db/users';
import * as guildsDb from '../db/guilds';
import { apiCache, authCache } from '../utils/cache';
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
      if (!initData) {
        return new Response(JSON.stringify({ error: 'Missing Auth' }), { status: 401 });
      }

      // Optimized Auth: Check cache first to avoid expensive crypto
      let isAuthorized = authCache.get<boolean>(initData);
      if (isAuthorized === null) {
        isAuthorized = validateInitData(initData, BOT_TOKEN);
        if (isAuthorized) {
          authCache.set(initData, true, 300); // Cache auth for 5 mins
        }
      }

      if (!isAuthorized) {
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

      // Helper to return compressed JSON
      const json = (data: any) => {
        const body = JSON.stringify(data);
        const acceptEncoding = req.headers.get('accept-encoding') || '';
        if (acceptEncoding.includes('gzip')) {
          return new Response(Bun.gzipSync(Buffer.from(body)), {
            headers: {
              'Content-Type': 'application/json',
              'Content-Encoding': 'gzip',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }
        return Response.json(data, { headers: { 'Access-Control-Allow-Origin': '*' } });
      };

      // API Routes
      try {
        if (url.pathname === '/api/stats/personal') {
          const cacheKey = `personal_${telegramId}`;
          const responseData = await apiCache.getOrFetch(cacheKey, async () => {
              const userSummary = await pointsDb.getUserSummary(telegramId);
              
              // Get user internal id
              const user = await usersDb.findUserByTelegramId(telegramId);
              let history: any[] = [];
              let typeBreakdown: any[] = [];
              let rankingHistory: any[] = [];
              let guildRankingHistory: any[] = [];
              let topUsersHistory: any[] = [];
              let nearbyUsers: any[] = [];
              
              if (user) {
                const activities = await activitiesDb.getActivitiesByUser(user.id);
                rankingHistory = await pointsDb.getUserRankingHistory(telegramId, 30);
                nearbyUsers = await pointsDb.getNearbyUsers(telegramId);
                
                if (user.guild) {
                  const allGuildHistory = await pointsDb.getGuildRankingHistory(30);
                  guildRankingHistory = allGuildHistory.filter((h: any) => h.guild === user.guild);
                }
                
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

              return { ...userSummary, topUsers: await pointsDb.getTopUsers(10), history, typeBreakdown, rankingHistory, guildRankingHistory, topUsersHistory, nearbyUsers };
          }, 15);

          return json(responseData);
        }

        if (url.pathname === '/api/stats/guilds') {
          const cacheKey = 'guild_stats';
          const responseData = await apiCache.getOrFetch(cacheKey, async () => {
            const guildLeaderboard = await pointsDb.getGuildLeaderboard();
            const rankingHistory = await pointsDb.getGuildRankingHistory(30);
            console.log(`📊 [DB HIT] Guild leaderboard requested.`);
            return { leaderboard: guildLeaderboard, rankingHistory };
          }, 60);

          return json(responseData);
        }

        if (url.pathname === '/api/stats/guild/details') {
            const guildName = url.searchParams.get('name');
            if (!guildName) return new Response('Missing name', { status: 400 });

            const cacheKey = `guild_details_${guildName}`;
            const data = await apiCache.getOrFetch(cacheKey, async () => {
                const members = await guildsDb.getTopGuildMembers(guildName, 20);
                const allHistory = await pointsDb.getGuildRankingHistory(30);
                const guildHistory = allHistory.filter((h: any) => h.guild === guildName);
                return { members, history: guildHistory };
            }, 60);

            return json(data);
        }

        if (url.pathname === '/api/stats/players') {
            const page = parseInt(url.searchParams.get('page') || '0');
            const limit = parseInt(url.searchParams.get('limit') || '50');
            const cacheKey = `players_${page}_${limit}`;
            
            const players = await apiCache.getOrFetch(cacheKey, async () => {
                const offset = page * limit;
                const p = await pointsDb.getTopUsers(limit, offset);
                console.log(`📊 [DB HIT] Player list Page: ${page}`);
                return p;
            }, 60);

            return json(players);
        }

        if (url.pathname === '/api/simulation/users') {
            const users = await pointsDb.sql`SELECT telegram_id, first_name, username FROM users`;
            return Response.json(users, { headers: { 'Access-Control-Allow-Origin': '*' } });
        }

        if (url.pathname === '/api/simulation/activity/add' && req.method === 'POST') {
            const body = await req.json();
            const user = await usersDb.findUserByTelegramId(telegramId);
            if (user) {
                await activitiesDb.createActivity({
                    userId: user.id,
                    activityType: body.type || 'Simulation',
                    duration: body.duration || 30,
                    points: body.points || 5,
                    activityDate: new Date()
                });
                await pointsDb.addPointsToUser(user.id, body.points || 5);
                apiCache.delete(`personal_${telegramId}`);
                return Response.json({ success: true }, { headers: { 'Access-Control-Allow-Origin': '*' } });
            }
        }

        if (url.pathname === '/api/simulation/activity/delete' && req.method === 'POST') {
            const user = await usersDb.findUserByTelegramId(telegramId);
            if (user) {
                const activities = await activitiesDb.getActivitiesByUser(user.id);
                if (activities.length > 0) {
                    const latest = activities[0];
                    await activitiesDb.deleteActivity(latest.id);
                    await pointsDb.addPointsToUser(user.id, -latest.points);
                    apiCache.delete(`personal_${telegramId}`);
                    return Response.json({ success: true, deleted: latest.id }, { headers: { 'Access-Control-Allow-Origin': '*' } });
                }
                return Response.json({ success: false, reason: 'no activities' }, { headers: { 'Access-Control-Allow-Origin': '*' } });
            }
        }

        return new Response('Not Found', { status: 404 });
      } catch (error) {
        console.error('API Error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
      }
    },
  });
}
