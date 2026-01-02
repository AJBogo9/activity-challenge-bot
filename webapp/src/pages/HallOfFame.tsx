import React from 'react';
import Chart from 'react-apexcharts';
import { Trophy, Target } from 'lucide-react';
import { ChartCard } from '../components/ChartCard';

interface HallOfFameProps {
  personalData: any;
}

export const HallOfFame: React.FC<HallOfFameProps> = ({ personalData }) => {
  return (
    <div className="p-4 space-y-4 animate-in slide-in-from-bottom-8 duration-300">
      <ChartCard title="Top 3 Battle (30 Days)">
        <Chart
          type="line"
          height={200}
          series={(personalData?.topUsersHistory || []).map((user: any) => ({
            name: user.name,
            data: user.history.map((h: any) => h.rank)
          }))}
          options={{
            chart: { toolbar: { show: false } },
            stroke: { width: 3, curve: 'smooth' },
            xaxis: { labels: { show: false } },
            yaxis: { reversed: true, labels: { style: { colors: '#999' } } },
            colors: ['#FFD700', '#C0C0C0', '#CD7F32'],
            legend: { position: 'bottom', fontWeight: 700 }
          }}
        />
      </ChartCard>

      <div className="bg-telegram-bg rounded-[2.5rem] overflow-hidden shadow-xl">
        <div className="p-8 bg-yellow-400 text-white flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black italic tracking-tighter">HALL OF FAME</h2>
            <p className="text-xs font-black opacity-80 uppercase tracking-widest">Global Elite</p>
          </div>
          <Trophy size={48} />
        </div>
        <div className="divide-y divide-telegram-secondary">
          {personalData?.topUsers?.map((user: any, i: number) => (
            <div key={user.telegram_id} className="p-6 flex items-center justify-between active:bg-telegram-secondary transition-colors">
              <div className="flex items-center gap-4">
                <span className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl ${
                  i === 0 ? 'bg-yellow-400 text-white shadow-lg' : 
                  i === 1 ? 'bg-slate-300 text-white' :
                  i === 2 ? 'bg-amber-600 text-white' : 'bg-telegram-secondary text-telegram-hint'
                }`}>
                  {i + 1}
                </span>
                <div>
                  <p className="font-black text-lg text-telegram-text">{user.first_name}</p>
                  <p className="text-xs text-telegram-hint font-bold uppercase tracking-widest">{user.guild || 'INDEPENDENT'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-telegram-button tabular-nums">{user.points}</p>
                <p className="text-[10px] text-telegram-hint font-black uppercase">pts</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
