import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass: string; // e.g., "blue"
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, colorClass }) => {
  
  const glowColors: {[key: string]: string} = {
      blue: 'from-blue-500/50',
      green: 'from-green-500/50',
      yellow: 'from-yellow-500/50',
      red: 'from-red-500/50',
      purple: 'from-purple-500/50',
  }

  return (
    <div className="bg-surface/50 backdrop-blur-md border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
      {/* Glow Effect */}
      <div className={`absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-br ${glowColors[colorClass]} to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-spin-slow`}></div>
      
      <div className="relative z-10 flex flex-col justify-between h-full">
        <div className="flex justify-between items-start">
            <p className="text-sm text-text-secondary font-medium uppercase tracking-wider">{title}</p>
            <div className="text-white/30">{icon}</div>
        </div>
        <div>
            <p className="text-5xl font-bold text-text-primary mt-2">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default StatCard;