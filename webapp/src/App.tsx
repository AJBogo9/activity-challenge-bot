import { useState, useEffect } from 'react';
import { useStats } from './hooks/useStats';
import { DashboardView } from './pages/Dashboard';
import { PersonalStats } from './pages/PersonalStats';
import { GuildRankings } from './pages/GuildRankings';
import { HallOfFame } from './pages/HallOfFame';
import { BarChart3, AlertCircle, RefreshCw } from 'lucide-react';

type View = 'dashboard' | 'me' | 'guilds' | 'top';

function App() {
  const [view, setView] = useState<View>('dashboard');
  const { personalData, guildData, guildHistory, loading, error, refresh } = useStats();
  const tg = (window as any).Telegram?.WebApp;

  useEffect(() => {
    if (tg) {
      tg.expand();
      tg.ready();
    }
  }, []);

  useEffect(() => {
    if (!tg) return;
    if (view === 'dashboard') {
      tg.BackButton.hide();
    } else {
      tg.BackButton.show();
      const onBack = () => setView('dashboard');
      tg.BackButton.onClick(onBack);
      return () => tg.BackButton.offClick(onBack);
    }
  }, [view]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-telegram-secondary gap-4">
        <div className="w-12 h-12 border-4 border-telegram-button border-t-transparent rounded-full animate-spin"></div>
        <p className="text-telegram-hint font-bold animate-pulse uppercase tracking-widest">Syncing Hub...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-screen bg-telegram-secondary text-center">
        <AlertCircle size={64} className="text-red-500 mb-4" />
        <h2 className="text-xl font-black mb-2 tracking-tighter">CONNECTION LOST</h2>
        <p className="text-telegram-hint text-sm mb-6 font-medium">{error}</p>
        <button onClick={refresh} className="bg-telegram-button text-white px-8 py-4 rounded-3xl font-black flex items-center gap-2 shadow-lg shadow-telegram-button/20">
          <RefreshCw size={18} /> RETRY
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-telegram-secondary pb-12">
      {/* Universal Header */}
      <div className="p-4 bg-telegram-bg sticky top-0 z-10 border-b border-telegram-secondary flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <BarChart3 className="text-telegram-button" size={20} />
          <span className="font-black text-telegram-text uppercase tracking-tighter">
            {view === 'dashboard' ? 'Activity Hub' : 
             view === 'me' ? 'My Progress' : 
             view === 'guilds' ? 'Guild Battles' : 'Hall of Fame'}
          </span>
        </div>
        <button onClick={refresh} className="p-2 text-telegram-button active:rotate-180 transition-transform duration-500">
          <RefreshCw size={18} />
        </button>
      </div>

      {/* View Router */}
      <main>
        {view === 'dashboard' && <DashboardView personalData={personalData} onViewChange={setView} />}
        {view === 'me' && <PersonalStats personalData={personalData} />}
        {view === 'guilds' && <GuildRankings guildData={guildData} guildHistory={guildHistory} />}
        {view === 'top' && <HallOfFame personalData={personalData} />}
      </main>
    </div>
  );
}

export default App;
