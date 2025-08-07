import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

type ActionType = 'kick' | 'ban';
type TargetUser = { id: string; name: string; avatar: string; };

interface ModalContextType {
  isOpen: boolean;
  openModal: (user: TargetUser, action: ActionType) => void;
  closeModal: () => void;
  targetUser: TargetUser | null;
  actionType: ActionType | null;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

interface ModalProviderProps {
    children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<TargetUser | null>(null);
  const [actionType, setActionType] = useState<ActionType | null>(null);

  const openModal = useCallback((user: TargetUser, action: ActionType) => {
    setTargetUser(user);
    setActionType(action);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    // Delay clearing to prevent content from disappearing during closing animation
    setTimeout(() => {
        setTargetUser(null);
        setActionType(null);
    }, 300);
  }, []);

  return (
    <ModalContext.Provider value={{ isOpen, openModal, closeModal, targetUser, actionType }}>
      {children}
    </ModalContext.Provider>
  );
};