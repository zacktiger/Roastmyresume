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
// - 'gemini-embedding-2' for generating embeddings.
// - 'gemini-2.5-flash' for chat completion and streaming answers.
export const EMBEDDING_MODEL = 'gemini-embedding-2';
export const CHAT_MODEL = 'gemini-2.5-flash';
