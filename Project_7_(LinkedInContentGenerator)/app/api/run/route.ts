import { NextResponse } from 'next/server';
import { runPipeline, pipelineState } from '@/lib/pipeline';

export async function POST() {
  if (pipelineState.isRunning) {
    return NextResponse.json(
      { success: false, message: 'Pipeline is already running' },
      { status: 400 }
    );
  }

  // Trigger pipeline execution in the background asynchronously
  runPipeline().catch((err) => {
    console.error('Asynchronous pipeline execution failed:', err);
  });

  return NextResponse.json({
    success: true,
    message: 'Pipeline triggered successfully',
  });
}
