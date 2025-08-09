import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import AuditLogPage from './pages/AuditLogPage';
import YoutubePage from './pages/YoutubePage';
import AiHelperPage from './pages/AiHelperPage';
import CommandsPage from './pages/CommandsPage';
import CommandLogPage from './pages/CommandLogPage';
import LeaderboardPage from './pages/LeaderboardPage';
import MembersPage from './pages/MembersPage';
import { ToastProvider } from './contexts/ToastContext';
import ToastContainer from './components/ToastContainer';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';
import Spinner from './components/Spinner';
import { ServerProvider } from './contexts/ServerContext';
import { ModalProvider } from './contexts/ModalContext';
import ModerationActionModal from './components/ModerationActionModal';
import AutoModPage from './pages/AutoModPage';
import ReactionRolesPage from './pages/ReactionRolesPage';
import ScheduledMessagesPage from './pages/ScheduledMessagesPage';
import GiveawaysPage from './pages/GiveawaysPage';
import MusicPage from './pages/MusicPage';


const App: React.FC = () => {
  return (
    <ToastProvider>
        <AuthProvider>
            <AppRouter />
        </AuthProvider>
    </ToastProvider>
  );
};

const AppRouter: React.FC = () => {
    const { loading } = useAuth();

    if (loading) {
        return (
            <div className="w-screen h-screen bg-background flex items-center justify-center">
                <Spinner />
            </div>
        );
    }

    return (
        <HashRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/*" element={
                    <ProtectedRoute>
                        <ServerProvider>
                          <ModalProvider>
                            <DashboardLayout />
                          </ModalProvider>
                        </ServerProvider>
                    </ProtectedRoute>
                } />
            </Routes>
        </HashRouter>
    );
};

const DashboardLayout: React.FC = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background/80 backdrop-blur-3xl text-text-primary relative">
      <Sidebar isOpen={isSidebarOpen} setOpen={setSidebarOpen} />
      {isSidebarOpen && <div className="fixed inset-0 bg-black/60 z-20 md:hidden" onClick={() => setSidebarOpen(false)}></div>}

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/commands" element={<CommandsPage />} />
            <Route path="/auto-moderation" element={<AutoModPage />} />
            <Route path="/reaction-roles" element={<ReactionRolesPage />} />
            <Route path="/scheduled-messages" element={<ScheduledMessagesPage />} />
            <Route path="/giveaways" element={<GiveawaysPage />} />
            <Route path="/music" element={<MusicPage />} />
            <Route path="/audit-log" element={<AuditLogPage />} />
            <Route path="/command-log" element={<CommandLogPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/members" element={<MembersPage />} />
            <Route path="/youtube" element={<YoutubePage />} />
            <Route path="/ai-helper" element={<AiHelperPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
      <ToastContainer />
      <ModerationActionModal />
    </div>
  );
};

export default App;