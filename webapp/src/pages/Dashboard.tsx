import React from 'react';
import { Trophy, Users, User, ChevronRight, Activity } from 'lucide-react';

interface DashboardProps {
  personalData: any;
  onViewChange: (view: any) => void;
}

export const DashboardView: React.FC<DashboardProps> = ({ personalData, onViewChange }) => {
  return (
    <div className="p-4 space-y-4 animate-in fade-in zoom-in-95 duration-300">
      <div className="rounded-[2.5rem] bg-gradient-to-br from-telegram-button to-blue-600 p-8 text-white shadow-2xl shadow-telegram-button/30">
        <p className="text-xs font-black uppercase tracking-widest opacity-70">Total Points</p>
        <h2 className="text-6xl font-black mt-2 tabular-nums">{personalData?.points || 0}</h2>
        <div className="mt-8 flex gap-3">
          <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl text-xs font-black">RANK #{personalData?.global_rank || '-'}</div>
          <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl text-xs font-black truncate">{personalData?.guild || 'NO GUILD'}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {[
          { id: 'me', title: 'My Progress', icon: <User />, color: 'bg-blue-50 text-blue-500' },
          { id: 'guilds', title: 'Guild Battles', icon: <Users />, color: 'bg-orange-50 text-orange-500' },
          { id: 'top', title: 'Hall of Fame', icon: <Trophy />, color: 'bg-yellow-50 text-yellow-500' }
        ].map((item) => (
          <button 
            key={item.id} 
            onClick={() => onViewChange(item.id)}
            className="w-full bg-telegram-bg p-5 rounded-[2rem] flex items-center justify-between active:scale-[0.97] transition-all"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center`}>{item.icon}</div>
              <h3 className="font-black text-telegram-text">{item.title}</h3>
            </div>
            <ChevronRight className="text-telegram-hint" size={20} />
          </button>
        ))}
      </div>
    </div>
  );
};
