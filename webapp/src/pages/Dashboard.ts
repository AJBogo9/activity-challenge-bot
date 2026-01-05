import { fetchStats } from '../api';
import { icons } from '../components/icons';

export async function renderDashboard() {
  const container = document.createElement('div');
  container.className = 'p-4';
  container.innerHTML = `<div class="loader"></div>`;

  try {
    const data = await fetchStats();
    
    // Summary Cards
    const summaryHtml = `
        <div class="grid grid-cols-2 gap-4 mb-6" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="card p-4 flex flex-col items-center justify-center text-center">
                <div class="text-hint mb-2" style="width: 24px">${icons.user}</div>
                <div class="text-2xl font-bold">${data.total_users || 0}</div>
                <div class="text-xs text-hint uppercase mt-1">Participants</div>
            </div>
            <div class="card p-4 flex flex-col items-center justify-center text-center">
                <div class="text-hint mb-2" style="width: 24px">${icons.trophy}</div>
                <div class="text-2xl font-bold">#${data.guild_rank || '-'}</div>
                <div class="text-xs text-hint uppercase mt-1">Guild Rank</div>
            </div>
        </div>
    `;

    container.innerHTML = `
      <div class="text-center mb-8 mt-4">
        <h1 class="text-xl font-bold">Activity Challenge</h1>
        <p class="text-sm text-hint">Season 2026</p>
      </div>
      ${summaryHtml}
      
      <div class="card p-4 mb-4">
        <h3 class="font-bold mb-2">Your Status</h3>
        <p class="text-sm">Global Rank: <strong>#${data.global_rank || '-'}</strong></p>
        <p class="text-sm">Points: <strong>${data.points || 0}</strong></p>
        <p class="text-sm">Guild: <strong>${data.guild || 'None'}</strong></p>
      </div>
    `;
  } catch (e) {
      container.innerHTML = `
      <div class="text-center mb-8 mt-4">
        <h1 class="text-xl font-bold">Activity Challenge</h1>
        <p class="text-sm text-hint">Season 2026</p>
      </div>
      <div class="card p-6 text-center text-hint">
        <p>Welcome! Navigate using the tabs below.</p>
      </div>
    `;
  }

  return container;
}