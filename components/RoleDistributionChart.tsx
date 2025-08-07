import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface RoleDistributionChartProps {
  data: { name: string; count: number; color: string }[];
}

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent * 100 < 5) return null; // Don't render label for small slices

    return (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

const RoleDistributionChart: React.FC<RoleDistributionChartProps> = ({ data }) => {
    // Filter out roles with 0 members and the @everyone role which is often noisy
    const chartData = data.filter(d => d.count > 0 && d.name !== '@everyone');

    if (!chartData || chartData.length === 0) {
        return (
             <div className="bg-surface p-6 rounded-lg shadow-lg h-full flex flex-col items-center justify-center min-h-[384px]">
                <h3 className="text-lg font-semibold mb-4 text-text-primary">Role Distribution</h3>
                <p className="text-text-secondary">No role data to display.</p>
            </div>
        )
    }

    return (
        <div className="bg-surface p-6 rounded-lg shadow-lg h-96">
            <h3 className="text-lg font-semibold mb-4 text-text-primary">Role Distribution</h3>
            <ResponsiveContainer width="100%" height="85%">
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="name"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color !== '#000000' ? entry.color : '#99aab5'} />
                        ))}
                    </Pie>
                    <Tooltip 
                        contentStyle={{ 
                            backgroundColor: '#23272A',
                            borderColor: '#404348',
                            color: '#F2F3F5'
                        }}
                    />
                    <Legend iconSize={10} wrapperStyle={{fontSize: '12px', color: '#949BA4'}} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default RoleDistributionChart;
