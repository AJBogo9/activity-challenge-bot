import { fetchPersonalStats, fetchPlayerDetails } from '../api';
import { renderLineChart, renderDonutChart } from '../components/charts';
import { icons } from '../components/icons';

export async function renderPersonalStats() {
  const container = document.createElement('div');
  container.className = 'p-4 space-y-4';
  container.innerHTML = `<div class="loader"></div>`;

  async function showPlayerDetails(player: any) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in';
    modal.innerHTML = `
      <div class="bg-[var(--tg-theme-bg-color)] w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl animate-slide-up">
        <div class="flex items-center mb-6 gap-4">
          <button class="modal-close -ml-4 p-4 text-link flex items-center justify-center bg-[var(--tg-theme-secondary-bg-color)] rounded-full w-12 h-12 active:scale-90 transition-transform">
            <div style="width: 24px; height: 24px;">${icons.close || '✕'}</div>
          </button>
          <div class="flex-1 truncate">
            <h2 class="text-xl font-bold">${player.first_name}</h2>
            <div class="text-xs text-hint">${player.guild || 'No Guild'}</div>
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-4 mb-8">
          <div class="bg-[var(--tg-theme-secondary-bg-color)] p-4 rounded-xl text-center">
            <div class="text-[10px] uppercase font-bold text-hint mb-1">Total Points</div>
            <div id="rival-modal-points" class="text-xl font-black text-link">${player.points}</div>
          </div>
          <div class="bg-[var(--tg-theme-secondary-bg-color)] p-4 rounded-xl text-center">
            <div class="text-[10px] uppercase font-bold text-hint mb-1">Global Rank</div>
            <div id="rival-modal-rank" class="text-xl font-black text-link">#${player.rank || '?'}</div>
          </div>
        </div>

        <div class="mb-8 overflow-hidden">
          <h3 class="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-hint">
            <span style="width: 14px">${icons.trendingUp}</span> Rank History
          </h3>
          <div id="rival-modal-chart" class="h-40 flex items-center justify-center"><div class="loader"></div></div>
        </div>

        <button class="modal-close w-full py-4 bg-[var(--tg-theme-secondary-bg-color)] text-link font-bold rounded-xl active:opacity-70 transition-opacity">
          Close
        </button>
      </div>
    `;

    document.body.appendChild(modal);
    document.body.classList.add('no-scroll');

    const close = () => {
      modal.classList.add('animate-fade-out');
      modal.querySelector('.bg-\\[var\\(--tg-theme-bg-color\\)\\]')?.classList.add('animate-slide-down');
      setTimeout(() => {
        modal.remove();
        document.body.classList.remove('no-scroll');
      }, 200);
    };

    modal.querySelectorAll('.modal-close').forEach(el => el.addEventListener('click', close));
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

    try {
      const details = await fetchPlayerDetails(player.telegram_id);
      const pointsEl = modal.querySelector('#rival-modal-points');
      const rankEl = modal.querySelector('#rival-modal-rank');
      if (pointsEl) pointsEl.textContent = details.points || player.points;
      if (rankEl) rankEl.textContent = `#${details.global_rank || '?'}`;

      const chartContainer = modal.querySelector('#rival-modal-chart');
      if (chartContainer) {
        const historyData = (details.rankingHistory || []).map((h: any) => h.rank);
        const historyLabels = (details.rankingHistory || []).map((h: any) => h.date);
        chartContainer.innerHTML = renderLineChart(historyData, historyLabels, 150, '#3390ec');
      }
    } catch (e) { console.error(e); }
  }

  try {
    const data = await fetchPersonalStats();

    const rankHistory = (data.rankingHistory || []).map((h: any) => h.rank);
    const labels = (data.rankingHistory || []).map((h: any) => h.date);
    
    const guildRankHistory = (data.guildRankingHistory || []).map((h: any) => h.rank);
    const guildLabels = (data.guildRankingHistory || []).map((h: any) => h.date);

    const activityMix = (data.typeBreakdown || []).map((t: any, i: number) => ({
      name: t.name,
      value: t.value,
      color: [`#3390ec`, `#00C49F`, `#FFBB28`, `#FF8042`, `#8884d8`][i % 5]
    }));

      container.innerHTML = `
        <div class="card p-6 mb-4 overflow-hidden">
          <h3 class="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-hint">
            <span style="width: 14px">${icons.trendingUp}</span> 30-Day Rank Trend (Global)
          </h3>
          ${renderLineChart(rankHistory, labels)}
        </div>

        ${data.guild ? `
        <div class="card p-6 mb-4 overflow-hidden">
          <h3 class="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-hint">
            <span style="width: 14px">${icons.trophy}</span> ${data.guild} Rank Trend
          </h3>
          ${renderLineChart(guildRankHistory, guildLabels, 150, '#00C49F')}
        </div>
        ` : ''}

        <div class="card p-4 mb-4">
          <h3 class="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-hint">
            <span style="width: 14px">${icons.users}</span> Nearby Rivals
          </h3>
          <div class="flex flex-col gap-2">
            ${(data.nearbyUsers || []).map((u: any, idx: number) => `
              <div class="rival-card flex items-center justify-between p-2 rounded cursor-pointer active:opacity-70 transition-opacity ${u.rank == data.global_rank ? 'bg-[var(--tg-theme-secondary-bg-color)]' : ''}" data-idx="${idx}">
                <div class="flex items-center gap-3">
                  <div class="font-bold text-hint w-6 text-center">#${u.rank}</div>
                  <div>
                    <div class="font-bold text-sm">${u.first_name} ${u.rank == data.global_rank ? '(You)' : ''}</div>
                    <div class="text-xs text-hint">${u.guild || 'No Guild'}</div>
                  </div>
                </div>
                <div class="text-sm font-bold text-link">${u.points} pts</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="card p-6 mb-4">
          <h3 class="text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2 text-hint">
            <span style="width: 14px">${icons.activity}</span> Activity Mix
          </h3>
          ${renderDonutChart(activityMix)}
        </div>
      `;

      // Add click listeners for rivals
      container.querySelectorAll('.rival-card').forEach(el => {
        el.addEventListener('click', () => {
          const idx = parseInt((el as HTMLElement).dataset.idx || '0');
          const rival = data.nearbyUsers[idx];
          // Don't open modal for yourself
          if (rival.rank != data.global_rank) {
            showPlayerDetails(rival);
          }
        });
      });
  } catch (e) {
    container.innerHTML = `
        <div class="text-center p-6 text-hint">
            <p>Failed to load data.</p>
            <p class="text-xs mt-2">${(e as Error).message}</p>
        </div>
    `;
  }

  return container;
}