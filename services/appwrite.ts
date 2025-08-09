
import {
    databases,
    account,
    ID,
    Query,
    SETTINGS_COLLECTION_ID,
    YOUTUBE_SUBSCRIPTIONS_COLLECTION_ID,
    AUDIT_LOGS_COLLECTION_ID,
    CUSTOM_COMMANDS_COLLECTION_ID,
    COMMAND_LOGS_COLLECTION_ID,
    STATS_COLLECTION_ID,
    SERVERS_COLLECTION_ID,
    USER_LEVELS_COLLECTION_ID,
    MODERATION_QUEUE_COLLECTION_ID,
    MEMBERS_COLLECTION_ID,
    SERVER_METADATA_COLLECTION_ID,
    REACTION_ROLES_COLLECTION_ID,
    SCHEDULED_MESSAGES_COLLECTION_ID,
    GIVEAWAYS_COLLECTION_ID,
    REACTION_ROLE_QUEUE_COLLECTION_ID,
    GIVEAWAY_QUEUE_COLLECTION_ID,
    APPWRITE_DATABASE_ID,
    BOT_INFO_COLLECTION_ID,
    SYSTEM_STATUS_COLLECTION_ID
} from './appwriteConfig';
import { Server, ServerSettings, YoutubeSubscription, LogEntry, ServerStats, CustomCommand, CommandLogEntry, BotInfo, SystemStatus, UserLevel, ModerationAction, GuildMember, ServerMetadata, ReactionRole, ScheduledMessage, Giveaway, WelcomeSettings, GoodbyeSettings, AutoRoleSettings, LevelingSettings, AutoModSettings } from '../types';
import type { Models } from 'appwrite';

function mapDoc<T>(doc: Models.Document): T {
    const { $id, $collectionId, $databaseId, $createdAt, $updatedAt, $permissions, ...data } = doc;
    return { id: $id, ...data } as T;
}

const defaultStats: Omit<ServerStats, 'id' | 'guildId' | 'doc_id'> = {
    memberCount: 0,
    onlineCount: 0,
    messagesToday: 0,
    commandCount: 0,
    totalWarnings: 0,
    roleDistribution: [],
    messagesWeekly: [],
};

const parseJsonField = (field: any, fallback: any) => {
    if (typeof field === 'string') {
        try {
            if (field.trim() === '') return fallback;
            const parsed = JSON.parse(field);
            return parsed;
        } catch {
            return fallback;
        }
    }
    return (typeof field === 'object' && field !== null) ? field : fallback;
}

const parseSettingsField = <T>(jsonString: string | undefined, defaultValue: T): T => {
    if (!jsonString) return defaultValue;
    try {
        return { ...defaultValue, ...JSON.parse(jsonString) };
    } catch {
        return defaultValue;
    }
};

const defaultWelcomeSettings: WelcomeSettings = { enabled: true, message: 'Welcome to the server, {user}! Enjoy your stay.', channelId: '' };
const defaultGoodbyeSettings: GoodbyeSettings = { enabled: false, message: '{user} has left the server.', channelId: '' };
const defaultAutoRoleSettings: AutoRoleSettings = { enabled: false, roleId: '' };
const defaultLevelingSettings: LevelingSettings = {
    enabled: true,
    channelId: '',
    message: '🎉 GG {user}, you just reached level **{level}**!',
    roleRewards: [],
    xpPerMessageMin: 15,
    xpPerMessageMax: 25,
    cooldownSeconds: 60,
    blacklistedChannels: [],
};
const defaultAutoModSettings: AutoModSettings = {
    aiEnabled: false,
    wordFilterEnabled: false,
    wordBlacklist: [],
    linkFilterEnabled: false,
    linkWhitelist: [],
    inviteFilterEnabled: false,
    mentionSpamEnabled: false,
    mentionSpamLimit: 5,
    ignoreAdmins: true,
};

