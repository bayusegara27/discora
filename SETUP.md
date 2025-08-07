# AuraBot Setup Guide

This guide provides step-by-step instructions for setting up the Appwrite backend, configuring the Discord bot, and running the web application.

## 1. Appwrite Project Setup

An Appwrite instance is required. If you do not have one, please follow the [official Appwrite installation guide](https://appwrite.io/docs/installation).

1.  **Create a New Project**
    - In your Appwrite console, click `Create project`.
    - Name it `AuraBot` or a name of your choice. Note the **Project ID** and **API Endpoint** for later use.

2.  **Add a Web Platform for Local Development**
    - Navigate to your project's **Overview** page.
    - Under "Platforms", select `Add a platform` and choose **Web**.
    - Set the hostname to `localhost`. This is required for local development.

3.  **Configure Authentication**
    - Go to the **Auth** section.
    - In the **Settings** tab, ensure that **Email/Password** login is enabled.

4.  **Create a Server-Side API Key**
    - Go to the **API Keys** section.
    - Select `Create API key`.
    - Name it `AuraBot Bot Key` and grant it the following scopes:
        - `databases.read`
        - `databases.write`
        - `documents.read`
        - `documents.write`
    - Create the key and securely copy the **API Key Secret**.

## 2. Local Project Configuration

1.  **Prerequisites**
    - Ensure [Node.js](https://nodejs.org/) (v18 or higher) is installed.

2.  **Create Environment File**
    - In the project's root directory, create a file named `.env`.
    - Add the following content, replacing the placeholder values with your Appwrite and Gemini credentials.

    ```env
    # .env

    # Appwrite credentials for the setup script
    APPWRITE_ENDPOINT="https://[YOUR_APPWRITE_DOMAIN]/v1"
    APPWRITE_PROJECT_ID="YOUR_PROJECT_ID"
    APPWRITE_API_KEY="YOUR_APPWRITE_SERVER_API_KEY_SECRET"

    # Frontend credentials (exposed by Vite)
    VITE_GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
    ```

3.  **Install Dependencies**
    - Open a terminal in the project's root directory and run:
      ```bash
      npm install
      ```

## 3. Automated Database Setup

This project includes a script to automatically configure your Appwrite database.

> **Note:** It is safe to re-run this script after pulling new updates. It is designed to add new collections or attributes without deleting existing data. If you encounter database-related errors after an update, re-running this script should be your first step.

- From the root directory, execute the setup script:
  ```bash
  npm run setup
  ```

## 4. Bot Setup

1.  **Configure Bot Environment**
    - Navigate to the `/bot` directory.
    - Rename `env.example.js` to `env.js`.
    - Open `env.js` and fill in the required credentials.

2.  **Enable Privileged Gateway Intents**
    > **This is a critical step.** The bot will not function correctly without these intents enabled.
    - Go to the [Discord Developer Portal](https://discord.com/developers/applications) and select your bot.
    - Navigate to the **Bot** page.
    - Under the **Privileged Gateway Intents** section, enable all three intents:
        - `PRESENCE INTENT`
        - `SERVER MEMBERS INTENT`
        - `MESSAGE CONTENT INTENT`
    - Save your changes.

3.  **Install Bot Dependencies and Run**
    - From the `/bot` directory, install dependencies:
      ```bash
      npm install
      ```
    - Start the bot:
      ```bash
      node bot.js
      ```

## 5. Running the Frontend Dashboard

1.  **Start the Development Server**
    - Return to the project's **root directory**.
    - Run the development server:
      ```bash
      npm run dev
      ```
2.  **Access the Application**
    - Open the provided `https://localhost:5173` URL in your browser.
    - Your browser will likely show a security warning due to a self-signed SSL certificate. This is expected for local development. Click "Advanced" and proceed to the site.

## 6. Deploying to Appwrite Hosting

Follow these steps to deploy your dashboard to Appwrite's built-in hosting service.

1.  **Build the Project for Production**
    - In your terminal at the project's **root directory**, run the build command:
      ```bash
      npm run build
      ```
    - This command creates an optimized, static version of your site in a new `/dist` folder.

2.  **Package the Build Files**
    - Appwrite Hosting requires the build files to be uploaded in a `.tar.gz` archive.
    - Create this archive using the following commands:
      ```bash
      # Navigate into the build output directory
      cd dist

      # Create the compressed archive. This places 'deployment.tar.gz' in the parent directory.
      tar -czvf ../deployment.tar.gz .

      # Navigate back to the project root
      cd ..
      ```
    - You should now have a `deployment.tar.gz` file in your project's root folder.

3.  **Deploy in the Appwrite Console**
    - Go to your Appwrite Project and navigate to the **Hosting** section.
    - Click **Create Site**.
    - **Upload**: Drag and drop your `deployment.tar.gz` file into the upload area.
    - **Details**: Give your site a name (e.g., `AuraBot Dashboard`).
    - **Settings**:
        - **Framework**: Select `other`.
        - **Build Settings**:
            - **Install command**: Leave this field empty.
            - **Build command**: Leave this field empty.
            - **Output directory**: Set this to `/`. This is very important.
    - **Environment variables**:
        > **This is a critical step for the AI Helper to function.**
        - Click the **+** button to add a new variable.
        - **Key**: `VITE_GEMINI_API_KEY`
        - **Value**: Paste your actual Google Gemini API key here.
    - **Deploy**: Click the **Deploy** button at the bottom of the page.

Appwrite will now provision a domain and deploy your files. Once complete, you can visit the provided URL.

## 7. Final Configuration: Fix "Invalid Origin" Error

> **This is a critical step to allow logins on your live site.** After deploying, you must tell Appwrite to trust your new domain.

1.  Go back to your **Appwrite Console** and open your project.
2.  Navigate to the **Overview** page.
3.  Under "Platforms," you will see the `localhost` platform you added earlier. Click **Add a platform** and select **Web**.
4.  In the **Hostname** field, enter the domain name of your deployed dashboard (e.g., from your screenshot, this would be `discorddashboard.nakumi.my.id`). Do **not** include `https://` or any path.
5.  Click **Next** and **Close**.

Your live dashboard should now be able to log in without the "Invalid Origin" error.

## 8. Final Steps

1.  **Invite Your Bot**: Invite the Discord bot to any servers you wish to manage, granting it `Administrator` permissions.
2.  **Register an Account**: Open the dashboard (either locally or on your new hosting URL) and create a user account.
3.  **Select a Server**: After logging in, use the server switcher in the header to select a server.
4.  **Configure**: Navigate the dashboard to configure settings for the selected server.

Your AuraBot dashboard is now fully operational.