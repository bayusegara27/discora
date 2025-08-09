
import React, { useState, useEffect } from 'react';
import { appwriteService } from '../services/appwrite';
import { LogEntry, LogType } from '../types';
import Spinner from '../components/Spinner';
import { useServer } from '../contexts/ServerContext';
import { useModal } from '../contexts/ModalContext';

const getLogTypePillClass = (type: LogType): string => {
    switch (type) {
        case LogType.UserJoined: return 'bg-green-500/20 text-green-300';
        case LogType.UserLeft: return 'bg-yellow-500/20 text-yellow-300';
        case LogType.MessageDeleted: return 'bg-blue-500/20 text-blue-300';
        case LogType.UserKicked:
        case LogType.UserBanned: return 'bg-red-500/20 text-red-300';
        case LogType.UserUnbanned: return 'bg-purple-500/20 text-purple-300';
        case LogType.AI_MODERATION: 
        case LogType.AUTO_MOD_ACTION: return 'bg-orange-500/20 text-orange-300';
        default: return 'bg-gray-500/20 text-gray-300';
    }
}

const LogTypePill: React.FC<{ type: LogType }> = ({ type }) => (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getLogTypePillClass(type)}`}>
        {type.replace(/_/g, ' ')}
    </span>
);

const AuditLogPage: React.FC = () => {
    const { selectedServer } = useServer();
    const { openModal } = useModal();
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        if (!selectedServer) {
            setLoading(false);
            return;
        }
        setLoading(true);
        appwriteService.getAuditLogs(selectedServer.guildId)
            .then(setLogs)
            .catch(error => console.error(`[AuditLogPage] Failed to fetch audit logs for guild ${selectedServer.guildId}:`, error))
            .finally(() => setLoading(false));
    }, [selectedServer]);

    if (loading) return <Spinner />;
    
    if (!selectedServer) {
        return <div className="text-center text-text-secondary">Please select a server to view its audit log.</div>;
    }

    return (
        <div className="bg-surface p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4 text-text-primary">Audit Logs</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                    <thead className="border-b border-gray-700">
                        <tr>
                            <th className="p-4 text-sm font-semibold text-text-secondary">Type</th>
                            <th className="p-4 text-sm font-semibold text-text-secondary">User</th>
                            <th className="p-4 text-sm font-semibold text-text-secondary">Details</th>
                            <th className="p-4 text-sm font-semibold text-text-secondary">Timestamp</th>
                            <th className="p-4 text-sm font-semibold text-text-secondary">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length > 0 ? logs.map(log => (
                            <tr key={log.id} className="border-b border-gray-800 hover:bg-background">
                                <td className="p-4 align-top"><LogTypePill type={log.type} /></td>
                                <td className="p-4 font-mono text-sm text-text-primary align-top">
                                    <div className="flex items-center gap-2">
                                        <img src={log.userAvatarUrl || `https://ui-avatars.com/api/?name=${log.user.charAt(0)}`} alt={log.user} className="w-6 h-6 rounded-full" />
                                        <span>{log.user}</span>
                                    </div>
                                </td>
                                <td className="p-4 text-sm text-text-primary align-top whitespace-pre-wrap">{log.content}</td>
                                <td className="p-4 text-sm text-text-secondary align-top whitespace-nowrap">
                                    {new Date(log.timestamp).toLocaleString()}
                                </td>
                                <td className="p-4 text-sm text-text-secondary align-top">
                                    {log.userId !== 'system' && !log.user.includes('AutoMod') && (
                                        <div className="relative group">
                                            <button className="px-2 py-1 rounded-md hover:bg-secondary">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                                </svg>
                                            </button>
                                            <div className="absolute right-0 mt-2 w-32 bg-secondary rounded-md shadow-lg z-10 p-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                                                <button onClick={() => openModal({id: log.userId, name: log.user, avatar: log.userAvatarUrl}, 'kick')} className="block w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-surface rounded">Kick</button>
                                                <button onClick={() => openModal({id: log.userId, name: log.user, avatar: log.userAvatarUrl}, 'ban')} className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-surface rounded">Ban</button>
                                            </div>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                               <td colSpan={5} className="text-center p-8 text-text-secondary">No audit logs found for {selectedServer.name}.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AuditLogPage;
