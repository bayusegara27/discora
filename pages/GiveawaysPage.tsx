import React, { useState, useEffect, useCallback } from 'react';
import { appwriteService } from '../services/appwrite';
import { Giveaway, ServerMetadata } from '../types';
import Spinner from '../components/Spinner';
import { useToast } from '../contexts/ToastContext';
import { useServer } from '../contexts/ServerContext';

interface GiveawayListProps {
  title: string;
  list: Giveaway[];
  onReroll: (id: string) => void;
  onDelete: (id: string) => void;
}

const GiveawaysPage: React.FC = () => {
    const { selectedServer } = useServer();
    const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
    const [metadata, setMetadata] = useState<ServerMetadata | null>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const { addToast } = useToast();

    // Modal state
    const [prize, setPrize] = useState('');
    const [channelId, setChannelId] = useState('');
    const [winnerCount, setWinnerCount] = useState(1);
    const [duration, setDuration] = useState(24); // in hours

    const fetchData = useCallback(async (guildId: string) => {
        setLoading(true);
        try {
            const [data, meta] = await Promise.all([
                appwriteService.getGiveaways(guildId),
                appwriteService.getServerMetadata(guildId),
            ]);
            setGiveaways(data);
            setMetadata(meta);
        } catch (error) {
            console.error('Failed to fetch giveaways data', error);
            addToast('Could not fetch page data.', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        if (selectedServer) {
            fetchData(selectedServer.guildId);
        } else {
            setLoading(false);
        }
    }, [selectedServer, fetchData]);

    const resetModal = () => {
        setPrize('');
        setChannelId('');
        setWinnerCount(1);
        setDuration(24);
    };

    const openModalForNew = () => {
        resetModal();
        setIsModalOpen(true);
    };

    const closeModal = () => setIsModalOpen(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedServer || !prize || !channelId || winnerCount < 1 || duration <= 0) {
            addToast("Please fill all fields with valid values.", "error");
            return;
        }

        setSaving(true);
        const endsAt = new Date(Date.now() + duration * 60 * 60 * 1000).toISOString();
        
        try {
            await appwriteService.createGiveaway({
                guildId: selectedServer.guildId,
                channelId,
                prize,
                winnerCount,
                endsAt,
            });
            addToast('Giveaway created! The bot will start it shortly.', 'success');
            fetchData(selectedServer.guildId);
            closeModal();
        } catch (error) {
            addToast('Failed to create giveaway.', 'error');
        } finally {
            setSaving(false);
        }
    };
    
    const handleReroll = async (id: string) => {
        if (!selectedServer) return;
        if (window.confirm('Are you sure you want to reroll a new winner? This will be announced in Discord.')) {
            try {
                await appwriteService.rerollGiveaway(id);
                addToast('Reroll initiated. Check Discord for the new winner.', 'info');
            } catch (error) {
                addToast('Failed to start a reroll.', 'error');
            }
        }
    };
    
    const handleDelete = async (id: string) => {
        if (!selectedServer) return;
        if (window.confirm('Are you sure you want to delete this giveaway? This cannot be undone.')) {
            try {
                await appwriteService.deleteGiveaway(id);
                addToast('Giveaway deleted.', 'success');
                fetchData(selectedServer.guildId);
            } catch (error) {
                addToast('Failed to delete giveaway.', 'error');
            }
        }
    };

    if (loading) return <Spinner />;
    if (!selectedServer) return <div className="text-center text-text-secondary">Please select a server.</div>;

    const activeGiveaways = giveaways.filter(g => g.status === 'running');
    const endedGiveaways = giveaways.filter(g => g.status !== 'running');
    const sortedChannels = metadata?.channels?.slice().sort((a, b) => a.name.localeCompare(b.name)) || [];

    const GiveawayList: React.FC<GiveawayListProps> = ({ title, list, onReroll, onDelete }) => (
        <div>
            <h3 className="text-xl font-semibold mb-4">{title}</h3>
            {list.length > 0 ? (
                <div className="bg-surface p-4 rounded-lg shadow-lg">
                    <table className="min-w-full text-left">
                        <thead className="border-b border-gray-700">
                            <tr>
                                <th className="p-4 text-sm font-semibold text-text-secondary">Prize</th>
                                <th className="p-4 text-sm font-semibold text-text-secondary">Status</th>
                                <th className="p-4 text-sm font-semibold text-text-secondary">Ends / Ended</th>
                                <th className="p-4 text-sm font-semibold text-text-secondary">Winners</th>
                                <th className="p-4 text-sm font-semibold text-text-secondary text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {list.map(g => (
                                <tr key={g.id} className="border-b border-gray-800 hover:bg-background">
                                    <td className="p-4 font-medium">{g.prize}</td>
                                    <td className="p-4"><span className={`capitalize px-2 py-1 text-xs font-semibold rounded-full ${g.status === 'running' ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}>{g.status}</span></td>
                                    <td className="p-4 text-sm">{new Date(g.endsAt).toLocaleString()}</td>
                                    <td className="p-4 text-sm">{Array.isArray(g.winners) ? g.winners.map(w => `<@${w}>`).join(', ') : 'N/A'}</td>
                                    <td className="p-4 text-right space-x-2">
                                        {g.status === 'ended' && <button onClick={() => onReroll(g.id!)} className="text-blue-400 hover:text-blue-300">Reroll</button>}
                                        <button onClick={() => onDelete(g.id!)} className="text-red-400 hover:text-red-300">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-text-secondary">No {title.toLowerCase()} giveaways.</p>
            )}
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Giveaways</h2>
                    <p className="text-text-secondary">Run and manage giveaways for your community.</p>
                </div>
                <button onClick={openModalForNew} className="bg-primary text-white font-bold py-2 px-4 rounded-md hover:bg-opacity-80">
                    + New Giveaway
                </button>
            </div>

            <GiveawayList title="Active Giveaways" list={activeGiveaways} onReroll={handleReroll} onDelete={handleDelete} />
            <GiveawayList title="Ended Giveaways" list={endedGiveaways} onReroll={handleReroll} onDelete={handleDelete} />

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40" onClick={closeModal}>
                    <div className="bg-surface rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold p-6 border-b border-gray-700">New Giveaway</h3>
                        <form onSubmit={handleSubmit}>
                             <div className="p-6 space-y-4">
                                <div>
                                    <label htmlFor="prize" className="block text-sm font-medium text-text-secondary mb-1">Prize</label>
                                    <input type="text" id="prize" value={prize} onChange={e => setPrize(e.target.value)} className="w-full bg-background border border-gray-600 rounded-md p-2" required />
                                </div>
                                <div>
                                    <label htmlFor="channelId" className="block text-sm font-medium text-text-secondary mb-1">Announcement Channel</label>
                                    <select id="channelId" value={channelId} onChange={e => setChannelId(e.target.value)} className="w-full bg-background border border-gray-600 rounded-md p-2" required>
                                        <option value="">Select a channel</option>
                                        {sortedChannels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                     <div>
                                        <label htmlFor="winnerCount" className="block text-sm font-medium text-text-secondary mb-1">Number of Winners</label>
                                        <input type="number" id="winnerCount" value={winnerCount} onChange={e => setWinnerCount(parseInt(e.target.value))} min="1" className="w-full bg-background border border-gray-600 rounded-md p-2" required />
                                    </div>
                                    <div>
                                        <label htmlFor="duration" className="block text-sm font-medium text-text-secondary mb-1">Duration (hours)</label>
                                        <input type="number" id="duration" value={duration} onChange={e => setDuration(parseInt(e.target.value))} min="1" className="w-full bg-background border border-gray-600 rounded-md p-2" required />
                                    </div>
                                </div>
                             </div>
                             <div className="flex justify-end gap-4 p-4 bg-secondary/30">
                                <button type="button" onClick={closeModal} className="text-text-secondary hover:text-text-primary">Cancel</button>
                                <button type="submit" disabled={saving} className="bg-primary text-white font-bold py-2 px-6 rounded-md hover:bg-opacity-80 disabled:bg-gray-500">
                                    {saving ? 'Starting...' : 'Start Giveaway'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GiveawaysPage;