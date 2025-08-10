
import React, { useState, useEffect } from "react";
import { appwriteService } from "../services/appwrite";
import {
  ServerSettings,
  RoleReward,
  ServerMetadata,
  DiscordRole,
  DiscordChannel,
  WelcomeSettings,
  GoodbyeSettings,
  AutoRoleSettings,
  LevelingSettings,
} from "../types";
import Spinner from "../components/Spinner";
import ToggleSwitch from "../components/ToggleSwitch";
import { useToast } from "../contexts/ToastContext";
import { useServer } from "../contexts/ServerContext";

type Tab = "general" | "roles" | "leveling";
type SettingsCategory = "welcome" | "goodbye" | "autoRole" | "leveling";

const SettingsPage: React.FC = () => {
  const { selectedServer } = useServer();
  const [settings, setSettings] = useState<ServerSettings | null>(null);
  const [metadata, setMetadata] = useState<ServerMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [newReward, setNewReward] = useState({ level: "", roleId: "" });

  useEffect(() => {
    if (!selectedServer) {
      setLoading(false);
      return;
    }
    const loadData = async () => {
      setLoading(true);
      try {
        const [settingsData, metadataData] = await Promise.all([
          appwriteService.getSettings(selectedServer.guildId),
          appwriteService.getServerMetadata(selectedServer.guildId),
        ]);
        setSettings(settingsData);
        setMetadata(metadataData);
      } catch (error) {
        console.error(`[SettingsPage] Failed to load data for guild ${selectedServer.guildId}:`, error);
        addToast("Failed to load server data. Please try again.", "error");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedServer, addToast]);

  const handleNestedChange = <C extends SettingsCategory>(
    category: C,
    key: keyof ServerSettings[C],
    value: any
  ) => {
    if (!settings) return;
    setSettings((prev) => {
      if (!prev) return null;

      const categoryObject = prev[category];
      const isNumeric = typeof categoryObject[key] === "number";

      return {
        ...prev,
        [category]: {
          ...categoryObject,
          [key]: isNumeric ? parseInt(value, 10) || 0 : value,
        },
      };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      await appwriteService.updateSettings(settings);
      addToast(
        "Settings saved! The bot will apply them within 1 minute.",
        "success"
      );
    } catch (error) {
      console.error(`[SettingsPage] Failed to save settings for guild ${settings.guildId}:`, error);
      addToast("Failed to save settings. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAddReward = () => {
    if (!settings || !newReward.level || !newReward.roleId) {
      addToast("Please select both a Level and a Role.", "error");
      return;
    }
    const newLevel = parseInt(newReward.level, 10);
    if (isNaN(newLevel) || newLevel <= 0) {
        addToast("Please enter a valid, positive level number.", "error");
        return;
    }
    const levelExists = settings.leveling.roleRewards.some(reward => reward.level === newLevel);
    if (levelExists) {
        addToast("A reward for this level already exists. Please remove the old one first.", "error");
        return;
    }

    const rewards = settings.leveling.roleRewards;
    const updatedRewards = [
      ...rewards,
      { level: newLevel, roleId: newReward.roleId },
    ];
    updatedRewards.sort((a, b) => a.level - b.level);
    handleNestedChange("leveling", "roleRewards", updatedRewards);
    setNewReward({ level: "", roleId: "" });
  };

  const handleDeleteReward = (levelToDelete: number) => {
    if (!settings) return;
    const rewards = settings.leveling.roleRewards;
    const updatedRewards = rewards.filter((r) => r.level !== levelToDelete);
    handleNestedChange("leveling", "roleRewards", updatedRewards);
  };

  if (loading) return <Spinner />;
  if (!selectedServer)
    return (
      <div className="text-center text-text-secondary">
        Please select a server to manage its settings.
      </div>
    );
  if (!settings)
    return <div>Failed to load settings for {selectedServer.name}.</div>;

  const sortedChannels =
    metadata?.channels?.slice().sort((a, b) => a.name.localeCompare(b.name)) ||
    [];
  const sortedRoles =
    metadata?.roles?.slice().sort((a, b) => a.name.localeCompare(b.name)) || [];

  const renderContent = () => {
    switch (activeTab) {
      case "general":
        return (
          <div className="space-y-8">
            <div className="border-b border-gray-700/50 pb-8">
              <h3 className="text-xl font-semibold text-text-primary mb-1">
                Welcome Messages
              </h3>
              <p className="text-text-secondary mb-4">
                Greet new members when they join the server.
              </p>
              <div className="flex items-center justify-between mb-4">
                <label className="font-medium text-text-primary">
                  Enable Welcome Messages
                </label>
                <ToggleSwitch
                  enabled={settings.welcome.enabled}
                  onChange={(val) =>
                    handleNestedChange("welcome", "enabled", val)
                  }
                />
              </div>
              {settings.welcome.enabled && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Welcome Channel
                    </label>
                    <select
                      name="channelId"
                      value={settings.welcome.channelId}
                      onChange={(e) =>
                        handleNestedChange(
                          "welcome",
                          "channelId",
                          e.target.value
                        )
                      }
                      className="w-full bg-background border border-gray-600 rounded-md p-2 focus:ring-primary focus:border-primary"
                    >
                      <option value="">Select a channel</option>
                      {sortedChannels.map((c) => (
                        <option key={c.id} value={c.id}>
                          #{c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Welcome Message
                    </label>
                    <textarea
                      name="message"
                      value={settings.welcome.message}
                      onChange={(e) =>
                        handleNestedChange("welcome", "message", e.target.value)
                      }
                      rows={3}
                      className="w-full bg-background border border-gray-600 rounded-md p-2 focus:ring-primary focus:border-primary"
                    ></textarea>
                    <p className="text-xs text-text-secondary mt-1">
                      Use `{"`{user}`"}` as a placeholder for the username.
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-text-primary mb-1">
                Goodbye Messages
              </h3>
              <p className="text-text-secondary mb-4">
                Announce when a member leaves the server.
              </p>
              <div className="flex items-center justify-between mb-4">
                <label className="font-medium text-text-primary">
                  Enable Goodbye Messages
                </label>
                <ToggleSwitch
                  enabled={settings.goodbye.enabled}
                  onChange={(val) =>
                    handleNestedChange("goodbye", "enabled", val)
                  }
                />
              </div>
              {settings.goodbye.enabled && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Goodbye Channel
                    </label>
                    <select
                      name="channelId"
                      value={settings.goodbye.channelId}
                      onChange={(e) =>
                        handleNestedChange(
                          "goodbye",
                          "channelId",
                          e.target.value
                        )
                      }
                      className="w-full bg-background border border-gray-600 rounded-md p-2 focus:ring-primary focus:border-primary"
                    >
                      <option value="">Select a channel</option>
                      {sortedChannels.map((c) => (
                        <option key={c.id} value={c.id}>
                          #{c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Goodbye Message
                    </label>
                    <textarea
                      name="message"
                      value={settings.goodbye.message}
                      onChange={(e) =>
                        handleNestedChange("goodbye", "message", e.target.value)
                      }
                      rows={3}
                      className="w-full bg-background border border-gray-600 rounded-md p-2 focus:ring-primary focus:border-primary"
                    ></textarea>
                    <p className="text-xs text-text-secondary mt-1">
                      Use `{"`{user}`"}` as a placeholder for the username.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case "roles":
        return (
          <div>
            <div>
              <h3 className="text-xl font-semibold text-text-primary mb-1">
                Auto Role
              </h3>
              <p className="text-text-secondary mb-4">
                Automatically assign a role to new members.
              </p>
              <div className="flex items-center justify-between mb-4">
                <label className="font-medium text-text-primary">
                  Enable Auto Role
                </label>
                <ToggleSwitch
                  enabled={settings.autoRole.enabled}
                  onChange={(val) =>
                    handleNestedChange("autoRole", "enabled", val)
                  }
                />
              </div>
              {settings.autoRole.enabled && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Member Role
                  </label>
                  <select
                    name="roleId"
                    value={settings.autoRole.roleId}
                    onChange={(e) =>
                      handleNestedChange("autoRole", "roleId", e.target.value)
                    }
                    className="w-full bg-background border border-gray-600 rounded-md p-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="">Select a role</option>
                    {sortedRoles.map((r) => (
                      <option key={r.id} value={r.id}>
                        @{r.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        );
      case "leveling":
        return (
          <div className="space-y-8">
            <div className="border-b border-gray-700/50 pb-8">
              <h3 className="text-xl font-semibold text-text-primary mb-1">
                Leveling System
              </h3>
              <p className="text-text-secondary mb-4">
                Reward active members with XP and levels for chatting.
              </p>
              <div className="flex items-center justify-between mb-4">
                <label className="font-medium text-text-primary">
                  Enable Leveling System
                </label>
                <ToggleSwitch
                  enabled={settings.leveling.enabled}
                  onChange={(val) =>
                    handleNestedChange("leveling", "enabled", val)
                  }
                />
              </div>
              {settings.leveling.enabled && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Level-up Announcement Channel (Optional)
                    </label>
                    <select
                      name="channelId"
                      value={settings.leveling.channelId}
                      onChange={(e) =>
                        handleNestedChange(
                          "leveling",
                          "channelId",
                          e.target.value
                        )
                      }
                      className="w-full bg-background border border-gray-600 rounded-md p-2 focus:ring-primary focus:border-primary"
                    >
                      <option value="">Disable announcements</option>
                      {sortedChannels.map((c) => (
                        <option key={c.id} value={c.id}>
                          #{c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Level-up Message
                    </label>
                    <textarea
                      name="message"
                      value={settings.leveling.message}
                      onChange={(e) =>
                        handleNestedChange(
                          "leveling",
                          "message",
                          e.target.value
                        )
                      }
                      rows={3}
                      className="w-full bg-background border border-gray-600 rounded-md p-2 focus:ring-primary focus:border-primary"
                    ></textarea>
                    <p className="text-xs text-text-secondary mt-1">
                      Use `{"`{user}`"}` for username and `{"`{level}`"}` for
                      the new level.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Min XP / Message
                      </label>
                      <input
                        type="number"
                        name="xpPerMessageMin"
                        value={settings.leveling.xpPerMessageMin}
                        onChange={(e) =>
                          handleNestedChange(
                            "leveling",
                            "xpPerMessageMin",
                            e.target.value
                          )
                        }
                        className="w-full bg-background border border-gray-600 rounded-md p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Max XP / Message
                      </label>
                      <input
                        type="number"
                        name="xpPerMessageMax"
                        value={settings.leveling.xpPerMessageMax}
                        onChange={(e) =>
                          handleNestedChange(
                            "leveling",
                            "xpPerMessageMax",
                            e.target.value
                          )
                        }
                        className="w-full bg-background border border-gray-600 rounded-md p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        XP Cooldown (sec)
                      </label>
                      <input
                        type="number"
                        name="cooldownSeconds"
                        value={settings.leveling.cooldownSeconds}
                        onChange={(e) =>
                          handleNestedChange(
                            "leveling",
                            "cooldownSeconds",
                            e.target.value
                          )
                        }
                        className="w-full bg-background border border-gray-600 rounded-md p-2"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">
                      Blacklisted Channels (No XP)
                    </label>
                    <select
                      multiple
                      name="blacklistedChannels"
                      value={settings.leveling.blacklistedChannels}
                      onChange={(e) =>
                        handleNestedChange(
                          "leveling",
                          "blacklistedChannels",
                          Array.from(
                            e.target.selectedOptions,
                            (option) => option.value
                          )
                        )
                      }
                      className="w-full h-32 bg-background border border-gray-600 rounded-md p-2 focus:ring-primary focus:border-primary"
                    >
                      {sortedChannels.map((c) => (
                        <option key={c.id} value={c.id}>
                          #{c.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-text-secondary mt-1">
                      Hold Ctrl/Cmd to select multiple channels.
                    </p>
                  </div>
                </div>
              )}
            </div>
            {settings.leveling.enabled && (
              <div>
                <h3 className="text-xl font-semibold text-text-primary mb-1">
                  Role Rewards
                </h3>
                <p className="text-text-secondary mb-4">
                  Automatically grant roles to members when they reach a certain
                  level.
                </p>
                <div className="space-y-2 mb-4">
                  {settings.leveling.roleRewards.length > 0 ? (
                    settings.leveling.roleRewards
                      .slice()
                      .sort((a, b) => a.level - b.level)
                      .map((reward) => {
                      const role = metadata?.roles.find(
                        (r) => r.id === reward.roleId
                      );
                      return (
                        <div
                          key={reward.level}
                          className="flex items-center justify-between bg-secondary p-2 rounded-md"
                        >
                          <p>
                            Level{" "}
                            <span className="font-bold text-accent">
                              {reward.level}
                            </span>{" "}
                            →{" "}
                            <span
                              className="font-medium"
                              style={{
                                color: role
                                  ? `#${role.color
                                      .toString(16)
                                      .padStart(6, "0")}`
                                  : "inherit",
                              }}
                            >
                              @{role?.name || "Unknown Role"}
                            </span>
                          </p>
                          <button
                            type="button"
                            onClick={() => handleDeleteReward(reward.level)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-text-secondary">
                      No role rewards configured.
                    </p>
                  )}
                </div>
                <div className="flex items-end gap-2 p-3 bg-secondary/50 rounded-md">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-text-secondary mb-1">
                      Required Level
                    </label>
                    <input
                      type="number"
                      placeholder="e.g., 10"
                      value={newReward.level}
                      onChange={(e) =>
                        setNewReward({ ...newReward, level: e.target.value })
                      }
                      className="w-full bg-background border border-gray-600 rounded-md p-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-text-secondary mb-1">
                      Role to Grant
                    </label>
                    <select
                      value={newReward.roleId}
                      onChange={(e) =>
                        setNewReward({ ...newReward, roleId: e.target.value })
                      }
                      className="w-full bg-background border border-gray-600 rounded-md p-2 focus:ring-primary focus:border-primary"
                    >
                      <option value="">Select a role</option>
                      {sortedRoles.map((r) => (
                        <option key={r.id} value={r.id}>
                          @{r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddReward}
                    className="bg-primary text-white font-bold py-2 px-4 rounded-md hover:bg-opacity-80 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const TabButton = ({
    tab,
    children,
  }: {
    tab: Tab;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={() => setActiveTab(tab)}
      className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 focus:outline-none ${
        activeTab === tab
          ? "border-primary text-primary"
          : "border-transparent text-text-secondary hover:text-text-primary hover:border-gray-500"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSave} className="bg-surface rounded-lg shadow-lg">
        <div className="px-8 border-b border-gray-700">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            <TabButton tab="general">General</TabButton>
            <TabButton tab="roles">Roles</TabButton>
            <TabButton tab="leveling">Leveling</TabButton>
          </nav>
        </div>
        <div className="p-8 min-h-[420px]">{renderContent()}</div>
        <div className="flex justify-end items-center gap-4 px-8 py-4 bg-secondary/30 rounded-b-lg border-t border-gray-700">
          <button
            type="submit"
            disabled={saving || loading}
            className="bg-primary text-white font-bold py-2 px-6 rounded-md hover:bg-opacity-80 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;