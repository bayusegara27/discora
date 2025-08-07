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
  SERVER_METADATA_COLLECTION_ID, // New
  APPWRITE_DATABASE_ID,
  BOT_INFO_COLLECTION_ID,
  SYSTEM_STATUS_COLLECTION_ID,
} from "./appwriteConfig";
import {
  Server,
  ServerSettings,
  YoutubeSubscription,
  LogEntry,
  ServerStats,
  CustomCommand,
  CommandLogEntry,
  BotInfo,
  SystemStatus,
  UserLevel,
  ModerationAction,
  GuildMember,
  ServerMetadata,
} from "../types";
import type { Models } from "appwrite";

function mapDoc<T>(doc: Models.Document): T {
  const {
    $id,
    $collectionId,
    $databaseId,
    $createdAt,
    $updatedAt,
    $permissions,
    ...data
  } = doc;
  return { id: $id, ...data } as T;
}

const defaultStats: Omit<ServerStats, "id" | "guildId" | "doc_id"> = {
  memberCount: 0,
  onlineCount: 0,
  messagesToday: 0,
  commandCount: 0,
  messagesWeekly: [
    { day: "Mon", count: 0 },
    { day: "Tue", count: 0 },
    { day: "Wed", count: 0 },
    { day: "Thu", count: 0 },
    { day: "Fri", count: 0 },
    { day: "Sat", count: 0 },
    { day: "Sun", count: 0 },
  ],
};

const parseJsonField = (field: any, fallback: any[] = []) => {
  if (typeof field === "string") {
    try {
      return JSON.parse(field);
    } catch {
      return fallback;
    }
  }
  return Array.isArray(field) ? field : fallback;
};

