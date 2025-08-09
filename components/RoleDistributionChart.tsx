import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface RoleDistributionChartProps {
  data: { name: string; count: number; color: string }[];
}

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    // Position the label inside the slice
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Don't render labels for very small slices to avoid clutter
    if (percent * 100 < 5) return null; 

    return (
        <text 
            x={x} 
            y={y} 
            fill="white" 
            textAnchor="middle" 
            dominantBaseline="central" 
            className="text-xs font-bold"
            style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.6)' }} // Add shadow for better contrast
        >
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

// Define a custom tooltip component for better styling and visibility
const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0]; // Pie chart payload is an array with one item
        const roleColor = data.payload.color !== '#000000' ? data.payload.color : '#99aab5';
        return (
            <div 
                className="bg-surface/80 backdrop-blur-sm border border-primary p-3 rounded-lg shadow-lg text-sm"
            >
                <p className="text-text-primary">
                    <span className="font-bold" style={{ color: roleColor }}>
                        @{data.name}
                    </span>
                    : <span className="font-semibold">{data.value.toLocaleString()}</span> members
                </p>
            </div>
        );
    }
    return null;
};


const RoleDistributionChart: React.FC<RoleDistributionChartProps> = ({ data }) => {
    const chartData = data.filter(d => d.count > 0 && d.name !== '@everyone');

    if (!chartData || chartData.length === 0) {
        return (
             <div className="bg-surface/50 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-lg h-full flex flex-col items-center justify-center min-h-[24rem]">
                <h3 className="text-lg font-semibold mb-4 text-text-primary">Role Distribution</h3>
                <p className="text-text-secondary">No role data to display.</p>
            </div>
        )
    }
    
    // Calculate a sum of all members with roles for the center text
    const totalMembersWithRoles = chartData.reduce((sum, item) => sum + item.count, 0);

    return (
        <div className="bg-surface/50 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-lg min-h-[24rem]">
            <h3 className="text-lg font-semibold mb-4 text-text-primary">Role Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        innerRadius={70}
                        outerRadius={110}
                        fill="#8884d8"
                        paddingAngle={2}
                        dataKey="count"
                        nameKey="name"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color !== '#000000' ? entry.color : '#99aab5'} stroke={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }}/>
                    <text x="50%" y="48%" textAnchor="middle" dominantBaseline="middle" className="text-3xl font-bold fill-white">
                        {totalMembersWithRoles}
                    </text>
                    <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" className="text-sm fill-text-secondary">
                        Members with Roles
                    </text>
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default RoleDistributionChart;