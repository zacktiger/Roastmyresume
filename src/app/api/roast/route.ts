import { NextRequest } from 'next/server';
import { ai, CHAT_MODEL } from '@/lib/gemini';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { fileData, fileType } = await req.json();

    if (!fileData) {
      return new Response(JSON.stringify({ error: 'No resume file data provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Ensure the mime type is supported
    const allowedTypes = ['application/pdf', 'text/plain', 'application/json'];
    if (!allowedTypes.includes(fileType)) {
      return new Response(JSON.stringify({ error: `Unsupported file type: ${fileType}. Please upload a PDF or Text file.` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // System instruction for the roast
    const systemPrompt = `You are the ultimate cynical Tech Recruiter AI. You have reviewed 100,000 generic software engineer resumes today, you are completely caffeinated, and you are ready to roast this resume with brutal honesty, dry humor, and zero sugar-coating.
    
    CRITICAL INSTRUCTIONS:
    1. Read the provided resume document.
    2. Roast the candidate's styling, layout choices, buzzword density, empty metrics, project descriptions, and stack bloat.
    3. Make it hilarious, slightly snarky, but end with actual, highly constructive, and tactical advice on how to fix the resume.
    4. Format your response beautifully in Clean Markdown. Use clear headings, bullet points, and highlight terms in bold or code blocks.
    
    Structure your roast as follows:
    - ## 💥 The Brutal Verdict: A short, punchy summary of what's wrong.
    - ## 🔍 Section-by-Section Roast: Dissect their experience, projects, and education.
    - ## 📊 Metrics & Impact Roast: Highlight fake or missing metrics ("optimized database by 99% using React" type claims).
    - ## 🛠️ Tech Stack Roast: Roast over-bloated stacks or listing CSS and HTML on a senior engineer resume.
    - ## 💡 The Redemption Plan: 3-4 actual, highly specific, and constructive changes that would make this resume good.`;

    let contents;

    if (fileType === 'application/pdf') {
      // For PDF, we pass it as inlineData
      contents = [
        {
          inlineData: {
            data: fileData, // Base64 encoded string
            mimeType: 'application/pdf'
          }
        },
        {
          text: systemPrompt
        }
      ];
    } else {
      // For text or json, we convert to string and pass it as text
      const decodedText = Buffer.from(fileData, 'base64').toString('utf8');
      contents = [
        {
          text: `${systemPrompt}\n\nHere is the resume content:\n${decodedText}`
        }
      ];
    }

    // Request content stream from Gemini
    const responseStream = await ai.models.generateContentStream({
      model: CHAT_MODEL,
      contents: contents,
      config: {
        temperature: 0.8, // Slightly higher temperature for creative humor
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
          console.error('Roast streaming error:', error);
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
    console.error('Roast API Error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
