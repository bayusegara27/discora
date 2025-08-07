import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ICONS } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { appwriteService } from '../services/appwrite';
import { BotInfo } from '../types';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: ICONS.dashboard },
  { path: '/settings', label: 'Server Settings', icon: ICONS.settings },
  { path: '/members', label: 'Members', icon: ICONS.members },
  { path: '/leaderboard', label: 'Leaderboard', icon: ICONS.leaderboard },
  { path: '/commands', label: 'Custom Commands', icon: ICONS.commands },
  { path: '/audit-log', label: 'Audit Log', icon: ICONS.auditLog },
  { path: '/command-log', label: 'Command Log', icon: ICONS.commandLog },
  { path: '/youtube', label: 'YouTube Notifications', icon: ICONS.youtube },
  { path: '/ai-helper', label: 'AI Helper', icon: ICONS.ai },
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
        `flex items-center p-2 rounded-md transition-colors duration-200 ${
          isActive
            ? 'bg-primary text-white'
            : 'text-text-secondary hover:bg-surface hover:text-text-primary'
        }`
      }
    >
      {icon}
      <span className="ml-3">{label}</span>
    </NavLink>
  </li>
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
    <div className={`flex flex-col w-64 bg-secondary text-text-primary p-4 space-y-6 transition-transform duration-300 ease-in-out fixed inset-y-0 left-0 z-30 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
      <div className="flex items-center space-x-3 px-2">
         <img 
            src={botInfo?.avatarUrl || "https://ui-avatars.com/api/?name=B&background=7289DA&color=fff"} 
            alt="Bot Avatar" 
            className="w-10 h-10 rounded-full" 
         />
        <div>
            <h1 className="text-xl font-bold">{botInfo?.name || 'AuraBot'}</h1>
            <div className="flex items-center space-x-1.5">
                <span className={`w-2.5 h-2.5 rounded-full transition-colors ${isBotOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className="text-xs text-text-secondary">{isBotOnline ? 'Online' : 'Offline'}</span>
            </div>
        </div>
      </div>

      <nav className="flex-1">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <NavItem key={item.path} {...item} onClick={handleNavItemClick} />
          ))}
        </ul>
      </nav>

      <div className="mt-auto">
        <button onClick={handleLogout} className="flex items-center p-2 rounded-md w-full text-text-secondary hover:bg-surface hover:text-text-primary">
          {ICONS.logout}
          <span className="ml-3">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;