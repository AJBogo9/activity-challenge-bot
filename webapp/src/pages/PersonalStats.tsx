import React from 'react';
import Chart from 'react-apexcharts';
import { Activity, TrendingUp } from 'lucide-react';
import { ChartCard } from '../components/ChartCard';

interface PersonalStatsProps {
  personalData: any;
}

export const PersonalStats: React.FC<PersonalStatsProps> = ({ personalData }) => {
  return (
    <div className="p-4 space-y-4 animate-in slide-in-from-bottom-8 duration-300">
      <ChartCard title="30-Day Rank Trend" icon={TrendingUp}>
        <Chart
          type="line"
          height={200}
          series={[{
            name: 'Rank',
            data: (personalData?.rankingHistory || []).map((h: any) => h.rank)
          }]}
          options={{
            chart: { toolbar: { show: false }, zoom: { enabled: false } },
            stroke: { curve: 'smooth', width: 4, colors: ['#FF8042'] },
            xaxis: { labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
            yaxis: { reversed: true, labels: { style: { colors: '#999', fontWeight: 700 } } },
            markers: { size: 0 }
          }}
        />
      </ChartCard>

      <ChartCard title="Activity Mix" icon={Activity}>
        <Chart
          type="donut"
          height={280}
          series={(personalData?.typeBreakdown || []).map((t: any) => t.value)}
          options={{
            labels: (personalData?.typeBreakdown || []).map((t: any) => t.name),
            colors: ['#3390ec', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'],
            legend: { position: 'bottom', fontWeight: 700 },
            dataLabels: { enabled: false },
            plotOptions: { pie: { donut: { size: '70%' } } }
          }}
        />
      </ChartCard>
    </div>
  );
};
