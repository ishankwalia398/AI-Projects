import { NextResponse } from 'next/server';
import { excelManager } from '@/lib/excelManager';
import { getTodayDateString } from '@/lib/agents';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rows = await excelManager.readRows();
    const today = getTodayDateString();
    const todayRow = rows.find((r) => r.date === today) || null;
    return NextResponse.json(todayRow);
  } catch (error: any) {
    console.error('Failed to get today row:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to retrieve today content' },
      { status: 500 }
    );
  }
}
