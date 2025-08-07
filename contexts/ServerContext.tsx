import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { appwriteService } from '../services/appwrite';
import { Server } from '../types';
import Spinner from '../components/Spinner';

interface ServerContextType {
  servers: Server[];
  selectedServer: Server | null;
  selectServer: (guildId: string | null) => void;
  loading: boolean;
}

const ServerContext = createContext<ServerContextType | undefined>(undefined);

export const useServer = () => {
  const context = useContext(ServerContext);
  if (!context) {
    throw new Error('useServer must be used within a ServerProvider');
  }
  return context;
};

interface ServerProviderProps {
    children: ReactNode;
}

const LOCAL_STORAGE_KEY = 'aurabot_selected_guild_id';

export const ServerProvider: React.FC<ServerProviderProps> = ({ children }) => {
    const [servers, setServers] = useState<Server[]>([]);
    const [selectedServer, setSelectedServer] = useState<Server | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchServers = async () => {
            try {
                const serverList = await appwriteService.getServers();
                setServers(serverList);

                const savedGuildId = localStorage.getItem(LOCAL_STORAGE_KEY);
                if (savedGuildId && serverList.some(s => s.guildId === savedGuildId)) {
                    setSelectedServer(serverList.find(s => s.guildId === savedGuildId) || null);
                } else if (serverList.length > 0) {
                    setSelectedServer(serverList[0]);
                }
            } catch (error) {
                console.error("Failed to fetch servers", error);
            } finally {
                setLoading(false);
            }
        };
        fetchServers();
    }, []);

    const selectServer = useCallback((guildId: string | null) => {
        if (guildId === null) {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            setSelectedServer(null);
            return;
        }
        const serverToSelect = servers.find(s => s.guildId === guildId);
        if (serverToSelect) {
            setSelectedServer(serverToSelect);
            localStorage.setItem(LOCAL_STORAGE_KEY, guildId);
        }
    }, [servers]);

    if (loading) {
         return (
            <div className="w-screen h-screen bg-background flex items-center justify-center">
                <Spinner />
            </div>
        );
    }

    const value = { servers, selectedServer, selectServer, loading };

    return <ServerContext.Provider value={value}>{children}</ServerContext.Provider>;
};
