
import React, { useEffect, useState } from 'react';

interface ToastProps {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: (id: number) => void;
}

const ICONS = {
    success: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    error: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    info: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
};

const BG_COLORS = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
};

const Toast: React.FC<ToastProps> = ({ id, message, type, onClose }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setVisible(true); // Animate in
        const timer = setTimeout(() => {
            handleClose();
        }, 5000); // Auto-close after 5 seconds

        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setVisible(false); // Animate out
        setTimeout(() => onClose(id), 300); // Remove from DOM after animation
    };

    return (
        <div className={`flex items-center p-4 rounded-lg shadow-lg text-white ${BG_COLORS[type]} transition-all duration-300 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}`}>
            <div className="flex-shrink-0">{ICONS[type]}</div>
            <div className="ml-3 text-sm font-medium">{message}</div>
            <button onClick={handleClose} className="ml-auto -mx-1.5 -my-1.5 p-1.5 rounded-md inline-flex items-center justify-center hover:bg-white/20 focus:outline-none">
                <span className="sr-only">Close</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
        </div>
    );
};

export default Toast;
