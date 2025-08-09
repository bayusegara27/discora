
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
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Use UTC to avoid timezone-related date calculation errors
    const today = new Date();
    const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

    for (let i = 6; i >= 0; i--) {
        const d = new Date(todayUTC);
        d.setUTCDate(d.getUTCDate() - i); // Operate on UTC date
        
        const dateString = d.toISOString().split('T')[0];
        const dayLabel = days[d.getUTCDay()]; // Use getUTCDay() for correct day of the week
        
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
        const [statsData, auditLogs, commandLogs] = await Promise.all([
            appwriteService.getServerStats(selectedServer.guildId),
            appwriteService.getAuditLogs(selectedServer.guildId),
            appwriteService.getCommandLogs(selectedServer.guildId),
        ]);
        
        setStats(statsData);

        const weeklyChartData = processChartData(Array.isArray(statsData.messagesWeekly) ? statsData.messagesWeekly : []);
        setChartData(weeklyChartData);

        const mappedAuditLogs: ActivityItem[] = auditLogs.slice(0, 5).map((log: LogEntry) => {
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
                case LogType.UserJoined:
                    logText = <><span className="font-bold">{log.user}</span> joined the server.</>
                    icon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>;
                    break;
                case LogType.UserLeft:
                    logText = <><span className="font-bold">{log.user}</span> left the server.</>
                    icon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>;
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

        const mappedCommandLogs: ActivityItem[] = commandLogs.slice(0,5).map((log: CommandLogEntry) => ({
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
        console.error(`[DashboardPage] Failed to fetch data for guild ${selectedServer.guildId}:`, error);
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
        <div className="text-center text-text-secondary p-8 bg-surface/50 rounded-2xl">
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Members" value={stats.memberCount} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.125-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.125-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>} colorClass="blue" />
          <StatCard title="Online Members" value={stats.onlineCount} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} colorClass="green" />
          <StatCard title="Messages Today" value={stats.messagesToday} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>} colorClass="yellow" />
          <StatCard title="Total Warnings" value={stats.totalWarnings} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} colorClass="red" />
        </div>
        <AnalyticsChart data={chartData} />
        <RoleDistributionChart data={roleDistributionData} />
      </div>

      {/* Right Sidebar */}
      <div className="lg:col-span-1 space-y-8">
        <RecentActivity items={activity} />
      </div>
    </div>
  );
};

export default DashboardPage;
