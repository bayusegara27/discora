import { GoogleGenAI } from "@google/genai";

// The API key is injected by the Vite build process.
// It reads `VITE_GEMINI_API_KEY` from your .env file.
// See vite.config.ts for the `define` configuration.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn(
    "Gemini API key not found. AI Helper will not work. Please set the VITE_GEMINI_API_KEY environment variable in your .env file and restart the dev server."
  );
}

// Only initialize the client if the key exists.
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

export const geminiService = {
  /**
   * Generates content using the Gemini model.
   * @param {string} prompt - The user's prompt.
   * @param {string} systemInstruction - A system instruction to guide the model's behavior.
   * @returns {Promise<string>} The generated text.
   */
  generateContent: async (
    prompt: string,
    systemInstruction: string
  ): Promise<string> => {
    if (!ai) {
      return "Error: Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file and restart the server.";
    }

    try {
      // Use 'gemini-2.5-flash' for general text tasks and low latency
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
        },
      });

      return response.text ?? "";
    } catch (error) {
      console.error("Gemini API call failed:", error);
      if (error instanceof Error) {
        return `Error generating content: ${error.message}`;
      }
      return "An unknown error occurred while generating content.";
    }
  },
};
