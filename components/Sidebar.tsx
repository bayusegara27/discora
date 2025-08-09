import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ICONS } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { appwriteService } from '../services/appwrite';
import { BotInfo } from '../types';

type NavLinkItem = {
  type: 'link';
  path: string;
  label: string;
  icon: React.ReactNode;
};

type NavDividerItem = {
  type: 'divider';
  label: string;
};

type NavItemUnion = NavLinkItem | NavDividerItem;


const navItems: NavItemUnion[] = [
  { type: 'link', path: '/dashboard', label: 'Dashboard', icon: ICONS.dashboard },
  { type: 'link', path: '/settings', label: 'Server Settings', icon: ICONS.settings },
  { type: 'divider', label: 'Features' },
  { type: 'link', path: '/auto-moderation', label: 'Auto Moderation', icon: ICONS.autoMod },
  { type: 'link', path: '/reaction-roles', label: 'Reaction Roles', icon: ICONS.reactionRoles },
  { type: 'link', path: '/scheduled-messages', label: 'Scheduled Messages', icon: ICONS.scheduledMessages },
  { type: 'link', path: '/giveaways', label: 'Giveaways', icon: ICONS.giveaways },
  { type: 'link', path: '/youtube', label: 'YouTube Notifications', icon: ICONS.youtube },
  { type: 'link', path: '/commands', label: 'Custom Commands', icon: ICONS.commands },
  { type: 'link', path: '/music', label: 'Music Player', icon: ICONS.music },
  { type: 'divider', label: 'Community' },
  { type: 'link', path: '/leaderboard', label: 'Leaderboard', icon: ICONS.leaderboard },
  { type: 'link', path: '/members', label: 'Members', icon: ICONS.members },
  { type: 'divider', label: 'Logs & Tools' },
  { type: 'link', path: '/audit-log', label: 'Audit Log', icon: ICONS.auditLog },
  { type: 'link', path: '/command-log', label: 'Command Log', icon: ICONS.commandLog },
  { type: 'link', path: '/ai-helper', label: 'AI Helper', icon: ICONS.ai },
];

interface NavItemProps {
  path: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ path, label, icon, onClick }) => (
  <li>
    <NavLink
      to={path}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center p-2.5 rounded-lg transition-all duration-200 group ${
          isActive
            ? 'bg-primary/20 text-white shadow-lg shadow-primary/20'
            : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
        }`
      }
    >
        <span className="group-[.active]:text-accent">{icon}</span>
        <span className="ml-3 font-medium">{label}</span>
    </NavLink>
  </li>
);

const NavDivider: React.FC<{label: string}> = ({ label }) => (
    <li className="px-2 pt-4 pb-2 text-xs font-semibold text-text-secondary/80 uppercase tracking-wider">{label}</li>
);

interface SidebarProps {
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setOpen }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [botInfo, setBotInfo] = useState<BotInfo | null>(null);
  const [isBotOnline, setIsBotOnline] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const [info, status] = await Promise.all([
          appwriteService.getBotInfo(),
          appwriteService.getSystemStatus(),
        ]);
        setBotInfo(info);
        if (status?.lastSeen) {
          const lastSeenDate = new Date(status.lastSeen);
          const now = new Date();
          // If last seen within the last 60 seconds, consider online
          setIsBotOnline(now.getTime() - lastSeenDate.getTime() < 60000);
        } else {
          setIsBotOnline(false);
        }
      } catch (error) {
        console.error("Failed to fetch bot status", error);
        setIsBotOnline(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleNavItemClick = () => {
    if (window.innerWidth < 768) { // md breakpoint
      setOpen(false);
    }
  };
  
  const handleLogout = async () => {
    try {
        await logout();
        navigate('/login');
        addToast("You have been logged out.", 'info');
    } catch (error) {
        addToast("Logout failed. Please try again.", 'error');
    }
  };

  return (
    <aside className={`flex flex-col w-64 bg-secondary/40 backdrop-blur-lg border-r border-white/10 text-text-primary p-4 space-y-6 transition-transform duration-300 ease-in-out fixed inset-y-0 left-0 z-30 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
      <div className="flex items-center space-x-3 px-2">
         <img 
            src={botInfo?.avatarUrl || "https://ui-avatars.com/api/?name=D&background=7289DA&color=fff"} 
            alt="Bot Avatar" 
            className="w-10 h-10 rounded-full border-2 border-primary/50" 
         />
        <div>
            <h1 className="text-xl font-bold">{botInfo?.name || 'Discora'}</h1>
            <div className="flex items-center space-x-2">
                <span className={`w-3 h-3 rounded-full transition-colors ${isBotOnline ? 'bg-green-500 animate-pulse-online' : 'bg-red-500'}`}></span>
                <span className="text-xs font-semibold text-text-secondary">{isBotOnline ? 'Online' : 'Offline'}</span>
            </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto pr-2 -mr-2">
        <ul className="space-y-1.5">
          {navItems.map((item, index) => 
            item.type === 'link'
            ? <NavItem key={item.path} path={item.path} label={item.label} icon={item.icon} onClick={handleNavItemClick} />
            : <NavDivider key={`divider-${index}`} label={item.label} />
          )}
        </ul>
      </nav>

      <div className="mt-auto">
        <button onClick={handleLogout} className="flex items-center p-2.5 rounded-lg w-full text-text-secondary hover:bg-white/5 hover:text-text-primary">
          {ICONS.logout}
          <span className="ml-3 font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
