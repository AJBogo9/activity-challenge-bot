// Minimal API wrapper using fetch
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  const webapp = (window as any).Telegram?.WebApp;
  if (webapp?.initData) {
    headers['X-Telegram-Init-Data'] = webapp.initData;
  }
  
  return headers;
}

export async function fetchStats() {
  const res = await fetch(`${BASE_URL}/stats/personal`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

export async function fetchPersonalStats() {
  const res = await fetch(`${BASE_URL}/stats/personal`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch personal stats');
  return res.json();
}

export async function fetchGuildStats() {
  const res = await fetch(`${BASE_URL}/stats/guilds`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch guild stats');
  return res.json();
}

export async function fetchPlayerStats(page: number = 0, limit: number = 50) {
  const res = await fetch(`${BASE_URL}/stats/players?page=${page}&limit=${limit}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch player stats');
  return res.json();
}

export async function fetchGuildDetails(name: string) {
  const res = await fetch(`${BASE_URL}/stats/guild/details?name=${encodeURIComponent(name)}`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to fetch guild details');
  return res.json();
}
