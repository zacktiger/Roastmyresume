import { NextRequest } from 'next/server';
import { ai, CHAT_MODEL } from '@/lib/gemini';
import { queryVectorDb } from '@/lib/vectorDb';

export const runtime = 'nodejs'; // Node.js environment is required for file system reads

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid or empty messages array' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get the latest user message content to query the vector database
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    const queryText = lastUserMessage ? lastUserMessage.content : '';

    // Retrieve relevant chunks (top 4 for solid coverage)
    const contextChunks = await queryVectorDb(queryText, 4);
    const contextText = contextChunks
      .map((chunk, index) => `[Context Chunk ${index + 1}] (${chunk.source}):\n${chunk.text}`)
      .join('\n\n');

    // System prompt with strict guardrails
    const systemInstruction = `You are the AI Resume Assistant for Kshitij. Your sole purpose is to answer recruiter questions about Kshitij's background, projects, skills, education, and experience based strictly on his actual resume.

Hard Guardrails (DO NOT BEND OR BREAK):
1. Base your answers ONLY on the provided grounding context below.
2. If the context does not contain enough information to answer a question, or if you are asked about skills, projects, or claims NOT listed in the context, you MUST refuse to fabricate. Instead, respond with: "I apologize, but I do not have information about that in Kshitij's resume. You can reach out to Kshitij directly at your.email@example.com to discuss this further!"
3. Under no circumstances should you fabricate projects, work history, skills, credentials, or metrics.
4. Keep your answers concise, direct, professional, and formatted in clean markdown.

Grounding Resume Context:
-------------------------
${contextText}
-------------------------`;

    // Map message history into Gemini's Content format
    // Roles: 'user' and 'model'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contents: any[] = [];

    // Add previous conversation context. We skip the very last message if it's the user's current query,
    // because we will append that along with the system instruction or as the final user message.
    for (let i = 0; i < messages.length - 1; i++) {
      const msg = messages[i];
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }

    // Append the last message which includes the current query combined with our system instruction
    const currentQuery = lastUserMessage?.content || '';
    contents.push({
      role: 'user',
      parts: [
        {
          text: `${systemInstruction}\n\nUser Question: ${currentQuery}`,
        },
      ],
    });

    // Request content stream from Gemini
    const responseStream = await ai.models.generateContentStream({
      model: CHAT_MODEL,
      contents: contents,
      // We can also configure generation parameters if needed
      config: {
        temperature: 0.1, // Low temperature to prevent hallucinations
      }
    });

    // Create a Web ReadableStream to send Server-Sent Events (SSE)
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of responseStream) {
            const text = chunk.text;
            if (text) {
              const data = JSON.stringify({ text });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }
        } catch (error) {
          console.error('Streaming error:', error);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Streaming interrupted' })}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
