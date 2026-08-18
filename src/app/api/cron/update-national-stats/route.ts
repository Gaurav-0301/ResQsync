import { NextResponse } from 'next/server';
import { refreshNationalStats } from '@/lib/nationalStatsService';

export async function GET() {
  try {
    const updatedStats = await refreshNationalStats();
    const dailyAverage = updatedStats.annualFatalities / 365;

    return NextResponse.json({
      success: true,
      message: 'National stats refresh processed',
      data: {
        ...updatedStats,
        dailyAverage,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to refresh national stats',
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
