import React from 'react';
import { useLocation } from 'react-router-dom';
import { ICONS } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import ServerSwitcher from './ServerSwitcher';

const getTitleFromPath = (path: string): string => {
    const pathParts = path.replace(/\/$/, "").split('/');
    const mainPath = `/${pathParts[1] || ''}`;

    switch(mainPath) {
        case '/dashboard': return 'Dashboard Overview';
        case '/settings': return 'Server Settings';
        case '/commands': return 'Custom Commands';
        case '/audit-log': return 'Audit Log';
        case '/command-log': return 'Command Log';
        case '/youtube': return 'YouTube Notifications';
        case '/ai-helper': return 'AI Content Helper';
        default: return 'Dashboard';
    }
}

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const location = useLocation();
  const title = getTitleFromPath(location.pathname);
  const { user } = useAuth();

  return (
    <header className="bg-surface shadow-md p-4 flex justify-between items-center z-10">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="text-text-secondary hover:text-text-primary md:hidden">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <ServerSwitcher />
      </div>
      <div className="flex items-center space-x-4">
        <button className="text-text-secondary hover:text-text-primary">
          {ICONS.bell}
        </button>
        <div className="flex items-center space-x-2">
            <img src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=38BDF8&color=fff`} alt="User Avatar" className="w-8 h-8 rounded-full" />
            <span className="text-text-primary font-medium hidden sm:inline">{user?.name || 'User'}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;