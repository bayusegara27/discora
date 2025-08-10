


import React, { useState } from 'react';
import { geminiService } from '../services/gemini';
import { useToast } from '../contexts/ToastContext';

const AiHelperPage: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [contentType, setContentType] = useState('announcement');
  const [generatedContent, setGeneratedContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { addToast } = useToast();
  const [copied, setCopied] = useState(false);


  const getSystemInstruction = () => {
    switch (contentType) {
      case 'announcement':
        return 'You are an expert community manager writing a clear, engaging, and friendly announcement for a Discord server. Use markdown formatting like **bold** and *italics* where appropriate.';
      case 'event_idea':
        return 'You are a creative event planner brainstorming fun and unique event ideas for an online community on Discord. Provide 3 distinct ideas with brief descriptions of each. Format the output nicely with headings.';
      case 'poll':
        return 'You are a Discord admin creating a simple and effective poll question with between 2 and 5 options. Format the response with the question on the first line, and each option prefixed with a regional indicator emoji (e.g., 🇦, 🇧, 🇨).';
      case 'welcome_message':
        return "You are an expert community manager writing a warm, friendly, and engaging welcome message for a new member on a Discord server. Use markdown formatting. Include the placeholder {user} for the user's name. Suggest a couple of channels for them to check out first.";
      default:
        return 'You are a helpful assistant for a Discord community manager.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError('Please enter a topic or instruction.');
      return;
    }
    setError('');
    setLoading(true);
    setGeneratedContent('');
    
    const systemInstruction = getSystemInstruction();
    const fullPrompt = `Task: Write a ${contentType.replace('_', ' ')} for a Discord server about the following topic: "${prompt}".`;
    
    try {
      const result = await geminiService.generateContent(fullPrompt, systemInstruction);
      setGeneratedContent(result);
    } catch (err) {
      console.error("[AiHelperPage] Failed to generate content:", err);
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to generate content: ${message}`);
      addToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCopy = () => {
    if (generatedContent) {
      navigator.clipboard.writeText(generatedContent);
      setCopied(true);
      addToast('Content copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };


  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-text-primary">AI Content Helper</h2>
        <p className="text-text-secondary mt-2">Generate announcements, event ideas, polls, and more for your server.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface p-8 rounded-lg shadow-lg space-y-6">
        <div>
          <label htmlFor="contentType" className="block text-sm font-medium text-text-secondary mb-2">I want to generate a...</label>
          <select
            id="contentType"
            name="contentType"
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
            className="w-full bg-background border border-gray-600 rounded-md p-3 focus:ring-primary focus:border-primary"
          >
            <option value="announcement">📢 Announcement</option>
            <option value="welcome_message">👋 Welcome Message</option>
            <option value="event_idea">🎉 Event Idea</option>
            <option value="poll">📊 Poll Question</option>
          </select>
        </div>
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-text-secondary mb-2">Topic or Instructions</label>
          <textarea
            id="prompt"
            name="prompt"
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
                contentType === 'announcement' ? 'e.g., "a community movie night for this Friday at 8 PM EST"' :
                contentType === 'event_idea' ? 'e.g., "ways to increase server engagement" or "a summer-themed contest"' :
                contentType === 'welcome_message' ? 'e.g., "our server is about retro gaming and anime"' :
                'e.g., "what should be the next game we play together?"'
            }
            className="w-full bg-background border border-gray-600 rounded-md p-3 focus:ring-primary focus:border-primary"
          />
        </div>
        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white font-bold py-3 px-6 rounded-md hover:bg-opacity-80 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              '✨ Generate Content'
            )}
          </button>
        </div>
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      </form>

      {(generatedContent || loading) && (
        <div className="bg-surface p-8 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-text-primary">Generated Content</h3>
            {generatedContent && (
              <button 
                onClick={handleCopy}
                className={`px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 transition-colors ${
                  copied ? 'bg-green-600 text-white' : 'bg-gray-600 hover:bg-gray-500 text-text-primary'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            )}
          </div>
          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-700 rounded w-5/6"></div>
            </div>
          ) : (
            <div className="prose prose-invert bg-background p-4 rounded-md whitespace-pre-wrap font-sans text-text-primary">
              {generatedContent}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AiHelperPage;