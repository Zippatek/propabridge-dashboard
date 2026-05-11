// app/api/listings/parse-from-text/route.ts
import { NextResponse } from 'next/server';

const GEMINI_REST_BASE = 'https://generativelanguage.googleapis.com/v1/models';

function getGeminiApiKey(): string {
  return String(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
}

function geminiResponseText(respJson: {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
}): string {
  const parts = respJson?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts.map(p => (p && typeof p.text === 'string' ? p.text : '')).join('').trim();
}

async function geminiGenerateContent({
  model,
  userText,
  maxOutputTokens,
}: {
  model: string;
  userText: string;
  maxOutputTokens: number;
}): Promise<
  | { ok: true; text: string }
  | { ok: false; status: number; bodyText: string; error?: string }
> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return { ok: false, status: 0, bodyText: '', error: 'no_api_key' };
  }
  const url = `${GEMINI_REST_BASE}/${encodeURIComponent(model)}:generateContent`;
  const body = {
    contents: [{ role: 'user', parts: [{ text: userText }] }],
    generationConfig: {
      maxOutputTokens,
      responseMimeType: 'application/json',
    },
  };
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(body),
    });
    const bodyText = await res.text().catch(() => '');
    if (!res.ok) {
      return { ok: false, status: res.status, bodyText };
    }
    let json: unknown;
    try {
      json = JSON.parse(bodyText);
    } catch {
      return { ok: false, status: res.status, bodyText: 'Invalid JSON from Gemini' };
    }
    const text = geminiResponseText(json as Parameters<typeof geminiResponseText>[0]);
    if (!text) {
      return { ok: false, status: res.status, bodyText: bodyText.slice(0, 400) };
    }
    return { ok: true, text };
  } catch (e) {
    const err = e as Error;
    return { ok: false, status: 0, bodyText: err.message || String(e) };
  }
}

async function runParse(text: string) {
    const prompt = `
      You are an expert real estate data extractor. Parse the following property description
      and return a structured JSON object with the following fields:
      - title (string)
      - price (number)
      - location (string)
      - bedrooms (number)
      - bathrooms (number)
      - description (string)
      - size (string, e.g., "400 SQM")
      - amenities (array of strings)
      If a value is not found, omit the key. The price should be a number, without currency symbols or commas.
      Text to parse: "${text}"
      JSON response:
    `;

    const result = await geminiGenerateContent({
        model: 'gemini-1.5-flash-latest',
        userText: prompt,
        maxOutputTokens: 2048,
    });

    if (!result.ok) {
        throw new Error('Failed to parse text with Gemini.');
    }
    
    // Strip markdown fences
    const cleanedText = result.text.replace(/```json\n|```/g, '');
    return JSON.parse(cleanedText);
}



export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const parsedData = await runParse(text);
    return NextResponse.json(parsedData);

  } catch (error) {
    console.error('Error parsing property data:', error);
    return NextResponse.json({ error: 'Failed to parse property data' }, { status: 500 });
  }
}
