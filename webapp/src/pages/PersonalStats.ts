import { fetchPersonalStats } from '../api';
import { renderLineChart, renderDonutChart } from '../components/charts';
import { icons } from '../components/icons';

export async function renderPersonalStats() {
  const container = document.createElement('div');
  container.className = 'p-4 space-y-4';
  container.innerHTML = `<div class="loader"></div>`;

  try {
    const data = await fetchPersonalStats();

    const rankHistory = (data.rankingHistory || []).map((h: any) => h.rank);
    const activityMix = (data.typeBreakdown || []).map((t: any, i: number) => ({
      name: t.name,
      value: t.value,
      color: [`#3390ec`, `#00C49F`, `#FFBB28`, `#FF8042`, `#8884d8`][i % 5]
    }));

    container.innerHTML = `
      <div class="card p-6 mb-4">
        <h3 class="text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2 text-hint">
          <span style="width: 14px">${icons.trendingUp}</span> 30-Day Rank Trend
        </h3>
        ${renderLineChart(rankHistory)}
      </div>

      <div class="card p-4 mb-4">
        <h3 class="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-hint">
          <span style="width: 14px">${icons.users}</span> Nearby Rivals
        </h3>
        <div class="flex flex-col gap-2">
          ${(data.nearbyUsers || []).map((u: any) => `
            <div class="flex items-center justify-between p-2 rounded ${u.rank == data.global_rank ? 'bg-[var(--tg-theme-secondary-bg-color)]' : ''}">
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