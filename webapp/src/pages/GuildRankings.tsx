import React from 'react';
import Chart from 'react-apexcharts';
import { ChartCard } from '../components/ChartCard';

interface GuildRankingsProps {
  guildData: any[];
  guildHistory: any[];
}

export const GuildRankings: React.FC<GuildRankingsProps> = ({ guildData, guildHistory }) => {
  return (
    <div className="p-4 space-y-4 animate-in slide-in-from-bottom-8 duration-300">
      <ChartCard title="Battle for the Top" headerColor="text-telegram-button">
        <Chart
          type="line"
          height={300}
          series={[...new Set(guildHistory.map(h => h.guild))].slice(0, 6).map((name, i) => ({
            name,
            data: Array.from(new Set(guildHistory.map(h => h.date))).sort().map(d => {
              const entry = guildHistory.find(h => h.guild === name && h.date === d);
              return entry ? entry.rank : null;
            })
          }))}
          options={{
            chart: { toolbar: { show: false } },
            stroke: { width: 3, curve: 'smooth' },
            xaxis: { labels: { show: false } },
            yaxis: { reversed: true, labels: { style: { colors: '#999' } } },
            colors: ['#3390ec', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'],
            legend: { position: 'bottom', fontWeight: 700 }
          }}
        />
      </ChartCard>

      <ChartCard title="Average Points">
        <Chart
          type="bar"
          height={300}
          series={[{
            name: 'Avg Points',
            data: guildData.slice(0, 8).map(g => Number(g.average_points))
          }]}
          options={{
            plotOptions: { bar: { horizontal: true, borderRadius: 5 } },
            xaxis: { categories: guildData.slice(0, 8).map(g => g.guild) },
            colors: ['#3390ec'],
            dataLabels: { enabled: false }
          }}
        />
      </ChartCard>

      <div className="bg-telegram-bg rounded-3xl overflow-hidden shadow-sm">
        <h3 className="p-6 pb-0 text-xs font-black text-telegram-hint uppercase tracking-widest mb-2">Detailed Standings</h3>
        <div className="divide-y divide-telegram-secondary">
          {guildData.map((g, i) => (
            <div key={g.guild} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-telegram-hint w-4">{i + 1}</span>
                <p className="font-bold text-telegram-text">{g.guild}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-telegram-button">{g.average_points} pts</p>
                <p className="text-[10px] text-telegram-hint uppercase tracking-tighter">{g.active_members} active / {g.total_members} members</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
