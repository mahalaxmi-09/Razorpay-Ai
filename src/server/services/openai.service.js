import dotenv from 'dotenv';
dotenv.config();

/**
 * OpenAI Client Interface
 * 
 * Safely wraps OpenAI chat completions with structured JSON validation.
 * Falls back gracefully if no API key is present.
 */

const API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

export const openaiService = {
  isConfigured: () => {
    return Boolean(API_KEY && API_KEY.startsWith('sk-') && API_KEY !== 'sk-proj-mockApiKey');
  },

  getModel: () => MODEL,

  chatCompletion: async (messages, options = {}) => {
    if (!openaiService.isConfigured()) {
      return null;
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: MODEL,
          messages,
          temperature: options.temperature ?? 0.2,
          response_format: options.response_format || { type: 'json_object' }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`OpenAI request failed (${response.status}):`, errorText);
        return null;
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || null;
    } catch (error) {
      console.error('openaiService.chatCompletion network error:', error.message);
      return null;
    }
  }
};
