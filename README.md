# AuraBot Dashboard

Welcome to the AuraBot Dashboard, a comprehensive web interface to manage and configure your AuraBot Discord bot. This dashboard allows you to control settings, view analytics, manage moderation logs, and leverage AI to create engaging content for your community.

This project consists of two main parts:
1.  **Frontend:** A React-based web dashboard built with Vite, TypeScript, and Tailwind CSS.
2.  **Backend Bot:** A Node.js Discord bot powered by `discord.js`.

The two parts communicate via a self-hosted Appwrite database, which acts as the single source of truth for all configurations, logs, and statistics.

## ✨ Features

- **📊 Live Dashboard:** View real-time server statistics, including member counts and message activity.
- **⚙️ Server Settings:** Easily configure welcome/goodbye messages and auto-role functionality.
- **📝 Custom Commands:** Create, edit, and delete custom text commands for your bot.
- **📜 Audit & Command Logs:** View detailed logs for server events (joins, leaves, deleted messages) and command usage.
- **▶️ YouTube Notifications:** Automatically announce new video uploads from a specified YouTube channel.
- **🤖 AI Content Helper:** Use the Gemini API to generate announcements, event ideas, and polls for your server.
- **🔐 Secure Authentication:** A full login/register system powered by Appwrite Authentication ensures only authorized users can access the dashboard.
- **🚀 Self-Hosted:** Full control over your data by running on your own Appwrite instance.
- **⚡ Modern Tech:** Built with Vite for a fast and efficient development experience.

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Recharts
- **Bot:** Node.js, Discord.js, node-cron
- **Backend & Database:** Appwrite (self-hosted)
- **AI:** Google Gemini API

## 🚀 Getting Started

To get the AuraBot Dashboard up and running, you need to set up your Appwrite instance, configure the bot, and run both the frontend and the bot.

**For detailed, step-by-step instructions, please see the [SETUP.md](./SETUP.md) file.** This guide contains all the necessary steps to configure the backend, install dependencies, and run both the bot and the frontend server correctly.
