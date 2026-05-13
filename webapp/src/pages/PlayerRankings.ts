import { fetchPlayerStats, fetchPlayerDetails } from '../api';
import { icons } from '../components/icons';
import { renderLineChart, renderDonutChart } from '../components/charts';

export async function renderPlayerRankings() {
  const container = document.createElement('div');
  container.className = 'p-4 flex flex-col h-full'; 
  
  // Community Pulse Container
  const pulseContainer = document.createElement('div');
  pulseContainer.className = 'mb-6 mt-2';
  container.appendChild(pulseContainer);
  
  async function showPlayerDetails(player: any) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in';
    modal.innerHTML = `
      <div class="modal-inner bg-[var(--tg-theme-bg-color)] w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl animate-slide-up">
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
            <div id="player-modal-points" class="text-xl font-black text-link">${player.points}</div>
          </div>
          <div class="bg-[var(--tg-theme-secondary-bg-color)] p-4 rounded-xl text-center">
            <div class="text-[10px] uppercase font-bold text-hint mb-1">Global Rank</div>
            <div id="player-modal-rank" class="text-xl font-black text-link">#${player.global_rank || '?'}</div>
          </div>
        </div>

        <div class="mb-8 overflow-hidden">
          <h3 class="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-hint">
            <span style="width: 14px">${icons.trendingUp}</span> Rank History
          </h3>
          <div id="player-modal-chart" class="h-40 flex items-center justify-center"><div class="loader"></div></div>
        </div>

        <div class="mb-8">
          <h3 class="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-hint">
            <span style="width: 14px">${icons.activity}</span> Activity Mix
          </h3>
          <div id="player-modal-mix" class="flex items-center justify-center"><div class="loader"></div></div>
        </div>

        <button class="modal-close w-full py-4 bg-[var(--tg-theme-secondary-bg-color)] text-link font-bold rounded-xl active:opacity-70 transition-opacity">
          Close
        </button>
      </div>
    `;

    document.body.appendChild(modal);
    document.body.classList.add('no-scroll');

    const close = (e?: Event) => {
      if (e) e.stopPropagation();
      modal.classList.add('animate-fade-out');
      modal.querySelector('.modal-inner')?.classList.add('animate-slide-down');
      setTimeout(() => {
        if (modal.parentNode) modal.remove();
        document.body.classList.remove('no-scroll');
      }, 200);
    };

    modal.querySelectorAll('.modal-close').forEach(el => el.addEventListener('click', close));
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

    try {
      const details = await fetchPlayerDetails(player.telegram_id);
      if (modal.querySelector('#player-modal-points')) modal.querySelector('#player-modal-points')!.textContent = details.points;
      if (modal.querySelector('#player-modal-rank')) modal.querySelector('#player-modal-rank')!.textContent = `#${details.global_rank}`;

      const chartContainer = modal.querySelector('#player-modal-chart');
      if (chartContainer && details.rankingHistory) {
        chartContainer.innerHTML = renderLineChart(details.rankingHistory.map((h: any) => h.rank), details.rankingHistory.map((h: any) => h.date), 150, '#3390ec');
      }

      const mixContainer = modal.querySelector('#player-modal-mix');
      if (mixContainer && details.typeBreakdown) {
        const activityMix = (details.typeBreakdown || []).map((t: any, i: number) => ({
          name: t.name,
          value: t.value,
          color: [`#3390ec`, `#00C49F`, `#FFBB28`, `#FF8042`, `#8884d8`][i % 5]
        }));
        mixContainer.innerHTML = renderDonutChart(activityMix);
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Header
  const header = document.createElement('div');
  header.innerHTML = `
    <h2 class="text-lg font-bold mb-4 flex items-center gap-2">
      <span style="width: 20px">${icons.users}</span> Player Leaderboard
    </h2>
  `;
  container.appendChild(header);

  // List Container
  const listContainer = document.createElement('div');
  listContainer.id = 'player-list';
  listContainer.className = 'flex flex-col';
  container.appendChild(listContainer);

  // Sentinel for Infinite Scroll
  const sentinel = document.createElement('div');
  sentinel.id = 'sentinel';
  sentinel.className = 'h-10 flex items-center justify-center text-hint text-xs';
  sentinel.innerText = 'Loading...';
  container.appendChild(sentinel);

  // State
  let page = 0;
  const limit = 50;
  let isLoading = false;
  let hasMore = true;

  const loadMore = async () => {
    if (isLoading || !hasMore) return;
    isLoading = true;
    sentinel.innerText = 'Loading...';

    try {
      const data = await fetchPlayerStats(page, limit);
      const players = data.players || [];
      const stats = data.globalStats;

      if (page === 0 && stats) {
        const points = Math.floor(stats.total_points);
        const milestones = [
          { name: 'Around the World', goal: 40000, icon: '🌍' },
          { name: 'Moon Trip', goal: 384400, icon: '🌙' },
          { name: 'Mars Mission', goal: 1000000, icon: '🚀' }
        ];
        const currentMilestone = milestones.find(m => points < m.goal) || milestones[milestones.length - 1];
        const progress = Math.min(100, Math.round((points / currentMilestone.goal) * 100));

        pulseContainer.innerHTML = `
          <div class="card overflow-hidden">
            <div class="bg-link p-4 text-white">
              <div class="flex justify-between items-start mb-4">
                <div>
                  <div class="text-[10px] uppercase font-black tracking-[0.2em] opacity-80">Collective Progress</div>
                  <div class="text-2xl font-black">${points.toLocaleString()} <span class="text-sm font-normal opacity-70">PTS</span></div>
                </div>
                <div class="bg-white bg-opacity-20 p-2 rounded-lg backdrop-blur-sm">${icons.activity}</div>
              </div>
              <div class="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider">
                <div class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span> ${stats.total_players} Athletes</div>
                <div class="flex items-center gap-1">🔥 ${stats.total_activities} Workouts</div>
              </div>
            </div>
            <div class="p-6">
              <div class="flex justify-between items-end mb-2">
                <div class="text-sm font-bold flex items-center gap-2"><span>${currentMilestone.icon}</span> ${currentMilestone.name}</div>
                <div class="text-link font-black text-lg">${progress}%</div>
              </div>
              <div class="w-full bg-[var(--tg-theme-secondary-bg-color)] h-3 rounded-full overflow-hidden mb-4 p-0.5">
                <div class="bg-link h-full rounded-full transition-all duration-1000" style="width: ${progress}%"></div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div class="p-3 rounded-xl bg-[var(--tg-theme-secondary-bg-color)] border border-[var(--tg-theme-hint-color)] border-opacity-10">
                  <div class="text-[8px] uppercase font-black text-hint mb-1">Hot Trend</div>
                  <div class="text-[10px] font-bold truncate">${stats.popular_activity || 'Training'}</div>
                </div>
                <div class="p-3 rounded-xl bg-[var(--tg-theme-secondary-bg-color)] border border-[var(--tg-theme-hint-color)] border-opacity-10 text-center">
                  <div class="text-[8px] uppercase font-black text-hint mb-1">Average</div>
                  <div class="text-[10px] font-bold">${Math.round(points/stats.total_players)} pts/user</div>
                </div>
              </div>
            </div>
          </div>
        `;
      }

      if (players.length < limit) {
        hasMore = false;
        sentinel.innerText = 'Leaderboard Complete';
      } else {
        sentinel.innerText = 'Scroll for more';
      }

      players.forEach((player: any, index: number) => {
        const globalIndex = (page * limit) + index;
        const playerEl = document.createElement('div');
        playerEl.className = 'player-card card p-4 mb-2 flex items-center justify-between cursor-pointer active:opacity-70 transition-opacity';
        playerEl.innerHTML = `
          <div class="flex items-center gap-4">
            <div class="font-bold text-xl w-8 text-center text-hint">#${globalIndex + 1}</div>
            <div>
              <div class="font-bold">${player.first_name} ${player.last_name || ''}</div>
              <div class="text-xs text-hint">${player.guild || 'No Guild'}</div>
            </div>
          </div>
          <div class="font-bold text-link">${player.points} pts</div>
        `;
        
        playerEl.addEventListener('click', () => {
            showPlayerDetails(player);
        });

        listContainer.appendChild(playerEl);
      });
      
      page++;
    } catch (e) {
      console.error(e);
      sentinel.innerText = 'Error loading data';
    } finally {
      isLoading = false;
    }
  };

  // Initial Load
  await loadMore();

  // Observer
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !isLoading && hasMore) {
      loadMore();
    }
  }, { threshold: 0.1 });

  observer.observe(sentinel);

  return container;
}
