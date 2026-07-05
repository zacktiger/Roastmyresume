import { GoogleGenAI } from '@google/genai';

if (!process.env.GEMINI_API_KEY) {
  console.warn('Warning: GEMINI_API_KEY is not defined in the environment variables.');
}

// Initialize the Google Gen AI SDK client.
// By default, it will use process.env.GEMINI_API_KEY.
export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

// We'll use the recommended models:
// - 'text-embedding-004' for generating embeddings.
// - 'gemini-2.5-flash' for chat completion and streaming answers.
export const EMBEDDING_MODEL = 'text-embedding-004';
export const CHAT_MODEL = 'gemini-2.5-flash';
