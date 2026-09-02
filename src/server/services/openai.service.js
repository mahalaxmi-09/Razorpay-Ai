import dotenv from 'dotenv';
dotenv.config();
import OpenAI from 'openai';

/**
 * OpenAI Client Interface
 * 
 * Safely initializes OpenAI SDK with environment credentials.
 * Never exposes secrets in logs or responses.
 */

const API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

let openaiClient = null;

if (API_KEY && API_KEY.startsWith('sk-') && API_KEY !== 'sk-proj-mockApiKey' && API_KEY !== 'YOUR_OPENAI_API_KEY') {
  try {
    openaiClient = new OpenAI({ apiKey: API_KEY });
  } catch (err) {
    console.warn('OpenAI SDK initialization error:', err.message);
  }
}

export const openaiService = {
  isConfigured: () => {
    return Boolean(openaiClient !== null);
  },

  getModel: () => MODEL,

  chatCompletion: async (messages, options = {}) => {
    if (!openaiService.isConfigured()) {
      return null;
    }

    try {
      const completion = await openaiClient.chat.completions.create({
        model: MODEL,
        messages,
        temperature: options.temperature ?? 0.2,
        response_format: options.response_format || { type: 'json_object' }
      });

      return completion.choices?.[0]?.message?.content || null;
    } catch (error) {
      console.warn('OpenAI API call failed, falling back to deterministic engine:', error.message);
      return null;
    }
  }
};
