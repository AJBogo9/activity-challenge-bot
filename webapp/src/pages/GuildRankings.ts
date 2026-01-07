import { fetchGuildStats, fetchGuildDetails } from '../api';
import { icons } from '../components/icons';
import { renderMultiLineChart, renderSparkline, renderLineChart } from '../components/charts';

export async function renderGuildRankings() {
  const container = document.createElement('div');
  container.className = 'p-4';
  container.innerHTML = `<div class="loader"></div>`;

  async function showGuildDetails(guild: any) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in';
    modal.innerHTML = `
      <div class="bg-[var(--tg-theme-bg-color)] w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl animate-slide-up">
        <div class="flex items-center mb-6 gap-4">
          <button class="modal-close p-2 -ml-2 text-link flex items-center justify-center bg-[var(--tg-theme-secondary-bg-color)] rounded-full w-10 h-10">
            ${icons.close || '✕'}
          </button>
          <h2 class="text-xl font-bold flex-1">${guild.guild}</h2>
        </div>
        
        <div class="grid grid-cols-2 gap-4 mb-8">
          <div class="bg-[var(--tg-theme-secondary-bg-color)] p-4 rounded-xl text-center">
            <div class="text-[10px] uppercase font-bold text-hint mb-1">Total Points</div>
            <div class="text-xl font-black text-link">${guild.total_points}</div>
          </div>
          <div class="bg-[var(--tg-theme-secondary-bg-color)] p-4 rounded-xl text-center">
            <div class="text-[10px] uppercase font-bold text-hint mb-1">Participation</div>
            <div class="text-xl font-black text-link">${guild.participation_percentage}%</div>
          </div>
        </div>

        <div class="mb-8 overflow-hidden">
          <h3 class="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-hint">
            <span style="width: 14px">${icons.trendingUp}</span> Rank History
          </h3>
          <div id="guild-modal-chart" class="h-40 flex items-center justify-center"><div class="loader"></div></div>
        </div>

        <div class="mb-8">
          <h3 class="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-hint">
            <span style="width: 14px">${icons.users}</span> Top Members
          </h3>
          <div id="guild-modal-members" class="space-y-2"><div class="loader"></div></div>
        </div>

        <button class="modal-close w-full py-4 bg-[var(--tg-theme-secondary-bg-color)] text-link font-bold rounded-xl active:opacity-70 transition-opacity">
          Close
        </button>
      </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden'; // Lock scroll

    const close = () => {
      modal.classList.add('animate-fade-out');
      modal.querySelector('.bg-\\[var\\(--tg-theme-bg-color\\)\\]')?.classList.add('animate-slide-down');
      setTimeout(() => {
        modal.remove();
        document.body.style.overflow = ''; // Unlock scroll
      }, 200);
    };

    modal.querySelectorAll('.modal-close').forEach(el => el.addEventListener('click', close));
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

    // Fetch and render details
    try {
      const details = await fetchGuildDetails(guild.guild);
      
      // Render Chart
      const chartContainer = modal.querySelector('#guild-modal-chart');
      if (chartContainer) {
        const historyData = (details.history || []).map((h: any) => h.rank);
        const historyLabels = (details.history || []).map((h: any) => h.date);
        chartContainer.innerHTML = renderLineChart(historyData, historyLabels, 150, '#00C49F');
      }

      // Render Members
      const membersContainer = modal.querySelector('#guild-modal-members');
      if (membersContainer) {
        membersContainer.innerHTML = details.members.length ? details.members.map((m: any, i: number) => `
          <div class="flex items-center justify-between p-3 rounded-xl bg-[var(--tg-theme-secondary-bg-color)]">
            <div class="flex items-center gap-3">
              <span class="text-xs font-bold text-hint w-4">#${i + 1}</span>
              <span class="font-bold text-sm">${m.first_name}</span>
            </div>
            <span class="font-mono text-sm font-bold text-link">${m.points} pts</span>
          </div>
        `).join('') : '<div class="text-center p-4 text-hint">No active members found</div>';
      }
    } catch (e) {
      console.error(e);
    }
  }

  try {
    const data = await fetchGuildStats();
    const guilds = data.leaderboard || [];
    const history = data.rankingHistory || [];
    
    // Extract unique dates for X-axis
    const labels = [...new Set(history.map((h: any) => h.date))].sort();

    // Process history for top 5 guilds
    const top5GuildNames = guilds.slice(0, 5).map((g: any) => g.guild);
    const colors = ['#3390ec', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
    
    const series = top5GuildNames.map((name: string, i: number) => {
        const guildHistory = history
            .filter((h: any) => h.guild === name)
            .sort((a: any, b: any) => a.date.localeCompare(b.date))
            .map((h: any) => h.rank);
            
        if (guildHistory.length === 0) return null;

        return {
            name,
            data: guildHistory,
            color: colors[i % colors.length]
        };
    }).filter(Boolean);

    const listHtml = guilds.map((guild: any, index: number) => {
      const guildHistory = history
        .filter((h: any) => h.guild === guild.guild)
        .sort((a: any, b: any) => a.date.localeCompare(b.date))
        .map((h: any) => h.rank);

      return `
        <div class="guild-card card p-4 mb-2 flex items-center justify-between cursor-pointer active:opacity-70 transition-opacity" data-guild-index="${index}">
          <div class="flex items-center gap-4">
            <div class="font-bold text-xl w-8 text-center text-hint">#${index + 1}</div>
            <div>
              <div class="font-bold">${guild.guild}</div>
              <div class="text-xs text-hint">${guild.active_members}/${guild.total_members} active</div>
            </div>
          </div>
          <div class="flex items-center gap-4">
            ${renderSparkline(guildHistory)}
            <div class="font-bold text-link text-right" style="min-width: 60px">
              ${guild.average_points} pts
            </div>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="card p-6 mb-6 overflow-hidden">
        <h3 class="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-hint">
          <span style="width: 14px">${icons.trendingUp}</span> Top Guild Trends
        </h3>
        ${renderMultiLineChart(series as any, labels as string[])}
      </div>

      <h2 class="text-lg font-bold mb-4 flex items-center gap-2">
        <span style="width: 20px">${icons.trophy}</span> Guild Rankings
      </h2>
      <div class="flex flex-col">
        ${listHtml}
      </div>
    `;

    // Add click listeners
    container.querySelectorAll('.guild-card').forEach(el => {
      el.addEventListener('click', () => {
        const index = parseInt((el as HTMLElement).dataset.guildIndex || '0');
        showGuildDetails(guilds[index]);
      });
    });

  } catch (e) {
    container.innerHTML = `
        <div class="text-center p-6 text-hint">
            <p>Failed to load rankings.</p>
        </div>
    `;
  }

  return container;
}