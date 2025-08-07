import React, { useState, useEffect } from 'react';
import { appwriteService } from '../services/appwrite';
import { ServerSettings, AutoModSettings } from '../types';
import Spinner from '../components/Spinner';
import ToggleSwitch from '../components/ToggleSwitch';
import { useToast } from '../contexts/ToastContext';
import { useServer } from '../contexts/ServerContext';
import InfoTooltip from '../components/InfoTooltip';

const AutoModPage: React.FC = () => {
  const { selectedServer } = useServer();
  const [settings, setSettings] = useState<ServerSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();
  const [wordBlacklist, setWordBlacklist] = useState('');

  useEffect(() => {
    if (!selectedServer) {
      setLoading(false);
      return;
    }
    const loadData = async () => {
      setLoading(true);
      try {
        const settingsData = await appwriteService.getSettings(selectedServer.guildId);
        setSettings(settingsData);
        if (Array.isArray(settingsData.autoMod.wordBlacklist)) {
            setWordBlacklist(settingsData.autoMod.wordBlacklist.join(', '));
        }
      } catch (error) {
        addToast("Failed to load auto-mod settings.", 'error');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedServer, addToast]);

  const handleAutoModChange = (key: keyof AutoModSettings, value: any) => {
    if (!settings) return;
    setSettings(prev => {
        if (!prev) return null;
        const isNumeric = typeof prev.autoMod[key] === 'number';
        return {
            ...prev,
            autoMod: {
                ...prev.autoMod,
                [key]: isNumeric ? parseInt(value, 10) || 0 : value
            }
        };
    });
  };
  
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
        const blacklistArray = wordBlacklist.split(',').map(word => word.trim()).filter(Boolean);
        const updatedSettings = {
            ...settings,
            autoMod: {
                ...settings.autoMod,
                wordBlacklist: blacklistArray,
            }
        };
      await appwriteService.updateSettings(updatedSettings);
      setSettings(updatedSettings); // Update local state to match saved state
      addToast('Auto-Mod settings saved! The bot will apply them shortly.', 'success');
    } catch (error) {
      console.error("Failed to save auto-mod settings:", error);
      addToast('Failed to save settings. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;
  if (!selectedServer) return <div className="text-center text-text-secondary">Please select a server to manage auto-moderation.</div>;
  if (!settings) return <div>Failed to load settings.</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-text-primary">Auto Moderation</h2>
        <p className="text-text-secondary mt-2">Configure automated filters to keep your community clean.</p>
      </div>
      <form onSubmit={handleSave} className="bg-surface rounded-lg shadow-lg">
        <div className="p-8 space-y-8">
            {/* AI Moderation */}
            <div className="border-b border-gray-700/50 pb-8">
                <h3 className="text-xl font-semibold text-text-primary mb-1">Gemini AI Moderation</h3>
                <p className="text-text-secondary mb-4">Uses AI to detect toxicity, spam, and harmful content. Requires a Gemini API Key to be set up for the bot.</p>
                <div className="flex items-center justify-between">
                    <label className="font-medium text-text-primary">Enable AI-Powered Content Analysis</label>
                    <ToggleSwitch enabled={settings.autoMod.aiEnabled} onChange={(val) => handleAutoModChange('aiEnabled', val)} />
                </div>
            </div>

            {/* Word Filter */}
            <div className="border-b border-gray-700/50 pb-8">
                <h3 className="text-xl font-semibold text-text-primary mb-1">Banned Words Filter</h3>
                <p className="text-text-secondary mb-4">Automatically delete messages containing specific words.</p>
                <div className="flex items-center justify-between mb-4">
                    <label className="font-medium text-text-primary">Enable Word Filter</label>
                    <ToggleSwitch enabled={settings.autoMod.wordFilterEnabled} onChange={(val) => handleAutoModChange('wordFilterEnabled', val)} />
                </div>
                {settings.autoMod.wordFilterEnabled && (
                    <div>
                        <label htmlFor="wordBlacklist" className="block text-sm font-medium text-text-secondary mb-1">Banned Words (comma-separated)</label>
                        <textarea
                            id="wordBlacklist"
                            rows={4}
                            value={wordBlacklist}
                            onChange={(e) => setWordBlacklist(e.target.value)}
                            placeholder="e.g., badword1, anotherword, spam"
                            className="w-full bg-background border border-gray-600 rounded-md p-2 focus:ring-primary focus:border-primary"
                        ></textarea>
                    </div>
                )}
            </div>
            
            {/* Link & Invite Filter */}
             <div className="border-b border-gray-700/50 pb-8">
                <h3 className="text-xl font-semibold text-text-primary mb-1">Link & Invite Filter</h3>
                 <p className="text-text-secondary mb-4">Control the sharing of external links and Discord server invites.</p>
                <div className="flex items-center justify-between mb-4">
                    <label className="font-medium text-text-primary">Block All Links</label>
                    <ToggleSwitch enabled={settings.autoMod.linkFilterEnabled} onChange={(val) => handleAutoModChange('linkFilterEnabled', val)} />
                </div>
                 <div className="flex items-center justify-between">
                    <label className="font-medium text-text-primary">Block Discord Invites</label>
                    <ToggleSwitch enabled={settings.autoMod.inviteFilterEnabled} onChange={(val) => handleAutoModChange('inviteFilterEnabled', val)} />
                </div>
            </div>

            {/* Mention Spam Filter */}
             <div>
                <h3 className="text-xl font-semibold text-text-primary mb-1">Mention Spam</h3>
                <p className="text-text-secondary mb-4">Prevent users from spamming mentions in a single message.</p>
                <div className="flex items-center justify-between mb-4">
                    <label className="font-medium text-text-primary">Enable Mention Spam Filter</label>
                    <ToggleSwitch enabled={settings.autoMod.mentionSpamEnabled} onChange={(val) => handleAutoModChange('mentionSpamEnabled', val)} />
                </div>
                {settings.autoMod.mentionSpamEnabled && (
                    <div>
                        <label htmlFor="mentionSpamLimit" className="block text-sm font-medium text-text-secondary mb-1">Maximum Unique Mentions per Message <InfoTooltip text="Deletes messages that contain more than this number of unique user or role mentions."/></label>
                        <input
                            type="number"
                            name="mentionSpamLimit"
                            id="mentionSpamLimit"
                            value={settings.autoMod.mentionSpamLimit}
                            onChange={(e) => handleAutoModChange('mentionSpamLimit', e.target.value)}
                            className="w-full bg-background border border-gray-600 rounded-md p-2"
                        />
                    </div>
                )}
            </div>

        </div>
        <div className="flex justify-end items-center gap-4 px-8 py-4 bg-secondary/30 rounded-b-lg border-t border-gray-700">
          <button type="submit" disabled={saving || loading} className="bg-primary text-white font-bold py-2 px-6 rounded-md hover:bg-opacity-80 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AutoModPage;