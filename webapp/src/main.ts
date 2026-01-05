import './api'; // Init API
import { icons } from './components/icons';
import { renderDashboard } from './pages/Dashboard';
import { renderPersonalStats } from './pages/PersonalStats';
import { renderGuildRankings } from './pages/GuildRankings';
import { renderPlayerRankings } from './pages/PlayerRankings';

// --- Router State ---
let currentPage = 'dashboard';
const pages: Record<string, HTMLElement> = {};
const pageFetchTimes: Record<string, number> = {};
const STALE_TIME = 30000; // 30 seconds

// --- Navigation ---
const navItems = [
  { id: 'dashboard', label: 'Home', icon: icons.home },
  { id: 'rankings', label: 'Guilds', icon: icons.trophy },
  { id: 'players', label: 'Players', icon: icons.users },
  { id: 'personal', label: 'My Stats', icon: icons.user },
];

function renderNav() {
  const navEl = document.getElementById('nav');
  if (!navEl) return;

  // Only render inner HTML once if possible, or just update classes. 
  // For simplicity, we re-render, it's fast enough for the nav bar.
  navEl.innerHTML = navItems.map(item => `
    <a href="#" class="nav-item ${currentPage === item.id ? 'active' : ''}" data-page="${item.id}">
      <div class="nav-icon">${item.icon}</div>
      <span>${item.label}</span>
    </a>
  `).join('');

  // Attach events
  navEl.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const page = (e.currentTarget as HTMLElement).dataset.page;
      if (page && page !== currentPage) {
        navigate(page);
      }
    });
  });
}

// --- Page Rendering ---
async function navigate(pageId: string) {
  currentPage = pageId;
  renderNav();
  
  // Toggle visibility
  Object.keys(pages).forEach(id => {
    const el = pages[id];
    if (id === pageId) {
      el.style.display = 'block';
    } else {
      el.style.display = 'none';
    }
  });

  // Auto-refresh if stale
  const now = Date.now();
  if (now - (pageFetchTimes[pageId] || 0) > STALE_TIME) {
    console.log(`Tab ${pageId} is stale, auto-refreshing...`);
    refreshTab(pageId);
  }
}

async function refreshTab(id: string) {
    let newEl: HTMLElement;
    switch (id) {
      case 'dashboard': newEl = await renderDashboard(); break;
      case 'rankings': newEl = await renderGuildRankings(); break;
      case 'players': newEl = await renderPlayerRankings(); break;
      case 'personal': newEl = await renderPersonalStats(); break;
      default: newEl = await renderDashboard();
    }

    const oldEl = pages[id];
    if (oldEl && newEl) {
       oldEl.replaceWith(newEl);
       pages[id] = newEl;
       pageFetchTimes[id] = Date.now();
       if (id === currentPage) {
           newEl.style.display = 'block';
       } else {
           newEl.style.display = 'none';
       }
    }
}

// --- Init ---
async function init() {
  // Telegram WebApp Setup
  const tg = (window as any).Telegram?.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
  }

  const app = document.getElementById('app');
  if (!app) return;

  // Render all pages at once (in parallel for speed)
  const [dashboardEl, rankingsEl, playersEl, personalEl] = await Promise.all([
    renderDashboard(),
    renderGuildRankings(),
    renderPlayerRankings(),
    renderPersonalStats()
  ]);

  const now = Date.now();
  pages['dashboard'] = dashboardEl;
  pages['rankings'] = rankingsEl;
  pages['players'] = playersEl;
  pages['personal'] = personalEl;
  
  Object.keys(pages).forEach(id => pageFetchTimes[id] = now);

  // Append all to DOM
  app.appendChild(dashboardEl);
  app.appendChild(rankingsEl);
  app.appendChild(playersEl);
  app.appendChild(personalEl);

  // Setup Refresh Button
  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) {
    refreshBtn.innerHTML = icons.refresh;
    refreshBtn.addEventListener('click', handleRefresh);
  }

  // Initial state
  navigate('dashboard');
}

async function handleRefresh() {
  const btn = document.getElementById('refresh-btn');
  if (!btn || btn.classList.contains('spinning')) return;

  btn.classList.add('spinning');
  try {
    await refreshTab(currentPage);
  } catch (e) {
    console.error("Refresh failed", e);
  } finally {
    btn.classList.remove('spinning');
  }
}

init();