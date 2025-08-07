
import React from 'react';
import { ResponsiveContainer, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, Area } from 'recharts';

interface AnalyticsChartProps {
  data: { day: string; count: number }[];
}

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ data }) => {
  return (
    <div className="bg-surface p-6 rounded-lg shadow-lg h-96">
        <h3 className="text-lg font-semibold mb-4 text-text-primary">Weekly Message Activity</h3>
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#38BDF8" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#949BA4" />
                <YAxis stroke="#949BA4" />
                <CartesianGrid strokeDasharray="3 3" stroke="#404348" />
                <Tooltip 
                    contentStyle={{ 
                        backgroundColor: '#23272A',
                        borderColor: '#404348',
                        color: '#F2F3F5'
                    }}
                    itemStyle={{ color: '#F2F3F5' }}
                    labelStyle={{ color: '#949BA4' }}
                />
                <Area type="monotone" dataKey="count" stroke="#38BDF8" fillOpacity={1} fill="url(#colorCount)" />
            </AreaChart>
        </ResponsiveContainer>
    </div>
  );
};

export default AnalyticsChart;
