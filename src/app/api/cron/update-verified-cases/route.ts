import { NextResponse } from 'next/server';
import { refreshVerifiedCases } from '@/lib/incidentCasesService';

export async function GET() {
  try {
    const updated = await refreshVerifiedCases();
    return NextResponse.json({
      success: true,
      message: 'Verified incident cases and congestion points refresh processed',
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to refresh verified cases',
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
