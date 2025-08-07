import React, { useState, useEffect, useCallback } from 'react';
import { appwriteService } from '../services/appwrite';
import { ReactionRole, ServerMetadata, DiscordRole } from '../types';
import Spinner from '../components/Spinner';
import { useToast } from '../contexts/ToastContext';
import { useServer } from '../contexts/ServerContext';

type RolePair = { emoji: string; roleId: string };

const ReactionRolesPage: React.FC = () => {
    const { selectedServer } = useServer();
    const [reactionRoles, setReactionRoles] = useState<ReactionRole[]>([]);
    const [metadata, setMetadata] = useState<ServerMetadata | null>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const { addToast } = useToast();

    const [channelId, setChannelId] = useState('');
    const [embedTitle, setEmbedTitle] = useState('');
    const [embedDescription, setEmbedDescription] = useState('');
    const [embedColor, setEmbedColor] = useState('#5865F2');
    const [rolePairs, setRolePairs] = useState<RolePair[]>([{ emoji: '', roleId: '' }]);

    const fetchData = useCallback(async (guildId: string) => {
        setLoading(true);
        try {
            const [data, meta] = await Promise.all([
                appwriteService.getReactionRoles(guildId),
                appwriteService.getServerMetadata(guildId),
            ]);
            setReactionRoles(data);
            setMetadata(meta);
        } catch (error) {
            console.error('Failed to fetch reaction roles data', error);
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

    const resetModalState = () => {
        setChannelId('');
        setEmbedTitle('');
        setEmbedDescription('');
        setEmbedColor('#5865F2');
        setRolePairs([{ emoji: '', roleId: '' }]);
    };
    
    const openModalForNew = () => {
        resetModalState();
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const handlePairChange = (index: number, field: keyof RolePair, value: string) => {
        const newPairs = [...rolePairs];
        newPairs[index][field] = value;
        setRolePairs(newPairs);
    };

    const addPair = () => setRolePairs([...rolePairs, { emoji: '', roleId: '' }]);
    const removePair = (index: number) => setRolePairs(rolePairs.filter((_, i) => i !== index));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedServer) return;
        if (!channelId || !embedTitle || rolePairs.some(p => !p.emoji || !p.roleId)) {
            addToast("Channel, title, and all role pairs must be filled out.", "error");
            return;
        }

        setSaving(true);
        try {
            await appwriteService.createReactionRole({
                guildId: selectedServer.guildId,
                channelId,
                embedTitle,
                embedDescription,
                embedColor,
                roles: rolePairs,
            });
            addToast('Reaction Role created! The bot will post it shortly.', 'success');
            fetchData(selectedServer.guildId);
            closeModal();
        } catch (error) {
            addToast('Failed to create reaction role.', 'error');
        } finally {
            setSaving(false);
        }
    };
    
    const handleDelete = async (id: string) => {
        if (!selectedServer) return;
        if (window.confirm('Are you sure you want to delete this? The bot will not delete the message in Discord.')) {
            try {
                await appwriteService.deleteReactionRole(id);
                addToast('Reaction Role deleted.', 'success');
                fetchData(selectedServer.guildId);
            } catch (error) {
                addToast('Failed to delete reaction role.', 'error');
            }
        }
    };

    if (loading) return <Spinner />;
    if (!selectedServer) return <div className="text-center text-text-secondary">Please select a server.</div>;

    const sortedChannels = metadata?.channels?.slice().sort((a, b) => a.name.localeCompare(b.name)) || [];
    const sortedRoles = metadata?.roles?.slice().sort((a, b) => a.name.localeCompare(b.name)) || [];

    const getRoleName = (roleId: string) => metadata?.roles.find(r => r.id === roleId)?.name || 'Unknown Role';

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Reaction Roles</h2>
                    <p className="text-text-secondary">Let users self-assign roles by reacting to a message.</p>
                </div>
                <button onClick={openModalForNew} className="bg-primary text-white font-bold py-2 px-4 rounded-md hover:bg-opacity-80">
                    + New Reaction Role
                </button>
            </div>
            <div className="bg-surface p-4 rounded-lg shadow-lg">
                <div className="overflow-x-auto">
                     <table className="min-w-full text-left">
                        <thead className="border-b border-gray-700">
                            <tr>
                                <th className="p-4 text-sm font-semibold text-text-secondary">Embed Title</th>
                                <th className="p-4 text-sm font-semibold text-text-secondary">Channel</th>
                                <th className="p-4 text-sm font-semibold text-text-secondary">Message ID</th>
                                <th className="p-4 text-sm font-semibold text-text-secondary">Roles</th>
                                <th className="p-4 text-sm font-semibold text-text-secondary text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                             {reactionRoles.length > 0 ? reactionRoles.map(rr => (
                                <tr key={rr.id} className="border-b border-gray-800 hover:bg-background">
                                    <td className="p-4 font-medium">{rr.embedTitle}</td>
                                    <td className="p-4 text-text-secondary">#{metadata?.channels.find(c => c.id === rr.channelId)?.name || 'Unknown'}</td>
                                    <td className="p-4 font-mono text-xs">{rr.messageId}</td>
                                    <td className="p-4 text-sm space-y-1">
                                      {(Array.isArray(rr.roles) ? rr.roles : []).map((p, i) => <div key={i}>{p.emoji} → @{getRoleName(p.roleId)}</div>)}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => handleDelete(rr.id!)} className="text-red-400 hover:text-red-300">Delete</button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                   <td colSpan={5} className="text-center p-8 text-text-secondary">No reaction roles created yet.</td>
                                </tr>
                            )}
                        </tbody>
                     </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40" onClick={closeModal}>
                    <div className="bg-surface rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold p-6 border-b border-gray-700">New Reaction Role Message</h3>
                        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-4">
                            <div>
                                <label htmlFor="channelId" className="block text-sm font-medium text-text-secondary mb-1">Post in Channel</label>
                                <select id="channelId" value={channelId} onChange={e => setChannelId(e.target.value)} className="w-full bg-background border border-gray-600 rounded-md p-2" required>
                                    <option value="">Select a channel</option>
                                    {sortedChannels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
                                </select>
                            </div>
                            <div className="p-4 bg-secondary rounded-md space-y-4">
                                <h4 className="font-semibold">Embed Content</h4>
                                <div className="flex gap-4">
                                    <div className="flex-grow">
                                        <label htmlFor="embedTitle" className="block text-sm font-medium text-text-secondary mb-1">Title</label>
                                        <input type="text" id="embedTitle" value={embedTitle} onChange={e => setEmbedTitle(e.target.value)} className="w-full bg-background border border-gray-600 rounded-md p-2" required />
                                    </div>
                                    <div>
                                        <label htmlFor="embedColor" className="block text-sm font-medium text-text-secondary mb-1">Color</label>
                                        <input type="color" id="embedColor" value={embedColor} onChange={e => setEmbedColor(e.target.value)} className="w-20 h-10 bg-background border border-gray-600 rounded-md p-1" />
                                    </div>
                                </div>
                                 <div>
                                    <label htmlFor="embedDescription" className="block text-sm font-medium text-text-secondary mb-1">Description (Optional)</label>
                                    <textarea id="embedDescription" rows={4} value={embedDescription} onChange={e => setEmbedDescription(e.target.value)} className="w-full bg-background border border-gray-600 rounded-md p-2" />
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2">Emoji & Role Pairs</h4>
                                <div className="space-y-2">
                                    {rolePairs.map((pair, index) => (
                                        <div key={index} className="flex items-center gap-2 p-2 bg-secondary rounded-md">
                                            <input type="text" placeholder="Emoji" value={pair.emoji} onChange={e => handlePairChange(index, 'emoji', e.target.value)} className="w-16 bg-background border border-gray-600 rounded-md p-2 text-center" />
                                            <select value={pair.roleId} onChange={e => handlePairChange(index, 'roleId', e.target.value)} className="flex-grow bg-background border border-gray-600 rounded-md p-2">
                                                <option value="">Select a role</option>
                                                {sortedRoles.map(r => <option key={r.id} value={r.id}>@{r.name}</option>)}
                                            </select>
                                            <button type="button" onClick={() => removePair(index)} className="text-red-400 hover:text-red-300 p-2 rounded-md">&times;</button>
                                        </div>
                                    ))}
                                </div>
                                <button type="button" onClick={addPair} className="mt-2 text-sm text-accent hover:underline">+ Add another role</button>
                            </div>
                        </form>
                        <div className="flex justify-end gap-4 p-6 border-t border-gray-700">
                            <button type="button" onClick={closeModal} className="text-text-secondary hover:text-text-primary">Cancel</button>
                            <button type="submit" form="react-hook-form" onClick={handleSubmit} disabled={saving} className="bg-primary text-white font-bold py-2 px-6 rounded-md hover:bg-opacity-80 disabled:bg-gray-500">
                                {saving ? 'Saving...' : 'Create Message'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReactionRolesPage;