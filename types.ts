export interface Server {
  guildId: string;
  name: string;
  iconUrl: string;
}

export interface RoleReward {
    level: number;
    roleId: string;
}

export interface ServerSettings {
  id?: string;
  guildId: string;
  welcomeMessageEnabled: boolean;
  welcomeMessage: string;
  welcomeChannelId: string;
  goodbyeMessageEnabled: boolean;
  goodbyeMessage: string;
  goodbyeChannelId: string;
  autoRoleEnabled: boolean;
  autoRoleRoleId: string;
  aiAutoModEnabled: boolean;
  levelingEnabled: boolean;
  levelUpChannelId: string;
  levelUpMessage: string;
  levelingRoleRewards: RoleReward[] | string;
  // New granular leveling controls
  levelingXpPerMessageMin: number;
  levelingXpPerMessageMax: number;
  levelingCooldownSeconds: number;
  levelingBlacklistedChannels: string[] | string; // Array of channel IDs
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
  latestVideoId?: string;
  latestVideoTitle?: string;
}

export enum LogType {
  MessageDeleted = 'MESSAGE_DELETED',
  UserJoined = 'USER_JOINED',
  UserLeft = 'USER_LEFT',
  UserBanned = 'USER_BANNED',
  UserKicked = 'USER_KICKED',
  UserUnbanned = 'USER_UNBANNED',
  AI_MODERATION = 'AI_MODERATION',
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
  messagesWeekly: { day: string; count: number }[];
}

export interface CustomCommand {
  id?: string;
  guildId: string;
  command: string;
  response: string;
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

// New for Smart Settings Page
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