export const appwriteService = {
  // --- Authentication ---
  async login(
    email: string,
    password: string
  ): Promise<Models.User<Models.Preferences>> {
    try {
      await account.createEmailPasswordSession(email, password);
      return await account.get();
    } catch (e) {
      console.error("Appwrite service :: login :: error", e);
      throw e;
    }
  },

  async register(
    name: string,
    email: string,
    password: string
  ): Promise<Models.User<Models.Preferences>> {
    try {
      await account.create(ID.unique(), email, password, name);
      return await this.login(email, password);
    } catch (e) {
      console.error("Appwrite service :: register :: error", e);
      throw e;
    }
  },

  async logout(): Promise<void> {
    try {
      await account.deleteSession("current");
    } catch (e) {
      console.error("Appwrite service :: logout :: error", e);
      throw e;
    }
  },

  async getCurrentAccount(): Promise<Models.User<Models.Preferences> | null> {
    try {
      return await account.get();
    } catch (e: any) {
      if (e.code !== 401) {
        console.error("Appwrite service :: getCurrentAccount :: error", e);
      }
      return null;
    }
  },

  // --- Servers (Guilds) ---
  async getServers(): Promise<Server[]> {
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        SERVERS_COLLECTION_ID,
        [Query.limit(100)]
      );
      return response.documents.map((doc) => mapDoc<Server>(doc));
    } catch (error) {
      console.error("Appwrite service :: getServers :: error", error);
      return [];
    }
  },

  // --- Server Metadata (Channels & Roles) ---
  async getServerMetadata(guildId: string): Promise<ServerMetadata | null> {
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        SERVER_METADATA_COLLECTION_ID,
        [Query.equal("guildId", guildId)]
      );
      if (response.documents.length > 0) {
        const doc = response.documents[0];
        const data = mapDoc<ServerMetadata>(doc);
        data.channels = parseJsonField(data.channels);
        data.roles = parseJsonField(data.roles);
        return data;
      }
      return null;
    } catch (e) {
      console.error("Appwrite service :: getServerMetadata :: error", e);
      return null;
    }
  },

  // --- Server Settings ---
  async getSettings(guildId: string): Promise<ServerSettings> {
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        SETTINGS_COLLECTION_ID,
        [Query.equal("guildId", guildId)]
      );
      if (response.documents.length > 0) {
        const doc = response.documents[0];
        const settings = mapDoc<ServerSettings>(doc);
        settings.levelingRoleRewards = parseJsonField(
          settings.levelingRoleRewards
        );
        settings.levelingBlacklistedChannels = parseJsonField(
          settings.levelingBlacklistedChannels
        );
        return settings;
      } else {
        const defaultSettings: Omit<ServerSettings, "id"> = {
          guildId: guildId,
          welcomeMessageEnabled: true,
          welcomeMessage: "Welcome to the server, {user}! Enjoy your stay.",
          welcomeChannelId: "",
          goodbyeMessageEnabled: false,
          goodbyeMessage: "{user} has left the server.",
          goodbyeChannelId: "",
          autoRoleEnabled: false,
          autoRoleRoleId: "",
          aiAutoModEnabled: false,
          levelingEnabled: true,
          levelUpChannelId: "",
          levelUpMessage: "🎉 GG {user}, you just reached level **{level}**!",
          levelingRoleRewards: [],
          levelingXpPerMessageMin: 15,
          levelingXpPerMessageMax: 25,
          levelingCooldownSeconds: 60,
          levelingBlacklistedChannels: [],
        };
        const newDoc = await databases.createDocument(
          APPWRITE_DATABASE_ID,
          SETTINGS_COLLECTION_ID,
          ID.unique(),
          {
            ...defaultSettings,
            levelingRoleRewards: JSON.stringify(
              defaultSettings.levelingRoleRewards
            ),
            levelingBlacklistedChannels: JSON.stringify(
              defaultSettings.levelingBlacklistedChannels
            ),
          }
        );
        return mapDoc<ServerSettings>(newDoc);
      }
    } catch (e) {
      console.error("Appwrite service :: getSettings :: error", e);
      throw e;
    }
  },

  async updateSettings(settings: ServerSettings): Promise<ServerSettings> {
    try {
      const { id, ...data } = settings;
      const dataToSave = {
        ...data,
        levelingRoleRewards: JSON.stringify(data.levelingRoleRewards),
        levelingBlacklistedChannels: JSON.stringify(
          data.levelingBlacklistedChannels
        ),
      };
      const updatedDoc = await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        SETTINGS_COLLECTION_ID,
        id!,
        dataToSave
      );
      return mapDoc<ServerSettings>(updatedDoc);
    } catch (e) {
      console.error("Appwrite service :: updateSettings :: error", e);
      throw e;
    }
  },

  // --- YouTube Subscriptions ---
  async getYoutubeSubscriptions(
    guildId: string
  ): Promise<YoutubeSubscription[]> {
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        YOUTUBE_SUBSCRIPTIONS_COLLECTION_ID,
        [Query.equal("guildId", guildId), Query.orderAsc("youtubeChannelName")]
      );
      return response.documents.map((doc) => mapDoc<YoutubeSubscription>(doc));
    } catch (e) {
      console.error("Appwrite service :: getYoutubeSubscriptions :: error", e);
      return [];
    }
  },

  async createYoutubeSubscription(
    subscription: Omit<YoutubeSubscription, "id">
  ): Promise<YoutubeSubscription> {
    try {
      const newDoc = await databases.createDocument(
        APPWRITE_DATABASE_ID,
        YOUTUBE_SUBSCRIPTIONS_COLLECTION_ID,
        ID.unique(),
        subscription
      );
      return mapDoc<YoutubeSubscription>(newDoc);
    } catch (e) {
      console.error(
        "Appwrite service :: createYoutubeSubscription :: error",
        e
      );
      throw e;
    }
  },

  async updateYoutubeSubscription(
    subscription: YoutubeSubscription
  ): Promise<YoutubeSubscription> {
    try {
      const { id, ...data } = subscription;
      const updatedDoc = await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        YOUTUBE_SUBSCRIPTIONS_COLLECTION_ID,
        id!,
        data
      );
      return mapDoc<YoutubeSubscription>(updatedDoc);
    } catch (e) {
      console.error(
        "Appwrite service :: updateYoutubeSubscription :: error",
        e
      );
      throw e;
    }
  },

  async deleteYoutubeSubscription(subscriptionId: string): Promise<void> {
    try {
      await databases.deleteDocument(
        APPWRITE_DATABASE_ID,
        YOUTUBE_SUBSCRIPTIONS_COLLECTION_ID,
        subscriptionId
      );
    } catch (e) {
      console.error(
        "Appwrite service :: deleteYoutubeSubscription :: error",
        e
      );
      throw e;
    }
  },

  // --- Logs (Read-only from frontend) ---
  async getAuditLogs(guildId: string): Promise<LogEntry[]> {
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        AUDIT_LOGS_COLLECTION_ID,
        [
          Query.equal("guildId", guildId),
          Query.orderDesc("$createdAt"),
          Query.limit(100),
        ]
      );
      return response.documents.map((doc) => mapDoc<LogEntry>(doc));
    } catch (e) {
      console.error("Appwrite service :: getAuditLogs :: error", e);
      return [];
    }
  },

  async getCommandLogs(guildId: string): Promise<CommandLogEntry[]> {
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COMMAND_LOGS_COLLECTION_ID,
        [
          Query.equal("guildId", guildId),
          Query.orderDesc("$createdAt"),
          Query.limit(100),
        ]
      );
      return response.documents.map((doc) => mapDoc<CommandLogEntry>(doc));
    } catch (e) {
      console.error("Appwrite service :: getCommandLogs :: error", e);
      return [];
    }
  },

  // --- Server Statistics ---
  async getServerStats(guildId: string): Promise<ServerStats> {
    try {
      const statsDocs = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        STATS_COLLECTION_ID,
        [Query.equal("guildId", guildId), Query.equal("doc_id", "main_stats")]
      );
      if (statsDocs.documents.length > 0) {
        const doc = statsDocs.documents[0];
        const messagesWeekly =
          typeof doc.messagesWeekly === "string"
            ? JSON.parse(doc.messagesWeekly)
            : doc.messagesWeekly;
        return { ...mapDoc<ServerStats>(doc), messagesWeekly };
      }
      const newStatsData = {
        doc_id: "main_stats",
        guildId,
        ...defaultStats,
        messagesWeekly: JSON.stringify(defaultStats.messagesWeekly),
      };
      const newDoc = await databases.createDocument(
        APPWRITE_DATABASE_ID,
        STATS_COLLECTION_ID,
        ID.unique(),
        newStatsData
      );
      return mapDoc<ServerStats>(newDoc);
    } catch (e) {
      console.error("Appwrite service :: getServerStats :: error", e);
      return { guildId, doc_id: "main_stats", ...defaultStats };
    }
  },

  // --- Custom Commands ---
  async getCustomCommands(guildId: string): Promise<CustomCommand[]> {
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        CUSTOM_COMMANDS_COLLECTION_ID,
        [Query.equal("guildId", guildId), Query.orderAsc("command")]
      );
      return response.documents.map((doc) => mapDoc<CustomCommand>(doc));
    } catch (e) {
      console.error("Appwrite service :: getCustomCommands :: error", e);
      return [];
    }
  },

  async createCustomCommand(
    command: Omit<CustomCommand, "id">
  ): Promise<CustomCommand> {
    try {
      const newDoc = await databases.createDocument(
        APPWRITE_DATABASE_ID,
        CUSTOM_COMMANDS_COLLECTION_ID,
        ID.unique(),
        command
      );
      return mapDoc<CustomCommand>(newDoc);
    } catch (e) {
      console.error("Appwrite service :: createCustomCommand :: error", e);
      throw e;
    }
  },

  async updateCustomCommand(command: CustomCommand): Promise<CustomCommand> {
    try {
      const { id, ...data } = command;
      const updatedDoc = await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        CUSTOM_COMMANDS_COLLECTION_ID,
        id!,
        data
      );
      return mapDoc<CustomCommand>(updatedDoc);
    } catch (e) {
      console.error("Appwrite service :: updateCustomCommand :: error", e);
      throw e;
    }
  },

  async deleteCustomCommand(commandId: string): Promise<void> {
    try {
      await databases.deleteDocument(
        APPWRITE_DATABASE_ID,
        CUSTOM_COMMANDS_COLLECTION_ID,
        commandId
      );
    } catch (e) {
      console.error("Appwrite service :: deleteCustomCommand :: error", e);
      throw e;
    }
  },

  // --- Bot Status ---
  async getBotInfo(): Promise<BotInfo | null> {
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        BOT_INFO_COLLECTION_ID,
        [Query.limit(1)]
      );
      return response.documents.length > 0
        ? mapDoc<BotInfo>(response.documents[0])
        : null;
    } catch (e) {
      console.error("Appwrite service :: getBotInfo :: error", e);
      return null;
    }
  },

  async getSystemStatus(): Promise<SystemStatus | null> {
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        SYSTEM_STATUS_COLLECTION_ID,
        [Query.limit(1)]
      );
      return response.documents.length > 0
        ? mapDoc<SystemStatus>(response.documents[0])
        : null;
    } catch (e) {
      console.error("Appwrite service :: getSystemStatus :: error", e);
      return null;
    }
  },

  // --- Leaderboard ---
  async getLeaderboard(guildId: string): Promise<UserLevel[]> {
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        USER_LEVELS_COLLECTION_ID,
        [
          Query.equal("guildId", guildId),
          Query.orderDesc("level"),
          Query.orderDesc("xp"),
          Query.limit(100),
        ]
      );
      return response.documents.map((doc) => mapDoc<UserLevel>(doc));
    } catch (e) {
      console.error("Appwrite service :: getLeaderboard :: error", e);
      return [];
    }
  },

  // --- Members ---
  async getMembers(
    guildId: string,
    page: number,
    searchQuery?: string
  ): Promise<{ total: number; members: GuildMember[] }> {
    const queries = [
      Query.equal("guildId", guildId),
      Query.limit(25),
      Query.offset((page - 1) * 25),
      Query.orderAsc("username"),
    ];
    if (searchQuery) {
      queries.push(Query.search("username", searchQuery));
    }
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        MEMBERS_COLLECTION_ID,
        queries
      );
      return {
        total: response.total,
        members: response.documents.map((doc) => mapDoc<GuildMember>(doc)),
      };
    } catch (e) {
      console.error("Appwrite service :: getMembers :: error", e);
      return { total: 0, members: [] };
    }
  },

  // --- Moderation Actions ---
  async createModerationAction(action: ModerationAction): Promise<void> {
    try {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        MODERATION_QUEUE_COLLECTION_ID,
        ID.unique(),
        action
      );
    } catch (e) {
      console.error("Appwrite service :: createModerationAction :: error", e);
      throw e;
    }
  },
};
