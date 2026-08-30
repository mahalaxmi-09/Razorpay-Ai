import dotenv from 'dotenv';
dotenv.config();

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

export const openaiService = {
  getModel: () => MODEL,
  hasApiKey: () => !!process.env.OPENAI_API_KEY,
  // Helper interface reserved for Phase 3 schema-validated outputs
  createChatCompletion: async (messages, responseSchema) => {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured in environment.');
    }
    // Future integration placeholder
    return null;
  }
};
