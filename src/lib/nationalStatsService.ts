import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

export interface NationalStats {
  annualFatalities: number;
  reportYear: number;
  sourceUrl: string;
  fetchedAt: string;
}

export interface NationalStatsResponse extends NationalStats {
  dailyAverage: number;
}

const DEFAULT_STATS: NationalStats = {
  annualFatalities: 168491,
  reportYear: 2022,
  sourceUrl: 'https://morth.nic.in',
  fetchedAt: new Date().toISOString(),
};

function getCacheFilePath(): string {
  return path.join(process.cwd(), 'src', 'data', 'national_stats_cache.json');
}

function validateStats(data: any): data is NationalStats {
  return (
    data &&
    typeof data.annualFatalities === 'number' &&
    data.annualFatalities >= 50000 &&
    data.annualFatalities <= 500000 &&
    typeof data.reportYear === 'number' &&
    data.reportYear >= 2015 &&
    typeof data.sourceUrl === 'string' &&
    data.sourceUrl.length > 0
  );
}

export function getNationalStats(): NationalStats {
  try {
    const filePath = getCacheFilePath();
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      if (validateStats(data)) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Error reading national stats cache, returning fallback default:', err);
  }
  return DEFAULT_STATS;
}

export async function refreshNationalStats(): Promise<NationalStats> {
  const currentStats = getNationalStats();
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_AI_KEY;

  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not set. Maintaining existing cached national stats.');
    return currentStats;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelsToTry = [
      'gemini-3.5-flash',
      'gemini-3.6-flash',
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-flash-latest',
    ];
    let responseText: string | null = null;
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          tools: [{ googleSearch: {} }] as any,
        });

        const prompt = `Find the latest Ministry of Road Transport and Highways (MoRTH) "Road Accidents in India" annual report's total casualty/fatality figure.
Search specifically for MoRTH official statistics.
Return ONLY strict JSON matching this exact structure:
{"annualFatalities": <number>, "reportYear": <number>, "sourceUrl": "<url>"}`;

        const result = await model.generateContent(prompt);
        responseText = result.response.text();
        if (responseText) break;
      } catch (e: any) {
        lastError = e;
        console.warn(`Model ${modelName} grounded search attempt failed:`, e?.message || e);
      }
    }

    if (!responseText) {
      throw lastError || new Error('All Gemini models failed to generate response');
    }

    // Clean markdown formatting if present
    const clean = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const jsonStart = clean.indexOf('{');
    const jsonEnd = clean.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error(`Response did not contain JSON object: ${responseText}`);
    }

    const parsed = JSON.parse(clean.substring(jsonStart, jsonEnd + 1));
    const annualFatalities = Number(parsed.annualFatalities);
    const reportYear = Number(parsed.reportYear);
    const sourceUrl = String(parsed.sourceUrl || 'https://morth.nic.in');

    if (
      isNaN(annualFatalities) ||
      annualFatalities < 50000 ||
      annualFatalities > 500000 ||
      isNaN(reportYear) ||
      reportYear < 2015
    ) {
      throw new Error(
        `Implausible national stats rejected: annualFatalities=${annualFatalities}, reportYear=${reportYear}`
      );
    }

    const updatedStats: NationalStats = {
      annualFatalities,
      reportYear,
      sourceUrl,
      fetchedAt: new Date().toISOString(),
    };

    const filePath = getCacheFilePath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(updatedStats, null, 2), 'utf-8');

    return updatedStats;
  } catch (error) {
    console.error('Failed to refresh national stats from Gemini Grounded Search:', error);
    // Retain previous cache on failure
    return currentStats;
  }
}
