import { useState, useEffect } from 'react';
import { getPersonalStats, getGuildStats } from '../api';

export function useStats() {
  const [personalData, setPersonalData] = useState<any>(null);
  const [guildData, setGuildData] = useState<any[]>([]);
  const [guildHistory, setGuildHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [personal, guildsResponse] = await Promise.all([
        getPersonalStats(),
        getGuildStats()
      ]);
      setPersonalData(personal);
      setGuildData(guildsResponse.leaderboard || []);
      setGuildHistory(guildsResponse.rankingHistory || []);
    } catch (e: any) {
      console.error("Fetch error", e);
      if (e.response?.status === 401) {
        setError("Authentication Failed. Please open from Telegram.");
      } else {
        setError("Connection failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { personalData, guildData, guildHistory, loading, error, refresh: fetchData };
}
