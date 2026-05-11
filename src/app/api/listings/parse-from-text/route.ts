import { NextResponse } from 'next/server';

const GEMINI_REST_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

function getGeminiApiKey(): string {
  return String(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
}

function getGeminiModel(): string {
  return String(process.env.GEMINI_MODEL || '').trim() || 'gemini-2.0-flash-lite';
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
  const prompt = `You are an expert real estate data extractor.

The input below may be in ANY format: a spreadsheet row, tab-separated or pipe-separated data,
CSV, plain prose, a WhatsApp message, agent notes, a JSON blob, or any other mix of structured
and unstructured text. Your job is to understand whatever format is given and extract property
listing fields from it.

Extract the following fields wherever present:
- title (string): a descriptive property title
- price (number): listing price in Naira, as a plain number without currency symbols or commas
- location (string): city, area, or address
- bedrooms (number)
- bathrooms (number)
- description (string): a brief property description
- size (string): floor area or plot size, e.g. "400 SQM" or "3 plots"
- amenities (array of strings): list of features/amenities
- property_type (string): e.g. Apartment, Detached House, Land, Duplex, etc.
- listing_type (string): "sale" or "rent"
- year_built (number): year the property was built, if mentioned

If a value cannot be found in the input, omit that key entirely.
Return ONLY a valid JSON object with these fields — no explanation, no markdown.

Input:
${text}`;

  const result = await geminiGenerateContent({
    model: getGeminiModel(),
    userText: prompt,
    maxOutputTokens: 2048,
  });

  if (!result.ok) {
    throw new Error(`Gemini returned an error (HTTP ${result.status}). Try again shortly.`);
  }

  // Strip any markdown fences Gemini might wrap around the JSON
  const cleaned = result.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  return JSON.parse(cleaned);
}

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const parsedData = await runParse(text.trim());
    return NextResponse.json(parsedData);
  } catch (error) {
    console.error('Error parsing property data:', error);
    const msg = error instanceof Error ? error.message : 'Failed to parse property data';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
