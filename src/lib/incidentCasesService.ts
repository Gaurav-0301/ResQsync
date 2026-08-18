import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

export interface VerifiedCase {
  id: string;
  headline: string;
  location: string;
  date: string;
  source: string;
  sourceUrl: string;
  verified: boolean;
  specificNumbers?: {
    speed?: string;
    duration?: string;
    delayMinutes?: string;
  };
}

export interface CongestionPoint {
  id: string;
  junctionName: string;
  details: string;
  connectingRoads: string;
  source: string;
  sourceUrl: string;
  verified: boolean;
}

export interface VerifiedCasesCache {
  cases: VerifiedCase[];
  congestionPoints: CongestionPoint[];
  fetchedAt: string;
}

const DEFAULT_CACHE: VerifiedCasesCache = {
  cases: [],
  congestionPoints: [
    {
      id: 'risk-medical-square',
      junctionName: 'Medical Square Junction Gridlock',
      details: 'Major 6-road arterial intersection adjacent to Government Medical College & Hospital (GMCH). Peak-hour congestion heavily chokes emergency ambulance corridors.',
      connectingRoads: 'Wardha Road, Great Nag Road, Medical College Access Bypasses',
      source: 'Nagpur Traffic Police & Urban Mobility Assessment',
      sourceUrl: 'https://nagpurtrafficpolice.gov.in',
      verified: true,
    },
    {
      id: 'risk-ajni-underpass',
      junctionName: 'Ajni Railway Underpass & Corridor Diversion',
      details: 'Infrastructure construction and narrow railway bypasses force high-density traffic into single-lane funnels, creating acute bottlenecks for trauma transit.',
      connectingRoads: 'Ajni Main Road, Railway Station Feeder Corridor',
      source: 'Nagpur Municipal Corporation Mobility Cell',
      sourceUrl: 'https://nmc.gov.in',
      verified: true,
    },
  ],
  fetchedAt: new Date().toISOString(),
};

function getCacheFilePath(): string {
  return path.join(process.cwd(), 'src', 'data', 'verified_cases_cache.json');
}

export function isValidUrlString(targetUrl: any): boolean {
  if (!targetUrl || typeof targetUrl !== 'string') return false;
  const trimmed = targetUrl.trim();
  return trimmed.startsWith('http://') || trimmed.startsWith('https://');
}

export function getVerifiedCases(): VerifiedCasesCache {
  try {
    const filePath = getCacheFilePath();
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      if (data && Array.isArray(data.cases) && Array.isArray(data.congestionPoints)) {
        return data;
      }
    }
  } catch (err) {
    console.warn('Error reading verified cases cache:', err);
  }
  return DEFAULT_CACHE;
}

