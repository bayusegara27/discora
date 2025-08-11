import React, { useState, useEffect, useCallback } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { appwriteService } from '../services/appwrite';
import { GuildMember } from '../types';
import Spinner from '../components/Spinner';
import { useServer } from '../contexts/ServerContext';
import { useToast } from '../contexts/ToastContext';
import { useModal } from '../contexts/ModalContext';

const MembersPage: React.FC = () => {
    const { selectedServer } = useServer();
    const { addToast } = useToast();
    const { openModal } = useModal();
    
    const [members, setMembers] = useState<GuildMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [totalMembers, setTotalMembers] = useState(0);
    
    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    const fetchMembers = useCallback(async () => {
        if (!selectedServer) return;
        setLoading(true);
        try {
            const { members: fetchedMembers, total } = await appwriteService.getMembers(selectedServer.guildId, page, debouncedSearchQuery);
            setMembers(fetchedMembers);
            setTotalMembers(total);
        } catch (error) {
            addToast("Failed to load server members.", 'error');
        } finally {
            setLoading(false);
        }
    }, [selectedServer, page, debouncedSearchQuery, addToast]);
    
    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);
    
    if (!selectedServer) {
        return <div className="text-center text-text-secondary">Please select a server to manage members.</div>;
    }

    const totalPages = Math.ceil(totalMembers / 25);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Server Members</h2>
                    <p className="text-text-secondary">Browse, search, and manage all members in {selectedServer.name}.</p>
                </div>
                 <div className="relative">
                    <input
                        type="text"
                        placeholder="Search members..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full md:w-64 bg-secondary border border-gray-600 rounded-md py-2 pl-10 pr-4 focus:ring-primary focus:border-primary"
                    />
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-secondary" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>
            </div>

            <div className="bg-surface p-4 rounded-lg shadow-lg">
                {loading ? (
                    <Spinner />
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left">
                                <thead className="border-b border-gray-700">
                                    <tr>
                                        <th className="p-4 text-sm font-semibold text-text-secondary">User</th>
                                        <th className="p-4 text-sm font-semibold text-text-secondary">User ID</th>
                                        <th className="p-4 text-sm font-semibold text-text-secondary">Joined</th>
                                        <th className="p-4 text-sm font-semibold text-text-secondary text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {members.length > 0 ? members.map((member) => (
                                        <tr key={member.id} className="border-b border-gray-800 hover:bg-background">
                                            <td className="p-4 align-middle">
                                                <div className="flex items-center gap-3">
                                                    <img src={member.userAvatarUrl || `https://ui-avatars.com/api/?name=${member.username.charAt(0)}`} alt={member.username} className="w-10 h-10 rounded-full" />
                                                    <span className="font-medium">{member.username}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 align-middle font-mono text-xs text-text-secondary">{member.userId}</td>
                                            <td className="p-4 align-middle text-sm text-text-secondary">{new Date(member.joinedAt).toLocaleDateString()}</td>
                                            <td className="p-4 align-middle text-right">
                                                <div className="relative group inline-block">
                                                    <button className="px-2 py-1 rounded-md hover:bg-secondary">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                                        </svg>
                                                    </button>
                                                    <div className="absolute right-0 top-full mt-1 w-32 bg-secondary rounded-md shadow-lg z-10 p-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                                                        <button onClick={() => openModal({id: member.userId, name: member.username, avatar: member.userAvatarUrl}, 'kick')} className="block w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-surface rounded">Kick</button>
                                                        <button onClick={() => openModal({id: member.userId, name: member.username, avatar: member.userAvatarUrl}, 'ban')} className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-surface rounded">Ban</button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="text-center p-8 text-text-secondary">
                                                {searchQuery ? `No members found matching "${searchQuery}".` : "No members found."}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-between items-center pt-4 text-sm text-text-secondary">
                            <div>
                                Page {page} of {totalPages}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 bg-secondary rounded disabled:opacity-50">Previous</button>
                                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1 bg-secondary rounded disabled:opacity-50">Next</button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default MembersPage;