import React from 'react';
import { useLocation } from 'react-router-dom';
import { ICONS } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import ServerSwitcher from './ServerSwitcher';
import { useServer } from '../contexts/ServerContext';

const getTitleFromPath = (path: string): string => {
    const pathSegment = path.split('/').filter(Boolean)[0] || 'dashboard';
    const titles: { [key: string]: string } = {
        dashboard: 'Dashboard Overview',
        settings: 'Server Settings',
        commands: 'Custom Commands',
        'auto-moderation': 'Auto Moderation',
        'reaction-roles': 'Reaction Roles',
        'scheduled-messages': 'Scheduled Messages',
        giveaways: 'Giveaways',
        music: 'Music Player',
        'audit-log': 'Audit Log',
        'command-log': 'Command Log',
        leaderboard: 'Leaderboard',
        members: 'Members',
        youtube: 'YouTube Notifications',
        'ai-helper': 'AI Content Helper',
    };
    return titles[pathSegment] || 'Dashboard';
}

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const location = useLocation();
  const { selectedServer } = useServer();
  const title = getTitleFromPath(location.pathname);
  const { user } = useAuth();

  return (
    <header className="bg-surface/30 backdrop-blur-lg border-b border-white/10 p-4 flex justify-between items-center z-10 flex-shrink-0">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="text-text-secondary hover:text-text-primary md:hidden">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <ServerSwitcher />
        <div className="hidden md:block">
            <h1 className="text-xl font-bold text-text-primary">{title}</h1>
            {selectedServer && <p className="text-sm text-text-secondary">for {selectedServer.name}</p>}
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <button className="text-text-secondary hover:text-text-primary p-2 rounded-full hover:bg-white/10 transition-colors">
          {ICONS.bell}
        </button>
        <div className="flex items-center space-x-2 p-1 pr-3 rounded-full bg-secondary/50 hover:bg-secondary/80 transition-colors cursor-pointer">
            <img src={`https://ui-avatars.com/api/?name=${user?.name || 'U'}&background=38BDF8&color=fff`} alt="User Avatar" className="w-8 h-8 rounded-full" />
            <span className="text-text-primary font-medium hidden sm:inline">{user?.name || 'User'}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;