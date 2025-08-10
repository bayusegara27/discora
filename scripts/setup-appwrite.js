
import {
  Client,
  Databases,
  Permission,
  Role,
  ID,
  IndexType,
} from "node-appwrite";

const { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY } =
  process.env;

const APPWRITE_DATABASE_ID = "aurabot_db";
const SERVERS_COLLECTION_ID = "servers";
const SETTINGS_COLLECTION_ID = "server_settings";
const YOUTUBE_SUBSCRIPTIONS_COLLECTION_ID = "youtube_subscriptions";
const AUDIT_LOGS_COLLECTION_ID = "audit_logs";
const CUSTOM_COMMANDS_COLLECTION_ID = "custom_commands";
const COMMAND_LOGS_COLLECTION_ID = "command_logs";
const STATS_COLLECTION_ID = "server_stats";
const BOT_INFO_COLLECTION_ID = "bot_info";
const SYSTEM_STATUS_COLLECTION_ID = "system_status";
const USER_LEVELS_COLLECTION_ID = "user_levels";
const MODERATION_QUEUE_COLLECTION_ID = "moderation_queue";
const MEMBERS_COLLECTION_ID = "members";
const SERVER_METADATA_COLLECTION_ID = "server_metadata";
const REACTION_ROLES_COLLECTION_ID = "reaction_roles";
const SCHEDULED_MESSAGES_COLLECTION_ID = "scheduled_messages";
const GIVEAWAYS_COLLECTION_ID = 'giveaways';
const REACTION_ROLE_QUEUE_COLLECTION_ID = 'reaction_role_queue';
const GIVEAWAY_QUEUE_COLLECTION_ID = 'giveaway_queue';
const MUSIC_QUEUE_COLLECTION_ID = 'music_queue';


if (!APPWRITE_ENDPOINT || !APPWRITE_PROJECT_ID || !APPWRITE_API_KEY) {
  console.error(
    "Error: Missing environment variables. Please create a .env file in the root directory and add APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, and APPWRITE_API_KEY."
  );
  process.exit(1);
}

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);
const databases = new Databases(client);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const arraysEqual = (a, b) => {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    for (let i = 0; i < sortedA.length; ++i) {
        if (sortedA[i] !== sortedB[i]) return false;
    }
    return true;
};

async function createCollection(databaseId, collectionId, name, permissions) {
  try {
    await databases.getCollection(databaseId, collectionId);
    console.log(`✅ Collection '${name}' already exists. Skipping.`);
  } catch (error) {
    if (error.code === 404) {
      console.log(`Creating collection '${name}'...`);
      await databases.createCollection(
        databaseId,
        collectionId,
        name,
        permissions
      );
      console.log(`👍 Collection '${name}' created.`);
      await wait(500);
    } else {
      throw error;
    }
  }
}

async function createAttribute(databaseId, collectionId, attribute) {
    const { attributes } = await databases.listAttributes(databaseId, collectionId);
    const existingAttribute = attributes.find(a => a.key === attribute.key);

    if (existingAttribute) {
        // Attribute exists, check for mismatches. This is a "best effort" check for common changes.
        // Appwrite doesn't allow most properties to be updated, so we warn the user.
        let mismatch = false;
        const warnings = [];

        if (existingAttribute.required !== attribute.required) {
            mismatch = true;
            warnings.push(`   - Required: Expected ${attribute.required}, Found ${existingAttribute.required}`);
        }

        if (attribute.type === 'string' && existingAttribute.size !== attribute.size) {
            mismatch = true;
            warnings.push(`   - Size: Expected ${attribute.size}, Found ${existingAttribute.size}`);
        }

        if (mismatch) {
            console.warn(`   - ⚠️  Attribute '${attribute.key}' has a configuration mismatch.`);
            warnings.forEach(w => console.warn(w));
            console.warn(`   - 👉 Please manually update this attribute in your Appwrite console if necessary. This may require deleting and recreating the attribute, which can be a destructive action.`);
        } else {
            console.log(`   - Attribute '${attribute.key}' already exists and is configured correctly. Skipping.`);
        }
    } else {
        // Attribute does not exist, create it.
        console.log(`   - Creating attribute '${attribute.key}'...`);
        try {
            switch (attribute.type) {
                case "string":
                    await databases.createStringAttribute(databaseId, collectionId, attribute.key, attribute.size, attribute.required, attribute.default, attribute.array);
                    break;
                case "boolean":
                    await databases.createBooleanAttribute(databaseId, collectionId, attribute.key, attribute.required, attribute.default, attribute.array);
                    break;
                case "integer":
                    await databases.createIntegerAttribute(databaseId, collectionId, attribute.key, attribute.required, attribute.min, attribute.max, attribute.default, attribute.array);
                    break;
                default:
                    throw new Error(`Unknown attribute type: ${attribute.type}`);
            }
            console.log(`   👍 Attribute '${attribute.key}' created.`);
            // Wait for the attribute to be available for index creation
            await new Promise(resolve => setTimeout(resolve, 1500));
        } catch (creationError) {
            console.error(`   - 💥 FAILED to create attribute '${attribute.key}'.`);
            throw creationError;
        }
    }
}