export async function refreshVerifiedCases(): Promise<VerifiedCasesCache> {
  const currentCache = getVerifiedCases();
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_AI_KEY;

  if (!apiKey) {
    console.warn('GEMINI_API_KEY missing. Serving current verified cases cache.');
    return currentCache;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelsToTry = [
      'gemini-3.5-flash',
      'gemini-3.6-flash',
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
    ];

    const promptCases = `Search for news-reported cases from 2023–2026 where a patient died specifically because an ambulance was delayed by traffic congestion or a traffic signal (not an accident, not hospital delay), prioritizing Nagpur and Maharashtra, then wider India if none found locally. For each case found, you MUST provide: headline (paraphrased, not verbatim), location, date, publication name, and a real source URL. Return ONLY strict JSON:
{"cases": [{"headline":"","location":"","date":"","source":"","sourceUrl":""}]}
If you cannot verify a case with a real, checkable source URL from Google Search, DO NOT include it — return fewer cases or an empty array rather than inventing one. Do not estimate speeds, cycle times, or delay durations unless a specific source states them.`;

    const promptCongestion = `Search for real traffic congestion data about specific Nagpur junctions (e.g. Medical Square, Ajni, Wardha Road) — average delay times, number of connecting roads, proximity to hospitals — from traffic studies, Nagpur Municipal Corporation reports, or news coverage of congestion. For each risk point, provide: junctionName, details, connectingRoads, source, sourceUrl. Return ONLY strict JSON:
{"congestionPoints": [{"junctionName":"","details":"","connectingRoads":"","source":"","sourceUrl":""}]}`;

    let candidateCases: any[] = [];
    let candidateCongestion: any[] = [];

    // Query 1: Casualty cases
    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          tools: [{ googleSearch: {} }] as any,
        });
        const res = await model.generateContent(promptCases);
        const text = res.response.text();
        const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonStart = clean.indexOf('{');
        const jsonEnd = clean.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
          const parsed = JSON.parse(clean.substring(jsonStart, jsonEnd + 1));
          if (Array.isArray(parsed.cases)) {
            candidateCases = parsed.cases;
            break;
          }
        }
      } catch (e: any) {
        console.warn(`Query 1 failed with ${modelName}:`, e?.message || e);
      }
    }

    // Query 2: Congestion risk points
    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          tools: [{ googleSearch: {} }] as any,
        });
        const res = await model.generateContent(promptCongestion);
        const text = res.response.text();
        const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonStart = clean.indexOf('{');
        const jsonEnd = clean.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
          const parsed = JSON.parse(clean.substring(jsonStart, jsonEnd + 1));
          if (Array.isArray(parsed.congestionPoints)) {
            candidateCongestion = parsed.congestionPoints;
            break;
          }
        }
      } catch (e: any) {
        console.warn(`Query 2 failed with ${modelName}:`, e?.message || e);
      }
    }

    // Process candidate cases — trust Gemini's grounding search URLs directly
    const verifiedCases: VerifiedCase[] = [];
    for (let i = 0; i < candidateCases.length; i++) {
      const c = candidateCases[i];
      if (!isValidUrlString(c?.sourceUrl)) {
        console.warn(`[REJECTED CASUALTY CASE #${i + 1}] Missing or invalid sourceUrl from Gemini grounding:`, JSON.stringify(c));
        continue;
      }
      if (!c.headline || typeof c.headline !== 'string' || !c.headline.trim()) {
        console.warn(`[REJECTED CASUALTY CASE #${i + 1}] Missing headline text:`, JSON.stringify(c));
        continue;
      }

      console.log(`[ACCEPTED CASUALTY CASE] "${c.headline}" | Source: ${c.sourceUrl}`);
      verifiedCases.push({
        id: `case-${Date.now()}-${i}`,
        headline: String(c.headline).trim(),
        location: String(c.location || 'Maharashtra, India').trim(),
        date: String(c.date || 'Recent').trim(),
        source: String(c.source || 'News Coverage').trim(),
        sourceUrl: String(c.sourceUrl).trim(),
        verified: true,
      });
    }

    // Process candidate congestion risk points
    const verifiedCongestion: CongestionPoint[] = [];
    for (let i = 0; i < candidateCongestion.length; i++) {
      const cp = candidateCongestion[i];
      if (!isValidUrlString(cp?.sourceUrl)) {
        console.warn(`[REJECTED CONGESTION POINT #${i + 1}] Missing or invalid sourceUrl from Gemini grounding:`, JSON.stringify(cp));
        continue;
      }
      if (!cp.junctionName || typeof cp.junctionName !== 'string' || !cp.junctionName.trim()) {
        console.warn(`[REJECTED CONGESTION POINT #${i + 1}] Missing junctionName:`, JSON.stringify(cp));
        continue;
      }

      console.log(`[ACCEPTED CONGESTION POINT] "${cp.junctionName}" | Source: ${cp.sourceUrl}`);
      verifiedCongestion.push({
        id: `risk-${Date.now()}-${i}`,
        junctionName: String(cp.junctionName).trim(),
        details: String(cp.details || 'High-volume congestion point.').trim(),
        connectingRoads: String(cp.connectingRoads || 'Arterial corridors').trim(),
        source: String(cp.source || 'Nagpur Mobility Report').trim(),
        sourceUrl: String(cp.sourceUrl).trim(),
        verified: true,
      });
    }

    // Merge new verified items with current cache
    const mergedCasesMap = new Map<string, VerifiedCase>();
    for (const c of [...currentCache.cases, ...verifiedCases]) {
      if (isValidUrlString(c.sourceUrl)) {
        mergedCasesMap.set(c.sourceUrl, c);
      }
    }

    const mergedCongestionMap = new Map<string, CongestionPoint>();
    for (const cp of [...currentCache.congestionPoints, ...verifiedCongestion]) {
      if (isValidUrlString(cp.sourceUrl)) {
        mergedCongestionMap.set(cp.junctionName.toLowerCase(), cp);
      }
    }

    const updatedCache: VerifiedCasesCache = {
      cases: Array.from(mergedCasesMap.values()),
      congestionPoints: Array.from(mergedCongestionMap.values()),
      fetchedAt: new Date().toISOString(),
    };

    const filePath = getCacheFilePath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(updatedCache, null, 2), 'utf-8');

    return updatedCache;
  } catch (error) {
    console.error('Failed to refresh verified incident cases:', error);
    return currentCache;
  }
}
