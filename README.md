# AuraBot Dashboard

AuraBot Dashboard is a comprehensive web interface for managing the AuraBot Discord bot. It provides server administrators with a powerful set of tools to configure settings, monitor activity, and generate content, all from a clean and intuitive user interface.

The project is built on a modern technology stack, connecting a React-based frontend with a Node.js bot through a self-hosted Appwrite backend. This architecture ensures real-time updates and gives you full ownership of your data.

## Key Features

- **Centralized Dashboard**: View real-time server statistics, including member counts, online status, and recent message activity.
- **Server Configuration**: Easily manage settings for welcome/goodbye messages, automatic role assignments, and the server-wide leveling system.
- **Content & Engagement Tools**:
    - **Custom Commands**: Create, edit, and delete custom text commands.
    - **YouTube Notifications**: Automatically announce new video uploads from specified YouTube channels.
    - **AI Content Helper**: Leverage the Google Gemini API to generate announcements, event ideas, and polls.
- **Moderation & Logging**:
    - **Audit & Command Logs**: Access detailed logs for moderation actions, server events, and command usage.
    - **Member Management**: Browse and search server members with options for moderation actions.
    - **AI Auto-Moderation**: Automatically flag and remove messages containing spam or toxic content.
- **Secure & Self-Hosted**: Features a complete authentication system and operates on your own Appwrite instance, ensuring your data remains private and secure.

## Technology Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Recharts
- **Bot**: Node.js, Discord.js, node-cron
- **Backend & Database**: Appwrite (Self-Hosted)
- **AI Services**: Google Gemini API

## Getting Started

To set up the AuraBot Dashboard, you will need to configure the Appwrite backend, set up the Discord bot, and run the frontend application.

**For a complete, step-by-step guide, please refer to the [SETUP.md](./SETUP.md) file.** It contains all the necessary instructions to get the project running.