async function createIndex(databaseId, collectionId, index) {
  try {
    const existingIndex = await databases.getIndex(databaseId, collectionId, index.key);
    // Index exists, verify its properties
    const typeMatch = existingIndex.type === index.type;
    // Note: Appwrite may return orders as null if not specified, so we default to empty array for comparison
    const orders = index.orders || [];
    const existingOrders = existingIndex.orders || [];
    
    const attributesMatch = arraysEqual(existingIndex.attributes, index.attributes);
    const ordersMatch = arraysEqual(existingOrders, orders);

    if (typeMatch && attributesMatch && ordersMatch) {
      console.log(`   - Index '${index.key}' already exists and is correct. Skipping.`);
    } else {
      console.warn(`   - ⚠️ Index '${index.key}' has a configuration mismatch. Recreating...`);
      await databases.deleteIndex(databaseId, collectionId, index.key);
      console.log(`   - Deleted old index '${index.key}'.`);
      await wait(1000); // Wait for deletion to process
      await databases.createIndex(databaseId, collectionId, index.key, index.type, index.attributes, index.orders);
      console.log(`   👍 Recreated index '${index.key}'.`);
      await wait(1000);
    }
  } catch (e) {
    if (e.code === 404) {
      // Index does not exist, create it
      console.log(`   - Creating index '${index.key}'...`);
      await databases.createIndex(
        databaseId,
        collectionId,
        index.key,
        index.type,
        index.attributes,
        index.orders
      );
      console.log(`   👍 Index '${index.key}' created.`);
      await wait(1000);
    } else {
      console.error(`   - 💥 An error occurred with index '${index.key}'.`);
      throw e;
    }
  }
}

