import React, { useState, useEffect } from 'react';
import { useModal } from '../contexts/ModalContext';
import { useAuth } from '../contexts/AuthContext';
import { useServer } from '../contexts/ServerContext';
import { appwriteService } from '../services/appwrite';
import { useToast } from '../contexts/ToastContext';

const ModerationActionModal: React.FC = () => {
    const { isOpen, closeModal, targetUser, actionType } = useModal();
    const { user: initiator } = useAuth();
    const { selectedServer } = useServer();
    const { addToast } = useToast();

    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Reset state when modal opens
            setReason('');
            setIsSubmitting(false);
        }
    }, [isOpen]);

    if (!isOpen || !targetUser || !actionType) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedServer || !initiator) {
            addToast("Cannot perform action: missing context.", 'error');
            return;
        }
        setIsSubmitting(true);
        try {
            await appwriteService.createModerationAction({
                guildId: selectedServer.guildId,
                targetUserId: targetUser.id,
                targetUsername: targetUser.name,
                actionType: actionType,
                reason: reason,
                initiatorId: initiator.$id,
            });
            addToast(`Queued ${actionType} for ${targetUser.name}. Bot will execute shortly.`, 'success');
        } catch (error) {
            addToast(`Failed to queue ${actionType} action.`, 'error');
            console.error(error);
        } finally {
            closeModal();
        }
    };
    
    const actionColor = actionType === 'kick' ? 'text-yellow-400' : 'text-red-400';
    const actionButtonColor = actionType === 'kick' ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-red-600 hover:bg-red-700';

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={closeModal}>
            <div className="bg-surface rounded-lg shadow-xl w-full max-w-md p-6 m-4 space-y-4" onClick={e => e.stopPropagation()}>
                <h3 className={`text-xl font-bold capitalize ${actionColor}`}>{actionType} User</h3>
                <div className="flex items-center gap-3 bg-secondary p-3 rounded-md">
                    <img src={targetUser.avatar || `https://ui-avatars.com/api/?name=${targetUser.name.charAt(0)}`} alt={targetUser.name} className="w-10 h-10 rounded-full" />
                    <div>
                        <p className="font-bold">{targetUser.name}</p>
                        <p className="text-xs text-text-secondary font-mono">{targetUser.id}</p>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="reason" className="block text-sm font-medium text-text-secondary mb-1">
                            Reason (Optional, will be shown in Audit Log)
                        </label>
                        <input
                            type="text"
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full bg-background border border-gray-600 rounded-md p-2 focus:ring-primary focus:border-primary"
                            placeholder={`Reason for ${actionType}ing...`}
                        />
                    </div>
                    <div className="flex justify-end gap-4">
                        <button type="button" onClick={closeModal} className="text-text-secondary hover:text-text-primary px-4 py-2 rounded-md">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`text-white font-bold py-2 px-6 rounded-md transition-colors disabled:opacity-50 ${actionButtonColor}`}
                        >
                            {isSubmitting ? 'Confirming...' : `Confirm ${actionType.charAt(0).toUpperCase() + actionType.slice(1)}`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ModerationActionModal;