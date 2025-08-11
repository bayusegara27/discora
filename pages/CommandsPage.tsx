import React, { useState, useEffect, useCallback } from 'react';
import { appwriteService } from '../services/appwrite';
import { CustomCommand } from '../types';
import Spinner from '../components/Spinner';
import { useToast } from '../contexts/ToastContext';
import { useServer } from '../contexts/ServerContext';
import ToggleSwitch from '../components/ToggleSwitch';

const CommandsPage: React.FC = () => {
    const { selectedServer } = useServer();
    const [commands, setCommands] = useState<CustomCommand[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCommand, setEditingCommand] = useState<CustomCommand | null>(null);
    const [currentCommand, setCurrentCommand] = useState<{ command: string; response: string; isEmbed: boolean; embedContent: any }>({ command: '', response: '', isEmbed: false, embedContent: { title: '', description: '', color: '#5865F2' } });
    const [saving, setSaving] = useState(false);
    const { addToast } = useToast();

    const fetchCommands = useCallback(async (guildId: string) => {
        setLoading(true);
        try {
            const data = await appwriteService.getCustomCommands(guildId);
            setCommands(data);
        } catch (error) {
            console.error('Failed to fetch commands', error);
            addToast('Could not fetch commands.', 'error');
        } finally {
            setLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        if (selectedServer) {
            fetchCommands(selectedServer.guildId);
        } else {
            setCommands([]);
            setLoading(false);
        }
    }, [selectedServer, fetchCommands]);
    
    const openModalForNew = () => {
        setEditingCommand(null);
        setCurrentCommand({ command: '', response: '', isEmbed: false, embedContent: { title: '', description: '', color: '#5865F2' } });
        setIsModalOpen(true);
    };

    const openModalForEdit = (command: CustomCommand) => {
        setEditingCommand(command);
        let embedData = { title: '', description: '', color: '#5865F2' };
        if (command.isEmbed && command.embedContent) {
            try {
                embedData = JSON.parse(command.embedContent);
            } catch { /* use default */ }
        }
        setCurrentCommand({ 
            command: command.command, 
            response: command.response, 
            isEmbed: command.isEmbed,
            embedContent: embedData
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCommand(null);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCurrentCommand(prev => ({ ...prev, [name]: value }));
    };

    const handleEmbedChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCurrentCommand(prev => ({
            ...prev,
            embedContent: { ...prev.embedContent, [name]: value }
        }));
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedServer) {
            addToast("Please select a server first.", "error");
            return;
        }
        setSaving(true);
        const commandToSave = {
            ...currentCommand,
            embedContent: JSON.stringify(currentCommand.embedContent)
        };
        try {
            if (editingCommand) {
                await appwriteService.updateCustomCommand({ ...editingCommand, ...commandToSave });
                addToast('Command updated successfully!', 'success');
            } else {
                await appwriteService.createCustomCommand({ ...commandToSave, guildId: selectedServer.guildId });
                addToast('Command created successfully!', 'success');
            }
            fetchCommands(selectedServer.guildId);
            closeModal();
        } catch (error) {
            addToast('Failed to save command.', 'error');
        } finally {
            setSaving(false);
        }
    };
    
    const handleDelete = async (commandId: string) => {
        if (!selectedServer) return;
        if (window.confirm('Are you sure you want to delete this command?')) {
            try {
                await appwriteService.deleteCustomCommand(commandId);
                addToast('Command deleted.', 'success');
                fetchCommands(selectedServer.guildId);
            } catch (error) {
                addToast('Failed to delete command.', 'error');
            }
        }
    };

    if (loading) return <Spinner />;

    if (!selectedServer) {
        return <div className="text-center text-text-secondary">Please select a server to manage custom commands.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Custom Commands</h2>
                    <p className="text-text-secondary">Create and manage custom text or embed commands for {selectedServer.name}.</p>
                </div>
                <button onClick={openModalForNew} className="bg-primary text-white font-bold py-2 px-4 rounded-md hover:bg-opacity-80 transition-colors">
                    + New Command
                </button>
            </div>

            <div className="bg-surface p-4 rounded-lg shadow-lg">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                        <thead className="border-b border-gray-700">
                            <tr>
                                <th className="p-4 text-sm font-semibold text-text-secondary">Command</th>
                                <th className="p-4 text-sm font-semibold text-text-secondary">Response</th>
                                <th className="p-4 text-sm font-semibold text-text-secondary">Type</th>
                                <th className="p-4 text-sm font-semibold text-text-secondary text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {commands.length > 0 ? commands.map(cmd => (
                                <tr key={cmd.id} className="border-b border-gray-800 hover:bg-background">
                                    <td className="p-4 align-top font-mono text-accent">!{cmd.command}</td>
                                    <td className="p-4 text-sm text-text-primary align-top whitespace-pre-wrap max-w-xl truncate">
                                        {cmd.isEmbed ? `(Embed) ${JSON.parse(cmd.embedContent)?.title || ''}` : cmd.response}
                                    </td>
                                    <td className="p-4 align-top">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${cmd.isEmbed ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'}`}>
                                            {cmd.isEmbed ? 'Embed' : 'Text'}
                                        </span>
                                    </td>
                                    <td className="p-4 align-top text-right space-x-2">
                                        <button onClick={() => openModalForEdit(cmd)} className="text-blue-400 hover:text-blue-300">Edit</button>
                                        <button onClick={() => handleDelete(cmd.id!)} className="text-red-400 hover:text-red-300">Delete</button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                   <td colSpan={4} className="text-center p-8 text-text-secondary">No custom commands created for {selectedServer.name}.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-40" onClick={closeModal}>
                    <div className="bg-surface rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold p-6 border-b border-gray-700 flex-shrink-0">{editingCommand ? 'Edit Command' : 'Create New Command'}</h3>
                        <form onSubmit={handleSubmit} className="flex flex-col flex-grow overflow-hidden">
                            <div className="p-6 space-y-4 overflow-y-auto">
                                <div>
                                    <label htmlFor="command" className="block text-sm font-medium text-text-secondary mb-1">Command Name (without prefix)</label>
                                    <input 
                                        type="text" 
                                        name="command" 
                                        id="command"
                                        value={currentCommand.command}
                                        onChange={handleInputChange}
                                        className="w-full bg-background border border-gray-600 rounded-md p-2 focus:ring-primary focus:border-primary"
                                        required
                                    />
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <label htmlFor="isEmbed" className="font-medium text-text-primary">Response Type</label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-text-secondary">Text</span>
                                        <ToggleSwitch enabled={currentCommand.isEmbed} onChange={val => setCurrentCommand(p => ({...p, isEmbed: val}))} />
                                        <span className="text-sm text-text-primary">Embed</span>
                                    </div>
                                </div>

                                {!currentCommand.isEmbed ? (
                                    <div>
                                        <label htmlFor="response" className="block text-sm font-medium text-text-secondary mb-1">Bot's Response</label>
                                        <textarea 
                                            name="response" 
                                            id="response" 
                                            rows={5}
                                            value={currentCommand.response}
                                            onChange={handleInputChange}
                                            className="w-full bg-background border border-gray-600 rounded-md p-2 focus:ring-primary focus:border-primary"
                                            required
                                        ></textarea>
                                    </div>
                                ) : (
                                    <div className="space-y-4 p-4 bg-secondary rounded-md">
                                        <div>
                                            <label htmlFor="title" className="block text-sm font-medium text-text-secondary mb-1">Embed Title</label>
                                            <input type="text" name="title" value={currentCommand.embedContent.title} onChange={handleEmbedChange} className="w-full bg-background border border-gray-600 rounded-md p-2" />
                                        </div>
                                        <div>
                                            <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-1">Embed Description</label>
                                            <textarea name="description" rows={5} value={currentCommand.embedContent.description} onChange={handleEmbedChange} className="w-full bg-background border border-gray-600 rounded-md p-2"></textarea>
                                        </div>
                                        <div>
                                            <label htmlFor="color" className="block text-sm font-medium text-text-secondary mb-1">Embed Color</label>
                                            <input type="color" name="color" value={currentCommand.embedContent.color} onChange={handleEmbedChange} className="w-full h-10 bg-background border border-gray-600 rounded-md p-1" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-4 p-4 bg-secondary/30 border-t border-gray-700 flex-shrink-0">
                                <button type="button" onClick={closeModal} className="text-text-secondary hover:text-text-primary">Cancel</button>
                                <button type="submit" disabled={saving} className="bg-primary text-white font-bold py-2 px-6 rounded-md hover:bg-opacity-80 transition-colors disabled:bg-gray-500">
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

export default CommandsPage;