async function setup() {
  console.log("🚀 Starting Discora Appwrite setup...");
  try {
    try {
      await databases.get(APPWRITE_DATABASE_ID);
      console.log(
        `✅ Database '${APPWRITE_DATABASE_ID}' already exists. Skipping.`
      );
    } catch (error) {
      if (error.code === 404) {
        console.log(`Creating database '${APPWRITE_DATABASE_ID}'...`);
        await databases.create(APPWRITE_DATABASE_ID, "Discora DB");
        console.log(`👍 Database '${APPWRITE_DATABASE_ID}' created.`);
      } else {
        throw error;
      }
    }

    await createCollection(
      APPWRITE_DATABASE_ID,
      SERVERS_COLLECTION_ID,
      "Servers",
      [Permission.read(Role.users())]
    );
    for (const attr of [
      { key: "guildId", type: "string", size: 32, required: true },
      { key: "name", type: "string", size: 128, required: true },
      { key: "iconUrl", type: "string", size: 256, required: false },
    ])
      await createAttribute(APPWRITE_DATABASE_ID, SERVERS_COLLECTION_ID, attr);
    await createIndex(APPWRITE_DATABASE_ID, SERVERS_COLLECTION_ID, {
      key: "guildId_unique",
      type: IndexType.Unique,
      attributes: ["guildId"],
      orders: ["ASC"],
    });

    await createCollection(
      APPWRITE_DATABASE_ID,
      SETTINGS_COLLECTION_ID,
      "Server Settings",
      [
        Permission.create(Role.users()),
        Permission.read(Role.users()),
        Permission.update(Role.users()),
      ]
    );
    const defaultWelcome = JSON.stringify({ enabled: true, message: 'Welcome to the server, {user}! Enjoy your stay.', channelId: '' });
    const defaultGoodbye = JSON.stringify({ enabled: false, message: '{user} has left the server.', channelId: '' });
    const defaultAutoRole = JSON.stringify({ enabled: false, roleId: '' });
    const defaultLeveling = JSON.stringify({
        enabled: true,
        channelId: '',
        message: '🎉 GG {user}, you just reached level **{level}**!',
        roleRewards: [],
        xpPerMessageMin: 15,
        xpPerMessageMax: 25,
        cooldownSeconds: 60,
        blacklistedChannels: [],
    });
    const defaultAutoMod = JSON.stringify({
        aiEnabled: false,
        wordFilterEnabled: false,
        wordBlacklist: [],
        linkFilterEnabled: false,
        linkWhitelist: [],
        inviteFilterEnabled: false,
        mentionSpamEnabled: false,
        mentionSpamLimit: 5,
        ignoreAdmins: true,
    });
    const settingsAttributes = [
      { key: "guildId", type: "string", size: 32, required: true },
      { key: "welcomeSettings", type: "string", size: 2000, required: false, default: defaultWelcome },
      { key: "goodbyeSettings", type: "string", size: 2000, required: false, default: defaultGoodbye },
      { key: "autoRoleSettings", type: "string", size: 500, required: false, default: defaultAutoRole },
      { key: "levelingSettings", type: "string", size: 10000, required: false, default: defaultLeveling },
      { key: "autoModSettings", type: "string", size: 20000, required: false, default: defaultAutoMod },
    ];
    for (const attr of settingsAttributes)
      await createAttribute(APPWRITE_DATABASE_ID, SETTINGS_COLLECTION_ID, attr);
    await createIndex(APPWRITE_DATABASE_ID, SETTINGS_COLLECTION_ID, {
      key: "guildId_unique",
      type: IndexType.Unique,
      attributes: ["guildId"],
      orders: ["ASC"],
    });

    await createCollection(
      APPWRITE_DATABASE_ID,
      SERVER_METADATA_COLLECTION_ID,
      "Server Metadata",
      [Permission.read(Role.users())]
    );
    const metadataAttributes = [
      { key: "guildId", type: "string", size: 32, required: true },
      { key: "data", type: "string", size: 20000, required: false, default: "{}" },
    ];
    for (const attr of metadataAttributes)
      await createAttribute( APPWRITE_DATABASE_ID, SERVER_METADATA_COLLECTION_ID, attr );
    await createIndex(APPWRITE_DATABASE_ID, SERVER_METADATA_COLLECTION_ID, {
      key: "guildId_unique",
      type: IndexType.Unique,
      attributes: ["guildId"],
      orders: ['ASC'],
    });

    await createCollection(
      APPWRITE_DATABASE_ID,
      YOUTUBE_SUBSCRIPTIONS_COLLECTION_ID,
      "YouTube Subscriptions",
      [ Permission.create(Role.users()), Permission.read(Role.users()), Permission.update(Role.users()), Permission.delete(Role.users()), ]
    );
    const youtubeAttributes = [
      { key: "guildId", type: "string", size: 32, required: true },
      { key: "youtubeChannelId", type: "string", size: 64, required: true },
      { key: "youtubeChannelName", type: "string", size: 128, required: false, default: "" },
      { key: "discordChannelId", type: "string", size: 32, required: true },
      { key: "discordChannelName", type: "string", size: 128, required: false, default: "" },
      { key: "mentionRoleId", type: "string", size: 32, required: false },
      { key: "customMessage", type: "string", size: 1024, required: false },
      { key: "liveMessage", type: "string", size: 1024, required: false },
      { key: "lastVideoTimestamp", type: "string", size: 64, required: false },
      { key: "announcedVideoIds", type: "string", size: 2000, required: false, default: "[]" },
      { key: "lastAnnouncedVideoId", type: "string", size: 64, required: false },
      { key: "lastAnnouncedVideoTitle", type: "string", size: 256, required: false },
    ];
    for (const attr of youtubeAttributes)
      await createAttribute( APPWRITE_DATABASE_ID, YOUTUBE_SUBSCRIPTIONS_COLLECTION_ID, attr );
    await createIndex( APPWRITE_DATABASE_ID, YOUTUBE_SUBSCRIPTIONS_COLLECTION_ID, { key: "guildId_key", type: IndexType.Key, attributes: ["guildId"], orders: ["ASC"], } );

    await createCollection(
      APPWRITE_DATABASE_ID,
      CUSTOM_COMMANDS_COLLECTION_ID,
      "Custom Commands",
      [ Permission.create(Role.users()), Permission.read(Role.users()), Permission.update(Role.users()), Permission.delete(Role.users()), ]
    );
    for (const attr of [
      { key: "guildId", type: "string", size: 32, required: true },
      { key: "command", type: "string", size: 64, required: true },
      { key: "response", type: "string", size: 2000, required: false },
      { key: "isEmbed", type: "boolean", required: false, default: false },
      { key: "embedContent", type: "string", size: 4000, required: false, default: "{}" },
    ])
      await createAttribute( APPWRITE_DATABASE_ID, CUSTOM_COMMANDS_COLLECTION_ID, attr );
    await createIndex(APPWRITE_DATABASE_ID, CUSTOM_COMMANDS_COLLECTION_ID, { key: "guildId_command_unique", type: IndexType.Unique, attributes: ["guildId", "command"], orders: ["ASC", "ASC"], });

    await createCollection( APPWRITE_DATABASE_ID, AUDIT_LOGS_COLLECTION_ID, "Audit Logs", [Permission.read(Role.users())] );
    for (const attr of [
      { key: "guildId", type: "string", size: 32, required: true },
      { key: "type", type: "string", size: 64, required: true },
      { key: "user", type: "string", size: 64, required: true },
      { key: "userId", type: "string", size: 32, required: true },
      { key: "userAvatarUrl", type: "string", size: 256, required: false },
      { key: "content", type: "string", size: 2000, required: true },
      { key: "timestamp", type: "string", size: 64, required: true },
    ])
      await createAttribute( APPWRITE_DATABASE_ID, AUDIT_LOGS_COLLECTION_ID, attr );
    await createIndex(APPWRITE_DATABASE_ID, AUDIT_LOGS_COLLECTION_ID, { key: "guildId_timestamp", type: IndexType.Key, attributes: ["guildId", "timestamp"], orders: ["ASC", "DESC"], });

    await createCollection( APPWRITE_DATABASE_ID, COMMAND_LOGS_COLLECTION_ID, "Command Logs", [Permission.read(Role.users())] );
    for (const attr of [
      { key: "guildId", type: "string", size: 32, required: true },
      { key: "command", type: "string", size: 64, required: true },
      { key: "user", type: "string", size: 64, required: true },
      { key: "userId", type: "string", size: 32, required: true },
      { key: "userAvatarUrl", type: "string", size: 256, required: false },
      { key: "timestamp", type: "string", size: 64, required: true },
    ])
      await createAttribute( APPWRITE_DATABASE_ID, COMMAND_LOGS_COLLECTION_ID, attr );
    await createIndex(APPWRITE_DATABASE_ID, COMMAND_LOGS_COLLECTION_ID, { key: "guildId_timestamp", type: IndexType.Key, attributes: ["guildId", "timestamp"], orders: ["ASC", "DESC"], });

    await createCollection( APPWRITE_DATABASE_ID, STATS_COLLECTION_ID, "Server Stats", [ Permission.create(Role.users()), Permission.read(Role.users()), Permission.update(Role.users()), ] );
    for (const attr of [
      { key: "doc_id", type: "string", size: 32, required: true },
      { key: "guildId", type: "string", size: 32, required: true },
      { key: "memberCount", type: "integer", required: false, default: 0 },
      { key: "onlineCount", type: "integer", required: false, default: 0 },
      { key: "commandCount", type: "integer", required: false, default: 0 },
      { key: "totalWarnings", type: "integer", required: false, default: 0 },
      { key: "messagesWeekly", type: "string", size: 2000, required: false, default: "[]" },
      { key: "roleDistribution", type: "string", size: 10000, required: false, default: "[]" },
    ])
      await createAttribute(APPWRITE_DATABASE_ID, STATS_COLLECTION_ID, attr);
    await createIndex(APPWRITE_DATABASE_ID, STATS_COLLECTION_ID, { key: "guildId_docId_unique", type: IndexType.Unique, attributes: ["guildId", "doc_id"], orders: ["ASC", "ASC"], });

    await createCollection( APPWRITE_DATABASE_ID, BOT_INFO_COLLECTION_ID, "Bot Info", [Permission.read(Role.any())] );
    for (const attr of [ { key: "name", type: "string", size: 128, required: true }, { key: "avatarUrl", type: "string", size: 256, required: false }, ])
      await createAttribute(APPWRITE_DATABASE_ID, BOT_INFO_COLLECTION_ID, attr);

    await createCollection( APPWRITE_DATABASE_ID, SYSTEM_STATUS_COLLECTION_ID, "System Status", [Permission.read(Role.any())] );
    for (const attr of [ { key: "lastSeen", type: "string", size: 64, required: true }, ])
      await createAttribute( APPWRITE_DATABASE_ID, SYSTEM_STATUS_COLLECTION_ID, attr );

    await createCollection( APPWRITE_DATABASE_ID, USER_LEVELS_COLLECTION_ID, "User Levels", [Permission.read(Role.users())] );
    for (const attr of [
      { key: "guildId", type: "string", size: 32, required: true },
      { key: "userId", type: "string", size: 32, required: true },
      { key: "username", type: "string", size: 128, required: true },
      { key: "userAvatarUrl", type: "string", size: 256, required: false },
      { key: "level", type: "integer", required: false, default: 0 },
      { key: "xp", type: "integer", required: false, default: 0 },
    ])
      await createAttribute( APPWRITE_DATABASE_ID, USER_LEVELS_COLLECTION_ID, attr );
    await createIndex(APPWRITE_DATABASE_ID, USER_LEVELS_COLLECTION_ID, { key: "guildId_userId_unique", type: IndexType.Unique, attributes: ["guildId", "userId"], orders: ['ASC', 'ASC'] });
    await createIndex(APPWRITE_DATABASE_ID, USER_LEVELS_COLLECTION_ID, { key: "guildId_xp_level", type: IndexType.Key, attributes: ["guildId", "level", "xp"], orders: ["ASC", "DESC", "DESC"], });

    await createCollection( APPWRITE_DATABASE_ID, MODERATION_QUEUE_COLLECTION_ID, "Moderation Queue", [Permission.create(Role.users()), Permission.read(Role.users())] );
    for (const attr of [
      { key: "guildId", type: "string", size: 32, required: true },
      { key: "targetUserId", type: "string", size: 32, required: true },
      { key: "targetUsername", type: "string", size: 128, required: true },
      { key: "actionType", type: "string", size: 16, required: true },
      { key: "reason", type: "string", size: 512, required: false },
      { key: "initiatorId", type: "string", size: 64, required: true },
    ])
      await createAttribute( APPWRITE_DATABASE_ID, MODERATION_QUEUE_COLLECTION_ID, attr );

    await createCollection( APPWRITE_DATABASE_ID, MEMBERS_COLLECTION_ID, "Members", [Permission.read(Role.users())] );
    for (const attr of [
      { key: "guildId", type: "string", size: 32, required: true },
      { key: "userId", type: "string", size: 32, required: true },
      { key: "username", type: "string", size: 128, required: true },
      { key: "userAvatarUrl", type: "string", size: 256, required: false },
      { key: "joinedAt", type: "string", size: 64, required: true },
    ])
      await createAttribute(APPWRITE_DATABASE_ID, MEMBERS_COLLECTION_ID, attr);
    await createIndex(APPWRITE_DATABASE_ID, MEMBERS_COLLECTION_ID, { key: "guildId_userId_unique", type: IndexType.Unique, attributes: ["guildId", "userId"], orders: ['ASC', 'ASC'] });
    await createIndex(APPWRITE_DATABASE_ID, MEMBERS_COLLECTION_ID, { key: "guildId_username_search", type: IndexType.Fulltext, attributes: ["username"], });
    
    // --- New Collections for Features ---
    await createCollection( APPWRITE_DATABASE_ID, REACTION_ROLES_COLLECTION_ID, "Reaction Roles", [ Permission.create(Role.users()), Permission.read(Role.users()), Permission.update(Role.users()), Permission.delete(Role.users()), ] );
     for (const attr of [
      { key: "guildId", type: "string", size: 32, required: true },
      { key: "channelId", type: "string", size: 32, required: true },
      { key: "messageId", type: "string", size: 32, required: true },
      { key: "embedTitle", type: "string", size: 256, required: true },
      { key: "embedDescription", type: "string", size: 4000, required: false },
      { key: "embedColor", type: "string", size: 10, required: false, default: "#5865F2" },
      { key: "roles", type: "string", size: 4000, required: false, default: "[]" },
    ])
      await createAttribute(APPWRITE_DATABASE_ID, REACTION_ROLES_COLLECTION_ID, attr);
    await createIndex(APPWRITE_DATABASE_ID, REACTION_ROLES_COLLECTION_ID, { key: "guildId_messageId_key", type: IndexType.Key, attributes: ["guildId", "messageId"], orders: ['ASC', 'ASC'] });

    await createCollection( APPWRITE_DATABASE_ID, SCHEDULED_MESSAGES_COLLECTION_ID, "Scheduled Messages", [ Permission.create(Role.users()), Permission.read(Role.users()), Permission.update(Role.users()), Permission.delete(Role.users()), ] );
     for (const attr of [
      { key: "guildId", type: "string", size: 32, required: true },
      { key: "channelId", type: "string", size: 32, required: true },
      { key: "content", type: "string", size: 4000, required: true },
      { key: "schedule", type: "string", size: 64, required: true }, // Legacy, can be removed later
      { key: "repeat", type: "string", size: 16, required: false, default: 'none' },
      { key: "status", type: "string", size: 16, required: false, default: 'pending' },
      { key: "lastRun", type: "string", size: 64, required: false },
      { key: "nextRun", type: "string", size: 64, required: true },
    ])
      await createAttribute(APPWRITE_DATABASE_ID, SCHEDULED_MESSAGES_COLLECTION_ID, attr);
    await createIndex(APPWRITE_DATABASE_ID, SCHEDULED_MESSAGES_COLLECTION_ID, { key: "status_nextRun_key", type: IndexType.Key, attributes: ["status", "nextRun"], orders: ['ASC', 'ASC'] });

    await createCollection( APPWRITE_DATABASE_ID, GIVEAWAYS_COLLECTION_ID, "Giveaways", [ Permission.create(Role.users()), Permission.read(Role.users()), Permission.update(Role.users()), Permission.delete(Role.users()), ] );
    for (const attr of [
        { key: "guildId", type: "string", size: 32, required: true },
        { key: "channelId", type: "string", size: 32, required: true },
        { key: "messageId", type: "string", size: 32, required: false },
        { key: "prize", type: "string", size: 256, required: true },
        { key: "winnerCount", type: "integer", required: false, default: 1 },
        { key: "endsAt", type: "string", size: 64, required: true },
        { key: "status", type: "string", size: 16, required: false, default: 'running' },
        { key: "requiredRoleId", type: "string", size: 32, required: false },
        { key: "winners", type: "string", size: 4000, required: false, array: true },
    ])
      await createAttribute(APPWRITE_DATABASE_ID, GIVEAWAYS_COLLECTION_ID, attr);
    await createIndex(APPWRITE_DATABASE_ID, GIVEAWAYS_COLLECTION_ID, { key: "status_endsAt_key", type: IndexType.Key, attributes: ["status", "endsAt"], orders: ['ASC', 'ASC'] });


    // --- BOT QUEUE COLLECTIONS ---
    await createCollection( APPWRITE_DATABASE_ID, REACTION_ROLE_QUEUE_COLLECTION_ID, "Reaction Role Queue", [Permission.create(Role.users())]);
    for (const attr of [ { key: "guildId", type: "string", size: 32, required: true }, { key: "reactionRoleId", type: "string", size: 32, required: true }, ])
      await createAttribute(APPWRITE_DATABASE_ID, REACTION_ROLE_QUEUE_COLLECTION_ID, attr);
    
    await createCollection( APPWRITE_DATABASE_ID, GIVEAWAY_QUEUE_COLLECTION_ID, "Giveaway Queue", [Permission.create(Role.users())]);
    for (const attr of [ { key: "guildId", type: "string", size: 32, required: true }, { key: "giveawayId", type: "string", size: 32, required: true }, ])
      await createAttribute(APPWRITE_DATABASE_ID, GIVEAWAY_QUEUE_COLLECTION_ID, attr);

    await createCollection( APPWRITE_DATABASE_ID, MUSIC_QUEUE_COLLECTION_ID, "Music Queue", [Permission.create(Role.users())]);
     for (const attr of [ { key: "guildId", type: "string", size: 32, required: true }, { key: "songUrl", type: "string", size: 512, required: true }, { key: "requesterId", type: "string", size: 32, required: true }, ])
      await createAttribute(APPWRITE_DATABASE_ID, MUSIC_QUEUE_COLLECTION_ID, attr);

    console.log("\n🎉 Appwrite setup completed successfully!");
  } catch (error) {
    console.error("\n❌ An error occurred during setup:");
    console.error(error);
    process.exit(1);
  }
}

setup();