const defaultFullSettings: Omit<ServerSettings, 'id' | 'guildId'> = {
    welcome: defaultWelcomeSettings,
    goodbye: defaultGoodbyeSettings,
    autoRole: defaultAutoRoleSettings,
    leveling: defaultLevelingSettings,
    autoMod: defaultAutoModSettings,
};


export const appwriteService = {
    // --- Authentication ---
    async login(email: string, password: string): Promise<Models.User<Models.Preferences>> {
        try {
            await account.createEmailPasswordSession(email, password);
            return await account.get();
        } catch (e) { console.error("[Appwrite] login :: error", e); throw e; }
    },

    async register(name: string, email: string, password: string): Promise<Models.User<Models.Preferences>> {
        try {
            await account.create(ID.unique(), email, password, name);
            return await this.login(email, password);
        } catch (e) { console.error("[Appwrite] register :: error", e); throw e; }
    },

    async logout(): Promise<void> {
        try {
            await account.deleteSession('current');
        } catch (e) { console.error("[Appwrite] logout :: error", e); throw e; }
    },

    async getCurrentAccount(): Promise<Models.User<Models.Preferences> | null> {
        try {
            return await account.get();
        } catch (e: any) {
            if (e.code !== 401) { console.error("[Appwrite] getCurrentAccount :: error", e); }
            return null;
        }
    },
    
    // --- Servers (Guilds) ---
    async getServers(): Promise<Server[]> {
      try {
        const response = await databases.listDocuments(APPWRITE_DATABASE_ID, SERVERS_COLLECTION_ID, [Query.limit(100)]);
        return response.documents.map(doc => mapDoc<Server>(doc));
      } catch (error) { console.error("[Appwrite] getServers :: error", error); return []; }
    },

    // --- Server Metadata (Channels & Roles) ---
    async getServerMetadata(guildId: string): Promise<ServerMetadata | null> {
        try {
            const response = await databases.listDocuments(APPWRITE_DATABASE_ID, SERVER_METADATA_COLLECTION_ID, [Query.equal("guildId", guildId)]);
            if (response.documents.length > 0) {
                const doc = response.documents[0] as any;
                const metadataDoc = mapDoc<ServerMetadata>(doc);
                
                const parsedData = parseJsonField(doc.data, { channels: [], roles: [] });

                metadataDoc.channels = parsedData.channels || [];
                metadataDoc.roles = parsedData.roles || [];
                
                return metadataDoc;
            }
            return null;
        } catch(e) { console.error(`[Appwrite] getServerMetadata for guild ${guildId} :: error`, e); return null; }
    },

    // --- Server Settings ---
    async getSettings(guildId: string): Promise<ServerSettings> {
        try {
            const response = await databases.listDocuments(APPWRITE_DATABASE_ID, SETTINGS_COLLECTION_ID, [Query.equal("guildId", guildId)]);
            if (response.documents.length > 0) {
                const doc = response.documents[0] as any;
                return {
                    id: doc.$id,
                    guildId: doc.guildId,
                    welcome: parseSettingsField(doc.welcomeSettings, defaultWelcomeSettings),
                    goodbye: parseSettingsField(doc.goodbyeSettings, defaultGoodbyeSettings),
                    autoRole: parseSettingsField(doc.autoRoleSettings, defaultAutoRoleSettings),
                    leveling: parseSettingsField(doc.levelingSettings, defaultLevelingSettings),
                    autoMod: parseSettingsField(doc.autoModSettings, defaultAutoModSettings),
                };
            } else {
                const newDocData = {
                    guildId: guildId,
                    welcomeSettings: JSON.stringify(defaultWelcomeSettings),
                    goodbyeSettings: JSON.stringify(defaultGoodbyeSettings),
                    autoRoleSettings: JSON.stringify(defaultAutoRoleSettings),
                    levelingSettings: JSON.stringify(defaultLevelingSettings),
                    autoModSettings: JSON.stringify(defaultAutoModSettings),
                };
                const newDoc = await databases.createDocument(APPWRITE_DATABASE_ID, SETTINGS_COLLECTION_ID, ID.unique(), newDocData);
                return { id: newDoc.$id, guildId, ...defaultFullSettings };
            }
        } catch (e) { console.error(`[Appwrite] getSettings for guild ${guildId} :: error`, e); throw e; }
    },

    async updateSettings(settings: ServerSettings): Promise<ServerSettings> {
        try {
            const { id, guildId, ...data } = settings;
            const dataToSave = {
                guildId,
                welcomeSettings: JSON.stringify(data.welcome),
                goodbyeSettings: JSON.stringify(data.goodbye),
                autoRoleSettings: JSON.stringify(data.autoRole),
                levelingSettings: JSON.stringify(data.leveling),
                autoModSettings: JSON.stringify(data.autoMod),
            };
            await databases.updateDocument(APPWRITE_DATABASE_ID, SETTINGS_COLLECTION_ID, id!, dataToSave);
            // Refetch to get freshly parsed data and confirm save
            return this.getSettings(guildId);
        } catch (e) { console.error(`[Appwrite] updateSettings for settings ${settings.id} :: error`, e); throw e; }
    },

    // --- YouTube Subscriptions ---
    async getYoutubeSubscriptions(guildId: string): Promise<YoutubeSubscription[]> {
        try {
            const response = await databases.listDocuments(APPWRITE_DATABASE_ID, YOUTUBE_SUBSCRIPTIONS_COLLECTION_ID, [Query.equal('guildId', guildId), Query.orderAsc('youtubeChannelName')]);
            return response.documents.map(doc => mapDoc<YoutubeSubscription>(doc));
        } catch (e) { console.error(`[Appwrite] getYoutubeSubscriptions for guild ${guildId} :: error`, e); return []; }
    },

    async createYoutubeSubscription(subscription: Omit<YoutubeSubscription, 'id'>): Promise<YoutubeSubscription> {
        try {
            const newDoc = await databases.createDocument(APPWRITE_DATABASE_ID, YOUTUBE_SUBSCRIPTIONS_COLLECTION_ID, ID.unique(), subscription);
            return mapDoc<YoutubeSubscription>(newDoc);
        } catch (e) { console.error("[Appwrite] createYoutubeSubscription :: error", e); throw e; }
    },

    async updateYoutubeSubscription(subscription: YoutubeSubscription): Promise<YoutubeSubscription> {
        try {
            const { id, ...data } = subscription;
            const updatedDoc = await databases.updateDocument(APPWRITE_DATABASE_ID, YOUTUBE_SUBSCRIPTIONS_COLLECTION_ID, id!, data);
            return mapDoc<YoutubeSubscription>(updatedDoc);
        } catch (e) { console.error(`[Appwrite] updateYoutubeSubscription for sub ${subscription.id} :: error`, e); throw e; }
    },
    
    async deleteYoutubeSubscription(subscriptionId: string): Promise<void> {
        try {
            await databases.deleteDocument(APPWRITE_DATABASE_ID, YOUTUBE_SUBSCRIPTIONS_COLLECTION_ID, subscriptionId);
        } catch (e) { console.error(`[Appwrite] deleteYoutubeSubscription for sub ${subscriptionId} :: error`, e); throw e; }
    },

    // --- Logs (Read-only from frontend) ---
    async getAuditLogs(guildId: string): Promise<LogEntry[]> {
        try {
            const response = await databases.listDocuments(APPWRITE_DATABASE_ID, AUDIT_LOGS_COLLECTION_ID, [Query.equal('guildId', guildId), Query.orderDesc('$createdAt'), Query.limit(100)]);
            return response.documents.map(doc => mapDoc<LogEntry>(doc));
        } catch (e) { console.error(`[Appwrite] getAuditLogs for guild ${guildId} :: error`, e); return []; }
    },

    async getCommandLogs(guildId: string): Promise<CommandLogEntry[]> {
        try {
            const response = await databases.listDocuments(APPWRITE_DATABASE_ID, COMMAND_LOGS_COLLECTION_ID, [Query.equal('guildId', guildId), Query.orderDesc('$createdAt'), Query.limit(100)]);
            return response.documents.map(doc => mapDoc<CommandLogEntry>(doc));
        } catch (e) { console.error(`[Appwrite] getCommandLogs for guild ${guildId} :: error`, e); return []; }
    },

    // --- Server Statistics ---
    async getServerStats(guildId: string): Promise<ServerStats> {
        try {
            const statsDocs = await databases.listDocuments(APPWRITE_DATABASE_ID, STATS_COLLECTION_ID, [
                Query.equal("guildId", guildId),
                Query.equal("doc_id", "main_stats")
            ]);
            if (statsDocs.documents.length > 0) {
                const doc = statsDocs.documents[0];
                const messagesWeekly = parseJsonField(doc.messagesWeekly, []);
                const roleDistribution = parseJsonField(doc.roleDistribution, []);
                return { ...mapDoc<ServerStats>(doc), messagesWeekly, roleDistribution };
            }
            const newStatsData = { 
                doc_id: "main_stats",
                guildId, 
                ...defaultStats, 
                messagesWeekly: JSON.stringify(defaultStats.messagesWeekly),
                roleDistribution: JSON.stringify(defaultStats.roleDistribution),
            };
            const newDoc = await databases.createDocument(APPWRITE_DATABASE_ID, STATS_COLLECTION_ID, ID.unique(), newStatsData);
            return mapDoc<ServerStats>(newDoc);

        } catch (e) {
            console.error(`[Appwrite] getServerStats for guild ${guildId} :: error`, e);
            return { guildId, doc_id: 'main_stats', ...defaultStats };
        }
    },

    // --- Custom Commands ---
    async getCustomCommands(guildId: string): Promise<CustomCommand[]> {
        try {
            const response = await databases.listDocuments(APPWRITE_DATABASE_ID, CUSTOM_COMMANDS_COLLECTION_ID, [Query.equal('guildId', guildId), Query.orderAsc('command')]);
            return response.documents.map(doc => mapDoc<CustomCommand>(doc));
        } catch (e) { console.error(`[Appwrite] getCustomCommands for guild ${guildId} :: error`, e); return []; }
    },

    async createCustomCommand(command: Omit<CustomCommand, 'id'>): Promise<CustomCommand> {
        try {
            const newDoc = await databases.createDocument(APPWRITE_DATABASE_ID, CUSTOM_COMMANDS_COLLECTION_ID, ID.unique(), command);
            return mapDoc<CustomCommand>(newDoc);
        } catch (e) { console.error("[Appwrite] createCustomCommand :: error", e); throw e; }
    },

    async updateCustomCommand(command: CustomCommand): Promise<CustomCommand> {
        try {
            const { id, ...data } = command;
            const updatedDoc = await databases.updateDocument(APPWRITE_DATABASE_ID, CUSTOM_COMMANDS_COLLECTION_ID, id!, data);
            return mapDoc<CustomCommand>(updatedDoc);
        } catch (e) { console.error(`[Appwrite] updateCustomCommand for command ${command.id} :: error`, e); throw e; }
    },

    async deleteCustomCommand(commandId: string): Promise<void> {
        try {
            await databases.deleteDocument(APPWRITE_DATABASE_ID, CUSTOM_COMMANDS_COLLECTION_ID, commandId);
        } catch (e) { console.error(`[Appwrite] deleteCustomCommand for command ${commandId} :: error`, e); throw e; }
    },
    
    // --- Reaction Roles ---
    async getReactionRoles(guildId: string): Promise<ReactionRole[]> {
        try {
            const response = await databases.listDocuments(APPWRITE_DATABASE_ID, REACTION_ROLES_COLLECTION_ID, [Query.equal('guildId', guildId)]);
            const roles = response.documents.map(doc => mapDoc<ReactionRole>(doc));
            roles.forEach(role => {
                role.roles = parseJsonField(role.roles, []);
            });
            return roles;
        } catch (e) { console.error(`[Appwrite] getReactionRoles for guild ${guildId} :: error`, e); return []; }
    },
    
    async createReactionRole(roleData: Omit<ReactionRole, 'id' | 'messageId'>): Promise<ReactionRole> {
        try {
            const dataToSave = { ...roleData, messageId: 'pending', roles: JSON.stringify(roleData.roles) };
            const newDoc = await databases.createDocument(APPWRITE_DATABASE_ID, REACTION_ROLES_COLLECTION_ID, ID.unique(), dataToSave);
            // Now add to the queue for the bot to process
            await databases.createDocument(APPWRITE_DATABASE_ID, REACTION_ROLE_QUEUE_COLLECTION_ID, ID.unique(), {
                guildId: newDoc.guildId,
                reactionRoleId: newDoc.$id,
            });
            return mapDoc<ReactionRole>(newDoc);
        } catch (e) { console.error("[Appwrite] createReactionRole :: error", e); throw e; }
    },

    async deleteReactionRole(id: string): Promise<void> {
        try {
            await databases.deleteDocument(APPWRITE_DATABASE_ID, REACTION_ROLES_COLLECTION_ID, id);
        } catch (e) { console.error(`[Appwrite] deleteReactionRole for ID ${id} :: error`, e); throw e; }
    },

    // --- Scheduled Messages ---
    async getScheduledMessages(guildId: string): Promise<ScheduledMessage[]> {
        try {
            const response = await databases.listDocuments(APPWRITE_DATABASE_ID, SCHEDULED_MESSAGES_COLLECTION_ID, [Query.equal('guildId', guildId), Query.orderDesc('nextRun')]);
            return response.documents.map(doc => mapDoc<ScheduledMessage>(doc));
        } catch (e) { console.error(`[Appwrite] getScheduledMessages for guild ${guildId} :: error`, e); return []; }
    },

    async createScheduledMessage(messageData: Omit<ScheduledMessage, 'id'>): Promise<ScheduledMessage> {
        try {
            const newDoc = await databases.createDocument(APPWRITE_DATABASE_ID, SCHEDULED_MESSAGES_COLLECTION_ID, ID.unique(), messageData);
            return mapDoc<ScheduledMessage>(newDoc);
        } catch (e) { console.error("[Appwrite] createScheduledMessage :: error", e); throw e; }
    },

    async updateScheduledMessage(messageData: ScheduledMessage): Promise<ScheduledMessage> {
        try {
            const { id, ...data } = messageData;
            const updatedDoc = await databases.updateDocument(APPWRITE_DATABASE_ID, SCHEDULED_MESSAGES_COLLECTION_ID, id!, data);
            return mapDoc<ScheduledMessage>(updatedDoc);
        } catch (e) { console.error(`[Appwrite] updateScheduledMessage for ID ${messageData.id} :: error`, e); throw e; }
    },

    async deleteScheduledMessage(id: string): Promise<void> {
        try {
            await databases.deleteDocument(APPWRITE_DATABASE_ID, SCHEDULED_MESSAGES_COLLECTION_ID, id);
        } catch (e) { console.error(`[Appwrite] deleteScheduledMessage for ID ${id} :: error`, e); throw e; }
    },

    // --- Giveaways ---
    async getGiveaways(guildId: string): Promise<Giveaway[]> {
        try {
            const response = await databases.listDocuments(APPWRITE_DATABASE_ID, GIVEAWAYS_COLLECTION_ID, [Query.equal('guildId', guildId), Query.orderDesc('endsAt')]);
            return response.documents.map(doc => mapDoc<Giveaway>(doc));
        } catch (e) { console.error(`[Appwrite] getGiveaways for guild ${guildId} :: error`, e); return []; }
    },
    
    async createGiveaway(giveawayData: Omit<Giveaway, 'id' | 'messageId' | 'status'>): Promise<Giveaway> {
        try {
            const dataToSave = { ...giveawayData, status: 'running', messageId: 'pending' };
            const newDoc = await databases.createDocument(APPWRITE_DATABASE_ID, GIVEAWAYS_COLLECTION_ID, ID.unique(), dataToSave);
            await databases.createDocument(APPWRITE_DATABASE_ID, GIVEAWAY_QUEUE_COLLECTION_ID, ID.unique(), {
                guildId: newDoc.guildId,
                giveawayId: newDoc.$id,
            });
            return mapDoc<Giveaway>(newDoc);
        } catch (e) { console.error("[Appwrite] createGiveaway :: error", e); throw e; }
    },

    async rerollGiveaway(giveawayId: string): Promise<void> {
        try {
            // This just updates a field, the bot will see this and trigger the reroll logic
            await databases.updateDocument(APPWRITE_DATABASE_ID, GIVEAWAYS_COLLECTION_ID, giveawayId, {
                status: 'running' // Temporarily set to running to trigger bot logic
            });
        } catch (e) { console.error(`[Appwrite] rerollGiveaway for ID ${giveawayId} :: error`, e); throw e; }
    },

    async deleteGiveaway(id: string): Promise<void> {
        try {
            await databases.deleteDocument(APPWRITE_DATABASE_ID, GIVEAWAYS_COLLECTION_ID, id);
        } catch (e) { console.error(`[Appwrite] deleteGiveaway for ID ${id} :: error`, e); throw e; }
    },
    
    // --- Bot Status ---
    async getBotInfo(): Promise<BotInfo | null> {
        try {
            const response = await databases.listDocuments(APPWRITE_DATABASE_ID, BOT_INFO_COLLECTION_ID, [Query.limit(1)]);
            return response.documents.length > 0 ? mapDoc<BotInfo>(response.documents[0]) : null;
        } catch (e) { console.error("[Appwrite] getBotInfo :: error", e); return null; }
    },

    async getSystemStatus(): Promise<SystemStatus | null> {
        try {
            const response = await databases.listDocuments(APPWRITE_DATABASE_ID, SYSTEM_STATUS_COLLECTION_ID, [Query.limit(1)]);
            return response.documents.length > 0 ? mapDoc<SystemStatus>(response.documents[0]) : null;
        } catch (e) { console.error("[Appwrite] getSystemStatus :: error", e); return null; }
    },

    // --- Leaderboard ---
    async getLeaderboard(guildId: string): Promise<UserLevel[]> {
        try {
            const response = await databases.listDocuments(APPWRITE_DATABASE_ID, USER_LEVELS_COLLECTION_ID, [
                Query.equal('guildId', guildId),
                Query.orderDesc('level'),
                Query.orderDesc('xp'),
                Query.limit(100)
            ]);
            return response.documents.map(doc => mapDoc<UserLevel>(doc));
        } catch (e) { console.error(`[Appwrite] getLeaderboard for guild ${guildId} :: error`, e); return []; }
    },

    // --- Members ---
    async getMembers(guildId: string, page: number, searchQuery?: string): Promise<{total: number, members: GuildMember[]}> {
        const queries = [Query.equal('guildId', guildId), Query.limit(25), Query.offset((page - 1) * 25), Query.orderAsc('username')];
        if (searchQuery) {
            queries.push(Query.search('username', searchQuery));
        }
        try {
            const response = await databases.listDocuments(APPWRITE_DATABASE_ID, MEMBERS_COLLECTION_ID, queries);
            return {
                total: response.total,
                members: response.documents.map(doc => mapDoc<GuildMember>(doc))
            };
        } catch (e) { console.error(`[Appwrite] getMembers for guild ${guildId} :: error`, e); return { total: 0, members: [] }; }
    },

    // --- Moderation Actions ---
    async createModerationAction(action: ModerationAction): Promise<void> {
        try {
            await databases.createDocument(APPWRITE_DATABASE_ID, MODERATION_QUEUE_COLLECTION_ID, ID.unique(), action);
        } catch (e) { console.error("[Appwrite] createModerationAction :: error", e); throw e; }
    },
};
