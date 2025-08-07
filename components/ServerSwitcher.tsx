import React, { useState } from 'react';
import { useServer } from '../contexts/ServerContext';

const ServerSwitcher: React.FC = () => {
  const { servers, selectedServer, selectServer, loading } = useServer();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (guildId: string) => {
    selectServer(guildId);
    setIsOpen(false);
  };

  if (loading) {
    return <div className="w-48 h-10 bg-gray-700 rounded-md animate-pulse"></div>;
  }
  
  if (servers.length === 0) {
    return <div className="text-text-secondary">No servers found.</div>;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-secondary p-2 rounded-md hover:bg-gray-700 transition-colors w-56 text-left"
      >
        {selectedServer ? (
          <>
            <img src={selectedServer.iconUrl || `https://ui-avatars.com/api/?name=${selectedServer.name.charAt(0)}&background=38BDF8&color=fff`} alt={selectedServer.name} className="w-6 h-6 rounded-md" />
            <span className="flex-1 truncate font-medium">{selectedServer.name}</span>
          </>
        ) : (
          <span className="flex-1 text-text-secondary">Select a server...</span>
        )}
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-56 bg-secondary rounded-md shadow-lg z-20 py-1">
          {servers.map(server => (
            <button
              key={server.guildId}
              onClick={() => handleSelect(server.guildId)}
              className={`flex items-center space-x-2 w-full text-left p-2 hover:bg-surface ${selectedServer?.guildId === server.guildId ? 'bg-primary/20' : ''}`}
            >
              <img src={server.iconUrl || `https://ui-avatars.com/api/?name=${server.name.charAt(0)}&background=38BDF8&color=fff`} alt={server.name} className="w-6 h-6 rounded-md" />
              <span className="flex-1 truncate">{server.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServerSwitcher;