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
  try {
    await databases.getAttribute(databaseId, collectionId, attribute.key);
    console.log(`   - Attribute '${attribute.key}' already exists. Skipping.`);
  } catch (e) {
    if (e.code === 404) {
      console.log(`   - Creating attribute '${attribute.key}'...`);
      try {
        switch (attribute.type) {
          case "string":
            await databases.createStringAttribute(
              databaseId,
              collectionId,
              attribute.key,
              attribute.size,
              attribute.required,
              attribute.default,
              attribute.array
            );
            break;
          case "boolean":
            await databases.createBooleanAttribute(
              databaseId,
              collectionId,
              attribute.key,
              attribute.required,
              attribute.default,
              attribute.array
            );
            break;
          case "integer":
            await databases.createIntegerAttribute(
              databaseId,
              collectionId,
              attribute.key,
              attribute.required,
              attribute.min,
              attribute.max,
              attribute.default,
              attribute.array
            );
            break;
          default:
            throw new Error(`Unknown attribute type: ${attribute.type}`);
        }
        console.log(`   👍 Attribute '${attribute.key}' created.`);
        await wait(500);
      } catch (creationError) {
        console.error(`   - 💥 FAILED to create attribute '${attribute.key}'.`);
        throw creationError;
      }
    } else {
      throw e;
    }
  }
}

async function createIndex(databaseId, collectionId, index) {
  try {
    await databases.getIndex(databaseId, collectionId, index.key);
    console.log(`   - Index '${index.key}' already exists. Skipping.`);
  } catch (e) {
    if (e.code === 404) {
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
      throw e;
    }
  }
}

async function setup() {
  console.log("🚀 Starting AuraBot Appwrite setup...");
  try {
    try {
      await databases.get(APPWRITE_DATABASE_ID);
      console.log(
        `✅ Database '${APPWRITE_DATABASE_ID}' already exists. Skipping.`
      );
    } catch (error) {
      if (error.code === 404) {
        console.log(`Creating database '${APPWRITE_DATABASE_ID}'...`);
        await databases.create(APPWRITE_DATABASE_ID, "AuraBot DB");
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
    const settingsAttributes = [
      { key: "guildId", type: "string", size: 32, required: true },
      { key: "welcomeMessageEnabled", type: "boolean", required: true },
      { key: "welcomeMessage", type: "string", size: 512, required: true },
      { key: "welcomeChannelId", type: "string", size: 32, required: true },
      { key: "goodbyeMessageEnabled", type: "boolean", required: true },
      { key: "goodbyeMessage", type: "string", size: 512, required: true },
      { key: "goodbyeChannelId", type: "string", size: 32, required: true },
      { key: "autoRoleEnabled", type: "boolean", required: true },
      { key: "autoRoleRoleId", type: "string", size: 32, required: true },
      {
        key: "aiAutoModEnabled",
        type: "boolean",
        required: false,
        default: false,
      },
      {
        key: "levelingEnabled",
        type: "boolean",
        required: false,
        default: true,
      },
      { key: "levelUpChannelId", type: "string", size: 32, required: false },
      {
        key: "levelUpMessage",
        type: "string",
        size: 512,
        required: false,
        default: "🎉 GG {user}, you just reached level **{level}**!",
      },
      {
        key: "levelingRoleRewards",
        type: "string",
        size: 4096,
        required: false,
        default: "[]",
      },
      {
        key: "levelingXpPerMessageMin",
        type: "integer",
        required: false,
        default: 15,
      },
      {
        key: "levelingXpPerMessageMax",
        type: "integer",
        required: false,
        default: 25,
      },
      {
        key: "levelingCooldownSeconds",
        type: "integer",
        required: false,
        default: 60,
      },
      {
        key: "levelingBlacklistedChannels",
        type: "string",
        size: 4096,
        required: false,
        default: "[]",
      },
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
      {
        key: "channels",
        type: "string",
        size: 6000,
        required: false,
        default: "[]",
      },
      {
        key: "roles",
        type: "string",
        size: 6000,
        required: false,
        default: "[]",
      },
    ];
    for (const attr of metadataAttributes)
      await createAttribute(
        APPWRITE_DATABASE_ID,
        SERVER_METADATA_COLLECTION_ID,
        attr
      );
    await createIndex(APPWRITE_DATABASE_ID, SERVER_METADATA_COLLECTION_ID, {
      key: "guildId_unique",
      type: IndexType.Unique,
      attributes: ["guildId"],
    });

    await createCollection(
      APPWRITE_DATABASE_ID,
      YOUTUBE_SUBSCRIPTIONS_COLLECTION_ID,
      "YouTube Subscriptions",
      [
        Permission.create(Role.users()),
        Permission.read(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ]
    );
    const youtubeAttributes = [
      { key: "guildId", type: "string", size: 32, required: true },
      { key: "youtubeChannelId", type: "string", size: 64, required: true },
      { key: "youtubeChannelName", type: "string", size: 128, required: false },
      { key: "discordChannelId", type: "string", size: 32, required: true },
      { key: "discordChannelName", type: "string", size: 128, required: false },
      { key: "mentionRoleId", type: "string", size: 32, required: false },
      { key: "customMessage", type: "string", size: 1024, required: false },
      { key: "liveMessage", type: "string", size: 1024, required: false },
      { key: "lastVideoTimestamp", type: "string", size: 64, required: false },
      { key: "latestVideoId", type: "string", size: 64, required: false },
      { key: "latestVideoTitle", type: "string", size: 256, required: false },
    ];
    for (const attr of youtubeAttributes)
      await createAttribute(
        APPWRITE_DATABASE_ID,
        YOUTUBE_SUBSCRIPTIONS_COLLECTION_ID,
        attr
      );
    await createIndex(
      APPWRITE_DATABASE_ID,
      YOUTUBE_SUBSCRIPTIONS_COLLECTION_ID,
      {
        key: "guildId_key",
        type: IndexType.Key,
        attributes: ["guildId"],
        orders: ["ASC"],
      }
    );

    await createCollection(
      APPWRITE_DATABASE_ID,
      CUSTOM_COMMANDS_COLLECTION_ID,
      "Custom Commands",
      [
        Permission.create(Role.users()),
        Permission.read(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ]
    );
    for (const attr of [
      { key: "guildId", type: "string", size: 32, required: true },
      { key: "command", type: "string", size: 64, required: true },
      { key: "response", type: "string", size: 2000, required: true },
    ])
      await createAttribute(
        APPWRITE_DATABASE_ID,
        CUSTOM_COMMANDS_COLLECTION_ID,
        attr
      );
    await createIndex(APPWRITE_DATABASE_ID, CUSTOM_COMMANDS_COLLECTION_ID, {
      key: "guildId_command_unique",
      type: IndexType.Unique,
      attributes: ["guildId", "command"],
      orders: ["ASC", "ASC"],
    });

    await createCollection(
      APPWRITE_DATABASE_ID,
      AUDIT_LOGS_COLLECTION_ID,
      "Audit Logs",
      [Permission.read(Role.users())]
    );
    for (const attr of [
      { key: "guildId", type: "string", size: 32, required: true },
      { key: "type", type: "string", size: 64, required: true },
      { key: "user", type: "string", size: 64, required: true },
      { key: "userId", type: "string", size: 32, required: true },
      { key: "userAvatarUrl", type: "string", size: 256, required: false },
      { key: "content", type: "string", size: 2000, required: true },
      { key: "timestamp", type: "string", size: 64, required: true },
    ])
      await createAttribute(
        APPWRITE_DATABASE_ID,
        AUDIT_LOGS_COLLECTION_ID,
        attr
      );
    await createIndex(APPWRITE_DATABASE_ID, AUDIT_LOGS_COLLECTION_ID, {
      key: "guildId_timestamp",
      type: IndexType.Key,
      attributes: ["guildId", "timestamp"],
      orders: ["ASC", "DESC"],
    });

    await createCollection(
      APPWRITE_DATABASE_ID,
      COMMAND_LOGS_COLLECTION_ID,
      "Command Logs",
      [Permission.read(Role.users())]
    );
    for (const attr of [
      { key: "guildId", type: "string", size: 32, required: true },
      { key: "command", type: "string", size: 64, required: true },
      { key: "user", type: "string", size: 64, required: true },
      { key: "userId", type: "string", size: 32, required: true },
      { key: "userAvatarUrl", type: "string", size: 256, required: false },
      { key: "timestamp", type: "string", size: 64, required: true },
    ])
      await createAttribute(
        APPWRITE_DATABASE_ID,
        COMMAND_LOGS_COLLECTION_ID,
        attr
      );
    await createIndex(APPWRITE_DATABASE_ID, COMMAND_LOGS_COLLECTION_ID, {
      key: "guildId_timestamp",
      type: IndexType.Key,
      attributes: ["guildId", "timestamp"],
      orders: ["ASC", "DESC"],
    });

    await createCollection(
      APPWRITE_DATABASE_ID,
      STATS_COLLECTION_ID,
      "Server Stats",
      [
        Permission.create(Role.users()),
        Permission.read(Role.users()),
        Permission.update(Role.users()),
      ]
    );
    for (const attr of [
      { key: "doc_id", type: "string", size: 32, required: true },
      { key: "guildId", type: "string", size: 32, required: true },
      { key: "memberCount", type: "integer", required: false, default: 0 },
      { key: "onlineCount", type: "integer", required: false, default: 0 },
      { key: "messagesToday", type: "integer", required: false, default: 0 },
      { key: "commandCount", type: "integer", required: false, default: 0 },
      {
        key: "messagesWeekly",
        type: "string",
        size: 1000,
        required: false,
        default: "[]",
      },
    ])
      await createAttribute(APPWRITE_DATABASE_ID, STATS_COLLECTION_ID, attr);
    await createIndex(APPWRITE_DATABASE_ID, STATS_COLLECTION_ID, {
      key: "guildId_docId_unique",
      type: IndexType.Unique,
      attributes: ["guildId", "doc_id"],
      orders: ["ASC", "ASC"],
    });

    await createCollection(
      APPWRITE_DATABASE_ID,
      BOT_INFO_COLLECTION_ID,
      "Bot Info",
      [Permission.read(Role.any())]
    );
    for (const attr of [
      { key: "name", type: "string", size: 128, required: true },
      { key: "avatarUrl", type: "string", size: 256, required: false },
    ])
      await createAttribute(APPWRITE_DATABASE_ID, BOT_INFO_COLLECTION_ID, attr);

    await createCollection(
      APPWRITE_DATABASE_ID,
      SYSTEM_STATUS_COLLECTION_ID,
      "System Status",
      [Permission.read(Role.any())]
    );
    for (const attr of [
      { key: "lastSeen", type: "string", size: 64, required: true },
    ])
      await createAttribute(
        APPWRITE_DATABASE_ID,
        SYSTEM_STATUS_COLLECTION_ID,
        attr
      );

    await createCollection(
      APPWRITE_DATABASE_ID,
      USER_LEVELS_COLLECTION_ID,
      "User Levels",
      [Permission.read(Role.users())]
    );
    for (const attr of [
      { key: "guildId", type: "string", size: 32, required: true },
      { key: "userId", type: "string", size: 32, required: true },
      { key: "username", type: "string", size: 128, required: true },
      { key: "userAvatarUrl", type: "string", size: 256, required: false },
      { key: "level", type: "integer", required: false, default: 0 },
      { key: "xp", type: "integer", required: false, default: 0 },
    ])
      await createAttribute(
        APPWRITE_DATABASE_ID,
        USER_LEVELS_COLLECTION_ID,
        attr
      );
    await createIndex(APPWRITE_DATABASE_ID, USER_LEVELS_COLLECTION_ID, {
      key: "guildId_userId_unique",
      type: IndexType.Unique,
      attributes: ["guildId", "userId"],
    });
    await createIndex(APPWRITE_DATABASE_ID, USER_LEVELS_COLLECTION_ID, {
      key: "guildId_xp_level",
      type: IndexType.Key,
      attributes: ["guildId", "level", "xp"],
      orders: ["ASC", "DESC", "DESC"],
    });

    await createCollection(
      APPWRITE_DATABASE_ID,
      MODERATION_QUEUE_COLLECTION_ID,
      "Moderation Queue",
      [Permission.create(Role.users()), Permission.read(Role.users())]
    );
    for (const attr of [
      { key: "guildId", type: "string", size: 32, required: true },
      { key: "targetUserId", type: "string", size: 32, required: true },
      { key: "targetUsername", type: "string", size: 128, required: true },
      { key: "actionType", type: "string", size: 16, required: true },
      { key: "reason", type: "string", size: 512, required: false },
      { key: "initiatorId", type: "string", size: 64, required: true },
    ])
      await createAttribute(
        APPWRITE_DATABASE_ID,
        MODERATION_QUEUE_COLLECTION_ID,
        attr
      );

    await createCollection(
      APPWRITE_DATABASE_ID,
      MEMBERS_COLLECTION_ID,
      "Members",
      [Permission.read(Role.users())]
    );
    for (const attr of [
      { key: "guildId", type: "string", size: 32, required: true },
      { key: "userId", type: "string", size: 32, required: true },
      { key: "username", type: "string", size: 128, required: true },
      { key: "userAvatarUrl", type: "string", size: 256, required: false },
      { key: "joinedAt", type: "string", size: 64, required: true },
    ])
      await createAttribute(APPWRITE_DATABASE_ID, MEMBERS_COLLECTION_ID, attr);
    await createIndex(APPWRITE_DATABASE_ID, MEMBERS_COLLECTION_ID, {
      key: "guildId_userId_unique",
      type: IndexType.Unique,
      attributes: ["guildId", "userId"],
    });
    await createIndex(APPWRITE_DATABASE_ID, MEMBERS_COLLECTION_ID, {
      key: "guildId_username_search",
      type: IndexType.Fulltext,
      attributes: ["username"],
    });

    console.log("\n🎉 Appwrite setup completed successfully!");
  } catch (error) {
    console.error("\n❌ An error occurred during setup:");
    console.error(error);
    process.exit(1);
  }
}

setup();
