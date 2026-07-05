import { NextRequest } from 'next/server';
import { ai, CHAT_MODEL } from '@/lib/gemini';
import { Type } from '@google/genai';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { bulletText } = await req.json();

    if (!bulletText || typeof bulletText !== 'string' || !bulletText.trim()) {
      return new Response(JSON.stringify({ error: 'No bullet point text provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const trimmedBullet = bulletText.trim();

    // Construct the prompt for Gemini
    const prompt = `You are a critical, elite technical recruiter who has reviewed 10,000 resumes. Evaluate this single resume bullet point and grade it on a scale of 0 to 100.
    
    Grading Rubric:
    - 0-30: Absolutely terrible. No metrics, weak action verbs (e.g. "helped", "responsible for"), lists generic duties.
    - 31-60: Average/Meh. Has tech stack details but lacks quantitative impact, or uses clichés (e.g., "highly motivated", "synergy").
    - 61-80: Good. Has active verbs, specific stack details, and attempts to show results.
    - 81-100: Exceptional. Strong action verbs, specific technologies, and clear, quantitative business/technical impact (e.g. "reduced latency by 35%", "saved $12k/yr").
    
    Candidate's Bullet Point:
    "${trimmedBullet}"
    
    Provide your evaluation in structured JSON format according to the requested schema. Make your recruiterComment cynical, humorous, and recruiter-like, yet constructive.`;

    // Request structured JSON content from Gemini
    const response = await ai.models.generateContent({
      model: CHAT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { 
              type: Type.INTEGER,
              description: 'Quality score from 0 to 100'
            },
            recruiterComment: { 
              type: Type.STRING,
              description: 'A humorous, cynical recruiter comment about the bullet point'
            },
            improvements: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of 2-3 specific, actionable improvements the candidate should make to raise the score'
            }
          },
          required: ['score', 'recruiterComment', 'improvements']
        },
        temperature: 0.7,
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Empty response received from Gemini API');
    }

    // Parse the structured JSON response
    const parsedData = JSON.parse(responseText);

    return new Response(JSON.stringify(parsedData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Evaluation API Error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
