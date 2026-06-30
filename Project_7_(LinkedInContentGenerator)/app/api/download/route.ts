import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'content_calendar.xlsx');
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Spreadsheet file does not exist yet.' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    return new Response(fileBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="content_calendar.xlsx"',
      },
    });
  } catch (error: any) {
    console.error('Download API failed:', error);
    return NextResponse.json({ error: 'Failed to download spreadsheet file' }, { status: 500 });
  }
}
