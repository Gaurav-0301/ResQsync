import { NextResponse } from 'next/server';
import { getVerifiedCases } from '@/lib/incidentCasesService';

export async function GET() {
  const data = getVerifiedCases();
  return NextResponse.json(data);
}
