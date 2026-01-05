import { fetchPlayerStats } from '../api';
import { icons } from '../components/icons';

export async function renderPlayerRankings() {
  const container = document.createElement('div');
  container.className = 'p-4 flex flex-col h-full'; 
  
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
      const players = await fetchPlayerStats(page, limit);
      
      if (players.length < limit) {
        hasMore = false;
        sentinel.innerText = 'No more players';
      } else {
        sentinel.innerText = 'Scroll for more';
      }

      const newHtml = players.map((player: any, index: number) => {
        const globalIndex = (page * limit) + index;
        return `
          <div class="card p-4 mb-2 flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="font-bold text-xl w-8 text-center text-hint">#${globalIndex + 1}</div>
              <div>
                <div class="font-bold">${player.first_name} ${player.last_name || ''}</div>
                <div class="text-xs text-hint">${player.guild || 'No Guild'}</div>
              </div>
            </div>
            <div class="font-bold text-link">
              ${player.points} pts
            </div>
          </div>
        `;
      }).join('');

      // Append HTML
      listContainer.insertAdjacentHTML('beforeend', newHtml);
      
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
    if (entries[0].isIntersecting) {
      loadMore();
    }
  }, { root: null, threshold: 0.1 });

  observer.observe(sentinel);

  return container;
}