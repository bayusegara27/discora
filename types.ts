export interface Server {
  guildId: string;
  name: string;
  iconUrl: string;
}

export interface RoleReward {
    level: number;
    roleId: string;
}

// --- New Nested Settings Interfaces ---
export interface WelcomeSettings {
    enabled: boolean;
    message: string;
    channelId: string;
}

export interface GoodbyeSettings {
    enabled: boolean;
    message: string;
    channelId: string;
}

export interface AutoRoleSettings {
    enabled: boolean;
    roleId: string;
}

export interface LevelingSettings {
    enabled: boolean;
    channelId: string;
    message: string;
    roleRewards: RoleReward[];
    xpPerMessageMin: number;
    xpPerMessageMax: number;
    cooldownSeconds: number;
    blacklistedChannels: string[];
}

export interface AutoModSettings {
    aiEnabled: boolean;
    wordFilterEnabled: boolean;
    wordBlacklist: string[];
    linkFilterEnabled: boolean;
    linkWhitelist: string[];
    inviteFilterEnabled: boolean;
    mentionSpamEnabled: boolean;
    mentionSpamLimit: number;
    ignoreAdmins: boolean;
}

// Replaces the old flat ServerSettings
export interface ServerSettings {
  id?: string;
  guildId: string;
  welcome: WelcomeSettings;
  goodbye: GoodbyeSettings;
  autoRole: AutoRoleSettings;
  leveling: LevelingSettings;
  autoMod: AutoModSettings;
}


export interface YoutubeSubscription {
  id?: string;
  guildId: string;
  youtubeChannelId: string;
  youtubeChannelName?: string;
  discordChannelId: string;
  discordChannelName?: string;
  mentionRoleId?: string;
  customMessage?: string;
  liveMessage?: string;
  lastVideoTimestamp?: string;
  announcedVideoIds?: string; // JSON string array of video IDs
  lastAnnouncedVideoId?: string;
  lastAnnouncedVideoTitle?: string;
}

export enum LogType {
  MessageDeleted = 'MESSAGE_DELETED',
  UserJoined = 'USER_JOINED',
  UserLeft = 'USER_LEFT',
  UserBanned = 'USER_BANNED',
  UserKicked = 'USER_KICKED',
  UserUnbanned = 'USER_UNBANNED',
  AI_MODERATION = 'AI_MODERATION',
  AUTO_MOD_ACTION = 'AUTO_MOD_ACTION',
  GIVEAWAY_ENDED = 'GIVEAWAY_ENDED',
}

export interface LogEntry {
  id: string;
  guildId: string;
  type: LogType;
  user: string;
  userId: string;
  userAvatarUrl: string;
  content: string;
  timestamp: string;
}

export interface ServerStats {
  id?: string;
  doc_id?: string;
  guildId: string;
  memberCount: number;
  onlineCount: number;
  messagesToday: number;
  commandCount: number;
  messagesWeekly: { date: string; count: number }[];
  totalWarnings: number;
  roleDistribution: { name: string, count: number, color: string }[] | string;
}

export interface CustomCommand {
  id?: string;
  guildId: string;
  command: string;
  response: string;
  isEmbed: boolean;
  embedContent: string;
}

export interface ReactionRole {
  id?: string;
  guildId: string;
  channelId: string;
  messageId: string;
  embedTitle: string;
  embedDescription: string;
  embedColor: string;
  roles: { emoji: string, roleId: string }[] | string;
}

export interface ScheduledMessage {
  id?: string;
  guildId: string;
  channelId: string;
  content: string;
  schedule: string; // ISO string
  repeat: 'none' | 'daily' | 'weekly' | 'monthly';
  status: 'pending' | 'sent' | 'error';
  lastRun?: string;
  nextRun: string;
}

export interface Giveaway {
  id?: string;
  guildId: string;
  channelId: string;
  messageId?: string;
  prize: string;
  winnerCount: number;
  endsAt: string; // ISO String
  status: 'running' | 'ended' | 'error';
  requiredRoleId?: string;
  winners?: string[]; // Array of user IDs
}

export interface CommandLogEntry {
    id: string;
    guildId: string;
    command: string;
    user: string;
    userId: string;
    userAvatarUrl: string;
    timestamp: string;
}

export interface BotInfo {
  id?: string;
  name: string;
  avatarUrl: string;
}

export interface SystemStatus {
  id?: string;
  lastSeen: string;
}

export interface UserLevel {
  id?: string;
  guildId: string;
  userId: string;
  username: string;
  userAvatarUrl: string;
  level: number;
  xp: number;
}

export interface ModerationAction {
  guildId: string;
  targetUserId: string;
  targetUsername: string;
  actionType: 'kick' | 'ban';
  reason?: string;
  initiatorId: string;
}

export interface GuildMember {
    id: string;
    guildId: string;
    userId: string;
    username: string;
    userAvatarUrl: string;
    joinedAt: string;
}

export interface DiscordChannel {
    id: string;
    name: string;
}

export interface DiscordRole {
    id: string;
    name: string;
    color: number;
}

export interface ServerMetadata {
    id?: string;
    guildId: string;
    channels: DiscordChannel[];
    roles: DiscordRole[];
}

// Bot Queue Types
export interface ReactionRoleQueueItem {
    id?: string;
    guildId: string;
    reactionRoleId: string; // ID of the main ReactionRole document
}

export interface GiveawayQueueItem {
    id?: string;
    guildId: string;
    giveawayId: string; // ID of the main Giveaway document
}