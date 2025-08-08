# Discora Setup Guide

Welcome! This guide will walk you through setting up the entire Discora ecosystem: the Appwrite backend, the Discord bot, and the web dashboard. Follow these steps carefully, and you'll be managing your server like a pro.

## Prerequisites

Before you begin, make sure you have the following ready:

1.  **Node.js**: Version 18 or higher. You can download it from [nodejs.org](https://nodejs.org/).
2.  **An Appwrite Instance**: This project requires a self-hosted Appwrite server. If you don't have one, follow the [official Appwrite installation guide](https://appwrite.io/docs/installation).
3.  **A Discord Bot Application**: Create a new application and bot account on the [Discord Developer Portal](https://discord.com/developers/applications). You will need the **Bot Token**.
4.  **Google Gemini API Key**: Required for AI-powered features. You can get a free key from [Google AI Studio](https://aistudio.google.com/app/apikey).

---

## Part 1: Setting Up the Appwrite Backend

This is the foundation of your dashboard. We'll create the project and run a script to automatically set up the database.

1.  **Create an Appwrite Project**
    - In your Appwrite console, click `Create project`.
    - Name it **Discora** and take note of the **Project ID** and **API Endpoint URL**.

2.  **Add a Web Platform**
    > **CRITICAL STEP:** This step is required to prevent browser errors (CORS).
    - In your Appwrite project, navigate to the **Platforms** section from the sidebar.
    - Click `Add Platform` and choose `New Web App`.
    - Give it a name, e.g., "Discora Dashboard".
    - For the **Hostname**, enter `localhost`. Appwrite treats this as a special value, and you don't need to specify the port.
    - Click `Create`. This step tells Appwrite to accept requests from your local development server.

3.  **Create a Server-Side API Key**
    - Go to the **API Keys** section.
    - Select `Create API key`, name it `Discora Bot Key`, and grant it these scopes:
        - `databases.read`
        - `databases.write`
        - `documents.read`
        - `documents.write`
    - Create the key and **securely copy the API Key Secret**. This is a server key and should be kept private.

4.  **Configure Local Environment for Setup**
    - In the project's root directory, create a file named `.env`.
    - Add the following, filling in the details from the steps above:

    ```env
    # .env - For the automated setup script

    APPWRITE_ENDPOINT="https://[YOUR_APPWRITE_DOMAIN]/v1"
    APPWRITE_PROJECT_ID="YOUR_PROJECT_ID"
    APPWRITE_API_KEY="YOUR_APPWRITE_SERVER_API_KEY_SECRET"
    ```

5.  **Install Root Dependencies**
    - In your terminal, at the project root, run:
      ```bash
      npm install
      ```

6.  **Run the Automated Database Setup**
    > **Note:** This script is safe to run multiple times. If you update the project and encounter database errors, running this script again is the first thing you should do. It adds new collections and attributes without deleting your data.
    - In the project root, execute the script:
      ```bash
      npm run setup
      ```
    - The script will create all necessary databases and collections for you.

---

## Part 2: Configuring the Discora Bot

Now, let's get the bot itself ready to connect to Discord and Appwrite.

1.  **Configure Bot Environment**
    - Navigate to the `/bot` directory.
    - Rename `env.example.js` to `env.js`.
    - Open `env.js` and fill in all the required credentials (Discord Bot Token, Appwrite details, and your Gemini API key).

2.  **Enable Privileged Gateway Intents**
    > **CRITICAL STEP:** The bot will not function correctly without these intents.
    - Go to the [Discord Developer Portal](https://discord.com/developers/applications) and select your bot.
    - Navigate to the **"Bot"** page.
    - Under the **"Privileged Gateway Intents"** section, enable all three toggles:
        - ✅ `PRESENCE INTENT`
        - ✅ `SERVER MEMBERS INTENT`
        - ✅ `MESSAGE CONTENT INTENT`
    - Save your changes.

3.  **Install Bot Dependencies and Run**
    - In a **new terminal window**, navigate to the `/bot` directory:
      ```bash
      cd bot
      npm install
      ```
    - Start the bot:
      ```bash
      node bot.js
      ```
    - If successful, you'll see a "✅ Logged in as..." message, and the bot will appear online in Discord. Keep this terminal window running.

---

## Part 3: Running the Dashboard Locally

Finally, let's run the web interface.

1.  **Configure Frontend Environment**
    - In the project's **root directory**, open the `.env` file you created earlier.
    - Add your Gemini API key so the frontend can access it:

    ```env
    # .env - Add this line

    VITE_GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
    ```
    *(Note: The other Appwrite keys are for the setup script and are not needed by the live frontend.)*

2.  **Start the Development Server**
    - In your **first terminal window** (the one at the project root), run:
      ```bash
      npm run dev
      ```

3.  **Access the Dashboard**
    - Open the `https://localhost:5173` URL in your browser.
    - Your browser will likely show a security warning for the self-signed SSL certificate. This is normal. Click "Advanced" and proceed to the site.

---

## Part 4: Final Steps & First Use

1.  **Invite Your Bot**: Use the "OAuth2 URL Generator" in the Discord Developer Portal to create an invite link. Select the `bot` and `applications.commands` scopes, and grant it **Administrator** permissions. Invite it to any server you want to manage.
2.  **Create an Account**: On the dashboard login page, click "Sign up" to register your administrator account.
3.  **Select a Server**: Once logged in, use the server switcher in the header to select your server.
4.  **Start Configuring**: You're all set! Explore the sidebar to configure settings, create custom commands, and manage your community.