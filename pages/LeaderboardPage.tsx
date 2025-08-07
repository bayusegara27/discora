import React, { useState, useEffect } from 'react';
import { appwriteService } from '../services/appwrite';
import { UserLevel } from '../types';
import Spinner from '../components/Spinner';
import { useServer } from '../contexts/ServerContext';

// This is the total accumulated XP required to reach the given level (for level >= 1).
// e.g., to reach level 1, a user needs 155 total XP.
const totalXpForLevel = (level: number): number => {
    if (level <= 0) return 0; // Level 0 starts at 0 XP.
    return 5 * ((level) ** 2) + 50 * (level) + 100;
};

const LeaderboardPage: React.FC = () => {
    const { selectedServer } = useServer();
    const [leaderboard, setLeaderboard] = useState<UserLevel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!selectedServer) {
            setLoading(false);
            return;
        }
        setLoading(true);
        appwriteService.getLeaderboard(selectedServer.guildId)
            .then(setLeaderboard)
            .finally(() => setLoading(false));
    }, [selectedServer]);

    if (loading) return <Spinner />;

    if (!selectedServer) {
        return <div className="text-center text-text-secondary">Please select a server to view the leaderboard.</div>;
    }

    const rankEmojis = ['🥇', '🥈', '🥉'];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Server Leaderboard</h2>
                <p className="text-text-secondary">Top 100 most active members in {selectedServer.name}.</p>
            </div>

            <div className="bg-surface p-4 rounded-lg shadow-lg">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                        <thead className="border-b border-gray-700">
                            <tr>
                                <th className="p-4 text-sm font-semibold text-text-secondary w-16 text-center">Rank</th>
                                <th className="p-4 text-sm font-semibold text-text-secondary">User</th>
                                <th className="p-4 text-sm font-semibold text-text-secondary text-center">Level</th>
                                <th className="p-4 text-sm font-semibold text-text-secondary">XP Progress</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboard.length > 0 ? leaderboard.map((user, index) => {
                                // XP required to be at the start of the current level.
                                const levelStartXp = totalXpForLevel(user.level);
                                // Total XP required to advance to the next level.
                                const levelEndXp = totalXpForLevel(user.level + 1);

                                // Progress within the current level.
                                const xpInCurrentLevel = user.xp - levelStartXp;
                                const xpNeededForLevel = levelEndXp - levelStartXp;
                                
                                const progressPercentage = xpNeededForLevel > 0 
                                    ? Math.min(100, Math.round((xpInCurrentLevel / xpNeededForLevel) * 100)) 
                                    : 100;

                                return (
                                    <tr key={user.id} className="border-b border-gray-800 hover:bg-background">
                                        <td className="p-4 align-middle text-center">
                                            {index < 3 ? (
                                                <span className="text-3xl">{rankEmojis[index]}</span>
                                            ) : (
                                                <span className={`text-xl font-bold text-text-secondary`}>
                                                    #{index + 1}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 align-middle">
                                            <div className="flex items-center gap-3">
                                                <img src={user.userAvatarUrl || `https://ui-avatars.com/api/?name=${user.username.charAt(0)}`} alt={user.username} className="w-10 h-10 rounded-full" />
                                                <span className="font-medium">{user.username}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle text-center">
                                            <span className="text-lg font-bold text-primary bg-primary/20 px-3 py-1 rounded-full">
                                                {user.level}
                                            </span>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <div className="relative w-full">
                                                <div className="bg-secondary rounded-full h-5 overflow-hidden">
                                                    <div 
                                                        className="bg-gradient-to-r from-cyan-400 to-blue-500 h-5 rounded-full transition-all duration-500" 
                                                        style={{ width: `${progressPercentage}%` }}
                                                    ></div>
                                                </div>
                                                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>
                                                    {xpInCurrentLevel.toLocaleString()} / {xpNeededForLevel.toLocaleString()} XP ({progressPercentage}%)
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                   <td colSpan={4} className="text-center p-8 text-text-secondary">No one has earned XP yet in {selectedServer.name}.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LeaderboardPage;