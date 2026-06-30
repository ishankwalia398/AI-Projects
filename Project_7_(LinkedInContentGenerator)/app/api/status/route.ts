import { NextResponse } from 'next/server';
import { pipelineState } from '@/lib/pipeline';
import { checkApiKeyHealth } from '@/lib/agents';
import { getNextRunTime } from '@/lib/scheduler';
import { excelManager } from '@/lib/excelManager';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const apiKeyHealth = await checkApiKeyHealth();
    const stats = excelManager.getFileStats();

    return NextResponse.json({
      isRunning: pipelineState.isRunning,
      currentStep: pipelineState.currentStep,
      lastRunTime: pipelineState.lastRunTime || 'N/A',
      nextRunTime: getNextRunTime(),
      apiKeyHealth,
      excelFile: stats,
    });
  } catch (error: any) {
    console.error('Failed to retrieve status:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to retrieve system status' },
      { status: 500 }
    );
  }
}
