import { NextResponse } from 'next/server';
import { excelManager } from '@/lib/excelManager';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rows = await excelManager.readRows();
    // Return newest first
    const sorted = [...rows].reverse();
    return NextResponse.json(sorted);
  } catch (error: any) {
    console.error('Failed to get calendar:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to retrieve calendar' },
      { status: 500 }
    );
  }
}
