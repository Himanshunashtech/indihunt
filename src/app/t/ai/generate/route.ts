import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';
import { getCachedData, setCachedData } from '@/lib/redis';

export const dynamic = 'force-dynamic';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return apiFailure('Prompt is required', 400);
    }

    // Check Redis cache for identical prompt (saves duplicate Gemini calls and token quota)
    const promptHash = crypto.createHash('md5').update(prompt.trim()).digest('hex');
    const cacheKey = `ai_gen_${promptHash}`;
    const cached = await getCachedData<{ text: string }>(cacheKey);
    if (cached && cached.text) {
      return apiSuccessSecure(cached);
    }

    if (!GEMINI_API_KEY) {
      return apiFailure('Gemini API key not configured', 500);
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!res.ok) {
      return apiFailure('Failed to generate text from AI', 500);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || null;

    if (text) {
      // Cache generated AI text for 7 days
      setCachedData(cacheKey, { text }, 7 * 24 * 60 * 60).catch(() => {});
    }

    return apiSuccessSecure({ text });
  } catch (error: any) {
    return apiFailure(error?.message || 'AI generation failed', 500);
  }
}
