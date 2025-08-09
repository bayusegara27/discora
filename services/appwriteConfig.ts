import { Client, Databases, Account, OAuthProvider } from 'appwrite';

// --- Appwrite Configuration ---
export const APPWRITE_ENDPOINT = 'https://appwrite.nakumi.my.id/v1';
export const APPWRITE_PROJECT_ID = 'personal'; 
export const APPWRITE_DATABASE_ID = 'aurabot_db';

// --- Collection IDs ---
export const SERVERS_COLLECTION_ID = 'servers';
export const SETTINGS_COLLECTION_ID = 'server_settings';
export const YOUTUBE_SUBSCRIPTIONS_COLLECTION_ID = 'youtube_subscriptions';
export const AUDIT_LOGS_COLLECTION_ID = 'audit_logs';
export const CUSTOM_COMMANDS_COLLECTION_ID = 'custom_commands';
export const COMMAND_LOGS_COLLECTION_ID = 'command_logs';
export const STATS_COLLECTION_ID = 'server_stats';
export const BOT_INFO_COLLECTION_ID = 'bot_info';
export const SYSTEM_STATUS_COLLECTION_ID = 'system_status';
export const USER_LEVELS_COLLECTION_ID = 'user_levels'; 
export const MODERATION_QUEUE_COLLECTION_ID = 'moderation_queue';
export const MEMBERS_COLLECTION_ID = 'members';
export const SERVER_METADATA_COLLECTION_ID = 'server_metadata';
export const REACTION_ROLES_COLLECTION_ID = 'reaction_roles';
export const SCHEDULED_MESSAGES_COLLECTION_ID = 'scheduled_messages';
export const GIVEAWAYS_COLLECTION_ID = 'giveaways';
export const REACTION_ROLE_QUEUE_COLLECTION_ID = 'reaction_role_queue';
export const GIVEAWAY_QUEUE_COLLECTION_ID = 'giveaway_queue';
export const MUSIC_QUEUE_COLLECTION_ID = 'music_queue';


// --- Appwrite Client Initialization ---
const client = new Client();
client
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export { ID, Query, OAuthProvider } from 'appwrite';