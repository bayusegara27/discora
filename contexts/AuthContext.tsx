import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { appwriteService } from '../services/appwrite';
import type { Models } from 'appwrite';

interface AuthContextType {
  user: Models.User<Models.Preferences> | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  authError: string | null;
  setAuthError: (error: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);

    useEffect(() => {
        const checkUser = async () => {
            try {
                const currentUser = await appwriteService.getCurrentAccount();
                setUser(currentUser);
            } catch (e) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkUser();
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        setAuthError(null);
        try {
            const loggedInUser = await appwriteService.login(email, password);
            setUser(loggedInUser);
        } catch (e: any) {
            console.error(e);
            setAuthError(e.message || 'Failed to log in.');
            throw e;
        }
    }, []);

    const register = useCallback(async (name: string, email: string, password: string) => {
        setAuthError(null);
        try {
            const newUser = await appwriteService.register(name, email, password);
            setUser(newUser);
        } catch (e: any) {
            console.error(e);
            setAuthError(e.message || 'Failed to register.');
            throw e;
        }
    }, []);

    const logout = useCallback(async () => {
        setAuthError(null);
        try {
            await appwriteService.logout();
            setUser(null);
        } catch (e: any) {
            console.error(e);
            setAuthError(e.message || 'Failed to log out.');
            throw e;
        }
    }, []);

    const value = { user, login, register, logout, loading, authError, setAuthError };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};