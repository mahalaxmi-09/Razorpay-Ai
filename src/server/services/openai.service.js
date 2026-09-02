import dotenv from 'dotenv';
dotenv.config();
import OpenAI from 'openai';

/**
 * OpenAI Client Interface
 * 
 * Safely initializes OpenAI SDK with environment credentials.
 * Never exposes secrets in logs or responses.
 */

let cachedClient = null;
let lastKey = null;

const getClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !apiKey.startsWith('sk-') || apiKey === 'sk-proj-mockApiKey' || apiKey === 'YOUR_OPENAI_API_KEY') {
    return null;
  }
  if (cachedClient && lastKey === apiKey) {
    return cachedClient;
  }
  try {
    cachedClient = new OpenAI({ apiKey });
    lastKey = apiKey;
    return cachedClient;
  } catch (err) {
    console.warn('OpenAI SDK initialization error:', err.message);
    return null;
  }
};

export const openaiService = {
  isConfigured: () => {
    return Boolean(getClient() !== null);
  },

  getModel: () => process.env.OPENAI_MODEL || 'gpt-4o',

  chatCompletion: async (messages, options = {}) => {
    const client = getClient();
    if (!client) {
      return null;
    }

    try {
      const payload = {
        model: openaiService.getModel(),
        messages,
        temperature: options.temperature ?? 0.2
      };

      if (options.response_format) {
        payload.response_format = options.response_format;
      }

      const completion = await client.chat.completions.create(payload);
      return completion.choices?.[0]?.message?.content || null;
    } catch (error) {
      console.warn('OpenAI API call failed, falling back to deterministic engine:', error.message);
      return null;
    }
  }
};
