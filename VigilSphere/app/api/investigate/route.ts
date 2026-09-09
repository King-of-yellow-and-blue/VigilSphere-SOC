import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { log_text } = body;

    if (!log_text) {
      return NextResponse.json({ error: 'Missing log_text' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are an elite SOC Analyst. Review the following security log and provide an investigation summary.
    
Log: "${log_text}"

You MUST return ONLY valid, raw JSON matching exactly this schema, with no markdown code fences or extra text:
{
  "explanation": "A concise explanation of what this log means.",
  "predicted_next_move": "What the attacker might do next based on this activity.",
  "remediation_script": "A short command or script to mitigate this specific threat."
}`;

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    
    // Defensively parse JSON
    text = text.trim();
    if (text.startsWith('```json')) {
      text = text.substring(7);
    } else if (text.startsWith('```')) {
      text = text.substring(3);
    }
    if (text.endsWith('```')) {
      text = text.substring(0, text.length - 3);
    }
    text = text.trim();

    const parsedData = JSON.parse(text);

    return NextResponse.json(parsedData, { status: 200 });
  } catch (error: unknown) {
    console.error('Gemini API Error:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to analyze log' }, { status: 500 });
  }
}
