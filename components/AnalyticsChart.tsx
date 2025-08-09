import React from 'react';
import { ResponsiveContainer, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, Area } from 'recharts';

interface AnalyticsChartProps {
  data: { day: string; count: number }[];
}

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ data }) => {
  return (
    <div className="bg-surface/50 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-lg min-h-[24rem]">
        <h3 className="text-lg font-semibold mb-4 text-text-primary">Weekly Message Activity</h3>
        <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#5865F2" stopOpacity={0.1}/>
                    </linearGradient>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                </defs>
                <XAxis dataKey="day" stroke="#949BA4" tick={{ fill: '#949BA4', fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis stroke="#949BA4" allowDecimals={false} tick={{ fill: '#949BA4', fontSize: 12 }} tickLine={false} axisLine={false}/>
                <CartesianGrid strokeDasharray="3 3" stroke="#404348" vertical={false} />
                <Tooltip 
                    contentStyle={{ 
                        backgroundColor: 'rgba(35, 39, 42, 0.8)',
                        backdropFilter: 'blur(4px)',
                        borderColor: '#5865F2',
                        borderWidth: 1,
                        borderRadius: '0.5rem',
                        color: '#F2F3F5',
                        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
                    }}
                    itemStyle={{ color: '#F2F3F5' }}
                    labelStyle={{ color: '#949BA4', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="count" name="Messages" stroke="#38BDF8" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCount)" style={{ filter: 'url(#glow)' }} />
            </AreaChart>
        </ResponsiveContainer>
    </div>
  );
};

export default AnalyticsChart;