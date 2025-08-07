import React, { useState, useEffect, useCallback } from "react";
import { appwriteService } from "../services/appwrite";
import { YoutubeSubscription, ServerMetadata } from "../types";
import Spinner from "../components/Spinner";
import { useToast } from "../contexts/ToastContext";
import InfoTooltip from "../components/InfoTooltip";
import { useServer } from "../contexts/ServerContext";

const YoutubePage: React.FC = () => {
  const { selectedServer } = useServer();
  const [subscriptions, setSubscriptions] = useState<YoutubeSubscription[]>([]);
  const [metadata, setMetadata] = useState<ServerMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<YoutubeSubscription | null>(
    null
  );
  const [currentSub, setCurrentSub] = useState<Partial<YoutubeSubscription>>(
    {}
  );
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  const fetchData = useCallback(
    async (guildId: string) => {
      setLoading(true);
      try {
        const [data, meta] = await Promise.all([
          appwriteService.getYoutubeSubscriptions(guildId),
          appwriteService.getServerMetadata(guildId),
        ]);
        setSubscriptions(data);
        setMetadata(meta);
      } catch (error) {
        console.error("Failed to fetch YouTube page data", error);
        addToast("Could not fetch page data.", "error");
      } finally {
        setLoading(false);
      }
    },
    [addToast]
  );

  useEffect(() => {
    if (selectedServer) {
      fetchData(selectedServer.guildId);
    } else {
      setSubscriptions([]);
      setMetadata(null);
      setLoading(false);
    }
  }, [selectedServer, fetchData]);

  const defaultCustomMessage =
    "📢 Hey @everyone! {channelName} just uploaded a new video!\n\n**{videoTitle}**\n{videoUrl}";
  const defaultLiveMessage =
    "🔴 Hey @everyone! {channelName} is now LIVE!\n\n**{videoTitle}**\n{videoUrl}";

  const openModalForNew = () => {
    setEditingSub(null);
    setCurrentSub({
      youtubeChannelId: "",
      discordChannelId: "",
      mentionRoleId: "",
      customMessage: defaultCustomMessage,
      liveMessage: defaultLiveMessage,
    });
    setIsModalOpen(true);
  };

  const openModalForEdit = (sub: YoutubeSubscription) => {
    setEditingSub(sub);
    setCurrentSub({ ...sub });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSub(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setCurrentSub((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServer) {
      addToast("Please select a server first.", "error");
      return;
    }
    if (!currentSub.youtubeChannelId || !currentSub.discordChannelId) {
      addToast(
        "YouTube Channel ID and an Announcement Channel are required.",
        "error"
      );
      return;
    }
    setSaving(true);
    try {
      if (editingSub) {
        await appwriteService.updateYoutubeSubscription({
          ...editingSub,
          ...currentSub,
        } as YoutubeSubscription);
        addToast("Subscription updated successfully!", "success");
      } else {
        const newSub: Omit<YoutubeSubscription, "id"> = {
          guildId: selectedServer.guildId,
          youtubeChannelId: currentSub.youtubeChannelId!,
          discordChannelId: currentSub.discordChannelId!,
          mentionRoleId: currentSub.mentionRoleId || "",
          customMessage: currentSub.customMessage || defaultCustomMessage,
          liveMessage: currentSub.liveMessage || defaultLiveMessage,
        };
        await appwriteService.createYoutubeSubscription(newSub);
        addToast(
          "Subscription created! The bot will start monitoring.",
          "success"
        );
      }
      fetchData(selectedServer.guildId);
      closeModal();
    } catch (error) {
      addToast("Failed to save subscription.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (subId: string) => {
    if (!selectedServer) return;
    if (window.confirm("Are you sure you want to delete this subscription?")) {
      try {
        await appwriteService.deleteYoutubeSubscription(subId);
        addToast("Subscription deleted.", "success");
        fetchData(selectedServer.guildId);
      } catch (error) {
        addToast("Failed to delete subscription.", "error");
      }
    }
  };

  if (loading) return <Spinner />;

  if (!selectedServer) {
    return (
      <div className="text-center text-text-secondary">
        Please select a server to manage YouTube notifications.
      </div>
    );
  }

  const sortedChannels =
    metadata?.channels?.slice().sort((a, b) => a.name.localeCompare(b.name)) ||
    [];
  const sortedRoles =
    metadata?.roles?.slice().sort((a, b) => a.name.localeCompare(b.name)) || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">YouTube Notifications</h2>
          <p className="text-text-secondary">
            Manage video upload announcements for {selectedServer.name}.
          </p>
        </div>
        <button
          onClick={openModalForNew}
          className="bg-primary text-white font-bold py-2 px-4 rounded-md hover:bg-opacity-80 transition-colors"
        >
          + Add Subscription
        </button>
      </div>

      <div className="bg-surface p-4 rounded-lg shadow-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="border-b border-gray-700">
              <tr>
                <th className="p-4 text-sm font-semibold text-text-secondary">
                  YouTube Channel
                </th>
                <th className="p-4 text-sm font-semibold text-text-secondary">
                  Post to Discord Channel
                </th>
                <th className="p-4 text-sm font-semibold text-text-secondary">
                  Last Video Found
                </th>
                <th className="p-4 text-sm font-semibold text-text-secondary text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.length > 0 ? (
                subscriptions.map((sub) => (
                  <tr
                    key={sub.id}
                    className="border-b border-gray-800 hover:bg-background"
                  >
                    <td className="p-4 align-top">
                      <div className="font-medium text-text-primary">
                        {sub.youtubeChannelName || "(Name pending...)"}
                      </div>
                      <div className="font-mono text-xs text-text-secondary">
                        {sub.youtubeChannelId}
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="font-medium text-text-primary">
                        {sub.discordChannelName
                          ? `#${sub.discordChannelName}`
                          : "(Name pending...)"}
                      </div>
                      <div className="font-mono text-xs text-text-secondary">
                        {sub.discordChannelId}
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      {sub.latestVideoId ? (
                        <>
                          <a
                            href={`https://www.youtube.com/watch?v=${sub.latestVideoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-accent hover:underline break-words"
                          >
                            {sub.latestVideoTitle || sub.latestVideoId}
                          </a>
                          <div className="text-xs text-text-secondary mt-1 whitespace-nowrap">
                            {sub.lastVideoTimestamp
                              ? `Found on ${new Date(
                                  sub.lastVideoTimestamp
                                ).toLocaleDateString()}`
                              : ""}
                          </div>
                        </>
                      ) : (
                        <span className="text-text-secondary">N/A</span>
                      )}
                    </td>
                    <td className="p-4 align-top text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => openModalForEdit(sub)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(sub.id!)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center p-8 text-text-secondary"
                  >
                    No YouTube subscriptions created for {selectedServer.name}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-40"
          onClick={closeModal}
        >
          <div
            className="bg-surface rounded-lg shadow-xl w-full max-w-lg p-8 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold">
              {editingSub ? "Edit Subscription" : "New Subscription"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="youtubeChannelId"
                  className="block text-sm font-medium text-text-secondary mb-1"
                >
                  YouTube Channel ID{" "}
                  <InfoTooltip text="Find this in the channel's URL, it starts with 'UC'." />
                </label>
                <input
                  type="text"
                  name="youtubeChannelId"
                  id="youtubeChannelId"
                  value={currentSub.youtubeChannelId}
                  onChange={handleInputChange}
                  className="w-full bg-background border border-gray-600 rounded-md p-2 focus:ring-primary focus:border-primary"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="discordChannelId"
                  className="block text-sm font-medium text-text-secondary mb-1"
                >
                  Discord Announcement Channel
                </label>
                <select
                  name="discordChannelId"
                  id="discordChannelId"
                  value={currentSub.discordChannelId}
                  onChange={handleInputChange}
                  className="w-full bg-background border border-gray-600 rounded-md p-2 focus:ring-primary focus:border-primary"
                  required
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
                <label
                  htmlFor="mentionRoleId"
                  className="block text-sm font-medium text-text-secondary mb-1"
                >
                  Mention Role (Optional)
                </label>
                <select
                  name="mentionRoleId"
                  id="mentionRoleId"
                  value={currentSub.mentionRoleId}
                  onChange={handleInputChange}
                  className="w-full bg-background border border-gray-600 rounded-md p-2 focus:ring-primary focus:border-primary"
                >
                  <option value="">Don't mention a role</option>
                  {sortedRoles.map((r) => (
                    <option key={r.id} value={r.id}>
                      @{r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="customMessage"
                  className="block text-sm font-medium text-text-secondary mb-1"
                >
                  Custom Upload Message (Optional)
                </label>
                <textarea
                  name="customMessage"
                  id="customMessage"
                  rows={5}
                  value={currentSub.customMessage}
                  onChange={handleInputChange}
                  className="w-full bg-background border border-gray-600 rounded-md p-2 focus:ring-primary focus:border-primary"
                />
                <p className="text-xs text-text-secondary mt-1">
                  Placeholders: `{"`{channelName}`"}`, `{"`{videoTitle}`"}`, `
                  {"`{videoUrl}`"}`
                </p>
              </div>
              <div>
                <label
                  htmlFor="liveMessage"
                  className="block text-sm font-medium text-text-secondary mb-1"
                >
                  Custom Live Stream Message (Optional)
                </label>
                <textarea
                  name="liveMessage"
                  id="liveMessage"
                  rows={5}
                  value={currentSub.liveMessage}
                  onChange={handleInputChange}
                  className="w-full bg-background border border-gray-600 rounded-md p-2 focus:ring-primary focus:border-primary"
                />
                <p className="text-xs text-text-secondary mt-1">
                  Used when a live stream is detected. Placeholders: `
                  {"`{channelName}`"}`, `{"`{videoTitle}`"}`, `{"`{videoUrl}`"}`
                </p>
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="text-text-secondary hover:text-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-primary text-white font-bold py-2 px-6 rounded-md hover:bg-opacity-80 transition-colors disabled:bg-gray-500"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default YoutubePage;
