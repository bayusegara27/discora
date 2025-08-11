
import React, { useState, useEffect } from 'react';
import { appwriteService } from '../services/appwrite';
import { CommandLogEntry } from '../types';
import Spinner from '../components/Spinner';
import { useServer } from '../contexts/ServerContext';
import { useModal } from '../contexts/ModalContext';

const CommandLogPage: React.FC = () => {
    const { selectedServer } = useServer();
    const { openModal } = useModal();
    const [logs, setLogs] = useState<CommandLogEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!selectedServer) {
            setLoading(false);
            return;
        }
        setLoading(true);
        appwriteService.getCommandLogs(selectedServer.guildId)
            .then(data => setLogs(data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())))
            .catch(error => console.error(`[CommandLogPage] Failed to fetch command logs for guild ${selectedServer.guildId}:`, error))
            .finally(() => setLoading(false));
    }, [selectedServer]);

    if (loading) return <Spinner />;

    if (!selectedServer) {
        return <div className="text-center text-text-secondary">Please select a server to view its command log.</div>;
    }

    return (
        <div className="bg-surface p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4 text-text-primary">Command Usage Log</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                    <thead className="border-b border-gray-700">
                        <tr>
                            <th className="p-4 text-sm font-semibold text-text-secondary">Command</th>
                            <th className="p-4 text-sm font-semibold text-text-secondary">User</th>
                            <th className="p-4 text-sm font-semibold text-text-secondary">Timestamp</th>
                            <th className="p-4 text-sm font-semibold text-text-secondary">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length > 0 ? logs.map(log => (
                            <tr key={log.id} className="border-b border-gray-800 hover:bg-background">
                                <td className="p-4 font-mono text-sm text-accent">{log.command}</td>
                                <td className="p-4 font-mono text-sm text-text-primary">
                                    <div className="flex items-center gap-2">
                                        <img src={log.userAvatarUrl || `https://ui-avatars.com/api/?name=${log.user.charAt(0)}`} alt={log.user} className="w-6 h-6 rounded-full" />
                                        <span>{log.user}</span>
                                    </div>
                                </td>
                                <td className="p-4 text-sm text-text-secondary whitespace-nowrap">
                                    {new Date(log.timestamp).toLocaleString()}
                                </td>
                                <td className="p-4 text-sm text-text-secondary align-top">
                                    <div className="relative group">
                                        <button className="px-2 py-1 rounded-md hover:bg-secondary">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                            </svg>
                                        </button>
                                        <div className="absolute right-0 top-full mt-1 w-32 bg-secondary rounded-md shadow-lg z-10 p-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                                            <button onClick={() => openModal({id: log.userId, name: log.user, avatar: log.userAvatarUrl}, 'kick')} className="block w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-surface rounded">Kick</button>
                                            <button onClick={() => openModal({id: log.userId, name: log.user, avatar: log.userAvatarUrl}, 'ban')} className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-surface rounded">Ban</button>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                               <td colSpan={4} className="text-center p-8 text-text-secondary">No command usage has been logged for {selectedServer.name}.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CommandLogPage;