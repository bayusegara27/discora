import React, { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import AnalyticsChart from '../components/AnalyticsChart';
import Spinner from '../components/Spinner';
import RecentActivity from '../components/RecentActivity';
import { appwriteService } from '../services/appwrite';
import { ServerStats, LogEntry, CommandLogEntry, LogType } from '../types';
import { ICONS } from '../constants';
import { useServer } from '../contexts/ServerContext';
import RoleDistributionChart from '../components/RoleDistributionChart';
import RightSidebar from '../components/RightSidebar';

export type ActivityItem = {
    id: string;
    type: 'audit' | 'command';
    logType: LogType | 'COMMAND_USED';
    timestamp: string;
    icon: React.ReactNode;
    text: React.ReactNode;
};

const processChartData = (data: { date: string; count: number }[]) => {
    const chartData: { day: string; count: number }[] = [];
    const today = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateString = d.toISOString().split('T')[0];
        
        const dayLabel = days[d.getDay()];
        
        const dataPoint = data.find(p => p.date === dateString);
        chartData.push({
            day: dayLabel,
            count: dataPoint ? dataPoint.count : 0,
        });
    }
    return chartData;
};


const DashboardPage: React.FC = () => {
  const { selectedServer } = useServer();
  const [stats, setStats] = useState<ServerStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [chartData, setChartData] = useState<{ day: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedServer) {
      setLoading(false);
      return;
    };

    const fetchData = async () => {
      setLoading(true);
      try {
        // OPTIMIZATION: Removed redundant getCustomCommands fetch.
        // The bot now calculates commandCount and it's included in getServerStats.
        const [statsData, auditLogs, commandLogs] = await Promise.all([
            appwriteService.getServerStats(selectedServer.guildId),
            appwriteService.getAuditLogs(selectedServer.guildId),
            appwriteService.getCommandLogs(selectedServer.guildId),
        ]);
        
        setStats(statsData);

        const weeklyChartData = processChartData(Array.isArray(statsData.messagesWeekly) ? statsData.messagesWeekly : []);
        setChartData(weeklyChartData);

        const mappedAuditLogs: ActivityItem[] = auditLogs.map((log: LogEntry) => {
            let logText: React.ReactNode;
            let icon = ICONS.auditLog;

            switch(log.type) {
                case LogType.AI_MODERATION:
                    logText = <><span className="font-bold">{log.user}</span> had a message flagged by AI.</>;
                    icon = ICONS.shield;
                    break;
                case LogType.AUTO_MOD_ACTION:
                     logText = <><span className="font-bold">AutoMod</span> took action on <span className="font-bold">{log.user}</span>.</>;
                     icon = ICONS.autoMod;
                     break;
                case LogType.MessageDeleted:
                     logText = <><span className="font-bold">{log.user}</span> triggered a message deleted event.</>;
                     break;
                default:
                    logText = <><span className="font-bold">{log.user}</span> triggered a {log.type.toLowerCase().replace(/_/g, ' ')} event.</>;
            }
            
            return {
                id: log.id,
                type: 'audit' as 'audit',
                logType: log.type,
                timestamp: log.timestamp,
                icon: icon,
                text: logText
            };
        });

        const mappedCommandLogs: ActivityItem[] = commandLogs.map((log: CommandLogEntry) => ({
            id: log.id,
            type: 'command',
            logType: 'COMMAND_USED',
            timestamp: log.timestamp,
            icon: ICONS.commandLog,
            text: <><span className="font-bold">{log.user}</span> used command <span className="font-mono text-accent">{log.command}</span></>
        }));

        const combinedActivity = [...mappedAuditLogs, ...mappedCommandLogs]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 10);

        setActivity(combinedActivity);

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedServer]);

  if (loading) {
    return <Spinner />;
  }

  if (!selectedServer) {
    return (
        <div className="text-center text-text-secondary p-8">
            <h2 className="text-2xl font-bold mb-2">Welcome to Discora</h2>
            <p>Please select a server from the dropdown in the header to get started.</p>
        </div>
    );
  }

  if (!stats) {
    return <div className="text-center text-text-secondary">Could not load server statistics for {selectedServer.name}.</div>;
  }
  
  const roleDistributionData = Array.isArray(stats.roleDistribution)
    ? stats.roleDistribution
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-12 xl:col-span-8 space-y-8">
            <h2 className="text-2xl font-bold text-text-primary">Dashboard Overview for {selectedServer.name}</h2>
            
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                title="Total Members" 
                value={stats.memberCount.toLocaleString()} 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                colorClass="bg-blue-500"
                />
                <StatCard 
                title="Online Members" 
                value={stats.onlineCount.toLocaleString()}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                colorClass="bg-green-500"
                />
                <StatCard 
                title="Messages Today" 
                value={stats.messagesToday.toLocaleString()}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>}
                colorClass="bg-yellow-500"
                />
                <StatCard 
                title="Total Warnings" 
                value={stats.totalWarnings}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                colorClass="bg-red-500"
                />
            </div>

            <AnalyticsChart data={chartData} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <RoleDistributionChart data={roleDistributionData} />
                <div className="bg-surface p-6 rounded-lg shadow-lg flex flex-col justify-center">
                    <h3 className="text-lg font-semibold mb-4 text-text-primary">Quick Actions</h3>
                    <StatCard 
                        title="Custom Commands" 
                        value={stats.commandCount}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                        colorClass="bg-purple-500"
                    />
                </div>
            </div>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-12 xl:col-span-4 space-y-8">
             <RecentActivity items={activity} />
             <RightSidebar />
        </div>
    </div>
  );
};

export default DashboardPage;
