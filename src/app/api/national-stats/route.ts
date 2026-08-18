import { NextResponse } from 'next/server';
import { getNationalStats } from '@/lib/nationalStatsService';

export async function GET() {
  const stats = getNationalStats();
  const dailyAverage = stats.annualFatalities / 365;

  return NextResponse.json({
    ...stats,
    dailyAverage,
  });
}
