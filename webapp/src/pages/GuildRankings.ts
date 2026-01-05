import { fetchGuildStats } from '../api';
import { icons } from '../components/icons';
import { renderMultiLineChart } from '../components/charts';

export async function renderGuildRankings() {
  const container = document.createElement('div');
  container.className = 'p-4';
  container.innerHTML = `<div class="loader"></div>`;

  try {
    const data = await fetchGuildStats();
    const guilds = data.leaderboard || [];
    const history = data.rankingHistory || [];

    // Process history for top 5 guilds
    const top5GuildNames = guilds.slice(0, 5).map((g: any) => g.guild);
    const colors = ['#3390ec', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
    
    const series = top5GuildNames.map((name: string, i: number) => {
        const guildHistory = history
            .filter((h: any) => h.guild === name)
            .map((h: any) => h.rank);
            
        if (guildHistory.length === 0) return null;

        return {
            name,
            data: guildHistory,
            color: colors[i % colors.length]
        };
    }).filter(Boolean);

    const listHtml = guilds.map((guild: any, index: number) => `
      <div class="card p-4 mb-2 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="font-bold text-xl w-8 text-center text-hint">#${index + 1}</div>
          <div>
            <div class="font-bold">${guild.guild}</div>
            <div class="text-xs text-hint">${guild.active_members}/${guild.total_members} active</div>
          </div>
        </div>
        <div class="font-bold text-link">
          ${guild.average_points} pts
        </div>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="card p-6 mb-6">
        <h3 class="text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2 text-hint">
          <span style="width: 14px">${icons.trendingUp}</span> Top Guild Trends
        </h3>
        ${renderMultiLineChart(series as any)}
      </div>

      <h2 class="text-lg font-bold mb-4 flex items-center gap-2">
        <span style="width: 20px">${icons.trophy}</span> Guild Rankings
      </h2>
      <div class="flex flex-col">
        ${listHtml}
      </div>
    `;

  } catch (e) {
    container.innerHTML = `
        <div class="text-center p-6 text-hint">
            <p>Failed to load rankings.</p>
        </div>
    `;
  }

  return container;
}