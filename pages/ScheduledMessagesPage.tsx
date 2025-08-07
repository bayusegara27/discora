import React, { useState, useEffect, useCallback } from 'react';
import { appwriteService } from '../services/appwrite';
import { ScheduledMessage, ServerMetadata } from '../types';
import Spinner from '../components/Spinner';
import { useToast } from '../contexts/ToastContext';
import { useServer } from '../contexts/ServerContext';

type StatusType = 'pending' | 'sent' | 'error';

const ScheduledMessagesPage: React.FC = () => {
    const { selectedServer } = useServer();
    const [messages, setMessages] = useState<ScheduledMessage[]>([]);
    const [metadata, setMetadata] = useState<ServerMetadata | null>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMessage, setEditingMessage] = useState<ScheduledMessage | null>(null);
    const [currentMessage, setCurrentMessage] = useState<Partial<ScheduledMessage>>({});
    const [saving, setSaving] = useState(false);
    const { addToast } = useToast();

    const fetchData = useCallback(async (guildId: string) => {
        setLoading(true);
        try {
            const [data, meta] = await Promise.all([
                appwriteService.getScheduledMessages(guildId),
                appwriteService.getServerMetadata(guildId),
            ]);
            setMessages(data);
            setMetadata(meta);
        } catch (error) {
            console.error('Failed to fetch page data', error);
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

    const openModalForNew = () => {
        setEditingMessage(null);
        setCurrentMessage({
            content: '',
            channelId: '',
            repeat: 'none',
            nextRun: new Date(Date.now() + 60000).toISOString().slice(0, 16),
        });
        setIsModalOpen(true);
    };

    const openModalForEdit = (msg: ScheduledMessage) => {
        setEditingMessage(msg);
        setCurrentMessage({ ...msg, nextRun: new Date(msg.nextRun).toISOString().slice(0, 16) });
        setIsModalOpen(true);
    };

    const closeModal = () => setIsModalOpen(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCurrentMessage(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedServer) return;
        if (!currentMessage.content || !currentMessage.channelId || !currentMessage.nextRun) {
            addToast("Content, channel, and a schedule time are required.", "error");
            return;
        }
        setSaving(true);
        const dataToSave = {
            ...currentMessage,
            nextRun: new Date(currentMessage.nextRun).toISOString(),
            guildId: selectedServer.guildId,
            status: 'pending',
        };
        try {
            if (editingMessage) {
                await appwriteService.updateScheduledMessage({ ...editingMessage, ...dataToSave } as ScheduledMessage);
                addToast('Message updated successfully!', 'success');
            } else {
                await appwriteService.createScheduledMessage(dataToSave as Omit<ScheduledMessage, 'id'>);
                addToast('Message scheduled successfully!', 'success');
            }
            fetchData(selectedServer.guildId);
            closeModal();
        } catch (error) {
            addToast('Failed to save scheduled message.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!selectedServer) return;
        if (window.confirm('Are you sure you want to delete this scheduled message?')) {
            try {
                await appwriteService.deleteScheduledMessage(id);
                addToast('Message deleted.', 'success');
                fetchData(selectedServer.guildId);
            } catch (error) {
                addToast('Failed to delete message.', 'error');
            }
        }
    };
    
    if (loading) return <Spinner />;
    if (!selectedServer) return <div className="text-center text-text-secondary">Please select a server.</div>;

    const getStatusPill = (status: StatusType) => {
        const styles: Record<StatusType, string> = {
            pending: 'bg-yellow-500/20 text-yellow-300',
            sent: 'bg-green-500/20 text-green-300',
            error: 'bg-red-500/20 text-red-300',
        };
        return <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${styles[status] || 'bg-gray-500/20'}`}>{status}</span>;
    }

    const sortedChannels = metadata?.channels?.slice().sort((a, b) => a.name.localeCompare(b.name)) || [];
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Scheduled Messages</h2>
                    <p className="text-text-secondary">Create announcements or reminders to be sent automatically.</p>
                </div>
                <button onClick={openModalForNew} className="bg-primary text-white font-bold py-2 px-4 rounded-md hover:bg-opacity-80">
                    + New Message
                </button>
            </div>
            <div className="bg-surface p-4 rounded-lg shadow-lg">
                 <div className="overflow-x-auto">
                     <table className="min-w-full text-left">
                        <thead className="border-b border-gray-700">
                            <tr>
                                <th className="p-4 text-sm font-semibold text-text-secondary">Content</th>
                                <th className="p-4 text-sm font-semibold text-text-secondary">Channel</th>
                                <th className="p-4 text-sm font-semibold text-text-secondary">Next Run</th>
                                <th className="p-4 text-sm font-semibold text-text-secondary">Repeat</th>
                                <th className="p-4 text-sm font-semibold text-text-secondary">Status</th>
                                <th className="p-4 text-sm font-semibold text-text-secondary text-right">Actions</th>
                            </tr>
                        </thead>
                         <tbody>
                             {messages.length > 0 ? messages.map(msg => (
                                <tr key={msg.id} className="border-b border-gray-800 hover:bg-background">
                                    <td className="p-4 text-sm max-w-sm truncate">{msg.content}</td>
                                    <td className="p-4">#{metadata?.channels.find(c => c.id === msg.channelId)?.name || 'Unknown'}</td>
                                    <td className="p-4 text-sm text-text-secondary">{new Date(msg.nextRun).toLocaleString()}</td>
                                    <td className="p-4 capitalize text-sm text-text-secondary">{msg.repeat}</td>
                                    <td className="p-4">{getStatusPill(msg.status)}</td>
                                    <td className="p-4 text-right space-x-2">
                                        <button onClick={() => openModalForEdit(msg)} className="text-blue-400 hover:text-blue-300">Edit</button>
                                        <button onClick={() => handleDelete(msg.id!)} className="text-red-400 hover:text-red-300">Delete</button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                   <td colSpan={6} className="text-center p-8 text-text-secondary">No scheduled messages found.</td>
                                </tr>
                            )}
                        </tbody>
                     </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40" onClick={closeModal}>
                    <div className="bg-surface rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold p-6 border-b border-gray-700">{editingMessage ? 'Edit' : 'New'} Scheduled Message</h3>
                        <form onSubmit={handleSubmit}>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label htmlFor="content" className="block text-sm font-medium text-text-secondary mb-1">Message Content</label>
                                    <textarea name="content" id="content" rows={6} value={currentMessage.content} onChange={handleInputChange} className="w-full bg-background border border-gray-600 rounded-md p-2" required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="channelId" className="block text-sm font-medium text-text-secondary mb-1">Channel</label>
                                        <select name="channelId" id="channelId" value={currentMessage.channelId} onChange={handleInputChange} className="w-full bg-background border border-gray-600 rounded-md p-2" required>
                                            <option value="">Select a channel</option>
                                            {sortedChannels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="repeat" className="block text-sm font-medium text-text-secondary mb-1">Repeat</label>
                                        <select name="repeat" id="repeat" value={currentMessage.repeat} onChange={handleInputChange} className="w-full bg-background border border-gray-600 rounded-md p-2">
                                            <option value="none">None</option>
                                            <option value="daily">Daily</option>
                                            <option value="weekly">Weekly</option>
                                            <option value="monthly">Monthly</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="nextRun" className="block text-sm font-medium text-text-secondary mb-1">Time to Send (Your Timezone)</label>
                                    <input type="datetime-local" name="nextRun" id="nextRun" value={currentMessage.nextRun} onChange={handleInputChange} className="w-full bg-background border border-gray-600 rounded-md p-2" required />
                                </div>
                            </div>
                            <div className="flex justify-end gap-4 p-4 bg-secondary/30">
                                <button type="button" onClick={closeModal} className="text-text-secondary hover:text-text-primary">Cancel</button>
                                <button type="submit" disabled={saving} className="bg-primary text-white font-bold py-2 px-6 rounded-md hover:bg-opacity-80 disabled:bg-gray-500">
                                    {saving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScheduledMessagesPage;